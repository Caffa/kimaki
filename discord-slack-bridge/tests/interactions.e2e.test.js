"use strict";
// E2E coverage for Slack interactive payloads -> Discord interactionCreate events.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var discord_js_1 = require("discord.js");
var vitest_1 = require("vitest");
var src_1 = require("slack-digital-twin/src");
var v10_1 = require("discord-api-types/v10");
var component_id_codec_js_1 = require("../src/component-id-codec.js");
var e2e_setup_js_1 = require("./e2e-setup.js");
(0, vitest_1.describe)('interactive payloads: Slack -> Discord', function () {
    var ctx;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)({
                        channels: [{ name: 'interactions' }],
                        users: [{ name: 'alice', realName: 'Alice' }],
                    })];
                case 1:
                    ctx = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.teardownE2E)(ctx)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('button click payload is emitted as discord.js ButtonInteraction', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, row, channelId, _a, messages, buttonMessage, actionId, webhookConfig, received, onInteraction, interaction;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    guild = ctx.client.guilds.cache.first();
                    channel = guild === null || guild === void 0 ? void 0 : guild.channels.cache.find(function (c) {
                        return c.isTextBased() && c.name === 'interactions';
                    });
                    row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('e2e-click')
                        .setLabel('Click')
                        .setStyle(discord_js_1.ButtonStyle.Primary));
                    return [4 /*yield*/, channel.send({
                            content: 'click test',
                            components: [row],
                        })];
                case 1:
                    _b.sent();
                    channelId = ctx.twin.resolveChannelId('interactions');
                    _a = vitest_1.expect;
                    return [4 /*yield*/, ctx.twin.channel(channelId).text()];
                case 2:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\"test-bot: click test\"");
                    return [4 /*yield*/, ctx.twin.channel(channelId).getMessages()];
                case 3:
                    messages = _b.sent();
                    buttonMessage = __spreadArray([], messages, true).reverse()
                        .find(function (message) {
                        return getFirstActionId(message) !== undefined;
                    });
                    (0, vitest_1.expect)(buttonMessage).toBeDefined();
                    if (!(buttonMessage === null || buttonMessage === void 0 ? void 0 : buttonMessage.ts)) {
                        return [2 /*return*/];
                    }
                    actionId = getFirstActionId(buttonMessage);
                    (0, vitest_1.expect)(actionId).toBeTruthy();
                    if (!actionId) {
                        return [2 /*return*/];
                    }
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    onInteraction = function (interaction) {
                        if (interaction.isButton()) {
                            received = interaction;
                        }
                    };
                    ctx.client.on('interactionCreate', onInteraction);
                    return [4 /*yield*/, (0, src_1.sendInteractivePayload)({
                            config: webhookConfig,
                            payload: {
                                type: 'block_actions',
                                user: {
                                    id: ctx.twin.resolveUserId('alice'),
                                    username: 'alice',
                                    name: 'alice',
                                },
                                channel: { id: channelId },
                                message: { ts: buttonMessage.ts },
                                container: {
                                    type: 'message',
                                    channel_id: channelId,
                                    message_ts: buttonMessage.ts,
                                },
                                trigger_id: 'trigger-1',
                                response_url: 'https://example.invalid/response',
                                actions: [
                                    {
                                        action_id: actionId,
                                        type: 'button',
                                        value: 'clicked',
                                        block_id: 'b1',
                                        action_ts: '1700000000.000001',
                                    },
                                ],
                            },
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, received];
                                });
                            }); },
                            label: 'button interaction event',
                        })];
                case 5:
                    interaction = _b.sent();
                    ctx.client.off('interactionCreate', onInteraction);
                    (0, vitest_1.expect)({
                        customId: interaction.customId,
                        channelId: interaction.channelId,
                        userId: interaction.user.id,
                        componentType: interaction.componentType,
                    }).toMatchInlineSnapshot("\n      {\n        \"channelId\": null,\n        \"componentType\": 2,\n        \"customId\": \"e2e-click\",\n        \"userId\": \"U000000002\",\n      }\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('button block action can be replied to and posts message to Slack', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, row, channelId, messages, buttonMessage, actionId, webhookConfig, replied, onInteraction;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    guild = ctx.client.guilds.cache.first();
                    channel = guild === null || guild === void 0 ? void 0 : guild.channels.cache.find(function (c) {
                        return c.isTextBased() && c.name === 'interactions';
                    });
                    row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId('e2e-button-reply')
                        .setLabel('Reply')
                        .setStyle(discord_js_1.ButtonStyle.Primary));
                    return [4 /*yield*/, channel.send({
                            content: 'button reply test',
                            components: [row],
                        })];
                case 1:
                    _a.sent();
                    channelId = ctx.twin.resolveChannelId('interactions');
                    return [4 /*yield*/, ctx.twin.channel(channelId).getMessages()];
                case 2:
                    messages = _a.sent();
                    buttonMessage = __spreadArray([], messages, true).reverse()
                        .find(function (message) {
                        return getFirstActionId(message) !== undefined;
                    });
                    (0, vitest_1.expect)(buttonMessage).toBeDefined();
                    if (!(buttonMessage === null || buttonMessage === void 0 ? void 0 : buttonMessage.ts)) {
                        return [2 /*return*/];
                    }
                    actionId = getFirstActionId(buttonMessage);
                    (0, vitest_1.expect)(actionId).toBeTruthy();
                    if (!actionId) {
                        return [2 /*return*/];
                    }
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    replied = false;
                    onInteraction = function (interaction) {
                        if (!interaction.isButton()) {
                            return;
                        }
                        void interaction.reply({
                            content: "button reply: ".concat(interaction.customId),
                        }).then(function () {
                            replied = true;
                        });
                    };
                    ctx.client.on('interactionCreate', onInteraction);
                    return [4 /*yield*/, (0, src_1.sendInteractivePayload)({
                            config: webhookConfig,
                            payload: {
                                type: 'block_actions',
                                user: {
                                    id: ctx.twin.resolveUserId('alice'),
                                    username: 'alice',
                                    name: 'alice',
                                },
                                channel: { id: channelId },
                                message: { ts: buttonMessage.ts },
                                container: {
                                    type: 'message',
                                    channel_id: channelId,
                                    message_ts: buttonMessage.ts,
                                },
                                trigger_id: 'trigger-button-reply',
                                response_url: 'https://example.invalid/response',
                                actions: [
                                    {
                                        action_id: actionId,
                                        type: 'button',
                                        value: 'clicked',
                                        block_id: 'b1',
                                        action_ts: '1700000000.000010',
                                    },
                                ],
                            },
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, replied ? true : undefined];
                                });
                            }); },
                            label: 'button interaction reply',
                        })];
                case 4:
                    _a.sent();
                    ctx.client.off('interactionCreate', onInteraction);
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                var text;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, ctx.twin.channel(channelId).text()];
                                        case 1:
                                            text = _a.sent();
                                            return [2 /*return*/, text.includes('test-bot: button reply: e2e-button-reply')
                                                    ? text
                                                    : undefined];
                                    }
                                });
                            }); },
                            label: 'button reply posted to slack',
                        })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('static select block action maps to StringSelectMenuInteraction and supports replies', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guild, channel, select, row, channelId, messages, selectMessage, actionId, webhookConfig, received, onInteraction, interaction;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    guild = ctx.client.guilds.cache.first();
                    channel = guild === null || guild === void 0 ? void 0 : guild.channels.cache.find(function (c) {
                        return c.isTextBased() && c.name === 'interactions';
                    });
                    select = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId('e2e-select')
                        .setPlaceholder('Choose level')
                        .addOptions([
                        { label: 'Low', value: 'low' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'High', value: 'high' },
                    ]);
                    row = new discord_js_1.ActionRowBuilder().addComponents(select);
                    return [4 /*yield*/, channel.send({
                            content: 'select test',
                            components: [row],
                        })];
                case 1:
                    _a.sent();
                    channelId = ctx.twin.resolveChannelId('interactions');
                    return [4 /*yield*/, ctx.twin.channel(channelId).getMessages()];
                case 2:
                    messages = _a.sent();
                    selectMessage = __spreadArray([], messages, true).reverse()
                        .find(function (message) {
                        return getFirstActionId(message) !== undefined;
                    });
                    (0, vitest_1.expect)(selectMessage).toBeDefined();
                    if (!(selectMessage === null || selectMessage === void 0 ? void 0 : selectMessage.ts)) {
                        return [2 /*return*/];
                    }
                    actionId = getFirstActionId(selectMessage);
                    (0, vitest_1.expect)(actionId).toBeTruthy();
                    if (!actionId) {
                        return [2 /*return*/];
                    }
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    onInteraction = function (interaction) {
                        if (!interaction.isStringSelectMenu()) {
                            return;
                        }
                        received = interaction;
                        void interaction.reply({
                            content: "select reply: ".concat(interaction.values.join(',')),
                        });
                    };
                    ctx.client.on('interactionCreate', onInteraction);
                    return [4 /*yield*/, (0, src_1.sendInteractivePayload)({
                            config: webhookConfig,
                            payload: {
                                type: 'block_actions',
                                user: {
                                    id: ctx.twin.resolveUserId('alice'),
                                    username: 'alice',
                                    name: 'alice',
                                },
                                channel: { id: channelId },
                                message: { ts: selectMessage.ts },
                                container: {
                                    type: 'message',
                                    channel_id: channelId,
                                    message_ts: selectMessage.ts,
                                },
                                trigger_id: 'trigger-select-reply',
                                response_url: 'https://example.invalid/response',
                                actions: [
                                    {
                                        action_id: actionId,
                                        type: 'static_select',
                                        selected_option: {
                                            value: 'medium',
                                            text: {
                                                type: 'plain_text',
                                                text: 'Medium',
                                            },
                                        },
                                        block_id: 'b-select',
                                        action_ts: '1700000000.000020',
                                    },
                                ],
                            },
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, received];
                                });
                            }); },
                            label: 'select interaction event',
                        })];
                case 4:
                    interaction = _a.sent();
                    ctx.client.off('interactionCreate', onInteraction);
                    (0, vitest_1.expect)({
                        customId: interaction.customId,
                        values: interaction.values,
                        componentType: interaction.componentType,
                    }).toMatchInlineSnapshot("\n      {\n        \"componentType\": 3,\n        \"customId\": \"e2e-select\",\n        \"values\": [\n          \"medium\",\n        ],\n      }\n    ");
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                var text;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, ctx.twin.channel(channelId).text()];
                                        case 1:
                                            text = _a.sent();
                                            return [2 /*return*/, text.includes('test-bot: select reply: medium') ? text : undefined];
                                    }
                                });
                            }); },
                            label: 'select reply posted to slack',
                        })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('external select block action maps to StringSelectMenuInteraction values', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, sourceMessage, webhookConfig, received, onInteraction, actionId, interaction;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channelId = ctx.twin.resolveChannelId('interactions');
                    return [4 /*yield*/, ctx.twin.user('alice').sendMessage({
                            channel: channelId,
                            text: 'external select source',
                        })];
                case 1:
                    sourceMessage = _a.sent();
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    onInteraction = function (interaction) {
                        if (!interaction.isStringSelectMenu()) {
                            return;
                        }
                        received = interaction;
                    };
                    ctx.client.on('interactionCreate', onInteraction);
                    actionId = (0, component_id_codec_js_1.encodeComponentActionId)({
                        componentType: v10_1.ComponentType.StringSelect,
                        customId: 'agent-autocomplete',
                    });
                    return [4 /*yield*/, (0, src_1.sendInteractivePayload)({
                            config: webhookConfig,
                            payload: {
                                type: 'block_actions',
                                user: {
                                    id: ctx.twin.resolveUserId('alice'),
                                    username: 'alice',
                                    name: 'alice',
                                },
                                channel: { id: channelId },
                                message: { ts: sourceMessage.ts },
                                container: {
                                    type: 'message',
                                    channel_id: channelId,
                                    message_ts: sourceMessage.ts,
                                },
                                trigger_id: 'trigger-external-select',
                                response_url: 'https://example.invalid/response',
                                actions: [
                                    {
                                        action_id: actionId,
                                        type: 'external_select',
                                        selected_option: {
                                            value: 'plan',
                                            text: {
                                                type: 'plain_text',
                                                text: 'plan',
                                            },
                                        },
                                        block_id: 'b-external-select',
                                        action_ts: '1700000000.000030',
                                    },
                                ],
                            },
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, received];
                                });
                            }); },
                            label: 'external select interaction event',
                        })];
                case 3:
                    interaction = _a.sent();
                    ctx.client.off('interactionCreate', onInteraction);
                    (0, vitest_1.expect)({
                        customId: interaction.customId,
                        values: interaction.values,
                        componentType: interaction.componentType,
                    }).toMatchInlineSnapshot("\n      {\n        \"componentType\": 3,\n        \"customId\": \"agent-autocomplete\",\n        \"values\": [\n          \"plan\",\n        ],\n      }\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
});
function getFirstActionId(message) {
    var blocks = Array.isArray(message.blocks) ? message.blocks : [];
    for (var _i = 0, blocks_1 = blocks; _i < blocks_1.length; _i++) {
        var block = blocks_1[_i];
        if (!(block && typeof block === 'object')) {
            continue;
        }
        var elements = Reflect.get(block, 'elements');
        if (!Array.isArray(elements)) {
            continue;
        }
        for (var _a = 0, elements_1 = elements; _a < elements_1.length; _a++) {
            var element = elements_1[_a];
            if (!(element && typeof element === 'object')) {
                continue;
            }
            var actionId = Reflect.get(element, 'action_id');
            if (typeof actionId === 'string') {
                return actionId;
            }
        }
    }
    return undefined;
}
