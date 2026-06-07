"use strict";
// Tests Anthropic OAuth account persistence, deduplication, and rotation.
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
var promises_1 = require("node:fs/promises");
var node_os_1 = require("node:os");
var node_path_1 = require("node:path");
var vitest_1 = require("vitest");
var anthropic_auth_state_js_1 = require("./anthropic-auth-state.js");
var firstAccount = {
    type: 'oauth',
    refresh: 'refresh-first',
    access: 'access-first',
    expires: 1,
};
var secondAccount = {
    type: 'oauth',
    refresh: 'refresh-second',
    access: 'access-second',
    expires: 2,
};
var originalXdgDataHome;
var tempDir = '';
(0, vitest_1.beforeEach)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                originalXdgDataHome = process.env.XDG_DATA_HOME;
                return [4 /*yield*/, (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), 'anthropic-auth-plugin-'))];
            case 1:
                tempDir = _a.sent();
                process.env.XDG_DATA_HOME = tempDir;
                return [2 /*return*/];
        }
    });
}); });
(0, vitest_1.afterEach)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (originalXdgDataHome === undefined) {
                    delete process.env.XDG_DATA_HOME;
                }
                else {
                    process.env.XDG_DATA_HOME = originalXdgDataHome;
                }
                return [4 /*yield*/, (0, promises_1.rm)(tempDir, { force: true, recursive: true })];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
