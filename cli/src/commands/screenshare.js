"use strict";
// /screenshare command - Start screen sharing via VNC + WebSocket bridge + kimaki tunnel.
// On macOS: uses built-in Screen Sharing (port 5900).
// On Linux: spawns x11vnc against the current $DISPLAY.
// Exposes the VNC stream via an in-process websockify bridge and a traforo tunnel,
// then sends the user a noVNC URL they can open in a browser.
//
// /screenshare-stop command - Stops the active screen share for this guild.
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
exports.buildNoVncUrl = buildNoVncUrl;
exports.createScreenshareTunnelId = createScreenshareTunnelId;
exports.ensureMacRemoteManagement = ensureMacRemoteManagement;
exports.spawnX11Vnc = spawnX11Vnc;
exports.cleanupSession = cleanupSession;
exports.startScreenshare = startScreenshare;
exports.stopScreenshare = stopScreenshare;
exports.handleScreenshareCommand = handleScreenshareCommand;
exports.handleScreenshareStopCommand = handleScreenshareStopCommand;
exports.cleanupAllScreenshares = cleanupAllScreenshares;
var discord_js_1 = require("discord.js");
var node_crypto_1 = require("node:crypto");
var node_child_process_1 = require("node:child_process");
var node_net_1 = require("node:net");
var client_1 = require("traforo/client");
var discord_utils_js_1 = require("../discord-utils.js");
var websockify_js_1 = require("../websockify.js");
var logger_js_1 = require("../logger.js");
var worktrees_js_1 = require("../worktrees.js");
var logger = (0, logger_js_1.createLogger)('SCREEN');
var SECURE_REPLY_FLAGS = discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS;
/** One active screenshare per guild (Discord) or per machine (CLI) */
var activeSessions = new Map();
var VNC_PORT = 5900;
var MAX_SESSION_MINUTES = 30;
var MAX_SESSION_MS = MAX_SESSION_MINUTES * 60 * 1000;
var TUNNEL_BASE_DOMAIN = 'kimaki.dev';
var SCREENSHARE_TUNNEL_ID_BYTES = 16;
// Public noVNC client — we point it at our tunnel URL
function buildNoVncUrl(_a) {
    var tunnelHost = _a.tunnelHost;
    var params = new URLSearchParams({
        autoconnect: 'true',
        host: tunnelHost,
        port: '443',
        encrypt: '1',
        resize: 'scale',
        view_only: 'false',
    });
    return "https://novnc.com/noVNC/vnc.html?".concat(params.toString());
}
function createScreenshareTunnelId() {
    return node_crypto_1.default.randomBytes(SCREENSHARE_TUNNEL_ID_BYTES).toString('hex');
}
// macOS has two separate services:
// - "Screen Sharing" = view-only VNC (com.apple.screensharing)
// - "Remote Management" = full control VNC with mouse/keyboard (ARDAgent)
// We need Remote Management for interactive control, not just Screen Sharing.
function ensureMacRemoteManagement() {
    return __awaiter(this, void 0, void 0, function () {
        var stdout, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)('netstat -an | grep "\\.5900 " | grep LISTEN', { timeout: 5000 })];
                case 1:
                    stdout = (_b.sent()).stdout;
                    if (stdout.trim()) {
                        return [2 /*return*/];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    return [3 /*break*/, 3];
                case 3: throw new Error('macOS Remote Management is not enabled.\n' +
                    'Enable it: **System Settings > General > Sharing > Remote Management**\n' +
                    'Make sure "VNC viewers may control screen with password" is enabled.\n' +
                    'Or via terminal:\n' +
                    '```\nsudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart \\\n' +
                    '  -activate -configure -allowAccessFor -allUsers -privs -all \\\n' +
                    '  -clientopts -setvnclegacy -vnclegacy yes \\\n' +
                    '  -restart -agent -console\n```');
            }
        });
    });
}
function spawnX11Vnc() {
    var _a, _b;
    var display = process.env['DISPLAY'] || ':0';
    var child = (0, node_child_process_1.spawn)('x11vnc', [
        '-display', display,
        '-nopw',
        '-localhost',
        '-rfbport', String(VNC_PORT),
        '-shared',
        '-forever',
    ], {
        stdio: ['ignore', 'pipe', 'pipe'],
    });
    (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
        logger.log("x11vnc: ".concat(data.toString().trim()));
    });
    (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
        logger.error("x11vnc: ".concat(data.toString().trim()));
    });
    return child;
}
function waitForPort(_a) {
    var port = _a.port, proc = _a.process, timeoutMs = _a.timeoutMs;
    return new Promise(function (resolve, reject) {
        var maxAttempts = Math.ceil(timeoutMs / 100);
        var attempts = 0;
        var check = function () {
            if (proc.exitCode !== null) {
                reject(new Error("x11vnc exited with code ".concat(proc.exitCode, " before becoming ready")));
                return;
            }
            var sock = node_net_1.default.createConnection(port, 'localhost');
            sock.on('connect', function () {
                sock.destroy();
                resolve();
            });
            sock.on('error', function () {
                sock.destroy();
                if (++attempts >= maxAttempts) {
                    reject(new Error("Port ".concat(port, " not reachable after ").concat(timeoutMs, "ms")));
                }
                else {
                    setTimeout(check, 100);
                }
            });
        };
        check();
    });
}
function cleanupSession(session) {
    clearTimeout(session.timeoutTimer);
    try {
        session.tunnelClient.close();
    }
    catch (_a) { }
    try {
        session.wss.close();
    }
    catch (_b) { }
    if (session.vncProcess) {
        try {
            session.vncProcess.kill();
        }
        catch (_c) { }
    }
}
/**
 * Core screenshare start logic, reused by both Discord command and CLI.
 * Returns the session or throws on failure.
 */
