"use strict";
// E2e test for typing indicator lifecycle during interruption flow.
// Split from queue-advanced-typing.e2e.test.ts for parallelization.
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
var TEXT_CHANNEL_ID = '200000000000001008';
var e2eTest = vitest_1.describe;
e2eTest('queue advanced: typing interrupt', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-typing-interrupt-e2e',
        dirName: 'qa-typing-interrupt-e2e',
        username: 'queue-advanced-tester',
    });
    (0, vitest_1.test)('interruption flow emits footer for final assistant reply and then stops typing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, messages, finalUserIndex, finalReplyIndex, finalFooterIndex, _a, timeline, finalPromptPosition, finalReplyPosition, lastFooterPosition, typingDuringFinalRun;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: typing-stop-interrupt-setup',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: typing-stop-interrupt-setup';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: '*project',
                            timeout: 4000,
                        })];
                case 3:
                    _b.sent();
                    th.clearTypingEvents();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'starting sleep 100',
                            afterUserMessageIncludes: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                            timeout: 4000,
                        })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: typing-stop-interrupt-final',
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'ok',
                            afterUserMessageIncludes: 'typing-stop-interrupt-final',
                            timeout: 12000,
                        })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 12000,
                            afterMessageIncludes: 'typing-stop-interrupt-final',
                            afterAuthorId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                        })];
                case 8:
                    messages = _b.sent();
                    finalUserIndex = messages.findIndex(function (message) {
                        return message.author.id === queue_advanced_e2e_setup_js_1.TEST_USER_ID
                            && message.content.includes('typing-stop-interrupt-final');
                    });
                    finalReplyIndex = messages.findIndex(function (message, index) {
                        if (index <= finalUserIndex) {
                            return false;
                        }
                        return message.author.id === ctx.discord.botUserId && message.content.includes('ok');
                    });
                    finalFooterIndex = messages.findIndex(function (message, index) {
                        if (index <= finalReplyIndex) {
                            return false;
                        }
                        return message.author.id === ctx.discord.botUserId
                            && message.content.startsWith('*')
                            && message.content.includes('⋅');
                    });
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 9:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-advanced-tester)\n        Reply with exactly: typing-stop-interrupt-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (queue-advanced-tester)\n        PLUGIN_TIMEOUT_SLEEP_MARKER\n        --- from: assistant (TestBot)\n        \u2B25 starting sleep 100\n        --- from: user (queue-advanced-tester)\n        Reply with exactly: typing-stop-interrupt-final\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    return [4 /*yield*/, th.text({ showTyping: true })];
                case 10:
                    timeline = _b.sent();
                    (0, vitest_1.expect)(finalUserIndex).toBeGreaterThanOrEqual(0);
                    (0, vitest_1.expect)(finalReplyIndex).toBeGreaterThan(finalUserIndex);
                    (0, vitest_1.expect)(finalFooterIndex).toBeGreaterThan(finalReplyIndex);
                    (0, vitest_1.expect)(messages[finalFooterIndex]).toBeDefined();
                    finalPromptPosition = timeline.indexOf('Reply with exactly: typing-stop-interrupt-final');
                    finalReplyPosition = timeline.indexOf('--- from: assistant (TestBot)\n⬥ ok', finalPromptPosition);
                    lastFooterPosition = timeline.lastIndexOf('*project ⋅');
                    (0, vitest_1.expect)(finalPromptPosition).toBeGreaterThanOrEqual(0);
                    (0, vitest_1.expect)(finalReplyPosition).toBeGreaterThan(finalPromptPosition);
                    (0, vitest_1.expect)(lastFooterPosition).toBeGreaterThanOrEqual(0);
                    typingDuringFinalRun = timeline
                        .slice(finalPromptPosition, finalReplyPosition)
                        .match(/\[bot typing\]/g) || [];
                    (0, vitest_1.expect)(typingDuringFinalRun.length).toBeGreaterThanOrEqual(2);
                    (0, vitest_1.expect)(timeline.slice(lastFooterPosition)).not.toContain('[bot typing]');
                    return [2 /*return*/];
            }
        });
    }); }, 12000);
});
