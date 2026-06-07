"use strict";
// /unset-model-override command - Remove model overrides and use default instead.
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
exports.handleUnsetModelCommand = handleUnsetModelCommand;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var db_js_1 = require("../db.js");
var orm = require("drizzle-orm");
var schema = require("../schema.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var thread_session_runtime_js_1 = require("../session-handler/thread-session-runtime.js");
var model_js_1 = require("./model.js");
var logger_js_1 = require("../logger.js");
var unsetModelLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.MODEL);
function formatModelSource(type, agentName) {
    switch (type) {
        case 'session':
            return 'session override';
        case 'agent':
            return "agent \"".concat(agentName, "\"");
        case 'channel':
            return 'channel override';
        case 'global':
            return 'global default';
        case 'opencode-config':
        case 'opencode-recent':
        case 'opencode-provider-default':
            return 'opencode default';
        default:
            return 'none';
    }
}
/**
 * Handle the /unset-model-override slash command.
 * In thread: clears session override if exists, otherwise channel override.
 * In channel: clears channel override.
 */
function handleUnsetModelCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var deferError_1, replyError_1, channel, isThread, projectDirectory, targetChannelId, sessionId, thread, textChannel, metadata, metadata, _c, sessionPref, channelPref, clearedType, clearedModel, db, getClient, newModelText, newModelInfo, retried, runtime, clearedTypeText, retriedText;
        var interaction = _b.interaction, appId = _b.appId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 7]);
                    return [4 /*yield*/, interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 1:
                    _d.sent();
                    return [3 /*break*/, 7];
                case 2:
                    deferError_1 = _d.sent();
                    unsetModelLogger.error('[UNSET-MODEL] deferReply failed:', deferError_1);
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, interaction.reply({
                            content: 'Could not process your request. Please try again.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 4:
                    _d.sent();
                    return [3 /*break*/, 6];
                case 5:
                    replyError_1 = _d.sent();
                    unsetModelLogger.error('[UNSET-MODEL] Both deferReply and reply failed:', replyError_1);
                    return [2 /*return*/];
                case 6: return [2 /*return*/];
                case 7:
                    unsetModelLogger.log('[UNSET-MODEL] handleUnsetModelCommand called');
                    channel = interaction.channel;
                    if (!!channel) return [3 /*break*/, 9];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'This command can only be used in a channel',
                        })];
                case 8:
                    _d.sent();
                    return [2 /*return*/];
                case 9:
                    isThread = [
                        discord_js_1.ChannelType.PublicThread,
                        discord_js_1.ChannelType.PrivateThread,
                        discord_js_1.ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                    if (!isThread) return [3 /*break*/, 13];
                    thread = channel;
                    return [4 /*yield*/, (0, discord_utils_js_1.resolveTextChannel)(thread)];
                case 10:
                    textChannel = _d.sent();
                    return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(textChannel)];
                case 11:
                    metadata = _d.sent();
                    projectDirectory = metadata.projectDirectory;
                    targetChannelId = (textChannel === null || textChannel === void 0 ? void 0 : textChannel.id) || channel.id;
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(thread.id)];
                case 12:
                    sessionId = _d.sent();
                    return [3 /*break*/, 17];
                case 13:
                    if (!(channel.type === discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 15];
                    return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(channel)];
                case 14:
                    metadata = _d.sent();
                    projectDirectory = metadata.projectDirectory;
                    targetChannelId = channel.id;
                    return [3 /*break*/, 17];
                case 15: return [4 /*yield*/, interaction.editReply({
                        content: 'This command can only be used in text channels or threads',
                    })];
                case 16:
                    _d.sent();
                    return [2 /*return*/];
                case 17:
                    if (!!projectDirectory) return [3 /*break*/, 19];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'This channel is not configured with a project directory',
                        })];
                case 18:
                    _d.sent();
                    return [2 /*return*/];
                case 19: return [4 /*yield*/, Promise.all([
                        sessionId ? (0, database_js_1.getSessionModel)(sessionId) : Promise.resolve(undefined),
                        (0, database_js_1.getChannelModel)(targetChannelId),
                    ])];
                case 20:
                    _c = _d.sent(), sessionPref = _c[0], channelPref = _c[1];
                    clearedType = null;
                    if (!(isThread && sessionId && sessionPref)) return [3 /*break*/, 22];
                    // In thread with session override: clear session
                    return [4 /*yield*/, (0, database_js_1.clearSessionModel)(sessionId)];
                case 21:
                    // In thread with session override: clear session
                    _d.sent();
                    clearedType = 'session';
                    clearedModel = sessionPref.modelId;
                    unsetModelLogger.log("[UNSET-MODEL] Cleared session model for ".concat(sessionId));
                    return [3 /*break*/, 27];
                case 22:
                    if (!channelPref) return [3 /*break*/, 25];
                    return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 23:
                    db = _d.sent();
                    return [4 /*yield*/, db.delete(schema.channel_models).where(orm.eq(schema.channel_models.channel_id, targetChannelId))];
                case 24:
                    _d.sent();
                    clearedType = 'channel';
                    clearedModel = channelPref.modelId;
                    unsetModelLogger.log("[UNSET-MODEL] Cleared channel model for ".concat(targetChannelId));
                    return [3 /*break*/, 27];
                case 25: return [4 /*yield*/, interaction.editReply({
                        content: 'No model override to clear.',
                    })];
                case 26:
                    _d.sent();
                    return [2 /*return*/];
                case 27: return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 28:
                    getClient = _d.sent();
                    newModelText = 'unknown';
                    if (!!(getClient instanceof Error)) return [3 /*break*/, 30];
                    return [4 /*yield*/, (0, model_js_1.getCurrentModelInfo)({
                            sessionId: sessionId,
                            channelId: targetChannelId,
                            appId: appId,
                            getClient: getClient,
                            directory: projectDirectory,
                        })];
                case 29:
                    newModelInfo = _d.sent();
                    newModelText =
                        newModelInfo.type === 'none'
                            ? 'none'
                            : "`".concat(newModelInfo.model, "` (").concat(formatModelSource(newModelInfo.type, 'agentName' in newModelInfo ? newModelInfo.agentName : undefined), ")");
                    _d.label = 30;
                case 30:
                    retried = false;
                    if (!(isThread && clearedType === 'session' && sessionId)) return [3 /*break*/, 32];
                    runtime = (0, thread_session_runtime_js_1.getRuntime)(channel.id);
                    if (!runtime) return [3 /*break*/, 32];
                    return [4 /*yield*/, runtime.retryLastUserPrompt()];
                case 31:
                    retried = _d.sent();
                    _d.label = 32;
                case 32:
                    clearedTypeText = clearedType === 'session' ? 'Session' : 'Channel';
                    retriedText = retried
                        ? '\n_Restarting current request with new model..._'
                        : '';
                    return [4 /*yield*/, interaction.editReply({
                            content: "".concat(clearedTypeText, " model override removed.\n**Was:** `").concat(clearedModel, "`\n**Now using:** ").concat(newModelText).concat(retriedText),
                        })];
                case 33:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
