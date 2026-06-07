"use strict";
// Verifies Slack webhook team-id extraction across event and action payload shapes.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var index_js_1 = require("../src/index.js");
(0, vitest_1.describe)('getTeamIdForWebhookEvent', function () {
    (0, vitest_1.test)('reads team_id from slash-command form payload', function () {
        var body = new URLSearchParams({
            team_id: 'T_SLASH',
            command: '/kimaki',
        }).toString();
        (0, vitest_1.expect)((0, index_js_1.getTeamIdForWebhookEvent)({
            body: body,
            contentType: 'application/x-www-form-urlencoded',
        })).toBe('T_SLASH');
    });
    (0, vitest_1.test)('reads team.id from interactive payload', function () {
        var body = new URLSearchParams({
            payload: JSON.stringify({
                type: 'block_actions',
                team: { id: 'T_INTERACTIVE' },
            }),
        }).toString();
        (0, vitest_1.expect)((0, index_js_1.getTeamIdForWebhookEvent)({
            body: body,
            contentType: 'application/x-www-form-urlencoded; charset=utf-8',
        })).toBe('T_INTERACTIVE');
    });
    (0, vitest_1.test)('reads team_id from JSON event callback payload', function () {
        var body = JSON.stringify({
            type: 'event_callback',
            team_id: 'T_EVENT',
            event: { type: 'message' },
        });
        (0, vitest_1.expect)((0, index_js_1.getTeamIdForWebhookEvent)({
            body: body,
            contentType: 'application/json',
        })).toBe('T_EVENT');
    });
    (0, vitest_1.test)('falls back to authorizations[].team_id', function () {
        var body = JSON.stringify({
            type: 'event_callback',
            authorizations: [{ team_id: 'T_AUTHZ' }],
            event: { type: 'message' },
        });
        (0, vitest_1.expect)((0, index_js_1.getTeamIdForWebhookEvent)({ body: body })).toBe('T_AUTHZ');
    });
    (0, vitest_1.test)('returns undefined for malformed payload', function () {
        (0, vitest_1.expect)((0, index_js_1.getTeamIdForWebhookEvent)({
            body: '{not-json}',
            contentType: 'application/json',
        })).toBeUndefined();
    });
});
