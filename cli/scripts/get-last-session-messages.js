#!/usr/bin/env tsx
"use strict";
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
var v2_1 = require("@opencode-ai/sdk/v2");
var node_child_process_1 = require("node:child_process");
var node_net_1 = require("node:net");
function getOpenPort() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var server = node_net_1.default.createServer();
                    server.listen(0, function () {
                        var address = server.address();
                        if (address && typeof address === 'object') {
                            var port_1 = address.port;
                            server.close(function () {
                                resolve(port_1);
                            });
                        }
                        else {
                            reject(new Error('Failed to get port'));
                        }
                    });
                    server.on('error', reject);
                })];
        });
    });
}
function waitForServer(port_2) {
    return __awaiter(this, arguments, void 0, function (port, maxAttempts) {
        var i, response, _a;
        if (maxAttempts === void 0) { maxAttempts = 30; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < maxAttempts)) return [3 /*break*/, 8];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fetch("http://127.0.0.1:".concat(port, "/api/health"))];
                case 3:
                    response = _b.sent();
                    if (response.status < 500) {
                        return [2 /*return*/, true];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 5: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 1];
                case 8: throw new Error("Server did not start on port ".concat(port, " after ").concat(maxAttempts, " seconds"));
            }
        });
    });
}
function getLastSessionMessages() {
    return __awaiter(this, void 0, void 0, function () {
        var port, baseUrl, opencodeCommand, directory, serverProcess, client, currentProjectResponse, currentProject_1, sessionsResponse, projectSessions, latestSession, messagesResponse, messages, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, getOpenPort()];
                case 1:
                    port = _c.sent();
                    baseUrl = "http://127.0.0.1:".concat(port);
                    console.log("Starting OpenCode server on port ".concat(port, "..."));
                    opencodeCommand = process.env.OPENCODE_PATH || 'opencode';
                    directory = process.cwd();
                    serverProcess = (0, node_child_process_1.spawn)(opencodeCommand, ['serve', '--port', port.toString()], {
                        stdio: 'pipe',
                        detached: false,
                        cwd: directory,
                        env: __assign(__assign({}, process.env), { OPENCODE_PORT: port.toString() }),
                    });
                    (_a = serverProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                        console.log("[opencode]: ".concat(data.toString().trim()));
                    });
                    (_b = serverProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                        console.error("[opencode error]: ".concat(data.toString().trim()));
                    });
                    serverProcess.on('error', function (error) {
                        console.error('Failed to start OpenCode server:', error);
                        process.exit(1);
                    });
                    serverProcess.on('exit', function (code) {
                        console.log("OpenCode server exited with code: ".concat(code));
                    });
                    // Wait for server to be ready
                    return [4 /*yield*/, waitForServer(port)];
                case 2:
                    // Wait for server to be ready
                    _c.sent();
                    client = (0, v2_1.createOpencodeClient)({ baseUrl: baseUrl });
                    console.log('=== Fetching Last Session Messages ===\n');
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 7, 8, 9]);
                    return [4 /*yield*/, client.project.current()];
                case 4:
                    currentProjectResponse = _c.sent();
                    if (!currentProjectResponse.data) {
                        console.error('Failed to fetch current project');
                        return [2 /*return*/];
                    }
                    currentProject_1 = currentProjectResponse.data;
                    console.log("Current Project: ".concat(currentProject_1.id));
                    console.log("Worktree: ".concat(currentProject_1.worktree, "\n"));
                    return [4 /*yield*/, client.session.list()];
                case 5:
                    sessionsResponse = _c.sent();
                    if (!sessionsResponse.data) {
                        console.error('Failed to fetch sessions');
                        return [2 /*return*/];
                    }
                    projectSessions = sessionsResponse.data.filter(function (s) { return s.projectID === currentProject_1.id; });
                    if (projectSessions.length === 0) {
                        console.log('No sessions found for the current project');
                        return [2 /*return*/];
                    }
                    latestSession = projectSessions.sort(function (a, b) { return b.time.updated - a.time.updated; })[0];
                    console.log("Latest Session: \"".concat(latestSession.title, "\""));
                    console.log("Session ID: ".concat(latestSession.id));
                    console.log("Last Updated: ".concat(new Date(latestSession.time.updated).toLocaleString(), "\n"));
                    return [4 /*yield*/, client.session.messages({
                            sessionID: latestSession.id,
                        })];
                case 6:
                    messagesResponse = _c.sent();
                    if (!messagesResponse.data) {
                        console.error('Failed to fetch session messages');
                        return [2 /*return*/];
                    }
                    messages = messagesResponse.data;
                    console.log("Found ".concat(messages.length, " message(s) in the session\n"));
                    // Log the messages as prettified JSON
                    console.log('=== Session Messages (JSON) ===\n');
                    console.log(JSON.stringify(messages, null, 2));
                    return [3 /*break*/, 9];
                case 7:
                    error_1 = _c.sent();
                    console.error('Error fetching session messages:', error_1);
                    serverProcess.kill();
                    process.exit(1);
                    return [3 /*break*/, 9];
                case 8:
                    // Kill the server process when done
                    serverProcess.kill();
                    process.exit(0);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    });
}
getLastSessionMessages().catch(console.error);
