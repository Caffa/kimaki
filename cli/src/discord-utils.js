"use strict";
// Discord-specific utility functions.
// Handles markdown splitting for Discord's 2000-char limit, code block escaping,
// thread message sending, and channel metadata extraction from topic tags.
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
exports.NOTIFY_MESSAGE_FLAGS = exports.SILENT_MESSAGE_FLAGS = void 0;
exports.hasKimakiBotPermission = hasKimakiBotPermission;
exports.hasNoKimakiRole = hasNoKimakiRole;
exports.reactToThread = reactToThread;
exports.archiveThread = archiveThread;
exports.stripMentions = stripMentions;
exports.escapeBackticksInCodeBlocks = escapeBackticksInCodeBlocks;
exports.splitMarkdownForDiscord = splitMarkdownForDiscord;
exports.sendThreadMessage = sendThreadMessage;
exports.resolveTextChannel = resolveTextChannel;
exports.escapeDiscordFormatting = escapeDiscordFormatting;
exports.getKimakiMetadata = getKimakiMetadata;
exports.resolveProjectDirectoryFromAutocomplete = resolveProjectDirectoryFromAutocomplete;
exports.resolveWorkingDirectory = resolveWorkingDirectory;
exports.uploadFilesToDiscord = uploadFilesToDiscord;
// Use namespace import for CJS interop — discord.js is CJS and its named
// exports aren't detectable by all ESM loaders (e.g. tsx/esbuild) because
// discord.js uses tslib's __exportStar which is opaque to static analysis.
var discord = require("discord.js");
var ChannelType = discord.ChannelType, GuildMember = discord.GuildMember, MessageFlags = discord.MessageFlags, PermissionsBitField = discord.PermissionsBitField, REST = discord.REST, Routes = discord.Routes;
var discord_urls_js_1 = require("./discord-urls.js");
var marked_1 = require("marked");
var format_tables_js_1 = require("./format-tables.js");
var database_js_1 = require("./database.js");
var limit_heading_depth_js_1 = require("./limit-heading-depth.js");
var unnest_code_blocks_js_1 = require("./unnest-code-blocks.js");
var logger_js_1 = require("./logger.js");
var errore = require("errore");
var mime_1 = require("mime");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var discordLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.DISCORD);
/**
 * Centralized permission check for Kimaki bot access.
 * Returns true if the member has permission to use the bot:
 * - Server owner, Administrator, Manage Server, or "Kimaki" role (case-insensitive).
 * Returns false if member is null or has the "no-kimaki" role (overrides all).
 */
function hasKimakiBotPermission(member, guild) {
    if (!member) {
        return false;
    }
    var hasNoKimakiRole = hasRoleByName(member, 'no-kimaki', guild);
    if (hasNoKimakiRole) {
        return false;
    }
    var memberPermissions = member instanceof GuildMember
        ? member.permissions
        : new PermissionsBitField(BigInt(member.permissions));
    var ownerId = member instanceof GuildMember ? member.guild.ownerId : guild === null || guild === void 0 ? void 0 : guild.ownerId;
    var memberId = member instanceof GuildMember ? member.id : member.user.id;
    var isOwner = ownerId ? memberId === ownerId : false;
    var isAdmin = memberPermissions.has(PermissionsBitField.Flags.Administrator);
    var canManageServer = memberPermissions.has(PermissionsBitField.Flags.ManageGuild);
    var hasKimakiRole = hasRoleByName(member, 'kimaki', guild);
    return isOwner || isAdmin || canManageServer || hasKimakiRole;
}
function hasRoleByName(member, roleName, guild) {
    var target = roleName.toLowerCase();
    if (member instanceof GuildMember) {
        return member.roles.cache.some(function (role) { return role.name.toLowerCase() === target; });
    }
    if (!guild) {
        return false;
    }
    var roleIds = Array.isArray(member.roles) ? member.roles : [];
    for (var _i = 0, roleIds_1 = roleIds; _i < roleIds_1.length; _i++) {
        var roleId = roleIds_1[_i];
        var role = guild.roles.cache.get(roleId);
        if ((role === null || role === void 0 ? void 0 : role.name.toLowerCase()) === target) {
            return true;
        }
    }
    return false;
}
/**
 * Check if the member has the "no-kimaki" role that blocks bot access.
 * Separate from hasKimakiBotPermission so callers can show a specific error message.
 */
