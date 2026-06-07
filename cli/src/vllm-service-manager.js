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
exports.checkVLLMServiceRunning = checkVLLMServiceRunning;
exports.getVLLMBaseUrl = getVLLMBaseUrl;
exports.startVLLMService = startVLLMService;
exports.stopVLLMService = stopVLLMService;
exports.shouldAutoStartVLLM = shouldAutoStartVLLM;
exports.getVLLMInfo = getVLLMInfo;
// vLLM Service Manager - Automatically starts/stops vLLM Whisper service
var node_child_process_1 = require("node:child_process");
var logger_js_1 = require("./logger.js");
var vllmLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.VLLM);
var vllmProcess = null;
// Default vLLM configuration
var DEFAULT_VLLM_PORT = '8766';
var DEFAULT_VLLM_HOST = 'localhost';
var DEFAULT_VLLM_MODEL = 'openai/whisper-large-v3-turbo';
/**
 * Check if the vLLM service is already running.
 */
function checkVLLMServiceRunning() {
    return __awaiter(this, arguments, void 0, function (host, port) {
        var response, _a;
        if (host === void 0) { host = process.env.VLLM_HOST || DEFAULT_VLLM_HOST; }
        if (port === void 0) { port = process.env.VLLM_PORT || DEFAULT_VLLM_PORT; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch("http://".concat(host, ":").concat(port, "/v1/models"), {
                            method: 'GET',
                        })];
                case 1:
                    response = _b.sent();
                    return [2 /*return*/, response.ok];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get the vLLM base URL for transcription requests.
 */
function getVLLMBaseUrl() {
    var host = process.env.VLLM_HOST || DEFAULT_VLLM_HOST;
    var port = process.env.VLLM_PORT || DEFAULT_VLLM_PORT;
    return "http://".concat(host, ":").concat(port, "/v1");
}
/**
 * Check if vLLM CLI is available.
 */
function checkVLLMCliAvailable() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    var checkProcess = (0, node_child_process_1.spawn)('vllm', ['--version'], {
                        stdio: 'ignore',
                    });
                    checkProcess.on('error', function () { return resolve(false); });
                    checkProcess.on('exit', function (code) { return resolve(code === 0); });
                    // Timeout after 5 seconds
                    setTimeout(function () {
                        checkProcess.kill();
                        resolve(false);
                    }, 5000);
                })];
        });
    });
}
/**
 * Start the vLLM Whisper service.
 * Returns true if service started successfully (or already running).
 */
function startVLLMService() {
    return __awaiter(this, void 0, void 0, function () {
        var host, port, model, args, maxWaitMs, checkIntervalMs_1, startTime, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, checkVLLMServiceRunning()];
                case 1:
                    // Check if already running
                    if (_c.sent()) {
                        vllmLogger.log('vLLM service already running');
                        return [2 /*return*/, true];
                    }
                    return [4 /*yield*/, checkVLLMCliAvailable()];
                case 2:
                    // Check if vLLM CLI is available
                    if (!(_c.sent())) {
                        vllmLogger.warn('vLLM CLI not found. To enable vLLM Whisper transcription:\n' +
                            '  pip install vllm[audio]\n' +
                            '  # Or with GPU support:\n' +
                            '  pip install vllm[audio]\n' +
                            '  vllm serve openai/whisper-large-v3-turbo --port 8766');
                        return [2 /*return*/, false];
                    }
                    host = process.env.VLLM_HOST || DEFAULT_VLLM_HOST;
                    port = process.env.VLLM_PORT || DEFAULT_VLLM_PORT;
                    model = process.env.VLLM_MODEL || DEFAULT_VLLM_MODEL;
                    vllmLogger.log("Starting vLLM service with ".concat(model, " on port ").concat(port, "..."));
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 8, , 9]);
                    args = ['serve', model, '--port', port];
                    // Add additional args for GPU/MLX optimization
                    if (process.env.VLLM_EXTRA_ARGS) {
                        args.push.apply(args, process.env.VLLM_EXTRA_ARGS.split(' '));
                    }
                    vllmProcess = (0, node_child_process_1.spawn)('vllm', args, {
                        stdio: ['ignore', 'pipe', 'pipe'],
                        env: __assign(__assign({}, process.env), { VLLM_HOST: host, VLLM_PORT: port }),
                    });
                    // Capture output
                    (_a = vllmProcess.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
                        var output = data.toString().trim();
                        // Only log important vLLM messages
                        if (output.includes('Uvicorn running') ||
                            output.includes('Application startup complete') ||
                            output.includes('Loaded model')) {
                            vllmLogger.log("[vLLM] ".concat(output));
                        }
                    });
                    (_b = vllmProcess.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
                        var output = data.toString().trim();
                        // Log errors and warnings
                        if (output.includes('error') ||
                            output.includes('Error') ||
                            output.includes('WARNING')) {
                            vllmLogger.warn("[vLLM] ".concat(output));
                        }
                    });
                    vllmProcess.on('error', function (error) {
                        vllmLogger.error("vLLM service error: ".concat(error.message));
                    });
                    vllmProcess.on('exit', function (code) {
                        vllmLogger.log("vLLM service exited with code ".concat(code));
                        vllmProcess = null;
                    });
                    maxWaitMs = 60000;
                    checkIntervalMs_1 = 1000;
                    startTime = Date.now();
                    _c.label = 4;
                case 4:
                    if (!(Date.now() - startTime < maxWaitMs)) return [3 /*break*/, 7];
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, checkIntervalMs_1); })];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, checkVLLMServiceRunning(host, port)];
                case 6:
                    if (_c.sent()) {
                        vllmLogger.log('vLLM service started successfully');
                        return [2 /*return*/, true];
                    }
                    return [3 /*break*/, 4];
                case 7:
                    vllmLogger.warn('vLLM service did not become ready in time (60s timeout)');
                    return [2 /*return*/, false];
                case 8:
                    error_1 = _c.sent();
                    vllmLogger.error("Failed to start vLLM service: ".concat(error_1));
                    return [2 /*return*/, false];
                case 9: return [2 /*return*/];
            }
        });
    });
}
/**
 * Stop the vLLM service if we started it.
 */
function stopVLLMService() {
    if (vllmProcess) {
        vllmLogger.log('Stopping vLLM service...');
        vllmProcess.kill('SIGTERM');
        vllmProcess = null;
    }
}
/**
 * Check if we should auto-start the vLLM service.
 * Auto-starts only if:
 * 1. ASR_PROVIDER is explicitly set to 'vllm'
 * 2. Or VLLM_AUTO_START is set to 'true'
 */
function shouldAutoStartVLLM() {
    var _a, _b;
    var provider = (_a = process.env.ASR_PROVIDER) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (provider === 'vllm') {
        return true;
    }
    return ((_b = process.env.VLLM_AUTO_START) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === 'true';
}
/**
 * Get info about the vLLM service status.
 */
function getVLLMInfo() {
    return __awaiter(this, void 0, void 0, function () {
        var host, port, model;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    host = process.env.VLLM_HOST || DEFAULT_VLLM_HOST;
                    port = process.env.VLLM_PORT || DEFAULT_VLLM_PORT;
                    model = process.env.VLLM_MODEL || DEFAULT_VLLM_MODEL;
                    _a = {};
                    return [4 /*yield*/, checkVLLMServiceRunning(host, port)];
                case 1: return [2 /*return*/, (_a.running = _b.sent(),
                        _a.baseUrl = "http://".concat(host, ":").concat(port, "/v1"),
                        _a.model = model,
                        _a)];
            }
        });
    });
}
