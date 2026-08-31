// Tests for user config persistence.
import { describe, test, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  loadUserConfig,
  saveUserConfig,
  updateUserConfig,
  clearUserConfigKeys,
  getDefaultProjectsDir,
  getDefaultAgent,
} from './user-config.js'
import type { UserConfig } from './user-config.js'
import { setDataDir } from './config.js'

describe('user-config', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kimaki-config-test-'))
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

    test('returns empty object for JSON array', () => {
      setDataDir(tempDir)
      const configPath = path.join(tempDir, 'config.json')
      fs.writeFileSync(configPath, '[1,2,3]')

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

    test('preserves other fields when updating', () => {
      setDataDir(tempDir)
      saveUserConfig({ projectsDir: '/path', defaultAgent: 'norm-orchestrator' })
      updateUserConfig({ projectsDir: '/new/path' })

      const loaded = loadUserConfig()
      expect(loaded.projectsDir).toBe('/new/path')
      expect(loaded.defaultAgent).toBe('norm-orchestrator')
    })

    test('adds defaultAgent to existing config', () => {
      setDataDir(tempDir)
      saveUserConfig({ projectsDir: '/path' })
      updateUserConfig({ defaultAgent: 'norm-orchestrator' })

      const loaded = loadUserConfig()
      expect(loaded.projectsDir).toBe('/path')
      expect(loaded.defaultAgent).toBe('norm-orchestrator')
    })
  })

  describe('getDefaultProjectsDir', () => {
    test('returns null when no config and Local-Projects-2026 does not exist', () => {
      setDataDir(tempDir)
      const homeDir = os.homedir()
      const localProjects = path.join(homeDir, 'Local-Projects-2026')

      // Skip this test if the user has Local-Projects-2026
      if (fs.existsSync(localProjects)) {
        const result = getDefaultProjectsDir()
        expect(result).toBe(localProjects)
      } else {
        const result = getDefaultProjectsDir()
        expect(result).toBeNull()
      }
    })

    test('returns config path when set', () => {
      setDataDir(tempDir)
      const customPath = path.join(tempDir, 'custom-projects')
      fs.mkdirSync(customPath, { recursive: true })
      saveUserConfig({ projectsDir: customPath })

      const result = getDefaultProjectsDir()
      expect(result).toBe(customPath)
    })
  })

  describe('getDefaultAgent', () => {
    test('returns null when not set in config', () => {
      setDataDir(tempDir)
      const result = getDefaultAgent()
      expect(result).toBeNull()
    })

    test('returns agent from config file', () => {
      setDataDir(tempDir)
      saveUserConfig({ defaultAgent: 'norm-orchestrator' })

      const result = getDefaultAgent()
      expect(result).toBe('norm-orchestrator')
    })

    test('returns null when config file exists but has no defaultAgent', () => {
      setDataDir(tempDir)
      saveUserConfig({ projectsDir: '/some/path' })

      const result = getDefaultAgent()
      expect(result).toBeNull()
    })

    test('returns custom agent name', () => {
      setDataDir(tempDir)
      saveUserConfig({ defaultAgent: 'my-custom-agent' })

      const result = getDefaultAgent()
      expect(result).toBe('my-custom-agent')
    })
  })

  describe('clearUserConfigKeys', () => {
    test('removes specified key from config', () => {
      setDataDir(tempDir)
      saveUserConfig({ defaultAgent: 'norm-orchestrator', projectsDir: '/path' })

      clearUserConfigKeys(['defaultAgent'])

      const loaded = loadUserConfig()
      expect(loaded.defaultAgent).toBeUndefined()
      expect(loaded.projectsDir).toBe('/path')
    })

    test('removes multiple keys', () => {
      setDataDir(tempDir)
      saveUserConfig({ defaultAgent: 'norm-orchestrator', projectsDir: '/path', defaultGuildId: '123' })

      clearUserConfigKeys(['defaultAgent', 'projectsDir'])

      const loaded = loadUserConfig()
      expect(loaded.defaultAgent).toBeUndefined()
      expect(loaded.projectsDir).toBeUndefined()
      expect(loaded.defaultGuildId).toBe('123')
    })

    test('no-ops for non-existent keys', () => {
      setDataDir(tempDir)
      saveUserConfig({ projectsDir: '/path' })

      clearUserConfigKeys(['defaultAgent'])

      const loaded = loadUserConfig()
      expect(loaded.projectsDir).toBe('/path')
    })

    test('getDefaultAgent returns null after clearing', () => {
      setDataDir(tempDir)
      saveUserConfig({ defaultAgent: 'norm-orchestrator' })
      expect(getDefaultAgent()).toBe('norm-orchestrator')

      clearUserConfigKeys(['defaultAgent'])

      expect(getDefaultAgent()).toBeNull()
    })
  })
})