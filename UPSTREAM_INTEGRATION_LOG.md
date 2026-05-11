# Upstream Integration Log

> **Purpose**: This file tracks the state of upstream integrations for the Caffa/kimaki fork.
> Future agents should read this file first to understand what's been merged and what
> local customizations exist before attempting another upstream merge.

---

## Current State

| Field | Value |
|---|---|
| **Last successful integration** | `upstream/main` @ `7ec89a1` (kimaki@0.9.1) |
| **Upstream HEAD at last integration** | `7ec89a1` |
| **Integration branch** | `integrate-upstream-v2` (based on `upstream/main`) |
| **Integration strategy** | Rebase-onto: start from `upstream/main`, re-apply local customizations |
| **Previous merge base (pre-integration)** | `8b02835` (from `main` branch, kimaki@0.7.1 era) |
| **Backup tags** | `backup/pre-integration-2025-05-11-main`, `backup/pre-integration-2025-05-11-integrate-branch` |

---

## Local Customizations (MUST PRESERVE)

These are changes that exist only in our fork and must be re-applied after each upstream merge.

### 1. ASR Service (Parakeet MLX local transcription)

**New files** (no upstream equivalent — pure additions):

| File | Lines | Purpose |
|---|---|---|
| `asr-service/asr_server.py` | 205 | Python HTTP server wrapping parakeet-mlx |
| `asr-service/requirements.txt` | 3 | Python deps (`parakeet-mlx`, etc.) |
| `asr-service/README.md` | 156 | Setup instructions for Parakeet |
| `asr-service/.gitignore` | 2 | Excludes `__pycache__/` |
| `cli/src/asr-service-manager.ts` | 174 | TS lifecycle manager: start/stop/health-check Parakeet. Uses `fileURLToPath(import.meta.url)` for ESM-compatible path resolution. |
| `cli/src/vllm-service-manager.ts` | 205 | TS lifecycle manager: start/stop/health-check vLLM Whisper |

### 2. Voice transcription provider extensions (`cli/src/voice.ts`)

**Type extension**: `TranscriptionProvider = 'openai' | 'gemini' | 'parakeet' | 'vllm'`

**New constants**:
- `ASR_SERVICE_URL = process.env.ASR_SERVICE_URL || 'http://127.0.0.1:8765'`
- `DEFAULT_ASR_PROVIDER` — defaults to `parakeet` on Apple Silicon, `undefined` otherwise

**New imports**:
- `import { getVLLMBaseUrl, checkVLLMServiceRunning } from './vllm-service-manager.js'`
- `import { startAsrService, shouldAutoStartAsr } from './asr-service-manager.js'

**New functions** (append after `createTranscriptionModel`):
- `transcribeWithParakeet()` — POST audio to local ASR server
- `transcribeWithVLLM()` — POST audio to local vLLM Whisper server

**Modified `transcribeAudio()`**: Provider resolution has parakeet/vLLM paths that short-circuit before cloud API keys are needed. On `darwin/arm64` defaults to parakeet. Auto-restarts Parakeet on connection failure.

**OpenAI transcription fix**: `createOpenAI({ apiKey, baseURL: 'https://api.openai.com/v1' })` — explicitly sets baseURL to avoid inheriting `OPENAI_BASE_URL` env var pointing at a local LLM.

**Agent selection prompt**: Kept upstream's stricter wording from commit `7e08c2a` (prevents false agent matches for words like "plan").

### 3. Voice handler changes (`cli/src/voice-handler.ts`)

**New import**: `getDb` from `'./db.js'` (Drizzle — migrated from `getPrisma`/Prisma)

**New imports**: `startAsrService`, `stopAsrService`, `shouldAutoStartAsr` from `./asr-service-manager.js'

**New block in `setupVoiceHandling()`** (~55 lines after logging "no associated directory"): Sends a notification to a fallback text channel when a voice channel isn't linked to a project. Uses `getDb()` + Drizzle `db.query.channel_directories.findMany()`.

**Modified `processVoiceAttachment()`**: Parakeet-default provider resolution. On `darwin/arm64`, skips API key requirement when `ASR_PROVIDER` isn't explicitly set to cloud providers. Falls back to requiring an API key only for non-Apple Silicon.

