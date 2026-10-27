// Failed voice messages e2e: a transient transcription failure persists the
// audio, tells the user a retry will happen, and the background retry delivers
// through the exact same path as a live message. A record written before bot
// start is recovered by the startup scan. A permanent failure (empty
// transcription) is reported immediately and never persisted.

import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import type { DeterministicMatcher } from 'opencode-deterministic-provider'
import { afterAll, beforeAll, expect, test } from 'vitest'

import type { BotHandle } from './main.ts'
import { installPluginShim } from './opencode-server.ts'
import { TRANSCRIPTION_KEY_MODAL } from './voice.ts'
import {
  TEST_USER_ID,
  freePort,
  seedProjectChannel,
  startOpencodeTestServer,
  startTestBot,
  startTwin,
  tempDataDir,
  textParts,
  voiceUrl,
  warmUp,
  type FakeTranscription,
  type OpencodeTestServer,
  type TestTwin,
} from './test/harness.ts'

function reply(marker: string, text: string): DeterministicMatcher {
  return { id: marker, priority: 500, when: { latestUserTextIncludes: marker }, then: { parts: textParts(text) } }
}

const matchers: DeterministicMatcher[] = [reply('voice-retry', 'voice retry ok'), reply('voice-recovery', 'voice recovery ok')]

// startFakeGemini with a mutable status, so the test can take transcription
// down and bring it back up between the failure and the retry.
type FailableGemini = { baseUrl: string; requests: number; setStatus: (status: number) => void; stop: () => Promise<void> }

async function startFailableGemini(): Promise<FailableGemini> {
  const state = { status: 200 }
  const server = http.createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
        tools: Array<{ functionDeclarations: Array<{ name: string }> }>
        contents: Array<{ parts: Array<{ inlineData?: { data: string } }> }>
      }
      fake.requests++
      response.setHeader('content-type', 'application/json')
      if (state.status !== 200) {
        response.statusCode = state.status
        response.end(JSON.stringify({ error: { message: 'transcription backend is down' } }))
        return
      }
      const declaration = body.tools[0]!.functionDeclarations[0]!
      const audio = body.contents[0]!.parts.find((part) => part.inlineData)!.inlineData!
      const args = JSON.parse(Buffer.from(audio.data, 'base64').toString('utf8')) as FakeTranscription
      response.end(
        JSON.stringify({
          candidates: [{ finishReason: 'STOP', content: { parts: [{ functionCall: { name: declaration.name, args } }] } }],
        }),
      )
    })
  })
  const port = await freePort()
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve))
  const fake: FailableGemini = {
    baseUrl: `http://127.0.0.1:${port}`,
    requests: 0,
    setStatus: (status) => {
      state.status = status
    },
    stop: () => new Promise((resolve) => server.close(() => resolve())),
  }
  return fake
}

let server: OpencodeTestServer
let twin: TestTwin
let bot: BotHandle | null = null
let gemini: FailableGemini
let dataDir: string

function failedVoiceRecords(): string[] {
  const dir = path.join(dataDir, 'failed-voice')
  return fs.existsSync(dir) ? fs.readdirSync(dir) : []
}

// Poll with a long deadline: the harness waitFor clamps at 10s, and on a
// loaded machine (FSEvents storms slow OpenCode's own file watching) a session
// can take minutes to finish its deterministic run.
async function pollFor<T>({ label, timeout = 240_000, every = 250, check }: { label: string; timeout?: number; every?: number; check: () => Promise<T | null> }): Promise<T> {
  const deadline = Date.now() + timeout
  for (;;) {
    const value = await check()
    if (value !== null) return value
    if (Date.now() > deadline) throw new Error(`Timed out after ${timeout}ms waiting for ${label}`)
    await new Promise((resolve) => setTimeout(resolve, every))
  }
}

function isFooter(message: { author: { id: string }; content: string }, botUserId: string): boolean {
  return message.author.id === botUserId && message.content.startsWith('-# *') && message.content.includes('⋅') && !message.content.startsWith('-# *using ')
}

async function waitFooter({ discord, threadId, count = 1, timeout = 240_000 }: { discord: TestTwin['discord']; threadId: string; count?: number; timeout?: number }) {
  return pollFor({
    label: `footer #${count} in thread ${threadId}`,
    timeout,
    check: async () => {
      const footers = (await discord.thread(threadId).getMessages()).filter((message) => isFooter(message, discord.botUserId))
      return footers.length >= count ? footers[count - 1]! : null
    },
  })
}

