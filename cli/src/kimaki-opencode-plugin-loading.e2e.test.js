"use strict";
// E2e test for OpenCode plugin loading.
// Spawns `opencode serve` directly with our plugin in OPENCODE_CONFIG_CONTENT,
// waits for the health endpoint, then checks stderr for plugin errors.
// No Discord infrastructure needed — just the OpenCode server process.
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
var node_child_process_1 = require("node:child_process");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var vitest_1 = require("vitest");
var opencode_js_1 = require("./opencode.js");
var opencode_command_js_1 = require("./opencode-command.js");
var test_utils_js_1 = require("./test-utils.js");
var __dirname = node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url));
function waitForHealth(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var i, response, _c;
        var port = _b.port, _d = _b.maxAttempts, maxAttempts = _d === void 0 ? 30 : _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    i = 0;
                    _e.label = 1;
                case 1:
                    if (!(i < maxAttempts)) return [3 /*break*/, 8];
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fetch("http://127.0.0.1:".concat(port, "/api/health"))];
                case 3:
                    response = _e.sent();
                    if (response.status < 500) {
                        return [2 /*return*/, true];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    _c = _e.sent();
                    return [3 /*break*/, 5];
                case 5: return [4 /*yield*/, new Promise(function (resolve) {
                        setTimeout(resolve, 1000);
                    })];
                case 6:
                    _e.sent();
                    _e.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/, false];
            }
        });
    });
}
(0, vitest_1.test)('opencode server loads plugin without errors', function () { return __awaiter(void 0, void 0, void 0, function () {
    var projectDir, port, pluginPath, stderrLines, isolatedOpencodeRoot, xdgDirectories, _a, command, args, windowsVerbatimArguments, serverProcess, healthy, pluginErrorPatterns_1, errorLines;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                projectDir = node_path_1.default.resolve(process.cwd(), 'tmp', 'plugin-loading-e2e');
                node_fs_1.default.mkdirSync(projectDir, { recursive: true });
                port = (0, test_utils_js_1.chooseLockPort)({ key: 'opencode-plugin-loading-e2e' });
                pluginPath = new URL('../src/kimaki-opencode-plugin.ts', import.meta.url).href;
                stderrLines = [];
                isolatedOpencodeRoot = node_path_1.default.join(projectDir, 'opencode-test-home');
                xdgDirectories = {
                    OPENCODE_CONFIG_DIR: node_path_1.default.join(isolatedOpencodeRoot, '.opencode-kimaki'),
                    XDG_CONFIG_HOME: node_path_1.default.join(isolatedOpencodeRoot, '.config'),
                    XDG_DATA_HOME: node_path_1.default.join(isolatedOpencodeRoot, '.local', 'share'),
                    XDG_CACHE_HOME: node_path_1.default.join(isolatedOpencodeRoot, '.cache'),
                    XDG_STATE_HOME: node_path_1.default.join(isolatedOpencodeRoot, '.local', 'state'),
                };
                node_fs_1.default.mkdirSync(isolatedOpencodeRoot, { recursive: true });
                Object.values(xdgDirectories).forEach(function (directory) {
                    node_fs_1.default.mkdirSync(directory, { recursive: true });
                });
                _a = (0, opencode_command_js_1.getSpawnCommandAndArgs)({
                    resolvedCommand: (0, opencode_js_1.resolveOpencodeCommand)(),
                    baseArgs: ['serve', '--port', port.toString(), '--print-logs', '--log-level', 'DEBUG'],
                }), command = _a.command, args = _a.args, windowsVerbatimArguments = _a.windowsVerbatimArguments;
                serverProcess = (0, node_child_process_1.spawn)(command, args, {
                    stdio: 'pipe',
                    cwd: projectDir,
                    windowsVerbatimArguments: windowsVerbatimArguments,
                    env: __assign(__assign(__assign({}, process.env), { OPENCODE_CONFIG_CONTENT: JSON.stringify({
                            $schema: 'https://opencode.ai/config.json',
                            lsp: false,
                            formatter: false,
                            plugin: [pluginPath],
                        }), OPENCODE_TEST_HOME: isolatedOpencodeRoot }), xdgDirectories),
                });
                (_b = serverProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                    stderrLines.push.apply(stderrLines, data.toString().split('\n').filter(Boolean));
                });
                _c.label = 1;
            case 1:
                _c.trys.push([1, , 3, 4]);
                return [4 /*yield*/, waitForHealth({ port: port })];
            case 2:
                healthy = _c.sent();
                (0, vitest_1.expect)(healthy).toBe(true);
                pluginErrorPatterns_1 = [
                    /plugin.*error/i,
                    /failed to load plugin/i,
                    /cannot find module/i,
                    /ERR_MODULE_NOT_FOUND/i,
                    /plugin.*failed/i,
                    /plugin.*crash/i,
                ];
                errorLines = stderrLines.filter(function (line) {
                    return pluginErrorPatterns_1.some(function (pattern) {
                        return pattern.test(line);
                    });
                });
                (0, vitest_1.expect)(errorLines).toEqual([]);
                return [3 /*break*/, 4];
            case 3:
                serverProcess.kill('SIGTERM');
                return [7 /*endfinally*/];
            case 4: return [2 /*return*/];
        }
    });
}); }, 60000);
