"use strict";
// Worktree management command: /new-worktree
// Uses OpenCode SDK v2 to create worktrees with kimaki- prefix
// Creates thread immediately, then worktree in background so user can type
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.worktreeCreatingMessage = worktreeCreatingMessage;
exports.slugifyWorktreeName = slugifyWorktreeName;
exports.shortenWorktreeSlug = shortenWorktreeSlug;
exports.formatWorktreeName = formatWorktreeName;
exports.formatAutoWorktreeName = formatAutoWorktreeName;
exports.createWorktreeInBackground = createWorktreeInBackground;
exports.handleNewWorktreeCommand = handleNewWorktreeCommand;
exports.handleNewWorktreeAutocomplete = handleNewWorktreeAutocomplete;
var discord_js_1 = require("discord.js");
var node_fs_1 = require("node:fs");
var database_js_1 = require("../database.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var sentry_js_1 = require("../sentry.js");
var worktrees_js_1 = require("../worktrees.js");
var opencode_js_1 = require("../opencode.js");
var merge_worktree_js_1 = require("./merge-worktree.js");
var errore = require("errore");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.WORKTREE);
var DEFAULT_WORKTREE_BASE_REF = 'HEAD';
function resolveRequestedWorktreeBaseRef(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var projectDirectory = _b.projectDirectory, rawBaseBranch = _b.rawBaseBranch;
        return __generator(this, function (_c) {
            if (!rawBaseBranch) {
                // Default to the current local HEAD so worktrees can branch from
                // unpublished commits in the main checkout.
                return [2 /*return*/, DEFAULT_WORKTREE_BASE_REF];
            }
            return [2 /*return*/, (0, worktrees_js_1.validateBranchRef)({
                    directory: projectDirectory,
                    ref: rawBaseBranch,
                })];
        });
    });
}
/** Status message shown while a worktree is being created. */
function worktreeCreatingMessage(worktreeName) {
    return "\uD83C\uDF33 **Creating worktree: ".concat(worktreeName, "**\n\u23F3 Setting up...");
}
var WorktreeError = /** @class */ (function (_super) {
    __extends(WorktreeError, _super);
    function WorktreeError(message, options) {
        var _this = _super.call(this, message, options) || this;
        _this.name = 'WorktreeError';
        return _this;
    }
    return WorktreeError;
}(Error));
/**
 * Lowercase, collapse whitespace to dashes, drop non-[a-z0-9-] chars.
 * Does NOT add the `opencode/kimaki-` prefix — callers do that so they can
 * optionally compress the slug first for auto-derived names.
 */
function slugifyWorktreeName(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
}
/**
 * Compress a slug by stripping vowels from each dash-separated word, but
 * keeping the first character so the word stays recognizable.
 * Only applied to slugs longer than 20 chars — short names are left alone.
 *
 * "configurable-sidebar-width-by-component" → "cnfgrbl-sdbr-wdth-by-cmpnnt"
 *
 * Used ONLY for auto-derived worktree names (thread name, prompt slug)
 * so long Discord titles don't produce 80-char folder paths that make
 * the agent lazy and reuse the previous worktree. User-provided names
 * via `--worktree <name>` or `/new-worktree name:` are never compressed.
 */
function shortenWorktreeSlug(slug) {
    if (slug.length <= 20) {
        return slug;
    }
    var shortened = slug
        .split('-')
        .map(function (word) {
        if (!word) {
            return word;
        }
        var first = word[0];
        var rest = word.slice(1).replace(/[aeiou]/g, '');
        return first + rest;
    })
        .join('-');
    return shortened || slug;
}
/**
 * Format worktree name: lowercase, spaces to dashes, remove special chars, add opencode/kimaki- prefix.
 * "My Feature" → "opencode/kimaki-my-feature"
 * Returns empty string if no valid name can be extracted.
 *
 * This is the "explicit" path used when the user provides a specific name.
 * The slug is NOT compressed — if you ask for `my-long-explicit-branch-name`
 * you get `opencode/kimaki-my-long-explicit-branch-name` verbatim.
 */
