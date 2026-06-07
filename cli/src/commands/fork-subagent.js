"use strict";
// /fork-subagent command - Fork a subagent task session into a new thread.
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
exports.handleForkSubagentCommand = handleForkSubagentCommand;
exports.handleForkSubagentSelectMenu = handleForkSubagentSelectMenu;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var discord_utils_js_1 = require("../discord-utils.js");
var message_formatting_js_1 = require("../message-formatting.js");
var opencode_js_1 = require("../opencode.js");
var event_stream_state_js_1 = require("../session-handler/event-stream-state.js");
var logger_js_1 = require("../logger.js");
var fork_js_1 = require("./fork.js");
var forkLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.FORK);
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
function handleForkSubagentCommand(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var threadChannel, resolved, sessionId, rows, events, subagentSessions, options, selectMenu, actionRow;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    threadChannel = (0, fork_js_1.getThreadChannel)(interaction.channel);
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
                case 5: return [4 /*yield*/, (0, database_js_1.getThreadSession)(threadChannel.id)];
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
                case 8: return [4 /*yield*/, interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.getSessionEventSnapshot)({ sessionId: sessionId })];
                case 10:
                    rows = _a.sent();
                    events = (0, fork_js_1.parsePersistedEventRows)({ rows: rows });
                    subagentSessions = (0, event_stream_state_js_1.getDerivedSubagentSessions)({
                        events: events,
                        mainSessionId: sessionId,
                    }).slice(0, 25);
                    if (!(subagentSessions.length === 0)) return [3 /*break*/, 12];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No subagent task sessions found in this thread',
                        })];
                case 11:
                    _a.sent();
                    return [2 /*return*/];
                case 12:
                    options = subagentSessions.map(function (subagentSession) { return ({
                        label: getSubagentOptionLabel({
                            subagentType: subagentSession.subagentType,
                            description: subagentSession.description,
                        }),
                        value: subagentSession.childSessionId,
                        description: new Date(subagentSession.timestamp).toLocaleString().slice(0, 100),
                    }); });
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("fork_subagent_select:".concat(sessionId))
                        .setPlaceholder('Select a subagent session to fork')
                        .addOptions(options);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, interaction.editReply({
                            content: '**Fork Subagent Session**\nSelect a subagent task session to fork into a new thread:',
                            components: [actionRow],
                        })];
                case 13:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleForkSubagentSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, _a, parentSessionId, selectedSessionId, threadChannel, resolved, rows, events, selectedSubagent, getClient, forkResponse, textChannel, forkedSession, forkedThread, agentLabel, descriptionLabel, messagesResponse, chunks, batched, _i, batched_1, batch, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('fork_subagent_select:')) {
                        return [2 /*return*/];
                    }
                    _a = customId.split(':'), parentSessionId = _a[1];
                    if (!!parentSessionId) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Invalid selection data',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
                case 2:
                    selectedSessionId = interaction.values[0];
                    if (!!selectedSessionId) return [3 /*break*/, 4];
                    return [4 /*yield*/, interaction.reply({
                            content: 'No subagent session selected',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, interaction.deferReply()];
                case 5:
                    _b.sent();
                    threadChannel = (0, fork_js_1.getThreadChannel)(interaction.channel);
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
                case 10: return [4 /*yield*/, (0, database_js_1.getSessionEventSnapshot)({ sessionId: parentSessionId })];
                case 11:
                    rows = _b.sent();
                    events = (0, fork_js_1.parsePersistedEventRows)({ rows: rows });
                    selectedSubagent = (0, event_stream_state_js_1.getDerivedSubagentSessions)({
                        events: events,
                        mainSessionId: parentSessionId,
                    }).find(function (candidate) {
                        return candidate.childSessionId === selectedSessionId;
                    });
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(resolved.projectDirectory)];
                case 12:
                    getClient = _b.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 14];
                    return [4 /*yield*/, interaction.editReply("Failed to fork session: ".concat(getClient.message))];
                case 13:
                    _b.sent();
                    return [2 /*return*/];
                case 14: return [4 /*yield*/, getClient().session.fork({
                        sessionID: selectedSessionId,
                    })];
                case 15:
                    forkResponse = _b.sent();
                    if (!!forkResponse.data) return [3 /*break*/, 17];
                    return [4 /*yield*/, interaction.editReply('Failed to fork session')];
                case 16:
                    _b.sent();
                    return [2 /*return*/];
                case 17: return [4 /*yield*/, (0, discord_utils_js_1.resolveTextChannel)(threadChannel)];
                case 18:
                    textChannel = _b.sent();
                    if (!!textChannel) return [3 /*break*/, 20];
                    return [4 /*yield*/, interaction.editReply('Could not resolve parent text channel')];
                case 19:
                    _b.sent();
                    return [2 /*return*/];
                case 20:
                    forkedSession = forkResponse.data;
                    return [4 /*yield*/, textChannel.threads.create({
                            name: "Fork: ".concat((selectedSubagent === null || selectedSubagent === void 0 ? void 0 : selectedSubagent.description) || (selectedSubagent === null || selectedSubagent === void 0 ? void 0 : selectedSubagent.subagentType) || 'subagent session').slice(0, 100),
                            autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneDay,
                            reason: "Forked subagent session ".concat(selectedSessionId),
                        })];
                case 21:
                    forkedThread = _b.sent();
                    return [4 /*yield*/, (0, database_js_1.setThreadSession)(forkedThread.id, forkedSession.id)];
                case 22:
                    _b.sent();
                    return [4 /*yield*/, forkedThread.members.add(interaction.user.id)];
                case 23:
                    _b.sent();
                    forkLogger.log("Created forked subagent session ".concat(forkedSession.id, " in thread ").concat(forkedThread.id, " from ").concat(selectedSessionId));
                    agentLabel = (selectedSubagent === null || selectedSubagent === void 0 ? void 0 : selectedSubagent.subagentType) || 'task';
                    descriptionLabel = (selectedSubagent === null || selectedSubagent === void 0 ? void 0 : selectedSubagent.description) || 'No description';
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(forkedThread, "**Forked subagent session created!**\nAgent: `".concat(agentLabel, "`\nTask: ").concat(descriptionLabel, "\nFrom: `").concat(selectedSessionId, "`\nNew session: `").concat(forkedSession.id, "`"))];
                case 24:
                    _b.sent();
                    _b.label = 25;
                case 25:
                    _b.trys.push([25, 31, , 33]);
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
                    _i = 0, batched_1 = batched;
                    _b.label = 27;
                case 27:
                    if (!(_i < batched_1.length)) return [3 /*break*/, 30];
                    batch = batched_1[_i];
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(forkedThread, batch.content)];
                case 28:
                    _b.sent();
                    _b.label = 29;
                case 29:
                    _i++;
                    return [3 /*break*/, 27];
                case 30: return [3 /*break*/, 33];
                case 31:
                    error_1 = _b.sent();
                    forkLogger.error('Error replaying forked subagent history:', error_1);
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(forkedThread, 'Failed to load session messages, but the session is connected and ready to continue.')];
                case 32:
                    _b.sent();
                    return [3 /*break*/, 33];
                case 33: return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(forkedThread, 'You can now continue the conversation from this point.')];
                case 34:
                    _b.sent();
                    return [4 /*yield*/, interaction.editReply("Subagent session forked! Continue in ".concat(forkedThread.toString()))];
                case 35:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
