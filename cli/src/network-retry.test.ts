import { describe, expect, test, vi } from 'vitest'
import {
  __setSleepForTests,
  formatFriendlyErrorMessage,
  isNetworkUnreachableError,
  isTransientNetworkError,
  withNetworkRetry,
} from './network-retry.js'

function netError(message: string, code: string): Error {
  return Object.assign(new Error(message), { code })
}

describe('isTransientNetworkError', () => {
  test('returns true for socket/DNS codes', () => {
    expect(isTransientNetworkError(netError('getaddrinfo ENOTFOUND', 'ENOTFOUND'))).toBe(true)
    expect(isTransientNetworkError(netError('connect ETIMEDOUT', 'ETIMEDOUT'))).toBe(true)
    expect(isTransientNetworkError(netError('socket hang up', 'ECONNRESET'))).toBe(true)
    expect(isTransientNetworkError(netError('write EPIPE', 'EPIPE'))).toBe(true)
  })

  test('treats TLS leaf verification failures as transient', () => {
    const error = Object.assign(new Error('unable to verify the first certificate'), {
      code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    })
    expect(isTransientNetworkError(error)).toBe(true)
  })

  test('matches TLS cert failures by message when code is missing', () => {
    expect(
      isTransientNetworkError(new Error('unable to verify the first certificate')),
    ).toBe(true)
  })

  test('walks cause chains for nested TLS errors', () => {
    const cause = Object.assign(new Error('unable to verify the first certificate'), {
      code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    })
    expect(isTransientNetworkError(new Error('Discord login failed', { cause }))).toBe(true)
  })

  test('keeps fatal auth-style errors non-transient', () => {
    expect(isTransientNetworkError(new Error('An invalid token was provided.'))).toBe(false)
    expect(isTransientNetworkError(new Error('Used disallowed intents'))).toBe(false)
  })

  test('returns false for non-Error inputs', () => {
    expect(isTransientNetworkError(undefined)).toBe(false)
    expect(isTransientNetworkError('ENOTFOUND')).toBe(false)
    expect(isTransientNetworkError({ code: 'ENOTFOUND' })).toBe(false)
  })
})

