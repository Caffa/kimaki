"use strict";
// Discord API operations for forum sync.
// Resolves forum channels, fetches threads (active + archived) with pagination,
// fetches thread messages, loads existing forum files from disk, and ensures directories.
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
exports.getCanonicalThreadFilePath = getCanonicalThreadFilePath;
exports.ensureDirectory = ensureDirectory;
exports.resolveForumChannel = resolveForumChannel;
exports.fetchForumThreads = fetchForumThreads;
exports.fetchThreadMessages = fetchThreadMessages;
exports.loadExistingForumFiles = loadExistingForumFiles;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var discord_js_1 = require("discord.js");
var logger_js_1 = require("../logger.js");
var markdown_js_1 = require("./markdown.js");
var types_js_1 = require("./types.js");
var forumLogger = (0, logger_js_1.createLogger)('FORUM');
function isTruthy(value) {
    return value !== null && value !== undefined;
}
function getCanonicalThreadFilePath(_a) {
    var outputDir = _a.outputDir, threadId = _a.threadId, subfolder = _a.subfolder;
    if (subfolder) {
        return node_path_1.default.join(outputDir, subfolder, "".concat(threadId, ".md"));
    }
    return node_path_1.default.join(outputDir, "".concat(threadId, ".md"));
}
function ensureDirectory(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var result;
        var directory = _b.directory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, node_fs_1.default.promises.mkdir(directory, { recursive: true }).catch(function (cause) {
                        return new types_js_1.ForumSyncOperationError({
                            forumChannelId: 'unknown',
                            reason: directory,
                            cause: cause,
                        });
                    })];
                case 1:
                    result = _c.sent();
                    if (result instanceof Error)
                        return [2 /*return*/, result];
                    return [2 /*return*/];
            }
        });
    });
}
function resolveForumChannel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel;
        var discordClient = _b.discordClient, forumChannelId = _b.forumChannelId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, discordClient.channels
                        .fetch(forumChannelId)
                        .catch(function (cause) { return new types_js_1.ForumChannelResolveError({ forumChannelId: forumChannelId, cause: cause }); })];
                case 1:
                    channel = _c.sent();
                    if (channel instanceof Error)
                        return [2 /*return*/, channel];
                    if (!channel || channel.type !== discord_js_1.ChannelType.GuildForum) {
                        return [2 /*return*/, new types_js_1.ForumChannelResolveError({ forumChannelId: forumChannelId })];
                    }
                    return [2 /*return*/, channel];
            }
        });
    });
}
function fetchForumThreads(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var byId, active, _i, _c, _d, id, thread, before, archived, threads, _e, threads_1, thread, timestamps, oldestTimestamp;
        var forumChannel = _b.forumChannel;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    byId = new Map();
                    return [4 /*yield*/, forumChannel.threads.fetchActive().catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: 'fetchActive failed',
                                cause: cause,
                            });
                        })];
                case 1:
                    active = _f.sent();
                    if (active instanceof Error)
                        return [2 /*return*/, active];
                    for (_i = 0, _c = active.threads; _i < _c.length; _i++) {
                        _d = _c[_i], id = _d[0], thread = _d[1];
                        byId.set(id, thread);
                    }
                    _f.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 5];
                    return [4 /*yield*/, forumChannel.threads
                            .fetchArchived({ type: 'public', limit: 100, before: before })
                            .catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: forumChannel.id,
                                reason: 'fetchArchived failed',
                                cause: cause,
                            });
                        })];
                case 3:
                    archived = _f.sent();
                    if (archived instanceof Error)
                        return [2 /*return*/, archived];
                    threads = Array.from(archived.threads.values());
                    for (_e = 0, threads_1 = threads; _e < threads_1.length; _e++) {
                        thread = threads_1[_e];
                        byId.set(thread.id, thread);
                    }
                    if (!archived.hasMore || threads.length === 0)
                        return [3 /*break*/, 5];
                    timestamps = threads
                        .map(function (thread) { var _a; return (_a = thread.archiveTimestamp) !== null && _a !== void 0 ? _a : thread.createdTimestamp; })
                        .filter(isTruthy);
                    oldestTimestamp = Math.min.apply(Math, timestamps);
                    if (!Number.isFinite(oldestTimestamp))
                        return [3 /*break*/, 5];
                    before = new Date(oldestTimestamp - 1);
                    return [4 /*yield*/, (0, types_js_1.delay)({ ms: types_js_1.DEFAULT_RATE_LIMIT_DELAY_MS })];
                case 4:
                    _f.sent();
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, Array.from(byId.values())];
            }
        });
    });
}
function fetchThreadMessages(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var byId, before, fetched, messages, _i, messages_1, message, oldest;
        var thread = _b.thread;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    byId = new Map();
                    _c.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 4];
                    return [4 /*yield*/, thread.messages.fetch({ limit: 100, before: before }).catch(function (cause) {
                            return new types_js_1.ForumSyncOperationError({
                                forumChannelId: thread.parentId || 'unknown',
                                reason: "message fetch failed for thread ".concat(thread.id),
                                cause: cause,
                            });
                        })];
                case 2:
                    fetched = _c.sent();
                    if (fetched instanceof Error)
                        return [2 /*return*/, fetched];
                    messages = Array.from(fetched.values());
                    for (_i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
                        message = messages_1[_i];
                        byId.set(message.id, message);
                    }
                    if (messages.length < 100 || messages.length === 0)
                        return [3 /*break*/, 4];
                    oldest = messages[messages.length - 1];
                    if (!oldest)
                        return [3 /*break*/, 4];
                    before = oldest.id;
                    return [4 /*yield*/, (0, types_js_1.delay)({ ms: types_js_1.DEFAULT_RATE_LIMIT_DELAY_MS })];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, Array.from(byId.values()).sort(function (a, b) { return a.createdTimestamp - b.createdTimestamp; })];
            }
        });
    });
}
/**
 * Recursively walks a directory collecting all .md files with their relative subfolder path.
 */
