"use strict";
// E2E test setup helper for discord-slack-bridge.
// Wires up: discord.js Client → SlackBridge → SlackDigitalTwin
// No real Discord or Slack APIs are called.
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
exports.setupE2E = setupE2E;
exports.teardownE2E = teardownE2E;
exports.waitFor = waitFor;
var discord_js_1 = require("discord.js");
var index_js_1 = require("../src/index.js");
var src_1 = require("slack-digital-twin/src");
var DEFAULT_SIGNING_SECRET = 'e2e-test-signing-secret';
function setupE2E() {
    return __awaiter(this, arguments, void 0, function (options) {
        var signingSecret, twin, bridge, client, readyPromise;
        var _a, _b, _c;
        if (options === void 0) { options = {}; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    signingSecret = (_a = options.signingSecret) !== null && _a !== void 0 ? _a : DEFAULT_SIGNING_SECRET;
                    twin = new src_1.SlackDigitalTwin({
                        workspaceName: 'E2E Workspace',
                        channels: (_b = options.channels) !== null && _b !== void 0 ? _b : [{ name: 'general' }, { name: 'project' }],
                        users: (_c = options.users) !== null && _c !== void 0 ? _c : [
                            { name: 'alice', realName: 'Alice Smith' },
                            { name: 'bob', realName: 'Bob Jones' },
                        ],
                        webhookConfig: { signingSecret: signingSecret },
                    });
                    return [4 /*yield*/, twin.start()];
                case 1:
                    _d.sent();
                    bridge = new index_js_1.SlackBridge(__assign({ slackBotToken: twin.botToken, slackSigningSecret: signingSecret, workspaceId: twin.workspaceId, port: 0, slackApiUrl: twin.apiUrl }, options.bridgeConfig));
                    return [4 /*yield*/, bridge.start()
                        // Wire webhook target now that bridge port is known
                    ];
                case 2:
                    _d.sent();
                    // Wire webhook target now that bridge port is known
                    twin.setWebhookUrl(bridge.webhookUrl);
                    client = new discord_js_1.Client({
                        intents: [
                            discord_js_1.GatewayIntentBits.Guilds,
                            discord_js_1.GatewayIntentBits.GuildMessages,
                            discord_js_1.GatewayIntentBits.MessageContent,
                            discord_js_1.GatewayIntentBits.GuildMessageReactions,
                        ],
                        partials: [discord_js_1.Partials.Channel, discord_js_1.Partials.Message, discord_js_1.Partials.Reaction],
                        rest: { api: bridge.restUrl, version: '10' },
                    });
                    readyPromise = new Promise(function (resolve) {
                        client.once('ready', function () {
                            resolve();
                        });
                    });
                    return [4 /*yield*/, client.login(bridge.discordToken)];
                case 3:
                    _d.sent();
                    return [4 /*yield*/, readyPromise];
                case 4:
                    _d.sent();
                    return [2 /*return*/, { twin: twin, bridge: bridge, client: client }];
            }
        });
    });
}
function teardownE2E(ctx) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ctx.client.destroy();
                    return [4 /*yield*/, ctx.bridge.stop()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.twin.stop()];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// Poll helper: wait for a condition with timeout
function waitFor(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, result;
        var fn = _b.fn, _c = _b.timeout, timeout = _c === void 0 ? 4000 : _c, _d = _b.interval, interval = _d === void 0 ? 100 : _d, _e = _b.label, label = _e === void 0 ? 'waitFor' : _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    start = Date.now();
                    _f.label = 1;
                case 1:
                    if (!(Date.now() - start < timeout)) return [3 /*break*/, 4];
                    return [4 /*yield*/, fn()];
                case 2:
                    result = _f.sent();
                    if (result) {
                        return [2 /*return*/, result];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, interval);
                        })];
                case 3:
                    _f.sent();
                    return [3 /*break*/, 1];
                case 4: throw new Error("".concat(label, " timed out after ").concat(timeout, "ms"));
            }
        });
    });
}
