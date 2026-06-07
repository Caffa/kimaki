"use strict";
// Scheduled task runner for executing due `send --send-at` jobs in the bot process.
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
exports.startTaskRunner = startTaskRunner;
var discord_js_1 = require("discord.js");
var discord_urls_js_1 = require("./discord-urls.js");
var yaml_1 = require("yaml");
var database_js_1 = require("./database.js");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
var task_schedule_js_1 = require("./task-schedule.js");
var taskLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.TASK);
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function parseMessageId(value) {
    if (!isRecord(value)) {
        return new Error('Discord response is not an object');
    }
    if (typeof value.id !== 'string') {
        return new Error('Discord response is missing message ID');
    }
    return value.id;
}
function executeThreadScheduledTask(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var marker, embed, prefixedPrompt, postResult;
        var _c, _d;
        var rest = _b.rest, task = _b.task, payload = _b.payload;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    marker = __assign(__assign(__assign(__assign(__assign(__assign({ start: true, scheduledKind: task.schedule_kind, scheduledTaskId: task.id }, (payload.agent ? { agent: payload.agent } : {})), (payload.model ? { model: payload.model } : {})), (payload.username ? { username: payload.username } : {})), (payload.userId ? { userId: payload.userId } : {})), (((_c = payload.permissions) === null || _c === void 0 ? void 0 : _c.length) ? { permissions: payload.permissions } : {})), (((_d = payload.injectionGuardPatterns) === null || _d === void 0 ? void 0 : _d.length)
                        ? { injectionGuardPatterns: payload.injectionGuardPatterns }
                        : {}));
                    embed = [{ color: 0x2b2d31, footer: { text: yaml_1.default.stringify(marker) } }];
                    prefixedPrompt = "\u00BB **kimaki-cli:**\n".concat(payload.prompt);
                    return [4 /*yield*/, rest
                            .post(discord_js_1.Routes.channelMessages(payload.threadId), {
                            body: {
                                content: prefixedPrompt,
                                embeds: embed,
                            },
                        })
                            .catch(function (error) {
                            return new Error("Failed to post scheduled thread task ".concat(task.id), {
                                cause: error,
                            });
                        })];
                case 1:
                    postResult = _e.sent();
                    if (postResult instanceof Error) {
                        return [2 /*return*/, postResult];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function executeChannelScheduledTask(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var marker, embeds, starterResult, starterMessageId, threadName, threadResult, threadIdResult, addMemberResult;
        var _c, _d;
        var rest = _b.rest, task = _b.task, payload = _b.payload;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    marker = payload.notifyOnly
                        ? undefined
                        : __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ start: true, scheduledKind: task.schedule_kind, scheduledTaskId: task.id }, (payload.worktreeName ? { worktree: payload.worktreeName } : {})), (payload.cwd ? { cwd: payload.cwd } : {})), (payload.agent ? { agent: payload.agent } : {})), (payload.model ? { model: payload.model } : {})), (payload.username ? { username: payload.username } : {})), (payload.userId ? { userId: payload.userId } : {})), (((_c = payload.permissions) === null || _c === void 0 ? void 0 : _c.length) ? { permissions: payload.permissions } : {})), (((_d = payload.injectionGuardPatterns) === null || _d === void 0 ? void 0 : _d.length)
                            ? { injectionGuardPatterns: payload.injectionGuardPatterns }
                            : {}));
                    embeds = marker
                        ? [{ color: 0x2b2d31, footer: { text: yaml_1.default.stringify(marker) } }]
                        : undefined;
                    return [4 /*yield*/, rest
                            .post(discord_js_1.Routes.channelMessages(payload.channelId), {
                            body: {
                                content: payload.prompt,
                                embeds: embeds,
                            },
                        })
                            .catch(function (error) {
                            return new Error("Failed to create starter message for task ".concat(task.id), {
                                cause: error,
                            });
                        })];
                case 1:
                    starterResult = _e.sent();
                    if (starterResult instanceof Error) {
                        return [2 /*return*/, starterResult];
                    }
                    starterMessageId = parseMessageId(starterResult);
                    if (starterMessageId instanceof Error) {
                        return [2 /*return*/, new Error("Invalid starter message response for task ".concat(task.id), {
                                cause: starterMessageId,
                            })];
                    }
                    threadName = (payload.name || (0, task_schedule_js_1.getPromptPreview)(payload.prompt)).slice(0, 100);
                    return [4 /*yield*/, rest
                            .post(discord_js_1.Routes.threads(payload.channelId, starterMessageId), {
                            body: {
                                name: threadName,
                                auto_archive_duration: 1440,
                            },
                        })
                            .catch(function (error) {
                            return new Error("Failed to create thread for task ".concat(task.id), {
                                cause: error,
                            });
                        })];
                case 2:
                    threadResult = _e.sent();
                    if (threadResult instanceof Error) {
                        return [2 /*return*/, threadResult];
                    }
                    if (!payload.userId) {
                        return [2 /*return*/];
                    }
                    threadIdResult = parseMessageId(threadResult);
                    if (threadIdResult instanceof Error) {
                        return [2 /*return*/, new Error("Invalid thread response for task ".concat(task.id), {
                                cause: threadIdResult,
                            })];
                    }
                    return [4 /*yield*/, rest
                            .put(discord_js_1.Routes.threadMembers(threadIdResult, payload.userId))
                            .catch(function (error) {
                            return new Error("Failed to add user to scheduled thread for task ".concat(task.id), { cause: error });
                        })];
                case 3:
                    addMemberResult = _e.sent();
                    if (addMemberResult instanceof Error) {
                        return [2 /*return*/, addMemberResult];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function executeScheduledTask(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var payloadResult;
        var rest = _b.rest, task = _b.task;
        return __generator(this, function (_c) {
            payloadResult = (0, task_schedule_js_1.parseScheduledTaskPayload)(task.payload_json);
            if (payloadResult instanceof Error) {
                return [2 /*return*/, new Error("Task ".concat(task.id, " has invalid payload"), {
                        cause: payloadResult,
                    })];
            }
            if (payloadResult.kind === 'thread') {
                return [2 /*return*/, executeThreadScheduledTask({
                        rest: rest,
                        task: task,
                        payload: payloadResult,
                    })];
            }
            return [2 /*return*/, executeChannelScheduledTask({
                    rest: rest,
                    task: task,
                    payload: payloadResult,
                })];
        });
    });
}
function finalizeSuccessfulTask(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var timezone, nextRunResult;
        var task = _b.task, completedAt = _b.completedAt;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(task.schedule_kind === 'at')) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, database_js_1.markScheduledTaskOneShotCompleted)({ taskId: task.id, completedAt: completedAt })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    if (!!task.cron_expr) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, database_js_1.markScheduledTaskFailed)({
                            taskId: task.id,
                            failedAt: completedAt,
                            errorMessage: 'Missing cron expression on cron task',
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4:
                    timezone = task.timezone || 'UTC';
                    nextRunResult = (0, task_schedule_js_1.getNextCronRun)({
                        cronExpr: task.cron_expr,
                        timezone: timezone,
                        from: completedAt,
                    });
                    if (!(nextRunResult instanceof Error)) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, database_js_1.markScheduledTaskFailed)({
                            taskId: task.id,
                            failedAt: completedAt,
                            errorMessage: nextRunResult.message,
                        })];
                case 5:
                    _c.sent();
                    return [2 /*return*/];
                case 6: return [4 /*yield*/, (0, database_js_1.markScheduledTaskCronRescheduled)({
                        taskId: task.id,
                        completedAt: completedAt,
                        nextRunAt: nextRunResult,
                    })];
                case 7:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function finalizeFailedTask(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var timezone, nextRunResult;
        var task = _b.task, failedAt = _b.failedAt, error = _b.error;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(task.schedule_kind === 'cron' && task.cron_expr)) return [3 /*break*/, 2];
                    timezone = task.timezone || 'UTC';
                    nextRunResult = (0, task_schedule_js_1.getNextCronRun)({
                        cronExpr: task.cron_expr,
                        timezone: timezone,
                        from: failedAt,
                    });
                    if (!!(nextRunResult instanceof Error)) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, database_js_1.markScheduledTaskCronRetry)({
                            taskId: task.id,
                            failedAt: failedAt,
                            errorMessage: error.message,
                            nextRunAt: nextRunResult,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, (0, database_js_1.markScheduledTaskFailed)({
                        taskId: task.id,
                        failedAt: failedAt,
                        errorMessage: error.message,
                    })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function processDueTask(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var startedAt, claimed, executeResult, finishedAt;
        var rest = _b.rest, task = _b.task;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    startedAt = new Date();
                    return [4 /*yield*/, (0, database_js_1.claimScheduledTaskRunning)({
                            taskId: task.id,
                            startedAt: startedAt,
                        })];
                case 1:
                    claimed = _c.sent();
                    if (!claimed) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, executeScheduledTask({ rest: rest, task: task })];
                case 2:
                    executeResult = _c.sent();
                    finishedAt = new Date();
                    if (!(executeResult instanceof Error)) return [3 /*break*/, 4];
                    taskLogger.warn("[task-runner] task ".concat(task.id, " failed: ").concat((0, logger_js_1.formatErrorWithStack)(executeResult)));
                    return [4 /*yield*/, finalizeFailedTask({
                            task: task,
                            failedAt: finishedAt,
                            error: executeResult,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, finalizeSuccessfulTask({ task: task, completedAt: finishedAt })];
                case 5:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function runTaskRunnerTick(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var staleBefore, recoveredCount, dueTasks;
        var _this = this;
        var rest = _b.rest, staleRunningMs = _b.staleRunningMs, dueBatchSize = _b.dueBatchSize;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    staleBefore = new Date(Date.now() - staleRunningMs);
                    return [4 /*yield*/, (0, database_js_1.recoverStaleRunningScheduledTasks)({
                            staleBefore: staleBefore,
                        })];
                case 1:
                    recoveredCount = _c.sent();
                    if (recoveredCount > 0) {
                        taskLogger.warn("[task-runner] Recovered ".concat(recoveredCount, " stale running task(s)"));
                    }
                    return [4 /*yield*/, (0, database_js_1.getDuePlannedScheduledTasks)({
                            now: new Date(),
                            limit: dueBatchSize,
                        })];
                case 2:
                    dueTasks = _c.sent();
                    return [4 /*yield*/, dueTasks.reduce(function (previous, task) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, previous];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, processDueTask({ rest: rest, task: task })];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }, Promise.resolve())];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function startTaskRunner(_a) {
    var _this = this;
    var token = _a.token, _b = _a.pollIntervalMs, pollIntervalMs = _b === void 0 ? 5000 : _b, _c = _a.staleRunningMs, staleRunningMs = _c === void 0 ? 120000 : _c, _d = _a.dueBatchSize, dueBatchSize = _d === void 0 ? 20 : _d;
    var rest = (0, discord_urls_js_1.createDiscordRest)(token);
    var stopped = false;
    var ticking = false;
    var tickPromise = null;
    var tick = function () { return __awaiter(_this, void 0, void 0, function () {
        var currentTickPromise, runResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (stopped || ticking) {
                        return [2 /*return*/];
                    }
                    ticking = true;
                    currentTickPromise = runTaskRunnerTick({
                        rest: rest,
                        staleRunningMs: staleRunningMs,
                        dueBatchSize: dueBatchSize,
                    }).catch(function (error) {
                        return new Error('Task runner tick failed', { cause: error });
                    });
                    tickPromise = currentTickPromise.then(function () {
                        return;
                    });
                    return [4 /*yield*/, currentTickPromise];
                case 1:
                    runResult = _a.sent();
                    if (runResult instanceof Error) {
                        taskLogger.error("[task-runner] ".concat((0, logger_js_1.formatErrorWithStack)(runResult)));
                        void (0, sentry_js_1.notifyError)(runResult, 'Task runner tick failed');
                    }
                    ticking = false;
                    tickPromise = null;
                    return [2 /*return*/];
            }
        });
    }); };
    var timer = setInterval(function () {
        void tick();
    }, pollIntervalMs);
    void tick();
    taskLogger.log("[task-runner] started (interval=".concat(pollIntervalMs, "ms)"));
    return function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (stopped) {
                        return [2 /*return*/];
                    }
                    stopped = true;
                    clearInterval(timer);
                    if (!tickPromise) return [3 /*break*/, 2];
                    return [4 /*yield*/, tickPromise];
                case 1:
                    _a.sent();
                    tickPromise = null;
                    _a.label = 2;
                case 2:
                    taskLogger.log('[task-runner] stopped');
                    return [2 /*return*/];
            }
        });
    }); };
}
