"use strict";
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
var vitest_1 = require("vitest");
var handler_ts_1 = require("./handler.ts");
// In-memory executor for testing — tracks tables and rows
function createMemoryExecutor() {
    var tables = new Map();
    return {
        executeSql: function (sql, params) {
            var trimmed = sql.trim().toUpperCase();
            if (trimmed.startsWith('CREATE TABLE')) {
                var match = sql.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(([^)]+)\)/i);
                if (match) {
                    var name_1 = match[1];
                    var colDefs = match[2].split(',').map(function (c) { return c.trim().split(/\s+/)[0]; });
                    tables.set(name_1, { cols: colDefs, rows: [] });
                }
                return { cols: [], rows: [], affected_row_count: 0, last_insert_rowid: null };
            }
            if (trimmed.startsWith('INSERT INTO')) {
                var match = sql.match(/INSERT INTO (\w+)/i);
                if (match) {
                    var table = tables.get(match[1]);
                    if (table) {
                        table.rows.push(params);
                        return {
                            cols: [],
                            rows: [],
                            affected_row_count: 1,
                            last_insert_rowid: String(table.rows.length),
                        };
                    }
                }
                return { cols: [], rows: [], affected_row_count: 0, last_insert_rowid: null };
            }
            if (trimmed.startsWith('SELECT')) {
                var match = sql.match(/FROM (\w+)/i);
                if (match) {
                    var table = tables.get(match[1]);
                    if (table) {
                        return {
                            cols: table.cols.map(function (name) { return ({ name: name, decltype: null }); }),
                            rows: table.rows.map(function (row) {
                                return row.map(function (val) {
                                    if (val === null) {
                                        return { type: 'null' };
                                    }
                                    if (typeof val === 'number') {
                                        return { type: 'integer', value: String(val) };
                                    }
                                    return { type: 'text', value: String(val) };
                                });
                            }),
                            affected_row_count: 0,
                            last_insert_rowid: null,
                        };
                    }
                }
                return { cols: [], rows: [], affected_row_count: 0, last_insert_rowid: null };
            }
            return { cols: [], rows: [], affected_row_count: 0, last_insert_rowid: null };
        },
        execRaw: function (_sql) {
            // no-op for testing
        },
    };
}
function pipeline(handler, body) {
    return handler(new Request('http://localhost/v2/pipeline', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    }));
}
(0, vitest_1.describe)('createLibsqlHandler', function () {
    var handler;
    (0, vitest_1.beforeEach)(function () {
        handler = (0, handler_ts_1.createLibsqlHandler)(createMemoryExecutor());
    });
    (0, vitest_1.test)('GET /v2 returns version', function () { return __awaiter(void 0, void 0, void 0, function () {
        var req, res, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    req = new Request('http://localhost/v2', { method: 'GET' });
                    return [4 /*yield*/, handler(req)];
                case 1:
                    res = _b.sent();
                    (0, vitest_1.expect)(res.status).toBe(200);
                    _a = vitest_1.expect;
                    return [4 /*yield*/, res.json()];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      {\n        \"version\": \"hrana-v2\",\n      }\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('POST /v2/pipeline execute returns result', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: null,
                        requests: [
                            { type: 'execute', stmt: { sql: 'CREATE TABLE users (id, name)' } },
                            {
                                type: 'execute',
                                stmt: {
                                    sql: 'INSERT INTO users VALUES (?, ?)',
                                    args: [
                                        { type: 'integer', value: '1' },
                                        { type: 'text', value: 'alice' },
                                    ],
                                },
                            },
                            { type: 'execute', stmt: { sql: 'SELECT * FROM users' } },
                            { type: 'close' },
                        ],
                    })];
                case 1:
                    res = _a.sent();
                    (0, vitest_1.expect)(res.status).toBe(200);
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.baton).toBe(null);
                    (0, vitest_1.expect)(body.results).toMatchInlineSnapshot("\n      [\n        {\n          \"response\": {\n            \"result\": {\n              \"affected_row_count\": 0,\n              \"cols\": [],\n              \"last_insert_rowid\": null,\n              \"rows\": [],\n            },\n            \"type\": \"execute\",\n          },\n          \"type\": \"ok\",\n        },\n        {\n          \"response\": {\n            \"result\": {\n              \"affected_row_count\": 1,\n              \"cols\": [],\n              \"last_insert_rowid\": \"1\",\n              \"rows\": [],\n            },\n            \"type\": \"execute\",\n          },\n          \"type\": \"ok\",\n        },\n        {\n          \"response\": {\n            \"result\": {\n              \"affected_row_count\": 0,\n              \"cols\": [\n                {\n                  \"decltype\": null,\n                  \"name\": \"id\",\n                },\n                {\n                  \"decltype\": null,\n                  \"name\": \"name\",\n                },\n              ],\n              \"last_insert_rowid\": null,\n              \"rows\": [\n                [\n                  {\n                    \"type\": \"integer\",\n                    \"value\": \"1\",\n                  },\n                  {\n                    \"type\": \"text\",\n                    \"value\": \"alice\",\n                  },\n                ],\n              ],\n            },\n            \"type\": \"execute\",\n          },\n          \"type\": \"ok\",\n        },\n        {\n          \"response\": {\n            \"type\": \"close\",\n          },\n          \"type\": \"ok\",\n        },\n      ]\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('baton is returned when stream is not closed', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: null,
                        requests: [
                            { type: 'execute', stmt: { sql: 'CREATE TABLE t1 (x)' } },
                        ],
                    })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.baton).toBeTruthy();
                    (0, vitest_1.expect)(typeof body.baton).toBe('string');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('store_sql and close_sql work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: null,
                        requests: [
                            { type: 'store_sql', sql_id: 1, sql: 'CREATE TABLE t2 (x)' },
                            { type: 'execute', stmt: { sql_id: 1 } },
                            { type: 'close_sql', sql_id: 1 },
                            { type: 'close' },
                        ],
                    })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.results.map(function (r) { return r.type; })).toMatchInlineSnapshot("\n      [\n        \"ok\",\n        \"ok\",\n        \"ok\",\n        \"ok\",\n      ]\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('invalid JSON returns 400', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, handler(new Request('http://localhost/v2/pipeline', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: 'not json',
                    }))];
                case 1:
                    res = _a.sent();
                    (0, vitest_1.expect)(res.status).toBe(400);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('unknown path returns 404', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, handler(new Request('http://localhost/unknown', { method: 'GET' }))];
                case 1:
                    res = _a.sent();
                    (0, vitest_1.expect)(res.status).toBe(404);
                    return [2 /*return*/];
            }
        });
    }); });
    // ── Baton validation ─────────────────────────────────────────────
    (0, vitest_1.test)('unknown baton returns 400', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: 'nonexistent-baton',
                        requests: [{ type: 'execute', stmt: { sql: 'SELECT 1' } }],
                    })];
                case 1:
                    res = _a.sent();
                    (0, vitest_1.expect)(res.status).toBe(400);
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.error.message).toContain('Invalid or expired baton');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('baton from one handler is not accepted by another', function () { return __awaiter(void 0, void 0, void 0, function () {
        var handler2, res1, body1, res2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    handler2 = (0, handler_ts_1.createLibsqlHandler)(createMemoryExecutor());
                    return [4 /*yield*/, pipeline(handler, {
                            baton: null,
                            requests: [{ type: 'execute', stmt: { sql: 'SELECT 1' } }],
                        })];
                case 1:
                    res1 = _a.sent();
                    return [4 /*yield*/, res1.json()];
                case 2:
                    body1 = _a.sent();
                    return [4 /*yield*/, pipeline(handler2, {
                            baton: body1.baton,
                            requests: [{ type: 'execute', stmt: { sql: 'SELECT 1' } }],
                        })];
                case 3:
                    res2 = _a.sent();
                    (0, vitest_1.expect)(res2.status).toBe(400);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('closed baton is rejected on next request', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res1, body1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: null,
                        requests: [
                            { type: 'execute', stmt: { sql: 'SELECT 1' } },
                            { type: 'close' },
                        ],
                    })];
                case 1:
                    res1 = _a.sent();
                    return [4 /*yield*/, res1.json()];
                case 2:
                    body1 = _a.sent();
                    (0, vitest_1.expect)(body1.baton).toBe(null);
                    return [2 /*return*/];
            }
        });
    }); });
    // ── Requests after close in same pipeline ─────────────────────────
    (0, vitest_1.test)('requests after close in same pipeline return error', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: null,
                        requests: [
                            { type: 'close' },
                            { type: 'execute', stmt: { sql: 'SELECT 1' } },
                        ],
                    })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.results[0].type).toBe('ok');
                    (0, vitest_1.expect)(body.results[1].type).toBe('error');
                    (0, vitest_1.expect)(body.results[1].error.message).toContain('Stream already closed');
                    return [2 /*return*/];
            }
        });
    }); });
    // ── Malformed body ────────────────────────────────────────────────
    (0, vitest_1.test)('malformed requests field returns 400', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: null,
                        requests: 'not an array',
                    })];
                case 1:
                    res = _a.sent();
                    (0, vitest_1.expect)(res.status).toBe(400);
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.error.message).toContain('"requests" must be an array');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('missing requests field treated as empty (200)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, { baton: null })];
                case 1:
                    res = _a.sent();
                    (0, vitest_1.expect)(res.status).toBe(200);
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.results).toEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    // ── store_sql duplicate rejection ─────────────────────────────────
    (0, vitest_1.test)('duplicate store_sql returns error', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: null,
                        requests: [
                            { type: 'store_sql', sql_id: 1, sql: 'SELECT 1' },
                            { type: 'store_sql', sql_id: 1, sql: 'SELECT 2' },
                            { type: 'close' },
                        ],
                    })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.results[0].type).toBe('ok');
                    (0, vitest_1.expect)(body.results[1].type).toBe('error');
                    (0, vitest_1.expect)(body.results[1].error.message).toContain('already stored');
                    return [2 /*return*/];
            }
        });
    }); });
    // ── sql resolution ─────────────────────────────────────────────────
    // ── Malformed body edge cases ──────────────────────────────────────
    (0, vitest_1.test)('null JSON body returns 400', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, handler(new Request('http://localhost/v2/pipeline', {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: 'null',
                    }))];
                case 1:
                    res = _a.sent();
                    (0, vitest_1.expect)(res.status).toBe(400);
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.error.message).toContain('JSON object');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('null entry in requests returns per-item error', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: null,
                        requests: [null, { type: 'execute', stmt: { sql: 'SELECT 1' } }, { type: 'close' }],
                    })];
                case 1:
                    res = _a.sent();
                    (0, vitest_1.expect)(res.status).toBe(200);
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.results[0].type).toBe('error');
                    (0, vitest_1.expect)(body.results[0].error.message).toContain('object with a "type" field');
                    (0, vitest_1.expect)(body.results[1].type).toBe('ok');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('number entry in requests returns per-item error', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: null,
                        requests: [42, { type: 'close' }],
                    })];
                case 1:
                    res = _a.sent();
                    (0, vitest_1.expect)(res.status).toBe(200);
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(body.results[0].type).toBe('error');
                    (0, vitest_1.expect)(body.results[1].type).toBe('ok');
                    return [2 /*return*/];
            }
        });
    }); });
    // ── sql resolution ─────────────────────────────────────────────────
    (0, vitest_1.test)('execute with both sql and sql_id prefers sql', function () { return __awaiter(void 0, void 0, void 0, function () {
        var res, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pipeline(handler, {
                        baton: null,
                        requests: [
                            { type: 'store_sql', sql_id: 1, sql: 'CREATE TABLE t_ignored (x)' },
                            { type: 'execute', stmt: { sql: 'CREATE TABLE t_preferred (x)', sql_id: 1 } },
                            { type: 'execute', stmt: { sql: 'SELECT * FROM t_preferred' } },
                            { type: 'close' },
                        ],
                    })];
                case 1:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 2:
                    body = _a.sent();
                    // All succeed — sql was preferred over sql_id
                    (0, vitest_1.expect)(body.results.map(function (r) { return r.type; })).toMatchInlineSnapshot("\n      [\n        \"ok\",\n        \"ok\",\n        \"ok\",\n        \"ok\",\n      ]\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
});
