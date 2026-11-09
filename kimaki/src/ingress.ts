// Discord ingress (spec 4): gates every messageCreate, parses it into a Route
// and calls actions. Gates, in order: webhooks and our own messages (except
// remote send envelopes), channel ownership (only channels mapped in this
// machine's SQLite), permission (other bots need the Kimaki role).
// Messages of one channel are handled in arrival order, after OpenCode is ready.
//
// Messages sent while the bot was offline are not fetched here: gateway-proxy
// buffers MESSAGE_* and THREAD_* events for a disconnected client (200 max)
// and replays them after the next READY, and discord.js RESUME replays short
// drops. Both arrive as normal messageCreate events. The listener is
// registered before login so the replayed events are not missed.
//
// Attachments become prompt files; voice messages are transcribed into the
// same Route as text. Edits and deletes of queued messages update the queue.

import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  ChannelType,
  Events,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  type Attachment,
  type Guild,
  type Message,
  type ThreadChannel,
} from 'discord.js'
import * as errore from 'errore'

import { isCoordinatorChannel, oc, projectOf, rootSession, sessionDirectory, fetchThread, type Author, type Bot, type PromptFile } from './bot.ts'
import { ConfigError } from './errors.ts'
import { failedVoiceDir, type FailedVoiceRecord, type FailedVoiceRetry } from './failed-voice.ts'
import {
  EmptyTranscriptionError,
  NoTranscriptionKeyError,
  TranscriptionApiError,
  TranscriptionBlockedError,
} from './voice.ts' 
import { formatError, NOTIFY_MESSAGE_FLAGS, SILENT_MESSAGE_FLAGS } from './format-parts.ts'
import { createLogger } from './logger.ts'
import { parseInput, sendInput } from './lock-routes.ts'
import { cancelQueuedPrompt, dispatch, promptIdForMessage, requeueEdited, send } from './prompt.ts'
import { REMOTE_PROMPT_FILE, REMOTE_RESULT_PREFIX, REMOTE_SEND_PREFIX } from './remote-send.ts'
import { echoPayloads, formatEcho, queuedItemFor } from './queue.ts'
import { parseTextMessage, type Route } from './routes.ts'
import { primaryAgents, startCoordinator, startSession } from './sessions.ts'
import { isVoiceAttachment, parseVoiceMessage, transcribe, voiceMediaType, type AttachmentLike } from './voice.ts'

const logger = createLogger('INGRESS')
// Later messages of the channel wait for downloads (registerIngress).
const DOWNLOAD_TIMEOUT_MS = 60_000

// Owner, Administrator, Manage Server, or a role named "Kimaki"; with
// --allow-all-users every member. A role named "no-kimaki" always denies.
// Missing member data fails closed.
export async function canUseKimaki(
  bot: Pick<Bot, 'allowAllUsers'>,
  { guild, userId }: { guild: Guild; userId: string },
): Promise<boolean> {
  const member = await guild.members.fetch({ user: userId, force: true }).catch((error: Error) => error)
  if (member instanceof Error) {
    // Still denied, but say why: a REST failure must not look like a missing role.
    logger.warn(`cannot check Kimaki permission of ${userId}`, member)
    return false
  }
  if (!(member instanceof GuildMember)) return false
  return memberCanUseKimaki(bot, member)
}

// MESSAGE_CREATE carries the author's current roles: no REST fetch on the hot path.
// Discord omits the member only for webhook and ephemeral messages, which never get here.
function authorCanUseKimaki(bot: Bot, message: Message<true>): Promise<boolean> {
  if (message.member instanceof GuildMember) return Promise.resolve(memberCanUseKimaki(bot, message.member))
  return canUseKimaki(bot, { guild: message.guild, userId: message.author.id })
}

function memberCanUseKimaki(bot: Pick<Bot, 'allowAllUsers'>, member: GuildMember): boolean {
  const roleNames = member.roles.cache.map((role) => role.name.toLowerCase())
  if (roleNames.includes('no-kimaki')) return false
  // Other bots are opt-in: only the Kimaki role lets them in, never admin rights or --allow-all-users.
  if (member.user.bot) return roleNames.includes('kimaki')
  if (bot.allowAllUsers) return true
  if (member.guild.ownerId === member.id) return true
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true
  return roleNames.includes('kimaki')
}

