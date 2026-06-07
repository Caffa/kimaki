"use strict";
// /worktrees command — list all git worktrees for the current channel's project.
// Uses `git worktree list --porcelain` as source of truth, enriched with
// DB metadata (thread link, created_at) when available. Shows kimaki-created,
// opencode-created, and manually created worktrees in a single table.
// Renders a markdown table that the CV2 pipeline auto-formats for Discord,
// including HTML-backed action buttons for deletable worktrees.
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
exports.extractGitStderr = extractGitStderr;
exports.formatTimeAgo = formatTimeAgo;
exports.handleWorktreesCommand = handleWorktreesCommand;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var db_js_1 = require("../db.js");
var format_tables_js_1 = require("../format-tables.js");
var html_actions_js_1 = require("../html-actions.js");
var errore = require("errore");
var node_crypto_1 = require("node:crypto");
var errors_js_1 = require("../errors.js");
var discord_utils_js_1 = require("../discord-utils.js");
var worktrees_js_1 = require("../worktrees.js");
var node_path_1 = require("node:path");
// Extracts the git stderr from a deleteWorktree error via errore.findCause.
// Chain: Error { cause: GitCommandError { cause: CommandError { stderr } } }.
function extractGitStderr(error) {
    var _a, _b;
    var gitErr = errore.findCause(error, errors_js_1.GitCommandError);
    var stderr = (_b = (_a = gitErr === null || gitErr === void 0 ? void 0 : gitErr.cause) === null || _a === void 0 ? void 0 : _a.stderr) === null || _b === void 0 ? void 0 : _b.trim();
    if (stderr && stderr.length > 0) {
        return stderr;
    }
    return undefined;
}
function formatTimeAgo(date) {
    var diffMs = Date.now() - date.getTime();
    if (diffMs < 0) {
        return 'just now';
    }
    var totalSeconds = Math.floor(diffMs / 1000);
    if (totalSeconds < 60) {
        return "".concat(totalSeconds, "s ago");
    }
    var totalMinutes = Math.floor(totalSeconds / 60);
    if (totalMinutes < 60) {
        return "".concat(totalMinutes, "m ago");
    }
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;
    if (hours < 24) {
        return minutes > 0 ? "".concat(hours, "h ").concat(minutes, "m ago") : "".concat(hours, "h ago");
    }
    var days = Math.floor(hours / 24);
    var remainingHours = hours % 24;
    return remainingHours > 0 ? "".concat(days, "d ").concat(remainingHours, "h ago") : "".concat(days, "d ago");
}
// Stable button ID derived from directory path via sha1 hash.
// Avoids collisions that truncated path suffixes can cause.
function worktreeButtonKey(directory) {
    return node_crypto_1.default.createHash('sha1').update(directory).digest('hex').slice(0, 12);
}
// 5s timeout per git call — prevents hangs from deleted dirs, git locks, slow disks.
// Returns null on timeout/error so the table shows "unknown" for that worktree.
var GIT_CMD_TIMEOUT = 5000;
var GLOBAL_TIMEOUT = 10000;
// Detect worktree source from branch name and directory path.
// opencode/kimaki-* branches → kimaki, opencode worktree paths → opencode, else manual.
function detectWorktreeSource(_a) {
    var branch = _a.branch, directory = _a.directory;
    if (branch === null || branch === void 0 ? void 0 : branch.startsWith('opencode/kimaki-')) {
        return 'kimaki';
    }
    // opencode stores worktrees under ~/.local/share/opencode/worktree/
    if (directory.includes('/opencode/worktree/')) {
        return 'opencode';
    }
    return 'manual';
}
// Checks dirty state and commits ahead of default branch in parallel.
// Returns null when the directory is missing / git commands fail / timeout.
function getWorktreeGitStatus(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, statusResult, aheadResult, aheadCount, _d;
        var directory = _b.directory, defaultBranch = _b.defaultBranch;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            (0, worktrees_js_1.git)(directory, 'status --porcelain', { timeout: GIT_CMD_TIMEOUT }),
                            (0, worktrees_js_1.git)(directory, "rev-list --count \"".concat(defaultBranch, "..HEAD\""), {
                                timeout: GIT_CMD_TIMEOUT,
                            }),
                        ])];
                case 1:
                    _c = _e.sent(), statusResult = _c[0], aheadResult = _c[1];
                    if (statusResult instanceof Error || aheadResult instanceof Error) {
                        return [2 /*return*/, null];
                    }
                    aheadCount = parseInt(aheadResult, 10);
                    if (!Number.isFinite(aheadCount)) {
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, { dirty: statusResult.length > 0, aheadCount: aheadCount }];
                case 2:
                    _d = _e.sent();
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function buildWorktreeTable(_a) {
    var rows = _a.rows, gitStatuses = _a.gitStatuses, guildId = _a.guildId;
    var header = '| Source | Name | Status | Created | Folder | Action |';
    var separator = '|---|---|---|---|---|---|';
    var tableRows = rows.map(function (row, i) {
        var _a;
        var sourceCell = (function () {
            if (row.threadId && row.guildId) {
                var threadLink = "[".concat(row.source, "](https://discord.com/channels/").concat(row.guildId, "/").concat(row.threadId, ")");
                return threadLink;
            }
            return row.source;
        })();
        var name = row.name;
        var gs = (_a = gitStatuses[i]) !== null && _a !== void 0 ? _a : null;
        var status = (function () {
            if (row.dbStatus !== 'ready') {
                return row.dbStatus;
            }
            if (row.locked) {
                return 'locked';
            }
            if (row.prunable) {
                return 'prunable';
            }
            if (!gs) {
                return 'unknown';
            }
            var parts = [];
            if (gs.dirty) {
                parts.push('dirty');
            }
            if (gs.aheadCount > 0) {
                parts.push("".concat(gs.aheadCount, " ahead"));
            }
            else {
                parts.push('merged');
            }
            return parts.join(', ');
        })();
        var created = row.createdAt ? formatTimeAgo(row.createdAt) : '-';
        var folder = row.directory;
        var action = buildActionCell({ row: row, gitStatus: gs });
        return "| ".concat(sourceCell, " | ").concat(name, " | ").concat(status, " | ").concat(created, " | ").concat(folder, " | ").concat(action, " |");
    });
    return __spreadArray([header, separator], tableRows, true).join('\n');
}
function buildActionCell(_a) {
    var row = _a.row, gitStatus = _a.gitStatus;
    if (!canDeleteWorktree({ row: row, gitStatus: gitStatus })) {
        return '-';
    }
    return buildDeleteButtonHtml({
        buttonId: "del-wt-".concat(worktreeButtonKey(row.directory)),
    });
}
function buildDeleteButtonHtml(_a) {
    var buttonId = _a.buttonId;
    return "<button id=\"".concat(buttonId, "\" variant=\"secondary\">Delete</button>");
}
function canDeleteWorktree(_a) {
    var row = _a.row, gitStatus = _a.gitStatus;
    if (row.dbStatus !== 'ready') {
        return false;
    }
    if (row.locked) {
        return false;
    }
    if (!gitStatus) {
        return false;
    }
    if (gitStatus.dirty) {
        return false;
    }
    return gitStatus.aheadCount === 0;
}
// Resolves git statuses for all worktrees within a single global deadline.
function resolveGitStatuses(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var nullFallback, timer, deadline, work;
        var _this = this;
        var rows = _b.rows, projectDirectory = _b.projectDirectory, timeout = _b.timeout;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    nullFallback = rows.map(function () { return null; });
                    deadline = new Promise(function (resolve) {
                        timer = setTimeout(function () {
                            resolve(nullFallback);
                        }, timeout);
                    });
                    work = (function () { return __awaiter(_this, void 0, void 0, function () {
                        var defaultBranch;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, worktrees_js_1.getDefaultBranch)(projectDirectory, {
                                        timeout: GIT_CMD_TIMEOUT,
                                    })];
                                case 1:
                                    defaultBranch = _a.sent();
                                    return [2 /*return*/, Promise.all(rows.map(function (row) {
                                            if (row.dbStatus !== 'ready' || row.locked || row.prunable) {
                                                return null;
                                            }
                                            return getWorktreeGitStatus({ directory: row.directory, defaultBranch: defaultBranch });
                                        }))];
                            }
                        });
                    }); })();
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, Promise.race([work, deadline])];
                case 2: return [2 /*return*/, _c.sent()];
                case 3:
                    clearTimeout(timer);
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Merge git worktrees with DB metadata into unified WorktreeRows.
// Git is the source of truth for what exists on disk. DB rows that aren't
// in the git list (pending/error) are appended at the end.
function buildWorktreeRows(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, dbWorktrees, dbByDirectory, _i, dbWorktrees_1, dbWt, matchedDbThreadIds, gitRows, dbOnlyRows;
        var projectDirectory = _b.projectDirectory, gitWorktrees = _b.gitWorktrees;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.query.thread_worktrees.findMany({
                            where: { project_directory: projectDirectory },
                        })
                        // Index DB worktrees by directory for fast lookup
                    ];
                case 2:
                    dbWorktrees = _c.sent();
                    dbByDirectory = new Map();
                    for (_i = 0, dbWorktrees_1 = dbWorktrees; _i < dbWorktrees_1.length; _i++) {
                        dbWt = dbWorktrees_1[_i];
                        if (dbWt.worktree_directory) {
                            dbByDirectory.set(dbWt.worktree_directory, dbWt);
                        }
                    }
                    matchedDbThreadIds = new Set();
                    gitRows = gitWorktrees.map(function (gw) {
                        var _a, _b, _c;
                        var dbMatch = dbByDirectory.get(gw.directory);
                        if (dbMatch) {
                            matchedDbThreadIds.add(dbMatch.thread_id);
                        }
                        var source = detectWorktreeSource({
                            branch: gw.branch,
                            directory: gw.directory,
                        });
                        var name = (_a = gw.branch) !== null && _a !== void 0 ? _a : node_path_1.default.basename(gw.directory);
                        var dbStatus = (function () {
                            if (!dbMatch) {
                                return 'ready';
                            }
                            if (dbMatch.status === 'error') {
                                return 'error';
                            }
                            if (dbMatch.status === 'pending') {
                                return 'pending';
                            }
                            return 'ready';
                        })();
                        return {
                            directory: gw.directory,
                            branch: gw.branch,
                            name: name,
                            threadId: (_b = dbMatch === null || dbMatch === void 0 ? void 0 : dbMatch.thread_id) !== null && _b !== void 0 ? _b : null,
                            guildId: null, // filled in by caller
                            createdAt: (_c = dbMatch === null || dbMatch === void 0 ? void 0 : dbMatch.created_at) !== null && _c !== void 0 ? _c : null,
                            source: source,
                            dbStatus: dbStatus,
                            locked: gw.locked,
                            prunable: gw.prunable,
                        };
                    });
                    dbOnlyRows = dbWorktrees
                        .filter(function (dbWt) {
                        return !matchedDbThreadIds.has(dbWt.thread_id);
                    })
                        .map(function (dbWt) {
                        var _a;
                        var dbStatus = (function () {
                            if (dbWt.status === 'error') {
                                return 'error';
                            }
                            if (dbWt.status === 'pending') {
                                return 'pending';
                            }
                            return 'ready';
                        })();
                        return {
                            directory: (_a = dbWt.worktree_directory) !== null && _a !== void 0 ? _a : dbWt.project_directory,
                            branch: null,
                            name: dbWt.worktree_name,
                            threadId: dbWt.thread_id,
                            guildId: null,
                            createdAt: dbWt.created_at,
                            source: 'kimaki',
                            dbStatus: dbStatus,
                            locked: false,
                            prunable: false,
                        };
                    });
                    return [2 /*return*/, __spreadArray(__spreadArray([], gitRows, true), dbOnlyRows, true)];
            }
        });
    });
}
function getWorktreesActionOwnerKey(_a) {
    var userId = _a.userId, channelId = _a.channelId;
    return "worktrees:".concat(userId, ":").concat(channelId);
}
function isProjectChannel(channel) {
    if (!channel) {
        return false;
    }
    return [
        discord_js_1.ChannelType.GuildText,
        discord_js_1.ChannelType.PublicThread,
        discord_js_1.ChannelType.PrivateThread,
        discord_js_1.ChannelType.AnnouncementThread,
    ].includes(channel.type);
}
function renderWorktreesReply(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var ownerKey, gitWorktrees, gitList, rows, _i, rows_1, row, message, textDisplay, gitStatuses, deletableRowsByButtonId, tableMarkdown, markdown, segments, components;
        var _this = this;
        var guildId = _b.guildId, userId = _b.userId, channelId = _b.channelId, projectDirectory = _b.projectDirectory, notice = _b.notice, editReply = _b.editReply;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    ownerKey = getWorktreesActionOwnerKey({ userId: userId, channelId: channelId });
                    (0, html_actions_js_1.cancelHtmlActionsForOwner)(ownerKey);
                    return [4 /*yield*/, (0, worktrees_js_1.listGitWorktrees)({
                            projectDirectory: projectDirectory,
                            timeout: GIT_CMD_TIMEOUT,
                        })
                        // On git failure, fall back to empty list (DB-only rows still shown)
                    ];
                case 1:
                    gitWorktrees = _c.sent();
                    gitList = gitWorktrees instanceof Error ? [] : gitWorktrees;
                    return [4 /*yield*/, buildWorktreeRows({ projectDirectory: projectDirectory, gitWorktrees: gitList })
                        // Inject guildId into all rows for thread link rendering
                    ];
                case 2:
                    rows = _c.sent();
                    // Inject guildId into all rows for thread link rendering
                    for (_i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                        row = rows_1[_i];
                        row.guildId = guildId;
                    }
                    if (!(rows.length === 0)) return [3 /*break*/, 4];
                    message = notice
                        ? "".concat(notice, "\n\nNo worktrees found.")
                        : 'No worktrees found.';
                    textDisplay = {
                        type: discord_js_1.ComponentType.TextDisplay,
                        content: message,
                    };
                    return [4 /*yield*/, editReply({
                            components: [textDisplay],
                            flags: discord_js_1.MessageFlags.IsComponentsV2,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, resolveGitStatuses({
                        rows: rows,
                        projectDirectory: projectDirectory,
                        timeout: GLOBAL_TIMEOUT,
                    })
                    // Map deletable worktrees by button ID for the HTML action resolver.
                    // Uses the same worktreeButtonKey() as buildActionCell.
                ];
                case 5:
                    gitStatuses = _c.sent();
                    deletableRowsByButtonId = new Map();
                    rows.forEach(function (row, index) {
                        var _a;
                        var gitStatus = (_a = gitStatuses[index]) !== null && _a !== void 0 ? _a : null;
                        if (!canDeleteWorktree({ row: row, gitStatus: gitStatus })) {
                            return;
                        }
                        deletableRowsByButtonId.set("del-wt-".concat(worktreeButtonKey(row.directory)), row);
                    });
                    tableMarkdown = buildWorktreeTable({
                        rows: rows,
                        gitStatuses: gitStatuses,
                        guildId: guildId,
                    });
                    markdown = notice ? "".concat(notice, "\n\n").concat(tableMarkdown) : tableMarkdown;
                    segments = (0, format_tables_js_1.splitTablesFromMarkdown)(markdown, {
                        resolveButtonCustomId: function (_a) {
                            var _b;
                            var button = _a.button;
                            var row = deletableRowsByButtonId.get(button.id);
                            if (!row) {
                                return new Error("No worktree registered for button ".concat(button.id));
                            }
                            var actionId = (0, html_actions_js_1.registerHtmlAction)({
                                ownerKey: ownerKey,
                                threadId: (_b = row.threadId) !== null && _b !== void 0 ? _b : row.directory,
                                run: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                    var interaction = _b.interaction;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, handleDeleteWorktreeAction({
                                                    interaction: interaction,
                                                    row: row,
                                                    projectDirectory: projectDirectory,
                                                })];
                                            case 1:
                                                _c.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); },
                            });
                            return (0, html_actions_js_1.buildHtmlActionCustomId)(actionId);
                        },
                    });
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
                    return [4 /*yield*/, editReply({
                            components: components,
                            flags: discord_js_1.MessageFlags.IsComponentsV2,
                        })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleDeleteWorktreeAction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var guildId, displayName, deleteResult, gitStderr, detail;
        var _c, _d;
        var interaction = _b.interaction, row = _b.row, projectDirectory = _b.projectDirectory;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    guildId = interaction.guildId;
                    if (!!guildId) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.editReply({
                            components: [
                                {
                                    type: discord_js_1.ComponentType.TextDisplay,
                                    content: 'This action can only be used in a server.',
                                },
                            ],
                            flags: discord_js_1.MessageFlags.IsComponentsV2,
                        })];
                case 1:
                    _e.sent();
                    return [2 /*return*/];
                case 2:
                    displayName = (_c = row.branch) !== null && _c !== void 0 ? _c : row.name;
                    return [4 /*yield*/, (0, worktrees_js_1.deleteWorktree)({
                            projectDirectory: projectDirectory,
                            worktreeDirectory: row.directory,
                            worktreeName: (_d = row.branch) !== null && _d !== void 0 ? _d : '',
                        })];
                case 3:
                    deleteResult = _e.sent();
                    if (!(deleteResult instanceof Error)) return [3 /*break*/, 5];
                    gitStderr = extractGitStderr(deleteResult);
                    detail = gitStderr
                        ? "```\n".concat(gitStderr, "\n```")
                        : deleteResult.message;
                    return [4 /*yield*/, interaction
                            .followUp({
                            content: "Failed to delete `".concat(displayName, "`\n").concat(detail),
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })
                            .catch(function () {
                            return undefined;
                        })];
                case 4:
                    _e.sent();
                    return [2 /*return*/];
                case 5:
                    if (!row.threadId) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, database_js_1.deleteThreadWorktree)(row.threadId)];
                case 6:
                    _e.sent();
                    _e.label = 7;
                case 7: return [4 /*yield*/, renderWorktreesReply({
                        guildId: guildId,
                        userId: interaction.user.id,
                        channelId: interaction.channelId,
                        projectDirectory: projectDirectory,
                        notice: "Deleted `".concat(displayName, "`."),
                        editReply: function (options) {
                            return interaction.editReply(options);
                        },
                    })];
                case 8:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleWorktreesCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, guildId, resolved;
        var command = _b.command;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channel = command.channel;
                    guildId = command.guildId;
                    if (!(!guildId || !channel)) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a server channel.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    if (!!isProjectChannel(channel)) return [3 /*break*/, 4];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a project channel or thread.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: channel,
                    })];
                case 5:
                    resolved = _c.sent();
                    if (!!resolved) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine the project folder for this channel.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7: return [4 /*yield*/, command.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 8:
                    _c.sent();
                    return [4 /*yield*/, renderWorktreesReply({
                            guildId: guildId,
                            userId: command.user.id,
                            channelId: command.channelId,
                            projectDirectory: resolved.projectDirectory,
                            editReply: function (options) {
                                return command.editReply(options);
                            },
                        })];
                case 9:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
