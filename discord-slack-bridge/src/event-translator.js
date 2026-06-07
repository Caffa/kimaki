"use strict";
// Translates Slack webhook events into Discord Gateway dispatch payloads.
// Each function takes a Slack event and returns a Discord-shaped object
// that can be broadcast via the Gateway.
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateMessageCreate = translateMessageCreate;
exports.translateMessageUpdate = translateMessageUpdate;
exports.translateMessageDelete = translateMessageDelete;
exports.translateReaction = translateReaction;
exports.translateChannelCreate = translateChannelCreate;
exports.translateChannelDelete = translateChannelDelete;
exports.translateChannelRename = translateChannelRename;
exports.translateMemberJoinedChannel = translateMemberJoinedChannel;
exports.buildThreadChannel = buildThreadChannel;
var v10_1 = require("discord-api-types/v10");
var id_converter_js_1 = require("./id-converter.js");
var format_converter_js_1 = require("./format-converter.js");
var DISCORD_DEFAULT_DISCRIMINATOR = '0';
/**
 * Translate a Slack message event into a Discord MESSAGE_CREATE payload.
 */
function translateMessageCreate(_a) {
    var _b, _c;
    var event = _a.event, guildId = _a.guildId, author = _a.author;
    if (!(event.channel && event.ts)) {
        return null;
    }
    var channelId = (0, id_converter_js_1.resolveDiscordChannelId)(event.channel, event.threadTs, event.ts);
    var messageId = (0, id_converter_js_1.encodeMessageId)(event.channel, event.ts);
    var content = (0, format_converter_js_1.mrkdwnToMarkdown)((_b = event.text) !== null && _b !== void 0 ? _b : '');
    var apiUser = {
        id: author.id,
        username: author.name,
        discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
        avatar: (_c = author.avatar) !== null && _c !== void 0 ? _c : null,
        bot: author.isBot,
        global_name: author.realName,
    };
    var apiMessage = {
        id: messageId,
        channel_id: channelId,
        author: apiUser,
        content: content,
        timestamp: (0, id_converter_js_1.slackTsToIso)(event.ts),
        edited_timestamp: null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        mention_roles: [],
        attachments: mapSlackFilesToDiscordAttachments(event.files),
        embeds: [],
        pinned: false,
        type: v10_1.MessageType.Default,
        guild_id: guildId,
    };
    return {
        eventName: v10_1.GatewayDispatchEvents.MessageCreate,
        data: apiMessage,
    };
}
/**
 * Translate a Slack message_changed subtype into MESSAGE_UPDATE.
 */
function translateMessageUpdate(_a) {
    var _b, _c;
    var event = _a.event, guildId = _a.guildId, author = _a.author;
    // message_changed has the updated message in event.message
    var inner = event.message;
    if (!(event.channel && (inner === null || inner === void 0 ? void 0 : inner.ts))) {
        return null;
    }
    var channelId = (0, id_converter_js_1.resolveDiscordChannelId)(event.channel, inner.threadTs, inner.ts);
    var messageId = (0, id_converter_js_1.encodeMessageId)(event.channel, inner.ts);
    var content = (0, format_converter_js_1.mrkdwnToMarkdown)((_b = inner.text) !== null && _b !== void 0 ? _b : '');
    var apiUser = {
        id: author.id,
        username: author.name,
        discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
        avatar: (_c = author.avatar) !== null && _c !== void 0 ? _c : null,
        bot: author.isBot,
        global_name: author.realName,
    };
    var apiMessage = {
        id: messageId,
        channel_id: channelId,
        author: apiUser,
        content: content,
        timestamp: (0, id_converter_js_1.slackTsToIso)(inner.ts),
        edited_timestamp: inner.editedTs ? (0, id_converter_js_1.slackTsToIso)(inner.editedTs) : null,
        tts: false,
        mention_everyone: false,
        mentions: [],
        mention_roles: [],
        attachments: mapSlackFilesToDiscordAttachments(inner.files),
        embeds: [],
        pinned: false,
        type: v10_1.MessageType.Default,
        guild_id: guildId,
    };
    return {
        eventName: v10_1.GatewayDispatchEvents.MessageUpdate,
        data: apiMessage,
    };
}
function mapSlackFilesToDiscordAttachments(files) {
    var slackFiles = files !== null && files !== void 0 ? files : [];
    return slackFiles.map(function (file) {
        var _a, _b, _c;
        var attachmentUrl = (_b = (_a = file.urlPrivate) !== null && _a !== void 0 ? _a : file.permalink) !== null && _b !== void 0 ? _b : '';
        return {
            id: file.id,
            filename: file.name,
            size: (_c = file.size) !== null && _c !== void 0 ? _c : 0,
            url: attachmentUrl,
            proxy_url: attachmentUrl,
            content_type: file.mimetype,
        };
    });
}
/**
 * Translate a Slack message_deleted subtype into MESSAGE_DELETE.
 */
