"use strict";
// Web standard Hrana v2 handler.
// createLibsqlHandler(executor) returns a function: (Request) => Promise<Response>
//
// Handles:
//   GET  /v2          — version check
//   POST /v2/pipeline — pipeline execution with baton-based stream management
//
// Baton and stream state is scoped to the handler instance (not module-global),
// so multiple handlers in the same process are fully isolated.
// Abandoned streams are evicted after STREAM_TTL_MS of inactivity.
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
exports.createLibsqlHandler = createLibsqlHandler;
var protocol_ts_1 = require("./protocol.ts");
// Runtime-agnostic random baton generator.
// crypto.randomUUID() is available in Node 19+, CF Workers, and browsers.
function generateBaton() {
    return crypto.randomUUID();
}
// Streams idle longer than this are evicted to prevent unbounded memory growth.
// Hrana v2 spec recommends servers close inactive streams after a short period.
var STREAM_TTL_MS = 120000;
function createLibsqlHandler(executor) {
    var _this = this;
    // Per-handler state — isolated per createLibsqlHandler() call.
    var streams = new Map();
    function evictStaleStreams() {
        var now = Date.now();
        for (var _i = 0, streams_1 = streams; _i < streams_1.length; _i++) {
            var _a = streams_1[_i], baton = _a[0], state = _a[1];
            if (now - state.lastSeenMs > STREAM_TTL_MS) {
                streams.delete(baton);
            }
        }
    }
    return function (request) { return __awaiter(_this, void 0, void 0, function () {
        var url, pathname, body, _a, requests, incoming, sqlStore, results, streamClosed, _i, requests_1, req, _b, _c, baton, response;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    url = new URL(request.url);
                    pathname = url.pathname;
                    if (request.method === 'GET' && pathname === '/v2') {
                        return [2 /*return*/, Response.json({ version: 'hrana-v2' })];
                    }
                    if (!(request.method === 'POST' && pathname === '/v2/pipeline')) return [3 /*break*/, 9];
                    body = void 0;
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, request.json()];
                case 2:
                    body = (_f.sent());
                    return [3 /*break*/, 4];
                case 3:
                    _a = _f.sent();
                    return [2 /*return*/, Response.json({ error: { message: 'Invalid JSON body', code: 'HRANA_PROTO_ERROR' } }, { status: 400 })];
                case 4:
                    // Validate envelope — body must be a non-null object
                    if (body === null || typeof body !== 'object') {
                        return [2 /*return*/, Response.json({ error: { message: 'Pipeline body must be a JSON object', code: 'HRANA_PROTO_ERROR' } }, { status: 400 })];
                    }
                    // Validate requests — reject explicitly malformed values,
                    // treat missing/null as empty array for client compat
                    if (body.requests !== undefined && body.requests !== null && !Array.isArray(body.requests)) {
                        return [2 /*return*/, Response.json({ error: { message: '"requests" must be an array', code: 'HRANA_PROTO_ERROR' } }, { status: 400 })];
                    }
                    requests = Array.isArray(body.requests) ? body.requests : [];
                    // Evict stale streams on each pipeline call (cheap linear scan)
                    evictStaleStreams();
                    incoming = body.baton;
                    if (incoming != null && !streams.has(incoming)) {
                        return [2 /*return*/, Response.json({ error: { message: 'Invalid or expired baton', code: 'HRANA_PROTO_ERROR' } }, { status: 400 })];
                    }
                    sqlStore = (_e = (incoming ? (_d = streams.get(incoming)) === null || _d === void 0 ? void 0 : _d.sqlStore : undefined)) !== null && _e !== void 0 ? _e : new Map();
                    if (incoming) {
                        streams.delete(incoming);
                    }
                    results = [];
                    streamClosed = false;
                    _i = 0, requests_1 = requests;
                    _f.label = 5;
                case 5:
                    if (!(_i < requests_1.length)) return [3 /*break*/, 8];
                    req = requests_1[_i];
                    if (streamClosed) {
                        results.push({
                            type: 'error',
                            error: { message: 'Stream already closed', code: 'HRANA_PROTO_ERROR' },
                        });
                        return [3 /*break*/, 7];
                    }
                    // Validate each request entry is a non-null object with a string type
                    if (req === null || typeof req !== 'object' || typeof req.type !== 'string') {
                        results.push({
                            type: 'error',
                            error: { message: 'Each request must be an object with a "type" field', code: 'HRANA_PROTO_ERROR' },
                        });
                        return [3 /*break*/, 7];
                    }
                    _c = (_b = results).push;
                    return [4 /*yield*/, (0, protocol_ts_1.processHranaRequest)(executor, req, sqlStore)];
                case 6:
                    _c.apply(_b, [_f.sent()]);
                    if (req.type === 'close') {
                        streamClosed = true;
                    }
                    _f.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 5];
                case 8:
                    baton = streamClosed ? null : generateBaton();
                    if (baton) {
                        streams.set(baton, { sqlStore: sqlStore, lastSeenMs: Date.now() });
                    }
                    response = {
                        baton: baton,
                        base_url: null,
                        results: results,
                    };
                    return [2 /*return*/, Response.json(response)];
                case 9: return [2 /*return*/, new Response('Not found', { status: 404 })];
            }
        });
    }); };
}
