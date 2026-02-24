// Audio transcription service using AI SDK providers.
// Provider-agnostic: works with any LanguageModelV3 (Google, OpenAI, etc).
// Calls model.doGenerate() directly without the `ai` npm package.
// Uses errore for type-safe error handling.

import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  LanguageModelV3FunctionTool,
  LanguageModelV3Content,
  LanguageModelV3ToolCall,
} from '@ai-sdk/provider'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import * as errore from 'errore'
import { createLogger, LogPrefix } from './logger.js'
import {
  ApiKeyMissingError,
  InvalidAudioFormatError,
  TranscriptionError,
  EmptyTranscriptionError,
  NoResponseContentError,
  NoToolResponseError,
} from './errors.js'

const voiceLogger = createLogger(LogPrefix.VOICE)

type TranscriptionLoopError =
  | NoResponseContentError
  | TranscriptionError
  | EmptyTranscriptionError
  | NoToolResponseError

const transcriptionTool: LanguageModelV3FunctionTool = {
  type: 'function',
  name: 'transcriptionResult',
  description:
    'MANDATORY: You MUST call this tool to complete the task. This is the ONLY way to return results - text responses are ignored. Call this with your transcription, even if imperfect. An imperfect transcription is better than none.',
  inputSchema: {
    type: 'object',
    properties: {
      transcription: {
        type: 'string',
        description:
          'The final transcription of the audio. MUST be non-empty. If audio is unclear, transcribe your best interpretation. If silent, use "[inaudible audio]".',
      },
    },
    required: ['transcription'],
  },
}

/**
 * Extract transcription string from doGenerate content array.
 * Looks for a tool-call named 'transcriptionResult', falls back to text content.
 */
export function extractTranscription(
  content: Array<LanguageModelV3Content>,
): TranscriptionLoopError | string {
  const toolCall = content.find(
    (c): c is LanguageModelV3ToolCall =>
      c.type === 'tool-call' && c.toolName === 'transcriptionResult',
  )

  if (toolCall) {
    // toolCall.input is a JSON string in LanguageModelV3
    const args: Record<string, string> = (() => {
      if (typeof toolCall.input === 'string') {
        return JSON.parse(toolCall.input) as Record<string, string>
      }
      return {}
    })()
    const transcription = args.transcription?.trim() || ''
    voiceLogger.log(
      `Transcription result received: "${transcription.slice(0, 100)}..."`,
    )
    if (!transcription) {
      return new EmptyTranscriptionError()
    }
    return transcription
  }

  // Fall back to text content if no tool call
  const textPart = content.find((c) => c.type === 'text')
  if (textPart && textPart.type === 'text' && textPart.text.trim()) {
    voiceLogger.log(
      `No tool call but got text: "${textPart.text.trim().slice(0, 100)}..."`,
    )
    return textPart.text.trim()
  }

  if (content.length === 0) {
    return new NoResponseContentError()
  }

  return new TranscriptionError({
    reason: 'Model did not produce a transcription',
  })
}

async function runTranscriptionOnce({
  model,
  prompt,
  audioBase64,
  temperature,
}: {
  model: LanguageModelV3
  prompt: string
  audioBase64: string
  temperature: number
}): Promise<TranscriptionLoopError | string> {
  const options: LanguageModelV3CallOptions = {
    prompt: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'file',
            data: audioBase64,
            mediaType: 'audio/mpeg',
          },
        ],
      },
    ],
    temperature,
    maxOutputTokens: 2048,
    tools: [transcriptionTool],
    toolChoice: { type: 'tool', toolName: 'transcriptionResult' },
    providerOptions: {
      google: {
        thinkingConfig: { thinkingBudget: 1024 },
      },
    },
  }

  // doGenerate returns PromiseLike, wrap in Promise.resolve for errore compatibility
  const response = await errore.tryAsync({
    try: () => Promise.resolve(model.doGenerate(options)),
    catch: (e: Error) =>
      new TranscriptionError({
        reason: `API call failed: ${String(e)}`,
        cause: e,
      }),
  })

  if (response instanceof TranscriptionError) {
    return response
  }

  return extractTranscription(response.content)
}

export type TranscribeAudioErrors =
  | ApiKeyMissingError
  | InvalidAudioFormatError
  | TranscriptionLoopError

