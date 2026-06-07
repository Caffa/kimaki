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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
// Session inspection and archival terminal commands.
var goke_1 = require("goke");
var prompts_1 = require("@clack/prompts");
var errore = require("errore");
var discord_js_1 = require("discord.js");
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var logger_js_1 = require("../logger.js");
var discord_bot_js_1 = require("../discord-bot.js");
var database_js_1 = require("../database.js");
var markdown_js_1 = require("../markdown.js");
var session_search_js_1 = require("../session-search.js");
var opencode_session_event_log_js_1 = require("../session-handler/opencode-session-event-log.js");
var discord_urls_js_1 = require("../discord-urls.js");
var discord_utils_js_1 = require("../discord-utils.js");
var cli_runner_js_1 = require("../cli-runner.js");
var cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
var cli = (0, goke_1.goke)();
cli
    .command('session list', 'List all OpenCode sessions, marking which were started via Kimaki')
    .option('--project <path>', 'Project directory to list sessions for (defaults to cwd)')
    .option('--json', 'Output as JSON')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var projectDirectory, getClient, sessionsResponse, sessions, db, threadSessions, sessionToThread_1, sessionStartSources_1, scheduleModeLabel_1, output, _i, sessions_1, session, threadId, startSource, source, startedBy, updatedAt, threadInfo, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                projectDirectory = node_path_1.default.resolve(options.project || '.');
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                cliLogger.log('Connecting to OpenCode server...');
                return [4 /*yield*/, (0, discord_bot_js_1.initializeOpencodeForDirectory)(projectDirectory)];
            case 2:
                getClient = _a.sent();
                if (getClient instanceof Error) {
                    cliLogger.error('Failed to connect to OpenCode:', getClient.message);
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, getClient().session.list()];
            case 3:
                sessionsResponse = _a.sent();
                sessions = sessionsResponse.data || [];
                if (sessions.length === 0) {
                    cliLogger.log('No sessions found');
                    process.exit(0);
                }
                return [4 /*yield*/, (0, database_js_1.getDb)()];
            case 4:
                db = _a.sent();
                return [4 /*yield*/, db.query.thread_sessions.findMany({
                        columns: { thread_id: true, session_id: true },
                    })];
            case 5:
                threadSessions = _a.sent();
                sessionToThread_1 = new Map(threadSessions
                    .filter(function (row) { return row.session_id !== ''; })
                    .map(function (row) { return [row.session_id, row.thread_id]; }));
                return [4 /*yield*/, (0, database_js_1.getSessionStartSourcesBySessionIds)(sessions.map(function (session) { return session.id; }))];
            case 6:
                sessionStartSources_1 = _a.sent();
                scheduleModeLabel_1 = function (_a) {
                    var scheduleKind = _a.scheduleKind;
                    if (scheduleKind === 'at') {
                        return 'delay';
                    }
                    return 'cron';
                };
                if (options.json) {
                    output = sessions.map(function (session) {
                        var startSource = sessionStartSources_1.get(session.id);
                        var startedBy = startSource
                            ? "scheduled-".concat(scheduleModeLabel_1({ scheduleKind: startSource.schedule_kind }))
                            : null;
                        return {
                            id: session.id,
                            title: session.title || 'Untitled Session',
                            directory: session.directory,
                            updated: new Date(session.time.updated).toISOString(),
                            source: sessionToThread_1.has(session.id) ? 'kimaki' : 'opencode',
                            threadId: sessionToThread_1.get(session.id) || null,
                            startedBy: startedBy,
                            scheduledTaskId: (startSource === null || startSource === void 0 ? void 0 : startSource.scheduled_task_id) || null,
                        };
                    });
                    console.log(JSON.stringify(output, null, 2));
                    process.exit(0);
                }
                for (_i = 0, sessions_1 = sessions; _i < sessions_1.length; _i++) {
                    session = sessions_1[_i];
                    threadId = sessionToThread_1.get(session.id);
                    startSource = sessionStartSources_1.get(session.id);
                    source = threadId ? '(kimaki)' : '(opencode)';
                    startedBy = startSource
                        ? " | started-by: ".concat(scheduleModeLabel_1({ scheduleKind: startSource.schedule_kind })).concat(startSource.scheduled_task_id ? " (#".concat(startSource.scheduled_task_id, ")") : '')
                        : '';
                    updatedAt = new Date(session.time.updated).toISOString();
                    threadInfo = threadId ? " | thread: ".concat(threadId) : '';
                    console.log("".concat(session.id, " | ").concat(session.title || 'Untitled Session', " | ").concat(session.directory, " | ").concat(updatedAt, " | ").concat(source).concat(threadInfo).concat(startedBy));
                }
                process.exit(0);
                return [3 /*break*/, 8];
            case 7:
                error_1 = _a.sent();
                cliLogger.error('Error:', error_1 instanceof Error ? error_1.stack : String(error_1));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); });
