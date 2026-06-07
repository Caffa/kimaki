"use strict";
// Detect a /commandname token on its own line in a user prompt and resolve it
// to a registered opencode command. Mirrors the Discord slash command flow
// (commands/user-command.ts) so users can type `/build foo` or `/build-cmd foo`
// in chat, via `/new-session`, through `kimaki send --prompt`, or scheduled
// tasks and have it routed to opencode's session.command API instead of going
// to the model as plain text.
//
// Detection is line-based: we scan each line and return the first one whose
// first non-whitespace token is `/<registered-command>`. This keeps the
// detector oblivious to prefix lines (`» **kimaki-cli:**`, `Context from
// thread:`, etc). Producers that add such prefixes must put them on their
// own line so the user's content starts on a fresh line.
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractLeadingOpencodeCommand = extractLeadingOpencodeCommand;
var store_js_1 = require("./store.js");
var DISCORD_SUFFIXES = ['-mcp-prompt', '-skill', '-cmd'];
function stripDiscordSuffix(token) {
    for (var _i = 0, DISCORD_SUFFIXES_1 = DISCORD_SUFFIXES; _i < DISCORD_SUFFIXES_1.length; _i++) {
        var suffix = DISCORD_SUFFIXES_1[_i];
        if (token.endsWith(suffix)) {
            return token.slice(0, -suffix.length);
        }
    }
    return token;
}
// Resolve a /token against registeredUserCommands. When the list is empty
// (gateway startup race), falls back to suffix-stripping so tokens like
// /build-cmd still route to session.command('build'). Tokens without a
// recognizable suffix return undefined to avoid false positives.
function resolveCommandName(_a) {
    var token = _a.token, registered = _a.registered;
    var exact = registered.find(function (c) {
        return c.name === token || c.discordCommandName === token;
    });
    if (exact)
        return exact.name;
    var base = stripDiscordSuffix(token);
    if (base === token)
        return undefined;
    var stripped = registered.find(function (c) {
        return c.name === base || c.discordCommandName === base;
    });
    if (stripped)
        return stripped.name;
    // Empty registry fallback: suffix was stripped, trust it
    if (registered.length === 0)
        return base;
    return undefined;
}
function extractLeadingOpencodeCommand(prompt, registered) {
    if (registered === void 0) { registered = store_js_1.store.getState().registeredUserCommands; }
    if (!prompt)
        return null;
    for (var _i = 0, _a = prompt.split('\n'); _i < _a.length; _i++) {
        var line = _a[_i];
        var trimmed = line.trimStart();
        if (!trimmed.startsWith('/'))
            continue;
        var match = trimmed.match(/^\/([^\s]+)(?:\s+(.*))?$/);
        if (!match)
            continue;
        var token = match[1], rest = match[2];
        if (!token)
            continue;
        var name_1 = resolveCommandName({ token: token, registered: registered });
        if (!name_1)
            continue;
        return { command: { name: name_1, arguments: (rest !== null && rest !== void 0 ? rest : '').trim() } };
    }
    return null;
}
