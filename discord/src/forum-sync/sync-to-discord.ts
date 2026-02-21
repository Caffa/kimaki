// Filesystem -> Discord sync.
// Reads markdown files and creates/updates/deletes forum threads to match.
// Handles upsert logic: new files create threads, existing files update them.

import fs from 'node:fs'
import path from 'node:path'
import type { Client, ForumChannel } from 'discord.js'
import { createLogger } from '../logger.js'
import { extractStarterContent, getStringValue, parseFrontmatter, toStringArray } from './markdown.js'
import { loadExistingForumFiles, resolveForumChannel } from './discord-operations.js'
import { syncSingleThreadToFile } from './sync-to-files.js'
import {
  ForumSyncOperationError,
  shouldIgnorePath,
  type ForumFileSyncResult,
  type ForumRuntimeState,
  type SyncFilesToForumOptions,
} from './types.js'

const forumLogger = createLogger('FORUM')

function resolveTagIds({
  forumChannel,
  tagNames,
}: {
  forumChannel: ForumChannel
  tagNames: string[]
}): string[] {
  if (tagNames.length === 0) return []
  const normalizedWanted = new Set(tagNames.map((tag) => tag.toLowerCase().trim()))
  return forumChannel.availableTags
    .filter((tag) => normalizedWanted.has(tag.name.toLowerCase().trim()))
    .map((tag) => tag.id)
}

async function upsertThreadFromFile({
  discordClient,
  forumChannel,
  filePath,
  runtimeState,
}: {
  discordClient: Client
  forumChannel: ForumChannel
  filePath: string
  runtimeState?: ForumRuntimeState
}): Promise<'created' | 'updated' | 'skipped' | ForumSyncOperationError> {
  if (!fs.existsSync(filePath)) return 'skipped'

  const content = await fs.promises.readFile(filePath, 'utf8').catch((cause) => {
    return new ForumSyncOperationError({
      forumChannelId: forumChannel.id,
      reason: `failed to read ${filePath}`,
      cause,
    })
  })
  if (content instanceof Error) return content

  const parsed = parseFrontmatter({ markdown: content })
  const threadId = getStringValue({ value: parsed.frontmatter.threadId })
  const title = getStringValue({ value: parsed.frontmatter.title }) || path.basename(filePath, '.md')
  const tags = toStringArray({ value: parsed.frontmatter.tags })
  const starterContent = extractStarterContent({ body: parsed.body })
  const safeStarterContent = starterContent || title || 'Untitled post'

  const stat = await fs.promises.stat(filePath).catch((cause) => {
    return new ForumSyncOperationError({
      forumChannelId: forumChannel.id,
      reason: `failed to stat ${filePath}`,
      cause,
    })
  })
  if (stat instanceof Error) return stat

  // Skip if file hasn't been modified since last sync
  const lastSyncedAt = Date.parse(getStringValue({ value: parsed.frontmatter.lastSyncedAt }))
  if (Number.isFinite(lastSyncedAt) && stat.mtimeMs <= lastSyncedAt) return 'skipped'

  const tagIds = resolveTagIds({ forumChannel, tagNames: tags })

  // No threadId in frontmatter -> create a new thread
  if (!threadId) {
    return await createNewThread({
      forumChannel,
      filePath,
      title,
      safeStarterContent,
      tagIds,
      runtimeState,
    })
  }

  // Thread exists -> update it
  return await updateExistingThread({
    discordClient,
    forumChannel,
    filePath,
    threadId,
    title,
    safeStarterContent,
    tagIds,
    runtimeState,
  })
}

async function createNewThread({
  forumChannel,
  filePath,
  title,
  safeStarterContent,
  tagIds,
  runtimeState,
}: {
  forumChannel: ForumChannel
  filePath: string
  title: string
  safeStarterContent: string
  tagIds: string[]
  runtimeState?: ForumRuntimeState
}): Promise<'created' | ForumSyncOperationError> {
  const created = await forumChannel.threads
    .create({
      name: title.slice(0, 100) || 'Untitled post',
      message: { content: safeStarterContent.slice(0, 2_000) },
      appliedTags: tagIds,
    })
    .catch((cause) =>
      new ForumSyncOperationError({
        forumChannelId: forumChannel.id,
        reason: `failed creating thread from ${filePath}`,
        cause,
      }),
    )
  if (created instanceof Error) return created

  // Re-sync the file to get the new threadId in frontmatter
  const syncResult = await syncSingleThreadToFile({
    thread: created,
    forumChannel,
    outputDir: path.dirname(filePath),
    runtimeState,
    previousFilePath: filePath,
  })
  if (syncResult instanceof Error) return syncResult
  return 'created'
}

