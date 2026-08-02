// Kimaki self-upgrade utilities.
// Detects the package manager used to install kimaki, checks npm for newer versions,
// and runs the global upgrade command. Used by both CLI `kimaki upgrade` and
// the Discord `/upgrade-and-restart` command.
//
// Background auto-upgrade is DISABLED when running via npm link (local dev fork)
// because it would replace the symlink with the published npm package, destroying
// local customizations (ASR, banner, Pi agent sessions, etc).

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createLogger, LogPrefix } from './logger.js'
import { execAsync } from './worktrees.js'

const logger = createLogger(LogPrefix.CLI)

type Pm = 'bun' | 'pnpm' | 'npm'

/**
 * Detect if kimaki is running via `npm link` (local dev fork) rather than
 * a regular global install from npm. When running via npm link, the global
 * node_modules/kimaki entry is a symlink to a local source tree.
 * Auto-upgrade must be disabled in this case because `npm i -g kimaki@latest`
 * would replace the symlink with the published package, destroying all local
 * customizations (ASR services, banner, Pi agent sessions, etc).
 *
 * Heuristic: check if the resolved package directory (or its immediate parent,
 * for monorepo layouts) contains a `.git` folder. Published npm packages never
 * ship `.git`; local forks always have it in the package dir or the repo root.
 *
 * Resolution is tried two ways so a future `package.json` `exports` change
 * cannot silently disable the guard: (1) by self-package name, and (2) by a
 * relative resolve that does not depend on `exports`. Returning `false` only
 * when BOTH fail is the safe direction for the local fork — and for a real
 * npm install both resolve to the same published dir with no `.git`.
 */
export function isNpmLinked(): boolean {
  return hasGitInPackageTree(resolveKimakiPackageDir())
}

/**
 * Resolve the kimaki package directory. Returns null only if both resolution
 * strategies throw (extremely unlikely). Strategy (1) relies on the
 * `exports["./package.json"]` field; strategy (2) is a relative resolve that
 * always works regardless of `exports`.
 */
function resolveKimakiPackageDir(): string | null {
  const require = createRequire(import.meta.url)
  try {
    return path.dirname(require.resolve('kimaki/package.json'))
  } catch {
    try {
      return path.dirname(require.resolve('../package.json'))
    } catch {
      return null
    }
  }
}

/**
 * Pure helper: returns true if `pkgDir` or its immediate parent contains a
 * `.git` entry. Exported for unit testing. `null`/empty input returns false.
 */
export function hasGitInPackageTree(pkgDir: string | null): boolean {
  if (!pkgDir) {
    return false
  }
  for (const dir of [pkgDir, path.dirname(pkgDir)]) {
    try {
      fs.accessSync(path.join(dir, '.git'))
      return true
    } catch {
      // No .git here, try next
    }
  }
  return false
}

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
// BLOCKED when running via npm link — see isNpmLinked().
export async function upgrade(): Promise<string | null> {
  if (isNpmLinked()) {
    throw new Error(
      'Cannot upgrade: kimaki is running via npm link (local dev fork). ' +
        'Global upgrade would replace the symlink and destroy local customizations. ' +
        'To update, merge from upstream instead: git fetch upstream && git merge upstream/main',
    )
  }

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

// Background upgrade check on bot startup.
// DISABLED when running via npm link (local dev fork) — would destroy local customizations.
// Only upgrades if a newer version is available. Errors are silently ignored.
export async function backgroundUpgradeKimaki(): Promise<void> {
  if (isNpmLinked()) {
    logger.debug('Skipping auto-upgrade: kimaki is running via npm link (local dev fork)')
    return
  }

  try {
    const current = getCurrentVersion()
    const latest = await getLatestNpmVersion()
    if (!latest || current === latest) {
      return
    }

    const pm = detectPm()
    logger.debug(`Background kimaki upgrade started: v${current} -> v${latest}`)
    await execAsync(`${pm} i -g kimaki@latest`, { timeout: 120_000 })
    logger.debug(`Background kimaki upgrade completed: v${latest}`)
  } catch {
    // silently ignored, non-critical
  }
}
