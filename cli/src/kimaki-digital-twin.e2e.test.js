"use strict";
// End-to-end test using discord-digital-twin + real Kimaki bot runtime.
// Verifies onboarding channel creation, message -> thread creation, and assistant reply.
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
var vitest_1 = require("vitest");
var discord_js_1 = require("discord.js");
var src_1 = require("discord-digital-twin/src");
var opencode_cached_provider_1 = require("opencode-cached-provider");
var config_js_1 = require("./config.js");
var discord_bot_js_1 = require("./discord-bot.js");
var database_js_1 = require("./database.js");
var hrana_server_js_1 = require("./hrana-server.js");
var test_utils_js_1 = require("./test-utils.js");
var opencode_js_1 = require("./opencode.js");
var geminiApiKey = process.env['GEMINI_API_KEY'] ||
    process.env['GOOGLE_GENERATIVE_AI_API_KEY'] ||
    '';
var geminiModel = process.env['GEMINI_FLASH_MODEL'] || 'gemini-2.5-flash';
var e2eTest = geminiApiKey.length > 0 ? vitest_1.test : vitest_1.test.skip;
function createRunDirectories() {
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'kimaki-digital-twin-e2e');
    node_fs_1.default.mkdirSync(root, { recursive: true });
    var dataDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(root, 'data-'));
    var projectDirectory = node_path_1.default.join(root, 'project');
    var providerCacheDbPath = node_path_1.default.join(root, 'provider-cache.db');
    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
    (0, test_utils_js_1.initTestGitRepo)(projectDirectory);
    return {
        root: root,
        dataDir: dataDir,
        projectDirectory: projectDirectory,
        providerCacheDbPath: providerCacheDbPath,
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
e2eTest('onboarding then message creates thread and assistant reply via digital twin', function () { return __awaiter(void 0, void 0, void 0, function () {
    var testStartTime, directories, lockPort, proxy, testUserId, textChannelId, digitalDiscordDbPath, discord, botClient, opencodeConfig, dbPath, hranaResult, createdThread, botReply;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                testStartTime = Date.now();
                directories = createRunDirectories();
                lockPort = (0, test_utils_js_1.chooseLockPort)({ key: 'kimaki-digital-twin-e2e' });
                process.env['KIMAKI_LOCK_PORT'] = String(lockPort);
                (0, config_js_1.setDataDir)(directories.dataDir);
                proxy = new opencode_cached_provider_1.CachedOpencodeProviderProxy({
                    cacheDbPath: directories.providerCacheDbPath,
                    targetBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                    apiKey: geminiApiKey,
                    cacheMethods: ['POST'],
                });
                testUserId = '100000000000000777';
                textChannelId = '100000000000000778';
                digitalDiscordDbPath = node_path_1.default.join(directories.dataDir, 'digital-discord.db');
                discord = new src_1.DigitalDiscord({
                    guild: {
                        name: 'Kimaki E2E Guild',
                        ownerId: testUserId,
                    },
                    channels: [
                        {
                            id: textChannelId,
                            name: 'kimaki-e2e',
                            type: discord_js_1.ChannelType.GuildText,
                        },
                    ],
                    users: [
                        {
                            id: testUserId,
                            username: 'e2e-user',
                        },
                    ],
                    dbUrl: "file:".concat(digitalDiscordDbPath),
                });
                botClient = null;
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 11, 15]);
                return [4 /*yield*/, Promise.all([proxy.start(), discord.start()])];
            case 2:
                _a.sent();
                opencodeConfig = proxy.buildOpencodeConfig({
                    providerName: 'cached-google',
                    providerNpm: '@ai-sdk/google',
                    model: geminiModel,
                    smallModel: geminiModel,
                });
                node_fs_1.default.writeFileSync(node_path_1.default.join(directories.projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
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
                        channelId: textChannelId,
                        directory: directories.projectDirectory,
                        channelType: 'text',
                    })];
            case 6:
                _a.sent();
                botClient = createDiscordJsClient({ restUrl: discord.restUrl });
                return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                        token: discord.botToken,
                        appId: discord.botUserId,
                        discordClient: botClient,
                    })];
            case 7:
                _a.sent();
                return [4 /*yield*/, discord.channel(textChannelId).user(testUserId).sendMessage({
                        content: 'Reply with exactly: kimaki digital twin ok',
                    })];
            case 8:
                _a.sent();
                return [4 /*yield*/, discord.channel(textChannelId).waitForThread({
                        timeout: 60000,
                        predicate: function (thread) {
                            return thread.name === 'Reply with exactly: kimaki digital twin ok';
                        },
                    })];
            case 9:
                createdThread = _a.sent();
                return [4 /*yield*/, discord.thread(createdThread.id).waitForBotReply({
                        timeout: 120000,
                    })];
            case 10:
                botReply = _a.sent();
                (0, vitest_1.expect)(createdThread.id.length).toBeGreaterThan(0);
                (0, vitest_1.expect)(botReply.content.trim().length).toBeGreaterThan(0);
                return [3 /*break*/, 15];
            case 11: return [4 /*yield*/, (0, test_utils_js_1.cleanupTestSessions)({
                    projectDirectory: directories.projectDirectory,
                    testStartTime: testStartTime,
                })];
            case 12:
                _a.sent();
                if (botClient) {
                    void botClient.destroy();
                }
                return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)()];
            case 13:
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
            case 14:
                _a.sent();
                delete process.env['KIMAKI_LOCK_PORT'];
                delete process.env['KIMAKI_DB_URL'];
                node_fs_1.default.rmSync(directories.dataDir, { recursive: true, force: true });
                return [7 /*endfinally*/];
            case 15: return [2 /*return*/];
        }
    });
}); }, 360000);
