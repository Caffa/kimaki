"use strict";
// Forum sync configuration from SQLite database.
// Reads forum_sync_configs table and resolves relative output dirs.
// On first run, migrates any existing forum-sync.json into the DB.
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
exports.readForumSyncConfig = readForumSyncConfig;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var yaml_1 = require("yaml");
var config_js_1 = require("../config.js");
var database_js_1 = require("../database.js");
var logger_js_1 = require("../logger.js");
var forumLogger = (0, logger_js_1.createLogger)('FORUM');
var LEGACY_CONFIG_FILE = 'forum-sync.json';
function isForumSyncDirection(value) {
    return value === 'discord-to-files' || value === 'bidirectional';
}
function resolveOutputDir(outputDir) {
    if (node_path_1.default.isAbsolute(outputDir))
        return outputDir;
    return node_path_1.default.resolve((0, config_js_1.getDataDir)(), outputDir);
}
/**
 * One-time migration: if the legacy forum-sync.json exists, import its entries
 * into the DB and rename the file so it's not re-imported on next startup.
 */
function migrateLegacyConfig(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var configPath, raw, parsed, forums, _i, forums_1, item, entry, forumChannelId, outputDir, direction, backupPath;
        var appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    configPath = node_path_1.default.join((0, config_js_1.getDataDir)(), LEGACY_CONFIG_FILE);
                    if (!node_fs_1.default.existsSync(configPath))
                        return [2 /*return*/];
                    forumLogger.log("Migrating legacy ".concat(LEGACY_CONFIG_FILE, " into database..."));
                    raw = node_fs_1.default.readFileSync(configPath, 'utf8');
                    try {
                        parsed = yaml_1.default.parse(raw);
                    }
                    catch (_d) {
                        forumLogger.warn("Failed to parse legacy ".concat(LEGACY_CONFIG_FILE, ", skipping migration"));
                        return [2 /*return*/];
                    }
                    if (!parsed || typeof parsed !== 'object')
                        return [2 /*return*/];
                    forums = parsed.forums;
                    if (!Array.isArray(forums))
                        return [2 /*return*/];
                    _i = 0, forums_1 = forums;
                    _c.label = 1;
                case 1:
                    if (!(_i < forums_1.length)) return [3 /*break*/, 4];
                    item = forums_1[_i];
                    if (!item || typeof item !== 'object')
                        return [3 /*break*/, 3];
                    entry = item;
                    forumChannelId = typeof entry.forumChannelId === 'string' ? entry.forumChannelId : '';
                    outputDir = typeof entry.outputDir === 'string' ? entry.outputDir : '';
                    direction = isForumSyncDirection(entry.direction)
                        ? entry.direction
                        : 'bidirectional';
                    if (!forumChannelId || !outputDir)
                        return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, database_js_1.upsertForumSyncConfig)({
                            appId: appId,
                            forumChannelId: forumChannelId,
                            outputDir: resolveOutputDir(outputDir),
                            direction: direction,
                        })];
                case 2:
                    _c.sent();
                    _c.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    backupPath = configPath + '.migrated';
                    node_fs_1.default.renameSync(configPath, backupPath);
                    forumLogger.log("Legacy config migrated and renamed to ".concat(node_path_1.default.basename(backupPath)));
                    return [2 /*return*/];
            }
        });
    });
}
function readForumSyncConfig(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var rows;
        var appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!appId)
                        return [2 /*return*/, []
                            // Migrate legacy JSON file on first run
                        ];
                    // Migrate legacy JSON file on first run
                    return [4 /*yield*/, migrateLegacyConfig({ appId: appId })];
                case 1:
                    // Migrate legacy JSON file on first run
                    _c.sent();
                    return [4 /*yield*/, (0, database_js_1.getForumSyncConfigs)({ appId: appId })];
                case 2:
                    rows = _c.sent();
                    return [2 /*return*/, rows.map(function (row) { return ({
                            forumChannelId: row.forumChannelId,
                            outputDir: resolveOutputDir(row.outputDir),
                            direction: isForumSyncDirection(row.direction)
                                ? row.direction
                                : 'bidirectional',
                        }); })];
            }
        });
    });
}
