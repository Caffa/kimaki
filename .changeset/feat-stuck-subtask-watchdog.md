---
'kimaki': minor
---

Add a stuck-subtask watchdog that detects when an orchestrator's `task` tool call has been `running` for minutes while its child subagent session emits no events to the bot — the "Kimaki suddenly stops, type continue" symptom where the subagent hangs on the opencode/LLM side and the bot has nothing to render. When the silence window elapses, the bot posts a single Discord warning naming the stuck subagent and how long it has been silent. Set `KIMAKI_STUCK_SUBTASK_ABORT=1` to additionally abort the child session so the orchestrator resumes on its own. The silence window defaults to 5 minutes and is configurable via `KIMAKI_STUCK_SUBTASK_TIMEOUT_MS` (set to 0 to disable).