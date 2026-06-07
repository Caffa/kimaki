"use strict";
// Translates Discord REST API calls into Slack Web API calls.
// Each function takes Discord-shaped request data and calls the
// appropriate Slack method, then returns a Discord-shaped response.
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
exports.MissingPermissionsError = exports.MissingAccessError = exports.UnknownGuildError = exports.UnknownChannelError = exports.MessageNotFoundError = exports.DiscordApiError = void 0;
exports.postMessage = postMessage;
exports.editMessage = editMessage;
exports.deleteMessage = deleteMessage;
exports.getMessages = getMessages;
exports.getMessage = getMessage;
exports.getChannel = getChannel;
exports.listChannels = listChannels;
exports.updateChannel = updateChannel;
exports.setThreadTypingStatus = setThreadTypingStatus;
exports.clearThreadTypingStatus = clearThreadTypingStatus;
exports.createChannel = createChannel;
exports.listGuildMembers = listGuildMembers;
exports.getGuildMember = getGuildMember;
exports.listGuildRoles = listGuildRoles;
exports.openModalView = openModalView;
exports.addReaction = addReaction;
exports.removeReaction = removeReaction;
exports.getUser = getUser;
exports.createThread = createThread;
exports.createThreadFromMessage = createThreadFromMessage;
exports.listThreadMembers = listThreadMembers;
exports.getThreadMember = getThreadMember;
exports.joinThreadMember = joinThreadMember;
exports.leaveThreadMember = leaveThreadMember;
exports.getActiveThreads = getActiveThreads;
exports.mapSlackErrorToDiscordError = mapSlackErrorToDiscordError;
var web_api_1 = require("@slack/web-api");
var v10_1 = require("discord-api-types/v10");
var id_converter_js_1 = require("./id-converter.js");
var format_converter_js_1 = require("./format-converter.js");
var component_converter_js_1 = require("./component-converter.js");
var file_upload_js_1 = require("./file-upload.js");
// ---- Messages ----
/**
 * POST /channels/:id/messages -> chat.postMessage
 * Handles content, components (converted to Block Kit), and file attachments.
 */
function postMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, channel, threadTs, text, blocks, fallbackText, postArgs, result, messageTs, messageId;
        var _d, _e;
        var slack = _b.slack, channelId = _b.channelId, body = _b.body, botUserId = _b.botUserId, guildId = _b.guildId;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _c = (0, id_converter_js_1.resolveSlackTarget)(channelId), channel = _c.channel, threadTs = _c.threadTs;
                    if (!(body.attachments && body.attachments.length > 0)) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, file_upload_js_1.uploadAttachmentsToSlack)({
                            slack: slack,
                            attachments: body.attachments,
                            channel: channel,
                            threadTs: threadTs,
                        })];
                case 1:
                    _f.sent();
                    _f.label = 2;
                case 2:
                    text = (0, format_converter_js_1.markdownToMrkdwn)((_d = body.content) !== null && _d !== void 0 ? _d : '');
                    blocks = body.components
                        ? (0, component_converter_js_1.componentsToBlocks)(body.components)
                        : [];
                    fallbackText = text || (blocks.length > 0 ? '(message with components)' : ' ');
                    postArgs = {
                        channel: channel,
                        thread_ts: threadTs,
                        text: fallbackText,
                        blocks: blocks.length > 0 ? blocks : undefined,
                        unfurl_links: false,
                        unfurl_media: false,
                    };
                    return [4 /*yield*/, postMessageWithJoinRetry({
                            slack: slack,
                            postArgs: postArgs,
                            channel: channel,
                        })];
                case 3:
                    result = _f.sent();
                    messageTs = result.ts;
                    if (!messageTs) {
                        throw new Error('Slack chat.postMessage response missing ts');
                    }
                    messageId = (0, id_converter_js_1.encodeMessageId)(channel, messageTs);
                    return [2 /*return*/, buildApiMessage({
                            messageId: messageId,
                            channelId: channelId,
                            ts: messageTs,
                            content: (_e = body.content) !== null && _e !== void 0 ? _e : '',
                            botUserId: botUserId,
                            guildId: guildId,
                        })];
            }
        });
    });
}
/**
 * PATCH /channels/:id/messages/:mid -> chat.update
 */
function editMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, ts, decoded, text, blocks, updateArgs;
        var _c, _d;
        var slack = _b.slack, channelId = _b.channelId, messageId = _b.messageId, body = _b.body, botUserId = _b.botUserId, guildId = _b.guildId;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    channel = (0, id_converter_js_1.resolveSlackTarget)(channelId).channel;
                    if ((0, id_converter_js_1.isEncodedMessageId)(messageId)) {
                        decoded = (0, id_converter_js_1.decodeMessageId)(messageId);
                        ts = decoded.ts;
                    }
                    else {
                        ts = messageId;
                    }
                    text = (0, format_converter_js_1.markdownToMrkdwn)((_c = body.content) !== null && _c !== void 0 ? _c : '');
                    blocks = body.components
                        ? (0, component_converter_js_1.componentsToBlocks)(body.components)
                        : [];
                    updateArgs = {
                        channel: channel,
                        ts: ts,
                        text: text,
                        blocks: blocks.length > 0 ? blocks : undefined,
                    };
                    return [4 /*yield*/, slack.chat.update(updateArgs)];
                case 1:
                    _e.sent();
                    return [2 /*return*/, buildApiMessage({
                            messageId: messageId,
                            channelId: channelId,
                            ts: ts,
                            content: (_d = body.content) !== null && _d !== void 0 ? _d : '',
                            botUserId: botUserId,
                            guildId: guildId,
                            edited: true,
                        })];
            }
        });
    });
}
/**
 * DELETE /channels/:id/messages/:mid -> chat.delete
 */
function deleteMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, ts, decoded, deleteArgs;
        var slack = _b.slack, channelId = _b.channelId, messageId = _b.messageId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channel = (0, id_converter_js_1.resolveSlackTarget)(channelId).channel;
                    if ((0, id_converter_js_1.isEncodedMessageId)(messageId)) {
                        decoded = (0, id_converter_js_1.decodeMessageId)(messageId);
                        ts = decoded.ts;
                    }
                    else {
                        ts = messageId;
                    }
                    deleteArgs = {
                        channel: channel,
                        ts: ts,
                    };
                    return [4 /*yield*/, slack.chat.delete(deleteArgs)];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * GET /channels/:id/messages -> conversations.history or conversations.replies
 */