### 4. Bot lifecycle hooks (`cli/src/discord-bot.ts`)

**New imports**: `startAsrService`, `stopAsrService`, `shouldAutoStartAsr` from `./asr-service-manager.js'; `startVLLMService`, `stopVLLMService`, `shouldAutoStartVLLM` from `./vllm-service-manager.js'

**New code in `startDiscordBot()`**: After `startTaskRunner` and `startRuntimeIdleSweeper` — auto-starts Parakeet and vLLM services if conditions met.

**Shutdown hook**: Calls `stopAsrService()` and `stopVLLMService()` after voice connection cleanup and before closing database.

### 5. Auto-upgrade guard (`cli/src/upgrade.ts`)

Local dev fork disables background auto-upgrade when running via `npm link`. Detects `npm link` by checking if `.git` exists nearby in the package hierarchy. Two new exports: `isNpmLinked()` and modified `backgroundUpgradeKimaki()` that checks `isNpmLinked()` first.

### 6. Channel management (`cli/src/channel-management.ts`)

**New exports**: `createDefaultKimakiVoiceChannel`, `linkVoiceChannelToDirectory`

### 7. Link voice channel command (`cli/src/commands/link-voice-channel.ts`)

**New file** (24 lines, stub): Slash command to link a voice channel to a project directory.

### 8. Discord command registration (`cli/src/discord-command-registration.ts`)

**Addition**: Registers the `link-voice-channel` command after `transcription-key`.

### 9. CLI startup changes (`cli/src/cli.ts`)

The `--enable-voice-channels` flag already exists in upstream's `cli.ts`.

The figlet "LOCAL VOICE" startup banner from our old branch was **not** re-applied — it was purely cosmetic and required adding `figlet` as a dependency. Can be re-added in a future commit if desired.

### 10. Config changes (`cli/src/config.ts`)

No changes needed for this integration. Parakeet default logic is in `voice.ts` (checked via `process.env.ASR_PROVIDER` and `process.platform`).

### 11. Personal files (non-code)

| File | Purpose |
|---|---|
| `MEMORY.md` | Reinstall/build instructions |
| `AGENTS.md` | Project docs (personal) |
| `KIMAKI_AGENTS.md` | Project docs (personal) |
| `INSTRUCTION_HISTORY.md` | Pi agent instruction log |
| `INSTALLATION_COMPLETE.md` | Installation notes |
| `PARAKEET_SETUP_COMPLETE.md` | Parakeet setup status |
| `README_PARAKEET_SETUP.md` | Parakeet setup guide |
| `VOICE_TRANSCRIPTION_FIX.md` | Transcription debug notes |

---

## Breaking Upstream Changes Handled

### ✅ Prisma → Drizzle Migration

Upstream commit `5f0f0b3` migrated from Prisma to Drizzle ORM. Our `voice-handler.ts` was the only custom file affected — replaced `getPrisma()` with `getDb()` + Drizzle query syntax.

### ✅ Type Annotation Cleanup

