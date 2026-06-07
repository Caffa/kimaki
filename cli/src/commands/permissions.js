"use strict";
// Permission button handler - Shows buttons for permission requests.
// When OpenCode asks for permission, this module renders 3 buttons:
// Accept, Accept Always, and Deny.
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
exports.pendingPermissionContexts = void 0;
exports.arePatternsCoveredBy = arePatternsCoveredBy;
exports.compactPermissionPatterns = compactPermissionPatterns;
exports.showPermissionButtons = showPermissionButtons;
exports.cancelPendingPermission = cancelPendingPermission;
exports.handlePermissionButton = handlePermissionButton;
exports.addPermissionRequestToContext = addPermissionRequestToContext;
var discord_js_1 = require("discord.js");
var node_crypto_1 = require("node:crypto");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.PERMISSIONS);
function resumeSessionIfIdleAfterPermission(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var statusResponse, sessionStatus, resumeResponse;
        var _c;
        var client = _b.client, sessionId = _b.sessionId, directory = _b.directory;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) {
                        setTimeout(resolve, 100);
                    })];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, client.session.status({ directory: directory })];
                case 2:
                    statusResponse = _d.sent();
                    if (statusResponse.error) {
                        return [2 /*return*/, new Error('Failed to check session status')];
                    }
                    sessionStatus = (_c = statusResponse.data) === null || _c === void 0 ? void 0 : _c[sessionId];
                    if (!sessionStatus || sessionStatus.type !== 'idle') {
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, client.session.promptAsync({
                            sessionID: sessionId,
                            directory: directory,
                            parts: [],
                        })];
                case 3:
                    resumeResponse = _d.sent();
                    if (resumeResponse.error) {
                        return [2 /*return*/, new Error('Failed to resume session')];
                    }
                    return [2 /*return*/, true];
            }
        });
    });
}
function wildcardMatch(_a) {
    var value = _a.value, pattern = _a.pattern;
    var escapedPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.');
    if (escapedPattern.endsWith(' .*')) {
        escapedPattern = escapedPattern.slice(0, -3) + '( .*)?';
    }
    return new RegExp("^".concat(escapedPattern, "$"), 's').test(value);
}
function arePatternsCoveredBy(_a) {
    var patterns = _a.patterns, coveringPatterns = _a.coveringPatterns;
    return patterns.every(function (pattern) {
        return coveringPatterns.some(function (coveringPattern) {
            return wildcardMatch({ value: pattern, pattern: coveringPattern });
        });
    });
}
function compactPermissionPatterns(patterns) {
    var uniquePatterns = Array.from(new Set(patterns));
    return uniquePatterns.filter(function (pattern, index) {
        return !uniquePatterns.some(function (candidate, candidateIndex) {
            if (candidateIndex === index) {
                return false;
            }
            return wildcardMatch({ value: pattern, pattern: candidate });
        });
    });
}
// Store pending permission contexts by hash.
// TTL prevents unbounded growth if user never clicks a permission button.
var PERMISSION_CONTEXT_TTL_MS = 10 * 60 * 1000;
exports.pendingPermissionContexts = new Map();
// Atomic take: removes context from Map and returns it. Only the first caller
// (TTL expiry or button click) wins, preventing duplicate permission replies.
function takePendingPermissionContext(contextHash) {
    var ctx = exports.pendingPermissionContexts.get(contextHash);
    if (!ctx) {
        return undefined;
    }
    exports.pendingPermissionContexts.delete(contextHash);
    return ctx;
}
/**
 * Show permission buttons for a permission request.
 * Displays 3 buttons in a row: Accept, Accept Always, Deny.
 * Returns the message ID and context hash for tracking.
 */
