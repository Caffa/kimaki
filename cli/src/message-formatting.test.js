"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var message_formatting_js_1 = require("./message-formatting.js");
(0, vitest_1.describe)('formatPart', function () {
    (0, vitest_1.test)('callout text does not get ⬥ prefix', function () {
        var part = {
            id: 'test',
            type: 'text',
            sessionID: 'ses_test',
            messageID: 'msg_test',
            text: "<callout accent=\"#ef4444\">\n## Top priority\n- **Stripe dispute** deadline\n</callout>",
        };
        (0, vitest_1.expect)((0, message_formatting_js_1.formatPart)(part)).toMatchInlineSnapshot("\n      \"\n      <callout accent=\"#ef4444\">\n      ## Top priority\n      - **Stripe dispute** deadline\n      </callout>\"\n    ");
    });
    (0, vitest_1.test)('regular text gets ⬥ prefix', function () {
        var part = {
            id: 'test',
            type: 'text',
            sessionID: 'ses_test',
            messageID: 'msg_test',
            text: 'hello world',
        };
        (0, vitest_1.expect)((0, message_formatting_js_1.formatPart)(part)).toMatchInlineSnapshot("\"\u2B25 hello world\"");
    });
    (0, vitest_1.test)('text starting with heading does not get ⬥ prefix', function () {
        var part = {
            id: 'test',
            type: 'text',
            sessionID: 'ses_test',
            messageID: 'msg_test',
            text: '## Summary\nDone.',
        };
        (0, vitest_1.expect)((0, message_formatting_js_1.formatPart)(part)).toMatchInlineSnapshot("\n      \"\n      ## Summary\n      Done.\"\n    ");
    });
});
(0, vitest_1.describe)('formatTodoList', function () {
    (0, vitest_1.test)('formats active todo with monospace numbers', function () {
        var part = {
            id: 'test',
            type: 'tool',
            tool: 'todowrite',
            sessionID: 'ses_test',
            messageID: 'msg_test',
            callID: 'call_test',
            state: {
                status: 'completed',
                input: {
                    todos: [
                        { content: 'First task', status: 'completed' },
                        { content: 'Second task', status: 'in_progress' },
                        { content: 'Third task', status: 'pending' },
                    ],
                },
                output: '',
                title: 'todowrite',
                metadata: {},
                time: { start: 0, end: 0 },
            },
        };
        (0, vitest_1.expect)((0, message_formatting_js_1.formatTodoList)(part)).toMatchInlineSnapshot("\"\u2489 **second task**\"");
    });
    (0, vitest_1.test)('formats double digit todo numbers', function () {
        var todos = Array.from({ length: 12 }, function (_, i) { return ({
            content: "Task ".concat(i + 1),
            status: i === 11 ? 'in_progress' : 'completed',
        }); });
        var part = {
            id: 'test',
            type: 'tool',
            tool: 'todowrite',
            sessionID: 'ses_test',
            messageID: 'msg_test',
            callID: 'call_test',
            state: {
                status: 'completed',
                input: { todos: todos },
                output: '',
                title: 'todowrite',
                metadata: {},
                time: { start: 0, end: 0 },
            },
        };
        (0, vitest_1.expect)((0, message_formatting_js_1.formatTodoList)(part)).toMatchInlineSnapshot("\"\u2493 **task 12**\"");
    });
    (0, vitest_1.test)('lowercases first letter of content', function () {
        var part = {
            id: 'test',
            type: 'tool',
            tool: 'todowrite',
            sessionID: 'ses_test',
            messageID: 'msg_test',
            callID: 'call_test',
            state: {
                status: 'completed',
                input: {
                    todos: [{ content: 'Fix the bug', status: 'in_progress' }],
                },
                output: '',
                title: 'todowrite',
                metadata: {},
                time: { start: 0, end: 0 },
            },
        };
        (0, vitest_1.expect)((0, message_formatting_js_1.formatTodoList)(part)).toMatchInlineSnapshot("\"\u2488 **fix the bug**\"");
    });
});
