"use strict";
// E2e tests for abort, model-switch, and retry scenarios.
// Split from thread-queue-advanced.e2e.test.ts for parallelization.
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
var queue_advanced_e2e_setup_js_1 = require("./queue-advanced-e2e-setup.js");
var thread_session_runtime_js_1 = require("./session-handler/thread-session-runtime.js");
var thread_runtime_state_js_1 = require("./session-handler/thread-runtime-state.js");
var database_js_1 = require("./database.js");
var test_utils_js_1 = require("./test-utils.js");
var TEXT_CHANNEL_ID = '200000000000001003';
var e2eTest = vitest_1.describe;
e2eTest('queue advanced: abort and retry', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-abort-e2e',
        dirName: 'qa-abort-e2e',
        username: 'queue-advanced-tester',
    });
    (0, vitest_1.test)('slow tool call (sleep) gets aborted by explicit abort, then queue continues', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, firstReply, before, beforeBotCount, runtime, after, afterBotMessages, timeline, oscarIdx, sleepIdx, papaIdx, sleepToolIndex, userPapaIndex, lastBotIndex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: oscar',
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: oscar';
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    firstReply = _a.sent();
                    (0, vitest_1.expect)(firstReply.content.trim().length).toBeGreaterThan(0);
                    // Wait for the first completion footer so it lands in a deterministic position
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })];
                case 4:
                    // Wait for the first completion footer so it lands in a deterministic position
                    _a.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 5:
                    before = _a.sent();
                    beforeBotCount = before.filter(function (m) {
                        return m.author.id === ctx.discord.botUserId;
                    }).length;
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                        })
                        // The matcher emits "starting sleep 100" text before the long delay.
                        // Wait for it to land in Discord BEFORE aborting so the message is in a
                        // deterministic position and the abort produces no further stray messages.
                    ];
                case 6:
                    _a.sent();
                    // The matcher emits "starting sleep 100" text before the long delay.
                    // Wait for it to land in Discord BEFORE aborting so the message is in a
                    // deterministic position and the abort produces no further stray messages.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'starting sleep',
                            afterUserMessageIncludes: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                            timeout: 4000,
                        })];
                case 7:
                    // The matcher emits "starting sleep 100" text before the long delay.
                    // Wait for it to land in Discord BEFORE aborting so the message is in a
                    // deterministic position and the abort produces no further stray messages.
                    _a.sent();
                    runtime = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtime).toBeDefined();
                    if (!runtime) {
                        throw new Error('Expected runtime to exist for explicit-abort test');
                    }
                    runtime.abortActiveRun('test-explicit-abort');
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: papa',
                        })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            userMessageIncludes: 'papa',
                            timeout: 8000,
                        })];
                case 9:
                    after = _a.sent();
                    afterBotMessages = after.filter(function (m) {
                        return m.author.id === ctx.discord.botUserId;
                    });
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: 'papa',
                            afterAuthorId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                        })
                        // Assert ordering invariants instead of exact snapshot — the papa reply
                        // and footer can interleave non-deterministically.
                    ];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, th.text()];
                case 11:
                    timeline = _a.sent();
                    (0, vitest_1.expect)(timeline).toContain('Reply with exactly: oscar');
                    (0, vitest_1.expect)(timeline).toContain('PLUGIN_TIMEOUT_SLEEP_MARKER');
                    (0, vitest_1.expect)(timeline).toContain('⬥ starting sleep 100');
                    (0, vitest_1.expect)(timeline).toContain('Reply with exactly: papa');
                    (0, vitest_1.expect)(timeline).toContain('*project ⋅ main ⋅');
                    oscarIdx = timeline.indexOf('oscar');
                    sleepIdx = timeline.indexOf('PLUGIN_TIMEOUT_SLEEP_MARKER');
                    papaIdx = timeline.indexOf('papa');
                    (0, vitest_1.expect)(oscarIdx).toBeLessThan(sleepIdx);
                    (0, vitest_1.expect)(sleepIdx).toBeLessThan(papaIdx);
                    (0, vitest_1.expect)(afterBotMessages.length).toBeGreaterThanOrEqual(beforeBotCount + 1);
                    sleepToolIndex = after.findIndex(function (m) {
                        return (m.author.id === queue_advanced_e2e_setup_js_1.TEST_USER_ID &&
                            m.content.includes('PLUGIN_TIMEOUT_SLEEP_MARKER'));
                    });
                    (0, vitest_1.expect)(sleepToolIndex).toBeGreaterThan(-1);
                    userPapaIndex = after.findIndex(function (m) {
                        return m.author.id === queue_advanced_e2e_setup_js_1.TEST_USER_ID && m.content.includes('papa');
                    });
                    (0, vitest_1.expect)(userPapaIndex).toBeGreaterThan(-1);
                    (0, vitest_1.expect)(sleepToolIndex).toBeLessThan(userPapaIndex);
                    lastBotIndex = after.findLastIndex(function (m) {
                        return m.author.id === ctx.discord.botUserId;
                    });
                    (0, vitest_1.expect)(userPapaIndex).toBeLessThan(lastBotIndex);
                    return [2 /*return*/];
            }
        });
    }); }, 12000);
    (0, vitest_1.test)('explicit abort emits MessageAbortedError and does not emit footer', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, runtime, beforeAbortMessages, baselineCount, i, msgs, newMsgs, hasFooter, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: abort-no-footer-setup',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: abort-no-footer-setup';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: '⋅',
                            timeout: 4000,
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'SLOW_ABORT_MARKER run long response',
                        })];
                case 5:
                    _b.sent();
                    runtime = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtime).toBeDefined();
                    if (!runtime) {
                        throw new Error('Expected runtime to exist for abort no-footer test');
                    }
                    return [4 /*yield*/, th.getMessages()];
                case 6:
                    beforeAbortMessages = _b.sent();
                    baselineCount = beforeAbortMessages.length;
                    runtime.abortActiveRun('test-no-footer-on-abort');
                    i = 0;
                    _b.label = 7;
                case 7:
                    if (!(i < 10)) return [3 /*break*/, 11];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 20);
                        })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 9:
                    msgs = _b.sent();
                    newMsgs = msgs.slice(baselineCount);
                    hasFooter = newMsgs.some(function (m) {
                        return m.author.id === ctx.discord.botUserId
                            && m.content.startsWith('*')
                            && m.content.includes('⋅');
                    });
                    (0, vitest_1.expect)(hasFooter).toBe(false);
                    _b.label = 10;
                case 10:
                    i++;
                    return [3 /*break*/, 7];
                case 11:
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 12:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-advanced-tester)\n        Reply with exactly: abort-no-footer-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (queue-advanced-tester)\n        SLOW_ABORT_MARKER run long response\"\n      ");
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    vitest_1.test.skip('explicit abort stale-idle window: follow-up prompt still gets assistant text', function () { return __awaiter(void 0, void 0, void 0, function () {
        var setupPrompt, raceFinalPrompt, thread, th, setupReply, runtime;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setupPrompt = 'Reply with exactly: race-setup-1';
                    raceFinalPrompt = 'Reply with exactly: race-final-1';
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: setupPrompt,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === setupPrompt;
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    setupReply = _a.sent();
                    (0, vitest_1.expect)(setupReply.content.trim().length).toBeGreaterThan(0);
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'SLOW_ABORT_MARKER run long response',
                        })];
                case 4:
                    _a.sent();
                    runtime = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtime).toBeDefined();
                    if (!runtime) {
                        throw new Error('Expected runtime to exist for race abort scenario');
                    }
                    runtime.abortActiveRun('test-race-abort');
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: raceFinalPrompt,
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            userMessageIncludes: raceFinalPrompt,
                            timeout: 4000,
                        })];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('model switch mid-session aborts and restarts from same session history', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, firstReply, sessionId, runtime, retried, text;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: retry-setup',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: retry-setup';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    firstReply = _b.sent();
                    (0, vitest_1.expect)(firstReply.content.trim().length).toBeGreaterThan(0);
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'starting sleep',
                            afterUserMessageIncludes: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                            timeout: 4000,
                        })];
                case 5:
                    _b.sent();
                    sessionId = (_a = (0, thread_runtime_state_js_1.getThreadState)(thread.id)) === null || _a === void 0 ? void 0 : _a.sessionId;
                    (0, vitest_1.expect)(sessionId).toBeDefined();
                    if (!sessionId) {
                        throw new Error('Expected active session id for model switch test');
                    }
                    return [4 /*yield*/, (0, database_js_1.setSessionModel)({
                            sessionId: sessionId,
                            modelId: 'deterministic-provider/deterministic-v3',
                            variant: null,
                        })];
                case 6:
                    _b.sent();
                    runtime = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtime).toBeDefined();
                    if (!runtime) {
                        throw new Error('Expected runtime to exist for model switch test');
                    }
                    return [4 /*yield*/, runtime.retryLastUserPrompt()];
                case 7:
                    retried = _b.sent();
                    (0, vitest_1.expect)(retried).toBe(true);
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: model-switch-followup',
                        })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            userMessageIncludes: 'model-switch-followup',
                            timeout: 4000,
                        })
                        // Wait for potential footer to arrive (race between step-finish interrupt
                        // and model switch settling means footer may or may not appear).
                    ];
                case 9:
                    _b.sent();
                    // Wait for potential footer to arrive (race between step-finish interrupt
                    // and model switch settling means footer may or may not appear).
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 200);
                        })];
                case 10:
                    // Wait for potential footer to arrive (race between step-finish interrupt
                    // and model switch settling means footer may or may not appear).
                    _b.sent();
                    return [4 /*yield*/, th.text()
                        // The follow-up reply ("ok") must be present with deterministic-v3
                    ];
                case 11:
                    text = _b.sent();
                    // The follow-up reply ("ok") must be present with deterministic-v3
                    (0, vitest_1.expect)(text).toContain('Reply with exactly: model-switch-followup');
                    (0, vitest_1.expect)(text).toContain('⬥ ok');
                    // The old sleep text should be visible from the first turn
                    (0, vitest_1.expect)(text).toContain('starting sleep 100');
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    (0, vitest_1.test)('abortActiveRun settles correctly during long-running request', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, setupReply, runtime, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: force-abort-setup',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: force-abort-setup';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    setupReply = _b.sent();
                    (0, vitest_1.expect)(setupReply.content.trim().length).toBeGreaterThan(0);
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'SLOW_ABORT_MARKER run long response',
                        })];
                case 4:
                    _b.sent();
                    runtime = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtime).toBeDefined();
                    if (!runtime) {
                        throw new Error('Expected runtime to exist for forced-abort test');
                    }
                    runtime.abortActiveRun('force-abort-test');
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-advanced-tester)\n        Reply with exactly: force-abort-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        --- from: user (queue-advanced-tester)\n        SLOW_ABORT_MARKER run long response\"\n      ");
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
});
