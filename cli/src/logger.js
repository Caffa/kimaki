"use strict";
// Prefixed logging utility using @clack/prompts for consistent stderr diagnostics and file logs.
// Never write logger output to stdout because many CLI subcommands print
// machine-readable data there, for example `kimaki project list --json`.
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
exports.LogPrefix = void 0;
exports.initLogFile = initLogFile;
exports.setLogFilePath = setLogFilePath;
exports.getLogFilePath = getLogFilePath;
exports.formatErrorWithStack = formatErrorWithStack;
exports.createLogger = createLogger;
var prompts_1 = require("@clack/prompts");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_util_1 = require("node:util");
var picocolors_1 = require("picocolors");
var privacy_sanitizer_js_1 = require("./privacy-sanitizer.js");
// All known log prefixes - add new ones here to keep alignment consistent
exports.LogPrefix = {
    ABORT: 'ABORT',
    ADD_PROJECT: 'ADD_PROJ',
    AGENT: 'AGENT',
    ASR: 'ASR',
    ASK_QUESTION: 'QUESTION',
    CHANNEL: 'CHANNEL',
    CLI: 'CLI',
    COMPACT: 'COMPACT',
    CREATE_PROJECT: 'NEW_PROJ',
    DB: 'DB',
    DIFF: 'DIFF',
    FILE_UPLOAD: 'FILEUP',
    DISCORD: 'DISCORD',
    FORK: 'FORK',
    FORMATTING: 'FORMAT',
    GENAI: 'GENAI',
    HEAP: 'HEAP',
    GENAI_WORKER: 'GENAI_W',
    INTERACTION: 'INTERACT',
    IPC: 'IPC',
    LOGIN: 'LOGIN',
    MARKDOWN: 'MARKDOWN',
    MCP: 'MCP',
    MODEL: 'MODEL',
    OPENAI: 'OPENAI',
    OPENCODE: 'OPENCODE',
    PERMISSIONS: 'PERMS',
    QUEUE: 'QUEUE',
    REMOVE_PROJECT: 'RM_PROJ',
    RESUME: 'RESUME',
    SESSION: 'SESSION',
    SHARE: 'SHARE',
    TASK: 'TASK',
    TOOLS: 'TOOLS',
    UNDO_REDO: 'UNDO',
    USER_CMD: 'USER_CMD',
    VERBOSITY: 'VERBOSE',
    VLLM: 'VLLM',
    VOICE: 'VOICE',
    WORKER: 'WORKER',
    THINKING: 'THINK',
    WORKTREE: 'WORKTREE',
    XML: 'XML',
};
// compute max length from all known prefixes for alignment
var MAX_PREFIX_LENGTH = Math.max.apply(Math, Object.values(exports.LogPrefix).map(function (p) { return p.length; }));
// Log file path is set by initLogFile() after the data directory is known.
// Before initLogFile() is called, file logging is skipped.
var logFilePath = null;
/**
 * Initialize file logging. Call this after setDataDir() so the log file
 * is written to `<dataDir>/kimaki.log`. The log file is truncated on
 * every bot startup so it contains only the current run's logs.
 */
function initLogFile(dataDir) {
    logFilePath = node_path_1.default.join(dataDir, 'kimaki.log');
    var logDir = node_path_1.default.dirname(logFilePath);
    if (!node_fs_1.default.existsSync(logDir)) {
        node_fs_1.default.mkdirSync(logDir, { recursive: true });
    }
    node_fs_1.default.writeFileSync(logFilePath, "--- kimaki log started at ".concat(new Date().toISOString(), " ---\n"));
}
/**
 * Set the log file path without truncating. Use this in child processes
 * (like the opencode plugin) that should append to the same log file
 * the bot process already created with initLogFile().
 */
