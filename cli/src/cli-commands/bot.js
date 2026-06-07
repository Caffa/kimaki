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
// Bot configuration terminal commands for install URLs and Discord presence.
var goke_1 = require("goke");
var discord_js_1 = require("discord.js");
var logger_js_1 = require("../logger.js");
var discord_bot_js_1 = require("../discord-bot.js");
var database_js_1 = require("../database.js");
var config_js_1 = require("../config.js");
var cli_runner_js_1 = require("../cli-runner.js");
var cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
var cli = (0, goke_1.goke)();
cli
    .command('discord-install-url', 'Print the bot install URL and exit')
    .option('--data-dir <path>', 'Data directory for config and database (default: ~/.kimaki)')
    .option('--gateway', 'Print the gateway install URL and create local gateway credentials if missing')
    .option('--gateway-callback-url <url>', 'After gateway OAuth install, redirect to this URL instead of the default success page (appends ?guild_id=<id>)')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (options.dataDir) {
                    (0, config_js_1.setDataDir)(options.dataDir);
                    cliLogger.log("Using data directory: ".concat((0, config_js_1.getDataDir)()));
                }
                (0, logger_js_1.initLogFile)((0, config_js_1.getDataDir)());
                return [4 /*yield*/, (0, cli_runner_js_1.printDiscordInstallUrlAndExit)({
                        gateway: options.gateway,
                        gatewayCallbackUrl: options.gatewayCallbackUrl,
                    })];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                cliLogger.error('Error:', error_1 instanceof Error ? error_1.stack : String(error_1));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// ── bot command group ────────────────────────────────────────────────────
var ACTIVITY_TYPE_MAP = {
    playing: discord_js_1.ActivityType.Playing,
    watching: discord_js_1.ActivityType.Watching,
    listening: discord_js_1.ActivityType.Listening,
    competing: discord_js_1.ActivityType.Competing,
    custom: discord_js_1.ActivityType.Custom,
};
var STATUS_MAP = {
    online: 'online',
    idle: 'idle',
    dnd: 'dnd',
    invisible: 'invisible',
};
cli
    .command('bot install-url', 'Print the bot install URL')
    .option('--data-dir <path>', 'Data directory for config and database (default: ~/.kimaki)')
    .option('--gateway', 'Print the gateway install URL and create local gateway credentials if missing')
    .option('--gateway-callback-url <url>', 'After gateway OAuth install, redirect to this URL instead of the default success page (appends ?guild_id=<id>)')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (options.dataDir) {
                    (0, config_js_1.setDataDir)(options.dataDir);
                    cliLogger.log("Using data directory: ".concat((0, config_js_1.getDataDir)()));
                }
                (0, logger_js_1.initLogFile)((0, config_js_1.getDataDir)());
                return [4 /*yield*/, (0, cli_runner_js_1.printDiscordInstallUrlAndExit)({
                        gateway: options.gateway,
                        gatewayCallbackUrl: options.gatewayCallbackUrl,
                    })];
            case 1:
                _a.sent();
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                cliLogger.error('Error:', error_2 instanceof Error ? error_2.stack : String(error_2));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Max length for activity name/state — Discord silently truncates beyond 128 chars.
var MAX_STATUS_TEXT_LENGTH = 128;
// Login timeout for temporary discord.js clients (10s).
var BOT_LOGIN_TIMEOUT_MS = 10000;
// Wait for gateway opcode 3 websocket frame to flush before destroying the client.
var PRESENCE_FLUSH_DELAY_MS = 1200;
/**
 * Create a temporary discord.js client, connect to gateway, run a callback,
 * then tear down. Includes a login timeout so the command doesn't hang forever.
 */
