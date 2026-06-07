"use strict";
// Kimaki self-upgrade utilities.
// Detects the package manager used to install kimaki, checks npm for newer versions,
// and runs the global upgrade command. Used by both CLI `kimaki upgrade` and
// the Discord `/upgrade-and-restart` command, plus background auto-upgrade on startup.
//
// Background auto-upgrade is DISABLED when running via npm link (local dev fork)
// to prevent accidentally overwriting local development changes.
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
exports.detectPm = detectPm;
exports.getCurrentVersion = getCurrentVersion;
exports.getLatestNpmVersion = getLatestNpmVersion;
exports.upgrade = upgrade;
exports.backgroundUpgradeKimaki = backgroundUpgradeKimaki;
exports.isNpmLinked = isNpmLinked;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_module_1 = require("node:module");
var logger_js_1 = require("./logger.js");
var worktrees_js_1 = require("./worktrees.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
// Detects which package manager globally installed kimaki, used to run the
// correct `<pm> i -g kimaki@latest` upgrade command.
//
// Detection order:
// 1. npm_config_user_agent — set by npx/bunx/pnpm dlx, reliable for those cases
// 2. Realpath of the running script — resolve symlinks and check if the path
//    lives under a known PM global directory (e.g. ~/.bun, ~/Library/pnpm,
//    /usr/local/lib/node_modules). Inspired by sindresorhus/global-directory.
// 3. process.versions.bun — if the runtime itself is Bun, likely bun ecosystem
// 4. Default to npm — safest fallback since npm is the most common global installer
function detectPm() {
    var ua = process.env.npm_config_user_agent;
    if (ua === null || ua === void 0 ? void 0 : ua.startsWith('bun/')) {
        return 'bun';
    }
    if (ua === null || ua === void 0 ? void 0 : ua.startsWith('pnpm/')) {
        return 'pnpm';
    }
    if (ua === null || ua === void 0 ? void 0 : ua.startsWith('npm/')) {
        return 'npm';
    }
    var scriptPath = resolveScriptRealpath();
    if (scriptPath) {
        var p = scriptPath.toLowerCase();
        // bun global installs live under ~/.bun or $BUN_INSTALL
        if (p.includes('.bun/') || p.includes('/bun/install/')) {
            return 'bun';
        }
        // pnpm global installs live under ~/Library/pnpm, ~/.local/share/pnpm, or $PNPM_HOME
        if (p.includes('/pnpm/')) {
            return 'pnpm';
        }
        // npm global installs typically live under lib/node_modules/kimaki without
        // any pnpm or bun path segments, so if we reach here it's likely npm
    }
    if (process.versions.bun) {
        return 'bun';
    }
    return 'npm';
}
function resolveScriptRealpath() {
    try {
        var script = process.argv[1];
        if (!script) {
            return null;
        }
        return node_fs_1.default.realpathSync(script);
    }
    catch (_a) {
        return null;
    }
}
function getCurrentVersion() {
    var require = (0, node_module_1.createRequire)(import.meta.url);
    var pkg = require('../package.json');
    return pkg.version;
}
function getLatestNpmVersion() {
    return __awaiter(this, void 0, void 0, function () {
        var res, data, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch('https://registry.npmjs.org/kimaki/latest', {
                            signal: AbortSignal.timeout(15000),
                        })];
                case 1:
                    res = _c.sent();
                    if (!res.ok) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = (_c.sent());
                    return [2 /*return*/, (_b = data === null || data === void 0 ? void 0 : data.version) !== null && _b !== void 0 ? _b : null];
                case 3:
                    _a = _c.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Returns the new version string if upgraded, null if already up to date.
function upgrade() {
    return __awaiter(this, void 0, void 0, function () {
        var current, latest, pm;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    current = getCurrentVersion();
                    return [4 /*yield*/, getLatestNpmVersion()];
                case 1:
                    latest = _a.sent();
                    if (!latest) {
                        throw new Error('Failed to check latest version from npm');
                    }
                    if (current === latest) {
                        return [2 /*return*/, null];
                    }
                    pm = detectPm();
                    logger.log("Upgrading kimaki from v".concat(current, " to v").concat(latest, " using ").concat(pm, "..."));
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)("".concat(pm, " i -g kimaki@latest"), { timeout: 120000 })];
                case 2:
                    _a.sent();
                    return [2 /*return*/, latest];
            }
        });
    });
}
// Fire-and-forget background upgrade check on bot startup.
// Only upgrades if a newer version is available. Errors are silently ignored.
// DISABLED when running via npm link (local dev fork).
function backgroundUpgradeKimaki() {
    return __awaiter(this, void 0, void 0, function () {
        var current, latest, pm, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    // Skip auto-upgrade when running via npm link (local dev fork)
                    if (isNpmLinked()) {
                        logger.debug('Skipping background upgrade: running via npm link (local dev fork)');
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    current = getCurrentVersion();
                    return [4 /*yield*/, getLatestNpmVersion()];
                case 2:
                    latest = _b.sent();
                    if (!latest || current === latest) {
                        return [2 /*return*/];
                    }
                    pm = detectPm();
                    logger.debug("Background kimaki upgrade started: v".concat(current, " -> v").concat(latest));
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)("".concat(pm, " i -g kimaki@latest"), { timeout: 120000 })];
                case 3:
                    _b.sent();
                    logger.debug("Background kimaki upgrade completed: v".concat(latest));
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Detect if kimaki is running via `npm link` (local dev fork) rather than
 * a regular global install from npm. When running via npm link, the global
 * node_modules has a symlink pointing back to the local source tree.
 * We detect this by resolving the real path of the running script and checking
 * for a .git directory nearby, which only exists in development checkouts.
 */
function isNpmLinked() {
    try {
        var script = process.argv[1];
        if (!script)
            return false;
        var resolved = node_fs_1.default.realpathSync(script);
        // If the real path differs from the argv path, it's a symlink
        if (resolved !== script) {
            // Check if the resolved path is inside a git repo
            // by walking up to find a .git directory
            var dir = node_path_1.default.dirname(resolved);
            while (dir !== node_path_1.default.dirname(dir)) {
                if (node_fs_1.default.existsSync(node_path_1.default.join(dir, '.git'))) {
                    return true;
                }
                dir = node_path_1.default.dirname(dir);
            }
        }
        return false;
    }
    catch (_a) {
        return false;
    }
}