function setLogFilePath(dataDir) {
    logFilePath = node_path_1.default.join(dataDir, 'kimaki.log');
}
function getLogFilePath() {
    return logFilePath;
}
var MAX_LOG_ARG_LENGTH = 1000;
function truncate(str, max) {
    if (str.length <= max)
        return str;
    return str.slice(0, max) + "\u2026 [truncated ".concat(str.length - max, " chars]");
}
function formatArg(arg) {
    if (typeof arg === 'string') {
        return truncate((0, privacy_sanitizer_js_1.sanitizeSensitiveText)(arg, { redactPaths: false }), MAX_LOG_ARG_LENGTH);
    }
    var safeArg = (0, privacy_sanitizer_js_1.sanitizeUnknownValue)(arg, { redactPaths: false });
    return truncate(node_util_1.default.inspect(safeArg, { colors: true, depth: 4 }), MAX_LOG_ARG_LENGTH);
}
function formatErrorWithStack(error) {
    var _a;
    if (error instanceof Error) {
        return (0, privacy_sanitizer_js_1.sanitizeSensitiveText)((_a = error.stack) !== null && _a !== void 0 ? _a : "".concat(error.name, ": ").concat(error.message), { redactPaths: false });
    }
    if (typeof error === 'string') {
        return (0, privacy_sanitizer_js_1.sanitizeSensitiveText)(error, { redactPaths: false });
    }
    // Keep this stable and safe for unknown values (handles circular structures).
    var safeError = (0, privacy_sanitizer_js_1.sanitizeUnknownValue)(error, { redactPaths: false });
    return (0, privacy_sanitizer_js_1.sanitizeSensitiveText)(node_util_1.default.inspect(safeError, { colors: false, depth: 4 }), {
        redactPaths: false,
    });
}
function writeToFile(_a) {
    var level = _a.level, prefix = _a.prefix, args = _a.args;
    var timestamp = new Date().toISOString();
    var message = "[".concat(timestamp, "] [").concat(level, "] [").concat(prefix, "] ").concat(args.map(formatArg).join(' '), "\n");
    if (!logFilePath) {
        return;
    }
    node_fs_1.default.appendFileSync(logFilePath, message);
}
function getTimestamp() {
    var now = new Date();
    return "".concat(String(now.getHours()).padStart(2, '0'), ":").concat(String(now.getMinutes()).padStart(2, '0'));
}
function formatMessage(_a) {
    var timestamp = _a.timestamp, prefix = _a.prefix, args = _a.args;
    return __spreadArray([picocolors_1.default.dim(timestamp), prefix], args.map(formatArg), true).join(' ');
}
var stderrLogOptions = { output: process.stderr, spacing: 0 };
// Suppress clack terminal output during vitest runs to avoid flooding
// test output with hundreds of log lines. File logging still works.
// Set KIMAKI_TEST_LOGS=1 when rerunning a failing test to see all
// kimaki logger output in the terminal for debugging.
var isVitest = !!process.env['KIMAKI_VITEST'];
var showTestLogs = isVitest && !!process.env['KIMAKI_TEST_LOGS'];
function createLogger(prefix) {
    var paddedPrefix = prefix.padEnd(MAX_PREFIX_LENGTH);
    var suppressConsole = isVitest && !showTestLogs;
    var log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        writeToFile({ level: 'LOG', prefix: prefix, args: args });
        if (suppressConsole) {
            return;
        }
        prompts_1.log.message(formatMessage({ timestamp: getTimestamp(), prefix: picocolors_1.default.cyan(paddedPrefix), args: args }), stderrLogOptions);
    };
    return {
        log: log,
        error: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            writeToFile({ level: 'ERROR', prefix: prefix, args: args });
            if (suppressConsole) {
                return;
            }
            prompts_1.log.error(formatMessage({ timestamp: getTimestamp(), prefix: picocolors_1.default.red(paddedPrefix), args: args }), stderrLogOptions);
        },
        warn: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            writeToFile({ level: 'WARN', prefix: prefix, args: args });
            if (suppressConsole) {
                return;
            }
            prompts_1.log.warn(formatMessage({
                timestamp: getTimestamp(),
                prefix: picocolors_1.default.yellow(paddedPrefix),
                args: args,
            }), stderrLogOptions);
        },
        info: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            writeToFile({ level: 'INFO', prefix: prefix, args: args });
            if (suppressConsole) {
                return;
            }
            prompts_1.log.info(formatMessage({ timestamp: getTimestamp(), prefix: picocolors_1.default.blue(paddedPrefix), args: args }), stderrLogOptions);
        },
        debug: log,
    };
}
