"use strict";
/**
 * Shared utilities for multi-provider OAuth account rotation.
 * Used by both anthropic-auth-state.ts and openai-auth-state.ts to avoid
 * duplicating file locking, store I/O, account labeling, and rotation logic.
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
exports.readJson = readJson;
exports.writeJson = writeJson;
exports.authFilePath = authFilePath;
exports.withAuthStateLock = withAuthStateLock;
exports.normalizeAccountStore = normalizeAccountStore;
exports.accountLabel = accountLabel;
exports.findCurrentAccountIndex = findCurrentAccountIndex;
exports.upsertAccount = upsertAccount;
exports.shouldRotateAuth = shouldRotateAuth;
exports.isRateLimitRetryMessage = isRateLimitRetryMessage;
exports.isTokenRefreshError = isTokenRefreshError;
exports.isOAuthStored = isOAuthStored;
var fs = require("node:fs/promises");
var node_os_1 = require("node:os");
var node_path_1 = require("node:path");
var AUTH_LOCK_STALE_MS = 30000;
var AUTH_LOCK_RETRY_MS = 100;
// --- File I/O ---
function readJson(filePath, fallback) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    _b = (_a = JSON).parse;
                    return [4 /*yield*/, fs.readFile(filePath, 'utf8')];
                case 1: return [2 /*return*/, _b.apply(_a, [_d.sent()])];
                case 2:
                    _c = _d.sent();
                    return [2 /*return*/, fallback];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function writeJson(filePath, value) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.mkdir(node_path_1.default.dirname(filePath), { recursive: true })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, fs.chmod(filePath, 384)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// --- Auth file path ---
