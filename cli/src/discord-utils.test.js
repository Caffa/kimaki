"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var discord_js_1 = require("discord.js");
var vitest_1 = require("vitest");
var discord_utils_js_1 = require("./discord-utils.js");
(0, vitest_1.describe)('splitMarkdownForDiscord', function () {
    (0, vitest_1.test)('never returns chunks over the max length with code fences', function () {
        var maxLength = 2000;
        var header = '## Summary of Current Architecture\n\n';
        var codeFenceStart = '```\n';
        var codeFenceEnd = '\n```\n';
        var codeLine = 'x'.repeat(180);
        var codeBlock = Array.from({ length: 20 })
            .map(function () { return codeLine; })
            .join('\n');
        var markdown = "".concat(header).concat(codeFenceStart).concat(codeBlock).concat(codeFenceEnd);
        var chunks = (0, discord_utils_js_1.splitMarkdownForDiscord)({ content: markdown, maxLength: maxLength });
        (0, vitest_1.expect)(chunks.length).toBeGreaterThan(1);
        for (var _i = 0, chunks_1 = chunks; _i < chunks_1.length; _i++) {
            var chunk = chunks_1[_i];
            (0, vitest_1.expect)(chunk.length).toBeLessThanOrEqual(maxLength);
        }
    });
    // Without the lineLength fix for opening fences on non-empty chunks, the opening
    // fence text "```\n" gets appended without being counted in the overflow check.
    // When the chunk is later flushed with a closing fence, it exceeds maxLength.
    (0, vitest_1.test)('opening fence on non-empty chunk is counted in overflow check', function () {
        var maxLength = 60;
        // 55 chars of text + paragraph break, then a code block.
        // The text fills the chunk to ~57 chars. The opening fence "```\n" (4 chars)
        // would push to 61 if not counted, then flushing adds "```\n" (4 more) = 65.
        var markdown = 'a'.repeat(55) + '\n\n```\nshort code\n```\n';
        var chunks = (0, discord_utils_js_1.splitMarkdownForDiscord)({ content: markdown, maxLength: maxLength });
        for (var _i = 0, chunks_2 = chunks; _i < chunks_2.length; _i++) {
            var chunk = chunks_2[_i];
            (0, vitest_1.expect)(chunk.length).toBeLessThanOrEqual(maxLength);
        }
    });
    (0, vitest_1.test)('list item code block keeps newline before fence when splitting', function () {
        var content = "- File: playwriter/src/aria-snapshot.ts\n- Add helper function (~line 477, after isTextRole):\n  ```ts\n  function isSubstringOfAny(needle: string, haystack: Set<string>): boolean {\n    for (const str of haystack) {\n      if (str.includes(needle)) {\n        return true\n      }\n    }\n    return false\n  }\n  ```\n";
        var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({ content: content, maxLength: 80 });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        \"- File: playwriter/src/aria-snapshot.ts\n      \",\n        \"- Add helper function (~line 477, after isTextRole):\n        ```ts\n      \",\n        \"  function isSubstringOfAny(needle: string, haystack: Set<string>): boolean {\n      \",\n        \"    for (const str of haystack) {\n            if (str.includes(needle)) {\n      \",\n        \"        return true\n            }\n          }\n          return false\n        }\n        ```\n      \",\n      ]\n    ");
    });
    (0, vitest_1.test)('task list code block does not duplicate checkbox marker when splitting', function () {
        var content = "- [ ] Do thing\n  ```sh\n  echo hi\n  ```\n";
        var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({ content: content, maxLength: 80 });
        (0, vitest_1.expect)(result.join('')).toContain('- [ ] Do thing\n');
        (0, vitest_1.expect)(result.join('')).not.toContain('- [ ] [ ] Do thing');
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        \"- [ ] Do thing\n        ```sh\n        echo hi\n        ```\n      \",\n      ]\n    ");
    });
});
(0, vitest_1.describe)('hasKimakiBotPermission', function () {
    (0, vitest_1.test)('allows API interaction member when kimaki role exists', function () {
        var kimakiRoleId = '111';
        var guild = {
            ownerId: 'owner-id',
            roles: {
                cache: new Map([
                    [kimakiRoleId, { id: kimakiRoleId, name: 'Kimaki' }],
                ]),
            },
        };
        var member = {
            user: { id: 'member-id' },
            permissions: '0',
            roles: [kimakiRoleId],
        };
        (0, vitest_1.expect)((0, discord_utils_js_1.hasKimakiBotPermission)(member, guild)).toBe(true);
    });
    (0, vitest_1.test)('allows API interaction member with ManageGuild permission', function () {
        var guild = {
            ownerId: 'owner-id',
            roles: { cache: new Map() },
        };
        var member = {
            user: { id: 'member-id' },
            permissions: discord_js_1.PermissionsBitField.Flags.ManageGuild.toString(),
            roles: [],
        };
        (0, vitest_1.expect)((0, discord_utils_js_1.hasKimakiBotPermission)(member, guild)).toBe(true);
    });
    (0, vitest_1.test)('denies API interaction member with no role, owner, or admin rights', function () {
        var guild = {
            ownerId: 'owner-id',
            roles: { cache: new Map() },
        };
        var member = {
            user: { id: 'member-id' },
            permissions: '0',
            roles: [],
        };
        (0, vitest_1.expect)((0, discord_utils_js_1.hasKimakiBotPermission)(member, guild)).toBe(false);
    });
});