function collectMarkdownFiles(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var entries, relativeSub, subfolder, mdFiles, subdirs, nestedResults;
        var dir = _b.dir, outputDir = _b.outputDir;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!node_fs_1.default.existsSync(dir))
                        return [2 /*return*/, []];
                    return [4 /*yield*/, node_fs_1.default.promises.readdir(dir, { withFileTypes: true })];
                case 1:
                    entries = _c.sent();
                    relativeSub = node_path_1.default.relative(outputDir, dir);
                    subfolder = relativeSub && relativeSub !== '.' ? relativeSub : undefined;
                    mdFiles = entries
                        .filter(function (entry) { return entry.isFile() && entry.name.endsWith('.md'); })
                        .map(function (entry) { return ({ filePath: node_path_1.default.join(dir, entry.name), subfolder: subfolder }); });
                    subdirs = entries.filter(function (entry) { return entry.isDirectory(); });
                    return [4 /*yield*/, Promise.all(subdirs.map(function (subdir) {
                            return collectMarkdownFiles({
                                dir: node_path_1.default.join(dir, subdir.name),
                                outputDir: outputDir,
                            });
                        }))];
                case 2:
                    nestedResults = _c.sent();
                    return [2 /*return*/, __spreadArray(__spreadArray([], mdFiles, true), nestedResults.flat(), true)];
            }
        });
    });
}
function loadExistingForumFiles(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var markdownEntries, loaded;
        var _this = this;
        var outputDir = _b.outputDir;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, collectMarkdownFiles({
                        dir: outputDir,
                        outputDir: outputDir,
                    })];
                case 1:
                    markdownEntries = _c.sent();
                    return [4 /*yield*/, Promise.all(markdownEntries.map(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                            var content, parsed, threadIdFromFrontmatter, threadIdFromFilename, threadId, result;
                            var filePath = _b.filePath, subfolder = _b.subfolder;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0: return [4 /*yield*/, node_fs_1.default.promises
                                            .readFile(filePath, 'utf8')
                                            .catch(function (cause) {
                                            forumLogger.warn("Failed to read forum file ".concat(filePath, ":"), cause);
                                            return null;
                                        })];
                                    case 1:
                                        content = _c.sent();
                                        if (content === null)
                                            return [2 /*return*/, null];
                                        parsed = (0, markdown_js_1.parseFrontmatter)({ markdown: content });
                                        threadIdFromFrontmatter = (0, markdown_js_1.getStringValue)({
                                            value: parsed.frontmatter.threadId,
                                        });
                                        threadIdFromFilename = node_path_1.default.basename(filePath, '.md');
                                        threadId = threadIdFromFrontmatter ||
                                            (/^\d+$/.test(threadIdFromFilename) ? threadIdFromFilename : '');
                                        if (!threadId)
                                            return [2 /*return*/, null];
                                        result = {
                                            filePath: filePath,
                                            threadId: threadId,
                                            frontmatter: parsed.frontmatter,
                                            subfolder: subfolder,
                                        };
                                        return [2 /*return*/, result];
                                }
                            });
                        }); }))];
                case 2:
                    loaded = _c.sent();
                    return [2 /*return*/, loaded.filter(isTruthy)];
            }
        });
    });
}
