"use strict";
// E2E coverage for active thread discovery route.
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
(0, vitest_1.describe)('active threads route', function () {
    var ctx;
    var channel;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)({
                        channels: [{ name: 'active-threads-test' }],
                    })];
                case 1:
                    ctx = _a.sent();
                    channelId = ctx.twin.resolveChannelId('active-threads-test');
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
    (0, vitest_1.test)('returns active thread list with members', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, list;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, channel.threads.create({ name: 'active-thread-route' })];
                case 1:
                    thread = _b.sent();
                    return [4 /*yield*/, thread.send('reply to mark as active')];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            label: 'active threads list',
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                var response, body, foundThread;
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/guilds/").concat(ctx.twin.workspaceId, "/threads/active"))];
                                        case 1:
                                            response = _b.sent();
                                            if (response.status !== 200) {
                                                return [2 /*return*/, undefined];
                                            }
                                            return [4 /*yield*/, response.json()];
                                        case 2:
                                            body = (_b.sent());
                                            foundThread = ((_a = body.threads) !== null && _a !== void 0 ? _a : []).some(function (entry) {
                                                return entry.id === thread.id;
                                            });
                                            if (!foundThread) {
                                                return [2 /*return*/, undefined];
                                            }
                                            return [2 /*return*/, body];
                                    }
                                });
                            }); },
                        })];
                case 3:
                    list = _b.sent();
                    (0, vitest_1.expect)(((_a = list.members) !== null && _a !== void 0 ? _a : []).some(function (member) {
                        var _a;
                        return member.id === thread.id && member.user_id === ((_a = ctx.client.user) === null || _a === void 0 ? void 0 : _a.id);
                    })).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('mismatched guild id returns unknown guild payload', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/guilds/T_WRONG_GUILD/threads/active"))];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(response.status).toBe(404);
                    (0, vitest_1.expect)(body).toMatchObject({
                        code: 10004,
                        error: 'unknown_guild',
                        message: 'Unknown Guild: T_WRONG_GUILD',
                    });
                    return [2 /*return*/];
            }
        });
    }); });
});
