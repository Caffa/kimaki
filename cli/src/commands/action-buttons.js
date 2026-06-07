"use strict";
// Action button tool handler - Shows Discord buttons for quick model actions.
// Used by the kimaki_action_buttons tool to render up to 3 buttons and route
// button clicks back into the session as a new user message.
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
exports.pendingActionButtonContexts = void 0;
exports.queueActionButtonsRequest = queueActionButtonsRequest;
exports.waitForQueuedActionButtonsRequest = waitForQueuedActionButtonsRequest;
exports.showActionButtons = showActionButtons;
exports.handleActionButton = handleActionButton;
exports.cancelPendingActionButtons = cancelPendingActionButtons;
var discord_js_1 = require("discord.js");
var node_crypto_1 = require("node:crypto");
var database_js_1 = require("../database.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var sentry_js_1 = require("../sentry.js");
var thread_session_runtime_js_1 = require("../session-handler/thread-session-runtime.js");
var logger = (0, logger_js_1.createLogger)('ACT_BTN');
var PENDING_TTL_MS = 24 * 60 * 60 * 1000;
exports.pendingActionButtonContexts = new Map();
var pendingActionButtonRequests = new Map();
var pendingActionButtonRequestWaiters = new Map();
function queueActionButtonsRequest(request) {
    pendingActionButtonRequests.set(request.sessionId, request);
    var waiter = pendingActionButtonRequestWaiters.get(request.sessionId);
    if (!waiter) {
        return;
    }
    pendingActionButtonRequestWaiters.delete(request.sessionId);
    waiter(request);
}
function waitForQueuedActionButtonsRequest(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var queued;
        var sessionId = _b.sessionId, timeoutMs = _b.timeoutMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    queued = pendingActionButtonRequests.get(sessionId);
                    if (queued) {
                        pendingActionButtonRequests.delete(sessionId);
                        return [2 /*return*/, queued];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            var timeout = setTimeout(function () {
                                var currentWaiter = pendingActionButtonRequestWaiters.get(sessionId);
                                if (!currentWaiter || currentWaiter !== onRequest) {
                                    return;
                                }
                                pendingActionButtonRequestWaiters.delete(sessionId);
                                resolve(undefined);
                            }, timeoutMs);
                            var onRequest = function (request) {
                                clearTimeout(timeout);
                                pendingActionButtonRequests.delete(sessionId);
                                resolve(request);
                            };
                            pendingActionButtonRequestWaiters.set(sessionId, onRequest);
                        })];
                case 1: return [2 /*return*/, _c.sent()];
            }
        });
    });
}
function toButtonStyle(color) {
    if (color === 'blue') {
        return discord_js_1.ButtonStyle.Primary;
    }
    if (color === 'green') {
        return discord_js_1.ButtonStyle.Success;
    }
    if (color === 'red') {
        return discord_js_1.ButtonStyle.Danger;
    }
    return discord_js_1.ButtonStyle.Secondary;
}
function resolveContext(context) {
    if (context.resolved) {
        return false;
    }
    context.resolved = true;
    clearTimeout(context.timer);
    exports.pendingActionButtonContexts.delete(context.contextHash);
    return true;
}
function updateButtonMessage(_a) {
    var context = _a.context, status = _a.status;
    if (!context.messageId) {
        return;
    }
    context.thread.messages
        .fetch(context.messageId)
        .then(function (message) {
        return message.edit({
            content: "**Action Required**\n".concat(status),
            components: [],
        });
    })
        .catch(function () { });
}
function sendClickedActionToModel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var resolved, username, runtime;
        var interaction = _b.interaction, thread = _b.thread, prompt = _b.prompt;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({ channel: thread })];
                case 1:
                    resolved = _c.sent();
                    if (!resolved) {
                        throw new Error('Could not resolve project directory for thread');
                    }
                    username = interaction.user.globalName || interaction.user.username;
                    runtime = (0, thread_session_runtime_js_1.getOrCreateRuntime)({
                        threadId: thread.id,
                        thread: thread,
                        projectDirectory: resolved.projectDirectory,
                        sdkDirectory: resolved.workingDirectory,
                        channelId: thread.parentId || thread.id,
                    });
                    return [4 /*yield*/, runtime.enqueueIncoming({
                            prompt: prompt,
                            userId: interaction.user.id,
                            username: username,
                            mode: 'opencode',
                        })];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function showActionButtons(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var safeButtons, contextHash, timer, context, row, message, error_1;
        var _c;
        var thread = _b.thread, sessionId = _b.sessionId, directory = _b.directory, buttons = _b.buttons, silent = _b.silent;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    safeButtons = buttons
                        .slice(0, 3)
                        .map(function (button) {
                        return {
                            label: button.label.trim().slice(0, 80),
                            color: button.color,
                        };
                    })
                        .filter(function (button) {
                        return button.label.length > 0;
                    });
                    if (safeButtons.length === 0) {
                        throw new Error('No valid buttons to display');
                    }
                    contextHash = node_crypto_1.default.randomBytes(8).toString('hex');
                    timer = setTimeout(function () {
                        var current = exports.pendingActionButtonContexts.get(contextHash);
                        if (!current || current.resolved) {
                            return;
                        }
                        resolveContext(current);
                        updateButtonMessage({ context: current, status: '_Expired_' });
                    }, PENDING_TTL_MS);
                    context = {
                        sessionId: sessionId,
                        directory: directory,
                        thread: thread,
                        buttons: safeButtons,
                        contextHash: contextHash,
                        resolved: false,
                        timer: timer,
                    };
                    exports.pendingActionButtonContexts.set(contextHash, context);
                    row = (_c = new discord_js_1.ActionRowBuilder()).addComponents.apply(_c, safeButtons.map(function (button, index) {
                        return new discord_js_1.ButtonBuilder()
                            .setCustomId("action_button:".concat(contextHash, ":").concat(index))
                            .setLabel(button.label)
                            .setStyle(toButtonStyle(button.color));
                    }));
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, thread.send({
                            content: '**Action Required**',
                            components: [row],
                            flags: silent ? discord_utils_js_1.SILENT_MESSAGE_FLAGS : discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                        })];
                case 2:
                    message = _d.sent();
                    context.messageId = message.id;
                    logger.log("Showed ".concat(safeButtons.length, " action button(s) for session ").concat(sessionId));
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _d.sent();
                    clearTimeout(timer);
                    exports.pendingActionButtonContexts.delete(contextHash);
                    throw new Error('Failed to send action buttons', { cause: error_1 });
                case 4: return [2 /*return*/];
            }
        });
    });
}
function handleActionButton(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, _a, contextHash, indexPart, context, buttonIndex, button, claimed, thread, currentSessionId, prompt, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('action_button:')) {
                        return [2 /*return*/];
                    }
                    _a = customId.split(':'), contextHash = _a[1], indexPart = _a[2];
                    if (!(!contextHash || !indexPart)) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Invalid action button.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
                case 2:
                    context = exports.pendingActionButtonContexts.get(contextHash);
                    if (!(!context || context.resolved)) return [3 /*break*/, 4];
                    return [4 /*yield*/, interaction.reply({
                            content: 'This action is no longer available.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
                case 4:
                    buttonIndex = Number.parseInt(indexPart, 10);
                    button = context.buttons[buttonIndex];
                    if (!!button) return [3 /*break*/, 6];
                    return [4 /*yield*/, interaction.reply({
                            content: 'This action is no longer available.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 5:
                    _b.sent();
                    return [2 /*return*/];
                case 6: return [4 /*yield*/, interaction.deferUpdate()];
                case 7:
                    _b.sent();
                    claimed = resolveContext(context);
                    if (!claimed) {
                        return [2 /*return*/];
                    }
                    thread = interaction.channel;
                    if (!!(thread === null || thread === void 0 ? void 0 : thread.isThread())) return [3 /*break*/, 9];
                    logger.warn('[ACTION] Button clicked outside thread channel');
                    return [4 /*yield*/, interaction.editReply({
                            content: '**Action Required**\n_This action is no longer available._',
                            components: [],
                        })];
                case 8:
                    _b.sent();
                    return [2 /*return*/];
                case 9: return [4 /*yield*/, (0, database_js_1.getThreadSession)(thread.id)];
                case 10:
                    currentSessionId = _b.sent();
                    if (!(!currentSessionId || currentSessionId !== context.sessionId)) return [3 /*break*/, 12];
                    return [4 /*yield*/, interaction.editReply({
                            content: '**Action Required**\n_Expired due to session change._',
                            components: [],
                        })];
                case 11:
                    _b.sent();
                    return [2 /*return*/];
                case 12: return [4 /*yield*/, interaction.editReply({
                        content: "**Action Required**\n_Selected: ".concat(button.label, "_"),
                        components: [],
                    })];
                case 13:
                    _b.sent();
                    prompt = "User clicked: ".concat(button.label);
                    _b.label = 14;
                case 14:
                    _b.trys.push([14, 16, , 18]);
                    return [4 /*yield*/, sendClickedActionToModel({
                            interaction: interaction,
                            thread: thread,
                            prompt: prompt,
                        })];
                case 15:
                    _b.sent();
                    return [3 /*break*/, 18];
                case 16:
                    error_2 = _b.sent();
                    logger.error('[ACTION] Failed to send click to model:', error_2);
                    void (0, sentry_js_1.notifyError)(error_2, 'Action button click send to model failed');
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread, "Failed to send action click: ".concat(error_2 instanceof Error ? error_2.message : String(error_2)), { flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS })];
                case 17:
                    _b.sent();
                    return [3 /*break*/, 18];
                case 18: return [2 /*return*/];
            }
        });
    });
}
/**
 * Dismiss pending action buttons for a thread (e.g. user sent a new message).
 * Removes buttons from the message and cleans up context.
 */
function cancelPendingActionButtons(threadId) {
    for (var _i = 0, pendingActionButtonContexts_1 = exports.pendingActionButtonContexts; _i < pendingActionButtonContexts_1.length; _i++) {
        var _a = pendingActionButtonContexts_1[_i], ctx = _a[1];
        if (ctx.thread.id !== threadId) {
            continue;
        }
        if (!resolveContext(ctx)) {
            continue;
        }
        updateButtonMessage({ context: ctx, status: '_Buttons dismissed._' });
        return true;
    }
    return false;
}
