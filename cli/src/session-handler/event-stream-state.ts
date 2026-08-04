// Pure event-stream derivation functions for session lifecycle state.
// These functions derive lifecycle decisions from an event buffer array.
// Zero imports from thread-session-runtime.ts, store.ts, or state.ts.
// Only types from @opencode-ai/sdk/v2 and the getOpencodeEventSessionId helper.

import type {
  Event as OpenCodeEvent,
  Message as OpenCodeMessage,
  Part,
} from '@opencode-ai/sdk/v2'
import { getOpencodeEventSessionId } from './opencode-session-event-log.js'

type QueueQuestionHandoffStartedEvent = {
  type: 'queue.question-handoff-started'
  properties: {
    sessionID: string
  }
}

export type EventBufferEvent = OpenCodeEvent | QueueQuestionHandoffStartedEvent

export type EventBufferEntry = {
  event: EventBufferEvent
  timestamp: number
  eventIndex?: number
}

export function getEventBufferSessionId(event: EventBufferEvent): string | undefined {
  if (event.type === 'queue.question-handoff-started') {
    return event.properties.sessionID
  }
  return getOpencodeEventSessionId(event)
}

type AssistantMessage = Extract<OpenCodeMessage, { role: 'assistant' }>
type UserMessage = Extract<OpenCodeMessage, { role: 'user' }>

function getTaskChildSessionId({
  part,
}: {
  part: Extract<Part, { type: 'tool' }>
}): string | undefined {
  // Event-shape reference:
  // - cli/src/session-handler/event-stream-fixtures/real-session-task-three-parallel-sleeps.jsonl
  // - In real task events, state.metadata.sessionId appears on running/completed
  //   tool updates and is the canonical child-session identifier.
  // We intentionally do not parse state.output because it is user-facing text
  // and can change format across providers/versions.
  const metadataValue = (part.state as { metadata?: unknown }).metadata
  const metadataSessionId =
    metadataValue && typeof metadataValue === 'object'
      ? (metadataValue as { sessionId?: unknown }).sessionId
      : undefined
  if (typeof metadataSessionId === 'string' && metadataSessionId.length > 0) {
    return metadataSessionId
  }
  return undefined
}

function getTaskCandidateFromEvent({
  event,
  mainSessionId,
}: {
  event: EventBufferEvent
  mainSessionId: string
}): {
  assistantMessageId: string
  childSessionId: string
  subagentType?: string
  description?: string
} | undefined {
  if (event.type !== 'message.part.updated') {
    return undefined
  }

  const part = event.properties.part
  if (part.sessionID !== mainSessionId) {
    return undefined
  }
  if (part.type !== 'tool' || part.tool !== 'task' || part.state.status === 'pending') {
    return undefined
  }

  const childSessionId = getTaskChildSessionId({ part })
  if (!childSessionId) {
    return undefined
  }

  const subagentType = part.state.input?.subagent_type
  const description = part.state.input?.description
  return {
    assistantMessageId: part.messageID,
    childSessionId,
    subagentType: typeof subagentType === 'string' ? subagentType : undefined,
    description: typeof description === 'string' ? description : undefined,
  }
}

export type DerivedSubagentSession = {
  childSessionId: string
  subagentType?: string
  description?: string
  timestamp: number
}

// Scans backward for most recent session-scoped lifecycle event.
// Returns true if the latest lifecycle event for sessionId is session.status busy.
export function isSessionBusy({
  events,
  sessionId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  upToIndex?: number
}): boolean {
  const end = upToIndex ?? events.length - 1
  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
     const e = entry.event
     const eid = getEventBufferSessionId(e)
    if (eid !== sessionId) {
      continue
    }
    if (e.type === 'session.idle') {
      return false
    }
    if (e.type === 'session.status') {
      return e.properties.status.type === 'busy'
    }
  }
  return false
}

export function didQuestionQueueHandoffSinceLatestQuestionAsked({
  events,
  sessionId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  upToIndex?: number
}): boolean {
  const end = upToIndex ?? events.length - 1
  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const event = entry.event
    const eventSessionId = getEventBufferSessionId(event)
    if (eventSessionId !== sessionId) {
      continue
    }
    if (event.type === 'queue.question-handoff-started') {
      return true
    }
    if (event.type === 'question.asked') {
      return false
    }
  }
  return false
}