function formatWorktreeName(name) {
    var slug = slugifyWorktreeName(name);
    if (!slug) {
        return '';
    }
    return "opencode/kimaki-".concat(slug);
}
/**
 * Format an auto-derived worktree name (from a Discord thread title or a
 * prompt). Same as formatWorktreeName but compresses slugs longer than 20
 * chars by stripping vowels so the on-disk folder name stays short.
 */
function formatAutoWorktreeName(name) {
    var slug = slugifyWorktreeName(name);
    if (!slug) {
        return '';
    }
    return "opencode/kimaki-".concat(shortenWorktreeSlug(slug));
}
/**
 * Derive worktree name from thread name.
 * Handles existing "⬦ worktree: opencode/kimaki-name" format or uses thread name directly.
 * Uses formatAutoWorktreeName so long thread titles get vowel-compressed.
 */
function deriveWorktreeNameFromThread(threadName) {
    var _a;
    // Handle existing "⬦ worktree: opencode/kimaki-name" format
    var worktreeMatch = threadName.match(/worktree:\s*(.+)$/i);
    var extractedName = (_a = worktreeMatch === null || worktreeMatch === void 0 ? void 0 : worktreeMatch[1]) === null || _a === void 0 ? void 0 : _a.trim();
    if (extractedName) {
        // If already has opencode/kimaki- prefix, return as is
        if (extractedName.startsWith('opencode/kimaki-')) {
            return extractedName;
        }
        return formatAutoWorktreeName(extractedName);
    }
    // Use thread name directly (compressed if > 20 chars)
    return formatAutoWorktreeName(threadName);
}
/**
 * Get project directory from database.
 */
function getProjectDirectoryFromChannel(channel) {
    return __awaiter(this, void 0, void 0, function () {
        var channelConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(channel.id)];
                case 1:
                    channelConfig = _a.sent();
                    if (!channelConfig) {
                        return [2 /*return*/, new WorktreeError('This channel is not configured with a project directory')];
                    }
                    if (!node_fs_1.default.existsSync(channelConfig.directory)) {
                        return [2 /*return*/, new WorktreeError("Directory does not exist: ".concat(channelConfig.directory))];
                    }
                    return [2 /*return*/, channelConfig.directory];
            }
        });
    });
}
/**
 * Create worktree and update the status message when done.
 * Handles the full lifecycle: pending DB entry, git creation, DB ready/error,
 * tree emoji reaction, and editing the status message.
 *
 * starterMessage is optional — if omitted, status edits are skipped (creation
 * still proceeds). This keeps worktree creation independent of Discord message
 * delivery, so a transient send failure never silently skips the worktree.
 *
 * Returns the worktree directory on success, or an Error on failure.
 * Never throws — all internal errors are caught and returned as Error values.
 */
