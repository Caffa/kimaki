"use strict";
// /remove-project command - Remove Discord channels for a project.
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
exports.handleRemoveProjectCommand = handleRemoveProjectCommand;
exports.handleRemoveProjectAutocomplete = handleRemoveProjectAutocomplete;
var node_path_1 = require("node:path");
var errore = require("errore");
var database_js_1 = require("../database.js");
var logger_js_1 = require("../logger.js");
var utils_js_1 = require("../utils.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.REMOVE_PROJECT);
function handleRemoveProjectCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var directory, guild, channels, deletedChannels, failedChannels, _loop_1, _i, _c, _d, channel_id, channel_type, projectName, message, error_1;
        var command = _b.command, appId = _b.appId;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, command.deferReply()];
                case 1:
                    _e.sent();
                    directory = command.options.getString('project', true);
                    guild = command.guild;
                    if (!!guild) return [3 /*break*/, 3];
                    return [4 /*yield*/, command.editReply('This command can only be used in a guild')];
                case 2:
                    _e.sent();
                    return [2 /*return*/];
                case 3:
                    _e.trys.push([3, 13, , 15]);
                    return [4 /*yield*/, (0, database_js_1.findChannelsByDirectory)({ directory: directory })];
                case 4:
                    channels = _e.sent();
                    if (!(channels.length === 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, command.editReply("No channels found for directory: `".concat(directory, "`"))];
                case 5:
                    _e.sent();
                    return [2 /*return*/];
                case 6:
                    deletedChannels = [];
                    failedChannels = [];
                    _loop_1 = function (channel_id, channel_type) {
                        var channel, error_2;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0: return [4 /*yield*/, errore.tryAsync({
                                        try: function () { return guild.channels.fetch(channel_id); },
                                        catch: function (e) { return e; },
                                    })];
                                case 1:
                                    channel = _f.sent();
                                    if (channel instanceof Error) {
                                        logger.error("Failed to fetch channel ".concat(channel_id, ":"), channel);
                                        failedChannels.push("".concat(channel_type, ": ").concat(channel_id));
                                        return [2 /*return*/, "continue"];
                                    }
                                    if (!channel) return [3 /*break*/, 6];
                                    _f.label = 2;
                                case 2:
                                    _f.trys.push([2, 4, , 5]);
                                    return [4 /*yield*/, channel.delete("Removed by /remove-project command")];
                                case 3:
                                    _f.sent();
                                    deletedChannels.push("".concat(channel_type, ": ").concat(channel_id));
                                    return [3 /*break*/, 5];
                                case 4:
                                    error_2 = _f.sent();
                                    logger.error("Failed to delete channel ".concat(channel_id, ":"), error_2);
                                    failedChannels.push("".concat(channel_type, ": ").concat(channel_id));
                                    return [3 /*break*/, 5];
                                case 5: return [3 /*break*/, 7];
                                case 6:
                                    deletedChannels.push("".concat(channel_type, ": ").concat(channel_id, " (already deleted)"));
                                    _f.label = 7;
                                case 7: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, _c = channels;
                    _e.label = 7;
                case 7:
                    if (!(_i < _c.length)) return [3 /*break*/, 10];
                    _d = _c[_i], channel_id = _d.channel_id, channel_type = _d.channel_type;
                    return [5 /*yield**/, _loop_1(channel_id, channel_type)];
                case 8:
                    _e.sent();
                    _e.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 7];
                case 10: 
                // Remove from database
                return [4 /*yield*/, (0, database_js_1.deleteChannelDirectoriesByDirectory)(directory)];
                case 11:
                    // Remove from database
                    _e.sent();
                    projectName = node_path_1.default.basename(directory);
                    message = "Removed project **".concat(projectName, "**\n");
                    message += "Directory: `".concat(directory, "`\n\n");
                    if (deletedChannels.length > 0) {
                        message += "Deleted channels:\n".concat(deletedChannels.map(function (c) { return "- ".concat(c); }).join('\n'));
                    }
                    if (failedChannels.length > 0) {
                        message += "\n\nFailed to delete (may be in another server):\n".concat(failedChannels.map(function (c) { return "- ".concat(c); }).join('\n'));
                    }
                    return [4 /*yield*/, command.editReply(message)];
                case 12:
                    _e.sent();
                    logger.log("Removed project ".concat(projectName, " at ").concat(directory));
                    return [3 /*break*/, 15];
                case 13:
                    error_1 = _e.sent();
                    logger.error('[REMOVE-PROJECT] Error:', error_1);
                    return [4 /*yield*/, command.editReply("Failed to remove project: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'))];
                case 14:
                    _e.sent();
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
function handleRemoveProjectAutocomplete(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var focusedValue, guild, allChannels, projectsInGuild, _loop_2, _i, allChannels_1, _c, directory, channel_id, projects, error_3;
        var interaction = _b.interaction, appId = _b.appId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    focusedValue = interaction.options.getFocused();
                    guild = interaction.guild;
                    if (!!guild) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.respond([])];
                case 1:
                    _d.sent();
                    return [2 /*return*/];
                case 2:
                    _d.trys.push([2, 9, , 11]);
                    return [4 /*yield*/, (0, database_js_1.findChannelsByDirectory)({
                            channelType: 'text',
                        })];
                case 3:
                    allChannels = (_d.sent());
                    projectsInGuild = [];
                    _loop_2 = function (directory, channel_id) {
                        var channel;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0: return [4 /*yield*/, errore.tryAsync({
                                        try: function () { return guild.channels.fetch(channel_id); },
                                        catch: function (e) { return e; },
                                    })];
                                case 1:
                                    channel = _e.sent();
                                    if (channel instanceof Error) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    if (channel) {
                                        projectsInGuild.push({ directory: directory, channelId: channel_id });
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, allChannels_1 = allChannels;
                    _d.label = 4;
                case 4:
                    if (!(_i < allChannels_1.length)) return [3 /*break*/, 7];
                    _c = allChannels_1[_i], directory = _c.directory, channel_id = _c.channel_id;
                    return [5 /*yield**/, _loop_2(directory, channel_id)];
                case 5:
                    _d.sent();
                    _d.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7:
                    projects = projectsInGuild
                        .filter(function (_a) {
                        var directory = _a.directory;
                        var baseName = node_path_1.default.basename(directory);
                        var searchText = "".concat(baseName, " ").concat(directory).toLowerCase();
                        return searchText.includes(focusedValue.toLowerCase());
                    })
                        .slice(0, 25)
                        .map(function (_a) {
                        var directory = _a.directory;
                        var name = "".concat(node_path_1.default.basename(directory), " (").concat((0, utils_js_1.abbreviatePath)(directory), ")");
                        return {
                            name: name.length > 100 ? name.slice(0, 99) + '...' : name,
                            value: directory,
                        };
                    });
                    return [4 /*yield*/, interaction.respond(projects)];
                case 8:
                    _d.sent();
                    return [3 /*break*/, 11];
                case 9:
                    error_3 = _d.sent();
                    logger.error('[AUTOCOMPLETE] Error fetching projects:', error_3);
                    return [4 /*yield*/, interaction.respond([])];
                case 10:
                    _d.sent();
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
