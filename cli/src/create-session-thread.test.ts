// Unit tests for the thread-creation helper extracted from the MessageCreate
// handler. These exercise the real retry path (createSessionThread ->
// withNetworkRetry -> message.startThread) using a stub discord.js Message,
// without booting the full handler (which closes over many module-level
// stores and a live opencode server).
//
// We avoid importing from 'discord.js' at the top level so this test stays a
// fast, dependency-light unit test. Only structural bits (the startThread
// method + a members object + an author id) are stubbed to the minimum the
// helper touches.

import { describe, expect, test, vi } from 'vitest'
import { createSessionThread } from './discord-bot.js'

/** A minimal stub of discord.js ThreadChannel returned by startThread. */
function makeStubThread(overrides: Partial<{ id: string; name: string }> = {}) {
  return {
    id: 'thread_123',
    name: 'test thread',
    members: { add: vi.fn().mockResolvedValue(undefined) },
    ...overrides,
  }
}

/**
 * A minimal stub of discord.js Message for thread-creation purposes.
 * Does NOT set any default startThread behavior; each test owns its mock
 * resolution/rejection so a helper-side `mockResolvedValue` can't override a
 * test's `mockRejectedValue` permanent default.
 */
function makeStubMessage(startThread: ReturnType<typeof vi.fn>) {
  return {
    startThread,
    author: { id: 'user_1' },
  } as unknown as Parameters<typeof createSessionThread>[0]['message']
}

function netError(message: string, code: string): Error {
  return Object.assign(new Error(message), { code })
}

describe('createSessionThread', () => {
  test('creates a thread on the first successful startThread call', async () => {
    const thread = makeStubThread()
    const startThread = vi.fn().mockResolvedValue(thread)
    const message = makeStubMessage(startThread)

    const result = await createSessionThread({
      message,
      threadName: 'my session',
    })

    expect(result).toBe(thread)
    expect(startThread).toHaveBeenCalledTimes(1)
    expect(startThread).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my session',
        reason: 'Start Claude session',
      }),
    )
  })

  test('truncates long thread names to 80 chars (Discord limit)', async () => {
    const startThread = vi.fn().mockResolvedValue(makeStubThread())
    const message = makeStubMessage(startThread)
    const longName = 'x'.repeat(200)

    await createSessionThread({ message, threadName: longName })

    expect(startThread).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'x'.repeat(80) }),
    )
  })

  test('retries startThread when Discord REST fails with ENOTFOUND (DNS blip)', async () => {
    const thread = makeStubThread({ id: 'thread_retry', name: 'retry thread' })
    const startThread = vi
      .fn()
      .mockRejectedValueOnce(netError('getaddrinfo ENOTFOUND discord.com', 'ENOTFOUND'))
      .mockResolvedValueOnce(thread)
    const message = makeStubMessage(startThread)

    const result = await createSessionThread({
      message,
      threadName: 'retry session',
    })

    expect(result).toBe(thread)
    expect(startThread).toHaveBeenCalledTimes(2)
  })

  test('retries recursively through discord.js cause chains (undici wraps DNS errors)', async () => {
    // undici raises `TypeError: fetch failed` with error.cause set to the
    // original Node DNS error. discord.js rethrows it as-is.
    const cause = netError('getaddrinfo ENOTFOUND discord.com', 'ENOTFOUND')
    const wrapped = new TypeError('fetch failed', { cause })
    const thread = makeStubThread({ id: 'thread_cause', name: 'cause thread' })
    const startThread = vi
      .fn()
      .mockRejectedValueOnce(wrapped)
      .mockResolvedValueOnce(thread)
    const message = makeStubMessage(startThread)

    const result = await createSessionThread({
      message,
      threadName: 'cause session',
    })

    expect(result).toBe(thread)
    expect(startThread).toHaveBeenCalledTimes(2)
  })

  test('does NOT retry non-network errors (e.g. invalid token / 4xx)', async () => {
    const original = new Error('Invalid Form Body')
    const startThread = vi.fn().mockRejectedValue(original)
    const message = makeStubMessage(startThread)

    await expect(
      createSessionThread({ message, threadName: 'bad' }),
    ).rejects.toBe(original)
    expect(startThread).toHaveBeenCalledTimes(1)
  })

  test('does NOT retry ambiguous read-phase errors that could have reached the server', async () => {
    // ETIMEDOUT during read phase means the request may have been applied ->
    // retrying a non-idempotent startThread could create a duplicate thread.
    // It stays in the broad transient set so bot-login restart logic still fires.
    const original = netError('connect ETIMEDOUT 162.159.128.233:443', 'ETIMEDOUT')
    const startThread = vi.fn().mockRejectedValue(original)
    const message = makeStubMessage(startThread)

    await expect(
      createSessionThread({ message, threadName: 'timeout' }),
    ).rejects.toBe(original)
    expect(startThread).toHaveBeenCalledTimes(1)
  })

  test('does NOT retry mid-stream ECONNRESET (discord.js already retries that internally)', async () => {
    // ECONNRESET means the socket died mid-stream; the request likely reached
    // the server. discord.js's own shouldRetry() handles ECONNRESET, so we
    // must not double-retry a non-idempotent call here.
    const original = netError('socket hang up', 'ECONNRESET')
    const startThread = vi.fn().mockRejectedValue(original)
    const message = makeStubMessage(startThread)

    await expect(
      createSessionThread({ message, threadName: 'reset' }),
    ).rejects.toBe(original)
    expect(startThread).toHaveBeenCalledTimes(1)
  })

  test('rethrows the original error after exhausting retries on persistent DNS failure', async () => {
    const original = netError('getaddrinfo EAI_NONAME', 'EAI_NONAME')
    const startThread = vi.fn().mockRejectedValue(original)
    const message = makeStubMessage(startThread)

    await expect(
      createSessionThread({ message, threadName: 'persistent dns' }),
    ).rejects.toBe(original)
    // default retries: 2 => initial attempt + 2 retries = 3 calls total
    expect(startThread).toHaveBeenCalledTimes(3)
  })

  test('logs the thread creation attempt when a logger is provided', async () => {
    const startThread = vi.fn().mockResolvedValue(makeStubThread())
    const message = makeStubMessage(startThread)
    const logger = { log: vi.fn(), warn: vi.fn() }

    await createSessionThread({
      message,
      threadName: 'logged session',
      logger,
    })

    expect(logger.log).toHaveBeenCalledTimes(1)
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('logged session'),
    )
  })
})