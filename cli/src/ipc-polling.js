"use strict";
// IPC polling bridge between the opencode plugin and the Discord bot.
// The plugin inserts rows into ipc_requests (via Drizzle). This module polls
// that table, claims pending rows atomically, and dispatches them by type.
// DB-backed IPC lets the OpenCode plugin request Discord UI interactions.
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
exports.startIpcPolling = startIpcPolling;
exports.stopIpcPolling = stopIpcPolling;
var errore = require("errore");
var errore_1 = require("errore");
var database_js_1 = require("./database.js");
var file_upload_js_1 = require("./commands/file-upload.js");
var action_buttons_js_1 = require("./commands/action-buttons.js");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
var ipcLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.IPC);
// ── Tagged errors ────────────────────────────────────────────────────────
var IpcDispatchError = /** @class */ (function (_super) {
    __extends(IpcDispatchError, _super);
    function IpcDispatchError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return IpcDispatchError;
}((0, errore_1.createTaggedError)({
    name: 'IpcDispatchError',
    message: 'IPC dispatch failed for request $requestId: $reason',
})));
// ── Button parsing ───────────────────────────────────────────────────────
var VALID_COLORS = new Set([
    'white',
    'blue',
    'green',
    'red',
]);
function parseButtons(raw) {
    if (!Array.isArray(raw))
        return [];
    var results = [];
    for (var _i = 0, raw_1 = raw; _i < raw_1.length; _i++) {
        var value = raw_1[_i];
        if (!value || typeof value !== 'object')
            continue;
        var label = (typeof value.label === 'string' ? value.label : '')
            .trim()
            .slice(0, 80);
        if (!label)
            continue;
        var color = typeof value.color === 'string' &&
            VALID_COLORS.has(value.color)
            ? value.color
            : undefined;
        results.push({ label: label, color: color });
        if (results.length >= 3)
            break;
    }
    return results;
}
function dispatchRequest(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, parsed, thread, parsed, buttons, thread;
        var req = _b.req, discordClient = _b.discordClient;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _c = req.type;
                    switch (_c) {
                        case 'file_upload': return [3 /*break*/, 1];
                        case 'action_buttons': return [3 /*break*/, 9];
                    }
                    return [3 /*break*/, 20];
                case 1:
                    parsed = errore.try({
                        try: function () {
                            return JSON.parse(req.payload);
                        },
                        catch: function (e) {
                            return new IpcDispatchError({
                                requestId: req.id,
                                reason: 'Invalid payload JSON',
                                cause: e,
                            });
                        },
                    });
                    if (!(parsed instanceof Error)) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, database_js_1.completeIpcRequest)({
                            id: req.id,
                            response: JSON.stringify({ error: parsed.message }),
                        })];
                case 2:
                    _d.sent();
                    return [2 /*return*/, parsed];
                case 3: return [4 /*yield*/, discordClient.channels
                        .fetch(req.thread_id)
                        .catch(function (e) {
                        return new IpcDispatchError({
                            requestId: req.id,
                            reason: 'Thread fetch failed',
                            cause: e,
                        });
                    })];
                case 4:
                    thread = _d.sent();
                    if (!(thread instanceof Error)) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, database_js_1.completeIpcRequest)({
                            id: req.id,
                            response: JSON.stringify({ error: 'Thread not found' }),
                        })];
                case 5:
                    _d.sent();
                    return [2 /*return*/, thread];
                case 6:
                    if (!!(thread === null || thread === void 0 ? void 0 : thread.isThread())) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, database_js_1.completeIpcRequest)({
                            id: req.id,
                            response: JSON.stringify({ error: 'Thread not found' }),
                        })];
                case 7:
                    _d.sent();
                    return [2 /*return*/, new IpcDispatchError({
                            requestId: req.id,
                            reason: 'Channel is not a thread',
                        })];
                case 8:
                    // Fire-and-forget: showFileUploadButton waits for user interaction
                    // (button click + modal + file download) which can take minutes.
                    // Don't block the dispatch loop — complete the IPC request asynchronously.
                    (0, file_upload_js_1.showFileUploadButton)({
                        thread: thread,
                        sessionId: req.session_id,
                        directory: parsed.directory || '',
                        prompt: parsed.prompt || 'Please upload files',
                        maxFiles: Math.min(10, Math.max(1, parsed.maxFiles || 5)),
                    })
                        .then(function (filePaths) {
                        return (0, database_js_1.completeIpcRequest)({
                            id: req.id,
                            response: JSON.stringify({ filePaths: filePaths }),
                        });
                    })
                        .catch(function (e) {
                        ipcLogger.error('[IPC] File upload error:', e instanceof Error ? e.message : String(e));
                        return (0, database_js_1.completeIpcRequest)({
                            id: req.id,
                            response: JSON.stringify({
                                error: e instanceof Error ? e.message : 'File upload failed',
                            }),
                        });
                    })
                        .catch(function (e) {
                        void (0, sentry_js_1.notifyError)(e, 'IPC file upload completion update failed');
                    });
                    return [2 /*return*/];
                case 9:
                    parsed = errore.try({
                        try: function () {
                            return JSON.parse(req.payload);
                        },
                        catch: function (e) {
                            return new IpcDispatchError({
                                requestId: req.id,
                                reason: 'Invalid payload JSON',
                                cause: e,
                            });
                        },
                    });
                    if (!(parsed instanceof Error)) return [3 /*break*/, 11];
                    return [4 /*yield*/, (0, database_js_1.completeIpcRequest)({
                            id: req.id,
                            response: JSON.stringify({ error: parsed.message }),
                        })];
                case 10:
                    _d.sent();
                    return [2 /*return*/, parsed];
                case 11:
                    buttons = parseButtons(parsed.buttons);
                    if (!(buttons.length === 0)) return [3 /*break*/, 13];
                    return [4 /*yield*/, (0, database_js_1.completeIpcRequest)({
                            id: req.id,
                            response: JSON.stringify({ error: 'No valid buttons' }),
                        })];
                case 12:
                    _d.sent();
                    return [2 /*return*/];
                case 13: return [4 /*yield*/, discordClient.channels
                        .fetch(req.thread_id)
                        .catch(function (e) {
                        return new IpcDispatchError({
                            requestId: req.id,
                            reason: 'Thread fetch failed',
                            cause: e,
                        });
                    })];
                case 14:
                    thread = _d.sent();
                    if (!(thread instanceof Error)) return [3 /*break*/, 16];
                    return [4 /*yield*/, (0, database_js_1.completeIpcRequest)({
                            id: req.id,
                            response: JSON.stringify({ error: 'Thread not found' }),
                        })];
                case 15:
                    _d.sent();
                    return [2 /*return*/, thread];
                case 16:
                    if (!!(thread === null || thread === void 0 ? void 0 : thread.isThread())) return [3 /*break*/, 18];
                    return [4 /*yield*/, (0, database_js_1.completeIpcRequest)({
                            id: req.id,
                            response: JSON.stringify({ error: 'Thread not found' }),
                        })];
                case 17:
                    _d.sent();
                    return [2 /*return*/, new IpcDispatchError({
                            requestId: req.id,
                            reason: 'Channel is not a thread',
                        })];
                case 18:
                    (0, action_buttons_js_1.queueActionButtonsRequest)({
                        sessionId: req.session_id,
                        threadId: req.thread_id,
                        directory: parsed.directory || '',
                        buttons: buttons,
                    });
                    return [4 /*yield*/, (0, database_js_1.completeIpcRequest)({
                            id: req.id,
                            response: JSON.stringify({ ok: true }),
                        })];
                case 19:
                    _d.sent();
                    return [2 /*return*/];
                case 20: return [4 /*yield*/, (0, database_js_1.completeIpcRequest)({
                        id: req.id,
                        response: JSON.stringify({ error: "Unknown IPC type: ".concat(req.type) }),
                    })];
                case 21:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// ── Polling lifecycle ────────────────────────────────────────────────────
