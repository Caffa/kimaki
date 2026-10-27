---
'kimaki': patch
---

Fix a ~700 ms first-response latency stall when starting a session on a cold or evicted OpenCode location.

`startSession` already waits for plugin activation via `waitForPlugin`, which drains the activation queue with `integration.list`. The previous code then called `catalogReady` (another `integration.list`) twice more: once inside `agentSelection` and once inside `putInstructions`. On cold locations that extra round-trip blocked the hot path for the same ~700 ms window. Kimaki now reads the agent list once after `waitForPlugin` and reuses it for both agent selection and the system-prompt instructions entry.

Catalog correctness is preserved: callers without a prior `waitForPlugin` (slash-command catalog, preference commands, voice transcription) still call `catalogReady` before reading the agent list, so markdown and plugin agents are never missed.
