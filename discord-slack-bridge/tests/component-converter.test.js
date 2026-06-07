"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var component_converter_js_1 = require("../src/component-converter.js");
var v10_1 = require("discord-api-types/v10");
(0, vitest_1.describe)('componentsToBlocks', function () {
    (0, vitest_1.test)('returns empty array for no components', function () {
        (0, vitest_1.expect)((0, component_converter_js_1.componentsToBlocks)([])).toMatchInlineSnapshot("[]");
    });
    (0, vitest_1.test)('converts ActionRow with buttons', function () {
        var components = [
            {
                type: v10_1.ComponentType.ActionRow,
                components: [
                    {
                        type: v10_1.ComponentType.Button,
                        style: v10_1.ButtonStyle.Primary,
                        label: 'Click me',
                        custom_id: 'btn_1',
                    },
                    {
                        type: v10_1.ComponentType.Button,
                        style: v10_1.ButtonStyle.Danger,
                        label: 'Delete',
                        custom_id: 'btn_delete',
                    },
                    {
                        type: v10_1.ComponentType.Button,
                        style: v10_1.ButtonStyle.Secondary,
                        label: 'Cancel',
                        custom_id: 'btn_cancel',
                    },
                ],
            },
        ];
        (0, vitest_1.expect)((0, component_converter_js_1.componentsToBlocks)(components)).toMatchInlineSnapshot("\n      [\n        {\n          \"elements\": [\n            {\n              \"action_id\": \"btn_1\",\n              \"style\": \"primary\",\n              \"text\": {\n                \"emoji\": true,\n                \"text\": \"Click me\",\n                \"type\": \"plain_text\",\n              },\n              \"type\": \"button\",\n              \"value\": \"btn_1\",\n            },\n            {\n              \"action_id\": \"btn_delete\",\n              \"style\": \"danger\",\n              \"text\": {\n                \"emoji\": true,\n                \"text\": \"Delete\",\n                \"type\": \"plain_text\",\n              },\n              \"type\": \"button\",\n              \"value\": \"btn_delete\",\n            },\n            {\n              \"action_id\": \"btn_cancel\",\n              \"style\": undefined,\n              \"text\": {\n                \"emoji\": true,\n                \"text\": \"Cancel\",\n                \"type\": \"plain_text\",\n              },\n              \"type\": \"button\",\n              \"value\": \"btn_cancel\",\n            },\n          ],\n          \"type\": \"actions\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('converts link button with URL', function () {
        var components = [
            {
                type: v10_1.ComponentType.ActionRow,
                components: [
                    {
                        type: v10_1.ComponentType.Button,
                        style: v10_1.ButtonStyle.Link,
                        label: 'Open docs',
                        url: 'https://example.com/docs',
                    },
                ],
            },
        ];
        var blocks = (0, component_converter_js_1.componentsToBlocks)(components);
        (0, vitest_1.expect)(blocks[0].elements).toMatchInlineSnapshot("\n      [\n        {\n          \"action_id\": \"link_de106e607d0e711199de3fb7eb98fe5d\",\n          \"text\": {\n            \"emoji\": true,\n            \"text\": \"Open docs\",\n            \"type\": \"plain_text\",\n          },\n          \"type\": \"button\",\n          \"url\": \"https://example.com/docs\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('converts StringSelect', function () {
        var components = [
            {
                type: v10_1.ComponentType.ActionRow,
                components: [
                    {
                        type: v10_1.ComponentType.StringSelect,
                        custom_id: 'model_select',
                        placeholder: 'Choose a model',
                        options: [
                            { label: 'GPT-4', value: 'gpt-4', description: 'Most capable' },
                            { label: 'Claude', value: 'claude', default: true },
                        ],
                    },
                ],
            },
        ];
        (0, vitest_1.expect)((0, component_converter_js_1.componentsToBlocks)(components)).toMatchInlineSnapshot("\n      [\n        {\n          \"elements\": [\n            {\n              \"action_id\": \"dsbcmp:3:model_select\",\n              \"initial_option\": {\n                \"text\": {\n                  \"emoji\": true,\n                  \"text\": \"Claude\",\n                  \"type\": \"plain_text\",\n                },\n                \"value\": \"claude\",\n              },\n              \"options\": [\n                {\n                  \"description\": {\n                    \"text\": \"Most capable\",\n                    \"type\": \"plain_text\",\n                  },\n                  \"text\": {\n                    \"emoji\": true,\n                    \"text\": \"GPT-4\",\n                    \"type\": \"plain_text\",\n                  },\n                  \"value\": \"gpt-4\",\n                },\n                {\n                  \"text\": {\n                    \"emoji\": true,\n                    \"text\": \"Claude\",\n                    \"type\": \"plain_text\",\n                  },\n                  \"value\": \"claude\",\n                },\n              ],\n              \"placeholder\": {\n                \"text\": \"Choose a model\",\n                \"type\": \"plain_text\",\n              },\n              \"type\": \"static_select\",\n            },\n          ],\n          \"type\": \"actions\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('converts UserSelect', function () {
        var components = [
            {
                type: v10_1.ComponentType.ActionRow,
                components: [
                    {
                        type: v10_1.ComponentType.UserSelect,
                        custom_id: 'assignee_select',
                        placeholder: 'Pick user',
                        max_values: 1,
                    },
                ],
            },
        ];
        (0, vitest_1.expect)((0, component_converter_js_1.componentsToBlocks)(components)).toMatchInlineSnapshot("\n      [\n        {\n          \"elements\": [\n            {\n              \"action_id\": \"dsbcmp:5:assignee_select\",\n              \"placeholder\": {\n                \"text\": \"Pick user\",\n                \"type\": \"plain_text\",\n              },\n              \"type\": \"users_select\",\n            },\n          ],\n          \"type\": \"actions\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('converts ChannelSelect', function () {
        var components = [
            {
                type: v10_1.ComponentType.ActionRow,
                components: [
                    {
                        type: v10_1.ComponentType.ChannelSelect,
                        custom_id: 'channel_select',
                        max_values: 2,
                    },
                ],
            },
        ];
        (0, vitest_1.expect)((0, component_converter_js_1.componentsToBlocks)(components)).toMatchInlineSnapshot("\n      [\n        {\n          \"elements\": [\n            {\n              \"action_id\": \"dsbcmp:8:channel_select\",\n              \"filter\": {\n                \"exclude_bot_users\": true,\n                \"exclude_external_shared_channels\": false,\n                \"include\": [\n                  \"public\",\n                  \"private\",\n                ],\n              },\n              \"max_selected_items\": 2,\n              \"type\": \"multi_conversations_select\",\n            },\n          ],\n          \"type\": \"actions\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('converts MentionableSelect to users select', function () {
        var components = [
            {
                type: v10_1.ComponentType.ActionRow,
                components: [
                    {
                        type: v10_1.ComponentType.MentionableSelect,
                        custom_id: 'mentionable_select',
                    },
                ],
            },
        ];
        (0, vitest_1.expect)((0, component_converter_js_1.componentsToBlocks)(components)).toMatchInlineSnapshot("\n      [\n        {\n          \"elements\": [\n            {\n              \"action_id\": \"dsbcmp:7:mentionable_select\",\n              \"type\": \"users_select\",\n            },\n          ],\n          \"type\": \"actions\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('converts RoleSelect with fallback option', function () {
        var components = [
            {
                type: v10_1.ComponentType.ActionRow,
                components: [
                    {
                        type: v10_1.ComponentType.RoleSelect,
                        custom_id: 'role_select',
                    },
                ],
            },
        ];
        (0, vitest_1.expect)((0, component_converter_js_1.componentsToBlocks)(components)).toMatchInlineSnapshot("\n      [\n        {\n          \"elements\": [\n            {\n              \"action_id\": \"dsbcmp:6:role_select\",\n              \"initial_option\": {\n                \"description\": {\n                  \"text\": \"Slack has no role picker; this bridge uses role IDs when available.\",\n                  \"type\": \"plain_text\",\n                },\n                \"text\": {\n                  \"emoji\": true,\n                  \"text\": \"No roles available\",\n                  \"type\": \"plain_text\",\n                },\n                \"value\": \"__no_roles_available__\",\n              },\n              \"options\": [\n                {\n                  \"description\": {\n                    \"text\": \"Slack has no role picker; this bridge uses role IDs when available.\",\n                    \"type\": \"plain_text\",\n                  },\n                  \"text\": {\n                    \"emoji\": true,\n                    \"text\": \"No roles available\",\n                    \"type\": \"plain_text\",\n                  },\n                  \"value\": \"__no_roles_available__\",\n                },\n              ],\n              \"type\": \"static_select\",\n            },\n          ],\n          \"type\": \"actions\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('converts TextDisplay (Components V2)', function () {
        var components = [
            {
                type: v10_1.ComponentType.TextDisplay,
                content: 'Hello **world**',
            },
        ];
        (0, vitest_1.expect)((0, component_converter_js_1.componentsToBlocks)(components)).toMatchInlineSnapshot("\n      [\n        {\n          \"text\": {\n            \"text\": \"Hello *world*\",\n            \"type\": \"mrkdwn\",\n          },\n          \"type\": \"section\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('converts Separator to divider', function () {
        var components = [
            { type: v10_1.ComponentType.Separator },
        ];
        (0, vitest_1.expect)((0, component_converter_js_1.componentsToBlocks)(components)).toMatchInlineSnapshot("\n      [\n        {\n          \"type\": \"divider\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('converts Container by flattening children', function () {
        var components = [
            {
                type: v10_1.ComponentType.Container,
                components: [
                    { type: v10_1.ComponentType.TextDisplay, content: 'Line 1' },
                    { type: v10_1.ComponentType.Separator },
                    { type: v10_1.ComponentType.TextDisplay, content: 'Line 2' },
                ],
            },
        ];
        (0, vitest_1.expect)((0, component_converter_js_1.componentsToBlocks)(components)).toMatchInlineSnapshot("\n      [\n        {\n          \"text\": {\n            \"text\": \"Line 1\",\n            \"type\": \"mrkdwn\",\n          },\n          \"type\": \"section\",\n        },\n        {\n          \"type\": \"divider\",\n        },\n        {\n          \"text\": {\n            \"text\": \"Line 2\",\n            \"type\": \"mrkdwn\",\n          },\n          \"type\": \"section\",\n        },\n      ]\n    ");
    });
});
