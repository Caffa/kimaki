"use strict";
// Debug helper for writing raw OpenCode event stream entries as JSONL.
// When enabled, writes one file per session ID so event ordering and
// lifecycle behavior can be analyzed with jq.
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
exports.isOpencodeSessionEventLogEnabled = isOpencodeSessionEventLogEnabled;
exports.getOpencodeEventSessionId = getOpencodeEventSessionId;
exports.buildOpencodeEventLogLine = buildOpencodeEventLogLine;
exports.appendOpencodeSessionEventLog = appendOpencodeSessionEventLog;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var errore = require("errore");
var config_js_1 = require("../config.js");
var eventLogDirPromise = null;
var eventLogWriteDisabled = false;
function isOpencodeSessionEventLogEnabled() {
    return process.env['KIMAKI_LOG_OPENCODE_SESSION_EVENTS'] === '1';
}
function getOpencodeEventSessionId(event) {
    switch (event.type) {
        case 'message.updated':
            return event.properties.info.sessionID;
        case 'message.part.updated':
            return event.properties.part.sessionID;
        case 'message.part.delta':
        case 'message.part.removed':
        case 'session.status':
        case 'session.idle':
        case 'session.diff':
        case 'permission.asked':
        case 'permission.replied':
        case 'question.asked':
        case 'question.replied':
        case 'question.rejected':
            return event.properties.sessionID;
        case 'session.error':
            return event.properties.sessionID;
        case 'session.created':
        case 'session.updated':
        case 'session.deleted':
            return event.properties.info.id;
        default:
            return undefined;
    }
}
function sanitizeSessionIdForFilename(sessionId) {
    return sessionId.replace(/[^a-zA-Z0-9._-]/g, '_');
}
function resolveEventLogDirectory() {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            if (!eventLogDirPromise) {
                eventLogDirPromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                    var configuredEventLogDir, baseDir;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                configuredEventLogDir = process.env['KIMAKI_OPENCODE_SESSION_EVENTS_DIR'];
                                baseDir = configuredEventLogDir || node_path_1.default.join((0, config_js_1.getDataDir)(), 'opencode-session-events');
                                return [4 /*yield*/, node_fs_1.default.promises.mkdir(baseDir, { recursive: true })];
                            case 1:
                                _a.sent();
                                return [2 /*return*/, baseDir];
                        }
                    });
                }); })();
            }
            return [2 /*return*/, eventLogDirPromise];
        });
    });
}
function buildOpencodeEventLogLine(_a) {
    var timestamp = _a.timestamp, threadId = _a.threadId, projectDirectory = _a.projectDirectory, event = _a.event;
    return {
        timestamp: timestamp,
        threadId: threadId,
        projectDirectory: projectDirectory,
        event: event,
    };
}
function appendOpencodeSessionEventLog(entry) {
    return __awaiter(this, void 0, void 0, function () {
        var sessionId, logDirResult, safeSessionId, logFilePath, now, line, appendResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isOpencodeSessionEventLogEnabled() || eventLogWriteDisabled) {
                        return [2 /*return*/, null];
                    }
                    sessionId = getOpencodeEventSessionId(entry.event);
                    if (!sessionId) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return resolveEventLogDirectory();
                        })];
                case 1:
                    logDirResult = _a.sent();
                    if (logDirResult instanceof Error) {
                        eventLogWriteDisabled = true;
                        return [2 /*return*/, logDirResult];
                    }
                    safeSessionId = sanitizeSessionIdForFilename(sessionId);
                    logFilePath = node_path_1.default.join(logDirResult, "".concat(safeSessionId, ".jsonl"));
                    now = Date.now();
                    line = "".concat(JSON.stringify(buildOpencodeEventLogLine({
                        timestamp: now,
                        threadId: entry.threadId,
                        projectDirectory: entry.projectDirectory,
                        event: entry.event,
                    })), "\n");
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return node_fs_1.default.promises.appendFile(logFilePath, line, 'utf8');
                        })];
                case 2:
                    appendResult = _a.sent();
                    if (appendResult instanceof Error) {
                        eventLogWriteDisabled = true;
                        return [2 /*return*/, appendResult];
                    }
                    return [2 /*return*/, null];
            }
        });
    });
}
