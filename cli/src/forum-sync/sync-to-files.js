"use strict";
// Discord -> filesystem sync.
// Fetches forum threads from Discord and writes them as markdown files.
// Handles incremental sync (skip unchanged threads) and stale file cleanup.
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
exports.syncSingleThreadToFile = syncSingleThreadToFile;
exports.syncForumToFiles = syncForumToFiles;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var logger_js_1 = require("../logger.js");
var markdown_js_1 = require("./markdown.js");
var discord_operations_js_1 = require("./discord-operations.js");
var types_js_1 = require("./types.js");
var forumLogger = (0, logger_js_1.createLogger)('FORUM');
function resolveTagNames(_a) {
    var thread = _a.thread, forumChannel = _a.forumChannel;
    var availableTagsById = new Map(forumChannel.availableTags.map(function (tag) { return [tag.id, tag.name]; }));
    return thread.appliedTags
        .map(function (tagId) { return availableTagsById.get(tagId); })
        .filter(function (tagName) { return Boolean(tagName); });
}
function resolveSubfolderForThread(_a) {
    var existingSubfolder = _a.existingSubfolder, thread = _a.thread, forumChannel = _a.forumChannel;
    var hasGlobalTag = resolveTagNames({ thread: thread, forumChannel: forumChannel }).some(function (tagName) { return tagName.toLowerCase().trim() === 'global'; });
    if (hasGlobalTag)
        return 'global';
    if (existingSubfolder)
        return existingSubfolder;
    return undefined;
}
function buildFrontmatter(_a) {
    var _b, _c;
    var thread = _a.thread, forumChannel = _a.forumChannel, sections = _a.sections, project = _a.project, projectChannelId = _a.projectChannelId;
    var firstSection = sections[0];
    var createdTimestamp = (_b = thread.createdTimestamp) !== null && _b !== void 0 ? _b : Date.now();
    var latestTimestamp = sections.reduce(function (latest, section) {
        var created = Date.parse(section.createdAt);
        var edited = section.editedAt ? Date.parse(section.editedAt) : 0;
        return Math.max(latest, created, edited);
    }, createdTimestamp);
    return __assign(__assign({ title: thread.name, threadId: thread.id, forumChannelId: forumChannel.id, tags: resolveTagNames({ thread: thread, forumChannel: forumChannel }), author: (firstSection === null || firstSection === void 0 ? void 0 : firstSection.authorName) || '', authorId: (firstSection === null || firstSection === void 0 ? void 0 : firstSection.authorId) || '', createdAt: ((_c = thread.createdAt) === null || _c === void 0 ? void 0 : _c.toISOString()) ||
            new Date(createdTimestamp).toISOString(), lastUpdated: new Date(latestTimestamp).toISOString(), lastMessageId: thread.lastMessageId, lastSyncedAt: new Date().toISOString(), messageCount: sections.length }, (project && { project: project })), (projectChannelId && { projectChannelId: projectChannelId }));
}
function syncSingleThreadToFile(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var messages, resolvedProjectChannelId, resolvedSubfolder, sections, firstSection, _c, cleanContent, footerChannelId, subDir, ensureResult, body, frontmatter, markdown, targetPath, writeResult;
        var thread = _b.thread, forumChannel = _b.forumChannel, outputDir = _b.outputDir, runtimeState = _b.runtimeState, previousFilePath = _b.previousFilePath, subfolder = _b.subfolder, project = _b.project, projectChannelId = _b.projectChannelId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, discord_operations_js_1.fetchThreadMessages)({ thread: thread })];
                case 1:
                    messages = _d.sent();
                    if (messages instanceof Error)
                        return [2 /*return*/, messages
                            // Extract projectChannelId from the starter message footer if not already known.
                            // This allows Discord -> file sync to reconstruct the correct subfolder
                            // even when no local .md file exists (e.g. fresh machine, deleted files).
                        ];
                    resolvedProjectChannelId = projectChannelId;
                    resolvedSubfolder = subfolder;
                    sections = (0, markdown_js_1.buildMessageSections)({ messages: messages });
                    firstSection = sections[0];
                    if (firstSection) {
                        _c = (0, markdown_js_1.extractProjectChannelFromContent)({ content: firstSection.content }), cleanContent = _c.cleanContent, footerChannelId = _c.projectChannelId;
                        firstSection.content = cleanContent;
                        if (footerChannelId && !resolvedProjectChannelId) {
                            resolvedProjectChannelId = footerChannelId;
                        }
                        if (resolvedProjectChannelId && !resolvedSubfolder) {
                            resolvedSubfolder = resolvedProjectChannelId;
                        }
                    }
                    if (!resolvedSubfolder) return [3 /*break*/, 3];
                    subDir = node_path_1.default.join(outputDir, resolvedSubfolder);
                    return [4 /*yield*/, (0, discord_operations_js_1.ensureDirectory)({ directory: subDir })];
                case 2:
                    ensureResult = _d.sent();
                    if (ensureResult instanceof Error)
                        return [2 /*return*/, ensureResult];
                    _d.label = 3;
                case 3:
                    body = sections
                        .map(function (section) { return (0, markdown_js_1.formatMessageSection)({ section: section }); })
                        .join('\n\n---\n\n');
                    frontmatter = buildFrontmatter({
                        thread: thread,
                        forumChannel: forumChannel,
                        sections: sections,
                        project: project,
                        projectChannelId: resolvedProjectChannelId,
                    });
                    markdown = (0, markdown_js_1.stringifyFrontmatter)({ frontmatter: frontmatter, body: body });
                    targetPath = (0, discord_operations_js_1.getCanonicalThreadFilePath)({
                        outputDir: outputDir,
                        threadId: thread.id,
                        subfolder: resolvedSubfolder,
                    });
                    (0, types_js_1.addIgnoredPath)({ runtimeState: runtimeState, filePath: targetPath });
                    return [4 /*yield*/, node_fs_1.default.promises
                            .writeFile(targetPath, markdown, 'utf8')
                            .catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: "failed to write ".concat(targetPath),
                                cause: cause,
                            });
                        })];
                case 4:
                    writeResult = _d.sent();
                    if (writeResult instanceof Error)
                        return [2 /*return*/, writeResult
                            // Clean up old file if thread was renamed (file path changed)
                        ];
                    if (!(previousFilePath &&
                        previousFilePath !== targetPath &&
                        node_fs_1.default.existsSync(previousFilePath))) return [3 /*break*/, 6];
                    (0, types_js_1.addIgnoredPath)({ runtimeState: runtimeState, filePath: previousFilePath });
                    return [4 /*yield*/, node_fs_1.default.promises.unlink(previousFilePath).catch(function (cause) {
                            forumLogger.warn("Failed to remove old forum file ".concat(previousFilePath, ":"), cause);
                        })];
                case 5:
                    _d.sent();
                    _d.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function syncForumToFiles(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var ensureResult, forumChannel, threads, existingFiles, existingByThreadId, result, _i, threads_1, thread, existing, savedLastMessageId, isForced, syncResult, liveThreadIds, _loop_1, _c, existingFiles_1, existing, state_1;
        var discordClient = _b.discordClient, forumChannelId = _b.forumChannelId, outputDir = _b.outputDir, _d = _b.forceFullRefresh, forceFullRefresh = _d === void 0 ? false : _d, forceThreadIds = _b.forceThreadIds, runtimeState = _b.runtimeState;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, discord_operations_js_1.ensureDirectory)({ directory: outputDir })];
                case 1:
                    ensureResult = _e.sent();
                    if (ensureResult instanceof Error) {
                        return [2 /*return*/, new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannelId,
                                reason: "failed to create output directory ".concat(outputDir),
                                cause: ensureResult,
                            })];
                    }
                    return [4 /*yield*/, (0, discord_operations_js_1.resolveForumChannel)({
                            discordClient: discordClient,
                            forumChannelId: forumChannelId,
                        })];
                case 2:
                    forumChannel = _e.sent();
                    if (forumChannel instanceof Error)
                        return [2 /*return*/, forumChannel];
                    return [4 /*yield*/, (0, discord_operations_js_1.fetchForumThreads)({ forumChannel: forumChannel })];
                case 3:
                    threads = _e.sent();
                    if (threads instanceof Error)
                        return [2 /*return*/, threads];
                    return [4 /*yield*/, (0, discord_operations_js_1.loadExistingForumFiles)({ outputDir: outputDir })];
                case 4:
                    existingFiles = _e.sent();
                    existingByThreadId = new Map(existingFiles.map(function (entry) { return [entry.threadId, entry]; }));
                    result = { synced: 0, skipped: 0, deleted: 0 };
                    _i = 0, threads_1 = threads;
                    _e.label = 5;
                case 5:
                    if (!(_i < threads_1.length)) return [3 /*break*/, 9];
                    thread = threads_1[_i];
                    existing = existingByThreadId.get(thread.id);
                    savedLastMessageId = (0, markdown_js_1.getStringValue)({ value: existing === null || existing === void 0 ? void 0 : existing.frontmatter.lastMessageId }) || null;
                    isForced = forceFullRefresh || Boolean(forceThreadIds === null || forceThreadIds === void 0 ? void 0 : forceThreadIds.has(thread.id));
                    if (!isForced &&
                        savedLastMessageId &&
                        savedLastMessageId === thread.lastMessageId) {
                        result.skipped += 1;
                        return [3 /*break*/, 8];
                    }
                    return [4 /*yield*/, syncSingleThreadToFile({
                            thread: thread,
                            forumChannel: forumChannel,
                            outputDir: outputDir,
                            runtimeState: runtimeState,
                            previousFilePath: existing === null || existing === void 0 ? void 0 : existing.filePath,
                            subfolder: resolveSubfolderForThread({
                                existingSubfolder: existing === null || existing === void 0 ? void 0 : existing.subfolder,
                                thread: thread,
                                forumChannel: forumChannel,
                            }),
                            project: (0, markdown_js_1.getStringValue)({ value: existing === null || existing === void 0 ? void 0 : existing.frontmatter.project }),
                            projectChannelId: (0, markdown_js_1.getStringValue)({
                                value: existing === null || existing === void 0 ? void 0 : existing.frontmatter.projectChannelId,
                            }),
                        })];
                case 6:
                    syncResult = _e.sent();
                    if (syncResult instanceof Error)
                        return [2 /*return*/, syncResult];
                    result.synced += 1;
                    return [4 /*yield*/, (0, types_js_1.delay)({ ms: types_js_1.DEFAULT_RATE_LIMIT_DELAY_MS })];
                case 7:
                    _e.sent();
                    _e.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 5];
                case 9:
                    liveThreadIds = new Set(threads.map(function (thread) { return thread.id; }));
                    _loop_1 = function (existing) {
                        var deleteResult;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    if (liveThreadIds.has(existing.threadId))
                                        return [2 /*return*/, "continue"];
                                    if (!node_fs_1.default.existsSync(existing.filePath))
                                        return [2 /*return*/, "continue"];
                                    (0, types_js_1.addIgnoredPath)({ runtimeState: runtimeState, filePath: existing.filePath });
                                    return [4 /*yield*/, node_fs_1.default.promises
                                            .unlink(existing.filePath)
                                            .catch(function (cause) {
                                            return new types_js_1.ForumSyncOperationError({
                                                forumChannelId: forumChannelId,
                                                reason: "failed deleting stale file ".concat(existing.filePath),
                                                cause: cause,
                                            });
                                        })];
                                case 1:
                                    deleteResult = _f.sent();
                                    if (deleteResult instanceof Error)
                                        return [2 /*return*/, { value: deleteResult }];
                                    result.deleted += 1;
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c = 0, existingFiles_1 = existingFiles;
                    _e.label = 10;
                case 10:
                    if (!(_c < existingFiles_1.length)) return [3 /*break*/, 13];
                    existing = existingFiles_1[_c];
                    return [5 /*yield**/, _loop_1(existing)];
                case 11:
                    state_1 = _e.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _e.label = 12;
                case 12:
                    _c++;
                    return [3 /*break*/, 10];
                case 13: return [2 /*return*/, result];
            }
        });
    });
}
