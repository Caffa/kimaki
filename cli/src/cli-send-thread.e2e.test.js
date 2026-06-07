"use strict";
// E2e test for `kimaki send --channel` flow.
// Reproduces the race condition where the bot's MessageCreate GuildText handler
// tries to call startThread() on the same message that the CLI already created
// a thread for via REST, causing DiscordAPIError[160004].
//
// The test simulates the exact flow: bot posts a starter message with a
// `start: true` embed marker, then creates a thread on that message via REST.
// The ThreadCreate handler should pick it up and start a session. The
// MessageCreate handler must NOT try to startThread() on the same message.
//
// Uses opencode-deterministic-provider (no real LLM calls).
// Poll timeouts: 4s max, 100ms interval.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var vitest_1 = require("vitest");
var discord_js_1 = require("discord.js");
var src_1 = require("discord-digital-twin/src");
var opencode_deterministic_provider_1 = require("opencode-deterministic-provider");
var config_js_1 = require("./config.js");
var store_js_1 = require("./store.js");
var discord_bot_js_1 = require("./discord-bot.js");
var database_js_1 = require("./database.js");
var hrana_server_js_1 = require("./hrana-server.js");
var opencode_js_1 = require("./opencode.js");
var test_utils_js_1 = require("./test-utils.js");
var yaml_1 = require("yaml");
var TEST_USER_ID = '200000000000000830';
var TEXT_CHANNEL_ID = '200000000000000831';
var BOT_USER_ID = '200000000000000832';
var EMPTY_CONTENT_CHANNEL_ID = '200000000000000833';
var MENTION_MODE_EMPTY_CONTENT_CHANNEL_ID = '200000000000000834';
var THREAD_EMPTY_CONTENT_CHANNEL_ID = '200000000000000835';
function createRunDirectories() {
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'cli-send-thread-e2e');
    node_fs_1.default.mkdirSync(root, { recursive: true });
    var dataDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(root, 'data-'));
    var projectDirectory = node_path_1.default.join(root, 'project');
    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
    (0, test_utils_js_1.initTestGitRepo)(projectDirectory);
    return { root: root, dataDir: dataDir, projectDirectory: projectDirectory };
}
function createDiscordJsClient(_a) {
    var restUrl = _a.restUrl;
    return new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.MessageContent,
            discord_js_1.GatewayIntentBits.GuildVoiceStates,
        ],
        partials: [
            discord_js_1.Partials.Channel,
            discord_js_1.Partials.Message,
            discord_js_1.Partials.User,
            discord_js_1.Partials.ThreadMember,
        ],
        rest: {
            api: restUrl,
            version: '10',
        },
    });
}
function createDeterministicMatchers() {
    var userReplyMatcher = {
        id: 'user-reply',
        priority: 10,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'Reply with exactly:',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'default-reply' },
                { type: 'text-delta', id: 'default-reply', delta: 'ok' },
                { type: 'text-end', id: 'default-reply' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 100, 0, 0, 0],
        },
    };
    // Catch-all: any user message gets a reply
    var catchAll = {
        id: 'catch-all',
        priority: 0,
        when: { lastMessageRole: 'user' },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'catch' },
                { type: 'text-delta', id: 'catch', delta: 'caught-by-model' },
                { type: 'text-end', id: 'catch' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    return [userReplyMatcher, catchAll];
}
(0, vitest_1.describe)('kimaki send --channel thread creation', function () {
    var directories;
    var discord;
    var botClient;
    var previousDefaultVerbosity = null;
    var testStartTime = Date.now();
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var lockPort, digitalDiscordDbPath, providerNpm, opencodeConfig, dbPath, hranaResult, warmup;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testStartTime = Date.now();
                    directories = createRunDirectories();
                    lockPort = (0, test_utils_js_1.chooseLockPort)({ key: 'cli-send-thread-e2e' });
                    process.env['KIMAKI_LOCK_PORT'] = String(lockPort);
                    (0, config_js_1.setDataDir)(directories.dataDir);
                    previousDefaultVerbosity = store_js_1.store.getState().defaultVerbosity;
                    store_js_1.store.setState({ defaultVerbosity: 'tools_and_text' });
                    digitalDiscordDbPath = node_path_1.default.join(directories.dataDir, 'digital-discord.db');
                    discord = new src_1.DigitalDiscord({
                        botUser: { id: BOT_USER_ID },
                        guild: {
                            name: 'CLI Send E2E Guild',
                            ownerId: TEST_USER_ID,
                        },
                        channels: [
                            {
                                id: TEXT_CHANNEL_ID,
                                name: 'cli-send-e2e',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                            {
                                id: EMPTY_CONTENT_CHANNEL_ID,
                                name: 'empty-content-e2e',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                            {
                                id: MENTION_MODE_EMPTY_CONTENT_CHANNEL_ID,
                                name: 'mention-mode-empty-content-e2e',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                            {
                                id: THREAD_EMPTY_CONTENT_CHANNEL_ID,
                                name: 'thread-empty-content-e2e',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                        ],
                        users: [
                            {
                                id: TEST_USER_ID,
                                username: 'cli-send-tester',
                            },
                        ],
                        dbUrl: "file:".concat(digitalDiscordDbPath),
                    });
                    return [4 /*yield*/, discord.start()];
                case 1:
                    _a.sent();
                    providerNpm = node_url_1.default
                        .pathToFileURL(node_path_1.default.resolve(process.cwd(), '..', 'opencode-deterministic-provider', 'src', 'index.ts'))
                        .toString();
                    opencodeConfig = (0, opencode_deterministic_provider_1.buildDeterministicOpencodeConfig)({
                        providerName: 'deterministic-provider',
                        providerNpm: providerNpm,
                        model: 'deterministic-v2',
                        smallModel: 'deterministic-v2',
                        settings: {
                            strict: false,
                            matchers: createDeterministicMatchers(),
                        },
                    });
                    node_fs_1.default.writeFileSync(node_path_1.default.join(directories.projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                    dbPath = node_path_1.default.join(directories.dataDir, 'discord-sessions.db');
                    return [4 /*yield*/, (0, hrana_server_js_1.startHranaServer)({ dbPath: dbPath })];
                case 2:
                    hranaResult = _a.sent();
                    if (hranaResult instanceof Error) {
                        throw hranaResult;
                    }
                    process.env['KIMAKI_DB_URL'] = hranaResult;
                    return [4 /*yield*/, (0, database_js_1.initDatabase)()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setBotToken)(discord.botUserId, discord.botToken)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: TEXT_CHANNEL_ID,
                            directory: directories.projectDirectory,
                            channelType: 'text',
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: EMPTY_CONTENT_CHANNEL_ID,
                            directory: directories.projectDirectory,
                            channelType: 'text',
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: MENTION_MODE_EMPTY_CONTENT_CHANNEL_ID,
                            directory: directories.projectDirectory,
                            channelType: 'text',
                        })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: THREAD_EMPTY_CONTENT_CHANNEL_ID,
                            directory: directories.projectDirectory,
                            channelType: 'text',
                        })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelVerbosity)(TEXT_CHANNEL_ID, 'tools_and_text')];
                case 9:
                    _a.sent();
                    botClient = createDiscordJsClient({ restUrl: discord.restUrl });
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                            token: discord.botToken,
                            appId: discord.botUserId,
                            discordClient: botClient,
                        })
                        // Pre-warm the opencode server
                    ];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directories.projectDirectory)];
                case 11:
                    warmup = _a.sent();
                    if (warmup instanceof Error) {
                        throw warmup;
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!directories) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, test_utils_js_1.cleanupTestSessions)({
                            projectDirectory: directories.projectDirectory,
                            testStartTime: testStartTime,
                        })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (botClient) {
                        void botClient.destroy();
                    }
                    return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            (0, database_js_1.closeDatabase)().catch(function () {
                                return;
                            }),
                            (0, hrana_server_js_1.stopHranaServer)().catch(function () {
                                return;
                            }),
                            discord === null || discord === void 0 ? void 0 : discord.stop().catch(function () {
                                return;
                            }),
                        ])];
                case 4:
                    _a.sent();
                    delete process.env['KIMAKI_LOCK_PORT'];
                    delete process.env['KIMAKI_DB_URL'];
                    if (previousDefaultVerbosity) {
                        store_js_1.store.setState({ defaultVerbosity: previousDefaultVerbosity });
                    }
                    if (directories) {
                        node_fs_1.default.rmSync(directories.dataDir, { recursive: true, force: true });
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 5000);
    (0, vitest_1.test)('empty project-channel message asks user to mention the bot instead of creating a thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, threads;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, discord
                        .channel(EMPTY_CONTENT_CHANNEL_ID)
                        .user(TEST_USER_ID)
                        .sendMessage({
                        content: '',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: EMPTY_CONTENT_CHANNEL_ID,
                            userId: discord.botUserId,
                            text: 'Mention me and send it again',
                            timeout: 4000,
                        })];
                case 2:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(EMPTY_CONTENT_CHANNEL_ID).text()];
                case 3:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (cli-send-tester)\n        --- from: assistant (TestBot)\n        I can see you sent a message, but Discord did not include its text.\n        Mention me and send it again, like `@Kimaki fix the failing test`, so I can read it.\n        To avoid this reminder, start Kimaki with `--mention-mode` so it only reacts to mentioned messages.\"\n      ");
                    return [4 /*yield*/, discord.channel(EMPTY_CONTENT_CHANNEL_ID).getThreads()];
                case 4:
                    threads = _b.sent();
                    (0, vitest_1.expect)(threads).toHaveLength(0);
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('mention mode silently ignores empty project-channel messages without warning', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, threads;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.setChannelMentionMode)(MENTION_MODE_EMPTY_CONTENT_CHANNEL_ID, true)];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord
                            .channel(MENTION_MODE_EMPTY_CONTENT_CHANNEL_ID)
                            .user(TEST_USER_ID)
                            .sendMessage({
                            content: '',
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 300);
                        })];
                case 3:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(MENTION_MODE_EMPTY_CONTENT_CHANNEL_ID).text()];
                case 4:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\"--- from: user (cli-send-tester)\"");
                    return [4 /*yield*/, discord
                            .channel(MENTION_MODE_EMPTY_CONTENT_CHANNEL_ID)
                            .getThreads()];
                case 5:
                    threads = _b.sent();
                    (0, vitest_1.expect)(threads).toHaveLength(0);
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('empty existing-thread message asks user to mention the bot instead of enqueueing a prompt', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, discord
                        .channel(THREAD_EMPTY_CONTENT_CHANNEL_ID)
                        .user(TEST_USER_ID)
                        .sendMessage({
                        content: 'thread empty content seed',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord
                            .channel(THREAD_EMPTY_CONTENT_CHANNEL_ID)
                            .waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'thread empty content seed';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'caught-by-model',
                            afterAuthorId: discord.botUserId,
                        })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, discord.thread(thread.id).user(TEST_USER_ID).sendMessage({
                            content: '',
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: discord.botUserId,
                            text: 'Mention me and send it again',
                            timeout: 4000,
                        })];
                case 5:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 6:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (cli-send-tester)\n        thread empty content seed\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 caught-by-model\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (cli-send-tester)\n        --- from: assistant (TestBot)\n        I can see you sent a message, but Discord did not include its text.\n        Mention me and send it again, like `@Kimaki fix the failing test`, so I can read it.\n        To avoid this reminder, start Kimaki with `--mention-mode` so it only reacts to mentioned messages.\"\n      ");
                    return [2 /*return*/];
            }
        });
    }); }, 12000);
    (0, vitest_1.test)('kimaki send --prompt "/hello-test-cmd" falls through as text when registeredUserCommands is empty (repro #97)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var prevCommands, prompt_1, embedMarker, starterMessage_1, threadData, messages, botReplies, allContent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prevCommands = store_js_1.store.getState().registeredUserCommands;
                    // Ensure store is empty — this is the bug condition
                    store_js_1.store.setState({ registeredUserCommands: [] });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 8, 9]);
                    prompt_1 = '/hello-test-cmd';
                    embedMarker = {
                        start: true,
                        username: 'cli-send-tester',
                        userId: TEST_USER_ID,
                    };
                    return [4 /*yield*/, botClient.rest.post(discord_js_1.Routes.channelMessages(TEXT_CHANNEL_ID), {
                            body: {
                                content: prompt_1,
                                embeds: [
                                    { color: 0x2b2d31, footer: { text: yaml_1.default.stringify(embedMarker) } },
                                ],
                            },
                        })];
                case 2:
                    starterMessage_1 = (_a.sent());
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 200);
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, botClient.rest.post(discord_js_1.Routes.threads(TEXT_CHANNEL_ID, starterMessage_1.id), {
                            body: { name: 'cmd-detection-test', auto_archive_duration: 1440 },
                        })];
                case 4:
                    threadData = (_a.sent());
                    return [4 /*yield*/, botClient.rest.put(discord_js_1.Routes.threadMembers(threadData.id, TEST_USER_ID))
                        // Wait for the command detection result AFTER the starter message.
                        // New-session model banners are also bot replies, so waiting for any
                        // message can return before the command result is visible.
                    ];
                case 5:
                    _a.sent();
                    // Wait for the command detection result AFTER the starter message.
                    // New-session model banners are also bot replies, so waiting for any
                    // message can return before the command result is visible.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: threadData.id,
                            userId: discord.botUserId,
                            text: 'Command not found: "hello-test"',
                            afterMessageId: starterMessage_1.id,
                            timeout: 4000,
                        })];
                case 6:
                    // Wait for the command detection result AFTER the starter message.
                    // New-session model banners are also bot replies, so waiting for any
                    // message can return before the command result is visible.
                    _a.sent();
                    return [4 /*yield*/, discord.thread(threadData.id).getMessages()];
                case 7:
                    messages = _a.sent();
                    botReplies = messages.filter(function (m) {
                        return m.author.id === discord.botUserId && m.id !== starterMessage_1.id;
                    });
                    allContent = botReplies.map(function (m) {
                        return m.content;
                    });
                    (0, vitest_1.expect)(allContent.some(function (content) {
                        return content.includes('Command not found: "hello-test"');
                    })).toBe(true);
                    return [3 /*break*/, 9];
                case 8:
                    store_js_1.store.setState({ registeredUserCommands: prevCommands });
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('bot-posted starter message with start marker creates thread without DiscordAPIError[160004]', function () { return __awaiter(void 0, void 0, void 0, function () {
        var prompt, embedMarker, starterMessage, threadsBeforeCliCreate, preExistingThread, threadData, messages, errorMessages, botReplies;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prompt = 'Reply with exactly: cli-send-test';
                    embedMarker = {
                        start: true,
                        username: 'cli-send-tester',
                        userId: TEST_USER_ID,
                    };
                    return [4 /*yield*/, botClient.rest.post(discord_js_1.Routes.channelMessages(TEXT_CHANNEL_ID), {
                            body: {
                                content: prompt,
                                embeds: [
                                    { color: 0x2b2d31, footer: { text: yaml_1.default.stringify(embedMarker) } },
                                ],
                            },
                        })];
                case 1:
                    starterMessage = (_a.sent());
                    // Give the bot's MessageCreate handler time to process the starter
                    // message. Without the fix, the handler enters the GuildText path and
                    // tries to startThread() on this message, which races the CLI's thread
                    // creation below. The digital twin enforces Discord's 160004 uniqueness
                    // constraint, so the second startThread call fails.
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 200);
                        })
                        // Verify the MessageCreate handler did NOT create a thread on this
                        // message. If the handler ignored the start marker (correct behavior),
                        // no thread exists yet and the REST call below succeeds.
                    ];
                case 2:
                    // Give the bot's MessageCreate handler time to process the starter
                    // message. Without the fix, the handler enters the GuildText path and
                    // tries to startThread() on this message, which races the CLI's thread
                    // creation below. The digital twin enforces Discord's 160004 uniqueness
                    // constraint, so the second startThread call fails.
                    _a.sent();
                    return [4 /*yield*/, discord
                            .channel(TEXT_CHANNEL_ID)
                            .getThreads()];
                case 3:
                    threadsBeforeCliCreate = _a.sent();
                    preExistingThread = threadsBeforeCliCreate.find(function (t) {
                        var _a;
                        return (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('cli-send-test');
                    });
                    // This is the core regression assertion: without the fix in discord-bot.ts
                    // (skipping start markers in the GuildText handler), the MessageCreate
                    // handler would create a thread here, and the CLI's REST call below would
                    // fail with 160004.
                    (0, vitest_1.expect)(preExistingThread).toBeUndefined();
                    return [4 /*yield*/, botClient.rest.post(discord_js_1.Routes.threads(TEXT_CHANNEL_ID, starterMessage.id), {
                            body: {
                                name: 'cli-send-test',
                                auto_archive_duration: 1440,
                            },
                        })];
                case 4:
                    threadData = (_a.sent());
                    // Add test user to thread
                    return [4 /*yield*/, botClient.rest.put(discord_js_1.Routes.threadMembers(threadData.id, TEST_USER_ID))
                        // Wait for the bot to reply with the ⬥ prefix (proves ThreadCreate
                        // handler picked up the starter message and started a session)
                    ];
                case 5:
                    // Add test user to thread
                    _a.sent();
                    // Wait for the bot to reply with the ⬥ prefix (proves ThreadCreate
                    // handler picked up the starter message and started a session)
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: threadData.id,
                            userId: discord.botUserId,
                            text: '⬥',
                            timeout: 4000,
                        })
                        // Wait for footer message (proves session completed successfully)
                    ];
                case 6:
                    // Wait for the bot to reply with the ⬥ prefix (proves ThreadCreate
                    // handler picked up the starter message and started a session)
                    _a.sent();
                    // Wait for footer message (proves session completed successfully)
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: threadData.id,
                            timeout: 4000,
                            afterMessageIncludes: '⬥',
                            afterAuthorId: discord.botUserId,
                        })
                        // Verify no DiscordAPIError[160004] or other errors in the thread.
                        // Before the fix, the MessageCreate GuildText handler would race the
                        // CLI's thread creation and produce an error message here.
                    ];
                case 7:
                    // Wait for footer message (proves session completed successfully)
                    _a.sent();
                    return [4 /*yield*/, discord.thread(threadData.id).getMessages()];
                case 8:
                    messages = _a.sent();
                    errorMessages = messages.filter(function (m) {
                        return m.content.includes('Error:') || m.content.includes('160004');
                    });
                    (0, vitest_1.expect)(errorMessages).toHaveLength(0);
                    botReplies = messages.filter(function (m) {
                        return (m.author.id === discord.botUserId && m.content.startsWith('⬥'));
                    });
                    (0, vitest_1.expect)(botReplies.length).toBeGreaterThanOrEqual(1);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
});
