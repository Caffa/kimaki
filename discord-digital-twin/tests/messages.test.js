"use strict";
// Phase 2 tests: messages, edits, deletes, and reactions.
// Validates that discord.js Client can send/receive messages through the
// DigitalDiscord server and that state is correctly persisted in the DB.
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
var discord_js_1 = require("discord.js");
var index_js_1 = require("../src/index.js");
(0, vitest_1.describe)('messages and reactions', function () {
    var discord;
    var client;
    var channelId;
    var testUserId;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var channels, users;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    discord = new index_js_1.DigitalDiscord({
                        guild: { name: 'Test Server' },
                        channels: [
                            {
                                name: 'general',
                                type: discord_js_1.ChannelType.GuildText,
                                topic: 'test channel',
                            },
                        ],
                        users: [{ username: 'TestUser' }],
                    });
                    return [4 /*yield*/, discord.start()
                        // Resolve seeded IDs from DB
                    ];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, discord.prisma.channel.findMany()];
                case 2:
                    channels = _a.sent();
                    channelId = channels[0].id;
                    return [4 /*yield*/, discord.prisma.user.findMany({ where: { bot: false } })];
                case 3:
                    users = _a.sent();
                    testUserId = users[0].id;
                    client = new discord_js_1.Client({
                        intents: [
                            discord_js_1.GatewayIntentBits.Guilds,
                            discord_js_1.GatewayIntentBits.MessageContent,
                            discord_js_1.GatewayIntentBits.GuildMessageReactions,
                        ],
                        rest: {
                            api: discord.restUrl,
                            version: '10',
                        },
                    });
                    return [4 /*yield*/, client.login(discord.botToken)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve) {
                            if (client.isReady()) {
                                resolve();
                                return;
                            }
                            client.once('ready', function () {
                                resolve();
                            });
                        })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    client === null || client === void 0 ? void 0 : client.destroy();
                    return [4 /*yield*/, (discord === null || discord === void 0 ? void 0 : discord.stop())];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('simulateUserMessage dispatches messageCreate to client', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, msg, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        client.once('messageCreate', function (msg) {
                            resolve(msg);
                        });
                    });
                    return [4 /*yield*/, discord.simulateUserMessage({
                            channelId: channelId,
                            userId: testUserId,
                            content: 'Hello from user!',
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, received];
                case 2:
                    msg = _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 3:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: user (TestUser)\n      Hello from user!\"\n    ");
                    (0, vitest_1.expect)(msg.content).toBe('Hello from user!');
                    (0, vitest_1.expect)(msg.author.bot).toBe(false);
                    (0, vitest_1.expect)(msg.author.username).toBe('TestUser');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('user actor helper can send a message and wait helper can observe it', function () { return __awaiter(void 0, void 0, void 0, function () {
        var content, observed, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    content = 'Actor helper message';
                    return [4 /*yield*/, discord.channel(channelId).user(testUserId).sendMessage({
                            content: content,
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(channelId).waitForMessage({
                            predicate: function (message) {
                                return message.content === content;
                            },
                        })];
                case 2:
                    observed = _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 3:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: user (TestUser)\n      Hello from user!\n      Actor helper message\"\n    ");
                    (0, vitest_1.expect)(observed.content).toBe(content);
                    (0, vitest_1.expect)(observed.author.id).toBe(testUserId);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('channel.send stores message in DB', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, sent, _a, messages, found;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    guild = client.guilds.cache.first();
                    channel = guild.channels.cache.find(function (c) { return c.name === 'general'; });
                    return [4 /*yield*/, channel.send('Hello from bot!')];
                case 1:
                    sent = _b.sent();
                    (0, vitest_1.expect)(sent.content).toBe('Hello from bot!');
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: user (TestUser)\n      Hello from user!\n      Actor helper message\n      --- from: assistant (TestBot)\n      Hello from bot!\"\n    ");
                    return [4 /*yield*/, discord.channel(channelId).getMessages()];
                case 3:
                    messages = _b.sent();
                    found = messages.find(function (m) { return m.content === 'Hello from bot!'; });
                    (0, vitest_1.expect)(found).toBeDefined();
                    (0, vitest_1.expect)(found === null || found === void 0 ? void 0 : found.author.bot).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('typing endpoint events are tracked for channel scope', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, ch, start, typingEvent;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    guild = client.guilds.cache.first();
                    channel = guild.channels.cache.find(function (c) { return c.name === 'general'; });
                    ch = discord.channel(channelId);
                    ch.clearTypingEvents();
                    start = Date.now();
                    return [4 /*yield*/, channel.sendTyping()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ch.waitForTypingEvent({
                            timeout: 1000,
                            afterTimestamp: start - 1,
                        })];
                case 2:
                    typingEvent = _a.sent();
                    (0, vitest_1.expect)(typingEvent.channelId).toBe(channelId);
                    (0, vitest_1.expect)(typingEvent.timestamp).toBeGreaterThanOrEqual(start);
                    return [4 /*yield*/, ch.waitForTypingToStop({
                            timeout: 1000,
                            idleMs: 100,
                            afterTimestamp: typingEvent.timestamp,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('message edit updates content and edited_timestamp', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, sent, edited, _a, messages, found;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    guild = client.guilds.cache.first();
                    channel = guild.channels.cache.find(function (c) { return c.name === 'general'; });
                    return [4 /*yield*/, channel.send('Original content')];
                case 1:
                    sent = _b.sent();
                    return [4 /*yield*/, sent.edit('Edited content')];
                case 2:
                    edited = _b.sent();
                    (0, vitest_1.expect)(edited.content).toBe('Edited content');
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 3:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: user (TestUser)\n      Hello from user!\n      Actor helper message\n      --- from: assistant (TestBot)\n      Hello from bot!\n      Edited content\"\n    ");
                    return [4 /*yield*/, discord.channel(channelId).getMessages()];
                case 4:
                    messages = _b.sent();
                    found = messages.find(function (m) { return m.id === sent.id; });
                    (0, vitest_1.expect)(found === null || found === void 0 ? void 0 : found.content).toBe('Edited content');
                    (0, vitest_1.expect)(found === null || found === void 0 ? void 0 : found.edited_timestamp).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('message delete removes from DB', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, sent, sentId, _a, messages, found;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    guild = client.guilds.cache.first();
                    channel = guild.channels.cache.find(function (c) { return c.name === 'general'; });
                    return [4 /*yield*/, channel.send('To be deleted')];
                case 1:
                    sent = _b.sent();
                    sentId = sent.id;
                    return [4 /*yield*/, sent.delete()];
                case 2:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 3:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: user (TestUser)\n      Hello from user!\n      Actor helper message\n      --- from: assistant (TestBot)\n      Hello from bot!\n      Edited content\"\n    ");
                    return [4 /*yield*/, discord.channel(channelId).getMessages()];
                case 4:
                    messages = _b.sent();
                    found = messages.find(function (m) { return m.id === sentId; });
                    (0, vitest_1.expect)(found).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('reactions can be added via message.react', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, sent, _a, reactions;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    guild = client.guilds.cache.first();
                    channel = guild.channels.cache.find(function (c) { return c.name === 'general'; });
                    return [4 /*yield*/, channel.send('React to me')];
                case 1:
                    sent = _b.sent();
                    return [4 /*yield*/, sent.react('🔥')];
                case 2:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 3:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: user (TestUser)\n      Hello from user!\n      Actor helper message\n      --- from: assistant (TestBot)\n      Hello from bot!\n      Edited content\n      React to me\"\n    ");
                    return [4 /*yield*/, discord.prisma.reaction.findMany({
                            where: { messageId: sent.id },
                        })];
                case 4:
                    reactions = _b.sent();
                    (0, vitest_1.expect)(reactions).toHaveLength(1);
                    (0, vitest_1.expect)(reactions[0].emoji).toBe('🔥');
                    (0, vitest_1.expect)(reactions[0].userId).toBe(discord.botUserId);
                    return [2 /*return*/];
            }
        });
    }); });
});
