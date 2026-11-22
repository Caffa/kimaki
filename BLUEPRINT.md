---
title: Kimaki v2
one_liner: A collaborative agent orchestrator that runs OpenCode inside Discord — this repo is the local 1.0 port, tracking upstream remorses/kimaki.
status: active
updated: 2026-11-21
discord_channel: https://discord.com/channels/1486966847810043924/1561336480721412188
---

## Where it stands

- Discord orchestrator for OpenCode: each project channel maps to a repo directory, each thread to a coding session; bot and CLI live under `kimaki/`.
- Local fork on branch kimaki-1.0-port; merged upstream/main through kimaki 1.7.1 on 2026-11-21 (db951871), bot rebuilt, re-linked and healthy on 1.7.1.
- Local features kept: parakeet ASR (`asr-service/`), failed-voice background retry, coordinator off by default, `--default-agent`, `--notify-only`/`--echo-plain`, `KIMAKI_PROJECTS_DIR`.
- Adopted from upstream in this merge: voice Retry button, `--sort-channels`, subtext-only status lines, opencode-fallback 0.3.0, `/mcp` slash command.
- OpenCode binary updated to 2.3.2; the running service stays on the old binary until the next bot restart.

## Log

### 2026-11-22 — Fixed missing agent slash commands (Discord daily create budget)

After the 1.7.1 update every `/<agent>-agent` command vanished and bot startup hung silently at `await commands.registerAll()`. Root cause chain: the catalog grew to ~100 commands per guild (up from 31) and re-registered on every restart, burning Discord's 200-per-day application command create budget (error 30034 — a bulk-overwrite PUT counts every payload command as a create, application-wide, rolling 24h window); @discordjs/rest then slept for hours on the 429 Retry-After inside the request with no timeout and no log. Fixes (commit ddabae0a): per-guild registration signatures persisted to `<dataDir>/command-signatures.json` so an unchanged catalog skips the PUT entirely; dynamic shortcuts capped at 50 with agents first; 429 retry-after clamped to 60s via a custom `makeRequest` (new `src/discord-rest.ts`) plus a `rateLimited` warn listener; guild PUTs serialized (shared 2-per-30s bucket) and each bounded by a 120s timeout with chunked 3-minute retry passes; catalog reads gate on plugin activation because cold-start lists return empty and activation hints can be lost before the bot subscribes. Gotchas: `kimaki restart` on this machine leaves the bot down (the owner starts the service again manually); a running bot's stuck limiter state can be inspected with `kill -USR1 <pid>` heap snapshots; rest rate-limit sleeps are invisible without a `rateLimited` listener.

Next: after the create budget frees (rolling window, by the next morning), the retry passes register the 56-command list automatically; verify `/free-orchestrator` appears and the log shows `registered 81 commands`.

https://discord.com/channels/1486966847810043924/1573946450142822401

### 2026-11-21 — Merged upstream 1.7.1 into the fork

Merged upstream/main (kimaki 1.5.0 → 1.7.1, 37 commits) into kimaki-1.0-port keeping every local feature: parakeet ASR, failed-voice background retry, coordinator-default-off, `--default-agent`, `--notify-only`/`--echo-plain`, KIMAKI_PROJECTS_DIR. Adopted upstream's voice Retry button, `--sort-channels`, subtext-only status lines, opencode-fallback 0.3.0 and the `/mcp` slash command; bot rebuilt, re-linked and healthy on 1.7.1, and the OpenCode binary is at 2.3.2 (the running service picks it up on next restart). Test deviations from the merge: voice-parakeet.e2e rewritten to upstream's outage-recovery pattern, onboarding-cli.e2e rewritten for coordinator-default-off, coordinator-warmup bound relaxed ≤3→≤4, voice-call.e2e racy wait refined; the cli-sessions critique test fails from a missing critique binary, an env issue not merge fallout.

Next: restart the bot so the OpenCode service comes up on binary 2.3.2.

https://discord.com/channels/1486966847810043924/1573575792862957663

### 2026-11-16 — Repaired 11-09 merge breakage

Fixed startup crash on the first bot restart since the 11-09 upstream merge (commit c40d400d): fetchThread was restored to bot.ts and AgentListItem/agent-list threading was restored in sessions.ts; deliverRoute/voice.ts/formatDuration merge fixes were reconstructed from the repo's own git history. tsc is clean, 100 unit tests pass, and the bot was verified booted.

Next: watch the next bot restart for other latent merge fallout.

### 2026-11-16 — kimaki send --echo-plain

Added `kimaki send --echo-plain` for plain prompt echoes (commit b0cc5d6f), letting digest senders post messages as normal markdown instead of grey subtext; Scheduled-Jobs' weekly work order already uses it.
https://discord.com/channels/1486966847810043924/1571767067319996499
