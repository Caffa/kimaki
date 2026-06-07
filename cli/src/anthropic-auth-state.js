"use strict";
/**
 * Anthropic OAuth account store and rotation.
 * Uses shared utilities from oauth-rotation-shared.ts for file locking,
 * store I/O, and account management. Anthropic-specific: store file path,
 * identity normalization via AnthropicAccountIdentity.
 */
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
exports.shouldRotateAuth = exports.withAuthStateLock = exports.authFilePath = exports.accountLabel = void 0;
exports.accountsFilePath = accountsFilePath;
exports.loadAccountStore = loadAccountStore;
exports.saveAccountStore = saveAccountStore;
exports.upsertAccount = upsertAccount;
exports.rememberAnthropicOAuth = rememberAnthropicOAuth;
exports.setAnthropicAuth = setAnthropicAuth;
exports.getCurrentAnthropicAccount = getCurrentAnthropicAccount;
exports.rotateAnthropicAccount = rotateAnthropicAccount;
exports.removeAccount = removeAccount;
var node_os_1 = require("node:os");
var node_path_1 = require("node:path");
var anthropic_account_identity_js_1 = require("./anthropic-account-identity.js");
var oauth_rotation_shared_js_1 = require("./oauth-rotation-shared.js");
Object.defineProperty(exports, "accountLabel", { enumerable: true, get: function () { return oauth_rotation_shared_js_1.accountLabel; } });
Object.defineProperty(exports, "authFilePath", { enumerable: true, get: function () { return oauth_rotation_shared_js_1.authFilePath; } });
Object.defineProperty(exports, "withAuthStateLock", { enumerable: true, get: function () { return oauth_rotation_shared_js_1.withAuthStateLock; } });
Object.defineProperty(exports, "shouldRotateAuth", { enumerable: true, get: function () { return oauth_rotation_shared_js_1.shouldRotateAuth; } });
// --- Store file path ---
function accountsFilePath() {
    if (process.env.XDG_DATA_HOME) {
        return node_path_1.default.join(process.env.XDG_DATA_HOME, 'opencode', 'anthropic-oauth-accounts.json');
    }
    return node_path_1.default.join((0, node_os_1.homedir)(), '.local', 'share', 'opencode', 'anthropic-oauth-accounts.json');
}
// --- Store I/O ---
function loadAccountStore() {
    return __awaiter(this, void 0, void 0, function () {
        var raw;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, oauth_rotation_shared_js_1.readJson)(accountsFilePath(), null)];
                case 1:
                    raw = _a.sent();
                    return [2 /*return*/, (0, oauth_rotation_shared_js_1.normalizeAccountStore)(raw)];
            }
        });
    });
}
function saveAccountStore(store) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, oauth_rotation_shared_js_1.writeJson)(accountsFilePath(), (0, oauth_rotation_shared_js_1.normalizeAccountStore)(store))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// --- Upsert with Anthropic identity normalization ---
function upsertAccount(store, auth, now) {
    if (now === void 0) { now = Date.now(); }
    var authWithIdentity = auth;
    var identity = (0, anthropic_account_identity_js_1.normalizeAnthropicAccountIdentity)({
        email: authWithIdentity.email,
        accountId: authWithIdentity.accountId,
    });
    return (0, oauth_rotation_shared_js_1.upsertAccount)(store, __assign(__assign({}, auth), identity), now);
}
// --- Remember new login ---
function rememberAnthropicOAuth(auth, identity) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, oauth_rotation_shared_js_1.withAuthStateLock)(function () { return __awaiter(_this, void 0, void 0, function () {
                        var store;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, loadAccountStore()];
                                case 1:
                                    store = _a.sent();
                                    upsertAccount(store, __assign(__assign({}, auth), (0, anthropic_account_identity_js_1.normalizeAnthropicAccountIdentity)(identity)));
                                    return [4 /*yield*/, saveAccountStore(store)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// --- Auth file write + SDK sync ---
function writeAnthropicAuthFile(auth) {
    return __awaiter(this, void 0, void 0, function () {
        var file, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    file = (0, oauth_rotation_shared_js_1.authFilePath)();
                    return [4 /*yield*/, (0, oauth_rotation_shared_js_1.readJson)(file, {})];
                case 1:
                    data = _a.sent();
                    if (auth) {
                        data.anthropic = auth;
                    }
                    else {
                        delete data.anthropic;
                    }
                    return [4 /*yield*/, (0, oauth_rotation_shared_js_1.writeJson)(file, data)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setAnthropicAuth(auth, client) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, writeAnthropicAuthFile(auth)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, client.auth.set({ path: { id: 'anthropic' }, body: auth })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// --- Current account ---
function getCurrentAnthropicAccount() {
    return __awaiter(this, void 0, void 0, function () {
        var authJson, auth, store, index, account;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, oauth_rotation_shared_js_1.readJson)((0, oauth_rotation_shared_js_1.authFilePath)(), {})];
                case 1:
                    authJson = _a.sent();
                    auth = authJson.anthropic;
                    if (!(0, oauth_rotation_shared_js_1.isOAuthStored)(auth)) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, loadAccountStore()];
                case 2:
                    store = _a.sent();
                    index = (0, oauth_rotation_shared_js_1.findCurrentAccountIndex)(store, auth);
                    account = store.accounts[index];
                    if (!account) {
                        return [2 /*return*/, { auth: auth }];
                    }
                    if (account.refresh !== auth.refresh && account.access !== auth.access) {
                        return [2 /*return*/, { auth: auth }];
                    }
                    return [2 /*return*/, {
                            auth: auth,
                            account: account,
                            index: index,
                        }];
            }
        });
    });
}
// --- Rotation ---
function rotateAnthropicAccount(auth, client) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, oauth_rotation_shared_js_1.withAuthStateLock)(function () { return __awaiter(_this, void 0, void 0, function () {
                    var store, currentIndex, currentAccount, nextIndex, nextAccount, fromLabel, nextAuth;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, loadAccountStore()];
                            case 1:
                                store = _a.sent();
                                if (store.accounts.length < 2)
                                    return [2 /*return*/, undefined];
                                currentIndex = (0, oauth_rotation_shared_js_1.findCurrentAccountIndex)(store, auth);
                                currentAccount = store.accounts[currentIndex];
                                nextIndex = (currentIndex + 1) % store.accounts.length;
                                nextAccount = store.accounts[nextIndex];
                                if (!nextAccount)
                                    return [2 /*return*/, undefined];
                                fromLabel = currentAccount
                                    ? (0, oauth_rotation_shared_js_1.accountLabel)(currentAccount, currentIndex)
                                    : (0, oauth_rotation_shared_js_1.accountLabel)(auth, currentIndex);
                                nextAccount.lastUsed = Date.now();
                                store.activeIndex = nextIndex;
                                return [4 /*yield*/, saveAccountStore(store)];
                            case 2:
                                _a.sent();
                                nextAuth = {
                                    type: 'oauth',
                                    refresh: nextAccount.refresh,
                                    access: nextAccount.access,
                                    expires: nextAccount.expires,
                                };
                                return [4 /*yield*/, setAnthropicAuth(nextAuth, client)];
                            case 3:
                                _a.sent();
                                return [2 /*return*/, {
                                        auth: nextAuth,
                                        fromLabel: fromLabel,
                                        toLabel: (0, oauth_rotation_shared_js_1.accountLabel)(nextAccount, nextIndex),
                                        fromIndex: currentIndex,
                                        toIndex: nextIndex,
                                    }];
                        }
                    });
                }); })];
        });
    });
}
// --- Remove account ---
function removeAccount(index) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, oauth_rotation_shared_js_1.withAuthStateLock)(function () { return __awaiter(_this, void 0, void 0, function () {
                    var store, active, nextAuth;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, loadAccountStore()];
                            case 1:
                                store = _a.sent();
                                if (!Number.isInteger(index) || index < 0 || index >= store.accounts.length) {
                                    throw new Error("Account ".concat(index + 1, " does not exist"));
                                }
                                store.accounts.splice(index, 1);
                                if (!(store.accounts.length === 0)) return [3 /*break*/, 4];
                                store.activeIndex = 0;
                                return [4 /*yield*/, saveAccountStore(store)];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, writeAnthropicAuthFile(undefined)];
                            case 3:
                                _a.sent();
                                return [2 /*return*/, { store: store, active: undefined }];
                            case 4:
                                if (store.activeIndex > index) {
                                    store.activeIndex -= 1;
                                }
                                else if (store.activeIndex >= store.accounts.length) {
                                    store.activeIndex = 0;
                                }
                                active = store.accounts[store.activeIndex];
                                if (!active)
                                    throw new Error('Active Anthropic account disappeared during removal');
                                active.lastUsed = Date.now();
                                return [4 /*yield*/, saveAccountStore(store)];
                            case 5:
                                _a.sent();
                                nextAuth = {
                                    type: 'oauth',
                                    refresh: active.refresh,
                                    access: active.access,
                                    expires: active.expires,
                                };
                                return [4 /*yield*/, writeAnthropicAuthFile(nextAuth)];
                            case 6:
                                _a.sent();
                                return [2 /*return*/, { store: store, active: nextAuth }];
                        }
                    });
                }); })];
        });
    });
}
