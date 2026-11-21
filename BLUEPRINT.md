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
