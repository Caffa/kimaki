"use strict";
// SDK compatibility test: validates that a real discord.js Client can
// connect to the DigitalDiscord server, complete the Gateway handshake,
// and see the seeded guild/channels.
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
(0, vitest_1.describe)('discord.js SDK compatibility', function () {
    var discord;
    var client;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    discord = new index_js_1.DigitalDiscord({
                        guild: { name: 'Test Server' },
                        channels: [
                            {
                                name: 'general',
                                type: discord_js_1.ChannelType.GuildText,
                                topic: 'kimaki:/tmp/test-project',
                            },
                        ],
                        users: [{ username: 'TestUser' }],
                    });
                    return [4 /*yield*/, discord.start()];
                case 1:
                    _a.sent();
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
                    return [4 /*yield*/, client.login(discord.botToken)
                        // Wait for READY + GUILD_CREATE to be processed
                    ];
                case 2:
                    _a.sent();
                    // Wait for READY + GUILD_CREATE to be processed
                    return [4 /*yield*/, new Promise(function (resolve) {
                            if (client.isReady()) {
                                resolve();
                                return;
                            }
                            client.once('ready', function () {
                                resolve();
                            });
                        })];
                case 3:
                    // Wait for READY + GUILD_CREATE to be processed
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
    (0, vitest_1.test)('client is ready', function () {
        (0, vitest_1.expect)(client.isReady()).toBe(true);
    });
    (0, vitest_1.test)('client user is the bot', function () {
        var _a, _b;
        (0, vitest_1.expect)((_a = client.user) === null || _a === void 0 ? void 0 : _a.username).toBe('TestBot');
        (0, vitest_1.expect)((_b = client.user) === null || _b === void 0 ? void 0 : _b.bot).toBe(true);
    });
    (0, vitest_1.test)('client sees one guild', function () {
        (0, vitest_1.expect)(client.guilds.cache.size).toBe(1);
        var guild = client.guilds.cache.first();
        (0, vitest_1.expect)(guild === null || guild === void 0 ? void 0 : guild.name).toBe('Test Server');
    });
    (0, vitest_1.test)('guild has the general channel', function () {
        var guild = client.guilds.cache.first();
        var channel = guild === null || guild === void 0 ? void 0 : guild.channels.cache.find(function (c) { return c.name === 'general'; });
        (0, vitest_1.expect)(channel).toBeDefined();
        (0, vitest_1.expect)(channel === null || channel === void 0 ? void 0 : channel.type).toBe(discord_js_1.ChannelType.GuildText);
    });
    (0, vitest_1.test)('guild has @everyone role', function () {
        var guild = client.guilds.cache.first();
        var everyoneRole = guild === null || guild === void 0 ? void 0 : guild.roles.cache.find(function (r) { return r.name === '@everyone'; });
        (0, vitest_1.expect)(everyoneRole).toBeDefined();
    });
    (0, vitest_1.test)('bot user ID matches', function () {
        var _a;
        (0, vitest_1.expect)((_a = client.user) === null || _a === void 0 ? void 0 : _a.id).toBe(discord.botUserId);
    });
});
