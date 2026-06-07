"use strict";
// Stateless ID converter between Discord and Slack ID formats.
//
// ## Why snowflake-compatible?
//
// discord.js parses message IDs (and sometimes channel IDs) as BigInt
// snowflakes internally — for createdTimestamp, sorting, and caching.
// Non-numeric IDs like "MSG_C04_17000..." cause `Cannot convert to BigInt`
// errors. All IDs we generate MUST be valid BigInt strings.
//
// ## Encoding scheme
//
//   Guild ID:   Slack workspace ID as-is (T04ABC123) — discord.js doesn't
//               parse these as snowflakes in tested code paths
//   Channel ID: Slack channel ID as-is (C04ABC123) — same
//   User ID:    Slack user ID as-is (U04ABC123) — same
//   Message ID: numeric Slack ts (dot stripped) — e.g. "1700000000000001"
//               Always exactly 16 digits for modern timestamps.
//   Thread ID:  reversible encoding of channel + ts:
//               {ts_no_dot_16}{channel_len_2}{channel_base36_pairs}
//               This ensures globally unique thread IDs (no cross-channel
//               collisions) and allows deterministic decoding without a
//               runtime map.
//
// ## Thread ID format detail
//
//   ts_no_dot (16 digits): Slack ts with dot stripped
//   channel_len (2 digits): zero-padded count of chars in Slack channel ID
//   channel_base36_pairs: each char of the Slack channel ID encoded as a
//     2-digit decimal base-36 value (0-9 → 00-09, A-Z → 10-35)
//
//   Example: "C04ABC123" + "1700000000.000001"
//   → "1700000000000001" + "09" + "120004101112010203"
//   → "170000000000000109120004101112010203"
//
//   Thread IDs are always 20+ digits (16 ts + 2 len + 2+ channel).
//   Message IDs are always 16 digits. Slack channel IDs start with a letter.
//   This makes discrimination unambiguous.
//
// ts_no_dots: Slack timestamps have exactly 6 decimal digits
// (e.g. "1503435956.000247"). We strip the dot for encoding and
// re-insert it before the last 6 chars for decoding.
Object.defineProperty(exports, "__esModule", { value: true });
exports.channelToNumeric = channelToNumeric;
exports.numericToChannel = numericToChannel;
exports.encodeThreadId = encodeThreadId;
exports.decodeThreadId = decodeThreadId;
exports.encodeMessageId = encodeMessageId;
exports.decodeMessageId = decodeMessageId;
exports.isThreadChannelId = isThreadChannelId;
exports.isEncodedMessageId = isEncodedMessageId;
exports.resolveSlackTarget = resolveSlackTarget;
exports.slackTsToIso = slackTsToIso;
exports.encodeSlackTs = encodeSlackTs;
exports.decodeSlackTs = decodeSlackTs;
exports.resolveDiscordChannelId = resolveDiscordChannelId;
/** Encode a Slack channel ID into a numeric base-36 pair string.
 *  Each character is represented as a 2-digit decimal (00-35). */
function channelToNumeric(channel) {
    return channel
        .split('')
        .map(function (c) {
        var val = parseInt(c, 36);
        if (Number.isNaN(val)) {
            throw new Error("Invalid character '".concat(c, "' in Slack channel ID: ").concat(channel));
        }
        return val.toString().padStart(2, '0');
    })
        .join('');
}
/** Decode a numeric base-36 pair string back to a Slack channel ID. */
function numericToChannel(encoded) {
    if (encoded.length % 2 !== 0) {
        throw new Error("Invalid channel encoding (odd length): ".concat(encoded));
    }
    var chars = [];
    for (var i = 0; i < encoded.length; i += 2) {
        var val = parseInt(encoded.slice(i, i + 2), 10);
        if (Number.isNaN(val) || val > 35) {
            throw new Error("Invalid base-36 value at position ".concat(i, ": ").concat(encoded.slice(i, i + 2)));
        }
        chars.push(val.toString(36).toUpperCase());
    }
    return chars.join('');
}
/** Encode a Slack thread_ts + channel into a Discord thread channel ID.
 *  Format: {ts_no_dot_16}{channel_len_2}{channel_base36_pairs}
 *  Fully reversible — decodeThreadId recovers both channel and threadTs. */
function encodeThreadId(channel, threadTs) {
    var tsEncoded = encodeSlackTs(threadTs);
    var channelEncoded = channelToNumeric(channel);
    var channelLen = channel.length.toString().padStart(2, '0');
    return "".concat(tsEncoded).concat(channelLen).concat(channelEncoded);
}
/** Decode a Discord thread channel ID to its Slack channel + thread_ts.
 *  No runtime map needed — channel is encoded in the ID. */
