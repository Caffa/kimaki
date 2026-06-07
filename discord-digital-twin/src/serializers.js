"use strict";
// Converters from Prisma DB rows to Discord API object shapes.
// Uses discord-api-types for return types. Return type annotations enforce
// type safety -- the compiler rejects missing/wrong fields. We avoid blanket
// `as Type` casts which silently bypass that checking.
//
// Exceptions where `as` is still used (each documented inline):
// - APIChannel return: union type that can't be satisfied without knowing
//   the concrete channel variant at compile time
// - APIMessage return: has many optional fields set conditionally
// - JSON.parse results: returns `any`, needs a type annotation
//
// For enum bitfield "zero" values (no flags set), we use a small helper
// that keeps the cast localized to one place.
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isoTimestamp = isoTimestamp;
exports.userToAPI = userToAPI;
exports.roleToAPI = roleToAPI;
exports.channelToAPI = channelToAPI;
exports.memberToAPI = memberToAPI;
exports.guildToAPI = guildToAPI;
exports.messageToAPI = messageToAPI;
exports.threadMemberToAPI = threadMemberToAPI;
var v10_1 = require("discord-api-types/v10");
// Discord bitfield enums don't include 0 as a member, but 0 is a valid
// value meaning "no flags set". This helper keeps the cast in one place.
function noFlags() {
    return 0;
}
// Format a Date as ISO 8601 with +00:00 offset instead of Z.
// Twilight's timestamp parser rejects the Z suffix due to minimum length checks.
function isoTimestamp(date) {
    return date.toISOString().replace('Z', '+00:00');
}
function userToAPI(user) {
    return {
        id: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        bot: user.bot,
        system: user.system,
        flags: user.flags,
        global_name: user.globalName,
        // mfa_enabled is required by twilight when deserializing the READY payload.
        mfa_enabled: false,
    };
}
function roleToAPI(role) {
    return {
        id: role.id,
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        position: role.position,
        permissions: role.permissions,
        managed: role.managed,
        mentionable: role.mentionable,
        flags: role.flags ? v10_1.RoleFlags.InPrompt : noFlags(),
        icon: undefined,
        unicode_emoji: undefined,
    };
}
function channelToAPI(channel) {
    var _a, _b, _c, _d, _e, _f, _g;
    // APIChannel is a discriminated union of 12 channel types keyed by `type`.
    // We build the shape generically because the concrete variant is only
    // known at runtime. The `as APIChannel` cast is justified -- it's a
    // single-hop cast on an object that has all the fields discord.js reads.
    var isThread = channel.type === 10 || channel.type === 11 || channel.type === 12;
    var base = __assign({ id: channel.id, type: channel.type, guild_id: (_a = channel.guildId) !== null && _a !== void 0 ? _a : undefined, name: (_b = channel.name) !== null && _b !== void 0 ? _b : undefined, topic: (_c = channel.topic) !== null && _c !== void 0 ? _c : undefined, parent_id: (_d = channel.parentId) !== null && _d !== void 0 ? _d : undefined, position: channel.position, last_message_id: (_e = channel.lastMessageId) !== null && _e !== void 0 ? _e : undefined, rate_limit_per_user: channel.rateLimitPerUser }, (isThread
        ? {
            owner_id: (_f = channel.ownerId) !== null && _f !== void 0 ? _f : undefined,
            message_count: channel.messageCount,
            member_count: channel.memberCount,
            total_message_sent: channel.totalMessageSent,
            thread_metadata: {
                archived: channel.archived,
                auto_archive_duration: channel.autoArchiveDuration,
                archive_timestamp: ((_g = channel.archiveTimestamp) !== null && _g !== void 0 ? _g : channel.createdAt).toISOString().replace('Z', '+00:00'),
                locked: channel.locked,
            },
        }
        : {}));
    return base;
}
function memberToAPI(member) {
    var _a;
    return {
        user: userToAPI(member.user),
        nick: (_a = member.nick) !== null && _a !== void 0 ? _a : undefined,
        roles: JSON.parse(member.roles),
        joined_at: isoTimestamp(member.joinedAt),
        deaf: member.deaf,
        mute: member.mute,
        flags: noFlags(),
    };
}
function guildToAPI(guild) {
    return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        splash: null,
        discovery_splash: null,
        owner_id: guild.ownerId,
        afk_channel_id: null,
        afk_timeout: 300,
        verification_level: 0,
        default_message_notifications: 0,
        explicit_content_filter: 0,
        roles: guild.roles.map(roleToAPI),
        emojis: [],
        features: JSON.parse(guild.features),
        mfa_level: 0,
        application_id: null,
        system_channel_id: null,
        system_channel_flags: noFlags(),
        rules_channel_id: null,
        vanity_url_code: null,
        description: guild.description,
        banner: null,
        premium_tier: 0,
        preferred_locale: v10_1.Locale.EnglishUS,
        public_updates_channel_id: null,
        nsfw_level: 0,
        premium_progress_bar_enabled: false,
        safety_alerts_channel_id: null,
        stickers: [],
        // hub_type, incidents_data, region are missing in Gelbpunkt/twilight 0.16
        // used by the gateway-proxy main branch. Our remorses/twilight 0.16-updated
        // fork ignores unknown struct fields, so these are safe to include.
        region: '',
        hub_type: null,
        incidents_data: null,
    };
}
function messageToAPI(message, author, guildId, member) {
    // Build with all required fields in the literal, then spread optional
    // fields conditionally. The `as APIMessage` at the end is needed because
    // the optional fields (guild_id, member, webhook_id, etc.) aren't part
    // of the literal's inferred type when their conditions are false.
    var base = __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({ id: message.id, channel_id: message.channelId, author: userToAPI(author), content: message.content, timestamp: isoTimestamp(message.timestamp), edited_timestamp: message.editedTimestamp ? isoTimestamp(message.editedTimestamp) : null, tts: message.tts, mention_everyone: message.mentionEveryone, mentions: [], mention_roles: JSON.parse(message.mentionRoles), attachments: JSON.parse(message.attachments), embeds: JSON.parse(message.embeds), pinned: message.pinned, type: message.type }, (message.flags ? { flags: message.flags } : {})), (message.components && message.components !== '[]'
        ? { components: JSON.parse(message.components) }
        : {})), (guildId ? { guild_id: guildId } : {})), (member
        ? (function () {
            var _a = memberToAPI(member), _u = _a.user, partialMember = __rest(_a, ["user"]);
            return { member: partialMember };
        })()
        : {})), (message.nonce ? { nonce: message.nonce } : {})), (message.webhookId ? { webhook_id: message.webhookId } : {})), (message.applicationId ? { application_id: message.applicationId } : {})), (message.messageReference
        ? { message_reference: JSON.parse(message.messageReference) }
        : {}));
    return base;
}
function threadMemberToAPI(tm) {
    return {
        id: tm.channelId,
        user_id: tm.userId,
        join_timestamp: isoTimestamp(tm.joinedAt),
        flags: noFlags(),
    };
}
