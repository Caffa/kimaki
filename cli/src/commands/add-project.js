"use strict";
// /add-project command - Create Discord channels for an existing OpenCode project.
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
exports.handleAddProjectCommand = handleAddProjectCommand;
exports.handleAddProjectAutocomplete = handleAddProjectAutocomplete;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var channel_management_js_1 = require("../channel-management.js");
var logger_js_1 = require("../logger.js");
var utils_js_1 = require("../utils.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.ADD_PROJECT);
function handleAddProjectCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var projectId, guild, currentDir, getClient, projectsResponse, project, directory, existingChannels, _c, textChannelId, voiceChannelId, channelName, voiceInfo, error_1;
        var _d;
        var command = _b.command;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, command.deferReply()];
                case 1:
                    _e.sent();
                    projectId = command.options.getString('project', true);
                    guild = command.guild;
                    if (!!guild) return [3 /*break*/, 3];
                    return [4 /*yield*/, command.editReply('This command can only be used in a guild')];
                case 2:
                    _e.sent();
                    return [2 /*return*/];
                case 3:
                    _e.trys.push([3, 19, , 21]);
                    currentDir = process.cwd();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(currentDir)];
                case 4:
                    getClient = _e.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 6];
                    return [4 /*yield*/, command.editReply(getClient.message)];
                case 5:
                    _e.sent();
                    return [2 /*return*/];
                case 6: return [4 /*yield*/, getClient().project.list({})];
                case 7:
                    projectsResponse = _e.sent();
                    if (!!projectsResponse.data) return [3 /*break*/, 9];
                    return [4 /*yield*/, command.editReply('Failed to fetch projects')];
                case 8:
                    _e.sent();
                    return [2 /*return*/];
                case 9:
                    project = projectsResponse.data.find(function (p) { return p.id === projectId; });
                    if (!!project) return [3 /*break*/, 11];
                    return [4 /*yield*/, command.editReply('Project not found')];
                case 10:
                    _e.sent();
                    return [2 /*return*/];
                case 11:
                    directory = project.worktree;
                    if (!!node_fs_1.default.existsSync(directory)) return [3 /*break*/, 13];
                    return [4 /*yield*/, command.editReply("Directory does not exist: ".concat(directory))];
                case 12:
                    _e.sent();
                    return [2 /*return*/];
                case 13: return [4 /*yield*/, (0, database_js_1.findChannelsByDirectory)({
                        directory: directory,
                        channelType: 'text',
                    })];
                case 14:
                    existingChannels = _e.sent();
                    if (!(existingChannels.length > 0)) return [3 /*break*/, 16];
                    return [4 /*yield*/, command.editReply("A channel already exists for this directory: <#".concat(existingChannels[0].channel_id, ">"))];
                case 15:
                    _e.sent();
                    return [2 /*return*/];
                case 16: return [4 /*yield*/, (0, channel_management_js_1.createProjectChannels)({
                        guild: guild,
                        projectDirectory: directory,
                        botName: (_d = command.client.user) === null || _d === void 0 ? void 0 : _d.username,
                    })];
                case 17:
                    _c = _e.sent(), textChannelId = _c.textChannelId, voiceChannelId = _c.voiceChannelId, channelName = _c.channelName;
                    voiceInfo = voiceChannelId ? "\n\uD83D\uDD0A Voice: <#".concat(voiceChannelId, ">") : '';
                    return [4 /*yield*/, command.editReply("\u2705 Created channels for project:\n\uD83D\uDCDD Text: <#".concat(textChannelId, ">").concat(voiceInfo, "\n\uD83D\uDCC1 Directory: `").concat(directory, "`"))];
                case 18:
                    _e.sent();
                    logger.log("Created channels for project ".concat(channelName, " at ").concat(directory));
                    return [3 /*break*/, 21];
                case 19:
                    error_1 = _e.sent();
                    logger.error('[ADD-PROJECT] Error:', error_1);
                    return [4 /*yield*/, command.editReply("Failed to create channels: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'))];
                case 20:
                    _e.sent();
                    return [3 /*break*/, 21];
                case 21: return [2 /*return*/];
            }
        });
    });
}
function handleAddProjectAutocomplete(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var focusedValue, currentDir, getClient, projectsResponse, existingDirs, existingDirSet_1, availableProjects, projects, error_2;
        var interaction = _b.interaction;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    focusedValue = interaction.options.getFocused();
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 10, , 12]);
                    currentDir = process.cwd();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(currentDir)];
                case 2:
                    getClient = _c.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 4];
                    return [4 /*yield*/, interaction.respond([])];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, getClient().project.list({})];
                case 5:
                    projectsResponse = _c.sent();
                    if (!!projectsResponse.data) return [3 /*break*/, 7];
                    return [4 /*yield*/, interaction.respond([])];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7: return [4 /*yield*/, (0, database_js_1.getAllTextChannelDirectories)()];
                case 8:
                    existingDirs = _c.sent();
                    existingDirSet_1 = new Set(existingDirs);
                    availableProjects = projectsResponse.data.filter(function (project) {
                        if (existingDirSet_1.has(project.worktree)) {
                            return false;
                        }
                        if (node_path_1.default.basename(project.worktree).startsWith('opencode-test-')) {
                            return false;
                        }
                        return true;
                    });
                    projects = availableProjects
                        .filter(function (project) {
                        var baseName = node_path_1.default.basename(project.worktree);
                        var searchText = "".concat(baseName, " ").concat(project.worktree).toLowerCase();
                        return searchText.includes(focusedValue.toLowerCase());
                    })
                        .sort(function (a, b) {
                        var aTime = a.time.initialized || a.time.created;
                        var bTime = b.time.initialized || b.time.created;
                        return bTime - aTime;
                    })
                        .slice(0, 25)
                        .map(function (project) {
                        var name = "".concat(node_path_1.default.basename(project.worktree), " (").concat((0, utils_js_1.abbreviatePath)(project.worktree), ")");
                        return {
                            name: name.length > 100 ? name.slice(0, 99) + '…' : name,
                            value: project.id,
                        };
                    });
                    return [4 /*yield*/, interaction.respond(projects)];
                case 9:
                    _c.sent();
                    return [3 /*break*/, 12];
                case 10:
                    error_2 = _c.sent();
                    logger.error('[AUTOCOMPLETE] Error fetching projects:', error_2);
                    return [4 /*yield*/, interaction.respond([])];
                case 11:
                    _c.sent();
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    });
}