function hasNoKimakiRole(member) {
    var _a;
    if (!((_a = member === null || member === void 0 ? void 0 : member.roles) === null || _a === void 0 ? void 0 : _a.cache)) {
        return false;
    }
    return member.roles.cache.some(function (role) { return role.name.toLowerCase() === 'no-kimaki'; });
}
/**
 * React to a thread's starter message with an emoji.
 * Thread ID equals the starter message ID in Discord.
 */
function reactToThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var parentChannelId, result;
        var _this = this;
        var rest = _b.rest, threadId = _b.threadId, channelId = _b.channelId, emoji = _b.emoji;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                        var threadResult;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (channelId) {
                                        return [2 /*return*/, channelId];
                                    }
                                    return [4 /*yield*/, errore.tryAsync(function () {
                                            return rest.get(Routes.channel(threadId));
                                        })];
                                case 1:
                                    threadResult = _a.sent();
                                    if (threadResult instanceof Error) {
                                        discordLogger.warn("Failed to fetch thread ".concat(threadId, ":"), threadResult.message);
                                        return [2 /*return*/, null];
                                    }
                                    return [2 /*return*/, threadResult.parent_id || null];
                            }
                        });
                    }); })()];
                case 1:
                    parentChannelId = _c.sent();
                    if (!parentChannelId) {
                        discordLogger.warn("Could not resolve parent channel for thread ".concat(threadId));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return rest.put(Routes.channelMessageOwnReaction(parentChannelId, threadId, encodeURIComponent(emoji)));
                        })];
                case 2:
                    result = _c.sent();
                    if (result instanceof Error) {
                        discordLogger.warn("Failed to react to thread ".concat(threadId, " with ").concat(emoji, ":"), result.message);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function archiveThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var updateResult, abortResult;
        var _this = this;
        var rest = _b.rest, threadId = _b.threadId, parentChannelId = _b.parentChannelId, sessionId = _b.sessionId, client = _b.client, _c = _b.archiveDelay, archiveDelay = _c === void 0 ? 0 : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, reactToThread({
                        rest: rest,
                        threadId: threadId,
                        channelId: parentChannelId,
                        emoji: '📁',
                    })];
                case 1:
                    _d.sent();
                    if (!(client && sessionId)) return [3 /*break*/, 4];
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () { return __awaiter(_this, void 0, void 0, function () {
                                var sessionResponse, currentTitle, newTitle;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, client.session.get({
                                                sessionID: sessionId,
                                            })];
                                        case 1:
                                            sessionResponse = _a.sent();
                                            if (!sessionResponse.data) {
                                                return [2 /*return*/];
                                            }
                                            currentTitle = sessionResponse.data.title || '';
                                            newTitle = currentTitle.startsWith('📁')
                                                ? currentTitle
                                                : "\uD83D\uDCC1 ".concat(currentTitle).trim();
                                            return [4 /*yield*/, client.session.update({
                                                    sessionID: sessionId,
                                                    title: newTitle,
                                                })];
                                        case 2:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            catch: function (e) { return new Error('Failed to update session title', { cause: e }); },
                        })];
                case 2:
                    updateResult = _d.sent();
                    if (updateResult instanceof Error) {
                        discordLogger.warn("[archive-thread] ".concat(updateResult.message));
                    }
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, client.session.abort({ sessionID: sessionId })];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); },
                            catch: function (e) { return new Error('Failed to abort session', { cause: e }); },
                        })];
                case 3:
                    abortResult = _d.sent();
                    if (abortResult instanceof Error) {
                        discordLogger.warn("[archive-thread] ".concat(abortResult.message));
                    }
                    _d.label = 4;
                case 4:
                    if (!(archiveDelay > 0)) return [3 /*break*/, 6];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(function () {
                                resolve();
                            }, archiveDelay);
                        })];
                case 5:
                    _d.sent();
                    _d.label = 6;
                case 6: return [4 /*yield*/, rest.patch(Routes.channel(threadId), {
                        body: { archived: true },
                    })];
                case 7:
                    _d.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/** Remove Discord mentions from text so they don't appear in thread titles */
