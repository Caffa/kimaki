"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var opencode_command_detection_js_1 = require("./opencode-command-detection.js");
var fixtures = [
    {
        name: 'build',
        discordCommandName: 'build-cmd',
        description: 'build the project',
        source: 'command',
    },
    {
        name: 'namespace:foo',
        discordCommandName: 'namespace-foo-cmd',
        description: 'namespaced',
        source: 'command',
    },
    {
        name: 'review',
        discordCommandName: 'review-skill',
        description: 'review skill',
        source: 'skill',
    },
    {
        name: 'plan',
        discordCommandName: 'plan-mcp-prompt',
        description: 'plan via mcp',
        source: 'mcp',
    },
];
(0, vitest_1.describe)('extractLeadingOpencodeCommand', function () {
    (0, vitest_1.test)('plain /build with args', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/build foo bar', fixtures)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"foo bar\",\n          \"name\": \"build\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('plain /build no args', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/build', fixtures))
            .toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"\",\n          \"name\": \"build\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('/build-cmd suffix resolves to build', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/build-cmd hello world', fixtures)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"hello world\",\n          \"name\": \"build\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('-skill suffix', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/review-skill a b', fixtures)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"a b\",\n          \"name\": \"review\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('-mcp-prompt suffix', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/plan-mcp-prompt go', fixtures)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"go\",\n          \"name\": \"plan\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('original namespaced name with colon', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/namespace:foo arg', fixtures)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"arg\",\n          \"name\": \"namespace:foo\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('discord-sanitized namespaced name', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/namespace-foo-cmd arg', fixtures)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"arg\",\n          \"name\": \"namespace:foo\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('kimaki-cli prefix on its own line', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('» **kimaki-cli:**\n/build foo bar', fixtures)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"foo bar\",\n          \"name\": \"build\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('queue-style user prefix on its own line', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('» **Tommy:**\n/build hey', fixtures)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"hey\",\n          \"name\": \"build\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('username containing asterisk on its own line', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('» **A*B:**\n/build hi', fixtures)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"hi\",\n          \"name\": \"build\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('Context from thread wrapping still detects command', function () {
        var wrapped = 'Context from thread:\nsome starter text\n\nUser request:\n/build foo';
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)(wrapped, fixtures))
            .toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"foo\",\n          \"name\": \"build\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('unknown command returns null', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/nothing here', fixtures)).toMatchInlineSnapshot("null");
    });
    (0, vitest_1.test)('no leading slash on any line returns null', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('hello /build\nmore text', fixtures)).toMatchInlineSnapshot("null");
    });
    (0, vitest_1.test)('just slash returns null', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/', fixtures)).toMatchInlineSnapshot("null");
    });
    (0, vitest_1.test)('empty string returns null', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('', fixtures)).toMatchInlineSnapshot("null");
    });
    (0, vitest_1.test)('empty registry returns null for tokens without Discord suffix', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/build foo', [])).toMatchInlineSnapshot("null");
    });
    (0, vitest_1.test)('empty registry fallback: -cmd suffix strips and returns base name', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/hello-test-cmd', [])).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"\",\n          \"name\": \"hello-test\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('empty registry fallback: -skill suffix with args', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/review-skill check auth', [])).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"check auth\",\n          \"name\": \"review\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('empty registry fallback skips non-suffixed, matches suffixed on next line', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/unknown\n/deploy-cmd now', [])).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"now\",\n          \"name\": \"deploy\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('leading whitespace before slash still matches', function () {
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('   /build foo', fixtures)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"foo\",\n          \"name\": \"build\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('first matching line wins', function () {
        var prompt = 'noise line\n/build first args\n/review second args';
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)(prompt, fixtures))
            .toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"first args\",\n          \"name\": \"build\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('unknown command on one line, known on next', function () {
        var prompt = '/unknown foo\n/build bar';
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)(prompt, fixtures))
            .toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"bar\",\n          \"name\": \"build\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('suffix strip does not clobber a command whose name happens to end in -cmd', function () {
        var custom = [
            {
                name: 'deploy-cmd',
                discordCommandName: 'deploy-cmd-cmd',
                description: '',
                source: 'command',
            },
        ];
        (0, vitest_1.expect)((0, opencode_command_detection_js_1.extractLeadingOpencodeCommand)('/deploy-cmd now', custom)).toMatchInlineSnapshot("\n      {\n        \"command\": {\n          \"arguments\": \"now\",\n          \"name\": \"deploy-cmd\",\n        },\n      }\n    ");
    });
});
