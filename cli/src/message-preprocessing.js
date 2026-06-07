"use strict";
// Message pre-processing pipeline for incoming Discord messages.
// Extracts prompt text, voice transcription, file/text attachments, and
// session context from a Discord Message before handing off to the runtime.
//
// This module exists so discord-bot.ts stays a thin event router and the
// expensive async work (voice transcription, context fetch, attachment
// download) runs inside the runtime's serialized preprocessChain —
// preserving arrival order without a separate threadIngressQueue.
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
exports.VOICE_MESSAGE_TRANSCRIPTION_PREFIX = void 0;
exports.preprocessExistingThreadMessage = preprocessExistingThreadMessage;
exports.preprocessNewSessionMessage = preprocessNewSessionMessage;
exports.preprocessNewThreadMessage = preprocessNewThreadMessage;
var message_formatting_js_1 = require("./message-formatting.js");
var voice_handler_js_1 = require("./voice-handler.js");
var voice_attachment_js_1 = require("./voice-attachment.js");
var opencode_js_1 = require("./opencode.js");
var markdown_js_1 = require("./markdown.js");
var database_js_1 = require("./database.js");
var errore = require("errore");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.SESSION);
var voiceLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.VOICE);
exports.VOICE_MESSAGE_TRANSCRIPTION_PREFIX = 'Voice message transcription from Discord user:\n';
/** Fetch available agents from OpenCode for voice transcription agent selection. */
function fetchAvailableAgents(getClient, directory) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (getClient instanceof Error) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return getClient().app.agents({ directory: directory });
                        })];
                case 1:
                    result = _a.sent();
                    if (result instanceof Error) {
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/, (result.data || [])
                            .filter(function (a) {
                            return (a.mode === 'primary' || a.mode === 'all') && !a.hidden;
                        })
                            .map(function (a) {
                            return { name: a.name, description: a.description };
                        })];
            }
        });
    });
}
// Matches explicit queue markers at the end of a message (case-insensitive).
// Supported forms:
// - punctuation + queue: ". queue", "! queue", ". queue.", "!queue."
// - queue as its own final line: "text\nqueue" or just "queue"
// When present the suffix is stripped and the message is routed through
// kimaki's local queue (same as /queue command).
var QUEUE_SUFFIX_RE = /(?:[.!?,;:]|^)\s*queue\.?\s*$|\n\s*queue\.?\s*$/i;
var REPLIED_MESSAGE_TEXT_LIMIT = 1000;
function extractQueueSuffix(prompt) {
    if (!QUEUE_SUFFIX_RE.test(prompt)) {
        return { prompt: prompt, forceQueue: false };
    }
    return { prompt: prompt.replace(QUEUE_SUFFIX_RE, '').trimEnd(), forceQueue: true };
}
function shouldSkipEmptyPrompt(_a) {
    var message = _a.message, prompt = _a.prompt, images = _a.images, hasVoiceAttachment = _a.hasVoiceAttachment;
    if (prompt.trim()) {
        return false;
    }
    if (((images === null || images === void 0 ? void 0 : images.length) || 0) > 0) {
        return false;
    }
    var inferredVoiceAttachment = message.attachments.some(function (attachment) {
        return (0, voice_attachment_js_1.isVoiceAttachment)(attachment);
    });
    if (!hasVoiceAttachment && !inferredVoiceAttachment && message.attachments.size === 0) {
        return false;
    }
    voiceLogger.warn("[INGRESS] Skipping empty prompt after preprocessing attachments=".concat(message.attachments.size, " hasVoiceAttachment=").concat(hasVoiceAttachment, " inferredVoiceAttachment=").concat(inferredVoiceAttachment));
    return true;
}
function getRepliedMessageContext(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var referencedMessage, repliedText;
        var _c;
        var message = _b.message;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!((_c = message.reference) === null || _c === void 0 ? void 0 : _c.messageId)) {
                        return [2 /*return*/, undefined];
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return message.fetchReference();
                        })];
                case 1:
                    referencedMessage = _d.sent();
                    if (referencedMessage instanceof Error) {
                        logger.warn("[INGRESS] Failed to fetch replied message ".concat(message.reference.messageId, " for ").concat(message.id, ": ").concat(referencedMessage.message));
                        return [2 /*return*/, undefined];
                    }
                    repliedText = (0, message_formatting_js_1.resolveMentions)(referencedMessage)
                        .trim()
                        .slice(0, REPLIED_MESSAGE_TEXT_LIMIT);
                    if (!repliedText) {
                        return [2 /*return*/, undefined];
                    }
                    return [2 /*return*/, {
                            authorUsername: referencedMessage.author.username,
                            text: repliedText,
                        }];
            }
        });
    });
}
/**
 * Pre-process a message in an existing thread (thread already has a session or
 * needs a new one). Handles voice transcription, text/file attachments, and
 * session context fetching for voice messages.
 *
 * For threads with an existing session, voice transcription is enriched with
 * current + last session context (used by the transcription model to better
 * understand domain-specific terms).
 */
function preprocessExistingThreadMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var sessionId, messageContent, repliedMessage, currentSessionContext, lastSessionContext, agents, getClient, client, _c, sessionContextResult, lastSessionResult, fetchedAgents, lastSessionId, result, e_1, voiceResult, qs, fileAttachments, textAttachmentsContent, prompt;
        var message = _b.message, thread = _b.thread, projectDirectory = _b.projectDirectory, channelId = _b.channelId, isCliInjected = _b.isCliInjected, hasVoiceAttachment = _b.hasVoiceAttachment, appId = _b.appId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.getThreadSession)(thread.id)
                    // ── No existing session: new session in an existing thread ──
                ];
                case 1:
                    sessionId = _d.sent();
                    // ── No existing session: new session in an existing thread ──
                    if (!sessionId) {
                        return [2 /*return*/, preprocessNewSessionMessage({
                                message: message,
                                thread: thread,
                                projectDirectory: projectDirectory,
                                hasVoiceAttachment: hasVoiceAttachment,
                                appId: appId,
                            })];
                    }
                    // ── Existing session path ──
                    voiceLogger.log("[SESSION] Found session ".concat(sessionId, " for thread ").concat(thread.id));
                    messageContent = isCliInjected
                        ? (message.content || '')
                        : (0, message_formatting_js_1.resolveMentions)(message);
                    return [4 /*yield*/, getRepliedMessageContext({ message: message })
                        // Fetch session context and available agents for voice transcription enrichment
                    ];
                case 2:
                    repliedMessage = _d.sent();
                    agents = [];
                    if (!projectDirectory) return [3 /*break*/, 9];
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 8, , 9]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory, { channelId: channelId })];
                case 4:
                    getClient = _d.sent();
                    if (getClient instanceof Error) {
                        voiceLogger.error("[SESSION] Failed to initialize OpenCode client:", getClient.message);
                        throw new Error(getClient.message);
                    }
                    client = getClient();
                    return [4 /*yield*/, Promise.all([
                            (0, markdown_js_1.getCompactSessionContext)({
                                client: client,
                                sessionId: sessionId,
                                includeSystemPrompt: false,
                                maxMessages: 15,
                            }),
                            (0, markdown_js_1.getLastSessionId)({
                                client: client,
                                excludeSessionId: sessionId,
                            }),
                            fetchAvailableAgents(getClient, projectDirectory),
                        ])];
                case 5:
                    _c = _d.sent(), sessionContextResult = _c[0], lastSessionResult = _c[1], fetchedAgents = _c[2];
                    if (errore.isOk(sessionContextResult)) {
                        currentSessionContext = sessionContextResult;
                    }
                    agents = fetchedAgents;
                    lastSessionId = errore.unwrapOr(lastSessionResult, null);
                    if (!lastSessionId) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, markdown_js_1.getCompactSessionContext)({
                            client: client,
                            sessionId: lastSessionId,
                            includeSystemPrompt: true,
                            maxMessages: 10,
                        })];
                case 6:
                    result = _d.sent();
                    if (errore.isOk(result)) {
                        lastSessionContext = result;
                    }
                    _d.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    e_1 = _d.sent();
                    voiceLogger.error("Could not get session context:", e_1);
                    void (0, sentry_js_1.notifyError)(e_1, 'Failed to get session context');
                    return [3 /*break*/, 9];
                case 9: return [4 /*yield*/, (0, voice_handler_js_1.processVoiceAttachment)({
                        message: message,
                        thread: thread,
                        projectDirectory: projectDirectory,
                        appId: appId,
                        currentSessionContext: currentSessionContext,
                        lastSessionContext: lastSessionContext,
                        agents: agents,
                    })];
                case 10:
                    voiceResult = _d.sent();
                    if (voiceResult) {
                        messageContent = "".concat(exports.VOICE_MESSAGE_TRANSCRIPTION_PREFIX).concat(voiceResult.transcription);
                    }
                    // Voice transcription failed and no text — drop silently
                    if (hasVoiceAttachment && !voiceResult && !messageContent.trim()) {
                        return [2 /*return*/, { prompt: '', mode: 'opencode', skip: true }];
                    }
                    qs = extractQueueSuffix(messageContent);
                    return [4 /*yield*/, (0, message_formatting_js_1.getFileAttachments)(message)];
                case 11:
                    fileAttachments = _d.sent();
                    return [4 /*yield*/, (0, message_formatting_js_1.getTextAttachments)(message)];
                case 12:
                    textAttachmentsContent = _d.sent();
                    prompt = textAttachmentsContent
                        ? "".concat(qs.prompt, "\n\n").concat(textAttachmentsContent)
                        : qs.prompt;
                    if (shouldSkipEmptyPrompt({
                        message: message,
                        prompt: prompt,
                        images: fileAttachments,
                        hasVoiceAttachment: hasVoiceAttachment,
                    })) {
                        return [2 /*return*/, { prompt: '', mode: 'opencode', skip: true }];
                    }
                    return [2 /*return*/, {
                            prompt: prompt,
                            images: fileAttachments.length > 0 ? fileAttachments : undefined,
                            repliedMessage: repliedMessage,
                            mode: qs.forceQueue || (voiceResult === null || voiceResult === void 0 ? void 0 : voiceResult.queueMessage) ? 'local-queue' : 'opencode',
                            agent: voiceResult === null || voiceResult === void 0 ? void 0 : voiceResult.agent,
                        }];
            }
        });
    });
}
/**
 * Pre-process a message that starts a new session in a thread (no existing
 * session). Handles starter message context, voice transcription, and
 * text/file attachments.
 */
function preprocessNewSessionMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var agents, getClient, e_2, prompt, repliedMessage, voiceResult, starterMessage, starterTextAttachments, starterContent, starterText, qs;
        var message = _b.message, thread = _b.thread, projectDirectory = _b.projectDirectory, hasVoiceAttachment = _b.hasVoiceAttachment, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    logger.log("No session for thread ".concat(thread.id, ", starting new session"));
                    agents = [];
                    if (!(hasVoiceAttachment && projectDirectory)) return [3 /*break*/, 5];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 2:
                    getClient = _c.sent();
                    return [4 /*yield*/, fetchAvailableAgents(getClient, projectDirectory)];
                case 3:
                    agents = _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_2 = _c.sent();
                    voiceLogger.error("Could not fetch agents for voice transcription:", e_2);
                    return [3 /*break*/, 5];
                case 5:
                    prompt = (0, message_formatting_js_1.resolveMentions)(message);
                    return [4 /*yield*/, getRepliedMessageContext({ message: message })];
                case 6:
                    repliedMessage = _c.sent();
                    return [4 /*yield*/, (0, voice_handler_js_1.processVoiceAttachment)({
                            message: message,
                            thread: thread,
                            projectDirectory: projectDirectory,
                            appId: appId,
                            agents: agents,
                        })];
                case 7:
                    voiceResult = _c.sent();
                    if (voiceResult) {
                        prompt = "".concat(exports.VOICE_MESSAGE_TRANSCRIPTION_PREFIX).concat(voiceResult.transcription);
                    }
                    // Voice transcription failed and no text — drop silently
                    if (hasVoiceAttachment && !voiceResult && !prompt.trim()) {
                        return [2 /*return*/, { prompt: '', mode: 'opencode', skip: true }];
                    }
                    return [4 /*yield*/, thread
                            .fetchStarterMessage()
                            .catch(function (error) {
                            logger.warn("[SESSION] Failed to fetch starter message for thread ".concat(thread.id, ":"), error instanceof Error ? error.stack : String(error));
                            return null;
                        })];
                case 8:
                    starterMessage = _c.sent();
                    if (!(starterMessage && starterMessage.content !== message.content)) return [3 /*break*/, 10];
                    return [4 /*yield*/, (0, message_formatting_js_1.getTextAttachments)(starterMessage)];
                case 9:
                    starterTextAttachments = _c.sent();
                    starterContent = (0, message_formatting_js_1.resolveMentions)(starterMessage);
                    starterText = starterTextAttachments
                        ? "".concat(starterContent, "\n\n").concat(starterTextAttachments)
                        : starterContent;
                    if (starterText) {
                        prompt = "Context from thread:\n".concat(starterText, "\n\nUser request:\n").concat(prompt);
                    }
                    _c.label = 10;
                case 10:
                    qs = extractQueueSuffix(prompt);
                    if (shouldSkipEmptyPrompt({
                        message: message,
                        prompt: qs.prompt,
                        hasVoiceAttachment: hasVoiceAttachment,
                    })) {
                        return [2 /*return*/, { prompt: '', mode: 'opencode', skip: true }];
                    }
                    return [2 /*return*/, {
                            prompt: qs.prompt,
                            repliedMessage: repliedMessage,
                            mode: qs.forceQueue || (voiceResult === null || voiceResult === void 0 ? void 0 : voiceResult.queueMessage) ? 'local-queue' : 'opencode',
                            agent: voiceResult === null || voiceResult === void 0 ? void 0 : voiceResult.agent,
                        }];
            }
        });
    });
}
/**
 * Pre-process a message from a text channel (creates a new thread).
 * Handles voice transcription and file/text attachments.
 */
function preprocessNewThreadMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var agents, getClient, e_3, messageContent, repliedMessage, voiceResult, qs, fileAttachments, textAttachmentsContent, prompt;
        var message = _b.message, thread = _b.thread, projectDirectory = _b.projectDirectory, hasVoiceAttachment = _b.hasVoiceAttachment, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    agents = [];
                    if (!(hasVoiceAttachment && projectDirectory)) return [3 /*break*/, 5];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 2:
                    getClient = _c.sent();
                    return [4 /*yield*/, fetchAvailableAgents(getClient, projectDirectory)];
                case 3:
                    agents = _c.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_3 = _c.sent();
                    voiceLogger.error("Could not fetch agents for voice transcription:", e_3);
                    return [3 /*break*/, 5];
                case 5:
                    messageContent = (0, message_formatting_js_1.resolveMentions)(message);
                    return [4 /*yield*/, getRepliedMessageContext({ message: message })];
                case 6:
                    repliedMessage = _c.sent();
                    return [4 /*yield*/, (0, voice_handler_js_1.processVoiceAttachment)({
                            message: message,
                            thread: thread,
                            projectDirectory: projectDirectory,
                            isNewThread: true,
                            appId: appId,
                            agents: agents,
                        })];
                case 7:
                    voiceResult = _c.sent();
                    if (voiceResult) {
                        messageContent = "".concat(exports.VOICE_MESSAGE_TRANSCRIPTION_PREFIX).concat(voiceResult.transcription);
                    }
                    // Voice transcription failed and no text — drop silently
                    if (hasVoiceAttachment && !voiceResult && !messageContent.trim()) {
                        return [2 /*return*/, { prompt: '', mode: 'opencode', skip: true }];
                    }
                    qs = extractQueueSuffix(messageContent);
                    return [4 /*yield*/, (0, message_formatting_js_1.getFileAttachments)(message)];
                case 8:
                    fileAttachments = _c.sent();
                    return [4 /*yield*/, (0, message_formatting_js_1.getTextAttachments)(message)];
                case 9:
                    textAttachmentsContent = _c.sent();
                    prompt = textAttachmentsContent
                        ? "".concat(qs.prompt, "\n\n").concat(textAttachmentsContent)
                        : qs.prompt;
                    if (shouldSkipEmptyPrompt({
                        message: message,
                        prompt: prompt,
                        images: fileAttachments,
                        hasVoiceAttachment: hasVoiceAttachment,
                    })) {
                        return [2 /*return*/, { prompt: '', mode: 'opencode', skip: true }];
                    }
                    return [2 /*return*/, {
                            prompt: prompt,
                            images: fileAttachments.length > 0 ? fileAttachments : undefined,
                            repliedMessage: repliedMessage,
                            mode: qs.forceQueue || (voiceResult === null || voiceResult === void 0 ? void 0 : voiceResult.queueMessage) ? 'local-queue' : 'opencode',
                            agent: voiceResult === null || voiceResult === void 0 ? void 0 : voiceResult.agent,
                        }];
            }
        });
    });
}