export function derivePendingPermissionRequests({
  events,
  sessionId,
}: {
  events: EventBufferEntry[]
  sessionId: string
}): string[] {
  const permissions = new Set<string>()

  for (const entry of events) {
    const event = entry.event
    const eventSessionId = getEventBufferSessionId(event)
    if (eventSessionId !== sessionId) {
      continue
    }

    if (event.type === 'permission.asked') {
      permissions.add(event.properties.id)
      continue
    }

    if (event.type === 'permission.replied') {
      permissions.delete(event.properties.requestID)
    }
  }

  return [...permissions]
}

export function isAssistantMessageNaturalCompletion({
  message,
}: {
  message: AssistantMessage
}): boolean {
  if (typeof message.time.completed !== 'number') {
    return false
  }
  if (message.error) {
    return false
  }
  // finish="tool-calls" means the model's last step was tool execution.
  // Mid-turn tool-call steps don't get footers — the footer comes from the
  // final text response (finish="stop") that follows. If the turn ends with
  // only tool-calls and no text follow-up, no footer is emitted. This is
  // acceptable since models almost always follow up with text after tools.
  return message.finish !== 'tool-calls'
}

export function hasAssistantMessageCompletedBefore({
  events,
  sessionId,
  messageId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  messageId: string
  upToIndex?: number
}): boolean {
  const end = upToIndex ?? events.length - 1
  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const event = entry.event
    if (event.type !== 'message.updated') {
      continue
    }
    const info = event.properties.info
    if (info.sessionID !== sessionId || info.role !== 'assistant' || info.id !== messageId) {
      continue
    }
    if (typeof info.time.completed === 'number') {
      return true
    }
  }
  return false
}

export function getLatestUserMessage({
  events,
  sessionId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  upToIndex?: number
}): UserMessage | undefined {
  const end = upToIndex ?? events.length - 1
  let latestUserMessage: UserMessage | undefined
  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const event = entry.event
    if (event.type !== 'message.updated') {
      continue
    }
    const info = event.properties.info
    if (info.sessionID !== sessionId || info.role !== 'user') {
      continue
    }
    if (!latestUserMessage) {
      latestUserMessage = info
      continue
    }
    if (info.time.created > latestUserMessage.time.created) {
      latestUserMessage = info
    }
  }
  return latestUserMessage
}

export function getCurrentTurnStartTime({
  events,
  sessionId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  upToIndex?: number
}): number | undefined {
  const latestUserMessage = getLatestUserMessage({
    events,
    sessionId,
    upToIndex,
  })
  return latestUserMessage?.time.created
}

// Token total helper — sum of input + output + reasoning + cache.read + cache.write
function getTokenTotal(tokens: {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}): number {
  return tokens.input + tokens.output + tokens.reasoning + tokens.cache.read + tokens.cache.write
}

// Scans backward for most recent message.updated with role=assistant for sessionId.
// Extracts model, providerID, agent, tokensUsed.
export function getLatestRunInfo({
  events,
  sessionId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  upToIndex?: number
}): {
  model: string | undefined
  providerID: string | undefined
  agent: string | undefined
  tokensUsed: number
} {
  const result = {
    model: undefined as string | undefined,
    providerID: undefined as string | undefined,
    agent: undefined as string | undefined,
    tokensUsed: 0,
  }
  const end = upToIndex ?? events.length - 1
  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const e = entry.event
    if (e.type !== 'message.updated') {
      continue
    }
    const msg = e.properties.info
    if (msg.sessionID !== sessionId || msg.role !== 'assistant') {
      continue
    }
    return {
      model: msg.modelID,
      providerID: msg.providerID,
      agent: msg.mode,
      tokensUsed: msg.tokens
        ? getTokenTotal(msg.tokens)
        : 0,
    }
  }
  return result
}

export function getAssistantMessageIdsForLatestUserTurn({
  events,
  sessionId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  upToIndex?: number
}): Set<string> {
  const latestUserMessage = getLatestUserMessage({
    events,
    sessionId,
    upToIndex,
  })
  if (!latestUserMessage) {
    return new Set<string>()
  }
  const end = upToIndex === undefined ? events.length : upToIndex + 1
  const assistantMessageIds = new Set<string>()
  for (let i = 0; i < end; i++) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const e = entry.event
    if (e.type !== 'message.updated') {
      continue
    }
    const msg = e.properties.info
    if (msg.sessionID !== sessionId || msg.role !== 'assistant') {
      continue
    }
    if (msg.parentID === latestUserMessage.id) {
      assistantMessageIds.add(msg.id)
    }
  }
  return assistantMessageIds
}