function withTempDiscordClient(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var client;
        var token = _b.token, onReady = _b.onReady;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, discord_bot_js_1.createDiscordClient)()];
                case 1:
                    client = _c.sent();
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, , 5, 6]);
                    return [4 /*yield*/, Promise.race([
                            new Promise(function (resolve, reject) {
                                client.once(discord_js_1.Events.ClientReady, function () {
                                    resolve();
                                });
                                client.once(discord_js_1.Events.Error, reject);
                                client.login(token).catch(reject);
                            }),
                            new Promise(function (_, reject) {
                                setTimeout(function () {
                                    reject(new Error('Discord login timed out (10s)'));
                                }, BOT_LOGIN_TIMEOUT_MS);
                            }),
                        ])];
                case 3:
                    _c.sent();
                    if (!client.isReady() || !client.user) {
                        throw new Error('Discord client ready but user is missing');
                    }
                    return [4 /*yield*/, onReady(client)];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 6];
                case 5:
                    void client.destroy();
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
cli
    .command('bot status set <text>', 'Set the bot presence/status in Discord')
    .option('--data-dir <path>', 'Data directory for config and database (default: ~/.kimaki)')
    .option('--type <activityType>', 'Activity type: playing, watching, listening, competing, custom (default: custom)')
    .option('--status <onlineStatus>', 'Online status: online, idle, dnd, invisible (default: online)')
    .action(function (text, options) { return __awaiter(void 0, void 0, void 0, function () {
    var botRow, activityTypeKey_1, activityType_1, statusKey_1, onlineStatus_1, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                if (options.dataDir) {
                    (0, config_js_1.setDataDir)(options.dataDir);
                }
                (0, logger_js_1.initLogFile)((0, config_js_1.getDataDir)());
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, database_js_1.getBotTokenWithMode)()];
            case 2:
                botRow = _a.sent();
                if (!botRow) {
                    cliLogger.error('No bot configured. Run `kimaki` first.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (botRow.mode === 'gateway') {
                    cliLogger.error('Cannot set status in gateway mode — it would change the shared bot status for all users.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (text.length > MAX_STATUS_TEXT_LENGTH) {
                    cliLogger.error("Status text too long (".concat(text.length, " chars, max ").concat(MAX_STATUS_TEXT_LENGTH, ")."));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                activityTypeKey_1 = (options.type || 'custom').toLowerCase();
                activityType_1 = ACTIVITY_TYPE_MAP[activityTypeKey_1];
                if (activityType_1 === undefined) {
                    cliLogger.error("Unknown activity type: ".concat(options.type, ". Use: playing, watching, listening, competing, custom"));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                statusKey_1 = (options.status || 'online').toLowerCase();
                onlineStatus_1 = STATUS_MAP[statusKey_1];
                if (!onlineStatus_1) {
                    cliLogger.error("Unknown status: ".concat(options.status, ". Use: online, idle, dnd, invisible"));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                cliLogger.log('Connecting to Discord...');
                return [4 /*yield*/, withTempDiscordClient({
                        token: botRow.token,
                        onReady: function (client) { return __awaiter(void 0, void 0, void 0, function () {
                            var activity;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        activity = activityType_1 === discord_js_1.ActivityType.Custom
                                            ? { name: 'Custom Status', type: activityType_1, state: text }
                                            : { name: text, type: activityType_1 };
                                        client.user.setPresence({
                                            activities: [activity],
                                            status: onlineStatus_1,
                                        });
                                        // setPresence queues a gateway opcode 3 over websocket.
                                        // Wait so the frame flushes before we tear down the connection.
                                        return [4 /*yield*/, new Promise(function (resolve) {
                                                setTimeout(resolve, PRESENCE_FLUSH_DELAY_MS);
                                            })];
                                    case 1:
                                        // setPresence queues a gateway opcode 3 over websocket.
                                        // Wait so the frame flushes before we tear down the connection.
                                        _a.sent();
                                        cliLogger.log("Status set: ".concat(activityTypeKey_1 === 'custom' ? text : "".concat(activityTypeKey_1, " ").concat(text), " (").concat(statusKey_1, ")"));
                                        return [2 /*return*/];
                                }
                            });
                        }); },
                    })];
            case 3:
                _a.sent();
                process.exit(0);
                return [3 /*break*/, 5];
            case 4:
                error_3 = _a.sent();
                cliLogger.error('Error:', error_3 instanceof Error ? error_3.stack : String(error_3));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
cli
    .command('bot status clear', 'Clear the bot presence/status')
    .option('--data-dir <path>', 'Data directory for config and database (default: ~/.kimaki)')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var botRow, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                if (options.dataDir) {
                    (0, config_js_1.setDataDir)(options.dataDir);
                }
                (0, logger_js_1.initLogFile)((0, config_js_1.getDataDir)());
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, database_js_1.getBotTokenWithMode)()];
            case 2:
                botRow = _a.sent();
                if (!botRow) {
                    cliLogger.error('No bot configured. Run `kimaki` first.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (botRow.mode === 'gateway') {
                    cliLogger.error('Cannot clear status in gateway mode — it would change the shared bot status for all users.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                cliLogger.log('Connecting to Discord...');
                return [4 /*yield*/, withTempDiscordClient({
                        token: botRow.token,
                        onReady: function (client) { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        client.user.setPresence({
                                            activities: [],
                                            status: 'online',
                                        });
                                        return [4 /*yield*/, new Promise(function (resolve) {
                                                setTimeout(resolve, PRESENCE_FLUSH_DELAY_MS);
                                            })];
                                    case 1:
                                        _a.sent();
                                        cliLogger.log('Status cleared');
                                        return [2 /*return*/];
                                }
                            });
                        }); },
                    })];
            case 3:
                _a.sent();
                process.exit(0);
                return [3 /*break*/, 5];
            case 4:
                error_4 = _a.sent();
                cliLogger.error('Error:', error_4 instanceof Error ? error_4.stack : String(error_4));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.default = cli;
