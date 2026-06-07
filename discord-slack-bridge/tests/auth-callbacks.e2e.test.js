"use strict";
// E2E coverage for callback-based bridge authorization.
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
var vitest_1 = require("vitest");
var ws_1 = require("ws");
var index_js_1 = require("../src/index.js");
var src_1 = require("slack-digital-twin/src");
var src_2 = require("slack-digital-twin/src");
var e2e_setup_js_1 = require("./e2e-setup.js");
(0, vitest_1.describe)('authorization callbacks', function () {
    var ctx;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)({
                        channels: [{ name: 'auth' }],
                        users: [{ name: 'alice', realName: 'Alice' }],
                        bridgeConfig: {
                            authorize: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                                var isBridgeBotToken;
                                var kind = _b.kind, token = _b.token, teamId = _b.teamId;
                                return __generator(this, function (_c) {
                                    if (kind === 'gateway-identify') {
                                        return [2 /*return*/, {
                                                allow: true,
                                                clientId: 'gateway-client',
                                                authorizedTeamIds: teamId ? [teamId] : [],
                                            }];
                                    }
                                    if (kind === 'rest') {
                                        isBridgeBotToken = Boolean(token === null || token === void 0 ? void 0 : token.startsWith('xoxb-'));
                                        if (token !== 'client-1:secret-1' && !isBridgeBotToken) {
                                            return [2 /*return*/, { allow: false }];
                                        }
                                        return [2 /*return*/, {
                                                allow: true,
                                                clientId: 'client-1',
                                                authorizedTeamIds: teamId ? [teamId] : [],
                                            }];
                                    }
                                    if (kind === 'webhook-action' || kind === 'webhook-event') {
                                        if (teamId === 'T_UNAUTHORIZED') {
                                            return [2 /*return*/, { allow: false }];
                                        }
                                        return [2 /*return*/, {
                                                allow: true,
                                                authorizedTeamIds: teamId ? [teamId] : [],
                                            }];
                                    }
                                    return [2 /*return*/, { allow: false }];
                                });
                            }); },
                        },
                    })];
                case 1:
                    ctx = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.teardownE2E)(ctx)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('REST requires bearer token when authorize callback is configured', function () { return __awaiter(void 0, void 0, void 0, function () {
        var unauthorized, wrongBearer, validBearer;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/users/@me"))];
                case 1:
                    unauthorized = _a.sent();
                    (0, vitest_1.expect)(unauthorized.status).toBe(401);
                    return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/users/@me"), {
                            headers: { authorization: 'Bearer client-1:wrong' },
                        })];
                case 2:
                    wrongBearer = _a.sent();
                    (0, vitest_1.expect)(wrongBearer.status).toBe(401);
                    return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/users/@me"), {
                            headers: { authorization: 'Bearer client-1:secret-1' },
                        })];
                case 3:
                    validBearer = _a.sent();
                    (0, vitest_1.expect)(validBearer.status).toBe(200);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('gateway/bot includes clientId query for client tokens', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, payload, gatewayUrlRaw, gatewayUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/gateway/bot"), {
                        headers: { authorization: 'Bearer client-1:secret-1' },
                    })];
                case 1:
                    response = _a.sent();
                    (0, vitest_1.expect)(response.status).toBe(200);
                    return [4 /*yield*/, response.json()];
                case 2:
                    payload = _a.sent();
                    if (!(payload && typeof payload === 'object' && 'url' in payload)) {
                        throw new Error('Missing url in /gateway/bot response');
                    }
                    gatewayUrlRaw = payload.url;
                    if (typeof gatewayUrlRaw !== 'string') {
                        throw new Error('Invalid url in /gateway/bot response');
                    }
                    gatewayUrl = new URL(gatewayUrlRaw);
                    (0, vitest_1.expect)(gatewayUrl.searchParams.get('clientId')).toBe('client-1');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('tokenized interaction/webhook routes bypass rest auth callback checks', function () { return __awaiter(void 0, void 0, void 0, function () {
        var interactionCallback, webhookMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/interactions/123/token-abc/callback"), {
                        method: 'POST',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({ type: 5 }),
                    })];
                case 1:
                    interactionCallback = _a.sent();
                    (0, vitest_1.expect)(interactionCallback.status).not.toBe(401);
                    return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/webhooks/123/token-abc/messages/@original"))];
                case 2:
                    webhookMessage = _a.sent();
                    (0, vitest_1.expect)(webhookMessage.status).not.toBe(401);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('non-tokenized webhook route still requires auth', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/webhooks/123"))];
                case 1:
                    response = _a.sent();
                    (0, vitest_1.expect)(response.status).toBe(401);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('slash command rejects unauthorized team id', function () { return __awaiter(void 0, void 0, void 0, function () {
        var webhookConfig, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, src_2.sendSlashCommand)({
                            config: __assign(__assign({}, webhookConfig), { workspaceId: 'T_UNAUTHORIZED' }),
                            command: '/kimaki',
                            text: 'hello',
                            userId: ctx.twin.resolveUserId('alice'),
                            userName: 'alice',
                            channelId: ctx.twin.resolveChannelId('auth'),
                            channelName: 'auth',
                            triggerId: 'trigger-auth-deny',
                        })];
                case 1:
                    response = _a.sent();
                    (0, vitest_1.expect)(response.status).toBe(403);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('interactive payload rejects unauthorized team id', function () { return __awaiter(void 0, void 0, void 0, function () {
        var webhookConfig, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, src_2.sendInteractivePayload)({
                            config: webhookConfig,
                            payload: {
                                type: 'block_actions',
                                user: {
                                    id: ctx.twin.resolveUserId('alice'),
                                    username: 'alice',
                                    name: 'alice',
                                },
                                team: { id: 'T_UNAUTHORIZED' },
                                channel: { id: ctx.twin.resolveChannelId('auth') },
                                trigger_id: 'trigger-interactive-auth-deny',
                                response_url: 'https://example.invalid/response',
                                actions: [
                                    {
                                        action_id: 'action-auth-deny',
                                        type: 'button',
                                        value: 'clicked',
                                        block_id: 'b1',
                                        action_ts: '1700000000.000020',
                                    },
                                ],
                            },
                        })];
                case 1:
                    response = _a.sent();
                    (0, vitest_1.expect)(response.status).toBe(403);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('interactive payload rejects missing team id', function () { return __awaiter(void 0, void 0, void 0, function () {
        var webhookConfig, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, src_2.sendInteractivePayload)({
                            config: webhookConfig,
                            payload: {
                                type: 'block_actions',
                                user: {
                                    id: ctx.twin.resolveUserId('alice'),
                                    username: 'alice',
                                    name: 'alice',
                                },
                                channel: { id: ctx.twin.resolveChannelId('auth') },
                                trigger_id: 'trigger-interactive-auth-missing-team',
                                response_url: 'https://example.invalid/response',
                                actions: [
                                    {
                                        action_id: 'action-auth-missing-team',
                                        type: 'button',
                                        value: 'clicked',
                                        block_id: 'b1',
                                        action_ts: '1700000000.000021',
                                    },
                                ],
                            },
                        })];
                case 1:
                    response = _a.sent();
                    (0, vitest_1.expect)(response.status).toBe(403);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('REST rejects callback results without authorized team ids', function () { return __awaiter(void 0, void 0, void 0, function () {
        var twin, bridge, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    twin = new src_1.SlackDigitalTwin({
                        workspaceName: 'REST Auth Workspace',
                        webhookConfig: { signingSecret: 'rest-auth-signing-secret' },
                    });
                    return [4 /*yield*/, twin.start()];
                case 1:
                    _a.sent();
                    bridge = new index_js_1.SlackBridge({
                        slackBotToken: twin.botToken,
                        slackSigningSecret: 'rest-auth-signing-secret',
                        workspaceId: twin.workspaceId,
                        port: 0,
                        slackApiUrl: twin.apiUrl,
                        authorize: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                            var kind = _b.kind, token = _b.token;
                            return __generator(this, function (_c) {
                                if (kind !== 'rest' || token !== 'client-1:secret-1') {
                                    return [2 /*return*/, { allow: false }];
                                }
                                return [2 /*return*/, { allow: true, clientId: 'client-1' }];
                            });
                        }); },
                    });
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 5, 8]);
                    return [4 /*yield*/, bridge.start()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, fetch("".concat(bridge.restUrl, "/v10/users/@me"), {
                            headers: { authorization: 'Bearer client-1:secret-1' },
                        })];
                case 4:
                    response = _a.sent();
                    (0, vitest_1.expect)(response.status).toBe(403);
                    return [3 /*break*/, 8];
                case 5: return [4 /*yield*/, bridge.stop()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, twin.stop()];
                case 7:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('gateway rejects callback results without authorized team ids', function () { return __awaiter(void 0, void 0, void 0, function () {
        var twin, bridge, closeCode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    twin = new src_1.SlackDigitalTwin({
                        workspaceName: 'Gateway Auth Workspace',
                        webhookConfig: { signingSecret: 'gateway-auth-signing-secret' },
                    });
                    return [4 /*yield*/, twin.start()];
                case 1:
                    _a.sent();
                    bridge = new index_js_1.SlackBridge({
                        slackBotToken: twin.botToken,
                        slackSigningSecret: 'gateway-auth-signing-secret',
                        workspaceId: twin.workspaceId,
                        port: 0,
                        slackApiUrl: twin.apiUrl,
                        discordToken: 'client-1:secret-1',
                        authorize: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                            var kind = _b.kind, token = _b.token;
                            return __generator(this, function (_c) {
                                if (kind !== 'gateway-identify' || token !== 'client-1:secret-1') {
                                    return [2 /*return*/, { allow: false }];
                                }
                                return [2 /*return*/, { allow: true, clientId: 'client-1' }];
                            });
                        }); },
                    });
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 5, 8]);
                    return [4 /*yield*/, bridge.start()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var ws = new ws_1.WebSocket(bridge.gatewayUrl);
                            ws.on('open', function () {
                                ws.send(JSON.stringify({
                                    op: 2,
                                    d: {
                                        token: 'client-1:secret-1',
                                        intents: 1,
                                        properties: {
                                            os: 'linux',
                                            browser: 'test',
                                            device: 'test',
                                        },
                                    },
                                }));
                            });
                            ws.on('close', function (code) {
                                resolve(code);
                            });
                            ws.on('error', function (error) {
                                reject(error);
                            });
                        })];
                case 4:
                    closeCode = _a.sent();
                    (0, vitest_1.expect)(closeCode).toBe(4004);
                    return [3 /*break*/, 8];
                case 5: return [4 /*yield*/, bridge.stop()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, twin.stop()];
                case 7:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); });
});
