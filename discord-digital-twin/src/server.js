"use strict";
// Combined HTTP (Spiceflow) + WebSocket (ws) server on a single port.
// The Spiceflow app handles REST API routes at /api/v10/*.
// The ws WebSocketServer handles Gateway connections at /gateway.
// All routes are defined inline since each is small.
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
exports.createServer = createServer;
exports.startServer = startServer;
exports.stopServer = stopServer;
var node_http_1 = require("node:http");
var spiceflow_1 = require("spiceflow");
var v10_1 = require("discord-api-types/v10");
var gateway_js_1 = require("./gateway.js");
var serializers_js_1 = require("./serializers.js");
var snowflake_js_1 = require("./snowflake.js");
// discord.js (via undici) URL-encodes @original to %40original.
// Decode so route handlers can check for the canonical form.
function resolveWebhookMessageId(raw) {
    var decoded = decodeURIComponent(raw);
    return decoded;
}
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function getErrorStack(error) {
    if (error instanceof Error) {
        return error.stack;
    }
    return undefined;
}
// Generous fake rate limit headers so discord.js never self-throttles
var RATE_LIMIT_HEADERS = {
    'X-RateLimit-Limit': '50',
    'X-RateLimit-Remaining': '49',
    'X-RateLimit-Reset-After': '60.0',
    'X-RateLimit-Bucket': 'fake-bucket',
};
var THREAD_CHANNEL_TYPES = [
    v10_1.ChannelType.PublicThread,
    v10_1.ChannelType.PrivateThread,
    v10_1.ChannelType.AnnouncementThread,
];
function isThreadChannelType(channelType) {
    return THREAD_CHANNEL_TYPES.includes(channelType);
}
function createServer(_a) {
    var prisma = _a.prisma, botUserId = _a.botUserId, botToken = _a.botToken, loadGatewayState = _a.loadGatewayState, gatewayUrlOverride = _a.gatewayUrlOverride;
    var state = { port: 0 };
    var typingEvents = [];
    // Route handlers close over `gateway`. It's assigned after httpServer
    // creation but before any request arrives (server hasn't started listening).
    var gateway;
    var app = new spiceflow_1.Spiceflow({ basePath: '/api/v10' })
        .onError(function (_a) {
        var _b;
        var error = _a.error;
        if (error instanceof Response) {
            return error;
        }
        var message = getErrorMessage(error) || 'Internal Server Error';
        var details = (_b = getErrorStack(error)) !== null && _b !== void 0 ? _b : message;
        return Response.json({
            code: 0,
            message: message,
            error: 'internal_server_error',
            details: details,
            error_description: details,
            errors: {
                _errors: [
                    {
                        code: 'STACK_TRACE',
                        message: details,
                    },
                ],
            },
        }, { status: 500 });
    })
        // --- Gateway ---
        .route({
        method: 'GET',
        path: '/gateway/bot',
        handler: function () {
            return {
                url: gatewayUrlOverride !== null && gatewayUrlOverride !== void 0 ? gatewayUrlOverride : "ws://127.0.0.1:".concat(state.port, "/gateway"),
                shards: 1,
                session_start_limit: {
                    total: 1000,
                    remaining: 999,
                    reset_after: 14400000,
                    max_concurrency: 1,
                },
            };
        },
    })
        // --- Users ---
        .route({
        method: 'GET',
        path: '/users/@me',
        handler: function () {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                                where: { id: botUserId },
                            })];
                        case 1:
                            user = _a.sent();
                            return [2 /*return*/, (0, serializers_js_1.userToAPI)(user)];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/users/:user_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var user;
                var params = _b.params;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, prisma.user.findUnique({
                                where: { id: params.user_id },
                            })];
                        case 1:
                            user = _c.sent();
                            if (!user) {
                                throw new Response(JSON.stringify({
                                    code: 10013,
                                    message: 'Unknown User',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [2 /*return*/, (0, serializers_js_1.userToAPI)(user)];
                    }
                });
            });
        },
    })
        // --- Applications ---
        .route({
        method: 'GET',
        path: '/applications/@me',
        handler: function () {
            return {
                id: botUserId,
                name: 'TestBot',
                icon: null,
                description: '',
                summary: '',
                bot_public: true,
                bot_require_code_grant: false,
                verify_key: 'fake-verify-key',
                team: null,
                flags: v10_1.ApplicationFlags.GatewayPresence |
                    v10_1.ApplicationFlags.GatewayGuildMembers |
                    v10_1.ApplicationFlags.GatewayMessageContent,
                event_webhooks_status: v10_1.ApplicationWebhookEventStatus.Disabled,
            };
        },
    })
        .route({
        method: 'PUT',
        path: '/applications/:application_id/commands',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var commands, results, _i, commands_1, cmd, id, version, description, options, type, command;
                var _c, _d, _e, _f, _g, _h, _j, _k, _l;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_m) {
                    switch (_m.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            commands = (_m.sent());
                            return [4 /*yield*/, prisma.applicationCommand.deleteMany({
                                    where: {
                                        applicationId: params.application_id,
                                        guildId: null,
                                    },
                                })];
                        case 2:
                            _m.sent();
                            results = [];
                            _i = 0, commands_1 = commands;
                            _m.label = 3;
                        case 3:
                            if (!(_i < commands_1.length)) return [3 /*break*/, 6];
                            cmd = commands_1[_i];
                            id = (0, snowflake_js_1.generateSnowflake)();
                            version = (0, snowflake_js_1.generateSnowflake)();
                            description = 'description' in cmd ? ((_c = cmd.description) !== null && _c !== void 0 ? _c : '') : '';
                            options = 'options' in cmd ? ((_d = cmd.options) !== null && _d !== void 0 ? _d : []) : [];
                            type = (_e = cmd.type) !== null && _e !== void 0 ? _e : v10_1.ApplicationCommandType.ChatInput;
                            return [4 /*yield*/, prisma.applicationCommand.create({
                                    data: {
                                        id: id,
                                        applicationId: params.application_id,
                                        guildId: null,
                                        name: cmd.name,
                                        description: description,
                                        type: type,
                                        options: JSON.stringify(options),
                                        defaultMemberPermissions: (_f = cmd.default_member_permissions) !== null && _f !== void 0 ? _f : null,
                                        dmPermission: (_g = cmd.dm_permission) !== null && _g !== void 0 ? _g : true,
                                        nsfw: (_h = cmd.nsfw) !== null && _h !== void 0 ? _h : false,
                                        version: version,
                                    },
                                })];
                        case 4:
                            _m.sent();
                            command = {
                                id: id,
                                application_id: params.application_id,
                                name: cmd.name,
                                description: description,
                                type: type,
                                options: options,
                                default_member_permissions: (_j = cmd.default_member_permissions) !== null && _j !== void 0 ? _j : null,
                                dm_permission: (_k = cmd.dm_permission) !== null && _k !== void 0 ? _k : true,
                                nsfw: (_l = cmd.nsfw) !== null && _l !== void 0 ? _l : false,
                                version: version,
                            };
                            results.push(command);
                            _m.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6: return [2 /*return*/, results];
                    }
                });
            });
        },
    })
        .route({
        method: 'PUT',
        path: '/applications/:application_id/guilds/:guild_id/commands',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var commands, results, _i, commands_2, cmd, id, version, description, options, type;
                var _c, _d, _e, _f, _g, _h, _j, _k, _l;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_m) {
                    switch (_m.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            commands = (_m.sent());
                            return [4 /*yield*/, prisma.applicationCommand.deleteMany({
                                    where: {
                                        applicationId: params.application_id,
                                        guildId: params.guild_id,
                                    },
                                })];
                        case 2:
                            _m.sent();
                            results = [];
                            _i = 0, commands_2 = commands;
                            _m.label = 3;
                        case 3:
                            if (!(_i < commands_2.length)) return [3 /*break*/, 6];
                            cmd = commands_2[_i];
                            id = (0, snowflake_js_1.generateSnowflake)();
                            version = (0, snowflake_js_1.generateSnowflake)();
                            description = 'description' in cmd ? ((_c = cmd.description) !== null && _c !== void 0 ? _c : '') : '';
                            options = 'options' in cmd ? ((_d = cmd.options) !== null && _d !== void 0 ? _d : []) : [];
                            type = (_e = cmd.type) !== null && _e !== void 0 ? _e : v10_1.ApplicationCommandType.ChatInput;
                            return [4 /*yield*/, prisma.applicationCommand.create({
                                    data: {
                                        id: id,
                                        applicationId: params.application_id,
                                        guildId: params.guild_id,
                                        name: cmd.name,
                                        description: description,
                                        type: type,
                                        options: JSON.stringify(options),
                                        defaultMemberPermissions: (_f = cmd.default_member_permissions) !== null && _f !== void 0 ? _f : null,
                                        dmPermission: (_g = cmd.dm_permission) !== null && _g !== void 0 ? _g : true,
                                        nsfw: (_h = cmd.nsfw) !== null && _h !== void 0 ? _h : false,
                                        version: version,
                                    },
                                })];
                        case 4:
                            _m.sent();
                            results.push({
                                id: id,
                                application_id: params.application_id,
                                guild_id: params.guild_id,
                                name: cmd.name,
                                description: description,
                                type: type,
                                options: options,
                                default_member_permissions: (_j = cmd.default_member_permissions) !== null && _j !== void 0 ? _j : null,
                                dm_permission: (_k = cmd.dm_permission) !== null && _k !== void 0 ? _k : true,
                                nsfw: (_l = cmd.nsfw) !== null && _l !== void 0 ? _l : false,
                                version: version,
                            });
                            _m.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6: return [2 /*return*/, results];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/applications/:application_id/guilds/:guild_id/commands/:command_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var cmd;
                var _c, _d;
                var params = _b.params;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, prisma.applicationCommand.findFirst({
                                where: {
                                    id: params.command_id,
                                    applicationId: params.application_id,
                                    guildId: params.guild_id,
                                },
                            })];
                        case 1:
                            cmd = _e.sent();
                            if (!cmd) {
                                throw new Response(JSON.stringify({
                                    code: 10063,
                                    message: 'Unknown application command',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [2 /*return*/, {
                                    id: cmd.id,
                                    application_id: cmd.applicationId,
                                    guild_id: (_c = cmd.guildId) !== null && _c !== void 0 ? _c : undefined,
                                    name: cmd.name,
                                    description: cmd.description,
                                    type: cmd.type,
                                    options: JSON.parse(cmd.options),
                                    default_member_permissions: (_d = cmd.defaultMemberPermissions) !== null && _d !== void 0 ? _d : null,
                                    dm_permission: cmd.dmPermission,
                                    nsfw: cmd.nsfw,
                                    version: cmd.version,
                                }];
                    }
                });
            });
        },
    })
        // --- Messages ---
        .route({
        method: 'POST',
        path: '/channels/:channel_id/messages',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, channel, messageId, dbMessage, author, guildId, member, _c, apiMessage;
                var _d, _e, _f, _g, _h, _j;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_k) {
                    switch (_k.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_k.sent());
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: params.channel_id },
                                })];
                        case 2:
                            channel = _k.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            messageId = (0, snowflake_js_1.generateSnowflake)();
                            return [4 /*yield*/, prisma.message.create({
                                    data: {
                                        id: messageId,
                                        channelId: params.channel_id,
                                        authorId: botUserId,
                                        content: (_d = body.content) !== null && _d !== void 0 ? _d : '',
                                        tts: (_e = body.tts) !== null && _e !== void 0 ? _e : false,
                                        nonce: body.nonce != null ? String(body.nonce) : null,
                                        flags: (_f = body.flags) !== null && _f !== void 0 ? _f : 0,
                                        embeds: JSON.stringify((_g = body.embeds) !== null && _g !== void 0 ? _g : []),
                                        components: JSON.stringify((_h = body.components) !== null && _h !== void 0 ? _h : []),
                                        messageReference: body.message_reference
                                            ? JSON.stringify(body.message_reference)
                                            : null,
                                    },
                                })];
                        case 3:
                            _k.sent();
                            return [4 /*yield*/, prisma.channel.update({
                                    where: { id: params.channel_id },
                                    data: {
                                        lastMessageId: messageId,
                                        messageCount: { increment: 1 },
                                        totalMessageSent: { increment: 1 },
                                    },
                                })];
                        case 4:
                            _k.sent();
                            return [4 /*yield*/, prisma.message.findUniqueOrThrow({
                                    where: { id: messageId },
                                })];
                        case 5:
                            dbMessage = _k.sent();
                            return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                                    where: { id: botUserId },
                                })];
                        case 6:
                            author = _k.sent();
                            guildId = (_j = channel.guildId) !== null && _j !== void 0 ? _j : undefined;
                            if (!guildId) return [3 /*break*/, 8];
                            return [4 /*yield*/, prisma.guildMember.findUnique({
                                    where: { guildId_userId: { guildId: guildId, userId: botUserId } },
                                    include: { user: true },
                                })];
                        case 7:
                            _c = _k.sent();
                            return [3 /*break*/, 9];
                        case 8:
                            _c = null;
                            _k.label = 9;
                        case 9:
                            member = _c;
                            apiMessage = (0, serializers_js_1.messageToAPI)(dbMessage, author, guildId, member !== null && member !== void 0 ? member : undefined);
                            gateway.broadcastMessageCreate(apiMessage, guildId !== null && guildId !== void 0 ? guildId : '');
                            return [2 /*return*/, apiMessage];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/channels/:channel_id/messages/:message_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var channel, dbMessage, thread, author, guildId, member, _c;
                var _d;
                var params = _b.params;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, prisma.channel.findUnique({
                                where: { id: params.channel_id },
                            })];
                        case 1:
                            channel = _e.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.message.findUnique({
                                    where: { id: params.message_id },
                                })
                                // discord.js fetchStarterMessage() fetches message with id = thread.id
                                // from the parent channel. On real Discord, thread ID = starter message
                                // ID for message-based threads. The digital twin uses separate IDs, so
                                // fall back to the thread's starterMessageId when the message_id is
                                // actually a thread that belongs to this channel.
                            ];
                        case 2:
                            dbMessage = _e.sent();
                            if (!!dbMessage) return [3 /*break*/, 5];
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: params.message_id },
                                })];
                        case 3:
                            thread = _e.sent();
                            if (!((thread === null || thread === void 0 ? void 0 : thread.starterMessageId) && thread.parentId === params.channel_id)) return [3 /*break*/, 5];
                            return [4 /*yield*/, prisma.message.findUnique({
                                    where: { id: thread.starterMessageId },
                                })];
                        case 4:
                            dbMessage = _e.sent();
                            _e.label = 5;
                        case 5:
                            if (!dbMessage) {
                                throw new Response(JSON.stringify({
                                    code: 10008,
                                    message: 'Unknown Message',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                                    where: { id: dbMessage.authorId },
                                })];
                        case 6:
                            author = _e.sent();
                            guildId = (_d = channel.guildId) !== null && _d !== void 0 ? _d : undefined;
                            if (!guildId) return [3 /*break*/, 8];
                            return [4 /*yield*/, prisma.guildMember.findUnique({
                                    where: {
                                        guildId_userId: { guildId: guildId, userId: dbMessage.authorId },
                                    },
                                    include: { user: true },
                                })];
                        case 7:
                            _c = _e.sent();
                            return [3 /*break*/, 9];
                        case 8:
                            _c = null;
                            _e.label = 9;
                        case 9:
                            member = _c;
                            return [2 /*return*/, (0, serializers_js_1.messageToAPI)(dbMessage, author, guildId, member !== null && member !== void 0 ? member : undefined)];
                    }
                });
            });
        },
    })
        .route({
        method: 'PATCH',
        path: '/channels/:channel_id/messages/:message_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, channel, existing, dbMessage, author, guildId, member, _c, apiMessage;
                var _d, _e;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_f.sent());
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: params.channel_id },
                                })];
                        case 2:
                            channel = _f.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.message.findUnique({
                                    where: { id: params.message_id },
                                })];
                        case 3:
                            existing = _f.sent();
                            if (!existing) {
                                throw new Response(JSON.stringify({
                                    code: 10008,
                                    message: 'Unknown Message',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.message.update({
                                    where: { id: params.message_id },
                                    data: __assign(__assign(__assign({ content: (_d = body.content) !== null && _d !== void 0 ? _d : existing.content, editedTimestamp: new Date() }, (body.embeds ? { embeds: JSON.stringify(body.embeds) } : {})), (body.components
                                        ? { components: JSON.stringify(body.components) }
                                        : {})), (body.flags != null ? { flags: body.flags } : {})),
                                })];
                        case 4:
                            _f.sent();
                            return [4 /*yield*/, prisma.message.findUniqueOrThrow({
                                    where: { id: params.message_id },
                                })];
                        case 5:
                            dbMessage = _f.sent();
                            return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                                    where: { id: dbMessage.authorId },
                                })];
                        case 6:
                            author = _f.sent();
                            guildId = (_e = channel.guildId) !== null && _e !== void 0 ? _e : undefined;
                            if (!guildId) return [3 /*break*/, 8];
                            return [4 /*yield*/, prisma.guildMember.findUnique({
                                    where: {
                                        guildId_userId: { guildId: guildId, userId: dbMessage.authorId },
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
                            member = _c;
                            apiMessage = (0, serializers_js_1.messageToAPI)(dbMessage, author, guildId, member !== null && member !== void 0 ? member : undefined);
                            gateway.broadcast(v10_1.GatewayDispatchEvents.MessageUpdate, __assign(__assign({}, apiMessage), { guild_id: guildId }));
                            return [2 /*return*/, apiMessage];
                    }
                });
            });
        },
    })
        .route({
        method: 'DELETE',
        path: '/channels/:channel_id/messages/:message_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var channel, existing;
                var _c;
                var params = _b.params;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, prisma.channel.findUnique({
                                where: { id: params.channel_id },
                            })];
                        case 1:
                            channel = _d.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.message.findUnique({
                                    where: { id: params.message_id },
                                })];
                        case 2:
                            existing = _d.sent();
                            if (!existing) {
                                throw new Response(JSON.stringify({
                                    code: 10008,
                                    message: 'Unknown Message',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.message.delete({ where: { id: params.message_id } })];
                        case 3:
                            _d.sent();
                            gateway.broadcast(v10_1.GatewayDispatchEvents.MessageDelete, {
                                id: params.message_id,
                                channel_id: params.channel_id,
                                guild_id: (_c = channel.guildId) !== null && _c !== void 0 ? _c : undefined,
                            });
                            return [2 /*return*/, new Response(null, { status: 204 })];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/channels/:channel_id/messages',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var channel, url, before, after, parsedLimit, limit, messages, beforeBigInt_1, afterBigInt_1, guildId, result, _i, messages_1, msg, author, member, _c;
                var _d, _e;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, prisma.channel.findUnique({
                                where: { id: params.channel_id },
                            })];
                        case 1:
                            channel = _f.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            url = new URL(request.url, 'http://localhost');
                            before = url.searchParams.get('before');
                            after = url.searchParams.get('after');
                            parsedLimit = parseInt((_d = url.searchParams.get('limit')) !== null && _d !== void 0 ? _d : '50', 10);
                            limit = Math.min(Number.isNaN(parsedLimit) ? 50 : parsedLimit, 100);
                            return [4 /*yield*/, prisma.message.findMany({
                                    where: { channelId: params.channel_id },
                                })];
                        case 2:
                            messages = _f.sent();
                            if (before) {
                                beforeBigInt_1 = BigInt(before);
                                messages = messages.filter(function (m) { return BigInt(m.id) < beforeBigInt_1; });
                            }
                            if (after) {
                                afterBigInt_1 = BigInt(after);
                                messages = messages.filter(function (m) { return BigInt(m.id) > afterBigInt_1; });
                            }
                            // Discord returns desc by default, asc when `after` is specified
                            messages.sort(function (a, b) {
                                var cmp = Number(BigInt(a.id) - BigInt(b.id));
                                return after ? cmp : -cmp;
                            });
                            messages = messages.slice(0, limit);
                            guildId = (_e = channel.guildId) !== null && _e !== void 0 ? _e : undefined;
                            result = [];
                            _i = 0, messages_1 = messages;
                            _f.label = 3;
                        case 3:
                            if (!(_i < messages_1.length)) return [3 /*break*/, 9];
                            msg = messages_1[_i];
                            return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                                    where: { id: msg.authorId },
                                })];
                        case 4:
                            author = _f.sent();
                            if (!guildId) return [3 /*break*/, 6];
                            return [4 /*yield*/, prisma.guildMember.findUnique({
                                    where: { guildId_userId: { guildId: guildId, userId: msg.authorId } },
                                    include: { user: true },
                                })];
                        case 5:
                            _c = _f.sent();
                            return [3 /*break*/, 7];
                        case 6:
                            _c = null;
                            _f.label = 7;
                        case 7:
                            member = _c;
                            result.push((0, serializers_js_1.messageToAPI)(msg, author, guildId, member !== null && member !== void 0 ? member : undefined));
                            _f.label = 8;
                        case 8:
                            _i++;
                            return [3 /*break*/, 3];
                        case 9: return [2 /*return*/, new Response(JSON.stringify(result), {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' },
                            })];
                    }
                });
            });
        },
    })
        .route({
        method: 'POST',
        path: '/channels/:channel_id/typing',
        handler: function (_a) {
            var params = _a.params;
            typingEvents.push({
                channelId: params.channel_id,
                timestamp: Date.now(),
            });
            if (typingEvents.length > 5000) {
                typingEvents.splice(0, typingEvents.length - 5000);
            }
            return new Response(null, { status: 204 });
        },
    })
        // --- Reactions ---
        .route({
        method: 'PUT',
        path: '/channels/:channel_id/messages/:message_id/reactions/:emoji/@me',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var emoji, channel, message;
                var _c;
                var params = _b.params;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            emoji = decodeURIComponent(params.emoji);
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: params.channel_id },
                                })];
                        case 1:
                            channel = _d.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.message.findUnique({
                                    where: { id: params.message_id },
                                })];
                        case 2:
                            message = _d.sent();
                            if (!message) {
                                throw new Response(JSON.stringify({
                                    code: 10008,
                                    message: 'Unknown Message',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.reaction.upsert({
                                    where: {
                                        messageId_userId_emoji: {
                                            messageId: params.message_id,
                                            userId: botUserId,
                                            emoji: emoji,
                                        },
                                    },
                                    create: {
                                        messageId: params.message_id,
                                        userId: botUserId,
                                        emoji: emoji,
                                    },
                                    update: {},
                                })];
                        case 3:
                            _d.sent();
                            gateway.broadcast(v10_1.GatewayDispatchEvents.MessageReactionAdd, {
                                user_id: botUserId,
                                channel_id: params.channel_id,
                                message_id: params.message_id,
                                guild_id: (_c = channel.guildId) !== null && _c !== void 0 ? _c : undefined,
                                emoji: { id: null, name: emoji },
                            });
                            return [2 /*return*/, new Response(null, { status: 204 })];
                    }
                });
            });
        },
    })
        .route({
        method: 'DELETE',
        path: '/channels/:channel_id/messages/:message_id/reactions/:emoji/@me',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var emoji, channel;
                var _c;
                var params = _b.params;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            emoji = decodeURIComponent(params.emoji);
                            return [4 /*yield*/, prisma.reaction.deleteMany({
                                    where: {
                                        messageId: params.message_id,
                                        userId: botUserId,
                                        emoji: emoji,
                                    },
                                })];
                        case 1:
                            _d.sent();
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: params.channel_id },
                                })];
                        case 2:
                            channel = _d.sent();
                            gateway.broadcast(v10_1.GatewayDispatchEvents.MessageReactionRemove, {
                                user_id: botUserId,
                                channel_id: params.channel_id,
                                message_id: params.message_id,
                                guild_id: (_c = channel === null || channel === void 0 ? void 0 : channel.guildId) !== null && _c !== void 0 ? _c : undefined,
                                emoji: { id: null, name: emoji },
                            });
                            return [2 /*return*/, new Response(null, { status: 204 })];
                    }
                });
            });
        },
    })
        // --- Channels ---
        .route({
        method: 'GET',
        path: '/channels/:channel_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var channel;
                var params = _b.params;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, prisma.channel.findUnique({
                                where: { id: params.channel_id },
                            })];
                        case 1:
                            channel = _c.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [2 /*return*/, (0, serializers_js_1.channelToAPI)(channel)];
                    }
                });
            });
        },
    })
        .route({
        method: 'PATCH',
        path: '/channels/:channel_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, channel, isThread, updated, apiChannel, event;
                var _c;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_d.sent());
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: params.channel_id },
                                })];
                        case 2:
                            channel = _d.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            isThread = isThreadChannelType(channel.type);
                            return [4 /*yield*/, prisma.channel.update({
                                    where: { id: params.channel_id },
                                    data: __assign(__assign(__assign(__assign(__assign(__assign({}, (body.name != null ? { name: body.name } : {})), (body.topic !== undefined ? { topic: (_c = body.topic) !== null && _c !== void 0 ? _c : null } : {})), (body.archived != null
                                        ? {
                                            archived: body.archived,
                                            archiveTimestamp: new Date(),
                                        }
                                        : {})), (body.locked != null ? { locked: body.locked } : {})), (body.auto_archive_duration != null
                                        ? { autoArchiveDuration: body.auto_archive_duration }
                                        : {})), (body.rate_limit_per_user != null
                                        ? { rateLimitPerUser: body.rate_limit_per_user }
                                        : {})),
                                })];
                        case 3:
                            _d.sent();
                            return [4 /*yield*/, prisma.channel.findUniqueOrThrow({
                                    where: { id: params.channel_id },
                                })];
                        case 4:
                            updated = _d.sent();
                            apiChannel = (0, serializers_js_1.channelToAPI)(updated);
                            event = isThread
                                ? v10_1.GatewayDispatchEvents.ThreadUpdate
                                : v10_1.GatewayDispatchEvents.ChannelUpdate;
                            gateway.broadcast(event, apiChannel);
                            return [2 /*return*/, apiChannel];
                    }
                });
            });
        },
    })
        .route({
        method: 'DELETE',
        path: '/channels/:channel_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var channel, isThread, apiChannel;
                var params = _b.params;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, prisma.channel.findUnique({
                                where: { id: params.channel_id },
                            })];
                        case 1:
                            channel = _c.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            isThread = isThreadChannelType(channel.type);
                            apiChannel = (0, serializers_js_1.channelToAPI)(channel);
                            return [4 /*yield*/, prisma.channel.delete({ where: { id: params.channel_id } })];
                        case 2:
                            _c.sent();
                            if (isThread) {
                                gateway.broadcast(v10_1.GatewayDispatchEvents.ThreadDelete, {
                                    id: channel.id,
                                    guild_id: channel.guildId,
                                    parent_id: channel.parentId,
                                    type: channel.type,
                                });
                            }
                            else {
                                gateway.broadcast(v10_1.GatewayDispatchEvents.ChannelDelete, apiChannel);
                            }
                            return [2 /*return*/, apiChannel];
                    }
                });
            });
        },
    })
        // --- Threads ---
        .route({
        method: 'POST',
        path: '/channels/:channel_id/threads',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, channel, threadId, threadType, thread, apiChannel, withCreated;
                var _c, _d, _e;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_f.sent());
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: params.channel_id },
                                })];
                        case 2:
                            channel = _f.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            threadId = (0, snowflake_js_1.generateSnowflake)();
                            threadType = (_c = body.type) !== null && _c !== void 0 ? _c : v10_1.ChannelType.PublicThread;
                            return [4 /*yield*/, prisma.channel.create({
                                    data: {
                                        id: threadId,
                                        guildId: channel.guildId,
                                        type: threadType,
                                        name: body.name,
                                        parentId: params.channel_id,
                                        ownerId: botUserId,
                                        autoArchiveDuration: (_d = body.auto_archive_duration) !== null && _d !== void 0 ? _d : 1440,
                                        archiveTimestamp: new Date(),
                                        rateLimitPerUser: (_e = body.rate_limit_per_user) !== null && _e !== void 0 ? _e : 0,
                                        memberCount: 1,
                                    },
                                })
                                // Auto-add creator as thread member
                            ];
                        case 3:
                            _f.sent();
                            // Auto-add creator as thread member
                            return [4 /*yield*/, prisma.threadMember.create({
                                    data: { channelId: threadId, userId: botUserId },
                                })];
                        case 4:
                            // Auto-add creator as thread member
                            _f.sent();
                            return [4 /*yield*/, prisma.channel.findUniqueOrThrow({
                                    where: { id: threadId },
                                })];
                        case 5:
                            thread = _f.sent();
                            apiChannel = (0, serializers_js_1.channelToAPI)(thread);
                            withCreated = __assign(__assign({}, apiChannel), { newly_created: true });
                            gateway.broadcast(v10_1.GatewayDispatchEvents.ThreadCreate, withCreated);
                            return [2 /*return*/, withCreated];
                    }
                });
            });
        },
    })
        .route({
        method: 'POST',
        path: '/channels/:channel_id/messages/:message_id/threads',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, channel, message, existingThread, threadId, thread, apiChannel, withCreated;
                var _c, _d;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_e.sent());
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: params.channel_id },
                                })];
                        case 2:
                            channel = _e.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.message.findUnique({
                                    where: { id: params.message_id },
                                })];
                        case 3:
                            message = _e.sent();
                            if (!message) {
                                throw new Response(JSON.stringify({
                                    code: 10008,
                                    message: 'Unknown Message',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.channel.findFirst({
                                    where: { starterMessageId: params.message_id },
                                })];
                        case 4:
                            existingThread = _e.sent();
                            if (existingThread) {
                                throw new Response(JSON.stringify({
                                    code: 160004,
                                    message: 'A thread has already been created for this message',
                                    errors: {},
                                }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                            }
                            threadId = (0, snowflake_js_1.generateSnowflake)();
                            return [4 /*yield*/, prisma.channel.create({
                                    data: {
                                        id: threadId,
                                        guildId: channel.guildId,
                                        type: v10_1.ChannelType.PublicThread,
                                        name: body.name,
                                        parentId: params.channel_id,
                                        ownerId: botUserId,
                                        autoArchiveDuration: (_c = body.auto_archive_duration) !== null && _c !== void 0 ? _c : 1440,
                                        archiveTimestamp: new Date(),
                                        rateLimitPerUser: (_d = body.rate_limit_per_user) !== null && _d !== void 0 ? _d : 0,
                                        starterMessageId: params.message_id,
                                        memberCount: 1,
                                    },
                                })];
                        case 5:
                            _e.sent();
                            return [4 /*yield*/, prisma.threadMember.create({
                                    data: { channelId: threadId, userId: botUserId },
                                })];
                        case 6:
                            _e.sent();
                            return [4 /*yield*/, prisma.channel.findUniqueOrThrow({
                                    where: { id: threadId },
                                })];
                        case 7:
                            thread = _e.sent();
                            apiChannel = (0, serializers_js_1.channelToAPI)(thread);
                            withCreated = __assign(__assign({}, apiChannel), { newly_created: true });
                            gateway.broadcast(v10_1.GatewayDispatchEvents.ThreadCreate, withCreated);
                            return [2 /*return*/, withCreated];
                    }
                });
            });
        },
    })
        .route({
        method: 'PUT',
        path: '/channels/:channel_id/thread-members/:user_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var channel, existing, threadMember;
                var params = _b.params;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, prisma.channel.findUnique({
                                where: { id: params.channel_id },
                            })];
                        case 1:
                            channel = _c.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.threadMember.findUnique({
                                    where: {
                                        channelId_userId: {
                                            channelId: params.channel_id,
                                            userId: params.user_id,
                                        },
                                    },
                                })];
                        case 2:
                            existing = _c.sent();
                            if (!!existing) return [3 /*break*/, 6];
                            return [4 /*yield*/, prisma.threadMember.create({
                                    data: { channelId: params.channel_id, userId: params.user_id },
                                })];
                        case 3:
                            _c.sent();
                            return [4 /*yield*/, prisma.channel.update({
                                    where: { id: params.channel_id },
                                    data: { memberCount: { increment: 1 } },
                                })];
                        case 4:
                            _c.sent();
                            return [4 /*yield*/, prisma.threadMember.findUniqueOrThrow({
                                    where: {
                                        channelId_userId: {
                                            channelId: params.channel_id,
                                            userId: params.user_id,
                                        },
                                    },
                                })];
                        case 5:
                            threadMember = _c.sent();
                            gateway.broadcast(v10_1.GatewayDispatchEvents.ThreadMembersUpdate, {
                                id: params.channel_id,
                                guild_id: channel.guildId,
                                member_count: channel.memberCount + 1,
                                added_members: [(0, serializers_js_1.threadMemberToAPI)(threadMember)],
                                removed_member_ids: [],
                            });
                            _c.label = 6;
                        case 6: return [2 /*return*/, new Response(null, { status: 204 })];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/channels/:channel_id/thread-members',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var channel, members;
                var params = _b.params;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, prisma.channel.findUnique({
                                where: { id: params.channel_id },
                            })];
                        case 1:
                            channel = _c.sent();
                            if (!channel) {
                                throw new Response(JSON.stringify({
                                    code: 10003,
                                    message: 'Unknown Channel',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.threadMember.findMany({
                                    where: { channelId: params.channel_id },
                                })];
                        case 2:
                            members = _c.sent();
                            return [2 /*return*/, new Response(JSON.stringify(members.map(serializers_js_1.threadMemberToAPI)), {
                                    status: 200,
                                    headers: { 'Content-Type': 'application/json' },
                                })];
                    }
                });
            });
        },
    })
        // --- Guilds ---
        .route({
        method: 'GET',
        path: '/guilds/:guild_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var guild;
                var params = _b.params;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, prisma.guild.findUnique({
                                where: { id: params.guild_id },
                                include: { roles: true },
                            })];
                        case 1:
                            guild = _c.sent();
                            if (!guild) {
                                throw new Response(JSON.stringify({
                                    code: 10004,
                                    message: 'Unknown Guild',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [2 /*return*/, (0, serializers_js_1.guildToAPI)(guild)];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/guilds/:guild_id/channels',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var guild, channels;
                var params = _b.params;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, prisma.guild.findUnique({
                                where: { id: params.guild_id },
                            })];
                        case 1:
                            guild = _c.sent();
                            if (!guild) {
                                throw new Response(JSON.stringify({
                                    code: 10004,
                                    message: 'Unknown Guild',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.channel.findMany({
                                    where: {
                                        guildId: params.guild_id,
                                        type: { notIn: THREAD_CHANNEL_TYPES },
                                    },
                                    orderBy: { position: 'asc' },
                                })];
                        case 2:
                            channels = _c.sent();
                            return [2 /*return*/, channels.map(serializers_js_1.channelToAPI)];
                    }
                });
            });
        },
    })
        .route({
        method: 'POST',
        path: '/guilds/:guild_id/channels',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, guild, channelId, channel, apiChannel;
                var _c, _d, _e, _f;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_g.sent());
                            return [4 /*yield*/, prisma.guild.findUnique({
                                    where: { id: params.guild_id },
                                })];
                        case 2:
                            guild = _g.sent();
                            if (!guild) {
                                throw new Response(JSON.stringify({
                                    code: 10004,
                                    message: 'Unknown Guild',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            channelId = (0, snowflake_js_1.generateSnowflake)();
                            return [4 /*yield*/, prisma.channel.create({
                                    data: {
                                        id: channelId,
                                        guildId: params.guild_id,
                                        type: (_c = body.type) !== null && _c !== void 0 ? _c : v10_1.ChannelType.GuildText,
                                        name: body.name,
                                        topic: (_d = body.topic) !== null && _d !== void 0 ? _d : null,
                                        parentId: body.parent_id != null ? String(body.parent_id) : null,
                                        position: (_e = body.position) !== null && _e !== void 0 ? _e : 0,
                                        rateLimitPerUser: (_f = body.rate_limit_per_user) !== null && _f !== void 0 ? _f : 0,
                                    },
                                })];
                        case 3:
                            _g.sent();
                            return [4 /*yield*/, prisma.channel.findUniqueOrThrow({
                                    where: { id: channelId },
                                })];
                        case 4:
                            channel = _g.sent();
                            apiChannel = (0, serializers_js_1.channelToAPI)(channel);
                            gateway.broadcast(v10_1.GatewayDispatchEvents.ChannelCreate, apiChannel);
                            return [2 /*return*/, apiChannel];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/guilds/:guild_id/roles',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var guild, roles;
                var params = _b.params;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, prisma.guild.findUnique({
                                where: { id: params.guild_id },
                            })];
                        case 1:
                            guild = _c.sent();
                            if (!guild) {
                                throw new Response(JSON.stringify({
                                    code: 10004,
                                    message: 'Unknown Guild',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.role.findMany({
                                    where: { guildId: params.guild_id },
                                    orderBy: { position: 'asc' },
                                })];
                        case 2:
                            roles = _c.sent();
                            return [2 /*return*/, roles.map(serializers_js_1.roleToAPI)];
                    }
                });
            });
        },
    })
        .route({
        method: 'POST',
        path: '/guilds/:guild_id/roles',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, guild, roleCount, roleId, role, apiRole;
                var _c, _d, _e, _f;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_g.sent());
                            return [4 /*yield*/, prisma.guild.findUnique({
                                    where: { id: params.guild_id },
                                })];
                        case 2:
                            guild = _g.sent();
                            if (!guild) {
                                throw new Response(JSON.stringify({
                                    code: 10004,
                                    message: 'Unknown Guild',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.role.count({
                                    where: { guildId: params.guild_id },
                                })];
                        case 3:
                            roleCount = _g.sent();
                            roleId = (0, snowflake_js_1.generateSnowflake)();
                            return [4 /*yield*/, prisma.role.create({
                                    data: {
                                        id: roleId,
                                        guildId: params.guild_id,
                                        name: (_c = body.name) !== null && _c !== void 0 ? _c : 'new role',
                                        color: (_d = body.color) !== null && _d !== void 0 ? _d : 0,
                                        hoist: (_e = body.hoist) !== null && _e !== void 0 ? _e : false,
                                        position: roleCount,
                                        permissions: body.permissions != null ? String(body.permissions) : '0',
                                        mentionable: (_f = body.mentionable) !== null && _f !== void 0 ? _f : false,
                                    },
                                })];
                        case 4:
                            _g.sent();
                            return [4 /*yield*/, prisma.role.findUniqueOrThrow({ where: { id: roleId } })];
                        case 5:
                            role = _g.sent();
                            apiRole = (0, serializers_js_1.roleToAPI)(role);
                            gateway.broadcast(v10_1.GatewayDispatchEvents.GuildRoleCreate, {
                                guild_id: params.guild_id,
                                role: apiRole,
                            });
                            return [2 /*return*/, apiRole];
                    }
                });
            });
        },
    })
        .route({
        method: 'PATCH',
        path: '/guilds/:guild_id/roles/:role_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, role, updatedRole, apiRole;
                var _c, _d, _e, _f;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_g) {
                    switch (_g.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_g.sent());
                            return [4 /*yield*/, prisma.role.findFirst({
                                    where: {
                                        id: params.role_id,
                                        guildId: params.guild_id,
                                    },
                                })];
                        case 2:
                            role = _g.sent();
                            if (!role) {
                                throw new Response(JSON.stringify({
                                    code: 10011,
                                    message: 'Unknown Role',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.role.update({
                                    where: { id: params.role_id },
                                    data: __assign(__assign(__assign(__assign(__assign({}, (body.name !== undefined ? { name: (_c = body.name) !== null && _c !== void 0 ? _c : 'new role' } : {})), (body.color !== undefined ? { color: (_d = body.color) !== null && _d !== void 0 ? _d : 0 } : {})), (body.hoist !== undefined ? { hoist: (_e = body.hoist) !== null && _e !== void 0 ? _e : false } : {})), (body.permissions !== undefined
                                        ? { permissions: body.permissions != null ? String(body.permissions) : '0' }
                                        : {})), (body.mentionable !== undefined
                                        ? { mentionable: (_f = body.mentionable) !== null && _f !== void 0 ? _f : false }
                                        : {})),
                                })];
                        case 3:
                            _g.sent();
                            return [4 /*yield*/, prisma.role.findUniqueOrThrow({
                                    where: { id: params.role_id },
                                })];
                        case 4:
                            updatedRole = _g.sent();
                            apiRole = (0, serializers_js_1.roleToAPI)(updatedRole);
                            gateway.broadcast(v10_1.GatewayDispatchEvents.GuildRoleUpdate, {
                                guild_id: params.guild_id,
                                role: apiRole,
                            });
                            return [2 /*return*/, apiRole];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/guilds/:guild_id/members/search',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var guild, url, query, parsedLimit, limit, members;
                var _c, _d;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0: return [4 /*yield*/, prisma.guild.findUnique({
                                where: { id: params.guild_id },
                            })];
                        case 1:
                            guild = _e.sent();
                            if (!guild) {
                                throw new Response(JSON.stringify({
                                    code: 10004,
                                    message: 'Unknown Guild',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            url = new URL(request.url, 'http://localhost');
                            query = (_c = url.searchParams.get('query')) !== null && _c !== void 0 ? _c : '';
                            parsedLimit = parseInt((_d = url.searchParams.get('limit')) !== null && _d !== void 0 ? _d : '1', 10);
                            limit = Math.min(Number.isNaN(parsedLimit) ? 1 : parsedLimit, 1000);
                            return [4 /*yield*/, prisma.guildMember.findMany({
                                    where: {
                                        guildId: params.guild_id,
                                        OR: [
                                            { user: { username: { contains: query } } },
                                            { nick: { contains: query } },
                                        ],
                                    },
                                    include: { user: true },
                                    take: limit,
                                })];
                        case 2:
                            members = _e.sent();
                            return [2 /*return*/, members.map(serializers_js_1.memberToAPI)];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/guilds/:guild_id/members',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var guild, url, after, parsedLimit, limit, members;
                var _c;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, prisma.guild.findUnique({
                                where: { id: params.guild_id },
                            })];
                        case 1:
                            guild = _d.sent();
                            if (!guild) {
                                throw new Response(JSON.stringify({
                                    code: 10004,
                                    message: 'Unknown Guild',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            url = new URL(request.url, 'http://localhost');
                            after = url.searchParams.get('after');
                            parsedLimit = parseInt((_c = url.searchParams.get('limit')) !== null && _c !== void 0 ? _c : '1', 10);
                            limit = Math.min(Number.isNaN(parsedLimit) ? 1 : parsedLimit, 1000);
                            return [4 /*yield*/, prisma.guildMember.findMany({
                                    where: __assign({ guildId: params.guild_id }, (after ? { userId: { gt: after } } : {})),
                                    include: { user: true },
                                    orderBy: { userId: 'asc' },
                                    take: limit,
                                })];
                        case 2:
                            members = _d.sent();
                            return [2 /*return*/, members.map(serializers_js_1.memberToAPI)];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/guilds/:guild_id/members/:user_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var member;
                var params = _b.params;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0: return [4 /*yield*/, prisma.guildMember.findUnique({
                                where: {
                                    guildId_userId: {
                                        guildId: params.guild_id,
                                        userId: params.user_id,
                                    },
                                },
                                include: { user: true },
                            })];
                        case 1:
                            member = _c.sent();
                            if (!member) {
                                throw new Response(JSON.stringify({
                                    code: 10007,
                                    message: 'Unknown Member',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [2 /*return*/, (0, serializers_js_1.memberToAPI)(member)];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/guilds/:guild_id/threads/active',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var guild, threads, threadIds, threadMembers, _c;
                var params = _b.params;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0: return [4 /*yield*/, prisma.guild.findUnique({
                                where: { id: params.guild_id },
                            })];
                        case 1:
                            guild = _d.sent();
                            if (!guild) {
                                throw new Response(JSON.stringify({
                                    code: 10004,
                                    message: 'Unknown Guild',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.channel.findMany({
                                    where: {
                                        guildId: params.guild_id,
                                        type: { in: THREAD_CHANNEL_TYPES },
                                        archived: false,
                                    },
                                    orderBy: { createdAt: 'desc' },
                                })];
                        case 2:
                            threads = _d.sent();
                            threadIds = threads.map(function (thread) {
                                return thread.id;
                            });
                            if (!(threadIds.length === 0)) return [3 /*break*/, 3];
                            _c = [];
                            return [3 /*break*/, 5];
                        case 3: return [4 /*yield*/, prisma.threadMember.findMany({
                                where: { channelId: { in: threadIds } },
                            })];
                        case 4:
                            _c = _d.sent();
                            _d.label = 5;
                        case 5:
                            threadMembers = _c;
                            return [2 /*return*/, {
                                    threads: threads.map(serializers_js_1.channelToAPI),
                                    members: threadMembers.map(serializers_js_1.threadMemberToAPI),
                                }];
                    }
                });
            });
        },
    })
        // --- Interactions ---
        .route({
        method: 'POST',
        path: '/interactions/:interaction_id/:interaction_token/callback',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, existing, callbackType, messageId, data, dbMessage, author, channel, guildId, member, _c, apiMessage, origMessage, dbMessage, author, channel, guildId, member, _d, apiMessage;
                var _e, _f, _g, _h, _j, _k, _l, _m;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_o) {
                    switch (_o.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_o.sent());
                            return [4 /*yield*/, prisma.interactionResponse.findUnique({
                                    where: { interactionId: params.interaction_id },
                                })];
                        case 2:
                            existing = _o.sent();
                            if (!existing) {
                                throw new Response(JSON.stringify({
                                    code: 10062,
                                    message: 'Unknown Interaction',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            if (existing.acknowledged) {
                                throw new Response(JSON.stringify({
                                    code: 40060,
                                    message: 'Interaction has already been acknowledged',
                                    errors: {},
                                }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                            }
                            callbackType = body.type;
                            messageId = existing.messageId;
                            data = ('data' in body ? body.data : null);
                            if (!(callbackType === v10_1.InteractionResponseType.ChannelMessageWithSource)) return [3 /*break*/, 11];
                            messageId = (0, snowflake_js_1.generateSnowflake)();
                            return [4 /*yield*/, prisma.message.create({
                                    data: {
                                        id: messageId,
                                        channelId: existing.channelId,
                                        authorId: botUserId,
                                        content: (_e = data === null || data === void 0 ? void 0 : data.content) !== null && _e !== void 0 ? _e : '',
                                        tts: (_f = data === null || data === void 0 ? void 0 : data.tts) !== null && _f !== void 0 ? _f : false,
                                        flags: (_g = data === null || data === void 0 ? void 0 : data.flags) !== null && _g !== void 0 ? _g : 0,
                                        embeds: JSON.stringify((_h = data === null || data === void 0 ? void 0 : data.embeds) !== null && _h !== void 0 ? _h : []),
                                        components: JSON.stringify((_j = data === null || data === void 0 ? void 0 : data.components) !== null && _j !== void 0 ? _j : []),
                                        webhookId: existing.applicationId,
                                        applicationId: existing.applicationId,
                                        type: v10_1.MessageType.Default,
                                    },
                                })];
                        case 3:
                            _o.sent();
                            return [4 /*yield*/, prisma.channel.update({
                                    where: { id: existing.channelId },
                                    data: {
                                        lastMessageId: messageId,
                                        messageCount: { increment: 1 },
                                        totalMessageSent: { increment: 1 },
                                    },
                                })];
                        case 4:
                            _o.sent();
                            return [4 /*yield*/, prisma.message.findUniqueOrThrow({
                                    where: { id: messageId },
                                })];
                        case 5:
                            dbMessage = _o.sent();
                            return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                                    where: { id: botUserId },
                                })];
                        case 6:
                            author = _o.sent();
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: existing.channelId },
                                })];
                        case 7:
                            channel = _o.sent();
                            guildId = (_k = channel === null || channel === void 0 ? void 0 : channel.guildId) !== null && _k !== void 0 ? _k : undefined;
                            if (!guildId) return [3 /*break*/, 9];
                            return [4 /*yield*/, prisma.guildMember.findUnique({
                                    where: { guildId_userId: { guildId: guildId, userId: botUserId } },
                                    include: { user: true },
                                })];
                        case 8:
                            _c = _o.sent();
                            return [3 /*break*/, 10];
                        case 9:
                            _c = null;
                            _o.label = 10;
                        case 10:
                            member = _c;
                            apiMessage = (0, serializers_js_1.messageToAPI)(dbMessage, author, guildId, member !== null && member !== void 0 ? member : undefined);
                            gateway.broadcastMessageCreate(apiMessage, guildId !== null && guildId !== void 0 ? guildId : '');
                            return [3 /*break*/, 20];
                        case 11:
                            if (!(callbackType === v10_1.InteractionResponseType.UpdateMessage)) return [3 /*break*/, 20];
                            messageId = existing.messageId;
                            if (!messageId) {
                                throw new Response(JSON.stringify({
                                    code: 40060,
                                    message: 'Interaction is not attached to a message',
                                    errors: {},
                                }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.message.findUnique({
                                    where: { id: messageId },
                                })];
                        case 12:
                            origMessage = _o.sent();
                            if (!origMessage) {
                                throw new Response(JSON.stringify({
                                    code: 10008,
                                    message: 'Unknown Message',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.message.update({
                                    where: { id: messageId },
                                    data: __assign(__assign(__assign({ content: (_l = data === null || data === void 0 ? void 0 : data.content) !== null && _l !== void 0 ? _l : origMessage.content, editedTimestamp: new Date() }, ((data === null || data === void 0 ? void 0 : data.embeds) ? { embeds: JSON.stringify(data.embeds) } : {})), ((data === null || data === void 0 ? void 0 : data.components)
                                        ? { components: JSON.stringify(data.components) }
                                        : {})), ((data === null || data === void 0 ? void 0 : data.flags) != null ? { flags: data.flags } : {})),
                                })];
                        case 13:
                            _o.sent();
                            return [4 /*yield*/, prisma.message.findUniqueOrThrow({
                                    where: { id: messageId },
                                })];
                        case 14:
                            dbMessage = _o.sent();
                            return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                                    where: { id: dbMessage.authorId },
                                })];
                        case 15:
                            author = _o.sent();
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: dbMessage.channelId },
                                })];
                        case 16:
                            channel = _o.sent();
                            guildId = (_m = channel === null || channel === void 0 ? void 0 : channel.guildId) !== null && _m !== void 0 ? _m : undefined;
                            if (!guildId) return [3 /*break*/, 18];
                            return [4 /*yield*/, prisma.guildMember.findUnique({
                                    where: {
                                        guildId_userId: { guildId: guildId, userId: dbMessage.authorId },
                                    },
                                    include: { user: true },
                                })];
                        case 17:
                            _d = _o.sent();
                            return [3 /*break*/, 19];
                        case 18:
                            _d = null;
                            _o.label = 19;
                        case 19:
                            member = _d;
                            apiMessage = (0, serializers_js_1.messageToAPI)(dbMessage, author, guildId, member !== null && member !== void 0 ? member : undefined);
                            gateway.broadcast(v10_1.GatewayDispatchEvents.MessageUpdate, __assign(__assign({}, apiMessage), { guild_id: guildId }));
                            _o.label = 20;
                        case 20: 
                        // Mark interaction as acknowledged and store the response
                        return [4 /*yield*/, prisma.interactionResponse.update({
                                where: { interactionId: params.interaction_id },
                                data: {
                                    acknowledged: true,
                                    type: callbackType,
                                    messageId: messageId,
                                    data: data ? JSON.stringify(data) : null,
                                },
                            })];
                        case 21:
                            // Mark interaction as acknowledged and store the response
                            _o.sent();
                            return [2 /*return*/, new Response(null, { status: 204 })];
                    }
                });
            });
        },
    })
        // --- Webhook endpoints for interaction follow-ups and edits ---
        // discord.js (via undici) URL-encodes @original to %40original, so we
        // use :message_id params and resolve @original inside each handler.
        .route({
        method: 'POST',
        path: '/webhooks/:webhook_id/:webhook_token',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, interaction, messageId, dbMessage, author, channel, guildId, member, _c, apiMessage;
                var _d, _e, _f, _g, _h, _j;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_k) {
                    switch (_k.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_k.sent());
                            return [4 /*yield*/, prisma.interactionResponse.findUnique({
                                    where: { interactionToken: params.webhook_token },
                                })];
                        case 2:
                            interaction = _k.sent();
                            if (!interaction) {
                                throw new Response(JSON.stringify({
                                    code: 10062,
                                    message: 'Unknown Interaction',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            messageId = (0, snowflake_js_1.generateSnowflake)();
                            return [4 /*yield*/, prisma.message.create({
                                    data: {
                                        id: messageId,
                                        channelId: interaction.channelId,
                                        authorId: botUserId,
                                        content: (_d = body.content) !== null && _d !== void 0 ? _d : '',
                                        tts: (_e = body.tts) !== null && _e !== void 0 ? _e : false,
                                        flags: (_f = body.flags) !== null && _f !== void 0 ? _f : 0,
                                        embeds: JSON.stringify((_g = body.embeds) !== null && _g !== void 0 ? _g : []),
                                        components: JSON.stringify((_h = body.components) !== null && _h !== void 0 ? _h : []),
                                        webhookId: interaction.applicationId,
                                        applicationId: interaction.applicationId,
                                        type: v10_1.MessageType.Default,
                                    },
                                })];
                        case 3:
                            _k.sent();
                            return [4 /*yield*/, prisma.channel.update({
                                    where: { id: interaction.channelId },
                                    data: {
                                        lastMessageId: messageId,
                                        messageCount: { increment: 1 },
                                        totalMessageSent: { increment: 1 },
                                    },
                                })];
                        case 4:
                            _k.sent();
                            return [4 /*yield*/, prisma.message.findUniqueOrThrow({
                                    where: { id: messageId },
                                })];
                        case 5:
                            dbMessage = _k.sent();
                            return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                                    where: { id: botUserId },
                                })];
                        case 6:
                            author = _k.sent();
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: interaction.channelId },
                                })];
                        case 7:
                            channel = _k.sent();
                            guildId = (_j = channel === null || channel === void 0 ? void 0 : channel.guildId) !== null && _j !== void 0 ? _j : undefined;
                            if (!guildId) return [3 /*break*/, 9];
                            return [4 /*yield*/, prisma.guildMember.findUnique({
                                    where: { guildId_userId: { guildId: guildId, userId: botUserId } },
                                    include: { user: true },
                                })];
                        case 8:
                            _c = _k.sent();
                            return [3 /*break*/, 10];
                        case 9:
                            _c = null;
                            _k.label = 10;
                        case 10:
                            member = _c;
                            apiMessage = (0, serializers_js_1.messageToAPI)(dbMessage, author, guildId, member !== null && member !== void 0 ? member : undefined);
                            gateway.broadcastMessageCreate(apiMessage, guildId !== null && guildId !== void 0 ? guildId : '');
                            return [2 /*return*/, apiMessage];
                    }
                });
            });
        },
    })
        .route({
        method: 'GET',
        path: '/webhooks/:webhook_id/:webhook_token/messages/:message_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var resolvedId, messageId, dbMessage, author, channel, guildId, member, _c;
                var _this = this;
                var _d;
                var params = _b.params;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            resolvedId = resolveWebhookMessageId(params.message_id);
                            return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var interaction;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!(resolvedId === '@original')) return [3 /*break*/, 2];
                                                return [4 /*yield*/, prisma.interactionResponse.findUnique({
                                                        where: { interactionToken: params.webhook_token },
                                                    })];
                                            case 1:
                                                interaction = _a.sent();
                                                if (!interaction || !interaction.messageId) {
                                                    throw new Response(JSON.stringify({
                                                        code: 10008,
                                                        message: 'Unknown Message',
                                                        errors: {},
                                                    }), {
                                                        status: 404,
                                                        headers: { 'Content-Type': 'application/json' },
                                                    });
                                                }
                                                return [2 /*return*/, interaction.messageId];
                                            case 2: return [2 /*return*/, resolvedId];
                                        }
                                    });
                                }); })()];
                        case 1:
                            messageId = _e.sent();
                            return [4 /*yield*/, prisma.message.findUnique({
                                    where: { id: messageId },
                                })];
                        case 2:
                            dbMessage = _e.sent();
                            if (!dbMessage) {
                                throw new Response(JSON.stringify({
                                    code: 10008,
                                    message: 'Unknown Message',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                                    where: { id: dbMessage.authorId },
                                })];
                        case 3:
                            author = _e.sent();
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: dbMessage.channelId },
                                })];
                        case 4:
                            channel = _e.sent();
                            guildId = (_d = channel === null || channel === void 0 ? void 0 : channel.guildId) !== null && _d !== void 0 ? _d : undefined;
                            if (!guildId) return [3 /*break*/, 6];
                            return [4 /*yield*/, prisma.guildMember.findUnique({
                                    where: {
                                        guildId_userId: { guildId: guildId, userId: dbMessage.authorId },
                                    },
                                    include: { user: true },
                                })];
                        case 5:
                            _c = _e.sent();
                            return [3 /*break*/, 7];
                        case 6:
                            _c = null;
                            _e.label = 7;
                        case 7:
                            member = _c;
                            return [2 /*return*/, (0, serializers_js_1.messageToAPI)(dbMessage, author, guildId, member !== null && member !== void 0 ? member : undefined)];
                    }
                });
            });
        },
    })
        .route({
        method: 'PATCH',
        path: '/webhooks/:webhook_id/:webhook_token/messages/:message_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var body, resolvedId, wasNewlyCreated, messageId, existing, dbMessage, author, channel, guildId, member, _c, apiMessage;
                var _this = this;
                var _d, _e;
                var params = _b.params, request = _b.request;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, request.json()];
                        case 1:
                            body = (_f.sent());
                            resolvedId = resolveWebhookMessageId(params.message_id);
                            wasNewlyCreated = false;
                            return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var interaction, newId;
                                    var _a, _b, _c, _d;
                                    return __generator(this, function (_e) {
                                        switch (_e.label) {
                                            case 0:
                                                if (!(resolvedId === '@original')) return [3 /*break*/, 6];
                                                return [4 /*yield*/, prisma.interactionResponse.findUnique({
                                                        where: { interactionToken: params.webhook_token },
                                                    })];
                                            case 1:
                                                interaction = _e.sent();
                                                if (!interaction) {
                                                    throw new Response(JSON.stringify({
                                                        code: 10062,
                                                        message: 'Unknown Interaction',
                                                        errors: {},
                                                    }), {
                                                        status: 404,
                                                        headers: { 'Content-Type': 'application/json' },
                                                    });
                                                }
                                                if (!!interaction.messageId) return [3 /*break*/, 5];
                                                newId = (0, snowflake_js_1.generateSnowflake)();
                                                return [4 /*yield*/, prisma.message.create({
                                                        data: {
                                                            id: newId,
                                                            channelId: interaction.channelId,
                                                            authorId: botUserId,
                                                            content: (_a = body.content) !== null && _a !== void 0 ? _a : '',
                                                            flags: (_b = body.flags) !== null && _b !== void 0 ? _b : 0,
                                                            embeds: JSON.stringify((_c = body.embeds) !== null && _c !== void 0 ? _c : []),
                                                            components: JSON.stringify((_d = body.components) !== null && _d !== void 0 ? _d : []),
                                                            webhookId: interaction.applicationId,
                                                            applicationId: interaction.applicationId,
                                                            type: v10_1.MessageType.Default,
                                                        },
                                                    })];
                                            case 2:
                                                _e.sent();
                                                return [4 /*yield*/, prisma.channel.update({
                                                        where: { id: interaction.channelId },
                                                        data: {
                                                            lastMessageId: newId,
                                                            messageCount: { increment: 1 },
                                                            totalMessageSent: { increment: 1 },
                                                        },
                                                    })];
                                            case 3:
                                                _e.sent();
                                                return [4 /*yield*/, prisma.interactionResponse.update({
                                                        where: { interactionId: interaction.interactionId },
                                                        data: { messageId: newId },
                                                    })];
                                            case 4:
                                                _e.sent();
                                                wasNewlyCreated = true;
                                                return [2 /*return*/, newId];
                                            case 5: return [2 /*return*/, interaction.messageId];
                                            case 6: return [2 /*return*/, resolvedId];
                                        }
                                    });
                                }); })()];
                        case 2:
                            messageId = _f.sent();
                            return [4 /*yield*/, prisma.message.findUnique({
                                    where: { id: messageId },
                                })];
                        case 3:
                            existing = _f.sent();
                            if (!existing) {
                                throw new Response(JSON.stringify({
                                    code: 10008,
                                    message: 'Unknown Message',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            if (!!wasNewlyCreated) return [3 /*break*/, 5];
                            return [4 /*yield*/, prisma.message.update({
                                    where: { id: messageId },
                                    data: __assign(__assign(__assign({ content: (_d = body.content) !== null && _d !== void 0 ? _d : existing.content, editedTimestamp: new Date() }, (body.embeds ? { embeds: JSON.stringify(body.embeds) } : {})), (body.components
                                        ? { components: JSON.stringify(body.components) }
                                        : {})), (body.flags != null ? { flags: body.flags } : {})),
                                })];
                        case 4:
                            _f.sent();
                            _f.label = 5;
                        case 5: return [4 /*yield*/, prisma.message.findUniqueOrThrow({
                                where: { id: messageId },
                            })];
                        case 6:
                            dbMessage = _f.sent();
                            return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                                    where: { id: dbMessage.authorId },
                                })];
                        case 7:
                            author = _f.sent();
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: dbMessage.channelId },
                                })];
                        case 8:
                            channel = _f.sent();
                            guildId = (_e = channel === null || channel === void 0 ? void 0 : channel.guildId) !== null && _e !== void 0 ? _e : undefined;
                            if (!guildId) return [3 /*break*/, 10];
                            return [4 /*yield*/, prisma.guildMember.findUnique({
                                    where: {
                                        guildId_userId: { guildId: guildId, userId: dbMessage.authorId },
                                    },
                                    include: { user: true },
                                })];
                        case 9:
                            _c = _f.sent();
                            return [3 /*break*/, 11];
                        case 10:
                            _c = null;
                            _f.label = 11;
                        case 11:
                            member = _c;
                            apiMessage = (0, serializers_js_1.messageToAPI)(dbMessage, author, guildId, member !== null && member !== void 0 ? member : undefined);
                            gateway.broadcast(v10_1.GatewayDispatchEvents.MessageUpdate, __assign(__assign({}, apiMessage), { guild_id: guildId }));
                            return [2 /*return*/, apiMessage];
                    }
                });
            });
        },
    })
        .route({
        method: 'DELETE',
        path: '/webhooks/:webhook_id/:webhook_token/messages/:message_id',
        handler: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var resolvedId, messageId, dbMessage, channel;
                var _this = this;
                var _c;
                var params = _b.params;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            resolvedId = resolveWebhookMessageId(params.message_id);
                            return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                    var interaction;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                if (!(resolvedId === '@original')) return [3 /*break*/, 2];
                                                return [4 /*yield*/, prisma.interactionResponse.findUnique({
                                                        where: { interactionToken: params.webhook_token },
                                                    })];
                                            case 1:
                                                interaction = _a.sent();
                                                if (!interaction || !interaction.messageId) {
                                                    throw new Response(JSON.stringify({
                                                        code: 10008,
                                                        message: 'Unknown Message',
                                                        errors: {},
                                                    }), {
                                                        status: 404,
                                                        headers: { 'Content-Type': 'application/json' },
                                                    });
                                                }
                                                return [2 /*return*/, interaction.messageId];
                                            case 2: return [2 /*return*/, resolvedId];
                                        }
                                    });
                                }); })()];
                        case 1:
                            messageId = _d.sent();
                            return [4 /*yield*/, prisma.message.findUnique({
                                    where: { id: messageId },
                                })];
                        case 2:
                            dbMessage = _d.sent();
                            if (!dbMessage) {
                                throw new Response(JSON.stringify({
                                    code: 10008,
                                    message: 'Unknown Message',
                                    errors: {},
                                }), { status: 404, headers: { 'Content-Type': 'application/json' } });
                            }
                            return [4 /*yield*/, prisma.channel.findUnique({
                                    where: { id: dbMessage.channelId },
                                })];
                        case 3:
                            channel = _d.sent();
                            return [4 /*yield*/, prisma.message.delete({ where: { id: messageId } })];
                        case 4:
                            _d.sent();
                            gateway.broadcast(v10_1.GatewayDispatchEvents.MessageDelete, {
                                id: messageId,
                                channel_id: dbMessage.channelId,
                                guild_id: (_c = channel === null || channel === void 0 ? void 0 : channel.guildId) !== null && _c !== void 0 ? _c : undefined,
                            });
                            return [2 /*return*/, new Response(null, { status: 204 })];
                    }
                });
            });
        },
    });
    var httpServer = node_http_1.default.createServer(function (req, res) {
        var origWriteHead = res.writeHead.bind(res);
        // Node's writeHead has complex overloads. Intercept to inject rate
        // limit headers on every response.
        res.writeHead = function writeHeadWithRateLimits(statusCode) {
            var rest = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                rest[_i - 1] = arguments[_i];
            }
            for (var _a = 0, _b = Object.entries(RATE_LIMIT_HEADERS); _a < _b.length; _a++) {
                var _c = _b[_a], key = _c[0], value = _c[1];
                res.setHeader(key, value);
            }
            res.setHeader('X-RateLimit-Reset', String(Date.now() / 1000 + 60));
            return origWriteHead.apply(void 0, __spreadArray([statusCode], rest, false));
        };
        return app.handleForNode(req, res);
    });
    gateway = new gateway_js_1.DiscordGateway({
        httpServer: httpServer,
        port: 0,
        loadState: loadGatewayState,
        expectedToken: botToken,
    });
    return {
        httpServer: httpServer,
        gateway: gateway,
        app: app,
        typingEvents: typingEvents,
        get port() {
            return state.port;
        },
        set port(v) {
            state.port = v;
        },
    };
}
function startServer(components) {
    return new Promise(function (resolve, reject) {
        components.httpServer.listen(0, function () {
            var address = components.httpServer.address();
            if (!address || typeof address === 'string') {
                reject(new Error('Failed to get server address'));
                return;
            }
            var port = address.port;
            components.port = port;
            // @ts-expect-error -- updating private field after listen
            components.gateway.port = port;
            resolve(port);
        });
    });
}
function stopServer(components) {
    return new Promise(function (resolve) {
        components.gateway.close();
        components.httpServer.close(function () {
            resolve();
        });
    });
}
