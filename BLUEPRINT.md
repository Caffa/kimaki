---
title: Kimaki v2
one_liner: A collaborative agent orchestrator that runs OpenCode inside Discord — this repo is the local 1.0 port, tracking upstream remorses/kimaki.
status: active
updated: 2026-11-16
discord_channel: https://discord.com/channels/1486966847810043924/1561336480721412188
---

## Where it stands

- Discord orchestrator for OpenCode: each project channel maps to a repo directory, each thread to a coding session; bot and CLI live under `kimaki/`.
- Local fork on branch kimaki-1.0-port; merged upstream/main on 2026-11-09, and the startup crash that merge introduced on restart is now fixed (c40d400d).
- `kimaki send --echo-plain` added for plain prompt echoes, so digests post as normal markdown (b0cc5d6f).
- Coordinator mode is off by default (4dcefa4d).
- Verified today: tsc clean, 100 unit tests green, bot boots.

## Log

### 2026-11-16 — Repaired 11-09 merge breakage

Fixed startup crash on the first bot restart since the 11-09 upstream merge (commit c40d400d): fetchThread was restored to bot.ts and AgentListItem/agent-list threading was restored in sessions.ts; deliverRoute/voice.ts/formatDuration merge fixes were reconstructed from the repo's own git history. tsc is clean, 100 unit tests pass, and the bot was verified booted.

Next: watch the next bot restart for other latent merge fallout.

### 2026-11-16 — kimaki send --echo-plain

Added `kimaki send --echo-plain` for plain prompt echoes (commit b0cc5d6f), letting digest senders post messages as normal markdown instead of grey subtext; Scheduled-Jobs' weekly work order already uses it.
https://discord.com/channels/1486966847810043924/1571767067319996499
