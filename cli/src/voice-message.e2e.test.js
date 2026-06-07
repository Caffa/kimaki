"use strict";
// E2e tests for voice message handling (audio attachment transcription).
// Uses deterministic transcription (store.test.deterministicTranscription) to
// bypass real AI model calls and control transcription output, timing, and
// queueMessage flag. Combined with opencode-deterministic-provider for session
// responses. Tests validate the full flow: attachment detection → transcription
// → session dispatch, including interrupt, queue, and race condition scenarios.
//
// Tests assert on both Discord messages (via digital twin) and session state
// transitions (via getThreadState from the zustand store).
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
var thread_runtime_state_js_1 = require("./session-handler/thread-runtime-state.js");
var e2eTest = vitest_1.describe;
// ── Helpers ──────────────────────────────────────────────────────
function createRunDirectories() {
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'voice-msg-e2e');
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
/** Set the deterministic transcription config in the store for the next voice message. */
function setDeterministicTranscription(config) {
    store_js_1.store.setState({
        test: { deterministicTranscription: config },
    });
}
function getOpencodeClientForTest(projectDirectory) {
    var client = (0, opencode_js_1.getOpencodeClient)(projectDirectory);
    if (!client) {
        throw new Error('OpenCode client not found for project directory');
    }
    return client;
}
/** Extract text content from an array of parts (filters to TextPart only). */
function getTextFromParts(parts) {
    return parts.flatMap(function (part) {
        if (part.type === 'text') {
            return [part.text];
        }
        return [];
    });
}
/** Get all user-role messages' text parts joined. */
function getUserTexts(messages) {
    return messages
        .filter(function (m) { return m.info.role === 'user'; })
        .flatMap(function (m) { return getTextFromParts(m.parts); });
}
/** Get all assistant-role messages' text parts joined. */
function getAssistantTexts(messages) {
    return messages
        .filter(function (m) { return m.info.role === 'assistant'; })
        .flatMap(function (m) { return getTextFromParts(m.parts); });
}
/**
 * Poll session.messages() until predicate returns true.
 * Used to wait for async session updates (prompts dispatched, responses completed).
 */
