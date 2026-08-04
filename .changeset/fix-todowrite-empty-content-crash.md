---
'kimaki': patch
---

Fix a crash where the `todowrite` tool's todo-list rendering threw `Cannot read properties of undefined (reading 'charAt')` when an `in_progress` todo had no `content` field (e.g. from the orchestrator). The existing `Array.isArray` todos guard did not cover this; such todos are now skipped instead of crashing Discord message rendering. Also wrap the four fire-and-forget `void this.dispatchAction(...)` sites (event listener, post-abort / interactive-ui / post-dispatch queue drains) with `.catch()` so any throw inside event handling or part formatting is logged once instead of leaking as an unhandled `OpenCodeSdkError: dispatchAction` rejection that floods the bot log with stack traces.