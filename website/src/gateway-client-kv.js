"use strict";
// KV helpers for gateway client auth, Slack install state, and team routing cache.
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
exports.getGatewayClientFromKv = getGatewayClientFromKv;
exports.setGatewayClientInKv = setGatewayClientInKv;
exports.getTeamClientIdsFromKv = getTeamClientIdsFromKv;
exports.setTeamClientIdsInKv = setTeamClientIdsInKv;
exports.getSlackInstallStateFromKv = getSlackInstallStateFromKv;
exports.setSlackInstallStateInKv = setSlackInstallStateInKv;
exports.deleteSlackInstallStateInKv = deleteSlackInstallStateInKv;
exports.invalidateTeamClientIdsInKv = invalidateTeamClientIdsInKv;
exports.upsertGatewayClientAndRefreshKv = upsertGatewayClientAndRefreshKv;
exports.resolveGatewayClientFromCacheOrDb = resolveGatewayClientFromCacheOrDb;
exports.normalizeGatewayClientRow = normalizeGatewayClientRow;
var src_1 = require("db/src");
var GATEWAY_CLIENT_KV_TTL_SECONDS = 60;
var TEAM_CLIENT_IDS_KV_TTL_SECONDS = 30;
var SLACK_INSTALL_STATE_KV_TTL_SECONDS = 600;
function gatewayClientKvKey(_a) {
    var clientId = _a.clientId;
    return "gateway-client:v1:".concat(clientId);
}
function teamClientIdsKvKey(_a) {
    var teamId = _a.teamId;
    return "team-client-ids:v1:".concat(teamId);
}
function slackInstallStateKvKey(_a) {
    var state = _a.state;
    return "slack-install-state:v1:".concat(state);
}
function getGatewayClientFromKv(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var payload;
        var clientId = _b.clientId, kv = _b.kv;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, kv.get(gatewayClientKvKey({ clientId: clientId }), 'json')];
                case 1:
                    payload = _c.sent();
                    if (!isGatewayClientCacheRecord(payload)) {
                        return [2 /*return*/, undefined];
                    }
                    return [2 /*return*/, payload];
            }
        });
    });
}
function setGatewayClientInKv(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var kv = _b.kv, row = _b.row;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, kv.put(gatewayClientKvKey({ clientId: row.client_id }), JSON.stringify(row), {
                        expirationTtl: GATEWAY_CLIENT_KV_TTL_SECONDS,
                    })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getTeamClientIdsFromKv(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var payload, candidate, clientIds;
        var teamId = _b.teamId, kv = _b.kv;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, kv.get(teamClientIdsKvKey({ teamId: teamId }), 'json')];
                case 1:
                    payload = _c.sent();
                    if (!(payload && typeof payload === 'object' && 'clientIds' in payload)) {
                        return [2 /*return*/, undefined];
                    }
                    candidate = payload.clientIds;
                    if (!Array.isArray(candidate)) {
                        return [2 /*return*/, undefined];
                    }
                    clientIds = candidate.filter(function (clientId) {
                        return typeof clientId === 'string';
                    });
                    return [2 /*return*/, clientIds];
            }
        });
    });
}
function setTeamClientIdsInKv(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var kv = _b.kv, teamId = _b.teamId, clientIds = _b.clientIds;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, kv.put(teamClientIdsKvKey({ teamId: teamId }), JSON.stringify({ clientIds: clientIds }), {
                        expirationTtl: TEAM_CLIENT_IDS_KV_TTL_SECONDS,
                    })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getSlackInstallStateFromKv(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var payload;
        var kv = _b.kv, state = _b.state;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, kv.get(slackInstallStateKvKey({ state: state }), 'json')];
                case 1:
                    payload = _c.sent();
                    if (!isSlackInstallStateRecord(payload)) {
                        return [2 /*return*/, undefined];
                    }
                    return [2 /*return*/, payload];
            }
        });
    });
}
function setSlackInstallStateInKv(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var kv = _b.kv, state = _b.state, record = _b.record;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, kv.put(slackInstallStateKvKey({ state: state }), JSON.stringify(record), {
                        expirationTtl: SLACK_INSTALL_STATE_KV_TTL_SECONDS,
                    })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function deleteSlackInstallStateInKv(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var kv = _b.kv, state = _b.state;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, kv.delete(slackInstallStateKvKey({ state: state }))];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function invalidateTeamClientIdsInKv(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var kv = _b.kv, teamId = _b.teamId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, kv.delete(teamClientIdsKvKey({ teamId: teamId }))];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function upsertGatewayClientAndRefreshKv(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var prisma, upsertedGatewayClient, updatedSiblingRows, normalizedGatewayClient;
        var env = _b.env, clientId = _b.clientId, secret = _b.secret, guildId = _b.guildId, platform = _b.platform, botToken = _b.botToken, userId = _b.userId, reachableUrl = _b.reachableUrl;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    prisma = (0, src_1.createPrisma)(env.HYPERDRIVE.connectionString);
                    return [4 /*yield*/, prisma.gateway_clients
                            .upsert({
                            where: {
                                client_id_guild_id: {
                                    client_id: clientId,
                                    guild_id: guildId,
                                },
                            },
                            create: {
                                client_id: clientId,
                                secret: secret,
                                guild_id: guildId,
                                platform: platform,
                                bot_token: botToken !== null && botToken !== void 0 ? botToken : null,
                                user_id: userId !== null && userId !== void 0 ? userId : undefined,
                                reachable_url: reachableUrl !== null && reachableUrl !== void 0 ? reachableUrl : null,
                            },
                            update: {
                                secret: secret,
                                platform: platform,
                                bot_token: botToken !== null && botToken !== void 0 ? botToken : null,
                                user_id: userId !== null && userId !== void 0 ? userId : undefined,
                                reachable_url: reachableUrl !== null && reachableUrl !== void 0 ? reachableUrl : null,
                            },
                        })
                            .catch(function (cause) {
                            return new Error('Failed to upsert gateway_clients', { cause: cause });
                        })];
                case 1:
                    upsertedGatewayClient = _c.sent();
                    if (upsertedGatewayClient instanceof Error) {
                        return [2 /*return*/, upsertedGatewayClient];
                    }
                    return [4 /*yield*/, prisma.gateway_clients.updateMany({
                            where: { client_id: clientId },
                            data: {
                                secret: secret,
                                reachable_url: reachableUrl !== null && reachableUrl !== void 0 ? reachableUrl : null,
                            },
                        }).catch(function (cause) {
                            return new Error('Failed to normalize gateway_clients secrets', { cause: cause });
                        })];
                case 2:
                    updatedSiblingRows = _c.sent();
                    if (updatedSiblingRows instanceof Error) {
                        return [2 /*return*/, updatedSiblingRows];
                    }
                    normalizedGatewayClient = normalizeGatewayClientRow({
                        row: upsertedGatewayClient,
                    });
                    return [4 /*yield*/, setGatewayClientInKv({
                            kv: env.GATEWAY_CLIENT_KV,
                            row: normalizedGatewayClient,
                        }).catch(function (cause) {
                            console.warn('Failed to write gateway client KV cache', cause);
                        })];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, invalidateTeamClientIdsInKv({
                            kv: env.GATEWAY_CLIENT_KV,
                            teamId: guildId,
                        }).catch(function (cause) {
                            console.warn('Failed to invalidate team client KV cache', cause);
                        })];
                case 4:
                    _c.sent();
                    return [2 /*return*/, normalizedGatewayClient];
            }
        });
    });
}
function resolveGatewayClientFromCacheOrDb(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var cached, prisma, row, normalized;
        var clientId = _b.clientId, env = _b.env;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getGatewayClientFromKv({
                        clientId: clientId,
                        kv: env.GATEWAY_CLIENT_KV,
                    }).catch(function (cause) {
                        return new Error('KV read failed for gateway client', { cause: cause });
                    })];
                case 1:
                    cached = _c.sent();
                    if (cached instanceof Error) {
                        return [2 /*return*/, cached];
                    }
                    if (cached) {
                        return [2 /*return*/, cached];
                    }
                    prisma = (0, src_1.createPrisma)(env.HYPERDRIVE.connectionString);
                    return [4 /*yield*/, prisma.gateway_clients.findFirst({
                            where: { client_id: clientId },
                            orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
                        }).catch(function (cause) {
                            return new Error('DB lookup failed for gateway client', { cause: cause });
                        })];
                case 2:
                    row = _c.sent();
                    if (row instanceof Error) {
                        return [2 /*return*/, row];
                    }
                    if (!row) {
                        return [2 /*return*/, undefined];
                    }
                    normalized = normalizeGatewayClientRow({ row: row });
                    return [4 /*yield*/, setGatewayClientInKv({
                            kv: env.GATEWAY_CLIENT_KV,
                            row: normalized,
                        }).catch(function () {
                            return undefined;
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/, normalized];
            }
        });
    });
}
function normalizeGatewayClientRow(_a) {
    var _b, _c;
    var row = _a.row;
    return {
        client_id: row.client_id,
        secret: row.secret,
        guild_id: row.guild_id,
        platform: row.platform,
        bot_token: row.bot_token,
        user_id: row.user_id,
        created_at: row.created_at.toISOString(),
        updated_at: (_c = (_b = row.updated_at) === null || _b === void 0 ? void 0 : _b.toISOString()) !== null && _c !== void 0 ? _c : null,
    };
}
function isGatewayClientCacheRecord(value) {
    if (!isRecord(value)) {
        return false;
    }
    var record = value;
    return (typeof record.client_id === 'string'
        && typeof record.secret === 'string'
        && typeof record.guild_id === 'string'
        && (record.platform === 'discord' || record.platform === 'slack')
        && (typeof record.bot_token === 'string' || record.bot_token === null)
        && (typeof record.user_id === 'string' || record.user_id === null)
        && typeof record.created_at === 'string'
        && (typeof record.updated_at === 'string' || record.updated_at === null));
}
function isSlackInstallStateRecord(value) {
    if (!isRecord(value)) {
        return false;
    }
    return (typeof value.kimaki_client_id === 'string'
        && typeof value.kimaki_client_secret === 'string'
        && (typeof value.kimaki_callback_url === 'string' || value.kimaki_callback_url === null));
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