function createWorktreeInBackground(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _this = this;
        var thread = _b.thread, starterMessage = _b.starterMessage, worktreeName = _b.worktreeName, projectDirectory = _b.projectDirectory, baseBranch = _b.baseBranch, rest = _b.rest;
        return __generator(this, function (_c) {
            return [2 /*return*/, errore.tryAsync({
                    try: function () { return __awaiter(_this, void 0, void 0, function () {
                        var editChain, editStatus, worktreeResult, errorMsg;
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    logger.log("Creating worktree \"".concat(worktreeName, "\" for project ").concat(projectDirectory).concat(baseBranch ? " from ".concat(baseBranch) : ''));
                                    return [4 /*yield*/, (0, database_js_1.createPendingWorktree)({
                                            threadId: thread.id,
                                            worktreeName: worktreeName,
                                            projectDirectory: projectDirectory,
                                        })
                                        // Serialize status message edits so onProgress can't overwrite the
                                        // final success/error edit even if Discord's API is slow.
                                    ];
                                case 1:
                                    _a.sent();
                                    editChain = Promise.resolve();
                                    editStatus = function (content) {
                                        editChain = editChain
                                            .then(function () { return __awaiter(_this, void 0, void 0, function () {
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, (starterMessage === null || starterMessage === void 0 ? void 0 : starterMessage.edit(content))];
                                                    case 1:
                                                        _a.sent();
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); })
                                            .catch(function () { });
                                    };
                                    return [4 /*yield*/, (0, worktrees_js_1.createWorktreeWithSubmodules)({
                                            directory: projectDirectory,
                                            name: worktreeName,
                                            baseBranch: baseBranch,
                                            onProgress: function (phase) {
                                                editStatus("\uD83C\uDF33 **Worktree: ".concat(worktreeName, "**\n").concat(phase));
                                            },
                                        })];
                                case 2:
                                    worktreeResult = _a.sent();
                                    if (!(worktreeResult instanceof Error)) return [3 /*break*/, 5];
                                    errorMsg = worktreeResult.message;
                                    logger.error('[WORKTREE] Creation failed:', worktreeResult);
                                    return [4 /*yield*/, (0, database_js_1.setWorktreeError)({ threadId: thread.id, errorMessage: errorMsg })];
                                case 3:
                                    _a.sent();
                                    editStatus("\uD83C\uDF33 **Worktree: ".concat(worktreeName, "**\n\u274C ").concat(errorMsg));
                                    return [4 /*yield*/, editChain];
                                case 4:
                                    _a.sent();
                                    return [2 /*return*/, worktreeResult];
                                case 5: 
                                // Success - update database and edit starter message
                                return [4 /*yield*/, (0, database_js_1.setWorktreeReady)({
                                        threadId: thread.id,
                                        worktreeDirectory: worktreeResult.directory,
                                    })];
                                case 6:
                                    // Success - update database and edit starter message
                                    _a.sent();
                                    return [4 /*yield*/, denyPreviousCheckoutForExistingSession({
                                            threadId: thread.id,
                                            projectDirectory: projectDirectory,
                                        })
                                        // React with tree emoji to mark as worktree thread
                                    ];
                                case 7:
                                    _a.sent();
                                    // React with tree emoji to mark as worktree thread
                                    return [4 /*yield*/, (0, discord_utils_js_1.reactToThread)({
                                            rest: rest,
                                            threadId: thread.id,
                                            channelId: thread.parentId || undefined,
                                            emoji: '🌳',
                                        })];
                                case 8:
                                    // React with tree emoji to mark as worktree thread
                                    _a.sent();
                                    editStatus("\uD83C\uDF33 **Worktree: ".concat(worktreeName, "**\n") +
                                        "\uD83D\uDCC1 `".concat(worktreeResult.directory, "`\n") +
                                        "\uD83C\uDF3F Branch: `".concat(worktreeResult.branch, "`"));
                                    return [4 /*yield*/, editChain];
                                case 9:
                                    _a.sent();
                                    return [2 /*return*/, worktreeResult.directory];
                            }
                        });
                    }); },
                    catch: function (e) {
                        logger.error('[WORKTREE] Unexpected error in createWorktreeInBackground:', e);
                        return new Error("Worktree creation failed: ".concat(e instanceof Error ? e.message : String(e)), { cause: e });
                    },
                })];
        });
    });
}
function denyPreviousCheckoutForExistingSession(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var sessionId, initializeResult, client, updateResult;
        var _this = this;
        var threadId = _b.threadId, projectDirectory = _b.projectDirectory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.getThreadSession)(threadId)];
                case 1:
                    sessionId = _c.sent();
                    if (!sessionId) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 2:
                    initializeResult = _c.sent();
                    if (initializeResult instanceof Error) {
                        logger.warn("[WORKTREE] Failed to initialize OpenCode before denying previous checkout for thread ".concat(threadId, ": ").concat(initializeResult.message));
                        return [2 /*return*/];
                    }
                    client = (0, opencode_js_1.getOpencodeClient)(projectDirectory);
                    if (!client) {
                        logger.warn("[WORKTREE] Missing OpenCode client for previous checkout deny update in thread ".concat(threadId));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, client.session.update({
                                                sessionID: sessionId,
                                                permission: (0, opencode_js_1.buildExternalDirectoryPermissionRules)({
                                                    resolvedPattern: projectDirectory.replaceAll('\\', '/'),
                                                    action: 'deny',
                                                }),
                                            })];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            catch: function (e) {
                                return new Error('Failed to deny previous checkout for existing session', {
                                    cause: e,
                                });
                            },
                        })];
                case 3:
                    updateResult = _c.sent();
                    if (updateResult instanceof Error) {
                        logger.warn("[WORKTREE] Failed to deny previous checkout for existing session in thread ".concat(threadId, ": ").concat(updateResult.message));
                        return [2 /*return*/];
                    }
                    logger.log("[WORKTREE] Denied previous checkout for existing session ".concat(sessionId, " in thread ").concat(threadId));
                    return [2 /*return*/];
            }
        });
    });
}
function findExistingWorktreePath(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var listResult, lines, currentPath, branchRef, _i, lines_1, line;
        var projectDirectory = _b.projectDirectory, worktreeName = _b.worktreeName;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, errore.tryAsync({
                        try: function () {
                            return (0, worktrees_js_1.execAsync)('git worktree list --porcelain', { cwd: projectDirectory });
                        },
                        catch: function (e) { return new WorktreeError('Failed to list worktrees', { cause: e }); },
                    })];
                case 1:
                    listResult = _c.sent();
                    if (errore.isError(listResult)) {
                        return [2 /*return*/, listResult];
                    }
                    lines = listResult.stdout.split('\n');
                    currentPath = '';
                    branchRef = "refs/heads/".concat(worktreeName);
                    for (_i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                        line = lines_1[_i];
                        if (line.startsWith('worktree ')) {
                            currentPath = line.slice('worktree '.length);
                            continue;
                        }
                        if (line.startsWith('branch ') &&
                            line.slice('branch '.length) === branchRef) {
                            return [2 /*return*/, currentPath || undefined];
                        }
                    }
                    return [2 /*return*/, undefined];
            }
        });
    });
}
function handleNewWorktreeCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, rawName, rawBaseBranch, worktreeName, projectDirectory, baseBranch, existingWorktree, result, thread, starterMessage;
        var _this = this;
        var command = _b.command;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, command.deferReply()];
                case 1:
                    _c.sent();
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 3];
                    return [4 /*yield*/, command.editReply('Cannot determine channel')];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
                case 3:
                    if (!(channel.type === discord_js_1.ChannelType.PublicThread ||
                        channel.type === discord_js_1.ChannelType.PrivateThread)) return [3 /*break*/, 5];
                    return [4 /*yield*/, handleWorktreeInThread({
                            command: command,
                            thread: channel,
                        })];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
                case 5:
                    if (!(channel.type !== discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.editReply('This command can only be used in text channels or threads')];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7:
                    rawName = command.options.getString('name');
                    rawBaseBranch = command.options.getString('base-branch') || undefined;
                    if (!!rawName) return [3 /*break*/, 9];
                    return [4 /*yield*/, command.editReply('Name is required when creating a worktree from a text channel. Use `/new-worktree name:my-feature`')];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
                case 9:
                    worktreeName = formatWorktreeName(rawName);
                    if (!!worktreeName) return [3 /*break*/, 11];
                    return [4 /*yield*/, command.editReply('Invalid worktree name. Please use letters, numbers, and spaces.')];
                case 10:
                    _c.sent();
                    return [2 /*return*/];
                case 11: return [4 /*yield*/, getProjectDirectoryFromChannel(channel)];
                case 12:
                    projectDirectory = _c.sent();
                    if (!errore.isError(projectDirectory)) return [3 /*break*/, 14];
                    return [4 /*yield*/, command.editReply(projectDirectory.message)];
                case 13:
                    _c.sent();
                    return [2 /*return*/];
                case 14: return [4 /*yield*/, resolveRequestedWorktreeBaseRef({
                        projectDirectory: projectDirectory,
                        rawBaseBranch: rawBaseBranch,
                    })];
                case 15:
                    baseBranch = _c.sent();
                    if (!(baseBranch instanceof Error)) return [3 /*break*/, 17];
                    return [4 /*yield*/, command.editReply("Invalid base branch: `".concat(rawBaseBranch, "`"))];
                case 16:
                    _c.sent();
                    return [2 /*return*/];
                case 17: return [4 /*yield*/, findExistingWorktreePath({
                        projectDirectory: projectDirectory,
                        worktreeName: worktreeName,
                    })];
                case 18:
                    existingWorktree = _c.sent();
                    if (!errore.isError(existingWorktree)) return [3 /*break*/, 20];
                    return [4 /*yield*/, command.editReply(existingWorktree.message)];
                case 19:
                    _c.sent();
                    return [2 /*return*/];
                case 20:
                    if (!existingWorktree) return [3 /*break*/, 22];
                    return [4 /*yield*/, command.editReply("Worktree `".concat(worktreeName, "` already exists at `").concat(existingWorktree, "`"))];
                case 21:
                    _c.sent();
                    return [2 /*return*/];
                case 22: return [4 /*yield*/, errore.tryAsync({
                        try: function () { return __awaiter(_this, void 0, void 0, function () {
                            var starterMessage, thread;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, channel.send({
                                            content: worktreeCreatingMessage(worktreeName),
                                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                        })];
                                    case 1:
                                        starterMessage = _a.sent();
                                        return [4 /*yield*/, starterMessage.startThread({
                                                name: "".concat(merge_worktree_js_1.WORKTREE_PREFIX, "worktree: ").concat(worktreeName),
                                                autoArchiveDuration: 1440,
                                                reason: 'Worktree session',
                                            })
                                            // Add user to thread so it appears in their sidebar
                                        ];
                                    case 2:
                                        thread = _a.sent();
                                        // Add user to thread so it appears in their sidebar
                                        return [4 /*yield*/, thread.members.add(command.user.id)];
                                    case 3:
                                        // Add user to thread so it appears in their sidebar
                                        _a.sent();
                                        return [2 /*return*/, { thread: thread, starterMessage: starterMessage }];
                                }
                            });
                        }); },
                        catch: function (e) { return new WorktreeError('Failed to create thread', { cause: e }); },
                    })];
                case 23:
                    result = _c.sent();
                    if (!errore.isError(result)) return [3 /*break*/, 25];
                    logger.error('[NEW-WORKTREE] Error:', result.cause);
                    return [4 /*yield*/, command.editReply(result.message)];
                case 24:
                    _c.sent();
                    return [2 /*return*/];
                case 25:
                    thread = result.thread, starterMessage = result.starterMessage;
                    return [4 /*yield*/, command.editReply("Creating worktree in ".concat(thread.toString()))
                        // Create worktree in background (don't await)
                    ];
                case 26:
                    _c.sent();
                    // Create worktree in background (don't await)
                    createWorktreeInBackground({
                        thread: thread,
                        starterMessage: starterMessage,
                        worktreeName: worktreeName,
                        projectDirectory: projectDirectory,
                        baseBranch: baseBranch,
                        rest: command.client.rest,
                    }).catch(function (e) {
                        logger.error('[NEW-WORKTREE] Background error:', e);
                        void (0, sentry_js_1.notifyError)(e, 'Background worktree creation failed');
                    });
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle /new-worktree when called inside an existing thread.
 * Attaches a worktree to the current thread, using thread name if no name provided.
 */
function handleWorktreeInThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var rawName, rawBaseBranch, worktreeName, parent, projectDirectory, baseBranch, existingWorktreePath, statusMessage;
        var command = _b.command, thread = _b.thread;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.getThreadWorktree)(thread.id)];
                case 1:
                    if (!_c.sent()) return [3 /*break*/, 3];
                    return [4 /*yield*/, command.editReply('This thread already has a worktree attached.')];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
                case 3:
                    rawName = command.options.getString('name');
                    rawBaseBranch = command.options.getString('base-branch') || undefined;
                    worktreeName = rawName
                        ? formatWorktreeName(rawName)
                        : deriveWorktreeNameFromThread(thread.name);
                    if (!!worktreeName) return [3 /*break*/, 5];
                    return [4 /*yield*/, command.editReply('Invalid worktree name. Please provide a name or rename the thread.')];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
                case 5:
                    parent = thread.parent;
                    if (!(!parent || parent.type !== discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.editReply('Cannot determine parent channel')];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7: return [4 /*yield*/, getProjectDirectoryFromChannel(parent)];
                case 8:
                    projectDirectory = _c.sent();
                    if (!errore.isError(projectDirectory)) return [3 /*break*/, 10];
                    return [4 /*yield*/, command.editReply(projectDirectory.message)];
                case 9:
                    _c.sent();
                    return [2 /*return*/];
                case 10: return [4 /*yield*/, resolveRequestedWorktreeBaseRef({
                        projectDirectory: projectDirectory,
                        rawBaseBranch: rawBaseBranch,
                    })];
                case 11:
                    baseBranch = _c.sent();
                    if (!(baseBranch instanceof Error)) return [3 /*break*/, 13];
                    return [4 /*yield*/, command.editReply("Invalid base branch: `".concat(rawBaseBranch, "`"))];
                case 12:
                    _c.sent();
                    return [2 /*return*/];
                case 13: return [4 /*yield*/, findExistingWorktreePath({
                        projectDirectory: projectDirectory,
                        worktreeName: worktreeName,
                    })];
                case 14:
                    existingWorktreePath = _c.sent();
                    if (!errore.isError(existingWorktreePath)) return [3 /*break*/, 16];
                    return [4 /*yield*/, command.editReply(existingWorktreePath.message)];
                case 15:
                    _c.sent();
                    return [2 /*return*/];
                case 16:
                    if (!existingWorktreePath) return [3 /*break*/, 18];
                    return [4 /*yield*/, command.editReply("Worktree `".concat(worktreeName, "` already exists at `").concat(existingWorktreePath, "`"))];
                case 17:
                    _c.sent();
                    return [2 /*return*/];
                case 18: return [4 /*yield*/, thread.send({
                        content: worktreeCreatingMessage(worktreeName),
                        flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                    })];
                case 19:
                    statusMessage = _c.sent();
                    return [4 /*yield*/, command.editReply("Creating worktree `".concat(worktreeName, "` for this thread..."))];
                case 20:
                    _c.sent();
                    createWorktreeInBackground({
                        thread: thread,
                        starterMessage: statusMessage,
                        worktreeName: worktreeName,
                        projectDirectory: projectDirectory,
                        baseBranch: baseBranch,
                        rest: command.client.rest,
                    }).catch(function (e) {
                        logger.error('[NEW-WORKTREE] Background error:', e);
                        void (0, sentry_js_1.notifyError)(e, 'Background worktree creation failed (in-thread)');
                    });
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Autocomplete handler for /new-worktree base-branch option.
 * Lists local + remote branches sorted by most recent commit date.
 */
function handleNewWorktreeAutocomplete(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var focusedValue, projectDirectory, branches, e_1;
        var interaction = _b.interaction;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 6, , 8]);
                    focusedValue = interaction.options.getFocused();
                    return [4 /*yield*/, (0, discord_utils_js_1.resolveProjectDirectoryFromAutocomplete)(interaction)];
                case 1:
                    projectDirectory = _c.sent();
                    if (!!projectDirectory) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.respond([])];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
                case 3: return [4 /*yield*/, (0, worktrees_js_1.listBranchesByLastCommit)({
                        directory: projectDirectory,
                        query: focusedValue,
                    })];
                case 4:
                    branches = _c.sent();
                    return [4 /*yield*/, interaction.respond(branches.map(function (name) {
                            return { name: name, value: name };
                        }))];
                case 5:
                    _c.sent();
                    return [3 /*break*/, 8];
                case 6:
                    e_1 = _c.sent();
                    logger.error('[NEW-WORKTREE] Autocomplete error:', e_1);
                    return [4 /*yield*/, interaction.respond([]).catch(function () { })];
                case 7:
                    _c.sent();
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