describe('isNetworkUnreachableError', () => {
  test('detects "request never reached server" codes', () => {
    expect(isNetworkUnreachableError(netError('getaddrinfo ENOTFOUND discord.com', 'ENOTFOUND'))).toBe(true)
    expect(isNetworkUnreachableError(netError('getaddrinfo EAI_AGAIN', 'EAI_AGAIN'))).toBe(true)
    expect(isNetworkUnreachableError(netError('connect ECONNREFUSED', 'ECONNREFUSED'))).toBe(true)
    expect(isNetworkUnreachableError(netError('connect EHOSTUNREACH', 'EHOSTUNREACH'))).toBe(true)
    expect(isNetworkUnreachableError(netError('connect ENETUNREACH', 'ENETUNREACH'))).toBe(true)
  })

  test('does NOT treat ETIMEDOUT as unreachable (ambiguous: connect vs read phase)', () => {
    // ETIMEDOUT can mean the request was sent but no response arrived (read phase),
    // so retrying a non-idempotent call like startThread could create a duplicate.
    // It stays in the broad transient set (isTransientNetworkError) for login-restart.
    const err = netError('connect ETIMEDOUT 162.159.128.233:443', 'ETIMEDOUT')
    expect(isNetworkUnreachableError(err)).toBe(false)
    expect(isTransientNetworkError(err)).toBe(true)
  })

  test('walks discord.js cause chains', () => {
    const cause = netError('getaddrinfo ENOTFOUND discord.com', 'ENOTFOUND')
    expect(isNetworkUnreachableError(new Error('Request failed', { cause }))).toBe(true)
  })

  test('does NOT treat mid-stream resets as unreachable (not safe for non-idempotent retry)', () => {
    expect(isNetworkUnreachableError(netError('socket hang up', 'ECONNRESET'))).toBe(false)
    expect(isNetworkUnreachableError(netError('write EPIPE', 'EPIPE'))).toBe(false)
    expect(isNetworkUnreachableError(netError('unable to verify the first certificate', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'))).toBe(false)
  })

  test('returns false for non-network errors and non-Error inputs', () => {
    expect(isNetworkUnreachableError(new Error('An invalid token was provided.'))).toBe(false)
    expect(isNetworkUnreachableError(undefined)).toBe(false)
    expect(isNetworkUnreachableError({ code: 'ENOTFOUND' })).toBe(false)
  })
})

describe('withNetworkRetry', () => {
  test('returns the result on first success without retrying', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const restore = __setSleepForTests(async () => {})
    try {
      await expect(withNetworkRetry(fn)).resolves.toBe('ok')
      expect(fn).toHaveBeenCalledTimes(1)
    } finally {
      restore()
    }
  })

  test('retries on network-unreachable errors until success', async () => {
    const restore = __setSleepForTests(async () => {})
    try {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(netError('getaddrinfo ENOTFOUND discord.com', 'ENOTFOUND'))
        .mockRejectedValueOnce(netError('getaddrinfo EAI_AGAIN', 'EAI_AGAIN'))
        .mockResolvedValueOnce('ok')
      await expect(withNetworkRetry(fn)).resolves.toBe('ok')
      expect(fn).toHaveBeenCalledTimes(3)
    } finally {
      restore()
    }
  })

  test('rethrows the original error once retries are exhausted', async () => {
    const restore = __setSleepForTests(async () => {})
    const onRetry = vi.fn()
    try {
      const original = netError('getaddrinfo ENOTFOUND discord.com', 'ENOTFOUND')
      const fn = vi.fn().mockRejectedValue(original)
      await expect(
        withNetworkRetry(fn, { retries: 1, baseDelayMs: 1, onRetry }),
      ).rejects.toBe(original)
      expect(fn).toHaveBeenCalledTimes(2) // initial + 1 retry
      expect(onRetry).toHaveBeenCalledTimes(1)
      const retryInfo = onRetry.mock.calls[0]?.[0]
      expect(retryInfo).toMatchObject({ attempt: 1, error: original })
      expect(retryInfo?.delayMs).toBeGreaterThan(0)
    } finally {
      restore()
    }
  })

  test('does NOT retry non-network-unreachable errors (does not retry mid-stream resets)', async () => {
    const restore = __setSleepForTests(async () => {})
    try {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(netError('socket hang up', 'ECONNRESET'))
      await expect(withNetworkRetry(fn, { retries: 3 })).rejects.toThrow('socket hang up')
      expect(fn).toHaveBeenCalledTimes(1)
    } finally {
      restore()
    }
  })

  test('does not retry non-network errors', async () => {
    const restore = __setSleepForTests(async () => {})
    try {
      const fn = vi.fn().mockRejectedValue(new Error('Invalid token'))
      await expect(withNetworkRetry(fn)).rejects.toThrow('Invalid token')
      expect(fn).toHaveBeenCalledTimes(1)
    } finally {
      restore()
    }
  })

  test('retries errors nested in a discord.js cause chain', async () => {
    const restore = __setSleepForTests(async () => {})
    try {
      const cause = netError('getaddrinfo ENOTFOUND discord.com', 'ENOTFOUND')
      const wrapped = new Error('Request failed', { cause })
      const fn = vi
        .fn()
        .mockRejectedValueOnce(wrapped)
        .mockResolvedValueOnce(42)
      await expect(withNetworkRetry(fn)).resolves.toBe(42)
      expect(fn).toHaveBeenCalledTimes(2)
    } finally {
      restore()
    }
  })

  test('honours retries: 0 option (no retries, single attempt)', async () => {
    const restore = __setSleepForTests(async () => {})
    try {
      const fn = vi
        .fn()
        .mockRejectedValue(netError('getaddrinfo ENOTFOUND', 'ENOTFOUND'))
      await expect(withNetworkRetry(fn, { retries: 0 })).rejects.toThrow('getaddrinfo')
      expect(fn).toHaveBeenCalledTimes(1)
    } finally {
      restore()
    }
  })

  test('actually sleeps between attempts using the real (mocked) timer', async () => {
    const sleepMock = vi.fn().mockResolvedValue(undefined)
    const restore = __setSleepForTests(sleepMock)
    try {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(netError('getaddrinfo ENOTFOUND', 'ENOTFOUND'))
        .mockResolvedValueOnce('ok')
      await withNetworkRetry(fn, { retries: 2, baseDelayMs: 100 })
      expect(sleepMock).toHaveBeenCalledTimes(1)
      // delay ≈ 100 * 2^0 * (0.75..1.25) → 75..125
      const delay = sleepMock.mock.calls[0]?.[0]
      expect(delay).toBeGreaterThanOrEqual(75)
      expect(delay).toBeLessThanOrEqual(125)
    } finally {
      restore()
    }
  })
})

describe('formatFriendlyErrorMessage', () => {
  test('friendly message for network-unreachable errors, keeps underlying detail', () => {
    const msg = formatFriendlyErrorMessage(
      netError('getaddrinfo ENOTFOUND discord.com', 'ENOTFOUND'),
    )
    expect(msg).toContain('Network error reaching Discord')
    expect(msg).toContain('getaddrinfo ENOTFOUND discord.com')
  })

  test('friendly message for other transient (e.g. TLS) errors', () => {
    const msg = formatFriendlyErrorMessage(
      Object.assign(new Error('unable to verify the first certificate'), {
        code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      }),
    )
    expect(msg).toContain('Connection error to Discord')
    expect(msg).toContain('unable to verify the first certificate')
  })

  test('raw message for non-network errors (no friendly prefix)', () => {
    expect(formatFriendlyErrorMessage(new Error('An invalid token was provided.'))).toBe(
      'An invalid token was provided.',
    )
  })

  test('handles non-Error inputs', () => {
    expect(formatFriendlyErrorMessage('boom')).toBe('boom')
    expect(formatFriendlyErrorMessage(undefined)).toBe('undefined')
  })

  test('stays well under the 2000-char Discord limit even with a long message', () => {
    const long = 'x'.repeat(5000)
    const msg = formatFriendlyErrorMessage(netError(long, 'ENOTFOUND'))
    expect(msg.length).toBeLessThan(2000)
    expect(msg).toContain('Network error reaching Discord')
  })
})