function translateMessageDelete(_a) {
    var _b;
    var event = _a.event, guildId = _a.guildId;
    if (!(event.channel && event.deletedTs)) {
        return null;
    }
    var channelId = (0, id_converter_js_1.resolveDiscordChannelId)(event.channel, (_b = event.previousMessage) === null || _b === void 0 ? void 0 : _b.threadTs, event.deletedTs);
    var messageId = (0, id_converter_js_1.encodeMessageId)(event.channel, event.deletedTs);
    return {
        eventName: v10_1.GatewayDispatchEvents.MessageDelete,
        data: {
            id: messageId,
            channel_id: channelId,
            guild_id: guildId,
        },
    };
}
/**
 * Translate a Slack reaction event into MESSAGE_REACTION_ADD or REMOVE.
 */
function translateReaction(_a) {
    var event = _a.event, guildId = _a.guildId, threadTs = _a.threadTs;
    var messageId = (0, id_converter_js_1.encodeMessageId)(event.item.channel, event.item.ts);
    var channelId = (0, id_converter_js_1.resolveDiscordChannelId)(event.item.channel, threadTs, event.item.ts);
    return {
        eventName: event.type === 'reaction_added'
            ? v10_1.GatewayDispatchEvents.MessageReactionAdd
            : v10_1.GatewayDispatchEvents.MessageReactionRemove,
        data: {
            user_id: event.user,
            channel_id: channelId,
            message_id: messageId,
            guild_id: guildId,
            emoji: { name: event.reaction, id: null },
        },
    };
}
/**
 * Translate a Slack channel_created event into CHANNEL_CREATE.
 */
function translateChannelCreate(_a) {
    var channelId = _a.channelId, channelName = _a.channelName, guildId = _a.guildId;
    var channel = {
        id: channelId,
        type: v10_1.ChannelType.GuildText,
        name: channelName,
        guild_id: guildId,
        position: 0,
    };
    return {
        eventName: v10_1.GatewayDispatchEvents.ChannelCreate,
        data: channel,
    };
}
function translateChannelDelete(_a) {
    var channelId = _a.channelId, guildId = _a.guildId;
    return {
        eventName: v10_1.GatewayDispatchEvents.ChannelDelete,
        data: {
            id: channelId,
            guild_id: guildId,
        },
    };
}
function translateChannelRename(_a) {
    var channelId = _a.channelId, channelName = _a.channelName, guildId = _a.guildId;
    var channel = {
        id: channelId,
        type: v10_1.ChannelType.GuildText,
        name: channelName,
        guild_id: guildId,
        position: 0,
    };
    return {
        eventName: v10_1.GatewayDispatchEvents.ChannelUpdate,
        data: channel,
    };
}
function translateMemberJoinedChannel(_a) {
    var _b;
    var event = _a.event, user = _a.user;
    var member = {
        user: {
            id: user.id,
            username: user.name,
            discriminator: DISCORD_DEFAULT_DISCRIMINATOR,
            avatar: (_b = user.avatar) !== null && _b !== void 0 ? _b : null,
            bot: user.isBot,
            global_name: user.realName,
        },
        roles: [],
        joined_at: new Date().toISOString(),
        deaf: false,
        mute: false,
        flags: v10_1.GuildMemberFlags.CompletedOnboarding,
    };
    return {
        eventName: v10_1.GatewayDispatchEvents.GuildMemberAdd,
        data: member,
    };
}
/**
 * Build a Discord APIChannel object for a Slack thread.
 * Used when a new thread is detected (first reply to a message).
 */
function buildThreadChannel(_a) {
    var parentChannel = _a.parentChannel, threadTs = _a.threadTs, guildId = _a.guildId, name = _a.name;
    var threadId = (0, id_converter_js_1.encodeThreadId)(parentChannel, threadTs);
    return {
        id: threadId,
        type: v10_1.ChannelType.PublicThread,
        name: name !== null && name !== void 0 ? name : "thread-".concat(threadTs),
        guild_id: guildId,
        parent_id: parentChannel,
        message_count: 0,
        member_count: 0,
        thread_metadata: {
            archived: false,
            auto_archive_duration: 1440,
            archive_timestamp: (0, id_converter_js_1.slackTsToIso)(threadTs),
            locked: false,
        },
    };
}
