"use strict";
// /compact command - Trigger context compaction (summarization) for the current session.
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
exports.handleCompactCommand = handleCompactCommand;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.COMPACT);
function handleCompactCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, isThread, resolved, projectDirectory, workingDirectory, sessionId, getClient, client, messagesResult, lastUserMessage, _c, providerID, modelID, result, errorData, errorMessage, error_1;
        var command = _b.command;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _d.sent();
                    return [2 /*return*/];
                case 2:
                    isThread = [
                        discord_js_1.ChannelType.PublicThread,
                        discord_js_1.ChannelType.PrivateThread,
                        discord_js_1.ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                    if (!!isThread) return [3 /*break*/, 4];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a thread with an active session',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 3:
                    _d.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: channel,
                    })];
                case 5:
                    resolved = _d.sent();
                    if (!!resolved) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory for this channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 6:
                    _d.sent();
                    return [2 /*return*/];
                case 7:
                    projectDirectory = resolved.projectDirectory, workingDirectory = resolved.workingDirectory;
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(channel.id)];
                case 8:
                    sessionId = _d.sent();
                    if (!!sessionId) return [3 /*break*/, 10];
                    return [4 /*yield*/, command.reply({
                            content: 'No active session in this thread',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 9:
                    _d.sent();
                    return [2 /*return*/];
                case 10: return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 11:
                    getClient = _d.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 13];
                    return [4 /*yield*/, command.reply({
                            content: "Failed to compact: ".concat(getClient.message),
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 12:
                    _d.sent();
                    return [2 /*return*/];
                case 13:
                    client = (0, opencode_js_1.getOpencodeClient)(projectDirectory);
                    if (!!client) return [3 /*break*/, 15];
                    return [4 /*yield*/, command.reply({
                            content: 'Failed to get OpenCode client',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 14:
                    _d.sent();
                    return [2 /*return*/];
                case 15: 
                // Defer reply since compaction may take a moment
                return [4 /*yield*/, command.deferReply({ flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS })];
                case 16:
                    // Defer reply since compaction may take a moment
                    _d.sent();
                    _d.label = 17;
                case 17:
                    _d.trys.push([17, 27, , 29]);
                    return [4 /*yield*/, client.session.messages({
                            sessionID: sessionId,
                            directory: workingDirectory,
                        })];
                case 18:
                    messagesResult = _d.sent();
                    if (!(messagesResult.error || !messagesResult.data)) return [3 /*break*/, 20];
                    logger.error('[COMPACT] Failed to get messages:', messagesResult.error);
                    return [4 /*yield*/, command.editReply({
                            content: 'Failed to compact: Could not retrieve session messages',
                        })];
                case 19:
                    _d.sent();
                    return [2 /*return*/];
                case 20:
                    lastUserMessage = __spreadArray([], messagesResult.data, true).reverse()
                        .find(function (msg) { return msg.info.role === 'user'; });
                    if (!(!lastUserMessage || lastUserMessage.info.role !== 'user')) return [3 /*break*/, 22];
                    return [4 /*yield*/, command.editReply({
                            content: 'Failed to compact: No user message found in session',
                        })];
                case 21:
                    _d.sent();
                    return [2 /*return*/];
                case 22:
                    _c = lastUserMessage.info.model, providerID = _c.providerID, modelID = _c.modelID;
                    return [4 /*yield*/, client.session.summarize({
                            sessionID: sessionId,
                            directory: workingDirectory,
                            providerID: providerID,
                            modelID: modelID,
                            auto: false,
                        })];
                case 23:
                    result = _d.sent();
                    if (!result.error) return [3 /*break*/, 25];
                    logger.error('[COMPACT] Error:', result.error);
                    errorData = result.error.data;
                    errorMessage = errorData && typeof errorData === 'object' && 'message' in errorData
                        ? String(errorData.message || 'Unknown error')
                        : 'Unknown error';
                    return [4 /*yield*/, command.editReply({
                            content: "Failed to compact: ".concat(errorMessage),
                        })];
                case 24:
                    _d.sent();
                    return [2 /*return*/];
                case 25: return [4 /*yield*/, command.editReply({
                        content: "\uD83D\uDCE6 Session **compacted** successfully",
                    })];
                case 26:
                    _d.sent();
                    logger.log("Session ".concat(sessionId, " compacted by user"));
                    return [3 /*break*/, 29];
                case 27:
                    error_1 = _d.sent();
                    logger.error('[COMPACT] Error:', error_1);
                    return [4 /*yield*/, command.editReply({
                            content: "Failed to compact: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                        })];
                case 28:
                    _d.sent();
                    return [3 /*break*/, 29];
                case 29: return [2 /*return*/];
            }
        });
    });
}
