"use strict";
// Unit tests for deriveThreadNameFromSessionTitle — the pure helper that
// decides whether (and how) to rename a Discord thread based on an
// OpenCode session title. Kept focused and deterministic; no Discord mocks.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var thread_session_runtime_js_1 = require("./session-handler/thread-session-runtime.js");
(0, vitest_1.describe)('deriveThreadNameFromSessionTitle', function () {
    (0, vitest_1.test)('returns trimmed title for plain thread', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: '  Fix auth bug  ',
            currentName: 'fix the auth',
        })).toMatchInlineSnapshot("\"Fix auth bug\"");
    });
    (0, vitest_1.test)('preserves worktree prefix from current name', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: 'Refactor queue',
            currentName: '⬦ refactor queue old',
        })).toMatchInlineSnapshot("\"\u2B26 Refactor queue\"");
    });
    (0, vitest_1.test)('ignores placeholder "New Session -" titles', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: 'New Session - 2025-01-02',
            currentName: 'whatever',
        })).toMatchInlineSnapshot("undefined");
    });
    (0, vitest_1.test)('ignores case-insensitive placeholder titles', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: 'new session -abc',
            currentName: 'whatever',
        })).toMatchInlineSnapshot("undefined");
    });
    (0, vitest_1.test)('returns undefined when candidate already matches current name', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: 'Fix auth bug',
            currentName: 'Fix auth bug',
        })).toMatchInlineSnapshot("undefined");
    });
    (0, vitest_1.test)('returns undefined when candidate (with worktree prefix) already matches', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: 'Refactor queue',
            currentName: '⬦ Refactor queue',
        })).toMatchInlineSnapshot("undefined");
    });
    (0, vitest_1.test)('truncates to 100 chars including worktree prefix', function () {
        var result = (0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: 'x'.repeat(200),
            currentName: '⬦ seed',
        });
        (0, vitest_1.expect)(result === null || result === void 0 ? void 0 : result.length).toMatchInlineSnapshot("100");
        (0, vitest_1.expect)(result === null || result === void 0 ? void 0 : result.startsWith('⬦ ')).toMatchInlineSnapshot("true");
    });
    (0, vitest_1.test)('truncates to 100 chars without prefix', function () {
        var result = (0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: 'y'.repeat(200),
            currentName: 'seed',
        });
        (0, vitest_1.expect)(result === null || result === void 0 ? void 0 : result.length).toMatchInlineSnapshot("100");
    });
    (0, vitest_1.test)('returns undefined for empty string', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: '',
            currentName: 'seed',
        })).toMatchInlineSnapshot("undefined");
    });
    (0, vitest_1.test)('returns undefined for whitespace-only title', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: '   ',
            currentName: 'seed',
        })).toMatchInlineSnapshot("undefined");
    });
    (0, vitest_1.test)('preserves btw: prefix from current name', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: 'Side question about auth',
            currentName: 'btw: why is auth broken',
        })).toMatchInlineSnapshot("\"btw: Side question about auth\"");
    });
    (0, vitest_1.test)('preserves Fork: prefix from current name', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: 'Forked task title',
            currentName: 'Fork: old session title',
        })).toMatchInlineSnapshot("\"Fork: Forked task title\"");
    });
    (0, vitest_1.test)('returns undefined for null/undefined title', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: null,
            currentName: 'seed',
        })).toMatchInlineSnapshot("undefined");
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadNameFromSessionTitle)({
            sessionTitle: undefined,
            currentName: 'seed',
        })).toMatchInlineSnapshot("undefined");
    });
});
(0, vitest_1.describe)('deriveThreadRenameFromSessionUpdate', function () {
    (0, vitest_1.test)('skips auto-rename after the thread differs from the persisted synced name', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadRenameFromSessionUpdate)({
            sessionTitle: 'New OpenCode title',
            currentName: 'custom name from user',
            lastSyncedName: 'Old OpenCode title',
        })).toMatchInlineSnapshot("\n      {\n        \"desiredName\": null,\n        \"nextSyncedName\": \"Old OpenCode title\",\n      }\n    ");
    });
    (0, vitest_1.test)('returns desired name while thread still matches the persisted synced name', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadRenameFromSessionUpdate)({
            sessionTitle: 'New OpenCode title',
            currentName: 'Old OpenCode title',
            lastSyncedName: 'Old OpenCode title',
        })).toMatchInlineSnapshot("\n      {\n        \"desiredName\": \"New OpenCode title\",\n        \"nextSyncedName\": \"New OpenCode title\",\n      }\n    ");
    });
    (0, vitest_1.test)('remembers a no-op matching title as synced for later manual rename detection', function () {
        (0, vitest_1.expect)((0, thread_session_runtime_js_1.deriveThreadRenameFromSessionUpdate)({
            sessionTitle: 'Old OpenCode title',
            currentName: 'Old OpenCode title',
            lastSyncedName: null,
        })).toMatchInlineSnapshot("\n      {\n        \"desiredName\": null,\n        \"nextSyncedName\": \"Old OpenCode title\",\n      }\n    ");
    });
});
