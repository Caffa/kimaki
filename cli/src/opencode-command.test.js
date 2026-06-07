"use strict";
// Regression tests for Windows OpenCode command resolution and spawn args.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var opencode_command_js_1 = require("./opencode-command.js");
(0, vitest_1.describe)('splitCommandLookupOutput', function () {
    (0, vitest_1.test)('splits windows command lookup output into trimmed lines', function () {
        (0, vitest_1.expect)((0, opencode_command_js_1.splitCommandLookupOutput)('C:\\Program Files\\nodejs\\opencode\r\nC:\\Program Files\\nodejs\\opencode.cmd\r\n')).toEqual([
            'C:\\Program Files\\nodejs\\opencode',
            'C:\\Program Files\\nodejs\\opencode.cmd',
        ]);
    });
});
(0, vitest_1.describe)('selectResolvedCommand', function () {
    (0, vitest_1.test)('prefers npm cmd shims on windows', function () {
        (0, vitest_1.expect)((0, opencode_command_js_1.selectResolvedCommand)({
            output: 'C:\\Program Files\\nodejs\\opencode\r\nC:\\Program Files\\nodejs\\opencode.cmd\r\n',
            isWindows: true,
        })).toBe('C:\\Program Files\\nodejs\\opencode.cmd');
    });
    (0, vitest_1.test)('keeps first result on non-windows platforms', function () {
        (0, vitest_1.expect)((0, opencode_command_js_1.selectResolvedCommand)({
            output: '/usr/local/bin/opencode\n/opt/homebrew/bin/opencode\n',
            isWindows: false,
        })).toBe('/usr/local/bin/opencode');
    });
});
(0, vitest_1.describe)('getSpawnCommandAndArgs', function () {
    (0, vitest_1.test)('wraps windows cmd shims through cmd.exe without double-quoting by node', function () {
        (0, vitest_1.expect)((0, opencode_command_js_1.getSpawnCommandAndArgs)({
            resolvedCommand: 'C:\\Program Files\\nodejs\\opencode.cmd',
            baseArgs: ['serve', '--port', '4096'],
            platform: 'win32',
        })).toEqual({
            command: 'cmd.exe',
            args: ['/d', '/s', '/c', '"C:\\Program Files\\nodejs\\opencode.cmd"', 'serve', '--port', '4096'],
            windowsVerbatimArguments: true,
        });
    });
    (0, vitest_1.test)('leaves direct executables unchanged on windows', function () {
        (0, vitest_1.expect)((0, opencode_command_js_1.getSpawnCommandAndArgs)({
            resolvedCommand: 'C:\\tools\\opencode.exe',
            baseArgs: ['serve', '--port', '4096'],
            platform: 'win32',
        })).toEqual({
            command: 'C:\\tools\\opencode.exe',
            args: ['serve', '--port', '4096'],
        });
    });
});