export function getLatestAssistantMessageIdForLatestUserTurn({
  events,
  sessionId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  upToIndex?: number
}): string | undefined {
  const latestUserMessage = getLatestUserMessage({
    events,
    sessionId,
    upToIndex,
  })
  if (!latestUserMessage) {
    return undefined
  }
  const end = upToIndex ?? events.length - 1
  let latestAssistantMessage:
    | Extract<OpenCodeMessage, { role: 'assistant' }>
    | undefined
  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const event = entry.event
    if (event.type !== 'message.updated') {
      continue
    }
    const info = event.properties.info
    if (info.sessionID !== sessionId || info.role !== 'assistant') {
      continue
    }
    if (info.parentID !== latestUserMessage.id) {
      continue
    }
    if (!latestAssistantMessage) {
      latestAssistantMessage = info
      continue
    }
    if (info.time.created > latestAssistantMessage.time.created) {
      latestAssistantMessage = info
    }
  }
  return latestAssistantMessage?.id
}

type EventBufferedAssistantMessage = AssistantMessage & {
  partsSummary?: Array<{ id: string; type: string }>
}

function hasRenderablePartSummary(message: EventBufferedAssistantMessage): boolean {
  if (!('partsSummary' in message) || !Array.isArray(message.partsSummary)) {
    return false
  }
  return message.partsSummary.some((part) => {
    return part.type === 'text' || part.type === 'tool'
  })
}

function hasAssistantPartEvidence({
  events,
  sessionId,
  messageId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  messageId: string
  upToIndex?: number
}): boolean {
  const end = upToIndex ?? events.length - 1
  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const event = entry.event
    if (event.type === 'message.updated') {
      const info = event.properties.info as EventBufferedAssistantMessage
      if (info.sessionID !== sessionId || info.role !== 'assistant' || info.id !== messageId) {
        continue
      }
      if (hasRenderablePartSummary(info)) {
        return true
      }
      continue
    }
    if (event.type !== 'message.part.updated') {
      continue
    }
    const { part } = event.properties
    if (part.messageID !== messageId) {
      continue
    }
    if (part.type === 'text' || part.type === 'tool') {
      return true
    }
  }
  return false
}

function hasAssistantStepFinished({
  events,
  messageId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  messageId: string
  upToIndex?: number
}): boolean {
  const end = upToIndex ?? events.length - 1
  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry || entry.event.type !== 'message.part.updated') {
      continue
    }
    const { part } = entry.event.properties
    if (part.messageID !== messageId) {
      continue
    }
    if (part.type === 'step-finish') {
      return true
    }
  }
  return false
}

export function doesLatestUserTurnHaveNaturalCompletion({
  events,
  sessionId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  upToIndex?: number
}): boolean {
  const latestAssistantMessageId = getLatestAssistantMessageIdForLatestUserTurn({
    events,
    sessionId,
    upToIndex,
  })
  if (!latestAssistantMessageId) {
    return false
  }

  const end = upToIndex ?? events.length - 1
  let latestAssistantMessage: EventBufferedAssistantMessage | undefined
  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const event = entry.event
    if (event.type !== 'message.updated') {
      continue
    }
    const info = event.properties.info
    if (info.sessionID !== sessionId || info.role !== 'assistant') {
      continue
    }
    if (info.id !== latestAssistantMessageId) {
      continue
    }
    latestAssistantMessage = info as EventBufferedAssistantMessage
    if (isAssistantMessageNaturalCompletion({ message: info })) {
      return true
    }
    break
  }

  if (!latestAssistantMessage) {
    return false
  }
  if (latestAssistantMessage.error) {
    return false
  }
  if (latestAssistantMessage.finish === 'tool-calls') {
    return false
  }
  return hasAssistantStepFinished({
    events,
    messageId: latestAssistantMessageId,
    upToIndex,
  }) && hasAssistantPartEvidence({
    events,
    sessionId,
    messageId: latestAssistantMessageId,
    upToIndex,
  })
}

