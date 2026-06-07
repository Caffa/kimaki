"use strict";
// Durable Object runtime for discord-slack-bridge in Cloudflare Workers.
// Uses a runtime-agnostic gateway session manager so WebSocket transport
// details are isolated from gateway protocol logic.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackBridgeDO = void 0;
var web_api_1 = require("@slack/web-api");
var cloudflare_workers_1 = require("cloudflare:workers");
var v10_1 = require("discord-api-types/v10");
var server_1 = require("discord-slack-bridge/src/server");
var gateway_session_manager_1 = require("discord-slack-bridge/src/gateway-session-manager");
var gateway_client_kv_js_1 = require("./gateway-client-kv.js");
var SlackBridgeDO = /** @class */ (function (_super) {
    __extends(SlackBridgeDO, _super);
    function SlackBridgeDO(ctx, env) {
        var _this = _super.call(this, ctx, env) || this;
        _this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
        _this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('{"type":"ping"}', '{"type":"pong"}'));
        return _this;
    }
    SlackBridgeDO.prototype.fetch = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var url;
            return __generator(this, function (_a) {
                url = new URL(request.url);
                if (url.pathname === '/slack/gateway' || url.pathname.startsWith('/slack/gateway/')) {
                    return [2 /*return*/, this.handleGatewayUpgrade(request)];
                }
                return [2 /*return*/, Response.json({ error: 'Not found' }, { status: 404 })];
            });
        });
    };
    SlackBridgeDO.prototype.handleDiscordRest = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var runtime, response, cause_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getRuntime({ clientId: request.clientId })];
                    case 1:
                        runtime = _a.sent();
                        runtime.setPublicGatewayUrl(buildGatewayWebSocketUrlFromRequestUrl(request.url));
                        return [4 /*yield*/, runtime.app.handle(toRequest(request))];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, serializeResponse(response)];
                    case 3:
                        cause_1 = _a.sent();
                        return [2 /*return*/, {
                                status: 500,
                                headers: [['content-type', 'application/json']],
                                body: JSON.stringify({
                                    error: 'handleDiscordRest failed',
                                    details: String(cause_1),
                                }),
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SlackBridgeDO.prototype.handleSlackWebhook = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var runtime, response, cause_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getRuntime({ clientId: request.clientId })];
                    case 1:
                        runtime = _a.sent();
                        runtime.setPublicGatewayUrl(buildGatewayWebSocketUrlFromRequestUrl(request.url));
                        return [4 /*yield*/, runtime.app.handle(toRequest(request))];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, serializeResponse(response)];
                    case 3:
                        cause_2 = _a.sent();
                        return [2 /*return*/, {
                                status: 500,
                                headers: [['content-type', 'application/json']],
                                body: JSON.stringify({
                                    error: 'handleSlackWebhook failed',
                                    details: String(cause_2),
                                }),
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SlackBridgeDO.prototype.handleGatewayUpgrade = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var requestClientId, runtime, pair, client, server, transport, clientId;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (((_a = request.headers.get('Upgrade')) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== 'websocket') {
                            return [2 /*return*/, Response.json({ error: 'Expected websocket upgrade' }, { status: 426 })];
                        }
                        requestClientId = (_b = new URL(request.url).searchParams.get('clientId')) !== null && _b !== void 0 ? _b : undefined;
                        return [4 /*yield*/, this.getRuntime({ clientId: requestClientId })];
                    case 1:
                        runtime = _c.sent();
                        runtime.setPublicGatewayUrl(buildGatewayWebSocketUrlFromRequestUrl(request.url));
                        pair = new WebSocketPair();
                        client = pair[0];
                        server = pair[1];
                        this.ctx.acceptWebSocket(server, ['gateway']);
                        transport = {
                            send: function (payload) {
                                server.send(payload);
                            },
                            close: function (code, reason) {
                                server.close(code, reason);
                            },
                            isOpen: function () {
                                return true;
                            },
                        };
                        clientId = runtime.gatewaySessionManager.registerClient(transport);
                        writeSocketAttachment({
                            ws: server,
                            attachment: {
                                role: 'gateway',
                                gatewayClientId: clientId,
                                snapshot: runtime.gatewaySessionManager.getClientSnapshot(clientId),
                            },
                        });
                        return [2 /*return*/, new Response(null, { status: 101, webSocket: client })];
                }
            });
        });
    };
    SlackBridgeDO.prototype.webSocketMessage = function (ws, message) {
        return __awaiter(this, void 0, void 0, function () {
            var attachment, runtime, rawMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attachment = readSocketAttachment(ws);
                        if (!((attachment === null || attachment === void 0 ? void 0 : attachment.role) === 'gateway' && attachment.gatewayClientId)) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.getRuntime({})];
                    case 1:
                        runtime = _a.sent();
                        rawMessage = typeof message === 'string' ? message : new TextDecoder().decode(message);
                        return [4 /*yield*/, runtime.gatewaySessionManager.handleRawMessage({
                                clientId: attachment.gatewayClientId,
                                raw: rawMessage,
                            })];
                    case 2:
                        _a.sent();
                        writeSocketAttachment({
                            ws: ws,
                            attachment: __assign(__assign({}, attachment), { snapshot: runtime.gatewaySessionManager.getClientSnapshot(attachment.gatewayClientId) }),
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    SlackBridgeDO.prototype.webSocketClose = function (ws, _code, _reason, _wasClean) {
        return __awaiter(this, void 0, void 0, function () {
            var attachment, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attachment = readSocketAttachment(ws);
                        if (!((attachment === null || attachment === void 0 ? void 0 : attachment.role) === 'gateway' && attachment.gatewayClientId)) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.getRuntime({})];
                    case 1:
                        runtime = _a.sent();
                        runtime.gatewaySessionManager.removeClient(attachment.gatewayClientId);
                        return [2 /*return*/];
                }
            });
        });
    };
    SlackBridgeDO.prototype.webSocketError = function (ws, _error) {
        return __awaiter(this, void 0, void 0, function () {
            var attachment, runtime;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attachment = readSocketAttachment(ws);
                        if (!((attachment === null || attachment === void 0 ? void 0 : attachment.role) === 'gateway' && attachment.gatewayClientId)) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.getRuntime({})];
                    case 1:
                        runtime = _a.sent();
                        runtime.gatewaySessionManager.removeClient(attachment.gatewayClientId);
                        return [2 /*return*/];
                }
            });
        });
    };
    SlackBridgeDO.prototype.getRuntime = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var clientId = _b.clientId;
            return __generator(this, function (_c) {
                if (!this.runtimePromise) {
                    this.runtimePromise = this.createRuntime({ clientId: clientId });
                }
                return [2 /*return*/, this.runtimePromise];
            });
        });
    };
    SlackBridgeDO.prototype.createRuntime = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var gatewayClient, slackBotToken, slack, authResult, botUserId, botUsername, publicGatewayUrl, gatewaySessionManager, bridgeApp;
            var _this = this;
            var _c, _d;
            var clientId = _b.clientId;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!clientId) {
                            throw new Error('Missing clientId while creating Slack bridge runtime');
                        }
                        return [4 /*yield*/, (0, gateway_client_kv_js_1.resolveGatewayClientFromCacheOrDb)({
                                clientId: clientId,
                                env: this.env,
                            })];
                    case 1:
                        gatewayClient = _e.sent();
                        if (gatewayClient instanceof Error) {
                            throw gatewayClient;
                        }
                        if (!gatewayClient) {
                            throw new Error("Unknown gateway client: ".concat(clientId));
                        }
                        slackBotToken = (_c = gatewayClient.bot_token) !== null && _c !== void 0 ? _c : (this.env.SLACK_WORKSPACE_ID === gatewayClient.guild_id
                            ? this.env.SLACK_BOT_TOKEN
                            : null);
                        if (!slackBotToken) {
                            throw new Error("Missing Slack bot token for team ".concat(gatewayClient.guild_id));
                        }
                        slack = new web_api_1.WebClient(slackBotToken);
                        return [4 /*yield*/, slack.auth.test()];
                    case 2:
                        authResult = _e.sent();
                        botUserId = authResult.user_id;
                        if (!botUserId) {
                            throw new Error('Slack auth.test missing user_id');
                        }
                        botUsername = (_d = authResult.user) !== null && _d !== void 0 ? _d : 'kimaki';
                        publicGatewayUrl = 'wss://slack-gateway.kimaki.dev/slack/gateway';
                        gatewaySessionManager = new gateway_session_manager_1.GatewaySessionManager({
                            loadState: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, loadGatewayState({
                                            slack: slack,
                                            workspaceId: gatewayClient.guild_id,
                                            botUserId: botUserId,
                                            botUsername: botUsername,
                                        })];
                                });
                            }); },
                            expectedToken: slackBotToken,
                            workspaceId: gatewayClient.guild_id,
                            authorize: function (context) { return __awaiter(_this, void 0, void 0, function () {
                                var teamId, token, parsedToken, latestGatewayClient;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            teamId = context.teamId;
                                            if (context.kind === 'webhook-action' || context.kind === 'webhook-event') {
                                                if (!teamId || teamId !== gatewayClient.guild_id) {
                                                    return [2 /*return*/, { allow: false }];
                                                }
                                                return [2 /*return*/, {
                                                        allow: true,
                                                        clientId: clientId,
                                                        authorizedTeamIds: [gatewayClient.guild_id],
                                                    }];
                                            }
                                            token = context.token;
                                            parsedToken = parseGatewayToken(token);
                                            if (!parsedToken) {
                                                return [2 /*return*/, { allow: false }];
                                            }
                                            if (parsedToken.clientId !== clientId) {
                                                return [2 /*return*/, { allow: false }];
                                            }
                                            return [4 /*yield*/, (0, gateway_client_kv_js_1.resolveGatewayClientFromCacheOrDb)({
                                                    clientId: clientId,
                                                    env: this.env,
                                                })];
                                        case 1:
                                            latestGatewayClient = _a.sent();
                                            if (latestGatewayClient instanceof Error || !latestGatewayClient) {
                                                return [2 /*return*/, { allow: false }];
                                            }
                                            if (latestGatewayClient.secret !== parsedToken.secret) {
                                                return [2 /*return*/, { allow: false }];
                                            }
                                            if (teamId && teamId !== latestGatewayClient.guild_id) {
                                                return [2 /*return*/, { allow: false }];
                                            }
                                            return [2 /*return*/, {
                                                    allow: true,
                                                    clientId: clientId,
                                                    authorizedTeamIds: [latestGatewayClient.guild_id],
                                                }];
                                    }
                                });
                            }); },
                            gatewayUrlProvider: function () {
                                return publicGatewayUrl;
                            },
                        });
                        bridgeApp = (0, server_1.createBridgeApp)({
                            slack: slack,
                            botUserId: botUserId,
                            botUsername: botUsername,
                            botToken: slackBotToken,
                            signingSecret: this.env.SLACK_SIGNING_SECRET,
                            workspaceId: gatewayClient.guild_id,
                            port: 0,
                        });
                        bridgeApp.setGateway({
                            broadcast: function (event, data) {
                                gatewaySessionManager.broadcast(event, data);
                            },
                            broadcastMessageCreate: function (message, guildId) {
                                gatewaySessionManager.broadcastMessageCreate(message, guildId);
                            },
                            close: function () {
                                gatewaySessionManager.closeAll();
                            },
                        });
                        this.restoreHibernatedGatewaySockets({ gatewaySessionManager: gatewaySessionManager });
                        return [2 /*return*/, {
                                app: bridgeApp.app,
                                gatewaySessionManager: gatewaySessionManager,
                                setPublicGatewayUrl: function (url) {
                                    publicGatewayUrl = url;
                                },
                            }];
                }
            });
        });
    };
    SlackBridgeDO.prototype.restoreHibernatedGatewaySockets = function (_a) {
        var _b;
        var gatewaySessionManager = _a.gatewaySessionManager;
        var sockets = this.ctx.getWebSockets('gateway');
        for (var _i = 0, sockets_1 = sockets; _i < sockets_1.length; _i++) {
            var socket = sockets_1[_i];
            var attachment = readSocketAttachment(socket);
            if (!((attachment === null || attachment === void 0 ? void 0 : attachment.role) === 'gateway' && attachment.gatewayClientId)) {
                continue;
            }
            if (gatewaySessionManager.hasClient(attachment.gatewayClientId)) {
                continue;
            }
            var transport = createGatewaySocketTransport(socket);
            gatewaySessionManager.hydrateClient({
                transport: transport,
                clientId: attachment.gatewayClientId,
                snapshot: (_b = attachment.snapshot) !== null && _b !== void 0 ? _b : {
                    sessionId: crypto.randomUUID(),
                    sequence: 0,
                    identified: false,
                    intents: 0,
                },
            });
        }
    };
    return SlackBridgeDO;
}(cloudflare_workers_1.DurableObject));
exports.SlackBridgeDO = SlackBridgeDO;
function createGatewaySocketTransport(ws) {
    return {
        send: function (payload) {
            ws.send(payload);
        },
        close: function (code, reason) {
            ws.close(code, reason);
        },
        isOpen: function () {
            return true;
        },
    };
}
function readSocketAttachment(ws) {
    var raw = ws.deserializeAttachment();
    if (!isRecord(raw)) {
        return undefined;
    }
    if (raw.role !== 'gateway') {
        return undefined;
    }
    var gatewayClientId = raw.gatewayClientId;
    if (typeof gatewayClientId !== 'string') {
        return undefined;
    }
    var snapshot = isGatewayClientSnapshot(raw.snapshot)
        ? raw.snapshot
        : undefined;
    return {
        role: 'gateway',
        gatewayClientId: gatewayClientId,
        snapshot: snapshot,
    };
}
function writeSocketAttachment(_a) {
    var ws = _a.ws, attachment = _a.attachment;
    ws.serializeAttachment(attachment);
}
function isGatewayClientSnapshot(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (typeof value.sessionId === 'string' &&
        typeof value.sequence === 'number' &&
        typeof value.identified === 'boolean' &&
        typeof value.intents === 'number');
}
function loadGatewayState(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var authResult, channelsList, channels;
        var _c, _d;
        var slack = _b.slack, workspaceId = _b.workspaceId, botUserId = _b.botUserId, botUsername = _b.botUsername;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, slack.auth.test()];
                case 1:
                    authResult = _e.sent();
                    return [4 /*yield*/, slack.conversations.list({
                            types: 'public_channel,private_channel',
                            exclude_archived: true,
                            limit: 200,
                        })];
                case 2:
                    channelsList = _e.sent();
                    channels = ((_c = channelsList.channels) !== null && _c !== void 0 ? _c : [])
                        .filter(function (channel) {
                        return Boolean(channel.id);
                    })
                        .map(function (channel) {
                        var _a, _b, _c;
                        return {
                            id: channel.id,
                            type: v10_1.ChannelType.GuildText,
                            name: (_a = channel.name) !== null && _a !== void 0 ? _a : '',
                            guild_id: workspaceId,
                            topic: (_c = (_b = channel.topic) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : null,
                            position: 0,
                        };
                    });
                    return [2 /*return*/, {
                            botUser: {
                                id: botUserId,
                                username: botUsername,
                                discriminator: '0',
                                avatar: null,
                                global_name: botUsername,
                            },
                            guilds: [
                                {
                                    id: workspaceId,
                                    apiGuild: buildGatewayGuild({
                                        workspaceId: workspaceId,
                                        workspaceName: (_d = authResult.team) !== null && _d !== void 0 ? _d : 'Slack Workspace',
                                        botUserId: botUserId,
                                    }),
                                    joinedAt: new Date().toISOString(),
                                    members: [
                                        {
                                            user: {
                                                id: botUserId,
                                                username: botUsername,
                                                discriminator: '0',
                                                avatar: null,
                                                global_name: botUsername,
                                            },
                                            roles: [],
                                            joined_at: new Date().toISOString(),
                                            deaf: false,
                                            mute: false,
                                            flags: 8,
                                        },
                                    ],
                                    channels: channels,
                                },
                            ],
                        }];
            }
        });
    });
}
function buildGatewayGuild(_a) {
    var workspaceId = _a.workspaceId, workspaceName = _a.workspaceName, botUserId = _a.botUserId;
    return {
        id: workspaceId,
        name: workspaceName,
        icon: null,
        splash: null,
        discovery_splash: null,
        owner_id: botUserId,
        afk_channel_id: null,
        afk_timeout: 300,
        verification_level: v10_1.GuildVerificationLevel.None,
        default_message_notifications: v10_1.GuildDefaultMessageNotifications.AllMessages,
        explicit_content_filter: v10_1.GuildExplicitContentFilter.Disabled,
        roles: [],
        emojis: [],
        features: [],
        mfa_level: v10_1.GuildMFALevel.None,
        application_id: null,
        system_channel_id: null,
        system_channel_flags: v10_1.GuildSystemChannelFlags.SuppressJoinNotifications,
        rules_channel_id: null,
        max_presences: 25000,
        max_members: 500000,
        vanity_url_code: null,
        description: null,
        banner: null,
        premium_tier: v10_1.GuildPremiumTier.None,
        preferred_locale: v10_1.Locale.EnglishUS,
        region: 'automatic',
        hub_type: null,
        incidents_data: null,
        public_updates_channel_id: null,
        nsfw_level: v10_1.GuildNSFWLevel.Default,
        premium_progress_bar_enabled: false,
        stickers: [],
        safety_alerts_channel_id: null,
    };
}
function toRequest(request) {
    var baseUrl = new URL(request.url);
    var requestUrl = new URL(request.path, baseUrl.origin);
    var init = {
        method: request.method,
        headers: new Headers(request.headers),
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        init.body = request.body;
    }
    return new Request(requestUrl, init);
}
function serializeResponse(response) {
    return __awaiter(this, void 0, void 0, function () {
        var headers;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    headers = [];
                    response.headers.forEach(function (value, key) {
                        headers.push([key, value]);
                    });
                    _a = {
                        status: response.status,
                        headers: headers
                    };
                    return [4 /*yield*/, response.text()];
                case 1: return [2 /*return*/, (_a.body = _b.sent(),
                        _a)];
            }
        });
    });
}
function buildGatewayWebSocketUrlFromRequestUrl(requestUrl) {
    var baseUrl = new URL(requestUrl);
    var protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    return new URL('/slack/gateway', "".concat(protocol, "//").concat(baseUrl.host)).toString();
}
function parseGatewayToken(token) {
    if (!token) {
        return undefined;
    }
    var _a = token.split(':'), clientId = _a[0], secret = _a[1], rest = _a.slice(2);
    if (rest.length > 0) {
        return undefined;
    }
    if (!clientId || !secret) {
        return undefined;
    }
    return { clientId: clientId, secret: secret };
}
function isBridgeRpcRequest(value) {
    if (!isRecord(value)) {
        return false;
    }
    if (typeof value.clientId !== 'string' ||
        typeof value.url !== 'string' ||
        typeof value.path !== 'string' ||
        typeof value.method !== 'string' ||
        typeof value.body !== 'string' ||
        !Array.isArray(value.headers)) {
        return false;
    }
    return value.headers.every(function (entry) {
        return (Array.isArray(entry) &&
            entry.length === 2 &&
            typeof entry[0] === 'string' &&
            typeof entry[1] === 'string');
    });
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
