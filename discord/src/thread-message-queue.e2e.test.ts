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

  test(
    'step-finish interrupt aborts running session when new message queues',
    async () => {
      // Tests the path at session-handler.ts:1611 where pendingThreadInterrupts.has(thread.id)
      // is checked on step-finish. When a new message queues behind a running session,
      // signalThreadInterrupt is called (discord-bot.ts:462). At the next step-finish event,
      // the running session sees the pending interrupt and aborts with reason=next-step,
      // letting the queued message start sooner.
      //
      // NOTE: streamChunkDelayMs only affects cache HITS. On the first run (empty cache)
      // all requests are cache misses and stream at upstream Gemini speed. We send C
      // quickly after B (200ms) so the interrupt fires while B is still being processed
      // regardless of cache state. On subsequent runs, cached responses with the delay
      // make B stream even slower, making the interrupt even more reliable.

      // 1. Fast setup: establish session
      proxy.setStreamChunkDelayMs(0)
      await discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: delta',
      })

      const thread = await discord.channel(TEXT_CHANNEL_ID).waitForThread({
        timeout: 60_000,
        predicate: (t) => {
          return t.name === 'Reply with exactly: delta'
        },
      })

      const th = discord.thread(thread.id)
      const firstReply = await th.waitForBotReply({ timeout: 120_000 })
      expect(firstReply.content.trim().length).toBeGreaterThan(0)

      const before = await th.getMessages()
      const beforeBotCount = before.filter((m) => {
        return m.author.id === discord.botUserId
      }).length

      // 2. Send B, then quickly send C to trigger the interrupt.
      //    200ms gap gives B time to enter the queue and start processing.
      //    signalThreadInterrupt sets pendingThreadInterrupts + 2s timeout.
      //    If B hits step-finish first → reason=next-step. Otherwise → reason=next-step-timeout.
      proxy.setStreamChunkDelayMs(500)
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: echo',
      })
      await new Promise((r) => {
        setTimeout(r, 200)
      })
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: foxtrot',
      })

      // 3. Poll until foxtrot's user message has a bot reply after it.
      //    waitForBotMessageCount alone isn't enough — error messages from the
      //    interrupted session can satisfy the count before foxtrot gets its reply.
      proxy.setStreamChunkDelayMs(0)
      const start = Date.now()
      let after = await discord.thread(thread.id).getMessages()
      while (Date.now() - start < 120_000) {
        after = await discord.thread(thread.id).getMessages()
        const foxtrotIdx = after.findIndex((m) => {
          return m.author.id === TEST_USER_ID && m.content.includes('foxtrot')
        })
        const hasBotAfterFoxtrot =
          foxtrotIdx >= 0 &&
          after.some((m, i) => {
            return i > foxtrotIdx && m.author.id === discord.botUserId
          })
        if (hasBotAfterFoxtrot) {
          break
        }
        await new Promise((r) => {
          setTimeout(r, 500)
        })
      }

      // 4. Both B and C got bot responses
      const afterBotMessages = after.filter((m) => {
        return m.author.id === discord.botUserId
      })
      expect(afterBotMessages.length).toBeGreaterThanOrEqual(beforeBotCount + 2)

      const userEchoIndex = after.findIndex((m) => {
        return m.author.id === TEST_USER_ID && m.content.includes('echo')
      })
      const userFoxtrotIndex = after.findIndex((m) => {
        return m.author.id === TEST_USER_ID && m.content.includes('foxtrot')
      })
      expect(userEchoIndex).toBeGreaterThan(-1)
      expect(userFoxtrotIndex).toBeGreaterThan(-1)

      // Foxtrot's bot reply appears after the foxtrot user message
      const botAfterFoxtrot = after.findIndex((m, i) => {
        return i > userFoxtrotIndex && m.author.id === discord.botUserId
      })
      expect(botAfterFoxtrot).toBeGreaterThan(userFoxtrotIndex)
    },
    360_000,
  )

  test(
    '2s force-abort timeout fires when no step-finish arrives',
    async () => {
      // Tests the setTimeout at session-handler.ts:145 that fires after
      // STEP_ABORT_TIMEOUT_MS (2000ms). When streamChunkDelayMs is very high,
      // the session stays mid-stream without emitting step-finish. The 2s timeout
      // fires and force-aborts with reason=next-step-timeout.

      // 1. Fast setup: establish session + prime the cache
      proxy.setStreamChunkDelayMs(0)
      await discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: golf',
      })

      const thread = await discord.channel(TEXT_CHANNEL_ID).waitForThread({
        timeout: 60_000,
        predicate: (t) => {
          return t.name === 'Reply with exactly: golf'
        },
      })

      const th = discord.thread(thread.id)
      const firstReply = await th.waitForBotReply({ timeout: 120_000 })
      expect(firstReply.content.trim().length).toBeGreaterThan(0)

      const before = await th.getMessages()
      const beforeBotCount = before.filter((m) => {
        return m.author.id === discord.botUserId
      }).length

      // 2. Very slow stream: 5s per chunk so no step-finish within the 2s timeout
      proxy.setStreamChunkDelayMs(5000)
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: hotel',
      })

      // 3. Wait briefly for B to start, then send C to trigger the interrupt timeout
      await new Promise((r) => {
        setTimeout(r, 500)
      })
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: india',
      })

      // 4. The 2s timeout should force-abort B. C then gets processed.
      //    Poll until india's user message has a bot reply after it.
      proxy.setStreamChunkDelayMs(0)
      const start2 = Date.now()
      let after = await discord.thread(thread.id).getMessages()
      while (Date.now() - start2 < 120_000) {
        after = await discord.thread(thread.id).getMessages()
        const indiaIdx = after.findIndex((m) => {
          return m.author.id === TEST_USER_ID && m.content.includes('india')
        })
        const hasBotAfterIndia =
          indiaIdx >= 0 &&
          after.some((m, i) => {
            return i > indiaIdx && m.author.id === discord.botUserId
          })
        if (hasBotAfterIndia) {
          break
        }
        await new Promise((r) => {
          setTimeout(r, 500)
        })
      }

      // C's user message appears before its bot response.
      // The interrupted hotel session may or may not produce a visible bot message
      // (depends on timing), so we only assert on india's reply existence.
      const userIndiaIndex = after.findIndex((m) => {
        return m.author.id === TEST_USER_ID && m.content.includes('india')
      })
      expect(userIndiaIndex).toBeGreaterThan(-1)
      const botAfterIndia = after.findIndex((m, i) => {
        return i > userIndiaIndex && m.author.id === discord.botUserId
      })
      expect(botAfterIndia).toBeGreaterThan(userIndiaIndex)
    },
    360_000,
  )

  test(
    'queue drains correctly after interrupted session',
    async () => {
      // Verifies the queue doesn't get stuck after multiple interrupts.
      // Rapidly sends B, C, D — each interrupts the previous. Then after all
      // complete, sends E to prove the queue is clean and accepting new work.

      // 1. Fast setup: establish session + prime the cache
      proxy.setStreamChunkDelayMs(0)
      await discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: juliet',
      })

      const thread = await discord.channel(TEXT_CHANNEL_ID).waitForThread({
        timeout: 60_000,
        predicate: (t) => {
          return t.name === 'Reply with exactly: juliet'
        },
      })

      const th = discord.thread(thread.id)
      const firstReply = await th.waitForBotReply({ timeout: 120_000 })
      expect(firstReply.content.trim().length).toBeGreaterThan(0)

      const before = await th.getMessages()
      const beforeBotCount = before.filter((m) => {
        return m.author.id === discord.botUserId
      }).length

      // 2. Moderate delay so each session stays active long enough to be interrupted
      proxy.setStreamChunkDelayMs(500)

      // Rapidly send B, C, D — each queues behind the previous and triggers interrupt
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: kilo',
      })
      await new Promise((r) => {
        setTimeout(r, 300)
      })
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: lima',
      })
      await new Promise((r) => {
        setTimeout(r, 300)
      })
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: mike',
      })

      // 3. Wait for all 3 follow-ups to get bot responses
      const afterBurst = await waitForBotMessageCount({
        discord,
        threadId: thread.id,
        count: beforeBotCount + 3,
        timeout: 120_000,
      })

      const burstBotMessages = afterBurst.filter((m) => {
        return m.author.id === discord.botUserId
      })
      expect(burstBotMessages.length).toBeGreaterThanOrEqual(beforeBotCount + 3)

      // 4. Queue should be clean — send E and verify it also gets processed
      proxy.setStreamChunkDelayMs(0)
      const burstBotCount = burstBotMessages.length

      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: november',
      })

      const afterE = await waitForBotMessageCount({
        discord,
        threadId: thread.id,
        count: burstBotCount + 1,
        timeout: 120_000,
      })

      const finalBotMessages = afterE.filter((m) => {
        return m.author.id === discord.botUserId
      })
      expect(finalBotMessages.length).toBeGreaterThanOrEqual(burstBotCount + 1)

      // E's user message appears before the final bot response
      const userNovemberIndex = afterE.findIndex((m) => {
        return m.author.id === TEST_USER_ID && m.content.includes('november')
      })
      expect(userNovemberIndex).toBeGreaterThan(-1)
      const lastBotIndex = afterE.findLastIndex((m) => {
        return m.author.id === discord.botUserId
      })
      expect(userNovemberIndex).toBeLessThan(lastBotIndex)
    },
    360_000,
  )

  test(
    'slow tool call (sleep) gets aborted when new message queues',
    async () => {
      // Tests that long-running tool calls get properly aborted when a new
      // message queues behind them. During tool execution no step-finish events
      // arrive, so the 2s STEP_ABORT_TIMEOUT_MS fires (reason=next-step-timeout).
      // The queue then processes the next message normally.

      // 1. Fast setup: establish session
      proxy.setStreamChunkDelayMs(0)
      await discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: oscar',
      })

      const thread = await discord.channel(TEXT_CHANNEL_ID).waitForThread({
        timeout: 60_000,
        predicate: (t) => {
          return t.name === 'Reply with exactly: oscar'
        },
      })

      const th = discord.thread(thread.id)
      const firstReply = await th.waitForBotReply({ timeout: 120_000 })
      expect(firstReply.content.trim().length).toBeGreaterThan(0)

      const before = await th.getMessages()
      const beforeBotCount = before.filter((m) => {
        return m.author.id === discord.botUserId
      }).length

      // 2. Ask the model to run a long sleep command
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Run the command `sleep 400` in bash. Do not explain, just run it.',
      })

      // 3. Brief wait so the bot picks up the sleep message and starts processing.
      //    The interrupt fires either at step-finish (reason=next-step) or after
      //    the 2s timeout (reason=next-step-timeout) — both abort the session.
      await new Promise((r) => {
        setTimeout(r, 1000)
      })

      // 4. Send interrupt message while sleep is still running
      await th.user(TEST_USER_ID).sendMessage({
        content: 'Reply with exactly: papa',
      })

      // 5. The 2s force-abort timeout fires (no step-finish during tool execution),
      //    kills the sleep session, and the queue processes "papa".
      const after = await waitForBotMessageCount({
        discord,
        threadId: thread.id,
        count: beforeBotCount + 2,
        timeout: 120_000,
      })

      const afterBotMessages = after.filter((m) => {
        return m.author.id === discord.botUserId
      })
      expect(afterBotMessages.length).toBeGreaterThanOrEqual(beforeBotCount + 2)

      // "papa" user message appears before the last bot response
      const userPapaIndex = after.findIndex((m) => {
        return m.author.id === TEST_USER_ID && m.content.includes('papa')
      })
      expect(userPapaIndex).toBeGreaterThan(-1)
      const lastBotIndex = after.findLastIndex((m) => {
        return m.author.id === discord.botUserId
      })
      expect(userPapaIndex).toBeLessThan(lastBotIndex)
    },
    360_000,
  )
})
