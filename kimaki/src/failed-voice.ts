// Failed voice messages: when a voice message cannot be transcribed or
// delivered for a transient reason (OpenCode restarting, a transport error like
// "integration.list failed: fetch failed"), the audio and its metadata are
// persisted under <dataDir>/failed-voice/<messageId>/ and retried in the
// background with exponential backoff. The user is told a retry will happen.
//
//   save ─▶ audio ─▶ meta.json (meta LAST: its presence marks a complete record)
//        └▶ poll ─▶ runDue ─▶ retry(bot, record, audio) ─▶ ok? delete dir : backoff
//
// A restart retries every record again (start() re-arms them), gave-up ones
// included. The retry never re-downloads the attachment: Discord URLs expire,
// the saved audio bytes are authoritative. This module owns persistence and
// scheduling only; the executor lives in ingress.ts and is injected here.

import fs from 'node:fs'
import path from 'node:path'

import * as errore from 'errore'

import { fetchThread, type Bot, type PromptFile } from './bot.ts'
import { formatDuration, NOTIFY_MESSAGE_FLAGS } from './format-parts.ts'
import { createLogger } from './logger.ts'

const logger = createLogger('FAILED-VOICE')

export type FailedVoiceRecord = {
  messageId: string
  channelId: string
  threadId: string | null
  author: { id: string; username: string }
  // Directory passed to voiceRoute originally (the session cwd when in session).
  directory: string
  inSession: boolean
  mediaType: string
  attachmentName: string
  // Debug only: a retry never re-downloads (Discord URLs expire).
  attachmentUrl: string
  // Non-voice attachments saved at the original time.
  files: PromptFile[]
  // Epoch ms.
  createdAt: number
  attempts: number
  // Epoch ms of the next try; null = gave up.
  nextAttemptAt: number | null
}

// What `save` takes; the retry fills the scheduling fields.
export type FailedVoiceInput = Omit<FailedVoiceRecord, 'createdAt' | 'attempts' | 'nextAttemptAt'>

export const GIVE_UP_AFTER_MS = 2 * 60 * 60 * 1000

// Pure: the wait after `failedAttempts` failed tries (1-based).
export function backoffDelayMs(failedAttempts: number): number {
  return Math.min(60_000 * 2 ** (failedAttempts - 1), 30 * 60_000)
}

class FailedVoiceWriteError extends errore.createTaggedError({
  name: 'FailedVoiceWriteError',
  message: 'Could not persist the failed voice message $file',
}) {}

export function failedVoiceDir(dataDir: string): string {
  return path.join(dataDir, 'failed-voice')
}

// meta.json is written to a .tmp and renamed into place: a torn write must
// never leave a half-written meta.json behind, which would brick the record
// forever (records without a parseable meta.json are skipped, never deleted).
// Audio first, meta.json last: a record directory without meta.json is an
// incomplete write (crashed mid-save) and is skipped, never deleted.
async function writeMetaFile(dir: string, record: FailedVoiceRecord): Promise<FailedVoiceWriteError | void> {
  const file = path.join(dir, 'meta.json')
  const tmp = `${file}.tmp`
  const written = await fs.promises.writeFile(tmp, JSON.stringify(record, null, 2)).catch((cause) => new FailedVoiceWriteError({ file, cause }))
  if (written instanceof Error) return written
  return fs.promises.rename(tmp, file).catch((cause) => new FailedVoiceWriteError({ file, cause }))
}

export async function saveFailedVoice({ dataDir, record, audio }: { dataDir: string; record: FailedVoiceRecord; audio: Buffer }): Promise<FailedVoiceWriteError | void> {
  const dir = path.join(failedVoiceDir(dataDir), record.messageId)
  const audioFile = path.join(dir, 'audio')
  const created = await fs.promises.mkdir(dir, { recursive: true }).catch((cause) => new FailedVoiceWriteError({ file: dir, cause }))
  if (created instanceof Error) return created
  const written = await fs.promises.writeFile(audioFile, audio).catch((cause) => new FailedVoiceWriteError({ file: audioFile, cause }))
  if (written instanceof Error) return written
  const meta = await writeMetaFile(dir, record)
  if (meta instanceof Error) return meta
}

