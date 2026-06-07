"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var id_converter_js_1 = require("../src/id-converter.js");
(0, vitest_1.describe)('encodeThreadId / decodeThreadId', function () {
    (0, vitest_1.test)('roundtrips correctly', function () {
        var channel = 'C04ABC123';
        var threadTs = '1503435956.000247';
        var encoded = (0, id_converter_js_1.encodeThreadId)(channel, threadTs);
        (0, vitest_1.expect)(encoded).toMatchInlineSnapshot("\"150343595600024709120004101112010203\"");
        var decoded = (0, id_converter_js_1.decodeThreadId)(encoded);
        (0, vitest_1.expect)(decoded).toMatchInlineSnapshot("\n      {\n        \"channel\": \"C04ABC123\",\n        \"threadTs\": \"1503435956.000247\",\n      }\n    ");
    });
    (0, vitest_1.test)('handles different channels', function () {
        (0, vitest_1.expect)((0, id_converter_js_1.encodeThreadId)('G0PRIVATE', '1700000000.123456')).toMatchInlineSnapshot("\"170000000012345609160025271831102914\"");
    });
    (0, vitest_1.test)('same thread ts in different channels produces different IDs', function () {
        var threadTs = '1700000000.123456';
        var idA = (0, id_converter_js_1.encodeThreadId)('C123', threadTs);
        var idB = (0, id_converter_js_1.encodeThreadId)('C999', threadTs);
        (0, vitest_1.expect)(idA).not.toBe(idB);
        (0, vitest_1.expect)((0, id_converter_js_1.decodeThreadId)(idA)).toEqual({ channel: 'C123', threadTs: threadTs });
        (0, vitest_1.expect)((0, id_converter_js_1.decodeThreadId)(idB)).toEqual({ channel: 'C999', threadTs: threadTs });
    });
    (0, vitest_1.test)('throws on invalid thread ID', function () {
        (0, vitest_1.expect)(function () { return (0, id_converter_js_1.decodeThreadId)('C04ABC123'); }).toThrow('Invalid thread channel ID');
        (0, vitest_1.expect)(function () { return (0, id_converter_js_1.decodeThreadId)('MSG_C04_123'); }).toThrow('Invalid thread channel ID');
        (0, vitest_1.expect)(function () { return (0, id_converter_js_1.decodeThreadId)(''); }).toThrow('Invalid thread channel ID');
        (0, vitest_1.expect)(function () { return (0, id_converter_js_1.decodeThreadId)('THR_C04ABC123_123456'); }).toThrow('Invalid encoded Slack timestamp');
    });
    (0, vitest_1.test)('throws when encoding malformed Slack timestamp', function () {
        (0, vitest_1.expect)(function () { return (0, id_converter_js_1.encodeThreadId)('C04ABC123', '1503435956'); }).toThrow('Invalid Slack timestamp');
    });
});
(0, vitest_1.describe)('encodeMessageId / decodeMessageId', function () {
    (0, vitest_1.test)('roundtrips correctly', function () {
        var channel = 'C04ABC123';
        var ts = '1503435956.000247';
        var encoded = (0, id_converter_js_1.encodeMessageId)(channel, ts);
        (0, vitest_1.expect)(encoded).toMatchInlineSnapshot("\"1503435956000247\"");
        var decoded = (0, id_converter_js_1.decodeMessageId)(encoded);
        (0, vitest_1.expect)(decoded).toMatchInlineSnapshot("\n      {\n        \"ts\": \"1503435956.000247\",\n      }\n    ");
    });
    (0, vitest_1.test)('throws on invalid message ID', function () {
        (0, vitest_1.expect)(function () { return (0, id_converter_js_1.decodeMessageId)('THR_C04_123'); }).toThrow('Invalid message ID');
        (0, vitest_1.expect)(function () { return (0, id_converter_js_1.decodeMessageId)('random'); }).toThrow('Invalid message ID');
        (0, vitest_1.expect)(function () { return (0, id_converter_js_1.decodeMessageId)('MSG_C04ABC123_123456'); }).toThrow('Invalid encoded Slack timestamp');
    });
    (0, vitest_1.test)('throws when encoding malformed message timestamp', function () {
        (0, vitest_1.expect)(function () { return (0, id_converter_js_1.encodeMessageId)('C04ABC123', '1503435956'); }).toThrow('Invalid Slack timestamp');
    });
});
(0, vitest_1.describe)('isThreadChannelId', function () {
    (0, vitest_1.test)('identifies thread IDs', function () {
        // Thread IDs are 20+ digits (ts + channel encoding)
        var threadId = (0, id_converter_js_1.encodeThreadId)('C04ABC123', '1503435956.000247');
        (0, vitest_1.expect)((0, id_converter_js_1.isThreadChannelId)(threadId)).toBe(true);
        // 16-digit message IDs are NOT thread IDs
        (0, vitest_1.expect)((0, id_converter_js_1.isThreadChannelId)('1503435956000247')).toBe(false);
        (0, vitest_1.expect)((0, id_converter_js_1.isThreadChannelId)('C04ABC123')).toBe(false);
        // Legacy formats are not thread IDs
        (0, vitest_1.expect)((0, id_converter_js_1.isThreadChannelId)('THR_C04ABC123_1503435956000247')).toBe(false);
        (0, vitest_1.expect)((0, id_converter_js_1.isThreadChannelId)('MSG_C04ABC123_1503435956000247')).toBe(false);
    });
});
(0, vitest_1.describe)('isEncodedMessageId', function () {
    (0, vitest_1.test)('identifies encoded message IDs', function () {
        (0, vitest_1.expect)((0, id_converter_js_1.isEncodedMessageId)('MSG_C04ABC123_1503435956000247')).toBe(true);
        (0, vitest_1.expect)((0, id_converter_js_1.isEncodedMessageId)('THR_C04ABC123_1503435956000247')).toBe(false);
        (0, vitest_1.expect)((0, id_converter_js_1.isEncodedMessageId)('C04ABC123')).toBe(false);
    });
});
(0, vitest_1.describe)('resolveSlackTarget', function () {
    (0, vitest_1.test)('resolves encoded thread ID (channel embedded)', function () {
        var threadId = (0, id_converter_js_1.encodeThreadId)('C04ABC123', '1503435956.000247');
        var result = (0, id_converter_js_1.resolveSlackTarget)(threadId);
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"channel\": \"C04ABC123\",\n        \"threadTs\": \"1503435956.000247\",\n      }\n    ");
    });
    (0, vitest_1.test)('resolves legacy THR_ format without threadMap', function () {
        var result = (0, id_converter_js_1.resolveSlackTarget)('THR_C04ABC123_1503435956000247');
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"channel\": \"C04ABC123\",\n        \"threadTs\": \"1503435956.000247\",\n      }\n    ");
    });
    (0, vitest_1.test)('passes through regular channel ID', function () {
        var result = (0, id_converter_js_1.resolveSlackTarget)('C04ABC123');
        (0, vitest_1.expect)(result.channel).toBe('C04ABC123');
        (0, vitest_1.expect)(result.threadTs).toBeUndefined();
    });
});
(0, vitest_1.describe)('slackTsToIso', function () {
    (0, vitest_1.test)('converts Slack timestamp to ISO', function () {
        var iso = (0, id_converter_js_1.slackTsToIso)('1503435956.000247');
        // Verify it's a valid ISO date string (exact value depends on timezone)
        (0, vitest_1.expect)(new Date(iso).getTime()).toBe(1503435956000);
    });
});
(0, vitest_1.describe)('resolveDiscordChannelId', function () {
    (0, vitest_1.test)('returns thread ID for thread replies', function () {
        var result = (0, id_converter_js_1.resolveDiscordChannelId)('C04ABC123', '1503435900.000100', '1503435956.000247');
        // Thread ID encodes both the channel and thread_ts
        var expectedThreadId = (0, id_converter_js_1.encodeThreadId)('C04ABC123', '1503435900.000100');
        (0, vitest_1.expect)(result).toBe(expectedThreadId);
    });
    (0, vitest_1.test)('returns channel ID for parent messages', function () {
        // thread_ts == ts means this is the parent message
        var result = (0, id_converter_js_1.resolveDiscordChannelId)('C04ABC123', '1503435956.000247', '1503435956.000247');
        (0, vitest_1.expect)(result).toBe('C04ABC123');
    });
    (0, vitest_1.test)('returns channel ID for non-thread messages', function () {
        var result = (0, id_converter_js_1.resolveDiscordChannelId)('C04ABC123', undefined, '1503435956.000247');
        (0, vitest_1.expect)(result).toBe('C04ABC123');
    });
});
