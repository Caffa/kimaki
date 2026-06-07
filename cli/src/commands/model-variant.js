"use strict";
// /model-variant command — quickly change the thinking level variant for the current model.
// Shows both the variant picker and scope picker in a single reply (two action rows)
// so the user can select both without waiting for sequential menus.
//
// Cross-menu state: Discord doesn't expose already-selected values on sibling
// select menus in the same message. We track partial selections in the context
// Map. Whichever menu fires second sees the first selection stored and applies.
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
exports.handleModelVariantCommand = handleModelVariantCommand;
exports.handleVariantQuickSelectMenu = handleVariantQuickSelectMenu;
exports.handleVariantScopeSelectMenu = handleVariantScopeSelectMenu;
var discord_js_1 = require("discord.js");
var node_crypto_1 = require("node:crypto");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var model_js_1 = require("./model.js");
var thread_session_runtime_js_1 = require("../session-handler/thread-session-runtime.js");
var thinking_utils_js_1 = require("../thinking-utils.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.MODEL);
var pendingVariantContexts = new Map();
/** 10 minute TTL for pending contexts to prevent unbounded map growth */
var CONTEXT_TTL_MS = 10 * 60 * 1000;
function isVariantScope(value) {
    return value === 'session' || value === 'channel' || value === 'global';
}
function formatSourceLabel(info) {
    switch (info.type) {
        case 'session':
            return 'thread override';
        case 'agent':
            return "agent \"".concat(info.agentName, "\"");
        case 'channel':
            return 'channel override';
        case 'global':
            return 'global default';
        case 'opencode-config':
        case 'opencode-recent':
        case 'opencode-provider-default':
            return 'opencode default';
        case 'none':
            return 'none';
    }
}
function handleModelVariantCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, isThread, projectDirectory, targetChannelId, sessionId, thread, _c, textChannel, threadSessionId, metadata, metadata, getClient, _d, currentModelInfo, cascadeVariant, providersResponse, providerID, modelID, fullModelId, sourceLabel, variantLabel, provider, providerName, variants, statusText, contextHash, variantOptions, variantMenu, scopeOptions, scopeMenu, variantRow, scopeRow;
        var interaction = _b.interaction, appId = _b.appId;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 1:
                    _e.sent();
                    channel = interaction.channel;
                    if (!!channel) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'This command can only be used in a channel',
                        })];
                case 2:
                    _e.sent();
                    return [2 /*return*/];
                case 3:
                    isThread = [
                        discord_js_1.ChannelType.PublicThread,
                        discord_js_1.ChannelType.PrivateThread,
                        discord_js_1.ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                    if (!isThread) return [3 /*break*/, 6];
                    thread = channel;
                    return [4 /*yield*/, Promise.all([
                            (0, discord_utils_js_1.resolveTextChannel)(thread),
                            (0, database_js_1.getThreadSession)(thread.id),
                        ])];
                case 4:
                    _c = _e.sent(), textChannel = _c[0], threadSessionId = _c[1];
                    return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(textChannel)];
                case 5:
                    metadata = _e.sent();
                    projectDirectory = metadata.projectDirectory;
                    targetChannelId = (textChannel === null || textChannel === void 0 ? void 0 : textChannel.id) || channel.id;
                    sessionId = threadSessionId;
                    return [3 /*break*/, 10];
                case 6:
                    if (!(channel.type === discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(channel)];
                case 7:
                    metadata = _e.sent();
                    projectDirectory = metadata.projectDirectory;
                    targetChannelId = channel.id;
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, interaction.editReply({
                        content: 'This command can only be used in text channels or threads',
                    })];
                case 9:
                    _e.sent();
                    return [2 /*return*/];
                case 10:
                    if (!!projectDirectory) return [3 /*break*/, 12];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'This channel is not configured with a project directory',
                        })];
                case 11:
                    _e.sent();
                    return [2 /*return*/];
                case 12: return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 13:
                    getClient = _e.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 15];
                    return [4 /*yield*/, interaction.editReply({ content: getClient.message })];
                case 14:
                    _e.sent();
                    return [2 /*return*/];
                case 15:
                    if (!(isThread && sessionId)) return [3 /*break*/, 17];
                    return [4 /*yield*/, (0, model_js_1.ensureSessionPreferencesSnapshot)({
                            sessionId: sessionId,
                            channelId: targetChannelId,
                            appId: appId,
                            getClient: getClient,
                            directory: projectDirectory,
                        })];
                case 16:
                    _e.sent();
                    _e.label = 17;
                case 17: return [4 /*yield*/, Promise.all([
                        (0, model_js_1.getCurrentModelInfo)({
                            sessionId: sessionId,
                            channelId: targetChannelId,
                            appId: appId,
                            getClient: getClient,
                            directory: projectDirectory,
                        }),
                        (0, database_js_1.getVariantCascade)({
                            sessionId: sessionId,
                            channelId: targetChannelId,
                            appId: appId,
                        }),
                        getClient().provider.list({ directory: projectDirectory }),
                    ])];
                case 18:
                    _d = _e.sent(), currentModelInfo = _d[0], cascadeVariant = _d[1], providersResponse = _d[2];
                    if (!(currentModelInfo.type === 'none')) return [3 /*break*/, 20];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No model configured. Use `/model` to set one first.',
                        })];
                case 19:
                    _e.sent();
                    return [2 /*return*/];
                case 20:
                    if (!!providersResponse.data) return [3 /*break*/, 22];
                    return [4 /*yield*/, interaction.editReply({ content: 'Failed to fetch providers' })];
                case 21:
                    _e.sent();
                    return [2 /*return*/];
                case 22:
                    providerID = currentModelInfo.providerID, modelID = currentModelInfo.modelID, fullModelId = currentModelInfo.model;
                    sourceLabel = formatSourceLabel(currentModelInfo);
                    variantLabel = cascadeVariant ? " (".concat(cascadeVariant, ")") : '';
                    provider = providersResponse.data.all.find(function (p) {
                        return p.id === providerID;
                    });
                    providerName = (provider === null || provider === void 0 ? void 0 : provider.name) || providerID;
                    variants = (0, thinking_utils_js_1.getThinkingValuesForModel)({
                        providers: providersResponse.data.all,
                        providerId: providerID,
                        modelId: modelID,
                    });
                    statusText = "**Current model:** `".concat(fullModelId, "`").concat(variantLabel, " \u2014 ").concat(sourceLabel);
                    if (!(variants.length === 0)) return [3 /*break*/, 24];
                    return [4 /*yield*/, interaction.editReply({
                            content: "".concat(statusText, "\nThis model doesn't support thinking level variants."),
                        })];
                case 23:
                    _e.sent();
                    return [2 /*return*/];
                case 24:
                    contextHash = node_crypto_1.default.randomBytes(8).toString('hex');
                    pendingVariantContexts.set(contextHash, {
                        dir: projectDirectory,
                        channelId: targetChannelId,
                        sessionId: sessionId,
                        isThread: isThread,
                        thread: isThread ? channel : undefined,
                        appId: appId,
                        modelId: fullModelId,
                        providerId: providerID,
                        modelName: modelID,
                        providerName: providerName,
                        availableVariants: variants,
                        currentVariant: cascadeVariant,
                    });
                    setTimeout(function () {
                        pendingVariantContexts.delete(contextHash);
                    }, CONTEXT_TTL_MS);
                    variantOptions = __spreadArray([
                        {
                            label: 'None (default)',
                            value: '__none__',
                            description: 'Use the model without a specific thinking level',
                            default: !cascadeVariant,
                        }
                    ], variants.slice(0, 24).map(function (v) { return ({
                        label: v.slice(0, 100),
                        value: v,
                        description: "Use ".concat(v, " thinking").slice(0, 100),
                        default: cascadeVariant === v,
                    }); }), true);
                    variantMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("variant_quick:".concat(contextHash))
                        .setPlaceholder('Select a thinking level')
                        .addOptions(variantOptions);
                    scopeOptions = __spreadArray(__spreadArray([], (isThread && sessionId
                        ? [
                            {
                                label: 'This session only',
                                value: 'session',
                                description: 'Override for this thread session only',
                            },
                        ]
                        : []), true), [
                        {
                            label: 'This channel',
                            value: 'channel',
                            description: 'Override for this channel (all new sessions)',
                        },
                        {
                            label: 'Global default',
                            value: 'global',
                            description: 'Set for this channel and as default for all others',
                        },
                    ], false);
                    scopeMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("variant_scope:".concat(contextHash))
                        .setPlaceholder('Apply to...')
                        .addOptions(scopeOptions);
                    variantRow = new discord_js_1.ActionRowBuilder().addComponents(variantMenu);
                    scopeRow = new discord_js_1.ActionRowBuilder().addComponents(scopeMenu);
                    return [4 /*yield*/, interaction.editReply({
                            content: "".concat(statusText, "\nSelect a thinking level and where to apply it:"),
                            components: [variantRow, scopeRow],
                        })];
                case 25:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle the variant quick-select interaction.
 * Stores the chosen variant in context. If scope was already picked, applies immediately.
 */
function handleVariantQuickSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var contextHash, context, selected, chosenVariant;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    contextHash = interaction.customId.replace('variant_quick:', '');
                    context = pendingVariantContexts.get(contextHash);
                    if (!!context) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Selection expired. Please run /model-variant again.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, interaction.deferUpdate()];
                case 3:
                    _a.sent();
                    selected = interaction.values[0];
                    if (!selected) {
                        return [2 /*return*/];
                    }
                    chosenVariant = selected === '__none__' ? null : selected;
                    if (!(chosenVariant !== null && !context.availableVariants.includes(chosenVariant))) return [3 /*break*/, 5];
                    pendingVariantContexts.delete(contextHash);
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Invalid variant selection. Please run /model-variant again.',
                            components: [],
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
                case 5:
                    context.selectedVariant = chosenVariant;
                    if (!context.selectedScope) return [3 /*break*/, 7];
                    return [4 /*yield*/, applyVariant({
                            interaction: interaction,
                            context: context,
                            variant: chosenVariant,
                            scope: context.selectedScope,
                            contextHash: contextHash,
                        })];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle the scope select interaction.
 * Stores the chosen scope in context. If variant was already picked, applies immediately.
 */
function handleVariantScopeSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var contextHash, context, selected;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    contextHash = interaction.customId.replace('variant_scope:', '');
                    context = pendingVariantContexts.get(contextHash);
                    if (!!context) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Selection expired. Please run /model-variant again.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, interaction.deferUpdate()];
                case 3:
                    _a.sent();
                    selected = interaction.values[0];
                    if (!selected) {
                        return [2 /*return*/];
                    }
                    if (!!isVariantScope(selected)) return [3 /*break*/, 5];
                    pendingVariantContexts.delete(contextHash);
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Invalid scope selection. Please run /model-variant again.',
                            components: [],
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
                case 5:
                    context.selectedScope = selected;
                    if (!(context.selectedVariant !== undefined)) return [3 /*break*/, 7];
                    return [4 /*yield*/, applyVariant({
                            interaction: interaction,
                            context: context,
                            variant: context.selectedVariant,
                            scope: selected,
                            contextHash: contextHash,
                        })];
                case 6:
                    _a.sent();
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
function applyVariant(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var modelId, variantSuffix, agentTip, retried, runtime, retryNote, error_1;
        var interaction = _b.interaction, context = _b.context, variant = _b.variant, scope = _b.scope, contextHash = _b.contextHash;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    modelId = context.modelId;
                    variantSuffix = variant ? " (".concat(variant, ")") : '';
                    agentTip = '\n_Tip: create [agent .md files](https://github.com/remorses/kimaki/blob/main/docs/model-switching.md) in .opencode/agent/ for one-command model switching_';
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 19, , 21]);
                    if (!(scope === 'session')) return [3 /*break*/, 9];
                    if (!!context.sessionId) return [3 /*break*/, 3];
                    pendingVariantContexts.delete(contextHash);
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No active session in this thread. Please run /model-variant in a thread with a session.',
                            components: [],
                        })];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
                case 3: return [4 /*yield*/, (0, database_js_1.setSessionModel)({
                        sessionId: context.sessionId,
                        modelId: modelId,
                        variant: variant,
                    })];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, (0, database_js_1.recordModelUsage)({ appId: context.appId, modelId: modelId, variant: variant })];
                case 5:
                    _c.sent();
                    logger.log("Set variant ".concat(variant !== null && variant !== void 0 ? variant : 'none', " for session ").concat(context.sessionId, " (model ").concat(modelId, ")"));
                    retried = false;
                    if (!context.thread) return [3 /*break*/, 7];
                    runtime = (0, thread_session_runtime_js_1.getRuntime)(context.thread.id);
                    if (!runtime) return [3 /*break*/, 7];
                    return [4 /*yield*/, runtime.retryLastUserPrompt()];
                case 6:
                    retried = _c.sent();
                    _c.label = 7;
                case 7:
                    retryNote = retried
                        ? '\n_Restarting current request with new variant..._'
                        : '';
                    return [4 /*yield*/, interaction.editReply({
                            content: "Variant set for this session:\n**".concat(context.providerName, "** / **").concat(context.modelName, "**").concat(variantSuffix, "\n`").concat(modelId, "`").concat(retryNote).concat(agentTip),
                            flags: discord_js_1.MessageFlags.SuppressEmbeds,
                            components: [],
                        })];
                case 8:
                    _c.sent();
                    return [3 /*break*/, 18];
                case 9:
                    if (!(scope === 'global')) return [3 /*break*/, 14];
                    return [4 /*yield*/, (0, database_js_1.setGlobalModel)({ appId: context.appId, modelId: modelId, variant: variant })];
                case 10:
                    _c.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelModel)({
                            channelId: context.channelId,
                            modelId: modelId,
                            variant: variant,
                        })];
                case 11:
                    _c.sent();
                    return [4 /*yield*/, (0, database_js_1.recordModelUsage)({ appId: context.appId, modelId: modelId, variant: variant })];
                case 12:
                    _c.sent();
                    logger.log("Set global variant ".concat(variant !== null && variant !== void 0 ? variant : 'none', " for app ").concat(context.appId, " and channel ").concat(context.channelId, " (model ").concat(modelId, ")"));
                    return [4 /*yield*/, interaction.editReply({
                            content: "Variant set for this channel and as global default:\n**".concat(context.providerName, "** / **").concat(context.modelName, "**").concat(variantSuffix, "\n`").concat(modelId, "`\nAll channels will use this variant (unless they have their own override).").concat(agentTip),
                            flags: discord_js_1.MessageFlags.SuppressEmbeds,
                            components: [],
                        })];
                case 13:
                    _c.sent();
                    return [3 /*break*/, 18];
                case 14: 
                // channel scope
                return [4 /*yield*/, (0, database_js_1.setChannelModel)({
                        channelId: context.channelId,
                        modelId: modelId,
                        variant: variant,
                    })];
                case 15:
                    // channel scope
                    _c.sent();
                    return [4 /*yield*/, (0, database_js_1.recordModelUsage)({ appId: context.appId, modelId: modelId, variant: variant })];
                case 16:
                    _c.sent();
                    logger.log("Set channel variant ".concat(variant !== null && variant !== void 0 ? variant : 'none', " for channel ").concat(context.channelId, " (model ").concat(modelId, ")"));
                    return [4 /*yield*/, interaction.editReply({
                            content: "Variant set for this channel:\n**".concat(context.providerName, "** / **").concat(context.modelName, "**").concat(variantSuffix, "\n`").concat(modelId, "`\nAll new sessions in this channel will use this variant.").concat(agentTip),
                            flags: discord_js_1.MessageFlags.SuppressEmbeds,
                            components: [],
                        })];
                case 17:
                    _c.sent();
                    _c.label = 18;
                case 18:
                    pendingVariantContexts.delete(contextHash);
                    return [3 /*break*/, 21];
                case 19:
                    error_1 = _c.sent();
                    logger.error('Error applying variant:', error_1);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to apply variant: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                            components: [],
                        })];
                case 20:
                    _c.sent();
                    return [3 /*break*/, 21];
                case 21: return [2 /*return*/];
            }
        });
    });
}
