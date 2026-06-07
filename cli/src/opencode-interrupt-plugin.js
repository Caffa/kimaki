"use strict";
// OpenCode plugin for interrupting queued user messages at the next assistant
// step boundary, with a hard timeout as fallback.
// Tracks only whether each user message has started processing by
// correlating assistant message parentID events.
//
// State design: all mutable state (pending messages, recovery locks, event
// waiters, latest assistant IDs) is encapsulated in a closure-based factory
// (createInterruptState). The plugin hooks only interact with the returned
// API — they cannot directly touch Maps/Sets or break invariants like
// forgetting to clear a timer.
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
exports.interruptOpencodeSessionOnUserMessage = void 0;
function toPromptParts(parts) {
    return parts.reduce(function (acc, part) {
        if (part.type === 'text') {
            acc.push({
                id: part.id,
                type: 'text',
                text: part.text,
                synthetic: part.synthetic,
                ignored: part.ignored,
                time: part.time,
                metadata: part.metadata,
            });
            return acc;
        }
        if (part.type === 'file') {
            acc.push({
                id: part.id,
                type: 'file',
                mime: part.mime,
                filename: part.filename,
                url: part.url,
                source: part.source,
            });
            return acc;
        }
        if (part.type === 'agent') {
            acc.push({
                id: part.id,
                type: 'agent',
                name: part.name,
                source: part.source,
            });
            return acc;
        }
        if (part.type === 'subtask') {
            acc.push({
                id: part.id,
                type: 'subtask',
                prompt: part.prompt,
                description: part.description,
                agent: part.agent,
            });
            return acc;
        }
        return acc;
    }, []);
}
var DEFAULT_INTERRUPT_STEP_TIMEOUT_MS = 3000;
function getInterruptStepTimeoutMsFromEnv() {
    var raw = process.env['KIMAKI_INTERRUPT_STEP_TIMEOUT_MS'];
    if (!raw) {
        return DEFAULT_INTERRUPT_STEP_TIMEOUT_MS;
    }
    var parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return DEFAULT_INTERRUPT_STEP_TIMEOUT_MS;
    }
    return parsed;
}
// ── Encapsulated interrupt state ─────────────────────────────────
// All mutable variables are trapped inside this closure. The plugin
// hooks only see the returned API methods — they cannot break invariants
// like forgetting to clear a timer or leaving a stale recovery lock.
function createInterruptState() {
    var pendingByMessageId = new Map();
    var latestAssistantMessageIDBySession = new Map();
    var recoveringSessions = new Set();
    var waiters = new Set();
    // Messages that were replayed after an abort. chat.message must skip
    // scheduling a new interrupt timer for these to prevent an infinite
    // abort→replay loop when the LLM takes >interruptStepTimeoutMs to
    // return the first token (e.g. 239K token prompts).
    var replayedMessageIds = new Set();
    function clearPending(messageID) {
        var pending = pendingByMessageId.get(messageID);
        if (!pending) {
            return;
        }
        clearTimeout(pending.timer);
        pendingByMessageId.delete(messageID);
    }
    function dispatchEvent(event) {
        Array.from(waiters).forEach(function (waiter) {
            if (!waiter.match(event)) {
                return;
            }
            waiter.finish();
        });
    }
    function waitForEvent(input) {
        return new Promise(function (resolve) {
            var finish = function (matched) {
                clearTimeout(waiter.timer);
                waiters.delete(waiter);
                resolve(matched);
            };
            var waiter = {
                match: input.match,
                finish: function () {
                    finish(true);
                },
                timer: setTimeout(function () {
                    finish(false);
                }, input.timeoutMs),
            };
            waiters.add(waiter);
        });
    }
    function getNextPendingForSession(sessionID) {
        for (var _i = 0, _a = pendingByMessageId.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], messageID = _b[0], pending = _b[1];
            if (pending.sessionID !== sessionID) {
                continue;
            }
            if (pending.started) {
                continue;
            }
            return { messageID: messageID, pending: pending };
        }
        return undefined;
    }
    return {
        dispatchEvent: dispatchEvent,
        waitForEvent: waitForEvent,
        getNextPendingForSession: getNextPendingForSession,
        hasPending: function (messageID) {
            return pendingByMessageId.has(messageID);
        },
        getPending: function (messageID) {
            return pendingByMessageId.get(messageID);
        },
        // Schedule a timeout to interrupt a pending message. Cleans up any
        // existing timer for the same messageID before setting a new one.
        schedulePending: function (_a) {
            var messageID = _a.messageID, sessionID = _a.sessionID, parts = _a.parts, delayMs = _a.delayMs, onTimeout = _a.onTimeout;
            var existing = pendingByMessageId.get(messageID);
            if (existing) {
                clearTimeout(existing.timer);
            }
            var timer = setTimeout(onTimeout, delayMs);
            pendingByMessageId.set(messageID, {
                sessionID: sessionID,
                started: false,
                timer: timer,
                abortAfterStepMessageID: latestAssistantMessageIDBySession.get(sessionID),
                parts: parts,
                agent: undefined,
                model: undefined,
            });
        },
        markStarted: function (messageID) {
            var pending = pendingByMessageId.get(messageID);
            if (!pending) {
                return;
            }
            pending.started = true;
            clearPending(messageID);
        },
        clearPending: clearPending,
        isRecovering: function (sessionID) {
            return recoveringSessions.has(sessionID);
        },
        setRecovering: function (sessionID) {
            recoveringSessions.add(sessionID);
        },
        clearRecovering: function (sessionID) {
            recoveringSessions.delete(sessionID);
        },
        setLatestAssistantMessage: function (sessionID, messageID) {
            latestAssistantMessageIDBySession.set(sessionID, messageID);
        },
        clearLatestAssistantMessage: function (sessionID) {
            latestAssistantMessageIDBySession.delete(sessionID);
        },
        markReplayed: function (messageID) {
            replayedMessageIds.add(messageID);
        },
        isReplayed: function (messageID) {
            return replayedMessageIds.has(messageID);
        },
        clearReplayed: function (messageID) {
            replayedMessageIds.delete(messageID);
        },
        // Clean up all state for a deleted session — timers, recovery locks, etc.
        cleanupSession: function (sessionID) {
            latestAssistantMessageIDBySession.delete(sessionID);
            Array.from(pendingByMessageId.entries()).forEach(function (_a) {
                var messageID = _a[0], pending = _a[1];
                if (pending.sessionID !== sessionID) {
                    return;
                }
                replayedMessageIds.delete(messageID);
                clearPending(messageID);
            });
        },
    };
}
// ── Plugin ───────────────────────────────────────────────────────
var interruptOpencodeSessionOnUserMessage = function (ctx) { return __awaiter(void 0, void 0, void 0, function () {
    function interruptPendingMessage(messageID) {
        return __awaiter(this, void 0, void 0, function () {
            var pending, sessionID, abortedAssistantWait, idleWait, currentPending, replayBody, nextPending_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pending = state.getPending(messageID);
                        if (!pending) {
                            state.clearPending(messageID);
                            return [2 /*return*/];
                        }
                        if (pending.started) {
                            state.clearPending(messageID);
                            return [2 /*return*/];
                        }
                        sessionID = pending.sessionID;
                        if (state.isRecovering(sessionID)) {
                            state.schedulePending({
                                messageID: messageID,
                                sessionID: sessionID,
                                parts: pending.parts,
                                delayMs: 200,
                                onTimeout: function () {
                                    void interruptPendingMessage(messageID);
                                },
                            });
                            return [2 /*return*/];
                        }
                        state.setRecovering(sessionID);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 6, 7]);
                        abortedAssistantWait = state.waitForEvent({
                            match: function (event) {
                                var _a;
                                return (event.type === 'message.updated'
                                    && event.properties.info.role === 'assistant'
                                    && event.properties.info.sessionID === sessionID
                                    && ((_a = event.properties.info.error) === null || _a === void 0 ? void 0 : _a.name) === 'MessageAbortedError');
                            },
                            timeoutMs: 5000,
                        });
                        idleWait = state.waitForEvent({
                            match: function (event) {
                                return event.type === 'session.idle' && event.properties.sessionID === sessionID;
                            },
                            timeoutMs: 10000,
                        });
                        return [4 /*yield*/, ctx.client.session.abort({
                                path: { id: sessionID },
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, abortedAssistantWait];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, idleWait];
                    case 4:
                        _a.sent();
                        currentPending = state.getPending(messageID);
                        if (!currentPending || currentPending.started) {
                            state.clearPending(messageID);
                            return [2 /*return*/];
                        }
                        replayBody = {
                            messageID: messageID,
                            parts: currentPending.parts,
                        };
                        if (currentPending.agent) {
                            replayBody.agent = currentPending.agent;
                        }
                        if (currentPending.model) {
                            replayBody.model = currentPending.model;
                        }
                        // Mark as replayed BEFORE promptAsync so the chat.message hook
                        // (which fires synchronously when opencode processes the message)
                        // knows to skip scheduling a new interrupt timer. Without this,
                        // replayed messages re-enter the interrupt pipeline and create an
                        // infinite abort→replay loop when the LLM takes >timeout to respond.
                        state.markReplayed(messageID);
                        return [4 /*yield*/, ctx.client.session.promptAsync({
                                path: { id: sessionID },
                                body: replayBody,
                            })];
                    case 5:
                        _a.sent();
                        state.clearPending(messageID);
                        nextPending_1 = state.getNextPendingForSession(sessionID);
                        if (!nextPending_1) {
                            return [2 /*return*/];
                        }
                        state.schedulePending({
                            messageID: nextPending_1.messageID,
                            sessionID: sessionID,
                            parts: nextPending_1.pending.parts,
                            delayMs: 50,
                            onTimeout: function () {
                                void interruptPendingMessage(nextPending_1.messageID);
                            },
                        });
                        return [3 /*break*/, 7];
                    case 6:
                        state.clearRecovering(sessionID);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    var interruptStepTimeoutMs, state;
    return __generator(this, function (_a) {
        interruptStepTimeoutMs = getInterruptStepTimeoutMsFromEnv();
        state = createInterruptState();
        return [2 /*return*/, {
                event: function (_a) {
                    return __awaiter(this, arguments, void 0, function (_b) {
                        var nextPending, nextPending, parentID;
                        var event = _b.event;
                        return __generator(this, function (_c) {
                            state.dispatchEvent(event);
                            if (event.type === 'message.part.updated' && event.properties.part.type === 'step-finish') {
                                nextPending = state.getNextPendingForSession(event.properties.part.sessionID);
                                if (!nextPending) {
                                    return [2 /*return*/];
                                }
                                if (state.isRecovering(nextPending.pending.sessionID)) {
                                    return [2 /*return*/];
                                }
                                if (!nextPending.pending.abortAfterStepMessageID) {
                                    return [2 /*return*/];
                                }
                                if (event.properties.part.messageID !== nextPending.pending.abortAfterStepMessageID) {
                                    return [2 /*return*/];
                                }
                                void interruptPendingMessage(nextPending.messageID);
                                return [2 /*return*/];
                            }
                            if (event.type === 'message.updated' && event.properties.info.role === 'assistant') {
                                if (!event.properties.info.error) {
                                    state.setLatestAssistantMessage(event.properties.info.sessionID, event.properties.info.id);
                                }
                                nextPending = state.getNextPendingForSession(event.properties.info.sessionID);
                                if (nextPending
                                    && !nextPending.pending.started
                                    && !event.properties.info.error
                                    && event.properties.info.parentID !== nextPending.messageID) {
                                    nextPending.pending.abortAfterStepMessageID = event.properties.info.id;
                                }
                                parentID = event.properties.info.parentID;
                                state.markStarted(parentID);
                                return [2 /*return*/];
                            }
                            if (event.type === 'session.idle') {
                                state.clearLatestAssistantMessage(event.properties.sessionID);
                                return [2 /*return*/];
                            }
                            if (event.type === 'session.deleted') {
                                state.cleanupSession(event.properties.info.id);
                            }
                            return [2 /*return*/];
                        });
                    });
                },
                'chat.message': function (input, output) {
                    return __awaiter(this, void 0, void 0, function () {
                        var sessionID, messageID, pending;
                        return __generator(this, function (_a) {
                            sessionID = input.sessionID;
                            if (!sessionID) {
                                return [2 /*return*/];
                            }
                            // Ignore empty-parts messages (e.g. our own promptAsync({ parts: [] })
                            // resume calls). These are synthetic and should not trigger interruption.
                            if (output.parts.length === 0) {
                                return [2 /*return*/];
                            }
                            messageID = input.messageID || output.message.id;
                            if (!messageID) {
                                return [2 /*return*/];
                            }
                            // Skip replayed messages — they were already interrupted and replayed
                            // by interruptPendingMessage. Scheduling a new timer would create an
                            // infinite abort→replay loop when the LLM is slow (large context).
                            if (state.isReplayed(messageID)) {
                                state.clearReplayed(messageID);
                                return [2 /*return*/];
                            }
                            if (state.hasPending(messageID)) {
                                return [2 /*return*/];
                            }
                            state.schedulePending({
                                messageID: messageID,
                                sessionID: sessionID,
                                parts: toPromptParts(output.parts),
                                delayMs: interruptStepTimeoutMs,
                                onTimeout: function () {
                                    void interruptPendingMessage(messageID);
                                },
                            });
                            pending = state.getPending(messageID);
                            if (!pending) {
                                return [2 /*return*/];
                            }
                            pending.agent = output.message.agent;
                            pending.model = output.message.model;
                            return [2 /*return*/];
                        });
                    });
                },
            }];
    });
}); };
exports.interruptOpencodeSessionOnUserMessage = interruptOpencodeSessionOnUserMessage;
