"use strict";
// ThreadSessionRuntime — one per active thread.
// Owns resource handles (listener controller, typing timers, part buffer).
// Delegates all state to the global store via thread-runtime-state.ts transitions.
//
// This is the sole session orchestrator. Discord handlers and slash commands
// call runtime APIs (enqueueIncoming, abortActiveRun, etc.) without inspecting
// run internals.
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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
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
exports.ThreadSessionRuntime = exports.pendingPermissions = void 0;
exports.getRuntime = getRuntime;
exports.getOrCreateRuntime = getOrCreateRuntime;
exports.disposeRuntime = disposeRuntime;
exports.disposeRuntimesForDirectory = disposeRuntimesForDirectory;
exports.getRuntimeCount = getRuntimeCount;
exports.disposeInactiveRuntimes = disposeInactiveRuntimes;
exports.isEssentialToolName = isEssentialToolName;
exports.isEssentialToolPart = isEssentialToolPart;
exports.deriveThreadNameFromSessionTitle = deriveThreadNameFromSessionTitle;
exports.deriveThreadRenameFromSessionUpdate = deriveThreadRenameFromSessionUpdate;
var discord_js_1 = require("discord.js");
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var pretty_ms_1 = require("pretty-ms");
var errore = require("errore");
var threadState = require("./thread-runtime-state.js");
var opencode_js_1 = require("../opencode.js");
var utils_js_1 = require("../utils.js");
var logger_js_1 = require("../logger.js");
var discord_utils_js_1 = require("../discord-utils.js");
var message_formatting_js_1 = require("../message-formatting.js");
var database_js_1 = require("../database.js");
var orm = require("drizzle-orm");
var schema = require("../schema.js");
var permissions_js_1 = require("../commands/permissions.js");
var ask_question_js_1 = require("../commands/ask-question.js");
var action_buttons_js_1 = require("../commands/action-buttons.js");
var file_upload_js_1 = require("../commands/file-upload.js");
var model_js_1 = require("../commands/model.js");
var system_message_js_1 = require("../system-message.js");
var agent_utils_js_1 = require("./agent-utils.js");
var opencode_session_event_log_js_1 = require("./opencode-session-event-log.js");
var event_stream_state_js_1 = require("./event-stream-state.js");
// Track multiple pending permissions per thread (keyed by permission ID).
// OpenCode handles blocking/sequencing — we just need to track all pending
// permissions to avoid duplicates and properly clean up on reply/teardown.
// The runtime is the sole owner of pending permissions per thread.
exports.pendingPermissions = new Map();
var thinking_utils_js_1 = require("../thinking-utils.js");
var worktrees_js_1 = require("../worktrees.js");
var sentry_js_1 = require("../sentry.js");
var debounced_process_flush_js_1 = require("../debounced-process-flush.js");
var html_actions_js_1 = require("../html-actions.js");
var debounce_timeout_js_1 = require("../debounce-timeout.js");
var opencode_command_detection_js_1 = require("../opencode-command-detection.js");
// ── Global Event Unwrapping ──────────────────────────────────────
// The /global/event SSE endpoint returns events wrapped in { directory, payload }.
// This function unwraps them, filtering to only events matching the runtime's
// project directory. Events with an empty directory (server-wide events like
// server.connected, global.disposed) are dispatched to all runtimes.
//
// GlobalEvent.payload includes SyncEvent* types (type: "sync") that are not
// part of the Event union. We filter them out since none of the event handlers
// know how to process them yet.
//
// Path comparison uses realpathSync to resolve symlinks (macOS /var → /private/var)
// because the opencode server may resolve paths differently than the filesystem
// path stored in our database. A normalized-path cache avoids repeated I/O for
// the same expected directory across events.
var _realpathCache = new Map();
function normalizeDirectoryPath(raw) {
    var cached = _realpathCache.get(raw);
    if (cached !== undefined)
        return cached;
    try {
        var resolved = node_fs_1.default.realpathSync(raw);
        _realpathCache.set(raw, resolved);
        return resolved;
    }
    catch (_a) {
        // Path doesn't exist on disk yet — fall back to path.normalize which
        // at least collapses redundant separators, trailing slashes, and dots.
        var normalized = node_path_1.default.normalize(raw);
        _realpathCache.set(raw, normalized);
        return normalized;
    }
}
function unwrapGlobalEvent(globalEvent, expectedDirectory) {
    var _a, _b;
    // Filter out SyncEvent* types — they have type: "sync" and are not handled
    if (globalEvent.payload.type === 'sync') {
        return null;
    }
    var eventDir = (_a = globalEvent.directory) !== null && _a !== void 0 ? _a : '';
    // Server-wide events (empty directory) are relevant to all runtimes
    if (!eventDir) {
        return globalEvent.payload;
    }
    // Resolve symlinks and normalize both paths for reliable comparison.
    // The opencode server may report paths using resolved symlinks
    // (e.g. /private/var instead of /var on macOS) while our database
    // stores the original unresolved path.
    var resolvedEventDir = normalizeDirectoryPath(eventDir);
    var resolvedExpectedDir = normalizeDirectoryPath(expectedDirectory);
    if (resolvedEventDir === resolvedExpectedDir) {
        // Log the first successful match so it's clear the event stream is working.
        if (!unwrapGlobalEvent._didLogFirstMatch) {
            unwrapGlobalEvent._didLogFirstMatch = true;
            logger.log("[LISTENER] Event directory matched: event=".concat(eventDir, " expected=").concat(expectedDirectory, " (resolved both to ").concat(resolvedExpectedDir, ")"));
        }
        return globalEvent.payload;
    }
    // Path mismatch — log for debugging but don't spam. This helps diagnose
    // directory normalization issues without flooding logs on every event.
    unwrapGlobalEvent._lastMismatchLog = (_b = unwrapGlobalEvent._lastMismatchLog) !== null && _b !== void 0 ? _b : 0;
    var now = Date.now();
    if (now - unwrapGlobalEvent._lastMismatchLog > 60000) {
        unwrapGlobalEvent._lastMismatchLog = now;
        logger.warn("[LISTENER] Event directory mismatch: event=".concat(eventDir, " (resolved=").concat(resolvedEventDir, ") expected=").concat(expectedDirectory, " (resolved=").concat(resolvedExpectedDir, "), dropping event type=").concat(globalEvent.payload.type));
    }
    return null;
}
// Rate-limit mismatch logging to once per minute
unwrapGlobalEvent._lastMismatchLog = 0;
unwrapGlobalEvent._didLogFirstMatch = false;
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.SESSION);
var discordLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.DISCORD);
var DETERMINISTIC_CONTEXT_LIMIT = 100000;
var TOAST_SESSION_ID_REGEX = /\b(ses_[A-Za-z0-9]+)\b\s*$/u;
function extractToastSessionId(_a) {
    var message = _a.message;
    var match = message.match(TOAST_SESSION_ID_REGEX);
    return match === null || match === void 0 ? void 0 : match[1];
}
function stripToastSessionId(_a) {
    var message = _a.message;
    return message.replace(TOAST_SESSION_ID_REGEX, '').trimEnd();
}
var shouldLogSessionEvents = process.env['KIMAKI_LOG_SESSION_EVENTS'] === '1' ||
    process.env['KIMAKI_VITEST'] === '1';
