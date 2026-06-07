"use strict";
// Bidirectional format converter between Discord markdown and Slack mrkdwn.
//
// Discord markdown uses:
//   **bold**, ~~strike~~, [text](url), `code`, ```code blocks```
//
// Slack mrkdwn uses:
//   *bold*, ~strike~, <url|text>, `code`, ```code blocks```
//
// Both use _ for italic and same code block syntax.
// Mentions (<@U123>) are the same format in both.
Object.defineProperty(exports, "__esModule", { value: true });
exports.mrkdwnToMarkdown = mrkdwnToMarkdown;
exports.markdownToMrkdwn = markdownToMrkdwn;
/**
 * Convert Slack mrkdwn to Discord markdown (inbound, events).
 * Used when translating Slack messages into Discord MESSAGE_CREATE.
 */
function mrkdwnToMarkdown(text) {
    var result = text;
    // Protect code blocks from conversion
    var codeBlocks = [];
    result = result.replace(/```[\s\S]*?```/g, function (match) {
        codeBlocks.push(match);
        return "\0CODEBLOCK".concat(codeBlocks.length - 1, "\0");
    });
    // Protect inline code from conversion
    var inlineCode = [];
    result = result.replace(/`[^`]+`/g, function (match) {
        inlineCode.push(match);
        return "\0INLINE".concat(inlineCode.length - 1, "\0");
    });
    // Convert plain URL links only. Keep Slack entities like <@U...|name>
    // untouched, otherwise mentions/channels get corrupted.
    result = result.replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '[$2]($1)');
    result = result.replace(/<(https?:\/\/[^>]+)>/g, '$1');
    // Convert bold: *text* -> **text** (but not inside words or URLs)
    // Slack bold uses single *, Discord uses double **
    // Be careful not to convert italic underscores or things inside links
    result = result.replace(/(?<![\\*\w])\*([^*\n]+)\*(?![*\w])/g, '**$1**');
    // Convert strikethrough: ~text~ -> ~~text~~
    result = result.replace(/(?<![\\~\w])~([^~\n]+)~(?![~\w])/g, '~~$1~~');
    // Restore inline code
    result = result.replace(/\x00INLINE(\d+)\x00/g, function (_, idx) {
        return inlineCode[Number(idx)];
    });
    // Restore code blocks
    result = result.replace(/\x00CODEBLOCK(\d+)\x00/g, function (_, idx) {
        return codeBlocks[Number(idx)];
    });
    return result;
}
/**
 * Convert Discord markdown to Slack mrkdwn (outbound, REST).
 * Used when translating discord.js message posts into Slack chat.postMessage.
 */
function markdownToMrkdwn(text) {
    var result = text;
    // Protect code blocks from conversion
    var codeBlocks = [];
    result = result.replace(/```[\s\S]*?```/g, function (match) {
        codeBlocks.push(match);
        return "\0CODEBLOCK".concat(codeBlocks.length - 1, "\0");
    });
    // Protect inline code from conversion
    var inlineCode = [];
    result = result.replace(/`[^`]+`/g, function (match) {
        inlineCode.push(match);
        return "\0INLINE".concat(inlineCode.length - 1, "\0");
    });
    // Convert markdown links [text](url) to Slack <url|text>
    result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>');
    // Convert bold: **text** -> *text*
    result = result.replace(/\*\*([^*]+)\*\*/g, '*$1*');
    // Convert strikethrough: ~~text~~ -> ~text~
    result = result.replace(/~~([^~]+)~~/g, '~$1~');
    // Restore inline code
    result = result.replace(/\x00INLINE(\d+)\x00/g, function (_, idx) {
        return inlineCode[Number(idx)];
    });
    // Restore code blocks
    result = result.replace(/\x00CODEBLOCK(\d+)\x00/g, function (_, idx) {
        return codeBlocks[Number(idx)];
    });
    return result;
}
