"use strict";
// E2E: Thread creation and replies through the bridge.
// Discord threads map to Slack threads (thread_ts replies).
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
var id_converter_js_1 = require("../src/id-converter.js");
(0, vitest_1.describe)('threads: Discord → Slack', function () {
    var ctx;
    var channel;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)({
                        channels: [{ name: 'threads-test' }],
                    })];
                case 1:
                    ctx = _a.sent();
                    channelId = ctx.twin.resolveChannelId('threads-test');
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
    (0, vitest_1.test)('create thread → posts parent message in Slack, returns thread channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, decoded;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.threads.create({
                        name: 'Bug discussion',
                    })];
                case 1:
                    thread = _a.sent();
                    (0, vitest_1.expect)(thread).toBeDefined();
                    (0, vitest_1.expect)(thread.name).toBe('Bug discussion');
                    // Thread IDs are pure numeric (encoded Slack ts, valid BigInt snowflake)
                    (0, vitest_1.expect)(/^\d{7,}$/.test(thread.id)).toBe(true);
                    decoded = (0, id_converter_js_1.decodeThreadId)(thread.id);
                    (0, vitest_1.expect)(decoded.threadTs).toMatch(/^\d+\.\d{6}$/);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('send messages in thread → appear as Slack thread replies', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, channelId, text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.threads.create({
                        name: 'Reply test',
                    })];
                case 1:
                    thread = _a.sent();
                    return [4 /*yield*/, thread.send('First reply')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, thread.send('Second reply')
                        // Check Slack side: parent + 2 replies
                    ];
                case 3:
                    _a.sent();
                    channelId = ctx.twin.resolveChannelId('threads-test');
                    return [4 /*yield*/, ctx.twin.channel(channelId).text()];
                case 4:
                    text = _a.sent();
                    (0, vitest_1.expect)(text).toContain('First reply');
                    (0, vitest_1.expect)(text).toContain('Second reply');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('fetch messages in thread returns thread replies', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, messages, texts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.threads.create({
                        name: 'Fetch test',
                    })];
                case 1:
                    thread = _a.sent();
                    return [4 /*yield*/, thread.send('Reply A')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, thread.send('Reply B')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, thread.messages.fetch({ limit: 10 })];
                case 4:
                    messages = _a.sent();
                    texts = messages.map(function (m) {
                        return m.content;
                    });
                    (0, vitest_1.expect)(texts).toContain('Reply A');
                    (0, vitest_1.expect)(texts).toContain('Reply B');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('startThread from message uses message threads endpoint', function () { return __awaiter(void 0, void 0, void 0, function () {
        var parent, thread, channelId, text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.send('Parent message for thread')];
                case 1:
                    parent = _a.sent();
                    return [4 /*yield*/, parent.startThread({
                            name: 'Message thread',
                        })];
                case 2:
                    thread = _a.sent();
                    return [4 /*yield*/, thread.send('Reply from message thread')];
                case 3:
                    _a.sent();
                    channelId = ctx.twin.resolveChannelId('threads-test');
                    return [4 /*yield*/, ctx.twin.channel(channelId).text()];
                case 4:
                    text = _a.sent();
                    (0, vitest_1.expect)(text).toContain('Parent message for thread');
                    (0, vitest_1.expect)(text).toContain('Reply from message thread');
                    (0, vitest_1.expect)(text).not.toContain('Message thread');
                    return [2 /*return*/];
            }
        });
    }); });
});
