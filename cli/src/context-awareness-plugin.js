"use strict";
// OpenCode plugin that injects synthetic message parts for context awareness:
// - Git branch / detached HEAD changes
// - Working directory (pwd) changes (e.g. after /new-worktree mid-session)
// - MEMORY.md reminder after a large assistant reply
// - Onboarding tutorial instructions (when TUTORIAL_WELCOME_TEXT detected)
//
// Synthetic parts are hidden from the TUI but sent to the model, keeping it
// aware of context changes without cluttering the UI.
//
// State design: all per-session mutable state is encapsulated in a single
// SessionState object per session ID. One Map, one delete() on cleanup.
// Decision logic is extracted into pure functions that take state + input
// and return whether to inject — making them testable without mocking.
//
// Exported from kimaki-opencode-plugin.ts — each export is treated as a separate
// plugin by OpenCode's plugin loader.
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
exports.contextAwarenessPlugin = void 0;
exports.shouldInjectBranch = shouldInjectBranch;
exports.shouldInjectPwd = shouldInjectPwd;
exports.shouldInjectMemoryReminderFromLatestAssistant = shouldInjectMemoryReminderFromLatestAssistant;
exports.shouldInjectTutorial = shouldInjectTutorial;
var node_crypto_1 = require("node:crypto");
var errore = require("errore");
var plugin_logger_js_1 = require("./plugin-logger.js");
var config_js_1 = require("./config.js");
var sentry_js_1 = require("./sentry.js");
var exec_async_js_1 = require("./exec-async.js");
var onboarding_tutorial_js_1 = require("./onboarding-tutorial.js");
var logger = (0, plugin_logger_js_1.createPluginLogger)('OPENCODE');
// ── Pure derivation functions ────────────────────────────────────
// These take state + fresh input and return whether to inject.
// No side effects, no mutations — easy to test with fixtures.
function shouldInjectBranch(_a) {
    var previousGitState = _a.previousGitState, currentGitState = _a.currentGitState;
    if (!currentGitState) {
        return { inject: false };
    }
    if (previousGitState && previousGitState.key === currentGitState.key) {
        return { inject: false };
    }
    // Trailing newline so this synthetic part does not fuse with the next text
    // part when the model concatenates message parts.
    var base = currentGitState.warning || "\n[current git branch is ".concat(currentGitState.label, "]");
    return { inject: true, text: "".concat(base, "\n") };
}
function shouldInjectPwd(_a) {
    var currentDir = _a.currentDir, previousDir = _a.previousDir, announcedDir = _a.announcedDir;
    if (announcedDir === currentDir) {
        return { inject: false };
    }
    var priorDirectory = announcedDir || previousDir;
    if (!priorDirectory || priorDirectory === currentDir) {
        return { inject: false };
    }
    return {
        inject: true,
        // Trailing newline so this synthetic part does not fuse with the next text
        // part when the model concatenates message parts.
        text: "\n[working directory changed (cwd / pwd has changed). " +
            "The user expects you to edit files in the new cwd. " +
            "Previous folder (DO NOT TOUCH): ".concat(priorDirectory, ". ") +
            "New folder (new cwd / pwd, edit files here): ".concat(currentDir, ". ") +
            "You MUST read, write, and edit files only under the new folder ".concat(currentDir, ". ") +
            "You MUST NOT read, write, or edit any files under the previous folder ".concat(priorDirectory, " \u2014 ") +
            "that folder is a separate checkout and the user or another agent may be actively working there, " +
            "so writing to it would override their unrelated changes.]\n",
    };
}
var MEMORY_REMINDER_OUTPUT_TOKENS = 12000;
function shouldInjectMemoryReminderFromLatestAssistant(_a) {
    var _b;
    var lastMemoryReminderAssistantMessageId = _a.lastMemoryReminderAssistantMessageId, latestAssistantMessage = _a.latestAssistantMessage, _c = _a.threshold, threshold = _c === void 0 ? MEMORY_REMINDER_OUTPUT_TOKENS : _c;
    if (!latestAssistantMessage) {
        return { inject: false };
    }
    if (latestAssistantMessage.role !== 'assistant') {
        return { inject: false };
    }
    if (typeof ((_b = latestAssistantMessage.time) === null || _b === void 0 ? void 0 : _b.completed) !== 'number') {
        return { inject: false };
    }
    if (!latestAssistantMessage.tokens) {
        return { inject: false };
    }
    if (lastMemoryReminderAssistantMessageId === latestAssistantMessage.id) {
        return { inject: false };
    }
    var outputTokens = Math.max(0, latestAssistantMessage.tokens.output + latestAssistantMessage.tokens.reasoning);
    if (outputTokens < threshold) {
        return { inject: false };
    }
    return { inject: true, assistantMessageId: latestAssistantMessage.id };
}
function shouldInjectTutorial(_a) {
    var alreadyInjected = _a.alreadyInjected, parts = _a.parts;
    if (alreadyInjected) {
        return false;
    }
    return parts.some(function (part) {
        var _a;
        return part.type === 'text' && ((_a = part.text) === null || _a === void 0 ? void 0 : _a.includes(onboarding_tutorial_js_1.TUTORIAL_WELCOME_TEXT));
    });
}
// ── Impure helpers (I/O) ─────────────────────────────────────────
function resolveGitState(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var branchResult, branch, shaResult, shortSha, superprojectResult, superproject;
        var directory = _b.directory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, errore.tryAsync(function () {
                        return (0, exec_async_js_1.execAsync)('git symbolic-ref --short HEAD', { cwd: directory });
                    })];
                case 1:
                    branchResult = _c.sent();
                    if (!(branchResult instanceof Error)) {
                        branch = branchResult.stdout.trim();
                        if (branch) {
                            return [2 /*return*/, {
                                    key: "branch:".concat(branch),
                                    kind: 'branch',
                                    label: branch,
                                    warning: null,
                                }];
                        }
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return (0, exec_async_js_1.execAsync)('git rev-parse --short HEAD', { cwd: directory });
                        })];
                case 2:
                    shaResult = _c.sent();
                    if (shaResult instanceof Error) {
                        return [2 /*return*/, null];
                    }
                    shortSha = shaResult.stdout.trim();
                    if (!shortSha) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return (0, exec_async_js_1.execAsync)('git rev-parse --show-superproject-working-tree', {
                                cwd: directory,
                            });
                        })];
                case 3:
                    superprojectResult = _c.sent();
                    superproject = superprojectResult instanceof Error ? '' : superprojectResult.stdout.trim();
                    if (superproject) {
                        return [2 /*return*/, {
                                key: "detached-submodule:".concat(shortSha),
                                kind: 'detached-submodule',
                                label: "detached submodule @ ".concat(shortSha),
                                warning: "\n[warning: submodule is in detached HEAD at ".concat(shortSha, ". ") +
                                    'create or switch to a branch before committing.]',
                            }];
                    }
                    return [2 /*return*/, {
                            key: "detached-head:".concat(shortSha),
                            kind: 'detached-head',
                            label: "detached HEAD @ ".concat(shortSha),
                            warning: "\n[warning: repository is in detached HEAD at ".concat(shortSha, ". ") +
                                'create or switch to a branch before committing.]',
                        }];
            }
        });
    });
}
// Resolve the last observed session directory via the SDK.
// Refreshed on every real user message because sessions can switch directories
// mid-thread and the pwd reminder must compare old vs new accurately.
function resolveSessionDirectory(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var previousDirectory, result;
        var _c;
        var client = _b.client, sessionID = _b.sessionID, state = _b.state;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    previousDirectory = state.resolvedDirectory;
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return client.session.get({ path: { id: sessionID } });
                        })];
                case 1:
                    result = _d.sent();
                    if (result instanceof Error || !((_c = result.data) === null || _c === void 0 ? void 0 : _c.directory)) {
                        return [2 /*return*/, {
                                currentDirectory: previousDirectory || null,
                                previousDirectory: previousDirectory,
                            }];
                    }
                    state.resolvedDirectory = result.data.directory;
                    return [2 /*return*/, {
                            currentDirectory: result.data.directory,
                            previousDirectory: previousDirectory,
                        }];
            }
        });
    });
}
// ── Plugin ───────────────────────────────────────────────────────
var contextAwarenessPlugin = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    function getOrCreateSession(sessionID) {
        var existing = sessions.get(sessionID);
        if (existing) {
            return existing;
        }
        var state = {
            gitState: undefined,
            lastMemoryReminderAssistantMessageId: undefined,
            tutorialInjected: false,
            resolvedDirectory: undefined,
            announcedDirectory: undefined,
        };
        sessions.set(sessionID, state);
        return state;
    }
    var dataDir, sessions;
    var directory = _b.directory, client = _b.client;
    return __generator(this, function (_c) {
        (0, sentry_js_1.initSentry)();
        dataDir = process.env.KIMAKI_DATA_DIR;
        if (dataDir) {
            (0, config_js_1.setDataDir)(dataDir);
            (0, plugin_logger_js_1.setPluginLogFilePath)(dataDir);
        }
        sessions = new Map();
        return [2 /*return*/, {
                'chat.message': function (input, output) { return __awaiter(void 0, void 0, void 0, function () {
                    var hookResult;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, errore.tryAsync({
                                    try: function () { return __awaiter(void 0, void 0, void 0, function () {
                                        var sessionID, state, firstTextPart, first, messageID, latestAssistantMessageResult, latestAssistantMessage, sessionDirectory, effectiveDirectory, gitState, pwdResult, memoryReminder, branchResult;
                                        var _a;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0:
                                                    sessionID = input.sessionID;
                                                    state = getOrCreateSession(sessionID);
                                                    firstTextPart = output.parts.find(function (part) {
                                                        return part.type === 'text';
                                                    });
                                                    if (firstTextPart && shouldInjectTutorial({ alreadyInjected: state.tutorialInjected, parts: output.parts })) {
                                                        state.tutorialInjected = true;
                                                        output.parts.push({
                                                            id: "prt_".concat(node_crypto_1.default.randomUUID()),
                                                            sessionID: sessionID,
                                                            messageID: firstTextPart.messageID,
                                                            type: 'text',
                                                            text: "<system-reminder>\n".concat(onboarding_tutorial_js_1.ONBOARDING_TUTORIAL_INSTRUCTIONS, "\n</system-reminder>\n"),
                                                            synthetic: true,
                                                        });
                                                    }
                                                    first = output.parts.find(function (part) {
                                                        if (part.type !== 'text') {
                                                            return true;
                                                        }
                                                        return part.synthetic !== true;
                                                    });
                                                    if (!first || first.type !== 'text' || first.text.trim().length === 0) {
                                                        return [2 /*return*/];
                                                    }
                                                    messageID = first.messageID;
                                                    return [4 /*yield*/, errore.tryAsync(function () {
                                                            return client.session.messages({
                                                                path: { id: sessionID },
                                                                query: { directory: directory, limit: 20 },
                                                            });
                                                        })];
                                                case 1:
                                                    latestAssistantMessageResult = _b.sent();
                                                    latestAssistantMessage = latestAssistantMessageResult instanceof Error
                                                        ? undefined
                                                        : (_a = __spreadArray([], (latestAssistantMessageResult.data || []), true).reverse()
                                                            .find(function (entry) {
                                                            return entry.info.role === 'assistant';
                                                        })) === null || _a === void 0 ? void 0 : _a.info;
                                                    return [4 /*yield*/, resolveSessionDirectory({
                                                            client: client,
                                                            sessionID: sessionID,
                                                            state: state,
                                                        })
                                                        // The plugin request directory is the current directory Kimaki asked
                                                        // OpenCode to operate on for this message. Prefer it over session.get()
                                                        // when they disagree so reminders and MEMORY/branch context follow the
                                                        // new worktree immediately after a folder switch.
                                                    ];
                                                case 2:
                                                    sessionDirectory = _b.sent();
                                                    effectiveDirectory = directory;
                                                    return [4 /*yield*/, resolveGitState({ directory: effectiveDirectory })
                                                        // -- Working directory change detection --
                                                    ];
                                                case 3:
                                                    gitState = _b.sent();
                                                    pwdResult = shouldInjectPwd({
                                                        currentDir: effectiveDirectory,
                                                        previousDir: sessionDirectory.previousDirectory ||
                                                            (sessionDirectory.currentDirectory !== effectiveDirectory
                                                                ? sessionDirectory.currentDirectory || undefined
                                                                : undefined),
                                                        announcedDir: state.announcedDirectory,
                                                    });
                                                    if (pwdResult.inject) {
                                                        state.announcedDirectory = effectiveDirectory;
                                                        output.parts.push({
                                                            id: "prt_".concat(node_crypto_1.default.randomUUID()),
                                                            sessionID: sessionID,
                                                            messageID: messageID,
                                                            type: 'text',
                                                            text: pwdResult.text,
                                                            synthetic: true,
                                                        });
                                                    }
                                                    memoryReminder = shouldInjectMemoryReminderFromLatestAssistant({
                                                        lastMemoryReminderAssistantMessageId: state.lastMemoryReminderAssistantMessageId,
                                                        latestAssistantMessage: latestAssistantMessage,
                                                    });
                                                    if (memoryReminder.inject) {
                                                        output.parts.push({
                                                            id: "prt_".concat(node_crypto_1.default.randomUUID()),
                                                            sessionID: sessionID,
                                                            messageID: messageID,
                                                            type: 'text',
                                                            text: '<system-reminder>The previous assistant message was large. If the conversation had non-obvious learnings that prevent future mistakes and are not already in code comments or AGENTS.md, add them to MEMORY.md with concise titles and brief content (2-3 sentences max).</system-reminder>\n',
                                                            synthetic: true,
                                                        });
                                                        state.lastMemoryReminderAssistantMessageId =
                                                            memoryReminder.assistantMessageId;
                                                    }
                                                    branchResult = shouldInjectBranch({
                                                        previousGitState: state.gitState,
                                                        currentGitState: gitState,
                                                    });
                                                    if (branchResult.inject) {
                                                        state.gitState = gitState;
                                                        output.parts.push({
                                                            id: "prt_".concat(node_crypto_1.default.randomUUID()),
                                                            sessionID: sessionID,
                                                            messageID: messageID,
                                                            type: 'text',
                                                            text: branchResult.text,
                                                            synthetic: true,
                                                        });
                                                    }
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); },
                                    catch: function (error) {
                                        return new Error('context-awareness chat.message hook failed', { cause: error });
                                    },
                                })];
                            case 1:
                                hookResult = _a.sent();
                                if (hookResult instanceof Error) {
                                    logger.warn("[context-awareness-plugin] ".concat((0, plugin_logger_js_1.formatPluginErrorWithStack)(hookResult)));
                                    void (0, sentry_js_1.notifyError)(hookResult, 'context-awareness plugin chat.message hook failed');
                                }
                                return [2 /*return*/];
                        }
                    });
                }); },
                // Clean up per-session state when sessions are deleted.
                // Single delete instead of parallel Map/Set deletes.
                event: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                    var cleanupResult;
                    var event = _b.event;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0: return [4 /*yield*/, errore.tryAsync({
                                    try: function () { return __awaiter(void 0, void 0, void 0, function () {
                                        var id;
                                        var _a, _b;
                                        return __generator(this, function (_c) {
                                            if (event.type !== 'session.deleted') {
                                                return [2 /*return*/];
                                            }
                                            id = (_b = (_a = event.properties) === null || _a === void 0 ? void 0 : _a.info) === null || _b === void 0 ? void 0 : _b.id;
                                            if (!id) {
                                                return [2 /*return*/];
                                            }
                                            sessions.delete(id);
                                            return [2 /*return*/];
                                        });
                                    }); },
                                    catch: function (error) {
                                        return new Error('context-awareness event hook failed', { cause: error });
                                    },
                                })];
                            case 1:
                                cleanupResult = _c.sent();
                                if (cleanupResult instanceof Error) {
                                    logger.warn("[context-awareness-plugin] ".concat((0, plugin_logger_js_1.formatPluginErrorWithStack)(cleanupResult)));
                                    void (0, sentry_js_1.notifyError)(cleanupResult, 'context-awareness plugin event hook failed');
                                }
                                return [2 /*return*/];
                        }
                    });
                }); },
            }];
    });
}); };
exports.contextAwarenessPlugin = contextAwarenessPlugin;
