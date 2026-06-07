"use strict";
// Helpers for extracting and normalizing Anthropic OAuth account identity.
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeAnthropicAccountIdentity = normalizeAnthropicAccountIdentity;
exports.extractAnthropicAccountIdentity = extractAnthropicAccountIdentity;
var identityHintKeys = new Set(['user', 'profile', 'account', 'viewer']);
var idKeys = ['user_id', 'userId', 'account_id', 'accountId', 'id', 'sub'];
function normalizeAnthropicAccountIdentity(identity) {
    var email = typeof (identity === null || identity === void 0 ? void 0 : identity.email) === 'string' && identity.email.trim()
        ? identity.email.trim().toLowerCase()
        : undefined;
    var accountId = typeof (identity === null || identity === void 0 ? void 0 : identity.accountId) === 'string' && identity.accountId.trim()
        ? identity.accountId.trim()
        : undefined;
    if (!email && !accountId)
        return undefined;
    return __assign(__assign({}, (email ? { email: email } : {})), (accountId ? { accountId: accountId } : {}));
}
function getCandidateFromRecord(record, path) {
    var email = typeof record.email === 'string' ? record.email : undefined;
    var accountId = idKeys
        .map(function (key) {
        var value = record[key];
        return typeof value === 'string' ? value : undefined;
    })
        .find(function (value) {
        return Boolean(value);
    });
    var normalized = normalizeAnthropicAccountIdentity({ email: email, accountId: accountId });
    if (!normalized)
        return undefined;
    var hasIdentityHint = path.some(function (segment) {
        return identityHintKeys.has(segment);
    });
    return __assign(__assign({}, normalized), { score: (normalized.email ? 4 : 0) + (normalized.accountId ? 2 : 0) + (hasIdentityHint ? 2 : 0) });
}
function collectIdentityCandidates(value, path) {
    if (path === void 0) { path = []; }
    if (!value || typeof value !== 'object')
        return [];
    if (Array.isArray(value)) {
        return value.flatMap(function (entry) {
            return collectIdentityCandidates(entry, path);
        });
    }
    var record = value;
    var nested = Object.entries(record).flatMap(function (_a) {
        var key = _a[0], entry = _a[1];
        return collectIdentityCandidates(entry, __spreadArray(__spreadArray([], path, true), [key], false));
    });
    var current = getCandidateFromRecord(record, path);
    return current ? __spreadArray([current], nested, true) : nested;
}
function extractAnthropicAccountIdentity(value) {
    var candidates = collectIdentityCandidates(value);
    var best = candidates.sort(function (a, b) {
        return b.score - a.score;
    })[0];
    if (!best)
        return undefined;
    return normalizeAnthropicAccountIdentity(best);
}