// Attachments are saved under <dataDir>/attachments/<messageId>/ and sent as
// file:// URIs; OpenCode reads them into the prompt (images are resized there).
async function saveAttachments({
  dataDir,
  messageId,
  attachments,
}: {
  dataDir: string
  messageId: string
  attachments: readonly Attachment[]
}): Promise<AttachmentError | PromptFile[]> {
  if (attachments.length === 0) return []
  const directory = path.join(dataDir, 'attachments', messageId)
  const created = await fs.promises
    .mkdir(directory, { recursive: true })
    .catch((e) => new AttachmentError({ file: directory, cause: e }))
  if (created instanceof Error) return created
  const saved: PromptFile[] = []
  for (const [index, attachment] of attachments.entries()) {
    const bytes = await download(attachment.url)
    if (bytes instanceof Error) return bytes
    // Index prefix: two attachments may share a name.
    const file = path.join(directory, `${index}-${path.basename(attachment.name) || 'attachment'}`)
    const written = await fs.promises
      .writeFile(file, bytes)
      .catch((e) => new AttachmentError({ file: attachment.name, cause: e }))
    if (written instanceof Error) return written
    saved.push({ uri: pathToFileURL(file).href, name: attachment.name })
  }
  return saved
}

class AttachmentError extends errore.createTaggedError({
  name: 'AttachmentError',
  message: 'Could not download attachment $file',
}) {}

async function remotePromptText(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) }).catch((cause) => new AttachmentError({ file: REMOTE_PROMPT_FILE, cause }))
  if (response instanceof Error) return response
  if (!response.ok) return new AttachmentError({ file: REMOTE_PROMPT_FILE, cause: new Error(`HTTP ${response.status}`) })
  return response.text().catch((cause) => new AttachmentError({ file: REMOTE_PROMPT_FILE, cause }))
}

async function download(url: string): Promise<AttachmentError | Buffer> {
  const response = await fetch(url, { signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS) }).catch((e) => new AttachmentError({ file: url, cause: e }))
  if (response instanceof Error) return response
  if (!response.ok) return new AttachmentError({ file: `${url} (HTTP ${response.status})` })
  const body = await response.arrayBuffer().catch((e) => new AttachmentError({ file: url, cause: e }))
  if (body instanceof Error) return body
  return Buffer.from(body)
}

function attachmentLike(attachment: Attachment): AttachmentLike {
  return {
    contentType: attachment.contentType,
    name: attachment.name,
    duration: attachment.duration,
    waveform: attachment.waveform,
    width: attachment.width,
    height: attachment.height,
  }
}

// Voice: transcribe first. The transcription picks the route (spec 9.4).
// The audio bytes come from the caller: the live path downloads before routing
// so a transient failure can be persisted for retry, and the retry path passes
// the saved bytes (a Discord attachment URL must never be fetched again).
async function voiceRoute(
  bot: Bot,
  { messageId, mediaType, audio, directory, inSession }: { messageId: string; mediaType: string; audio: Buffer; directory: string; inSession: boolean },
): Promise<Error | Route> {
  const agents = await primaryAgents(bot, directory)
  if (agents instanceof Error) return agents
  const result = await transcribe({
    db: bot.db,
    token: bot.token,
    opencodeDbFile: bot.opencodeDbFile,
    baseUrls: bot.transcriptionBaseUrls,
    asrAutoStart: bot.asrAutoStart,
    audio,
    mediaType,
    directory,
    // The ID is what switchAgent and session.create take.
    agents: agents.map((agent) => ({ name: agent.id, description: agent.description ?? '' })),
    inSession,
  })
  if (result instanceof Error) return result
  logger.log(`voice message ${messageId} -> ${result.route}${result.agent ? ` (${result.agent})` : ''}`)
  return parseVoiceMessage(result)
}

// Errors a retry can never fix: a missing key, a refusal, silence, and other
// transcription 4xx besides 429 (a revoked key, a bad request) are properties
// of the message or the setup, not of a service that may recover. Everything
// else (transport failures, HTTP 5xx, 429, no provider reachable) is worth
// persisting and retrying later.
function isPermanentTranscriptionError(error: Error): boolean {
  if (
    error instanceof NoTranscriptionKeyError ||
    error instanceof EmptyTranscriptionError ||
    error instanceof TranscriptionBlockedError
  ) {
    return true
  }
  if (error instanceof TranscriptionApiError) {
    const status = Number(error.status)
    return status >= 400 && status < 500 && status !== 429
  }
  return false
}

