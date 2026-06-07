"use strict";
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
exports.EXIT_NO_RESTART = exports.KIMAKI_GATEWAY_PROXY_REST_BASE_URL = exports.KIMAKI_GATEWAY_PROXY_URL = exports.cliLogger = void 0;
exports.stripBracketedPaste = stripBracketedPaste;
exports.appIdFromToken = appIdFromToken;
exports.resolveBotCredentials = resolveBotCredentials;
exports.isThreadChannelType = isThreadChannelType;
exports.sendDiscordMessageWithOptionalAttachment = sendDiscordMessageWithOptionalAttachment;
exports.formatRelativeTime = formatRelativeTime;
exports.formatTaskScheduleLine = formatTaskScheduleLine;
exports.isGuildMemberSearchResult = isGuildMemberSearchResult;
exports.getDiscordUserIdFromUserOption = getDiscordUserIdFromUserOption;
exports.isDiscordMemberLookupUnavailable = isDiscordMemberLookupUnavailable;
exports.formatMemberLookupUnavailableMessage = formatMemberLookupUnavailableMessage;
exports.resolveDiscordUserOption = resolveDiscordUserOption;
exports.canUseInteractivePrompts = canUseInteractivePrompts;
exports.exitNonInteractiveSetup = exitNonInteractiveSetup;
exports.emitJsonEvent = emitJsonEvent;
exports.resolveGatewayInstallCredentials = resolveGatewayInstallCredentials;
exports.printDiscordInstallUrlAndExit = printDiscordInstallUrlAndExit;
exports.ensureCommandAvailable = ensureCommandAvailable;
exports.startCaffeinate = startCaffeinate;
exports.collectKimakiChannels = collectKimakiChannels;
exports.storeChannelDirectories = storeChannelDirectories;
exports.showReadyMessage = showReadyMessage;
exports.ensureDefaultChannelsWithWelcome = ensureDefaultChannelsWithWelcome;
exports.backgroundInit = backgroundInit;
exports.resolveCredentials = resolveCredentials;
exports.run = run;
// Runtime startup and shared helpers for the Kimaki goke CLI.
// Keeps cli.ts focused on command composition while preserving the bot onboarding flow.
var prompts_1 = require("@clack/prompts");
var utils_js_1 = require("./utils.js");
var discord_bot_js_1 = require("./discord-bot.js");
var database_js_1 = require("./database.js");
var orm = require("drizzle-orm");
var dbSchema = require("./schema.js");
var opencode_command_js_1 = require("./opencode-command.js");
var discord_js_1 = require("discord.js");
var discord_urls_js_1 = require("./discord-urls.js");
var node_crypto_1 = require("node:crypto");
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var node_child_process_1 = require("node:child_process");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
var config_js_1 = require("./config.js");
var worktrees_js_1 = require("./worktrees.js");
var upgrade_js_1 = require("./upgrade.js");
var onboarding_welcome_js_1 = require("./onboarding-welcome.js");
var hrana_server_js_1 = require("./hrana-server.js");
var ipc_polling_js_1 = require("./ipc-polling.js");
var store_js_1 = require("./store.js");
var discord_command_registration_js_1 = require("./discord-command-registration.js");
var figlet_1 = require("figlet");
exports.cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
// Gateway bot mode constants.
// KIMAKI_GATEWAY_APP_ID is the Discord Application ID of the gateway bot.
// KIMAKI_WEBSITE_URL is the website that handles OAuth callback + onboarding status.
// KIMAKI_GATEWAY_PROXY_URL is the gateway-proxy base URL.
// We derive REST base from this URL by swapping ws/wss to http/https.
// These are hardcoded because they're deploy-time constants for the gateway infrastructure.
exports.KIMAKI_GATEWAY_PROXY_URL = process.env.KIMAKI_GATEWAY_PROXY_URL ||
    'wss://discord-gateway.kimaki.dev';
