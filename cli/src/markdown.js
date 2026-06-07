"use strict";
// Session-to-markdown renderer for sharing.
// Generates shareable markdown from OpenCode sessions, formatting
// user messages, assistant responses, tool calls, and reasoning blocks.
// Uses errore for type-safe error handling.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ShareMarkdown = void 0;
exports.getCompactSessionContext = getCompactSessionContext;
exports.getLastSessionId = getLastSessionId;
var errore = require("errore");
var errore_1 = require("errore");
var yaml_1 = require("yaml");
var utils_js_1 = require("./utils.js");
var xml_js_1 = require("./xml.js");
var logger_js_1 = require("./logger.js");
var errors_js_1 = require("./errors.js");
// Generic error for unexpected exceptions in async operations
var UnexpectedError = /** @class */ (function (_super) {
    __extends(UnexpectedError, _super);
    function UnexpectedError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return UnexpectedError;
}((0, errore_1.createTaggedError)({
    name: 'UnexpectedError',
})));
var markdownLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.MARKDOWN);
var TOOL_OUTPUT_MAX_CHARS = 30000;
var ShareMarkdown = /** @class */ (function () {
    function ShareMarkdown(client) {
        this.client = client;
    }
    /**
     * Generate a markdown representation of a session
     * @param options Configuration options
     * @returns Error or markdown string
     */
    ShareMarkdown.prototype.generate = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionID, includeSystemInfo, lastAssistantOnly, sessionResponse, session, messagesResponse, messages, messagesToRender, lines, _i, messagesToRender_1, message, messageLines;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        sessionID = options.sessionID, includeSystemInfo = options.includeSystemInfo, lastAssistantOnly = options.lastAssistantOnly;
                        return [4 /*yield*/, this.client.session.get({
                                sessionID: sessionID,
                            })];
                    case 1:
                        sessionResponse = _a.sent();
                        if (!sessionResponse.data) {
                            return [2 /*return*/, new errors_js_1.SessionNotFoundError({ sessionId: sessionID })];
                        }
                        session = sessionResponse.data;
                        return [4 /*yield*/, this.client.session.messages({
                                sessionID: sessionID,
                            })];
                    case 2:
                        messagesResponse = _a.sent();
                        if (!messagesResponse.data) {
                            return [2 /*return*/, new errors_js_1.MessagesNotFoundError({ sessionId: sessionID })];
                        }
                        messages = messagesResponse.data;
                        messagesToRender = lastAssistantOnly
                            ? (function () {
                                var assistantMessages = messages.filter(function (m) { return m.info.role === 'assistant'; });
                                return assistantMessages.length > 0
                                    ? [assistantMessages[assistantMessages.length - 1]]
                                    : [];
                            })()
                            : messages;
                        lines = [];
                        // Only include header and session info if not lastAssistantOnly
                        if (!lastAssistantOnly) {
                            // Header
                            lines.push("# ".concat(session.title || 'Untitled Session'));
                            lines.push('');
                            // Session metadata
                            if (includeSystemInfo === true) {
                                lines.push('## Session Information');
                                lines.push('');
                                lines.push("- **Created**: ".concat((0, utils_js_1.formatDateTime)(new Date(session.time.created))));
                                lines.push("- **Updated**: ".concat((0, utils_js_1.formatDateTime)(new Date(session.time.updated))));
                                if (session.version) {
                                    lines.push("- **OpenCode Version**: v".concat(session.version));
                                }
                                lines.push('');
                            }
                            // Process messages
                            lines.push('## Conversation');
                            lines.push('');
                        }
                        for (_i = 0, messagesToRender_1 = messagesToRender; _i < messagesToRender_1.length; _i++) {
                            message = messagesToRender_1[_i];
                            messageLines = this.renderMessage(message.info, message.parts);
                            lines.push.apply(lines, messageLines);
                            lines.push('');
                        }
                        return [2 /*return*/, lines.join('\n')];
                }
            });
        });
    };
    ShareMarkdown.prototype.renderMessage = function (message, parts) {
        var _a;
        var lines = [];
        if (message.role === 'user') {
            lines.push('### 👤 User');
            lines.push('');
            for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
                var part = parts_1[_i];
                if (part.type === 'text' && part.text) {
                    var cleanedText = (0, xml_js_1.extractNonXmlContent)(part.text);
                    if (cleanedText.trim()) {
                        lines.push(cleanedText);
                        lines.push('');
                    }
                }
                else if (part.type === 'file') {
                    lines.push("\uD83D\uDCCE **Attachment**: ".concat(part.filename || 'unnamed file'));
                    if (part.url) {
                        lines.push("   - URL: ".concat(part.url));
                    }
                    lines.push('');
                }
            }
        }
        else if (message.role === 'assistant') {
            lines.push("### \uD83E\uDD16 Assistant (".concat(message.modelID || 'unknown model', ")"));
            lines.push('');
            // Filter and process parts
            var filteredParts = parts.filter(function (part) {
                if (part.type === 'step-start' && parts.indexOf(part) > 0)
                    return false;
                if (part.type === 'snapshot')
                    return false;
                if (part.type === 'patch')
                    return false;
                if (part.type === 'step-finish')
                    return false;
                if (part.type === 'text' && part.synthetic === true)
                    return false;
                if (part.type === 'tool' && part.tool === 'todoread')
                    return false;
                if (part.type === 'text' && !part.text)
                    return false;
                if (part.type === 'tool' &&
                    (part.state.status === 'pending' || part.state.status === 'running'))
                    return false;
                return true;
            });
            for (var _b = 0, filteredParts_1 = filteredParts; _b < filteredParts_1.length; _b++) {
                var part = filteredParts_1[_b];
                var partLines = this.renderPart(part, message);
                lines.push.apply(lines, partLines);
            }
            // Add completion time if available
            if ((_a = message.time) === null || _a === void 0 ? void 0 : _a.completed) {
                var duration = message.time.completed - message.time.created;
                lines.push('');
                lines.push("*Completed in ".concat(this.formatDuration(duration), "*"));
            }
        }
        return lines;
    };
    ShareMarkdown.prototype.renderPart = function (part, message) {
        var _a, _b;
        var lines = [];
        switch (part.type) {
            case 'text':
                if (part.text) {
                    lines.push(part.text);
                    lines.push('');
                }
                break;
            case 'reasoning':
                if (part.text) {
                    lines.push('<details>');
                    lines.push('<summary>💭 Thinking</summary>');
                    lines.push('');
                    lines.push(part.text);
                    lines.push('');
                    lines.push('</details>');
                    lines.push('');
                }
                break;
            case 'tool':
                if (part.state.status === 'completed') {
                    var output = part.state.output || '';
                    var isOversized = output.length > TOOL_OUTPUT_MAX_CHARS;
                    if (isOversized) {
                        lines.push("> \u26A0\uFE0F **Large tool output** (".concat(output.length.toLocaleString(), " chars, truncated to ").concat(TOOL_OUTPUT_MAX_CHARS.toLocaleString(), ")"));
                        lines.push('');
                    }
                    lines.push("#### \uD83D\uDEE0\uFE0F Tool: ".concat(part.tool));
                    lines.push('');
                    // Render input parameters in YAML
                    if (part.state.input && Object.keys(part.state.input).length > 0) {
                        lines.push('**Input:**');
                        lines.push('```yaml');
                        lines.push(yaml_1.default.stringify(part.state.input, null, { lineWidth: 0 }));
                        lines.push('```');
                        lines.push('');
                    }
                    // Render output, truncated if too large
                    if (output) {
                        lines.push('**Output:**');
                        lines.push('```');
                        lines.push(isOversized
                            ? output.slice(0, TOOL_OUTPUT_MAX_CHARS) +
                                '\n...(truncated)'
                            : output);
                        lines.push('```');
                        lines.push('');
                    }
                    // Add timing info if significant
                    if (((_a = part.state.time) === null || _a === void 0 ? void 0 : _a.start) && ((_b = part.state.time) === null || _b === void 0 ? void 0 : _b.end)) {
                        var duration = part.state.time.end - part.state.time.start;
                        if (duration > 2000) {
                            lines.push("*Duration: ".concat(this.formatDuration(duration), "*"));
                            lines.push('');
                        }
                    }
                }
                else if (part.state.status === 'error') {
                    lines.push("#### \u274C Tool Error: ".concat(part.tool));
                    lines.push('');
                    lines.push('```');
                    lines.push(part.state.error || 'Unknown error');
                    lines.push('```');
                    lines.push('');
                }
                break;
            case 'step-start':
                lines.push("**Started using ".concat(message.providerID, "/").concat(message.modelID, "**"));
                lines.push('');
                break;
        }
        return lines;
    };
    ShareMarkdown.prototype.formatDuration = function (ms) {
        if (ms < 1000)
            return "".concat(ms, "ms");
        if (ms < 60000)
            return "".concat((ms / 1000).toFixed(1), "s");
        var minutes = Math.floor(ms / 60000);
        var seconds = Math.floor((ms % 60000) / 1000);
        return "".concat(minutes, "m ").concat(seconds, "s");
    };
    return ShareMarkdown;
}());
exports.ShareMarkdown = ShareMarkdown;
/**
 * Generate compact session context for voice transcription.
 * Includes system prompt (optional), user messages, assistant text,
 * and tool calls in compact form (name + params only, no output).
 */
