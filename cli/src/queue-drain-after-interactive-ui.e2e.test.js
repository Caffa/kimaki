"use strict";
// E2e test: queued messages must drain immediately when the session is idle,
// even if action buttons are still pending. The isSessionBusy check is
// sufficient — hasPendingInteractiveUi() should NOT block queue drain.
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
var database_js_1 = require("./database.js");
var action_buttons_js_1 = require("./commands/action-buttons.js");
var TEXT_CHANNEL_ID = '200000000000001020';
(0, vitest_1.describe)('queue drain with pending interactive UI', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-drain-interactive-ui',
        dirName: 'qa-drain-interactive-ui',
        username: 'drain-ui-tester',
    });
    (0, vitest_1.test)('queued message drains immediately while action buttons are still pending', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, currentSessionId, channel, start, entry, queueInteractionId, queueAck, timeline;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // 1. Create a thread with a first completed reply
                return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: drain-button-setup',
                    })];
                case 1:
                    // 1. Create a thread with a first completed reply
                    _a.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: drain-button-setup';
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
                        })
                        // 2. Show action buttons (session is idle, buttons are pending)
                    ];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(thread.id)];
                case 5:
                    currentSessionId = _a.sent();
                    if (!currentSessionId) {
                        throw new Error('Expected thread session id');
                    }
                    return [4 /*yield*/, ctx.botClient.channels.fetch(thread.id)];
                case 6:
                    channel = _a.sent();
                    if (!channel || !channel.isThread()) {
                        throw new Error('Expected Discord thread channel');
                    }
                    return [4 /*yield*/, (0, action_buttons_js_1.showActionButtons)({
                            thread: channel,
                            sessionId: currentSessionId,
                            directory: ctx.directories.projectDirectory,
                            buttons: [{ label: 'Pending button', color: 'white' }],
                        })
                        // Verify buttons are pending
                    ];
                case 7:
                    _a.sent();
                    start = Date.now();
                    _a.label = 8;
                case 8:
                    if (!(Date.now() - start < 4000)) return [3 /*break*/, 10];
                    entry = __spreadArray([], action_buttons_js_1.pendingActionButtonContexts.entries(), true).find(function (_a) {
                        var context = _a[1];
                        return context.thread.id === thread.id && Boolean(context.messageId);
                    });
                    if (entry) {
                        return [3 /*break*/, 10];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 10:
                    (0, vitest_1.expect)(__spreadArray([], action_buttons_js_1.pendingActionButtonContexts.values(), true).some(function (c) {
                        return c.thread.id === thread.id;
                    })).toBe(true);
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID)
                            .runSlashCommand({
                            name: 'queue',
                            options: [{ name: 'message', type: 3, value: 'Reply with exactly: post-button-drain' }],
                        })];
                case 11:
                    queueInteractionId = (_a.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: queueInteractionId,
                            timeout: 4000,
                        })];
                case 12:
                    queueAck = _a.sent();
                    if (!queueAck.messageId) {
                        throw new Error('Expected /queue response message id');
                    }
                    // 4. Queued message should dispatch immediately (not stay "Queued").
                    //    The dispatch indicator should appear quickly.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: '» **drain-ui-tester:** Reply with exactly: post-button-drain',
                            timeout: 4000,
                        })
                        // 5. Wait for the footer after the drained message completes
                    ];
                case 13:
                    // 4. Queued message should dispatch immediately (not stay "Queued").
                    //    The dispatch indicator should appear quickly.
                    _a.sent();
                    // 5. Wait for the footer after the drained message completes
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: '» **drain-ui-tester:**',
                            afterAuthorId: ctx.discord.botUserId,
                        })];
                case 14:
                    // 5. Wait for the footer after the drained message completes
                    _a.sent();
                    return [4 /*yield*/, th.text({ showInteractions: true })];
                case 15:
                    timeline = _a.sent();
                    (0, vitest_1.expect)(timeline).toMatchInlineSnapshot("\n        \"--- from: user (drain-ui-tester)\n        Reply with exactly: drain-button-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        **Action Required**\n        [user interaction]\n        \u00BB **drain-ui-tester:** Reply with exactly: post-button-drain\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
