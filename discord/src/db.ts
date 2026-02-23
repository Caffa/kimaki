// Prisma client initialization with libsql adapter.
// Connects via the in-process Hrana server when running (bot process),
// or falls back to direct file: access (CLI subcommands).
// The getHranaUrl() check determines which mode is active.

import fs from 'node:fs'
import path from 'node:path'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient, Prisma } from './generated/client.js'
import { getDataDir } from './config.js'
import { createLogger, formatErrorWithStack, LogPrefix } from './logger.js'
import { fileURLToPath } from 'node:url'
import { getHranaUrl } from './hrana-server.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export type { Prisma }
export { PrismaClient }

const dbLogger = createLogger(LogPrefix.DB)

let prismaInstance: PrismaClient | null = null
let initPromise: Promise<PrismaClient> | null = null

/**
 * Get the singleton Prisma client instance.
 * Initializes the database on first call, running schema setup if needed.
 */
export function getPrisma(): Promise<PrismaClient> {
  if (prismaInstance) {
    return Promise.resolve(prismaInstance)
  }
  if (initPromise) {
    return initPromise
  }
  initPromise = initializePrisma()
  return initPromise
}

/**
 * Build the libsql connection URL.
 * Uses the Hrana HTTP endpoint when the server is running (bot process),
 * otherwise falls back to direct file: access (CLI subcommands).
 */
function getDbUrl(): string {
  const url = getHranaUrl()
  if (url) return url

  // Fallback: direct file access for CLI subcommands that don't start the server
  const dataDir = getDataDir()
  const dbPath = path.join(dataDir, 'discord-sessions.db')
  return `file:${dbPath}`
}

async function initializePrisma(): Promise<PrismaClient> {
  const dbUrl = getDbUrl()
  const isFileMode = dbUrl.startsWith('file:')

  if (isFileMode) {
    // Ensure data directory exists for file mode
    const dataDir = getDataDir()
    try {
      fs.mkdirSync(dataDir, { recursive: true })
    } catch (e) {
      dbLogger.error(
        `Failed to create data directory ${dataDir}:`,
        (e as Error).message,
      )
    }
  }

  dbLogger.log(`Opening database via: ${dbUrl}`)

  const adapter = new PrismaLibSql({ url: dbUrl })

  const prisma = new PrismaClient({ adapter })

  try {
    if (isFileMode) {
      // PRAGMAs only apply to direct file connections.
      // The hrana server manages WAL mode and timeouts on the server side.
      await prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL')
      await prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000')
    }

    // Always run migrations - schema.sql uses IF NOT EXISTS so it's idempotent
    dbLogger.log('Running schema migrations...')
    await migrateSchema(prisma)
    dbLogger.log('Schema migration complete')
  } catch (error) {
    dbLogger.error('Prisma init failed:', formatErrorWithStack(error))
    throw error
  }

  prismaInstance = prisma
  return prisma
}

async function migrateSchema(prisma: PrismaClient): Promise<void> {
  const schemaPath = path.join(__dirname, '../src/schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf-8')
  const statements = sql
    .split(';')
    .map((s) =>
      s
        .split('\n')
        .filter((line) => !line.trimStart().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter(
      (s) =>
        s.length > 0 &&
        !/^CREATE\s+TABLE\s+["']?sqlite_sequence["']?\s*\(/i.test(s),
    )
    // Make CREATE INDEX idempotent
    .map((s) =>
      s
        .replace(
          /^CREATE\s+UNIQUE\s+INDEX\b(?!\s+IF)/i,
          'CREATE UNIQUE INDEX IF NOT EXISTS',
        )
        .replace(/^CREATE\s+INDEX\b(?!\s+IF)/i, 'CREATE INDEX IF NOT EXISTS'),
    )
  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement)
  }

  // Migration: add variant column to model tables (for thinking/reasoning level).
  // ALTERs throw if column already exists, so each is wrapped in try/catch.
  const alterStatements = [
    'ALTER TABLE channel_models ADD COLUMN variant TEXT',
    'ALTER TABLE session_models ADD COLUMN variant TEXT',
    'ALTER TABLE global_models ADD COLUMN variant TEXT',
  ]
  for (const stmt of alterStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt)
    } catch {
      // Column already exists – expected on subsequent runs
    }
  }

  // Migration: move session_thinking data into session_models.variant.
  // session_thinking table is left in place (not dropped) so older kimaki versions
  // that still reference it won't crash on the same database.
  try {
    // For sessions that already have a model row, copy the thinking value
    await prisma.$executeRawUnsafe(`
      UPDATE session_models SET variant = (
        SELECT thinking_value FROM session_thinking
        WHERE session_thinking.session_id = session_models.session_id
      ) WHERE variant IS NULL AND EXISTS (
        SELECT 1 FROM session_thinking WHERE session_thinking.session_id = session_models.session_id
      )
    `)
  } catch {
    // session_thinking table may not exist in fresh installs
  }
}

/**
 * Close the Prisma connection.
 */
export async function closePrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect()
    prismaInstance = null
    initPromise = null
    dbLogger.log('Prisma connection closed')
  }
}