function startScreenshare(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var existing, platform, vncProcess, _c, wsInstance, err_1, tunnelId, tunnelClient, err_2, tunnelHost, tunnelUrl, noVncUrl, timeoutTimer, session;
        var sessionKey = _b.sessionKey, startedBy = _b.startedBy;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    existing = activeSessions.get(sessionKey);
                    if (existing) {
                        throw new Error("Screen sharing is already active: ".concat(existing.noVncUrl));
                    }
                    platform = process.platform;
                    if (!(platform === 'darwin')) return [3 /*break*/, 2];
                    return [4 /*yield*/, ensureMacRemoteManagement()];
                case 1:
                    _d.sent();
                    return [3 /*break*/, 9];
                case 2:
                    if (!(platform === 'linux')) return [3 /*break*/, 8];
                    if (!process.env['DISPLAY']) {
                        throw new Error('No $DISPLAY found. Screen sharing requires a running X11 display.');
                    }
                    _d.label = 3;
                case 3:
                    _d.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)('which x11vnc', { timeout: 3000 })];
                case 4:
                    _d.sent();
                    return [3 /*break*/, 6];
                case 5:
                    _c = _d.sent();
                    throw new Error('x11vnc is not installed. Install it with: sudo apt install x11vnc');
                case 6:
                    vncProcess = spawnX11Vnc();
                    // Wait for x11vnc to actually be ready (port 5900 accepting connections)
                    // instead of a blind 1s sleep. Polls every 100ms, fails if process exits first.
                    return [4 /*yield*/, waitForPort({ port: VNC_PORT, process: vncProcess, timeoutMs: 3000 })];
                case 7:
                    // Wait for x11vnc to actually be ready (port 5900 accepting connections)
                    // instead of a blind 1s sleep. Polls every 100ms, fails if process exits first.
                    _d.sent();
                    return [3 /*break*/, 9];
                case 8: throw new Error("Screen sharing is not supported on ".concat(platform, ". Only macOS and Linux are supported."));
                case 9:
                    _d.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, (0, websockify_js_1.startWebsockify)({
                            wsPort: 0,
                            tcpHost: 'localhost',
                            tcpPort: VNC_PORT,
                        })];
                case 10:
                    wsInstance = _d.sent();
                    return [3 /*break*/, 12];
                case 11:
                    err_1 = _d.sent();
                    if (vncProcess) {
                        vncProcess.kill();
                    }
                    throw err_1;
                case 12:
                    tunnelId = createScreenshareTunnelId();
                    tunnelClient = new client_1.TunnelClient({
                        localPort: wsInstance.port,
                        tunnelId: tunnelId,
                        baseDomain: TUNNEL_BASE_DOMAIN,
                    });
                    _d.label = 13;
                case 13:
                    _d.trys.push([13, 15, , 16]);
                    return [4 /*yield*/, Promise.race([
                            tunnelClient.connect(),
                            new Promise(function (_, reject) {
                                setTimeout(function () {
                                    reject(new Error('Tunnel connection timed out after 15s'));
                                }, 15000);
                            }),
                        ])];
                case 14:
                    _d.sent();
                    return [3 /*break*/, 16];
                case 15:
                    err_2 = _d.sent();
                    tunnelClient.close();
                    wsInstance.close();
                    if (vncProcess) {
                        vncProcess.kill();
                    }
                    throw err_2;
                case 16:
                    tunnelHost = "".concat(tunnelId, "-tunnel.").concat(TUNNEL_BASE_DOMAIN);
                    tunnelUrl = "https://".concat(tunnelHost);
                    noVncUrl = buildNoVncUrl({ tunnelHost: tunnelHost });
                    timeoutTimer = setTimeout(function () {
                        logger.log("Screen share auto-stopped after ".concat(MAX_SESSION_MINUTES, " minutes (key: ").concat(sessionKey, ")"));
                        stopScreenshare({ sessionKey: sessionKey });
                    }, MAX_SESSION_MS);
                    // Don't keep the process alive just for this timer
                    timeoutTimer.unref();
                    session = {
                        tunnelClient: tunnelClient,
                        wss: wsInstance.wss,
                        vncProcess: vncProcess,
                        url: tunnelUrl,
                        noVncUrl: noVncUrl,
                        startedBy: startedBy,
                        startedAt: Date.now(),
                        timeoutTimer: timeoutTimer,
                    };
                    activeSessions.set(sessionKey, session);
                    logger.log("Screen share started by ".concat(startedBy, ": ").concat(tunnelUrl));
                    return [2 /*return*/, session];
            }
        });
    });
}
/**
 * Core screenshare stop logic, reused by both Discord command and CLI.
 */