async function updateExistingThread({
  discordClient,
  forumChannel,
  filePath,
  threadId,
  title,
  safeStarterContent,
  tagIds,
  runtimeState,
}: {
  discordClient: Client
  forumChannel: ForumChannel
  filePath: string
  threadId: string
  title: string
  safeStarterContent: string
  tagIds: string[]
  runtimeState?: ForumRuntimeState
}): Promise<'updated' | ForumSyncOperationError> {
  const fetchedChannel = await discordClient.channels
    .fetch(threadId)
    .catch((cause) =>
      new ForumSyncOperationError({
        forumChannelId: forumChannel.id,
        reason: `failed fetching thread ${threadId}`,
        cause,
      }),
    )
  if (fetchedChannel instanceof Error) return fetchedChannel

  if (!fetchedChannel || !fetchedChannel.isThread() || fetchedChannel.parentId !== forumChannel.id) {
    return new ForumSyncOperationError({
      forumChannelId: forumChannel.id,
      reason: `thread ${threadId} not found in forum`,
    })
  }

  const updateResult = await fetchedChannel
    .edit({
      name: title.slice(0, 100) || fetchedChannel.name,
      appliedTags: tagIds,
    })
    .catch((cause) =>
      new ForumSyncOperationError({
        forumChannelId: forumChannel.id,
        reason: `failed editing thread ${threadId}`,
        cause,
      }),
    )
  if (updateResult instanceof Error) return updateResult

  const starterMessage = await fetchedChannel.fetchStarterMessage().catch((cause) => {
    return new ForumSyncOperationError({
      forumChannelId: forumChannel.id,
      reason: `failed fetching starter message for ${threadId}`,
      cause,
    })
  })
  if (starterMessage instanceof Error) return starterMessage

  if (starterMessage && starterMessage.content !== safeStarterContent) {
    const editResult = await starterMessage
      .edit({ content: safeStarterContent.slice(0, 2_000) })
      .catch((cause) =>
        new ForumSyncOperationError({
          forumChannelId: forumChannel.id,
          reason: `failed editing starter message for ${threadId}`,
          cause,
        }),
      )
    if (editResult instanceof Error) return editResult
  }

  // Re-sync the file to update frontmatter with latest state
  const syncResult = await syncSingleThreadToFile({
    thread: fetchedChannel,
    forumChannel,
    outputDir: path.dirname(filePath),
    runtimeState,
  })
  if (syncResult instanceof Error) return syncResult
  return 'updated'
}

async function deleteThreadFromFilePath({
  discordClient,
  forumChannel,
  filePath,
}: {
  discordClient: Client
  forumChannel: ForumChannel
  filePath: string
}): Promise<void | ForumSyncOperationError> {
  const filename = path.basename(filePath, '.md')
  if (!/^\d+$/.test(filename)) return

  const threadId = filename
  const fetchedChannel = await discordClient.channels
    .fetch(threadId)
    .catch((cause) =>
      new ForumSyncOperationError({
        forumChannelId: forumChannel.id,
        reason: `failed fetching deleted thread ${threadId}`,
        cause,
      }),
    )
  if (fetchedChannel instanceof Error) return fetchedChannel

  if (!fetchedChannel || !fetchedChannel.isThread() || fetchedChannel.parentId !== forumChannel.id) {
    return
  }

  const deleteResult = await fetchedChannel
    .delete('Deleted from forum sync markdown directory')
    .catch((cause) =>
      new ForumSyncOperationError({
        forumChannelId: forumChannel.id,
        reason: `failed deleting thread ${threadId}`,
        cause,
      }),
    )
  if (deleteResult instanceof Error) return deleteResult
}

export async function syncFilesToForum({
  discordClient,
  forumChannelId,
  outputDir,
  runtimeState,
  changedFilePaths,
  deletedFilePaths,
}: SyncFilesToForumOptions) {
  const forumChannel = await resolveForumChannel({ discordClient, forumChannelId })
  if (forumChannel instanceof Error) return forumChannel

  const changedPaths = changedFilePaths ||
    (await loadExistingForumFiles({ outputDir })).map((existing) => existing.filePath)

  const result: ForumFileSyncResult = { created: 0, updated: 0, skipped: 0, deleted: 0 }

  for (const filePath of changedPaths) {
    if (!filePath.endsWith('.md')) continue
    if (runtimeState && shouldIgnorePath({ runtimeState, filePath })) {
      result.skipped += 1
      continue
    }

    const upsertResult = await upsertThreadFromFile({
      discordClient,
      forumChannel,
      filePath,
      runtimeState,
    })
    if (upsertResult instanceof Error) return upsertResult

    if (upsertResult === 'created') {
      result.created += 1
    } else if (upsertResult === 'updated') {
      result.updated += 1
    } else {
      result.skipped += 1
    }
  }

  for (const filePath of deletedFilePaths || []) {
    const deleteResult = await deleteThreadFromFilePath({
      discordClient,
      forumChannel,
      filePath,
    })
    if (deleteResult instanceof Error) return deleteResult
    result.deleted += 1
  }

  return result
}
