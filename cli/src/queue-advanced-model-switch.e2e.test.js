"use strict";
// E2e test for /model switch behavior through interrupt recovery.
// Reproduces fallback where interrupt plugin resume can run without model,
// causing default opencode.json model to be used after switching session model.
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
var vitest_1 = require("vitest");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var queue_advanced_e2e_setup_js_1 = require("./queue-advanced-e2e-setup.js");
var test_utils_js_1 = require("./test-utils.js");
var thread_runtime_state_js_1 = require("./session-handler/thread-runtime-state.js");
var database_js_1 = require("./database.js");
var opencode_js_1 = require("./opencode.js");
var TEXT_CHANNEL_ID = '200000000000001007';
function getCustomIdFromInteractionData(_a) {
    var serializedComponents = _a.serializedComponents, prefix = _a.prefix;
    var escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var customIdRegex = new RegExp("\"custom_id\"\\s*:\\s*\"(".concat(escapedPrefix, "[^\"]+)\""));
    var match = serializedComponents.match(customIdRegex);
    if (!(match === null || match === void 0 ? void 0 : match[1])) {
        throw new Error("Could not find custom_id with prefix ".concat(prefix, " in components: ").concat(serializedComponents));
    }
    return match[1];
}
function waitForMessageComponentsWithCustomId(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, message, serializedComponents;
        var discord = _b.discord, threadId = _b.threadId, messageId = _b.messageId, customIdPrefix = _b.customIdPrefix, timeoutMs = _b.timeoutMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < timeoutMs)) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, test_utils_js_1.waitForMessageById)({
                            discord: discord,
                            threadId: threadId,
                            messageId: messageId,
                            timeout: 1000,
                        })];
                case 2:
                    message = _c.sent();
                    serializedComponents = JSON.stringify(message.components);
                    if (serializedComponents.includes(customIdPrefix)) {
                        return [2 /*return*/, serializedComponents];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 50);
                        })];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 4: throw new Error("Timed out waiting for custom_id prefix ".concat(customIdPrefix, " in message ").concat(messageId));
            }
        });
    });
}
function waitForInteractionMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, response;
        var getInteraction = _b.getInteraction, interactionId = _b.interactionId, timeoutMs = _b.timeoutMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < timeoutMs)) return [3 /*break*/, 4];
                    return [4 /*yield*/, getInteraction(interactionId)];
                case 2:
                    response = _c.sent();
                    if (response === null || response === void 0 ? void 0 : response.messageId) {
                        return [2 /*return*/, {
                                messageId: response.messageId,
                                data: response.data || '',
                            }];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 50);
                        })];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 4: throw new Error("Timed out waiting for interaction message ".concat(interactionId));
            }
        });
    });
}
(0, vitest_1.describe)('queue advanced: /model with interrupt recovery', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-model-switch-e2e',
        dirName: 'qa-model-switch-e2e',
        username: 'queue-model-switch-tester',
    });
    (0, vitest_1.test)('session model selected in /model survives interrupt-plugin resume path', function () { return __awaiter(void 0, void 0, void 0, function () {
        var buildAgentDir, thread, th, modelCommand, providerStep, providerCustomId, _a, providerSelect, modelStep, modelCustomId, _b, modelSelect, maybeVariantOrScopeStep, maybeVariantOrScopeMessage, maybeVariantOrScopeComponents, scopeStep, _c, scopeCustomId, _d, scopeSelect, sessionId, sessionModel, finalMessages, footer, _e, getClient, sessionMessagesResponse, sessionMessages, emptyUserMessagesWithDefaultModel;
        var _f, _g, _h;
        var _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    buildAgentDir = node_path_1.default.join(ctx.directories.projectDirectory, '.opencode', 'agent');
                    node_fs_1.default.mkdirSync(buildAgentDir, { recursive: true });
                    node_fs_1.default.writeFileSync(node_path_1.default.join(buildAgentDir, 'build.md'), [
                        '---',
                        'name: build',
                        'description: Default build agent for deterministic model tests',
                        'model: deterministic-provider/deterministic-v2',
                        '---',
                        '',
                        'You are the default build agent.',
                        '',
                    ].join('\n'));
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: model-switcher-setup',
                        })];
                case 1:
                    _k.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: model-switcher-setup';
                            },
                        })];
                case 2:
                    thread = _k.sent();
                    th = ctx.discord.thread(thread.id);
                    return [4 /*yield*/, th.waitForBotReply({ timeout: 4000 })];
                case 3:
                    _k.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 4000,
                        })];
                case 4:
                    _k.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).runSlashCommand({
                            name: 'model',
                        })];
                case 5:
                    modelCommand = _k.sent();
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: modelCommand.id,
                            timeout: 4000,
                        })];
                case 6:
                    _k.sent();
                    return [4 /*yield*/, waitForInteractionMessage({
                            getInteraction: function (interactionId) {
                                return th.getInteractionResponse(interactionId);
                            },
                            interactionId: modelCommand.id,
                            timeoutMs: 4000,
                        })];
                case 7:
                    providerStep = _k.sent();
                    _a = getCustomIdFromInteractionData;
                    _f = {};
                    return [4 /*yield*/, waitForMessageComponentsWithCustomId({
                            discord: ctx.discord,
                            threadId: thread.id,
                            messageId: providerStep.messageId,
                            customIdPrefix: 'model_provider:',
                            timeoutMs: 4000,
                        })];
                case 8:
                    providerCustomId = _a.apply(void 0, [(_f.serializedComponents = _k.sent(),
                            _f.prefix = 'model_provider:',
                            _f)]);
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).selectMenu({
                            messageId: providerStep.messageId,
                            customId: providerCustomId,
                            values: ['deterministic-provider'],
                        })];
                case 9:
                    providerSelect = _k.sent();
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: providerSelect.id,
                            timeout: 4000,
                        })];
                case 10:
                    _k.sent();
                    return [4 /*yield*/, waitForInteractionMessage({
                            getInteraction: function (interactionId) {
                                return th.getInteractionResponse(interactionId);
                            },
                            interactionId: providerSelect.id,
                            timeoutMs: 4000,
                        })];
                case 11:
                    modelStep = _k.sent();
                    _b = getCustomIdFromInteractionData;
                    _g = {};
                    return [4 /*yield*/, waitForMessageComponentsWithCustomId({
                            discord: ctx.discord,
                            threadId: thread.id,
                            messageId: modelStep.messageId,
                            customIdPrefix: 'model_select:',
                            timeoutMs: 4000,
                        })];
                case 12:
                    modelCustomId = _b.apply(void 0, [(_g.serializedComponents = _k.sent(),
                            _g.prefix = 'model_select:',
                            _g)]);
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).selectMenu({
                            messageId: modelStep.messageId,
                            customId: modelCustomId,
                            values: ['deterministic-v3'],
                        })];
                case 13:
                    modelSelect = _k.sent();
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: modelSelect.id,
                            timeout: 4000,
                        })];
                case 14:
                    _k.sent();
                    return [4 /*yield*/, waitForInteractionMessage({
                            getInteraction: function (interactionId) {
                                return th.getInteractionResponse(interactionId);
                            },
                            interactionId: modelSelect.id,
                            timeoutMs: 4000,
                        })];
                case 15:
                    maybeVariantOrScopeStep = _k.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForMessageById)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            messageId: maybeVariantOrScopeStep.messageId,
                            timeout: 4000,
                        })];
                case 16:
                    maybeVariantOrScopeMessage = _k.sent();
                    maybeVariantOrScopeComponents = JSON.stringify(maybeVariantOrScopeMessage.components);
                    if (!maybeVariantOrScopeComponents.includes('model_variant:')) return [3 /*break*/, 18];
                    return [4 /*yield*/, (function () { return __awaiter(void 0, void 0, void 0, function () {
                            var variantCustomId, variantSelect;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        variantCustomId = getCustomIdFromInteractionData({
                                            serializedComponents: maybeVariantOrScopeComponents,
                                            prefix: 'model_variant:',
                                        });
                                        return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).selectMenu({
                                                messageId: maybeVariantOrScopeStep.messageId,
                                                customId: variantCustomId,
                                                values: ['__none__'],
                                            })];
                                    case 1:
                                        variantSelect = _a.sent();
                                        return [4 /*yield*/, th.waitForInteractionAck({
                                                interactionId: variantSelect.id,
                                                timeout: 4000,
                                            })];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/, waitForInteractionMessage({
                                                getInteraction: function (interactionId) {
                                                    return th.getInteractionResponse(interactionId);
                                                },
                                                interactionId: variantSelect.id,
                                                timeoutMs: 4000,
                                            })];
                                }
                            });
                        }); })()];
                case 17:
                    _c = _k.sent();
                    return [3 /*break*/, 19];
                case 18:
                    _c = maybeVariantOrScopeStep;
                    _k.label = 19;
                case 19:
                    scopeStep = _c;
                    _d = getCustomIdFromInteractionData;
                    _h = {};
                    return [4 /*yield*/, waitForMessageComponentsWithCustomId({
                            discord: ctx.discord,
                            threadId: thread.id,
                            messageId: scopeStep.messageId,
                            customIdPrefix: 'model_scope:',
                            timeoutMs: 4000,
                        })];
                case 20:
                    scopeCustomId = _d.apply(void 0, [(_h.serializedComponents = _k.sent(),
                            _h.prefix = 'model_scope:',
                            _h)]);
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).selectMenu({
                            messageId: scopeStep.messageId,
                            customId: scopeCustomId,
                            values: ['session'],
                        })];
                case 21:
                    scopeSelect = _k.sent();
                    return [4 /*yield*/, th.waitForInteractionAck({
                            interactionId: scopeSelect.id,
                            timeout: 4000,
                        })];
                case 22:
                    _k.sent();
                    sessionId = (_j = (0, thread_runtime_state_js_1.getThreadState)(thread.id)) === null || _j === void 0 ? void 0 : _j.sessionId;
                    (0, vitest_1.expect)(sessionId).toBeDefined();
                    if (!sessionId) {
                        throw new Error('Expected session id to be present after /model selection');
                    }
                    return [4 /*yield*/, (0, database_js_1.getSessionModel)(sessionId)];
                case 23:
                    sessionModel = _k.sent();
                    (0, vitest_1.expect)(sessionModel === null || sessionModel === void 0 ? void 0 : sessionModel.modelId).toBe('deterministic-provider/deterministic-v3');
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                        })];
                case 24:
                    _k.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            text: 'starting sleep',
                            afterUserMessageIncludes: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
                            timeout: 4000,
                        })];
                case 25:
                    _k.sent();
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: model-switcher-followup',
                        })];
                case 26:
                    _k.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            userId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                            userMessageIncludes: 'model-switcher-followup',
                            timeout: 8000,
                        })];
                case 27:
                    _k.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: 'model-switcher-followup',
                            afterAuthorId: queue_advanced_e2e_setup_js_1.TEST_USER_ID,
                        })];
                case 28:
                    finalMessages = _k.sent();
                    footer = __spreadArray([], finalMessages, true).reverse().find(function (message) {
                        return message.author.id === ctx.discord.botUserId
                            && message.content.startsWith('*')
                            && message.content.includes('⋅');
                    });
                    _e = vitest_1.expect;
                    return [4 /*yield*/, th.text()];
                case 29:
                    _e.apply(void 0, [_k.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (queue-model-switch-tester)\n        Reply with exactly: model-switcher-setup\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        Model set for this session:\n        **Deterministic Provider** / **deterministic-v3**\n        `deterministic-provider/deterministic-v3`\n        _Restarting current request with new model..._\n        _Tip: create [agent .md files](https://github.com/remorses/kimaki/blob/main/docs/model-switching.md) in .opencode/agent/ for one-command model switching_\n        --- from: user (queue-model-switch-tester)\n        PLUGIN_TIMEOUT_SLEEP_MARKER\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        \u2B25 starting sleep 100\n        --- from: user (queue-model-switch-tester)\n        Reply with exactly: model-switcher-followup\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v3*\"\n      ");
                    (0, vitest_1.expect)(footer).toBeDefined();
                    (0, vitest_1.expect)(footer === null || footer === void 0 ? void 0 : footer.content).toContain('deterministic-v3');
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(ctx.directories.projectDirectory)];
                case 30:
                    getClient = _k.sent();
                    if (getClient instanceof Error) {
                        throw getClient;
                    }
                    return [4 /*yield*/, getClient().session.messages({
                            sessionID: sessionId,
                            directory: ctx.directories.projectDirectory,
                        })];
                case 31:
                    sessionMessagesResponse = _k.sent();
                    sessionMessages = sessionMessagesResponse.data || [];
                    emptyUserMessagesWithDefaultModel = sessionMessages.filter(function (message) {
                        if (message.info.role !== 'user') {
                            return false;
                        }
                        var hasNonEmptyTextPart = message.parts.some(function (part) {
                            if (part.type !== 'text') {
                                return false;
                            }
                            return part.text.trim().length > 0;
                        });
                        if (hasNonEmptyTextPart) {
                            return false;
                        }
                        return message.info.model.modelID === 'deterministic-v2';
                    });
                    (0, vitest_1.expect)(emptyUserMessagesWithDefaultModel.length).toBe(0);
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
