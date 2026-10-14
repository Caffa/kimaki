// User configuration persistence: <dataDir>/config.json (V1 fork parity).
// Holds preferences that survive restarts, like the default agent for new
// sessions. CLI flags win over the file: passing --default-agent writes the
// file, --no-default-agent clears it, and with no flag the file is the value.

import fs from 'node:fs'
import path from 'node:path'
import * as errore from 'errore'

import { createLogger } from './logger.ts'

const logger = createLogger('CONFIG')

export type UserConfig = {
  // Default agent for new sessions when no channel preference is set.
  defaultAgent?: string
}

export class UserConfigWriteError extends errore.createTaggedError({
  name: 'UserConfigWriteError',
  message: 'cannot write $path',
}) {}

function configPath({ dataDir }: { dataDir: string }): string {
  return path.join(dataDir, 'config.json')
}

// {} when the file is missing or unreadable: the config is advisory, a broken
// file must never stop the bot.
export function loadUserConfig({ dataDir }: { dataDir: string }): UserConfig {
  const raw = errore.try(() => fs.readFileSync(configPath({ dataDir }), 'utf8'), () => null)
  if (raw === null) return {}
  const parsed = errore.try(() => JSON.parse(raw) as unknown, () => null)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    logger.warn(`unparseable user config at ${configPath({ dataDir })}, ignoring it`)
    return {}
  }
  return parsed
}

function writeConfig({ dataDir, config }: { dataDir: string; config: UserConfig }): void {
  const failed = errore.try(
    () => {
      fs.mkdirSync(dataDir, { recursive: true })
      fs.writeFileSync(configPath({ dataDir }), `${JSON.stringify(config, null, 2)}\n`)
    },
    (cause) => new UserConfigWriteError({ path: configPath({ dataDir }), cause }),
  )
  if (failed instanceof Error) logger.warn('writing user config failed', failed)
}

export function updateUserConfig({ dataDir, values }: { dataDir: string; values: UserConfig }): void {
  writeConfig({ dataDir, config: { ...loadUserConfig({ dataDir }), ...values } })
}

export function clearUserConfigKeys({ dataDir, keys }: { dataDir: string; keys: Array<keyof UserConfig> }): void {
  const current = loadUserConfig({ dataDir })
  for (const key of keys) delete current[key]
  writeConfig({ dataDir, config: current })
}