function getCompactSessionContext(_a) {
    var _this = this;
    var client = _a.client, sessionId = _a.sessionId, _b = _a.includeSystemPrompt, includeSystemPrompt = _b === void 0 ? false : _b, _c = _a.maxMessages, maxMessages = _c === void 0 ? 20 : _c;
    return errore.tryAsync({
        try: function () { return __awaiter(_this, void 0, void 0, function () {
            var messagesResponse, messages, lines, firstAssistant, systemPart, truncated, recentMessages, _i, recentMessages_1, msg, textParts, textParts, toolParts, _loop_1, _a, toolParts_1, part;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, client.session.messages({
                            sessionID: sessionId,
                        })];
                    case 1:
                        messagesResponse = _c.sent();
                        messages = messagesResponse.data || [];
                        lines = [];
                        // Get system prompt if requested
                        // Note: OpenCode SDK doesn't expose system prompt directly. We try multiple approaches:
                        // 1. session.system field (if available in future SDK versions)
                        // 2. synthetic text part in first assistant message (current approach)
                        if (includeSystemPrompt && messages.length > 0) {
                            firstAssistant = messages.find(function (m) { return m.info.role === 'assistant'; });
                            if (firstAssistant) {
                                systemPart = (firstAssistant.parts || []).find(function (p) { return p.type === 'text' && p.synthetic === true; });
                                if (systemPart && 'text' in systemPart && systemPart.text) {
                                    lines.push('[System Prompt]');
                                    truncated = systemPart.text.slice(0, 3000);
                                    lines.push(truncated);
                                    if (systemPart.text.length > 3000) {
                                        lines.push('...(truncated)');
                                    }
                                    lines.push('');
                                }
                            }
                        }
                        recentMessages = messages.slice(-maxMessages);
                        for (_i = 0, recentMessages_1 = recentMessages; _i < recentMessages_1.length; _i++) {
                            msg = recentMessages_1[_i];
                            if (msg.info.role === 'user') {
                                textParts = (msg.parts || [])
                                    .filter(function (p) { return p.type === 'text'; })
                                    .map(function (p) { return (p.type === 'text' ? (0, xml_js_1.extractNonXmlContent)(p.text || '') : ''); })
                                    .filter(Boolean);
                                if (textParts.length > 0) {
                                    lines.push("[User]: ".concat(textParts.join(' ').slice(0, 1000)));
                                    lines.push('');
                                }
                            }
                            else if (msg.info.role === 'assistant') {
                                textParts = (msg.parts || [])
                                    .filter(function (p) { return p.type === 'text' && !p.synthetic && p.text; })
                                    .map(function (p) { return (p.type === 'text' ? p.text : ''); })
                                    .filter(Boolean);
                                if (textParts.length > 0) {
                                    lines.push("[Assistant]: ".concat(textParts.join(' ').slice(0, 1000)));
                                    lines.push('');
                                }
                                toolParts = (msg.parts || []).filter(function (p) {
                                    var _a;
                                    return p.type === 'tool' &&
                                        ((_a = p.state) === null || _a === void 0 ? void 0 : _a.status) === 'completed';
                                });
                                _loop_1 = function (part) {
                                    if (part.type === 'tool') {
                                        var toolName = part.tool;
                                        // skip noisy tools
                                        if (toolName === 'todoread' || toolName === 'todowrite') {
                                            return "continue";
                                        }
                                        var input = ((_b = part.state) === null || _b === void 0 ? void 0 : _b.input) || {};
                                        var normalize_1 = function (value) {
                                            return value.replace(/\s+/g, ' ').trim();
                                        };
                                        // compact params: just key=value on one line
                                        var params = Object.entries(input)
                                            .map(function (_a) {
                                            var k = _a[0], v = _a[1];
                                            var val = typeof v === 'string'
                                                ? v.slice(0, 100)
                                                : JSON.stringify(v).slice(0, 100);
                                            return "".concat(k, "=").concat(normalize_1(val));
                                        })
                                            .join(', ');
                                        lines.push("[Tool ".concat(toolName, "]: ").concat(params));
                                    }
                                };
                                for (_a = 0, toolParts_1 = toolParts; _a < toolParts_1.length; _a++) {
                                    part = toolParts_1[_a];
                                    _loop_1(part);
                                }
                            }
                        }
                        return [2 /*return*/, lines.join('\n').slice(0, 8000)];
                }
            });
        }); },
        catch: function (e) {
            markdownLogger.error('Failed to get compact session context:', e);
            return new UnexpectedError({
                message: 'Failed to get compact session context',
                cause: e,
            });
        },
    });
}
/**
 * Get the last session for a directory (excluding the current one).
 */
function getLastSessionId(_a) {
    var _this = this;
    var client = _a.client, excludeSessionId = _a.excludeSessionId;
    return errore.tryAsync({
        try: function () { return __awaiter(_this, void 0, void 0, function () {
            var sessionsResponse, sessions, lastSession;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, client.session.list()];
                    case 1:
                        sessionsResponse = _a.sent();
                        sessions = sessionsResponse.data || [];
                        lastSession = sessions.find(function (s) { return s.id !== excludeSessionId; });
                        return [2 /*return*/, (lastSession === null || lastSession === void 0 ? void 0 : lastSession.id) || null];
                }
            });
        }); },
        catch: function (e) {
            markdownLogger.error('Failed to get last session:', e);
            return new UnexpectedError({
                message: 'Failed to get last session',
                cause: e,
            });
        },
    });
}
