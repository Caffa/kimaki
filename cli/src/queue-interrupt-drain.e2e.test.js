"use strict";
// E2e test for queue + interrupt interaction.
// Validates that a user can queue a command via /queue while a slow session
// is in progress, then send a normal (non-queued) message to interrupt.
//
// Expected behavior:
//   1. Slow session is running
//   2. User queues a message via /queue (enters kimaki local queue)
//   3. User sends a normal message (interrupt)
//   4. Session aborts the slow task, processes the interrupt message immediately
//   5. Interrupt response appears in Discord with a ⬥ ok reply
//   6. When interrupt response completes, the queued message drains and runs
//
// Uses opencode-deterministic-provider (no real LLM calls).
// Poll timeouts: 4s max, 100ms interval. Slow matcher uses 100s delay.
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
var TEXT_CHANNEL_ID = '200000000000001099';
var e2eTest = vitest_1.describe;
e2eTest('queue + interrupt drain ordering', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-interrupt-drain-e2e',
        dirName: 'qa-interrupt-drain-e2e',
        username: 'interrupt-tester',
    });
    (0, vitest_1.test)('queued message via /queue + normal interrupt: interrupt reply should appear, then queue drains', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, queueInteractionId, queueAck, queueStatusMessage, _a, text, lines, interruptUserLine, queueDispatchLine, linesBetween, hasInterruptReply;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // 1. Establish session with a quick first message
                return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: setup-interrupt-drain',
                    })];
                case 1:
                    // 1. Establish session with a quick first message
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: setup-interrupt-drain';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })
                        // Wait for first run to fully complete (footer) so state is clean
                    ];
                case 3:
                    _b.sent();
                    // Wait for first run to fully complete (footer) so state is clean
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })
                        // 2. Start a slow session — PLUGIN_TIMEOUT_SLEEP_MARKER has a 100s delay
                        //    before the finish event, guaranteeing the session stays busy.
                    ];
                case 4:
                    // Wait for first run to fully complete (footer) so state is clean
                    _b.sent();
                    // 2. Start a slow session — PLUGIN_TIMEOUT_SLEEP_MARKER has a 100s delay
                    //    before the finish event, guaranteeing the session stays busy.
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                        })
                        // Wait for the slow matcher to start streaming (text appears before delay)
                    ];
                case 5:
                    // 2. Start a slow session — PLUGIN_TIMEOUT_SLEEP_MARKER has a 100s delay
                    //    before the finish event, guaranteeing the session stays busy.
                    _b.sent();
                    // Wait for the slow matcher to start streaming (text appears before delay)
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'starting sleep',
                            afterUserMessageIncludes: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                            timeout: 4000,
                        })
                        // 3. Queue a message via /queue while the slow session is running
                    ];
                case 6:
                    // Wait for the slow matcher to start streaming (text appears before delay)
                    _b.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID)
                            .runSlashCommand({
                            name: 'queue',
                            options: [{ name: 'message', type: 3, value: 'Reply with exactly: queued-behind-slow' }],
                        })];
                case 7:
                    queueInteractionId = (_b.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: queueInteractionId,
                            timeout: 4000,
                        })];
                case 8:
                    queueAck = _b.sent();
                    if (!queueAck.messageId) {
                        throw new Error('Expected /queue response message id');
                    }
                    return [4 /*yield*/, (0, test_utils_js_1.waitForMessageById)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            messageId: queueAck.messageId,
                            timeout: 4000,
                        })
                        // The /queue message should be queued (session is busy with the 100s task)
                    ];
                case 9:
                    queueStatusMessage = _b.sent();
                    // The /queue message should be queued (session is busy with the 100s task)
                    (0, vitest_1.expect)(queueStatusMessage.content).toContain('Queued message');
                    // 4. Send a normal (non-queued) message — this should interrupt the slow
                    //    session and be processed immediately
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: interrupt-now',
                        })
                        // 5. Wait for the final state: the interrupt message should get its own
                        //    ⬥ ok reply, then the queued message should drain and get processed.
                        //    We wait for the queued message's footer as the final signal.
                    ];
                case 10:
                    // 4. Send a normal (non-queued) message — this should interrupt the slow
                    //    session and be processed immediately
                    _b.sent();
                    // 5. Wait for the final state: the interrupt message should get its own
                    //    ⬥ ok reply, then the queued message should drain and get processed.
                    //    We wait for the queued message's footer as the final signal.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 12000,
                            afterMessageIncludes: 'queued-behind-slow',
                            afterAuthorId: ctx.discord.botUserId,
                        })
                        // 6. Capture the full interaction in an inline snapshot.
                    ];
                case 11:
                    // 5. Wait for the final state: the interrupt message should get its own
                    //    ⬥ ok reply, then the queued message should drain and get processed.
                    //    We wait for the queued message's footer as the final signal.
                    _b.sent();
                    // 6. Capture the full interaction in an inline snapshot.
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 12:
                    // 6. Capture the full interaction in an inline snapshot.
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (interrupt-tester)\n        Reply with exactly: setup-interrupt-drain\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (interrupt-tester)\n        PLUGIN_TIMEOUT_SLEEP_MARKER\n        --- from: assistant (TestBot)\n        \u2B25 starting sleep 100\n        Queued message (position 1)\n        --- from: user (interrupt-tester)\n        Reply with exactly: interrupt-now\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        \u00BB **interrupt-tester:** Reply with exactly: queued-behind-slow\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    return [4 /*yield*/, th.text()];
                case 13:
                    text = _b.sent();
                    lines = text.split('\n');
                    interruptUserLine = lines.findIndex(function (line) {
                        return line.includes('Reply with exactly: interrupt-now');
                    });
                    (0, vitest_1.expect)(interruptUserLine).toBeGreaterThan(-1);
                    queueDispatchLine = lines.findIndex(function (line) {
                        return line.includes('» **interrupt-tester:** Reply with exactly: queued-behind-slow');
                    });
                    (0, vitest_1.expect)(queueDispatchLine).toBeGreaterThan(-1);
                    linesBetween = lines.slice(interruptUserLine + 1, queueDispatchLine);
                    hasInterruptReply = linesBetween.some(function (line) {
                        return line.includes('⬥ ok');
                    });
                    (0, vitest_1.expect)(hasInterruptReply).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
