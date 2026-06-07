"use strict";
// Unnest code blocks from list items for Discord.
// Discord doesn't render code blocks inside lists, so this hoists them
// to root level while preserving list structure.
Object.defineProperty(exports, "__esModule", { value: true });
exports.unnestCodeBlocksFromLists = unnestCodeBlocksFromLists;
var marked_1 = require("marked");
function unnestCodeBlocksFromLists(markdown) {
    var _a;
    var lexer = new marked_1.Lexer();
    var tokens = lexer.lex(markdown);
    var result = [];
    var _loop_1 = function (i) {
        var token = tokens[i];
        var next = tokens[i + 1];
        var chunk = (function () {
            if (token.type === 'list') {
                var segments = processListToken(token);
                return renderSegments(segments);
            }
            return token.raw;
        })();
        if (!chunk) {
            return "continue";
        }
        var nextRaw = (_a = next === null || next === void 0 ? void 0 : next.raw) !== null && _a !== void 0 ? _a : '';
        var needsNewline = nextRaw &&
            !chunk.endsWith('\n') &&
            typeof nextRaw === 'string' &&
            !nextRaw.startsWith('\n');
        result.push(needsNewline ? chunk + '\n' : chunk);
    };
    for (var i = 0; i < tokens.length; i++) {
        _loop_1(i);
    }
    return result.join('');
}
function processListToken(list) {
    var segments = [];
    var start = typeof list.start === 'number' ? list.start : parseInt(list.start, 10) || 1;
    var prefix = list.ordered ? function (i) { return "".concat(start + i, ". "); } : function () { return '- '; };
    for (var i = 0; i < list.items.length; i++) {
        var item = list.items[i];
        var itemSegments = processListItem(item, prefix(i));
        segments.push.apply(segments, itemSegments);
    }
    return segments;
}
function processListItem(item, prefix) {
    var segments = [];
    var currentText = [];
    // Track if we've seen a code block - text after code uses continuation prefix
    var seenCodeBlock = false;
    var taskMarker = item.task ? (item.checked ? '[x] ' : '[ ] ') : '';
    var wroteFirstListItem = false;
    var flushText = function () {
        var rawText = currentText.join('');
        var text = rawText.trimEnd();
        if (text.trim()) {
            // After a code block, use '-' as continuation prefix to avoid repeating numbers
            var effectivePrefix = seenCodeBlock ? '- ' : prefix;
            var marker = !wroteFirstListItem ? taskMarker : '';
            var normalizedText = normalizeListItemText({
                text: text,
                isTaskItem: item.task,
            });
            segments.push({
                type: 'list-item',
                prefix: effectivePrefix,
                content: marker + normalizedText,
            });
            wroteFirstListItem = true;
        }
        currentText = [];
    };
    for (var _i = 0, _a = item.tokens; _i < _a.length; _i++) {
        var token = _a[_i];
        if (token.type === 'code') {
            flushText();
            var codeToken = token;
            var lang = codeToken.lang || '';
            segments.push({
                type: 'code',
                content: '```' + lang + '\n' + codeToken.text + '\n```\n',
            });
            seenCodeBlock = true;
            continue;
        }
        if (token.type === 'list') {
            flushText();
            // Recursively process nested list - segments bubble up
            var nestedSegments = processListToken(token);
            segments.push.apply(segments, nestedSegments);
            continue;
        }
        currentText.push(extractText(token));
    }
    flushText();
    // If no segments were created (empty item), return empty
    if (segments.length === 0) {
        return [];
    }
    // If item had no code blocks (all segments are list-items from this level),
    // return original raw to preserve formatting
    var hasCode = segments.some(function (s) { return s.type === 'code'; });
    if (!hasCode) {
        return [{ type: 'list-item', prefix: '', content: item.raw }];
    }
    return segments;
}
function extractText(token) {
    // Prefer raw to preserve newlines and markdown markers.
    if (typeof token.raw === 'string') {
        return token.raw;
    }
    if (token.type === 'text') {
        return token.text;
    }
    return '';
}
function normalizeListItemText(_a) {
    var text = _a.text, isTaskItem = _a.isTaskItem;
    var withoutIndent = text.replace(/^\s+/, '');
    if (!isTaskItem) {
        return withoutIndent;
    }
    return withoutIndent.replace(/^\[(?: |x|X)\]\s+/, '');
}
function renderSegments(segments) {
    var result = [];
    for (var i = 0; i < segments.length; i++) {
        var segment = segments[i];
        var prev = segments[i - 1];
        if (segment.type === 'code') {
            // Add newline before code if previous was a list item
            if (prev && prev.type === 'list-item') {
                result.push('\n');
            }
            result.push(segment.content);
        }
        else {
            // list-item
            if (segment.prefix) {
                result.push(segment.prefix + segment.content + '\n');
            }
            else {
                // Raw content (no prefix means it's original raw)
                // Ensure raw ends with newline for proper separation from next segment
                var raw = segment.content.trimEnd();
                result.push(raw + '\n');
            }
        }
    }
    return result.join('').trimEnd();
}