// A remote send envelope another machine's `kimaki send` posted in a channel this bot owns.
async function handleRemoteEnvelope(bot: Bot, { message, channelId, threadId }: { message: Message; channelId: string; threadId: string | null }) {
  const footer = message.embeds[0]?.footer?.text
  if (!footer?.startsWith(REMOTE_SEND_PREFIX)) return
  const decoded = errore.try(
    () => ({ value: JSON.parse(footer.slice(REMOTE_SEND_PREFIX.length)) as unknown }),
    (cause) => new AttachmentError({ file: 'remote envelope', cause }),
  )
  if (decoded instanceof Error) return
  const value = decoded.value
  if (!value || typeof value !== 'object') return
  if (!('requestId' in value) || typeof value.requestId !== 'string' || !/^[0-9a-f]{16}$/.test(value.requestId)) return
  if (!('options' in value) || !value.options || typeof value.options !== 'object' || Array.isArray(value.options)) return
  const promptInFile = 'promptFile' in value && value.promptFile === REMOTE_PROMPT_FILE
  const first = message.attachments.first()
  const promptAttachment = promptInFile && first?.name === REMOTE_PROMPT_FILE ? first : undefined
  // Never fall back to the truncated preview in the message content.
  const prompt = !promptInFile
    ? message.content
    : promptAttachment
      ? await remotePromptText(promptAttachment.url)
      : new AttachmentError({ file: REMOTE_PROMPT_FILE, cause: new Error('missing from the remote envelope') })
  const target = threadId ? { threadId } : { channelId }
  const input = prompt instanceof Error ? prompt : parseInput(sendInput, { ...value.options, ...target, prompt })
  const attachments = [...message.attachments.values()].filter((attachment) => attachment !== promptAttachment)
  const files = await saveAttachments({ dataDir: bot.dataDir, messageId: message.id, attachments })
  const result = input instanceof Error ? input : files instanceof Error ? files : await send(bot, { ...input, files }, { localOnly: true, shownIn: message.id })
  const answer = JSON.stringify(result instanceof Error ? { error: result.message } : result)
  await message
    .reply({
      content: result instanceof Error ? result.message : `Delivered to <#${result.threadId}>`,
      embeds: [{ footer: { text: `${REMOTE_RESULT_PREFIX}${value.requestId}:${answer}` } }],
      allowedMentions: { parse: [] },
      // The data is in the embed: SuppressEmbeds would hide it.
      flags: MessageFlags.SuppressNotifications,
    })
    .catch((error: Error) => logger.warn(`remote acknowledgment`, error))
}

async function handleMessage(bot: Bot, voiceRetry: FailedVoiceRetry, message: Message) {
  const channel = message.channel
  const thread = channel.isThread() ? channel : null
  const channelId = thread ? thread.parentId : channel.id
  if (!channelId || !message.inGuild()) return

  const project = await projectOf(bot, channelId)
  if (project instanceof Error) return logger.warn(project)
  if (!project) return
  if (project.channel_type === 'voice') {
    // The text chat of the voice channel talks to the running call.
    if (message.author.bot || thread || !(await authorCanUseKimaki(bot, message))) return
    bot.features.voiceCalls.text(bot, {
      guildId: message.guild.id,
      channelId,
      author: { id: message.author.id, username: message.author.username },
      content: message.content,
    })
    return
  }
  if (message.author.id === bot.discord.user?.id) {
    return handleRemoteEnvelope(bot, { message, channelId, threadId: thread?.id ?? null })
  }
  if (!(await authorCanUseKimaki(bot, message))) {
    logger.log(`ignoring ${message.author.username}: no Kimaki permission`)
    return
  }
  // A coordinator channel has its root session under the channel ID.
  const coordinator = !thread && isCoordinatorChannel(bot, channelId)
  const sessionId = bot.store.getState().roots[thread?.id ?? (coordinator ? channelId : '')]
  if (thread && !sessionId) return
  const author = { id: message.author.id, username: message.author.username }
  const reportError = async (error: Error) => {
    logger.error(`message ${message.id} failed`, error)
    await message.reply({ content: formatError(error.message), flags: NOTIFY_MESSAGE_FLAGS }).catch(() => undefined)
  }

  const attachments = [...message.attachments.values()]
  const voice = attachments.find((attachment) => isVoiceAttachment(attachmentLike(attachment)))
  const files = await saveAttachments({
    dataDir: bot.dataDir,
    messageId: message.id,
    attachments: attachments.filter((attachment) => attachment !== voice),
  })
  if (files instanceof Error) return reportError(files)
  const directory = sessionId && voice ? await sessionDirectory(bot, sessionId) : project.directory
  if (directory instanceof Error) return reportError(directory)

  let audio: Buffer | null = null
  let route: Error | Route | null
  if (voice) {
    // Downloaded here so a transient failure can be persisted with the bytes
    // in hand: a retry must never re-download (Discord URLs expire).
    const bytes = await download(voice.url)
    if (bytes instanceof Error) return reportError(bytes)
    audio = bytes
    route = await voiceRoute(bot, { messageId: message.id, mediaType: voiceMediaType(voice), audio, directory, inSession: Boolean(sessionId) })
  } else {
    route = parseTextMessage({ content: message.content }) ?? (files.length > 0 ? { kind: 'steer' as const, text: '' } : null)
  }
  if (route instanceof Error) {
    if (isPermanentTranscriptionError(route) || !audio || !voice) return reportError(route)
    return persistForRetry({ bot, voiceRetry, message, channelId, thread, directory, sessionId, author, voice, files, audio, failure: route })
  }
  if (!route) return
  const delivered = await deliverRoute(bot, {
    message,
    messageId: message.id,
    channelId,
    thread,
    projectDirectory: project.directory,
    author,
    route,
    files,
    voice: Boolean(voice),
  })
  if (delivered instanceof Error) {
    // The audio is already in hand: persisting a delivery failure for retry is
    // strictly better than dropping it. Text has no audio and reports as before.
    if (!audio || !voice) return reportError(delivered)
    return persistForRetry({ bot, voiceRetry, message, channelId, thread, directory, sessionId, author, voice, files, audio, failure: delivered })
  }
}

