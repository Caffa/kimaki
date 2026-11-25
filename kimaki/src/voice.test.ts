// Voice transcription unit tests: no OpenCode server, no Discord. The
// transcription chain runs against fake endpoints (parakeet ASR service,
// OpenAI, ChatGPT, Gemini, the gateway website and a local Whisper server)
// and the KIMAKI_DISABLE_CLOUD_TRANSCRIPTION kill switch decides which
// providers may run at all.

import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { createClient } from '@libsql/client'
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from 'vitest'

import { openDb, type KimakiDb } from './db.ts'
import * as schema from './schema.ts'
import { freePort, startFakeParakeet, tempDataDir, writeOpencodeCredential } from './test/harness.ts'
import { chatGPTCredential, NoTranscriptionKeyError, transcribe, TranscriptionError, type TranscriptionBaseUrls } from './voice.ts'

test('chatGPTCredential skips token sharing and expired logins', async () => {
  const dir = tempDataDir()
  const file = path.join(dir, 'opencode.db')
  const client = createClient({ url: `file:${file}` })
  await client.execute('CREATE TABLE credential (id text PRIMARY KEY, integration_id text, value text NOT NULL, active integer, time_updated integer NOT NULL)')
  const rows = [
    // Active, but OpenAI rejects token sharing on dictation and GPT-Live.
    { id: 'sharing', active: 1, time: 3, value: { type: 'oauth', methodID: 'chatgpt-token-sharing', access: 'sharing', expires: 2_000_000 } },
    { id: 'expired', active: 0, time: 2, value: { type: 'oauth', methodID: 'chatgpt-browser', access: 'expired', expires: 1_000 } },
    { id: 'codex', active: 0, time: 1, value: { type: 'oauth', methodID: 'chatgpt-headless', access: 'codex', expires: 2_000_000 } },
  ]
  for (const row of rows) {
    await client.execute({
      sql: `INSERT INTO credential (id, integration_id, value, active, time_updated) VALUES (?, 'openai', ?, ?, ?)`,
      args: [row.id, JSON.stringify(row.value), row.active, row.time],
    })
  }
  client.close()
  expect(await chatGPTCredential({ dbFile: file, now: 1_000_000 })).toEqual({ accessToken: 'codex', accountId: null })
  fs.rmSync(dir, { recursive: true, force: true })
})

// --- KIMAKI_DISABLE_CLOUD_TRANSCRIPTION
//
// Every test starts from a neutral env (no developer cloud keys, no kill
// switch, no Whisper overrides, no ASR_PROVIDER that could skip the parakeet
// probe) and sets only what it needs.

const ENV_KEYS = [
  'ASR_PROVIDER',
  'GEMINI_API_KEY',
  'KIMAKI_DISABLE_CLOUD_TRANSCRIPTION',
  'KIMAKI_WHISPER_MODEL',
  'KIMAKI_WHISPER_TIMEOUT',
  'KIMAKI_WHISPER_URL',
  'KIMAKI_WEBSITE_URL',
  'OPENAI_API_KEY',
] as const

let savedEnv: Array<[string, string | undefined]> = []

beforeEach(() => {
  savedEnv = ENV_KEYS.map((key) => [key, process.env[key]])
  for (const key of ENV_KEYS) delete process.env[key]
})

