"use strict";
// E2e test for agent model resolution in new threads.
// Reproduces a bug where /agent channel preference is ignored by the
// promptAsync path: submitViaOpencodeQueue only passes input.agent/input.model
// (undefined for normal Discord messages) instead of resolving channel agent
// preferences from DB like dispatchPrompt does.
//
// The test sets a channel agent with a custom model, sends a message,
// and verifies the footer contains the agent's model — not the default.
//
// Uses opencode-deterministic-provider (no real LLM calls).
// Poll timeouts: 4s max, 100ms interval.
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
var node_url_1 = require("node:url");
var vitest_1 = require("vitest");
var discord_js_1 = require("discord.js");
var src_1 = require("discord-digital-twin/src");
var opencode_deterministic_provider_1 = require("opencode-deterministic-provider");
var config_js_1 = require("./config.js");
var store_js_1 = require("./store.js");
var discord_bot_js_1 = require("./discord-bot.js");
var database_js_1 = require("./database.js");
var db_js_1 = require("./db.js");
var orm = require("drizzle-orm");
var schema = require("./schema.js");
var hrana_server_js_1 = require("./hrana-server.js");
var opencode_js_1 = require("./opencode.js");
var test_utils_js_1 = require("./test-utils.js");
var agent_js_1 = require("./commands/agent.js");
var TEST_USER_ID = '200000000000000920';
var TEXT_CHANNEL_ID = '200000000000000921';
var AGENT_MODEL = 'agent-model-v2';
var PLAN_AGENT_MODEL = 'plan-model-v2';
var CHANNEL_MODEL = 'channel-model-v2';
var DEFAULT_MODEL = 'deterministic-v2';
var PROVIDER_NAME = 'deterministic-provider';
function createRunDirectories() {
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'agent-model-e2e');
    node_fs_1.default.mkdirSync(root, { recursive: true });
    var dataDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(root, 'data-'));
    var projectDirectory = node_path_1.default.join(root, 'project');
    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
    (0, test_utils_js_1.initTestGitRepo)(projectDirectory);
    return { root: root, dataDir: dataDir, projectDirectory: projectDirectory };
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
function createDeterministicMatchers() {
    var systemContextMatcher = {
        id: 'system-context-check',
        priority: 20,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'Reply with exactly: system-context-check',
            promptTextIncludes: "<discord-user name=\"agent-model-tester\" user-id=\"".concat(TEST_USER_ID, "\""),
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'system-context-reply' },
                {
                    type: 'text-delta',
                    id: 'system-context-reply',
                    delta: 'system-context-ok',
                },
                { type: 'text-end', id: 'system-context-reply' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 100, 0, 0, 0],
        },
    };
    var replyContextMatcher = {
        id: 'reply-context-check',
        priority: 15,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'Reply with exactly: reply-context-check',
            rawPromptIncludes: 'This message was a reply to message\n\n<replied-message author="agent-model-tester">\nfirst message in thread\n</replied-message>',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'reply-context-reply' },
                {
                    type: 'text-delta',
                    id: 'reply-context-reply',
                    delta: 'reply-context-ok',
                },
                { type: 'text-end', id: 'reply-context-reply' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 100, 0, 0, 0],
        },
    };
    var userReplyMatcher = {
        id: 'user-reply',
        priority: 10,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'Reply with exactly:',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'default-reply' },
                { type: 'text-delta', id: 'default-reply', delta: 'ok' },
                { type: 'text-end', id: 'default-reply' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 100, 0, 0, 0],
        },
    };
    return [systemContextMatcher, replyContextMatcher, userReplyMatcher];
}
/**
 * Create an opencode agent .md file that uses a specific model.
 * OpenCode discovers agents from .opencode/agent/*.md files.
 */
