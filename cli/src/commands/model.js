"use strict";
// /model command - Set the preferred model for this channel or session.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.ensureSessionPreferencesSnapshot = ensureSessionPreferencesSnapshot;
exports.getCurrentModelInfo = getCurrentModelInfo;
exports.sanitizeModelName = sanitizeModelName;
exports.buildQuickModelCommandDescription = buildQuickModelCommandDescription;
exports.parseQuickModelInfoFromDescription = parseQuickModelInfoFromDescription;
exports.handleQuickModelCommand = handleQuickModelCommand;
exports.handleModelCommand = handleModelCommand;
exports.handleProviderSelectMenu = handleProviderSelectMenu;
exports.handleModelSelectMenu = handleModelSelectMenu;
exports.handleModelVariantSelectMenu = handleModelVariantSelectMenu;
exports.handleModelScopeSelectMenu = handleModelScopeSelectMenu;
var discord_js_1 = require("discord.js");
var node_crypto_1 = require("node:crypto");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var model_utils_js_1 = require("../session-handler/model-utils.js");
var thread_session_runtime_js_1 = require("../session-handler/thread-session-runtime.js");
var thinking_utils_js_1 = require("../thinking-utils.js");
var logger_js_1 = require("../logger.js");
var paginated_select_js_1 = require("./paginated-select.js");
var modelLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.MODEL);
// Store context by hash to avoid customId length limits (Discord max: 100 chars).
// Entries are TTL'd to prevent unbounded growth when users open /model and never
// interact with the select menu.
var MODEL_CONTEXT_TTL_MS = 10 * 60 * 1000;
var pendingModelContexts = new Map();
function setModelContext(contextHash, context) {
    pendingModelContexts.set(contextHash, context);
    setTimeout(function () {
        pendingModelContexts.delete(contextHash);
    }, MODEL_CONTEXT_TTL_MS).unref();
}
function parseModelId(modelString) {
    var _a = modelString.split('/'), providerID = _a[0], modelParts = _a.slice(1);
    var modelID = modelParts.join('/');
    if (providerID && modelID) {
        return { providerID: providerID, modelID: modelID };
    }
    return undefined;
}
function ensureSessionPreferencesSnapshot(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, sessionAgentPreference, sessionModelPreference, shouldBootstrapSessionPreferences, bootstrappedAgent, _d, _e, parsedModelOverride, bootstrappedVariant_1, bootstrappedModel, bootstrappedVariant;
        var sessionId = _b.sessionId, channelId = _b.channelId, appId = _b.appId, getClient = _b.getClient, directory = _b.directory, agentOverride = _b.agentOverride, modelOverride = _b.modelOverride, force = _b.force;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        (0, database_js_1.getSessionAgent)(sessionId),
                        (0, database_js_1.getSessionModel)(sessionId),
                    ])];
                case 1:
                    _c = _f.sent(), sessionAgentPreference = _c[0], sessionModelPreference = _c[1];
                    shouldBootstrapSessionPreferences = force || (!sessionAgentPreference && !sessionModelPreference);
                    if (!shouldBootstrapSessionPreferences) {
                        return [2 /*return*/];
                    }
                    _d = agentOverride ||
                        sessionAgentPreference;
                    if (_d) return [3 /*break*/, 5];
                    if (!channelId) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, database_js_1.getChannelAgent)(channelId)];
                case 2:
                    _e = _f.sent();
                    return [3 /*break*/, 4];
                case 3:
                    _e = undefined;
                    _f.label = 4;
                case 4:
                    _d = (_e);
                    _f.label = 5;
                case 5:
                    bootstrappedAgent = _d;
                    if (!(!sessionAgentPreference && bootstrappedAgent)) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, database_js_1.setSessionAgent)(sessionId, bootstrappedAgent)];
                case 6:
                    _f.sent();
                    modelLogger.log("[MODEL] Snapshotted session agent ".concat(bootstrappedAgent, " for session ").concat(sessionId));
                    _f.label = 7;
                case 7:
                    if (sessionModelPreference) {
                        return [2 /*return*/];
                    }
                    if (!modelOverride) return [3 /*break*/, 11];
                    parsedModelOverride = parseModelId(modelOverride);
                    if (!parsedModelOverride) return [3 /*break*/, 10];
                    return [4 /*yield*/, (0, database_js_1.getVariantCascade)({
                            sessionId: sessionId,
                            channelId: channelId,
                            appId: appId,
                        })];
                case 8:
                    bootstrappedVariant_1 = _f.sent();
                    return [4 /*yield*/, (0, database_js_1.setSessionModel)({
                            sessionId: sessionId,
                            modelId: modelOverride,
                            variant: bootstrappedVariant_1 !== null && bootstrappedVariant_1 !== void 0 ? bootstrappedVariant_1 : null,
                        })];
                case 9:
                    _f.sent();
                    modelLogger.log("[MODEL] Snapshotted explicit session model ".concat(modelOverride, " for session ").concat(sessionId));
                    return [2 /*return*/];
                case 10:
                    modelLogger.warn("[MODEL] Ignoring invalid explicit model override \"".concat(modelOverride, "\" for session ").concat(sessionId));
                    _f.label = 11;
                case 11: return [4 /*yield*/, getCurrentModelInfo({
                        sessionId: sessionId,
                        channelId: channelId,
                        appId: appId,
                        agentPreference: bootstrappedAgent,
                        getClient: getClient,
                        directory: directory,
                    })];
                case 12:
                    bootstrappedModel = _f.sent();
                    if (bootstrappedModel.type === 'none') {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, (0, database_js_1.getVariantCascade)({
                            sessionId: sessionId,
                            channelId: channelId,
                            appId: appId,
                        })];
                case 13:
                    bootstrappedVariant = _f.sent();
                    return [4 /*yield*/, (0, database_js_1.setSessionModel)({
                            sessionId: sessionId,
                            modelId: bootstrappedModel.model,
                            variant: bootstrappedVariant !== null && bootstrappedVariant !== void 0 ? bootstrappedVariant : null,
                        })];
                case 14:
                    _f.sent();
                    modelLogger.log("[MODEL] Snapshotted session model ".concat(bootstrappedModel.model, " for session ").concat(sessionId));
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Get the current model info for a channel/session, including where it comes from.
 * Priority: session > agent > channel > global > opencode default
 */
