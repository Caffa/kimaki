"use strict";
// /tasks command — list all scheduled tasks sorted by next run time.
// Renders a markdown table that the CV2 pipeline auto-formats for Discord,
// including HTML-backed action buttons for cancellable tasks.
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
exports.handleTasksCommand = handleTasksCommand;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var format_tables_js_1 = require("../format-tables.js");
var html_actions_js_1 = require("../html-actions.js");
var worktrees_js_1 = require("./worktrees.js");
function formatTimeUntil(date) {
    var diffMs = date.getTime() - Date.now();
    if (diffMs <= 0) {
        return 'due now';
    }
    var totalSeconds = Math.floor(diffMs / 1000);
    if (totalSeconds < 60) {
        return "in ".concat(totalSeconds, "s");
    }
    var totalMinutes = Math.floor(totalSeconds / 60);
    if (totalMinutes < 60) {
        return "in ".concat(totalMinutes, "m");
    }
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;
    if (hours < 24) {
        return minutes > 0 ? "in ".concat(hours, "h ").concat(minutes, "m") : "in ".concat(hours, "h");
    }
    var days = Math.floor(hours / 24);
    var remainingHours = hours % 24;
    return remainingHours > 0 ? "in ".concat(days, "d ").concat(remainingHours, "h") : "in ".concat(days, "d");
}
function scheduleLabel(task) {
    if (task.schedule_kind === 'cron') {
        return task.cron_expr || 'cron';
    }
    return 'one-time';
}
function canCancelTask(task) {
    return task.status === 'planned' || task.status === 'running';
}
// Escape pipe chars and collapse whitespace so free-text fields don't break
// GFM table column alignment.
function sanitizeTableCell(value) {
    return value.replaceAll('|', '\\|').replace(/\s+/g, ' ').trim();
}
function buildCancelButtonHtml(_a) {
    var buttonId = _a.buttonId;
    return "<button id=\"".concat(buttonId, "\" variant=\"secondary\">Delete</button>");
}
function buildActionCell(task) {
    if (!canCancelTask(task)) {
        return '-';
    }
    return buildCancelButtonHtml({ buttonId: "cancel-task-".concat(task.id) });
}
// Cap rows to avoid exceeding Discord's 40-component CV2 limit.
// Each cancellable row renders as text + action row + button (~4 components),
// so 10 rows is a safe ceiling.
var MAX_TASK_ROWS = 10;
function buildTaskTable(_a) {
    var tasks = _a.tasks;
    var header = '| ID | Status | Prompt | Schedule | Next Run | Action |';
    var separator = '|---|---|---|---|---|---|';
    var rows = tasks.map(function (task) {
        var id = String(task.id);
        var status = task.status;
        var prompt = sanitizeTableCell(task.prompt_preview.length > 240
            ? task.prompt_preview.slice(0, 237) + '...'
            : task.prompt_preview);
        var schedule = sanitizeTableCell(scheduleLabel(task));
        var nextRun = (function () {
            if (task.status === 'completed' ||
                task.status === 'cancelled' ||
                task.status === 'failed') {
                return task.last_run_at ? (0, worktrees_js_1.formatTimeAgo)(task.last_run_at) : '-';
            }
            return formatTimeUntil(task.next_run_at);
        })();
        var action = buildActionCell(task);
        return "| ".concat(id, " | ").concat(status, " | ").concat(prompt, " | ").concat(schedule, " | ").concat(nextRun, " | ").concat(action, " |");
    });
    return __spreadArray([header, separator], rows, true).join('\n');
}
function getTasksActionOwnerKey(_a) {
    var userId = _a.userId, channelId = _a.channelId;
    return "tasks:".concat(userId, ":").concat(channelId);
}
function renderTasksReply(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var ownerKey, statuses, allTasks, message, textDisplay, tasks, truncatedNotice, combinedNotice, cancellableTasksByButtonId, tableMarkdown, markdown, segments, components;
        var _this = this;
        var guildId = _b.guildId, userId = _b.userId, channelId = _b.channelId, showAll = _b.showAll, notice = _b.notice, editReply = _b.editReply;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    ownerKey = getTasksActionOwnerKey({ userId: userId, channelId: channelId });
                    (0, html_actions_js_1.cancelHtmlActionsForOwner)(ownerKey);
                    statuses = showAll
                        ? undefined
                        : ['planned', 'running'];
                    return [4 /*yield*/, (0, database_js_1.listScheduledTasks)({ statuses: statuses })];
                case 1:
                    allTasks = _c.sent();
                    if (!(allTasks.length === 0)) return [3 /*break*/, 3];
                    message = notice
                        ? "".concat(notice, "\n\nNo scheduled tasks found.")
                        : 'No scheduled tasks found.';
                    textDisplay = {
                        type: discord_js_1.ComponentType.TextDisplay,
                        content: message,
                    };
                    return [4 /*yield*/, editReply({
                            components: [textDisplay],
                            flags: discord_js_1.MessageFlags.IsComponentsV2,
                        })];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
                case 3:
                    tasks = allTasks.slice(0, MAX_TASK_ROWS);
                    truncatedNotice = allTasks.length > MAX_TASK_ROWS
                        ? "Showing ".concat(MAX_TASK_ROWS, "/").concat(allTasks.length, " tasks. Use `kimaki task list` for full list.")
                        : undefined;
                    combinedNotice = [notice, truncatedNotice].filter(Boolean).join('\n');
                    cancellableTasksByButtonId = new Map();
                    tasks.forEach(function (task) {
                        if (!canCancelTask(task)) {
                            return;
                        }
                        cancellableTasksByButtonId.set("cancel-task-".concat(task.id), task);
                    });
                    tableMarkdown = buildTaskTable({ tasks: tasks });
                    markdown = combinedNotice
                        ? "".concat(combinedNotice, "\n\n").concat(tableMarkdown)
                        : tableMarkdown;
                    segments = (0, format_tables_js_1.splitTablesFromMarkdown)(markdown, {
                        resolveButtonCustomId: function (_a) {
                            var button = _a.button;
                            var task = cancellableTasksByButtonId.get(button.id);
                            if (!task) {
                                return new Error("No task registered for button ".concat(button.id));
                            }
                            var actionId = (0, html_actions_js_1.registerHtmlAction)({
                                ownerKey: ownerKey,
                                threadId: String(task.id),
                                run: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                    var interaction = _b.interaction;
                                    return __generator(this, function (_c) {
                                        switch (_c.label) {
                                            case 0: return [4 /*yield*/, handleCancelTaskAction({
                                                    interaction: interaction,
                                                    taskId: task.id,
                                                    showAll: showAll,
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
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleCancelTaskAction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var guildId, cancelled, notice;
        var interaction = _b.interaction, taskId = _b.taskId, showAll = _b.showAll;
        return __generator(this, function (_c) {
            switch (_c.label) {
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
                    _c.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, (0, database_js_1.cancelScheduledTask)(taskId)];
                case 3:
                    cancelled = _c.sent();
                    notice = cancelled
                        ? "Cancelled task #".concat(taskId, ".")
                        : "Task #".concat(taskId, " not found or already finalized.");
                    return [4 /*yield*/, renderTasksReply({
                            guildId: guildId,
                            userId: interaction.user.id,
                            channelId: interaction.channelId,
                            showAll: showAll,
                            notice: notice,
                            editReply: function (options) {
                                return interaction.editReply(options);
                            },
                        })];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleTasksCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var guildId, showAll;
        var _c;
        var command = _b.command;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    guildId = command.guildId;
                    if (!!guildId) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a server.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _d.sent();
                    return [2 /*return*/];
                case 2:
                    showAll = (_c = command.options.getBoolean('all')) !== null && _c !== void 0 ? _c : false;
                    return [4 /*yield*/, command.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 3:
                    _d.sent();
                    return [4 /*yield*/, renderTasksReply({
                            guildId: guildId,
                            userId: command.user.id,
                            channelId: command.channelId,
                            showAll: showAll,
                            editReply: function (options) {
                                return command.editReply(options);
                            },
                        })];
                case 4:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
