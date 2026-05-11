// /link-voice-channel command - Link a voice channel to a project directory.
// Stub: the interaction handler references these exports but the implementation
// is TODO. For now, responds with a placeholder message.

import type { CommandContext, AutocompleteContext } from './types.js'
import { createLogger, LogPrefix } from '../logger.js'

const logger = createLogger(LogPrefix.DISCORD)

export async function handleLinkVoiceChannelCommand({
  command,
}: CommandContext): Promise<void> {
  logger.log('link-voice-channel command invoked (stub)')
  await command.reply({
    content:
      '⚠️ `/link-voice-channel` is not yet implemented. Use `/add-project` with `--enable-voice` instead.',
    flags: 64 /* Ephemeral */,
  })
}

export async function handleLinkVoiceChannelAutocomplete(
  _ctx: AutocompleteContext,
): Promise<void> {
  // No-op autocomplete for now
}