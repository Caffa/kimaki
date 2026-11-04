---
'kimaki': patch
---

Fix `Agent <name> is not available in this project` errors for agents that are actually available, e.g. `norm-orchestrator` from `~/.config/opencode/agent/*.md` or a plugin.

OpenCode serves `agent.list` slightly before markdown/plugin agents register on a cold or evicted location, so the single catalog wait (integration.list) still raced the agent's activation. When a requested agent is missing from the first list, Kimaki now re-reads the catalog a few times (up to 4 retries, 200ms apart) before reporting the error, and `startSession` reuses the refreshed list for the session's system-prompt instructions.
