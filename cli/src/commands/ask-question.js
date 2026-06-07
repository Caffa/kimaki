"use strict";
// AskUserQuestion tool handler - Shows Discord dropdowns for AI questions.
// When the AI uses the AskUserQuestion tool, this module renders dropdowns
// for each question and collects user responses.
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
exports.pendingQuestionContexts = void 0;
exports.findPendingQuestionContextForRequest = findPendingQuestionContextForRequest;
exports.deletePendingQuestionContextsForRequest = deletePendingQuestionContextsForRequest;
exports.hasPendingQuestionForThread = hasPendingQuestionForThread;
exports.showAskUserQuestionDropdowns = showAskUserQuestionDropdowns;
exports.handleAskQuestionSelectMenu = handleAskQuestionSelectMenu;
exports.parseAskUserQuestionTool = parseAskUserQuestionTool;
exports.cancelPendingQuestion = cancelPendingQuestion;
var discord_js_1 = require("discord.js");
var node_crypto_1 = require("node:crypto");
var discord_utils_js_1 = require("../discord-utils.js");
var opencode_js_1 = require("../opencode.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.ASK_QUESTION);
// Store pending question contexts by hash.
// TTL prevents unbounded growth if user never answers a question.
var QUESTION_CONTEXT_TTL_MS = 10 * 60 * 1000;
exports.pendingQuestionContexts = new Map();
function findPendingQuestionContextForRequest(_a) {
    var threadId = _a.threadId, requestId = _a.requestId;
    for (var _i = 0, pendingQuestionContexts_1 = exports.pendingQuestionContexts; _i < pendingQuestionContexts_1.length; _i++) {
        var _b = pendingQuestionContexts_1[_i], contextHash = _b[0], context = _b[1];
        if (context.thread.id !== threadId) {
            continue;
        }
        if (context.requestId !== requestId) {
            continue;
        }
        return { contextHash: contextHash, context: context };
    }
    return null;
}
function deletePendingQuestionContextsForRequest(_a) {
    var threadId = _a.threadId, requestId = _a.requestId;
    var matchingContextHashes = __spreadArray([], exports.pendingQuestionContexts.entries(), true).filter(function (_a) {
        var context = _a[1];
        return context.thread.id === threadId && context.requestId === requestId;
    })
        .map(function (_a) {
        var contextHash = _a[0];
        return contextHash;
    });
    matchingContextHashes.map(function (contextHash) {
        exports.pendingQuestionContexts.delete(contextHash);
        return contextHash;
    });
    return matchingContextHashes.length;
}
function hasPendingQuestionForThread(threadId) {
    return __spreadArray([], exports.pendingQuestionContexts.values(), true).some(function (ctx) {
        return ctx.thread.id === threadId;
    });
}
/**
 * Show dropdown menus for question tool input.
 * Sends one message per question with the dropdown directly under the question text.
 */
function showAskUserQuestionDropdowns(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var existingPending, contextHash, context, i, q, options, placeholder, selectMenu, actionRow;
        var _this = this;
        var _c;
        var thread = _b.thread, sessionId = _b.sessionId, directory = _b.directory, requestId = _b.requestId, input = _b.input, silent = _b.silent;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    existingPending = findPendingQuestionContextForRequest({
                        threadId: thread.id,
                        requestId: requestId,
                    });
                    if (existingPending) {
                        logger.log("Deduped question ".concat(requestId, " for thread ").concat(thread.id, " (existing context ").concat(existingPending.contextHash, ")"));
                        return [2 /*return*/];
                    }
                    contextHash = node_crypto_1.default.randomBytes(8).toString('hex');
                    context = {
                        sessionId: sessionId,
                        directory: directory,
                        thread: thread,
                        requestId: requestId,
                        questions: input.questions,
                        answers: {},
                        totalQuestions: input.questions.length,
                        answeredCount: 0,
                        contextHash: contextHash,
                    };
                    exports.pendingQuestionContexts.set(contextHash, context);
                    // On TTL expiry: hide the dropdown UI and abort the session so OpenCode
                    // unblocks. We intentionally do NOT call question.reply() — sending 'Other'
                    // made the model think the user chose an option when they didn't.
                    setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        var ctx, client;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    ctx = exports.pendingQuestionContexts.get(contextHash);
                                    if (!ctx) {
                                        return [2 /*return*/];
                                    }
                                    // Delete context first so the dropdown becomes inert immediately.
                                    // Without this, a user clicking during the abort() await would still
                                    // be accepted by handleAskQuestionSelectMenu, then abort() would
                                    // kill that valid run.
                                    deletePendingQuestionContextsForRequest({
                                        threadId: ctx.thread.id,
                                        requestId: ctx.requestId,
                                    });
                                    client = (0, opencode_js_1.getOpencodeClient)(ctx.directory);
                                    if (!client) return [3 /*break*/, 2];
                                    return [4 /*yield*/, client.session.abort({
                                            sessionID: ctx.sessionId,
                                        }).catch(function (error) {
                                            logger.error('Failed to abort session after question expiry:', error);
                                        })];
                                case 1:
                                    _a.sent();
                                    _a.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    }); }, QUESTION_CONTEXT_TTL_MS).unref();
                    i = 0;
                    _d.label = 1;
                case 1:
                    if (!(i < input.questions.length)) return [3 /*break*/, 4];
                    q = input.questions[i];
                    options = __spreadArray(__spreadArray([], q.options.slice(0, 24).map(function (opt, optIdx) { return ({
                        label: opt.label.slice(0, 100),
                        value: "".concat(optIdx),
                        description: opt.description.slice(0, 100),
                    }); }), true), [
                        {
                            label: 'Other',
                            value: 'other',
                            description: 'Provide a custom answer in chat',
                        },
                    ], false);
                    placeholder = ((_c = options.find(function (x) { return x.label; })) === null || _c === void 0 ? void 0 : _c.label) || 'Select an option';
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("ask_question:".concat(contextHash, ":").concat(i))
                        .setPlaceholder(placeholder)
                        .addOptions(options);
                    // Enable multi-select if the question supports it
                    if (q.multiple) {
                        selectMenu.setMinValues(1);
                        selectMenu.setMaxValues(options.length);
                    }
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, thread.send({
                            content: "**".concat((q.header || '').slice(0, 200), "**\n").concat(q.question.slice(0, 1700)),
                            components: [actionRow],
                            flags: silent ? discord_utils_js_1.SILENT_MESSAGE_FLAGS : discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                        })];
                case 2:
                    _d.sent();
                    _d.label = 3;
                case 3:
                    i++;
                    return [3 /*break*/, 1];
                case 4:
                    logger.log("Showed ".concat(input.questions.length, " question dropdown(s) for session ").concat(sessionId));
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle dropdown selection for AskUserQuestion.
 */
function handleAskQuestionSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, parts, contextHash, questionIndex, context, selectedValues, question, answeredText;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('ask_question:')) {
                        return [2 /*return*/];
                    }
                    parts = customId.split(':');
                    contextHash = parts[1];
                    questionIndex = parseInt(parts[2], 10);
                    if (!!contextHash) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'Invalid selection.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2:
                    context = exports.pendingQuestionContexts.get(contextHash);
                    if (!!context) return [3 /*break*/, 4];
                    return [4 /*yield*/, interaction.reply({
                            content: 'This question has expired. Please ask the AI again.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, interaction.deferUpdate()];
                case 5:
                    _a.sent();
                    selectedValues = interaction.values;
                    question = context.questions[questionIndex];
                    if (!question) {
                        logger.error("Question index ".concat(questionIndex, " not found in context"));
                        return [2 /*return*/];
                    }
                    // Check if "other" was selected
                    if (selectedValues.includes('other')) {
                        // User wants to provide custom answer
                        // For now, mark as "Other" - they can type in chat
                        context.answers[questionIndex] = ['Other (please type your answer in chat)'];
                    }
                    else {
                        // Map value indices back to option labels
                        context.answers[questionIndex] = selectedValues.map(function (v) {
                            var _a;
                            var optIdx = parseInt(v, 10);
                            return ((_a = question.options[optIdx]) === null || _a === void 0 ? void 0 : _a.label) || "Option ".concat(optIdx + 1);
                        });
                    }
                    context.answeredCount++;
                    answeredText = context.answers[questionIndex].join(', ');
                    return [4 /*yield*/, interaction.editReply({
                            content: "**".concat(question.header, "**\n").concat(question.question, "\n\u2713 _").concat(answeredText, "_"),
                            components: [], // Remove the dropdown
                        })
                        // Check if all questions are answered
                    ];
                case 6:
                    _a.sent();
                    if (!(context.answeredCount >= context.totalQuestions)) return [3 /*break*/, 8];
                    // All questions answered - send result back to session
                    return [4 /*yield*/, submitQuestionAnswers(context)];
                case 7:
                    // All questions answered - send result back to session
                    _a.sent();
                    deletePendingQuestionContextsForRequest({
                        threadId: context.thread.id,
                        requestId: context.requestId,
                    });
                    _a.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    });
}
/**
 * Submit all collected answers back to the OpenCode session.
 * Uses the question.reply API to provide answers to the waiting tool.
 */
