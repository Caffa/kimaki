# Kimaki Project Memory

## When to Reinstall

**Always rebuild and verify after:**
1. Completing a new feature
2. Merging upstream changes
3. Modifying TypeScript source files in `discord/src/`
4. Updating dependencies (`pnpm install`)

## Reinstalling Kimaki from Local Source

After making changes to the kimaki source code and needing to test them with the global `kimaki` command, follow these steps:

### Step 1: Remove global kimaki installations

```bash
# Remove npm global kimaki (if installed via npm)
npm uninstall -g kimaki

# Remove homebrew kimaki symlink (if installed via homebrew)
rm -f /opt/homebrew/lib/node_modules/kimaki
rm -f /opt/homebrew/bin/kimaki
```

### Step 2: Rebuild the TypeScript dist files

```bash
cd discord
npx tsc
```

### Step 3: Link the local package globally

```bash
pnpm link --global
```

This creates a symlink from `~/.local/share/pnpm/global` to your local `discord/` directory, and adds the `kimaki` binary to `~/.local/share/pnpm/bin` (or similar path depending on your pnpm config).

### Step 4: Verify the installation

```bash
# Check which kimaki is being used
which kimaki

# Should show something like:
# /Users/caffae/Library/pnpm/kimaki

# Or on Linux:
# ~/.local/share/pnpm/kimaki

# Run kimaki to verify the banner shows your changes
kimaki
```

### Notes

- The global `kimaki` command runs `bin.js` which imports `dist/cli.js`, NOT `src/cli.ts`
- You must rebuild with `npx tsc` after TypeScript changes
- For quick development iteration, use `pnpm dev` which runs `tsx src/cli.ts` directly (no build needed)
- If you see `/opt/homebrew/bin/kimaki`, you still have a homebrew installation overriding your local link

## Quick Rebuild Command

Run this after completing features or merging upstream:

```bash
# One-liner to rebuild and verify
npm uninstall -g kimaki 2>/dev/null; pnpm install && cd discord && npx tsc && cd .. && which kimaki && echo "✅ Rebuild complete - test with: kimaki"
```

## Common Issues

### "I don't see my changes when running kimaki"

This means you're running an old compiled version. Run the quick rebuild command above.

### "Module not found errors after merge"

Upstream may have added new dependencies. Fix with:
```bash
pnpm install
cd discord && npx tsc
```

### "npm global kimaki keeps overriding my dev version"

npm's `/opt/homebrew/bin` comes before pnpm's `~/Library/pnpm` in PATH. Uninstall the npm version:
```bash
npm uninstall -g kimaki
```

## Vision Description for Screenshots

Kimaki can now describe images using Ollama models (cloud-first with local fallback), helping debugging when the primary model says it can't see images.

- **Cloud-first**: Tries cloud vision models first if authenticated (`gemma3:27b-cloud`, `gemma3:12b-cloud`, `gemma3:4b-cloud`)
- **Local fallback**: Falls back to local vision models (`qwen3-vl`, `llava`, `llama3.2-vision`, `gemma3`)
- **Auto model selection**: Uses `qwen3.5:4b` as final fallback
- **Graceful fallback**: If all endpoints fail, images are still sent but without descriptions
- **Debugging-focused prompt**: Describes exact text, error messages, code, UI states

To use:
1. **Cloud (preferred)**: Run `ollama signin` once, then cloud models will be used automatically
2. **Local**: Install a vision model: `ollama pull qwen3-vl` or `ollama pull gemma3:4b`
3. Upload screenshots in Discord as usual
4. Vision descriptions appear inline in the prompt context

Configuration:
- **Override model**: `export KIMAKI_VISION_MODEL=gemma3:27b-cloud` or any specific model
- **Disable vision**: `export KIMAKI_VISION_MODEL=""`
- **Custom Ollama host**: `export OLLAMA_HOST=http://custom-host:11434`

Priority order:
1. Cloud vision models (if authenticated)
2. Local vision models (if installed)
3. Local text-only fallback models