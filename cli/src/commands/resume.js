"use strict";
// /resume command - Resume an existing OpenCode session.
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
exports.handleResumeCommand = handleResumeCommand;
exports.handleResumeAutocomplete = handleResumeAutocomplete;
var discord_js_1 = require("discord.js");
var node_fs_1 = require("node:fs");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var message_formatting_js_1 = require("../message-formatting.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.RESUME);
function handleResumeCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var sessionId, channel, isThread, channelConfig, projectDirectory, getClient, sessionResponse, sessionTitle, thread_1, messagesResponse, messages, _c, chunks, skippedCount, batched, _loop_1, _i, batched_1, batch, messageCount, sendError_1, error_1;
        var command = _b.command;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, command.deferReply()];
                case 1:
                    _d.sent();
                    sessionId = command.options.getString('session', true);
                    channel = command.channel;
                    isThread = channel &&
                        [
                            discord_js_1.ChannelType.PublicThread,
                            discord_js_1.ChannelType.PrivateThread,
                            discord_js_1.ChannelType.AnnouncementThread,
                        ].includes(channel.type);
                    if (!isThread) return [3 /*break*/, 3];
                    return [4 /*yield*/, command.editReply('This command can only be used in project channels, not threads')];
                case 2:
                    _d.sent();
                    return [2 /*return*/];
                case 3:
                    if (!(!channel || channel.type !== discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 5];
                    return [4 /*yield*/, command.editReply('This command can only be used in text channels')];
                case 4:
                    _d.sent();
                    return [2 /*return*/];
                case 5: return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(channel.id)];
                case 6:
                    channelConfig = _d.sent();
                    projectDirectory = channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.directory;
                    if (!!projectDirectory) return [3 /*break*/, 8];
                    return [4 /*yield*/, command.editReply('This channel is not configured with a project directory')];
                case 7:
                    _d.sent();
                    return [2 /*return*/];
                case 8:
                    if (!!node_fs_1.default.existsSync(projectDirectory)) return [3 /*break*/, 10];
                    return [4 /*yield*/, command.editReply("Directory does not exist: ".concat(projectDirectory))];
                case 9:
                    _d.sent();
                    return [2 /*return*/];
                case 10:
                    _d.trys.push([10, 34, , 36]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 11:
                    getClient = _d.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 13];
                    return [4 /*yield*/, command.editReply(getClient.message)];
                case 12:
                    _d.sent();
                    return [2 /*return*/];
                case 13: return [4 /*yield*/, getClient().session.get({
                        sessionID: sessionId,
                    })];
                case 14:
                    sessionResponse = _d.sent();
                    if (!!sessionResponse.data) return [3 /*break*/, 16];
                    return [4 /*yield*/, command.editReply('Session not found')];
                case 15:
                    _d.sent();
                    return [2 /*return*/];
                case 16:
                    sessionTitle = sessionResponse.data.title;
                    return [4 /*yield*/, channel.threads.create({
                            name: "Resume: ".concat(sessionTitle).slice(0, 100),
                            autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneDay,
                            reason: "Resuming session ".concat(sessionId),
                        })
                        // Claim the resumed session immediately so external polling does not race
                        // and create a duplicate Sync thread before the rest of this setup runs.
                    ];
                case 17:
                    thread_1 = _d.sent();
                    // Claim the resumed session immediately so external polling does not race
                    // and create a duplicate Sync thread before the rest of this setup runs.
                    return [4 /*yield*/, (0, database_js_1.setThreadSession)(thread_1.id, sessionId)
                        // Add user to thread so it appears in their sidebar
                    ];
                case 18:
                    // Claim the resumed session immediately so external polling does not race
                    // and create a duplicate Sync thread before the rest of this setup runs.
                    _d.sent();
                    // Add user to thread so it appears in their sidebar
                    return [4 /*yield*/, thread_1.members.add(command.user.id)];
                case 19:
                    // Add user to thread so it appears in their sidebar
                    _d.sent();
                    logger.log("[RESUME] Created thread ".concat(thread_1.id, " for session ").concat(sessionId));
                    return [4 /*yield*/, getClient().session.messages({
                            sessionID: sessionId,
                        })];
                case 20:
                    messagesResponse = _d.sent();
                    if (!messagesResponse.data) {
                        throw new Error('Failed to fetch session messages');
                    }
                    messages = messagesResponse.data;
                    return [4 /*yield*/, command.editReply("Resumed session \"".concat(sessionTitle, "\" in ").concat(thread_1.toString()))];
                case 21:
                    _d.sent();
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread_1, "**Resumed session:** ".concat(sessionTitle, "\n**Created:** ").concat(new Date(sessionResponse.data.time.created).toLocaleString(), "\n\n*Loading ").concat(messages.length, " messages...*"))];
                case 22:
                    _d.sent();
                    _d.label = 23;
                case 23:
                    _d.trys.push([23, 31, , 33]);
                    _c = (0, message_formatting_js_1.collectSessionChunks)({
                        messages: messages,
                        limit: 30,
                    }), chunks = _c.chunks, skippedCount = _c.skippedCount;
                    if (!(skippedCount > 0)) return [3 /*break*/, 25];
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread_1, "*Skipped ".concat(skippedCount, " older assistant parts...*"))];
                case 24:
                    _d.sent();
                    _d.label = 25;
                case 25:
                    batched = (0, message_formatting_js_1.batchChunksForDiscord)(chunks);
                    _loop_1 = function (batch) {
                        var discordMessage;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0: return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread_1, batch.content)];
                                case 1:
                                    discordMessage = _e.sent();
                                    return [4 /*yield*/, (0, database_js_1.setPartMessagesBatch)(batch.partIds.map(function (partId) { return ({
                                            partId: partId,
                                            messageId: discordMessage.id,
                                            threadId: thread_1.id,
                                        }); }))];
                                case 2:
                                    _e.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, batched_1 = batched;
                    _d.label = 26;
                case 26:
                    if (!(_i < batched_1.length)) return [3 /*break*/, 29];
                    batch = batched_1[_i];
                    return [5 /*yield**/, _loop_1(batch)];
                case 27:
                    _d.sent();
                    _d.label = 28;
                case 28:
                    _i++;
                    return [3 /*break*/, 26];
                case 29:
                    messageCount = messages.length;
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread_1, "**Session resumed!** Loaded ".concat(messageCount, " messages.\n\nYou can now continue the conversation by sending messages in this thread."))];
                case 30:
                    _d.sent();
                    return [3 /*break*/, 33];
                case 31:
                    sendError_1 = _d.sent();
                    logger.error('[RESUME] Error sending messages to thread:', sendError_1);
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread_1, "Failed to load message history, but session is connected. You can still send new messages.", { flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS })];
                case 32:
                    _d.sent();
                    return [3 /*break*/, 33];
                case 33: return [3 /*break*/, 36];
                case 34:
                    error_1 = _d.sent();
                    logger.error('[RESUME] Error:', error_1);
                    return [4 /*yield*/, command.editReply("Failed to resume session: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'))];
                case 35:
                    _d.sent();
                    return [3 /*break*/, 36];
                case 36: return [2 /*return*/];
            }
        });
    });
}
function handleResumeAutocomplete(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var focusedValue, projectDirectory, getClient, sessionsResponse, existingSessionIds_1, _c, sessions, error_2;
        var interaction = _b.interaction;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    focusedValue = interaction.options.getFocused();
                    return [4 /*yield*/, (0, discord_utils_js_1.resolveProjectDirectoryFromAutocomplete)(interaction)];
                case 1:
                    projectDirectory = _d.sent();
                    if (!!projectDirectory) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.respond([])];
                case 2:
                    _d.sent();
                    return [2 /*return*/];
                case 3:
                    _d.trys.push([3, 12, , 14]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 4:
                    getClient = _d.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 6];
                    return [4 /*yield*/, interaction.respond([])];
                case 5:
                    _d.sent();
                    return [2 /*return*/];
                case 6: return [4 /*yield*/, getClient().session.list()];
                case 7:
                    sessionsResponse = _d.sent();
                    if (!!sessionsResponse.data) return [3 /*break*/, 9];
                    return [4 /*yield*/, interaction.respond([])];
                case 8:
                    _d.sent();
                    return [2 /*return*/];
                case 9:
                    _c = Set.bind;
                    return [4 /*yield*/, (0, database_js_1.getAllThreadSessionIds)()];
                case 10:
                    existingSessionIds_1 = new (_c.apply(Set, [void 0, _d.sent()]))();
                    sessions = sessionsResponse.data
                        .filter(function (session) { return !existingSessionIds_1.has(session.id); })
                        .filter(function (session) {
                        return session.title.toLowerCase().includes(focusedValue.toLowerCase());
                    })
                        .slice(0, 25)
                        .map(function (session) {
                        var dateStr = new Date(session.time.updated).toLocaleString();
                        var suffix = " (".concat(dateStr, ")");
                        var maxTitleLength = 100 - suffix.length;
                        var title = session.title;
                        if (title.length > maxTitleLength) {
                            title = title.slice(0, Math.max(0, maxTitleLength - 1)) + '…';
                        }
                        return {
                            name: "".concat(title).concat(suffix),
                            value: session.id,
                        };
                    });
                    return [4 /*yield*/, interaction.respond(sessions)];
                case 11:
                    _d.sent();
                    return [3 /*break*/, 14];
                case 12:
                    error_2 = _d.sent();
                    logger.error('[AUTOCOMPLETE] Error fetching sessions:', error_2);
                    return [4 /*yield*/, interaction.respond([])];
                case 13:
                    _d.sent();
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
