"use strict";
// In-process HTTP server speaking the Hrana v2 protocol.
// Backed by the `libsql` npm package (better-sqlite3 API).
// Binds to the fixed lock port for single-instance enforcement.
//
// Protocol logic is implemented in the `libsqlproxy` package.
// This file handles: server lifecycle, single-instance enforcement,
// auth, and kimaki-specific endpoints (/kimaki/wake, /health).
//
// Hrana v2 protocol spec ("Hrana over HTTP"):
//   https://github.com/tursodatabase/libsql/blob/main/docs/HTTP_V2_SPEC.md
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
exports.markDiscordGatewayReady = markDiscordGatewayReady;
exports.getHranaUrl = getHranaUrl;
exports.startHranaServer = startHranaServer;
exports.stopHranaServer = stopHranaServer;
exports.evictExistingInstance = evictExistingInstance;
var node_fs_1 = require("node:fs");
var node_http_1 = require("node:http");
var node_path_1 = require("node:path");
var node_crypto_1 = require("node:crypto");
var libsql_1 = require("libsql");
var errore = require("errore");
var libsqlproxy_1 = require("libsqlproxy");
var logger_js_1 = require("./logger.js");
var errors_js_1 = require("./errors.js");
var config_js_1 = require("./config.js");
var store_js_1 = require("./store.js");
var hranaLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.DB);
var db = null;
var server = null;
var hranaUrl = null;
var discordGatewayReady = false;
var readyWaiters = [];
function markDiscordGatewayReady() {
    if (discordGatewayReady) {
        return;
    }
    discordGatewayReady = true;
    for (var _i = 0, readyWaiters_1 = readyWaiters; _i < readyWaiters_1.length; _i++) {
        var resolve = readyWaiters_1[_i];
        resolve();
    }
    readyWaiters = [];
}
function waitForDiscordGatewayReady(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var readyPromise, timeoutPromise;
        var timeoutMs = _b.timeoutMs;
        return __generator(this, function (_c) {
            if (discordGatewayReady) {
                return [2 /*return*/, true];
            }
            readyPromise = new Promise(function (resolve) {
                readyWaiters.push(function () {
                    resolve(true);
                });
            });
            timeoutPromise = new Promise(function (resolve) {
                setTimeout(function () {
                    resolve(false);
                }, timeoutMs);
            });
            return [2 /*return*/, Promise.race([readyPromise, timeoutPromise])];
        });
    });
}
function getRequestAuthToken(req) {
    var authorizationHeader = req.headers.authorization;
    if (typeof authorizationHeader === 'string' && authorizationHeader.startsWith('Bearer ')) {
        return authorizationHeader.slice('Bearer '.length);
    }
    return null;
}
// Timing-safe comparison to prevent timing attacks when the hrana server
// is internet-facing (bindAll=true / KIMAKI_INTERNET_REACHABLE_URL set).
function isAuthorizedRequest(req) {
    var expectedToken = store_js_1.store.getState().gatewayToken;
    if (!expectedToken) {
        return false;
    }
    var providedToken = getRequestAuthToken(req);
    if (!providedToken) {
        return false;
    }
    var expectedBuf = Buffer.from(expectedToken, 'utf8');
    var providedBuf = Buffer.from(providedToken, 'utf8');
    if (expectedBuf.length !== providedBuf.length) {
        return false;
    }
    return node_crypto_1.default.timingSafeEqual(expectedBuf, providedBuf);
}
function ensureServiceAuthTokenInStore() {
    var existingToken = store_js_1.store.getState().gatewayToken;
    if (existingToken) {
        return existingToken;
    }
    var generatedToken = "".concat(node_crypto_1.default.randomUUID(), ":").concat(node_crypto_1.default.randomBytes(32).toString('hex'));
    store_js_1.store.setState({ gatewayToken: generatedToken });
    return generatedToken;
}
/**
 * Get the Hrana HTTP URL for injecting into plugin child processes.
 * Returns null if the server hasn't been started yet.
 * Only used for KIMAKI_DB_URL env var in opencode.ts — the bot process
  * itself always uses direct file: access via Drizzle/libSQL.
 */
