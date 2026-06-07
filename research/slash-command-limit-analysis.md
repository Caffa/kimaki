# Kimaki Discord Bot Command Limit Analysis

## Executive Summary

The kimaki Discord bot has **111 total commands** but Discord only allows **100 guild slash commands**. The commands are registered in priority order, with the lowest priority items being truncated first.

## Command Source Breakdown

### 1. Built-in Static Commands (40 commands)

These are hardcoded in `cli/src/discord-command-registration.ts`:

1. `/resume` - Resume an existing OpenCode session
2. `/new-session` - Start a new OpenCode session
3. `/new-worktree` - Create a git worktree from the current HEAD
4. `/merge-worktree` - Squash-merge worktree into default branch
5. `/toggle-worktrees` - Toggle automatic git worktree creation
6. `/worktrees` - List all active worktree sessions
7. `/last-sessions` - List the 20 most recently active sessions
8. `/tasks` - List scheduled tasks
9. `/add-project` - Create Discord channels for a project
10. `/remove-project` - Remove Discord channels for a project
11. `/create-new-project` - Create a new project folder
12. `/add-dir` - Allow the current session to access an extra directory
13. `/abort` - Abort the current OpenCode request
14. `/compact` - Compact the session context
15. `/share` - Share the current session as a public URL
16. `/diff` - Show git diff as a shareable URL
17. `/fork` - Fork the session from a past user message
18. `/fork-subagent` - Fork a subagent task session
19. `/btw` - Ask something without polluting or blocking
20. `/model` - Set the preferred model
21. `/model-variant` - Change thinking level for current model
22. `/unset-model-override` - Remove model override
23. `/login` - Authenticate with an AI provider
24. `/agent` - Set the preferred agent
25. `/queue` - Queue a message
26. `/clear-queue` - Clear all queued messages
27. `/queue-command` - Queue a user command
28. `/undo` - Undo the last assistant message
29. `/redo` - Redo previously undone changes
30. `/verbosity` - Set output verbosity
31. `/restart-opencode-server` - Restart opencode server
32. `/run-shell-command` - Run a shell command
33. `/context-usage` - Show token usage
34. `/session-id` - Show current session ID
35. `/upgrade-and-restart` - Upgrade kimaki and restart
36. `/transcription-key` - Set API key for transcription
37. `/link-voice-channel` - Link a voice channel
38. `/mcp` - List and manage MCP servers
39. `/screenshare` - Start screen sharing
40. `/screenshare-stop` - Stop screen sharing
41. `/vscode` - Open VS Code in browser

### 2. Dynamic Agent Quick Commands (Variable)

Commands generated from primary agents (filtered to `mode === 'primary' || mode === 'all'`):
- Format: `{sanitized-agent-name}-agent`
- Example: `/plan-agent`, `/build-agent`

These are pulled from OpenCode via `.app.agents({ directory })` API.

### 3. User Commands from OpenCode Config (Variable)

Commands with `source === 'config'` (highest priority dynamic):
- These come from `opencode.json` or opencode project configurations
- Get `-cmd` suffix in Discord
- Examples: custom user-defined commands

### 4. Skills Commands (Variable)

Commands with `source === 'skill'` (medium priority):
- Located in `~/.config/opencode/skills/` and `cli/skills/`
- Get `-skill` suffix in Discord
- **User's skills (11 skills)**:
  - agents-sdk
  - cloudflare
  - cloudflare-email-service
  - durable-objects
  - js-guide-writing
  - readwise
  - sandbox-sdk
  - turnstile-spin
  - web-perf
  - workers-best-practices
  - wrangler

- **Built-in kimaki skills (15 skills)**:
  - batch
  - critique
  - egaki
  - goke
  - new-skill
  - npm-package
  - opensrc
  - playwriter
  - profano
  - proxyman
  - security-review
  - sigillo
  - simplify
  - spiceflow
  - tuistory
  - zele

### 5. MCP Prompt Commands (Variable)

Commands with `source === 'mcp'` (lowest priority):
- Get `-mcp-prompt` suffix in Discord
- From user's `~/.config/opencode/opencode.json` MCP configuration
- User has **2 MCP servers** configured:
  - `context7` - Context7 remote MCP
  - `scrapling` - Scrapling local MCP

These MCP servers may expose prompts that get registered as commands.

### 6. Recent Model Quick Commands (Variable)

Commands generated from user's recent models:
- Format: `{sanitized-model-name}-model`
- Example: `/claude-opus-4-model`, `/gpt-4-model`
- Limited to available models based on usage

## Command Registration Priority

The registration order (lowest priority gets truncated first):

```typescript
const sourceOrder: Record<string, number> = { 
  config: 0,  // User commands - HIGHEST priority
  skill: 1,   // Skills - MEDIUM priority  
  mcp: 2      // MCP prompts - LOWEST priority (first to be trimmed)
}
```

## Recommendations to Stay Under 100 Commands

### Option 1: Trim MCP Prompts (Easiest)

The user has 2 MCP servers that may be contributing commands:
- **Context7** - May expose prompt templates
- **Scrapling** - May expose prompt templates

Consider:
- Disabling MCP prompt registration entirely if not used via Discord
- Or whitelisting only essential MCP prompts

### Option 2: Limit Built-in Skills

Currently **26 total skills** (11 user + 15 built-in). Consider:
- Using `--enable-skill` flag to whitelist only needed skills
- Or using `--disable-skill` to blacklist unused skills

Example:
```bash
kimaki --enable-skill cloudflare --enable-skill wrangler
```

### Option 3: Reduce Agent Quick Commands

Agent commands could be filtered further:
- Currently includes all `primary` and `all` mode agents
- Could limit to only most-used agents
- Users can still access agents via `/agent` command

### Option 4: Reduce Model Quick Commands

Recent model commands could be:
- Limited to top N most recent
- Or removed entirely (users can use `/model` command)

## Current Truncation Behavior

When commands exceed 100:
1. Static commands (40) are always registered
2. Agent quick commands are added
3. User commands (`config` source) are added
4. Skills commands (`skill` source) are added
5. MCP prompts (`mcp` source) are added (but truncated first if needed)
6. Recent model commands are added (truncated after MCP prompts)

The truncation happens at line 672-677 of `discord-command-registration.ts`:
```typescript
if (commands.length > MAX_DISCORD_COMMANDS) {
  cliLogger.warn(
    `COMMANDS: ${commands.length} commands exceed Discord limit...`,
  )
  commands.length = MAX_DISCORD_COMMANDS
}
```

## Files Involved

- **Registration logic**: `cli/src/discord-command-registration.ts`
- **Command detection**: `cli/src/opencode-command-detection.ts`
- **User command handling**: `cli/src/commands/user-command.ts`
- **OpenCode config**: `~/.config/opencode/opencode.json`
- **User skills**: `~/.config/opencode/skills/`
- **Built-in skills**: `cli/skills/`

## Source References

- Opencode Command type: `@opencode-ai/sdk/v2` - `Command` interface with `source` field
- Command priority sorting: Lines 583-586 in `discord-command-registration.ts`
- MCP config in user's opencode.json: Lines 12-25
- Skills directory: `~/.config/opencode/skills/` (11 skills) + `cli/skills/` (15 skills)
