// /context-usage command - Show token usage and context window percentage for the current session.
// Includes a per-model breakdown table aggregating the main session and any
// sub-agent (task tool child) sessions.

import {
  ChannelType,
  MessageFlags,
  type TextChannel,
  type ThreadChannel,
} from 'discord.js'
import type { Message, Part } from '@opencode-ai/sdk/v2'
import type { CommandContext } from './types.js'
import { OpenCodeSdkError } from '../errors.js'
import { getThreadSession } from '../database.js'
import { getOpencodeClient, initializeOpencodeForDirectory } from '../opencode.js'
import { shortenModelId } from '../message-formatting.js'
import {
  resolveWorkingDirectory,
  SILENT_MESSAGE_FLAGS,
} from '../discord-utils.js'
import { createLogger, LogPrefix } from '../logger.js'


const logger = createLogger(LogPrefix.SESSION)

type SessionMessageListItem = {
  info: Message
  parts: Array<Part>
}

function getTokenTotal({
  input,
  output,
  reasoning,
  cache,
}: {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}): number {
  return input + output + reasoning + cache.read + cache.write
}

// Collect child session ids spawned by task tools in the given messages.
// Mirrors getTaskChildSessionId in event-stream-state.ts: the canonical
// child-session identifier lives on running/completed tool state.metadata.
function getTaskChildSessionIds(
  messages: SessionMessageListItem[],
): string[] {
  const ids = new Set<string>()
  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type !== 'tool' || part.tool !== 'task') {
        continue
      }
      const metadata = (part.state as { metadata?: unknown }).metadata
      const metadataSessionId =
        metadata && typeof metadata === 'object'
          ? (metadata as { sessionId?: unknown }).sessionId
          : undefined
      if (
        typeof metadataSessionId === 'string' &&
        metadataSessionId.length > 0
      ) {
        ids.add(metadataSessionId)
      }
    }
  }
  return [...ids]
}

type ModelUsageRow = {
  modelID: string
  totalTokens: number
  cost: number
}

function collectAssistantUsage(
  messages: SessionMessageListItem[],
  usageByModel: Map<string, ModelUsageRow>,
): void {
  for (const message of messages) {
    const info = message.info
    if (info.role !== 'assistant' || !info.tokens) {
      continue
    }
    const existing = usageByModel.get(info.modelID)
    const tokens = getTokenTotal(info.tokens)
    const cost = info.cost || 0
    if (!existing) {
      usageByModel.set(info.modelID, {
        modelID: info.modelID,
        totalTokens: tokens,
        cost,
      })
      continue
    }
    existing.totalTokens += tokens
    existing.cost += cost
  }
}

// Renders a fixed-width code block table:
// Model | Tokens | % | Cost. Empty when no model has tokens.
function buildPerModelTable(rows: ModelUsageRow[]): string {
  const sumAll = rows.reduce((total, row) => {
    return total + row.totalTokens
  }, 0)
  if (rows.length === 0 || sumAll <= 0) {
    return ''
  }

  const headerModel = 'Model'
  const headerTokens = 'Tokens'
  const headerPct = '%'
  const headerCost = 'Cost'
  const shortened = rows.map((row) => shortenModelId(row.modelID))
  const tokenStrings = rows.map((row) =>
    row.totalTokens.toLocaleString('en-US'),
  )
  const pctStrings = rows.map((row) =>
    String(Math.round((row.totalTokens / sumAll) * 100)),
  )
  const costStrings = rows.map((row) => `$${row.cost.toFixed(4)}`)

  const modelWidth = Math.max(
    headerModel.length,
    ...shortened.map((s) => s.length),
  )
  const tokenWidth = Math.max(
    headerTokens.length,
    ...tokenStrings.map((s) => s.length),
  )
  const pctWidth = Math.max(headerPct.length, ...pctStrings.map((s) => s.length))
  const costWidth = Math.max(
    headerCost.length,
    ...costStrings.map((s) => s.length),
  )

  const lines = [
    `${headerModel.padEnd(modelWidth)} ${headerTokens.padStart(tokenWidth)} ${headerPct.padStart(pctWidth)} ${headerCost.padEnd(costWidth)}`,
    ...rows.map((_row, index) => {
      return `${shortened[index]!.padEnd(modelWidth)} ${tokenStrings[index]!.padStart(tokenWidth)} ${pctStrings[index]!.padStart(pctWidth)} ${costStrings[index]!.padEnd(costWidth)}`
    }),
  ]
  return `\`\`\`\n${lines.join('\n')}\`\`\``
}

