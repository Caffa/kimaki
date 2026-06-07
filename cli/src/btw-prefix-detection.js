"use strict";
// Detects the raw `btw ` Discord message shortcut used to fork a side-question
// thread without invoking the /btw slash command UI.
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractBtwPrefix = extractBtwPrefix;
function extractBtwPrefix(content) {
    var _a;
    if (!content) {
        return null;
    }
    // Match "btw" followed by whitespace or punctuation (. , : ; ! ?) then the prompt
    var match = content.match(/^\s*btw[.,;:!?\s]\s*([\s\S]+)$/i);
    if (!match) {
        return null;
    }
    var prompt = (_a = match[1]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!prompt) {
        return null;
    }
    return { prompt: prompt };
}
