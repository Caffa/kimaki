"use strict";
// HTTP server for the discord-slack-bridge.
// Exposes two sets of routes on the same port:
//   1. /api/v10/* — Discord REST routes consumed by discord.js
//   2. /slack/events — Slack webhook receiver for Events API + interactions
//
// Also hosts the WebSocket gateway at /gateway for discord.js Gateway.
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
exports.createBridgeApp = createBridgeApp;
exports.createServer = createServer;
exports.startServer = startServer;
exports.stopServer = stopServer;
exports.normalizeSlackInteractivePayload = normalizeSlackInteractivePayload;
exports.toDiscordModalComponents = toDiscordModalComponents;
exports.normalizeModalComponents = normalizeModalComponents;
exports.buildDiscordComponentDataFromSlackAction = buildDiscordComponentDataFromSlackAction;
exports.buildResolvedData = buildResolvedData;
var node_http_1 = require("node:http");
var spiceflow_1 = require("spiceflow");
var v10_1 = require("discord-api-types/v10");
var gateway_js_1 = require("./gateway.js");
var rest = require("./rest-translator.js");
var events = require("./event-translator.js");
var id_converter_js_1 = require("./id-converter.js");
var typing_state_js_1 = require("./typing-state.js");
var component_id_codec_js_1 = require("./component-id-codec.js");
var webhook_team_id_js_1 = require("./webhook-team-id.js");
// User cache: avoids hitting Slack users.info API on every inbound event.
// TTL 1 hour, max 500 entries.
var USER_CACHE_TTL_MS = 60 * 60 * 1000;
var USER_CACHE_MAX = 500;
var userCache = new Map();
var EVENT_DEDUPE_TTL_MS = 5 * 60 * 1000;
var AUTOCOMPLETE_REQUEST_TIMEOUT_MS = 2500;
var AUTOCOMPLETE_PENDING_MAX = 1000;
var DISCORD_DEFAULT_DISCRIMINATOR = '0';
var DISCORD_ZERO_PERMISSIONS = '0';
var THREAD_TYPING_STATUS_TEXT = 'Typing...';
/**
 * Look up a Slack user with caching.
 * Falls back to the user ID as username if lookup fails.
 */
