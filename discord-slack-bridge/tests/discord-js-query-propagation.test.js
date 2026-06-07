"use strict";
// Verifies current discord.js behavior for REST base URL query parameters.
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
var node_http_1 = require("node:http");
var vitest_1 = require("vitest");
var discord_js_1 = require("discord.js");
(0, vitest_1.describe)('discord.js query propagation', function () {
    (0, vitest_1.test)('keeps REST base URL query params in a malformed path position', function () { return __awaiter(void 0, void 0, void 0, function () {
        var restUrls, server, address, client, usersResponse, gatewayBotRaw, gatewayUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    restUrls = [];
                    server = node_http_1.default.createServer(function (req, res) {
                        var _a;
                        var requestUrl = (_a = req.url) !== null && _a !== void 0 ? _a : '/';
                        restUrls.push(requestUrl);
                        if (requestUrl.startsWith('/api/v10/users/@me')) {
                            res.writeHead(200, { 'content-type': 'application/json' });
                            res.end(JSON.stringify({
                                id: '123456789012345678',
                                username: 'query-tester',
                                discriminator: '0001',
                                global_name: 'query-tester',
                                avatar: null,
                                bot: true,
                            }));
                            return;
                        }
                        if (requestUrl.startsWith('/api/v10/gateway/bot')) {
                            res.writeHead(200, { 'content-type': 'application/json' });
                            res.end(JSON.stringify({
                                url: 'ws://127.0.0.1:65535/slack/gateway?clientId=test-client&via=bot-response',
                                shards: 1,
                                session_start_limit: {
                                    total: 1000,
                                    remaining: 1000,
                                    reset_after: 0,
                                    max_concurrency: 1,
                                },
                            }));
                            return;
                        }
                        res.writeHead(404);
                        res.end('not found');
                    });
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            server.listen(0, '127.0.0.1', function (error) {
                                if (error) {
                                    reject(error);
                                    return;
                                }
                                resolve();
                            });
                        })];
                case 1:
                    _a.sent();
                    address = server.address();
                    if (!(address && typeof address === 'object')) {
                        throw new Error('Could not resolve probe server address');
                    }
                    client = new discord_js_1.Client({
                        intents: [discord_js_1.GatewayIntentBits.Guilds],
                        rest: {
                            api: "http://127.0.0.1:".concat(String(address.port), "/api?clientId=rest-client&scope=test"),
                            version: '10',
                        },
                    });
                    client.rest.setToken('discord-js-query-test-token');
                    return [4 /*yield*/, client.rest.get('/users/@me').catch(function () {
                            return undefined;
                        })];
                case 2:
                    usersResponse = _a.sent();
                    return [4 /*yield*/, client.rest.get('/gateway/bot').catch(function () {
                            return undefined;
                        })];
                case 3:
                    gatewayBotRaw = _a.sent();
                    client.destroy();
                    return [4 /*yield*/, new Promise(function (resolve) {
                            server.close(function () {
                                resolve();
                            });
                        })];
                case 4:
                    _a.sent();
                    (0, vitest_1.expect)(restUrls).toMatchInlineSnapshot("\n      [\n        \"/api?clientId=rest-client&scope=test/v10/users/@me\",\n        \"/api?clientId=rest-client&scope=test/v10/gateway/bot\",\n      ]\n    ");
                    (0, vitest_1.expect)(restUrls.includes('/api?clientId=rest-client&scope=test/v10/users/@me')).toBe(true);
                    (0, vitest_1.expect)(restUrls.includes('/api?clientId=rest-client&scope=test/v10/gateway/bot')).toBe(true);
                    if (gatewayBotRaw
                        && typeof gatewayBotRaw === 'object'
                        && 'url' in gatewayBotRaw
                        && typeof gatewayBotRaw.url === 'string') {
                        gatewayUrl = new URL(gatewayBotRaw.url);
                        (0, vitest_1.expect)(gatewayUrl.searchParams.get('clientId')).toBe('test-client');
                        (0, vitest_1.expect)(gatewayUrl.searchParams.get('via')).toBe('bot-response');
                    }
                    (0, vitest_1.expect)(usersResponse === undefined || typeof usersResponse === 'object').toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
});
