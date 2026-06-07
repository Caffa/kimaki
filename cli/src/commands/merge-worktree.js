"use strict";
// /merge-worktree command - Merge worktree commits into default branch.
// Pipeline: rebase worktree commits onto target -> local fast-forward push.
// Preserves all commits (no squash). On rebase conflicts, asks the AI model
// in the thread to resolve them.
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
exports.WORKTREE_PREFIX = void 0;
exports.handleMergeWorktreeCommand = handleMergeWorktreeCommand;
exports.handleMergeWorktreeAutocomplete = handleMergeWorktreeAutocomplete;
var database_js_1 = require("../database.js");
var logger_js_1 = require("../logger.js");
var worktrees_js_1 = require("../worktrees.js");
var discord_utils_js_1 = require("../discord-utils.js");
var thread_session_runtime_js_1 = require("../session-handler/thread-session-runtime.js");
var errors_js_1 = require("../errors.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.WORKTREE);
/** Worktree thread title prefix - indicates unmerged worktree */
exports.WORKTREE_PREFIX = '⬦ ';
function removeWorktreePrefixFromTitle(thread) {
    return __awaiter(this, void 0, void 0, function () {
        var newName, timeoutMs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!thread.name.startsWith(exports.WORKTREE_PREFIX)) {
                        return [2 /*return*/];
                    }
                    newName = thread.name.slice(exports.WORKTREE_PREFIX.length);
                    timeoutMs = 5000;
                    return [4 /*yield*/, Promise.race([
                            thread.setName(newName).catch(function (e) {
                                logger.warn("Failed to update thread title: ".concat(e instanceof Error ? e.message : String(e)));
                            }),
                            new Promise(function (resolve) {
                                setTimeout(function () {
                                    logger.warn("Thread title update timed out after ".concat(timeoutMs, "ms"));
                                    resolve();
                                }, timeoutMs);
                            }),
                        ])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Send a prompt to the AI model in the thread.
 * If a session is actively streaming, queues it. Otherwise sends directly.
 * Routes through ThreadSessionRuntime.
 */
function sendPromptToModel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var resolved, runtime;
        var prompt = _b.prompt, thread = _b.thread, projectDirectory = _b.projectDirectory, command = _b.command, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({ channel: thread })
                    // Merge prompts use opencode queue mode.
                ];
                case 1:
                    resolved = _c.sent();
                    runtime = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                        threadId: thread.id,
                        thread: thread,
                        projectDirectory: (resolved === null || resolved === void 0 ? void 0 : resolved.projectDirectory) || projectDirectory,
                        sdkDirectory: (resolved === null || resolved === void 0 ? void 0 : resolved.workingDirectory) || projectDirectory,
                        channelId: thread.parentId || thread.id,
                        appId: appId,
                    });
                    return [4 /*yield*/, runtime.enqueueIncoming({
                            prompt: prompt,
                            userId: command.user.id,
                            username: command.user.displayName,
                            appId: appId,
                            mode: 'opencode',
                        })];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleMergeWorktreeCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, thread, worktreeInfo, rawTargetBranch, targetBranch, validated, result;
        var command = _b.command, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, command.deferReply()];
                case 1:
                    _c.sent();
                    channel = command.channel;
                    if (!(!channel || !channel.isThread())) return [3 /*break*/, 3];
                    return [4 /*yield*/, command.editReply('This command can only be used in a thread')];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
                case 3:
                    thread = channel;
                    return [4 /*yield*/, (0, database_js_1.getThreadWorktree)(thread.id)];
                case 4:
                    worktreeInfo = _c.sent();
                    if (!!worktreeInfo) return [3 /*break*/, 6];
                    return [4 /*yield*/, command.editReply('This thread is not associated with a worktree')];
                case 5:
                    _c.sent();
                    return [2 /*return*/];
                case 6:
                    if (!(worktreeInfo.status !== 'ready' || !worktreeInfo.worktree_directory)) return [3 /*break*/, 8];
                    return [4 /*yield*/, command.editReply("Worktree is not ready (status: ".concat(worktreeInfo.status, ")").concat(worktreeInfo.error_message ? ": ".concat(worktreeInfo.error_message) : ''))];
                case 7:
                    _c.sent();
                    return [2 /*return*/];
                case 8:
                    rawTargetBranch = command.options.getString('target-branch') || undefined;
                    targetBranch = rawTargetBranch;
                    if (!targetBranch) return [3 /*break*/, 12];
                    return [4 /*yield*/, (0, worktrees_js_1.validateBranchRef)({
                            directory: worktreeInfo.project_directory,
                            ref: targetBranch,
                        })];
                case 9:
                    validated = _c.sent();
                    if (!(validated instanceof Error)) return [3 /*break*/, 11];
                    return [4 /*yield*/, command.editReply("Invalid target branch: `".concat(targetBranch, "`"))];
                case 10:
                    _c.sent();
                    return [2 /*return*/];
                case 11:
                    targetBranch = validated;
                    _c.label = 12;
                case 12: return [4 /*yield*/, (0, worktrees_js_1.mergeWorktree)({
                        worktreeDir: worktreeInfo.worktree_directory,
                        mainRepoDir: worktreeInfo.project_directory,
                        worktreeName: worktreeInfo.worktree_name,
                        targetBranch: targetBranch,
                        onProgress: function (msg) {
                            logger.log("[merge] ".concat(msg));
                        },
                    })];
                case 13:
                    result = _c.sent();
                    if (!(result instanceof Error)) return [3 /*break*/, 22];
                    if (!(result instanceof errors_js_1.DirtyWorktreeError)) return [3 /*break*/, 15];
                    return [4 /*yield*/, command.editReply('Merge failed: uncommitted changes in the worktree. Commit changes first, then run `/merge-worktree` again.')];
                case 14:
                    _c.sent();
                    return [2 /*return*/];
                case 15:
                    if (!(result instanceof errors_js_1.TargetDirtyWorktreeError)) return [3 /*break*/, 17];
                    return [4 /*yield*/, command.editReply('Merge failed: uncommitted changes in main. Commit changes in the main worktree first, then run `/merge-worktree` again.')];
                case 16:
                    _c.sent();
                    return [2 /*return*/];
                case 17:
                    if (!(result instanceof errors_js_1.RebaseConflictError)) return [3 /*break*/, 20];
                    return [4 /*yield*/, command.editReply('Rebase conflict detected. Asking the model to resolve...')];
                case 18:
                    _c.sent();
                    return [4 /*yield*/, sendPromptToModel({
                            prompt: [
                                "A rebase conflict occurred while merging this worktree into `".concat(result.target, "`."),
                                'Rebasing multiple commits can pause on each commit that conflicts, so you may need to repeat the resolve/continue loop several times.',
                                'Before editing anything, first understand both sides so you preserve both intentions and do not drop features or fixes.',
                                '1. Check `git status` to see which files have conflicts and confirm the rebase is paused',
                                "2. Find the merge base between this worktree and `".concat(result.target, "`, then read the commit messages from both sides since that merge base so you understand the goal of each change"),
                                "3. Read the diffs from that merge base to both sides so you understand exactly what changed on this branch and on `".concat(result.target, "` before resolving conflicts"),
                                '4. Read the commit currently being replayed in the rebase so you know the intent of the specific conflicting patch',
                                '5. Edit the conflicted files to preserve both intended changes where possible instead of choosing one side wholesale',
                                '6. Stage resolved files with `git add`',
                                '7. Continue the rebase with `git rebase --continue`',
                                '8. If git reports more conflicts, repeat steps 1-7 until the rebase finishes (no more rebase in progress, `git status` is clean)',
                                '9. Once the rebase is fully complete, tell me so I can run `/merge-worktree` again',
                            ].join('\n'),
                            thread: thread,
                            projectDirectory: worktreeInfo.project_directory,
                            command: command,
                            appId: appId,
                        })];
                case 19:
                    _c.sent();
                    return [2 /*return*/];
                case 20: return [4 /*yield*/, command.editReply("Merge failed: ".concat(result.message))];
                case 21:
                    _c.sent();
                    return [2 /*return*/];
                case 22:
                    void removeWorktreePrefixFromTitle(thread);
                    return [4 /*yield*/, command.editReply("Merged `".concat(result.branchName, "` into `").concat(result.defaultBranch, "` @ ").concat(result.shortSha, " (").concat(result.commitCount, " commit").concat(result.commitCount === 1 ? '' : 's', ")\nWorktree now at detached HEAD."))];
                case 23:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Autocomplete handler for /merge-worktree target-branch option.
 * Lists local branches only (no remotes) sorted by most recent commit date.
 * Resolves directory from the thread's worktree info or parent channel.
 */
function handleMergeWorktreeAutocomplete(_a) {
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
                        includeRemote: false,
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
                    logger.error('[MERGE-WORKTREE] Autocomplete error:', e_1);
                    return [4 /*yield*/, interaction.respond([]).catch(function () { })];
                case 7:
                    _c.sent();
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
