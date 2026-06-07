"use strict";
// Tests for Drizzle client initialization and schema migration.
// Auto-isolated via VITEST guards in config.ts (temp data dir) and db.ts (clears KIMAKI_DB_URL).
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
var node_crypto_1 = require("node:crypto");
var vitest_1 = require("vitest");
var db_js_1 = require("./db.js");
var orm = require("drizzle-orm");
var schema = require("./schema.js");
var database_js_1 = require("./database.js");
var hrana_server_js_1 = require("./hrana-server.js");
var test_utils_js_1 = require("./test-utils.js");
(0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, db_js_1.closeDb)()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, vitest_1.describe)('getDb', function () {
    (0, vitest_1.test)('creates sqlite file and migrates schema automatically', function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, session, found;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.insert(schema.thread_sessions)
                            .values({ thread_id: 'test-thread-123', session_id: 'test-session-456' })
                            .returning()];
                case 2:
                    session = (_a.sent())[0];
                    (0, vitest_1.expect)(session).toBeDefined();
                    if (!session)
                        throw new Error('Expected inserted session row');
                    (0, vitest_1.expect)(session.thread_id).toBe('test-thread-123');
                    (0, vitest_1.expect)(session.created_at).toBeInstanceOf(Date);
                    return [4 /*yield*/, db.query.thread_sessions.findFirst({
                            where: { thread_id: session.thread_id },
                        })];
                case 3:
                    found = _a.sent();
                    (0, vitest_1.expect)(found === null || found === void 0 ? void 0 : found.session_id).toBe('test-session-456');
                    // Cleanup test data
                    return [4 /*yield*/, db.delete(schema.thread_sessions).where(orm.eq(schema.thread_sessions.thread_id, 'test-thread-123'))];
                case 4:
                    // Cleanup test data
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('migrates fresh sqlite files through hrana', function () { return __awaiter(void 0, void 0, void 0, function () {
        var previousDbUrl, previousLockPort, dbPath, hranaResult, db, created, _i, _a, file;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.closeDb)()];
                case 1:
                    _b.sent();
                    previousDbUrl = process.env['KIMAKI_DB_URL'];
                    previousLockPort = process.env['KIMAKI_LOCK_PORT'];
                    dbPath = node_path_1.default.join(process.cwd(), "tmp/test-db-hrana-".concat(node_crypto_1.default.randomUUID().slice(0, 8), ".db"));
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, , 6, 9]);
                    process.env['KIMAKI_LOCK_PORT'] = String((0, test_utils_js_1.chooseLockPort)({ key: 'db-hrana-migration-test' }));
                    return [4 /*yield*/, (0, hrana_server_js_1.startHranaServer)({ dbPath: dbPath })];
                case 3:
                    hranaResult = _b.sent();
                    if (hranaResult instanceof Error)
                        throw hranaResult;
                    process.env['KIMAKI_DB_URL'] = hranaResult;
                    return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 4:
                    db = _b.sent();
                    return [4 /*yield*/, db.insert(schema.bot_tokens)
                            .values({ app_id: 'hrana-bot', token: 'test-token' })
                            .returning({ appId: schema.bot_tokens.app_id })];
                case 5:
                    created = (_b.sent())[0];
                    (0, vitest_1.expect)(created).toMatchInlineSnapshot("\n        {\n          \"appId\": \"hrana-bot\",\n        }\n      ");
                    return [3 /*break*/, 9];
                case 6: return [4 /*yield*/, (0, db_js_1.closeDb)()];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, hrana_server_js_1.stopHranaServer)()];
                case 8:
                    _b.sent();
                    if (previousDbUrl === undefined) {
                        delete process.env['KIMAKI_DB_URL'];
                    }
                    else {
                        process.env['KIMAKI_DB_URL'] = previousDbUrl;
                    }
                    if (previousLockPort === undefined) {
                        delete process.env['KIMAKI_LOCK_PORT'];
                    }
                    else {
                        process.env['KIMAKI_LOCK_PORT'] = previousLockPort;
                    }
                    for (_i = 0, _a = [dbPath, "".concat(dbPath, "-wal"), "".concat(dbPath, "-shm")]; _i < _a.length; _i++) {
                        file = _a[_i];
                        try {
                            node_fs_1.default.unlinkSync(file);
                        }
                        catch (_c) {
                            // Test cleanup best effort.
                        }
                    }
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('createPendingWorktree creates parent and child rows', function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, threadId, session, worktree;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    threadId = "test-worktree-".concat(Date.now());
                    return [4 /*yield*/, (0, database_js_1.createPendingWorktree)({
                            threadId: threadId,
                            worktreeName: 'regression-worktree',
                            projectDirectory: '/tmp/regression-project',
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, db.query.thread_sessions.findFirst({
                            where: { thread_id: threadId },
                        })];
                case 3:
                    session = _a.sent();
                    (0, vitest_1.expect)(session).toBeTruthy();
                    (0, vitest_1.expect)(session === null || session === void 0 ? void 0 : session.session_id).toBe('');
                    return [4 /*yield*/, db.query.thread_worktrees.findFirst({
                            where: { thread_id: threadId },
                        })];
                case 4:
                    worktree = _a.sent();
                    (0, vitest_1.expect)(worktree).toBeTruthy();
                    (0, vitest_1.expect)(worktree === null || worktree === void 0 ? void 0 : worktree.worktree_name).toBe('regression-worktree');
                    (0, vitest_1.expect)(worktree === null || worktree === void 0 ? void 0 : worktree.project_directory).toBe('/tmp/regression-project');
                    (0, vitest_1.expect)(worktree === null || worktree === void 0 ? void 0 : worktree.status).toBe('pending');
                    return [4 /*yield*/, db.delete(schema.thread_worktrees).where(orm.eq(schema.thread_worktrees.thread_id, threadId))];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, db.delete(schema.thread_sessions).where(orm.eq(schema.thread_sessions.thread_id, threadId))];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('session event persistence uses (timestamp, event_index) ordering for deterministic same-ms replay', function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, threadId, sessionId, baseTimestamp, inserted1, inserted2, rows, orderedIds;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    threadId = 'test-session-events-thread';
                    sessionId = 'test-session-events-session';
                    return [4 /*yield*/, db.delete(schema.session_events).where(orm.eq(schema.session_events.session_id, sessionId))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, db.delete(schema.thread_sessions).where(orm.eq(schema.thread_sessions.thread_id, threadId))];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, db.insert(schema.thread_sessions).values({ thread_id: threadId, session_id: sessionId })];
                case 4:
                    _a.sent();
                    baseTimestamp = 1700000000000;
                    return [4 /*yield*/, (0, database_js_1.appendSessionEventsSinceLastTimestamp)({
                            sessionId: sessionId,
                            events: [
                                {
                                    session_id: sessionId,
                                    thread_id: threadId,
                                    timestamp: baseTimestamp,
                                    event_index: 2,
                                    event_json: JSON.stringify({ id: 'e2' }),
                                },
                                {
                                    session_id: sessionId,
                                    thread_id: threadId,
                                    timestamp: baseTimestamp,
                                    event_index: 0,
                                    event_json: JSON.stringify({ id: 'e0' }),
                                },
                                {
                                    session_id: sessionId,
                                    thread_id: threadId,
                                    timestamp: baseTimestamp,
                                    event_index: 1,
                                    event_json: JSON.stringify({ id: 'e1' }),
                                },
                            ],
                        })];
                case 5:
                    inserted1 = _a.sent();
                    return [4 /*yield*/, (0, database_js_1.appendSessionEventsSinceLastTimestamp)({
                            sessionId: sessionId,
                            events: [
                                {
                                    session_id: sessionId,
                                    thread_id: threadId,
                                    timestamp: baseTimestamp,
                                    event_index: 0,
                                    event_json: JSON.stringify({ id: 'e0' }),
                                },
                                {
                                    session_id: sessionId,
                                    thread_id: threadId,
                                    timestamp: baseTimestamp,
                                    event_index: 1,
                                    event_json: JSON.stringify({ id: 'e1' }),
                                },
                                {
                                    session_id: sessionId,
                                    thread_id: threadId,
                                    timestamp: baseTimestamp,
                                    event_index: 2,
                                    event_json: JSON.stringify({ id: 'e2' }),
                                },
                                {
                                    session_id: sessionId,
                                    thread_id: threadId,
                                    timestamp: baseTimestamp,
                                    event_index: 3,
                                    event_json: JSON.stringify({ id: 'e3' }),
                                },
                            ],
                        })];
                case 6:
                    inserted2 = _a.sent();
                    return [4 /*yield*/, (0, database_js_1.getSessionEventSnapshot)({ sessionId: sessionId })];
                case 7:
                    rows = _a.sent();
                    orderedIds = rows.map(function (row) {
                        var parsed = JSON.parse(row.event_json);
                        return parsed.id;
                    });
                    (0, vitest_1.expect)({ inserted1: inserted1, inserted2: inserted2, orderedIds: orderedIds }).toMatchInlineSnapshot("\n      {\n        \"inserted1\": 3,\n        \"inserted2\": 1,\n        \"orderedIds\": [\n          \"e0\",\n          \"e1\",\n          \"e2\",\n          \"e3\",\n        ],\n      }\n    ");
                    return [4 /*yield*/, db.delete(schema.session_events).where(orm.eq(schema.session_events.session_id, sessionId))];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, db.delete(schema.thread_sessions).where(orm.eq(schema.thread_sessions.thread_id, threadId))];
                case 9:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