exports.KIMAKI_GATEWAY_PROXY_REST_BASE_URL = (0, discord_urls_js_1.getGatewayProxyRestBaseUrl)({
    gatewayUrl: exports.KIMAKI_GATEWAY_PROXY_URL,
});
// Strip bracketed paste escape sequences from terminal input.
// iTerm2 and other terminals wrap pasted content with \x1b[200~ and \x1b[201~
// which can cause validation to fail on macOS. See: https://github.com/remorses/kimaki/issues/18
function stripBracketedPaste(value) {
    if (!value) {
        return '';
    }
    return value
        .replace(/\x1b\[200~/g, '')
        .replace(/\x1b\[201~/g, '')
        .trim();
}
// Derive the Discord Application ID from a bot token.
// Discord bot tokens have the format: base64(userId).timestamp.hmac
// The first segment is the bot's user ID (= Application ID) base64-encoded.
// For gateway mode tokens (client_id:secret format), this function returns
// undefined -- the caller should use KIMAKI_GATEWAY_APP_ID instead.
function appIdFromToken(token) {
    // Gateway mode tokens use "client_id:secret" format, not base64.
    if (token.includes(':')) {
        return undefined;
    }
    var segment = token.split('.')[0];
    if (!segment) {
        return undefined;
    }
    try {
        var decoded = Buffer.from(segment, 'base64').toString('utf8');
        if (/^\d{17,20}$/.test(decoded)) {
            return decoded;
        }
        return undefined;
    }
    catch (_a) {
        return undefined;
    }
}
// Resolve bot token and app ID from env var or database.
// Used by CLI subcommands (send, project add) that need credentials
// but don't run the interactive wizard.
// In gateway mode, also sets store.discordBaseUrl so REST calls
// are routed through the gateway-proxy REST endpoint.
function resolveBotCredentials() {
    return __awaiter(this, arguments, void 0, function (_a) {
        var botRow, envToken, appId;
        var _b = _a === void 0 ? {} : _a, appIdOverride = _b.appIdOverride;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.getBotTokenWithMode)().catch(function (e) {
                        exports.cliLogger.error('Database error:', e instanceof Error ? e.message : String(e));
                        return null;
                    })];
                case 1:
                    botRow = _c.sent();
                    if (botRow) {
                        return [2 /*return*/, { token: botRow.token, appId: appIdOverride || botRow.appId }];
                    }
                    envToken = process.env.KIMAKI_BOT_TOKEN;
                    if (envToken) {
                        appId = appIdOverride || appIdFromToken(envToken);
                        return [2 /*return*/, { token: envToken, appId: appId }];
                    }
                    exports.cliLogger.error('No bot token found. Set KIMAKI_BOT_TOKEN env var or run `kimaki` first to set up.');
                    process.exit(exports.EXIT_NO_RESTART);
                    return [2 /*return*/];
            }
        });
    });
}
function isThreadChannelType(type) {
    return [
        discord_js_1.ChannelType.PublicThread,
        discord_js_1.ChannelType.PrivateThread,
        discord_js_1.ChannelType.AnnouncementThread,
    ].includes(type);
}
function sendDiscordMessageWithOptionalAttachment(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var discordMaxLength, preview, summaryContent, tmpDir, tmpFile, wrappedPrompt, formData, buffer, starterMessageResponse, error;
        var channelId = _b.channelId, prompt = _b.prompt, botToken = _b.botToken, embeds = _b.embeds, rest = _b.rest;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    discordMaxLength = 2000;
                    if (!(prompt.length <= discordMaxLength)) return [3 /*break*/, 2];
                    return [4 /*yield*/, rest.post(discord_js_1.Routes.channelMessages(channelId), {
                            body: { content: prompt, embeds: embeds },
                        })];
                case 1: return [2 /*return*/, (_c.sent())];
                case 2:
                    preview = prompt.slice(0, 100).replace(/\n/g, ' ');
                    summaryContent = "Prompt attached as file (".concat(prompt.length, " chars)\n\n> ").concat(preview, "...");
                    tmpDir = node_path_1.default.join(process.cwd(), 'tmp');
                    if (!node_fs_1.default.existsSync(tmpDir)) {
                        node_fs_1.default.mkdirSync(tmpDir, { recursive: true });
                    }
                    tmpFile = node_path_1.default.join(tmpDir, "prompt-".concat(Date.now(), ".md"));
                    wrappedPrompt = prompt
                        .split('\n')
                        .flatMap(function (line) {
                        if (line.length <= 120) {
                            return [line];
                        }
                        var wrapped = [];
                        var remaining = line;
                        var maxCol = 120;
                        // Only soft-break at a space if it's reasonably close to maxCol,
                        // otherwise hard-break to avoid tiny fragments from early spaces
                        var minSoftBreak = 90;
                        while (remaining.length > maxCol) {
                            var lastSpace = remaining.lastIndexOf(' ', maxCol);
                            var useSoftBreak = lastSpace >= minSoftBreak;
                            var breakAt = useSoftBreak ? lastSpace : maxCol;
                            wrapped.push(remaining.slice(0, breakAt));
                            // Only consume the separator space on soft breaks
                            remaining = useSoftBreak
                                ? remaining.slice(breakAt + 1)
                                : remaining.slice(breakAt);
                        }
                        if (remaining.length > 0) {
                            wrapped.push(remaining);
                        }
                        return wrapped;
                    })
                        .join('\n');
                    node_fs_1.default.writeFileSync(tmpFile, wrappedPrompt);
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, , 8, 9]);
                    formData = new FormData();
                    formData.append('payload_json', JSON.stringify({
                        content: summaryContent,
                        attachments: [{ id: 0, filename: 'prompt.md' }],
                        embeds: embeds,
                    }));
                    buffer = node_fs_1.default.readFileSync(tmpFile);
                    formData.append('files[0]', new Blob([buffer], { type: 'text/markdown' }), 'prompt.md');
                    return [4 /*yield*/, fetch((0, discord_urls_js_1.discordApiUrl)("/channels/".concat(channelId, "/messages")), {
                            method: 'POST',
                            headers: {
                                Authorization: "Bot ".concat(botToken),
                            },
                            body: formData,
                        })];
                case 4:
                    starterMessageResponse = _c.sent();
                    if (!!starterMessageResponse.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, starterMessageResponse.text()];
                case 5:
                    error = _c.sent();
                    throw new Error("Discord API error: ".concat(starterMessageResponse.status, " - ").concat(error));
                case 6: return [4 /*yield*/, starterMessageResponse.json()];
                case 7: return [2 /*return*/, (_c.sent())];
                case 8:
                    node_fs_1.default.unlinkSync(tmpFile);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function formatRelativeTime(target) {
    var diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) {
        return 'due now';
    }
    var totalSeconds = Math.floor(diffMs / 1000);
    if (totalSeconds < 60) {
        return "".concat(totalSeconds, "s");
    }
    var totalMinutes = Math.floor(totalSeconds / 60);
    if (totalMinutes < 60) {
        return "".concat(totalMinutes, "m");
    }
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;
    if (hours < 24) {
        return minutes > 0 ? "".concat(hours, "h ").concat(minutes, "m") : "".concat(hours, "h");
    }
    var days = Math.floor(hours / 24);
    var remainingHours = hours % 24;
    return remainingHours > 0 ? "".concat(days, "d ").concat(remainingHours, "h") : "".concat(days, "d");
}
function formatTaskScheduleLine(schedule) {
    if (schedule.scheduleKind === 'at') {
        return "one-time at ".concat(schedule.runAt.toISOString());
    }
    return "cron \"".concat(schedule.cronExpr, "\" (").concat(schedule.timezone, ") next ").concat(schedule.nextRunAt.toISOString());
}
exports.EXIT_NO_RESTART = 64;
function isGuildMemberSearchResult(value) {
    if (!value) {
        return false;
    }
    var user = Reflect.get(value, 'user');
    return (typeof user === 'object' &&
        user !== null &&
        typeof Reflect.get(user, 'id') === 'string' &&
        typeof Reflect.get(user, 'username') === 'string');
}
function getDiscordUserIdFromUserOption(user) {
    var trimmed = user.trim();
    var mentionMatch = trimmed.match(/^<@!?(\d{15,25})>$/);
    if (mentionMatch === null || mentionMatch === void 0 ? void 0 : mentionMatch[1]) {
        return mentionMatch[1];
    }
    if (/^\d{15,25}$/.test(trimmed)) {
        return trimmed;
    }
    return null;
}
function readErrorField(error, key) {
    if (!error) {
        return undefined;
    }
    var directValue = Reflect.get(error, key);
    if (directValue !== undefined) {
        return directValue;
    }
    var rawError = Reflect.get(error, 'rawError');
    if (typeof rawError === 'object' && rawError !== null) {
        var rawValue = Reflect.get(rawError, key);
        if (rawValue !== undefined) {
            return rawValue;
        }
    }
    var cause = Reflect.get(error, 'cause');
    if (typeof cause === 'object' && cause !== null) {
        return readErrorField(cause, key);
    }
    return undefined;
}
function isDiscordMemberLookupUnavailable(error) {
    var status = readErrorField(error, 'status');
    if (status === 403) {
        return true;
    }
    var code = readErrorField(error, 'code');
    if (code === 50001 || code === 50013) {
        return true;
    }
    var message = String(readErrorField(error, 'message') || '').toLowerCase();
    return ((message.includes('missing access') ||
        message.includes('missing permissions') ||
        message.includes('intent')) &&
        message.includes('member'));
}
function formatMemberLookupUnavailableMessage() {
    return [
        'Discord member search is unavailable for this bot.',
        'Most Kimaki features still work. Searching names with `--user` needs Server Members Intent.',
        'Use a Discord user ID or raw mention with the same `--user` flag instead:',
        "  kimaki send --channel <channelId> --prompt '...' --user 535922349652836367",
        "  kimaki send --channel <channelId> --prompt '...' --user '<@535922349652836367>'",
    ].join('\n');
}
function resolveDiscordUserOption(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var directUserId, searchResult, searchResults, exactMatch, member, username;
        var user = _b.user, guildId = _b.guildId, rest = _b.rest;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!user) {
                        return [2 /*return*/, undefined];
                    }
                    directUserId = getDiscordUserIdFromUserOption(user);
                    if (directUserId) {
                        exports.cliLogger.log("Using Discord user ID: ".concat(directUserId));
                        return [2 /*return*/, { id: directUserId, username: directUserId }];
                    }
                    exports.cliLogger.log("Searching for user \"".concat(user, "\" in guild..."));
                    return [4 /*yield*/, rest
                            .get(discord_js_1.Routes.guildMembersSearch(guildId), {
                            query: new URLSearchParams({ query: user, limit: '10' }),
                        })
                            .catch(function (error) { return new Error('Discord member search failed', { cause: error }); })];
                case 1:
                    searchResult = _c.sent();
                    if (searchResult instanceof Error) {
                        if (isDiscordMemberLookupUnavailable(searchResult)) {
                            return [2 /*return*/, new Error(formatMemberLookupUnavailableMessage())];
                        }
                        return [2 /*return*/, searchResult];
                    }
                    searchResults = Array.isArray(searchResult)
                        ? searchResult.filter(isGuildMemberSearchResult)
                        : [];
                    exactMatch = searchResults.find(function (member) {
                        var displayName = member.nick || member.user.global_name || member.user.username;
                        return (displayName.toLowerCase() === user.toLowerCase() ||
                            member.user.username.toLowerCase() === user.toLowerCase());
                    });
                    member = exactMatch || searchResults[0];
                    if (!member) {
                        return [2 /*return*/, new Error("User \"".concat(user, "\" not found in guild"))];
                    }
                    username = member.nick || member.user.global_name || member.user.username;
                    exports.cliLogger.log("Found user: ".concat(username, " (").concat(member.user.id, ")"));
                    return [2 /*return*/, { id: member.user.id, username: username }];
            }
        });
    });
}
function canUseInteractivePrompts() {
    return Boolean(process.stdin.isTTY && process.stdout.isTTY);
}
function exitNonInteractiveSetup() {
    exports.cliLogger.error('Setup requires an interactive terminal (TTY) for prompts. Run `kimaki` in an interactive shell to complete setup.');
    process.exit(exports.EXIT_NO_RESTART);
}
// Emit a structured JSON line on stdout for non-TTY consumers (cloud sandboxes, CI).
// Each line is a self-contained JSON object with a "type" field for easy parsing.
// Lines are prefixed with "data: " and terminated with "\n\n" (SSE format) so consumers
// can use the eventsource-parser npm package to robustly extract JSON events from noisy
// process output (other log lines, warnings, etc. are ignored by the parser).
function emitJsonEvent(event) {
    process.stdout.write("data: ".concat(JSON.stringify(event), "\n\n"));
}
function resolveGatewayInstallCredentials() {
    return __awaiter(this, void 0, void 0, function () {
        var db, gatewayBot, clientId, clientSecret;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!utils_js_1.KIMAKI_GATEWAY_APP_ID) {
                        return [2 /*return*/, new Error('Gateway mode is not available yet. KIMAKI_GATEWAY_APP_ID is not configured.')];
                    }
                    return [4 /*yield*/, (0, database_js_1.getDb)()];
                case 1:
                    db = _a.sent();
                    return [4 /*yield*/, db.query.bot_tokens.findFirst({
                            where: { app_id: utils_js_1.KIMAKI_GATEWAY_APP_ID },
                        })];
                case 2:
                    gatewayBot = _a.sent();
                    if ((gatewayBot === null || gatewayBot === void 0 ? void 0 : gatewayBot.client_id) && gatewayBot.client_secret) {
                        return [2 /*return*/, {
                                clientId: gatewayBot.client_id,
                                clientSecret: gatewayBot.client_secret,
                                createdNow: false,
                            }];
                    }
                    clientId = node_crypto_1.default.randomUUID();
                    clientSecret = node_crypto_1.default.randomBytes(32).toString('hex');
                    return [4 /*yield*/, (0, database_js_1.setBotMode)({
                            appId: utils_js_1.KIMAKI_GATEWAY_APP_ID,
                            mode: 'gateway',
                            clientId: clientId,
                            clientSecret: clientSecret,
                            proxyUrl: exports.KIMAKI_GATEWAY_PROXY_REST_BASE_URL,
                        })];
                case 3:
                    _a.sent();
                    return [2 /*return*/, {
                            clientId: clientId,
                            clientSecret: clientSecret,
                            createdNow: true,
                        }];
            }
        });
    });
}
function printDiscordInstallUrlAndExit() {
    return __awaiter(this, arguments, void 0, function (_a) {
        var gatewayCredentials, installUrl_1, existingBot, installUrl;
        var _b = _a === void 0 ? {} : _a, gateway = _b.gateway, gatewayCallbackUrl = _b.gatewayCallbackUrl;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
                case 1:
                    _c.sent();
                    if (!gateway) return [3 /*break*/, 3];
                    return [4 /*yield*/, resolveGatewayInstallCredentials()];
                case 2:
                    gatewayCredentials = _c.sent();
                    if (gatewayCredentials instanceof Error) {
                        exports.cliLogger.error("Failed to resolve gateway install URL: ".concat(gatewayCredentials.message));
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    installUrl_1 = (0, utils_js_1.generateDiscordInstallUrlForBot)({
                        appId: utils_js_1.KIMAKI_GATEWAY_APP_ID,
                        mode: 'gateway',
                        clientId: gatewayCredentials.clientId,
                        clientSecret: gatewayCredentials.clientSecret,
                        gatewayCallbackUrl: gatewayCallbackUrl,
                    });
                    if (installUrl_1 instanceof Error) {
                        exports.cliLogger.error("Failed to build install URL: ".concat(installUrl_1.message));
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    exports.cliLogger.log(installUrl_1);
                    if (gatewayCredentials.createdNow) {
                        exports.cliLogger.log('Generated and saved new local gateway client credentials.');
                    }
                    exports.cliLogger.log('This gateway install URL contains your client credentials. Do not share it.');
                    process.exit(0);
                    _c.label = 3;
                case 3: return [4 /*yield*/, (0, database_js_1.getBotTokenWithMode)()];
                case 4:
                    existingBot = _c.sent();
                    if (!existingBot) {
                        exports.cliLogger.error('No bot configured yet. Run `kimaki` first to set up.');
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    installUrl = (0, utils_js_1.generateDiscordInstallUrlForBot)({
                        appId: existingBot.appId,
                        mode: existingBot.mode,
                        clientId: existingBot.clientId,
                        clientSecret: existingBot.clientSecret,
                    });
                    if (installUrl instanceof Error) {
                        exports.cliLogger.error("Failed to build install URL: ".concat(installUrl.message));
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    exports.cliLogger.log(installUrl);
                    if (existingBot.mode === 'gateway') {
                        exports.cliLogger.log('This gateway install URL contains your client credentials. Do not share it.');
                    }
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
// Detect if a CLI tool is installed, prompt to install if missing.
// Uses official install scripts with platform-specific commands for Unix vs Windows.
// Sets process.env[envPathKey] to the found binary path for the current session.
// After install, re-checks PATH first, then falls back to common install locations.
function ensureCommandAvailable(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var isWindows, whichCmd, isInstalled, shouldInstall, cmd_1, args_1, error_1, foundInPath, home, accessFlag, possiblePaths, installedPath;
        var name = _b.name, envPathKey = _b.envPathKey, installUnix = _b.installUnix, installWindows = _b.installWindows, possiblePathsUnix = _b.possiblePathsUnix, possiblePathsWindows = _b.possiblePathsWindows;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (process.env[envPathKey]) {
                        return [2 /*return*/];
                    }
                    isWindows = process.platform === 'win32';
                    whichCmd = isWindows ? 'where' : 'which';
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)("".concat(whichCmd, " ").concat(name), {
                            env: process.env,
                        }).then(function () {
                            return true;
                        }, function () {
                            return false;
                        })];
                case 1:
                    isInstalled = _c.sent();
                    if (isInstalled) {
                        return [2 /*return*/];
                    }
                    (0, prompts_1.note)("".concat(name, " is required but not found in your PATH."), "".concat(name, " Not Found"));
                    if (!canUseInteractivePrompts()) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, prompts_1.confirm)({
                            message: "Would you like to install ".concat(name, " right now?"),
                        })];
                case 2:
                    shouldInstall = _c.sent();
                    if ((0, prompts_1.isCancel)(shouldInstall) || !shouldInstall) {
                        (0, prompts_1.cancel)("".concat(name, " is required to run this bot"));
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    return [3 /*break*/, 4];
                case 3:
                    exports.cliLogger.log("Auto-installing ".concat(name, " (non-interactive mode)..."));
                    _c.label = 4;
                case 4:
                    exports.cliLogger.log("Installing ".concat(name, "..."));
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 7, , 8]);
                    cmd_1 = isWindows ? 'powershell.exe' : '/bin/bash';
                    args_1 = isWindows
                        ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', installWindows]
                        : ['-lc', installUnix];
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            var child = (0, node_child_process_1.spawn)(cmd_1, args_1, { stdio: 'inherit', env: process.env });
                            child.on('close', function (code) {
                                if (code === 0) {
                                    resolve();
                                }
                                else {
                                    reject(new Error("".concat(name, " install exited with code ").concat(code)));
                                }
                            });
                            child.on('error', reject);
                        })];
                case 6:
                    _c.sent();
                    exports.cliLogger.log("".concat(name, " installed successfully!"));
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _c.sent();
                    exports.cliLogger.log("Failed to install ".concat(name));
                    exports.cliLogger.error('Installation error:', error_1 instanceof Error ? error_1.stack : String(error_1));
                    process.exit(exports.EXIT_NO_RESTART);
                    return [3 /*break*/, 8];
                case 8: return [4 /*yield*/, (0, worktrees_js_1.execAsync)("".concat(whichCmd, " ").concat(name), {
                        env: process.env,
                    }).then(function (result) {
                        var resolved = (0, opencode_command_js_1.selectResolvedCommand)({
                            output: result.stdout,
                            isWindows: isWindows,
                        });
                        return resolved || '';
                    }, function () {
                        return '';
                    })];
                case 9:
                    foundInPath = _c.sent();
                    if (foundInPath) {
                        process.env[envPathKey] = foundInPath;
                        return [2 /*return*/];
                    }
                    home = process.env.HOME || process.env.USERPROFILE || '';
                    accessFlag = isWindows ? node_fs_1.default.constants.F_OK : node_fs_1.default.constants.X_OK;
                    possiblePaths = (isWindows ? possiblePathsWindows : possiblePathsUnix)
                        .filter(function (p) {
                        return !p.startsWith('~') || home;
                    })
                        .map(function (p) {
                        return p.replace('~', home);
                    });
                    installedPath = possiblePaths.find(function (p) {
                        try {
                            node_fs_1.default.accessSync(p, accessFlag);
                            return true;
                        }
                        catch (_a) {
                            return false;
                        }
                    });
                    if (!installedPath) {
                        (0, prompts_1.note)("".concat(name, " was installed but may not be available in this session.\n") +
                            'Please restart your terminal and run this command again.', 'Restart Required');
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    process.env[envPathKey] = installedPath;
                    return [2 /*return*/];
            }
        });
    });
}
// Run opencode upgrade in the background so the user always has the latest version.
// Spawn caffeinate on macOS to prevent system sleep while bot is running.
// Uses -w to watch the parent PID so caffeinate self-terminates if kimaki
// exits for any reason (SIGTERM, crash, process.exit, supervisor stop).
function startCaffeinate() {
    if (process.platform !== 'darwin') {
        return;
    }
    try {
        var proc = (0, node_child_process_1.spawn)('caffeinate', ['-i', '-w', String(process.pid)], {
            stdio: 'ignore',
            detached: false,
        });
        proc.unref();
        proc.on('error', function (err) {
            exports.cliLogger.warn('Failed to start caffeinate:', err.message);
        });
        exports.cliLogger.log('Started caffeinate to prevent system sleep');
    }
    catch (err) {
        exports.cliLogger.warn('Failed to spawn caffeinate:', err instanceof Error ? err.message : String(err));
    }
}
function collectKimakiChannels(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var guildResults;
        var _this = this;
        var guilds = _b.guilds;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, Promise.all(guilds.map(function (guild) { return __awaiter(_this, void 0, void 0, function () {
                        var channels, kimakiChans;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, discord_bot_js_1.getChannelsWithDescriptions)(guild)];
                                case 1:
                                    channels = _a.sent();
                                    kimakiChans = channels.filter(function (ch) { return ch.kimakiDirectory; });
                                    return [2 /*return*/, { guild: guild, channels: kimakiChans }];
                            }
                        });
                    }); }))];
                case 1:
                    guildResults = _c.sent();
                    return [2 /*return*/, guildResults.filter(function (result) {
                            return result.channels.length > 0;
                        })];
            }
        });
    });
}
/**
 * Store channel-directory mappings in the database.
 * Called after Discord login to persist channel configurations.
 */