afterEach(() => {
  for (const [key, value] of savedEnv) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>>): void {
  for (const [key, value] of Object.entries(values)) process.env[key] = value
}

// The cloud side of the chain on one HTTP server: OpenAI needs
// /chat/completions; ChatGPT dictation, local Whisper and the gateway website
// answer multipart with { text }; Gemini has /models/<model>:generateContent.
// (Parakeet uses the real startFakeParakeet.) POSTs are counted per path so a
// test can assert which transcribers actually ran.
type TranscriptionFakes = { url: string; count: (prefix: string) => number; reset: () => void; stop: () => Promise<void> }

async function startTranscriptionFakes(): Promise<TranscriptionFakes> {
  const counts = new Map<string, number>()
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
    if (request.method === 'POST') counts.set(pathname, (counts.get(pathname) ?? 0) + 1)
    const reply = (body: unknown) => {
      response.setHeader('content-type', 'application/json')
      response.end(JSON.stringify(body))
    }
    // ChatGPT dictation, the local Whisper server and the gateway website all
    // read multipart audio and answer plain { text }: no routing tool call.
    if (pathname === '/chatgpt/transcribe' || pathname === '/whisper/audio/transcriptions' || pathname === '/api/transcribe') {
      reply({ text: 'fake transcription' })
      return
    }
    if (pathname === '/openai/chat/completions') {
      reply({ choices: [{ finish_reason: 'stop', message: { tool_calls: [{ function: { name: 'transcriptionResult', arguments: '{"transcription":"fake transcription"}' } }] } }] })
      return
    }
    if (pathname.startsWith('/gemini/') && pathname.endsWith(':generateContent')) {
      reply({ candidates: [{ finishReason: 'STOP', content: { parts: [{ functionCall: { name: 'transcriptionResult', args: { transcription: 'fake transcription' } } }] } }] })
      return
    }
    response.statusCode = 404
    response.end()
  })
  const port = await freePort()
  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve))
  return {
    url: `http://127.0.0.1:${port}`,
    count: (prefix) => {
      let total = 0
      for (const [pathname, number] of counts) if (pathname.startsWith(prefix)) total += number
      return total
    },
    reset: () => counts.clear(),
    stop: () => new Promise((resolve) => server.close(() => resolve())),
  }
}

let fakes: TranscriptionFakes

beforeAll(async () => {
  fakes = await startTranscriptionFakes()
})

beforeEach(() => {
  fakes?.reset()
})

afterAll(async () => {
  await fakes?.stop()
})

// An expiry far in the future, so chatGPTCredential sees the login as valid.
const FAR_FUTURE_EXPIRES = 4_102_444_800_000 // anno 2100

const TEST_TOKEN = 'test-bot-token'
const TEST_APP_ID = 'app-voice-test'

// A migrated temp db for one test, closed and removed after; the callback
// also gets the directory, for files that belong next to kimaki.db (like the
// fake OpenCode credential db) and vanish with it.
async function withDb(run: (db: KimakiDb, dataDir: string) => Promise<void>): Promise<void> {
  const dataDir = tempDataDir()
  const opened = await openDb({ dataDir, migrate: true })
  if (opened instanceof Error) throw opened
  try {
    await run(opened.db, dataDir)
  } finally {
    opened.close()
    fs.rmSync(dataDir, { recursive: true, force: true })
  }
}

// The bot_tokens row transcribers() selects by token, with stored API keys or
// a gateway credential pair. bot_mode defaults to self_hosted, which turns
// into no gateway transcriber at all.
async function seedBot(db: KimakiDb, keys?: { openai?: string; gemini?: string; gateway?: boolean }): Promise<void> {
  if (keys?.gateway) {
    await db.insert(schema.bot_tokens).values({
      app_id: TEST_APP_ID,
      token: TEST_TOKEN,
      bot_mode: 'gateway',
      client_id: 'test-gateway-client',
      client_secret: 'test-gateway-secret',
    })
    return
  }
  await db.insert(schema.bot_tokens).values({ app_id: TEST_APP_ID, token: TEST_TOKEN })
  if (keys?.openai || keys?.gemini) {
    await db.insert(schema.bot_api_keys).values({
      app_id: TEST_APP_ID,
      ...(keys?.openai && { openai_api_key: keys.openai }),
      ...(keys?.gemini && { gemini_api_key: keys.gemini }),
    })
  }
}

// transcribe() with fixed harness arguments. mediaType audio/wav passes every
// provider as is (no ffmpeg or Opus decode), and the keyed cloud providers
// always get a fake base URL so a real API is never reachable.
function runTranscribe(db: KimakiDb, baseUrls?: TranscriptionBaseUrls, opencodeDbFile?: string): ReturnType<typeof transcribe> {
  return transcribe({
    db,
    token: TEST_TOKEN,
    opencodeDbFile: opencodeDbFile ?? path.join(os.tmpdir(), 'kimaki-voice-test-missing-opencode.db'),
    ...(baseUrls && { baseUrls }),
    audio: Buffer.from('fake opus payload'),
    mediaType: 'audio/wav',
    directory: import.meta.dirname,
    agents: [],
    inSession: false,
    asrAutoStart: false,
  })
}

