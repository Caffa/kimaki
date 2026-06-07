"use strict";
// /login command — authenticate with AI providers (OAuth or API key).
//
// Uses a unified select handler (`login_select:<hash>`) for all sequential
// select menus (provider → method → plugin prompts). The context tracks a
// `step` field so one handler drives the whole flow.
//
// CustomId patterns:
//   login_select:<hash>  — all select menus (provider, method, prompts)
//   login_apikey:<hash>  — API key modal submission
//   login_text:<hash>    — text prompt modal submission
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
exports.handleLoginCommand = handleLoginCommand;
exports.handleLoginSelect = handleLoginSelect;
exports.handleLoginTextButton = handleLoginTextButton;
exports.handleLoginTextModalSubmit = handleLoginTextModalSubmit;
exports.handleLoginApiKeyButton = handleLoginApiKeyButton;
exports.handleOAuthCodeButton = handleOAuthCodeButton;
exports.handleOAuthCodeModalSubmit = handleOAuthCodeModalSubmit;
exports.handleApiKeyModalSubmit = handleApiKeyModalSubmit;
var discord_js_1 = require("discord.js");
var node_crypto_1 = require("node:crypto");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var paginated_select_js_1 = require("./paginated-select.js");
var loginLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.LOGIN);
// ── Context store ───────────────────────────────────────────────
// Keyed by random hash to stay under Discord's 100-char customId limit.
// TTL prevents unbounded growth when users open /login and never interact.
var LOGIN_CONTEXT_TTL_MS = 10 * 60 * 1000;
var pendingLoginContexts = new Map();
function createContextHash(context) {
    var hash = node_crypto_1.default.randomBytes(8).toString('hex');
    pendingLoginContexts.set(hash, context);
    setTimeout(function () {
        pendingLoginContexts.delete(hash);
    }, LOGIN_CONTEXT_TTL_MS).unref();
    return hash;
}
// ── Provider popularity order ───────────────────────────────────
// Discord select menus cap at 25 options, so we show popular ones first.
// IDs sourced from opencode's provider.list() API (scripts/list-providers.ts).
var PROVIDER_POPULARITY_ORDER = [
    'anthropic',
    'openai',
    'google',
    'github-copilot',
    'xai',
    'groq',
    'deepseek',
    'opencode',
    'opencode-go',
    'mistral',
    'openrouter',
    'fireworks-ai',
    'togetherai',
    'amazon-bedrock',
    'azure',
    'google-vertex',
    'google-vertex-anthropic',
    // 'cohere',
    'cerebras',
    // 'perplexity',
    'cloudflare-workers-ai',
    // 'novita-ai',
    // 'huggingface',
    'deepinfra',
    'github-models',
    'lmstudio',
    'llama',
];
// ── Helpers ─────────────────────────────────────────────────────
function extractErrorMessage(_a) {
    var _b;
    var error = _a.error, fallback = _a.fallback;
    if (!error || typeof error !== 'object') {
        return fallback;
    }
    var parsed = error;
    return ((_b = parsed.data) === null || _b === void 0 ? void 0 : _b.message) || parsed.message || fallback;
}
function shouldShowPrompt(prompt, inputs) {
    if (!prompt.when) {
        return true;
    }
    var value = inputs[prompt.when.key];
    if (prompt.when.op === 'eq') {
        return value === prompt.when.value;
    }
    if (prompt.when.op === 'neq') {
        return value !== prompt.when.value;
    }
    return true;
}
function buildSelectMenu(_a) {
    var customId = _a.customId, placeholder = _a.placeholder, options = _a.options;
    var menu = new discord_js_1.StringSelectMenuBuilder()
        .setCustomId(customId)
        .setPlaceholder(placeholder)
        .addOptions(options);
    return new discord_js_1.ActionRowBuilder().addComponents(menu);
}
// ── /login command ──────────────────────────────────────────────
function handleLoginCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var deferError_1, replyError_1, channel, isThread, projectDirectory, targetChannelId, thread, textChannel, metadata, metadata, getClient, providersResponse, _c, allProviders, connected_1, allProviderOptions, options, context, hash, error_1;
        var interaction = _b.interaction;
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
                    loginLogger.error('[LOGIN] deferReply failed:', deferError_1);
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, interaction.reply({
                            content: 'Could not start login. Please try again.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 4:
                    _d.sent();
                    return [3 /*break*/, 6];
                case 5:
                    replyError_1 = _d.sent();
                    loginLogger.error('[LOGIN] Both deferReply and reply failed:', replyError_1);
                    return [2 /*return*/];
                case 6: return [2 /*return*/];
                case 7:
                    loginLogger.log('[LOGIN] handleLoginCommand called');
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
                    if (!isThread) return [3 /*break*/, 12];
                    thread = channel;
                    return [4 /*yield*/, (0, discord_utils_js_1.resolveTextChannel)(thread)];
                case 10:
                    textChannel = _d.sent();
                    return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(textChannel)];
                case 11:
                    metadata = _d.sent();
                    projectDirectory = metadata.projectDirectory;
                    targetChannelId = (textChannel === null || textChannel === void 0 ? void 0 : textChannel.id) || channel.id;
                    return [3 /*break*/, 16];
                case 12:
                    if (!(channel.type === discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 14];
                    return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(channel)];
                case 13:
                    metadata = _d.sent();
                    projectDirectory = metadata.projectDirectory;
                    targetChannelId = channel.id;
                    return [3 /*break*/, 16];
                case 14: return [4 /*yield*/, interaction.editReply({
                        content: 'This command can only be used in text channels or threads',
                    })];
                case 15:
                    _d.sent();
                    return [2 /*return*/];
                case 16:
                    if (!!projectDirectory) return [3 /*break*/, 18];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'This channel is not configured with a project directory',
                        })];
                case 17:
                    _d.sent();
                    return [2 /*return*/];
                case 18:
                    _d.trys.push([18, 28, , 30]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 19:
                    getClient = _d.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 21];
                    return [4 /*yield*/, interaction.editReply({ content: getClient.message })];
                case 20:
                    _d.sent();
                    return [2 /*return*/];
                case 21: return [4 /*yield*/, getClient().provider.list({
                        directory: projectDirectory,
                    })];
                case 22:
                    providersResponse = _d.sent();
                    if (!!providersResponse.data) return [3 /*break*/, 24];
                    return [4 /*yield*/, interaction.editReply({ content: 'Failed to fetch providers' })];
                case 23:
                    _d.sent();
                    return [2 /*return*/];
                case 24:
                    _c = providersResponse.data, allProviders = _c.all, connected_1 = _c.connected;
                    if (!(allProviders.length === 0)) return [3 /*break*/, 26];
                    return [4 /*yield*/, interaction.editReply({ content: 'No providers available.' })];
                case 25:
                    _d.sent();
                    return [2 /*return*/];
                case 26:
                    allProviderOptions = __spreadArray([], allProviders, true).sort(function (a, b) {
                        var rankA = PROVIDER_POPULARITY_ORDER.indexOf(a.id);
                        var rankB = PROVIDER_POPULARITY_ORDER.indexOf(b.id);
                        var posA = rankA === -1 ? Infinity : rankA;
                        var posB = rankB === -1 ? Infinity : rankB;
                        if (posA !== posB) {
                            return posA - posB;
                        }
                        return a.name.localeCompare(b.name);
                    })
                        .map(function (provider) {
                        var isConnected = connected_1.includes(provider.id);
                        return {
                            label: "".concat(provider.name).concat(isConnected ? ' ✓' : '').slice(0, 100),
                            value: provider.id,
                            description: isConnected
                                ? 'Connected - select to re-authenticate'
                                : 'Not connected',
                        };
                    });
                    options = (0, paginated_select_js_1.buildPaginatedOptions)({
                        allOptions: allProviderOptions,
                        page: 0,
                    }).options;
                    context = {
                        dir: projectDirectory,
                        channelId: targetChannelId,
                        steps: [{ type: 'provider' }],
                        stepIndex: 0,
                        inputs: {},
                    };
                    hash = createContextHash(context);
                    return [4 /*yield*/, interaction.editReply({
                            content: '**Authenticate with Provider**\nSelect a provider:',
                            components: [
                                buildSelectMenu({
                                    customId: "login_select:".concat(hash),
                                    placeholder: 'Select a provider to authenticate',
                                    options: options,
                                }),
                            ],
                        })];
                case 27:
                    _d.sent();
                    return [3 /*break*/, 30];
                case 28:
                    error_1 = _d.sent();
                    loginLogger.error('Error loading providers:', error_1);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to load providers: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                        })];
                case 29:
                    _d.sent();
                    return [3 /*break*/, 30];
                case 30: return [2 /*return*/];
            }
        });
    });
}
// ── Unified select handler ──────────────────────────────────────
// Handles all select menu interactions for the login flow.
// Reads the current step from context, processes the answer,
// then either shows the next step or proceeds to authorize/API key.
function handleLoginSelect(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var hash, ctx, value, step, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!interaction.customId.startsWith('login_select:')) {
                        return [2 /*return*/];
                    }
                    hash = interaction.customId.replace('login_select:', '');
                    ctx = pendingLoginContexts.get(hash);
                    if (!!ctx) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Selection expired. Please run /login again.',
                            components: [],
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
                case 3:
                    value = interaction.values[0];
                    if (!!value) return [3 /*break*/, 6];
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No option selected.',
                            components: [],
                        })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
                case 6:
                    step = ctx.steps[ctx.stepIndex];
                    if (!!step) return [3 /*break*/, 9];
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Invalid state. Please run /login again.',
                            components: [],
                        })];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
                case 9:
                    _a.trys.push([9, 16, , 20]);
                    if (!(step.type === 'provider')) return [3 /*break*/, 11];
                    return [4 /*yield*/, handleProviderStep(interaction, ctx, hash, value)];
                case 10:
                    _a.sent();
                    return [3 /*break*/, 15];
                case 11:
                    if (!(step.type === 'method')) return [3 /*break*/, 13];
                    return [4 /*yield*/, handleMethodStep(interaction, ctx, hash, value, step)];
                case 12:
                    _a.sent();
                    return [3 /*break*/, 15];
                case 13:
                    if (!(step.type === 'prompt')) return [3 /*break*/, 15];
                    return [4 /*yield*/, handlePromptStep(interaction, ctx, hash, value, step)];
                case 14:
                    _a.sent();
                    _a.label = 15;
                case 15: return [3 /*break*/, 20];
                case 16:
                    error_2 = _a.sent();
                    loginLogger.error('Error in login select:', error_2);
                    if (!(!interaction.deferred && !interaction.replied)) return [3 /*break*/, 18];
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 17:
                    _a.sent();
                    _a.label = 18;
                case 18: return [4 /*yield*/, interaction.editReply({
                        content: "Login error: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'),
                        components: [],
                    })];
                case 19:
                    _a.sent();
                    return [3 /*break*/, 20];
                case 20: return [2 /*return*/];
            }
        });
    });
}
// ── Step handlers ───────────────────────────────────────────────
function handleProviderStep(interaction, ctx, hash, providerId) {
    return __awaiter(this, void 0, void 0, function () {
        var navPage, getClient_1, providersResponse_1, _a, allProviders, connected_2, allProviderOptions, options, getClient, providersResponse, provider, providerName, authResponse, methods, method, promptSteps;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    navPage = (0, paginated_select_js_1.parsePaginationValue)(providerId);
                    if (!(navPage !== undefined)) return [3 /*break*/, 9];
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    _c.sent();
                    ctx.providerPage = navPage;
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(ctx.dir)];
                case 2:
                    getClient_1 = _c.sent();
                    if (!(getClient_1 instanceof Error)) return [3 /*break*/, 4];
                    return [4 /*yield*/, interaction.editReply({ content: getClient_1.message, components: [] })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, getClient_1().provider.list({ directory: ctx.dir })];
                case 5:
                    providersResponse_1 = _c.sent();
                    if (!!providersResponse_1.data) return [3 /*break*/, 7];
                    return [4 /*yield*/, interaction.editReply({ content: 'Failed to fetch providers', components: [] })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7:
                    _a = providersResponse_1.data, allProviders = _a.all, connected_2 = _a.connected;
                    allProviderOptions = __spreadArray([], allProviders, true).sort(function (a, b) {
                        var rankA = PROVIDER_POPULARITY_ORDER.indexOf(a.id);
                        var rankB = PROVIDER_POPULARITY_ORDER.indexOf(b.id);
                        var posA = rankA === -1 ? Infinity : rankA;
                        var posB = rankB === -1 ? Infinity : rankB;
                        if (posA !== posB) {
                            return posA - posB;
                        }
                        return a.name.localeCompare(b.name);
                    })
                        .map(function (p) {
                        var isConnected = connected_2.includes(p.id);
                        return {
                            label: "".concat(p.name).concat(isConnected ? ' ✓' : '').slice(0, 100),
                            value: p.id,
                            description: isConnected ? 'Connected - select to re-authenticate' : 'Not connected',
                        };
                    });
                    options = (0, paginated_select_js_1.buildPaginatedOptions)({ allOptions: allProviderOptions, page: navPage }).options;
                    return [4 /*yield*/, interaction.editReply({
                            content: '**Authenticate with Provider**\nSelect a provider:',
                            components: [
                                buildSelectMenu({
                                    customId: "login_select:".concat(hash),
                                    placeholder: 'Select a provider to authenticate',
                                    options: options,
                                }),
                            ],
                        })];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
                case 9: return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(ctx.dir)];
                case 10:
                    getClient = _c.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 13];
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 11:
                    _c.sent();
                    return [4 /*yield*/, interaction.editReply({ content: getClient.message, components: [] })];
                case 12:
                    _c.sent();
                    return [2 /*return*/];
                case 13: return [4 /*yield*/, getClient().provider.list({
                        directory: ctx.dir,
                    })];
                case 14:
                    providersResponse = _c.sent();
                    provider = (_b = providersResponse.data) === null || _b === void 0 ? void 0 : _b.all.find(function (p) { return p.id === providerId; });
                    providerName = (provider === null || provider === void 0 ? void 0 : provider.name) || providerId;
                    return [4 /*yield*/, getClient().provider.auth({ directory: ctx.dir })];
                case 15:
                    authResponse = _c.sent();
                    if (!!authResponse.data) return [3 /*break*/, 18];
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 16:
                    _c.sent();
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Failed to fetch authentication methods',
                            components: [],
                        })];
                case 17:
                    _c.sent();
                    return [2 /*return*/];
                case 18:
                    methods = authResponse.data[providerId] || [
                        { type: 'api', label: 'API Key' },
                    ];
                    if (!(methods.length === 0)) return [3 /*break*/, 21];
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 19:
                    _c.sent();
                    return [4 /*yield*/, interaction.editReply({
                            content: "No authentication methods available for ".concat(providerName),
                            components: [],
                        })];
                case 20:
                    _c.sent();
                    return [2 /*return*/];
                case 21:
                    ctx.providerId = providerId;
                    ctx.providerName = providerName;
                    if (!(methods.length === 1)) return [3 /*break*/, 30];
                    method = methods[0];
                    ctx.methodIndex = 0;
                    ctx.methodType = method.type;
                    promptSteps = buildPromptSteps(method);
                    if (!(promptSteps.length > 0)) return [3 /*break*/, 24];
                    // Has prompts — defer and show first prompt
                    ctx.steps = promptSteps;
                    ctx.stepIndex = 0;
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 22:
                    _c.sent();
                    return [4 /*yield*/, showNextStep(interaction, ctx, hash)];
                case 23:
                    _c.sent();
                    return [3 /*break*/, 29];
                case 24:
                    if (!(method.type === 'api')) return [3 /*break*/, 26];
                    // API key with no prompts — show modal directly (don't defer)
                    return [4 /*yield*/, showApiKeyModal(interaction, hash, providerName)];
                case 25:
                    // API key with no prompts — show modal directly (don't defer)
                    _c.sent();
                    return [3 /*break*/, 29];
                case 26: 
                // OAuth with no prompts — defer and authorize
                return [4 /*yield*/, interaction.deferUpdate()];
                case 27:
                    // OAuth with no prompts — defer and authorize
                    _c.sent();
                    return [4 /*yield*/, startOAuthFlow(interaction, ctx, hash)];
                case 28:
                    _c.sent();
                    _c.label = 29;
                case 29: return [2 /*return*/];
                case 30:
                    // Multiple methods — show method select
                    ctx.steps = [
                        { type: 'method', methods: methods },
                    ];
                    ctx.stepIndex = 0;
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 31:
                    _c.sent();
                    return [4 /*yield*/, showNextStep(interaction, ctx, hash)];
                case 32:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleMethodStep(interaction, ctx, hash, value, step) {
    return __awaiter(this, void 0, void 0, function () {
        var methodIndex, method, promptSteps;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    methodIndex = parseInt(value, 10);
                    method = step.methods[methodIndex];
                    if (!!method) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Invalid method selected.',
                            components: [],
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
                case 3:
                    ctx.methodIndex = methodIndex;
                    ctx.methodType = method.type;
                    promptSteps = buildPromptSteps(method);
                    if (!(promptSteps.length > 0)) return [3 /*break*/, 6];
                    // Replace remaining steps with prompt steps
                    ctx.steps = promptSteps;
                    ctx.stepIndex = 0;
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, showNextStep(interaction, ctx, hash)];
                case 5:
                    _a.sent();
                    return [3 /*break*/, 11];
                case 6:
                    if (!(method.type === 'api')) return [3 /*break*/, 8];
                    // API key with no prompts — show modal directly (don't defer)
                    return [4 /*yield*/, showApiKeyModal(interaction, hash, ctx.providerName || '')];
                case 7:
                    // API key with no prompts — show modal directly (don't defer)
                    _a.sent();
                    return [3 /*break*/, 11];
                case 8: 
                // OAuth with no prompts
                return [4 /*yield*/, interaction.deferUpdate()];
                case 9:
                    // OAuth with no prompts
                    _a.sent();
                    return [4 /*yield*/, startOAuthFlow(interaction, ctx, hash)];
                case 10:
                    _a.sent();
                    _a.label = 11;
                case 11: return [2 /*return*/];
            }
        });
    });
}
function handlePromptStep(interaction, ctx, hash, value, step) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Store the answer
                    ctx.inputs[step.prompt.key] = value;
                    ctx.stepIndex++;
                    // Find the next prompt step that passes its `when` condition
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    // Find the next prompt step that passes its `when` condition
                    _a.sent();
                    return [4 /*yield*/, showNextStep(interaction, ctx, hash)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// ── Step rendering ──────────────────────────────────────────────
// Advances through steps, skipping prompts whose `when` condition
// fails, until it finds one to show or reaches the end.
function showNextStep(interaction, ctx, hash) {
    return __awaiter(this, void 0, void 0, function () {
        var step_1, button, step, options, prompt_1, options, button;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // Skip prompts whose `when` condition doesn't match
                    while (ctx.stepIndex < ctx.steps.length) {
                        step_1 = ctx.steps[ctx.stepIndex];
                        if (step_1.type === 'prompt' && !shouldShowPrompt(step_1.prompt, ctx.inputs)) {
                            ctx.stepIndex++;
                            continue;
                        }
                        break;
                    }
                    if (!(ctx.stepIndex >= ctx.steps.length)) return [3 /*break*/, 5];
                    if (!(ctx.methodType === 'api')) return [3 /*break*/, 2];
                    button = new discord_js_1.ButtonBuilder()
                        .setCustomId("login_apikey_btn:".concat(hash))
                        .setLabel('Enter API Key')
                        .setStyle(discord_js_1.ButtonStyle.Primary);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Authenticate with ".concat(ctx.providerName, "**\nClick to enter your API key."),
                            components: [
                                new discord_js_1.ActionRowBuilder().addComponents(button),
                            ],
                        })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, startOAuthFlow(interaction, ctx, hash)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/];
                case 5:
                    step = ctx.steps[ctx.stepIndex];
                    pendingLoginContexts.set(hash, ctx);
                    if (!(step.type === 'method')) return [3 /*break*/, 7];
                    options = step.methods.slice(0, 25).map(function (method, index) { return ({
                        label: method.label.slice(0, 100),
                        value: String(index),
                        description: method.type === 'oauth'
                            ? 'OAuth authentication'
                            : 'Enter API key manually',
                    }); });
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Authenticate with ".concat(ctx.providerName, "**\nSelect authentication method:"),
                            components: [
                                buildSelectMenu({
                                    customId: "login_select:".concat(hash),
                                    placeholder: 'Select authentication method',
                                    options: options,
                                }),
                            ],
                        })];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
                case 7:
                    if (!(step.type === 'prompt')) return [3 /*break*/, 11];
                    prompt_1 = step.prompt;
                    if (!(prompt_1.type === 'select')) return [3 /*break*/, 9];
                    options = prompt_1.options.slice(0, 25).map(function (opt) {
                        var _a;
                        return ({
                            label: opt.label.slice(0, 100),
                            value: opt.value,
                            description: (_a = opt.hint) === null || _a === void 0 ? void 0 : _a.slice(0, 100),
                        });
                    });
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Authenticate with ".concat(ctx.providerName, "**\n").concat(prompt_1.message),
                            components: [
                                buildSelectMenu({
                                    customId: "login_select:".concat(hash),
                                    placeholder: prompt_1.message.slice(0, 150),
                                    options: options,
                                }),
                            ],
                        })];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
                case 9:
                    if (!(prompt_1.type === 'text')) return [3 /*break*/, 11];
                    button = new discord_js_1.ButtonBuilder()
                        .setCustomId("login_text_btn:".concat(hash))
                        .setLabel(prompt_1.message.slice(0, 80))
                        .setStyle(discord_js_1.ButtonStyle.Primary);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Authenticate with ".concat(ctx.providerName, "**\n").concat(prompt_1.message),
                            components: [
                                new discord_js_1.ActionRowBuilder().addComponents(button),
                            ],
                        })];
                case 10:
                    _a.sent();
                    return [2 /*return*/];
                case 11: return [2 /*return*/];
            }
        });
    });
}
function buildPromptSteps(method) {
    return (method.prompts || []).map(function (prompt) { return ({
        type: 'prompt',
        prompt: prompt,
    }); });
}
// ── Text prompt button + modal ──────────────────────────────────
// When a text prompt needs to be shown but we're in a deferred state,
// we show a button. Clicking it opens a modal for text input.
function handleLoginTextButton(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var hash, ctx, step, modal, textInput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!interaction.customId.startsWith('login_text_btn:')) {
                        return [2 /*return*/];
                    }
                    hash = interaction.customId.replace('login_text_btn:', '');
                    ctx = pendingLoginContexts.get(hash);
                    if (!!ctx) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Selection expired. Please run /login again.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2:
                    step = ctx.steps[ctx.stepIndex];
                    if (!(!step || step.type !== 'prompt' || step.prompt.type !== 'text')) return [3 /*break*/, 4];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Invalid state. Please run /login again.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
                case 4:
                    modal = new discord_js_1.ModalBuilder()
                        .setCustomId("login_text:".concat(hash))
                        .setTitle("".concat(ctx.providerName || 'Provider', " Login").slice(0, 45));
                    textInput = new discord_js_1.TextInputBuilder()
                        .setCustomId('prompt_value')
                        .setLabel(step.prompt.message.slice(0, 45))
                        .setPlaceholder(step.prompt.type === 'text' ? (step.prompt.placeholder || '') : '')
                        .setStyle(discord_js_1.TextInputStyle.Short)
                        .setRequired(true);
                    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(textInput));
                    return [4 /*yield*/, interaction.showModal(modal)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleLoginTextModalSubmit(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var hash, ctx, step, value;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!interaction.customId.startsWith('login_text:')) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    _a.sent();
                    hash = interaction.customId.replace('login_text:', '');
                    ctx = pendingLoginContexts.get(hash);
                    if (!!ctx) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Selection expired. Please run /login again.',
                            components: [],
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
                case 3:
                    step = ctx.steps[ctx.stepIndex];
                    if (!(!step || step.type !== 'prompt' || step.prompt.type !== 'text')) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Invalid state. Please run /login again.',
                            components: [],
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
                case 5:
                    value = interaction.fields.getTextInputValue('prompt_value');
                    if (!!(value === null || value === void 0 ? void 0 : value.trim())) return [3 /*break*/, 7];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'A value is required.',
                            components: [],
                        })];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
                case 7:
                    ctx.inputs[step.prompt.key] = value.trim();
                    ctx.stepIndex++;
                    return [4 /*yield*/, showNextStep(interaction, ctx, hash)];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// ── API key button + modal ──────────────────────────────────────
