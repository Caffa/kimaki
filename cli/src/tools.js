"use strict";
// Voice assistant tool definitions for the GenAI worker.
// Provides tools for managing OpenCode sessions (create, submit, abort),
// listing chats, searching files, and reading session messages.
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
exports.getTools = getTools;
var ai_tool_js_1 = require("./ai-tool.js");
var zod_1 = require("zod");
var logger_js_1 = require("./logger.js");
var errore = require("errore");
var toolsLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.TOOLS);
var markdown_js_1 = require("./markdown.js");
var utils_js_1 = require("./utils.js");
var discord_bot_js_1 = require("./discord-bot.js");
function getTools(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var getClient, client, markdownRenderer, providersResponse, providers, getSessionModel, tools;
        var _this = this;
        var _c;
        var onMessageCompleted = _b.onMessageCompleted, directory = _b.directory;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, discord_bot_js_1.initializeOpencodeForDirectory)(directory)];
                case 1:
                    getClient = _d.sent();
                    if (getClient instanceof Error) {
                        throw new Error(getClient.message);
                    }
                    client = getClient();
                    markdownRenderer = new markdown_js_1.ShareMarkdown(client);
                    return [4 /*yield*/, client.config.providers()];
                case 2:
                    providersResponse = _d.sent();
                    providers = ((_c = providersResponse.data) === null || _c === void 0 ? void 0 : _c.providers) || [];
                    getSessionModel = function (sessionId) { return __awaiter(_this, void 0, void 0, function () {
                        var res, data, i, info, ai;
                        var _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0: return [4 /*yield*/, getClient().session.messages({ sessionID: sessionId })];
                                case 1:
                                    res = _b.sent();
                                    data = res.data;
                                    if (!data || data.length === 0)
                                        return [2 /*return*/, undefined];
                                    for (i = data.length - 1; i >= 0; i--) {
                                        info = (_a = data === null || data === void 0 ? void 0 : data[i]) === null || _a === void 0 ? void 0 : _a.info;
                                        if ((info === null || info === void 0 ? void 0 : info.role) === 'assistant') {
                                            ai = info;
                                            if (!ai.summary && ai.providerID && ai.modelID) {
                                                return [2 /*return*/, { providerID: ai.providerID, modelID: ai.modelID }];
                                            }
                                        }
                                    }
                                    return [2 /*return*/, undefined];
                            }
                        });
                    }); };
                    tools = {
                        submitMessage: (0, ai_tool_js_1.tool)({
                            description: 'Submit a message to an existing chat session. Does not wait for the message to complete',
                            inputSchema: zod_1.z.object({
                                sessionId: zod_1.z.string().describe('The session ID to send message to'),
                                message: zod_1.z.string().describe('The message text to send'),
                            }),
                            execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                var sessionModel;
                                var _this = this;
                                var sessionId = _b.sessionId, message = _b.message;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0: return [4 /*yield*/, getSessionModel(sessionId)
                                            // do not await
                                        ];
                                        case 1:
                                            sessionModel = _c.sent();
                                            // do not await
                                            getClient()
                                                .session.promptAsync({
                                                sessionID: sessionId,
                                                parts: [{ type: 'text', text: message }],
                                                model: sessionModel,
                                                system: (0, discord_bot_js_1.getOpencodeSystemMessage)({ sessionId: sessionId }),
                                            })
                                                .then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                                                var markdownResult;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, markdownRenderer.generate({
                                                                sessionID: sessionId,
                                                                lastAssistantOnly: true,
                                                            })];
                                                        case 1:
                                                            markdownResult = _a.sent();
                                                            onMessageCompleted === null || onMessageCompleted === void 0 ? void 0 : onMessageCompleted({
                                                                sessionId: sessionId,
                                                                messageId: '',
                                                                markdown: errore.unwrapOr(markdownResult, ''),
                                                            });
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); })
                                                .catch(function (error) {
                                                onMessageCompleted === null || onMessageCompleted === void 0 ? void 0 : onMessageCompleted({
                                                    sessionId: sessionId,
                                                    messageId: '',
                                                    error: error,
                                                });
                                            });
                                            return [2 /*return*/, {
                                                    success: true,
                                                    sessionId: sessionId,
                                                    directive: 'Tell user that message has been sent successfully',
                                                }];
                                    }
                                });
                            }); },
                        }),
                        createNewChat: (0, ai_tool_js_1.tool)({
                            description: 'Start a new chat session with an initial message. Does not wait for the message to complete',
                            inputSchema: zod_1.z.object({
                                message: zod_1.z
                                    .string()
                                    .describe('The initial message to start the chat with'),
                                title: zod_1.z.string().optional().describe('Optional title for the session'),
                                model: zod_1.z
                                    .object({
                                    providerId: zod_1.z
                                        .string()
                                        .describe('The provider ID (e.g., "anthropic", "openai")'),
                                    modelId: zod_1.z
                                        .string()
                                        .describe('The model ID (e.g., "claude-opus-4-20250514", "gpt-5")'),
                                })
                                    .optional()
                                    .describe('Optional model to use for this session'),
                            }),
                            execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                var session_1, error_1;
                                var _this = this;
                                var message = _b.message, title = _b.title;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            if (!message.trim()) {
                                                throw new Error("message must be a non empty string");
                                            }
                                            _c.label = 1;
                                        case 1:
                                            _c.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, getClient().session.create(__assign({}, (title ? { title: title } : {})))];
                                        case 2:
                                            session_1 = _c.sent();
                                            if (!session_1.data) {
                                                throw new Error('Failed to create session');
                                            }
                                            // do not await
                                            getClient()
                                                .session.promptAsync({
                                                sessionID: session_1.data.id,
                                                parts: [{ type: 'text', text: message }],
                                                system: (0, discord_bot_js_1.getOpencodeSystemMessage)({ sessionId: session_1.data.id }),
                                            })
                                                .then(function (response) { return __awaiter(_this, void 0, void 0, function () {
                                                var markdownResult;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, markdownRenderer.generate({
                                                                sessionID: session_1.data.id,
                                                                lastAssistantOnly: true,
                                                            })];
                                                        case 1:
                                                            markdownResult = _a.sent();
                                                            onMessageCompleted === null || onMessageCompleted === void 0 ? void 0 : onMessageCompleted({
                                                                sessionId: session_1.data.id,
                                                                messageId: '',
                                                                markdown: errore.unwrapOr(markdownResult, ''),
                                                            });
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); })
                                                .catch(function (error) {
                                                onMessageCompleted === null || onMessageCompleted === void 0 ? void 0 : onMessageCompleted({
                                                    sessionId: session_1.data.id,
                                                    messageId: '',
                                                    error: error,
                                                });
                                            });
                                            return [2 /*return*/, {
                                                    success: true,
                                                    sessionId: session_1.data.id,
                                                    title: session_1.data.title,
                                                }];
                                        case 3:
                                            error_1 = _c.sent();
                                            return [2 /*return*/, {
                                                    success: false,
                                                    error: error_1 instanceof Error
                                                        ? error_1.message
                                                        : 'Failed to create chat session',
                                                }];
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); },
                        }),
                        listChats: (0, ai_tool_js_1.tool)({
                            description: 'Get a list of available chat sessions sorted by most recent',
                            inputSchema: zod_1.z.object({}),
                            execute: function () { return __awaiter(_this, void 0, void 0, function () {
                                var sessions, sortedSessions, sessionList, resolvedList;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            toolsLogger.log("Listing opencode sessions");
                                            return [4 /*yield*/, getClient().session.list()];
                                        case 1:
                                            sessions = _a.sent();
                                            if (!sessions.data) {
                                                return [2 /*return*/, { success: false, error: 'No sessions found' }];
                                            }
                                            sortedSessions = __spreadArray([], sessions.data, true).sort(function (a, b) {
                                                return b.time.updated - a.time.updated;
                                            })
                                                .slice(0, 20);
                                            sessionList = sortedSessions.map(function (session) { return __awaiter(_this, void 0, void 0, function () {
                                                var finishedAt, status;
                                                var _this = this;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            finishedAt = session.time.updated;
                                                            return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                                                                    var messagesResponse, messages, lastMessage;
                                                                    return __generator(this, function (_a) {
                                                                        switch (_a.label) {
                                                                            case 0:
                                                                                if (session.revert)
                                                                                    return [2 /*return*/, 'error'];
                                                                                return [4 /*yield*/, getClient().session.messages({
                                                                                        sessionID: session.id,
                                                                                    })];
                                                                            case 1:
                                                                                messagesResponse = _a.sent();
                                                                                messages = messagesResponse.data || [];
                                                                                lastMessage = messages[messages.length - 1];
                                                                                if ((lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.info.role) === 'assistant' &&
                                                                                    !lastMessage.info.time.completed) {
                                                                                    return [2 /*return*/, 'in_progress'];
                                                                                }
                                                                                return [2 /*return*/, 'finished'];
                                                                        }
                                                                    });
                                                                }); })()];
                                                        case 1:
                                                            status = _a.sent();
                                                            return [2 /*return*/, {
                                                                    id: session.id,
                                                                    folder: session.directory,
                                                                    status: status,
                                                                    finishedAt: (0, utils_js_1.formatDistanceToNow)(new Date(finishedAt)),
                                                                    title: session.title,
                                                                    prompt: session.title,
                                                                }];
                                                    }
                                                });
                                            }); });
                                            return [4 /*yield*/, Promise.all(sessionList)];
                                        case 2:
                                            resolvedList = _a.sent();
                                            return [2 /*return*/, {
                                                    success: true,
                                                    sessions: resolvedList,
                                                }];
                                    }
                                });
                            }); },
                        }),
                        searchFiles: (0, ai_tool_js_1.tool)({
                            description: 'Search for files in a folder',
                            inputSchema: zod_1.z.object({
                                folder: zod_1.z
                                    .string()
                                    .optional()
                                    .describe('The folder path to search in, optional. only use if user specifically asks for it'),
                                query: zod_1.z.string().describe('The search query for files'),
                            }),
                            execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                var results;
                                var folder = _b.folder, query = _b.query;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0: return [4 /*yield*/, getClient().find.files({
                                                query: query,
                                                directory: folder,
                                            })];
                                        case 1:
                                            results = _c.sent();
                                            return [2 /*return*/, {
                                                    success: true,
                                                    files: results.data || [],
                                                }];
                                    }
                                });
                            }); },
                        }),
                        readSessionMessages: (0, ai_tool_js_1.tool)({
                            description: 'Read messages from a chat session',
                            inputSchema: zod_1.z.object({
                                sessionId: zod_1.z.string().describe('The session ID to read messages from'),
                                lastAssistantOnly: zod_1.z
                                    .boolean()
                                    .optional()
                                    .describe('Only read the last assistant message'),
                            }),
                            execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                var messages, assistantMessages, lastMessage, status_1, markdownResult, markdownResult, messages, lastMessage, status_2;
                                var _c;
                                var sessionId = _b.sessionId, _d = _b.lastAssistantOnly, lastAssistantOnly = _d === void 0 ? false : _d;
                                return __generator(this, function (_e) {
                                    switch (_e.label) {
                                        case 0:
                                            if (!lastAssistantOnly) return [3 /*break*/, 3];
                                            return [4 /*yield*/, getClient().session.messages({
                                                    sessionID: sessionId,
                                                })];
                                        case 1:
                                            messages = _e.sent();
                                            if (!messages.data) {
                                                return [2 /*return*/, { success: false, error: 'No messages found' }];
                                            }
                                            assistantMessages = messages.data.filter(function (m) { return m.info.role === 'assistant'; });
                                            if (assistantMessages.length === 0) {
                                                return [2 /*return*/, {
                                                        success: false,
                                                        error: 'No assistant messages found',
                                                    }];
                                            }
                                            lastMessage = assistantMessages[assistantMessages.length - 1];
                                            status_1 = 'completed' in lastMessage.info.time &&
                                                lastMessage.info.time.completed
                                                ? 'completed'
                                                : 'in_progress';
                                            return [4 /*yield*/, markdownRenderer.generate({
                                                    sessionID: sessionId,
                                                    lastAssistantOnly: true,
                                                })];
                                        case 2:
                                            markdownResult = _e.sent();
                                            if (markdownResult instanceof Error) {
                                                throw new Error(markdownResult.message);
                                            }
                                            return [2 /*return*/, {
                                                    success: true,
                                                    markdown: markdownResult,
                                                    status: status_1,
                                                }];
                                        case 3: return [4 /*yield*/, markdownRenderer.generate({
                                                sessionID: sessionId,
                                            })];
                                        case 4:
                                            markdownResult = _e.sent();
                                            if (markdownResult instanceof Error) {
                                                throw new Error(markdownResult.message);
                                            }
                                            return [4 /*yield*/, getClient().session.messages({
                                                    sessionID: sessionId,
                                                })];
                                        case 5:
                                            messages = _e.sent();
                                            lastMessage = (_c = messages.data) === null || _c === void 0 ? void 0 : _c[messages.data.length - 1];
                                            status_2 = (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.info.role) === 'assistant' &&
                                                (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.info.time) &&
                                                'completed' in lastMessage.info.time &&
                                                !lastMessage.info.time.completed
                                                ? 'in_progress'
                                                : 'completed';
                                            return [2 /*return*/, {
                                                    success: true,
                                                    markdown: markdownResult,
                                                    status: status_2,
                                                }];
                                    }
                                });
                            }); },
                        }),
                        abortChat: (0, ai_tool_js_1.tool)({
                            description: 'Abort/stop an in-progress chat session',
                            inputSchema: zod_1.z.object({
                                sessionId: zod_1.z.string().describe('The session ID to abort'),
                            }),
                            execute: function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                                var result, error_2;
                                var sessionId = _b.sessionId;
                                return __generator(this, function (_c) {
                                    switch (_c.label) {
                                        case 0:
                                            _c.trys.push([0, 2, , 3]);
                                            toolsLogger.log("[ABORT] reason=voice-tool sessionId=".concat(sessionId, " - user requested abort via voice assistant tool"));
                                            return [4 /*yield*/, getClient().session.abort({
                                                    sessionID: sessionId,
                                                })];
                                        case 1:
                                            result = _c.sent();
                                            if (!result.data) {
                                                return [2 /*return*/, {
                                                        success: false,
                                                        error: 'Failed to abort session',
                                                    }];
                                            }
                                            return [2 /*return*/, {
                                                    success: true,
                                                    sessionId: sessionId,
                                                    message: 'Session aborted successfully',
                                                }];
                                        case 2:
                                            error_2 = _c.sent();
                                            return [2 /*return*/, {
                                                    success: false,
                                                    error: error_2 instanceof Error ? error_2.message : 'Unknown error occurred',
                                                }];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); },
                        }),
                        getModels: (0, ai_tool_js_1.tool)({
                            description: 'Get all available AI models from all providers',
                            inputSchema: zod_1.z.object({}),
                            execute: function () { return __awaiter(_this, void 0, void 0, function () {
                                var providersResponse_1, providers_1, models_1, error_3;
                                var _a;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0:
                                            _b.trys.push([0, 2, , 3]);
                                            return [4 /*yield*/, getClient().config.providers()];
                                        case 1:
                                            providersResponse_1 = _b.sent();
                                            providers_1 = ((_a = providersResponse_1.data) === null || _a === void 0 ? void 0 : _a.providers) || [];
                                            models_1 = [];
                                            providers_1.forEach(function (provider) {
                                                if (provider.models && typeof provider.models === 'object') {
                                                    Object.entries(provider.models).forEach(function (_a) {
                                                        var modelId = _a[0], model = _a[1];
                                                        models_1.push({
                                                            providerId: provider.id,
                                                            modelId: modelId,
                                                        });
                                                    });
                                                }
                                            });
                                            return [2 /*return*/, {
                                                    success: true,
                                                    models: models_1,
                                                    totalCount: models_1.length,
                                                }];
                                        case 2:
                                            error_3 = _b.sent();
                                            return [2 /*return*/, {
                                                    success: false,
                                                    error: error_3 instanceof Error ? error_3.message : 'Failed to fetch models',
                                                    models: [],
                                                }];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); },
                        }),
                    };
                    return [2 /*return*/, {
                            tools: tools,
                            providers: providers,
                        }];
            }
        });
    });
}
