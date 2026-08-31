// Fixture-driven tests for pure event-stream derivation helpers.
// Focuses on assistant message completion boundaries instead of session.idle.

import fs from 'node:fs'
import path from 'node:path'
import type { Message as OpenCodeMessage } from '@opencode-ai/sdk/v2'
import { describe, expect, test } from 'vitest'
import { type OpencodeEventLogEntry } from './opencode-session-event-log.js'
import {
  derivePendingPermissionRequests,
  getAssistantMessageIdsForLatestUserTurn,
  getDerivedSubagentSessions,
  getEventBufferSessionId,
  getCurrentTurnStartTime,
  getDerivedSubtaskIndex,
  getLatestAssistantMessageIdForLatestUserTurn,
  getLatestRunInfo,
  getPerModelUsage,
  getStuckSubtasks,
  hasAssistantMessageCompletedBefore,
  doesLatestUserTurnHaveNaturalCompletion,
  isAssistantMessageInLatestUserTurn,
  isAssistantMessageNaturalCompletion,
  isSessionBusy,
  type EventBufferEntry,
} from './event-stream-state.js'

const fixturesDir = path.join(import.meta.dirname, 'event-stream-fixtures')
type AssistantMessage = Extract<OpenCodeMessage, { role: 'assistant' }>

function loadFixture(filename: string): EventBufferEntry[] {
  const content = fs.readFileSync(path.join(fixturesDir, filename), 'utf8')
  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const parsed = JSON.parse(line) as OpencodeEventLogEntry
      return { event: parsed.event, timestamp: parsed.timestamp }
    })
}

function getSessionId(events: EventBufferEntry[]): string {
  for (const entry of events) {
    const sessionId = getEventBufferSessionId(entry.event)
    if (sessionId) {
      return sessionId
    }
  }
  throw new Error('No sessionId found in fixture')
}

function getAssistantMessages(events: EventBufferEntry[], sessionId: string) {
  const messagesById = new Map<string, AssistantMessage>()
  events.forEach((entry) => {
    if (entry.event.type !== 'message.updated') {
      return
    }
    const info = entry.event.properties.info
    if (info.sessionID !== sessionId || info.role !== 'assistant') {
      return
    }
    messagesById.set(info.id, info)
  })
  return [...messagesById.values()]
}

function getAssistantMessageById({
  events,
  sessionId,
  messageId,
}: {
  events: EventBufferEntry[]
  sessionId: string
  messageId: string
}): AssistantMessage {
  const message = getAssistantMessages(events, sessionId).find((candidate) => {
    return candidate.id === messageId
  })
  if (!message) {
    throw new Error(`Assistant message ${messageId} not found`)
  }
  return message
}

// Test fixtures omit the top-level event `id` for brevity. The SDK event types
// require it, so inject a synthetic id when missing. Derivation never reads the
// top-level id (only properties.id / info.id), so the value is irrelevant.
let syntheticEventIdCounter = 0
function eventEntry(
  event: Omit<EventBufferEntry['event'], 'id'> & { id?: string },
): EventBufferEntry {
  const withId = ('id' in event && event.id
    ? event
    : { ...event, id: `evt_${++syntheticEventIdCounter}` }) as EventBufferEntry['event']
  return { event: withId, timestamp: 1 }
}

function findAssistantCompletionEventIndex({
  events,
  sessionId,
  messageId,
}: {
  events: EventBufferEntry[]
  sessionId: string
  messageId: string
}): number {
  const index = events.findIndex((entry) => {
    if (entry.event.type !== 'message.updated') {
      return false
    }
    const info = entry.event.properties.info
    return info.sessionID === sessionId
      && info.role === 'assistant'
      && info.id === messageId
      && typeof info.time.completed === 'number'
  })
  if (index === -1) {
    throw new Error(`Completed assistant message ${messageId} not found`)
  }
  return index
}

