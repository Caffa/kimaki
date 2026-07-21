---
'kimaki': patch
---

Fix rate limit errors from subagent/subtask sessions not appearing in Discord. Both `session.error` and `session.status` retry events from subtask sessions were silently dropped because the handlers only checked against the main session ID.