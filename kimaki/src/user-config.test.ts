// Unit tests for the local-fork user config file and the default project
// directory resolution (V1 projectsDir / --default-agent parity).

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, expect, test } from 'vitest'

import { defaultProjectDirectory } from './project.ts'
import { clearUserConfigKeys, loadUserConfig, updateUserConfig } from './user-config.ts'

let dataDir: string

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kimaki-user-config-'))
})

test('config round-trips the default agent', () => {
  expect(loadUserConfig({ dataDir })).toEqual({})
  updateUserConfig({ dataDir, values: { defaultAgent: 'norm-orchestrator' } })
  expect(loadUserConfig({ dataDir })).toEqual({ defaultAgent: 'norm-orchestrator' })
  updateUserConfig({ dataDir, values: { defaultAgent: 'build' } })
  expect(loadUserConfig({ dataDir })).toEqual({ defaultAgent: 'build' })
})

test('clearUserConfigKeys removes only the listed keys', () => {
  updateUserConfig({ dataDir, values: { defaultAgent: 'build' } })
  clearUserConfigKeys({ dataDir, keys: ['defaultAgent'] })
  expect(loadUserConfig({ dataDir })).toEqual({})
  // Clearing again stays quiet: the file exists and just stays empty.
  clearUserConfigKeys({ dataDir, keys: ['defaultAgent'] })
  expect(loadUserConfig({ dataDir })).toEqual({})
})

test('a broken config file reads as empty and a later write repairs it', () => {
  fs.writeFileSync(path.join(dataDir, 'config.json'), '{not json')
  expect(loadUserConfig({ dataDir })).toEqual({})
  updateUserConfig({ dataDir, values: { defaultAgent: 'build' } })
  expect(loadUserConfig({ dataDir })).toEqual({ defaultAgent: 'build' })
})

test('a missing config directory is not an error', () => {
  const nested = path.join(dataDir, 'does-not-exist')
  expect(loadUserConfig({ dataDir: nested })).toEqual({})
  updateUserConfig({ dataDir: nested, values: { defaultAgent: 'build' } })
  expect(loadUserConfig({ dataDir: nested })).toEqual({ defaultAgent: 'build' })
})

// The fork prefers ~/Local-Projects-2026 outside tests; tests (KIMAKI_VITEST=1)
// always get the stock location, and KIMAKI_PROJECTS_DIR overrides both.
test('defaultProjectDirectory: stock under vitest, override wins over everything', () => {
  expect(defaultProjectDirectory({ dataDir: '/data' })).toBe(path.join('/data', 'projects', 'kimaki'))
  const previous = process.env['KIMAKI_PROJECTS_DIR']
  process.env['KIMAKI_PROJECTS_DIR'] = '/custom/projects'
  try {
    expect(defaultProjectDirectory({ dataDir: '/data' })).toBe(path.join('/custom/projects', 'kimaki'))
  } finally {
    if (previous === undefined) delete process.env['KIMAKI_PROJECTS_DIR']
    else process.env['KIMAKI_PROJECTS_DIR'] = previous
  }
})
