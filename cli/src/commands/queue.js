"use strict";
// Queue commands - /queue, /queue-command, /clear-queue
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
exports.handleQueueCommand = handleQueueCommand;
exports.handleClearQueueCommand = handleClearQueueCommand;
exports.handleQueueCommandCommand = handleQueueCommandCommand;
exports.handleQueueCommandAutocomplete = handleQueueCommandAutocomplete;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var discord_utils_js_1 = require("../discord-utils.js");
var thread_session_runtime_js_1 = require("../session-handler/thread-session-runtime.js");
var logger_js_1 = require("../logger.js");
var store_js_1 = require("../store.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.QUEUE);
function handleQueueCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var message, channel, isThread, thread, sessionId, resolved, runtime, enqueueResult, responseText;
        var command = _b.command, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    message = command.options.getString('message', true);
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _c.sent();
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
                    _c.sent();
                    return [2 /*return*/];
                case 4:
                    thread = channel;
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(thread.id)];
                case 5:
                    sessionId = _c.sent();
                    if (!!sessionId) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'No active session in this thread. Send a message directly instead.',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({ channel: thread })];
                case 8:
                    resolved = _c.sent();
                    if (!!resolved) return [3 /*break*/, 10];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 9:
                    _c.sent();
                    return [2 /*return*/];
                case 10:
                    runtime = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                        threadId: thread.id,
                        thread: thread,
                        projectDirectory: resolved.projectDirectory,
                        sdkDirectory: resolved.workingDirectory,
                        channelId: thread.parentId || thread.id,
                        appId: appId,
                    });
                    return [4 /*yield*/, runtime.enqueueIncoming({
                            prompt: message,
                            userId: command.user.id,
                            username: command.user.displayName,
                            appId: appId,
                            mode: 'local-queue',
                        })];
                case 11:
                    enqueueResult = _c.sent();
                    responseText = enqueueResult.queued
                        ? "Queued message".concat(enqueueResult.position ? " (position ".concat(enqueueResult.position, ")") : '')
                        : "\u00BB **".concat(command.user.displayName, ":** ").concat(message.slice(0, 1000)).concat(message.length > 1000 ? '...' : '');
                    return [4 /*yield*/, command.reply({
                            content: responseText,
                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 12:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleClearQueueCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, position, isThread, runtime, queueLength, removed;
        var _c, _d;
        var command = _b.command;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    channel = command.channel;
                    position = (_c = command.options.getInteger('position')) !== null && _c !== void 0 ? _c : undefined;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _e.sent();
                    return [2 /*return*/];
                case 2:
                    isThread = [
                        discord_js_1.ChannelType.PublicThread,
                        discord_js_1.ChannelType.PrivateThread,
                        discord_js_1.ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                    if (!!isThread) return [3 /*break*/, 4];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a thread',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 3:
                    _e.sent();
                    return [2 /*return*/];
                case 4:
                    runtime = (0, thread_session_runtime_js_1.getRuntime)(channel.id);
                    queueLength = (_d = runtime === null || runtime === void 0 ? void 0 : runtime.getQueueLength()) !== null && _d !== void 0 ? _d : 0;
                    if (!(queueLength === 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, command.reply({
                            content: 'No messages in queue',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 5:
                    _e.sent();
                    return [2 /*return*/];
                case 6:
                    if (!(position !== undefined)) return [3 /*break*/, 10];
                    removed = runtime === null || runtime === void 0 ? void 0 : runtime.removeQueuePosition(position);
                    if (!!removed) return [3 /*break*/, 8];
                    return [4 /*yield*/, command.reply({
                            content: "No queued message at position ".concat(position),
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 7:
                    _e.sent();
                    return [2 /*return*/];
                case 8: return [4 /*yield*/, command.reply({
                        content: "Cleared queued message at position ".concat(position),
                        flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                    })];
                case 9:
                    _e.sent();
                    logger.log("[QUEUE] User ".concat(command.user.displayName, " cleared queued position ").concat(position, " in thread ").concat(channel.id));
                    return [2 /*return*/];
                case 10:
                    runtime === null || runtime === void 0 ? void 0 : runtime.clearQueue();
                    return [4 /*yield*/, command.reply({
                            content: "Cleared ".concat(queueLength, " queued message").concat(queueLength > 1 ? 's' : ''),
                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 11:
                    _e.sent();
                    logger.log("[QUEUE] User ".concat(command.user.displayName, " cleared queue in thread ").concat(channel.id));
                    return [2 /*return*/];
            }
        });
    });
}
function handleQueueCommandCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var commandName, args, channel, isThread, sessionId, isKnownCommand, commandPayload, displayText, thread, resolved, runtime, enqueueResult, responseText;
        var command = _b.command, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    commandName = command.options.getString('command', true);
                    args = command.options.getString('arguments') || '';
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _c.sent();
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
                    _c.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, database_js_1.getThreadSession)(channel.id)];
                case 5:
                    sessionId = _c.sent();
                    if (!!sessionId) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'No active session in this thread. Send a message directly instead.',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7:
                    isKnownCommand = store_js_1.store.getState().registeredUserCommands.some(function (cmd) {
                        return cmd.name === commandName;
                    });
                    if (!!isKnownCommand) return [3 /*break*/, 9];
                    return [4 /*yield*/, command.reply({
                            content: "Unknown command: /".concat(commandName, ". Use autocomplete to pick from available commands."),
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
                case 9:
                    commandPayload = { name: commandName, arguments: args };
                    displayText = "/".concat(commandName);
                    thread = channel;
                    return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({ channel: thread })];
                case 10:
                    resolved = _c.sent();
                    if (!!resolved) return [3 /*break*/, 12];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 11:
                    _c.sent();
                    return [2 /*return*/];
                case 12:
                    runtime = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                        threadId: thread.id,
                        thread: thread,
                        projectDirectory: resolved.projectDirectory,
                        sdkDirectory: resolved.workingDirectory,
                        channelId: thread.parentId || thread.id,
                        appId: appId,
                    });
                    return [4 /*yield*/, runtime.enqueueIncoming({
                            prompt: '',
                            userId: command.user.id,
                            username: command.user.displayName,
                            appId: appId,
                            command: commandPayload,
                            mode: 'local-queue',
                        })];
                case 13:
                    enqueueResult = _c.sent();
                    responseText = enqueueResult.queued
                        ? "Queued message".concat(enqueueResult.position ? " (position ".concat(enqueueResult.position, ")") : '')
                        : "\u00BB **".concat(command.user.displayName, ":** ").concat(displayText);
                    return [4 /*yield*/, command.reply({
                            content: responseText,
                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 14:
                    _c.sent();
                    logger.log("[QUEUE] User ".concat(command.user.displayName, " queued command /").concat(commandName, " in thread ").concat(channel.id));
                    return [2 /*return*/];
            }
        });
    });
}
function handleQueueCommandAutocomplete(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var focused, query, choices;
        var interaction = _b.interaction;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    focused = interaction.options.getFocused(true);
                    if (!(focused.name !== 'command')) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.respond([])];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    query = focused.value.toLowerCase();
                    choices = store_js_1.store.getState().registeredUserCommands
                        .filter(function (cmd) {
                        return cmd.name.toLowerCase().includes(query);
                    })
                        .slice(0, 25)
                        .map(function (cmd) { return ({
                        name: "/".concat(cmd.name, " [").concat(cmd.source === 'skill' ? 'skill' : cmd.source === 'mcp' ? 'mcp' : 'cmd', "] - ").concat(cmd.description).slice(0, 100),
                        value: cmd.name.slice(0, 100),
                    }); });
                    return [4 /*yield*/, interaction.respond(choices)];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
