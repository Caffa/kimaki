// Tests for service-auth-token-file.ts.
// Verify atomic writes, restrictive permissions, unchanged-content no-ops,
// and graceful error handling while never touching the real home directory.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { writeServiceAuthTokenFile } from './service-auth-token-file.js'

describe('service-auth-token-file', () => {
  let tempHomeDir: string
  let originalHomedir: () => string
  const token = 'gateway-token-abc-123'

  beforeEach(() => {
    tempHomeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kimaki-service-auth-'))
    originalHomedir = os.homedir
    Object.defineProperty(os, 'homedir', {
      value: () => tempHomeDir,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(os, 'homedir', {
      value: originalHomedir,
      configurable: true,
    })
    fs.rmSync(tempHomeDir, { recursive: true, force: true })
  })

  const tokenFilePath = () =>
    path.join(tempHomeDir, '.config', 'opencode', 'secrets', 'kimaki_db_auth_token')

  const assertMode = (filePath: string, expected: number) => {
    // Mask the file type bits so the comparison works across platforms.
    const mode = fs.statSync(filePath).mode & 0o777
    expect(mode).toBe(expected)
  }

  test('writes token with 600 permissions', async () => {
    await writeServiceAuthTokenFile(token)

    const filePath = tokenFilePath()
    expect(fs.existsSync(filePath)).toBe(true)
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(token)
    assertMode(filePath, 0o600)
  })

  test('creates parent directories with 700 permissions', async () => {
    await writeServiceAuthTokenFile(token)

    const secretsDir = path.dirname(tokenFilePath())
    expect(fs.existsSync(secretsDir)).toBe(true)
    assertMode(secretsDir, 0o700)
  })

  test('no-op when content is unchanged', async () => {
    const filePath = tokenFilePath()
    fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 })
    fs.writeFileSync(filePath, token, { mode: 0o600 })

    const beforeStat = fs.statSync(filePath)

    await writeServiceAuthTokenFile(token)

    const afterStat = fs.statSync(filePath)
    expect(afterStat.mtimeMs).toBe(beforeStat.mtimeMs)
    expect(fs.readFileSync(filePath, 'utf-8')).toBe(token)
  })

  test('overwrites when content changes', async () => {
    const filePath = tokenFilePath()
    fs.mkdirSync(path.dirname(filePath), { recursive: true, mode: 0o700 })
    fs.writeFileSync(filePath, 'old-token', { mode: 0o600 })

    await writeServiceAuthTokenFile(token)

    expect(fs.readFileSync(filePath, 'utf-8')).toBe(token)
    assertMode(filePath, 0o600)
  })

  test('swallows errors without throwing', async () => {
    // Force a failure by pointing homedir at a path that cannot exist as a
    // directory. This works on macOS/Linux without needing root to make a real
    // directory read-only.
    Object.defineProperty(os, 'homedir', {
      value: () => path.join(tempHomeDir, 'not-a-directory-file'),
      configurable: true,
    })
    fs.writeFileSync(path.join(tempHomeDir, 'not-a-directory-file'), '')

    await expect(writeServiceAuthTokenFile(token)).resolves.toBeUndefined()
  })
})