function storeChannelDirectories(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _i, kimakiChannels_1, _c, guild, channels, _loop_1, _d, channels_1, channel;
        var kimakiChannels = _b.kimakiChannels;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _i = 0, kimakiChannels_1 = kimakiChannels;
                    _e.label = 1;
                case 1:
                    if (!(_i < kimakiChannels_1.length)) return [3 /*break*/, 6];
                    _c = kimakiChannels_1[_i], guild = _c.guild, channels = _c.channels;
                    _loop_1 = function (channel) {
                        var voiceChannel;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0:
                                    if (!channel.kimakiDirectory) return [3 /*break*/, 3];
                                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                                            channelId: channel.id,
                                            directory: channel.kimakiDirectory,
                                            channelType: 'text',
                                            skipIfExists: true,
                                        })];
                                case 1:
                                    _f.sent();
                                    voiceChannel = guild.channels.cache.find(function (ch) {
                                        return ch.type === discord_js_1.ChannelType.GuildVoice && ch.name === channel.name;
                                    });
                                    if (!voiceChannel) return [3 /*break*/, 3];
                                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                                            channelId: voiceChannel.id,
                                            directory: channel.kimakiDirectory,
                                            channelType: 'voice',
                                            skipIfExists: true,
                                        })];
                                case 2:
                                    _f.sent();
                                    _f.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _d = 0, channels_1 = channels;
                    _e.label = 2;
                case 2:
                    if (!(_d < channels_1.length)) return [3 /*break*/, 5];
                    channel = channels_1[_d];
                    return [5 /*yield**/, _loop_1(channel)];
                case 3:
                    _e.sent();
                    _e.label = 4;
                case 4:
                    _d++;
                    return [3 /*break*/, 2];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Show the ready message with channel links.
 * Called at the end of startup to display available channels.
 */
