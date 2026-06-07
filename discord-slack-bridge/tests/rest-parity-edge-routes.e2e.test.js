"use strict";
// E2E parity checks for edge REST routes and Discord-shaped errors.
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
var v10_1 = require("discord-api-types/v10");
var e2e_setup_js_1 = require("./e2e-setup.js");
(0, vitest_1.describe)('rest parity edge routes', function () {
    var ctx;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)()];
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
    (0, vitest_1.test)('getMessage fetches exact target message by id', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectId, projectChannel, first, fetched;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectId = ctx.twin.resolveChannelId('project');
                    return [4 /*yield*/, ctx.client.channels.fetch(projectId)];
                case 1:
                    projectChannel = (_a.sent());
                    return [4 /*yield*/, projectChannel.send('single-fetch-target')];
                case 2:
                    first = _a.sent();
                    return [4 /*yield*/, projectChannel.send('single-fetch-other')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, projectChannel.messages.fetch(first.id)];
                case 4:
                    fetched = _a.sent();
                    (0, vitest_1.expect)(fetched.id).toBe(first.id);
                    (0, vitest_1.expect)(fetched.content).toBe('single-fetch-target');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('guild-scoped routes reject mismatched guild id with Discord 404 shape', function () { return __awaiter(void 0, void 0, void 0, function () {
        var badGuildId, base, routes, responses;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    badGuildId = 'T_WRONG_GUILD';
                    base = "".concat(ctx.bridge.restUrl, "/v10/guilds/").concat(badGuildId);
                    routes = [
                        { method: 'GET', path: '' },
                        { method: 'GET', path: '/channels' },
                        { method: 'POST', path: '/channels' },
                        { method: 'GET', path: '/members' },
                        { method: 'GET', path: '/members/U123' },
                        { method: 'GET', path: '/roles' },
                    ];
                    return [4 /*yield*/, Promise.all(routes.map(function (route) { return __awaiter(void 0, void 0, void 0, function () {
                            var response, body;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fetch("".concat(base).concat(route.path), {
                                            method: route.method,
                                            headers: { 'content-type': 'application/json' },
                                            body: route.method === 'POST'
                                                ? JSON.stringify({ name: 'should-not-create' })
                                                : undefined,
                                        })];
                                    case 1:
                                        response = _a.sent();
                                        return [4 /*yield*/, response.json()];
                                    case 2:
                                        body = _a.sent();
                                        return [2 /*return*/, {
                                                status: response.status,
                                                body: body,
                                            }];
                                }
                            });
                        }); }))];
                case 1:
                    responses = _a.sent();
                    (0, vitest_1.expect)(responses).toMatchInlineSnapshot("\n      [\n        {\n          \"body\": {\n            \"code\": 10004,\n            \"error\": \"unknown_guild\",\n            \"error_description\": \"Unknown Guild: T_WRONG_GUILD\",\n            \"message\": \"Unknown Guild: T_WRONG_GUILD\",\n          },\n          \"status\": 404,\n        },\n        {\n          \"body\": {\n            \"code\": 10004,\n            \"error\": \"unknown_guild\",\n            \"error_description\": \"Unknown Guild: T_WRONG_GUILD\",\n            \"message\": \"Unknown Guild: T_WRONG_GUILD\",\n          },\n          \"status\": 404,\n        },\n        {\n          \"body\": {\n            \"code\": 10004,\n            \"error\": \"unknown_guild\",\n            \"error_description\": \"Unknown Guild: T_WRONG_GUILD\",\n            \"message\": \"Unknown Guild: T_WRONG_GUILD\",\n          },\n          \"status\": 404,\n        },\n        {\n          \"body\": {\n            \"code\": 10004,\n            \"error\": \"unknown_guild\",\n            \"error_description\": \"Unknown Guild: T_WRONG_GUILD\",\n            \"message\": \"Unknown Guild: T_WRONG_GUILD\",\n          },\n          \"status\": 404,\n        },\n        {\n          \"body\": {\n            \"code\": 10004,\n            \"error\": \"unknown_guild\",\n            \"error_description\": \"Unknown Guild: T_WRONG_GUILD\",\n            \"message\": \"Unknown Guild: T_WRONG_GUILD\",\n          },\n          \"status\": 404,\n        },\n        {\n          \"body\": {\n            \"code\": 10004,\n            \"error\": \"unknown_guild\",\n            \"error_description\": \"Unknown Guild: T_WRONG_GUILD\",\n            \"message\": \"Unknown Guild: T_WRONG_GUILD\",\n          },\n          \"status\": 404,\n        },\n      ]\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('webhook message PATCH/DELETE routes exist and honor token checks', function () { return __awaiter(void 0, void 0, void 0, function () {
        var messageId, patchResponse, patchBody, deleteResponse, deleteBody;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    messageId = '1700000000000001';
                    return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/webhooks/WH/random-token/messages/").concat(messageId), {
                            method: 'PATCH',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ content: 'updated-content' }),
                        })];
                case 1:
                    patchResponse = _a.sent();
                    return [4 /*yield*/, patchResponse.text()];
                case 2:
                    patchBody = _a.sent();
                    return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/webhooks/WH/random-token/messages/").concat(messageId), {
                            method: 'DELETE',
                        })];
                case 3:
                    deleteResponse = _a.sent();
                    return [4 /*yield*/, deleteResponse.text()];
                case 4:
                    deleteBody = _a.sent();
                    (0, vitest_1.expect)({
                        patch: { status: patchResponse.status, body: patchBody },
                        delete: { status: deleteResponse.status, body: deleteBody },
                    }).toMatchInlineSnapshot("\n      {\n        \"delete\": {\n          \"body\": \"{\"error\":\"unknown_webhook_token\",\"message\":\"Unknown webhook token\",\"error_description\":\"Unknown webhook token\"}\",\n          \"status\": 404,\n        },\n        \"patch\": {\n          \"body\": \"{\"error\":\"unknown_webhook_token\",\"message\":\"Unknown webhook token\",\"error_description\":\"Unknown webhook token\"}\",\n          \"status\": 404,\n        },\n      }\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('discord.js surfaces bridge error payload in thrown DiscordAPIError', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, vitest_1.expect)(ctx.client.rest.patch(v10_1.Routes.webhookMessage('WH', 'random-token', '1700000000000001'), {
                        body: { content: 'updated-content' },
                    })).rejects.toThrowErrorMatchingInlineSnapshot("[DiscordAPIError[unknown_webhook_token]: Unknown webhook token]")];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('typing route returns 204 for channels and thread channels', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectId, projectChannel, thread;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectId = ctx.twin.resolveChannelId('project');
                    return [4 /*yield*/, ctx.client.channels.fetch(projectId)];
                case 1:
                    projectChannel = (_a.sent());
                    return [4 /*yield*/, (0, vitest_1.expect)(projectChannel.sendTyping()).resolves.toBeUndefined()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, projectChannel.threads.create({
                            name: 'typing-route-thread',
                        })];
                case 3:
                    thread = _a.sent();
                    return [4 /*yield*/, (0, vitest_1.expect)(thread.sendTyping()).resolves.toBeUndefined()];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
