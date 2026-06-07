"use strict";
// E2e tests for typing indicator lifecycle in advanced queue scenarios.
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
var TEXT_CHANNEL_ID = '200000000000001002';
var e2eTest = vitest_1.describe;
e2eTest('queue advanced: typing lifecycle', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-typing-e2e',
        dirName: 'qa-typing-e2e',
        username: 'queue-advanced-tester',
    });
    (0, vitest_1.test)('normal reply stops typing after footer', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, messages, replyIndex, footerIndex, timeline, typingCount, lastFooterPosition;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: typing-stop-normal',
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: typing-stop-normal';
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForTypingEvent({ timeout: 1000 }).catch(function () {
                            return undefined;
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'ok',
                            timeout: 4000,
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'ok',
                            afterAuthorId: ctx.discord.botUserId,
                        })];
                case 5:
                    messages = _a.sent();
                    replyIndex = messages.findIndex(function (message) {
                        return message.author.id === ctx.discord.botUserId && message.content.includes('ok');
                    });
                    footerIndex = messages.findIndex(function (message, index) {
                        if (index <= replyIndex) {
                            return false;
                        }
                        return message.author.id === ctx.discord.botUserId
                            && message.content.startsWith('*')
                            && message.content.includes('⋅');
                    });
                    return [4 /*yield*/, th.text({ showTyping: true })];
                case 6:
                    timeline = _a.sent();
                    (0, vitest_1.expect)(timeline).toContain('Reply with exactly: typing-stop-normal');
                    (0, vitest_1.expect)(timeline).toContain('⬥ ok');
                    (0, vitest_1.expect)(timeline).toContain('*project ⋅ main ⋅');
                    typingCount = (timeline.match(/\[bot typing\]/g) || []).length;
                    (0, vitest_1.expect)(typingCount).toBeGreaterThanOrEqual(1);
                    (0, vitest_1.expect)(replyIndex).toBeGreaterThanOrEqual(0);
                    (0, vitest_1.expect)(footerIndex).toBeGreaterThan(replyIndex);
                    (0, vitest_1.expect)(messages[footerIndex]).toBeDefined();
                    lastFooterPosition = timeline.lastIndexOf('*project ⋅');
                    (0, vitest_1.expect)(lastFooterPosition).toBeGreaterThanOrEqual(0);
                    (0, vitest_1.expect)(timeline.slice(lastFooterPosition)).not.toContain('[bot typing]');
                    return [2 /*return*/];
            }
        });
    }); }, 8000);
    (0, vitest_1.test)('thread follow-up reply re-pulses typing after a visible assistant message while session stays busy', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, messagesAfterFirstReply, markerUserIndex, firstReply, typingAfterVisibleReply, messages, timeline, typingCount, followupUserIndex, followupReplyIndex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: typing-thread-reply-setup',
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: typing-thread-reply-setup';
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'ok',
                            timeout: 4000,
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'ok',
                            afterAuthorId: ctx.discord.botUserId,
                        })];
                case 4:
                    _a.sent();
                    th.clearTypingEvents();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'TYPING_REPULSE_MARKER',
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'repulse-first',
                            afterUserMessageIncludes: 'TYPING_REPULSE_MARKER',
                            timeout: 4000,
                        })];
                case 6:
                    messagesAfterFirstReply = _a.sent();
                    markerUserIndex = messagesAfterFirstReply.findIndex(function (message) {
                        return message.author.id === queue_advanced_e2e_setup_js_1.TEST_USER_ID
                            && message.content.includes('TYPING_REPULSE_MARKER');
                    });
                    firstReply = messagesAfterFirstReply.find(function (message, index) {
                        if (index <= markerUserIndex) {
                            return false;
                        }
                        return message.author.id === ctx.discord.botUserId
                            && message.content.includes('repulse-first');
                    });
                    if (!firstReply) {
                        throw new Error('Expected first bot reply after TYPING_REPULSE_MARKER');
                    }
                    return [4 /*yield*/, th.waitForTypingEvent({
                            timeout: 700,
                            afterTimestamp: new Date(firstReply.timestamp).getTime(),
                        }).then(function () {
                            return true;
                        }, function () {
                            return false;
                        })];
                case 7:
                    typingAfterVisibleReply = _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 6000,
                            afterMessageIncludes: 'TYPING_REPULSE_MARKER',
                            afterAuthorId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                        })];
                case 8:
                    messages = _a.sent();
                    return [4 /*yield*/, th.text({ showTyping: true })];
                case 9:
                    timeline = _a.sent();
                    (0, vitest_1.expect)(timeline).toContain('TYPING_REPULSE_MARKER');
                    (0, vitest_1.expect)(timeline).toContain('⬥ repulse-first');
                    typingCount = (timeline.match(/\[bot typing\]/g) || []).length;
                    (0, vitest_1.expect)(typingCount).toBeGreaterThanOrEqual(2);
                    followupUserIndex = messages.findIndex(function (message) {
                        return message.author.id === queue_advanced_e2e_setup_js_1.TEST_USER_ID
                            && message.content.includes('TYPING_REPULSE_MARKER');
                    });
                    followupReplyIndex = messages.findIndex(function (message, index) {
                        if (index <= followupUserIndex) {
                            return false;
                        }
                        return message.author.id === ctx.discord.botUserId
                            && message.content.includes('repulse-first');
                    });
                    (0, vitest_1.expect)(followupUserIndex).toBeGreaterThanOrEqual(0);
                    (0, vitest_1.expect)(followupReplyIndex).toBeGreaterThan(followupUserIndex);
                    (0, vitest_1.expect)(typingAfterVisibleReply).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); }, 10000);
});