describe('session-normal-completion', () => {
  const events = loadFixture('session-normal-completion.jsonl')
  const sessionId = getSessionId(events)
  const latestAssistantMessageId = getLatestAssistantMessageIdForLatestUserTurn({
    events,
    sessionId,
  })

  test('latest assistant message completes naturally', () => {
    if (!latestAssistantMessageId) {
      throw new Error('Expected latest assistant message')
    }
    const message = getAssistantMessageById({
      events,
      sessionId,
      messageId: latestAssistantMessageId,
    })
    expect(isAssistantMessageNaturalCompletion({ message })).toBe(true)
  })

  test('latest user turn start time comes from the latest user message', () => {
    expect(getCurrentTurnStartTime({ events, sessionId })).toBe(1772636294845)
  })

  test('completion history only appears after the completed update lands', () => {
    if (!latestAssistantMessageId) {
      throw new Error('Expected latest assistant message')
    }
    const completionIndex = findAssistantCompletionEventIndex({
      events,
      sessionId,
      messageId: latestAssistantMessageId,
    })
    expect(hasAssistantMessageCompletedBefore({
      events,
      sessionId,
      messageId: latestAssistantMessageId,
      upToIndex: completionIndex - 1,
    })).toBe(false)
    expect(hasAssistantMessageCompletedBefore({
      events,
      sessionId,
      messageId: latestAssistantMessageId,
    })).toBe(true)
  })

  test('completion history survives later non-completed duplicate updates', () => {
    const messageId = 'msg_duplicate_completion'
    const duplicateEvents: EventBufferEntry[] = [
      eventEntry({
        type: 'message.updated',
        properties: {
          sessionID: sessionId,
          info: {
            id: messageId,
            sessionID: sessionId,
            role: 'assistant',
            time: { created: 1, completed: 2 },
            parentID: 'msg_user',
            modelID: 'deterministic-v2',
            providerID: 'deterministic-provider',
            mode: 'build',
            agent: 'build',
            path: { cwd: '/test', root: '/test' },
            cost: 0,
            tokens: {
              input: 1,
              output: 1,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
            finish: 'stop',
          },
        },
      }),
      eventEntry({
        type: 'message.updated',
        properties: {
          sessionID: sessionId,
          info: {
            id: messageId,
            sessionID: sessionId,
            role: 'assistant',
            time: { created: 1 },
            parentID: 'msg_user',
            modelID: 'deterministic-v2',
            providerID: 'deterministic-provider',
            mode: 'build',
            agent: 'build',
            path: { cwd: '/test', root: '/test' },
            cost: 0,
            finish: 'stop',
          },
        },
      }),
    ]

    expect(hasAssistantMessageCompletedBefore({
      events: duplicateEvents,
      sessionId,
      messageId,
    })).toBe(true)
  })

  test('getLatestRunInfo', () => {
    expect(getLatestRunInfo({ events, sessionId })).toEqual({
      model: 'deterministic-v2',
      providerID: 'deterministic-provider',
      agent: 'build',
      tokensUsed: 2,
    })
  })
})

describe('derivePendingPermissionRequests', () => {
  test('tracks unresolved permission requests', () => {
    const sessionId = 'ses_pending_permission'
    const events = [
      eventEntry({
        type: 'permission.asked',
        properties: {
          id: 'perm_1',
          sessionID: sessionId,
          permission: 'bash',
          patterns: ['*'],
          always: [],
          metadata: {},
        },
      }),
      eventEntry({
        type: 'permission.asked',
        properties: {
          id: 'perm_2',
          sessionID: sessionId,
          permission: 'edit',
          patterns: ['src/**'],
          always: [],
          metadata: {},
        },
      }),
      eventEntry({
        type: 'permission.replied',
        properties: {
          requestID: 'perm_1',
          sessionID: sessionId,
          reply: 'once',
        },
      }),
    ]

    expect(derivePendingPermissionRequests({ events, sessionId })).toMatchInlineSnapshot(`
      [
        "perm_2",
      ]
    `)
  })
})

describe('session-explicit-abort', () => {
  const events = loadFixture('session-explicit-abort.jsonl')
  const sessionId = getSessionId(events)
  const assistantMessages = getAssistantMessages(events, sessionId)
  const latestAssistant = assistantMessages[assistantMessages.length - 1]

  test('aborted assistant message is not a natural completion', () => {
    if (!latestAssistant) {
      throw new Error('Expected assistant message in fixture')
    }
    expect(isAssistantMessageNaturalCompletion({ message: latestAssistant })).toBe(false)
  })
})

describe('session-user-interruption', () => {
  const events = loadFixture('session-user-interruption.jsonl')
  const sessionId = getSessionId(events)
  const firstAssistantId = 'msg_cb95be135001I1vqtzLtT4Q1iQ'
  const slowSleepAssistantId = 'msg_cb95be39e001huREyY2wfjgV1M'
  const followupAssistantId = 'msg_cb95beeb8001MuEOER9WprXsPC'

  test('latest user turn only includes the follow-up assistant message', () => {
    expect(isAssistantMessageInLatestUserTurn({
      events,
      sessionId,
      messageId: firstAssistantId,
    })).toBe(false)
    expect(isAssistantMessageInLatestUserTurn({
      events,
      sessionId,
      messageId: slowSleepAssistantId,
    })).toBe(false)
    expect(isAssistantMessageInLatestUserTurn({
      events,
      sessionId,
      messageId: followupAssistantId,
    })).toBe(true)
  })

  test('latest user turn start time follows the follow-up user message', () => {
    expect(getCurrentTurnStartTime({ events, sessionId })).toBe(1772636335777)
  })
})

describe('session-two-completions-same-session', () => {
  const events = loadFixture('session-two-completions-same-session.jsonl')
  const sessionId = getSessionId(events)
  const assistantMessages = getAssistantMessages(events, sessionId)
  const firstAssistant = assistantMessages[0]
  const secondAssistant = assistantMessages[1]

  test('latest user turn points at the second completion only', () => {
    if (!firstAssistant || !secondAssistant) {
      throw new Error('Expected two assistant messages in fixture')
    }
    expect(isAssistantMessageInLatestUserTurn({
      events,
      sessionId,
      messageId: firstAssistant.id,
    })).toBe(false)
    expect(isAssistantMessageInLatestUserTurn({
      events,
      sessionId,
      messageId: secondAssistant.id,
    })).toBe(true)
    expect(getLatestAssistantMessageIdForLatestUserTurn({
      events,
      sessionId,
    })).toBe(secondAssistant.id)
  })
})

describe('session-concurrent-messages-serialized', () => {
  const events = loadFixture('session-concurrent-messages-serialized.jsonl')
  const sessionId = getSessionId(events)
  const latestAssistantMessageId = getLatestAssistantMessageIdForLatestUserTurn({
    events,
    sessionId,
  })

  test('fixture latest turn is still incomplete even though an older turn completed', () => {
    expect(doesLatestUserTurnHaveNaturalCompletion({
      events,
      sessionId,
    })).toBe(false)
    if (!latestAssistantMessageId) {
      throw new Error('Expected latest assistant message')
    }
    const message = getAssistantMessageById({
      events,
      sessionId,
      messageId: latestAssistantMessageId,
    })
    expect(message.id).toBe(latestAssistantMessageId)
  })
})

describe('session-tool-call-noisy-stream', () => {
  const events = loadFixture('session-tool-call-noisy-stream.jsonl')
  const sessionId = getSessionId(events)
  const latestAssistantMessageId = getLatestAssistantMessageIdForLatestUserTurn({
    events,
    sessionId,
  })

  test('fixture ends busy on a tool-call handoff message', () => {
    expect(isSessionBusy({ events, sessionId })).toBe(true)
    if (!latestAssistantMessageId) {
      throw new Error('Expected latest assistant message')
    }
    const message = getAssistantMessageById({
      events,
      sessionId,
      messageId: latestAssistantMessageId,
    })
    expect(isAssistantMessageNaturalCompletion({ message })).toBe(false)
  })

  test('getLatestRunInfo still works through dense tool events', () => {
    expect(getLatestRunInfo({ events, sessionId })).toEqual({
      model: 'deterministic-v2',
      providerID: 'deterministic-provider',
      agent: 'build',
      tokensUsed: 0,
    })
  })
})

describe('session-voice-queued-followup', () => {
  const events = loadFixture('session-voice-queued-followup.jsonl')
  const sessionId = getSessionId(events)

  test('latest user turn start moves to the queued follow-up', () => {
    expect(getCurrentTurnStartTime({ events, sessionId })).toBe(1772636414577)
  })
})

describe('synthetic-question-followup', () => {
  const sessionId = 'ses_question'
  const events: EventBufferEntry[] = [
    {
      timestamp: 1,
      event: {
        id: 'evt_user_1',
        type: 'message.updated',
        properties: {
          sessionID: sessionId,
          info: {
            id: 'msg_user_1',
            sessionID: sessionId,
            role: 'user',
            time: { created: 1 },
            agent: 'build',
            model: {
              providerID: 'deterministic-provider',
              modelID: 'deterministic-v2',
            },
          },
        },
      },
    },
    {
      timestamp: 2,
      event: {
        id: 'evt_asst_1',
        type: 'message.updated',
        properties: {
          sessionID: sessionId,
          info: {
            id: 'msg_asst_1',
            sessionID: sessionId,
            role: 'assistant',
            time: { created: 2, completed: 3 },
            parentID: 'msg_user_1',
            modelID: 'deterministic-v2',
            providerID: 'deterministic-provider',
            mode: 'build',
            agent: 'build',
            path: { cwd: '/test', root: '/test' },
            cost: 0,
            tokens: {
              input: 1,
              output: 1,
              reasoning: 0,
              cache: { read: 0, write: 0 },
            },
            finish: 'stop',
          },
        },
      },
    },
    {
      timestamp: 4,
      event: {
        id: 'evt_user_2',
        type: 'message.updated',
        properties: {
          sessionID: sessionId,
          info: {
            id: 'msg_user_2',
            sessionID: sessionId,
            role: 'user',
            time: { created: 4 },
            agent: 'build',
            model: {
              providerID: 'deterministic-provider',
              modelID: 'deterministic-v2',
            },
          },
        },
      },
    },
  ]

  test('latest user turn flips immediately after the follow-up user message', () => {
    expect(isAssistantMessageInLatestUserTurn({
      events,
      sessionId,
      messageId: 'msg_asst_1',
    })).toBe(false)
    expect(getCurrentTurnStartTime({ events, sessionId })).toBe(4)
  })
})

describe('real-session-task-normal', () => {
  const events = loadFixture('real-session-task-normal.jsonl')
  const sessionId = getSessionId(events)
  const latestAssistantMessageId = getLatestAssistantMessageIdForLatestUserTurn({
    events,
    sessionId,
  })

  test('latest assistant completion is terminal', () => {
    if (!latestAssistantMessageId) {
      throw new Error('Expected latest assistant message')
    }
    const message = getAssistantMessageById({
      events,
      sessionId,
      messageId: latestAssistantMessageId,
    })
    expect(isAssistantMessageNaturalCompletion({ message })).toBe(true)
  })

  test('getLatestRunInfo has model info', () => {
    expect(getLatestRunInfo({ events, sessionId })).toEqual({
      model: 'gemini-2.5-flash',
      providerID: 'cached-google-real-events',
      agent: 'build',
      tokensUsed: 39025,
    })
  })
})

describe('real-session-task-user-interruption', () => {
  const events = loadFixture('real-session-task-user-interruption.jsonl')
  const sessionId = getSessionId(events)
  const childSessionId = 'ses_3464f3a1dffeBBD0d15EqnGjAh'
  const firstAssistantId = 'msg_cb9b0ba96001SpPjgzxWPmRuW9'
  const secondAssistantId = 'msg_cb9b1ae5c001E5G3Ql6aXNpst2'

  test('tool-call handoff assistant is not a natural completion but the resumed reply is', () => {
    const firstAssistant = getAssistantMessageById({
      events,
      sessionId,
      messageId: firstAssistantId,
    })
    const secondAssistant = getAssistantMessageById({
      events,
      sessionId,
      messageId: secondAssistantId,
    })
    // The first message finished with tool-calls — not a natural completion
    // (footer is deferred to session.idle). The second message IS natural.
    expect(isAssistantMessageNaturalCompletion({ message: firstAssistant })).toBe(false)
    expect(isAssistantMessageNaturalCompletion({ message: secondAssistant })).toBe(true)
  })

  test('latest user turn keeps both assistant messages for the same user turn', () => {
    const assistantIds = getAssistantMessageIdsForLatestUserTurn({ events, sessionId })
    expect(assistantIds.has(firstAssistantId)).toBe(true)
    expect(assistantIds.has(secondAssistantId)).toBe(true)
    expect(getLatestAssistantMessageIdForLatestUserTurn({
      events,
      sessionId,
    })).toBe(secondAssistantId)
  })

  test('getDerivedSubtaskIndex starts at 1 for first task of assistant message', () => {
    expect(getDerivedSubtaskIndex({
      events,
      mainSessionId: sessionId,
      candidateSessionId: childSessionId,
    })).toBe(1)
  })

  test('getDerivedSubtaskIndex restarts at 1 for a newer assistant message', () => {
    const firstTaskEvent = events.find((entry) => {
      if (entry.event.type !== 'message.part.updated') {
        return false
      }
      const part = entry.event.properties.part
      if (part.sessionID !== sessionId) {
        return false
      }
      if (part.type !== 'tool' || part.tool !== 'task') {
        return false
      }
      if (part.state.status !== 'running' && part.state.status !== 'completed') {
        return false
      }
      return part.state.metadata?.sessionId === childSessionId
    })
    if (!firstTaskEvent) {
      throw new Error('Expected to find task tool event in fixture')
    }

    const secondChildSessionId = 'ses_synthetic_child_2'
    const thirdChildSessionId = 'ses_synthetic_child_3'
    const syntheticAssistantMessageId = 'msg_synthetic_new_assistant'

    const secondTaskEvent = structuredClone(firstTaskEvent)
    if (secondTaskEvent.event.type !== 'message.part.updated') {
      throw new Error('Expected message.part.updated event')
    }
    const secondTaskPart = secondTaskEvent.event.properties.part
    if (secondTaskPart.type !== 'tool' || secondTaskPart.tool !== 'task') {
      throw new Error('Expected task tool part')
    }
    if (secondTaskPart.state.status !== 'completed') {
      throw new Error('Expected completed task tool part')
    }
    secondTaskPart.id = `${secondTaskPart.id}-synthetic-2`
    secondTaskPart.messageID = syntheticAssistantMessageId
    secondTaskPart.state = {
      ...secondTaskPart.state,
      metadata: {
        ...(secondTaskPart.state.metadata || {}),
        sessionId: secondChildSessionId,
      },
      output: `task_id: ${secondChildSessionId}`,
    }

    const thirdTaskEvent = structuredClone(secondTaskEvent)
    if (thirdTaskEvent.event.type !== 'message.part.updated') {
      throw new Error('Expected message.part.updated event')
    }
    const thirdTaskPart = thirdTaskEvent.event.properties.part
    if (thirdTaskPart.type !== 'tool' || thirdTaskPart.tool !== 'task') {
      throw new Error('Expected task tool part')
    }
    if (thirdTaskPart.state.status !== 'completed') {
      throw new Error('Expected completed task tool part')
    }
    thirdTaskPart.id = `${thirdTaskPart.id}-synthetic-3`
    thirdTaskPart.messageID = syntheticAssistantMessageId
    thirdTaskPart.state = {
      ...thirdTaskPart.state,
      metadata: {
        ...(thirdTaskPart.state.metadata || {}),
        sessionId: thirdChildSessionId,
      },
      output: `task_id: ${thirdChildSessionId}`,
    }

    const lastTimestamp = events[events.length - 1]?.timestamp || 0
    const augmentedEvents: EventBufferEntry[] = [
      ...events,
      {
        timestamp: lastTimestamp + 1,
        event: secondTaskEvent.event,
      },
      {
        timestamp: lastTimestamp + 2,
        event: thirdTaskEvent.event,
      },
    ]

    expect(getDerivedSubtaskIndex({
      events: augmentedEvents,
      mainSessionId: sessionId,
      candidateSessionId: childSessionId,
    })).toBe(1)
    expect(getDerivedSubtaskIndex({
      events: augmentedEvents,
      mainSessionId: sessionId,
      candidateSessionId: secondChildSessionId,
    })).toBe(1)
    expect(getDerivedSubtaskIndex({
      events: augmentedEvents,
      mainSessionId: sessionId,
      candidateSessionId: thirdChildSessionId,
    })).toBe(2)
  })

  test('getDerivedSubtaskIndex returns undefined for unknown session', () => {
    expect(getDerivedSubtaskIndex({
      events,
      mainSessionId: sessionId,
      candidateSessionId: 'ses_nonexistent',
    })).toBe(undefined)
  })

  test('getDerivedSubagentSessions returns latest tasks first with agent labels', () => {
    const firstTaskEvent = events.find((entry) => {
      if (entry.event.type !== 'message.part.updated') {
        return false
      }
      const part = entry.event.properties.part
      if (part.sessionID !== sessionId) {
        return false
      }
      if (part.type !== 'tool' || part.tool !== 'task') {
        return false
      }
      return part.state.status === 'running' || part.state.status === 'completed'
    })
    if (!firstTaskEvent || firstTaskEvent.event.type !== 'message.part.updated') {
      throw new Error('Expected to find task tool event in fixture')
    }

    const newerTaskEvent = structuredClone(firstTaskEvent)
    if (newerTaskEvent.event.type !== 'message.part.updated') {
      throw new Error('Expected message.part.updated event')
    }
    const newerTaskPart = newerTaskEvent.event.properties.part
    if (newerTaskPart.type !== 'tool' || newerTaskPart.tool !== 'task') {
      throw new Error('Expected task tool part')
    }
    if (newerTaskPart.state.status !== 'running' && newerTaskPart.state.status !== 'completed') {
      throw new Error('Expected running or completed task tool part')
    }
    newerTaskPart.id = `${newerTaskPart.id}-newer`
    newerTaskPart.state = {
      ...newerTaskPart.state,
      input: {
        ...newerTaskPart.state.input,
        description: 'inspect recent task output',
        subagent_type: 'explore',
      },
      metadata: {
        ...(newerTaskPart.state.metadata || {}),
        sessionId: 'ses_newer_child',
      },
    }

    const latestTimestamp = events[events.length - 1]?.timestamp || 0
    const augmentedEvents: EventBufferEntry[] = [
      ...events,
      {
        timestamp: latestTimestamp + 1,
        event: newerTaskEvent.event,
      },
    ]

    expect(getDerivedSubagentSessions({
      events: augmentedEvents,
      mainSessionId: sessionId,
    })).toMatchInlineSnapshot(`
      [
        {
          "childSessionId": "ses_newer_child",
          "description": "inspect recent task output",
          "subagentType": "explore",
          "timestamp": 1772641957983,
        },
        {
          "childSessionId": "ses_3464f3a1dffeBBD0d15EqnGjAh",
          "description": undefined,
          "subagentType": undefined,
          "timestamp": 1772641955371,
        },
      ]
    `)
  })
})

describe('real-session-action-buttons', () => {
  const events = loadFixture('real-session-action-buttons.jsonl')
  const sessionId = getSessionId(events)
  const toolCallAssistantId = 'msg_cb9b55c3b001hXC9qxjVxLMypM'
  const finalAssistantId = 'msg_cb9b5ddd1001FALqKNM6xW98u6'

  test('tool-call handoff assistant is not a natural completion but final reply is', () => {
    const toolCallAssistant = getAssistantMessageById({
      events,
      sessionId,
      messageId: toolCallAssistantId,
    })
    const finalAssistant = getAssistantMessageById({
      events,
      sessionId,
      messageId: finalAssistantId,
    })
    // The tool-call message has finish="tool-calls" — not a natural completion
    // (footer is deferred to session.idle). The final text message IS natural.
    expect(isAssistantMessageNaturalCompletion({ message: toolCallAssistant })).toBe(false)
    expect(isAssistantMessageNaturalCompletion({ message: finalAssistant })).toBe(true)
  })

  test('latest user turn keeps both assistant messages for the same user turn', () => {
    const assistantIds = getAssistantMessageIdsForLatestUserTurn({ events, sessionId })
    expect(assistantIds.has(toolCallAssistantId)).toBe(true)
    expect(assistantIds.has(finalAssistantId)).toBe(true)
    expect(getLatestAssistantMessageIdForLatestUserTurn({
      events,
      sessionId,
    })).toBe(finalAssistantId)
  })
})

describe('real-session-permission-external-file', () => {
  const events = loadFixture('real-session-permission-external-file.jsonl')
  const sessionId = getSessionId(events)

  test('permission flow has no terminal assistant completion yet', () => {
    const latestAssistantMessageId = getLatestAssistantMessageIdForLatestUserTurn({
      events,
      sessionId,
    })
    expect(latestAssistantMessageId).toBeDefined()
    if (!latestAssistantMessageId) {
      return
    }
    const message = getAssistantMessageById({
      events,
      sessionId,
      messageId: latestAssistantMessageId,
    })
    expect(isAssistantMessageNaturalCompletion({ message })).toBe(false)
  })
})

describe('real-session-footer-suppressed-on-pre-idle-interrupt', () => {
  const events = loadFixture('real-session-footer-suppressed-on-pre-idle-interrupt.jsonl')
  const sessionId = getSessionId(events)
  const oldAssistantId = 'msg_cbda8f408001VATHNUi9l05XqA'
  const abortedAssistantId = 'msg_cbda90cef001GOQW8EQxkUz9b5'
  const latestAssistantId = 'msg_cbda91463001DvEB6YMCXayZNj'

  test('latest user turn ignores stale assistant messages from the interrupted turn', () => {
    expect(isAssistantMessageInLatestUserTurn({
      events,
      sessionId,
      messageId: oldAssistantId,
    })).toBe(false)
    expect(isAssistantMessageInLatestUserTurn({
      events,
      sessionId,
      messageId: abortedAssistantId,
    })).toBe(false)
    expect(isAssistantMessageInLatestUserTurn({
      events,
      sessionId,
      messageId: latestAssistantId,
    })).toBe(true)
  })
})

describe('multi-model-subagents per-model usage', () => {
  const events = loadFixture('multi-model-subagents.jsonl')

  test('aggregates usage across main and subtask sessions, sorted by total tokens', () => {
    expect(getPerModelUsage({ events })).toMatchInlineSnapshot(`
      [
        {
          "cost": 0.014,
          "messageCount": 2,
          "modelID": "gpt-5.3-codex",
          "providerID": "openai",
          "tokensCacheRead": 8000,
          "tokensCacheWrite": 100,
          "tokensInput": 1500,
          "tokensOutput": 300,
          "tokensReasoning": 50,
          "totalTokens": 9950,
        },
        {
          "cost": 0.007,
          "messageCount": 2,
          "modelID": "claude-opus-4-6",
          "providerID": "anthropic",
          "tokensCacheRead": 3000,
          "tokensCacheWrite": 0,
          "tokensInput": 450,
          "tokensOutput": 120,
          "tokensReasoning": 10,
          "totalTokens": 3580,
        },
      ]
    `)
  })

  test('ignores user messages even when they carry model info', () => {
    const usage = getPerModelUsage({ events })
    const gpt5 = usage.find((u) => u.modelID === 'gpt-5.3-codex')
    expect(gpt5?.messageCount).toBe(2)
  })
})

describe('getStuckSubtasks', () => {
  const sessionId = 'ses_main'

  function taskPartEvent({
    partId,
    status,
    childSessionId,
    subagentType = 'task',
    description,
    eventSessionId = sessionId,
    assistantMessageId = 'msg_assistant',
  }: {
    partId: string
    status: 'pending' | 'running' | 'completed' | 'error'
    childSessionId: string
    subagentType?: string
    description?: string
    eventSessionId?: string
    assistantMessageId?: string
  }): EventBufferEntry['event'] {
    const part = {
      id: partId,
      type: 'tool',
      tool: 'task',
      sessionID: eventSessionId,
      messageID: assistantMessageId,
      callID: `call_${partId}`,
      state: {
        status,
        input: { subagent_type: subagentType, description },
        output: '',
        title: description ?? 'task',
        metadata: { sessionId: childSessionId },
        time: { start: 0, end: 0 },
      },
    }
    return {
      id: `evt_${partId}_${status}`,
      type: 'message.part.updated',
      properties: { part, time: 0 },
    } as unknown as EventBufferEntry['event']
  }

  function childPartEvent({
    eventSessionId,
    partId,
  }: {
    eventSessionId: string
    partId: string
  }): EventBufferEntry['event'] {
    const part = {
      id: partId,
      type: 'text',
      sessionID: eventSessionId,
      messageID: 'msg_child_assistant',
      text: 'child progress',
      time: { start: 0, end: 0 },
    }
    return {
      id: `evt_child_${partId}`,
      type: 'message.part.updated',
      properties: { part, time: 0 },
    } as unknown as EventBufferEntry['event']
  }

  function childIdleEvent({
    eventSessionId,
  }: {
    eventSessionId: string
  }): EventBufferEntry['event'] {
    return {
      id: `evt_idle_${eventSessionId}`,
      type: 'session.idle',
      properties: { sessionID: eventSessionId },
    } as unknown as EventBufferEntry['event']
  }

  test('flags a running task whose child emitted nothing within the window', () => {
    // task running at t=0; now is 10 minutes later; child never emitted anything
    const events: EventBufferEntry[] = [
      { event: taskPartEvent({ partId: 'p1', status: 'running', childSessionId: 'ses_child', subagentType: 'explore', description: 'find the race condition' }), timestamp: 0 },
    ]
    const result = getStuckSubtasks({
      events,
      mainSessionId: sessionId,
      nowMs: 10 * 60 * 1000,
      stuckMs: 5 * 60 * 1000,
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.childSessionId).toBe('ses_child')
    expect(result[0]?.lastChildEventAt).toBeUndefined()
    // subagent_type and description are read from state.input (where the
    // runtime compactor preserves them), not from metadata.
    expect(result[0]?.subagentType).toBe('explore')
    expect(result[0]?.description).toBe('find the race condition')
    expect(result[0]?.partId).toBe('p1')
    expect(result[0]?.assistantMessageId).toBe('msg_assistant')
    expect(result[0]?.taskRunningAt).toBe(0)
  })

  test('falls back to undefined subagentType/description when not present in input', () => {
    // Build inline so the helper's `subagentType = 'task'` default doesn't mask
    // the missing-field case.
    const part = {
      id: 'p1',
      type: 'tool',
      tool: 'task',
      sessionID: sessionId,
      messageID: 'msg_assistant',
      callID: 'call_p1',
      state: {
        status: 'running',
        // No subagent_type, no description
        input: {},
        output: '',
        title: 'task',
        metadata: { sessionId: 'ses_child' },
        time: { start: 0, end: 0 },
      },
    }
    const events: EventBufferEntry[] = [
      {
        event: {
          id: 'evt_p1',
          type: 'message.part.updated',
          properties: { part, time: 0 },
        } as unknown as EventBufferEntry['event'],
        timestamp: 0,
      },
    ]
    const result = getStuckSubtasks({
      events,
      mainSessionId: sessionId,
      nowMs: 10 * 60 * 1000,
      stuckMs: 5 * 60 * 1000,
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.subagentType).toBeUndefined()
    expect(result[0]?.description).toBeUndefined()
  })

  test('does not flag a running task whose child emitted recently', () => {
    // task running at t=0; child emitted a text part at t=30s; now is t=2min
    const events: EventBufferEntry[] = [
      { event: taskPartEvent({ partId: 'p1', status: 'running', childSessionId: 'ses_child' }), timestamp: 0 },
      { event: childPartEvent({ eventSessionId: 'ses_child', partId: 'cp1' }), timestamp: 30 * 1000 },
    ]
    const result = getStuckSubtasks({
      events,
      mainSessionId: sessionId,
      nowMs: 2 * 60 * 1000,
      stuckMs: 5 * 60 * 1000,
    })
    expect(result).toHaveLength(0)
  })

  test('does not flag a completed task part', () => {
    const events: EventBufferEntry[] = [
      { event: taskPartEvent({ partId: 'p1', status: 'completed', childSessionId: 'ses_child' }), timestamp: 0 },
    ]
    const result = getStuckSubtasks({
      events,
      mainSessionId: sessionId,
      nowMs: 10 * 60 * 1000,
      stuckMs: 5 * 60 * 1000,
    })
    expect(result).toHaveLength(0)
  })

  test('flags a child that emitted long ago then went silent', () => {
    // child emitted a part at t=1min, then nothing; now is t=10min; stuckMs=5min
    const events: EventBufferEntry[] = [
      { event: taskPartEvent({ partId: 'p1', status: 'running', childSessionId: 'ses_child' }), timestamp: 0 },
      { event: childPartEvent({ eventSessionId: 'ses_child', partId: 'cp1' }), timestamp: 60 * 1000 },
    ]
    const result = getStuckSubtasks({
      events,
      mainSessionId: sessionId,
      nowMs: 10 * 60 * 1000,
      stuckMs: 5 * 60 * 1000,
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.lastChildEventAt).toBe(60 * 1000)
  })

  test('does not flag when child just sent session.idle (natural completion settling)', () => {
    const events: EventBufferEntry[] = [
      { event: taskPartEvent({ partId: 'p1', status: 'running', childSessionId: 'ses_child' }), timestamp: 0 },
      // task completed will arrive next, but session.idle already arrived at t=5s
      { event: childIdleEvent({ eventSessionId: 'ses_child' }), timestamp: 5 * 1000 },
    ]
    const result = getStuckSubtasks({
      events,
      mainSessionId: sessionId,
      nowMs: 2 * 1000, // only 2s after idle → not stale
      stuckMs: 5 * 60 * 1000,
    })
    expect(result).toHaveLength(0)
  })

  test('ignores events from other directories / sessions', () => {
    const events: EventBufferEntry[] = [
      // task part whose part.sessionID belongs to a different main session
      { event: taskPartEvent({ partId: 'p1', status: 'running', childSessionId: 'ses_child', eventSessionId: 'ses_other' }), timestamp: 0 },
    ]
    const result = getStuckSubtasks({
      events,
      mainSessionId: sessionId,
      nowMs: 10 * 60 * 1000,
      stuckMs: 5 * 60 * 1000,
    })
    expect(result).toHaveLength(0)
  })

  test('handles multiple parallel running subtasks independently', () => {
    // child_a: running since t=0, emitted at t=200s → staleness 200s (<300s, fresh)
    // child_b: running since t=100s, emitted nothing → staleness 300s (>=300s, stuck)
    const events: EventBufferEntry[] = [
      { event: taskPartEvent({ partId: 'p1', status: 'running', childSessionId: 'ses_child_a' }), timestamp: 0 },
      { event: taskPartEvent({ partId: 'p2', status: 'running', childSessionId: 'ses_child_b' }), timestamp: 100 * 1000 },
      { event: childPartEvent({ eventSessionId: 'ses_child_a', partId: 'cp1' }), timestamp: 200 * 1000 },
    ]
    const result = getStuckSubtasks({
      events,
      mainSessionId: sessionId,
      nowMs: 400 * 1000,
      stuckMs: 300 * 1000,
    })
    expect(result).toHaveLength(1)
    expect(result[0]?.childSessionId).toBe('ses_child_b')
  })

  test('disables when stuckMs <= 0', () => {
    const events: EventBufferEntry[] = [
      { event: taskPartEvent({ partId: 'p1', status: 'running', childSessionId: 'ses_child' }), timestamp: 0 },
    ]
    expect(getStuckSubtasks({ events, mainSessionId: sessionId, nowMs: 999_999_999, stuckMs: 0 })).toHaveLength(0)
    expect(getStuckSubtasks({ events, mainSessionId: sessionId, nowMs: 999_999_999, stuckMs: -1 })).toHaveLength(0)
  })

  test('does not flag a running task within the stuckMs grace window', () => {
    const events: EventBufferEntry[] = [
      { event: taskPartEvent({ partId: 'p1', status: 'running', childSessionId: 'ses_child' }), timestamp: 0 },
    ]
    const result = getStuckSubtasks({
      events,
      mainSessionId: sessionId,
      nowMs: 4 * 60 * 1000, // 4min < 5min window
      stuckMs: 5 * 60 * 1000,
    })
    expect(result).toHaveLength(0)
  })
})
