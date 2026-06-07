"use strict";
// Tests for session search query parsing and snippet matching helpers.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var session_search_js_1 = require("./session-search.js");
(0, vitest_1.describe)('session search helpers', function () {
    (0, vitest_1.test)('returns error for invalid regex query', function () {
        var parsed = (0, session_search_js_1.parseSessionSearchPattern)('/(unclosed/');
        (0, vitest_1.expect)(parsed).toBeInstanceOf(Error);
    });
    (0, vitest_1.test)('returns snippets that include the matched substring', function () {
        var cases = [
            {
                query: 'panic',
                text: 'There was a PANIC in production',
                expectedSubstring: 'PANIC',
            },
            {
                query: '/error\\s+42/i',
                text: 'Request failed with ERROR 42 in worker',
                expectedSubstring: 'ERROR 42',
            },
        ];
        cases.forEach(function (_a) {
            var query = _a.query, text = _a.text, expectedSubstring = _a.expectedSubstring;
            var parsed = (0, session_search_js_1.parseSessionSearchPattern)(query);
            if (parsed instanceof Error) {
                throw parsed;
            }
            var hit = (0, session_search_js_1.findFirstSessionSearchHit)({ text: text, searchPattern: parsed });
            (0, vitest_1.expect)(hit).toBeDefined();
            if (!hit) {
                return;
            }
            var snippet = (0, session_search_js_1.buildSessionSearchSnippet)({
                text: text,
                hit: hit,
                contextLength: 8,
            });
            (0, vitest_1.expect)(snippet.toUpperCase()).toContain(expectedSubstring.toUpperCase());
        });
    });
});
