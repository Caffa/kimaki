// Voice transcription with the local parakeet ASR service (asr-service/): a
// real Ogg Opus voice message goes to the ASR server as raw audio (no WAV
// conversion, no API key) and comes back as plain dictation. With parakeet
// configured the cloud providers stay out of the chain, and a failing local
// service surfaces its error instead of silently billing a cloud key.

import fs from 'node:fs'
import path from 'node:path'
import type { DeterministicMatcher } from 'opencode-deterministic-provider'
import { afterAll, beforeAll, expect, test } from 'vitest'

import { saveCredentials } from './credentials.ts'
import { openDb } from './db.ts'
import type { BotHandle } from './main.ts'
import {
  TEST_USER_ID,
  seedProjectChannel,
  startFakeParakeet,
  startOpencodeTestServer,
  startTestBot,
  startTwin,
  tempDataDir,
  textParts,
  waitForFooter,
  warmUp,
  type FakeParakeet,
  type OpencodeTestServer,
  type TestTwin,
} from './test/harness.ts'

const matchers: DeterministicMatcher[] = [
  { id: 'parakeet', priority: 500, when: { latestUserTextIncludes: 'voice-parakeet' }, then: { parts: textParts('parakeet voice ok') } },
]

let server: OpencodeTestServer
let twin: TestTwin
let bot: BotHandle
let parakeet: FakeParakeet
let dataDir: string
// Cloud keys from the developer shell would silently join the fallback chain.
const cloudEnvKeys = ['OPENAI_API_KEY', 'GEMINI_API_KEY'] as const
const savedEnv = new Map<string, string | undefined>()

beforeAll(async () => {
  for (const key of cloudEnvKeys) {
    savedEnv.set(key, process.env[key])
    delete process.env[key]
  }
  dataDir = tempDataDir()
  ;[server, twin, parakeet] = await Promise.all([
    startOpencodeTestServer({ matchers }),
    startTwin(),
    startFakeParakeet({ text: 'Hello from the Mac Studio voice-parakeet' }),
  ])
  await seedProjectChannel({ dataDir, channelId: twin.channelId, guildId: twin.discord.guildId, directory: server.projectDirectory })
  await warmUp({ server })
  // Self-hosted credentials (not the twin's default gateway pair): no hosted
  // Whisper fallback, so the local ASR service is the only transcriber.
  const opened = await openDb({ dataDir, migrate: true })
  if (opened instanceof Error) throw opened
  const saved = await saveCredentials({
    db: opened.db,
    credentials: { mode: 'self_hosted', appId: twin.discord.botUserId, token: twin.discord.botToken, baseUrl: null },
  })
  opened.close()
  if (saved instanceof Error) throw saved
  bot = await startTestBot({ dataDir, twin, server, parakeetBaseUrl: parakeet.baseUrl, saveTwinCredentials: false })
})

afterAll(async () => {
  await bot?.stop()
  await twin?.stop()
  await server?.stop()
  await parakeet?.stop()
  fs.rmSync(dataDir, { recursive: true, force: true })
  for (const [key, value] of savedEnv) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

test('an Ogg Opus voice message goes to the ASR service as raw audio', async () => {
  const ogg = fs.readFileSync(path.join(import.meta.dirname, 'fixtures', 'voice.ogg'))
  await twin.discord
    .channel(twin.channelId)
    .user(TEST_USER_ID)
    .sendVoiceMessage({ url: `data:audio/ogg;base64,${ogg.toString('base64')}` })
  const thread = await twin.discord.channel(twin.channelId).waitForThread({ timeout: 8_000 })
  await waitForFooter({ discord: twin.discord, threadId: thread.id })
  expect(await twin.discord.thread(thread.id).text()).toMatchInlineSnapshot(`
    "--- from: user (tommy)
    [attachment: voice-message.ogg]
    --- from: assistant (TestBot)
    » **tommy:** Hello from the Mac Studio voice-parakeet
    -# *using deterministic-provider/deterministic-v2 ⋅ build*
    parakeet voice ok
    -# *project ⋅ main ⋅ Ns ⋅ N% ⋅ deterministic-v2*"
  `)
  const [request] = parakeet.requests
  expect({
    filename: request?.filename,
    type: request?.type,
    header: request?.audio.subarray(0, 4).toString('ascii'),
  }).toMatchInlineSnapshot(`
    {
      "filename": "voice.ogg",
      "header": "OggS",
      "type": "audio/ogg",
    }
  `)
  // The ASR service receives the original bytes, unlike OpenAI which needs WAV.
  expect(request!.audio.equals(ogg)).toBe(true)
})

test('a failing ASR service is reported instead of falling through to a cloud provider', async () => {
  const ogg = fs.readFileSync(path.join(import.meta.dirname, 'fixtures', 'voice.ogg'))
  parakeet.status = 500
  try {
    await twin.discord
      .channel(twin.channelId)
      .user(TEST_USER_ID)
      .sendVoiceMessage({ url: `data:audio/ogg;base64,${ogg.toString('base64')}` })
    const reply = await twin.discord.channel(twin.channelId).waitForMessage({ timeout: 8_000, predicate: (message) => message.content.startsWith('✗') })
    expect(reply.content).toMatchInlineSnapshot(`"✗ Transcription API returned 500: {"detail":"transcription failed"}"`)
  } finally {
    parakeet.status = 200
  }
})
