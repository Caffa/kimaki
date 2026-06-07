"use strict";
// Tests for context-awareness directory switch reminders.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var context_awareness_plugin_js_1 = require("./context-awareness-plugin.js");
(0, vitest_1.describe)('shouldInjectPwd', function () {
    (0, vitest_1.test)('does not inject when current directory matches announced directory', function () {
        var result = (0, context_awareness_plugin_js_1.shouldInjectPwd)({
            currentDir: '/repo/worktree',
            previousDir: '/repo/main',
            announcedDir: '/repo/worktree',
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"inject\": false,\n      }\n    ");
    });
    (0, vitest_1.test)('does not inject without a previous directory to warn about', function () {
        var result = (0, context_awareness_plugin_js_1.shouldInjectPwd)({
            currentDir: '/repo/worktree',
            previousDir: undefined,
            announcedDir: undefined,
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"inject\": false,\n      }\n    ");
    });
    (0, vitest_1.test)('names previous and current directories in the correct order', function () {
        var result = (0, context_awareness_plugin_js_1.shouldInjectPwd)({
            currentDir: '/repo/worktree',
            previousDir: '/repo/main',
            announcedDir: undefined,
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"inject\": true,\n        \"text\": \"\n      [working directory changed (cwd / pwd has changed). The user expects you to edit files in the new cwd. Previous folder (DO NOT TOUCH): /repo/main. New folder (new cwd / pwd, edit files here): /repo/worktree. You MUST read, write, and edit files only under the new folder /repo/worktree. You MUST NOT read, write, or edit any files under the previous folder /repo/main \u2014 that folder is a separate checkout and the user or another agent may be actively working there, so writing to it would override their unrelated changes.]\n      \",\n      }\n    ");
    });
    (0, vitest_1.test)('prefers the last announced directory as the previous directory', function () {
        var result = (0, context_awareness_plugin_js_1.shouldInjectPwd)({
            currentDir: '/repo/worktree-b',
            previousDir: '/repo/main',
            announcedDir: '/repo/worktree-a',
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"inject\": true,\n        \"text\": \"\n      [working directory changed (cwd / pwd has changed). The user expects you to edit files in the new cwd. Previous folder (DO NOT TOUCH): /repo/worktree-a. New folder (new cwd / pwd, edit files here): /repo/worktree-b. You MUST read, write, and edit files only under the new folder /repo/worktree-b. You MUST NOT read, write, or edit any files under the previous folder /repo/worktree-a \u2014 that folder is a separate checkout and the user or another agent may be actively working there, so writing to it would override their unrelated changes.]\n      \",\n      }\n    ");
    });
});
(0, vitest_1.describe)('shouldInjectMemoryReminderFromLatestAssistant', function () {
    (0, vitest_1.test)('does not trigger before threshold', function () {
        var result = (0, context_awareness_plugin_js_1.shouldInjectMemoryReminderFromLatestAssistant)({
            latestAssistantMessage: {
                id: 'msg_asst_1',
                role: 'assistant',
                time: { completed: 1 },
                tokens: {
                    input: 1000,
                    output: 3000,
                    reasoning: 500,
                    cache: { read: 0, write: 0 },
                },
            },
            threshold: 10000,
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"inject\": false,\n      }\n    ");
    });
    (0, vitest_1.test)('triggers when latest assistant message exceeds threshold', function () {
        var result = (0, context_awareness_plugin_js_1.shouldInjectMemoryReminderFromLatestAssistant)({
            latestAssistantMessage: {
                id: 'msg_asst_2',
                role: 'assistant',
                time: { completed: 2 },
                tokens: {
                    input: 2000,
                    output: 2200,
                    reasoning: 400,
                    cache: { read: 0, write: 0 },
                },
            },
            threshold: 2000,
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"assistantMessageId\": \"msg_asst_2\",\n        \"inject\": true,\n      }\n    ");
    });
    (0, vitest_1.test)('does not trigger again for the same reminded assistant message', function () {
        var result = (0, context_awareness_plugin_js_1.shouldInjectMemoryReminderFromLatestAssistant)({
            lastMemoryReminderAssistantMessageId: 'msg_asst_3',
            latestAssistantMessage: {
                id: 'msg_asst_3',
                role: 'assistant',
                time: { completed: 3 },
                tokens: {
                    input: 2000,
                    output: 2200,
                    reasoning: 400,
                    cache: { read: 0, write: 0 },
                },
            },
            threshold: 10000,
        });
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"inject\": false,\n      }\n    ");
    });
});
