"use strict";
// /fork command - Fork the session from a past user message.
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
exports.handleForkCommand = handleForkCommand;
exports.handleForkSelectMenu = handleForkSelectMenu;
exports.getThreadChannel = getThreadChannel;
exports.parsePersistedEventRows = parsePersistedEventRows;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var message_formatting_js_1 = require("../message-formatting.js");
var logger_js_1 = require("../logger.js");
var errore = require("errore");
var sessionLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.SESSION);
var forkLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.FORK);
function isTruthy(value) {
    return Boolean(value);
}
function getThreadChannelFromCommand(interaction) {
    return getThreadChannel(interaction.channel);
}
function getThreadChannel(channel) {
    if (!channel) {
        return new Error('This command can only be used in a channel');
    }
    if (channel.type !== discord_js_1.ChannelType.PublicThread
        && channel.type !== discord_js_1.ChannelType.PrivateThread
        && channel.type !== discord_js_1.ChannelType.AnnouncementThread) {
        return new Error('This command can only be used in a thread with an active session');
    }
    return channel;
}
function parsePersistedEventRows(_a) {
    var rows = _a.rows;
    return rows.flatMap(function (row) {
        var parsed = errore.try({
            try: function () {
                return JSON.parse(row.event_json);
            },
            catch: function (error) {
                return new Error('Failed to parse persisted event JSON', {
                    cause: error,
                });
            },
        });
        if (parsed instanceof Error) {
            forkLogger.warn("[fork] Skipping invalid persisted event row ".concat(row.id, ": ").concat(parsed.message));
            return [];
        }
        return [{
                event: parsed,
                timestamp: Number(row.timestamp),
                eventIndex: Number(row.event_index),
            }];
    });
}
function truncateLabelPart(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    if (maxLength <= 1) {
        return text.slice(0, maxLength);
    }
    return "".concat(text.slice(0, maxLength - 1), "\u2026");
}
function getSubagentOptionLabel(_a) {
    var subagentType = _a.subagentType, description = _a.description;
    var agent = truncateLabelPart(subagentType || 'task', 24);
    var cleanedDescription = (description === null || description === void 0 ? void 0 : description.trim()) || 'No description';
    var descriptionBudget = Math.max(1, 100 - agent.length - 3);
    var truncatedDescription = truncateLabelPart(cleanedDescription, descriptionBudget);
    return "".concat(agent, " \u00B7 ").concat(truncatedDescription);
}
function handleForkCommand(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var threadChannel, resolved, projectDirectory, sessionId, getClient, messagesResponse, userMessages, recentMessages, options, selectMenu, actionRow, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    threadChannel = getThreadChannelFromCommand(interaction);
                    if (!(threadChannel instanceof Error)) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: threadChannel.message,
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: threadChannel,
                    })];
                case 3:
                    resolved = _a.sent();
                    if (!!resolved) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Could not determine project directory for this channel',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
                case 5:
                    projectDirectory = resolved.projectDirectory;
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(threadChannel.id)];
                case 6:
                    sessionId = _a.sent();
                    if (!!sessionId) return [3 /*break*/, 8];
                    return [4 /*yield*/, interaction.reply({
                            content: 'No active session in this thread',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
                case 8: 
                // Defer reply before API calls to avoid 3-second timeout
                return [4 /*yield*/, interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 9:
                    // Defer reply before API calls to avoid 3-second timeout
                    _a.sent();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 10:
                    getClient = _a.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 12];
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to load messages: ".concat(getClient.message),
                        })];
                case 11:
                    _a.sent();
                    return [2 /*return*/];
                case 12:
                    _a.trys.push([12, 19, , 21]);
                    return [4 /*yield*/, getClient().session.messages({
                            sessionID: sessionId,
                        })];
                case 13:
                    messagesResponse = _a.sent();
                    if (!!messagesResponse.data) return [3 /*break*/, 15];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Failed to fetch session messages',
                        })];
                case 14:
                    _a.sent();
                    return [2 /*return*/];
                case 15:
                    userMessages = messagesResponse.data.filter(function (m) { return m.info.role === 'user'; });
                    if (!(userMessages.length === 0)) return [3 /*break*/, 17];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No user messages found in this session',
                        })];
                case 16:
                    _a.sent();
                    return [2 /*return*/];
                case 17:
                    recentMessages = userMessages.slice(-25);
                    options = recentMessages
                        .map(function (m, index) {
                        var textPart = m.parts.find(function (p) {
                            return p.type === 'text' && !p.synthetic && typeof p.text === 'string';
                        });
                        if (!(textPart === null || textPart === void 0 ? void 0 : textPart.text)) {
                            return null;
                        }
                        var preview = textPart.text.slice(0, 80);
                        var label = "".concat(index + 1, ". ").concat(preview).concat(preview.length >= 80 ? '...' : '');
                        return {
                            label: label.slice(0, 100),
                            value: m.info.id,
                            description: new Date(m.info.time.created)
                                .toLocaleString()
                                .slice(0, 50),
                        };
                    })
                        .filter(isTruthy);
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        // Discord component custom_id max length is 100 chars.
                        // Avoid embedding long directory paths (or base64 of them) in the custom ID.
                        // handleForkSelectMenu resolves the directory from the current thread instead.
                        .setCustomId("fork_select:".concat(sessionId))
                        .setPlaceholder('Select a message to fork from')
                        .addOptions(options);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, interaction.editReply({
                            content: '**Fork Session**\nSelect the user message to fork from. The forked session will continue as if you had not sent that message:',
                            components: [actionRow],
                        })];
                case 18:
                    _a.sent();
                    return [3 /*break*/, 21];
                case 19:
                    error_1 = _a.sent();
                    forkLogger.error('Error loading messages:', error_1);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to load messages: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                        })];
                case 20:
                    _a.sent();
                    return [3 /*break*/, 21];
                case 21: return [2 /*return*/];
            }
        });
    });
}
function handleForkSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, _a, sessionId, selectedMessageId, threadChannel, resolved, projectDirectory, getClient, forkResponse, forkedSession, parentChannel, textChannel, thread_1, messagesResponse, chunks, batched, _loop_1, _i, batched_1, batch, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('fork_select:')) {
                        return [2 /*return*/];
                    }
                    _a = customId.split(':'), sessionId = _a[1];
                    if (!!sessionId) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Invalid selection data',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
                case 2:
                    selectedMessageId = interaction.values[0];
                    if (!!selectedMessageId) return [3 /*break*/, 4];
                    return [4 /*yield*/, interaction.reply({
                            content: 'No message selected',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, interaction.deferReply()];
                case 5:
                    _b.sent();
                    threadChannel = getThreadChannel(interaction.channel);
                    if (!(threadChannel instanceof Error)) return [3 /*break*/, 7];
                    return [4 /*yield*/, interaction.editReply(threadChannel.message)];
                case 6:
                    _b.sent();
                    return [2 /*return*/];
                case 7: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: threadChannel,
                    })];
                case 8:
                    resolved = _b.sent();
                    if (!!resolved) return [3 /*break*/, 10];
                    return [4 /*yield*/, interaction.editReply('Could not determine project directory for this channel')];
                case 9:
                    _b.sent();
                    return [2 /*return*/];
                case 10:
                    projectDirectory = resolved.projectDirectory;
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 11:
                    getClient = _b.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 13];
                    return [4 /*yield*/, interaction.editReply("Failed to fork session: ".concat(getClient.message))];
                case 12:
                    _b.sent();
                    return [2 /*return*/];
                case 13:
                    _b.trys.push([13, 33, , 35]);
                    return [4 /*yield*/, getClient().session.fork({
                            sessionID: sessionId,
                            messageID: selectedMessageId,
                        })];
                case 14:
                    forkResponse = _b.sent();
                    if (!!forkResponse.data) return [3 /*break*/, 16];
                    return [4 /*yield*/, interaction.editReply('Failed to fork session')];
                case 15:
                    _b.sent();
                    return [2 /*return*/];
                case 16:
                    forkedSession = forkResponse.data;
                    parentChannel = getThreadChannel(interaction.channel);
                    if (!(parentChannel instanceof Error)) return [3 /*break*/, 18];
                    return [4 /*yield*/, interaction.editReply(parentChannel.message)];
                case 17:
                    _b.sent();
                    return [2 /*return*/];
                case 18: return [4 /*yield*/, (0, discord_utils_js_1.resolveTextChannel)(parentChannel)];
                case 19:
                    textChannel = _b.sent();
                    if (!!textChannel) return [3 /*break*/, 21];
                    return [4 /*yield*/, interaction.editReply('Could not resolve parent text channel')];
                case 20:
                    _b.sent();
                    return [2 /*return*/];
                case 21: return [4 /*yield*/, textChannel.threads.create({
                        name: "Fork: ".concat(forkedSession.title).slice(0, 100),
                        autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneDay,
                        reason: "Forked from session ".concat(sessionId),
                    })
                    // Claim the forked session immediately so external polling does not race
                    // and create a duplicate Sync thread before the rest of this setup runs.
                ];
                case 22:
                    thread_1 = _b.sent();
                    // Claim the forked session immediately so external polling does not race
                    // and create a duplicate Sync thread before the rest of this setup runs.
                    return [4 /*yield*/, (0, database_js_1.setThreadSession)(thread_1.id, forkedSession.id)
                        // Add user to thread so it appears in their sidebar
                    ];
                case 23:
                    // Claim the forked session immediately so external polling does not race
                    // and create a duplicate Sync thread before the rest of this setup runs.
                    _b.sent();
                    // Add user to thread so it appears in their sidebar
                    return [4 /*yield*/, thread_1.members.add(interaction.user.id)];
                case 24:
                    // Add user to thread so it appears in their sidebar
                    _b.sent();
                    sessionLogger.log("Created forked session ".concat(forkedSession.id, " in thread ").concat(thread_1.id));
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread_1, "**Forked session created!**\nFrom: `".concat(sessionId, "`\nNew session: `").concat(forkedSession.id, "`"))
                        // Fetch and display the last assistant messages from the forked session
                    ];
                case 25:
                    _b.sent();
                    return [4 /*yield*/, getClient().session.messages({
                            sessionID: forkedSession.id,
                        })];
                case 26:
                    messagesResponse = _b.sent();
                    if (!messagesResponse.data) return [3 /*break*/, 30];
                    chunks = (0, message_formatting_js_1.collectSessionChunks)({
                        messages: messagesResponse.data,
                        limit: 30,
                    }).chunks;
                    batched = (0, message_formatting_js_1.batchChunksForDiscord)(chunks);
                    _loop_1 = function (batch) {
                        var discordMessage;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread_1, batch.content)];
                                case 1:
                                    discordMessage = _c.sent();
                                    return [4 /*yield*/, (0, database_js_1.setPartMessagesBatch)(batch.partIds.map(function (partId) { return ({
                                            partId: partId,
                                            messageId: discordMessage.id,
                                            threadId: thread_1.id,
                                        }); }))];
                                case 2:
                                    _c.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, batched_1 = batched;
                    _b.label = 27;
                case 27:
                    if (!(_i < batched_1.length)) return [3 /*break*/, 30];
                    batch = batched_1[_i];
                    return [5 /*yield**/, _loop_1(batch)];
                case 28:
                    _b.sent();
                    _b.label = 29;
                case 29:
                    _i++;
                    return [3 /*break*/, 27];
                case 30: return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread_1, "You can now continue the conversation from this point.")];
                case 31:
                    _b.sent();
                    return [4 /*yield*/, interaction.editReply("Session forked! Continue in ".concat(thread_1.toString()))];
                case 32:
                    _b.sent();
                    return [3 /*break*/, 35];
                case 33:
                    error_2 = _b.sent();
                    forkLogger.error('Error forking session:', error_2);
                    return [4 /*yield*/, interaction.editReply("Failed to fork session: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'))];
                case 34:
                    _b.sent();
                    return [3 /*break*/, 35];
                case 35: return [2 /*return*/];
            }
        });
    });
}
