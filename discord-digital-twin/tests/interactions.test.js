"use strict";
// Phase 4 tests: interactions (slash commands, replies, deferred responses, follow-ups).
// Validates that discord.js Client can receive INTERACTION_CREATE events and
// respond via interaction callback, webhook follow-up, and edit endpoints.
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
(0, vitest_1.describe)('interactions', function () {
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
    (0, vitest_1.test)('simulateInteraction dispatches interactionCreate to client', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, id, interaction, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            resolve(i);
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.ApplicationCommand,
                            channelId: channelId,
                            userId: testUserId,
                            data: {
                                id: '1234567890',
                                name: 'test-command',
                                type: 1,
                            },
                        })];
                case 1:
                    id = (_b.sent()).id;
                    return [4 /*yield*/, received];
                case 2:
                    interaction = _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 3:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\"\"");
                    (0, vitest_1.expect)(interaction.id).toBe(id);
                    (0, vitest_1.expect)(interaction.type).toBe(discord_js_1.InteractionType.ApplicationCommand);
                    (0, vitest_1.expect)(interaction.isChatInputCommand()).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('user actor helper can run slash command and wait for ack', function () { return __awaiter(void 0, void 0, void 0, function () {
        var commandName, interactionHandled, interaction, response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    commandName = 'actor-ack-test';
                    interactionHandled = new Promise(function (resolve) {
                        client.once('interactionCreate', function (interaction) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!interaction.isChatInputCommand()) {
                                            return [2 /*return*/];
                                        }
                                        if (interaction.commandName !== commandName) {
                                            return [2 /*return*/];
                                        }
                                        return [4 /*yield*/, interaction.reply({ content: 'ack via actor' })];
                                    case 1:
                                        _a.sent();
                                        resolve();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    return [4 /*yield*/, discord.channel(channelId).user(testUserId).runSlashCommand({
                            name: commandName,
                        })];
                case 1:
                    interaction = _b.sent();
                    return [4 /*yield*/, discord.channel(channelId).waitForInteractionAck({
                            interactionId: interaction.id,
                        })];
                case 2:
                    response = _b.sent();
                    return [4 /*yield*/, interactionHandled];
                case 3:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 4:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\"\n    ");
                    (0, vitest_1.expect)(response.acknowledged).toBe(true);
                    (0, vitest_1.expect)(response.messageId).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('interaction.reply() creates a message via callback endpoint', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, id, interaction, response, _a, messages, replyMsg;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            if (i.isChatInputCommand()) {
                                resolve(i);
                            }
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.ApplicationCommand,
                            channelId: channelId,
                            userId: testUserId,
                            data: {
                                id: '1234567891',
                                name: 'reply-test',
                                type: 1,
                            },
                        })];
                case 1:
                    id = (_b.sent()).id;
                    return [4 /*yield*/, received];
                case 2:
                    interaction = _b.sent();
                    return [4 /*yield*/, interaction.reply({ content: 'Reply from bot' })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(channelId).getInteractionResponse(id)];
                case 4:
                    response = _b.sent();
                    (0, vitest_1.expect)(response).toBeDefined();
                    (0, vitest_1.expect)(response.acknowledged).toBe(true);
                    (0, vitest_1.expect)(response.messageId).toBeTruthy();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\n      Reply from bot\"\n    ");
                    return [4 /*yield*/, discord.channel(channelId).getMessages()];
                case 6:
                    messages = _b.sent();
                    replyMsg = messages.find(function (m) { return m.content === 'Reply from bot'; });
                    (0, vitest_1.expect)(replyMsg).toBeDefined();
                    (0, vitest_1.expect)(replyMsg.application_id).toBe(discord.botUserId);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('interaction.deferReply() + editReply() creates message on edit', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, id, interaction, ch, afterDefer, _a, afterEdit, messages, msg;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            if (i.isChatInputCommand()) {
                                resolve(i);
                            }
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.ApplicationCommand,
                            channelId: channelId,
                            userId: testUserId,
                            data: {
                                id: '1234567892',
                                name: 'defer-test',
                                type: 1,
                            },
                        })];
                case 1:
                    id = (_b.sent()).id;
                    return [4 /*yield*/, received];
                case 2:
                    interaction = _b.sent();
                    return [4 /*yield*/, interaction.deferReply()
                        // After deferring, interaction is acknowledged but no message yet
                    ];
                case 3:
                    _b.sent();
                    ch = discord.channel(channelId);
                    return [4 /*yield*/, ch.getInteractionResponse(id)];
                case 4:
                    afterDefer = _b.sent();
                    (0, vitest_1.expect)(afterDefer.acknowledged).toBe(true);
                    (0, vitest_1.expect)(afterDefer.messageId).toBeNull();
                    return [4 /*yield*/, interaction.editReply({ content: 'Deferred then edited' })
                        // After editReply, message should exist
                    ];
                case 5:
                    _b.sent();
                    // After editReply, message should exist
                    _a = vitest_1.expect;
                    return [4 /*yield*/, ch.text()];
                case 6:
                    // After editReply, message should exist
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\n      Reply from bot\n      Deferred then edited\"\n    ");
                    return [4 /*yield*/, ch.getInteractionResponse(id)];
                case 7:
                    afterEdit = _b.sent();
                    (0, vitest_1.expect)(afterEdit.messageId).toBeTruthy();
                    return [4 /*yield*/, ch.getMessages()];
                case 8:
                    messages = _b.sent();
                    msg = messages.find(function (m) { return m.content === 'Deferred then edited'; });
                    (0, vitest_1.expect)(msg).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('interaction.deleteReply() removes the message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, interaction, reply, _a, messages, found;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            if (i.isChatInputCommand()) {
                                resolve(i);
                            }
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.ApplicationCommand,
                            channelId: channelId,
                            userId: testUserId,
                            data: {
                                id: '1234567893',
                                name: 'delete-test',
                                type: 1,
                            },
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, received];
                case 2:
                    interaction = _b.sent();
                    return [4 /*yield*/, interaction.reply({ content: 'To be deleted' })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, interaction.fetchReply()];
                case 4:
                    reply = _b.sent();
                    (0, vitest_1.expect)(reply.content).toBe('To be deleted');
                    return [4 /*yield*/, interaction.deleteReply()];
                case 5:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 6:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\n      Reply from bot\n      Deferred then edited\"\n    ");
                    return [4 /*yield*/, discord.channel(channelId).getMessages()];
                case 7:
                    messages = _b.sent();
                    found = messages.find(function (m) { return m.id === reply.id; });
                    (0, vitest_1.expect)(found).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('interaction.followUp() creates an additional message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, interaction, followUp, _a, messages;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            if (i.isChatInputCommand()) {
                                resolve(i);
                            }
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.ApplicationCommand,
                            channelId: channelId,
                            userId: testUserId,
                            data: {
                                id: '1234567894',
                                name: 'followup-test',
                                type: 1,
                            },
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, received];
                case 2:
                    interaction = _b.sent();
                    return [4 /*yield*/, interaction.reply({ content: 'Initial reply' })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, interaction.followUp({
                            content: 'Follow-up message',
                        })];
                case 4:
                    followUp = _b.sent();
                    (0, vitest_1.expect)(followUp.content).toBe('Follow-up message');
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\n      Reply from bot\n      Deferred then edited\n      Initial reply\n      Follow-up message\"\n    ");
                    return [4 /*yield*/, discord.channel(channelId).getMessages()];
                case 6:
                    messages = _b.sent();
                    (0, vitest_1.expect)(messages.some(function (m) { return m.content === 'Initial reply'; })).toBe(true);
                    (0, vitest_1.expect)(messages.some(function (m) { return m.content === 'Follow-up message'; })).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('interaction.fetchReply() returns the original reply', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, interaction, fetched, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            if (i.isChatInputCommand()) {
                                resolve(i);
                            }
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.ApplicationCommand,
                            channelId: channelId,
                            userId: testUserId,
                            data: {
                                id: '1234567895',
                                name: 'fetch-test',
                                type: 1,
                            },
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, received];
                case 2:
                    interaction = _b.sent();
                    return [4 /*yield*/, interaction.reply({ content: 'Fetch this reply' })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, interaction.fetchReply()];
                case 4:
                    fetched = _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\n      Reply from bot\n      Deferred then edited\n      Initial reply\n      Follow-up message\n      Fetch this reply\"\n    ");
                    (0, vitest_1.expect)(fetched.content).toBe('Fetch this reply');
                    (0, vitest_1.expect)(fetched.author.id).toBe(discord.botUserId);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('double reply is guarded by discord.js (interaction.replied = true)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, interaction, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            if (i.isChatInputCommand()) {
                                resolve(i);
                            }
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.ApplicationCommand,
                            channelId: channelId,
                            userId: testUserId,
                            data: {
                                id: '1234567896',
                                name: 'double-reply-test',
                                type: 1,
                            },
                        })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, received];
                case 2:
                    interaction = _b.sent();
                    return [4 /*yield*/, interaction.reply({ content: 'First reply' })
                        // discord.js guards against double reply client-side
                    ];
                case 3:
                    _b.sent();
                    // discord.js guards against double reply client-side
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 4:
                    // discord.js guards against double reply client-side
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\n      Reply from bot\n      Deferred then edited\n      Initial reply\n      Follow-up message\n      Fetch this reply\n      First reply\"\n    ");
                    (0, vitest_1.expect)(interaction.replied).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('editReply() edits existing message content', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, id, interaction, _a, response, messages, msg;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            if (i.isChatInputCommand()) {
                                resolve(i);
                            }
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.ApplicationCommand,
                            channelId: channelId,
                            userId: testUserId,
                            data: {
                                id: '1234567897',
                                name: 'edit-existing-test',
                                type: 1,
                            },
                        })];
                case 1:
                    id = (_b.sent()).id;
                    return [4 /*yield*/, received];
                case 2:
                    interaction = _b.sent();
                    return [4 /*yield*/, interaction.reply({ content: 'Original reply' })];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, interaction.editReply({ content: 'Edited reply' })];
                case 4:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\n      Reply from bot\n      Deferred then edited\n      Initial reply\n      Follow-up message\n      Fetch this reply\n      First reply\n      Edited reply\"\n    ");
                    return [4 /*yield*/, discord.channel(channelId).getInteractionResponse(id)];
                case 6:
                    response = _b.sent();
                    return [4 /*yield*/, discord.channel(channelId).getMessages()];
                case 7:
                    messages = _b.sent();
                    msg = messages.find(function (m) { return m.id === response.messageId; });
                    (0, vitest_1.expect)(msg === null || msg === void 0 ? void 0 : msg.content).toBe('Edited reply');
                    (0, vitest_1.expect)(msg === null || msg === void 0 ? void 0 : msg.edited_timestamp).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('editReply() twice correctly updates the message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, id, interaction, response, messages, msg, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            if (i.isChatInputCommand()) {
                                resolve(i);
                            }
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.ApplicationCommand,
                            channelId: channelId,
                            userId: testUserId,
                            data: {
                                id: '1234567898',
                                name: 'double-edit-test',
                                type: 1,
                            },
                        })];
                case 1:
                    id = (_b.sent()).id;
                    return [4 /*yield*/, received];
                case 2:
                    interaction = _b.sent();
                    return [4 /*yield*/, interaction.deferReply()
                        // First edit creates the message
                    ];
                case 3:
                    _b.sent();
                    // First edit creates the message
                    return [4 /*yield*/, interaction.editReply({ content: 'First edit' })
                        // Second edit changes ONLY embeds
                    ];
                case 4:
                    // First edit creates the message
                    _b.sent();
                    // Second edit changes ONLY embeds
                    return [4 /*yield*/, interaction.editReply({ embeds: [{ title: 'Test Embed' }] })];
                case 5:
                    // Second edit changes ONLY embeds
                    _b.sent();
                    return [4 /*yield*/, discord.channel(channelId).getInteractionResponse(id)];
                case 6:
                    response = _b.sent();
                    return [4 /*yield*/, discord.channel(channelId).getMessages()];
                case 7:
                    messages = _b.sent();
                    msg = messages.find(function (m) { return m.id === response.messageId; });
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 8:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\n      Reply from bot\n      Deferred then edited\n      Initial reply\n      Follow-up message\n      Fetch this reply\n      First reply\n      Edited reply\n      First edit\n      [embed: \"Test Embed\"]\"\n    ");
                    (0, vitest_1.expect)(msg === null || msg === void 0 ? void 0 : msg.content).toBe('First edit');
                    (0, vitest_1.expect)(msg.embeds.length).toBe(1);
                    (0, vitest_1.expect)(msg.embeds[0].title).toBe('Test Embed');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('UpdateMessage component interaction updates the original message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channel, targetMsg, received, id, interaction, _a, response, messages, msg;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    channel = client.channels.cache.get(channelId);
                    return [4 /*yield*/, channel.send({ content: 'Target message' })];
                case 1:
                    targetMsg = _b.sent();
                    (0, vitest_1.expect)(targetMsg).toBeDefined();
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            if (i.isButton()) {
                                resolve(i);
                            }
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.MessageComponent,
                            channelId: channelId,
                            userId: testUserId,
                            messageId: targetMsg.id,
                            data: {
                                custom_id: 'test-button',
                                component_type: 2,
                            },
                        })];
                case 2:
                    id = (_b.sent()).id;
                    return [4 /*yield*/, received];
                case 3:
                    interaction = _b.sent();
                    return [4 /*yield*/, interaction.update({ content: 'Updated by component' })];
                case 4:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 5:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\n      Reply from bot\n      Deferred then edited\n      Initial reply\n      Follow-up message\n      Fetch this reply\n      First reply\n      Edited reply\n      First edit\n      [embed: \"Test Embed\"]\n      Updated by component\"\n    ");
                    return [4 /*yield*/, discord.channel(channelId).getInteractionResponse(id)];
                case 6:
                    response = _b.sent();
                    (0, vitest_1.expect)(response.messageId).toBe(targetMsg.id);
                    return [4 /*yield*/, discord.channel(channelId).getMessages()];
                case 7:
                    messages = _b.sent();
                    msg = messages.find(function (m) { return m.id === targetMsg.id; });
                    (0, vitest_1.expect)(msg === null || msg === void 0 ? void 0 : msg.content).toBe('Updated by component');
                    (0, vitest_1.expect)(msg === null || msg === void 0 ? void 0 : msg.edited_timestamp).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('deferUpdate() followed by editReply() updates the original message', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channel, targetMsg, received, id, interaction, _a, response, messages, msg;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    channel = client.channels.cache.get(channelId);
                    return [4 /*yield*/, channel.send({ content: 'Message for deferUpdate' })];
                case 1:
                    targetMsg = _b.sent();
                    received = new Promise(function (resolve) {
                        client.once('interactionCreate', function (i) {
                            if (i.isButton()) {
                                resolve(i);
                            }
                        });
                    });
                    return [4 /*yield*/, discord.simulateInteraction({
                            type: discord_js_1.InteractionType.MessageComponent,
                            channelId: channelId,
                            userId: testUserId,
                            messageId: targetMsg.id,
                            data: {
                                custom_id: 'defer-update-button',
                                component_type: 2,
                            },
                        })];
                case 2:
                    id = (_b.sent()).id;
                    return [4 /*yield*/, received];
                case 3:
                    interaction = _b.sent();
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, interaction.editReply({ content: 'Edited after deferUpdate' })];
                case 5:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 6:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      ack via actor\n      Reply from bot\n      Deferred then edited\n      Initial reply\n      Follow-up message\n      Fetch this reply\n      First reply\n      Edited reply\n      First edit\n      [embed: \"Test Embed\"]\n      Updated by component\n      Edited after deferUpdate\"\n    ");
                    return [4 /*yield*/, discord.channel(channelId).getInteractionResponse(id)];
                case 7:
                    response = _b.sent();
                    (0, vitest_1.expect)(response.messageId).toBe(targetMsg.id);
                    return [4 /*yield*/, discord.channel(channelId).getMessages()];
                case 8:
                    messages = _b.sent();
                    msg = messages.find(function (m) { return m.id === targetMsg.id; });
                    (0, vitest_1.expect)(msg === null || msg === void 0 ? void 0 : msg.content).toBe('Edited after deferUpdate');
                    (0, vitest_1.expect)(msg === null || msg === void 0 ? void 0 : msg.edited_timestamp).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
});
