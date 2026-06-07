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
// Utility terminal commands for Discord users, tunnels, screenshares, and database paths.
var goke_1 = require("goke");
var discord_js_1 = require("discord.js");
var node_path_1 = require("node:path");
var logger_js_1 = require("../logger.js");
var discord_bot_js_1 = require("../discord-bot.js");
var discord_urls_js_1 = require("../discord-urls.js");
var config_js_1 = require("../config.js");
var cli_runner_js_1 = require("../cli-runner.js");
var cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
var cli = (0, goke_1.goke)();
cli
    .command('user list', 'Search for Discord users in a guild/server. Returns user IDs for mentions.')
    .option('-g, --guild <guildId>', 'Discord guild/server ID (required)')
    .option('-q, --query [query]', 'Search query to filter users by name')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var guildId_1, query_1, botToken, rest_1, membersResult, members, msg, userList, header, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                if (!options.guild) {
                    cliLogger.error('Guild ID is required. Use --guild <guildId>');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                guildId_1 = String(options.guild);
                query_1 = options.query || undefined;
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, cli_runner_js_1.resolveBotCredentials)()];
            case 2:
                botToken = (_a.sent()).token;
                rest_1 = (0, discord_urls_js_1.createDiscordRest)(botToken);
                return [4 /*yield*/, (function () { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!query_1) return [3 /*break*/, 2];
                                    return [4 /*yield*/, rest_1.get(discord_js_1.Routes.guildMembersSearch(guildId_1), {
                                            query: new URLSearchParams({ query: query_1, limit: '20' }),
                                        })];
                                case 1: return [2 /*return*/, _a.sent()];
                                case 2: return [4 /*yield*/, rest_1.get(discord_js_1.Routes.guildMembers(guildId_1), {
                                        query: new URLSearchParams({ limit: '20' }),
                                    })];
                                case 3: return [2 /*return*/, _a.sent()];
                            }
                        });
                    }); })().catch(function (error) { return new Error('Discord member list failed', { cause: error }); })];
            case 3:
                membersResult = _a.sent();
                if (membersResult instanceof Error) {
                    if ((0, cli_runner_js_1.isDiscordMemberLookupUnavailable)(membersResult)) {
                        cliLogger.error((0, cli_runner_js_1.formatMemberLookupUnavailableMessage)());
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                    cliLogger.error(membersResult.message);
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                members = Array.isArray(membersResult)
                    ? membersResult.filter(cli_runner_js_1.isGuildMemberSearchResult)
                    : [];
                if (members.length === 0) {
                    msg = query_1
                        ? "No users found matching \"".concat(query_1, "\"")
                        : 'No users found in guild';
                    cliLogger.log(msg);
                    process.exit(0);
                }
                userList = members
                    .map(function (m) {
                    var displayName = m.nick || m.user.global_name || m.user.username;
                    return "- ".concat(displayName, " (ID: ").concat(m.user.id, ") - mention: <@").concat(m.user.id, ">");
                })
                    .join('\n');
                header = query_1
                    ? "Found ".concat(members.length, " users matching \"").concat(query_1, "\":")
                    : "Found ".concat(members.length, " users:");
                console.log("".concat(header, "\n").concat(userList));
                process.exit(0);
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                cliLogger.error('Error:', error_1 instanceof Error ? error_1.stack : String(error_1));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
cli
    .command('tunnel', 'Expose a local port via tunnel')
    .option('-p, --port <port>', 'Local port to expose (optional when command output reveals one)')
    .option('-t, --tunnel-id [id]', 'Custom tunnel ID (only for services safe to expose publicly; prefer random default)')
    .option('-h, --host [host]', 'Local host (default: localhost)')
    .option('-s, --server [url]', 'Tunnel server URL')
    .option('-k, --kill', 'Kill any existing process on the port before starting')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, runTunnel, parseCommandFromArgv, command, port;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('traforo/run-tunnel'); })];
            case 1:
                _a = _b.sent(), runTunnel = _a.runTunnel, parseCommandFromArgv = _a.parseCommandFromArgv;
                command = parseCommandFromArgv(process.argv).command;
                if (!options.port && command.length === 0) {
                    cliLogger.error('Error: --port is required unless a command is provided after --');
                    cliLogger.error("\nUsage: kimaki tunnel [-- command]");
                    cliLogger.error("   or: kimaki tunnel --port <port>");
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                port = options.port ? parseInt(options.port, 10) : 8080;
                if (options.port && (!port || port < 1 || port > 65535)) {
                    cliLogger.error("Error: Invalid port number: ".concat(options.port));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, runTunnel({
                        port: port,
                        tunnelId: options.tunnelId || undefined,
                        localHost: options.host || undefined,
                        baseDomain: 'kimaki.dev',
                        serverUrl: options.server || undefined,
                        command: command.length > 0 ? command : undefined,
                        kill: options.kill,
                    })];
            case 2:
                _b.sent();
                return [2 /*return*/];
        }
    });
}); });
cli
    .command('screenshare', 'Share your screen via VNC tunnel. Auto-stops after 30 minutes. Runs until Ctrl+C. For background usage, start with bunx tuistory --help, then run it in a tuistory session.')
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var startScreenshare, session, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('../commands/screenshare.js'); })];
            case 1:
                startScreenshare = (_a.sent()).startScreenshare;
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, startScreenshare({
                        sessionKey: 'cli',
                        startedBy: 'cli',
                    })];
            case 3:
                session = _a.sent();
                cliLogger.log("Screen sharing started: ".concat(session.noVncUrl));
                cliLogger.log('Press Ctrl+C to stop');
                return [3 /*break*/, 5];
            case 4:
                err_1 = _a.sent();
                cliLogger.error('Failed to start screen share:', err_1 instanceof Error ? err_1.message : String(err_1));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
cli
    .command('sqlitedb', 'Show the location of the SQLite database file')
    .action(function () {
    var dataDir = (0, config_js_1.getDataDir)();
    var dbPath = node_path_1.default.join(dataDir, 'discord-sessions.db');
    cliLogger.log(dbPath);
});
exports.default = cli;