function stripMentions(text) {
    return text
        .replace(/<@!?\d+>/g, '') // user mentions
        .replace(/<@&\d+>/g, '') // role mentions
        .replace(/<#\d+>/g, '') // channel mentions
        .replace(/\s+/g, ' ')
        .trim();
}
exports.SILENT_MESSAGE_FLAGS = 4 | 4096;
// Same as SILENT but without SuppressNotifications - triggers badge/notification
exports.NOTIFY_MESSAGE_FLAGS = 4;
function escapeBackticksInCodeBlocks(markdown) {
    var lexer = new marked_1.Lexer();
    var tokens = lexer.lex(markdown);
    var result = '';
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (token.type === 'code') {
            var escapedCode = token.text.replace(/`/g, '\\`');
            result += '```' + (token.lang || '') + '\n' + escapedCode + '\n```\n';
        }
        else {
            result += token.raw;
        }
    }
    return result;
}
function splitMarkdownForDiscord(_a) {
    var content = _a.content, maxLength = _a.maxLength;
    if (content.length <= maxLength) {
        return [content];
    }
    var lexer = new marked_1.Lexer();
    var tokens = lexer.lex(content);
    var lines = [];
    var ensureNewlineBeforeCode = function () {
        var last = lines[lines.length - 1];
        if (!last) {
            return;
        }
        if (last.text.endsWith('\n')) {
            return;
        }
        lines.push({
            text: '\n',
            inCodeBlock: false,
            lang: '',
            isOpeningFence: false,
            isClosingFence: false,
        });
    };
    for (var _i = 0, tokens_2 = tokens; _i < tokens_2.length; _i++) {
        var token = tokens_2[_i];
        if (token.type === 'code') {
            ensureNewlineBeforeCode();
            var lang = token.lang || '';
            lines.push({
                text: '```' + lang + '\n',
                inCodeBlock: false,
                lang: lang,
                isOpeningFence: true,
                isClosingFence: false,
            });
            var codeLines = token.text.split('\n');
            for (var _b = 0, codeLines_1 = codeLines; _b < codeLines_1.length; _b++) {
                var codeLine = codeLines_1[_b];
                lines.push({
                    text: codeLine + '\n',
                    inCodeBlock: true,
                    lang: lang,
                    isOpeningFence: false,
                    isClosingFence: false,
                });
            }
            lines.push({
                text: '```\n',
                inCodeBlock: false,
                lang: '',
                isOpeningFence: false,
                isClosingFence: true,
            });
        }
        else {
            var rawLines = token.raw.split('\n');
            for (var i = 0; i < rawLines.length; i++) {
                var isLast = i === rawLines.length - 1;
                var text = isLast ? rawLines[i] : rawLines[i] + '\n';
                if (text) {
                    lines.push({
                        text: text,
                        inCodeBlock: false,
                        lang: '',
                        isOpeningFence: false,
                        isClosingFence: false,
                    });
                }
            }
        }
    }
    var chunks = [];
    var currentChunk = '';
    var currentLang = null;
    // helper to split a long line into smaller pieces at word boundaries or hard breaks
    var splitLongLine = function (text, available, inCode) {
        var pieces = [];
        var remaining = text;
        while (remaining.length > available) {
            var splitAt = available;
            // for non-code, try to split at word boundary
            if (!inCode) {
                var lastSpace = remaining.lastIndexOf(' ', available);
                if (lastSpace > available * 0.5) {
                    splitAt = lastSpace + 1;
                }
            }
            pieces.push(remaining.slice(0, splitAt));
            remaining = remaining.slice(splitAt);
        }
        if (remaining) {
            pieces.push(remaining);
        }
        return pieces;
    };
    var closingFence = '```\n';
    for (var _c = 0, lines_1 = lines; _c < lines_1.length; _c++) {
        var line = lines_1[_c];
        // openingFenceSize accounts for the fence text when starting a fresh chunk
        var openingFenceSize = currentChunk.length === 0 && (line.inCodeBlock || line.isOpeningFence)
            ? ('```' + line.lang + '\n').length
            : 0;
        // When opening fence starts a fresh chunk, its size is in openingFenceSize.
        // Otherwise count it normally so the overflow check doesn't miss the fence text.
        var lineLength = line.isOpeningFence && currentChunk.length === 0 ? 0 : line.text.length;
        var activeFenceOverhead = currentLang !== null || openingFenceSize > 0 ? closingFence.length : 0;
        var wouldExceed = currentChunk.length +
            openingFenceSize +
            lineLength +
            activeFenceOverhead >
            maxLength;
        if (wouldExceed) {
            // handle case where single line is longer than maxLength
            if (line.text.length > maxLength) {
                // first, flush current chunk if any
                if (currentChunk) {
                    if (currentLang !== null) {
                        currentChunk += '```\n';
                    }
                    chunks.push(currentChunk);
                    currentChunk = '';
                }
                // calculate overhead for code block markers
                var codeBlockOverhead = line.inCodeBlock
                    ? ('```' + line.lang + '\n').length + '```\n'.length
                    : 0;
                // ensure at least 10 chars available, even if maxLength is very small
                var availablePerChunk = Math.max(10, maxLength - codeBlockOverhead - 50);
                var pieces = splitLongLine(line.text, availablePerChunk, line.inCodeBlock);
                for (var i = 0; i < pieces.length; i++) {
                    var piece = pieces[i];
                    if (line.inCodeBlock) {
                        chunks.push('```' + line.lang + '\n' + piece + '```\n');
                    }
                    else {
                        chunks.push(piece);
                    }
                }
                currentLang = null;
                continue;
            }
            // normal case: line fits in a chunk but current chunk would overflow
            if (currentChunk) {
                if (currentLang !== null) {
                    currentChunk += '```\n';
                }
                chunks.push(currentChunk);
                if (line.isClosingFence && currentLang !== null) {
                    currentChunk = '';
                    currentLang = null;
                    continue;
                }
                if (line.inCodeBlock || line.isOpeningFence) {
                    var lang = line.lang;
                    currentChunk = '```' + lang + '\n';
                    if (!line.isOpeningFence) {
                        currentChunk += line.text;
                    }
                    currentLang = lang;
                }
                else {
                    currentChunk = line.text;
                    currentLang = null;
                }
            }
            else {
                // currentChunk is empty but line still exceeds - shouldn't happen after above check
                var openingFence = line.inCodeBlock || line.isOpeningFence;
                var openingFenceSize_1 = openingFence
                    ? ('```' + line.lang + '\n').length
                    : 0;
                if (line.text.length + openingFenceSize_1 + activeFenceOverhead >
                    maxLength) {
                    var fencedOverhead = openingFence
                        ? ('```' + line.lang + '\n').length + closingFence.length
                        : 0;
                    var availablePerChunk = Math.max(10, maxLength - fencedOverhead - 50);
                    var pieces = splitLongLine(line.text, availablePerChunk, line.inCodeBlock);
                    for (var _d = 0, pieces_1 = pieces; _d < pieces_1.length; _d++) {
                        var piece = pieces_1[_d];
                        if (openingFence) {
                            chunks.push('```' + line.lang + '\n' + piece + closingFence);
                        }
                        else {
                            chunks.push(piece);
                        }
                    }
                    currentChunk = '';
                    currentLang = null;
                }
                else {
                    if (openingFence) {
                        currentChunk = '```' + line.lang + '\n';
                        if (!line.isOpeningFence) {
                            currentChunk += line.text;
                        }
                        currentLang = line.lang;
                    }
                    else {
                        currentChunk = line.text;
                        currentLang = null;
                    }
                }
            }
        }
        else {
            currentChunk += line.text;
            if (line.inCodeBlock || line.isOpeningFence) {
                currentLang = line.lang;
            }
            else if (line.isClosingFence) {
                currentLang = null;
            }
        }
    }
    if (currentChunk) {
        if (currentLang !== null) {
            currentChunk += closingFence;
        }
        chunks.push(currentChunk);
    }
    return chunks;
}
function sendThreadMessage(thread, content, options) {
    return __awaiter(this, void 0, void 0, function () {
        var MAX_LENGTH, segments, baseFlags, firstMessage, _i, segments_1, segment, message, text, sendFlags, chunks, _a, chunks_1, chunk, message;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    MAX_LENGTH = 2000;
                    segments = (0, format_tables_js_1.splitTablesFromMarkdown)(content);
                    baseFlags = (_b = options === null || options === void 0 ? void 0 : options.flags) !== null && _b !== void 0 ? _b : exports.SILENT_MESSAGE_FLAGS;
                    _i = 0, segments_1 = segments;
                    _d.label = 1;
                case 1:
                    if (!(_i < segments_1.length)) return [3 /*break*/, 8];
                    segment = segments_1[_i];
                    if (!(segment.type === 'components')) return [3 /*break*/, 3];
                    return [4 /*yield*/, thread.send({
                            components: segment.components,
                            flags: MessageFlags.IsComponentsV2 | baseFlags,
                        })];
                case 2:
                    message = _d.sent();
                    if (!firstMessage) {
                        firstMessage = message;
                    }
                    return [3 /*break*/, 7];
                case 3:
                    text = segment.text;
                    text = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(text);
                    text = (0, limit_heading_depth_js_1.limitHeadingDepth)(text);
                    text = escapeBackticksInCodeBlocks(text);
                    if (!text.trim()) {
                        return [3 /*break*/, 7];
                    }
                    sendFlags = (_c = options === null || options === void 0 ? void 0 : options.flags) !== null && _c !== void 0 ? _c : exports.SILENT_MESSAGE_FLAGS;
                    chunks = splitMarkdownForDiscord({
                        content: text,
                        maxLength: MAX_LENGTH,
                    });
                    if (chunks.length > 1) {
                        discordLogger.log("MESSAGE: Splitting ".concat(text.length, " chars into ").concat(chunks.length, " messages"));
                    }
                    _a = 0, chunks_1 = chunks;
                    _d.label = 4;
                case 4:
                    if (!(_a < chunks_1.length)) return [3 /*break*/, 7];
                    chunk = chunks_1[_a];
                    if (!chunk) {
                        return [3 /*break*/, 6];
                    }
                    // Safety net: hard-truncate if splitting still produced an oversized chunk
                    if (chunk.length > MAX_LENGTH) {
                        chunk = chunk.slice(0, MAX_LENGTH - 4) + '...';
                    }
                    return [4 /*yield*/, thread.send({ content: chunk, flags: sendFlags })];
                case 5:
                    message = _d.sent();
                    if (!firstMessage) {
                        firstMessage = message;
                    }
                    _d.label = 6;
                case 6:
                    _a++;
                    return [3 /*break*/, 4];
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/, firstMessage];
            }
        });
    });
}
function resolveTextChannel(channel) {
    return __awaiter(this, void 0, void 0, function () {
        var parentId, parent_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!channel) {
                        return [2 /*return*/, null];
                    }
                    if (channel.type === ChannelType.GuildText) {
                        return [2 /*return*/, channel];
                    }
                    if (!(channel.type === ChannelType.PublicThread ||
                        channel.type === ChannelType.PrivateThread ||
                        channel.type === ChannelType.AnnouncementThread)) return [3 /*break*/, 2];
                    parentId = channel.parentId;
                    if (!parentId) return [3 /*break*/, 2];
                    return [4 /*yield*/, channel.guild.channels.fetch(parentId)];
                case 1:
                    parent_1 = _a.sent();
                    if ((parent_1 === null || parent_1 === void 0 ? void 0 : parent_1.type) === ChannelType.GuildText) {
                        return [2 /*return*/, parent_1];
                    }
                    _a.label = 2;
                case 2: return [2 /*return*/, null];
            }
        });
    });
}
function escapeDiscordFormatting(text) {
    return text.replace(/```/g, '\\`\\`\\`').replace(/````/g, '\\`\\`\\`\\`');
}
function getKimakiMetadata(textChannel) {
    return __awaiter(this, void 0, void 0, function () {
        var channelConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!textChannel) {
                        return [2 /*return*/, {}];
                    }
                    return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(textChannel.id)];
                case 1:
                    channelConfig = _a.sent();
                    if (!channelConfig) {
                        return [2 /*return*/, {}];
                    }
                    return [2 /*return*/, {
                            projectDirectory: channelConfig.directory,
                        }];
            }
        });
    });
}
/**
 * Resolve project directory from an autocomplete interaction.
 * Uses interaction.channelId (always available from raw payload) instead of
 * interaction.channel (cache-based getter, often null with gateway-proxy).
 * Checks the channel ID directly in DB, then tries thread worktree lookup,
 * then falls back to fetching the channel to resolve thread parent.
 */
