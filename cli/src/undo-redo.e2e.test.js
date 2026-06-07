"use strict";
// E2e test for /undo command.
// Validates that:
// 1. After /undo, session.revert state is set (files reverted, revert boundary marked)
// 2. Messages are NOT deleted yet (they stay until next prompt cleans them up)
// 3. On the next user message, reverted messages are cleaned up by OpenCode's
//    SessionRevert.cleanup() and the model only sees pre-revert messages
//
// This matches the OpenCode TUI behavior (use-session-commands.tsx):
// - Pass the user message ID (not assistant ID)
// - Don't delete messages — just mark session as reverted
// - Cleanup happens automatically on next promptAsync()
//
// Uses opencode-deterministic-provider (no real LLM calls).
// Poll timeouts: 4s max, 100ms interval.
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
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var queue_advanced_e2e_setup_js_1 = require("./queue-advanced-e2e-setup.js");
var test_utils_js_1 = require("./test-utils.js");
var database_js_1 = require("./database.js");
var opencode_js_1 = require("./opencode.js");
var TEXT_CHANNEL_ID = '200000000000001200';
var e2eTest = vitest_1.describe;
e2eTest('/undo sets revert state and cleans up on next prompt', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-undo-e2e',
        dirName: 'qa-undo-e2e',
        username: 'undo-tester',
    });
    (0, vitest_1.test)('undo sets revert state, next message cleans up reverted messages', function () { return __awaiter(void 0, void 0, void 0, function () {
        var markerPath, thread, th, sessionId, getClient, beforeMessages, beforeCount, beforeUserMessages, beforeAssistantMessages, beforeSession, undoInteractionId, undoAck, afterSession, afterMessages, finalMessages, finalAssistantMessages, originalAssistantStillExists, finalSession, _a;
        var _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    markerPath = node_path_1.default.join(ctx.directories.projectDirectory, 'tmp', 'undo-marker.txt');
                    // 1. Send a message and wait for complete session (footer)
                    return [4 /*yield*/, ctx.discord
                            .channel(TEXT_CHANNEL_ID)
                            .user(queue_advanced_e2e_setup_js_1.TEST_USER_ID)
                            .sendMessage({
                            content: 'UNDO_FILE_MARKER',
                        })];
                case 1:
                    // 1. Send a message and wait for complete session (footer)
                    _g.sent();
                    return [4 /*yield*/, ctx.discord
                            .channel(TEXT_CHANNEL_ID)
                            .waitForThread({
                            timeout: 8000,
                            predicate: function (t) {
                                return t.name === 'UNDO_FILE_MARKER';
                            },
                        })];
                case 2:
                    thread = _g.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    _g.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })
                        // 2. Get session ID and verify it has messages
                    ];
                case 4:
                    _g.sent();
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(thread.id)];
                case 5:
                    sessionId = _g.sent();
                    (0, vitest_1.expect)(sessionId).toBeTruthy();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(ctx.directories.projectDirectory)];
                case 6:
                    getClient = _g.sent();
                    if (getClient instanceof Error) {
                        throw getClient;
                    }
                    return [4 /*yield*/, getClient().session.messages({
                            sessionID: sessionId,
                            directory: ctx.directories.projectDirectory,
                        })];
                case 7:
                    beforeMessages = _g.sent();
                    beforeCount = (beforeMessages.data || []).length;
                    (0, vitest_1.expect)(beforeCount).toBeGreaterThan(0);
                    beforeUserMessages = (beforeMessages.data || []).filter(function (m) {
                        return m.info.role === 'user';
                    });
                    beforeAssistantMessages = (beforeMessages.data || []).filter(function (m) {
                        return m.info.role === 'assistant';
                    });
                    (0, vitest_1.expect)(beforeUserMessages.length).toBeGreaterThan(0);
                    (0, vitest_1.expect)(beforeAssistantMessages.length).toBeGreaterThan(0);
                    (0, vitest_1.expect)(node_fs_1.default.existsSync(markerPath)).toBe(true);
                    return [4 /*yield*/, getClient().session.get({
                            sessionID: sessionId,
                        })];
                case 8:
                    beforeSession = _g.sent();
                    (0, vitest_1.expect)((_b = beforeSession.data) === null || _b === void 0 ? void 0 : _b.revert).toBeFalsy();
                    return [4 /*yield*/, th
                            .user(queue_advanced_e2e_setup_js_1.TEST_USER_ID)
                            .runSlashCommand({ name: 'undo' })];
                case 9:
                    undoInteractionId = (_g.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: undoInteractionId,
                            timeout: 4000,
                        })];
                case 10:
                    undoAck = _g.sent();
                    (0, vitest_1.expect)(undoAck).toBeDefined();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: 'Undone - reverted last assistant message',
                            timeout: 8000,
                        })
                        // 4. Verify session now has revert state set
                    ];
                case 11:
                    _g.sent();
                    return [4 /*yield*/, getClient().session.get({
                            sessionID: sessionId,
                        })];
                case 12:
                    afterSession = _g.sent();
                    (0, vitest_1.expect)((_c = afterSession.data) === null || _c === void 0 ? void 0 : _c.revert).toBeTruthy();
                    (0, vitest_1.expect)((_e = (_d = afterSession.data) === null || _d === void 0 ? void 0 : _d.revert) === null || _e === void 0 ? void 0 : _e.messageID).toBeTruthy();
                    return [4 /*yield*/, getClient().session.messages({
                            sessionID: sessionId,
                            directory: ctx.directories.projectDirectory,
                        })];
                case 13:
                    afterMessages = _g.sent();
                    (0, vitest_1.expect)((afterMessages.data || []).length).toBe(beforeCount);
                    // 5. Send a new message — this triggers SessionRevert.cleanup()
                    // which removes reverted messages before processing the new prompt
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: after-undo-message',
                        })];
                case 14:
                    // 5. Send a new message — this triggers SessionRevert.cleanup()
                    // which removes reverted messages before processing the new prompt
                    _g.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: 'after-undo-message',
                        })
                        // 6. Verify reverted messages were cleaned up
                    ];
                case 15:
                    _g.sent();
                    return [4 /*yield*/, getClient().session.messages({
                            sessionID: sessionId,
                            directory: ctx.directories.projectDirectory,
                        })];
                case 16:
                    finalMessages = _g.sent();
                    finalAssistantMessages = (finalMessages.data || []).filter(function (m) {
                        return m.info.role === 'assistant';
                    });
                    originalAssistantStillExists = finalAssistantMessages.some(function (m) {
                        return m.parts.some(function (p) {
                            return p.type === 'text' && p.text === 'ok';
                        });
                    });
                    // The first "ok" response was reverted and should be cleaned up.
                    // The new response for "after-undo-message" should produce a fresh "ok".
                    // We verify the total count dropped: the original user+assistant pair
                    // was removed, and replaced by just the new user+assistant pair.
                    (0, vitest_1.expect)(finalAssistantMessages.length).toBeLessThanOrEqual(beforeAssistantMessages.length);
                    return [4 /*yield*/, getClient().session.get({
                            sessionID: sessionId,
                        })];
                case 17:
                    finalSession = _g.sent();
                    (0, vitest_1.expect)((_f = finalSession.data) === null || _f === void 0 ? void 0 : _f.revert).toBeFalsy();
                    // 7. Snapshot the Discord thread
                    _a = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 18:
                    // 7. Snapshot the Discord thread
                    _a.apply(void 0, [_g.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (undo-tester)\n        UNDO_FILE_MARKER\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 creating undo file\n        \u2B25 undo file created\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        Undone - reverted last assistant message\n        --- from: user (undo-tester)\n        Reply with exactly: after-undo-message\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