test('the kill switch ignores every cloud key: no cloud endpoint is reached', async () => {
  await withDb(async (db, dataDir) => {
    await seedBot(db, { openai: 'sk-stored-openai', gemini: 'AIza-stored-gemini' })
    const opencodeDbFile = path.join(dataDir, 'opencode.db')
    await writeOpencodeCredential({ file: opencodeDbFile, access: 'codex-access-token', expires: FAR_FUTURE_EXPIRES })
    setEnv({
      OPENAI_API_KEY: 'sk-env-openai',
      GEMINI_API_KEY: 'AIza-env-gemini',
      KIMAKI_DISABLE_CLOUD_TRANSCRIPTION: '1',
      KIMAKI_WEBSITE_URL: fakes.url,
    })
    const result = await runTranscribe(db, { chatgpt: `${fakes.url}/chatgpt`, openai: `${fakes.url}/openai`, gemini: `${fakes.url}/gemini` }, opencodeDbFile)
    // Stored and env OpenAI/Gemini keys plus the ChatGPT subscription are all
    // ignored. Without a parakeet or gateway entry the chain is empty, so the
    // error names the kill switch instead of pointing at API keys.
    expect(result).toBeInstanceOf(TranscriptionError)
    if (!(result instanceof TranscriptionError)) throw result
    expect(result.message).toContain('KIMAKI_DISABLE_CLOUD_TRANSCRIPTION')
    expect(fakes.count('/openai/')).toBe(0)
    expect(fakes.count('/chatgpt/')).toBe(0)
    expect(fakes.count('/gemini/')).toBe(0)
    expect(fakes.count('/api/transcribe')).toBe(0)
  })
})

test('the kill switch keeps the local parakeet service ahead of every cloud key', async () => {
  const parakeet = await startFakeParakeet({ text: 'parakeet handled this' })
  try {
    await withDb(async (db) => {
      await seedBot(db, { openai: 'sk-stored-openai', gemini: 'AIza-stored-gemini' })
      setEnv({
        OPENAI_API_KEY: 'sk-env-openai',
        GEMINI_API_KEY: 'AIza-env-gemini',
        KIMAKI_DISABLE_CLOUD_TRANSCRIPTION: '1',
      })
      const result = await runTranscribe(db, { gemini: `${fakes.url}/gemini`, openai: `${fakes.url}/openai`, parakeet: parakeet.baseUrl })
      expect(result).toEqual({ transcription: 'parakeet handled this', route: 'steer', agent: null })
      expect(parakeet.requests).toHaveLength(1)
      expect(fakes.count('/openai/')).toBe(0)
      expect(fakes.count('/gemini/')).toBe(0)
    })
  } finally {
    await parakeet.stop()
  }
})

test('the kill switch keeps the free gateway Whisper fallback working', async () => {
  await withDb(async (db) => {
    await seedBot(db, { gateway: true })
    setEnv({
      OPENAI_API_KEY: 'sk-env-openai',
      GEMINI_API_KEY: 'AIza-env-gemini',
      KIMAKI_DISABLE_CLOUD_TRANSCRIPTION: '1',
      KIMAKI_WEBSITE_URL: fakes.url,
    })
    const result = await runTranscribe(db, { gemini: `${fakes.url}/gemini`, openai: `${fakes.url}/openai` })
    // The gateway pair stays in the chain and the keys are dropped: the audio
    // goes to the kimaki.dev Whisper endpoint, not to OpenAI.
    expect(result).toEqual({ transcription: 'fake transcription', route: 'steer', agent: null })
    expect(fakes.count('/api/transcribe')).toBe(1)
    expect(fakes.count('/openai/')).toBe(0)
    expect(fakes.count('/gemini/')).toBe(0)
  })
})

test('KIMAKI_WHISPER_URL with the kill switch on still transcribes locally', async () => {
  await withDb(async (db) => {
    await seedBot(db, { openai: 'sk-stored-openai', gemini: 'AIza-stored-gemini' })
    setEnv({
      KIMAKI_DISABLE_CLOUD_TRANSCRIPTION: '1',
      KIMAKI_WHISPER_URL: `${fakes.url}/whisper`,
    })
    const result = await runTranscribe(db)
    // KIMAKI_WHISPER_URL already replaced the whole cloud list: the Whisper
    // server takes the audio and the stored keys never leave the process.
    expect(result).toEqual({ transcription: 'fake transcription', route: 'steer', agent: null })
    expect(fakes.count('/whisper/audio/transcriptions')).toBe(1)
    expect(fakes.count('/openai/')).toBe(0)
    expect(fakes.count('/gemini/')).toBe(0)
  })
})