export function isAssistantMessageInLatestUserTurn({
  events,
  sessionId,
  messageId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  sessionId: string
  messageId: string
  upToIndex?: number
}): boolean {
  const assistantMessageIds = getAssistantMessageIdsForLatestUserTurn({
    events,
    sessionId,
    upToIndex,
  })
  return assistantMessageIds.has(messageId)
}

// Returns a stable 1-based subtask index for candidateSessionId.
// Indexing scope is the parent assistant message that spawned the task tool calls,
// so numbering restarts at 1 for each assistant message.
export function getDerivedSubtaskIndex({
  events,
  mainSessionId,
  candidateSessionId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  mainSessionId: string
  candidateSessionId: string
  upToIndex?: number
}): number | undefined {
  const end = upToIndex ?? events.length - 1
  let parentAssistantMessageId: string | undefined

  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const candidate = getTaskCandidateFromEvent({
      event: entry.event,
      mainSessionId,
    })
    if (!candidate) {
      continue
    }
    if (candidate.childSessionId !== candidateSessionId) {
      continue
    }
    parentAssistantMessageId = candidate.assistantMessageId
    break
  }

  if (!parentAssistantMessageId) {
    return undefined
  }

  const indexByChildSessionId = new Map<string, number>()
  for (let i = 0; i <= end; i++) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const candidate = getTaskCandidateFromEvent({
      event: entry.event,
      mainSessionId,
    })
    if (!candidate || candidate.assistantMessageId !== parentAssistantMessageId) {
      continue
    }
    if (!indexByChildSessionId.has(candidate.childSessionId)) {
      indexByChildSessionId.set(
        candidate.childSessionId,
        indexByChildSessionId.size + 1,
      )
    }
  }

  return indexByChildSessionId.get(candidateSessionId)
}

// Returns the subagent_type (e.g. "explore", "general") for a given child session.
// Used to build labels like "explore-1" instead of generic "task-1".
export function getDerivedSubtaskAgentType({
  events,
  mainSessionId,
  candidateSessionId,
}: {
  events: EventBufferEntry[]
  mainSessionId: string
  candidateSessionId: string
}): string | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const candidate = getTaskCandidateFromEvent({
      event: entry.event,
      mainSessionId,
    })
    if (!candidate || candidate.childSessionId !== candidateSessionId) {
      continue
    }
    return candidate.subagentType
  }
  return undefined
}

export function getDerivedSubagentSessions({
  events,
  mainSessionId,
  upToIndex,
}: {
  events: EventBufferEntry[]
  mainSessionId: string
  upToIndex?: number
}): DerivedSubagentSession[] {
  const end = upToIndex ?? events.length - 1
  const seenChildSessionIds = new Set<string>()
  const sessions: DerivedSubagentSession[] = []

  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) {
      continue
    }
    const candidate = getTaskCandidateFromEvent({
      event: entry.event,
      mainSessionId,
    })
    if (!candidate || seenChildSessionIds.has(candidate.childSessionId)) {
      continue
    }

    seenChildSessionIds.add(candidate.childSessionId)
    sessions.push({
      childSessionId: candidate.childSessionId,
      subagentType: candidate.subagentType,
      description: candidate.description,
      timestamp: entry.timestamp,
    })
  }

  return sessions
}

/**
 * A `task` tool part that is still `running` and whose child subagent session
 * has not emitted any event (message.part.updated, session.status, session.idle,
 * message.updated, session.error, …) for at least `stuckMs`.
 *
 * This scans the in-memory event buffer (which contains child-session events,
 * unlike the persisted DB — child events are dropped before persistence, see
 * `persistSessionEventsToDatabase`). So the absence of child events here means
 * the subagent genuinely produced nothing to kimaki's listener, exactly the
 * "suddenly stops, type continue" symptom.
 *
 * See `getOpencodeEventSessionId` for the event-to-session mapping.
 */
export type StuckSubtaskInfo = {
  /** The child subagent session id (`task` part metadata.sessionId). */
  childSessionId: string
  /** The part id of the running `task` tool part. */
  partId: string
  /** The assistant message id owning the `task` tool part. */
  assistantMessageId: string
  subagentType?: string
  description?: string
  /** Timestamp of the running `task` part itself (ms since epoch). */
  taskRunningAt: number
  /** Timestamp of the most recent event emitted BY the child session, or
   * `undefined` when the child has emitted nothing in the buffer. */
  lastChildEventAt: number | undefined
}

