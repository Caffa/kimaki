"use strict";
// Filesystem -> Discord sync.
// Reads markdown files and creates/updates/deletes forum threads to match.
// Handles upsert logic: new files create threads, existing files update them.
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
exports.syncFilesToForum = syncFilesToForum;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var discord_js_1 = require("discord.js");
var logger_js_1 = require("../logger.js");
var markdown_js_1 = require("./markdown.js");
var discord_operations_js_1 = require("./discord-operations.js");
var sync_to_files_js_1 = require("./sync-to-files.js");
var types_js_1 = require("./types.js");
var forumLogger = (0, logger_js_1.createLogger)('FORUM');
// Fields managed by forum sync that should not be set by external writers (e.g. AI model).
// If a file has never been synced (no lastSyncedAt), these fields are stripped to prevent
// model-invented values from causing sync errors (e.g. fake threadId -> fetch fails,
// future lastSyncedAt -> file permanently skipped).
var SYSTEM_MANAGED_FIELDS = [
    'threadId',
    'forumChannelId',
    'lastSyncedAt',
    'lastMessageId',
    'messageCount',
    'author',
    'authorId',
    'createdAt',
    'lastUpdated',
    'project',
    'projectChannelId',
];
/** Check that a value is a valid ISO date string that isn't in the future. */
function isValidPastIsoDate(_a) {
    var value = _a.value;
    if (typeof value !== 'string')
        return false;
    var parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        return false;
    return parsed <= Date.now();
}
function stripSystemFieldsFromUnsyncedFile(_a) {
    var frontmatter = _a.frontmatter;
    if (isValidPastIsoDate({ value: frontmatter.lastSyncedAt }))
        return frontmatter;
    var cleaned = __assign({}, frontmatter);
    for (var _i = 0, SYSTEM_MANAGED_FIELDS_1 = SYSTEM_MANAGED_FIELDS; _i < SYSTEM_MANAGED_FIELDS_1.length; _i++) {
        var field = SYSTEM_MANAGED_FIELDS_1[_i];
        delete cleaned[field];
    }
    return cleaned;
}
function isValidDiscordSnowflake(_a) {
    var value = _a.value;
    return /^\d{17,20}$/.test(value);
}
function collectMarkdownEntries(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var exists, entries, relativeSub, subfolder, markdownFiles, nestedEntries;
        var _this = this;
        var dir = _b.dir, outputDir = _b.outputDir;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, node_fs_1.default.promises
                        .access(dir)
                        .then(function () { return true; })
                        .catch(function () { return false; })];
                case 1:
                    exists = _c.sent();
                    if (!exists)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, node_fs_1.default.promises.readdir(dir, { withFileTypes: true })];
                case 2:
                    entries = _c.sent();
                    relativeSub = node_path_1.default.relative(outputDir, dir);
                    subfolder = relativeSub && relativeSub !== '.' ? relativeSub : undefined;
                    markdownFiles = entries
                        .filter(function (entry) {
                        return entry.isFile() && entry.name.endsWith('.md');
                    })
                        .map(function (entry) {
                        return { filePath: node_path_1.default.join(dir, entry.name), subfolder: subfolder };
                    });
                    return [4 /*yield*/, Promise.all(entries
                            .filter(function (entry) {
                            return entry.isDirectory();
                        })
                            .map(function (entry) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, collectMarkdownEntries({
                                            dir: node_path_1.default.join(dir, entry.name),
                                            outputDir: outputDir,
                                        })];
                                    case 1: return [2 /*return*/, _a.sent()];
                                }
                            });
                        }); }))];
                case 3:
                    nestedEntries = _c.sent();
                    return [2 /*return*/, __spreadArray(__spreadArray([], markdownFiles, true), nestedEntries.flat(), true)];
            }
        });
    });
}
function resolveTagIds(_a) {
    var forumChannel = _a.forumChannel, tagNames = _a.tagNames;
    if (tagNames.length === 0)
        return [];
    var normalizedWanted = new Set(tagNames.map(function (tag) { return tag.toLowerCase().trim(); }));
    return forumChannel.availableTags
        .filter(function (tag) { return normalizedWanted.has(tag.name.toLowerCase().trim()); })
        .map(function (tag) { return tag.id; });
}
/** Ensure all requested tag names exist on the forum channel, creating any missing ones. */
function ensureForumTags(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var existingNames, missing, available;
        var forumChannel = _b.forumChannel, tagNames = _b.tagNames;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (tagNames.length === 0)
                        return [2 /*return*/];
                    existingNames = new Set(forumChannel.availableTags.map(function (tag) { return tag.name.toLowerCase().trim(); }));
                    missing = tagNames.filter(function (name) { return !existingNames.has(name.toLowerCase().trim()); });
                    if (missing.length === 0)
                        return [2 /*return*/];
                    available = forumChannel.availableTags;
                    if (available.length + missing.length > 20)
                        return [2 /*return*/];
                    return [4 /*yield*/, forumChannel
                            .setAvailableTags(__spreadArray(__spreadArray([], available, true), missing.map(function (name) { return ({ name: name }); }), true), "Auto-create tags: ".concat(missing.join(', ')))
                            .catch(function (cause) {
                            forumLogger.warn("Failed to create forum tags [".concat(missing.join(', '), "]: ").concat(cause instanceof Error ? cause.message : cause));
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function hasTagName(_a) {
    var tags = _a.tags, tagName = _a.tagName;
    return tags.some(function (tag) { return tag.toLowerCase().trim() === tagName.toLowerCase().trim(); });
}
function upsertThreadFromFile(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var content, parsed, frontmatter, rawThreadId, threadId, title, tags, normalizedSubfolder, isGlobalSubfolder, tagsWithScope, allTags, starterContent, baseContent, safeStarterContent, stat, lastSyncedAt, tagIds;
        var discordClient = _b.discordClient, forumChannel = _b.forumChannel, filePath = _b.filePath, runtimeState = _b.runtimeState, subfolder = _b.subfolder, project = _b.project, projectChannelId = _b.projectChannelId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!node_fs_1.default.existsSync(filePath))
                        return [2 /*return*/, 'skipped'];
                    return [4 /*yield*/, node_fs_1.default.promises
                            .readFile(filePath, 'utf8')
                            .catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: "failed to read ".concat(filePath),
                                cause: cause,
                            });
                        })];
                case 1:
                    content = _c.sent();
                    if (content instanceof Error)
                        return [2 /*return*/, content];
                    parsed = (0, markdown_js_1.parseFrontmatter)({ markdown: content });
                    frontmatter = stripSystemFieldsFromUnsyncedFile({
                        frontmatter: parsed.frontmatter,
                    });
                    rawThreadId = (0, markdown_js_1.getStringValue)({ value: frontmatter.threadId });
                    threadId = rawThreadId && isValidDiscordSnowflake({ value: rawThreadId })
                        ? rawThreadId
                        : '';
                    title = (0, markdown_js_1.getStringValue)({ value: frontmatter.title }) ||
                        node_path_1.default.basename(filePath, '.md');
                    tags = (0, markdown_js_1.toStringArray)({ value: frontmatter.tags });
                    normalizedSubfolder = subfolder === null || subfolder === void 0 ? void 0 : subfolder.replaceAll('\\', '/').toLowerCase();
                    isGlobalSubfolder = Boolean(normalizedSubfolder &&
                        (normalizedSubfolder === 'global' ||
                            normalizedSubfolder.startsWith('global/')));
                    tagsWithScope = isGlobalSubfolder && !hasTagName({ tags: tags, tagName: 'global' })
                        ? __spreadArray(__spreadArray([], tags, true), ['global'], false) : tags;
                    allTags = project && !hasTagName({ tags: tagsWithScope, tagName: project })
                        ? __spreadArray(__spreadArray([], tagsWithScope, true), [project], false) : tagsWithScope;
                    starterContent = (0, markdown_js_1.extractStarterContent)({ body: parsed.body });
                    baseContent = starterContent || title || 'Untitled post';
                    safeStarterContent = (0, markdown_js_1.appendProjectChannelFooter)({
                        content: baseContent,
                        projectChannelId: projectChannelId,
                    });
                    return [4 /*yield*/, node_fs_1.default.promises.stat(filePath).catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: "failed to stat ".concat(filePath),
                                cause: cause,
                            });
                        })];
                case 2:
                    stat = _c.sent();
                    if (stat instanceof Error)
                        return [2 /*return*/, stat
                            // Skip if file hasn't been modified since last sync
                        ];
                    lastSyncedAt = Date.parse((0, markdown_js_1.getStringValue)({ value: frontmatter.lastSyncedAt }));
                    if (Number.isFinite(lastSyncedAt) && stat.mtimeMs <= lastSyncedAt)
                        return [2 /*return*/, 'skipped'];
                    return [4 /*yield*/, ensureForumTags({ forumChannel: forumChannel, tagNames: allTags })];
                case 3:
                    _c.sent();
                    tagIds = resolveTagIds({ forumChannel: forumChannel, tagNames: allTags });
                    if (!!threadId) return [3 /*break*/, 5];
                    return [4 /*yield*/, createNewThread({
                            forumChannel: forumChannel,
                            filePath: filePath,
                            title: title,
                            safeStarterContent: safeStarterContent,
                            tagIds: tagIds,
                            runtimeState: runtimeState,
                            subfolder: subfolder,
                            project: project,
                            projectChannelId: projectChannelId,
                        })];
                case 4: return [2 /*return*/, _c.sent()];
                case 5: return [4 /*yield*/, updateExistingThread({
                        discordClient: discordClient,
                        forumChannel: forumChannel,
                        filePath: filePath,
                        threadId: threadId,
                        title: title,
                        safeStarterContent: safeStarterContent,
                        tagIds: tagIds,
                        runtimeState: runtimeState,
                        subfolder: subfolder,
                        project: project,
                        projectChannelId: projectChannelId,
                    })];
                case 6: 
                // Thread exists -> update it
                return [2 /*return*/, _c.sent()];
            }
        });
    });
}
function createNewThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var created, syncResult;
        var forumChannel = _b.forumChannel, filePath = _b.filePath, title = _b.title, safeStarterContent = _b.safeStarterContent, tagIds = _b.tagIds, runtimeState = _b.runtimeState, subfolder = _b.subfolder, project = _b.project, projectChannelId = _b.projectChannelId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, forumChannel.threads
                        .create({
                        name: title.slice(0, 100) || 'Untitled post',
                        message: {
                            content: safeStarterContent.slice(0, 2000),
                            flags: discord_js_1.MessageFlags.SuppressEmbeds,
                        },
                        appliedTags: tagIds,
                    })
                        .catch(function (cause) {
                        return new types_js_1.ForumSyncOperationError({
                            forumChannelId: forumChannel.id,
                            reason: "failed creating thread from ".concat(filePath),
                            cause: cause,
                        });
                    })];
                case 1:
                    created = _c.sent();
                    if (created instanceof Error)
                        return [2 /*return*/, created
                            // Re-sync the file to get the new threadId in frontmatter.
                            // outputDir is path.dirname(filePath) which already includes the subfolder,
                            // so we don't pass subfolder again to avoid double-nesting.
                        ];
                    return [4 /*yield*/, (0, sync_to_files_js_1.syncSingleThreadToFile)({
                            thread: created,
                            forumChannel: forumChannel,
                            outputDir: node_path_1.default.dirname(filePath),
                            runtimeState: runtimeState,
                            previousFilePath: filePath,
                            project: project,
                            projectChannelId: projectChannelId,
                        })];
                case 2:
                    syncResult = _c.sent();
                    if (syncResult instanceof Error)
                        return [2 /*return*/, syncResult];
                    return [2 /*return*/, 'created'];
            }
        });
    });
}
function updateExistingThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var fetchedChannel, updateResult, starterMessage, editResult, syncResult;
        var discordClient = _b.discordClient, forumChannel = _b.forumChannel, filePath = _b.filePath, threadId = _b.threadId, title = _b.title, safeStarterContent = _b.safeStarterContent, tagIds = _b.tagIds, runtimeState = _b.runtimeState, subfolder = _b.subfolder, project = _b.project, projectChannelId = _b.projectChannelId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, discordClient.channels.fetch(threadId).catch(function (cause) {
                        return new types_js_1.ForumSyncOperationError({
                            forumChannelId: forumChannel.id,
                            reason: "failed fetching thread ".concat(threadId),
                            cause: cause,
                        });
                    })];
                case 1:
                    fetchedChannel = _c.sent();
                    if (fetchedChannel instanceof Error)
                        return [2 /*return*/, fetchedChannel];
                    if (!fetchedChannel ||
                        !fetchedChannel.isThread() ||
                        fetchedChannel.parentId !== forumChannel.id) {
                        return [2 /*return*/, new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: "thread ".concat(threadId, " not found in forum"),
                            })];
                    }
                    return [4 /*yield*/, fetchedChannel
                            .edit({
                            name: title.slice(0, 100) || fetchedChannel.name,
                            appliedTags: tagIds,
                        })
                            .catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: "failed editing thread ".concat(threadId),
                                cause: cause,
                            });
                        })];
                case 2:
                    updateResult = _c.sent();
                    if (updateResult instanceof Error)
                        return [2 /*return*/, updateResult];
                    return [4 /*yield*/, fetchedChannel
                            .fetchStarterMessage()
                            .catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: "failed fetching starter message for ".concat(threadId),
                                cause: cause,
                            });
                        })];
                case 3:
                    starterMessage = _c.sent();
                    if (starterMessage instanceof Error)
                        return [2 /*return*/, starterMessage];
                    if (!(starterMessage && starterMessage.content !== safeStarterContent)) return [3 /*break*/, 5];
                    return [4 /*yield*/, starterMessage
                            .edit({
                            content: safeStarterContent.slice(0, 2000),
                            flags: discord_js_1.MessageFlags.SuppressEmbeds,
                        })
                            .catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: "failed editing starter message for ".concat(threadId),
                                cause: cause,
                            });
                        })];
                case 4:
                    editResult = _c.sent();
                    if (editResult instanceof Error)
                        return [2 /*return*/, editResult];
                    _c.label = 5;
                case 5: return [4 /*yield*/, (0, sync_to_files_js_1.syncSingleThreadToFile)({
                        thread: fetchedChannel,
                        forumChannel: forumChannel,
                        outputDir: node_path_1.default.dirname(filePath),
                        runtimeState: runtimeState,
                        project: project,
                        projectChannelId: projectChannelId,
                    })];
                case 6:
                    syncResult = _c.sent();
                    if (syncResult instanceof Error)
                        return [2 /*return*/, syncResult];
                    return [2 /*return*/, 'updated'];
            }
        });
    });
}
function deleteThreadFromFilePath(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var filename, threadId, fetchedChannel, deleteResult;
        var discordClient = _b.discordClient, forumChannel = _b.forumChannel, filePath = _b.filePath;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    filename = node_path_1.default.basename(filePath, '.md');
                    if (!/^\d+$/.test(filename))
                        return [2 /*return*/];
                    threadId = filename;
                    return [4 /*yield*/, discordClient.channels.fetch(threadId).catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: "failed fetching deleted thread ".concat(threadId),
                                cause: cause,
                            });
                        })];
                case 1:
                    fetchedChannel = _c.sent();
                    if (fetchedChannel instanceof Error)
                        return [2 /*return*/, fetchedChannel];
                    if (!fetchedChannel ||
                        !fetchedChannel.isThread() ||
                        fetchedChannel.parentId !== forumChannel.id) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, fetchedChannel
                            .delete('Deleted from forum sync markdown directory')
                            .catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: "failed deleting thread ".concat(threadId),
                                cause: cause,
                            });
                        })];
                case 2:
                    deleteResult = _c.sent();
                    if (deleteResult instanceof Error)
                        return [2 /*return*/, deleteResult];
                    return [2 /*return*/];
            }
        });
    });
}
function syncFilesToForum(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var forumChannel, changedEntries, _c, channelNameCache, resolveChannelName, result, _i, changedEntries_1, _d, filePath, subfolder, projectChannelId, project, _e, upsertResult, _f, _g, filePath, deleteResult;
        var _this = this;
        var discordClient = _b.discordClient, forumChannelId = _b.forumChannelId, outputDir = _b.outputDir, runtimeState = _b.runtimeState, changedFilePaths = _b.changedFilePaths, deletedFilePaths = _b.deletedFilePaths;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0: return [4 /*yield*/, (0, discord_operations_js_1.resolveForumChannel)({
                        discordClient: discordClient,
                        forumChannelId: forumChannelId,
                    })];
                case 1:
                    forumChannel = _h.sent();
                    if (forumChannel instanceof Error)
                        return [2 /*return*/, forumChannel
                            // When changedFilePaths is provided (from file watcher), derive subfolder from path.
                            // Otherwise, recursively scan all markdown files in outputDir.
                        ];
                    if (!changedFilePaths) return [3 /*break*/, 2];
                    _c = changedFilePaths.map(function (filePath) {
                        var rel = node_path_1.default.relative(outputDir, node_path_1.default.dirname(filePath));
                        var subfolder = rel && rel !== '.' ? rel : undefined;
                        return { filePath: filePath, subfolder: subfolder };
                    });
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, collectMarkdownEntries({ dir: outputDir, outputDir: outputDir })
                    // Resolve channel names for subfolders (each subfolder name is a Discord channel ID).
                    // Cache resolutions to avoid redundant API calls.
                ];
                case 3:
                    _c = _h.sent();
                    _h.label = 4;
                case 4:
                    changedEntries = _c;
                    channelNameCache = new Map();
                    resolveChannelName = function (channelId) { return __awaiter(_this, void 0, void 0, function () {
                        var channel, name;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (channelNameCache.has(channelId))
                                        return [2 /*return*/, channelNameCache.get(channelId)];
                                    return [4 /*yield*/, discordClient.channels
                                            .fetch(channelId)
                                            .catch(function () { return null; })];
                                case 1:
                                    channel = _a.sent();
                                    name = channel && 'name' in channel && typeof channel.name === 'string'
                                        ? channel.name
                                        : null;
                                    channelNameCache.set(channelId, name);
                                    return [2 /*return*/, name];
                            }
                        });
                    }); };
                    result = {
                        created: 0,
                        updated: 0,
                        skipped: 0,
                        deleted: 0,
                    };
                    _i = 0, changedEntries_1 = changedEntries;
                    _h.label = 5;
                case 5:
                    if (!(_i < changedEntries_1.length)) return [3 /*break*/, 11];
                    _d = changedEntries_1[_i], filePath = _d.filePath, subfolder = _d.subfolder;
                    if (!filePath.endsWith('.md'))
                        return [3 /*break*/, 10];
                    if (runtimeState && (0, types_js_1.shouldIgnorePath)({ runtimeState: runtimeState, filePath: filePath })) {
                        result.skipped += 1;
                        return [3 /*break*/, 10];
                    }
                    projectChannelId = subfolder && isValidDiscordSnowflake({ value: subfolder })
                        ? subfolder
                        : undefined;
                    if (!projectChannelId) return [3 /*break*/, 7];
                    return [4 /*yield*/, resolveChannelName(projectChannelId)];
                case 6:
                    _e = (_h.sent()) || undefined;
                    return [3 /*break*/, 8];
                case 7:
                    _e = undefined;
                    _h.label = 8;
                case 8:
                    project = _e;
                    return [4 /*yield*/, upsertThreadFromFile({
                            discordClient: discordClient,
                            forumChannel: forumChannel,
                            filePath: filePath,
                            runtimeState: runtimeState,
                            subfolder: subfolder,
                            project: project,
                            projectChannelId: projectChannelId,
                        })
                        // Keep syncing other files even if one file has stale/bad metadata
                        // (e.g. threadId that no longer exists). A single bad file should not
                        // block watcher startup for the whole memory directory.
                    ];
                case 9:
                    upsertResult = _h.sent();
                    // Keep syncing other files even if one file has stale/bad metadata
                    // (e.g. threadId that no longer exists). A single bad file should not
                    // block watcher startup for the whole memory directory.
                    if (upsertResult instanceof Error) {
                        forumLogger.warn("Skipping ".concat(filePath, ": ").concat(upsertResult.message));
                        result.skipped += 1;
                        return [3 /*break*/, 10];
                    }
                    if (upsertResult === 'created') {
                        result.created += 1;
                    }
                    else if (upsertResult === 'updated') {
                        result.updated += 1;
                    }
                    else {
                        result.skipped += 1;
                    }
                    _h.label = 10;
                case 10:
                    _i++;
                    return [3 /*break*/, 5];
                case 11:
                    _f = 0, _g = deletedFilePaths || [];
                    _h.label = 12;
                case 12:
                    if (!(_f < _g.length)) return [3 /*break*/, 15];
                    filePath = _g[_f];
                    return [4 /*yield*/, deleteThreadFromFilePath({
                            discordClient: discordClient,
                            forumChannel: forumChannel,
                            filePath: filePath,
                        })];
                case 13:
                    deleteResult = _h.sent();
                    if (deleteResult instanceof Error) {
                        forumLogger.warn("Skipping delete ".concat(filePath, ": ").concat(deleteResult.message));
                        return [3 /*break*/, 14];
                    }
                    result.deleted += 1;
                    _h.label = 14;
                case 14:
                    _f++;
                    return [3 /*break*/, 12];
                case 15: return [2 /*return*/, result];
            }
        });
    });
}