function submitQuestionAnswers(context) {
    return __awaiter(this, void 0, void 0, function () {
        var client, answers, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 4]);
                    client = (0, opencode_js_1.getOpencodeClient)(context.directory);
                    if (!client) {
                        throw new Error('OpenCode server not found for directory');
                    }
                    answers = context.questions.map(function (_, i) {
                        return context.answers[i] || [];
                    });
                    return [4 /*yield*/, client.question.reply({
                            requestID: context.requestId,
                            directory: context.directory,
                            answers: answers,
                        })];
                case 1:
                    _a.sent();
                    logger.log("Submitted answers for question ".concat(context.requestId, " in session ").concat(context.sessionId));
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _a.sent();
                    logger.error('Failed to submit answers:', error_1);
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(context.thread, "\u2717 Failed to submit answers: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'))];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if a tool part is an AskUserQuestion tool.
 * Returns the parsed input if valid, null otherwise.
 */
function parseAskUserQuestionTool(part) {
    var _a, _b;
    if (part.type !== 'tool') {
        return null;
    }
    // Check for the tool name (case-insensitive)
    var toolName = (_a = part.tool) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (toolName !== 'question') {
        return null;
    }
    var input = (_b = part.state) === null || _b === void 0 ? void 0 : _b.input;
    if (!(input === null || input === void 0 ? void 0 : input.questions) ||
        !Array.isArray(input.questions) ||
        input.questions.length === 0) {
        return null;
    }
    // Validate structure
    for (var _i = 0, _c = input.questions; _i < _c.length; _i++) {
        var q = _c[_i];
        if (typeof q.question !== 'string' ||
            typeof q.header !== 'string' ||
            !Array.isArray(q.options) ||
            q.options.length < 2) {
            return null;
        }
    }
    return input;
}
/**
 * Cancel a pending question for a thread.
 *
 * Two modes depending on whether `userMessage` is provided:
 *
 * - `cancelPendingQuestion(threadId)` — cleanup only. Removes the context
 *   without replying to OpenCode. Use when aborting the blocked session
 *   separately (e.g. voice/attachment messages whose content needs
 *   transcription first). Returns 'no-pending' in both "found+cleaned" and
 *   "nothing found" cases.
 *
 * - `cancelPendingQuestion(threadId, text)` — reply path. Sends the text as
 *   the tool answer so the model sees the user's response. The caller should
 *   NOT also enqueue the message as a new prompt.
 *   Returns 'replied' on success, 'reply-failed' if the reply call fails
 *   (context kept pending so TTL can retry).
 */
function cancelPendingQuestion(threadId, userMessage) {
    return __awaiter(this, void 0, void 0, function () {
        var contextHash, context, _i, pendingQuestionContexts_2, _a, hash, ctx, client, answers, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    for (_i = 0, pendingQuestionContexts_2 = exports.pendingQuestionContexts; _i < pendingQuestionContexts_2.length; _i++) {
                        _a = pendingQuestionContexts_2[_i], hash = _a[0], ctx = _a[1];
                        if (ctx.thread.id === threadId) {
                            contextHash = hash;
                            context = ctx;
                            break;
                        }
                    }
                    if (!contextHash || !context) {
                        return [2 /*return*/, 'no-pending'];
                    }
                    // undefined means teardown/cleanup — just remove context, don't reply.
                    // The session is already being torn down or the caller wants to dismiss
                    // the question without providing an answer (e.g. voice/attachment-only
                    // messages where content needs transcription before it can be an answer).
                    if (userMessage === undefined) {
                        deletePendingQuestionContextsForRequest({
                            threadId: context.thread.id,
                            requestId: context.requestId,
                        });
                        return [2 /*return*/, 'no-pending'];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    client = (0, opencode_js_1.getOpencodeClient)(context.directory);
                    if (!client) {
                        throw new Error('OpenCode server not found for directory');
                    }
                    answers = context.questions.map(function (_, i) {
                        return context.answers[i] || [userMessage];
                    });
                    return [4 /*yield*/, client.question.reply({
                            requestID: context.requestId,
                            directory: context.directory,
                            answers: answers,
                        })];
                case 2:
                    _b.sent();
                    logger.log("Answered question ".concat(context.requestId, " with user message"));
                    return [3 /*break*/, 4];
                case 3:
                    error_2 = _b.sent();
                    logger.error('Failed to answer question:', error_2);
                    // Keep context pending so TTL can still fire.
                    // Caller should not consume the user message since reply failed.
                    return [2 /*return*/, 'reply-failed'];
                case 4:
                    deletePendingQuestionContextsForRequest({
                        threadId: context.thread.id,
                        requestId: context.requestId,
                    });
                    return [2 /*return*/, 'replied'];
            }
        });
    });
}
