"use strict";
// DigitalDiscord - Local Discord API test server.
// Creates a fake Discord server (REST + Gateway WebSocket) that discord.js
// can connect to. Used for automated testing of the Kimaki bot without
// hitting real Discord.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.generateSnowflake = exports.DiscordGateway = exports.ScopedUserActor = exports.ChannelScope = exports.DigitalDiscord = void 0;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var v10_1 = require("discord-api-types/v10");
var db_js_1 = require("./db.js");
var snowflake_js_1 = require("./snowflake.js");
var server_js_1 = require("./server.js");
var serializers_js_1 = require("./serializers.js");
var MAX_VITEST_WAIT_TIMEOUT_MS = 10000;
function normalizeWaitTimeout(timeout) {
    if (process.env['KIMAKI_VITEST'] === '1') {
        return Math.min(timeout, MAX_VITEST_WAIT_TIMEOUT_MS);
    }
    return timeout;
}
function compareSnowflakeDesc(a, b) {
    try {
        var aSnowflake = BigInt(a);
        var bSnowflake = BigInt(b);
        if (aSnowflake > bSnowflake) {
            return -1;
        }
        if (aSnowflake < bSnowflake) {
            return 1;
        }
        return 0;
    }
    catch (_a) {
        return b.localeCompare(a);
    }
}
var DigitalDiscord = /** @class */ (function () {
    function DigitalDiscord(options) {
        if (options === void 0) { options = {}; }
        var _a, _b, _c, _d, _e, _f;
        this.server = null;
        this.seeded = false;
        this.interactionEvents = [];
        this.options = options;
        this.prisma = (0, db_js_1.createPrismaClient)(options.dbUrl);
        this.botToken = (_a = options.botToken) !== null && _a !== void 0 ? _a : 'fake-bot-token';
        this.botUserId = (_c = (_b = options.botUser) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : (0, snowflake_js_1.generateSnowflake)();
        if (options.guilds && options.guilds.length > 0) {
            this.guildIds = options.guilds.map(function (g) { var _a; return (_a = g.id) !== null && _a !== void 0 ? _a : (0, snowflake_js_1.generateSnowflake)(); });
            this.guildId = (_d = this.guildIds[0]) !== null && _d !== void 0 ? _d : (0, snowflake_js_1.generateSnowflake)();
        }
        else {
            this.guildId = (_f = (_e = options.guild) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : (0, snowflake_js_1.generateSnowflake)();
            this.guildIds = [this.guildId];
        }
    }
    Object.defineProperty(DigitalDiscord.prototype, "port", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this.server) === null || _a === void 0 ? void 0 : _a.port) !== null && _b !== void 0 ? _b : 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DigitalDiscord.prototype, "restUrl", {
        get: function () {
            return "http://127.0.0.1:".concat(this.port, "/api");
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DigitalDiscord.prototype, "gatewayUrl", {
        get: function () {
            return "ws://127.0.0.1:".concat(this.port, "/gateway");
        },
        enumerable: false,
        configurable: true
    });
    DigitalDiscord.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var port;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL')
                            // Apply migrations by pushing schema to in-memory DB
                            // For libsql :memory:, we use Prisma's $executeRawUnsafe with the schema SQL
                        ];
                    case 2:
                        _a.sent();
                        // Apply migrations by pushing schema to in-memory DB
                        // For libsql :memory:, we use Prisma's $executeRawUnsafe with the schema SQL
                        return [4 /*yield*/, this.applySchema()];
                    case 3:
                        // Apply migrations by pushing schema to in-memory DB
                        // For libsql :memory:, we use Prisma's $executeRawUnsafe with the schema SQL
                        _a.sent();
                        if (!!this.seeded) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.seed()];
                    case 4:
                        _a.sent();
                        this.seeded = true;
                        _a.label = 5;
                    case 5:
                        this.server = (0, server_js_1.createServer)({
                            prisma: this.prisma,
                            botUserId: this.botUserId,
                            botToken: this.botToken,
                            loadGatewayState: function () { return _this.loadGatewayState(); },
                            gatewayUrlOverride: this.options.gatewayUrlOverride,
                        });
                        return [4 /*yield*/, (0, server_js_1.startServer)(this.server)];
                    case 6:
                        port = _a.sent();
                        this.server.port = port;
                        return [2 /*return*/];
                }
            });
        });
    };
    DigitalDiscord.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.server) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, server_js_1.stopServer)(this.server)];
                    case 1:
                        _a.sent();
                        this.server = null;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // --- Scoped accessors ---
    DigitalDiscord.prototype.channel = function (channelId) {
        return new ChannelScope({ discord: this, channelId: channelId });
    };
    DigitalDiscord.prototype.thread = function (threadId) {
        return new ChannelScope({ discord: this, channelId: threadId });
    };
    // --- State queries ---
    DigitalDiscord.prototype.getFirstNonBotUserId = function () {
        return __awaiter(this, void 0, void 0, function () {
            var firstUser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.user.findFirst({
                            where: { bot: false },
                            orderBy: { id: 'asc' },
                        })];
                    case 1:
                        firstUser = _a.sent();
                        if (!firstUser) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, firstUser.id];
                }
            });
        });
    };
    DigitalDiscord.prototype.getTypingEvents = function (_a) {
        var _b = _a === void 0 ? {} : _a, channelId = _b.channelId;
        if (!this.server) {
            throw new Error('Server not started');
        }
        var allEvents = this.server.typingEvents;
        if (!channelId) {
            return __spreadArray([], allEvents, true);
        }
        return allEvents.filter(function (event) {
            return event.channelId === channelId;
        });
    };
    DigitalDiscord.prototype.clearTypingEvents = function (_a) {
        var _b;
        var _c = _a === void 0 ? {} : _a, channelId = _c.channelId;
        if (!this.server) {
            throw new Error('Server not started');
        }
        if (!channelId) {
            this.server.typingEvents.splice(0, this.server.typingEvents.length);
            return;
        }
        var filtered = this.server.typingEvents.filter(function (event) {
            return event.channelId !== channelId;
        });
        (_b = this.server.typingEvents).splice.apply(_b, __spreadArray([0, this.server.typingEvents.length], filtered, false));
    };
    DigitalDiscord.prototype.getInteractionEvents = function (_a) {
        var _b = _a === void 0 ? {} : _a, channelId = _b.channelId;
        if (!channelId) {
            return __spreadArray([], this.interactionEvents, true);
        }
        return this.interactionEvents.filter(function (event) {
            return event.channelId === channelId;
        });
    };
    DigitalDiscord.prototype.clearInteractionEvents = function (_a) {
        var _b;
        var _c = _a === void 0 ? {} : _a, channelId = _c.channelId;
        if (!channelId) {
            this.interactionEvents.splice(0, this.interactionEvents.length);
            return;
        }
        var filtered = this.interactionEvents.filter(function (event) {
            return event.channelId !== channelId;
        });
        (_b = this.interactionEvents).splice.apply(_b, __spreadArray([0, this.interactionEvents.length], filtered, false));
    };
    // --- Test utilities ---
    DigitalDiscord.prototype.simulateUserMessage = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var messageId, dbMessage, author, channel, guildId, member, _c, apiMessage;
            var _d;
            var channelId = _b.channelId, userId = _b.userId, content = _b.content, embeds = _b.embeds, attachments = _b.attachments, messageReference = _b.messageReference;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!this.server) {
                            throw new Error('Server not started');
                        }
                        messageId = (0, snowflake_js_1.generateSnowflake)();
                        return [4 /*yield*/, this.prisma.message.create({
                                data: {
                                    id: messageId,
                                    channelId: channelId,
                                    authorId: userId,
                                    content: content,
                                    embeds: JSON.stringify(embeds !== null && embeds !== void 0 ? embeds : []),
                                    attachments: JSON.stringify(attachments !== null && attachments !== void 0 ? attachments : []),
                                    messageReference: messageReference
                                        ? JSON.stringify(messageReference)
                                        : null,
                                },
                            })];
                    case 1:
                        _e.sent();
                        return [4 /*yield*/, this.prisma.channel.update({
                                where: { id: channelId },
                                data: {
                                    lastMessageId: messageId,
                                    messageCount: { increment: 1 },
                                    totalMessageSent: { increment: 1 },
                                },
                            })];
                    case 2:
                        _e.sent();
                        return [4 /*yield*/, this.prisma.message.findUniqueOrThrow({
                                where: { id: messageId },
                            })];
                    case 3:
                        dbMessage = _e.sent();
                        return [4 /*yield*/, this.prisma.user.findUniqueOrThrow({
                                where: { id: userId },
                            })];
                    case 4:
                        author = _e.sent();
                        return [4 /*yield*/, this.prisma.channel.findUnique({
                                where: { id: channelId },
                            })];
                    case 5:
                        channel = _e.sent();
                        guildId = (_d = channel === null || channel === void 0 ? void 0 : channel.guildId) !== null && _d !== void 0 ? _d : undefined;
                        if (!guildId) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.prisma.guildMember.findUnique({
                                where: { guildId_userId: { guildId: guildId, userId: userId } },
                                include: { user: true },
                            })];
                    case 6:
                        _c = _e.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        _c = null;
                        _e.label = 8;
                    case 8:
                        member = _c;
                        apiMessage = (0, serializers_js_1.messageToAPI)(dbMessage, author, guildId, member !== null && member !== void 0 ? member : undefined);
                        this.server.gateway.broadcastMessageCreate(apiMessage, guildId !== null && guildId !== void 0 ? guildId : '');
                        return [2 /*return*/, apiMessage];
                }
            });
        });
    };
    DigitalDiscord.prototype.simulateInteraction = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var interactionId, interactionToken, resolvedGuildId, user, member, channel, messageData, msg, msgAuthor, msgMember, _c, componentType, values, interactionPayload;
            var _d, _e;
            var type = _b.type, channelId = _b.channelId, userId = _b.userId, data = _b.data, guildId = _b.guildId, messageId = _b.messageId;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!this.server) {
                            throw new Error('Server not started');
                        }
                        interactionId = (0, snowflake_js_1.generateSnowflake)();
                        interactionToken = "test-interaction-token-".concat(interactionId);
                        resolvedGuildId = guildId !== null && guildId !== void 0 ? guildId : this.guildId;
                        // Pre-create the InteractionResponse row so the callback endpoint can find it
                        return [4 /*yield*/, this.prisma.interactionResponse.create({
                                data: {
                                    interactionId: interactionId,
                                    interactionToken: interactionToken,
                                    applicationId: this.botUserId,
                                    channelId: channelId,
                                    type: 0, // placeholder, updated when callback is received
                                    messageId: messageId !== null && messageId !== void 0 ? messageId : null,
                                    acknowledged: false,
                                },
                            })
                            // Build the INTERACTION_CREATE gateway payload
                        ];
                    case 1:
                        // Pre-create the InteractionResponse row so the callback endpoint can find it
                        _f.sent();
                        return [4 /*yield*/, this.prisma.user.findUniqueOrThrow({
                                where: { id: userId },
                            })];
                    case 2:
                        user = _f.sent();
                        return [4 /*yield*/, this.prisma.guildMember.findUnique({
                                where: { guildId_userId: { guildId: resolvedGuildId, userId: userId } },
                                include: { user: true },
                            })];
                    case 3:
                        member = _f.sent();
                        return [4 /*yield*/, this.prisma.channel.findUnique({
                                where: { id: channelId },
                            })];
                    case 4:
                        channel = _f.sent();
                        messageData = undefined;
                        if (!messageId) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.prisma.message.findUniqueOrThrow({
                                where: { id: messageId },
                            })];
                    case 5:
                        msg = _f.sent();
                        return [4 /*yield*/, this.prisma.user.findUniqueOrThrow({
                                where: { id: msg.authorId },
                            })];
                    case 6:
                        msgAuthor = _f.sent();
                        if (!resolvedGuildId) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.prisma.guildMember.findUnique({
                                where: {
                                    guildId_userId: {
                                        guildId: resolvedGuildId,
                                        userId: msg.authorId,
                                    },
                                },
                                include: { user: true },
                            })];
                    case 7:
                        _c = _f.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        _c = null;
                        _f.label = 9;
                    case 9:
                        msgMember = _c;
                        messageData = (0, serializers_js_1.messageToAPI)(msg, msgAuthor, resolvedGuildId, msgMember !== null && msgMember !== void 0 ? msgMember : undefined);
                        _f.label = 10;
                    case 10:
                        componentType = (function () {
                            if (type !== v10_1.InteractionType.MessageComponent || !data) {
                                return undefined;
                            }
                            var raw = data['component_type'];
                            if (typeof raw !== 'number') {
                                return undefined;
                            }
                            return raw;
                        })();
                        values = (function () {
                            if (!data) {
                                return undefined;
                            }
                            var raw = data['values'];
                            if (!Array.isArray(raw)) {
                                return undefined;
                            }
                            return raw.filter(function (item) {
                                return typeof item === 'string';
                            });
                        })();
                        this.interactionEvents.push({
                            timestamp: Date.now(),
                            channelId: channelId,
                            interactionType: type,
                            componentType: componentType,
                            values: values,
                        });
                        if (this.interactionEvents.length > 5000) {
                            this.interactionEvents.splice(0, this.interactionEvents.length - 5000);
                        }
                        interactionPayload = {
                            id: interactionId,
                            application_id: this.botUserId,
                            type: type,
                            data: data !== null && data !== void 0 ? data : {},
                            guild_id: resolvedGuildId,
                            channel_id: channelId,
                            channel: channel ? (0, serializers_js_1.channelToAPI)(channel) : undefined,
                            message: messageData,
                            member: member
                                ? {
                                    user: (0, serializers_js_1.userToAPI)(member.user),
                                    nick: (_d = member.nick) !== null && _d !== void 0 ? _d : undefined,
                                    roles: JSON.parse(member.roles),
                                    joined_at: (0, serializers_js_1.isoTimestamp)(member.joinedAt),
                                    deaf: member.deaf,
                                    mute: member.mute,
                                    flags: 0,
                                    permissions: (_e = member.permissions) !== null && _e !== void 0 ? _e : '1099511627775',
                                }
                                : undefined,
                            token: interactionToken,
                            version: 1,
                            app_permissions: '1099511627775',
                            locale: 'en-US',
                            guild_locale: 'en-US',
                            entitlements: [],
                            authorizing_integration_owners: {},
                            context: 0,
                            attachment_size_limit: 26214400,
                        };
                        this.server.gateway.broadcast(v10_1.GatewayDispatchEvents.InteractionCreate, interactionPayload);
                        return [2 /*return*/, { id: interactionId, token: interactionToken }];
                }
            });
        });
    };
    DigitalDiscord.prototype.simulateSlashCommand = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var resolvedCommandId;
            var _this = this;
            var channelId = _b.channelId, userId = _b.userId, name = _b.name, commandId = _b.commandId, options = _b.options, guildId = _b.guildId;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var resolvedGuildId, guildCmd, globalCmd;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (commandId) {
                                            return [2 /*return*/, commandId];
                                        }
                                        resolvedGuildId = guildId !== null && guildId !== void 0 ? guildId : this.guildId;
                                        return [4 /*yield*/, this.prisma.applicationCommand.findFirst({
                                                where: {
                                                    applicationId: this.botUserId,
                                                    name: name,
                                                    guildId: resolvedGuildId,
                                                },
                                            })];
                                    case 1:
                                        guildCmd = _b.sent();
                                        if (guildCmd) {
                                            return [2 /*return*/, guildCmd.id];
                                        }
                                        return [4 /*yield*/, this.prisma.applicationCommand.findFirst({
                                                where: {
                                                    applicationId: this.botUserId,
                                                    name: name,
                                                    guildId: null,
                                                },
                                            })];
                                    case 2:
                                        globalCmd = _b.sent();
                                        return [2 /*return*/, (_a = globalCmd === null || globalCmd === void 0 ? void 0 : globalCmd.id) !== null && _a !== void 0 ? _a : (0, snowflake_js_1.generateSnowflake)()];
                                }
                            });
                        }); })()];
                    case 1:
                        resolvedCommandId = _c.sent();
                        return [2 /*return*/, this.simulateInteraction({
                                type: v10_1.InteractionType.ApplicationCommand,
                                channelId: channelId,
                                userId: userId,
                                guildId: guildId,
                                data: __assign({ id: resolvedCommandId, name: name, type: 1 }, (options && options.length > 0 ? { options: options } : {})),
                            })];
                }
            });
        });
    };
    DigitalDiscord.prototype.simulateButtonClick = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var channelId = _b.channelId, userId = _b.userId, messageId = _b.messageId, customId = _b.customId, guildId = _b.guildId;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.simulateInteraction({
                        type: v10_1.InteractionType.MessageComponent,
                        channelId: channelId,
                        userId: userId,
                        guildId: guildId,
                        messageId: messageId,
                        data: {
                            custom_id: customId,
                            component_type: v10_1.ComponentType.Button,
                        },
                    })];
            });
        });
    };
    DigitalDiscord.prototype.simulateSelectMenu = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var channelId = _b.channelId, userId = _b.userId, messageId = _b.messageId, customId = _b.customId, values = _b.values, guildId = _b.guildId;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.simulateInteraction({
                        type: v10_1.InteractionType.MessageComponent,
                        channelId: channelId,
                        userId: userId,
                        guildId: guildId,
                        messageId: messageId,
                        data: {
                            custom_id: customId,
                            component_type: v10_1.ComponentType.StringSelect,
                            values: values,
                        },
                    })];
            });
        });
    };
    DigitalDiscord.prototype.simulateModalSubmit = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var components;
            var channelId = _b.channelId, userId = _b.userId, customId = _b.customId, fields = _b.fields, guildId = _b.guildId;
            return __generator(this, function (_c) {
                components = fields.map(function (field) {
                    return {
                        type: 1,
                        components: [
                            {
                                type: 4,
                                custom_id: field.customId,
                                value: field.value,
                            },
                        ],
                    };
                });
                return [2 /*return*/, this.simulateInteraction({
                        type: v10_1.InteractionType.ModalSubmit,
                        channelId: channelId,
                        userId: userId,
                        guildId: guildId,
                        data: {
                            custom_id: customId,
                            components: components,
                        },
                    })];
            });
        });
    };
    // --- Internal ---
    DigitalDiscord.prototype.applySchema = function () {
        return __awaiter(this, void 0, void 0, function () {
            var __dirname, schemaPath, sql, statements, _i, statements_1, statement;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        __dirname = node_path_1.default.dirname(node_url_1.default.fileURLToPath(import.meta.url));
                        schemaPath = node_path_1.default.resolve(__dirname, '../src/schema.sql');
                        sql = node_fs_1.default.readFileSync(schemaPath, 'utf-8');
                        statements = sql
                            .split(';')
                            .map(function (s) {
                            return s
                                .split('\n')
                                .filter(function (line) { return !line.trimStart().startsWith('--'); })
                                .join('\n')
                                .trim();
                        })
                            .filter(function (s) {
                            return s.length > 0 &&
                                !/^CREATE\s+TABLE\s+["']?sqlite_sequence["']?\s*\(/i.test(s);
                        })
                            .map(function (s) {
                            return s
                                .replace(/^CREATE\s+UNIQUE\s+INDEX\b(?!\s+IF)/i, 'CREATE UNIQUE INDEX IF NOT EXISTS')
                                .replace(/^CREATE\s+INDEX\b(?!\s+IF)/i, 'CREATE INDEX IF NOT EXISTS');
                        });
                        _i = 0, statements_1 = statements;
                        _a.label = 1;
                    case 1:
                        if (!(_i < statements_1.length)) return [3 /*break*/, 4];
                        statement = statements_1[_i];
                        return [4 /*yield*/, this.prisma.$executeRawUnsafe(statement)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DigitalDiscord.prototype.seed = function () {
        return __awaiter(this, void 0, void 0, function () {
            var opts, userIds, _i, _a, userOpts, userId, guildConfigs, _b, guildConfigs_1, _c, guildId, guildConfig, ownerId, _d, userIds_1, userId, channels, _e, channels_1, chOpts;
            var _this = this;
            var _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
            return __generator(this, function (_t) {
                switch (_t.label) {
                    case 0:
                        opts = this.options;
                        // Create bot user
                        return [4 /*yield*/, this.prisma.user.create({
                                data: {
                                    id: this.botUserId,
                                    username: (_g = (_f = opts.botUser) === null || _f === void 0 ? void 0 : _f.username) !== null && _g !== void 0 ? _g : 'TestBot',
                                    bot: true,
                                    globalName: (_j = (_h = opts.botUser) === null || _h === void 0 ? void 0 : _h.username) !== null && _j !== void 0 ? _j : 'TestBot',
                                },
                            })
                            // Create additional users first (needed for guild membership)
                        ];
                    case 1:
                        // Create bot user
                        _t.sent();
                        userIds = [];
                        _i = 0, _a = (_k = opts.users) !== null && _k !== void 0 ? _k : [];
                        _t.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        userOpts = _a[_i];
                        userId = (_l = userOpts.id) !== null && _l !== void 0 ? _l : (0, snowflake_js_1.generateSnowflake)();
                        userIds.push(userId);
                        return [4 /*yield*/, this.prisma.user.create({
                                data: {
                                    id: userId,
                                    username: userOpts.username,
                                    bot: (_m = userOpts.bot) !== null && _m !== void 0 ? _m : false,
                                    globalName: userOpts.username,
                                },
                            })];
                    case 3:
                        _t.sent();
                        _t.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        guildConfigs = (function () {
                            var _a;
                            if (opts.guilds && opts.guilds.length > 0) {
                                return _this.guildIds.map(function (id, i) { var _a; return ({ id: id, config: (_a = opts.guilds[i]) !== null && _a !== void 0 ? _a : {} }); });
                            }
                            return [{ id: _this.guildId, config: (_a = opts.guild) !== null && _a !== void 0 ? _a : {} }];
                        })();
                        _b = 0, guildConfigs_1 = guildConfigs;
                        _t.label = 6;
                    case 6:
                        if (!(_b < guildConfigs_1.length)) return [3 /*break*/, 18];
                        _c = guildConfigs_1[_b], guildId = _c.id, guildConfig = _c.config;
                        ownerId = (_o = guildConfig.ownerId) !== null && _o !== void 0 ? _o : (0, snowflake_js_1.generateSnowflake)();
                        return [4 /*yield*/, this.prisma.guild.create({
                                data: {
                                    id: guildId,
                                    name: (_p = guildConfig.name) !== null && _p !== void 0 ? _p : 'Test Server',
                                    ownerId: ownerId,
                                },
                            })
                            // Create @everyone role
                        ];
                    case 7:
                        _t.sent();
                        // Create @everyone role
                        return [4 /*yield*/, this.prisma.role.create({
                                data: {
                                    id: guildId,
                                    guildId: guildId,
                                    name: '@everyone',
                                    permissions: '1071698660929',
                                    position: 0,
                                },
                            })
                            // Add bot as guild member
                        ];
                    case 8:
                        // Create @everyone role
                        _t.sent();
                        // Add bot as guild member
                        return [4 /*yield*/, this.prisma.guildMember.create({
                                data: { guildId: guildId, userId: this.botUserId },
                            })
                            // Add all users as members of each guild
                        ];
                    case 9:
                        // Add bot as guild member
                        _t.sent();
                        _d = 0, userIds_1 = userIds;
                        _t.label = 10;
                    case 10:
                        if (!(_d < userIds_1.length)) return [3 /*break*/, 13];
                        userId = userIds_1[_d];
                        return [4 /*yield*/, this.prisma.guildMember.create({
                                data: { guildId: guildId, userId: userId },
                            })];
                    case 11:
                        _t.sent();
                        _t.label = 12;
                    case 12:
                        _d++;
                        return [3 /*break*/, 10];
                    case 13:
                        channels = (_q = guildConfig.channels) !== null && _q !== void 0 ? _q : (guildId === this.guildId ? ((_r = opts.channels) !== null && _r !== void 0 ? _r : []) : []);
                        _e = 0, channels_1 = channels;
                        _t.label = 14;
                    case 14:
                        if (!(_e < channels_1.length)) return [3 /*break*/, 17];
                        chOpts = channels_1[_e];
                        return [4 /*yield*/, this.prisma.channel.create({
                                data: {
                                    id: (_s = chOpts.id) !== null && _s !== void 0 ? _s : (0, snowflake_js_1.generateSnowflake)(),
                                    guildId: guildId,
                                    type: chOpts.type,
                                    name: chOpts.name,
                                    topic: chOpts.topic,
                                    parentId: chOpts.parentId,
                                },
                            })];
                    case 15:
                        _t.sent();
                        _t.label = 16;
                    case 16:
                        _e++;
                        return [3 /*break*/, 14];
                    case 17:
                        _b++;
                        return [3 /*break*/, 6];
                    case 18: return [2 /*return*/];
                }
            });
        });
    };
    DigitalDiscord.prototype.loadGatewayState = function () {
        return __awaiter(this, void 0, void 0, function () {
            var botUser, guilds;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.user.findUniqueOrThrow({
                            where: { id: this.botUserId },
                        })];
                    case 1:
                        botUser = _a.sent();
                        return [4 /*yield*/, this.prisma.guild.findMany({
                                include: {
                                    roles: true,
                                    members: { include: { user: true } },
                                    channels: true,
                                },
                            })];
                    case 2:
                        guilds = _a.sent();
                        return [2 /*return*/, {
                                botUser: (0, serializers_js_1.userToAPI)(botUser),
                                guilds: guilds.map(function (guild) { return ({
                                    id: guild.id,
                                    apiGuild: (0, serializers_js_1.guildToAPI)(guild),
                                    joinedAt: (0, serializers_js_1.isoTimestamp)(guild.createdAt),
                                    members: guild.members.map(serializers_js_1.memberToAPI),
                                    channels: guild.channels.map(serializers_js_1.channelToAPI),
                                }); }),
                            }];
                }
            });
        });
    };
    return DigitalDiscord;
}());
exports.DigitalDiscord = DigitalDiscord;
// Scoped accessor returned by discord.channel(id) and discord.thread(id).
// Binds a channelId so every method operates on that target without repeating it.
var ChannelScope = /** @class */ (function () {
    function ChannelScope(_a) {
        var discord = _a.discord, channelId = _a.channelId;
        this.discord = discord;
        this.channelId = channelId;
    }
    ChannelScope.prototype.user = function (userId) {
        return new ScopedUserActor({
            discord: this.discord,
            channelId: this.channelId,
            userId: userId,
        });
    };
    ChannelScope.prototype.bot = function () {
        return this.user(this.discord.botUserId);
    };
    /**
     * Returns a markdown-like textual representation of all messages in this
     * channel/thread. Useful for inline snapshots in tests so both agents and
     * humans can see what happened in Discord at a glance.
     *
     * Format:
     *   --- from: user (Username)
     *   message content
     *   --- from: assistant (BotName)
     *   reply content
     *   [typing]
     *
     * @param deterministicFooters - When true (default), replaces non-deterministic
     *   values in footer lines (duration like "2m 30s" and context percentage like
     *   "71%") with stable placeholders ("Ns" and "N%") so inline snapshots don't
     *   break across runs. Footer lines are detected by starting with "*" and
     *   containing "⋅".
     * @param showTyping - When true, interleaves [typing] markers at the
     *   chronological position of typing indicator POST calls. Defaults to false
     *   so existing snapshots are not affected.
     * @param showInteractions - When true, interleaves interaction markers like
     *   [user clicks button] and [user selects dropdown: value] at the
     *   chronological position of interaction events. Defaults to false so
     *   existing snapshots are not affected.
     */
    ChannelScope.prototype.text = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var messages, timeline, typingEvents, _i, typingEvents_1, evt, interactionEvents, _b, interactionEvents_1, event_1, lines, lastAuthorId, _loop_1, _c, timeline_1, entry;
            var _d, _e;
            var _f = _a === void 0 ? {} : _a, _g = _f.deterministicFooters, deterministicFooters = _g === void 0 ? true : _g, _h = _f.showTyping, showTyping = _h === void 0 ? false : _h, _j = _f.showInteractions, showInteractions = _j === void 0 ? false : _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0: return [4 /*yield*/, this.getMessages()
                        // Build timeline entries: messages + optional typing events
                    ];
                    case 1:
                        messages = _k.sent();
                        timeline = messages.map(function (msg) {
                            return {
                                kind: 'message',
                                ts: new Date(msg.timestamp).getTime(),
                                msg: msg,
                            };
                        });
                        if (showTyping) {
                            typingEvents = this.discord.getTypingEvents({ channelId: this.channelId });
                            for (_i = 0, typingEvents_1 = typingEvents; _i < typingEvents_1.length; _i++) {
                                evt = typingEvents_1[_i];
                                timeline.push({ kind: 'typing', ts: evt.timestamp });
                            }
                        }
                        if (showInteractions) {
                            interactionEvents = this.discord.getInteractionEvents({
                                channelId: this.channelId,
                            });
                            for (_b = 0, interactionEvents_1 = interactionEvents; _b < interactionEvents_1.length; _b++) {
                                event_1 = interactionEvents_1[_b];
                                timeline.push({
                                    kind: 'interaction',
                                    ts: event_1.timestamp,
                                    event: event_1,
                                });
                            }
                        }
                        if (showTyping || showInteractions) {
                            timeline.sort(function (a, b) {
                                return a.ts - b.ts;
                            });
                        }
                        lines = [];
                        lastAuthorId = null;
                        _loop_1 = function (entry) {
                            if (entry.kind === 'typing') {
                                lines.push('[bot typing]');
                                return "continue";
                            }
                            if (entry.kind === 'interaction') {
                                var label = (function () {
                                    if (entry.event.interactionType === v10_1.InteractionType.MessageComponent &&
                                        entry.event.componentType === v10_1.ComponentType.Button) {
                                        return '[user clicks button]';
                                    }
                                    if (entry.event.interactionType === v10_1.InteractionType.MessageComponent &&
                                        entry.event.componentType === v10_1.ComponentType.StringSelect) {
                                        var selectedValues = (entry.event.values || []).join(', ');
                                        if (!selectedValues) {
                                            return '[user selects dropdown]';
                                        }
                                        return "[user selects dropdown: ".concat(selectedValues, "]");
                                    }
                                    if (entry.event.interactionType === v10_1.InteractionType.ModalSubmit) {
                                        return '[user submits modal]';
                                    }
                                    return '[user interaction]';
                                })();
                                lines.push(label);
                                return "continue";
                            }
                            var msg = entry.msg;
                            var role = msg.author.bot ? 'assistant' : 'user';
                            if (msg.author.id !== lastAuthorId) {
                                lines.push("--- from: ".concat(role, " (").concat(msg.author.username, ")"));
                            }
                            lastAuthorId = msg.author.id;
                            if (msg.content) {
                                var content = msg.content;
                                // Footer lines look like: *project ⋅ main ⋅ <1s ⋅ 2% ⋅ model-name*
                                // Replace duration and percentage with stable placeholders.
                                if (deterministicFooters && content.startsWith('*') && content.includes('⋅')) {
                                    content = content
                                        .replace(/<1s/g, 'Ns')
                                        .replace(/\b\d+m\s+\d+s\b/g, 'Ns')
                                        .replace(/\b\d+s\b/g, 'Ns')
                                        .replace(/\b\d+m\b/g, 'Ns')
                                        .replace(/\b\d+%/g, 'N%');
                                }
                                lines.push(content);
                            }
                            var embeds = (_d = msg.embeds) !== null && _d !== void 0 ? _d : [];
                            for (var _l = 0, embeds_1 = embeds; _l < embeds_1.length; _l++) {
                                var embed = embeds_1[_l];
                                // Escape quotes/newlines in titles so snapshots stay clean
                                var safeTitle = embed.title ? JSON.stringify(embed.title).slice(1, -1) : '';
                                var label = safeTitle ? "embed: \"".concat(safeTitle, "\"") : 'embed';
                                lines.push("[".concat(label, "]"));
                            }
                            var attachments = (_e = msg.attachments) !== null && _e !== void 0 ? _e : [];
                            for (var _m = 0, attachments_1 = attachments; _m < attachments_1.length; _m++) {
                                var attachment = attachments_1[_m];
                                lines.push("[attachment: ".concat(attachment.filename, "]"));
                            }
                        };
                        for (_c = 0, timeline_1 = timeline; _c < timeline_1.length; _c++) {
                            entry = timeline_1[_c];
                            _loop_1(entry);
                        }
                        return [2 /*return*/, lines.join('\n')];
                }
            });
        });
    };
    ChannelScope.prototype.getMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            var channel, messages, result, starterMsg_1, starterAuthor, _i, messages_1, msg, author;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.discord.prisma.channel.findUnique({
                            where: { id: this.channelId },
                        })];
                    case 1:
                        channel = _c.sent();
                        return [4 /*yield*/, this.discord.prisma.message.findMany({
                                where: { channelId: this.channelId },
                                orderBy: [{ timestamp: 'asc' }, { id: 'asc' }],
                            })];
                    case 2:
                        messages = _c.sent();
                        result = [];
                        if (!(channel === null || channel === void 0 ? void 0 : channel.starterMessageId)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.discord.prisma.message.findUnique({
                                where: { id: channel.starterMessageId },
                            })];
                    case 3:
                        starterMsg_1 = _c.sent();
                        if (!(starterMsg_1 && !messages.some(function (m) { return m.id === starterMsg_1.id; }))) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.discord.prisma.user.findUniqueOrThrow({
                                where: { id: starterMsg_1.authorId },
                            })];
                    case 4:
                        starterAuthor = _c.sent();
                        result.push((0, serializers_js_1.messageToAPI)(starterMsg_1, starterAuthor, (_a = channel.guildId) !== null && _a !== void 0 ? _a : undefined));
                        _c.label = 5;
                    case 5:
                        _i = 0, messages_1 = messages;
                        _c.label = 6;
                    case 6:
                        if (!(_i < messages_1.length)) return [3 /*break*/, 9];
                        msg = messages_1[_i];
                        return [4 /*yield*/, this.discord.prisma.user.findUniqueOrThrow({
                                where: { id: msg.authorId },
                            })];
                    case 7:
                        author = _c.sent();
                        result.push((0, serializers_js_1.messageToAPI)(msg, author, (_b = channel === null || channel === void 0 ? void 0 : channel.guildId) !== null && _b !== void 0 ? _b : undefined));
                        _c.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 6];
                    case 9: return [2 /*return*/, result];
                }
            });
        });
    };
    ChannelScope.prototype.getTypingEvents = function () {
        return this.discord.getTypingEvents({ channelId: this.channelId });
    };
    ChannelScope.prototype.clearTypingEvents = function () {
        this.discord.clearTypingEvents({ channelId: this.channelId });
    };
    ChannelScope.prototype.waitForTypingEvent = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var effectiveTimeout, start, event_2;
            var _b = _a === void 0 ? {} : _a, _c = _b.timeout, timeout = _c === void 0 ? 10000 : _c, _d = _b.afterTimestamp, afterTimestamp = _d === void 0 ? 0 : _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        effectiveTimeout = normalizeWaitTimeout(timeout);
                        start = Date.now();
                        _e.label = 1;
                    case 1:
                        if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 3];
                        event_2 = this.getTypingEvents().find(function (entry) {
                            return entry.timestamp > afterTimestamp;
                        });
                        if (event_2) {
                            return [2 /*return*/, event_2];
                        }
                        return [4 /*yield*/, new Promise(function (resolve) {
                                setTimeout(resolve, 50);
                            })];
                    case 2:
                        _e.sent();
                        return [3 /*break*/, 1];
                    case 3: throw new Error("Timed out waiting for typing event in channel ".concat(this.channelId));
                }
            });
        });
    };
    ChannelScope.prototype.waitForTypingToStop = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var effectiveTimeout, start, baselineTimestamp, latestTypingTimestamp;
            var _b;
            var _c = _a === void 0 ? {} : _a, _d = _c.timeout, timeout = _d === void 0 ? 12000 : _d, _e = _c.idleMs, idleMs = _e === void 0 ? 8500 : _e, afterTimestamp = _c.afterTimestamp;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        effectiveTimeout = normalizeWaitTimeout(timeout);
                        start = Date.now();
                        baselineTimestamp = afterTimestamp !== null && afterTimestamp !== void 0 ? afterTimestamp : start;
                        _f.label = 1;
                    case 1:
                        if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 3];
                        latestTypingTimestamp = (_b = this.getTypingEvents()
                            .filter(function (entry) {
                            return entry.timestamp >= baselineTimestamp;
                        })
                            .map(function (entry) {
                            return entry.timestamp;
                        })
                            .sort(function (a, b) {
                            return b - a;
                        })[0]) !== null && _b !== void 0 ? _b : baselineTimestamp;
                        if (Date.now() - latestTypingTimestamp >= idleMs) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, new Promise(function (resolve) {
                                setTimeout(resolve, 50);
                            })];
                    case 2:
                        _f.sent();
                        return [3 /*break*/, 1];
                    case 3: throw new Error("Timed out waiting for typing to stop in channel ".concat(this.channelId));
                }
            });
        });
    };
    ChannelScope.prototype.getChannel = function () {
        return __awaiter(this, void 0, void 0, function () {
            var channel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.discord.prisma.channel.findUnique({
                            where: { id: this.channelId },
                        })];
                    case 1:
                        channel = _a.sent();
                        if (!channel) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, (0, serializers_js_1.channelToAPI)(channel)];
                }
            });
        });
    };
    ChannelScope.prototype.getThreads = function () {
        return __awaiter(this, void 0, void 0, function () {
            var threads;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.discord.prisma.channel.findMany({
                            where: {
                                parentId: this.channelId,
                                type: {
                                    in: [
                                        v10_1.ChannelType.PublicThread,
                                        v10_1.ChannelType.PrivateThread,
                                        v10_1.ChannelType.AnnouncementThread,
                                    ],
                                },
                            },
                        })];
                    case 1:
                        threads = _a.sent();
                        return [2 /*return*/, threads.map(serializers_js_1.channelToAPI)];
                }
            });
        });
    };
    ChannelScope.prototype.waitForMessage = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var effectiveTimeout, start, messages, matchedMessage;
            var _b = _a === void 0 ? {} : _a, _c = _b.timeout, timeout = _c === void 0 ? 10000 : _c, predicate = _b.predicate;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        effectiveTimeout = normalizeWaitTimeout(timeout);
                        start = Date.now();
                        _d.label = 1;
                    case 1:
                        if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getMessages()];
                    case 2:
                        messages = _d.sent();
                        matchedMessage = __spreadArray([], messages, true).reverse()
                            .find(function (message) {
                            if (!predicate) {
                                return true;
                            }
                            return predicate(message);
                        });
                        if (matchedMessage) {
                            return [2 /*return*/, matchedMessage];
                        }
                        return [4 /*yield*/, new Promise(function (resolve) {
                                setTimeout(resolve, 50);
                            })];
                    case 3:
                        _d.sent();
                        return [3 /*break*/, 1];
                    case 4: throw new Error("Timed out waiting for message in channel ".concat(this.channelId));
                }
            });
        });
    };
    ChannelScope.prototype.waitForBotReply = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var _this = this;
            var _b = _a === void 0 ? {} : _a, _c = _b.timeout, timeout = _c === void 0 ? 10000 : _c;
            return __generator(this, function (_d) {
                return [2 /*return*/, this.waitForMessage({
                        timeout: timeout,
                        predicate: function (message) {
                            return message.author.id === _this.discord.botUserId;
                        },
                    })];
            });
        });
    };
    ChannelScope.prototype.waitForThread = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var effectiveTimeout, start, threads, matchedThreads, newestThread;
            var _b = _a === void 0 ? {} : _a, _c = _b.timeout, timeout = _c === void 0 ? 10000 : _c, predicate = _b.predicate;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        effectiveTimeout = normalizeWaitTimeout(timeout);
                        start = Date.now();
                        _d.label = 1;
                    case 1:
                        if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getThreads()];
                    case 2:
                        threads = _d.sent();
                        matchedThreads = predicate
                            ? threads.filter(function (thread) {
                                return predicate(thread);
                            })
                            : threads;
                        if (matchedThreads.length > 0) {
                            newestThread = __spreadArray([], matchedThreads, true).sort(function (a, b) {
                                return compareSnowflakeDesc(a.id, b.id);
                            })[0];
                            if (newestThread) {
                                return [2 /*return*/, newestThread];
                            }
                        }
                        return [4 /*yield*/, new Promise(function (resolve) {
                                setTimeout(resolve, 50);
                            })];
                    case 3:
                        _d.sent();
                        return [3 /*break*/, 1];
                    case 4: throw new Error("Timed out waiting for thread in channel ".concat(this.channelId));
                }
            });
        });
    };
    ChannelScope.prototype.getInteractionResponse = function (interactionId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.discord.prisma.interactionResponse.findUnique({
                        where: { interactionId: interactionId },
                    })];
            });
        });
    };
    ChannelScope.prototype.waitForInteractionAck = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var effectiveTimeout, start, response;
            var interactionId = _b.interactionId, _c = _b.timeout, timeout = _c === void 0 ? 10000 : _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        effectiveTimeout = normalizeWaitTimeout(timeout);
                        start = Date.now();
                        _d.label = 1;
                    case 1:
                        if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.discord.prisma.interactionResponse.findUnique({
                                where: { interactionId: interactionId },
                            })];
                    case 2:
                        response = _d.sent();
                        if (response === null || response === void 0 ? void 0 : response.acknowledged) {
                            return [2 /*return*/, response];
                        }
                        return [4 /*yield*/, new Promise(function (resolve) {
                                setTimeout(resolve, 50);
                            })];
                    case 3:
                        _d.sent();
                        return [3 /*break*/, 1];
                    case 4: throw new Error("Timed out waiting for interaction response ".concat(interactionId));
                }
            });
        });
    };
    return ChannelScope;
}());
exports.ChannelScope = ChannelScope;
// User actor scoped to a specific channel/thread.
// Returned by discord.channel(id).user(userId) or discord.thread(id).user(userId).
var ScopedUserActor = /** @class */ (function () {
    function ScopedUserActor(_a) {
        var discord = _a.discord, channelId = _a.channelId, userId = _a.userId;
        this.discord = discord;
        this.channelId = channelId;
        this.userId = userId;
    }
    ScopedUserActor.prototype.sendMessage = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var content = _b.content, embeds = _b.embeds, attachments = _b.attachments, messageReference = _b.messageReference;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.discord.simulateUserMessage({
                        channelId: this.channelId,
                        userId: this.userId,
                        content: content,
                        embeds: embeds,
                        attachments: attachments,
                        messageReference: messageReference,
                    })];
            });
        });
    };
    /**
     * Send a voice message (audio attachment with content_type: audio/ogg).
     * The attachment URL is fake — tests using deterministic transcription
     * bypass the fetch entirely. Content defaults to empty string since
     * real Discord voice messages have no text body.
     */
    ScopedUserActor.prototype.sendVoiceMessage = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var _b = _a === void 0 ? {} : _a, content = _b.content;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.sendMessage({
                        content: content !== null && content !== void 0 ? content : '',
                        attachments: [
                            {
                                id: (0, snowflake_js_1.generateSnowflake)(),
                                filename: 'voice-message.ogg',
                                content_type: 'audio/ogg',
                                size: 1024,
                                url: 'https://fake-cdn.discord.test/voice-message.ogg',
                                proxy_url: 'https://fake-cdn.discord.test/voice-message.ogg',
                            },
                        ],
                    })];
            });
        });
    };
    ScopedUserActor.prototype.runSlashCommand = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var name = _b.name, commandId = _b.commandId, options = _b.options, guildId = _b.guildId;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.discord.simulateSlashCommand({
                        channelId: this.channelId,
                        userId: this.userId,
                        name: name,
                        commandId: commandId,
                        options: options,
                        guildId: guildId,
                    })];
            });
        });
    };
    ScopedUserActor.prototype.clickButton = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var messageId = _b.messageId, customId = _b.customId, guildId = _b.guildId;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.discord.simulateButtonClick({
                        channelId: this.channelId,
                        userId: this.userId,
                        messageId: messageId,
                        customId: customId,
                        guildId: guildId,
                    })];
            });
        });
    };
    ScopedUserActor.prototype.selectMenu = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var messageId = _b.messageId, customId = _b.customId, values = _b.values, guildId = _b.guildId;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.discord.simulateSelectMenu({
                        channelId: this.channelId,
                        userId: this.userId,
                        messageId: messageId,
                        customId: customId,
                        values: values,
                        guildId: guildId,
                    })];
            });
        });
    };
    ScopedUserActor.prototype.submitModal = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var customId = _b.customId, fields = _b.fields, guildId = _b.guildId;
            return __generator(this, function (_c) {
                return [2 /*return*/, this.discord.simulateModalSubmit({
                        channelId: this.channelId,
                        userId: this.userId,
                        customId: customId,
                        fields: fields,
                        guildId: guildId,
                    })];
            });
        });
    };
    return ScopedUserActor;
}());
exports.ScopedUserActor = ScopedUserActor;
var gateway_js_1 = require("./gateway.js");
Object.defineProperty(exports, "DiscordGateway", { enumerable: true, get: function () { return gateway_js_1.DiscordGateway; } });
var snowflake_js_2 = require("./snowflake.js");
Object.defineProperty(exports, "generateSnowflake", { enumerable: true, get: function () { return snowflake_js_2.generateSnowflake; } });
