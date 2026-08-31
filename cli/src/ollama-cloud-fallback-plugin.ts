// OpenCode plugin that falls back sessions from Ollama Cloud to the free
// opencode/big-pickle model when budget/rate-limit/outage errors occur.
//
// Detects errors from Ollama Cloud (https://ollama.com/v1) on the event stream:
// - HTTP 402 Payment Required → immediate fallback (quota/billing exhausted)
// - HTTP 429 Too Many Requests → fallback only after retry/backoff exhaustion
// - HTTP 502/503 → fallback only after retry/backoff exhaustion
// - Text patterns in error messages also trigger fallback
//
// Only sessions whose current model starts with "ollama-cloud/" are eligible.
// Once a session has fallen back, it is never re-upgraded for that session to
// prevent fallback loops.
//
// This plugin does NOT write opencode.json or restart the server. It switches
// the active session model via per-prompt model override and updates the
// directory default via client.config.update so new prompts avoid the cloud.

import type { Hooks, Plugin } from '@opencode-ai/plugin'
import type { Part } from '@opencode-ai/sdk/v2'

import { createPluginLogger, appendToastSessionMarker } from './plugin-logger.js'
import { createPluginClient } from './plugin-opencode-client.js'
import { initSentry, notifyError } from './sentry.js'

const logger = createPluginLogger('OLLAMAFB')

const FREE_MODEL_PROVIDER = 'opencode'
const FREE_MODEL_ID = 'big-pickle'
const FREE_MODEL_STRING = `${FREE_MODEL_PROVIDER}/${FREE_MODEL_ID}`

const BUDGET_TEXT_PATTERNS = [
  'rate_limit',
  'rate limit',
  'resource exhausted',
  'retry after',
  'too many requests',
  'quota exceeded',
  'insufficient_quota',
  'insufficient quota',
  'payment required',
  'billing',
  'credit',
  'budget',
  'exceeded',
  'extra usage',
] as const

const IMMEDIATE_FALLBACK_STATUS_CODES = [402] as const
const RETRY_THEN_FALLBACK_STATUS_CODES = [429, 502, 503] as const

const OLLAMA_CLOUD_PROVIDER_PREFIX = 'ollama-cloud/'

const FALLBACK_TOAST =
  'Ollama Cloud budget hit — switched to the free model for this session. Run /connect-ollama again after topping up.'

type PluginEvent = Parameters<NonNullable<Hooks['event']>>[0]['event']

function isBudgetText(text: string | undefined): boolean {
  if (!text) {
    return false
  }

  const haystack = text.toLowerCase()
  return BUDGET_TEXT_PATTERNS.some((pattern) => {
    return haystack.includes(pattern)
  })
}

function getEventSessionId(event: PluginEvent): string | undefined {
  if (event.type === 'session.status' || event.type === 'session.idle') {
    return event.properties.sessionID
  }
  if (event.type === 'session.error') {
    return event.properties.sessionID
  }
  if (event.type === 'message.updated') {
    return event.properties.info.sessionID
  }
  if (event.type === 'message.part.updated') {
    return event.properties.part.sessionID
  }
  if (
    event.type === 'session.created'
    || event.type === 'session.updated'
    || event.type === 'session.deleted'
  ) {
    return event.properties.info.id
  }
  return undefined
}

function getEventModel(event: PluginEvent): string | undefined {
  if (
    (event.type === 'session.created' || event.type === 'session.updated')
    && 'model' in event.properties.info
    && typeof event.properties.info.model === 'string'
  ) {
    return event.properties.info.model
  }

  if (
    event.type === 'message.updated'
    && 'model' in event.properties.info
    && typeof event.properties.info.model === 'string'
  ) {
    return event.properties.info.model
  }

  if (
    event.type === 'message.part.updated'
    && 'model' in event.properties.part
    && typeof event.properties.part.model === 'string'
  ) {
    return event.properties.part.model
  }

  return undefined
}

function isOllamaCloudModel(model: string | undefined): boolean {
  return typeof model === 'string' && model.startsWith(OLLAMA_CLOUD_PROVIDER_PREFIX)
}

/**
 * Decide whether an event is a budget error for an Ollama Cloud session.
 * Returns the human-readable reason if it is, otherwise undefined.
 */
function extractBudgetErrorReason(event: PluginEvent): string | undefined {
  if (event.type === 'session.status' && event.properties.status.type === 'retry') {
    if (isBudgetText(event.properties.status.message)) {
      return event.properties.status.message
    }
    return undefined
  }

  if (event.type === 'message.part.updated' && event.properties.part.type === 'retry') {
    const retryError = event.properties.part.error
    const statusCode = retryError.data?.statusCode
    const responseBody = retryError.data?.responseBody
    const message = retryError.data?.message

    if (
      typeof statusCode === 'number'
      && IMMEDIATE_FALLBACK_STATUS_CODES.includes(statusCode as typeof IMMEDIATE_FALLBACK_STATUS_CODES[number])
    ) {
      return message || responseBody || `HTTP ${statusCode}`
    }
    if (isBudgetText(responseBody)) {
      return responseBody
    }
    if (isBudgetText(message)) {
      return message
    }
    return undefined
  }

  const apiError = (() => {
    if (event.type === 'session.error' && event.properties.error?.name === 'APIError') {
      return event.properties.error.data
    }
    if (
      event.type === 'message.updated'
      && event.properties.info.role === 'assistant'
      && event.properties.info.error?.name === 'APIError'
    ) {
      return event.properties.info.error.data
    }
    return undefined
  })()

  if (!apiError) {
    return undefined
  }

  const statusCode = apiError.statusCode
  const responseBody = apiError.responseBody
  const message = apiError.message

  if (
    typeof statusCode === 'number'
    && IMMEDIATE_FALLBACK_STATUS_CODES.includes(statusCode as typeof IMMEDIATE_FALLBACK_STATUS_CODES[number])
  ) {
    return message || responseBody || `HTTP ${statusCode}`
  }

  if (
    typeof statusCode === 'number'
    && RETRY_THEN_FALLBACK_STATUS_CODES.includes(statusCode as typeof RETRY_THEN_FALLBACK_STATUS_CODES[number])
  ) {
    // Only fall back if the error is explicitly budget-related by text.
    // Plain 429/502/503 can be transient; the user should retry first.
    if (isBudgetText(responseBody) || isBudgetText(message)) {
      return responseBody || message || `HTTP ${statusCode}`
    }
  }

  if (isBudgetText(responseBody)) {
    return responseBody
  }
  if (isBudgetText(message)) {
    return message
  }
  return undefined
}

