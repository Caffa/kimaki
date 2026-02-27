import { describe, expect, test } from 'vitest'
import { splitMarkdownForDiscord } from './discord-utils.js'

describe('splitMarkdownForDiscord', () => {
  test('never returns chunks over the max length with code fences', () => {
    const maxLength = 2000
    const header = '## Summary of Current Architecture\n\n'
    const codeFenceStart = '```\n'
    const codeFenceEnd = '\n```\n'
    const codeLine = 'x'.repeat(180)
    const codeBlock = Array.from({ length: 20 })
      .map(() => codeLine)
      .join('\n')
    const markdown = `${header}${codeFenceStart}${codeBlock}${codeFenceEnd}`

    const chunks = splitMarkdownForDiscord({ content: markdown, maxLength })

    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(maxLength)
    }
  })

  // Without the lineLength fix for opening fences on non-empty chunks, the opening
  // fence text "```\n" gets appended without being counted in the overflow check.
  // When the chunk is later flushed with a closing fence, it exceeds maxLength.
  test('opening fence on non-empty chunk is counted in overflow check', () => {
    const maxLength = 60
    // 55 chars of text + paragraph break, then a code block.
    // The text fills the chunk to ~57 chars. The opening fence "```\n" (4 chars)
    // would push to 61 if not counted, then flushing adds "```\n" (4 more) = 65.
    const markdown = 'a'.repeat(55) + '\n\n```\nshort code\n```\n'

    const chunks = splitMarkdownForDiscord({ content: markdown, maxLength })

    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(maxLength)
    }
  })

  test('list item code block keeps newline before fence when splitting', () => {
    const content = `- File: playwriter/src/aria-snapshot.ts
- Add helper function (~line 477, after isTextRole):
  \`\`\`ts
  function isSubstringOfAny(needle: string, haystack: Set<string>): boolean {
    for (const str of haystack) {
      if (str.includes(needle)) {
        return true
      }
    }
    return false
  }
  \`\`\`
`

    const result = splitMarkdownForDiscord({ content, maxLength: 80 })
    expect(result).toMatchInlineSnapshot(`
      [
        "- File: playwriter/src/aria-snapshot.ts
      ",
        "- Add helper function (~line 477, after isTextRole):
        \`\`\`ts
      ",
        "  function isSubstringOfAny(needle: string, haystack: Set<string>): boolean {
      ",
        "    for (const str of haystack) {
            if (str.includes(needle)) {
      ",
        "        return true
            }
          }
          return false
        }
        \`\`\`
      ",
      ]
    `)
  })
})