cli
    .command('session read <sessionId>', 'Read a session conversation as markdown (pipe to file to grep)')
    .option('--project <path>', 'Project directory (defaults to cwd)')
    .action(function (sessionId, options) { return __awaiter(void 0, void 0, void 0, function () {
    var projectDirectory_1, getClient, markdown, result, projectsResponse, projects, otherProjects, _i, otherProjects_1, project, dir, otherClient, otherMarkdown, otherResult, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 10, , 11]);
                projectDirectory_1 = node_path_1.default.resolve(options.project || '.');
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                cliLogger.log('Connecting to OpenCode server...');
                return [4 /*yield*/, (0, discord_bot_js_1.initializeOpencodeForDirectory)(projectDirectory_1)];
            case 2:
                getClient = _a.sent();
                if (getClient instanceof Error) {
                    cliLogger.error('Failed to connect to OpenCode:', getClient.message);
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                markdown = new markdown_js_1.ShareMarkdown(getClient());
                return [4 /*yield*/, markdown.generate({ sessionID: sessionId })];
            case 3:
                result = _a.sent();
                if (!(result instanceof Error)) {
                    process.stdout.write(result);
                    process.exit(0);
                }
                // Session not found in current project, search across all projects.
                // project.list() returns all known projects globally from any OpenCode server,
                // but session.list/get are scoped to the server's own project. So we try each.
                cliLogger.log('Session not in current project, searching all projects...');
                return [4 /*yield*/, getClient().project.list()];
            case 4:
                projectsResponse = _a.sent();
                projects = projectsResponse.data || [];
                otherProjects = projects
                    .filter(function (p) { return node_path_1.default.resolve(p.worktree) !== projectDirectory_1; })
                    .filter(function (p) {
                    try {
                        node_fs_1.default.accessSync(p.worktree, node_fs_1.default.constants.R_OK);
                        return true;
                    }
                    catch (_a) {
                        return false;
                    }
                })
                    // Sort by most recently created first to find sessions faster
                    .sort(function (a, b) { return b.time.created - a.time.created; });
                _i = 0, otherProjects_1 = otherProjects;
                _a.label = 5;
            case 5:
                if (!(_i < otherProjects_1.length)) return [3 /*break*/, 9];
                project = otherProjects_1[_i];
                dir = project.worktree;
                cliLogger.log("Trying project: ".concat(dir));
                return [4 /*yield*/, (0, discord_bot_js_1.initializeOpencodeForDirectory)(dir)];
            case 6:
                otherClient = _a.sent();
                if (otherClient instanceof Error) {
                    return [3 /*break*/, 8];
                }
                otherMarkdown = new markdown_js_1.ShareMarkdown(otherClient());
                return [4 /*yield*/, otherMarkdown.generate({
                        sessionID: sessionId,
                    })];
            case 7:
                otherResult = _a.sent();
                if (!(otherResult instanceof Error)) {
                    process.stdout.write(otherResult);
                    process.exit(0);
                }
                _a.label = 8;
            case 8:
                _i++;
                return [3 /*break*/, 5];
            case 9:
                cliLogger.error("Session ".concat(sessionId, " not found in any project"));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 11];
            case 10:
                error_2 = _a.sent();
                cliLogger.error('Error:', error_2 instanceof Error ? error_2.stack : String(error_2));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
cli
    .command('session search <query>', 'Search past sessions for text or /regex/flags in the selected project')
    .option('--project <path>', 'Project directory (defaults to cwd)')
    .option('--channel <channelId>', 'Resolve project from a Discord channel ID')
    .option('--limit <n>', 'Maximum matched sessions to return (default: 20)')
    .option('--json', 'Output as JSON')
    .action(function (query, options) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, projectDirectoryResult, projectDirectory, searchPattern_1, getClient, sessionsResponse, sessions, db, threadSessions, sessionToThread, sortedSessions, matchedSessions, scannedSessions, _i, sortedSessions_1, session, messagesResponse, messages, snippets, threadId, _a, matchedSessions_1, match, threadInfo, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 11, , 12]);
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _b.sent();
                if (options.project && options.channel) {
                    cliLogger.error('Use either --project or --channel, not both');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                limit = (function () {
                    var rawLimit = typeof options.limit === 'string' ? options.limit : '20';
                    var parsed = Number.parseInt(rawLimit, 10);
                    if (Number.isNaN(parsed) || parsed < 1) {
                        return new Error("Invalid --limit value: ".concat(rawLimit));
                    }
                    return parsed;
                })();
                if (limit instanceof Error) {
                    cliLogger.error(limit.message);
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, (function () { return __awaiter(void 0, void 0, void 0, function () {
                        var channelConfig;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!options.channel) return [3 /*break*/, 2];
                                    return [4 /*yield*/, (0, discord_bot_js_1.getChannelDirectory)(options.channel)];
                                case 1:
                                    channelConfig = _a.sent();
                                    if (!channelConfig) {
                                        return [2 /*return*/, new Error("No project mapping found for channel: ".concat(options.channel))];
                                    }
                                    return [2 /*return*/, node_path_1.default.resolve(channelConfig.directory)];
                                case 2: return [2 /*return*/, node_path_1.default.resolve(options.project || '.')];
                            }
                        });
                    }); })()];
            case 2:
                projectDirectoryResult = _b.sent();
                if (projectDirectoryResult instanceof Error) {
                    cliLogger.error(projectDirectoryResult.message);
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                projectDirectory = projectDirectoryResult;
                if (!node_fs_1.default.existsSync(projectDirectory)) {
                    cliLogger.error("Directory does not exist: ".concat(projectDirectory));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                searchPattern_1 = (0, session_search_js_1.parseSessionSearchPattern)(query);
                if (searchPattern_1 instanceof Error) {
                    cliLogger.error(searchPattern_1.message);
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                cliLogger.log('Connecting to OpenCode server...');
                return [4 /*yield*/, (0, discord_bot_js_1.initializeOpencodeForDirectory)(projectDirectory)];
            case 3:
                getClient = _b.sent();
                if (getClient instanceof Error) {
                    cliLogger.error('Failed to connect to OpenCode:', getClient.message);
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, getClient().session.list()];
            case 4:
                sessionsResponse = _b.sent();
                sessions = sessionsResponse.data || [];
                if (sessions.length === 0) {
                    cliLogger.log('No sessions found');
                    process.exit(0);
                }
                return [4 /*yield*/, (0, database_js_1.getDb)()];
            case 5:
                db = _b.sent();
                return [4 /*yield*/, db.query.thread_sessions.findMany({
                        columns: { thread_id: true, session_id: true },
                    })];
            case 6:
                threadSessions = _b.sent();
                sessionToThread = new Map(threadSessions
                    .filter(function (row) { return row.session_id !== ''; })
                    .map(function (row) { return [row.session_id, row.thread_id]; }));
                sortedSessions = __spreadArray([], sessions, true).sort(function (a, b) {
                    return b.time.updated - a.time.updated;
                });
                matchedSessions = [];
                scannedSessions = 0;
                _i = 0, sortedSessions_1 = sortedSessions;
                _b.label = 7;
            case 7:
                if (!(_i < sortedSessions_1.length)) return [3 /*break*/, 10];
                session = sortedSessions_1[_i];
                scannedSessions++;
                return [4 /*yield*/, getClient().session.messages({
                        sessionID: session.id,
                    })];
            case 8:
                messagesResponse = _b.sent();
                messages = messagesResponse.data || [];
                snippets = messages
                    .flatMap(function (message) {
                    var rolePrefix = message.info.role === 'assistant'
                        ? 'assistant'
                        : message.info.role === 'user'
                            ? 'user'
                            : 'message';
                    return message.parts.filter(function (p) { return !(p.type === 'text' && p.synthetic); }).flatMap(function (part) {
                        return (0, session_search_js_1.getPartSearchTexts)(part).flatMap(function (text) {
                            var hit = (0, session_search_js_1.findFirstSessionSearchHit)({
                                text: text,
                                searchPattern: searchPattern_1,
                            });
                            if (!hit) {
                                return [];
                            }
                            var snippet = (0, session_search_js_1.buildSessionSearchSnippet)({ text: text, hit: hit });
                            if (!snippet) {
                                return [];
                            }
                            return ["".concat(rolePrefix, ": ").concat(snippet)];
                        });
                    });
                })
                    .slice(0, 3);
                if (snippets.length === 0) {
                    return [3 /*break*/, 9];
                }
                threadId = sessionToThread.get(session.id);
                matchedSessions.push({
                    id: session.id,
                    title: session.title || 'Untitled Session',
                    directory: session.directory,
                    updated: new Date(session.time.updated).toISOString(),
                    source: threadId ? 'kimaki' : 'opencode',
                    threadId: threadId || null,
                    snippets: snippets,
                });
                if (matchedSessions.length >= limit) {
                    return [3 /*break*/, 10];
                }
                _b.label = 9;
            case 9:
                _i++;
                return [3 /*break*/, 7];
            case 10:
                if (options.json) {
                    console.log(JSON.stringify({
                        query: searchPattern_1.raw,
                        mode: searchPattern_1.mode,
                        projectDirectory: projectDirectory,
                        scannedSessions: scannedSessions,
                        matches: matchedSessions,
                    }, null, 2));
                    process.exit(0);
                }
                if (matchedSessions.length === 0) {
                    cliLogger.log("No matches found for ".concat(searchPattern_1.raw, " in ").concat(projectDirectory, " (").concat(scannedSessions, " sessions scanned)"));
                    process.exit(0);
                }
                cliLogger.log("Found ".concat(matchedSessions.length, " matching session(s) for ").concat(searchPattern_1.raw, " in ").concat(projectDirectory));
                for (_a = 0, matchedSessions_1 = matchedSessions; _a < matchedSessions_1.length; _a++) {
                    match = matchedSessions_1[_a];
                    threadInfo = match.threadId ? " | thread: ".concat(match.threadId) : '';
                    console.log("".concat(match.id, " | ").concat(match.title, " | ").concat(match.updated, " | ").concat(match.source).concat(threadInfo));
                    console.log("  Directory: ".concat(match.directory));
                    match.snippets.forEach(function (snippet) {
                        console.log("  - ".concat(snippet));
                    });
                }
                process.exit(0);
                return [3 /*break*/, 12];
            case 11:
                error_3 = _b.sent();
                cliLogger.error('Error:', error_3 instanceof Error ? error_3.stack : String(error_3));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); });
