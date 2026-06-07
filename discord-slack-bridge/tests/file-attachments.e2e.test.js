"use strict";
// E2E: Attachment parity flows used by Kimaki (Discord<->Slack bridge).
// Covers discord.js multipart sends and Slack webhook file payload mapping.
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
var e2e_setup_js_1 = require("./e2e-setup.js");
var src_1 = require("slack-digital-twin/src");
(0, vitest_1.describe)('attachments: bridge parity for kimaki', function () {
    var ctx;
    var channel;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, fetched;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)({
                        channels: [{ name: 'attachments' }],
                        users: [{ name: 'alice', realName: 'Alice' }],
                    })];
                case 1:
                    ctx = _a.sent();
                    channelId = ctx.twin.resolveChannelId('attachments');
                    return [4 /*yield*/, ctx.client.channels.fetch(channelId)];
                case 2:
                    fetched = _a.sent();
                    channel = fetched;
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
    (0, vitest_1.test)('discord.js can send multipart files through bridge', function () { return __awaiter(void 0, void 0, void 0, function () {
        var messages, posted;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.send({
                        content: 'multipart upload from discord',
                        files: [
                            {
                                attachment: Buffer.from('hello from kimaki tests', 'utf8'),
                                name: 'hello.txt',
                            },
                        ],
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.twin.channel('attachments').getMessages()];
                case 2:
                    messages = _a.sent();
                    posted = messages.find(function (message) {
                        return message.text === 'multipart upload from discord';
                    });
                    (0, vitest_1.expect)(posted).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('slack image files map to discord message attachments', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, channelId, aliceId, webhookConfig, message, first;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        ctx.client.once('messageCreate', function (message) {
                            resolve(message);
                        });
                    });
                    channelId = ctx.twin.resolveChannelId('attachments');
                    aliceId = ctx.twin.resolveUserId('alice');
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, src_1.sendWebhookEvent)({
                            config: webhookConfig,
                            event: {
                                type: 'message',
                                channel: channelId,
                                user: aliceId,
                                text: 'image from slack',
                                ts: '1700000100.000001',
                                files: [
                                    {
                                        id: 'FIMG001',
                                        name: 'diagram.png',
                                        mimetype: 'image/png',
                                        url_private: 'https://slack.example/files/FIMG001',
                                        permalink: 'https://slack.example/permalink/FIMG001',
                                        size: 2048,
                                    },
                                ],
                            },
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, received];
                case 2:
                    message = _a.sent();
                    (0, vitest_1.expect)(message.content).toBe('image from slack');
                    (0, vitest_1.expect)(message.attachments.size).toBe(1);
                    first = message.attachments.first();
                    (0, vitest_1.expect)(first === null || first === void 0 ? void 0 : first.name).toBe('diagram.png');
                    (0, vitest_1.expect)(first === null || first === void 0 ? void 0 : first.contentType).toBe('image/png');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('slack audio files map to discord audio attachments for transcription', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, channelId, aliceId, webhookConfig, message, first;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        ctx.client.once('messageCreate', function (message) {
                            resolve(message);
                        });
                    });
                    channelId = ctx.twin.resolveChannelId('attachments');
                    aliceId = ctx.twin.resolveUserId('alice');
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, src_1.sendWebhookEvent)({
                            config: webhookConfig,
                            event: {
                                type: 'message',
                                channel: channelId,
                                user: aliceId,
                                text: 'voice note from slack',
                                ts: '1700000101.000001',
                                files: [
                                    {
                                        id: 'FAUD001',
                                        name: 'voice-message.ogg',
                                        mimetype: 'audio/ogg',
                                        url_private: 'https://slack.example/files/FAUD001',
                                        permalink: 'https://slack.example/permalink/FAUD001',
                                        size: 4096,
                                    },
                                ],
                            },
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, received];
                case 2:
                    message = _a.sent();
                    first = message.attachments.first();
                    (0, vitest_1.expect)(first === null || first === void 0 ? void 0 : first.name).toBe('voice-message.ogg');
                    (0, vitest_1.expect)(first === null || first === void 0 ? void 0 : first.contentType).toBe('audio/ogg');
                    return [2 /*return*/];
            }
        });
    }); });
});
