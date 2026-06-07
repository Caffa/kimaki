"use strict";
// Cross-platform startup service registration for kimaki daemon.
// Vendored from startup-run (MIT, github.com/vilicvane/startup-run) with
// significant simplifications: no abstract classes, no fs-extra, no winreg
// npm dep, no separate daemon process (kimaki's bin.ts already handles
// respawn/crash-loop). Just writes/deletes the platform service file.
//
// macOS:   ~/Library/LaunchAgents/xyz.kimaki.plist  (launchd)
// Linux:   ~/.config/autostart/kimaki.desktop       (XDG autostart)
// Windows: HKCU\Software\Microsoft\Windows\CurrentVersion\Run  (registry)
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
exports.enableStartupService = enableStartupService;
exports.disableStartupService = disableStartupService;
exports.isStartupServiceEnabled = isStartupServiceEnabled;
exports.getServiceLocationDescription = getServiceLocationDescription;
var node_fs_1 = require("node:fs");
var node_os_1 = require("node:os");
var node_path_1 = require("node:path");
var worktrees_js_1 = require("./worktrees.js");
var SERVICE_NAME = 'xyz.kimaki';
function getServiceFilePath() {
    switch (process.platform) {
        case 'darwin':
            return node_path_1.default.join(node_os_1.default.homedir(), 'Library', 'LaunchAgents', "".concat(SERVICE_NAME, ".plist"));
        case 'linux':
            return node_path_1.default.join(node_os_1.default.homedir(), '.config', 'autostart', 'kimaki.desktop');
        case 'win32':
            // No file — registry key, return a descriptive string for status display
            return 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\kimaki';
        default:
            throw new Error("Unsupported platform: ".concat(process.platform));
    }
}
function escapeXml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
// Shell-escape a string for use in a Linux .desktop Exec= line.
// Wraps in double quotes if it contains spaces or special chars.
function shellEscape(value) {
    if (/^[a-zA-Z0-9._/=-]+$/.test(value)) {
        return value;
    }
    return "\"".concat(value.replace(/"/g, '\\"'), "\"");
}
function buildMacOSPlist(_a) {
    var command = _a.command, args = _a.args;
    var segments = __spreadArray([command], args, true);
    return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n<plist version=\"1.0\">\n<dict>\n  <key>Label</key>\n  <string>".concat(SERVICE_NAME, "</string>\n  <key>ProgramArguments</key>\n  <array>\n").concat(segments.map(function (s) { return "    <string>".concat(escapeXml(s), "</string>"); }).join('\n'), "\n  </array>\n  <key>RunAtLoad</key>\n  <true/>\n  <key>KeepAlive</key>\n  <false/>\n</dict>\n</plist>\n");
}
function buildLinuxDesktop(_a) {
    var command = _a.command, args = _a.args;
    var execLine = __spreadArray([command], args, true).map(shellEscape).join(' ');
    return "[Desktop Entry]\nType=Application\nVersion=1.0\nName=Kimaki\nComment=Kimaki Discord Bot Daemon\nExec=".concat(execLine, "\nStartupNotify=false\nTerminal=false\n");
}
/**
 * Register kimaki to start on user login.
 * Writes the appropriate service file for the current platform.
 */
function enableStartupService(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var platform, filePath, filePath, execLine;
        var command = _b.command, args = _b.args;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    platform = process.platform;
                    if (!(platform === 'darwin')) return [3 /*break*/, 1];
                    filePath = getServiceFilePath();
                    node_fs_1.default.mkdirSync(node_path_1.default.dirname(filePath), { recursive: true });
                    node_fs_1.default.writeFileSync(filePath, buildMacOSPlist({ command: command, args: args }));
                    return [3 /*break*/, 5];
                case 1:
                    if (!(platform === 'linux')) return [3 /*break*/, 2];
                    filePath = getServiceFilePath();
                    node_fs_1.default.mkdirSync(node_path_1.default.dirname(filePath), { recursive: true });
                    node_fs_1.default.writeFileSync(filePath, buildLinuxDesktop({ command: command, args: args }));
                    return [3 /*break*/, 5];
                case 2:
                    if (!(platform === 'win32')) return [3 /*break*/, 4];
                    execLine = __spreadArray([command], args, true).map(function (s) {
                        return s.includes(' ') ? "\"".concat(s, "\"") : s;
                    })
                        .join(' ');
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)("reg add \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v kimaki /t REG_SZ /d \"".concat(execLine, "\" /f"))];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 5];
                case 4: throw new Error("Unsupported platform: ".concat(platform));
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Unregister kimaki from user login startup.
 */
function disableStartupService() {
    return __awaiter(this, void 0, void 0, function () {
        var platform, filePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    platform = process.platform;
                    if (!(platform === 'darwin' || platform === 'linux')) return [3 /*break*/, 1];
                    filePath = getServiceFilePath();
                    if (node_fs_1.default.existsSync(filePath)) {
                        node_fs_1.default.unlinkSync(filePath);
                    }
                    return [3 /*break*/, 4];
                case 1:
                    if (!(platform === 'win32')) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)("reg delete \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v kimaki /f").catch(function () {
                            // Key may not exist, ignore
                        })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3: throw new Error("Unsupported platform: ".concat(platform));
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if kimaki is registered as a startup service.
 */
function isStartupServiceEnabled() {
    return __awaiter(this, void 0, void 0, function () {
        var platform, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    platform = process.platform;
                    if (platform === 'darwin' || platform === 'linux') {
                        return [2 /*return*/, node_fs_1.default.existsSync(getServiceFilePath())];
                    }
                    if (!(platform === 'win32')) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)("reg query \"HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\" /v kimaki").catch(function () {
                            return null;
                        })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result !== null];
                case 2: return [2 /*return*/, false];
            }
        });
    });
}
/**
 * Get a human-readable description of the service location for status display.
 */
function getServiceLocationDescription() {
    var platform = process.platform;
    if (platform === 'darwin') {
        return "launchd: ".concat(getServiceFilePath());
    }
    if (platform === 'linux') {
        return "XDG autostart: ".concat(getServiceFilePath());
    }
    if (platform === 'win32') {
        return "registry: ".concat(getServiceFilePath());
    }
    return "unsupported platform: ".concat(platform);
}
