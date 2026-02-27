// Session handler run-state store and transitions.
// Centralizes prompt/idle race state so interrupt handling stays consistent.

import { createStore, type StoreApi } from 'zustand/vanilla'

export type MainRunPhase =
  | 'waiting-dispatch'
  | 'collecting-baseline'
  | 'dispatching'
  | 'prompt-resolved'
  | 'finished'
  | 'aborted'

export type MainIdleState = 'none' | 'deferred'

export type MainRunState = {
  phase: MainRunPhase
  idleState: MainIdleState
  baselineAssistantIds: Set<string>
  currentAssistantMessageId: string | undefined
  eventSeq: number
  evidenceSeq: number | undefined
  deferredIdleSeq: number | undefined
}

export type MainRunStore = StoreApi<MainRunState>

export type MainSessionIdleDecision =
  | 'deferred'
  | 'ignore-no-evidence'
  | 'process'

export type DeferredIdleDecision =
  | 'none'
  | 'ignore-no-evidence'
  | 'ignore-before-evidence'
  | 'process'

function initialMainRunState(): MainRunState {
  return {
    phase: 'waiting-dispatch',
    idleState: 'none',
    baselineAssistantIds: new Set<string>(),
    currentAssistantMessageId: undefined,
    eventSeq: 0,
    evidenceSeq: undefined,
    deferredIdleSeq: undefined,
  }
}

export function createMainRunStore(): MainRunStore {
  return createStore<MainRunState>(() => {
    return initialMainRunState()
  })
}

export function beginPromptCycle({ store }: { store: MainRunStore }): void {
  store.setState((state) => {
    return {
      ...state,
      phase: 'collecting-baseline',
      idleState: 'none',
      baselineAssistantIds: new Set<string>(),
      currentAssistantMessageId: undefined,
      eventSeq: 0,
      evidenceSeq: undefined,
      deferredIdleSeq: undefined,
    }
  })
}

export function setBaselineAssistantIds({
  store,
  messageIds,
}: {
  store: MainRunStore
  messageIds: Set<string>
}): void {
  store.setState((state) => {
    return {
      ...state,
      baselineAssistantIds: new Set<string>(messageIds),
    }
  })
}

export function markDispatching({ store }: { store: MainRunStore }): void {
  store.setState((state) => {
    return {
      ...state,
      phase: 'dispatching',
    }
  })
}

export function markCurrentPromptEvidence({
  store,
  messageId,
}: {
  store: MainRunStore
  messageId: string
}): void {
  store.setState((state) => {
    const eventSeq = state.eventSeq + 1
    const canTrackCurrentPrompt =
      state.phase === 'dispatching' || state.phase === 'prompt-resolved'
    if (!canTrackCurrentPrompt) {
      return {
        ...state,
        eventSeq,
      }
    }
    if (state.baselineAssistantIds.has(messageId)) {
      return {
        ...state,
        eventSeq,
      }
    }
    return {
      ...state,
      eventSeq,
      currentAssistantMessageId: messageId,
      evidenceSeq: state.evidenceSeq ?? eventSeq,
    }
  })
}

export function handleMainSessionIdle({
  store,
}: {
  store: MainRunStore
}): MainSessionIdleDecision {
  const state = store.getState()
  const idleSeq = state.eventSeq + 1

  if (state.phase !== 'prompt-resolved') {
    store.setState((current) => {
      return {
        ...current,
        eventSeq: idleSeq,
        idleState: 'deferred',
        deferredIdleSeq: idleSeq,
      }
    })
    return 'deferred'
  }

  if (!state.currentAssistantMessageId) {
    store.setState((current) => {
      return {
        ...current,
        eventSeq: idleSeq,
      }
    })
    return 'ignore-no-evidence'
  }

  store.setState((current) => {
    return {
      ...current,
      eventSeq: idleSeq,
    }
  })
  return 'process'
}

export function markPromptResolvedAndConsumeDeferredIdle({
  store,
}: {
  store: MainRunStore
}): DeferredIdleDecision {
  const state = store.getState()

  const nextState: MainRunState = {
    ...state,
    phase: 'prompt-resolved',
  }

  if (state.idleState !== 'deferred') {
    store.setState(nextState)
    return 'none'
  }

  nextState.idleState = 'none'
  nextState.deferredIdleSeq = undefined

  if (!state.currentAssistantMessageId) {
    store.setState(nextState)
    return 'ignore-no-evidence'
  }

  if (
    typeof state.deferredIdleSeq === 'number' &&
    typeof state.evidenceSeq === 'number' &&
    state.deferredIdleSeq <= state.evidenceSeq
  ) {
    store.setState(nextState)
    return 'ignore-before-evidence'
  }

  store.setState(nextState)
  return 'process'
}

export function markFinished({ store }: { store: MainRunStore }): void {
  store.setState((state) => {
    return {
      ...state,
      phase: 'finished',
    }
  })
}

export function markAborted({ store }: { store: MainRunStore }): void {
  store.setState((state) => {
    if (state.phase === 'finished') {
      return state
    }
    return {
      ...state,
      phase: 'aborted',
    }
  })
}

export function hasCurrentPromptEvidence({
  store,
}: {
  store: MainRunStore
}): boolean {
  return Boolean(store.getState().currentAssistantMessageId)
}
