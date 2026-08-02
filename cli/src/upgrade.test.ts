// Tests for the npm-link upgrade guard.
//
// `isNpmLinked()` itself depends on the runtime package resolution + the
// on-disk install layout, so it is not unit-tested directly. Instead we test
// the pure helper `hasGitInPackageTree()` that drives the decision: this is the
// function whose failure mode could silently re-enable auto-upgrade and
// clobber the local fork. Pinning its behavior with temp dirs prevents that.
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { hasGitInPackageTree, isNpmLinked } from './upgrade.js'

async function createGitMarker(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, '.git'), 'gitdir: placeholder\n')
}

describe('hasGitInPackageTree', () => {
  test('returns false for null/empty input (resolution failed)', () => {
    expect(hasGitInPackageTree(null)).toBe(false)
    expect(hasGitInPackageTree('')).toBe(false)
  })

  test('returns true when .git is in the package directory itself', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kimaki-pkg-'))
    try {
      await createGitMarker(dir)
      expect(hasGitInPackageTree(dir)).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  test('returns true when .git is in the immediate parent (monorepo layout)', async () => {
    const repo = await mkdtemp(join(tmpdir(), 'kimaki-repo-'))
    try {
      await createGitMarker(repo)
      const pkgDir = join(repo, 'cli')
      await mkdir(pkgDir)
      expect(hasGitInPackageTree(pkgDir)).toBe(true)
    } finally {
      await rm(repo, { recursive: true, force: true })
    }
  })

  test('returns false for a plain published-package dir with no .git anywhere', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'kimaki-npm-'))
    try {
      expect(hasGitInPackageTree(dir)).toBe(false)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})

// Smoke test: the guard must not throw and must return a boolean. The value
// depends on install layout (true on this npm-linked fork), so we only assert
// the type/shape here, not the exact value.
describe('isNpmLinked', () => {
  test('returns a boolean without throwing', () => {
    const result = isNpmLinked()
    expect(typeof result).toBe('boolean')
  })
})