function authFilePath() {
    if (process.env.XDG_DATA_HOME) {
        return node_path_1.default.join(process.env.XDG_DATA_HOME, 'opencode', 'auth.json');
    }
    return node_path_1.default.join((0, node_os_1.homedir)(), '.local', 'share', 'opencode', 'auth.json');
}
// --- File-based locking ---
function getErrorCode(error) {
    if (!(error instanceof Error))
        return undefined;
    return error.code;
}
function sleep(ms) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) {
                        setTimeout(resolve, ms);
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function withAuthStateLock(fn) {
    return __awaiter(this, void 0, void 0, function () {
        var file, lockDir, deadline, error_1, code, stats;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    file = authFilePath();
                    lockDir = "".concat(file, ".lock");
                    deadline = Date.now() + AUTH_LOCK_STALE_MS;
                    return [4 /*yield*/, fs.mkdir(node_path_1.default.dirname(file), { recursive: true })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (!true) return [3 /*break*/, 11];
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 10]);
                    return [4 /*yield*/, fs.mkdir(lockDir)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 5:
                    error_1 = _a.sent();
                    code = getErrorCode(error_1);
                    if (code !== 'EEXIST') {
                        throw error_1;
                    }
                    return [4 /*yield*/, fs.stat(lockDir).catch(function () {
                            return null;
                        })];
                case 6:
                    stats = _a.sent();
                    if (!(stats && Date.now() - stats.mtimeMs > AUTH_LOCK_STALE_MS)) return [3 /*break*/, 8];
                    return [4 /*yield*/, fs.rm(lockDir, { force: true, recursive: true }).catch(function () { })];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 2];
                case 8:
                    if (Date.now() >= deadline) {
                        throw new Error("Timed out waiting for auth lock: ".concat(lockDir));
                    }
                    return [4 /*yield*/, sleep(AUTH_LOCK_RETRY_MS)];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 10: return [3 /*break*/, 2];
                case 11:
                    _a.trys.push([11, , 13, 15]);
                    return [4 /*yield*/, fn()];
                case 12: return [2 /*return*/, _a.sent()];
                case 13: return [4 /*yield*/, fs.rm(lockDir, { force: true, recursive: true }).catch(function () { })];
                case 14:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 15: return [2 /*return*/];
            }
        });
    });
}
// --- Account store normalization ---
function normalizeAccountStore(input) {
    var accounts = Array.isArray(input === null || input === void 0 ? void 0 : input.accounts)
        ? input.accounts.filter(function (account) {
            return !!account &&
                account.type === 'oauth' &&
                typeof account.refresh === 'string' &&
                typeof account.access === 'string' &&
                typeof account.expires === 'number' &&
                (typeof account.email === 'undefined' || typeof account.email === 'string') &&
                (typeof account.accountId === 'undefined' || typeof account.accountId === 'string') &&
                typeof account.addedAt === 'number' &&
                typeof account.lastUsed === 'number';
        })
        : [];
    var rawIndex = typeof (input === null || input === void 0 ? void 0 : input.activeIndex) === 'number' ? Math.floor(input.activeIndex) : 0;
    var activeIndex = accounts.length === 0 ? 0 : ((rawIndex % accounts.length) + accounts.length) % accounts.length;
    return { version: 1, activeIndex: activeIndex, accounts: accounts };
}
// --- Account labeling ---
function accountLabel(account, index) {
    var identity = account.email || account.accountId;
    var r = account.refresh;
    var short = r.length > 12 ? "".concat(r.slice(0, 8), "...").concat(r.slice(-4)) : r;
    if (identity) {
        return index !== undefined ? "#".concat(index + 1, " (").concat(identity, ")") : identity;
    }
    return index !== undefined ? "#".concat(index + 1, " (").concat(short, ")") : short;
}
// --- Account matching ---
function findCurrentAccountIndex(store, auth) {
    if (!store.accounts.length)
        return 0;
    var byRefresh = store.accounts.findIndex(function (account) {
        return account.refresh === auth.refresh;
    });
    if (byRefresh >= 0)
        return byRefresh;
    var byAccess = store.accounts.findIndex(function (account) {
        return account.access === auth.access;
    });
    if (byAccess >= 0)
        return byAccess;
    return store.activeIndex;
}
function upsertAccount(store, auth, now) {
    if (now === void 0) { now = Date.now(); }
    var identity = normalizeIdentity({
        email: auth.email,
        accountId: auth.accountId,
    });
    var index = store.accounts.findIndex(function (account) {
        if (account.refresh === auth.refresh || account.access === auth.access) {
            return true;
        }
        if ((identity === null || identity === void 0 ? void 0 : identity.accountId) && account.accountId === identity.accountId) {
            return true;
        }
        if ((identity === null || identity === void 0 ? void 0 : identity.email) && account.email === identity.email) {
            return true;
        }
        return false;
    });
    var nextAccount = __assign(__assign({ type: 'oauth', refresh: auth.refresh, access: auth.access, expires: auth.expires }, identity), { addedAt: now, lastUsed: now });
    if (index < 0) {
        store.accounts.push(nextAccount);
        store.activeIndex = store.accounts.length - 1;
        return store.activeIndex;
    }
    var existing = store.accounts[index];
    if (!existing)
        return index;
    store.accounts[index] = __assign(__assign(__assign({}, existing), nextAccount), { addedAt: existing.addedAt, email: nextAccount.email || existing.email, accountId: nextAccount.accountId || existing.accountId });
    store.activeIndex = index;
    return index;
}
function normalizeIdentity(identity) {
    var _a, _b;
    if (!identity)
        return undefined;
    var email = ((_a = identity.email) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) || undefined;
    var accountId = ((_b = identity.accountId) === null || _b === void 0 ? void 0 : _b.trim()) || undefined;
    if (!email && !accountId)
        return undefined;
    return { email: email, accountId: accountId };
}
// --- Rate limit detection ---
function shouldRotateAuth(status, bodyText) {
    var haystack = bodyText.toLowerCase();
    if (status === 429)
        return true;
    if (status === 401 || status === 403)
        return true;
    return (haystack.includes('rate_limit') ||
        haystack.includes('rate limit') ||
        haystack.includes('usage limit') ||
        haystack.includes('usage_limit') ||
        haystack.includes('usage_limit_reached') ||
        haystack.includes('usage_not_included') ||
        haystack.includes('invalid api key') ||
        haystack.includes('authentication_error') ||
        haystack.includes('permission_error'));
}
function isRateLimitRetryMessage(message) {
    var haystack = message.toLowerCase();
    return (haystack.includes('429') ||
        haystack.includes('usage limit') ||
        haystack.includes('rate limit') ||
        haystack.includes('rate_limit') ||
        haystack.includes('usage_limit_reached') ||
        haystack.includes('usage_not_included'));
}
function isTokenRefreshError(message) {
    var haystack = message.toLowerCase();
    return (haystack.includes('token refresh failed') ||
        haystack.includes('refresh_token') ||
        (haystack.includes('401') && haystack.includes('refresh')));
}
// --- Auth file helpers ---
function isOAuthStored(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    var record = value;
    return (record.type === 'oauth' &&
        typeof record.refresh === 'string' &&
        typeof record.access === 'string' &&
        typeof record.expires === 'number');
}