function isFailedVoiceRecord(value: unknown): value is FailedVoiceRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  const author = record['author']
  return (
    typeof record['messageId'] === 'string' &&
    typeof record['channelId'] === 'string' &&
    (record['threadId'] === null || typeof record['threadId'] === 'string') &&
    typeof author === 'object' &&
    author !== null &&
    !Array.isArray(author) &&
    typeof (author as Record<string, unknown>)['id'] === 'string' &&
    typeof (author as Record<string, unknown>)['username'] === 'string' &&
    typeof record['directory'] === 'string' &&
    typeof record['inSession'] === 'boolean' &&
    typeof record['mediaType'] === 'string' &&
    typeof record['attachmentName'] === 'string' &&
    typeof record['attachmentUrl'] === 'string' &&
    Array.isArray(record['files']) &&
    typeof record['createdAt'] === 'number' &&
    typeof record['attempts'] === 'number' &&
    (record['nextAttemptAt'] === null || typeof record['nextAttemptAt'] === 'number')
  )
}

function parseRecord(raw: string): FailedVoiceRecord | null {
  const parsed = errore.try(() => JSON.parse(raw) as unknown, () => null)
  return isFailedVoiceRecord(parsed) ? parsed : null
}

async function readRecord(dir: string): Promise<FailedVoiceRecord | null> {
  const raw = await fs.promises.readFile(path.join(dir, 'meta.json'), 'utf8').catch(() => null)
  return raw === null ? null : parseRecord(raw)
}

export type FailedVoiceRetryDeps = {
  // The delivery executor, injected to keep this module free of ingress code.
  // An Error keeps the record retryable; anything else means delivered.
  retry: (bot: Bot, record: FailedVoiceRecord, audio: Buffer) => Promise<Error | void>
  notifyGaveUp: (bot: Bot, record: FailedVoiceRecord) => void | Promise<void>
}

export type FailedVoiceRetryOptions = {
  // null: no timer (tests call runDue themselves). Default 15s.
  pollMs?: number | null
  // Delay of the first retry after a save. Default 60s.
  baseDelayMs?: number
  // Records older than this stop being retried. Default 2h.
  giveUpAfterMs?: number
  // start() re-arms every record at now + this, so a restart does not hammer a
  // service that is still coming up. Default 60s; tests pass a small value.
  resumeDelayMs?: number
}

