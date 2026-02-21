// Discord forum <-> markdown synchronization utilities.
// Loads configured forum channels, keeps thread markdown mirrors up to date,
// and syncs local markdown edits/additions/deletions back to Discord.

import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import parcelWatcher from '@parcel/watcher'
import * as errore from 'errore'
import {
  ChannelType,
  Events,
  type Client,
  type ForumChannel,
  type Message,
  type PartialMessage,
  type ThreadChannel,
} from 'discord.js'
import { getDataDir } from './config.js'
import { createLogger } from './logger.js'

const forumLogger = createLogger('FORUM')

const FORUM_SYNC_CONFIG_FILE = 'forum-sync.json'
const DEFAULT_DEBOUNCE_MS = 800
const DEFAULT_RATE_LIMIT_DELAY_MS = 250
const WRITE_IGNORE_TTL_MS = 2_000

class ForumSyncConfigReadError extends errore.createTaggedError({
  name: 'ForumSyncConfigReadError',
  message: 'Failed to read forum sync config at $configPath',
}) {}

class ForumSyncConfigValidationError extends errore.createTaggedError({
  name: 'ForumSyncConfigValidationError',
  message: 'Invalid forum sync config: $reason',
}) {}

class ForumChannelResolveError extends errore.createTaggedError({
  name: 'ForumChannelResolveError',
  message: 'Could not resolve forum channel $forumChannelId',
}) {}

class ForumSyncOperationError extends errore.createTaggedError({
  name: 'ForumSyncOperationError',
  message: 'Forum sync operation failed for forum $forumChannelId: $reason',
}) {}

type ForumSyncDirection = 'discord-to-files' | 'bidirectional'

type ForumSyncEntry = {
  forumChannelId: string
  outputDir: string
  direction: ForumSyncDirection
}

type ForumSyncConfigFile = {
  forums: ForumSyncEntry[]
}

type ForumMessageSection = {
  messageId: string
  authorName: string
  authorId: string
  createdAt: string
  editedAt: string | null
  content: string
}

type ForumMarkdownFrontmatter = {
  title: string
  threadId: string
  forumChannelId: string
  tags: string[]
  author: string
  authorId: string
  createdAt: string
  lastUpdated: string
  lastMessageId: string | null
  lastSyncedAt: string
  messageCount: number
}

type ParsedMarkdownFile = {
  frontmatter: Record<string, unknown>
  body: string
}

type ExistingForumFile = {
  filePath: string
  threadId: string
  frontmatter: Record<string, unknown>
}

type ForumSyncResult = {
  synced: number
  skipped: number
  deleted: number
}

type ForumFileSyncResult = {
  created: number
  updated: number
  skipped: number
  deleted: number
}

type ForumRuntimeState = {
  forumChannelId: string
  outputDir: string
  direction: ForumSyncDirection
  dirtyThreadIds: Set<string>
  ignoredPaths: Map<string, number>
  queuedFileEvents: Map<string, 'create' | 'update' | 'delete'>
  discordDebounceTimer: NodeJS.Timeout | null
  fileDebounceTimer: NodeJS.Timeout | null
}

type StartForumSyncOptions = {
  discordClient: Client
  appId?: string
}

type SyncForumToFilesOptions = {
  discordClient: Client
  forumChannelId: string
  outputDir: string
  forceFullRefresh?: boolean
  forceThreadIds?: Set<string>
  runtimeState?: ForumRuntimeState
}

type SyncFilesToForumOptions = {
  discordClient: Client
  forumChannelId: string
  outputDir: string
  runtimeState?: ForumRuntimeState
  changedFilePaths?: string[]
  deletedFilePaths?: string[]
}

type LoadedForumConfig = {
  forumChannelId: string
  outputDir: string
  direction: ForumSyncDirection
}

const forumStateById = new Map<string, ForumRuntimeState>()
const watcherUnsubscribeByForumId = new Map<string, () => Promise<void>>()
let discordListenersRegistered = false

function delay({ ms }: { ms: number }) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

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

  const normalized = forums.reduce<LoadedForumConfig[]>((acc, item) => {
    if (!item || typeof item !== 'object') {
      return acc
    }

    const entry = item as Record<string, unknown>
    const itemAppId = typeof entry.appId === 'string' ? entry.appId : undefined
    if (appId && itemAppId && itemAppId !== appId) {
      return acc
    }

    const forumChannelId = typeof entry.forumChannelId === 'string' ? entry.forumChannelId : ''
    const outputDir = typeof entry.outputDir === 'string' ? entry.outputDir : ''
    const direction = isForumSyncDirection(entry.direction) ? entry.direction : 'bidirectional'

    if (!forumChannelId || !outputDir) {
      return acc
    }

    const resolvedOutputDir = path.isAbsolute(outputDir)
      ? outputDir
      : path.resolve(getDataDir(), outputDir)

    acc.push({ forumChannelId, outputDir: resolvedOutputDir, direction })
    return acc
  }, [])

  return normalized
}

