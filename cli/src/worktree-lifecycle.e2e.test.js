"use strict";
// E2e test for worktree lifecycle: /new-worktree inside an existing thread,
// then verify the session still works after sdkDirectory switches.
// Validates that handleDirectoryChanged() reconnects the event listener
// so events from the worktree Instance reach the runtime (PR #75 fix).
//
// Uses opencode-deterministic-provider (no real LLM calls).
// Poll timeouts: 4s max, 100ms interval (except worktree creation which
// involves real git operations — 10s timeout there).
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
var thread_session_runtime_js_1 = require("./session-handler/thread-session-runtime.js");
var database_js_1 = require("./database.js");
var hrana_server_js_1 = require("./hrana-server.js");
var opencode_js_1 = require("./opencode.js");
var test_utils_js_1 = require("./test-utils.js");
var worktrees_js_1 = require("./worktrees.js");
var TEST_USER_ID = '200000000000000901';
var TEXT_CHANNEL_ID = '200000000000000902';
var NON_GIT_CHANNEL_ID = '200000000000000903';
// Unique worktree name per run to avoid collisions with leftover worktrees
var WORKTREE_SUFFIX = Date.now().toString(36).slice(-6);
var WORKTREE_NAME = "wt-e2e-".concat(WORKTREE_SUFFIX);
function createRunDirectories() {
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'worktree-lifecycle-e2e');
    node_fs_1.default.mkdirSync(root, { recursive: true });
    var dataDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(root, 'data-'));
    var projectDirectory = node_path_1.default.join(root, 'project');
    var nonGitDirectory = node_path_1.default.join(root, 'non-git-project');
    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
    node_fs_1.default.mkdirSync(nonGitDirectory, { recursive: true });
    return { root: root, dataDir: dataDir, projectDirectory: projectDirectory, nonGitDirectory: nonGitDirectory };
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
/** Initialize a git repo with an initial commit so worktrees can be created. */
function initGitRepo(directory) {
    return __awaiter(this, void 0, void 0, function () {
        var isRepo;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    isRepo = node_fs_1.default.existsSync(node_path_1.default.join(directory, '.git'));
                    if (!isRepo) return [3 /*break*/, 2];
                    // Commit any new/changed files (opencode.json may have been rewritten)
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)('git add -A && git diff --cached --quiet || git commit -m "update"', {
                            cwd: directory,
                        }).catch(function () { return; })];
                case 1:
                    // Commit any new/changed files (opencode.json may have been rewritten)
                    _a.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, (0, worktrees_js_1.execAsync)('git init -b main', { cwd: directory })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)('git config user.email "test@test.com"', { cwd: directory })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)('git config user.name "Test"', { cwd: directory })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)('git add -A && git commit -m "initial"', { cwd: directory })];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function createDeterministicMatchers() {
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
    return [userReplyMatcher];
}
(0, vitest_1.describe)('worktree lifecycle', function () {
    var directories;
    var discord;
    var botClient;
    var previousDefaultVerbosity = null;
    var testStartTime = Date.now();
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var lockPort, digitalDiscordDbPath, providerNpm, opencodeConfig, dbPath, hranaResult, warmup;
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
                            name: 'Worktree E2E Guild',
                            ownerId: TEST_USER_ID,
                        },
                        channels: [
                            {
                                id: TEXT_CHANNEL_ID,
                                name: 'worktree-e2e',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                            {
                                id: NON_GIT_CHANNEL_ID,
                                name: 'non-git-worktree-e2e',
                                type: discord_js_1.ChannelType.GuildText,
                            },
                        ],
                        users: [
                            {
                                id: TEST_USER_ID,
                                username: 'worktree-tester',
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
                        providerName: 'deterministic-provider',
                        providerNpm: providerNpm,
                        model: 'deterministic-v2',
                        smallModel: 'deterministic-v2',
                        settings: {
                            strict: false,
                            matchers: createDeterministicMatchers(),
                        },
                    });
                    node_fs_1.default.writeFileSync(node_path_1.default.join(directories.projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                    node_fs_1.default.writeFileSync(node_path_1.default.join(directories.nonGitDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                    // Initialize git repo after writing opencode.json so the initial commit
                    // includes it. Worktrees require at least one commit.
                    return [4 /*yield*/, initGitRepo(directories.projectDirectory)];
                case 2:
                    // Initialize git repo after writing opencode.json so the initial commit
                    // includes it. Worktrees require at least one commit.
                    _a.sent();
                    dbPath = node_path_1.default.join(directories.dataDir, 'discord-sessions.db');
                    return [4 /*yield*/, (0, hrana_server_js_1.startHranaServer)({ dbPath: dbPath })];
                case 3:
                    hranaResult = _a.sent();
                    if (hranaResult instanceof Error) {
                        throw hranaResult;
                    }
                    process.env['KIMAKI_DB_URL'] = hranaResult;
                    return [4 /*yield*/, (0, database_js_1.initDatabase)()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setBotToken)(discord.botUserId, discord.botToken)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: TEXT_CHANNEL_ID,
                            directory: directories.projectDirectory,
                            channelType: 'text',
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: NON_GIT_CHANNEL_ID,
                            directory: directories.nonGitDirectory,
                            channelType: 'text',
                        })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelVerbosity)(TEXT_CHANNEL_ID, 'tools_and_text')];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelVerbosity)(NON_GIT_CHANNEL_ID, 'tools_and_text')];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelWorktreesEnabled)(NON_GIT_CHANNEL_ID, true)];
                case 10:
                    _a.sent();
                    botClient = createDiscordJsClient({ restUrl: discord.restUrl });
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                            token: discord.botToken,
                            appId: discord.botUserId,
                            discordClient: botClient,
                        })
                        // Pre-warm the opencode server
                    ];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directories.projectDirectory)];
                case 12:
                    warmup = _a.sent();
                    if (warmup instanceof Error) {
                        throw warmup;
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var worktreeBranch_1;
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
                            (0, database_js_1.closeDatabase)().catch(function () { return; }),
                            (0, hrana_server_js_1.stopHranaServer)().catch(function () { return; }),
                            discord === null || discord === void 0 ? void 0 : discord.stop().catch(function () { return; }),
                        ])];
                case 4:
                    _a.sent();
                    delete process.env['KIMAKI_LOCK_PORT'];
                    delete process.env['KIMAKI_DB_URL'];
                    if (previousDefaultVerbosity) {
                        store_js_1.store.setState({ defaultVerbosity: previousDefaultVerbosity });
                    }
                    if (!directories) return [3 /*break*/, 7];
                    worktreeBranch_1 = "opencode/kimaki-".concat(WORKTREE_NAME);
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)("git worktree list --porcelain", { cwd: directories.projectDirectory }).then(function (_a) {
                            var stdout = _a.stdout;
                            // Find and remove any worktree for our test branch
                            var lines = stdout.split('\n');
                            var currentPath = '';
                            for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
                                var line = lines_1[_i];
                                if (line.startsWith('worktree ')) {
                                    currentPath = line.slice('worktree '.length);
                                }
                                if (line.startsWith('branch ') && line.includes(worktreeBranch_1) && currentPath) {
                                    return (0, worktrees_js_1.execAsync)("git worktree remove --force ".concat(JSON.stringify(currentPath)), { cwd: directories.projectDirectory });
                                }
                            }
                        }).catch(function () { return; })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)("git branch -D ".concat(JSON.stringify("opencode/kimaki-".concat(WORKTREE_NAME))), { cwd: directories.projectDirectory }).catch(function () { return; })];
                case 6:
                    _a.sent();
                    node_fs_1.default.rmSync(directories.dataDir, {
                        recursive: true,
                        force: true,
                        maxRetries: 3,
                    });
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    }); }, 5000);
    (0, vitest_1.test)('session responds after /new-worktree switches sdkDirectory in existing thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, runtimeBefore, interactionId, runtimeAfter, text, okCount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // 1. Send a message to create a thread and establish a session
                return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: before-worktree',
                    })];
                case 1:
                    // 1. Send a message to create a thread and establish a session
                    _a.sent();
                    return [4 /*yield*/, discord.channel(TEXT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                return t.name === 'Reply with exactly: before-worktree';
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = discord.thread(thread.id);
                    // Wait for first run to fully complete (footer appears)
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '*project',
                            timeout: 4000,
                        })
                        // Capture runtime — should survive the directory switch
                    ];
                case 3:
                    // Wait for first run to fully complete (footer appears)
                    _a.sent();
                    runtimeBefore = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtimeBefore).toBeDefined();
                    (0, vitest_1.expect)(runtimeBefore.sdkDirectory).toBe(directories.projectDirectory);
                    return [4 /*yield*/, th
                            .user(TEST_USER_ID)
                            .runSlashCommand({
                            name: 'new-worktree',
                            options: [{ name: 'name', type: 3, value: WORKTREE_NAME }],
                        })
                        // Wait for the slash command ack
                    ];
                case 4:
                    interactionId = (_a.sent()).id;
                    // Wait for the slash command ack
                    return [4 /*yield*/, discord
                            .channel(thread.id)
                            .waitForInteractionAck({ interactionId: interactionId, timeout: 4000 })
                        // 3. Wait for worktree to become ready — the background creation
                        // edits the starter message to include the branch name.
                        // Git worktree creation involves real git operations, so allow more time.
                    ];
                case 5:
                    // Wait for the slash command ack
                    _a.sent();
                    // 3. Wait for worktree to become ready — the background creation
                    // edits the starter message to include the branch name.
                    // Git worktree creation involves real git operations, so allow more time.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'Branch:',
                            timeout: 10000,
                        })
                        // 4. Send a message after the worktree is ready.
                        // Without handleDirectoryChanged (PR #75), the event listener is still
                        // subscribed to the old project directory's Instance, so this message
                        // gets processed but the response events never reach the runtime.
                    ];
                case 6:
                    // 3. Wait for worktree to become ready — the background creation
                    // edits the starter message to include the branch name.
                    // Git worktree creation involves real git operations, so allow more time.
                    _a.sent();
                    // 4. Send a message after the worktree is ready.
                    // Without handleDirectoryChanged (PR #75), the event listener is still
                    // subscribed to the old project directory's Instance, so this message
                    // gets processed but the response events never reach the runtime.
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: after-worktree',
                        })
                        // 5. Verify the bot actually responds — this is the core assertion.
                        // If the listener wasn't reconnected, this will time out.
                    ];
                case 7:
                    // 4. Send a message after the worktree is ready.
                    // Without handleDirectoryChanged (PR #75), the event listener is still
                    // subscribed to the old project directory's Instance, so this message
                    // gets processed but the response events never reach the runtime.
                    _a.sent();
                    // 5. Verify the bot actually responds — this is the core assertion.
                    // If the listener wasn't reconnected, this will time out.
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'after-worktree',
                            timeout: 4000,
                        })
                        // Wait for the footer to confirm full completion
                    ];
                case 8:
                    // 5. Verify the bot actually responds — this is the core assertion.
                    // If the listener wasn't reconnected, this will time out.
                    _a.sent();
                    // Wait for the footer to confirm full completion
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: 'deterministic-v2',
                            afterUserMessageIncludes: 'after-worktree',
                            timeout: 4000,
                        })
                        // Runtime instance should be the same (not recreated)
                    ];
                case 9:
                    // Wait for the footer to confirm full completion
                    _a.sent();
                    runtimeAfter = (0, thread_session_runtime_js_1.getRuntime)(thread.id);
                    (0, vitest_1.expect)(runtimeAfter).toBe(runtimeBefore);
                    // sdkDirectory should now point to the worktree path
                    (0, vitest_1.expect)(runtimeAfter.sdkDirectory).not.toBe(directories.projectDirectory);
                    // Folder name drops the `opencode-kimaki-` prefix (branch name keeps it).
                    // See getManagedWorktreeDirectory in worktrees.ts.
                    (0, vitest_1.expect)(runtimeAfter.sdkDirectory).toContain(WORKTREE_NAME);
                    (0, vitest_1.expect)(runtimeAfter.sdkDirectory).toContain("".concat(node_path_1.default.sep, "worktrees").concat(node_path_1.default.sep));
                    return [4 /*yield*/, th.text()];
                case 10:
                    text = _a.sent();
                    (0, vitest_1.expect)(text).toContain('Reply with exactly: before-worktree');
                    (0, vitest_1.expect)(text).toContain('⬥ ok');
                    (0, vitest_1.expect)(text).toContain('Worktree:');
                    (0, vitest_1.expect)(text).toContain('Branch:');
                    (0, vitest_1.expect)(text).toContain('Reply with exactly: after-worktree');
                    okCount = (text.match(/⬥ ok/g) || []).length;
                    (0, vitest_1.expect)(okCount).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    (0, vitest_1.test)('auto-worktrees fall back to normal sessions outside git repositories', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread, th, text, attempt, okCount;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, discord.channel(NON_GIT_CHANNEL_ID).user(TEST_USER_ID).sendMessage({
                        content: 'Reply with exactly: non-git-first',
                    })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, discord.channel(NON_GIT_CHANNEL_ID).waitForThread({
                            timeout: 4000,
                            predicate: function (t) {
                                var _a;
                                return Boolean((_a = t.name) === null || _a === void 0 ? void 0 : _a.includes('Reply with exactly: non-git-first'));
                            },
                        })];
                case 2:
                    thread = _a.sent();
                    th = discord.thread(thread.id);
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotReplyAfterUserMessage)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            userMessageIncludes: 'non-git-first',
                            timeout: 4000,
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, th.user(TEST_USER_ID).sendMessage({
                            content: 'Reply with exactly: non-git-second',
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, test_utils_js_1.waitForBotMessageContaining)({
                            discord: discord,
                            threadId: thread.id,
                            userId: TEST_USER_ID,
                            text: '⬥ ok',
                            afterUserMessageIncludes: 'non-git-second',
                            timeout: 4000,
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, th.text()];
                case 6:
                    text = _a.sent();
                    attempt = 0;
                    _a.label = 7;
                case 7:
                    if (!(attempt < 40)) return [3 /*break*/, 11];
                    if ((text.match(/⬥ ok/g) || []).length >= 2) {
                        return [3 /*break*/, 11];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, th.text()];
                case 9:
                    text = _a.sent();
                    _a.label = 10;
                case 10:
                    attempt++;
                    return [3 /*break*/, 7];
                case 11:
                    (0, vitest_1.expect)(text).toMatchInlineSnapshot("\n        \"--- from: user (worktree-tester)\n        Reply with exactly: non-git-first\n        --- from: assistant (TestBot)\n        *using deterministic-provider/deterministic-v2*\n        --- from: user (worktree-tester)\n        Reply with exactly: non-git-second\n        --- from: assistant (TestBot)\n        \u2B25 ok\n        \u2B25 ok\"\n      ");
                    (0, vitest_1.expect)(text).toContain('Reply with exactly: non-git-first');
                    (0, vitest_1.expect)(text).toContain('Reply with exactly: non-git-second');
                    (0, vitest_1.expect)(text).not.toContain('Worktree creation failed');
                    okCount = (text.match(/⬥ ok/g) || []).length;
                    (0, vitest_1.expect)(okCount).toBe(2);
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
});
