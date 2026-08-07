---
'kimaki': patch
---

Add a project-directory filter to the global event listener so runtimes skip
events from other opencode projects entirely (before buffering or processing).
In a single-project deployment this is a no-op; in multi-project setups it
prevents each runtime from wasting memory and CPU on irrelevant events.

Also buffer early child-session events that arrive before the orchestrator's
`task` tool part establishes the subtask association. Previously these events
were silently dropped by the session demux guard, which could cause the first
few subtask outputs (initial assistant messages, early tool calls) to be
missing from Discord. The orphan replay dispatches them through handleEvent
once the task part is processed, ensuring no subtask output is lost.