function showPermissionButtons(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var contextHash, context, patternStr, acceptButton, acceptAlwaysButton, denyButton, actionRow, subtaskLine, externalDirLine, fullContent, permissionMessage;
        var _this = this;
        var thread = _b.thread, permission = _b.permission, directory = _b.directory, permissionDirectory = _b.permissionDirectory, subtaskLabel = _b.subtaskLabel;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    contextHash = node_crypto_1.default.randomBytes(8).toString('hex');
                    context = {
                        permission: permission,
                        requestIds: [permission.id],
                        directory: directory,
                        permissionDirectory: permissionDirectory,
                        thread: thread,
                        contextHash: contextHash,
                    };
                    exports.pendingPermissionContexts.set(contextHash, context);
                    // Auto-reject on TTL expiry so the OpenCode session doesn't hang forever
                    // waiting for a permission reply that will never come. Uses atomic take
                    // so only one of TTL-expiry or button-click can win.
                    setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        var ctx, client, requestIds;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    ctx = takePendingPermissionContext(contextHash);
                                    if (!ctx) {
                                        return [2 /*return*/];
                                    }
                                    client = (0, opencode_js_1.getOpencodeClient)(ctx.directory);
                                    if (!client) return [3 /*break*/, 2];
                                    requestIds = ctx.requestIds.length > 0
                                        ? ctx.requestIds
                                        : [ctx.permission.id];
                                    return [4 /*yield*/, Promise.all(requestIds.map(function (requestId) {
                                            return client.permission.reply({
                                                requestID: requestId,
                                                directory: ctx.permissionDirectory,
                                                reply: 'reject',
                                            });
                                        })).catch(function (error) {
                                            logger.error('Failed to auto-reject expired permission:', error);
                                        })];
                                case 1:
                                    _a.sent();
                                    updatePermissionMessage({
                                        context: ctx,
                                        status: '_Permission expired after 10 minutes and was rejected._',
                                    });
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); }, PERMISSION_CONTEXT_TTL_MS).unref();
                    patternStr = compactPermissionPatterns(permission.patterns).join(', ');
                    acceptButton = new discord_js_1.ButtonBuilder()
                        .setCustomId("permission_once:".concat(contextHash))
                        .setLabel('Accept')
                        .setStyle(discord_js_1.ButtonStyle.Success);
                    acceptAlwaysButton = new discord_js_1.ButtonBuilder()
                        .setCustomId("permission_always:".concat(contextHash))
                        .setLabel('Accept Always')
                        .setStyle(discord_js_1.ButtonStyle.Success);
                    denyButton = new discord_js_1.ButtonBuilder()
                        .setCustomId("permission_reject:".concat(contextHash))
                        .setLabel('Deny')
                        .setStyle(discord_js_1.ButtonStyle.Secondary);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(acceptButton, acceptAlwaysButton, denyButton);
                    subtaskLine = subtaskLabel ? "**From:** `".concat(subtaskLabel, "`\n") : '';
                    externalDirLine = permission.permission === 'external_directory'
                        ? "Agent is accessing files outside the project. [Learn more](https://opencode.ai/docs/permissions/#external-directories)\n"
                        : '';
                    fullContent = "\u26A0\uFE0F **Permission Required**\n" +
                        subtaskLine +
                        "**Type:** `".concat(permission.permission, "`\n") +
                        externalDirLine +
                        (patternStr ? "**Pattern:** `".concat(patternStr, "`") : '');
                    return [4 /*yield*/, thread.send({
                            content: fullContent.slice(0, 1900),
                            components: [actionRow],
                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS | discord_js_1.MessageFlags.SuppressEmbeds,
                        })];
                case 1:
                    permissionMessage = _c.sent();
                    context.messageId = permissionMessage.id;
                    logger.log("Showed permission buttons for ".concat(permission.id));
                    return [2 /*return*/, { messageId: permissionMessage.id, contextHash: contextHash }];
            }
        });
    });
}
function updatePermissionMessage(_a) {
    var context = _a.context, status = _a.status;
    if (!context.messageId) {
        return;
    }
    context.thread.messages
        .fetch(context.messageId)
        .then(function (message) {
        var patternStr = compactPermissionPatterns(context.permission.patterns).join(', ');
        var externalDirLine = context.permission.permission === 'external_directory'
            ? 'Agent is accessing files outside the project. [Learn more](https://opencode.ai/docs/permissions/#external-directories)\n'
            : '';
        return message.edit({
            content: "\u26A0\uFE0F **Permission Required**\n" +
                "**Type:** `".concat(context.permission.permission, "`\n") +
                externalDirLine +
                (patternStr ? "**Pattern:** `".concat(patternStr, "`\n") : '') +
                status,
            components: [],
        });
    })
        .catch(function (error) {
        logger.error('Failed to update permission message:', error);
    });
}
function cancelPendingPermission(threadId) {
    return __awaiter(this, void 0, void 0, function () {
        var contexts, cancelledCount, _loop_1, _i, contexts_1, context;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    contexts = Array.from(exports.pendingPermissionContexts.values()).filter(function (context) {
                        return context.thread.id === threadId;
                    });
                    if (contexts.length === 0) {
                        return [2 /*return*/, false];
                    }
                    cancelledCount = 0;
                    _loop_1 = function (context) {
                        var pendingContext, client, requestIds, result;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    pendingContext = takePendingPermissionContext(context.contextHash);
                                    if (!pendingContext) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    client = (0, opencode_js_1.getOpencodeClient)(pendingContext.directory);
                                    if (!client) {
                                        exports.pendingPermissionContexts.set(pendingContext.contextHash, pendingContext);
                                        logger.error('Failed to dismiss pending permission: OpenCode server not found');
                                        return [2 /*return*/, "continue"];
                                    }
                                    requestIds = pendingContext.requestIds.length > 0
                                        ? pendingContext.requestIds
                                        : [pendingContext.permission.id];
                                    return [4 /*yield*/, Promise.all(requestIds.map(function (requestId) {
                                            return client.permission.reply({
                                                requestID: requestId,
                                                directory: pendingContext.permissionDirectory,
                                                reply: 'reject',
                                            });
                                        })).then(function () {
                                            return 'ok';
                                        }).catch(function (error) {
                                            exports.pendingPermissionContexts.set(pendingContext.contextHash, pendingContext);
                                            logger.error('Failed to dismiss pending permission:', error);
                                            return 'error';
                                        })];
                                case 1:
                                    result = _b.sent();
                                    if (result === 'error') {
                                        return [2 /*return*/, "continue"];
                                    }
                                    updatePermissionMessage({
                                        context: pendingContext,
                                        status: '_Permission dismissed - user sent a new message._',
                                    });
                                    cancelledCount++;
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, contexts_1 = contexts;
                    _a.label = 1;
                case 1:
                    if (!(_i < contexts_1.length)) return [3 /*break*/, 4];
                    context = contexts_1[_i];
                    return [5 /*yield**/, _loop_1(context)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    if (cancelledCount > 0) {
                        logger.log("Dismissed ".concat(cancelledCount, " pending permission request(s) for thread ").concat(threadId));
                    }
                    return [2 /*return*/, cancelledCount > 0];
            }
        });
    });
}
/**
 * Handle button click for permission.
 */