export async function handleContextUsageCommand({
  command,
}: CommandContext): Promise<void> {
  const channel = command.channel

  if (!channel) {
    await command.reply({
      content: 'This command can only be used in a channel',
      flags: MessageFlags.Ephemeral | SILENT_MESSAGE_FLAGS,
    })
    return
  }

  const isThread = [
    ChannelType.PublicThread,
    ChannelType.PrivateThread,
    ChannelType.AnnouncementThread,
  ].includes(channel.type)

  if (!isThread) {
    await command.reply({
      content:
        'This command can only be used in a thread with an active session',
      flags: MessageFlags.Ephemeral | SILENT_MESSAGE_FLAGS,
    })
    return
  }

  const resolved = await resolveWorkingDirectory({
    channel: channel as TextChannel | ThreadChannel,
  })

  if (!resolved) {
    await command.reply({
      content: 'Could not determine project directory for this channel',
      flags: MessageFlags.Ephemeral | SILENT_MESSAGE_FLAGS,
    })
    return
  }

  const { projectDirectory, workingDirectory } = resolved

  const sessionId = await getThreadSession(channel.id)

  if (!sessionId) {
    await command.reply({
      content: 'No active session in this thread',
      flags: MessageFlags.Ephemeral | SILENT_MESSAGE_FLAGS,
    })
    return
  }

  const serverResult = await initializeOpencodeForDirectory(projectDirectory)
  if (serverResult instanceof Error) {
    await command.reply({
      content: `Failed to get context usage: ${serverResult.message}`,
      flags: MessageFlags.Ephemeral | SILENT_MESSAGE_FLAGS,
    })
    return
  }

  const client = getOpencodeClient(workingDirectory)
  if (!client) {
    await command.reply({
      content: 'Failed to get OpenCode client',
      flags: MessageFlags.Ephemeral | SILENT_MESSAGE_FLAGS,
    })
    return
  }

  await command.deferReply({ flags: SILENT_MESSAGE_FLAGS })

  try {
    const messagesResponse = await client.session.messages({
      sessionID: sessionId,
      directory: workingDirectory,
    })

    const messages = messagesResponse.data || []
    const assistantMessages = messages.filter(
      (m) => m.info.role === 'assistant',
    )

    if (assistantMessages.length === 0) {
      await command.editReply({
        content: 'No assistant messages in this session yet',
      })
      return
    }

    const lastAssistant = [...assistantMessages].reverse().find((m) => {
      if (m.info.role !== 'assistant') {
        return false
      }
      if (!m.info.tokens) {
        return false
      }
      return getTokenTotal(m.info.tokens) > 0
    })

    if (!lastAssistant || lastAssistant.info.role !== 'assistant') {
      await command.editReply({
        content: 'Token usage not available for this session yet',
      })
      return
    }

    const { tokens, modelID, providerID } = lastAssistant.info
    const totalTokens = getTokenTotal(tokens)

    // Sum cost across all assistant messages for accurate session total
    // (AssistantMessage.cost is per-message, not cumulative)
    const totalCost = assistantMessages.reduce((sum, m) => {
      if (m.info.role === 'assistant') {
        return sum + (m.info.cost || 0)
      }
      return sum
    }, 0)

    // Aggregate per-model usage across the main session and any sub-agent
    // (task tool child) sessions.
    const usageByModel = new Map<string, ModelUsageRow>()
    collectAssistantUsage(messages, usageByModel)
    const childSessionIds = getTaskChildSessionIds(messages)
    for (const childSessionId of childSessionIds) {
      const childResponse = await client.session.messages({
        sessionID: childSessionId,
        directory: workingDirectory,
      }).catch(
        (e) =>
          new OpenCodeSdkError({
            operation: 'session.messages',
            cause: e,
          }),
      )
      if (childResponse instanceof Error) {
        logger.warn(
          `[CONTEXT-USAGE] Failed to fetch child session ${childSessionId} messages:`,
          childResponse,
        )
        continue
      }
      collectAssistantUsage(childResponse.data || [], usageByModel)
    }
    const perModelRows = [...usageByModel.values()].sort((a, b) => {
      return b.totalTokens - a.totalTokens
    })

    // Fetch model context limit from provider API
    let contextLimit: number | undefined
    const providersResult = await client.provider.list({ directory: workingDirectory })
      .catch((e) => new OpenCodeSdkError({ operation: 'provider.list', cause: e }))
    if (providersResult instanceof Error) {
      logger.error(
        '[CONTEXT-USAGE] Failed to fetch provider info:',
        providersResult,
      )
    } else {
      const provider = providersResult.data?.all?.find(
        (p) => p.id === providerID,
      )
      const model = provider?.models?.[modelID]
      if (model?.limit?.context) {
        contextLimit = model.limit.context
      }
    }

    const formattedTokens = totalTokens.toLocaleString('en-US')
    const formattedCost = totalCost > 0 ? `$${totalCost.toFixed(4)}` : '$0.00'

    const lines: string[] = []

    if (contextLimit) {
      const percentage = Math.round((totalTokens / contextLimit) * 100)
      const formattedLimit = contextLimit.toLocaleString('en-US')
      lines.push(
        `**Context usage:** ${percentage}%, ${formattedTokens} / ${formattedLimit} tokens`,
      )
    } else {
      lines.push(
        `**Context usage:** ${formattedTokens} tokens (context limit unavailable)`,
      )
    }

    if (modelID) {
      lines.push(`**Model:** ${modelID}`)
    }
    if (totalCost > 0) {
      lines.push(`**Session cost:** ${formattedCost}`)
    }

    const perModelTable = buildPerModelTable(perModelRows)
    if (perModelTable) {
      lines.push('**Per-model usage**')
      lines.push(perModelTable)
    }

    await command.editReply({ content: lines.join('\n') })
    logger.log(
      `Context usage shown for session ${sessionId}: ${totalTokens} tokens`,
    )
  } catch (error) {
    logger.error('[CONTEXT-USAGE] Error:', error)
    await command.editReply({
      content: `Failed to get context usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
    })
  }
}
