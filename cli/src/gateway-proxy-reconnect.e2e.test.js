"use strict";
// Gateway-proxy reconnection test.
//
// Parameterized: can test against local digital-twin OR a real production gateway.
//
// Local mode (default):
//   Starts a digital-twin + local gateway-proxy binary, kills and restarts the proxy.
//
// Production mode (env vars):
//   GATEWAY_TEST_URL        - production gateway WS+REST URL (e.g. wss://discord-gateway.kimaki.dev)
//   GATEWAY_TEST_TOKEN      - client token (clientId:secret)
//   GATEWAY_TEST_REDEPLOY   - if "1", runs `fly deploy` between kill/restart instead of local binary
//
// Usage:
//   # Local (needs gateway-proxy binary built):
//   pnpm test --run src/gateway-proxy-reconnect.e2e.test.ts
//
//   # Against production (just connect + kill WS + wait for reconnect):
//   GATEWAY_TEST_URL=wss://discord-gateway.kimaki.dev \
//   GATEWAY_TEST_TOKEN=myclientid:mysecret \
//   KIMAKI_TEST_LOGS=1 \
//   pnpm test --run src/gateway-proxy-reconnect.e2e.test.ts -t "production"
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
var node_net_1 = require("node:net");
var node_child_process_1 = require("node:child_process");
var vitest_1 = require("vitest");
var discord_js_1 = require("discord.js");
var src_1 = require("discord-digital-twin/src");
var undici_1 = require("undici");
// Match production discord-bot.ts settings: increase connection pool and
// disable timeouts so REST calls don't hang during gateway redeploys.
(0, undici_1.setGlobalDispatcher)(new undici_1.Agent({ headersTimeout: 0, bodyTimeout: 0, connections: 500 }));
// --- Config from env ---
var PROD_GATEWAY_URL = process.env['GATEWAY_TEST_URL'] || '';
var PROD_TOKEN = process.env['GATEWAY_TEST_TOKEN'] || '';
var isProdTest = !!(PROD_GATEWAY_URL && PROD_TOKEN);
// --- Constants ---
var DEBUG_BINARY = node_path_1.default.resolve(process.cwd(), '..', 'gateway-proxy', 'target', 'debug', 'gateway-proxy');
var RELEASE_BINARY = node_path_1.default.resolve(process.cwd(), '..', 'gateway-proxy', 'target', 'release', 'gateway-proxy');
var BINARY_PATH = node_fs_1.default.existsSync(DEBUG_BINARY) ? DEBUG_BINARY : RELEASE_BINARY;
var binaryExists = node_fs_1.default.existsSync(BINARY_PATH);
var GUILD_ID = '800000000000000001';
var CHANNEL_ID = '800000000000000010';
var USER_ID = '800000000000000099';
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
                        setTimeout(r, 200);
                    })];
                case 6:
                    _e.sent();
                    return [3 /*break*/, 1];
                case 7: throw new Error("gateway-proxy not ready after ".concat(timeoutMs, "ms"));
            }
        });
    });
}
function startProxy(_a) {
    var _b, _c;
    var configDir = _a.configDir, port = _a.port, twinPort = _a.twinPort, botToken = _a.botToken, gatewayUrl = _a.gatewayUrl, clients = _a.clients;
    var config = {
        log_level: 'debug',
        token: botToken,
        intents: 32511,
        shards: 1,
        port: port,
        validate_token: !clients,
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
    };
    if (clients) {
        config.clients = clients;
    }
    var configPath = node_path_1.default.join(configDir, 'config.json');
    node_fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2));
    var child = (0, node_child_process_1.spawn)(BINARY_PATH, [], {
        cwd: configDir,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: __assign(__assign({}, process.env), { RUST_LOG: 'debug' }),
    });
    var showLogs = !!process.env['KIMAKI_TEST_LOGS'];
    var logLines = [];
    (_b = child.stdout) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
        var line = data.toString().trim();
        if (line) {
            logLines.push("[proxy-stdout] ".concat(line));
            if (showLogs) {
                console.log("[proxy-stdout] ".concat(line));
            }
        }
    });
    (_c = child.stderr) === null || _c === void 0 ? void 0 : _c.on('data', function (data) {
        var line = data.toString().trim();
        if (line) {
            logLines.push("[proxy-stderr] ".concat(line));
            if (showLogs) {
                console.log("[proxy-stderr] ".concat(line));
            }
        }
    });
    child._logLines = logLines;
    return child;
}
function dumpProxyLogs(child) {
    var logLines = child._logLines;
    if (logLines === null || logLines === void 0 ? void 0 : logLines.length) {
        console.log('\n--- proxy logs ---');
        for (var _i = 0, logLines_1 = logLines; _i < logLines_1.length; _i++) {
            var line = logLines_1[_i];
            console.log(line);
        }
        console.log('--- end proxy logs ---\n');
    }
}
function killProxy(child) {
    return new Promise(function (resolve) {
        if (child.killed || child.exitCode !== null) {
            resolve();
            return;
        }
        child.once('exit', function () {
            resolve();
        });
        child.kill('SIGTERM');
    });
}
function createDiscordJsClient(_a) {
    var restUrl = _a.restUrl;
    return new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.MessageContent,
        ],
        partials: [discord_js_1.Partials.Channel, discord_js_1.Partials.Message],
        rest: { api: restUrl },
    });
}
/** Attach all shard event listeners and collect events into an array for diagnosis. */
function attachEventCollector(_a) {
    var client = _a.client, label = _a.label;
    var events = [];
    client.on(discord_js_1.Events.ShardReady, function (shardId) {
        events.push("ShardReady:".concat(shardId));
        console.log("[".concat(label, "] ShardReady shard=").concat(shardId));
    });
    client.on(discord_js_1.Events.ShardReconnecting, function (shardId) {
        events.push("ShardReconnecting:".concat(shardId));
        console.log("[".concat(label, "] ShardReconnecting shard=").concat(shardId));
    });
    client.on(discord_js_1.Events.ShardResume, function (shardId, replayed) {
        events.push("ShardResume:".concat(shardId, ":").concat(replayed));
        console.log("[".concat(label, "] ShardResume shard=").concat(shardId, " replayed=").concat(replayed));
    });
    client.on(discord_js_1.Events.ShardDisconnect, function (event, shardId) {
        events.push("ShardDisconnect:".concat(shardId, ":").concat(event.code));
        console.log("[".concat(label, "] ShardDisconnect shard=").concat(shardId, " code=").concat(event.code));
    });
    client.on(discord_js_1.Events.ShardError, function (error, shardId) {
        events.push("ShardError:".concat(shardId, ":").concat(error.message));
        console.log("[".concat(label, "] ShardError shard=").concat(shardId, " error=").concat(error.message));
    });
    client.on(discord_js_1.Events.Invalidated, function () {
        events.push('Invalidated');
        console.log("[".concat(label, "] Session invalidated"));
    });
    client.on(discord_js_1.Events.Error, function (error) {
        events.push("Error:".concat(error.message));
        console.log("[".concat(label, "] Client error: ").concat(error.message));
    });
    client.on(discord_js_1.Events.Debug, function (info) {
        if (info.includes('close') ||
            info.includes('Close') ||
            info.includes('CLOSE') ||
            info.includes('destroy') ||
            info.includes('session') ||
            info.includes('Session') ||
            info.includes('IDENTIFY') ||
            info.includes('RESUME') ||
            info.includes('Identifying') ||
            info.includes('Resuming') ||
            info.includes('Invalid') ||
            info.includes('Zombie') ||
            info.includes('econnr') ||
            info.includes('fetch') ||
            info.includes('Fetch') ||
            info.includes('error') ||
            info.includes('Error') ||
            info.includes('Gateway Information') ||
            info.includes('fully ready')) {
            events.push("Debug:".concat(info));
            console.log("[".concat(label, "] Debug: ").concat(info));
        }
    });
    return events;
}
function waitForClientReady(_a) {
    var client = _a.client, token = _a.token, _b = _a.timeoutMs, timeoutMs = _b === void 0 ? 30000 : _b;
    return new Promise(function (resolve, reject) {
        var timeout = setTimeout(function () {
            reject(new Error("Client did not become ready within ".concat(timeoutMs, "ms")));
        }, timeoutMs);
        client.once(discord_js_1.Events.ClientReady, function () {
            clearTimeout(timeout);
            resolve();
        });
        client.login(token).catch(reject);
    });
}
function waitForReconnection(_a) {
    var client = _a.client, events = _a.events, label = _a.label, _b = _a.timeoutMs, timeoutMs = _b === void 0 ? 30000 : _b;
    return new Promise(function (resolve) {
        var timeout = setTimeout(function () {
            console.log("[".concat(label, "] TIMEOUT: client did not reconnect within ").concat(timeoutMs, "ms"));
            console.log("[".concat(label, "] Events so far:"), events);
            resolve(false);
        }, timeoutMs);
        client.on(discord_js_1.Events.ShardReady, function () {
            clearTimeout(timeout);
            resolve(true);
        });
        client.on(discord_js_1.Events.ShardResume, function () {
            clearTimeout(timeout);
            resolve(true);
        });
    });
}
// ============================================================================
// Local tests (digital-twin + local binary)
// ============================================================================
var describeLocal = binaryExists ? vitest_1.describe : vitest_1.describe.skip;
describeLocal('gateway-proxy reconnection (local binary)', function () {
    var discord;
    var proxyProcess;
    var client;
    var proxyPort;
    var tmpDir;
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    void (client === null || client === void 0 ? void 0 : client.destroy());
                    if (proxyProcess && !proxyProcess.killed) {
                        proxyProcess.kill('SIGTERM');
                    }
                    return [4 /*yield*/, (discord === null || discord === void 0 ? void 0 : discord.stop().catch(function () { }))];
                case 1:
                    _a.sent();
                    if (tmpDir) {
                        node_fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 5000);
    (0, vitest_1.test)('reconnects after local proxy restart (REST through proxy, clientId:secret)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var CLIENT_ID, CLIENT_SECRET, CLIENT_TOKEN, proxyConfigDir, proxyOpts, events, firstProxy, reconnected;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    tmpDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(process.cwd(), 'tmp', 'gw-reconnect-'));
                    return [4 /*yield*/, getAvailablePort()];
                case 1:
                    proxyPort = _b.sent();
                    CLIENT_ID = 'test-client';
                    CLIENT_SECRET = 'test-secret-12345';
                    CLIENT_TOKEN = "".concat(CLIENT_ID, ":").concat(CLIENT_SECRET);
                    discord = new src_1.DigitalDiscord({
                        guilds: [
                            {
                                id: GUILD_ID,
                                name: 'Reconnect Test Guild',
                                ownerId: USER_ID,
                                channels: [{ id: CHANNEL_ID, name: 'general', type: discord_js_1.ChannelType.GuildText }],
                            },
                        ],
                        users: [{ id: USER_ID, username: 'reconnect-tester' }],
                        gatewayUrlOverride: "ws://127.0.0.1:".concat(proxyPort),
                        dbUrl: "file:".concat(node_path_1.default.join(tmpDir, 'twin.db')),
                    });
                    return [4 /*yield*/, discord.start()];
                case 2:
                    _b.sent();
                    console.log("[local] twin at port ".concat(discord.port, ", proxy will be at ").concat(proxyPort));
                    proxyConfigDir = node_path_1.default.join(tmpDir, 'proxy-config');
                    node_fs_1.default.mkdirSync(proxyConfigDir, { recursive: true });
                    proxyOpts = {
                        configDir: proxyConfigDir,
                        port: proxyPort,
                        twinPort: discord.port,
                        botToken: discord.botToken,
                        gatewayUrl: discord.gatewayUrl,
                        clients: (_a = {}, _a[CLIENT_ID] = { secret: CLIENT_SECRET, guilds: [GUILD_ID] }, _a),
                    };
                    proxyProcess = startProxy(proxyOpts);
                    return [4 /*yield*/, waitForProxyReady({ port: proxyPort })
                        // REST through proxy (matches production gateway mode)
                    ];
                case 3:
                    _b.sent();
                    // REST through proxy (matches production gateway mode)
                    client = createDiscordJsClient({ restUrl: "http://127.0.0.1:".concat(proxyPort, "/api") });
                    events = attachEventCollector({ client: client, label: 'local' });
                    return [4 /*yield*/, waitForClientReady({ client: client, token: CLIENT_TOKEN })];
                case 4:
                    _b.sent();
                    console.log('[local] Client ready');
                    firstProxy = proxyProcess;
                    return [4 /*yield*/, killProxy(proxyProcess)];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, new Promise(function (r) { setTimeout(r, 1000); })
                        // Restart proxy on same port
                    ];
                case 6:
                    _b.sent();
                    // Restart proxy on same port
                    proxyProcess = startProxy(proxyOpts);
                    return [4 /*yield*/, waitForProxyReady({ port: proxyPort })];
                case 7:
                    _b.sent();
                    console.log('[local] Proxy restarted');
                    return [4 /*yield*/, waitForReconnection({ client: client, events: events, label: 'local' })];
                case 8:
                    reconnected = _b.sent();
                    console.log('[local] All events:', events);
                    if (!reconnected) {
                        dumpProxyLogs(firstProxy);
                        dumpProxyLogs(proxyProcess);
                    }
                    (0, vitest_1.expect)(reconnected).toBe(true);
                    (0, vitest_1.expect)(client.isReady()).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); }, 90000);
});
// ============================================================================
// Production test (real gateway proxy on Fly.io)
// ============================================================================
var describeProd = isProdTest ? vitest_1.describe : vitest_1.describe.skip;
describeProd('gateway-proxy reconnection (production)', function () {
    var client;
    (0, vitest_1.afterEach)(function () {
        void (client === null || client === void 0 ? void 0 : client.destroy());
    });
    (0, vitest_1.test)('discord.js reconnects to production gateway after fly deploy', function () { return __awaiter(void 0, void 0, void 0, function () {
        var parsedUrl, restUrl, events, deployResult, reconnected;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parsedUrl = new URL(PROD_GATEWAY_URL);
                    parsedUrl.protocol = parsedUrl.protocol === 'wss:' ? 'https:' : 'http:';
                    restUrl = "".concat(parsedUrl.origin, "/api");
                    console.log("[prod] Gateway URL: ".concat(PROD_GATEWAY_URL));
                    console.log("[prod] REST URL: ".concat(restUrl));
                    console.log("[prod] Token: ".concat(PROD_TOKEN.slice(0, 8), "..."));
                    client = createDiscordJsClient({ restUrl: restUrl });
                    events = attachEventCollector({ client: client, label: 'prod' });
                    // Connect to production gateway
                    return [4 /*yield*/, waitForClientReady({ client: client, token: PROD_TOKEN, timeoutMs: 60000 })];
                case 1:
                    // Connect to production gateway
                    _a.sent();
                    console.log("[prod] Client ready. Guilds: ".concat(client.guilds.cache.size));
                    (0, vitest_1.expect)(client.guilds.cache.size).toBeGreaterThanOrEqual(1);
                    // Deploy the gateway (restarts the Fly machine).
                    // Uses `pnpm run deploy` which cross-compiles Rust locally then deploys
                    // via Dockerfile.fly. Never use `fly deploy` directly.
                    console.log('[prod] Running pnpm run deploy to restart gateway...');
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var _a, _b;
                            var deployChild = (0, node_child_process_1.spawn)('pnpm', ['run', 'deploy'], {
                                cwd: node_path_1.default.resolve(process.cwd(), '..', 'gateway-proxy'),
                                stdio: ['ignore', 'pipe', 'pipe'],
                            });
                            var output = '';
                            (_a = deployChild.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (d) {
                                var line = d.toString();
                                output += line;
                                console.log("[fly] ".concat(line.trim()));
                            });
                            (_b = deployChild.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (d) {
                                var line = d.toString();
                                output += line;
                                console.log("[fly-err] ".concat(line.trim()));
                            });
                            deployChild.on('exit', function (code) {
                                resolve({ code: code !== null && code !== void 0 ? code : 1, output: output });
                            });
                        })];
                case 2:
                    deployResult = _a.sent();
                    console.log("[prod] Deploy exited with code ".concat(deployResult.code));
                    return [4 /*yield*/, waitForReconnection({
                            client: client,
                            events: events,
                            label: 'prod',
                            timeoutMs: 120000,
                        })];
                case 3:
                    reconnected = _a.sent();
                    console.log('[prod] All events:', events);
                    (0, vitest_1.expect)(reconnected).toBe(true);
                    (0, vitest_1.expect)(client.isReady()).toBe(true);
                    (0, vitest_1.expect)(client.guilds.cache.size).toBeGreaterThanOrEqual(1);
                    return [2 /*return*/];
            }
        });
    }); }, 300000);
});
