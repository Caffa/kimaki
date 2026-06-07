"use strict";
// /btw command - Fork the current session with full context and send a new prompt.
// Unlike /fork, this does not replay past messages in Discord. It just creates
// a new thread, forks the entire session (no messageID), and immediately
// dispatches the user's prompt so the forked session starts working right away.
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
exports.forkSessionToBtwThread = forkSessionToBtwThread;
exports.handleBtwCommand = handleBtwCommand;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var discord_utils_js_1 = require("../discord-utils.js");
var thread_session_runtime_js_1 = require("../session-handler/thread-session-runtime.js");
var logger_js_1 = require("../logger.js");
var opencode_js_1 = require("../opencode.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.FORK);
function forkSessionToBtwThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var sessionId, getClient, forkResponse, textChannel, forkedSession, thread, sourceThreadLink, wrappedPrompt, runtime;
        var sourceThread = _b.sourceThread, projectDirectory = _b.projectDirectory, prompt = _b.prompt, userId = _b.userId, username = _b.username, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.getThreadSession)(sourceThread.id)];
                case 1:
                    sessionId = _c.sent();
                    if (!sessionId) {
                        return [2 /*return*/, new Error('No active session in this thread')];
                    }
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 2:
                    getClient = _c.sent();
                    if (getClient instanceof Error) {
                        return [2 /*return*/, new Error("Failed to fork session: ".concat(getClient.message), {
                                cause: getClient,
                            })];
                    }
                    return [4 /*yield*/, getClient().session.fork({
                            sessionID: sessionId,
                        })];
                case 3:
                    forkResponse = _c.sent();
                    if (!forkResponse.data) {
                        return [2 /*return*/, new Error('Failed to fork session')];
                    }
                    return [4 /*yield*/, (0, discord_utils_js_1.resolveTextChannel)(sourceThread)];
                case 4:
                    textChannel = _c.sent();
                    if (!textChannel) {
                        return [2 /*return*/, new Error('Could not resolve parent text channel')];
                    }
                    forkedSession = forkResponse.data;
                    return [4 /*yield*/, textChannel.threads.create({
                            name: "btw: ".concat(prompt).slice(0, 100),
                            autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneDay,
                            reason: "btw fork from session ".concat(sessionId),
                        })];
                case 5:
                    thread = _c.sent();
                    return [4 /*yield*/, (0, database_js_1.setThreadSession)(thread.id, forkedSession.id)];
                case 6:
                    _c.sent();
                    return [4 /*yield*/, thread.members.add(userId)];
                case 7:
                    _c.sent();
                    logger.log("Created btw fork session ".concat(forkedSession.id, " in thread ").concat(thread.id, " from ").concat(sessionId));
                    sourceThreadLink = "<#".concat(sourceThread.id, ">");
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread, "Reusing context from ".concat(sourceThreadLink, " to answer prompt...\n").concat(prompt))];
                case 8:
                    _c.sent();
                    wrappedPrompt = [
                        "The user asked a side question while you were working on another task.",
                        "This is a forked session whose ONLY goal is to answer this question.",
                        "Do NOT continue, resume, or reference the previous task. Only answer the question below.\n",
                        prompt,
                    ].join('\n');
                    runtime = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                        threadId: thread.id,
                        thread: thread,
                        projectDirectory: projectDirectory,
                        sdkDirectory: projectDirectory,
                        channelId: sourceThread.parentId || sourceThread.id,
                        appId: appId,
                    });
                    return [4 /*yield*/, runtime.enqueueIncoming({
                            prompt: wrappedPrompt,
                            userId: userId,
                            username: username,
                            appId: appId,
                            mode: 'opencode',
                        })];
                case 9:
                    _c.sent();
                    return [2 /*return*/, {
                            thread: thread,
                            forkedSessionId: forkedSession.id,
                        }];
            }
        });
    });
}
function handleBtwCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, threadChannel, prompt, resolved, projectDirectory, result, error_1;
        var command = _b.command, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    if (!(channel.type !== discord_js_1.ChannelType.PublicThread
                        && channel.type !== discord_js_1.ChannelType.PrivateThread
                        && channel.type !== discord_js_1.ChannelType.AnnouncementThread)) return [3 /*break*/, 4];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a thread with an active session',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4:
                    threadChannel = channel;
                    prompt = command.options.getString('prompt', true);
                    return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                            channel: threadChannel,
                        })];
                case 5:
                    resolved = _c.sent();
                    if (!!resolved) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory for this channel',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7:
                    projectDirectory = resolved.projectDirectory;
                    return [4 /*yield*/, command.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 8:
                    _c.sent();
                    _c.label = 9;
                case 9:
                    _c.trys.push([9, 14, , 16]);
                    return [4 /*yield*/, forkSessionToBtwThread({
                            sourceThread: threadChannel,
                            projectDirectory: projectDirectory,
                            prompt: prompt,
                            userId: command.user.id,
                            username: command.user.displayName,
                            appId: appId,
                        })];
                case 10:
                    result = _c.sent();
                    if (!(result instanceof Error)) return [3 /*break*/, 12];
                    return [4 /*yield*/, command.editReply(result.message)];
                case 11:
                    _c.sent();
                    return [2 /*return*/];
                case 12: return [4 /*yield*/, command.editReply("Session forked! Continue in ".concat(result.thread.toString()))];
                case 13:
                    _c.sent();
                    return [3 /*break*/, 16];
                case 14:
                    error_1 = _c.sent();
                    logger.error('Error in /btw:', error_1);
                    return [4 /*yield*/, command.editReply("Failed to fork session: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'))];
                case 15:
                    _c.sent();
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
            }
        });
    });
}
