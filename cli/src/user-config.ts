// User configuration persistence.
// Stores user preferences in ~/.kimaki/config.json.
// This is separate from the runtime store (store.ts) which holds transient state.
//
// CLI flags always take precedence over config file values.
// The config file provides defaults so users don't need to pass flags every time.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { getDataDir } from './config.js'

export type UserConfig = {
  /** Default projects directory for /create-new-project command */
  projectsDir?: string
  /** Default Discord guild ID for project add/create commands */
  defaultGuildId?: string
  /**
   * Default agent for sessions when no session or channel preference is set.
   * Written to opencode-config.json as default_agent so OpenCode uses it.
   * Example: "norm-orchestrator"
   */
  defaultAgent?: string
}

const CONFIG_FILE_NAME = 'config.json'

/**
 * Get the path to the user config file.
 * Always inside the data directory (~/.kimaki/config.json).
 */
export function getConfigPath(): string {
  return path.join(getDataDir(), CONFIG_FILE_NAME)
}

/**
 * Load user config from disk.
 * Returns empty object if file doesn't exist or is invalid JSON.
 */
export function loadUserConfig(): UserConfig {
  const configPath = getConfigPath()
  try {
    if (!fs.existsSync(configPath)) {
      return {}
    }
    const content = fs.readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(content)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as UserConfig
    }
    return {}
  } catch (error) {
    // Log warning but don't crash - return empty config
    console.warn(
      `[kimaki] Warning: Failed to load config from ${configPath}:`,
      error instanceof Error ? error.message : String(error),
    )
    return {}
  }
}

/**
 * Save user config to disk.
 * Creates the data directory if it doesn't exist.
 */
export function saveUserConfig(config: UserConfig): void {
  const dataDir = getDataDir()
  const configPath = getConfigPath()

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  // Write config with pretty formatting
  const content = JSON.stringify(config, null, 2)
  fs.writeFileSync(configPath, content, 'utf-8')
}

/**
 * Update specific config fields and save to disk.
 * Merges with existing config, preserving fields not in the update.
 * To remove a key, pass it with `undefined` value and use clearUserConfigKeys
 * instead (since spread { ...obj, key: undefined } keeps the key).
 */
export function updateUserConfig(updates: Partial<UserConfig>): void {
  const current = loadUserConfig()
  const updated = { ...current, ...updates }
  saveUserConfig(updated)
}

/**
 * Remove specific keys from config and save to disk.
 * Use this to unset a config value (e.g. clear defaultAgent).
 */
export function clearUserConfigKeys(keys: (keyof UserConfig)[]): void {
  const current = loadUserConfig()
  for (const key of keys) {
    delete current[key]
  }
  saveUserConfig(current)
}

/**
 * Get the default projects directory based on user config and system.
 * Priority:
 * 1. CLI flag --projects-dir (handled in store.ts, not here)
 * 2. User config file ~/.kimaki/config.json
 * 3. ~/Local-Projects-2026/ if it exists
 * 4. <dataDir>/projects (legacy fallback)
 */
export function getDefaultProjectsDir(): string | null {
  // Check user config first
  const config = loadUserConfig()
  if (config.projectsDir) {
    const resolved = path.resolve(config.projectsDir)
    if (fs.existsSync(resolved)) {
      return resolved
    }
    // Config has a path but it doesn't exist - create it
    fs.mkdirSync(resolved, { recursive: true })
    return resolved
  }

  // Check for ~/Local-Projects-2026/
  const localProjectsDir = path.join(os.homedir(), 'Local-Projects-2026')
  if (fs.existsSync(localProjectsDir)) {
    return localProjectsDir
  }

  // Fallback: no default found, will use <dataDir>/projects
  return null
}

/**
 * Get the default guild ID from user config.
 * Returns null if not set (callers should fall back to auto-detection).
 */
export function getDefaultGuildId(): string | null {
  const config = loadUserConfig()
  return config.defaultGuildId ?? null
}

/**
 * Get the default agent from user config.
 * Returns null if not set (callers should fall back to opencode's own default).
 */
export function getDefaultAgent(): string | null {
  const config = loadUserConfig()
  return config.defaultAgent ?? null
}