// ── Registry ─────────────────────────────────────────────────────
// Runtime instances are kept in a plain Map (not Zustand — the Map
// is not reactive state, just a lookup for resource handles).
var runtimes = new Map();
(0, opencode_js_1.subscribeOpencodeServerLifecycle)(function (event) {
    if (event.type !== 'started') {
        return;
    }
    for (var _i = 0, _a = runtimes.values(); _i < _a.length; _i++) {
        var runtime = _a[_i];
        runtime.handleSharedServerStarted({ port: event.port });
    }
});
function getRuntime(threadId) {
    return runtimes.get(threadId);
}
function getOrCreateRuntime(opts) {
    var existing = runtimes.get(opts.threadId);
    if (existing) {
        // Reconcile sdkDirectory: worktree threads transition from pending
        // (projectDirectory) to ready (worktree path) after runtime creation.
        if (existing.sdkDirectory !== opts.sdkDirectory) {
            existing.handleDirectoryChanged({
                oldDirectory: existing.sdkDirectory,
                newDirectory: opts.sdkDirectory,
            });
        }
        return existing;
    }
    threadState.ensureThread(opts.threadId); // add to global store
    var runtime = new ThreadSessionRuntime(opts);
    runtimes.set(opts.threadId, runtime);
    return runtime;
}
function disposeRuntime(threadId) {
    var runtime = runtimes.get(threadId);
    if (!runtime) {
        return;
    }
    runtime.dispose();
    runtimes.delete(threadId);
    threadState.removeThread(threadId); // remove from global store
}
function disposeRuntimesForDirectory(_a) {
    var directory = _a.directory, channelId = _a.channelId;
    var count = 0;
    for (var _i = 0, runtimes_1 = runtimes; _i < runtimes_1.length; _i++) {
        var _b = runtimes_1[_i], threadId = _b[0], runtime = _b[1];
        if (runtime.projectDirectory !== directory) {
            continue;
        }
        if (channelId && runtime.channelId !== channelId) {
            continue;
        }
        runtime.dispose();
        runtimes.delete(threadId);
        threadState.removeThread(threadId);
        count++;
    }
    return count;
}
/** Returns number of active runtimes (useful for diagnostics). */
function getRuntimeCount() {
    return runtimes.size;
}
function disposeInactiveRuntimes(_a) {
    var idleMs = _a.idleMs, _b = _a.nowMs, nowMs = _b === void 0 ? Date.now() : _b;
    var candidates = __spreadArray([], runtimes.entries(), true).filter(function (_a) {
        var runtime = _a[1];
        return runtime.isIdleForInactivityTimeout({ idleMs: idleMs, nowMs: nowMs });
    });
    var disposedDirectories = new Set();
    var disposedThreadIds = [];
    for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
        var _c = candidates_1[_i], threadId = _c[0], runtime = _c[1];
        runtime.dispose();
        runtimes.delete(threadId);
        threadState.removeThread(threadId);
        disposedThreadIds.push(threadId);
        disposedDirectories.add(runtime.projectDirectory);
    }
    return {
        disposedThreadIds: disposedThreadIds,
        disposedDirectories: __spreadArray([], disposedDirectories, true),
    };
}
// ── Pending UI cleanup ───────────────────────────────────────────
// Clears all pending interactive UI state for a thread on dispose/delete.
// Uses existing cancel functions which handle upstream replies (so OpenCode
// doesn't hang waiting for answers that will never come).
function cleanupPendingUiForThread(threadId) {
    // Permissions: reject each pending permission so OpenCode doesn't hang,
    // then delete the per-thread tracking map.
    var threadPerms = exports.pendingPermissions.get(threadId);
    if (threadPerms) {
        var _loop_1 = function (entry) {
            var ctx = permissions_js_1.pendingPermissionContexts.get(entry.contextHash);
            if (ctx) {
                var client_1 = (0, opencode_js_1.getOpencodeClient)(ctx.directory);
                if (client_1) {
                    var requestIds = ctx.requestIds.length > 0
                        ? ctx.requestIds
                        : [ctx.permission.id];
                    void Promise.all(requestIds.map(function (requestId) {
                        return client_1.permission.reply({
                            requestID: requestId,
                            directory: ctx.permissionDirectory,
                            reply: 'reject',
                        });
                    })).catch(function () { });
                }
                permissions_js_1.pendingPermissionContexts.delete(entry.contextHash);
            }
        };
        for (var _i = 0, threadPerms_1 = threadPerms; _i < threadPerms_1.length; _i++) {
            var _a = threadPerms_1[_i], entry = _a[1];
            _loop_1(entry);
        }
        exports.pendingPermissions.delete(threadId);
    }
    // Questions: cancel deletes pending context without replying to OpenCode.
    void (0, ask_question_js_1.cancelPendingQuestion)(threadId);
    // Action buttons: resolves context and clears timer.
    (0, action_buttons_js_1.cancelPendingActionButtons)(threadId);
    // File uploads: resolves with empty files so OpenCode unblocks.
    void (0, file_upload_js_1.cancelPendingFileUpload)(threadId);
    // HTML actions: clears registered action callbacks for this thread.
    (0, html_actions_js_1.cancelHtmlActionsForThread)(threadId);
}
// ── Helpers ──────────────────────────────────────────────────────
function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
function getTimestampFromSnowflake(snowflake) {
    var discordEpochMs = 1420070400000n;
    var snowflakeIdResult = errore.try({
        try: function () {
            return BigInt(snowflake);
        },
        catch: function () {
            return new Error('Invalid Discord snowflake');
        },
    });
    if (snowflakeIdResult instanceof Error) {
        return undefined;
    }
    var timestampBigInt = (snowflakeIdResult >> 22n) + discordEpochMs;
    var timestampMs = Number(timestampBigInt);
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
        return undefined;
    }
    return timestampMs;
}
function getTokenTotal(tokens) {
    return (tokens.input +
        tokens.output +
        tokens.reasoning +
        tokens.cache.read +
        tokens.cache.write);
}
/** Check if a tool part is "essential" (shown in text-and-essential-tools mode). */
function isEssentialToolName(toolName) {
    var essentialTools = [
        'edit',
        'write',
        'apply_patch',
        'bash',
        'webfetch',
        'websearch',
        'googlesearch',
        'codesearch',
        'task',
        'todowrite',
        'skill',
    ];
    // Also match any MCP tool that contains these names
    return essentialTools.some(function (name) {
        return toolName === name || toolName.endsWith("_".concat(name));
    });
}
function isEssentialToolPart(part) {
    var _a;
    if (part.type !== 'tool') {
        return false;
    }
    if (!isEssentialToolName(part.tool)) {
        return false;
    }
    if (part.tool === 'bash') {
        var hasSideEffect = (_a = part.state.input) === null || _a === void 0 ? void 0 : _a.hasSideEffect;
        return hasSideEffect !== false;
    }
    return true;
}
// ── Thread title derivation ──────────────────────────────────────
var DISCORD_THREAD_NAME_MAX = 100;
var WORKTREE_THREAD_PREFIX = '⬦ ';
// Prefixes that should survive OpenCode session title renames.
// When a thread starts with one of these, the rename preserves it.
var PRESERVED_THREAD_PREFIXES = [
    WORKTREE_THREAD_PREFIX,
    'btw: ',
    'Fork: ',
];
function getThreadNameCandidateFromSessionTitle(_a) {
    var _b;
    var sessionTitle = _a.sessionTitle, currentName = _a.currentName;
    var trimmed = sessionTitle === null || sessionTitle === void 0 ? void 0 : sessionTitle.trim();
    if (!trimmed) {
        return null;
    }
    if (/^new session\s*-/i.test(trimmed)) {
        return null;
    }
    var matchedPrefix = (_b = PRESERVED_THREAD_PREFIXES.find(function (p) {
        return currentName.startsWith(p);
    })) !== null && _b !== void 0 ? _b : '';
    return "".concat(matchedPrefix).concat(trimmed).slice(0, DISCORD_THREAD_NAME_MAX);
}
function deriveThreadNameFromSessionTitle(_a) {
    var sessionTitle = _a.sessionTitle, currentName = _a.currentName;
    var candidate = getThreadNameCandidateFromSessionTitle({
        sessionTitle: sessionTitle,
        currentName: currentName,
    });
    if (candidate === null) {
        return undefined;
    }
    if (candidate === currentName) {
        return undefined;
    }
    return candidate;
}
function deriveThreadRenameFromSessionUpdate(_a) {
    var sessionTitle = _a.sessionTitle, currentName = _a.currentName, lastSyncedName = _a.lastSyncedName;
    if (lastSyncedName !== null && currentName !== lastSyncedName) {
        return {
            desiredName: null,
            nextSyncedName: lastSyncedName,
        };
    }
    var candidate = getThreadNameCandidateFromSessionTitle({
        sessionTitle: sessionTitle,
        currentName: currentName,
    });
    if (candidate === null) {
        return {
            desiredName: null,
            nextSyncedName: lastSyncedName,
        };
    }
    if (candidate === currentName) {
        return {
            desiredName: null,
            nextSyncedName: currentName,
        };
    }
    return {
        desiredName: candidate,
        nextSyncedName: candidate,
    };
}
// Rewrite `{ prompt: "/build foo" }` → `{ prompt: "", command: { name, arguments }, mode: "local-queue" }`
// when the prompt's leading token matches a registered opencode command.
// Skip if a command is already set or there's no prompt to inspect.
function maybeConvertLeadingCommand(input) {
    if (input.command)
        return input;
    if (!input.prompt)
        return input;
    var extracted = (0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)(input.prompt);
    if (!extracted)
        return input;
    return __assign(__assign({}, input), { prompt: '', command: extracted.command, mode: 'local-queue' });
}
function getWorktreePromptKey(worktree) {
    if (!worktree) {
        return null;
    }
    return [
        worktree.worktreeDirectory,
        worktree.branch,
        worktree.mainRepoDirectory,
    ].join('::');
}
// ── Runtime class ────────────────────────────────────────────────
var ThreadSessionRuntime = /** @class */ (function () {
    function ThreadSessionRuntime(opts) {
        var _this = this;
        // ── Resource handles (mechanisms, not domain state) ──
        // Reentrancy guard for startEventListener (not domain state —
        // just prevents calling the async loop twice).
        this.listenerLoopRunning = false;
        // Set to true by dispose(). Guards against queued work running after cleanup
        // and lets dispatchAction/startEventListener bail out early.
        this.disposed = false;
        // Typing indicator scheduler handles.
        // `typingKeepaliveTimeout` is the 7s keepalive loop while a run stays busy.
        // `typingRepulseDebounce` collapses clustered immediate re-pulses after bot
        // messages into one last pulse, because Discord hides typing on the next bot
        // message and showing multiple back-to-back POSTs is wasteful.
        this.typingKeepaliveTimeout = null;
        // Notification throttles for retry/context notices.
        this.lastDisplayedContextPercentage = 0;
        this.lastRateLimitDisplayTime = 0;
        // Part output buffering (write-side cache, not domain state)
        this.partBuffer = new Map();
        this.eventBuffer = [];
        this.nextEventIndex = 0;
        // Serialized action queue for per-thread runtime transitions.
        // Ingress and event handling both flow through this queue to keep ordering
        // deterministic and avoid interleaving shared mutable structures.
        this.actionQueue = [];
        this.processingAction = false;
        // Lightweight promise chain for serializing preprocess callbacks.
        // Runs OUTSIDE dispatchAction so heavy work (voice transcription, context
        // fetch, attachment download) doesn't block SSE event handling, permission
        // UI, or queue drain. Only preprocess ordering is serialized here; the
        // resolved input is then routed through the normal enqueue paths which
        // use dispatchAction internally.
        this.preprocessChain = Promise.resolve();
        // Detached helper promise for the "question blocks while local queue has
        // items" flow. Prevents overlapping single-item handoffs when the question is
        // shown, answered, and new /queue items arrive close together.
        this.questionQueueHandoffPromise = null;
        this.threadId = opts.threadId;
        this.projectDirectory = opts.projectDirectory;
        this.sdkDirectory = opts.sdkDirectory;
        this.channelId = opts.channelId;
        this.appId = opts.appId;
        this.thread = opts.thread;
        threadState.updateThread(this.threadId, function (t) { return (__assign(__assign({}, t), { listenerController: new AbortController() })); });
        this.persistEventBufferDebounced = (0, debounced_process_flush_js_1.createDebouncedProcessFlush)({
            waitMs: ThreadSessionRuntime.EVENT_BUFFER_DB_FLUSH_MS,
            callback: function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.persistSessionEventsToDatabase()];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); },
            onError: function (error) {
                logger.error("[SESSION EVENT DB] Debounced persistence failed for thread ".concat(_this.threadId, ":"), error);
            },
        });
        this.typingRepulseDebounce = (0, debounce_timeout_js_1.createDebouncedTimeout)({
            delayMs: ThreadSessionRuntime.TYPING_REPULSE_DEBOUNCE_MS,
            callback: function () {
                if (!_this.shouldTypeNow()) {
                    return;
                }
                _this.restartTypingKeepalive({ sendNow: true });
            },
        });
    }
    ThreadSessionRuntime.prototype.consumeWorktreePromptChange = function (worktree) {
        var nextKey = getWorktreePromptKey(worktree);
        var changed = this.lastPromptWorktreeKey !== nextKey;
        this.lastPromptWorktreeKey = nextKey;
        return changed;
    };
    Object.defineProperty(ThreadSessionRuntime.prototype, "state", {
        // Read own state from global store
        get: function () {
            return threadState.getThreadState(this.threadId);
        },
        enumerable: false,
        configurable: true
    });
    ThreadSessionRuntime.prototype.getDerivedPhase = function () {
        return this.isMainSessionBusy() ? 'running' : 'idle';
    };
    Object.defineProperty(ThreadSessionRuntime.prototype, "listenerAborted", {
        /** Whether the listener has been disposed. */
        get: function () {
            var _a, _b, _c;
            return (_c = (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a.listenerController) === null || _b === void 0 ? void 0 : _b.signal.aborted) !== null && _c !== void 0 ? _c : true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ThreadSessionRuntime.prototype, "listenerSignal", {
        /** The listener AbortSignal, used to pass to SDK subscribe calls. */
        get: function () {
            var _a, _b;
            return (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a.listenerController) === null || _b === void 0 ? void 0 : _b.signal;
        },
        enumerable: false,
        configurable: true
    });
    ThreadSessionRuntime.prototype.getLastRuntimeActivityTimestamp = function (_a) {
        var _nowMs = _a.nowMs;
        var lastEvent = this.eventBuffer[this.eventBuffer.length - 1];
        var lastEventTimestamp = lastEvent === null || lastEvent === void 0 ? void 0 : lastEvent.timestamp;
        if (typeof lastEventTimestamp === 'number' && Number.isFinite(lastEventTimestamp)) {
            return lastEventTimestamp;
        }
        var threadCreatedTimestamp = this.thread.createdTimestamp;
        if (typeof threadCreatedTimestamp === 'number'
            && Number.isFinite(threadCreatedTimestamp)
            && threadCreatedTimestamp > 0) {
            return threadCreatedTimestamp;
        }
        var snowflakeTimestamp = getTimestampFromSnowflake(this.thread.id);
        if (snowflakeTimestamp) {
            return snowflakeTimestamp;
        }
        return 0;
    };
    ThreadSessionRuntime.prototype.isIdleCandidateForInactivityCheck = function () {
        var _a, _b;
        if (this.isMainSessionBusy()) {
            return false;
        }
        if (((_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a.queueItems.length) !== null && _b !== void 0 ? _b : 0) > 0) {
            return false;
        }
        if (this.hasPendingInteractiveUi()) {
            return false;
        }
        if (this.processingAction || this.actionQueue.length > 0) {
            return false;
        }
        return true;
    };
    ThreadSessionRuntime.prototype.getInactivitySnapshot = function (_a) {
        var nowMs = _a.nowMs;
        var lastActivityTimestamp = this.getLastRuntimeActivityTimestamp({ nowMs: nowMs });
        return {
            idleCandidate: this.isIdleCandidateForInactivityCheck(),
            inactiveForMs: Math.max(0, nowMs - lastActivityTimestamp),
        };
    };
    ThreadSessionRuntime.prototype.isIdleForInactivityTimeout = function (_a) {
        var idleMs = _a.idleMs, nowMs = _a.nowMs;
        var snapshot = this.getInactivitySnapshot({ nowMs: nowMs });
        if (!snapshot.idleCandidate) {
            return false;
        }
        return snapshot.inactiveForMs >= idleMs;
    };
    ThreadSessionRuntime.prototype.hydrateSessionEventsFromDatabase = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var rows, hydratedEvents, lastHydratedEvent;
            var sessionId = _b.sessionId;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (this.eventBuffer.length > 0) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, (0, database_js_1.getSessionEventSnapshot)({ sessionId: sessionId })];
                    case 1:
                        rows = _c.sent();
                        if (rows.length === 0) {
                            return [2 /*return*/];
                        }
                        hydratedEvents = rows.flatMap(function (row) {
                            var eventResult = errore.try({
                                try: function () {
                                    return JSON.parse(row.event_json);
                                },
                                catch: function (error) {
                                    return new Error('Failed to parse persisted session event JSON', {
                                        cause: error,
                                    });
                                },
                            });
                            if (eventResult instanceof Error) {
                                logger.warn("[SESSION EVENT DB] Skipping invalid persisted event row for session ".concat(sessionId, ": ").concat(eventResult.message));
                                return [];
                            }
                            return [
                                {
                                    event: eventResult,
                                    timestamp: Number(row.timestamp),
                                    eventIndex: Number(row.event_index),
                                },
                            ];
                        });
                        this.eventBuffer = hydratedEvents.slice(-ThreadSessionRuntime.EVENT_BUFFER_MAX);
                        lastHydratedEvent = this.eventBuffer[this.eventBuffer.length - 1];
                        this.nextEventIndex = lastHydratedEvent
                            ? Number(lastHydratedEvent.eventIndex || 0) + 1
                            : 0;
                        logger.log("[SESSION EVENT DB] Hydrated ".concat(this.eventBuffer.length, " events for session ").concat(sessionId));
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.persistSessionEventsToDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, events;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
                        if (!sessionId) {
                            return [2 /*return*/];
                        }
                        events = this.eventBuffer.flatMap(function (entry) {
                            var eventSessionId = entry.event.type === 'queue.question-handoff-started'
                                ? entry.event.properties.sessionID
                                : (0, opencode_session_event_log_js_1.getOpencodeEventSessionId)(entry.event);
                            if (eventSessionId !== sessionId) {
                                return [];
                            }
                            return [
                                {
                                    session_id: sessionId,
                                    thread_id: _this.threadId,
                                    timestamp: entry.timestamp,
                                    event_index: entry.eventIndex || 0,
                                    event_json: JSON.stringify(entry.event),
                                },
                            ];
                        });
                        return [4 /*yield*/, (0, database_js_1.appendSessionEventsSinceLastTimestamp)({
                                sessionId: sessionId,
                                events: events,
                            })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.nextAbortId = function (reason) {
        return "".concat(reason, "-").concat(Date.now().toString(36), "-").concat(Math.random().toString(36).slice(2, 6));
    };
    ThreadSessionRuntime.prototype.formatRunStateForLog = function () {
        var _a;
        var sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
        if (!sessionId) {
            return 'none';
        }
        var latestAssistant = this.getLatestAssistantMessageIdForCurrentTurn({
            sessionId: sessionId,
        }) || 'none';
        var assistantCount = this.getAssistantMessageIdsForCurrentTurn({
            sessionId: sessionId,
        }).size;
        var phase = this.getDerivedPhase();
        return "phase=".concat(phase, ",assistant=").concat(latestAssistant, ",assistantCount=").concat(assistantCount);
    };
    ThreadSessionRuntime.prototype.isMainSessionBusy = function () {
        var _a;
        var sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
        if (!sessionId) {
            return false;
        }
        return (0, event_stream_state_js_1.isSessionBusy)({ events: this.eventBuffer, sessionId: sessionId });
    };
    ThreadSessionRuntime.prototype.getAssistantMessageIdsForCurrentTurn = function (_a) {
        var sessionId = _a.sessionId, upToIndex = _a.upToIndex;
        var normalizedIndex = upToIndex === undefined ? undefined : upToIndex - 1;
        return (0, event_stream_state_js_1.getAssistantMessageIdsForLatestUserTurn)({
            events: this.eventBuffer,
            sessionId: sessionId,
            upToIndex: normalizedIndex,
        });
    };
    ThreadSessionRuntime.prototype.getLatestAssistantMessageIdForCurrentTurn = function (_a) {
        var sessionId = _a.sessionId, upToIndex = _a.upToIndex;
        var normalizedIndex = upToIndex === undefined ? undefined : upToIndex - 1;
        return (0, event_stream_state_js_1.getLatestAssistantMessageIdForLatestUserTurn)({
            events: this.eventBuffer,
            sessionId: sessionId,
            upToIndex: normalizedIndex,
        });
    };
    ThreadSessionRuntime.prototype.getSubtaskInfoForSession = function (candidateSessionId) {
        var _a;
        var mainSessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
        if (!mainSessionId || candidateSessionId === mainSessionId) {
            return undefined;
        }
        var subtaskIndex = (0, event_stream_state_js_1.getDerivedSubtaskIndex)({
            events: this.eventBuffer,
            mainSessionId: mainSessionId,
            candidateSessionId: candidateSessionId,
        });
        if (!subtaskIndex) {
            return undefined;
        }
        var agentType = (0, event_stream_state_js_1.getDerivedSubtaskAgentType)({
            events: this.eventBuffer,
            mainSessionId: mainSessionId,
            candidateSessionId: candidateSessionId,
        });
        var label = "".concat(agentType || 'task', "-").concat(subtaskIndex);
        var assistantMessageId = this.getLatestAssistantMessageIdForCurrentTurn({
            sessionId: candidateSessionId,
        });
        return { label: label, assistantMessageId: assistantMessageId };
    };
    // ── Lifecycle ────────────────────────────────────────────────
    ThreadSessionRuntime.prototype.dispose = function () {
        var _a, _b;
        this.disposed = true;
        (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a.listenerController) === null || _b === void 0 ? void 0 : _b.abort();
        // waitForEvent loops check listenerAborted and exit naturally.
        threadState.updateThread(this.threadId, function (t) { return (__assign(__assign({}, t), { listenerController: undefined })); });
        void this.persistEventBufferDebounced.dispose();
        this.stopTyping();
        // Release large internal buffers so GC can reclaim memory immediately
        // instead of waiting for the runtime object itself to become unreachable.
        this.eventBuffer = [];
        this.nextEventIndex = 0;
        this.partBuffer.clear();
        this.preprocessChain = Promise.resolve();
        // Don't clear actionQueue here — queued closures own resolve/reject for
        // dispatchAction() promises. Dropping them would leave awaiting callers
        // hanging forever. Instead, drain them: each closure checks this.disposed
        // and resolves early without executing real work.
        void this.processActionQueue();
        // Clean up all pending UI state for this thread (permissions, questions,
        // action buttons, file uploads, html actions).
        cleanupPendingUiForThread(this.thread.id);
    };
    // Called when sdkDirectory changes (e.g. worktree becomes ready after
    // /new-worktree in an existing thread). The event listener was subscribed
    // to the old directory's Instance in opencode — events from the new
    // directory's Instance won't reach it. We must reconnect the listener
    // and clear the old session so ensureSession creates a fresh one under
    // the new Instance.
    ThreadSessionRuntime.prototype.handleDirectoryChanged = function (_a) {
        var _b;
        var oldDirectory = _a.oldDirectory, newDirectory = _a.newDirectory;
        logger.log("[LISTENER] sdkDirectory changed for thread ".concat(this.threadId, ": ").concat(oldDirectory, " \u2192 ").concat(newDirectory));
        this.sdkDirectory = newDirectory;
        // Clear cached session — it was created under the old directory's
        // opencode Instance and can't be reused from the new one.
        threadState.updateThread(this.threadId, function (t) { return (__assign(__assign({}, t), { sessionId: undefined })); });
        // Restart event listener to subscribe under the new directory.
        var currentController = (_b = this.state) === null || _b === void 0 ? void 0 : _b.listenerController;
        if (currentController) {
            currentController.abort(new Error('sdkDirectory changed'));
            threadState.updateThread(this.threadId, function (t) { return (__assign(__assign({}, t), { listenerController: new AbortController() })); });
            this.listenerLoopRunning = false;
            void this.startEventListener();
        }
    };
    ThreadSessionRuntime.prototype.handleSharedServerStarted = function (_a) {
        var _b, _c;
        var port = _a.port;
        if (!((_b = this.state) === null || _b === void 0 ? void 0 : _b.sessionId)) {
            return;
        }
        var currentController = (_c = this.state) === null || _c === void 0 ? void 0 : _c.listenerController;
        if (!currentController) {
            return;
        }
        logger.log("[LISTENER] Refreshing listener for thread ".concat(this.threadId, " after shared server start on port ").concat(port));
        currentController.abort(new Error('Shared OpenCode server restarted'));
        threadState.updateThread(this.threadId, function (t) { return (__assign(__assign({}, t), { listenerController: new AbortController() })); });
        this.listenerLoopRunning = false;
        void this.startEventListener();
    };
    ThreadSessionRuntime.prototype.compactTextForEventBuffer = function (text) {
        if (text.length <= ThreadSessionRuntime.EVENT_BUFFER_TEXT_MAX_CHARS) {
            return text;
        }
        return "".concat(text.slice(0, ThreadSessionRuntime.EVENT_BUFFER_TEXT_MAX_CHARS), "\u2026");
    };
    ThreadSessionRuntime.prototype.isDefinedEventBufferValue = function (value) {
        return value !== undefined;
    };
    ThreadSessionRuntime.prototype.pruneLargeStringsForEventBuffer = function (value, seen) {
        var _this = this;
        if (typeof value !== 'object' || value === null) {
            return;
        }
        if (seen.has(value)) {
            return;
        }
        seen.add(value);
        if (Array.isArray(value)) {
            var compactedItems = value
                .map(function (item) {
                if (typeof item === 'string') {
                    if (item.length > ThreadSessionRuntime.EVENT_BUFFER_TEXT_MAX_CHARS) {
                        return undefined;
                    }
                    return item;
                }
                _this.pruneLargeStringsForEventBuffer(item, seen);
                return item;
            })
                .filter(function (item) {
                return _this.isDefinedEventBufferValue(item);
            });
            value.splice.apply(value, __spreadArray([0, value.length], compactedItems, false));
            return;
        }
        var objectValue = value;
        for (var _i = 0, _a = Object.entries(objectValue); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], nestedValue = _b[1];
            if (typeof nestedValue === 'string') {
                if (nestedValue.length > ThreadSessionRuntime.EVENT_BUFFER_TEXT_MAX_CHARS) {
                    delete objectValue[key];
                }
                continue;
            }
            this.pruneLargeStringsForEventBuffer(nestedValue, seen);
        }
    };
    ThreadSessionRuntime.prototype.finalizeCompactedEventForEventBuffer = function (event) {
        this.pruneLargeStringsForEventBuffer(event, new WeakSet());
        return event;
    };
    ThreadSessionRuntime.prototype.compactEventForEventBuffer = function (event) {
        var _a;
        if (event.type === 'queue.question-handoff-started') {
            return this.finalizeCompactedEventForEventBuffer(structuredClone(event));
        }
        if (event.type === 'session.diff') {
            return undefined;
        }
        var compacted = structuredClone(event);
        if (compacted.type === 'message.updated') {
            // Strip heavy fields from ALL roles. Derivation only needs lightweight
            // metadata (id, role, sessionID, parentID, time, finish, error, modelID,
            // providerID, mode, tokens). The parts array on assistant messages grows
            // with every tool call and was the primary OOM vector — 1000 buffer entries
            // each carrying the full cumulative parts array reached 4GB+.
            var info = compacted.properties.info;
            var partsSummary = Array.isArray(info.parts)
                ? info.parts.flatMap(function (part) {
                    if (!part || typeof part !== 'object') {
                        return [];
                    }
                    var candidate = part;
                    if (typeof candidate.id !== 'string'
                        || typeof candidate.type !== 'string') {
                        return [];
                    }
                    return [{ id: candidate.id, type: candidate.type }];
                })
                : [];
            delete info.system;
            delete info.summary;
            delete info.tools;
            delete info.parts;
            if (partsSummary.length > 0) {
                info.partsSummary = partsSummary;
            }
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        if (compacted.type !== 'message.part.updated') {
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        var part = compacted.properties.part;
        if (part.type === 'text') {
            part.text = this.compactTextForEventBuffer(part.text);
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        if (part.type === 'reasoning') {
            part.text = this.compactTextForEventBuffer(part.text);
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        if (part.type === 'snapshot') {
            part.snapshot = this.compactTextForEventBuffer(part.snapshot);
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        if (part.type === 'step-start' && part.snapshot) {
            part.snapshot = this.compactTextForEventBuffer(part.snapshot);
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        if (part.type !== 'tool') {
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        var state = part.state;
        // Preserve subagent_type for task tools so derivation can build labels
        // like "explore-1" instead of generic "task-1" after compaction strips input
        var taskSubagentType = part.tool === 'task' ? (_a = state.input) === null || _a === void 0 ? void 0 : _a.subagent_type : undefined;
        state.input = {};
        if (typeof taskSubagentType === 'string') {
            state.input.subagent_type = taskSubagentType;
        }
        if (state.status === 'pending') {
            state.raw = this.compactTextForEventBuffer(state.raw);
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        if (state.status === 'running') {
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        if (state.status === 'completed') {
            state.output = this.compactTextForEventBuffer(state.output);
            delete state.attachments;
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        if (state.status === 'error') {
            state.error = this.compactTextForEventBuffer(state.error);
            return this.finalizeCompactedEventForEventBuffer(compacted);
        }
        return this.finalizeCompactedEventForEventBuffer(compacted);
    };
    ThreadSessionRuntime.prototype.appendEventToBuffer = function (event) {
        var compactedEvent = this.compactEventForEventBuffer(event);
        if (!compactedEvent) {
            return;
        }
        var timestamp = Date.now();
        var eventIndex = this.nextEventIndex;
        this.nextEventIndex += 1;
        this.eventBuffer.push({
            event: compactedEvent,
            timestamp: timestamp,
            eventIndex: eventIndex,
        });
        if (this.eventBuffer.length > ThreadSessionRuntime.EVENT_BUFFER_MAX) {
            this.eventBuffer.splice(0, this.eventBuffer.length - ThreadSessionRuntime.EVENT_BUFFER_MAX);
        }
        this.persistEventBufferDebounced.trigger();
    };
    // Queue-dispatch lifecycle markers are synthetic buffer-only events.
    // They are not fed into handleEvent(), so they do not emit Discord messages;
    // they only stabilize event-derived busy/idle gating for local queue drains.
    ThreadSessionRuntime.prototype.markQueueDispatchBusy = function (sessionId) {
        this.appendEventToBuffer({
            type: 'session.status',
            properties: {
                sessionID: sessionId,
                status: { type: 'busy' },
            },
        });
    };
    ThreadSessionRuntime.prototype.markQueueDispatchIdle = function (sessionId) {
        this.appendEventToBuffer({
            type: 'session.idle',
            properties: {
                sessionID: sessionId,
            },
        });
    };
    ThreadSessionRuntime.prototype.markQuestionQueueHandoffStarted = function (sessionId) {
        this.appendEventToBuffer({
            type: 'queue.question-handoff-started',
            properties: {
                sessionID: sessionId,
            },
        });
    };
    /**
     * Generic event waiter: polls the event buffer until a matching event
     * appears (with timestamp >= sinceTimestamp), or timeout/abort.
     *
     * Unlike the old idleWaiter (a promise wired into handleSessionIdle),
     * this has zero coupling to specific event handlers — it just scans
     * the buffer that handleEvent() fills. Works for any event type.
     */
    ThreadSessionRuntime.prototype.waitForEvent = function (opts) {
        return __awaiter(this, void 0, void 0, function () {
            var predicate, sinceTimestamp, timeoutMs, _a, pollMs, deadline, match;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        predicate = opts.predicate, sinceTimestamp = opts.sinceTimestamp, timeoutMs = opts.timeoutMs, _a = opts.pollMs, pollMs = _a === void 0 ? 50 : _a;
                        deadline = Date.now() + timeoutMs;
                        _b.label = 1;
                    case 1:
                        if (!(Date.now() < deadline)) return [3 /*break*/, 3];
                        if (this.listenerAborted) {
                            return [2 /*return*/, undefined];
                        }
                        match = this.eventBuffer.find(function (entry) {
                            return entry.timestamp >= sinceTimestamp && predicate(entry.event);
                        });
                        if (match) {
                            return [2 /*return*/, match.event];
                        }
                        return [4 /*yield*/, delay(pollMs)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 1];
                    case 3:
                        logger.warn("[WAIT EVENT] Timeout after ".concat(timeoutMs, "ms for thread ").concat(this.threadId, ", proceeding"));
                        return [2 /*return*/, undefined];
                }
            });
        });
    };
    // Seed sentPartIds from DB to avoid re-sending parts that were
    // already sent in a previous runtime or before a reconnect.
    ThreadSessionRuntime.prototype.bootstrapSentPartIds = function () {
        return __awaiter(this, void 0, void 0, function () {
            var existingPartIds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, database_js_1.getPartMessageIds)(this.thread.id)];
                    case 1:
                        existingPartIds = _a.sent();
                        if (existingPartIds.length === 0) {
                            return [2 /*return*/];
                        }
                        threadState.updateThread(this.threadId, function (t) {
                            var newIds = new Set(t.sentPartIds);
                            for (var _i = 0, existingPartIds_1 = existingPartIds; _i < existingPartIds_1.length; _i++) {
                                var id = existingPartIds_1[_i];
                                newIds.add(id);
                            }
                            return __assign(__assign({}, t), { sentPartIds: newIds });
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    // ── Event Listener Loop (§7.3) ──────────────────────────────
    // Persistent event.subscribe loop with exponential backoff.
    // Reconnects automatically on transient disconnects.
    // Only killed when listenerController is aborted (dispose/fatal).
    // Run abort never affects this loop.
    ThreadSessionRuntime.prototype.startEventListener = function () {
        return __awaiter(this, void 0, void 0, function () {
            var backoffMs, maxBackoffMs, loopController, loopSignal, signal, _loop_2, this_1, state_1;
            var _this = this;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (this.listenerLoopRunning || this.disposed) {
                            return [2 /*return*/];
                        }
                        this.listenerLoopRunning = true;
                        // Bootstrap sentPartIds from DB so we don't re-send parts that
                        // were already sent in a previous runtime or before a reconnect.
                        return [4 /*yield*/, this.bootstrapSentPartIds()];
                    case 1:
                        // Bootstrap sentPartIds from DB so we don't re-send parts that
                        // were already sent in a previous runtime or before a reconnect.
                        _e.sent();
                        backoffMs = 500;
                        maxBackoffMs = 30000;
                        loopController = (_a = this.state) === null || _a === void 0 ? void 0 : _a.listenerController;
                        loopSignal = loopController === null || loopController === void 0 ? void 0 : loopController.signal;
                        if (!loopSignal) {
                            // No controller — already disposed or in a bad state.
                            this.listenerLoopRunning = false;
                            return [2 /*return*/];
                        }
                        signal = loopSignal;
                        _loop_2 = function () {
                            var client, subscribeResult, subscribeError, events, receivedAnyEvent, iterResult, iterError;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0:
                                        client = (0, opencode_js_1.getOpencodeClient)(this_1.projectDirectory);
                                        if (!!client) return [3 /*break*/, 2];
                                        // This is expected during shared-server transitions: the listener can
                                        // outlive the current opencode process across cold start, explicit
                                        // restart, shutdown, or crash recovery. stopOpencodeServer()/exit clears
                                        // the cached per-directory clients immediately, so existing runtimes may
                                        // observe a brief no-client window before initialize/restart publishes
                                        // the next shared server and repopulates the client cache.
                                        logger.warn("[LISTENER] No OpenCode client for thread ".concat(this_1.threadId, ", retrying in ").concat(backoffMs, "ms"));
                                        return [4 /*yield*/, delay(backoffMs)];
                                    case 1:
                                        _f.sent();
                                        backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
                                        return [2 /*return*/, "continue"];
                                    case 2:
                                        logger.log("[LISTENER] Subscribing to global event stream for thread ".concat(this_1.threadId, " directory=").concat(this_1.sdkDirectory));
                                        return [4 /*yield*/, errore.tryAsync(function () {
                                                return client.global.event({ signal: signal });
                                            })];
                                    case 3:
                                        subscribeResult = _f.sent();
                                        if (!(subscribeResult instanceof Error)) return [3 /*break*/, 5];
                                        if ((0, utils_js_1.isAbortError)(subscribeResult) || loopSignal.aborted) {
                                            return [2 /*return*/, { value: void 0 }];
                                        }
                                        subscribeError = subscribeResult;
                                        logger.warn("[LISTENER] Subscribe failed for thread ".concat(this_1.threadId, ", retrying in ").concat(backoffMs, "ms:"), subscribeError.message);
                                        return [4 /*yield*/, delay(backoffMs)];
                                    case 4:
                                        _f.sent();
                                        backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
                                        return [2 /*return*/, "continue"];
                                    case 5:
                                        events = subscribeResult.stream;
                                        logger.log("[LISTENER] Connected to global event stream for thread ".concat(this_1.threadId));
                                        // Re-bootstrap sentPartIds on reconnect to prevent re-sending
                                        // parts that arrived while we were disconnected.
                                        return [4 /*yield*/, this_1.bootstrapSentPartIds()];
                                    case 6:
                                        // Re-bootstrap sentPartIds on reconnect to prevent re-sending
                                        // parts that arrived while we were disconnected.
                                        _f.sent();
                                        receivedAnyEvent = false;
                                        return [4 /*yield*/, errore.tryAsync(function () { return __awaiter(_this, void 0, void 0, function () {
                                                var _loop_3, this_2, _a, events_1, events_1_1, state_2, e_1_1;
                                                var _this = this;
                                                var _b, e_1, _c, _d;
                                                return __generator(this, function (_e) {
                                                    switch (_e.label) {
                                                        case 0:
                                                            _e.trys.push([0, 6, 7, 12]);
                                                            _loop_3 = function () {
                                                                var globalEvent, unwrappedEvent;
                                                                return __generator(this, function (_f) {
                                                                    switch (_f.label) {
                                                                        case 0:
                                                                            _d = events_1_1.value;
                                                                            _a = false;
                                                                            globalEvent = _d;
                                                                            // Check if this loop instance has been superseded by
                                                                            // handleSharedServerStarted / handleDirectoryChanged.
                                                                            if (loopSignal === null || loopSignal === void 0 ? void 0 : loopSignal.aborted) {
                                                                                return [2 /*return*/, { value: void 0 }];
                                                                            }
                                                                            // Track that we received at least one event so we can reset
                                                                            // backoff. Only resetting after receiving events prevents a
                                                                            // tight reconnect loop when the server keeps closing connections
                                                                            // immediately (empty streams).
                                                                            receivedAnyEvent = true;
                                                                            unwrappedEvent = unwrapGlobalEvent(globalEvent, this_2.sdkDirectory);
                                                                            if (!unwrappedEvent) {
                                                                                return [2 /*return*/, "continue"];
                                                                            }
                                                                            // Each event is dispatched through the serialized action queue
                                                                            // to prevent interleaving mutations from concurrent events.
                                                                            return [4 /*yield*/, this_2.dispatchAction(function () {
                                                                                    return _this.handleEvent(unwrappedEvent);
                                                                                })];
                                                                        case 1:
                                                                            // Each event is dispatched through the serialized action queue
                                                                            // to prevent interleaving mutations from concurrent events.
                                                                            _f.sent();
                                                                            return [2 /*return*/];
                                                                    }
                                                                });
                                                            };
                                                            this_2 = this;
                                                            _a = true, events_1 = __asyncValues(events);
                                                            _e.label = 1;
                                                        case 1: return [4 /*yield*/, events_1.next()];
                                                        case 2:
                                                            if (!(events_1_1 = _e.sent(), _b = events_1_1.done, !_b)) return [3 /*break*/, 5];
                                                            return [5 /*yield**/, _loop_3()];
                                                        case 3:
                                                            state_2 = _e.sent();
                                                            if (typeof state_2 === "object")
                                                                return [2 /*return*/, state_2.value];
                                                            _e.label = 4;
                                                        case 4:
                                                            _a = true;
                                                            return [3 /*break*/, 1];
                                                        case 5: return [3 /*break*/, 12];
                                                        case 6:
                                                            e_1_1 = _e.sent();
                                                            e_1 = { error: e_1_1 };
                                                            return [3 /*break*/, 12];
                                                        case 7:
                                                            _e.trys.push([7, , 10, 11]);
                                                            if (!(!_a && !_b && (_c = events_1.return))) return [3 /*break*/, 9];
                                                            return [4 /*yield*/, _c.call(events_1)];
                                                        case 8:
                                                            _e.sent();
                                                            _e.label = 9;
                                                        case 9: return [3 /*break*/, 11];
                                                        case 10:
                                                            if (e_1) throw e_1.error;
                                                            return [7 /*endfinally*/];
                                                        case 11: return [7 /*endfinally*/];
                                                        case 12: return [2 /*return*/];
                                                    }
                                                });
                                            }); })
                                            // If loopSignal was aborted while we were in the stream iteration
                                            // (e.g. handleSharedServerStarted replaced the controller), exit
                                            // immediately without applying backoff — the new listener is
                                            // already running.
                                        ];
                                    case 7:
                                        iterResult = _f.sent();
                                        // If loopSignal was aborted while we were in the stream iteration
                                        // (e.g. handleSharedServerStarted replaced the controller), exit
                                        // immediately without applying backoff — the new listener is
                                        // already running.
                                        if (loopSignal.aborted) {
                                            logger.log("[LISTENER] Loop signal aborted for thread ".concat(this_1.threadId, ", exiting without backoff"));
                                            return [2 /*return*/, { value: void 0 }];
                                        }
                                        // Only reset backoff when the stream delivered at least one event.
                                        // If the server closed the connection without sending any events
                                        // (empty stream), keep accumulating backoff to avoid a tight loop.
                                        if (receivedAnyEvent) {
                                            backoffMs = 500;
                                        }
                                        if (!(iterResult instanceof Error)) return [3 /*break*/, 9];
                                        if ((0, utils_js_1.isAbortError)(iterResult)) {
                                            return [2 /*return*/, { value: void 0 }];
                                        }
                                        iterError = iterResult;
                                        logger.warn("[LISTENER] Stream broke for thread ".concat(this_1.threadId, ", reconnecting in ").concat(backoffMs, "ms:"), iterError.message);
                                        return [4 /*yield*/, delay(backoffMs)];
                                    case 8:
                                        _f.sent();
                                        backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
                                        return [3 /*break*/, 11];
                                    case 9:
                                        // Stream ended cleanly (server closed connection, empty response)
                                        // without an error. Apply backoff before reconnecting to prevent
                                        // a tight loop when the server keeps dropping connections.
                                        logger.log("[LISTENER] Stream ended normally for thread ".concat(this_1.threadId, ", reconnecting in ").concat(backoffMs, "ms"));
                                        return [4 /*yield*/, delay(backoffMs)];
                                    case 10:
                                        _f.sent();
                                        backoffMs = Math.min(backoffMs * 2, maxBackoffMs);
                                        _f.label = 11;
                                    case 11: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _e.label = 2;
                    case 2:
                        if (!(!loopSignal.aborted && !this.disposed)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_2()];
                    case 3:
                        state_1 = _e.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        return [3 /*break*/, 2];
                    case 4:
                        // Loop exited. Only reset listenerLoopRunning if OUR controller is still
                        // the active one. If handleSharedServerStarted replaced it (loopSignal is
                        // aborted but state has a different controller), a new listener has already
                        // set listenerLoopRunning = true — overwriting it here would clobber the
                        // new listener's flag.
                        if (((_c = (_b = this.state) === null || _b === void 0 ? void 0 : _b.listenerController) === null || _c === void 0 ? void 0 : _c.signal) === loopSignal
                            || !((_d = this.state) === null || _d === void 0 ? void 0 : _d.listenerController)) {
                            this.listenerLoopRunning = false;
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // ── Session Demux Guard ─────────────────────────────────────
    // Events scoped to a session must match the current session.
    // Global events (tui.toast.show) bypass the guard.
    // Subtask sessions also bypass — they're tracked in subtaskSessions.
    ThreadSessionRuntime.prototype.handleEvent = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, eventSessionId, toastSessionId, eventDetails, isGlobalEvent, isScopedToastEvent, eventLogResult, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        // session.diff can carry repeated full-file before/after snapshots and is
                        // not used by event-derived runtime state, queueing, typing, or UI routing.
                        // Drop it at ingress so large diff payloads never hit memory buffers.
                        if (event.type === 'session.diff') {
                            return [2 /*return*/];
                        }
                        // Skip message.part.delta from the event buffer — no derivation function
                        // (isSessionBusy, doesLatestUserTurnHaveNaturalCompletion, waitForEvent,
                        // etc.) uses them. During long streaming responses they flood the 1000-slot
                        // buffer, evicting session.status busy events that isSessionBusy needs,
                        // causing tryDrainQueue to drain the local queue while the session is
                        // actually still busy. This was the root cause of "? queue" messages
                        // interrupting instead of queuing.
                        if (event.type !== 'message.part.delta') {
                            this.appendEventToBuffer(event);
                        }
                        sessionId = (_b = this.state) === null || _b === void 0 ? void 0 : _b.sessionId;
                        eventSessionId = (0, opencode_session_event_log_js_1.getOpencodeEventSessionId)(event);
                        toastSessionId = event.type === 'tui.toast.show'
                            ? extractToastSessionId({ message: event.properties.message })
                            : undefined;
                        if (shouldLogSessionEvents) {
                            eventDetails = (function () {
                                var _a;
                                if (event.type === 'session.error') {
                                    var errorName = ((_a = event.properties.error) === null || _a === void 0 ? void 0 : _a.name) || 'unknown';
                                    return " error=".concat(errorName);
                                }
                                if (event.type === 'session.status') {
                                    var status_1 = event.properties.status || 'unknown';
                                    return " status=".concat(status_1);
                                }
                                if (event.type === 'message.updated') {
                                    return " role=".concat(event.properties.info.role, " messageID=").concat(event.properties.info.id);
                                }
                                if (event.type === 'message.part.updated') {
                                    var partType = event.properties.part.type;
                                    var partId = event.properties.part.id;
                                    var messageId = event.properties.part.messageID;
                                    var toolSuffix = partType === 'tool'
                                        ? " tool=".concat(event.properties.part.tool, " status=").concat(event.properties.part.state.status)
                                        : '';
                                    return " part=".concat(partType, " partID=").concat(partId, " messageID=").concat(messageId).concat(toolSuffix);
                                }
                                return '';
                            })();
                            logger.log("[EVENT] type=".concat(event.type, " eventSessionId=").concat(eventSessionId || 'none', " activeSessionId=").concat(sessionId || 'none', " ").concat(this.formatRunStateForLog()).concat(eventDetails));
                        }
                        isGlobalEvent = event.type === 'tui.toast.show';
                        isScopedToastEvent = Boolean(toastSessionId);
                        // Drop events that don't match current session (stale events from
                        // previous sessions), unless it's a global event or a subtask session.
                        if (!isGlobalEvent && eventSessionId && eventSessionId !== sessionId) {
                            if (!this.getSubtaskInfoForSession(eventSessionId)) {
                                return [2 /*return*/]; // stale event from previous session
                            }
                        }
                        if (isScopedToastEvent && toastSessionId !== sessionId) {
                            if (!this.getSubtaskInfoForSession(toastSessionId)) {
                                return [2 /*return*/];
                            }
                        }
                        if (!(0, opencode_session_event_log_js_1.isOpencodeSessionEventLogEnabled)()) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, opencode_session_event_log_js_1.appendOpencodeSessionEventLog)({
                                threadId: this.threadId,
                                projectDirectory: this.projectDirectory,
                                event: event,
                            })];
                    case 1:
                        eventLogResult = _c.sent();
                        if (eventLogResult instanceof Error) {
                            logger.error('[SESSION EVENT JSONL] Failed to write session event log:', eventLogResult);
                        }
                        _c.label = 2;
                    case 2:
                        _a = event.type;
                        switch (_a) {
                            case 'message.updated': return [3 /*break*/, 3];
                            case 'message.part.updated': return [3 /*break*/, 5];
                            case 'session.idle': return [3 /*break*/, 7];
                            case 'session.error': return [3 /*break*/, 9];
                            case 'permission.asked': return [3 /*break*/, 11];
                            case 'permission.replied': return [3 /*break*/, 13];
                            case 'question.asked': return [3 /*break*/, 14];
                            case 'question.replied': return [3 /*break*/, 16];
                            case 'session.status': return [3 /*break*/, 17];
                            case 'session.updated': return [3 /*break*/, 19];
                            case 'tui.toast.show': return [3 /*break*/, 21];
                        }
                        return [3 /*break*/, 23];
                    case 3: return [4 /*yield*/, this.handleMessageUpdated(event.properties.info)];
                    case 4:
                        _c.sent();
                        return [3 /*break*/, 24];
                    case 5: return [4 /*yield*/, this.handlePartUpdated(event.properties.part)];
                    case 6:
                        _c.sent();
                        return [3 /*break*/, 24];
                    case 7: return [4 /*yield*/, this.handleSessionIdle(event.properties.sessionID)];
                    case 8:
                        _c.sent();
                        return [3 /*break*/, 24];
                    case 9: return [4 /*yield*/, this.handleSessionError(event.properties)];
                    case 10:
                        _c.sent();
                        return [3 /*break*/, 24];
                    case 11: return [4 /*yield*/, this.handlePermissionAsked(event.properties)];
                    case 12:
                        _c.sent();
                        return [3 /*break*/, 24];
                    case 13:
                        this.handlePermissionReplied(event.properties);
                        return [3 /*break*/, 24];
                    case 14: return [4 /*yield*/, this.handleQuestionAsked(event.properties)];
                    case 15:
                        _c.sent();
                        return [3 /*break*/, 24];
                    case 16:
                        this.handleQuestionReplied(event.properties);
                        return [3 /*break*/, 24];
                    case 17: return [4 /*yield*/, this.handleSessionStatus(event.properties)];
                    case 18:
                        _c.sent();
                        return [3 /*break*/, 24];
                    case 19: return [4 /*yield*/, this.handleSessionUpdated(event.properties.info)];
                    case 20:
                        _c.sent();
                        return [3 /*break*/, 24];
                    case 21: return [4 /*yield*/, this.handleTuiToast(event.properties)];
                    case 22:
                        _c.sent();
                        return [3 /*break*/, 24];
                    case 23: return [3 /*break*/, 24];
                    case 24: return [2 /*return*/];
                }
            });
        });
    };
    // ── Serialized Action Queue (§7.4) ──────────────────────────
    // Serializes event handling + local-queue state mutations.
    ThreadSessionRuntime.prototype.dispatchAction = function (action) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.disposed) {
                    return [2 /*return*/];
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        _this.actionQueue.push(function () { return __awaiter(_this, void 0, void 0, function () {
                            var result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (this.disposed) {
                                            resolve();
                                            return [2 /*return*/];
                                        }
                                        return [4 /*yield*/, errore.tryAsync(action)];
                                    case 1:
                                        result = _a.sent();
                                        if (result instanceof Error) {
                                            reject(result);
                                            return [2 /*return*/];
                                        }
                                        resolve();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        void _this.processActionQueue();
                    })];
            });
        });
    };
    // Process serialized action queue. Uses try/finally to guarantee
    // processingAction is always reset — if we didn't, a thrown action
    // would leave the flag true and deadlock all future actions.
    ThreadSessionRuntime.prototype.processActionQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var next, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.processingAction) {
                            return [2 /*return*/];
                        }
                        this.processingAction = true;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 5, 6]);
                        _a.label = 2;
                    case 2:
                        if (!(this.actionQueue.length > 0)) return [3 /*break*/, 4];
                        next = this.actionQueue.shift();
                        if (!next) {
                            return [3 /*break*/, 2];
                        }
                        return [4 /*yield*/, errore.tryAsync(next)];
                    case 3:
                        result = _a.sent();
                        if (result instanceof Error) {
                            logger.error('[ACTION QUEUE] Unexpected action failure:', result);
                        }
                        return [3 /*break*/, 2];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        this.processingAction = false;
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // ── Typing Indicator Management ─────────────────────────────
    ThreadSessionRuntime.prototype.hasPendingQuestionUi = function () {
        var _this = this;
        return __spreadArray([], ask_question_js_1.pendingQuestionContexts.values(), true).some(function (ctx) {
            return ctx.thread.id === _this.thread.id;
        });
    };
    ThreadSessionRuntime.prototype.hasPendingInteractiveUi = function () {
        var _this = this;
        var _a, _b;
        if (this.hasPendingQuestionUi()) {
            return true;
        }
        var hasPendingActionButtons = __spreadArray([], action_buttons_js_1.pendingActionButtonContexts.values(), true).some(function (ctx) {
            return ctx.thread.id === _this.thread.id;
        });
        if (hasPendingActionButtons) {
            return true;
        }
        var hasPendingFileUpload = __spreadArray([], file_upload_js_1.pendingFileUploadContexts.values(), true).some(function (ctx) {
            return ctx.thread.id === _this.thread.id;
        });
        if (hasPendingFileUpload) {
            return true;
        }
        return ((_b = (_a = exports.pendingPermissions.get(this.thread.id)) === null || _a === void 0 ? void 0 : _a.size) !== null && _b !== void 0 ? _b : 0) > 0;
    };
    ThreadSessionRuntime.prototype.onInteractiveUiStateChanged = function () {
        var _this = this;
        this.ensureTypingNow();
        void this.dispatchAction(function () {
            return _this.tryDrainQueue({ showIndicator: true });
        });
    };
    ThreadSessionRuntime.prototype.shouldTypeNow = function () {
        var _a;
        if (this.listenerAborted) {
            return false;
        }
        if (this.hasPendingInteractiveUi()) {
            return false;
        }
        var sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
        if (!sessionId) {
            return false;
        }
        return (0, event_stream_state_js_1.isSessionBusy)({ events: this.eventBuffer, sessionId: sessionId });
    };
    ThreadSessionRuntime.prototype.sendTypingPulse = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, errore.tryAsync(function () {
                            return _this.thread.sendTyping();
                        })];
                    case 1:
                        result = _a.sent();
                        if (result instanceof Error) {
                            discordLogger.log("Failed to send typing: ".concat(result));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.clearTypingKeepalive = function () {
        if (!this.typingKeepaliveTimeout) {
            return;
        }
        clearTimeout(this.typingKeepaliveTimeout);
        this.typingKeepaliveTimeout = null;
    };
    ThreadSessionRuntime.prototype.armTypingKeepalive = function (_a) {
        var _this = this;
        var delayMs = _a.delayMs;
        this.typingKeepaliveTimeout = setTimeout(function () {
            var activeTimer = _this.typingKeepaliveTimeout;
            if (!activeTimer) {
                return;
            }
            void (function () { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.shouldTypeNow()) {
                                this.stopTyping();
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, this.sendTypingPulse()];
                        case 1:
                            _a.sent();
                            if (this.typingKeepaliveTimeout !== activeTimer) {
                                return [2 /*return*/];
                            }
                            if (!this.shouldTypeNow()) {
                                this.stopTyping();
                                return [2 /*return*/];
                            }
                            this.armTypingKeepalive({ delayMs: 7000 });
                            return [2 /*return*/];
                    }
                });
            }); })();
        }, delayMs);
    };
    ThreadSessionRuntime.prototype.restartTypingKeepalive = function (_a) {
        var sendNow = _a.sendNow;
        this.clearTypingKeepalive();
        this.armTypingKeepalive({ delayMs: sendNow ? 0 : 7000 });
    };
    ThreadSessionRuntime.prototype.ensureTypingNow = function () {
        if (!this.shouldTypeNow()) {
            this.stopTyping();
            return;
        }
        if (!this.typingKeepaliveTimeout && !this.typingRepulseDebounce.isPending()) {
            this.armTypingKeepalive({ delayMs: 0 });
            return;
        }
        this.typingRepulseDebounce.trigger();
    };
    ThreadSessionRuntime.prototype.ensureTypingKeepalive = function () {
        if (!this.shouldTypeNow()) {
            this.stopTyping();
            return;
        }
        if (this.typingKeepaliveTimeout || this.typingRepulseDebounce.isPending()) {
            return;
        }
        this.armTypingKeepalive({ delayMs: 7000 });
    };
    ThreadSessionRuntime.prototype.stopTyping = function () {
        this.typingRepulseDebounce.clear();
        this.clearTypingKeepalive();
    };
    ThreadSessionRuntime.prototype.requestTypingRepulse = function () {
        if (!this.shouldTypeNow()) {
            return;
        }
        this.typingRepulseDebounce.trigger();
    };
    // ── Part Buffering & Output ─────────────────────────────────
    ThreadSessionRuntime.prototype.getVerbosityChannelId = function () {
        return this.channelId || this.thread.parentId || this.thread.id;
    };
    ThreadSessionRuntime.prototype.getVerbosity = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, (0, database_js_1.getChannelVerbosity)(this.getVerbosityChannelId())];
            });
        });
    };
    ThreadSessionRuntime.prototype.storePart = function (part) {
        var messageParts = this.partBuffer.get(part.messageID) || new Map();
        messageParts.set(part.id, part);
        this.partBuffer.set(part.messageID, messageParts);
    };
    ThreadSessionRuntime.prototype.getBufferedParts = function (messageID) {
        var _a, _b;
        return Array.from((_b = (_a = this.partBuffer.get(messageID)) === null || _a === void 0 ? void 0 : _a.values()) !== null && _b !== void 0 ? _b : []);
    };
    ThreadSessionRuntime.prototype.clearBufferedPartsForMessages = function (messageIDs) {
        var _this = this;
        var uniqueMessageIDs = new Set(messageIDs);
        uniqueMessageIDs.forEach(function (messageID) {
            _this.partBuffer.delete(messageID);
        });
    };
    ThreadSessionRuntime.prototype.hasBufferedStepFinish = function (messageID) {
        return this.getBufferedParts(messageID).some(function (part) {
            return part.type === 'step-finish';
        });
    };
    ThreadSessionRuntime.prototype.shouldSendPart = function (_a) {
        var _b;
        var part = _a.part, force = _a.force;
        if (part.type === 'step-start' || part.type === 'step-finish') {
            return false;
        }
        if (part.type === 'tool' && part.state.status === 'pending') {
            return false;
        }
        if (!force && part.type === 'text' && !((_b = part.time) === null || _b === void 0 ? void 0 : _b.end)) {
            return false;
        }
        if (!force && part.type === 'tool' && part.state.status === 'completed') {
            return false;
        }
        return true;
    };
    ThreadSessionRuntime.prototype.sendPartMessage = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var verbosity, content, sendResult;
            var _this = this;
            var _c;
            var part = _b.part, _d = _b.repulseTyping, repulseTyping = _d === void 0 ? true : _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4 /*yield*/, this.getVerbosity()];
                    case 1:
                        verbosity = _e.sent();
                        if (verbosity === 'text_only' && part.type !== 'text') {
                            return [2 /*return*/];
                        }
                        if (verbosity === 'text_and_essential_tools') {
                            if (part.type !== 'text' && !(part.type === 'tool' && isEssentialToolPart(part))) {
                                return [2 /*return*/];
                            }
                        }
                        content = (0, message_formatting_js_1.formatPart)(part);
                        if (!content.trim() || content.length === 0) {
                            return [2 /*return*/];
                        }
                        if ((_c = this.state) === null || _c === void 0 ? void 0 : _c.sentPartIds.has(part.id)) {
                            return [2 /*return*/];
                        }
                        // Mark as sent BEFORE the async send to prevent concurrent flushes
                        // from sending the same part while this await is in-flight.
                        threadState.updateThread(this.threadId, function (t) {
                            var newIds = new Set(t.sentPartIds);
                            newIds.add(part.id);
                            return __assign(__assign({}, t), { sentPartIds: newIds });
                        });
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return (0, discord_utils_js_1.sendThreadMessage)(_this.thread, content);
                            })];
                    case 2:
                        sendResult = _e.sent();
                        if (sendResult instanceof Error) {
                            threadState.updateThread(this.threadId, function (t) {
                                var newIds = new Set(t.sentPartIds);
                                newIds.delete(part.id);
                                return __assign(__assign({}, t), { sentPartIds: newIds });
                            });
                            discordLogger.error("ERROR: Failed to send part ".concat(part.id, ":"), sendResult);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, (0, database_js_1.setPartMessage)({ partId: part.id, messageId: sendResult.id, threadId: this.thread.id })];
                    case 3:
                        _e.sent();
                        if (repulseTyping) {
                            this.requestTypingRepulse();
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.flushBufferedParts = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var parts, _i, parts_1, part;
            var messageID = _b.messageID, force = _b.force, skipPartId = _b.skipPartId, _c = _b.repulseTyping, repulseTyping = _c === void 0 ? true : _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!messageID) {
                            return [2 /*return*/];
                        }
                        parts = this.getBufferedParts(messageID);
                        _i = 0, parts_1 = parts;
                        _d.label = 1;
                    case 1:
                        if (!(_i < parts_1.length)) return [3 /*break*/, 4];
                        part = parts_1[_i];
                        if (skipPartId && part.id === skipPartId) {
                            return [3 /*break*/, 3];
                        }
                        if (!this.shouldSendPart({ part: part, force: force })) {
                            return [3 /*break*/, 3];
                        }
                        return [4 /*yield*/, this.sendPartMessage({ part: part, repulseTyping: repulseTyping })];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.flushBufferedPartsForMessages = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var uniqueMessageIDs, _i, uniqueMessageIDs_1, messageID;
            var messageIDs = _b.messageIDs, force = _b.force, skipPartId = _b.skipPartId, _c = _b.repulseTyping, repulseTyping = _c === void 0 ? true : _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        uniqueMessageIDs = __spreadArray([], new Set(messageIDs), true);
                        _i = 0, uniqueMessageIDs_1 = uniqueMessageIDs;
                        _d.label = 1;
                    case 1:
                        if (!(_i < uniqueMessageIDs_1.length)) return [3 /*break*/, 4];
                        messageID = uniqueMessageIDs_1[_i];
                        return [4 /*yield*/, this.flushBufferedParts({
                                messageID: messageID,
                                force: force,
                                skipPartId: skipPartId,
                                repulseTyping: repulseTyping,
                            })];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.showInteractiveUi = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var sessionId, targetMessageId, assistantMessageIds;
            var _this = this;
            var _c;
            var skipPartId = _b.skipPartId, flushMessageId = _b.flushMessageId, show = _b.show;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.stopTyping();
                        sessionId = (_c = this.state) === null || _c === void 0 ? void 0 : _c.sessionId;
                        targetMessageId = (function () {
                            if (flushMessageId) {
                                return flushMessageId;
                            }
                            if (!sessionId) {
                                return undefined;
                            }
                            return _this.getLatestAssistantMessageIdForCurrentTurn({ sessionId: sessionId });
                        })();
                        if (!targetMessageId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.flushBufferedParts({
                                messageID: targetMessageId,
                                force: true,
                                skipPartId: skipPartId,
                            })];
                    case 1:
                        _d.sent();
                        return [3 /*break*/, 4];
                    case 2:
                        assistantMessageIds = sessionId
                            ? __spreadArray([], this.getAssistantMessageIdsForCurrentTurn({ sessionId: sessionId }), true) : [];
                        return [4 /*yield*/, this.flushBufferedPartsForMessages({
                                messageIDs: assistantMessageIds,
                                force: true,
                                skipPartId: skipPartId,
                            })];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4: return [4 /*yield*/, show()];
                    case 5:
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.ensureModelContextLimit = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var key, client, providersResponse, provider, model, contextLimit;
            var _this = this;
            var _c, _d, _e, _f;
            var providerID = _b.providerID, modelID = _b.modelID;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        key = "".concat(providerID, "/").concat(modelID);
                        if (this.modelContextLimit && this.modelContextLimitKey === key) {
                            return [2 /*return*/];
                        }
                        client = (0, opencode_js_1.getOpencodeClient)(this.projectDirectory);
                        if (!client) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return client.provider.list({ directory: _this.sdkDirectory });
                            })];
                    case 1:
                        providersResponse = _g.sent();
                        if (providersResponse instanceof Error) {
                            logger.error('Failed to fetch provider info for context limit:', providersResponse);
                            return [2 /*return*/];
                        }
                        provider = (_d = (_c = providersResponse.data) === null || _c === void 0 ? void 0 : _c.all) === null || _d === void 0 ? void 0 : _d.find(function (p) {
                            return p.id === providerID;
                        });
                        model = (_e = provider === null || provider === void 0 ? void 0 : provider.models) === null || _e === void 0 ? void 0 : _e[modelID];
                        contextLimit = ((_f = model === null || model === void 0 ? void 0 : model.limit) === null || _f === void 0 ? void 0 : _f.context) || getFallbackContextLimit({
                            providerID: providerID,
                        });
                        if (!contextLimit) {
                            return [2 /*return*/];
                        }
                        this.modelContextLimit = contextLimit;
                        this.modelContextLimitKey = key;
                        return [2 /*return*/];
                }
            });
        });
    };
    // ── Event Handlers ──────────────────────────────────────────
    // Extracted from session-handler.ts eventHandler closure.
    // These operate on runtime instance state + global store transitions.
    ThreadSessionRuntime.prototype.handleMessageUpdated = function (msg) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, knownMessage, messageParts, wasAlreadyCompleted, completedAt, latestRunInfo, currentPercentage, thresholdCrossed, chunk, sendResult;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
                        if (msg.sessionID !== sessionId) {
                            return [2 /*return*/];
                        }
                        if (msg.role !== 'assistant') {
                            return [2 /*return*/];
                        }
                        if (!sessionId) {
                            return [2 /*return*/];
                        }
                        if (!(0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
                            events: this.eventBuffer,
                            sessionId: sessionId,
                            messageId: msg.id,
                        })) {
                            logger.info("[SKIP] message.updated for old assistant message ".concat(msg.id, ", not in latest user turn"));
                            return [2 /*return*/];
                        }
                        knownMessage = this.partBuffer.has(msg.id);
                        // promptAsync paths can deliver complete parts via message.updated even when
                        // message.part.updated events are sparse or absent. Seed the part buffer
                        // from message.parts when we have not seen per-part events for this message.
                        if (!knownMessage) {
                            messageParts = (function () {
                                var candidate = msg;
                                if (!Array.isArray(candidate.parts)) {
                                    return [];
                                }
                                return candidate.parts.filter(function (part) {
                                    if (!part || typeof part !== 'object') {
                                        return false;
                                    }
                                    var maybePart = part;
                                    return (typeof maybePart.id === 'string' &&
                                        typeof maybePart.type === 'string' &&
                                        typeof maybePart.messageID === 'string');
                                });
                            })();
                            messageParts.forEach(function (part) {
                                _this.storePart(part);
                            });
                        }
                        return [4 /*yield*/, this.flushBufferedParts({
                                messageID: msg.id,
                                force: false,
                            })];
                    case 1:
                        _b.sent();
                        wasAlreadyCompleted = (0, event_stream_state_js_1.hasAssistantMessageCompletedBefore)({
                            events: this.eventBuffer,
                            sessionId: sessionId,
                            messageId: msg.id,
                            upToIndex: this.eventBuffer.length - 2,
                        });
                        completedAt = msg.time.completed;
                        if (!(!wasAlreadyCompleted
                            && typeof completedAt === 'number'
                            && (0, event_stream_state_js_1.isAssistantMessageNaturalCompletion)({ message: msg }))) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.handleNaturalAssistantCompletion({
                                completedMessageId: msg.id,
                                completedAt: completedAt,
                            })];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                    case 3:
                        // Context usage notice.
                        // Skip the final assistant update for a run: by the time the last
                        // message.updated arrives, the final text part has already ended and the
                        // buffered parts usually include step-finish, so a notice here would land
                        // immediately above the footer and add noise.
                        if (this.hasBufferedStepFinish(msg.id)) {
                            return [2 /*return*/];
                        }
                        latestRunInfo = (0, event_stream_state_js_1.getLatestRunInfo)({
                            events: this.eventBuffer,
                            sessionId: sessionId,
                        });
                        if (latestRunInfo.tokensUsed === 0
                            || !latestRunInfo.providerID
                            || !latestRunInfo.model) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.ensureModelContextLimit({
                                providerID: latestRunInfo.providerID,
                                modelID: latestRunInfo.model,
                            })];
                    case 4:
                        _b.sent();
                        if (!this.modelContextLimit) {
                            return [2 /*return*/];
                        }
                        currentPercentage = Math.floor((latestRunInfo.tokensUsed / this.modelContextLimit) * 100);
                        thresholdCrossed = Math.floor(currentPercentage / 10) * 10;
                        if (thresholdCrossed <= this.lastDisplayedContextPercentage ||
                            thresholdCrossed < 10) {
                            return [2 /*return*/];
                        }
                        this.lastDisplayedContextPercentage = thresholdCrossed;
                        chunk = "\u2B26 context usage ".concat(currentPercentage, "%");
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return _this.thread.send({ content: chunk, flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS });
                            })];
                    case 5:
                        sendResult = _b.sent();
                        if (sendResult instanceof Error) {
                            discordLogger.error('Failed to send context usage notice:', sendResult);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handlePartUpdated = function (part) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, subtaskInfo, isSubtaskEvent;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.storePart(part);
                        sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
                        subtaskInfo = this.getSubtaskInfoForSession(part.sessionID);
                        isSubtaskEvent = Boolean(subtaskInfo);
                        if (part.sessionID !== sessionId && !isSubtaskEvent) {
                            return [2 /*return*/];
                        }
                        if (!(isSubtaskEvent && subtaskInfo)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.handleSubtaskPart(part, subtaskInfo)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                    case 2: return [4 /*yield*/, this.handleMainPart(part)];
                    case 3:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handleMainPart = function (part) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, description, agent, childSessionId, taskDisplay_1, sendResult, sessionId_1, sessionId_2, isCurrentRunMessage, showLargeOutput, output, outputTokens_1, largeOutputThreshold, latestRunInfo, formattedTokens, percentageSuffix, chunk_1, largeOutputResult;
            var _this = this;
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
                        if (part.type === 'step-start') {
                            this.ensureTypingNow();
                            return [2 /*return*/];
                        }
                        if (!(part.type === 'tool' && part.state.status === 'running')) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.flushBufferedParts({
                                messageID: part.messageID,
                                force: true,
                                skipPartId: part.id,
                            })];
                    case 1:
                        _j.sent();
                        return [4 /*yield*/, this.sendPartMessage({ part: part })
                            // Track task tool spawning subtask sessions
                        ];
                    case 2:
                        _j.sent();
                        if (!(part.tool === 'task' && !((_b = this.state) === null || _b === void 0 ? void 0 : _b.sentPartIds.has(part.id)))) return [3 /*break*/, 6];
                        description = typeof ((_c = part.state.input) === null || _c === void 0 ? void 0 : _c.description) === 'string'
                            ? part.state.input.description
                            : '';
                        agent = typeof ((_d = part.state.input) === null || _d === void 0 ? void 0 : _d.subagent_type) === 'string'
                            ? part.state.input.subagent_type
                            : 'task';
                        childSessionId = typeof ((_e = part.state.metadata) === null || _e === void 0 ? void 0 : _e.sessionId) === 'string'
                            ? part.state.metadata.sessionId
                            : '';
                        if (!(description && childSessionId)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.getVerbosity()];
                    case 3:
                        if (!((_j.sent()) !== 'text_only')) return [3 /*break*/, 6];
                        taskDisplay_1 = "\u2523 ".concat(agent, " **").concat(description, "**");
                        threadState.updateThread(this.threadId, function (t) {
                            var newIds = new Set(t.sentPartIds);
                            newIds.add(part.id);
                            return __assign(__assign({}, t), { sentPartIds: newIds });
                        });
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return (0, discord_utils_js_1.sendThreadMessage)(_this.thread, taskDisplay_1 + '\n\n');
                            })];
                    case 4:
                        sendResult = _j.sent();
                        if (sendResult instanceof Error) {
                            threadState.updateThread(this.threadId, function (t) {
                                var newIds = new Set(t.sentPartIds);
                                newIds.delete(part.id);
                                return __assign(__assign({}, t), { sentPartIds: newIds });
                            });
                            discordLogger.error("ERROR: Failed to send task part ".concat(part.id, ":"), sendResult);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, (0, database_js_1.setPartMessage)({ partId: part.id, messageId: sendResult.id, threadId: this.thread.id })];
                    case 5:
                        _j.sent();
                        _j.label = 6;
                    case 6: return [2 /*return*/];
                    case 7:
                        if (!(part.type === 'tool' &&
                            part.state.status === 'completed' &&
                            part.tool.endsWith('kimaki_action_buttons'))) return [3 /*break*/, 9];
                        sessionId_1 = (_f = this.state) === null || _f === void 0 ? void 0 : _f.sessionId;
                        return [4 /*yield*/, this.showInteractiveUi({
                                skipPartId: part.id,
                                flushMessageId: part.messageID,
                                show: function () { return __awaiter(_this, void 0, void 0, function () {
                                    var request, showResult;
                                    var _this = this;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!sessionId_1) {
                                                    return [2 /*return*/];
                                                }
                                                return [4 /*yield*/, (0, action_buttons_js_1.waitForQueuedActionButtonsRequest)({
                                                        sessionId: sessionId_1,
                                                        timeoutMs: 1500,
                                                    })];
                                            case 1:
                                                request = _a.sent();
                                                if (!request) {
                                                    logger.warn("[ACTION] No queued action-buttons request found for session ".concat(sessionId_1));
                                                    return [2 /*return*/];
                                                }
                                                if (request.threadId !== this.thread.id) {
                                                    logger.warn("[ACTION] Ignoring queued action-buttons for different thread");
                                                    return [2 /*return*/];
                                                }
                                                return [4 /*yield*/, errore.tryAsync(function () {
                                                        return (0, action_buttons_js_1.showActionButtons)({
                                                            thread: _this.thread,
                                                            sessionId: request.sessionId,
                                                            directory: request.directory,
                                                            buttons: request.buttons,
                                                            silent: _this.getQueueLength() > 0,
                                                        });
                                                    })];
                                            case 2:
                                                showResult = _a.sent();
                                                if (!(showResult instanceof Error)) return [3 /*break*/, 4];
                                                logger.error('[ACTION] Failed to show action buttons:', showResult);
                                                return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, "Failed to show action buttons: ".concat(showResult.message), { flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS })];
                                            case 3:
                                                _a.sent();
                                                _a.label = 4;
                                            case 4: return [2 /*return*/];
                                        }
                                    });
                                }); },
                            })];
                    case 8:
                        _j.sent();
                        return [2 /*return*/];
                    case 9:
                        if (!(part.type === 'tool' && part.state.status === 'completed')) return [3 /*break*/, 14];
                        sessionId_2 = (_g = this.state) === null || _g === void 0 ? void 0 : _g.sessionId;
                        if (sessionId_2) {
                            isCurrentRunMessage = (0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
                                events: this.eventBuffer,
                                sessionId: sessionId_2,
                                messageId: part.messageID,
                            });
                            if (!isCurrentRunMessage) {
                                logger.info("[SKIP] tool part ".concat(part.id, " for old assistant message ").concat(part.messageID, ", not in latest user turn"));
                                return [2 /*return*/];
                            }
                        }
                        return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                var verbosity;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.getVerbosity()];
                                        case 1:
                                            verbosity = _a.sent();
                                            if (verbosity === 'text_only') {
                                                return [2 /*return*/, false];
                                            }
                                            if (verbosity === 'text_and_essential_tools') {
                                                return [2 /*return*/, isEssentialToolPart(part)];
                                            }
                                            return [2 /*return*/, true];
                                    }
                                });
                            }); })()];
                    case 10:
                        showLargeOutput = _j.sent();
                        if (!showLargeOutput) return [3 /*break*/, 14];
                        output = part.state.output || '';
                        outputTokens_1 = Math.ceil(output.length / 4);
                        largeOutputThreshold = 3000;
                        if (!(outputTokens_1 >= largeOutputThreshold)) return [3 /*break*/, 14];
                        if (!sessionId_2) return [3 /*break*/, 12];
                        latestRunInfo = (0, event_stream_state_js_1.getLatestRunInfo)({
                            events: this.eventBuffer,
                            sessionId: sessionId_2,
                        });
                        if (!(latestRunInfo.providerID && latestRunInfo.model)) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.ensureModelContextLimit({
                                providerID: latestRunInfo.providerID,
                                modelID: latestRunInfo.model,
                            })];
                    case 11:
                        _j.sent();
                        _j.label = 12;
                    case 12:
                        formattedTokens = outputTokens_1 >= 1000
                            ? "".concat((outputTokens_1 / 1000).toFixed(1), "k")
                            : String(outputTokens_1);
                        percentageSuffix = (function () {
                            if (!_this.modelContextLimit) {
                                return '';
                            }
                            var pct = (outputTokens_1 / _this.modelContextLimit) * 100;
                            if (pct < 1) {
                                return '';
                            }
                            return " (".concat(pct.toFixed(1), "%)");
                        })();
                        chunk_1 = "\u2B26 ".concat(part.tool, " returned ").concat(formattedTokens, " tokens").concat(percentageSuffix);
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return _this.thread.send({
                                    content: chunk_1,
                                    flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                });
                            })];
                    case 13:
                        largeOutputResult = _j.sent();
                        if (largeOutputResult instanceof Error) {
                            discordLogger.error('Failed to send large output notice:', largeOutputResult);
                        }
                        _j.label = 14;
                    case 14:
                        if (!(part.type === 'reasoning')) return [3 /*break*/, 16];
                        return [4 /*yield*/, this.sendPartMessage({ part: part })];
                    case 15:
                        _j.sent();
                        return [2 /*return*/];
                    case 16:
                        if (!(part.type === 'text' && ((_h = part.time) === null || _h === void 0 ? void 0 : _h.end))) return [3 /*break*/, 18];
                        return [4 /*yield*/, this.sendPartMessage({ part: part })];
                    case 17:
                        _j.sent();
                        return [2 /*return*/];
                    case 18:
                        if (!(part.type === 'step-finish')) return [3 /*break*/, 20];
                        return [4 /*yield*/, this.flushBufferedParts({
                                messageID: part.messageID,
                                force: true,
                            })];
                    case 19:
                        _j.sent();
                        this.ensureTypingKeepalive();
                        _j.label = 20;
                    case 20: return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handleSubtaskPart = function (part, subtaskInfo) {
        return __awaiter(this, void 0, void 0, function () {
            var verbosity, content, sendResult;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getVerbosity()];
                    case 1:
                        verbosity = _b.sent();
                        if (verbosity === 'text_only') {
                            return [2 /*return*/];
                        }
                        if (verbosity === 'text_and_essential_tools') {
                            if (!isEssentialToolPart(part)) {
                                return [2 /*return*/];
                            }
                        }
                        if (part.type === 'step-start' || part.type === 'step-finish') {
                            return [2 /*return*/];
                        }
                        if (part.type === 'tool' && part.state.status === 'pending') {
                            return [2 /*return*/];
                        }
                        if (part.type === 'text') {
                            return [2 /*return*/];
                        }
                        if (!subtaskInfo.assistantMessageId ||
                            part.messageID !== subtaskInfo.assistantMessageId) {
                            return [2 /*return*/];
                        }
                        content = (0, message_formatting_js_1.formatPart)(part, subtaskInfo.label);
                        if (!content.trim() || ((_a = this.state) === null || _a === void 0 ? void 0 : _a.sentPartIds.has(part.id))) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return (0, discord_utils_js_1.sendThreadMessage)(_this.thread, content + '\n\n');
                            })];
                    case 2:
                        sendResult = _b.sent();
                        if (sendResult instanceof Error) {
                            discordLogger.error("ERROR: Failed to send subtask part ".concat(part.id, ":"), sendResult);
                            return [2 /*return*/];
                        }
                        threadState.updateThread(this.threadId, function (t) {
                            var newIds = new Set(t.sentPartIds);
                            newIds.add(part.id);
                            return __assign(__assign({}, t), { sentPartIds: newIds });
                        });
                        return [4 /*yield*/, (0, database_js_1.setPartMessage)({ partId: part.id, messageId: sendResult.id, threadId: this.thread.id })];
                    case 3:
                        _b.sent();
                        this.requestTypingRepulse();
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handleSessionIdle = function (idleSessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, subtask, shouldDrainQueuedMessages;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
                        subtask = this.getSubtaskInfoForSession(idleSessionId);
                        if (subtask) {
                            logger.log("[SUBTASK IDLE] Subtask \"".concat(subtask === null || subtask === void 0 ? void 0 : subtask.label, "\" completed"));
                            return [2 /*return*/];
                        }
                        if (!(idleSessionId === sessionId)) return [3 /*break*/, 3];
                        shouldDrainQueuedMessages = (0, event_stream_state_js_1.doesLatestUserTurnHaveNaturalCompletion)({
                            events: this.eventBuffer,
                            sessionId: idleSessionId,
                        });
                        logger.log("[SESSION IDLE] session became idle sessionId=".concat(sessionId, " drainQueue=").concat(shouldDrainQueuedMessages, " ").concat(this.formatRunStateForLog()));
                        return [4 /*yield*/, this.persistEventBufferDebounced.flush()];
                    case 1:
                        _b.sent();
                        if (!shouldDrainQueuedMessages) {
                            return [2 /*return*/];
                        }
                        // Drain any local-queue items that arrived while the session was busy
                        // (e.g. slow voice transcription with queueMessage=true completing
                        // during or just before idle). Same pattern as handleSessionError.
                        return [4 /*yield*/, this.tryDrainQueue({ showIndicator: true })];
                    case 2:
                        // Drain any local-queue items that arrived while the session was busy
                        // (e.g. slow voice transcription with queueMessage=true completing
                        // during or just before idle). Same pattern as handleSessionError.
                        _b.sent();
                        return [2 /*return*/];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handleNaturalAssistantCompletion = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var sessionId, assistantMessageIds, turnStartTime;
            var _c;
            var completedMessageId = _b.completedMessageId, completedAt = _b.completedAt;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        sessionId = (_c = this.state) === null || _c === void 0 ? void 0 : _c.sessionId;
                        if (!sessionId) {
                            return [2 /*return*/];
                        }
                        assistantMessageIds = __spreadArray([], this.getAssistantMessageIdsForCurrentTurn({ sessionId: sessionId }), true);
                        if (assistantMessageIds.length === 0) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.flushBufferedPartsForMessages({
                                messageIDs: assistantMessageIds,
                                force: true,
                                repulseTyping: false,
                            })];
                    case 1:
                        _d.sent();
                        this.stopTyping();
                        turnStartTime = (0, event_stream_state_js_1.getCurrentTurnStartTime)({
                            events: this.eventBuffer,
                            sessionId: sessionId,
                        });
                        if (!(turnStartTime !== undefined)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.emitFooter({
                                completedAt: completedAt,
                                runStartTime: turnStartTime,
                            })];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        this.resetPerRunState();
                        this.clearBufferedPartsForMessages(assistantMessageIds);
                        logger.log("[ASSISTANT COMPLETED] footer emitted for message ".concat(completedMessageId, " sessionId=").concat(sessionId, " ").concat(this.formatRunStateForLog()));
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handleSessionError = function (properties) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, errorMessage;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
                        if (!properties.sessionID || properties.sessionID !== sessionId) {
                            logger.log("Ignoring error for different session (expected: ".concat(sessionId, ", got: ").concat(properties.sessionID, ")"));
                            return [2 /*return*/];
                        }
                        if (!(((_b = properties.error) === null || _b === void 0 ? void 0 : _b.name) === 'MessageAbortedError')) return [3 /*break*/, 2];
                        logger.log("[SESSION ERROR] Operation aborted (expected) sessionId=".concat(sessionId, " ").concat(this.formatRunStateForLog()));
                        return [4 /*yield*/, this.persistEventBufferDebounced.flush()];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                    case 2:
                        errorMessage = formatSessionErrorFromProps(properties.error);
                        logger.error("Sending error to thread: ".concat(errorMessage));
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, "\u2717 opencode session error: ".concat(errorMessage), { flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS })];
                    case 3:
                        _c.sent();
                        return [4 /*yield*/, this.persistEventBufferDebounced.flush()
                            // Inject synthetic idle so isSessionBusy() returns false and queued
                            // messages can drain. Without this, a session error leaves the event
                            // buffer in a "busy" state forever (no session.idle follows the error),
                            // causing local-queue items to be stuck indefinitely. See #74.
                        ];
                    case 4:
                        _c.sent();
                        // Inject synthetic idle so isSessionBusy() returns false and queued
                        // messages can drain. Without this, a session error leaves the event
                        // buffer in a "busy" state forever (no session.idle follows the error),
                        // causing local-queue items to be stuck indefinitely. See #74.
                        this.markQueueDispatchIdle(sessionId);
                        return [4 /*yield*/, this.tryDrainQueue({ showIndicator: true })];
                    case 5:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handlePermissionAsked = function (permission) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, subtaskInfo, isMainSession, isSubtaskSession, subtaskLabel, dedupeKey, threadPermissions, existingPending, added, _a, messageId, contextHash;
            var _this = this;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        sessionId = (_b = this.state) === null || _b === void 0 ? void 0 : _b.sessionId;
                        subtaskInfo = this.getSubtaskInfoForSession(permission.sessionID);
                        isMainSession = permission.sessionID === sessionId;
                        isSubtaskSession = Boolean(subtaskInfo);
                        if (!isMainSession && !isSubtaskSession) {
                            logger.log("[PERMISSION IGNORED] Permission for unknown session (expected: ".concat(sessionId, " or subtask, got: ").concat(permission.sessionID, ")"));
                            return [2 /*return*/];
                        }
                        subtaskLabel = subtaskInfo === null || subtaskInfo === void 0 ? void 0 : subtaskInfo.label;
                        dedupeKey = buildPermissionDedupeKey({
                            permission: permission,
                            directory: this.projectDirectory,
                        });
                        threadPermissions = exports.pendingPermissions.get(this.thread.id);
                        existingPending = threadPermissions
                            ? Array.from(threadPermissions.values()).find(function (pending) {
                                if (pending.dedupeKey === dedupeKey) {
                                    return true;
                                }
                                if (pending.directory !== _this.projectDirectory) {
                                    return false;
                                }
                                if (pending.permission.permission !== permission.permission) {
                                    return false;
                                }
                                return (0, permissions_js_1.arePatternsCoveredBy)({
                                    patterns: permission.patterns,
                                    coveringPatterns: pending.permission.patterns,
                                });
                            })
                            : undefined;
                        if (existingPending) {
                            logger.log("[PERMISSION] Deduped permission ".concat(permission.id, " (matches pending ").concat(existingPending.permission.id, ")"));
                            this.stopTyping();
                            if (!exports.pendingPermissions.has(this.thread.id)) {
                                exports.pendingPermissions.set(this.thread.id, new Map());
                            }
                            exports.pendingPermissions.get(this.thread.id).set(permission.id, {
                                permission: permission,
                                messageId: existingPending.messageId,
                                directory: this.projectDirectory,
                                permissionDirectory: existingPending.permissionDirectory,
                                contextHash: existingPending.contextHash,
                                dedupeKey: dedupeKey,
                            });
                            added = (0, permissions_js_1.addPermissionRequestToContext)({
                                contextHash: existingPending.contextHash,
                                requestId: permission.id,
                            });
                            if (!added) {
                                logger.log("[PERMISSION] Failed to attach duplicate request ".concat(permission.id, " to context"));
                            }
                            return [2 /*return*/];
                        }
                        logger.log("Permission requested: permission=".concat(permission.permission, ", patterns=").concat(permission.patterns.join(', ')).concat(subtaskLabel ? ", subtask=".concat(subtaskLabel) : ''));
                        this.stopTyping();
                        return [4 /*yield*/, (0, permissions_js_1.showPermissionButtons)({
                                thread: this.thread,
                                permission: permission,
                                directory: this.projectDirectory,
                                permissionDirectory: this.sdkDirectory,
                                subtaskLabel: subtaskLabel,
                            })];
                    case 1:
                        _a = _c.sent(), messageId = _a.messageId, contextHash = _a.contextHash;
                        if (!exports.pendingPermissions.has(this.thread.id)) {
                            exports.pendingPermissions.set(this.thread.id, new Map());
                        }
                        exports.pendingPermissions.get(this.thread.id).set(permission.id, {
                            permission: permission,
                            messageId: messageId,
                            directory: this.projectDirectory,
                            permissionDirectory: this.sdkDirectory,
                            contextHash: contextHash,
                            dedupeKey: dedupeKey,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handlePermissionReplied = function (properties) {
        var _a;
        var sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
        var subtaskInfo = this.getSubtaskInfoForSession(properties.sessionID);
        var isMainSession = properties.sessionID === sessionId;
        var isSubtaskSession = Boolean(subtaskInfo);
        if (!isMainSession && !isSubtaskSession) {
            return;
        }
        logger.log("Permission ".concat(properties.requestID, " replied with: ").concat(properties.reply));
        var threadPermissions = exports.pendingPermissions.get(this.thread.id);
        if (!threadPermissions) {
            return;
        }
        var pending = threadPermissions.get(properties.requestID);
        if (!pending) {
            return;
        }
        permissions_js_1.pendingPermissionContexts.delete(pending.contextHash);
        threadPermissions.delete(properties.requestID);
        if (threadPermissions.size === 0) {
            exports.pendingPermissions.delete(this.thread.id);
        }
        this.onInteractiveUiStateChanged();
    };
    ThreadSessionRuntime.prototype.handleQuestionAsked = function (questionRequest) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
                        if (questionRequest.sessionID !== sessionId) {
                            logger.log("[QUESTION IGNORED] Question for different session (expected: ".concat(sessionId, ", got: ").concat(questionRequest.sessionID, ")"));
                            return [2 /*return*/];
                        }
                        logger.log("Question requested: id=".concat(questionRequest.id, ", questions=").concat(questionRequest.questions.length));
                        return [4 /*yield*/, this.showInteractiveUi({
                                show: function () { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!sessionId) {
                                                    return [2 /*return*/];
                                                }
                                                return [4 /*yield*/, (0, ask_question_js_1.showAskUserQuestionDropdowns)({
                                                        thread: this.thread,
                                                        sessionId: sessionId,
                                                        directory: this.projectDirectory,
                                                        requestId: questionRequest.id,
                                                        input: { questions: questionRequest.questions },
                                                        silent: this.getQueueLength() > 0,
                                                    })];
                                            case 1:
                                                _a.sent();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); },
                            })];
                    case 1:
                        _b.sent();
                        this.maybeHandoffQueuedItemForPendingQuestion({
                            sessionId: sessionId,
                            reason: 'question-shown',
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handleQuestionReplied = function (properties) {
        var _a;
        var sessionId = (_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId;
        if (properties.sessionID !== sessionId) {
            return;
        }
        this.onInteractiveUiStateChanged();
        // When a question is answered and the local queue has items, the model may
        // continue the same run without ever reaching the local-queue idle gate.
        // Hand off only the next queued item to OpenCode immediately so the queue
        // resumes, but keep later items local so their `» user:` indicators still
        // appear one-by-one when they actually become active.
        this.maybeHandoffQueuedItemForPendingQuestion({
            sessionId: sessionId,
            reason: 'question-replied',
        });
    };
    ThreadSessionRuntime.prototype.maybeHandoffQueuedItemForPendingQuestion = function (_a) {
        var _this = this;
        var sessionId = _a.sessionId, reason = _a.reason;
        if (!sessionId) {
            return;
        }
        if ((0, event_stream_state_js_1.didQuestionQueueHandoffSinceLatestQuestionAsked)({
            events: this.eventBuffer,
            sessionId: sessionId,
        })) {
            return;
        }
        if (this.getQueueLength() === 0) {
            return;
        }
        if (this.questionQueueHandoffPromise) {
            return;
        }
        logger.log("[QUESTION QUEUE HANDOFF] Queue has ".concat(this.getQueueLength(), " items, handing off first item (").concat(reason, ")"));
        this.questionQueueHandoffPromise = this.handoffQueuedItemForPendingQuestion({
            sessionId: sessionId,
        }).catch(function (error) {
            logger.error('[QUESTION QUEUE HANDOFF] Failed to hand off queued message:', error);
            if (error instanceof Error) {
                void (0, sentry_js_1.notifyError)(error, 'Failed to hand off queued message during pending question');
            }
        }).finally(function () {
            _this.questionQueueHandoffPromise = null;
        });
    };
    ThreadSessionRuntime.prototype.handoffQueuedItemForPendingQuestion = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var next, displayText;
            var _c;
            var sessionId = _b.sessionId;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (this.listenerAborted) {
                            return [2 /*return*/];
                        }
                        if (((_c = this.state) === null || _c === void 0 ? void 0 : _c.sessionId) !== sessionId) {
                            logger.log("[QUESTION QUEUE HANDOFF] Session changed before queue handoff for thread ".concat(this.threadId));
                            return [2 /*return*/];
                        }
                        next = threadState.dequeueItem(this.threadId);
                        if (!next) {
                            return [2 /*return*/];
                        }
                        displayText = next.command
                            ? "/".concat(next.command.name)
                            : "".concat(next.prompt.slice(0, 150)).concat(next.prompt.length > 150 ? '...' : '');
                        if (!displayText.trim()) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, "\u00BB **".concat(next.username, ":** ").concat(displayText))];
                    case 1:
                        _d.sent();
                        _d.label = 2;
                    case 2:
                        this.markQuestionQueueHandoffStarted(sessionId);
                        return [4 /*yield*/, this.submitViaOpencodeQueue(next)];
                    case 3:
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handleSessionStatus = function (properties) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, now, _a, attempt, message, next, remainingMs, remainingSec, duration, chunk, retryResult;
            var _this = this;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        sessionId = (_b = this.state) === null || _b === void 0 ? void 0 : _b.sessionId;
                        if (properties.sessionID !== sessionId) {
                            return [2 /*return*/];
                        }
                        if (properties.status.type === 'idle') {
                            this.stopTyping();
                            return [2 /*return*/];
                        }
                        if (properties.status.type === 'busy') {
                            this.ensureTypingNow();
                            return [2 /*return*/];
                        }
                        if (properties.status.type !== 'retry') {
                            return [2 /*return*/];
                        }
                        now = Date.now();
                        if (now - this.lastRateLimitDisplayTime < 10000) {
                            return [2 /*return*/];
                        }
                        this.lastRateLimitDisplayTime = now;
                        _a = properties.status, attempt = _a.attempt, message = _a.message, next = _a.next;
                        remainingMs = Math.max(0, next - now);
                        remainingSec = Math.ceil(remainingMs / 1000);
                        duration = (function () {
                            if (remainingSec < 60) {
                                return "".concat(remainingSec, "s");
                            }
                            var mins = Math.floor(remainingSec / 60);
                            var secs = remainingSec % 60;
                            return secs > 0 ? "".concat(mins, "m ").concat(secs, "s") : "".concat(mins, "m");
                        })();
                        chunk = "\u2B26 ".concat(message, " - retrying in ").concat(duration, " (attempt #").concat(attempt, ")");
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return _this.thread.send({ content: chunk, flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS });
                            })];
                    case 1:
                        retryResult = _c.sent();
                        if (retryResult instanceof Error) {
                            discordLogger.error('Failed to send retry notice:', retryResult);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // Rename the Discord thread to match the OpenCode-generated session title.
    //
    // Discord rate-limits channel/thread renames heavily — reported as ~2 per
    // 10 minutes per thread (discord/discord-api-docs#1900, discordjs/discord.js#6651)
    // and discord.js setName() can block silently on the 3rd attempt. We therefore:
    // - rename at most once per distinct title (deduped via appliedOpencodeTitle)
    // - race setName() against an AbortSignal.timeout() so a throttled call never
    //   blocks the event loop
    // - fail soft (log + continue) on timeout, 429, or any other error
    ThreadSessionRuntime.prototype.handleSessionUpdated = function (info) {
        return __awaiter(this, void 0, void 0, function () {
            var persistedName, renameDecision, desiredName, normalizedTitle, RENAME_TIMEOUT_MS, timeoutSignal, renameResult;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        // Only act on the main session for this thread
                        if (info.id !== ((_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId)) {
                            return [2 /*return*/];
                        }
                        if (!(this.lastSyncedThreadName === undefined)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.loadLastSyncedThreadName().catch(function (e) {
                                return new Error('Failed to read persisted thread rename state', { cause: e });
                            })];
                    case 1:
                        persistedName = _b.sent();
                        if (persistedName instanceof Error) {
                            logger.warn("[TITLE] ".concat(persistedName.message, " for thread ").concat(this.threadId));
                            return [2 /*return*/];
                        }
                        this.lastSyncedThreadName = persistedName;
                        _b.label = 2;
                    case 2:
                        renameDecision = deriveThreadRenameFromSessionUpdate({
                            sessionTitle: info.title,
                            currentName: this.thread.name,
                            lastSyncedName: this.lastSyncedThreadName,
                        });
                        if (!(renameDecision.desiredName === null)) return [3 /*break*/, 5];
                        if (!(renameDecision.nextSyncedName !== null &&
                            renameDecision.nextSyncedName !== this.lastSyncedThreadName)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.persistLastSyncedThreadName(renameDecision.nextSyncedName)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4: return [2 /*return*/];
                    case 5:
                        desiredName = renameDecision.desiredName;
                        normalizedTitle = info.title.trim();
                        if (this.appliedOpencodeTitle === normalizedTitle) {
                            return [2 /*return*/];
                        }
                        // Mark before the call so concurrent session.updated events don't stack
                        // rename attempts. On failure we keep the mark — a retry won't help
                        // because the failure is almost always a rate limit.
                        this.appliedOpencodeTitle = normalizedTitle;
                        RENAME_TIMEOUT_MS = 3000;
                        timeoutSignal = AbortSignal.timeout(RENAME_TIMEOUT_MS);
                        return [4 /*yield*/, Promise.race([
                                errore.tryAsync({
                                    try: function () { return _this.thread.setName(desiredName); },
                                    catch: function (e) {
                                        return new Error('Failed to rename thread from OpenCode title', {
                                            cause: e,
                                        });
                                    },
                                }),
                                new Promise(function (resolve) {
                                    timeoutSignal.addEventListener('abort', function () {
                                        resolve('timeout');
                                    });
                                }),
                            ])];
                    case 6:
                        renameResult = _b.sent();
                        if (renameResult === 'timeout') {
                            logger.warn("[TITLE] setName timed out after ".concat(RENAME_TIMEOUT_MS, "ms for thread ").concat(this.threadId, " (likely rate-limited)"));
                            return [2 /*return*/];
                        }
                        if (renameResult instanceof Error) {
                            logger.warn("[TITLE] Could not rename thread ".concat(this.threadId, ": ").concat(renameResult.message));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.persistLastSyncedThreadName(desiredName)];
                    case 7:
                        _b.sent();
                        logger.log("[TITLE] Renamed thread ".concat(this.threadId, " to \"").concat(desiredName, "\" from OpenCode session title"));
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.loadLastSyncedThreadName = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db, row;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, database_js_1.getDb)()];
                    case 1:
                        db = _b.sent();
                        return [4 /*yield*/, db.query.thread_sessions.findFirst({
                                where: { thread_id: this.threadId },
                                columns: { last_synced_name: true },
                            })];
                    case 2:
                        row = _b.sent();
                        return [2 /*return*/, (_a = row === null || row === void 0 ? void 0 : row.last_synced_name) !== null && _a !== void 0 ? _a : null];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.persistLastSyncedThreadName = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var db, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.lastSyncedThreadName = name;
                        return [4 /*yield*/, (0, database_js_1.getDb)()];
                    case 1:
                        db = _a.sent();
                        return [4 /*yield*/, db.update(schema.thread_sessions)
                                .set({ last_synced_name: name })
                                .where(orm.eq(schema.thread_sessions.thread_id, this.threadId))
                                .catch(function (e) {
                                return new Error('Failed to persist thread rename state', {
                                    cause: e,
                                });
                            })];
                    case 2:
                        result = _a.sent();
                        if (result instanceof Error) {
                            logger.warn("[TITLE] ".concat(result.message, " for thread ").concat(this.threadId));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.handleTuiToast = function (properties) {
        return __awaiter(this, void 0, void 0, function () {
            var toastSessionId, toastMessage, titlePrefix, chunk, toastResult;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (properties.variant === 'warning') {
                            return [2 /*return*/];
                        }
                        toastSessionId = extractToastSessionId({ message: properties.message });
                        if (!toastSessionId) {
                            return [2 /*return*/];
                        }
                        toastMessage = stripToastSessionId({ message: properties.message }).trim();
                        if (!toastMessage) {
                            return [2 /*return*/];
                        }
                        titlePrefix = properties.title
                            ? "".concat(properties.title.trim(), ": ")
                            : '';
                        chunk = "\u2B26 ".concat(properties.variant, ": ").concat(titlePrefix).concat(toastMessage);
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return _this.thread.send({ content: chunk, flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS });
                            })];
                    case 1:
                        toastResult = _a.sent();
                        if (toastResult instanceof Error) {
                            discordLogger.error('Failed to send toast notice:', toastResult);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // ── Ingress API ─────────────────────────────────────────────
    /**
     * Submit a user turn directly to opencode's internal session queue.
     * This is the default path for normal Discord messages.
     *
     * Mirrors dispatchPrompt's preference resolution, abort handling, and error
     * recovery so that promptAsync receives the same agent/model/variant/system
     * fields that the local-queue path provides.
     */
    ThreadSessionRuntime.prototype.submitViaOpencodeQueue = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var skippedBySessionGuard;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        skippedBySessionGuard = false;
                        return [4 /*yield*/, this.dispatchAction(function () { return __awaiter(_this, void 0, void 0, function () {
                                var cleanupOnError, sessionResult, session, getClient, createdNewSession, channelId, resolvedAppId, agentResult, resolvedAgent, availableAgents, _a, modelResult, preferredVariant, modelField, thinkingValue, variantField, images, promptWithImagePaths, worktreeInfo, worktree, channelTopic, worktreeChanged, syntheticContext, parts, request, promptResult, errorMessage, errObj;
                                var _this = this;
                                var _b, _c, _d, _e, _f, _g;
                                return __generator(this, function (_h) {
                                    switch (_h.label) {
                                        case 0:
                                            if (input.expectedSessionId &&
                                                ((_b = this.state) === null || _b === void 0 ? void 0 : _b.sessionId) !== input.expectedSessionId) {
                                                logger.log("[ENQUEUE] Skipping stale promptAsync enqueue for thread ".concat(this.threadId, ": expected session ").concat(input.expectedSessionId, ", current session ").concat(((_c = this.state) === null || _c === void 0 ? void 0 : _c.sessionId) || 'none'));
                                                skippedBySessionGuard = true;
                                                return [2 /*return*/];
                                            }
                                            cleanupOnError = function (errorMessage) { return __awaiter(_this, void 0, void 0, function () {
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            this.stopTyping();
                                                            return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, errorMessage, {
                                                                    flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                                                                })];
                                                        case 1:
                                                            _a.sent();
                                                            return [4 /*yield*/, this.tryDrainQueue({ showIndicator: true })];
                                                        case 2:
                                                            _a.sent();
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); };
                                            return [4 /*yield*/, this.ensureSession({
                                                    prompt: input.prompt,
                                                    agent: input.agent,
                                                    permissions: input.permissions,
                                                    injectionGuardPatterns: input.injectionGuardPatterns,
                                                    sessionStartScheduleKind: (_d = input.sessionStartSource) === null || _d === void 0 ? void 0 : _d.scheduleKind,
                                                    sessionStartScheduledTaskId: (_e = input.sessionStartSource) === null || _e === void 0 ? void 0 : _e.scheduledTaskId,
                                                })];
                                        case 1:
                                            sessionResult = _h.sent();
                                            if (!(sessionResult instanceof Error)) return [3 /*break*/, 3];
                                            return [4 /*yield*/, cleanupOnError("\u2717 ".concat(sessionResult.message))];
                                        case 2:
                                            _h.sent();
                                            return [2 /*return*/];
                                        case 3:
                                            session = sessionResult.session, getClient = sessionResult.getClient, createdNewSession = sessionResult.createdNewSession;
                                            // If listener startup happened before initializeOpencodeForDirectory(),
                                            // startEventListener may have exited early with "No OpenCode client".
                                            // Re-check after ensureSession so first promptAsync on a cold directory
                                            // still has an active SSE listener for message parts.
                                            if (!this.listenerLoopRunning) {
                                                void this.startEventListener();
                                            }
                                            channelId = this.channelId;
                                            resolvedAppId = input.appId;
                                            if (!(input.agent && createdNewSession)) return [3 /*break*/, 5];
                                            return [4 /*yield*/, (0, database_js_1.setSessionAgent)(session.id, input.agent)];
                                        case 4:
                                            _h.sent();
                                            _h.label = 5;
                                        case 5: return [4 /*yield*/, (0, model_js_1.ensureSessionPreferencesSnapshot)({
                                                sessionId: session.id,
                                                channelId: channelId,
                                                appId: resolvedAppId,
                                                getClient: getClient,
                                                directory: this.sdkDirectory,
                                                agentOverride: input.agent,
                                                modelOverride: input.model,
                                                force: createdNewSession,
                                            })];
                                        case 6:
                                            _h.sent();
                                            return [4 /*yield*/, errore.tryAsync(function () {
                                                    return (0, agent_utils_js_1.resolveValidatedAgentPreference)({
                                                        agent: input.agent,
                                                        sessionId: session.id,
                                                        channelId: channelId,
                                                        getClient: getClient,
                                                        directory: _this.sdkDirectory,
                                                    });
                                                })];
                                        case 7:
                                            agentResult = _h.sent();
                                            if (!(agentResult instanceof Error)) return [3 /*break*/, 9];
                                            return [4 /*yield*/, cleanupOnError("Failed to resolve agent: ".concat(agentResult.message))];
                                        case 8:
                                            _h.sent();
                                            return [2 /*return*/];
                                        case 9:
                                            resolvedAgent = agentResult.agentPreference;
                                            availableAgents = agentResult.agents;
                                            return [4 /*yield*/, Promise.all([
                                                    errore.tryAsync(function () { return __awaiter(_this, void 0, void 0, function () {
                                                        var _a, providerID, modelParts, modelID, modelInfo;
                                                        return __generator(this, function (_b) {
                                                            switch (_b.label) {
                                                                case 0:
                                                                    if (input.model) {
                                                                        _a = input.model.split('/'), providerID = _a[0], modelParts = _a.slice(1);
                                                                        modelID = modelParts.join('/');
                                                                        if (providerID && modelID) {
                                                                            return [2 /*return*/, { providerID: providerID, modelID: modelID }];
                                                                        }
                                                                    }
                                                                    return [4 /*yield*/, (0, model_js_1.getCurrentModelInfo)({
                                                                            sessionId: session.id,
                                                                            channelId: channelId,
                                                                            appId: resolvedAppId,
                                                                            agentPreference: resolvedAgent,
                                                                            getClient: getClient,
                                                                            directory: this.sdkDirectory,
                                                                        })];
                                                                case 1:
                                                                    modelInfo = _b.sent();
                                                                    if (modelInfo.type === 'none') {
                                                                        return [2 /*return*/, undefined];
                                                                    }
                                                                    return [2 /*return*/, { providerID: modelInfo.providerID, modelID: modelInfo.modelID }];
                                                            }
                                                        });
                                                    }); }),
                                                    (0, database_js_1.getVariantCascade)({
                                                        sessionId: session.id,
                                                        channelId: channelId,
                                                        appId: resolvedAppId,
                                                    }),
                                                ])];
                                        case 10:
                                            _a = _h.sent(), modelResult = _a[0], preferredVariant = _a[1];
                                            if (!(modelResult instanceof Error)) return [3 /*break*/, 12];
                                            return [4 /*yield*/, cleanupOnError("Failed to resolve model: ".concat(modelResult.message))];
                                        case 11:
                                            _h.sent();
                                            return [2 /*return*/];
                                        case 12:
                                            modelField = modelResult;
                                            if (!!modelField) return [3 /*break*/, 14];
                                            return [4 /*yield*/, cleanupOnError('No AI provider connected. Configure a provider in OpenCode with `/connect` command.')];
                                        case 13:
                                            _h.sent();
                                            return [2 /*return*/];
                                        case 14: return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                                var providersResponse, availableValues;
                                                var _this = this;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            if (!preferredVariant) {
                                                                return [2 /*return*/, undefined];
                                                            }
                                                            return [4 /*yield*/, errore.tryAsync(function () {
                                                                    return getClient().provider.list({ directory: _this.sdkDirectory });
                                                                })];
                                                        case 1:
                                                            providersResponse = _a.sent();
                                                            if (providersResponse instanceof Error || !providersResponse.data) {
                                                                return [2 /*return*/, undefined];
                                                            }
                                                            availableValues = (0, thinking_utils_js_1.getThinkingValuesForModel)({
                                                                providers: providersResponse.data.all,
                                                                providerId: modelField.providerID,
                                                                modelId: modelField.modelID,
                                                            });
                                                            if (availableValues.length === 0) {
                                                                return [2 /*return*/, undefined];
                                                            }
                                                            return [2 /*return*/, (0, thinking_utils_js_1.matchThinkingValue)({
                                                                    requestedValue: preferredVariant,
                                                                    availableValues: availableValues,
                                                                }) || undefined];
                                                    }
                                                });
                                            }); })()];
                                        case 15:
                                            thinkingValue = _h.sent();
                                            variantField = thinkingValue
                                                ? { variant: thinkingValue }
                                                : {};
                                            return [4 /*yield*/, this.sendNewSessionModelInfo({
                                                    createdNewSession: createdNewSession,
                                                    model: modelField,
                                                    agent: resolvedAgent,
                                                })
                                                // ── Build prompt parts ──────────────────────────────────
                                            ];
                                        case 16:
                                            _h.sent();
                                            images = input.images || [];
                                            promptWithImagePaths = (function () {
                                                if (images.length === 0) {
                                                    return input.prompt;
                                                }
                                                var imageList = images
                                                    .map(function (img) {
                                                    return "- ".concat(img.sourceUrl || img.filename);
                                                })
                                                    .join('\n');
                                                return "".concat(input.prompt, "\n\n**The following images are already included in this message as inline content (do not use Read tool on these):**\n").concat(imageList);
                                            })();
                                            return [4 /*yield*/, (0, database_js_1.getThreadWorktree)(this.thread.id)];
                                        case 17:
                                            worktreeInfo = _h.sent();
                                            worktree = (worktreeInfo === null || worktreeInfo === void 0 ? void 0 : worktreeInfo.status) === 'ready' && worktreeInfo.worktree_directory
                                                ? {
                                                    worktreeDirectory: worktreeInfo.worktree_directory,
                                                    branch: worktreeInfo.worktree_name,
                                                    mainRepoDirectory: worktreeInfo.project_directory,
                                                }
                                                : undefined;
                                            return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                                    var fetched;
                                                    var _this = this;
                                                    var _a, _b, _c;
                                                    return __generator(this, function (_d) {
                                                        switch (_d.label) {
                                                            case 0:
                                                                if (((_a = this.thread.parent) === null || _a === void 0 ? void 0 : _a.type) === discord_js_1.ChannelType.GuildText) {
                                                                    return [2 /*return*/, ((_b = this.thread.parent.topic) === null || _b === void 0 ? void 0 : _b.trim()) || undefined];
                                                                }
                                                                if (!channelId) {
                                                                    return [2 /*return*/, undefined];
                                                                }
                                                                return [4 /*yield*/, errore.tryAsync(function () {
                                                                        return _this.thread.guild.channels.fetch(channelId);
                                                                    })];
                                                            case 1:
                                                                fetched = _d.sent();
                                                                if (fetched instanceof Error || !fetched) {
                                                                    return [2 /*return*/, undefined];
                                                                }
                                                                if (fetched.type !== discord_js_1.ChannelType.GuildText) {
                                                                    return [2 /*return*/, undefined];
                                                                }
                                                                return [2 /*return*/, ((_c = fetched.topic) === null || _c === void 0 ? void 0 : _c.trim()) || undefined];
                                                        }
                                                    });
                                                }); })()];
                                        case 18:
                                            channelTopic = _h.sent();
                                            worktreeChanged = this.consumeWorktreePromptChange(worktree);
                                            syntheticContext = (0, system_message_js_1.getOpencodePromptContext)({
                                                username: input.username,
                                                userId: input.userId,
                                                sourceMessageId: input.sourceMessageId,
                                                sourceThreadId: input.sourceThreadId,
                                                repliedMessage: input.repliedMessage,
                                                worktree: worktree,
                                                currentAgent: resolvedAgent,
                                                worktreeChanged: worktreeChanged,
                                            });
                                            parts = __spreadArray([
                                                { type: 'text', text: promptWithImagePaths },
                                                { type: 'text', text: syntheticContext, synthetic: true }
                                            ], images, true);
                                            request = __assign(__assign(__assign({ sessionID: session.id, directory: this.sdkDirectory, parts: parts, system: (0, system_message_js_1.getOpencodeSystemMessage)({
                                                    sessionId: session.id,
                                                    channelId: channelId,
                                                    guildId: this.thread.guildId,
                                                    threadId: this.thread.id,
                                                    channelTopic: channelTopic,
                                                    agents: availableAgents,
                                                    username: ((_f = this.state) === null || _f === void 0 ? void 0 : _f.sessionUsername) || input.username,
                                                    userId: ((_g = this.state) === null || _g === void 0 ? void 0 : _g.sessionUserId) || input.userId,
                                                }) }, (resolvedAgent ? { agent: resolvedAgent } : {})), (modelField ? { model: modelField } : {})), variantField);
                                            return [4 /*yield*/, errore.tryAsync(function () {
                                                    return getClient().session.promptAsync(request);
                                                })];
                                        case 19:
                                            promptResult = _h.sent();
                                            if (!(promptResult instanceof Error || promptResult.error)) return [3 /*break*/, 21];
                                            errorMessage = (function () {
                                                if (promptResult instanceof Error) {
                                                    return promptResult.message;
                                                }
                                                var err = promptResult.error;
                                                if (err && typeof err === 'object') {
                                                    var data = err.data;
                                                    if (data &&
                                                        typeof data === 'object' &&
                                                        'message' in data) {
                                                        return String(data.message);
                                                    }
                                                    if ('errors' in err &&
                                                        Array.isArray(err.errors) &&
                                                        err.errors.length > 0) {
                                                        return JSON.stringify(err.errors);
                                                    }
                                                }
                                                return 'Unknown OpenCode API error';
                                            })();
                                            errObj = promptResult instanceof Error
                                                ? promptResult
                                                : new Error(errorMessage);
                                            void (0, sentry_js_1.notifyError)(errObj, 'promptAsync failed in submitViaOpencodeQueue');
                                            return [4 /*yield*/, cleanupOnError("\u2717 OpenCode API error: ".concat(errorMessage))];
                                        case 20:
                                            _h.sent();
                                            return [2 /*return*/];
                                        case 21:
                                            logger.log("[INGRESS] promptAsync accepted by opencode queue sessionId=".concat(session.id, " threadId=").concat(this.threadId));
                                            this.markQueueDispatchBusy(session.id);
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _a.sent();
                        if (skippedBySessionGuard) {
                            return [2 /*return*/, { queued: false }];
                        }
                        return [2 /*return*/, { queued: false }];
                }
            });
        });
    };
    /**
     * Enqueue in kimaki's local per-thread queue.
     * Used for explicit queue workflows (/queue, queueMessage=true).
     */
    ThreadSessionRuntime.prototype.enqueueViaLocalQueue = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var queuedMessage, result;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        queuedMessage = {
                            prompt: input.prompt,
                            userId: input.userId,
                            username: input.username,
                            images: input.images,
                            appId: input.appId,
                            command: input.command,
                            agent: input.agent,
                            model: input.model,
                            permissions: input.permissions,
                            injectionGuardPatterns: input.injectionGuardPatterns,
                            sourceMessageId: input.sourceMessageId,
                            sourceThreadId: input.sourceThreadId,
                            repliedMessage: input.repliedMessage,
                            sessionStartScheduleKind: (_a = input.sessionStartSource) === null || _a === void 0 ? void 0 : _a.scheduleKind,
                            sessionStartScheduledTaskId: (_b = input.sessionStartSource) === null || _b === void 0 ? void 0 : _b.scheduledTaskId,
                        };
                        result = { queued: false };
                        return [4 /*yield*/, this.dispatchAction(function () { return __awaiter(_this, void 0, void 0, function () {
                                var stateAfterEnqueue, position, willDrainNow;
                                var _a, _b, _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            // Enqueue the message
                                            threadState.enqueueItem(this.threadId, queuedMessage);
                                            stateAfterEnqueue = threadState.getThreadState(this.threadId);
                                            position = (_a = stateAfterEnqueue === null || stateAfterEnqueue === void 0 ? void 0 : stateAfterEnqueue.queueItems.length) !== null && _a !== void 0 ? _a : 0;
                                            willDrainNow = stateAfterEnqueue
                                                ? (stateAfterEnqueue.queueItems.length > 0
                                                    && !this.isMainSessionBusy())
                                                : false;
                                            result = !willDrainNow && position > 0
                                                ? { queued: true, position: position }
                                                : { queued: false };
                                            // Ensure listener is running
                                            if (!this.listenerLoopRunning && ((_b = this.state) === null || _b === void 0 ? void 0 : _b.sessionId)) {
                                                void this.startEventListener();
                                            }
                                            if (this.hasPendingQuestionUi()) {
                                                this.maybeHandoffQueuedItemForPendingQuestion({
                                                    sessionId: (stateAfterEnqueue === null || stateAfterEnqueue === void 0 ? void 0 : stateAfterEnqueue.sessionId) || ((_c = this.state) === null || _c === void 0 ? void 0 : _c.sessionId),
                                                    reason: 'queue-added-during-question',
                                                });
                                            }
                                            return [4 /*yield*/, this.tryDrainQueue()];
                                        case 1:
                                            _d.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 1:
                        _c.sent();
                        return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Ingress API for Discord handlers and commands.
     * Defaults to opencode queue mode; local queue mode is explicit.
     *
     * When input.preprocess is set, the preprocessor runs inside dispatchAction
     * (serialized) to resolve prompt/images/mode before routing. This replaces
     * the threadIngressQueue that previously serialized pre-enqueue work in
     * discord-bot.ts.
     */
    ThreadSessionRuntime.prototype.enqueueIncoming = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                threadState.setSessionUsername(this.threadId, input.username);
                threadState.setSessionUserId(this.threadId, input.userId);
                // When a preprocessor is provided, we must resolve it inside
                // dispatchAction before we know the final mode for routing.
                if (input.preprocess) {
                    return [2 /*return*/, this.enqueueWithPreprocess(input)];
                }
                // If the prompt starts with `/cmdname ...` (and no explicit command is
                // already set), rewrite it into a command invocation so it goes through
                // opencode's session.command API instead of being sent to the model as
                // plain text. Covers Discord chat messages, /new-session, /queue, CLI
                // `kimaki send --prompt`, and scheduled tasks — all funnel through here.
                input = maybeConvertLeadingCommand(input);
                if (input.mode === 'local-queue') {
                    return [2 /*return*/, this.enqueueViaLocalQueue(input)];
                }
                if (input.command) {
                    // Commands keep using local queue so they still support /queue-command.
                    return [2 /*return*/, this.enqueueViaLocalQueue(input)];
                }
                return [2 /*return*/, this.submitViaOpencodeQueue(input)];
            });
        });
    };
    /**
     * Serialize the preprocess callback via a lightweight promise chain, then
     * route the resolved input through the normal enqueue paths.
     *
     * The preprocess chain is separate from dispatchAction so heavy work
     * (voice transcription, context fetch, attachment download) doesn't
     * block SSE event handling, permission UI, or queue drain. Only the
     * preprocessing order is serialized here — the enqueue itself goes
     * through dispatchAction as usual.
     */
    ThreadSessionRuntime.prototype.enqueueWithPreprocess = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var resolveOuter, rejectOuter, resultPromise;
            var _this = this;
            return __generator(this, function (_a) {
                resultPromise = new Promise(function (resolve, reject) {
                    resolveOuter = resolve;
                    rejectOuter = reject;
                });
                // Chain preprocess + enqueue calls so they run in arrival order but
                // outside dispatchAction. The chain awaits the full enqueue (including
                // ensureSession / setThreadSession) before releasing to the next
                // message, so session-creation races on fresh threads are avoided.
                // The chain itself never rejects (catch + resolve via rejectOuter)
                // so the next link always runs.
                this.preprocessChain = this.preprocessChain.then(function () { return __awaiter(_this, void 0, void 0, function () {
                    var result, resolvedInput, hasPromptText, hasImages, enqueueResult, _a, err_1;
                    var _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                _c.trys.push([0, 6, , 7]);
                                return [4 /*yield*/, input.preprocess()];
                            case 1:
                                result = _c.sent();
                                if (result.skip) {
                                    resolveOuter({ queued: false });
                                    return [2 /*return*/];
                                }
                                resolvedInput = maybeConvertLeadingCommand(__assign(__assign({}, input), { prompt: result.prompt, images: result.images, mode: result.mode, 
                                    // Voice transcription can extract an agent name — apply it only if
                                    // no explicit agent was already set (CLI --agent flag wins).
                                    agent: input.agent || result.agent, repliedMessage: result.repliedMessage, preprocess: undefined }));
                                hasPromptText = resolvedInput.prompt.trim().length > 0;
                                hasImages = (((_b = resolvedInput.images) === null || _b === void 0 ? void 0 : _b.length) || 0) > 0;
                                if (!hasPromptText && !hasImages && !resolvedInput.command) {
                                    logger.warn("[INGRESS] Skipping empty preprocessed input threadId=".concat(this.threadId));
                                    resolveOuter({ queued: false });
                                    return [2 /*return*/];
                                }
                                if (!(resolvedInput.mode === 'local-queue' || resolvedInput.command)) return [3 /*break*/, 3];
                                return [4 /*yield*/, this.enqueueViaLocalQueue(resolvedInput)];
                            case 2:
                                _a = _c.sent();
                                return [3 /*break*/, 5];
                            case 3: return [4 /*yield*/, this.submitViaOpencodeQueue(resolvedInput)];
                            case 4:
                                _a = _c.sent();
                                _c.label = 5;
                            case 5:
                                enqueueResult = _a;
                                resolveOuter(enqueueResult);
                                return [3 /*break*/, 7];
                            case 6:
                                err_1 = _c.sent();
                                rejectOuter(err_1);
                                return [3 /*break*/, 7];
                            case 7: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/, resultPromise];
            });
        });
    };
    /**
     * Abort the currently active run. Does NOT kill the listener.
     * Calls session.abort best-effort and lets event-stream idle settle the run.
     */
    ThreadSessionRuntime.prototype.abortSessionViaApi = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var client, startedAt, abortResult;
            var _this = this;
            var abortId = _b.abortId, reason = _b.reason, sessionId = _b.sessionId;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        client = (0, opencode_js_1.getOpencodeClient)(this.projectDirectory);
                        if (!client) {
                            logger.log("[ABORT API] id=".concat(abortId, " reason=").concat(reason, " sessionId=").concat(sessionId, " skipped=no-client"));
                            return [2 /*return*/];
                        }
                        startedAt = Date.now();
                        logger.log("[ABORT API] id=".concat(abortId, " reason=").concat(reason, " sessionId=").concat(sessionId, " start"));
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return client.session.abort({
                                    sessionID: sessionId,
                                    directory: _this.sdkDirectory,
                                });
                            })];
                    case 1:
                        abortResult = _c.sent();
                        if (!(abortResult instanceof Error)) {
                            logger.log("[ABORT API] id=".concat(abortId, " reason=").concat(reason, " sessionId=").concat(sessionId, " success durationMs=").concat(Date.now() - startedAt));
                            return [2 /*return*/];
                        }
                        logger.log("[ABORT API] id=".concat(abortId, " reason=").concat(reason, " sessionId=").concat(sessionId, " failed durationMs=").concat(Date.now() - startedAt, " message=").concat(abortResult.message));
                        return [2 /*return*/];
                }
            });
        });
    };
    ThreadSessionRuntime.prototype.abortActiveRunInternal = function (_a) {
        var reason = _a.reason;
        var abortId = this.nextAbortId(reason);
        var state = this.state;
        if (!state) {
            logger.log("[ABORT] id=".concat(abortId, " reason=").concat(reason, " threadId=").concat(this.threadId, " skipped=no-state"));
            return {
                abortId: abortId,
                reason: reason,
                apiAbortPromise: undefined,
            };
        }
        var sessionId = state.sessionId;
        var sessionIsBusy = this.isMainSessionBusy();
        logger.log("[ABORT] id=".concat(abortId, " reason=").concat(reason, " threadId=").concat(this.threadId, " sessionId=").concat(sessionId || 'none', " queueLength=").concat(state.queueItems.length, " ").concat(this.formatRunStateForLog(), " sessionBusy=").concat(sessionIsBusy));
        this.stopTyping();
        var apiAbortPromise = sessionId
            ? this.abortSessionViaApi({ abortId: abortId, reason: reason, sessionId: sessionId })
            : undefined;
        logger.log("[ABORT] id=".concat(abortId, " reason=").concat(reason, " threadId=").concat(this.threadId, " apiAbort=").concat(Boolean(sessionId), " ").concat(this.formatRunStateForLog()));
        return {
            abortId: abortId,
            reason: reason,
            apiAbortPromise: apiAbortPromise,
        };
    };
    ThreadSessionRuntime.prototype.abortActiveRun = function (reason) {
        var _this = this;
        var outcome = this.abortActiveRunInternal({
            reason: reason,
        });
        if (outcome.apiAbortPromise) {
            void outcome.apiAbortPromise;
        }
        // Drain local queued messages after explicit abort.
        void this.dispatchAction(function () {
            return _this.tryDrainQueue({ showIndicator: true });
        });
    };
    ThreadSessionRuntime.prototype.abortActiveRunAndWait = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var state, sessionId, needsIdleWait, waitSinceTimestamp, abortResult;
            var _this = this;
            var reason = _b.reason, _c = _b.timeoutMs, timeoutMs = _c === void 0 ? 2000 : _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        state = this.state;
                        sessionId = state === null || state === void 0 ? void 0 : state.sessionId;
                        if (!sessionId) {
                            return [2 /*return*/];
                        }
                        needsIdleWait = false;
                        waitSinceTimestamp = Date.now();
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return _this.dispatchAction(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var outcome;
                                    return __generator(this, function (_a) {
                                        needsIdleWait = this.isMainSessionBusy();
                                        outcome = this.abortActiveRunInternal({ reason: reason });
                                        if (outcome.apiAbortPromise) {
                                            void outcome.apiAbortPromise;
                                        }
                                        return [2 /*return*/];
                                    });
                                }); });
                            })];
                    case 1:
                        abortResult = _d.sent();
                        if (abortResult instanceof Error) {
                            logger.error("[ABORT WAIT] Failed to abort active run: ".concat(abortResult.message));
                            return [2 /*return*/];
                        }
                        if (!needsIdleWait) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.waitForEvent({
                                predicate: function (event) {
                                    return event.type === 'session.idle'
                                        && event.properties.sessionID === sessionId;
                                },
                                sinceTimestamp: waitSinceTimestamp,
                                timeoutMs: timeoutMs,
                            })];
                    case 2:
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Number of messages waiting in the queue. */
    ThreadSessionRuntime.prototype.getQueueLength = function () {
        var _a, _b;
        return (_b = (_a = this.state) === null || _a === void 0 ? void 0 : _a.queueItems.length) !== null && _b !== void 0 ? _b : 0;
    };
    /** NOTIFY_MESSAGE_FLAGS unless queue has a next item, then SILENT.
     * Permissions should NOT use this — they always notify. */
    ThreadSessionRuntime.prototype.getNotifyFlags = function () {
        return this.getQueueLength() > 0
            ? discord_utils_js_1.SILENT_MESSAGE_FLAGS
            : discord_utils_js_1.NOTIFY_MESSAGE_FLAGS;
    };
    /** Clear all queued messages. */
    ThreadSessionRuntime.prototype.clearQueue = function () {
        threadState.clearQueueItems(this.threadId);
    };
    /** Remove a queued message by its 1-based position. */
    ThreadSessionRuntime.prototype.removeQueuePosition = function (position) {
        return threadState.removeQueueItemAtPosition(this.threadId, position);
    };
    // ── Queue Drain ─────────────────────────────────────────────
    /**
     * Check if we can dispatch the next queued message. If so, dequeue and
     * start dispatchPrompt (detached — does not block the action queue).
     * Called after enqueue, after run finishes, or after a blocker resolves.
     *
     * @param showIndicator - When true, shows "» username: prompt" in Discord.
     *   Only set to true when draining after a previous run finishes or a
     *   blocker resolves — not on the immediate first dispatch from enqueueIncoming.
     */
    ThreadSessionRuntime.prototype.tryDrainQueue = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var thread, sessionBusy, next, displayText, dispatchSessionId;
            var _this = this;
            var _b = _a === void 0 ? {} : _a, _c = _b.showIndicator, showIndicator = _c === void 0 ? false : _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        thread = threadState.getThreadState(this.threadId);
                        if (!thread) {
                            return [2 /*return*/];
                        }
                        if (thread.queueItems.length === 0) {
                            return [2 /*return*/];
                        }
                        sessionBusy = thread.sessionId
                            ? (0, event_stream_state_js_1.isSessionBusy)({ events: this.eventBuffer, sessionId: thread.sessionId })
                            : false;
                        if (sessionBusy) {
                            return [2 /*return*/];
                        }
                        next = threadState.dequeueItem(this.threadId);
                        if (!next) {
                            return [2 /*return*/];
                        }
                        logger.log("[QUEUE DRAIN] Processing queued message from ".concat(next.username));
                        if (!showIndicator) return [3 /*break*/, 2];
                        displayText = next.command
                            ? "/".concat(next.command.name)
                            : "".concat(next.prompt.slice(0, 150)).concat(next.prompt.length > 150 ? '...' : '');
                        if (!displayText.trim()) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, "\u00BB **".concat(next.username, ":** ").concat(displayText))];
                    case 1:
                        _d.sent();
                        _d.label = 2;
                    case 2:
                        dispatchSessionId = thread.sessionId;
                        if (dispatchSessionId) {
                            this.markQueueDispatchBusy(dispatchSessionId);
                        }
                        void this.dispatchPrompt(next).catch(function (err) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                logger.error('[DISPATCH] Prompt dispatch failed:', err);
                                void (0, sentry_js_1.notifyError)(err, 'Runtime prompt dispatch failed');
                                if (dispatchSessionId) {
                                    this.markQueueDispatchIdle(dispatchSessionId);
                                }
                                return [2 /*return*/];
                            });
                        }); }).finally(function () {
                            void _this.dispatchAction(function () {
                                return _this.tryDrainQueue({ showIndicator: true });
                            });
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    // ── Prompt Dispatch ─────────────────────────────────────────
    // Resolve session, build system message, send to OpenCode.
    // The listener is already running, so this only handles
    // session ensure + model/agent + SDK call + state.
    ThreadSessionRuntime.prototype.dispatchPrompt = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionResult, session, getClient, createdNewSession, channelId, resolvedAppId, earlyAgentResult, earlyAgentPreference, earlyAvailableAgents, _a, earlyModelResult, preferredVariant, earlyModelParam, earlyThinkingValue, images, promptWithImagePaths, worktreeInfo, worktree, channelTopic, worktreeChanged, syntheticContext, parts, variantField, parseOpenCodeErrorMessage, queuedCommand_1, commandSignal_1, discordTag_1, commandResponse, timeoutReason, timedOut, commandErrorForAbortCheck, errorMessage, apiError, promptResponse, errorMessage, errorObject;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.lastDisplayedContextPercentage = 0;
                        this.lastRateLimitDisplayTime = 0;
                        return [4 /*yield*/, this.ensureSession({
                                prompt: input.prompt,
                                agent: input.agent,
                                permissions: input.permissions,
                                injectionGuardPatterns: input.injectionGuardPatterns,
                                sessionStartScheduleKind: input.sessionStartScheduleKind,
                                sessionStartScheduledTaskId: input.sessionStartScheduledTaskId,
                            })];
                    case 1:
                        sessionResult = _b.sent();
                        if (!(sessionResult instanceof Error)) return [3 /*break*/, 4];
                        this.stopTyping();
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, "\u2717 ".concat(sessionResult.message), { flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS })
                            // Show indicator: this dispatch failed, so the next queued message
                            // has been waiting — the user needs to see which one is starting.
                        ];
                    case 2:
                        _b.sent();
                        // Show indicator: this dispatch failed, so the next queued message
                        // has been waiting — the user needs to see which one is starting.
                        return [4 /*yield*/, this.tryDrainQueue({ showIndicator: true })];
                    case 3:
                        // Show indicator: this dispatch failed, so the next queued message
                        // has been waiting — the user needs to see which one is starting.
                        _b.sent();
                        return [2 /*return*/];
                    case 4:
                        session = sessionResult.session, getClient = sessionResult.getClient, createdNewSession = sessionResult.createdNewSession;
                        // Ensure listener is running now that we have a valid OpenCode client.
                        // The eager start in enqueueIncoming may have failed if the client
                        // wasn't initialized yet (fresh thread, first message).
                        if (!this.listenerLoopRunning) {
                            void this.startEventListener();
                        }
                        channelId = this.channelId;
                        resolvedAppId = input.appId;
                        if (!(input.agent && createdNewSession)) return [3 /*break*/, 6];
                        return [4 /*yield*/, (0, database_js_1.setSessionAgent)(session.id, input.agent)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6: return [4 /*yield*/, (0, model_js_1.ensureSessionPreferencesSnapshot)({
                            sessionId: session.id,
                            channelId: channelId,
                            appId: resolvedAppId,
                            getClient: getClient,
                            directory: this.sdkDirectory,
                            agentOverride: input.agent,
                            modelOverride: input.model,
                            force: createdNewSession,
                        })];
                    case 7:
                        _b.sent();
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return (0, agent_utils_js_1.resolveValidatedAgentPreference)({
                                    agent: input.agent,
                                    sessionId: session.id,
                                    channelId: channelId,
                                    getClient: getClient,
                                    directory: _this.sdkDirectory,
                                });
                            })];
                    case 8:
                        earlyAgentResult = _b.sent();
                        if (!(earlyAgentResult instanceof Error)) return [3 /*break*/, 11];
                        this.stopTyping();
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, "Failed to resolve agent: ".concat(earlyAgentResult.message), { flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS })
                            // Show indicator: dispatch failed mid-setup, next queued message was waiting.
                        ];
                    case 9:
                        _b.sent();
                        // Show indicator: dispatch failed mid-setup, next queued message was waiting.
                        return [4 /*yield*/, this.tryDrainQueue({ showIndicator: true })];
                    case 10:
                        // Show indicator: dispatch failed mid-setup, next queued message was waiting.
                        _b.sent();
                        return [2 /*return*/];
                    case 11:
                        earlyAgentPreference = earlyAgentResult.agentPreference;
                        earlyAvailableAgents = earlyAgentResult.agents;
                        return [4 /*yield*/, Promise.all([
                                errore.tryAsync(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var _a, providerID, modelParts, modelID, modelInfo;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                if (input.model) {
                                                    _a = input.model.split('/'), providerID = _a[0], modelParts = _a.slice(1);
                                                    modelID = modelParts.join('/');
                                                    if (providerID && modelID) {
                                                        return [2 /*return*/, { providerID: providerID, modelID: modelID }];
                                                    }
                                                }
                                                return [4 /*yield*/, (0, model_js_1.getCurrentModelInfo)({
                                                        sessionId: session.id,
                                                        channelId: channelId,
                                                        appId: resolvedAppId,
                                                        agentPreference: earlyAgentPreference,
                                                        getClient: getClient,
                                                        directory: this.sdkDirectory,
                                                    })];
                                            case 1:
                                                modelInfo = _b.sent();
                                                if (modelInfo.type === 'none') {
                                                    return [2 /*return*/, undefined];
                                                }
                                                return [2 /*return*/, { providerID: modelInfo.providerID, modelID: modelInfo.modelID }];
                                        }
                                    });
                                }); }),
                                (0, database_js_1.getVariantCascade)({
                                    sessionId: session.id,
                                    channelId: channelId,
                                    appId: resolvedAppId,
                                }),
                            ])];
                    case 12:
                        _a = _b.sent(), earlyModelResult = _a[0], preferredVariant = _a[1];
                        if (!(earlyModelResult instanceof Error)) return [3 /*break*/, 15];
                        this.stopTyping();
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, "Failed to resolve model: ".concat(earlyModelResult.message), { flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS })
                            // Show indicator: dispatch failed mid-setup, next queued message was waiting.
                        ];
                    case 13:
                        _b.sent();
                        // Show indicator: dispatch failed mid-setup, next queued message was waiting.
                        return [4 /*yield*/, this.tryDrainQueue({ showIndicator: true })];
                    case 14:
                        // Show indicator: dispatch failed mid-setup, next queued message was waiting.
                        _b.sent();
                        return [2 /*return*/];
                    case 15:
                        earlyModelParam = earlyModelResult;
                        if (!!earlyModelParam) return [3 /*break*/, 18];
                        this.stopTyping();
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, 'No AI provider connected. Configure a provider in OpenCode with `/connect` command.')
                            // Show indicator: dispatch failed, next queued message was waiting.
                        ];
                    case 16:
                        _b.sent();
                        // Show indicator: dispatch failed, next queued message was waiting.
                        return [4 /*yield*/, this.tryDrainQueue({ showIndicator: true })];
                    case 17:
                        // Show indicator: dispatch failed, next queued message was waiting.
                        _b.sent();
                        return [2 /*return*/];
                    case 18: return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var providersResponse, availableValues;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!preferredVariant) {
                                            return [2 /*return*/, undefined];
                                        }
                                        return [4 /*yield*/, errore.tryAsync(function () {
                                                return getClient().provider.list({ directory: _this.sdkDirectory });
                                            })];
                                    case 1:
                                        providersResponse = _a.sent();
                                        if (providersResponse instanceof Error || !providersResponse.data) {
                                            return [2 /*return*/, undefined];
                                        }
                                        availableValues = (0, thinking_utils_js_1.getThinkingValuesForModel)({
                                            providers: providersResponse.data.all,
                                            providerId: earlyModelParam.providerID,
                                            modelId: earlyModelParam.modelID,
                                        });
                                        if (availableValues.length === 0) {
                                            return [2 /*return*/, undefined];
                                        }
                                        return [2 /*return*/, (0, thinking_utils_js_1.matchThinkingValue)({
                                                requestedValue: preferredVariant,
                                                availableValues: availableValues,
                                            }) || undefined];
                                }
                            });
                        }); })()];
                    case 19:
                        earlyThinkingValue = _b.sent();
                        return [4 /*yield*/, this.ensureModelContextLimit({
                                providerID: earlyModelParam.providerID,
                                modelID: earlyModelParam.modelID,
                            })];
                    case 20:
                        _b.sent();
                        return [4 /*yield*/, this.sendNewSessionModelInfo({
                                createdNewSession: createdNewSession,
                                model: earlyModelParam,
                                agent: earlyAgentPreference,
                            })
                            // ── Build prompt parts ────────────────────────────────────
                        ];
                    case 21:
                        _b.sent();
                        images = input.images || [];
                        promptWithImagePaths = (function () {
                            if (images.length === 0) {
                                return input.prompt;
                            }
                            // Build image list with vision descriptions
                            var imageList = images
                                .map(function (img) {
                                var entry = "- ".concat(img.sourceUrl || img.filename);
                                if (img.visionDescription) {
                                    entry += "\n  **Vision analysis**: ".concat(img.visionDescription);
                                }
                                return entry;
                            })
                                .join('\n\n');
                            return "".concat(input.prompt, "\n\n**The following images are already included in this message as inline content (do not use Read tool on these):**\n\n").concat(imageList);
                        })();
                        return [4 /*yield*/, (0, database_js_1.getThreadWorktree)(this.thread.id)];
                    case 22:
                        worktreeInfo = _b.sent();
                        worktree = (worktreeInfo === null || worktreeInfo === void 0 ? void 0 : worktreeInfo.status) === 'ready' && worktreeInfo.worktree_directory
                            ? {
                                worktreeDirectory: worktreeInfo.worktree_directory,
                                branch: worktreeInfo.worktree_name,
                                mainRepoDirectory: worktreeInfo.project_directory,
                            }
                            : undefined;
                        return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                var fetched;
                                var _this = this;
                                var _a, _b, _c;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0:
                                            if (((_a = this.thread.parent) === null || _a === void 0 ? void 0 : _a.type) === discord_js_1.ChannelType.GuildText) {
                                                return [2 /*return*/, ((_b = this.thread.parent.topic) === null || _b === void 0 ? void 0 : _b.trim()) || undefined];
                                            }
                                            if (!channelId) {
                                                return [2 /*return*/, undefined];
                                            }
                                            return [4 /*yield*/, errore.tryAsync(function () {
                                                    return _this.thread.guild.channels.fetch(channelId);
                                                })];
                                        case 1:
                                            fetched = _d.sent();
                                            if (fetched instanceof Error || !fetched) {
                                                return [2 /*return*/, undefined];
                                            }
                                            if (fetched.type !== discord_js_1.ChannelType.GuildText) {
                                                return [2 /*return*/, undefined];
                                            }
                                            return [2 /*return*/, ((_c = fetched.topic) === null || _c === void 0 ? void 0 : _c.trim()) || undefined];
                                    }
                                });
                            }); })()];
                    case 23:
                        channelTopic = _b.sent();
                        worktreeChanged = this.consumeWorktreePromptChange(worktree);
                        syntheticContext = (0, system_message_js_1.getOpencodePromptContext)({
                            username: input.username,
                            userId: input.userId,
                            sourceMessageId: input.sourceMessageId,
                            sourceThreadId: input.sourceThreadId,
                            repliedMessage: input.repliedMessage,
                            worktree: worktree,
                            currentAgent: earlyAgentPreference,
                            worktreeChanged: worktreeChanged,
                        });
                        parts = __spreadArray([
                            { type: 'text', text: promptWithImagePaths },
                            { type: 'text', text: syntheticContext, synthetic: true }
                        ], images, true);
                        variantField = earlyThinkingValue
                            ? { variant: earlyThinkingValue }
                            : {};
                        parseOpenCodeErrorMessage = function (err) {
                            if (err && typeof err === 'object') {
                                if ('data' in err &&
                                    err.data &&
                                    typeof err.data === 'object' &&
                                    'message' in err.data) {
                                    return String(err.data.message);
                                }
                                if ('errors' in err &&
                                    Array.isArray(err.errors) &&
                                    err.errors.length > 0) {
                                    return JSON.stringify(err.errors);
                                }
                                if ('message' in err && typeof err.message === 'string') {
                                    return err.message;
                                }
                            }
                            return 'Unknown OpenCode API error';
                        };
                        if (!input.command) return [3 /*break*/, 34];
                        queuedCommand_1 = input.command;
                        commandSignal_1 = AbortSignal.timeout(30000);
                        discordTag_1 = (0, system_message_js_1.getOpencodePromptContext)({
                            username: input.username,
                            userId: input.userId,
                            sourceMessageId: input.sourceMessageId,
                            sourceThreadId: input.sourceThreadId,
                            repliedMessage: input.repliedMessage,
                        });
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return getClient().session.command(__assign({ sessionID: session.id, directory: _this.sdkDirectory, command: queuedCommand_1.name, arguments: queuedCommand_1.arguments + (discordTag_1 ? "\n".concat(discordTag_1) : ''), agent: earlyAgentPreference, model: "".concat(earlyModelParam.providerID, "/").concat(earlyModelParam.modelID) }, variantField), { signal: commandSignal_1 });
                            })];
                    case 24:
                        commandResponse = _b.sent();
                        if (!(commandResponse instanceof Error)) return [3 /*break*/, 30];
                        timeoutReason = commandSignal_1.reason;
                        timedOut = commandSignal_1.aborted &&
                            timeoutReason instanceof Error &&
                            timeoutReason.name === 'TimeoutError';
                        if (!timedOut) return [3 /*break*/, 27];
                        logger.warn("[DISPATCH] Command timed out after 30s sessionId=".concat(session.id));
                        this.stopTyping();
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, '✗ Command timed out after 30 seconds. Try a shorter command or run it with /run-shell-command.', { flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS })];
                    case 25:
                        _b.sent();
                        return [4 /*yield*/, this.dispatchAction(function () {
                                return _this.tryDrainQueue({ showIndicator: true });
                            })];
                    case 26:
                        _b.sent();
                        return [2 /*return*/];
                    case 27:
                        commandErrorForAbortCheck = commandResponse;
                        if ((0, utils_js_1.isAbortError)(commandErrorForAbortCheck)) {
                            logger.log("[DISPATCH] Command aborted (expected) sessionId=".concat(session.id));
                            this.stopTyping();
                            return [2 /*return*/];
                        }
                        logger.error("[DISPATCH] Command SDK call failed: ".concat(commandResponse.message));
                        void (0, sentry_js_1.notifyError)(commandResponse, 'Failed to send command to OpenCode');
                        this.stopTyping();
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, "\u2717 Unexpected bot Error: ".concat(commandResponse.message), { flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS })];
                    case 28:
                        _b.sent();
                        return [4 /*yield*/, this.dispatchAction(function () {
                                return _this.tryDrainQueue({ showIndicator: true });
                            })];
                    case 29:
                        _b.sent();
                        return [2 /*return*/];
                    case 30:
                        if (!commandResponse.error) return [3 /*break*/, 33];
                        errorMessage = parseOpenCodeErrorMessage(commandResponse.error);
                        if (errorMessage.includes('aborted')) {
                            logger.log("[DISPATCH] Command aborted (expected) sessionId=".concat(session.id));
                            this.stopTyping();
                            return [2 /*return*/];
                        }
                        apiError = new Error("OpenCode API error: ".concat(errorMessage));
                        logger.error("[DISPATCH] ".concat(apiError.message));
                        void (0, sentry_js_1.notifyError)(apiError, 'OpenCode API error during command');
                        this.stopTyping();
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, "\u2717 ".concat(apiError.message), {
                                flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                            })];
                    case 31:
                        _b.sent();
                        return [4 /*yield*/, this.dispatchAction(function () {
                                return _this.tryDrainQueue({ showIndicator: true });
                            })];
                    case 32:
                        _b.sent();
                        return [2 /*return*/];
                    case 33:
                        logger.log("[DISPATCH] Successfully ran command for session ".concat(session.id));
                        return [2 /*return*/];
                    case 34: return [4 /*yield*/, errore.tryAsync(function () {
                            var _a, _b;
                            return getClient().session.promptAsync(__assign({ sessionID: session.id, directory: _this.sdkDirectory, parts: parts, system: (0, system_message_js_1.getOpencodeSystemMessage)({
                                    sessionId: session.id,
                                    channelId: channelId,
                                    guildId: _this.thread.guildId,
                                    threadId: _this.thread.id,
                                    channelTopic: channelTopic,
                                    agents: earlyAvailableAgents,
                                    username: ((_a = _this.state) === null || _a === void 0 ? void 0 : _a.sessionUsername) || input.username,
                                    userId: ((_b = _this.state) === null || _b === void 0 ? void 0 : _b.sessionUserId) || input.userId,
                                }), model: earlyModelParam, agent: earlyAgentPreference }, variantField));
                        })];
                    case 35:
                        promptResponse = _b.sent();
                        if (!(promptResponse instanceof Error || promptResponse.error)) return [3 /*break*/, 38];
                        errorMessage = (function () {
                            if (promptResponse instanceof Error) {
                                return promptResponse.message;
                            }
                            return parseOpenCodeErrorMessage(promptResponse.error);
                        })();
                        errorObject = promptResponse instanceof Error
                            ? promptResponse
                            : new Error(errorMessage);
                        logger.error("[DISPATCH] Prompt API call failed: ".concat(errorMessage));
                        void (0, sentry_js_1.notifyError)(errorObject, 'OpenCode API error during local queue prompt');
                        this.stopTyping();
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, "\u2717 OpenCode API error: ".concat(errorMessage), {
                                flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                            })];
                    case 36:
                        _b.sent();
                        return [4 /*yield*/, this.dispatchAction(function () {
                                return _this.tryDrainQueue({ showIndicator: true });
                            })];
                    case 37:
                        _b.sent();
                        return [2 /*return*/];
                    case 38:
                        logger.log("[DISPATCH] promptAsync accepted by opencode queue sessionId=".concat(session.id, " threadId=").concat(this.threadId));
                        return [2 /*return*/];
                }
            });
        });
    };
    // ── Session Ensure ──────────────────────────────────────────
    // Creates or reuses the OpenCode session for this thread.
    ThreadSessionRuntime.prototype.ensureSession = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var directory, worktreeInfo, worktreeDirectory, originalRepoDirectory, getClientResult, getClient, sessionId, session, createdNewSession, sessionResponse, sessionPermissions, sessionResponse, sessionStartSourceResult;
            var _this = this;
            var _c;
            var prompt = _b.prompt, agent = _b.agent, permissions = _b.permissions, injectionGuardPatterns = _b.injectionGuardPatterns, sessionStartScheduleKind = _b.sessionStartScheduleKind, sessionStartScheduledTaskId = _b.sessionStartScheduledTaskId;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        directory = this.projectDirectory;
                        return [4 /*yield*/, (0, database_js_1.getThreadWorktree)(this.thread.id)];
                    case 1:
                        worktreeInfo = _d.sent();
                        worktreeDirectory = (worktreeInfo === null || worktreeInfo === void 0 ? void 0 : worktreeInfo.status) === 'ready' && worktreeInfo.worktree_directory
                            ? worktreeInfo.worktree_directory
                            : undefined;
                        originalRepoDirectory = worktreeDirectory
                            ? worktreeInfo === null || worktreeInfo === void 0 ? void 0 : worktreeInfo.project_directory
                            : undefined;
                        return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directory, {
                                originalRepoDirectory: originalRepoDirectory,
                                channelId: this.channelId,
                            })];
                    case 2:
                        getClientResult = _d.sent();
                        if (getClientResult instanceof Error) {
                            return [2 /*return*/, getClientResult];
                        }
                        getClient = getClientResult;
                        sessionId = (_c = this.state) === null || _c === void 0 ? void 0 : _c.sessionId;
                        if (!!sessionId) return [3 /*break*/, 4];
                        return [4 /*yield*/, (0, database_js_1.getThreadSession)(this.thread.id)];
                    case 3:
                        // Fallback to DB
                        sessionId = (_d.sent()) || undefined;
                        _d.label = 4;
                    case 4:
                        createdNewSession = false;
                        if (!sessionId) return [3 /*break*/, 6];
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return getClient().session.get({
                                    sessionID: sessionId,
                                    directory: _this.sdkDirectory,
                                });
                            })];
                    case 5:
                        sessionResponse = _d.sent();
                        if (!(sessionResponse instanceof Error) && sessionResponse.data) {
                            session = sessionResponse.data;
                        }
                        _d.label = 6;
                    case 6:
                        if (!!session) return [3 /*break*/, 10];
                        sessionPermissions = __spreadArray(__spreadArray([], (0, opencode_js_1.buildSessionPermissions)({
                            directory: this.sdkDirectory,
                            originalRepoDirectory: originalRepoDirectory,
                        }), true), (0, opencode_js_1.parsePermissionRules)(permissions !== null && permissions !== void 0 ? permissions : []), true);
                        return [4 /*yield*/, getClient().session.create({
                                directory: this.sdkDirectory,
                                permission: sessionPermissions,
                            })];
                    case 7:
                        sessionResponse = _d.sent();
                        session = sessionResponse.data;
                        if (!session) return [3 /*break*/, 9];
                        return [4 /*yield*/, (0, database_js_1.setThreadSession)(this.thread.id, session.id)];
                    case 8:
                        _d.sent();
                        if (injectionGuardPatterns === null || injectionGuardPatterns === void 0 ? void 0 : injectionGuardPatterns.length) {
                            (0, opencode_js_1.writeInjectionGuardConfig)({
                                sessionId: session.id,
                                scanPatterns: injectionGuardPatterns,
                            });
                        }
                        _d.label = 9;
                    case 9:
                        createdNewSession = true;
                        _d.label = 10;
                    case 10:
                        if (!session) {
                            return [2 /*return*/, new Error('Failed to create or get session')];
                        }
                        // Store session in DB and thread state
                        return [4 /*yield*/, (0, database_js_1.setThreadSession)(this.thread.id, session.id)];
                    case 11:
                        // Store session in DB and thread state
                        _d.sent();
                        threadState.setSessionId(this.threadId, session.id);
                        return [4 /*yield*/, this.hydrateSessionEventsFromDatabase({ sessionId: session.id })
                            // Store session start source for scheduled tasks
                        ];
                    case 12:
                        _d.sent();
                        if (!(createdNewSession && sessionStartScheduleKind)) return [3 /*break*/, 14];
                        return [4 /*yield*/, errore.tryAsync({
                                try: function () {
                                    return (0, database_js_1.setSessionStartSource)({
                                        sessionId: session.id,
                                        scheduleKind: sessionStartScheduleKind,
                                        scheduledTaskId: sessionStartScheduledTaskId,
                                    });
                                },
                                catch: function (e) {
                                    return new Error('Failed to persist scheduled session start source', {
                                        cause: e,
                                    });
                                },
                            })];
                    case 13:
                        sessionStartSourceResult = _d.sent();
                        if (sessionStartSourceResult instanceof Error) {
                            logger.warn("[SESSION START SOURCE] ".concat(sessionStartSourceResult.message));
                        }
                        _d.label = 14;
                    case 14:
                        if (!(agent && createdNewSession)) return [3 /*break*/, 16];
                        return [4 /*yield*/, (0, database_js_1.setSessionAgent)(session.id, agent)];
                    case 15:
                        _d.sent();
                        _d.label = 16;
                    case 16: return [2 /*return*/, { session: session, getClient: getClient, createdNewSession: createdNewSession }];
                }
            });
        });
    };
    /**
     * Emit the model + agent banner once, before the first prompt or OpenCode
     * command can produce visible output in a newly-created session thread.
     */
    ThreadSessionRuntime.prototype.sendNewSessionModelInfo = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var modelLabel, agentLabel, result;
            var _this = this;
            var createdNewSession = _b.createdNewSession, model = _b.model, agent = _b.agent;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!createdNewSession) {
                            return [2 /*return*/];
                        }
                        modelLabel = "".concat(model.providerID, "/").concat(model.modelID);
                        agentLabel = agent && agent.toLowerCase() !== 'build'
                            ? " \u22C5 ".concat(agent)
                            : '';
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return (0, discord_utils_js_1.sendThreadMessage)(_this.thread, "*using ".concat(modelLabel).concat(agentLabel, "*"), { flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS });
                            })];
                    case 1:
                        result = _c.sent();
                        if (result instanceof Error) {
                            logger.warn("[SESSION INFO] Failed to send model info: ".concat(result.message));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Emit the run footer: duration, model, context%, project info.
     * Triggered directly from the terminal assistant message.updated event so the
     * footer lands next to the assistant output instead of waiting for session.idle.
     */
    ThreadSessionRuntime.prototype.emitFooter = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var sessionId, runInfo, elapsedMs, sessionDuration, modelInfo, agentInfo, contextInfo, folderName, client, _c, branchResult, contextResult, branchName, truncate, truncatedFolder, truncatedBranch, projectInfo, footerText;
            var _this = this;
            var _d;
            var completedAt = _b.completedAt, runStartTime = _b.runStartTime;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        sessionId = (_d = this.state) === null || _d === void 0 ? void 0 : _d.sessionId;
                        runInfo = sessionId
                            ? (0, event_stream_state_js_1.getLatestRunInfo)({ events: this.eventBuffer, sessionId: sessionId })
                            : {
                                model: undefined,
                                providerID: undefined,
                                agent: undefined,
                                tokensUsed: 0,
                            };
                        elapsedMs = completedAt - runStartTime;
                        sessionDuration = elapsedMs < 1000
                            ? '<1s'
                            : (0, pretty_ms_1.default)(elapsedMs, { secondsDecimalDigits: 0 });
                        modelInfo = runInfo.model ? " \u22C5 ".concat(runInfo.model) : '';
                        agentInfo = runInfo.agent && runInfo.agent.toLowerCase() !== 'build'
                            ? " \u22C5 **".concat(runInfo.agent, "**")
                            : '';
                        contextInfo = '';
                        folderName = node_path_1.default.basename(this.sdkDirectory);
                        client = (0, opencode_js_1.getOpencodeClient)(this.projectDirectory);
                        return [4 /*yield*/, Promise.all([
                                errore.tryAsync(function () {
                                    return (0, worktrees_js_1.execAsync)('git symbolic-ref --short HEAD', {
                                        cwd: _this.sdkDirectory,
                                    });
                                }),
                                errore.tryAsync(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var tokensUsed, _a, messagesResult, providersResult, messages, lastAssistant, fallbackLimit, contextLimit, provider, model, percentage;
                                    var _this = this;
                                    var _b, _c, _d, _e;
                                    return __generator(this, function (_f) {
                                        switch (_f.label) {
                                            case 0:
                                                if (!client || !sessionId) {
                                                    return [2 /*return*/];
                                                }
                                                tokensUsed = runInfo.tokensUsed;
                                                return [4 /*yield*/, Promise.all([
                                                        tokensUsed === 0
                                                            ? errore.tryAsync(function () {
                                                                return client.session.messages({
                                                                    sessionID: sessionId,
                                                                    directory: _this.sdkDirectory,
                                                                });
                                                            })
                                                            : null,
                                                        errore.tryAsync(function () {
                                                            return client.provider.list({
                                                                directory: _this.sdkDirectory,
                                                            });
                                                        }),
                                                    ])];
                                            case 1:
                                                _a = _f.sent(), messagesResult = _a[0], providersResult = _a[1];
                                                if (messagesResult && !(messagesResult instanceof Error)) {
                                                    messages = messagesResult.data || [];
                                                    lastAssistant = __spreadArray([], messages, true).reverse()
                                                        .find(function (m) {
                                                        if (m.info.role !== 'assistant') {
                                                            return false;
                                                        }
                                                        if (!m.info.tokens) {
                                                            return false;
                                                        }
                                                        return getTokenTotal(m.info.tokens) > 0;
                                                    });
                                                    if (lastAssistant && 'tokens' in lastAssistant.info) {
                                                        tokensUsed = getTokenTotal(lastAssistant.info.tokens);
                                                    }
                                                }
                                                fallbackLimit = runInfo.providerID
                                                    ? getFallbackContextLimit({
                                                        providerID: runInfo.providerID,
                                                    })
                                                    : undefined;
                                                contextLimit = fallbackLimit;
                                                if (providersResult && !(providersResult instanceof Error)) {
                                                    provider = (_c = (_b = providersResult.data) === null || _b === void 0 ? void 0 : _b.all) === null || _c === void 0 ? void 0 : _c.find(function (p) {
                                                        return p.id === runInfo.providerID;
                                                    });
                                                    model = (_d = provider === null || provider === void 0 ? void 0 : provider.models) === null || _d === void 0 ? void 0 : _d[runInfo.model || ''];
                                                    contextLimit = ((_e = model === null || model === void 0 ? void 0 : model.limit) === null || _e === void 0 ? void 0 : _e.context) || contextLimit;
                                                }
                                                if (contextLimit) {
                                                    percentage = Math.round((tokensUsed / contextLimit) * 100);
                                                    contextInfo = " \u22C5 ".concat(percentage, "%");
                                                }
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }),
                            ])];
                    case 1:
                        _c = _e.sent(), branchResult = _c[0], contextResult = _c[1];
                        branchName = branchResult instanceof Error ? '' : branchResult.stdout.trim();
                        if (contextResult instanceof Error) {
                            logger.error('Failed to fetch provider info for context percentage:', contextResult);
                        }
                        truncate = function (s, max) {
                            return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
                        };
                        truncatedFolder = truncate(folderName, 30);
                        truncatedBranch = truncate(branchName, 30);
                        projectInfo = truncatedBranch
                            ? "".concat(truncatedFolder, " \u22C5 ").concat(truncatedBranch, " \u22C5 ")
                            : "".concat(truncatedFolder, " \u22C5 ");
                        footerText = "*".concat(projectInfo).concat(sessionDuration).concat(contextInfo).concat(modelInfo).concat(agentInfo, "*");
                        this.stopTyping();
                        // Skip notification if there's a queued message next — the user only
                        // needs to be notified when the entire queue finishes.
                        return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(this.thread, footerText, {
                                flags: this.getNotifyFlags(),
                            })];
                    case 2:
                        // Skip notification if there's a queued message next — the user only
                        // needs to be notified when the entire queue finishes.
                        _e.sent();
                        logger.log("DURATION: Session completed in ".concat(sessionDuration, ", model ").concat(runInfo.model, ", tokens ").concat(runInfo.tokensUsed));
                        return [2 /*return*/];
                }
            });
        });
    };
    /** Reset per-run state for the next prompt dispatch. */
    ThreadSessionRuntime.prototype.resetPerRunState = function () {
        this.modelContextLimit = undefined;
        this.modelContextLimitKey = undefined;
        this.lastDisplayedContextPercentage = 0;
        this.lastRateLimitDisplayTime = 0;
    };
    // ── Retry Last User Prompt (for model-change flow) ──────────
    /**
     * Abort the active run and immediately send an empty user prompt.
     *
     * Used by /model and /unset-model so opencode can restart from the
     * current session history with the updated model preference, without
     * replaying/fetching the last user message in kimaki.
     */
    ThreadSessionRuntime.prototype.retryLastUserPrompt = function () {
        return __awaiter(this, void 0, void 0, function () {
            var state, sessionId, needsIdleWait, waitSinceTimestamp, abortResult;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        state = this.state;
                        if (!(state === null || state === void 0 ? void 0 : state.sessionId)) {
                            logger.log("[RETRY] No session for thread ".concat(this.threadId));
                            return [2 /*return*/, false];
                        }
                        sessionId = state.sessionId;
                        needsIdleWait = false;
                        waitSinceTimestamp = Date.now();
                        return [4 /*yield*/, errore.tryAsync(function () {
                                return _this.dispatchAction(function () { return __awaiter(_this, void 0, void 0, function () {
                                    var outcome;
                                    return __generator(this, function (_a) {
                                        needsIdleWait = this.isMainSessionBusy();
                                        outcome = this.abortActiveRunInternal({
                                            reason: 'model-change',
                                        });
                                        if (outcome.apiAbortPromise) {
                                            void outcome.apiAbortPromise;
                                        }
                                        return [2 /*return*/];
                                    });
                                }); });
                            })];
                    case 1:
                        abortResult = _c.sent();
                        if (abortResult instanceof Error) {
                            logger.error('[RETRY] Failed to abort active run before retry:', abortResult);
                            return [2 /*return*/, false];
                        }
                        if (!needsIdleWait) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.waitForEvent({
                                predicate: function (event) {
                                    return event.type === 'session.idle'
                                        && event.properties.sessionID === sessionId;
                                },
                                sinceTimestamp: waitSinceTimestamp,
                                timeoutMs: 2000,
                            })];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        if (this.listenerAborted) {
                            logger.log("[RETRY] Runtime disposed before retry for thread ".concat(this.threadId));
                            return [2 /*return*/, false];
                        }
                        if (((_a = this.state) === null || _a === void 0 ? void 0 : _a.sessionId) !== sessionId) {
                            logger.log("[RETRY] Session changed before retry for thread ".concat(this.threadId));
                            return [2 /*return*/, false];
                        }
                        logger.log("[RETRY] Re-submitting with empty prompt for session ".concat(sessionId));
                        // 2. Re-submit with empty prompt so opencode continues from session history.
                        return [4 /*yield*/, this.enqueueIncoming({
                                prompt: '',
                                userId: '',
                                username: '',
                                appId: this.appId,
                                mode: 'opencode',
                                resetAssistantForNewRun: true,
                                expectedSessionId: sessionId,
                            })];
                    case 4:
                        // 2. Re-submit with empty prompt so opencode continues from session history.
                        _c.sent();
                        if (((_b = this.state) === null || _b === void 0 ? void 0 : _b.sessionId) !== sessionId) {
                            logger.log("[RETRY] Session changed while retry was enqueued for thread ".concat(this.threadId));
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                }
            });
        });
    };
    ThreadSessionRuntime.TYPING_REPULSE_DEBOUNCE_MS = 500;
    // Bounded buffer of recent SSE events with timestamps.
    // Used by waitForEvent() to scan for specific events that arrived
    // after a given point in time (e.g. wait for session.idle after abort).
    // Generic: any future "wait for X event" can reuse this buffer.
    ThreadSessionRuntime.EVENT_BUFFER_MAX = 1000;
    ThreadSessionRuntime.EVENT_BUFFER_DB_FLUSH_MS = 2000;
    ThreadSessionRuntime.EVENT_BUFFER_TEXT_MAX_CHARS = 512;
    return ThreadSessionRuntime;
}());
exports.ThreadSessionRuntime = ThreadSessionRuntime;
// ── Module-level helpers ──────────────────────────────────────────
function buildPermissionDedupeKey(_a) {
    var permission = _a.permission, directory = _a.directory;
    var normalizedPatterns = __spreadArray([], permission.patterns, true).sort(function (a, b) {
        return a.localeCompare(b);
    });
    return "".concat(directory, "::").concat(permission.permission, "::").concat(normalizedPatterns.join('|'));
}
function getFallbackContextLimit(_a) {
    var providerID = _a.providerID;
    if (providerID === 'deterministic-provider') {
        return DETERMINISTIC_CONTEXT_LIMIT;
    }
    return undefined;
}
/** Format a session error from event properties for display. */
function formatSessionErrorFromProps(error) {
    if (!error) {
        return 'Unknown error';
    }
    var data = error.data;
    if (!data) {
        return error.name || 'Unknown error';
    }
    var parts = [];
    if (data.message) {
        parts.push(data.message);
    }
    if (data.statusCode) {
        parts.push("(".concat(data.statusCode, ")"));
    }
    if (data.providerID) {
        parts.push("[".concat(data.providerID, "]"));
    }
    return parts.length > 0 ? parts.join(' ') : error.name || 'Unknown error';
}
