"use strict";
// Tests event translation from Slack payloads into Discord gateway payloads.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var event_translator_js_1 = require("../src/event-translator.js");
var v10_1 = require("discord-api-types/v10");
var id_converter_js_1 = require("../src/id-converter.js");
(0, vitest_1.describe)('translateReaction', function () {
    (0, vitest_1.test)('uses parent channel for top-level message reactions', function () {
        var translated = (0, event_translator_js_1.translateReaction)({
            event: {
                type: 'reaction_added',
                user: 'U123',
                reaction: 'thumbsup',
                item: {
                    type: 'message',
                    channel: 'C123',
                    ts: '1700000000.123456',
                },
            },
            guildId: 'T123',
            threadTs: '1700000000.123456',
        });
        (0, vitest_1.expect)(translated.data.channel_id).toBe('C123');
    });
    (0, vitest_1.test)('uses encoded thread channel for threaded reactions', function () {
        var translated = (0, event_translator_js_1.translateReaction)({
            event: {
                type: 'reaction_removed',
                user: 'U123',
                reaction: 'eyes',
                item: {
                    type: 'message',
                    channel: 'C123',
                    ts: '1700000001.123456',
                },
            },
            guildId: 'T123',
            threadTs: '1700000000.123456',
        });
        // Thread channel IDs encode both channel and thread_ts (20+ digits)
        (0, vitest_1.expect)(translated.data.channel_id).toBe((0, id_converter_js_1.encodeThreadId)('C123', '1700000000.123456'));
    });
});
(0, vitest_1.describe)('channel event translations', function () {
    (0, vitest_1.test)('translates channel delete', function () {
        var translated = (0, event_translator_js_1.translateChannelDelete)({
            channelId: 'C999',
            guildId: 'T111',
        });
        (0, vitest_1.expect)(translated).toEqual({
            eventName: v10_1.GatewayDispatchEvents.ChannelDelete,
            data: {
                id: 'C999',
                guild_id: 'T111',
            },
        });
        (0, vitest_1.expect)(translated.eventName).toBe(v10_1.GatewayDispatchEvents.ChannelDelete);
    });
    (0, vitest_1.test)('translates channel rename', function () {
        var translated = (0, event_translator_js_1.translateChannelRename)({
            channelId: 'C999',
            channelName: 'renamed-channel',
            guildId: 'T111',
        });
        (0, vitest_1.expect)(translated).toEqual({
            eventName: v10_1.GatewayDispatchEvents.ChannelUpdate,
            data: {
                id: 'C999',
                type: 0,
                name: 'renamed-channel',
                guild_id: 'T111',
                position: 0,
            },
        });
    });
    (0, vitest_1.test)('translates member joined channel into guild member add', function () {
        var _a, _b;
        var translated = (0, event_translator_js_1.translateMemberJoinedChannel)({
            event: {
                type: 'member_joined_channel',
                channelId: 'C123',
                userId: 'U123',
            },
            user: {
                id: 'U123',
                name: 'tommy',
                realName: 'Tommy',
                isBot: false,
                avatar: 'https://example.com/u123.png',
            },
        });
        (0, vitest_1.expect)(translated.eventName).toBe(v10_1.GatewayDispatchEvents.GuildMemberAdd);
        (0, vitest_1.expect)((_a = translated.data.user) === null || _a === void 0 ? void 0 : _a.id).toBe('U123');
        (0, vitest_1.expect)((_b = translated.data.user) === null || _b === void 0 ? void 0 : _b.global_name).toBe('Tommy');
    });
});
