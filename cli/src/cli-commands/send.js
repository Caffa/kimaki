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
// Terminal send command for creating Discord threads and scheduling prompts.
var goke_1 = require("goke");
var zod_1 = require("zod");
var prompts_1 = require("@clack/prompts");
var yaml_1 = require("yaml");
var discord_js_1 = require("discord.js");
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var logger_js_1 = require("../logger.js");
var discord_bot_js_1 = require("../discord-bot.js");
var database_js_1 = require("../database.js");
var new_worktree_js_1 = require("../commands/new-worktree.js");
var merge_worktree_js_1 = require("../commands/merge-worktree.js");
var discord_urls_js_1 = require("../discord-urls.js");
var discord_utils_js_1 = require("../discord-utils.js");
var worktrees_js_1 = require("../worktrees.js");
var task_schedule_js_1 = require("../task-schedule.js");
var cli_runner_js_1 = require("../cli-runner.js");
var cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
var cli = (0, goke_1.goke)();
cli
    .command('send', 'Send a message to a Discord channel/thread. Default creates a thread; use --thread/--session to continue existing.')
    .alias('start-session') // backwards compatibility
    .option('-c, --channel <channelId>', 'Discord channel ID')
    .option('-d, --project <path>', 'Project directory (alternative to --channel)')
    .option('-p, --prompt <prompt>', 'Message content')
    .option('-n, --name [name]', 'Thread name (optional, defaults to prompt preview)')
    .option('-a, --app-id [appId]', 'Bot application ID (required if no local database)')
    .option('--notify-only', 'Create notification thread without starting AI session')
    .option('--worktree [name]', 'Create git worktree for session (name optional, derives from thread name)')
    .option('--cwd <path>', 'Start session in an existing project subfolder or git worktree directory')
    .option('-u, --user <user>', 'Discord user ID, mention, or username to add to thread')
    .option('--agent <agent>', 'Agent to use for the session')
    .option('--model <model>', 'Model to use (format: provider/model)')
    .option('--permission <rule>', zod_1.z.array(zod_1.z.string()).describe('Session permission rule (repeatable). Format: "tool:action" or "tool:pattern:action". ' +
    'Actions: allow, deny, ask. Examples: --permission "bash:deny" --permission "edit:deny"'))
    .option('--injection-guard <pattern>', zod_1.z.array(zod_1.z.string()).describe('Injection guard scan pattern (repeatable). Enables prompt injection detection for this session. ' +
    'Format: "tool:argsGlob". Examples: --injection-guard "bash:*" --injection-guard "webfetch:*"'))
    .option('--send-at <schedule>', 'Schedule send for future (UTC ISO date/time ending in Z, or cron expression)')
    .option('--thread <threadId>', 'Post prompt to an existing thread')
    .option('--session <sessionId>', 'Post prompt to thread mapped to an existing session')
    .option('--wait', 'Wait for session to complete, then print session text to stdout')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var optionAppId, channelId, prompt_1, notifyOnly, threadId_1, sessionId_1, name_1, projectPath, sendAt_1, existingThreadMode, resolvedProjectPath, parsedSchedule, incompatibleFlags, _a, botToken_1, appId, absolutePath, findChannelForPath, existingChannel, searchPath, client_1, guild, textChannelId, e_1, rest, targetThreadId, threadData_1, channelConfig_1, payload, taskId, threadUrl_1, threadPromptMarker, promptEmbed, prefixedPrompt, threadUrl_2, waitAndOutputSession, channelData, channelConfig, projectDirectory, resolvedCwd, cwdResult, resolvedUser, cleanPrompt, baseThreadName, worktreeName, threadName, payload, taskId, channelUrl, embedMarker, autoStartEmbed, starterMessage, threadData, threadUrl, worktreeNote, successMessage, waitAndOutputSession, error_1;
    var _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return __generator(this, function (_l) {
        switch (_l.label) {
            case 0:
                _l.trys.push([0, 39, , 40]);
                optionAppId = options.appId || undefined;
                channelId = options.channel, prompt_1 = options.prompt, notifyOnly = options.notifyOnly, threadId_1 = options.thread, sessionId_1 = options.session;
                name_1 = options.name || undefined;
                projectPath = options.project;
                sendAt_1 = options.sendAt;
                existingThreadMode = Boolean(threadId_1 || sessionId_1);
                if (threadId_1 && sessionId_1) {
                    cliLogger.error('Use either --thread or --session, not both');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (existingThreadMode && (channelId || projectPath)) {
                    cliLogger.error('Cannot combine --thread/--session with --channel/--project');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                resolvedProjectPath = existingThreadMode
                    ? undefined
                    : projectPath || (!channelId ? '.' : undefined);
                if (!prompt_1) {
                    cliLogger.error('Prompt is required. Use --prompt <prompt>');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (sendAt_1) {
                    if (options.wait) {
                        cliLogger.error('Cannot use --wait with --send-at');
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                    if (prompt_1.length > 1900) {
                        cliLogger.error('--send-at currently supports prompts up to 1900 characters');
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                }
                parsedSchedule = (function () {
                    if (!sendAt_1) {
                        return null;
                    }
                    // Cron expressions use UTC so the schedule is consistent regardless of
                    // which machine runs the bot. The system message tells the model to use UTC.
                    return (0, task_schedule_js_1.parseSendAtValue)({
                        value: sendAt_1,
                        now: new Date(),
                        timezone: 'UTC',
                    });
                })();
                if (parsedSchedule instanceof Error) {
                    cliLogger.error(parsedSchedule.message);
                    if (parsedSchedule.cause instanceof Error) {
                        cliLogger.error(parsedSchedule.cause.message);
                    }
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (!existingThreadMode && options.worktree && notifyOnly) {
                    cliLogger.error('Cannot use --worktree with --notify-only');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (options.cwd && options.worktree) {
                    cliLogger.error('Cannot use --cwd with --worktree');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (options.cwd && notifyOnly) {
                    cliLogger.error('Cannot use --cwd with --notify-only');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (options.wait && notifyOnly) {
                    cliLogger.error('Cannot use --wait with --notify-only');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (existingThreadMode) {
                    incompatibleFlags = [];
                    if (notifyOnly) {
                        incompatibleFlags.push('--notify-only');
                    }
                    if (options.worktree) {
                        incompatibleFlags.push('--worktree');
                    }
                    if (options.cwd) {
                        incompatibleFlags.push('--cwd');
                    }
                    if (name_1) {
                        incompatibleFlags.push('--name');
                    }
                    if (options.user) {
                        incompatibleFlags.push('--user');
                    }
                    if (!sendAt_1 && options.agent) {
                        incompatibleFlags.push('--agent');
                    }
                    if (!sendAt_1 && options.model) {
                        incompatibleFlags.push('--model');
                    }
                    if (incompatibleFlags.length > 0) {
                        cliLogger.error("Incompatible options with --thread/--session: ".concat(incompatibleFlags.join(', ')));
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                }
                // Initialize database first
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                // Initialize database first
                _l.sent();
                return [4 /*yield*/, (0, cli_runner_js_1.resolveBotCredentials)({
                        appIdOverride: optionAppId,
                    })
                    // If --project provided (or defaulting to cwd), resolve to channel ID
                ];
            case 2:
                _a = _l.sent(), botToken_1 = _a.token, appId = _a.appId;
                if (!resolvedProjectPath) return [3 /*break*/, 14];
                absolutePath = node_path_1.default.resolve(resolvedProjectPath);
                if (!node_fs_1.default.existsSync(absolutePath)) {
                    cliLogger.error("Directory does not exist: ".concat(absolutePath));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                cliLogger.log('Looking up channel for project...');
                _l.label = 3;
            case 3:
                _l.trys.push([3, 13, , 14]);
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
                existingChannel = void 0;
                searchPath = absolutePath;
                _l.label = 4;
            case 4:
                if (!(searchPath !== node_path_1.default.dirname(searchPath))) return [3 /*break*/, 6];
                return [4 /*yield*/, findChannelForPath(searchPath)];
            case 5:
                existingChannel = _l.sent();
                if (existingChannel)
                    return [3 /*break*/, 6];
                searchPath = node_path_1.default.dirname(searchPath);
                return [3 /*break*/, 4];
            case 6:
                if (!existingChannel) return [3 /*break*/, 7];
                channelId = existingChannel.channel_id;
                if (existingChannel.directory !== absolutePath) {
                    cliLogger.log("Found parent project channel: ".concat(existingChannel.directory));
                }
                else {
                    cliLogger.log("Found existing channel: ".concat(channelId));
                }
                return [3 /*break*/, 12];
            case 7:
                // Need to create a new channel
                cliLogger.log('Creating new channel...');
                if (!appId) {
                    cliLogger.log('Missing app ID');
                    cliLogger.error('App ID is required to create channels. Use --app-id or run `kimaki` first.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, (0, discord_bot_js_1.createDiscordClient)()];
            case 8:
                client_1 = _l.sent();
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        client_1.once(discord_js_1.Events.ClientReady, function () {
                            resolve();
                        });
                        client_1.once(discord_js_1.Events.Error, reject);
                        void client_1.login(botToken_1);
                    })
                    // Get guild from existing channels or first available
                ];
            case 9:
                _l.sent();
                return [4 /*yield*/, (function () { return __awaiter(void 0, void 0, void 0, function () {
                        var existingChannelId, ch, error_2, firstGuild, fetched, firstOAuth2Guild;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, database_js_1.getDb)()];
                                case 1: return [4 /*yield*/, (_a.sent()).query.channel_directories.findFirst({
                                        where: { channel_type: 'text' },
                                        orderBy: { created_at: 'desc' },
                                        columns: { channel_id: true },
                                    }).then(function (row) { return row === null || row === void 0 ? void 0 : row.channel_id; })];
                                case 2:
                                    existingChannelId = _a.sent();
                                    if (!existingChannelId) return [3 /*break*/, 6];
                                    _a.label = 3;
                                case 3:
                                    _a.trys.push([3, 5, , 6]);
                                    return [4 /*yield*/, client_1.channels.fetch(existingChannelId)];
                                case 4:
                                    ch = _a.sent();
                                    if (ch && !ch.isDMBased()) {
                                        return [2 /*return*/, ch.guild];
                                    }
                                    return [3 /*break*/, 6];
                                case 5:
                                    error_2 = _a.sent();
                                    cliLogger.debug('Failed to fetch existing channel while selecting guild:', error_2 instanceof Error ? error_2.stack : String(error_2));
                                    return [3 /*break*/, 6];
                                case 6:
                                    firstGuild = client_1.guilds.cache.first();
                                    if (!!firstGuild) return [3 /*break*/, 9];
                                    return [4 /*yield*/, client_1.guilds.fetch()];
                                case 7:
                                    fetched = _a.sent();
                                    firstOAuth2Guild = fetched.first();
                                    if (!firstOAuth2Guild) return [3 /*break*/, 9];
                                    return [4 /*yield*/, client_1.guilds.fetch(firstOAuth2Guild.id)];
                                case 8:
                                    firstGuild = _a.sent();
                                    _a.label = 9;
                                case 9:
                                    if (!firstGuild) {
                                        throw new Error('No guild found. Add the bot to a server first.');
                                    }
                                    return [2 /*return*/, firstGuild];
                            }
                        });
                    }); })()];
            case 10:
                guild = _l.sent();
                return [4 /*yield*/, (0, discord_bot_js_1.createProjectChannels)({
                        guild: guild,
                        projectDirectory: absolutePath,
                        botName: (_b = client_1.user) === null || _b === void 0 ? void 0 : _b.username,
                    })];
            case 11:
                textChannelId = (_l.sent()).textChannelId;
                channelId = textChannelId;
                cliLogger.log("Created channel: ".concat(channelId));
                void client_1.destroy();
                _l.label = 12;
            case 12: return [3 /*break*/, 14];
            case 13:
                e_1 = _l.sent();
                cliLogger.log('Failed to resolve project');
                throw e_1;
            case 14:
                rest = (0, discord_urls_js_1.createDiscordRest)(botToken_1);
                if (!existingThreadMode) return [3 /*break*/, 24];
                return [4 /*yield*/, (function () { return __awaiter(void 0, void 0, void 0, function () {
                        var resolvedThreadId;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (threadId_1) {
                                        return [2 /*return*/, threadId_1];
                                    }
                                    if (!sessionId_1) {
                                        throw new Error('Thread ID not resolved');
                                    }
                                    return [4 /*yield*/, (0, database_js_1.getThreadIdBySessionId)(sessionId_1)];
                                case 1:
                                    resolvedThreadId = _a.sent();
                                    if (!resolvedThreadId) {
                                        throw new Error("No Discord thread found for session: ".concat(sessionId_1));
                                    }
                                    return [2 /*return*/, resolvedThreadId];
                            }
                        });
                    }); })()];
            case 15:
                targetThreadId = _l.sent();
                return [4 /*yield*/, rest.get(discord_js_1.Routes.channel(targetThreadId))];
            case 16:
                threadData_1 = (_l.sent());
                if (!(0, cli_runner_js_1.isThreadChannelType)(threadData_1.type)) {
                    throw new Error("Channel is not a thread: ".concat(targetThreadId));
                }
                if (!threadData_1.parent_id) {
                    throw new Error("Thread has no parent channel: ".concat(targetThreadId));
                }
                return [4 /*yield*/, (0, discord_bot_js_1.getChannelDirectory)(threadData_1.parent_id)];
            case 17:
                channelConfig_1 = _l.sent();
                if (!channelConfig_1) {
                    throw new Error('Thread parent channel is not configured with a project directory');
                }
                if (!parsedSchedule) return [3 /*break*/, 19];
                payload = {
                    kind: 'thread',
                    threadId: targetThreadId,
                    prompt: prompt_1,
                    agent: options.agent || null,
                    model: options.model || null,
                    username: null,
                    userId: null,
                    permissions: ((_c = options.permission) === null || _c === void 0 ? void 0 : _c.length) ? options.permission : null,
                    injectionGuardPatterns: ((_d = options.injectionGuard) === null || _d === void 0 ? void 0 : _d.length) ? options.injectionGuard : null,
                };
                return [4 /*yield*/, (0, database_js_1.createScheduledTask)({
                        scheduleKind: parsedSchedule.scheduleKind,
                        runAt: parsedSchedule.runAt,
                        cronExpr: parsedSchedule.cronExpr,
                        timezone: parsedSchedule.timezone,
                        nextRunAt: parsedSchedule.nextRunAt,
                        payloadJson: (0, task_schedule_js_1.serializeScheduledTaskPayload)(payload),
                        promptPreview: (0, task_schedule_js_1.getPromptPreview)(prompt_1),
                        channelId: threadData_1.parent_id,
                        threadId: targetThreadId,
                        sessionId: sessionId_1 || undefined,
                        projectDirectory: channelConfig_1.directory,
                    })];
            case 18:
                taskId = _l.sent();
                threadUrl_1 = "https://discord.com/channels/".concat(threadData_1.guild_id, "/").concat(threadData_1.id);
                (0, prompts_1.note)("Task ID: ".concat(taskId, "\nTarget thread: ").concat(threadData_1.name, "\nSchedule: ").concat((0, cli_runner_js_1.formatTaskScheduleLine)(parsedSchedule), "\n\nURL: ").concat(threadUrl_1), '✅ Task Scheduled');
                cliLogger.log(threadUrl_1);
                process.exit(0);
                _l.label = 19;
            case 19:
                threadPromptMarker = __assign(__assign({ start: true }, (((_e = options.permission) === null || _e === void 0 ? void 0 : _e.length) ? { permissions: options.permission } : {})), (((_f = options.injectionGuard) === null || _f === void 0 ? void 0 : _f.length) ? { injectionGuardPatterns: options.injectionGuard } : {}));
                promptEmbed = [
                    {
                        color: 0x2b2d31,
                        footer: { text: yaml_1.default.stringify(threadPromptMarker) },
                    },
                ];
                prefixedPrompt = "\u00BB **kimaki-cli:**\n".concat(prompt_1);
                return [4 /*yield*/, (0, cli_runner_js_1.sendDiscordMessageWithOptionalAttachment)({
                        channelId: targetThreadId,
                        prompt: prefixedPrompt,
                        botToken: botToken_1,
                        embeds: promptEmbed,
                        rest: rest,
                    })];
            case 20:
                _l.sent();
                threadUrl_2 = "https://discord.com/channels/".concat(threadData_1.guild_id, "/").concat(threadData_1.id);
                (0, prompts_1.note)("Prompt sent to thread: ".concat(threadData_1.name, "\n\nURL: ").concat(threadUrl_2), '✅ Message Sent');
                cliLogger.log(threadUrl_2);
                if (!options.wait) return [3 /*break*/, 23];
                return [4 /*yield*/, Promise.resolve().then(function () { return require('../wait-session.js'); })];
            case 21:
                waitAndOutputSession = (_l.sent()).waitAndOutputSession;
                return [4 /*yield*/, waitAndOutputSession({
                        threadId: targetThreadId,
                        projectDirectory: channelConfig_1.directory,
                    })];
            case 22:
                _l.sent();
                _l.label = 23;
            case 23:
                process.exit(0);
                _l.label = 24;
            case 24:
                cliLogger.log('Fetching channel info...');
                if (!channelId) {
                    throw new Error('Channel ID not resolved');
                }
                return [4 /*yield*/, rest.get(discord_js_1.Routes.channel(channelId))];
            case 25:
                channelData = (_l.sent());
                return [4 /*yield*/, (0, discord_bot_js_1.getChannelDirectory)(channelData.id)];
            case 26:
                channelConfig = _l.sent();
                if (!channelConfig) {
                    cliLogger.log('Channel not configured');
                    throw new Error("Channel #".concat(channelData.name, " is not configured with a project directory. Run the bot first to sync channel data."));
                }
                projectDirectory = channelConfig.directory;
                resolvedCwd = void 0;
                if (!options.cwd) return [3 /*break*/, 28];
                return [4 /*yield*/, (0, worktrees_js_1.resolveSessionWorkingDirectory)({
                        projectDirectory: projectDirectory,
                        candidatePath: options.cwd,
                    })];
            case 27:
                cwdResult = _l.sent();
                if (cwdResult instanceof Error) {
                    cliLogger.error(cwdResult.message);
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                resolvedCwd = cwdResult.directory;
                _l.label = 28;
            case 28: return [4 /*yield*/, (0, cli_runner_js_1.resolveDiscordUserOption)({
                    user: options.user,
                    guildId: channelData.guild_id,
                    rest: rest,
                })];
            case 29:
                resolvedUser = _l.sent();
                if (resolvedUser instanceof Error) {
                    cliLogger.error(resolvedUser.message);
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                cliLogger.log('Creating starter message...');
                cleanPrompt = (0, discord_utils_js_1.stripMentions)(prompt_1);
                baseThreadName = name_1 ||
                    (cleanPrompt.length > 80
                        ? cleanPrompt.slice(0, 77) + '...'
                        : cleanPrompt);
                worktreeName = options.worktree
                    ? typeof options.worktree === 'string'
                        ? (0, new_worktree_js_1.formatWorktreeName)(options.worktree)
                        : (0, new_worktree_js_1.formatAutoWorktreeName)(baseThreadName)
                    : undefined;
                threadName = worktreeName
                    ? "".concat(merge_worktree_js_1.WORKTREE_PREFIX).concat(baseThreadName)
                    : baseThreadName;
                if (!parsedSchedule) return [3 /*break*/, 31];
                payload = {
                    kind: 'channel',
                    channelId: channelId,
                    prompt: prompt_1,
                    name: name_1 || null,
                    notifyOnly: Boolean(notifyOnly),
                    worktreeName: worktreeName || null,
                    cwd: resolvedCwd || null,
                    agent: options.agent || null,
                    model: options.model || null,
                    username: (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.username) || null,
                    userId: (resolvedUser === null || resolvedUser === void 0 ? void 0 : resolvedUser.id) || null,
                    permissions: ((_g = options.permission) === null || _g === void 0 ? void 0 : _g.length) ? options.permission : null,
                    injectionGuardPatterns: ((_h = options.injectionGuard) === null || _h === void 0 ? void 0 : _h.length) ? options.injectionGuard : null,
                };
                return [4 /*yield*/, (0, database_js_1.createScheduledTask)({
                        scheduleKind: parsedSchedule.scheduleKind,
                        runAt: parsedSchedule.runAt,
                        cronExpr: parsedSchedule.cronExpr,
                        timezone: parsedSchedule.timezone,
                        nextRunAt: parsedSchedule.nextRunAt,
                        payloadJson: (0, task_schedule_js_1.serializeScheduledTaskPayload)(payload),
                        promptPreview: (0, task_schedule_js_1.getPromptPreview)(prompt_1),
                        channelId: channelId,
                        projectDirectory: projectDirectory,
                    })];
            case 30:
                taskId = _l.sent();
                channelUrl = "https://discord.com/channels/".concat(channelData.guild_id, "/").concat(channelId);
                (0, prompts_1.note)("Task ID: ".concat(taskId, "\nTarget channel: #").concat(channelData.name, "\nSchedule: ").concat((0, cli_runner_js_1.formatTaskScheduleLine)(parsedSchedule), "\n\nURL: ").concat(channelUrl), '✅ Task Scheduled');
                cliLogger.log(channelUrl);
                process.exit(0);
                _l.label = 31;
            case 31:
                embedMarker = notifyOnly
                    ? undefined
                    : __assign(__assign(__assign(__assign(__assign(__assign(__assign({ start: true }, (worktreeName && { worktree: worktreeName })), (resolvedCwd && { cwd: resolvedCwd })), (resolvedUser && {
                        username: resolvedUser.username,
                        userId: resolvedUser.id,
                    })), (options.agent && { agent: options.agent })), (options.model && { model: options.model })), (((_j = options.permission) === null || _j === void 0 ? void 0 : _j.length) && { permissions: options.permission })), (((_k = options.injectionGuard) === null || _k === void 0 ? void 0 : _k.length) && { injectionGuardPatterns: options.injectionGuard }));
                autoStartEmbed = embedMarker
                    ? [{ color: 0x2b2d31, footer: { text: yaml_1.default.stringify(embedMarker) } }]
                    : undefined;
                return [4 /*yield*/, (0, cli_runner_js_1.sendDiscordMessageWithOptionalAttachment)({
                        channelId: channelId,
                        prompt: prompt_1,
                        botToken: botToken_1,
                        embeds: autoStartEmbed,
                        rest: rest,
                    })];
            case 32:
                starterMessage = _l.sent();
                cliLogger.log('Creating thread...');
                return [4 /*yield*/, rest.post(discord_js_1.Routes.threads(channelId, starterMessage.id), {
                        body: {
                            name: threadName.slice(0, 100),
                            auto_archive_duration: 1440, // 1 day
                        },
                    })];
            case 33:
                threadData = (_l.sent());
                cliLogger.log('Thread created!');
                if (!resolvedUser) return [3 /*break*/, 35];
                cliLogger.log("Adding user ".concat(resolvedUser.username, " to thread..."));
                return [4 /*yield*/, rest.put(discord_js_1.Routes.threadMembers(threadData.id, resolvedUser.id))];
            case 34:
                _l.sent();
                _l.label = 35;
            case 35:
                threadUrl = "https://discord.com/channels/".concat(channelData.guild_id, "/").concat(threadData.id);
                worktreeNote = worktreeName
                    ? "\nWorktree: ".concat(worktreeName, " (will be created by bot)")
                    : resolvedCwd
                        ? "\nWorking directory: ".concat(resolvedCwd)
                        : '';
                successMessage = notifyOnly
                    ? "Thread: ".concat(threadData.name, "\nDirectory: ").concat(projectDirectory, "\n\nNotification created. Reply to start a session.\n\nURL: ").concat(threadUrl)
                    : "Thread: ".concat(threadData.name, "\nDirectory: ").concat(projectDirectory).concat(worktreeNote, "\n\nThe running bot will pick this up and start the session.\n\nURL: ").concat(threadUrl);
                (0, prompts_1.note)(successMessage, '✅ Thread Created');
                cliLogger.log(threadUrl);
                if (!options.wait) return [3 /*break*/, 38];
                return [4 /*yield*/, Promise.resolve().then(function () { return require('../wait-session.js'); })];
            case 36:
                waitAndOutputSession = (_l.sent()).waitAndOutputSession;
                return [4 /*yield*/, waitAndOutputSession({
                        threadId: threadData.id,
                        projectDirectory: projectDirectory,
                    })];
            case 37:
                _l.sent();
                _l.label = 38;
            case 38:
                process.exit(0);
                return [3 /*break*/, 40];
            case 39:
                error_1 = _l.sent();
                cliLogger.error('Error:', error_1 instanceof Error ? error_1.stack : String(error_1));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 40];
            case 40: return [2 /*return*/];
        }
    });
}); });
exports.default = cli;
