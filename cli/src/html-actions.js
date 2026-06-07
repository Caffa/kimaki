"use strict";
// HTML action registry for rendered Discord components.
// Stores short-lived button callbacks by generated id so HTML-backed UI can
// attach interactions without leaking closures across rerenders.
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
exports.pendingHtmlActions = void 0;
exports.buildHtmlActionCustomId = buildHtmlActionCustomId;
exports.registerHtmlAction = registerHtmlAction;
exports.cancelHtmlActionsForOwner = cancelHtmlActionsForOwner;
exports.cancelHtmlActionsForThread = cancelHtmlActionsForThread;
exports.handleHtmlActionButton = handleHtmlActionButton;
var node_crypto_1 = require("node:crypto");
var discord_js_1 = require("discord.js");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
var logger = (0, logger_js_1.createLogger)('HTML_ACT');
var DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;
exports.pendingHtmlActions = new Map();
var actionIdsByOwner = new Map();
function buildHtmlActionCustomId(actionId) {
    return "html_action:".concat(actionId);
}
function registerHtmlAction(_a) {
    var _b;
    var ownerKey = _a.ownerKey, threadId = _a.threadId, run = _a.run, _c = _a.ttlMs, ttlMs = _c === void 0 ? DEFAULT_TTL_MS : _c;
    var actionId = node_crypto_1.default.randomBytes(8).toString('hex');
    var timer = setTimeout(function () {
        resolveHtmlAction({ actionId: actionId });
    }, ttlMs);
    exports.pendingHtmlActions.set(actionId, {
        actionId: actionId,
        ownerKey: ownerKey,
        threadId: threadId,
        resolved: false,
        timer: timer,
        run: run,
    });
    var ownerActionIds = (_b = actionIdsByOwner.get(ownerKey)) !== null && _b !== void 0 ? _b : new Set();
    ownerActionIds.add(actionId);
    actionIdsByOwner.set(ownerKey, ownerActionIds);
    return actionId;
}
function cancelHtmlActionsForOwner(ownerKey) {
    var actionIds = actionIdsByOwner.get(ownerKey);
    if (!actionIds) {
        return 0;
    }
    var cancelled = 0;
    for (var _i = 0, actionIds_1 = actionIds; _i < actionIds_1.length; _i++) {
        var actionId = actionIds_1[_i];
        var resolved = resolveHtmlAction({ actionId: actionId });
        if (!resolved) {
            continue;
        }
        cancelled++;
    }
    return cancelled;
}
function cancelHtmlActionsForThread(threadId) {
    var cancelled = 0;
    for (var _i = 0, pendingHtmlActions_1 = exports.pendingHtmlActions; _i < pendingHtmlActions_1.length; _i++) {
        var _a = pendingHtmlActions_1[_i], actionId = _a[0], action = _a[1];
        if (action.threadId !== threadId) {
            continue;
        }
        var resolved = resolveHtmlAction({ actionId: actionId });
        if (!resolved) {
            continue;
        }
        cancelled++;
    }
    return cancelled;
}
function handleHtmlActionButton(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, actionId, action, resolvedAction, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('html_action:')) {
                        return [2 /*return*/];
                    }
                    actionId = customId.slice('html_action:'.length);
                    if (!!actionId) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Invalid action button.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2:
                    action = exports.pendingHtmlActions.get(actionId);
                    if (!(!action || action.resolved)) return [3 /*break*/, 4];
                    return [4 /*yield*/, interaction.reply({
                            content: 'This action is no longer available.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, interaction.deferUpdate()];
                case 5:
                    _a.sent();
                    resolvedAction = resolveHtmlAction({ actionId: actionId });
                    if (!resolvedAction) {
                        return [2 /*return*/];
                    }
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 10]);
                    return [4 /*yield*/, resolvedAction.run({ interaction: interaction })];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 8:
                    error_1 = _a.sent();
                    logger.error('[HTML_ACTION] Failed to run action:', error_1);
                    void (0, sentry_js_1.notifyError)(error_1, 'HTML action button failed');
                    return [4 /*yield*/, interaction
                            .editReply({
                            components: [
                                {
                                    type: discord_js_1.ComponentType.TextDisplay,
                                    content: "Action failed: ".concat(error_1 instanceof Error ? error_1.message : String(error_1)),
                                },
                            ],
                            flags: discord_js_1.MessageFlags.IsComponentsV2,
                        })
                            .catch(function () {
                            return undefined;
                        })];
                case 9:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function resolveHtmlAction(_a) {
    var actionId = _a.actionId;
    var action = exports.pendingHtmlActions.get(actionId);
    if (!action || action.resolved) {
        return undefined;
    }
    action.resolved = true;
    clearTimeout(action.timer);
    exports.pendingHtmlActions.delete(actionId);
    var ownerActionIds = actionIdsByOwner.get(action.ownerKey);
    ownerActionIds === null || ownerActionIds === void 0 ? void 0 : ownerActionIds.delete(actionId);
    if (ownerActionIds && ownerActionIds.size === 0) {
        actionIdsByOwner.delete(action.ownerKey);
    }
    return action;
}