export function createFailedVoiceRetry(bot: Bot, { retry, notifyGaveUp }: FailedVoiceRetryDeps, options: FailedVoiceRetryOptions = {}) {
  const pollMs = options.pollMs === undefined ? 15_000 : options.pollMs
  const baseDelayMs = options.baseDelayMs ?? 60_000
  const giveUpAfterMs = options.giveUpAfterMs ?? GIVE_UP_AFTER_MS
  const resumeDelayMs = options.resumeDelayMs ?? 60_000
  const inFlight = new Set<string>()
  // Mirrors src/scheduler.ts: the interval loop keeps its in-flight tick so
  // stop() can wait for it.
  const loop: { timer: ReturnType<typeof setInterval> | null; tick: Promise<void> | null } = { timer: null, tick: null }

  // Backoff for records whose meta.json cannot be written (disk full, EACCES):
  // the disk keeps the old, already-due nextAttemptAt, so without this the
  // record would be re-attempted every poll and never count an attempt. Holds
  // attempts too, so even a persistently unwritable record gives up. Giving up
  // cannot be persisted either: a restart re-arms the record, the documented
  // second chance.
  const unpersisted = new Map<string, { attempts: number; nextAttemptAt: number }>()

  async function save(record: FailedVoiceInput, audio: Buffer): Promise<Error | void> {
    const now = bot.clock.now()
    const full: FailedVoiceRecord = { ...record, createdAt: now, attempts: 0, nextAttemptAt: now + baseDelayMs }
    return saveFailedVoice({ dataDir: bot.dataDir, record: full, audio })
  }

  // Every record dir with a parseable meta.json. Unparseable ones are warned
  // about and skipped, never deleted: the audio may still matter to the user.
  async function records(): Promise<Array<{ record: FailedVoiceRecord; dir: string }>> {
    const entries = await fs.promises.readdir(failedVoiceDir(bot.dataDir), { withFileTypes: true }).catch(() => null)
    if (!entries) return []
    const found: Array<{ record: FailedVoiceRecord; dir: string }> = []
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const dir = path.join(failedVoiceDir(bot.dataDir), entry.name)
      const record = await readRecord(dir)
      if (!record) {
        logger.warn(`skipping ${dir}: meta.json is missing or unreadable`)
        continue
      }
      found.push({ record, dir })
    }
    return found
  }

  // One-time startup scan: whatever failed before is due again soon. Gave-up
  // records too: a restart is the documented second chance.
  async function start(): Promise<void> {
    const now = bot.clock.now()
    const found = await records()
    for (const { record, dir } of found) {
      // createdAt resets with the schedule: a gave-up record would otherwise
      // have only just aged out of the give-up window, so one failed attempt
      // would instantly re-give-up and send a duplicate notice per restart.
      // attempts stay: the backoff cap already bounds the wait.
      const meta = await writeMetaFile(dir, { ...record, createdAt: now, nextAttemptAt: now + resumeDelayMs })
      if (meta instanceof Error) logger.warn(`could not re-arm ${dir}`, meta)
    }
    if (found.length > 0) logger.log(`resuming ${found.length} failed voice message(s)`)
    if (pollMs === null) return
    loop.timer = setInterval(tick, pollMs)
  }

  // The shared failed-attempt path: one more attempt counted, backoff or give
  // up, persisted. Never throws.
  async function recordFailure({ record, dir, cause }: { record: FailedVoiceRecord; dir: string; cause: Error }): Promise<void> {
    const now = bot.clock.now()
    const attempts = Math.max(record.attempts, unpersisted.get(record.messageId)?.attempts ?? 0) + 1
    const gaveUp = now - record.createdAt >= giveUpAfterMs
    const updated: FailedVoiceRecord = { ...record, attempts, nextAttemptAt: gaveUp ? null : now + backoffDelayMs(attempts) }
    const meta = await writeMetaFile(dir, updated)
    if (meta instanceof Error) {
      // The write failed, so the disk cannot hold the backoff: keep the record
      // back in memory instead, or it would be retried every poll.
      logger.warn(`could not update ${dir}, holding the record back in memory`, meta)
      unpersisted.set(record.messageId, { attempts, nextAttemptAt: gaveUp ? Number.POSITIVE_INFINITY : updated.nextAttemptAt! })
    } else {
      unpersisted.delete(record.messageId)
    }
    if (!gaveUp) {
      logger.warn(`retry of voice message ${record.messageId} failed (attempt ${attempts}), trying again later`, cause)
      return
    }
    logger.warn(`gave up retrying voice message ${record.messageId} after ${attempts} attempt(s)`, cause)
    try {
      await notifyGaveUp(bot, updated)
    } catch (cause) {
      logger.warn(`gave-up notice for ${record.messageId} failed`, cause instanceof Error ? cause : new Error(String(cause)))
    }
  }

  // One retry attempt of one record. Every step is caught: the poll loop must
  // never see a rejection.
  async function attempt({ record, dir }: { record: FailedVoiceRecord; dir: string }): Promise<void> {
    const audio = await fs.promises.readFile(path.join(dir, 'audio')).catch((cause) => new FailedVoiceWriteError({ file: dir, cause }))
    if (audio instanceof Error) {
      // Unreadable audio can never deliver, but the record must not stay due
      // every poll either: count the attempt and back off like any failure.
      logger.warn(`could not read the saved audio of ${record.messageId}`, audio)
      await recordFailure({ record, dir, cause: audio })
      return
    }
    // A thrown executor is a failed attempt, exactly like a returned Error: an
    // escape here would leave nextAttemptAt in the past and re-attempt the
    // record on every poll without ever counting an attempt.
    const result = await retry(bot, record, audio).catch((cause: unknown) => (cause instanceof Error ? cause : new Error(String(cause))))
    if (!(result instanceof Error)) {
      const removed = await fs.promises.rm(dir, { recursive: true, force: true }).catch((cause) => new FailedVoiceWriteError({ file: dir, cause }))
      if (removed instanceof Error) logger.warn(`delivered ${record.messageId} but could not delete ${dir}`, removed)
      else logger.log(`failed voice message ${record.messageId} delivered after ${record.attempts + 1} attempt(s)`)
      unpersisted.delete(record.messageId)
      return
    }
    await recordFailure({ record, dir, cause: result })
  }

  async function runDue(): Promise<void> {
    const now = bot.clock.now()
    const found = await records()
    for (const entry of found) {
      if (inFlight.has(entry.record.messageId)) continue
      // In-memory scheduling wins: the meta.json of a held record still shows
      // an already-passed nextAttemptAt.
      const held = unpersisted.get(entry.record.messageId)
      const dueAt = held ? held.nextAttemptAt : entry.record.nextAttemptAt
      if (dueAt === null || dueAt > now) continue
      const record = held ? { ...entry.record, attempts: Math.max(entry.record.attempts, held.attempts) } : entry.record
      inFlight.add(record.messageId)
      try {
        await attempt({ record, dir: entry.dir })
      } catch (cause) {
        logger.warn(`retry of ${record.messageId} failed unexpectedly`, cause instanceof Error ? cause : new Error(String(cause)))
      } finally {
        inFlight.delete(record.messageId)
      }
    }
  }

  function tick(): void {
    if (loop.tick) return
    loop.tick = runDue()
      .catch((cause) => logger.error('failed-voice tick errored', cause))
      .finally(() => {
        loop.tick = null
      })
  }

  async function stop(): Promise<void> {
    if (loop.timer) clearInterval(loop.timer)
    loop.timer = null
    await loop.tick
  }

  return { save, start, runDue, stop }
}

