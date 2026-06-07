"use strict";
// Unit tests for Slack-to-Discord REST error mapping behavior.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var web_api_1 = require("@slack/web-api");
var rest_translator_js_1 = require("../src/rest-translator.js");
(0, vitest_1.describe)('mapSlackErrorToDiscordError', function () {
    (0, vitest_1.test)('maps Slack auth failures to Discord invalid token', function () {
        var mapped = (0, rest_translator_js_1.mapSlackErrorToDiscordError)(buildSlackApiError({ code: 'invalid_auth' }));
        (0, vitest_1.expect)(mapped.httpStatus).toBe(401);
        (0, vitest_1.expect)(mapped.discordCode).toBe(50014);
        (0, vitest_1.expect)(mapped.message).toBe('Invalid authentication token');
    });
    (0, vitest_1.test)('maps thread_not_found to unknown message', function () {
        var mapped = (0, rest_translator_js_1.mapSlackErrorToDiscordError)(buildSlackApiError({ code: 'thread_not_found' }));
        (0, vitest_1.expect)(mapped.httpStatus).toBe(404);
        (0, vitest_1.expect)(mapped.discordCode).toBe(10008);
    });
    (0, vitest_1.test)('maps permission failures to missing permissions', function () {
        var mapped = (0, rest_translator_js_1.mapSlackErrorToDiscordError)(buildSlackApiError({ code: 'cant_delete_message' }));
        (0, vitest_1.expect)(mapped.httpStatus).toBe(403);
        (0, vitest_1.expect)(mapped.discordCode).toBe(50013);
        (0, vitest_1.expect)(mapped.message).toBe('Missing Permissions');
    });
    (0, vitest_1.test)('maps missing_scope with actionable scope hint', function () {
        var mapped = (0, rest_translator_js_1.mapSlackErrorToDiscordError)(buildSlackApiError({
            code: 'missing_scope',
            needed: 'files:write',
        }));
        (0, vitest_1.expect)(mapped.httpStatus).toBe(403);
        (0, vitest_1.expect)(mapped.discordCode).toBe(50013);
        (0, vitest_1.expect)(mapped.message).toBe('Missing Permissions (Slack missing scope: files:write)');
    });
    (0, vitest_1.test)('maps message-parsed Slack errors from error.message', function () {
        var mapped = (0, rest_translator_js_1.mapSlackErrorToDiscordError)(new Error('An API error occurred: token_revoked'));
        (0, vitest_1.expect)(mapped.httpStatus).toBe(401);
        (0, vitest_1.expect)(mapped.discordCode).toBe(50014);
    });
});
function buildSlackApiError(_a) {
    var code = _a.code, needed = _a.needed;
    var err = new Error("An API error occurred: ".concat(code));
    return Object.assign(err, {
        code: web_api_1.ErrorCode.PlatformError,
        data: {
            ok: false,
            error: code,
            needed: needed,
        },
    });
}