async function waitBotMessageContaining({ discord, threadId, text, timeout = 240_000 }: { discord: TestTwin['discord']; threadId: string; text: string; timeout?: number }) {
  return pollFor({
    label: `bot message containing ${JSON.stringify(text)}`,
    timeout,
    check: async () => (await discord.thread(threadId).getMessages()).find((message) => message.author.id === discord.botUserId && message.content.includes(text)) ?? null,
  })
}

async function waitNewThread({ channelId, before, name, timeout = 240_000 }: { channelId: string; before: Set<string>; name?: string; timeout?: number }) {
  return pollFor({
    label: `thread${name ? ` named ${name}` : ''} in channel ${channelId}`,
    timeout,
    check: async () =>
      (await twin.discord.channel(channelId).getThreads()).find((thread) => !before.has(thread.id) && (!name || thread.name === name)) ?? null,
  })
}

async function newThreadSnapshot(): Promise<Set<string>> {
  return new Set(await twin.discord.channel(twin.channelId).getThreads().then((threads) => threads.map((thread) => thread.id)))
}

beforeAll(async () => {
  dataDir = tempDataDir()
  // Voice transcription must be deterministic: the developer's real keys
  // would put OpenAI (and its OGG decode of the fake JSON audio) in the chain.
  delete process.env['OPENAI_API_KEY']
  delete process.env['GEMINI_API_KEY']
  ;[server, twin, gemini] = await Promise.all([startOpencodeTestServer({ matchers }), startTwin(), startFailableGemini()])
  await seedProjectChannel({
    dataDir,
    channelId: twin.channelId,
    guildId: twin.discord.guildId,
    directory: server.projectDirectory,
  })
  await warmUp({ server })
  // baseDelayMs 2s: the first background retry must not fire while the test is
  // still flipping the fake backend back up.
  bot = await startTestBot({
    dataDir,
    twin,
    server,
    geminiBaseUrl: gemini.baseUrl,
    failedVoice: { pollMs: 100, baseDelayMs: 2_000, resumeDelayMs: 200 },
  })
  // The owner stores the key like a user: /transcription-key opens a modal.
  const user = twin.discord.channel(twin.channelId).user(TEST_USER_ID)
  const { id } = await user.runSlashCommand({ name: 'transcription-key' })
  await twin.discord.channel(twin.channelId).waitForInteractionAck({ interactionId: id })
  await user.submitModal({ customId: TRANSCRIPTION_KEY_MODAL, fields: [{ customId: 'apikey', value: 'AIza-test-gemini-key' }] })
  await waitBotMessageContaining({ discord: twin.discord, threadId: twin.channelId, text: 'Gemini API key saved' })
  // One plain session so the OpenCode plugin is seen active for the project
  // directory once; every later startSession then skips the bounded plugin
  // wait. The shim reaches OpenCode only through its file watcher, and FSEvents
  // on a loaded machine can delay that activation beyond waitForPlugin's 10s
  // budget: rewrite the shims and retry until it is active. Best effort.
  try {
    await pollFor({
      label: 'the kimaki plugin to activate in OpenCode',
      timeout: 120_000,
      every: 2_000,
      check: async () => {
        const active = await bot!.features.waitForPlugin(server.projectDirectory)
        if (!(active instanceof Error)) return true
        await installPluginShim({ configDir: server.configDir })
        return null
      },
    })
    await twin.discord.channel(twin.channelId).user(TEST_USER_ID).sendMessage({ content: 'warm up the plugin' })
    const warmThread = await pollFor({
      label: 'the warm-up thread',
      timeout: 60_000,
      check: async () => (await twin.discord.channel(twin.channelId).getThreads()).at(-1) ?? null,
    })
    await waitFooter({ discord: twin.discord, threadId: warmThread.id, timeout: 60_000 })
  } catch (error) {
    console.warn('plugin warm-up failed (the tests still run their own sessions):', error)
  }
}, 180_000)

afterAll(async () => {
  await bot?.stop()
  await twin?.stop()
  await server?.stop()
  await gemini?.stop()
  fs.rmSync(dataDir, { recursive: true, force: true })
})

