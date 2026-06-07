"use strict";
// Tests for the Slack digital twin server using the official @slack/web-api SDK.
// This validates that our mock server is compliant with what WebClient expects.
// Each test creates a fresh SlackDigitalTwin, starts it, uses the real WebClient
// to call API methods, and asserts the responses match Slack's expected shapes.
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
var web_api_1 = require("@slack/web-api");
var index_ts_1 = require("./index.ts");
(0, vitest_1.describe)('slack digital twin with @slack/web-api', function () {
    var twin;
    var client;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    twin = new index_ts_1.SlackDigitalTwin({
                        workspaceName: 'test-workspace',
                        channels: [
                            { name: 'general' },
                            { name: 'random' },
                            { name: 'private-chan', isPrivate: true },
                        ],
                        users: [
                            { name: 'alice', realName: 'Alice Smith' },
                            { name: 'bob', realName: 'Bob Jones' },
                        ],
                    });
                    return [4 /*yield*/, twin.start()];
                case 1:
                    _a.sent();
                    client = new web_api_1.WebClient(twin.botToken, {
                        slackApiUrl: twin.apiUrl,
                        // Disable retries for tests
                        retryConfig: { retries: 0 },
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, twin.stop()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    // --- auth.test ---
    (0, vitest_1.test)('auth.test returns bot identity', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.auth.test()];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    (0, vitest_1.expect)(result.user_id).toBe(twin.botUserId);
                    (0, vitest_1.expect)(result.team_id).toBe(twin.workspaceId);
                    return [2 /*return*/];
            }
        });
    }); });
    // --- conversations.list ---
    (0, vitest_1.test)('conversations.list returns seeded channels', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, names;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, client.conversations.list()];
                case 1:
                    result = _c.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    names = (_b = (_a = result.channels) === null || _a === void 0 ? void 0 : _a.map(function (c) { return c.name; })) !== null && _b !== void 0 ? _b : [];
                    (0, vitest_1.expect)(names).toContain('general');
                    (0, vitest_1.expect)(names).toContain('random');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('conversations.list excludes private channels by default', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, names;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, client.conversations.list({ types: 'public_channel' })];
                case 1:
                    result = _c.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    names = (_b = (_a = result.channels) === null || _a === void 0 ? void 0 : _a.map(function (c) { return c.name; })) !== null && _b !== void 0 ? _b : [];
                    (0, vitest_1.expect)(names).not.toContain('private-chan');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('conversations.list includes private channels when requested', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, names;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, client.conversations.list({
                        types: 'public_channel,private_channel',
                    })];
                case 1:
                    result = _c.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    names = (_b = (_a = result.channels) === null || _a === void 0 ? void 0 : _a.map(function (c) { return c.name; })) !== null && _b !== void 0 ? _b : [];
                    (0, vitest_1.expect)(names).toContain('private-chan');
                    return [2 /*return*/];
            }
        });
    }); });
    // --- conversations.info ---
    (0, vitest_1.test)('conversations.info returns channel details', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, result;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.conversations.info({ channel: channelId })];
                case 1:
                    result = _c.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    (0, vitest_1.expect)((_a = result.channel) === null || _a === void 0 ? void 0 : _a.name).toBe('general');
                    (0, vitest_1.expect)((_b = result.channel) === null || _b === void 0 ? void 0 : _b.is_archived).toBe(false);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('conversations.info returns error for unknown channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, client.conversations.info({ channel: 'C_NONEXISTENT' })];
                case 1:
                    _a.sent();
                    vitest_1.expect.unreachable('should have thrown');
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    (0, vitest_1.expect)(err_1.message).toContain('channel_not_found');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // --- chat.postMessage ---
    (0, vitest_1.test)('chat.postMessage sends a message and returns ts', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Hello from bot!',
                        })];
                case 1:
                    result = _b.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    (0, vitest_1.expect)(result.ts).toBeTruthy();
                    (0, vitest_1.expect)(result.channel).toBe(channelId);
                    (0, vitest_1.expect)((_a = result.message) === null || _a === void 0 ? void 0 : _a.text).toBe('Hello from bot!');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('chat.postMessage to thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, parent, reply;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Parent message',
                        })
                        // Post reply in thread
                    ];
                case 1:
                    parent = _b.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Thread reply',
                            thread_ts: parent.ts,
                        })];
                case 2:
                    reply = _b.sent();
                    (0, vitest_1.expect)(reply.ok).toBe(true);
                    (0, vitest_1.expect)((_a = reply.message) === null || _a === void 0 ? void 0 : _a.thread_ts).toBe(parent.ts);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('views.open stores opened modal payload for assertions', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, openedView;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    twin.clearOpenedViews();
                    return [4 /*yield*/, client.views.open({
                            trigger_id: 'trigger-views-open-1',
                            view: {
                                type: 'modal',
                                callback_id: 'session-modal',
                                title: { type: 'plain_text', text: 'New session' },
                                submit: { type: 'plain_text', text: 'Run' },
                                close: { type: 'plain_text', text: 'Cancel' },
                                blocks: [
                                    {
                                        type: 'input',
                                        block_id: 'prompt',
                                        label: { type: 'plain_text', text: 'Prompt' },
                                        element: {
                                            type: 'plain_text_input',
                                            action_id: 'prompt',
                                        },
                                    },
                                ],
                            },
                        })];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    return [4 /*yield*/, twin.waitForOpenedView({
                            predicate: function (view) {
                                return view.trigger_id === 'trigger-views-open-1';
                            },
                        })];
                case 2:
                    openedView = _a.sent();
                    (0, vitest_1.expect)(openedView).toMatchInlineSnapshot("\n      {\n        \"trigger_id\": \"trigger-views-open-1\",\n        \"view\": {\n          \"blocks\": [\n            {\n              \"block_id\": \"prompt\",\n              \"element\": {\n                \"action_id\": \"prompt\",\n                \"type\": \"plain_text_input\",\n              },\n              \"label\": {\n                \"text\": \"Prompt\",\n                \"type\": \"plain_text\",\n              },\n              \"type\": \"input\",\n            },\n          ],\n          \"callback_id\": \"session-modal\",\n          \"close\": {\n            \"text\": \"Cancel\",\n            \"type\": \"plain_text\",\n          },\n          \"submit\": {\n            \"text\": \"Run\",\n            \"type\": \"plain_text\",\n          },\n          \"title\": {\n            \"text\": \"New session\",\n            \"type\": \"plain_text\",\n          },\n          \"type\": \"modal\",\n        },\n      }\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('chat.postMessage returns error for unknown channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: 'C_NONEXISTENT',
                            text: 'Should fail',
                        })];
                case 1:
                    _a.sent();
                    vitest_1.expect.unreachable('should have thrown');
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    (0, vitest_1.expect)(err_2.message).toContain('channel_not_found');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // --- chat.update ---
    (0, vitest_1.test)('chat.update edits a message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, posted, updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Original text',
                        })];
                case 1:
                    posted = _a.sent();
                    return [4 /*yield*/, client.chat.update({
                            channel: channelId,
                            ts: posted.ts,
                            text: 'Updated text',
                        })];
                case 2:
                    updated = _a.sent();
                    (0, vitest_1.expect)(updated.ok).toBe(true);
                    (0, vitest_1.expect)(updated.text).toBe('Updated text');
                    return [2 /*return*/];
            }
        });
    }); });
    // --- chat.delete ---
    (0, vitest_1.test)('chat.delete soft-deletes a message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, posted, deleted, history, found;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    channelId = twin.resolveChannelId('random');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Will be deleted',
                        })];
                case 1:
                    posted = _b.sent();
                    return [4 /*yield*/, client.chat.delete({
                            channel: channelId,
                            ts: posted.ts,
                        })];
                case 2:
                    deleted = _b.sent();
                    (0, vitest_1.expect)(deleted.ok).toBe(true);
                    return [4 /*yield*/, client.conversations.history({ channel: channelId })];
                case 3:
                    history = _b.sent();
                    found = (_a = history.messages) === null || _a === void 0 ? void 0 : _a.find(function (m) { return m.ts === posted.ts; });
                    (0, vitest_1.expect)(found).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
    // --- conversations.history ---
    (0, vitest_1.test)('conversations.history returns messages in desc order', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, history, texts, idx1, idx3;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    channelId = twin.resolveChannelId('random');
                    return [4 /*yield*/, client.chat.postMessage({ channel: channelId, text: 'msg 1' })];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, client.chat.postMessage({ channel: channelId, text: 'msg 2' })];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, client.chat.postMessage({ channel: channelId, text: 'msg 3' })];
                case 3:
                    _d.sent();
                    return [4 /*yield*/, client.conversations.history({ channel: channelId })];
                case 4:
                    history = _d.sent();
                    (0, vitest_1.expect)(history.ok).toBe(true);
                    (0, vitest_1.expect)((_a = history.messages) === null || _a === void 0 ? void 0 : _a.length).toBeGreaterThanOrEqual(3);
                    texts = (_c = (_b = history.messages) === null || _b === void 0 ? void 0 : _b.map(function (m) { return m.text; })) !== null && _c !== void 0 ? _c : [];
                    idx1 = texts.indexOf('msg 1');
                    idx3 = texts.indexOf('msg 3');
                    (0, vitest_1.expect)(idx3).toBeLessThan(idx1);
                    return [2 /*return*/];
            }
        });
    }); });
    // --- conversations.replies ---
    (0, vitest_1.test)('conversations.replies returns thread messages', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, parent, replies;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Thread parent',
                        })];
                case 1:
                    parent = _h.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Reply 1',
                            thread_ts: parent.ts,
                        })];
                case 2:
                    _h.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Reply 2',
                            thread_ts: parent.ts,
                        })];
                case 3:
                    _h.sent();
                    return [4 /*yield*/, client.conversations.replies({
                            channel: channelId,
                            ts: parent.ts,
                        })];
                case 4:
                    replies = _h.sent();
                    (0, vitest_1.expect)(replies.ok).toBe(true);
                    // Should include parent + 2 replies
                    (0, vitest_1.expect)((_a = replies.messages) === null || _a === void 0 ? void 0 : _a.length).toBe(3);
                    (0, vitest_1.expect)((_c = (_b = replies.messages) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.text).toBe('Thread parent');
                    (0, vitest_1.expect)((_e = (_d = replies.messages) === null || _d === void 0 ? void 0 : _d[1]) === null || _e === void 0 ? void 0 : _e.text).toBe('Reply 1');
                    (0, vitest_1.expect)((_g = (_f = replies.messages) === null || _f === void 0 ? void 0 : _f[2]) === null || _g === void 0 ? void 0 : _g.text).toBe('Reply 2');
                    return [2 /*return*/];
            }
        });
    }); });
    // --- reactions.add / reactions.remove ---
    (0, vitest_1.test)('reactions.add and reactions.remove', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, posted, addResult, err_3, removeResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'React to this',
                        })];
                case 1:
                    posted = _a.sent();
                    return [4 /*yield*/, client.reactions.add({
                            channel: channelId,
                            timestamp: posted.ts,
                            name: 'thumbsup',
                        })];
                case 2:
                    addResult = _a.sent();
                    (0, vitest_1.expect)(addResult.ok).toBe(true);
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, client.reactions.add({
                            channel: channelId,
                            timestamp: posted.ts,
                            name: 'thumbsup',
                        })];
                case 4:
                    _a.sent();
                    vitest_1.expect.unreachable('should have thrown');
                    return [3 /*break*/, 6];
                case 5:
                    err_3 = _a.sent();
                    (0, vitest_1.expect)(err_3.message).toContain('already_reacted');
                    return [3 /*break*/, 6];
                case 6: return [4 /*yield*/, client.reactions.remove({
                        channel: channelId,
                        timestamp: posted.ts,
                        name: 'thumbsup',
                    })];
                case 7:
                    removeResult = _a.sent();
                    (0, vitest_1.expect)(removeResult.ok).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    // --- users.info ---
    (0, vitest_1.test)('users.info returns user details', function () { return __awaiter(void 0, void 0, void 0, function () {
        var aliceId, result;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    aliceId = twin.resolveUserId('alice');
                    return [4 /*yield*/, client.users.info({ user: aliceId })];
                case 1:
                    result = _d.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    (0, vitest_1.expect)((_a = result.user) === null || _a === void 0 ? void 0 : _a.name).toBe('alice');
                    (0, vitest_1.expect)((_b = result.user) === null || _b === void 0 ? void 0 : _b.real_name).toBe('Alice Smith');
                    (0, vitest_1.expect)((_c = result.user) === null || _c === void 0 ? void 0 : _c.is_bot).toBe(false);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('users.info for bot user', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, client.users.info({ user: twin.botUserId })];
                case 1:
                    result = _b.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    (0, vitest_1.expect)((_a = result.user) === null || _a === void 0 ? void 0 : _a.is_bot).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('users.info returns error for unknown user', function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, client.users.info({ user: 'U_NONEXISTENT' })];
                case 1:
                    _a.sent();
                    vitest_1.expect.unreachable('should have thrown');
                    return [3 /*break*/, 3];
                case 2:
                    err_4 = _a.sent();
                    (0, vitest_1.expect)(err_4.message).toContain('user_not_found');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // --- users.list ---
    (0, vitest_1.test)('users.list returns all workspace users', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, names;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, client.users.list({})];
                case 1:
                    result = _c.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    names = (_b = (_a = result.members) === null || _a === void 0 ? void 0 : _a.map(function (m) { return m.name; })) !== null && _b !== void 0 ? _b : [];
                    (0, vitest_1.expect)(names).toContain('alice');
                    (0, vitest_1.expect)(names).toContain('bob');
                    (0, vitest_1.expect)(names).toContain('test-bot');
                    return [2 /*return*/];
            }
        });
    }); });
    // --- ChannelScope helpers ---
    (0, vitest_1.test)('channel.text() returns readable snapshot', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, snapshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channelId = twin.resolveChannelId('random');
                    // Clear messages by directly using prisma
                    return [4 /*yield*/, twin.prisma.message.deleteMany({ where: { channelId: channelId } })
                        // Simulate user message + bot reply
                    ];
                case 1:
                    // Clear messages by directly using prisma
                    _a.sent();
                    // Simulate user message + bot reply
                    twin.user('alice').sendMessage({ channel: 'random', text: 'hello bot' });
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Hello alice!',
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, twin.channel('random').text()];
                case 3:
                    snapshot = _a.sent();
                    (0, vitest_1.expect)(snapshot).toMatchInlineSnapshot("\n      \"alice: hello bot\n      test-bot: Hello alice!\"\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('channel.getMessages() returns SlackMessage array', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, messages;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    channelId = twin.resolveChannelId('random');
                    return [4 /*yield*/, twin.prisma.message.deleteMany({ where: { channelId: channelId } })];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Test message',
                        })];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, twin.channel('random').getMessages()];
                case 3:
                    messages = _d.sent();
                    (0, vitest_1.expect)(messages.length).toBe(1);
                    (0, vitest_1.expect)((_a = messages[0]) === null || _a === void 0 ? void 0 : _a.text).toBe('Test message');
                    (0, vitest_1.expect)((_b = messages[0]) === null || _b === void 0 ? void 0 : _b.type).toBe('message');
                    (0, vitest_1.expect)((_c = messages[0]) === null || _c === void 0 ? void 0 : _c.bot_id).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('slack digital twin - user actor', function () {
    var twin;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    twin = new index_ts_1.SlackDigitalTwin({
                        channels: [{ name: 'general' }],
                        users: [{ name: 'alice' }],
                    });
                    return [4 /*yield*/, twin.start()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, twin.stop()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('user.sendMessage creates a message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var msg, messages;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, twin.user('alice').sendMessage({
                        channel: 'general',
                        text: 'hi from alice',
                    })];
                case 1:
                    msg = _a.sent();
                    (0, vitest_1.expect)(msg.user).toBe(twin.resolveUserId('alice'));
                    (0, vitest_1.expect)(msg.text).toBe('hi from alice');
                    (0, vitest_1.expect)(msg.ts).toBeTruthy();
                    return [4 /*yield*/, twin.channel('general').getMessages()];
                case 2:
                    messages = _a.sent();
                    (0, vitest_1.expect)(messages.some(function (m) { return m.text === 'hi from alice'; })).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('user.addReaction adds a reaction', function () { return __awaiter(void 0, void 0, void 0, function () {
        var msg, messages, reactedMsg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, twin.user('alice').sendMessage({
                        channel: 'general',
                        text: 'react to me',
                    })];
                case 1:
                    msg = _a.sent();
                    return [4 /*yield*/, twin.user('alice').addReaction({
                            channel: 'general',
                            messageTs: msg.ts,
                            name: 'heart',
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, twin.channel('general').getMessages()];
                case 3:
                    messages = _a.sent();
                    reactedMsg = messages.find(function (m) { return m.ts === msg.ts; });
                    (0, vitest_1.expect)(reactedMsg === null || reactedMsg === void 0 ? void 0 : reactedMsg.reactions).toEqual([
                        { name: 'heart', users: [twin.resolveUserId('alice')], count: 1 },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('user.sendMessage in thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var parent, snapshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, twin.user('alice').sendMessage({
                        channel: 'general',
                        text: 'parent msg',
                    })];
                case 1:
                    parent = _a.sent();
                    return [4 /*yield*/, twin.user('alice').sendMessage({
                            channel: 'general',
                            text: 'thread reply',
                            threadTs: parent.ts,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, twin.channel('general').text()];
                case 3:
                    snapshot = _a.sent();
                    (0, vitest_1.expect)(snapshot).toContain('parent msg');
                    (0, vitest_1.expect)(snapshot).toContain('  ↳ alice: thread reply');
                    return [2 /*return*/];
            }
        });
    }); });
});
