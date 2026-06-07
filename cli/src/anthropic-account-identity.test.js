"use strict";
// Tests Anthropic OAuth account identity parsing and normalization.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var anthropic_account_identity_js_1 = require("./anthropic-account-identity.js");
(0, vitest_1.describe)('normalizeAnthropicAccountIdentity', function () {
    (0, vitest_1.test)('normalizes email casing and drops empty values', function () {
        (0, vitest_1.expect)((0, anthropic_account_identity_js_1.normalizeAnthropicAccountIdentity)({
            email: '  User@Example.com ',
            accountId: '  user_123  ',
        })).toEqual({
            email: 'user@example.com',
            accountId: 'user_123',
        });
        (0, vitest_1.expect)((0, anthropic_account_identity_js_1.normalizeAnthropicAccountIdentity)({ email: '   ' })).toBeUndefined();
    });
});
(0, vitest_1.describe)('extractAnthropicAccountIdentity', function () {
    (0, vitest_1.test)('prefers nested user profile identity from client_data responses', function () {
        (0, vitest_1.expect)((0, anthropic_account_identity_js_1.extractAnthropicAccountIdentity)({
            organizations: [{ id: 'org_123', name: 'Workspace' }],
            user: {
                id: 'usr_123',
                email: 'User@Example.com',
            },
        })).toEqual({
            accountId: 'usr_123',
            email: 'user@example.com',
        });
    });
    (0, vitest_1.test)('falls back to profile-style payloads without email', function () {
        (0, vitest_1.expect)((0, anthropic_account_identity_js_1.extractAnthropicAccountIdentity)({
            profile: {
                user_id: 'usr_456',
            },
        })).toEqual({
            accountId: 'usr_456',
        });
    });
});
