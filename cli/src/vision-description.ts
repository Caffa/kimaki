// Vision description using Ollama models (cloud-first with local fallback)
// Dynamically discovers vision-capable models from installed Ollama models

import { createLogger, LogPrefix } from './logger.js'

const logger = createLogger(LogPrefix.FORMATTING)

// Vision model preference: cloud > local vision > local fallback
const CLOUD_VISION_MODELS = [
  'gemma3:27b-cloud',
  'gemma3:12b-cloud',
  'gemma3:4b-cloud',
]

// Known vision-capable model families (auto-detected from model details)
const VISION_FAMILIES = new Set([
  'llava',
  'qwen3vl',
  'llama3.2-vision',
  'minicpm-v',
  'moondream',
  'bakllava',
  'xgen',
  'fuyu',
])

// Fallback models when no vision-specific models found
const LOCAL_FALLBACK_PRIORITY = [
  'qwen3-vl:latest',
  'llava:latest',
  'llama3.2-vision:latest',
  'gemma3:12b',
  'gemma3:4b',
]

const VISION_MODEL_OVERRIDE = process.env.KIMAKI_VISION_MODEL

const VISION_PROMPT = `You are analyzing a screenshot to help an AI coding assistant debug an issue. The user has shared this image as context.

Describe what you see in extreme detail, focusing on information relevant to debugging and coding:

1. **Text Content** (most important):
   - Exact error messages, stack traces, log output
   - Code snippets visible in the image
   - File paths, line numbers, function names
   - Configuration values, environment variables
   - Command output or terminal text

2. **UI/Application State**:
   - What application is this? (IDE, browser, terminal, etc.)
   - Window title, tabs, active panel
   - UI elements with their current state/status
   - Highlighted text, cursor position, selections
   - Any visible notifications or warnings

3. **Code Context** (if applicable):
   - Programming language/framework
   - File structure or project layout
   - Git status, branches, diffs
   - Test results or build output

4. **Visual Debugging Clues**:
   - Color coding (errors in red, warnings in yellow)
   - Icons indicating status (error icons, loading spinners)
   - Layout issues or visual glitches
   - Unexpected behavior visible in the UI

Be specific and precise - quote exact error messages, include exact filenames, note exact line numbers. The AI assistant needs detailed text to write code fixes.`

interface OllamaChatResponse {
  model: string
  message: {
    role: string
    content: string
  }
  done: boolean
}

interface OllamaTagsResponse {
  models: Array<{ name: string }>
}

interface OllamaModelDetails {
  family: string
  families: string[]
}

interface OllamaShowResponse {
  details?: OllamaModelDetails
}

interface OllamaErrorResponse {
  error: string
}

async function checkOllamaHealth(): Promise<boolean> {
  const ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434'
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })
    return response.ok
  } catch {
    return false
  }
}

async function listLocalModels(): Promise<string[]> {
  const ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434'
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })
    if (!response.ok) return []
    const data = (await response.json()) as OllamaTagsResponse
    return data.models?.map((m) => m.name) || []
  } catch {
    return []
  }
}

async function isVisionCapableModel(modelName: string): Promise<boolean> {
  const ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434'
  try {
    const response = await fetch(`${ollamaUrl}/api/show`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: modelName }),
      signal: AbortSignal.timeout(1000),
    })
    if (!response.ok) return false

    const data = (await response.json()) as OllamaShowResponse
    if (!data.details) return false

    // Check if any of the model's families are vision-capable
    const families = data.details.families || [data.details.family]
    return families.some((f) => VISION_FAMILIES.has(f.toLowerCase()))
  } catch {
    return false
  }
}

async function discoverLocalVisionModels(): Promise<string[]> {
  const allModels = await listLocalModels()
  const visionModels: string[] = []

  // Check each installed model for vision capabilities
  for (const model of allModels) {
    const isVision = await isVisionCapableModel(model)
    if (isVision) {
      visionModels.push(model)
      logger.log(`Discovered vision-capable model: ${model}`)
    }
  }

  return visionModels
}

async function checkCloudAuth(): Promise<boolean> {
  try {
    const result = await fetch('https://ollama.com/api/auth/check', {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    })
    return result.ok
  } catch {
    return false
  }
}

async function tryVisionModel(
  model: string,
  imageBase64: string,
  isCloud: boolean,
): Promise<string | null> {
  const ollamaUrl = isCloud
    ? 'https://ollama.com/api'
    : process.env.OLLAMA_HOST || 'http://localhost:11434'

  try {
    const response = await fetch(`${ollamaUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: VISION_PROMPT,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        stream: false,
      }),
      signal: AbortSignal.timeout(90000), // 90s timeout for cloud models
    })

    if (!response.ok) {
      const error = (await response.json()) as OllamaErrorResponse
      logger.log(
        `${isCloud ? 'Cloud' : 'Local'} model ${model} failed: ${error.error || response.statusText}`,
      )
      return null
    }

    const result = (await response.json()) as OllamaChatResponse
    const description = result.message?.content?.trim()

    if (!description) {
      logger.log(`Empty response from ${model}`)
      return null
    }

    logger.log(`✓ ${isCloud ? 'Cloud' : 'Local'} model ${model} succeeded`)
    return description
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.log(`${model} request timed out`)
    } else {
      logger.log(`${model} request failed:`, error)
    }
    return null
  }
}

export async function describeImage(
  imageBuffer: Buffer,
  filename: string,
): Promise<string | null> {
  // If user specified a model explicitly, use only that
  if (VISION_MODEL_OVERRIDE) {
    if (VISION_MODEL_OVERRIDE === '') {
      logger.log('Vision model disabled via KIMAKI_VISION_MODEL=""')
      return null
    }
    logger.log(`Using override model: ${VISION_MODEL_OVERRIDE}`)
    const isCloud = VISION_MODEL_OVERRIDE.endsWith('-cloud')
    const base64 = imageBuffer.toString('base64')
    return tryVisionModel(VISION_MODEL_OVERRIDE, base64, isCloud)
  }

  // Check if Ollama is available at all
  const isHealthy = await checkOllamaHealth()
  const hasCloudAuth = await checkCloudAuth()

  if (!isHealthy && !hasCloudAuth) {
    logger.log('No Ollama endpoint available (local or cloud)')
    return null
  }

  const base64 = imageBuffer.toString('base64')

  // Try cloud models first (if authenticated)
  if (hasCloudAuth) {
    for (const model of CLOUD_VISION_MODELS) {
      const description = await tryVisionModel(model, base64, true)
      if (description) {
        return description
      }
    }
  }

  // Try local models - discover vision-capable ones automatically
  if (isHealthy) {
    // Discover which installed models are vision-capable
    const discoveredVisionModels = await discoverLocalVisionModels()

    if (discoveredVisionModels.length > 0) {
      logger.log(
        `Found ${discoveredVisionModels.length} vision-capable model(s): ${discoveredVisionModels.join(', ')}`,
      )
      // Try discovered vision models
      for (const model of discoveredVisionModels) {
        const description = await tryVisionModel(model, base64, false)
        if (description) {
          return description
        }
      }
    }

    // Fallback to preferred local models (in priority order)
    const allModels = await listLocalModels()
    for (const model of LOCAL_FALLBACK_PRIORITY) {
      const modelPrefix = model.split(':')[0]
      if (modelPrefix && allModels.some((m) => m.startsWith(modelPrefix))) {
        const description = await tryVisionModel(model, base64, false)
        if (description) {
          return description
        }
      }
    }
  }

  logger.log('All vision models failed, returning null')
  return null
}

export function getVisionModel(): string {
  return VISION_MODEL_OVERRIDE || 'auto'
}