function decodeThreadId(threadChannelId) {
    // New format: {ts_16}{channelLen_2}{channelEncoded}
    if (/^\d{20,}$/.test(threadChannelId)) {
        var tsRaw = threadChannelId.slice(0, 16);
        var channelLen = parseInt(threadChannelId.slice(16, 18), 10);
        var channelEncoded = threadChannelId.slice(18);
        if (channelEncoded.length !== channelLen * 2) {
            throw new Error("Invalid thread channel ID: channel length mismatch in ".concat(threadChannelId));
        }
        return {
            channel: numericToChannel(channelEncoded),
            threadTs: decodeSlackTs(tsRaw),
        };
    }
    // Legacy THR_ format support
    var match = threadChannelId.match(/^THR_([^_]+)_(\d+)$/);
    if (match) {
        return { channel: match[1], threadTs: decodeSlackTs(match[2]) };
    }
    throw new Error("Invalid thread channel ID: ".concat(threadChannelId));
}
/** Encode a Slack ts into a Discord message ID.
 *  Returns the numeric ts (dot stripped) — valid as a BigInt snowflake. */
function encodeMessageId(_channel, ts) {
    return encodeSlackTs(ts);
}
/** Decode a Discord message ID back to Slack ts. */
function decodeMessageId(messageId) {
    // Support legacy MSG_ prefixed IDs
    var legacyMatch = messageId.match(/^MSG_([^_]+)_(\d+)$/);
    if (legacyMatch) {
        return { ts: decodeSlackTs(legacyMatch[2]) };
    }
    if (/^\d+$/.test(messageId)) {
        return { ts: decodeSlackTs(messageId) };
    }
    throw new Error("Invalid message ID: ".concat(messageId));
}
/** Check if a Discord channel ID represents a Slack thread.
 *  Thread IDs are pure numeric with 20+ digits (ts + channel encoding).
 *  Message IDs are 16 digits. Slack channel IDs start with a letter. */
function isThreadChannelId(id) {
    return /^\d{20,}$/.test(id);
}
/** Check if a Discord message ID is an encoded Slack message ts. */
function isEncodedMessageId(id) {
    // Message IDs are 16 digits. Exclude thread IDs (20+ digits).
    return (/^\d{7,}$/.test(id) && !isThreadChannelId(id)) || id.startsWith('MSG_');
}
/** Resolve where to send a message given a Discord channel ID.
 *  For thread channels (20+ digit numeric), decodes the embedded channel
 *  and threadTs. For regular channels, returns the ID as-is. */
function resolveSlackTarget(discordChannelId) {
    // Legacy THR_ format
    if (discordChannelId.startsWith('THR_')) {
        var match = discordChannelId.match(/^THR_([^_]+)_(\d+)$/);
        if (match) {
            return { channel: match[1], threadTs: decodeSlackTs(match[2]) };
        }
    }
    // Thread channel ID (20+ digits, encodes channel + ts)
    if (isThreadChannelId(discordChannelId)) {
        var _a = decodeThreadId(discordChannelId), channel = _a.channel, threadTs = _a.threadTs;
        return { channel: channel, threadTs: threadTs };
    }
    // Regular Slack channel ID (C..., G..., D...)
    if (/^[A-Za-z]/.test(discordChannelId)) {
        return { channel: discordChannelId };
    }
    // Unknown format — fail loudly instead of passing invalid channel
    throw new Error("Cannot resolve Slack target for channel ID: ".concat(discordChannelId));
}
/**
 * Convert a Slack timestamp to an ISO 8601 string.
 * Slack ts format: "1503435956.000247" where integer part is Unix epoch seconds.
 */
function slackTsToIso(ts) {
    var seconds = Number.parseFloat(ts);
    return new Date(seconds * 1000).toISOString();
}
function encodeSlackTs(ts) {
    if (!/^\d+\.\d{6}$/.test(ts)) {
        throw new Error("Invalid Slack timestamp: ".concat(ts));
    }
    return ts.replace(/\./g, '');
}
function decodeSlackTs(raw) {
    if (!/^\d+$/.test(raw)) {
        throw new Error("Invalid encoded Slack timestamp: ".concat(raw));
    }
    if (raw.length <= 6) {
        throw new Error("Invalid encoded Slack timestamp: ".concat(raw));
    }
    var ts = "".concat(raw.slice(0, -6), ".").concat(raw.slice(-6));
    if (!/^\d+\.\d{6}$/.test(ts)) {
        throw new Error("Invalid encoded Slack timestamp: ".concat(raw));
    }
    return ts;
}
/**
 * Determine the Discord channel_id for an incoming Slack message.
 * If the message is in a thread, returns the encoded thread channel ID
 * (with channel embedded). Otherwise returns the Slack channel ID as-is.
 */
function resolveDiscordChannelId(slackChannel, threadTs, messageTs) {
    // If message has a thread_ts different from its own ts, it's a thread reply
    if (threadTs && threadTs !== messageTs) {
        return encodeThreadId(slackChannel, threadTs);
    }
    // If thread_ts equals ts, this is the thread parent -- belongs to the channel
    return slackChannel;
}
