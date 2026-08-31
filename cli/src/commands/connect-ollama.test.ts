// Tests for /connect-ollama command and modal handlers.

import { describe, expect, test, vi } from 'vitest'
import type { ChatInputCommandInteraction, ModalSubmitInteraction } from 'discord.js'
import {
  handleConnectOllamaCommand,
  handleConnectOllamaModalSubmit,
} from './connect-ollama.js'
import * as database from '../database.js'
import * as writer from '../opencode-config-writer.js'

const APP_ID = 'app-123'
const VALID_KEY = '451eeba2eb904582b733be076214bcfb.WqSIr5TjVPQIk8ksLVFPdLqa'

function createChatInputCommandInteraction(): ChatInputCommandInteraction {
  return {
    showModal: vi.fn(),
  } as unknown as ChatInputCommandInteraction
}

function createModalSubmitInteraction(key: string): ModalSubmitInteraction {
  return {
    customId: `connect_ollama_modal:${APP_ID}`,
    fields: {
      getTextInputValue: vi.fn(() => key),
    },
    deferReply: vi.fn(),
    editReply: vi.fn(),
  } as unknown as ModalSubmitInteraction
}

describe('handleConnectOllamaCommand', () => {
  test('shows the modal', async () => {
    const interaction = createChatInputCommandInteraction()
    await handleConnectOllamaCommand({ interaction, appId: APP_ID })
    expect(interaction.showModal).toHaveBeenCalledTimes(1)
    const calls = (interaction.showModal as ReturnType<typeof vi.fn>).mock.calls
    const modal = calls[0]![0]
    expect(modal.data.custom_id).toBe(`connect_ollama_modal:${APP_ID}`)
  })
})

describe('handleConnectOllamaModalSubmit', () => {
  test('rejects empty keys', async () => {
    const interaction = createModalSubmitInteraction('   ')
    await handleConnectOllamaModalSubmit(interaction)
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: 'Ollama Cloud API key is required.',
    })
  })

  test('rejects short keys', async () => {
    const interaction = createModalSubmitInteraction('short')
    await handleConnectOllamaModalSubmit(interaction)
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: expect.stringContaining('looks too short'),
    })
  })

  test('stores key, writes config, sets global model, and replies', async () => {
    const setGlobalModelSpy = vi.spyOn(database, 'setGlobalModel').mockResolvedValue(undefined)
    const setOllamaCloudApiKeySpy = vi.spyOn(database, 'setOllamaCloudApiKey').mockResolvedValue(undefined)
    const writeKeySpy = vi.spyOn(writer, 'writeOllamaCloudKeyToOpencodeConfig').mockImplementation(() => undefined)
    const interaction = createModalSubmitInteraction(VALID_KEY)

    await handleConnectOllamaModalSubmit(interaction)

    expect(interaction.deferReply).toHaveBeenCalledWith({ flags: expect.any(Number) })
    expect(setOllamaCloudApiKeySpy).toHaveBeenCalledWith(APP_ID, VALID_KEY)
    expect(setGlobalModelSpy).toHaveBeenCalledWith({
      appId: APP_ID,
      modelId: 'ollama-cloud/glm-5.1:cloud',
      variant: null,
    })
    expect(writeKeySpy).toHaveBeenCalledWith(VALID_KEY)
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "Ollama Cloud key saved. Default model switched to glm-5.1 (cloud). If your credits run out, I'll automatically fall back to the free model.",
    })

    setGlobalModelSpy.mockRestore()
    setOllamaCloudApiKeySpy.mockRestore()
    writeKeySpy.mockRestore()
  })
})
