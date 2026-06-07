"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Tests for parsePermissionRules() from opencode.ts
var vitest_1 = require("vitest");
var opencode_js_1 = require("./opencode.js");
(0, vitest_1.describe)('parsePermissionRules', function () {
    (0, vitest_1.test)('simple tool:action format', function () {
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)(['bash:deny'])).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"*\",\n          \"permission\": \"bash\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('multiple rules', function () {
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)(['bash:deny', 'edit:deny', 'read:allow'])).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"*\",\n          \"permission\": \"bash\",\n        },\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"*\",\n          \"permission\": \"edit\",\n        },\n        {\n          \"action\": \"allow\",\n          \"pattern\": \"*\",\n          \"permission\": \"read\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('tool:pattern:action format', function () {
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)(['bash:git *:allow'])).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"allow\",\n          \"pattern\": \"git *\",\n          \"permission\": \"bash\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('wildcard permission', function () {
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)(['*:deny'])).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"*\",\n          \"permission\": \"*\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('case-insensitive action', function () {
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)(['bash:DENY', 'edit:Allow'])).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"*\",\n          \"permission\": \"bash\",\n        },\n        {\n          \"action\": \"allow\",\n          \"pattern\": \"*\",\n          \"permission\": \"edit\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('trims whitespace', function () {
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)([' bash : deny '])).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"*\",\n          \"permission\": \"bash\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('skips invalid entries', function () {
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)(['', 'bash', 'bash:invalid', ':deny'])).toMatchInlineSnapshot("[]");
    });
    (0, vitest_1.test)('handles non-array input defensively', function () {
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)(undefined)).toMatchInlineSnapshot("[]");
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)(null)).toMatchInlineSnapshot("[]");
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)('bash:deny')).toMatchInlineSnapshot("[]");
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)(123)).toMatchInlineSnapshot("[]");
    });
    (0, vitest_1.test)('handles non-string array items', function () {
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)([123, null, 'bash:deny'])).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"*\",\n          \"permission\": \"bash\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('ask action', function () {
        (0, vitest_1.expect)((0, opencode_js_1.parsePermissionRules)(['webfetch:ask'])).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"ask\",\n          \"pattern\": \"*\",\n          \"permission\": \"webfetch\",\n        },\n      ]\n    ");
    });
});
