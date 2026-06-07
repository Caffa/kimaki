"use strict";
// Core Discord bot module that handles message events and bot lifecycle.
// Bridges Discord messages to OpenCode sessions, manages voice connections,
// and orchestrates the main event loop for the Kimaki bot.
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.getChannelsWithDescriptions = exports.linkVoiceChannelToDirectory = exports.createDefaultKimakiVoiceChannel = exports.createDefaultKimakiChannel = exports.createProjectChannels = exports.ensureKimakiAudioCategory = exports.ensureKimakiCategory = exports.getOpencodeSystemMessage = exports.splitMarkdownForDiscord = exports.escapeBackticksInCodeBlocks = exports.initializeOpencodeForDirectory = exports.getChannelDirectory = exports.closeDatabase = exports.initDatabase = void 0;
exports.createDiscordClient = createDiscordClient;
exports.startDiscordBot = startDiscordBot;
var database_js_1 = require("./database.js");
var opencode_js_1 = require("./opencode.js");
var new_worktree_js_1 = require("./commands/new-worktree.js");
var worktrees_js_1 = require("./worktrees.js");
var merge_worktree_js_1 = require("./commands/merge-worktree.js");
var discord_utils_js_1 = require("./discord-utils.js");
var system_message_js_1 = require("./system-message.js");
var yaml_1 = require("yaml");
var message_formatting_js_1 = require("./message-formatting.js");
var btw_prefix_detection_js_1 = require("./btw-prefix-detection.js");
var voice_attachment_js_1 = require("./voice-attachment.js");
var btw_js_1 = require("./commands/btw.js");
var message_preprocessing_js_1 = require("./message-preprocessing.js");
var action_buttons_js_1 = require("./commands/action-buttons.js");
var ask_question_js_1 = require("./commands/ask-question.js");
var file_upload_js_1 = require("./commands/file-upload.js");
var permissions_js_1 = require("./commands/permissions.js");
var html_actions_js_1 = require("./html-actions.js");
var channel_management_js_1 = require("./channel-management.js");
var voice_handler_js_1 = require("./voice-handler.js");
var thread_session_runtime_js_1 = require("./session-handler/thread-session-runtime.js");
var run_command_js_1 = require("./commands/run-command.js");
var interaction_handler_js_1 = require("./interaction-handler.js");
var discord_urls_js_1 = require("./discord-urls.js");
var hrana_server_js_1 = require("./hrana-server.js");
var sentry_js_1 = require("./sentry.js");
var debounced_process_flush_js_1 = require("./debounced-process-flush.js");
var runtime_idle_sweeper_js_1 = require("./runtime-idle-sweeper.js");
var external_opencode_sync_js_1 = require("./external-opencode-sync.js");
var asr_service_manager_js_1 = require("./asr-service-manager.js");
var vllm_service_manager_js_1 = require("./vllm-service-manager.js");
var database_js_2 = require("./database.js");
Object.defineProperty(exports, "initDatabase", { enumerable: true, get: function () { return database_js_2.initDatabase; } });
Object.defineProperty(exports, "closeDatabase", { enumerable: true, get: function () { return database_js_2.closeDatabase; } });
Object.defineProperty(exports, "getChannelDirectory", { enumerable: true, get: function () { return database_js_2.getChannelDirectory; } });
var opencode_js_2 = require("./opencode.js");
Object.defineProperty(exports, "initializeOpencodeForDirectory", { enumerable: true, get: function () { return opencode_js_2.initializeOpencodeForDirectory; } });
var discord_utils_js_2 = require("./discord-utils.js");
Object.defineProperty(exports, "escapeBackticksInCodeBlocks", { enumerable: true, get: function () { return discord_utils_js_2.escapeBackticksInCodeBlocks; } });
Object.defineProperty(exports, "splitMarkdownForDiscord", { enumerable: true, get: function () { return discord_utils_js_2.splitMarkdownForDiscord; } });
var system_message_js_2 = require("./system-message.js");
Object.defineProperty(exports, "getOpencodeSystemMessage", { enumerable: true, get: function () { return system_message_js_2.getOpencodeSystemMessage; } });
var channel_management_js_2 = require("./channel-management.js");
Object.defineProperty(exports, "ensureKimakiCategory", { enumerable: true, get: function () { return channel_management_js_2.ensureKimakiCategory; } });
Object.defineProperty(exports, "ensureKimakiAudioCategory", { enumerable: true, get: function () { return channel_management_js_2.ensureKimakiAudioCategory; } });
Object.defineProperty(exports, "createProjectChannels", { enumerable: true, get: function () { return channel_management_js_2.createProjectChannels; } });
Object.defineProperty(exports, "createDefaultKimakiChannel", { enumerable: true, get: function () { return channel_management_js_2.createDefaultKimakiChannel; } });
Object.defineProperty(exports, "createDefaultKimakiVoiceChannel", { enumerable: true, get: function () { return channel_management_js_2.createDefaultKimakiVoiceChannel; } });
Object.defineProperty(exports, "linkVoiceChannelToDirectory", { enumerable: true, get: function () { return channel_management_js_2.linkVoiceChannelToDirectory; } });
Object.defineProperty(exports, "getChannelsWithDescriptions", { enumerable: true, get: function () { return channel_management_js_2.getChannelsWithDescriptions; } });
var discord_js_1 = require("discord.js");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_child_process_1 = require("node:child_process");
var errore = require("errore");
var string_dedent_1 = require("string-dedent");
var logger_js_1 = require("./logger.js");
var heap_monitor_js_1 = require("./heap-monitor.js");
var task_runner_js_1 = require("./task-runner.js");
// Increase connection pool to prevent deadlock when multiple sessions have open SSE streams.
// Each session's global.event() holds a connection; without enough connections,
// regular HTTP requests (question.reply, session.prompt) get blocked → deadlock.
// undici is a transitive dep from discord.js — not listed in our package.json.
// Types are declared in src/undici.d.ts.
var discordLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.DISCORD);
var voiceLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.VOICE);
var MISSING_MESSAGE_CONTENT_REPLY = (0, string_dedent_1.default)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n  I can see you sent a message, but Discord did not include its text.\n  Mention me and send it again, like `@Kimaki fix the failing test`, so I can read it.\n  To avoid this reminder, start Kimaki with `--mention-mode` so it only reacts to mentioned messages.\n"], ["\n  I can see you sent a message, but Discord did not include its text.\n  Mention me and send it again, like \\`@Kimaki fix the failing test\\`, so I can read it.\n  To avoid this reminder, start Kimaki with \\`--mention-mode\\` so it only reacts to mentioned messages.\n"])));
function isMissingReadableMessageContent(message) {
    if (message.author.bot)
        return false;
    if (message.content.trim())
        return false;
    if (message.attachments.size > 0)
        return false;
    if (message.embeds.length > 0)
        return false;
    if (message.stickers.size > 0)
        return false;
    return true;
}
// Well-known WebSocket and Discord Gateway close codes for diagnostic logging.
// Gateway proxy redeploys cause an abrupt TCP drop (code 1006) because the proxy
// doesn't send a close frame to clients before shutting down. discord.js then
// enters reconnection mode. The ShardReconnecting event intentionally strips the
// close code for recoverable disconnects, so we track it ourselves from the
// lower-level ShardDisconnect and ShardError events and correlate by shard ID.
function describeCloseCode(code) {
    var codes = {
        1000: 'normal closure',
        1001: 'going away',
        1006: 'abnormal closure (no close frame received)',
        1011: 'unexpected server error',
        1012: 'service restart',
        4000: 'unknown error',
        4001: 'unknown opcode',
        4002: 'decode error',
        4003: 'not authenticated',
        4004: 'authentication failed',
        4005: 'already authenticated',
        4007: 'invalid seq',
        4008: 'rate limited',
        4009: 'session timed out',
        4010: 'invalid shard',
        4011: 'sharding required',
        4012: 'invalid API version',
        4013: 'invalid intents',
        4014: 'disallowed intents',
    };
    return codes[code] || 'unknown';
}
var shardReconnectState = new Map();
function getOrCreateShardState(shardId) {
    var state = shardReconnectState.get(shardId);
    if (!state) {
        state = { attempts: 0 };
        shardReconnectState.set(shardId, state);
    }
    return state;
}
function parseEmbedFooterMarker(_a) {
    var footer = _a.footer;
    if (!footer) {
        return undefined;
    }
    try {
        var parsed = yaml_1.default.parse(footer);
        if (!parsed || typeof parsed !== 'object') {
            return undefined;
        }
        return parsed;
    }
    catch (_b) {
        return undefined;
    }
}
function parseSessionStartSourceFromMarker(marker) {
    if (!(marker === null || marker === void 0 ? void 0 : marker.scheduledKind)) {
        return undefined;
    }
    if (marker.scheduledKind !== 'at' && marker.scheduledKind !== 'cron') {
        return undefined;
    }
    if (typeof marker.scheduledTaskId !== 'number' ||
        !Number.isInteger(marker.scheduledTaskId) ||
        marker.scheduledTaskId < 1) {
        return { scheduleKind: marker.scheduledKind };
    }
    return {
        scheduleKind: marker.scheduledKind,
        scheduledTaskId: marker.scheduledTaskId,
    };
}
function createDiscordClient() {
    return __awaiter(this, void 0, void 0, function () {
        var restApiUrl;
        return __generator(this, function (_a) {
            restApiUrl = (0, discord_urls_js_1.getDiscordRestApiUrl)();
            return [2 /*return*/, new discord_js_1.Client({
                    intents: [
                        discord_js_1.GatewayIntentBits.Guilds,
                        discord_js_1.GatewayIntentBits.GuildMessages,
                        discord_js_1.GatewayIntentBits.MessageContent,
                        discord_js_1.GatewayIntentBits.GuildVoiceStates,
                    ],
                    partials: [
                        discord_js_1.Partials.Channel,
                        discord_js_1.Partials.Message,
                        discord_js_1.Partials.User,
                        discord_js_1.Partials.ThreadMember,
                    ],
                    rest: { api: restApiUrl },
                })];
        });
    });
}
function startDiscordBot(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var currentAppId, setupHandlers, stopTaskRunner, stopRuntimeIdleSweeper, handleShutdown;
        var _this = this;
        var token = _b.token, appId = _b.appId, discordClient = _b.discordClient, useWorktrees = _b.useWorktrees;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!!discordClient) return [3 /*break*/, 2];
                    return [4 /*yield*/, createDiscordClient()];
                case 1:
                    discordClient = _c.sent();
                    _c.label = 2;
                case 2:
                    currentAppId = appId;
                    setupHandlers = function (c) { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        var _a, _b;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    discordLogger.log("Discord bot logged in as ".concat(c.user.tag));
                                    discordLogger.log("Connected to ".concat(c.guilds.cache.size, " guild(s)"));
                                    discordLogger.log("Bot user ID: ".concat(c.user.id));
                                    if (!!currentAppId) return [3 /*break*/, 2];
                                    return [4 /*yield*/, ((_a = c.application) === null || _a === void 0 ? void 0 : _a.fetch())];
                                case 1:
                                    _c.sent();
                                    currentAppId = (_b = c.application) === null || _b === void 0 ? void 0 : _b.id;
                                    if (!currentAppId) {
                                        discordLogger.error('Could not get application ID');
                                        throw new Error('Failed to get bot application ID');
                                    }
                                    discordLogger.log("Bot Application ID (fetched): ".concat(currentAppId));
                                    return [3 /*break*/, 3];
                                case 2:
                                    discordLogger.log("Bot Application ID (provided): ".concat(currentAppId));
                                    _c.label = 3;
                                case 3:
                                    voiceLogger.log('[READY] Bot is ready');
                                    (0, hrana_server_js_1.markDiscordGatewayReady)();
                                    // Handle new channel creation - auto-create project folder if guild has default directory
                                    c.on(discord_js_1.Events.ChannelCreate, function (channel) { return __awaiter(_this, void 0, void 0, function () {
                                        var guild, guildDefaultDir, existingDir, channelName, channelDir, agentsMdPath, channelDisplayName, agentsMdContent, parentGitDir;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    // Only handle text channels
                                                    if (channel.type !== discord_js_1.ChannelType.GuildText) {
                                                        return [2 /*return*/];
                                                    }
                                                    guild = channel.guild;
                                                    if (!guild) {
                                                        return [2 /*return*/];
                                                    }
                                                    return [4 /*yield*/, (0, database_js_1.getGuildDefaultDirectory)(guild.id)];
                                                case 1:
                                                    guildDefaultDir = _a.sent();
                                                    if (!guildDefaultDir) {
                                                        return [2 /*return*/];
                                                    }
                                                    return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(channel.id)];
                                                case 2:
                                                    existingDir = _a.sent();
                                                    if (existingDir) {
                                                        return [2 /*return*/];
                                                    }
                                                    channelName = channel.name.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                                                    channelDir = node_path_1.default.join(guildDefaultDir.parent_directory, channelName);
                                                    // Ensure the parent directory exists
                                                    if (!node_fs_1.default.existsSync(guildDefaultDir.parent_directory)) {
                                                        discordLogger.warn("[CHANNEL] Parent directory does not exist: ".concat(guildDefaultDir.parent_directory));
                                                        return [2 /*return*/];
                                                    }
                                                    // Ensure the directory exists
                                                    if (!node_fs_1.default.existsSync(channelDir)) {
                                                        try {
                                                            node_fs_1.default.mkdirSync(channelDir, { recursive: true });
                                                        }
                                                        catch (error) {
                                                            discordLogger.error("[CHANNEL] Failed to create directory ".concat(channelDir, ": ").concat(error));
                                                            return [2 /*return*/];
                                                        }
                                                        agentsMdPath = node_path_1.default.join(channelDir, 'AGENTS.md');
                                                        if (!node_fs_1.default.existsSync(agentsMdPath)) {
                                                            channelDisplayName = "#".concat(channel.name);
                                                            agentsMdContent = "<!-- Agent guidance for ".concat(channelDisplayName, " -->\n\n# ").concat(channelDisplayName, "\n\nThis bot is designed for conversation and personal assistance.\n\n## Bot Purpose\n\nDescribe what this bot should do here. For example:\n- Help with decision making and long-term thinking\n- Organize and track experiments\n- Provide accountability and challenge excuses\n\n## Guidelines\n\n- Be honest and direct, even when it's uncomfortable\n- Challenge the user when they make excuses\n- Suggest concrete experiments to test ideas\n- Keep track of outcomes to learn from past decisions\n\n## Customization\n\nEdit this file to define your bot's personality and goals.\n");
                                                            node_fs_1.default.writeFileSync(agentsMdPath, agentsMdContent);
                                                            discordLogger.log("[CHANNEL] Created AGENTS.md in ".concat(channelDir));
                                                        }
                                                        parentGitDir = node_path_1.default.join(guildDefaultDir.parent_directory, '.git');
                                                        if (node_fs_1.default.existsSync(parentGitDir)) {
                                                            try {
                                                                (0, node_child_process_1.execSync)('git init', { cwd: channelDir, stdio: 'ignore' });
                                                                discordLogger.log("[CHANNEL] Initialized git repo in ".concat(channelDir));
                                                            }
                                                            catch (_b) {
                                                                // Ignore errors - some directories may not support git
                                                            }
                                                        }
                                                        discordLogger.log("[CHANNEL] Created project folder: ".concat(channelDir));
                                                    }
                                                    // Map the channel to this directory
                                                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                                                            channelId: channel.id,
                                                            directory: channelDir,
                                                            channelType: 'text',
                                                        })];
                                                case 3:
                                                    // Map the channel to this directory
                                                    _a.sent();
                                                    discordLogger.log("[CHANNEL] Mapped new channel #".concat(channel.name, " to ").concat(channelDir));
                                                    return [2 /*return*/];
                                            }
                                        });
                                    }); });
                                    (0, interaction_handler_js_1.registerInteractionHandler)({ discordClient: c, appId: currentAppId });
                                    (0, voice_handler_js_1.registerVoiceStateHandler)({ discordClient: c, appId: currentAppId });
                                    (0, external_opencode_sync_js_1.startExternalOpencodeSessionSync)({ discordClient: c });
                                    // Channel logging is informational only; do it in background so startup stays responsive.
                                    void (function () { return __awaiter(_this, void 0, void 0, function () {
                                        var _i, _a, guild, channels, kimakiChannels;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0:
                                                    _i = 0, _a = c.guilds.cache.values();
                                                    _b.label = 1;
                                                case 1:
                                                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                                                    guild = _a[_i];
                                                    discordLogger.log("".concat(guild.name, " (").concat(guild.id, ")"));
                                                    return [4 /*yield*/, (0, channel_management_js_1.getChannelsWithDescriptions)(guild)];
                                                case 2:
                                                    channels = _b.sent();
                                                    kimakiChannels = channels.filter(function (ch) { return ch.kimakiDirectory; });
                                                    if (kimakiChannels.length > 0) {
                                                        discordLogger.log("  Found ".concat(kimakiChannels.length, " channel(s) for this bot"));
                                                        return [3 /*break*/, 3];
                                                    }
                                                    discordLogger.log('  No channels for this bot');
                                                    _b.label = 3;
                                                case 3:
                                                    _i++;
                                                    return [3 /*break*/, 1];
                                                case 4: return [2 /*return*/];
                                            }
                                        });
                                    }); })().catch(function (error) {
                                        discordLogger.warn("Background guild channel scan failed: ".concat(error instanceof Error ? error.stack : String(error)));
                                    });
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    if (!discordClient.isReady()) return [3 /*break*/, 4];
                    return [4 /*yield*/, setupHandlers(discordClient)];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    discordClient.once(discord_js_1.Events.ClientReady, function (readyClient) {
                        void setupHandlers(readyClient).catch(function (error) {
                            discordLogger.error("[GATEWAY] ClientReady handler failed: ".concat((0, logger_js_1.formatErrorWithStack)(error)));
                        });
                    });
                    _c.label = 5;
                case 5:
                    discordClient.on(discord_js_1.Events.Error, function (error) {
                        discordLogger.error('[GATEWAY] Client error:', (0, logger_js_1.formatErrorWithStack)(error));
                    });
                    discordClient.on(discord_js_1.Events.ShardError, function (error, shardId) {
                        var state = getOrCreateShardState(shardId);
                        state.lastError = error;
                        discordLogger.error("[GATEWAY] Shard ".concat(shardId, " error: ").concat((0, logger_js_1.formatErrorWithStack)(error)));
                    });
                    discordClient.on(discord_js_1.Events.ShardDisconnect, function (event, shardId) {
                        // ShardDisconnect fires for unrecoverable close codes (4004, 4010-4014).
                        // For recoverable codes discord.js fires ShardReconnecting instead.
                        var state = getOrCreateShardState(shardId);
                        state.lastDisconnectCode = event.code;
                        discordLogger.warn("[GATEWAY] Shard ".concat(shardId, " disconnected: code=").concat(event.code, " (").concat(describeCloseCode(event.code), ")"));
                    });
                    discordClient.on(discord_js_1.Events.ShardReconnecting, function (shardId) {
                        // discord.js strips the close code before emitting this event.
                        // We log whatever context we captured from preceding ShardError events.
                        var state = getOrCreateShardState(shardId);
                        state.attempts++;
                        var parts = ["attempt #".concat(state.attempts)];
                        if (state.lastDisconnectCode !== undefined) {
                            parts.push("close code=".concat(state.lastDisconnectCode, " (").concat(describeCloseCode(state.lastDisconnectCode), ")"));
                        }
                        if (state.lastError) {
                            parts.push("last error: ".concat(state.lastError.message));
                        }
                        discordLogger.warn("[GATEWAY] Shard ".concat(shardId, " reconnecting: ").concat(parts.join(', ')));
                    });
                    discordClient.on(discord_js_1.Events.ShardResume, function (shardId, replayedEvents) {
                        var state = shardReconnectState.get(shardId);
                        if (state === null || state === void 0 ? void 0 : state.attempts) {
                            discordLogger.log("[GATEWAY] Shard ".concat(shardId, " resumed after ").concat(state.attempts, " reconnect attempt(s), ").concat(replayedEvents, " replayed events"));
                        }
                        else {
                            discordLogger.log("[GATEWAY] Shard ".concat(shardId, " resumed, ").concat(replayedEvents, " replayed events"));
                        }
                        shardReconnectState.delete(shardId);
                    });
                    // ShardReady fires when a shard completes a fresh IDENTIFY (not RESUME).
                    // After a gateway proxy redeploy, sessions are lost (in-memory), so RESUME
                    // fails with INVALID_SESSION and discord.js falls back to fresh IDENTIFY.
                    discordClient.on(discord_js_1.Events.ShardReady, function (shardId) {
                        var state = shardReconnectState.get(shardId);
                        if (state === null || state === void 0 ? void 0 : state.attempts) {
                            discordLogger.log("[GATEWAY] Shard ".concat(shardId, " ready after ").concat(state.attempts, " reconnect attempt(s)"));
                        }
                        shardReconnectState.delete(shardId);
                    });
                    discordClient.on(discord_js_1.Events.Invalidated, function () {
                        discordLogger.error('[GATEWAY] Session invalidated by Discord');
                    });
                    discordClient.on(discord_js_1.Events.MessageCreate, function (message) { return __awaiter(_this, void 0, void 0, function () {
                        var isSelfBotMessage, promptMarker, isCliInjectedPrompt_1, sessionStartSource, cliInjectedUsername, cliInjectedUserId, cliInjectedAgent, cliInjectedModel, cliInjectedPermissions, cliInjectedInjectionGuardPatterns, isInjectedSelfBotMessage, leadingMentionMatch, mentionedUserId, fetched, channel, mentionModeEnabled, botMentioned, isShellCommand, isThread, thread_1, hasExistingSession, botMentioned, botCreatedThread, parent_1, projectDirectory, channelConfig, worktreeInfo, shellCmd, shellDir, loadingReply, result, btwShortcut, result, hasVoiceAttachment_1, resolvedProjectDir_1, sdkDir, runtime, dismissedPermission, dismissedQuestion, enqueueResult, channelConfig, botMentioned, projectDirectory_1, shellCmd, loadingReply, result, hasVoice_1, baseThreadName, wantsWorktrees, _a, shouldUseWorktrees, _b, threadName, thread_2, worktreePromise_1, worktreeName, worktreeStatusMessage, channelRuntime_1, error_1, errMsg, sendError_1;
                        var _this = this;
                        var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
                        return __generator(this, function (_s) {
                            switch (_s.label) {
                                case 0:
                                    _s.trys.push([0, 63, , 68]);
                                    isSelfBotMessage = Boolean(discordClient.user && ((_c = message.author) === null || _c === void 0 ? void 0 : _c.id) === discordClient.user.id);
                                    promptMarker = parseEmbedFooterMarker({
                                        footer: (_e = (_d = message.embeds[0]) === null || _d === void 0 ? void 0 : _d.footer) === null || _e === void 0 ? void 0 : _e.text,
                                    });
                                    isCliInjectedPrompt_1 = Boolean(isSelfBotMessage && (0, system_message_js_1.isInjectedPromptMarker)({ marker: promptMarker }));
                                    sessionStartSource = isCliInjectedPrompt_1
                                        ? parseSessionStartSourceFromMarker(promptMarker)
                                        : undefined;
                                    cliInjectedUsername = isCliInjectedPrompt_1
                                        ? (promptMarker === null || promptMarker === void 0 ? void 0 : promptMarker.username) || 'kimaki-cli'
                                        : undefined;
                                    cliInjectedUserId = isCliInjectedPrompt_1
                                        ? promptMarker === null || promptMarker === void 0 ? void 0 : promptMarker.userId
                                        : undefined;
                                    cliInjectedAgent = isCliInjectedPrompt_1
                                        ? promptMarker === null || promptMarker === void 0 ? void 0 : promptMarker.agent
                                        : undefined;
                                    cliInjectedModel = isCliInjectedPrompt_1
                                        ? promptMarker === null || promptMarker === void 0 ? void 0 : promptMarker.model
                                        : undefined;
                                    cliInjectedPermissions = isCliInjectedPrompt_1
                                        ? promptMarker === null || promptMarker === void 0 ? void 0 : promptMarker.permissions
                                        : undefined;
                                    cliInjectedInjectionGuardPatterns = isCliInjectedPrompt_1
                                        ? promptMarker === null || promptMarker === void 0 ? void 0 : promptMarker.injectionGuardPatterns
                                        : undefined;
                                    // Always ignore our own messages (unless CLI-injected prompt above).
                                    // Without this, assigning the Kimaki role to the bot itself would loop.
                                    if (isSelfBotMessage && !isCliInjectedPrompt_1) {
                                        return [2 /*return*/];
                                    }
                                    isInjectedSelfBotMessage = isCliInjectedPrompt_1 && ((_f = message.author) === null || _f === void 0 ? void 0 : _f.id) === ((_g = discordClient.user) === null || _g === void 0 ? void 0 : _g.id);
                                    if (((_h = message.author) === null || _h === void 0 ? void 0 : _h.bot) && !isInjectedSelfBotMessage) {
                                        if (!(0, discord_utils_js_1.hasKimakiBotPermission)(message.member)) {
                                            return [2 /*return*/];
                                        }
                                    }
                                    leadingMentionMatch = (_j = message.content) === null || _j === void 0 ? void 0 : _j.match(/^<@!?(\d+)>/);
                                    if (leadingMentionMatch) {
                                        mentionedUserId = leadingMentionMatch[1];
                                        if (mentionedUserId !== ((_k = discordClient.user) === null || _k === void 0 ? void 0 : _k.id)) {
                                            return [2 /*return*/];
                                        }
                                    }
                                    if (!message.partial) return [3 /*break*/, 2];
                                    discordLogger.log("Fetching partial message ".concat(message.id));
                                    return [4 /*yield*/, errore.tryAsync({
                                            try: function () { return message.fetch(); },
                                            catch: function (e) { return e; },
                                        })];
                                case 1:
                                    fetched = _s.sent();
                                    if (fetched instanceof Error) {
                                        discordLogger.log("Failed to fetch partial message ".concat(message.id, ":"), fetched.message);
                                        return [2 /*return*/];
                                    }
                                    _s.label = 2;
                                case 2:
                                    channel = message.channel;
                                    if (!(channel.type === discord_js_1.ChannelType.GuildText && !isCliInjectedPrompt_1)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, (0, database_js_1.getChannelMentionMode)(channel.id)];
                                case 3:
                                    mentionModeEnabled = _s.sent();
                                    if (mentionModeEnabled) {
                                        botMentioned = discordClient.user && message.mentions.has(discordClient.user.id);
                                        isShellCommand = (_l = message.content) === null || _l === void 0 ? void 0 : _l.startsWith('!');
                                        if (!botMentioned && !isShellCommand) {
                                            voiceLogger.log("[IGNORED] Mention mode enabled, bot not mentioned");
                                            return [2 /*return*/];
                                        }
                                    }
                                    _s.label = 4;
                                case 4:
                                    if (!(!isCliInjectedPrompt_1 && message.guild && message.member)) return [3 /*break*/, 8];
                                    if (!(0, discord_utils_js_1.hasNoKimakiRole)(message.member)) return [3 /*break*/, 6];
                                    return [4 /*yield*/, message.reply({
                                            content: "You have the **no-kimaki** role which blocks bot access.\nRemove this role to use Kimaki.",
                                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                        })];
                                case 5:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 6:
                                    if (!!(0, discord_utils_js_1.hasKimakiBotPermission)(message.member)) return [3 /*break*/, 8];
                                    return [4 /*yield*/, message.reply({
                                            content: "You don't have permission to start sessions.\nTo use Kimaki, ask a server admin to give you the **Kimaki** role.",
                                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                        })];
                                case 7:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 8:
                                    isThread = [
                                        discord_js_1.ChannelType.PublicThread,
                                        discord_js_1.ChannelType.PrivateThread,
                                        discord_js_1.ChannelType.AnnouncementThread,
                                    ].includes(channel.type);
                                    if (!isThread) return [3 /*break*/, 40];
                                    thread_1 = channel;
                                    discordLogger.log("Message in thread ".concat(thread_1.name, " (").concat(thread_1.id, ")"));
                                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(thread_1.id)];
                                case 9:
                                    hasExistingSession = _s.sent();
                                    botMentioned = discordClient.user && message.mentions.has(discordClient.user.id);
                                    botCreatedThread = discordClient.user && thread_1.ownerId === discordClient.user.id;
                                    if (!hasExistingSession &&
                                        !botMentioned &&
                                        !isCliInjectedPrompt_1 &&
                                        !botCreatedThread) {
                                        discordLogger.log("Ignoring thread ".concat(thread_1.id, ": no existing session and bot not mentioned"));
                                        return [2 /*return*/];
                                    }
                                    parent_1 = thread_1.parent;
                                    projectDirectory = void 0;
                                    if (!parent_1) return [3 /*break*/, 11];
                                    return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(parent_1.id)];
                                case 10:
                                    channelConfig = _s.sent();
                                    if (channelConfig) {
                                        projectDirectory = channelConfig.directory;
                                    }
                                    _s.label = 11;
                                case 11: return [4 /*yield*/, (0, database_js_1.getThreadWorktree)(thread_1.id)];
                                case 12:
                                    worktreeInfo = _s.sent();
                                    if (!worktreeInfo) return [3 /*break*/, 17];
                                    if (!(worktreeInfo.status === 'pending' && !(0, thread_session_runtime_js_1.getRuntime)(thread_1.id))) return [3 /*break*/, 14];
                                    return [4 /*yield*/, message.reply({
                                            content: '⏳ Worktree is still being created. Please wait...',
                                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                        })];
                                case 13:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 14:
                                    if (!(worktreeInfo.status === 'error')) return [3 /*break*/, 16];
                                    return [4 /*yield*/, message.reply({
                                            content: "\u274C Worktree creation failed: ".concat((worktreeInfo.error_message || '').slice(0, 1900)),
                                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                                        })];
                                case 15:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 16:
                                    // Use original project directory for OpenCode server (session lives there)
                                    // The worktree directory is passed via query.directory in prompt/command calls
                                    if (worktreeInfo.project_directory) {
                                        projectDirectory = worktreeInfo.project_directory;
                                        discordLogger.log("Using project directory: ".concat(projectDirectory, " (worktree: ").concat(worktreeInfo.worktree_directory, ")"));
                                    }
                                    _s.label = 17;
                                case 17:
                                    if (!(projectDirectory && !node_fs_1.default.existsSync(projectDirectory))) return [3 /*break*/, 19];
                                    discordLogger.error("Directory does not exist: ".concat(projectDirectory));
                                    return [4 /*yield*/, message.reply({
                                            content: "\u2717 Directory does not exist: ".concat(JSON.stringify(projectDirectory).slice(0, 1900)),
                                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                                        })];
                                case 18:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 19:
                                    if (!(((_m = message.content) === null || _m === void 0 ? void 0 : _m.startsWith('!')) &&
                                        projectDirectory &&
                                        (worktreeInfo === null || worktreeInfo === void 0 ? void 0 : worktreeInfo.status) !== 'pending')) return [3 /*break*/, 23];
                                    shellCmd = message.content.slice(1).trim();
                                    if (!shellCmd) return [3 /*break*/, 23];
                                    shellDir = (worktreeInfo === null || worktreeInfo === void 0 ? void 0 : worktreeInfo.status) === 'ready' &&
                                        worktreeInfo.worktree_directory
                                        ? worktreeInfo.worktree_directory
                                        : projectDirectory;
                                    return [4 /*yield*/, message.reply({
                                            content: "Running `".concat(shellCmd.slice(0, 1900), "`..."),
                                        })];
                                case 20:
                                    loadingReply = _s.sent();
                                    return [4 /*yield*/, (0, run_command_js_1.runShellCommand)({
                                            command: shellCmd,
                                            directory: shellDir,
                                        })];
                                case 21:
                                    result = _s.sent();
                                    return [4 /*yield*/, loadingReply.edit({ content: result })];
                                case 22:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 23:
                                    btwShortcut = projectDirectory && (worktreeInfo === null || worktreeInfo === void 0 ? void 0 : worktreeInfo.status) !== 'pending'
                                        ? (0, btw_prefix_detection_js_1.extractBtwPrefix)(message.content || '')
                                        : null;
                                    if (!(btwShortcut && projectDirectory)) return [3 /*break*/, 28];
                                    return [4 /*yield*/, (0, btw_js_1.forkSessionToBtwThread)({
                                            sourceThread: thread_1,
                                            projectDirectory: projectDirectory,
                                            prompt: btwShortcut.prompt,
                                            userId: message.author.id,
                                            username: ((_o = message.member) === null || _o === void 0 ? void 0 : _o.displayName) || message.author.displayName,
                                            appId: currentAppId,
                                        })];
                                case 24:
                                    result = _s.sent();
                                    if (!(result instanceof Error)) return [3 /*break*/, 26];
                                    return [4 /*yield*/, message.reply({
                                            content: result.message,
                                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                        })];
                                case 25:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 26: return [4 /*yield*/, message.reply({
                                        content: "Session forked! Continue in ".concat(result.thread.toString()),
                                        flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                    })];
                                case 27:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 28:
                                    hasVoiceAttachment_1 = message.attachments.some(function (attachment) {
                                        return (0, voice_attachment_js_1.isVoiceAttachment)(attachment);
                                    });
                                    if (!projectDirectory) {
                                        discordLogger.log("Cannot process message: no project directory for thread ".concat(thread_1.id));
                                        return [2 /*return*/];
                                    }
                                    if (!isMissingReadableMessageContent(message)) return [3 /*break*/, 30];
                                    return [4 /*yield*/, message.reply({
                                            content: MISSING_MESSAGE_CONTENT_REPLY,
                                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                        })];
                                case 29:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 30:
                                    resolvedProjectDir_1 = projectDirectory;
                                    sdkDir = (worktreeInfo === null || worktreeInfo === void 0 ? void 0 : worktreeInfo.status) === 'ready' &&
                                        worktreeInfo.worktree_directory
                                        ? worktreeInfo.worktree_directory
                                        : resolvedProjectDir_1;
                                    runtime = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                                        threadId: thread_1.id,
                                        thread: thread_1,
                                        projectDirectory: resolvedProjectDir_1,
                                        sdkDirectory: sdkDir,
                                        channelId: (parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.id) || undefined,
                                        appId: currentAppId,
                                    });
                                    if (!(!message.author.bot && !isCliInjectedPrompt_1)) return [3 /*break*/, 37];
                                    (0, action_buttons_js_1.cancelPendingActionButtons)(thread_1.id);
                                    (0, html_actions_js_1.cancelHtmlActionsForThread)(thread_1.id);
                                    return [4 /*yield*/, (0, permissions_js_1.cancelPendingPermission)(thread_1.id)];
                                case 31:
                                    dismissedPermission = _s.sent();
                                    if (!dismissedPermission) return [3 /*break*/, 33];
                                    return [4 /*yield*/, runtime.abortActiveRunAndWait({
                                            reason: 'user sent a new message while permission was pending',
                                        })];
                                case 32:
                                    _s.sent();
                                    _s.label = 33;
                                case 33:
                                    dismissedQuestion = (0, ask_question_js_1.hasPendingQuestionForThread)(thread_1.id);
                                    if (!dismissedQuestion) return [3 /*break*/, 36];
                                    return [4 /*yield*/, (0, ask_question_js_1.cancelPendingQuestion)(thread_1.id)];
                                case 34:
                                    _s.sent();
                                    return [4 /*yield*/, runtime.abortActiveRunAndWait({
                                            reason: 'user sent a new message while question was pending',
                                        })];
                                case 35:
                                    _s.sent();
                                    _s.label = 36;
                                case 36:
                                    void (0, file_upload_js_1.cancelPendingFileUpload)(thread_1.id);
                                    _s.label = 37;
                                case 37: return [4 /*yield*/, runtime.enqueueIncoming({
                                        prompt: '',
                                        userId: cliInjectedUserId || message.author.id,
                                        username: cliInjectedUsername ||
                                            ((_p = message.member) === null || _p === void 0 ? void 0 : _p.displayName) ||
                                            message.author.displayName,
                                        sourceMessageId: message.id,
                                        sourceThreadId: thread_1.id,
                                        appId: currentAppId,
                                        agent: cliInjectedAgent,
                                        model: cliInjectedModel,
                                        permissions: cliInjectedPermissions,
                                        injectionGuardPatterns: cliInjectedInjectionGuardPatterns,
                                        sessionStartSource: sessionStartSource
                                            ? {
                                                scheduleKind: sessionStartSource.scheduleKind,
                                                scheduledTaskId: sessionStartSource.scheduledTaskId,
                                            }
                                            : undefined,
                                        preprocess: function () {
                                            return (0, message_preprocessing_js_1.preprocessExistingThreadMessage)({
                                                message: message,
                                                thread: thread_1,
                                                projectDirectory: resolvedProjectDir_1,
                                                channelId: (parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.id) || undefined,
                                                isCliInjected: isCliInjectedPrompt_1,
                                                hasVoiceAttachment: hasVoiceAttachment_1,
                                                appId: currentAppId,
                                            });
                                        },
                                    })
                                    // Notify when a voice message was queued instead of sent immediately
                                ];
                                case 38:
                                    enqueueResult = _s.sent();
                                    if (!(enqueueResult.queued && enqueueResult.position)) return [3 /*break*/, 40];
                                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread_1, "Queued at position ".concat(enqueueResult.position))];
                                case 39:
                                    _s.sent();
                                    _s.label = 40;
                                case 40:
                                    if (!(channel.type === discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 62];
                                    // `kimaki send` posts a starter message with a `start` embed marker,
                                    // then creates the thread via REST. The ThreadCreate handler picks up
                                    // that thread and starts the session. If we don't skip here, this
                                    // handler races the CLI to call startThread() on the same message,
                                    // causing DiscordAPIError[160004] "A thread has already been created
                                    // for this message".
                                    if (promptMarker === null || promptMarker === void 0 ? void 0 : promptMarker.start) {
                                        return [2 /*return*/];
                                    }
                                    voiceLogger.log("[GUILD_TEXT] Message in text channel #".concat(channel.name, " (").concat(channel.id, ")"));
                                    return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(channel.id)];
                                case 41:
                                    channelConfig = _s.sent();
                                    if (!!channelConfig) return [3 /*break*/, 44];
                                    botMentioned = Boolean(discordClient.user && message.mentions.has(discordClient.user.id));
                                    if (!botMentioned) return [3 /*break*/, 43];
                                    // TODO: Consider creating/using a session for any text channel when Kimaki is
                                    // explicitly @mentioned, so the bot can answer quick questions even before
                                    // the channel is linked to a project.
                                    return [4 /*yield*/, message.reply({
                                            content: 'This channel is not connected to an OpenCode project.\nSend your message in a project channel, or use `/add-project` for an existing project, or `/create-new-project` to make a new one.',
                                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                        })];
                                case 42:
                                    // TODO: Consider creating/using a session for any text channel when Kimaki is
                                    // explicitly @mentioned, so the bot can answer quick questions even before
                                    // the channel is linked to a project.
                                    _s.sent();
                                    return [2 /*return*/];
                                case 43:
                                    voiceLogger.log("[IGNORED] Channel #".concat(channel.name, " has no project directory configured"));
                                    return [2 /*return*/];
                                case 44:
                                    projectDirectory_1 = channelConfig.directory;
                                    // Note: Mention mode is checked early in the handler (before permission check)
                                    // to avoid sending permission errors to users who just didn't @mention the bot.
                                    discordLogger.log("DIRECTORY: Found kimaki.directory: ".concat(projectDirectory_1));
                                    if (!!node_fs_1.default.existsSync(projectDirectory_1)) return [3 /*break*/, 46];
                                    discordLogger.error("Directory does not exist: ".concat(projectDirectory_1));
                                    return [4 /*yield*/, message.reply({
                                            content: "\u2717 Directory does not exist: ".concat(JSON.stringify(projectDirectory_1).slice(0, 1900)),
                                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                                        })];
                                case 45:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 46:
                                    if (!isMissingReadableMessageContent(message)) return [3 /*break*/, 48];
                                    return [4 /*yield*/, message.reply({
                                            content: MISSING_MESSAGE_CONTENT_REPLY,
                                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                        })];
                                case 47:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 48:
                                    if (!((_q = message.content) === null || _q === void 0 ? void 0 : _q.startsWith('!'))) return [3 /*break*/, 52];
                                    shellCmd = message.content.slice(1).trim();
                                    if (!shellCmd) return [3 /*break*/, 52];
                                    return [4 /*yield*/, message.reply({
                                            content: "Running `".concat(shellCmd.slice(0, 1900), "`..."),
                                        })];
                                case 49:
                                    loadingReply = _s.sent();
                                    return [4 /*yield*/, (0, run_command_js_1.runShellCommand)({
                                            command: shellCmd,
                                            directory: projectDirectory_1,
                                        })];
                                case 50:
                                    result = _s.sent();
                                    return [4 /*yield*/, loadingReply.edit({ content: result })];
                                case 51:
                                    _s.sent();
                                    return [2 /*return*/];
                                case 52:
                                    hasVoice_1 = message.attachments.some(function (attachment) {
                                        return (0, voice_attachment_js_1.isVoiceAttachment)(attachment);
                                    });
                                    baseThreadName = hasVoice_1
                                        ? 'Voice Message'
                                        : (0, discord_utils_js_1.stripMentions)(message.content || '')
                                            .replace(/\s+/g, ' ')
                                            .trim() || 'kimaki thread';
                                    _a = useWorktrees;
                                    if (_a) return [3 /*break*/, 54];
                                    return [4 /*yield*/, (0, database_js_1.getChannelWorktreesEnabled)(channel.id)];
                                case 53:
                                    _a = (_s.sent());
                                    _s.label = 54;
                                case 54:
                                    wantsWorktrees = _a;
                                    _b = wantsWorktrees;
                                    if (!_b) return [3 /*break*/, 56];
                                    return [4 /*yield*/, (0, worktrees_js_1.isGitRepositoryRoot)(projectDirectory_1)];
                                case 55:
                                    _b = (_s.sent());
                                    _s.label = 56;
                                case 56:
                                    shouldUseWorktrees = _b;
                                    if (wantsWorktrees && !shouldUseWorktrees) {
                                        discordLogger.warn("[WORKTREE] Skipping automatic worktree for non-git project directory: ".concat(projectDirectory_1));
                                    }
                                    threadName = shouldUseWorktrees
                                        ? "".concat(merge_worktree_js_1.WORKTREE_PREFIX).concat(baseThreadName)
                                        : baseThreadName;
                                    return [4 /*yield*/, message.startThread({
                                            name: threadName.slice(0, 80),
                                            autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneDay,
                                            reason: 'Start Claude session',
                                        })
                                        // Add user to thread so it appears in their sidebar
                                    ];
                                case 57:
                                    thread_2 = _s.sent();
                                    // Add user to thread so it appears in their sidebar
                                    return [4 /*yield*/, thread_2.members.add(message.author.id)];
                                case 58:
                                    // Add user to thread so it appears in their sidebar
                                    _s.sent();
                                    discordLogger.log("Created thread \"".concat(thread_2.name, "\" (").concat(thread_2.id, ")"));
                                    if (!shouldUseWorktrees) return [3 /*break*/, 60];
                                    worktreeName = (0, new_worktree_js_1.formatAutoWorktreeName)(hasVoice_1 ? "voice-".concat(Date.now()) : threadName.slice(0, 50));
                                    discordLogger.log("[WORKTREE] Creating worktree: ".concat(worktreeName));
                                    return [4 /*yield*/, thread_2
                                            .send({
                                            content: (0, new_worktree_js_1.worktreeCreatingMessage)(worktreeName),
                                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                        })
                                            .catch(function () { return undefined; })];
                                case 59:
                                    worktreeStatusMessage = _s.sent();
                                    worktreePromise_1 = (0, new_worktree_js_1.createWorktreeInBackground)({
                                        thread: thread_2,
                                        starterMessage: worktreeStatusMessage,
                                        worktreeName: worktreeName,
                                        projectDirectory: projectDirectory_1,
                                        rest: discordClient.rest,
                                    });
                                    _s.label = 60;
                                case 60:
                                    channelRuntime_1 = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                                        threadId: thread_2.id,
                                        thread: thread_2,
                                        projectDirectory: projectDirectory_1,
                                        sdkDirectory: projectDirectory_1,
                                        channelId: channel.id,
                                        appId: currentAppId,
                                    });
                                    return [4 /*yield*/, channelRuntime_1.enqueueIncoming({
                                            prompt: '',
                                            userId: message.author.id,
                                            username: ((_r = message.member) === null || _r === void 0 ? void 0 : _r.displayName) || message.author.displayName,
                                            sourceMessageId: message.id,
                                            sourceThreadId: thread_2.id,
                                            appId: currentAppId,
                                            preprocess: function () { return __awaiter(_this, void 0, void 0, function () {
                                                var sessionDirectory, result;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            sessionDirectory = projectDirectory_1;
                                                            if (!worktreePromise_1) return [3 /*break*/, 2];
                                                            return [4 /*yield*/, worktreePromise_1];
                                                        case 1:
                                                            result = _a.sent();
                                                            if (!(result instanceof Error)) {
                                                                sessionDirectory = result;
                                                                channelRuntime_1.handleDirectoryChanged({
                                                                    oldDirectory: projectDirectory_1,
                                                                    newDirectory: sessionDirectory,
                                                                });
                                                            }
                                                            _a.label = 2;
                                                        case 2: return [2 /*return*/, (0, message_preprocessing_js_1.preprocessNewThreadMessage)({
                                                                message: message,
                                                                thread: thread_2,
                                                                projectDirectory: sessionDirectory,
                                                                hasVoiceAttachment: hasVoice_1,
                                                                appId: currentAppId,
                                                            })];
                                                    }
                                                });
                                            }); },
                                        })];
                                case 61:
                                    _s.sent();
                                    return [3 /*break*/, 62];
                                case 62: return [3 /*break*/, 68];
                                case 63:
                                    error_1 = _s.sent();
                                    voiceLogger.error('Discord handler error:', error_1);
                                    void (0, sentry_js_1.notifyError)(error_1, 'MessageCreate handler error');
                                    _s.label = 64;
                                case 64:
                                    _s.trys.push([64, 66, , 67]);
                                    errMsg = (error_1 instanceof Error ? error_1.message : String(error_1)).slice(0, 1900);
                                    return [4 /*yield*/, message.reply({
                                            content: "Error: ".concat(errMsg),
                                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                                        })];
                                case 65:
                                    _s.sent();
                                    return [3 /*break*/, 67];
                                case 66:
                                    sendError_1 = _s.sent();
                                    voiceLogger.error('Discord handler error (fallback):', sendError_1 instanceof Error ? sendError_1.message : String(sendError_1));
                                    return [3 /*break*/, 67];
                                case 67: return [3 /*break*/, 68];
                                case 68: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Handle bot-initiated threads created by `kimaki send` (without --notify-only)
                    // Uses JSON embed marker to pass options (start, worktree name)
                    discordClient.on(discord_js_1.Events.ThreadCreate, function (thread, newlyCreated) { return __awaiter(_this, void 0, void 0, function () {
                        var parent_2, starterMessage, embedFooter, marker, textAttachmentsContent, messageText, prompt_1, channelConfig, projectDirectory_2, worktreePromise_2, _a, worktreeStatusMessage, cwdDirectory_1, cwdResult, branchResult, cwdWorktreeName, botThreadStartSource, runtime_1, error_2, errMsg, sendError_2;
                        var _this = this;
                        var _b, _c, _d, _e;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    _f.trys.push([0, 20, , 25]);
                                    if (!newlyCreated) {
                                        return [2 /*return*/];
                                    }
                                    parent_2 = thread.parent;
                                    if (!parent_2 || parent_2.type !== discord_js_1.ChannelType.GuildText) {
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, thread
                                            .fetchStarterMessage()
                                            .catch(function (error) {
                                            discordLogger.warn("[THREAD_CREATE] Failed to fetch starter message for thread ".concat(thread.id, ":"), error instanceof Error ? error.stack : String(error));
                                            return null;
                                        })];
                                case 1:
                                    starterMessage = _f.sent();
                                    if (!starterMessage) {
                                        discordLogger.log("[THREAD_CREATE] Could not fetch starter message for thread ".concat(thread.id));
                                        return [2 /*return*/];
                                    }
                                    embedFooter = (_c = (_b = starterMessage.embeds[0]) === null || _b === void 0 ? void 0 : _b.footer) === null || _c === void 0 ? void 0 : _c.text;
                                    if (!embedFooter) {
                                        return [2 /*return*/];
                                    }
                                    // Only process markers from our own bot messages to prevent crafted embeds
                                    if (((_d = starterMessage.author) === null || _d === void 0 ? void 0 : _d.id) !== ((_e = discordClient.user) === null || _e === void 0 ? void 0 : _e.id)) {
                                        return [2 /*return*/];
                                    }
                                    marker = parseEmbedFooterMarker({
                                        footer: embedFooter,
                                    });
                                    if (!marker) {
                                        return [2 /*return*/];
                                    }
                                    if (!marker.start) {
                                        return [2 /*return*/]; // Not an auto-start thread
                                    }
                                    discordLogger.log("[BOT_SESSION] Detected bot-initiated thread: ".concat(thread.name));
                                    return [4 /*yield*/, (0, message_formatting_js_1.getTextAttachments)(starterMessage)];
                                case 2:
                                    textAttachmentsContent = _f.sent();
                                    messageText = (0, message_formatting_js_1.resolveMentions)(starterMessage).trim();
                                    prompt_1 = textAttachmentsContent
                                        ? "".concat(messageText, "\n\n").concat(textAttachmentsContent)
                                        : messageText;
                                    if (!prompt_1) {
                                        discordLogger.log("[BOT_SESSION] No prompt found in starter message");
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(parent_2.id)];
                                case 3:
                                    channelConfig = _f.sent();
                                    if (!channelConfig) {
                                        discordLogger.log("[BOT_SESSION] No project directory configured for parent channel");
                                        return [2 /*return*/];
                                    }
                                    projectDirectory_2 = channelConfig.directory;
                                    if (!!node_fs_1.default.existsSync(projectDirectory_2)) return [3 /*break*/, 5];
                                    discordLogger.error("[BOT_SESSION] Directory does not exist: ".concat(projectDirectory_2));
                                    return [4 /*yield*/, thread.send({
                                            content: "\u2717 Directory does not exist: ".concat(JSON.stringify(projectDirectory_2).slice(0, 1900)),
                                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                                        })];
                                case 4:
                                    _f.sent();
                                    return [2 /*return*/];
                                case 5:
                                    _a = marker.worktree;
                                    if (!_a) return [3 /*break*/, 7];
                                    return [4 /*yield*/, (0, worktrees_js_1.isGitRepositoryRoot)(projectDirectory_2)];
                                case 6:
                                    _a = (_f.sent());
                                    _f.label = 7;
                                case 7:
                                    if (!_a) return [3 /*break*/, 9];
                                    discordLogger.log("[BOT_SESSION] Creating worktree: ".concat(marker.worktree));
                                    return [4 /*yield*/, thread
                                            .send({
                                            content: (0, new_worktree_js_1.worktreeCreatingMessage)(marker.worktree),
                                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                                        })
                                            .catch(function () { return undefined; })];
                                case 8:
                                    worktreeStatusMessage = _f.sent();
                                    worktreePromise_2 = (0, new_worktree_js_1.createWorktreeInBackground)({
                                        thread: thread,
                                        starterMessage: worktreeStatusMessage,
                                        worktreeName: marker.worktree,
                                        projectDirectory: projectDirectory_2,
                                        rest: discordClient.rest,
                                    });
                                    return [3 /*break*/, 10];
                                case 9:
                                    if (marker.worktree) {
                                        discordLogger.warn("[BOT_SESSION] Skipping requested worktree for non-git project directory: ".concat(projectDirectory_2));
                                    }
                                    _f.label = 10;
                                case 10:
                                    if (!marker.cwd) return [3 /*break*/, 18];
                                    return [4 /*yield*/, (0, worktrees_js_1.resolveSessionWorkingDirectory)({
                                            projectDirectory: projectDirectory_2,
                                            candidatePath: marker.cwd,
                                        })];
                                case 11:
                                    cwdResult = _f.sent();
                                    if (!(cwdResult instanceof Error)) return [3 /*break*/, 13];
                                    discordLogger.error("[BOT_SESSION] --cwd validation failed: ".concat(cwdResult.message));
                                    return [4 /*yield*/, thread.send({
                                            content: "\u2717 --cwd validation failed: ".concat(cwdResult.message.slice(0, 1900)),
                                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                                        })];
                                case 12:
                                    _f.sent();
                                    return [2 /*return*/];
                                case 13:
                                    if (node_path_1.default.resolve(cwdResult.directory) !== node_path_1.default.resolve(projectDirectory_2)) {
                                        cwdDirectory_1 = cwdResult.directory;
                                    }
                                    if (!(cwdResult.kind === 'worktree' && cwdDirectory_1)) return [3 /*break*/, 18];
                                    return [4 /*yield*/, (0, worktrees_js_1.git)(cwdDirectory_1, 'symbolic-ref --short HEAD')];
                                case 14:
                                    branchResult = _f.sent();
                                    cwdWorktreeName = branchResult instanceof Error
                                        ? node_path_1.default.basename(cwdDirectory_1)
                                        : branchResult;
                                    return [4 /*yield*/, (0, database_js_1.createPendingWorktree)({
                                            threadId: thread.id,
                                            worktreeName: cwdWorktreeName,
                                            projectDirectory: projectDirectory_2,
                                        })];
                                case 15:
                                    _f.sent();
                                    return [4 /*yield*/, (0, database_js_1.setWorktreeReady)({
                                            threadId: thread.id,
                                            worktreeDirectory: cwdDirectory_1,
                                        })
                                        // React with tree emoji to mark as worktree thread
                                    ];
                                case 16:
                                    _f.sent();
                                    // React with tree emoji to mark as worktree thread
                                    return [4 /*yield*/, (0, discord_utils_js_1.reactToThread)({
                                            rest: discordClient.rest,
                                            threadId: thread.id,
                                            channelId: parent_2.id,
                                            emoji: '🌳',
                                        })];
                                case 17:
                                    // React with tree emoji to mark as worktree thread
                                    _f.sent();
                                    _f.label = 18;
                                case 18:
                                    discordLogger.log("[BOT_SESSION] Starting session for thread ".concat(thread.id, " with prompt: \"").concat(prompt_1.slice(0, 50), "...\""));
                                    botThreadStartSource = parseSessionStartSourceFromMarker(marker);
                                    runtime_1 = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                                        threadId: thread.id,
                                        thread: thread,
                                        projectDirectory: projectDirectory_2,
                                        sdkDirectory: projectDirectory_2,
                                        channelId: parent_2.id,
                                        appId: currentAppId,
                                    });
                                    return [4 /*yield*/, runtime_1.enqueueIncoming({
                                            prompt: '',
                                            userId: marker.userId || '',
                                            username: marker.username || 'bot',
                                            appId: currentAppId,
                                            agent: marker.agent,
                                            model: marker.model,
                                            permissions: marker.permissions,
                                            injectionGuardPatterns: marker.injectionGuardPatterns,
                                            mode: 'opencode',
                                            sessionStartSource: botThreadStartSource
                                                ? {
                                                    scheduleKind: botThreadStartSource.scheduleKind,
                                                    scheduledTaskId: botThreadStartSource.scheduledTaskId,
                                                }
                                                : undefined,
                                            preprocess: function () { return __awaiter(_this, void 0, void 0, function () {
                                                var result;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            if (!worktreePromise_2) return [3 /*break*/, 2];
                                                            return [4 /*yield*/, worktreePromise_2];
                                                        case 1:
                                                            result = _a.sent();
                                                            if (!(result instanceof Error)) {
                                                                runtime_1.handleDirectoryChanged({
                                                                    oldDirectory: projectDirectory_2,
                                                                    newDirectory: result,
                                                                });
                                                            }
                                                            _a.label = 2;
                                                        case 2:
                                                            // --cwd: switch sdkDirectory to the existing worktree path
                                                            if (cwdDirectory_1) {
                                                                runtime_1.handleDirectoryChanged({
                                                                    oldDirectory: projectDirectory_2,
                                                                    newDirectory: cwdDirectory_1,
                                                                });
                                                            }
                                                            return [2 /*return*/, { prompt: prompt_1, mode: 'opencode' }];
                                                    }
                                                });
                                            }); },
                                        })];
                                case 19:
                                    _f.sent();
                                    return [3 /*break*/, 25];
                                case 20:
                                    error_2 = _f.sent();
                                    voiceLogger.error('[BOT_SESSION] Error handling bot-initiated thread:', error_2);
                                    void (0, sentry_js_1.notifyError)(error_2, 'ThreadCreate handler error');
                                    _f.label = 21;
                                case 21:
                                    _f.trys.push([21, 23, , 24]);
                                    errMsg = (error_2 instanceof Error ? error_2.message : String(error_2)).slice(0, 1900);
                                    return [4 /*yield*/, thread.send({
                                            content: "Error: ".concat(errMsg),
                                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                                        })];
                                case 22:
                                    _f.sent();
                                    return [3 /*break*/, 24];
                                case 23:
                                    sendError_2 = _f.sent();
                                    voiceLogger.error('[BOT_SESSION] Failed to send error message:', sendError_2 instanceof Error ? sendError_2.message : String(sendError_2));
                                    return [3 /*break*/, 24];
                                case 24: return [3 /*break*/, 25];
                                case 25: return [2 /*return*/];
                            }
                        });
                    }); });
                    // Dispose runtime when a thread is deleted so memory is freed immediately
                    // instead of waiting for the idle sweeper (1 hour default).
                    discordClient.on(discord_js_1.Events.ThreadDelete, function (thread) {
                        (0, thread_session_runtime_js_1.disposeRuntime)(thread.id);
                    });
                    // Clean up SQLite when a Discord channel is deleted so project list
                    // doesn't show stale ghost entries. Thread runtimes inside the deleted
                    // channel are disposed by their own ThreadDelete events from Discord.
                    discordClient.on(discord_js_1.Events.ChannelDelete, function (channel) { return __awaiter(_this, void 0, void 0, function () {
                        var deleted, error_3;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, (0, database_js_1.deleteChannelDirectoryById)(channel.id)];
                                case 1:
                                    deleted = _a.sent();
                                    if (deleted) {
                                        discordLogger.log("Cleaned up channel_directories for deleted channel ".concat(channel.id));
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_3 = _a.sent();
                                    (0, sentry_js_1.notifyError)(error_3 instanceof Error ? error_3 : new Error(String(error_3)), "Failed to clean up channel_directories for deleted channel ".concat(channel.id));
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    if (!!discordClient.isReady()) return [3 /*break*/, 7];
                    return [4 /*yield*/, discordClient.login(token)];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7:
                    (0, heap_monitor_js_1.startHeapMonitor)();
                    stopTaskRunner = (0, task_runner_js_1.startTaskRunner)({ token: token });
                    stopRuntimeIdleSweeper = (0, runtime_idle_sweeper_js_1.startRuntimeIdleSweeper)();
                    if (!(0, asr_service_manager_js_1.shouldAutoStartAsr)()) return [3 /*break*/, 9];
                    voiceLogger.log('[ASR] Auto-starting Parakeet ASR service (Apple Silicon detected)');
                    return [4 /*yield*/, (0, asr_service_manager_js_1.startAsrService)().catch(function (e) {
                            voiceLogger.error('[ASR] Failed to start ASR service:', e);
                        })];
                case 8:
                    _c.sent();
                    _c.label = 9;
                case 9:
                    if (!(0, vllm_service_manager_js_1.shouldAutoStartVLLM)()) return [3 /*break*/, 11];
                    voiceLogger.log('[ASR] Auto-starting vLLM Whisper service');
                    return [4 /*yield*/, (0, vllm_service_manager_js_1.startVLLMService)().catch(function (e) {
                            voiceLogger.error('[ASR] Failed to start vLLM service:', e);
                        })];
                case 10:
                    _c.sent();
                    _c.label = 11;
                case 11:
                    handleShutdown = function (signal_1) {
                        var args_1 = [];
                        for (var _i = 1; _i < arguments.length; _i++) {
                            args_1[_i - 1] = arguments[_i];
                        }
                        return __awaiter(_this, __spreadArray([signal_1], args_1, true), void 0, function (signal, _a) {
                            var cleanupPromises, _b, voiceConnections_1, guildId, error_4;
                            var _c = _a === void 0 ? {} : _a, _d = _c.skipExit, skipExit = _d === void 0 ? false : _d;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        discordLogger.log("Received ".concat(signal, ", cleaning up..."));
                                        if (global.shuttingDown) {
                                            discordLogger.log('Already shutting down, ignoring duplicate signal');
                                            return [2 /*return*/];
                                        }
                                        ;
                                        global.shuttingDown = true;
                                        _e.label = 1;
                                    case 1:
                                        _e.trys.push([1, 11, , 12]);
                                        return [4 /*yield*/, stopRuntimeIdleSweeper()];
                                    case 2:
                                        _e.sent();
                                        return [4 /*yield*/, stopTaskRunner()];
                                    case 3:
                                        _e.sent();
                                        return [4 /*yield*/, (0, debounced_process_flush_js_1.flushDebouncedProcessCallbacks)().catch(function (error) {
                                                discordLogger.warn('Failed to flush debounced process callbacks:', error instanceof Error ? error.stack : String(error));
                                            })
                                            // Cancel pending IPC requests so plugin tools don't hang
                                        ];
                                    case 4:
                                        _e.sent();
                                        // Cancel pending IPC requests so plugin tools don't hang
                                        return [4 /*yield*/, (0, database_js_1.cancelAllPendingIpcRequests)().catch(function (e) {
                                                discordLogger.warn('Failed to cancel pending IPC requests:', e.message);
                                            })];
                                    case 5:
                                        // Cancel pending IPC requests so plugin tools don't hang
                                        _e.sent();
                                        cleanupPromises = [];
                                        for (_b = 0, voiceConnections_1 = voice_handler_js_1.voiceConnections; _b < voiceConnections_1.length; _b++) {
                                            guildId = voiceConnections_1[_b][0];
                                            voiceLogger.log("[SHUTDOWN] Cleaning up voice connection for guild ".concat(guildId));
                                            cleanupPromises.push((0, voice_handler_js_1.cleanupVoiceConnection)(guildId));
                                        }
                                        if (!(cleanupPromises.length > 0)) return [3 /*break*/, 7];
                                        voiceLogger.log("[SHUTDOWN] Waiting for ".concat(cleanupPromises.length, " voice connection(s) to clean up..."));
                                        return [4 /*yield*/, Promise.allSettled(cleanupPromises)];
                                    case 6:
                                        _e.sent();
                                        discordLogger.log("All voice connections cleaned up");
                                        _e.label = 7;
                                    case 7:
                                        voiceLogger.log('[SHUTDOWN] Stopping OpenCode server');
                                        (0, external_opencode_sync_js_1.stopExternalOpencodeSessionSync)();
                                        return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)()
                                            // Stop ASR and vLLM services
                                        ];
                                    case 8:
                                        _e.sent();
                                        // Stop ASR and vLLM services
                                        (0, asr_service_manager_js_1.stopAsrService)();
                                        (0, vllm_service_manager_js_1.stopVLLMService)();
                                        discordLogger.log('Closing database...');
                                        return [4 /*yield*/, (0, database_js_1.closeDatabase)()];
                                    case 9:
                                        _e.sent();
                                        discordLogger.log('Stopping hrana server...');
                                        return [4 /*yield*/, (0, hrana_server_js_1.stopHranaServer)()];
                                    case 10:
                                        _e.sent();
                                        discordLogger.log('Destroying Discord client...');
                                        void discordClient.destroy();
                                        discordLogger.log('Cleanup complete.');
                                        if (!skipExit) {
                                            process.exit(0);
                                        }
                                        return [3 /*break*/, 12];
                                    case 11:
                                        error_4 = _e.sent();
                                        voiceLogger.error('[SHUTDOWN] Error during cleanup:', error_4);
                                        if (!skipExit) {
                                            process.exit(1);
                                        }
                                        return [3 /*break*/, 12];
                                    case 12: return [2 /*return*/];
                                }
                            });
                        });
                    };
                    process.on('SIGTERM', function () { return __awaiter(_this, void 0, void 0, function () {
                        var error_5;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, handleShutdown('SIGTERM')];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_5 = _a.sent();
                                    voiceLogger.error('[SIGTERM] Error during shutdown:', error_5);
                                    process.exit(1);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    process.on('SIGINT', function () { return __awaiter(_this, void 0, void 0, function () {
                        var error_6;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, handleShutdown('SIGINT')];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    error_6 = _a.sent();
                                    voiceLogger.error('[SIGINT] Error during shutdown:', error_6);
                                    process.exit(1);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    process.on('SIGUSR1', function () {
                        discordLogger.log('Received SIGUSR1, writing heap snapshot...');
                        (0, heap_monitor_js_1.writeHeapSnapshot)().catch(function (e) {
                            discordLogger.error('Failed to write heap snapshot:', e instanceof Error ? e.message : String(e));
                        });
                    });
                    process.on('SIGUSR2', function () { return __awaiter(_this, void 0, void 0, function () {
                        var error_7, spawn, env;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    discordLogger.log('Received SIGUSR2, restarting after cleanup...');
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, handleShutdown('SIGUSR2', { skipExit: true })];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_7 = _a.sent();
                                    voiceLogger.error('[SIGUSR2] Error during shutdown:', error_7);
                                    return [3 /*break*/, 4];
                                case 4: return [4 /*yield*/, Promise.resolve().then(function () { return require('node:child_process'); })];
                                case 5:
                                    spawn = (_a.sent()).spawn;
                                    env = __assign({}, process.env);
                                    delete env.__KIMAKI_CHILD;
                                    spawn(process.argv[0], __spreadArray(__spreadArray([], process.execArgv, true), process.argv.slice(1), true), {
                                        stdio: 'inherit',
                                        detached: true,
                                        cwd: process.cwd(),
                                        env: env,
                                    }).unref();
                                    process.exit(0);
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    process.on('uncaughtException', function (error) {
                        discordLogger.error('Uncaught exception:', (0, logger_js_1.formatErrorWithStack)(error));
                        (0, sentry_js_1.notifyError)(error, 'Uncaught exception in bot process');
                        void handleShutdown('uncaughtException', { skipExit: true }).catch(function (shutdownError) {
                            discordLogger.error('[uncaughtException] shutdown failed:', (0, logger_js_1.formatErrorWithStack)(shutdownError));
                        });
                        setTimeout(function () {
                            process.exit(1);
                        }, 250).unref();
                    });
                    process.on('unhandledRejection', function (reason, promise) {
                        if (global.shuttingDown) {
                            discordLogger.log('Ignoring unhandled rejection during shutdown:', reason);
                            return;
                        }
                        discordLogger.error('Unhandled rejection:', (0, logger_js_1.formatErrorWithStack)(reason), 'at promise:', promise);
                        var error = reason instanceof Error
                            ? reason
                            : new Error((0, logger_js_1.formatErrorWithStack)(reason));
                        void (0, sentry_js_1.notifyError)(error, 'Unhandled rejection in bot process');
                    });
                    return [2 /*return*/];
            }
        });
    });
}
var templateObject_1;
