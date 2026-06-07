"use strict";
// Undo/Redo commands - /undo, /redo
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
exports.handleUndoCommand = handleUndoCommand;
exports.handleRedoCommand = handleRedoCommand;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.UNDO_REDO);
function waitForSessionIdle(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var deadline, statusResponse, sessionStatus;
        var _c;
        var client = _b.client, sessionId = _b.sessionId, directory = _b.directory, _d = _b.timeoutMs, timeoutMs = _d === void 0 ? 2000 : _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    deadline = Date.now() + timeoutMs;
                    _e.label = 1;
                case 1:
                    if (!(Date.now() < deadline)) return [3 /*break*/, 4];
                    return [4 /*yield*/, client.session.status({ directory: directory })];
                case 2:
                    statusResponse = _e.sent();
                    sessionStatus = (_c = statusResponse.data) === null || _c === void 0 ? void 0 : _c[sessionId];
                    if (!sessionStatus || sessionStatus.type === 'idle') {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 50);
                        })];
                case 3:
                    _e.sent();
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function handleUndoCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, isThread, resolved, projectDirectory, workingDirectory, sessionId, getClient, client, sessionResponse, statusResponse, sessionStatus, messagesResponse, currentRevert_1, userMessages, targetUserMessage_1, targetAssistantMessage, revertMessageId, response, diffInfo, error_1;
        var _c, _d, _e, _f, _g;
        var command = _b.command;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _h.sent();
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
                    _h.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: channel,
                    })];
                case 5:
                    resolved = _h.sent();
                    if (!!resolved) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory for this channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 6:
                    _h.sent();
                    return [2 /*return*/];
                case 7:
                    projectDirectory = resolved.projectDirectory, workingDirectory = resolved.workingDirectory;
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(channel.id)];
                case 8:
                    sessionId = _h.sent();
                    if (!!sessionId) return [3 /*break*/, 10];
                    return [4 /*yield*/, command.reply({
                            content: 'No active session in this thread',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 9:
                    _h.sent();
                    return [2 /*return*/];
                case 10: return [4 /*yield*/, command.deferReply({ flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS })];
                case 11:
                    _h.sent();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 12:
                    getClient = _h.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 14];
                    return [4 /*yield*/, command.editReply("Failed to undo: ".concat(getClient.message))];
                case 13:
                    _h.sent();
                    return [2 /*return*/];
                case 14:
                    _h.trys.push([14, 35, , 37]);
                    client = getClient();
                    return [4 /*yield*/, client.session.get({
                            sessionID: sessionId,
                            directory: workingDirectory,
                        })];
                case 15:
                    sessionResponse = _h.sent();
                    if (!sessionResponse.error) return [3 /*break*/, 17];
                    return [4 /*yield*/, command.editReply("Failed to undo: ".concat(JSON.stringify(sessionResponse.error)))];
                case 16:
                    _h.sent();
                    return [2 /*return*/];
                case 17: return [4 /*yield*/, client.session.status({
                        directory: workingDirectory,
                    })];
                case 18:
                    statusResponse = _h.sent();
                    sessionStatus = (_c = statusResponse.data) === null || _c === void 0 ? void 0 : _c[sessionId];
                    if (!(sessionStatus && sessionStatus.type !== 'idle')) return [3 /*break*/, 21];
                    return [4 /*yield*/, client.session.abort({
                            sessionID: sessionId,
                            directory: workingDirectory,
                        }).catch(function (error) {
                            logger.warn("[UNDO] abort failed for ".concat(sessionId), error);
                        })];
                case 19:
                    _h.sent();
                    return [4 /*yield*/, waitForSessionIdle({
                            client: client,
                            sessionId: sessionId,
                            directory: workingDirectory,
                        })];
                case 20:
                    _h.sent();
                    _h.label = 21;
                case 21: return [4 /*yield*/, client.session.messages({
                        sessionID: sessionId,
                        directory: workingDirectory,
                    })];
                case 22:
                    messagesResponse = _h.sent();
                    if (!messagesResponse.error) return [3 /*break*/, 24];
                    return [4 /*yield*/, command.editReply("Failed to undo: ".concat(JSON.stringify(messagesResponse.error)))];
                case 23:
                    _h.sent();
                    return [2 /*return*/];
                case 24:
                    if (!(!messagesResponse.data || messagesResponse.data.length === 0)) return [3 /*break*/, 26];
                    return [4 /*yield*/, command.editReply('No messages to undo')];
                case 25:
                    _h.sent();
                    return [2 /*return*/];
                case 26:
                    currentRevert_1 = (_e = (_d = sessionResponse.data) === null || _d === void 0 ? void 0 : _d.revert) === null || _e === void 0 ? void 0 : _e.messageID;
                    userMessages = messagesResponse.data.filter(function (m) {
                        return m.info.role === 'user';
                    });
                    targetUserMessage_1 = __spreadArray([], userMessages, true).reverse().find(function (m) {
                        return !currentRevert_1 || m.info.id < currentRevert_1;
                    });
                    if (!!targetUserMessage_1) return [3 /*break*/, 28];
                    return [4 /*yield*/, command.editReply('No messages to undo')];
                case 27:
                    _h.sent();
                    return [2 /*return*/];
                case 28:
                    targetAssistantMessage = __spreadArray([], messagesResponse.data, true).reverse().find(function (m) {
                        return m.info.role === 'assistant' && m.info.parentID === targetUserMessage_1.info.id;
                    });
                    revertMessageId = (targetAssistantMessage === null || targetAssistantMessage === void 0 ? void 0 : targetAssistantMessage.info.id) || targetUserMessage_1.info.id;
                    // session.revert() reverts filesystem patches (file edits, writes) and
                    // marks the session with revert.messageID. Messages are NOT deleted — they
                    // get cleaned up automatically on the next promptAsync() call via
                    // SessionRevert.cleanup(). The model only sees messages before the revert
                    // point when processing the next prompt.
                    logger.log("[UNDO] session.revert start messageId=".concat(revertMessageId));
                    return [4 /*yield*/, client.session.revert({
                            sessionID: sessionId,
                            directory: workingDirectory,
                            messageID: revertMessageId,
                        })];
                case 29:
                    response = _h.sent();
                    logger.log("[UNDO] session.revert done error=".concat(Boolean(response.error)));
                    if (!response.error) return [3 /*break*/, 33];
                    logger.log('[UNDO] retry wait idle before revert retry');
                    return [4 /*yield*/, waitForSessionIdle({
                            client: client,
                            sessionId: sessionId,
                            directory: workingDirectory,
                        })];
                case 30:
                    _h.sent();
                    logger.log('[UNDO] retry revert start');
                    return [4 /*yield*/, client.session.revert({
                            sessionID: sessionId,
                            directory: workingDirectory,
                            messageID: revertMessageId,
                        })];
                case 31:
                    response = _h.sent();
                    logger.log("[UNDO] retry revert done error=".concat(Boolean(response.error)));
                    if (!response.error) return [3 /*break*/, 33];
                    return [4 /*yield*/, command.editReply("Failed to undo: ".concat(JSON.stringify(response.error)))];
                case 32:
                    _h.sent();
                    return [2 /*return*/];
                case 33:
                    diffInfo = ((_g = (_f = response.data) === null || _f === void 0 ? void 0 : _f.revert) === null || _g === void 0 ? void 0 : _g.diff)
                        ? "\n```diff\n".concat(response.data.revert.diff.slice(0, 1500), "\n```")
                        : '';
                    return [4 /*yield*/, command.editReply("Undone - reverted last assistant message".concat(diffInfo))];
                case 34:
                    _h.sent();
                    logger.log("Session ".concat(sessionId, " reverted at message ").concat(revertMessageId));
                    return [3 /*break*/, 37];
                case 35:
                    error_1 = _h.sent();
                    logger.error('[UNDO] Error:', error_1);
                    return [4 /*yield*/, command.editReply("Failed to undo: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'))];
                case 36:
                    _h.sent();
                    return [3 /*break*/, 37];
                case 37: return [2 /*return*/];
            }
        });
    });
}
function handleRedoCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, isThread, resolved, projectDirectory, workingDirectory, sessionId, getClient, client, sessionResponse, revertMessageID_1, redoStatusResponse, redoSessionStatus, messagesResponse, userMessages, nextMessage, response_1, response, error_2;
        var _c, _d, _e, _f;
        var command = _b.command;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _g.sent();
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
                    _g.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: channel,
                    })];
                case 5:
                    resolved = _g.sent();
                    if (!!resolved) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory for this channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 6:
                    _g.sent();
                    return [2 /*return*/];
                case 7:
                    projectDirectory = resolved.projectDirectory, workingDirectory = resolved.workingDirectory;
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(channel.id)];
                case 8:
                    sessionId = _g.sent();
                    if (!!sessionId) return [3 /*break*/, 10];
                    return [4 /*yield*/, command.reply({
                            content: 'No active session in this thread',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 9:
                    _g.sent();
                    return [2 /*return*/];
                case 10: return [4 /*yield*/, command.deferReply({ flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS })];
                case 11:
                    _g.sent();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 12:
                    getClient = _g.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 14];
                    return [4 /*yield*/, command.editReply("Failed to redo: ".concat(getClient.message))];
                case 13:
                    _g.sent();
                    return [2 /*return*/];
                case 14:
                    _g.trys.push([14, 37, , 39]);
                    client = getClient();
                    return [4 /*yield*/, client.session.get({
                            sessionID: sessionId,
                            directory: workingDirectory,
                        })];
                case 15:
                    sessionResponse = _g.sent();
                    if (!sessionResponse.error) return [3 /*break*/, 17];
                    return [4 /*yield*/, command.editReply("Failed to redo: ".concat(JSON.stringify(sessionResponse.error)))];
                case 16:
                    _g.sent();
                    return [2 /*return*/];
                case 17:
                    revertMessageID_1 = (_d = (_c = sessionResponse.data) === null || _c === void 0 ? void 0 : _c.revert) === null || _d === void 0 ? void 0 : _d.messageID;
                    if (!!revertMessageID_1) return [3 /*break*/, 19];
                    return [4 /*yield*/, command.editReply('Nothing to redo - no previous undo found')];
                case 18:
                    _g.sent();
                    return [2 /*return*/];
                case 19: return [4 /*yield*/, client.session.status({
                        directory: workingDirectory,
                    })];
                case 20:
                    redoStatusResponse = _g.sent();
                    redoSessionStatus = (_e = redoStatusResponse.data) === null || _e === void 0 ? void 0 : _e[sessionId];
                    if (!(redoSessionStatus && redoSessionStatus.type !== 'idle')) return [3 /*break*/, 23];
                    return [4 /*yield*/, client.session.abort({
                            sessionID: sessionId,
                            directory: workingDirectory,
                        }).catch(function (error) {
                            logger.warn("[REDO] abort failed for ".concat(sessionId), error);
                        })];
                case 21:
                    _g.sent();
                    return [4 /*yield*/, waitForSessionIdle({
                            client: client,
                            sessionId: sessionId,
                            directory: workingDirectory,
                        })];
                case 22:
                    _g.sent();
                    _g.label = 23;
                case 23: return [4 /*yield*/, new Promise(function (resolve) {
                        setTimeout(resolve, 500);
                    })
                    // Follow the same approach as the OpenCode TUI (use-session-commands.tsx):
                    // find the next user message after the current revert point. If one exists,
                    // move the revert cursor forward to it (one step redo). If none exists,
                    // fully unrevert — we're at the end of the message history.
                ];
                case 24:
                    _g.sent();
                    return [4 /*yield*/, client.session.messages({
                            sessionID: sessionId,
                            directory: workingDirectory,
                        })];
                case 25:
                    messagesResponse = _g.sent();
                    if (!messagesResponse.error) return [3 /*break*/, 27];
                    return [4 /*yield*/, command.editReply("Failed to redo: ".concat(JSON.stringify(messagesResponse.error)))];
                case 26:
                    _g.sent();
                    return [2 /*return*/];
                case 27:
                    userMessages = ((_f = messagesResponse.data) !== null && _f !== void 0 ? _f : []).filter(function (m) {
                        return m.info.role === 'user';
                    });
                    nextMessage = userMessages.find(function (m) {
                        return m.info.id > revertMessageID_1;
                    });
                    if (!!nextMessage) return [3 /*break*/, 32];
                    return [4 /*yield*/, client.session.unrevert({
                            sessionID: sessionId,
                            directory: workingDirectory,
                        })];
                case 28:
                    response_1 = _g.sent();
                    if (!response_1.error) return [3 /*break*/, 30];
                    return [4 /*yield*/, command.editReply("Failed to redo: ".concat(JSON.stringify(response_1.error)))];
                case 29:
                    _g.sent();
                    return [2 /*return*/];
                case 30: return [4 /*yield*/, command.editReply('Restored - session fully back to previous state')];
                case 31:
                    _g.sent();
                    logger.log("Session ".concat(sessionId, " unrevert completed"));
                    return [2 /*return*/];
                case 32: return [4 /*yield*/, client.session.revert({
                        sessionID: sessionId,
                        directory: workingDirectory,
                        messageID: nextMessage.info.id,
                    })];
                case 33:
                    response = _g.sent();
                    if (!response.error) return [3 /*break*/, 35];
                    return [4 /*yield*/, command.editReply("Failed to redo: ".concat(JSON.stringify(response.error)))];
                case 34:
                    _g.sent();
                    return [2 /*return*/];
                case 35: return [4 /*yield*/, command.editReply('Restored one step forward')];
                case 36:
                    _g.sent();
                    logger.log("Session ".concat(sessionId, " redo: moved revert to ").concat(nextMessage.info.id));
                    return [3 /*break*/, 39];
                case 37:
                    error_2 = _g.sent();
                    logger.error('[REDO] Error:', error_2);
                    return [4 /*yield*/, command.editReply("Failed to redo: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'))];
                case 38:
                    _g.sent();
                    return [3 /*break*/, 39];
                case 39: return [2 /*return*/];
            }
        });
    });
}
