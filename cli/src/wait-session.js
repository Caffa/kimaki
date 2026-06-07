"use strict";
// Wait utilities for polling session completion.
// Used by `kimaki send --wait` to block until a session finishes,
// then output the session markdown to stdout.
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
exports.waitForSessionId = waitForSessionId;
exports.waitForSessionComplete = waitForSessionComplete;
exports.waitAndOutputSession = waitAndOutputSession;
var database_js_1 = require("./database.js");
var opencode_js_1 = require("./opencode.js");
var markdown_js_1 = require("./markdown.js");
var logger_js_1 = require("./logger.js");
var waitLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.SESSION);
/**
 * Poll the kimaki database until a session ID appears for the given thread.
 * The bot writes this mapping in session-handler.ts:551 when it picks up
 * the thread and creates/reuses a session.
 */
function waitForSessionId(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var startTime, pollIntervalMs, sessionId;
        var threadId = _b.threadId, _c = _b.timeoutMs, timeoutMs = _c === void 0 ? 120000 : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    startTime = Date.now();
                    pollIntervalMs = 2000;
                    _d.label = 1;
                case 1:
                    if (!(Date.now() - startTime < timeoutMs)) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(threadId)];
                case 2:
                    sessionId = _d.sent();
                    if (sessionId) {
                        waitLogger.log("Session ID resolved: ".concat(sessionId));
                        return [2 /*return*/, sessionId];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, pollIntervalMs);
                        })];
                case 3:
                    _d.sent();
                    return [3 /*break*/, 1];
                case 4: throw new Error("Timed out waiting for session ID (thread: ".concat(threadId, ", timeout: ").concat(timeoutMs, "ms)"));
            }
        });
    });
}
/**
 * Poll the OpenCode SDK until the session's last assistant message
 * has `time.completed` set, meaning the model finished responding.
 */
function waitForSessionComplete(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var pollIntervalMs, startTime, getClient, messagesResponse, messages, lastAssistant;
        var projectDirectory = _b.projectDirectory, sessionId = _b.sessionId, _c = _b.timeoutMs, timeoutMs = _c === void 0 ? 30 * 60 * 1000 : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    pollIntervalMs = 3000;
                    startTime = Date.now();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 1:
                    getClient = _d.sent();
                    if (getClient instanceof Error) {
                        throw new Error("Failed to connect to OpenCode server: ".concat(getClient.message), {
                            cause: getClient,
                        });
                    }
                    _d.label = 2;
                case 2:
                    if (!(Date.now() - startTime < timeoutMs)) return [3 /*break*/, 5];
                    return [4 /*yield*/, getClient().session.messages({
                            sessionID: sessionId,
                        })];
                case 3:
                    messagesResponse = _d.sent();
                    messages = messagesResponse.data || [];
                    lastAssistant = __spreadArray([], messages, true).reverse()
                        .find(function (m) { return m.info.role === 'assistant'; });
                    if (lastAssistant &&
                        lastAssistant.info.role === 'assistant' &&
                        lastAssistant.info.time.completed) {
                        waitLogger.log("Session ".concat(sessionId, " completed"));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, pollIntervalMs);
                        })];
                case 4:
                    _d.sent();
                    return [3 /*break*/, 2];
                case 5: throw new Error("Timed out waiting for session completion (session: ".concat(sessionId, ", timeout: ").concat(timeoutMs, "ms)"));
            }
        });
    });
}
/**
 * Wait for session completion and output the session markdown to stdout.
 * Orchestrates the full wait flow: session ID resolution -> completion -> output.
 */
function waitAndOutputSession(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var sessionId, getClient, markdown, result;
        var threadId = _b.threadId, projectDirectory = _b.projectDirectory, sessionIdTimeoutMs = _b.sessionIdTimeoutMs, completionTimeoutMs = _b.completionTimeoutMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    waitLogger.log('Waiting for session ID...');
                    return [4 /*yield*/, waitForSessionId({
                            threadId: threadId,
                            timeoutMs: sessionIdTimeoutMs,
                        })];
                case 1:
                    sessionId = _c.sent();
                    waitLogger.log("Waiting for session ".concat(sessionId, " to complete..."));
                    return [4 /*yield*/, waitForSessionComplete({
                            projectDirectory: projectDirectory,
                            sessionId: sessionId,
                            timeoutMs: completionTimeoutMs,
                        })];
                case 2:
                    _c.sent();
                    waitLogger.log('Generating session output...');
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 3:
                    getClient = _c.sent();
                    if (getClient instanceof Error) {
                        throw new Error("Failed to connect to OpenCode server: ".concat(getClient.message), {
                            cause: getClient,
                        });
                    }
                    markdown = new markdown_js_1.ShareMarkdown(getClient());
                    return [4 /*yield*/, markdown.generate({ sessionID: sessionId })];
                case 4:
                    result = _c.sent();
                    if (result instanceof Error) {
                        throw new Error("Failed to generate session markdown: ".concat(result.message), {
                            cause: result,
                        });
                    }
                    process.stdout.write(result);
                    return [2 /*return*/];
            }
        });
    });
}
