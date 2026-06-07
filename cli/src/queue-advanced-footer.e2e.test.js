"use strict";
// E2e tests for footer emission in advanced queue scenarios.
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
var test_utils_js_1 = require("./test-utils.js");
var TEXT_CHANNEL_ID = '200000000000001001';
var e2eTest = vitest_1.describe;
e2eTest('queue advanced: footer emission', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-footer-e2e',
        dirName: 'qa-footer-e2e',
        username: 'queue-advanced-tester',
    });
    (0, vitest_1.test)('normal completion emits footer after bot reply', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, footerMessages, _a, foundFooter;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: footer-check',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: footer-check';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })];
                case 4:
                    footerMessages = _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-advanced-tester)\n        Reply with exactly: footer-check\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    foundFooter = footerMessages.some(function (m) {
                        return m.author.id === ctx.discord.botUserId
                            && m.content.startsWith('*')
                            && m.content.includes('⋅');
                    });
                    (0, vitest_1.expect)(foundFooter).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('footer appears after second message in same session', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, msgs, footerCount, _a, pollDeadline, found, latestMsgs, count;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: footer-multi-setup',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: footer-multi-setup';
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
                            content: 'Reply with exactly: footer-multi-second',
                        })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            userMessageIncludes: 'footer-multi-second',
                            timeout: 4000,
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'footer-multi-second',
                            afterAuthorId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                        })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 8:
                    msgs = _b.sent();
                    footerCount = msgs.filter(function (m) {
                        return m.author.id === ctx.discord.botUserId
                            && m.content.startsWith('*')
                            && m.content.includes('⋅');
                    }).length;
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 9:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-advanced-tester)\n        Reply with exactly: footer-multi-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (queue-advanced-tester)\n        Reply with exactly: footer-multi-second\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    if (footerCount >= 2) {
                        (0, vitest_1.expect)(footerCount).toBeGreaterThanOrEqual(2);
                        return [2 /*return*/];
                    }
                    pollDeadline = Date.now() + 4000;
                    found = false;
                    _b.label = 10;
                case 10:
                    if (!(Date.now() < pollDeadline)) return [3 /*break*/, 13];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 11:
                    _b.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 12:
                    latestMsgs = _b.sent();
                    count = latestMsgs.filter(function (m) {
                        return m.author.id === ctx.discord.botUserId
                            && m.content.startsWith('*')
                            && m.content.includes('⋅');
                    }).length;
                    if (count >= 2) {
                        found = true;
                        return [3 /*break*/, 13];
                    }
                    return [3 /*break*/, 10];
                case 13:
                    (0, vitest_1.expect)(found).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); }, 12000);
    (0, vitest_1.test)('interrupted run has no footer, completed follow-up has footer', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, beforeInterruptMsgs, baselineCount, messages, followupUserIdx, okReplyIdx, _a, footerBetween;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: interrupt-footer-setup',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: interrupt-footer-setup';
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
                    return [4 /*yield*/, th.getMessages()];
                case 5:
                    beforeInterruptMsgs = _b.sent();
                    baselineCount = beforeInterruptMsgs.length;
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'starting sleep 100',
                            afterUserMessageIncludes: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                            timeout: 4000,
                        })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: interrupt-footer-followup',
                        })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'ok',
                            afterUserMessageIncludes: 'interrupt-footer-followup',
                            timeout: 12000,
                        })];
                case 9:
                    messages = _b.sent();
                    followupUserIdx = messages.findIndex(function (m, idx) {
                        return idx >= baselineCount
                            && m.author.id === queue_advanced_e2e_setup_js_1.TEST_USER_ID
                            && m.content.includes('interrupt-footer-followup');
                    });
                    okReplyIdx = messages.findIndex(function (m, idx) {
                        if (idx <= followupUserIdx) {
                            return false;
                        }
                        return m.author.id === ctx.discord.botUserId && m.content.includes('ok');
                    });
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 12000,
                            afterMessageIncludes: 'interrupt-footer-followup',
                            afterAuthorId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                        })];
                case 10:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 11:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-advanced-tester)\n        Reply with exactly: interrupt-footer-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (queue-advanced-tester)\n        PLUGIN_TIMEOUT_SLEEP_MARKER\n        --- from: assistant (TestBot)\n        \u2B25 starting sleep 100\n        --- from: user (queue-advanced-tester)\n        Reply with exactly: interrupt-footer-followup\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(followupUserIdx).toBeGreaterThanOrEqual(0);
                    (0, vitest_1.expect)(okReplyIdx).toBeGreaterThan(followupUserIdx);
                    footerBetween = messages.some(function (m, idx) {
                        if (idx < baselineCount || idx >= okReplyIdx) {
                            return false;
                        }
                        return m.author.id === ctx.discord.botUserId
                            && m.content.startsWith('*')
                            && m.content.includes('⋅');
                    });
                    (0, vitest_1.expect)(footerBetween).toBe(false);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('plugin timeout interrupt aborts slow sleep and avoids intermediate footer', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, messages, messagesWithFooter, afterIndex, _a, okReplyIndex, footerBeforeReply;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: plugin-timeout-setup',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: plugin-timeout-setup';
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
                            text: '*project',
                            timeout: 4000,
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                        })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'starting sleep 100',
                            afterUserMessageIncludes: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                            timeout: 4000,
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: plugin-timeout-after',
                        })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'ok',
                            afterUserMessageIncludes: 'plugin-timeout-after',
                            timeout: 12000,
                        })];
                case 8:
                    messages = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 12000,
                            afterMessageIncludes: 'plugin-timeout-after',
                            afterAuthorId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                        })];
                case 9:
                    messagesWithFooter = _b.sent();
                    afterIndex = messagesWithFooter.findIndex(function (message) {
                        return (message.author.id === queue_advanced_e2e_setup_js_1.TEST_USER_ID
                            && message.content.includes('plugin-timeout-after'));
                    });
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 10:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-advanced-tester)\n        Reply with exactly: plugin-timeout-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (queue-advanced-tester)\n        PLUGIN_TIMEOUT_SLEEP_MARKER\n        --- from: assistant (TestBot)\n        \u2B25 starting sleep 100\n        --- from: user (queue-advanced-tester)\n        Reply with exactly: plugin-timeout-after\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(afterIndex).toBeGreaterThanOrEqual(0);
                    okReplyIndex = messagesWithFooter.findIndex(function (message, index) {
                        if (index <= afterIndex) {
                            return false;
                        }
                        return message.author.id === ctx.discord.botUserId && message.content.includes('ok');
                    });
                    (0, vitest_1.expect)(okReplyIndex).toBeGreaterThan(afterIndex);
                    footerBeforeReply = messagesWithFooter.some(function (message, index) {
                        if (index <= afterIndex || index >= okReplyIndex) {
                            return false;
                        }
                        if (message.author.id !== ctx.discord.botUserId) {
                            return false;
                        }
                        return message.content.startsWith('*') && message.content.includes('⋅');
                    });
                    (0, vitest_1.expect)(footerBeforeReply).toBe(false);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('tool-call assistant message gets footer when it completes normally', function () { return __awaiter(void 0, void 0, void 0, function () {
        var existingThreadIds, _a, thread, th, deadline, footerCount, msgs, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = Set.bind;
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).getThreads()];
                case 1:
                    existingThreadIds = new (_a.apply(Set, [void 0, (_c.sent()).map(function (thread) {
                            return thread.id;
                        })]))();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'TOOL_CALL_FOOTER_MARKER',
                        })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 6000,
                            predicate: function (t) {
                                return !existingThreadIds.has(t.id);
                            },
                        })];
                case 3:
                    thread = _c.sent();
                    th = ctx.discord.thread(thread.id);
                    // Wait for the follow-up text response after tool completion.
                    // The tool call completes and the model follows up with a second
                    // assistant message containing text.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            userMessageIncludes: 'TOOL_CALL_FOOTER_MARKER',
                            timeout: 6000,
                        })
                        // Wait for at least one footer to appear
                    ];
                case 4:
                    // Wait for the follow-up text response after tool completion.
                    // The tool call completes and the model follows up with a second
                    // assistant message containing text.
                    _c.sent();
                    // Wait for at least one footer to appear
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })
                        // Poll until both footers have arrived — the first footer (after the
                        // tool-call step) and the second (after the text follow-up) are emitted
                        // by sequential handleNaturalAssistantCompletion calls but the second
                        // may not have hit the Discord thread by the time we first check.
                    ];
                case 5:
                    // Wait for at least one footer to appear
                    _c.sent();
                    deadline = Date.now() + 4000;
                    footerCount = 0;
                    _c.label = 6;
                case 6:
                    if (!(Date.now() < deadline)) return [3 /*break*/, 9];
                    return [4 /*yield*/, th.getMessages()];
                case 7:
                    msgs = _c.sent();
                    footerCount = msgs.filter(function (m) {
                        return m.author.id === ctx.discord.botUserId
                            && m.content.startsWith('*')
                            && m.content.includes('⋅');
                    }).length;
                    if (footerCount >= 2) {
                        return [3 /*break*/, 9];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 8:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 9:
                    _b = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 10:
                    _b.apply(void 0, [_c.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-advanced-tester)\n        TOOL_CALL_FOOTER_MARKER\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 running tool\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    // Only ONE footer at the end — the tool-call step's footer is NOT
                    // emitted mid-turn. The final text follow-up gets the footer.
                    (0, vitest_1.expect)(footerCount).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    (0, vitest_1.test)('multi-step tool chain should only have one footer at the end', function () { return __awaiter(void 0, void 0, void 0, function () {
        var existingThreadIds, _a, thread, th, messages, footerCount, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = Set.bind;
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).getThreads()];
                case 1:
                    existingThreadIds = new (_a.apply(Set, [void 0, (_c.sent()).map(function (thread) {
                            return thread.id;
                        })]))();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'MULTI_TOOL_FOOTER_MARKER',
                        })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 6000,
                            predicate: function (t) {
                                return !existingThreadIds.has(t.id);
                            },
                        })];
                case 3:
                    thread = _c.sent();
                    th = ctx.discord.thread(thread.id);
                    // Wait for the final text response after all 3 tool steps
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'all done, fixed 3 files',
                            timeout: 6000,
                        })
                        // Wait for the footer after the final response
                    ];
                case 4:
                    // Wait for the final text response after all 3 tool steps
                    _c.sent();
                    // Wait for the footer after the final response
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 6000,
                        })
                        // Give any spurious extra footers time to arrive
                    ];
                case 5:
                    // Wait for the footer after the final response
                    _c.sent();
                    // Give any spurious extra footers time to arrive
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 500);
                        })];
                case 6:
                    // Give any spurious extra footers time to arrive
                    _c.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 7:
                    messages = _c.sent();
                    footerCount = messages.filter(function (m) {
                        return m.author.id === ctx.discord.botUserId
                            && m.content.startsWith('*')
                            && m.content.includes('⋅');
                    }).length;
                    _b = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 8:
                    _b.apply(void 0, [_c.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-advanced-tester)\n        MULTI_TOOL_FOOTER_MARKER\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 investigating the issue\n        \u2B25 all done, fixed 3 files\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    // Only ONE footer should appear — after the final text response.
                    // Intermediate tool-call steps should NOT get footers.
                    (0, vitest_1.expect)(footerCount).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
    (0, vitest_1.test)('3 sequential tool-call steps produce exactly 1 footer, not 3', function () { return __awaiter(void 0, void 0, void 0, function () {
        var existingThreadIds, _a, thread, th, messages, footerCount, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = Set.bind;
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).getThreads()];
                case 1:
                    existingThreadIds = new (_a.apply(Set, [void 0, (_c.sent()).map(function (thread) {
                            return thread.id;
                        })]))();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'MULTI_STEP_CHAIN_MARKER',
                        })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 6000,
                            predicate: function (t) {
                                return !existingThreadIds.has(t.id);
                            },
                        })];
                case 3:
                    thread = _c.sent();
                    th = ctx.discord.thread(thread.id);
                    // Wait for the final text after all 3 sequential tool steps
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'chain complete: all 3 steps done',
                            timeout: 10000,
                        })
                        // Wait for footer
                    ];
                case 4:
                    // Wait for the final text after all 3 sequential tool steps
                    _c.sent();
                    // Wait for footer
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 6000,
                        })
                        // Give any spurious extra footers time to arrive
                    ];
                case 5:
                    // Wait for footer
                    _c.sent();
                    // Give any spurious extra footers time to arrive
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 500);
                        })];
                case 6:
                    // Give any spurious extra footers time to arrive
                    _c.sent();
                    return [4 /*yield*/, th.getMessages()];
                case 7:
                    messages = _c.sent();
                    footerCount = messages.filter(function (m) {
                        return m.author.id === ctx.discord.botUserId
                            && m.content.startsWith('*')
                            && m.content.includes('⋅');
                    }).length;
                    _b = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 8:
                    _b.apply(void 0, [_c.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-advanced-tester)\n        MULTI_STEP_CHAIN_MARKER\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 chain step 1: reading config\n        \u2B25 chain step 2: analyzing results\n        \u2B25 chain step 3: applying fix\n        \u2B25 chain complete: all 3 steps done\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    // The critical assertion: only 1 footer at the very end.
                    // With the naive "allow tool-calls as natural completion" fix,
                    // this would be 4 (one per assistant message). We want 1.
                    (0, vitest_1.expect)(footerCount).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
});