function waitForSessionMessages(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var client, start, result, messages, finalResult, finalMessages, userTexts, assistantTexts;
        var _c, _d;
        var projectDirectory = _b.projectDirectory, sessionID = _b.sessionID, timeout = _b.timeout, predicate = _b.predicate, description = _b.description;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    client = getOpencodeClientForTest(projectDirectory);
                    start = Date.now();
                    _e.label = 1;
                case 1:
                    if (!(Date.now() - start < timeout)) return [3 /*break*/, 4];
                    return [4 /*yield*/, client.session.messages({
                            sessionID: sessionID,
                            directory: projectDirectory,
                        })];
                case 2:
                    result = _e.sent();
                    messages = (_c = result.data) !== null && _c !== void 0 ? _c : [];
                    if (predicate(messages)) {
                        return [2 /*return*/, messages];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 3:
                    _e.sent();
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, client.session.messages({
                        sessionID: sessionID,
                        directory: projectDirectory,
                    })];
                case 5:
                    finalResult = _e.sent();
                    finalMessages = (_d = finalResult.data) !== null && _d !== void 0 ? _d : [];
                    userTexts = getUserTexts(finalMessages);
                    assistantTexts = getAssistantTexts(finalMessages);
                    throw new Error("Timed out waiting for session messages (".concat(description, "). ") +
                        "User texts: ".concat(JSON.stringify(userTexts.map(function (t) { return t.slice(0, 80); })), ". ") +
                        "Assistant texts: ".concat(JSON.stringify(assistantTexts.map(function (t) { return t.slice(0, 80); }))));
            }
        });
    });
}
// ── Deterministic provider matchers ──────────────────────────────
// The opencode session uses these to produce canned responses.
function createDeterministicMatchers() {
    // Slow response: emits text-delta after 2s delay, giving voice messages
    // time to arrive while the session is still "running".
    // Uses latestUserTextIncludes (not rawPromptIncludes) so it only matches
    // the current user message, not previous messages in session history.
    var slowResponse = {
        id: 'slow-response',
        priority: 100,
        when: {
            latestUserTextIncludes: 'SLOW_RESPONSE_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'slow' },
                { type: 'text-delta', id: 'slow', delta: 'slow-response-done' },
                { type: 'text-end', id: 'slow' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            // 2s delay on the first text delta — keeps the session in "running" state
            partDelaysMs: [0, 0, 2000, 0, 0],
        },
    };
    // Fast response: completes almost immediately (~100ms)
    var fastResponse = {
        id: 'fast-response',
        priority: 90,
        when: {
            latestUserTextIncludes: 'FAST_RESPONSE_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'fast' },
                { type: 'text-delta', id: 'fast', delta: 'fast-response-done' },
                { type: 'text-end', id: 'fast' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 100, 0, 0, 0],
        },
    };
    // Default: matches any user message (fallback)
    var defaultReply = {
        id: 'default-reply',
        priority: 1,
        when: {
            lastMessageRole: 'user',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'default' },
                { type: 'text-delta', id: 'default', delta: 'session-reply' },
                { type: 'text-end', id: 'default' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 100, 0, 0, 0],
        },
    };
    // Tool followup: when the last message is a tool result
    var toolFollowup = {
        id: 'tool-followup',
        priority: 50,
        when: {
            lastMessageRole: 'tool',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'tool-followup' },
                { type: 'text-delta', id: 'tool-followup', delta: 'tool done' },
                { type: 'text-end', id: 'tool-followup' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    return [slowResponse, fastResponse, toolFollowup, defaultReply];
}
// ── Test constants ───────────────────────────────────────────────
var TEST_USER_ID = '300000000000000777';
var TEXT_CHANNEL_ID = '300000000000000778';
// ── Test suite ───────────────────────────────────────────────────
e2eTest('voice message handling', function () {
    var directories;
    var discord;
    var botClient;
    var previousDefaultVerbosity = store_js_1.store.getState().defaultVerbosity;
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
                            name: 'Voice E2E Guild',
                            ownerId: TEST_USER_ID,
                        },
                        channels: [
                            {
                                id: TEXT_CHANNEL_ID,
                                name: 'voice-e2e',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                        ],
                        users: [
                            {
                                id: TEST_USER_ID,
                                username: 'voice-tester',
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
                    // Reset deterministic transcription
                    setDeterministicTranscription(null);
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
                    store_js_1.store.setState({ defaultVerbosity: previousDefaultVerbosity });
                    if (directories) {
                        node_fs_1.default.rmSync(directories.dataDir, { recursive: true, force: true });
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 5000);
    (0, vitest_1.beforeEach)(function () {
        // Reset deterministic transcription before each test to prevent leakage
        // from a failed test that set it but didn't clean up
        setDeterministicTranscription(null);
    });
    // ── Test 1: Voice message in a channel creates thread + session ──
    (0, vitest_1.test)('voice message in channel creates thread and starts session', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, sessionReply, finalState, _a, messages, userTexts, assistantTexts;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setDeterministicTranscription({
                        transcription: 'Fix the login bug in auth.ts',
                        queueMessage: false,
                    });
                    // Send voice message in the text channel
                    return [4 /*yield*/, discord
                            .channel(TEXT_CHANNEL_ID)
                            .user(TEST_USER_ID)
                            .sendVoiceMessage()
                        // Thread should be created and renamed to the transcription text
                    ];
                case 1:
                    // Send voice message in the text channel
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('Fix the login bug')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    (0, vitest_1.expect)(thread).toBeDefined();
                    th = discord.thread(thread.id);
                    // Bot should post "Transcribing..." then "Transcribed message: ..."
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Transcribing voice message',
                            timeout: 4000,
                        })];
                case 3:
                    // Bot should post "Transcribing..." then "Transcribed message: ..."
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Fix the login bug in auth.ts',
                            timeout: 4000,
                        })
                        // Session should get the transcribed prompt and respond
                    ];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 5:
                    sessionReply = _b.sent();
                    (0, vitest_1.expect)(sessionReply).toBeDefined();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })
                        // Assert thread state has a session and no queued messages after footer.
                    ];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForThreadState)({
                            threadId: thread.id,
                            predicate: function (state) {
                                return Boolean(state.sessionId) && state.queueItems.length === 0;
                            },
                            timeout: 4000,
                            description: 'voice turn settled with empty queue',
                        })];
                case 7:
                    finalState = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })];
                case 8:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 9:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (voice-tester)\n        [attachment: voice-message.ogg]\n        --- from: assistant (TestBot)\n        \uD83C\uDFA4 Transcribing voice message...\n        \uD83D\uDCDD **Transcribed message:** Fix the login bug in auth.ts\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 session-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(finalState.sessionId).toBeDefined();
                    return [4 /*yield*/, waitForSessionMessages({
                            projectDirectory: directories.projectDirectory,
                            sessionID: finalState.sessionId,
                            timeout: 4000,
                            description: 'voice transcription prompt sent to session',
                            predicate: function (all) {
                                var userTexts = getUserTexts(all);
                                return userTexts.some(function (text) { return text.includes('Fix the login bug in auth.ts'); });
                            },
                        })];
                case 10:
                    messages = _b.sent();
                    userTexts = getUserTexts(messages);
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('Fix the login bug in auth.ts'); })).toBe(true);
                    assistantTexts = getAssistantTexts(messages);
                    (0, vitest_1.expect)(assistantTexts.length).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('voice attachment without content type still transcribes and avoids empty prompt dispatch', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, finalState, _a, messages, userTexts;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setDeterministicTranscription({
                        transcription: 'Investigate the missing content type path',
                        queueMessage: false,
                    });
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: '',
                            attachments: [
                                {
                                    id: 'voice-no-content-type',
                                    filename: 'voice-message.ogg',
                                    size: 1024,
                                    url: 'https://fake-cdn.discord.test/voice-no-content-type.ogg',
                                    proxy_url: 'https://fake-cdn.discord.test/voice-no-content-type.ogg',
                                },
                            ],
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('Investigate the missing content type path')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Transcribing voice message',
                            timeout: 4000,
                        })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Investigate the missing content type path',
                            timeout: 4000,
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
                    return [4 /*yield*/, (0, test_utils_js_1.waitForThreadState)({
                            threadId: thread.id,
                            predicate: function (state) {
                                return Boolean(state.sessionId) && state.queueItems.length === 0;
                            },
                            timeout: 4000,
                            description: 'voice attachment without content type settled',
                        })];
                case 6:
                    finalState = _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 7:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (voice-tester)\n        [attachment: voice-message.ogg]\n        --- from: assistant (TestBot)\n        \uD83C\uDFA4 Transcribing voice message...\n        \uD83D\uDCDD **Transcribed message:** Investigate the missing content type path\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 session-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    return [4 /*yield*/, waitForSessionMessages({
                            projectDirectory: directories.projectDirectory,
                            sessionID: finalState.sessionId,
                            timeout: 4000,
                            description: 'voice attachment without content type dispatched once',
                            predicate: function (all) {
                                var userTexts = getUserTexts(all);
                                return userTexts.some(function (text) {
                                    return text.includes('Investigate the missing content type path');
                                });
                            },
                        })];
                case 8:
                    messages = _b.sent();
                    userTexts = getUserTexts(messages);
                    (0, vitest_1.expect)(userTexts).not.toContain('');
                    (0, vitest_1.expect)(userTexts.some(function (text) {
                        return text.includes('Investigate the missing content type path');
                    })).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    // ── Test 2: Voice message in thread with idle session ──
    (0, vitest_1.test)('voice message in thread with idle session starts new request', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, finalState, _a, messages, userTexts, assistantTexts;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // 1. Create a session with a text message first
                    setDeterministicTranscription(null); // text message, no transcription
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'FAST_RESPONSE_MARKER initial setup',
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('FAST_RESPONSE_MARKER')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    // Wait for the initial setup turn to fully complete before sending voice.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'fast-response-done',
                            timeout: 4000,
                        })];
                case 3:
                    // Wait for the initial setup turn to fully complete before sending voice.
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })
                        // 2. Now send a voice message to the idle session
                    ];
                case 4:
                    _b.sent();
                    // 2. Now send a voice message to the idle session
                    setDeterministicTranscription({
                        transcription: 'Add error handling to the parser',
                        queueMessage: false,
                    });
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendVoiceMessage()
                        // Bot should post transcription messages
                    ];
                case 5:
                    _b.sent();
                    // Bot should post transcription messages
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Transcribing voice message',
                            timeout: 4000,
                        })];
                case 6:
                    // Bot should post transcription messages
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Add error handling to the parser',
                            timeout: 4000,
                        })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'session-reply',
                            timeout: 4000,
                        })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'session-reply',
                            afterAuthorId: discord.botUserId,
                        })];
                case 9:
                    _b.sent();
                    finalState = (0, thread_runtime_state_js_1.getThreadState)(thread.id);
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 10:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (voice-tester)\n        FAST_RESPONSE_MARKER initial setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 fast-response-done\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (voice-tester)\n        [attachment: voice-message.ogg]\n        --- from: assistant (TestBot)\n        \uD83C\uDFA4 Transcribing voice message...\n        \uD83D\uDCDD **Transcribed message:** Add error handling to the parser\n        \u2B25 session-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(finalState === null || finalState === void 0 ? void 0 : finalState.sessionId).toBeDefined();
                    if (!(finalState === null || finalState === void 0 ? void 0 : finalState.sessionId)) {
                        throw new Error('Expected final state with sessionId');
                    }
                    (0, vitest_1.expect)(finalState.queueItems.length).toBe(0);
                    return [4 /*yield*/, waitForSessionMessages({
                            projectDirectory: directories.projectDirectory,
                            sessionID: finalState.sessionId,
                            timeout: 4000,
                            description: 'idle session receives voice transcription prompt',
                            predicate: function (all) {
                                var userTexts = getUserTexts(all);
                                return (userTexts.some(function (t) { return t.includes('FAST_RESPONSE_MARKER initial setup'); }) &&
                                    userTexts.some(function (t) { return t.includes('Add error handling to the parser'); }));
                            },
                        })];
                case 11:
                    messages = _b.sent();
                    userTexts = getUserTexts(messages);
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('FAST_RESPONSE_MARKER initial setup'); })).toBe(true);
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('Add error handling to the parser'); })).toBe(true);
                    assistantTexts = getAssistantTexts(messages);
                    (0, vitest_1.expect)(assistantTexts.length).toBeGreaterThanOrEqual(2);
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    // ── Test 3: Voice message queues behind running session (default) ──
    vitest_1.test.skip('voice message with queueMessage=false queues behind running session', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, afterTranscription, hasQueuedAck, midState, finalState, messages, userTexts, assistantTexts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // 1. Start a session with a slow response
                    setDeterministicTranscription(null);
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'SLOW_RESPONSE_MARKER start slow task',
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('SLOW_RESPONSE_MARKER')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = discord.thread(thread.id);
                    // 2. Send voice message while session is running (default: queue)
                    setDeterministicTranscription({
                        transcription: 'Stop and do this instead',
                        queueMessage: false,
                    });
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendVoiceMessage()
                        // 3. Wait for transcription to appear first
                    ];
                case 3:
                    _a.sent();
                    // 3. Wait for transcription to appear first
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Stop and do this instead',
                            timeout: 4000,
                        })
                        // queueMessage=false no longer interrupts by default, so we should NOT
                        // receive the queued-position ack that queueMessage=true sends.
                    ];
                case 4:
                    // 3. Wait for transcription to appear first
                    _a.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 5:
                    afterTranscription = _a.sent();
                    hasQueuedAck = afterTranscription.some(function (m) {
                        return (m.author.id === discord.botUserId &&
                            m.content.includes('Queued at position'));
                    });
                    (0, vitest_1.expect)(hasQueuedAck).toBe(false);
                    midState = (0, thread_runtime_state_js_1.getThreadState)(thread.id);
                    (0, vitest_1.expect)(midState).toBeDefined();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForThreadState)({
                            threadId: thread.id,
                            predicate: function (s) {
                                return s.queueItems.length === 0;
                            },
                            timeout: 8000,
                            description: 'queue empty (default queued voice behavior)',
                        })];
                case 6:
                    finalState = _a.sent();
                    (0, vitest_1.expect)(finalState.sessionId).toBeDefined();
                    (0, vitest_1.expect)(finalState.queueItems.length).toBe(0);
                    return [4 /*yield*/, waitForSessionMessages({
                            projectDirectory: directories.projectDirectory,
                            sessionID: finalState.sessionId,
                            timeout: 4000,
                            description: 'default queue: original prompt + voice prompt',
                            predicate: function (all) {
                                var userTexts = getUserTexts(all);
                                var assistantTexts = getAssistantTexts(all);
                                return (userTexts.some(function (t) { return t.includes('SLOW_RESPONSE_MARKER start slow task'); }) &&
                                    userTexts.some(function (t) { return t.includes('Stop and do this instead'); }) &&
                                    assistantTexts.some(function (t) { return t.includes('slow-response-done'); }) &&
                                    assistantTexts.some(function (t) { return t.includes('session-reply'); }));
                            },
                        })];
                case 7:
                    messages = _a.sent();
                    userTexts = getUserTexts(messages);
                    // Both prompts were sent to the same session
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('SLOW_RESPONSE_MARKER start slow task'); })).toBe(true);
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('Stop and do this instead'); })).toBe(true);
                    assistantTexts = getAssistantTexts(messages);
                    (0, vitest_1.expect)(assistantTexts.some(function (t) { return t.includes('slow-response-done'); })).toBe(true);
                    (0, vitest_1.expect)(assistantTexts.some(function (t) { return t.includes('session-reply'); })).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    // ── Test 4: Voice message with queueMessage=true queues instead of interrupting ──
    (0, vitest_1.test)('voice message with queueMessage=true queues behind running session', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, messagesWithQueueAck, queueAckMessage, dispatchPrefix, messagesWithDispatch, dispatchMessage, finalState, _a, messages, userTexts, assistantTexts, abortedAssistant;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // 1. Start a session with a slow response
                    setDeterministicTranscription(null);
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'SLOW_RESPONSE_MARKER start queued task',
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('start queued task')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    // 2. Send voice message with queueMessage=true (should NOT interrupt)
                    setDeterministicTranscription({
                        transcription: 'Queue this task for later',
                        queueMessage: true,
                    });
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'using deterministic-provider/deterministic-v2',
                            timeout: 4000,
                        })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendVoiceMessage()
                        // 3. Transcription should appear, followed by queue notification
                    ];
                case 4:
                    _b.sent();
                    // 3. Transcription should appear, followed by queue notification
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Queue this task for later',
                            timeout: 4000,
                        })];
                case 5:
                    // 3. Transcription should appear, followed by queue notification
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Queued at position',
                            timeout: 4000,
                        })];
                case 6:
                    messagesWithQueueAck = _b.sent();
                    queueAckMessage = messagesWithQueueAck.find(function (message) {
                        return (message.author.id === discord.botUserId
                            && message.content.includes('Queued at position'));
                    });
                    (0, vitest_1.expect)(queueAckMessage).toBeDefined();
                    // 4. queueMessage=true should not interrupt the in-flight response.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'slow-response-done',
                            timeout: 4000,
                        })];
                case 7:
                    // 4. queueMessage=true should not interrupt the in-flight response.
                    _b.sent();
                    if (!queueAckMessage) {
                        throw new Error('Expected queue ack message');
                    }
                    dispatchPrefix = '» **voice-tester:** Voice message transcription from Discord user:';
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            text: dispatchPrefix,
                            afterMessageId: queueAckMessage.id,
                            timeout: 8000,
                        })];
                case 8:
                    messagesWithDispatch = _b.sent();
                    dispatchMessage = messagesWithDispatch.find(function (message) {
                        return (message.author.id === discord.botUserId
                            && message.content.includes(dispatchPrefix));
                    });
                    (0, vitest_1.expect)(dispatchMessage).toBeDefined();
                    if (!dispatchMessage) {
                        throw new Error('Expected queued dispatch indicator message');
                    }
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            text: 'session-reply',
                            afterMessageId: dispatchMessage.id,
                            timeout: 8000,
                        })
                        // 5. Wait for the slow session to finish AND the queue to drain.
                        // Using waitForThreadState with a compound predicate avoids matching
                        // the transient 'idle' state from run A before run B starts.
                    ];
                case 9:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForThreadState)({
                            threadId: thread.id,
                            predicate: function (s) {
                                return s.queueItems.length === 0;
                            },
                            timeout: 8000,
                            description: 'queue empty (both runs completed)',
                        })];
                case 10:
                    finalState = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'session-reply',
                            afterAuthorId: discord.botUserId,
                        })];
                case 11:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 12:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (voice-tester)\n        SLOW_RESPONSE_MARKER start queued task\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        --- from: user (voice-tester)\n        [attachment: voice-message.ogg]\n        --- from: assistant (TestBot)\n        \uD83C\uDFA4 Transcribing voice message...\n        \uD83D\uDCDD **Transcribed message:** Queue this task for later\n        Queued at position 1\n        \u2B25 slow-response-done\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        \u00BB **voice-tester:** Voice message transcription from Discord user:\n        Queue this task for later\n        \u2B25 session-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(finalState.queueItems.length).toBe(0);
                    return [4 /*yield*/, waitForSessionMessages({
                            projectDirectory: directories.projectDirectory,
                            sessionID: finalState.sessionId,
                            timeout: 4000,
                            description: 'queue: both prompts processed with responses',
                            predicate: function (all) {
                                var userTexts = getUserTexts(all);
                                var assistantTexts = getAssistantTexts(all);
                                return (userTexts.some(function (t) { return t.includes('SLOW_RESPONSE_MARKER start queued task'); }) &&
                                    userTexts.some(function (t) { return t.includes('Queue this task for later'); }) &&
                                    assistantTexts.some(function (t) { return t.includes('slow-response-done'); }) &&
                                    assistantTexts.some(function (t) { return t.includes('session-reply'); }));
                            },
                        })];
                case 13:
                    messages = _b.sent();
                    userTexts = getUserTexts(messages);
                    assistantTexts = getAssistantTexts(messages);
                    // Both prompts sent to the session
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('SLOW_RESPONSE_MARKER start queued task'); })).toBe(true);
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('Queue this task for later'); })).toBe(true);
                    // Both got responses (slow response + default reply for queued message)
                    (0, vitest_1.expect)(assistantTexts.some(function (t) { return t.includes('slow-response-done'); })).toBe(true);
                    (0, vitest_1.expect)(assistantTexts.some(function (t) { return t.includes('session-reply'); })).toBe(true);
                    abortedAssistant = messages.find(function (m) {
                        var _a;
                        return m.info.role === 'assistant' && ((_a = m.info.error) === null || _a === void 0 ? void 0 : _a.name) === 'MessageAbortedError';
                    });
                    (0, vitest_1.expect)(abortedAssistant).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); }, 12000);
    // ── Test 5: Slow transcription finishes after session becomes idle (race condition) ──
    (0, vitest_1.test)('slow transcription completing after session finishes is handled correctly', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, finalState, _a, sessionMessages, userTexts, assistantTexts, abortedAssistant;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // This tests the race condition where:
                    // 1. Session starts with a fast response (~100ms)
                    // 2. Voice message is sent simultaneously with slow transcription (500ms)
                    // 3. The fast session finishes BEFORE transcription completes
                    // 4. When transcription completes, the session is idle → should start new request
                    // 1. Start a session with a fast response
                    setDeterministicTranscription(null);
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'FAST_RESPONSE_MARKER quick task',
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('quick task')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    // Wait for the first run to complete before sending voice.
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    // Wait for the first run to complete before sending voice.
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })
                        // 2. Now send voice message with slow transcription
                        // The fast response completes in ~100ms, but transcription takes 500ms.
                        // By the time transcription returns, the session is already idle.
                    ];
                case 4:
                    _b.sent();
                    // 2. Now send voice message with slow transcription
                    // The fast response completes in ~100ms, but transcription takes 500ms.
                    // By the time transcription returns, the session is already idle.
                    setDeterministicTranscription({
                        transcription: 'Delayed transcription result',
                        queueMessage: false,
                        delayMs: 500,
                    });
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendVoiceMessage()
                        // 3. The transcription should complete after the session finishes
                        // and the transcribed message should be processed as a new request
                    ];
                case 5:
                    _b.sent();
                    // 3. The transcription should complete after the session finishes
                    // and the transcribed message should be processed as a new request
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Delayed transcription result',
                            timeout: 4000,
                        })];
                case 6:
                    // 3. The transcription should complete after the session finishes
                    // and the transcribed message should be processed as a new request
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'Delayed transcription result',
                            afterAuthorId: discord.botUserId,
                        })
                        // 4. Session should process the delayed transcription and settle.
                    ];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForThreadState)({
                            threadId: thread.id,
                            predicate: function (state) {
                                return Boolean(state.sessionId) && state.queueItems.length === 0;
                            },
                            timeout: 4000,
                            description: 'delayed transcription settled with empty queue',
                        })];
                case 8:
                    finalState = _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 9:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (voice-tester)\n        FAST_RESPONSE_MARKER quick task\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 fast-response-done\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (voice-tester)\n        [attachment: voice-message.ogg]\n        --- from: assistant (TestBot)\n        \uD83C\uDFA4 Transcribing voice message...\n        \uD83D\uDCDD **Transcribed message:** Delayed transcription result\n        \u2B25 session-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(finalState.sessionId).toBeDefined();
                    (0, vitest_1.expect)(finalState.queueItems.length).toBe(0);
                    return [4 /*yield*/, waitForSessionMessages({
                            projectDirectory: directories.projectDirectory,
                            sessionID: finalState.sessionId,
                            timeout: 4000,
                            description: 'race: both prompts processed with responses on same session',
                            predicate: function (all) {
                                var userTexts = getUserTexts(all);
                                var aTexts = getAssistantTexts(all);
                                return (userTexts.some(function (t) { return t.includes('FAST_RESPONSE_MARKER quick task'); }) &&
                                    userTexts.some(function (t) { return t.includes('Delayed transcription result'); }) &&
                                    aTexts.length >= 2);
                            },
                        })];
                case 10:
                    sessionMessages = _b.sent();
                    userTexts = getUserTexts(sessionMessages);
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('FAST_RESPONSE_MARKER quick task'); })).toBe(true);
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('Delayed transcription result'); })).toBe(true);
                    assistantTexts = getAssistantTexts(sessionMessages);
                    (0, vitest_1.expect)(assistantTexts.length).toBeGreaterThanOrEqual(2);
                    abortedAssistant = sessionMessages.find(function (m) {
                        var _a;
                        return m.info.role === 'assistant' && ((_a = m.info.error) === null || _a === void 0 ? void 0 : _a.name) === 'MessageAbortedError';
                    });
                    (0, vitest_1.expect)(abortedAssistant).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    // ── Test 6: Slow transcription with queueMessage=true arriving after idle queue drain ──
    (0, vitest_1.test)('slow queued transcription completing after session idle is dispatched', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, finalState, _a, sessionMessages, userTexts, assistantTexts;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Reproduces the bug where a voice message with queueMessage=true has
                    // slow transcription that completes after the session is already idle.
                    // The message gets inserted into the local queue but was never drained
                    // because handleSessionIdle() didn't call tryDrainQueue().
                    //
                    // 1. Send a fast text message → session starts and finishes quickly
                    // 2. Send a voice message with queueMessage=true and slow transcription
                    // 3. Fast session finishes → handleSessionIdle fires
                    // 4. Transcription completes → enqueueViaLocalQueue adds item
                    // 5. tryDrainQueue in handleSessionIdle should pick it up
                    // 1. Start a session with a fast response
                    setDeterministicTranscription(null);
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'FAST_RESPONSE_MARKER fast before queued voice',
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('fast before queued voice')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = discord.thread(thread.id);
                    // Wait for the first run to fully complete before sending the queued voice message.
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    // Wait for the first run to fully complete before sending the queued voice message.
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })
                        // 2. Send voice message with queueMessage=true AND slow transcription.
                        // Session is already idle when this arrives. The transcription delay
                        // means the message enters the local queue after idle has fired.
                    ];
                case 4:
                    _b.sent();
                    // 2. Send voice message with queueMessage=true AND slow transcription.
                    // Session is already idle when this arrives. The transcription delay
                    // means the message enters the local queue after idle has fired.
                    setDeterministicTranscription({
                        transcription: 'Queued voice after idle',
                        queueMessage: true,
                        delayMs: 500,
                    });
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendVoiceMessage()
                        // 3. The transcription should complete, and even though queueMessage=true
                        // routes through the local queue, the item should be drained immediately
                        // because the session is idle. No dispatch indicator (» prefix) appears
                        // because the message is dispatched immediately by enqueueViaLocalQueue's
                        // tryDrainQueue (showIndicator=false for first drain).
                    ];
                case 5:
                    _b.sent();
                    // 3. The transcription should complete, and even though queueMessage=true
                    // routes through the local queue, the item should be drained immediately
                    // because the session is idle. No dispatch indicator (» prefix) appears
                    // because the message is dispatched immediately by enqueueViaLocalQueue's
                    // tryDrainQueue (showIndicator=false for first drain).
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Queued voice after idle',
                            timeout: 4000,
                        })
                        // Wait for the queued message response and footer
                    ];
                case 6:
                    // 3. The transcription should complete, and even though queueMessage=true
                    // routes through the local queue, the item should be drained immediately
                    // because the session is idle. No dispatch indicator (» prefix) appears
                    // because the message is dispatched immediately by enqueueViaLocalQueue's
                    // tryDrainQueue (showIndicator=false for first drain).
                    _b.sent();
                    // Wait for the queued message response and footer
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            text: 'session-reply',
                            timeout: 4000,
                        })];
                case 7:
                    // Wait for the queued message response and footer
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'session-reply',
                            afterAuthorId: discord.botUserId,
                        })
                        // 4. Final state: queue should be empty
                    ];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForThreadState)({
                            threadId: thread.id,
                            predicate: function (state) {
                                return Boolean(state.sessionId) && state.queueItems.length === 0;
                            },
                            timeout: 4000,
                            description: 'queued voice after idle settled with empty queue',
                        })];
                case 9:
                    finalState = _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 10:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (voice-tester)\n        FAST_RESPONSE_MARKER fast before queued voice\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 fast-response-done\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (voice-tester)\n        [attachment: voice-message.ogg]\n        --- from: assistant (TestBot)\n        \uD83C\uDFA4 Transcribing voice message...\n        \uD83D\uDCDD **Transcribed message:** Queued voice after idle\n        \u2B25 session-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(finalState.sessionId).toBeDefined();
                    (0, vitest_1.expect)(finalState.queueItems.length).toBe(0);
                    return [4 /*yield*/, waitForSessionMessages({
                            projectDirectory: directories.projectDirectory,
                            sessionID: finalState.sessionId,
                            timeout: 4000,
                            description: 'queued-voice-idle: both prompts processed',
                            predicate: function (all) {
                                var userTexts = getUserTexts(all);
                                var aTexts = getAssistantTexts(all);
                                return (userTexts.some(function (t) { return t.includes('FAST_RESPONSE_MARKER fast before queued voice'); }) &&
                                    userTexts.some(function (t) { return t.includes('Queued voice after idle'); }) &&
                                    aTexts.length >= 2);
                            },
                        })];
                case 11:
                    sessionMessages = _b.sent();
                    userTexts = getUserTexts(sessionMessages);
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('FAST_RESPONSE_MARKER fast before queued voice'); })).toBe(true);
                    (0, vitest_1.expect)(userTexts.some(function (t) { return t.includes('Queued voice after idle'); })).toBe(true);
                    assistantTexts = getAssistantTexts(sessionMessages);
                    (0, vitest_1.expect)(assistantTexts.length).toBeGreaterThanOrEqual(2);
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
});