export type FailedVoiceRetry = ReturnType<typeof createFailedVoiceRetry>

// The end of the line: the user is told where the audio lives and that a
// restart tries again. Never throws. The thread is tried first; a rejected
// send (archived or deleted thread) falls back to the parent channel.
export async function notifyGaveUpFailedVoice(bot: Bot, record: FailedVoiceRecord): Promise<void> {
  const at = path.join('failed-voice', record.messageId)
  const content = `Gave up retrying the voice message of ${record.author.username} after ${formatDuration(bot.clock.now() - record.createdAt)}.\nThe audio is kept at \`${at}/\`; restarting the bot will try again.`
  const thread = record.threadId ? await fetchThread(bot, record.threadId) : null
  const channel = await bot.discord.channels.fetch(record.channelId).catch(() => null)
  const targets = [
    ...(thread && !(thread instanceof Error) ? [thread] : []),
    // `send` in channel: PartialGroupDMChannel is text-based but cannot be sent to.
    ...(channel && channel.isTextBased() && 'send' in channel ? [channel] : []),
  ]
  // allowedMentions off: the notice quotes provider-controlled error details.
  for (const target of targets) {
    const sent = await target
      .send({ content, allowedMentions: { parse: [] }, flags: NOTIFY_MESSAGE_FLAGS })
      .catch((error: Error) => error)
    if (!(sent instanceof Error)) return
    logger.warn(`gave-up notice for ${record.messageId}`, sent)
  }
  logger.warn(`cannot send the gave-up notice of ${at}: channel ${record.channelId} is not reachable`)
}
