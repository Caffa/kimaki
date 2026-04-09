// Pi agent session discovery utility.
// Scans ~/.pi/agent/sessions/ to find project directories that have active Pi agent sessions.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { createLogger, LogPrefix } from './logger.js'

const PI_AGENT_SESSIONS_DIR = path.join(os.homedir(), '.pi', 'agent', 'sessions')
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

const logger = createLogger(LogPrefix.PI_SESSIONS)

// Cache for Pi agent project directories
let cachedProjectDirs: Set<string> | null = null
let cacheTimestamp: number = 0

/**
 * Parse the first line of a .jsonl file to extract the cwd (project directory).
 * The first line is typically a session init object with a 'cwd' field.
 */
function parseSessionCwd(jsonlPath: string): string | null {
  try {
    const fd = fs.openSync(jsonlPath, 'r')
    try {
      const buffer = Buffer.alloc(8192)
      const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0)
      const content = buffer.toString('utf8', 0, bytesRead)
      const firstLine = content.split('\n')[0]
      if (!firstLine) return null

      const parsed = JSON.parse(firstLine)
      return parsed.cwd || null
    } finally {
      fs.closeSync(fd)
    }
  } catch {
    return null
  }
}

/**
 * Get all .jsonl files in a directory sorted by modification time (newest first).
 */
function getJsonlFilesSorted(sessionDir: string): string[] {
  try {
    const files = fs.readdirSync(sessionDir)
    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'))
    if (jsonlFiles.length === 0) return []

    // Sort by mtime, newest first
    return jsonlFiles
      .map((f) => ({
        name: f,
        path: path.join(sessionDir, f),
        mtime: fs.statSync(path.join(sessionDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime)
      .map((f) => f.path)
  } catch {
    return []
  }
}

/**
 * List all project directories that have Pi agent sessions.
 * Scans ~/.pi/agent/sessions/ and extracts cwd from session files.
 *
 * Results are cached for 5 minutes to avoid repeated filesystem scans.
 */
export async function getPiAgentProjectDirectories(): Promise<Set<string>> {
  const now = Date.now()

  // Return cached result if still valid
  if (cachedProjectDirs !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedProjectDirs
  }

  const projectDirs = new Set<string>()

  if (!fs.existsSync(PI_AGENT_SESSIONS_DIR)) {
    cachedProjectDirs = projectDirs
    cacheTimestamp = now
    return projectDirs
  }

  try {
    const entries = fs.readdirSync(PI_AGENT_SESSIONS_DIR, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const sessionDir = path.join(PI_AGENT_SESSIONS_DIR, entry.name)

      // Skip hidden directories
      if (entry.name.startsWith('.')) continue

      try {
        const files = fs.readdirSync(sessionDir)
        if (files.length === 0) continue

        // Find a .jsonl file to read the cwd from - prefer newest files
        const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'))
        if (jsonlFiles.length === 0) continue

        // Sort jsonl files by mtime, newest first
        const sortedJsonlPaths = getJsonlFilesSorted(sessionDir)

        for (const jsonlPath of sortedJsonlPaths) {
          const projectPath = parseSessionCwd(jsonlPath)
          if (projectPath) {
            // Verify the directory still exists
            if (fs.existsSync(projectPath)) {
              projectDirs.add(projectPath)
            }
            break // Found valid cwd, no need to check other files
          }
        }
      } catch (err) {
        // Skip directories we can't read
        logger.warn(`[PI-SESSIONS] Could not read session dir ${sessionDir}:`, err)
      }
    }
  } catch (err) {
    logger.error('[PI-SESSIONS] Error scanning Pi agent sessions:', err)
  }

  cachedProjectDirs = projectDirs
  cacheTimestamp = now

  logger.log(`[PI-SESSIONS] Found ${projectDirs.size} Pi agent project directories`)

  return projectDirs
}

/**
 * Invalidate the cache, forcing a fresh scan on next call.
 */
export function invalidatePiAgentCache(): void {
  cachedProjectDirs = null
  cacheTimestamp = 0
}

/**
 * Get the modification time of the most recent session file for a project directory.
 * Returns null if no session found.
 */
export function getLatestSessionTime(projectDirectory: string): number | null {
  if (!fs.existsSync(PI_AGENT_SESSIONS_DIR)) {
    return null
  }

  try {
    const entries = fs.readdirSync(PI_AGENT_SESSIONS_DIR, { withFileTypes: true })

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name.startsWith('.')) continue

      const sessionDir = path.join(PI_AGENT_SESSIONS_DIR, entry.name)
      const sortedJsonlPaths = getJsonlFilesSorted(sessionDir)

      for (const jsonlPath of sortedJsonlPaths) {
        const cwd = parseSessionCwd(jsonlPath)
        if (cwd === projectDirectory) {
          const stat = fs.statSync(jsonlPath)
          return stat.mtime.getTime()
        }
      }
    }
  } catch {
    // Ignore errors
  }

  return null
}