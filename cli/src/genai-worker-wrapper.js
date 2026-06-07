"use strict";
// Main thread interface for the GenAI worker.
// Spawns and manages the worker thread, handling message passing for
// audio input/output, tool call completions, and graceful shutdown.
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
exports.createGenAIWorker = createGenAIWorker;
var node_worker_threads_1 = require("node:worker_threads");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
var genaiWorkerLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.GENAI_WORKER);
var genaiWrapperLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.GENAI_WORKER);
function createGenAIWorker(options) {
    return new Promise(function (resolve, reject) {
        var worker = new node_worker_threads_1.Worker(new URL('../dist/genai-worker.js', import.meta.url));
        // Handle messages from worker
        worker.on('message', function (message) {
            var _a, _b, _c, _d, _e;
            switch (message.type) {
                case 'assistantOpusPacket':
                    options.onAssistantOpusPacket(message.packet);
                    break;
                case 'assistantStartSpeaking':
                    (_a = options.onAssistantStartSpeaking) === null || _a === void 0 ? void 0 : _a.call(options);
                    break;
                case 'assistantStopSpeaking':
                    (_b = options.onAssistantStopSpeaking) === null || _b === void 0 ? void 0 : _b.call(options);
                    break;
                case 'assistantInterruptSpeaking':
                    (_c = options.onAssistantInterruptSpeaking) === null || _c === void 0 ? void 0 : _c.call(options);
                    break;
                case 'toolCallCompleted':
                    (_d = options.onToolCallCompleted) === null || _d === void 0 ? void 0 : _d.call(options, message);
                    break;
                case 'error':
                    genaiWorkerLogger.error('Error:', message.error);
                    (_e = options.onError) === null || _e === void 0 ? void 0 : _e.call(options, message.error);
                    break;
                case 'ready':
                    genaiWorkerLogger.log('Ready');
                    // Resolve with the worker interface
                    resolve({
                        sendRealtimeInput: function (_a) {
                            var audio = _a.audio, audioStreamEnd = _a.audioStreamEnd;
                            worker.postMessage({
                                type: 'sendRealtimeInput',
                                audio: audio,
                                audioStreamEnd: audioStreamEnd,
                            });
                        },
                        sendTextInput: function (text) {
                            worker.postMessage({
                                type: 'sendTextInput',
                                text: text,
                            });
                        },
                        interrupt: function () {
                            worker.postMessage({
                                type: 'interrupt',
                            });
                        },
                        stop: function () {
                            return __awaiter(this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            genaiWrapperLogger.log('Stopping worker...');
                                            // Send stop message to trigger graceful shutdown
                                            worker.postMessage({ type: 'stop' });
                                            // Wait for worker to exit gracefully (with timeout)
                                            return [4 /*yield*/, new Promise(function (resolve) {
                                                    var resolved = false;
                                                    // Listen for worker exit
                                                    worker.once('exit', function (code) {
                                                        if (!resolved) {
                                                            resolved = true;
                                                            genaiWrapperLogger.log("[GENAI WORKER WRAPPER] Worker exited with code ".concat(code));
                                                            resolve();
                                                        }
                                                    });
                                                    // Timeout after 5 seconds and force terminate
                                                    setTimeout(function () {
                                                        if (!resolved) {
                                                            resolved = true;
                                                            genaiWrapperLogger.log('[GENAI WORKER WRAPPER] Worker did not exit gracefully, terminating...');
                                                            void worker.terminate().then(function () {
                                                                genaiWrapperLogger.log('Worker terminated');
                                                                resolve();
                                                            });
                                                        }
                                                    }, 5000);
                                                })];
                                        case 1:
                                            // Wait for worker to exit gracefully (with timeout)
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            });
                        },
                    });
                    break;
            }
        });
        // Handle worker errors
        worker.on('error', function (error) {
            genaiWorkerLogger.error('Worker error:', error);
            reject(error);
        });
        worker.on('exit', function (code) {
            if (code !== 0) {
                genaiWorkerLogger.error("Worker stopped with exit code ".concat(code));
                void (0, sentry_js_1.notifyError)(new Error("GenAI worker exited with code ".concat(code)), 'GenAI worker non-zero exit after init');
            }
        });
        // Send initialization message
        var initMessage = {
            type: 'init',
            directory: options.directory,
            systemMessage: options.systemMessage,
            guildId: options.guildId,
            channelId: options.channelId,
            appId: options.appId,
            geminiApiKey: options.geminiApiKey,
        };
        worker.postMessage(initMessage);
    });
}
