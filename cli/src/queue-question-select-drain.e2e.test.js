"use strict";
// E2e test: queued message must drain after the user answers a pending question
// via the Discord dropdown select menu. Reproduces a bug where answering via
// select (not text) leaves queued messages stuck because the session continues
// processing after the answer and may enter another blocking state.
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
var vitest_1 = require("vitest");
var queue_advanced_e2e_setup_js_1 = require("./queue-advanced-e2e-setup.js");
var test_utils_js_1 = require("./test-utils.js");
var ask_question_js_1 = require("./commands/ask-question.js");
var TEXT_CHANNEL_ID = '200000000000001030';
function waitForPendingQuestion(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, entry;
        var threadId = _b.threadId, timeoutMs = _b.timeoutMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < timeoutMs)) return [3 /*break*/, 3];
                    entry = __spreadArray([], ask_question_js_1.pendingQuestionContexts.entries(), true).find(function (_a) {
                        var context = _a[1];
                        return context.thread.id === threadId;
                    });
                    if (entry) {
                        return [2 /*return*/, { contextHash: entry[0] }];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 3: throw new Error('Timed out waiting for pending question context');
            }
        });
    });
}
function expectNoBotMessageContaining(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, messages, match;
        var discord = _b.discord, threadId = _b.threadId, text = _b.text, timeout = _b.timeout;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < timeout)) return [3 /*break*/, 4];
                    return [4 /*yield*/, discord.thread(threadId).getMessages()];
                case 2:
                    messages = _c.sent();
                    match = messages.find(function (message) {
                        return (message.author.id === discord.botUserId
                            && message.content.includes(text));
                    });
                    if (match) {
                        throw new Error("Unexpected bot message containing ".concat(JSON.stringify(text), " while it should still be queued"));
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 20);
                        })];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
