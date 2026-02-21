// Forum sync configuration reading and validation.
// Reads the forum-sync.json config file from the data directory,
// validates its structure, and normalizes entries.

import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import * as errore from 'errore'
import { getDataDir } from '../config.js'
import {
  FORUM_SYNC_CONFIG_FILE,
  ForumSyncConfigReadError,
  ForumSyncConfigValidationError,
  type ForumSyncConfigFile,
  type ForumSyncDirection,
  type LoadedForumConfig,
} from './types.js'

function getConfigPath() {
  return path.join(getDataDir(), FORUM_SYNC_CONFIG_FILE)
}

function isForumSyncDirection(value: unknown): value is ForumSyncDirection {
  return value === 'discord-to-files' || value === 'bidirectional'
}

function normalizeForumConfig({
  raw,
  appId,
}: {
  raw: unknown
  appId?: string
}): ForumSyncConfigValidationError | LoadedForumConfig[] {
  if (!raw || typeof raw !== 'object') {
    return new ForumSyncConfigValidationError({ reason: 'config root must be an object' })
  }

  const forums = (raw as Record<string, unknown>).forums
  if (!Array.isArray(forums)) {
    return new ForumSyncConfigValidationError({ reason: 'config requires a forums array' })
  }

  return forums.reduce<LoadedForumConfig[]>((acc, item) => {
    if (!item || typeof item !== 'object') return acc

    const entry = item as Record<string, unknown>
    const itemAppId = typeof entry.appId === 'string' ? entry.appId : undefined
    if (appId && itemAppId && itemAppId !== appId) return acc

    const forumChannelId = typeof entry.forumChannelId === 'string' ? entry.forumChannelId : ''
    const outputDir = typeof entry.outputDir === 'string' ? entry.outputDir : ''
    const direction = isForumSyncDirection(entry.direction) ? entry.direction : 'bidirectional'

    if (!forumChannelId || !outputDir) return acc

    const resolvedOutputDir = path.isAbsolute(outputDir)
      ? outputDir
      : path.resolve(getDataDir(), outputDir)

    acc.push({ forumChannelId, outputDir: resolvedOutputDir, direction })
    return acc
  }, [])
}

export async function readForumSyncConfig({ appId }: { appId?: string }) {
  const configPath = getConfigPath()

  if (!fs.existsSync(configPath)) return []

  const rawConfig = await fs.promises
    .readFile(configPath, 'utf8')
    .catch((cause) => new ForumSyncConfigReadError({ configPath, cause }))
  if (rawConfig instanceof Error) return rawConfig

  const parsed = errore.try({
    try: () => yaml.load(rawConfig),
    catch: (cause) => new ForumSyncConfigValidationError({ reason: 'yaml parse failed', cause }),
  })
  if (parsed instanceof Error) return parsed

  return normalizeForumConfig({ raw: parsed, appId })
}

export function getForumSyncConfigExample(): ForumSyncConfigFile {
  return {
    forums: [
      {
        forumChannelId: '123456789012345678',
        outputDir: 'forums/123456789012345678',
        direction: 'bidirectional',
      },
    ],
  }
}
