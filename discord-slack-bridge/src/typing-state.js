"use strict";
// Pure event-sourced typing state derivation for Slack assistant thread status.
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
exports.DEFAULT_TYPING_STATE_CONFIG = void 0;
exports.createTypingCoordinator = createTypingCoordinator;
exports.appendTypingEvent = appendTypingEvent;
exports.deriveTypingIntent = deriveTypingIntent;
exports.DEFAULT_TYPING_STATE_CONFIG = {
    leaseMs: 10000,
    stopDebounceMs: 2000,
};
function createTypingCoordinator(_a) {
    var _this = this;
    var setStatus = _a.setStatus, clearStatus = _a.clearStatus, resolveThreadTarget = _a.resolveThreadTarget, statusText = _a.statusText, _b = _a.maxEvents, maxEvents = _b === void 0 ? 200 : _b, _c = _a.nowMs, nowMs = _c === void 0 ? function () {
        return Date.now();
    } : _c;
    var typingEventsByThread = new Map();
    var typingRuntimeByThread = new Map();
    var getThreadTypingRuntime = function (_a) {
        var threadChannelId = _a.threadChannelId;
        var existing = typingRuntimeByThread.get(threadChannelId);
        if (existing) {
            return existing;
        }
        var created = {
            running: false,
            dirty: false,
        };
        typingRuntimeByThread.set(threadChannelId, created);
        return created;
    };
    var maybeDeleteThreadTypingRuntime = function (_a) {
        var threadChannelId = _a.threadChannelId;
        var runtime = typingRuntimeByThread.get(threadChannelId);
        if (!runtime) {
            return;
        }
        if (runtime.running || runtime.dirty || runtime.wakeTimer) {
            return;
        }
        if (typingEventsByThread.has(threadChannelId)) {
            return;
        }
        typingRuntimeByThread.delete(threadChannelId);
    };
    var appendThreadTypingEvent = function (_a) {
        var _b;
        var threadChannelId = _a.threadChannelId, event = _a.event;
        var current = (_b = typingEventsByThread.get(threadChannelId)) !== null && _b !== void 0 ? _b : [];
        var next = appendTypingEvent({
            events: current,
            event: event,
            maxEvents: maxEvents,
        });
        typingEventsByThread.set(threadChannelId, next);
    };
    var clearThreadTypingWakeTimer = function (_a) {
        var threadChannelId = _a.threadChannelId;
        var runtime = typingRuntimeByThread.get(threadChannelId);
        var timer = runtime === null || runtime === void 0 ? void 0 : runtime.wakeTimer;
        if (!timer) {
            return;
        }
        clearTimeout(timer);
        runtime.wakeTimer = undefined;
        maybeDeleteThreadTypingRuntime({ threadChannelId: threadChannelId });
    };
    var scheduleThreadTypingWake = function (_a) {
        var _b;
        var threadChannelId = _a.threadChannelId;
        clearThreadTypingWakeTimer({ threadChannelId: threadChannelId });
        var events = (_b = typingEventsByThread.get(threadChannelId)) !== null && _b !== void 0 ? _b : [];
        if (events.length === 0) {
            maybeDeleteThreadTypingRuntime({ threadChannelId: threadChannelId });
            return;
        }
        var currentNowMs = nowMs();
        var intent = deriveTypingIntent({
            events: events,
            nowMs: currentNowMs,
        });
        if (intent.nextWakeAtMs === undefined) {
            if (!intent.isTypingActive && !intent.hasStartAfterStatus) {
                typingEventsByThread.delete(threadChannelId);
            }
            maybeDeleteThreadTypingRuntime({ threadChannelId: threadChannelId });
            return;
        }
        var runtime = getThreadTypingRuntime({ threadChannelId: threadChannelId });
        var delayMs = Math.max(0, intent.nextWakeAtMs - currentNowMs);
        var timer = setTimeout(function () {
            var latestRuntime = typingRuntimeByThread.get(threadChannelId);
            if (latestRuntime) {
                latestRuntime.wakeTimer = undefined;
            }
            void reconcileThreadTypingState({ threadChannelId: threadChannelId });
        }, delayMs);
        timer.unref();
        runtime.wakeTimer = timer;
    };
    var reconcileThreadTypingState = function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var runtime, events, intent, target, error_1, retryAfterMs, target, atMs, target, _c, target;
        var _d, _e;
        var threadChannelId = _b.threadChannelId;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    runtime = getThreadTypingRuntime({ threadChannelId: threadChannelId });
                    runtime.dirty = true;
                    if (runtime.running) {
                        return [2 /*return*/];
                    }
                    runtime.running = true;
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, , 12, 13]);
                    _f.label = 2;
                case 2:
                    if (!runtime.dirty) return [3 /*break*/, 11];
                    runtime.dirty = false;
                    events = (_d = typingEventsByThread.get(threadChannelId)) !== null && _d !== void 0 ? _d : [];
                    intent = deriveTypingIntent({
                        events: events,
                        nowMs: nowMs(),
                    });
                    if (!intent.shouldSendStatus) return [3 /*break*/, 6];
                    _f.label = 3;
                case 3:
                    _f.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, setStatus({
                            threadChannelId: threadChannelId,
                            statusText: statusText,
                        })];
                case 4:
                    target = _f.sent();
                    appendThreadTypingEvent({
                        threadChannelId: threadChannelId,
                        event: {
                            type: 'slack.status-sent',
                            atMs: nowMs(),
                            channelId: target.channelId,
                            threadTs: target.threadTs,
                            statusText: statusText,
                            mode: (_e = intent.statusMode) !== null && _e !== void 0 ? _e : 'start',
                        },
                    });
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _f.sent();
                    retryAfterMs = readSlackRetryAfterMs({ error: error_1 });
                    if (retryAfterMs !== undefined) {
                        target = resolveThreadTarget({ threadChannelId: threadChannelId });
                        if (target.threadTs) {
                            atMs = nowMs();
                            appendThreadTypingEvent({
                                threadChannelId: threadChannelId,
                                event: {
                                    type: 'slack.rate-limited',
                                    atMs: atMs,
                                    channelId: target.channelId,
                                    threadTs: target.threadTs,
                                    retryAfterMs: retryAfterMs,
                                    retryAtMs: atMs + retryAfterMs,
                                    method: 'assistant.threads.setStatus',
                                },
                            });
                        }
                    }
                    return [3 /*break*/, 6];
                case 6:
                    if (!intent.shouldClearStatus) return [3 /*break*/, 10];
                    _f.label = 7;
                case 7:
                    _f.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, clearStatus({ threadChannelId: threadChannelId })];
                case 8:
                    target = _f.sent();
                    appendThreadTypingEvent({
                        threadChannelId: threadChannelId,
                        event: {
                            type: 'slack.status-cleared',
                            atMs: nowMs(),
                            channelId: target.channelId,
                            threadTs: target.threadTs,
                            by: 'empty-status',
                        },
                    });
                    return [3 /*break*/, 10];
                case 9:
                    _c = _f.sent();
                    target = resolveThreadTarget({ threadChannelId: threadChannelId });
                    if (target.threadTs) {
                        appendThreadTypingEvent({
                            threadChannelId: threadChannelId,
                            event: {
                                type: 'slack.status-cleared',
                                atMs: nowMs(),
                                channelId: target.channelId,
                                threadTs: target.threadTs,
                                by: 'inferred',
                            },
                        });
                    }
                    return [3 /*break*/, 10];
                case 10: return [3 /*break*/, 2];
                case 11: return [3 /*break*/, 13];
                case 12:
                    runtime.running = false;
                    scheduleThreadTypingWake({ threadChannelId: threadChannelId });
                    maybeDeleteThreadTypingRuntime({ threadChannelId: threadChannelId });
                    return [7 /*endfinally*/];
                case 13: return [2 /*return*/];
            }
        });
    }); };
    return {
        requestStart: function (_a) {
            var threadChannelId = _a.threadChannelId;
            appendThreadTypingEvent({
                threadChannelId: threadChannelId,
                event: {
                    type: 'typing.start-requested',
                    atMs: nowMs(),
                    source: 'discord-route',
                },
            });
            void reconcileThreadTypingState({ threadChannelId: threadChannelId });
        },
        noteAssistantMessage: function (_a) {
            var threadChannelId = _a.threadChannelId, messageId = _a.messageId;
            var target = resolveThreadTarget({ threadChannelId: threadChannelId });
            if (!target.threadTs) {
                return;
            }
            appendThreadTypingEvent({
                threadChannelId: threadChannelId,
                event: {
                    type: 'assistant.message-sent',
                    atMs: nowMs(),
                    source: 'bridge-rest',
                    channelId: target.channelId,
                    threadTs: target.threadTs,
                    messageTs: messageId,
                },
            });
            void reconcileThreadTypingState({ threadChannelId: threadChannelId });
        },
    };
}
function appendTypingEvent(_a) {
    var events = _a.events, event = _a.event, maxEvents = _a.maxEvents;
    var appended = __spreadArray(__spreadArray([], events, true), [event], false);
    if (appended.length <= maxEvents) {
        return appended;
    }
    return appended.slice(appended.length - maxEvents);
}
function deriveTypingIntent(_a) {
    var events = _a.events, nowMs = _a.nowMs, _b = _a.config, config = _b === void 0 ? exports.DEFAULT_TYPING_STATE_CONFIG : _b;
    var lastStatusSentAt = lastEventAt({ events: events, type: 'slack.status-sent' });
    var lastStatusClearedAt = lastEventAt({ events: events, type: 'slack.status-cleared' });
    var lastStartAt = lastEventAt({ events: events, type: 'typing.start-requested' });
    var lastAssistantMessageAt = lastEventAt({ events: events, type: 'assistant.message-sent' });
    var lastExplicitStopAt = lastEventAt({ events: events, type: 'typing.stop-requested' });
    var rateLimitedUntil = lastRateLimitedUntil({ events: events });
    var isTypingActive = lastStatusSentAt !== undefined &&
        (lastStatusClearedAt === undefined || lastStatusSentAt > lastStatusClearedAt);
    var blockedByRateLimit = rateLimitedUntil !== undefined && nowMs < rateLimitedUntil;
    var hasStartAfterStatus = lastStartAt !== undefined &&
        (lastStatusSentAt === undefined || lastStartAt > lastStatusSentAt);
    var hasStartAfterAssistantMessage = lastStartAt !== undefined &&
        lastAssistantMessageAt !== undefined &&
        lastStartAt > lastAssistantMessageAt;
    var hasExplicitStop = lastExplicitStopAt !== undefined &&
        (lastStatusSentAt === undefined || lastExplicitStopAt > lastStatusSentAt);
    var assistantStopDueAt = lastAssistantMessageAt !== undefined && !hasStartAfterAssistantMessage
        ? lastAssistantMessageAt + config.stopDebounceMs
        : undefined;
    if (!isTypingActive) {
        var canStartNow = hasStartAfterStatus && !blockedByRateLimit;
        return {
            isTypingActive: isTypingActive,
            hasStartAfterStatus: hasStartAfterStatus,
            shouldSendStatus: canStartNow,
            shouldClearStatus: false,
            statusMode: canStartNow ? 'start' : undefined,
            clearReason: undefined,
            blockedByRateLimit: blockedByRateLimit,
            nextWakeAtMs: blockedByRateLimit
                ? rateLimitedUntil
                : undefined,
        };
    }
    if (hasExplicitStop && !hasStartAfterStatus) {
        return {
            isTypingActive: isTypingActive,
            hasStartAfterStatus: hasStartAfterStatus,
            shouldSendStatus: false,
            shouldClearStatus: true,
            statusMode: undefined,
            clearReason: 'explicit-stop',
            blockedByRateLimit: blockedByRateLimit,
            nextWakeAtMs: undefined,
        };
    }
    var shouldClearForAssistantDebounce = assistantStopDueAt !== undefined && nowMs >= assistantStopDueAt;
    if (shouldClearForAssistantDebounce) {
        return {
            isTypingActive: isTypingActive,
            hasStartAfterStatus: hasStartAfterStatus,
            shouldSendStatus: false,
            shouldClearStatus: true,
            statusMode: undefined,
            clearReason: 'assistant-debounce',
            blockedByRateLimit: blockedByRateLimit,
            nextWakeAtMs: undefined,
        };
    }
    var leaseExpiresAt = lastStatusSentAt === undefined
        ? undefined
        : lastStatusSentAt + config.leaseMs;
    var leaseExpired = leaseExpiresAt !== undefined && nowMs >= leaseExpiresAt;
    if (leaseExpired) {
        if (hasStartAfterStatus && !blockedByRateLimit) {
            return {
                isTypingActive: isTypingActive,
                hasStartAfterStatus: hasStartAfterStatus,
                shouldSendStatus: true,
                shouldClearStatus: false,
                statusMode: 'refresh',
                clearReason: undefined,
                blockedByRateLimit: blockedByRateLimit,
                nextWakeAtMs: undefined,
            };
        }
        if (hasStartAfterStatus && blockedByRateLimit) {
            return {
                isTypingActive: isTypingActive,
                hasStartAfterStatus: hasStartAfterStatus,
                shouldSendStatus: false,
                shouldClearStatus: false,
                statusMode: undefined,
                clearReason: undefined,
                blockedByRateLimit: blockedByRateLimit,
                nextWakeAtMs: rateLimitedUntil,
            };
        }
        return {
            isTypingActive: isTypingActive,
            hasStartAfterStatus: hasStartAfterStatus,
            shouldSendStatus: false,
            shouldClearStatus: true,
            statusMode: undefined,
            clearReason: 'lease-expired',
            blockedByRateLimit: blockedByRateLimit,
            nextWakeAtMs: undefined,
        };
    }
    var nextWakeCandidates = __spreadArray(__spreadArray(__spreadArray([], (leaseExpiresAt !== undefined ? [leaseExpiresAt] : []), true), (assistantStopDueAt !== undefined ? [assistantStopDueAt] : []), true), (blockedByRateLimit && rateLimitedUntil !== undefined ? [rateLimitedUntil] : []), true);
    return {
        isTypingActive: isTypingActive,
        hasStartAfterStatus: hasStartAfterStatus,
        shouldSendStatus: false,
        shouldClearStatus: false,
        statusMode: undefined,
        clearReason: undefined,
        blockedByRateLimit: blockedByRateLimit,
        nextWakeAtMs: nextWakeCandidates.length === 0
            ? undefined
            : Math.min.apply(Math, nextWakeCandidates),
    };
}
function lastRateLimitedUntil(_a) {
    var events = _a.events;
    return events.reduce(function (latest, event) {
        if (event.type !== 'slack.rate-limited') {
            return latest;
        }
        if (latest === undefined) {
            return event.retryAtMs;
        }
        return event.retryAtMs > latest ? event.retryAtMs : latest;
    }, undefined);
}
function readSlackRetryAfterMs(_a) {
    var _b;
    var error = _a.error;
    if (!isRecord(error)) {
        return undefined;
    }
    var data = readRecord(error, 'data');
    var dataRetryAfter = (_b = (data ? normalizeRetryAfterMs(readNumber(data, 'retryAfter')) : undefined)) !== null && _b !== void 0 ? _b : (data ? normalizeRetryAfterMs(readString(data, 'retryAfter')) : undefined);
    if (dataRetryAfter !== undefined) {
        return dataRetryAfter;
    }
    var dataHeaders = data ? readRecord(data, 'headers') : undefined;
    var headerRetryAfter = dataHeaders
        ? normalizeRetryAfterMs(readString(dataHeaders, 'retry-after'))
        : undefined;
    if (headerRetryAfter !== undefined) {
        return headerRetryAfter;
    }
    var rootHeaders = readRecord(error, 'headers');
    return rootHeaders
        ? normalizeRetryAfterMs(readString(rootHeaders, 'retry-after'))
        : undefined;
}
function normalizeRetryAfterMs(value) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.ceil(value * 1000);
    }
    if (typeof value === 'string') {
        var parsed = Number.parseFloat(value);
        if (Number.isFinite(parsed) && parsed > 0) {
            return Math.ceil(parsed * 1000);
        }
    }
    return undefined;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function readRecord(record, key) {
    var value = record[key];
    return isRecord(value) ? value : undefined;
}
function readString(record, key) {
    var value = record[key];
    return typeof value === 'string' ? value : undefined;
}
function readNumber(record, key) {
    var value = record[key];
    return typeof value === 'number' ? value : undefined;
}
function lastEventAt(_a) {
    var events = _a.events, type = _a.type;
    return events.reduce(function (latest, event) {
        if (event.type !== type) {
            return latest;
        }
        if (latest === undefined) {
            return event.atMs;
        }
        return event.atMs > latest ? event.atMs : latest;
    }, undefined);
}