async function readForumSyncConfig({
  appId,
}: {
  appId?: string
}): Promise<
  | ForumSyncConfigReadError
  | ForumSyncConfigValidationError
  | LoadedForumConfig[]
> {
  const configPath = getConfigPath()

  if (!fs.existsSync(configPath)) {
    return []
  }

  const rawConfig = await fs.promises
    .readFile(configPath, 'utf8')
    .catch((cause) => new ForumSyncConfigReadError({ configPath, cause }))
  if (rawConfig instanceof Error) {
    return rawConfig
  }

  const parsed = errore.try({
    try: () => yaml.load(rawConfig),
    catch: (cause) => new ForumSyncConfigValidationError({ reason: `yaml parse failed`, cause }),
  })
  if (parsed instanceof ForumSyncConfigValidationError) {
    return parsed
  }
  if (parsed instanceof Error) {
    return new ForumSyncConfigValidationError({ reason: 'yaml parse failed', cause: parsed })
  }

  return normalizeForumConfig({ raw: parsed, appId })
}

async function ensureDirectory({
  directory,
}: {
  directory: string
}): Promise<void | ForumSyncOperationError> {
  const result = await fs.promises
    .mkdir(directory, { recursive: true })
    .catch((cause) => new ForumSyncOperationError({ forumChannelId: 'unknown', reason: directory, cause }))
  if (result instanceof Error) {
    return result
  }
}

function parseFrontmatter({ markdown }: { markdown: string }): ParsedMarkdownFile {
  if (!markdown.startsWith('---\n')) {
    return { frontmatter: {}, body: markdown.trim() }
  }

  const end = markdown.indexOf('\n---\n', 4)
  if (end === -1) {
    return { frontmatter: {}, body: markdown.trim() }
  }

  const rawFrontmatter = markdown.slice(4, end)
  const body = markdown.slice(end + 5).trim()

  const parsed = errore.try({
    try: () => yaml.load(rawFrontmatter),
    catch: (cause) => new Error('Invalid markdown frontmatter', { cause }),
  })

  if (parsed instanceof Error || !parsed || typeof parsed !== 'object') {
    return { frontmatter: {}, body }
  }

  return { frontmatter: parsed as Record<string, unknown>, body }
}

function stringifyFrontmatter({
  frontmatter,
  body,
}: {
  frontmatter: ForumMarkdownFrontmatter
  body: string
}) {
  const yamlText = yaml
    .dump(frontmatter, {
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
    })
    .trim()
  return `---\n${yamlText}\n---\n\n${body.trim()}\n`
}

