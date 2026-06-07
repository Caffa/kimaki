"use strict";
// Discord channel and category management.
// Creates and manages Kimaki project channels (text + voice pairs),
// extracts channel metadata from topic tags, and ensures category structure.
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
exports.ensureKimakiCategory = ensureKimakiCategory;
exports.ensureKimakiAudioCategory = ensureKimakiAudioCategory;
exports.createProjectChannels = createProjectChannels;
exports.getChannelsWithDescriptions = getChannelsWithDescriptions;
exports.createDefaultKimakiChannel = createDefaultKimakiChannel;
exports.createDefaultKimakiVoiceChannel = createDefaultKimakiVoiceChannel;
exports.linkVoiceChannelToDirectory = linkVoiceChannelToDirectory;
var discord_js_1 = require("discord.js");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var database_js_1 = require("./database.js");
var config_js_1 = require("./config.js");
var worktrees_js_1 = require("./worktrees.js");
var logger_js_1 = require("./logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CHANNEL);
function ensureKimakiCategory(guild, botName) {
    return __awaiter(this, void 0, void 0, function () {
        var isKimakiBot, categoryName, existingCategory;
        return __generator(this, function (_a) {
            isKimakiBot = (botName === null || botName === void 0 ? void 0 : botName.toLowerCase()) === 'kimaki';
            categoryName = botName && !isKimakiBot ? "Kimaki ".concat(botName) : 'Kimaki';
            existingCategory = guild.channels.cache.find(function (channel) {
                if (channel.type !== discord_js_1.ChannelType.GuildCategory) {
                    return false;
                }
                return channel.name.toLowerCase() === categoryName.toLowerCase();
            });
            if (existingCategory) {
                return [2 /*return*/, existingCategory];
            }
            return [2 /*return*/, guild.channels.create({
                    name: categoryName,
                    type: discord_js_1.ChannelType.GuildCategory,
                })];
        });
    });
}
function ensureKimakiAudioCategory(guild, botName) {
    return __awaiter(this, void 0, void 0, function () {
        var isKimakiBot, categoryName, existingCategory;
        return __generator(this, function (_a) {
            isKimakiBot = (botName === null || botName === void 0 ? void 0 : botName.toLowerCase()) === 'kimaki';
            categoryName = botName && !isKimakiBot ? "Kimaki Audio ".concat(botName) : 'Kimaki Audio';
            existingCategory = guild.channels.cache.find(function (channel) {
                if (channel.type !== discord_js_1.ChannelType.GuildCategory) {
                    return false;
                }
                return channel.name.toLowerCase() === categoryName.toLowerCase();
            });
            if (existingCategory) {
                return [2 /*return*/, existingCategory];
            }
            return [2 /*return*/, guild.channels.create({
                    name: categoryName,
                    type: discord_js_1.ChannelType.GuildCategory,
                })];
        });
    });
}
function createProjectChannels(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var baseName, channelName, kimakiCategory, textChannel, voiceChannelId, kimakiAudioCategory, voiceChannel;
        var guild = _b.guild, projectDirectory = _b.projectDirectory, botName = _b.botName, _c = _b.enableVoiceChannels, enableVoiceChannels = _c === void 0 ? false : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    baseName = node_path_1.default.basename(projectDirectory);
                    channelName = "".concat(baseName)
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '-')
                        .slice(0, 100);
                    return [4 /*yield*/, ensureKimakiCategory(guild, botName)];
                case 1:
                    kimakiCategory = _d.sent();
                    return [4 /*yield*/, guild.channels.create({
                            name: channelName,
                            type: discord_js_1.ChannelType.GuildText,
                            parent: kimakiCategory,
                            // Channel configuration is stored in SQLite, not in the topic
                        })];
                case 2:
                    textChannel = _d.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: textChannel.id,
                            directory: projectDirectory,
                            channelType: 'text',
                        })];
                case 3:
                    _d.sent();
                    voiceChannelId = null;
                    if (!enableVoiceChannels) return [3 /*break*/, 7];
                    return [4 /*yield*/, ensureKimakiAudioCategory(guild, botName)];
                case 4:
                    kimakiAudioCategory = _d.sent();
                    return [4 /*yield*/, guild.channels.create({
                            name: channelName,
                            type: discord_js_1.ChannelType.GuildVoice,
                            parent: kimakiAudioCategory,
                        })];
                case 5:
                    voiceChannel = _d.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: voiceChannel.id,
                            directory: projectDirectory,
                            channelType: 'voice',
                        })];
                case 6:
                    _d.sent();
                    voiceChannelId = voiceChannel.id;
                    _d.label = 7;
                case 7: return [2 /*return*/, {
                        textChannelId: textChannel.id,
                        voiceChannelId: voiceChannelId,
                        channelName: channelName,
                    }];
            }
        });
    });
}
function getChannelsWithDescriptions(guild) {
    return __awaiter(this, void 0, void 0, function () {
        var channels, textChannels, _i, _a, channel, description, channelConfig;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    channels = [];
                    textChannels = guild.channels.cache.filter(function (channel) { return channel.type === discord_js_1.ChannelType.GuildText; });
                    _i = 0, _a = textChannels.values();
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    channel = _a[_i];
                    description = channel.topic || null;
                    return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(channel.id)];
                case 2:
                    channelConfig = _b.sent();
                    channels.push({
                        id: channel.id,
                        name: channel.name,
                        description: description,
                        kimakiDirectory: channelConfig === null || channelConfig === void 0 ? void 0 : channelConfig.directory,
                    });
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, channels];
            }
        });
    });
}
var DEFAULT_GITIGNORE = "node_modules/\ndist/\n.env\n.env.*\n!.env.example\n.DS_Store\ntmp/\n*.log\n__pycache__/\n*.pyc\n.venv/\n*.egg-info/\n";
var DEFAULT_CHANNEL_TOPIC = 'General channel for misc tasks with Kimaki. Not connected to a specific OpenCode project or repository.';
/**
 * Create (or find) the default "kimaki" channel for general-purpose tasks.
 * Channel name is "kimaki-{botName}" for self-hosted bots, "kimaki" for gateway.
 * Directory is ~/.kimaki/projects/kimaki, git-initialized with a .gitignore.
 *
 * Idempotency: checks the database for an existing channel mapped to the
 * kimaki projects directory. Also scans guild channels by name+category
 * as a fallback for channels created before DB mapping existed.
 */
