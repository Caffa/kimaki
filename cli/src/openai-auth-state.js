"use strict";
/**
 * OpenAI OAuth account store and rotation.
 * Mirrors anthropic-auth-state.ts but for OpenAI/Codex OAuth accounts.
 * Piggybacks on opencode's built-in CodexAuthPlugin for auth; this module
 * only manages the rotation pool and account switching.
 *
 * Store file: ~/.local/share/opencode/openai-oauth-accounts.json
 * Migration: on first load, copies from multicodex-accounts.json if present.
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
exports.upsertAccount = exports.accountLabel = void 0;
exports.extractOpenAIIdentity = extractOpenAIIdentity;
exports.openaiAccountsFilePath = openaiAccountsFilePath;
exports.loadOpenAIAccountStore = loadOpenAIAccountStore;
exports.saveOpenAIAccountStore = saveOpenAIAccountStore;
exports.getCurrentOpenAIAccount = getCurrentOpenAIAccount;
exports.setOpenAIAuth = setOpenAIAuth;
exports.rememberOpenAIOAuth = rememberOpenAIOAuth;
exports.detectAndRememberNewOpenAIAccount = detectAndRememberNewOpenAIAccount;
exports.rotateOpenAIAccount = rotateOpenAIAccount;
exports.removeOpenAIAccount = removeOpenAIAccount;
var node_os_1 = require("node:os");
var node_path_1 = require("node:path");
var oauth_rotation_shared_js_1 = require("./oauth-rotation-shared.js");
Object.defineProperty(exports, "accountLabel", { enumerable: true, get: function () { return oauth_rotation_shared_js_1.accountLabel; } });
Object.defineProperty(exports, "upsertAccount", { enumerable: true, get: function () { return oauth_rotation_shared_js_1.upsertAccount; } });
// --- JWT identity extraction ---
/**
 * Extract email and accountId from an OpenAI OAuth access token JWT.
 * The JWT payload contains:
 *   "https://api.openai.com/profile": { "email": "..." }
 *   "https://api.openai.com/auth": { "chatgpt_account_id": "..." }
 * Falls back to top-level auth entry fields if JWT decoding fails.
 */