function resolveProjectDirectoryFromAutocomplete(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var channelId, channelConfig, worktreeInfo, cachedParentId, parentConfig, fetched, parentConfig;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    channelId = interaction.channelId;
                    return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(channelId)];
                case 1:
                    channelConfig = _b.sent();
                    if (channelConfig) {
                        return [2 /*return*/, channelConfig.directory];
                    }
                    return [4 /*yield*/, (0, database_js_1.getThreadWorktree)(channelId)];
                case 2:
                    worktreeInfo = _b.sent();
                    if (worktreeInfo === null || worktreeInfo === void 0 ? void 0 : worktreeInfo.project_directory) {
                        return [2 /*return*/, worktreeInfo.project_directory];
                    }
                    cachedParentId = ((_a = interaction.channel) === null || _a === void 0 ? void 0 : _a.isThread()) ? interaction.channel.parentId : null;
                    if (!cachedParentId) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(cachedParentId)];
                case 3:
                    parentConfig = _b.sent();
                    if (parentConfig) {
                        return [2 /*return*/, parentConfig.directory];
                    }
                    _b.label = 4;
                case 4:
                    if (!!cachedParentId) return [3 /*break*/, 7];
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () { return interaction.client.channels.fetch(channelId); },
                            catch: function (e) { return e; },
                        })];
                case 5:
                    fetched = _b.sent();
                    if (!(!(fetched instanceof Error) && (fetched === null || fetched === void 0 ? void 0 : fetched.isThread()) && fetched.parentId)) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, database_js_1.getChannelDirectory)(fetched.parentId)];
                case 6:
                    parentConfig = _b.sent();
                    if (parentConfig) {
                        return [2 /*return*/, parentConfig.directory];
                    }
                    _b.label = 7;
                case 7: return [2 /*return*/, undefined];
            }
        });
    });
}
/**
 * Resolve the working directory for a channel or thread.
 * Returns both the base project directory (for server init) and the working directory
 * (worktree directory if in a worktree thread, otherwise same as projectDirectory).
 * This prevents commands from accidentally running in the base project dir when a
 * worktree is active — the bug that caused /diff, /compact, etc. to use wrong cwd.
 */
