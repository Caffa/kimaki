"use strict";
// Local caching proxy for OpenCode provider HTTP traffic.
// Proxies provider requests (Anthropic-compatible by default) and stores
// responses in a local libsql-backed SQLite cache for deterministic replays.
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
exports.CachedOpencodeProviderProxy = void 0;
var client_1 = require("@libsql/client");
var eventsource_parser_1 = require("eventsource-parser");
var node_crypto_1 = require("node:crypto");
var node_fs_1 = require("node:fs");
var node_http_1 = require("node:http");
var node_path_1 = require("node:path");
var spiceflow_1 = require("spiceflow");
var CACHE_TABLE = 'cached_provider_responses';
var DEFAULT_TARGET_BASE_URL = 'https://api.anthropic.com';
var DEFAULT_HOST = '127.0.0.1';
var HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
]);
var CachedOpencodeProviderProxy = /** @class */ (function () {
    function CachedOpencodeProviderProxy(_a) {
        var _b = _a === void 0 ? {} : _a, cacheDbPath = _b.cacheDbPath, targetBaseUrl = _b.targetBaseUrl, listenHost = _b.listenHost, listenPort = _b.listenPort, cacheMethods = _b.cacheMethods, apiKey = _b.apiKey, authorization = _b.authorization, upstreamApiKey = _b.upstreamApiKey, upstreamApiKeyHeader = _b.upstreamApiKeyHeader, upstreamAuthorization = _b.upstreamAuthorization, additionalHeaders = _b.additionalHeaders, streamChunkDelayMs = _b.streamChunkDelayMs;
        var _this = this;
        this.database = null;
        this.server = null;
        this.runningPort = null;
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.cacheDbPath =
            cacheDbPath ||
                node_path_1.default.resolve(process.cwd(), 'tmp', 'opencode-provider-cache.db');
        this.targetBaseUrl = targetBaseUrl || DEFAULT_TARGET_BASE_URL;
        this.listenHost = listenHost || DEFAULT_HOST;
        this.listenPort = listenPort || 0;
        this.cacheMethods = new Set((cacheMethods || ['POST']).map(function (method) {
            return method.toUpperCase();
        }));
        this.apiKey = apiKey;
        this.authorization = authorization;
        this.upstreamApiKey = upstreamApiKey;
        this.upstreamApiKeyHeader = upstreamApiKeyHeader;
        this.upstreamAuthorization = upstreamAuthorization;
        this.additionalHeaders = additionalHeaders || {};
        this.streamChunkDelayMs = streamChunkDelayMs || 0;
        this.app = new spiceflow_1.Spiceflow().use(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var request = _b.request;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.handleRequest({ request: request })];
            });
        }); });
    }
    /** Change the SSE chunk delay at runtime (e.g. between test steps). */
    CachedOpencodeProviderProxy.prototype.setStreamChunkDelayMs = function (ms) {
        this.streamChunkDelayMs = ms;
    };
    Object.defineProperty(CachedOpencodeProviderProxy.prototype, "port", {
        get: function () {
            return this.runningPort;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CachedOpencodeProviderProxy.prototype, "baseUrl", {
        get: function () {
            var port = this.runningPort;
            if (!port) {
                return '';
            }
            return "http://".concat(this.listenHost, ":").concat(port);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CachedOpencodeProviderProxy.prototype, "isRunning", {
        get: function () {
            return this.server !== null && this.runningPort !== null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(CachedOpencodeProviderProxy.prototype, "stats", {
        get: function () {
            return {
                cacheHits: this.cacheHits,
                cacheMisses: this.cacheMisses,
            };
        },
        enumerable: false,
        configurable: true
    });
    CachedOpencodeProviderProxy.prototype.getCacheEntryCount = function () {
        return __awaiter(this, void 0, void 0, function () {
            var database, result, total, parsed;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.ensureDatabaseReady()];
                    case 1:
                        _b.sent();
                        database = this.database;
                        if (!database) {
                            return [2 /*return*/, 0];
                        }
                        return [4 /*yield*/, database.execute("\n      SELECT COUNT(*) AS total\n      FROM ".concat(CACHE_TABLE, "\n    "))];
                    case 2:
                        result = _b.sent();
                        total = (_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a['total'];
                        if (typeof total === 'number') {
                            return [2 /*return*/, total];
                        }
                        if (typeof total === 'bigint') {
                            return [2 /*return*/, Number(total)];
                        }
                        if (typeof total === 'string') {
                            parsed = Number(total);
                            if (Number.isFinite(parsed)) {
                                return [2 /*return*/, parsed];
                            }
                        }
                        return [2 /*return*/, 0];
                }
            });
        });
    };
    CachedOpencodeProviderProxy.prototype.getLatestCachedRequest = function () {
        return __awaiter(this, void 0, void 0, function () {
            var database, result, firstRow, endpoint, method, requestBody, latest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureDatabaseReady()];
                    case 1:
                        _a.sent();
                        database = this.database;
                        if (!database) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, database.execute("\n      SELECT endpoint, method, request_body\n      FROM ".concat(CACHE_TABLE, "\n      ORDER BY created_at DESC\n      LIMIT 1\n    "))];
                    case 2:
                        result = _a.sent();
                        firstRow = result.rows[0];
                        if (!firstRow) {
                            return [2 /*return*/, null];
                        }
                        endpoint = firstRow['endpoint'];
                        method = firstRow['method'];
                        requestBody = firstRow['request_body'];
                        if (typeof endpoint !== 'string' ||
                            typeof method !== 'string' ||
                            typeof requestBody !== 'string') {
                            return [2 /*return*/, null];
                        }
                        latest = {
                            endpoint: endpoint,
                            method: method,
                            requestBody: requestBody,
                        };
                        return [2 /*return*/, latest];
                }
            });
        });
    };
    CachedOpencodeProviderProxy.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var server, address;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isRunning) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.ensureDatabaseReady()];
                    case 1:
                        _a.sent();
                        server = node_http_1.default.createServer(function (req, res) {
                            return _this.app.handleForNode(req, res);
                        });
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                server.once('error', reject);
                                server.listen(_this.listenPort, _this.listenHost, function () {
                                    resolve();
                                });
                            })];
                    case 2:
                        _a.sent();
                        address = server.address();
                        if (!address || typeof address === 'string') {
                            throw new Error('Could not resolve proxy listen port');
                        }
                        this.server = server;
                        this.runningPort = address.port;
                        return [2 /*return*/];
                }
            });
        });
    };
    CachedOpencodeProviderProxy.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var server;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        server = this.server;
                        if (!server) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                server.close(function (error) {
                                    if (error) {
                                        reject(error);
                                        return;
                                    }
                                    resolve();
                                });
                            })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        this.server = null;
                        this.runningPort = null;
                        if (this.database) {
                            this.database.close();
                        }
                        this.database = null;
                        return [2 /*return*/];
                }
            });
        });
    };
    CachedOpencodeProviderProxy.prototype.buildOpencodeConfig = function (_a) {
        var _b, _c, _d;
        var model = _a.model, smallModel = _a.smallModel, providerName = _a.providerName, providerNpm = _a.providerNpm;
        var chosenProviderName = providerName || 'cached-provider';
        var chosenProviderNpm = providerNpm || '@ai-sdk/anthropic';
        if (!this.baseUrl) {
            throw new Error('Proxy must be started before building OpenCode config');
        }
        return __assign({ $schema: 'https://opencode.ai/config.json', provider: (_b = {},
                _b[chosenProviderName] = {
                    npm: chosenProviderNpm,
                    name: 'Cached Provider Proxy',
                    options: __assign({ baseURL: this.baseUrl }, (this.apiKey && { apiKey: this.apiKey })),
                    models: __assign((_c = {}, _c[model] = {
                        name: model,
                    }, _c), (smallModel
                        ? (_d = {},
                            _d[smallModel] = {
                                name: smallModel,
                            },
                            _d) : {})),
                },
                _b), model: "".concat(chosenProviderName, "/").concat(model) }, (smallModel && {
            small_model: "".concat(chosenProviderName, "/").concat(smallModel),
        }));
    };
    CachedOpencodeProviderProxy.prototype.handleRequest = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var url, targetUrl, shouldUseCache, upstream_1, requestText, parsedRequestBody, cacheKey, cacheEntry, isSSE, upstream, upstreamHeaders, storedEndpoint, emptyBody, _c, clientStream, cacheStream;
            var request = _b.request;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        url = new URL(request.url);
                        targetUrl = new URL(this.targetBaseUrl.replace(/\/$/, '') + url.pathname + url.search);
                        shouldUseCache = this.cacheMethods.has(request.method.toUpperCase());
                        if (!!shouldUseCache) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.forwardRequest({ request: request, targetUrl: targetUrl })];
                    case 1:
                        upstream_1 = _d.sent();
                        return [2 /*return*/, upstream_1];
                    case 2: return [4 /*yield*/, request.clone().text()];
                    case 3:
                        requestText = _d.sent();
                        parsedRequestBody = this.tryParseJson({ text: requestText });
                        cacheKey = this.computeCacheKey({
                            method: request.method,
                            pathname: url.pathname,
                            search: url.search,
                            body: parsedRequestBody,
                            anthropicVersion: request.headers.get('anthropic-version') || '',
                            anthropicBeta: request.headers.get('anthropic-beta') || '',
                        });
                        return [4 /*yield*/, this.lookupCache({ cacheKey: cacheKey })];
                    case 4:
                        cacheEntry = _d.sent();
                        if (cacheEntry) {
                            this.cacheHits += 1;
                            isSSE = (cacheEntry.headers['content-type'] || '').includes('text/event-stream');
                            if (isSSE && this.streamChunkDelayMs > 0) {
                                return [2 /*return*/, new Response(this.createDelayedSSEStream({
                                        body: cacheEntry.body,
                                        delayMs: this.streamChunkDelayMs,
                                    }), {
                                        status: cacheEntry.status,
                                        headers: cacheEntry.headers,
                                    })];
                            }
                            return [2 /*return*/, new Response(cacheEntry.body, {
                                    status: cacheEntry.status,
                                    headers: cacheEntry.headers,
                                })];
                        }
                        this.cacheMisses += 1;
                        return [4 /*yield*/, this.forwardRequest({ request: request, targetUrl: targetUrl })];
                    case 5:
                        upstream = _d.sent();
                        upstreamHeaders = this.serializeResponseHeaders({
                            headers: upstream.headers,
                        });
                        storedEndpoint = url.pathname + url.search;
                        if (!!upstream.body) return [3 /*break*/, 7];
                        emptyBody = new Uint8Array(0);
                        return [4 /*yield*/, this.storeCacheEntry({
                                cacheKey: cacheKey,
                                requestBody: requestText,
                                endpoint: storedEndpoint,
                                method: request.method,
                                status: upstream.status,
                                headers: upstreamHeaders,
                                body: emptyBody,
                            })];
                    case 6:
                        _d.sent();
                        return [2 /*return*/, new Response(emptyBody, {
                                status: upstream.status,
                                headers: upstreamHeaders,
                            })];
                    case 7:
                        _c = upstream.body.tee(), clientStream = _c[0], cacheStream = _c[1];
                        void this.persistStreamToCache({
                            cacheKey: cacheKey,
                            requestBody: requestText,
                            endpoint: storedEndpoint,
                            method: request.method,
                            status: upstream.status,
                            headers: upstreamHeaders,
                            stream: cacheStream,
                        }).catch(function () {
                            return;
                        });
                        return [2 /*return*/, new Response(clientStream, {
                                status: upstream.status,
                                headers: upstreamHeaders,
                            })];
                }
            });
        });
    };
    CachedOpencodeProviderProxy.prototype.tryParseJson = function (_a) {
        var text = _a.text;
        try {
            return JSON.parse(text);
        }
        catch (_b) {
            return text;
        }
    };
    CachedOpencodeProviderProxy.prototype.computeCacheKey = function (_a) {
        var method = _a.method, pathname = _a.pathname, search = _a.search, body = _a.body, anthropicVersion = _a.anthropicVersion, anthropicBeta = _a.anthropicBeta;
        var normalizedBody = this.normalizeJson({ value: body });
        var payload = {
            method: method,
            pathname: pathname,
            search: search,
            anthropicVersion: anthropicVersion,
            anthropicBeta: anthropicBeta,
            body: normalizedBody,
        };
        var serialized = JSON.stringify(payload);
        return node_crypto_1.default.createHash('sha256').update(serialized).digest('hex');
    };
    CachedOpencodeProviderProxy.prototype.normalizeJson = function (_a) {
        var _this = this;
        var value = _a.value;
        if (Array.isArray(value)) {
            return value.map(function (item) {
                return _this.normalizeJson({ value: item });
            });
        }
        if (!value || typeof value !== 'object') {
            return value;
        }
        var record = value;
        var sortedKeys = Object.keys(record).sort(function (a, b) {
            if (a < b) {
                return -1;
            }
            if (a > b) {
                return 1;
            }
            return 0;
        });
        var normalized = {};
        for (var _i = 0, sortedKeys_1 = sortedKeys; _i < sortedKeys_1.length; _i++) {
            var key = sortedKeys_1[_i];
            normalized[key] = this.normalizeJson({ value: record[key] });
        }
        return normalized;
    };
    CachedOpencodeProviderProxy.prototype.ensureDatabaseReady = function () {
        return __awaiter(this, void 0, void 0, function () {
            var database;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.database) {
                            return [2 /*return*/];
                        }
                        node_fs_1.default.mkdirSync(node_path_1.default.dirname(this.cacheDbPath), { recursive: true });
                        database = (0, client_1.createClient)({
                            url: "file:".concat(this.cacheDbPath),
                        });
                        // WAL mode + relaxed sync drastically reduce fsync overhead for local
                        // libsql file: databases (libsql inserts are ~60x slower than
                        // better-sqlite3 in default journal mode, WAL narrows the gap).
                        return [4 /*yield*/, database.execute('PRAGMA journal_mode = WAL')];
                    case 1:
                        // WAL mode + relaxed sync drastically reduce fsync overhead for local
                        // libsql file: databases (libsql inserts are ~60x slower than
                        // better-sqlite3 in default journal mode, WAL narrows the gap).
                        _a.sent();
                        return [4 /*yield*/, database.execute('PRAGMA synchronous = NORMAL')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, database.execute("\n      CREATE TABLE IF NOT EXISTS ".concat(CACHE_TABLE, " (\n        cache_key TEXT PRIMARY KEY,\n        endpoint TEXT NOT NULL,\n        method TEXT NOT NULL,\n        request_body TEXT NOT NULL,\n        response_status INTEGER NOT NULL,\n        response_headers TEXT NOT NULL,\n        response_body BLOB NOT NULL,\n        created_at TEXT NOT NULL,\n        last_accessed_at TEXT NOT NULL\n      )\n    "))];
                    case 3:
                        _a.sent();
                        this.database = database;
                        return [2 /*return*/];
                }
            });
        });
    };
    CachedOpencodeProviderProxy.prototype.lookupCache = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var database, result, firstRow, parsed;
            var cacheKey = _b.cacheKey;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.ensureDatabaseReady()];
                    case 1:
                        _c.sent();
                        database = this.database;
                        if (!database) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, database.execute({
                                sql: "\n        SELECT response_status, response_headers, response_body\n        FROM ".concat(CACHE_TABLE, "\n        WHERE cache_key = ?\n      "),
                                args: [cacheKey],
                            })];
                    case 2:
                        result = _c.sent();
                        firstRow = result.rows[0];
                        if (!firstRow) {
                            return [2 /*return*/, null];
                        }
                        parsed = this.parseCacheRow({
                            row: firstRow,
                        });
                        if (!parsed) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, parsed];
                }
            });
        });
    };
    CachedOpencodeProviderProxy.prototype.parseCacheRow = function (_a) {
        var row = _a.row;
        var status = this.parseStatus({ value: row['response_status'] });
        var headers = this.parseHeaders({ value: row['response_headers'] });
        var body = this.parseBody({ value: row['response_body'] });
        if (!status || !headers || !body) {
            return null;
        }
        var parsed = {
            status: status,
            headers: headers,
            body: body,
        };
        return parsed;
    };
    CachedOpencodeProviderProxy.prototype.parseStatus = function (_a) {
        var value = _a.value;
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string') {
            var parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
        return null;
    };
    CachedOpencodeProviderProxy.prototype.parseHeaders = function (_a) {
        var value = _a.value;
        if (typeof value !== 'string') {
            return null;
        }
        try {
            var parsed = JSON.parse(value);
            if (!parsed || typeof parsed !== 'object') {
                return null;
            }
            var record = parsed;
            var headers = {};
            for (var _i = 0, _b = Object.entries(record); _i < _b.length; _i++) {
                var _c = _b[_i], key = _c[0], headerValue = _c[1];
                if (typeof headerValue !== 'string') {
                    continue;
                }
                headers[key] = headerValue;
            }
            return headers;
        }
        catch (_d) {
            return null;
        }
    };
    CachedOpencodeProviderProxy.prototype.parseBody = function (_a) {
        var value = _a.value;
        if (value instanceof Uint8Array) {
            return value;
        }
        if (value instanceof ArrayBuffer) {
            return new Uint8Array(value);
        }
        if (ArrayBuffer.isView(value)) {
            return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
        }
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) {
            return new Uint8Array(value);
        }
        if (typeof value === 'string') {
            return new TextEncoder().encode(value);
        }
        if (Array.isArray(value)) {
            var numbers = value.filter(function (item) {
                return typeof item === 'number';
            });
            if (numbers.length !== value.length) {
                return null;
            }
            return new Uint8Array(numbers);
        }
        return null;
    };
    CachedOpencodeProviderProxy.prototype.persistStreamToCache = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var bodyBuffer, body;
            var cacheKey = _b.cacheKey, requestBody = _b.requestBody, endpoint = _b.endpoint, method = _b.method, status = _b.status, headers = _b.headers, stream = _b.stream;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, new Response(stream).arrayBuffer()];
                    case 1:
                        bodyBuffer = _c.sent();
                        body = new Uint8Array(bodyBuffer);
                        return [4 /*yield*/, this.storeCacheEntry({
                                cacheKey: cacheKey,
                                requestBody: requestBody,
                                endpoint: endpoint,
                                method: method,
                                status: status,
                                headers: headers,
                                body: body,
                            })];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CachedOpencodeProviderProxy.prototype.storeCacheEntry = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var database, now;
            var cacheKey = _b.cacheKey, requestBody = _b.requestBody, endpoint = _b.endpoint, method = _b.method, status = _b.status, headers = _b.headers, body = _b.body;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.ensureDatabaseReady()];
                    case 1:
                        _c.sent();
                        database = this.database;
                        if (!database) {
                            return [2 /*return*/];
                        }
                        now = new Date().toISOString();
                        return [4 /*yield*/, database.execute({
                                sql: "\n        INSERT INTO ".concat(CACHE_TABLE, " (\n          cache_key,\n          endpoint,\n          method,\n          request_body,\n          response_status,\n          response_headers,\n          response_body,\n          created_at,\n          last_accessed_at\n        )\n        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)\n        ON CONFLICT(cache_key) DO UPDATE SET\n          endpoint = excluded.endpoint,\n          method = excluded.method,\n          request_body = excluded.request_body,\n          response_status = excluded.response_status,\n          response_headers = excluded.response_headers,\n          response_body = excluded.response_body,\n          last_accessed_at = excluded.last_accessed_at\n      "),
                                args: [
                                    cacheKey,
                                    endpoint,
                                    method,
                                    requestBody,
                                    status,
                                    JSON.stringify(headers),
                                    body,
                                    now,
                                    now,
                                ],
                            })];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CachedOpencodeProviderProxy.prototype.forwardRequest = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var targetUrlString, proxyRequest, headers, _i, _c, _d, key, value, outgoingAuthorization, forwardedRequest;
            var request = _b.request, targetUrl = _b.targetUrl;
            return __generator(this, function (_e) {
                targetUrlString = targetUrl.toString();
                proxyRequest = new Request(targetUrlString, request);
                headers = new Headers(proxyRequest.headers);
                headers.delete('host');
                headers.delete('content-length');
                for (_i = 0, _c = Object.entries(this.additionalHeaders); _i < _c.length; _i++) {
                    _d = _c[_i], key = _d[0], value = _d[1];
                    headers.set(key, value);
                }
                outgoingAuthorization = this.upstreamAuthorization || this.authorization;
                if (outgoingAuthorization) {
                    headers.set('authorization', outgoingAuthorization);
                }
                if (this.upstreamApiKey && this.upstreamApiKeyHeader) {
                    headers.set(this.upstreamApiKeyHeader, this.upstreamApiKey);
                }
                forwardedRequest = new Request(targetUrlString, {
                    method: proxyRequest.method,
                    headers: headers,
                    body: proxyRequest.body,
                    duplex: 'half',
                });
                return [2 /*return*/, fetch(forwardedRequest)];
            });
        });
    };
    CachedOpencodeProviderProxy.prototype.serializeResponseHeaders = function (_a) {
        var headers = _a.headers;
        var serialized = {};
        for (var _i = 0, _b = headers.entries(); _i < _b.length; _i++) {
            var _c = _b[_i], name_1 = _c[0], value = _c[1];
            if (HOP_BY_HOP_HEADERS.has(name_1.toLowerCase())) {
                continue;
            }
            serialized[name_1] = value;
        }
        return serialized;
    };
    /** Parse cached SSE body with eventsource-parser, then re-serialize and
     *  drip events with delays. This simulates slow streaming so e2e tests
     *  can exercise timing-dependent paths like step-finish interrupts. */
    CachedOpencodeProviderProxy.prototype.createDelayedSSEStream = function (_a) {
        var body = _a.body, delayMs = _a.delayMs;
        var text = new TextDecoder().decode(body);
        var events = [];
        var parser = (0, eventsource_parser_1.createParser)({
            onEvent: function (event) {
                // Re-serialize each parsed event back to SSE wire format
                var parts = [];
                if (event.event) {
                    parts.push("event: ".concat(event.event));
                }
                if (event.id) {
                    parts.push("id: ".concat(event.id));
                }
                parts.push("data: ".concat(event.data));
                events.push(parts.join('\n') + '\n\n');
            },
        });
        parser.feed(text);
        var encoder = new TextEncoder();
        var index = 0;
        return new ReadableStream({
            pull: function (controller) {
                return __awaiter(this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (index >= events.length) {
                                    controller.close();
                                    return [2 /*return*/];
                                }
                                if (!(index > 0)) return [3 /*break*/, 2];
                                return [4 /*yield*/, new Promise(function (resolve) {
                                        setTimeout(resolve, delayMs);
                                    })];
                            case 1:
                                _a.sent();
                                _a.label = 2;
                            case 2:
                                controller.enqueue(encoder.encode(events[index]));
                                index++;
                                return [2 /*return*/];
                        }
                    });
                });
            },
        });
    };
    return CachedOpencodeProviderProxy;
}());
exports.CachedOpencodeProviderProxy = CachedOpencodeProviderProxy;
