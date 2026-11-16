import { expect, test } from 'vitest'
import { formatEcho, formatEchoPlain } from './queue.ts'
import { markdownPayloads } from './markdown/components.ts'

test('echo puts block markdown on the line below the prefix', () => {
  const texts = ['plain text', '# Title', '> quote', '- item', '1. step', '```ts\ncode\n```', '---', '| a | b |', '-# small', 'use #hashtag', '5 > 3', '**bold** start']
  expect(texts.map((text) => formatEcho({ username: 'CLI', text }))).toMatchInlineSnapshot(`
    [
      "-# » **CLI:** plain text",
      "-# » **CLI:**
    -# **Title**",
      "-# » **CLI:**
    -# > quote",
      "-# » **CLI:**
    -# - item",
      "-# » **CLI:**
    -# 1. step",
      "-# » **CLI:**
    \`\`\`ts
    code
    \`\`\`",
      "-# » **CLI:**
    -# ---",
      "-# » **CLI:**
    -# | a | b |",
      "-# » **CLI:**
    -# small",
      "-# » **CLI:** use #hashtag",
      "-# » **CLI:** 5 > 3",
      "-# » **CLI:** **bold** start",
    ]
  `)
})

test('echo is subtext, code blocks stay as they are', () => {
  const text = '## Plan\n\n- read `queue.ts`\n- run tests\n\n```ts\nconst a = 1\n\nconst b = 2\n```\n-# already small\nlast line'
  expect('\n' + formatEcho({ username: 'CLI', text })).toMatchInlineSnapshot(`
    "
    -# » **CLI:**
    -# **Plan**
    -# - read \`queue.ts\`
    -# - run tests
    \`\`\`ts
    const a = 1

    const b = 2
    \`\`\`
    -# already small
    -# last line"
  `)
})

test('long subtext echo splits into messages that keep subtext on every line', () => {
  const text = Array.from({ length: 120 }, (_, index) => `line ${index} of a long prompt sent from the CLI`).join('\n')
  const payloads = markdownPayloads(formatEcho({ username: 'CLI', text }))
  const lines = payloads.flatMap((payload) => String(Reflect.get(payload, 'content') ?? 'not text').split('\n'))
  expect(payloads.length).toBeGreaterThan(1)
  expect(lines.filter((line) => line !== '' && !line.startsWith('-# '))).toEqual([])
})

test('long plain echo splits like model markdown and keeps attribution in payload 0', () => {
  const text = Array.from({ length: 120 }, (_, index) => `line ${index} of a long prompt sent from the CLI`).join('\n')
  const plain = formatEchoPlain({ username: 'CLI', text })
  expect(plain.length).toBeGreaterThan(2000)
  const payloads = markdownPayloads(plain)
  expect(payloads.length).toBeGreaterThan(1)
  const first = String(Reflect.get(payloads[0], 'content') ?? '')
  expect(first.startsWith('» **CLI:**')).toBe(true)
  expect(plain.startsWith('-# ')).toBe(false)
})

test('echo plain omits subtext while keeping the same echo line', () => {
  const text = '# Title\n\nplain line'
  const subtext = formatEcho({ username: 'CLI', text })
  const plain = formatEchoPlain({ username: 'CLI', text })
  expect(subtext).toContain('-# » **CLI:**')
  expect(plain).not.toContain('-# ')
  expect(plain).toContain('» **CLI:**')
  expect(plain).toContain('# Title')
  const subtextPayloads = markdownPayloads(subtext)
  const plainPayloads = markdownPayloads(plain)
  const subtextLines = subtextPayloads.flatMap((payload) => String(Reflect.get(payload, 'content') ?? '').split('\n'))
  const plainLines = plainPayloads.flatMap((payload) => String(Reflect.get(payload, 'content') ?? '').split('\n'))
  expect(subtextLines.filter((line) => line !== '' && !line.startsWith('-# '))).toEqual([])
  expect(plainLines.some((line) => line.startsWith('-# '))).toBe(false)
})
