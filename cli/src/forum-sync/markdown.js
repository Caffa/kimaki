"use strict";
// Markdown parsing, serialization, and section formatting for forum sync.
// Handles frontmatter extraction, message section building, and
// conversion between Discord messages and markdown format.
Object.defineProperty(exports, "__esModule", { value: true });
exports.toStringArray = toStringArray;
exports.getStringValue = getStringValue;
exports.parseFrontmatter = parseFrontmatter;
exports.stringifyFrontmatter = stringifyFrontmatter;
exports.splitSections = splitSections;
exports.extractStarterContent = extractStarterContent;
exports.buildMessageSections = buildMessageSections;
exports.formatMessageSection = formatMessageSection;
exports.appendProjectChannelFooter = appendProjectChannelFooter;
exports.extractProjectChannelFromContent = extractProjectChannelFromContent;
var yaml_1 = require("yaml");
var errore = require("errore");
var types_js_1 = require("./types.js");
function toStringArray(_a) {
    var value = _a.value;
    if (!Array.isArray(value))
        return [];
    return value.filter(function (item) { return typeof item === 'string'; });
}
function getStringValue(_a) {
    var value = _a.value;
    if (typeof value !== 'string')
        return '';
    return value;
}
function parseFrontmatter(_a) {
    var markdown = _a.markdown;
    if (!markdown.startsWith('---\n')) {
        return { frontmatter: {}, body: markdown.trim() };
    }
    var end = markdown.indexOf('\n---\n', 4);
    if (end === -1) {
        return { frontmatter: {}, body: markdown.trim() };
    }
    var rawFrontmatter = markdown.slice(4, end);
    var body = markdown.slice(end + 5).trim();
    var parsed = errore.try({
        try: function () { return yaml_1.default.parse(rawFrontmatter); },
        catch: function (cause) {
            return new types_js_1.ForumFrontmatterParseError({ reason: 'yaml parse failed', cause: cause });
        },
    });
    if (parsed instanceof Error || !parsed || typeof parsed !== 'object') {
        return { frontmatter: {}, body: body };
    }
    return { frontmatter: parsed, body: body };
}
function stringifyFrontmatter(_a) {
    var frontmatter = _a.frontmatter, body = _a.body;
    var yamlText = yaml_1.default.stringify(frontmatter, null, {
        lineWidth: 120,
    }).trim();
    return "---\n".concat(yamlText, "\n---\n\n").concat(body.trim(), "\n");
}
function splitSections(_a) {
    var body = _a.body;
    return body
        .split(/\r?\n---\r?\n/g)
        .map(function (part) { return part.trim(); })
        .filter(function (part) { return part.length > 0; });
}
function extractStarterContent(_a) {
    var body = _a.body;
    var sections = splitSections({ body: body });
    var firstSection = sections[0] || '';
    var match = firstSection.match(/^\*\*.+?\*\* \(\d+\) - .+?(?: \(edited .+?\))?\r?\n\r?\n([\s\S]*)$/);
    if (!match)
        return body.trim();
    return (match[1] || '').trim();
}
function buildMessageSections(_a) {
    var messages = _a.messages;
    return messages.map(function (message) {
        var attachmentLines = Array.from(message.attachments.values()).map(function (attachment) { return "Attachment: ".concat(attachment.url); });
        var contentParts = [];
        var trimmedContent = message.content.trim();
        if (trimmedContent) {
            contentParts.push(trimmedContent);
        }
        if (attachmentLines.length > 0) {
            contentParts.push(attachmentLines.join('\n'));
        }
        var content = contentParts.length > 0
            ? contentParts.join('\n\n')
            : '_(no text content)_';
        return {
            messageId: message.id,
            authorName: message.author.username,
            authorId: message.author.id,
            createdAt: new Date(message.createdTimestamp).toISOString(),
            editedAt: message.editedTimestamp
                ? new Date(message.editedTimestamp).toISOString()
                : null,
            content: content,
        };
    });
}
function formatMessageSection(_a) {
    var section = _a.section;
    var editedSuffix = section.editedAt ? " (edited ".concat(section.editedAt, ")") : '';
    return "**".concat(section.authorName, "** (").concat(section.authorId, ") - ").concat(section.createdAt).concat(editedSuffix, "\n\n").concat(section.content);
}
// Channel mention footer stored in the Discord starter message so
// projectChannelId survives a full re-sync from Discord (no local files).
// Uses <#id> so Discord renders it as a clickable channel link.
// Matches at start-of-string or after a newline so it works even when the
// footer is the only content in the message (e.g. empty body).
var PROJECT_CHANNEL_FOOTER_RE = /(?:^|\n)channel: <#(\d{17,20})>\s*$/;
var MAX_STARTER_MESSAGE_LENGTH = 2000;
/** Append a channel mention footer, truncating the body so the total
 *  never exceeds Discord's 2000-char starter message limit. */
function appendProjectChannelFooter(_a) {
    var content = _a.content, projectChannelId = _a.projectChannelId;
    if (!projectChannelId)
        return content;
    var footer = "\nchannel: <#".concat(projectChannelId, ">");
    var maxContentLength = MAX_STARTER_MESSAGE_LENGTH - footer.length;
    var truncated = content.length > maxContentLength
        ? content.slice(0, maxContentLength)
        : content;
    return "".concat(truncated).concat(footer);
}
function extractProjectChannelFromContent(_a) {
    var content = _a.content;
    var match = content.match(PROJECT_CHANNEL_FOOTER_RE);
    if (!match)
        return { cleanContent: content };
    return {
        cleanContent: content.replace(PROJECT_CHANNEL_FOOTER_RE, '').trim(),
        projectChannelId: match[1],
    };
}
