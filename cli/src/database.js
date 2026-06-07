"use strict";
// SQLite database manager for persistent bot state using Drizzle.
// Stores thread-session mappings, bot tokens, channel directories,
// API keys, and model preferences in <dataDir>/discord-sessions.db.
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.closeDatabase = exports.closeDb = exports.getDb = void 0;
exports.initDatabase = initDatabase;
exports.createScheduledTask = createScheduledTask;
exports.listScheduledTasks = listScheduledTasks;
exports.getScheduledTask = getScheduledTask;
exports.updateScheduledTask = updateScheduledTask;
exports.cancelScheduledTask = cancelScheduledTask;
exports.getDuePlannedScheduledTasks = getDuePlannedScheduledTasks;
exports.claimScheduledTaskRunning = claimScheduledTaskRunning;
exports.recoverStaleRunningScheduledTasks = recoverStaleRunningScheduledTasks;
exports.markScheduledTaskOneShotCompleted = markScheduledTaskOneShotCompleted;
exports.markScheduledTaskCronRescheduled = markScheduledTaskCronRescheduled;
exports.markScheduledTaskFailed = markScheduledTaskFailed;
exports.markScheduledTaskCronRetry = markScheduledTaskCronRetry;
exports.setSessionStartSource = setSessionStartSource;
exports.getSessionStartSourcesBySessionIds = getSessionStartSourcesBySessionIds;
exports.getChannelModel = getChannelModel;
exports.setChannelModel = setChannelModel;
exports.getGlobalModel = getGlobalModel;
exports.setGlobalModel = setGlobalModel;
exports.getSessionModel = getSessionModel;
exports.setSessionModel = setSessionModel;
exports.recordModelUsage = recordModelUsage;
exports.getRecentModels = getRecentModels;
exports.clearSessionModel = clearSessionModel;
exports.getVariantCascade = getVariantCascade;
exports.getChannelAgent = getChannelAgent;
exports.setChannelAgent = setChannelAgent;
exports.getSessionAgent = getSessionAgent;
exports.setSessionAgent = setSessionAgent;
exports.getThreadWorktree = getThreadWorktree;
exports.createPendingWorktree = createPendingWorktree;
exports.setWorktreeReady = setWorktreeReady;
exports.setWorktreeError = setWorktreeError;
exports.deleteThreadWorktree = deleteThreadWorktree;
exports.getChannelVerbosity = getChannelVerbosity;
exports.setChannelVerbosity = setChannelVerbosity;
exports.getChannelMentionMode = getChannelMentionMode;
exports.setChannelMentionMode = setChannelMentionMode;
exports.getChannelWorktreesEnabled = getChannelWorktreesEnabled;
exports.setChannelWorktreesEnabled = setChannelWorktreesEnabled;
exports.getChannelDirectory = getChannelDirectory;
exports.getThreadSession = getThreadSession;
exports.setThreadSession = setThreadSession;
exports.upsertThreadSession = upsertThreadSession;
exports.getThreadSessionSource = getThreadSessionSource;
exports.getThreadIdBySessionId = getThreadIdBySessionId;
exports.getAllThreadSessionIds = getAllThreadSessionIds;
exports.appendSessionEventsSinceLastTimestamp = appendSessionEventsSinceLastTimestamp;
exports.getSessionEventSnapshot = getSessionEventSnapshot;
exports.getPartMessageIds = getPartMessageIds;
exports.setPartMessage = setPartMessage;
exports.setPartMessagesBatch = setPartMessagesBatch;
exports.getBotTokenWithMode = getBotTokenWithMode;
exports.ensureServiceAuthToken = ensureServiceAuthToken;
exports.setBotToken = setBotToken;
exports.setBotMode = setBotMode;
exports.getGeminiApiKey = getGeminiApiKey;
exports.setGeminiApiKey = setGeminiApiKey;
exports.getOpenAIApiKey = getOpenAIApiKey;
exports.setOpenAIApiKey = setOpenAIApiKey;
exports.getTranscriptionApiKey = getTranscriptionApiKey;
exports.setChannelDirectory = setChannelDirectory;
exports.findChannelsByDirectory = findChannelsByDirectory;
exports.getAllTextChannelDirectories = getAllTextChannelDirectories;
exports.getGuildDefaultDirectory = getGuildDefaultDirectory;
exports.setGuildDefaultDirectory = setGuildDefaultDirectory;
exports.deleteGuildDefaultDirectory = deleteGuildDefaultDirectory;
exports.listTrackedTextChannels = listTrackedTextChannels;
exports.deleteChannelDirectoriesByDirectory = deleteChannelDirectoriesByDirectory;
exports.deleteChannelDirectoryById = deleteChannelDirectoryById;
exports.getVoiceChannelDirectory = getVoiceChannelDirectory;
exports.findTextChannelByVoiceChannel = findTextChannelByVoiceChannel;
exports.getForumSyncConfigs = getForumSyncConfigs;
exports.upsertForumSyncConfig = upsertForumSyncConfig;
exports.deleteForumSyncConfig = deleteForumSyncConfig;
exports.deleteStaleForumSyncConfigs = deleteStaleForumSyncConfigs;
exports.createIpcRequest = createIpcRequest;
exports.claimPendingIpcRequests = claimPendingIpcRequests;
exports.completeIpcRequest = completeIpcRequest;
exports.getIpcRequestById = getIpcRequestById;
exports.cancelStaleProcessingRequests = cancelStaleProcessingRequests;
exports.cancelAllPendingIpcRequests = cancelAllPendingIpcRequests;
var node_crypto_1 = require("node:crypto");
var orm = require("drizzle-orm");
var db_js_1 = require("./db.js");
Object.defineProperty(exports, "getDb", { enumerable: true, get: function () { return db_js_1.getDb; } });
Object.defineProperty(exports, "closeDb", { enumerable: true, get: function () { return db_js_1.closeDb; } });
var logger_js_1 = require("./logger.js");
var schema = require("./schema.js");
var store_js_1 = require("./store.js");
var dbLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.DB);
function initDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    dbLogger.log('Database initialized');
                    return [2 /*return*/, db];
            }
        });
    });
}
exports.closeDatabase = db_js_1.closeDb;
function countRows(rows) {
    return rows.length;
}
function createScheduledTask(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, row;
        var scheduleKind = _b.scheduleKind, runAt = _b.runAt, cronExpr = _b.cronExpr, timezone = _b.timezone, nextRunAt = _b.nextRunAt, payloadJson = _b.payloadJson, promptPreview = _b.promptPreview, channelId = _b.channelId, threadId = _b.threadId, sessionId = _b.sessionId, projectDirectory = _b.projectDirectory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.insert(schema.scheduled_tasks).values({
                            status: 'planned',
                            schedule_kind: scheduleKind,
                            run_at: runAt !== null && runAt !== void 0 ? runAt : null,
                            cron_expr: cronExpr !== null && cronExpr !== void 0 ? cronExpr : null,
                            timezone: timezone !== null && timezone !== void 0 ? timezone : null,
                            next_run_at: nextRunAt,
                            payload_json: payloadJson,
                            prompt_preview: promptPreview,
                            channel_id: channelId !== null && channelId !== void 0 ? channelId : null,
                            thread_id: threadId !== null && threadId !== void 0 ? threadId : null,
                            session_id: sessionId !== null && sessionId !== void 0 ? sessionId : null,
                            project_directory: projectDirectory !== null && projectDirectory !== void 0 ? projectDirectory : null,
                        }).returning({ id: schema.scheduled_tasks.id })];
                case 2:
                    row = (_c.sent())[0];
                    if (!row)
                        throw new Error('Failed to create scheduled task');
                    return [2 /*return*/, row.id];
            }
        });
    });
}
function listScheduledTasks() {
    return __awaiter(this, arguments, void 0, function (_a) {
        var db;
        var _b = _a === void 0 ? {} : _a, statuses = _b.statuses;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [2 /*return*/, db.query.scheduled_tasks.findMany({
                            where: statuses && statuses.length > 0 ? { status: { in: statuses } } : undefined,
                            orderBy: { next_run_at: 'asc', id: 'asc' },
                        })];
            }
        });
    });
}
function getScheduledTask(taskId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.scheduled_tasks.findFirst({ where: { id: taskId } })];
                case 2: return [2 /*return*/, (_a = _b.sent()) !== null && _a !== void 0 ? _a : null];
            }
        });
    });
}
function updateScheduledTask(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, data, rows;
        var taskId = _b.taskId, payloadJson = _b.payloadJson, promptPreview = _b.promptPreview, scheduleKind = _b.scheduleKind, runAt = _b.runAt, cronExpr = _b.cronExpr, timezone = _b.timezone, nextRunAt = _b.nextRunAt;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    data = {
                        payload_json: payloadJson,
                        prompt_preview: promptPreview,
                    };
                    if (scheduleKind !== undefined)
                        data.schedule_kind = scheduleKind;
                    if (runAt !== undefined)
                        data.run_at = runAt;
                    if (cronExpr !== undefined)
                        data.cron_expr = cronExpr;
                    if (timezone !== undefined)
                        data.timezone = timezone;
                    if (nextRunAt !== undefined)
                        data.next_run_at = nextRunAt;
                    return [4 /*yield*/, db.update(schema.scheduled_tasks)
                            .set(data)
                            .where(orm.and(orm.eq(schema.scheduled_tasks.id, taskId), orm.eq(schema.scheduled_tasks.status, 'planned')))
                            .returning({ id: schema.scheduled_tasks.id })];
                case 2:
                    rows = _c.sent();
                    return [2 /*return*/, countRows(rows) > 0];
            }
        });
    });
}
function cancelScheduledTask(taskId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.update(schema.scheduled_tasks)
                            .set({ status: 'cancelled', running_started_at: null })
                            .where(orm.and(orm.eq(schema.scheduled_tasks.id, taskId), orm.inArray(schema.scheduled_tasks.status, ['planned', 'running'])))
                            .returning({ id: schema.scheduled_tasks.id })];
                case 2:
                    rows = _a.sent();
                    return [2 /*return*/, countRows(rows) > 0];
            }
        });
    });
}
function getDuePlannedScheduledTasks(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var now = _b.now, limit = _b.limit;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [2 /*return*/, db.query.scheduled_tasks.findMany({
                            where: { status: 'planned', next_run_at: { lte: now } },
                            orderBy: { next_run_at: 'asc', id: 'asc' },
                            limit: limit,
                        })];
            }
        });
    });
}
function claimScheduledTaskRunning(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, rows;
        var taskId = _b.taskId, startedAt = _b.startedAt;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.update(schema.scheduled_tasks)
                            .set({ status: 'running', running_started_at: startedAt })
                            .where(orm.and(orm.eq(schema.scheduled_tasks.id, taskId), orm.eq(schema.scheduled_tasks.status, 'planned')))
                            .returning({ id: schema.scheduled_tasks.id })];
                case 2:
                    rows = _c.sent();
                    return [2 /*return*/, countRows(rows) > 0];
            }
        });
    });
}
function recoverStaleRunningScheduledTasks(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, rows;
        var staleBefore = _b.staleBefore;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.update(schema.scheduled_tasks)
                            .set({ status: 'planned', running_started_at: null })
                            .where(orm.and(orm.eq(schema.scheduled_tasks.status, 'running'), orm.lte(schema.scheduled_tasks.running_started_at, staleBefore)))
                            .returning({ id: schema.scheduled_tasks.id })];
                case 2:
                    rows = _c.sent();
                    return [2 /*return*/, countRows(rows)];
            }
        });
    });
}
function markScheduledTaskOneShotCompleted(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var taskId = _b.taskId, completedAt = _b.completedAt;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.update(schema.scheduled_tasks)
                            .set({ status: 'completed', last_run_at: completedAt, running_started_at: null, last_error: null })
                            .where(orm.eq(schema.scheduled_tasks.id, taskId))];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function markScheduledTaskCronRescheduled(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var taskId = _b.taskId, completedAt = _b.completedAt, nextRunAt = _b.nextRunAt;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.update(schema.scheduled_tasks)
                            .set({ status: 'planned', last_run_at: completedAt, running_started_at: null, last_error: null, next_run_at: nextRunAt })
                            .where(orm.eq(schema.scheduled_tasks.id, taskId))];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function markScheduledTaskFailed(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var taskId = _b.taskId, failedAt = _b.failedAt, errorMessage = _b.errorMessage;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.update(schema.scheduled_tasks)
                            .set({
                            status: 'failed',
                            last_run_at: failedAt,
                            running_started_at: null,
                            last_error: errorMessage,
                            attempts: orm.sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), schema.scheduled_tasks.attempts),
                        })
                            .where(orm.eq(schema.scheduled_tasks.id, taskId))];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function markScheduledTaskCronRetry(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var taskId = _b.taskId, failedAt = _b.failedAt, errorMessage = _b.errorMessage, nextRunAt = _b.nextRunAt;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.update(schema.scheduled_tasks)
                            .set({
                            status: 'planned',
                            next_run_at: nextRunAt,
                            last_run_at: failedAt,
                            running_started_at: null,
                            last_error: errorMessage,
                            attempts: orm.sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["", " + 1"], ["", " + 1"])), schema.scheduled_tasks.attempts),
                        })
                            .where(orm.eq(schema.scheduled_tasks.id, taskId))];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setSessionStartSource(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var sessionId = _b.sessionId, scheduleKind = _b.scheduleKind, scheduledTaskId = _b.scheduledTaskId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.insert(schema.session_start_sources)
                            .values({ session_id: sessionId, schedule_kind: scheduleKind, scheduled_task_id: scheduledTaskId !== null && scheduledTaskId !== void 0 ? scheduledTaskId : null })
                            .onConflictDoUpdate({
                            target: schema.session_start_sources.session_id,
                            set: { schedule_kind: scheduleKind, scheduled_task_id: scheduledTaskId !== null && scheduledTaskId !== void 0 ? scheduledTaskId : null, updated_at: new Date() },
                        })];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getSessionStartSourcesBySessionIds(sessionIds) {
    return __awaiter(this, void 0, void 0, function () {
        var db, chunkSize, rows, index, _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (sessionIds.length === 0)
                        return [2 /*return*/, new Map()];
                    return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _d.sent();
                    chunkSize = 500;
                    rows = [];
                    index = 0;
                    _d.label = 2;
                case 2:
                    if (!(index < sessionIds.length)) return [3 /*break*/, 5];
                    _b = (_a = rows.push).apply;
                    _c = [rows];
                    return [4 /*yield*/, db.query.session_start_sources.findMany({
                            where: { session_id: { in: sessionIds.slice(index, index + chunkSize) } },
                        })];
                case 3:
                    _b.apply(_a, _c.concat([_d.sent()]));
                    _d.label = 4;
                case 4:
                    index += chunkSize;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, new Map(rows.map(function (row) { return [row.session_id, row]; }))];
            }
        });
    });
}
function getChannelModel(channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.channel_models.findFirst({ where: { channel_id: channelId } })];
                case 2:
                    row = _a.sent();
                    return [2 /*return*/, row ? { modelId: row.model_id, variant: row.variant } : undefined];
            }
        });
    });
}
function setChannelModel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var channelId = _b.channelId, modelId = _b.modelId, variant = _b.variant;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.insert(schema.channel_models)
                            .values({ channel_id: channelId, model_id: modelId, variant: variant !== null && variant !== void 0 ? variant : null })
                            .onConflictDoUpdate({
                            target: schema.channel_models.channel_id,
                            set: { model_id: modelId, variant: variant !== null && variant !== void 0 ? variant : null, updated_at: new Date() },
                        })
                        // Try to record usage if we can resolve appId.
                        // Actually, recordModelUsage will be called from the slash command handlers where appId is available.
                    ];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getGlobalModel(appId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.global_models.findFirst({ where: { app_id: appId } })];
                case 2:
                    row = _a.sent();
                    return [2 /*return*/, row ? { modelId: row.model_id, variant: row.variant } : undefined];
            }
        });
    });
}
function setGlobalModel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var appId = _b.appId, modelId = _b.modelId, variant = _b.variant;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.insert(schema.global_models)
                            .values({ app_id: appId, model_id: modelId, variant: variant !== null && variant !== void 0 ? variant : null })
                            .onConflictDoUpdate({
                            target: schema.global_models.app_id,
                            set: { model_id: modelId, variant: variant !== null && variant !== void 0 ? variant : null, updated_at: new Date() },
                        })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, recordModelUsage({ appId: appId, modelId: modelId, variant: variant !== null && variant !== void 0 ? variant : null })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getSessionModel(sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.session_models.findFirst({ where: { session_id: sessionId } })];
                case 2:
                    row = _a.sent();
                    return [2 /*return*/, row ? { modelId: row.model_id, variant: row.variant } : undefined];
            }
        });
    });
}
function setSessionModel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var sessionId = _b.sessionId, modelId = _b.modelId, variant = _b.variant;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.insert(schema.session_models)
                            .values({ session_id: sessionId, model_id: modelId, variant: variant !== null && variant !== void 0 ? variant : null })
                            .onConflictDoUpdate({
                            target: schema.session_models.session_id,
                            set: { model_id: modelId, variant: variant !== null && variant !== void 0 ? variant : null },
                        })
                        // For session model, we don't necessarily have the appId easily here,
                        // but we can look up the bot token (most recently used).
                        // Actually, handleModelSelectMenu has appId, so it might be better to call recordModelUsage there.
                        // But setGlobalModel also calls it.
                    ];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function recordModelUsage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, staleRows;
        var appId = _b.appId, modelId = _b.modelId, variant = _b.variant;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.insert(schema.recent_models)
                            .values({ app_id: appId, model_id: modelId, variant: variant, last_used_at: new Date() })
                            .onConflictDoUpdate({
                            target: [schema.recent_models.app_id, schema.recent_models.model_id, schema.recent_models.variant],
                            set: { last_used_at: new Date() },
                        })
                        // Keep only last 10 models per app
                        // SQLite requires LIMIT when using OFFSET, so use a large limit
                    ];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, db.query.recent_models.findMany({
                            where: { app_id: appId },
                            orderBy: { last_used_at: 'desc' },
                            limit: 1000000,
                            offset: 10,
                            columns: { id: true },
                        })];
                case 3:
                    staleRows = _c.sent();
                    if (!(staleRows.length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, db.delete(schema.recent_models)
                            .where(orm.inArray(schema.recent_models.id, staleRows.map(function (r) { return r.id; })))];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getRecentModels(appId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [2 /*return*/, db.query.recent_models.findMany({
                            where: { app_id: appId },
                            orderBy: { last_used_at: 'desc' },
                            limit: 5,
                        })];
            }
        });
    });
}
function clearSessionModel(sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.delete(schema.session_models).where(orm.eq(schema.session_models.session_id, sessionId))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getVariantCascade(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var session, channel, global_1;
        var sessionId = _b.sessionId, channelId = _b.channelId, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!sessionId) return [3 /*break*/, 2];
                    return [4 /*yield*/, getSessionModel(sessionId)];
                case 1:
                    session = _c.sent();
                    if (session === null || session === void 0 ? void 0 : session.variant)
                        return [2 /*return*/, session.variant];
                    _c.label = 2;
                case 2:
                    if (!channelId) return [3 /*break*/, 4];
                    return [4 /*yield*/, getChannelModel(channelId)];
                case 3:
                    channel = _c.sent();
                    if (channel === null || channel === void 0 ? void 0 : channel.variant)
                        return [2 /*return*/, channel.variant];
                    _c.label = 4;
                case 4:
                    if (!appId) return [3 /*break*/, 6];
                    return [4 /*yield*/, getGlobalModel(appId)];
                case 5:
                    global_1 = _c.sent();
                    if (global_1 === null || global_1 === void 0 ? void 0 : global_1.variant)
                        return [2 /*return*/, global_1.variant];
                    _c.label = 6;
                case 6: return [2 /*return*/, undefined];
            }
        });
    });
}
function getChannelAgent(channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.channel_agents.findFirst({ where: { channel_id: channelId } })];
                case 2: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.agent_name];
            }
        });
    });
}
function setChannelAgent(channelId, agentName) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.insert(schema.channel_agents)
                            .values({ channel_id: channelId, agent_name: agentName })
                            .onConflictDoUpdate({ target: schema.channel_agents.channel_id, set: { agent_name: agentName, updated_at: new Date() } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getSessionAgent(sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.session_agents.findFirst({ where: { session_id: sessionId } })];
                case 2: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.agent_name];
            }
        });
    });
}
function setSessionAgent(sessionId, agentName) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.insert(schema.session_agents)
                            .values({ session_id: sessionId, agent_name: agentName })
                            .onConflictDoUpdate({ target: schema.session_agents.session_id, set: { agent_name: agentName } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getThreadWorktree(threadId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.thread_worktrees.findFirst({ where: { thread_id: threadId } })];
                case 2: return [2 /*return*/, (_a = _b.sent()) !== null && _a !== void 0 ? _a : undefined];
            }
        });
    });
}
function createPendingWorktree(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var threadId = _b.threadId, worktreeName = _b.worktreeName, projectDirectory = _b.projectDirectory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.batch([
                            db.insert(schema.thread_sessions)
                                .values({ thread_id: threadId, session_id: '' })
                                .onConflictDoNothing({ target: schema.thread_sessions.thread_id }),
                            db.insert(schema.thread_worktrees)
                                .values({ thread_id: threadId, worktree_name: worktreeName, project_directory: projectDirectory, status: 'pending' })
                                .onConflictDoUpdate({
                                target: schema.thread_worktrees.thread_id,
                                set: { worktree_name: worktreeName, project_directory: projectDirectory, status: 'pending', worktree_directory: null, error_message: null },
                            }),
                        ])];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setWorktreeReady(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var threadId = _b.threadId, worktreeDirectory = _b.worktreeDirectory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.update(schema.thread_worktrees).set({ worktree_directory: worktreeDirectory, status: 'ready' }).where(orm.eq(schema.thread_worktrees.thread_id, threadId))];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setWorktreeError(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var threadId = _b.threadId, errorMessage = _b.errorMessage;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.update(schema.thread_worktrees).set({ status: 'error', error_message: errorMessage }).where(orm.eq(schema.thread_worktrees.thread_id, threadId))];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function deleteThreadWorktree(threadId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.delete(schema.thread_worktrees).where(orm.eq(schema.thread_worktrees.thread_id, threadId))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getChannelVerbosity(channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, row;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.channel_verbosity.findFirst({ where: { channel_id: channelId } })];
                case 2:
                    row = _b.sent();
                    return [2 /*return*/, (_a = row === null || row === void 0 ? void 0 : row.verbosity) !== null && _a !== void 0 ? _a : store_js_1.store.getState().defaultVerbosity];
            }
        });
    });
}
function setChannelVerbosity(channelId, verbosity) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.insert(schema.channel_verbosity)
                            .values({ channel_id: channelId, verbosity: verbosity })
                            .onConflictDoUpdate({ target: schema.channel_verbosity.channel_id, set: { verbosity: verbosity, updated_at: new Date() } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getChannelMentionMode(channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.channel_mention_mode.findFirst({ where: { channel_id: channelId } })];
                case 2:
                    row = _a.sent();
                    return [2 /*return*/, row ? row.enabled === 1 : store_js_1.store.getState().defaultMentionMode];
            }
        });
    });
}
function setChannelMentionMode(channelId, enabled) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.insert(schema.channel_mention_mode)
                            .values({ channel_id: channelId, enabled: enabled ? 1 : 0 })
                            .onConflictDoUpdate({ target: schema.channel_mention_mode.channel_id, set: { enabled: enabled ? 1 : 0, updated_at: new Date() } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getChannelWorktreesEnabled(channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.channel_worktrees.findFirst({ where: { channel_id: channelId } })];
                case 2: return [2 /*return*/, ((_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.enabled) === 1];
            }
        });
    });
}
function setChannelWorktreesEnabled(channelId, enabled) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.insert(schema.channel_worktrees)
                            .values({ channel_id: channelId, enabled: enabled ? 1 : 0 })
                            .onConflictDoUpdate({ target: schema.channel_worktrees.channel_id, set: { enabled: enabled ? 1 : 0, updated_at: new Date() } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getChannelDirectory(channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.channel_directories.findFirst({ where: { channel_id: channelId } })];
                case 2:
                    row = _a.sent();
                    return [2 /*return*/, row ? { directory: row.directory } : undefined];
            }
        });
    });
}
function getThreadSession(threadId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.thread_sessions.findFirst({ where: { thread_id: threadId } })];
                case 2: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.session_id];
            }
        });
    });
}
function setThreadSession(threadId, sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, upsertThreadSession({ threadId: threadId, sessionId: sessionId, source: 'kimaki' })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function upsertThreadSession(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var threadId = _b.threadId, sessionId = _b.sessionId, source = _b.source;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.insert(schema.thread_sessions)
                            .values({ thread_id: threadId, session_id: sessionId, source: source })
                            .onConflictDoUpdate({ target: schema.thread_sessions.thread_id, set: { session_id: sessionId, source: source } })];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getThreadSessionSource(threadId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.thread_sessions.findFirst({ where: { thread_id: threadId }, columns: { source: true } })];
                case 2: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.source];
            }
        });
    });
}
function getThreadIdBySessionId(sessionId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.thread_sessions.findFirst({ where: { session_id: sessionId } })];
                case 2: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.thread_id];
            }
        });
    });
}
function getAllThreadSessionIds() {
    return __awaiter(this, void 0, void 0, function () {
        var db, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.thread_sessions.findMany({ columns: { session_id: true } })];
                case 2:
                    rows = _a.sent();
                    return [2 /*return*/, rows.map(function (row) { return row.session_id; }).filter(function (id) { return id !== ''; })];
            }
        });
    });
}
function appendSessionEventsSinceLastTimestamp(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, sortedEvents, latestPersisted, eventsToInsert, staleRows;
        var sessionId = _b.sessionId, events = _b.events;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (events.length === 0)
                        return [2 /*return*/, 0];
                    return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    sortedEvents = __spreadArray([], events, true).sort(function (a, b) {
                        if (a.timestamp !== b.timestamp)
                            return a.timestamp - b.timestamp;
                        return a.event_index - b.event_index;
                    });
                    return [4 /*yield*/, db.query.session_events.findFirst({
                            where: { session_id: sessionId },
                            orderBy: { timestamp: 'desc', event_index: 'desc', id: 'desc' },
                            columns: { timestamp: true, event_index: true },
                        })];
                case 2:
                    latestPersisted = _c.sent();
                    eventsToInsert = sortedEvents.filter(function (event) {
                        if (!latestPersisted)
                            return true;
                        if (event.timestamp > latestPersisted.timestamp)
                            return true;
                        if (event.timestamp < latestPersisted.timestamp)
                            return false;
                        return event.event_index > latestPersisted.event_index;
                    });
                    if (eventsToInsert.length === 0)
                        return [2 /*return*/, 0];
                    return [4 /*yield*/, db.insert(schema.session_events).values(eventsToInsert)];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, db.query.session_events.findMany({
                            where: { session_id: sessionId },
                            orderBy: { timestamp: 'desc', event_index: 'desc', id: 'desc' },
                            limit: 1000000,
                            offset: 1000,
                            columns: { id: true },
                        })];
                case 4:
                    staleRows = _c.sent();
                    if (!(staleRows.length > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, db.delete(schema.session_events).where(orm.inArray(schema.session_events.id, staleRows.map(function (row) { return row.id; })))];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6: return [2 /*return*/, eventsToInsert.length];
            }
        });
    });
}
function getSessionEventSnapshot(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var sessionId = _b.sessionId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [2 /*return*/, db.query.session_events.findMany({
                            where: { session_id: sessionId },
                            orderBy: { timestamp: 'asc', event_index: 'asc', id: 'asc' },
                            limit: 1000,
                        })];
            }
        });
    });
}
function getPartMessageIds(threadId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.part_messages.findMany({ where: { thread_id: threadId }, columns: { part_id: true } })];
                case 2:
                    rows = _a.sent();
                    return [2 /*return*/, rows.map(function (row) { return row.part_id; })];
            }
        });
    });
}
function setPartMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var partId = _b.partId, messageId = _b.messageId, threadId = _b.threadId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.insert(schema.part_messages)
                            .values({ part_id: partId, message_id: messageId, thread_id: threadId })
                            .onConflictDoUpdate({ target: schema.part_messages.part_id, set: { message_id: messageId, thread_id: threadId } })];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setPartMessagesBatch(partMappings) {
    return __awaiter(this, void 0, void 0, function () {
        var db, _i, partMappings_1, _a, partId, messageId, threadId;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (partMappings.length === 0)
                        return [2 /*return*/];
                    return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    _i = 0, partMappings_1 = partMappings;
                    _b.label = 2;
                case 2:
                    if (!(_i < partMappings_1.length)) return [3 /*break*/, 5];
                    _a = partMappings_1[_i], partId = _a.partId, messageId = _a.messageId, threadId = _a.threadId;
                    return [4 /*yield*/, db.insert(schema.part_messages)
                            .values({ part_id: partId, message_id: messageId, thread_id: threadId })
                            .onConflictDoUpdate({ target: schema.part_messages.part_id, set: { message_id: messageId, thread_id: threadId } })];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function splitServiceAuthToken(_a) {
    var token = _a.token;
    var separatorIndex = token.indexOf(':');
    if (separatorIndex <= 0 || separatorIndex >= token.length - 1)
        return null;
    return { clientId: token.slice(0, separatorIndex), clientSecret: token.slice(separatorIndex + 1) };
}
function createServiceCredentials() {
    return { clientId: node_crypto_1.default.randomUUID(), clientSecret: node_crypto_1.default.randomBytes(32).toString('hex') };
}
function getBotTokenWithMode() {
    return __awaiter(this, void 0, void 0, function () {
        var db, row, gatewayToken, serviceParts, mode, token, discordBaseUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.bot_tokens.findMany({ orderBy: { last_used_at: 'desc', created_at: 'desc' }, limit: 1 })];
                case 2:
                    row = (_a.sent())[0];
                    if (!row)
                        return [2 /*return*/, undefined];
                    return [4 /*yield*/, ensureServiceAuthToken({ appId: row.app_id })];
                case 3:
                    gatewayToken = _a.sent();
                    serviceParts = splitServiceAuthToken({ token: gatewayToken });
                    mode = row.bot_mode === 'gateway' ? 'gateway' : 'self_hosted';
                    token = mode === 'gateway' && serviceParts ? gatewayToken : row.token;
                    discordBaseUrl = mode === 'gateway' && row.proxy_url ? row.proxy_url : 'https://discord.com';
                    store_js_1.store.setState({ discordBaseUrl: discordBaseUrl, gatewayToken: gatewayToken });
                    return [2 /*return*/, {
                            appId: row.app_id,
                            token: token,
                            gatewayToken: gatewayToken,
                            mode: mode,
                            clientId: (serviceParts === null || serviceParts === void 0 ? void 0 : serviceParts.clientId) || row.client_id,
                            clientSecret: (serviceParts === null || serviceParts === void 0 ? void 0 : serviceParts.clientSecret) || row.client_secret,
                            proxyUrl: row.proxy_url,
                        }];
            }
        });
    });
}
function ensureServiceAuthToken(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, row, preferred, existing, fromStoredToken, resolved;
        var appId = _b.appId, preferredGatewayToken = _b.preferredGatewayToken;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.query.bot_tokens.findFirst({ where: { app_id: appId } })];
                case 2:
                    row = _c.sent();
                    if (!row)
                        throw new Error("Bot token row not found for app_id ".concat(appId));
                    preferred = preferredGatewayToken ? splitServiceAuthToken({ token: preferredGatewayToken }) : null;
                    existing = row.client_id && row.client_secret ? { clientId: row.client_id, clientSecret: row.client_secret } : null;
                    fromStoredToken = splitServiceAuthToken({ token: row.token });
                    resolved = preferred || existing || fromStoredToken || createServiceCredentials();
                    if (!(row.client_id !== resolved.clientId || row.client_secret !== resolved.clientSecret)) return [3 /*break*/, 4];
                    return [4 /*yield*/, db.update(schema.bot_tokens)
                            .set({ client_id: resolved.clientId, client_secret: resolved.clientSecret })
                            .where(orm.eq(schema.bot_tokens.app_id, appId))];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4: return [2 /*return*/, "".concat(resolved.clientId, ":").concat(resolved.clientSecret)];
            }
        });
    });
}
function setBotToken(appId, token) {
    return __awaiter(this, void 0, void 0, function () {
        var db, generated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    generated = createServiceCredentials();
                    return [4 /*yield*/, db.insert(schema.bot_tokens)
                            .values({ app_id: appId, token: token, client_id: generated.clientId, client_secret: generated.clientSecret })
                            .onConflictDoUpdate({ target: schema.bot_tokens.app_id, set: { token: token } })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ensureServiceAuthToken({ appId: appId })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setBotMode(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, token, data;
        var appId = _b.appId, mode = _b.mode, clientId = _b.clientId, clientSecret = _b.clientSecret, proxyUrl = _b.proxyUrl;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    token = clientId && clientSecret ? "".concat(clientId, ":").concat(clientSecret) : '';
                    data = { bot_mode: mode, client_id: clientId !== null && clientId !== void 0 ? clientId : null, client_secret: clientSecret !== null && clientSecret !== void 0 ? clientSecret : null, proxy_url: proxyUrl !== null && proxyUrl !== void 0 ? proxyUrl : null };
                    return [4 /*yield*/, db.insert(schema.bot_tokens)
                            .values(__assign({ app_id: appId, token: token }, data))
                            .onConflictDoUpdate({ target: schema.bot_tokens.app_id, set: data })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, ensureServiceAuthToken({ appId: appId, preferredGatewayToken: token || undefined })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getGeminiApiKey(appId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.query.bot_api_keys.findFirst({ where: { app_id: appId } })];
                case 2: return [2 /*return*/, (_b = (_a = (_c.sent())) === null || _a === void 0 ? void 0 : _a.gemini_api_key) !== null && _b !== void 0 ? _b : null];
            }
        });
    });
}
function setGeminiApiKey(appId, apiKey) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.insert(schema.bot_api_keys)
                            .values({ app_id: appId, gemini_api_key: apiKey })
                            .onConflictDoUpdate({ target: schema.bot_api_keys.app_id, set: { gemini_api_key: apiKey } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getOpenAIApiKey(appId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.query.bot_api_keys.findFirst({ where: { app_id: appId } })];
                case 2: return [2 /*return*/, (_b = (_a = (_c.sent())) === null || _a === void 0 ? void 0 : _a.openai_api_key) !== null && _b !== void 0 ? _b : null];
            }
        });
    });
}
function setOpenAIApiKey(appId, apiKey) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.insert(schema.bot_api_keys)
                            .values({ app_id: appId, openai_api_key: apiKey })
                            .onConflictDoUpdate({ target: schema.bot_api_keys.app_id, set: { openai_api_key: apiKey } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getTranscriptionApiKey(appId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.bot_api_keys.findFirst({ where: { app_id: appId } })];
                case 2:
                    row = _a.sent();
                    if (!row)
                        return [2 /*return*/, null];
                    if (row.openai_api_key)
                        return [2 /*return*/, { provider: 'openai', apiKey: row.openai_api_key }];
                    if (row.gemini_api_key)
                        return [2 /*return*/, { provider: 'gemini', apiKey: row.gemini_api_key }];
                    return [2 /*return*/, null];
            }
        });
    });
}
function setChannelDirectory(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var channelId = _b.channelId, directory = _b.directory, channelType = _b.channelType, _c = _b.skipIfExists, skipIfExists = _c === void 0 ? false : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _d.sent();
                    if (!skipIfExists) return [3 /*break*/, 3];
                    return [4 /*yield*/, db.insert(schema.channel_directories)
                            .values({ channel_id: channelId, directory: directory, channel_type: channelType })
                            .onConflictDoNothing({ target: schema.channel_directories.channel_id })];
                case 2:
                    _d.sent();
                    return [2 /*return*/];
                case 3: return [4 /*yield*/, db.insert(schema.channel_directories)
                        .values({ channel_id: channelId, directory: directory, channel_type: channelType })
                        .onConflictDoUpdate({ target: schema.channel_directories.channel_id, set: { directory: directory, channel_type: channelType } })];
                case 4:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function findChannelsByDirectory(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, where;
        var directory = _b.directory, channelType = _b.channelType;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    where = directory && channelType
                        ? { directory: directory, channel_type: channelType }
                        : directory
                            ? { directory: directory }
                            : channelType
                                ? { channel_type: channelType }
                                : undefined;
                    return [2 /*return*/, db.query.channel_directories.findMany({ where: where, columns: { channel_id: true, directory: true, channel_type: true } })];
            }
        });
    });
}
function getAllTextChannelDirectories() {
    return __awaiter(this, void 0, void 0, function () {
        var db, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.channel_directories.findMany({ where: { channel_type: 'text' }, columns: { directory: true } })];
                case 2:
                    rows = _a.sent();
                    return [2 /*return*/, __spreadArray([], new Set(rows.map(function (row) { return row.directory; })), true)];
            }
        });
    });
}
function getGuildDefaultDirectory(guildId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.guild_default_directories.findFirst({ where: { guild_id: guildId } })];
                case 2:
                    row = _a.sent();
                    return [2 /*return*/, row ? { parent_directory: row.parent_directory } : undefined];
            }
        });
    });
}
function setGuildDefaultDirectory(guildId, parentDirectory) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.insert(schema.guild_default_directories)
                            .values({ guild_id: guildId, parent_directory: parentDirectory })
                            .onConflictDoUpdate({ target: schema.guild_default_directories.guild_id, set: { parent_directory: parentDirectory } })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function deleteGuildDefaultDirectory(guildId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.delete(schema.guild_default_directories).where(orm.eq(schema.guild_default_directories.guild_id, guildId))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function listTrackedTextChannels() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [2 /*return*/, db.query.channel_directories.findMany({
                            where: { channel_type: 'text' },
                            orderBy: { created_at: 'asc', channel_id: 'asc' },
                            columns: { channel_id: true, directory: true, created_at: true },
                        })];
            }
        });
    });
}
function deleteChannelDirectoriesByDirectory(directory) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.delete(schema.channel_directories).where(orm.eq(schema.channel_directories.directory, directory))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function deleteChannelDirectoryById(channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.batch([
                            db.delete(schema.channel_models).where(orm.eq(schema.channel_models.channel_id, channelId)),
                            db.delete(schema.channel_agents).where(orm.eq(schema.channel_agents.channel_id, channelId)),
                            db.delete(schema.channel_worktrees).where(orm.eq(schema.channel_worktrees.channel_id, channelId)),
                            db.delete(schema.channel_verbosity).where(orm.eq(schema.channel_verbosity.channel_id, channelId)),
                            db.delete(schema.channel_mention_mode).where(orm.eq(schema.channel_mention_mode.channel_id, channelId)),
                        ])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, db.delete(schema.channel_directories)
                            .where(orm.eq(schema.channel_directories.channel_id, channelId))
                            .returning({ channel_id: schema.channel_directories.channel_id })];
                case 3:
                    rows = _a.sent();
                    return [2 /*return*/, rows.length > 0];
            }
        });
    });
}
function getVoiceChannelDirectory(channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.channel_directories.findFirst({ where: { channel_id: channelId, channel_type: 'voice' } })];
                case 2: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.directory];
            }
        });
    });
}
function findTextChannelByVoiceChannel(voiceChannelId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, voiceChannel;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.query.channel_directories.findFirst({ where: { channel_id: voiceChannelId, channel_type: 'voice' } })];
                case 2:
                    voiceChannel = _b.sent();
                    if (!voiceChannel)
                        return [2 /*return*/, undefined];
                    return [4 /*yield*/, db.query.channel_directories.findFirst({ where: { directory: voiceChannel.directory, channel_type: 'text' } })];
                case 3: return [2 /*return*/, (_a = (_b.sent())) === null || _a === void 0 ? void 0 : _a.channel_id];
            }
        });
    });
}
function getForumSyncConfigs(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, rows;
        var appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.query.forum_sync_configs.findMany({ where: { app_id: appId } })];
                case 2:
                    rows = _c.sent();
                    return [2 /*return*/, rows.map(function (row) { return ({ appId: row.app_id, forumChannelId: row.forum_channel_id, outputDir: row.output_dir, direction: row.direction }); })];
            }
        });
    });
}
function upsertForumSyncConfig(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var appId = _b.appId, forumChannelId = _b.forumChannelId, outputDir = _b.outputDir, _c = _b.direction, direction = _c === void 0 ? 'bidirectional' : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _d.sent();
                    return [4 /*yield*/, db.insert(schema.forum_sync_configs)
                            .values({ app_id: appId, forum_channel_id: forumChannelId, output_dir: outputDir, direction: direction })
                            .onConflictDoUpdate({ target: [schema.forum_sync_configs.app_id, schema.forum_sync_configs.forum_channel_id], set: { output_dir: outputDir, direction: direction, updated_at: new Date() } })];
                case 2:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function deleteForumSyncConfig(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var appId = _b.appId, forumChannelId = _b.forumChannelId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.delete(schema.forum_sync_configs).where(orm.and(orm.eq(schema.forum_sync_configs.app_id, appId), orm.eq(schema.forum_sync_configs.forum_channel_id, forumChannelId)))];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function deleteStaleForumSyncConfigs(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var appId = _b.appId, forumChannelId = _b.forumChannelId, outputDir = _b.outputDir;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.delete(schema.forum_sync_configs).where(orm.and(orm.eq(schema.forum_sync_configs.app_id, appId), orm.eq(schema.forum_sync_configs.output_dir, outputDir), orm.ne(schema.forum_sync_configs.forum_channel_id, forumChannelId)))];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function createIpcRequest(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, row;
        var type = _b.type, sessionId = _b.sessionId, threadId = _b.threadId, payload = _b.payload;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.insert(schema.ipc_requests).values({ type: type, session_id: sessionId, thread_id: threadId, payload: payload }).returning()];
                case 2:
                    row = (_c.sent())[0];
                    if (!row)
                        throw new Error('Failed to create IPC request');
                    return [2 /*return*/, row];
            }
        });
    });
}
function claimPendingIpcRequests() {
    return __awaiter(this, void 0, void 0, function () {
        var db, pending, claimed, _i, pending_1, req, rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.ipc_requests.findMany({ where: { status: 'pending' }, orderBy: { created_at: 'asc' } })];
                case 2:
                    pending = _a.sent();
                    claimed = [];
                    _i = 0, pending_1 = pending;
                    _a.label = 3;
                case 3:
                    if (!(_i < pending_1.length)) return [3 /*break*/, 6];
                    req = pending_1[_i];
                    return [4 /*yield*/, db.update(schema.ipc_requests)
                            .set({ status: 'processing' })
                            .where(orm.and(orm.eq(schema.ipc_requests.id, req.id), orm.eq(schema.ipc_requests.status, 'pending')))
                            .returning()];
                case 4:
                    rows = _a.sent();
                    if (rows.length > 0)
                        claimed.push(req);
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/, claimed];
            }
        });
    });
}
function completeIpcRequest(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, row;
        var id = _b.id, response = _b.response;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    return [4 /*yield*/, db.update(schema.ipc_requests)
                            .set({ response: response, status: 'completed' })
                            .where(orm.eq(schema.ipc_requests.id, id))
                            .returning()];
                case 2:
                    row = (_c.sent())[0];
                    return [2 /*return*/, row];
            }
        });
    });
}
function getIpcRequestById(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db;
        var _c;
        var id = _b.id;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _d.sent();
                    return [4 /*yield*/, db.query.ipc_requests.findFirst({ where: { id: id } })];
                case 2: return [2 /*return*/, (_c = _d.sent()) !== null && _c !== void 0 ? _c : null];
            }
        });
    });
}
function cancelStaleProcessingRequests(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var db, cutoff, rows;
        var ttlMs = _b.ttlMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _c.sent();
                    cutoff = new Date(Date.now() - ttlMs);
                    return [4 /*yield*/, db.update(schema.ipc_requests)
                            .set({ status: 'cancelled', response: JSON.stringify({ error: 'Request timed out' }) })
                            .where(orm.and(orm.eq(schema.ipc_requests.status, 'processing'), orm.lt(schema.ipc_requests.updated_at, cutoff)))
                            .returning({ id: schema.ipc_requests.id })];
                case 2:
                    rows = _c.sent();
                    return [2 /*return*/, { count: rows.length }];
            }
        });
    });
}
function cancelAllPendingIpcRequests() {
    return __awaiter(this, void 0, void 0, function () {
        var db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.update(schema.ipc_requests)
                            .set({ status: 'cancelled', response: JSON.stringify({ error: 'Bot shutting down' }) })
                            .where(orm.inArray(schema.ipc_requests.status, ['pending', 'processing']))];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
var templateObject_1, templateObject_2;