test('a transient transcription failure is saved, acknowledged and retried after recovery', { timeout: 420_000 }, async () => {
  const { discord, channelId } = twin
  gemini.setStatus(500)
  await discord
    .channel(channelId)
    .user(TEST_USER_ID)
    .sendVoiceMessage({ url: voiceUrl({ transcription: 'Plan the refactor voice-retry', route: 'steer' }) })
  // No thread: the user only learns that the audio is kept and will be retried.
  await waitBotMessageContaining({ discord, threadId: channelId, text: 'retried automatically' })
  const records = failedVoiceRecords()
  expect(records).toHaveLength(1)
  const messageId = records[0]!
  expect(JSON.parse(fs.readFileSync(path.join(dataDir, 'failed-voice', messageId, 'meta.json'), 'utf8'))).toMatchObject({
    attempts: 0,
    channelId,
    mediaType: 'audio/ogg',
  })

  gemini.setStatus(200)
  const before = await newThreadSnapshot()
  const thread = await waitNewThread({ channelId, before, timeout: 240_000 })
  expect(thread.name).toBe('Plan the refactor voice-retry')
  await waitFooter({ discord, threadId: thread.id })
  await waitBotMessageContaining({ discord, threadId: thread.id, text: 'voice retry ok' })
  // The saved bytes were retried, not a fresh download (the data: URL audio of
  // the original message was used): three failed attempts plus one retry.
  expect(gemini.requests).toBeGreaterThanOrEqual(4)
  await pollFor({ label: 'the record to be deleted after success', check: async () => (failedVoiceRecords().length === 0) || null })
})

test('a record written before startup is recovered by the start() scan', { timeout: 420_000 }, async () => {
  await bot?.stop()
  // The original Discord message does not exist anymore: the retry must still
  // deliver, without a live message to reply to.
  const record = {
    messageId: '999000000000000111',
    channelId: twin.channelId,
    threadId: null,
    author: { id: TEST_USER_ID, username: 'tommy' },
    directory: server.projectDirectory,
    inSession: false,
    mediaType: 'audio/ogg',
    attachmentName: 'voice-message.ogg',
    attachmentUrl: 'https://cdn.discord.example/expired',
    files: [],
    createdAt: Date.now(),
    attempts: 9,
    // Gave up before the restart: starting again is the second chance, and the
    // record then has the full give-up budget to survive a slow machine.
    nextAttemptAt: null,
  }
  const recordDir = path.join(dataDir, 'failed-voice', record.messageId)
  fs.mkdirSync(recordDir, { recursive: true })
  // The fake Gemini decodes the audio as the transcription itself (voiceUrl()).
  fs.writeFileSync(path.join(recordDir, 'audio'), Buffer.from(JSON.stringify({ transcription: 'Plan the refactor voice-recovery', route: 'steer' })))
  fs.writeFileSync(path.join(recordDir, 'meta.json'), JSON.stringify(record))

  bot = await startTestBot({
    dataDir,
    twin,
    server,
    geminiBaseUrl: gemini.baseUrl,
    failedVoice: { pollMs: 100, baseDelayMs: 100, resumeDelayMs: 200 },
  })
  const thread = await waitNewThread({ channelId: twin.channelId, before: await newThreadSnapshot(), name: 'Plan the refactor voice-recovery', timeout: 240_000 })
  await waitFooter({ discord: twin.discord, threadId: thread.id })
  await waitBotMessageContaining({ discord: twin.discord, threadId: thread.id, text: 'voice recovery ok' })
  await pollFor({ label: 'the recovered record to be deleted', check: async () => (!fs.existsSync(recordDir)) || null })
})

test('a permanent error is reported immediately and never persisted', async () => {
  const { discord, channelId } = twin
  const before = failedVoiceRecords()
  await discord
    .channel(channelId)
    .user(TEST_USER_ID)
    .sendVoiceMessage({ url: voiceUrl({ transcription: '', route: 'steer' }) })
  await waitBotMessageContaining({ discord, threadId: channelId, text: 'No request was transcribed' })
  // Nothing in a thread and nothing on disk: the message itself is the problem.
  expect(failedVoiceRecords()).toEqual(before)
})
