// Scheduled task parsing utilities for `send --send-at` and task runner execution.

import { CronExpressionParser } from 'cron-parser'
import * as errore from 'errore'

export type ScheduledTaskPayload =
  | {
      kind: 'thread'
      threadId: string
      prompt: string
      agent: string | null
      model: string | null
      username: string | null
      userId: string | null
    }
  | {
      kind: 'channel'
      channelId: string
      prompt: string
      name: string | null
      notifyOnly: boolean
      worktreeName: string | null
      agent: string | null
      model: string | null
      username: string | null
      userId: string | null
    }

export type ParsedSendAt =
  | {
      scheduleKind: 'at'
      runAt: Date
      cronExpr: null
      timezone: null
      nextRunAt: Date
    }
  | {
      scheduleKind: 'cron'
      runAt: null
      cronExpr: string
      timezone: string
      nextRunAt: Date
    }

export function getLocalTimeZone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (!tz) {
    return 'UTC'
  }
  return tz
}

export function getPromptPreview(prompt: string): string {
  const normalized = prompt.replace(/\s+/g, ' ').trim()
  if (normalized.length <= 120) {
    return normalized
  }
  return `${normalized.slice(0, 117)}...`
}

export function parseSendAtValue({
  value,
  now,
  timezone,
}: {
  value: string
  now: Date
  timezone: string
}): ParsedSendAt | Error {
  const trimmed = value.trim()
  if (!trimmed) {
    return new Error('--send-at cannot be empty')
  }

  const looksLikeCron =
    trimmed.startsWith('@') || trimmed.split(/\s+/).length >= 5
  if (looksLikeCron) {
    const nextRunAtResult = getNextCronRun({
      cronExpr: trimmed,
      timezone,
      from: now,
    })
    if (!(nextRunAtResult instanceof Error)) {
      return {
        scheduleKind: 'cron',
        runAt: null,
        cronExpr: trimmed,
        timezone,
        nextRunAt: nextRunAtResult,
      }
    }
  }

  const runAt = new Date(trimmed)
  if (!Number.isNaN(runAt.getTime())) {
    if (runAt.getTime() <= now.getTime()) {
      return new Error(`--send-at date must be in the future: ${trimmed}`)
    }
    return {
      scheduleKind: 'at',
      runAt,
      cronExpr: null,
      timezone: null,
      nextRunAt: runAt,
    }
  }

  const cronResult = getNextCronRun({ cronExpr: trimmed, timezone, from: now })
  if (cronResult instanceof Error) {
    return new Error(
      `Invalid --send-at value: "${trimmed}". Use ISO date/time or a cron expression.`,
      {
        cause: cronResult,
      },
    )
  }

  return {
    scheduleKind: 'cron',
    runAt: null,
    cronExpr: trimmed,
    timezone,
    nextRunAt: cronResult,
  }
}

export function getNextCronRun({
  cronExpr,
  timezone,
  from,
}: {
  cronExpr: string
  timezone: string
  from: Date
}): Date | Error {
  const parsed = errore.try({
    try: () => {
      return CronExpressionParser.parse(cronExpr, {
        currentDate: from,
        tz: timezone,
      })
    },
    catch: (error) => {
      return new Error(`Invalid cron expression: ${cronExpr}`, { cause: error })
    },
  })
  if (parsed instanceof Error) {
    return parsed
  }

  const next = errore.try({
    try: () => {
      return parsed.next().toDate()
    },
    catch: (error) => {
      return new Error(`Could not compute next run for cron: ${cronExpr}`, {
        cause: error,
      })
    },
  })
  if (next instanceof Error) {
    return next
  }

  return next
}

export function serializeScheduledTaskPayload(
  payload: ScheduledTaskPayload,
): string {
  return JSON.stringify(payload)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  return value
}

export function parseScheduledTaskPayload(
  payloadJson: string,
): ScheduledTaskPayload | Error {
  const parsed = errore.try({
    try: () => {
      return JSON.parse(payloadJson) as unknown
    },
    catch: (error) => {
      return new Error('Task payload is not valid JSON', { cause: error })
    },
  })
  if (parsed instanceof Error) {
    return parsed
  }
  if (!isRecord(parsed)) {
    return new Error('Task payload must be an object')
  }

  const kind = asString(parsed.kind)
  if (kind === 'thread') {
    const threadId = asString(parsed.threadId)
    const prompt = asString(parsed.prompt)
    const agent = asString(parsed.agent)
    const model = asString(parsed.model)
    const username = asString(parsed.username)
    const userId = asString(parsed.userId)
    if (!threadId || !prompt) {
      return new Error('Thread task payload requires threadId and prompt')
    }
    return {
      kind: 'thread',
      threadId,
      prompt,
      agent,
      model,
      username,
      userId,
    }
  }

  if (kind === 'channel') {
    const channelId = asString(parsed.channelId)
    const prompt = asString(parsed.prompt)
    const nameValue = parsed.name
    const name = typeof nameValue === 'string' ? nameValue : null
    const notifyOnly = parsed.notifyOnly === true
    const worktreeName = asString(parsed.worktreeName)
    const agent = asString(parsed.agent)
    const model = asString(parsed.model)
    const username = asString(parsed.username)
    const userId = asString(parsed.userId)
    if (!channelId || !prompt) {
      return new Error('Channel task payload requires channelId and prompt')
    }
    return {
      kind: 'channel',
      channelId,
      prompt,
      name,
      notifyOnly,
      worktreeName,
      agent,
      model,
      username,
      userId,
    }
  }

  return new Error('Task payload has unknown kind')
}
