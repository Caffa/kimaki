"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var condense_memory_js_1 = require("./condense-memory.js");
(0, vitest_1.describe)('condenseMemoryMd', function () {
    (0, vitest_1.test)('multiple headings with body content', function () {
        var content = [
            '# Project Overview',
            '',
            'This is a big project with many things.',
            'It does X, Y, and Z.',
            '',
            '## Auth Architecture',
            '',
            'JWT tokens with 15min expiry.',
            'Refresh tokens in httpOnly cookies.',
            'Session stored in Redis.',
            '',
            '## User Preferences',
            '',
            '- kebab-case filenames',
            '- errore-style errors',
            '- no emojis',
            '',
            '### API Conventions',
            '',
            'All routes return { data, error }.',
            'Use spiceflow for the server.',
            '',
        ].join('\n');
        (0, vitest_1.expect)((0, condense_memory_js_1.condenseMemoryMd)(content)).toMatchInlineSnapshot("\n      \"1: # Project Overview\n      ...\n      6: ## Auth Architecture\n      ...\n      12: ## User Preferences\n      ...\n      18: ### API Conventions\n      ...\"\n    ");
    });
    (0, vitest_1.test)('body text before first heading', function () {
        var content = [
            'Some preamble notes.',
            '',
            '# First Heading',
            '',
            'Content here.',
            '',
        ].join('\n');
        (0, vitest_1.expect)((0, condense_memory_js_1.condenseMemoryMd)(content)).toMatchInlineSnapshot("\n      \"...\n      3: # First Heading\n      ...\"\n    ");
    });
    (0, vitest_1.test)('no headings at all', function () {
        var content = 'Just some notes.\nMore notes.\n';
        (0, vitest_1.expect)((0, condense_memory_js_1.condenseMemoryMd)(content)).toMatchInlineSnapshot("\"...\"");
    });
    (0, vitest_1.test)('empty content', function () {
        (0, vitest_1.expect)((0, condense_memory_js_1.condenseMemoryMd)('')).toMatchInlineSnapshot("\"\"");
    });
    (0, vitest_1.test)('consecutive headings without body', function () {
        var content = [
            '# H1',
            '## H2',
            '### H3',
            '',
            'Some body.',
            '',
        ].join('\n');
        (0, vitest_1.expect)((0, condense_memory_js_1.condenseMemoryMd)(content)).toMatchInlineSnapshot("\n      \"1: # H1\n      2: ## H2\n      3: ### H3\n      ...\"\n    ");
    });
    (0, vitest_1.test)('heading with code block body', function () {
        var content = [
            '# Config',
            '',
            '```json',
            '{ "key": "value" }',
            '```',
            '',
            '## Notes',
            '',
            'Some text.',
            '',
        ].join('\n');
        (0, vitest_1.expect)((0, condense_memory_js_1.condenseMemoryMd)(content)).toMatchInlineSnapshot("\n      \"1: # Config\n      ...\n      7: ## Notes\n      ...\"\n    ");
    });
});
