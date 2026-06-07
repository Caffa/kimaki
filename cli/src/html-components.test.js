"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var html_components_js_1 = require("./html-components.js");
(0, vitest_1.describe)('parseInlineHtmlRenderables', function () {
    (0, vitest_1.test)('parses text and button fragments', function () {
        var result = (0, html_components_js_1.parseInlineHtmlRenderables)({
            html: 'Before <button id="delete-a" variant="danger">Delete</button> after',
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"text\": \"Before \",\n          \"type\": \"text\",\n        },\n        {\n          \"disabled\": false,\n          \"id\": \"delete-a\",\n          \"label\": \"Delete\",\n          \"type\": \"button\",\n          \"variant\": \"danger\",\n        },\n        {\n          \"text\": \" after\",\n          \"type\": \"text\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('rejects buttons without id', function () {
        var result = (0, html_components_js_1.parseInlineHtmlRenderables)({
            html: '<button>Delete</button>',
        });
        (0, vitest_1.expect)(result instanceof Error ? result.message : result).toBe('<button> is missing required id attribute');
    });
});
