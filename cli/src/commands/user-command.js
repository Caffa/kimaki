"use strict";
// User-defined OpenCode command handler.
// Handles slash commands that map to user-configured commands in opencode.json.
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
exports.handleUserCommand = void 0;
var discord_js_1 = require("discord.js");
var thread_session_runtime_js_1 = require("../session-handler/thread-session-runtime.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var database_js_1 = require("../database.js");
var store_js_1 = require("../store.js");
var node_fs_1 = require("node:fs");
var userCommandLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.USER_CMD);
var DISCORD_MESSAGE_LIMIT = 2000;
var DISCORD_THREAD_NAME_LIMIT = 100;
var handleUserCommand = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var discordCommandName, registered, fallbackBase, commandName, args, commandInvocation, threadOpeningMessage, channel, isThread, isTextChannel, projectDirectory, textChannel, thread, sessionId, channelConfig, channelConfig, commandPayload, runtime, starterMessage, newThread, runtime, error_1, errorMessage;
    var command = _b.command, appId = _b.appId;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                discordCommandName = command.commandName;
                registered = store_js_1.store.getState().registeredUserCommands.find(function (c) { return c.discordCommandName === discordCommandName; });
                fallbackBase = discordCommandName.replace(/-(cmd|skill|mcp-prompt)$/, '');
                commandName = (registered === null || registered === void 0 ? void 0 : registered.name) || fallbackBase;
                args = command.options.getString('arguments') || '';
                commandInvocation = args ? "/".concat(commandName, " ").concat(args) : "/".concat(commandName);
                threadOpeningMessage = commandInvocation.length <= DISCORD_MESSAGE_LIMIT
                    ? commandInvocation
                    : "".concat(commandInvocation.slice(0, DISCORD_MESSAGE_LIMIT - 14), "... truncated");
                userCommandLogger.log("Executing /".concat(commandName, " (from /").concat(discordCommandName, ") argsLength=").concat(args.length));
                channel = command.channel;
                userCommandLogger.log("Channel info: type=".concat(channel === null || channel === void 0 ? void 0 : channel.type, ", id=").concat(channel === null || channel === void 0 ? void 0 : channel.id, ", isNull=").concat(channel === null));
                isThread = channel &&
                    [
                        discord_js_1.ChannelType.PublicThread,
                        discord_js_1.ChannelType.PrivateThread,
                        discord_js_1.ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                isTextChannel = (channel === null || channel === void 0 ? void 0 : channel.type) === discord_js_1.ChannelType.GuildText;
                if (!(!channel || (!isTextChannel && !isThread))) return [3 /*break*/, 2];
                return [4 /*yield*/, command.reply({
                        content: 'This command can only be used in text channels or threads',
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    })];
            case 1:
                _c.sent();
                return [2 /*return*/];
            case 2:
                textChannel = null;
                thread = null;
                if (!isThread) return [3 /*break*/, 8];
                // Running in an existing thread - get project directory from parent channel
                thread = channel;
                textChannel = thread.parent;
                return [4 /*yield*/, (0, database_js_1.getThreadSession)(thread.id)];
            case 3:
                sessionId = _c.sent();
                if (!!sessionId) return [3 /*break*/, 5];
                return [4 /*yield*/, command.reply({
                        content: 'This thread does not have an active session. Use this command in a project channel to create a new thread.',
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    })];
            case 4:
                _c.sent();
                return [2 /*return*/];
            case 5:
                if (!textChannel) return [3 /*break*/, 7];
                return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(textChannel.id)];
            case 6:
                channelConfig = _c.sent();
                projectDirectory = channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.directory;
                _c.label = 7;
            case 7: return [3 /*break*/, 10];
            case 8:
                // Running in a text channel - will create a new thread
                textChannel = channel;
                return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(textChannel.id)];
            case 9:
                channelConfig = _c.sent();
                projectDirectory = channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.directory;
                _c.label = 10;
            case 10:
                if (!!projectDirectory) return [3 /*break*/, 12];
                return [4 /*yield*/, command.reply({
                        content: 'This channel is not configured with a project directory',
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    })];
            case 11:
                _c.sent();
                return [2 /*return*/];
            case 12:
                if (!!node_fs_1.default.existsSync(projectDirectory)) return [3 /*break*/, 14];
                return [4 /*yield*/, command.reply({
                        content: "Directory does not exist: ".concat(projectDirectory),
                        flags: discord_js_1.MessageFlags.Ephemeral,
                    })];
            case 13:
                _c.sent();
                return [2 /*return*/];
            case 14: return [4 /*yield*/, command.deferReply()];
            case 15:
                _c.sent();
                _c.label = 16;
            case 16:
                _c.trys.push([16, 26, , 31]);
                commandPayload = { name: commandName, arguments: args };
                if (!(isThread && thread)) return [3 /*break*/, 19];
                // Running in existing thread - just send the command
                return [4 /*yield*/, command.editReply("Running ".concat(commandInvocation, "..."))];
            case 17:
                // Running in existing thread - just send the command
                _c.sent();
                runtime = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                    threadId: thread.id,
                    thread: thread,
                    projectDirectory: projectDirectory,
                    sdkDirectory: projectDirectory,
                    channelId: textChannel === null || textChannel === void 0 ? void 0 : textChannel.id,
                    appId: appId,
                });
                return [4 /*yield*/, runtime.enqueueIncoming({
                        prompt: '',
                        userId: command.user.id,
                        username: command.user.displayName,
                        command: commandPayload,
                        appId: appId,
                        mode: 'local-queue',
                    })];
            case 18:
                _c.sent();
                return [3 /*break*/, 25];
            case 19:
                if (!textChannel) return [3 /*break*/, 25];
                return [4 /*yield*/, textChannel.send({
                        content: threadOpeningMessage,
                        flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                    })];
            case 20:
                starterMessage = _c.sent();
                return [4 /*yield*/, starterMessage.startThread({
                        name: commandInvocation.slice(0, DISCORD_THREAD_NAME_LIMIT),
                        autoArchiveDuration: 1440,
                        reason: "OpenCode command: ".concat(commandName),
                    })
                    // Add user to thread so it appears in their sidebar
                ];
            case 21:
                newThread = _c.sent();
                // Add user to thread so it appears in their sidebar
                return [4 /*yield*/, newThread.members.add(command.user.id)];
            case 22:
                // Add user to thread so it appears in their sidebar
                _c.sent();
                return [4 /*yield*/, command.editReply("Started /".concat(commandName, " in ").concat(newThread.toString()))];
            case 23:
                _c.sent();
                runtime = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                    threadId: newThread.id,
                    thread: newThread,
                    projectDirectory: projectDirectory,
                    sdkDirectory: projectDirectory,
                    channelId: textChannel.id,
                    appId: appId,
                });
                return [4 /*yield*/, runtime.enqueueIncoming({
                        prompt: '',
                        userId: command.user.id,
                        username: command.user.displayName,
                        command: commandPayload,
                        appId: appId,
                        mode: 'local-queue',
                    })];
            case 24:
                _c.sent();
                _c.label = 25;
            case 25: return [3 /*break*/, 31];
            case 26:
                error_1 = _c.sent();
                userCommandLogger.error("Error executing /".concat(commandName, ":"), error_1);
                errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
                if (!command.deferred) return [3 /*break*/, 28];
                return [4 /*yield*/, command.editReply({
                        content: "Failed to execute /".concat(commandName, ": ").concat(errorMessage),
                    })];
            case 27:
                _c.sent();
                return [3 /*break*/, 30];
            case 28: return [4 /*yield*/, command.reply({
                    content: "Failed to execute /".concat(commandName, ": ").concat(errorMessage),
                    flags: discord_js_1.MessageFlags.Ephemeral,
                })];
            case 29:
                _c.sent();
                _c.label = 30;
            case 30: return [3 /*break*/, 31];
            case 31: return [2 /*return*/];
        }
    });
}); };
exports.handleUserCommand = handleUserCommand;