function getMessages(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, channel, threadTs, limit, latestTs, oldestTs, repliesArgs, result_1, historyArgs, result;
        var _d, _e;
        var slack = _b.slack, channelId = _b.channelId, query = _b.query, botUserId = _b.botUserId, guildId = _b.guildId;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _c = (0, id_converter_js_1.resolveSlackTarget)(channelId), channel = _c.channel, threadTs = _c.threadTs;
                    limit = query.limit ? Number.parseInt(query.limit, 10) : 50;
                    latestTs = (function () {
                        if (!query.before) {
                            return undefined;
                        }
                        try {
                            return (0, id_converter_js_1.decodeMessageId)(query.before).ts;
                        }
                        catch (_a) {
                            return undefined;
                        }
                    })();
                    oldestTs = (function () {
                        if (!query.after) {
                            return undefined;
                        }
                        try {
                            return (0, id_converter_js_1.decodeMessageId)(query.after).ts;
                        }
                        catch (_a) {
                            return undefined;
                        }
                    })();
                    if (!threadTs) return [3 /*break*/, 2];
                    repliesArgs = {
                        channel: channel,
                        ts: threadTs,
                        limit: limit,
                        latest: latestTs,
                        oldest: oldestTs,
                    };
                    return [4 /*yield*/, slack.conversations.replies(repliesArgs)];
                case 1:
                    result_1 = _f.sent();
                    return [2 /*return*/, ((_d = result_1.messages) !== null && _d !== void 0 ? _d : []).map(function (msg) {
                            return buildApiMessageFromSlack({
                                msg: msg,
                                channel: channel,
                                channelId: channelId,
                                botUserId: botUserId,
                                guildId: guildId,
                            });
                        })];
                case 2:
                    historyArgs = {
                        channel: channel,
                        limit: limit,
                        latest: latestTs,
                        oldest: oldestTs,
                    };
                    return [4 /*yield*/, slack.conversations.history(historyArgs)];
                case 3:
                    result = _f.sent();
                    return [2 /*return*/, ((_e = result.messages) !== null && _e !== void 0 ? _e : []).map(function (msg) {
                            return buildApiMessageFromSlack({
                                msg: msg,
                                channel: channel,
                                channelId: channelId,
                                botUserId: botUserId,
                                guildId: guildId,
                            });
                        })];
            }
        });
    });
}
/**
 * GET /channels/:id/messages/:mid -> single message fetch.
 * Uses conversations.history (or conversations.replies for threads) with
 * oldest=ts, latest=ts, inclusive=true to fetch the exact target message
 * by its Slack timestamp.
 */
function getMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, channel, threadTs, targetTs, repliesArgs, result_2, msg_1, historyArgs, result, msg;
        var _d, _e;
        var slack = _b.slack, channelId = _b.channelId, messageId = _b.messageId, botUserId = _b.botUserId, guildId = _b.guildId;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _c = (0, id_converter_js_1.resolveSlackTarget)(channelId), channel = _c.channel, threadTs = _c.threadTs;
                    targetTs = (0, id_converter_js_1.isEncodedMessageId)(messageId)
                        ? (0, id_converter_js_1.decodeMessageId)(messageId).ts
                        : messageId;
                    if (!threadTs) return [3 /*break*/, 2];
                    repliesArgs = {
                        channel: channel,
                        ts: threadTs,
                        oldest: targetTs,
                        latest: targetTs,
                        inclusive: true,
                        limit: 1,
                    };
                    return [4 /*yield*/, slack.conversations.replies(repliesArgs)];
                case 1:
                    result_2 = _f.sent();
                    msg_1 = ((_d = result_2.messages) !== null && _d !== void 0 ? _d : []).find(function (m) {
                        return m.ts === targetTs;
                    });
                    if (msg_1) {
                        return [2 /*return*/, buildApiMessageFromSlack({
                                msg: msg_1,
                                channel: channel,
                                channelId: channelId,
                                botUserId: botUserId,
                                guildId: guildId,
                            })];
                    }
                    throw new MessageNotFoundError(messageId);
                case 2:
                    historyArgs = {
                        channel: channel,
                        oldest: targetTs,
                        latest: targetTs,
                        inclusive: true,
                        limit: 1,
                    };
                    return [4 /*yield*/, slack.conversations.history(historyArgs)];
                case 3:
                    result = _f.sent();
                    msg = ((_e = result.messages) !== null && _e !== void 0 ? _e : []).find(function (m) {
                        return m.ts === targetTs;
                    });
                    if (msg) {
                        return [2 /*return*/, buildApiMessageFromSlack({
                                msg: msg,
                                channel: channel,
                                channelId: channelId,
                                botUserId: botUserId,
                                guildId: guildId,
                            })];
                    }
                    throw new MessageNotFoundError(messageId);
            }
        });
    });
}
// ---- Channels ----
/**
 * GET /channels/:id -> conversations.info
 */
function getChannel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, channel, threadTs, infoArgs, result, ch;
        var _d, _e, _f;
        var slack = _b.slack, channelId = _b.channelId, guildId = _b.guildId;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    if ((0, id_converter_js_1.isThreadChannelId)(channelId)) {
                        _c = (0, id_converter_js_1.resolveSlackTarget)(channelId), channel = _c.channel, threadTs = _c.threadTs;
                        if (!threadTs) {
                            throw new Error("Thread channel ".concat(channelId, " resolved without threadTs"));
                        }
                        // For threads, build a synthetic channel object
                        return [2 /*return*/, {
                                id: channelId,
                                type: v10_1.ChannelType.PublicThread,
                                name: "thread-".concat(threadTs),
                                guild_id: guildId,
                                parent_id: channel,
                                message_count: 0,
                                member_count: 0,
                                thread_metadata: {
                                    archived: false,
                                    auto_archive_duration: 1440,
                                    archive_timestamp: (0, id_converter_js_1.slackTsToIso)(threadTs),
                                    locked: false,
                                },
                            }];
                    }
                    infoArgs = { channel: channelId };
                    return [4 /*yield*/, slack.conversations.info(infoArgs)];
                case 1:
                    result = _g.sent();
                    ch = requireSlackChannelId(result.channel);
                    return [2 /*return*/, {
                            id: ch.id,
                            type: v10_1.ChannelType.GuildText,
                            name: (_d = ch.name) !== null && _d !== void 0 ? _d : '',
                            guild_id: guildId,
                            topic: (_f = (_e = ch.topic) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : null,
                            position: 0,
                        }];
            }
        });
    });
}
/**
 * GET /guilds/:id/channels -> conversations.list
 */
