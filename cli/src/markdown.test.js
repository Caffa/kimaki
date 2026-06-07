"use strict";
// Deterministic markdown export tests.
// Uses the shared opencode server manager with the deterministic provider,
// creates sessions with known content, and validates markdown output.
// No dependency on machine-local session state.
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
var errore = require("errore");
var opencode_deterministic_provider_1 = require("opencode-deterministic-provider");
var markdown_js_1 = require("./markdown.js");
var config_js_1 = require("./config.js");
var opencode_js_1 = require("./opencode.js");
var test_utils_js_1 = require("./test-utils.js");
var ROOT = node_path_1.default.resolve(process.cwd(), 'tmp', 'markdown-test');
function createRunDirectories() {
    node_fs_1.default.mkdirSync(ROOT, { recursive: true });
    var dataDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(ROOT, 'data-'));
    var projectDirectory = node_path_1.default.join(ROOT, 'project');
    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
    (0, test_utils_js_1.initTestGitRepo)(projectDirectory);
    return { dataDir: dataDir, projectDirectory: projectDirectory };
}
function createMatchers() {
    var helloMatcher = {
        id: 'hello-reply',
        priority: 100,
        when: { latestUserTextIncludes: 'hello markdown test' },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'hello-text' },
                { type: 'text-delta', id: 'hello-text', delta: 'Hello! This is a deterministic markdown test response.' },
                { type: 'text-end', id: 'hello-text' },
                { type: 'finish', finishReason: 'stop', usage: { inputTokens: 10, outputTokens: 8, totalTokens: 18 } },
            ],
        },
    };
    var defaultMatcher = {
        id: 'default-reply',
        priority: 1,
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'default-text' },
                { type: 'text-delta', id: 'default-text', delta: 'ok' },
                { type: 'text-end', id: 'default-text' },
                { type: 'finish', finishReason: 'stop', usage: { inputTokens: 5, outputTokens: 1, totalTokens: 6 } },
            ],
        },
    };
    return [helloMatcher, defaultMatcher];
}
var client;
var directories;
var testStartTime;
var sessionID;
(0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
    var providerNpm, opencodeConfig, getClient, createResult, maxWait, pollStart, msgs, assistantMsg, hasTextParts;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                testStartTime = Date.now();
                directories = createRunDirectories();
                (0, config_js_1.setDataDir)(directories.dataDir);
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
                        matchers: createMatchers(),
                    },
                });
                node_fs_1.default.writeFileSync(node_path_1.default.join(directories.projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directories.projectDirectory)];
            case 1:
                getClient = _c.sent();
                if (getClient instanceof Error) {
                    throw getClient;
                }
                client = getClient();
                return [4 /*yield*/, client.session.create({
                        directory: directories.projectDirectory,
                        title: 'Markdown Test Session',
                    })];
            case 2:
                createResult = _c.sent();
                sessionID = createResult.data.id;
                // Send prompt and wait for completion (promptAsync returns immediately)
                return [4 /*yield*/, client.session.promptAsync({
                        sessionID: sessionID,
                        directory: directories.projectDirectory,
                        parts: [{ type: 'text', text: 'hello markdown test' }],
                    })
                    // Wait for assistant text parts to be fully written (not just message existence).
                    // The deterministic provider responds instantly but opencode writes parts
                    // asynchronously, so we must poll until non-empty text content appears.
                    // Under parallel test load the server is slower, so use generous timeouts.
                ];
            case 3:
                // Send prompt and wait for completion (promptAsync returns immediately)
                _c.sent();
                maxWait = 15000;
                pollStart = Date.now();
                _c.label = 4;
            case 4:
                if (!(Date.now() - pollStart < maxWait)) return [3 /*break*/, 9];
                return [4 /*yield*/, client.session.messages({
                        sessionID: sessionID,
                        directory: directories.projectDirectory,
                    })];
            case 5:
                msgs = _c.sent();
                assistantMsg = (_a = msgs.data) === null || _a === void 0 ? void 0 : _a.find(function (m) { return m.info.role === 'assistant'; });
                hasTextParts = (_b = assistantMsg === null || assistantMsg === void 0 ? void 0 : assistantMsg.parts) === null || _b === void 0 ? void 0 : _b.some(function (p) {
                    return p.type === 'text' && p.text && !p.synthetic;
                });
                if (!hasTextParts) return [3 /*break*/, 7];
                // Extra wait for step-start and other parts to be flushed
                return [4 /*yield*/, new Promise(function (resolve) {
                        setTimeout(resolve, 500);
                    })];
            case 6:
                // Extra wait for step-start and other parts to be flushed
                _c.sent();
                return [3 /*break*/, 9];
            case 7: return [4 /*yield*/, new Promise(function (resolve) {
                    setTimeout(resolve, 200);
                })];
            case 8:
                _c.sent();
                return [3 /*break*/, 4];
            case 9: return [2 /*return*/];
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
            case 2: return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)()];
            case 3:
                _a.sent();
                if (directories) {
                    node_fs_1.default.rmSync(directories.dataDir, { recursive: true, force: true });
                }
                return [2 /*return*/];
        }
    });
}); }, 5000);
// Strip dynamic parts (timestamps, durations, branch names) for stable assertions
function normalizeMarkdown(md) {
    return md
        // Normalize "Completed in Xs" to a fixed string
        .replace(/\*Completed in [\d.]+[ms]+\*/g, '*Completed in Xs*')
        // Normalize "Duration: Xs" tool timing
        .replace(/\*Duration: [\d.]+[ms]+\*/g, '*Duration: Xs*')
        // Normalize ISO dates in session info
        .replace(/\*\*Created\*\*: .+/g, '**Created**: <date>')
        .replace(/\*\*Updated\*\*: .+/g, '**Updated**: <date>')
        // Normalize opencode version
        .replace(/\*\*OpenCode Version\*\*: v[\d.]+.*/g, '**OpenCode Version**: v<version>')
        // Strip git branch context injected by opencode into user messages
        .replace(/\[Current branch: [^\]]+\]\n?\n?/g, '')
        .replace(/\[current git branch is [^\]]+\]\n?\n?/g, '')
        .replace(/\[warning: repository is in detached HEAD[^\]]*\]\n?\n?/g, '');
}
(0, vitest_1.test)('generate markdown with system info', function () { return __awaiter(void 0, void 0, void 0, function () {
    var exporter, markdownResult, markdown, normalized;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                exporter = new markdown_js_1.ShareMarkdown(client);
                return [4 /*yield*/, exporter.generate({
                        sessionID: sessionID,
                        includeSystemInfo: true,
                    })];
            case 1:
                markdownResult = _a.sent();
                (0, vitest_1.expect)(errore.isOk(markdownResult)).toBe(true);
                markdown = errore.unwrap(markdownResult);
                (0, vitest_1.expect)(markdown).toContain('# Markdown Test Session');
                (0, vitest_1.expect)(markdown).toContain('## Session Information');
                (0, vitest_1.expect)(markdown).toContain('## Conversation');
                (0, vitest_1.expect)(markdown).toContain('### 👤 User');
                (0, vitest_1.expect)(markdown).toContain('hello markdown test');
                (0, vitest_1.expect)(markdown).toContain('### 🤖 Assistant');
                (0, vitest_1.expect)(markdown).toContain('Hello! This is a deterministic markdown test response.');
                (0, vitest_1.expect)(markdown).toContain('**Started using deterministic-provider/deterministic-v2**');
                normalized = normalizeMarkdown(markdown);
                (0, vitest_1.expect)(normalized).toMatchInlineSnapshot("\n    \"# Markdown Test Session\n\n    ## Session Information\n\n    - **Created**: <date>\n    - **Updated**: <date>\n    - **OpenCode Version**: v<version>\n\n    ## Conversation\n\n    ### \uD83D\uDC64 User\n\n    hello markdown test\n\n\n    ### \uD83E\uDD16 Assistant (deterministic-v2)\n\n    **Started using deterministic-provider/deterministic-v2**\n\n    Hello! This is a deterministic markdown test response.\n\n\n    *Completed in Xs*\n    \"\n  ");
                return [2 /*return*/];
        }
    });
}); });
(0, vitest_1.test)('generate markdown without system info', function () { return __awaiter(void 0, void 0, void 0, function () {
    var exporter, markdown, md, normalized;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                exporter = new markdown_js_1.ShareMarkdown(client);
                return [4 /*yield*/, exporter.generate({
                        sessionID: sessionID,
                        includeSystemInfo: false,
                    })];
            case 1:
                markdown = _a.sent();
                (0, vitest_1.expect)(errore.isOk(markdown)).toBe(true);
                md = errore.unwrap(markdown);
                (0, vitest_1.expect)(md).toContain('# Markdown Test Session');
                (0, vitest_1.expect)(md).not.toContain('## Session Information');
                (0, vitest_1.expect)(md).toContain('## Conversation');
                normalized = normalizeMarkdown(md);
                (0, vitest_1.expect)(normalized).toMatchInlineSnapshot("\n    \"# Markdown Test Session\n\n    ## Conversation\n\n    ### \uD83D\uDC64 User\n\n    hello markdown test\n\n\n    ### \uD83E\uDD16 Assistant (deterministic-v2)\n\n    **Started using deterministic-provider/deterministic-v2**\n\n    Hello! This is a deterministic markdown test response.\n\n\n    *Completed in Xs*\n    \"\n  ");
                return [2 /*return*/];
        }
    });
}); });
(0, vitest_1.test)('error handling for non-existent session', function () { return __awaiter(void 0, void 0, void 0, function () {
    var exporter, badSessionID, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                exporter = new markdown_js_1.ShareMarkdown(client);
                badSessionID = 'ses_nonexistent_' + Date.now();
                return [4 /*yield*/, exporter.generate({ sessionID: badSessionID })];
            case 1:
                result = _a.sent();
                (0, vitest_1.expect)(result).toBeInstanceOf(Error);
                (0, vitest_1.expect)(result.message).toContain("Session ".concat(badSessionID, " not found"));
                return [2 /*return*/];
        }
    });
}); });
(0, vitest_1.test)('getCompactSessionContext generates compact format', function () { return __awaiter(void 0, void 0, void 0, function () {
    var contextResult, context;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, markdown_js_1.getCompactSessionContext)({
                    client: client,
                    sessionId: sessionID,
                    includeSystemPrompt: false,
                    maxMessages: 10,
                })];
            case 1:
                contextResult = _a.sent();
                (0, vitest_1.expect)(errore.isOk(contextResult)).toBe(true);
                context = errore.unwrap(contextResult);
                (0, vitest_1.expect)(context).toBeTruthy();
                // User text may be prefixed with branch context injected by opencode
                (0, vitest_1.expect)(context).toContain('hello markdown test');
                (0, vitest_1.expect)(context).toContain('[User]:');
                (0, vitest_1.expect)(context).toContain('[Assistant]:');
                (0, vitest_1.expect)(context).toContain('Hello! This is a deterministic markdown test response.');
                (0, vitest_1.expect)(context).not.toContain('[System Prompt]');
                return [2 /*return*/];
        }
    });
}); });
(0, vitest_1.test)('generate markdown with lastAssistantOnly', function () { return __awaiter(void 0, void 0, void 0, function () {
    var exporter, markdownResult, markdown;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                exporter = new markdown_js_1.ShareMarkdown(client);
                return [4 /*yield*/, exporter.generate({
                        sessionID: sessionID,
                        lastAssistantOnly: true,
                    })];
            case 1:
                markdownResult = _a.sent();
                (0, vitest_1.expect)(errore.isOk(markdownResult)).toBe(true);
                markdown = errore.unwrap(markdownResult);
                // lastAssistantOnly should NOT include title header or conversation section header
                (0, vitest_1.expect)(markdown).not.toContain('# Markdown Test Session');
                (0, vitest_1.expect)(markdown).not.toContain('## Conversation');
                // Should contain the assistant response
                (0, vitest_1.expect)(markdown).toContain('Hello! This is a deterministic markdown test response.');
                return [2 /*return*/];
        }
    });
}); });