function getHranaUrl() {
    return hranaUrl;
}
/**
 * Start the in-process Hrana v2 server on the fixed lock port.
 * Handles single-instance enforcement: if the port is occupied, kills the
 * existing process first.
 */
function startHranaServer(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var port, bindHost, serviceAuthToken, database, hranaFetchHandler, hranaNodeHandler, handler, started;
        var _this = this;
        var dbPath = _b.dbPath, _c = _b.bindAll, bindAll = _c === void 0 ? false : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (server && db && hranaUrl)
                        return [2 /*return*/, hranaUrl];
                    port = (0, config_js_1.getLockPort)();
                    bindHost = bindAll ? '0.0.0.0' : '127.0.0.1';
                    serviceAuthToken = ensureServiceAuthTokenInStore();
                    process.env.KIMAKI_DB_AUTH_TOKEN = serviceAuthToken;
                    node_fs_1.default.mkdirSync(node_path_1.default.dirname(dbPath), { recursive: true });
                    return [4 /*yield*/, evictExistingInstance({ port: port })];
                case 1:
                    _d.sent();
                    hranaLogger.log("Starting hrana server on ".concat(bindHost, ":").concat(port, " with db: ").concat(dbPath));
                    database = new libsql_1.default(dbPath);
                    database.exec('PRAGMA journal_mode = WAL');
                    database.exec('PRAGMA busy_timeout = 5000');
                    db = database;
                    hranaFetchHandler = (0, libsqlproxy_1.createLibsqlHandler)((0, libsqlproxy_1.libsqlExecutor)(database));
                    hranaNodeHandler = (0, libsqlproxy_1.createLibsqlNodeHandler)(hranaFetchHandler);
                    handler = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                        var pathname, isReady;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    pathname = new URL(req.url || '/', 'http://localhost').pathname;
                                    if (!(pathname === '/kimaki/wake')) return [3 /*break*/, 2];
                                    if (req.method !== 'POST') {
                                        res.writeHead(405, { 'content-type': 'application/json' });
                                        res.end(JSON.stringify({ error: 'method_not_allowed' }));
                                        return [2 /*return*/];
                                    }
                                    if (!isAuthorizedRequest(req)) {
                                        res.writeHead(401, { 'content-type': 'application/json' });
                                        res.end(JSON.stringify({ error: 'unauthorized' }));
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, waitForDiscordGatewayReady({ timeoutMs: 30000 })];
                                case 1:
                                    isReady = _a.sent();
                                    if (!isReady) {
                                        res.writeHead(504, { 'content-type': 'application/json' });
                                        res.end(JSON.stringify({ ready: false, error: 'timeout_waiting_for_discord_ready' }));
                                        return [2 /*return*/];
                                    }
                                    res.writeHead(200, { 'content-type': 'application/json' });
                                    res.end(JSON.stringify({ ready: true }));
                                    return [2 /*return*/];
                                case 2:
                                    // Health check — no auth required
                                    if (pathname === '/health') {
                                        res.writeHead(200, { 'content-type': 'application/json' });
                                        res.end(JSON.stringify({ status: 'ok', pid: process.pid }));
                                        return [2 /*return*/];
                                    }
                                    // Hrana routes: /v2, /v2/pipeline — require auth
                                    if (pathname === '/v2' || pathname === '/v2/pipeline') {
                                        if (!isAuthorizedRequest(req)) {
                                            res.writeHead(401, { 'content-type': 'application/json' });
                                            res.end(JSON.stringify({ error: 'unauthorized' }));
                                            return [2 /*return*/];
                                        }
                                        hranaNodeHandler(req, res);
                                        return [2 /*return*/];
                                    }
                                    res.writeHead(404);
                                    res.end();
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var srv = node_http_1.default.createServer(handler);
                            srv.on('error', function (err) {
                                var code = 'code' in err ? err.code : undefined;
                                resolve(new errors_js_1.ServerStartError({
                                    port: port,
                                    reason: code === 'EADDRINUSE'
                                        ? "Port ".concat(port, " still in use after eviction")
                                        : err.message,
                                }));
                            });
                            srv.listen(port, bindHost, function () {
                                server = srv;
                                resolve(true);
                            });
                        })];
                case 2:
                    started = _d.sent();
                    if (started instanceof Error) {
                        database.close();
                        db = null;
                        return [2 /*return*/, started];
                    }
                    hranaUrl = "http://127.0.0.1:".concat(port);
                    hranaLogger.log("Hrana server ready at ".concat(hranaUrl));
                    return [2 /*return*/, hranaUrl];
            }
        });
    });
}
/**
 * Stop the Hrana server and close the database.
 */
