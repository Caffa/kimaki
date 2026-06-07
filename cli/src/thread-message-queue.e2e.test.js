"use strict";
// E2e tests for basic per-thread message queue ordering.
// Advanced interrupt/abort/retry tests are in thread-queue-advanced.e2e.test.ts.
//
// Uses opencode-deterministic-provider which returns canned responses instantly
// (no real LLM calls), so poll timeouts can be aggressive (4s). The only real
// latency is OpenCode server startup (beforeAll) and intentional partDelaysMs
// in matchers (100ms for user-reply).
//
// If total duration of a file exceeds ~10s, split into a new test file
// so vitest can parallelize across files.
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
var e2eTest = vitest_1.describe;
function createRunDirectories() {
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'thread-queue-e2e');
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
    var bashCreateFileMatcher = {
        id: 'bash-create-file',
        priority: 130,
        when: {
            lastMessageRole: 'user',
            rawPromptIncludes: 'BASH_TOOL_FILE_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'bash-create-file' },
                {
                    type: 'text-delta',
                    id: 'bash-create-file',
                    delta: 'running create file',
                },
                { type: 'text-end', id: 'bash-create-file' },
                {
                    type: 'tool-call',
                    toolCallId: 'bash-create-file-call',
                    toolName: 'bash',
                    input: JSON.stringify({
                        command: 'mkdir -p tmp && printf "created" > tmp/bash-tool-executed.txt',
                        description: 'Create marker file for e2e test',
                        hasSideEffect: true,
                    }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: {
                        inputTokens: 1,
                        outputTokens: 1,
                        totalTokens: 2,
                    },
                },
            ],
        },
    };
    var bashCreateFileFollowupMatcher = {
        id: 'bash-create-file-followup',
        priority: 120,
        when: {
            lastMessageRole: 'tool',
            rawPromptIncludes: 'BASH_TOOL_FILE_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'bash-create-file-followup' },
                {
                    type: 'text-delta',
                    id: 'bash-create-file-followup',
                    delta: 'file created',
                },
                { type: 'text-end', id: 'bash-create-file-followup' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: {
                        inputTokens: 1,
                        outputTokens: 1,
                        totalTokens: 2,
                    },
                },
            ],
        },
    };
    var raceFinalReplyMatcher = {
        id: 'race-final-reply',
        priority: 110,
        when: {
            latestUserTextIncludes: 'Reply with exactly: race-final',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'race-final' },
                { type: 'text-delta', id: 'race-final', delta: 'race-final' },
                { type: 'text-end', id: 'race-final' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: {
                        inputTokens: 1,
                        outputTokens: 1,
                        totalTokens: 2,
                    },
                },
            ],
            // Delay first output to widen the stale-idle window. The race happens
            // in <1ms; 500ms is plenty to keep the window reliably open.
            partDelaysMs: [0, 500, 0, 0, 0],
        },
    };
    // Slow matcher for "hotel" so the 200ms sleep in the queueing test
    // guarantees "india" arrives while hotel is still streaming.
    var hotelSlowMatcher = {
        id: 'hotel-slow-reply',
        priority: 20,
        when: {
            latestUserTextIncludes: 'Reply with exactly: hotel',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'hotel-reply' },
                { type: 'text-delta', id: 'hotel-reply', delta: 'ok' },
                { type: 'text-end', id: 'hotel-reply' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 100, 300, 0, 0],
        },
    };
    var userReplyMatcher = {
        id: 'user-reply',
        priority: 10,
        when: {
            lastMessageRole: 'user',
            rawPromptIncludes: 'Reply with exactly:',
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
                    usage: {
                        inputTokens: 1,
                        outputTokens: 1,
                        totalTokens: 2,
                    },
                },
            ],
            partDelaysMs: [0, 100, 0, 0, 0],
        },
    };
    return [
        bashCreateFileMatcher,
        bashCreateFileFollowupMatcher,
        raceFinalReplyMatcher,
        hotelSlowMatcher,
        userReplyMatcher,
    ];
}
var TEST_USER_ID = '200000000000000777';
var TEXT_CHANNEL_ID = '200000000000000778';
e2eTest('thread message queue ordering', function () {
    var directories;
    var discord;
    var botClient;
    var previousDefaultVerbosity = null;
    var testStartTime = Date.now();
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var lockPort, digitalDiscordDbPath, providerNpm, opencodeConfig, dbPath, hranaResult, channelVerbosity, warmup;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testStartTime = Date.now();
                    directories = createRunDirectories();
                    lockPort = (0, test_utils_js_1.chooseLockPort)({ key: TEXT_CHANNEL_ID });
                    process.env['KIMAKI_LOCK_PORT'] = String(lockPort);
                    (0, config_js_1.setDataDir)(directories.dataDir);
                    previousDefaultVerbosity = store_js_1.store.getState().defaultVerbosity;
                    store_js_1.store.setState({ defaultVerbosity: 'tools_and_text' });
                    digitalDiscordDbPath = node_path_1.default.join(directories.dataDir, 'digital-discord.db');
                    discord = new src_1.DigitalDiscord({
                        guild: {
                            name: 'Queue E2E Guild',
                            ownerId: TEST_USER_ID,
                        },
                        channels: [
                            {
                                id: TEXT_CHANNEL_ID,
                                name: 'queue-e2e',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                        ],
                        users: [
                            {
                                id: TEST_USER_ID,
                                username: 'queue-tester',
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
                    return [4 /*yield*/, (0, database_js_1.setChannelVerbosity)(TEXT_CHANNEL_ID, 'tools_and_text')];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.getChannelVerbosity)(TEXT_CHANNEL_ID)];
                case 7:
                    channelVerbosity = _a.sent();
                    (0, vitest_1.expect)(channelVerbosity).toBe('tools_and_text');
                    botClient = createDiscordJsClient({ restUrl: discord.restUrl });
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                            token: discord.botToken,
                            appId: discord.botUserId,
                            discordClient: botClient,
                        })
                        // Pre-warm the opencode server so the first test doesn't include
                        // server startup time (~3-4s) inside its 4s poll timeouts.
                    ];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directories.projectDirectory)];
                case 9:
                    warmup = _a.sent();
                    if (warmup instanceof Error) {
                        throw warmup;
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 60000);
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
    }); }, 20000);
    (0, vitest_1.test)('first prompt after cold opencode server start still streams text parts', function () { return __awaiter(void 0, void 0, void 0, function () {
        var prompt, thread, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // Reproduce cold-start path: clear in-memory server/client registry so
                // runtime startEventListener() runs once before initialize and exits with
                // "No OpenCode client". The first prompt must still show text parts.
                return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)()];
                case 1:
                    // Reproduce cold-start path: clear in-memory server/client registry so
                    // runtime startEventListener() runs once before initialize and exits with
                    // "No OpenCode client". The first prompt must still show text parts.
                    _b.sent();
                    prompt = 'Reply with exactly: cold-start-stream';
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: prompt,
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === prompt;
                            },
                        })];
                case 3:
                    thread = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '⬥ ok',
                            timeout: 10000,
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })];
                case 5:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 6:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-tester)\n        Reply with exactly: cold-start-stream\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    return [2 /*return*/];
            }
        });
    }); }, 12000);
    (0, vitest_1.test)('text message during active session gets processed', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, firstReply, before, beforeBotCount, after, afterBotMessages, timeline, userBIndex, lastBotIndex, newBotReply;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // 1. Send initial message to text channel → thread created + session established
                return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: alpha',
                    })];
                case 1:
                    // 1. Send initial message to text channel → thread created + session established
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: alpha';
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({
                            timeout: 4000,
                        })];
                case 3:
                    firstReply = _a.sent();
                    (0, vitest_1.expect)(firstReply.content.trim().length).toBeGreaterThan(0);
                    return [4 /*yield*/, th.getMessages()];
                case 4:
                    before = _a.sent();
                    beforeBotCount = before.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    }).length;
                    // 2. Send follow-up message B into the thread — serialized by runtime's enqueueIncoming
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: beta',
                        })
                        // 3. Wait for exactly 1 new bot message (the response to B)
                    ];
                case 5:
                    // 2. Send follow-up message B into the thread — serialized by runtime's enqueueIncoming
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageCount)({
                            discord: discord,
                            threadId: thread.id,
                            count: beforeBotCount + 1,
                            timeout: 4000,
                        })
                        // 4. Verify at least 1 new bot message appeared for the follow-up.
                        //    The bot may send additional messages per session (error reactions,
                        //    session notifications) so we check >= not exact equality.
                    ];
                case 6:
                    after = _a.sent();
                    afterBotMessages = after.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    });
                    (0, vitest_1.expect)(afterBotMessages.length).toBeGreaterThanOrEqual(beforeBotCount + 1);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: 'beta',
                            afterAuthorId: TEST_USER_ID,
                        })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, th.text()];
                case 8:
                    timeline = _a.sent();
                    (0, vitest_1.expect)(timeline).toContain('Reply with exactly: alpha');
                    (0, vitest_1.expect)(timeline).toContain('Reply with exactly: beta');
                    (0, vitest_1.expect)(timeline).toContain('⬥ ok');
                    (0, vitest_1.expect)(timeline).toContain('*project ⋅ main ⋅');
                    userBIndex = after.findIndex(function (m) {
                        return (m.author.id === TEST_USER_ID &&
                            m.content.includes('beta'));
                    });
                    lastBotIndex = after.findLastIndex(function (m) {
                        return m.author.id === discord.botUserId;
                    });
                    (0, vitest_1.expect)(userBIndex).toBeGreaterThan(-1);
                    (0, vitest_1.expect)(lastBotIndex).toBeGreaterThan(-1);
                    (0, vitest_1.expect)(userBIndex).toBeLessThan(lastBotIndex);
                    newBotReply = afterBotMessages[afterBotMessages.length - 1];
                    (0, vitest_1.expect)(newBotReply.content.trim().length).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); }, 12000);
    (0, vitest_1.test)('two rapid text messages in thread — both processed in order', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, firstReply, before, beforeBotCount, after, afterBotMessages, _a, userThreeIndex, botAfterThreeIndex, newBotReplies, finalState;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // 1. Send initial message to text channel → thread + session established
                return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: one',
                    })];
                case 1:
                    // 1. Send initial message to text channel → thread + session established
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: one';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({
                            timeout: 4000,
                        })];
                case 3:
                    firstReply = _b.sent();
                    (0, vitest_1.expect)(firstReply.content.trim().length).toBeGreaterThan(0);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'one',
                            afterAuthorId: TEST_USER_ID,
                        })
                        // Snapshot bot message count before sending follow-ups
                    ];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 5:
                    before = _b.sent();
                    beforeBotCount = before.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    }).length;
                    // 2. Rapidly send messages B and C. With opencode queue mode,
                    // both messages are serialized by opencode's per-session loop.
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: two',
                        })];
                case 6:
                    // 2. Rapidly send messages B and C. With opencode queue mode,
                    // both messages are serialized by opencode's per-session loop.
                    _b.sent();
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: three',
                        })
                        // 3. Wait for a bot reply after message C.
                    ];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'three',
                            timeout: 4000,
                        })
                        // 4. Verify the latest user message got a bot reply.
                    ];
                case 8:
                    after = _b.sent();
                    afterBotMessages = after.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    });
                    (0, vitest_1.expect)(afterBotMessages.length).toBeGreaterThanOrEqual(beforeBotCount + 1);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'three',
                            afterAuthorId: TEST_USER_ID,
                        })];
                case 9:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 10:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-tester)\n        Reply with exactly: one\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (queue-tester)\n        Reply with exactly: two\n        Reply with exactly: three\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    userThreeIndex = after.findIndex(function (message) {
                        return (message.author.id === TEST_USER_ID &&
                            message.content.includes('three'));
                    });
                    (0, vitest_1.expect)(userThreeIndex).toBeGreaterThan(-1);
                    botAfterThreeIndex = after.findIndex(function (message, index) {
                        return index > userThreeIndex && message.author.id === discord.botUserId;
                    });
                    (0, vitest_1.expect)(botAfterThreeIndex).toBeGreaterThan(userThreeIndex);
                    newBotReplies = afterBotMessages.slice(beforeBotCount);
                    (0, vitest_1.expect)(newBotReplies.some(function (reply) {
                        return reply.content.trim().length > 0;
                    })).toBe(true);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForThreadState)({
                            threadId: thread.id,
                            predicate: function (state) {
                                return state.queueItems.length === 0;
                            },
                            timeout: 4000,
                            description: 'queue empty after rapid interrupts',
                        })];
                case 11:
                    finalState = _b.sent();
                    (0, vitest_1.expect)(finalState.queueItems.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('normal messages bypass local queue and still show assistant text parts', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setupPrompt, thread, th, firstReply, followupPrompt, followupUserMessage, messagesWithFollowupFooter, _a, followupUserIndex, textPartAfterFollowupIndex, footerAfterFollowupIndex, noLocalQueueState;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setupPrompt = 'Reply with exactly: opencode-queue-setup';
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: setupPrompt,
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: opencode-queue-setup';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    firstReply = _b.sent();
                    (0, vitest_1.expect)(firstReply.content.trim().length).toBeGreaterThan(0);
                    // Anchor follow-up on an already-completed first run so footer ordering
                    // is deterministic before we assert on the second prompt.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })];
                case 4:
                    // Anchor follow-up on an already-completed first run so footer ordering
                    // is deterministic before we assert on the second prompt.
                    _b.sent();
                    followupPrompt = 'Prompt from test: respond with short text for opencode queue mode.';
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: followupPrompt,
                        })
                        // Assert assistant text parts are visible in Discord.
                    ];
                case 5:
                    followupUserMessage = _b.sent();
                    // Assert assistant text parts are visible in Discord.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '⬥ ok',
                            afterMessageId: followupUserMessage.id,
                            timeout: 4000,
                        })];
                case 6:
                    // Assert assistant text parts are visible in Discord.
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: followupPrompt,
                            afterAuthorId: TEST_USER_ID,
                        })];
                case 7:
                    messagesWithFollowupFooter = _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 8:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-tester)\n        Reply with exactly: opencode-queue-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (queue-tester)\n        Prompt from test: respond with short text for opencode queue mode.\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    followupUserIndex = messagesWithFollowupFooter.findIndex(function (message) {
                        return message.id === followupUserMessage.id;
                    });
                    textPartAfterFollowupIndex = messagesWithFollowupFooter.findIndex(function (message, index) {
                        return (index > followupUserIndex &&
                            message.author.id === discord.botUserId &&
                            message.content.includes('⬥ ok'));
                    });
                    footerAfterFollowupIndex = messagesWithFollowupFooter.findIndex(function (message, index) {
                        return (index > textPartAfterFollowupIndex &&
                            message.author.id === discord.botUserId &&
                            message.content.startsWith('*') &&
                            message.content.includes('⋅'));
                    });
                    (0, vitest_1.expect)(followupUserIndex).toBeGreaterThan(-1);
                    (0, vitest_1.expect)(textPartAfterFollowupIndex).toBeGreaterThan(followupUserIndex);
                    (0, vitest_1.expect)(footerAfterFollowupIndex).toBeGreaterThan(textPartAfterFollowupIndex);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForThreadState)({
                            threadId: thread.id,
                            predicate: function (state) {
                                return state.queueItems.length === 0;
                            },
                            timeout: 4000,
                            description: 'local queue remains empty in opencode mode',
                        })];
                case 9:
                    noLocalQueueState = _b.sent();
                    (0, vitest_1.expect)(noLocalQueueState.queueItems.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('bash tool-call actually executes and creates file in project directory', function () { return __awaiter(void 0, void 0, void 0, function () {
        var markerRelativePath, markerPath, existingThreadIds, _a, prompt, thread, deadline, _b, markerContents;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    markerRelativePath = node_path_1.default.join('tmp', 'bash-tool-executed.txt');
                    markerPath = node_path_1.default.join(directories.projectDirectory, markerRelativePath);
                    node_fs_1.default.rmSync(markerPath, { force: true });
                    _a = Set.bind;
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).getThreads()];
                case 1:
                    existingThreadIds = new (_a.apply(Set, [void 0, (_c.sent()).map(function (thread) {
                            return thread.id;
                        })]))();
                    prompt = 'Reply with exactly: BASH_TOOL_FILE_MARKER';
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: prompt,
                        })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 6000,
                            predicate: function (t) {
                                return !existingThreadIds.has(t.id);
                            },
                        })];
                case 3:
                    thread = _c.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'running create file',
                            timeout: 6000,
                        })];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 6000,
                        })];
                case 5:
                    _c.sent();
                    deadline = Date.now() + 4000;
                    _c.label = 6;
                case 6:
                    if (!(!node_fs_1.default.existsSync(markerPath) && Date.now() < deadline)) return [3 /*break*/, 8];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 7:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 8:
                    _b = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 9:
                    _b.apply(void 0, [_c.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-tester)\n        Reply with exactly: BASH_TOOL_FILE_MARKER\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 running create file\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(node_fs_1.default.existsSync(markerPath)).toBe(true);
                    markerContents = node_fs_1.default.readFileSync(markerPath, 'utf8');
                    (0, vitest_1.expect)(markerContents).toBe('created');
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('/queue shows queued status first, then dispatch indicator when dequeued', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, firstReply, firstQueueInteractionId, firstQueueAck, firstQueueAckMessage, queuedPrompt, interactionId, queuedAck, queuedStatusMessage, expectedDispatchIndicator, messagesWithDispatch, queuedStatusIndex, dispatchIndicatorIndex, dispatchIndicatorMessage, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: queue-slash-setup',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: queue-slash-setup';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    firstReply = _b.sent();
                    (0, vitest_1.expect)(firstReply.content.trim().length).toBeGreaterThan(0);
                    // Ensure the setup run is fully settled before slash-queue checks.
                    // Otherwise the first /queue call can race with a still-busy run window.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })
                        // Start a non-interrupting queued slash message while idle so it
                        // dispatches immediately and keeps the runtime active.
                    ];
                case 4:
                    // Ensure the setup run is fully settled before slash-queue checks.
                    // Otherwise the first /queue call can race with a still-busy run window.
                    _b.sent();
                    return [4 /*yield*/, th.user(TEST_USER_ID)
                            .runSlashCommand({
                            name: 'queue',
                            options: [{ name: 'message', type: 3, value: 'Reply with exactly: race-final' }],
                        })];
                case 5:
                    firstQueueInteractionId = (_b.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: firstQueueInteractionId,
                            timeout: 4000,
                        })];
                case 6:
                    firstQueueAck = _b.sent();
                    if (!firstQueueAck.messageId) {
                        throw new Error('Expected first /queue response message id');
                    }
                    return [4 /*yield*/, (0, test_utils_js_1.waitForMessageById)({
                            discord: discord,
                            threadId: thread.id,
                            messageId: firstQueueAck.messageId,
                            timeout: 4000,
                        })];
                case 7:
                    firstQueueAckMessage = _b.sent();
                    (0, vitest_1.expect)(firstQueueAckMessage.content).toContain('» **queue-tester:** Reply with exactly: race-final');
                    queuedPrompt = 'Reply with exactly: queued-from-slash';
                    return [4 /*yield*/, th.user(TEST_USER_ID).runSlashCommand({
                            name: 'queue',
                            options: [{ name: 'message', type: 3, value: queuedPrompt }],
                        })];
                case 8:
                    interactionId = (_b.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({ interactionId: interactionId, timeout: 4000 })];
                case 9:
                    queuedAck = _b.sent();
                    if (!queuedAck.messageId) {
                        throw new Error('Expected queued /queue response message id');
                    }
                    return [4 /*yield*/, (0, test_utils_js_1.waitForMessageById)({
                            discord: discord,
                            threadId: thread.id,
                            messageId: queuedAck.messageId,
                            timeout: 4000,
                        })];
                case 10:
                    queuedStatusMessage = _b.sent();
                    (0, vitest_1.expect)(queuedStatusMessage.content.startsWith('Queued message')).toBe(true);
                    expectedDispatchIndicator = "\u00BB **queue-tester:** ".concat(queuedPrompt);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: expectedDispatchIndicator,
                            afterMessageId: queuedStatusMessage.id,
                            timeout: 8000,
                        })];
                case 11:
                    messagesWithDispatch = _b.sent();
                    queuedStatusIndex = messagesWithDispatch.findIndex(function (message) {
                        return message.id === queuedStatusMessage.id;
                    });
                    dispatchIndicatorIndex = messagesWithDispatch.findIndex(function (message) {
                        return (message.author.id === discord.botUserId &&
                            message.content.includes(expectedDispatchIndicator));
                    });
                    (0, vitest_1.expect)(queuedStatusIndex).toBeGreaterThan(-1);
                    (0, vitest_1.expect)(dispatchIndicatorIndex).toBeGreaterThan(queuedStatusIndex);
                    dispatchIndicatorMessage = messagesWithDispatch[dispatchIndicatorIndex];
                    if (!dispatchIndicatorMessage) {
                        throw new Error('Expected dispatch indicator message');
                    }
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            text: '⬥ ok',
                            afterMessageId: dispatchIndicatorMessage.id,
                            timeout: 8000,
                        })];
                case 12:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: '⬥ ok',
                            afterAuthorId: discord.botUserId,
                        })];
                case 13:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 14:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-tester)\n        Reply with exactly: queue-slash-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        \u00BB **queue-tester:** Reply with exactly: race-final\n        Queued message (position 1)\n        \u2B25 race-final\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        \u00BB **queue-tester:** Reply with exactly: queued-from-slash\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    return [2 /*return*/];
            }
        });
    }); }, 12000);
    (0, vitest_1.test)('/clear-queue position clears only that queued message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, secondQueueInteractionId, secondQueueAck, secondQueueAckMessage, thirdQueueInteractionId, thirdQueueAck, thirdQueueAckMessage, clearInteractionId, clearAck, clearAckMessage, threadText;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: clear-queue-setup',
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: clear-queue-setup';
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, th.user(TEST_USER_ID).runSlashCommand({
                            name: 'queue',
                            options: [{ name: 'message', type: 3, value: 'Reply with exactly: race-final' }],
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, th.user(TEST_USER_ID)
                            .runSlashCommand({
                            name: 'queue',
                            options: [{ name: 'message', type: 3, value: 'Reply with exactly: removed-queued-message' }],
                        })];
                case 6:
                    secondQueueInteractionId = (_a.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: secondQueueInteractionId,
                            timeout: 4000,
                        })];
                case 7:
                    secondQueueAck = _a.sent();
                    if (!secondQueueAck.messageId) {
                        throw new Error('Expected second /queue response message id');
                    }
                    return [4 /*yield*/, (0, test_utils_js_1.waitForMessageById)({
                            discord: discord,
                            threadId: thread.id,
                            messageId: secondQueueAck.messageId,
                            timeout: 4000,
                        })];
                case 8:
                    secondQueueAckMessage = _a.sent();
                    (0, vitest_1.expect)(secondQueueAckMessage.content).toContain('Queued message (position 1)');
                    return [4 /*yield*/, th.user(TEST_USER_ID).runSlashCommand({
                            name: 'queue',
                            options: [{ name: 'message', type: 3, value: 'Reply with exactly: kept-queued-message' }],
                        })];
                case 9:
                    thirdQueueInteractionId = (_a.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: thirdQueueInteractionId,
                            timeout: 4000,
                        })];
                case 10:
                    thirdQueueAck = _a.sent();
                    if (!thirdQueueAck.messageId) {
                        throw new Error('Expected third /queue response message id');
                    }
                    return [4 /*yield*/, (0, test_utils_js_1.waitForMessageById)({
                            discord: discord,
                            threadId: thread.id,
                            messageId: thirdQueueAck.messageId,
                            timeout: 4000,
                        })];
                case 11:
                    thirdQueueAckMessage = _a.sent();
                    (0, vitest_1.expect)(thirdQueueAckMessage.content).toContain('Queued message (position 2)');
                    return [4 /*yield*/, th.user(TEST_USER_ID).runSlashCommand({
                            name: 'clear-queue',
                            options: [{ name: 'position', type: 4, value: 1 }],
                        })];
                case 12:
                    clearInteractionId = (_a.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: clearInteractionId,
                            timeout: 4000,
                        })];
                case 13:
                    clearAck = _a.sent();
                    if (!clearAck.messageId) {
                        throw new Error('Expected /clear-queue response message id');
                    }
                    return [4 /*yield*/, (0, test_utils_js_1.waitForMessageById)({
                            discord: discord,
                            threadId: thread.id,
                            messageId: clearAck.messageId,
                            timeout: 4000,
                        })];
                case 14:
                    clearAckMessage = _a.sent();
                    (0, vitest_1.expect)(clearAckMessage.content).toBe('Cleared queued message at position 1');
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '» **queue-tester:** Reply with exactly: kept-queued-message',
                            afterMessageId: clearAckMessage.id,
                            timeout: 8000,
                        })];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: '⬥ ok',
                            afterAuthorId: discord.botUserId,
                        })];
                case 16:
                    _a.sent();
                    return [4 /*yield*/, th.text()];
                case 17:
                    threadText = _a.sent();
                    (0, vitest_1.expect)(threadText).toMatchInlineSnapshot("\n        \"--- from: user (queue-tester)\n        Reply with exactly: clear-queue-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        \u00BB **queue-tester:** Reply with exactly: race-final\n        Queued message (position 1)\n        Queued message (position 2)\n        Cleared queued message at position 1\n        \u2B25 race-final\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        \u00BB **queue-tester:** Reply with exactly: kept-queued-message\"\n      ");
                    (0, vitest_1.expect)(threadText).not.toContain('removed-queued-message');
                    (0, vitest_1.expect)(threadText).toContain('kept-queued-message');
                    return [2 /*return*/];
            }
        });
    }); }, 12000);
    (0, vitest_1.test)('queued message waits for running session and then processes next', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, firstReply, before, beforeBotCount, after, afterBotMessages, finalMessages, userEchoIndex, userFoxtrotIndex, botAfterFoxtrot, timeline;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // When a new message arrives while a session is running, it queues and
                // runs after the in-flight request completes.
                //
                // 1. Fast setup: establish session
                return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: delta',
                    })];
                case 1:
                    // When a new message arrives while a session is running, it queues and
                    // runs after the in-flight request completes.
                    //
                    // 1. Fast setup: establish session
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: delta';
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    firstReply = _a.sent();
                    (0, vitest_1.expect)(firstReply.content.trim().length).toBeGreaterThan(0);
                    return [4 /*yield*/, th.getMessages()];
                case 4:
                    before = _a.sent();
                    beforeBotCount = before.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    }).length;
                    // 2. Send B, then quickly send C to enqueue behind B.
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: echo',
                        })];
                case 5:
                    // 2. Send B, then quickly send C to enqueue behind B.
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (r) {
                            setTimeout(r, 500);
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: foxtrot',
                        })
                        // 3. Poll until foxtrot's user message has a bot reply after it.
                        //    waitForBotMessageCount alone isn't enough — error messages from the
                        //    interrupted session can satisfy the count before foxtrot gets its reply.
                    ];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'foxtrot',
                            timeout: 4000,
                        })
                        // 4. Foxtrot got a bot response after B/C were processed.
                    ];
                case 8:
                    after = _a.sent();
                    afterBotMessages = after.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    });
                    (0, vitest_1.expect)(afterBotMessages.length).toBeGreaterThanOrEqual(beforeBotCount + 1);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'foxtrot',
                            afterAuthorId: TEST_USER_ID,
                        })
                        // Assert ordering invariants instead of exact snapshot — the echo reply
                        // and footer can interleave non-deterministically on slower CI hardware.
                    ];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 10:
                    finalMessages = _a.sent();
                    userEchoIndex = finalMessages.findIndex(function (m) {
                        return m.author.id === TEST_USER_ID && m.content.includes('echo');
                    });
                    userFoxtrotIndex = finalMessages.findIndex(function (m) {
                        return m.author.id === TEST_USER_ID && m.content.includes('foxtrot');
                    });
                    (0, vitest_1.expect)(userEchoIndex).toBeGreaterThan(-1);
                    (0, vitest_1.expect)(userFoxtrotIndex).toBeGreaterThan(-1);
                    // User messages appear in send order
                    (0, vitest_1.expect)(userEchoIndex).toBeLessThan(userFoxtrotIndex);
                    botAfterFoxtrot = finalMessages.findIndex(function (m, i) {
                        return i > userFoxtrotIndex && m.author.id === discord.botUserId;
                    });
                    (0, vitest_1.expect)(botAfterFoxtrot).toBeGreaterThan(userFoxtrotIndex);
                    return [4 /*yield*/, th.text()];
                case 11:
                    timeline = _a.sent();
                    (0, vitest_1.expect)(timeline).toContain('Reply with exactly: echo');
                    (0, vitest_1.expect)(timeline).toContain('Reply with exactly: foxtrot');
                    (0, vitest_1.expect)(timeline).toContain('*project ⋅ main ⋅');
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('slow stream still processes queued next message after completion', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, firstReply, before, beforeBotCount, after, _a, userIndiaIndex, botAfterIndia;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // A message sent mid-stream queues and runs after the in-flight request
                // completes (no auto-interrupt).
                // 1. Fast setup: establish session
                return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: golf',
                    })];
                case 1:
                    // A message sent mid-stream queues and runs after the in-flight request
                    // completes (no auto-interrupt).
                    // 1. Fast setup: establish session
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: golf';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    firstReply = _b.sent();
                    (0, vitest_1.expect)(firstReply.content.trim().length).toBeGreaterThan(0);
                    // Wait for golf's footer so the golf→hotel transition is deterministic
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'ok',
                            afterAuthorId: discord.botUserId,
                        })];
                case 4:
                    // Wait for golf's footer so the golf→hotel transition is deterministic
                    _b.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 5:
                    before = _b.sent();
                    beforeBotCount = before.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    }).length;
                    // 2. Start request B (hotel, slow matcher ~400ms), then send C while B
                    //    is still in progress.
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: hotel',
                        })
                        // 3. Wait briefly for B to start, then send C to queue behind it
                    ];
                case 6:
                    // 2. Start request B (hotel, slow matcher ~400ms), then send C while B
                    //    is still in progress.
                    _b.sent();
                    // 3. Wait briefly for B to start, then send C to queue behind it
                    return [4 /*yield*/, new Promise(function (r) {
                            setTimeout(r, 200);
                        })];
                case 7:
                    // 3. Wait briefly for B to start, then send C to queue behind it
                    _b.sent();
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: india',
                        })
                        // 4. B completes, then C gets processed.
                        //    Poll until india's user message has a bot reply after it.
                    ];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'india',
                            timeout: 4000,
                        })];
                case 9:
                    after = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'india',
                            afterAuthorId: TEST_USER_ID,
                        })
                        // C's user message appears before its bot response.
                        // We assert on india's reply existence.
                    ];
                case 10:
                    _b.sent();
                    // C's user message appears before its bot response.
                    // We assert on india's reply existence.
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 11:
                    // C's user message appears before its bot response.
                    // We assert on india's reply existence.
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-tester)\n        Reply with exactly: golf\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (queue-tester)\n        Reply with exactly: hotel\n        Reply with exactly: india\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    userIndiaIndex = after.findIndex(function (m) {
                        return m.author.id === TEST_USER_ID && m.content.includes('india');
                    });
                    (0, vitest_1.expect)(userIndiaIndex).toBeGreaterThan(-1);
                    botAfterIndia = after.findIndex(function (m, i) {
                        return i > userIndiaIndex && m.author.id === discord.botUserId;
                    });
                    (0, vitest_1.expect)(botAfterIndia).toBeGreaterThan(userIndiaIndex);
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('queue drains correctly after bursty queued messages', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, firstReply, before, beforeBotCount, afterBurst, afterE, textWithoutFooters, normalizedTextWithoutFooters, userNovemberIndex, lastBotIndex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Verifies the queue doesn't get stuck after multiple rapid messages.
                // 1. Fast setup: establish session
                return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: juliet',
                    })];
                case 1:
                    // Verifies the queue doesn't get stuck after multiple rapid messages.
                    // 1. Fast setup: establish session
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: juliet';
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    firstReply = _a.sent();
                    (0, vitest_1.expect)(firstReply.content.trim().length).toBeGreaterThan(0);
                    return [4 /*yield*/, th.getMessages()];
                case 4:
                    before = _a.sent();
                    beforeBotCount = before.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    }).length;
                    // 2. Rapidly send B, C, D back-to-back to avoid timing windows where
                    // one run can finish between sends and reorder transcript lines.
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: kilo',
                        })];
                case 5:
                    // 2. Rapidly send B, C, D back-to-back to avoid timing windows where
                    // one run can finish between sends and reorder transcript lines.
                    _a.sent();
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: lima',
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: mike',
                        })
                        // 3. Wait until the last burst message (mike) has a bot reply after it.
                    ];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'mike',
                            timeout: 4000,
                        })
                        // 4. Queue should be clean — send E and verify it also gets processed
                    ];
                case 8:
                    afterBurst = _a.sent();
                    // 4. Queue should be clean — send E and verify it also gets processed
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: november',
                        })];
                case 9:
                    // 4. Queue should be clean — send E and verify it also gets processed
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'november',
                            timeout: 4000,
                        })];
                case 10:
                    afterE = _a.sent();
                    return [4 /*yield*/, th.text()];
                case 11:
                    textWithoutFooters = (_a.sent())
                        .split('\n')
                        .filter(function (line) {
                        return !line.startsWith('*project ⋅');
                    })
                        .join('\n');
                    normalizedTextWithoutFooters = textWithoutFooters.replace([
                        '--- from: assistant (TestBot)',
                        '⬥ ok',
                        '--- from: user (queue-tester)',
                        'Reply with exactly: november',
                    ].join('\n'), [
                        '--- from: assistant (TestBot)',
                        '--- from: user (queue-tester)',
                        'Reply with exactly: november',
                    ].join('\n'));
                    (0, vitest_1.expect)(normalizedTextWithoutFooters).toMatchInlineSnapshot("\n        \"--- from: user (queue-tester)\n        Reply with exactly: juliet\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        --- from: user (queue-tester)\n        Reply with exactly: kilo\n        Reply with exactly: lima\n        Reply with exactly: mike\n        --- from: assistant (TestBot)\n        --- from: user (queue-tester)\n        Reply with exactly: november\n        --- from: assistant (TestBot)\n        \u2B25 ok\"\n      ");
                    userNovemberIndex = afterE.findIndex(function (m) {
                        return m.author.id === TEST_USER_ID && m.content.includes('november');
                    });
                    (0, vitest_1.expect)(userNovemberIndex).toBeGreaterThan(-1);
                    lastBotIndex = afterE.findLastIndex(function (m) {
                        return m.author.id === discord.botUserId;
                    });
                    (0, vitest_1.expect)(userNovemberIndex).toBeLessThan(lastBotIndex);
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
});
