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
exports.createVscodeTunnelId = createVscodeTunnelId;
exports.buildCoderaftArgs = buildCoderaftArgs;
exports.getActiveVscodeSession = getActiveVscodeSession;
exports.stopVscode = stopVscode;
exports.startVscode = startVscode;
exports.handleVscodeCommand = handleVscodeCommand;
exports.cleanupAllVscodeSessions = cleanupAllVscodeSessions;
var node_crypto_1 = require("node:crypto");
var node_child_process_1 = require("node:child_process");
var node_net_1 = require("node:net");
var discord_js_1 = require("discord.js");
var client_1 = require("traforo/client");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)('VSCODE');
var SECURE_REPLY_FLAGS = discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS;
var MAX_SESSION_MINUTES = 30;
var MAX_SESSION_MS = MAX_SESSION_MINUTES * 60 * 1000;
var TUNNEL_BASE_DOMAIN = 'kimaki.dev';
var TUNNEL_ID_BYTES = 16;
var READY_TIMEOUT_MS = 60000;
var LOCAL_HOST = '127.0.0.1';
var activeSessions = new Map();
function createVscodeTunnelId() {
    return node_crypto_1.default.randomBytes(TUNNEL_ID_BYTES).toString('hex');
}
function buildCoderaftArgs(_a) {
    var port = _a.port, workingDirectory = _a.workingDirectory;
    return [
        'coderaft',
        '--port',
        String(port),
        '--host',
        LOCAL_HOST,
        '--without-connection-token',
        '--disable-workspace-trust',
        '--default-folder',
        workingDirectory,
    ];
}
function createPortWaiter(_a) {
    var port = _a.port, proc = _a.process, timeoutMs = _a.timeoutMs;
    return new Promise(function (resolve, reject) {
        var maxAttempts = Math.ceil(timeoutMs / 100);
        var attempts = 0;
        var check = function () {
            if (proc.exitCode !== null) {
                reject(new Error("coderaft exited with code ".concat(proc.exitCode, " before becoming ready")));
                return;
            }
            var socket = node_net_1.default.createConnection(port, LOCAL_HOST);
            socket.on('connect', function () {
                socket.destroy();
                resolve();
            });
            socket.on('error', function () {
                socket.destroy();
                attempts += 1;
                if (attempts >= maxAttempts) {
                    reject(new Error("Port ".concat(port, " not reachable after ").concat(timeoutMs, "ms")));
                    return;
                }
                setTimeout(check, 100);
            });
        };
        check();
    });
}
function getAvailablePort() {
    return new Promise(function (resolve, reject) {
        var server = node_net_1.default.createServer();
        server.on('error', reject);
        server.listen(0, LOCAL_HOST, function () {
            var address = server.address();
            if (!address || typeof address === 'string') {
                server.close(function () {
                    reject(new Error('Failed to resolve an available port'));
                });
                return;
            }
            var port = address.port;
            server.close(function (error) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(port);
            });
        });
    });
}
function cleanupSession(session) {
    clearTimeout(session.timeoutTimer);
    try {
        session.tunnelClient.close();
    }
    catch (_a) { }
    if (session.coderaftProcess.exitCode === null) {
        try {
            session.coderaftProcess.kill('SIGTERM');
        }
        catch (_b) { }
    }
}
function getActiveVscodeSession(_a) {
    var sessionKey = _a.sessionKey;
    return activeSessions.get(sessionKey);
}
function stopVscode(_a) {
    var sessionKey = _a.sessionKey;
    var session = activeSessions.get(sessionKey);
    if (!session) {
        return false;
    }
    activeSessions.delete(sessionKey);
    cleanupSession(session);
    logger.log("VS Code stopped (key: ".concat(sessionKey, ")"));
    return true;
}
function startVscode(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var existing, port, tunnelId, args, coderaftProcess, error_1, tunnelClient, error_2, url, timeoutTimer, session;
        var _c, _d;
        var sessionKey = _b.sessionKey, startedBy = _b.startedBy, workingDirectory = _b.workingDirectory;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    existing = activeSessions.get(sessionKey);
                    if (existing) {
                        return [2 /*return*/, existing];
                    }
                    return [4 /*yield*/, getAvailablePort()];
                case 1:
                    port = _e.sent();
                    tunnelId = createVscodeTunnelId();
                    args = buildCoderaftArgs({
                        port: port,
                        workingDirectory: workingDirectory,
                    });
                    coderaftProcess = (0, node_child_process_1.spawn)('bunx', args, {
                        cwd: workingDirectory,
                        stdio: ['ignore', 'pipe', 'pipe'],
                        env: __assign(__assign({}, process.env), { PORT: String(port) }),
                    });
                    (_c = coderaftProcess.stdout) === null || _c === void 0 ? void 0 : _c.on('data', function (data) {
                        logger.log(data.toString().trim());
                    });
                    (_d = coderaftProcess.stderr) === null || _d === void 0 ? void 0 : _d.on('data', function (data) {
                        logger.error(data.toString().trim());
                    });
                    _e.label = 2;
                case 2:
                    _e.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, createPortWaiter({
                            port: port,
                            process: coderaftProcess,
                            timeoutMs: READY_TIMEOUT_MS,
                        })];
                case 3:
                    _e.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _e.sent();
                    if (coderaftProcess.exitCode === null) {
                        coderaftProcess.kill('SIGTERM');
                    }
                    throw error_1;
                case 5:
                    tunnelClient = new client_1.TunnelClient({
                        localPort: port,
                        localHost: LOCAL_HOST,
                        tunnelId: tunnelId,
                        baseDomain: TUNNEL_BASE_DOMAIN,
                    });
                    _e.label = 6;
                case 6:
                    _e.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, Promise.race([
                            tunnelClient.connect(),
                            new Promise(function (_, reject) {
                                setTimeout(function () {
                                    reject(new Error('Tunnel connection timed out after 15s'));
                                }, 15000);
                            }),
                        ])];
                case 7:
                    _e.sent();
                    return [3 /*break*/, 9];
                case 8:
                    error_2 = _e.sent();
                    tunnelClient.close();
                    if (coderaftProcess.exitCode === null) {
                        coderaftProcess.kill('SIGTERM');
                    }
                    throw error_2;
                case 9:
                    url = tunnelClient.url;
                    timeoutTimer = setTimeout(function () {
                        logger.log("VS Code auto-stopped after ".concat(MAX_SESSION_MINUTES, " minutes (key: ").concat(sessionKey, ")"));
                        stopVscode({ sessionKey: sessionKey });
                    }, MAX_SESSION_MS);
                    timeoutTimer.unref();
                    session = {
                        coderaftProcess: coderaftProcess,
                        tunnelClient: tunnelClient,
                        url: url,
                        workingDirectory: workingDirectory,
                        startedBy: startedBy,
                        startedAt: Date.now(),
                        timeoutTimer: timeoutTimer,
                    };
                    coderaftProcess.once('exit', function (code, signal) {
                        var current = activeSessions.get(sessionKey);
                        if (current !== session) {
                            return;
                        }
                        logger.log("VS Code process exited (key: ".concat(sessionKey, ", code: ").concat(code, ", signal: ").concat(signal !== null && signal !== void 0 ? signal : 'none', ")"));
                        stopVscode({ sessionKey: sessionKey });
                    });
                    activeSessions.set(sessionKey, session);
                    logger.log("VS Code started by ".concat(startedBy, ": ").concat(url));
                    return [2 /*return*/, session];
            }
        });
    });
}
function handleVscodeCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, isThread, isTextChannel, resolved, sessionKey, existing, session, error_3;
        var command = _b.command;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel.',
                            flags: SECURE_REPLY_FLAGS,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    isThread = [
                        discord_js_1.ChannelType.PublicThread,
                        discord_js_1.ChannelType.PrivateThread,
                        discord_js_1.ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                    isTextChannel = channel.type === discord_js_1.ChannelType.GuildText;
                    if (!(!isThread && !isTextChannel)) return [3 /*break*/, 4];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a text channel or thread.',
                            flags: SECURE_REPLY_FLAGS,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: channel,
                    })];
                case 5:
                    resolved = _c.sent();
                    if (!!resolved) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory for this channel.',
                            flags: SECURE_REPLY_FLAGS,
                        })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7: return [4 /*yield*/, command.deferReply({ flags: SECURE_REPLY_FLAGS })];
                case 8:
                    _c.sent();
                    sessionKey = channel.id;
                    existing = getActiveVscodeSession({ sessionKey: sessionKey });
                    if (!existing) return [3 /*break*/, 10];
                    return [4 /*yield*/, command.editReply({
                            content: "VS Code is already running for this thread. " +
                                "This unique tunnel auto-stops after ".concat(MAX_SESSION_MINUTES, " minutes from startup.\n") +
                                "".concat(existing.url),
                        })];
                case 9:
                    _c.sent();
                    return [2 /*return*/];
                case 10:
                    _c.trys.push([10, 13, , 15]);
                    return [4 /*yield*/, startVscode({
                            sessionKey: sessionKey,
                            startedBy: command.user.tag,
                            workingDirectory: resolved.workingDirectory,
                        })];
                case 11:
                    session = _c.sent();
                    return [4 /*yield*/, command.editReply({
                            content: "VS Code started for `".concat(session.workingDirectory, "`. ") +
                                "This unique tunnel auto-stops after ".concat(MAX_SESSION_MINUTES, " minutes, so open it before it expires.\n") +
                                "".concat(session.url),
                        })];
                case 12:
                    _c.sent();
                    return [3 /*break*/, 15];
                case 13:
                    error_3 = _c.sent();
                    logger.error('Failed to start VS Code:', error_3);
                    return [4 /*yield*/, command.editReply({
                            content: "Failed to start VS Code: ".concat(error_3 instanceof Error ? error_3.message : String(error_3)),
                        })];
                case 14:
                    _c.sent();
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
}
function cleanupAllVscodeSessions() {
    for (var _i = 0, _a = activeSessions.keys(); _i < _a.length; _i++) {
        var sessionKey = _a[_i];
        stopVscode({ sessionKey: sessionKey });
    }
}
function onProcessExit() {
    cleanupAllVscodeSessions();
}
process.on('SIGINT', onProcessExit);
process.on('SIGTERM', onProcessExit);
process.on('exit', onProcessExit);
