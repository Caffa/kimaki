"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var format_tables_js_1 = require("./format-tables.js");
var marked_1 = require("marked");
var discord_js_1 = require("discord.js");
function isTableToken(token) {
    return (token.type === 'table' &&
        Object.hasOwn(token, 'header') &&
        Object.hasOwn(token, 'rows'));
}
function parseTable(markdown) {
    var lexer = new marked_1.Lexer();
    var tokens = lexer.lex(markdown);
    var table = tokens.find(function (token) {
        return isTableToken(token);
    });
    if (!table || !isTableToken(table)) {
        throw new Error('Expected markdown to contain a table token');
    }
    return table;
}
/** Extract the first container's children from buildTableComponents result */
function getContainerChildren(segments) {
    var seg = segments[0];
    if (seg.type !== 'components') {
        throw new Error('Expected components segment');
    }
    var container = seg.components[0];
    if (!container || container.type !== discord_js_1.ComponentType.Container) {
        throw new Error('Expected first top-level component to be a container');
    }
    return container.components.map(function (component) {
        var content = component.type === discord_js_1.ComponentType.TextDisplay ? component.content : undefined;
        var divider = component.type === discord_js_1.ComponentType.Separator ? component.divider : undefined;
        var spacing = component.type === discord_js_1.ComponentType.Separator ? component.spacing : undefined;
        return {
            type: component.type,
            content: content,
            divider: divider,
            spacing: spacing,
        };
    });
}
(0, vitest_1.describe)('buildTableComponents', function () {
    (0, vitest_1.test)('builds container with key-value TextDisplays', function () {
        var table = parseTable("| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |");
        var result = (0, format_tables_js_1.buildTableComponents)(table);
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"components\": [\n            {\n              \"components\": [\n                {\n                  \"content\": \"**Name** Alice\n      **Age** 30\",\n                  \"type\": 10,\n                },\n                {\n                  \"divider\": true,\n                  \"spacing\": 1,\n                  \"type\": 14,\n                },\n                {\n                  \"content\": \"**Name** Bob\n      **Age** 25\",\n                  \"type\": 10,\n                },\n              ],\n              \"type\": 17,\n            },\n          ],\n          \"type\": \"components\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('adds separators between row groups', function () {
        var table = parseTable("| Key | Value |\n| --- | --- |\n| a | 1 |\n| b | 2 |\n| c | 3 |");
        var result = (0, format_tables_js_1.buildTableComponents)(table);
        var types = getContainerChildren(result).map(function (c) { return c.type; });
        // type 10 = TextDisplay, type 14 = Separator
        (0, vitest_1.expect)(types).toMatchInlineSnapshot("\n      [\n        10,\n        14,\n        10,\n        14,\n        10,\n      ]\n    ");
    });
    (0, vitest_1.test)('single-row table has one TextDisplay, no separators', function () {
        var table = parseTable("| Method | Endpoint |\n| --- | --- |\n| GET | /api/users |");
        var result = (0, format_tables_js_1.buildTableComponents)(table);
        var children = getContainerChildren(result);
        (0, vitest_1.expect)(children).toHaveLength(1);
        (0, vitest_1.expect)(children[0].type).toBe(10);
        (0, vitest_1.expect)(children[0].content).toMatchInlineSnapshot("\n      \"**Method** GET\n      **Endpoint** /api/users\"\n    ");
    });
    (0, vitest_1.test)('splits large table into multiple container segments', function () {
        // 25 rows: exceeds 19 rows per container, so splits into 2 containers
        var headers = '| A | B |';
        var sep = '| --- | --- |';
        var rows = Array.from({ length: 25 }, function (_, i) {
            return "| ".concat(i, "a | ").concat(i, "b |");
        }).join('\n');
        var table = parseTable("".concat(headers, "\n").concat(sep, "\n").concat(rows));
        var result = (0, format_tables_js_1.buildTableComponents)(table);
        (0, vitest_1.expect)(result).toHaveLength(2);
        (0, vitest_1.expect)(result[0].type).toBe('components');
        (0, vitest_1.expect)(result[1].type).toBe('components');
        // First container has 20 rows (20 TDs + 19 seps = 39 children)
        var firstChildren = getContainerChildren([result[0]]);
        (0, vitest_1.expect)(firstChildren).toHaveLength(20 + 19);
        // Second container has 5 rows (5 TDs + 4 seps = 9 children)
        var secondChildren = getContainerChildren([result[1]]);
        (0, vitest_1.expect)(secondChildren).toHaveLength(5 + 4);
    });
    (0, vitest_1.test)('strips formatting from cells', function () {
        var table = parseTable("| Header | Value |\n| --- | --- |\n| **Bold text** | Normal |\n| *Italic* | `code` |");
        var result = (0, format_tables_js_1.buildTableComponents)(table);
        var children = getContainerChildren(result);
        (0, vitest_1.expect)(children[0].content).toMatchInlineSnapshot("\n      \"**Header** Bold text\n      **Value** Normal\"\n    ");
    });
    (0, vitest_1.test)('renders button cells as action rows inside the container', function () {
        var table = parseTable("| Name | Action |\n| --- | --- |\n| feature-a | <button id=\"delete-a\" variant=\"secondary\">Delete</button> |");
        var result = (0, format_tables_js_1.buildTableComponents)(table, {
            resolveButtonCustomId: function (_a) {
                var button = _a.button;
                return "html_action:".concat(button.id);
            },
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"components\": [\n            {\n              \"components\": [\n                {\n                  \"content\": \"**Name** feature-a\",\n                  \"type\": 10,\n                },\n                {\n                  \"components\": [\n                    {\n                      \"custom_id\": \"html_action:delete-a\",\n                      \"disabled\": false,\n                      \"label\": \"Delete\",\n                      \"style\": 2,\n                      \"type\": 2,\n                    },\n                  ],\n                  \"type\": 1,\n                },\n              ],\n              \"type\": 17,\n            },\n          ],\n          \"type\": \"components\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('falls back to button text when no resolver is provided', function () {
        var table = parseTable("| Name | Action |\n| --- | --- |\n| feature-a | <button id=\"delete-a\" variant=\"secondary\">Delete</button> |");
        var result = (0, format_tables_js_1.buildTableComponents)(table);
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"components\": [\n            {\n              \"components\": [\n                {\n                  \"content\": \"**Name** feature-a\n      **Action** Delete\",\n                  \"type\": 10,\n                },\n              ],\n              \"type\": 17,\n            },\n          ],\n          \"type\": \"components\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('renders wide rows with buttons without using sections', function () {
        var table = parseTable("| Thread | Name | Status | Created | Folder | Action |\n| --- | --- | --- | --- | --- | --- |\n| thread | feature-a | merged | 1m ago | /tmp/feature-a | <button id=\"delete-a\" variant=\"secondary\">Delete</button> |");
        var result = (0, format_tables_js_1.buildTableComponents)(table, {
            resolveButtonCustomId: function (_a) {
                var button = _a.button;
                return "html_action:".concat(button.id);
            },
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"components\": [\n            {\n              \"components\": [\n                {\n                  \"content\": \"**Thread** thread\n      **Name** feature-a\n      **Status** merged\n      **Created** 1m ago\n      **Folder** /tmp/feature-a\",\n                  \"type\": 10,\n                },\n                {\n                  \"components\": [\n                    {\n                      \"custom_id\": \"html_action:delete-a\",\n                      \"disabled\": false,\n                      \"label\": \"Delete\",\n                      \"style\": 2,\n                      \"type\": 2,\n                    },\n                  ],\n                  \"type\": 1,\n                },\n              ],\n              \"type\": 17,\n            },\n          ],\n          \"type\": \"components\",\n        },\n      ]\n    ");
    });
});
(0, vitest_1.describe)('splitTablesFromMarkdown', function () {
    (0, vitest_1.test)('returns single text segment for content without tables', function () {
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)('Just some text.\n\nMore text.');
        (0, vitest_1.expect)(result).toHaveLength(1);
        (0, vitest_1.expect)(result[0].type).toBe('text');
    });
    (0, vitest_1.test)('returns single components segment for table-only content', function () {
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)("| A | B |\n| --- | --- |\n| 1 | 2 |");
        (0, vitest_1.expect)(result).toHaveLength(1);
        (0, vitest_1.expect)(result[0].type).toBe('components');
    });
    (0, vitest_1.test)('splits text before and after table into separate segments', function () {
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)("Text before.\n\n| Key | Value |\n| --- | --- |\n| a | 1 |\n\nText after.");
        (0, vitest_1.expect)(result).toHaveLength(3);
        (0, vitest_1.expect)(result[0].type).toBe('text');
        (0, vitest_1.expect)(result[1].type).toBe('components');
        (0, vitest_1.expect)(result[2].type).toBe('text');
    });
    (0, vitest_1.test)('handles multiple tables with text between', function () {
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)("First table:\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\nMiddle text.\n\n| X | Y |\n| --- | --- |\n| a | b |");
        (0, vitest_1.expect)(result).toHaveLength(4);
        (0, vitest_1.expect)(result.map(function (s) { return s.type; })).toMatchInlineSnapshot("\n      [\n        \"text\",\n        \"components\",\n        \"text\",\n        \"components\",\n      ]\n    ");
    });
    (0, vitest_1.test)('splits oversized table into multiple component segments', function () {
        var headers = '| A | B |';
        var sep = '| --- | --- |';
        var rows = Array.from({ length: 25 }, function (_, i) {
            return "| ".concat(i, "a | ").concat(i, "b |");
        }).join('\n');
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)("".concat(headers, "\n").concat(sep, "\n").concat(rows));
        // 25 rows splits into 2 container segments
        (0, vitest_1.expect)(result).toHaveLength(2);
        (0, vitest_1.expect)(result.every(function (s) { return s.type === 'components'; })).toBe(true);
    });
    (0, vitest_1.test)('preserves code blocks alongside tables', function () {
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)("Some code:\n\n```js\nconst x = 1\n```\n\n| Key | Value |\n| --- | --- |\n| a | 1 |\n\nDone.");
        var types = result.map(function (s) { return s.type; });
        (0, vitest_1.expect)(types).toMatchInlineSnapshot("\n      [\n        \"text\",\n        \"components\",\n        \"text\",\n      ]\n    ");
    });
    (0, vitest_1.test)('renders callout text inside an accented container', function () {
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)("<callout accent=\"#2b7fff\">\n## Important\n\nRead this first.\n</callout>");
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"components\": [\n            {\n              \"accent_color\": 2850815,\n              \"components\": [\n                {\n                  \"content\": \"## Important\n\n      Read this first.\",\n                  \"type\": 10,\n                },\n              ],\n              \"type\": 17,\n            },\n          ],\n          \"type\": \"components\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('renders tables inside callouts recursively', function () {
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)("<callout accent=\"#2b7fff\">\n## Important\n\n| Key | Value |\n| --- | --- |\n| a | 1 |\n</callout>");
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"components\": [\n            {\n              \"accent_color\": 2850815,\n              \"components\": [\n                {\n                  \"content\": \"## Important\",\n                  \"type\": 10,\n                },\n                {\n                  \"content\": \"**Key** a\n      **Value** 1\",\n                  \"type\": 10,\n                },\n              ],\n              \"type\": 17,\n            },\n          ],\n          \"type\": \"components\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('renders button rows inside callouts recursively', function () {
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)("<callout accent=\"#2b7fff\">\n## Actions\n\n| Name | Action |\n| --- | --- |\n| feature-a | <button id=\"delete-a\" variant=\"secondary\">Delete</button> |\n</callout>", {
            resolveButtonCustomId: function (_a) {
                var button = _a.button;
                return "html_action:".concat(button.id);
            },
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"components\": [\n            {\n              \"accent_color\": 2850815,\n              \"components\": [\n                {\n                  \"content\": \"## Actions\",\n                  \"type\": 10,\n                },\n                {\n                  \"content\": \"**Name** feature-a\",\n                  \"type\": 10,\n                },\n                {\n                  \"components\": [\n                    {\n                      \"custom_id\": \"html_action:delete-a\",\n                      \"disabled\": false,\n                      \"label\": \"Delete\",\n                      \"style\": 2,\n                      \"type\": 2,\n                    },\n                  ],\n                  \"type\": 1,\n                },\n              ],\n              \"type\": 17,\n            },\n          ],\n          \"type\": \"components\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('renders callout that was prefixed with ⬥ as plain text (regression)', function () {
        // Before the fix, formatPart would add ⬥ prefix to callout lines,
        // breaking the callout parser. Now formatPart skips the prefix for callouts.
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)("\u2B25 <callout accent=\"#ef4444\">\n## Top priority\n- **Stripe dispute** deadline\n</callout>");
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"text\": \"\u2B25 <callout accent=\"#ef4444\">\n      ## Top priority\n      - **Stripe dispute** deadline\n      </callout>\",\n          \"type\": \"text\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('falls back to plain text when a callout is not closed', function () {
        var result = (0, format_tables_js_1.splitTablesFromMarkdown)("<callout accent=\"#2b7fff\">\n## Important\n\nStill open");
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"text\": \"<callout accent=\"#2b7fff\">\n      ## Important\n\n      Still open\",\n          \"type\": \"text\",\n        },\n      ]\n    ");
    });
});
