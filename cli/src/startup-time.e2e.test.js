"use strict";
// Measures time-to-ready for the kimaki Discord bot startup.
// Used as a baseline to track startup performance and guide optimizations
// for scale-to-zero deployments where cold start time is critical.
//
// Measures each phase independently:
//   1. Hrana server start (DB + lock port)
//   2. Database init (Drizzle/libSQL connect via HTTP)
//   3. Discord.js client creation + login (Gateway READY)
//   4. startDiscordBot (event handlers + markDiscordGatewayReady)
//   5. OpenCode server startup (spawn + health poll)
//   6. Total wall-clock time from zero to "bot ready"
//
// Uses discord-digital-twin so Gateway READY is instant (no real Discord).
// OpenCode startup uses deterministic provider (no real LLM).
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
var discord_bot_js_1 = require("./discord-bot.js");
var database_js_1 = require("./database.js");
var hrana_server_js_1 = require("./hrana-server.js");
var opencode_js_1 = require("./opencode.js");
var test_utils_js_1 = require("./test-utils.js");
function createRunDirectories() {
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'startup-time-e2e');
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
function createMinimalMatchers() {
    return [
        {
            id: 'startup-test-reply',
            priority: 10,
            when: {
                lastMessageRole: 'user',
                rawPromptIncludes: 'startup-test',
            },
            then: {
                parts: [
                    { type: 'stream-start', warnings: [] },
                    { type: 'text-start', id: 'startup-reply' },
                    { type: 'text-delta', id: 'startup-reply', delta: 'ok' },
                    { type: 'text-end', id: 'startup-reply' },
                    {
                        type: 'finish',
                        finishReason: 'stop',
                        usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                    },
                ],
            },
        },
    ];
}
var TEST_USER_ID = '900000000000000777';
var TEXT_CHANNEL_ID = '900000000000000778';
(0, vitest_1.describe)('startup time measurement', function () {
    var directories;
    var discord;
    var botClient = null;
    var testStartTime = Date.now();
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
                    return [4 /*yield*/, Promise.all([
                            (0, opencode_js_1.stopOpencodeServer)().catch(function () { }),
                            (0, database_js_1.closeDatabase)().catch(function () { }),
                            (0, hrana_server_js_1.stopHranaServer)().catch(function () { }),
                            discord === null || discord === void 0 ? void 0 : discord.stop().catch(function () { }),
                        ])];
                case 3:
                    _a.sent();
                    delete process.env['KIMAKI_LOCK_PORT'];
                    delete process.env['KIMAKI_DB_URL'];
                    if (directories) {
                        node_fs_1.default.rmSync(directories.dataDir, { recursive: true, force: true });
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 5000);
    (0, vitest_1.test)('measures per-phase startup timings', function () { return __awaiter(void 0, void 0, void 0, function () {
        var lockPort, digitalDiscordDbPath, providerNpm, opencodeConfig, totalStart, hranaStart, dbPath, hranaResult, hranaMs, dbStart, dbMs, loginStart, loginMs, botStart, botMs, opencodeStart, opencodeResult, opencodeMs, totalMs, timings, thread, reply;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    directories = createRunDirectories();
                    lockPort = (0, test_utils_js_1.chooseLockPort)({ key: 'startup-time-e2e' });
                    process.env['KIMAKI_LOCK_PORT'] = String(lockPort);
                    (0, config_js_1.setDataDir)(directories.dataDir);
                    digitalDiscordDbPath = node_path_1.default.join(directories.dataDir, 'digital-discord.db');
                    discord = new src_1.DigitalDiscord({
                        guild: {
                            name: 'Startup Time Guild',
                            ownerId: TEST_USER_ID,
                        },
                        channels: [
                            {
                                id: TEXT_CHANNEL_ID,
                                name: 'startup-time',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                        ],
                        users: [
                            {
                                id: TEST_USER_ID,
                                username: 'startup-tester',
                            },
                        ],
                        dbUrl: "file:".concat(digitalDiscordDbPath),
                    });
                    return [4 /*yield*/, discord.start()
                        // Write deterministic opencode config
                    ];
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
                            matchers: createMinimalMatchers(),
                        },
                    });
                    node_fs_1.default.writeFileSync(node_path_1.default.join(directories.projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                    totalStart = performance.now();
                    hranaStart = performance.now();
                    dbPath = node_path_1.default.join(directories.dataDir, 'discord-sessions.db');
                    return [4 /*yield*/, (0, hrana_server_js_1.startHranaServer)({ dbPath: dbPath })];
                case 2:
                    hranaResult = _a.sent();
                    if (hranaResult instanceof Error) {
                        throw hranaResult;
                    }
                    process.env['KIMAKI_DB_URL'] = hranaResult;
                    hranaMs = performance.now() - hranaStart;
                    dbStart = performance.now();
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
                    dbMs = performance.now() - dbStart;
                    loginStart = performance.now();
                    botClient = createDiscordJsClient({ restUrl: discord.restUrl });
                    loginMs = Math.round(performance.now() - loginStart);
                    botStart = performance.now();
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                            token: discord.botToken,
                            appId: discord.botUserId,
                            discordClient: botClient,
                        })];
                case 6:
                    _a.sent();
                    botMs = performance.now() - botStart;
                    opencodeStart = performance.now();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directories.projectDirectory)];
                case 7:
                    opencodeResult = _a.sent();
                    if (opencodeResult instanceof Error) {
                        throw opencodeResult;
                    }
                    opencodeMs = performance.now() - opencodeStart;
                    totalMs = performance.now() - totalStart;
                    timings = {
                        hranaServerMs: Math.round(hranaMs),
                        databaseInitMs: Math.round(dbMs),
                        discordLoginMs: Math.round(loginMs),
                        startDiscordBotMs: Math.round(botMs),
                        opencodeServerMs: Math.round(opencodeMs),
                        totalMs: Math.round(totalMs),
                    };
                    // Print timings for CI/local visibility
                    console.log('\n┌─────────────────────────────────────────────┐');
                    console.log('│         Kimaki Startup Time Breakdown       │');
                    console.log('├─────────────────────────────────────────────┤');
                    console.log("\u2502  Hrana server:       ".concat(String(timings.hranaServerMs).padStart(6), " ms             \u2502"));
                    console.log("\u2502  Database init:      ".concat(String(timings.databaseInitMs).padStart(6), " ms             \u2502"));
                    console.log("\u2502  Discord.js login:   ".concat(String(timings.discordLoginMs).padStart(6), " ms             \u2502"));
                    console.log("\u2502  startDiscordBot:    ".concat(String(timings.startDiscordBotMs).padStart(6), " ms             \u2502"));
                    console.log("\u2502  OpenCode server:    ".concat(String(timings.opencodeServerMs).padStart(6), " ms             \u2502"));
                    console.log('├─────────────────────────────────────────────┤');
                    console.log("\u2502  TOTAL:              ".concat(String(timings.totalMs).padStart(6), " ms             \u2502"));
                    console.log('└─────────────────────────────────────────────┘\n');
                    // Sanity assertions — these are baselines, not targets yet.
                    // Each phase should complete (no infinite hang).
                    (0, vitest_1.expect)(timings.hranaServerMs).toBeLessThan(5000);
                    (0, vitest_1.expect)(timings.databaseInitMs).toBeLessThan(5000);
                    (0, vitest_1.expect)(timings.discordLoginMs).toBeLessThan(10000);
                    (0, vitest_1.expect)(timings.startDiscordBotMs).toBeLessThan(5000);
                    (0, vitest_1.expect)(timings.opencodeServerMs).toBeLessThan(30000);
                    (0, vitest_1.expect)(timings.totalMs).toBeLessThan(60000);
                    // Verify the bot is actually functional by sending a message
                    // and getting a response (validates the full pipeline works)
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'startup-test ping',
                        })];
                case 8:
                    // Verify the bot is actually functional by sending a message
                    // and getting a response (validates the full pipeline works)
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 10000,
                        })];
                case 9:
                    thread = _a.sent();
                    return [4 /*yield*/, discord.thread(thread.id).waitForBotReply({
                            timeout: 30000,
                        })];
                case 10:
                    reply = _a.sent();
                    (0, vitest_1.expect)(reply.content.length).toBeGreaterThan(0);
                    (0, vitest_1.expect)(thread.id.length).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); }, 120000);
    (0, vitest_1.test)('measures parallel startup (discord + opencode simultaneously)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var parallelStart, _a, discordResult, opencodeResult, parallelMs, maxSingle;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // This test reuses the infrastructure from test 1 (hrana, db already up)
                // to measure what happens when we run Discord login + OpenCode in parallel.
                // In a fresh cold start, hrana+db init would add ~50ms on top.
                // Stop opencode server from test 1 so we get a fresh measurement
                return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)().catch(function () { })
                    // Destroy and recreate bot client for a clean login measurement
                ];
                case 1:
                    // This test reuses the infrastructure from test 1 (hrana, db already up)
                    // to measure what happens when we run Discord login + OpenCode in parallel.
                    // In a fresh cold start, hrana+db init would add ~50ms on top.
                    // Stop opencode server from test 1 so we get a fresh measurement
                    _b.sent();
                    // Destroy and recreate bot client for a clean login measurement
                    if (botClient) {
                        void botClient.destroy();
                        botClient = null;
                    }
                    parallelStart = performance.now();
                    return [4 /*yield*/, Promise.all([
                            // Discord path: create client, login, start bot
                            (function () { return __awaiter(void 0, void 0, void 0, function () {
                                var loginStart, client;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            loginStart = performance.now();
                                            client = createDiscordJsClient({ restUrl: discord.restUrl });
                                            return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                                                    token: discord.botToken,
                                                    appId: discord.botUserId,
                                                    discordClient: client,
                                                })];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/, {
                                                    client: client,
                                                    totalMs: Math.round(performance.now() - loginStart),
                                                }];
                                    }
                                });
                            }); })(),
                            // OpenCode path: spawn server + wait for health
                            (function () { return __awaiter(void 0, void 0, void 0, function () {
                                var start, result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            start = performance.now();
                                            return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directories.projectDirectory)];
                                        case 1:
                                            result = _a.sent();
                                            if (result instanceof Error) {
                                                throw result;
                                            }
                                            return [2 /*return*/, { ms: Math.round(performance.now() - start) }];
                                    }
                                });
                            }); })(),
                        ])];
                case 2:
                    _a = _b.sent(), discordResult = _a[0], opencodeResult = _a[1];
                    parallelMs = Math.round(performance.now() - parallelStart);
                    botClient = discordResult.client;
                    console.log('\n┌─────────────────────────────────────────────┐');
                    console.log('│      Parallel Startup Time Breakdown        │');
                    console.log('├─────────────────────────────────────────────┤');
                    console.log("\u2502  Discord login+bot:  ".concat(String(discordResult.totalMs).padStart(6), " ms             \u2502"));
                    console.log("\u2502  OpenCode server:    ".concat(String(opencodeResult.ms).padStart(6), " ms             \u2502"));
                    console.log('├─────────────────────────────────────────────┤');
                    console.log("\u2502  PARALLEL TOTAL:     ".concat(String(parallelMs).padStart(6), " ms             \u2502"));
                    console.log("\u2502  (vs sequential:     ".concat(String(discordResult.totalMs + opencodeResult.ms).padStart(6), " ms)            \u2502"));
                    console.log('└─────────────────────────────────────────────┘\n');
                    maxSingle = Math.max(discordResult.totalMs, opencodeResult.ms);
                    (0, vitest_1.expect)(parallelMs).toBeLessThan(maxSingle + 500);
                    return [2 /*return*/];
            }
        });
    }); }, 120000);
});
