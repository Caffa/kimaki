// Kimaki self-upgrade utilities.
// Detects the package manager used to install kimaki, checks npm for newer versions,
// and runs the global upgrade command. Used by both CLI `kimaki upgrade` and
// the Discord `/upgrade-and-restart` command, plus background auto-upgrade on startup.
//
// Background auto-upgrade is DISABLED when:
// 1. KIMAKI_DISABLE_AUTO_UPGRADE environment variable is set (any value)
// 2. Running via npm/bun link (local dev fork)
// 3. Running from a git checkout with a non-official remote (fork detection)
// This prevents accidentally overwriting local development changes.

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createLogger, LogPrefix } from './logger.js'
import { execAsync } from './worktrees.js'

// Official Kimaki repository URLs. Forks with different remotes will have auto-upgrade disabled.
const OFFICIAL_REPOS = [
  'github.com/remorses/kimaki',
  'github.com/kimaki-ai/kimaki',
]

const logger = createLogger(LogPrefix.CLI)

type Pm = 'bun' | 'pnpm' | 'npm'

// Detects which package manager globally installed kimaki, used to run the
// correct `<pm> i -g kimaki@latest` upgrade command.
//
// Detection order:
// 1. npm_config_user_agent — set by npx/bunx/pnpm dlx, reliable for those cases
// 2. Realpath of the running script — resolve symlinks and check if the path
//    lives under a known PM global directory (e.g. ~/.bun, ~/Library/pnpm,
//    /usr/local/lib/node_modules). Inspired by sindresorhus/global-directory.
// 3. process.versions.bun — if the runtime itself is Bun, likely bun ecosystem
// 4. Default to npm — safest fallback since npm is the most common global installer
export function detectPm(): Pm {
  const ua = process.env.npm_config_user_agent
  if (ua?.startsWith('bun/')) {
    return 'bun'
  }
  if (ua?.startsWith('pnpm/')) {
    return 'pnpm'
  }
  if (ua?.startsWith('npm/')) {
    return 'npm'
  }

  const scriptPath = resolveScriptRealpath()
  if (scriptPath) {
    const p = scriptPath.toLowerCase()
    // bun global installs live under ~/.bun or $BUN_INSTALL
    if (p.includes('.bun/') || p.includes('/bun/install/')) {
      return 'bun'
    }
    // pnpm global installs live under ~/Library/pnpm, ~/.local/share/pnpm, or $PNPM_HOME
    if (p.includes('/pnpm/')) {
      return 'pnpm'
    }
    // npm global installs typically live under lib/node_modules/kimaki without
    // any pnpm or bun path segments, so if we reach here it's likely npm
  }

  if (process.versions.bun) {
    return 'bun'
  }

  return 'npm'
}

function resolveScriptRealpath(): string | null {
  try {
    const script = process.argv[1]
    if (!script) {
      return null
    }
    return fs.realpathSync(script)
  } catch {
    return null
  }
}

export function getCurrentVersion(): string {
  const require = createRequire(import.meta.url)
  const pkg = require('../package.json') as { version: string }
  return pkg.version
}

