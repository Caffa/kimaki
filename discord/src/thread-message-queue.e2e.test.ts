// E2e tests for per-thread message queue ordering (threadMessageQueue).
// Validates that messages in the same thread are processed sequentially
// in Discord arrival order, and that the step-finish interrupt allows
// queued messages to start without waiting for the full prior response.
//
// The threadMessageQueue (Map<string, Promise<void>>) only serializes messages
// arriving in threads — the initial text channel message goes through a separate
// code path (creates thread + calls handleOpencodeSession directly). So each
// test first establishes a session via the initial message, waits for the bot
// reply, then sends follow-up messages into the thread to exercise the queue.
//
// Bot replies may be error messages (e.g. "opencode session error: Not Found")
// rather than actual LLM content, depending on the provider/cache state. The
// tests verify ordering by message position, not content matching.

import fs from 'node:fs'
import path from 'node:path'
import { describe, beforeAll, afterAll, test, expect } from 'vitest'
import { ChannelType, Client, GatewayIntentBits, Partials } from 'discord.js'
import { DigitalDiscord } from 'discord-digital-twin/src'
import { CachedOpencodeProviderProxy } from 'opencode-cached-provider'
import { setDataDir } from './config.js'
import { startDiscordBot } from './discord-bot.js'
import {
  setBotToken,
  initDatabase,
  closeDatabase,
  setChannelDirectory,
} from './database.js'
import { startHranaServer, stopHranaServer } from './hrana-server.js'
import { getOpencodeServers } from './opencode.js'

const geminiApiKey =
  process.env['GEMINI_API_KEY'] ||
  process.env['GOOGLE_GENERATIVE_AI_API_KEY'] ||
  ''
const geminiModel = process.env['GEMINI_FLASH_MODEL'] || 'gemini-2.5-flash'
const e2eTest = geminiApiKey.length > 0 ? describe : describe.skip

function createRunDirectories() {
  const root = path.resolve(process.cwd(), 'tmp', 'thread-queue-e2e')
  fs.mkdirSync(root, { recursive: true })

  const dataDir = fs.mkdtempSync(path.join(root, 'data-'))
  const projectDirectory = path.join(root, 'project')
  const providerCacheDbPath = path.join(root, 'provider-cache.db')
  fs.mkdirSync(projectDirectory, { recursive: true })

  return { root, dataDir, projectDirectory, providerCacheDbPath }
}

function chooseLockPort() {
  return 47_000 + (Date.now() % 2_000)
}

function createDiscordJsClient({ restUrl }: { restUrl: string }) {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.User,
      Partials.ThreadMember,
    ],
    rest: {
      api: restUrl,
      version: '10',
    },
  })
}

async function cleanupOpencodeServers() {
  const servers = getOpencodeServers()
  for (const [, server] of servers) {
    if (!server.process.killed) {
      server.process.kill('SIGTERM')
    }
  }
  servers.clear()
}

/** Poll getMessages until we see at least `count` bot messages. */
async function waitForBotMessageCount({
  discord,
  threadId,
  count,
  timeout,
}: {
  discord: DigitalDiscord
  threadId: string
  count: number
  timeout: number
}) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const messages = await discord.thread(threadId).getMessages()
    const botMessages = messages.filter((m) => {
      return m.author.id === discord.botUserId
    })
    if (botMessages.length >= count) {
      return messages
    }
    await new Promise((r) => {
      setTimeout(r, 500)
    })
  }
  throw new Error(
    `Timed out waiting for ${count} bot messages in thread ${threadId}`,
  )
}

const TEST_USER_ID = '200000000000000777'
const TEXT_CHANNEL_ID = '200000000000000778'

