"use strict";
// Gateway-proxy integration test.
// Starts a discord-digital-twin (fake Discord), a gateway-proxy Rust binary
// in front of it, and the kimaki bot connecting through the proxy.
// Validates that messages create threads, bot replies, and multi-tenant
// guild filtering routes events to the right clients.
//
// Requires the gateway-proxy binary at gateway-proxy/target/release/gateway-proxy.
// If not found, all tests are skipped.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var node_net_1 = require("node:net");
var node_child_process_1 = require("node:child_process");
var vitest_1 = require("vitest");
var discord_js_1 = require("discord.js");
var src_1 = require("discord-digital-twin/src");
var opencode_deterministic_provider_1 = require("opencode-deterministic-provider");
var hrana_server_js_1 = require("./hrana-server.js");
var database_js_1 = require("./database.js");
var config_js_1 = require("./config.js");
var discord_bot_js_1 = require("./discord-bot.js");
var test_utils_js_1 = require("./test-utils.js");
var opencode_js_1 = require("./opencode.js");
var discord_urls_js_1 = require("./discord-urls.js");
var store_js_1 = require("./store.js");
// --- Constants ---
var BINARY_PATH = node_path_1.default.resolve(process.cwd(), '..', 'gateway-proxy', 'target', 'release', 'gateway-proxy');
var TEST_USER_ID = '900000000000000001';
var CHANNEL_1_ID = '900000000000000010';
var CHANNEL_2_ID = '900000000000000020';
var GUILD_1_ID = '900000000000000100';
var GUILD_2_ID = '900000000000000200';
var binaryExists = node_fs_1.default.existsSync(BINARY_PATH);
// --- Helpers ---
function getAvailablePort() {
    return new Promise(function (resolve, reject) {
        var srv = node_net_1.default.createServer();
        srv.listen(0, function () {
            var addr = srv.address();
            if (!addr || typeof addr === 'string') {
                srv.close();
                reject(new Error('Failed to get port'));
                return;
            }
            var port = addr.port;
            srv.close(function () {
                resolve(port);
            });
        });
    });
}
function createRunDirectories() {
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'gateway-proxy-e2e');
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
        ],
        partials: [discord_js_1.Partials.Channel, discord_js_1.Partials.Message, discord_js_1.Partials.User, discord_js_1.Partials.ThreadMember],
        rest: { api: restUrl, version: '10' },
    });
}
function hasStringId(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    if (!('id' in value)) {
        return false;
    }
    return typeof value.id === 'string';
}
function createMatchers() {
    var defaultReply = {
        id: 'default-reply',
        priority: 10,
        when: { lastMessageRole: 'user' },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'reply' },
                { type: 'text-delta', id: 'reply', delta: 'gateway-proxy-reply' },
                { type: 'text-end', id: 'reply' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    return [defaultReply];
}
function waitForProxyReady(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, res, _c;
        var port = _b.port, _d = _b.timeoutMs, timeoutMs = _d === void 0 ? 30000 : _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    start = Date.now();
                    _e.label = 1;
                case 1:
                    if (!(Date.now() - start < timeoutMs)) return [3 /*break*/, 7];
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fetch("http://127.0.0.1:".concat(port, "/shard-count"))];
                case 3:
                    res = _e.sent();
                    if (res.ok) {
                        return [2 /*return*/];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    _c = _e.sent();
                    return [3 /*break*/, 5];
                case 5: return [4 /*yield*/, new Promise(function (r) {
                        setTimeout(r, 500);
                    })];
                case 6:
                    _e.sent();
                    return [3 /*break*/, 1];
                case 7: throw new Error("gateway-proxy not ready after ".concat(timeoutMs, "ms"));
            }
        });
    });
}
function startGatewayProxy(_a) {
    var _b, _c;
    var configDir = _a.configDir, port = _a.port, twinPort = _a.twinPort, botToken = _a.botToken, gatewayUrl = _a.gatewayUrl;
    var config = {
        log_level: 'info',
        token: botToken,
        intents: 32511,
        shards: 1,
        port: port,
        validate_token: true,
        gateway_url: gatewayUrl,
        twilight_http_proxy: "127.0.0.1:".concat(twinPort),
        externally_accessible_url: "ws://127.0.0.1:".concat(port),
        cache: {
            channels: true,
            presences: false,
            emojis: false,
            current_member: true,
            members: false,
            roles: true,
            scheduled_events: false,
            stage_instances: false,
            stickers: false,
            users: false,
            voice_states: false,
        },
        clients: {
            'client-a': {
                secret: 'secret-a',
                guilds: [GUILD_1_ID],
            },
            'client-b': {
                secret: 'secret-b',
                guilds: [GUILD_2_ID],
            },
        },
    };
    var configPath = node_path_1.default.join(configDir, 'config.json');
    node_fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
    var child = (0, node_child_process_1.spawn)(BINARY_PATH, [], {
        cwd: configDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: __assign(__assign({}, process.env), { RUST_LOG: 'debug' }),
    });
    var showLogs = !!process.env['KIMAKI_TEST_LOGS'];
    (_b = child.stdout) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
        var line = data.toString().trim();
        if (line && showLogs) {
            console.log("[gateway-proxy] ".concat(line));
        }
    });
    (_c = child.stderr) === null || _c === void 0 ? void 0 : _c.on('data', function (data) {
        var line = data.toString().trim();
        if (line && showLogs) {
            console.log("[gateway-proxy] ".concat(line));
        }
    });
    return { process: child, configPath: configPath };
}
// --- Test suite ---
var describeIf = binaryExists ? vitest_1.describe : vitest_1.describe.skip;
describeIf('gateway-proxy e2e', function () {
    var discord;
    var proxyProcess;
    var botClient;
    var directories;
    var proxyPort;
    var previousDefaultVerbosity;
    var firstThreadId;
    var testStartTime = Date.now();
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var lockPort, digitalDiscordDbPath, providerNpm, opencodeConfig, proxyConfigDir, proxy, dbPath, hranaResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testStartTime = Date.now();
                    lockPort = (0, test_utils_js_1.chooseLockPort)({ key: CHANNEL_1_ID });
                    directories = createRunDirectories();
                    process.env['KIMAKI_LOCK_PORT'] = String(lockPort);
                    process.env['KIMAKI_VITEST'] = '1';
                    (0, config_js_1.setDataDir)(directories.dataDir);
                    previousDefaultVerbosity = store_js_1.store.getState().defaultVerbosity;
                    store_js_1.store.setState({ defaultVerbosity: 'text_only' });
                    digitalDiscordDbPath = node_path_1.default.join(directories.dataDir, 'digital-discord.db');
                    return [4 /*yield*/, getAvailablePort()
                        // Start digital-twin with 2 guilds, each with a text channel.
                        // gatewayUrlOverride makes GET /gateway/bot return the proxy's URL
                        // so discord.js clients connect through the proxy, not directly to twin.
                    ];
                case 1:
                    proxyPort = _a.sent();
                    // Start digital-twin with 2 guilds, each with a text channel.
                    // gatewayUrlOverride makes GET /gateway/bot return the proxy's URL
                    // so discord.js clients connect through the proxy, not directly to twin.
                    discord = new src_1.DigitalDiscord({
                        guilds: [
                            {
                                id: GUILD_1_ID,
                                name: 'Guild One',
                                ownerId: TEST_USER_ID,
                                channels: [
                                    { id: CHANNEL_1_ID, name: 'general-1', type: discord_js_1.ChannelType.GuildText },
                                ],
                            },
                            {
                                id: GUILD_2_ID,
                                name: 'Guild Two',
                                ownerId: TEST_USER_ID,
                                channels: [
                                    { id: CHANNEL_2_ID, name: 'general-2', type: discord_js_1.ChannelType.GuildText },
                                ],
                            },
                        ],
                        users: [{ id: TEST_USER_ID, username: 'proxy-tester' }],
                        gatewayUrlOverride: "ws://127.0.0.1:".concat(proxyPort),
                        dbUrl: "file:".concat(digitalDiscordDbPath),
                    });
                    return [4 /*yield*/, discord.start()
                        // Write opencode.json with deterministic provider
                    ];
                case 2:
                    _a.sent();
                    providerNpm = node_url_1.default
                        .pathToFileURL(node_path_1.default.resolve(process.cwd(), '..', 'opencode-deterministic-provider', 'src', 'index.ts'))
                        .toString();
                    opencodeConfig = (0, opencode_deterministic_provider_1.buildDeterministicOpencodeConfig)({
                        providerName: 'deterministic-provider',
                        providerNpm: providerNpm,
                        model: 'deterministic-v2',
                        smallModel: 'deterministic-v2',
                        settings: { strict: false, matchers: createMatchers() },
                    });
                    node_fs_1.default.writeFileSync(node_path_1.default.join(directories.projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                    proxyConfigDir = node_path_1.default.join(directories.dataDir, 'proxy');
                    node_fs_1.default.mkdirSync(proxyConfigDir, { recursive: true });
                    proxy = startGatewayProxy({
                        configDir: proxyConfigDir,
                        port: proxyPort,
                        twinPort: discord.port,
                        botToken: discord.botToken,
                        gatewayUrl: discord.gatewayUrl,
                    });
                    proxyProcess = proxy.process;
                    // Wait for proxy to be ready (HTTP server up)
                    return [4 /*yield*/, waitForProxyReady({ port: proxyPort, timeoutMs: 30000 })
                        // Initialize kimaki database
                    ];
                case 3:
                    // Wait for proxy to be ready (HTTP server up)
                    _a.sent();
                    dbPath = node_path_1.default.join(directories.dataDir, 'discord-sessions.db');
                    return [4 /*yield*/, (0, hrana_server_js_1.startHranaServer)({ dbPath: dbPath })];
                case 4:
                    hranaResult = _a.sent();
                    if (hranaResult instanceof Error) {
                        throw hranaResult;
                    }
                    process.env['KIMAKI_DB_URL'] = hranaResult;
                    return [4 /*yield*/, (0, database_js_1.initDatabase)()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setBotToken)(discord.botUserId, discord.botToken)
                        // Register channel 1 with kimaki (bot will create sessions for messages here)
                    ];
                case 6:
                    _a.sent();
                    // Register channel 1 with kimaki (bot will create sessions for messages here)
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: CHANNEL_1_ID,
                            directory: directories.projectDirectory,
                            channelType: 'text',
                        })
                        // Start the kimaki bot connected through the proxy
                    ];
                case 7:
                    // Register channel 1 with kimaki (bot will create sessions for messages here)
                    _a.sent();
                    // Start the kimaki bot connected through the proxy
                    botClient = createDiscordJsClient({ restUrl: discord.restUrl });
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                            token: discord.botToken,
                            appId: discord.botUserId,
                            discordClient: botClient,
                        })];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 120000);
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
                    if (proxyProcess && !proxyProcess.killed) {
                        proxyProcess.kill('SIGTERM');
                    }
                    return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            (0, database_js_1.closeDatabase)().catch(function () { }),
                            (0, hrana_server_js_1.stopHranaServer)().catch(function () { }),
                            discord === null || discord === void 0 ? void 0 : discord.stop().catch(function () { }),
                        ])];
                case 4:
                    _a.sent();
                    delete process.env['KIMAKI_LOCK_PORT'];
                    delete process.env['KIMAKI_DB_URL'];
                    delete process.env['KIMAKI_VITEST'];
                    if (previousDefaultVerbosity) {
                        store_js_1.store.setState({ defaultVerbosity: previousDefaultVerbosity });
                    }
                    if (directories) {
                        node_fs_1.default.rmSync(directories.dataDir, { recursive: true, force: true });
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    (0, vitest_1.test)('message creates thread and bot replies through proxy', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, reply, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, discord.channel(CHANNEL_1_ID).user(TEST_USER_ID).sendMessage({
                        content: 'hello from gateway proxy test',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(CHANNEL_1_ID).waitForThread({
                            timeout: 15000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('hello from gateway proxy test')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    (0, vitest_1.expect)(thread).toBeDefined();
                    (0, vitest_1.expect)(thread.id).toBeTruthy();
                    firstThreadId = thread.id;
                    return [4 /*yield*/, discord.thread(thread.id).waitForBotReply({ timeout: 5000 })];
                case 3:
                    reply = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 5000,
                        })];
                case 4:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (proxy-tester)\n        hello from gateway proxy test\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 gateway-proxy-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(reply).toBeDefined();
                    (0, vitest_1.expect)(reply.content.trim().length).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('follow-up message in thread gets bot reply', function () { return __awaiter(void 0, void 0, void 0, function () {
        var existingMessages, existingIds, reply, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, discord.thread(firstThreadId).getMessages()];
                case 1:
                    existingMessages = _b.sent();
                    existingIds = new Set(existingMessages.map(function (m) { return m.id; }));
                    return [4 /*yield*/, discord.thread(firstThreadId).user(TEST_USER_ID).sendMessage({
                            content: 'follow up through proxy',
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, discord.thread(firstThreadId).waitForMessage({
                            predicate: function (m) { return !existingIds.has(m.id) && m.author.id === discord.botUserId; },
                        })];
                case 3:
                    reply = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: firstThreadId,
                            timeout: 4000,
                            afterMessageIncludes: 'follow up through proxy',
                            afterAuthorId: TEST_USER_ID,
                        })];
                case 4:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(firstThreadId).text()];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (proxy-tester)\n        hello from gateway proxy test\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 gateway-proxy-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (proxy-tester)\n        follow up through proxy\n        --- from: assistant (TestBot)\n        \u2B25 gateway-proxy-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(reply).toBeDefined();
                    (0, vitest_1.expect)(reply.content.trim().length).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    // Reconnect test lives in gateway-proxy-reconnect.e2e.test.ts.
    // It was here before but kills the proxy mid-suite, breaking shared
    // state (bot/proxy connection) for all subsequent tests.
    (0, vitest_1.test)('shell command via ! prefix in thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var existingMessages, existingIds, reply, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, discord.thread(firstThreadId).getMessages()];
                case 1:
                    existingMessages = _b.sent();
                    existingIds = new Set(existingMessages.map(function (m) { return m.id; }));
                    return [4 /*yield*/, discord.thread(firstThreadId).user(TEST_USER_ID).sendMessage({
                            content: '!echo proxy-shell-test',
                        })
                        // The bot replies with a loading message then edits it with the result.
                        // The predicate waits for the edited version containing "exited with".
                    ];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, discord.thread(firstThreadId).waitForMessage({
                            predicate: function (m) {
                                return !existingIds.has(m.id) &&
                                    m.author.id === discord.botUserId &&
                                    m.content.includes('exited with');
                            },
                        })];
                case 3:
                    reply = _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(firstThreadId).text()];
                case 4:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (proxy-tester)\n        hello from gateway proxy test\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 gateway-proxy-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (proxy-tester)\n        follow up through proxy\n        --- from: assistant (TestBot)\n        \u2B25 gateway-proxy-reply\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (proxy-tester)\n        !echo proxy-shell-test\n        --- from: assistant (TestBot)\n        `echo proxy-shell-test` exited with 0\n        ```\n        proxy-shell-test\n        ```\"\n      ");
                    (0, vitest_1.expect)(reply.content).toContain('proxy-shell-test');
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('second message creates separate thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var existingThreadIds, _a, thread, reply, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = Set.bind;
                    return [4 /*yield*/, discord.channel(CHANNEL_1_ID).getThreads()];
                case 1:
                    existingThreadIds = new (_a.apply(Set, [void 0, (_c.sent()).map(function (thread) {
                            return thread.id;
                        })]))();
                    return [4 /*yield*/, discord.channel(CHANNEL_1_ID).user(TEST_USER_ID).sendMessage({
                            content: 'second message through proxy',
                        })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, discord.channel(CHANNEL_1_ID).waitForThread({
                            predicate: function (t) {
                                return !existingThreadIds.has(t.id) && t.id !== firstThreadId;
                            },
                        })];
                case 3:
                    thread = _c.sent();
                    (0, vitest_1.expect)(thread).toBeDefined();
                    (0, vitest_1.expect)(thread.id).not.toBe(firstThreadId);
                    return [4 /*yield*/, discord.thread(thread.id).waitForBotReply()];
                case 4:
                    reply = _c.sent();
                    _b = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 5:
                    _b.apply(void 0, [_c.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (proxy-tester)\n        second message through proxy\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(reply).toBeDefined();
                    (0, vitest_1.expect)(reply.content.trim().length).toBeGreaterThan(0);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('guild-2 message does not create thread (guild isolation)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var threads;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, discord.channel(CHANNEL_2_ID).user(TEST_USER_ID).sendMessage({
                        content: 'should not create thread in guild 2',
                    })
                    // Brief wait for events to propagate through the local system.
                    // The proxy filters guild-2 events away from client-a, so no thread
                    // should be created. 100ms is more than enough for local event routing.
                ];
                case 1:
                    _a.sent();
                    // Brief wait for events to propagate through the local system.
                    // The proxy filters guild-2 events away from client-a, so no thread
                    // should be created. 100ms is more than enough for local event routing.
                    return [4 /*yield*/, new Promise(function (r) {
                            setTimeout(r, 100);
                        })];
                case 2:
                    // Brief wait for events to propagate through the local system.
                    // The proxy filters guild-2 events away from client-a, so no thread
                    // should be created. 100ms is more than enough for local event routing.
                    _a.sent();
                    return [4 /*yield*/, discord.channel(CHANNEL_2_ID).getThreads()];
                case 3:
                    threads = _a.sent();
                    (0, vitest_1.expect)(threads).toHaveLength(0);
                    return [2 /*return*/];
            }
        });
    }); }, 5000);
    (0, vitest_1.test)('slash command routes INTERACTION_CREATE through proxy', function () { return __awaiter(void 0, void 0, void 0, function () {
        var interactionId, ack;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, discord
                        .channel(CHANNEL_1_ID)
                        .user(TEST_USER_ID)
                        .runSlashCommand({
                        name: 'run-shell-command',
                        options: [{ name: 'command', type: 3, value: 'echo proxy-slash-test' }],
                    })];
                case 1:
                    interactionId = (_a.sent()).id;
                    return [4 /*yield*/, discord.channel(CHANNEL_1_ID).waitForInteractionAck({
                            interactionId: interactionId,
                        })];
                case 2:
                    ack = _a.sent();
                    (0, vitest_1.expect)(ack.acknowledged).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('REST client operations work through proxy and enforce guild scope', function () { return __awaiter(void 0, void 0, void 0, function () {
        var previousBaseUrl, botRest, clientRest, posted, thread, channel, guildChannels, forbiddenGuildResponse, gatewayInfo, me;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    previousBaseUrl = store_js_1.store.getState().discordBaseUrl;
                    store_js_1.store.setState({ discordBaseUrl: "http://127.0.0.1:".concat(proxyPort) });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 9, 10]);
                    botRest = (0, discord_urls_js_1.createDiscordRest)(discord.botToken);
                    clientRest = (0, discord_urls_js_1.createDiscordRest)('client-a:secret-a');
                    return [4 /*yield*/, botRest.post(discord_js_1.Routes.channelMessages(CHANNEL_1_ID), {
                            body: { content: 'rest-proxy-test-message' },
                        })];
                case 2:
                    posted = _a.sent();
                    (0, vitest_1.expect)(hasStringId(posted)).toBe(true);
                    if (!hasStringId(posted)) {
                        throw new Error('Expected REST message create response to include id');
                    }
                    return [4 /*yield*/, botRest.post(discord_js_1.Routes.threads(CHANNEL_1_ID, posted.id), {
                            body: { name: 'rest-proxy-thread' },
                        })];
                case 3:
                    thread = _a.sent();
                    (0, vitest_1.expect)(hasStringId(thread)).toBe(true);
                    return [4 /*yield*/, botRest.get(discord_js_1.Routes.channel(CHANNEL_1_ID))];
                case 4:
                    channel = _a.sent();
                    (0, vitest_1.expect)(hasStringId(channel)).toBe(true);
                    return [4 /*yield*/, clientRest.get(discord_js_1.Routes.guildChannels(GUILD_1_ID))];
                case 5:
                    guildChannels = _a.sent();
                    (0, vitest_1.expect)(Array.isArray(guildChannels)).toBe(true);
                    return [4 /*yield*/, fetch("http://127.0.0.1:".concat(proxyPort, "/api/v10").concat(discord_js_1.Routes.guildChannels(GUILD_2_ID)), {
                            method: 'GET',
                            headers: {
                                Authorization: 'Bot client-a:secret-a',
                            },
                        })];
                case 6:
                    forbiddenGuildResponse = _a.sent();
                    (0, vitest_1.expect)(forbiddenGuildResponse.status).toBe(403);
                    return [4 /*yield*/, clientRest.get(discord_js_1.Routes.gatewayBot())];
                case 7:
                    gatewayInfo = _a.sent();
                    (0, vitest_1.expect)(typeof gatewayInfo).toBe('object');
                    return [4 /*yield*/, clientRest.get(discord_js_1.Routes.user('@me'))];
                case 8:
                    me = _a.sent();
                    (0, vitest_1.expect)(hasStringId(me)).toBe(true);
                    return [3 /*break*/, 10];
                case 9:
                    store_js_1.store.setState({ discordBaseUrl: previousBaseUrl });
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); }, 15000);
});
