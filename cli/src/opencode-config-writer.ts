// Atomic writer for the user's OpenCode config file.
// Only edits ~/.config/opencode/opencode.json on explicit user actions
// (/connect-ollama). The fallback plugin must never call this at runtime.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

function getConfigPath(): string {
  return path.join(os.homedir(), '.config', 'opencode', 'opencode.json')
}

function ensureConfigDir(): void {
  fs.mkdirSync(path.dirname(getConfigPath()), { recursive: true })
}

function readConfig(): unknown {
  const raw = fs.readFileSync(getConfigPath(), 'utf-8')
  return JSON.parse(raw)
}

function writeConfig(config: unknown): void {
  ensureConfigDir()
  const configPath = getConfigPath()
  const tmpPath = `${configPath}.tmp`
  fs.writeFileSync(tmpPath, `${JSON.stringify(config, null, 2)}\n`)
  fs.renameSync(tmpPath, configPath)
}

function getOllamaCloudProvider(config: unknown): Record<string, unknown> | undefined {
  if (
    typeof config === 'object'
    && config !== null
    && 'provider' in config
  ) {
    const providers = (config as { provider?: Record<string, unknown> }).provider
    if (
      typeof providers === 'object'
      && providers !== null
      && 'ollama-cloud' in providers
    ) {
      return providers['ollama-cloud'] as Record<string, unknown>
    }
  }
  return undefined
}

/**
 * Write the Ollama Cloud API key into the user's opencode.json.
 * Throws if the ollama-cloud provider block is missing (installer must create
 * it first with an empty apiKey).
 */
export function writeOllamaCloudKeyToOpencodeConfig(apiKey: string): void {
  if (!apiKey || apiKey.length < 1) {
    throw new Error('apiKey is required')
  }

  const config = readConfig()
  const provider = getOllamaCloudProvider(config)
  if (!provider) {
    throw new Error(
      'Run the Big Guide installer first — the ollama-cloud provider block is missing from your opencode config.',
    )
  }

  if (
    typeof provider !== 'object'
    || provider === null
    || !('options' in provider)
    || typeof provider.options !== 'object'
    || provider.options === null
  ) {
    throw new Error(
      'Your opencode config has an ollama-cloud provider block but it is missing an options object.',
    )
  }

  ;(provider.options as Record<string, unknown>).apiKey = apiKey
  writeConfig(config)
}

/**
 * Clear the Ollama Cloud API key from the user's opencode.json (sets it to
 * an empty string). Used by a future /disconnect-ollama command.
 */
export function clearOllamaCloudKeyFromOpencodeConfig(): void {
  const config = readConfig()
  const provider = getOllamaCloudProvider(config)
  if (!provider) {
    throw new Error(
      'Run the Big Guide installer first — the ollama-cloud provider block is missing from your opencode config.',
    )
  }

  if (
    typeof provider !== 'object'
    || provider === null
    || !('options' in provider)
    || typeof provider.options !== 'object'
    || provider.options === null
  ) {
    throw new Error(
      'Your opencode config has an ollama-cloud provider block but it is missing an options object.',
    )
  }

  ;(provider.options as Record<string, unknown>).apiKey = ''
  writeConfig(config)
}

export function getOpencodeConfigPath(): string {
  return getConfigPath()
}
