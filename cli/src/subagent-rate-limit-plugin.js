"use strict";
// OpenCode plugin that aborts task-created subagent sessions after rate limits.
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
exports.subagentRateLimitPlugin = void 0;
var errore = require("errore");
var plugin_logger_js_1 = require("./plugin-logger.js");
var sentry_js_1 = require("./sentry.js");
var logger = (0, plugin_logger_js_1.createPluginLogger)('SUBMODEL');
var RATE_LIMIT_TEXT_PATTERNS = [
    'rate_limit',
    'rate limit',
    'resource exhausted',
    'retry after',
    'too many requests',
    'quota exceeded',
];
function isRateLimitText(text) {
    if (!text) {
        return false;
    }
    var haystack = text.toLowerCase();
    return RATE_LIMIT_TEXT_PATTERNS.some(function (pattern) {
        return haystack.includes(pattern);
    });
}
function getTaskChildSession(event) {
    var _a, _b;
    if (event.type !== 'message.part.updated') {
        return undefined;
    }
    var part = event.properties.part;
    if (part.type !== 'tool' || part.tool !== 'task' || part.state.status === 'pending') {
        return undefined;
    }
    var childSessionId = (_a = part.state.metadata) === null || _a === void 0 ? void 0 : _a.sessionId;
    if (typeof childSessionId !== 'string' || childSessionId.length === 0) {
        return undefined;
    }
    var subagentType = (_b = part.state.input) === null || _b === void 0 ? void 0 : _b.subagent_type;
    return {
        childSessionId: childSessionId,
        subagentType: typeof subagentType === 'string' ? subagentType : undefined,
    };
}
function getEventSessionId(event) {
    if (event.type === 'session.status' || event.type === 'session.idle') {
        return event.properties.sessionID;
    }
    if (event.type === 'session.error') {
        return event.properties.sessionID;
    }
    if (event.type === 'message.updated') {
        return event.properties.info.sessionID;
    }
    if (event.type === 'message.part.updated') {
        return event.properties.part.sessionID;
    }
    if (event.type === 'session.created'
        || event.type === 'session.updated'
        || event.type === 'session.deleted') {
        return event.properties.info.id;
    }
    return undefined;
}
function extractRateLimitReason(event) {
    if (event.type === 'session.status' && event.properties.status.type === 'retry') {
        return isRateLimitText(event.properties.status.message)
            ? event.properties.status.message
            : undefined;
    }
    if (event.type === 'message.part.updated' && event.properties.part.type === 'retry') {
        var retryError = event.properties.part.error;
        if (retryError.data.statusCode === 429) {
            return retryError.data.message;
        }
        if (isRateLimitText(retryError.data.responseBody)) {
            return retryError.data.responseBody;
        }
        return isRateLimitText(retryError.data.message)
            ? retryError.data.message
            : undefined;
    }
    var apiError = (function () {
        var _a, _b;
        if (event.type === 'session.error' && ((_a = event.properties.error) === null || _a === void 0 ? void 0 : _a.name) === 'APIError') {
            return event.properties.error.data;
        }
        if (event.type === 'message.updated'
            && event.properties.info.role === 'assistant'
            && ((_b = event.properties.info.error) === null || _b === void 0 ? void 0 : _b.name) === 'APIError') {
            return event.properties.info.error.data;
        }
        return undefined;
    })();
    if (!apiError) {
        return undefined;
    }
    if (apiError.statusCode === 429) {
        return apiError.message;
    }
    if (isRateLimitText(apiError.responseBody)) {
        return apiError.responseBody;
    }
    return isRateLimitText(apiError.message) ? apiError.message : undefined;
}
var subagentRateLimitPlugin = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var dataDir, subagentSessions;
    var client = _b.client, directory = _b.directory;
    return __generator(this, function (_c) {
        (0, sentry_js_1.initSentry)();
        dataDir = process.env.KIMAKI_DATA_DIR;
        if (dataDir) {
            (0, plugin_logger_js_1.setPluginLogFilePath)(dataDir);
        }
        subagentSessions = new Map();
        return [2 /*return*/, {
                event: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                    var taskChild, existing, eventSessionId, rateLimitReason, subagent, abortResult;
                    var event = _b.event;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                taskChild = getTaskChildSession(event);
                                if (taskChild) {
                                    existing = subagentSessions.get(taskChild.childSessionId);
                                    if (existing) {
                                        if (taskChild.subagentType) {
                                            existing.subagentType = taskChild.subagentType;
                                        }
                                    }
                                    else {
                                        subagentSessions.set(taskChild.childSessionId, {
                                            subagentType: taskChild.subagentType,
                                            aborting: false,
                                        });
                                    }
                                }
                                eventSessionId = getEventSessionId(event);
                                if (!eventSessionId) {
                                    return [2 /*return*/];
                                }
                                if (event.type === 'session.deleted' || event.type === 'session.idle') {
                                    subagentSessions.delete(eventSessionId);
                                    return [2 /*return*/];
                                }
                                rateLimitReason = extractRateLimitReason(event);
                                if (!rateLimitReason) {
                                    return [2 /*return*/];
                                }
                                subagent = subagentSessions.get(eventSessionId);
                                if (!subagent || subagent.aborting) {
                                    return [2 /*return*/];
                                }
                                subagent.aborting = true;
                                return [4 /*yield*/, errore.tryAsync({
                                        try: function () { return __awaiter(void 0, void 0, void 0, function () {
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0: return [4 /*yield*/, client.session.abort({
                                                            path: { id: eventSessionId },
                                                            query: { directory: directory },
                                                        })];
                                                    case 1:
                                                        _a.sent();
                                                        return [4 /*yield*/, client.tui.showToast({
                                                                body: {
                                                                    message: (0, plugin_logger_js_1.appendToastSessionMarker)({
                                                                        message: "Aborting ".concat(subagent.subagentType || 'subagent', " after rate limit so the parent task can recover: ").concat(rateLimitReason),
                                                                        sessionId: eventSessionId,
                                                                    }),
                                                                    variant: 'info',
                                                                },
                                                            }).catch(function () {
                                                                return;
                                                            })];
                                                    case 2:
                                                        _a.sent();
                                                        logger.info("Aborted subagent ".concat(eventSessionId, " after rate limit"));
                                                        return [2 /*return*/];
                                                }
                                            });
                                        }); },
                                        catch: function (error) {
                                            return new Error('Subagent rate-limit abort failed', {
                                                cause: error,
                                            });
                                        },
                                    })];
                            case 1:
                                abortResult = _c.sent();
                                subagentSessions.delete(eventSessionId);
                                if (!(abortResult instanceof Error)) {
                                    return [2 /*return*/];
                                }
                                logger.warn("[subagent-rate-limit-plugin] ".concat((0, plugin_logger_js_1.formatPluginErrorWithStack)(abortResult)));
                                void (0, sentry_js_1.notifyError)(abortResult, 'subagent rate-limit plugin abort failed');
                                return [2 /*return*/];
                        }
                    });
                }); },
            }];
    });
}); };
exports.subagentRateLimitPlugin = subagentRateLimitPlugin;