function lookupUser(slack, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var cached, args, result, user, cachedUser, firstKey, _a;
        var _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    cached = userCache.get(userId);
                    if (cached && cached.expiresAt > Date.now()) {
                        return [2 /*return*/, cached.user];
                    }
                    _g.label = 1;
                case 1:
                    _g.trys.push([1, 3, , 4]);
                    args = { user: userId };
                    return [4 /*yield*/, slack.users.info(args)];
                case 2:
                    result = _g.sent();
                    user = result.user;
                    if (!(user === null || user === void 0 ? void 0 : user.id)) {
                        throw new Error('Slack users.info returned invalid user payload');
                    }
                    cachedUser = {
                        id: user.id,
                        name: (_b = user.name) !== null && _b !== void 0 ? _b : userId,
                        realName: (_d = (_c = user.real_name) !== null && _c !== void 0 ? _c : user.name) !== null && _d !== void 0 ? _d : userId,
                        isBot: (_e = user.is_bot) !== null && _e !== void 0 ? _e : false,
                        avatar: (_f = user.profile) === null || _f === void 0 ? void 0 : _f.image_72,
                    };
                    // Evict oldest if cache is full
                    if (userCache.size >= USER_CACHE_MAX) {
                        firstKey = userCache.keys().next().value;
                        if (firstKey) {
                            userCache.delete(firstKey);
                        }
                    }
                    userCache.set(userId, {
                        user: cachedUser,
                        expiresAt: Date.now() + USER_CACHE_TTL_MS,
                    });
                    return [2 /*return*/, cachedUser];
                case 3:
                    _a = _g.sent();
                    return [2 /*return*/, {
                            id: userId,
                            name: userId,
                            realName: userId,
                            isBot: false,
                        }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createBridgeApp(config) {
    var _this = this;
    var slack = config.slack, botUserId = config.botUserId, botUsername = config.botUsername, botToken = config.botToken, signingSecret = config.signingSecret, workspaceId = config.workspaceId, port = config.port, authorize = config.authorize;
    var gateway = createNoopGatewayEmitter();
    // Pending interactions awaiting discord.js responses
    var pendingInteractions = new Map();
    var pendingAutocompleteRequests = new Map();
    // Slack event replay protection (event_id -> expiresAt)
    var seenEventIds = new Map();
    // Track announced threads so we emit THREAD_CREATE exactly once per thread.
    // Keyed by encoded thread ID (channel + thread_ts) to avoid cross-channel
    // collisions when Slack thread_ts values are the same in different channels.
    // Bounded to prevent memory leaks on long-running bots.
    var KNOWN_THREADS_MAX = 10000;
    var knownThreads = new Set();
    var knownThreadChannels = new Map();
    var applicationCommandRegistry = new Map();
    var applicationCommandInputRegistry = new Map();
    var typingCoordinator = (0, typing_state_js_1.createTypingCoordinator)({
        setStatus: function (_a) {
            var threadChannelId = _a.threadChannelId, statusText = _a.statusText;
            return rest.setThreadTypingStatus({
                slack: slack,
                threadChannelId: threadChannelId,
                statusText: statusText,
            });
        },
        clearStatus: function (_a) {
            var threadChannelId = _a.threadChannelId;
            return rest.clearThreadTypingStatus({
                slack: slack,
                threadChannelId: threadChannelId,
            });
        },
        resolveThreadTarget: function (_a) {
            var threadChannelId = _a.threadChannelId;
            var target = (0, id_converter_js_1.resolveSlackTarget)(threadChannelId);
            return {
                channelId: target.channel,
                threadTs: target.threadTs,
            };
        },
        statusText: THREAD_TYPING_STATUS_TEXT,
    });
    var app = new spiceflow_1.Spiceflow({ basePath: '' }).onError(function (_a) {
        var _b;
        var error = _a.error;
        if (error instanceof Response) {
            return error;
        }
        var details = (_b = getErrorStack(error)) !== null && _b !== void 0 ? _b : getErrorMessage(error);
        return errorJsonResponse({
            status: 500,
            error: 'internal_server_error',
            message: getErrorMessage(error),
            details: details,
            errorDescription: details,
        });
    });
    // ---- Slack Webhook Receiver ----
    app.post('/slack/events', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, timestamp, signature, contentType, teamIdForWebhookEvent, params, allowSlashAction, payloadStr, allowInteractiveAction, interactiveResponse, payload, normalizedEnvelope, allowEvent, eventId;
        var _c;
        var request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, request.text()
                    // Verify signature
                ];
                case 1:
                    body = _d.sent();
                    timestamp = request.headers.get('x-slack-request-timestamp');
                    signature = request.headers.get('x-slack-signature');
                    return [4 /*yield*/, verifySignature(body, timestamp, signature, signingSecret)];
                case 2:
                    if (!(_d.sent())) {
                        return [2 /*return*/, errorJsonResponse({ status: 401, error: 'invalid_signature' })];
                    }
                    contentType = (_c = request.headers.get('content-type')) !== null && _c !== void 0 ? _c : '';
                    teamIdForWebhookEvent = (0, webhook_team_id_js_1.getTeamIdForWebhookEvent)({
                        body: body,
                        contentType: contentType,
                    });
                    if (!contentType.includes('application/x-www-form-urlencoded')) return [3 /*break*/, 8];
                    params = new URLSearchParams(body);
                    if (!(params.has('command') && !params.has('payload'))) return [3 /*break*/, 4];
                    return [4 /*yield*/, authorizeSlackInbound({
                            authorize: authorize,
                            kind: 'webhook-action',
                            teamId: teamIdForWebhookEvent,
                            request: request,
                            workspaceId: workspaceId,
                        })];
                case 3:
                    allowSlashAction = _d.sent();
                    if (!allowSlashAction) {
                        return [2 /*return*/, errorJsonResponse({ status: 403, error: 'unauthorized_team' })];
                    }
                    handleSlashCommand(params);
                    return [2 /*return*/, new Response('', { status: 200 })];
                case 4:
                    payloadStr = params.get('payload');
                    if (!payloadStr) return [3 /*break*/, 7];
                    return [4 /*yield*/, authorizeSlackInbound({
                            authorize: authorize,
                            kind: 'webhook-action',
                            teamId: teamIdForWebhookEvent,
                            request: request,
                            workspaceId: workspaceId,
                        })];
                case 5:
                    allowInteractiveAction = _d.sent();
                    if (!allowInteractiveAction) {
                        return [2 /*return*/, errorJsonResponse({ status: 403, error: 'unauthorized_team' })];
                    }
                    return [4 /*yield*/, handleInteractivePayload(payloadStr)];
                case 6:
                    interactiveResponse = _d.sent();
                    if (interactiveResponse) {
                        return [2 /*return*/, interactiveResponse];
                    }
                    return [2 /*return*/, new Response('', { status: 200 })];
                case 7: return [2 /*return*/, new Response('', { status: 200 })];
                case 8:
                    try {
                        payload = JSON.parse(body);
                    }
                    catch (_e) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'invalid_json' })];
                    }
                    normalizedEnvelope = normalizeSlackEventEnvelope(payload);
                    if (!normalizedEnvelope) {
                        console.warn('Unsupported Slack webhook payload', {
                            payloadType: isRecord(payload) ? readString(payload, 'type') : undefined,
                            contentType: contentType,
                            bodyPreview: body.slice(0, 300),
                        });
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'unsupported_event_payload' })];
                    }
                    return [4 /*yield*/, authorizeSlackInbound({
                            authorize: authorize,
                            kind: 'webhook-event',
                            teamId: teamIdForWebhookEvent,
                            request: request,
                            workspaceId: workspaceId,
                        })];
                case 9:
                    allowEvent = _d.sent();
                    if (!allowEvent) {
                        return [2 /*return*/, errorJsonResponse({ status: 403, error: 'unauthorized_team' })];
                    }
                    // URL verification challenge
                    if (normalizedEnvelope.type === 'url_verification') {
                        return [2 /*return*/, Response.json({ challenge: normalizedEnvelope.challenge })];
                    }
                    eventId = normalizedEnvelope.eventId;
                    if (eventId) {
                        pruneExpiredEventIds({ seenEventIds: seenEventIds, now: Date.now() });
                        if (seenEventIds.has(eventId)) {
                            return [2 /*return*/, new Response('ok', { status: 200 })];
                        }
                        seenEventIds.set(eventId, Date.now() + EVENT_DEDUPE_TTL_MS);
                    }
                    void handleEvent(normalizedEnvelope.event);
                    return [2 /*return*/, new Response('ok', { status: 200 })];
            }
        });
    }); });
    // ---- Discord REST Routes ----
    // GET /api/v10/gateway/bot
    app.get('/api/v10/gateway/bot', function (_a) {
        var request = _a.request;
        var gatewayUrl = resolveGatewayUrl({
            request: request,
            gatewayUrlOverride: config.gatewayUrlOverride,
            publicBaseUrl: config.publicBaseUrl,
            port: port,
        });
        var clientId = getClientIdFromGatewayAuthorizationHeader(request.headers.get('authorization'));
        var gatewayUrlWithClientId = clientId
            ? appendClientIdToGatewayUrl({
                gatewayUrl: gatewayUrl,
                clientId: clientId,
            })
            : gatewayUrl;
        return Response.json({
            url: gatewayUrlWithClientId,
            shards: 1,
            session_start_limit: {
                total: 1000,
                remaining: 999,
                reset_after: 14400000,
                max_concurrency: 1,
            },
        });
    });
    // GET /api/v10/users/@me
    app.get('/api/v10/users/@me', function () { return __awaiter(_this, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, rest.getUser({ slack: slack, userId: botUserId })];
                case 1:
                    user = _a.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(user))];
            }
        });
    }); });
    // GET /api/v10/users/:user_id
    app.get('/api/v10/users/:user_id', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var userId, user;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    userId = readString(params, 'user_id');
                    if (!userId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_user_id' })];
                    }
                    return [4 /*yield*/, rest.getUser({
                            slack: slack,
                            userId: userId,
                        })];
                case 1:
                    user = _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(user))];
            }
        });
    }); });
    // GET /api/v10/applications/@me
    app.get('/api/v10/applications/@me', function () {
        return withRateLimitHeaders(Response.json({
            id: botUserId,
            name: botUsername,
            bot: { id: botUserId, username: botUsername },
        }));
    });
    // PUT /api/v10/applications/:application_id/commands
    app.put('/api/v10/applications/:application_id/commands', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var applicationId, commands, _c, key, stored;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    applicationId = readString(params, 'application_id');
                    if (!applicationId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_application_id' })];
                    }
                    _c = normalizeApplicationCommandsBody;
                    return [4 /*yield*/, request.json()];
                case 1:
                    commands = _c.apply(void 0, [_d.sent()]);
                    key = getGlobalCommandRegistryKey({ applicationId: applicationId });
                    stored = commands.map(function (command) {
                        return createApplicationCommandRecord({
                            applicationId: applicationId,
                            command: command,
                        });
                    });
                    applicationCommandRegistry.set(key, stored);
                    applicationCommandInputRegistry.set(key, commands);
                    return [2 /*return*/, withRateLimitHeaders(Response.json(stored))];
            }
        });
    }); });
    // GET /api/v10/applications/:application_id/commands
    app.get('/api/v10/applications/:application_id/commands', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var applicationId, key, commands;
        var _c;
        var params = _b.params;
        return __generator(this, function (_d) {
            applicationId = readString(params, 'application_id');
            if (!applicationId) {
                return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_application_id' })];
            }
            key = getGlobalCommandRegistryKey({ applicationId: applicationId });
            commands = (_c = applicationCommandRegistry.get(key)) !== null && _c !== void 0 ? _c : [];
            return [2 /*return*/, withRateLimitHeaders(Response.json(commands))];
        });
    }); });
    // PUT /api/v10/applications/:application_id/guilds/:guild_id/commands
    app.put('/api/v10/applications/:application_id/guilds/:guild_id/commands', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var applicationId, guildId, commands, _c, key, stored;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    applicationId = readString(params, 'application_id');
                    guildId = readString(params, 'guild_id');
                    if (!applicationId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_application_id' })];
                    }
                    if (!guildId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_guild_id' })];
                    }
                    if (guildId !== workspaceId) {
                        return [2 /*return*/, unknownGuildResponse(guildId)];
                    }
                    _c = normalizeApplicationCommandsBody;
                    return [4 /*yield*/, request.json()];
                case 1:
                    commands = _c.apply(void 0, [_d.sent()]);
                    key = getGuildCommandRegistryKey({ applicationId: applicationId, guildId: guildId });
                    stored = commands.map(function (command) {
                        return createApplicationCommandRecord({
                            applicationId: applicationId,
                            guildId: guildId,
                            command: command,
                        });
                    });
                    applicationCommandRegistry.set(key, stored);
                    applicationCommandInputRegistry.set(key, commands);
                    return [2 /*return*/, withRateLimitHeaders(Response.json(stored))];
            }
        });
    }); });
    // GET /api/v10/applications/:application_id/guilds/:guild_id/commands
    app.get('/api/v10/applications/:application_id/guilds/:guild_id/commands', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var applicationId, guildId, key, commands;
        var _c;
        var params = _b.params;
        return __generator(this, function (_d) {
            applicationId = readString(params, 'application_id');
            guildId = readString(params, 'guild_id');
            if (!applicationId) {
                return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_application_id' })];
            }
            if (!guildId) {
                return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_guild_id' })];
            }
            if (guildId !== workspaceId) {
                return [2 /*return*/, unknownGuildResponse(guildId)];
            }
            key = getGuildCommandRegistryKey({ applicationId: applicationId, guildId: guildId });
            commands = (_c = applicationCommandRegistry.get(key)) !== null && _c !== void 0 ? _c : [];
            return [2 /*return*/, withRateLimitHeaders(Response.json(commands))];
        });
    }); });
    // GET /api/v10/applications/:application_id/guilds/:guild_id/commands/:command_id
    app.get('/api/v10/applications/:application_id/guilds/:guild_id/commands/:command_id', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var applicationId, guildId, commandId, key, command;
        var _c;
        var params = _b.params;
        return __generator(this, function (_d) {
            applicationId = readString(params, 'application_id');
            guildId = readString(params, 'guild_id');
            commandId = readString(params, 'command_id');
            if (!applicationId) {
                return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_application_id' })];
            }
            if (!guildId) {
                return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_guild_id' })];
            }
            if (!commandId) {
                return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_command_id' })];
            }
            if (guildId !== workspaceId) {
                return [2 /*return*/, unknownGuildResponse(guildId)];
            }
            key = getGuildCommandRegistryKey({ applicationId: applicationId, guildId: guildId });
            command = ((_c = applicationCommandRegistry.get(key)) !== null && _c !== void 0 ? _c : []).find(function (entry) {
                return entry.id === commandId;
            });
            if (!command) {
                return [2 /*return*/, errorJsonResponse({
                        status: 404,
                        error: 'unknown_application_command',
                        code: 10063,
                        message: 'Unknown application command',
                    })];
            }
            return [2 /*return*/, withRateLimitHeaders(Response.json(command))];
        });
    }); });
    // POST /api/v10/channels/:channel_id/messages
    app.post('/api/v10/channels/:channel_id/messages', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, message;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, normalizePostMessageRequestBody(request)];
                case 1:
                    body = _c.sent();
                    channelId = readString(params, 'channel_id');
                    if (!channelId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_id' })];
                    }
                    return [4 /*yield*/, rest.postMessage({
                            slack: slack,
                            channelId: channelId,
                            body: body,
                            botUserId: botUserId,
                            guildId: workspaceId,
                        })];
                case 2:
                    message = _c.sent();
                    if ((0, id_converter_js_1.isThreadChannelId)(channelId)) {
                        typingCoordinator.noteAssistantMessage({
                            threadChannelId: channelId,
                            messageId: message.id,
                        });
                    }
                    return [2 /*return*/, withRateLimitHeaders(Response.json(message))];
            }
        });
    }); });
    // PATCH /api/v10/channels/:channel_id/messages/:message_id
    app.patch('/api/v10/channels/:channel_id/messages/:message_id', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, _c, channelId, messageId, message;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _c = normalizeEditMessageBody;
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _c.apply(void 0, [_d.sent()]);
                    channelId = readString(params, 'channel_id');
                    messageId = readString(params, 'message_id');
                    if (!(channelId && messageId)) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_or_message_id' })];
                    }
                    return [4 /*yield*/, rest.editMessage({
                            slack: slack,
                            channelId: channelId,
                            messageId: messageId,
                            body: body,
                            botUserId: botUserId,
                            guildId: workspaceId,
                        })];
                case 2:
                    message = _d.sent();
                    if ((0, id_converter_js_1.isThreadChannelId)(channelId)) {
                        typingCoordinator.noteAssistantMessage({
                            threadChannelId: channelId,
                            messageId: message.id,
                        });
                    }
                    return [2 /*return*/, withRateLimitHeaders(Response.json(message))];
            }
        });
    }); });
    // DELETE /api/v10/channels/:channel_id/messages/:message_id
    app.delete('/api/v10/channels/:channel_id/messages/:message_id', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId, messageId;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = readString(params, 'channel_id');
                    messageId = readString(params, 'message_id');
                    if (!(channelId && messageId)) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_or_message_id' })];
                    }
                    return [4 /*yield*/, rest.deleteMessage({
                            slack: slack,
                            channelId: channelId,
                            messageId: messageId,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
            }
        });
    }); });
    // GET /api/v10/channels/:channel_id/messages
    app.get('/api/v10/channels/:channel_id/messages', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var url, channelId, messages;
        var _c, _d, _e;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    url = new URL(request.url);
                    channelId = readString(params, 'channel_id');
                    if (!channelId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_id' })];
                    }
                    return [4 /*yield*/, rest.getMessages({
                            slack: slack,
                            channelId: channelId,
                            query: {
                                limit: (_c = url.searchParams.get('limit')) !== null && _c !== void 0 ? _c : undefined,
                                before: (_d = url.searchParams.get('before')) !== null && _d !== void 0 ? _d : undefined,
                                after: (_e = url.searchParams.get('after')) !== null && _e !== void 0 ? _e : undefined,
                            },
                            botUserId: botUserId,
                            guildId: workspaceId,
                        })];
                case 1:
                    messages = _f.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(messages))];
            }
        });
    }); });
    // GET /api/v10/channels/:channel_id/messages/:message_id
    app.get('/api/v10/channels/:channel_id/messages/:message_id', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId, messageId, message;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = readString(params, 'channel_id');
                    messageId = readString(params, 'message_id');
                    if (!(channelId && messageId)) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_or_message_id' })];
                    }
                    return [4 /*yield*/, rest.getMessage({
                            slack: slack,
                            channelId: channelId,
                            messageId: messageId,
                            botUserId: botUserId,
                            guildId: workspaceId,
                        })];
                case 1:
                    message = _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(message))];
            }
        });
    }); });
    // POST /api/v10/channels/:channel_id/typing
    app.post('/api/v10/channels/:channel_id/typing', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId;
        var params = _b.params;
        return __generator(this, function (_c) {
            channelId = readString(params, 'channel_id');
            if (!channelId) {
                return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_id' })];
            }
            if (!(0, id_converter_js_1.isThreadChannelId)(channelId)) {
                return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
            }
            typingCoordinator.requestStart({
                threadChannelId: channelId,
            });
            return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
        });
    }); });
    // GET /api/v10/channels/:channel_id
    app.get('/api/v10/channels/:channel_id', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId, channel;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = readString(params, 'channel_id');
                    if (!channelId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_id' })];
                    }
                    return [4 /*yield*/, rest.getChannel({
                            slack: slack,
                            channelId: channelId,
                            guildId: workspaceId,
                        })];
                case 1:
                    channel = _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(channel))];
            }
        });
    }); });
    // PATCH /api/v10/channels/:channel_id
    app.patch('/api/v10/channels/:channel_id', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, _c, channelId, channel;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _c = normalizePatchChannelBody;
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _c.apply(void 0, [_d.sent()]);
                    channelId = readString(params, 'channel_id');
                    if (!channelId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_id' })];
                    }
                    return [4 /*yield*/, rest.updateChannel({
                            slack: slack,
                            channelId: channelId,
                            body: body,
                            guildId: workspaceId,
                        })];
                case 2:
                    channel = _d.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(channel))];
            }
        });
    }); });
    // PUT /api/v10/channels/:channel_id/messages/:message_id/reactions/:emoji/@me
    app.put('/api/v10/channels/:channel_id/messages/:message_id/reactions/:emoji/@me', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId, messageId, emoji;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = readString(params, 'channel_id');
                    messageId = readString(params, 'message_id');
                    emoji = readString(params, 'emoji');
                    if (!(channelId && messageId && emoji)) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_reaction_route_params' })];
                    }
                    return [4 /*yield*/, rest.addReaction({
                            slack: slack,
                            channelId: channelId,
                            messageId: messageId,
                            emoji: decodeURIComponent(emoji),
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
            }
        });
    }); });
    // DELETE /api/v10/channels/:channel_id/messages/:message_id/reactions/:emoji/@me
    app.delete('/api/v10/channels/:channel_id/messages/:message_id/reactions/:emoji/@me', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId, messageId, emoji;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = readString(params, 'channel_id');
                    messageId = readString(params, 'message_id');
                    emoji = readString(params, 'emoji');
                    if (!(channelId && messageId && emoji)) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_reaction_route_params' })];
                    }
                    return [4 /*yield*/, rest.removeReaction({
                            slack: slack,
                            channelId: channelId,
                            messageId: messageId,
                            emoji: decodeURIComponent(emoji),
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
            }
        });
    }); });
    // POST /api/v10/channels/:channel_id/threads
    app.post('/api/v10/channels/:channel_id/threads', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, _c, parentChannelId, thread, threadKey;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _c = normalizeCreateThreadBody;
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _c.apply(void 0, [_d.sent()]);
                    parentChannelId = readString(params, 'channel_id');
                    if (!parentChannelId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_id' })];
                    }
                    return [4 /*yield*/, rest.createThread({
                            slack: slack,
                            parentChannelId: parentChannelId,
                            body: body,
                            botUserId: botUserId,
                            guildId: workspaceId,
                        })
                        // Register thread so we don't emit duplicate THREAD_CREATE events.
                    ];
                case 2:
                    thread = _d.sent();
                    threadKey = thread.id;
                    evictIfFull(knownThreads, KNOWN_THREADS_MAX);
                    knownThreads.add(threadKey);
                    evictMapIfFull(knownThreadChannels, KNOWN_THREADS_MAX);
                    gateway.broadcast(v10_1.GatewayDispatchEvents.ThreadCreate, __assign(__assign({}, thread), { newly_created: true }));
                    knownThreadChannels.set(thread.id, thread);
                    return [2 /*return*/, withRateLimitHeaders(Response.json(thread))];
            }
        });
    }); });
    // POST /api/v10/channels/:channel_id/messages/:message_id/threads
    app.post('/api/v10/channels/:channel_id/messages/:message_id/threads', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, _c, parentChannelId, messageId, thread, threadKey;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _c = normalizeCreateThreadBody;
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _c.apply(void 0, [_d.sent()]);
                    parentChannelId = readString(params, 'channel_id');
                    messageId = readString(params, 'message_id');
                    if (!(parentChannelId && messageId)) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_or_message_id' })];
                    }
                    return [4 /*yield*/, rest.createThreadFromMessage({
                            slack: slack,
                            parentChannelId: parentChannelId,
                            messageId: messageId,
                            body: body,
                            botUserId: botUserId,
                            guildId: workspaceId,
                        })];
                case 2:
                    thread = _d.sent();
                    threadKey = thread.id;
                    evictIfFull(knownThreads, KNOWN_THREADS_MAX);
                    knownThreads.add(threadKey);
                    evictMapIfFull(knownThreadChannels, KNOWN_THREADS_MAX);
                    gateway.broadcast(v10_1.GatewayDispatchEvents.ThreadCreate, __assign(__assign({}, thread), { newly_created: true }));
                    knownThreadChannels.set(thread.id, thread);
                    return [2 /*return*/, withRateLimitHeaders(Response.json(thread))];
            }
        });
    }); });
    // GET /api/v10/channels/:channel_id/thread-members
    app.get('/api/v10/channels/:channel_id/thread-members', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId, members;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = readString(params, 'channel_id');
                    if (!channelId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_id' })];
                    }
                    if (!(0, id_converter_js_1.isThreadChannelId)(channelId)) {
                        return [2 /*return*/, errorJsonResponse({
                                status: 404,
                                error: 'unknown_channel',
                                code: 10003,
                                message: "Unknown Channel: ".concat(channelId),
                            })];
                    }
                    return [4 /*yield*/, rest.listThreadMembers({
                            slack: slack,
                            threadChannelId: channelId,
                            botUserId: botUserId,
                        })];
                case 1:
                    members = _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(members))];
            }
        });
    }); });
    // GET /api/v10/channels/:channel_id/thread-members/@me
    app.get('/api/v10/channels/:channel_id/thread-members/@me', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId, member;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = readString(params, 'channel_id');
                    if (!channelId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_id' })];
                    }
                    if (!(0, id_converter_js_1.isThreadChannelId)(channelId)) {
                        return [2 /*return*/, errorJsonResponse({
                                status: 404,
                                error: 'unknown_channel',
                                code: 10003,
                                message: "Unknown Channel: ".concat(channelId),
                            })];
                    }
                    return [4 /*yield*/, rest.getThreadMember({
                            slack: slack,
                            threadChannelId: channelId,
                            userId: botUserId,
                            botUserId: botUserId,
                        })];
                case 1:
                    member = _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(member))];
            }
        });
    }); });
    // PUT /api/v10/channels/:channel_id/thread-members/@me
    app.put('/api/v10/channels/:channel_id/thread-members/@me', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = readString(params, 'channel_id');
                    if (!channelId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_id' })];
                    }
                    if (!(0, id_converter_js_1.isThreadChannelId)(channelId)) {
                        return [2 /*return*/, errorJsonResponse({
                                status: 404,
                                error: 'unknown_channel',
                                code: 10003,
                                message: "Unknown Channel: ".concat(channelId),
                            })];
                    }
                    return [4 /*yield*/, rest.joinThreadMember({
                            slack: slack,
                            threadChannelId: channelId,
                            userId: botUserId,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
            }
        });
    }); });
    // DELETE /api/v10/channels/:channel_id/thread-members/@me
    app.delete('/api/v10/channels/:channel_id/thread-members/@me', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = readString(params, 'channel_id');
                    if (!channelId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_channel_id' })];
                    }
                    if (!(0, id_converter_js_1.isThreadChannelId)(channelId)) {
                        return [2 /*return*/, errorJsonResponse({
                                status: 404,
                                error: 'unknown_channel',
                                code: 10003,
                                message: "Unknown Channel: ".concat(channelId),
                            })];
                    }
                    return [4 /*yield*/, rest.leaveThreadMember({
                            slack: slack,
                            threadChannelId: channelId,
                            userId: botUserId,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
            }
        });
    }); });
    // PUT /api/v10/channels/:channel_id/thread-members/:user_id
    app.put('/api/v10/channels/:channel_id/thread-members/:user_id', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var channelId, userId;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = readString(params, 'channel_id');
                    userId = readString(params, 'user_id');
                    if (!(channelId && userId)) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_thread_member_route_params' })];
                    }
                    if (!(0, id_converter_js_1.isThreadChannelId)(channelId)) {
                        return [2 /*return*/, errorJsonResponse({
                                status: 404,
                                error: 'unknown_channel',
                                code: 10003,
                                message: "Unknown Channel: ".concat(channelId),
                            })];
                    }
                    if (userId !== botUserId) {
                        return [2 /*return*/, errorJsonResponse({
                                status: 403,
                                error: 'missing_permissions',
                                code: 50013,
                                message: 'Missing Permissions',
                            })];
                    }
                    return [4 /*yield*/, rest.joinThreadMember({
                            slack: slack,
                            threadChannelId: channelId,
                            userId: userId,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
            }
        });
    }); });
    // GET /api/v10/guilds/:guild_id
    app.get('/api/v10/guilds/:guild_id', function (_a) {
        var params = _a.params;
        var guildId = readString(params, 'guild_id');
        if (guildId && guildId !== workspaceId) {
            return unknownGuildResponse(guildId);
        }
        return withRateLimitHeaders(Response.json({
            id: workspaceId,
            name: 'Slack Workspace',
            owner_id: botUserId,
            roles: [],
            emojis: [],
            features: [],
            verification_level: v10_1.GuildVerificationLevel.None,
            default_message_notifications: v10_1.GuildDefaultMessageNotifications.AllMessages,
            explicit_content_filter: v10_1.GuildExplicitContentFilter.Disabled,
            mfa_level: v10_1.GuildMFALevel.None,
            system_channel_flags: v10_1.GuildSystemChannelFlags.SuppressJoinNotifications,
            premium_tier: v10_1.GuildPremiumTier.None,
            nsfw_level: v10_1.GuildNSFWLevel.Default,
        }));
    });
    // GET /api/v10/guilds/:guild_id/channels
    app.get('/api/v10/guilds/:guild_id/channels', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var guildId, channels;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    guildId = readString(params, 'guild_id');
                    if (guildId && guildId !== workspaceId) {
                        return [2 /*return*/, unknownGuildResponse(guildId)];
                    }
                    return [4 /*yield*/, rest.listChannels({
                            slack: slack,
                            guildId: workspaceId,
                        })];
                case 1:
                    channels = _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(channels))];
            }
        });
    }); });
    // POST /api/v10/guilds/:guild_id/channels
    app.post('/api/v10/guilds/:guild_id/channels', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var guildId, body, _c, channel;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    guildId = readString(params, 'guild_id');
                    if (guildId && guildId !== workspaceId) {
                        return [2 /*return*/, unknownGuildResponse(guildId)];
                    }
                    _c = normalizeCreateGuildChannelBody;
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _c.apply(void 0, [_d.sent()]);
                    return [4 /*yield*/, rest.createChannel({
                            slack: slack,
                            guildId: workspaceId,
                            body: body,
                        })];
                case 2:
                    channel = _d.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(channel))];
            }
        });
    }); });
    // GET /api/v10/guilds/:guild_id/members
    app.get('/api/v10/guilds/:guild_id/members', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var guildId, members;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    guildId = readString(params, 'guild_id');
                    if (guildId && guildId !== workspaceId) {
                        return [2 /*return*/, unknownGuildResponse(guildId)];
                    }
                    return [4 /*yield*/, rest.listGuildMembers({ slack: slack })];
                case 1:
                    members = _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(members))];
            }
        });
    }); });
    // GET /api/v10/guilds/:guild_id/members/:uid
    app.get('/api/v10/guilds/:guild_id/members/:uid', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var guildId, userId, member;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    guildId = readString(params, 'guild_id');
                    if (guildId && guildId !== workspaceId) {
                        return [2 /*return*/, unknownGuildResponse(guildId)];
                    }
                    userId = readString(params, 'uid');
                    if (!userId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_uid' })];
                    }
                    return [4 /*yield*/, rest.getGuildMember({
                            slack: slack,
                            userId: userId,
                        })];
                case 1:
                    member = _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(member))];
            }
        });
    }); });
    // GET /api/v10/guilds/:guild_id/roles
    app.get('/api/v10/guilds/:guild_id/roles', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var guildId, roles;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    guildId = readString(params, 'guild_id');
                    if (guildId && guildId !== workspaceId) {
                        return [2 /*return*/, unknownGuildResponse(guildId)];
                    }
                    return [4 /*yield*/, rest.listGuildRoles({ slack: slack })];
                case 1:
                    roles = _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(Response.json(roles))];
            }
        });
    }); });
    // GET /api/v10/guilds/:guild_id/threads/active
    app.get('/api/v10/guilds/:guild_id/threads/active', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var guildId, threadList, merged;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    guildId = readString(params, 'guild_id');
                    if (!guildId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_guild_id' })];
                    }
                    if (guildId !== workspaceId) {
                        return [2 /*return*/, unknownGuildResponse(guildId)];
                    }
                    return [4 /*yield*/, rest.getActiveThreads({
                            slack: slack,
                            guildId: workspaceId,
                            botUserId: botUserId,
                        })];
                case 1:
                    threadList = _c.sent();
                    merged = mergeActiveThreadsWithKnown({
                        active: threadList,
                        knownThreadChannels: knownThreadChannels,
                        botUserId: botUserId,
                    });
                    return [2 /*return*/, withRateLimitHeaders(Response.json(merged))];
            }
        });
    }); });
    // POST /api/v10/interactions/:interaction_id/:interaction_token/callback
    app.post('/api/v10/interactions/:interaction_id/:interaction_token/callback', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, _c, interactionId, interactionToken, pendingAutocomplete, pending, message, message, modalData;
        var _d, _e, _f, _g;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _c = normalizeInteractionCallbackBody;
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _c.apply(void 0, [_h.sent()]);
                    interactionId = readString(params, 'interaction_id');
                    interactionToken = readString(params, 'interaction_token');
                    if (!(interactionId && interactionToken)) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_interaction_route_params' })];
                    }
                    pendingAutocomplete = pendingAutocompleteRequests.get(interactionId);
                    if (pendingAutocomplete) {
                        if (pendingAutocomplete.token !== interactionToken) {
                            return [2 /*return*/, errorJsonResponse({ status: 401, error: 'invalid_interaction_token' })];
                        }
                        clearTimeout(pendingAutocomplete.timeoutHandle);
                        pendingAutocompleteRequests.delete(interactionId);
                        if (body.type === v10_1.InteractionResponseType.ApplicationCommandAutocompleteResult) {
                            pendingAutocomplete.resolveChoices((_e = (_d = body.data) === null || _d === void 0 ? void 0 : _d.choices) !== null && _e !== void 0 ? _e : []);
                        }
                        else {
                            pendingAutocomplete.resolveChoices([]);
                        }
                        return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
                    }
                    pending = pendingInteractions.get(interactionId);
                    if (!pending) {
                        return [2 /*return*/, errorJsonResponse({ status: 404, error: 'unknown_interaction' })];
                    }
                    if (pending.token !== interactionToken) {
                        return [2 /*return*/, errorJsonResponse({ status: 401, error: 'invalid_interaction_token' })];
                    }
                    pending.acknowledged = true;
                    if (!(body.type === v10_1.InteractionResponseType.ChannelMessageWithSource && body.data)) return [3 /*break*/, 3];
                    return [4 /*yield*/, rest.postMessage({
                            slack: slack,
                            channelId: pending.channelId,
                            body: { content: body.data.content },
                            botUserId: botUserId,
                            guildId: workspaceId,
                        })];
                case 2:
                    message = _h.sent();
                    if ((0, id_converter_js_1.isThreadChannelId)(pending.channelId)) {
                        typingCoordinator.noteAssistantMessage({
                            threadChannelId: pending.channelId,
                            messageId: message.id,
                        });
                    }
                    gateway.broadcastMessageCreate(message, workspaceId);
                    _h.label = 3;
                case 3:
                    if (!(body.type === v10_1.InteractionResponseType.UpdateMessage && body.data && pending.messageTs)) return [3 /*break*/, 5];
                    return [4 /*yield*/, rest.editMessage({
                            slack: slack,
                            channelId: pending.channelId,
                            messageId: (0, id_converter_js_1.encodeMessageId)((0, id_converter_js_1.resolveSlackTarget)(pending.channelId).channel, pending.messageTs),
                            body: {
                                content: body.data.content,
                                components: body.data.components,
                            },
                            botUserId: botUserId,
                            guildId: workspaceId,
                        })];
                case 4:
                    message = _h.sent();
                    if ((0, id_converter_js_1.isThreadChannelId)(pending.channelId)) {
                        typingCoordinator.noteAssistantMessage({
                            threadChannelId: pending.channelId,
                            messageId: message.id,
                        });
                    }
                    gateway.broadcast(v10_1.GatewayDispatchEvents.MessageUpdate, __assign(__assign({}, message), { guild_id: workspaceId }));
                    _h.label = 5;
                case 5:
                    if (!(body.type === v10_1.InteractionResponseType.Modal &&
                        body.data &&
                        pending.triggerId)) return [3 /*break*/, 7];
                    modalData = normalizeModalInteractionResponseData(body.data);
                    return [4 /*yield*/, rest.openModalView({
                            slack: slack,
                            triggerId: pending.triggerId,
                            modal: __assign(__assign({}, modalData), { submit: (_f = modalData.submit) !== null && _f !== void 0 ? _f : pending.submitLabel, private_metadata: (_g = modalData.private_metadata) !== null && _g !== void 0 ? _g : pending.channelId }),
                        })];
                case 6:
                    _h.sent();
                    _h.label = 7;
                case 7: 
                // Type 5: DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE (ack, respond later)
                // Type 6: DEFERRED_UPDATE_MESSAGE (ack)
                // These just acknowledge -- the actual response comes via webhook edit
                return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
            }
        });
    }); });
    // POST /api/v10/webhooks/:webhook_id/:webhook_token (follow-up message)
    app.post('/api/v10/webhooks/:webhook_id/:webhook_token', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, webhookToken, pending, message;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, normalizePostMessageRequestBody(request)];
                case 1:
                    body = _c.sent();
                    webhookToken = readString(params, 'webhook_token');
                    if (!webhookToken) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_webhook_token' })];
                    }
                    pending = __spreadArray([], pendingInteractions.values(), true).find(function (p) { return p.token === webhookToken; });
                    if (!pending) {
                        return [2 /*return*/, errorJsonResponse({ status: 404, error: 'unknown_webhook_token' })];
                    }
                    return [4 /*yield*/, rest.postMessage({
                            slack: slack,
                            channelId: pending.channelId,
                            body: body,
                            botUserId: botUserId,
                            guildId: workspaceId,
                        })];
                case 2:
                    message = _c.sent();
                    if ((0, id_converter_js_1.isThreadChannelId)(pending.channelId)) {
                        typingCoordinator.noteAssistantMessage({
                            threadChannelId: pending.channelId,
                            messageId: message.id,
                        });
                    }
                    return [2 /*return*/, withRateLimitHeaders(Response.json(message))];
            }
        });
    }); });
    // PATCH /api/v10/webhooks/:webhook_id/:webhook_token/messages/:message_id
    // Supports @original (edits the interaction source message) and specific
    // message IDs (edits follow-up messages).
    app.patch('/api/v10/webhooks/:webhook_id/:webhook_token/messages/:message_id', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, _c, webhookToken, rawMessageId, pending, resolvedMessageId, message;
        var params = _b.params, request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _c = normalizeWebhookBody;
                    return [4 /*yield*/, request.json()];
                case 1:
                    body = _c.apply(void 0, [_d.sent()]);
                    webhookToken = readString(params, 'webhook_token');
                    rawMessageId = readString(params, 'message_id');
                    if (!webhookToken) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_webhook_token' })];
                    }
                    pending = __spreadArray([], pendingInteractions.values(), true).find(function (entry) {
                        return entry.token === webhookToken;
                    });
                    if (!pending) {
                        return [2 /*return*/, errorJsonResponse({ status: 404, error: 'unknown_webhook_token' })];
                    }
                    resolvedMessageId = resolveWebhookMessageId({
                        rawMessageId: rawMessageId,
                        pending: pending,
                        channelId: pending.channelId,
                    });
                    if (!resolvedMessageId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'no_source_message_for_webhook_update' })];
                    }
                    return [4 /*yield*/, rest.editMessage({
                            slack: slack,
                            channelId: pending.channelId,
                            messageId: resolvedMessageId,
                            body: {
                                content: body.content,
                            },
                            botUserId: botUserId,
                            guildId: workspaceId,
                        })];
                case 2:
                    message = _d.sent();
                    if ((0, id_converter_js_1.isThreadChannelId)(pending.channelId)) {
                        typingCoordinator.noteAssistantMessage({
                            threadChannelId: pending.channelId,
                            messageId: message.id,
                        });
                    }
                    return [2 /*return*/, withRateLimitHeaders(Response.json(message))];
            }
        });
    }); });
    // DELETE /api/v10/webhooks/:webhook_id/:webhook_token/messages/:message_id
    // Supports @original (deletes the interaction source message) and specific
    // message IDs (deletes follow-up messages).
    app.delete('/api/v10/webhooks/:webhook_id/:webhook_token/messages/:message_id', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var webhookToken, rawMessageId, pending, resolvedMessageId;
        var params = _b.params;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    webhookToken = readString(params, 'webhook_token');
                    rawMessageId = readString(params, 'message_id');
                    if (!webhookToken) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'missing_webhook_token' })];
                    }
                    pending = __spreadArray([], pendingInteractions.values(), true).find(function (entry) {
                        return entry.token === webhookToken;
                    });
                    if (!pending) {
                        return [2 /*return*/, errorJsonResponse({ status: 404, error: 'unknown_webhook_token' })];
                    }
                    resolvedMessageId = resolveWebhookMessageId({
                        rawMessageId: rawMessageId,
                        pending: pending,
                        channelId: pending.channelId,
                    });
                    if (!resolvedMessageId) {
                        return [2 /*return*/, errorJsonResponse({ status: 400, error: 'no_source_message_for_webhook_delete' })];
                    }
                    return [4 /*yield*/, rest.deleteMessage({
                            slack: slack,
                            channelId: pending.channelId,
                            messageId: resolvedMessageId,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, withRateLimitHeaders(new Response(null, { status: 204 }))];
            }
        });
    }); });
    // ---- Internal Event Handlers ----
    function handleEvent(event) {
        return __awaiter(this, void 0, void 0, function () {
            var eventType, subtype, author_1, translated_1, translated_2, ignoredSubtypes, userId, author, threadKey, threadChannel, translated, threadTs, translated, translated, translated, translated, memberUser, translated;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        eventType = event.type;
                        subtype = 'subtype' in event ? event.subtype : undefined;
                        if (!(eventType === 'message' || eventType === 'app_mention')) return [3 /*break*/, 4];
                        if (!(subtype === 'message_changed')) return [3 /*break*/, 2];
                        return [4 /*yield*/, lookupUser(slack, (_b = (_a = event.message) === null || _a === void 0 ? void 0 : _a.user) !== null && _b !== void 0 ? _b : botUserId)];
                    case 1:
                        author_1 = _e.sent();
                        translated_1 = events.translateMessageUpdate({
                            event: event,
                            guildId: workspaceId,
                            author: author_1,
                        });
                        if (translated_1) {
                            gateway.broadcast(translated_1.eventName, translated_1.data);
                        }
                        return [2 /*return*/];
                    case 2:
                        if (subtype === 'message_deleted') {
                            translated_2 = events.translateMessageDelete({
                                event: event,
                                guildId: workspaceId,
                            });
                            if (translated_2) {
                                gateway.broadcast(translated_2.eventName, translated_2.data);
                            }
                            return [2 /*return*/];
                        }
                        ignoredSubtypes = new Set([
                            'channel_join',
                            'channel_leave',
                            'channel_topic',
                            'channel_purpose',
                            'channel_name',
                            'channel_archive',
                            'channel_unarchive',
                            'group_join',
                            'group_leave',
                            'message_replied',
                        ]);
                        if (subtype && ignoredSubtypes.has(subtype)) {
                            return [2 /*return*/];
                        }
                        userId = (_d = (_c = event.user) !== null && _c !== void 0 ? _c : event.botId) !== null && _d !== void 0 ? _d : botUserId;
                        return [4 /*yield*/, lookupUser(slack, userId)
                            // If this message is a thread reply and we haven't seen this thread,
                            // emit THREAD_CREATE first
                        ];
                    case 3:
                        author = _e.sent();
                        // If this message is a thread reply and we haven't seen this thread,
                        // emit THREAD_CREATE first
                        if (event.threadTs &&
                            event.channel &&
                            event.threadTs !== event.ts) {
                            threadKey = (0, id_converter_js_1.encodeThreadId)(event.channel, event.threadTs);
                            if (!knownThreads.has(threadKey)) {
                                evictIfFull(knownThreads, KNOWN_THREADS_MAX);
                                knownThreads.add(threadKey);
                                threadChannel = events.buildThreadChannel({
                                    parentChannel: event.channel,
                                    threadTs: event.threadTs,
                                    guildId: workspaceId,
                                });
                                evictMapIfFull(knownThreadChannels, KNOWN_THREADS_MAX);
                                knownThreadChannels.set(threadKey, threadChannel);
                                gateway.broadcast(v10_1.GatewayDispatchEvents.ThreadCreate, __assign(__assign({}, threadChannel), { newly_created: true }));
                            }
                        }
                        translated = events.translateMessageCreate({
                            event: event,
                            guildId: workspaceId,
                            author: author,
                        });
                        if (translated) {
                            gateway.broadcast(translated.eventName, translated.data);
                        }
                        return [2 /*return*/];
                    case 4:
                        if (!(eventType === 'reaction_added' ||
                            eventType === 'reaction_removed')) return [3 /*break*/, 6];
                        return [4 /*yield*/, resolveThreadTsForReaction({
                                slack: slack,
                                event: event,
                            })];
                    case 5:
                        threadTs = _e.sent();
                        translated = events.translateReaction({
                            event: event,
                            guildId: workspaceId,
                            threadTs: threadTs,
                        });
                        gateway.broadcast(translated.eventName, translated.data);
                        return [2 /*return*/];
                    case 6:
                        if (eventType === 'channel_created') {
                            translated = events.translateChannelCreate({
                                channelId: event.channelId,
                                channelName: event.channelName,
                                guildId: workspaceId,
                            });
                            gateway.broadcast(translated.eventName, translated.data);
                            return [2 /*return*/];
                        }
                        if (eventType === 'channel_deleted') {
                            translated = events.translateChannelDelete({
                                channelId: event.channelId,
                                guildId: workspaceId,
                            });
                            gateway.broadcast(translated.eventName, translated.data);
                            return [2 /*return*/];
                        }
                        if (eventType === 'channel_rename') {
                            translated = events.translateChannelRename({
                                channelId: event.channelId,
                                channelName: event.channelName,
                                guildId: workspaceId,
                            });
                            gateway.broadcast(translated.eventName, translated.data);
                            return [2 /*return*/];
                        }
                        if (!(eventType === 'member_joined_channel')) return [3 /*break*/, 8];
                        return [4 /*yield*/, lookupUser(slack, event.userId)];
                    case 7:
                        memberUser = _e.sent();
                        translated = events.translateMemberJoinedChannel({
                            event: event,
                            user: memberUser,
                        });
                        gateway.broadcast(translated.eventName, __assign(__assign({}, translated.data), { guild_id: workspaceId }));
                        return [2 /*return*/];
                    case 8:
                        console.warn('Unhandled Slack event', { eventType: eventType, subtype: subtype });
                        return [2 /*return*/];
                }
            });
        });
    }
    function handleSlashCommand(params) {
        var _a, _b, _c, _d, _e, _f, _g;
        var command = (_a = params.get('command')) !== null && _a !== void 0 ? _a : '';
        var userId = (_b = params.get('user_id')) !== null && _b !== void 0 ? _b : '';
        var channelId = (_c = params.get('channel_id')) !== null && _c !== void 0 ? _c : '';
        var triggerId = (_d = params.get('trigger_id')) !== null && _d !== void 0 ? _d : '';
        var responseUrl = (_e = params.get('response_url')) !== null && _e !== void 0 ? _e : '';
        var commandName = command.replace(/^\//, '');
        var resolvedCommand = findRegisteredCommandByName({
            commandName: commandName,
            applicationId: botUserId,
            guildId: workspaceId,
            applicationCommandRegistry: applicationCommandRegistry,
        });
        var resolvedCommandInput = findRegisteredCommandInputByName({
            commandName: commandName,
            applicationId: botUserId,
            guildId: workspaceId,
            applicationCommandInputRegistry: applicationCommandInputRegistry,
        });
        if (triggerId) {
            var modalPayload = buildSlashCommandModalPayload({
                commandName: commandName,
                channelId: channelId,
                commandInput: resolvedCommandInput,
            });
            void slack.views.open({
                trigger_id: triggerId,
                view: modalPayload.view,
            }).catch(function (error) {
                console.warn('Failed to open slash command modal', {
                    commandName: commandName,
                    error: getErrorMessage(error),
                });
            });
            return;
        }
        var interactionId = crypto.randomUUID();
        var interactionToken = crypto.randomUUID();
        pendingInteractions.set(interactionId, {
            id: interactionId,
            token: interactionToken,
            channelId: channelId,
            guildId: workspaceId,
            triggerId: triggerId,
            responseUrl: responseUrl,
            acknowledged: false,
        });
        // Broadcast as INTERACTION_CREATE
        gateway.broadcast(v10_1.GatewayDispatchEvents.InteractionCreate, {
            id: interactionId,
            application_id: botUserId,
            type: v10_1.InteractionType.ApplicationCommand,
            token: interactionToken,
            version: 1,
            entitlements: [],
            channel_id: channelId,
            guild_id: workspaceId,
            member: {
                user: {
                    id: userId,
                    username: (_f = params.get('user_name')) !== null && _f !== void 0 ? _f : userId,
                    discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
                    avatar: null,
                },
                roles: [],
                joined_at: new Date().toISOString(),
                deaf: false,
                mute: false,
            },
            data: {
                id: (_g = resolvedCommand === null || resolvedCommand === void 0 ? void 0 : resolvedCommand.id) !== null && _g !== void 0 ? _g : interactionId,
                name: commandName,
                type: v10_1.ApplicationCommandType.ChatInput,
                options: [],
            },
        });
    }
    function handleInteractivePayload(payloadStr) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, normalizedPayload, options, _i, _a, action, interactionId, interactionToken, slackChannelId, threadTs, messageTs, channelId, interactionData, decodedAction, messageId, modalInteractionId, modalInteractionToken, modalChannelId, slashModalMetadata, commandChannelId, options, registeredCommand;
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            return __generator(this, function (_m) {
                switch (_m.label) {
                    case 0:
                        try {
                            payload = JSON.parse(payloadStr);
                        }
                        catch (_o) {
                            console.warn('Failed to parse Slack interactive payload', {
                                payloadPreview: payloadStr.slice(0, 200),
                            });
                            return [2 /*return*/, undefined];
                        }
                        normalizedPayload = normalizeSlackInteractivePayload(payload);
                        if (!normalizedPayload) {
                            console.warn('Unhandled Slack interactive payload', __assign(__assign({}, collectInteractivePayloadDebugInfo(payload)), { payloadPreview: payloadStr.slice(0, 300) }));
                            return [2 /*return*/, undefined];
                        }
                        if (!(normalizedPayload.type === 'block_suggestion')) return [3 /*break*/, 2];
                        return [4 /*yield*/, resolveAutocompleteSuggestions({
                                payload: normalizedPayload,
                                pendingAutocompleteRequests: pendingAutocompleteRequests,
                                applicationCommandRegistry: applicationCommandRegistry,
                                botUserId: botUserId,
                                workspaceId: workspaceId,
                                gateway: gateway,
                            })];
                    case 1:
                        options = _m.sent();
                        return [2 /*return*/, Response.json({
                                options: options.map(function (option) {
                                    return {
                                        text: {
                                            type: 'plain_text',
                                            text: normalizeModalLabelText(option.name, option.name),
                                        },
                                        value: option.value,
                                    };
                                }),
                            })];
                    case 2:
                        if (normalizedPayload.type === 'block_actions') {
                            console.log('Slack interactive block_actions received', {
                                actionCount: normalizedPayload.actions.length,
                                channelId: normalizedPayload.channelId,
                                messageTs: normalizedPayload.messageTs,
                                threadTs: normalizedPayload.threadTs,
                            });
                            for (_i = 0, _a = normalizedPayload.actions; _i < _a.length; _i++) {
                                action = _a[_i];
                                interactionId = crypto.randomUUID();
                                interactionToken = crypto.randomUUID();
                                slackChannelId = normalizedPayload.channelId;
                                if (!slackChannelId) {
                                    console.warn('Dropping Slack block_actions payload without channel id', {
                                        actionId: action.actionId,
                                        actionType: action.type,
                                        messageTs: normalizedPayload.messageTs,
                                        threadTs: normalizedPayload.threadTs,
                                    });
                                    continue;
                                }
                                threadTs = normalizedPayload.threadTs;
                                messageTs = normalizedPayload.messageTs;
                                channelId = (0, id_converter_js_1.resolveDiscordChannelId)(slackChannelId, threadTs, messageTs);
                                interactionData = buildDiscordComponentDataFromSlackAction({
                                    action: action,
                                });
                                decodedAction = (0, component_id_codec_js_1.decodeComponentActionId)(action.actionId);
                                pendingInteractions.set(interactionId, {
                                    id: interactionId,
                                    token: interactionToken,
                                    channelId: channelId,
                                    guildId: workspaceId,
                                    triggerId: normalizedPayload.triggerId,
                                    responseUrl: normalizedPayload.responseUrl,
                                    acknowledged: false,
                                    messageTs: messageTs,
                                    submitLabel: action.buttonText,
                                });
                                messageId = messageTs
                                    ? (0, id_converter_js_1.encodeMessageId)(slackChannelId, messageTs)
                                    : interactionId;
                                console.log('Emitting Discord interaction from Slack block action', {
                                    interactionId: interactionId,
                                    actionId: action.actionId,
                                    actionType: action.type,
                                    customId: decodedAction.customId,
                                    componentType: interactionData.componentType,
                                    channelId: channelId,
                                    messageTs: messageTs,
                                    threadTs: threadTs,
                                });
                                gateway.broadcast(v10_1.GatewayDispatchEvents.InteractionCreate, {
                                    id: interactionId,
                                    application_id: botUserId,
                                    type: v10_1.InteractionType.MessageComponent,
                                    token: interactionToken,
                                    version: 1,
                                    entitlements: [],
                                    channel_id: channelId,
                                    guild_id: workspaceId,
                                    member: {
                                        user: {
                                            id: normalizedPayload.user.id,
                                            username: (_c = (_b = normalizedPayload.user.username) !== null && _b !== void 0 ? _b : normalizedPayload.user.name) !== null && _c !== void 0 ? _c : 'unknown',
                                            discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
                                            avatar: null,
                                        },
                                        roles: [],
                                        joined_at: new Date().toISOString(),
                                        deaf: false,
                                        mute: false,
                                    },
                                    data: __assign({ custom_id: decodedAction.customId, component_type: interactionData.componentType, values: interactionData.values }, ((_d = buildResolvedData({
                                        componentType: interactionData.componentType,
                                        values: interactionData.values,
                                    })) !== null && _d !== void 0 ? _d : {})),
                                    message: {
                                        id: messageId,
                                        channel_id: channelId,
                                        content: '',
                                        attachments: [],
                                        embeds: [],
                                        components: [],
                                        author: {
                                            id: botUserId,
                                            username: botUsername,
                                            discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
                                            avatar: null,
                                        },
                                        timestamp: new Date().toISOString(),
                                        edited_timestamp: null,
                                        tts: false,
                                        mention_everyone: false,
                                        mentions: [],
                                        mention_roles: [],
                                        pinned: false,
                                        type: v10_1.MessageType.Default,
                                    },
                                });
                            }
                            return [2 /*return*/];
                        }
                        modalInteractionId = crypto.randomUUID();
                        modalInteractionToken = crypto.randomUUID();
                        modalChannelId = (_e = normalizedPayload.channelId) !== null && _e !== void 0 ? _e : '';
                        slashModalMetadata = parseSlashCommandModalMetadata(normalizedPayload.privateMetadata);
                        if (slashModalMetadata) {
                            commandChannelId = modalChannelId || slashModalMetadata.channelId;
                            options = buildInteractionOptionsFromModalSubmission({
                                metadata: slashModalMetadata,
                                stateValues: normalizedPayload.stateValues,
                            });
                            registeredCommand = findRegisteredCommandByName({
                                commandName: slashModalMetadata.commandName,
                                applicationId: botUserId,
                                guildId: workspaceId,
                                applicationCommandRegistry: applicationCommandRegistry,
                            });
                            pendingInteractions.set(modalInteractionId, {
                                id: modalInteractionId,
                                token: modalInteractionToken,
                                channelId: commandChannelId,
                                guildId: workspaceId,
                                triggerId: normalizedPayload.triggerId,
                                responseUrl: normalizedPayload.responseUrl,
                                acknowledged: false,
                            });
                            gateway.broadcast(v10_1.GatewayDispatchEvents.InteractionCreate, {
                                id: modalInteractionId,
                                application_id: botUserId,
                                type: v10_1.InteractionType.ApplicationCommand,
                                token: modalInteractionToken,
                                version: 1,
                                entitlements: [],
                                channel_id: commandChannelId,
                                guild_id: workspaceId,
                                member: {
                                    user: {
                                        id: normalizedPayload.user.id,
                                        username: (_g = (_f = normalizedPayload.user.username) !== null && _f !== void 0 ? _f : normalizedPayload.user.name) !== null && _g !== void 0 ? _g : 'unknown',
                                        discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
                                        avatar: null,
                                    },
                                    roles: [],
                                    joined_at: new Date().toISOString(),
                                    deaf: false,
                                    mute: false,
                                },
                                data: {
                                    id: (_h = registeredCommand === null || registeredCommand === void 0 ? void 0 : registeredCommand.id) !== null && _h !== void 0 ? _h : modalInteractionId,
                                    name: slashModalMetadata.commandName,
                                    type: v10_1.ApplicationCommandType.ChatInput,
                                    options: options,
                                },
                            });
                            return [2 /*return*/];
                        }
                        console.log('Slack interactive view_submission received', {
                            channelId: modalChannelId,
                            callbackId: normalizedPayload.callbackId,
                            stateValues: normalizedPayload.stateValues.length,
                        });
                        pendingInteractions.set(modalInteractionId, {
                            id: modalInteractionId,
                            token: modalInteractionToken,
                            channelId: modalChannelId,
                            guildId: workspaceId,
                            triggerId: normalizedPayload.triggerId,
                            responseUrl: normalizedPayload.responseUrl,
                            acknowledged: false,
                        });
                        gateway.broadcast(v10_1.GatewayDispatchEvents.InteractionCreate, {
                            id: modalInteractionId,
                            application_id: botUserId,
                            type: v10_1.InteractionType.ModalSubmit,
                            token: modalInteractionToken,
                            version: 1,
                            entitlements: [],
                            channel_id: modalChannelId,
                            guild_id: workspaceId,
                            member: {
                                user: {
                                    id: normalizedPayload.user.id,
                                    username: (_k = (_j = normalizedPayload.user.username) !== null && _j !== void 0 ? _j : normalizedPayload.user.name) !== null && _k !== void 0 ? _k : 'unknown',
                                    discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
                                    avatar: null,
                                },
                                roles: [],
                                joined_at: new Date().toISOString(),
                                deaf: false,
                                mute: false,
                            },
                            data: {
                                custom_id: (_l = normalizedPayload.callbackId) !== null && _l !== void 0 ? _l : 'modal',
                                components: toDiscordModalComponents({
                                    stateValues: normalizedPayload.stateValues,
                                }),
                            },
                        });
                        return [2 /*return*/];
                }
            });
        });
    }
    app.route({
        method: '*',
        path: '/*',
        handler: function (_a) {
            var request = _a.request;
            var method = request.method;
            var url = request.url;
            console.warn('Unhandled bridge route', {
                method: method,
                url: url,
            });
            return new Response("Cannot ".concat(method, " ").concat(url), {
                status: 404,
            });
        },
    });
    var loadGatewayState = function () { return __awaiter(_this, void 0, void 0, function () {
        var authResult, listArgs, channelsList, channels, workspaceName, gatewayGuild;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, slack.auth.test()];
                case 1:
                    authResult = _c.sent();
                    listArgs = {
                        types: 'public_channel,private_channel',
                        exclude_archived: true,
                        limit: 200,
                    };
                    return [4 /*yield*/, slack.conversations.list(listArgs)];
                case 2:
                    channelsList = _c.sent();
                    channels = ((_a = channelsList.channels) !== null && _a !== void 0 ? _a : [])
                        .filter(function (ch) {
                        return !!ch.id;
                    })
                        .map(function (ch) {
                        var _a, _b, _c;
                        return {
                            id: ch.id,
                            type: v10_1.ChannelType.GuildText,
                            name: (_a = ch.name) !== null && _a !== void 0 ? _a : '',
                            guild_id: workspaceId,
                            topic: (_c = (_b = ch.topic) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : null,
                            position: 0,
                        };
                    });
                    workspaceName = (_b = authResult.team) !== null && _b !== void 0 ? _b : 'Slack Workspace';
                    gatewayGuild = buildGatewayGuild({
                        workspaceId: workspaceId,
                        workspaceName: workspaceName,
                        botUserId: botUserId,
                    });
                    return [2 /*return*/, {
                            botUser: {
                                id: botUserId,
                                username: botUsername,
                                discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
                                avatar: null,
                                global_name: botUsername,
                            },
                            guilds: [
                                {
                                    id: workspaceId,
                                    apiGuild: gatewayGuild,
                                    joinedAt: new Date().toISOString(),
                                    members: [
                                        {
                                            user: {
                                                id: botUserId,
                                                username: botUsername,
                                                discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
                                                avatar: null,
                                                global_name: botUsername,
                                            },
                                            roles: [],
                                            joined_at: new Date().toISOString(),
                                            deaf: false,
                                            mute: false,
                                            flags: v10_1.GuildMemberFlags.CompletedOnboarding,
                                        },
                                    ],
                                    channels: channels,
                                },
                            ],
                        }];
            }
        });
    }); };
    return {
        app: app,
        loadGatewayState: loadGatewayState,
        setGateway: function (nextGateway) {
            gateway = nextGateway;
        },
    };
}
function createServer(config) {
    var _this = this;
    var bridgeApp = createBridgeApp(config);
    var httpServer = node_http_1.default.createServer(function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var unauthorizedResponse, err_1, mapped;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, authorizeIncomingRestRequest({
                            authorize: config.authorize,
                            request: req,
                            workspaceId: config.workspaceId,
                        })];
                case 1:
                    unauthorizedResponse = _a.sent();
                    if (unauthorizedResponse) {
                        res.writeHead(unauthorizedResponse.status, {
                            'content-type': 'application/json',
                        });
                        res.end(JSON.stringify({
                            code: unauthorizedResponse.code,
                            message: unauthorizedResponse.message,
                        }));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, bridgeApp.app.handleForNode(req, res)];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    if (err_1 instanceof rest.DiscordApiError) {
                        res.writeHead(err_1.httpStatus, { 'content-type': 'application/json' });
                        res.end(JSON.stringify({ code: err_1.discordCode, message: err_1.message }));
                        return [2 /*return*/];
                    }
                    mapped = rest.mapSlackErrorToDiscordError(err_1);
                    res.writeHead(mapped.httpStatus, { 'content-type': 'application/json' });
                    res.end(JSON.stringify({ code: mapped.discordCode, message: mapped.message }));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    var gateway = new gateway_js_1.SlackBridgeGateway({
        httpServer: httpServer,
        port: config.port,
        loadState: bridgeApp.loadGatewayState,
        expectedToken: config.botToken,
        authorize: config.authorize,
        workspaceId: config.workspaceId,
        gatewayUrlOverride: resolveGatewayUrl({
            gatewayUrlOverride: config.gatewayUrlOverride,
            publicBaseUrl: config.publicBaseUrl,
            port: config.port,
        }),
    });
    bridgeApp.setGateway(gateway);
    return { httpServer: httpServer, gateway: gateway, app: bridgeApp.app };
}
function startServer(components, port) {
    return new Promise(function (resolve) {
        components.httpServer.listen(port, function () {
            resolve();
        });
    });
}
function stopServer(components) {
    components.gateway.close();
    return new Promise(function (resolve, reject) {
        components.httpServer.close(function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
// ---- Helpers ----
function resolveGatewayUrl(_a) {
    var request = _a.request, gatewayUrlOverride = _a.gatewayUrlOverride, publicBaseUrl = _a.publicBaseUrl, port = _a.port;
    if (gatewayUrlOverride) {
        return gatewayUrlOverride;
    }
    if (publicBaseUrl) {
        return buildWebSocketUrlFromHttpBase({
            httpBaseUrl: publicBaseUrl,
            path: '/slack/gateway',
        });
    }
    if (request) {
        return buildWebSocketUrlFromHttpBase({
            httpBaseUrl: request.url,
            path: '/slack/gateway',
        });
    }
    return "ws://127.0.0.1:".concat(port, "/slack/gateway");
}
function buildWebSocketUrlFromHttpBase(_a) {
    var httpBaseUrl = _a.httpBaseUrl, path = _a.path;
    var baseUrl = new URL(httpBaseUrl);
    var protocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    var wsBase = "".concat(protocol, "//").concat(baseUrl.host);
    return new URL(path, wsBase).toString();
}
function getClientIdFromGatewayAuthorizationHeader(authorizationHeader) {
    if (!authorizationHeader) {
        return undefined;
    }
    var token = authorizationHeader.trim().split(/\s+/).at(-1);
    if (!token) {
        return undefined;
    }
    var tokenParts = token.split(':');
    if (tokenParts.length !== 2) {
        return undefined;
    }
    return tokenParts[0] || undefined;
}
function appendClientIdToGatewayUrl(_a) {
    var gatewayUrl = _a.gatewayUrl, clientId = _a.clientId;
    try {
        var url = new URL(gatewayUrl);
        url.searchParams.set('clientId', clientId);
        return url.toString();
    }
    catch (_b) {
        return gatewayUrl;
    }
}
function createNoopGatewayEmitter() {
    return {
        broadcast: function () {
            return undefined;
        },
        broadcastMessageCreate: function () {
            return undefined;
        },
        close: function () {
            return undefined;
        },
    };
}
function authorizeIncomingRestRequest(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var method, pathname, token, result;
        var _c, _d, _e;
        var authorize = _b.authorize, request = _b.request, workspaceId = _b.workspaceId;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (!authorize) {
                        return [2 /*return*/, undefined];
                    }
                    method = (_c = request.method) !== null && _c !== void 0 ? _c : 'GET';
                    pathname = new URL((_d = request.url) !== null && _d !== void 0 ? _d : '/', 'http://localhost').pathname;
                    if (!pathname.startsWith('/api/v10/')) {
                        return [2 /*return*/, undefined];
                    }
                    if (isRestRouteAllowedWithoutAuth({ method: method, pathname: pathname })) {
                        return [2 /*return*/, undefined];
                    }
                    token = extractAuthorizationToken(request.headers.authorization);
                    if (!token) {
                        return [2 /*return*/, {
                                status: 401,
                                code: 0,
                                message: 'Missing authorization token',
                            }];
                    }
                    return [4 /*yield*/, authorize({
                            kind: 'rest',
                            token: token,
                            teamId: workspaceId,
                            path: pathname,
                            method: method,
                        })];
                case 1:
                    result = _f.sent();
                    if (!result.allow) {
                        return [2 /*return*/, {
                                status: 401,
                                code: 0,
                                message: 'Authentication failed',
                            }];
                    }
                    if (!((_e = result.authorizedTeamIds) === null || _e === void 0 ? void 0 : _e.includes(workspaceId))) {
                        return [2 /*return*/, {
                                status: 403,
                                code: 50001,
                                message: 'Missing access to Slack workspace',
                            }];
                    }
                    return [2 /*return*/, undefined];
            }
        });
    });
}
function isRestRouteAllowedWithoutAuth(_a) {
    var method = _a.method, pathname = _a.pathname;
    var routeSegments = pathname.split('/').filter(function (segment) {
        return segment.length > 0;
    });
    if (routeSegments[0] !== 'api' || routeSegments[1] !== 'v10') {
        return false;
    }
    var route = routeSegments.slice(2);
    var normalizedMethod = method.toUpperCase();
    if (route[0] === 'interactions') {
        return (normalizedMethod === 'POST' &&
            route[1] !== undefined &&
            route[1].length > 0 &&
            route[2] !== undefined &&
            route[2].length > 0 &&
            route[3] === 'callback' &&
            route.length === 4);
    }
    if (route[0] === 'webhooks') {
        return isTokenizedWebhookRouteAllowedWithoutAuth({
            method: normalizedMethod,
            route: route,
        });
    }
    return false;
}
function isTokenizedWebhookRouteAllowedWithoutAuth(_a) {
    var method = _a.method, route = _a.route;
    if (!(route[1] && route[2])) {
        return false;
    }
    if (route.length === 3) {
        return method === 'POST';
    }
    if (route.length === 5 &&
        route[3] === 'messages' &&
        route[4] !== undefined &&
        route[4].length > 0) {
        return method === 'GET' || method === 'PATCH' || method === 'DELETE';
    }
    return (route.length >= 4 &&
        route[3] === 'messages' &&
        method === 'POST');
}
function extractAuthorizationToken(authorizationHeader) {
    var rawValue = Array.isArray(authorizationHeader)
        ? authorizationHeader[0]
        : authorizationHeader;
    if (!rawValue) {
        return undefined;
    }
    var parts = rawValue.trim().split(/\s+/);
    var token = parts[parts.length - 1];
    return token || undefined;
}
function authorizeSlackInbound(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var result;
        var authorize = _b.authorize, kind = _b.kind, teamId = _b.teamId, request = _b.request, workspaceId = _b.workspaceId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!authorize) {
                        return [2 /*return*/, true];
                    }
                    if (!teamId || teamId !== workspaceId) {
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, authorize({
                            kind: kind,
                            teamId: teamId,
                            request: request,
                        })];
                case 1:
                    result = _c.sent();
                    if (!result.allow) {
                        return [2 /*return*/, false];
                    }
                    if (result.authorizedTeamIds) {
                        return [2 /*return*/, result.authorizedTeamIds.includes(teamId)];
                    }
                    return [2 /*return*/, true];
            }
        });
    });
}
/** Evict oldest entries from a Set when it exceeds maxSize. */
function evictIfFull(set, maxSize) {
    if (set.size < maxSize) {
        return;
    }
    // Evict oldest 10% to avoid frequent evictions
    var evictCount = Math.max(1, Math.floor(maxSize * 0.1));
    var removed = 0;
    for (var _i = 0, set_1 = set; _i < set_1.length; _i++) {
        var key = set_1[_i];
        if (removed >= evictCount) {
            break;
        }
        set.delete(key);
        removed++;
    }
}
function evictMapIfFull(map, maxSize) {
    if (map.size < maxSize) {
        return;
    }
    var evictCount = Math.max(1, Math.floor(maxSize * 0.1));
    var keys = __spreadArray([], map.keys(), true).slice(0, evictCount);
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        map.delete(key);
    }
}
function pruneExpiredEventIds(_a) {
    var seenEventIds = _a.seenEventIds, now = _a.now;
    for (var _i = 0, _b = seenEventIds.entries(); _i < _b.length; _i++) {
        var _c = _b[_i], eventId = _c[0], expiresAt = _c[1];
        if (expiresAt <= now) {
            seenEventIds.delete(eventId);
        }
    }
}
/**
 * Resolve the actual message ID to use for webhook follow-up routes.
 * - `@original` → use the interaction's source message ts (pending.messageTs)
 * - any other value → use it as-is (already an encoded message ID or raw ts)
 * Returns undefined if @original is requested but no source message exists.
 */
