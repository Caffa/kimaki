// Markdown parsing, serialization, and section formatting for forum sync.
// Handles frontmatter extraction, message section building, and
// conversion between Discord messages and markdown format.

import yaml from 'js-yaml'
import * as errore from 'errore'
import type { Message } from 'discord.js'
import {
  ForumFrontmatterParseError,
  type ForumMarkdownFrontmatter,
  type ForumMessageSection,
  type ParsedMarkdownFile,
} from './types.js'

export function toStringArray({ value }: { value: unknown }): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function getStringValue({ value }: { value: unknown }): string {
  if (typeof value !== 'string') return ''
  return value
}

export function parseFrontmatter({
  markdown,
}: {
  markdown: string
}): ParsedMarkdownFile {
  if (!markdown.startsWith('---\n')) {
    return { frontmatter: {}, body: markdown.trim() }
  }

  const end = markdown.indexOf('\n---\n', 4)
  if (end === -1) {
    return { frontmatter: {}, body: markdown.trim() }
  }

  const rawFrontmatter = markdown.slice(4, end)
  const body = markdown.slice(end + 5).trim()

  const parsed = errore.try({
    try: () => yaml.load(rawFrontmatter),
    catch: (cause) =>
      new ForumFrontmatterParseError({ reason: 'yaml parse failed', cause }),
  })

  if (parsed instanceof Error || !parsed || typeof parsed !== 'object') {
    return { frontmatter: {}, body }
  }

  return { frontmatter: parsed as Record<string, unknown>, body }
}

export function stringifyFrontmatter({
  frontmatter,
  body,
}: {
  frontmatter: ForumMarkdownFrontmatter
  body: string
}) {
  const yamlText = yaml
    .dump(frontmatter, {
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
    })
    .trim()
  return `---\n${yamlText}\n---\n\n${body.trim()}\n`
}

export function splitSections({ body }: { body: string }) {
  return body
    .split(/\r?\n---\r?\n/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
}

export function extractStarterContent({ body }: { body: string }) {
  const sections = splitSections({ body })
  const firstSection = sections[0] || ''
  const match = firstSection.match(
    /^\*\*.+?\*\* \(\d+\) - .+?(?: \(edited .+?\))?\r?\n\r?\n([\s\S]*)$/,
  )
  if (!match) return body.trim()
  return (match[1] || '').trim()
}

export function buildMessageSections({
  messages,
}: {
  messages: Message[]
}): ForumMessageSection[] {
  return messages.map((message) => {
    const attachmentLines = Array.from(message.attachments.values()).map(
      (attachment) => `Attachment: ${attachment.url}`,
    )

    const contentParts: string[] = []
    const trimmedContent = message.content.trim()
    if (trimmedContent) {
      contentParts.push(trimmedContent)
    }
    if (attachmentLines.length > 0) {
      contentParts.push(attachmentLines.join('\n'))
    }

    const content =
      contentParts.length > 0
        ? contentParts.join('\n\n')
        : '_(no text content)_'

    return {
      messageId: message.id,
      authorName: message.author.username,
      authorId: message.author.id,
      createdAt: new Date(message.createdTimestamp).toISOString(),
      editedAt: message.editedTimestamp
        ? new Date(message.editedTimestamp).toISOString()
        : null,
      content,
    } satisfies ForumMessageSection
  })
}

export function formatMessageSection({
  section,
}: {
  section: ForumMessageSection
}) {
  const editedSuffix = section.editedAt ? ` (edited ${section.editedAt})` : ''
  return `**${section.authorName}** (${section.authorId}) - ${section.createdAt}${editedSuffix}\n\n${section.content}`
}
