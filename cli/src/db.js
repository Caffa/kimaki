"use strict";
// Drizzle client initialization with libSQL.
// Uses KIMAKI_DB_URL env var when set (plugin process → Hrana HTTP),
// otherwise falls back to direct file: access (bot process, CLI subcommands).
// Schema bootstrap runs in both modes because tests and plugin children may be
// the first process to touch a fresh SQLite file through Hrana.
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
exports.getDb = getDb;
exports.closeDb = closeDb;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_crypto_1 = require("node:crypto");
var client_1 = require("@libsql/client");
var libsql_1 = require("drizzle-orm/libsql");
var orm = require("drizzle-orm");
var node_url_1 = require("node:url");
var config_js_1 = require("./config.js");
var logger_js_1 = require("./logger.js");
var schema = require("./schema.js");
var __filename = (0, node_url_1.fileURLToPath)(import.meta.url);
var __dirname = node_path_1.default.dirname(__filename);
function createDrizzleClient(client) {
    return (0, libsql_1.drizzle)({ client: client, schema: schema, relations: schema.relations });
}
var dbLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.DB);
var clientInstance = null;
var dbInstance = null;
var initPromise = null;
// Under vitest, clear any inherited KIMAKI_DB_URL from the parent bot process
// so tests default to file-based access using the auto-isolated temp data dir.
// Tests that need Hrana can set KIMAKI_DB_URL explicitly after import.
if (process.env.KIMAKI_VITEST) {
    delete process.env['KIMAKI_DB_URL'];
}
function getDb() {
    if (dbInstance) {
        return Promise.resolve(dbInstance);
    }
    if (initPromise) {
        return initPromise;
    }
    initPromise = initializeDb();
    return initPromise;
}
function getDbUrl() {
    if (process.env.KIMAKI_DB_URL) {
        return process.env.KIMAKI_DB_URL;
    }
    var dataDir = (0, config_js_1.getDataDir)();
    var dbPath = node_path_1.default.join(dataDir, 'discord-sessions.db');
    return "file:".concat(dbPath);
}
function getDbAuthToken() {
    var token = process.env.KIMAKI_DB_AUTH_TOKEN;
    if (!token) {
        return undefined;
    }
    return token;
}
function initializeDb() {
    return __awaiter(this, void 0, void 0, function () {
        var dbUrl, isFileMode, dataDir, dbAuthToken, client, db, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dbUrl = getDbUrl();
                    isFileMode = dbUrl.startsWith('file:');
                    if (isFileMode) {
                        dataDir = (0, config_js_1.getDataDir)();
                        try {
                            node_fs_1.default.mkdirSync(dataDir, { recursive: true });
                        }
                        catch (e) {
                            dbLogger.error("Failed to create data directory ".concat(dataDir, ":"), e.message);
                        }
                    }
                    dbLogger.log("Opening database via: ".concat(dbUrl));
                    dbAuthToken = getDbAuthToken();
                    client = (0, client_1.createClient)(__assign({ url: dbUrl }, (dbAuthToken && { authToken: dbAuthToken })));
                    db = createDrizzleClient(client);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!isFileMode) return [3 /*break*/, 4];
                    return [4 /*yield*/, client.execute('PRAGMA journal_mode = WAL')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, client.execute('PRAGMA busy_timeout = 5000')];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    dbLogger.log('Running schema migrations...');
                    return [4 /*yield*/, migrateSchema({ db: db, client: client })];
                case 5:
                    _a.sent();
                    dbLogger.log('Schema migration complete');
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    dbLogger.error('Drizzle init failed:', (0, logger_js_1.formatErrorWithStack)(error_1));
                    throw error_1;
                case 7:
                    clientInstance = client;
                    dbInstance = db;
                    return [2 /*return*/, db];
            }
        });
    });
}
function migrateSchema(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var schemaPath, sql, statements, _i, statements_1, statement, alterStatements, _c, alterStatements_1, stmt, migrationStatements, _d, migrationStatements_1, stmt, botRows, _e, botRows_1, botRow;
        var db = _b.db, client = _b.client;
        return __generator(this, function (_f) {
            switch (_f.label) {
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
                    _f.label = 1;
                case 1:
                    if (!(_i < statements_1.length)) return [3 /*break*/, 4];
                    statement = statements_1[_i];
                    return [4 /*yield*/, client.execute(statement)];
                case 2:
                    _f.sent();
                    _f.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    alterStatements = [
                        'ALTER TABLE channel_models ADD COLUMN variant TEXT',
                        'ALTER TABLE session_models ADD COLUMN variant TEXT',
                        'ALTER TABLE global_models ADD COLUMN variant TEXT',
                        'ALTER TABLE bot_api_keys ADD COLUMN openai_api_key TEXT',
                        "ALTER TABLE bot_tokens ADD COLUMN bot_mode TEXT DEFAULT 'self_hosted'",
                        'ALTER TABLE bot_tokens ADD COLUMN client_id TEXT',
                        'ALTER TABLE bot_tokens ADD COLUMN client_secret TEXT',
                        'ALTER TABLE bot_tokens ADD COLUMN proxy_url TEXT',
                        'ALTER TABLE bot_tokens ADD COLUMN last_used_at DATETIME',
                        "ALTER TABLE thread_sessions ADD COLUMN source TEXT DEFAULT 'kimaki'",
                        'ALTER TABLE thread_sessions ADD COLUMN last_synced_name TEXT',
                    ];
                    _c = 0, alterStatements_1 = alterStatements;
                    _f.label = 5;
                case 5:
                    if (!(_c < alterStatements_1.length)) return [3 /*break*/, 8];
                    stmt = alterStatements_1[_c];
                    return [4 /*yield*/, client.execute(stmt).catch(function () { return undefined; })];
                case 6:
                    _f.sent();
                    _f.label = 7;
                case 7:
                    _c++;
                    return [3 /*break*/, 5];
                case 8:
                    migrationStatements = [
                        "\n      UPDATE session_models SET variant = (\n        SELECT thinking_value FROM session_thinking\n        WHERE session_thinking.session_id = session_models.session_id\n      ) WHERE variant IS NULL AND EXISTS (\n        SELECT 1 FROM session_thinking WHERE session_thinking.session_id = session_models.session_id\n      )\n    ",
                        "UPDATE channel_verbosity SET verbosity = 'tools_and_text' WHERE verbosity = 'tools-and-text'",
                        "UPDATE channel_verbosity SET verbosity = 'text_and_essential_tools' WHERE verbosity = 'text-and-essential-tools'",
                        "UPDATE channel_verbosity SET verbosity = 'text_only' WHERE verbosity = 'text-only'",
                        "UPDATE bot_tokens SET bot_mode = 'self_hosted' WHERE bot_mode = 'self-hosted'",
                        "UPDATE bot_tokens SET proxy_url = REPLACE(proxy_url, 'discord-gateway.kimaki.xyz', 'discord-gateway.kimaki.dev') WHERE bot_mode = 'gateway' AND proxy_url LIKE '%discord-gateway.kimaki.xyz%'",
                        "UPDATE thread_worktrees SET status = 'pending' WHERE status IS NULL",
                    ];
                    _d = 0, migrationStatements_1 = migrationStatements;
                    _f.label = 9;
                case 9:
                    if (!(_d < migrationStatements_1.length)) return [3 /*break*/, 12];
                    stmt = migrationStatements_1[_d];
                    return [4 /*yield*/, client.execute(stmt).catch(function () { return undefined; })];
                case 10:
                    _f.sent();
                    _f.label = 11;
                case 11:
                    _d++;
                    return [3 /*break*/, 9];
                case 12: return [4 /*yield*/, db.query.bot_tokens.findMany({
                        columns: {
                            app_id: true,
                            client_id: true,
                            client_secret: true,
                        },
                    }).catch(function () { return []; })];
                case 13:
                    botRows = _f.sent();
                    _e = 0, botRows_1 = botRows;
                    _f.label = 14;
                case 14:
                    if (!(_e < botRows_1.length)) return [3 /*break*/, 17];
                    botRow = botRows_1[_e];
                    if (botRow.client_id && botRow.client_secret) {
                        return [3 /*break*/, 16];
                    }
                    return [4 /*yield*/, db.update(schema.bot_tokens)
                            .set({
                            client_id: node_crypto_1.default.randomUUID(),
                            client_secret: node_crypto_1.default.randomBytes(32).toString('hex'),
                        })
                            .where(orm.eq(schema.bot_tokens.app_id, botRow.app_id))
                            .catch(function () { return undefined; })];
                case 15:
                    _f.sent();
                    _f.label = 16;
                case 16:
                    _e++;
                    return [3 /*break*/, 14];
                case 17: return [2 /*return*/];
            }
        });
    });
}
function closeDb() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (clientInstance) {
                clientInstance.close();
                clientInstance = null;
                dbInstance = null;
                initPromise = null;
                dbLogger.log('Drizzle connection closed');
            }
            return [2 /*return*/];
        });
    });
}
