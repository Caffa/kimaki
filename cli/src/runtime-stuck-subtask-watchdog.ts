// Stuck-subtask watchdog.
//
// Periodically inspects every active runtime for `task` tool parts that are
// still `running` while their child subagent session has produced no events to
// the runtime's in-memory buffer for a configurable silence window
// (KIMAKI_STUCK_SUBTASK_TIMEOUT_MS, default 5 min). When detected, the runtime
// posts a single Discord warning per stuck subtask and, when
// KIMAKI_STUCK_SUBTASK_ABORT=1 is set, aborts the child session to unstick the
// orchestrator.
//
// This addresses the "Kimaki suddenly stops, type continue" symptom: the
// subagent hangs on the opencode/LLM side and emits nothing, so the bot has
// nothing to render and looks frozen until the user sends a message (which the
// interrupt plugin turns into an abort + replay).

import { createLogger, LogPrefix } from './logger.js'
import {
  forEachRuntime,
  getStuckSubtaskTimeoutMs,
} from './session-handler/thread-session-runtime.js'

const logger = createLogger(LogPrefix.SESSION)

// Re-check every 60s. The default silence window is 5 min, so the first warning
// lands within ~1min of the subagent going silent long enough. Tuned to avoid
// REST spam while staying responsive.
export const DEFAULT_STUCK_SUBTASK_INTERVAL_MS = 60 * 1000

export function startStuckSubtaskWatchdog({
  sweepIntervalMs = DEFAULT_STUCK_SUBTASK_INTERVAL_MS,
}: {
  sweepIntervalMs?: number
} = {}): () => Promise<void> {
  let stopped = false
  let sweeping = false
  let sweepPromise: Promise<void> | null = null

  // Iterating runtimes requires the module-internal map in thread-session-runtime.
  // We import lazily to avoid a circular import at module load time (the
  // runtime module imports many things; this file is imported by discord-bot
  // which also imports the runtime module — dynamic import breaks the cycle).
  const sweep = async (): Promise<void> => {
    if (stopped || sweeping) {
      return
    }
    sweeping = true
    const stuckMs = getStuckSubtaskTimeoutMs()

    const currentSweepPromise = (async () => {
      if (stuckMs <= 0) {
        return
      }
      const nowMs = Date.now()
      await forEachRuntime(async (runtime) => {
        try {
          if (runtime.isDisposed) return
          await runtime.checkStuckSubtasks({ nowMs, stuckMs })
        } catch (error) {
          logger.error(
            `[STUCK SUBTASK SWEEP] Error checking runtime ${runtime.threadId}:`,
            error,
          )
        }
      })
    })()

    sweepPromise = currentSweepPromise
    await currentSweepPromise.finally(() => {
      sweeping = false
      sweepPromise = null
    })
  }

  const interval = setInterval(() => {
    void sweep().catch((error) => {
      logger.error('[STUCK SUBTASK SWEEP] Unexpected sweep error:', error)
    })
  }, sweepIntervalMs)

  void sweep().catch((error) => {
    logger.error('[STUCK SUBTASK SWEEP] Initial sweep error:', error)
  })

  logger.log(
    `[STUCK SUBTASK SWEEP] Started (stuckMs=${getStuckSubtaskTimeoutMs()}, intervalMs=${sweepIntervalMs})`,
  )

  return async () => {
    if (stopped) {
      return
    }
    stopped = true
    clearInterval(interval)
    if (sweepPromise) {
      await sweepPromise
      sweepPromise = null
    }
    logger.log('[STUCK SUBTASK SWEEP] Stopped')
  }
}