"use strict";
// Converters from Prisma DB rows to Slack Web API response shapes.
// Slack API responses always wrap data in { ok: true, ... }.
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
exports.userToSlack = userToSlack;
exports.channelToSlack = channelToSlack;
exports.messageToSlack = messageToSlack;
// SDK types have all fields optional. We return objects satisfying those shapes.
function userToSlack(_a) {
    var _b;
    var user = _a.user, workspaceId = _a.workspaceId;
    return {
        id: user.id,
        team_id: workspaceId,
        name: user.name,
        real_name: user.realName,
        is_bot: user.isBot,
        profile: {
            image_48: (_b = user.avatar) !== null && _b !== void 0 ? _b : undefined,
            real_name: user.realName,
            display_name: user.name,
        },
    };
}
function channelToSlack(_a) {
    var channel = _a.channel;
    return {
        id: channel.id,
        name: channel.name,
        is_channel: !channel.isPrivate,
        is_private: channel.isPrivate,
        is_archived: channel.isArchived,
        topic: { value: channel.topic },
        purpose: { value: channel.purpose },
        created: Math.floor(channel.createdAt.getTime() / 1000),
    };
}
function messageToSlack(_a) {
    var message = _a.message, reactions = _a.reactions;
    var result = {
        type: 'message',
        text: message.text,
        ts: message.ts,
    };
    if (message.userId && !message.botId) {
        result.user = message.userId;
    }
    if (message.botId) {
        result.bot_id = message.botId;
    }
    if (message.threadTs) {
        result.thread_ts = message.threadTs;
    }
    if (message.editedTs) {
        result.edited = { user: message.userId, ts: message.editedTs };
    }
    var blocks = JSON.parse(message.blocks);
    if (blocks && blocks.length > 0) {
        result.blocks = blocks;
    }
    var files = JSON.parse(message.files);
    if (files && files.length > 0) {
        result.files = files;
    }
    if (reactions && reactions.length > 0) {
        // Group reactions by name
        var grouped = new Map();
        for (var _i = 0, reactions_1 = reactions; _i < reactions_1.length; _i++) {
            var r = reactions_1[_i];
            var existing = grouped.get(r.name);
            if (existing) {
                existing.push(r.userId);
            }
            else {
                grouped.set(r.name, [r.userId]);
            }
        }
        result.reactions = __spreadArray([], grouped.entries(), true).map(function (_a) {
            var name = _a[0], users = _a[1];
            return ({
                name: name,
                users: users,
                count: users.length,
            });
        });
    }
    return result;
}
