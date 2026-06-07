"use strict";
// Session search helpers for kimaki CLI commands.
// Parses string/regex queries and builds readable snippets from matched content.
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSessionSearchPattern = parseSessionSearchPattern;
exports.findFirstSessionSearchHit = findFirstSessionSearchHit;
exports.buildSessionSearchSnippet = buildSessionSearchSnippet;
exports.getPartSearchTexts = getPartSearchTexts;
function parseSessionSearchPattern(query) {
    var trimmedQuery = query.trim();
    if (!trimmedQuery) {
        return new Error('Search query cannot be empty');
    }
    var regexMatch = trimmedQuery.match(/^\/([\s\S]+)\/([a-z]*)$/);
    if (!regexMatch) {
        return {
            mode: 'literal',
            raw: trimmedQuery,
            normalizedNeedle: trimmedQuery.toLowerCase(),
        };
    }
    var pattern = regexMatch[1] || '';
    var flags = regexMatch[2] || '';
    try {
        return {
            mode: 'regex',
            raw: trimmedQuery,
            regex: new RegExp(pattern, flags),
        };
    }
    catch (error) {
        return new Error("Invalid regex query \"".concat(trimmedQuery, "\": ").concat(error instanceof Error ? error.message : String(error)));
    }
}
function findFirstSessionSearchHit(_a) {
    var _b;
    var text = _a.text, searchPattern = _a.searchPattern;
    if (searchPattern.mode === 'literal') {
        var index = text.toLowerCase().indexOf(searchPattern.normalizedNeedle);
        if (index < 0) {
            return undefined;
        }
        return {
            index: index,
            length: searchPattern.raw.length,
        };
    }
    searchPattern.regex.lastIndex = 0;
    var match = searchPattern.regex.exec(text);
    if (!match || match.index < 0) {
        return undefined;
    }
    return {
        index: match.index,
        length: Math.max(((_b = match[0]) === null || _b === void 0 ? void 0 : _b.length) || 0, 1),
    };
}
function buildSessionSearchSnippet(_a) {
    var text = _a.text, hit = _a.hit, _b = _a.contextLength, contextLength = _b === void 0 ? 90 : _b;
    var start = Math.max(0, hit.index - contextLength);
    var end = Math.min(text.length, hit.index + hit.length + contextLength);
    var prefix = start > 0 ? '...' : '';
    var suffix = end < text.length ? '...' : '';
    var body = text
        .slice(start, end)
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return "".concat(prefix).concat(body).concat(suffix);
}
function stringifyUnknown(value) {
    if (value === undefined || value === null) {
        return '';
    }
    if (typeof value === 'string') {
        return value;
    }
    try {
        return JSON.stringify(value);
    }
    catch (_a) {
        return String(value);
    }
}
function getPartSearchTexts(part) {
    switch (part.type) {
        case 'text':
            return part.text ? [part.text] : [];
        case 'reasoning':
            return part.text ? [part.text] : [];
        case 'tool': {
            var inputText = stringifyUnknown(part.state.input);
            var outputText = part.state.status === 'completed'
                ? stringifyUnknown(part.state.output)
                : part.state.status === 'error'
                    ? part.state.error || ''
                    : '';
            return ["tool:".concat(part.tool), inputText, outputText].filter(function (entry) {
                return entry.trim().length > 0;
            });
        }
        case 'file':
            return [part.filename || '', part.url || ''].filter(function (entry) {
                return entry.trim().length > 0;
            });
        default:
            return [];
    }
}
