"use strict";
// E2e test for question tool: user text message during pending question should
// dismiss the question (abort), then enqueue as a normal user prompt.
// The user's message must appear as a real user message in the thread, not
// get consumed as a tool result answer (which lost voice/image content).
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
var vitest_1 = require("vitest");
var queue_advanced_e2e_setup_js_1 = require("./queue-advanced-e2e-setup.js");
var test_utils_js_1 = require("./test-utils.js");
var store_js_1 = require("./store.js");
var opencode_js_1 = require("./opencode.js");
var database_js_1 = require("./database.js");
var TEXT_CHANNEL_ID = '200000000000001007';
var VOICE_CHANNEL_ID = '200000000000001017';
function setDeterministicTranscription(config) {
    store_js_1.store.setState({
        test: { deterministicTranscription: config },
    });
}
function getOpencodeClientForTest(projectDirectory) {
    var client = (0, opencode_js_1.getOpencodeClient)(projectDirectory);
    if (!client) {
        throw new Error('OpenCode client not found for project directory');
    }
    return client;
}
function getTextFromParts(parts) {
    return parts.flatMap(function (part) {
        if (part.type === 'text') {
            return [part.text];
        }
        return [];
    });
}
function normalizeSessionText(text) {
    return text
        .replace(/\[current git branch is [^\]]+\]/g, '')
        .replace(/<discord-user[^>]*\/>/g, '<discord-user />')
        .trim();
}
function getSessionRoleTextTimeline(messages) {
    return messages.flatMap(function (message) {
        var text = normalizeSessionText(getTextFromParts(message.parts).join(''));
        if (!text.trim()) {
            return [];
        }
        return [{ role: message.info.role, text: text }];
    });
}
function getSessionMessageSummary(messages) {
    return messages.map(function (message) {
        return {
            role: message.info.role,
            parts: message.parts.map(function (part) {
                if (part.type === 'text') {
                    return {
                        type: part.type,
                        text: normalizeSessionText(part.text),
                    };
                }
                if (part.type === 'tool') {
                    return {
                        type: part.type,
                        tool: part.tool,
                        status: part.state.status,
                        title: part.state.status === 'completed' ? part.state.title : undefined,
                        output: part.state.status === 'completed' ? part.state.output : undefined,
                    };
                }
                return { type: part.type };
            }),
        };
    });
}
function waitForSessionMessages(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var client, start, response, messages, finalResponse;
        var _c, _d;
        var projectDirectory = _b.projectDirectory, sessionId = _b.sessionId, timeoutMs = _b.timeoutMs, predicate = _b.predicate;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    client = getOpencodeClientForTest(projectDirectory);
                    start = Date.now();
                    _e.label = 1;
                case 1:
                    if (!(Date.now() - start < timeoutMs)) return [3 /*break*/, 4];
                    return [4 /*yield*/, client.session.messages({
                            sessionID: sessionId,
                            directory: projectDirectory,
                        })];
                case 2:
                    response = _e.sent();
                    messages = (_c = response.data) !== null && _c !== void 0 ? _c : [];
                    if (predicate(messages)) {
                        return [2 /*return*/, messages];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 3:
                    _e.sent();
                    return [3 /*break*/, 1];
                case 4: return [4 /*yield*/, client.session.messages({
                        sessionID: sessionId,
                        directory: projectDirectory,
                    })];
                case 5:
                    finalResponse = _e.sent();
                    return [2 /*return*/, (_d = finalResponse.data) !== null && _d !== void 0 ? _d : []];
            }
        });
    });
}
(0, vitest_1.describe)('queue advanced: question tool answer', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: TEXT_CHANNEL_ID,
        channelName: 'qa-question-e2e',
        dirName: 'qa-question-e2e',
        username: 'queue-question-tester',
    });
    (0, vitest_1.afterEach)(function () {
        setDeterministicTranscription(null);
    });
    (0, vitest_1.test)('user text message dismisses pending question and enqueues as normal prompt', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, timeline;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'QUESTION_TEXT_ANSWER_MARKER',
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 8000,
                            predicate: function (t) {
                                return t.name === 'QUESTION_TEXT_ANSWER_MARKER';
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = ctx.discord.thread(thread.id);
                    // Wait for the question dropdown message to appear in Discord.
                    // This is the user-visible signal that the question tool fired and
                    // kimaki processed the event. Avoids polling internal Maps which
                    // have timing sensitivity on slower CI hardware.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: 'Which option do you prefer?',
                            timeout: 12000,
                        })
                        // User sends a text message while question is pending.
                        // This should:
                        // 1. Dismiss the pending question (cleanup context)
                        // 2. Abort the blocked session so OpenCode unblocks
                        // 3. Enqueue the message as a normal user prompt (not consumed as answer)
                    ];
                case 3:
                    // Wait for the question dropdown message to appear in Discord.
                    // This is the user-visible signal that the question tool fired and
                    // kimaki processed the event. Avoids polling internal Maps which
                    // have timing sensitivity on slower CI hardware.
                    _a.sent();
                    // User sends a text message while question is pending.
                    // This should:
                    // 1. Dismiss the pending question (cleanup context)
                    // 2. Abort the blocked session so OpenCode unblocks
                    // 3. Enqueue the message as a normal user prompt (not consumed as answer)
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                            content: 'my text answer',
                        })
                        // Give time for question cleanup to propagate
                    ];
                case 4:
                    // User sends a text message while question is pending.
                    // This should:
                    // 1. Dismiss the pending question (cleanup context)
                    // 2. Abort the blocked session so OpenCode unblocks
                    // 3. Enqueue the message as a normal user prompt (not consumed as answer)
                    _a.sent();
                    // Give time for question cleanup to propagate
                    return [4 /*yield*/, new Promise(function (r) {
                            setTimeout(r, 1000);
                        })];
                case 5:
                    // Give time for question cleanup to propagate
                    _a.sent();
                    return [4 /*yield*/, th.text({ showInteractions: true })
                        // The user's text answer must appear in Discord
                    ];
                case 6:
                    timeline = _a.sent();
                    // The user's text answer must appear in Discord
                    (0, vitest_1.expect)(timeline).toContain('my text answer');
                    // The original question must have appeared
                    (0, vitest_1.expect)(timeline).toContain('Which option do you prefer?');
                    // The user's marker message triggered the question
                    (0, vitest_1.expect)(timeline).toContain('QUESTION_TEXT_ANSWER_MARKER');
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
(0, vitest_1.describe)('queue advanced: voice message during pending question', function () {
    var ctx = (0, queue_advanced_e2e_setup_js_1.setupQueueAdvancedSuite)({
        channelId: VOICE_CHANNEL_ID,
        channelName: 'qa-question-voice-e2e',
        dirName: 'qa-question-voice-e2e',
        username: 'queue-question-tester',
    });
    (0, vitest_1.afterEach)(function () {
        setDeterministicTranscription(null);
    });
    (0, vitest_1.test)('voice message during pending question dismisses question and transcribes normally', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, sessionId, sessionMessages, sessionTimeline, sessionSummary, latestUserText, assistantTexts, timeline;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // This is the exact bug scenario: user sends a voice message while a
                // question dropdown is pending. Voice messages have empty message.content
                // (audio is in attachments, transcription happens later). The old code
                // passed "" as the question answer and consumed the message — the voice
                // content was completely lost.
                return [4 /*yield*/, ctx.discord.channel(VOICE_CHANNEL_ID).user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendMessage({
                        content: 'QUESTION_TEXT_ANSWER_MARKER',
                    })];
                case 1:
                    // This is the exact bug scenario: user sends a voice message while a
                    // question dropdown is pending. Voice messages have empty message.content
                    // (audio is in attachments, transcription happens later). The old code
                    // passed "" as the question answer and consumed the message — the voice
                    // content was completely lost.
                    _b.sent();
                    return [4 /*yield*/, ctx.discord.channel(VOICE_CHANNEL_ID).waitForThread({
                            timeout: 8000,
                            predicate: function (t) {
                                return t.name === 'QUESTION_TEXT_ANSWER_MARKER';
                            },
                        })];
                case 2:
                    thread = _b.sent();
                    th = ctx.discord.thread(thread.id);
                    // Wait for the question dropdown message to appear in Discord
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: 'Which option do you prefer?',
                            timeout: 12000,
                        })
                        // Send a voice message while the question is pending.
                        // Reproduction: Discord voice messages can still carry non-empty
                        // message.content. The bug consumed that raw text before transcription,
                        // so the session never received the spoken content.
                    ];
                case 3:
                    // Wait for the question dropdown message to appear in Discord
                    _b.sent();
                    // Send a voice message while the question is pending.
                    // Reproduction: Discord voice messages can still carry non-empty
                    // message.content. The bug consumed that raw text before transcription,
                    // so the session never received the spoken content.
                    setDeterministicTranscription({
                        transcription: 'I want option Alpha please',
                        queueMessage: false,
                    });
                    return [4 /*yield*/, th.user(queue_advanced_e2e_setup_js_1.TEST_USER_ID).sendVoiceMessage({
                            content: 'VOICE_TEXT_CONTENT_SHOULD_NOT_REACH_MODEL',
                        })
                        // Give time for question cleanup to propagate
                    ];
                case 4:
                    _b.sent();
                    // Give time for question cleanup to propagate
                    return [4 /*yield*/, new Promise(function (r) {
                            setTimeout(r, 1000);
                        })
                        // Voice content should be transcribed and appear as the next user message,
                        // processed after the model responds to the empty question answer.
                    ];
                case 5:
                    // Give time for question cleanup to propagate
                    _b.sent();
                    // Voice content should be transcribed and appear as the next user message,
                    // processed after the model responds to the empty question answer.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            text: 'I want option Alpha please',
                            timeout: 8000,
                        })];
                case 6:
                    // Voice content should be transcribed and appear as the next user message,
                    // processed after the model responds to the empty question answer.
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: ctx.discord,
                            threadId: thread.id,
                            timeout: 8000,
                            afterMessageIncludes: 'I want option Alpha please',
                            afterAuthorId: ctx.discord.botUserId,
                        })];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(thread.id)];
                case 8:
                    sessionId = _b.sent();
                    (0, vitest_1.expect)(sessionId).toBeTruthy();
                    return [4 /*yield*/, waitForSessionMessages({
                            projectDirectory: ctx.directories.projectDirectory,
                            sessionId: sessionId,
                            timeoutMs: 8000,
                            predicate: function (messages) {
                                var timeline = getSessionRoleTextTimeline(messages);
                                return timeline.some(function (entry) {
                                    return entry.text.includes('I want option Alpha please');
                                });
                            },
                        })];
                case 9:
                    sessionMessages = _b.sent();
                    sessionTimeline = getSessionRoleTextTimeline(sessionMessages);
                    sessionSummary = getSessionMessageSummary(sessionMessages);
                    latestUserText = (_a = sessionTimeline
                        .filter(function (entry) {
                        return entry.role === 'user';
                    })
                        .at(-1)) === null || _a === void 0 ? void 0 : _a.text;
                    assistantTexts = sessionTimeline.flatMap(function (entry) {
                        if (entry.role === 'assistant') {
                            return [entry.text];
                        }
                        return [];
                    });
                    (0, vitest_1.expect)(latestUserText).toContain('I want option Alpha please');
                    (0, vitest_1.expect)(latestUserText).not.toContain('VOICE_TEXT_CONTENT_SHOULD_NOT_REACH_MODEL');
                    (0, vitest_1.expect)(assistantTexts).toContain('ok');
                    (0, vitest_1.expect)(sessionSummary.some(function (message) {
                        return message.role === 'user'
                            && message.parts.some(function (part) {
                                return part.type === 'text' && part.text.includes('I want option Alpha please');
                            });
                    })).toBe(true);
                    (0, vitest_1.expect)(sessionSummary.some(function (message) {
                        return message.role === 'assistant'
                            && message.parts.some(function (part) {
                                return part.type === 'text' && part.text === 'ok';
                            });
                    })).toBe(true);
                    return [4 /*yield*/, th.text({ showInteractions: true })];
                case 10:
                    timeline = _b.sent();
                    (0, vitest_1.expect)(timeline).toContain('QUESTION_TEXT_ANSWER_MARKER');
                    (0, vitest_1.expect)(timeline).toContain('Which option do you prefer?');
                    (0, vitest_1.expect)(timeline).toContain('VOICE_TEXT_CONTENT_SHOULD_NOT_REACH_MODEL');
                    (0, vitest_1.expect)(timeline).toContain('🎤 Transcribing voice message...');
                    (0, vitest_1.expect)(timeline).toContain('📝 **Transcribed message:** I want option Alpha please');
                    (0, vitest_1.expect)(timeline).toContain('⬥ ok');
                    // Voice content must be present as a real transcribed message, not lost
                    (0, vitest_1.expect)(timeline).toContain('I want option Alpha please');
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