function stopHranaServer() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!server) return [3 /*break*/, 2];
                    hranaLogger.log('Stopping hrana server...');
                    return [4 /*yield*/, new Promise(function (resolve) {
                            server.close(function () {
                                resolve();
                            });
                        })];
                case 1:
                    _a.sent();
                    server = null;
                    _a.label = 2;
                case 2:
                    if (db) {
                        db.close();
                        db = null;
                    }
                    hranaUrl = null;
                    discordGatewayReady = false;
                    readyWaiters = [];
                    hranaLogger.log('Hrana server stopped');
                    return [2 /*return*/];
            }
        });
    });
}
// ── Single-instance enforcement ──────────────────────────────────────
/**
 * Evict a previous kimaki instance on the lock port.
 * Fetches /health to get the running process PID, then kills it directly.
 * No lsof/netstat/spawnSync needed — the PID comes from the health response.
 */
function evictExistingInstance(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var url, probe, body, targetPid, killResult, attempt, secondProbe;
        var port = _b.port;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    url = "http://127.0.0.1:".concat(port, "/health");
                    return [4 /*yield*/, fetch(url, { signal: AbortSignal.timeout(1000) }).catch(function (e) { return new errors_js_1.FetchError({ url: url, cause: e }); })];
                case 1:
                    probe = _c.sent();
                    if (probe instanceof Error)
                        return [2 /*return*/];
                    return [4 /*yield*/, probe.json().catch(function (e) { return new errors_js_1.FetchError({ url: url, cause: e }); })];
                case 2:
                    body = _c.sent();
                    if (body instanceof Error || !body)
                        return [2 /*return*/];
                    targetPid = body.pid;
                    if (!targetPid || targetPid === process.pid)
                        return [2 /*return*/];
                    hranaLogger.log("Evicting existing kimaki process (PID: ".concat(targetPid, ") on port ").concat(port));
                    killResult = errore.try({
                        try: function () {
                            process.kill(targetPid, 'SIGTERM');
                        },
                        catch: function (e) {
                            return new Error('Failed to send SIGTERM to existing kimaki process', {
                                cause: e,
                            });
                        },
                    });
                    if (killResult instanceof Error) {
                        hranaLogger.log("Failed to kill PID ".concat(targetPid, ": ").concat(killResult.message));
                        return [2 /*return*/];
                    }
                    attempt = 0;
                    _c.label = 3;
                case 3:
                    if (!(attempt < 10)) return [3 /*break*/, 7];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 1000);
                        })
                        // Verify it's gone. Some shutdown paths need a few seconds to run cleanup,
                        // so we avoid SIGKILL and just poll for up to 10 seconds.
                    ];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, fetch(url, {
                            signal: AbortSignal.timeout(2000),
                        }).catch(function (e) { return new errors_js_1.FetchError({ url: url, cause: e }); })];
                case 5:
                    secondProbe = _c.sent();
                    if (secondProbe instanceof Error)
                        return [2 /*return*/];
                    _c.label = 6;
                case 6:
                    attempt += 1;
                    return [3 /*break*/, 3];
                case 7:
                    hranaLogger.log("PID ".concat(targetPid, " still alive after 10s SIGTERM grace period"));
                    return [2 /*return*/];
            }
        });
    });
}