export async function getLatestNpmVersion(): Promise<string | null> {
  try {
    const res = await fetch('https://registry.npmjs.org/kimaki/latest', {
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) {
      return null
    }
    const data = (await res.json()) as { version: string } | null
    return data?.version ?? null
  } catch {
    return null
  }
}

// Returns the new version string if upgraded, null if already up to date.
export async function upgrade(): Promise<string | null> {
  const current = getCurrentVersion()
  const latest = await getLatestNpmVersion()
  if (!latest) {
    throw new Error('Failed to check latest version from npm')
  }
  if (current === latest) {
    return null
  }

  const pm = detectPm()
  logger.log(`Upgrading kimaki from v${current} to v${latest} using ${pm}...`)
  await execAsync(`${pm} i -g kimaki@latest`, { timeout: 120_000 })

  return latest
}

// Fire-and-forget background upgrade check on bot startup.
// Only upgrades if a newer version is available. Errors are silently ignored.
// DISABLED when:
// 1. KIMAKI_DISABLE_AUTO_UPGRADE is set
// 2. Running via npm/bun link (local dev fork)
// 3. Running from a git checkout with non-official remotes (fork detection)
export async function backgroundUpgradeKimaki(): Promise<void> {
  // Skip auto-upgrade when explicitly disabled via environment variable
  if (process.env.KIMAKI_DISABLE_AUTO_UPGRADE) {
    logger.log('Background upgrade disabled: KIMAKI_DISABLE_AUTO_UPGRADE is set')
    return
  }

  // Skip auto-upgrade when running via npm/bun link (local dev fork)
  if (isNpmLinked()) {
    logger.debug('Skipping background upgrade: running via npm/bun link (local dev fork)')
    return
  }

  // Skip auto-upgrade when running from a fork (detected via git remotes)
  const forkReason = detectIfFork()
  if (forkReason) {
    logger.log(`Background upgrade disabled: ${forkReason}`)
    return
  }

  try {
    const current = getCurrentVersion()
    const latest = await getLatestNpmVersion()
    if (!latest || current === latest) {
      return
    }

    const pm = detectPm()
    logger.log(`Background kimaki upgrade started: v${current} -> v${latest}`)
    await execAsync(`${pm} i -g kimaki@latest`, { timeout: 120_000 })
    logger.log(`Background kimaki upgrade completed: v${latest}`)
  } catch {
    // silently ignored, non-critical
  }
}

/**
 * Detect if kimaki is running via `npm link` or `bun link` (local dev fork) rather than
 * a regular global install from npm. When running via link, the global
 * node_modules has a symlink pointing back to the local source tree.
 * We detect this by resolving the real path of the running script and checking
 * for a .git directory nearby, which only exists in development checkouts.
 */
export function isNpmLinked(): boolean {
  try {
    const script = process.argv[1]
    if (!script) return false
    const resolved = fs.realpathSync(script)
    // If the real path differs from the argv path, it's a symlink
    if (resolved !== script) {
      // Check if the resolved path is inside a git repo
      // by walking up to find a .git directory
      let dir = path.dirname(resolved)
      while (dir !== path.dirname(dir)) {
        if (fs.existsSync(path.join(dir, '.git'))) {
          return true
        }
        dir = path.dirname(dir)
      }
    }
    return false
  } catch {
    return false
  }
}

/**
 * Detect if kimaki is running from a fork by checking git remotes.
 * Returns a string explaining why it's detected as a fork, or null if not a fork.
 * 
 * Detection:
 * 1. Find the package.json directory by walking up from the running script
 * 2. Check if there's a .git directory in the package directory or parent
 * 3. Run `git remote get-url origin` to get the origin remote
 * 4. If origin doesn't point to an official repo URL, it's a fork
 * 
 * Note: We check 'origin' specifically, not all remotes. Many developers
 * use 'upstream' to track the official repo while 'origin' points to their fork.
 */
export function detectIfFork(): string | null {
  try {
    // Find the package directory (where package.json is)
    const script = process.argv[1]
    if (!script) return null
    
    let dir = path.dirname(script)
    while (dir !== path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, 'package.json'))) {
        break
      }
      dir = path.dirname(dir)
    }
    
    // Check if there's a .git directory in this directory or any parent
    let gitDir = dir
    let foundGit = false
    while (gitDir !== path.dirname(gitDir)) {
      if (fs.existsSync(path.join(gitDir, '.git'))) {
        foundGit = true
        break
      }
      gitDir = path.dirname(gitDir)
    }
    
    if (!foundGit) {
      // Not running from a git checkout - likely a normal installed version
      return null
    }
    
    // Check specifically the 'origin' remote - this is the key indicator
    // Many forks have 'upstream' pointing to official repo while 'origin' is their fork
    let originUrl: string | null = null
    try {
      originUrl = execSync('git remote get-url origin', {
        cwd: gitDir,
        encoding: 'utf-8',
        timeout: 5000,
      }).trim()
    } catch {
      // 'origin' remote might not exist
      originUrl = null
    }
    
    // If no origin remote, check all remotes
    if (!originUrl) {
      const remotes = execSync('git remote -v', {
        cwd: gitDir,
        encoding: 'utf-8',
        timeout: 5000,
      }).trim()
      
      if (!remotes) {
        // No remotes configured - could be a local-only repo
        return 'running from local git repo with no remotes (likely a fork)'
      }
      
      // If there are remotes but no 'origin', it's a non-standard setup
      // Treat as potential fork to avoid accidentally upgrading
      return `running from git repo with no 'origin' remote (treating as potential fork)`
    }
    
    // Check if origin points to an official repo
    const originIsOfficial = OFFICIAL_REPOS.some(
      officialRepo => originUrl.toLowerCase().includes(officialRepo.toLowerCase())
    )
    
    if (!originIsOfficial) {
      return `running from fork (origin: ${originUrl}, expected official repo)`
    }
    
    return null
  } catch {
    // Git command failed or not in a git repo
    return null
  }
}