function listChannels(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var listArgs, result;
        var _c;
        var slack = _b.slack, guildId = _b.guildId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    listArgs = {
                        types: 'public_channel,private_channel',
                        exclude_archived: true,
                        limit: 200,
                    };
                    return [4 /*yield*/, slack.conversations.list(listArgs)];
                case 1:
                    result = _d.sent();
                    return [2 /*return*/, ((_c = result.channels) !== null && _c !== void 0 ? _c : []).map(function (ch) {
                            var _a, _b, _c;
                            var c = requireSlackChannelId(ch);
                            return {
                                id: c.id,
                                type: v10_1.ChannelType.GuildText,
                                name: (_a = c.name) !== null && _a !== void 0 ? _a : '',
                                guild_id: guildId,
                                topic: (_c = (_b = c.topic) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : null,
                                position: 0,
                            };
                        })];
            }
        });
    });
}
/**
 * PATCH /channels/:id -> conversations.rename / conversations.setTopic / archive
 */
function updateChannel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var renameArgs, topicArgs, archiveArgs;
        var slack = _b.slack, channelId = _b.channelId, body = _b.body, guildId = _b.guildId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!body.name) return [3 /*break*/, 2];
                    renameArgs = {
                        channel: channelId,
                        name: body.name,
                    };
                    return [4 /*yield*/, slack.conversations.rename(renameArgs)];
                case 1:
                    _c.sent();
                    _c.label = 2;
                case 2:
                    if (!body.topic) return [3 /*break*/, 4];
                    topicArgs = {
                        channel: channelId,
                        topic: body.topic,
                    };
                    return [4 /*yield*/, slack.conversations.setTopic(topicArgs)];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    if (!(body.archived === true)) return [3 /*break*/, 6];
                    archiveArgs = {
                        channel: channelId,
                    };
                    return [4 /*yield*/, slack.conversations.archive(archiveArgs)];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6: return [2 /*return*/, getChannel({
                        slack: slack,
                        channelId: channelId,
                        guildId: guildId,
                    })];
            }
        });
    });
}
function setThreadTypingStatus(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var target;
        var slack = _b.slack, threadChannelId = _b.threadChannelId, statusText = _b.statusText;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    target = (0, id_converter_js_1.resolveSlackTarget)(threadChannelId);
                    if (!target.threadTs) {
                        throw new Error("Thread channel ".concat(threadChannelId, " resolved without threadTs"));
                    }
                    return [4 /*yield*/, slack.apiCall('assistant.threads.setStatus', {
                            channel_id: target.channel,
                            thread_ts: target.threadTs,
                            status: statusText,
                            loading_messages: [statusText],
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, {
                            channelId: target.channel,
                            threadTs: target.threadTs,
                        }];
            }
        });
    });
}
function clearThreadTypingStatus(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var target;
        var slack = _b.slack, threadChannelId = _b.threadChannelId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    target = (0, id_converter_js_1.resolveSlackTarget)(threadChannelId);
                    if (!target.threadTs) {
                        throw new Error("Thread channel ".concat(threadChannelId, " resolved without threadTs"));
                    }
                    return [4 /*yield*/, slack.apiCall('assistant.threads.setStatus', {
                            channel_id: target.channel,
                            thread_ts: target.threadTs,
                            status: '',
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, {
                            channelId: target.channel,
                            threadTs: target.threadTs,
                        }];
            }
        });
    });
}
/**
 * POST /guilds/:id/channels -> conversations.create
 */
function createChannel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var createArgs, result, channel;
        var _c, _d, _e;
        var slack = _b.slack, guildId = _b.guildId, body = _b.body;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    createArgs = {
                        name: body.name,
                        is_private: false,
                    };
                    return [4 /*yield*/, slack.conversations.create(createArgs)];
                case 1:
                    result = _f.sent();
                    channel = requireSlackChannelId(result.channel);
                    return [2 /*return*/, {
                            id: channel.id,
                            type: v10_1.ChannelType.GuildText,
                            name: (_c = channel.name) !== null && _c !== void 0 ? _c : body.name,
                            guild_id: guildId,
                            topic: (_e = (_d = channel.topic) === null || _d === void 0 ? void 0 : _d.value) !== null && _e !== void 0 ? _e : null,
                            position: 0,
                        }];
            }
        });
    });
}
/**
 * GET /guilds/:id/members -> users.list
 */
function listGuildMembers(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var args, result;
        var _c;
        var slack = _b.slack;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    args = {
                        limit: 200,
                    };
                    return [4 /*yield*/, slack.users.list(args)];
                case 1:
                    result = _d.sent();
                    return [2 /*return*/, ((_c = result.members) !== null && _c !== void 0 ? _c : [])
                            .filter(function (member) {
                            return !!member.id;
                        })
                            .map(function (member) {
                            var _a, _b, _c, _d, _e, _f;
                            return {
                                user: {
                                    id: member.id,
                                    username: (_a = member.name) !== null && _a !== void 0 ? _a : member.id,
                                    discriminator: '0',
                                    avatar: (_c = (_b = member.profile) === null || _b === void 0 ? void 0 : _b.image_72) !== null && _c !== void 0 ? _c : null,
                                    bot: (_d = member.is_bot) !== null && _d !== void 0 ? _d : false,
                                    global_name: (_f = (_e = member.real_name) !== null && _e !== void 0 ? _e : member.name) !== null && _f !== void 0 ? _f : null,
                                },
                                roles: [],
                                joined_at: new Date().toISOString(),
                                deaf: false,
                                mute: false,
                                flags: v10_1.GuildMemberFlags.CompletedOnboarding,
                            };
                        })];
            }
        });
    });
}
/**
 * GET /guilds/:id/members/:uid -> users.info
 */