export const ollamaCloudFallbackPlugin: Plugin = async ({ serverUrl, directory }) => {
  initSentry()

  const dataDir = process.env.KIMAKI_DATA_DIR
  if (dataDir) {
    // Reuse existing plugin log path convention if available.
    const { setPluginLogFilePath } = await import('./plugin-logger.js')
    setPluginLogFilePath(dataDir)
  }

  const client = createPluginClient({ serverUrl, directory })
  logger.bindClient(client)

  // Sessions currently known to be using an ollama-cloud/* model.
  const ollamaSessions = new Map<string, { model: string }>()
  // Sessions that have already fallen back this session lifetime.
  const fallenBackSessions = new Set<string>()

  async function getLastUserMessage(sessionId: string): Promise<
    | { type: 'text'; text: string }
    | undefined
  > {
    try {
      const response = await client.session.messages({ sessionID: sessionId, directory })
      const messages = response.data ?? []
      for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i]
        if (!message || message.info.role !== 'user') continue
        const textPart = message.parts.find(
          (part): part is Extract<Part, { type: 'text' }> =>
            part.type === 'text',
        )
        if (textPart) {
          return { type: 'text', text: textPart.text }
        }
      }
    } catch (error) {
      logger.warn(
        `Failed to read last user message for fallback retry: sessionId=${sessionId} error=${error instanceof Error ? error.message : String(error)}`,
      )
    }
    return undefined
  }

  async function performFallback(sessionId: string, reason: string): Promise<void> {
    if (fallenBackSessions.has(sessionId)) {
      return
    }

    logger.info(
      `Falling back session ${sessionId} to ${FREE_MODEL_STRING}: ${reason} (sessionId=${sessionId})`,
    )

    // Switch the directory default so future prompts avoid Ollama Cloud.
    const configUpdate = await client.config.update({
      directory,
      config: { model: FREE_MODEL_STRING },
    }).catch((error) => {
      return new Error(`config.update failed: ${error instanceof Error ? error.message : String(error)}`)
    })
    if (configUpdate instanceof Error) {
      logger.warn(configUpdate.message)
      void notifyError(configUpdate, 'ollama cloud fallback config.update failed')
    }

    fallenBackSessions.add(sessionId)

    await client.tui.showToast({
      message: appendToastSessionMarker({
        message: FALLBACK_TOAST,
        sessionId,
      }),
      variant: 'warning',
    }).catch(() => {
      // Toast failures must not break fallback.
    })

    // Retry with the free model. Prefer quoting the last user prompt; if
    // reading messages fails, ask the model to continue from session history.
    const lastUserPart = await getLastUserMessage(sessionId)
    const fallbackParts = lastUserPart
      ? [lastUserPart]
      : [{ type: 'text' as const, text: 'continue' }]

    const promptResult = await client.session.prompt({
      sessionID: sessionId,
      directory,
      parts: fallbackParts,
      model: { providerID: FREE_MODEL_PROVIDER, modelID: FREE_MODEL_ID },
    }).catch((error) => {
      return new Error(`fallback prompt failed: ${error instanceof Error ? error.message : String(error)}`)
    })
    if (promptResult instanceof Error) {
      logger.warn(promptResult.message)
      void notifyError(promptResult, 'ollama cloud fallback retry prompt failed')
    }
  }

  return {
    event: async ({ event }) => {
      const eventSessionId = getEventSessionId(event)
      const eventModel = getEventModel(event)

      if (eventSessionId && eventModel && isOllamaCloudModel(eventModel)) {
        ollamaSessions.set(eventSessionId, { model: eventModel })
      }

      if (!eventSessionId) {
        return
      }

      if (event.type === 'session.deleted' || event.type === 'session.idle') {
        ollamaSessions.delete(eventSessionId)
        return
      }

      // No fallback if this session was never on ollama-cloud, or already fell back.
      const tracked = ollamaSessions.get(eventSessionId)
      if (!tracked || fallenBackSessions.has(eventSessionId)) {
        return
      }

      const reason = extractBudgetErrorReason(event)
      if (!reason) {
        return
      }

      await performFallback(eventSessionId, reason).catch((error) => {
        logger.warn(`Fallback failed for ${eventSessionId}: ${error instanceof Error ? error.message : String(error)}`)
        void notifyError(error, 'ollama cloud fallback plugin error')
      })
    },
  }
}