function resolveWorkingDirectory(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var isThread, textChannel, _c, metadata, workingDirectory, worktreeInfo;
        var channel = _b.channel;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    isThread = [
                        ChannelType.PublicThread,
                        ChannelType.PrivateThread,
                        ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                    if (!isThread) return [3 /*break*/, 2];
                    return [4 /*yield*/, resolveTextChannel(channel)];
                case 1:
                    _c = _d.sent();
                    return [3 /*break*/, 3];
                case 2:
                    _c = channel;
                    _d.label = 3;
                case 3:
                    textChannel = _c;
                    return [4 /*yield*/, getKimakiMetadata(textChannel)];
                case 4:
                    metadata = _d.sent();
                    if (!metadata.projectDirectory) {
                        return [2 /*return*/, undefined];
                    }
                    workingDirectory = metadata.projectDirectory;
                    if (!isThread) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, database_js_1.getThreadWorktree)(channel.id)];
                case 5:
                    worktreeInfo = _d.sent();
                    if ((worktreeInfo === null || worktreeInfo === void 0 ? void 0 : worktreeInfo.status) === 'ready' && worktreeInfo.worktree_directory) {
                        workingDirectory = worktreeInfo.worktree_directory;
                    }
                    _d.label = 6;
                case 6: return [2 /*return*/, {
                        projectDirectory: metadata.projectDirectory,
                        workingDirectory: workingDirectory,
                    }];
            }
        });
    });
}
/**
 * Upload files to a Discord thread/channel in a single message.
 * Sending all files in one message causes Discord to display images in a grid layout.
 */
