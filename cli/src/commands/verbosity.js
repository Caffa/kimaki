"use strict";
// /verbosity command.
// Shows a dropdown to set output verbosity level for sessions in a channel.
// 'text_and_essential_tools' (default): shows text and essential tools (edits, custom MCP tools)
// 'tools_and_text': shows all output including tool executions
// 'text_only': only shows text responses
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
exports.handleVerbosityCommand = handleVerbosityCommand;
exports.handleVerbositySelectMenu = handleVerbositySelectMenu;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var db_js_1 = require("../db.js");
var store_js_1 = require("../store.js");
var logger_js_1 = require("../logger.js");
var verbosityLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.VERBOSITY);
var VERBOSITY_OPTIONS = [
    {
        value: 'tools_and_text',
        label: 'Tools and text',
        description: 'All output including tool executions and status messages',
    },
    {
        value: 'text_and_essential_tools',
        label: 'Text and essential tools',
        description: 'Text + essential tools (edits, custom MCP). Hides read/search.',
    },
    {
        value: 'text_only',
        label: 'Text only',
        description: 'Only text responses. Hides all tools and status messages.',
    },
];
function resolveChannelId(channel) {
    if (!channel) {
        return null;
    }
    if (channel.type === discord_js_1.ChannelType.GuildText) {
        return channel.id;
    }
    if (channel.type === discord_js_1.ChannelType.PublicThread ||
        channel.type === discord_js_1.ChannelType.PrivateThread ||
        channel.type === discord_js_1.ChannelType.AnnouncementThread) {
        return channel.parentId || channel.id;
    }
    return channel.id;
}
/**
 * Check if there is a per-channel verbosity override in the DB.
 * Returns the override value if it exists, null otherwise.
 */
function getChannelVerbosityOverride(channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var db, row;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.channel_verbosity.findFirst({
                            where: { channel_id: channelId },
                        })];
                case 2:
                    row = _a.sent();
                    if (row === null || row === void 0 ? void 0 : row.verbosity) {
                        return [2 /*return*/, row.verbosity];
                    }
                    return [2 /*return*/, null];
            }
        });
    });
}
/**
 * Handle the /verbosity slash command.
 * Shows a dropdown with the current verbosity level and available options.
 */
function handleVerbosityCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channelId, override, currentLevel, source, options, selectMenu, actionRow;
        var command = _b.command;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channelId = resolveChannelId(command.channel);
                    if (!!channelId) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine channel.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    verbosityLogger.log('[VERBOSITY] Command called');
                    return [4 /*yield*/, getChannelVerbosityOverride(channelId)];
                case 3:
                    override = _c.sent();
                    currentLevel = override || store_js_1.store.getState().defaultVerbosity;
                    source = override ? 'channel override' : 'global default';
                    options = VERBOSITY_OPTIONS.map(function (opt) { return ({
                        label: opt.label,
                        value: opt.value,
                        description: opt.description,
                        default: opt.value === currentLevel,
                    }); });
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("verbosity_select:".concat(channelId))
                        .setPlaceholder('Select verbosity level')
                        .addOptions(options);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, command.reply({
                            content: "**Verbosity**\nCurrent: `".concat(currentLevel, "` (").concat(source, ")"),
                            components: [actionRow],
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle the verbosity select menu interaction.
 * Sets the selected verbosity level for the channel.
 */
function handleVerbositySelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, channelId, level, currentLevel, description;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('verbosity_select:')) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    _b.sent();
                    channelId = customId.replace('verbosity_select:', '');
                    level = interaction.values[0];
                    if (!!level) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No level selected.',
                            components: [],
                        })];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
                case 3: return [4 /*yield*/, (0, database_js_1.getChannelVerbosity)(channelId)];
                case 4:
                    currentLevel = _b.sent();
                    if (!(currentLevel === level)) return [3 /*break*/, 6];
                    return [4 /*yield*/, interaction.editReply({
                            content: "Verbosity is already `".concat(level, "` for this channel."),
                            components: [],
                        })];
                case 5:
                    _b.sent();
                    return [2 /*return*/];
                case 6: return [4 /*yield*/, (0, database_js_1.setChannelVerbosity)(channelId, level)];
                case 7:
                    _b.sent();
                    verbosityLogger.log("[VERBOSITY] Set channel ".concat(channelId, " to ").concat(level));
                    description = ((_a = VERBOSITY_OPTIONS.find(function (o) { return o.value === level; })) === null || _a === void 0 ? void 0 : _a.description) || '';
                    return [4 /*yield*/, interaction.editReply({
                            content: "Verbosity set to `".concat(level, "` for this channel.\n").concat(description, "\nApplies immediately, including active sessions."),
                            components: [],
                        })];
                case 8:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
