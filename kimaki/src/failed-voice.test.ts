// Unit: failed voice message persistence and retry scheduling. The Discord
// side is fake: only dataDir, the clock and the injected retry/notify calls
// are exercised, with a manual clock and no timers unless a test asks for one.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import type { Bot } from './bot.ts'
import { backoffDelayMs, createFailedVoiceRetry, type FailedVoiceRecord } from './failed-voice.ts'

let dir: string

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

function manualClock(start: number) {
  const state = { now: start }
  return {
    now: () => state.now,
    set: (ms: number) => {
      state.now = ms
    },
    advance: (ms: number) => {
      state.now += ms
    },
  }
}

const clock = manualClock(1_000_000)
// Fresh per test: dataDir points at the beforeEach temp dir.
let bot: Bot

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'failed-voice-'))
  bot = { dataDir: dir, clock } as unknown as Bot
})

function recordInput(messageId = '111') {
  return {
    messageId,
    channelId: '200',
    threadId: null,
    author: { id: '1', username: 'tommy' },
    directory: '/tmp/project',
    inSession: false,
    mediaType: 'audio/ogg',
    attachmentName: 'voice-message.ogg',
    attachmentUrl: 'https://cdn.discord.example/expired',
    files: [],
  }
}

function recordPath(messageId: string) {
  return path.join(dir, 'failed-voice', messageId)
}

function readMeta(messageId: string): FailedVoiceRecord {
  return JSON.parse(fs.readFileSync(path.join(recordPath(messageId), 'meta.json'), 'utf8')) as FailedVoiceRecord
}

function writeMeta(record: FailedVoiceRecord) {
  fs.mkdirSync(recordPath(record.messageId), { recursive: true })
  fs.writeFileSync(path.join(recordPath(record.messageId), 'audio'), 'audio-bytes')
  fs.writeFileSync(path.join(recordPath(record.messageId), 'meta.json'), JSON.stringify(record))
}

const noDeps = { retry: async () => undefined, notifyGaveUp: async () => undefined }

test('backoff doubles per failed attempt and caps at 30 minutes', () => {
  expect([1, 2, 3, 4, 5, 6].map(backoffDelayMs)).toEqual([60_000, 120_000, 240_000, 480_000, 960_000, 30 * 60_000])
  expect(backoffDelayMs(9)).toBe(30 * 60_000)
  expect(backoffDelayMs(50)).toBe(30 * 60_000)
})

test('save writes the audio before meta.json, the meta as tmp+rename', async () => {
  const retry = createFailedVoiceRetry(bot, noDeps, { pollMs: null })
  const writes: string[] = []
  const renames: Array<[string, string]> = []
  const originalWrite = fs.promises.writeFile
  const originalRename = fs.promises.rename
  const writeSpy = vi.spyOn(fs.promises, 'writeFile').mockImplementation(async (...args: Parameters<typeof originalWrite>) => {
    writes.push(String(args[0]))
    return originalWrite(...args)
  })
  const renameSpy = vi.spyOn(fs.promises, 'rename').mockImplementation(async (...args: Parameters<typeof originalRename>) => {
    renames.push([String(args[0]), String(args[1])])
    return originalRename(...args)
  })
  const saved = await retry.save(recordInput('111'), Buffer.from('audio-bytes'))
  writeSpy.mockRestore()
  renameSpy.mockRestore()
  expect(saved).toBeUndefined()
  // meta.json only ever appears complete: written to a .tmp, renamed over.
  expect(writes.map((file) => path.basename(file))).toEqual(['audio', 'meta.json.tmp'])
  expect(renames).toEqual([[path.join(recordPath('111'), 'meta.json.tmp'), path.join(recordPath('111'), 'meta.json')]])
  expect(fs.readFileSync(path.join(recordPath('111'), 'audio'), 'utf8')).toBe('audio-bytes')
  expect(readMeta('111')).toMatchObject({ messageId: '111', createdAt: 1_000_000, attempts: 0, nextAttemptAt: 1_060_000 })
})

test('runDue retries only records that are due', async () => {
  const attempted: string[] = []
  const retry = createFailedVoiceRetry(bot, { retry: async (_bot, record) => void attempted.push(record.messageId), notifyGaveUp: async () => undefined }, {
    pollMs: null,
    baseDelayMs: 100,
  })
  await retry.save(recordInput('due'), Buffer.from('a'))
  await retry.save(recordInput('later'), Buffer.from('b'))
  const later = readMeta('later')
  writeMeta({ ...later, nextAttemptAt: clock.now() + 10_000 })
  clock.advance(100)
  await retry.runDue()
  expect(attempted).toEqual(['due'])
})

test('a record being retried is not picked up again until its attempt finishes', async () => {
  let release: (() => void) | null = null
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  let calls = 0
  const retry = createFailedVoiceRetry(
    bot,
    {
      retry: async () => {
        calls++
        await gate
      },
      notifyGaveUp: async () => undefined,
    },
    { pollMs: null, baseDelayMs: 0 },
  )
  await retry.save(recordInput('111'), Buffer.from('a'))
  const first = retry.runDue()
  await new Promise((resolve) => setTimeout(resolve, 20))
  await retry.runDue()
  release!()
  await first
  expect(calls).toBe(1)
})

