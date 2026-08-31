// Tests for opencode-config-writer.ts.
// Round-trip a fixture config and assert only the Ollama Cloud key changes.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import {
  clearOllamaCloudKeyFromOpencodeConfig,
  writeOllamaCloudKeyToOpencodeConfig,
} from './opencode-config-writer.js'

const fixtureConfig = {
  $schema: 'https://opencode.ai/config.json',
  model: 'opencode/big-pickle',
  default_agent: 'norm-orchestrator',
  provider: {
    opencode: {
      options: {
        chunkTimeout: 3000000,
      },
    },
    'ollama-cloud': {
      npm: '@ai-sdk/openai-compatible',
      name: 'Ollama Cloud',
      options: {
        baseURL: 'https://ollama.com/v1',
        apiKey: '',
        chunkTimeout: 3000000,
      },
      models: {
        'glm-5.1:cloud': {
          name: 'GLM 5.1 (Cloud)',
        },
      },
    },
  },
}

describe('opencode-config-writer', () => {
  let originalConfigPath: string
  let tempConfigDir: string

  beforeEach(() => {
    tempConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'opencode-config-writer-'))
    originalConfigPath = path.join(os.homedir(), '.config', 'opencode', 'opencode.json')
    // Temporarily redirect the writer to a temp config path by patching homedir.
    Object.defineProperty(os, 'homedir', {
      value: () => tempConfigDir,
      configurable: true,
    })
    fs.mkdirSync(path.join(tempConfigDir, '.config', 'opencode'), { recursive: true })
    fs.writeFileSync(
      path.join(tempConfigDir, '.config', 'opencode', 'opencode.json'),
      `${JSON.stringify(fixtureConfig, null, 2)}\n`,
    )
  })

  afterEach(() => {
    Object.defineProperty(os, 'homedir', {
      value: () => originalConfigPath.split(path.sep).slice(0, 3).join(path.sep),
      configurable: true,
    })
    fs.rmSync(tempConfigDir, { recursive: true, force: true })
  })

  test('writeOllamaCloudKeyToOpencodeConfig patches only the key', () => {
    writeOllamaCloudKeyToOpencodeConfig('new-key-value')
    const raw = fs.readFileSync(
      path.join(tempConfigDir, '.config', 'opencode', 'opencode.json'),
      'utf-8',
    )
    const parsed = JSON.parse(raw)
    expect(parsed.provider['ollama-cloud'].options.apiKey).toBe('new-key-value')
    expect(parsed.model).toBe('opencode/big-pickle')
    expect(parsed.provider.opencode.options.chunkTimeout).toBe(3000000)
    expect(parsed.provider['ollama-cloud'].models['glm-5.1:cloud'].name).toBe('GLM 5.1 (Cloud)')
  })

  test('writeOllamaCloudKeyToOpencodeConfig throws when provider is missing', () => {
    fs.writeFileSync(
      path.join(tempConfigDir, '.config', 'opencode', 'opencode.json'),
      JSON.stringify({ model: 'opencode/big-pickle' }),
    )
    expect(() => writeOllamaCloudKeyToOpencodeConfig('new-key-value')).toThrow(
      /ollama-cloud provider block is missing/,
    )
  })

  test('clearOllamaCloudKeyFromOpencodeConfig sets the key to empty string', () => {
    writeOllamaCloudKeyToOpencodeConfig('new-key-value')
    clearOllamaCloudKeyFromOpencodeConfig()
    const raw = fs.readFileSync(
      path.join(tempConfigDir, '.config', 'opencode', 'opencode.json'),
      'utf-8',
    )
    const parsed = JSON.parse(raw)
    expect(parsed.provider['ollama-cloud'].options.apiKey).toBe('')
  })
})
