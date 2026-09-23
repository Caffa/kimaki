// Persist the live service auth token to the opencode secrets directory so
// scheduled launchd jobs can read it without depending on the kimaki database.
// Writes are atomic, permissions are restrictive (0o600), and errors are
// swallowed to avoid breaking bot startup.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createLogger, LogPrefix } from './logger.js'

const logger = createLogger(LogPrefix.CLI)

const TOKEN_FILE_NAME = 'kimaki_db_auth_token'

function getTokenFilePath(): string {
  return path.join(os.homedir(), '.config', 'opencode', 'secrets', TOKEN_FILE_NAME)
}

/**
 * Write the service auth token to `~/.config/opencode/secrets/kimaki_db_auth_token`.
 *
 * - Creates parent directories recursively.
 * - Skips the write if the file already contains the same token.
 * - Writes atomically via a temp file in the same directory, then renames.
 * - Sets 0o600 permissions on both the temp file and the final file.
 * - Swallows errors and logs a warning without printing the token.
 */
export async function writeServiceAuthTokenFile(token: string): Promise<void> {
  try {
    const filePath = getTokenFilePath()
    const secretsDir = path.dirname(filePath)

    fs.mkdirSync(secretsDir, { recursive: true, mode: 0o700 })

    const existing = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, 'utf-8')
      : null
    if (existing === token) {
      // Content is unchanged; make sure permissions are still 0o600 in case
      // something external touched the file.
      fs.chmodSync(filePath, 0o600)
      return
    }

    const tempPath = path.join(
      secretsDir,
      `.${TOKEN_FILE_NAME}.${process.pid}.${Date.now()}.tmp`,
    )

    fs.writeFileSync(tempPath, token, { mode: 0o600 })
    fs.renameSync(tempPath, filePath)
    fs.chmodSync(filePath, 0o600)
  } catch (error) {
    logger.warn('Failed to persist service auth token to opencode secrets file:',
      error instanceof Error ? error.message : String(error),
    )
  }
}
