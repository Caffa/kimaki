"use strict";
// Runtime state management, file watchers, and Discord event listeners.
// Manages the lifecycle of forum sync: initial sync, live Discord event handling,
// file system watcher for bidirectional sync, and debounced sync scheduling.
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
exports.stopConfiguredForumSync = stopConfiguredForumSync;
exports.startConfiguredForumSync = startConfiguredForumSync;
var node_fs_1 = require("node:fs");
var watcher_1 = require("@parcel/watcher");
var discord_js_1 = require("discord.js");
var logger_js_1 = require("../logger.js");
var config_js_1 = require("./config.js");
var discord_operations_js_1 = require("./discord-operations.js");
var sync_to_files_js_1 = require("./sync-to-files.js");
var sync_to_discord_js_1 = require("./sync-to-discord.js");
var types_js_1 = require("./types.js");
var forumLogger = (0, logger_js_1.createLogger)('FORUM');
// ═══════════════════════════════════════════════════════════════════════════
// MODULE STATE
// ═══════════════════════════════════════════════════════════════════════════
var forumStateById = new Map();
var watcherUnsubscribeByForumId = new Map();
var discordListenersRegistered = false;
// ═══════════════════════════════════════════════════════════════════════════
// RUNTIME STATE
// ═══════════════════════════════════════════════════════════════════════════
function buildRuntimeState(_a) {
    var forumChannelId = _a.forumChannelId, outputDir = _a.outputDir, direction = _a.direction;
    return {
        forumChannelId: forumChannelId,
        outputDir: outputDir,
        direction: direction,
        dirtyThreadIds: new Set(),
        ignoredPaths: new Map(),
        queuedFileEvents: new Map(),
        discordDebounceTimer: null,
        fileDebounceTimer: null,
    };
}
// ═══════════════════════════════════════════════════════════════════════════
// FILE WATCHER EVENT HANDLING
// ═══════════════════════════════════════════════════════════════════════════
function runQueuedFileEvents(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var queuedEntries, changedFilePaths, deletedFilePaths, fileSyncResult, discordSyncResult;
        var runtimeState = _b.runtimeState, discordClient = _b.discordClient;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    queuedEntries = Array.from(runtimeState.queuedFileEvents.entries());
                    runtimeState.queuedFileEvents.clear();
                    if (queuedEntries.length === 0)
                        return [2 /*return*/];
                    changedFilePaths = queuedEntries
                        .filter(function (_a) {
                        var eventType = _a[1];
                        return eventType === 'create' || eventType === 'update';
                    })
                        .map(function (_a) {
                        var filePath = _a[0];
                        return filePath;
                    });
                    deletedFilePaths = queuedEntries
                        .filter(function (_a) {
                        var eventType = _a[1];
                        return eventType === 'delete';
                    })
                        .map(function (_a) {
                        var filePath = _a[0];
                        return filePath;
                    });
                    return [4 /*yield*/, (0, sync_to_discord_js_1.syncFilesToForum)({
                            discordClient: discordClient,
                            forumChannelId: runtimeState.forumChannelId,
                            outputDir: runtimeState.outputDir,
                            runtimeState: runtimeState,
                            changedFilePaths: changedFilePaths,
                            deletedFilePaths: deletedFilePaths,
                        })];
                case 1:
                    fileSyncResult = _c.sent();
                    if (fileSyncResult instanceof Error) {
                        forumLogger.warn("FS -> Discord sync failed for ".concat(runtimeState.forumChannelId, ": ").concat(fileSyncResult.message));
                        return [2 /*return*/];
                    }
                    if (fileSyncResult.created + fileSyncResult.updated + fileSyncResult.deleted >
                        0) {
                        forumLogger.log("FS -> Discord ".concat(runtimeState.forumChannelId, ": +").concat(fileSyncResult.created, " ~").concat(fileSyncResult.updated, " -").concat(fileSyncResult.deleted, " (skip ").concat(fileSyncResult.skipped, ")"));
                    }
                    return [4 /*yield*/, (0, sync_to_files_js_1.syncForumToFiles)({
                            discordClient: discordClient,
                            forumChannelId: runtimeState.forumChannelId,
                            outputDir: runtimeState.outputDir,
                            runtimeState: runtimeState,
                            forceThreadIds: runtimeState.dirtyThreadIds,
                        })];
                case 2:
                    discordSyncResult = _c.sent();
                    if (discordSyncResult instanceof Error) {
                        forumLogger.warn("Discord -> FS refresh failed for ".concat(runtimeState.forumChannelId, ": ").concat(discordSyncResult.message));
                        return [2 /*return*/];
                    }
                    runtimeState.dirtyThreadIds.clear();
                    return [2 /*return*/];
            }
        });
    });
}
function queueFileEvent(_a) {
    var runtimeState = _a.runtimeState, filePath = _a.filePath, eventType = _a.eventType, discordClient = _a.discordClient;
    if ((0, types_js_1.shouldIgnorePath)({ runtimeState: runtimeState, filePath: filePath }))
        return;
    runtimeState.queuedFileEvents.set(filePath, eventType);
    if (runtimeState.fileDebounceTimer) {
        clearTimeout(runtimeState.fileDebounceTimer);
    }
    runtimeState.fileDebounceTimer = setTimeout(function () {
        runtimeState.fileDebounceTimer = null;
        void runQueuedFileEvents({ runtimeState: runtimeState, discordClient: discordClient });
    }, types_js_1.DEFAULT_DEBOUNCE_MS);
}
// ═══════════════════════════════════════════════════════════════════════════
// DISCORD EVENT HANDLING
// ═══════════════════════════════════════════════════════════════════════════
function scheduleDiscordSync(_a) {
    var _this = this;
    var runtimeState = _a.runtimeState, threadId = _a.threadId, discordClient = _a.discordClient;
    runtimeState.dirtyThreadIds.add(threadId);
    if (runtimeState.discordDebounceTimer) {
        clearTimeout(runtimeState.discordDebounceTimer);
    }
    runtimeState.discordDebounceTimer = setTimeout(function () {
        runtimeState.discordDebounceTimer = null;
        void (function () { return __awaiter(_this, void 0, void 0, function () {
            var syncResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, sync_to_files_js_1.syncForumToFiles)({
                            discordClient: discordClient,
                            forumChannelId: runtimeState.forumChannelId,
                            outputDir: runtimeState.outputDir,
                            runtimeState: runtimeState,
                            forceThreadIds: runtimeState.dirtyThreadIds,
                        })];
                    case 1:
                        syncResult = _a.sent();
                        if (syncResult instanceof Error) {
                            forumLogger.warn("Debounced Discord -> FS sync failed for ".concat(runtimeState.forumChannelId, ": ").concat(syncResult.message));
                            return [2 /*return*/];
                        }
                        runtimeState.dirtyThreadIds.clear();
                        return [2 /*return*/];
                }
            });
        }); })();
    }, types_js_1.DEFAULT_DEBOUNCE_MS);
}
function getThreadEventData(_a) {
    var channel = _a.channel;
    if (!channel)
        return null;
    if (channel.type !== discord_js_1.ChannelType.PublicThread &&
        channel.type !== discord_js_1.ChannelType.PrivateThread &&
        channel.type !== discord_js_1.ChannelType.AnnouncementThread) {
        return null;
    }
    if (!channel.parentId)
        return null;
    return { forumChannelId: channel.parentId, threadId: channel.id };
}
function getEventThreadFromMessage(_a) {
    var message = _a.message;
    var channel = message.channel;
    if (!channel || !channel.isThread())
        return null;
    return channel;
}
function tryHandleThreadEvent(_a) {
    var channel = _a.channel, discordClient = _a.discordClient;
    var data = getThreadEventData({ channel: channel });
    if (!data)
        return;
    var runtimeState = forumStateById.get(data.forumChannelId);
    if (!runtimeState)
        return;
    scheduleDiscordSync({ runtimeState: runtimeState, threadId: data.threadId, discordClient: discordClient });
}
/**
 * Find the file path for a thread, checking root and one level of subdirectories.
 */
