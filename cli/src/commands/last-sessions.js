"use strict";
// /last-sessions command — list the 20 most recently active sessions across
// all projects, sorted by last activity. Renders a markdown table with
// clickable thread links and project names via Discord CV2 components.
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLastSessionsCommand = handleLastSessionsCommand;
var discord_js_1 = require("discord.js");
var node_path_1 = require("node:path");
var db_js_1 = require("../db.js");
var database_js_1 = require("../database.js");
var format_tables_js_1 = require("../format-tables.js");
var worktrees_js_1 = require("./worktrees.js");
var MAX_ROWS = 20;
function fetchRecentSessions(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, sessions, withTimestamp, top, channelDirCache, rows;
        var _this = this;
        var client = _b.client;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()
                    // Fetch all thread sessions with their most recent event timestamp.
                    // Fetch all sessions with their latest event and sort in JS.
                ];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.query.thread_sessions.findMany({
                            columns: {
                                thread_id: true,
                                session_id: true,
                                created_at: true,
                            },
                            with: {
                                session_events: {
                                    orderBy: { timestamp: 'desc' },
                                    limit: 1,
                                    columns: { timestamp: true },
                                },
                            },
                        })
                        // Build rows with resolved last-active timestamp
                    ];
                case 2:
                    sessions = _c.sent();
                    withTimestamp = sessions.map(function (s) {
                        var _a, _b;
                        var latestEventTs = (_a = s.session_events[0]) === null || _a === void 0 ? void 0 : _a.timestamp;
                        var lastActive = latestEventTs
                            ? new Date(Number(latestEventTs))
                            : (_b = s.created_at) !== null && _b !== void 0 ? _b : new Date(0);
                        return {
                            threadId: s.thread_id,
                            sessionId: s.session_id,
                            lastActive: lastActive,
                        };
                    });
                    // Sort by last active descending, take top N
                    withTimestamp.sort(function (a, b) {
                        return b.lastActive.getTime() - a.lastActive.getTime();
                    });
                    top = withTimestamp.slice(0, MAX_ROWS);
                    channelDirCache = new Map();
                    return [4 /*yield*/, Promise.all(top.map(function (row) { return __awaiter(_this, void 0, void 0, function () {
                            var projectName, channel, parentId, dir, _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 5, , 6]);
                                        return [4 /*yield*/, client.channels.fetch(row.threadId)];
                                    case 1:
                                        channel = _b.sent();
                                        parentId = channel && 'parentId' in channel ? channel.parentId : undefined;
                                        if (!parentId) return [3 /*break*/, 4];
                                        if (!!channelDirCache.has(parentId)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(parentId)];
                                    case 2:
                                        dir = _b.sent();
                                        channelDirCache.set(parentId, dir ? node_path_1.default.basename(dir.directory) : undefined);
                                        _b.label = 3;
                                    case 3:
                                        projectName = channelDirCache.get(parentId);
                                        _b.label = 4;
                                    case 4: return [3 /*break*/, 6];
                                    case 5:
                                        _a = _b.sent();
                                        return [3 /*break*/, 6];
                                    case 6: return [2 /*return*/, {
                                            threadId: row.threadId,
                                            sessionId: row.sessionId,
                                            lastActive: row.lastActive,
                                            projectName: projectName,
                                        }];
                                }
                            });
                        }); }))];
                case 3:
                    rows = _c.sent();
                    return [2 /*return*/, rows];
            }
        });
    });
}
function buildSessionTable(_a) {
    var rows = _a.rows;
    var header = '| Project | Thread | Last Active |';
    var separator = '|---|---|---|';
    var tableRows = rows.map(function (row) {
        var _a;
        var project = (_a = row.projectName) !== null && _a !== void 0 ? _a : 'unknown';
        var thread = "<#".concat(row.threadId, ">");
        var lastActive = (0, worktrees_js_1.formatTimeAgo)(row.lastActive);
        return "| ".concat(project, " | ").concat(thread, " | ").concat(lastActive, " |");
    });
    return __spreadArray([header, separator], tableRows, true).join('\n');
}
function handleLastSessionsCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var rows, textDisplay, tableMarkdown, segments, components;
        var command = _b.command;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!!command.guildId) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a server.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, command.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, fetchRecentSessions({ client: command.client })];
                case 4:
                    rows = _c.sent();
                    if (!(rows.length === 0)) return [3 /*break*/, 6];
                    textDisplay = {
                        type: discord_js_1.ComponentType.TextDisplay,
                        content: 'No sessions found.',
                    };
                    return [4 /*yield*/, command.editReply({
                            components: [textDisplay],
                            flags: discord_js_1.MessageFlags.IsComponentsV2,
                        })];
                case 5:
                    _c.sent();
                    return [2 /*return*/];
                case 6:
                    tableMarkdown = buildSessionTable({ rows: rows });
                    segments = (0, format_tables_js_1.splitTablesFromMarkdown)(tableMarkdown);
                    components = segments.flatMap(function (segment) {
                        if (segment.type === 'components') {
                            return segment.components;
                        }
                        var textDisplay = {
                            type: discord_js_1.ComponentType.TextDisplay,
                            content: segment.text,
                        };
                        return [textDisplay];
                    });
                    return [4 /*yield*/, command.editReply({
                            components: components,
                            flags: discord_js_1.MessageFlags.IsComponentsV2,
                        })];
                case 7:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