function getCurrentModelInfo(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var sessionPref, parsed, effectiveAgent, _c, _d, _e, _f, _g, agentsResponse, agent, model, channelPref, parsed, globalPref, parsed, defaultModel, model;
        var sessionId = _b.sessionId, channelId = _b.channelId, appId = _b.appId, agentPreference = _b.agentPreference, getClient = _b.getClient, directory = _b.directory;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    if (getClient instanceof Error) {
                        return [2 /*return*/, { type: 'none' }];
                    }
                    if (!sessionId) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, database_js_1.getSessionModel)(sessionId)];
                case 1:
                    sessionPref = _h.sent();
                    if (sessionPref) {
                        parsed = parseModelId(sessionPref.modelId);
                        if (parsed) {
                            return [2 /*return*/, __assign({ type: 'session', model: sessionPref.modelId }, parsed)];
                        }
                    }
                    _h.label = 2;
                case 2:
                    if (!(agentPreference !== null && agentPreference !== void 0)) return [3 /*break*/, 3];
                    _c = agentPreference;
                    return [3 /*break*/, 14];
                case 3:
                    if (!sessionId) return [3 /*break*/, 9];
                    return [4 /*yield*/, (0, database_js_1.getSessionAgent)(sessionId)];
                case 4:
                    _e = (_h.sent());
                    if (_e) return [3 /*break*/, 8];
                    if (!channelId) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, database_js_1.getChannelAgent)(channelId)];
                case 5:
                    _f = _h.sent();
                    return [3 /*break*/, 7];
                case 6:
                    _f = undefined;
                    _h.label = 7;
                case 7:
                    _e = (_f);
                    _h.label = 8;
                case 8:
                    _d = _e;
                    return [3 /*break*/, 13];
                case 9:
                    if (!channelId) return [3 /*break*/, 11];
                    return [4 /*yield*/, (0, database_js_1.getChannelAgent)(channelId)];
                case 10:
                    _g = _h.sent();
                    return [3 /*break*/, 12];
                case 11:
                    _g = undefined;
                    _h.label = 12;
                case 12:
                    _d = _g;
                    _h.label = 13;
                case 13:
                    _c = (_d);
                    _h.label = 14;
                case 14:
                    effectiveAgent = _c;
                    if (!effectiveAgent) return [3 /*break*/, 16];
                    return [4 /*yield*/, getClient().app.agents({ directory: directory })];
                case 15:
                    agentsResponse = _h.sent();
                    if (agentsResponse.data) {
                        agent = agentsResponse.data.find(function (a) { return a.name === effectiveAgent; });
                        if (agent === null || agent === void 0 ? void 0 : agent.model) {
                            model = "".concat(agent.model.providerID, "/").concat(agent.model.modelID);
                            return [2 /*return*/, {
                                    type: 'agent',
                                    model: model,
                                    providerID: agent.model.providerID,
                                    modelID: agent.model.modelID,
                                    agentName: effectiveAgent,
                                }];
                        }
                    }
                    _h.label = 16;
                case 16:
                    if (!channelId) return [3 /*break*/, 18];
                    return [4 /*yield*/, (0, database_js_1.getChannelModel)(channelId)];
                case 17:
                    channelPref = _h.sent();
                    if (channelPref) {
                        parsed = parseModelId(channelPref.modelId);
                        if (parsed) {
                            return [2 /*return*/, __assign({ type: 'channel', model: channelPref.modelId }, parsed)];
                        }
                    }
                    _h.label = 18;
                case 18:
                    if (!appId) return [3 /*break*/, 20];
                    return [4 /*yield*/, (0, database_js_1.getGlobalModel)(appId)];
                case 19:
                    globalPref = _h.sent();
                    if (globalPref) {
                        parsed = parseModelId(globalPref.modelId);
                        if (parsed) {
                            return [2 /*return*/, __assign({ type: 'global', model: globalPref.modelId }, parsed)];
                        }
                    }
                    _h.label = 20;
                case 20: return [4 /*yield*/, (0, model_utils_js_1.getDefaultModel)({ getClient: getClient, directory: directory })];
                case 21:
                    defaultModel = _h.sent();
                    if (defaultModel) {
                        model = "".concat(defaultModel.providerID, "/").concat(defaultModel.modelID);
                        return [2 /*return*/, {
                                type: defaultModel.source,
                                model: model,
                                providerID: defaultModel.providerID,
                                modelID: defaultModel.modelID,
                            }];
                    }
                    return [2 /*return*/, { type: 'none' }];
            }
        });
    });
}
/**
 * Sanitize a model ID to be a valid Discord command name component.
 * Lowercase, alphanumeric and hyphens only.
 * Example: anthropic/claude-3-5-sonnet -> claude-3-5-sonnet
 */
function sanitizeModelName(modelId) {
    // Extract model name from provider/model
    var name = modelId.includes('/') ? modelId.split('/')[1] : modelId;
    if (!name)
        return 'model';
    return name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
var QUICK_MODEL_DESCRIPTION_PATTERN = /^\[model:([^\]]+)\]/;
/**
 * Build quick-model command description with an embedded model ID and optional variant.
 * Metadata format: [model:<modelId>(:<variant>)] <visible description>
 */
