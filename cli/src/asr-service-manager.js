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
exports.isAppleSilicon = isAppleSilicon;
exports.checkAsrServiceRunning = checkAsrServiceRunning;
exports.startAsrService = startAsrService;
exports.stopAsrService = stopAsrService;
exports.shouldAutoStartAsr = shouldAutoStartAsr;
// ASR Service Manager - Automatically starts/stops parakeet-mlx service
var node_child_process_1 = require("node:child_process");
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var node_url_1 = require("node:url");
var logger_js_1 = require("./logger.js");
// ESM-compatible __dirname equivalent
var __filename = (0, node_url_1.fileURLToPath)(import.meta.url);
var __dirname = node_path_1.default.dirname(__filename);
var asrLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.ASR);
var asrProcess = null;
/**
 * Check if running on Apple Silicon (required for MLX).
 * MLX only works on macOS with arm64 architecture.
 */
function isAppleSilicon() {
    return process.platform === 'darwin' && process.arch === 'arm64';
}
/**
 * Get the path to the ASR service directory.
 * Looks for asr-service/ relative to the project root.
 */
function getAsrServicePath() {
    // Try multiple possible locations
    var possiblePaths = [
        // Running from source root (cwd = repo root)
        node_path_1.default.join(process.cwd(), 'asr-service'),
        // Running from source (cwd = cli/)
        node_path_1.default.join(process.cwd(), '..', 'asr-service'),
        // Running from compiled dist (cli/dist/) — asr-service is at repo root
        node_path_1.default.join(__dirname, '..', '..', 'asr-service'),
        // Running from npm-linked package where asr-service is bundled alongside
        node_path_1.default.join(__dirname, '..', 'asr-service'),
        // Running from global npm
        node_path_1.default.join(__dirname, '..', '..', '..', 'asr-service'),
    ];
    for (var _i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
        var p = possiblePaths_1[_i];
        if (node_fs_1.default.existsSync(p)) {
            return p;
        }
    }
    // Check environment variable
    var envPath = process.env.ASR_SERVICE_PATH;
    if (envPath && node_fs_1.default.existsSync(envPath)) {
        return envPath;
    }
    return null;
}
/**
 * Check if the ASR service is already running.
 */
function checkAsrServiceRunning() {
    return __awaiter(this, void 0, void 0, function () {
        var port, host, response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    port = process.env.ASR_PORT || '8765';
                    host = process.env.ASR_HOST || '127.0.0.1';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("http://".concat(host, ":").concat(port, "/health"), {
                            method: 'GET',
                        })];
                case 2:
                    response = _b.sent();
                    return [2 /*return*/, response.ok];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
/**
 * Start the parakeet ASR service.
 * Returns true if service started successfully (or already running).
 */
function startAsrService() {
    return __awaiter(this, void 0, void 0, function () {
        var servicePath, i, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, checkAsrServiceRunning()];
                case 1:
                    // Check if already running
                    if (_c.sent()) {
                        asrLogger.log('ASR service already running');
                        return [2 /*return*/, true];
                    }
                    servicePath = getAsrServicePath();
                    if (!servicePath) {
                        asrLogger.warn('ASR service directory not found. To enable parakeet ASR:\n' +
                            '  1. Ensure asr-service/ folder exists in kimaki project\n' +
                            '  2. Or set ASR_SERVICE_PATH environment variable');
                        return [2 /*return*/, false];
                    }
                    asrLogger.log("Starting ASR service from ".concat(servicePath, "..."));
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 8, , 9]);
                    // Start Python ASR service
                    asrProcess = (0, node_child_process_1.spawn)('python3', ['asr_server.py'], {
                        cwd: servicePath,
                        stdio: ['ignore', 'pipe', 'pipe'],
                        env: __assign(__assign({}, process.env), { ASR_PORT: process.env.ASR_PORT || '8765', ASR_HOST: process.env.ASR_HOST || '127.0.0.1' }),
                    });
                    // Capture output
                    (_a = asrProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                        asrLogger.log("[ASR] ".concat(data.toString().trim()));
                    });
                    (_b = asrProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                        asrLogger.warn("[ASR] ".concat(data.toString().trim()));
                    });
                    asrProcess.on('error', function (error) {
                        asrLogger.error("ASR service error: ".concat(error.message));
                    });
                    asrProcess.on('exit', function (code) {
                        asrLogger.log("ASR service exited with code ".concat(code));
                        asrProcess = null;
                    });
                    i = 0;
                    _c.label = 3;
                case 3:
                    if (!(i < 30)) return [3 /*break*/, 7];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, checkAsrServiceRunning()];
                case 5:
                    if (_c.sent()) {
                        asrLogger.log('ASR service started successfully');
                        return [2 /*return*/, true];
                    }
                    _c.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 3];
                case 7:
                    asrLogger.warn('ASR service did not become ready in time');
                    return [2 /*return*/, false];
                case 8:
                    error_1 = _c.sent();
                    asrLogger.error("Failed to start ASR service: ".concat(error_1));
                    return [2 /*return*/, false];
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Stop the ASR service if we started it.
 */
function stopAsrService() {
    if (asrProcess) {
        asrLogger.log('Stopping ASR service...');
        asrProcess.kill('SIGTERM');
        asrProcess = null;
    }
}
/**
 * Check if we should auto-start the ASR service.
 * Auto-starts only if:
 * 1. ASR_PROVIDER is not set (parakeet is default on Apple Silicon)
 * 2. ASR_PROVIDER is explicitly set to 'parakeet'
 * 3. Running on Apple Silicon (MLX requirement)
 */
function shouldAutoStartAsr() {
    var _a;
    // Don't auto-start on non-Apple Silicon platforms
    if (!isAppleSilicon()) {
        return false;
    }
    var provider = (_a = process.env.ASR_PROVIDER) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    return !provider || provider === 'parakeet';
}
