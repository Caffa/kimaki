"use strict";
// /share command - Share the current session as a public URL.
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
exports.handleShareCommand = handleShareCommand;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.SHARE);
function handleShareCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, isThread, resolved, projectDirectory, sessionId, getClient, response, error_1;
        var _c, _d;
        var command = _b.command;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    channel = command.channel;
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
                            content: 'This command can only be used in a thread with an active session',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 3:
                    _e.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: channel,
                    })];
                case 5:
                    resolved = _e.sent();
                    if (!!resolved) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory for this channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 6:
                    _e.sent();
                    return [2 /*return*/];
                case 7:
                    projectDirectory = resolved.projectDirectory;
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(channel.id)];
                case 8:
                    sessionId = _e.sent();
                    if (!!sessionId) return [3 /*break*/, 10];
                    return [4 /*yield*/, command.reply({
                            content: 'No active session in this thread',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 9:
                    _e.sent();
                    return [2 /*return*/];
                case 10: return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 11:
                    getClient = _e.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 13];
                    return [4 /*yield*/, command.reply({
                            content: "Failed to share session: ".concat(getClient.message),
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 12:
                    _e.sent();
                    return [2 /*return*/];
                case 13:
                    _e.trys.push([13, 18, , 20]);
                    return [4 /*yield*/, getClient().session.share({
                            sessionID: sessionId,
                        })];
                case 14:
                    response = _e.sent();
                    if (!!((_d = (_c = response.data) === null || _c === void 0 ? void 0 : _c.share) === null || _d === void 0 ? void 0 : _d.url)) return [3 /*break*/, 16];
                    return [4 /*yield*/, command.reply({
                            content: 'Failed to generate share URL',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 15:
                    _e.sent();
                    return [2 /*return*/];
                case 16: return [4 /*yield*/, command.reply({
                        content: "\uD83D\uDD17 **Session shared:** ".concat(response.data.share.url),
                        flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                    })];
                case 17:
                    _e.sent();
                    logger.log("Session ".concat(sessionId, " shared: ").concat(response.data.share.url));
                    return [3 /*break*/, 20];
                case 18:
                    error_1 = _e.sent();
                    logger.error('[SHARE] Error:', error_1);
                    return [4 /*yield*/, command.reply({
                            content: "Failed to share session: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 19:
                    _e.sent();
                    return [3 /*break*/, 20];
                case 20: return [2 /*return*/];
            }
        });
    });
}
