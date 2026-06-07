"use strict";
// Utility to condense MEMORY.md into a line-numbered table of contents.
// Separated from kimaki-opencode-plugin.ts because OpenCode's plugin loader calls
// every exported function in the module as a plugin initializer — exporting
// this utility from the plugin entry file caused it to be invoked with a
// PluginInput object instead of a string, crashing inside marked's Lexer.
Object.defineProperty(exports, "__esModule", { value: true });
exports.condenseMemoryMd = condenseMemoryMd;
var marked_1 = require("marked");
/**
 * Condense MEMORY.md into a line-numbered table of contents.
 * Parses markdown AST with marked's Lexer, emits each heading prefixed by
 * its source line number, and collapses non-heading content to `...`.
 * The agent can then use Read with offset/limit to read specific sections.
 */
function condenseMemoryMd(content) {
    var tokens = new marked_1.Lexer().lex(content);
    var lines = [];
    var charOffset = 0;
    var lastWasEllipsis = false;
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        // Compute 1-based line number from character offset
        var lineNumber = content.slice(0, charOffset).split('\n').length;
        if (token.type === 'heading') {
            var prefix = '#'.repeat(token.depth);
            lines.push("".concat(lineNumber, ": ").concat(prefix, " ").concat(token.text));
            lastWasEllipsis = false;
        }
        else if (!lastWasEllipsis) {
            lines.push('...');
            lastWasEllipsis = true;
        }
        charOffset += token.raw.length;
    }
    return lines.join('\n');
}
