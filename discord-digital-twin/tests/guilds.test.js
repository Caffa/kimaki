"use strict";
// Phase 5 tests: guild routes (channels, roles, members, active threads).
// Validates that discord.js managers can call guild REST endpoints against
// the DigitalDiscord server and that gateway updates stay in sync.
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
var discord_js_1 = require("discord.js");
var index_js_1 = require("../src/index.js");
(0, vitest_1.describe)('guild management routes', function () {
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
                                topic: 'phase-5-test',
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
                            discord_js_1.GatewayIntentBits.GuildMembers,
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
    (0, vitest_1.test)('guild fetch route returns seeded guild', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.guilds.fetch(discord.guildId)];
                case 1:
                    guild = _a.sent();
                    (0, vitest_1.expect)(guild.id).toBe(discord.guildId);
                    (0, vitest_1.expect)(guild.name).toBe('Test Server');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('guild channels list and create route work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, existing, existingNames, channelCreateEvent, created, emittedChannel, dbChannel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.guilds.fetch(discord.guildId)];
                case 1:
                    guild = _a.sent();
                    return [4 /*yield*/, guild.channels.fetch()];
                case 2:
                    existing = _a.sent();
                    existingNames = __spreadArray([], existing.values(), true).map(function (channel) {
                        return channel === null || channel === void 0 ? void 0 : channel.name;
                    });
                    (0, vitest_1.expect)(existingNames).toContain('general');
                    channelCreateEvent = new Promise(function (resolve) {
                        client.once('channelCreate', function (channel) {
                            resolve(channel);
                        });
                    });
                    return [4 /*yield*/, guild.channels.create({
                            name: 'phase5-created-channel',
                            type: discord_js_1.ChannelType.GuildText,
                            topic: 'created by phase 5 test',
                        })];
                case 3:
                    created = _a.sent();
                    return [4 /*yield*/, channelCreateEvent];
                case 4:
                    emittedChannel = _a.sent();
                    (0, vitest_1.expect)(emittedChannel.id).toBe(created.id);
                    return [4 /*yield*/, discord.prisma.channel.findUnique({
                            where: { id: created.id },
                        })];
                case 5:
                    dbChannel = _a.sent();
                    (0, vitest_1.expect)(dbChannel === null || dbChannel === void 0 ? void 0 : dbChannel.name).toBe('phase5-created-channel');
                    (0, vitest_1.expect)(dbChannel === null || dbChannel === void 0 ? void 0 : dbChannel.guildId).toBe(discord.guildId);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('guild roles list/create/update routes work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, roles, roleNames, roleCreateEvent, role, createdRole, roleUpdateEvent, updatedRole, emittedUpdatedRole, dbRole;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.guilds.fetch(discord.guildId)];
                case 1:
                    guild = _a.sent();
                    return [4 /*yield*/, guild.roles.fetch()];
                case 2:
                    roles = _a.sent();
                    roleNames = __spreadArray([], roles.values(), true).map(function (role) {
                        return role.name;
                    });
                    (0, vitest_1.expect)(roleNames).toContain('@everyone');
                    roleCreateEvent = new Promise(function (resolve) {
                        client.once('roleCreate', function (role) {
                            resolve(role);
                        });
                    });
                    return [4 /*yield*/, guild.roles.create({ name: 'phase5-role' })];
                case 3:
                    role = _a.sent();
                    return [4 /*yield*/, roleCreateEvent];
                case 4:
                    createdRole = _a.sent();
                    (0, vitest_1.expect)(createdRole.id).toBe(role.id);
                    roleUpdateEvent = new Promise(function (resolve) {
                        client.once('roleUpdate', function (_oldRole, newRole) {
                            resolve(newRole);
                        });
                    });
                    return [4 /*yield*/, role.edit({
                            name: 'phase5-role-updated',
                            mentionable: true,
                        })];
                case 5:
                    updatedRole = _a.sent();
                    return [4 /*yield*/, roleUpdateEvent];
                case 6:
                    emittedUpdatedRole = _a.sent();
                    (0, vitest_1.expect)(emittedUpdatedRole.id).toBe(updatedRole.id);
                    (0, vitest_1.expect)(emittedUpdatedRole.name).toBe('phase5-role-updated');
                    return [4 /*yield*/, discord.prisma.role.findUnique({ where: { id: role.id } })];
                case 7:
                    dbRole = _a.sent();
                    (0, vitest_1.expect)(dbRole === null || dbRole === void 0 ? void 0 : dbRole.name).toBe('phase5-role-updated');
                    (0, vitest_1.expect)(dbRole === null || dbRole === void 0 ? void 0 : dbRole.mentionable).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('guild members list/search/get routes work', function () { return __awaiter(void 0, void 0, void 0, function () {
        var listResponse, listMembers, listIds, searchResponse, searchMembers, searchIds, singleResponse, singleMember;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(discord.restUrl, "/v10/guilds/").concat(discord.guildId, "/members?limit=10"))];
                case 1:
                    listResponse = _a.sent();
                    (0, vitest_1.expect)(listResponse.status).toBe(200);
                    return [4 /*yield*/, listResponse.json()];
                case 2:
                    listMembers = (_a.sent());
                    listIds = listMembers.map(function (member) {
                        return member.user.id;
                    });
                    (0, vitest_1.expect)(listIds).toContain(testUserId);
                    return [4 /*yield*/, fetch("".concat(discord.restUrl, "/v10/guilds/").concat(discord.guildId, "/members/search?query=Test&limit=10"))];
                case 3:
                    searchResponse = _a.sent();
                    (0, vitest_1.expect)(searchResponse.status).toBe(200);
                    return [4 /*yield*/, searchResponse.json()];
                case 4:
                    searchMembers = (_a.sent());
                    searchIds = searchMembers.map(function (member) {
                        return member.user.id;
                    });
                    (0, vitest_1.expect)(searchIds).toContain(testUserId);
                    return [4 /*yield*/, fetch("".concat(discord.restUrl, "/v10/guilds/").concat(discord.guildId, "/members/").concat(testUserId))];
                case 5:
                    singleResponse = _a.sent();
                    (0, vitest_1.expect)(singleResponse.status).toBe(200);
                    return [4 /*yield*/, singleResponse.json()];
                case 6:
                    singleMember = (_a.sent());
                    (0, vitest_1.expect)(singleMember.user.id).toBe(testUserId);
                    (0, vitest_1.expect)(singleMember.user.username).toBe('TestUser');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('guild active threads route returns active thread list', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, starter, thread, _a, activeThreads;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, client.guilds.fetch(discord.guildId)];
                case 1:
                    guild = _c.sent();
                    return [4 /*yield*/, guild.channels.fetch(channelId)];
                case 2:
                    channel = (_c.sent());
                    return [4 /*yield*/, channel.send('phase5 active thread starter')];
                case 3:
                    starter = _c.sent();
                    return [4 /*yield*/, starter.startThread({
                            name: 'phase5-active-thread',
                            autoArchiveDuration: 1440,
                        })];
                case 4:
                    thread = _c.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.channel(channelId).text()];
                case 5:
                    _a.apply(void 0, [_c.sent()]).toMatchInlineSnapshot("\n      \"--- from: assistant (TestBot)\n      phase5 active thread starter\"\n    ");
                    return [4 /*yield*/, guild.channels.fetchActiveThreads()];
                case 6:
                    activeThreads = _c.sent();
                    (0, vitest_1.expect)(activeThreads.threads.has(thread.id)).toBe(true);
                    (0, vitest_1.expect)((_b = activeThreads.threads.get(thread.id)) === null || _b === void 0 ? void 0 : _b.name).toBe('phase5-active-thread');
                    return [2 /*return*/];
            }
        });
    }); });
});