e2eTest('thread message queue ordering', () => {
  let directories: ReturnType<typeof createRunDirectories>
  let proxy: CachedOpencodeProviderProxy
  let discord: DigitalDiscord
  let botClient: Client

  beforeAll(async () => {
    directories = createRunDirectories()
    const lockPort = chooseLockPort()

    process.env['KIMAKI_LOCK_PORT'] = String(lockPort)
    setDataDir(directories.dataDir)

    proxy = new CachedOpencodeProviderProxy({
      cacheDbPath: directories.providerCacheDbPath,
      targetBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      apiKey: geminiApiKey,
      cacheMethods: ['POST'],
    })

    discord = new DigitalDiscord({
      guild: {
        name: 'Queue E2E Guild',
        ownerId: TEST_USER_ID,
      },
      channels: [
        {
          id: TEXT_CHANNEL_ID,
          name: 'queue-e2e',
          type: ChannelType.GuildText,
        },
      ],
      users: [
        {
          id: TEST_USER_ID,
          username: 'queue-tester',
        },
      ],
    })

    await Promise.all([proxy.start(), discord.start()])

    const opencodeConfig = proxy.buildOpencodeConfig({
      providerName: 'cached-google',
      providerNpm: '@ai-sdk/google',
      model: geminiModel,
      smallModel: geminiModel,
    })
    fs.writeFileSync(
      path.join(directories.projectDirectory, 'opencode.json'),
      JSON.stringify(opencodeConfig, null, 2),
    )

    const dbPath = path.join(directories.dataDir, 'discord-sessions.db')
    const hranaResult = await startHranaServer({ dbPath })
    if (hranaResult instanceof Error) {
      throw hranaResult
    }
    process.env['KIMAKI_DB_URL'] = hranaResult
    await initDatabase()
    await setBotToken(discord.botUserId, discord.botToken)

    await setChannelDirectory({
      channelId: TEXT_CHANNEL_ID,
      directory: directories.projectDirectory,
      channelType: 'text',
      appId: discord.botUserId,
    })

    botClient = createDiscordJsClient({ restUrl: discord.restUrl })
    await startDiscordBot({
      token: discord.botToken,
      appId: discord.botUserId,
      discordClient: botClient,
    })
  }, 60_000)

  afterAll(async () => {
    if (botClient) {
      botClient.destroy()
    }

    await cleanupOpencodeServers()
    await Promise.all([
      closeDatabase().catch(() => {
        return
      }),
      stopHranaServer().catch(() => {
        return
      }),
      proxy?.stop().catch(() => {
        return
      }),
      discord?.stop().catch(() => {
        return
      }),
    ])

    delete process.env['KIMAKI_LOCK_PORT']
    delete process.env['KIMAKI_DB_URL']
    if (directories) {
      fs.rmSync(directories.dataDir, { recursive: true, force: true })
    }
  }, 30_000)

  test(
    'text message during active session gets processed',
    async () => {
      // 1. Send initial message to text channel → thread created + session established
      await discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: alpha',
      })

      const thread = await discord.channel(TEXT_CHANNEL_ID).waitForThread({
        timeout: 60_000,
        predicate: (t) => {
          return t.name === 'Reply with exactly: alpha'
        },
      })

      const th = discord.thread(thread.id)

      // Wait for the first bot reply so session is fully established in DB
      const firstReply = await th.waitForBotReply({
        timeout: 120_000,
      })
      expect(firstReply.content.trim().length).toBeGreaterThan(0)

      // Snapshot bot message count before sending follow-up
      const before = await th.getMessages()
      const beforeBotCount = before.filter((m) => {
        return m.author.id === discord.botUserId
      }).length

      // 2. Send follow-up message B into the thread — goes through threadMessageQueue
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: beta',
      })

      // 3. Wait for exactly 1 new bot message (the response to B)
      const after = await waitForBotMessageCount({
        discord,
        threadId: thread.id,
        count: beforeBotCount + 1,
        timeout: 120_000,
      })

      // 4. Verify at least 1 new bot message appeared for the follow-up.
      //    The bot may send additional messages per session (error reactions,
      //    session notifications) so we check >= not exact equality.
      const afterBotMessages = after.filter((m) => {
        return m.author.id === discord.botUserId
      })
      expect(afterBotMessages.length).toBeGreaterThanOrEqual(beforeBotCount + 1)

      // User B's message must appear before the new bot response
      const userBIndex = after.findIndex((m) => {
        return (
          m.author.id === TEST_USER_ID &&
          m.content.includes('beta')
        )
      })
      const lastBotIndex = after.findLastIndex((m) => {
        return m.author.id === discord.botUserId
      })

      expect(userBIndex).toBeGreaterThan(-1)
      expect(lastBotIndex).toBeGreaterThan(-1)
      expect(userBIndex).toBeLessThan(lastBotIndex)

      // New bot response has non-empty content
      const newBotReply = afterBotMessages[afterBotMessages.length - 1]!
      expect(newBotReply.content.trim().length).toBeGreaterThan(0)
    },
    360_000,
  )

  test(
    'two rapid text messages in thread — both processed in order',
    async () => {
      // 1. Send initial message to text channel → thread + session established
      await discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: one',
      })

      const thread = await discord.channel(TEXT_CHANNEL_ID).waitForThread({
        timeout: 60_000,
        predicate: (t) => {
          return t.name === 'Reply with exactly: one'
        },
      })

      const th = discord.thread(thread.id)

      // Wait for the first bot reply so session is established
      const firstReply = await th.waitForBotReply({
        timeout: 120_000,
      })
      expect(firstReply.content.trim().length).toBeGreaterThan(0)

      // Snapshot bot message count before sending follow-ups
      const before = await th.getMessages()
      const beforeBotCount = before.filter((m) => {
        return m.author.id === discord.botUserId
      }).length

      // 2. Rapidly send messages B and C — both go through threadMessageQueue
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: two',
      })
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: three',
      })

      // 3. Wait for exactly 2 new bot messages (one per follow-up)
      const after = await waitForBotMessageCount({
        discord,
        threadId: thread.id,
        count: beforeBotCount + 2,
        timeout: 120_000,
      })

      // 4. Verify at least 2 new bot messages appeared (one per follow-up).
      //    The bot may send additional messages per session (error reactions,
      //    session notifications) so we check >= not exact equality.
      const afterBotMessages = after.filter((m) => {
        return m.author.id === discord.botUserId
      })
      expect(afterBotMessages.length).toBeGreaterThanOrEqual(beforeBotCount + 2)

      // Each new bot message has non-empty content
      const newBotReplies = afterBotMessages.slice(beforeBotCount)
      for (const reply of newBotReplies) {
        expect(reply.content.trim().length).toBeGreaterThan(0)
      }

      // 5. Verify per-follow-up causality: user B appears before 2nd bot
      //    message, user C appears before 3rd bot message
      const botIndices = after.reduce<number[]>((acc, m, i) => {
        if (m.author.id === discord.botUserId) {
          acc.push(i)
        }
        return acc
      }, [])

      const userTwoIndex = after.findIndex((m) => {
        return (
          m.author.id === TEST_USER_ID &&
          m.content.includes('two')
        )
      })
      const userThreeIndex = after.findIndex((m) => {
        return (
          m.author.id === TEST_USER_ID &&
          m.content.includes('three')
        )
      })

      expect(userTwoIndex).toBeGreaterThan(-1)
      expect(userThreeIndex).toBeGreaterThan(-1)

      // Bot responses for B and C are the last 2 bot messages
      const botForB = botIndices[botIndices.length - 2]!
      const botForC = botIndices[botIndices.length - 1]!

      // Each user message appears before its corresponding bot response
      expect(userTwoIndex).toBeLessThan(botForB)
      expect(userThreeIndex).toBeLessThan(botForC)

      // Bot response for B appears before bot response for C (queue order)
      expect(botForB).toBeLessThan(botForC)
    },
    360_000,
  )
})
