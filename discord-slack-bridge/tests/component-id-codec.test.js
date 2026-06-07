"use strict";
// Tests encoding/decoding Discord component metadata into Slack action IDs.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var v10_1 = require("discord-api-types/v10");
var component_id_codec_js_1 = require("../src/component-id-codec.js");
var server_js_1 = require("../src/server.js");
(0, vitest_1.describe)('component-id-codec', function () {
    (0, vitest_1.test)('roundtrips encoded action ids', function () {
        var encoded = (0, component_id_codec_js_1.encodeComponentActionId)({
            componentType: v10_1.ComponentType.UserSelect,
            customId: 'pick-user',
        });
        (0, vitest_1.expect)(encoded).toBe('dsbcmp:5:pick-user');
        (0, vitest_1.expect)((0, component_id_codec_js_1.decodeComponentActionId)(encoded)).toEqual({
            componentType: v10_1.ComponentType.UserSelect,
            customId: 'pick-user',
        });
    });
    (0, vitest_1.test)('passes through legacy action ids', function () {
        (0, vitest_1.expect)((0, component_id_codec_js_1.decodeComponentActionId)('plain-custom-id')).toEqual({
            customId: 'plain-custom-id',
        });
    });
    (0, vitest_1.test)('maps Slack button action to Discord button interaction data', function () {
        var action = {
            actionId: 'plain-custom-id',
            type: 'button',
            value: 'clicked',
            selectedOptionValues: [],
            selectedUsers: [],
            selectedChannels: [],
            selectedConversations: [],
        };
        var interactionData = (0, server_js_1.buildDiscordComponentDataFromSlackAction)({ action: action });
        (0, vitest_1.expect)(interactionData).toMatchInlineSnapshot("\n      {\n        \"componentType\": 2,\n        \"values\": [],\n      }\n    ");
        (0, vitest_1.expect)((0, server_js_1.buildResolvedData)({
            componentType: interactionData.componentType,
            values: interactionData.values,
        })).toBeUndefined();
    });
    (0, vitest_1.test)('maps static select action to string select values', function () {
        var action = {
            actionId: 'dsbcmp:3:pick-model',
            type: 'static_select',
            selectedOptionValue: 'claude-sonnet',
            selectedOptionValues: [],
            selectedUsers: [],
            selectedChannels: [],
            selectedConversations: [],
        };
        var interactionData = (0, server_js_1.buildDiscordComponentDataFromSlackAction)({ action: action });
        (0, vitest_1.expect)(interactionData).toMatchInlineSnapshot("\n      {\n        \"componentType\": 3,\n        \"values\": [\n          \"claude-sonnet\",\n        ],\n      }\n    ");
    });
    (0, vitest_1.test)('maps multi static select action to string select values', function () {
        var action = {
            actionId: 'dsbcmp:3:pick-many-models',
            type: 'multi_static_select',
            selectedOptionValues: ['claude-sonnet', 'gpt-5'],
            selectedUsers: [],
            selectedChannels: [],
            selectedConversations: [],
        };
        var interactionData = (0, server_js_1.buildDiscordComponentDataFromSlackAction)({ action: action });
        (0, vitest_1.expect)(interactionData).toMatchInlineSnapshot("\n      {\n        \"componentType\": 3,\n        \"values\": [\n          \"claude-sonnet\",\n          \"gpt-5\",\n        ],\n      }\n    ");
    });
    (0, vitest_1.test)('maps users select action to user select resolved payload', function () {
        var action = {
            actionId: 'dsbcmp:5:pick-user',
            type: 'users_select',
            selectedUser: 'U123',
            selectedOptionValues: [],
            selectedUsers: [],
            selectedChannels: [],
            selectedConversations: [],
        };
        var interactionData = (0, server_js_1.buildDiscordComponentDataFromSlackAction)({ action: action });
        (0, vitest_1.expect)(interactionData).toMatchInlineSnapshot("\n      {\n        \"componentType\": 5,\n        \"values\": [\n          \"U123\",\n        ],\n      }\n    ");
        (0, vitest_1.expect)((0, server_js_1.buildResolvedData)({
            componentType: interactionData.componentType,
            values: interactionData.values,
        })).toMatchInlineSnapshot("\n      {\n        \"resolved\": {\n          \"users\": {\n            \"U123\": {\n              \"avatar\": null,\n              \"discriminator\": \"0\",\n              \"id\": \"U123\",\n              \"username\": \"U123\",\n            },\n          },\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('maps conversations select action to channel select resolved payload', function () {
        var action = {
            actionId: 'dsbcmp:8:pick-channel',
            type: 'conversations_select',
            selectedConversation: 'C123',
            selectedOptionValues: [],
            selectedUsers: [],
            selectedChannels: [],
            selectedConversations: [],
        };
        var interactionData = (0, server_js_1.buildDiscordComponentDataFromSlackAction)({ action: action });
        (0, vitest_1.expect)(interactionData).toMatchInlineSnapshot("\n      {\n        \"componentType\": 8,\n        \"values\": [\n          \"C123\",\n        ],\n      }\n    ");
        (0, vitest_1.expect)((0, server_js_1.buildResolvedData)({
            componentType: interactionData.componentType,
            values: interactionData.values,
        })).toMatchInlineSnapshot("\n      {\n        \"resolved\": {\n          \"channels\": {\n            \"C123\": {\n              \"id\": \"C123\",\n              \"name\": \"C123\",\n              \"permissions\": \"0\",\n              \"type\": 0,\n            },\n          },\n        },\n      }\n    ");
    });
});