function showReadyMessage(_a) {
    var kimakiChannels = _a.kimakiChannels, createdChannels = _a.createdChannels;
    var allChannels = [];
    allChannels.push.apply(allChannels, createdChannels);
    kimakiChannels.forEach(function (_a) {
        var guild = _a.guild, channels = _a.channels;
        channels.forEach(function (ch) {
            allChannels.push({
                name: ch.name,
                id: ch.id,
                guildId: guild.id,
                directory: ch.kimakiDirectory,
            });
        });
    });
    if (allChannels.length > 0) {
        var channelLinks = allChannels
            .map(function (ch) {
            return "\u2022 #".concat(ch.name, ": https://discord.com/channels/").concat(ch.guildId, "/").concat(ch.id);
        })
            .join('\n');
        (0, prompts_1.note)("Your kimaki channels are ready! Click any link below to open in Discord:\n\n".concat(channelLinks, "\n\nSend a message in any channel to start using OpenCode!"), '🚀 Ready to Use');
    }
    (0, prompts_1.note)('Leave this process running to keep the bot active.\n\nIf you close this process or restart your machine, run `npx kimaki` again to start the bot.', '⚠️  Keep Running');
}
/**
 * Create the default kimaki channel in each guild and send a welcome message.
 * Idempotent: skips guilds that already have the channel.
 * Extracted so both the interactive and headless startup paths share the same logic.
 */
function ensureDefaultChannelsWithWelcome(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var created, _i, guilds_1, guild, result, mentionUserId, error_2;
        var _c;
        var guilds = _b.guilds, discordClient = _b.discordClient, appId = _b.appId, isGatewayMode = _b.isGatewayMode, installerDiscordUserId = _b.installerDiscordUserId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    created = [];
                    _i = 0, guilds_1 = guilds;
                    _d.label = 1;
                case 1:
                    if (!(_i < guilds_1.length)) return [3 /*break*/, 8];
                    guild = guilds_1[_i];
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, (0, discord_bot_js_1.createDefaultKimakiChannel)({
                            guild: guild,
                            botName: (_c = discordClient.user) === null || _c === void 0 ? void 0 : _c.username,
                            appId: appId,
                            isGatewayMode: isGatewayMode,
                        })];
                case 3:
                    result = _d.sent();
                    if (!result) return [3 /*break*/, 5];
                    created.push({
                        name: result.channelName,
                        id: result.textChannelId,
                        guildId: guild.id,
                    });
                    mentionUserId = installerDiscordUserId || guild.ownerId;
                    return [4 /*yield*/, (0, onboarding_welcome_js_1.sendWelcomeMessage)({
                            channel: result.textChannel,
                            mentionUserId: mentionUserId,
                        })];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5: return [3 /*break*/, 7];
                case 6:
                    error_2 = _d.sent();
                    exports.cliLogger.warn("Failed to create default kimaki channel in ".concat(guild.name, ": ").concat(error_2 instanceof Error ? error_2.stack : String(error_2)));
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/, created];
            }
        });
    });
}
/**
 * Background initialization for quick start mode.
 * Starts OpenCode server and registers slash commands without blocking bot startup.
 */
