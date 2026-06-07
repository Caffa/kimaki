"use strict";
// General utility functions for the bot.
// Includes Discord OAuth URL generation, array deduplication,
// abort error detection, and date/time formatting helpers.
Object.defineProperty(exports, "__esModule", { value: true });
exports.KIMAKI_WEBSITE_URL = exports.KIMAKI_GATEWAY_APP_ID = void 0;
exports.generateBotInstallUrl = generateBotInstallUrl;
exports.generateDiscordInstallUrlForBot = generateDiscordInstallUrlForBot;
exports.deduplicateByKey = deduplicateByKey;
exports.isAbortError = isAbortError;
exports.formatDistanceToNow = formatDistanceToNow;
exports.formatDateTime = formatDateTime;
exports.stripAnsi = stripAnsi;
exports.abbreviatePath = abbreviatePath;
var node_os_1 = require("node:os");
// Use namespace import for CJS interop — discord.js is CJS and its named
// exports aren't detectable by all ESM loaders (e.g. tsx/esbuild) because
// discord.js uses tslib's __exportStar which is opaque to static analysis.
var discord = require("discord.js");
var PermissionsBitField = discord.PermissionsBitField;
var errore = require("errore");
function generateBotInstallUrl(_a) {
    var clientId = _a.clientId, _b = _a.permissions, permissions = _b === void 0 ? [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.ManageChannels,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.SendMessagesInThreads,
        PermissionsBitField.Flags.CreatePublicThreads,
        PermissionsBitField.Flags.ManageThreads,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.ManageMessages,
        PermissionsBitField.Flags.UseExternalEmojis,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.Connect,
        PermissionsBitField.Flags.Speak,
        PermissionsBitField.Flags.ManageRoles,
        PermissionsBitField.Flags.ManageEvents,
        PermissionsBitField.Flags.CreateEvents,
    ] : _b, _c = _a.scopes, scopes = _c === void 0 ? ['bot', 'applications.commands', 'identify', 'email'] : _c, guildId = _a.guildId, _d = _a.disableGuildSelect, disableGuildSelect = _d === void 0 ? false : _d, state = _a.state, redirectUri = _a.redirectUri, responseType = _a.responseType;
    var permissionsBitField = new PermissionsBitField(permissions);
    var permissionsValue = permissionsBitField.bitfield.toString();
    var url = new URL('https://discord.com/api/oauth2/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('permissions', permissionsValue);
    url.searchParams.set('scope', scopes.join(' '));
    if (guildId) {
        url.searchParams.set('guild_id', guildId);
    }
    if (disableGuildSelect) {
        url.searchParams.set('disable_guild_select', 'true');
    }
    if (state) {
        url.searchParams.set('state', state);
    }
    if (redirectUri) {
        url.searchParams.set('redirect_uri', redirectUri);
    }
    if (responseType) {
        url.searchParams.set('response_type', responseType);
    }
    return url.toString();
}
exports.KIMAKI_GATEWAY_APP_ID = process.env.KIMAKI_GATEWAY_APP_ID || '1477605701202481173';
exports.KIMAKI_WEBSITE_URL = process.env.KIMAKI_WEBSITE_URL || 'https://kimaki.dev';
function generateDiscordInstallUrlForBot(_a) {
    var appId = _a.appId, mode = _a.mode, clientId = _a.clientId, clientSecret = _a.clientSecret, gatewayCallbackUrl = _a.gatewayCallbackUrl, reachableUrl = _a.reachableUrl;
    if (mode !== 'gateway') {
        return generateBotInstallUrl({ clientId: appId });
    }
    if (!clientId || !clientSecret) {
        return new Error('Gateway credentials are missing from local database');
    }
    // In gateway mode, redirect to the website's /discord-install route.
    // This initiates the better-auth OAuth flow with clientId/clientSecret
    // as additionalData, which better-auth stores in its verification table
    // and recovers after Discord redirects back to the callback.
    // Use a kimaki-specific callback field name to avoid ambiguity with
    // better-auth's own callbackURL state field.
    var url = new URL("".concat(exports.KIMAKI_WEBSITE_URL, "/discord-install"));
    url.searchParams.set('clientId', clientId);
    url.searchParams.set('clientSecret', clientSecret);
    if (gatewayCallbackUrl) {
        url.searchParams.set('kimakiCallbackUrl', gatewayCallbackUrl);
    }
    if (reachableUrl) {
        url.searchParams.set('reachableUrl', reachableUrl);
    }
    return url.toString();
}
function deduplicateByKey(arr, keyFn) {
    var seen = new Set();
    return arr.filter(function (item) {
        var key = keyFn(item);
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}
// Delegates to errore.isAbortError (walks cause chain for AbortError instances),
// then falls back to opencode server-specific abort patterns that aren't
// errore.AbortError but still represent aborted operations.
function isAbortError(error) {
    var _a;
    if (errore.isAbortError(error))
        return true;
    if (!(error instanceof Error))
        return false;
    return (error.name === 'MessageAbortedError' ||
        ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes('aborted')) === true);
}
var rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
var TIME_DIVISIONS = [
    { amount: 60, name: 'seconds' },
    { amount: 60, name: 'minutes' },
    { amount: 24, name: 'hours' },
    { amount: 7, name: 'days' },
    { amount: 4.34524, name: 'weeks' },
    { amount: 12, name: 'months' },
    { amount: Number.POSITIVE_INFINITY, name: 'years' },
];
function formatDistanceToNow(date) {
    var duration = (date.getTime() - Date.now()) / 1000;
    for (var _i = 0, TIME_DIVISIONS_1 = TIME_DIVISIONS; _i < TIME_DIVISIONS_1.length; _i++) {
        var division = TIME_DIVISIONS_1[_i];
        if (Math.abs(duration) < division.amount) {
            return rtf.format(Math.round(duration), division.name);
        }
        duration /= division.amount;
    }
    return rtf.format(Math.round(duration), 'years');
}
var dtf = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});
function formatDateTime(date) {
    return dtf.format(date);
}
// Comprehensive ANSI escape sequence regex covering CSI, OSC, and related sequences.
// Valid string terminator sequences are BEL, ESC\, and 0x9c.
var ANSI_REGEX = (function () {
    var ST = '(?:\\u0007|\\u001B\\u005C|\\u009C)';
    var osc = "(?:\\u001B\\][\\s\\S]*?".concat(ST, ")");
    var csi = '[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]';
    return new RegExp("".concat(osc, "|").concat(csi), 'g');
})();
function stripAnsi(str) {
    return str.replace(ANSI_REGEX, '');
}
function abbreviatePath(fullPath) {
    var home = node_os_1.default.homedir();
    if (fullPath.startsWith(home)) {
        return '~' + fullPath.slice(home.length);
    }
    return fullPath;
}
