// Config commands for managing user preferences.
import { goke } from 'goke'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'
import { createLogger, LogPrefix } from '../logger.js'
import { loadUserConfig, saveUserConfig } from '../user-config.js'
import { getDataDir } from '../config.js'

const cliLogger = createLogger(LogPrefix.CLI)
const cli = goke()

cli
  .command('config get <key>', 'Get a config value')
  .action(async (key: string) => {
    try {
      const config = loadUserConfig()
      if (key === 'projectsDir') {
        if (config.projectsDir) {
          console.log(config.projectsDir)
        } else {
          console.log('(not set)')
        }
      } else if (key === 'defaultGuildId') {
        if (config.defaultGuildId) {
          console.log(config.defaultGuildId)
        } else {
          console.log('(not set)')
        }
      } else {
        cliLogger.error(`Unknown config key: ${key}`)
        console.log(`Unknown config key: ${key}`)
        console.log('Available keys: projectsDir, defaultGuildId')
        process.exit(1)
      }
    } catch (error) {
      cliLogger.error(
        'Error:',
        error instanceof Error ? error.stack : String(error),
      )
      process.exit(1)
    }
  })

cli
  .command('config set <key> <value>', 'Set a config value and persist it')
  .action(async (key: string, value: string) => {
    try {
      if (key === 'projectsDir') {
        const resolvedPath = path.resolve(value)

        // Validate the path exists or can be created
        if (!fs.existsSync(resolvedPath)) {
          try {
            fs.mkdirSync(resolvedPath, { recursive: true })
            cliLogger.log(`Created directory: ${resolvedPath}`)
          } catch (error) {
            cliLogger.error(
              `Failed to create directory: ${resolvedPath}`,
              error instanceof Error ? error.message : String(error),
            )
            console.log(`Error: Failed to create directory: ${resolvedPath}`)
            process.exit(1)
          }
        }

        // Save to config
        const current = loadUserConfig()
        const updated = { ...current, projectsDir: resolvedPath }
        saveUserConfig(updated)
        cliLogger.log(`Set projectsDir to: ${resolvedPath}`)
        console.log(`Set projectsDir to: ${resolvedPath}`)
      } else if (key === 'defaultGuildId') {
        // Validate guild ID format (snowflake)
        if (!/^\d+$/.test(value)) {
          cliLogger.error('Invalid guild ID. Must be a numeric snowflake.')
          console.log('Error: Invalid guild ID. Must be a numeric snowflake.')
          process.exit(1)
        }

        const current = loadUserConfig()
        const updated = { ...current, defaultGuildId: value }
        saveUserConfig(updated)
        cliLogger.log(`Set defaultGuildId to: ${value}`)
        console.log(`Set defaultGuildId to: ${value}`)
      } else {
        cliLogger.error(`Unknown config key: ${key}`)
        console.log(`Unknown config key: ${key}`)
        console.log('Available keys: projectsDir, defaultGuildId')
        process.exit(1)
      }
    } catch (error) {
      cliLogger.error(
        'Error:',
        error instanceof Error ? error.stack : String(error),
      )
      process.exit(1)
    }
  })

cli
  .command('config list', 'List all config values')
  .action(async () => {
    try {
      const config = loadUserConfig()
      const configPath = path.join(getDataDir(), 'config.json')

      console.log(`Config file: ${configPath}`)
      console.log('')
      console.log('Current values:')
      if (config.projectsDir) {
        console.log(`  projectsDir: ${config.projectsDir}`)
      } else {
        console.log('  projectsDir: (not set)')
      }

      if (config.defaultGuildId) {
        console.log(`  defaultGuildId: ${config.defaultGuildId}`)
      } else {
        console.log('  defaultGuildId: (not set)')
      }

      // Show effective projects directory
      const localProjectsDir = path.join(os.homedir(), 'Local-Projects-2026')
      if (fs.existsSync(localProjectsDir)) {
        console.log(`  (effective default projectsDir: ${localProjectsDir})`)
      } else {
        console.log(`  (effective default projectsDir: ${path.join(getDataDir(), 'projects')})`)
      }
    } catch (error) {
      cliLogger.error(
        'Error:',
        error instanceof Error ? error.stack : String(error),
      )
      process.exit(1)
    }
  })

cli
  .command('config unset <key>', 'Remove a config value (revert to default)')
  .action(async (key: string) => {
    try {
      if (key === 'projectsDir') {
        const config = loadUserConfig()
        if (config.projectsDir) {
          const updated = { ...config }
          delete updated.projectsDir
          saveUserConfig(updated)
          cliLogger.log(`Removed projectsDir from config`)
          console.log('Removed projectsDir from config. Will use default.')
        } else {
          console.log('projectsDir was not set.')
        }
      } else if (key === 'defaultGuildId') {
        const config = loadUserConfig()
        if (config.defaultGuildId) {
          const updated = { ...config }
          delete updated.defaultGuildId
          saveUserConfig(updated)
          cliLogger.log(`Removed defaultGuildId from config`)
          console.log('Removed defaultGuildId from config. Will auto-detect guild.')
        } else {
          console.log('defaultGuildId was not set.')
        }
      } else {
        cliLogger.error(`Unknown config key: ${key}`)
        console.log(`Unknown config key: ${key}`)
        console.log('Available keys: projectsDir, defaultGuildId')
        process.exit(1)
      }
    } catch (error) {
      cliLogger.error(
        'Error:',
        error instanceof Error ? error.stack : String(error),
      )
      process.exit(1)
    }
  })

export default cli