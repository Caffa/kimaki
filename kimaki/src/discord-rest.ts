// Caps pathological rate-limit waits at the HTTP layer.
//
// A 429 whose Retry-After is hours long (e.g. Discord's daily guild-command
// create budget, or a proxy's fixed-window limiter) makes @discordjs/rest sleep
// that long inside the request — no timeout applies, nothing is logged, and
// anything awaiting the call (slash command registration) hangs for hours.
// Clamping the header to a sane value keeps the limiter cycling: each retry
// re-checks, and the request succeeds as soon as the limit actually resets.
import { REST, type RESTOptions } from 'discord.js'

// Discord's legitimate long 429s (daily budgets) reset within minutes of the
// hour; retrying every minute is cheap and self-heals at the reset.
const MAX_RETRY_AFTER_S = 60

const defaultMakeRequest = new REST().options.makeRequest

export const cappedMakeRequest: RESTOptions['makeRequest'] = async (url, init) => {
  const res = await defaultMakeRequest(url, init)
  if (res.status !== 429) return res
  const retryAfter = Number(res.headers.get('retry-after') ?? 0)
  if (!(retryAfter > MAX_RETRY_AFTER_S)) return res
  const headers = new Headers(res.headers)
  headers.set('retry-after', String(MAX_RETRY_AFTER_S))
  headers.set('x-ratelimit-reset-after', String(MAX_RETRY_AFTER_S))
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers })
}