// The tail of handleMessage, shared with the retry path: a parsed Route becomes
// a session or a prompt. `message` is null during a retry whose original
// message was deleted; every reply is guarded and errors are returned, never
// replied from here.
async function deliverRoute(bot: Bot, input: {
  message: Message | null
  messageId: string
  channelId: string
  thread: ThreadChannel | null
  projectDirectory: string
  author: Author
  route: Route
  files: readonly PromptFile[]
  voice: boolean
}): Promise<Error | void> {
  const { message, messageId, channelId, thread, projectDirectory, author, route, files, voice } = input
  const detail = route.kind === 'command' ? ` /${route.name}` : route.kind === 'skill' ? ` ${route.id}` : ''
  const attached = files.length > 0 ? `, ${files.length} file(s)` : ''
  logger.log(`${route.kind}${detail} from ${author.username} in ${thread ? `thread ${thread.id}` : `channel ${channelId}`}${attached}`)
  // The transcription is not visible anywhere else.
  if (voice && (thread || coordinator) && route.kind !== 'shell' && route.kind !== 'command' && route.kind !== 'skill') {
    // A long transcript continues in more messages after the reply.
    for (const [index, payload] of echoPayloads(formatEcho({ username: author.username, text: route.text })).entries()) {
      const options = { ...payload, allowedMentions: { parse: [] }, flags: ('flags' in payload ? payload.flags : 0) | SILENT_MESSAGE_FLAGS }
      if (index === 0) await message.reply(options)
      else if (channel.isSendable()) await channel.send(options)
    }
  }

  // Coordinator: the channel is the conversation of one long session.
  if (coordinator && channel.type === ChannelType.GuildText) {
    // A spoken agent is for a new thread: the coordinator keeps its own agent and model.
    const result = route.kind === 'new-session' || (route.kind === 'steer' && route.agent)
      ? await startSession(bot, { channelId, directory: project.directory, route: { kind: 'steer', text: route.text, ...(route.agent && { agent: route.agent }) }, author, messageId: message.id, startMessageId: null, files })
      : bot.store.getState().roots[channel.id]
        ? await dispatch(bot, { conversation: channel, route, author, messageId: message.id, files })
        : await startCoordinator(bot, {
            channel,
            // Queue and btw need a session to wait for or fork from: the first input is a plain prompt.
            route: route.kind === 'shell' || route.kind === 'command' || route.kind === 'skill' || route.kind === 'steer' ? route : { kind: 'steer', text: route.text },
            author,
            messageId: message.id,
            files,
          })
    if (result instanceof Error) return reportError(result)
    if (!result || result.threadId === channel.id) return
    const note = route.kind === 'btw' ? `Session forked! Continue in <#${result.threadId}>` : `Started a new session in <#${result.threadId}>`
    await message.reply({ content: note, allowedMentions: { repliedUser: false }, flags: SILENT_MESSAGE_FLAGS }).catch(() => undefined)
    return
  }

  if (!thread) {
    // A channel message starts a session. Queue and btw need one to wait
    // for or fork from: here they are plain prompts.
    const first = route.kind === 'shell' || route.kind === 'command' || route.kind === 'skill' ? route : { ...route, kind: 'steer' as const }
    const started = await startSession(bot, {
      channelId,
      directory: projectDirectory,
      route: first,
      author,
      messageId,
      // A retried message may be gone: the thread then starts without a start
      // message and the input is posted as the first thread message instead.
      startMessageId: message ? messageId : null,
      showInput: message ? voice : true,
      files,
    })
    if (started instanceof Error) return started
    return
  }

  const result = await dispatch(bot, { conversation: thread, route, author, messageId: message.id, files })
  if (result instanceof Error) return reportError(result)
  if (!result) return
  const note =
    route.kind === 'btw' ? `Session forked! Continue in <#${result.threadId}>` : `Started a new session in <#${result.threadId}>`
  await message?.reply({ content: note, allowedMentions: { repliedUser: false }, flags: SILENT_MESSAGE_FLAGS }).catch(() => undefined)
}

