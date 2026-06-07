"use strict";
// Limit heading depth for Discord.
// Discord only supports headings up to ### (h3), so this converts
// ####, #####, etc. to ### to maintain consistent rendering.
Object.defineProperty(exports, "__esModule", { value: true });
exports.limitHeadingDepth = limitHeadingDepth;
var marked_1 = require("marked");
function limitHeadingDepth(markdown, maxDepth) {
    if (maxDepth === void 0) { maxDepth = 3; }
    var lexer = new marked_1.Lexer();
    var tokens = lexer.lex(markdown);
    var result = '';
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (token.type === 'heading') {
            var heading = token;
            if (heading.depth > maxDepth) {
                var hashes = '#'.repeat(maxDepth);
                result += hashes + ' ' + heading.text + '\n';
            }
            else {
                result += token.raw;
            }
        }
        else {
            result += token.raw;
        }
    }
    return result;
}
