"use strict";
// E2E: Markdown ↔ mrkdwn format conversion through the full bridge stack.
// Discord markdown → Slack mrkdwn (Discord → Slack direction)
// Slack mrkdwn → Discord markdown (Slack → Discord direction)
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
(0, vitest_1.describe)('format conversion e2e', function () {
    var ctx;
    var channel;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)({
                        channels: [{ name: 'format-test' }],
                        users: [{ name: 'alice' }],
                    })];
                case 1:
                    ctx = _a.sent();
                    channelId = ctx.twin.resolveChannelId('format-test');
                    return [4 /*yield*/, ctx.client.channels.fetch(channelId)];
                case 2:
                    channel = (_a.sent());
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
    (0, vitest_1.test)('Discord bold → Slack bold', function () { return __awaiter(void 0, void 0, void 0, function () {
        var messages, found;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.send('**bold text**')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.twin.channel('format-test').getMessages()];
                case 2:
                    messages = _a.sent();
                    found = messages.find(function (m) {
                        var _a;
                        return (_a = m.text) === null || _a === void 0 ? void 0 : _a.includes('bold text');
                    });
                    (0, vitest_1.expect)(found).toBeDefined();
                    // Bridge converts **bold** → *bold* for Slack mrkdwn
                    (0, vitest_1.expect)(found.text).toBe('*bold text*');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('Discord strikethrough → Slack strikethrough', function () { return __awaiter(void 0, void 0, void 0, function () {
        var messages, found;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.send('~~strike~~')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.twin.channel('format-test').getMessages()];
                case 2:
                    messages = _a.sent();
                    found = messages.find(function (m) {
                        var _a;
                        return (_a = m.text) === null || _a === void 0 ? void 0 : _a.includes('strike');
                    });
                    (0, vitest_1.expect)(found).toBeDefined();
                    // Bridge converts ~~strike~~ → ~strike~ for Slack mrkdwn
                    (0, vitest_1.expect)(found.text).toBe('~strike~');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('Discord link → Slack link', function () { return __awaiter(void 0, void 0, void 0, function () {
        var messages, found;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.send('[example](https://example.com)')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.twin.channel('format-test').getMessages()];
                case 2:
                    messages = _a.sent();
                    found = messages.find(function (m) {
                        var _a;
                        return (_a = m.text) === null || _a === void 0 ? void 0 : _a.includes('example.com');
                    });
                    (0, vitest_1.expect)(found).toBeDefined();
                    // Bridge converts [text](url) → <url|text> for Slack mrkdwn
                    (0, vitest_1.expect)(found.text).toBe('<https://example.com|example>');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('Slack mrkdwn → Discord markdown (bold)', function () { return __awaiter(void 0, void 0, void 0, function () {
        var received, channelId, msg;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    received = new Promise(function (resolve) {
                        ctx.client.once('messageCreate', function (msg) {
                            resolve(msg);
                        });
                    });
                    channelId = ctx.twin.resolveChannelId('format-test');
                    return [4 /*yield*/, ctx.twin.user('alice').sendMessage({
                            channel: channelId,
                            text: '*bold from slack*',
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, received
                        // Bridge converts *bold* → **bold** for Discord markdown
                    ];
                case 2:
                    msg = _a.sent();
                    // Bridge converts *bold* → **bold** for Discord markdown
                    (0, vitest_1.expect)(msg.content).toBe('**bold from slack**');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('code blocks pass through unchanged', function () { return __awaiter(void 0, void 0, void 0, function () {
        var messages, found;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.send('`inline code` and ```block```')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.twin.channel('format-test').getMessages()];
                case 2:
                    messages = _a.sent();
                    found = messages.find(function (m) {
                        var _a;
                        return (_a = m.text) === null || _a === void 0 ? void 0 : _a.includes('inline code');
                    });
                    (0, vitest_1.expect)(found).toBeDefined();
                    // Code should not be transformed
                    (0, vitest_1.expect)(found.text).toContain('`inline code`');
                    return [2 /*return*/];
            }
        });
    }); });
});