// A transient voice failure: the audio and metadata are persisted and the
// retry loop takes over. The user is told a retry will happen. If even the
// save fails, the plain error reply is all that is left.
async function persistForRetry({ bot, voiceRetry, message, channelId, thread, directory, sessionId, author, voice, files, audio, failure }: {
  bot: Bot
  voiceRetry: FailedVoiceRetry
  message: Message
  channelId: string
  thread: ThreadChannel | null
  directory: string
  sessionId: string | undefined
  author: Author
  voice: Attachment
  files: PromptFile[]
  audio: Buffer
  failure: Error
}): Promise<void> {
  const saved = await voiceRetry.save(
    {
      messageId: message.id,
      channelId,
      threadId: thread?.id ?? null,
      author,
      directory,
      inSession: Boolean(sessionId),
      mediaType: voiceMediaType(voice),
      attachmentName: voice.name,
      attachmentUrl: voice.url,
      files,
    },
    audio,
  )
  if (saved instanceof Error) {
    logger.warn(`could not save voice message ${message.id} for retry`, saved)
    await message.reply({ content: formatError(failure.message), flags: NOTIFY_MESSAGE_FLAGS }).catch(() => undefined)
    return
  }
  logger.warn(`voice message ${message.id} failed, saved for retry under ${failedVoiceDir(bot.dataDir)}`, failure)
  await message
    .reply({
      content: `${formatError(failure.message)}\nThe audio is saved and its delivery will be retried automatically.`,
      // The failure text can quote provider error details: never ping anyone.
      allowedMentions: { parse: [] },
      flags: NOTIFY_MESSAGE_FLAGS,
    })
    .catch(() => undefined)
}

// The executor the retry loop calls (failed-voice.ts): the exact voice path of
// handleMessage, with the saved bytes. An Error return keeps the record
// retryable; undefined means delivered and the caller deletes the record.
// Never re-downloads the attachment: Discord URLs expire, the saved audio is
// authoritative.
//
// Delivery is at-least-once, narrowed to exactly-once where the session can be
// asked: a retry reuses the original message id, so its prompt would get the
// same OpenCode inbox id (promptIdForMessage). For a session thread the inbox
// is checked first: a pending item with that id means the first delivery was
// lost on its way back, not on its way in, so the retry skips instead of
// running the prompt twice. The no-thread path (startSession) has no session
// and no inbox to ask yet: if startSession's response was lost after OpenCode
// created the session, a retry starts a rare duplicate thread.
export async function retryFailedVoice(bot: Bot, record: FailedVoiceRecord, audio: Buffer): Promise<Error | void> {
  const project = await projectOf(bot, record.channelId)
  if (project instanceof Error) return project
  if (!project) return new ConfigError({ reason: `channel ${record.channelId} is no longer a project here` })
  let thread: ThreadChannel | null = null
  if (record.threadId) {
    const fetched = await fetchThread(bot, record.threadId)
    if (fetched instanceof Error) return fetched
    thread = fetched
    // The session thread may have been archived while the message waited.
    if (thread.archived) await thread.setArchived(false, 'retrying a failed voice message').catch(() => undefined)
    // The prompt may already be in: the original failure could have been a lost
    // response after OpenCode accepted the prompt. Best-effort check: an inbox
    // error delivers normally, worst case the rare duplicate.
    const sessionId = rootSession(bot, thread.id)
    if (!(sessionId instanceof Error)) {
      const inbox = await oc(bot, 'session.inbox.list', (client) => client.session.inbox.list({ sessionID: sessionId }))
      if (!(inbox instanceof Error) && inbox.some((item) => item.id === promptIdForMessage(record.messageId))) {
        logger.log(`voice message ${record.messageId} is already pending in session ${sessionId}, skipping the duplicate prompt`)
        return
      }
    }
  }
  // A deleted or unfetchable original must not fail the retry: deliverRoute
  // guards every reply. The thread was fetched above; only the no-thread path
  // needs another fetch for the message lookup.
  const channel = thread ?? (await bot.discord.channels.fetch(record.channelId).catch(() => null))
  const message = channel?.isTextBased() ? await channel.messages.fetch(record.messageId).catch(() => null) : null
  const route = await voiceRoute(bot, {
    messageId: record.messageId,
    mediaType: record.mediaType,
    audio,
    directory: record.directory,
    inSession: record.inSession,
  })
  if (route instanceof Error) return route
  return deliverRoute(bot, {
    message,
    messageId: record.messageId,
    channelId: record.channelId,
    thread,
    projectDirectory: project.directory,
    author: record.author,
    route,
    files: record.files,
    voice: true,
  })
}

