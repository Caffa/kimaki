"use strict";
// Phase 3 tests: channels, threads, thread members, archiving.
// Validates that discord.js Client can create threads, send messages in them,
// archive them, and manage thread members through the DigitalDiscord server.
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
(0, vitest_1.describe)('threads and channels', function () {
    var discord;
    var client;
    var channelId;
    var testUserId;
    var createdThreadId;
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
                    return [4 /*yield*/, discord.start()];
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
                            discord_js_1.GatewayIntentBits.GuildMessages,
                            discord_js_1.GatewayIntentBits.MessageContent,
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
    (0, vitest_1.test)('GET channel returns channel data', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, discord.channel(channelId).getChannel()];
                case 1:
                    channel = _a.sent();
                    (0, vitest_1.expect)(channel).toBeDefined();
                    (0, vitest_1.expect)(channel.name).toBe('general');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('create thread from message via startThread()', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, message, threadCreatePromise, thread, _a, dbThread, createdThread;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    guild = client.guilds.cache.first();
                    channel = guild.channels.cache.find(function (c) { return c.name === 'general'; });
                    return [4 /*yield*/, channel.send('Thread starter message')];
                case 1:
                    message = _b.sent();
                    threadCreatePromise = new Promise(function (resolve) {
                        client.once('threadCreate', function (thread) {
                            resolve(thread);
                        });
                    });
                    return [4 /*yield*/, message.startThread({
                            name: 'test-thread',
                            autoArchiveDuration: 1440,
                        })];
                case 2:
                    thread = _b.sent();
                    createdThreadId = thread.id;
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 3:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      Thread starter message\"\n    ");
                    (0, vitest_1.expect)(thread.name).toBe('test-thread');
                    (0, vitest_1.expect)(thread.parentId).toBe(channelId);
                    (0, vitest_1.expect)(thread.type).toBe(discord_js_1.ChannelType.PublicThread);
                    return [4 /*yield*/, discord.prisma.channel.findUnique({
                            where: { id: thread.id },
                        })];
                case 4:
                    dbThread = _b.sent();
                    (0, vitest_1.expect)(dbThread).toBeDefined();
                    (0, vitest_1.expect)(dbThread.name).toBe('test-thread');
                    (0, vitest_1.expect)(dbThread.type).toBe(discord_js_1.ChannelType.PublicThread);
                    (0, vitest_1.expect)(dbThread.parentId).toBe(channelId);
                    return [4 /*yield*/, threadCreatePromise];
                case 5:
                    createdThread = _b.sent();
                    (0, vitest_1.expect)(createdThread.id).toBe(thread.id);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('send message in thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, sent, _a, messages;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    thread = client.channels.cache.get(createdThreadId);
                    return [4 /*yield*/, thread.send('Message in thread')];
                case 1:
                    sent = _b.sent();
                    (0, vitest_1.expect)(sent.content).toBe('Message in thread');
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(createdThreadId).text()];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      Thread starter message\n      Message in thread\"\n    ");
                    return [4 /*yield*/, discord.thread(createdThreadId).getMessages()];
                case 3:
                    messages = _b.sent();
                    (0, vitest_1.expect)(messages.some(function (m) { return m.content === 'Message in thread'; })).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('archive thread via setArchived(true)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, archived, dbThread;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    thread = client.channels.cache.get(createdThreadId);
                    return [4 /*yield*/, thread.setArchived(true)];
                case 1:
                    archived = _a.sent();
                    (0, vitest_1.expect)(archived.archived).toBe(true);
                    return [4 /*yield*/, discord.prisma.channel.findUniqueOrThrow({
                            where: { id: createdThreadId },
                        })];
                case 2:
                    dbThread = _a.sent();
                    (0, vitest_1.expect)(dbThread.archived).toBe(true);
                    (0, vitest_1.expect)(dbThread.archiveTimestamp).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('unarchive and add thread member', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, members;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    thread = client.channels.cache.get(createdThreadId);
                    // Unarchive first so we can modify the thread
                    return [4 /*yield*/, thread.setArchived(false)];
                case 1:
                    // Unarchive first so we can modify the thread
                    _a.sent();
                    return [4 /*yield*/, thread.members.add(testUserId)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, discord.prisma.threadMember.findMany({
                            where: { channelId: createdThreadId },
                        })
                        // Bot (auto-added at creation) + TestUser
                    ];
                case 3:
                    members = _a.sent();
                    // Bot (auto-added at creation) + TestUser
                    (0, vitest_1.expect)(members).toHaveLength(2);
                    (0, vitest_1.expect)(members.some(function (m) { return m.userId === testUserId; })).toBe(true);
                    (0, vitest_1.expect)(members.some(function (m) { return m.userId === discord.botUserId; })).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('create standalone thread via channel.threads.create()', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, thread, dbThread;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    guild = client.guilds.cache.first();
                    channel = guild.channels.cache.find(function (c) { return c.name === 'general'; });
                    return [4 /*yield*/, channel.threads.create({
                            name: 'standalone-thread',
                            autoArchiveDuration: 1440,
                            type: discord_js_1.ChannelType.PublicThread,
                        })];
                case 1:
                    thread = _a.sent();
                    (0, vitest_1.expect)(thread.name).toBe('standalone-thread');
                    (0, vitest_1.expect)(thread.parentId).toBe(channelId);
                    return [4 /*yield*/, discord.prisma.channel.findUnique({
                            where: { id: thread.id },
                        })];
                case 2:
                    dbThread = _a.sent();
                    (0, vitest_1.expect)(dbThread).toBeDefined();
                    (0, vitest_1.expect)(dbThread.name).toBe('standalone-thread');
                    (0, vitest_1.expect)(dbThread.type).toBe(discord_js_1.ChannelType.PublicThread);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('getThreads returns threads for parent channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var threads, names;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, discord.channel(channelId).getThreads()];
                case 1:
                    threads = _a.sent();
                    (0, vitest_1.expect)(threads.length).toBeGreaterThanOrEqual(2);
                    names = threads.map(function (t) { return t.name; });
                    (0, vitest_1.expect)(names).toContain('test-thread');
                    (0, vitest_1.expect)(names).toContain('standalone-thread');
                    return [2 /*return*/];
            }
        });
    }); });
});
