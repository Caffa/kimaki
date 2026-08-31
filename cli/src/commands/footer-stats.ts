// /footer-stats command.
// Sets how the run footer shows per-model token usage for a channel.
// 'tokens' (default): appends " ⋅ modelId Xk" per model sorted by usage
// 'percentages': shows " ⋅ modelA 52% ⋅ modelB 31%" when 2+ models were used
// 'off': only the main model name (legacy footer behavior)

import { ChannelType, MessageFlags, type ChatInputCommandInteraction, type ThreadChannel } from 'discord.js'
import {
  getChannelFooterStatsMode,
  setChannelFooterStatsMode,
  type FooterStatsMode,
} from '../database.js'
import { createLogger, LogPrefix } from '../logger.js'

const footerStatsLogger = createLogger(LogPrefix.FOOTER_STATS)

const FOOTER_STATS_OPTIONS: Array<{
  value: FooterStatsMode
  label: string
  description: string
}> = [
  {
    value: 'tokens',
    label: 'Tokens',
    description: 'Show per-model token counts in the footer',
  },
  {
    value: 'percentages',
    label: 'Percentages',
    description: 'Show per-model token percentages in the footer',
  },
  {
    value: 'off',
    label: 'Off',
    description: 'Only show the main model name in the footer',
  },
]

function resolveChannelId(channel: ChatInputCommandInteraction['channel']): string | null {
  if (!channel) {
    return null
  }
  if (channel.type === ChannelType.GuildText) {
    return channel.id
  }
  if (
    channel.type === ChannelType.PublicThread ||
    channel.type === ChannelType.PrivateThread ||
    channel.type === ChannelType.AnnouncementThread
  ) {
    return (channel as ThreadChannel).parentId || channel.id
  }
  return channel.id
}

/**
 * Handle the /footer-stats slash command.
 * Sets the per-model token breakdown mode for the run footer.
 */
export async function handleFooterStatsCommand({
  command,
}: {
  command: ChatInputCommandInteraction
  appId: string
}): Promise<void> {
  footerStatsLogger.log('[FOOTER-STATS] Command called')

  const channelId = resolveChannelId(command.channel)
  if (!channelId) {
    await command.reply({
      content: 'Could not determine channel.',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const mode = command.options.getString('mode') as FooterStatsMode | null
  if (!mode || !FOOTER_STATS_OPTIONS.some((o) => o.value === mode)) {
    const currentMode = await getChannelFooterStatsMode(channelId)
    const description = FOOTER_STATS_OPTIONS.find((o) => o.value === currentMode)?.description || ''
    await command.reply({
      content: `**Footer stats**\nCurrent: \`${currentMode}\`${description ? `\n${description}` : ''}`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const currentMode = await getChannelFooterStatsMode(channelId)
  if (currentMode === mode) {
    await command.reply({
      content: `Footer stats are already \`${mode}\` for this channel.`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  await setChannelFooterStatsMode(channelId, mode)
  footerStatsLogger.log(`[FOOTER-STATS] Set channel ${channelId} to ${mode}`)

  const description = FOOTER_STATS_OPTIONS.find((o) => o.value === mode)?.description || ''

  await command.reply({
    content: `Footer stats set to \`${mode}\` for this channel.\n${description}\nApplies to the next run footer.`,
    flags: MessageFlags.Ephemeral,
  })
}
