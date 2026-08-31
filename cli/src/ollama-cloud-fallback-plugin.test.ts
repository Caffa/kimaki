// Tests for ollama-cloud-fallback-plugin.
// Feed synthetic budget errors and assert fallback only fires for ollama-cloud
// sessions. The plugin builds its own v2 client via createPluginClient, so we
// mock that factory to return an in-memory fake; the plugin's real logic
// (tracking, budget detection, per-session dedup) runs unmodified.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import type { OpencodeClient } from '@opencode-ai/sdk/v2'
import { ollamaCloudFallbackPlugin } from './ollama-cloud-fallback-plugin.js'
import { createPluginClient } from './plugin-opencode-client.js'

vi.mock('./plugin-opencode-client.js', () => ({
  createPluginClient: vi.fn(),
}))

type PluginInput = Parameters<typeof ollamaCloudFallbackPlugin>[0]
type PluginEventHook = NonNullable<Awaited<ReturnType<typeof ollamaCloudFallbackPlugin>>['event']>
type PluginEvent = Parameters<PluginEventHook>[0]['event']

const DIRECTORY = '/project'
const SERVER_URL = new URL('http://localhost:4096')

function createMockClient() {
  return {
    config: {
      update: vi.fn(async () => ({ data: undefined })),
    },
    tui: {
      showToast: vi.fn(async () => undefined),
    },
    session: {
      messages: vi.fn(async () => ({ data: [] })),
      prompt: vi.fn(async () => ({ data: undefined })),
    },
    app: {
      log: vi.fn(async () => undefined),
    },
  }
}

type MockClient = ReturnType<typeof createMockClient>

let currentClient: MockClient

beforeEach(() => {
  currentClient = createMockClient()
  vi.mocked(createPluginClient).mockReturnValue(
    currentClient as unknown as ReturnType<typeof createPluginClient>,
  )
})

afterEach(() => {
  vi.resetAllMocks()
})

function createEvent({
  sessionId,
  model,
  statusCode,
  message,
}: {
  sessionId: string
  model: string
  statusCode?: number
  message?: string
}): PluginEvent {
  return {
    type: 'message.updated',
    properties: {
      info: {
        sessionID: sessionId,
        role: 'assistant',
        model,
        error: {
          name: 'APIError',
          data: {
            message: message || 'budget exceeded',
            statusCode,
          },
        },
      },
    },
  } as unknown as PluginEvent
}

function createPluginInput(): PluginInput {
  return {
    serverUrl: SERVER_URL,
    directory: DIRECTORY,
    client: undefined as unknown as PluginInput['client'],
    experimental_workspace: {
      register: () => {
        return
      },
    },
    project: {
      id: 'project-1',
      worktree: DIRECTORY,
      time: { created: Date.now() },
    },
    worktree: DIRECTORY,
    $: {} as PluginInput['$'],
  }
}

async function runPluginWithEvent(event: PluginEvent) {
  const plugin = await ollamaCloudFallbackPlugin(createPluginInput())
  await plugin.event?.({ event })
  return { client: currentClient, plugin }
}

describe('ollamaCloudFallbackPlugin', () => {
  test('falls back on budget error for ollama-cloud session', async () => {
    const sessionId = 'session-ollama-1'
    const { client } = await runPluginWithEvent(
      createEvent({
        sessionId,
        model: 'ollama-cloud/glm-5.1:cloud',
        statusCode: 402,
        message: 'payment required',
      }),
    )

    expect(client.config.update).toHaveBeenCalledWith({
      directory: DIRECTORY,
      config: { model: 'opencode/big-pickle' },
    })
    expect(client.session.prompt).toHaveBeenCalled()
    expect(client.tui.showToast).toHaveBeenCalled()
  })

  test('does not fall back for non-ollama-cloud session', async () => {
    const sessionId = 'session-other-1'
    const { client } = await runPluginWithEvent(
      createEvent({
        sessionId,
        model: 'opencode/big-pickle',
        statusCode: 402,
        message: 'payment required',
      }),
    )

    expect(client.config.update).not.toHaveBeenCalled()
    expect(client.session.prompt).not.toHaveBeenCalled()
    expect(client.tui.showToast).not.toHaveBeenCalled()
  })

  test('does not fall back for non-budget errors', async () => {
    const sessionId = 'session-ollama-2'
    const { client } = await runPluginWithEvent(
      createEvent({
        sessionId,
        model: 'ollama-cloud/glm-5.1:cloud',
        statusCode: 500,
        message: 'internal server error',
      }),
    )

    expect(client.config.update).not.toHaveBeenCalled()
    expect(client.session.prompt).not.toHaveBeenCalled()
  })

  test('reuses last user message for retry when available', async () => {
    const sessionId = 'session-ollama-3'
    currentClient.session.messages = vi.fn(async () => ({
      data: [
        {
          info: { sessionID: sessionId, role: 'user' },
          parts: [{ type: 'text', text: 'please help' }],
        },
      ],
    }))

    const plugin = await ollamaCloudFallbackPlugin(createPluginInput())

    await plugin.event?.({
      event: createEvent({
        sessionId,
        model: 'ollama-cloud/glm-5.1:cloud',
        statusCode: 402,
        message: 'payment required',
      }),
    })

    expect(currentClient.session.prompt).toHaveBeenCalledWith({
      sessionID: sessionId,
      directory: DIRECTORY,
      parts: [{ type: 'text', text: 'please help' }],
      model: { providerID: 'opencode', modelID: 'big-pickle' },
    })
  })

  test('falls back only once per session', async () => {
    const sessionId = 'session-ollama-4'
    const plugin = await ollamaCloudFallbackPlugin(createPluginInput())

    await plugin.event?.({
      event: createEvent({
        sessionId,
        model: 'ollama-cloud/glm-5.1:cloud',
        statusCode: 402,
        message: 'payment required',
      }),
    })

    expect(currentClient.config.update).toHaveBeenCalledTimes(1)

    // Second budget error on the same session should be ignored.
    await plugin.event?.({
      event: createEvent({
        sessionId,
        model: 'ollama-cloud/glm-5.1:cloud',
        statusCode: 429,
        message: 'rate limit',
      }),
    })

    expect(currentClient.config.update).toHaveBeenCalledTimes(1)
  })
})
