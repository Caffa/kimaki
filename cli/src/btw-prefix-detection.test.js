"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var btw_prefix_detection_js_1 = require("./btw-prefix-detection.js");
(0, vitest_1.describe)('extractBtwPrefix', function () {
    (0, vitest_1.test)('matches lowercase prefix', function () {
        (0, vitest_1.expect)((0, btw_prefix_detection_js_1.extractBtwPrefix)('btw fix this')).toMatchInlineSnapshot("\n      {\n        \"prompt\": \"fix this\",\n      }\n    ");
    });
    (0, vitest_1.test)('matches uppercase prefix', function () {
        (0, vitest_1.expect)((0, btw_prefix_detection_js_1.extractBtwPrefix)('BTW check this')).toMatchInlineSnapshot("\n      {\n        \"prompt\": \"check this\",\n      }\n    ");
    });
    (0, vitest_1.test)('keeps multiline content', function () {
        (0, vitest_1.expect)((0, btw_prefix_detection_js_1.extractBtwPrefix)('  btw first line\nsecond line  ')).toMatchInlineSnapshot("\n      {\n        \"prompt\": \"first line\n      second line\",\n      }\n    ");
    });
    (0, vitest_1.test)('matches dot separator', function () {
        (0, vitest_1.expect)((0, btw_prefix_detection_js_1.extractBtwPrefix)('btw. fix this')).toMatchInlineSnapshot("\n      {\n        \"prompt\": \"fix this\",\n      }\n    ");
    });
    (0, vitest_1.test)('matches comma separator', function () {
        (0, vitest_1.expect)((0, btw_prefix_detection_js_1.extractBtwPrefix)('btw, fix this')).toMatchInlineSnapshot("\n      {\n        \"prompt\": \"fix this\",\n      }\n    ");
    });
    (0, vitest_1.test)('matches colon separator', function () {
        (0, vitest_1.expect)((0, btw_prefix_detection_js_1.extractBtwPrefix)('btw: fix this')).toMatchInlineSnapshot("\n      {\n        \"prompt\": \"fix this\",\n      }\n    ");
    });
    (0, vitest_1.test)('matches punctuation without trailing space', function () {
        (0, vitest_1.expect)((0, btw_prefix_detection_js_1.extractBtwPrefix)('btw.fix this')).toMatchInlineSnapshot("\n      {\n        \"prompt\": \"fix this\",\n      }\n    ");
    });
    (0, vitest_1.test)('does not match without separating whitespace', function () {
        (0, vitest_1.expect)((0, btw_prefix_detection_js_1.extractBtwPrefix)('btwfix this')).toMatchInlineSnapshot("null");
    });
    (0, vitest_1.test)('does not match mid-message', function () {
        (0, vitest_1.expect)((0, btw_prefix_detection_js_1.extractBtwPrefix)('hello btw fix this')).toMatchInlineSnapshot("null");
    });
    (0, vitest_1.test)('does not match empty payload', function () {
        (0, vitest_1.expect)((0, btw_prefix_detection_js_1.extractBtwPrefix)('btw   ')).toMatchInlineSnapshot("null");
    });
});