function createAgentFile(_a) {
    var projectDirectory = _a.projectDirectory, agentName = _a.agentName, model = _a.model;
    var agentDir = node_path_1.default.join(projectDirectory, '.opencode', 'agent');
    node_fs_1.default.mkdirSync(agentDir, { recursive: true });
    var content = [
        '---',
        "model: ".concat(model),
        'mode: primary',
        "description: Test agent with custom model",
        '---',
        '',
        'You are a test agent. Reply concisely.',
        '',
    ].join('\n');
    node_fs_1.default.writeFileSync(node_path_1.default.join(agentDir, "".concat(agentName, ".md")), content);
}
(0, vitest_1.describe)('agent model resolution', function () {
    var directories;
    var discord;
    var botClient;
    var previousDefaultVerbosity = null;
    var testStartTime = Date.now();
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var lockPort, digitalDiscordDbPath, providerNpm, opencodeConfig, providerConfig, dbPath, hranaResult, agentCommands, rest, warmup;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testStartTime = Date.now();
                    directories = createRunDirectories();
                    lockPort = (0, test_utils_js_1.chooseLockPort)({ key: TEXT_CHANNEL_ID });
                    process.env['KIMAKI_LOCK_PORT'] = String(lockPort);
                    (0, config_js_1.setDataDir)(directories.dataDir);
                    previousDefaultVerbosity = store_js_1.store.getState().defaultVerbosity;
                    store_js_1.store.setState({ defaultVerbosity: 'tools_and_text' });
                    digitalDiscordDbPath = node_path_1.default.join(directories.dataDir, 'digital-discord.db');
                    discord = new src_1.DigitalDiscord({
                        guild: {
                            name: 'Agent Model E2E Guild',
                            ownerId: TEST_USER_ID,
                        },
                        channels: [
                            {
                                id: TEXT_CHANNEL_ID,
                                name: 'agent-model-e2e',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                        ],
                        users: [
                            {
                                id: TEST_USER_ID,
                                username: 'agent-model-tester',
                            },
                        ],
                        dbUrl: "file:".concat(digitalDiscordDbPath),
                    });
                    return [4 /*yield*/, discord.start()];
                case 1:
                    _a.sent();
                    providerNpm = node_url_1.default
                        .pathToFileURL(node_path_1.default.resolve(process.cwd(), '..', 'opencode-deterministic-provider', 'src', 'index.ts'))
                        .toString();
                    opencodeConfig = (0, opencode_deterministic_provider_1.buildDeterministicOpencodeConfig)({
                        providerName: PROVIDER_NAME,
                        providerNpm: providerNpm,
                        model: DEFAULT_MODEL,
                        smallModel: DEFAULT_MODEL,
                        settings: {
                            strict: false,
                            matchers: createDeterministicMatchers(),
                        },
                    });
                    providerConfig = opencodeConfig.provider[PROVIDER_NAME];
                    providerConfig.models[AGENT_MODEL] = { name: AGENT_MODEL };
                    providerConfig.models[PLAN_AGENT_MODEL] = { name: PLAN_AGENT_MODEL };
                    providerConfig.models[CHANNEL_MODEL] = { name: CHANNEL_MODEL };
                    node_fs_1.default.writeFileSync(node_path_1.default.join(directories.projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                    // Create agent .md files with custom models
                    createAgentFile({
                        projectDirectory: directories.projectDirectory,
                        agentName: 'test-agent',
                        model: "".concat(PROVIDER_NAME, "/").concat(AGENT_MODEL),
                    });
                    createAgentFile({
                        projectDirectory: directories.projectDirectory,
                        agentName: 'plan',
                        model: "".concat(PROVIDER_NAME, "/").concat(PLAN_AGENT_MODEL),
                    });
                    dbPath = node_path_1.default.join(directories.dataDir, 'discord-sessions.db');
                    return [4 /*yield*/, (0, hrana_server_js_1.startHranaServer)({ dbPath: dbPath })];
                case 2:
                    hranaResult = _a.sent();
                    if (hranaResult instanceof Error) {
                        throw hranaResult;
                    }
                    process.env['KIMAKI_DB_URL'] = hranaResult;
                    return [4 /*yield*/, (0, database_js_1.initDatabase)()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setBotToken)(discord.botUserId, discord.botToken)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: TEXT_CHANNEL_ID,
                            directory: directories.projectDirectory,
                            channelType: 'text',
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelVerbosity)(TEXT_CHANNEL_ID, 'tools_and_text')];
                case 6:
                    _a.sent();
                    botClient = createDiscordJsClient({ restUrl: discord.restUrl });
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                            token: discord.botToken,
                            appId: discord.botUserId,
                            discordClient: botClient,
                        })
                        // Register quick agent slash commands so /plan-agent and /test-agent-agent
                        // are resolvable by handleQuickAgentCommand via guild.commands.fetch().
                    ];
                case 7:
                    _a.sent();
                    agentCommands = ['test-agent', 'plan'].map(function (agentName) {
                        return new discord_js_1.SlashCommandBuilder()
                            .setName("".concat(agentName, "-agent"))
                            .setDescription((0, agent_js_1.buildQuickAgentCommandDescription)({
                            agentName: agentName,
                            description: "Switch to ".concat(agentName, " agent"),
                        }))
                            .setDMPermission(false)
                            .toJSON();
                    });
                    rest = new discord_js_1.REST({ version: '10', api: discord.restUrl }).setToken(discord.botToken);
                    return [4 /*yield*/, rest.put(discord_js_1.Routes.applicationGuildCommands(discord.botUserId, discord.guildId), { body: agentCommands })
                        // Pre-warm the opencode server so agent discovery happens
                    ];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directories.projectDirectory)];
                case 9:
                    warmup = _a.sent();
                    if (warmup instanceof Error) {
                        throw warmup;
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!directories) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, test_utils_js_1.cleanupTestSessions)({
                            projectDirectory: directories.projectDirectory,
                            testStartTime: testStartTime,
                        })];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    if (botClient) {
                        void botClient.destroy();
                    }
                    return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, Promise.all([
                            (0, database_js_1.closeDatabase)().catch(function () {
                                return;
                            }),
                            (0, hrana_server_js_1.stopHranaServer)().catch(function () {
                                return;
                            }),
                            discord === null || discord === void 0 ? void 0 : discord.stop().catch(function () {
                                return;
                            }),
                        ])];
                case 4:
                    _a.sent();
                    delete process.env['KIMAKI_LOCK_PORT'];
                    delete process.env['KIMAKI_DB_URL'];
                    if (previousDefaultVerbosity) {
                        store_js_1.store.setState({ defaultVerbosity: previousDefaultVerbosity });
                    }
                    if (directories) {
                        node_fs_1.default.rmSync(directories.dataDir, { recursive: true, force: true });
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 5000);
    (0, vitest_1.test)('new thread uses agent model when channel agent is set', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, messages, footerMessage, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // Set channel agent preference — this simulates /agent selecting test-agent
                return [4 /*yield*/, (0, database_js_1.setChannelAgent)(TEXT_CHANNEL_ID, 'test-agent')
                    // Send a message to create a new thread
                ];
                case 1:
                    // Set channel agent preference — this simulates /agent selecting test-agent
                    _b.sent();
                    // Send a message to create a new thread
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: agent-model-check',
                        })];
                case 2:
                    // Send a message to create a new thread
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: agent-model-check';
                            },
                        })
                        // Wait for the footer (starts with *project) — proves run completed.
                        // Then assert which model ID appears in it.
                    ];
                case 3:
                    thread = _b.sent();
                    // Wait for the footer (starts with *project) — proves run completed.
                    // Then assert which model ID appears in it.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '*project',
                            timeout: 4000,
                        })];
                case 4:
                    // Wait for the footer (starts with *project) — proves run completed.
                    // Then assert which model ID appears in it.
                    _b.sent();
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()
                        // Find the footer message (starts with * italic)
                    ];
                case 5:
                    messages = _b.sent();
                    footerMessage = messages.find(function (message) {
                        return (message.author.id === discord.botUserId &&
                            message.content.startsWith('*'));
                    });
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 6:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (agent-model-tester)\n        Reply with exactly: agent-model-check\n        --- from: assistant (TestBot)\n        *using deterministic-provider/agent-model-v2 \u22C5 test-agent*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 agent-model-v2 \u22C5 **test-agent***\"\n      ");
                    (0, vitest_1.expect)(footerMessage).toBeDefined();
                    if (!footerMessage) {
                        throw new Error("Expected footer message but none found. Bot messages: ".concat(messages
                            .filter(function (m) { return m.author.id === discord.botUserId; })
                            .map(function (m) { return m.content.slice(0, 150); })
                            .join(' | ')));
                    }
                    // The footer should contain the agent's model, not the default
                    (0, vitest_1.expect)(footerMessage.content).toContain(AGENT_MODEL);
                    (0, vitest_1.expect)(footerMessage.content).not.toContain(DEFAULT_MODEL);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('promptAsync path includes rich system context', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.setChannelAgent)(TEXT_CHANNEL_ID, 'test-agent')];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: system-context-check',
                        })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: system-context-check';
                            },
                        })];
                case 3:
                    thread = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'system-context-ok',
                            timeout: 4000,
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'system-context-ok',
                            afterAuthorId: discord.botUserId,
                        })];
                case 5:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 6:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (agent-model-tester)\n        Reply with exactly: system-context-check\n        --- from: assistant (TestBot)\n        *using deterministic-provider/agent-model-v2 \u22C5 test-agent*\n        \u2B25 system-context-ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 agent-model-v2 \u22C5 **test-agent***\"\n      ");
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('reply message injects replied-message context', function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, existingThreadIds, _a, thread, threadMessagesBeforeReply, firstUserMessage, threadText;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.delete(schema.channel_agents).where(orm.eq(schema.channel_agents.channel_id, TEXT_CHANNEL_ID))];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, db.delete(schema.channel_models).where(orm.eq(schema.channel_models.channel_id, TEXT_CHANNEL_ID))];
                case 3:
                    _b.sent();
                    _a = Set.bind;
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).getThreads()];
                case 4:
                    existingThreadIds = new (_a.apply(Set, [void 0, (_b.sent()).map(function (thread) {
                            return thread.id;
                        })]))();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'first message in thread',
                        })];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 6000,
                            predicate: function (t) {
                                return !existingThreadIds.has(t.id);
                            },
                        })];
                case 6:
                    thread = _b.sent();
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()];
                case 7:
                    threadMessagesBeforeReply = _b.sent();
                    firstUserMessage = threadMessagesBeforeReply.find(function (message) {
                        return (message.author.id === TEST_USER_ID
                            && message.content === 'first message in thread');
                    });
                    (0, vitest_1.expect)(firstUserMessage).toBeDefined();
                    if (!firstUserMessage) {
                        throw new Error('Expected first user message in thread');
                    }
                    return [4 /*yield*/, discord.thread(thread.id).user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: reply-context-check',
                            messageReference: {
                                message_id: firstUserMessage.id,
                                channel_id: thread.id,
                                guild_id: discord.guildId,
                            },
                        })];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'ok',
                            timeout: 6000,
                        })];
                case 9:
                    _b.sent();
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 10:
                    threadText = _b.sent();
                    (0, vitest_1.expect)(threadText).toContain('first message in thread');
                    (0, vitest_1.expect)(threadText).toContain('Reply with exactly: reply-context-check');
                    (0, vitest_1.expect)(threadText).toContain('⬥ ok');
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('new thread uses channel model when channel model preference is set', function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, thread, messages, footerMessage, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.delete(schema.channel_agents).where(orm.eq(schema.channel_agents.channel_id, TEXT_CHANNEL_ID))
                        // Set channel model preference — simulates /model selecting a model at channel scope
                    ];
                case 2:
                    _b.sent();
                    // Set channel model preference — simulates /model selecting a model at channel scope
                    return [4 /*yield*/, (0, database_js_1.setChannelModel)({
                            channelId: TEXT_CHANNEL_ID,
                            modelId: "".concat(PROVIDER_NAME, "/").concat(CHANNEL_MODEL),
                        })];
                case 3:
                    // Set channel model preference — simulates /model selecting a model at channel scope
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: channel-model-check',
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: channel-model-check';
                            },
                        })];
                case 5:
                    thread = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '*project',
                            timeout: 4000,
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()];
                case 7:
                    messages = _b.sent();
                    footerMessage = messages.find(function (message) {
                        return (message.author.id === discord.botUserId &&
                            message.content.startsWith('*'));
                    });
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 8:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (agent-model-tester)\n        Reply with exactly: channel-model-check\n        --- from: assistant (TestBot)\n        *using deterministic-provider/channel-model-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 channel-model-v2*\"\n      ");
                    (0, vitest_1.expect)(footerMessage).toBeDefined();
                    if (!footerMessage) {
                        throw new Error("Expected footer message but none found. Bot messages: ".concat(messages
                            .filter(function (m) { return m.author.id === discord.botUserId; })
                            .map(function (m) { return m.content.slice(0, 150); })
                            .join(' | ')));
                    }
                    // Footer should contain the channel model, not the default
                    (0, vitest_1.expect)(footerMessage.content).toContain(CHANNEL_MODEL);
                    (0, vitest_1.expect)(footerMessage.content).not.toContain(DEFAULT_MODEL);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('channel model with variant preference completes without error', function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, thread, messages, footerMessage, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.delete(schema.channel_agents).where(orm.eq(schema.channel_agents.channel_id, TEXT_CHANNEL_ID))
                        // Set channel model with a variant (thinking level)
                        // The deterministic provider doesn't support thinking, so the variant
                        // is resolved but silently dropped (no matching thinking values).
                        // This test verifies the variant cascade code path runs without crashing
                        // and the correct model still appears in the footer.
                    ];
                case 2:
                    _b.sent();
                    // Set channel model with a variant (thinking level)
                    // The deterministic provider doesn't support thinking, so the variant
                    // is resolved but silently dropped (no matching thinking values).
                    // This test verifies the variant cascade code path runs without crashing
                    // and the correct model still appears in the footer.
                    return [4 /*yield*/, (0, database_js_1.setChannelModel)({
                            channelId: TEXT_CHANNEL_ID,
                            modelId: "".concat(PROVIDER_NAME, "/").concat(CHANNEL_MODEL),
                            variant: 'high',
                        })];
                case 3:
                    // Set channel model with a variant (thinking level)
                    // The deterministic provider doesn't support thinking, so the variant
                    // is resolved but silently dropped (no matching thinking values).
                    // This test verifies the variant cascade code path runs without crashing
                    // and the correct model still appears in the footer.
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: variant-check',
                        })];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: variant-check';
                            },
                        })];
                case 5:
                    thread = _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '*project',
                            timeout: 4000,
                        })];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()];
                case 7:
                    messages = _b.sent();
                    footerMessage = messages.find(function (message) {
                        return (message.author.id === discord.botUserId &&
                            message.content.startsWith('*'));
                    });
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 8:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (agent-model-tester)\n        Reply with exactly: variant-check\n        --- from: assistant (TestBot)\n        *using deterministic-provider/channel-model-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 channel-model-v2*\"\n      ");
                    (0, vitest_1.expect)(footerMessage).toBeDefined();
                    if (!footerMessage) {
                        throw new Error("Expected footer message but none found. Bot messages: ".concat(messages
                            .filter(function (m) { return m.author.id === discord.botUserId; })
                            .map(function (m) { return m.content.slice(0, 150); })
                            .join(' | ')));
                    }
                    // Footer should still contain the channel model (variant doesn't crash)
                    (0, vitest_1.expect)(footerMessage.content).toContain(CHANNEL_MODEL);
                    (0, vitest_1.expect)(footerMessage.content).not.toContain(DEFAULT_MODEL);
                    return [2 /*return*/];
            }
        });
    }); }, 15000);
    (0, vitest_1.test)('changing channel agent via /plan-agent does not affect existing thread model', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, firstMessages, firstFooter, interactionId, th, _a, secondMessages, secondFooter;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // 1. Set channel agent to test-agent (uses AGENT_MODEL)
                return [4 /*yield*/, (0, database_js_1.setChannelAgent)(TEXT_CHANNEL_ID, 'test-agent')
                    // 2. Send a message to create a thread
                ];
                case 1:
                    // 1. Set channel agent to test-agent (uses AGENT_MODEL)
                    _b.sent();
                    // 2. Send a message to create a thread
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: first-thread-msg',
                        })];
                case 2:
                    // 2. Send a message to create a thread
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: first-thread-msg';
                            },
                        })
                        // Wait for footer — proves first run completed with test-agent's model
                    ];
                case 3:
                    thread = _b.sent();
                    // Wait for footer — proves first run completed with test-agent's model
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'ok',
                            afterAuthorId: discord.botUserId,
                        })];
                case 4:
                    // Wait for footer — proves first run completed with test-agent's model
                    _b.sent();
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()];
                case 5:
                    firstMessages = _b.sent();
                    firstFooter = firstMessages.find(function (m) {
                        return (m.author.id === discord.botUserId && m.content.startsWith('*'));
                    });
                    (0, vitest_1.expect)(firstFooter).toBeDefined();
                    // Verify the first run used test-agent's model
                    (0, vitest_1.expect)(firstFooter.content).toContain(AGENT_MODEL);
                    return [4 /*yield*/, discord
                            .channel(TEXT_CHANNEL_ID)
                            .user(TEST_USER_ID)
                            .runSlashCommand({ name: 'plan-agent' })];
                case 6:
                    interactionId = (_b.sent()).id;
                    return [4 /*yield*/, discord
                            .channel(TEXT_CHANNEL_ID)
                            .waitForInteractionAck({ interactionId: interactionId, timeout: 4000 })
                        // 4. Send a second message in the EXISTING thread
                    ];
                case 7:
                    _b.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: second-thread-msg',
                        })
                        // Wait for second footer (anchor on the user message, not bot reply)
                    ];
                case 8:
                    _b.sent();
                    // Wait for second footer (anchor on the user message, not bot reply)
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'second-thread-msg',
                            afterAuthorId: TEST_USER_ID,
                        })];
                case 9:
                    // Wait for second footer (anchor on the user message, not bot reply)
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 10:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (agent-model-tester)\n        Reply with exactly: first-thread-msg\n        --- from: assistant (TestBot)\n        *using deterministic-provider/agent-model-v2 \u22C5 test-agent*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 agent-model-v2 \u22C5 **test-agent***\n        --- from: user (agent-model-tester)\n        Reply with exactly: second-thread-msg\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 agent-model-v2 \u22C5 **test-agent***\"\n      ");
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()];
                case 11:
                    secondMessages = _b.sent();
                    secondFooter = __spreadArray([], secondMessages, true).reverse()
                        .find(function (m) {
                        return (m.author.id === discord.botUserId && m.content.startsWith('*'));
                    });
                    (0, vitest_1.expect)(secondFooter).toBeDefined();
                    // The existing thread should still use test-agent's model (AGENT_MODEL),
                    // NOT plan agent's model (PLAN_AGENT_MODEL)
                    (0, vitest_1.expect)(secondFooter.content).toContain(AGENT_MODEL);
                    (0, vitest_1.expect)(secondFooter.content).not.toContain(PLAN_AGENT_MODEL);
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    (0, vitest_1.test)('thread created with no agent keeps default model after channel agent is set', function () { return __awaiter(void 0, void 0, void 0, function () {
        var db, thread, firstMessages, firstFooter, interactionId, _a, secondMessages, secondFooter;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 1:
                    db = _b.sent();
                    return [4 /*yield*/, db.delete(schema.channel_agents).where(orm.eq(schema.channel_agents.channel_id, TEXT_CHANNEL_ID))
                        // Also clear channel model so we get the pure default
                    ];
                case 2:
                    _b.sent();
                    // Also clear channel model so we get the pure default
                    return [4 /*yield*/, db.delete(schema.channel_models).where(orm.eq(schema.channel_models.channel_id, TEXT_CHANNEL_ID))
                        // 1. Send a message to create a thread (no channel agent set)
                    ];
                case 3:
                    // Also clear channel model so we get the pure default
                    _b.sent();
                    // 1. Send a message to create a thread (no channel agent set)
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: default-thread-msg',
                        })];
                case 4:
                    // 1. Send a message to create a thread (no channel agent set)
                    _b.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: default-thread-msg';
                            },
                        })
                        // Wait for footer — should show the default model
                    ];
                case 5:
                    thread = _b.sent();
                    // Wait for footer — should show the default model
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'ok',
                            afterAuthorId: discord.botUserId,
                        })];
                case 6:
                    // Wait for footer — should show the default model
                    _b.sent();
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()];
                case 7:
                    firstMessages = _b.sent();
                    firstFooter = firstMessages.find(function (m) {
                        return (m.author.id === discord.botUserId && m.content.startsWith('*'));
                    });
                    (0, vitest_1.expect)(firstFooter).toBeDefined();
                    // First run uses the default model (no agent set)
                    (0, vitest_1.expect)(firstFooter.content).toContain(DEFAULT_MODEL);
                    (0, vitest_1.expect)(firstFooter.content).not.toContain(AGENT_MODEL);
                    return [4 /*yield*/, discord
                            .channel(TEXT_CHANNEL_ID)
                            .user(TEST_USER_ID)
                            .runSlashCommand({ name: 'test-agent-agent' })];
                case 8:
                    interactionId = (_b.sent()).id;
                    return [4 /*yield*/, discord
                            .channel(TEXT_CHANNEL_ID)
                            .waitForInteractionAck({ interactionId: interactionId, timeout: 4000 })
                        // 3. Send a second message in the EXISTING thread
                    ];
                case 9:
                    _b.sent();
                    // 3. Send a second message in the EXISTING thread
                    return [4 /*yield*/, discord
                            .thread(thread.id)
                            .user(TEST_USER_ID)
                            .sendMessage({
                            content: 'Reply with exactly: default-second-msg',
                        })];
                case 10:
                    // 3. Send a second message in the EXISTING thread
                    _b.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'default-second-msg',
                            afterAuthorId: TEST_USER_ID,
                        })];
                case 11:
                    _b.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 12:
                    _a.apply(void 0, [_b.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (agent-model-tester)\n        Reply with exactly: default-thread-msg\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\n        --- from: user (agent-model-tester)\n        Reply with exactly: default-second-msg\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 deterministic-v2*\"\n      ");
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()];
                case 13:
                    secondMessages = _b.sent();
                    secondFooter = __spreadArray([], secondMessages, true).reverse()
                        .find(function (m) {
                        return (m.author.id === discord.botUserId && m.content.startsWith('*'));
                    });
                    (0, vitest_1.expect)(secondFooter).toBeDefined();
                    // The existing thread should still use the DEFAULT model,
                    // NOT the test-agent's model (AGENT_MODEL)
                    (0, vitest_1.expect)(secondFooter.content).toContain(DEFAULT_MODEL);
                    (0, vitest_1.expect)(secondFooter.content).not.toContain(AGENT_MODEL);
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    (0, vitest_1.test)('/plan-agent inside a thread switches the model for that thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, firstFooter, th, interactionId, _a, secondFooter, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // 1. Start with test-agent on the channel
                return [4 /*yield*/, (0, database_js_1.setChannelAgent)(TEXT_CHANNEL_ID, 'test-agent')
                    // 2. Create a thread — first run uses test-agent's model
                ];
                case 1:
                    // 1. Start with test-agent on the channel
                    _c.sent();
                    // 2. Create a thread — first run uses test-agent's model
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: switch-in-thread-msg',
                        })];
                case 2:
                    // 2. Create a thread — first run uses test-agent's model
                    _c.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: switch-in-thread-msg';
                            },
                        })];
                case 3:
                    thread = _c.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'ok',
                            afterAuthorId: discord.botUserId,
                        })];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()];
                case 5:
                    firstFooter = (_c.sent()).find(function (m) {
                        return (m.author.id === discord.botUserId && m.content.startsWith('*'));
                    });
                    (0, vitest_1.expect)(firstFooter).toBeDefined();
                    (0, vitest_1.expect)(firstFooter.content).toContain(AGENT_MODEL);
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, th
                            .user(TEST_USER_ID)
                            .runSlashCommand({ name: 'plan-agent' })];
                case 6:
                    interactionId = (_c.sent()).id;
                    return [4 /*yield*/, th.waitForInteractionAck({ interactionId: interactionId, timeout: 4000 })
                        // 4. Send a second message in the same thread
                    ];
                case 7:
                    _c.sent();
                    // 4. Send a second message in the same thread
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: after-switch-msg',
                        })];
                case 8:
                    // 4. Send a second message in the same thread
                    _c.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForFooterMessage)({
                            discord: discord,
                            threadId: thread.id,
                            timeout: 4000,
                            afterMessageIncludes: 'after-switch-msg',
                            afterAuthorId: TEST_USER_ID,
                        })];
                case 9:
                    _c.sent();
                    _a = vitest_1.expect;
                    return [4 /*yield*/, discord.thread(thread.id).text()];
                case 10:
                    _a.apply(void 0, [_c.sent()]).toMatchInlineSnapshot("\n        \"--- from: user (agent-model-tester)\n        Reply with exactly: switch-in-thread-msg\n        --- from: assistant (TestBot)\n        *using deterministic-provider/agent-model-v2 \u22C5 test-agent*\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 agent-model-v2 \u22C5 **test-agent***\n        Switched to **plan** agent for this session (was **test-agent**)\n        Model: *deterministic-provider/plan-model-v2*\n        The agent will change on the next message.\n        --- from: user (agent-model-tester)\n        Reply with exactly: after-switch-msg\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        *project \u22C5 main \u22C5 Ns \u22C5 N% \u22C5 plan-model-v2 \u22C5 **plan***\"\n      ");
                    _b = [[]];
                    return [4 /*yield*/, discord.thread(thread.id).getMessages()];
                case 11:
                    secondFooter = __spreadArray.apply(void 0, _b.concat([(_c.sent()), true])).reverse()
                        .find(function (m) {
                        return (m.author.id === discord.botUserId && m.content.startsWith('*'));
                    });
                    (0, vitest_1.expect)(secondFooter).toBeDefined();
                    // After /plan-agent in the thread, model should switch to plan's model
                    (0, vitest_1.expect)(secondFooter.content).toContain(PLAN_AGENT_MODEL);
                    (0, vitest_1.expect)(secondFooter.content).not.toContain(AGENT_MODEL);
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
