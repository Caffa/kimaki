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
Object.defineProperty(exports, "__esModule", { value: true });
// Regression tests for CLI argument parsing around Discord ID string preservation.
var vitest_1 = require("vitest");
var exec_async_js_1 = require("./exec-async.js");
function parseWithGoke(argv) {
    return __awaiter(this, void 0, void 0, function () {
        var script, stdout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    script = [
                        "import { goke } from 'goke'",
                        'const cli = goke(\'kimaki\')',
                        "cli.command('send', 'Send a message').option('-c, --channel <channelId>', 'Discord channel ID').option('--thread <threadId>', 'Thread ID').option('--session <sessionId>', 'Session ID').option('--send-at <schedule>', 'Schedule')",
                        "cli.command('session archive <threadId>', 'Archive a thread')",
                        "cli.command('session search <query>', 'Search sessions').option('--channel <channelId>', 'Discord channel ID').option('--project <path>', 'Project path')",
                        "cli.command('session export-events-jsonl', 'Export in-memory events to JSONL').option('--session <sessionId>', 'Session ID').option('--out <file>', 'Output path')",
                        "cli.command('add-project', 'Add a project').option('-g, --guild <guildId>', 'Discord guild/server ID')",
                        "cli.command('task delete <id>', 'Delete task')",
                        "cli.command('multioauth anthropic list', 'List stored Anthropic accounts')",
                        "cli.command('multioauth anthropic remove <indexOrEmail>', 'Remove stored Anthropic account')",
                        "cli.command('multioauth openai list', 'List stored OpenAI accounts')",
                        "cli.command('multioauth openai remove <indexOrEmail>', 'Remove stored OpenAI account')",
                        "const result = cli.parse(".concat(JSON.stringify(argv), ", { run: false })"),
                        'process.stdout.write(JSON.stringify({ args: result.args, options: result.options }))',
                    ].join(';');
                    return [4 /*yield*/, (0, exec_async_js_1.execAsync)("node --input-type=module -e ".concat(JSON.stringify(script)), {
                            cwd: import.meta.dirname,
                            timeout: 10000,
                        })];
                case 1:
                    stdout = (_a.sent()).stdout;
                    return [2 /*return*/, JSON.parse(stdout)];
            }
        });
    });
}
function getHelpOutput() {
    return __awaiter(this, void 0, void 0, function () {
        var script, stdout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    script = [
                        "import { goke } from 'goke'",
                        'const stdout = { text: \'\', write(data) { this.text += String(data) } }',
                        "const cli = goke('kimaki', { stdout })",
                        "cli.command('send', 'Send a message')",
                        "cli.command('multioauth list', 'List all OAuth accounts')",
                        "cli.command('multioauth anthropic list', 'List stored Anthropic accounts')",
                        "cli.command('multioauth openai list', 'List stored OpenAI accounts')",
                        'cli.help()',
                        "cli.parse(['node', 'kimaki', '--help'], { run: false })",
                        'process.stdout.write(stdout.text)',
                    ].join(';');
                    return [4 /*yield*/, (0, exec_async_js_1.execAsync)("node --input-type=module -e ".concat(JSON.stringify(script)), {
                            cwd: import.meta.dirname,
                            timeout: 10000,
                        })];
                case 1:
                    stdout = (_a.sent()).stdout;
                    return [2 /*return*/, stdout];
            }
        });
    });
}
(0, vitest_1.describe)('goke CLI ID parsing', function () {
    (0, vitest_1.test)('keeps large Discord IDs as strings', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, threadId, sessionId, channelResult, threadResult, sessionResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channelId = '1234567890123456789';
                    threadId = '9876543210987654321';
                    sessionId = '1111222233334444555';
                    return [4 /*yield*/, parseWithGoke(['node', 'kimaki', 'send', '--channel', channelId])];
                case 1:
                    channelResult = _a.sent();
                    (0, vitest_1.expect)(channelResult.options.channel).toBe(channelId);
                    (0, vitest_1.expect)(typeof channelResult.options.channel).toBe('string');
                    return [4 /*yield*/, parseWithGoke(['node', 'kimaki', 'send', '--thread', threadId])];
                case 2:
                    threadResult = _a.sent();
                    (0, vitest_1.expect)(threadResult.options.thread).toBe(threadId);
                    (0, vitest_1.expect)(typeof threadResult.options.thread).toBe('string');
                    return [4 /*yield*/, parseWithGoke(['node', 'kimaki', 'send', '--session', sessionId])];
                case 3:
                    sessionResult = _a.sent();
                    (0, vitest_1.expect)(sessionResult.options.session).toBe(sessionId);
                    (0, vitest_1.expect)(typeof sessionResult.options.session).toBe('string');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('preserves leading zeros in Discord IDs', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guildId, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    guildId = '001230045600789';
                    return [4 /*yield*/, parseWithGoke(['node', 'kimaki', 'add-project', '--guild', guildId])];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.options.guild).toBe(guildId);
                    (0, vitest_1.expect)(typeof result.options.guild).toBe('string');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('keeps session archive thread ID as string', function () { return __awaiter(void 0, void 0, void 0, function () {
        var threadId, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    threadId = '0098765432109876543';
                    return [4 /*yield*/, parseWithGoke(['node', 'kimaki', 'session', 'archive', threadId])];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.args[0]).toBe(threadId);
                    (0, vitest_1.expect)(typeof result.args[0]).toBe('string');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('keeps session search regex and channel ID as strings', function () { return __awaiter(void 0, void 0, void 0, function () {
        var channelId, query, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    channelId = '0012345678901234567';
                    query = '/error\\s+42/i';
                    return [4 /*yield*/, parseWithGoke(['node', 'kimaki', 'session', 'search', query, '--channel', channelId])];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.args[0]).toBe(query);
                    (0, vitest_1.expect)(typeof result.args[0]).toBe('string');
                    (0, vitest_1.expect)(result.options.channel).toBe(channelId);
                    (0, vitest_1.expect)(typeof result.options.channel).toBe('string');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('keeps session export options as strings', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sessionId, outPath, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sessionId = '001111222233334444';
                    outPath = './tmp/session-events.jsonl';
                    return [4 /*yield*/, parseWithGoke([
                            'node',
                            'kimaki',
                            'session',
                            'export-events-jsonl',
                            '--session',
                            sessionId,
                            '--out',
                            outPath,
                        ])];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.options.session).toBe(sessionId);
                    (0, vitest_1.expect)(typeof result.options.session).toBe('string');
                    (0, vitest_1.expect)(result.options.out).toBe(outPath);
                    (0, vitest_1.expect)(typeof result.options.out).toBe('string');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('keeps --send-at cron string intact', function () { return __awaiter(void 0, void 0, void 0, function () {
        var cron, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cron = '0 9 * * 1';
                    return [4 /*yield*/, parseWithGoke(['node', 'kimaki', 'send', '--send-at', cron])];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.options.sendAt).toBe(cron);
                    (0, vitest_1.expect)(typeof result.options.sendAt).toBe('string');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('keeps task delete ID as string before validation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var taskId, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    taskId = '0012345';
                    return [4 /*yield*/, parseWithGoke(['node', 'kimaki', 'task', 'delete', taskId])];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result.args[0]).toBe(taskId);
                    (0, vitest_1.expect)(typeof result.args[0]).toBe('string');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('multioauth account remove parses index and email as strings', function () { return __awaiter(void 0, void 0, void 0, function () {
        var indexResult, emailResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, parseWithGoke(['node', 'kimaki', 'multioauth', 'anthropic', 'remove', '2'])];
                case 1:
                    indexResult = _a.sent();
                    return [4 /*yield*/, parseWithGoke(['node', 'kimaki', 'multioauth', 'openai', 'remove', 'user@example.com'])];
                case 2:
                    emailResult = _a.sent();
                    (0, vitest_1.expect)(indexResult.args[0]).toBe('2');
                    (0, vitest_1.expect)(typeof indexResult.args[0]).toBe('string');
                    (0, vitest_1.expect)(emailResult.args[0]).toBe('user@example.com');
                    (0, vitest_1.expect)(typeof emailResult.args[0]).toBe('string');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('multioauth commands are included in help output', function () { return __awaiter(void 0, void 0, void 0, function () {
        var stdout;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getHelpOutput()];
                case 1:
                    stdout = _a.sent();
                    (0, vitest_1.expect)(stdout).toContain('send');
                    (0, vitest_1.expect)(stdout).toContain('multioauth');
                    return [2 /*return*/];
            }
        });
    }); });
});