function getGuildMember(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var user;
        var slack = _b.slack, userId = _b.userId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getUser({
                        slack: slack,
                        userId: userId,
                    })];
                case 1:
                    user = _c.sent();
                    return [2 /*return*/, {
                            user: user,
                            roles: [],
                            joined_at: new Date().toISOString(),
                            deaf: false,
                            mute: false,
                            flags: v10_1.GuildMemberFlags.CompletedOnboarding,
                        }];
            }
        });
    });
}
/**
 * GET /guilds/:id/roles -> usergroups.list
 */
function listGuildRoles(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var args, result;
        var _c;
        var slack = _b.slack;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    args = {
                        include_disabled: false,
                        include_users: false,
                    };
                    return [4 /*yield*/, slack.usergroups.list(args)];
                case 1:
                    result = _d.sent();
                    return [2 /*return*/, ((_c = result.usergroups) !== null && _c !== void 0 ? _c : [])
                            .filter(function (group) {
                            return !!(group.id && group.name);
                        })
                            .map(function (group) {
                            return {
                                id: group.id,
                                name: group.name,
                                color: 0,
                                hoist: false,
                                icon: null,
                                unicode_emoji: null,
                                position: 0,
                                permissions: String(v10_1.PermissionFlagsBits.ViewChannel),
                                managed: true,
                                mentionable: true,
                                flags: v10_1.RoleFlags.InPrompt,
                            };
                        })];
            }
        });
    });
}
/**
 * Type 9 interaction responses -> views.open
 */
function openModalView(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var submitLabel, blocks, openArgs;
        var _c, _d, _e;
        var slack = _b.slack, triggerId = _b.triggerId, modal = _b.modal;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    submitLabel = normalizeSlackModalLabel({
                        value: modal.submit,
                        fallback: 'Submit',
                    });
                    blocks = ((_c = modal.components) !== null && _c !== void 0 ? _c : [])
                        .flatMap(function (row) {
                        return row.components;
                    })
                        .filter(function (component) {
                        return component.type === v10_1.ComponentType.TextInput;
                    })
                        .map(function (textInput) {
                        return {
                            type: 'input',
                            block_id: textInput.custom_id,
                            label: {
                                type: 'plain_text',
                                text: textInput.label,
                            },
                            element: {
                                type: 'plain_text_input',
                                action_id: textInput.custom_id,
                                multiline: textInput.style === v10_1.TextInputStyle.Paragraph,
                                initial_value: textInput.value,
                                placeholder: textInput.placeholder
                                    ? {
                                        type: 'plain_text',
                                        text: textInput.placeholder,
                                    }
                                    : undefined,
                            },
                            optional: textInput.required === false,
                        };
                    });
                    openArgs = {
                        trigger_id: triggerId,
                        view: {
                            type: 'modal',
                            callback_id: (_d = modal.custom_id) !== null && _d !== void 0 ? _d : 'modal',
                            title: {
                                type: 'plain_text',
                                text: (_e = modal.title) !== null && _e !== void 0 ? _e : 'Modal',
                            },
                            submit: {
                                type: 'plain_text',
                                text: submitLabel,
                            },
                            close: modal.cancel
                                ? {
                                    type: 'plain_text',
                                    text: normalizeSlackModalLabel({
                                        value: modal.cancel,
                                        fallback: 'Cancel',
                                    }),
                                }
                                : undefined,
                            private_metadata: modal.private_metadata,
                            blocks: blocks,
                        },
                    };
                    return [4 /*yield*/, slack.views.open(openArgs)];
                case 1:
                    _f.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function normalizeSlackModalLabel(_a) {
    var value = _a.value, fallback = _a.fallback;
    var normalized = value === null || value === void 0 ? void 0 : value.trim();
    if (!normalized) {
        return fallback;
    }
    return normalized.slice(0, 24);
}
// ---- Reactions ----
/**
 * PUT /channels/:id/messages/:mid/reactions/:emoji/@me -> reactions.add
 */
function addReaction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, ts, decoded, emojiName, addArgs;
        var slack = _b.slack, channelId = _b.channelId, messageId = _b.messageId, emoji = _b.emoji;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channel = (0, id_converter_js_1.resolveSlackTarget)(channelId).channel;
                    if ((0, id_converter_js_1.isEncodedMessageId)(messageId)) {
                        decoded = (0, id_converter_js_1.decodeMessageId)(messageId);
                        ts = decoded.ts;
                    }
                    else {
                        ts = messageId;
                    }
                    emojiName = emoji.replace(/:/g, '').split('~')[0];
                    addArgs = {
                        channel: channel,
                        timestamp: ts,
                        name: emojiName,
                    };
                    return [4 /*yield*/, slack.reactions.add(addArgs)];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * DELETE /channels/:id/messages/:mid/reactions/:emoji/@me -> reactions.remove
 */
function removeReaction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, ts, decoded, emojiName, removeArgs;
        var slack = _b.slack, channelId = _b.channelId, messageId = _b.messageId, emoji = _b.emoji;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channel = (0, id_converter_js_1.resolveSlackTarget)(channelId).channel;
                    if ((0, id_converter_js_1.isEncodedMessageId)(messageId)) {
                        decoded = (0, id_converter_js_1.decodeMessageId)(messageId);
                        ts = decoded.ts;
                    }
                    else {
                        ts = messageId;
                    }
                    emojiName = emoji.replace(/:/g, '').split('~')[0];
                    removeArgs = {
                        channel: channel,
                        timestamp: ts,
                        name: emojiName,
                    };
                    return [4 /*yield*/, slack.reactions.remove(removeArgs)];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// ---- Users ----
/**
 * GET /users/:id -> users.info
 */
function getUser(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var userInfoArgs, result, user;
        var _c, _d, _e, _f, _g, _h;
        var slack = _b.slack, userId = _b.userId;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    userInfoArgs = { user: userId };
                    return [4 /*yield*/, slack.users.info(userInfoArgs)];
                case 1:
                    result = _j.sent();
                    user = requireSlackUserId(result.user);
                    return [2 /*return*/, {
                            id: user.id,
                            username: (_c = user.name) !== null && _c !== void 0 ? _c : 'unknown',
                            discriminator: '0',
                            avatar: (_e = (_d = user.profile) === null || _d === void 0 ? void 0 : _d.image_72) !== null && _e !== void 0 ? _e : null,
                            bot: (_f = user.is_bot) !== null && _f !== void 0 ? _f : false,
                            global_name: (_h = (_g = user.real_name) !== null && _g !== void 0 ? _g : user.name) !== null && _h !== void 0 ? _h : null,
                        }];
            }
        });
    });
}
// ---- Threads ----
/**
 * POST /channels/:id/threads -> post first message to create Slack thread
 */
function createThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var createThreadArgs, result, threadTs, threadChannelId;
        var _c;
        var slack = _b.slack, parentChannelId = _b.parentChannelId, body = _b.body, botUserId = _b.botUserId, guildId = _b.guildId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    createThreadArgs = {
                        channel: parentChannelId,
                        text: body.name,
                    };
                    return [4 /*yield*/, postMessageWithJoinRetry({
                            slack: slack,
                            postArgs: createThreadArgs,
                            channel: parentChannelId,
                        })];
                case 1:
                    result = _d.sent();
                    threadTs = result.ts;
                    if (!threadTs) {
                        throw new Error('Slack chat.postMessage response missing ts for thread creation');
                    }
                    threadChannelId = (0, id_converter_js_1.encodeThreadId)(parentChannelId, threadTs);
                    return [2 /*return*/, {
                            id: threadChannelId,
                            type: v10_1.ChannelType.PublicThread,
                            name: body.name,
                            guild_id: guildId,
                            parent_id: parentChannelId,
                            owner_id: botUserId,
                            message_count: 0,
                            member_count: 1,
                            thread_metadata: {
                                archived: false,
                                auto_archive_duration: (_c = body.auto_archive_duration) !== null && _c !== void 0 ? _c : 1440,
                                archive_timestamp: (0, id_converter_js_1.slackTsToIso)(threadTs),
                                locked: false,
                            },
                        }];
            }
        });
    });
}
function createThreadFromMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, threadTs, repliesArgs, replies, hasParentMessage, threadChannelId;
        var _c, _d;
        var slack = _b.slack, parentChannelId = _b.parentChannelId, messageId = _b.messageId, body = _b.body, botUserId = _b.botUserId, guildId = _b.guildId;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    channel = (0, id_converter_js_1.resolveSlackTarget)(parentChannelId).channel;
                    threadTs = (0, id_converter_js_1.isEncodedMessageId)(messageId)
                        ? (0, id_converter_js_1.decodeMessageId)(messageId).ts
                        : messageId;
                    repliesArgs = {
                        channel: channel,
                        ts: threadTs,
                        limit: 1,
                        inclusive: true,
                    };
                    return [4 /*yield*/, slack.conversations.replies(repliesArgs)];
                case 1:
                    replies = _e.sent();
                    hasParentMessage = ((_c = replies.messages) !== null && _c !== void 0 ? _c : []).some(function (message) {
                        return message.ts === threadTs;
                    });
                    if (!hasParentMessage) {
                        throw new Error("Unknown Message: ".concat(messageId));
                    }
                    threadChannelId = (0, id_converter_js_1.encodeThreadId)(channel, threadTs);
                    return [2 /*return*/, {
                            id: threadChannelId,
                            type: v10_1.ChannelType.PublicThread,
                            name: body.name,
                            guild_id: guildId,
                            parent_id: parentChannelId,
                            owner_id: botUserId,
                            message_count: 0,
                            member_count: 1,
                            thread_metadata: {
                                archived: false,
                                auto_archive_duration: (_d = body.auto_archive_duration) !== null && _d !== void 0 ? _d : 1440,
                                archive_timestamp: (0, id_converter_js_1.slackTsToIso)(threadTs),
                                locked: false,
                            },
                        }];
            }
        });
    });
}
function postMessageWithJoinRetry(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var cause_1, joinArgs;
        var slack = _b.slack, postArgs = _b.postArgs, channel = _b.channel;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 4]);
                    return [4 /*yield*/, slack.chat.postMessage(postArgs)];
                case 1: return [2 /*return*/, _c.sent()];
                case 2:
                    cause_1 = _c.sent();
                    if (!isNotInChannelError(cause_1)) {
                        throw cause_1;
                    }
                    joinArgs = {
                        channel: channel,
                    };
                    // Slack returns `not_in_channel` if the bot has permission but is not a
                    // member of the target conversation yet. Joining and retrying mirrors
                    // Discord's bot behavior where posting is allowed once the bot is present
                    // in the channel. For private channels without an invite, join will fail
                    // and we surface that error instead of silently swallowing it.
                    return [4 /*yield*/, slack.conversations.join(joinArgs)];
                case 3:
                    // Slack returns `not_in_channel` if the bot has permission but is not a
                    // member of the target conversation yet. Joining and retrying mirrors
                    // Discord's bot behavior where posting is allowed once the bot is present
                    // in the channel. For private channels without an invite, join will fail
                    // and we surface that error instead of silently swallowing it.
                    _c.sent();
                    return [2 /*return*/, slack.chat.postMessage(postArgs)];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function isNotInChannelError(error) {
    if (!(error instanceof Error)) {
        return false;
    }
    return error.message.includes('not_in_channel');
}
function listThreadMembers(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var threadTarget, parent, repliesArgs, replies, participants, uniqueParticipants;
        var _c;
        var slack = _b.slack, threadChannelId = _b.threadChannelId, botUserId = _b.botUserId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    threadTarget = resolveThreadTarget({ threadChannelId: threadChannelId });
                    return [4 /*yield*/, fetchThreadParentMessage({
                            slack: slack,
                            channel: threadTarget.channel,
                            threadTs: threadTarget.threadTs,
                            threadChannelId: threadChannelId,
                        })];
                case 1:
                    parent = _d.sent();
                    repliesArgs = {
                        channel: threadTarget.channel,
                        ts: threadTarget.threadTs,
                        inclusive: true,
                        limit: 100,
                    };
                    return [4 /*yield*/, slack.conversations.replies(repliesArgs)];
                case 2:
                    replies = _d.sent();
                    participants = [parent.user, parent.bot_id]
                        .concat(((_c = replies.messages) !== null && _c !== void 0 ? _c : []).flatMap(function (message) {
                        return [message.user, message.bot_id];
                    }))
                        .filter(isNonEmptyString)
                        .map(function (participant) {
                        if (participant.startsWith('B')) {
                            return botUserId;
                        }
                        return participant;
                    });
                    uniqueParticipants = __spreadArray([], new Set(participants), true);
                    return [2 /*return*/, uniqueParticipants.map(function (userId) {
                            return buildApiThreadMember({
                                threadChannelId: threadChannelId,
                                userId: userId,
                                joinedAtTs: threadTarget.threadTs,
                            });
                        })];
            }
        });
    });
}
function getThreadMember(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var members, existing, threadTs;
        var slack = _b.slack, threadChannelId = _b.threadChannelId, userId = _b.userId, botUserId = _b.botUserId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, listThreadMembers({
                        slack: slack,
                        threadChannelId: threadChannelId,
                        botUserId: botUserId,
                    })];
                case 1:
                    members = _c.sent();
                    existing = members.find(function (member) {
                        return member.user_id === userId;
                    });
                    if (existing) {
                        return [2 /*return*/, existing];
                    }
                    threadTs = resolveThreadTarget({ threadChannelId: threadChannelId }).threadTs;
                    return [2 /*return*/, buildApiThreadMember({
                            threadChannelId: threadChannelId,
                            userId: userId,
                            joinedAtTs: threadTs,
                        })];
            }
        });
    });
}
function joinThreadMember(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var target;
        var slack = _b.slack, threadChannelId = _b.threadChannelId, userId = _b.userId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    target = resolveThreadTarget({ threadChannelId: threadChannelId });
                    return [4 /*yield*/, fetchThreadParentMessage({
                            slack: slack,
                            channel: target.channel,
                            threadTs: target.threadTs,
                            threadChannelId: threadChannelId,
                        })];
                case 1:
                    _c.sent();
                    void userId;
                    return [2 /*return*/];
            }
        });
    });
}
function leaveThreadMember(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var target;
        var slack = _b.slack, threadChannelId = _b.threadChannelId, userId = _b.userId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    target = resolveThreadTarget({ threadChannelId: threadChannelId });
                    return [4 /*yield*/, fetchThreadParentMessage({
                            slack: slack,
                            channel: target.channel,
                            threadTs: target.threadTs,
                            threadChannelId: threadChannelId,
                        })];
                case 1:
                    _c.sent();
                    void userId;
                    return [2 /*return*/];
            }
        });
    });
}
function getActiveThreads(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var listArgs, listed, channels, threadMap, memberMap, _i, channels_1, channel, channelId, historyArgs, history_1, parentCandidates, _loop_1, _c, parentCandidates_1, parent_1;
        var _d, _e, _f, _g, _h;
        var slack = _b.slack, guildId = _b.guildId, botUserId = _b.botUserId;
        return __generator(this, function (_j) {
            switch (_j.label) {
                case 0:
                    listArgs = {
                        types: 'public_channel,private_channel',
                        exclude_archived: true,
                        limit: 200,
                    };
                    return [4 /*yield*/, slack.conversations.list(listArgs)];
                case 1:
                    listed = _j.sent();
                    channels = ((_d = listed.channels) !== null && _d !== void 0 ? _d : []).filter(function (channel) {
                        return Boolean(channel.id);
                    });
                    threadMap = new Map();
                    memberMap = new Map();
                    _i = 0, channels_1 = channels;
                    _j.label = 2;
                case 2:
                    if (!(_i < channels_1.length)) return [3 /*break*/, 8];
                    channel = channels_1[_i];
                    channelId = channel.id;
                    if (!channelId) {
                        return [3 /*break*/, 7];
                    }
                    historyArgs = {
                        channel: channelId,
                        limit: 50,
                    };
                    return [4 /*yield*/, slack.conversations.history(historyArgs)];
                case 3:
                    history_1 = _j.sent();
                    parentCandidates = ((_e = history_1.messages) !== null && _e !== void 0 ? _e : []).filter(function (message) {
                        return Boolean(message.ts);
                    });
                    _loop_1 = function (parent_1) {
                        var parentTs, repliesArgs, replies, replyMessages, threadChannelId, threadName, participants, _k, participants_1, participant, key;
                        return __generator(this, function (_l) {
                            switch (_l.label) {
                                case 0:
                                    parentTs = parent_1.ts;
                                    if (!parentTs) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    repliesArgs = {
                                        channel: channelId,
                                        ts: parentTs,
                                        inclusive: true,
                                        limit: 2,
                                    };
                                    return [4 /*yield*/, slack.conversations.replies(repliesArgs)];
                                case 1:
                                    replies = _l.sent();
                                    replyMessages = (_f = replies.messages) !== null && _f !== void 0 ? _f : [];
                                    if (replyMessages.length < 2) {
                                        return [2 /*return*/, "continue"];
                                    }
                                    threadChannelId = (0, id_converter_js_1.encodeThreadId)(channelId, parentTs);
                                    if (!threadMap.has(threadChannelId)) {
                                        threadName = (function () {
                                            var _a;
                                            var rawText = (_a = parent_1.text) === null || _a === void 0 ? void 0 : _a.trim();
                                            if (rawText) {
                                                return rawText.slice(0, 80);
                                            }
                                            return "thread-".concat(parentTs);
                                        })();
                                        threadMap.set(threadChannelId, {
                                            id: threadChannelId,
                                            type: v10_1.ChannelType.PublicThread,
                                            name: threadName,
                                            guild_id: guildId,
                                            parent_id: channelId,
                                            owner_id: (_h = (_g = parent_1.user) !== null && _g !== void 0 ? _g : parent_1.bot_id) !== null && _h !== void 0 ? _h : botUserId,
                                            message_count: Math.max(0, replyMessages.length - 1),
                                            member_count: new Set(replyMessages
                                                .flatMap(function (message) {
                                                return [message.user, message.bot_id];
                                            })
                                                .filter(isNonEmptyString)).size,
                                            thread_metadata: {
                                                archived: false,
                                                auto_archive_duration: 1440,
                                                archive_timestamp: (0, id_converter_js_1.slackTsToIso)(parentTs),
                                                locked: false,
                                            },
                                        });
                                    }
                                    participants = replyMessages
                                        .flatMap(function (message) {
                                        return [message.user, message.bot_id];
                                    })
                                        .filter(isNonEmptyString);
                                    for (_k = 0, participants_1 = participants; _k < participants_1.length; _k++) {
                                        participant = participants_1[_k];
                                        key = "".concat(threadChannelId, ":").concat(participant);
                                        if (memberMap.has(key)) {
                                            continue;
                                        }
                                        memberMap.set(key, buildApiThreadMember({
                                            threadChannelId: threadChannelId,
                                            userId: participant,
                                            joinedAtTs: parentTs,
                                        }));
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c = 0, parentCandidates_1 = parentCandidates;
                    _j.label = 4;
                case 4:
                    if (!(_c < parentCandidates_1.length)) return [3 /*break*/, 7];
                    parent_1 = parentCandidates_1[_c];
                    return [5 /*yield**/, _loop_1(parent_1)];
                case 5:
                    _j.sent();
                    _j.label = 6;
                case 6:
                    _c++;
                    return [3 /*break*/, 4];
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8: return [2 /*return*/, {
                        threads: __spreadArray([], threadMap.values(), true),
                        members: __spreadArray([], memberMap.values(), true),
                    }];
            }
        });
    });
}
// ---- Helpers ----
function buildApiMessage(_a) {
    var messageId = _a.messageId, channelId = _a.channelId, ts = _a.ts, content = _a.content, botUserId = _a.botUserId, guildId = _a.guildId, edited = _a.edited;
    return {
        id: messageId,
        channel_id: channelId,
        author: {
            id: botUserId,
            username: 'bot',
            discriminator: '0',
            avatar: null,
            global_name: null,
        },
        content: content,
        timestamp: (0, id_converter_js_1.slackTsToIso)(ts),
        edited_timestamp: edited ? new Date().toISOString() : null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        mention_roles: [],
        attachments: [],
        embeds: [],
        pinned: false,
        type: v10_1.MessageType.Default,
    };
}
function mapSlackFilesToDiscordAttachments(files) {
    var slackFiles = files !== null && files !== void 0 ? files : [];
    return slackFiles
        .map(function (file) {
        var _a, _b, _c;
        if (!(file === null || file === void 0 ? void 0 : file.id) || !file.name) {
            return undefined;
        }
        var attachmentUrl = (_b = (_a = file.url_private) !== null && _a !== void 0 ? _a : file.permalink) !== null && _b !== void 0 ? _b : '';
        return {
            id: file.id,
            filename: file.name,
            size: (_c = file.size) !== null && _c !== void 0 ? _c : 0,
            url: attachmentUrl,
            proxy_url: attachmentUrl,
            content_type: file.mimetype,
        };
    })
        .filter(isDefined);
}
function buildApiThreadMember(_a) {
    var threadChannelId = _a.threadChannelId, userId = _a.userId, joinedAtTs = _a.joinedAtTs;
    return {
        id: threadChannelId,
        user_id: userId,
        join_timestamp: (0, id_converter_js_1.slackTsToIso)(joinedAtTs),
        flags: noFlags(),
    };
}
function noFlags() {
    return 0;
}
function resolveThreadTarget(_a) {
    var threadChannelId = _a.threadChannelId;
    if (!(0, id_converter_js_1.isThreadChannelId)(threadChannelId)) {
        throw new UnknownChannelError(threadChannelId);
    }
    var resolved = (function () {
        try {
            return (0, id_converter_js_1.resolveSlackTarget)(threadChannelId);
        }
        catch (_a) {
            throw new UnknownChannelError(threadChannelId);
        }
    })();
    if (!resolved.threadTs) {
        throw new UnknownChannelError(threadChannelId);
    }
    return {
        channel: resolved.channel,
        threadTs: resolved.threadTs,
    };
}
function fetchThreadParentMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var repliesArgs, replies, parent;
        var _c;
        var slack = _b.slack, channel = _b.channel, threadTs = _b.threadTs, threadChannelId = _b.threadChannelId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    repliesArgs = {
                        channel: channel,
                        ts: threadTs,
                        inclusive: true,
                        limit: 1,
                    };
                    return [4 /*yield*/, slack.conversations.replies(repliesArgs)];
                case 1:
                    replies = _d.sent();
                    parent = ((_c = replies.messages) !== null && _c !== void 0 ? _c : []).find(function (message) {
                        return message.ts === threadTs;
                    });
                    if (!parent) {
                        throw new UnknownChannelError(threadChannelId);
                    }
                    return [2 /*return*/, parent];
            }
        });
    });
}
function isNonEmptyString(value) {
    return Boolean(value);
}
function isDefined(value) {
    return value !== undefined;
}
function buildApiMessageFromSlack(_a) {
    var _b, _c, _d;
    var msg = _a.msg, channel = _a.channel, channelId = _a.channelId, botUserId = _a.botUserId, guildId = _a.guildId;
    var msgTs = (_b = msg.ts) !== null && _b !== void 0 ? _b : '';
    var msgUser = (_c = msg.user) !== null && _c !== void 0 ? _c : botUserId;
    var msgText = (_d = msg.text) !== null && _d !== void 0 ? _d : '';
    return {
        id: (0, id_converter_js_1.encodeMessageId)(channel, msgTs),
        channel_id: channelId,
        author: {
            id: msgUser,
            username: msgUser,
            discriminator: '0',
            avatar: null,
            global_name: null,
        },
        content: (0, format_converter_js_1.mrkdwnToMarkdown)(msgText),
        timestamp: (0, id_converter_js_1.slackTsToIso)(msgTs),
        edited_timestamp: null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        mention_roles: [],
        attachments: mapSlackFilesToDiscordAttachments(msg.files),
        embeds: [],
        pinned: false,
        type: v10_1.MessageType.Default,
    };
}
function requireSlackChannelId(channel) {
    if (!(channel === null || channel === void 0 ? void 0 : channel.id)) {
        throw new Error('Slack channel payload missing id');
    }
    return {
        id: channel.id,
        name: channel.name,
        topic: channel.topic
            ? { value: channel.topic.value }
            : undefined,
        is_private: 'is_private' in channel ? channel.is_private : undefined,
    };
}
function requireSlackUserId(user) {
    if (!(user === null || user === void 0 ? void 0 : user.id)) {
        throw new Error('Slack user payload missing id');
    }
    return {
        id: user.id,
        name: user.name,
        real_name: user.real_name,
        is_bot: user.is_bot,
        profile: user.profile
            ? { image_72: user.profile.image_72 }
            : undefined,
    };
}
// ---- Discord-shaped errors ----
/**
 * Bridge error that maps to a specific Discord REST API error shape.
 * Route handlers catch these and return { code, message } JSON with the
 * appropriate HTTP status.
 */
