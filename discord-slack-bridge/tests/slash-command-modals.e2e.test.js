"use strict";
// E2E coverage for Slack slash command -> modal -> Discord chat command flow.
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
Object.defineProperty(exports, "__esModule", { value: true });
var v10_1 = require("discord-api-types/v10");
var vitest_1 = require("vitest");
var src_1 = require("slack-digital-twin/src");
var e2e_setup_js_1 = require("./e2e-setup.js");
(0, vitest_1.describe)('slash command modal flow', function () {
    var ctx;
    var applicationId;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)({
                        channels: [{ name: 'commands' }],
                        users: [{ name: 'alice', realName: 'Alice' }],
                    })];
                case 1:
                    ctx = _c.sent();
                    applicationId = (_b = (_a = ctx.client.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '';
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
    (0, vitest_1.test)('slash command opens modal with autocomplete + select fields and emits interaction on submit', function () { return __awaiter(void 0, void 0, void 0, function () {
        var putResponse, webhookConfig, receivedInteraction, onInteraction, slashResponse, openedView, callbackId, privateMetadata, submitResponse, interaction;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/applications/").concat(applicationId, "/guilds/").concat(ctx.twin.workspaceId, "/commands"), {
                        method: 'PUT',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify([
                            {
                                name: 'new-session',
                                description: 'Start a new session',
                                type: v10_1.ApplicationCommandType.ChatInput,
                                options: [
                                    {
                                        type: v10_1.ApplicationCommandOptionType.String,
                                        name: 'prompt',
                                        description: 'Prompt content',
                                        required: true,
                                    },
                                    {
                                        type: v10_1.ApplicationCommandOptionType.String,
                                        name: 'agent',
                                        description: 'Agent to use',
                                        required: false,
                                        autocomplete: true,
                                    },
                                    {
                                        type: v10_1.ApplicationCommandOptionType.String,
                                        name: 'scope',
                                        description: 'Scope',
                                        required: false,
                                        choices: [
                                            { name: 'Session', value: 'session' },
                                            { name: 'Channel', value: 'channel' },
                                        ],
                                    },
                                ],
                            },
                        ]),
                    })];
                case 1:
                    putResponse = _c.sent();
                    (0, vitest_1.expect)(putResponse.status).toBe(200);
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    ctx.twin.clearOpenedViews();
                    onInteraction = function (interaction) {
                        var _a, _b, _c;
                        if (!interaction.isChatInputCommand()) {
                            return;
                        }
                        if (interaction.commandName !== 'new-session') {
                            return;
                        }
                        receivedInteraction = interaction;
                        void interaction.reply({
                            content: [
                                (_a = interaction.options.getString('prompt')) !== null && _a !== void 0 ? _a : '',
                                (_b = interaction.options.getString('agent')) !== null && _b !== void 0 ? _b : '',
                                (_c = interaction.options.getString('scope')) !== null && _c !== void 0 ? _c : '',
                            ].join('|'),
                        });
                    };
                    ctx.client.on('interactionCreate', onInteraction);
                    return [4 /*yield*/, (0, src_1.sendSlashCommand)({
                            config: webhookConfig,
                            command: '/new-session',
                            text: 'ignored command text',
                            userId: ctx.twin.resolveUserId('alice'),
                            userName: 'alice',
                            channelId: ctx.twin.resolveChannelId('commands'),
                            channelName: 'commands',
                            triggerId: 'trigger-new-session',
                        })];
                case 2:
                    slashResponse = _c.sent();
                    (0, vitest_1.expect)(slashResponse.status).toBe(200);
                    return [4 /*yield*/, ctx.twin.waitForOpenedView({
                            predicate: function (view) {
                                var _a;
                                var callbackId = (_a = view.view) === null || _a === void 0 ? void 0 : _a['callback_id'];
                                return callbackId === 'new-session';
                            },
                        })];
                case 3:
                    openedView = _c.sent();
                    (0, vitest_1.expect)(openedView).toMatchInlineSnapshot("\n      {\n        \"trigger_id\": \"trigger-new-session\",\n        \"view\": {\n          \"blocks\": [\n            {\n              \"block_id\": \"prompt\",\n              \"element\": {\n                \"action_id\": \"prompt\",\n                \"multiline\": false,\n                \"placeholder\": {\n                  \"text\": \"prompt\",\n                  \"type\": \"plain_text\",\n                },\n                \"type\": \"plain_text_input\",\n              },\n              \"label\": {\n                \"text\": \"Prompt content\",\n                \"type\": \"plain_text\",\n              },\n              \"optional\": false,\n              \"type\": \"input\",\n            },\n            {\n              \"block_id\": \"agent\",\n              \"element\": {\n                \"action_id\": \"agent\",\n                \"min_query_length\": 1,\n                \"placeholder\": {\n                  \"text\": \"agent\",\n                  \"type\": \"plain_text\",\n                },\n                \"type\": \"external_select\",\n              },\n              \"label\": {\n                \"text\": \"Agent to use\",\n                \"type\": \"plain_text\",\n              },\n              \"optional\": true,\n              \"type\": \"input\",\n            },\n            {\n              \"block_id\": \"scope\",\n              \"element\": {\n                \"action_id\": \"scope\",\n                \"options\": [\n                  {\n                    \"text\": {\n                      \"text\": \"Session\",\n                      \"type\": \"plain_text\",\n                    },\n                    \"value\": \"session\",\n                  },\n                  {\n                    \"text\": {\n                      \"text\": \"Channel\",\n                      \"type\": \"plain_text\",\n                    },\n                    \"value\": \"channel\",\n                  },\n                ],\n                \"placeholder\": {\n                  \"text\": \"scope\",\n                  \"type\": \"plain_text\",\n                },\n                \"type\": \"static_select\",\n              },\n              \"label\": {\n                \"text\": \"Scope\",\n                \"type\": \"plain_text\",\n              },\n              \"optional\": true,\n              \"type\": \"input\",\n            },\n          ],\n          \"callback_id\": \"new-session\",\n          \"close\": {\n            \"text\": \"Cancel\",\n            \"type\": \"plain_text\",\n          },\n          \"private_metadata\": \"{\"commandName\":\"new-session\",\"channelId\":\"C000000001\",\"options\":[{\"name\":\"prompt\",\"type\":3},{\"name\":\"agent\",\"type\":3},{\"name\":\"scope\",\"type\":3}]}\",\n          \"submit\": {\n            \"text\": \"Run\",\n            \"type\": \"plain_text\",\n          },\n          \"title\": {\n            \"text\": \"new-session\",\n            \"type\": \"plain_text\",\n          },\n          \"type\": \"modal\",\n        },\n      }\n    ");
                    (0, vitest_1.expect)(receivedInteraction).toBeUndefined();
                    callbackId = (_a = openedView.view) === null || _a === void 0 ? void 0 : _a['callback_id'];
                    (0, vitest_1.expect)(typeof callbackId).toBe('string');
                    if (typeof callbackId !== 'string') {
                        return [2 /*return*/];
                    }
                    privateMetadata = (_b = openedView.view) === null || _b === void 0 ? void 0 : _b['private_metadata'];
                    return [4 /*yield*/, (0, src_1.sendInteractivePayload)({
                            config: webhookConfig,
                            payload: {
                                type: 'view_submission',
                                trigger_id: 'trigger-new-session-submit',
                                team: { id: ctx.twin.workspaceId },
                                user: {
                                    id: ctx.twin.resolveUserId('alice'),
                                    username: 'alice',
                                    name: 'alice',
                                },
                                view: {
                                    id: 'V_NEW_SESSION',
                                    callback_id: callbackId,
                                    private_metadata: typeof privateMetadata === 'string' ? privateMetadata : undefined,
                                    state: {
                                        values: {
                                            prompt: {
                                                prompt: { value: 'Build the command bridge' },
                                            },
                                            agent: {
                                                agent: {
                                                    selected_option: { value: 'plan' },
                                                },
                                            },
                                            scope: {
                                                scope: {
                                                    selected_option: { value: 'session' },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        })];
                case 4:
                    submitResponse = _c.sent();
                    (0, vitest_1.expect)(submitResponse.status).toBe(200);
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, receivedInteraction];
                                });
                            }); },
                            label: 'slash modal submit interaction',
                        })];
                case 5:
                    interaction = _c.sent();
                    ctx.client.off('interactionCreate', onInteraction);
                    (0, vitest_1.expect)({
                        commandName: interaction.commandName,
                        prompt: interaction.options.getString('prompt'),
                        agent: interaction.options.getString('agent'),
                        scope: interaction.options.getString('scope'),
                    }).toMatchInlineSnapshot("\n      {\n        \"agent\": \"plan\",\n        \"commandName\": \"new-session\",\n        \"prompt\": \"Build the command bridge\",\n        \"scope\": \"session\",\n      }\n    ");
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                var text;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, ctx.twin.channel('commands').text()];
                                        case 1:
                                            text = _a.sent();
                                            return [2 /*return*/, text.includes('test-bot: Build the command bridge|plan|session')
                                                    ? text
                                                    : undefined];
                                    }
                                });
                            }); },
                            label: 'command reply posted to slack',
                        })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('block_suggestion routes through discord autocomplete and returns slack options', function () { return __awaiter(void 0, void 0, void 0, function () {
        var putResponse, webhookConfig, slashResponse, openedView, privateMetadata, autocompleteInteraction, onInteraction, suggestionResponse, responseData, interaction;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/applications/").concat(applicationId, "/guilds/").concat(ctx.twin.workspaceId, "/commands"), {
                        method: 'PUT',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify([
                            {
                                name: 'new-worktree',
                                description: 'Create a worktree',
                                type: v10_1.ApplicationCommandType.ChatInput,
                                options: [
                                    {
                                        type: v10_1.ApplicationCommandOptionType.String,
                                        name: 'name',
                                        description: 'Worktree name',
                                        required: false,
                                    },
                                    {
                                        type: v10_1.ApplicationCommandOptionType.String,
                                        name: 'base-branch',
                                        description: 'Base branch',
                                        required: false,
                                        autocomplete: true,
                                    },
                                ],
                            },
                        ]),
                    })];
                case 1:
                    putResponse = _b.sent();
                    (0, vitest_1.expect)(putResponse.status).toBe(200);
                    webhookConfig = ctx.twin.webhookSenderConfig;
                    (0, vitest_1.expect)(webhookConfig).toBeDefined();
                    if (!webhookConfig) {
                        return [2 /*return*/];
                    }
                    ctx.twin.clearOpenedViews();
                    return [4 /*yield*/, (0, src_1.sendSlashCommand)({
                            config: webhookConfig,
                            command: '/new-worktree',
                            text: '',
                            userId: ctx.twin.resolveUserId('alice'),
                            userName: 'alice',
                            channelId: ctx.twin.resolveChannelId('commands'),
                            channelName: 'commands',
                            triggerId: 'trigger-new-worktree',
                        })];
                case 2:
                    slashResponse = _b.sent();
                    (0, vitest_1.expect)(slashResponse.status).toBe(200);
                    return [4 /*yield*/, ctx.twin.waitForOpenedView({
                            predicate: function (view) {
                                var _a;
                                var callbackId = (_a = view.view) === null || _a === void 0 ? void 0 : _a['callback_id'];
                                return callbackId === 'new-worktree';
                            },
                        })];
                case 3:
                    openedView = _b.sent();
                    privateMetadata = (_a = openedView.view) === null || _a === void 0 ? void 0 : _a['private_metadata'];
                    onInteraction = function (interaction) {
                        if (!interaction.isAutocomplete()) {
                            return;
                        }
                        if (interaction.commandName !== 'new-worktree') {
                            return;
                        }
                        autocompleteInteraction = interaction;
                        void interaction.respond([
                            { name: 'main', value: 'main' },
                            { name: 'develop', value: 'develop' },
                        ]);
                    };
                    ctx.client.on('interactionCreate', onInteraction);
                    return [4 /*yield*/, (0, src_1.sendInteractivePayload)({
                            config: webhookConfig,
                            payload: {
                                type: 'block_suggestion',
                                team: { id: ctx.twin.workspaceId },
                                user: {
                                    id: ctx.twin.resolveUserId('alice'),
                                    username: 'alice',
                                    name: 'alice',
                                },
                                channel: { id: ctx.twin.resolveChannelId('commands') },
                                action_id: 'base-branch',
                                value: 'ma',
                                view: {
                                    id: 'V_NEW_WORKTREE',
                                    callback_id: 'new-worktree',
                                    private_metadata: typeof privateMetadata === 'string' ? privateMetadata : undefined,
                                },
                            },
                        })];
                case 4:
                    suggestionResponse = _b.sent();
                    return [4 /*yield*/, suggestionResponse.json()];
                case 5:
                    responseData = _b.sent();
                    (0, vitest_1.expect)(suggestionResponse.status).toBe(200);
                    return [4 /*yield*/, (0, e2e_setup_js_1.waitFor)({
                            fn: function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, autocompleteInteraction];
                                });
                            }); },
                            label: 'autocomplete interaction',
                        })];
                case 6:
                    interaction = _b.sent();
                    ctx.client.off('interactionCreate', onInteraction);
                    (0, vitest_1.expect)({
                        commandName: interaction.commandName,
                        focused: interaction.options.getFocused(true),
                        responseData: responseData,
                    }).toMatchInlineSnapshot("\n      {\n        \"commandName\": \"new-worktree\",\n        \"focused\": {\n          \"focused\": true,\n          \"name\": \"base-branch\",\n          \"type\": 3,\n          \"value\": \"ma\",\n        },\n        \"responseData\": {\n          \"options\": [\n            {\n              \"text\": {\n                \"text\": \"main\",\n                \"type\": \"plain_text\",\n              },\n              \"value\": \"main\",\n            },\n            {\n              \"text\": {\n                \"text\": \"develop\",\n                \"type\": \"plain_text\",\n              },\n              \"value\": \"develop\",\n            },\n          ],\n        },\n      }\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
});