(0, vitest_1.describe)('queue drain after question select answer', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-question-select-drain',
        dirName: 'qa-question-select-drain',
        username: 'question-select-tester',
    });
    (0, vitest_1.test)('queued message drains after answering question via dropdown select', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, questionMessages, pending, questionMsg, queueInteractionId, queueAck, interaction, timeline;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // 1. Send a message that triggers the question tool
                return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'QUESTION_SELECT_QUEUE_MARKER',
                    })];
                case 1:
                    // 1. Send a message that triggers the question tool
                    _a.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 8000,
                            predicate: function (t) {
                                return t.name === 'QUESTION_SELECT_QUEUE_MARKER';
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: 'How to proceed?',
                            timeout: 12000,
                        })
                        // Get the pending question context hash from the internal map.
                        // By this point the question message is visible so the context must exist.
                    ];
                case 3:
                    questionMessages = _a.sent();
                    return [4 /*yield*/, waitForPendingQuestion({
                            threadId: thread.id,
                            timeoutMs: 8000,
                        })];
                case 4:
                    pending = _a.sent();
                    questionMsg = questionMessages.find(function (m) {
                        return m.content.includes('How to proceed?');
                    });
                    (0, vitest_1.expect)(questionMsg).toBeTruthy();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID)
                            .runSlashCommand({
                            name: 'queue',
                            options: [{ name: 'message', type: 3, value: 'Reply with exactly: post-question-drain' }],
                        })];
                case 5:
                    queueInteractionId = (_a.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: queueInteractionId,
                            timeout: 8000,
                        })];
                case 6:
                    queueAck = _a.sent();
                    if (!queueAck.messageId) {
                        throw new Error('Expected /queue response message id');
                    }
                    // 4. The first queued item should be handed off immediately even while
                    //    the question is still pending, so the visible dispatch indicator
                    //    appears before the user answers the dropdown.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: '» **question-select-tester:** Reply with exactly: post-question-drain',
                            timeout: 8000,
                        })
                        // 5. Answer the question via dropdown select (pick first option "Alpha")
                    ];
                case 7:
                    // 4. The first queued item should be handed off immediately even while
                    //    the question is still pending, so the visible dispatch indicator
                    //    appears before the user answers the dropdown.
                    _a.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).selectMenu({
                            messageId: questionMsg.id,
                            customId: "ask_question:".concat(pending.contextHash, ":0"),
                            values: ['0'],
                        })];
                case 8:
                    interaction = _a.sent();
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: interaction.id,
                            timeout: 8000,
                        })
                        // 6. Wait for footer from the drained queued message
                    ];
                case 9:
                    _a.sent();
                    // 6. Wait for footer from the drained queued message
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: '» **question-select-tester:**',
                            afterAuthorId: ctx.discord.botUserId,
                        })];
                case 10:
                    // 6. Wait for footer from the drained queued message
                    _a.sent();
                    return [4 /*yield*/, th.text({ showInteractions: true })];
                case 11:
                    timeline = _a.sent();
                    (0, vitest_1.expect)(timeline).toMatchInlineSnapshot("\n        \"--- from: user (question-select-tester)\n        QUESTION_SELECT_QUEUE_MARKER\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        **Select action**\n        How to proceed?\n        \u2713 _Alpha_\n        [user interaction]\n        \u00BB **question-select-tester:** Reply with exactly: post-question-drain\n        Queued message (position 1)\n        [user selects dropdown: 0]\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(timeline).toContain('QUESTION_SELECT_QUEUE_MARKER');
                    (0, vitest_1.expect)(timeline).toContain('How to proceed?');
                    (0, vitest_1.expect)(timeline).toContain('[user selects dropdown: 0]');
                    (0, vitest_1.expect)(timeline).toContain('» **question-select-tester:** Reply with exactly: post-question-drain');
                    (0, vitest_1.expect)(timeline).toContain('⬥ ok');
                    (0, vitest_1.expect)(timeline).toContain('*project ⋅ main ⋅');
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    (0, vitest_1.test)('only the first queued message is handed off after dropdown answer', function () { return __awaiter(void 0, void 0, void 0, function () {
        var marker, thread, th, questionMessages, pending, questionMsg, firstQueuedPrompt, secondQueuedPrompt, firstQueueInteractionId, secondQueueInteractionId, interaction, timeline;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    marker = 'QUESTION_SELECT_QUEUE_MARKER second-test';
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: marker,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 8000,
                            predicate: function (t) {
                                return t.name === marker;
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: 'How to proceed?',
                            timeout: 12000,
                        })];
                case 3:
                    questionMessages = _a.sent();
                    return [4 /*yield*/, waitForPendingQuestion({
                            threadId: thread.id,
                            timeoutMs: 8000,
                        })];
                case 4:
                    pending = _a.sent();
                    questionMsg = questionMessages.find(function (message) {
                        return message.content.includes('How to proceed?');
                    });
                    (0, vitest_1.expect)(questionMsg).toBeTruthy();
                    if (!questionMsg) {
                        throw new Error('Expected question message');
                    }
                    firstQueuedPrompt = 'SLOW_ABORT_MARKER run long response';
                    secondQueuedPrompt = 'Reply with exactly: post-question-second';
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID)
                            .runSlashCommand({
                            name: 'queue',
                            options: [{ name: 'message', type: 3, value: firstQueuedPrompt }],
                        })];
                case 5:
                    firstQueueInteractionId = (_a.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: firstQueueInteractionId,
                            timeout: 8000,
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID)
                            .runSlashCommand({
                            name: 'queue',
                            options: [{ name: 'message', type: 3, value: secondQueuedPrompt }],
                        })];
                case 7:
                    secondQueueInteractionId = (_a.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: secondQueueInteractionId,
                            timeout: 8000,
                        })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).selectMenu({
                            messageId: questionMsg.id,
                            customId: "ask_question:".concat(pending.contextHash, ":0"),
                            values: ['0'],
                        })];
                case 9:
                    interaction = _a.sent();
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: interaction.id,
                            timeout: 8000,
                        })];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: "\u00BB **question-select-tester:** ".concat(firstQueuedPrompt),
                            timeout: 8000,
                        })];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, expectNoBotMessageContaining({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: "\u00BB **question-select-tester:** ".concat(secondQueuedPrompt),
                            timeout: 200,
                        })];
                case 12:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: "\u00BB **question-select-tester:** ".concat(firstQueuedPrompt),
                            afterAuthorId: ctx.discord.botUserId,
                        })];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: "\u00BB **question-select-tester:** ".concat(secondQueuedPrompt),
                            timeout: 8000,
                        })];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: "\u00BB **question-select-tester:** ".concat(secondQueuedPrompt),
                            afterAuthorId: ctx.discord.botUserId,
                        })];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, th.text({ showInteractions: true })];
                case 16:
                    timeline = _a.sent();
                    (0, vitest_1.expect)(timeline).toMatchInlineSnapshot("\n        \"--- from: user (question-select-tester)\n        QUESTION_SELECT_QUEUE_MARKER second-test\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        **Select action**\n        How to proceed?\n        \u2713 _Alpha_\n        [user interaction]\n        \u00BB **question-select-tester:** SLOW_ABORT_MARKER run long response\n        Queued message (position 1)\n        [user interaction]\n        Queued message (position 1)\n        [user selects dropdown: 0]\n        \u2B25 slow-response-started\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        \u00BB **question-select-tester:** Reply with exactly: post-question-second\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    (0, vitest_1.expect)(timeline).toContain("\u00BB **question-select-tester:** ".concat(firstQueuedPrompt));
                    (0, vitest_1.expect)(timeline).toContain('⬥ slow-response-started');
                    (0, vitest_1.expect)(timeline).toContain("\u00BB **question-select-tester:** ".concat(secondQueuedPrompt));
                    (0, vitest_1.expect)(timeline).toContain('⬥ ok');
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