// When we're deferred and need an API key modal, show a button first.
function handleLoginApiKeyButton(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var hash, ctx;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!interaction.customId.startsWith('login_apikey_btn:')) {
                        return [2 /*return*/];
                    }
                    hash = interaction.customId.replace('login_apikey_btn:', '');
                    ctx = pendingLoginContexts.get(hash);
                    if (!(!ctx || !ctx.providerName)) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Selection expired. Please run /login again.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, showApiKeyModal(interaction, hash, ctx.providerName)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function showApiKeyModal(interaction, hash, providerName) {
    return __awaiter(this, void 0, void 0, function () {
        var modal, apiKeyInput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    modal = new discord_js_1.ModalBuilder()
                        .setCustomId("login_apikey:".concat(hash))
                        .setTitle("".concat(providerName, " API Key").slice(0, 45));
                    apiKeyInput = new discord_js_1.TextInputBuilder()
                        .setCustomId('apikey')
                        .setLabel('API Key')
                        .setPlaceholder('sk-...')
                        .setStyle(discord_js_1.TextInputStyle.Short)
                        .setRequired(true);
                    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(apiKeyInput));
                    return [4 /*yield*/, interaction.showModal(modal)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// ── OAuth code submission (code mode) ───────────────────────────
// When the OAuth flow returns method="code", the user completes login
// in a browser (possibly on a different machine) and pastes the final
// callback URL or authorization code here.
function handleOAuthCodeButton(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var hash, ctx, modal, codeInput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!interaction.customId.startsWith('login_oauth_code_btn:')) {
                        return [2 /*return*/];
                    }
                    hash = interaction.customId.replace('login_oauth_code_btn:', '');
                    ctx = pendingLoginContexts.get(hash);
                    if (!(!ctx || !ctx.providerId || !ctx.providerName)) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Selection expired. Please run /login again.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2:
                    modal = new discord_js_1.ModalBuilder()
                        .setCustomId("login_oauth_code:".concat(hash))
                        .setTitle("".concat(ctx.providerName, " Authorization").slice(0, 45));
                    codeInput = new discord_js_1.TextInputBuilder()
                        .setCustomId('oauth_code')
                        .setLabel('Authorization code or callback URL')
                        .setPlaceholder('Paste the code or full callback URL')
                        .setStyle(discord_js_1.TextInputStyle.Paragraph)
                        .setRequired(true);
                    modal.addComponents(new discord_js_1.ActionRowBuilder().addComponents(codeInput));
                    return [4 /*yield*/, interaction.showModal(modal)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function handleOAuthCodeModalSubmit(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var hash, ctx, code, getClient, callbackResponse, error_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!interaction.customId.startsWith('login_oauth_code:')) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    _b.sent();
                    hash = interaction.customId.replace('login_oauth_code:', '');
                    ctx = pendingLoginContexts.get(hash);
                    if (!(!ctx || !ctx.providerId || !ctx.providerName || ctx.methodIndex === undefined)) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Session expired. Please run /login again.',
                            components: [],
                        })];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
                case 3:
                    code = (_a = interaction.fields.getTextInputValue('oauth_code')) === null || _a === void 0 ? void 0 : _a.trim();
                    if (!!code) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Authorization code is required.',
                            components: [],
                        })];
                case 4:
                    _b.sent();
                    return [2 /*return*/];
                case 5:
                    _b.trys.push([5, 15, , 17]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(ctx.dir)];
                case 6:
                    getClient = _b.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 8];
                    return [4 /*yield*/, interaction.editReply({
                            content: getClient.message,
                            components: [],
                        })];
                case 7:
                    _b.sent();
                    return [2 /*return*/];
                case 8: return [4 /*yield*/, interaction.editReply({
                        content: "**Authenticating with ".concat(ctx.providerName, "**\nVerifying authorization..."),
                        components: [],
                    })];
                case 9:
                    _b.sent();
                    return [4 /*yield*/, getClient().provider.oauth.callback({
                            providerID: ctx.providerId,
                            method: ctx.methodIndex,
                            code: code,
                            directory: ctx.dir,
                        })];
                case 10:
                    callbackResponse = _b.sent();
                    if (!callbackResponse.error) return [3 /*break*/, 12];
                    pendingLoginContexts.delete(hash);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Authentication Failed**\n".concat(extractErrorMessage({ error: callbackResponse.error, fallback: 'Authorization code was invalid or expired' })),
                            components: [],
                        })];
                case 11:
                    _b.sent();
                    return [2 /*return*/];
                case 12: return [4 /*yield*/, getClient().instance.dispose({ directory: ctx.dir })];
                case 13:
                    _b.sent();
                    pendingLoginContexts.delete(hash);
                    return [4 /*yield*/, interaction.editReply({
                            content: "\u2705 **Successfully authenticated with ".concat(ctx.providerName, "!**\n\nYou can now use models from this provider."),
                            components: [],
                        })];
                case 14:
                    _b.sent();
                    return [3 /*break*/, 17];
                case 15:
                    error_3 = _b.sent();
                    loginLogger.error('OAuth code submission error:', error_3);
                    pendingLoginContexts.delete(hash);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Authentication Failed**\n".concat(error_3 instanceof Error ? error_3.message : 'Unknown error'),
                            components: [],
                        })];
                case 16:
                    _b.sent();
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/];
            }
        });
    });
}
function handleApiKeyModalSubmit(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var hash, ctx, apiKey, getClient, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!interaction.customId.startsWith('login_apikey:')) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 1:
                    _a.sent();
                    hash = interaction.customId.replace('login_apikey:', '');
                    ctx = pendingLoginContexts.get(hash);
                    if (!(!ctx || !ctx.providerId || !ctx.providerName)) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Session expired. Please run /login again.',
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
                case 3:
                    apiKey = interaction.fields.getTextInputValue('apikey');
                    if (!!(apiKey === null || apiKey === void 0 ? void 0 : apiKey.trim())) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({ content: 'API key is required.' })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
                case 5:
                    _a.trys.push([5, 12, , 14]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(ctx.dir)];
                case 6:
                    getClient = _a.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 8];
                    return [4 /*yield*/, interaction.editReply({ content: getClient.message })];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
                case 8: return [4 /*yield*/, getClient().auth.set({
                        providerID: ctx.providerId,
                        auth: { type: 'api', key: apiKey.trim() },
                    })
                    // Dispose to refresh provider state so new credentials are recognized
                ];
                case 9:
                    _a.sent();
                    // Dispose to refresh provider state so new credentials are recognized
                    return [4 /*yield*/, getClient().instance.dispose({ directory: ctx.dir })];
                case 10:
                    // Dispose to refresh provider state so new credentials are recognized
                    _a.sent();
                    return [4 /*yield*/, interaction.editReply({
                            content: "\u2705 **Successfully authenticated with ".concat(ctx.providerName, "!**\n\nYou can now use models from this provider."),
                        })];
                case 11:
                    _a.sent();
                    pendingLoginContexts.delete(hash);
                    return [3 /*break*/, 14];
                case 12:
                    error_4 = _a.sent();
                    loginLogger.error('API key save error:', error_4);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Failed to save API key**\n".concat(error_4 instanceof Error ? error_4.message : 'Unknown error'),
                        })];
                case 13:
                    _a.sent();
                    return [3 /*break*/, 14];
                case 14: return [2 /*return*/];
            }
        });
    });
}
// ── OAuth flow ──────────────────────────────────────────────────
function startOAuthFlow(interaction, ctx, hash) {
    return __awaiter(this, void 0, void 0, function () {
        var getClient, port, hasInputs, authorizeUrl, fetchHeaders, serverPassword, username, authorizeRes, errorText, errorMessage, parsed, loginData, url, method, instructions, message, codeMatch, button, callbackResponse, error_5;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(!ctx.providerId || ctx.methodIndex === undefined)) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Invalid context for OAuth flow',
                            components: [],
                        })];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
                case 2:
                    _b.trys.push([2, 24, , 26]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(ctx.dir)];
                case 3:
                    getClient = _b.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({
                            content: getClient.message,
                            components: [],
                        })];
                case 4:
                    _b.sent();
                    return [2 /*return*/];
                case 5: return [4 /*yield*/, interaction.editReply({
                        content: "**Authenticating with ".concat(ctx.providerName, "**\nStarting authorization..."),
                        components: [],
                    })
                    // Direct fetch to the server because the SDK's buildClientParams drops
                    // unknown keys — `inputs` would be silently stripped. The server accepts
                    // `inputs` in the body (see opencode server/routes/provider.ts).
                ];
                case 6:
                    _b.sent();
                    port = (0, opencode_js_1.getOpencodeServerPort)();
                    if (!!port) return [3 /*break*/, 8];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'OpenCode server is not running. Please try again.',
                            components: [],
                        })];
                case 7:
                    _b.sent();
                    return [2 /*return*/];
                case 8:
                    hasInputs = Object.keys(ctx.inputs).length > 0;
                    authorizeUrl = new URL("/provider/".concat(encodeURIComponent(ctx.providerId), "/oauth/authorize"), "http://127.0.0.1:".concat(port));
                    authorizeUrl.searchParams.set('directory', ctx.dir);
                    fetchHeaders = {
                        'Content-Type': 'application/json',
                        'x-opencode-directory': ctx.dir,
                    };
                    serverPassword = process.env.OPENCODE_SERVER_PASSWORD;
                    if (serverPassword) {
                        username = process.env.OPENCODE_SERVER_USERNAME || 'opencode';
                        fetchHeaders['Authorization'] =
                            "Basic ".concat(Buffer.from("".concat(username, ":").concat(serverPassword)).toString('base64'));
                    }
                    return [4 /*yield*/, fetch(authorizeUrl, {
                            method: 'POST',
                            headers: fetchHeaders,
                            body: JSON.stringify(__assign({ method: ctx.methodIndex }, (hasInputs ? { inputs: ctx.inputs } : {}))),
                        })];
                case 9:
                    authorizeRes = _b.sent();
                    if (!!authorizeRes.ok) return [3 /*break*/, 12];
                    return [4 /*yield*/, authorizeRes.text().catch(function () { return ''; })];
                case 10:
                    errorText = _b.sent();
                    errorMessage = 'Unknown error';
                    try {
                        parsed = JSON.parse(errorText);
                        errorMessage = ((_a = parsed === null || parsed === void 0 ? void 0 : parsed.data) === null || _a === void 0 ? void 0 : _a.message) || (parsed === null || parsed === void 0 ? void 0 : parsed.message) || errorMessage;
                    }
                    catch (_c) {
                        errorMessage = errorText || errorMessage;
                    }
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to start authorization: ".concat(errorMessage),
                            components: [],
                        })];
                case 11:
                    _b.sent();
                    return [2 /*return*/];
                case 12: return [4 /*yield*/, authorizeRes.json()];
                case 13:
                    loginData = (_b.sent());
                    if (!!loginData) return [3 /*break*/, 15];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Failed to parse authorization response',
                            components: [],
                        })];
                case 14:
                    _b.sent();
                    return [2 /*return*/];
                case 15:
                    url = loginData.url, method = loginData.method, instructions = loginData.instructions;
                    message = "**Authenticating with ".concat(ctx.providerName, "**\n\n");
                    message += "Open this URL to authorize:\n".concat(url, "\n\n");
                    if (instructions) {
                        codeMatch = instructions.match(/code:\s*([A-Z0-9][A-Z0-9-]+)/);
                        if (codeMatch) {
                            message += "**Code:** `".concat(codeMatch[1], "`\n\n");
                        }
                        else {
                            message += "".concat(instructions, "\n\n");
                        }
                    }
                    if (method === 'auto') {
                        message += '_Waiting for authorization to complete..._';
                    }
                    if (!(method === 'code')) return [3 /*break*/, 17];
                    button = new discord_js_1.ButtonBuilder()
                        .setCustomId("login_oauth_code_btn:".concat(hash))
                        .setLabel('Paste authorization code')
                        .setStyle(discord_js_1.ButtonStyle.Primary);
                    return [4 /*yield*/, interaction.editReply({
                            content: message,
                            components: [
                                new discord_js_1.ActionRowBuilder().addComponents(button),
                            ],
                        })
                        // Don't delete context — we need it for the code submission
                    ];
                case 16:
                    _b.sent();
                    // Don't delete context — we need it for the code submission
                    return [2 /*return*/];
                case 17: return [4 /*yield*/, interaction.editReply({ content: message, components: [] })
                    // Auto mode: poll for completion (device flow / localhost callback)
                ];
                case 18:
                    _b.sent();
                    return [4 /*yield*/, getClient().provider.oauth.callback({
                            providerID: ctx.providerId,
                            method: ctx.methodIndex,
                            directory: ctx.dir,
                        })];
                case 19:
                    callbackResponse = _b.sent();
                    if (!callbackResponse.error) return [3 /*break*/, 21];
                    pendingLoginContexts.delete(hash);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Authentication Failed**\n".concat(extractErrorMessage({ error: callbackResponse.error, fallback: 'Authorization was not completed' })),
                            components: [],
                        })];
                case 20:
                    _b.sent();
                    return [2 /*return*/];
                case 21: return [4 /*yield*/, getClient().instance.dispose({ directory: ctx.dir })];
                case 22:
                    _b.sent();
                    pendingLoginContexts.delete(hash);
                    return [4 /*yield*/, interaction.editReply({
                            content: "\u2705 **Successfully authenticated with ".concat(ctx.providerName, "!**\n\nYou can now use models from this provider."),
                            components: [],
                        })];
                case 23:
                    _b.sent();
                    return [3 /*break*/, 26];
                case 24:
                    error_5 = _b.sent();
                    loginLogger.error('OAuth flow error:', error_5);
                    pendingLoginContexts.delete(hash);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Authentication Failed**\n".concat(error_5 instanceof Error ? error_5.message : 'Unknown error'),
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