function resolveWebhookMessageId(_a) {
    var rawMessageId = _a.rawMessageId, pending = _a.pending, channelId = _a.channelId;
    if (!rawMessageId || rawMessageId === '@original') {
        if (!pending.messageTs) {
            return undefined;
        }
        return (0, id_converter_js_1.encodeMessageId)((0, id_converter_js_1.resolveSlackTarget)(channelId).channel, pending.messageTs);
    }
    return rawMessageId;
}
function errorJsonResponse(_a) {
    var _b;
    var status = _a.status, error = _a.error, code = _a.code, message = _a.message, details = _a.details, errorDescription = _a.errorDescription;
    var resolvedMessage = message !== null && message !== void 0 ? message : humanizeErrorCode(error);
    var resolvedErrorDescription = (_b = errorDescription !== null && errorDescription !== void 0 ? errorDescription : details) !== null && _b !== void 0 ? _b : resolvedMessage;
    return Response.json(__assign(__assign(__assign(__assign({ error: error }, (code !== undefined ? { code: code } : {})), (resolvedMessage ? { message: resolvedMessage } : {})), (details ? { details: details } : {})), (resolvedErrorDescription
        ? { error_description: resolvedErrorDescription }
        : {})), { status: status });
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
function humanizeErrorCode(error) {
    var withSpaces = error.replaceAll('_', ' ');
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}
/** Return a Discord-shaped 404 for unknown guild IDs. */
function unknownGuildResponse(guildId) {
    return errorJsonResponse({
        status: 404,
        error: 'unknown_guild',
        code: 10004,
        message: "Unknown Guild: ".concat(guildId),
    });
}
var SUPPORTED_SLACK_EVENT_TYPES = new Set([
    'message',
    'app_mention',
    'reaction_added',
    'reaction_removed',
    'channel_created',
    'channel_deleted',
    'channel_rename',
    'member_joined_channel',
]);
var SUPPORTED_SLACK_ACTION_TYPES = new Set([
    'button',
    'static_select',
    'multi_static_select',
    'users_select',
    'multi_users_select',
    'conversations_select',
    'multi_conversations_select',
    'channels_select',
    'multi_channels_select',
]);
function normalizeSlackEventEnvelope(payload) {
    if (!isRecord(payload)) {
        return undefined;
    }
    var payloadType = readString(payload, 'type');
    if (payloadType === 'url_verification') {
        var challenge = readString(payload, 'challenge');
        if (!challenge) {
            return undefined;
        }
        return {
            type: 'url_verification',
            challenge: challenge,
        };
    }
    if (payloadType !== 'event_callback') {
        return undefined;
    }
    var rawEvent = payload['event'];
    var event = normalizeSlackEvent(rawEvent);
    if (!event) {
        return undefined;
    }
    return {
        type: 'event_callback',
        eventId: readString(payload, 'event_id'),
        event: event,
    };
}
function normalizeSlackEvent(event) {
    if (!isRecord(event)) {
        return undefined;
    }
    var eventType = readString(event, 'type');
    if (!eventType) {
        return undefined;
    }
    var supportedType = normalizeSupportedSlackEventType(eventType);
    if (!supportedType) {
        return undefined;
    }
    if (supportedType === 'reaction_added' || supportedType === 'reaction_removed') {
        return normalizeSlackReactionEvent({
            event: event,
            type: supportedType,
        });
    }
    if (supportedType === 'channel_created') {
        var channel = readRecord(event, 'channel');
        var channelId = channel ? readString(channel, 'id') : undefined;
        var channelName = channel ? readString(channel, 'name') : undefined;
        if (!(channelId && channelName)) {
            return undefined;
        }
        return {
            type: 'channel_created',
            channelId: channelId,
            channelName: channelName,
        };
    }
    if (supportedType === 'channel_deleted') {
        var channel = readString(event, 'channel');
        if (!channel) {
            return undefined;
        }
        return {
            type: 'channel_deleted',
            channelId: channel,
        };
    }
    if (supportedType === 'channel_rename') {
        var channel = readRecord(event, 'channel');
        var channelId = channel ? readString(channel, 'id') : undefined;
        var channelName = channel ? readString(channel, 'name') : undefined;
        if (!(channelId && channelName)) {
            return undefined;
        }
        return {
            type: 'channel_rename',
            channelId: channelId,
            channelName: channelName,
        };
    }
    if (supportedType === 'member_joined_channel') {
        var userId = readString(event, 'user');
        var channelId = readString(event, 'channel');
        if (!(userId && channelId)) {
            return undefined;
        }
        return {
            type: 'member_joined_channel',
            userId: userId,
            channelId: channelId,
        };
    }
    return normalizeSlackMessageEvent({
        event: event,
        type: supportedType,
    });
}
function normalizeSlackMessageEvent(_a) {
    var event = _a.event, type = _a.type;
    var channel = readString(event, 'channel');
    if (!channel) {
        return undefined;
    }
    return {
        type: type,
        subtype: readString(event, 'subtype'),
        channel: channel,
        user: readString(event, 'user'),
        botId: readString(event, 'bot_id'),
        text: readString(event, 'text'),
        ts: readString(event, 'ts'),
        threadTs: readString(event, 'thread_ts'),
        message: normalizeSlackMessage(readRecord(event, 'message')),
        previousMessage: normalizeSlackMessage(readRecord(event, 'previous_message')),
        deletedTs: readString(event, 'deleted_ts'),
        files: normalizeSlackFiles(readArray(event, 'files')),
    };
}
function normalizeSlackMessage(message) {
    if (!message) {
        return undefined;
    }
    var ts = readString(message, 'ts');
    if (!ts) {
        return undefined;
    }
    var edited = readRecord(message, 'edited');
    return {
        user: readString(message, 'user'),
        botId: readString(message, 'bot_id'),
        text: readString(message, 'text'),
        ts: ts,
        threadTs: readString(message, 'thread_ts'),
        editedTs: edited ? readString(edited, 'ts') : undefined,
        files: normalizeSlackFiles(readArray(message, 'files')),
    };
}
function normalizeSlackFiles(rawFiles) {
    var files = rawFiles
        .map(function (rawFile) {
        var _a, _b, _c, _d;
        if (!isRecord(rawFile)) {
            return undefined;
        }
        var id = readString(rawFile, 'id');
        var name = readString(rawFile, 'name');
        if (!(id && name)) {
            return undefined;
        }
        return {
            id: id,
            name: name,
            mimetype: (_a = readString(rawFile, 'mimetype')) !== null && _a !== void 0 ? _a : undefined,
            urlPrivate: (_b = readString(rawFile, 'url_private')) !== null && _b !== void 0 ? _b : undefined,
            permalink: (_c = readString(rawFile, 'permalink')) !== null && _c !== void 0 ? _c : undefined,
            size: (_d = readNumber(rawFile, 'size')) !== null && _d !== void 0 ? _d : undefined,
        };
    })
        .filter(isDefined);
    return files.length > 0 ? files : undefined;
}
function normalizeSlackReactionEvent(_a) {
    var event = _a.event, type = _a.type;
    var user = readString(event, 'user');
    var reaction = readString(event, 'reaction');
    var item = readRecord(event, 'item');
    if (!(user && reaction && item)) {
        return undefined;
    }
    var itemType = readString(item, 'type');
    var itemChannel = readString(item, 'channel');
    var itemTs = readString(item, 'ts');
    if (!(itemType && itemChannel && itemTs)) {
        return undefined;
    }
    return {
        type: type,
        user: user,
        reaction: reaction,
        item: {
            type: itemType,
            channel: itemChannel,
            ts: itemTs,
        },
        item_user: readString(event, 'item_user'),
        event_ts: readString(event, 'event_ts'),
    };
}
function normalizeSlackBlockActionsPayload(payload) {
    var _a, _b, _c;
    var userId = payload.user.id;
    if (!userId) {
        return undefined;
    }
    var channel = payload.channel;
    var message = payload.message;
    var container = payload.container;
    var actions = payload.actions
        .map(function (rawAction) {
        return normalizeSlackAction(rawAction);
    })
        .filter(isDefined);
    if (actions.length === 0) {
        return undefined;
    }
    return {
        type: 'block_actions',
        triggerId: payload.trigger_id,
        responseUrl: payload.response_url,
        user: {
            id: userId,
            username: payload.user.username,
            name: payload.user.name,
        },
        channelId: (_a = (channel ? channel.id : undefined)) !== null && _a !== void 0 ? _a : (container ? container.channel_id : undefined),
        messageTs: (_b = (message ? message.ts : undefined)) !== null && _b !== void 0 ? _b : (container ? container.message_ts : undefined),
        threadTs: (_c = (message ? message.thread_ts : undefined)) !== null && _c !== void 0 ? _c : (container ? container.thread_ts : undefined),
        actions: actions,
    };
}
function normalizeSlackViewSubmissionPayload(payload) {
    var userId = payload.user.id;
    if (!userId) {
        return undefined;
    }
    var view = payload.view;
    var stateValues = normalizeSlackViewSubmissionStateValues(view);
    var channelId = extractChannelIdFromViewPayload(view);
    var responseUrl = extractResponseUrlFromViewPayload(view);
    return {
        type: 'view_submission',
        triggerId: payload.trigger_id,
        responseUrl: responseUrl,
        user: {
            id: userId,
            username: payload.user.username,
            name: payload.user.name,
        },
        channelId: channelId,
        viewId: view ? view.id : undefined,
        callbackId: view ? view.callback_id : undefined,
        privateMetadata: view ? view.private_metadata : undefined,
        stateValues: stateValues,
    };
}
function normalizeSlackBlockSuggestionPayload(payload) {
    var _a, _b, _c, _d;
    var userId = payload.user.id;
    var actionId = payload.action_id;
    if (!(userId && actionId)) {
        return undefined;
    }
    return {
        type: 'block_suggestion',
        user: {
            id: userId,
            username: payload.user.username,
            name: payload.user.name,
        },
        channelId: (_a = payload.channel) === null || _a === void 0 ? void 0 : _a.id,
        actionId: actionId,
        value: (_b = payload.value) !== null && _b !== void 0 ? _b : '',
        callbackId: (_c = payload.view) === null || _c === void 0 ? void 0 : _c.callback_id,
        privateMetadata: (_d = payload.view) === null || _d === void 0 ? void 0 : _d.private_metadata,
    };
}
function parseSlackInteractivePayload(payload) {
    if (!isRecord(payload)) {
        return undefined;
    }
    var payloadType = readString(payload, 'type');
    if (payloadType === 'block_actions') {
        var user = readRecord(payload, 'user');
        var userId = user ? readString(user, 'id') : undefined;
        if (!userId) {
            return undefined;
        }
        var actions = readArray(payload, 'actions');
        if (actions.length === 0) {
            return undefined;
        }
        var typedPayload = {
            type: 'block_actions',
            trigger_id: readString(payload, 'trigger_id'),
            response_url: readString(payload, 'response_url'),
            user: {
                id: userId,
                username: user ? readString(user, 'username') : undefined,
                name: user ? readString(user, 'name') : undefined,
            },
            channel: (function () {
                var channel = readRecord(payload, 'channel');
                return channel
                    ? {
                        id: readString(channel, 'id'),
                    }
                    : undefined;
            })(),
            message: (function () {
                var message = readRecord(payload, 'message');
                return message
                    ? {
                        ts: readString(message, 'ts'),
                        thread_ts: readString(message, 'thread_ts'),
                    }
                    : undefined;
            })(),
            container: (function () {
                var container = readRecord(payload, 'container');
                return container
                    ? {
                        channel_id: readString(container, 'channel_id'),
                        message_ts: readString(container, 'message_ts'),
                        thread_ts: readString(container, 'thread_ts'),
                    }
                    : undefined;
            })(),
            actions: actions
                .map(function (rawAction) {
                return parseSlackInteractiveAction(rawAction);
            })
                .filter(isDefined),
        };
        if (typedPayload.actions.length === 0) {
            return undefined;
        }
        return typedPayload;
    }
    if (payloadType === 'view_submission') {
        var user = readRecord(payload, 'user');
        var userId = user ? readString(user, 'id') : undefined;
        if (!userId) {
            return undefined;
        }
        var view_1 = readRecord(payload, 'view');
        var typedPayload = {
            type: 'view_submission',
            trigger_id: readString(payload, 'trigger_id'),
            response_url: readString(payload, 'response_url'),
            user: {
                id: userId,
                username: user ? readString(user, 'username') : undefined,
                name: user ? readString(user, 'name') : undefined,
            },
            view: view_1
                ? {
                    id: readString(view_1, 'id'),
                    callback_id: readString(view_1, 'callback_id'),
                    private_metadata: readString(view_1, 'private_metadata'),
                    response_urls: readArray(view_1, 'response_urls')
                        .map(function (entry) {
                        if (!isRecord(entry)) {
                            return undefined;
                        }
                        return {
                            response_url: readString(entry, 'response_url'),
                        };
                    })
                        .filter(isDefined),
                    state: (function () {
                        var state = readRecord(view_1, 'state');
                        var values = state ? readRecord(state, 'values') : undefined;
                        if (!values) {
                            return undefined;
                        }
                        var typedValues = Object.entries(values).reduce(function (acc, _a) {
                            var blockId = _a[0], rawBlockValue = _a[1];
                            if (!isRecord(rawBlockValue)) {
                                return acc;
                            }
                            var typedBlockValues = Object.entries(rawBlockValue).reduce(function (blockAcc, _a) {
                                var actionId = _a[0], rawActionValue = _a[1];
                                if (!isRecord(rawActionValue)) {
                                    return blockAcc;
                                }
                                blockAcc[actionId] = {
                                    value: readString(rawActionValue, 'value'),
                                    selected_option: (function () {
                                        var selectedOption = readRecord(rawActionValue, 'selected_option');
                                        if (!selectedOption) {
                                            return undefined;
                                        }
                                        return {
                                            value: readString(selectedOption, 'value'),
                                        };
                                    })(),
                                    selected_user: readString(rawActionValue, 'selected_user'),
                                    selected_channel: readString(rawActionValue, 'selected_channel'),
                                    selected_conversation: readString(rawActionValue, 'selected_conversation'),
                                };
                                return blockAcc;
                            }, {});
                            acc[blockId] = typedBlockValues;
                            return acc;
                        }, {});
                        return {
                            values: typedValues,
                        };
                    })(),
                }
                : undefined,
        };
        return typedPayload;
    }
    if (payloadType === 'block_suggestion') {
        var user = readRecord(payload, 'user');
        var userId = user ? readString(user, 'id') : undefined;
        if (!userId) {
            return undefined;
        }
        var view = readRecord(payload, 'view');
        var channel = readRecord(payload, 'channel');
        var typedPayload = {
            type: 'block_suggestion',
            user: {
                id: userId,
                username: user ? readString(user, 'username') : undefined,
                name: user ? readString(user, 'name') : undefined,
            },
            action_id: readString(payload, 'action_id'),
            value: readString(payload, 'value'),
            channel: channel
                ? {
                    id: readString(channel, 'id'),
                }
                : undefined,
            view: view
                ? {
                    id: readString(view, 'id'),
                    callback_id: readString(view, 'callback_id'),
                    private_metadata: readString(view, 'private_metadata'),
                }
                : undefined,
        };
        return typedPayload;
    }
    return undefined;
}
function parseSlackInteractiveAction(value) {
    if (!isRecord(value)) {
        return undefined;
    }
    var actionId = readString(value, 'action_id');
    var type = readString(value, 'type');
    if (!(actionId && type)) {
        return undefined;
    }
    return {
        action_id: actionId,
        type: type,
        text: (function () {
            var text = readRecord(value, 'text');
            if (!text) {
                return undefined;
            }
            return {
                text: readString(text, 'text'),
            };
        })(),
        value: readString(value, 'value'),
        selected_option: (function () {
            var option = readRecord(value, 'selected_option');
            if (!option) {
                return undefined;
            }
            return { value: readString(option, 'value') };
        })(),
        selected_options: readArray(value, 'selected_options')
            .map(function (entry) {
            if (!isRecord(entry)) {
                return undefined;
            }
            return {
                value: readString(entry, 'value'),
            };
        })
            .filter(isDefined),
        selected_user: readString(value, 'selected_user'),
        selected_users: readArray(value, 'selected_users').filter(function (entry) {
            return typeof entry === 'string';
        }),
        selected_channel: readString(value, 'selected_channel'),
        selected_channels: readArray(value, 'selected_channels').filter(function (entry) {
            return typeof entry === 'string';
        }),
        selected_conversation: readString(value, 'selected_conversation'),
        selected_conversations: readArray(value, 'selected_conversations').filter(function (entry) {
            return typeof entry === 'string';
        }),
    };
}
function normalizeSlackInteractivePayload(payload) {
    var typedPayload = parseSlackInteractivePayload(payload);
    if (!typedPayload) {
        return undefined;
    }
    if (typedPayload.type === 'block_actions') {
        return normalizeSlackBlockActionsPayload(typedPayload);
    }
    if (typedPayload.type === 'block_suggestion') {
        return normalizeSlackBlockSuggestionPayload(typedPayload);
    }
    return normalizeSlackViewSubmissionPayload(typedPayload);
}
function normalizeSlackViewSubmissionStateValues(view) {
    var _a, _b, _c, _d, _e, _f;
    if (!view) {
        return [];
    }
    var values = (_a = view.state) === null || _a === void 0 ? void 0 : _a.values;
    if (!values) {
        return [];
    }
    var collectedValues = [];
    for (var _i = 0, _g = Object.entries(values); _i < _g.length; _i++) {
        var _h = _g[_i], blockId = _h[0], rawBlockValue = _h[1];
        if (!isRecord(rawBlockValue)) {
            continue;
        }
        for (var _j = 0, _k = Object.entries(rawBlockValue); _j < _k.length; _j++) {
            var _l = _k[_j], actionId = _l[0], rawActionValue = _l[1];
            if (!isRecord(rawActionValue)) {
                continue;
            }
            var extractedValue = (_f = (_e = (_d = (_c = (_b = readString(rawActionValue, 'value')) !== null && _b !== void 0 ? _b : readViewOptionValue(rawActionValue, 'selected_option')) !== null && _c !== void 0 ? _c : readString(rawActionValue, 'selected_user')) !== null && _d !== void 0 ? _d : readString(rawActionValue, 'selected_channel')) !== null && _e !== void 0 ? _e : readString(rawActionValue, 'selected_conversation')) !== null && _f !== void 0 ? _f : '';
            collectedValues.push({
                blockId: blockId,
                actionId: actionId,
                value: extractedValue,
            });
        }
    }
    return collectedValues;
}
function readViewOptionValue(record, key) {
    var option = readRecord(record, key);
    return option ? readString(option, 'value') : undefined;
}
function extractChannelIdFromViewPayload(view) {
    if (!view) {
        return undefined;
    }
    var privateMetadata = view.private_metadata;
    if (!privateMetadata) {
        return undefined;
    }
    try {
        var metadata = JSON.parse(privateMetadata);
        if (!isRecord(metadata)) {
            return undefined;
        }
        return readString(metadata, 'channel_id');
    }
    catch (_a) {
        return undefined;
    }
}
function extractResponseUrlFromViewPayload(view) {
    if (!view) {
        return undefined;
    }
    var responseUrls = Array.isArray(view.response_urls) ? view.response_urls : [];
    for (var _i = 0, responseUrls_1 = responseUrls; _i < responseUrls_1.length; _i++) {
        var responseUrlEntry = responseUrls_1[_i];
        var responseUrl = responseUrlEntry.response_url;
        if (responseUrl) {
            return responseUrl;
        }
    }
    return undefined;
}
function toDiscordModalComponents(_a) {
    var stateValues = _a.stateValues;
    return stateValues.map(function (entry) {
        return {
            type: v10_1.ComponentType.ActionRow,
            components: [
                {
                    type: v10_1.ComponentType.TextInput,
                    custom_id: entry.actionId,
                    value: entry.value,
                },
            ],
        };
    });
}
function normalizeSlackAction(rawAction) {
    var _a, _b;
    var actionId = rawAction.action_id;
    var actionType = rawAction.type;
    if (!(actionId && actionType)) {
        return undefined;
    }
    var normalizedActionType = normalizeSupportedSlackActionType(actionType);
    if (!normalizedActionType) {
        return undefined;
    }
    return {
        actionId: actionId,
        type: normalizedActionType,
        buttonText: (_a = rawAction.text) === null || _a === void 0 ? void 0 : _a.text,
        value: rawAction.value,
        selectedOptionValue: (_b = rawAction.selected_option) === null || _b === void 0 ? void 0 : _b.value,
        selectedOptionValues: normalizeOptionValues(rawAction.selected_options),
        selectedUser: rawAction.selected_user,
        selectedUsers: normalizeStringValues(rawAction.selected_users),
        selectedChannel: rawAction.selected_channel,
        selectedChannels: normalizeStringValues(rawAction.selected_channels),
        selectedConversation: rawAction.selected_conversation,
        selectedConversations: normalizeStringValues(rawAction.selected_conversations),
    };
}
function normalizeOptionValues(options) {
    if (!Array.isArray(options)) {
        return [];
    }
    return options
        .map(function (option) {
        return option === null || option === void 0 ? void 0 : option.value;
    })
        .filter(isDefined);
}
function normalizeStringValues(values) {
    if (!Array.isArray(values)) {
        return [];
    }
    return values;
}
function readOptionValue(record, key) {
    var option = readRecord(record, key);
    return option ? readString(option, 'value') : undefined;
}
function readOptionValues(record, key) {
    return readArray(record, key)
        .map(function (entry) {
        return isRecord(entry) ? readString(entry, 'value') : undefined;
    })
        .filter(isDefined);
}
function readStringArray(record, key) {
    return readArray(record, key)
        .filter(function (entry) {
        return typeof entry === 'string';
    });
}
function readArray(record, key) {
    var value = record[key];
    return Array.isArray(value) ? value : [];
}
function readRecord(record, key) {
    var value = record[key];
    return isRecord(value) ? value : undefined;
}
function readString(record, key) {
    var value = record[key];
    return typeof value === 'string' ? value : undefined;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function isDefined(value) {
    return value !== undefined;
}
function normalizeSupportedSlackEventType(value) {
    if (value === 'message') {
        return value;
    }
    if (value === 'app_mention') {
        return value;
    }
    if (value === 'reaction_added') {
        return value;
    }
    if (value === 'reaction_removed') {
        return value;
    }
    if (value === 'channel_created') {
        return value;
    }
    if (value === 'channel_deleted') {
        return value;
    }
    if (value === 'channel_rename') {
        return value;
    }
    if (value === 'member_joined_channel') {
        return value;
    }
    return undefined;
}
function normalizeSupportedSlackActionType(value) {
    if (value === 'button') {
        return value;
    }
    if (value === 'static_select') {
        return value;
    }
    if (value === 'multi_static_select') {
        return value;
    }
    if (value === 'users_select') {
        return value;
    }
    if (value === 'multi_users_select') {
        return value;
    }
    if (value === 'conversations_select') {
        return value;
    }
    if (value === 'multi_conversations_select') {
        return value;
    }
    if (value === 'channels_select') {
        return value;
    }
    if (value === 'multi_channels_select') {
        return value;
    }
    if (value === 'external_select') {
        return value;
    }
    if (value === 'multi_external_select') {
        return value;
    }
    return undefined;
}
function collectInteractivePayloadDebugInfo(payload) {
    var _a;
    if (!isRecord(payload)) {
        return {
            actionTypes: [],
            actionCount: 0,
            hasChannelId: false,
            hasContainerChannelId: false,
            hasMessageTs: false,
            hasContainerMessageTs: false,
            hasThreadTs: false,
        };
    }
    var actions = readArray(payload, 'actions');
    var actionTypes = actions
        .map(function (entry) {
        return isRecord(entry) ? readString(entry, 'type') : undefined;
    })
        .filter(isDefined);
    var channel = readRecord(payload, 'channel');
    var container = readRecord(payload, 'container');
    var message = readRecord(payload, 'message');
    return {
        payloadType: readString(payload, 'type'),
        actionTypes: actionTypes,
        actionCount: actions.length,
        hasChannelId: Boolean(channel ? readString(channel, 'id') : undefined),
        hasContainerChannelId: Boolean(container ? readString(container, 'channel_id') : undefined),
        hasMessageTs: Boolean(message ? readString(message, 'ts') : undefined),
        hasContainerMessageTs: Boolean(container ? readString(container, 'message_ts') : undefined),
        hasThreadTs: Boolean((_a = (message ? readString(message, 'thread_ts') : undefined)) !== null && _a !== void 0 ? _a : (container ? readString(container, 'thread_ts') : undefined)),
    };
}
function normalizePostMessageRequestBody(request) {
    return __awaiter(this, void 0, void 0, function () {
        var contentType, isMultipart, _a, formData, payloadJson, payloadValue, normalizedPayload, attachments;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    contentType = (_b = request.headers.get('content-type')) !== null && _b !== void 0 ? _b : '';
                    isMultipart = contentType.toLowerCase().includes('multipart/form-data');
                    if (!!isMultipart) return [3 /*break*/, 2];
                    _a = normalizePostMessageBody;
                    return [4 /*yield*/, request.json()];
                case 1: return [2 /*return*/, _a.apply(void 0, [_c.sent()])];
                case 2: return [4 /*yield*/, request.formData()];
                case 3:
                    formData = _c.sent();
                    payloadJson = formData.get('payload_json');
                    payloadValue = (function () {
                        if (typeof payloadJson !== 'string') {
                            return undefined;
                        }
                        try {
                            return JSON.parse(payloadJson);
                        }
                        catch (_a) {
                            return undefined;
                        }
                    })();
                    normalizedPayload = normalizePostMessageBody(payloadValue);
                    return [4 /*yield*/, normalizeMultipartAttachments({
                            formData: formData,
                            payloadValue: payloadValue,
                        })];
                case 4:
                    attachments = _c.sent();
                    return [2 /*return*/, {
                            content: normalizedPayload.content,
                            embeds: normalizedPayload.embeds,
                            components: normalizedPayload.components,
                            attachments: attachments,
                        }];
            }
        });
    });
}
function normalizePostMessageBody(value) {
    if (!isRecord(value)) {
        return {};
    }
    var embeds = Array.isArray(value.embeds) ? value.embeds : undefined;
    var components = Array.isArray(value.components) ? value.components : undefined;
    var attachments = normalizeAttachmentDescriptors(value);
    return {
        content: readString(value, 'content'),
        embeds: embeds,
        components: components,
        attachments: attachments,
    };
}
function normalizeAttachmentDescriptors(value) {
    var rawAttachments = Array.isArray(value.attachments)
        ? value.attachments
        : [];
    if (rawAttachments.length === 0) {
        return undefined;
    }
    var descriptors = rawAttachments
        .map(function (rawAttachment) {
        var _a;
        if (!isRecord(rawAttachment)) {
            return undefined;
        }
        var id = readString(rawAttachment, 'id');
        var filename = readString(rawAttachment, 'filename');
        var size = readNumber(rawAttachment, 'size');
        var url = readString(rawAttachment, 'url');
        if (!(id && filename && typeof size === 'number' && size > 0 && url)) {
            return undefined;
        }
        return {
            id: id,
            filename: filename,
            size: size,
            url: url,
            content_type: (_a = readString(rawAttachment, 'content_type')) !== null && _a !== void 0 ? _a : undefined,
        };
    })
        .filter(isDefined);
    return descriptors.length > 0 ? descriptors : undefined;
}
function normalizeMultipartAttachments(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var payloadRecord, payloadAttachments, files, normalizedFiles;
        var _this = this;
        var formData = _b.formData, payloadValue = _b.payloadValue;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    payloadRecord = isRecord(payloadValue) ? payloadValue : undefined;
                    payloadAttachments = Array.isArray(payloadRecord === null || payloadRecord === void 0 ? void 0 : payloadRecord.attachments)
                        ? payloadRecord.attachments
                        : [];
                    return [4 /*yield*/, Promise.all(__spreadArray([], formData.entries(), true).map(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                            var index, payloadAttachment, payloadRecordValue, fileId, filename, mimeType, dataBuffer, _c, _d;
                            var _e, _f;
                            var fieldName = _b[0], fieldValue = _b[1];
                            return __generator(this, function (_g) {
                                switch (_g.label) {
                                    case 0:
                                        if (!(fieldValue instanceof File)) {
                                            return [2 /*return*/, undefined];
                                        }
                                        index = parseFileFieldIndex(fieldName);
                                        payloadAttachment = index === undefined
                                            ? undefined
                                            : payloadAttachments[index];
                                        payloadRecordValue = isRecord(payloadAttachment)
                                            ? payloadAttachment
                                            : undefined;
                                        fileId = (_e = (payloadRecordValue ? readString(payloadRecordValue, 'id') : undefined)) !== null && _e !== void 0 ? _e : (index !== undefined ? String(index) : fieldName);
                                        filename = (_f = (payloadRecordValue
                                            ? readString(payloadRecordValue, 'filename')
                                            : undefined)) !== null && _f !== void 0 ? _f : fieldValue.name;
                                        mimeType = fieldValue.type || 'application/octet-stream';
                                        _d = (_c = Buffer).from;
                                        return [4 /*yield*/, fieldValue.arrayBuffer()];
                                    case 1:
                                        dataBuffer = _d.apply(_c, [_g.sent()]);
                                        return [2 /*return*/, {
                                                id: fileId,
                                                filename: filename,
                                                size: fieldValue.size,
                                                url: "buffer://".concat(fileId),
                                                content_type: mimeType,
                                                data: dataBuffer,
                                            }];
                                }
                            });
                        }); }))];
                case 1:
                    files = _c.sent();
                    normalizedFiles = files.filter(isDefined);
                    if (normalizedFiles.length === 0) {
                        return [2 /*return*/, normalizeAttachmentDescriptors(payloadRecord !== null && payloadRecord !== void 0 ? payloadRecord : {})];
                    }
                    return [2 /*return*/, normalizedFiles];
            }
        });
    });
}
function parseFileFieldIndex(fieldName) {
    var _a;
    var match = /^files\[(\d+)\]$/.exec(fieldName);
    if (!match) {
        return undefined;
    }
    var index = Number.parseInt((_a = match[1]) !== null && _a !== void 0 ? _a : '', 10);
    if (!Number.isFinite(index)) {
        return undefined;
    }
    return index;
}
function normalizeEditMessageBody(value) {
    if (!isRecord(value)) {
        return {};
    }
    return {
        content: readString(value, 'content'),
    };
}
function normalizeCreateThreadBody(value) {
    var _a;
    if (!isRecord(value)) {
        return { name: 'thread' };
    }
    return {
        name: (_a = readString(value, 'name')) !== null && _a !== void 0 ? _a : 'thread',
        auto_archive_duration: readNumber(value, 'auto_archive_duration'),
    };
}
function normalizePatchChannelBody(value) {
    if (!isRecord(value)) {
        return {};
    }
    return {
        name: readString(value, 'name'),
        topic: readString(value, 'topic'),
        archived: readBoolean(value, 'archived'),
    };
}
function normalizeCreateGuildChannelBody(value) {
    var _a;
    if (!isRecord(value)) {
        return { name: 'channel' };
    }
    var channelType = readNumber(value, 'type');
    var normalizedType = channelType === v10_1.ChannelType.GuildText ||
        channelType === v10_1.ChannelType.GuildAnnouncement
        ? channelType
        : undefined;
    return {
        name: (_a = readString(value, 'name')) !== null && _a !== void 0 ? _a : 'channel',
        type: normalizedType,
    };
}
function normalizeApplicationCommandsBody(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map(function (entry) {
        var _a, _b;
        if (!isRecord(entry)) {
            return undefined;
        }
        var name = readString(entry, 'name');
        if (!name) {
            return undefined;
        }
        var rawType = readNumber(entry, 'type');
        var type = rawType === v10_1.ApplicationCommandType.User ||
            rawType === v10_1.ApplicationCommandType.Message ||
            rawType === v10_1.ApplicationCommandType.ChatInput
            ? rawType
            : v10_1.ApplicationCommandType.ChatInput;
        var description = (_a = readString(entry, 'description')) !== null && _a !== void 0 ? _a : '';
        var options = normalizeApplicationCommandOptions(readArray(entry, 'options'));
        return {
            name: name,
            description: description,
            type: type,
            defaultMemberPermissions: (_b = readString(entry, 'default_member_permissions')) !== null && _b !== void 0 ? _b : null,
            dmPermission: readBoolean(entry, 'dm_permission'),
            nsfw: readBoolean(entry, 'nsfw'),
            options: options,
        };
    })
        .filter(isDefined);
}
function normalizeApplicationCommandOptions(value) {
    return value
        .map(function (entry) {
        if (!isRecord(entry)) {
            return undefined;
        }
        var name = readString(entry, 'name');
        var description = readString(entry, 'description');
        var rawType = readNumber(entry, 'type');
        if (!(name && description && rawType)) {
            return undefined;
        }
        var type = normalizeCommandOptionType(rawType);
        if (!type) {
            return undefined;
        }
        var choices = normalizeApplicationCommandOptionChoices(readArray(entry, 'choices'));
        return {
            type: type,
            name: name,
            description: description,
            required: readBoolean(entry, 'required'),
            autocomplete: readBoolean(entry, 'autocomplete'),
            choices: choices,
        };
    })
        .filter(isDefined);
}
function normalizeApplicationCommandOptionChoices(value) {
    return value
        .map(function (entry) {
        if (!isRecord(entry)) {
            return undefined;
        }
        var name = readString(entry, 'name');
        var rawValue = entry['value'];
        var valueText = (function () {
            if (typeof rawValue === 'string') {
                return rawValue;
            }
            if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
                return String(rawValue);
            }
            return undefined;
        })();
        if (!(name && valueText)) {
            return undefined;
        }
        return {
            name: name,
            value: valueText,
        };
    })
        .filter(isDefined);
}
function normalizeCommandOptionType(value) {
    if (value === v10_1.ApplicationCommandOptionType.String ||
        value === v10_1.ApplicationCommandOptionType.Integer ||
        value === v10_1.ApplicationCommandOptionType.Boolean ||
        value === v10_1.ApplicationCommandOptionType.User ||
        value === v10_1.ApplicationCommandOptionType.Channel ||
        value === v10_1.ApplicationCommandOptionType.Role ||
        value === v10_1.ApplicationCommandOptionType.Mentionable ||
        value === v10_1.ApplicationCommandOptionType.Number) {
        return value;
    }
    return undefined;
}
function createApplicationCommandRecord(_a) {
    var _b, _c, _d;
    var applicationId = _a.applicationId, guildId = _a.guildId, command = _a.command;
    var id = createSnowflakeLikeId();
    var version = createSnowflakeLikeId();
    return __assign(__assign({ id: id, application_id: applicationId }, (guildId ? { guild_id: guildId } : {})), { name: command.name, description: command.description, type: command.type, default_member_permissions: (_b = command.defaultMemberPermissions) !== null && _b !== void 0 ? _b : null, dm_permission: (_c = command.dmPermission) !== null && _c !== void 0 ? _c : true, nsfw: (_d = command.nsfw) !== null && _d !== void 0 ? _d : false, version: version });
}
function getGlobalCommandRegistryKey(_a) {
    var applicationId = _a.applicationId;
    return "global:".concat(applicationId);
}
function getGuildCommandRegistryKey(_a) {
    var applicationId = _a.applicationId, guildId = _a.guildId;
    return "guild:".concat(applicationId, ":").concat(guildId);
}
function findRegisteredCommandByName(_a) {
    var _b, _c;
    var commandName = _a.commandName, applicationId = _a.applicationId, guildId = _a.guildId, applicationCommandRegistry = _a.applicationCommandRegistry;
    var guildKey = getGuildCommandRegistryKey({
        applicationId: applicationId,
        guildId: guildId,
    });
    var guildCommand = ((_b = applicationCommandRegistry.get(guildKey)) !== null && _b !== void 0 ? _b : []).find(function (entry) {
        return entry.name === commandName;
    });
    if (guildCommand) {
        return guildCommand;
    }
    var globalKey = getGlobalCommandRegistryKey({ applicationId: applicationId });
    return ((_c = applicationCommandRegistry.get(globalKey)) !== null && _c !== void 0 ? _c : []).find(function (entry) {
        return entry.name === commandName;
    });
}
function findRegisteredCommandInputByName(_a) {
    var _b, _c;
    var commandName = _a.commandName, applicationId = _a.applicationId, guildId = _a.guildId, applicationCommandInputRegistry = _a.applicationCommandInputRegistry;
    var guildKey = getGuildCommandRegistryKey({
        applicationId: applicationId,
        guildId: guildId,
    });
    var guildCommand = ((_b = applicationCommandInputRegistry.get(guildKey)) !== null && _b !== void 0 ? _b : []).find(function (entry) {
        return entry.name === commandName;
    });
    if (guildCommand) {
        return guildCommand;
    }
    var globalKey = getGlobalCommandRegistryKey({ applicationId: applicationId });
    return ((_c = applicationCommandInputRegistry.get(globalKey)) !== null && _c !== void 0 ? _c : []).find(function (entry) {
        return entry.name === commandName;
    });
}
function buildSlashCommandModalPayload(_a) {
    var _b;
    var commandName = _a.commandName, channelId = _a.channelId, commandInput = _a.commandInput;
    var commandOptions = (_b = commandInput === null || commandInput === void 0 ? void 0 : commandInput.options) !== null && _b !== void 0 ? _b : [];
    var metadataOptions = commandOptions.map(function (option) {
        return {
            name: option.name,
            type: option.type,
        };
    });
    var metadata = {
        commandName: commandName,
        channelId: channelId,
        options: metadataOptions,
    };
    var blocks = commandOptions.length > 0
        ? commandOptions.map(function (option) {
            return buildModalBlockFromCommandOption(option);
        })
        : [buildFallbackArgumentsBlock()];
    return {
        view: {
            type: 'modal',
            callback_id: commandName,
            title: {
                type: 'plain_text',
                text: normalizeModalLabelText(commandName, 'Command').slice(0, 24),
            },
            submit: {
                type: 'plain_text',
                text: 'Run',
            },
            close: {
                type: 'plain_text',
                text: 'Cancel',
            },
            private_metadata: JSON.stringify(metadata),
            blocks: blocks,
        },
    };
}
function buildModalBlockFromCommandOption(option) {
    if (option.choices.length > 0) {
        return {
            type: 'input',
            block_id: option.name,
            optional: option.required !== true,
            label: {
                type: 'plain_text',
                text: normalizeModalLabelText(option.description, option.name),
            },
            element: {
                type: 'static_select',
                action_id: option.name,
                placeholder: {
                    type: 'plain_text',
                    text: normalizeModalLabelText(option.name, option.name),
                },
                options: option.choices.map(function (choice) {
                    return {
                        text: {
                            type: 'plain_text',
                            text: normalizeModalLabelText(choice.name, choice.name),
                        },
                        value: choice.value,
                    };
                }),
            },
        };
    }
    if (option.autocomplete) {
        return {
            type: 'input',
            block_id: option.name,
            optional: option.required !== true,
            label: {
                type: 'plain_text',
                text: normalizeModalLabelText(option.description, option.name),
            },
            element: {
                type: 'external_select',
                action_id: option.name,
                min_query_length: 1,
                placeholder: {
                    type: 'plain_text',
                    text: normalizeModalLabelText(option.name, option.name),
                },
            },
        };
    }
    if (option.type === v10_1.ApplicationCommandOptionType.Boolean) {
        return {
            type: 'input',
            block_id: option.name,
            optional: option.required !== true,
            label: {
                type: 'plain_text',
                text: normalizeModalLabelText(option.description, option.name),
            },
            element: {
                type: 'static_select',
                action_id: option.name,
                placeholder: {
                    type: 'plain_text',
                    text: normalizeModalLabelText(option.name, option.name),
                },
                options: [
                    {
                        text: { type: 'plain_text', text: 'true' },
                        value: 'true',
                    },
                    {
                        text: { type: 'plain_text', text: 'false' },
                        value: 'false',
                    },
                ],
            },
        };
    }
    return {
        type: 'input',
        block_id: option.name,
        optional: option.required !== true,
        label: {
            type: 'plain_text',
            text: normalizeModalLabelText(option.description, option.name),
        },
        element: {
            type: 'plain_text_input',
            action_id: option.name,
            multiline: false,
            placeholder: {
                type: 'plain_text',
                text: normalizeModalLabelText(option.name, option.name),
            },
        },
    };
}
function buildFallbackArgumentsBlock() {
    return {
        type: 'input',
        block_id: 'arguments',
        optional: true,
        label: {
            type: 'plain_text',
            text: 'Arguments',
        },
        element: {
            type: 'plain_text_input',
            action_id: 'arguments',
            multiline: true,
            placeholder: {
                type: 'plain_text',
                text: 'Optional arguments',
            },
        },
    };
}
function normalizeModalLabelText(value, fallback) {
    var trimmed = value.trim();
    if (!trimmed) {
        return fallback.slice(0, 75);
    }
    return trimmed.slice(0, 75);
}
function parseSlashCommandModalMetadata(value) {
    if (!value) {
        return undefined;
    }
    try {
        var parsed = JSON.parse(value);
        if (!isRecord(parsed)) {
            return undefined;
        }
        var commandName = readString(parsed, 'commandName');
        var channelId = readString(parsed, 'channelId');
        var options = readArray(parsed, 'options')
            .map(function (entry) {
            if (!isRecord(entry)) {
                return undefined;
            }
            var name = readString(entry, 'name');
            var typeValue = readNumber(entry, 'type');
            if (!(name && typeValue)) {
                return undefined;
            }
            var type = normalizeCommandOptionType(typeValue);
            if (!type) {
                return undefined;
            }
            return {
                name: name,
                type: type,
            };
        })
            .filter(isDefined);
        if (!(commandName && channelId)) {
            return undefined;
        }
        return {
            commandName: commandName,
            channelId: channelId,
            options: options,
        };
    }
    catch (_a) {
        return undefined;
    }
}
function buildInteractionOptionsFromModalSubmission(_a) {
    var metadata = _a.metadata, stateValues = _a.stateValues;
    var valuesByName = stateValues.reduce(function (acc, entry) {
        var key = entry.actionId || entry.blockId;
        if (!key) {
            return acc;
        }
        acc[key] = entry.value;
        return acc;
    }, {});
    return metadata.options
        .map(function (option) {
        var rawValue = valuesByName[option.name];
        if (!rawValue) {
            return undefined;
        }
        var parsedValue = parseInteractionOptionValue({
            type: option.type,
            rawValue: rawValue,
        });
        if (parsedValue === undefined) {
            return undefined;
        }
        return {
            name: option.name,
            type: option.type,
            value: parsedValue,
        };
    })
        .filter(isDefined);
}
function parseInteractionOptionValue(_a) {
    var type = _a.type, rawValue = _a.rawValue;
    if (type === v10_1.ApplicationCommandOptionType.Integer) {
        var parsed = Number.parseInt(rawValue, 10);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    if (type === v10_1.ApplicationCommandOptionType.Number) {
        var parsed = Number.parseFloat(rawValue);
        return Number.isFinite(parsed) ? parsed : undefined;
    }
    if (type === v10_1.ApplicationCommandOptionType.Boolean) {
        if (rawValue === 'true') {
            return true;
        }
        if (rawValue === 'false') {
            return false;
        }
        return undefined;
    }
    return rawValue;
}
function resolveAutocompleteSuggestions(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var metadata, focusedOption, focusedValue, registeredCommand, interactionId, interactionToken, commandChannelId, choicesPromise;
        var _c, _d, _e, _f;
        var payload = _b.payload, pendingAutocompleteRequests = _b.pendingAutocompleteRequests, applicationCommandRegistry = _b.applicationCommandRegistry, botUserId = _b.botUserId, workspaceId = _b.workspaceId, gateway = _b.gateway;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    metadata = parseSlashCommandModalMetadata(payload.privateMetadata);
                    if (!metadata) {
                        return [2 /*return*/, []];
                    }
                    focusedOption = metadata.options.find(function (option) {
                        return option.name === payload.actionId;
                    });
                    if (!focusedOption) {
                        return [2 /*return*/, []];
                    }
                    focusedValue = parseInteractionOptionValue({
                        type: focusedOption.type,
                        rawValue: payload.value,
                    });
                    if (focusedValue === undefined) {
                        return [2 /*return*/, []];
                    }
                    registeredCommand = findRegisteredCommandByName({
                        commandName: metadata.commandName,
                        applicationId: botUserId,
                        guildId: workspaceId,
                        applicationCommandRegistry: applicationCommandRegistry,
                    });
                    interactionId = crypto.randomUUID();
                    interactionToken = crypto.randomUUID();
                    commandChannelId = (_c = payload.channelId) !== null && _c !== void 0 ? _c : metadata.channelId;
                    choicesPromise = new Promise(function (resolve) {
                        var timeoutHandle = setTimeout(function () {
                            pendingAutocompleteRequests.delete(interactionId);
                            resolve([]);
                        }, AUTOCOMPLETE_REQUEST_TIMEOUT_MS);
                        evictMapIfFull(pendingAutocompleteRequests, AUTOCOMPLETE_PENDING_MAX);
                        pendingAutocompleteRequests.set(interactionId, {
                            token: interactionToken,
                            resolveChoices: resolve,
                            timeoutHandle: timeoutHandle,
                        });
                    });
                    gateway.broadcast(v10_1.GatewayDispatchEvents.InteractionCreate, {
                        id: interactionId,
                        application_id: botUserId,
                        type: v10_1.InteractionType.ApplicationCommandAutocomplete,
                        token: interactionToken,
                        version: 1,
                        entitlements: [],
                        channel_id: commandChannelId,
                        guild_id: workspaceId,
                        member: {
                            user: {
                                id: payload.user.id,
                                username: (_e = (_d = payload.user.username) !== null && _d !== void 0 ? _d : payload.user.name) !== null && _e !== void 0 ? _e : 'unknown',
                                discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
                                avatar: null,
                            },
                            roles: [],
                            joined_at: new Date().toISOString(),
                            deaf: false,
                            mute: false,
                        },
                        data: {
                            id: (_f = registeredCommand === null || registeredCommand === void 0 ? void 0 : registeredCommand.id) !== null && _f !== void 0 ? _f : interactionId,
                            name: metadata.commandName,
                            type: v10_1.ApplicationCommandType.ChatInput,
                            options: [
                                {
                                    name: focusedOption.name,
                                    type: focusedOption.type,
                                    value: focusedValue,
                                    focused: true,
                                },
                            ],
                        },
                    });
                    return [4 /*yield*/, choicesPromise];
                case 1: return [2 /*return*/, _g.sent()];
            }
        });
    });
}
function mergeActiveThreadsWithKnown(_a) {
    var active = _a.active, knownThreadChannels = _a.knownThreadChannels, botUserId = _a.botUserId;
    var mergedThreads = new Map(active.threads.map(function (thread) {
        return [thread.id, thread];
    }));
    for (var _i = 0, _b = knownThreadChannels.entries(); _i < _b.length; _i++) {
        var _c = _b[_i], threadId = _c[0], thread = _c[1];
        if (!mergedThreads.has(threadId)) {
            mergedThreads.set(threadId, thread);
        }
    }
    var mergedMembers = new Map(active.members.map(function (member) {
        return ["".concat(member.id, ":").concat(member.user_id), member];
    }));
    for (var _d = 0, _e = knownThreadChannels.keys(); _d < _e.length; _d++) {
        var threadId = _e[_d];
        var key = "".concat(threadId, ":").concat(botUserId);
        if (!mergedMembers.has(key)) {
            mergedMembers.set(key, {
                id: threadId,
                user_id: botUserId,
                join_timestamp: new Date().toISOString(),
                flags: noFlags(),
            });
        }
    }
    return {
        threads: __spreadArray([], mergedThreads.values(), true),
        members: __spreadArray([], mergedMembers.values(), true),
    };
}
function createSnowflakeLikeId() {
    return "".concat(Date.now()).concat(randomSixDigitSuffix());
}
function noFlags() {
    return 0;
}
function normalizeInteractionCallbackBody(value) {
    var _a;
    if (!isRecord(value)) {
        return { type: v10_1.InteractionResponseType.DeferredMessageUpdate };
    }
    var rawData = readRecord(value, 'data');
    var data = rawData
        ? {
            content: readString(rawData, 'content'),
            flags: readNumber(rawData, 'flags'),
            components: readArray(rawData, 'components'),
            custom_id: readString(rawData, 'custom_id'),
            title: readString(rawData, 'title'),
            submit: readString(rawData, 'submit'),
            cancel: readString(rawData, 'cancel'),
            private_metadata: readString(rawData, 'private_metadata'),
            choices: normalizeInteractionCallbackChoices(readArray(rawData, 'choices')),
        }
        : undefined;
    return {
        type: (_a = readNumber(value, 'type')) !== null && _a !== void 0 ? _a : v10_1.InteractionResponseType.DeferredMessageUpdate,
        data: data,
    };
}
function normalizeInteractionCallbackChoices(rawChoices) {
    return rawChoices
        .map(function (choice) {
        if (!isRecord(choice)) {
            return undefined;
        }
        var name = readString(choice, 'name');
        var rawValue = choice['value'];
        var value = typeof rawValue === 'string'
            ? rawValue
            : typeof rawValue === 'number' || typeof rawValue === 'boolean'
                ? String(rawValue)
                : undefined;
        if (!(name && value)) {
            return undefined;
        }
        return {
            name: name,
            value: value,
        };
    })
        .filter(isDefined);
}
function normalizeWebhookBody(value) {
    if (!isRecord(value)) {
        return {};
    }
    return {
        content: readString(value, 'content'),
    };
}
function normalizeModalInteractionResponseData(data) {
    return {
        custom_id: data.custom_id,
        title: data.title,
        submit: data.submit,
        cancel: data.cancel,
        private_metadata: data.private_metadata,
        components: normalizeModalComponents(data.components),
    };
}
function normalizeModalComponents(components) {
    var rows = Array.isArray(components) ? components : [];
    var normalizedRows = rows
        .map(function (row) {
        if (!isRecord(row)) {
            return undefined;
        }
        if (readNumber(row, 'type') !== v10_1.ComponentType.ActionRow) {
            return undefined;
        }
        var rowComponents = readArray(row, 'components')
            .map(function (component) {
            if (!isRecord(component)) {
                return undefined;
            }
            if (readNumber(component, 'type') !== v10_1.ComponentType.TextInput) {
                return undefined;
            }
            var customId = readString(component, 'custom_id');
            var style = readNumber(component, 'style');
            var label = readString(component, 'label');
            if (!(customId && label && style)) {
                return undefined;
            }
            var normalizedStyle = style === v10_1.TextInputStyle.Paragraph
                ? v10_1.TextInputStyle.Paragraph
                : v10_1.TextInputStyle.Short;
            var normalizedComponent = {
                type: v10_1.ComponentType.TextInput,
                custom_id: customId,
                style: normalizedStyle,
                label: label,
                required: readBoolean(component, 'required'),
                value: readString(component, 'value'),
                placeholder: readString(component, 'placeholder'),
                min_length: readNumber(component, 'min_length'),
                max_length: readNumber(component, 'max_length'),
            };
            return normalizedComponent;
        })
            .filter(isDefined);
        if (rowComponents.length === 0) {
            return undefined;
        }
        var normalizedRow = {
            type: v10_1.ComponentType.ActionRow,
            components: rowComponents,
        };
        return normalizedRow;
    })
        .filter(isDefined);
    return normalizedRows;
}
function buildGatewayGuild(_a) {
    var workspaceId = _a.workspaceId, workspaceName = _a.workspaceName, botUserId = _a.botUserId;
    var guild = {
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
        vanity_url_code: null,
        description: null,
        banner: null,
        premium_tier: v10_1.GuildPremiumTier.None,
        premium_subscription_count: 0,
        preferred_locale: v10_1.Locale.EnglishUS,
        public_updates_channel_id: null,
        nsfw_level: v10_1.GuildNSFWLevel.Default,
        max_video_channel_users: 0,
        max_stage_video_channel_users: 0,
        premium_progress_bar_enabled: false,
        safety_alerts_channel_id: null,
        stickers: [],
        region: '',
        hub_type: null,
        incidents_data: null,
    };
    return guild;
}
function readBoolean(record, key) {
    var value = record[key];
    return typeof value === 'boolean' ? value : undefined;
}
function readNumber(record, key) {
    var value = record[key];
    return typeof value === 'number' ? value : undefined;
}
function slackActionTypeToDiscordComponentType(actionType) {
    if (actionType === 'button') {
        return v10_1.ComponentType.Button;
    }
    if (actionType === 'static_select') {
        return v10_1.ComponentType.StringSelect;
    }
    if (actionType === 'multi_static_select') {
        return v10_1.ComponentType.StringSelect;
    }
    if (actionType === 'external_select') {
        return v10_1.ComponentType.StringSelect;
    }
    if (actionType === 'multi_external_select') {
        return v10_1.ComponentType.StringSelect;
    }
    if (actionType === 'users_select') {
        return v10_1.ComponentType.UserSelect;
    }
    if (actionType === 'multi_users_select') {
        return v10_1.ComponentType.UserSelect;
    }
    if (actionType === 'conversations_select') {
        return v10_1.ComponentType.ChannelSelect;
    }
    if (actionType === 'multi_conversations_select') {
        return v10_1.ComponentType.ChannelSelect;
    }
    if (actionType === 'channels_select') {
        return v10_1.ComponentType.ChannelSelect;
    }
    if (actionType === 'multi_channels_select') {
        return v10_1.ComponentType.ChannelSelect;
    }
    return undefined;
}
function extractActionValues(action) {
    var selectedOptions = action.selectedOptionValues;
    if (selectedOptions.length > 0) {
        return selectedOptions;
    }
    if (action.selectedOptionValue) {
        return [action.selectedOptionValue];
    }
    if (action.selectedUser) {
        return [action.selectedUser];
    }
    if (action.selectedUsers.length > 0) {
        return action.selectedUsers;
    }
    if (action.selectedChannel) {
        return [action.selectedChannel];
    }
    if (action.selectedChannels.length > 0) {
        return action.selectedChannels;
    }
    if (action.selectedConversation) {
        return [action.selectedConversation];
    }
    if (action.selectedConversations.length > 0) {
        return action.selectedConversations;
    }
    return [];
}
function buildDiscordComponentDataFromSlackAction(_a) {
    var _b, _c;
    var action = _a.action;
    var componentType = slackActionTypeToDiscordComponentType(action.type);
    var decodedAction = (0, component_id_codec_js_1.decodeComponentActionId)(action.actionId);
    return {
        componentType: (_c = (_b = decodedAction.componentType) !== null && _b !== void 0 ? _b : componentType) !== null && _c !== void 0 ? _c : v10_1.ComponentType.Button,
        values: extractActionValues(action),
    };
}
function buildResolvedData(_a) {
    var componentType = _a.componentType, values = _a.values;
    if (values.length === 0) {
        return undefined;
    }
    if (componentType === v10_1.ComponentType.UserSelect) {
        var users = values.reduce(function (acc, id) {
            acc[id] = {
                id: id,
                username: id,
                discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
                avatar: null,
            };
            return acc;
        }, {});
        return { resolved: { users: users } };
    }
    if (componentType === v10_1.ComponentType.ChannelSelect) {
        var channels = values.reduce(function (acc, id) {
            acc[id] = {
                id: id,
                type: v10_1.ChannelType.GuildText,
                name: id,
                permissions: DISCORD_ZERO_PERMISSIONS,
            };
            return acc;
        }, {});
        return { resolved: { channels: channels } };
    }
    if (componentType === v10_1.ComponentType.RoleSelect) {
        var roles = values.reduce(function (acc, id) {
            acc[id] = {
                id: id,
                name: id,
                color: 0,
                hoist: false,
                icon: null,
                unicode_emoji: null,
                position: 0,
                permissions: DISCORD_ZERO_PERMISSIONS,
                managed: false,
                mentionable: false,
                flags: 0,
            };
            return acc;
        }, {});
        return { resolved: { roles: roles } };
    }
    if (componentType === v10_1.ComponentType.MentionableSelect) {
        var users = values.reduce(function (acc, id) {
            acc[id] = {
                id: id,
                username: id,
                discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
                avatar: null,
            };
            return acc;
        }, {});
        return { resolved: { users: users } };
    }
    return undefined;
}
function resolveThreadTsForReaction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var args, result, _c;
        var _d, _e;
        var slack = _b.slack, event = _b.event;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (event.item.type !== 'message') {
                        return [2 /*return*/, undefined];
                    }
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 3, , 4]);
                    args = {
                        channel: event.item.channel,
                        ts: event.item.ts,
                        limit: 1,
                    };
                    return [4 /*yield*/, slack.conversations.replies(args)];
                case 2:
                    result = _f.sent();
                    return [2 /*return*/, (_e = (_d = result.messages) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.thread_ts];
                case 3:
                    _c = _f.sent();
                    return [2 /*return*/, undefined];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function verifySignature(body, timestamp, signature, signingSecret) {
    return __awaiter(this, void 0, void 0, function () {
        var now, sigBasestring, expectedDigest, expectedSignature;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(timestamp && signature)) {
                        return [2 /*return*/, false];
                    }
                    now = Math.floor(Date.now() / 1000);
                    if (Math.abs(now - Number.parseInt(timestamp, 10)) > 300) {
                        return [2 /*return*/, false];
                    }
                    sigBasestring = "v0:".concat(timestamp, ":").concat(body);
                    return [4 /*yield*/, hmacSha256Hex({
                            key: signingSecret,
                            message: sigBasestring,
                        })];
                case 1:
                    expectedDigest = _a.sent();
                    expectedSignature = "v0=".concat(expectedDigest);
                    return [2 /*return*/, timingSafeEqualString({ left: signature, right: expectedSignature })];
            }
        });
    });
}
function randomSixDigitSuffix() {
    var _a, _b, _c, _d;
    var bytes = crypto.getRandomValues(new Uint8Array(4));
    var randomValue = ((_a = bytes[0]) !== null && _a !== void 0 ? _a : 0) * 16777216 +
        ((_b = bytes[1]) !== null && _b !== void 0 ? _b : 0) * 65536 +
        ((_c = bytes[2]) !== null && _c !== void 0 ? _c : 0) * 256 +
        ((_d = bytes[3]) !== null && _d !== void 0 ? _d : 0);
    var sixDigits = 100000 + (randomValue % 900000);
    return String(sixDigits);
}
function hmacSha256Hex(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var encoder, cryptoKey, signature;
        var key = _b.key, message = _b.message;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    encoder = new TextEncoder();
                    return [4 /*yield*/, crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])];
                case 1:
                    cryptoKey = _c.sent();
                    return [4 /*yield*/, crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))];
                case 2:
                    signature = _c.sent();
                    return [2 /*return*/, bufferToHex(signature)];
            }
        });
    });
}
function bufferToHex(value) {
    var bytes = new Uint8Array(value);
    return __spreadArray([], bytes, true).map(function (byte) {
        return byte.toString(16).padStart(2, '0');
    })
        .join('');
}
function timingSafeEqualString(_a) {
    var left = _a.left, right = _a.right;
    if (left.length !== right.length) {
        return false;
    }
    var diff = 0;
    for (var index = 0; index < left.length; index++) {
        diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return diff === 0;
}
function withRateLimitHeaders(response) {
    response.headers.set('X-RateLimit-Limit', '50');
    response.headers.set('X-RateLimit-Remaining', '49');
    response.headers.set('X-RateLimit-Reset-After', '60.0');
    response.headers.set('X-RateLimit-Bucket', 'fake-bucket');
    return response;
}
