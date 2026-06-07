"use strict";
// Shared setup for queue-advanced e2e test files.
// Extracted so vitest can parallelize the split test files across workers.
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
exports.TEST_USER_ID = void 0;
exports.createRunDirectories = createRunDirectories;
exports.chooseLockPort = chooseLockPort;
exports.createDiscordJsClient = createDiscordJsClient;
exports.createDeterministicMatchers = createDeterministicMatchers;
exports.setupQueueAdvancedSuite = setupQueueAdvancedSuite;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var vitest_1 = require("vitest");
var discord_js_1 = require("discord.js");
var src_1 = require("discord-digital-twin/src");
var opencode_deterministic_provider_1 = require("opencode-deterministic-provider");
var test_utils_js_1 = require("./test-utils.js");
var config_js_1 = require("./config.js");
var store_js_1 = require("./store.js");
var discord_bot_js_1 = require("./discord-bot.js");
var thread_session_runtime_js_1 = require("./session-handler/thread-session-runtime.js");
var database_js_1 = require("./database.js");
var hrana_server_js_1 = require("./hrana-server.js");
var opencode_js_1 = require("./opencode.js");
var test_utils_js_2 = require("./test-utils.js");
function createRunDirectories(_a) {
    var name = _a.name;
    var root = node_path_1.default.resolve(process.cwd(), 'tmp', name);
    node_fs_1.default.mkdirSync(root, { recursive: true });
    var dataDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(root, 'data-'));
    var projectDirectory = node_path_1.default.join(root, 'project');
    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
    (0, test_utils_js_1.initTestGitRepo)(projectDirectory);
    return { root: root, dataDir: dataDir, projectDirectory: projectDirectory };
}
function chooseLockPort(_a) {
    var channelId = _a.channelId;
    var hash = 0;
    for (var i = 0; i < channelId.length; i++) {
        var char = channelId.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return 51000 + (Math.abs(hash) % 2000);
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
    var raceFinalReplyMatcher = {
        id: 'race-final-reply',
        priority: 110,
        when: {
            latestUserTextIncludes: 'Reply with exactly: race-final',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'race-final' },
                { type: 'text-delta', id: 'race-final', delta: 'race-final' },
                { type: 'text-end', id: 'race-final' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 500, 0, 0, 0],
        },
    };
    var slowAbortMatcher = {
        id: 'slow-abort-marker',
        priority: 100,
        when: {
            latestUserTextIncludes: 'SLOW_ABORT_MARKER run long response',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'slow-start' },
                { type: 'text-delta', id: 'slow-start', delta: 'slow-response-started' },
                { type: 'text-end', id: 'slow-start' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 0, 0, 3000, 0],
        },
    };
    var toolFollowupMatcher = {
        id: 'tool-followup',
        priority: 50,
        when: { lastMessageRole: 'tool' },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'tool-followup' },
                { type: 'text-delta', id: 'tool-followup', delta: 'tool done' },
                { type: 'text-end', id: 'tool-followup' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    var userReplyMatcher = {
        id: 'user-reply',
        priority: 10,
        when: {
            lastMessageRole: 'user',
            rawPromptIncludes: 'Reply with exactly:',
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
    var typingRepulseMatcher = {
        id: 'typing-repulse-marker',
        priority: 101,
        when: {
            latestUserTextIncludes: 'TYPING_REPULSE_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'typing-repulse-text' },
                { type: 'text-delta', id: 'typing-repulse-text', delta: 'repulse-first' },
                { type: 'text-end', id: 'typing-repulse-text' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            // Keep the run busy after the first visible assistant message so tests can
            // assert that typing resumes while OpenCode is still working.
            partDelaysMs: [0, 100, 0, 0, 1800],
        },
    };
    var pluginTimeoutSleepMatcher = {
        id: 'plugin-timeout-sleep',
        priority: 100,
        when: {
            latestUserTextIncludes: 'PLUGIN_TIMEOUT_SLEEP_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'sleep-text' },
                { type: 'text-delta', id: 'sleep-text', delta: 'starting sleep 100' },
                { type: 'text-end', id: 'sleep-text' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            partDelaysMs: [0, 0, 0, 0, 100000],
        },
    };
    var permissionTypingMatcher = {
        id: 'permission-typing-marker',
        priority: 105,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'PERMISSION_TYPING_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'permission-typing-start' },
                {
                    type: 'text-delta',
                    id: 'permission-typing-start',
                    delta: 'requesting external read permission',
                },
                { type: 'text-end', id: 'permission-typing-start' },
                {
                    type: 'tool-call',
                    toolCallId: 'permission-typing-read-call',
                    toolName: 'read',
                    input: JSON.stringify({
                        filePath: '/Users/morse/.zprofile',
                    }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    var permissionTypingFollowupMatcher = {
        id: 'permission-typing-followup',
        priority: 104,
        when: {
            latestUserTextIncludes: 'PERMISSION_TYPING_MARKER',
            rawPromptIncludes: 'requesting external read permission',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'permission-typing-followup' },
                {
                    type: 'text-delta',
                    id: 'permission-typing-followup',
                    delta: 'permission-flow-done',
                },
                { type: 'text-end', id: 'permission-typing-followup' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
            // Keep run busy long enough after permission reply so typing keepalive
            // must pulse again. This makes typing resume assertions deterministic.
            partDelaysMs: [0, 0, 0, 0, 8000],
        },
    };
    var actionButtonClickFollowupMatcher = {
        id: 'action-button-click-followup',
        priority: 109,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'User clicked: Continue action-buttons flow',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'action-button-click-followup' },
                {
                    type: 'text-delta',
                    id: 'action-button-click-followup',
                    delta: 'action-buttons-click-continued',
                },
                { type: 'text-end', id: 'action-button-click-followup' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    // Question tool: model asks a question, user answers via text, model follows up
    var questionToolMatcher = {
        id: 'question-text-answer-marker',
        priority: 106,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'QUESTION_TEXT_ANSWER_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                {
                    type: 'tool-call',
                    toolCallId: 'question-text-answer-call',
                    toolName: 'question',
                    input: JSON.stringify({
                        questions: [{
                                question: 'Which option do you prefer?',
                                header: 'Pick one',
                                options: [
                                    { label: 'Alpha', description: 'Alpha option' },
                                    { label: 'Beta', description: 'Beta option' },
                                ],
                            }],
                    }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    // Question tool for select+queue drain test: model asks a question via dropdown,
    // user answers via select menu while a message is queued.
    var questionSelectQueueMatcher = {
        id: 'question-select-queue-marker',
        priority: 107,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'QUESTION_SELECT_QUEUE_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                {
                    type: 'tool-call',
                    toolCallId: 'question-select-queue-call',
                    toolName: 'question',
                    input: JSON.stringify({
                        questions: [{
                                question: 'How to proceed?',
                                header: 'Select action',
                                options: [
                                    { label: 'Alpha', description: 'Alpha option' },
                                    { label: 'Beta', description: 'Beta option' },
                                ],
                            }],
                    }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    // Model responds with text + tool call, then after tool result the
    // follow-up matcher responds with text. This creates two assistant messages:
    // first with finish="tool-calls" + completed, second with finish="stop".
    // Reproduces the bug where the first message gets no footer even though
    // it completed normally (isAssistantMessageNaturalCompletion rejects
    // finish="tool-calls").
    var toolCallFooterMatcher = {
        id: 'tool-call-footer',
        priority: 108,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'TOOL_CALL_FOOTER_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'tool-call-footer-text' },
                { type: 'text-delta', id: 'tool-call-footer-text', delta: 'running tool' },
                { type: 'text-end', id: 'tool-call-footer-text' },
                {
                    type: 'tool-call',
                    toolCallId: 'tool-call-footer-bash',
                    toolName: 'bash',
                    input: JSON.stringify({
                        command: 'echo tool-call-footer-test',
                        description: 'Echo for footer test',
                    }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    var toolCallFooterFollowupMatcher = {
        id: 'tool-call-footer-followup',
        priority: 109,
        when: {
            lastMessageRole: 'tool',
            latestUserTextIncludes: 'TOOL_CALL_FOOTER_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'tool-call-footer-followup' },
                { type: 'text-delta', id: 'tool-call-footer-followup', delta: 'tool call completed' },
                { type: 'text-end', id: 'tool-call-footer-followup' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    var undoFileMatcher = {
        id: 'undo-file-marker',
        priority: 111,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'UNDO_FILE_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'undo-file-text' },
                { type: 'text-delta', id: 'undo-file-text', delta: 'creating undo file' },
                { type: 'text-end', id: 'undo-file-text' },
                {
                    type: 'tool-call',
                    toolCallId: 'undo-file-bash',
                    toolName: 'bash',
                    input: JSON.stringify({
                        command: 'mkdir -p tmp && printf created > tmp/undo-marker.txt',
                        description: 'Create undo marker file',
                    }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    var undoFileFollowupMatcher = {
        id: 'undo-file-followup',
        priority: 112,
        when: {
            latestUserTextIncludes: 'UNDO_FILE_MARKER',
            rawPromptIncludes: 'creating undo file',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'undo-file-followup' },
                { type: 'text-delta', id: 'undo-file-followup', delta: 'undo file created' },
                { type: 'text-end', id: 'undo-file-followup' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
                },
            ],
        },
    };
    // Multi-step tool chain: model emits text + 3 parallel tool calls in one
    // response (finish="tool-calls"). All tools complete, then the follow-up
    // matcher responds with final text (finish="stop"). This creates 2 assistant
    // messages — one with finish="tool-calls" + completed, one with finish="stop".
    // With the naive fix (allowing tool-calls as natural completion), we'd get
    // 2 footers. Only the final text response should get a footer.
    var multiToolMatcher = {
        id: 'multi-tool',
        priority: 115,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'MULTI_TOOL_FOOTER_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'multi-tool-text' },
                { type: 'text-delta', id: 'multi-tool-text', delta: 'investigating the issue' },
                { type: 'text-end', id: 'multi-tool-text' },
                {
                    type: 'tool-call',
                    toolCallId: 'multi-tool-bash-1',
                    toolName: 'bash',
                    input: JSON.stringify({
                        command: 'echo search-done',
                        description: 'Search codebase',
                    }),
                },
                {
                    type: 'tool-call',
                    toolCallId: 'multi-tool-bash-2',
                    toolName: 'bash',
                    input: JSON.stringify({
                        command: 'echo read-done',
                        description: 'Read config file',
                    }),
                },
                {
                    type: 'tool-call',
                    toolCallId: 'multi-tool-bash-3',
                    toolName: 'bash',
                    input: JSON.stringify({
                        command: 'echo fix-done',
                        description: 'Apply fix',
                    }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: { inputTokens: 10, outputTokens: 15, totalTokens: 25 },
                },
            ],
        },
    };
    var multiToolFollowupMatcher = {
        id: 'multi-tool-followup',
        priority: 114,
        when: {
            latestUserTextIncludes: 'MULTI_TOOL_FOOTER_MARKER',
            rawPromptIncludes: 'investigating the issue',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'multi-tool-followup-text' },
                { type: 'text-delta', id: 'multi-tool-followup-text', delta: 'all done, fixed 3 files' },
                { type: 'text-end', id: 'multi-tool-followup-text' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 30, outputTokens: 10, totalTokens: 40 },
                },
            ],
        },
    };
    // Multi-step sequential tool chain: 3 separate tool-call steps (each a
    // separate assistant message with finish="tool-calls"), then a final text
    // response. This creates 4 assistant messages total. Without proper
    // deferred footer logic, each tool-call step would emit its own footer,
    // producing 3 spurious footers before the real one.
    //
    // Flow: user → step1 (text + tool-call) → tool result →
    //       step2 (text + tool-call) → tool result →
    //       step3 (text + tool-call) → tool result →
    //       final text (finish="stop")
    //
    // Matcher priority ensures each step fires in order: the highest-priority
    // matcher that matches wins, and each step's rawPromptIncludes check only
    // matches once the previous step's output text is in the conversation.
    var multiStepChainInitMatcher = {
        id: 'multi-step-chain-init',
        priority: 119,
        when: {
            lastMessageRole: 'user',
            latestUserTextIncludes: 'MULTI_STEP_CHAIN_MARKER',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'chain-step1-text' },
                { type: 'text-delta', id: 'chain-step1-text', delta: 'chain step 1: reading config' },
                { type: 'text-end', id: 'chain-step1-text' },
                {
                    type: 'tool-call',
                    toolCallId: 'chain-step1-bash',
                    toolName: 'bash',
                    input: JSON.stringify({
                        command: 'echo chain-step-1-output',
                        description: 'Read config',
                    }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: { inputTokens: 5, outputTokens: 10, totalTokens: 15 },
                },
            ],
        },
    };
    var multiStepChainStep2Matcher = {
        id: 'multi-step-chain-step2',
        priority: 120,
        when: {
            latestUserTextIncludes: 'MULTI_STEP_CHAIN_MARKER',
            rawPromptIncludes: 'chain step 1: reading config',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'chain-step2-text' },
                { type: 'text-delta', id: 'chain-step2-text', delta: 'chain step 2: analyzing results' },
                { type: 'text-end', id: 'chain-step2-text' },
                {
                    type: 'tool-call',
                    toolCallId: 'chain-step2-bash',
                    toolName: 'bash',
                    input: JSON.stringify({
                        command: 'echo chain-step-2-output',
                        description: 'Analyze results',
                    }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: { inputTokens: 15, outputTokens: 10, totalTokens: 25 },
                },
            ],
        },
    };
    var multiStepChainStep3Matcher = {
        id: 'multi-step-chain-step3',
        priority: 121,
        when: {
            latestUserTextIncludes: 'MULTI_STEP_CHAIN_MARKER',
            rawPromptIncludes: 'chain step 2: analyzing results',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'chain-step3-text' },
                { type: 'text-delta', id: 'chain-step3-text', delta: 'chain step 3: applying fix' },
                { type: 'text-end', id: 'chain-step3-text' },
                {
                    type: 'tool-call',
                    toolCallId: 'chain-step3-bash',
                    toolName: 'bash',
                    input: JSON.stringify({
                        command: 'echo chain-step-3-output',
                        description: 'Apply fix',
                    }),
                },
                {
                    type: 'finish',
                    finishReason: 'tool-calls',
                    usage: { inputTokens: 25, outputTokens: 10, totalTokens: 35 },
                },
            ],
        },
    };
    var multiStepChainFinalMatcher = {
        id: 'multi-step-chain-final',
        priority: 122,
        when: {
            latestUserTextIncludes: 'MULTI_STEP_CHAIN_MARKER',
            rawPromptIncludes: 'chain step 3: applying fix',
        },
        then: {
            parts: [
                { type: 'stream-start', warnings: [] },
                { type: 'text-start', id: 'chain-final-text' },
                { type: 'text-delta', id: 'chain-final-text', delta: 'chain complete: all 3 steps done' },
                { type: 'text-end', id: 'chain-final-text' },
                {
                    type: 'finish',
                    finishReason: 'stop',
                    usage: { inputTokens: 35, outputTokens: 5, totalTokens: 40 },
                },
            ],
        },
    };
    return [
        slowAbortMatcher,
        typingRepulseMatcher,
        pluginTimeoutSleepMatcher,
        actionButtonClickFollowupMatcher,
        questionToolMatcher,
        questionSelectQueueMatcher,
        permissionTypingMatcher,
        permissionTypingFollowupMatcher,
        multiToolMatcher,
        multiToolFollowupMatcher,
        undoFileMatcher,
        undoFileFollowupMatcher,
        multiStepChainInitMatcher,
        multiStepChainStep2Matcher,
        multiStepChainStep3Matcher,
        multiStepChainFinalMatcher,
        raceFinalReplyMatcher,
        toolCallFooterMatcher,
        toolCallFooterFollowupMatcher,
        toolFollowupMatcher,
        userReplyMatcher,
    ];
}
exports.TEST_USER_ID = '200000000000000991';
/**
 * Sets up a full queue-advanced e2e environment: digital-twin Discord server,
 * opencode deterministic provider, database, bot client.
 * Each caller should use a unique channelId and dirName to avoid collisions
 * when vitest runs files in parallel.
 */
function setupQueueAdvancedSuite(_a) {
    var _this = this;
    var channelId = _a.channelId, channelName = _a.channelName, dirName = _a.dirName, username = _a.username;
    var ctx = {
        directories: undefined,
        discord: undefined,
        botClient: undefined,
        testStartTime: Date.now(),
    };
    var previousDefaultVerbosity = null;
    (0, vitest_1.beforeAll)(function () { return __awaiter(_this, void 0, void 0, function () {
        var lockPort, sessionEventsDir, digitalDiscordDbPath, providerNpm, opencodeConfig, dbPath, hranaResult, channelVerbosity, warmup;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ctx.testStartTime = Date.now();
                    ctx.directories = createRunDirectories({ name: dirName });
                    lockPort = chooseLockPort({ channelId: channelId });
                    sessionEventsDir = node_path_1.default.join(ctx.directories.root, 'opencode-session-events');
                    node_fs_1.default.mkdirSync(sessionEventsDir, { recursive: true });
                    process.env['KIMAKI_LOCK_PORT'] = String(lockPort);
                    process.env['KIMAKI_INTERRUPT_STEP_TIMEOUT_MS'] = '500';
                    process.env['KIMAKI_LOG_OPENCODE_SESSION_EVENTS'] = '1';
                    process.env['KIMAKI_OPENCODE_SESSION_EVENTS_DIR'] = sessionEventsDir;
                    (0, config_js_1.setDataDir)(ctx.directories.dataDir);
                    previousDefaultVerbosity = store_js_1.store.getState().defaultVerbosity;
                    store_js_1.store.setState({ defaultVerbosity: 'tools_and_text' });
                    digitalDiscordDbPath = node_path_1.default.join(ctx.directories.dataDir, 'digital-discord.db');
                    ctx.discord = new src_1.DigitalDiscord({
                        guild: { name: "".concat(dirName, " Guild"), ownerId: exports.TEST_USER_ID },
                        channels: [
                            { id: channelId, name: channelName, type: discord_js_1.ChannelType.GuildText },
                        ],
                        users: [{ id: exports.TEST_USER_ID, username: username }],
                        dbUrl: "file:".concat(digitalDiscordDbPath),
                    });
                    return [4 /*yield*/, ctx.discord.start()];
                case 1:
                    _a.sent();
                    providerNpm = node_url_1.default
                        .pathToFileURL(node_path_1.default.resolve(process.cwd(), '..', 'opencode-deterministic-provider', 'src', 'index.ts'))
                        .toString();
                    opencodeConfig = (0, opencode_deterministic_provider_1.buildDeterministicOpencodeConfig)({
                        providerName: 'deterministic-provider',
                        providerNpm: providerNpm,
                        model: 'deterministic-v2',
                        smallModel: 'deterministic-v3',
                        settings: { strict: false, matchers: createDeterministicMatchers() },
                    });
                    node_fs_1.default.writeFileSync(node_path_1.default.join(ctx.directories.projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                    dbPath = node_path_1.default.join(ctx.directories.dataDir, 'discord-sessions.db');
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
                    return [4 /*yield*/, (0, database_js_1.setBotToken)(ctx.discord.botUserId, ctx.discord.botToken)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelDirectory)({
                            channelId: channelId,
                            directory: ctx.directories.projectDirectory,
                            channelType: 'text',
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.setChannelVerbosity)(channelId, 'tools_and_text')];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, database_js_1.getChannelVerbosity)(channelId)];
                case 7:
                    channelVerbosity = _a.sent();
                    (0, vitest_1.expect)(channelVerbosity).toBe('tools_and_text');
                    ctx.botClient = createDiscordJsClient({ restUrl: ctx.discord.restUrl });
                    return [4 /*yield*/, (0, discord_bot_js_1.startDiscordBot)({
                            token: ctx.discord.botToken,
                            appId: ctx.discord.botUserId,
                            discordClient: ctx.botClient,
                        })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(ctx.directories.projectDirectory)];
                case 9:
                    warmup = _a.sent();
                    if (warmup instanceof Error) {
                        throw warmup;
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 20000);
    (0, vitest_1.afterAll)(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!ctx.directories) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, test_utils_js_2.cleanupTestSessions)({
                            projectDirectory: ctx.directories.projectDirectory,
                            testStartTime: ctx.testStartTime,
                        })];
                case 1:
                    _b.sent();
                    _b.label = 2;
                case 2:
                    if (ctx.botClient) {
                        void ctx.botClient.destroy();
                    }
                    return [4 /*yield*/, (0, opencode_js_1.stopOpencodeServer)()];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, Promise.all([
                            (0, database_js_1.closeDatabase)().catch(function () { }),
                            (0, hrana_server_js_1.stopHranaServer)().catch(function () { }),
                            (_a = ctx.discord) === null || _a === void 0 ? void 0 : _a.stop().catch(function () { }),
                        ])];
                case 4:
                    _b.sent();
                    delete process.env['KIMAKI_LOCK_PORT'];
                    delete process.env['KIMAKI_DB_URL'];
                    delete process.env['KIMAKI_INTERRUPT_STEP_TIMEOUT_MS'];
                    delete process.env['KIMAKI_LOG_OPENCODE_SESSION_EVENTS'];
                    delete process.env['KIMAKI_OPENCODE_SESSION_EVENTS_DIR'];
                    if (previousDefaultVerbosity) {
                        store_js_1.store.setState({ defaultVerbosity: previousDefaultVerbosity });
                    }
                    if (ctx.directories) {
                        node_fs_1.default.rmSync(ctx.directories.dataDir, { recursive: true, force: true });
                    }
                    return [2 /*return*/];
            }
        });
    }); }, 5000);
    (0, vitest_1.afterEach)(function () { return __awaiter(_this, void 0, void 0, function () {
        var threadIds, _i, threadIds_1, threadId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    threadIds = __spreadArray([], store_js_1.store.getState().threads.keys(), true);
                    for (_i = 0, threadIds_1 = threadIds; _i < threadIds_1.length; _i++) {
                        threadId = threadIds_1[_i];
                        (0, thread_session_runtime_js_1.disposeRuntime)(threadId);
                    }
                    return [4 /*yield*/, (0, test_utils_js_2.cleanupTestSessions)({
                            projectDirectory: ctx.directories.projectDirectory,
                            testStartTime: ctx.testStartTime,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, 5000);
    return ctx;
}