test('without the kill switch, stored API keys still drive the cloud chain', async () => {
  await withDb(async (db) => {
    await seedBot(db, { openai: 'sk-stored-openai', gemini: 'AIza-stored-gemini' })
    const result = await runTranscribe(db, { gemini: `${fakes.url}/gemini`, openai: `${fakes.url}/openai` })
    // OpenAI is first in the chain and answers: the kill switch is what
    // excluded it in the tests above, not the test setup.
    expect(result).toEqual({ transcription: 'fake transcription', route: 'steer', agent: null })
    expect(fakes.count('/openai/')).toBe(1)
    expect(fakes.count('/gemini/')).toBe(0)
  })
})

test('without the kill switch, a ChatGPT subscription still serves the chain', async () => {
  await withDb(async (db, dataDir) => {
    const opencodeDbFile = path.join(dataDir, 'opencode.db')
    await writeOpencodeCredential({ file: opencodeDbFile, access: 'codex-access-token', expires: FAR_FUTURE_EXPIRES })
    const result = await runTranscribe(db, { chatgpt: `${fakes.url}/chatgpt` }, opencodeDbFile)
    expect(result).toEqual({ transcription: 'fake transcription', route: 'steer', agent: null })
    expect(fakes.count('/chatgpt/')).toBe(1)
  })
})

test('without the kill switch, a Gemini-only key still serves the chain', async () => {
  await withDb(async (db) => {
    await seedBot(db, { gemini: 'AIza-stored-gemini' })
    const result = await runTranscribe(db, { gemini: `${fakes.url}/gemini` })
    expect(result).toEqual({ transcription: 'fake transcription', route: 'steer', agent: null })
    expect(fakes.count('/gemini/')).toBe(1)
  })
})

test('an empty chain still raises NoTranscriptionKeyError without the kill switch', async () => {
  await withDb(async (db) => {
    const result = await runTranscribe(db)
    expect(result).toBeInstanceOf(NoTranscriptionKeyError)
    if (!(result instanceof NoTranscriptionKeyError)) throw result
    // The get-an-API-key advice is correct while the cloud providers run.
    expect(result.message).toContain('OpenAI or Gemini API key')
  })
})

test('with the kill switch on, an empty chain names the flag instead of API keys', async () => {
  await withDb(async (db) => {
    setEnv({ KIMAKI_DISABLE_CLOUD_TRANSCRIPTION: '1' })
    const result = await runTranscribe(db)
    expect(result).toBeInstanceOf(TranscriptionError)
    if (!(result instanceof TranscriptionError)) throw result
    expect(result.message).toContain('the local ASR service is not reachable')
    expect(result.message).toContain('KIMAKI_DISABLE_CLOUD_TRANSCRIPTION')
    expect(result).not.toBeInstanceOf(NoTranscriptionKeyError)
  })
})

test('the kill switch reacts to 1, true and yes, in any case, and nothing else', async () => {
  await withDb(async (db) => {
    for (const value of ['1', 'true', 'yes', 'TRUE', 'Yes', ' 1 ', '\ttrue\t']) {
      setEnv({ KIMAKI_DISABLE_CLOUD_TRANSCRIPTION: value })
      const result = await runTranscribe(db)
      expect(result, `KIMAKI_DISABLE_CLOUD_TRANSCRIPTION=${JSON.stringify(value)}`).toBeInstanceOf(TranscriptionError)
    }
    for (const value of ['0', 'false', 'no', '', ' enabled', 'off']) {
      setEnv({ KIMAKI_DISABLE_CLOUD_TRANSCRIPTION: value })
      const result = await runTranscribe(db)
      expect(result, `KIMAKI_DISABLE_CLOUD_TRANSCRIPTION=${JSON.stringify(value)}`).toBeInstanceOf(NoTranscriptionKeyError)
    }
  })
})