var DiscordApiError = /** @class */ (function (_super) {
    __extends(DiscordApiError, _super);
    function DiscordApiError(_a) {
        var httpStatus = _a.httpStatus, discordCode = _a.discordCode, message = _a.message;
        var _this = _super.call(this, message) || this;
        _this.httpStatus = httpStatus;
        _this.discordCode = discordCode;
        return _this;
    }
    DiscordApiError.prototype.toResponse = function () {
        return Response.json({ code: this.discordCode, message: this.message }, { status: this.httpStatus });
    };
    return DiscordApiError;
}(Error));
exports.DiscordApiError = DiscordApiError;
var MessageNotFoundError = /** @class */ (function (_super) {
    __extends(MessageNotFoundError, _super);
    function MessageNotFoundError(messageId) {
        return _super.call(this, {
            httpStatus: 404,
            discordCode: 10008,
            message: "Unknown Message: ".concat(messageId),
        }) || this;
    }
    return MessageNotFoundError;
}(DiscordApiError));
exports.MessageNotFoundError = MessageNotFoundError;
var UnknownChannelError = /** @class */ (function (_super) {
    __extends(UnknownChannelError, _super);
    function UnknownChannelError(channelId) {
        return _super.call(this, {
            httpStatus: 404,
            discordCode: 10003,
            message: "Unknown Channel: ".concat(channelId),
        }) || this;
    }
    return UnknownChannelError;
}(DiscordApiError));
exports.UnknownChannelError = UnknownChannelError;
var UnknownGuildError = /** @class */ (function (_super) {
    __extends(UnknownGuildError, _super);
    function UnknownGuildError(guildId) {
        return _super.call(this, {
            httpStatus: 404,
            discordCode: 10004,
            message: "Unknown Guild: ".concat(guildId),
        }) || this;
    }
    return UnknownGuildError;
}(DiscordApiError));
exports.UnknownGuildError = UnknownGuildError;
var MissingAccessError = /** @class */ (function (_super) {
    __extends(MissingAccessError, _super);
    function MissingAccessError() {
        return _super.call(this, {
            httpStatus: 403,
            discordCode: 50001,
            message: 'Missing Access',
        }) || this;
    }
    return MissingAccessError;
}(DiscordApiError));
exports.MissingAccessError = MissingAccessError;
var MissingPermissionsError = /** @class */ (function (_super) {
    __extends(MissingPermissionsError, _super);
    function MissingPermissionsError(message) {
        if (message === void 0) { message = 'Missing Permissions'; }
        return _super.call(this, {
            httpStatus: 403,
            discordCode: 50013,
            message: message,
        }) || this;
    }
    return MissingPermissionsError;
}(DiscordApiError));
exports.MissingPermissionsError = MissingPermissionsError;
/**
 * Maps a Slack API error (from WebClient) to a DiscordApiError.
 * Slack errors have a `data.error` string like "channel_not_found".
 */