export type TranscriptionProvider = 'openai' | 'gemini'

/**
 * Create a LanguageModelV3 for transcription.
 * Supports Google Gemini and OpenAI. Provider is selected by the `provider` field,
 * or auto-detected from the API key prefix (sk- = OpenAI, otherwise Gemini).
 */
export function createTranscriptionModel({
  apiKey,
  provider,
}: {
  apiKey: string
  provider?: TranscriptionProvider
}): LanguageModelV3 {
  const resolvedProvider: TranscriptionProvider =
    provider || (apiKey.startsWith('sk-') ? 'openai' : 'gemini')

  if (resolvedProvider === 'openai') {
    const openai = createOpenAI({ apiKey })
    return openai('gpt-4o-transcribe')
  }

  const google = createGoogleGenerativeAI({ apiKey })
  return google('gemini-2.5-flash')
}

export function transcribeAudio({
  audio,
  prompt,
  language,
  temperature,
  apiKey: apiKeyParam,
  model,
  provider,
  currentSessionContext,
  lastSessionContext,
}: {
  audio: Buffer | Uint8Array | ArrayBuffer | string
  prompt?: string
  language?: string
  temperature?: number
  apiKey?: string
  model?: LanguageModelV3
  provider?: TranscriptionProvider
  currentSessionContext?: string
  lastSessionContext?: string
}): Promise<TranscribeAudioErrors | string> {
  const apiKey =
    apiKeyParam || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY

  if (!model && !apiKey) {
    return Promise.resolve(
      new ApiKeyMissingError({ service: 'OpenAI or Gemini' }),
    )
  }

  const languageModel: LanguageModelV3 =
    model || createTranscriptionModel({ apiKey: apiKey!, provider })

  const audioBase64: string = (() => {
    if (typeof audio === 'string') {
      return audio
    }
    if (audio instanceof Buffer) {
      return audio.toString('base64')
    }
    if (audio instanceof Uint8Array) {
      return Buffer.from(audio).toString('base64')
    }
    if (audio instanceof ArrayBuffer) {
      return Buffer.from(audio).toString('base64')
    }
    return ''
  })()

  if (!audioBase64) {
    return Promise.resolve(new InvalidAudioFormatError())
  }

  const languageHint = language ? `The audio is in ${language}.\n\n` : ''

  // build session context section
  const sessionContextParts: string[] = []
  if (lastSessionContext) {
    sessionContextParts.push(`<last_session>
${lastSessionContext}
</last_session>`)
  }
  if (currentSessionContext) {
    sessionContextParts.push(`<current_session>
${currentSessionContext}
</current_session>`)
  }
  const sessionContextSection =
    sessionContextParts.length > 0
      ? `\nSession context (use to understand references to files, functions, tools used):\n${sessionContextParts.join('\n\n')}`
      : ''

  const transcriptionPrompt = `${languageHint}Transcribe this audio for a coding agent (like Claude Code or OpenCode).

 CRITICAL REQUIREMENT: You MUST call the "transcriptionResult" tool to complete this task.
 - The transcriptionResult tool is the ONLY way to return results
 - Text responses are completely ignored - only tool calls work
 - You MUST call transcriptionResult even if you run out of tool calls
 - Always call transcriptionResult with your best approximation of what was said
 - DO NOT end without calling transcriptionResult

This is a software development environment. The speaker is giving instructions to an AI coding assistant. Expect:
- File paths, function names, CLI commands, package names, API endpoints

 RULES:
 - If audio is unclear, transcribe your best interpretation, even with strong accents. Always provide an approximation.
 - If audio seems silent/empty, call transcriptionResult with "[inaudible audio]"
 - Use the session context below to understand technical terms, file names, function names mentioned

Common corrections (apply without tool calls):
- "reacked" → "React", "jason" → "JSON", "get hub" → "GitHub", "no JS" → "Node.js", "dacker" → "Docker"

Project file structure:
<file_tree>
${prompt}
</file_tree>
${sessionContextSection}

REMEMBER: Call "transcriptionResult" tool with your transcription. This is mandatory.

Note: "critique" is a CLI tool for showing diffs in the browser.`

  return runTranscriptionOnce({
    model: languageModel,
    prompt: transcriptionPrompt,
    audioBase64,
    temperature: temperature ?? 0.3,
  })
}
