// Unit: the ASR service probe (asr-service-manager). No server is spawned:
// fetch is stubbed, so the tests pin what counts as "the real ASR service is
// there" versus an unrelated server squatting the port.

import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { parakeetTranscriber } from './asr-service-manager.ts'

// parakeetTranscriber reads ASR_PROVIDER before probing: pin the env so a
// developer shell value cannot silently skip the probe these tests exercise.
let providerEnv: string | undefined

beforeEach(() => {
  providerEnv = process.env['ASR_PROVIDER']
  delete process.env['ASR_PROVIDER']
})

afterEach(() => {
  if (providerEnv === undefined) delete process.env['ASR_PROVIDER']
  else process.env['ASR_PROVIDER'] = providerEnv
  vi.unstubAllGlobals()
})

const BASE_URL = 'http://127.0.0.1:8999'

function stubFetchWith(status: number, body?: unknown): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async () => new Response(body === undefined ? 'no body' : JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

test('a 404 from /health is not the ASR service: the caller falls through instead of transcribing into a squatter', async () => {
  // Any unrelated local server answers /health with 404. The old probe counted
  // every HTTP response as "answering", so voice transcription was routed to
  // the squatter (404 on /transcribe) and every cloud fallback after it.
  const fetchMock = stubFetchWith(404, { detail: 'Not Found' })
  const result = await parakeetTranscriber({ baseUrl: BASE_URL, autoStart: false })
  expect(result).toBeNull()
  // The null comes from the probe verdict, not from a skipped probe: both the
  // healthy() and the answering() probes hit /health before falling through.
  expect(fetchMock.mock.calls.map((call) => String(call[0]!))).toEqual([`${BASE_URL}/health`, `${BASE_URL}/health`])
})

test('a 200 /health with model_loaded false still answers: the model is loading but the port is the service', async () => {
  stubFetchWith(200, { status: 'starting', model_loaded: false, model_name: 'parakeet-tdt-0.6b-v3' })
  const result = await parakeetTranscriber({ baseUrl: BASE_URL, autoStart: false })
  expect(result).toEqual({ kind: 'parakeet' })
})

test('a fully healthy /health answers as before', async () => {
  stubFetchWith(200, { status: 'healthy', model_loaded: true, model_name: 'parakeet-tdt-0.6b-v3' })
  const result = await parakeetTranscriber({ baseUrl: BASE_URL, autoStart: false })
  expect(result).toEqual({ kind: 'parakeet' })
})

test('a refused or timed-out probe falls through to the cloud', async () => {
  const fetchMock = vi.fn(async () => {
    throw new Error('connect ECONNREFUSED')
  })
  vi.stubGlobal('fetch', fetchMock)
  const result = await parakeetTranscriber({ baseUrl: BASE_URL, autoStart: false })
  expect(result).toBeNull()
  expect(fetchMock.mock.calls.map((call) => String(call[0]!))).toEqual([`${BASE_URL}/health`, `${BASE_URL}/health`])
})
