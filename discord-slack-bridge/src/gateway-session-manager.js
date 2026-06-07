"use strict";
// Runtime-agnostic Discord Gateway session manager.
// Handles identify/heartbeat/ready/dispatch using a generic socket interface
// so Node ws and Cloudflare Durable Object WebSockets can share one protocol core.
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
exports.GatewaySessionManager = void 0;
var v10_1 = require("discord-api-types/v10");
var GatewaySessionManager = /** @class */ (function () {
    function GatewaySessionManager(_a) {
        var loadState = _a.loadState, expectedToken = _a.expectedToken, workspaceId = _a.workspaceId, gatewayUrlProvider = _a.gatewayUrlProvider, authorize = _a.authorize;
        this.clients = new Map();
        this.loadState = loadState;
        this.expectedToken = expectedToken;
        this.workspaceId = workspaceId;
        this.gatewayUrlProvider = gatewayUrlProvider;
        this.authorize = authorize;
    }
    GatewaySessionManager.prototype.registerClient = function (transport) {
        var clientId = crypto.randomUUID();
        this.clients.set(clientId, {
            transport: transport,
            sessionId: crypto.randomUUID(),
            sequence: 0,
            identified: false,
            intents: 0,
            authorizedTeamIds: undefined,
            clientId: undefined,
        });
        this.sendHello(clientId);
        return clientId;
    };
    GatewaySessionManager.prototype.hydrateClient = function (_a) {
        var transport = _a.transport, clientId = _a.clientId, snapshot = _a.snapshot;
        this.clients.set(clientId, {
            transport: transport,
            sessionId: snapshot.sessionId,
            sequence: snapshot.sequence,
            identified: snapshot.identified,
            intents: snapshot.intents,
            clientId: snapshot.clientId,
            authorizedTeamIds: snapshot.authorizedTeamIds
                ? new Set(snapshot.authorizedTeamIds)
                : undefined,
        });
    };
    GatewaySessionManager.prototype.hasClient = function (clientId) {
        return this.clients.has(clientId);
    };
    GatewaySessionManager.prototype.getClientSnapshot = function (clientId) {
        var client = this.clients.get(clientId);
        if (!client) {
            return undefined;
        }
        return {
            sessionId: client.sessionId,
            sequence: client.sequence,
            identified: client.identified,
            intents: client.intents,
            clientId: client.clientId,
            authorizedTeamIds: client.authorizedTeamIds
                ? __spreadArray([], client.authorizedTeamIds, true) : undefined,
        };
    };
    GatewaySessionManager.prototype.removeClient = function (clientId) {
        this.clients.delete(clientId);
    };
    GatewaySessionManager.prototype.closeAll = function () {
        for (var _i = 0, _a = this.clients.values(); _i < _a.length; _i++) {
            var client = _a[_i];
            client.transport.close(1000, 'gateway closed');
        }
        this.clients.clear();
    };
    GatewaySessionManager.prototype.close = function () {
        this.closeAll();
    };
    GatewaySessionManager.prototype.broadcast = function (event, data) {
        for (var _i = 0, _a = this.clients.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], clientId = _b[0], client = _b[1];
            if (!(client.identified && this.isClientAuthorizedForTeam(client))) {
                continue;
            }
            this.sendDispatch(clientId, event, data);
        }
    };
    GatewaySessionManager.prototype.broadcastMessageCreate = function (message, guildId) {
        this.broadcast(v10_1.GatewayDispatchEvents.MessageCreate, __assign(__assign({}, message), { guild_id: guildId, mentions: [] }));
    };
    GatewaySessionManager.prototype.handleRawMessage = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var client, payload, cleanToken, authResult;
            var clientId = _b.clientId, raw = _b.raw;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        client = this.clients.get(clientId);
                        if (!client) {
                            return [2 /*return*/];
                        }
                        payload = parseGatewaySendPayload(raw);
                        if (!payload) {
                            return [2 /*return*/];
                        }
                        if (payload.op === v10_1.GatewayOpcodes.Heartbeat) {
                            this.sendHeartbeatAck(clientId);
                            return [2 /*return*/];
                        }
                        cleanToken = payload.d.token.replace(/^Bot\s+/i, '');
                        return [4 /*yield*/, this.authenticateGatewayIdentify(cleanToken)];
                    case 1:
                        authResult = _c.sent();
                        if (!authResult.allow) {
                            client.transport.close(4004, 'Authentication failed');
                            this.removeClient(clientId);
                            return [2 /*return*/];
                        }
                        client.clientId = authResult.clientId;
                        client.authorizedTeamIds = authResult.authorizedTeamIds
                            ? new Set(authResult.authorizedTeamIds)
                            : undefined;
                        client.identified = true;
                        client.intents = payload.d.intents;
                        return [4 /*yield*/, this.sendReadySequence(clientId)];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    GatewaySessionManager.prototype.send = function (clientId, payload) {
        var client = this.clients.get(clientId);
        if (!client) {
            return;
        }
        if (!client.transport.isOpen()) {
            return;
        }
        client.transport.send(JSON.stringify(payload));
    };
    GatewaySessionManager.prototype.sendHello = function (clientId) {
        this.send(clientId, {
            op: v10_1.GatewayOpcodes.Hello,
            d: { heartbeat_interval: 45000 },
            s: null,
            t: null,
        });
    };
    GatewaySessionManager.prototype.sendHeartbeatAck = function (clientId) {
        this.send(clientId, {
            op: v10_1.GatewayOpcodes.HeartbeatAck,
            s: null,
            t: null,
        });
    };
    GatewaySessionManager.prototype.sendDispatch = function (clientId, event, data) {
        var client = this.clients.get(clientId);
        if (!client) {
            return;
        }
        client.sequence += 1;
        this.send(clientId, {
            op: v10_1.GatewayOpcodes.Dispatch,
            t: event,
            s: client.sequence,
            d: data,
        });
    };
    GatewaySessionManager.prototype.sendReadySequence = function (clientId) {
        return __awaiter(this, void 0, void 0, function () {
            var client, state, readyData, emptyVoiceStates, emptyPresences, emptyStageInstances, emptyScheduledEvents, emptySoundboardSounds, _i, _a, guild, guildData;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        client = this.clients.get(clientId);
                        if (!client) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.loadState()];
                    case 1:
                        state = _b.sent();
                        readyData = {
                            v: 10,
                            user: state.botUser,
                            guilds: state.guilds.map(function (guild) {
                                return { id: guild.id, unavailable: true };
                            }),
                            session_id: client.sessionId,
                            resume_gateway_url: this.gatewayUrlProvider(),
                            application: {
                                id: state.botUser.id,
                                flags: v10_1.ApplicationFlags.GatewayPresence |
                                    v10_1.ApplicationFlags.GatewayGuildMembers |
                                    v10_1.ApplicationFlags.GatewayMessageContent,
                            },
                        };
                        this.sendDispatch(clientId, v10_1.GatewayDispatchEvents.Ready, readyData);
                        emptyVoiceStates = [];
                        emptyPresences = [];
                        emptyStageInstances = [];
                        emptyScheduledEvents = [];
                        emptySoundboardSounds = [];
                        for (_i = 0, _a = state.guilds; _i < _a.length; _i++) {
                            guild = _a[_i];
                            guildData = __assign(__assign({}, guild.apiGuild), { joined_at: guild.joinedAt, large: false, unavailable: false, member_count: guild.members.length, voice_states: emptyVoiceStates, members: guild.members, channels: guild.channels, threads: [], presences: emptyPresences, stage_instances: emptyStageInstances, guild_scheduled_events: emptyScheduledEvents, soundboard_sounds: emptySoundboardSounds });
                            this.sendDispatch(clientId, v10_1.GatewayDispatchEvents.GuildCreate, guildData);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    GatewaySessionManager.prototype.authenticateGatewayIdentify = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.authorize) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.authorize({
                                kind: 'gateway-identify',
                                token: token,
                                teamId: this.workspaceId,
                            })];
                    case 1:
                        result = _b.sent();
                        if (!result.allow) {
                            return [2 /*return*/, { allow: false }];
                        }
                        if (!((_a = result.authorizedTeamIds) === null || _a === void 0 ? void 0 : _a.includes(this.workspaceId))) {
                            return [2 /*return*/, { allow: false }];
                        }
                        return [2 /*return*/, result];
                    case 2:
                        if (token !== this.expectedToken) {
                            return [2 /*return*/, { allow: false }];
                        }
                        return [2 /*return*/, {
                                allow: true,
                                clientId: 'bot-token',
                                authorizedTeamIds: [this.workspaceId],
                            }];
                }
            });
        });
    };
    GatewaySessionManager.prototype.isClientAuthorizedForTeam = function (client) {
        var _a, _b;
        return (_b = (_a = client.authorizedTeamIds) === null || _a === void 0 ? void 0 : _a.has(this.workspaceId)) !== null && _b !== void 0 ? _b : false;
    };
    return GatewaySessionManager;
}());
exports.GatewaySessionManager = GatewaySessionManager;
function parseGatewaySendPayload(raw) {
    var payload;
    try {
        payload = JSON.parse(raw);
    }
    catch (_a) {
        return undefined;
    }
    if (!isRecord(payload)) {
        return undefined;
    }
    var op = readNumber(payload, 'op');
    if (op === v10_1.GatewayOpcodes.Heartbeat) {
        return { op: v10_1.GatewayOpcodes.Heartbeat };
    }
    if (op !== v10_1.GatewayOpcodes.Identify) {
        return undefined;
    }
    var data = readRecord(payload, 'd');
    if (!data) {
        return undefined;
    }
    var token = readString(data, 'token');
    var intents = readNumber(data, 'intents');
    if (!(token && intents !== undefined)) {
        return undefined;
    }
    return {
        op: v10_1.GatewayOpcodes.Identify,
        d: {
            token: token,
            intents: intents,
        },
    };
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function readString(record, key) {
    var value = record[key];
    return typeof value === 'string' ? value : undefined;
}
function readNumber(record, key) {
    var value = record[key];
    return typeof value === 'number' ? value : undefined;
}
function readRecord(record, key) {
    var value = record[key];
    return isRecord(value) ? value : undefined;
}