function createDefaultKimakiChannel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var projectDirectory, error_1, existingMappings, mappedChannelInGuild, kimakiCategory, existingByName, gitDir, error_2, gitignorePath, channelName, textChannel;
        var guild = _b.guild, botName = _b.botName, appId = _b.appId, isGatewayMode = _b.isGatewayMode;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    projectDirectory = node_path_1.default.join((0, config_js_1.getProjectsDir)(), 'kimaki');
                    // Ensure the default kimaki project directory exists before any DB mapping
                    // restoration or git setup. Custom data dirs may not have <dataDir>/projects
                    // created yet, and later writes assume the full path is present.
                    if (!node_fs_1.default.existsSync(projectDirectory)) {
                        node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
                        logger.log("Created default kimaki directory: ".concat(projectDirectory));
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, guild.channels.fetch()];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    logger.warn("Could not fetch guild channels for ".concat(guild.name, ": ").concat(error_1 instanceof Error ? error_1.stack : String(error_1)));
                    return [3 /*break*/, 4];
                case 4: return [4 /*yield*/, (0, database_js_1.findChannelsByDirectory)({
                        directory: projectDirectory,
                        channelType: 'text',
                    })];
                case 5:
                    existingMappings = _c.sent();
                    mappedChannelInGuild = existingMappings
                        .map(function (row) { return guild.channels.cache.get(row.channel_id); })
                        .find(function (ch) { return (ch === null || ch === void 0 ? void 0 : ch.type) === discord_js_1.ChannelType.GuildText; });
                    if (mappedChannelInGuild) {
                        logger.log("Default kimaki channel already exists: ".concat(mappedChannelInGuild.id));
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, ensureKimakiCategory(guild, botName)];
                case 6:
                    kimakiCategory = _c.sent();
                    existingByName = guild.channels.cache.find(function (ch) {
                        if (ch.type !== discord_js_1.ChannelType.GuildText) {
                            return false;
                        }
                        if (ch.parentId !== kimakiCategory.id) {
                            return false;
                        }
                        return ch.name === 'kimaki' || ch.name.startsWith('kimaki-');
                    });
                    if (!existingByName) return [3 /*break*/, 8];
                    logger.log("Found existing default kimaki channel by name: ".concat(existingByName.id, ", restoring DB mapping"));
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: existingByName.id,
                            directory: projectDirectory,
                            channelType: 'text',
                            skipIfExists: true,
                        })];
                case 7:
                    _c.sent();
                    return [2 /*return*/, null];
                case 8:
                    gitDir = node_path_1.default.join(projectDirectory, '.git');
                    if (!!node_fs_1.default.existsSync(gitDir)) return [3 /*break*/, 12];
                    _c.label = 9;
                case 9:
                    _c.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)('git init', { cwd: projectDirectory, timeout: 10000 })];
                case 10:
                    _c.sent();
                    logger.log("Initialized git in: ".concat(projectDirectory));
                    return [3 /*break*/, 12];
                case 11:
                    error_2 = _c.sent();
                    logger.warn("Could not initialize git in ".concat(projectDirectory, ": ").concat(error_2 instanceof Error ? error_2.stack : String(error_2)));
                    return [3 /*break*/, 12];
                case 12:
                    gitignorePath = node_path_1.default.join(projectDirectory, '.gitignore');
                    if (!node_fs_1.default.existsSync(gitignorePath)) {
                        node_fs_1.default.writeFileSync(gitignorePath, DEFAULT_GITIGNORE);
                    }
                    channelName = (function () {
                        if (isGatewayMode || !botName) {
                            return 'kimaki';
                        }
                        var sanitized = botName
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '-')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '');
                        if (!sanitized || sanitized === 'kimaki') {
                            return 'kimaki';
                        }
                        return "kimaki-".concat(sanitized).slice(0, 100);
                    })();
                    return [4 /*yield*/, guild.channels.create({
                            name: channelName,
                            type: discord_js_1.ChannelType.GuildText,
                            parent: kimakiCategory,
                            topic: DEFAULT_CHANNEL_TOPIC,
                        })];
                case 13:
                    textChannel = _c.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: textChannel.id,
                            directory: projectDirectory,
                            channelType: 'text',
                        })];
                case 14:
                    _c.sent();
                    logger.log("Created default kimaki channel: #".concat(channelName, " (").concat(textChannel.id, ")"));
                    return [2 /*return*/, {
                            textChannel: textChannel,
                            textChannelId: textChannel.id,
                            channelName: channelName,
                            projectDirectory: projectDirectory,
                        }];
            }
        });
    });
}
/** Create a default voice channel under the Kimaki audio category. */
function createDefaultKimakiVoiceChannel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channelName, voiceChannel;
        var guild = _b.guild, kimakiAudioCategory = _b.kimakiAudioCategory, projectDirectory = _b.projectDirectory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!kimakiAudioCategory) {
                        logger.warn('No Kimaki audio category available for voice channel creation');
                        return [2 /*return*/, null];
                    }
                    channelName = (function () {
                        var base = node_path_1.default.basename(projectDirectory);
                        var sanitized = base
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '-')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '');
                        if (!sanitized || sanitized === 'kimaki') {
                            return 'kimaki-voice';
                        }
                        return "".concat(sanitized, "-voice").slice(0, 100);
                    })();
                    return [4 /*yield*/, guild.channels.create({
                            name: channelName,
                            type: discord_js_1.ChannelType.GuildVoice,
                            parent: kimakiAudioCategory,
                        })];
                case 1:
                    voiceChannel = _c.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: voiceChannel.id,
                            directory: projectDirectory,
                            channelType: 'voice',
                        })];
                case 2:
                    _c.sent();
                    logger.log("Created default kimaki voice channel: #".concat(channelName, " (").concat(voiceChannel.id, ")"));
                    return [2 /*return*/, { voiceChannel: voiceChannel, channelId: voiceChannel.id }];
            }
        });
    });
}
/** Link an existing voice channel to a project directory. */
function linkVoiceChannelToDirectory(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channelId = _b.channelId, directory = _b.directory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                        channelId: channelId,
                        directory: directory,
                        channelType: 'voice',
                    })];
                case 1:
                    _c.sent();
                    logger.log("Linked voice channel ".concat(channelId, " to directory ").concat(directory));
                    return [2 /*return*/];
            }
        });
    });
}