var pollingInterval = null;
// Cancel requests stuck in 'processing' longer than 24 hours. Users often
// come back the next day to click permission/question/file-upload buttons,
// so we keep IPC rows alive for a full day. Checked every 30 seconds.
var STALE_TTL_MS = 24 * 60 * 60 * 1000;
var STALE_CHECK_INTERVAL_MS = 30 * 1000;
var lastStaleCheck = 0;
/**
 * Start polling the ipc_requests table for pending requests from the plugin.
 * Claims rows atomically (pending -> processing) to prevent duplicate dispatch.
 * Uses an in-flight guard to prevent overlapping poll ticks.
 */
function startIpcPolling(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var polling;
        var _this = this;
        var discordClient = _b.discordClient;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // Clean up stale requests from previous runs before first poll tick
                return [4 /*yield*/, (0, database_js_1.cancelAllPendingIpcRequests)().catch(function (e) {
                        ipcLogger.warn('Failed to cancel stale IPC requests:', e.message);
                        void (0, sentry_js_1.notifyError)(e, 'Failed to cancel stale IPC requests');
                    })];
                case 1:
                    // Clean up stale requests from previous runs before first poll tick
                    _c.sent();
                    polling = false;
                    pollingInterval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                        var now, claimed, _loop_1, _i, claimed_1, req;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (polling)
                                        return [2 /*return*/];
                                    polling = true;
                                    now = Date.now();
                                    if (!(now - lastStaleCheck > STALE_CHECK_INTERVAL_MS)) return [3 /*break*/, 2];
                                    lastStaleCheck = now;
                                    return [4 /*yield*/, (0, database_js_1.cancelStaleProcessingRequests)({ ttlMs: STALE_TTL_MS }).catch(function (e) {
                                            ipcLogger.warn('Stale sweep failed:', e.message);
                                            void (0, sentry_js_1.notifyError)(e, 'IPC stale sweep failed');
                                        })];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [4 /*yield*/, (0, database_js_1.claimPendingIpcRequests)().catch(function (e) {
                                        return new IpcDispatchError({
                                            requestId: 'poll',
                                            reason: 'Claim failed',
                                            cause: e,
                                        });
                                    })];
                                case 3:
                                    claimed = _a.sent();
                                    if (claimed instanceof Error) {
                                        ipcLogger.error('IPC claim failed:', claimed.message);
                                        void (0, sentry_js_1.notifyError)(claimed, 'IPC claim failed');
                                        polling = false;
                                        return [2 /*return*/];
                                    }
                                    _loop_1 = function (req) {
                                        var result;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0: return [4 /*yield*/, dispatchRequest({ req: req, discordClient: discordClient }).catch(function (e) {
                                                        return new IpcDispatchError({
                                                            requestId: req.id,
                                                            reason: 'Dispatch threw',
                                                            cause: e,
                                                        });
                                                    })];
                                                case 1:
                                                    result = _b.sent();
                                                    if (result instanceof Error) {
                                                        ipcLogger.error("IPC dispatch error for ".concat(req.type, ":"), result.message);
                                                        void (0, sentry_js_1.notifyError)(result, "IPC dispatch error for ".concat(req.type));
                                                    }
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _i = 0, claimed_1 = claimed;
                                    _a.label = 4;
                                case 4:
                                    if (!(_i < claimed_1.length)) return [3 /*break*/, 7];
                                    req = claimed_1[_i];
                                    return [5 /*yield**/, _loop_1(req)];
                                case 5:
                                    _a.sent();
                                    _a.label = 6;
                                case 6:
                                    _i++;
                                    return [3 /*break*/, 4];
                                case 7:
                                    polling = false;
                                    return [2 /*return*/];
                            }
                        });
                    }); }, 200);
                    return [2 /*return*/];
            }
        });
    });
}
function stopIpcPolling() {
    if (!pollingInterval)
        return;
    clearInterval(pollingInterval);
    pollingInterval = null;
}
