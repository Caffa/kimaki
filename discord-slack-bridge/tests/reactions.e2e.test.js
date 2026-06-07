"use strict";
// E2E: Reaction operations through the bridge (Discord → Slack).
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
(0, vitest_1.describe)('reactions: Discord → Slack', function () {
    var ctx;
    var channel;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)({
                        channels: [{ name: 'reactions-test' }],
                    })];
                case 1:
                    ctx = _a.sent();
                    channelId = ctx.twin.resolveChannelId('reactions-test');
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
    (0, vitest_1.test)('bot adds reaction → appears in Slack twin', function () { return __awaiter(void 0, void 0, void 0, function () {
        var msg, messages, target, thumbsUp;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, channel.send('React to this')];
                case 1:
                    msg = _b.sent();
                    return [4 /*yield*/, msg.react('👍')];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, ctx.twin.channel('reactions-test').getMessages()];
                case 3:
                    messages = _b.sent();
                    target = messages.find(function (m) {
                        return m.text === 'React to this';
                    });
                    (0, vitest_1.expect)(target).toBeDefined();
                    (0, vitest_1.expect)(target.reactions).toBeDefined();
                    thumbsUp = (_a = target.reactions) === null || _a === void 0 ? void 0 : _a.find(function (r) {
                        return r.name === '👍' || r.name === 'thumbsup' || r.name === '+1';
                    });
                    (0, vitest_1.expect)(thumbsUp).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('bot removes reaction → removed from Slack twin', function () { return __awaiter(void 0, void 0, void 0, function () {
        var msg, before, msgBefore, reaction, after, msgAfter, remaining;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, channel.send('Remove reaction test')];
                case 1:
                    msg = _d.sent();
                    return [4 /*yield*/, msg.react('👍')
                        // Verify it exists first
                    ];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, ctx.twin.channel('reactions-test').getMessages()];
                case 3:
                    before = _d.sent();
                    msgBefore = before.find(function (m) {
                        return m.text === 'Remove reaction test';
                    });
                    (0, vitest_1.expect)((_a = msgBefore.reactions) === null || _a === void 0 ? void 0 : _a.length).toBeGreaterThan(0);
                    reaction = msg.reactions.cache.first();
                    if (!reaction) return [3 /*break*/, 5];
                    return [4 /*yield*/, reaction.users.remove(ctx.client.user.id)];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5: return [4 /*yield*/, ctx.twin.channel('reactions-test').getMessages()];
                case 6:
                    after = _d.sent();
                    msgAfter = after.find(function (m) {
                        return m.text === 'Remove reaction test';
                    });
                    remaining = (_c = (_b = msgAfter.reactions) === null || _b === void 0 ? void 0 : _b.filter(function (r) {
                        return r.count > 0;
                    })) !== null && _c !== void 0 ? _c : [];
                    (0, vitest_1.expect)(remaining.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); });
});