function stopScreenshare(_a) {
    var sessionKey = _a.sessionKey;
    var session = activeSessions.get(sessionKey);
    if (!session) {
        return false;
    }
    cleanupSession(session);
    activeSessions.delete(sessionKey);
    logger.log("Screen share stopped (key: ".concat(sessionKey, ")"));
    return true;
}
function handleScreenshareCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var guildId, session, err_3;
        var command = _b.command;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    guildId = command.guildId;
                    if (!!guildId) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a server',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2: return [4 /*yield*/, command.deferReply({ flags: SECURE_REPLY_FLAGS })];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 7, , 9]);
                    return [4 /*yield*/, startScreenshare({
                            sessionKey: guildId,
                            startedBy: command.user.tag,
                        })];
                case 5:
                    session = _c.sent();
                    return [4 /*yield*/, command.editReply({
                            content: "Screen sharing started. This reply is private and the URL uses a high-entropy tunnel id. " +
                                "It will auto-stop after ".concat(MAX_SESSION_MINUTES, " minutes. Use /screenshare-stop to stop sooner.\n") +
                                "".concat(session.noVncUrl),
                        })];
                case 6:
                    _c.sent();
                    return [3 /*break*/, 9];
                case 7:
                    err_3 = _c.sent();
                    logger.error('Failed to start screen share:', err_3);
                    return [4 /*yield*/, command.editReply({
                            content: "Failed to start screen share: ".concat(err_3 instanceof Error ? err_3.message : String(err_3)),
                        })];
                case 8:
                    _c.sent();
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function handleScreenshareStopCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var guildId, stopped;
        var command = _b.command;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    guildId = command.guildId;
                    if (!!guildId) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a server',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    stopped = stopScreenshare({ sessionKey: guildId });
                    if (!!stopped) return [3 /*break*/, 4];
                    return [4 /*yield*/, command.reply({
                            content: 'No active screen share to stop',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, command.reply({
                        content: 'Screen sharing stopped',
                        flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                    })];
                case 5:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/** Cleanup all sessions on bot shutdown */
function cleanupAllScreenshares() {
    for (var _i = 0, activeSessions_1 = activeSessions; _i < activeSessions_1.length; _i++) {
        var _a = activeSessions_1[_i], guildId = _a[0], session = _a[1];
        cleanupSession(session);
        activeSessions.delete(guildId);
    }
}
// Kill all screenshares when the process exits (Ctrl+C, SIGTERM, etc.)
function onProcessExit() {
    cleanupAllScreenshares();
}
process.on('SIGINT', onProcessExit);
process.on('SIGTERM', onProcessExit);
process.on('exit', onProcessExit);
