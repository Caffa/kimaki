"use strict";
// Tests that simulate real bot workflows similar to what Kimaki does on Discord.
// These validate the slack-digital-twin handles the interaction patterns that
// the discord-slack-bridge relies on: thread creation via first message,
// sequential bot messages in threads, edit-then-delete flows, reactions,
// file uploads, channel lifecycle, and concurrent operations.
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
(0, vitest_1.describe)('bot workflows - thread creation and messaging', function () {
    var twin;
    var client;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    twin = new index_ts_1.SlackDigitalTwin({
                        channels: [{ name: 'general' }, { name: 'projects' }],
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
    // In Slack, creating a thread = posting a parent message, then replying
    // with thread_ts set to the parent's ts. The bridge does this for every
    // Discord thread creation.
    (0, vitest_1.test)('thread creation: post parent then reply in thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, parent, reply1, reply2, replies;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'New coding session started',
                        })];
                case 1:
                    parent = _h.sent();
                    (0, vitest_1.expect)(parent.ts).toBeTruthy();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Reading file src/index.ts...',
                            thread_ts: parent.ts,
                        })];
                case 2:
                    reply1 = _h.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Editing src/index.ts...',
                            thread_ts: parent.ts,
                        })
                        // Verify thread via conversations.replies
                    ];
                case 3:
                    reply2 = _h.sent();
                    return [4 /*yield*/, client.conversations.replies({
                            channel: channelId,
                            ts: parent.ts,
                        })];
                case 4:
                    replies = _h.sent();
                    (0, vitest_1.expect)((_a = replies.messages) === null || _a === void 0 ? void 0 : _a.length).toBe(3);
                    (0, vitest_1.expect)((_c = (_b = replies.messages) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.text).toBe('New coding session started');
                    (0, vitest_1.expect)((_e = (_d = replies.messages) === null || _d === void 0 ? void 0 : _d[1]) === null || _e === void 0 ? void 0 : _e.text).toBe('Reading file src/index.ts...');
                    (0, vitest_1.expect)((_g = (_f = replies.messages) === null || _f === void 0 ? void 0 : _f[2]) === null || _g === void 0 ? void 0 : _g.text).toBe('Editing src/index.ts...');
                    return [2 /*return*/];
            }
        });
    }); });
    // Kimaki posts many sequential messages in a thread (tool outputs, text
    // parts, context usage, footer). All must appear in order.
    (0, vitest_1.test)('sequential bot messages maintain order in thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, parent, messages, _i, messages_1, text, replies, replyTexts;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Session thread',
                        })];
                case 1:
                    parent = _d.sent();
                    messages = [
                        '⬥ I will read the file first.',
                        '┣ bash: cat src/main.ts',
                        '⬥ The file contains a simple function. Let me edit it.',
                        '◼︎ edit: src/main.ts',
                        '⬦ 15% context used',
                        'kimakivoice ⋅ main ⋅ 0m 30s ⋅ 15% ⋅ claude-opus-4-6',
                    ];
                    _i = 0, messages_1 = messages;
                    _d.label = 2;
                case 2:
                    if (!(_i < messages_1.length)) return [3 /*break*/, 5];
                    text = messages_1[_i];
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: text,
                            thread_ts: parent.ts,
                        })];
                case 3:
                    _d.sent();
                    _d.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, client.conversations.replies({
                        channel: channelId,
                        ts: parent.ts,
                    })
                    // Parent + 6 replies = 7
                ];
                case 6:
                    replies = _d.sent();
                    // Parent + 6 replies = 7
                    (0, vitest_1.expect)((_a = replies.messages) === null || _a === void 0 ? void 0 : _a.length).toBe(7);
                    replyTexts = (_c = (_b = replies.messages) === null || _b === void 0 ? void 0 : _b.slice(1).map(function (m) { return m.text; })) !== null && _c !== void 0 ? _c : [];
                    (0, vitest_1.expect)(replyTexts).toEqual(messages);
                    return [2 /*return*/];
            }
        });
    }); });
    // Thread messages should NOT appear in channel history (only top-level
    // messages appear there). This is how Slack works.
    (0, vitest_1.test)('thread replies are excluded from conversations.history', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, parent, history, texts;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = twin.resolveChannelId('projects');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Parent in projects',
                        })];
                case 1:
                    parent = _c.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Reply in thread',
                            thread_ts: parent.ts,
                        })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, client.conversations.history({ channel: channelId })];
                case 3:
                    history = _c.sent();
                    texts = (_b = (_a = history.messages) === null || _a === void 0 ? void 0 : _a.map(function (m) { return m.text; })) !== null && _b !== void 0 ? _b : [];
                    (0, vitest_1.expect)(texts).toContain('Parent in projects');
                    (0, vitest_1.expect)(texts).not.toContain('Reply in thread');
                    return [2 /*return*/];
            }
        });
    }); });
    // The bridge edits messages (e.g. updating a tool status from pending to done)
    // then reads them back via conversations.replies.
    (0, vitest_1.test)('edit message in thread and verify via replies', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, parent, toolMsg, replies, editedMsg;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Edit test thread',
                        })];
                case 1:
                    parent = _b.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: '┣ bash: running tests... (pending)',
                            thread_ts: parent.ts,
                        })];
                case 2:
                    toolMsg = _b.sent();
                    return [4 /*yield*/, client.chat.update({
                            channel: channelId,
                            ts: toolMsg.ts,
                            text: '┣ bash: running tests... (done, exit 0)',
                        })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, client.conversations.replies({
                            channel: channelId,
                            ts: parent.ts,
                        })];
                case 4:
                    replies = _b.sent();
                    editedMsg = (_a = replies.messages) === null || _a === void 0 ? void 0 : _a.find(function (m) { return m.ts === toolMsg.ts; });
                    (0, vitest_1.expect)(editedMsg === null || editedMsg === void 0 ? void 0 : editedMsg.text).toBe('┣ bash: running tests... (done, exit 0)');
                    (0, vitest_1.expect)(editedMsg === null || editedMsg === void 0 ? void 0 : editedMsg.edited).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    // Delete a message in a thread (e.g. removing a temporary status message)
    (0, vitest_1.test)('delete message in thread removes it from replies', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, parent, tempMsg, finalMsg, replies, tsValues;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Delete test thread',
                        })];
                case 1:
                    parent = _c.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Temporary typing indicator...',
                            thread_ts: parent.ts,
                        })];
                case 2:
                    tempMsg = _c.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: '⬥ Here is the answer.',
                            thread_ts: parent.ts,
                        })];
                case 3:
                    finalMsg = _c.sent();
                    return [4 /*yield*/, client.chat.delete({
                            channel: channelId,
                            ts: tempMsg.ts,
                        })];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, client.conversations.replies({
                            channel: channelId,
                            ts: parent.ts,
                        })];
                case 5:
                    replies = _c.sent();
                    tsValues = (_b = (_a = replies.messages) === null || _a === void 0 ? void 0 : _a.map(function (m) { return m.ts; })) !== null && _b !== void 0 ? _b : [];
                    (0, vitest_1.expect)(tsValues).toContain(parent.ts);
                    (0, vitest_1.expect)(tsValues).not.toContain(tempMsg.ts);
                    (0, vitest_1.expect)(tsValues).toContain(finalMsg.ts);
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('bot workflows - reactions', function () {
    var twin;
    var client;
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
                    client = new web_api_1.WebClient(twin.botToken, {
                        slackApiUrl: twin.apiUrl,
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
    // Bot reacts to a user message to acknowledge it (e.g. eyes emoji when
    // starting to process, checkmark when done)
    (0, vitest_1.test)('bot adds reaction to user message then removes it', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, userMsg, messages, msg, reactionNames;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, twin.user('alice').sendMessage({
                            channel: 'general',
                            text: 'please fix the bug',
                        })
                        // Bot adds eyes reaction (acknowledging)
                    ];
                case 1:
                    userMsg = _f.sent();
                    // Bot adds eyes reaction (acknowledging)
                    return [4 /*yield*/, client.reactions.add({
                            channel: channelId,
                            timestamp: userMsg.ts,
                            name: 'eyes',
                        })
                        // Verify reaction appears on the message
                    ];
                case 2:
                    // Bot adds eyes reaction (acknowledging)
                    _f.sent();
                    return [4 /*yield*/, twin.channel('general').getMessages()];
                case 3:
                    messages = _f.sent();
                    msg = messages.find(function (m) { return m.ts === userMsg.ts; });
                    (0, vitest_1.expect)((_a = msg === null || msg === void 0 ? void 0 : msg.reactions) === null || _a === void 0 ? void 0 : _a.length).toBe(1);
                    (0, vitest_1.expect)((_c = (_b = msg === null || msg === void 0 ? void 0 : msg.reactions) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.name).toBe('eyes');
                    // Bot removes eyes and adds checkmark (done)
                    return [4 /*yield*/, client.reactions.remove({
                            channel: channelId,
                            timestamp: userMsg.ts,
                            name: 'eyes',
                        })];
                case 4:
                    // Bot removes eyes and adds checkmark (done)
                    _f.sent();
                    return [4 /*yield*/, client.reactions.add({
                            channel: channelId,
                            timestamp: userMsg.ts,
                            name: 'white_check_mark',
                        })];
                case 5:
                    _f.sent();
                    return [4 /*yield*/, twin.channel('general').getMessages()];
                case 6:
                    messages = _f.sent();
                    msg = messages.find(function (m) { return m.ts === userMsg.ts; });
                    reactionNames = (_e = (_d = msg === null || msg === void 0 ? void 0 : msg.reactions) === null || _d === void 0 ? void 0 : _d.map(function (r) { return r.name; })) !== null && _e !== void 0 ? _e : [];
                    (0, vitest_1.expect)(reactionNames).toContain('white_check_mark');
                    (0, vitest_1.expect)(reactionNames).not.toContain('eyes');
                    return [2 /*return*/];
            }
        });
    }); });
    // Multiple reactions from different sources on the same message
    (0, vitest_1.test)('multiple reactions from bot and user on same message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, msg, messages, reactedMsg, reactionNames;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, twin.user('alice').sendMessage({
                            channel: 'general',
                            text: 'great work!',
                        })
                        // User reacts
                    ];
                case 1:
                    msg = _c.sent();
                    // User reacts
                    return [4 /*yield*/, twin.user('alice').addReaction({
                            channel: 'general',
                            messageTs: msg.ts,
                            name: 'thumbsup',
                        })
                        // Bot reacts
                    ];
                case 2:
                    // User reacts
                    _c.sent();
                    // Bot reacts
                    return [4 /*yield*/, client.reactions.add({
                            channel: channelId,
                            timestamp: msg.ts,
                            name: 'robot_face',
                        })];
                case 3:
                    // Bot reacts
                    _c.sent();
                    return [4 /*yield*/, twin.channel('general').getMessages()];
                case 4:
                    messages = _c.sent();
                    reactedMsg = messages.find(function (m) { return m.ts === msg.ts; });
                    reactionNames = (_b = (_a = reactedMsg === null || reactedMsg === void 0 ? void 0 : reactedMsg.reactions) === null || _a === void 0 ? void 0 : _a.map(function (r) { return r.name; })) !== null && _b !== void 0 ? _b : [];
                    (0, vitest_1.expect)(reactionNames).toContain('thumbsup');
                    (0, vitest_1.expect)(reactionNames).toContain('robot_face');
                    return [2 /*return*/];
            }
        });
    }); });
    // Reaction on a message inside a thread
    (0, vitest_1.test)('reaction on thread reply message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, parent, reply, replies, reactedReply;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Thread with reactions',
                        })];
                case 1:
                    parent = _e.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Bot reply in thread',
                            thread_ts: parent.ts,
                        })];
                case 2:
                    reply = _e.sent();
                    return [4 /*yield*/, client.reactions.add({
                            channel: channelId,
                            timestamp: reply.ts,
                            name: 'tada',
                        })
                        // Verify via conversations.replies that the reaction is on the reply
                    ];
                case 3:
                    _e.sent();
                    return [4 /*yield*/, client.conversations.replies({
                            channel: channelId,
                            ts: parent.ts,
                        })];
                case 4:
                    replies = _e.sent();
                    reactedReply = (_a = replies.messages) === null || _a === void 0 ? void 0 : _a.find(function (m) { return m.ts === reply.ts; });
                    (0, vitest_1.expect)((_b = reactedReply === null || reactedReply === void 0 ? void 0 : reactedReply.reactions) === null || _b === void 0 ? void 0 : _b.length).toBe(1);
                    (0, vitest_1.expect)((_d = (_c = reactedReply === null || reactedReply === void 0 ? void 0 : reactedReply.reactions) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.name).toBe('tada');
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('bot workflows - file uploads', function () {
    var twin;
    var client;
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
                    client = new web_api_1.WebClient(twin.botToken, {
                        slackApiUrl: twin.apiUrl,
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
    // The bridge uses Slack's 2-step upload: getUploadURLExternal then
    // completeUploadExternal. Both must return ok: true.
    (0, vitest_1.test)('2-step file upload flow succeeds', function () { return __awaiter(void 0, void 0, void 0, function () {
        var uploadUrl, complete;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.files.getUploadURLExternal({
                        filename: 'patch.diff',
                        length: 1234,
                    })];
                case 1:
                    uploadUrl = _a.sent();
                    (0, vitest_1.expect)(uploadUrl.ok).toBe(true);
                    (0, vitest_1.expect)(uploadUrl.upload_url).toBeTruthy();
                    (0, vitest_1.expect)(uploadUrl.file_id).toBeTruthy();
                    return [4 /*yield*/, client.files.completeUploadExternal({
                            files: [{ id: uploadUrl.file_id, title: 'patch.diff' }],
                            channel_id: twin.resolveChannelId('general'),
                        })];
                case 2:
                    complete = _a.sent();
                    (0, vitest_1.expect)(complete.ok).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    // Multiple file uploads in sequence (e.g. bot uploading several edited files)
    (0, vitest_1.test)('multiple sequential file uploads', function () { return __awaiter(void 0, void 0, void 0, function () {
        var filenames, _i, filenames_1, filename, upload, complete;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filenames = ['file1.ts', 'file2.ts', 'file3.ts'];
                    _i = 0, filenames_1 = filenames;
                    _a.label = 1;
                case 1:
                    if (!(_i < filenames_1.length)) return [3 /*break*/, 5];
                    filename = filenames_1[_i];
                    return [4 /*yield*/, client.files.getUploadURLExternal({
                            filename: filename,
                            length: 500,
                        })];
                case 2:
                    upload = _a.sent();
                    (0, vitest_1.expect)(upload.ok).toBe(true);
                    return [4 /*yield*/, client.files.completeUploadExternal({
                            files: [{ id: upload.file_id, title: filename }],
                            channel_id: twin.resolveChannelId('general'),
                        })];
                case 3:
                    complete = _a.sent();
                    (0, vitest_1.expect)(complete.ok).toBe(true);
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('bot workflows - channel lifecycle', function () {
    var twin;
    var client;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    twin = new index_ts_1.SlackDigitalTwin({
                        channels: [{ name: 'general' }, { name: 'old-project' }],
                        users: [{ name: 'alice' }],
                    });
                    return [4 /*yield*/, twin.start()];
                case 1:
                    _a.sent();
                    client = new web_api_1.WebClient(twin.botToken, {
                        slackApiUrl: twin.apiUrl,
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
    // The bridge calls conversations.create when Discord creates a new channel
    (0, vitest_1.test)('create a new channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, list, names;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, client.conversations.create({ name: 'new-project' })];
                case 1:
                    result = _e.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    (0, vitest_1.expect)((_a = result.channel) === null || _a === void 0 ? void 0 : _a.name).toBe('new-project');
                    (0, vitest_1.expect)((_b = result.channel) === null || _b === void 0 ? void 0 : _b.id).toBeTruthy();
                    return [4 /*yield*/, client.conversations.list()];
                case 2:
                    list = _e.sent();
                    names = (_d = (_c = list.channels) === null || _c === void 0 ? void 0 : _c.map(function (c) { return c.name; })) !== null && _d !== void 0 ? _d : [];
                    (0, vitest_1.expect)(names).toContain('new-project');
                    return [2 /*return*/];
            }
        });
    }); });
    // Duplicate channel name should error
    (0, vitest_1.test)('create channel with duplicate name fails', function () { return __awaiter(void 0, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, client.conversations.create({ name: 'general' })];
                case 1:
                    _a.sent();
                    vitest_1.expect.unreachable('should have thrown');
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    (0, vitest_1.expect)(err_1.message).toContain('name_taken');
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // The bridge calls conversations.rename when a Discord channel is renamed
    (0, vitest_1.test)('rename a channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, result, info;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = twin.resolveChannelId('old-project');
                    return [4 /*yield*/, client.conversations.rename({
                            channel: channelId,
                            name: 'active-project',
                        })];
                case 1:
                    result = _c.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    (0, vitest_1.expect)((_a = result.channel) === null || _a === void 0 ? void 0 : _a.name).toBe('active-project');
                    return [4 /*yield*/, client.conversations.info({ channel: channelId })];
                case 2:
                    info = _c.sent();
                    (0, vitest_1.expect)((_b = info.channel) === null || _b === void 0 ? void 0 : _b.name).toBe('active-project');
                    return [2 /*return*/];
            }
        });
    }); });
    // The bridge calls conversations.setTopic when a Discord channel topic changes
    (0, vitest_1.test)('set channel topic', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, result, info;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.conversations.setTopic({
                            channel: channelId,
                            topic: 'Main project discussion',
                        })];
                case 1:
                    result = _c.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    return [4 /*yield*/, client.conversations.info({ channel: channelId })];
                case 2:
                    info = _c.sent();
                    (0, vitest_1.expect)((_b = (_a = info.channel) === null || _a === void 0 ? void 0 : _a.topic) === null || _b === void 0 ? void 0 : _b.value).toBe('Main project discussion');
                    return [2 /*return*/];
            }
        });
    }); });
    // The bridge calls conversations.archive when a Discord channel is deleted
    (0, vitest_1.test)('archive a channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var created, channelId, result, list, ids;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, client.conversations.create({ name: 'to-archive' })];
                case 1:
                    created = _d.sent();
                    channelId = (_a = created.channel) === null || _a === void 0 ? void 0 : _a.id;
                    return [4 /*yield*/, client.conversations.archive({ channel: channelId })];
                case 2:
                    result = _d.sent();
                    (0, vitest_1.expect)(result.ok).toBe(true);
                    return [4 /*yield*/, client.conversations.list()];
                case 3:
                    list = _d.sent();
                    ids = (_c = (_b = list.channels) === null || _b === void 0 ? void 0 : _b.map(function (c) { return c.id; })) !== null && _c !== void 0 ? _c : [];
                    (0, vitest_1.expect)(ids).not.toContain(channelId);
                    return [2 /*return*/];
            }
        });
    }); });
    // Archiving an already archived channel should error
    (0, vitest_1.test)('archive already archived channel fails', function () { return __awaiter(void 0, void 0, void 0, function () {
        var created, channelId, err_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, client.conversations.create({ name: 'double-archive' })];
                case 1:
                    created = _b.sent();
                    channelId = (_a = created.channel) === null || _a === void 0 ? void 0 : _a.id;
                    return [4 /*yield*/, client.conversations.archive({ channel: channelId })];
                case 2:
                    _b.sent();
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, client.conversations.archive({ channel: channelId })];
                case 4:
                    _b.sent();
                    vitest_1.expect.unreachable('should have thrown');
                    return [3 /*break*/, 6];
                case 5:
                    err_2 = _b.sent();
                    (0, vitest_1.expect)(err_2.message).toContain('already_archived');
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('bot workflows - concurrent operations', function () {
    var twin;
    var client;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    twin = new index_ts_1.SlackDigitalTwin({
                        channels: [{ name: 'general' }],
                        users: [
                            { name: 'alice' },
                            { name: 'bob' },
                        ],
                    });
                    return [4 /*yield*/, twin.start()];
                case 1:
                    _a.sent();
                    client = new web_api_1.WebClient(twin.botToken, {
                        slackApiUrl: twin.apiUrl,
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
    // Multiple users sending messages concurrently in the same channel
    (0, vitest_1.test)('concurrent messages from multiple users', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, messages, timestamps;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, twin.prisma.message.deleteMany({ where: { channelId: channelId } })
                        // Send messages concurrently
                    ];
                case 1:
                    _a.sent();
                    // Send messages concurrently
                    return [4 /*yield*/, Promise.all([
                            twin.user('alice').sendMessage({ channel: 'general', text: 'alice msg 1' }),
                            twin.user('bob').sendMessage({ channel: 'general', text: 'bob msg 1' }),
                            client.chat.postMessage({ channel: channelId, text: 'bot msg 1' }),
                            twin.user('alice').sendMessage({ channel: 'general', text: 'alice msg 2' }),
                            client.chat.postMessage({ channel: channelId, text: 'bot msg 2' }),
                        ])];
                case 2:
                    // Send messages concurrently
                    _a.sent();
                    return [4 /*yield*/, twin.channel('general').getMessages()];
                case 3:
                    messages = _a.sent();
                    (0, vitest_1.expect)(messages.length).toBe(5);
                    timestamps = messages.map(function (m) { return m.ts; });
                    (0, vitest_1.expect)(new Set(timestamps).size).toBe(5);
                    return [2 /*return*/];
            }
        });
    }); });
    // Bot posts, edits, and reacts to the same message (common pattern)
    (0, vitest_1.test)('post then edit then react on same message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, posted, history, msg;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Processing...',
                        })];
                case 1:
                    posted = _e.sent();
                    return [4 /*yield*/, client.chat.update({
                            channel: channelId,
                            ts: posted.ts,
                            text: 'Done processing.',
                        })];
                case 2:
                    _e.sent();
                    return [4 /*yield*/, client.reactions.add({
                            channel: channelId,
                            timestamp: posted.ts,
                            name: 'white_check_mark',
                        })
                        // Verify the final state via history
                    ];
                case 3:
                    _e.sent();
                    return [4 /*yield*/, client.conversations.history({ channel: channelId })];
                case 4:
                    history = _e.sent();
                    msg = (_a = history.messages) === null || _a === void 0 ? void 0 : _a.find(function (m) { return m.ts === posted.ts; });
                    (0, vitest_1.expect)(msg === null || msg === void 0 ? void 0 : msg.text).toBe('Done processing.');
                    (0, vitest_1.expect)(msg === null || msg === void 0 ? void 0 : msg.edited).toBeTruthy();
                    (0, vitest_1.expect)((_b = msg === null || msg === void 0 ? void 0 : msg.reactions) === null || _b === void 0 ? void 0 : _b.length).toBe(1);
                    (0, vitest_1.expect)((_d = (_c = msg === null || msg === void 0 ? void 0 : msg.reactions) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.name).toBe('white_check_mark');
                    return [2 /*return*/];
            }
        });
    }); });
    // Multiple threads in the same channel running simultaneously
    (0, vitest_1.test)('multiple threads in same channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, thread1, thread2, replies1, replies2, t1Texts, t2Texts;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Thread 1 parent',
                        })];
                case 1:
                    thread1 = _e.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Thread 2 parent',
                        })
                        // Post to both threads concurrently
                    ];
                case 2:
                    thread2 = _e.sent();
                    // Post to both threads concurrently
                    return [4 /*yield*/, Promise.all([
                            client.chat.postMessage({
                                channel: channelId,
                                text: 'T1 reply 1',
                                thread_ts: thread1.ts,
                            }),
                            client.chat.postMessage({
                                channel: channelId,
                                text: 'T2 reply 1',
                                thread_ts: thread2.ts,
                            }),
                            client.chat.postMessage({
                                channel: channelId,
                                text: 'T1 reply 2',
                                thread_ts: thread1.ts,
                            }),
                            client.chat.postMessage({
                                channel: channelId,
                                text: 'T2 reply 2',
                                thread_ts: thread2.ts,
                            }),
                        ])
                        // Verify each thread has correct replies
                    ];
                case 3:
                    // Post to both threads concurrently
                    _e.sent();
                    return [4 /*yield*/, client.conversations.replies({
                            channel: channelId,
                            ts: thread1.ts,
                        })];
                case 4:
                    replies1 = _e.sent();
                    return [4 /*yield*/, client.conversations.replies({
                            channel: channelId,
                            ts: thread2.ts,
                        })];
                case 5:
                    replies2 = _e.sent();
                    t1Texts = (_b = (_a = replies1.messages) === null || _a === void 0 ? void 0 : _a.map(function (m) { return m.text; })) !== null && _b !== void 0 ? _b : [];
                    t2Texts = (_d = (_c = replies2.messages) === null || _c === void 0 ? void 0 : _c.map(function (m) { return m.text; })) !== null && _d !== void 0 ? _d : [];
                    (0, vitest_1.expect)(t1Texts).toContain('Thread 1 parent');
                    (0, vitest_1.expect)(t1Texts).toContain('T1 reply 1');
                    (0, vitest_1.expect)(t1Texts).toContain('T1 reply 2');
                    (0, vitest_1.expect)(t1Texts).not.toContain('T2 reply 1');
                    (0, vitest_1.expect)(t2Texts).toContain('Thread 2 parent');
                    (0, vitest_1.expect)(t2Texts).toContain('T2 reply 1');
                    (0, vitest_1.expect)(t2Texts).toContain('T2 reply 2');
                    (0, vitest_1.expect)(t2Texts).not.toContain('T1 reply 1');
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('bot workflows - user message then bot reply pattern', function () {
    var twin;
    var client;
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
                    client = new web_api_1.WebClient(twin.botToken, {
                        slackApiUrl: twin.apiUrl,
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
    // The full Kimaki flow: user sends message -> bot creates thread -> bot
    // posts multiple messages -> bot adds footer
    (0, vitest_1.test)('full session flow: user msg -> thread -> bot replies -> footer', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, userMsg, replies, snapshot;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, twin.prisma.message.deleteMany({ where: { channelId: channelId } })
                        // User sends a message in the channel
                    ];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, twin.user('alice').sendMessage({
                            channel: 'general',
                            text: 'fix the login bug',
                        })
                        // Bot creates a thread by replying to the user message
                    ];
                case 2:
                    userMsg = _b.sent();
                    // Bot creates a thread by replying to the user message
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: '⬥ Looking at the login code...',
                            thread_ts: userMsg.ts,
                        })];
                case 3:
                    // Bot creates a thread by replying to the user message
                    _b.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: '┣ read: src/auth/login.ts',
                            thread_ts: userMsg.ts,
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: '◼︎ edit: src/auth/login.ts',
                            thread_ts: userMsg.ts,
                        })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: '⬥ Fixed the null check in the login handler.',
                            thread_ts: userMsg.ts,
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'kimakivoice ⋅ main ⋅ 0m 15s ⋅ 8% ⋅ claude-opus-4-6',
                            thread_ts: userMsg.ts,
                        })
                        // Verify the full thread
                    ];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, client.conversations.replies({
                            channel: channelId,
                            ts: userMsg.ts,
                        })];
                case 8:
                    replies = _b.sent();
                    (0, vitest_1.expect)((_a = replies.messages) === null || _a === void 0 ? void 0 : _a.length).toBe(6);
                    return [4 /*yield*/, twin.channel('general').text()];
                case 9:
                    snapshot = _b.sent();
                    (0, vitest_1.expect)(snapshot).toMatchInlineSnapshot("\n      \"alice: fix the login bug\n        \u21B3 test-bot: \u2B25 Looking at the login code...\n        \u21B3 test-bot: \u2523 read: src/auth/login.ts\n        \u21B3 test-bot: \u25FC\uFE0E edit: src/auth/login.ts\n        \u21B3 test-bot: \u2B25 Fixed the null check in the login handler.\n        \u21B3 test-bot: kimakivoice \u22C5 main \u22C5 0m 15s \u22C5 8% \u22C5 claude-opus-4-6\"\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    // User sends a follow-up message in the thread (like /queue does)
    (0, vitest_1.test)('user follow-up in existing thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, userMsg, snapshot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, twin.prisma.message.deleteMany({ where: { channelId: channelId } })
                        // User starts a thread
                    ];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, twin.user('alice').sendMessage({
                            channel: 'general',
                            text: 'add tests',
                        })
                        // Bot replies
                    ];
                case 2:
                    userMsg = _a.sent();
                    // Bot replies
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: '⬥ Adding tests...',
                            thread_ts: userMsg.ts,
                        })
                        // User queues a follow-up in the same thread
                    ];
                case 3:
                    // Bot replies
                    _a.sent();
                    // User queues a follow-up in the same thread
                    return [4 /*yield*/, twin.user('alice').sendMessage({
                            channel: 'general',
                            text: 'also add docs',
                            threadTs: userMsg.ts,
                        })
                        // Bot handles the queued message
                    ];
                case 4:
                    // User queues a follow-up in the same thread
                    _a.sent();
                    // Bot handles the queued message
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: '» alice: also add docs',
                            thread_ts: userMsg.ts,
                        })];
                case 5:
                    // Bot handles the queued message
                    _a.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: '⬥ Adding documentation...',
                            thread_ts: userMsg.ts,
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, twin.channel('general').text()];
                case 7:
                    snapshot = _a.sent();
                    (0, vitest_1.expect)(snapshot).toMatchInlineSnapshot("\n      \"alice: add tests\n        \u21B3 test-bot: \u2B25 Adding tests...\n        \u21B3 alice: also add docs\n        \u21B3 test-bot: \u00BB alice: also add docs\n        \u21B3 test-bot: \u2B25 Adding documentation...\"\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    // Bot edits a message multiple times (e.g. streaming text updates)
    (0, vitest_1.test)('bot edits same message multiple times (streaming)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, parent, streamMsg, replies, editedMsg;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    channelId = twin.resolveChannelId('general');
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: 'Streaming thread',
                        })];
                case 1:
                    parent = _b.sent();
                    return [4 /*yield*/, client.chat.postMessage({
                            channel: channelId,
                            text: '⬥ I',
                            thread_ts: parent.ts,
                        })
                        // Simulate streaming edits
                    ];
                case 2:
                    streamMsg = _b.sent();
                    // Simulate streaming edits
                    return [4 /*yield*/, client.chat.update({
                            channel: channelId,
                            ts: streamMsg.ts,
                            text: '⬥ I will fix',
                        })];
                case 3:
                    // Simulate streaming edits
                    _b.sent();
                    return [4 /*yield*/, client.chat.update({
                            channel: channelId,
                            ts: streamMsg.ts,
                            text: '⬥ I will fix the login',
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, client.chat.update({
                            channel: channelId,
                            ts: streamMsg.ts,
                            text: '⬥ I will fix the login bug now.',
                        })
                        // Verify final state
                    ];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, client.conversations.replies({
                            channel: channelId,
                            ts: parent.ts,
                        })];
                case 6:
                    replies = _b.sent();
                    editedMsg = (_a = replies.messages) === null || _a === void 0 ? void 0 : _a.find(function (m) { return m.ts === streamMsg.ts; });
                    (0, vitest_1.expect)(editedMsg === null || editedMsg === void 0 ? void 0 : editedMsg.text).toBe('⬥ I will fix the login bug now.');
                    (0, vitest_1.expect)(editedMsg === null || editedMsg === void 0 ? void 0 : editedMsg.edited).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
});
