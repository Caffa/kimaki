"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPluginLogFilePath = setPluginLogFilePath;
exports.formatPluginErrorWithStack = formatPluginErrorWithStack;
exports.createPluginLogger = createPluginLogger;
exports.appendToastSessionMarker = appendToastSessionMarker;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_util_1 = require("node:util");
var privacy_sanitizer_js_1 = require("./privacy-sanitizer.js");
var pluginLogFilePath = null;
function setPluginLogFilePath(dataDir) {
    pluginLogFilePath = node_path_1.default.join(dataDir, 'kimaki.log');
}
function formatArg(arg) {
    if (typeof arg === 'string') {
        return (0, privacy_sanitizer_js_1.sanitizeSensitiveText)(arg, { redactPaths: false });
    }
    var safeArg = (0, privacy_sanitizer_js_1.sanitizeUnknownValue)(arg, { redactPaths: false });
    return node_util_1.default.inspect(safeArg, { colors: false, depth: 4 });
}
function formatPluginErrorWithStack(error) {
    var _a;
    if (error instanceof Error) {
        return (0, privacy_sanitizer_js_1.sanitizeSensitiveText)((_a = error.stack) !== null && _a !== void 0 ? _a : "".concat(error.name, ": ").concat(error.message), { redactPaths: false });
    }
    if (typeof error === 'string') {
        return (0, privacy_sanitizer_js_1.sanitizeSensitiveText)(error, { redactPaths: false });
    }
    var safeError = (0, privacy_sanitizer_js_1.sanitizeUnknownValue)(error, { redactPaths: false });
    return (0, privacy_sanitizer_js_1.sanitizeSensitiveText)(node_util_1.default.inspect(safeError, { colors: false, depth: 4 }), {
        redactPaths: false,
    });
}
function writeToFile(level, prefix, args) {
    if (!pluginLogFilePath) {
        return;
    }
    var timestamp = new Date().toISOString();
    var message = "[".concat(timestamp, "] [").concat(level, "] [").concat(prefix, "] ").concat(args.map(formatArg).join(' '), "\n");
    try {
        node_fs_1.default.appendFileSync(pluginLogFilePath, message);
    }
    catch (_a) {
        // Plugin logging must never break the OpenCode plugin process.
    }
}
function createPluginLogger(prefix) {
    return {
        log: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            writeToFile('LOG', prefix, args);
        },
        info: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            writeToFile('INFO', prefix, args);
        },
        warn: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            writeToFile('WARN', prefix, args);
        },
        error: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            writeToFile('ERROR', prefix, args);
        },
        debug: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            writeToFile('DEBUG', prefix, args);
        },
    };
}
// Append a session ID marker at the end of a toast message so the bot-side
// handleTuiToast can route the toast to the correct Discord thread.
// Without this marker the toast is silently dropped.
function appendToastSessionMarker(_a) {
    var message = _a.message, sessionId = _a.sessionId;
    if (!sessionId) {
        return message;
    }
    return "".concat(message, " ").concat(sessionId);
}