function splitSections({ body }: { body: string }) {
  return body
    .split(/\r?\n---\r?\n/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

function extractStarterContent({ body }: { body: string }) {
  const sections = splitSections({ body })
  const firstSection = sections[0] || ''
  const match = firstSection.match(
    /^\*\*.+?\*\* \(\d+\) - .+?(?: \(edited .+?\))?\r?\n\r?\n([\s\S]*)$/,
  )
  if (!match) {
    return body.trim()
  }
  return (match[1] || '').trim()
}

function toStringArray({ value }: { value: unknown }) {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string')
}

function getStringValue({ value }: { value: unknown }) {
  if (typeof value !== 'string') {
    return ''
  }
  return value
}

async function resolveForumChannel({
  discordClient,
  forumChannelId,
}: {
  discordClient: Client
  forumChannelId: string
}): Promise<ForumChannel | ForumChannelResolveError> {
  const channel = await discordClient.channels
    .fetch(forumChannelId)
    .catch((cause) => new ForumChannelResolveError({ forumChannelId, cause }))
  if (channel instanceof Error) {
    return channel
  }

  if (!channel || channel.type !== ChannelType.GuildForum) {
    return new ForumChannelResolveError({ forumChannelId })
  }

  return channel
}

function getCanonicalThreadFilePath({
  outputDir,
  threadId,
}: {
  outputDir: string
  threadId: string
}) {
  return path.join(outputDir, `${threadId}.md`)
}

async function loadExistingForumFiles({
  outputDir,
}: {
  outputDir: string
}): Promise<ExistingForumFile[]> {
  if (!fs.existsSync(outputDir)) {
    return []
  }

  const entries = await fs.promises.readdir(outputDir, { withFileTypes: true })
  const markdownFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => path.join(outputDir, entry.name))

  const loaded = await Promise.all(
    markdownFiles.map(async (filePath) => {
      const content = await fs.promises.readFile(filePath, 'utf8').catch(() => null)
      if (content === null) {
        return null
      }
      const parsed = parseFrontmatter({ markdown: content })
      const threadIdFromFrontmatter = getStringValue({ value: parsed.frontmatter.threadId })
      const threadIdFromFilename = path.basename(filePath, '.md')
      const threadId = threadIdFromFrontmatter || (/^\d+$/.test(threadIdFromFilename) ? threadIdFromFilename : '')
      if (!threadId) {
        return null
      }
      return {
        filePath,
        threadId,
        frontmatter: parsed.frontmatter,
      }
    }),
  )

  return loaded.filter((item): item is ExistingForumFile => item !== null)
}

async function fetchForumThreads({
  forumChannel,
}: {
  forumChannel: ForumChannel
}): Promise<ThreadChannel[] | ForumSyncOperationError> {
  const byId = new Map<string, ThreadChannel>()

  const active = await forumChannel.threads
    .fetchActive()
    .catch((cause) =>
      new ForumSyncOperationError({
        forumChannelId: forumChannel.id,
        reason: 'fetchActive failed',
        cause,
      }),
    )
  if (active instanceof Error) {
    return active
  }

  active.threads.forEach((thread) => {
    byId.set(thread.id, thread)
  })

  let before: Date | undefined
  while (true) {
    const archived = await forumChannel.threads
      .fetchArchived({ type: 'public', limit: 100, before })
      .catch((cause) =>
        new ForumSyncOperationError({
          forumChannelId: forumChannel.id,
          reason: 'fetchArchived failed',
          cause,
        }),
      )
    if (archived instanceof Error) {
      return archived
    }

    const threads = Array.from(archived.threads.values())
    threads.forEach((thread) => {
      byId.set(thread.id, thread)
    })

    if (!archived.hasMore || threads.length === 0) {
      break
    }

    const timestamps = threads
      .map((thread) => thread.archiveTimestamp ?? thread.createdTimestamp)
      .filter((value): value is number => value !== null)

    const oldestTimestamp = timestamps.reduce((oldest, current) => {
      return current < oldest ? current : oldest
    }, Number.POSITIVE_INFINITY)

    if (!Number.isFinite(oldestTimestamp)) {
      break
    }

    before = new Date(oldestTimestamp - 1)
    await delay({ ms: DEFAULT_RATE_LIMIT_DELAY_MS })
  }

  return Array.from(byId.values())
}

async function fetchThreadMessages({
  thread,
}: {
  thread: ThreadChannel
}): Promise<Message[] | ForumSyncOperationError> {
  const byId = new Map<string, Message>()
  let before: string | undefined

  while (true) {
    const fetched = await thread.messages
      .fetch({ limit: 100, before })
      .catch((cause) =>
        new ForumSyncOperationError({
          forumChannelId: thread.parentId || 'unknown',
          reason: `message fetch failed for thread ${thread.id}`,
          cause,
        }),
      )
    if (fetched instanceof Error) {
      return fetched
    }

    const messages = Array.from(fetched.values())
    messages.forEach((message) => {
      byId.set(message.id, message)
    })

    if (messages.length < 100 || messages.length === 0) {
      break
    }

    const oldest = messages.reduce((oldestMessage, message) => {
      if (!oldestMessage) {
        return message
      }
      return message.createdTimestamp < oldestMessage.createdTimestamp ? message : oldestMessage
    }, null as Message | null)

    if (!oldest) {
      break
    }

    before = oldest.id
    await delay({ ms: DEFAULT_RATE_LIMIT_DELAY_MS })
  }

  return Array.from(byId.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp)
}

function buildMessageSections({ messages }: { messages: Message[] }) {
  return messages.map((message) => {
    const attachmentLines = Array.from(message.attachments.values()).map(
      (attachment) => `Attachment: ${attachment.url}`,
    )

    const contentParts: string[] = []
    const trimmedContent = message.content.trim()
    if (trimmedContent) {
      contentParts.push(trimmedContent)
    }
    if (attachmentLines.length > 0) {
      contentParts.push(attachmentLines.join('\n'))
    }

    const content = contentParts.length > 0 ? contentParts.join('\n\n') : '_(no text content)_'

    return {
      messageId: message.id,
      authorName: message.author.username,
      authorId: message.author.id,
      createdAt: new Date(message.createdTimestamp).toISOString(),
      editedAt: message.editedTimestamp ? new Date(message.editedTimestamp).toISOString() : null,
      content,
    } satisfies ForumMessageSection
  })
}

function formatMessageSection({ section }: { section: ForumMessageSection }) {
  const editedSuffix = section.editedAt ? ` (edited ${section.editedAt})` : ''
  return `**${section.authorName}** (${section.authorId}) - ${section.createdAt}${editedSuffix}\n\n${section.content}`
}

function resolveTagNames({
  thread,
  forumChannel,
}: {
  thread: ThreadChannel
  forumChannel: ForumChannel
}) {
  const availableTagsById = new Map(
    forumChannel.availableTags.map((tag) => {
      return [tag.id, tag.name] as const
    }),
  )

  return thread.appliedTags
    .map((tagId) => availableTagsById.get(tagId))
    .filter((tagName): tagName is string => Boolean(tagName))
}

function buildFrontmatter({
  thread,
  forumChannel,
  sections,
}: {
  thread: ThreadChannel
  forumChannel: ForumChannel
  sections: ForumMessageSection[]
}): ForumMarkdownFrontmatter {
  const firstSection = sections[0]
  const createdTimestamp = thread.createdTimestamp ?? Date.now()
  const latestTimestamp = sections.reduce((latest, section) => {
    const created = Date.parse(section.createdAt)
    const edited = section.editedAt ? Date.parse(section.editedAt) : 0
    const maxForSection = Math.max(created, edited)
    return maxForSection > latest ? maxForSection : latest
  }, createdTimestamp)

  return {
    title: thread.name,
    threadId: thread.id,
    forumChannelId: forumChannel.id,
    tags: resolveTagNames({ thread, forumChannel }),
    author: firstSection?.authorName || '',
    authorId: firstSection?.authorId || '',
    createdAt: thread.createdAt?.toISOString() || new Date(createdTimestamp).toISOString(),
    lastUpdated: new Date(latestTimestamp).toISOString(),
    lastMessageId: thread.lastMessageId,
    lastSyncedAt: new Date().toISOString(),
    messageCount: sections.length,
  }
}

function addIgnoredPath({
  runtimeState,
  filePath,
}: {
  runtimeState?: ForumRuntimeState
  filePath: string
}) {
  if (!runtimeState) {
    return
  }
  runtimeState.ignoredPaths.set(filePath, Date.now() + WRITE_IGNORE_TTL_MS)
}

function shouldIgnorePath({ runtimeState, filePath }: { runtimeState: ForumRuntimeState; filePath: string }) {
  const expiresAt = runtimeState.ignoredPaths.get(filePath)
  if (!expiresAt) {
    return false
  }
  if (expiresAt < Date.now()) {
    runtimeState.ignoredPaths.delete(filePath)
    return false
  }
  return true
}

async function syncSingleThreadToFile({
  thread,
  forumChannel,
  outputDir,
  runtimeState,
  previousFilePath,
}: {
  thread: ThreadChannel
  forumChannel: ForumChannel
  outputDir: string
  runtimeState?: ForumRuntimeState
  previousFilePath?: string
}): Promise<void | ForumSyncOperationError> {
  const messages = await fetchThreadMessages({ thread })
  if (messages instanceof Error) {
    return messages
  }

  const sections = buildMessageSections({ messages })
  const body = sections.map((section) => formatMessageSection({ section })).join('\n\n---\n\n')
  const frontmatter = buildFrontmatter({ thread, forumChannel, sections })
  const markdown = stringifyFrontmatter({ frontmatter, body })
  const targetPath = getCanonicalThreadFilePath({ outputDir, threadId: thread.id })

  addIgnoredPath({ runtimeState, filePath: targetPath })
  const writeResult = await fs.promises.writeFile(targetPath, markdown, 'utf8').catch((cause) => {
    return new ForumSyncOperationError({
      forumChannelId: forumChannel.id,
      reason: `failed to write ${targetPath}`,
      cause,
    })
  })
  if (writeResult instanceof Error) {
    return writeResult
  }

  if (previousFilePath && previousFilePath !== targetPath && fs.existsSync(previousFilePath)) {
    addIgnoredPath({ runtimeState, filePath: previousFilePath })
    await fs.promises.unlink(previousFilePath).catch(() => undefined)
  }
}

function resolveTagIds({
  forumChannel,
  tagNames,
}: {
  forumChannel: ForumChannel
  tagNames: string[]
}) {
  if (tagNames.length === 0) {
    return []
  }

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
  if (!fs.existsSync(filePath)) {
    return 'skipped'
  }

  const content = await fs.promises.readFile(filePath, 'utf8').catch((cause) => {
    return new ForumSyncOperationError({
      forumChannelId: forumChannel.id,
      reason: `failed to read ${filePath}`,
      cause,
    })
  })
  if (content instanceof Error) {
    return content
  }

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
  if (stat instanceof Error) {
    return stat
  }

  const lastSyncedAt = Date.parse(getStringValue({ value: parsed.frontmatter.lastSyncedAt }))
  if (Number.isFinite(lastSyncedAt) && stat.mtimeMs <= lastSyncedAt) {
    return 'skipped'
  }

  const tagIds = resolveTagIds({ forumChannel, tagNames: tags })
  if (!threadId) {
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
    if (created instanceof Error) {
      return created
    }

    const syncResult = await syncSingleThreadToFile({
      thread: created,
      forumChannel,
      outputDir: path.dirname(filePath),
      runtimeState,
      previousFilePath: filePath,
    })
    if (syncResult instanceof Error) {
      return syncResult
    }
    return 'created'
  }

  const fetchedChannel = await discordClient.channels
    .fetch(threadId)
    .catch((cause) =>
      new ForumSyncOperationError({
        forumChannelId: forumChannel.id,
        reason: `failed fetching thread ${threadId}`,
        cause,
      }),
    )
  if (fetchedChannel instanceof Error) {
    return fetchedChannel
  }

  if (!fetchedChannel || !fetchedChannel.isThread() || fetchedChannel.parentId !== forumChannel.id) {
    return new ForumSyncOperationError({
      forumChannelId: forumChannel.id,
      reason: `thread ${threadId} not found in forum`,
    })
  }

  const updateThreadResult = await fetchedChannel
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
  if (updateThreadResult instanceof Error) {
    return updateThreadResult
  }

  const starterMessage = await fetchedChannel.fetchStarterMessage().catch((cause) => {
    return new ForumSyncOperationError({
      forumChannelId: forumChannel.id,
      reason: `failed fetching starter message for ${threadId}`,
      cause,
    })
  })
  if (starterMessage instanceof Error) {
    return starterMessage
  }

  if (starterMessage && starterMessage.content !== safeStarterContent) {
    const editStarterResult = await starterMessage
      .edit({ content: safeStarterContent.slice(0, 2_000) })
      .catch((cause) =>
        new ForumSyncOperationError({
          forumChannelId: forumChannel.id,
          reason: `failed editing starter message for ${threadId}`,
          cause,
        }),
      )
    if (editStarterResult instanceof Error) {
      return editStarterResult
    }
  }

  const syncResult = await syncSingleThreadToFile({
    thread: fetchedChannel,
    forumChannel,
    outputDir: path.dirname(filePath),
    runtimeState,
  })
  if (syncResult instanceof Error) {
    return syncResult
  }
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
  if (!/^\d+$/.test(filename)) {
    return
  }

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
  if (fetchedChannel instanceof Error) {
    return fetchedChannel
  }

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
  if (deleteResult instanceof Error) {
    return deleteResult
  }
}

async function runQueuedFileEvents({
  runtimeState,
  discordClient,
}: {
  runtimeState: ForumRuntimeState
  discordClient: Client
}) {
  const queuedEntries = Array.from(runtimeState.queuedFileEvents.entries())
  runtimeState.queuedFileEvents.clear()

  if (queuedEntries.length === 0) {
    return
  }

  const changedFilePaths = queuedEntries
    .filter(([, eventType]) => eventType === 'create' || eventType === 'update')
    .map(([filePath]) => filePath)
  const deletedFilePaths = queuedEntries
    .filter(([, eventType]) => eventType === 'delete')
    .map(([filePath]) => filePath)

  const syncResult = await syncFilesToForum({
    discordClient,
    forumChannelId: runtimeState.forumChannelId,
    outputDir: runtimeState.outputDir,
    runtimeState,
    changedFilePaths,
    deletedFilePaths,
  })

  if (syncResult instanceof Error) {
    forumLogger.warn(`FS -> Discord sync failed for ${runtimeState.forumChannelId}: ${syncResult.message}`)
    return
  }

  if (syncResult.created + syncResult.updated + syncResult.deleted > 0) {
    forumLogger.log(
      `FS -> Discord ${runtimeState.forumChannelId}: +${syncResult.created} ~${syncResult.updated} -${syncResult.deleted} (skip ${syncResult.skipped})`,
    )
  }

  const discordSyncResult = await syncForumToFiles({
    discordClient,
    forumChannelId: runtimeState.forumChannelId,
    outputDir: runtimeState.outputDir,
    runtimeState,
    forceThreadIds: runtimeState.dirtyThreadIds,
  })
  if (discordSyncResult instanceof Error) {
    forumLogger.warn(
      `Discord -> FS refresh failed for ${runtimeState.forumChannelId}: ${discordSyncResult.message}`,
    )
    return
  }
  runtimeState.dirtyThreadIds.clear()
}

function queueFileEvent({
  runtimeState,
  filePath,
  eventType,
  discordClient,
}: {
  runtimeState: ForumRuntimeState
  filePath: string
  eventType: 'create' | 'update' | 'delete'
  discordClient: Client
}) {
  if (shouldIgnorePath({ runtimeState, filePath })) {
    return
  }

  runtimeState.queuedFileEvents.set(filePath, eventType)

  if (runtimeState.fileDebounceTimer) {
    clearTimeout(runtimeState.fileDebounceTimer)
  }

  runtimeState.fileDebounceTimer = setTimeout(() => {
    runtimeState.fileDebounceTimer = null
    void runQueuedFileEvents({ runtimeState, discordClient })
  }, DEFAULT_DEBOUNCE_MS)
}

function scheduleDiscordSync({
  runtimeState,
  threadId,
  discordClient,
}: {
  runtimeState: ForumRuntimeState
  threadId: string
  discordClient: Client
}) {
  runtimeState.dirtyThreadIds.add(threadId)

  if (runtimeState.discordDebounceTimer) {
    clearTimeout(runtimeState.discordDebounceTimer)
  }

  runtimeState.discordDebounceTimer = setTimeout(() => {
    runtimeState.discordDebounceTimer = null
    void (async () => {
      const syncResult = await syncForumToFiles({
        discordClient,
        forumChannelId: runtimeState.forumChannelId,
        outputDir: runtimeState.outputDir,
        runtimeState,
        forceThreadIds: runtimeState.dirtyThreadIds,
      })
      if (syncResult instanceof Error) {
        forumLogger.warn(
          `Debounced Discord -> FS sync failed for ${runtimeState.forumChannelId}: ${syncResult.message}`,
        )
        return
      }
      runtimeState.dirtyThreadIds.clear()
    })()
  }, DEFAULT_DEBOUNCE_MS)
}

function getThreadEventData({
  channel,
}: {
  channel: ThreadChannel | null
}): { forumChannelId: string; threadId: string } | null {
  if (!channel) {
    return null
  }
  if (
    channel.type !== ChannelType.PublicThread &&
    channel.type !== ChannelType.PrivateThread &&
    channel.type !== ChannelType.AnnouncementThread
  ) {
    return null
  }
  const forumChannelId = channel.parentId
  if (!forumChannelId) {
    return null
  }
  return { forumChannelId, threadId: channel.id }
}

function getEventThreadFromMessage({
  message,
}: {
  message: Message | PartialMessage
}): ThreadChannel | null {
  const channel = message.channel
  if (!channel || !channel.isThread()) {
    return null
  }
  return channel
}

function registerDiscordSyncListeners({
  discordClient,
}: {
  discordClient: Client
}) {
  if (discordListenersRegistered) {
    return
  }
  discordListenersRegistered = true

  discordClient.on(Events.MessageCreate, async (message) => {
    if (message.author?.bot) {
      return
    }
    const thread = getEventThreadFromMessage({ message })
    const data = getThreadEventData({ channel: thread })
    if (!data) {
      return
    }
    const runtimeState = forumStateById.get(data.forumChannelId)
    if (!runtimeState) {
      return
    }
    scheduleDiscordSync({ runtimeState, threadId: data.threadId, discordClient })
  })

  discordClient.on(Events.MessageUpdate, async (_oldMessage, newMessage) => {
    const thread = getEventThreadFromMessage({ message: newMessage })
    const data = getThreadEventData({ channel: thread })
    if (!data) {
      return
    }
    const runtimeState = forumStateById.get(data.forumChannelId)
    if (!runtimeState) {
      return
    }
    scheduleDiscordSync({ runtimeState, threadId: data.threadId, discordClient })
  })

  discordClient.on(Events.ThreadUpdate, async (_oldThread, newThread) => {
    const data = getThreadEventData({ channel: newThread })
    if (!data) {
      return
    }
    const runtimeState = forumStateById.get(data.forumChannelId)
    if (!runtimeState) {
      return
    }
    scheduleDiscordSync({ runtimeState, threadId: data.threadId, discordClient })
  })

  discordClient.on(Events.ThreadDelete, async (thread) => {
    const data = getThreadEventData({ channel: thread })
    if (!data) {
      return
    }
    const runtimeState = forumStateById.get(data.forumChannelId)
    if (!runtimeState) {
      return
    }
    const targetPath = getCanonicalThreadFilePath({
      outputDir: runtimeState.outputDir,
      threadId: data.threadId,
    })
    if (fs.existsSync(targetPath)) {
      addIgnoredPath({ runtimeState, filePath: targetPath })
      await fs.promises.unlink(targetPath).catch(() => undefined)
    }
  })
}

export async function syncForumToFiles({
  discordClient,
  forumChannelId,
  outputDir,
  forceFullRefresh = false,
  forceThreadIds,
  runtimeState,
}: SyncForumToFilesOptions): Promise<ForumSyncResult | ForumChannelResolveError | ForumSyncOperationError> {
  const ensureResult = await ensureDirectory({ directory: outputDir })
  if (ensureResult instanceof Error) {
    return new ForumSyncOperationError({
      forumChannelId,
      reason: `failed to create output directory ${outputDir}`,
      cause: ensureResult,
    })
  }

  const forumChannel = await resolveForumChannel({ discordClient, forumChannelId })
  if (forumChannel instanceof Error) {
    return forumChannel
  }

  const threads = await fetchForumThreads({ forumChannel })
  if (threads instanceof Error) {
    return threads
  }

  const existingFiles = await loadExistingForumFiles({ outputDir })
  const existingByThreadId = new Map(
    existingFiles.map((entry) => {
      return [entry.threadId, entry] as const
    }),
  )

  let synced = 0
  let skipped = 0
  let deleted = 0

  for (const thread of threads) {
    const existing = existingByThreadId.get(thread.id)
    const savedLastMessageId = getStringValue({ value: existing?.frontmatter.lastMessageId }) || null
    const isForced = forceFullRefresh || Boolean(forceThreadIds?.has(thread.id))

    if (!isForced && savedLastMessageId && savedLastMessageId === thread.lastMessageId) {
      skipped += 1
      continue
    }

    const syncResult = await syncSingleThreadToFile({
      thread,
      forumChannel,
      outputDir,
      runtimeState,
      previousFilePath: existing?.filePath,
    })
    if (syncResult instanceof Error) {
      return syncResult
    }
    synced += 1
    await delay({ ms: DEFAULT_RATE_LIMIT_DELAY_MS })
  }

  const liveThreadIds = new Set(threads.map((thread) => thread.id))
  for (const existing of existingFiles) {
    if (liveThreadIds.has(existing.threadId)) {
      continue
    }
    if (fs.existsSync(existing.filePath)) {
      addIgnoredPath({ runtimeState, filePath: existing.filePath })
      const deleteResult = await fs.promises.unlink(existing.filePath).catch((cause) => {
        return new ForumSyncOperationError({
          forumChannelId,
          reason: `failed deleting stale file ${existing.filePath}`,
          cause,
        })
      })
      if (deleteResult instanceof Error) {
        return deleteResult
      }
      deleted += 1
    }
  }

  return { synced, skipped, deleted }
}

export async function syncFilesToForum({
  discordClient,
  forumChannelId,
  outputDir,
  runtimeState,
  changedFilePaths,
  deletedFilePaths,
}: SyncFilesToForumOptions): Promise<
  ForumFileSyncResult | ForumChannelResolveError | ForumSyncOperationError
> {
  const forumChannel = await resolveForumChannel({ discordClient, forumChannelId })
  if (forumChannel instanceof Error) {
    return forumChannel
  }

  const changedPaths = changedFilePaths ||
    (await loadExistingForumFiles({ outputDir })).map((existing) => existing.filePath)

  let created = 0
  let updated = 0
  let skipped = 0
  let deleted = 0

  for (const filePath of changedPaths) {
    if (!filePath.endsWith('.md')) {
      continue
    }
    if (runtimeState && shouldIgnorePath({ runtimeState, filePath })) {
      skipped += 1
      continue
    }

    const upsertResult = await upsertThreadFromFile({
      discordClient,
      forumChannel,
      filePath,
      runtimeState,
    })
    if (upsertResult instanceof Error) {
      return upsertResult
    }
    if (upsertResult === 'created') {
      created += 1
      continue
    }
    if (upsertResult === 'updated') {
      updated += 1
      continue
    }
    skipped += 1
  }

  for (const filePath of deletedFilePaths || []) {
    const deleteResult = await deleteThreadFromFilePath({
      discordClient,
      forumChannel,
      filePath,
    })
    if (deleteResult instanceof Error) {
      return deleteResult
    }
    deleted += 1
  }

  return { created, updated, skipped, deleted }
}

function buildRuntimeState({
  forumChannelId,
  outputDir,
  direction,
}: {
  forumChannelId: string
  outputDir: string
  direction: ForumSyncDirection
}): ForumRuntimeState {
  return {
    forumChannelId,
    outputDir,
    direction,
    dirtyThreadIds: new Set<string>(),
    ignoredPaths: new Map<string, number>(),
    queuedFileEvents: new Map<string, 'create' | 'update' | 'delete'>(),
    discordDebounceTimer: null,
    fileDebounceTimer: null,
  }
}

async function startWatcherForRuntimeState({
  runtimeState,
  discordClient,
}: {
  runtimeState: ForumRuntimeState
  discordClient: Client
}): Promise<void | ForumSyncOperationError> {
  if (runtimeState.direction !== 'bidirectional') {
    return
  }

  const subscription = await parcelWatcher
    .subscribe(runtimeState.outputDir, (_error, events) => {
      events.forEach((event) => {
        if (!event.path.endsWith('.md')) {
          return
        }
        const eventType = event.type
        if (eventType !== 'create' && eventType !== 'update' && eventType !== 'delete') {
          return
        }
        queueFileEvent({
          runtimeState,
          filePath: event.path,
          eventType,
          discordClient,
        })
      })
    })
    .catch((cause) =>
      new ForumSyncOperationError({
        forumChannelId: runtimeState.forumChannelId,
        reason: `failed to subscribe watcher for ${runtimeState.outputDir}`,
        cause,
      }),
    )

  if (subscription instanceof Error) {
    return subscription
  }

  watcherUnsubscribeByForumId.set(runtimeState.forumChannelId, () => {
    return subscription.unsubscribe()
  })
}

export async function stopConfiguredForumSync() {
  const unsubscribers = Array.from(watcherUnsubscribeByForumId.values())
  watcherUnsubscribeByForumId.clear()
  forumStateById.clear()

  await Promise.all(
    unsubscribers.map(async (unsubscribe) => {
      await unsubscribe().catch(() => undefined)
    }),
  )
}

export async function startConfiguredForumSync({
  discordClient,
  appId,
}: StartForumSyncOptions): Promise<
  | void
  | ForumSyncConfigReadError
  | ForumSyncConfigValidationError
  | ForumChannelResolveError
  | ForumSyncOperationError
> {
  const loadedConfig = await readForumSyncConfig({ appId })
  if (loadedConfig instanceof Error) {
    return loadedConfig
  }

  if (loadedConfig.length === 0) {
    return
  }

  registerDiscordSyncListeners({ discordClient })

  for (const entry of loadedConfig) {
    const runtimeState = buildRuntimeState({
      forumChannelId: entry.forumChannelId,
      outputDir: entry.outputDir,
      direction: entry.direction,
    })
    forumStateById.set(entry.forumChannelId, runtimeState)

    const ensureResult = await ensureDirectory({ directory: entry.outputDir })
    if (ensureResult instanceof Error) {
      return new ForumSyncOperationError({
        forumChannelId: entry.forumChannelId,
        reason: `failed to create ${entry.outputDir}`,
        cause: ensureResult,
      })
    }

    const fileToDiscordResult = await syncFilesToForum({
      discordClient,
      forumChannelId: entry.forumChannelId,
      outputDir: entry.outputDir,
      runtimeState,
    })
    if (fileToDiscordResult instanceof Error) {
      return fileToDiscordResult
    }

    const discordToFileResult = await syncForumToFiles({
      discordClient,
      forumChannelId: entry.forumChannelId,
      outputDir: entry.outputDir,
      forceFullRefresh: true,
      runtimeState,
    })
    if (discordToFileResult instanceof Error) {
      return discordToFileResult
    }

    const watcherResult = await startWatcherForRuntimeState({ runtimeState, discordClient })
    if (watcherResult instanceof Error) {
      return watcherResult
    }

    forumLogger.log(
      `Forum sync started for ${entry.forumChannelId} (${entry.direction}) -> ${entry.outputDir}`,
    )
    forumLogger.log(
      `Initial sync: Discord->FS synced ${discordToFileResult.synced}, skipped ${discordToFileResult.skipped}, deleted ${discordToFileResult.deleted}; FS->Discord created ${fileToDiscordResult.created}, updated ${fileToDiscordResult.updated}, deleted ${fileToDiscordResult.deleted}`,
    )
  }
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