// Registers the message listeners. Messages of one channel are handled in arrival order:
// a text sent while a voice message is transcribed waits for it (voice-attachments.e2e.test.ts).
export function registerIngress(bot: Bot, voiceRetry?: FailedVoiceRetry) {
  const chains = new Map<string, Promise<void>>()

  function serialize(channelId: string, task: () => Promise<void>) {
    const previous = chains.get(channelId) ?? Promise.resolve()
    const next = previous.then(async () => {
      // gateway-proxy replays messages missed while offline right after READY,
      // often before the OpenCode connection and hydration are done.
      const ready = await bot.opencode.ready
      if (ready instanceof Error) return logger.warn(`ingress skipped, OpenCode not ready`, ready)
      await task().catch((error: Error) => logger.error(`ingress failed`, error))
    })
    chains.set(channelId, next)
  }

  bot.discord.on(Events.MessageCreate, (message) => {
    // Webhooks have no member to check. Own messages only matter as remote send envelopes.
    if (message.webhookId) return
    if (message.author.id === bot.discord.user?.id && !message.embeds[0]?.footer?.text.startsWith(REMOTE_SEND_PREFIX)) return
    if (message.author.bot && !message.embeds[0]?.footer?.text.startsWith(REMOTE_SEND_PREFIX)) return
    serialize(message.channelId, () => handleMessage(bot, voiceRetry, message))
  })
  // Deleting a queued Discord message removes it from the queue.
  bot.discord.on(Events.MessageDelete, (message) => {
    serialize(message.channelId, async () => {
      const item = queuedItemFor(bot, { threadId: message.channelId, messageId: message.id })
      if (!item) return
      const result = await cancelQueuedPrompt(bot, { threadId: message.channelId, inboxID: item.inboxID })
      if (result instanceof Error) logger.warn(`delete of queued ${message.id} failed`, result)
    })
  })
  // Editing a queued message re-queues the new text at the end (spec 9.2.2
  // option A: the inbox has no API to change an item's text).
  bot.discord.on(Events.MessageUpdate, (_old, message) => {
    if (message.author?.bot) return
    serialize(message.channelId, async () => {
      const full = message.partial ? await message.fetch().catch(() => null) : message
      if (!full?.guild || !queuedItemFor(bot, { threadId: full.channelId, messageId: full.id })) return
      if (!(await canUseKimaki(bot, { guild: full.guild, userId: full.author.id }))) return
      // The re-queued prompt must carry the message's attachments again.
      const files = await saveAttachments({ dataDir: bot.dataDir, messageId: full.id, attachments: [...full.attachments.values()] })
      if (files instanceof Error) {
        logger.error(`edit of ${full.id}`, files)
        return
      }
      // Read again: the item may have started while the files were saved.
      const item = queuedItemFor(bot, { threadId: full.channelId, messageId: full.id })
      if (!item) return
      const result = await requeueEdited(bot, { message: full, inboxID: item.inboxID, files })
      if (result instanceof Error) logger.warn(`edit of queued ${full.id} failed`, result)
    })
  })
}
