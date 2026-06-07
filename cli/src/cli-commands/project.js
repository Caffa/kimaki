"use strict";
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
// Project registration and Discord channel management terminal commands.
var goke_1 = require("goke");
var prompts_1 = require("@clack/prompts");
var discord_js_1 = require("discord.js");
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var node_child_process_1 = require("node:child_process");
var logger_js_1 = require("../logger.js");
var discord_bot_js_1 = require("../discord-bot.js");
var database_js_1 = require("../database.js");
var discord_urls_js_1 = require("../discord-urls.js");
var config_js_1 = require("../config.js");
var cli_runner_js_1 = require("../cli-runner.js");
var cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
var cli = (0, goke_1.goke)();
cli
    .command('project add [directory]', 'Create Discord channels for a project directory (replaces legacy add-project)')
    .alias('add-project')
    .option('-g, --guild <guildId>', 'Discord guild/server ID (auto-detects if bot is in only one server)')
    .option('-a, --app-id <appId>', 'Bot application ID (reads from database if available)')
    .action(function (directory, options) { return __awaiter(void 0, void 0, void 0, function () {
    var absolutePath, _a, botToken, appId, client, guild, guildId, foundGuild, existingChannelId, ch, error_1, firstGuild, fetched, firstOAuth2Guild, firstGuild, fetched, firstOAuth2Guild, existingChannels, _i, existingChannels_1, existingChannel, ch, error_2, error_3, _b, textChannelId, voiceChannelId, channelName, channelUrl;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                absolutePath = node_path_1.default.resolve(directory || '.');
                if (!node_fs_1.default.existsSync(absolutePath)) {
                    cliLogger.error("Directory does not exist: ".concat(absolutePath));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                // Initialize database
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                // Initialize database
                _d.sent();
                return [4 /*yield*/, (0, cli_runner_js_1.resolveBotCredentials)({
                        appIdOverride: options.appId,
                    })];
            case 2:
                _a = _d.sent(), botToken = _a.token, appId = _a.appId;
                if (!appId) {
                    cliLogger.error('App ID is required to create channels. Use --app-id or run `kimaki` first.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                cliLogger.log('Connecting to Discord...');
                return [4 /*yield*/, (0, discord_bot_js_1.createDiscordClient)()];
            case 3:
                client = _d.sent();
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        client.once(discord_js_1.Events.ClientReady, function () {
                            resolve();
                        });
                        client.once(discord_js_1.Events.Error, reject);
                        void client.login(botToken);
                    })];
            case 4:
                _d.sent();
                cliLogger.log('Finding guild...');
                if (!options.guild) return [3 /*break*/, 5];
                guildId = String(options.guild);
                foundGuild = client.guilds.cache.get(guildId);
                if (!foundGuild) {
                    cliLogger.log('Guild not found');
                    cliLogger.error("Guild not found: ".concat(guildId));
                    void client.destroy();
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                guild = foundGuild;
                return [3 /*break*/, 19];
            case 5: return [4 /*yield*/, (0, database_js_1.getDb)()];
            case 6: return [4 /*yield*/, (_d.sent()).query.channel_directories.findFirst({
                    where: { channel_type: 'text' },
                    orderBy: { created_at: 'desc' },
                    columns: { channel_id: true },
                }).then(function (row) { return row === null || row === void 0 ? void 0 : row.channel_id; })];
            case 7:
                existingChannelId = _d.sent();
                if (!existingChannelId) return [3 /*break*/, 15];
                _d.label = 8;
            case 8:
                _d.trys.push([8, 10, , 14]);
                return [4 /*yield*/, client.channels.fetch(existingChannelId)];
            case 9:
                ch = _d.sent();
                if (ch && !ch.isDMBased()) {
                    guild = ch.guild;
                }
                else {
                    throw new Error('Channel has no guild');
                }
                return [3 /*break*/, 14];
            case 10:
                error_1 = _d.sent();
                cliLogger.debug('Failed to fetch existing channel while selecting guild:', error_1 instanceof Error ? error_1.stack : String(error_1));
                firstGuild = client.guilds.cache.first();
                if (!!firstGuild) return [3 /*break*/, 13];
                return [4 /*yield*/, client.guilds.fetch()];
            case 11:
                fetched = _d.sent();
                firstOAuth2Guild = fetched.first();
                if (!firstOAuth2Guild) return [3 /*break*/, 13];
                return [4 /*yield*/, client.guilds.fetch(firstOAuth2Guild.id)];
            case 12:
                firstGuild = _d.sent();
                _d.label = 13;
            case 13:
                if (!firstGuild) {
                    cliLogger.log('No guild found');
                    cliLogger.error('No guild found. Add the bot to a server first.');
                    void client.destroy();
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                guild = firstGuild;
                return [3 /*break*/, 14];
            case 14: return [3 /*break*/, 19];
            case 15:
                firstGuild = client.guilds.cache.first();
                if (!!firstGuild) return [3 /*break*/, 18];
                return [4 /*yield*/, client.guilds.fetch()];
            case 16:
                fetched = _d.sent();
                firstOAuth2Guild = fetched.first();
                if (!firstOAuth2Guild) return [3 /*break*/, 18];
                return [4 /*yield*/, client.guilds.fetch(firstOAuth2Guild.id)];
            case 17:
                firstGuild = _d.sent();
                _d.label = 18;
            case 18:
                if (!firstGuild) {
                    cliLogger.log('No guild found');
                    cliLogger.error('No guild found. Add the bot to a server first.');
                    void client.destroy();
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                guild = firstGuild;
                _d.label = 19;
            case 19:
                // Check if channel already exists in this guild
                cliLogger.log('Checking for existing channel...');
                _d.label = 20;
            case 20:
                _d.trys.push([20, 28, , 29]);
                return [4 /*yield*/, (0, database_js_1.findChannelsByDirectory)({
                        directory: absolutePath,
                        channelType: 'text',
                    })];
            case 21:
                existingChannels = _d.sent();
                _i = 0, existingChannels_1 = existingChannels;
                _d.label = 22;
            case 22:
                if (!(_i < existingChannels_1.length)) return [3 /*break*/, 27];
                existingChannel = existingChannels_1[_i];
                _d.label = 23;
            case 23:
                _d.trys.push([23, 25, , 26]);
                return [4 /*yield*/, client.channels.fetch(existingChannel.channel_id)];
            case 24:
                ch = _d.sent();
                if (ch && !ch.isDMBased() && ch.guild.id === guild.id) {
                    void client.destroy();
                    cliLogger.error("Channel already exists for this directory in ".concat(guild.name, ". Channel ID: ").concat(existingChannel.channel_id));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [3 /*break*/, 26];
            case 25:
                error_2 = _d.sent();
                cliLogger.debug("Failed to fetch channel ".concat(existingChannel.channel_id, " while checking existing channels:"), error_2 instanceof Error ? error_2.stack : String(error_2));
                return [3 /*break*/, 26];
            case 26:
                _i++;
                return [3 /*break*/, 22];
            case 27: return [3 /*break*/, 29];
            case 28:
                error_3 = _d.sent();
                cliLogger.debug('Database lookup failed while checking existing channels:', error_3 instanceof Error ? error_3.stack : String(error_3));
                return [3 /*break*/, 29];
            case 29: return [4 /*yield*/, (0, discord_bot_js_1.createProjectChannels)({
                    guild: guild,
                    projectDirectory: absolutePath,
                    botName: (_c = client.user) === null || _c === void 0 ? void 0 : _c.username,
                })];
            case 30:
                _b = _d.sent(), textChannelId = _b.textChannelId, voiceChannelId = _b.voiceChannelId, channelName = _b.channelName;
                void client.destroy();
                if (textChannelId || voiceChannelId) {
                    cliLogger.log('Channels created!');
                }
                channelUrl = "https://discord.com/channels/".concat(guild.id, "/").concat(textChannelId);
                (0, prompts_1.note)("Created channels for project:\n\n\uD83D\uDCDD Text: #".concat(channelName, "\n\uD83D\uDD0A Voice: #").concat(channelName, "\n\uD83D\uDCC1 Directory: ").concat(absolutePath, "\n\nURL: ").concat(channelUrl), '✅ Success');
                cliLogger.log(channelUrl);
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
cli
    .command('project list', 'List all registered projects with their Discord channels')
    .option('--json', 'Output as JSON')
    .option('--prune', 'Remove stale entries whose Discord channel no longer exists')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var db, channels, botRow, rest, enriched, stale, _i, stale_1, ch, live, output, _a, enriched_1, ch, folderName, deletedTag, channelLabel;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _b.sent();
                return [4 /*yield*/, (0, database_js_1.getDb)()];
            case 2:
                db = _b.sent();
                return [4 /*yield*/, db.query.channel_directories.findMany({
                        where: { channel_type: 'text' },
                        orderBy: { created_at: 'desc' },
                    })];
            case 3:
                channels = _b.sent();
                if (channels.length === 0) {
                    cliLogger.log('No projects registered');
                    process.exit(0);
                }
                return [4 /*yield*/, (0, database_js_1.getBotTokenWithMode)()];
            case 4:
                botRow = _b.sent();
                rest = botRow ? (0, discord_urls_js_1.createDiscordRest)(botRow.token) : null;
                return [4 /*yield*/, Promise.all(channels.map(function (ch) { return __awaiter(void 0, void 0, void 0, function () {
                        var channelName, deleted, data, error_4, code, status_1, isUnknownChannel;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    channelName = '';
                                    deleted = false;
                                    if (!rest) return [3 /*break*/, 4];
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, rest.get(discord_js_1.Routes.channel(ch.channel_id))];
                                case 2:
                                    data = (_a.sent());
                                    channelName = data.name || '';
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_4 = _a.sent();
                                    code = error_4 instanceof Error ? Reflect.get(error_4, 'code') : undefined;
                                    status_1 = error_4 instanceof Error ? Reflect.get(error_4, 'status') : undefined;
                                    isUnknownChannel = code === 10003 || status_1 === 404;
                                    deleted = isUnknownChannel;
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/, __assign(__assign({}, ch), { channelName: channelName, deleted: deleted })];
                            }
                        });
                    }); }))
                    // Prune stale entries if requested
                ];
            case 5:
                enriched = _b.sent();
                if (!options.prune) return [3 /*break*/, 12];
                stale = enriched.filter(function (ch) {
                    return ch.deleted;
                });
                if (!(stale.length === 0)) return [3 /*break*/, 6];
                cliLogger.log('No stale channels to prune');
                return [3 /*break*/, 11];
            case 6:
                _i = 0, stale_1 = stale;
                _b.label = 7;
            case 7:
                if (!(_i < stale_1.length)) return [3 /*break*/, 10];
                ch = stale_1[_i];
                return [4 /*yield*/, (0, database_js_1.deleteChannelDirectoryById)(ch.channel_id)];
            case 8:
                _b.sent();
                cliLogger.log("Pruned stale channel ".concat(ch.channel_id, " (").concat(node_path_1.default.basename(ch.directory), ")"));
                _b.label = 9;
            case 9:
                _i++;
                return [3 /*break*/, 7];
            case 10:
                cliLogger.log("Pruned ".concat(stale.length, " stale channel(s)"));
                _b.label = 11;
            case 11:
                live = enriched.filter(function (ch) {
                    return !ch.deleted;
                });
                if (live.length === 0) {
                    cliLogger.log('No projects registered');
                    process.exit(0);
                }
                enriched.length = 0;
                enriched.push.apply(enriched, live);
                _b.label = 12;
            case 12:
                if (options.json) {
                    output = enriched.map(function (ch) { return ({
                        channel_id: ch.channel_id,
                        channel_name: ch.channelName,
                        directory: ch.directory,
                        folder_name: node_path_1.default.basename(ch.directory),
                        deleted: ch.deleted,
                    }); });
                    console.log(JSON.stringify(output, null, 2));
                    process.exit(0);
                }
                for (_a = 0, enriched_1 = enriched; _a < enriched_1.length; _a++) {
                    ch = enriched_1[_a];
                    folderName = node_path_1.default.basename(ch.directory);
                    deletedTag = ch.deleted ? ' (deleted from Discord)' : '';
                    channelLabel = ch.channelName ? "#".concat(ch.channelName) : ch.channel_id;
                    console.log("\n".concat(channelLabel).concat(deletedTag));
                    console.log("   Folder: ".concat(folderName));
                    console.log("   Directory: ".concat(ch.directory));
                    console.log("   Channel ID: ".concat(ch.channel_id));
                }
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
cli
    .command('project open-in-discord', 'Open the current project channel in Discord')
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var botRow, botToken, absolutePath, findChannelForPath, existingChannel, searchPath, parent_1, rest, channelData, channelUrl, openCmd;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, database_js_1.getBotTokenWithMode)()];
            case 2:
                botRow = _a.sent();
                if (!botRow) {
                    cliLogger.error('No bot configured. Run `kimaki` first.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                botToken = botRow.token;
                absolutePath = node_path_1.default.resolve('.');
                findChannelForPath = function (dirPath) { return __awaiter(void 0, void 0, void 0, function () {
                    var channels;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, (0, database_js_1.findChannelsByDirectory)({
                                    directory: dirPath,
                                    channelType: 'text',
                                })];
                            case 1:
                                channels = _a.sent();
                                return [2 /*return*/, channels[0]];
                        }
                    });
                }); };
                searchPath = absolutePath;
                _a.label = 3;
            case 3: return [4 /*yield*/, findChannelForPath(searchPath)];
            case 4:
                existingChannel = _a.sent();
                if (existingChannel) {
                    return [3 /*break*/, 6];
                }
                parent_1 = node_path_1.default.dirname(searchPath);
                if (parent_1 === searchPath) {
                    return [3 /*break*/, 6];
                }
                searchPath = parent_1;
                _a.label = 5;
            case 5:
                if (true) return [3 /*break*/, 3];
                _a.label = 6;
            case 6:
                if (!existingChannel) {
                    cliLogger.error("No project channel found for ".concat(absolutePath));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                rest = (0, discord_urls_js_1.createDiscordRest)(botToken);
                return [4 /*yield*/, rest.get(discord_js_1.Routes.channel(existingChannel.channel_id))];
            case 7:
                channelData = (_a.sent());
                channelUrl = "https://discord.com/channels/".concat(channelData.guild_id, "/").concat(channelData.id);
                cliLogger.log(channelUrl);
                // Open in browser if running in a TTY
                if (process.stdout.isTTY) {
                    if (process.platform === 'win32') {
                        (0, node_child_process_1.spawn)('cmd', ['/c', 'start', '', channelUrl], {
                            detached: true,
                            stdio: 'ignore',
                        }).unref();
                    }
                    else {
                        openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
                        (0, node_child_process_1.spawn)(openCmd, [channelUrl], {
                            detached: true,
                            stdio: 'ignore',
                        }).unref();
                    }
                }
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
cli
    .command('project create <name>', 'Create a new project folder with git and Discord channels')
    .option('-g, --guild <guildId>', 'Discord guild ID')
    .option('--projects-dir <path>', 'Directory where new projects are created (default: <data-dir>/projects)')
    .action(function (name, options) { return __awaiter(void 0, void 0, void 0, function () {
    var sanitizedName, botRow, botToken, projectsDir, projectDirectory, client, guild, found, first, _a, textChannelId, channelName, channelUrl;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                if (options.projectsDir) {
                    (0, config_js_1.setProjectsDir)(options.projectsDir);
                }
                sanitizedName = name
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '')
                    .slice(0, 100);
                if (!sanitizedName) {
                    cliLogger.error('Invalid project name');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _c.sent();
                return [4 /*yield*/, (0, database_js_1.getBotTokenWithMode)()];
            case 2:
                botRow = _c.sent();
                if (!botRow) {
                    cliLogger.error('No bot configured. Run `kimaki` first.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                botToken = botRow.token;
                projectsDir = (0, config_js_1.getProjectsDir)();
                projectDirectory = node_path_1.default.join(projectsDir, sanitizedName);
                if (!node_fs_1.default.existsSync(projectsDir)) {
                    node_fs_1.default.mkdirSync(projectsDir, { recursive: true });
                }
                if (node_fs_1.default.existsSync(projectDirectory)) {
                    cliLogger.error("Directory already exists: ".concat(projectDirectory));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
                cliLogger.log("Created: ".concat(projectDirectory));
                (0, node_child_process_1.execSync)('git init', { cwd: projectDirectory, stdio: 'pipe' });
                cliLogger.log('Initialized git');
                cliLogger.log('Connecting to Discord...');
                return [4 /*yield*/, (0, discord_bot_js_1.createDiscordClient)()];
            case 3:
                client = _c.sent();
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        client.once(discord_js_1.Events.ClientReady, function () {
                            resolve();
                        });
                        client.once(discord_js_1.Events.Error, reject);
                        client.login(botToken).catch(reject);
                    })];
            case 4:
                _c.sent();
                if (options.guild) {
                    found = client.guilds.cache.get(options.guild);
                    if (!found) {
                        cliLogger.error("Guild not found: ".concat(options.guild));
                        void client.destroy();
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                    guild = found;
                }
                else {
                    first = client.guilds.cache.first();
                    if (!first) {
                        cliLogger.error('No guild found. Add the bot to a server first.');
                        void client.destroy();
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                    guild = first;
                }
                return [4 /*yield*/, (0, discord_bot_js_1.createProjectChannels)({
                        guild: guild,
                        projectDirectory: projectDirectory,
                        botName: (_b = client.user) === null || _b === void 0 ? void 0 : _b.username,
                    })];
            case 5:
                _a = _c.sent(), textChannelId = _a.textChannelId, channelName = _a.channelName;
                void client.destroy();
                channelUrl = "https://discord.com/channels/".concat(guild.id, "/").concat(textChannelId);
                (0, prompts_1.note)("Created project: ".concat(sanitizedName, "\n\nDirectory: ").concat(projectDirectory, "\nChannel: #").concat(channelName, "\nURL: ").concat(channelUrl), '✅ Success');
                cliLogger.log(channelUrl);
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
// ── set-default-dir: Set default parent directory for a guild ──
cli
    .command('project set-default-dir [parentDirectory]', 'Set the default parent directory for a Discord server. New channels will automatically get subfolders in this directory.')
    .alias('set-default-dir')
    .option('-g, --guild <guildId>', 'Discord guild/server ID (auto-detects if bot is in only one server)')
    .option('-a, --app-id <appId>', 'Bot application ID (reads from database if available)')
    .option('-r, --remove', 'Remove the default directory for this guild')
    .action(function (parentDirectory, options) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, botToken, appId, client, guild, found, first, absolutePath;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: 
            // Initialize database
            return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                // Initialize database
                _b.sent();
                return [4 /*yield*/, (0, cli_runner_js_1.resolveBotCredentials)({
                        appIdOverride: options.appId,
                    })];
            case 2:
                _a = _b.sent(), botToken = _a.token, appId = _a.appId;
                if (!appId) {
                    cliLogger.error('App ID is required. Use --app-id or run `kimaki` first.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                cliLogger.log('Connecting to Discord...');
                return [4 /*yield*/, (0, discord_bot_js_1.createDiscordClient)()];
            case 3:
                client = _b.sent();
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        client.once(discord_js_1.Events.ClientReady, function () {
                            resolve();
                        });
                        client.once(discord_js_1.Events.Error, reject);
                        void client.login(botToken);
                    })];
            case 4:
                _b.sent();
                cliLogger.log('Finding guild...');
                if (options.guild) {
                    found = client.guilds.cache.get(options.guild);
                    if (!found) {
                        cliLogger.error("Guild not found: ".concat(options.guild));
                        void client.destroy();
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                    guild = found;
                }
                else {
                    first = client.guilds.cache.first();
                    if (!first) {
                        cliLogger.error('No guild found. Add the bot to a server first.');
                        void client.destroy();
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                    guild = first;
                }
                void client.destroy();
                if (!options.remove) return [3 /*break*/, 6];
                return [4 /*yield*/, (0, database_js_1.deleteGuildDefaultDirectory)(guild.id)];
            case 5:
                _b.sent();
                (0, prompts_1.note)("Removed default directory for guild **".concat(guild.name, "** (").concat(guild.id, ")"), '✅ Success');
                process.exit(0);
                _b.label = 6;
            case 6:
                if (!parentDirectory) {
                    cliLogger.error('Parent directory is required. Use --remove to remove the default.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                absolutePath = node_path_1.default.resolve(parentDirectory);
                if (!node_fs_1.default.existsSync(absolutePath)) {
                    // Create the directory if it doesn't exist
                    node_fs_1.default.mkdirSync(absolutePath, { recursive: true });
                    cliLogger.log("Created directory: ".concat(absolutePath));
                }
                return [4 /*yield*/, (0, database_js_1.setGuildDefaultDirectory)(guild.id, absolutePath)];
            case 7:
                _b.sent();
                (0, prompts_1.note)("Set default directory for **".concat(guild.name, "** (").concat(guild.id, "):\n\n").concat(absolutePath, "\n\nNew channels will automatically get project subfolders."), '✅ Success');
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
// ── get-default-dir: Get default parent directory for a guild ──
cli
    .command('project get-default-dir', 'Get the default parent directory for a Discord server.')
    .alias('get-default-dir')
    .option('-g, --guild <guildId>', 'Discord guild/server ID (auto-detects if bot is in only one server)')
    .option('-a, --app-id <appId>', 'Bot application ID (reads from database if available)')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var botToken, client, guild, found, first, guildDefaultDir;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: 
            // Initialize database
            return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                // Initialize database
                _a.sent();
                return [4 /*yield*/, (0, cli_runner_js_1.resolveBotCredentials)({
                        appIdOverride: options.appId,
                    })];
            case 2:
                botToken = (_a.sent()).token;
                cliLogger.log('Connecting to Discord...');
                return [4 /*yield*/, (0, discord_bot_js_1.createDiscordClient)()];
            case 3:
                client = _a.sent();
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        client.once(discord_js_1.Events.ClientReady, function () {
                            resolve();
                        });
                        client.once(discord_js_1.Events.Error, reject);
                        void client.login(botToken);
                    })];
            case 4:
                _a.sent();
                cliLogger.log('Finding guild...');
                if (options.guild) {
                    found = client.guilds.cache.get(options.guild);
                    if (!found) {
                        cliLogger.error("Guild not found: ".concat(options.guild));
                        void client.destroy();
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                    guild = found;
                }
                else {
                    first = client.guilds.cache.first();
                    if (!first) {
                        cliLogger.error('No guild found. Add the bot to a server first.');
                        void client.destroy();
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                    guild = first;
                }
                void client.destroy();
                return [4 /*yield*/, (0, database_js_1.getGuildDefaultDirectory)(guild.id)];
            case 5:
                guildDefaultDir = _a.sent();
                if (!guildDefaultDir) {
                    (0, prompts_1.note)("No default directory set for **".concat(guild.name, "** (").concat(guild.id, ")"), 'ℹ️  Not Configured');
                    process.exit(0);
                }
                (0, prompts_1.note)("Default directory for **".concat(guild.name, "** (").concat(guild.id, "):\n\n").concat(guildDefaultDir.parent_directory), '✅ Configured');
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
exports.default = cli;
