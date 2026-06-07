"use strict";
// /toggle-mention-mode command.
// Toggles mention-only mode for a channel.
// When enabled, bot only responds to messages that @mention it.
// Messages in threads are not affected - they always work without mentions.
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
exports.handleToggleMentionModeCommand = handleToggleMentionModeCommand;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var mentionModeLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
/**
 * Handle the /toggle-mention-mode slash command.
 * Toggles whether the bot only responds when @mentioned in this channel.
 */
function handleToggleMentionModeCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, metadata, wasEnabled, nextEnabled, nextLabel;
        var command = _b.command;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    mentionModeLogger.log('[TOGGLE_MENTION_MODE] Command called');
                    channel = command.channel;
                    if (!(!channel || channel.type !== discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in text channels (not threads).',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(channel)];
                case 3:
                    metadata = _c.sent();
                    if (!!metadata.projectDirectory) return [3 /*break*/, 5];
                    return [4 /*yield*/, command.reply({
                            content: 'This channel is not configured with a project directory.\nUse `/add-project` to set up this channel.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
                case 5: return [4 /*yield*/, (0, database_js_1.getChannelMentionMode)(channel.id)];
                case 6:
                    wasEnabled = _c.sent();
                    nextEnabled = !wasEnabled;
                    return [4 /*yield*/, (0, database_js_1.setChannelMentionMode)(channel.id, nextEnabled)];
                case 7:
                    _c.sent();
                    nextLabel = nextEnabled ? 'enabled' : 'disabled';
                    mentionModeLogger.log("[TOGGLE_MENTION_MODE] ".concat(nextLabel.toUpperCase(), " for channel ").concat(channel.id));
                    return [4 /*yield*/, command.reply({
                            content: nextEnabled
                                ? "Mention mode **enabled** for this channel.\nThe bot will only start new sessions when @mentioned.\nMessages in existing threads are not affected."
                                : "Mention mode **disabled** for this channel.\nThe bot will respond to all messages in **#".concat(channel.name, "**."),
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
