"use strict";
// Echo bot: tests discord-slack-bridge against a real Slack workspace.
// Required env vars: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET.
// Required Slack app setup:
// - Event Subscriptions Request URL -> {tunnel}/slack/events
// - Interactivity & Shortcuts Request URL -> {tunnel}/slack/events
// - Bot token scope includes files:write for demo:image and demo:text-file.
// Usage: cd discord-slack-bridge && pnpm echo-bot
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var discord_js_1 = require("discord.js");
var node_fs_1 = require("node:fs");
var web_api_1 = require("@slack/web-api");
var v10_1 = require("discord-api-types/v10");
var client_1 = require("traforo/client");
var src_1 = require("db/src");
var index_js_1 = require("../src/index.js");
var TUNNEL_ID = 'dsb-echo-bot';
var BRIDGE_PORT = Number((_a = process.env.ECHO_BOT_PORT) !== null && _a !== void 0 ? _a : '3710');
var PREVIEW_GATEWAY_BASE_URL = 'https://preview-slack-gateway.kimaki.dev';
var PREVIEW_WORKSPACE_ID = 'T08NQ7ULTUL';
var PREVIEW_CLIENT_ID = 'echo-bot-client';
var PREVIEW_MAPPING_USER_EMAIL = 'beats.by.morse@gmail.com';
var OPEN_MODAL_BUTTON_ID = 'demo-open-modal';
var STATUS_BUTTON_ID = 'demo-status-button';
var TABLE_BUTTON_ID = 'demo-table-button';
var DEMO_SELECT_ID = 'demo-select';
var DEMO_MODAL_ID = 'demo-modal';
var DEMO_MODAL_INPUT_ID = 'demo-modal-input';
var DEMO_IMAGE_FILE_URL = new URL('./demo-image.jpeg', import.meta.url);
var DEMO_COMMANDS = [
    { name: 'demo-buttons', description: 'Send button demo message' },
    { name: 'demo-select', description: 'Send select demo message' },
    { name: 'demo-modal', description: 'Send modal demo trigger button' },
    { name: 'demo-typing', description: 'Show typing indicator then send reply' },
    { name: 'demo-image', description: 'Send image upload demo' },
    { name: 'demo-text-file', description: 'Send text file upload demo' },
    { name: 'demo-table', description: 'Send table demo' },
    { name: 'demo-all', description: 'Run all demos' },
    { name: 'demo-help', description: 'Show available demo commands' },
];
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var slackBotToken, slackSigningSecret, gatewayMode, tempClient, authResult, workspaceId, localRuntime, _a, gatewayRuntime, client, readyPromise, guild, channels, channelNames, shutdown;
        var _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    slackBotToken = requireEnv('SLACK_BOT_TOKEN');
                    slackSigningSecret = requireEnv('SLACK_SIGNING_SECRET');
                    gatewayMode = readGatewayModeArgv();
                    tempClient = new web_api_1.WebClient(slackBotToken);
                    return [4 /*yield*/, tempClient.auth.test()];
                case 1:
                    authResult = _h.sent();
                    workspaceId = authResult.team_id;
                    if (!workspaceId) {
                        throw new Error('Could not resolve workspace ID from auth.test');
                    }
                    console.log("Slack workspace: ".concat(authResult.team, " (").concat(workspaceId, ")"));
                    console.log("Bot user: ".concat(authResult.user, " (").concat(authResult.user_id, ")"));
                    if (!gatewayMode) return [3 /*break*/, 2];
                    _a = null;
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, startLocalRuntime({
                        slackBotToken: slackBotToken,
                        slackSigningSecret: slackSigningSecret,
                        workspaceId: workspaceId,
                    })];
                case 3:
                    _a = _h.sent();
                    _h.label = 4;
                case 4:
                    localRuntime = _a;
                    gatewayRuntime = gatewayMode
                        ? createDeployedRuntime({
                            slackBotToken: slackBotToken,
                            gatewayMode: gatewayMode,
                        })
                        : {
                            restUrl: (_b = localRuntime === null || localRuntime === void 0 ? void 0 : localRuntime.bridge.restUrl) !== null && _b !== void 0 ? _b : '',
                            gatewayUrl: (_c = localRuntime === null || localRuntime === void 0 ? void 0 : localRuntime.bridge.gatewayUrl) !== null && _c !== void 0 ? _c : '',
                            discordToken: (_d = localRuntime === null || localRuntime === void 0 ? void 0 : localRuntime.bridge.discordToken) !== null && _d !== void 0 ? _d : '',
                            slackWebhookUrl: (_e = localRuntime === null || localRuntime === void 0 ? void 0 : localRuntime.slackWebhookUrl) !== null && _e !== void 0 ? _e : '',
                            workspaceId: workspaceId,
                        };
                    if (!gatewayMode && localRuntime) {
                        console.log("Bridge: REST=".concat(localRuntime.bridge.restUrl, " Gateway=").concat(localRuntime.bridge.gatewayUrl));
                        console.log("Tunnel: ".concat(localRuntime.tunnel.url));
                    }
                    if (!gatewayMode) return [3 /*break*/, 6];
                    return [4 /*yield*/, ensureGatewayClientMapping({
                            workspaceId: workspaceId,
                            clientId: (_f = process.env.ECHO_BOT_CLIENT_ID) !== null && _f !== void 0 ? _f : PREVIEW_CLIENT_ID,
                        })];
                case 5:
                    _h.sent();
                    console.log("Gateway mode: using deployed bridge at ".concat(gatewayMode.baseUrl));
                    _h.label = 6;
                case 6:
                    console.log("Slack Event Subscriptions URL: ".concat(gatewayRuntime.slackWebhookUrl));
                    console.log("Slack Interactivity Request URL: ".concat(gatewayRuntime.slackWebhookUrl));
                    console.log('Required bot scopes for demos: chat:write, channels:read, channels:history, groups:read, groups:history, files:write');
                    client = new discord_js_1.Client({
                        intents: [
                            discord_js_1.GatewayIntentBits.Guilds,
                            discord_js_1.GatewayIntentBits.GuildMessages,
                            discord_js_1.GatewayIntentBits.MessageContent,
                        ],
                        partials: [discord_js_1.Partials.Channel, discord_js_1.Partials.Message],
                        rest: { api: gatewayRuntime.restUrl, version: '10' },
                    });
                    readyPromise = new Promise(function (resolve) {
                        client.once('ready', function () {
                            resolve();
                        });
                    });
                    return [4 /*yield*/, client.login(gatewayRuntime.discordToken)];
                case 7:
                    _h.sent();
                    return [4 /*yield*/, readyPromise];
                case 8:
                    _h.sent();
                    guild = (_g = client.guilds.cache.get(gatewayRuntime.workspaceId)) !== null && _g !== void 0 ? _g : client.guilds.cache.first();
                    console.log("Bot ready! Guild: ".concat(guild === null || guild === void 0 ? void 0 : guild.name, " (").concat(guild === null || guild === void 0 ? void 0 : guild.id, ")"));
                    return [4 /*yield*/, (guild === null || guild === void 0 ? void 0 : guild.channels.fetch())];
                case 9:
                    channels = _h.sent();
                    channelNames = channels === null || channels === void 0 ? void 0 : channels.map(function (c) {
                        return c === null || c === void 0 ? void 0 : c.name;
                    }).filter(Boolean);
                    console.log("Channels: ".concat(channelNames === null || channelNames === void 0 ? void 0 : channelNames.join(', ')));
                    if (!(guild && client.user)) return [3 /*break*/, 11];
                    return [4 /*yield*/, registerDemoCommands({
                            client: client,
                            applicationId: client.user.id,
                            guildId: guild.id,
                        })];
                case 10:
                    _h.sent();
                    _h.label = 11;
                case 11:
                    client.on('messageCreate', function (message) {
                        void handleMessageCreate({ client: client, message: message }).catch(function (error) {
                            console.error('messageCreate handler failed', error);
                        });
                    });
                    client.on('interactionCreate', function (interaction) {
                        void handleInteractionCreate({ interaction: interaction }).catch(function (error) {
                            console.error('interactionCreate handler failed', error);
                        });
                    });
                    console.log('\nEcho bot running. Press Ctrl+C to stop.\n');
                    shutdown = function () {
                        var _a;
                        console.log('\nShutting down...');
                        client.destroy();
                        localRuntime === null || localRuntime === void 0 ? void 0 : localRuntime.tunnel.close();
                        void ((_a = localRuntime === null || localRuntime === void 0 ? void 0 : localRuntime.bridge.stop()) !== null && _a !== void 0 ? _a : Promise.resolve()).then(function () {
                            process.exit(0);
                        });
                    };
                    process.on('SIGINT', shutdown);
                    process.on('SIGTERM', shutdown);
                    process.on('unhandledRejection', function (error) {
                        console.error('unhandledRejection', describeError(error));
                    });
                    process.on('uncaughtException', function (error) {
                        console.error('uncaughtException', describeError(error));
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function startLocalRuntime(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var bridge, tunnel;
        var slackBotToken = _b.slackBotToken, slackSigningSecret = _b.slackSigningSecret, workspaceId = _b.workspaceId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    bridge = new index_js_1.SlackBridge({
                        slackBotToken: slackBotToken,
                        slackSigningSecret: slackSigningSecret,
                        workspaceId: workspaceId,
                        port: BRIDGE_PORT,
                    });
                    return [4 /*yield*/, bridge.start()];
                case 1:
                    _c.sent();
                    tunnel = new client_1.TunnelClient({
                        localPort: bridge.port,
                        tunnelId: TUNNEL_ID,
                    });
                    return [4 /*yield*/, tunnel.connect()];
                case 2:
                    _c.sent();
                    return [2 /*return*/, {
                            bridge: bridge,
                            tunnel: tunnel,
                            slackWebhookUrl: "".concat(tunnel.url, "/slack/events"),
                        }];
            }
        });
    });
}
function createDeployedRuntime(_a) {
    var _b, _c, _d;
    var slackBotToken = _a.slackBotToken, gatewayMode = _a.gatewayMode;
    var baseUrl = new URL(gatewayMode.baseUrl);
    var gatewayUrl = new URL('/slack/gateway', baseUrl);
    gatewayUrl.protocol = gatewayUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    gatewayUrl.searchParams.set('clientId', (_b = process.env.ECHO_BOT_CLIENT_ID) !== null && _b !== void 0 ? _b : PREVIEW_CLIENT_ID);
    return {
        restUrl: new URL('/api', baseUrl).toString(),
        gatewayUrl: gatewayUrl.toString(),
        discordToken: (_c = process.env.ECHO_BOT_GATEWAY_TOKEN) !== null && _c !== void 0 ? _c : slackBotToken,
        slackWebhookUrl: new URL('/slack/events', baseUrl).toString(),
        workspaceId: (_d = process.env.ECHO_BOT_WORKSPACE_ID) !== null && _d !== void 0 ? _d : PREVIEW_WORKSPACE_ID,
    };
}
function readGatewayModeArgv() {
    var args = process.argv.slice(2);
    var gatewayFlag = args.find(function (arg) {
        return arg === '--gateway' || arg.startsWith('--gateway=');
    });
    if (!gatewayFlag) {
        return null;
    }
    var value = gatewayFlag.startsWith('--gateway=')
        ? gatewayFlag.slice('--gateway='.length)
        : PREVIEW_GATEWAY_BASE_URL;
    var baseUrl = new URL(value).toString();
    return { baseUrl: baseUrl };
}
function handleMessageCreate(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var isSelf, thread, target, sent_1, normalized, handled, _c, sent;
        var client = _b.client, message = _b.message;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    isSelf = client.user && message.author.id === client.user.id;
                    if (isSelf || message.author.bot) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, resolveReplyThread({ message: message })];
                case 1:
                    thread = _d.sent();
                    target = thread !== null && thread !== void 0 ? thread : message.channel;
                    console.log("[echo] \"".concat(message.content, "\" from ").concat(message.author.username));
                    return [4 /*yield*/, pulseTyping({
                            target: target,
                            context: 'message:start',
                        })];
                case 2:
                    _d.sent();
                    if (!(message.attachments.size > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, trySend({
                            target: target,
                            payload: formatAttachmentSummary({ message: message }),
                            context: 'attachment summary response',
                        })];
                case 3:
                    sent_1 = _d.sent();
                    if (!!sent_1) return [3 /*break*/, 5];
                    return [4 /*yield*/, trySend({
                            target: target,
                            payload: 'Could not send attachment summary (bridge returned an error).',
                            context: 'attachment summary fallback',
                        })];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5: return [2 /*return*/];
                case 6:
                    normalized = message.content.trim().toLowerCase();
                    if (!thread) return [3 /*break*/, 8];
                    return [4 /*yield*/, handleDemoSwitch({
                            client: client,
                            command: normalized,
                            thread: thread,
                            username: message.author.username,
                        })];
                case 7:
                    _c = _d.sent();
                    return [3 /*break*/, 9];
                case 8:
                    _c = false;
                    _d.label = 9;
                case 9:
                    handled = _c;
                    if (handled) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, trySend({
                            target: target,
                            payload: "echo: ".concat(message.content),
                            context: 'default echo',
                        })];
                case 10:
                    sent = _d.sent();
                    if (!!sent) return [3 /*break*/, 12];
                    return [4 /*yield*/, trySend({
                            target: target,
                            payload: 'Echo failed (bridge returned an error).',
                            context: 'default echo fallback',
                        })];
                case 11:
                    _d.sent();
                    _d.label = 12;
                case 12: return [2 /*return*/];
            }
        });
    });
}
function handleDemoSwitch(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, row, select, row, row, sent, image, sent, file, sent, sent, buttonRow, select, selectRow, image, imageSent, file, fileSent, tableSent;
        var _d, _e;
        var client = _b.client, command = _b.command, thread = _b.thread, username = _b.username;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, pulseTyping({
                        target: thread,
                        context: "demo:".concat(command || 'empty'),
                    })];
                case 1:
                    _f.sent();
                    _c = command;
                    switch (_c) {
                        case 'demo:buttons': return [3 /*break*/, 2];
                        case 'demo:select': return [3 /*break*/, 4];
                        case 'demo:modal': return [3 /*break*/, 6];
                        case 'demo:typing': return [3 /*break*/, 8];
                        case 'demo:image': return [3 /*break*/, 14];
                        case 'demo:text-file': return [3 /*break*/, 18];
                        case 'demo:table': return [3 /*break*/, 22];
                        case 'demo:all': return [3 /*break*/, 26];
                        case 'demo:help': return [3 /*break*/, 39];
                    }
                    return [3 /*break*/, 41];
                case 2:
                    row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId(STATUS_BUTTON_ID)
                        .setLabel('Show status')
                        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
                        .setCustomId(TABLE_BUTTON_ID)
                        .setLabel('Show table')
                        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
                        .setCustomId(OPEN_MODAL_BUTTON_ID)
                        .setLabel('Open modal')
                        .setStyle(discord_js_1.ButtonStyle.Success));
                    return [4 /*yield*/, thread.send({
                            content: "Button demo for ".concat(username),
                            components: [row],
                        })];
                case 3:
                    _f.sent();
                    return [2 /*return*/, true];
                case 4:
                    select = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId(DEMO_SELECT_ID)
                        .setPlaceholder('Pick an option')
                        .addOptions([
                        { label: 'Low', value: 'low', description: 'Minimal output' },
                        { label: 'Medium', value: 'medium', description: 'Balanced output' },
                        { label: 'High', value: 'high', description: 'Verbose output' },
                    ]);
                    row = new discord_js_1.ActionRowBuilder().addComponents(select);
                    return [4 /*yield*/, thread.send({
                            content: 'Select menu demo',
                            components: [row],
                        })];
                case 5:
                    _f.sent();
                    return [2 /*return*/, true];
                case 6:
                    row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId(OPEN_MODAL_BUTTON_ID)
                        .setLabel('Open input modal')
                        .setStyle(discord_js_1.ButtonStyle.Primary));
                    return [4 /*yield*/, thread.send({
                            content: 'Click to open a modal input',
                            components: [row],
                        })];
                case 7:
                    _f.sent();
                    return [2 /*return*/, true];
                case 8: return [4 /*yield*/, pulseTyping({
                        target: thread,
                        context: 'demo:typing pre-delay',
                    })];
                case 9:
                    _f.sent();
                    return [4 /*yield*/, sleep({
                            ms: 3000,
                        })];
                case 10:
                    _f.sent();
                    return [4 /*yield*/, trySend({
                            target: thread,
                            payload: 'Typing demo done after 3 seconds.',
                            context: 'demo:typing message',
                        })];
                case 11:
                    sent = _f.sent();
                    if (!!sent) return [3 /*break*/, 13];
                    return [4 /*yield*/, thread.send('Typing demo failed (bridge returned an error).')];
                case 12:
                    _f.sent();
                    _f.label = 13;
                case 13: return [2 /*return*/, true];
                case 14:
                    image = createDemoImageAttachment();
                    return [4 /*yield*/, trySend({
                            target: thread,
                            payload: {
                                content: 'Image upload demo',
                                files: [image],
                            },
                            context: 'demo:image upload',
                        })];
                case 15:
                    sent = _f.sent();
                    if (!!sent) return [3 /*break*/, 17];
                    return [4 /*yield*/, thread.send('Image upload demo failed. Check bridge logs for missing_scope (files:write) or multipart upload issues.')];
                case 16:
                    _f.sent();
                    _f.label = 17;
                case 17: return [2 /*return*/, true];
                case 18:
                    file = new discord_js_1.AttachmentBuilder(Buffer.from('demo text file\nbridge: discord-slack-bridge\n', 'utf8'), {
                        name: 'demo-note.txt',
                    });
                    return [4 /*yield*/, trySend({
                            target: thread,
                            payload: {
                                content: 'Text file upload demo',
                                files: [file],
                            },
                            context: 'demo:text-file upload',
                        })];
                case 19:
                    sent = _f.sent();
                    if (!!sent) return [3 /*break*/, 21];
                    return [4 /*yield*/, thread.send('Text file upload demo failed. Check bridge logs for missing_scope (files:write) or multipart upload issues.')];
                case 20:
                    _f.sent();
                    _f.label = 21;
                case 21: return [2 /*return*/, true];
                case 22: return [4 /*yield*/, sendV2TableMessage({
                        client: client,
                        thread: thread,
                        username: username,
                        title: 'Runtime table',
                    })];
                case 23:
                    sent = _f.sent();
                    if (!!sent) return [3 /*break*/, 25];
                    return [4 /*yield*/, thread.send({
                            content: [
                                'Runtime table',
                                '| Field | Value |',
                                '| --- | --- |',
                                "| User | ".concat(username, " |"),
                                "| Channel | ".concat((_d = thread.parentId) !== null && _d !== void 0 ? _d : 'unknown', " |"),
                                "| Thread | ".concat(thread.id, " |"),
                                "| Timestamp | ".concat(new Date().toISOString(), " |"),
                            ].join('\n'),
                        })];
                case 24:
                    _f.sent();
                    _f.label = 25;
                case 25: return [2 /*return*/, true];
                case 26:
                    buttonRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                        .setCustomId(STATUS_BUTTON_ID)
                        .setLabel('Show status')
                        .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
                        .setCustomId(TABLE_BUTTON_ID)
                        .setLabel('Show table')
                        .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
                        .setCustomId(OPEN_MODAL_BUTTON_ID)
                        .setLabel('Open modal')
                        .setStyle(discord_js_1.ButtonStyle.Success));
                    return [4 /*yield*/, thread.send({
                            content: "Button demo for ".concat(username),
                            components: [buttonRow],
                        })];
                case 27:
                    _f.sent();
                    select = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId(DEMO_SELECT_ID)
                        .setPlaceholder('Pick an option')
                        .addOptions([
                        { label: 'Low', value: 'low', description: 'Minimal output' },
                        { label: 'Medium', value: 'medium', description: 'Balanced output' },
                        { label: 'High', value: 'high', description: 'Verbose output' },
                    ]);
                    selectRow = new discord_js_1.ActionRowBuilder().addComponents(select);
                    return [4 /*yield*/, thread.send({
                            content: 'Select menu demo',
                            components: [selectRow],
                        })];
                case 28:
                    _f.sent();
                    image = createDemoImageAttachment();
                    return [4 /*yield*/, trySend({
                            target: thread,
                            payload: {
                                content: 'Image upload demo',
                                files: [image],
                            },
                            context: 'demo:all image upload',
                        })];
                case 29:
                    imageSent = _f.sent();
                    if (!!imageSent) return [3 /*break*/, 31];
                    return [4 /*yield*/, thread.send('Image upload demo failed. Check bridge logs for missing_scope (files:write) or multipart upload issues.')];
                case 30:
                    _f.sent();
                    _f.label = 31;
                case 31:
                    file = new discord_js_1.AttachmentBuilder(Buffer.from('demo text file\nbridge: discord-slack-bridge\n', 'utf8'), {
                        name: 'demo-note.txt',
                    });
                    return [4 /*yield*/, trySend({
                            target: thread,
                            payload: {
                                content: 'Text file upload demo',
                                files: [file],
                            },
                            context: 'demo:all text upload',
                        })];
                case 32:
                    fileSent = _f.sent();
                    if (!!fileSent) return [3 /*break*/, 34];
                    return [4 /*yield*/, thread.send('Text file upload demo failed. Check bridge logs for missing_scope (files:write) or multipart upload issues.')];
                case 33:
                    _f.sent();
                    _f.label = 34;
                case 34: return [4 /*yield*/, sendV2TableMessage({
                        client: client,
                        thread: thread,
                        username: username,
                        title: 'Runtime table',
                    })];
                case 35:
                    tableSent = _f.sent();
                    if (!!tableSent) return [3 /*break*/, 37];
                    return [4 /*yield*/, thread.send({
                            content: [
                                'Runtime table',
                                '| Field | Value |',
                                '| --- | --- |',
                                "| User | ".concat(username, " |"),
                                "| Channel | ".concat((_e = thread.parentId) !== null && _e !== void 0 ? _e : 'unknown', " |"),
                                "| Thread | ".concat(thread.id, " |"),
                                "| Timestamp | ".concat(new Date().toISOString(), " |"),
                            ].join('\n'),
                        })];
                case 36:
                    _f.sent();
                    _f.label = 37;
                case 37: return [4 /*yield*/, thread.send({
                        content: 'Modal demo: click "Open modal" from the button message above.',
                    })];
                case 38:
                    _f.sent();
                    return [2 /*return*/, true];
                case 39: return [4 /*yield*/, thread.send({
                        content: [
                            'Available demo commands:',
                            '- demo:buttons',
                            '- demo:select',
                            '- demo:modal',
                            '- demo:typing',
                            '- demo:image',
                            '- demo:text-file',
                            '- demo:table',
                            '- demo:all',
                            '- demo:help',
                        ].join('\n'),
                    })];
                case 40:
                    _f.sent();
                    return [2 /*return*/, true];
                case 41:
                    {
                        return [2 /*return*/, false];
                    }
                    _f.label = 42;
                case 42: return [2 /*return*/];
            }
        });
    });
}
function handleInteractionCreate(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var interaction = _b.interaction;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!interaction.isButton()) return [3 /*break*/, 2];
                    console.log('interactionCreate button', {
                        customId: interaction.customId,
                        userId: interaction.user.id,
                    });
                    return [4 /*yield*/, handleButtonInteraction({ interaction: interaction })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    if (!interaction.isChatInputCommand()) return [3 /*break*/, 4];
                    console.log('interactionCreate slash command', {
                        name: interaction.commandName,
                        userId: interaction.user.id,
                    });
                    return [4 /*yield*/, handleSlashCommandInteraction({
                            client: interaction.client,
                            interaction: interaction,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4:
                    if (!interaction.isStringSelectMenu()) return [3 /*break*/, 6];
                    console.log('interactionCreate select', {
                        customId: interaction.customId,
                        values: interaction.values,
                        userId: interaction.user.id,
                    });
                    return [4 /*yield*/, handleSelectInteraction({ interaction: interaction })];
                case 5:
                    _c.sent();
                    return [2 /*return*/];
                case 6:
                    if (!interaction.isModalSubmit()) return [3 /*break*/, 8];
                    console.log('interactionCreate modal', {
                        customId: interaction.customId,
                        userId: interaction.user.id,
                    });
                    return [4 /*yield*/, handleModalSubmitInteraction({ interaction: interaction })];
                case 7:
                    _c.sent();
                    _c.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    });
}
function handleSlashCommandInteraction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var thread, handled;
        var client = _b.client, interaction = _b.interaction;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, interaction.deferReply({
                        ephemeral: true,
                    })];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, resolveReplyThreadFromInteraction({ interaction: interaction })];
                case 2:
                    thread = _c.sent();
                    if (!!thread) return [3 /*break*/, 4];
                    return [4 /*yield*/, interaction.editReply('Could not resolve or create a reply thread in this channel.')];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, pulseTyping({
                        thread: thread,
                        context: "slash:".concat(interaction.commandName),
                    })];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, handleDemoSwitch({
                            client: client,
                            command: toDemoTextCommand({ slashCommandName: interaction.commandName }),
                            thread: thread,
                            username: interaction.user.username,
                        })];
                case 6:
                    handled = _c.sent();
                    if (!!handled) return [3 /*break*/, 8];
                    return [4 /*yield*/, interaction.editReply("Unknown demo command: ".concat(interaction.commandName))];
                case 7:
                    _c.sent();
                    return [2 /*return*/];
                case 8: return [4 /*yield*/, interaction.editReply("Ran ".concat(interaction.commandName, " in <#").concat(thread.id, ">"))];
                case 9:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function toDemoTextCommand(_a) {
    var slashCommandName = _a.slashCommandName;
    return slashCommandName.replace('-', ':');
}
function registerDemoCommands(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var client = _b.client, applicationId = _b.applicationId, guildId = _b.guildId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, client.rest.put(v10_1.Routes.applicationGuildCommands(applicationId, guildId), {
                        body: DEMO_COMMANDS,
                    })];
                case 1:
                    _c.sent();
                    console.log('Registered guild slash commands', {
                        commandNames: DEMO_COMMANDS.map(function (command) {
                            return command.name;
                        }),
                        guildId: guildId,
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function handleButtonInteraction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var modal, input, row;
        var interaction = _b.interaction;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(interaction.customId === STATUS_BUTTON_ID)) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Status button clicked',
                            ephemeral: true,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    if (!(interaction.customId === TABLE_BUTTON_ID)) return [3 /*break*/, 4];
                    return [4 /*yield*/, interaction.reply({
                            content: [
                                'Button-triggered table',
                                '| Metric | Value |',
                                '| --- | --- |',
                                "| User | ".concat(interaction.user.username, " |"),
                                "| Message ID | ".concat(interaction.message.id, " |"),
                                "| Custom ID | ".concat(interaction.customId, " |"),
                            ].join('\n'),
                            ephemeral: true,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4:
                    if (!(interaction.customId === OPEN_MODAL_BUTTON_ID)) return [3 /*break*/, 6];
                    modal = new discord_js_1.ModalBuilder()
                        .setCustomId(DEMO_MODAL_ID)
                        .setTitle('Demo input modal');
                    input = new discord_js_1.TextInputBuilder()
                        .setCustomId(DEMO_MODAL_INPUT_ID)
                        .setLabel('Enter demo text')
                        .setStyle(discord_js_1.TextInputStyle.Paragraph)
                        .setRequired(true);
                    row = new discord_js_1.ActionRowBuilder().addComponents(input);
                    modal.addComponents(row);
                    return [4 /*yield*/, interaction.showModal(modal)];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function handleSelectInteraction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var value;
        var _c;
        var interaction = _b.interaction;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    value = (_c = interaction.values[0]) !== null && _c !== void 0 ? _c : 'unknown';
                    return [4 /*yield*/, interaction.reply({
                            content: "Selected: ".concat(value),
                            ephemeral: true,
                        })];
                case 1:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleModalSubmitInteraction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var value;
        var interaction = _b.interaction;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (interaction.customId !== DEMO_MODAL_ID) {
                        return [2 /*return*/];
                    }
                    value = interaction.fields.getTextInputValue(DEMO_MODAL_INPUT_ID);
                    return [4 /*yield*/, interaction.reply({
                            content: "Modal input: ".concat(value),
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function formatAttachmentSummary(_a) {
    var message = _a.message;
    var lines = [
        "Received ".concat(message.attachments.size, " attachment(s):"),
        '| Name | Mime | Size | Image |',
        '| --- | --- | --- | --- |',
    ];
    var rows = __spreadArray([], message.attachments.values(), true).map(function (attachment) {
        var _a, _b;
        var mime = (_a = attachment.contentType) !== null && _a !== void 0 ? _a : 'unknown';
        var size = formatBytes(attachment.size);
        var imageSize = attachment.width && attachment.height
            ? "".concat(attachment.width, "x").concat(attachment.height)
            : 'n/a';
        return "| ".concat((_b = attachment.name) !== null && _b !== void 0 ? _b : 'unknown', " | ").concat(mime, " | ").concat(size, " | ").concat(imageSize, " |");
    });
    return __spreadArray(__spreadArray([], lines, true), rows, true).join('\n');
}
function formatBytes(size) {
    if (size < 1024) {
        return "".concat(size, " B");
    }
    if (size < 1024 * 1024) {
        return "".concat((size / 1024).toFixed(1), " KB");
    }
    return "".concat((size / (1024 * 1024)).toFixed(1), " MB");
}
function sleep(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var ms = _b.ms;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) {
                        setTimeout(function () {
                            resolve();
                        }, ms);
                    })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendV2TableMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var container, error_1;
        var _c;
        var client = _b.client, thread = _b.thread, username = _b.username, title = _b.title;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    container = {
                        type: discord_js_1.ComponentType.Container,
                        components: [
                            {
                                type: discord_js_1.ComponentType.TextDisplay,
                                content: "**Field** User\n**Value** ".concat(username),
                            },
                            {
                                type: discord_js_1.ComponentType.Separator,
                                divider: true,
                                spacing: discord_js_1.SeparatorSpacingSize.Small,
                            },
                            {
                                type: discord_js_1.ComponentType.TextDisplay,
                                content: "**Field** Channel\n**Value** ".concat((_c = thread.parentId) !== null && _c !== void 0 ? _c : 'unknown'),
                            },
                            {
                                type: discord_js_1.ComponentType.Separator,
                                divider: true,
                                spacing: discord_js_1.SeparatorSpacingSize.Small,
                            },
                            {
                                type: discord_js_1.ComponentType.TextDisplay,
                                content: "**Field** Thread\n**Value** ".concat(thread.id),
                            },
                            {
                                type: discord_js_1.ComponentType.Separator,
                                divider: true,
                                spacing: discord_js_1.SeparatorSpacingSize.Small,
                            },
                            {
                                type: discord_js_1.ComponentType.TextDisplay,
                                content: "**Field** Title\n**Value** ".concat(title),
                            },
                        ],
                    };
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, client.rest.post(v10_1.Routes.channelMessages(thread.id), {
                            body: {
                                flags: v10_1.MessageFlags.IsComponentsV2,
                                components: [container],
                            },
                        })];
                case 2:
                    _d.sent();
                    return [2 /*return*/, true];
                case 3:
                    error_1 = _d.sent();
                    console.warn('v2 table send failed', {
                        details: describeError(error_1),
                    });
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function pulseTyping(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var error_2;
        var target = _b.target, context = _b.context;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, target.sendTyping()];
                case 1:
                    _c.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _c.sent();
                    console.warn('sendTyping failed', {
                        context: context,
                        details: describeError(error_2),
                    });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function trySend(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var error_3;
        var target = _b.target, payload = _b.payload, context = _b.context;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, target.send(payload)];
                case 1:
                    _c.sent();
                    return [2 /*return*/, true];
                case 2:
                    error_3 = _c.sent();
                    console.warn('send failed', {
                        context: context,
                        details: describeError(error_3),
                    });
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function describeError(error) {
    if (!(error instanceof Error)) {
        return {
            name: 'UnknownError',
            message: String(error),
        };
    }
    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        status: readNumberProp({ value: error, key: 'status' }),
        method: readStringProp({ value: error, key: 'method' }),
        url: readStringProp({ value: error, key: 'url' }),
        rawErrorText: decodeRawErrorText(error),
    };
}
function readStringProp(_a) {
    var value = _a.value, key = _a.key;
    if (!(key in value)) {
        return undefined;
    }
    var raw = Reflect.get(value, key);
    if (typeof raw === 'string') {
        return raw;
    }
    return undefined;
}
function readNumberProp(_a) {
    var value = _a.value, key = _a.key;
    if (!(key in value)) {
        return undefined;
    }
    var raw = Reflect.get(value, key);
    if (typeof raw === 'number') {
        return raw;
    }
    return undefined;
}
function decodeRawErrorText(error) {
    if (!('rawError' in error)) {
        return undefined;
    }
    var raw = Reflect.get(error, 'rawError');
    if (typeof raw === 'string') {
        return raw;
    }
    if (raw instanceof ArrayBuffer) {
        return new TextDecoder().decode(raw);
    }
    return undefined;
}
function createDemoImageAttachment() {
    var imageBuffer = node_fs_1.default.readFileSync(DEMO_IMAGE_FILE_URL);
    return new discord_js_1.AttachmentBuilder(imageBuffer, {
        name: 'demo-image.jpeg',
    });
}
function resolveReplyThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var existingThread, threadName, error_4;
        var message = _b.message;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (message.channel.isThread()) {
                        return [2 /*return*/, message.channel];
                    }
                    existingThread = message.thread;
                    if (existingThread) {
                        return [2 /*return*/, existingThread];
                    }
                    if (!message.inGuild()) {
                        return [2 /*return*/, undefined];
                    }
                    threadName = "echo-".concat(message.author.username).slice(0, 100);
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, createThreadForChannelMessage({ message: message, threadName: threadName })];
                case 2: return [2 /*return*/, _c.sent()];
                case 3:
                    error_4 = _c.sent();
                    console.warn('thread creation failed, falling back to channel reply', {
                        context: 'resolveReplyThread',
                        details: describeError(error_4),
                    });
                    return [2 /*return*/, undefined];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function resolveReplyThreadFromInteraction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var threadName;
        var _c;
        var interaction = _b.interaction;
        return __generator(this, function (_d) {
            if ((_c = interaction.channel) === null || _c === void 0 ? void 0 : _c.isThread()) {
                return [2 /*return*/, interaction.channel];
            }
            if (!(interaction.channel && 'threads' in interaction.channel)) {
                return [2 /*return*/, undefined];
            }
            threadName = "echo-".concat(interaction.user.username).slice(0, 100);
            return [2 /*return*/, interaction.channel.threads.create({
                    name: threadName,
                    autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneHour,
                })];
        });
    });
}
function createThreadForChannelMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var error_5, channel;
        var message = _b.message, threadName = _b.threadName;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, message.startThread({
                            name: threadName,
                            autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneHour,
                        })];
                case 1: return [2 /*return*/, _c.sent()];
                case 2:
                    error_5 = _c.sent();
                    if (!isNotFoundError(error_5)) {
                        throw error_5;
                    }
                    return [3 /*break*/, 3];
                case 3:
                    channel = message.channel;
                    if (!isThreadCreatableChannel(channel)) {
                        return [2 /*return*/, undefined];
                    }
                    return [2 /*return*/, channel.threads.create({
                            name: threadName,
                            autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneHour,
                        })];
            }
        });
    });
}
function isNotFoundError(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    return 'status' in error && typeof error.status === 'number' && error.status === 404;
}
function isThreadCreatableChannel(channel) {
    return 'threads' in channel;
}
function requireEnv(name) {
    var value = process.env[name];
    if (!value) {
        throw new Error("Missing required env var: ".concat(name));
    }
    return value;
}
function ensureGatewayClientMapping(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var clientSecret, databaseUrl, prisma, user;
        var workspaceId = _b.workspaceId, clientId = _b.clientId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    clientSecret = requireEnv('SLACK_CLIENT_SECRET');
                    databaseUrl = requireEnv('DATABASE_URL');
                    prisma = (0, src_1.createPrisma)(databaseUrl);
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: {
                                email: PREVIEW_MAPPING_USER_EMAIL,
                            },
                            select: {
                                id: true,
                            },
                        })];
                case 1:
                    user = _c.sent();
                    if (!user) {
                        throw new Error("Could not find user ".concat(PREVIEW_MAPPING_USER_EMAIL, " for gateway client mapping"));
                    }
                    return [4 /*yield*/, prisma.gateway_clients.upsert({
                            where: {
                                client_id_guild_id: {
                                    client_id: clientId,
                                    guild_id: workspaceId,
                                },
                            },
                            update: {
                                secret: clientSecret,
                                user_id: user.id,
                                updated_at: new Date(),
                            },
                            create: {
                                client_id: clientId,
                                secret: clientSecret,
                                guild_id: workspaceId,
                                user_id: user.id,
                            },
                        })];
                case 2:
                    _c.sent();
                    console.log('Ensured gateway client mapping in database', {
                        clientId: clientId,
                        workspaceId: workspaceId,
                        userEmail: PREVIEW_MAPPING_USER_EMAIL,
                    });
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error('Fatal error:', err);
    process.exit(1);
});
