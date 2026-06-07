"use strict";
// E2e tests for ThreadSessionRuntime lifecycle behaviors.
// Tests scenarios not covered by the queue/interrupt tests:
// 1. Sequential completions: listener stays alive across multiple full run cycles
// 2. Concurrent first messages: runtime serialization without threadMessageQueue
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
var thread_session_runtime_js_1 = require("./session-handler/thread-session-runtime.js");
var database_js_1 = require("./database.js");
var hrana_server_js_1 = require("./hrana-server.js");
var opencode_js_1 = require("./opencode.js");
var test_utils_js_1 = require("./test-utils.js");
var TEST_USER_ID = '200000000000000888';
var TEXT_CHANNEL_ID = '200000000000000889';
function createRunDirectories() {
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'runtime-lifecycle-e2e');
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
    var highUsageReplyMatcher = {
        id: 'high-usage-reply',
        priority: 20,
        when: {
            lastMessageRole: 'user',
            rawPromptIncludes: 'Reply with exactly: footer-high-usage',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'high-usage-reply' },
                { type: 'text-delta', id: 'high-usage-reply', delta: 'ok' },
                { type: 'text-end', id: 'high-usage-reply' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 15000, outputTokens: 1, totalTokens: 15001 },
                },
            ],
            partDelaysMs: [0, 100, 0, 0, 0],
        },
    };
    // Simple reply matcher: model echoes back the requested text.
    // Uses 100ms delay on first text delta to keep streams async without adding
    // unnecessary latency. Tests verify ordering/serialization, not latency handling.
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
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 100, 0, 0, 0],
        },
    };
    return [highUsageReplyMatcher, userReplyMatcher];
}
(0, vitest_1.describe)('runtime lifecycle', function () {
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
                    lockPort = (0, test_utils_js_1.chooseLockPort)({ key: TEXT_CHANNEL_ID });
                    process.env['KIMAKI_LOCK_PORT'] = String(lockPort);
                    (0, config_js_1.setDataDir)(directories.dataDir);
                    previousDefaultVerbosity = store_js_1.store.getState().defaultVerbosity;
                    store_js_1.store.setState({ defaultVerbosity: 'tools_and_text' });
                    digitalDiscordDbPath = node_path_1.default.join(directories.dataDir, 'digital-discord.db');
                    discord = new src_1.DigitalDiscord({
                        guild: {
                            name: 'Lifecycle E2E Guild',
                            ownerId: TEST_USER_ID,
                        },
                        channels: [
                            {
                                id: TEXT_CHANNEL_ID,
                                name: 'lifecycle-e2e',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                        ],
                        users: [
                            {
                                id: TEST_USER_ID,
                                username: 'lifecycle-tester',
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
                    botClient = createDiscordJsClient({ restUrl: discord.restUrl });
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                            token: discord.botToken,
                            appId: discord.botUserId,
                            discordClient: botClient,
                        })
                        // Pre-warm the opencode server
                    ];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directories.projectDirectory)];
                case 8:
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
                            (0, database_js_1.closeDatabase)().catch(function () { return; }),
                            (0, hrana_server_js_1.stopHranaServer)().catch(function () { return; }),
                            discord === null || discord === void 0 ? void 0 : discord.stop().catch(function () { return; }),
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
    (0, vitest_1.test)('three sequential completions reuse same runtime and listener', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, runtimeAfterA, runtimeAfterB, runtimeAfterC, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // Sends A, waits for full completion (footer), sends B, waits for
                // footer, sends C, waits for footer. Proves the listener stays alive
                // across full run cycles without any interrupt/queue involvement.
                // This is the "calm" path — no abort, no queue, just sequential use.
                // 1. Send first message → thread created, session established
                return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: seq-alpha',
                    })];
                case 1:
                    // Sends A, waits for full completion (footer), sends B, waits for
                    // footer, sends C, waits for footer. Proves the listener stays alive
                    // across full run cycles without any interrupt/queue involvement.
                    // This is the "calm" path — no abort, no queue, just sequential use.
                    // 1. Send first message → thread created, session established
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: seq-alpha';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    // Wait for footer (italic project info line) — proves run A completed
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '*project',
                            timeout: 4000,
                        })
                        // Capture runtime identity — should not change across runs
                    ];
                case 3:
                    // Wait for footer (italic project info line) — proves run A completed
                    _b.sent();
                    runtimeAfterA = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtimeAfterA).toBeDefined();
                    // 2. Send B after A fully completed
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: seq-beta',
                        })];
                case 4:
                    // 2. Send B after A fully completed
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'seq-beta',
                            timeout: 4000,
                        })
                        // Wait for B's footer
                    ];
                case 5:
                    _b.sent();
                    // Wait for B's footer
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '*project',
                            afterUserMessageIncludes: 'seq-beta',
                            timeout: 4000,
                        })
                        // Same runtime instance — listener was not recreated
                    ];
                case 6:
                    // Wait for B's footer
                    _b.sent();
                    runtimeAfterB = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtimeAfterB).toBe(runtimeAfterA);
                    // 3. Send C after B fully completed
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: seq-gamma',
                        })];
                case 7:
                    // 3. Send C after B fully completed
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'seq-gamma',
                            timeout: 4000,
                        })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '*project',
                            afterUserMessageIncludes: 'seq-gamma',
                            timeout: 4000,
                        })
                        // Still the same runtime — three full cycles, one runtime, one listener
                    ];
                case 9:
                    _b.sent();
                    runtimeAfterC = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 10:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (lifecycle-tester)\n        Reply with exactly: seq-alpha\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (lifecycle-tester)\n        Reply with exactly: seq-beta\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (lifecycle-tester)\n        Reply with exactly: seq-gamma\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(runtimeAfterC).toBe(runtimeAfterA);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('footer includes context percentage and model id', function () { return __awaiter(void 0, void 0, void 0, function () {
        var prompt, thread, messages, footerMessage, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    prompt = 'Reply with exactly: footer-check';
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: prompt,
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === prompt;
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '%',
                            timeout: 4000,
                        })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()];
                case 4:
                    messages = _b.sent();
                    footerMessage = messages.find(function (message) {
                        if (message.author.id !== discord.botUserId) {
                            return false;
                        }
                        if (!message.content.startsWith('*')) {
                            return false;
                        }
                        return message.content.includes('deterministic-v2') && message.content.includes('%');
                    });
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (lifecycle-tester)\n        Reply with exactly: footer-check\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(footerMessage).toBeDefined();
                    if (!footerMessage) {
                        throw new Error('Expected footer message to be present');
                    }
                    (0, vitest_1.expect)(footerMessage.content).toContain('deterministic-v2');
                    (0, vitest_1.expect)(footerMessage.content).toMatch(/\d+%/);
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    (0, vitest_1.test)('existing runtime reconnects after shared opencode server restart', function () { return __awaiter(void 0, void 0, void 0, function () {
        var prompt, thread, th, runtimeBeforeRestart, restartResult, _a, runtimeAfterRestart;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    prompt = 'Reply with exactly: reconnect-alpha';
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: prompt,
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === prompt;
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '*project',
                            timeout: 4000,
                        })];
                case 3:
                    _b.sent();
                    runtimeBeforeRestart = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtimeBeforeRestart).toBeDefined();
                    return [4 /*yield*/, (0, opencode_js_1.restartOpencodeServer)()];
                case 4:
                    restartResult = _b.sent();
                    if (restartResult instanceof Error) {
                        throw restartResult;
                    }
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: reconnect-beta',
                        })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'reconnect-beta',
                            timeout: 4000,
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '*project',
                            afterUserMessageIncludes: 'reconnect-beta',
                            timeout: 4000,
                        })];
                case 7:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 8:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (lifecycle-tester)\n        Reply with exactly: reconnect-alpha\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (lifecycle-tester)\n        Reply with exactly: reconnect-beta\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    runtimeAfterRestart = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtimeAfterRestart).toBe(runtimeBeforeRestart);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('does not print a context-usage notice for the final text part right before the footer', function () { return __awaiter(void 0, void 0, void 0, function () {
        var prompt, existingThreadIds, _a, thread, _b, threadText;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    prompt = 'Reply with exactly: footer-high-usage';
                    _a = Set.bind;
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).getThreads()];
                case 1:
                    existingThreadIds = new (_a.apply(Set, [void 0, (_c.sent()).map(function (thread) {
                            return thread.id;
                        })]))();
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
                            text: 'deterministic-v2',
                            timeout: 6000,
                        })];
                case 4:
                    _c.sent();
                    _b = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 5:
                    _b.apply(void 0, [_c.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (lifecycle-tester)\n        Reply with exactly: footer-high-usage\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\"\n      ");
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 6:
                    threadText = _c.sent();
                    (0, vitest_1.expect)(threadText).not.toContain('⬦ context usage');
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    (0, vitest_1.test)('two near-simultaneous messages to same thread serialize correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
        var existingThreadIds, _a, thread, th, setupReply, beforeMessages, beforeBotCount, sendB, sendC, messages, bravoIndex, charlieIndex, charlieReplyIndex, afterBotCount;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = Set.bind;
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).getThreads()];
                case 1:
                    existingThreadIds = new (_a.apply(Set, [void 0, (_b.sent()).map(function (thread) {
                            return thread.id;
                        })]))();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: concurrent-setup',
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 6000,
                            predicate: function (t) {
                                return !existingThreadIds.has(t.id);
                            },
                        })];
                case 3:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 6000 })];
                case 4:
                    setupReply = _b.sent();
                    (0, vitest_1.expect)(setupReply.content.trim().length).toBeGreaterThan(0);
                    // Wait for setup footer so the run is fully idle
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '*project',
                            timeout: 6000,
                        })
                        // Snapshot bot message count before sending concurrent messages
                    ];
                case 5:
                    // Wait for setup footer so the run is fully idle
                    _b.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 6:
                    beforeMessages = _b.sent();
                    beforeBotCount = beforeMessages.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    }).length;
                    sendB = th.user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: concurrent-bravo',
                    });
                    sendC = th.user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: concurrent-charlie',
                    });
                    return [4 /*yield*/, Promise.all([sendB, sendC])
                        // 3. Both should eventually get bot replies — the runtime serializes them
                    ];
                case 7:
                    _b.sent();
                    // 3. Both should eventually get bot replies — the runtime serializes them
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'concurrent-bravo',
                            timeout: 4000,
                        })];
                case 8:
                    // 3. Both should eventually get bot replies — the runtime serializes them
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'concurrent-charlie',
                            timeout: 4000,
                        })
                        // 4. Verify both user messages arrived and the thread didn't deadlock.
                        //    With explicit abort flows, bravo can be aborted by charlie before
                        //    producing a reply, so we can't assert +2 bot messages. What we
                        //    CAN verify: both user messages exist, charlie (the last one) has
                        //    a bot reply after it, and the replies are distinct messages.
                        //    No inline snapshot here — the concurrent abort race makes message
                        //    ordering nondeterministic (bravo may or may not get a reply).
                    ];
                case 9:
                    _b.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 10:
                    messages = _b.sent();
                    bravoIndex = messages.findIndex(function (m) {
                        return (m.author.id === TEST_USER_ID &&
                            m.content.includes('concurrent-bravo'));
                    });
                    charlieIndex = messages.findIndex(function (m) {
                        return (m.author.id === TEST_USER_ID &&
                            m.content.includes('concurrent-charlie'));
                    });
                    (0, vitest_1.expect)(bravoIndex).toBeGreaterThan(-1);
                    (0, vitest_1.expect)(charlieIndex).toBeGreaterThan(-1);
                    (0, vitest_1.expect)(bravoIndex).toBeLessThan(charlieIndex);
                    charlieReplyIndex = messages.findIndex(function (m, i) {
                        return i > charlieIndex && m.author.id === discord.botUserId;
                    });
                    (0, vitest_1.expect)(charlieReplyIndex).toBeGreaterThan(-1);
                    afterBotCount = messages.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    }).length;
                    (0, vitest_1.expect)(afterBotCount).toBeGreaterThanOrEqual(beforeBotCount + 1);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
});
