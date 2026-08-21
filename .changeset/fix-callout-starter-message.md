---
'kimaki': patch
---

Fix `<callout>` tags in `kimaki send --prompt` and scheduled-task prompts rendering as literal text instead of Discord Container components. The starter-message path (`sendDiscordMessageWithOptionalAttachment`) and the scheduled-task runner (`task-runner.ts`) now run prompt content through `splitTablesFromMarkdown` — the same preprocessing pipeline used by `sendThreadMessage` for agent replies. Text segments are sent as the main message (carrying the `ThreadStartMarker` embed); component segments (callouts, tables) are sent as follow-up Discord Components V2 messages into the thread after creation. Component-send failures are non-fatal and logged as warnings so a failed callout render never aborts the command or scheduled task.