Upstream removed explicit `as Error` casts. Our `voice.ts` additions avoid those casts (using upstream's implicit style).

### ✅ Agent Selection Prompt Tightening

Kept upstream's stricter prompt wording (commit `7e08c2a`).

### ✅ Submodule Updates

All 4 submodules accepted from upstream:
- `errore` → `4f67bc0`
- `gateway-proxy` → `c336879`
- `opencode-injection-guard` → `31ef730`
- `traforo` → `59aba5b`

---

## Integration History

### Integration 1: kimaki@0.7.1 (commit `aa8e091`, 2025-04-09)

- **Merged up to**: `a19c8f6` (kimaki@0.7.1)
- **Merge commit**: `aa8e091`
- **Follow-up fix**: `5640a2a` (resolve merge artifacts, add link-voice-channel stub)
- **Follow-up fix**: `c317335` (disable auto-upgrade for npm link)
- **Follow-up fix**: `ac02a1c` (ASR path resolution fix, auto-restart on failure)
- **Status**: ✅ Complete and working

### Integration 2: kimaki@0.9.1 (branch `integrate-upstream-v2`, 2025-05-11)

- **Merged up to**: `7ec89a1` (kimaki@0.9.1)
- **Strategy**: Rebase-onto (clean `upstream/main` + re-applied local customizations)
- **Prisma → Drizzle migration**: Completed for `voice-handler.ts`
- **Customizations re-applied**: All 10 areas documented above
- **Status**: ✅ Complete — build passes, unit tests green, all customizations verified

---

## Recommended Integration Procedure

> **For future agents**: Follow these steps when integrating upstream changes.

### Step 0: Pre-work
```bash
# Create backup tags
git tag "backup/pre-integration-$(date +%Y-%m-%d)-main" main
git tag "backup/pre-integration-$(date +%Y-%m-%d)-integrate-branch" integrate-upstream-features 2>/dev/null || true
git push origin --tags

# Update upstream
git fetch upstream

# Note the current merge base
MERGE_BASE=$(git merge-base main upstream/main)
echo "Last merge base: $MERGE_BASE"
echo "Upstream head: $(git rev-parse upstream/main)"
echo "Commits behind: $(git rev-list --count $MERGE_BASE..upstream/main)"
```

### Step 1: Create clean integration branch from upstream/main
```bash
git stash  # Save any WIP
git checkout -b integrate-upstream-v3 upstream/main
```

**⚠️ Important**: Start from `upstream/main`, NOT from `main`. This avoids massive merge conflicts. Layer our customizations on top of a clean upstream base.

### Step 2: Align submodule pointers
```bash
git checkout upstream/main -- errore gateway-proxy opencode-injection-guard traforo
git commit -m "chore: align submodule pointers with upstream/main"
```

### Step 2: Re-apply local customizations (in order)

Use the **Local Customizations** section above as a checklist.

1. **Pure additions** (no conflict risk):
   - `asr-service/` directory (copy as-is)
   - `cli/src/asr-service-manager.ts` (copy as-is)
   - `cli/src/vllm-service-manager.ts` (copy as-is)
   - `cli/src/commands/link-voice-channel.ts` (copy as-is)
   - Personal docs: `MEMORY.md`, `AGENTS.md`, etc.

2. **Surgical edits to upstream files** (apply changes to upstream's versions, NOT merge our versions):
   - `cli/src/voice.ts` — add parakeet/vLLM providers, ASR constants, imports, functions, provider resolution
   - `cli/src/voice-handler.ts` — add fallback notification, parakeet-default resolution, `getDb` import
   - `cli/src/discord-bot.ts` — add ASR lifecycle hooks (startup + shutdown)
   - `cli/src/upgrade.ts` — add npm-link detection + `isNpmLinked()` + guard in `backgroundUpgradeKimaki()`
   - `cli/src/channel-management.ts` — add voice channel functions
   - `cli/src/discord-command-registration.ts` — register `link-voice-channel` command

3. **Adapt to upstream breaking changes** (check each integration):
   - Check if `getDb()` API changed (read upstream's `db.ts`)
   - Check if `database.ts` exports changed (functions we import)
   - Check if `TranscriptionProvider` type changed
   - Check if `processVoiceAttachment` signature changed
   - Accept upstream's versions for all submodules
   - Remove any redundant type casts that upstream cleaned up

4. **Regenerate lockfile**:
   ```bash
   pnpm install
   ```

5. **Build & test**:
   ```bash
   pnpm build
   pnpm test
   ```

6. **Smoke-test checklist**:
   - [ ] `pnpm build` succeeds with zero errors
   - [ ] `pnpm test` passes (some e2e tests may need Discord bot)
   - [ ] Parakeet ASR service starts on `darwin/arm64`
   - [ ] Cloud transcription (OpenAI/Gemini) still works when explicitly selected
   - [ ] No `getPrisma` or Prisma imports remain in our custom files

### Step 3: Document the integration
1. Update this file's "Current State" table
2. Update "Integration History" with the new entry
3. Commit with message: `merge: upstream kimaki@X.Y.Z with local ASR customizations preserved`

### Step 4: Merge back to main
```bash
git checkout main
git merge integrate-upstream-v3
git push origin main
```