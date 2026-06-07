"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var skill_filter_js_1 = require("./skill-filter.js");
(0, vitest_1.describe)('computeSkillPermission', function () {
    (0, vitest_1.test)('empty inputs returns undefined (no filtering)', function () {
        (0, vitest_1.expect)((0, skill_filter_js_1.computeSkillPermission)({ enabledSkills: [], disabledSkills: [] })).toMatchInlineSnapshot("undefined");
    });
    (0, vitest_1.test)('whitelist single skill', function () {
        (0, vitest_1.expect)((0, skill_filter_js_1.computeSkillPermission)({
            enabledSkills: ['npm-package'],
            disabledSkills: [],
        })).toMatchInlineSnapshot("\n      {\n        \"*\": \"deny\",\n        \"npm-package\": \"allow\",\n      }\n    ");
    });
    (0, vitest_1.test)('whitelist multiple skills', function () {
        (0, vitest_1.expect)((0, skill_filter_js_1.computeSkillPermission)({
            enabledSkills: ['npm-package', 'playwriter', 'errore'],
            disabledSkills: [],
        })).toMatchInlineSnapshot("\n      {\n        \"*\": \"deny\",\n        \"errore\": \"allow\",\n        \"npm-package\": \"allow\",\n        \"playwriter\": \"allow\",\n      }\n    ");
    });
    (0, vitest_1.test)('blacklist single skill', function () {
        (0, vitest_1.expect)((0, skill_filter_js_1.computeSkillPermission)({
            enabledSkills: [],
            disabledSkills: ['jitter'],
        })).toMatchInlineSnapshot("\n      {\n        \"jitter\": \"deny\",\n      }\n    ");
    });
    (0, vitest_1.test)('blacklist multiple skills', function () {
        (0, vitest_1.expect)((0, skill_filter_js_1.computeSkillPermission)({
            enabledSkills: [],
            disabledSkills: ['jitter', 'termcast'],
        })).toMatchInlineSnapshot("\n      {\n        \"jitter\": \"deny\",\n        \"termcast\": \"deny\",\n      }\n    ");
    });
    (0, vitest_1.test)('whitelist takes precedence when both are set (cli.ts is expected to reject this upstream)', function () {
        // cli.ts validates mutual exclusion before reaching this helper. This
        // test documents the defensive behavior if both arrays ever leak through.
        (0, vitest_1.expect)((0, skill_filter_js_1.computeSkillPermission)({
            enabledSkills: ['npm-package'],
            disabledSkills: ['jitter'],
        })).toMatchInlineSnapshot("\n      {\n        \"*\": \"deny\",\n        \"npm-package\": \"allow\",\n      }\n    ");
    });
});