function handlePermissionButton(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, _a, actionPart, contextHash, response, context, permClient_1, requestIds, resumed, resultText, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    customId = interaction.customId;
                    _a = customId.split(':'), actionPart = _a[0], contextHash = _a[1];
                    if (!actionPart || !contextHash) {
                        return [2 /*return*/];
                    }
                    response = actionPart.replace('permission_', '');
                    if (response !== 'once' && response !== 'always' && response !== 'reject') {
                        return [2 /*return*/];
                    }
                    context = takePendingPermissionContext(contextHash);
                    if (!!context) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.update({
                            content: '_Permission expired and was already rejected. Send a new message to continue._',
                            components: [],
                        })];
                case 1:
                    _b.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, interaction.deferUpdate()];
                case 3:
                    _b.sent();
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 8, , 10]);
                    permClient_1 = (0, opencode_js_1.getOpencodeClient)(context.directory);
                    if (!permClient_1) {
                        throw new Error('OpenCode server not found for directory');
                    }
                    requestIds = context.requestIds.length > 0
                        ? context.requestIds
                        : [context.permission.id];
                    return [4 /*yield*/, Promise.all(requestIds.map(function (requestId) {
                            return permClient_1.permission.reply({
                                requestID: requestId,
                                directory: context.permissionDirectory,
                                reply: response,
                            });
                        }))];
                case 5:
                    _b.sent();
                    if (!(response !== 'reject')) return [3 /*break*/, 7];
                    return [4 /*yield*/, resumeSessionIfIdleAfterPermission({
                            client: permClient_1,
                            sessionId: context.permission.sessionID,
                            directory: context.permissionDirectory,
                        })];
                case 6:
                    resumed = _b.sent();
                    if (resumed instanceof Error) {
                        logger.error('Failed to resume idle session after permission:', resumed);
                    }
                    if (resumed === true) {
                        logger.log("Resumed idle session after permission ".concat(context.permission.id));
                    }
                    _b.label = 7;
                case 7:
                    resultText = (function () {
                        switch (response) {
                            case 'once':
                                return '✅ Permission **accepted**';
                            case 'always':
                                return '✅ Permission **accepted** (auto-approve similar requests)';
                            case 'reject':
                                return '❌ Permission **rejected**';
                        }
                    })();
                    updatePermissionMessage({
                        context: context,
                        status: resultText,
                    });
                    logger.log("Permission ".concat(context.permission.id, " ").concat(response, " (").concat(requestIds.length, " request(s))"));
                    return [3 /*break*/, 10];
                case 8:
                    error_1 = _b.sent();
                    logger.error('Error handling permission:', error_1);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to process permission: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                            components: [],
                        })];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function addPermissionRequestToContext(_a) {
    var contextHash = _a.contextHash, requestId = _a.requestId;
    var context = exports.pendingPermissionContexts.get(contextHash);
    if (!context) {
        return false;
    }
    if (context.requestIds.includes(requestId)) {
        return false;
    }
    context.requestIds = __spreadArray(__spreadArray([], context.requestIds, true), [requestId], false);
    exports.pendingPermissionContexts.set(contextHash, context);
    return true;
}