function uploadFilesToDiscord(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var attachments, formData, response, error;
        var threadId = _b.threadId, botToken = _b.botToken, files = _b.files;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (files.length === 0) {
                        return [2 /*return*/];
                    }
                    attachments = files.map(function (file, index) { return ({
                        id: index,
                        filename: node_path_1.default.basename(file),
                    }); });
                    formData = new FormData();
                    formData.append('payload_json', JSON.stringify({ attachments: attachments }));
                    // Append each file with its array index, with correct MIME type for grid display
                    files.forEach(function (file, index) {
                        var buffer = node_fs_1.default.readFileSync(file);
                        var mimeType = mime_1.default.getType(file) || 'application/octet-stream';
                        formData.append("files[".concat(index, "]"), new Blob([buffer], { type: mimeType }), node_path_1.default.basename(file));
                    });
                    return [4 /*yield*/, fetch((0, discord_urls_js_1.discordApiUrl)("/channels/".concat(threadId, "/messages")), {
                            method: 'POST',
                            headers: {
                                Authorization: "Bot ".concat(botToken),
                            },
                            body: formData,
                        })];
                case 1:
                    response = _c.sent();
                    if (!!response.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, response.text()];
                case 2:
                    error = _c.sent();
                    throw new Error("Discord API error: ".concat(response.status, " - ").concat(error));
                case 3: return [2 /*return*/];
            }
        });
    });
}
