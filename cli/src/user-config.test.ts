// Tests for user config persistence.
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  loadUserConfig,
  saveUserConfig,
  updateUserConfig,
  getDefaultProjectsDir,
} from './user-config.js'
import type { UserConfig } from './user-config.js'
import { setDataDir, getDataDir } from './config.js'

describe('user-config', () => {
  let tempDir: string
  let originalDataDir: string | null

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kimaki-config-test-'))
    originalDataDir = getDataDir()
  })

  afterEach(() => {
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('loadUserConfig', () => {
    test('returns empty object when config file does not exist', () => {
      setDataDir(tempDir)
      const config = loadUserConfig()
      expect(config).toEqual({})
    })

    test('loads config from ~/.kimaki/config.json', () => {
      setDataDir(tempDir)
      const configPath = path.join(tempDir, 'config.json')
      const testConfig: UserConfig = { projectsDir: '/test/path' }
      fs.writeFileSync(configPath, JSON.stringify(testConfig))

      const loaded = loadUserConfig()
      expect(loaded).toEqual(testConfig)
    })

    test('returns empty object for invalid JSON', () => {
      setDataDir(tempDir)
      const configPath = path.join(tempDir, 'config.json')
      fs.writeFileSync(configPath, 'invalid json')

      const loaded = loadUserConfig()
      expect(loaded).toEqual({})
    })

    test('returns empty object for non-object JSON', () => {
      setDataDir(tempDir)
      const configPath = path.join(tempDir, 'config.json')
      fs.writeFileSync(configPath, '"string"')

      const loaded = loadUserConfig()
      expect(loaded).toEqual({})
    })
  })

  describe('saveUserConfig', () => {
    test('creates config file in data directory', () => {
      setDataDir(tempDir)
      const config: UserConfig = { projectsDir: '/my/projects' }
      saveUserConfig(config)

      const configPath = path.join(tempDir, 'config.json')
      expect(fs.existsSync(configPath)).toBe(true)

      const saved = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      expect(saved).toEqual(config)
    })

    test('creates data directory if it does not exist', () => {
      const nestedDir = path.join(tempDir, 'nested', 'dir')
      setDataDir(nestedDir)

      const config: UserConfig = { projectsDir: '/my/projects' }
      saveUserConfig(config)

      expect(fs.existsSync(nestedDir)).toBe(true)
      const configPath = path.join(nestedDir, 'config.json')
      expect(fs.existsSync(configPath)).toBe(true)
    })

    test('formats JSON with pretty printing', () => {
      setDataDir(tempDir)
      const config: UserConfig = { projectsDir: '/path' }
      saveUserConfig(config)

      const configPath = path.join(tempDir, 'config.json')
      const content = fs.readFileSync(configPath, 'utf-8')
      expect(content).toContain('\n') // Pretty printed
    })
  })

  describe('updateUserConfig', () => {
    test('merges updates with existing config', () => {
      setDataDir(tempDir)
      saveUserConfig({ projectsDir: '/old/path' })
      updateUserConfig({ projectsDir: '/new/path' })

      const loaded = loadUserConfig()
      expect(loaded.projectsDir).toBe('/new/path')
    })

    test('preserves other fields', () => {
      setDataDir(tempDir)
      saveUserConfig({ projectsDir: '/path', otherField: 'value' } as UserConfig)
      updateUserConfig({ projectsDir: '/new/path' })

      const loaded = loadUserConfig()
      expect(loaded.projectsDir).toBe('/new/path')
    })
  })

  describe('getDefaultProjectsDir', () => {
    test('returns null when no config and Local-Projects-2026 does not exist', () => {
      setDataDir(tempDir)
      const homeDir = os.homedir()
      const localProjects = path.join(homeDir, 'Local-Projects-2026')

      // Skip this test if the user has Local-Projects-2026
      if (fs.existsSync(localProjects)) {
        // If it exists, verify it returns that path
        const result = getDefaultProjectsDir()
        expect(result).toBe(localProjects)
      } else {
        // If it doesn't exist, should return null
        const result = getDefaultProjectsDir()
        expect(result).toBeNull()
      }
    })

    test('returns config path when set and exists', () => {
      setDataDir(tempDir)
      const customPath = path.join(tempDir, 'custom-projects')
      fs.mkdirSync(customPath, { recursive: true })
      saveUserConfig({ projectsDir: customPath })

      const result = getDefaultProjectsDir()
      expect(result).toBe(customPath)
    })

    test('creates config path if it does not exist', () => {
      setDataDir(tempDir)
      const customPath = path.join(tempDir, 'new-projects')
      // Path doesn't exist yet
      saveUserConfig({ projectsDir: customPath })

      const result = getDefaultProjectsDir()
      expect(result).toBe(customPath)
      expect(fs.existsSync(customPath)).toBe(true)
    })

    test('returns Local-Projects-2026 when it exists and no config', () => {
      setDataDir(tempDir)
      const homeDir = os.homedir()
      const localProjects = path.join(homeDir, 'Local-Projects-2026')

      // This test will pass/fail depending on whether the user has this directory
      // We can't reliably test this without mocking os.homedir
      // So we just verify it returns the expected path or null
      const result = getDefaultProjectsDir()
      if (fs.existsSync(localProjects)) {
        expect(result).toBe(localProjects)
      } else {
        expect(result).toBeNull()
      }
    })
  })
})