cli
    .command('session export-events-jsonl', 'Export persisted session events from SQLite to JSONL for debugging Kimaki runtime bugs')
    .option('--session <sessionId>', 'Session ID whose persisted event stream should be exported')
    .option('--out <file>', 'Output .jsonl path (useful for reproducing Kimaki issues in event-stream-state tests)')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, outFile, outPath, rows, parsedRows, projectDirectory, lines, jsonl;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                sessionId = typeof options.session === 'string' ? options.session.trim() : '';
                if (!sessionId) {
                    cliLogger.error('Missing --session value');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                outFile = typeof options.out === 'string' ? options.out.trim() : '';
                if (!outFile) {
                    cliLogger.error('Missing --out value');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (node_path_1.default.extname(outFile).toLowerCase() !== '.jsonl') {
                    cliLogger.error('--out must point to a .jsonl file');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                outPath = node_path_1.default.resolve(outFile);
                return [4 /*yield*/, (0, database_js_1.getSessionEventSnapshot)({ sessionId: sessionId })];
            case 1:
                rows = _a.sent();
                if (rows.length === 0) {
                    cliLogger.error("No persisted events found for session ".concat(sessionId, ". The session may not have emitted events yet."));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                parsedRows = rows.flatMap(function (row) {
                    var parsed = errore.try({
                        try: function () {
                            return JSON.parse(row.event_json);
                        },
                        catch: function (error) {
                            return new Error('Failed to parse persisted event JSON', {
                                cause: error,
                            });
                        },
                    });
                    if (parsed instanceof Error) {
                        cliLogger.warn("Skipping invalid persisted event row ".concat(row.id, ": ").concat(parsed.message));
                        return [];
                    }
                    return [{ row: row, event: parsed }];
                });
                if (parsedRows.length === 0) {
                    cliLogger.error("No valid persisted events found for session ".concat(sessionId, "."));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                projectDirectory = parsedRows.reduce(function (directory, _a) {
                    var event = _a.event;
                    if (directory) {
                        return directory;
                    }
                    if (event.type !== 'session.updated') {
                        return directory;
                    }
                    return event.properties.info.directory;
                }, '');
                lines = parsedRows.map(function (_a) {
                    var row = _a.row, event = _a.event;
                    return JSON.stringify((0, opencode_session_event_log_js_1.buildOpencodeEventLogLine)({
                        timestamp: Number(row.timestamp),
                        threadId: row.thread_id,
                        projectDirectory: projectDirectory,
                        event: event,
                    }));
                });
                jsonl = "".concat(lines.join('\n')).concat(lines.length > 0 ? '\n' : '');
                node_fs_1.default.mkdirSync(node_path_1.default.dirname(outPath), { recursive: true });
                node_fs_1.default.writeFileSync(outPath, jsonl, 'utf8');
                cliLogger.log("Exported ".concat(lines.length, " events from ").concat(sessionId, " to ").concat(outPath));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
cli
    .command('session archive [threadId]', 'Archive a Discord thread and stop its mapped OpenCode session')
    .option('--session <sessionId>', 'Resolve thread from an OpenCode session ID')
    .action(function (threadIdArg, options) { return __awaiter(void 0, void 0, void 0, function () {
    var resolvedThreadId, botToken, rest, threadData, sessionId, _a, client, channelConfig, getClient, threadLabel, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 14, , 15]);
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()
                    // Resolve threadId from --session or positional arg
                ];
            case 1:
                _b.sent();
                // Resolve threadId from --session or positional arg
                if (threadIdArg && options.session) {
                    cliLogger.error('Use either a thread ID or --session, not both');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, (function () { return __awaiter(void 0, void 0, void 0, function () {
                        var id;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (threadIdArg) {
                                        return [2 /*return*/, threadIdArg];
                                    }
                                    if (!options.session) return [3 /*break*/, 2];
                                    return [4 /*yield*/, (0, database_js_1.getThreadIdBySessionId)(options.session)];
                                case 1:
                                    id = _a.sent();
                                    if (!id) {
                                        cliLogger.error("No Discord thread found for session: ".concat(options.session));
                                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                                    }
                                    return [2 /*return*/, id];
                                case 2:
                                    cliLogger.error('Provide a thread ID or --session <sessionId>');
                                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                                    return [2 /*return*/];
                            }
                        });
                    }); })()];
            case 2:
                resolvedThreadId = _b.sent();
                return [4 /*yield*/, (0, cli_runner_js_1.resolveBotCredentials)()];
            case 3:
                botToken = (_b.sent()).token;
                rest = (0, discord_urls_js_1.createDiscordRest)(botToken);
                return [4 /*yield*/, rest.get(discord_js_1.Routes.channel(resolvedThreadId))];
            case 4:
                threadData = (_b.sent());
                if (!(0, cli_runner_js_1.isThreadChannelType)(threadData.type)) {
                    cliLogger.error("Channel is not a thread: ".concat(resolvedThreadId));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                _a = options.session;
                if (_a) return [3 /*break*/, 6];
                return [4 /*yield*/, (0, database_js_1.getThreadSession)(resolvedThreadId)];
            case 5:
                _a = (_b.sent());
                _b.label = 6;
            case 6:
                sessionId = _a;
                client = null;
                if (!(sessionId && threadData.parent_id)) return [3 /*break*/, 11];
                return [4 /*yield*/, (0, discord_bot_js_1.getChannelDirectory)(threadData.parent_id)];
            case 7:
                channelConfig = _b.sent();
                if (!!channelConfig) return [3 /*break*/, 8];
                cliLogger.warn("No channel directory mapping found for parent channel ".concat(threadData.parent_id));
                return [3 /*break*/, 10];
            case 8: return [4 /*yield*/, (0, discord_bot_js_1.initializeOpencodeForDirectory)(channelConfig.directory)];
            case 9:
                getClient = _b.sent();
                if (getClient instanceof Error) {
                    cliLogger.warn("Could not initialize OpenCode for ".concat(channelConfig.directory, ": ").concat(getClient.message));
                }
                else {
                    client = getClient();
                }
                _b.label = 10;
            case 10: return [3 /*break*/, 12];
            case 11:
                cliLogger.warn("No mapped OpenCode session found for thread ".concat(resolvedThreadId));
                _b.label = 12;
            case 12: return [4 /*yield*/, (0, discord_utils_js_1.archiveThread)({
                    rest: rest,
                    threadId: resolvedThreadId,
                    parentChannelId: threadData.parent_id,
                    sessionId: sessionId,
                    client: client,
                })];
            case 13:
                _b.sent();
                threadLabel = threadData.name || resolvedThreadId;
                (0, prompts_1.note)("Archived thread: ".concat(threadLabel, "\nThread ID: ").concat(resolvedThreadId), '✅ Archived');
                process.exit(0);
                return [3 /*break*/, 15];
            case 14:
                error_4 = _b.sent();
                cliLogger.error('Error:', error_4 instanceof Error ? error_4.stack : String(error_4));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 15];
            case 15: return [2 /*return*/];
        }
    });
}); });
cli
    .command('session discord-url <sessionId>', 'Print the Discord thread URL for a session')
    .option('--json', 'Output as JSON')
    .action(function (sessionId, options) { return __awaiter(void 0, void 0, void 0, function () {
    var threadId, botToken, rest, threadData, url;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, database_js_1.getThreadIdBySessionId)(sessionId)];
            case 2:
                threadId = _a.sent();
                if (!threadId) {
                    cliLogger.error("No Discord thread found for session: ".concat(sessionId));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, (0, cli_runner_js_1.resolveBotCredentials)()];
            case 3:
                botToken = (_a.sent()).token;
                rest = (0, discord_urls_js_1.createDiscordRest)(botToken);
                return [4 /*yield*/, rest.get(discord_js_1.Routes.channel(threadId))];
            case 4:
                threadData = (_a.sent());
                url = "https://discord.com/channels/".concat(threadData.guild_id, "/").concat(threadData.id);
                if (options.json) {
                    console.log(JSON.stringify({
                        url: url,
                        threadId: threadData.id,
                        guildId: threadData.guild_id,
                        sessionId: sessionId,
                        threadName: threadData.name,
                    }));
                }
                else {
                    console.log(url);
                }
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
exports.default = cli;