function mapSlackErrorToDiscordError(err) {
    var slackErrorContext = extractSlackErrorContext(err);
    var slackError = slackErrorContext.code;
    switch (slackError) {
        case 'invalid_auth':
        case 'not_authed':
        case 'account_inactive':
        case 'token_revoked':
            return new DiscordApiError({
                httpStatus: 401,
                discordCode: 50014,
                message: 'Invalid authentication token',
            });
        case 'channel_not_found':
            return new UnknownChannelError('unknown');
        case 'message_not_found':
        case 'thread_not_found':
            return new MessageNotFoundError('unknown');
        case 'not_in_channel':
            return new MissingAccessError();
        case 'no_permission':
        case 'cant_update_message':
        case 'cant_delete_message':
        case 'not_allowed_token_type':
            return new MissingPermissionsError();
        case 'missing_scope': {
            var scopeMessage = slackErrorContext.needed
                ? "Missing Permissions (Slack missing scope: ".concat(slackErrorContext.needed, ")")
                : 'Missing Permissions (Slack missing required scope)';
            return new MissingPermissionsError(scopeMessage);
        }
        case 'is_archived':
            return new DiscordApiError({
                httpStatus: 403,
                discordCode: 50001,
                message: 'Channel is archived',
            });
        default:
            return new DiscordApiError({
                httpStatus: 500,
                discordCode: 0,
                message: "Slack API error: ".concat(slackError || 'unknown'),
            });
    }
}
/** Extract the error code string from a Slack WebClient error. */
function extractSlackErrorCode(err) {
    return extractSlackErrorContext(err).code;
}
function extractSlackErrorContext(err) {
    if (!(err instanceof Error)) {
        return {};
    }
    var platformError = isWebApiPlatformError(err) ? err : undefined;
    var code = platformError === null || platformError === void 0 ? void 0 : platformError.data.error;
    var needed = platformError
        ? readOptionalString(Reflect.get(platformError.data, 'needed'))
        : undefined;
    var provided = platformError
        ? readOptionalString(Reflect.get(platformError.data, 'provided'))
        : undefined;
    if (code) {
        return {
            code: code,
            needed: needed,
            provided: provided,
        };
    }
    // Some errors embed the code in the message like "An API error occurred: channel_not_found"
    var match = err.message.match(/An API error occurred: (\S+)/);
    return {
        code: match === null || match === void 0 ? void 0 : match[1],
    };
}
function isWebApiPlatformError(error) {
    if (!('code' in error)) {
        return false;
    }
    if (error.code !== web_api_1.ErrorCode.PlatformError) {
        return false;
    }
    if (!('data' in error)) {
        return false;
    }
    var data = error.data;
    return (typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof data.error === 'string');
}
function readOptionalString(value) {
    return typeof value === 'string' ? value : undefined;
}
