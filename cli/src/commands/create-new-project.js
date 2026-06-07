"use strict";
// /create-new-project command - Create a new project folder, initialize git, and start a session.
// Also exports createNewProject() for reuse during onboarding (welcome channel creation).
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
exports.createNewProject = createNewProject;
exports.handleCreateNewProjectCommand = handleCreateNewProjectCommand;
var discord_js_1 = require("discord.js");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var worktrees_js_1 = require("../worktrees.js");
var config_js_1 = require("../config.js");
var channel_management_js_1 = require("../channel-management.js");
var thread_session_runtime_js_1 = require("../session-handler/thread-session-runtime.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CREATE_PROJECT);
/**
 * Core project creation logic: creates directory, inits git, creates Discord channels.
 * Reused by the slash command handler and by onboarding (welcome channel).
 * Returns null if the project directory already exists.
 */
function createNewProject(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var sanitizedName, projectsDir, projectDirectory, error_1, _c, textChannelId, voiceChannelId, channelName;
        var guild = _b.guild, projectName = _b.projectName, botName = _b.botName;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    sanitizedName = projectName
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '')
                        .slice(0, 100);
                    if (!sanitizedName) {
                        return [2 /*return*/, null];
                    }
                    projectsDir = (0, config_js_1.getProjectsDir)();
                    projectDirectory = node_path_1.default.join(projectsDir, sanitizedName);
                    if (!node_fs_1.default.existsSync(projectsDir)) {
                        node_fs_1.default.mkdirSync(projectsDir, { recursive: true });
                        logger.log("Created projects directory: ".concat(projectsDir));
                    }
                    if (node_fs_1.default.existsSync(projectDirectory)) {
                        return [2 /*return*/, null];
                    }
                    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
                    logger.log("Created project directory: ".concat(projectDirectory));
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)('git init', { cwd: projectDirectory, timeout: 10000 })];
                case 2:
                    _d.sent();
                    logger.log("Initialized git in: ".concat(projectDirectory));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _d.sent();
                    logger.warn("Could not initialize git in ".concat(projectDirectory, ": ").concat(error_1 instanceof Error ? error_1.message : String(error_1)));
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, (0, channel_management_js_1.createProjectChannels)({
                        guild: guild,
                        projectDirectory: projectDirectory,
                        botName: botName,
                    })];
                case 5:
                    _c = _d.sent(), textChannelId = _c.textChannelId, voiceChannelId = _c.voiceChannelId, channelName = _c.channelName;
                    return [2 /*return*/, {
                            textChannelId: textChannelId,
                            voiceChannelId: voiceChannelId,
                            channelName: channelName,
                            projectDirectory: projectDirectory,
                            sanitizedName: sanitizedName,
                        }];
            }
        });
    });
}
function handleCreateNewProjectCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var projectName, guild, channel, result, sanitizedName_1, projectDirectory_1, textChannelId, voiceChannelId, channelName, projectDirectory, sanitizedName, textChannel, voiceInfo, starterMessage, thread, runtime, error_2;
        var _c;
        var command = _b.command, appId = _b.appId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, command.deferReply()];
                case 1:
                    _d.sent();
                    projectName = command.options.getString('name', true);
                    guild = command.guild;
                    channel = command.channel;
                    if (!!guild) return [3 /*break*/, 3];
                    return [4 /*yield*/, command.editReply('This command can only be used in a guild')];
                case 2:
                    _d.sent();
                    return [2 /*return*/];
                case 3:
                    if (!(!channel || channel.type !== discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 5];
                    return [4 /*yield*/, command.editReply('This command can only be used in a text channel')];
                case 4:
                    _d.sent();
                    return [2 /*return*/];
                case 5:
                    _d.trys.push([5, 17, , 19]);
                    return [4 /*yield*/, createNewProject({
                            guild: guild,
                            projectName: projectName,
                            botName: (_c = command.client.user) === null || _c === void 0 ? void 0 : _c.username,
                        })];
                case 6:
                    result = _d.sent();
                    if (!!result) return [3 /*break*/, 10];
                    sanitizedName_1 = projectName
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')
                        .replace(/-+/g, '-')
                        .replace(/^-|-$/g, '')
                        .slice(0, 100);
                    if (!!sanitizedName_1) return [3 /*break*/, 8];
                    return [4 /*yield*/, command.editReply('Invalid project name')];
                case 7:
                    _d.sent();
                    return [2 /*return*/];
                case 8:
                    projectDirectory_1 = node_path_1.default.join((0, config_js_1.getProjectsDir)(), sanitizedName_1);
                    return [4 /*yield*/, command.editReply("Project directory already exists: ".concat(projectDirectory_1))];
                case 9:
                    _d.sent();
                    return [2 /*return*/];
                case 10:
                    textChannelId = result.textChannelId, voiceChannelId = result.voiceChannelId, channelName = result.channelName, projectDirectory = result.projectDirectory, sanitizedName = result.sanitizedName;
                    return [4 /*yield*/, guild.channels.fetch(textChannelId)];
                case 11:
                    textChannel = (_d.sent());
                    voiceInfo = voiceChannelId ? "\n\uD83D\uDD0A Voice: <#".concat(voiceChannelId, ">") : '';
                    return [4 /*yield*/, command.editReply("\u2705 Created new project **".concat(sanitizedName, "**\n\uD83D\uDCC1 Directory: `").concat(projectDirectory, "`\n\uD83D\uDCDD Text: <#").concat(textChannelId, ">").concat(voiceInfo, "\n_Starting session..._"))];
                case 12:
                    _d.sent();
                    return [4 /*yield*/, textChannel.send({
                            content: "\uD83D\uDE80 **New project initialized**\n\uD83D\uDCC1 `".concat(projectDirectory, "`"),
                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 13:
                    starterMessage = _d.sent();
                    return [4 /*yield*/, starterMessage.startThread({
                            name: "Init: ".concat(sanitizedName),
                            autoArchiveDuration: 1440,
                            reason: 'New project session',
                        })
                        // Add user to thread so it appears in their sidebar
                    ];
                case 14:
                    thread = _d.sent();
                    // Add user to thread so it appears in their sidebar
                    return [4 /*yield*/, thread.members.add(command.user.id)];
                case 15:
                    // Add user to thread so it appears in their sidebar
                    _d.sent();
                    runtime = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                        threadId: thread.id,
                        thread: thread,
                        projectDirectory: projectDirectory,
                        sdkDirectory: projectDirectory,
                        channelId: textChannel.id,
                        appId: appId,
                    });
                    return [4 /*yield*/, runtime.enqueueIncoming({
                            prompt: 'The project was just initialized. Say hi and ask what the user wants to build.',
                            userId: command.user.id,
                            username: command.user.displayName,
                            appId: appId,
                            mode: 'opencode',
                        })];
                case 16:
                    _d.sent();
                    logger.log("Created new project ".concat(channelName, " at ").concat(projectDirectory));
                    return [3 /*break*/, 19];
                case 17:
                    error_2 = _d.sent();
                    logger.error('[CREATE-NEW-PROJECT] Error:', error_2);
                    return [4 /*yield*/, command.editReply("Failed to create new project: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'))];
                case 18:
                    _d.sent();
                    return [3 /*break*/, 19];
                case 19: return [2 /*return*/];
            }
        });
    });
}
