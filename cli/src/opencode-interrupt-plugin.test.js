"use strict";
// Runtime tests for queued-message interrupt plugin behavior.
//
// Event fixtures here come from real Kimaki sessions, trimmed to only the parts
// that affect interrupt behavior:
// 1) export session events:
//    `pnpm tsx src/cli.ts session export-events-jsonl --session <id> --out ../tmp/<id>.jsonl`
// 2) inspect timeline:
//    `jq -r '[.timestamp, .event.type, (.event.properties.status.type // .event.properties.info.role // .event.properties.error.name // ""), (.event.properties.info.id // .event.properties.sessionID // ""), (.event.properties.info.parentID // "")] | @tsv' ../tmp/<id>.jsonl`
// 3) keep only status/error/assistant-parent events relevant to timeout + resume.
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
var vitest_1 = require("vitest");
var opencode_interrupt_plugin_js_1 = require("./opencode-interrupt-plugin.js");
var REAL_RATE_LIMIT_CASE = {
    sessionID: 'ses_34227488cffeO6V9KFc4QRzCr1',
    previousMessageID: 'msg_cbdd8fa01001UYKvAEc7rx3nTO',
    queuedMessageID: 'msg_cbdd923e5001ZSCxCbj9oGbdHV',
    events: [
        {
            type: 'session.status',
            properties: {
                sessionID: 'ses_34227488cffeO6V9KFc4QRzCr1',
                status: {
                    type: 'retry',
                    attempt: 1,
                    message: 'Resource exhausted, please retry after 8.643s.',
                    next: 1772711648923,
                },
            },
        },
        {
            type: 'message.updated',
            properties: {
                info: {
                    role: 'assistant',
                    sessionID: 'ses_34227488cffeO6V9KFc4QRzCr1',
                    parentID: 'msg_cbdd8fa01001UYKvAEc7rx3nTO',
                },
            },
        },
    ],
};
var REAL_SLEEP_INTERRUPT_CASE = {
    sessionID: 'ses_342257e56ffeNdEEQ3lVVR3sZe',
    runningMessageID: 'msg_cbddaa49c00123dKnwvzTVjutL',
    interruptingMessageID: 'msg_cbddad73c001LZrsb4XMZt5Lls',
    assistantRunningEvent: {
        type: 'message.updated',
        properties: {
            info: {
                role: 'assistant',
                sessionID: 'ses_342257e56ffeNdEEQ3lVVR3sZe',
                parentID: 'msg_cbddaa49c00123dKnwvzTVjutL',
            },
        },
    },
    idleEvent: {
        type: 'session.idle',
        properties: {
            sessionID: 'ses_342257e56ffeNdEEQ3lVVR3sZe',
        },
    },
    abortErrorEvent: {
        type: 'session.error',
        properties: {
            sessionID: 'ses_342257e56ffeNdEEQ3lVVR3sZe',
            error: {
                name: 'MessageAbortedError',
                data: { message: 'The operation was aborted.' },
            },
        },
    },
};
function createContext(_a) {
    var client = _a.client;
    return {
        client: client,
        project: {
            id: 'project-id',
            worktree: '/Users/morse/Documents/GitHub/kimakivoice',
            time: { created: Date.now() },
        },
        directory: '/Users/morse/Documents/GitHub/kimakivoice',
        worktree: '/Users/morse/Documents/GitHub/kimakivoice',
        experimental_workspace: {
            register: function () {
                return;
            },
        },
        serverUrl: new URL('http://127.0.0.1:4096'),
        $: {},
    };
}
function createChatOutput(_a) {
    var sessionID = _a.sessionID, messageID = _a.messageID, parts = _a.parts;
    return {
        message: {
            id: messageID,
            sessionID: sessionID,
            role: 'user',
            time: { created: Date.now() },
        },
        parts: parts || [{ type: 'text', text: 'user message' }],
    };
}
function createSessionErrorEvent(_a) {
    var sessionID = _a.sessionID;
    return {
        type: 'session.error',
        properties: {
            sessionID: sessionID,
            error: {
                name: 'MessageAbortedError',
                data: { message: 'The operation was aborted.' },
            },
        },
    };
}
function createSessionIdleEvent(_a) {
    var sessionID = _a.sessionID;
    return {
        type: 'session.idle',
        properties: { sessionID: sessionID },
    };
}
function createAssistantAbortedEvent(_a) {
    var sessionID = _a.sessionID, assistantMessageID = _a.assistantMessageID, parentID = _a.parentID;
    return {
        type: 'message.updated',
        properties: {
            info: {
                id: assistantMessageID,
                role: 'assistant',
                sessionID: sessionID,
                parentID: parentID,
                error: {
                    name: 'MessageAbortedError',
                    data: { message: 'The operation was aborted.' },
                },
            },
        },
    };
}
function createAssistantStartedEvent(_a) {
    var sessionID = _a.sessionID, messageID = _a.messageID, assistantMessageID = _a.assistantMessageID;
    return {
        type: 'message.updated',
        properties: {
            info: {
                id: assistantMessageID,
                role: 'assistant',
                sessionID: sessionID,
                parentID: messageID,
            },
        },
    };
}
function createStepFinishEvent(_a) {
    var sessionID = _a.sessionID, assistantMessageID = _a.assistantMessageID;
    return {
        type: 'message.part.updated',
        properties: {
            part: {
                id: 'prt-step-finish',
                sessionID: sessionID,
                messageID: assistantMessageID,
                type: 'step-finish',
                reason: 'tool-calls',
                cost: 0,
                tokens: {
                    input: 0,
                    output: 0,
                    reasoning: 0,
                    cache: { read: 0, write: 0 },
                },
            },
        },
    };
}
function delay(_a) {
    var ms = _a.ms;
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve();
        }, ms);
    });
}
function requireHooks(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var hooks, eventHook, chatHook;
        var client = _b.client;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, opencode_interrupt_plugin_js_1.interruptOpencodeSessionOnUserMessage)(createContext({ client: client }))];
                case 1:
                    hooks = _c.sent();
                    eventHook = hooks.event;
                    if (!eventHook) {
                        throw new Error('Expected event hook');
                    }
                    chatHook = hooks['chat.message'];
                    if (!chatHook) {
                        throw new Error('Expected chat.message hook');
                    }
                    return [2 /*return*/, { eventHook: eventHook, chatHook: chatHook }];
            }
        });
    });
}
(0, vitest_1.afterEach)(function () {
    delete process.env['KIMAKI_INTERRUPT_STEP_TIMEOUT_MS'];
});
(0, vitest_1.describe)('interruptOpencodeSessionOnUserMessage', function () {
    (0, vitest_1.test)('real rate-limit trace keeps queued message unsent until timeout recovery', function () { return __awaiter(void 0, void 0, void 0, function () {
        var abortCalls, promptAsyncCalls, client, _a, eventHook, chatHook, _i, _b, event_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    process.env['KIMAKI_INTERRUPT_STEP_TIMEOUT_MS'] = '20';
                    abortCalls = [];
                    promptAsyncCalls = [];
                    client = {
                        session: {
                            abort: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    abortCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                            promptAsync: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    promptAsyncCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                        },
                    };
                    return [4 /*yield*/, requireHooks({ client: client })];
                case 1:
                    _a = _c.sent(), eventHook = _a.eventHook, chatHook = _a.chatHook;
                    return [4 /*yield*/, chatHook({
                            sessionID: REAL_RATE_LIMIT_CASE.sessionID,
                            messageID: REAL_RATE_LIMIT_CASE.queuedMessageID,
                        }, createChatOutput({
                            sessionID: REAL_RATE_LIMIT_CASE.sessionID,
                            messageID: REAL_RATE_LIMIT_CASE.queuedMessageID,
                        }))];
                case 2:
                    _c.sent();
                    _i = 0, _b = REAL_RATE_LIMIT_CASE.events;
                    _c.label = 3;
                case 3:
                    if (!(_i < _b.length)) return [3 /*break*/, 6];
                    event_1 = _b[_i];
                    return [4 /*yield*/, eventHook({ event: event_1 })];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [4 /*yield*/, delay({ ms: 30 })];
                case 7:
                    _c.sent();
                    return [4 /*yield*/, eventHook({
                            event: createSessionErrorEvent({ sessionID: REAL_RATE_LIMIT_CASE.sessionID }),
                        })];
                case 8:
                    _c.sent();
                    return [4 /*yield*/, eventHook({
                            event: createSessionIdleEvent({ sessionID: REAL_RATE_LIMIT_CASE.sessionID }),
                        })];
                case 9:
                    _c.sent();
                    return [4 /*yield*/, eventHook({
                            event: createAssistantAbortedEvent({
                                sessionID: REAL_RATE_LIMIT_CASE.sessionID,
                                assistantMessageID: 'msg-rate-limit-aborted',
                                parentID: REAL_RATE_LIMIT_CASE.previousMessageID,
                            }),
                        })];
                case 10:
                    _c.sent();
                    return [4 /*yield*/, delay({ ms: 20 })];
                case 11:
                    _c.sent();
                    (0, vitest_1.expect)(abortCalls).toEqual([{ path: { id: REAL_RATE_LIMIT_CASE.sessionID } }]);
                    (0, vitest_1.expect)(promptAsyncCalls).toEqual([
                        {
                            path: { id: REAL_RATE_LIMIT_CASE.sessionID },
                            body: {
                                messageID: REAL_RATE_LIMIT_CASE.queuedMessageID,
                                parts: [{ type: 'text', text: 'user message' }],
                            },
                        },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('assistant parent match marks sent and skips timeout abort', function () { return __awaiter(void 0, void 0, void 0, function () {
        var abortCalls, promptAsyncCalls, client, _a, eventHook, chatHook, sessionID, messageID;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    process.env['KIMAKI_INTERRUPT_STEP_TIMEOUT_MS'] = '40';
                    abortCalls = [];
                    promptAsyncCalls = [];
                    client = {
                        session: {
                            abort: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    abortCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                            promptAsync: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    promptAsyncCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                        },
                    };
                    return [4 /*yield*/, requireHooks({ client: client })];
                case 1:
                    _a = _b.sent(), eventHook = _a.eventHook, chatHook = _a.chatHook;
                    sessionID = 'ses-sent';
                    messageID = 'msg-sent';
                    return [4 /*yield*/, chatHook({ sessionID: sessionID, messageID: messageID }, createChatOutput({ sessionID: sessionID, messageID: messageID }))];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, eventHook({
                            event: createAssistantStartedEvent({
                                sessionID: sessionID,
                                messageID: messageID,
                                assistantMessageID: 'msg-sent-assistant',
                            }),
                        })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, delay({ ms: 70 })];
                case 4:
                    _b.sent();
                    (0, vitest_1.expect)(abortCalls).toEqual([]);
                    (0, vitest_1.expect)(promptAsyncCalls).toEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('empty resume messages do not schedule interruption tracking', function () { return __awaiter(void 0, void 0, void 0, function () {
        var abortCalls, promptAsyncCalls, client, chatHook;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    process.env['KIMAKI_INTERRUPT_STEP_TIMEOUT_MS'] = '20';
                    abortCalls = [];
                    promptAsyncCalls = [];
                    client = {
                        session: {
                            abort: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    abortCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                            promptAsync: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    promptAsyncCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                        },
                    };
                    return [4 /*yield*/, requireHooks({ client: client })];
                case 1:
                    chatHook = (_a.sent()).chatHook;
                    return [4 /*yield*/, chatHook({ sessionID: 'ses-empty-resume', messageID: 'msg-empty-resume' }, createChatOutput({
                            sessionID: 'ses-empty-resume',
                            messageID: 'msg-empty-resume',
                            parts: [],
                        }))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, delay({ ms: 40 })];
                case 3:
                    _a.sent();
                    (0, vitest_1.expect)(abortCalls).toEqual([]);
                    (0, vitest_1.expect)(promptAsyncCalls).toEqual([]);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('abort recovery replays the original queued user message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var abortCalls, promptAsyncCalls, client, _a, eventHook, chatHook, sessionID, firstMsgID, userMsgID;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    process.env['KIMAKI_INTERRUPT_STEP_TIMEOUT_MS'] = '20';
                    abortCalls = [];
                    promptAsyncCalls = [];
                    client = {
                        session: {
                            abort: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    abortCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                            promptAsync: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    promptAsyncCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                        },
                    };
                    return [4 /*yield*/, requireHooks({ client: client })];
                case 1:
                    _a = _b.sent(), eventHook = _a.eventHook, chatHook = _a.chatHook;
                    sessionID = 'ses-33bb-repro';
                    firstMsgID = 'msg-first-streaming';
                    userMsgID = 'msg-user-queued';
                    // 1. First message is running (assistant already started on it)
                    return [4 /*yield*/, chatHook({ sessionID: sessionID, messageID: firstMsgID }, createChatOutput({ sessionID: sessionID, messageID: firstMsgID }))];
                case 2:
                    // 1. First message is running (assistant already started on it)
                    _b.sent();
                    return [4 /*yield*/, eventHook({
                            event: createAssistantStartedEvent({
                                sessionID: sessionID,
                                messageID: firstMsgID,
                                assistantMessageID: 'msg-first-assistant',
                            }),
                        })
                        // 2. User sends second message while session is busy streaming
                    ];
                case 3:
                    _b.sent();
                    // 2. User sends second message while session is busy streaming
                    return [4 /*yield*/, chatHook({ sessionID: sessionID, messageID: userMsgID }, createChatOutput({ sessionID: sessionID, messageID: userMsgID }))
                        // 3. Timeout fires (20ms), plugin runs handleUnsentTimeout
                    ];
                case 4:
                    // 2. User sends second message while session is busy streaming
                    _b.sent();
                    // 3. Timeout fires (20ms), plugin runs handleUnsentTimeout
                    return [4 /*yield*/, delay({ ms: 30 })
                        // 4. Simulate abort completing (error + idle from opencode)
                    ];
                case 5:
                    // 3. Timeout fires (20ms), plugin runs handleUnsentTimeout
                    _b.sent();
                    // 4. Simulate abort completing (error + idle from opencode)
                    return [4 /*yield*/, eventHook({ event: createSessionErrorEvent({ sessionID: sessionID }) })];
                case 6:
                    // 4. Simulate abort completing (error + idle from opencode)
                    _b.sent();
                    return [4 /*yield*/, eventHook({ event: createSessionIdleEvent({ sessionID: sessionID }) })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, eventHook({
                            event: createAssistantAbortedEvent({
                                sessionID: sessionID,
                                assistantMessageID: 'msg-aborted-after-timeout',
                                parentID: firstMsgID,
                            }),
                        })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, delay({ ms: 20 })
                        // 5. Verify plugin aborted the session
                    ];
                case 9:
                    _b.sent();
                    // 5. Verify plugin aborted the session
                    (0, vitest_1.expect)(abortCalls).toEqual([{ path: { id: sessionID } }]);
                    // 6. Recovery should replay the queued message itself, not an empty
                    //    resume prompt. This preserves the original messageID + parts after
                    //    session.abort() clears OpenCode's internal prompt queue.
                    (0, vitest_1.expect)(promptAsyncCalls).toEqual([
                        {
                            path: { id: sessionID },
                            body: {
                                messageID: userMsgID,
                                parts: [{ type: 'text', text: 'user message' }],
                            },
                        },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('real sleep interrupt trace still recovers queued interrupt message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var abortCalls, promptAsyncCalls, client, _a, eventHook, chatHook;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    process.env['KIMAKI_INTERRUPT_STEP_TIMEOUT_MS'] = '20';
                    abortCalls = [];
                    promptAsyncCalls = [];
                    client = {
                        session: {
                            abort: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    abortCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                            promptAsync: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    promptAsyncCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                        },
                    };
                    return [4 /*yield*/, requireHooks({ client: client })];
                case 1:
                    _a = _b.sent(), eventHook = _a.eventHook, chatHook = _a.chatHook;
                    return [4 /*yield*/, chatHook({
                            sessionID: REAL_SLEEP_INTERRUPT_CASE.sessionID,
                            messageID: REAL_SLEEP_INTERRUPT_CASE.runningMessageID,
                        }, createChatOutput({
                            sessionID: REAL_SLEEP_INTERRUPT_CASE.sessionID,
                            messageID: REAL_SLEEP_INTERRUPT_CASE.runningMessageID,
                        }))];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, eventHook({ event: REAL_SLEEP_INTERRUPT_CASE.assistantRunningEvent })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, chatHook({
                            sessionID: REAL_SLEEP_INTERRUPT_CASE.sessionID,
                            messageID: REAL_SLEEP_INTERRUPT_CASE.interruptingMessageID,
                        }, createChatOutput({
                            sessionID: REAL_SLEEP_INTERRUPT_CASE.sessionID,
                            messageID: REAL_SLEEP_INTERRUPT_CASE.interruptingMessageID,
                        }))];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, delay({ ms: 30 })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, eventHook({ event: REAL_SLEEP_INTERRUPT_CASE.idleEvent })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, eventHook({ event: REAL_SLEEP_INTERRUPT_CASE.abortErrorEvent })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, eventHook({
                            event: createAssistantAbortedEvent({
                                sessionID: REAL_SLEEP_INTERRUPT_CASE.sessionID,
                                assistantMessageID: 'msg-sleep-aborted',
                                parentID: REAL_SLEEP_INTERRUPT_CASE.runningMessageID,
                            }),
                        })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, delay({ ms: 20 })];
                case 9:
                    _b.sent();
                    (0, vitest_1.expect)(abortCalls).toEqual([{ path: { id: REAL_SLEEP_INTERRUPT_CASE.sessionID } }]);
                    (0, vitest_1.expect)(promptAsyncCalls).toEqual([
                        {
                            path: { id: REAL_SLEEP_INTERRUPT_CASE.sessionID },
                            body: {
                                messageID: REAL_SLEEP_INTERRUPT_CASE.interruptingMessageID,
                                parts: [{ type: 'text', text: 'user message' }],
                            },
                        },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('queued follow-up aborts on next blocking assistant step-finish before hard timeout', function () { return __awaiter(void 0, void 0, void 0, function () {
        var abortCalls, promptAsyncCalls, client, _a, eventHook, chatHook, sessionID, runningMessageID, runningAssistantMessageID, queuedMessageID;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    process.env['KIMAKI_INTERRUPT_STEP_TIMEOUT_MS'] = '500';
                    abortCalls = [];
                    promptAsyncCalls = [];
                    client = {
                        session: {
                            abort: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    abortCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                            promptAsync: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    promptAsyncCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                        },
                    };
                    return [4 /*yield*/, requireHooks({ client: client })];
                case 1:
                    _a = _b.sent(), eventHook = _a.eventHook, chatHook = _a.chatHook;
                    sessionID = 'ses-step-finish';
                    runningMessageID = 'msg-running';
                    runningAssistantMessageID = 'msg-running-assistant';
                    queuedMessageID = 'msg-queued';
                    return [4 /*yield*/, chatHook({ sessionID: sessionID, messageID: runningMessageID }, createChatOutput({ sessionID: sessionID, messageID: runningMessageID }))];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, eventHook({
                            event: createAssistantStartedEvent({
                                sessionID: sessionID,
                                messageID: runningMessageID,
                                assistantMessageID: runningAssistantMessageID,
                            }),
                        })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, chatHook({ sessionID: sessionID, messageID: queuedMessageID }, createChatOutput({ sessionID: sessionID, messageID: queuedMessageID }))];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, eventHook({
                            event: createStepFinishEvent({
                                sessionID: sessionID,
                                assistantMessageID: runningAssistantMessageID,
                            }),
                        })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, delay({ ms: 10 })];
                case 6:
                    _b.sent();
                    (0, vitest_1.expect)(abortCalls).toEqual([{ path: { id: sessionID } }]);
                    return [4 /*yield*/, eventHook({ event: createSessionIdleEvent({ sessionID: sessionID }) })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, eventHook({ event: createSessionErrorEvent({ sessionID: sessionID }) })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, eventHook({
                            event: createAssistantAbortedEvent({
                                sessionID: sessionID,
                                assistantMessageID: runningAssistantMessageID,
                                parentID: runningMessageID,
                            }),
                        })];
                case 9:
                    _b.sent();
                    return [4 /*yield*/, delay({ ms: 20 })];
                case 10:
                    _b.sent();
                    (0, vitest_1.expect)(promptAsyncCalls).toEqual([
                        {
                            path: { id: sessionID },
                            body: {
                                messageID: queuedMessageID,
                                parts: [{ type: 'text', text: 'user message' }],
                            },
                        },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
});
