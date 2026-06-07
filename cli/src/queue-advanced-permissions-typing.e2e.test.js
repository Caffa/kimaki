"use strict";
// E2e tests for typing indicator behavior around permission prompts.
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
var thread_session_runtime_js_1 = require("./session-handler/thread-session-runtime.js");
var TEXT_CHANNEL_ID = '200000000000001005';
function waitForPendingPermission(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, threadPermissions, firstPermission;
        var threadId = _b.threadId, timeoutMs = _b.timeoutMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < timeoutMs)) return [3 /*break*/, 3];
                    threadPermissions = thread_session_runtime_js_1.pendingPermissions.get(threadId);
                    firstPermission = threadPermissions ? __spreadArray([], threadPermissions.values(), true)[0] : undefined;
                    if ((firstPermission === null || firstPermission === void 0 ? void 0 : firstPermission.contextHash) && firstPermission.messageId) {
                        return [2 /*return*/, {
                                contextHash: firstPermission.contextHash,
                                messageId: firstPermission.messageId,
                            }];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 3: throw new Error('Timed out waiting for pending permission context');
            }
        });
    });
}
(0, vitest_1.describe)('queue advanced: typing around permissions', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-permission-typing-e2e',
        dirName: 'qa-permission-typing-e2e',
        username: 'queue-permission-tester',
    });
    (0, vitest_1.test)('permission prompt pauses typing until user click, then typing resumes for long follow-up step', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, pending, interaction, resumedTyping, _a, timeline, clickPosition, donePosition, footerPosition, afterClick, afterDone;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'PERMISSION_TYPING_MARKER',
                    })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'PERMISSION_TYPING_MARKER';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForTypingEvent({ timeout: 4000 })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, waitForPendingPermission({
                            threadId: thread.id,
                            timeoutMs: 4000,
                        })];
                case 4:
                    pending = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'Permission Required',
                            timeout: 4000,
                        })];
                case 5:
                    _b.sent();
                    th.clearTypingEvents();
                    return [4 /*yield*/, th.waitForTypingEvent({ timeout: 2000 }).then(function () {
                            throw new Error('Typing should stay paused while permission UI is pending');
                        }, function () {
                            return undefined;
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).clickButton({
                            messageId: pending.messageId,
                            customId: "permission_once:".concat(pending.contextHash),
                        })];
                case 7:
                    interaction = _b.sent();
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: interaction.id,
                            timeout: 4000,
                        })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, th.waitForTypingEvent({ timeout: 9000 })];
                case 9:
                    resumedTyping = _b.sent();
                    (0, vitest_1.expect)(resumedTyping).toBeDefined();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'permission-flow-done',
                            timeout: 12000,
                        })];
                case 10:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 12000,
                            afterMessageIncludes: 'permission-flow-done',
                            afterAuthorId: ctx.discord.botUserId,
                        })];
                case 11:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text({ showInteractions: true })];
                case 12:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-permission-tester)\n        PERMISSION_TYPING_MARKER\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 requesting external read permission\n        \u26A0\uFE0F **Permission Required**\n        **Type:** `external_directory`\n        Agent is accessing files outside the project. [Learn more](https://opencode.ai/docs/permissions/#external-directories)\n        **Pattern:** `/Users/morse/*`\n        \u2705 Permission **accepted**\n        [user clicks button]\n        \u2B25 permission-flow-done\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    return [4 /*yield*/, th.text({
                            showTyping: true,
                            showInteractions: true,
                        })];
                case 13:
                    timeline = _b.sent();
                    clickPosition = timeline.indexOf('[user clicks button]');
                    donePosition = timeline.indexOf('⬥ permission-flow-done');
                    footerPosition = timeline.lastIndexOf('*project ⋅');
                    (0, vitest_1.expect)(clickPosition).toBeGreaterThanOrEqual(0);
                    (0, vitest_1.expect)(donePosition).toBeGreaterThan(clickPosition);
                    (0, vitest_1.expect)(footerPosition).toBeGreaterThan(donePosition);
                    afterClick = timeline.slice(clickPosition, donePosition);
                    afterDone = timeline.slice(donePosition, footerPosition);
                    (0, vitest_1.expect)(afterClick).toContain('[bot typing]');
                    (0, vitest_1.expect)(afterDone).toContain('[bot typing]');
                    (0, vitest_1.expect)(timeline.slice(footerPosition)).not.toContain('[bot typing]');
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    (0, vitest_1.test)('manual thread message dismisses pending permission and sends the new prompt', function () { return __awaiter(void 0, void 0, void 0, function () {
        var initialPrompt, existingThreadIds, _a, thread, th, timeline, normalizedTimeline, followupUserPosition, followupReplyPosition, followupFooterPosition;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    initialPrompt = 'PERMISSION_TYPING_MARKER dismiss-flow';
                    _a = Set.bind;
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).getThreads()];
                case 1:
                    existingThreadIds = new (_a.apply(Set, [void 0, (_b.sent()).map(function (thread) {
                            return thread.id;
                        })]))();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: initialPrompt,
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 6000,
                            predicate: function (t) {
                                return !existingThreadIds.has(t.id);
                            },
                        })];
                case 3:
                    thread = _b.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, waitForPendingPermission({
                            threadId: thread.id,
                            timeoutMs: 4000,
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'Permission Required',
                            timeout: 4000,
                        })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: post-permission-user-message',
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: 'Permission dismissed - user sent a new message.',
                            timeout: 8000,
                        })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            userMessageIncludes: 'post-permission-user-message',
                            timeout: 8000,
                        })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'ok',
                            afterUserMessageIncludes: 'post-permission-user-message',
                            timeout: 8000,
                        })];
                case 9:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: 'ok',
                            afterAuthorId: ctx.discord.botUserId,
                        })];
                case 10:
                    _b.sent();
                    return [4 /*yield*/, th.text({ showInteractions: true })];
                case 11:
                    timeline = _b.sent();
                    normalizedTimeline = timeline.replace('⬥ requesting external read permission\n', '');
                    (0, vitest_1.expect)(normalizedTimeline).toContain('PERMISSION_TYPING_MARKER dismiss-flow');
                    (0, vitest_1.expect)(normalizedTimeline).toContain('Permission dismissed - user sent a new message.');
                    (0, vitest_1.expect)(normalizedTimeline).toContain('Reply with exactly: post-permission-user-message');
                    followupUserPosition = normalizedTimeline.indexOf('Reply with exactly: post-permission-user-message');
                    followupReplyPosition = normalizedTimeline.indexOf('⬥ ok', followupUserPosition);
                    followupFooterPosition = normalizedTimeline.indexOf('*project ⋅', followupReplyPosition);
                    (0, vitest_1.expect)(followupUserPosition).toBeGreaterThanOrEqual(0);
                    (0, vitest_1.expect)(followupReplyPosition).toBeGreaterThan(followupUserPosition);
                    (0, vitest_1.expect)(followupFooterPosition).toBeGreaterThan(followupReplyPosition);
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
