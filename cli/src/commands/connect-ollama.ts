// /connect-ollama slash command and modal handlers.
// Captures an Ollama Cloud API key in a Discord modal, stores it in the bot
// database, writes it into ~/.config/opencode/opencode.json, and switches the
// effective default model to ollama-cloud/glm-5.1:cloud.

import {
  ActionRowBuilder,
  type ChatInputCommandInteraction,
  ModalBuilder,
  type ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} from 'discord.js'
import { setGlobalModel, setOllamaCloudApiKey } from '../database.js'
import {
  writeOllamaCloudKeyToOpencodeConfig,
} from '../opencode-config-writer.js'

const MIN_KEY_LENGTH = 20

function buildConnectOllamaModal(appId: string): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(`connect_ollama_modal:${appId}`)
    .setTitle('Connect Ollama Cloud')

  const apiKeyInput = new TextInputBuilder()
    .setCustomId('apikey')
    .setLabel('Ollama Cloud API Key')
    .setPlaceholder('Paste your key here')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    apiKeyInput,
  )
  modal.addComponents(actionRow)
  return modal
}

/**
 * Handler for the /connect-ollama slash command.
 * Shows a modal to capture the Ollama Cloud API key.
 */
export async function handleConnectOllamaCommand({
  interaction,
  appId,
}: {
  interaction: ChatInputCommandInteraction
  appId: string
}): Promise<void> {
  await interaction.showModal(buildConnectOllamaModal(appId))
}

/**
 * Handler for the connect_ollama_modal modal submit.
 * Validates the key, persists it, updates opencode.json, and sets the global
 * model preference to ollama-cloud/glm-5.1:cloud.
 */
export async function handleConnectOllamaModalSubmit(
  interaction: ModalSubmitInteraction,
): Promise<void> {
  if (!interaction.customId.startsWith('connect_ollama_modal:')) return

  const appId = interaction.customId
    .slice('connect_ollama_modal:'.length)
    .trim()

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })

  if (!appId) {
    await interaction.editReply({
      content: 'Missing app id for Ollama Cloud setup.',
    })
    return
  }

  const apiKey = interaction.fields.getTextInputValue('apikey').trim()
  if (!apiKey) {
    await interaction.editReply({
      content: 'Ollama Cloud API key is required.',
    })
    return
  }
  if (apiKey.length < MIN_KEY_LENGTH) {
    await interaction.editReply({
      content: `Ollama Cloud API key looks too short (minimum ${MIN_KEY_LENGTH} characters). Please paste the full key from https://ollama.com/settings.`,
    })
    return
  }

  try {
    await setOllamaCloudApiKey(appId, apiKey)
  } catch (error) {
    await interaction.editReply({
      content: `Failed to save the key to the bot database: ${error instanceof Error ? error.message : String(error)}`,
    })
    return
  }

  try {
    writeOllamaCloudKeyToOpencodeConfig(apiKey)
  } catch (error) {
    await interaction.editReply({
      content: `Failed to save the key to your opencode config: ${error instanceof Error ? error.message : String(error)}`,
    })
    return
  }

  try {
    await setGlobalModel({
      appId,
      modelId: 'ollama-cloud/glm-5.1:cloud',
      variant: null,
    })
  } catch (error) {
    await interaction.editReply({
      content: `Failed to set the default model: ${error instanceof Error ? error.message : String(error)}`,
    })
    return
  }

  await interaction.editReply({
    content:
      'Ollama Cloud key saved. Default model switched to glm-5.1 (cloud). If your credits run out, I\'ll automatically fall back to the free model.',
  })
}