function extractOpenAIIdentity(auth) {
    // Try JWT first
    try {
        var parts = auth.access.split('.');
        if (parts.length >= 2 && parts[1]) {
            var payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
            var profile = payload['https://api.openai.com/profile'];
            var authClaims = payload['https://api.openai.com/auth'];
            var email = typeof (profile === null || profile === void 0 ? void 0 : profile.email) === 'string' ? profile.email : undefined;
            var accountId = typeof (authClaims === null || authClaims === void 0 ? void 0 : authClaims.chatgpt_account_id) === 'string'
                ? authClaims.chatgpt_account_id
                : undefined;
            if (email || accountId) {
                return { email: email, accountId: accountId };
            }
        }
    }
    catch (_a) {
        // JWT decode failed, fall through
    }
    // Fallback: check if auth entry has fields directly
    return {
        email: typeof auth.email === 'string' ? auth.email : undefined,
        accountId: typeof auth.accountId === 'string' ? auth.accountId : undefined,
    };
}
// --- Store file path ---
function openaiAccountsFilePath() {
    if (process.env.XDG_DATA_HOME) {
        return node_path_1.default.join(process.env.XDG_DATA_HOME, 'opencode', 'openai-oauth-accounts.json');
    }
    return node_path_1.default.join((0, node_os_1.homedir)(), '.local', 'share', 'opencode', 'openai-oauth-accounts.json');
}
// --- Store I/O ---
function loadOpenAIAccountStore() {
    return __awaiter(this, void 0, void 0, function () {
        var raw;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, oauth_rotation_shared_js_1.readJson)(openaiAccountsFilePath(), null)];
                case 1:
                    raw = _a.sent();
                    return [2 /*return*/, (0, oauth_rotation_shared_js_1.normalizeAccountStore)(raw)];
            }
        });
    });
}
function saveOpenAIAccountStore(store) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, oauth_rotation_shared_js_1.writeJson)(openaiAccountsFilePath(), (0, oauth_rotation_shared_js_1.normalizeAccountStore)(store))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getCurrentOpenAIAccount() {
    return __awaiter(this, void 0, void 0, function () {
        var authJson, auth, store, index, account;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, oauth_rotation_shared_js_1.readJson)((0, oauth_rotation_shared_js_1.authFilePath)(), {})];
                case 1:
                    authJson = _a.sent();
                    auth = authJson.openai;
                    if (!(0, oauth_rotation_shared_js_1.isOAuthStored)(auth)) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, loadOpenAIAccountStore()];
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
                    return [2 /*return*/, { auth: auth, account: account, index: index }];
            }
        });
    });
}
// --- Auth file write + SDK sync ---
function writeOpenAIAuthFile(auth) {
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
                        data.openai = auth;
                    }
                    else {
                        delete data.openai;
                    }
                    return [4 /*yield*/, (0, oauth_rotation_shared_js_1.writeJson)(file, data)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setOpenAIAuth(auth, client) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, writeOpenAIAuthFile(auth)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, client.auth.set({ path: { id: 'openai' }, body: auth })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// --- Remember new login ---
function rememberOpenAIOAuth(auth, identity) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, oauth_rotation_shared_js_1.withAuthStateLock)(function () { return __awaiter(_this, void 0, void 0, function () {
                        var store;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, loadOpenAIAccountStore()];
                                case 1:
                                    store = _a.sent();
                                    (0, oauth_rotation_shared_js_1.upsertAccount)(store, __assign(__assign({}, auth), identity));
                                    return [4 /*yield*/, saveOpenAIAccountStore(store)];
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
/**
 * Detect if the current auth.json openai entry is a new account not yet in
 * our rotation pool. If so, upsert it. Returns the identity if a new account
 * was added, undefined otherwise.
 */
function detectAndRememberNewOpenAIAccount() {
    return __awaiter(this, void 0, void 0, function () {
        var authJson, auth, identity, store, existingIndex, existing;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, oauth_rotation_shared_js_1.readJson)((0, oauth_rotation_shared_js_1.authFilePath)(), {})];
                case 1:
                    authJson = _a.sent();
                    auth = authJson.openai;
                    if (!(0, oauth_rotation_shared_js_1.isOAuthStored)(auth))
                        return [2 /*return*/, undefined
                            // Extract identity from JWT access token claims
                        ];
                    identity = extractOpenAIIdentity(auth);
                    return [4 /*yield*/, loadOpenAIAccountStore()];
                case 2:
                    store = _a.sent();
                    existingIndex = store.accounts.findIndex(function (account) { return account.refresh === auth.refresh || account.access === auth.access; });
                    if (!(existingIndex >= 0)) return [3 /*break*/, 5];
                    existing = store.accounts[existingIndex];
                    if (!(existing && (!existing.email || !existing.accountId) && (identity.email || identity.accountId))) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, oauth_rotation_shared_js_1.withAuthStateLock)(function () { return __awaiter(_this, void 0, void 0, function () {
                            var freshStore, account;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, loadOpenAIAccountStore()];
                                    case 1:
                                        freshStore = _a.sent();
                                        account = freshStore.accounts[existingIndex];
                                        if (!account)
                                            return [2 /*return*/];
                                        if (!account.email && identity.email)
                                            account.email = identity.email;
                                        if (!account.accountId && identity.accountId)
                                            account.accountId = identity.accountId;
                                        return [4 /*yield*/, saveOpenAIAccountStore(freshStore)];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/, undefined];
                case 5: 
                // New account: upsert with identity
                return [4 /*yield*/, (0, oauth_rotation_shared_js_1.withAuthStateLock)(function () { return __awaiter(_this, void 0, void 0, function () {
                        var freshStore, alreadyKnown;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, loadOpenAIAccountStore()];
                                case 1:
                                    freshStore = _a.sent();
                                    alreadyKnown = freshStore.accounts.some(function (account) { return account.refresh === auth.refresh || account.access === auth.access; });
                                    if (alreadyKnown)
                                        return [2 /*return*/];
                                    (0, oauth_rotation_shared_js_1.upsertAccount)(freshStore, __assign(__assign({}, auth), identity));
                                    return [4 /*yield*/, saveOpenAIAccountStore(freshStore)];
                                case 2:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
                case 6:
                    // New account: upsert with identity
                    _a.sent();
                    return [2 /*return*/, identity];
            }
        });
    });
}
// --- Rotation ---
function rotateOpenAIAccount(auth, client) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, oauth_rotation_shared_js_1.withAuthStateLock)(function () { return __awaiter(_this, void 0, void 0, function () {
                    var store, currentIndex, currentAccount, nextIndex, nextAccount, fromLabel, nextAuth;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, loadOpenAIAccountStore()];
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
                                return [4 /*yield*/, saveOpenAIAccountStore(store)];
                            case 2:
                                _a.sent();
                                nextAuth = {
                                    type: 'oauth',
                                    refresh: nextAccount.refresh,
                                    access: nextAccount.access,
                                    expires: nextAccount.expires,
                                };
                                return [4 /*yield*/, setOpenAIAuth(nextAuth, client)];
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
function removeOpenAIAccount(index) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, oauth_rotation_shared_js_1.withAuthStateLock)(function () { return __awaiter(_this, void 0, void 0, function () {
                    var store, active, nextAuth;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, loadOpenAIAccountStore()];
                            case 1:
                                store = _a.sent();
                                if (!Number.isInteger(index) || index < 0 || index >= store.accounts.length) {
                                    throw new Error("Account ".concat(index + 1, " does not exist"));
                                }
                                store.accounts.splice(index, 1);
                                if (!(store.accounts.length === 0)) return [3 /*break*/, 4];
                                store.activeIndex = 0;
                                return [4 /*yield*/, saveOpenAIAccountStore(store)];
                            case 2:
                                _a.sent();
                                return [4 /*yield*/, writeOpenAIAuthFile(undefined)];
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
                                    throw new Error('Active OpenAI account disappeared during removal');
                                active.lastUsed = Date.now();
                                return [4 /*yield*/, saveOpenAIAccountStore(store)];
                            case 5:
                                _a.sent();
                                nextAuth = {
                                    type: 'oauth',
                                    refresh: active.refresh,
                                    access: active.access,
                                    expires: active.expires,
                                };
                                return [4 /*yield*/, writeOpenAIAuthFile(nextAuth)];
                            case 6:
                                _a.sent();
                                return [2 /*return*/, { store: store, active: nextAuth }];
                        }
                    });
                }); })];
        });
    });
}
