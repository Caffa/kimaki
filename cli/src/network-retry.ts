/**
 * Network error classification and retry helpers.
 *
 * This module is deliberately dependency-free (no discord.js, no logger) so it
 * can be imported from both the bot process (discord-bot.ts) and the CLI
 * runner (cli-runner.ts) without pulling in heavy or cyclic deps.
 *
 * Two notions of "transient":
 *
 * - `isTransientNetworkError` — broad: anything that might clear up on a
 *   retry, including mid-stream resets (ECONNRESET/EPIPE) and TLS/cert blips.
 *   Used to decide whether to restart the bot on login failure.
 *
 * - `isNetworkUnreachableError` — narrow: errors that mean the request never
 *   left the machine (DNS resolution failed, no route to host, connection
 *   refused/timeout before send). Retrying these is safe even for
 *   non-idempotent operations such as `message.startThread`, because the
 *   server never saw the original request.
 */

/** Broad set of transient errors (DNS down, gateway unreachable, TLS blips, mid-stream resets). */
const TRANSIENT_ERROR_CODES = new Set([
  'ENOTFOUND',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'ECONNRESET',
  'EAI_AGAIN',
  'EPIPE',
  'EHOSTUNREACH',
  'ENETUNREACH',
  // TLS/cert errors can be transient (intermediate CA blip, MITM proxy, cert rotation).
  // Without these, Discord login failure exits EXIT_NO_RESTART and the bin wrapper
  // never restarts — the bot dies permanently on "unable to verify the first certificate".
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY',
  'CERT_SIGNATURE_FAILURE',
  'CERT_NOT_YET_VALID',
  'CERT_HAS_EXPIRED',
  'CRL_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'ERR_TLS_CERT_ALTNAME_INVALID',
])

const TRANSIENT_ERROR_MESSAGE_PATTERNS = [
  /unable to verify the first certificate/i,
  /certificate has expired/i,
  /self[- ]signed certificate/i,
  /unable to get local issuer certificate/i,
]

/**
 * Broad transient check. Returns true for DNS failures, connection resets,
 * and TLS/cert blips. Walks discord.js `cause` chains.
 */
export function isTransientNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const code = (error as NodeJS.ErrnoException).code
  if (code && TRANSIENT_ERROR_CODES.has(code)) return true
  // Fallback when code is stripped by wrappers (discord.js sometimes rethrows by message only).
  if (
    TRANSIENT_ERROR_MESSAGE_PATTERNS.some((pattern) =>
      pattern.test(error.message),
    )
  ) {
    return true
  }
  // discord.js wraps errors in cause chains
  if (error.cause instanceof Error) return isTransientNetworkError(error.cause)
  return false
}

/**
 * Narrow "request never reached the server" set. These are the codes where
 * retrying a non-idempotent REST call (e.g. startThread) is safe because the
 * original request could not have been applied server-side.
 *
 * Note: ETIMEDOUT is deliberately excluded. It can occur at connect phase
 * (safe to retry) OR read phase (request was sent, server may have applied
 * it — retrying non-idempotent calls could create duplicates). Since the
 * realistic failure we are fixing is DNS (ENOTFOUND/EAI_AGAIN), we keep the
 * non-idempotent set conservative. ETIMEDOUT still qualifies as broadly
 * transient (isTransientNetworkError) so bot-login restart logic is intact.
 */
const NETWORK_UNREACHABLE_CODES = new Set([
  'ENOTFOUND', // DNS lookup failed (hostname does not resolve right now)
  'EAI_AGAIN', // DNS temporary failure (retry later)
  'EAI_NONAME', // DNS name does not exist
  'ENODATA', // DNS server returned no answer
  'ECONNREFUSED', // nothing listening at the target (never reached)
  'EHOSTUNREACH', // no route to host (never reached)
  'ENETUNREACH', // network is unreachable (never reached)
])

/**
 * Returns true for errors that mean the request never left the host machine
 * (DNS failure, no route, connection refused/timeout before send). Safe to
 * retry even non-idempotent operations. Walks discord.js `cause` chains.
 */
export function isNetworkUnreachableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  let current: unknown = error
  while (current instanceof Error) {
    const code = (current as NodeJS.ErrnoException).code
    if (code && NETWORK_UNREACHABLE_CODES.has(code)) return true
    current = (current as { cause?: unknown }).cause
  }
  return false
}

/** Internal sleep helper, replaced in tests. */
let sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/** @internal Exposed for tests to avoid real timers. */
export function __setSleepForTests(
  impl: (ms: number) => Promise<void>,
): () => void {
  const original = sleep
  sleep = impl
  return () => {
    sleep = original
  }
}

export interface NetworkRetryOptions {
  /** Number of retries after the initial attempt. Default 2. */
  retries?: number
  /** Base delay in ms for exponential backoff (delay ≈ baseDelay * 2^attempt ± 25% jitter). Default 500. */
  baseDelayMs?: number
  /** Optional hook invoked before each retry sleep. */
  onRetry?: (info: { attempt: number; error: unknown; delayMs: number }) => void
}

/**
 * Runs `fn`, retrying it when {@link isNetworkUnreachableError} returns true
 * for the thrown error. Uses exponential backoff with ±25% jitter.
 *
 * Only "request never reached the server" errors are retried, so this is safe
 * to wrap around non-idempotent REST calls (thread creation, member adds). The
 * original error is re-thrown unchanged once retries are exhausted or a
 * non-network-unreachable error is encountered.
 */
export async function withNetworkRetry<T>(
  fn: () => Promise<T>,
  opts: NetworkRetryOptions = {},
): Promise<T> {
  const retries = opts.retries ?? 2
  const baseDelay = opts.baseDelayMs ?? 500
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === retries || !isNetworkUnreachableError(error)) {
        throw error
      }
      // Exponential backoff with jitter so concurrent retries don't thunder.
      const delayMs = Math.round(
        baseDelay * Math.pow(2, attempt) * (0.75 + Math.random() * 0.5),
      )
      opts.onRetry?.({ attempt: attempt + 1, error, delayMs })
      await sleep(delayMs)
    }
  }
  // Unreachable — the loop either returns or throws — but keeps TS happy.
  throw lastError
}

/**
 * Formats an error for display to Discord users, surfacing a friendlier
 * message for network-class failures while still echoing the underlying
 * detail so the user (and we) can diagnose it.
 */
export function formatFriendlyErrorMessage(error: unknown): string {
  const raw = (
    error instanceof Error ? error.message : String(error)
  ).slice(0, 1700)
  if (isNetworkUnreachableError(error)) {
    return `Network error reaching Discord — please retry in a moment. (${raw})`
  }
  if (isTransientNetworkError(error)) {
    return `Connection error to Discord — please retry in a moment. (${raw})`
  }
  return raw
}