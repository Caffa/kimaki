"use strict";
// Discord Gateway WebSocket server.
// Implements the minimum Gateway protocol needed for discord.js to connect:
// Hello -> Identify -> Ready -> GUILD_CREATE, plus heartbeat keep-alive.
// REST routes call gateway.broadcast() to push events to connected clients.
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
exports.DiscordGateway = void 0;
var node_crypto_1 = require("node:crypto");
var ws_1 = require("ws");
var v10_1 = require("discord-api-types/v10");
var DiscordGateway = /** @class */ (function () {
    function DiscordGateway(_a) {
        var httpServer = _a.httpServer, port = _a.port, loadState = _a.loadState, expectedToken = _a.expectedToken;
        var _this = this;
        this.clients = [];
        this.port = port;
        this.loadState = loadState;
        this.expectedToken = expectedToken;
        // Use noServer mode so we can accept both /gateway and /gateway/
        // (twilight-gateway appends /?v=10&encoding=json, creating path /gateway/)
        this.wss = new ws_1.WebSocketServer({ noServer: true });
        this.wss.on('connection', function (ws) {
            _this.handleConnection(ws);
        });
        httpServer.on('upgrade', function (request, socket, head) {
            var _a;
            var pathname = new URL((_a = request.url) !== null && _a !== void 0 ? _a : '/', "http://".concat(request.headers.host)).pathname;
            if (pathname === '/gateway' || pathname === '/gateway/') {
                _this.wss.handleUpgrade(request, socket, head, function (ws) {
                    _this.wss.emit('connection', ws, request);
                });
            }
            else {
                socket.destroy();
            }
        });
    }
    DiscordGateway.prototype.broadcast = function (event, data) {
        for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
            var client = _a[_i];
            if (client.identified) {
                this.sendDispatch(client, event, data);
            }
        }
    };
    DiscordGateway.prototype.broadcastMessageCreate = function (message, guildId) {
        var data = __assign(__assign({}, message), { guild_id: guildId, mentions: [] });
        this.broadcast(v10_1.GatewayDispatchEvents.MessageCreate, data);
    };
    DiscordGateway.prototype.close = function () {
        for (var _i = 0, _a = this.clients; _i < _a.length; _i++) {
            var client = _a[_i];
            client.ws.close();
        }
        this.clients = [];
        this.wss.close();
    };
    DiscordGateway.prototype.send = function (client, payload) {
        if (client.ws.readyState === ws_1.WebSocket.OPEN) {
            client.ws.send(JSON.stringify(payload));
        }
    };
    DiscordGateway.prototype.sendHello = function (client) {
        this.send(client, {
            op: v10_1.GatewayOpcodes.Hello,
            d: { heartbeat_interval: 45000 },
            s: null,
            t: null,
        });
    };
    DiscordGateway.prototype.sendHeartbeatAck = function (client) {
        this.send(client, {
            op: v10_1.GatewayOpcodes.HeartbeatAck,
            s: null,
            t: null,
        });
    };
    DiscordGateway.prototype.sendDispatch = function (client, event, data) {
        client.sequence++;
        this.send(client, {
            op: v10_1.GatewayOpcodes.Dispatch,
            t: event,
            s: client.sequence,
            d: data,
        });
    };
    DiscordGateway.prototype.handleConnection = function (ws) {
        var _this = this;
        var client = {
            ws: ws,
            sessionId: node_crypto_1.default.randomUUID(),
            sequence: 0,
            identified: false,
            intents: 0,
        };
        this.clients.push(client);
        this.sendHello(client);
        ws.on('message', function (raw) {
            void _this.handleMessage(client, raw.toString());
        });
        ws.on('close', function () {
            var idx = _this.clients.indexOf(client);
            if (idx !== -1) {
                _this.clients.splice(idx, 1);
            }
        });
    };
    DiscordGateway.prototype.handleMessage = function (client, raw) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, _a, _b, token, intents, cleanToken;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        payload = JSON.parse(raw);
                        _a = payload.op;
                        switch (_a) {
                            case v10_1.GatewayOpcodes.Heartbeat: return [3 /*break*/, 1];
                            case v10_1.GatewayOpcodes.Identify: return [3 /*break*/, 2];
                        }
                        return [3 /*break*/, 4];
                    case 1:
                        {
                            this.sendHeartbeatAck(client);
                            return [3 /*break*/, 4];
                        }
                        _c.label = 2;
                    case 2:
                        _b = payload.d, token = _b.token, intents = _b.intents;
                        cleanToken = token.replace(/^Bot\s+/i, '');
                        if (cleanToken !== this.expectedToken) {
                            client.ws.close(4004, 'Authentication failed');
                            return [2 /*return*/];
                        }
                        client.identified = true;
                        client.intents = intents;
                        return [4 /*yield*/, this.sendReadySequence(client)];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DiscordGateway.prototype.sendReadySequence = function (client) {
        return __awaiter(this, void 0, void 0, function () {
            var state, readyData, emptyVoiceStates, emptyPresences, emptyStageInstances, emptyScheduledEvents, emptySoundboardSounds, _i, _a, guild, guildData;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.loadState()];
                    case 1:
                        state = _b.sent();
                        readyData = {
                            v: 10,
                            user: state.botUser,
                            guilds: state.guilds.map(function (g) { return ({
                                id: g.id,
                                unavailable: true,
                            }); }),
                            session_id: client.sessionId,
                            resume_gateway_url: "ws://127.0.0.1:".concat(this.port, "/gateway"),
                            application: {
                                id: state.botUser.id,
                                flags: v10_1.ApplicationFlags.GatewayPresence |
                                    v10_1.ApplicationFlags.GatewayGuildMembers |
                                    v10_1.ApplicationFlags.GatewayMessageContent,
                            },
                        };
                        this.sendDispatch(client, v10_1.GatewayDispatchEvents.Ready, readyData);
                        emptyVoiceStates = [];
                        emptyPresences = [];
                        emptyStageInstances = [];
                        emptyScheduledEvents = [];
                        emptySoundboardSounds = [];
                        for (_i = 0, _a = state.guilds; _i < _a.length; _i++) {
                            guild = _a[_i];
                            guildData = __assign(__assign({}, guild.apiGuild), { joined_at: guild.joinedAt, large: false, unavailable: false, member_count: guild.members.length, voice_states: emptyVoiceStates, members: guild.members, channels: guild.channels, threads: [], presences: emptyPresences, stage_instances: emptyStageInstances, guild_scheduled_events: emptyScheduledEvents, 
                                // soundboard_sounds is missing in Gelbpunkt/twilight 0.16 used by the
                                // gateway-proxy main branch. Our remorses/twilight 0.16-updated fork
                                // ignores unknown struct fields, so this is safe.
                                soundboard_sounds: emptySoundboardSounds });
                            this.sendDispatch(client, v10_1.GatewayDispatchEvents.GuildCreate, guildData);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    return DiscordGateway;
}());
exports.DiscordGateway = DiscordGateway;
