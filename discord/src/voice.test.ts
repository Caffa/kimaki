// Tests for voice transcription using AI SDK provider (LanguageModelV3).
// Uses the example audio file at scripts/example-audio.mp3.

import { describe, test, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { transcribeAudio, createTranscriptionModel } from './voice.js'
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
    expect((result as Error).message).toMatchInlineSnapshot(`"No response content from model"`)
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
    expect((result as Error).message).toMatchInlineSnapshot(`"Model returned empty transcription"`)
  })

  test('returns TranscriptionError when content has no tool call or text', () => {
    const result = extractTranscription([
      {
        type: 'reasoning',
        text: 'thinking about it',
      },
    ])
    expect(result).toBeInstanceOf(Error)
    expect((result as Error).message).toMatchInlineSnapshot(`"Transcription failed: Model did not produce a transcription"`)
  })
})

describe('transcribeAudio with real API', () => {
  const apiKey = process.env.GEMINI_API_KEY
  const audioPath = path.join(import.meta.dirname, '..', 'scripts', 'example-audio.mp3')

  test('transcribes example audio file', { timeout: 30_000 }, async () => {
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
      geminiApiKey: apiKey,
    })

    expect(result).toBeTypeOf('string')
    expect((result as string).length).toBeGreaterThan(0)
    console.log('Transcription:', result)
  })
})
