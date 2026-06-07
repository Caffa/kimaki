"use strict";
// E2e test verifying that the opencode server populates the `finish` field
// on assistant messages. This field is critical for kimaki's footer logic:
// isAssistantMessageNaturalCompletion checks `message.finish !== 'tool-calls'`
// to suppress footers on intermediate tool-call steps.
// When `finish` is missing/null, every completed assistant message gets a
// spurious footer, breaking multi-step tool chains (16 test failures).
//
// Direct SDK test — no Discord layer needed since this is a server-level bug.
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
var opencode_deterministic_provider_1 = require("opencode-deterministic-provider");
var config_js_1 = require("./config.js");
var opencode_js_1 = require("./opencode.js");
var test_utils_js_1 = require("./test-utils.js");
var ROOT = node_path_1.default.resolve(process.cwd(), 'tmp', 'finish-field-e2e');
function createRunDirectories() {
    node_fs_1.default.mkdirSync(ROOT, { recursive: true });
    var dataDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(ROOT, 'data-'));
    var projectDirectory = node_path_1.default.join(ROOT, 'project');
    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
    (0, test_utils_js_1.initTestGitRepo)(projectDirectory);
    return { dataDir: dataDir, projectDirectory: projectDirectory };
}
function createMatchers() {
    // Tool-call step: finish="tool-calls"
    var toolCallMatcher = {
        id: 'finish-tool-call',
        priority: 20,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'FINISH_FIELD_TOOLCALL',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'ft' },
                { type: 'text-delta', id: 'ft', delta: 'calling tool' },
                { type: 'text-end', id: 'ft' },
                {
                    type: 'tool-call',
                    toolCallId: 'finish-bash',
                    toolName: 'bash',
                    input: JSON.stringify({ command: 'echo ok', description: 'test' }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    // Follow-up after tool result: finish="stop"
    var followupMatcher = {
        id: 'finish-followup',
        priority: 21,
        when: {
            lastMessageRole: 'tool',
            latestUserTextIncludes: 'FINISH_FIELD_TOOLCALL',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'ff' },
                { type: 'text-delta', id: 'ff', delta: 'tool done' },
                { type: 'text-end', id: 'ff' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    return [toolCallMatcher, followupMatcher];
}
var client;
var directories;
var testStartTime;
(0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
    var providerNpm, opencodeConfig, getClient;
    return __generator(this, function (_a) {
        switch (_a.label) {
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
                    settings: { strict: false, matchers: createMatchers() },
                });
                node_fs_1.default.writeFileSync(node_path_1.default.join(directories.projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directories.projectDirectory)];
            case 1:
                getClient = _a.sent();
                if (getClient instanceof Error) {
                    throw getClient;
                }
                client = getClient();
                return [2 /*return*/];
        }
    });
}); }, 20000);
(0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, test_utils_js_1.cleanupTestSessions)({
                    projectDirectory: directories.projectDirectory,
                    testStartTime: testStartTime,
                })];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)()];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); }, 5000);
(0, vitest_1.test)('tool-call step has finish="tool-calls", follow-up has finish="stop"', function () { return __awaiter(void 0, void 0, void 0, function () {
    var session, sessionID, maxWait, pollStart, completedAssistants, msgs, finishes;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, client.session.create({
                    directory: directories.projectDirectory,
                    title: 'finish-field-test',
                })];
            case 1:
                session = _a.sent();
                sessionID = session.data.id;
                return [4 /*yield*/, client.session.promptAsync({
                        sessionID: sessionID,
                        directory: directories.projectDirectory,
                        parts: [{ type: 'text', text: 'FINISH_FIELD_TOOLCALL' }],
                    })
                    // Poll until we have 2 completed assistant messages (tool-call + follow-up)
                ];
            case 2:
                _a.sent();
                maxWait = 8000;
                pollStart = Date.now();
                completedAssistants = [];
                _a.label = 3;
            case 3:
                if (!(Date.now() - pollStart < maxWait)) return [3 /*break*/, 6];
                return [4 /*yield*/, client.session.messages({
                        sessionID: sessionID,
                        directory: directories.projectDirectory,
                    })];
            case 4:
                msgs = _a.sent();
                completedAssistants = (msgs.data || [])
                    .filter(function (m) {
                    return m.info.role === 'assistant' && m.info.time.completed;
                })
                    .map(function (m) {
                    var _a;
                    return {
                        finish: (_a = m.info.finish) !== null && _a !== void 0 ? _a : null,
                        partTypes: m.parts.map(function (p) { return p.type; }),
                    };
                });
                if (completedAssistants.length >= 2) {
                    return [3 /*break*/, 6];
                }
                return [4 /*yield*/, new Promise(function (resolve) { setTimeout(resolve, 100); })];
            case 5:
                _a.sent();
                return [3 /*break*/, 3];
            case 6:
                // Snapshot completed assistant messages — finish should NOT be null
                (0, vitest_1.expect)(completedAssistants).toMatchInlineSnapshot("\n    [\n      {\n        \"finish\": \"tool-calls\",\n        \"partTypes\": [\n          \"step-start\",\n          \"text\",\n          \"step-finish\",\n        ],\n      },\n      {\n        \"finish\": \"stop\",\n        \"partTypes\": [\n          \"step-start\",\n          \"text\",\n          \"step-finish\",\n        ],\n      },\n    ]\n  ");
                finishes = completedAssistants.map(function (m) { return m.finish; });
                (0, vitest_1.expect)(finishes).toEqual(['tool-calls', 'stop']);
                return [2 /*return*/];
        }
    });
}); }, 5000);