(0, vitest_1.describe)('rememberAnthropicOAuth', function () {
    (0, vitest_1.test)('stores accounts and updates existing entries by refresh token', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, anthropic_auth_state_js_1.rememberAnthropicOAuth)(firstAccount)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.rememberAnthropicOAuth)(__assign(__assign({}, firstAccount), { access: 'access-first-new', expires: 3 }))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.loadAccountStore)()];
                case 3:
                    store = _a.sent();
                    (0, vitest_1.expect)(store.activeIndex).toBe(0);
                    (0, vitest_1.expect)(store.accounts).toHaveLength(1);
                    (0, vitest_1.expect)(store.accounts[0]).toMatchObject({
                        refresh: 'refresh-first',
                        access: 'access-first-new',
                        expires: 3,
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('deduplicates new tokens by email or account ID', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, anthropic_auth_state_js_1.rememberAnthropicOAuth)(firstAccount, {
                        email: 'user@example.com',
                        accountId: 'usr_123',
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.rememberAnthropicOAuth)(secondAccount, {
                            email: 'User@example.com',
                            accountId: 'usr_123',
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.loadAccountStore)()];
                case 3:
                    store = _a.sent();
                    (0, vitest_1.expect)(store.accounts).toHaveLength(1);
                    (0, vitest_1.expect)(store.accounts[0]).toMatchObject({
                        refresh: 'refresh-second',
                        access: 'access-second',
                        email: 'user@example.com',
                        accountId: 'usr_123',
                    });
                    (0, vitest_1.expect)((0, anthropic_auth_state_js_1.accountLabel)(store.accounts[0])).toBe('user@example.com');
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('rotateAnthropicAccount', function () {
    (0, vitest_1.test)('rotates to the next stored account and syncs auth state', function () { return __awaiter(void 0, void 0, void 0, function () {
        var authSetCalls, client, rotated, store, authJson, _a, _b;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, anthropic_auth_state_js_1.saveAccountStore)({
                        version: 1,
                        activeIndex: 0,
                        accounts: [
                            __assign(__assign({}, firstAccount), { addedAt: 1, lastUsed: 1 }),
                            __assign(__assign({}, secondAccount), { addedAt: 2, lastUsed: 2 }),
                        ],
                    })];
                case 1:
                    _d.sent();
                    authSetCalls = [];
                    client = {
                        auth: {
                            set: function (input) { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    authSetCalls.push(input);
                                    return [2 /*return*/];
                                });
                            }); },
                        },
                    };
                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.rotateAnthropicAccount)(firstAccount, client)];
                case 2:
                    rotated = _d.sent();
                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.loadAccountStore)()];
                case 3:
                    store = _d.sent();
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, (0, promises_1.readFile)((0, anthropic_auth_state_js_1.authFilePath)(), 'utf8')];
                case 4:
                    authJson = _b.apply(_a, [_d.sent()]);
                    (0, vitest_1.expect)(rotated).toMatchObject({
                        auth: { refresh: 'refresh-second' },
                        fromLabel: '#1 (refresh-...irst)',
                        toLabel: '#2 (refresh-...cond)',
                        fromIndex: 0,
                        toIndex: 1,
                    });
                    (0, vitest_1.expect)(store.activeIndex).toBe(1);
                    (0, vitest_1.expect)((_c = authJson.anthropic) === null || _c === void 0 ? void 0 : _c.refresh).toBe('refresh-second');
                    (0, vitest_1.expect)(authSetCalls).toEqual([
                        {
                            path: { id: 'anthropic' },
                            body: {
                                type: 'oauth',
                                refresh: 'refresh-second',
                                access: 'access-second',
                                expires: 2,
                            },
                        },
                    ]);
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('removeAccount', function () {
    (0, vitest_1.test)('removing the active account promotes the next stored account', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, authJson, _a, _b;
        var _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, (0, anthropic_auth_state_js_1.saveAccountStore)({
                        version: 1,
                        activeIndex: 1,
                        accounts: [
                            __assign(__assign({}, firstAccount), { addedAt: 1, lastUsed: 1 }),
                            __assign(__assign({}, secondAccount), { addedAt: 2, lastUsed: 2 }),
                        ],
                    })];
                case 1:
                    _e.sent();
                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.removeAccount)(1)];
                case 2:
                    _e.sent();
                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.loadAccountStore)()];
                case 3:
                    store = _e.sent();
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, (0, promises_1.readFile)((0, anthropic_auth_state_js_1.authFilePath)(), 'utf8')];
                case 4:
                    authJson = _b.apply(_a, [_e.sent()]);
                    (0, vitest_1.expect)(store.activeIndex).toBe(0);
                    (0, vitest_1.expect)(store.accounts).toHaveLength(1);
                    (0, vitest_1.expect)((_c = store.accounts[0]) === null || _c === void 0 ? void 0 : _c.refresh).toBe('refresh-first');
                    (0, vitest_1.expect)((_d = authJson.anthropic) === null || _d === void 0 ? void 0 : _d.refresh).toBe('refresh-first');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('removing the last account clears active Anthropic auth', function () { return __awaiter(void 0, void 0, void 0, function () {
        var store, authJson, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, anthropic_auth_state_js_1.saveAccountStore)({
                        version: 1,
                        activeIndex: 0,
                        accounts: [__assign(__assign({}, firstAccount), { addedAt: 1, lastUsed: 1 })],
                    })];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, (0, promises_1.mkdir)(node_path_1.default.dirname((0, anthropic_auth_state_js_1.authFilePath)()), { recursive: true })];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, promises_1.writeFile)((0, anthropic_auth_state_js_1.authFilePath)(), JSON.stringify({ anthropic: firstAccount }, null, 2))];
                case 3:
                    _c.sent();
                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.removeAccount)(0)];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.loadAccountStore)()];
                case 5:
                    store = _c.sent();
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, (0, promises_1.readFile)((0, anthropic_auth_state_js_1.authFilePath)(), 'utf8')];
                case 6:
                    authJson = _b.apply(_a, [_c.sent()]);
                    (0, vitest_1.expect)(store.accounts).toHaveLength(0);
                    (0, vitest_1.expect)(authJson.anthropic).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('shouldRotateAuth', function () {
    (0, vitest_1.test)('only rotates on rate limit or auth failures', function () {
        (0, vitest_1.expect)((0, anthropic_auth_state_js_1.shouldRotateAuth)(429, '')).toBe(true);
        (0, vitest_1.expect)((0, anthropic_auth_state_js_1.shouldRotateAuth)(401, 'permission_error')).toBe(true);
        (0, vitest_1.expect)((0, anthropic_auth_state_js_1.shouldRotateAuth)(400, 'bad request')).toBe(false);
    });
});
