"use strict";
// OpenCode message part formatting for Discord.
// Converts SDK message parts (text, tools, reasoning) to Discord-friendly format,
// handles file attachments, and provides tool summary generation.
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
exports.TEXT_MIME_TYPES = void 0;
exports.resolveMentions = resolveMentions;
exports.collectSessionChunks = collectSessionChunks;
exports.batchChunksForDiscord = batchChunksForDiscord;
exports.isTextMimeType = isTextMimeType;
exports.getTextAttachments = getTextAttachments;
exports.getFileAttachments = getFileAttachments;
exports.getToolSummaryText = getToolSummaryText;
exports.formatTodoList = formatTodoList;
exports.formatPart = formatPart;
var errore = require("errore");
var logger_js_1 = require("./logger.js");
var errors_js_1 = require("./errors.js");
var image_utils_js_1 = require("./image-utils.js");
var vision_description_js_1 = require("./vision-description.js");
var patch_text_parser_js_1 = require("./patch-text-parser.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.FORMATTING);
/**
 * Resolves Discord mentions in message content to human-readable names.
 * Replaces <@userId> with @displayName, <@&roleId> with @roleName, <#channelId> with #channelName.
 */
function resolveMentions(message) {
    var _a;
    var content = message.content || '';
    // Replace user mentions <@userId> or <@!userId> with @displayName
    for (var _i = 0, _b = message.mentions.users; _i < _b.length; _i++) {
        var _c = _b[_i], userId = _c[0], user = _c[1];
        var member = (_a = message.guild) === null || _a === void 0 ? void 0 : _a.members.cache.get(userId);
        var displayName = (member === null || member === void 0 ? void 0 : member.displayName) || user.displayName || user.username;
        content = content.replace(new RegExp("<@!?".concat(userId, ">"), 'g'), "@".concat(displayName));
    }
    // Replace role mentions <@&roleId> with @roleName
    for (var _d = 0, _e = message.mentions.roles; _d < _e.length; _d++) {
        var _f = _e[_d], roleId = _f[0], role = _f[1];
        content = content.replace(new RegExp("<@&".concat(roleId, ">"), 'g'), "@".concat(role.name));
    }
    // Replace channel mentions <#channelId> with #channelName
    for (var _g = 0, _h = message.mentions.channels; _g < _h.length; _g++) {
        var _j = _h[_g], channelId = _j[0], channel = _j[1];
        var name_1 = 'name' in channel ? channel.name : channelId;
        content = content.replace(new RegExp("<#".concat(channelId, ">"), 'g'), "#".concat(name_1));
    }
    return content;
}
/**
 * Escapes Discord inline markdown characters so dynamic content
 * doesn't break formatting when wrapped in *, _, **, etc.
 */
function escapeInlineMarkdown(text) {
    return text.replace(/([*_~|`\\])/g, '\\$1');
}
// parsePatchCounts → imported from patch-text-parser.ts as parsePatchFileCounts
/**
 * Normalize whitespace: convert newlines to spaces and collapse consecutive spaces.
 */
function normalizeWhitespace(text) {
    return text.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');
}
/**
 * Collect renderable assistant parts from session messages as SessionChunks.
 * Each non-empty formatted part becomes one chunk. Caller can batch them
 * with batchChunksForDiscord() before sending.
 *
 * - skipPartIds: parts already synced (external sync). Skipped parts are
 *   not included in the result.
 * - limit: max parts to include (from the end). Older parts are counted
 *   in skippedCount.
 */
function collectSessionChunks(_a) {
    var messages = _a.messages, skipPartIds = _a.skipPartIds, limit = _a.limit;
    var allChunks = [];
    for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
        var message = messages_1[_i];
        if (message.info.role !== 'assistant') {
            continue;
        }
        for (var _b = 0, _c = message.parts; _b < _c.length; _b++) {
            var part = _c[_b];
            if (skipPartIds === null || skipPartIds === void 0 ? void 0 : skipPartIds.has(part.id)) {
                continue;
            }
            var content = formatPart(part);
            if (!content.trim()) {
                continue;
            }
            allChunks.push({ partIds: [part.id], content: content.trimEnd() });
        }
    }
    if (limit !== undefined && allChunks.length > limit) {
        return {
            chunks: allChunks.slice(-limit),
            skippedCount: allChunks.length - limit,
        };
    }
    return { chunks: allChunks, skippedCount: 0 };
}
// Merge consecutive SessionChunks into as few Discord messages as possible,
// respecting the 2000 char limit.
var DISCORD_BATCH_MAX_LENGTH = 2000;
function batchChunksForDiscord(chunks) {
    if (chunks.length === 0) {
        return [];
    }
    var batched = [];
    var current = { partIds: __spreadArray([], chunks[0].partIds, true), content: chunks[0].content };
    for (var i = 1; i < chunks.length; i++) {
        var next = chunks[i];
        var merged = current.content + '\n' + next.content;
        if (merged.length <= DISCORD_BATCH_MAX_LENGTH) {
            current = {
                partIds: __spreadArray(__spreadArray([], current.partIds, true), next.partIds, true),
                content: merged,
            };
        }
        else {
            batched.push(current);
            current = { partIds: __spreadArray([], next.partIds, true), content: next.content };
        }
    }
    batched.push(current);
    return batched;
}
exports.TEXT_MIME_TYPES = [
    'text/',
    'application/json',
    'application/xml',
    'application/javascript',
    'application/typescript',
    'application/x-yaml',
    'application/toml',
];
function isTextMimeType(contentType) {
    if (!contentType) {
        return false;
    }
    return exports.TEXT_MIME_TYPES.some(function (prefix) { return contentType.startsWith(prefix); });
}
function getTextAttachments(message) {
    return __awaiter(this, void 0, void 0, function () {
        var textAttachments, textContents;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    textAttachments = Array.from(message.attachments.values()).filter(function (attachment) { return isTextMimeType(attachment.contentType); });
                    if (textAttachments.length === 0) {
                        return [2 /*return*/, ''];
                    }
                    return [4 /*yield*/, Promise.all(textAttachments.map(function (attachment) { return __awaiter(_this, void 0, void 0, function () {
                            var response, text;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, errore.tryAsync({
                                            try: function () { return fetch(attachment.url); },
                                            catch: function (e) { return new errors_js_1.FetchError({ url: attachment.url, cause: e }); },
                                        })];
                                    case 1:
                                        response = _a.sent();
                                        if (response instanceof Error) {
                                            return [2 /*return*/, "<attachment filename=\"".concat(attachment.name, "\" error=\"").concat(response.message, "\" />")];
                                        }
                                        if (!response.ok) {
                                            return [2 /*return*/, "<attachment filename=\"".concat(attachment.name, "\" error=\"Failed to fetch: ").concat(response.status, "\" />")];
                                        }
                                        return [4 /*yield*/, response.text()];
                                    case 2:
                                        text = _a.sent();
                                        return [2 /*return*/, "<attachment filename=\"".concat(attachment.name, "\" mime=\"").concat(attachment.contentType, "\">\n").concat(text, "\n</attachment>")];
                                }
                            });
                        }); }))];
                case 1:
                    textContents = _a.sent();
                    return [2 /*return*/, textContents.join('\n\n')];
            }
        });
    });
}
function getFileAttachments(message) {
    return __awaiter(this, void 0, void 0, function () {
        var fileAttachments, results;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fileAttachments = Array.from(message.attachments.values()).filter(function (attachment) {
                        var contentType = attachment.contentType || '';
                        return (contentType.startsWith('image/') || contentType === 'application/pdf');
                    });
                    if (fileAttachments.length === 0) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, Promise.all(fileAttachments.map(function (attachment) { return __awaiter(_this, void 0, void 0, function () {
                            var response, rawBuffer, _a, _b, originalMime, _c, buffer, mime, visionDescription, _d, base64, dataUrl;
                            return __generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0: return [4 /*yield*/, errore.tryAsync({
                                            try: function () { return fetch(attachment.url); },
                                            catch: function (e) { return new errors_js_1.FetchError({ url: attachment.url, cause: e }); },
                                        })];
                                    case 1:
                                        response = _e.sent();
                                        if (response instanceof Error) {
                                            logger.error("Error downloading attachment ".concat(attachment.name, ":"), response.message);
                                            return [2 /*return*/, null];
                                        }
                                        if (!response.ok) {
                                            logger.error("Failed to fetch attachment ".concat(attachment.name, ": ").concat(response.status));
                                            return [2 /*return*/, null];
                                        }
                                        _b = (_a = Buffer).from;
                                        return [4 /*yield*/, response.arrayBuffer()];
                                    case 2:
                                        rawBuffer = _b.apply(_a, [_e.sent()]);
                                        originalMime = attachment.contentType || 'application/octet-stream';
                                        return [4 /*yield*/, (0, image_utils_js_1.processImage)(rawBuffer, originalMime)
                                            // Generate vision description for debugging (only for images)
                                        ];
                                    case 3:
                                        _c = _e.sent(), buffer = _c.buffer, mime = _c.mime;
                                        if (!(mime.startsWith('image/') && !mime.includes('gif'))) return [3 /*break*/, 5];
                                        return [4 /*yield*/, (0, vision_description_js_1.describeImage)(buffer, attachment.name)];
                                    case 4:
                                        _d = _e.sent();
                                        return [3 /*break*/, 6];
                                    case 5:
                                        _d = undefined;
                                        _e.label = 6;
                                    case 6:
                                        visionDescription = _d;
                                        base64 = buffer.toString('base64');
                                        dataUrl = "data:".concat(mime, ";base64,").concat(base64);
                                        logger.log("Attachment ".concat(attachment.name, ": ").concat(rawBuffer.length, " \u2192 ").concat(buffer.length, " bytes, ").concat(mime));
                                        return [2 /*return*/, {
                                                type: 'file',
                                                mime: mime,
                                                filename: attachment.name,
                                                url: dataUrl,
                                                sourceUrl: attachment.url,
                                                visionDescription: visionDescription,
                                            }];
                                }
                            });
                        }); }))];
                case 1:
                    results = _a.sent();
                    return [2 /*return*/, results.filter(function (r) { return r !== null; })];
            }
        });
    });
}
var MAX_BASH_COMMAND_INLINE_LENGTH = 100;
function getToolSummaryText(part) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    if (part.type !== 'tool')
        return '';
    if (part.tool === 'edit') {
        var filePath = ((_a = part.state.input) === null || _a === void 0 ? void 0 : _a.filePath) || '';
        var newString = ((_b = part.state.input) === null || _b === void 0 ? void 0 : _b.newString) || '';
        var oldString = ((_c = part.state.input) === null || _c === void 0 ? void 0 : _c.oldString) || '';
        var added = newString.split('\n').length;
        var removed = oldString.split('\n').length;
        var fileName = filePath.split('/').pop() || '';
        return fileName
            ? "*".concat(escapeInlineMarkdown(fileName), "* (+").concat(added, "-").concat(removed, ")")
            : "(+".concat(added, "-").concat(removed, ")");
    }
    if (part.tool === 'apply_patch') {
        // Only inputs are available when parts are sent during streaming (output/metadata not yet populated)
        var patchText = ((_d = part.state.input) === null || _d === void 0 ? void 0 : _d.patchText) || '';
        if (!patchText) {
            return '';
        }
        var patchCounts = (0, patch_text_parser_js_1.parsePatchFileCounts)(patchText);
        return __spreadArray([], patchCounts.entries(), true).map(function (_a) {
            var filePath = _a[0], _b = _a[1], additions = _b.additions, deletions = _b.deletions;
            var fileName = filePath.split('/').pop() || '';
            return fileName
                ? "*".concat(escapeInlineMarkdown(fileName), "* (+").concat(additions, "-").concat(deletions, ")")
                : "(+".concat(additions, "-").concat(deletions, ")");
        })
            .join(', ');
    }
    if (part.tool === 'write') {
        var filePath = ((_e = part.state.input) === null || _e === void 0 ? void 0 : _e.filePath) || '';
        var content = ((_f = part.state.input) === null || _f === void 0 ? void 0 : _f.content) || '';
        var lines = content.split('\n').length;
        var fileName = filePath.split('/').pop() || '';
        return fileName
            ? "*".concat(escapeInlineMarkdown(fileName), "* (").concat(lines, " line").concat(lines === 1 ? '' : 's', ")")
            : "(".concat(lines, " line").concat(lines === 1 ? '' : 's', ")");
    }
    if (part.tool === 'webfetch') {
        var url = ((_g = part.state.input) === null || _g === void 0 ? void 0 : _g.url) || '';
        var urlWithoutProtocol = url.replace(/^https?:\/\//, '');
        return urlWithoutProtocol
            ? "*".concat(escapeInlineMarkdown(urlWithoutProtocol), "*")
            : '';
    }
    if (part.tool === 'read') {
        var filePath = ((_h = part.state.input) === null || _h === void 0 ? void 0 : _h.filePath) || '';
        var fileName = filePath.split('/').pop() || '';
        return fileName ? "*".concat(escapeInlineMarkdown(fileName), "*") : '';
    }
    if (part.tool === 'list') {
        var path = ((_j = part.state.input) === null || _j === void 0 ? void 0 : _j.path) || '';
        var dirName = path.split('/').pop() || path;
        return dirName ? "*".concat(escapeInlineMarkdown(dirName), "*") : '';
    }
    if (part.tool === 'glob') {
        var pattern = ((_k = part.state.input) === null || _k === void 0 ? void 0 : _k.pattern) || '';
        return pattern ? "*".concat(escapeInlineMarkdown(pattern), "*") : '';
    }
    if (part.tool === 'grep') {
        var pattern = ((_l = part.state.input) === null || _l === void 0 ? void 0 : _l.pattern) || '';
        return pattern ? "*".concat(escapeInlineMarkdown(pattern), "*") : '';
    }
    if (part.tool === 'bash' ||
        part.tool === 'todoread' ||
        part.tool === 'todowrite') {
        return '';
    }
    // Task tool display is handled via subtask part in session-handler (shows name + agent)
    if (part.tool === 'task') {
        return '';
    }
    if (part.tool === 'skill') {
        var name_2 = ((_m = part.state.input) === null || _m === void 0 ? void 0 : _m.name) || '';
        return name_2 ? "_".concat(escapeInlineMarkdown(name_2), "_") : '';
    }
    // File upload tool - show the prompt
    if (part.tool.endsWith('kimaki_file_upload')) {
        var prompt_1 = ((_o = part.state.input) === null || _o === void 0 ? void 0 : _o.prompt) || '';
        return prompt_1 ? "*".concat(escapeInlineMarkdown(prompt_1.slice(0, 60)), "*") : '';
    }
    if (!part.state.input)
        return '';
    var inputFields = Object.entries(part.state.input)
        .map(function (_a) {
        var key = _a[0], value = _a[1];
        if (value === null || value === undefined)
            return null;
        var stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        var normalized = normalizeWhitespace(stringValue);
        var truncatedValue = normalized.length > 50 ? normalized.slice(0, 50) + '…' : normalized;
        return "".concat(key, ": ").concat(truncatedValue);
    })
        .filter(Boolean);
    if (inputFields.length === 0)
        return '';
    return "(".concat(inputFields.join(', '), ")");
}
function formatTodoList(part) {
    var _a;
    if (part.type !== 'tool' || part.tool !== 'todowrite')
        return '';
    var rawTodos = (_a = part.state.input) === null || _a === void 0 ? void 0 : _a.todos;
    var todos = (Array.isArray(rawTodos) ? rawTodos : []);
    var activeIndex = todos.findIndex(function (todo) {
        return todo.status === 'in_progress';
    });
    var activeTodo = todos[activeIndex];
    if (activeIndex === -1 || !activeTodo)
        return '';
    // digit-with-period ⒈-⒛ for 1-20, fallback to regular number for 21+
    var digitWithPeriod = '⒈⒉⒊⒋⒌⒍⒎⒏⒐⒑⒒⒓⒔⒕⒖⒗⒘⒙⒚⒛';
    var todoNumber = activeIndex + 1;
    var num = todoNumber <= 20 ? digitWithPeriod[todoNumber - 1] : "".concat(todoNumber, ".");
    var content = activeTodo.content.charAt(0).toLowerCase() + activeTodo.content.slice(1);
    return "".concat(num, " **").concat(escapeInlineMarkdown(content), "**");
}
function formatPart(part, prefix) {
    var _a, _b, _c, _d, _e, _f;
    var pfx = prefix ? "".concat(prefix, " \u22C5 ") : '';
    if (part.type === 'text') {
        var text = (_a = part.text) === null || _a === void 0 ? void 0 : _a.trim();
        if (!text)
            return '';
        // For subtask text, always use bullet with prefix
        if (prefix) {
            return "\u2B25 ".concat(pfx).concat(text);
        }
        var firstChar = text[0] || '';
        var markdownStarters = ['#', '*', '_', '-', '>', '`', '[', '|'];
        var startsWithMarkdown = markdownStarters.includes(firstChar) ||
            /^\d+\./.test(text) ||
            /^<callout[\s>]/i.test(text);
        if (startsWithMarkdown) {
            return "\n".concat(text);
        }
        return "\u2B25 ".concat(text);
    }
    if (part.type === 'reasoning') {
        if (!((_b = part.text) === null || _b === void 0 ? void 0 : _b.trim()))
            return '';
        return "\u2523 ".concat(pfx, "thinking");
    }
    if (part.type === 'file') {
        return prefix
            ? "\uD83D\uDCC4 ".concat(pfx).concat(part.filename || 'File')
            : "\uD83D\uDCC4 ".concat(part.filename || 'File');
    }
    if (part.type === 'step-start' ||
        part.type === 'step-finish' ||
        part.type === 'patch') {
        return '';
    }
    if (part.type === 'agent') {
        return "\u2523 ".concat(pfx, "agent ").concat(part.id);
    }
    if (part.type === 'snapshot') {
        return "\u2523 ".concat(pfx, "snapshot ").concat(part.snapshot);
    }
    if (part.type === 'tool') {
        if (part.tool === 'todowrite') {
            var formatted = formatTodoList(part);
            return prefix && formatted ? "\u2523 ".concat(pfx).concat(formatted) : formatted;
        }
        // Question tool is handled via Discord dropdowns, not text
        if (part.tool === 'question') {
            return '';
        }
        // File upload tool is handled via Discord button + modal, not text
        if (part.tool.endsWith('kimaki_file_upload')) {
            return '';
        }
        // Action buttons tool is handled via Discord buttons, not text
        if (part.tool.endsWith('kimaki_action_buttons')) {
            return '';
        }
        // Task tool display is handled in session-handler with proper label
        if (part.tool === 'task') {
            return '';
        }
        if (part.state.status === 'pending') {
            if (part.tool !== 'bash') {
                return '';
            }
            var command = ((_c = part.state.input) === null || _c === void 0 ? void 0 : _c.command) || '';
            var description = ((_d = part.state.input) === null || _d === void 0 ? void 0 : _d.description) || '';
            var isSingleLine = !command.includes('\n');
            var toolTitle_1 = isSingleLine && command.length <= MAX_BASH_COMMAND_INLINE_LENGTH
                ? " _".concat(escapeInlineMarkdown(command), "_")
                : description
                    ? " _".concat(escapeInlineMarkdown(description), "_")
                    : '';
            return "\u2523 ".concat(pfx, "bash").concat(toolTitle_1);
        }
        var summaryText = getToolSummaryText(part);
        var stateTitle = 'title' in part.state ? part.state.title : undefined;
        var toolTitle = '';
        if (part.state.status === 'error') {
            toolTitle = part.state.error || 'error';
        }
        else if (part.tool === 'bash') {
            var command = ((_e = part.state.input) === null || _e === void 0 ? void 0 : _e.command) || '';
            var description = ((_f = part.state.input) === null || _f === void 0 ? void 0 : _f.description) || '';
            var isSingleLine = !command.includes('\n');
            if (isSingleLine && command.length <= MAX_BASH_COMMAND_INLINE_LENGTH) {
                toolTitle = "_".concat(escapeInlineMarkdown(command), "_");
            }
            else if (description) {
                toolTitle = "_".concat(escapeInlineMarkdown(description), "_");
            }
            else if (stateTitle) {
                toolTitle = "_".concat(escapeInlineMarkdown(stateTitle), "_");
            }
        }
        else if (stateTitle) {
            toolTitle = "_".concat(escapeInlineMarkdown(stateTitle), "_");
        }
        var icon = (function () {
            if (part.state.status === 'error') {
                return '⨯';
            }
            if (part.tool === 'edit' ||
                part.tool === 'write' ||
                part.tool === 'apply_patch') {
                return '◼︎';
            }
            return '┣';
        })();
        var toolParts = [part.tool, toolTitle, summaryText]
            .filter(Boolean)
            .join(' ');
        return "".concat(icon, " ").concat(pfx).concat(toolParts);
    }
    logger.warn('Unknown part type:', part);
    return '';
}