test('a successful retry deletes the record directory', async () => {
  const retry = createFailedVoiceRetry(bot, noDeps, { pollMs: null, baseDelayMs: 0 })
  await retry.save(recordInput('111'), Buffer.from('a'))
  expect(fs.existsSync(recordPath('111'))).toBe(true)
  await retry.runDue()
  expect(fs.existsSync(recordPath('111'))).toBe(false)
})

test('a failed retry backs off exponentially and keeps the audio', async () => {
  const retry = createFailedVoiceRetry(bot, { retry: async () => new Error('still down'), notifyGaveUp: async () => undefined }, {
    pollMs: null,
    baseDelayMs: 0,
  })
  await retry.save(recordInput('111'), Buffer.from('a'))
  await retry.runDue()
  expect(readMeta('111').attempts).toBe(1)
  expect(readMeta('111').nextAttemptAt).toBe(clock.now() + 60_000)
  clock.advance(60_000)
  await retry.runDue()
  expect(readMeta('111').attempts).toBe(2)
  expect(readMeta('111').nextAttemptAt).toBe(clock.now() + 120_000)
  expect(fs.readFileSync(path.join(recordPath('111'), 'audio'), 'utf8')).toBe('a')
})

test('a thrown executor counts as a failed attempt: it backs off and eventually gives up', async () => {
  let calls = 0
  const notified: string[] = []
  const retry = createFailedVoiceRetry(
    bot,
    {
      retry: async () => {
        calls++
        throw new Error('executor exploded')
      },
      notifyGaveUp: async (_bot, record) => void notified.push(record.messageId),
    },
    { pollMs: null, baseDelayMs: 0, giveUpAfterMs: 1_000 },
  )
  await retry.save(recordInput('111'), Buffer.from('a'))
  // First attempt: still inside the give-up window, so it backs off...
  await retry.runDue()
  expect(calls).toBe(1)
  expect(readMeta('111').attempts).toBe(1)
  expect(readMeta('111').nextAttemptAt).toBe(clock.now() + 60_000)
  expect(notified).toEqual([])
  // ...and after the window, the same thrown executor gives up exactly once.
  clock.advance(60_000)
  await retry.runDue()
  expect(calls).toBe(2)
  expect(readMeta('111').attempts).toBe(2)
  expect(readMeta('111').nextAttemptAt).toBeNull()
  expect(notified).toEqual(['111'])
  await retry.runDue()
  expect(calls).toBe(2)
  expect(notified).toEqual(['111'])
})

test('an unreadable audio counts an attempt and backs off instead of spinning', async () => {
  const retry = createFailedVoiceRetry(bot, { retry: async () => undefined, notifyGaveUp: async () => undefined }, {
    pollMs: null,
    baseDelayMs: 0,
  })
  await retry.save(recordInput('111'), Buffer.from('a'))
  fs.rmSync(path.join(recordPath('111'), 'audio'))
  await retry.runDue()
  expect(readMeta('111').attempts).toBe(1)
  expect(readMeta('111').nextAttemptAt).toBe(clock.now() + 60_000)
})

test('a meta write failure holds the record back in memory until it gives up', async () => {
  let calls = 0
  const notified: string[] = []
  const retry = createFailedVoiceRetry(
    bot,
    {
      retry: async () => {
        calls++
        return new Error('still down')
      },
      notifyGaveUp: async (_bot, record) => void notified.push(record.messageId),
    },
    { pollMs: null, baseDelayMs: 0, giveUpAfterMs: 70_000 },
  )
  // The clock carries over from earlier tests in this file: assert relative to
  // the save time, never a literal.
  const savedAt = clock.now()
  await retry.save(recordInput('111'), Buffer.from('a'))
  const original = fs.promises.writeFile
  const spy = vi.spyOn(fs.promises, 'writeFile').mockImplementation(async (...args: Parameters<typeof original>) => {
    if (String(args[0]).endsWith('meta.json.tmp')) throw new Error('EACCES: disk on fire')
    return original(...args)
  })
  try {
    await retry.runDue()
    expect(calls).toBe(1)
    // The disk keeps the stale meta; the backoff lives in memory only.
    expect(readMeta('111').attempts).toBe(0)
    expect(readMeta('111').nextAttemptAt).toBe(savedAt)
    // The in-memory backoff keeps the record quiet before it is due.
    clock.advance(10_000)
    await retry.runDue()
    expect(calls).toBe(1)
    // Due again and past the give-up window: give up, notify once.
    clock.advance(60_000)
    await retry.runDue()
    expect(calls).toBe(2)
    expect(notified).toEqual(['111'])
    clock.advance(10 * 60_000)
    await retry.runDue()
    expect(calls).toBe(2)
    expect(notified).toEqual(['111'])
  } finally {
    spy.mockRestore()
  }
})

