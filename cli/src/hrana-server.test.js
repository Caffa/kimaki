"use strict";
// Tests Drizzle access through the in-process Hrana/libSQL HTTP server.
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
var node_http_1 = require("node:http");
var node_path_1 = require("node:path");
var node_crypto_1 = require("node:crypto");
var node_url_1 = require("node:url");
var vitest_1 = require("vitest");
var libsql_1 = require("libsql");
var client_1 = require("@libsql/client");
var libsql_2 = require("drizzle-orm/libsql");
var orm = require("drizzle-orm");
var libsqlproxy_1 = require("libsqlproxy");
var schema = require("./schema.js");
var __filename = (0, node_url_1.fileURLToPath)(import.meta.url);
var __dirname = node_path_1.default.dirname(__filename);
function migrateSchema(client) {
    return __awaiter(this, void 0, void 0, function () {
        var schemaPath, sql, statements, _i, statements_1, statement;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    schemaPath = node_path_1.default.join(__dirname, '../src/schema.sql');
                    sql = node_fs_1.default.readFileSync(schemaPath, 'utf-8');
                    statements = sql
                        .split(';')
                        .map(function (s) {
                        return s
                            .split('\n')
                            .filter(function (line) { return !line.trimStart().startsWith('--'); })
                            .join('\n')
                            .trim();
                    })
                        .filter(function (s) {
                        return s.length > 0 &&
                            !/^CREATE\s+TABLE\s+["']?sqlite_sequence["']?\s*\(/i.test(s);
                    })
                        .map(function (s) {
                        return s
                            .replace(/^CREATE\s+UNIQUE\s+INDEX\b(?!\s+IF)/i, 'CREATE UNIQUE INDEX IF NOT EXISTS')
                            .replace(/^CREATE\s+INDEX\b(?!\s+IF)/i, 'CREATE INDEX IF NOT EXISTS');
                    });
                    _i = 0, statements_1 = statements;
                    _a.label = 1;
                case 1:
                    if (!(_i < statements_1.length)) return [3 /*break*/, 4];
                    statement = statements_1[_i];
                    return [4 /*yield*/, client.execute(statement)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
(0, vitest_1.describe)('hrana-server', function () {
    var testServer = null;
    var testDb = null;
    var client = null;
    var dbPath = node_path_1.default.join(process.cwd(), "tmp/test-hrana-".concat(node_crypto_1.default.randomUUID().slice(0, 8), ".db"));
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _i, _a, file;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    client === null || client === void 0 ? void 0 : client.close();
                    if (!testServer) return [3 /*break*/, 2];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            testServer.close(function () { return resolve(); });
                        })];
                case 1:
                    _b.sent();
                    _b.label = 2;
                case 2:
                    testDb === null || testDb === void 0 ? void 0 : testDb.close();
                    for (_i = 0, _a = [dbPath, "".concat(dbPath, "-wal"), "".concat(dbPath, "-shm")]; _i < _a.length; _i++) {
                        file = _a[_i];
                        try {
                            node_fs_1.default.unlinkSync(file);
                        }
                        catch (_c) {
                            // Test cleanup best effort.
                        }
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('Drizzle CRUD through hrana server', function () { return __awaiter(void 0, void 0, void 0, function () {
        var database, port, db, created, found, updated, deleted;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    node_fs_1.default.mkdirSync(node_path_1.default.dirname(dbPath), { recursive: true });
                    database = new libsql_1.default(dbPath);
                    database.exec('PRAGMA journal_mode = WAL');
                    database.exec('PRAGMA busy_timeout = 5000');
                    testDb = database;
                    port = 10000 + Math.floor(Math.random() * 50000);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var hranaFetchHandler = (0, libsqlproxy_1.createLibsqlHandler)((0, libsqlproxy_1.libsqlExecutor)(database));
                            var hranaNodeHandler = (0, libsqlproxy_1.createLibsqlNodeHandler)(hranaFetchHandler);
                            var srv = node_http_1.default.createServer(hranaNodeHandler);
                            srv.on('error', reject);
                            srv.listen(port, '127.0.0.1', function () {
                                testServer = srv;
                                resolve();
                            });
                        })];
                case 1:
                    _a.sent();
                    client = (0, client_1.createClient)({ url: "http://127.0.0.1:".concat(port) });
                    db = (0, libsql_2.drizzle)({ client: client, schema: schema, relations: schema.relations });
                    return [4 /*yield*/, migrateSchema(client)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, db.insert(schema.thread_sessions)
                            .values({ thread_id: 'hrana-test-thread', session_id: 'hrana-test-session' })
                            .returning()];
                case 3:
                    created = (_a.sent())[0];
                    (0, vitest_1.expect)(created === null || created === void 0 ? void 0 : created.thread_id).toMatchInlineSnapshot("\"hrana-test-thread\"");
                    (0, vitest_1.expect)(created === null || created === void 0 ? void 0 : created.session_id).toMatchInlineSnapshot("\"hrana-test-session\"");
                    return [4 /*yield*/, db.query.thread_sessions.findFirst({
                            where: { thread_id: 'hrana-test-thread' },
                        })];
                case 4:
                    found = _a.sent();
                    (0, vitest_1.expect)(found === null || found === void 0 ? void 0 : found.session_id).toMatchInlineSnapshot("\"hrana-test-session\"");
                    return [4 /*yield*/, db.update(schema.thread_sessions)
                            .set({ session_id: 'updated-session' })
                            .where(orm.eq(schema.thread_sessions.thread_id, 'hrana-test-thread'))];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, db.query.thread_sessions.findFirst({
                            where: { thread_id: 'hrana-test-thread' },
                        })];
                case 6:
                    updated = _a.sent();
                    (0, vitest_1.expect)(updated === null || updated === void 0 ? void 0 : updated.session_id).toMatchInlineSnapshot("\"updated-session\"");
                    return [4 /*yield*/, db.delete(schema.thread_sessions).where(orm.eq(schema.thread_sessions.thread_id, 'hrana-test-thread'))];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, db.query.thread_sessions.findFirst({
                            where: { thread_id: 'hrana-test-thread' },
                        })];
                case 8:
                    deleted = _a.sent();
                    (0, vitest_1.expect)(deleted).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
});
