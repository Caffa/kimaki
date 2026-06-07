"use strict";
// E2e capture tests for generating real OpenCode session-event JSONL fixtures.
// Uses opencode-cached-provider + Gemini to record real tool/lifecycle streams
// (task, interruption, permission, action buttons, and question flows).
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
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var vitest_1 = require("vitest");
var discord_js_1 = require("discord.js");
var src_1 = require("discord-digital-twin/src");
var opencode_cached_provider_1 = require("opencode-cached-provider");
var config_js_1 = require("./config.js");
var store_js_1 = require("./store.js");
var discord_bot_js_1 = require("./discord-bot.js");
var database_js_1 = require("./database.js");
var hrana_server_js_1 = require("./hrana-server.js");
var test_utils_js_1 = require("./test-utils.js");
var test_utils_js_2 = require("./test-utils.js");
var opencode_js_1 = require("./opencode.js");
var thread_session_runtime_js_1 = require("./session-handler/thread-session-runtime.js");
var action_buttons_js_1 = require("./commands/action-buttons.js");
var ask_question_js_1 = require("./commands/ask-question.js");
var geminiApiKey = process.env['GEMINI_API_KEY'] ||
    process.env['GOOGLE_GENERATIVE_AI_API_KEY'] ||
    '';
var geminiModel = process.env['GEMINI_FLASH_MODEL'] || 'gemini-2.5-flash';
var shouldRunRealCapture = geminiApiKey.length > 0 && process.env['KIMAKI_RUN_REAL_EVENT_CAPTURE'] === '1';
var realCaptureTest = shouldRunRealCapture ? vitest_1.test : vitest_1.test.skip;
var TEST_USER_ID = '200000000000003001';
var TEXT_CHANNEL_ID = '200000000000003002';
function createRunDirectories() {
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'event-stream-real-capture-e2e');
    node_fs_1.default.mkdirSync(root, { recursive: true });
    var dataDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(root, 'data-'));
    var projectDirectory = node_path_1.default.join(root, 'project');
    var providerCacheDbPath = node_path_1.default.join(root, 'provider-cache.db');
    var sessionEventsDir = node_path_1.default.join(root, 'opencode-session-events');
    var fixtureOutputDir = node_path_1.default.resolve(process.cwd(), 'src', 'session-handler', 'event-stream-fixtures');
    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
    (0, test_utils_js_1.initTestGitRepo)(projectDirectory);
    node_fs_1.default.mkdirSync(sessionEventsDir, { recursive: true });
    return {
        root: root,
        dataDir: dataDir,
        projectDirectory: projectDirectory,
        providerCacheDbPath: providerCacheDbPath,
        sessionEventsDir: sessionEventsDir,
        fixtureOutputDir: fixtureOutputDir,
    };
}
function createDiscordJsClient(_a) {
    var restUrl = _a.restUrl;
    return new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.MessageContent,
            discord_js_1.GatewayIntentBits.GuildVoiceStates,
        ],
        partials: [
            discord_js_1.Partials.Channel,
            discord_js_1.Partials.Message,
            discord_js_1.Partials.User,
            discord_js_1.Partials.ThreadMember,
        ],
        rest: {
            api: restUrl,
            version: '10',
        },
    });
}
function readJsonlEvents(filePath) {
    var content = node_fs_1.default.readFileSync(filePath, 'utf8');
    var lines = content.split('\n').filter(function (line) {
        return line.trim().length > 0;
    });
    return lines.map(function (line) {
        return JSON.parse(line);
    });
}
function hasToolEvent(_a) {
    var events = _a.events, tool = _a.tool;
    return events.some(function (line) {
        if (line.event.type !== 'message.part.updated') {
            return false;
        }
        var part = line.event.properties.part;
        if (part.type !== 'tool') {
            return false;
        }
        return part.tool === tool;
    });
}
function listJsonlFiles(directory) {
    return node_fs_1.default.readdirSync(directory).filter(function (name) {
        return name.endsWith('.jsonl');
    });
}
function waitForNewOrUpdatedSessionLog(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, files, changedFiles, newest;
        var directory = _b.directory, before = _b.before, timeoutMs = _b.timeoutMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < timeoutMs)) return [3 /*break*/, 3];
                    files = listJsonlFiles(directory);
                    changedFiles = files.filter(function (fileName) {
                        var filePath = node_path_1.default.join(directory, fileName);
                        var stat = node_fs_1.default.statSync(filePath);
                        var previous = before.get(fileName);
                        if (!previous) {
                            return true;
                        }
                        return stat.size > previous.size || stat.mtimeMs > previous.mtimeMs;
                    });
                    if (changedFiles.length > 0) {
                        newest = __spreadArray([], changedFiles, true).sort(function (a, b) {
                            var aMtime = node_fs_1.default.statSync(node_path_1.default.join(directory, a)).mtimeMs;
                            var bMtime = node_fs_1.default.statSync(node_path_1.default.join(directory, b)).mtimeMs;
                            return bMtime - aMtime;
                        })[0];
                        if (newest) {
                            return [2 /*return*/, node_path_1.default.join(directory, newest)];
                        }
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 200);
                        })];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 3: throw new Error('Timed out waiting for changed session event log file');
            }
        });
    });
}
function waitForPendingPermission(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, perms, first;
        var threadId = _b.threadId, timeoutMs = _b.timeoutMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < timeoutMs)) return [3 /*break*/, 3];
                    perms = thread_session_runtime_js_1.pendingPermissions.get(threadId);
                    first = perms ? __spreadArray([], perms.values(), true)[0] : undefined;
                    if ((first === null || first === void 0 ? void 0 : first.contextHash) && first.messageId) {
                        return [2 /*return*/, { contextHash: first.contextHash, messageId: first.messageId }];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 3: throw new Error('Timed out waiting for pending permission context');
            }
        });
    });
}
function waitForPendingActionButtons(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, entry;
        var threadId = _b.threadId, timeoutMs = _b.timeoutMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < timeoutMs)) return [3 /*break*/, 3];
                    entry = __spreadArray([], action_buttons_js_1.pendingActionButtonContexts.entries(), true).find(function (_a) {
                        var context = _a[1];
                        return context.thread.id === threadId && !context.resolved && Boolean(context.messageId);
                    });
                    if (entry && entry[1].messageId) {
                        return [2 /*return*/, { contextHash: entry[0], messageId: entry[1].messageId }];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 2:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 3: throw new Error('Timed out waiting for pending action buttons context');
            }
        });
    });
}
function waitForPendingQuestion(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var start, entry, contextHash, context, questionMessage;
        var discord = _b.discord, threadId = _b.threadId, timeoutMs = _b.timeoutMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < timeoutMs)) return [3 /*break*/, 5];
                    entry = __spreadArray([], ask_question_js_1.pendingQuestionContexts.entries(), true).find(function (_a) {
                        var context = _a[1];
                        return context.thread.id === threadId;
                    });
                    if (!entry) return [3 /*break*/, 3];
                    contextHash = entry[0], context = entry[1];
                    return [4 /*yield*/, discord.thread(threadId).waitForMessage({
                            timeout: 10000,
                            predicate: function (message) {
                                return message.author.id === discord.botUserId
                                    && message.content.includes('Choose one option');
                            },
                        })];
                case 2:
                    questionMessage = _c.sent();
                    if (questionMessage) {
                        return [2 /*return*/, {
                                contextHash: contextHash,
                                questionMessage: questionMessage,
                            }];
                    }
                    _c.label = 3;
                case 3: return [4 /*yield*/, new Promise(function (resolve) {
                        setTimeout(resolve, 100);
                    })];
                case 4:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 5: throw new Error('Timed out waiting for pending question context');
            }
        });
    });
}
(0, vitest_1.describe)('real event stream capture fixtures (cached provider)', function () {
    var directories = createRunDirectories();
    var lockPort = 0;
    var previousDefaultVerbosity = null;
    var testStartTime = Date.now();
    var botClient = null;
    var proxy = new opencode_cached_provider_1.CachedOpencodeProviderProxy({
        cacheDbPath: directories.providerCacheDbPath,
        targetBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: geminiApiKey,
        cacheMethods: ['POST'],
    });
    var digitalDiscordDbPath = node_path_1.default.join(directories.dataDir, 'digital-discord.db');
    var discord = new src_1.DigitalDiscord({
        guild: {
            name: 'Real Event Capture Guild',
            ownerId: TEST_USER_ID,
        },
        channels: [
            {
                id: TEXT_CHANNEL_ID,
                name: 'real-event-capture',
                type: discord_js_1.ChannelType.GuildText,
            },
        ],
        users: [
            {
                id: TEST_USER_ID,
                username: 'real-capture-user',
            },
        ],
        dbUrl: "file:".concat(digitalDiscordDbPath),
    });
    function captureFixture(_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var newLogPath, fixturePath, events;
            var fixtureName = _b.fixtureName, beforeFiles = _b.beforeFiles, assertEvents = _b.assertEvents;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, waitForNewOrUpdatedSessionLog({
                            directory: directories.sessionEventsDir,
                            before: beforeFiles,
                            timeoutMs: 120000,
                        })];
                    case 1:
                        newLogPath = _c.sent();
                        fixturePath = node_path_1.default.join(directories.fixtureOutputDir, fixtureName);
                        node_fs_1.default.copyFileSync(newLogPath, fixturePath);
                        events = readJsonlEvents(fixturePath);
                        assertEvents(events);
                        return [2 /*return*/];
                }
            });
        });
    }
    function getSessionLogState() {
        var files = listJsonlFiles(directories.sessionEventsDir);
        return new Map(files.map(function (fileName) {
            var stat = node_fs_1.default.statSync(node_path_1.default.join(directories.sessionEventsDir, fileName));
            return [fileName, { size: stat.size, mtimeMs: stat.mtimeMs }];
        }));
    }
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var opencodeConfig, dbPath, hranaResult, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    testStartTime = Date.now();
                    lockPort = (0, test_utils_js_1.chooseLockPort)({ key: TEXT_CHANNEL_ID });
                    listJsonlFiles(directories.sessionEventsDir).forEach(function (fileName) {
                        node_fs_1.default.rmSync(node_path_1.default.join(directories.sessionEventsDir, fileName), {
                            force: true,
                        });
                    });
                    process.env['KIMAKI_LOCK_PORT'] = String(lockPort);
                    process.env['KIMAKI_LOG_OPENCODE_SESSION_EVENTS'] = '1';
                    process.env['KIMAKI_OPENCODE_SESSION_EVENTS_DIR'] = directories.sessionEventsDir;
                    (0, config_js_1.setDataDir)(directories.dataDir);
                    previousDefaultVerbosity = store_js_1.store.getState().defaultVerbosity;
                    store_js_1.store.setState({ defaultVerbosity: 'tools_and_text' });
                    return [4 /*yield*/, Promise.all([proxy.start(), discord.start()])];
                case 1:
                    _b.sent();
                    opencodeConfig = proxy.buildOpencodeConfig({
                        providerName: 'cached-google-real-events',
                        providerNpm: '@ai-sdk/google',
                        model: geminiModel,
                        smallModel: geminiModel,
                    });
                    node_fs_1.default.writeFileSync(node_path_1.default.join(directories.projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                    dbPath = node_path_1.default.join(directories.dataDir, 'discord-sessions.db');
                    return [4 /*yield*/, (0, hrana_server_js_1.startHranaServer)({ dbPath: dbPath })];
                case 2:
                    hranaResult = _b.sent();
                    if (hranaResult instanceof Error) {
                        throw hranaResult;
                    }
                    process.env['KIMAKI_DB_URL'] = hranaResult;
                    return [4 /*yield*/, (0, database_js_1.initDatabase)()];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, database_js_1.setBotToken)(discord.botUserId, discord.botToken)];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: TEXT_CHANNEL_ID,
                            directory: directories.projectDirectory,
                            channelType: 'text',
                        })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelVerbosity)(TEXT_CHANNEL_ID, 'tools_and_text')];
                case 6:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, (0, database_js_1.getChannelVerbosity)(TEXT_CHANNEL_ID)];
                case 7:
                    _a.apply(void 0, [_b.sent()]).toBe('tools_and_text');
                    botClient = createDiscordJsClient({ restUrl: discord.restUrl });
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                            token: discord.botToken,
                            appId: discord.botUserId,
                            discordClient: botClient,
                        })];
                case 8:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 180000);
    (0, vitest_1.afterEach)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var threadIds;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    __spreadArray([], action_buttons_js_1.pendingActionButtonContexts.values(), true).forEach(function (context) {
                        clearTimeout(context.timer);
                    });
                    action_buttons_js_1.pendingActionButtonContexts.clear();
                    ask_question_js_1.pendingQuestionContexts.clear();
                    thread_session_runtime_js_1.pendingPermissions.clear();
                    threadIds = __spreadArray([], store_js_1.store.getState().threads.keys(), true);
                    threadIds.forEach(function (threadId) {
                        (0, thread_session_runtime_js_1.disposeRuntime)(threadId);
                    });
                    return [4 /*yield*/, (0, test_utils_js_1.cleanupTestSessions)({
                            projectDirectory: directories.projectDirectory,
                            testStartTime: testStartTime,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 180000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, test_utils_js_1.cleanupTestSessions)({
                        projectDirectory: directories.projectDirectory,
                        testStartTime: testStartTime,
                    })];
                case 1:
                    _a.sent();
                    if (botClient) {
                        void botClient.destroy();
                    }
                    return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            (0, database_js_1.closeDatabase)().catch(function () {
                                return;
                            }),
                            (0, hrana_server_js_1.stopHranaServer)().catch(function () {
                                return;
                            }),
                            proxy.stop().catch(function () {
                                return;
                            }),
                            discord.stop().catch(function () {
                                return;
                            }),
                        ])];
                case 3:
                    _a.sent();
                    delete process.env['KIMAKI_LOCK_PORT'];
                    delete process.env['KIMAKI_DB_URL'];
                    delete process.env['KIMAKI_LOG_OPENCODE_SESSION_EVENTS'];
                    delete process.env['KIMAKI_OPENCODE_SESSION_EVENTS_DIR'];
                    if (previousDefaultVerbosity) {
                        store_js_1.store.setState({ defaultVerbosity: previousDefaultVerbosity });
                    }
                    node_fs_1.default.rmSync(directories.dataDir, { recursive: true, force: true });
                    return [2 /*return*/];
            }
        });
    }); }, 180000);
    realCaptureTest('capture real task flow fixture', function () { return __awaiter(void 0, void 0, void 0, function () {
        var beforeFiles, prompt, thread;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    beforeFiles = getSessionLogState();
                    prompt = 'REAL_FIXTURE_TASK_NORMAL. First response MUST be exactly one tool call: tool `task` with {"description":"inspect repository","subagent_type":"general","prompt":"Read this repository and return exactly: task-subagent-done"}. Do not answer with plain text before the tool call. After the task result returns, respond with exactly: task-normal-done.';
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: prompt,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 120000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('REAL_FIXTURE_TASK_NORMAL')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_2.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '┣ task',
                            timeout: 300000,
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_2.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'task-normal-done',
                            timeout: 300000,
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, captureFixture({
                            fixtureName: 'real-session-task-normal.jsonl',
                            beforeFiles: beforeFiles,
                            assertEvents: function (events) {
                                (0, vitest_1.expect)(events.length).toBeGreaterThan(0);
                                (0, vitest_1.expect)(hasToolEvent({ events: events, tool: 'task' })).toBe(true);
                            },
                        })];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 900000);
    realCaptureTest('capture real task interruption fixture', function () { return __awaiter(void 0, void 0, void 0, function () {
        var beforeFiles, setupPrompt, thread;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    beforeFiles = getSessionLogState();
                    setupPrompt = 'REAL_FIXTURE_TASK_INTERRUPT_START. First response MUST call tool `task` with {"description":"long analysis","subagent_type":"general","prompt":"Perform a long analysis over many files and produce extensive notes"}. Do not send plain text before the tool call.';
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: setupPrompt,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 120000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('REAL_FIXTURE_TASK_INTERRUPT_START')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_2.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '┣ task',
                            timeout: 300000,
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, discord.thread(thread.id).user(TEST_USER_ID).sendMessage({
                            content: 'REAL_FIXTURE_TASK_INTERRUPT_FOLLOWUP. Stop and reply with exactly: task-interrupt-done.',
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_2.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'REAL_FIXTURE_TASK_INTERRUPT_FOLLOWUP',
                            timeout: 300000,
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, captureFixture({
                            fixtureName: 'real-session-task-user-interruption.jsonl',
                            beforeFiles: beforeFiles,
                            assertEvents: function (events) {
                                (0, vitest_1.expect)(events.length).toBeGreaterThan(0);
                                (0, vitest_1.expect)(hasToolEvent({ events: events, tool: 'task' })).toBe(true);
                            },
                        })];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 900000);
    realCaptureTest('capture real permission fixture for external path access', function () { return __awaiter(void 0, void 0, void 0, function () {
        var beforeFiles, prompt, thread, pending, interaction;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    beforeFiles = getSessionLogState();
                    prompt = 'REAL_FIXTURE_PERMISSION_EXTERNAL. Use bash (hasSideEffect false) to read this file outside the workspace: /Users/morse/.zprofile. Then summarize the first line.';
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: prompt,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 120000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('REAL_FIXTURE_PERMISSION_EXTERNAL')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    return [4 /*yield*/, waitForPendingPermission({
                            threadId: thread.id,
                            timeoutMs: 300000,
                        })];
                case 3:
                    pending = _a.sent();
                    return [4 /*yield*/, discord.thread(thread.id).user(TEST_USER_ID).clickButton({
                            messageId: pending.messageId,
                            customId: "permission_once:".concat(pending.contextHash),
                        })];
                case 4:
                    interaction = _a.sent();
                    return [4 /*yield*/, discord.thread(thread.id).waitForInteractionAck({
                            interactionId: interaction.id,
                            timeout: 30000,
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, discord.thread(thread.id).waitForBotReply({ timeout: 300000 })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, captureFixture({
                            fixtureName: 'real-session-permission-external-file.jsonl',
                            beforeFiles: beforeFiles,
                            assertEvents: function (events) {
                                var hasPermissionAsked = events.some(function (line) {
                                    return line.event.type === 'permission.asked';
                                });
                                var hasPermissionReplied = events.some(function (line) {
                                    return line.event.type === 'permission.replied';
                                });
                                (0, vitest_1.expect)(hasPermissionAsked).toBe(true);
                                (0, vitest_1.expect)(hasPermissionReplied).toBe(true);
                            },
                        })];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 900000);
    realCaptureTest('capture real action buttons fixture', function () { return __awaiter(void 0, void 0, void 0, function () {
        var beforeFiles, prompt, thread, action, interaction;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    beforeFiles = getSessionLogState();
                    prompt = 'REAL_FIXTURE_ACTION_BUTTONS. First response MUST call tool `kimaki_action_buttons` with {"buttons":[{"label":"Approve capture","color":"green"}]}. Do not send text before the tool call. After user clicks, reply exactly: action-buttons-done.';
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: prompt,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 120000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('REAL_FIXTURE_ACTION_BUTTONS')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    return [4 /*yield*/, waitForPendingActionButtons({
                            threadId: thread.id,
                            timeoutMs: 300000,
                        })];
                case 3:
                    action = _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_2.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Action Required',
                            timeout: 300000,
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, discord.thread(thread.id).user(TEST_USER_ID).clickButton({
                            messageId: action.messageId,
                            customId: "action_button:".concat(action.contextHash, ":0"),
                        })];
                case 5:
                    interaction = _a.sent();
                    return [4 /*yield*/, discord.thread(thread.id).waitForInteractionAck({
                            interactionId: interaction.id,
                            timeout: 30000,
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_2.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'action-buttons-done',
                            timeout: 300000,
                        })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, captureFixture({
                            fixtureName: 'real-session-action-buttons.jsonl',
                            beforeFiles: beforeFiles,
                            assertEvents: function (events) {
                                (0, vitest_1.expect)(events.length).toBeGreaterThan(0);
                                var hasActionTool = hasToolEvent({ events: events, tool: 'kimaki_action_buttons' });
                                (0, vitest_1.expect)(hasActionTool).toBe(true);
                            },
                        })];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 900000);
    realCaptureTest('capture real question tool fixture', function () { return __awaiter(void 0, void 0, void 0, function () {
        var beforeFiles, prompt, thread, pending, interaction;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    beforeFiles = getSessionLogState();
                    prompt = 'REAL_FIXTURE_QUESTION_TOOL. First response MUST call tool `question` with {"questions":[{"question":"Choose one option","header":"Pick one","options":[{"label":"Alpha","description":"Alpha option"},{"label":"Beta","description":"Beta option"}]}]}. Do not send text before the tool call. After user selects, reply exactly: question-tool-done.';
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: prompt,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 120000,
                            predicate: function (t) {
                                var _a, _b;
                                return (_b = (_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('REAL_FIXTURE_QUESTION_TOOL')) !== null && _b !== void 0 ? _b : false;
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    return [4 /*yield*/, waitForPendingQuestion({
                            discord: discord,
                            threadId: thread.id,
                            timeoutMs: 300000,
                        })];
                case 3:
                    pending = _a.sent();
                    return [4 /*yield*/, discord.thread(thread.id).user(TEST_USER_ID).selectMenu({
                            messageId: pending.questionMessage.id,
                            customId: "ask_question:".concat(pending.contextHash, ":0"),
                            values: ['0'],
                        })];
                case 4:
                    interaction = _a.sent();
                    return [4 /*yield*/, discord.thread(thread.id).waitForInteractionAck({
                            interactionId: interaction.id,
                            timeout: 30000,
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_2.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'question-tool-done',
                            timeout: 300000,
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, captureFixture({
                            fixtureName: 'real-session-question-tool.jsonl',
                            beforeFiles: beforeFiles,
                            assertEvents: function (events) {
                                var hasQuestionAsked = events.some(function (line) {
                                    return line.event.type === 'question.asked';
                                });
                                var hasQuestionReplied = events.some(function (line) {
                                    return line.event.type === 'question.replied';
                                });
                                (0, vitest_1.expect)(hasQuestionAsked).toBe(true);
                                (0, vitest_1.expect)(hasQuestionReplied).toBe(true);
                            },
                        })];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 900000);
});
