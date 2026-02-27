// Tests for voice transcription using AI SDK provider (LanguageModelV3).
// Uses the example audio files at scripts/example-audio.{mp3,ogg}.

import { describe, test, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { transcribeAudio, convertOggToWav } from './voice.js'
import { extractTranscription } from './voice.js'

describe('extractTranscription', () => {
  test('extracts transcription from tool call', () => {
    const result = extractTranscription([
      {
        type: 'tool-call',
        toolCallId: 'call_1',
        toolName: 'transcriptionResult',
        input: JSON.stringify({ transcription: 'hello world' }),
      },
    ])
    expect(result).toMatchInlineSnapshot(`"hello world"`)
  })

  test('falls back to text when no tool call', () => {
    const result = extractTranscription([
      {
        type: 'text',
        text: 'fallback text response',
      },
    ])
    expect(result).toMatchInlineSnapshot(`"fallback text response"`)
  })

  test('returns NoResponseContentError for empty content', () => {
    const result = extractTranscription([])
    expect(result).toBeInstanceOf(Error)
    expect((result as Error).message).toMatchInlineSnapshot(
      `"No response content from model"`,
    )
  })

  test('returns EmptyTranscriptionError for empty transcription string', () => {
    const result = extractTranscription([
      {
        type: 'tool-call',
        toolCallId: 'call_1',
        toolName: 'transcriptionResult',
        input: JSON.stringify({ transcription: '   ' }),
      },
    ])
    expect(result).toBeInstanceOf(Error)
    expect((result as Error).message).toMatchInlineSnapshot(
      `"Model returned empty transcription"`,
    )
  })

  test('returns TranscriptionError when content has no tool call or text', () => {
    const result = extractTranscription([
      {
        type: 'reasoning',
        text: 'thinking about it',
      },
    ])
    expect(result).toBeInstanceOf(Error)
    expect((result as Error).message).toMatchInlineSnapshot(
      `"Transcription failed: Model did not produce a transcription"`,
    )
  })
})

describe('transcribeAudio with real API', () => {
  const audioPath = path.join(
    import.meta.dirname,
    '..',
    'scripts',
    'example-audio.mp3',
  )

  test('transcribes with Gemini', { timeout: 30_000 }, async () => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.log('Skipping: GEMINI_API_KEY not set')
      return
    }
    if (!fs.existsSync(audioPath)) {
      console.log('Skipping: example-audio.mp3 not found')
      return
    }

    const audio = fs.readFileSync(audioPath)
    const result = await transcribeAudio({
      audio,
      prompt: 'test project',
      apiKey,
      provider: 'gemini',
    })

    expect(result).toBeTypeOf('string')
    expect((result as string).length).toBeGreaterThan(0)
    console.log('Gemini transcription:', result)
  })

  test('transcribes with OpenAI', { timeout: 30_000 }, async () => {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.log('Skipping: OPENAI_API_KEY not set')
      return
    }
    if (!fs.existsSync(audioPath)) {
      console.log('Skipping: example-audio.mp3 not found')
      return
    }

    const audio = fs.readFileSync(audioPath)
    const result = await transcribeAudio({
      audio,
      prompt: 'test project',
      apiKey,
      provider: 'openai',
    })

    expect(result).toBeTypeOf('string')
    expect((result as string).length).toBeGreaterThan(0)
    console.log('OpenAI transcription:', result)
  })

  test('transcribes OGG with OpenAI (converts to WAV)', { timeout: 30_000 }, async () => {
    const apiKey = process.env.OPENAI_API_KEY
    const oggPath = path.join(import.meta.dirname, '..', 'scripts', 'example-audio.ogg')
    if (!apiKey) {
      console.log('Skipping: OPENAI_API_KEY not set')
      return
    }
    if (!fs.existsSync(oggPath)) {
      console.log('Skipping: example-audio.ogg not found')
      return
    }

    const audio = fs.readFileSync(oggPath)
    const result = await transcribeAudio({
      audio,
      prompt: 'test project',
      apiKey,
      provider: 'openai',
      mediaType: 'audio/ogg',
    })

    expect(result).toBeTypeOf('string')
    expect((result as string).length).toBeGreaterThan(0)
    console.log('OpenAI OGG transcription:', result)
  })
})

describe('convertOggToWav', () => {
  test('converts OGG Opus to valid WAV', async () => {
    const oggPath = path.join(import.meta.dirname, '..', 'scripts', 'example-audio.ogg')
    if (!fs.existsSync(oggPath)) {
      console.log('Skipping: example-audio.ogg not found')
      return
    }

    const ogg = fs.readFileSync(oggPath)
    const result = await convertOggToWav(ogg)
    expect(result).toBeInstanceOf(Buffer)

    const wav = result as Buffer
    // WAV header starts with RIFF
    expect(wav.subarray(0, 4).toString()).toBe('RIFF')
    expect(wav.subarray(8, 12).toString()).toBe('WAVE')
    // Must be larger than just the header (44 bytes)
    expect(wav.length).toBeGreaterThan(44)
    console.log(`Converted OGG (${ogg.length} bytes) to WAV (${wav.length} bytes)`)
  })
})