export function getStuckSubtasks({
  events,
  mainSessionId,
  nowMs,
  stuckMs,
  upToIndex,
}: {
  events: EventBufferEntry[]
  mainSessionId: string
  nowMs: number
  stuckMs: number
  upToIndex?: number
}): StuckSubtaskInfo[] {
  if (stuckMs <= 0) return []
  const end = upToIndex ?? events.length - 1

  // Collect the most recent "running" task part per child session id.
  // Iterate newest-first so the first hit wins (most recent running part).
  type RunningTaskRecord = {
    part: Extract<Part, { type: 'tool' }>
    taskRunningAt: number
  }
  const runningByChild = new Map<string, RunningTaskRecord>()
  for (let i = end; i >= 0; i--) {
    const entry = events[i]
    if (!entry) continue
    if (entry.event.type !== 'message.part.updated') continue
    const part = entry.event.properties.part
    if (
      part.type !== 'tool' ||
      part.tool !== 'task' ||
      part.state.status !== 'running' ||
      part.sessionID !== mainSessionId
    ) {
      continue
    }
    const childSessionId = getTaskChildSessionIdFromPart(part)
    if (!childSessionId) continue
    if (runningByChild.has(childSessionId)) continue
    runningByChild.set(childSessionId, { part, taskRunningAt: entry.timestamp })
  }

  if (runningByChild.size === 0) return []

  // For each running child, find the most recent event in the buffer whose
  // event sessionID === childSessionId (any event type). None → child emitted
  // nothing since the task was spawned.
  const stuck: StuckSubtaskInfo[] = []
  for (const [childSessionId, record] of runningByChild.entries()) {
    const part = record.part
    let lastChildEventAt: number | undefined
    for (let j = end; j >= 0; j--) {
      const candidate = events[j]
      if (!candidate) continue
      const sid = getEventBufferSessionId(candidate.event)
      if (sid === childSessionId) {
        lastChildEventAt = candidate.timestamp
        break
      }
    }

    // Staleness baseline: neither the task part itself counts as a child
    // event (it belongs to the main session), so use the task part's own
    // timestamp when the child has never emitted. This matches the user
    // expectation: "warn after N minutes of silence since the subtask began."
    const effectiveLastAt =
      lastChildEventAt !== undefined ? lastChildEventAt : record.taskRunningAt
    if (nowMs - effectiveLastAt < stuckMs) continue

    // `subagent_type` and `description` live on `state.input`, which the
    // runtime compactor preserves for task tools (see compactEventForEventBuffer).
    // `metadata` only carries sessionId/parentSessionId/model.
    const inputValue = (part.state as { input?: unknown }).input
    const subagentType =
      inputValue && typeof inputValue === 'object'
        ? (inputValue as { subagent_type?: unknown }).subagent_type
        : undefined
    const description =
      inputValue && typeof inputValue === 'object'
        ? (inputValue as { description?: unknown }).description
        : undefined
    stuck.push({
      childSessionId,
      partId: part.id,
      assistantMessageId: part.messageID,
      subagentType:
        typeof subagentType === 'string' ? subagentType : undefined,
      description: typeof description === 'string' ? description : undefined,
      taskRunningAt: record.taskRunningAt,
      lastChildEventAt,
    })
  }

  return stuck
}

// Keep getTaskChildSessionIdFromPart local to event-stream-state to avoid the
// runtime importing from the forward-only `getTaskChildSessionId` reserved for
// the thread-session-runtime module. Mirrors its extraction logic.
function getTaskChildSessionIdFromPart(
  part: Extract<Part, { type: 'tool' }>,
): string | undefined {
  if (part.type !== 'tool') return undefined
  const metadataValue = (part.state as { metadata?: unknown }).metadata
  const metadataSessionId =
    metadataValue && typeof metadataValue === 'object'
      ? (metadataValue as { sessionId?: unknown }).sessionId
      : undefined
  if (typeof metadataSessionId === 'string' && metadataSessionId.length > 0) {
    return metadataSessionId
  }
  return undefined
}