function backgroundInit(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var opencodeResult, getClient, _c, userCommands, agents, error_3;
        var currentDir = _b.currentDir, token = _b.token, appId = _b.appId, guildIds = _b.guildIds;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 6, , 7]);
                    return [4 /*yield*/, (0, discord_bot_js_1.initializeOpencodeForDirectory)(currentDir)];
                case 1:
                    opencodeResult = _d.sent();
                    if (!(opencodeResult instanceof Error)) return [3 /*break*/, 3];
                    exports.cliLogger.warn('Background OpenCode init failed:', opencodeResult.message);
                    // Still try to register basic commands without user commands/agents
                    return [4 /*yield*/, (0, discord_command_registration_js_1.registerCommands)({
                            token: token,
                            appId: appId,
                            guildIds: guildIds,
                            userCommands: [],
                            agents: [],
                        })];
                case 2:
                    // Still try to register basic commands without user commands/agents
                    _d.sent();
                    return [2 /*return*/];
                case 3:
                    getClient = opencodeResult;
                    return [4 /*yield*/, Promise.all([
                            getClient()
                                .command.list({ directory: currentDir })
                                .then(function (r) { return r.data || []; })
                                .catch(function (error) {
                                exports.cliLogger.warn('Failed to load user commands during background init:', error instanceof Error ? error.stack : String(error));
                                return [];
                            }),
                            getClient()
                                .app.agents({ directory: currentDir })
                                .then(function (r) { return r.data || []; })
                                .catch(function (error) {
                                exports.cliLogger.warn('Failed to load agents during background init:', error instanceof Error ? error.stack : String(error));
                                return [];
                            }),
                        ])];
                case 4:
                    _c = _d.sent(), userCommands = _c[0], agents = _c[1];
                    return [4 /*yield*/, (0, discord_command_registration_js_1.registerCommands)({ token: token, appId: appId, guildIds: guildIds, userCommands: userCommands, agents: agents })];
                case 5:
                    _d.sent();
                    exports.cliLogger.log('Slash commands registered!');
                    return [3 /*break*/, 7];
                case 6:
                    error_3 = _d.sent();
                    exports.cliLogger.error('Background init failed:', error_3 instanceof Error ? error_3.stack : String(error_3));
                    void (0, sentry_js_1.notifyError)(error_3, 'Background init failed');
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Resolve bot credentials from (in priority order):
// 1. KIMAKI_BOT_TOKEN env var (headless/CI deployments)
// 2. Saved credentials in the database (self-hosted or gateway mode)
// 3. Interactive wizard (gateway OAuth or self-hosted token entry)
//
// credentialSource tells the caller how creds were obtained:
//   'env'    — KIMAKI_BOT_TOKEN env var
//   'saved'  — reused from database
//   'wizard' — user just completed onboarding (gateway OAuth or self-hosted)
function resolveCredentials(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var envToken, existingBot, hasGatewayCreds, _c, derivedAppId_1, canReuseSavedCreds, modeLabel, gatewayToken, modeChoice, _d, gatewayCredentials, clientId, clientSecret, oauthUrlResult, oauthUrl, isInteractive, exec, openCmd, s, pollUrl, guildId, installerDiscordUserId, attempt, resp, data, _e, syncSpinner, intentsConfirmed, tokenInput, wizardToken, derivedAppId, installed;
        var _this = this;
        var forceRestartOnboarding = _b.forceRestartOnboarding, forceGateway = _b.forceGateway, gatewayCallbackUrl = _b.gatewayCallbackUrl;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    envToken = process.env.KIMAKI_BOT_TOKEN;
                    return [4 /*yield*/, (0, database_js_1.getBotTokenWithMode)()
                        // When --gateway is requested and the resolved bot is still self-hosted,
                        // check if saved gateway credentials exist by looking up the gateway app_id
                        // directly. This lets users switch back and forth between modes without
                        // re-running the onboarding wizard each time.
                    ];
                case 1:
                    existingBot = _f.sent();
                    if (!(forceGateway && (existingBot === null || existingBot === void 0 ? void 0 : existingBot.mode) !== 'gateway')) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, database_js_1.getDb)()];
                case 2: return [4 /*yield*/, (_f.sent()).query.bot_tokens.findFirst({
                        where: { app_id: utils_js_1.KIMAKI_GATEWAY_APP_ID },
                    })];
                case 3:
                    _c = _f.sent();
                    return [3 /*break*/, 5];
                case 4:
                    _c = undefined;
                    _f.label = 5;
                case 5:
                    hasGatewayCreds = _c;
                    if (!(envToken && !forceRestartOnboarding && !forceGateway)) return [3 /*break*/, 7];
                    derivedAppId_1 = appIdFromToken(envToken);
                    if (!derivedAppId_1) {
                        exports.cliLogger.error('Could not derive Application ID from KIMAKI_BOT_TOKEN. The token appears malformed.');
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    return [4 /*yield*/, (0, database_js_1.setBotToken)(derivedAppId_1, envToken)];
                case 6:
                    _f.sent();
                    exports.cliLogger.log("Using KIMAKI_BOT_TOKEN env var (App ID: ".concat(derivedAppId_1, ")"));
                    return [2 /*return*/, { appId: derivedAppId_1, token: envToken, credentialSource: 'env', isGatewayMode: false }];
                case 7:
                    canReuseSavedCreds = existingBot && !forceRestartOnboarding
                        && !(forceGateway && existingBot.mode !== 'gateway');
                    if (canReuseSavedCreds) {
                        modeLabel = existingBot.mode === 'gateway' ? ' (gateway mode)' : '';
                        (0, prompts_1.note)("Using saved bot credentials".concat(modeLabel, ":\nApp ID: ").concat(existingBot.appId, "\n\nTo use different credentials, run with --restart-onboarding"), 'Existing Bot Found');
                        if (existingBot.mode !== 'gateway') {
                            (0, prompts_1.note)("Bot install URL (in case you need to add it to another server):\n".concat((0, utils_js_1.generateBotInstallUrl)({ clientId: existingBot.appId })), 'Install URL');
                        }
                        return [2 /*return*/, { appId: existingBot.appId, token: existingBot.token, credentialSource: 'saved', isGatewayMode: existingBot.mode === 'gateway' }];
                    }
                    // 2b. Switching to gateway: saved gateway credentials exist from a previous
                    // gateway setup. Reuse them without re-running the onboarding wizard.
                    if (hasGatewayCreds && !forceRestartOnboarding) {
                        gatewayToken = (hasGatewayCreds.client_id && hasGatewayCreds.client_secret)
                            ? "".concat(hasGatewayCreds.client_id, ":").concat(hasGatewayCreds.client_secret)
                            : hasGatewayCreds.token;
                        (0, prompts_1.note)("Switching to saved gateway credentials:\nApp ID: ".concat(hasGatewayCreds.app_id), 'Mode Switch');
                        return [2 /*return*/, {
                                appId: hasGatewayCreds.app_id,
                                token: gatewayToken,
                                credentialSource: 'saved',
                                isGatewayMode: true,
                            }];
                    }
                    // 3. Interactive setup wizard (first-time users, --restart-onboarding, or --gateway override).
                    //    Non-TTY: gateway mode proceeds headlessly (JSON events on stdout),
                    //    self-hosted mode requires interactive prompts so we exit.
                    if (!canUseInteractivePrompts() && !forceGateway) {
                        exitNonInteractiveSetup();
                    }
                    if (existingBot && forceGateway && existingBot.mode !== 'gateway') {
                        (0, prompts_1.note)('Ignoring saved self-hosted credentials due to --gateway flag.\nSwitching to gateway mode.', 'Gateway Mode');
                    }
                    else if (forceRestartOnboarding && existingBot) {
                        (0, prompts_1.note)('Ignoring saved credentials due to --restart-onboarding flag', 'Restart Onboarding');
                    }
                    if (!forceGateway) return [3 /*break*/, 8];
                    _d = 'gateway';
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                        var choice;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, prompts_1.select)({
                                        message: 'How do you want to connect to Discord?\n\nGateway: uses Kimaki\'s pre-built bot — no setup, instant. Self-hosted: you create your own Discord bot at discord.com/developers.',
                                        options: [
                                            {
                                                value: 'gateway',
                                                disabled: true,
                                                label: 'Gateway (pre-built Kimaki bot, currently disabled because of Discord verification process. will be re-enabled soon)',
                                            },
                                            {
                                                value: 'self_hosted',
                                                label: 'Self-hosted (your own Discord bot, 5-10 min setup)',
                                            },
                                        ],
                                    })];
                                case 1:
                                    choice = _a.sent();
                                    if ((0, prompts_1.isCancel)(choice)) {
                                        (0, prompts_1.cancel)('Setup cancelled');
                                        process.exit(0);
                                    }
                                    return [2 /*return*/, choice];
                            }
                        });
                    }); })()
                    // ── Gateway mode flow ──
                ];
                case 9:
                    _d = _f.sent();
                    _f.label = 10;
                case 10:
                    modeChoice = _d;
                    if (!(modeChoice === 'gateway')) return [3 /*break*/, 28];
                    if (!utils_js_1.KIMAKI_GATEWAY_APP_ID) {
                        exports.cliLogger.error('Gateway mode is not available yet. KIMAKI_GATEWAY_APP_ID is not configured.');
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    return [4 /*yield*/, resolveGatewayInstallCredentials()];
                case 11:
                    gatewayCredentials = _f.sent();
                    if (gatewayCredentials instanceof Error) {
                        throw gatewayCredentials;
                    }
                    clientId = gatewayCredentials.clientId, clientSecret = gatewayCredentials.clientSecret;
                    oauthUrlResult = (0, utils_js_1.generateDiscordInstallUrlForBot)({
                        appId: utils_js_1.KIMAKI_GATEWAY_APP_ID,
                        mode: 'gateway',
                        clientId: clientId,
                        clientSecret: clientSecret,
                        gatewayCallbackUrl: gatewayCallbackUrl,
                        reachableUrl: (0, discord_urls_js_1.getInternetReachableBaseUrl)() || undefined,
                    });
                    if (oauthUrlResult instanceof Error) {
                        throw oauthUrlResult;
                    }
                    oauthUrl = oauthUrlResult;
                    isInteractive = canUseInteractivePrompts();
                    if (!isInteractive) return [3 /*break*/, 13];
                    (0, prompts_1.note)("Open this URL to install the Kimaki bot in your Discord server:\n\n".concat(oauthUrl, "\n\nDo not share this URL with anyone \u2014 it contains your credentials.\n\nIf you don't have a server, create one first (+ button in the Discord sidebar)."), 'Install Bot');
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('node:child_process'); })];
                case 12:
                    exec = (_f.sent()).exec;
                    openCmd = process.platform === 'darwin'
                        ? 'open'
                        : process.platform === 'win32'
                            ? 'start'
                            : 'xdg-open';
                    exec("".concat(openCmd, " \"").concat(oauthUrl, "\""));
                    return [3 /*break*/, 14];
                case 13:
                    // Non-TTY: emit structured JSON so the host process can show the URL to the user.
                    emitJsonEvent({ type: 'install_url', url: oauthUrl });
                    _f.label = 14;
                case 14:
                    s = isInteractive ? (0, prompts_1.spinner)() : undefined;
                    s === null || s === void 0 ? void 0 : s.start('Waiting for a Discord server with the bot installed...');
                    pollUrl = new URL('/api/onboarding/status', utils_js_1.KIMAKI_WEBSITE_URL);
                    pollUrl.searchParams.set('client_id', clientId);
                    pollUrl.searchParams.set('secret', clientSecret);
                    guildId = void 0;
                    installerDiscordUserId = void 0;
                    attempt = 0;
                    _f.label = 15;
                case 15:
                    if (!(attempt < 100)) return [3 /*break*/, 23];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 3000);
                        })
                        // Progressive hints for interactive users who may be stuck
                    ];
                case 16:
                    _f.sent();
                    // Progressive hints for interactive users who may be stuck
                    if (isInteractive) {
                        if (attempt === 15) {
                            s === null || s === void 0 ? void 0 : s.message('Still waiting... Select a server in the Discord authorization page and click "Authorize"');
                        }
                        else if (attempt === 45) {
                            s === null || s === void 0 ? void 0 : s.message("Still waiting... If you don't see any servers, create one first (+ button in Discord sidebar), then reopen the URL above");
                        }
                        else if (attempt === 150) {
                            s === null || s === void 0 ? void 0 : s.message("Still waiting... Reopen the install URL if you closed it:\n".concat(oauthUrl));
                        }
                    }
                    _f.label = 17;
                case 17:
                    _f.trys.push([17, 21, , 22]);
                    return [4 /*yield*/, fetch(pollUrl.toString())];
                case 18:
                    resp = _f.sent();
                    if (!resp.ok) return [3 /*break*/, 20];
                    return [4 /*yield*/, resp.json()];
                case 19:
                    data = (_f.sent());
                    if (data === null || data === void 0 ? void 0 : data.guild_id) {
                        guildId = data.guild_id;
                        installerDiscordUserId = data.discord_user_id;
                        return [3 /*break*/, 23];
                    }
                    _f.label = 20;
                case 20: return [3 /*break*/, 22];
                case 21:
                    _e = _f.sent();
                    return [3 /*break*/, 22];
                case 22:
                    attempt++;
                    return [3 /*break*/, 15];
                case 23:
                    if (!guildId) {
                        if (isInteractive) {
                            s === null || s === void 0 ? void 0 : s.stop('Authorization timed out');
                        }
                        else {
                            emitJsonEvent({ type: 'error', message: 'Authorization timed out after 5 minutes' });
                        }
                        exports.cliLogger.error('Bot authorization timed out after 5 minutes. Please try again.');
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    if (!isInteractive) return [3 /*break*/, 25];
                    s === null || s === void 0 ? void 0 : s.stop('Bot authorized successfully!');
                    syncSpinner = (0, prompts_1.spinner)();
                    syncSpinner.start('Waiting for gateway sync...');
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 2000);
                        })];
                case 24:
                    _f.sent();
                    syncSpinner.stop('Gateway sync completed');
                    return [3 /*break*/, 27];
                case 25:
                    emitJsonEvent({ type: 'authorized', guild_id: guildId });
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 2000);
                        })];
                case 26:
                    _f.sent();
                    _f.label = 27;
                case 27: return [2 /*return*/, {
                        appId: utils_js_1.KIMAKI_GATEWAY_APP_ID,
                        token: "".concat(clientId, ":").concat(clientSecret),
                        credentialSource: 'wizard',
                        isGatewayMode: true,
                        installerDiscordUserId: installerDiscordUserId,
                    }];
                case 28:
                    // ── Self-hosted mode flow (existing wizard) ──
                    (0, prompts_1.note)('1. Go to https://discord.com/developers/applications\n' +
                        '2. Click "New Application"\n' +
                        '3. Give your application a name', 'Step 1: Create Discord Application');
                    (0, prompts_1.note)('1. Go to the "Bot" section in the left sidebar\n' +
                        '2. Scroll down to "Privileged Gateway Intents"\n' +
                        '3. Enable MESSAGE CONTENT INTENT by toggling it ON\n' +
                        '4. Optional: enable SERVER MEMBERS INTENT only if you want name lookup in `kimaki user list` and `kimaki send --user Tommy`\n' +
                        '5. Click "Save Changes" at the bottom', 'Step 2: Enable Message Content Intent');
                    return [4 /*yield*/, (0, prompts_1.text)({
                            message: 'Press Enter after enabling Message Content Intent:',
                            placeholder: 'Enter',
                        })];
                case 29:
                    intentsConfirmed = _f.sent();
                    if ((0, prompts_1.isCancel)(intentsConfirmed)) {
                        (0, prompts_1.cancel)('Setup cancelled');
                        process.exit(0);
                    }
                    (0, prompts_1.note)('1. Still in the "Bot" section\n' +
                        '2. Click "Reset Token" to generate a new bot token (in case of errors try again)\n' +
                        "3. Copy the token (you won't be able to see it again!)", 'Step 3: Get Bot Token');
                    return [4 /*yield*/, (0, prompts_1.password)({
                            message: 'Enter your Discord Bot Token (from "Bot" section - click "Reset Token" if needed):',
                            validate: function (value) {
                                var cleaned = stripBracketedPaste(value);
                                if (!cleaned) {
                                    return 'Bot token is required';
                                }
                                if (cleaned.length < 50) {
                                    return 'Invalid token format (too short)';
                                }
                            },
                        })];
                case 30:
                    tokenInput = _f.sent();
                    if ((0, prompts_1.isCancel)(tokenInput)) {
                        (0, prompts_1.cancel)('Setup cancelled');
                        process.exit(0);
                    }
                    wizardToken = stripBracketedPaste(tokenInput);
                    derivedAppId = appIdFromToken(wizardToken);
                    if (!derivedAppId) {
                        exports.cliLogger.error('Could not derive Application ID from the bot token. The token appears malformed.');
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    return [4 /*yield*/, (0, database_js_1.setBotToken)(derivedAppId, wizardToken)];
                case 31:
                    _f.sent();
                    (0, prompts_1.note)("Bot install URL:\n".concat((0, utils_js_1.generateBotInstallUrl)({ clientId: derivedAppId }), "\n\nYou MUST install the bot in your Discord server before continuing."), 'Step 4: Install Bot to Server');
                    return [4 /*yield*/, (0, prompts_1.text)({
                            message: 'Press Enter AFTER you have installed the bot in your server:',
                            placeholder: 'Enter',
                        })];
                case 32:
                    installed = _f.sent();
                    if ((0, prompts_1.isCancel)(installed)) {
                        (0, prompts_1.cancel)('Setup cancelled');
                        process.exit(0);
                    }
                    return [2 /*return*/, { appId: derivedAppId, token: wizardToken, credentialSource: 'wizard', isGatewayMode: false }];
            }
        });
    });
}
function run(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var forceRestartOnboarding, forceGateway, hranaResult, _c, appId, token, credentialSource, isGatewayMode, installerDiscordUserId, gatewayToken, currentDir, opencodePromise, isHeadlessGateway, hasConfiguredTextChannels, _d, skipChannelSetup, showLocalTranscriptionBanner, discordClient, guilds, kimakiChannels, createdChannels, error_4, _e, clientId, clientSecret, installUrlResult, installUrl, channelList, getClient, _f, projects, allUserCommands, allAgents, existingDirs_1, availableProjects, selectedProjects, targetGuild, guildSelection_1, _loop_2, _i, selectedProjects_1, projectId, defaultChannelResults, registrableCommands;
        var _this = this;
        var _g;
        var restartOnboarding = _b.restartOnboarding, addChannels = _b.addChannels, useWorktrees = _b.useWorktrees, enableVoiceChannels = _b.enableVoiceChannels, gateway = _b.gateway, gatewayCallbackUrl = _b.gatewayCallbackUrl;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    startCaffeinate();
                    forceRestartOnboarding = Boolean(restartOnboarding);
                    forceGateway = Boolean(gateway);
                    // Step 0: Ensure required CLI tools are installed (OpenCode + Bun).
                    // Run checks in parallel since they're independent `which` calls.
                    return [4 /*yield*/, Promise.all([
                            ensureCommandAvailable({
                                name: 'opencode',
                                envPathKey: 'OPENCODE_PATH',
                                installUnix: 'curl -fsSL https://opencode.ai/install | bash',
                                installWindows: 'irm https://opencode.ai/install.ps1 | iex',
                                possiblePathsUnix: [
                                    '~/.local/bin/opencode',
                                    '~/.opencode/bin/opencode',
                                    '/usr/local/bin/opencode',
                                    '/opt/opencode/bin/opencode',
                                ],
                                possiblePathsWindows: [
                                    '~\\.local\\bin\\opencode.exe',
                                    '~\\AppData\\Local\\opencode\\opencode.exe',
                                    '~\\.opencode\\bin\\opencode.exe',
                                ],
                            }),
                            ensureCommandAvailable({
                                name: 'bun',
                                envPathKey: 'BUN_PATH',
                                installUnix: 'curl -fsSL https://bun.sh/install | bash',
                                installWindows: 'irm bun.sh/install.ps1 | iex',
                                possiblePathsUnix: ['~/.bun/bin/bun', '/usr/local/bin/bun'],
                                possiblePathsWindows: ['~\\.bun\\bin\\bun.exe'],
                            }),
                        ])];
                case 1:
                    // Step 0: Ensure required CLI tools are installed (OpenCode + Bun).
                    // Run checks in parallel since they're independent `which` calls.
                    _h.sent();
                    void (0, upgrade_js_1.backgroundUpgradeKimaki)();
                    return [4 /*yield*/, (0, hrana_server_js_1.startHranaServer)({
                            dbPath: node_path_1.default.join((0, config_js_1.getDataDir)(), 'discord-sessions.db'),
                            bindAll: (0, discord_urls_js_1.getInternetReachableBaseUrl)() !== null,
                        })];
                case 2:
                    hranaResult = _h.sent();
                    if (hranaResult instanceof Error) {
                        exports.cliLogger.error('Failed to start hrana server:', hranaResult.message);
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    // Initialize database (connects to hrana server via HTTP)
                    return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
                case 3:
                    // Initialize database (connects to hrana server via HTTP)
                    _h.sent();
                    return [4 /*yield*/, resolveCredentials({
                            forceRestartOnboarding: forceRestartOnboarding,
                            forceGateway: forceGateway,
                            gatewayCallbackUrl: gatewayCallbackUrl,
                        })];
                case 4:
                    _c = _h.sent(), appId = _c.appId, token = _c.token, credentialSource = _c.credentialSource, isGatewayMode = _c.isGatewayMode, installerDiscordUserId = _c.installerDiscordUserId;
                    return [4 /*yield*/, (0, database_js_1.ensureServiceAuthToken)({
                            appId: appId,
                            preferredGatewayToken: isGatewayMode ? token : undefined,
                        })
                        // Always set service auth token so local and internet control-plane paths
                        // share one auth model (/kimaki/wake and future service endpoints).
                    ];
                case 5:
                    gatewayToken = _h.sent();
                    // Always set service auth token so local and internet control-plane paths
                    // share one auth model (/kimaki/wake and future service endpoints).
                    store_js_1.store.setState({ gatewayToken: gatewayToken });
                    // In gateway mode, ensure REST calls route through the gateway proxy.
                    // getBotTokenWithMode() sets this for saved-credential paths, but the fresh
                    // onboarding path returns directly without going through getBotTokenWithMode(),
                    // leaving store.discordBaseUrl at the default 'https://discord.com'.
                    // Without this, discord.js sends the clientId:clientSecret token to Discord
                    // directly, which rejects it with "An invalid token was provided".
                    if (isGatewayMode) {
                        store_js_1.store.setState({ discordBaseUrl: exports.KIMAKI_GATEWAY_PROXY_REST_BASE_URL });
                    }
                    // When KIMAKI_INTERNET_REACHABLE_URL is set, the hrana server exposes
                    // a /kimaki/wake endpoint for the gateway-proxy to wake this instance and
                    // wait until discord.js is connected. Keep Discord traffic on the normal
                    // configured base URL (gateway-proxy in gateway mode).
                    if ((0, discord_urls_js_1.getInternetReachableBaseUrl)()) {
                        exports.cliLogger.log('Internet-reachable mode: enabling /kimaki/wake endpoint on hrana server');
                    }
                    currentDir = process.cwd();
                    exports.cliLogger.log('Starting OpenCode server...');
                    opencodePromise = (0, discord_bot_js_1.initializeOpencodeForDirectory)(currentDir).then(function (result) {
                        if (result instanceof Error) {
                            throw new Error(result.message);
                        }
                        exports.cliLogger.log('OpenCode server ready!');
                        return result;
                    });
                    // Prevent unhandled rejection if OpenCode fails before backgroundInit
                    // or the channel setup path awaits it. Errors are handled by the
                    // respective consumers (backgroundInit catches, channel setup re-throws).
                    opencodePromise.catch(function () { });
                    return [4 /*yield*/, (0, database_js_1.getDb)()];
                case 6: 
                // Mark this bot as the most recently used so subcommands in separate
                // processes (send, upload-to-discord, project list) pick the correct bot.
                // getBotTokenWithMode() orders by last_used_at DESC as cross-process
                // source of truth.
                return [4 /*yield*/, (_h.sent()).update(dbSchema.bot_tokens)
                        .set({ last_used_at: new Date() })
                        .where(orm.eq(dbSchema.bot_tokens.app_id, appId))
                    // skipChannelSetup: when true, skip interactive project/channel selection
                    // and go straight to bot startup. Channel sync happens in the background.
                    //
                    // Skip when: creds came from env/saved (not first-time wizard), OR non-TTY
                    // gateway (headless), OR user didn't pass --add-channels/--restart-onboarding.
                    // Force channel setup when: first-time quick-start with no channels configured
                    // and TTY is available, or user explicitly passed --add-channels.
                ];
                case 7:
                    // Mark this bot as the most recently used so subcommands in separate
                    // processes (send, upload-to-discord, project list) pick the correct bot.
                    // getBotTokenWithMode() orders by last_used_at DESC as cross-process
                    // source of truth.
                    _h.sent();
                    isHeadlessGateway = isGatewayMode && !canUseInteractivePrompts();
                    _d = Boolean;
                    return [4 /*yield*/, (0, database_js_1.getDb)()];
                case 8: return [4 /*yield*/, (_h.sent()).query.channel_directories.findFirst({
                        where: { channel_type: 'text' },
                        columns: { channel_id: true },
                    })];
                case 9:
                    hasConfiguredTextChannels = _d.apply(void 0, [_h.sent()]);
                    skipChannelSetup = isHeadlessGateway || (function () {
                        // Wizard source always shows channel setup (user just completed onboarding)
                        if (credentialSource === 'wizard') {
                            return false;
                        }
                        // Env/saved source: skip unless user explicitly asked for channels
                        if (forceRestartOnboarding || Boolean(addChannels)) {
                            return false;
                        }
                        // First-time quick start with no channels: force setup if TTY is available
                        if (!hasConfiguredTextChannels && canUseInteractivePrompts()) {
                            return false;
                        }
                        return true;
                    })();
                    showLocalTranscriptionBanner = function () {
                        var bigText = figlet_1.default.textSync('LOCAL\nVOICE', { font: 'ANSI Shadow' });
                        var totalWidth = 75;
                        var lines = bigText.split('\n');
                        var borderedLines = lines.map(function (line) {
                            var paddedLine = line.padEnd(totalWidth - 2);
                            return "\u2502 ".concat(paddedLine, "\u2502");
                        });
                        var banner = "\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563\n\u2502                                                                           \u2502\n".concat(borderedLines.join('\n'), "\n\u2502                                                                           \u2502\n\u2502                    \u2605 L O C A L   T R A N S C R I P T I O N \u2605              \u2502\n\u2502                         V A R I A N T   O F   K I M A K I                 \u2502\n\u2502                                                                           \u2502\n\u2502   Features:                                                               \u2502\n\u2502   \u2022 Parakeet MLX (Apple Silicon) - Local NVIDIA Parakeet via MLX         \u2502\n\u2502   \u2022 vLLM Whisper (GPU/CPU)   - OpenAI-compatible Whisper transcription   \u2502\n\u2502   \u2022 Fallback chain: Parakeet \u2192 vLLM \u2192 OpenAI \u2192 Gemini                    \u2502\n\u2502                                                                           \u2502\n\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2551\n");
                        console.log(banner);
                    };
                    showLocalTranscriptionBanner();
                    exports.cliLogger.log("Connecting to ".concat((0, discord_urls_js_1.getDiscordRestApiUrl)(), "..."));
                    return [4 /*yield*/, (0, discord_bot_js_1.createDiscordClient)()];
                case 10:
                    discordClient = _h.sent();
                    guilds = [];
                    kimakiChannels = [];
                    createdChannels = [];
                    _h.label = 11;
                case 11:
                    _h.trys.push([11, 14, , 15]);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            discordClient.once(discord_js_1.Events.ClientReady, function (c) { return __awaiter(_this, void 0, void 0, function () {
                                var guildResults, _i, guildResults_1, result;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            // Guild discovery comes from the Gateway WebSocket READY payload, not
                                            // from a separate REST fetch. discord.js consumes READY and hydrates
                                            // client.guilds.cache from d.guilds. In gateway mode, gateway-proxy
                                            // already filters this list to authorized guilds for client_id:secret.
                                            // Example payload fragment received over WS:
                                            // {
                                            //   "op": 0,
                                            //   "t": "READY",
                                            //   "d": {
                                            //     "guilds": [
                                            //       { "id": "123456789012345678", "unavailable": false }
                                            //     ]
                                            //   }
                                            // }
                                            guilds.push.apply(guilds, Array.from(c.guilds.cache.values()));
                                            if (skipChannelSetup) {
                                                resolve(null);
                                                return [2 /*return*/];
                                            }
                                            return [4 /*yield*/, collectKimakiChannels({ guilds: guilds })
                                                // Collect results
                                            ];
                                        case 1:
                                            guildResults = _a.sent();
                                            // Collect results
                                            for (_i = 0, guildResults_1 = guildResults; _i < guildResults_1.length; _i++) {
                                                result = guildResults_1[_i];
                                                kimakiChannels.push(result);
                                            }
                                            resolve(null);
                                            return [2 /*return*/];
                                    }
                                });
                            }); });
                            discordClient.once(discord_js_1.Events.Error, reject);
                            discordClient.login(token).catch(reject);
                        })];
                case 12:
                    _h.sent();
                    exports.cliLogger.log('Connected to Discord!');
                    // Start IPC polling now that Discord client is ready.
                    // Register cleanup on process exit since the shutdown handler lives in discord-bot.ts.
                    return [4 /*yield*/, (0, ipc_polling_js_1.startIpcPolling)({ discordClient: discordClient })];
                case 13:
                    // Start IPC polling now that Discord client is ready.
                    // Register cleanup on process exit since the shutdown handler lives in discord-bot.ts.
                    _h.sent();
                    process.on('exit', ipc_polling_js_1.stopIpcPolling);
                    return [3 /*break*/, 15];
                case 14:
                    error_4 = _h.sent();
                    exports.cliLogger.log('Failed to connect to Discord', discordClient.ws.gateway);
                    exports.cliLogger.error('Error: ' + (error_4 instanceof Error ? error_4.stack : String(error_4)));
                    process.exit(exports.EXIT_NO_RESTART);
                    return [3 /*break*/, 15];
                case 15: return [4 /*yield*/, (0, database_js_1.setBotToken)(appId, token)
                    // In gateway mode the bot only sees guilds the user has installed
                    // it in. Zero guilds means the install URL callback never completed or the
                    // user removed the bot from all servers — there is nothing the bot can do.
                ];
                case 16:
                    _h.sent();
                    // In gateway mode the bot only sees guilds the user has installed
                    // it in. Zero guilds means the install URL callback never completed or the
                    // user removed the bot from all servers — there is nothing the bot can do.
                    if (isGatewayMode && guilds.length === 0) {
                        _e = token.split(':'), clientId = _e[0], clientSecret = _e[1];
                        if (!clientId || !clientSecret) {
                            throw new Error('Malformed gateway token: expected clientId:clientSecret format');
                        }
                        installUrlResult = (0, utils_js_1.generateDiscordInstallUrlForBot)({
                            appId: utils_js_1.KIMAKI_GATEWAY_APP_ID,
                            mode: 'gateway',
                            clientId: clientId,
                            clientSecret: clientSecret,
                        });
                        if (installUrlResult instanceof Error) {
                            throw installUrlResult;
                        }
                        installUrl = installUrlResult;
                        if (!canUseInteractivePrompts()) {
                            emitJsonEvent({ type: 'error', message: 'No Discord servers found', install_url: installUrl });
                        }
                        exports.cliLogger.error('No Discord servers found. The bot must be installed in at least one server.\n' +
                            "Install URL: ".concat(installUrl, "\n") +
                            'Do not share this URL with anyone — it contains your credentials.\n' +
                            'Open the URL above to add the bot to a server, then run kimaki again.');
                        void discordClient.destroy();
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    if (!skipChannelSetup) return [3 /*break*/, 18];
                    // Start bot immediately — channel sync happens in the background.
                    exports.cliLogger.log('Starting Discord bot...');
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({ token: token, appId: appId, discordClient: discordClient, useWorktrees: useWorktrees })];
                case 17:
                    _h.sent();
                    exports.cliLogger.log('Discord bot is running!');
                    // Background channel sync + role reconciliation + default channel creation.
                    // Never blocks ready state.
                    void (function () { return __awaiter(_this, void 0, void 0, function () {
                        var backgroundChannels, error_5, error_6;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, collectKimakiChannels({ guilds: guilds })];
                                case 1:
                                    backgroundChannels = _a.sent();
                                    return [4 /*yield*/, storeChannelDirectories({ kimakiChannels: backgroundChannels })];
                                case 2:
                                    _a.sent();
                                    exports.cliLogger.log("Background channel sync completed for ".concat(backgroundChannels.length, " guild(s)"));
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_5 = _a.sent();
                                    exports.cliLogger.warn('Background channel sync failed:', error_5 instanceof Error ? error_5.stack : String(error_5));
                                    return [3 /*break*/, 4];
                                case 4:
                                    _a.trys.push([4, 6, , 7]);
                                    return [4 /*yield*/, ensureDefaultChannelsWithWelcome({
                                            guilds: guilds,
                                            discordClient: discordClient,
                                            appId: appId,
                                            isGatewayMode: isGatewayMode,
                                            installerDiscordUserId: installerDiscordUserId,
                                        })];
                                case 5:
                                    _a.sent();
                                    return [3 /*break*/, 7];
                                case 6:
                                    error_6 = _a.sent();
                                    exports.cliLogger.warn('Background default channel creation failed:', error_6 instanceof Error ? error_6.stack : String(error_6));
                                    return [3 /*break*/, 7];
                                case 7: return [2 /*return*/];
                            }
                        });
                    }); })();
                    // Background: OpenCode init + slash command registration (non-blocking)
                    void backgroundInit({
                        currentDir: currentDir,
                        token: token,
                        appId: appId,
                        guildIds: guilds.map(function (guild) {
                            return guild.id;
                        }),
                    });
                    return [3 /*break*/, 33];
                case 18: 
                // ── Channel setup flow ──
                // Store channel-directory mappings discovered during Discord login.
                return [4 /*yield*/, storeChannelDirectories({ kimakiChannels: kimakiChannels })];
                case 19:
                    // ── Channel setup flow ──
                    // Store channel-directory mappings discovered during Discord login.
                    _h.sent();
                    if (!hasConfiguredTextChannels) {
                        (0, prompts_1.note)('No Kimaki project channels are configured yet. Opening project/channel setup.', 'Channel Setup');
                    }
                    if (kimakiChannels.length > 0) {
                        channelList = kimakiChannels
                            .flatMap(function (_a) {
                            var guild = _a.guild, channels = _a.channels;
                            return channels.map(function (ch) {
                                return "#".concat(ch.name, " in ").concat(guild.name, ": ").concat(ch.kimakiDirectory);
                            });
                        })
                            .join('\n');
                        (0, prompts_1.note)(channelList, 'Existing Kimaki Channels');
                    }
                    // Wait for OpenCode, fetch projects, show prompts, create channels if needed
                    exports.cliLogger.log('Waiting for OpenCode server...');
                    return [4 /*yield*/, opencodePromise];
                case 20:
                    getClient = _h.sent();
                    exports.cliLogger.log('Fetching OpenCode data...');
                    return [4 /*yield*/, Promise.all([
                            getClient()
                                .project.list()
                                .then(function (r) { return r.data || []; })
                                .catch(function (error) {
                                exports.cliLogger.log('Failed to fetch projects');
                                exports.cliLogger.error('Error:', error instanceof Error ? error.stack : String(error));
                                void discordClient.destroy();
                                process.exit(exports.EXIT_NO_RESTART);
                            }),
                            getClient()
                                .command.list({ directory: currentDir })
                                .then(function (r) { return r.data || []; })
                                .catch(function (error) {
                                exports.cliLogger.warn('Failed to load user commands during setup:', error instanceof Error ? error.stack : String(error));
                                return [];
                            }),
                            getClient()
                                .app.agents({ directory: currentDir })
                                .then(function (r) { return r.data || []; })
                                .catch(function (error) {
                                exports.cliLogger.warn('Failed to load agents during setup:', error instanceof Error ? error.stack : String(error));
                                return [];
                            }),
                        ])];
                case 21:
                    _f = _h.sent(), projects = _f[0], allUserCommands = _f[1], allAgents = _f[2];
                    exports.cliLogger.log("Found ".concat(projects.length, " OpenCode project(s)"));
                    existingDirs_1 = kimakiChannels.flatMap(function (_a) {
                        var channels = _a.channels;
                        return channels
                            .filter(function (ch) { return ch.kimakiDirectory; })
                            .map(function (ch) { return ch.kimakiDirectory; })
                            .filter(Boolean);
                    });
                    availableProjects = (0, utils_js_1.deduplicateByKey)(projects.filter(function (project) {
                        if (existingDirs_1.includes(project.worktree)) {
                            return false;
                        }
                        if (node_path_1.default.basename(project.worktree).startsWith('opencode-test-')) {
                            return false;
                        }
                        return true;
                    }), function (x) { return x.worktree; });
                    if (availableProjects.length === 0) {
                        (0, prompts_1.note)('All OpenCode projects already have Discord channels', 'No New Projects');
                    }
                    if (!(availableProjects.length > 0)) return [3 /*break*/, 30];
                    if (!canUseInteractivePrompts()) {
                        exitNonInteractiveSetup();
                    }
                    return [4 /*yield*/, (0, prompts_1.multiselect)({
                            message: 'Select projects to create Discord channels for:',
                            options: availableProjects.map(function (project) { return ({
                                value: project.id,
                                label: "".concat(node_path_1.default.basename(project.worktree), " (").concat((0, utils_js_1.abbreviatePath)(project.worktree), ")"),
                            }); }),
                            required: false,
                        })];
                case 22:
                    selectedProjects = _h.sent();
                    if (!(!(0, prompts_1.isCancel)(selectedProjects) && selectedProjects.length > 0)) return [3 /*break*/, 30];
                    targetGuild = void 0;
                    if (guilds.length === 0) {
                        exports.cliLogger.error('No Discord servers found! The bot must be installed in at least one server.');
                        process.exit(exports.EXIT_NO_RESTART);
                    }
                    if (!(guilds.length === 1)) return [3 /*break*/, 23];
                    targetGuild = guilds[0];
                    (0, prompts_1.note)("Using server: ".concat(targetGuild.name), 'Server Selected');
                    return [3 /*break*/, 25];
                case 23: return [4 /*yield*/, (0, prompts_1.multiselect)({
                        message: 'Select a Discord server to create channels in:',
                        options: guilds.map(function (guild) { return ({
                            value: guild.id,
                            label: "".concat(guild.name, " (").concat(guild.memberCount, " members)"),
                        }); }),
                        required: true,
                        maxItems: 1,
                    })];
                case 24:
                    guildSelection_1 = _h.sent();
                    if ((0, prompts_1.isCancel)(guildSelection_1)) {
                        (0, prompts_1.cancel)('Setup cancelled');
                        process.exit(0);
                    }
                    targetGuild = guilds.find(function (g) { return g.id === guildSelection_1[0]; });
                    _h.label = 25;
                case 25:
                    exports.cliLogger.log('Creating Discord channels...');
                    _loop_2 = function (projectId) {
                        var project, _j, textChannelId, channelName, error_7;
                        return __generator(this, function (_k) {
                            switch (_k.label) {
                                case 0:
                                    project = projects.find(function (p) { return p.id === projectId; });
                                    if (!project)
                                        return [2 /*return*/, "continue"];
                                    _k.label = 1;
                                case 1:
                                    _k.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, (0, discord_bot_js_1.createProjectChannels)({
                                            guild: targetGuild,
                                            projectDirectory: project.worktree,
                                            botName: (_g = discordClient.user) === null || _g === void 0 ? void 0 : _g.username,
                                            enableVoiceChannels: enableVoiceChannels,
                                        })];
                                case 2:
                                    _j = _k.sent(), textChannelId = _j.textChannelId, channelName = _j.channelName;
                                    createdChannels.push({
                                        name: channelName,
                                        id: textChannelId,
                                        guildId: targetGuild.id,
                                    });
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_7 = _k.sent();
                                    exports.cliLogger.error("Failed to create channels for ".concat(node_path_1.default.basename(project.worktree), ":"), error_7);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, selectedProjects_1 = selectedProjects;
                    _h.label = 26;
                case 26:
                    if (!(_i < selectedProjects_1.length)) return [3 /*break*/, 29];
                    projectId = selectedProjects_1[_i];
                    return [5 /*yield**/, _loop_2(projectId)];
                case 27:
                    _h.sent();
                    _h.label = 28;
                case 28:
                    _i++;
                    return [3 /*break*/, 26];
                case 29:
                    exports.cliLogger.log("Created ".concat(createdChannels.length, " channel(s)"));
                    if (createdChannels.length > 0) {
                        (0, prompts_1.note)(createdChannels.map(function (ch) { return "#".concat(ch.name); }).join('\n'), 'Created Channels');
                    }
                    _h.label = 30;
                case 30: return [4 /*yield*/, ensureDefaultChannelsWithWelcome({
                        guilds: guilds,
                        discordClient: discordClient,
                        appId: appId,
                        isGatewayMode: isGatewayMode,
                        installerDiscordUserId: installerDiscordUserId,
                    })];
                case 31:
                    defaultChannelResults = _h.sent();
                    createdChannels.push.apply(createdChannels, defaultChannelResults);
                    registrableCommands = allUserCommands.filter(function (cmd) { return !discord_command_registration_js_1.SKIP_USER_COMMANDS.includes(cmd.name); });
                    if (registrableCommands.length > 0) {
                        (0, prompts_1.note)("Found ".concat(registrableCommands.length, " user-defined command(s)"), 'OpenCode Commands/Skills');
                    }
                    exports.cliLogger.log('Registering slash commands asynchronously...');
                    void (0, discord_command_registration_js_1.registerCommands)({
                        token: token,
                        appId: appId,
                        guildIds: guilds.map(function (guild) {
                            return guild.id;
                        }),
                        userCommands: allUserCommands,
                        agents: allAgents,
                    })
                        .then(function () {
                        exports.cliLogger.log('Slash commands registered!');
                    })
                        .catch(function (error) {
                        exports.cliLogger.error('Failed to register slash commands:', error instanceof Error ? error.stack : String(error));
                    });
                    // Start bot after channel setup is complete so it doesn't handle
                    // messages/interactions while the user is still going through prompts.
                    exports.cliLogger.log('Starting Discord bot...');
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({ token: token, appId: appId, discordClient: discordClient, useWorktrees: useWorktrees })];
                case 32:
                    _h.sent();
                    exports.cliLogger.log('Discord bot is running!');
                    _h.label = 33;
                case 33:
                    // ── Ready ──
                    if (!canUseInteractivePrompts()) {
                        emitJsonEvent({
                            type: 'ready',
                            app_id: appId,
                            guild_ids: guilds.map(function (g) { return g.id; }),
                        });
                    }
                    else {
                        showReadyMessage({ kimakiChannels: kimakiChannels, createdChannels: createdChannels });
                        (0, prompts_1.outro)('✨ Bot ready! Listening for messages...');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
