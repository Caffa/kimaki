---
title: Kimaki v2
one_liner: A collaborative agent orchestrator that runs OpenCode inside Discord — this repo is the local 1.0 port, tracking upstream remorses/kimaki.
status: active
updated: 2026-11-25
discord_channel: https://discord.com/channels/1486966847810043924/1561336480721412188
---

## Where it stands

- Discord orchestrator for OpenCode: each project channel maps to a repo directory, each thread to a coding session; bot and CLI live under `kimaki/`.
- Local fork on branch kimaki-1.0-port; merged upstream/main through kimaki 1.7.1 (2026-11-21), and the fork now carries a port of upstream 1088155f (shipped upstream as kimaki 1.8.0): guild slash-command registration is diff-based — GET the guild's live command list (free), deletes → PATCH edits (unbudgeted) → POST creates (capped by Discord's daily 200/day create budget, stop at the first 30034, landed creates count as trickle progress). Discord is the source of truth; the persisted signature cache, bulk-overwrite PUT and degraded trickle from the Nov-22 fix are gone. Unchanged catalogs send zero writes; DELETE 404/10063 counts as success.
- When the create budget is saturated, registration backs off on an hourly ladder (1h doubling to 6h, never reset while blocked; sub-hour retry_after values ignored; a catalog change wakes it for one extra probe). The budget wedge itself looks like a Discord-side stuck counter (discord/discord-api-docs#6188): blocked >24h with zero creates while retry_after oscillated 30–430s.
- Local features kept: parakeet ASR (`asr-service/`), failed-voice background retry, coordinator off by default, `--default-agent`, `--notify-only`/`--echo-plain`, `KIMAKI_PROJECTS_DIR`.
- Adopted from upstream in the 1.7.1 merge: voice Retry button, `--sort-channels`, subtext-only status lines, opencode-fallback 0.3.0, `/mcp` slash command. OpenCode binary at 2.3.2; the running `serve --service` restarted after the 2.3.2 install, so it runs it.

## Log

### 2026-11-25 — Diff-based slash-command registration and budget backoff ladder

Reworked guild slash-command registration to diff against Discord's live command list instead of bulk-overwriting: GET is free, deletes and PATCH edits don't count against the daily create budget, and only POST creates do — they stop at the first 30034 so landed creates count as trickle progress (commits 40ea805f + 78a2e1c0, port of upstream 1088155f, shipped upstream as kimaki 1.8.0). This retired the Nov-22 signature-cache/bulk-PUT approach whose restarts with a changed catalog (the 1.7.1 merge) burned the 200/day create budget, and whose counter then stayed wedged for days — a block that Discord itself appears to have stuck (retry_after oscillated 30–430s over >24h with zero successful creates, matching discord/discord-api-docs#6188, commit 085c1d7a). Fully-blocked passes now re-probe on an hourly ladder (1h doubling to 6h, never reset while blocked, sub-hour retry_after ignored), unchanged catalogs send zero writes, and the changeset queue lives in root `.changeset/` with two new entries; discord-digital-twin gained guild-command GET/POST/PATCH/DELETE routes so the diff flow is e2e-tested.

Next: confirm the ladder clears the budget wedge and a real restart registers the full catalog with no 30034.

https://discord.com/channels/1486966847810043924/1574864290626801745

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
