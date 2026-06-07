"use strict";
// Sensitive data redaction helpers for logs and telemetry payloads.
// Redacts common secrets, identifiers, emails, and can optionally redact paths.
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
exports.sanitizeSensitiveText = sanitizeSensitiveText;
exports.sanitizeUnknownValue = sanitizeUnknownValue;
var CORE_SENSITIVE_REPLACEMENTS = [
    {
        pattern: /\bBearer\s+[A-Za-z0-9._-]{10,}\b/gi,
        replacement: 'Bearer [REDACTED]',
    },
    {
        pattern: /\bsk-[A-Za-z0-9]{16,}\b/g,
        replacement: '[REDACTED_OPENAI_KEY]',
    },
    {
        pattern: /\bAIza[0-9A-Za-z_-]{20,}\b/g,
        replacement: '[REDACTED_GOOGLE_KEY]',
    },
    {
        pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g,
        replacement: '[REDACTED_GITHUB_TOKEN]',
    },
    {
        pattern: /([?&](?:token|api[_-]?key|key|secret|password|authorization)=)[^&\s]+/gi,
        replacement: '$1[REDACTED]',
    },
    {
        pattern: /(\b(?:token|api[_-]?key|secret|password|authorization)\b\s*[:=]\s*")([^"]+)(")/gi,
        replacement: '$1[REDACTED]$3',
    },
    {
        pattern: /(\b(?:token|api[_-]?key|secret|password|authorization)\b\s*[:=]\s*)([^\s,;]+)/gi,
        replacement: '$1[REDACTED]',
    },
];
var PATH_REPLACEMENTS = [
    {
        pattern: /\/(?:Users|home)\/[^/\s]+\/[^\s'"`)]*/g,
        replacement: '[REDACTED_PATH]',
    },
    {
        pattern: /[A-Za-z]:\\[^\s'"`)]*/g,
        replacement: '[REDACTED_PATH]',
    },
];
function sanitizeSensitiveText(value, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.redactPaths, redactPaths = _c === void 0 ? false : _c;
    var replacements = redactPaths
        ? __spreadArray(__spreadArray([], CORE_SENSITIVE_REPLACEMENTS, true), PATH_REPLACEMENTS, true) : CORE_SENSITIVE_REPLACEMENTS;
    return replacements.reduce(function (current, entry) {
        return current.replace(entry.pattern, entry.replacement);
    }, value);
}
function sanitizeUnknownValue(value, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.depth, depth = _c === void 0 ? 0 : _c, _d = _b.seen, seen = _d === void 0 ? new WeakSet() : _d, _e = _b.redactPaths, redactPaths = _e === void 0 ? false : _e;
    if (depth > 8) {
        return '[REDACTED_DEPTH_LIMIT]';
    }
    if (typeof value === 'string') {
        return sanitizeSensitiveText(value, { redactPaths: redactPaths });
    }
    if (typeof value === 'number' ||
        typeof value === 'boolean' ||
        value === null ||
        value === undefined) {
        return value;
    }
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (value instanceof Error) {
        var sanitizedStack = value.stack
            ? sanitizeSensitiveText(value.stack, { redactPaths: redactPaths })
            : undefined;
        return {
            name: value.name,
            message: sanitizeSensitiveText(value.message, { redactPaths: redactPaths }),
            stack: sanitizedStack,
            cause: sanitizeUnknownValue(value.cause, {
                depth: depth + 1,
                seen: seen,
                redactPaths: redactPaths,
            }),
        };
    }
    if (Array.isArray(value)) {
        return value.map(function (item) {
            return sanitizeUnknownValue(item, { depth: depth + 1, seen: seen, redactPaths: redactPaths });
        });
    }
    if (typeof value === 'object') {
        if (seen.has(value)) {
            return '[REDACTED_CIRCULAR]';
        }
        seen.add(value);
        var sanitizedEntries = Object.entries(value).map(function (_a) {
            var key = _a[0], entryValue = _a[1];
            return [
                key,
                sanitizeUnknownValue(entryValue, {
                    depth: depth + 1,
                    seen: seen,
                    redactPaths: redactPaths,
                }),
            ];
        });
        return Object.fromEntries(sanitizedEntries);
    }
    return sanitizeSensitiveText(String(value), { redactPaths: redactPaths });
}