test('after the give-up window it notifies once, keeps the directory and stops retrying', async () => {
  let calls = 0
  const notified: string[] = []
  const retry = createFailedVoiceRetry(
    bot,
    {
      retry: async () => {
        calls++
        return new Error('still down')
      },
      notifyGaveUp: async (_bot, record) => void notified.push(record.messageId),
    },
    { pollMs: null, baseDelayMs: 0, giveUpAfterMs: 1_000 },
  )
  await retry.save(recordInput('111'), Buffer.from('a'))
  clock.advance(2_000)
  await retry.runDue()
  expect(notified).toEqual(['111'])
  expect(readMeta('111').attempts).toBe(1)
  expect(readMeta('111').nextAttemptAt).toBeNull()
  expect(fs.existsSync(recordPath('111'))).toBe(true)
  await retry.runDue()
  expect(calls).toBe(1)
  expect(notified).toEqual(['111'])
})

test('a throwing notifyGaveUp is swallowed', async () => {
  const retry = createFailedVoiceRetry(bot, { retry: async () => new Error('still down'), notifyGaveUp: async () => { throw new Error('discord down too') } }, {
    pollMs: null,
    baseDelayMs: 0,
    giveUpAfterMs: 1_000,
  })
  await retry.save(recordInput('111'), Buffer.from('a'))
  clock.advance(2_000)
  await expect(retry.runDue()).resolves.toBeUndefined()
  expect(readMeta('111').nextAttemptAt).toBeNull()
})

test('unparseable or missing meta.json is skipped, never deleted', async () => {
  fs.mkdirSync(recordPath('garbage'), { recursive: true })
  fs.writeFileSync(path.join(recordPath('garbage'), 'meta.json'), '{not json')
  fs.mkdirSync(recordPath('wrongshape'), { recursive: true })
  fs.writeFileSync(path.join(recordPath('wrongshape'), 'meta.json'), JSON.stringify({ messageId: 'wrongshape' }))
  fs.mkdirSync(recordPath('nometa'), { recursive: true })
  fs.writeFileSync(path.join(recordPath('nometa'), 'audio'), 'x')
  const attempted: string[] = []
  const retry = createFailedVoiceRetry(bot, { retry: async (_bot, record) => void attempted.push(record.messageId), notifyGaveUp: async () => undefined }, {
    pollMs: null,
    baseDelayMs: 0,
  })
  await expect(retry.runDue()).resolves.toBeUndefined()
  expect(attempted).toEqual([])
  expect(fs.existsSync(recordPath('garbage'))).toBe(true)
  expect(fs.existsSync(recordPath('wrongshape'))).toBe(true)
  expect(fs.existsSync(recordPath('nometa'))).toBe(true)
})

test('start() re-arms every record, gave-up ones included', async () => {
  writeMeta({ ...recordInput('111'), createdAt: clock.now() - 10 * 3_600_000, attempts: 9, nextAttemptAt: null })
  writeMeta({ ...recordInput('222'), createdAt: clock.now(), attempts: 1, nextAttemptAt: clock.now() - 5_000 })
  const retry = createFailedVoiceRetry(bot, noDeps, { pollMs: null, resumeDelayMs: 5_000 })
  await retry.start()
  await retry.stop()
  expect(readMeta('111').nextAttemptAt).toBe(clock.now() + 5_000)
  expect(readMeta('222').nextAttemptAt).toBe(clock.now() + 5_000)
})

test('start() resets createdAt, so a gave-up record gets a fresh give-up budget', async () => {
  let calls = 0
  const notified: string[] = []
  const retry = createFailedVoiceRetry(
    bot,
    {
      retry: async () => {
        calls++
        return new Error('still down')
      },
      notifyGaveUp: async (_bot, record) => void notified.push(record.messageId),
    },
    { pollMs: null, resumeDelayMs: 5_000, giveUpAfterMs: 60_000 },
  )
  // Gave up long before the restart.
  writeMeta({ ...recordInput('111'), createdAt: clock.now() - 10 * 3_600_000, attempts: 9, nextAttemptAt: null })
  await retry.start()
  await retry.stop()
  expect(readMeta('111').createdAt).toBe(clock.now())
  clock.advance(5_000)
  await retry.runDue()
  // One failed attempt must back off, not instantly re-give-up with a
  // duplicate notice per restart.
  expect(calls).toBe(1)
  expect(notified).toEqual([])
  expect(readMeta('111').attempts).toBe(10)
  // attempts 9 + 1: the capped backoff, not a null nextAttemptAt.
  expect(readMeta('111').nextAttemptAt).toBe(clock.now() + 30 * 60_000)
})

test('the poll timer retries due records until stopped', async () => {
  const attempted: string[] = []
  const retry = createFailedVoiceRetry(bot, { retry: async (_bot, record) => void attempted.push(record.messageId), notifyGaveUp: async () => undefined }, {
    pollMs: 10,
    baseDelayMs: 0,
    // start() must not push the fresh record out of the test's window.
    resumeDelayMs: 0,
  })
  await retry.save(recordInput('111'), Buffer.from('a'))
  await retry.start()
  await vi.waitFor(() => expect(attempted).toEqual(['111']), { timeout: 2_000 })
  expect(fs.existsSync(recordPath('111'))).toBe(false)
  await retry.stop()
})