function findThreadFilePath(_a) {
    var outputDir = _a.outputDir, threadId = _a.threadId;
    var rootPath = (0, discord_operations_js_1.getCanonicalThreadFilePath)({ outputDir: outputDir, threadId: threadId });
    if (node_fs_1.default.existsSync(rootPath))
        return rootPath;
    var dirEntries = (function () {
        try {
            return node_fs_1.default.readdirSync(outputDir, { withFileTypes: true });
        }
        catch (_a) {
            return [];
        }
    })();
    for (var _i = 0, dirEntries_1 = dirEntries; _i < dirEntries_1.length; _i++) {
        var entry = dirEntries_1[_i];
        if (!entry.isDirectory())
            continue;
        var subPath = (0, discord_operations_js_1.getCanonicalThreadFilePath)({
            outputDir: outputDir,
            threadId: threadId,
            subfolder: entry.name,
        });
        if (node_fs_1.default.existsSync(subPath))
            return subPath;
    }
    return null;
}
function registerDiscordSyncListeners(_a) {
    var _this = this;
    var discordClient = _a.discordClient;
    if (discordListenersRegistered)
        return;
    discordListenersRegistered = true;
    discordClient.on(discord_js_1.Events.MessageCreate, function (message) {
        var _a;
        if ((_a = message.author) === null || _a === void 0 ? void 0 : _a.bot)
            return;
        var thread = getEventThreadFromMessage({ message: message });
        tryHandleThreadEvent({ channel: thread, discordClient: discordClient });
    });
    discordClient.on(discord_js_1.Events.MessageUpdate, function (_oldMessage, newMessage) {
        var thread = getEventThreadFromMessage({ message: newMessage });
        tryHandleThreadEvent({ channel: thread, discordClient: discordClient });
    });
    discordClient.on(discord_js_1.Events.ThreadUpdate, function (_oldThread, newThread) {
        tryHandleThreadEvent({ channel: newThread, discordClient: discordClient });
    });
    discordClient.on(discord_js_1.Events.ThreadDelete, function (thread) { return __awaiter(_this, void 0, void 0, function () {
        var data, runtimeState, targetPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = getThreadEventData({ channel: thread });
                    if (!data)
                        return [2 /*return*/];
                    runtimeState = forumStateById.get(data.forumChannelId);
                    if (!runtimeState)
                        return [2 /*return*/];
                    targetPath = findThreadFilePath({
                        outputDir: runtimeState.outputDir,
                        threadId: data.threadId,
                    });
                    if (!targetPath)
                        return [2 /*return*/];
                    (0, types_js_1.addIgnoredPath)({ runtimeState: runtimeState, filePath: targetPath });
                    return [4 /*yield*/, node_fs_1.default.promises.unlink(targetPath).catch(function (cause) {
                            forumLogger.warn("Failed to delete forum file on thread delete ".concat(targetPath, ":"), cause);
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
}
// ═══════════════════════════════════════════════════════════════════════════
// FILE WATCHER SETUP
// ═══════════════════════════════════════════════════════════════════════════
function startWatcherForRuntimeState(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var subscription;
        var runtimeState = _b.runtimeState, discordClient = _b.discordClient;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (runtimeState.direction !== 'bidirectional')
                        return [2 /*return*/];
                    return [4 /*yield*/, watcher_1.default
                            .subscribe(runtimeState.outputDir, function (_error, events) {
                            var mdEvents = events.filter(function (event) { return event.path.endsWith('.md'); });
                            mdEvents
                                .filter(function (event) {
                                return event.type === 'create' ||
                                    event.type === 'update' ||
                                    event.type === 'delete';
                            })
                                .map(function (event) {
                                queueFileEvent({
                                    runtimeState: runtimeState,
                                    filePath: event.path,
                                    eventType: event.type,
                                    discordClient: discordClient,
                                });
                            });
                        })
                            .catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: runtimeState.forumChannelId,
                                reason: "failed to subscribe watcher for ".concat(runtimeState.outputDir),
                                cause: cause,
                            });
                        })];
                case 1:
                    subscription = _c.sent();
                    if (subscription instanceof Error)
                        return [2 /*return*/, subscription];
                    watcherUnsubscribeByForumId.set(runtimeState.forumChannelId, function () {
                        return subscription.unsubscribe();
                    });
                    return [2 /*return*/];
            }
        });
    });
}
// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════
function stopConfiguredForumSync() {
    return __awaiter(this, void 0, void 0, function () {
        var unsubscribers;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    unsubscribers = Array.from(watcherUnsubscribeByForumId.values());
                    watcherUnsubscribeByForumId.clear();
                    forumStateById.clear();
                    return [4 /*yield*/, Promise.all(unsubscribers.map(function (unsubscribe) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, unsubscribe().catch(function (cause) {
                                            forumLogger.warn('Failed to unsubscribe forum watcher:', cause);
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function startConfiguredForumSync(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var loadedConfig, _i, loadedConfig_1, entry, runtimeState, ensureResult, fileToDiscordResult, discordToFileResult, watcherResult;
        var discordClient = _b.discordClient, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, config_js_1.readForumSyncConfig)({ appId: appId })];
                case 1:
                    loadedConfig = _c.sent();
                    if (loadedConfig instanceof Error)
                        return [2 /*return*/, loadedConfig];
                    if (loadedConfig.length === 0)
                        return [2 /*return*/];
                    registerDiscordSyncListeners({ discordClient: discordClient });
                    _i = 0, loadedConfig_1 = loadedConfig;
                    _c.label = 2;
                case 2:
                    if (!(_i < loadedConfig_1.length)) return [3 /*break*/, 8];
                    entry = loadedConfig_1[_i];
                    runtimeState = buildRuntimeState({
                        forumChannelId: entry.forumChannelId,
                        outputDir: entry.outputDir,
                        direction: entry.direction,
                    });
                    forumStateById.set(entry.forumChannelId, runtimeState);
                    return [4 /*yield*/, (0, discord_operations_js_1.ensureDirectory)({ directory: entry.outputDir })];
                case 3:
                    ensureResult = _c.sent();
                    if (ensureResult instanceof Error) {
                        forumLogger.warn("Skipping forum ".concat(entry.forumChannelId, ": failed to create ").concat(entry.outputDir));
                        return [3 /*break*/, 7];
                    }
                    return [4 /*yield*/, (0, sync_to_discord_js_1.syncFilesToForum)({
                            discordClient: discordClient,
                            forumChannelId: entry.forumChannelId,
                            outputDir: entry.outputDir,
                            runtimeState: runtimeState,
                        })];
                case 4:
                    fileToDiscordResult = _c.sent();
                    if (fileToDiscordResult instanceof Error) {
                        forumLogger.warn("Skipping forum ".concat(entry.forumChannelId, ": FS->Discord sync failed: ").concat(fileToDiscordResult.message));
                        return [3 /*break*/, 7];
                    }
                    return [4 /*yield*/, (0, sync_to_files_js_1.syncForumToFiles)({
                            discordClient: discordClient,
                            forumChannelId: entry.forumChannelId,
                            outputDir: entry.outputDir,
                            forceFullRefresh: true,
                            runtimeState: runtimeState,
                        })];
                case 5:
                    discordToFileResult = _c.sent();
                    if (discordToFileResult instanceof Error) {
                        forumLogger.warn("Skipping forum ".concat(entry.forumChannelId, ": Discord->FS sync failed: ").concat(discordToFileResult.message));
                        return [3 /*break*/, 7];
                    }
                    return [4 /*yield*/, startWatcherForRuntimeState({
                            runtimeState: runtimeState,
                            discordClient: discordClient,
                        })];
                case 6:
                    watcherResult = _c.sent();
                    if (watcherResult instanceof Error) {
                        forumLogger.warn("Skipping forum ".concat(entry.forumChannelId, ": watcher failed: ").concat(watcherResult.message));
                        return [3 /*break*/, 7];
                    }
                    forumLogger.log("Forum sync started for ".concat(entry.forumChannelId, " (").concat(entry.direction, ") -> ").concat(entry.outputDir));
                    forumLogger.log("Initial sync: Discord->FS synced ".concat(discordToFileResult.synced, ", skipped ").concat(discordToFileResult.skipped, ", deleted ").concat(discordToFileResult.deleted, "; FS->Discord created ").concat(fileToDiscordResult.created, ", updated ").concat(fileToDiscordResult.updated, ", deleted ").concat(fileToDiscordResult.deleted));
                    _c.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/];
            }
        });
    });
}
