"use strict";
// /new-session command - Start a new OpenCode session.
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
exports.handleSessionCommand = handleSessionCommand;
exports.handleSessionAutocomplete = handleSessionAutocomplete;
var discord_js_1 = require("discord.js");
var node_fs_1 = require("node:fs");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var thread_session_runtime_js_1 = require("../session-handler/thread-session-runtime.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.SESSION);
function handleSessionCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var prompt, filesString, agent, channel, channelConfig, projectDirectory, getClient, files, fullPrompt, starterMessage, thread, runtime, error_1;
        var command = _b.command, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, command.deferReply()];
                case 1:
                    _c.sent();
                    prompt = command.options.getString('prompt', true);
                    filesString = command.options.getString('files') || '';
                    agent = command.options.getString('agent') || undefined;
                    channel = command.channel;
                    if (!(!channel || channel.type !== discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 3];
                    return [4 /*yield*/, command.editReply('This command can only be used in text channels')];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
                case 3: return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(channel.id)];
                case 4:
                    channelConfig = _c.sent();
                    projectDirectory = channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.directory;
                    if (!!projectDirectory) return [3 /*break*/, 6];
                    return [4 /*yield*/, command.editReply('This channel is not configured with a project directory')];
                case 5:
                    _c.sent();
                    return [2 /*return*/];
                case 6:
                    if (!!node_fs_1.default.existsSync(projectDirectory)) return [3 /*break*/, 8];
                    return [4 /*yield*/, command.editReply("Directory does not exist: ".concat(projectDirectory))];
                case 7:
                    _c.sent();
                    return [2 /*return*/];
                case 8:
                    _c.trys.push([8, 17, , 19]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 9:
                    getClient = _c.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 11];
                    return [4 /*yield*/, command.editReply(getClient.message)];
                case 10:
                    _c.sent();
                    return [2 /*return*/];
                case 11:
                    files = filesString
                        .split(',')
                        .map(function (f) { return f.trim(); })
                        .filter(function (f) { return f; });
                    fullPrompt = prompt;
                    if (files.length > 0) {
                        fullPrompt = "".concat(prompt, "\n\n@").concat(files.join(' @'));
                    }
                    return [4 /*yield*/, channel.send({
                            content: "\uD83D\uDE80 **Starting OpenCode session**\n\uD83D\uDCDD ".concat(prompt).concat(files.length > 0 ? "\n\uD83D\uDCCE Files: ".concat(files.join(', ')) : ''),
                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 12:
                    starterMessage = _c.sent();
                    return [4 /*yield*/, starterMessage.startThread({
                            name: prompt.slice(0, 100),
                            autoArchiveDuration: 1440,
                            reason: 'OpenCode session',
                        })
                        // Add user to thread so it appears in their sidebar
                    ];
                case 13:
                    thread = _c.sent();
                    // Add user to thread so it appears in their sidebar
                    return [4 /*yield*/, thread.members.add(command.user.id)];
                case 14:
                    // Add user to thread so it appears in their sidebar
                    _c.sent();
                    return [4 /*yield*/, command.editReply("Created new session in ".concat(thread.toString()))];
                case 15:
                    _c.sent();
                    runtime = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                        threadId: thread.id,
                        thread: thread,
                        projectDirectory: projectDirectory,
                        sdkDirectory: projectDirectory,
                        channelId: channel.id,
                        appId: appId,
                    });
                    return [4 /*yield*/, runtime.enqueueIncoming({
                            prompt: fullPrompt,
                            userId: command.user.id,
                            username: command.user.displayName,
                            agent: agent,
                            appId: appId,
                            mode: 'opencode',
                        })];
                case 16:
                    _c.sent();
                    return [3 /*break*/, 19];
                case 17:
                    error_1 = _c.sent();
                    logger.error('[SESSION] Error:', error_1);
                    return [4 /*yield*/, command.editReply("Failed to create session: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'))];
                case 18:
                    _c.sent();
                    return [3 /*break*/, 19];
                case 19: return [2 /*return*/];
            }
        });
    });
}
function handleAgentAutocomplete(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var focusedValue, projectDirectory, getClient, agentsResponse, agents, choices, error_2;
        var interaction = _b.interaction;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    focusedValue = interaction.options.getFocused();
                    return [4 /*yield*/, (0, discord_utils_js_1.resolveProjectDirectoryFromAutocomplete)(interaction)];
                case 1:
                    projectDirectory = _c.sent();
                    if (!!projectDirectory) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.respond([])];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
                case 3:
                    _c.trys.push([3, 11, , 13]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 4:
                    getClient = _c.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 6];
                    return [4 /*yield*/, interaction.respond([])];
                case 5:
                    _c.sent();
                    return [2 /*return*/];
                case 6: return [4 /*yield*/, getClient().app.agents({
                        directory: projectDirectory,
                    })];
                case 7:
                    agentsResponse = _c.sent();
                    if (!(!agentsResponse.data || agentsResponse.data.length === 0)) return [3 /*break*/, 9];
                    return [4 /*yield*/, interaction.respond([])];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
                case 9:
                    agents = agentsResponse.data
                        .filter(function (a) {
                        var hidden = a.hidden;
                        return (a.mode === 'primary' || a.mode === 'all') && !hidden;
                    })
                        .filter(function (a) { return a.name.toLowerCase().includes(focusedValue.toLowerCase()); })
                        .slice(0, 25);
                    choices = agents.map(function (agent) { return ({
                        name: agent.name.slice(0, 100),
                        value: agent.name,
                    }); });
                    return [4 /*yield*/, interaction.respond(choices)];
                case 10:
                    _c.sent();
                    return [3 /*break*/, 13];
                case 11:
                    error_2 = _c.sent();
                    logger.error('[AUTOCOMPLETE] Error fetching agents:', error_2);
                    return [4 /*yield*/, interaction.respond([])];
                case 12:
                    _c.sent();
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
function handleSessionAutocomplete(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var focusedOption, focusedValue, parts, previousFiles, currentQuery, projectDirectory, getClient, response, files, prefix_1, choices, error_3;
        var interaction = _b.interaction;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    focusedOption = interaction.options.getFocused(true);
                    if (!(focusedOption.name === 'agent')) return [3 /*break*/, 2];
                    return [4 /*yield*/, handleAgentAutocomplete({ interaction: interaction })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    if (focusedOption.name !== 'files') {
                        return [2 /*return*/];
                    }
                    focusedValue = focusedOption.value;
                    parts = focusedValue.split(',');
                    previousFiles = parts
                        .slice(0, -1)
                        .map(function (f) { return f.trim(); })
                        .filter(function (f) { return f; });
                    currentQuery = (parts[parts.length - 1] || '').trim();
                    return [4 /*yield*/, (0, discord_utils_js_1.resolveProjectDirectoryFromAutocomplete)(interaction)];
                case 3:
                    projectDirectory = _c.sent();
                    if (!!projectDirectory) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.respond([])];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
                case 5:
                    _c.trys.push([5, 11, , 13]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 6:
                    getClient = _c.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 8];
                    return [4 /*yield*/, interaction.respond([])];
                case 7:
                    _c.sent();
                    return [2 /*return*/];
                case 8: return [4 /*yield*/, getClient().find.files({
                        query: currentQuery || '',
                    })];
                case 9:
                    response = _c.sent();
                    files = response.data || [];
                    prefix_1 = previousFiles.length > 0 ? previousFiles.join(', ') + ', ' : '';
                    choices = files
                        .map(function (file) {
                        var fullValue = prefix_1 + file;
                        var allFiles = __spreadArray(__spreadArray([], previousFiles, true), [file], false);
                        var allBasenames = allFiles.map(function (f) { return f.split('/').pop() || f; });
                        var displayName = allBasenames.join(', ');
                        if (displayName.length > 100) {
                            displayName = '…' + displayName.slice(-97);
                        }
                        return {
                            name: displayName,
                            value: fullValue,
                        };
                    })
                        .filter(function (choice) { return choice.value.length <= 100; })
                        .slice(0, 25);
                    return [4 /*yield*/, interaction.respond(choices)];
                case 10:
                    _c.sent();
                    return [3 /*break*/, 13];
                case 11:
                    error_3 = _c.sent();
                    logger.error('[AUTOCOMPLETE] Error fetching files:', error_3);
                    return [4 /*yield*/, interaction.respond([])];
                case 12:
                    _c.sent();
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
