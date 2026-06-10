// Plugin that adds vision descriptions to images read via the Read tool.
// When an agent reads an image file (e.g., screenshots in a folder),
// this plugin calls describeImage() to generate a text description
// and prepends it to the tool output so the model can "see" the image.

import type { Plugin } from '@opencode-ai/plugin'
import { describeImage } from './vision-description.js'

// runtime guard — tool.execute.after output type for images
function hasImageAttachments(
  value: unknown,
): value is {
  attachments: Array<{ mime?: string; url?: string }>
  output?: string
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'attachments' in value &&
    Array.isArray((value as { attachments?: unknown }).attachments)
  )
}

const visionDescriptionPlugin: Plugin = async () => {
  return {
    'tool.execute.after': async (input, output) => {
      const tool = input.tool.toLowerCase()

      // read tool: add vision descriptions to image attachments
      if (tool === 'read' && hasImageAttachments(output)) {
        const imageAttachments = output.attachments.filter((att) => {
          if (!att.mime || !att.url) return false
          const mime = att.mime.toLowerCase()
          return mime.startsWith('image/') && !mime.includes('gif')
        })

        if (imageAttachments.length === 0) return

        // Process each image and collect descriptions
        const descriptions: string[] = []
        for (const att of imageAttachments) {
          if (!att.url) continue

          // Extract base64 from data URL
          const match = att.url.match(/^data:[^;]+;base64,(.+)$/s)
          if (!match?.[1]) continue

          try {
            const buffer = Buffer.from(match[1], 'base64')
            const description = await describeImage(buffer, 'image.jpg')

            if (description) {
              descriptions.push(`**Image Analysis:**\n${description}`)
            }
          } catch {
            // Silently fail - vision description is optional
          }
        }

        // Prepend descriptions to the output string if we have any
        if (descriptions.length > 0 && typeof output.output === 'string') {
          const visionSection = `<image_descriptions>\n${descriptions.join('\n\n')}\n</image_descriptions>\n\n`
          output.output = visionSection + output.output
        }
      }
    },
  }
}

export { visionDescriptionPlugin }