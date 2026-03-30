// /restart command - Rebuild the local kimaki and restart the bot.
// Runs pnpm build in the kimaki source directory, then spawns a new process.

import type { CommandContext } from './types.js'
import { SILENT_MESSAGE_FLAGS } from '../discord-utils.js'
import { createLogger, LogPrefix } from '../logger.js'
import { getCurrentVersion } from '../upgrade.js'
import { spawn, execSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'

const logger = createLogger(LogPrefix.CLI)

// Get the kimaki source directory (where package.json is)
function getKimakiSourceDir(): string {
  const require = createRequire(import.meta.url)
  const pkgPath = require.resolve('../package.json')
  return path.dirname(pkgPath)
}

export async function handleRestartCommand({
  command,
}: CommandContext): Promise<void> {
  await command.deferReply({ flags: SILENT_MESSAGE_FLAGS })

  logger.log('[RESTART] /restart triggered')

  try {
    const currentVersion = getCurrentVersion()
    const sourceDir = getKimakiSourceDir()
    const distCliPath = path.join(sourceDir, 'dist', 'cli.js')

    await command.editReply({
      content: `Rebuilding kimaki **v${currentVersion}** (local variant)...\nSource: \`${sourceDir}\``,
    })

    // Run pnpm build in the kimaki source directory
    logger.log(`[RESTART] Running pnpm build in ${sourceDir}`)
    try {
      const buildOutput = execSync('pnpm build', {
        cwd: sourceDir,
        encoding: 'utf-8',
        timeout: 120_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      })
      logger.debug(`[RESTART] Build output: ${buildOutput.slice(0, 500)}`)
    } catch (buildError) {
      const errorMsg = buildError instanceof Error ? buildError.message : String(buildError)
      logger.error('[RESTART] Build failed:', errorMsg)
      await command.editReply({
        content: `Build failed: \`\`\`\n${errorMsg.slice(0, 1900)}\n\`\`\``,
      })
      return
    }

    await command.editReply({
      content: `Build complete. Restarting bot...`,
    })

    // Spawn a new kimaki process using the local build
    // The new process will kill the old one on startup (kimaki's single-instance lock)
    // Use node to run dist/cli.js directly instead of relying on global kimaki
    const child = spawn('node', [distCliPath, ...process.argv.slice(2)], {
      shell: false,
      stdio: 'ignore',
      detached: true,
      cwd: sourceDir,
    })
    child.unref()
    logger.debug(`Started new kimaki process: node ${distCliPath}`)
  } catch (error) {
    logger.error('[RESTART] Failed:', error)
    await command.editReply({
      content: `Restart failed: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}