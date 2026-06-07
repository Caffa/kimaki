"use strict";
// E2E: Slack → Discord event flow (webhook events through the bridge).
// Slack user actions trigger webhooks → bridge translates → discord.js receives Gateway events.
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
var e2e_setup_js_1 = require("./e2e-setup.js");
var src_1 = require("slack-digital-twin/src");
var id_converter_js_1 = require("../src/id-converter.js");
(0, vitest_1.describe)('Slack → Discord events', function () {
    var ctx;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)({
                        channels: [{ name: 'slack-events' }, { name: 'slack-events-2' }],
                        users: [{ name: 'alice', realName: 'Alice' }],
                    })];
                case 1:
                    ctx = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.teardownE2E)(ctx)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('Slack user sends message → discord.js receives messageCreate', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, channelId, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        ctx.client.once('messageCreate', function (msg) {
                            resolve(msg);
                        });
                    });
                    channelId = ctx.twin.resolveChannelId('slack-events');
                    return [4 /*yield*/, ctx.twin.user('alice').sendMessage({
                            channel: channelId,
                            text: 'Hello from Slack!',
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, received];
                case 2:
                    msg = _a.sent();
                    (0, vitest_1.expect)(msg.content).toBe('Hello from Slack!');
                    (0, vitest_1.expect)(msg.author.id).toBe(ctx.twin.resolveUserId('alice'));
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('Slack user sends thread reply → discord.js receives messageCreate in thread channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, ch, parent, messages, parentMsg, received, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channelId = ctx.twin.resolveChannelId('slack-events');
                    return [4 /*yield*/, ctx.client.channels.fetch(channelId)];
                case 1:
                    ch = (_a.sent());
                    return [4 /*yield*/, ch.send('Parent message for thread')
                        // Get the Slack ts for this message from the twin
                    ];
                case 2:
                    parent = _a.sent();
                    return [4 /*yield*/, ctx.twin.channel('slack-events').getMessages()];
                case 3:
                    messages = _a.sent();
                    parentMsg = messages.find(function (m) {
                        return m.text === 'Parent message for thread';
                    });
                    (0, vitest_1.expect)(parentMsg).toBeDefined();
                    received = new Promise(function (resolve) {
                        ctx.client.once('messageCreate', function (msg) {
                            resolve(msg);
                        });
                    });
                    // Alice replies in the Slack thread
                    return [4 /*yield*/, ctx.twin.user('alice').sendMessage({
                            channel: channelId,
                            text: 'Thread reply from Slack',
                            threadTs: parentMsg.ts,
                        })];
                case 4:
                    // Alice replies in the Slack thread
                    _a.sent();
                    return [4 /*yield*/, received];
                case 5:
                    msg = _a.sent();
                    (0, vitest_1.expect)(msg.content).toBe('Thread reply from Slack');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('Slack user adds reaction → discord.js receives messageReactionAdd', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, ch, messages, target, received, reaction;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channelId = ctx.twin.resolveChannelId('slack-events');
                    return [4 /*yield*/, ctx.client.channels.fetch(channelId)];
                case 1:
                    ch = (_a.sent());
                    return [4 /*yield*/, ch.send('React target')
                        // Get the Slack ts
                    ];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ctx.twin.channel('slack-events').getMessages()];
                case 3:
                    messages = _a.sent();
                    target = messages.find(function (m) {
                        return m.text === 'React target';
                    });
                    (0, vitest_1.expect)(target).toBeDefined();
                    received = new Promise(function (resolve) {
                        ctx.client.once('messageReactionAdd', function (reaction) {
                            resolve(reaction);
                        });
                    });
                    return [4 /*yield*/, ctx.twin.user('alice').addReaction({
                            channel: channelId,
                            messageTs: target.ts,
                            name: 'thumbsup',
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, received];
                case 5:
                    reaction = _a.sent();
                    (0, vitest_1.expect)(reaction.emoji.name).toBe('thumbsup');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('same thread_ts across two channels emits two distinct THREAD_CREATE events', function () { return __awaiter(void 0, void 0, void 0, function () {
        var webhookConfig, channelA, channelB, aliceId, sharedThreadTs, threadCreates, onThreadCreate, createdThreadIds;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    channelA = ctx.twin.resolveChannelId('slack-events');
                    channelB = ctx.twin.resolveChannelId('slack-events-2');
                    aliceId = ctx.twin.resolveUserId('alice');
                    sharedThreadTs = '1700000000.123456';
                    threadCreates = [];
                    onThreadCreate = function (thread) {
                        threadCreates.push(thread.id);
                    };
                    ctx.client.on('threadCreate', onThreadCreate);
                    return [4 /*yield*/, (0, src_1.sendWebhookEvent)({
                            config: webhookConfig,
                            event: {
                                type: 'message',
                                channel: channelA,
                                user: aliceId,
                                text: 'reply in channel A',
                                ts: '1700000001.000001',
                                thread_ts: sharedThreadTs,
                            },
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 2);
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, src_1.sendWebhookEvent)({
                            config: webhookConfig,
                            event: {
                                type: 'message',
                                channel: channelB,
                                user: aliceId,
                                text: 'reply in channel B',
                                ts: '1700000002.000001',
                                thread_ts: sharedThreadTs,
                            },
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    if (threadCreates.length >= 2) {
                                        return [2 /*return*/, __spreadArray([], threadCreates, true)];
                                    }
                                    return [2 /*return*/, null];
                                });
                            }); },
                            label: 'threadCreate events across channels',
                        })];
                case 4:
                    createdThreadIds = _a.sent();
                    ctx.client.off('threadCreate', onThreadCreate);
                    (0, vitest_1.expect)(createdThreadIds).toContain((0, id_converter_js_1.encodeThreadId)(channelA, sharedThreadTs));
                    (0, vitest_1.expect)(createdThreadIds).toContain((0, id_converter_js_1.encodeThreadId)(channelB, sharedThreadTs));
                    (0, vitest_1.expect)(new Set(createdThreadIds).size).toBeGreaterThanOrEqual(2);
                    return [2 /*return*/];
            }
        });
    }); });
});