function buildQuickModelCommandDescription(_a) {
    var modelId = _a.modelId, variant = _a.variant;
    var metadataValue = variant ? "".concat(modelId, ":").concat(variant) : modelId;
    var metadataPrefix = "[model:".concat(metadataValue, "]");
    if (metadataPrefix.length > 100) {
        return metadataPrefix.slice(0, 100);
    }
    var visibleDescription = "Switch to ".concat(modelId).concat(variant ? " (".concat(variant, ")") : '');
    var maxVisibleLength = 100 - metadataPrefix.length - 1;
    if (maxVisibleLength <= 0) {
        return metadataPrefix;
    }
    var trimmedVisible = visibleDescription.slice(0, maxVisibleLength).trim();
    if (!trimmedVisible) {
        return metadataPrefix;
    }
    return "".concat(metadataPrefix, " ").concat(trimmedVisible);
}
function parseQuickModelInfoFromDescription(description) {
    var _a;
    if (!description) {
        return undefined;
    }
    var match = QUICK_MODEL_DESCRIPTION_PATTERN.exec(description);
    if (!match) {
        return undefined;
    }
    var value = (_a = match[1]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!value) {
        return undefined;
    }
    if (value.includes(':')) {
        var parts = value.split(':');
        var variant = parts.pop() || null;
        var modelId = parts.join(':');
        return { modelId: modelId, variant: variant };
    }
    return { modelId: value, variant: null };
}
function resolveQuickModelInfoFromInteraction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var fromCommandObject, fetchedCommand;
        var _c;
        var command = _b.command;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    fromCommandObject = parseQuickModelInfoFromDescription((_c = command.command) === null || _c === void 0 ? void 0 : _c.description);
                    if (fromCommandObject) {
                        return [2 /*return*/, fromCommandObject];
                    }
                    if (!command.guild) {
                        return [2 /*return*/, undefined];
                    }
                    return [4 /*yield*/, command.guild.commands.fetch(command.commandId)];
                case 1:
                    fetchedCommand = _d.sent();
                    if (!fetchedCommand) {
                        return [2 /*return*/, undefined];
                    }
                    return [2 /*return*/, parseQuickModelInfoFromDescription(fetchedCommand.description)];
            }
        });
    });
}
/**
 * Handle quick-switch model commands like /model-claude-3-opus.
 * Instantly sets the model for both current session and global default.
 */
function handleQuickModelCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, info, modelId, variant, variantSuffix, isThread, targetChannelId, sessionId, thread, _c, textChannel, threadSessionId, sessionApplied, retried, runtime, scopeText, retryNote, error_1;
        var command = _b.command, appId = _b.appId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, command.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 1:
                    _d.sent();
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 3];
                    return [4 /*yield*/, command.editReply({ content: 'This command can only be used in a channel' })];
                case 2:
                    _d.sent();
                    return [2 /*return*/];
                case 3:
                    _d.trys.push([3, 16, , 18]);
                    return [4 /*yield*/, resolveQuickModelInfoFromInteraction({ command: command })];
                case 4:
                    info = _d.sent();
                    if (!!info) return [3 /*break*/, 6];
                    return [4 /*yield*/, command.editReply({ content: 'Could not resolve model information' })];
                case 5:
                    _d.sent();
                    return [2 /*return*/];
                case 6:
                    modelId = info.modelId, variant = info.variant;
                    variantSuffix = variant ? " (".concat(variant, ")") : '';
                    isThread = [
                        discord_js_1.ChannelType.PublicThread,
                        discord_js_1.ChannelType.PrivateThread,
                        discord_js_1.ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                    targetChannelId = void 0;
                    sessionId = void 0;
                    thread = void 0;
                    if (!isThread) return [3 /*break*/, 8];
                    thread = channel;
                    return [4 /*yield*/, Promise.all([
                            (0, discord_utils_js_1.resolveTextChannel)(thread),
                            (0, database_js_1.getThreadSession)(thread.id),
                        ])];
                case 7:
                    _c = _d.sent(), textChannel = _c[0], threadSessionId = _c[1];
                    targetChannelId = (textChannel === null || textChannel === void 0 ? void 0 : textChannel.id) || channel.id;
                    sessionId = threadSessionId;
                    return [3 /*break*/, 9];
                case 8:
                    targetChannelId = channel.id;
                    _d.label = 9;
                case 9: 
                // Apply to global and channel
                return [4 /*yield*/, (0, database_js_1.setGlobalModel)({ appId: appId, modelId: modelId, variant: variant })];
                case 10:
                    // Apply to global and channel
                    _d.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelModel)({ channelId: targetChannelId, modelId: modelId, variant: variant })];
                case 11:
                    _d.sent();
                    sessionApplied = false;
                    retried = false;
                    if (!sessionId) return [3 /*break*/, 14];
                    return [4 /*yield*/, (0, database_js_1.setSessionModel)({ sessionId: sessionId, modelId: modelId, variant: variant })];
                case 12:
                    _d.sent();
                    sessionApplied = true;
                    runtime = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    if (!runtime) return [3 /*break*/, 14];
                    return [4 /*yield*/, runtime.retryLastUserPrompt()];
                case 13:
                    retried = _d.sent();
                    _d.label = 14;
                case 14:
                    scopeText = sessionApplied
                        ? 'this session, this channel, and as global default'
                        : 'this channel and as global default';
                    retryNote = retried ? '\n_Restarting current request with new model..._' : '';
                    return [4 /*yield*/, command.editReply({
                            content: "Switched to **".concat(modelId, "**").concat(variantSuffix, " for ").concat(scopeText, ".").concat(retryNote),
                        })];
                case 15:
                    _d.sent();
                    return [3 /*break*/, 18];
                case 16:
                    error_1 = _d.sent();
                    modelLogger.error('Error in quick model command:', error_1);
                    return [4 /*yield*/, command.editReply({
                            content: "Failed to switch model: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                        })];
                case 17:
                    _d.sent();
                    return [3 /*break*/, 18];
                case 18: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle the /model slash command.
 * Shows a select menu with available providers.
 */
function handleModelCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var deferError_1, replyError_1, channel, isThread, projectDirectory, targetChannelId, sessionId, thread, _c, textChannel, threadSessionId, metadata, metadata, getClient, effectiveAppId, _d, providersResponse, currentModelInfo_1, cascadeVariant_1, _e, allProviders, connected_1, availableProviders, currentModelText, variantText, providerSelectHeader, context, contextHash, allProviderOptions, options, selectMenu, actionRow, error_2;
        var interaction = _b.interaction, appId = _b.appId;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 2, , 7]);
                    return [4 /*yield*/, interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 1:
                    _f.sent();
                    return [3 /*break*/, 7];
                case 2:
                    deferError_1 = _f.sent();
                    modelLogger.error('[MODEL] deferReply failed:', deferError_1);
                    _f.label = 3;
                case 3:
                    _f.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, interaction.reply({
                            content: 'Could not start model selection. Please try again.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 4:
                    _f.sent();
                    return [3 /*break*/, 6];
                case 5:
                    replyError_1 = _f.sent();
                    modelLogger.error('[MODEL] Both deferReply and reply failed:', replyError_1);
                    return [2 /*return*/];
                case 6: return [2 /*return*/]; // Fallback reply succeeded — don't fall through
                case 7:
                    modelLogger.log('[MODEL] Reply deferred successfully');
                    channel = interaction.channel;
                    if (!!channel) return [3 /*break*/, 9];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'This command can only be used in a channel',
                        })];
                case 8:
                    _f.sent();
                    return [2 /*return*/];
                case 9:
                    isThread = [
                        discord_js_1.ChannelType.PublicThread,
                        discord_js_1.ChannelType.PrivateThread,
                        discord_js_1.ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                    if (!isThread) return [3 /*break*/, 12];
                    thread = channel;
                    return [4 /*yield*/, Promise.all([
                            (0, discord_utils_js_1.resolveTextChannel)(thread),
                            (0, database_js_1.getThreadSession)(thread.id),
                        ])];
                case 10:
                    _c = _f.sent(), textChannel = _c[0], threadSessionId = _c[1];
                    return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(textChannel)];
                case 11:
                    metadata = _f.sent();
                    projectDirectory = metadata.projectDirectory;
                    targetChannelId = (textChannel === null || textChannel === void 0 ? void 0 : textChannel.id) || channel.id;
                    sessionId = threadSessionId;
                    return [3 /*break*/, 16];
                case 12:
                    if (!(channel.type === discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 14];
                    return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(channel)];
                case 13:
                    metadata = _f.sent();
                    projectDirectory = metadata.projectDirectory;
                    targetChannelId = channel.id;
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, interaction.editReply({
                        content: 'This command can only be used in text channels or threads',
                    })];
                case 15:
                    _f.sent();
                    return [2 /*return*/];
                case 16:
                    if (!!projectDirectory) return [3 /*break*/, 18];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'This channel is not configured with a project directory',
                        })];
                case 17:
                    _f.sent();
                    return [2 /*return*/];
                case 18:
                    _f.trys.push([18, 30, , 32]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 19:
                    getClient = _f.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 21];
                    return [4 /*yield*/, interaction.editReply({ content: getClient.message })];
                case 20:
                    _f.sent();
                    return [2 /*return*/];
                case 21:
                    effectiveAppId = appId;
                    if (!(isThread && sessionId)) return [3 /*break*/, 23];
                    return [4 /*yield*/, ensureSessionPreferencesSnapshot({
                            sessionId: sessionId,
                            channelId: targetChannelId,
                            appId: effectiveAppId,
                            getClient: getClient,
                            directory: projectDirectory,
                        })];
                case 22:
                    _f.sent();
                    _f.label = 23;
                case 23: return [4 /*yield*/, Promise.all([
                        getClient().provider.list({ directory: projectDirectory }),
                        getCurrentModelInfo({
                            sessionId: sessionId,
                            channelId: targetChannelId,
                            appId: effectiveAppId,
                            getClient: getClient,
                            directory: projectDirectory,
                        }),
                        (0, database_js_1.getVariantCascade)({
                            sessionId: sessionId,
                            channelId: targetChannelId,
                            appId: effectiveAppId,
                        }),
                    ])];
                case 24:
                    _d = _f.sent(), providersResponse = _d[0], currentModelInfo_1 = _d[1], cascadeVariant_1 = _d[2];
                    if (!!providersResponse.data) return [3 /*break*/, 26];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Failed to fetch providers',
                        })];
                case 25:
                    _f.sent();
                    return [2 /*return*/];
                case 26:
                    _e = providersResponse.data, allProviders = _e.all, connected_1 = _e.connected;
                    availableProviders = allProviders.filter(function (p) {
                        return connected_1.includes(p.id);
                    });
                    if (!(availableProviders.length === 0)) return [3 /*break*/, 28];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No providers with credentials found. Use `/login` to connect a provider and add credentials.',
                        })];
                case 27:
                    _f.sent();
                    return [2 /*return*/];
                case 28:
                    currentModelText = (function () {
                        switch (currentModelInfo_1.type) {
                            case 'session':
                                return "**Current (this thread):** `".concat(currentModelInfo_1.model, "`");
                            case 'agent':
                                return "**Current (agent \"".concat(currentModelInfo_1.agentName, "\"):** `").concat(currentModelInfo_1.model, "`");
                            case 'channel':
                                return "**Current (channel override):** `".concat(currentModelInfo_1.model, "`");
                            case 'global':
                                return "**Current (global default):** `".concat(currentModelInfo_1.model, "`");
                            case 'opencode-config':
                            case 'opencode-recent':
                            case 'opencode-provider-default':
                                return "**Current (opencode default):** `".concat(currentModelInfo_1.model, "`");
                            case 'none':
                                return '**Current:** none';
                        }
                    })();
                    variantText = (function () {
                        if (currentModelInfo_1.type === 'none' || !cascadeVariant_1) {
                            return '';
                        }
                        return "\n**Variant:** `".concat(cascadeVariant_1, "`");
                    })();
                    providerSelectHeader = "**Set Model Preference**\n".concat(currentModelText).concat(variantText, "\nSelect a provider:");
                    context = {
                        dir: projectDirectory,
                        channelId: targetChannelId,
                        sessionId: sessionId,
                        isThread: isThread,
                        thread: isThread ? channel : undefined,
                        appId: appId,
                        providerSelectHeader: providerSelectHeader,
                    };
                    contextHash = node_crypto_1.default.randomBytes(8).toString('hex');
                    setModelContext(contextHash, context);
                    allProviderOptions = __spreadArray([], availableProviders, true).sort(function (a, b) { return a.name.localeCompare(b.name); })
                        .map(function (provider) {
                        var modelCount = Object.keys(provider.models || {}).length;
                        return {
                            label: provider.name.slice(0, 100),
                            value: provider.id,
                            description: "".concat(modelCount, " model").concat(modelCount !== 1 ? 's' : '', " available").slice(0, 100),
                        };
                    });
                    options = (0, paginated_select_js_1.buildPaginatedOptions)({
                        allOptions: allProviderOptions,
                        page: 0,
                    }).options;
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("model_provider:".concat(contextHash))
                        .setPlaceholder('Select a provider')
                        .addOptions(options);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, interaction.editReply({
                            content: providerSelectHeader,
                            components: [actionRow],
                        })];
                case 29:
                    _f.sent();
                    return [3 /*break*/, 32];
                case 30:
                    error_2 = _f.sent();
                    modelLogger.error('Error loading providers:', error_2);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to load providers: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'),
                        })];
                case 31:
                    _f.sent();
                    return [3 /*break*/, 32];
                case 32: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle the provider select menu interaction.
 * Shows a second select menu with models for the chosen provider.
 */
function handleProviderSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, contextHash, context, selectedProviderId, providerNavPage, getClient, providersResponse, _a, allProviders, connected_2, availableProviders, allProviderOptions, options, selectMenu, actionRow, error_3, getClient, providersResponse, provider, models, allModelOptions, options, selectMenu, actionRow, error_4;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('model_provider:')) {
                        return [2 /*return*/];
                    }
                    // Defer update immediately to avoid timeout
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    // Defer update immediately to avoid timeout
                    _b.sent();
                    contextHash = customId.replace('model_provider:', '');
                    context = pendingModelContexts.get(contextHash);
                    if (!!context) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Selection expired. Please run /model again.',
                            components: [],
                        })];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
                case 3:
                    selectedProviderId = interaction.values[0];
                    if (!!selectedProviderId) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No provider selected',
                            components: [],
                        })];
                case 4:
                    _b.sent();
                    return [2 /*return*/];
                case 5:
                    providerNavPage = (0, paginated_select_js_1.parsePaginationValue)(selectedProviderId);
                    if (!(providerNavPage !== undefined)) return [3 /*break*/, 17];
                    context.providerPage = providerNavPage;
                    setModelContext(contextHash, context);
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 14, , 16]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(context.dir)];
                case 7:
                    getClient = _b.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 9];
                    return [4 /*yield*/, interaction.editReply({ content: getClient.message, components: [] })];
                case 8:
                    _b.sent();
                    return [2 /*return*/];
                case 9: return [4 /*yield*/, getClient().provider.list({ directory: context.dir })];
                case 10:
                    providersResponse = _b.sent();
                    if (!!providersResponse.data) return [3 /*break*/, 12];
                    return [4 /*yield*/, interaction.editReply({ content: 'Failed to fetch providers', components: [] })];
                case 11:
                    _b.sent();
                    return [2 /*return*/];
                case 12:
                    _a = providersResponse.data, allProviders = _a.all, connected_2 = _a.connected;
                    availableProviders = allProviders.filter(function (p) { return connected_2.includes(p.id); });
                    allProviderOptions = __spreadArray([], availableProviders, true).sort(function (a, b) { return a.name.localeCompare(b.name); })
                        .map(function (p) {
                        var modelCount = Object.keys(p.models || {}).length;
                        return {
                            label: p.name.slice(0, 100),
                            value: p.id,
                            description: "".concat(modelCount, " model").concat(modelCount !== 1 ? 's' : '', " available").slice(0, 100),
                        };
                    });
                    options = (0, paginated_select_js_1.buildPaginatedOptions)({ allOptions: allProviderOptions, page: providerNavPage }).options;
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("model_provider:".concat(contextHash))
                        .setPlaceholder('Select a provider')
                        .addOptions(options);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, interaction.editReply({
                            content: context.providerSelectHeader || "**Set Model Preference**\nSelect a provider:",
                            components: [actionRow],
                        })];
                case 13:
                    _b.sent();
                    return [3 /*break*/, 16];
                case 14:
                    error_3 = _b.sent();
                    modelLogger.error('Error loading providers for pagination:', error_3);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to load providers: ".concat(error_3 instanceof Error ? error_3.message : 'Unknown error'),
                            components: [],
                        })];
                case 15:
                    _b.sent();
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
                case 17:
                    _b.trys.push([17, 29, , 31]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(context.dir)];
                case 18:
                    getClient = _b.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 20];
                    return [4 /*yield*/, interaction.editReply({
                            content: getClient.message,
                            components: [],
                        })];
                case 19:
                    _b.sent();
                    return [2 /*return*/];
                case 20: return [4 /*yield*/, getClient().provider.list({
                        directory: context.dir,
                    })];
                case 21:
                    providersResponse = _b.sent();
                    if (!!providersResponse.data) return [3 /*break*/, 23];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Failed to fetch providers',
                            components: [],
                        })];
                case 22:
                    _b.sent();
                    return [2 /*return*/];
                case 23:
                    provider = providersResponse.data.all.find(function (p) { return p.id === selectedProviderId; });
                    if (!!provider) return [3 /*break*/, 25];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Provider not found',
                            components: [],
                        })];
                case 24:
                    _b.sent();
                    return [2 /*return*/];
                case 25:
                    models = Object.entries(provider.models || {})
                        .map(function (_a) {
                        var modelId = _a[0], model = _a[1];
                        return ({
                            id: modelId,
                            name: model.name,
                            releaseDate: model.release_date,
                        });
                    })
                        .sort(function (a, b) { return a.name.localeCompare(b.name); });
                    if (!(models.length === 0)) return [3 /*break*/, 27];
                    return [4 /*yield*/, interaction.editReply({
                            content: "No models available for ".concat(provider.name),
                            components: [],
                        })];
                case 26:
                    _b.sent();
                    return [2 /*return*/];
                case 27:
                    // Update context with provider info and reuse the same hash
                    context.providerId = selectedProviderId;
                    context.providerName = provider.name;
                    context.modelPage = 0;
                    setModelContext(contextHash, context);
                    allModelOptions = models.map(function (model) {
                        var dateStr = model.releaseDate
                            ? new Date(model.releaseDate).toLocaleDateString()
                            : 'Unknown date';
                        return {
                            label: model.name.slice(0, 100),
                            value: model.id,
                            description: dateStr.slice(0, 100),
                        };
                    });
                    options = (0, paginated_select_js_1.buildPaginatedOptions)({
                        allOptions: allModelOptions,
                        page: 0,
                    }).options;
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("model_select:".concat(contextHash))
                        .setPlaceholder('Select a model')
                        .addOptions(options);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Set Model Preference**\nProvider: **".concat(provider.name, "**\nSelect a model:"),
                            components: [actionRow],
                        })];
                case 28:
                    _b.sent();
                    return [3 /*break*/, 31];
                case 29:
                    error_4 = _b.sent();
                    modelLogger.error('Error loading models:', error_4);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to load models: ".concat(error_4 instanceof Error ? error_4.message : 'Unknown error'),
                            components: [],
                        })];
                case 30:
                    _b.sent();
                    return [3 /*break*/, 31];
                case 31: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle the model select menu interaction.
 * Stores the model preference in the database.
 */
function handleModelSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, contextHash, context, selectedModelId, modelNavPage, getClient, providersResponse, provider, allModelOptions, options, selectMenu, actionRow, error_5, fullModelId, getClient, providersResponse, variants, variantOptions, selectMenu, actionRow, error_6;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('model_select:')) {
                        return [2 /*return*/];
                    }
                    // Defer update immediately
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    // Defer update immediately
                    _b.sent();
                    contextHash = customId.replace('model_select:', '');
                    context = pendingModelContexts.get(contextHash);
                    if (!(!context || !context.providerId || !context.providerName)) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Selection expired. Please run /model again.',
                            components: [],
                        })];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
                case 3:
                    selectedModelId = interaction.values[0];
                    if (!!selectedModelId) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No model selected',
                            components: [],
                        })];
                case 4:
                    _b.sent();
                    return [2 /*return*/];
                case 5:
                    modelNavPage = (0, paginated_select_js_1.parsePaginationValue)(selectedModelId);
                    if (!(modelNavPage !== undefined)) return [3 /*break*/, 17];
                    context.modelPage = modelNavPage;
                    setModelContext(contextHash, context);
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 14, , 16]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(context.dir)];
                case 7:
                    getClient = _b.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 9];
                    return [4 /*yield*/, interaction.editReply({ content: getClient.message, components: [] })];
                case 8:
                    _b.sent();
                    return [2 /*return*/];
                case 9: return [4 /*yield*/, getClient().provider.list({ directory: context.dir })];
                case 10:
                    providersResponse = _b.sent();
                    provider = (_a = providersResponse.data) === null || _a === void 0 ? void 0 : _a.all.find(function (p) { return p.id === context.providerId; });
                    if (!!provider) return [3 /*break*/, 12];
                    return [4 /*yield*/, interaction.editReply({ content: 'Provider not found', components: [] })];
                case 11:
                    _b.sent();
                    return [2 /*return*/];
                case 12:
                    allModelOptions = Object.entries(provider.models || {})
                        .map(function (_a) {
                        var modelId = _a[0], model = _a[1];
                        return ({
                            label: model.name.slice(0, 100),
                            value: modelId,
                            description: (model.release_date
                                ? new Date(model.release_date).toLocaleDateString()
                                : 'Unknown date').slice(0, 100),
                        });
                    })
                        .sort(function (a, b) { return a.label.localeCompare(b.label); });
                    options = (0, paginated_select_js_1.buildPaginatedOptions)({ allOptions: allModelOptions, page: modelNavPage }).options;
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("model_select:".concat(contextHash))
                        .setPlaceholder('Select a model')
                        .addOptions(options);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Set Model Preference**\nProvider: **".concat(context.providerName, "**\nSelect a model:"),
                            components: [actionRow],
                        })];
                case 13:
                    _b.sent();
                    return [3 /*break*/, 16];
                case 14:
                    error_5 = _b.sent();
                    modelLogger.error('Error loading models for pagination:', error_5);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to load models: ".concat(error_5 instanceof Error ? error_5.message : 'Unknown error'),
                            components: [],
                        })];
                case 15:
                    _b.sent();
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
                case 17:
                    fullModelId = "".concat(context.providerId, "/").concat(selectedModelId);
                    _b.label = 18;
                case 18:
                    _b.trys.push([18, 24, , 26]);
                    context.selectedModelId = fullModelId;
                    setModelContext(contextHash, context);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(context.dir)];
                case 19:
                    getClient = _b.sent();
                    if (!!(getClient instanceof Error)) return [3 /*break*/, 22];
                    return [4 /*yield*/, getClient().provider.list({
                            directory: context.dir,
                        })];
                case 20:
                    providersResponse = _b.sent();
                    if (!providersResponse.data) return [3 /*break*/, 22];
                    variants = (0, thinking_utils_js_1.getThinkingValuesForModel)({
                        providers: providersResponse.data.all,
                        providerId: context.providerId,
                        modelId: selectedModelId,
                    });
                    if (!(variants.length > 0)) return [3 /*break*/, 22];
                    context.availableVariants = variants;
                    setModelContext(contextHash, context);
                    variantOptions = __spreadArray([
                        {
                            label: 'None (default)',
                            value: '__none__',
                            description: 'Use the model without a specific thinking level',
                        }
                    ], variants.slice(0, 24).map(function (v) { return ({
                        label: v.slice(0, 100),
                        value: v,
                        description: "Use ".concat(v, " thinking").slice(0, 100),
                    }); }), true);
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("model_variant:".concat(contextHash))
                        .setPlaceholder('Select a thinking level')
                        .addOptions(variantOptions);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Set Model Preference**\nModel: **".concat(context.providerName, "** / **").concat(selectedModelId, "**\n`").concat(fullModelId, "`\nSelect a thinking level:"),
                            components: [actionRow],
                        })];
                case 21:
                    _b.sent();
                    return [2 /*return*/];
                case 22:
                    // No variants available - skip to scope
                    context.selectedVariant = null;
                    setModelContext(contextHash, context);
                    return [4 /*yield*/, showScopeMenu({ interaction: interaction, contextHash: contextHash, context: context })];
                case 23:
                    _b.sent();
                    return [3 /*break*/, 26];
                case 24:
                    error_6 = _b.sent();
                    modelLogger.error('Error saving model preference:', error_6);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to save model preference: ".concat(error_6 instanceof Error ? error_6.message : 'Unknown error'),
                            components: [],
                        })];
                case 25:
                    _b.sent();
                    return [3 /*break*/, 26];
                case 26: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle the variant select menu interaction.
 * Stores the selected variant and shows the scope menu.
 */
function handleModelVariantSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, contextHash, context, selectedValue;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('model_variant:')) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    _a.sent();
                    contextHash = customId.replace('model_variant:', '');
                    context = pendingModelContexts.get(contextHash);
                    if (!(!context || !context.selectedModelId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Selection expired. Please run /model again.',
                            components: [],
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
                case 3:
                    selectedValue = interaction.values[0];
                    if (!!selectedValue) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No variant selected',
                            components: [],
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
                case 5:
                    context.selectedVariant = selectedValue === '__none__' ? null : selectedValue;
                    setModelContext(contextHash, context);
                    return [4 /*yield*/, showScopeMenu({ interaction: interaction, contextHash: contextHash, context: context })];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function showScopeMenu(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var modelId, modelDisplay, variantSuffix, scopeOptions, selectMenu, actionRow;
        var interaction = _b.interaction, contextHash = _b.contextHash, context = _b.context;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    modelId = context.selectedModelId;
                    modelDisplay = modelId.split('/')[1] || modelId;
                    variantSuffix = context.selectedVariant
                        ? " (".concat(context.selectedVariant, ")")
                        : '';
                    scopeOptions = __spreadArray(__spreadArray([], (context.isThread && context.sessionId
                        ? [
                            {
                                label: 'This session only',
                                value: 'session',
                                description: 'Override for this session only',
                            },
                        ]
                        : []), true), [
                        {
                            label: 'This channel only',
                            value: 'channel',
                            description: 'Override for this channel only',
                        },
                        {
                            label: 'Global default',
                            value: 'global',
                            description: 'Set for this channel and as default for all others',
                        },
                    ], false);
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("model_scope:".concat(contextHash))
                        .setPlaceholder('Apply to...')
                        .addOptions(scopeOptions);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Set Model Preference**\nModel: **".concat(context.providerName, "** / **").concat(modelDisplay, "**").concat(variantSuffix, "\n`").concat(modelId, "`\nApply to:"),
                            components: [actionRow],
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle the scope select menu interaction.
 * Applies the model to either the channel or globally.
 */
function handleModelScopeSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, contextHash, context, selectedScope, modelId, modelDisplay, variant, variantSuffix, agentTip, retried, runtime, retryNote, error_7;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('model_scope:')) {
                        return [2 /*return*/];
                    }
                    // Defer update immediately
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    // Defer update immediately
                    _b.sent();
                    contextHash = customId.replace('model_scope:', '');
                    context = pendingModelContexts.get(contextHash);
                    if (!(!context ||
                        !context.providerId ||
                        !context.providerName ||
                        !context.selectedModelId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Selection expired. Please run /model again.',
                            components: [],
                        })];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
                case 3:
                    selectedScope = interaction.values[0];
                    if (!!selectedScope) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No scope selected',
                            components: [],
                        })];
                case 4:
                    _b.sent();
                    return [2 /*return*/];
                case 5:
                    modelId = context.selectedModelId;
                    modelDisplay = modelId.split('/')[1] || modelId;
                    variant = (_a = context.selectedVariant) !== null && _a !== void 0 ? _a : null;
                    variantSuffix = variant ? " (".concat(variant, ")") : '';
                    agentTip = '\n_Tip: create [agent .md files](https://github.com/remorses/kimaki/blob/main/docs/model-switching.md) in .opencode/agent/ for one-command model switching_';
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 27, , 29]);
                    if (!(selectedScope === 'session')) return [3 /*break*/, 15];
                    if (!!context.sessionId) return [3 /*break*/, 8];
                    pendingModelContexts.delete(contextHash);
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No active session in this thread. Please run /model in a thread with a session.',
                            components: [],
                        })];
                case 7:
                    _b.sent();
                    return [2 /*return*/];
                case 8: return [4 /*yield*/, (0, database_js_1.setSessionModel)({ sessionId: context.sessionId, modelId: modelId, variant: variant })];
                case 9:
                    _b.sent();
                    if (!context.appId) return [3 /*break*/, 11];
                    return [4 /*yield*/, (0, database_js_1.recordModelUsage)({ appId: context.appId, modelId: modelId, variant: variant })];
                case 10:
                    _b.sent();
                    _b.label = 11;
                case 11:
                    modelLogger.log("Set model ".concat(modelId).concat(variantSuffix, " for session ").concat(context.sessionId));
                    retried = false;
                    if (!context.thread) return [3 /*break*/, 13];
                    runtime = (0, thread_session_runtime_js_1.getRuntime)(context.thread.id);
                    if (!runtime) return [3 /*break*/, 13];
                    return [4 /*yield*/, runtime.retryLastUserPrompt()];
                case 12:
                    retried = _b.sent();
                    _b.label = 13;
                case 13:
                    retryNote = retried
                        ? '\n_Restarting current request with new model..._'
                        : '';
                    return [4 /*yield*/, interaction.editReply({
                            content: "Model set for this session:\n**".concat(context.providerName, "** / **").concat(modelDisplay, "**").concat(variantSuffix, "\n`").concat(modelId, "`").concat(retryNote).concat(agentTip),
                            flags: discord_js_1.MessageFlags.SuppressEmbeds,
                            components: [],
                        })];
                case 14:
                    _b.sent();
                    return [3 /*break*/, 26];
                case 15:
                    if (!(selectedScope === 'global')) return [3 /*break*/, 21];
                    if (!!context.appId) return [3 /*break*/, 17];
                    pendingModelContexts.delete(contextHash);
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Cannot set global model: channel is not linked to a bot',
                            components: [],
                        })];
                case 16:
                    _b.sent();
                    return [2 /*return*/];
                case 17: return [4 /*yield*/, (0, database_js_1.setGlobalModel)({ appId: context.appId, modelId: modelId, variant: variant })];
                case 18:
                    _b.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelModel)({ channelId: context.channelId, modelId: modelId, variant: variant })];
                case 19:
                    _b.sent();
                    modelLogger.log("Set global model ".concat(modelId).concat(variantSuffix, " for app ").concat(context.appId, " and channel ").concat(context.channelId));
                    return [4 /*yield*/, interaction.editReply({
                            content: "Model set for this channel and as global default:\n**".concat(context.providerName, "** / **").concat(modelDisplay, "**").concat(variantSuffix, "\n`").concat(modelId, "`\nAll channels will use this model (unless they have their own override).").concat(agentTip),
                            flags: discord_js_1.MessageFlags.SuppressEmbeds,
                            components: [],
                        })];
                case 20:
                    _b.sent();
                    return [3 /*break*/, 26];
                case 21: 
                // channel scope
                return [4 /*yield*/, (0, database_js_1.setChannelModel)({ channelId: context.channelId, modelId: modelId, variant: variant })];
                case 22:
                    // channel scope
                    _b.sent();
                    if (!context.appId) return [3 /*break*/, 24];
                    return [4 /*yield*/, (0, database_js_1.recordModelUsage)({ appId: context.appId, modelId: modelId, variant: variant })];
                case 23:
                    _b.sent();
                    _b.label = 24;
                case 24:
                    modelLogger.log("Set model ".concat(modelId).concat(variantSuffix, " for channel ").concat(context.channelId));
                    return [4 /*yield*/, interaction.editReply({
                            content: "Model preference set for this channel:\n**".concat(context.providerName, "** / **").concat(modelDisplay, "**").concat(variantSuffix, "\n`").concat(modelId, "`\nAll new sessions in this channel will use this model.").concat(agentTip),
                            flags: discord_js_1.MessageFlags.SuppressEmbeds,
                            components: [],
                        })];
                case 25:
                    _b.sent();
                    _b.label = 26;
                case 26:
                    // Clean up the context from memory
                    pendingModelContexts.delete(contextHash);
                    return [3 /*break*/, 29];
                case 27:
                    error_7 = _b.sent();
                    modelLogger.error('Error saving model preference:', error_7);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to save model preference: ".concat(error_7 instanceof Error ? error_7.message : 'Unknown error'),
                            components: [],
                        })];
                case 28:
                    _b.sent();
                    return [3 /*break*/, 29];
                case 29: return [2 /*return*/];
            }
        });
    });
}
