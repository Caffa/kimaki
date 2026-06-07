"use strict";
// /context-usage command - Show token usage and context window percentage for the current session.
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
exports.handleContextUsageCommand = handleContextUsageCommand;
var discord_js_1 = require("discord.js");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var errore = require("errore");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.SESSION);
function getTokenTotal(_a) {
    var input = _a.input, output = _a.output, reasoning = _a.reasoning, cache = _a.cache;
    return input + output + reasoning + cache.read + cache.write;
}
function handleContextUsageCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, isThread, resolved, projectDirectory, workingDirectory, sessionId, getClient, messagesResponse, messages, assistantMessages, lastAssistant, _c, tokens, modelID, providerID_1, totalTokens, totalCost, contextLimit, providersResult, provider, model, formattedTokens, formattedCost, lines, percentage, formattedLimit, error_1;
        var _d, _e, _f, _g;
        var command = _b.command;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _h.sent();
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
                    _h.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: channel,
                    })];
                case 5:
                    resolved = _h.sent();
                    if (!!resolved) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory for this channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 6:
                    _h.sent();
                    return [2 /*return*/];
                case 7:
                    projectDirectory = resolved.projectDirectory, workingDirectory = resolved.workingDirectory;
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(channel.id)];
                case 8:
                    sessionId = _h.sent();
                    if (!!sessionId) return [3 /*break*/, 10];
                    return [4 /*yield*/, command.reply({
                            content: 'No active session in this thread',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 9:
                    _h.sent();
                    return [2 /*return*/];
                case 10: return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 11:
                    getClient = _h.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 13];
                    return [4 /*yield*/, command.reply({
                            content: "Failed to get context usage: ".concat(getClient.message),
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 12:
                    _h.sent();
                    return [2 /*return*/];
                case 13: return [4 /*yield*/, command.deferReply({ flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS })];
                case 14:
                    _h.sent();
                    _h.label = 15;
                case 15:
                    _h.trys.push([15, 23, , 25]);
                    return [4 /*yield*/, getClient().session.messages({
                            sessionID: sessionId,
                            directory: workingDirectory,
                        })];
                case 16:
                    messagesResponse = _h.sent();
                    messages = messagesResponse.data || [];
                    assistantMessages = messages.filter(function (m) { return m.info.role === 'assistant'; });
                    if (!(assistantMessages.length === 0)) return [3 /*break*/, 18];
                    return [4 /*yield*/, command.editReply({
                            content: 'No assistant messages in this session yet',
                        })];
                case 17:
                    _h.sent();
                    return [2 /*return*/];
                case 18:
                    lastAssistant = __spreadArray([], assistantMessages, true).reverse().find(function (m) {
                        if (m.info.role !== 'assistant') {
                            return false;
                        }
                        if (!m.info.tokens) {
                            return false;
                        }
                        return getTokenTotal(m.info.tokens) > 0;
                    });
                    if (!(!lastAssistant || lastAssistant.info.role !== 'assistant')) return [3 /*break*/, 20];
                    return [4 /*yield*/, command.editReply({
                            content: 'Token usage not available for this session yet',
                        })];
                case 19:
                    _h.sent();
                    return [2 /*return*/];
                case 20:
                    _c = lastAssistant.info, tokens = _c.tokens, modelID = _c.modelID, providerID_1 = _c.providerID;
                    totalTokens = getTokenTotal(tokens);
                    totalCost = assistantMessages.reduce(function (sum, m) {
                        if (m.info.role === 'assistant') {
                            return sum + (m.info.cost || 0);
                        }
                        return sum;
                    }, 0);
                    contextLimit = void 0;
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return getClient().provider.list({ directory: workingDirectory });
                        })];
                case 21:
                    providersResult = _h.sent();
                    if (providersResult instanceof Error) {
                        logger.error('[CONTEXT-USAGE] Failed to fetch provider info:', providersResult);
                    }
                    else {
                        provider = (_e = (_d = providersResult.data) === null || _d === void 0 ? void 0 : _d.all) === null || _e === void 0 ? void 0 : _e.find(function (p) { return p.id === providerID_1; });
                        model = (_f = provider === null || provider === void 0 ? void 0 : provider.models) === null || _f === void 0 ? void 0 : _f[modelID];
                        if ((_g = model === null || model === void 0 ? void 0 : model.limit) === null || _g === void 0 ? void 0 : _g.context) {
                            contextLimit = model.limit.context;
                        }
                    }
                    formattedTokens = totalTokens.toLocaleString('en-US');
                    formattedCost = totalCost > 0 ? "$".concat(totalCost.toFixed(4)) : '$0.00';
                    lines = [];
                    if (contextLimit) {
                        percentage = Math.round((totalTokens / contextLimit) * 100);
                        formattedLimit = contextLimit.toLocaleString('en-US');
                        lines.push("**Context usage:** ".concat(percentage, "%, ").concat(formattedTokens, " / ").concat(formattedLimit, " tokens"));
                    }
                    else {
                        lines.push("**Context usage:** ".concat(formattedTokens, " tokens (context limit unavailable)"));
                    }
                    if (modelID) {
                        lines.push("**Model:** ".concat(modelID));
                    }
                    if (totalCost > 0) {
                        lines.push("**Session cost:** ".concat(formattedCost));
                    }
                    return [4 /*yield*/, command.editReply({ content: lines.join('\n') })];
                case 22:
                    _h.sent();
                    logger.log("Context usage shown for session ".concat(sessionId, ": ").concat(totalTokens, " tokens"));
                    return [3 /*break*/, 25];
                case 23:
                    error_1 = _h.sent();
                    logger.error('[CONTEXT-USAGE] Error:', error_1);
                    return [4 /*yield*/, command.editReply({
                            content: "Failed to get context usage: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                        })];
                case 24:
                    _h.sent();
                    return [3 /*break*/, 25];
                case 25: return [2 /*return*/];
            }
        });
    });
}
