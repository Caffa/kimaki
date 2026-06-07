"use strict";
// Worker thread for GenAI voice processing.
// Runs in a separate thread to handle audio encoding/decoding without blocking.
// Resamples 24kHz GenAI output to 48kHz stereo Opus packets for Discord.
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
var node_worker_threads_1 = require("node:worker_threads");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var errore = require("errore");
var resampler_1 = require("@purinton/resampler");
var prism = require("prism-media");
var genai_js_1 = require("./genai.js");
var tools_js_1 = require("./tools.js");
var promises_1 = require("node:fs/promises");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
if (!node_worker_threads_1.parentPort) {
    throw new Error('This module must be run as a worker thread');
}
var workerLogger = (0, logger_js_1.createLogger)("".concat(logger_js_1.LogPrefix.WORKER, "_").concat(node_worker_threads_1.threadId));
workerLogger.log('GenAI worker started');
// Initialize Sentry in worker thread (inherits KIMAKI_SENTRY_DSN from parent)
(0, sentry_js_1.initSentry)();
// Define sendError early so it can be used by global handlers
function sendError(error) {
    if (node_worker_threads_1.parentPort) {
        node_worker_threads_1.parentPort.postMessage({
            type: 'error',
            error: error,
        });
    }
}
// Add global error handlers for the worker thread
process.on('uncaughtException', function (error) {
    workerLogger.error('Uncaught exception in worker:', error);
    void (0, sentry_js_1.notifyError)(error, 'Uncaught exception in GenAI worker');
    sendError("Worker crashed: ".concat(error.message));
    process.exit(1);
});
process.on('unhandledRejection', function (reason, promise) {
    var formattedReason = (0, logger_js_1.formatErrorWithStack)(reason);
    workerLogger.error('Unhandled rejection in worker:', formattedReason, 'at promise:', promise);
    var error = reason instanceof Error
        ? reason
        : new Error(formattedReason);
    void (0, sentry_js_1.notifyError)(error, 'Unhandled rejection in GenAI worker');
    sendError("Worker unhandled rejection: ".concat(formattedReason));
});
// Audio configuration
var AUDIO_CONFIG = {
    inputSampleRate: 24000, // GenAI output
    inputChannels: 1,
    outputSampleRate: 48000, // Discord expects
    outputChannels: 2,
    opusFrameSize: 960, // 20ms at 48kHz
};
// Initialize audio processing components
var resampler = new resampler_1.Resampler({
    inRate: AUDIO_CONFIG.inputSampleRate,
    outRate: AUDIO_CONFIG.outputSampleRate,
    inChannels: AUDIO_CONFIG.inputChannels,
    outChannels: AUDIO_CONFIG.outputChannels,
    volume: 1,
    filterWindow: 8,
});
var opusEncoder = new prism.opus.Encoder({
    rate: AUDIO_CONFIG.outputSampleRate,
    channels: AUDIO_CONFIG.outputChannels,
    frameSize: AUDIO_CONFIG.opusFrameSize,
});
// Pipe resampler to encoder with error handling
resampler.pipe(opusEncoder).on('error', function (error) {
    workerLogger.error('Pipe error between resampler and encoder:', error);
    void (0, sentry_js_1.notifyError)(error, 'GenAI worker audio pipeline error');
    sendError("Audio pipeline error: ".concat(error.message));
});
// Opus packet queue and interval for 20ms packet sending
var opusPacketQueue = [];
var packetInterval = null;
// Send packets every 20ms
function startPacketSending() {
    if (packetInterval)
        return;
    packetInterval = setInterval(function () {
        var packet = opusPacketQueue.shift();
        if (!packet)
            return;
        // Transfer packet as ArrayBuffer
        var arrayBuffer = packet.buffer.slice(packet.byteOffset, packet.byteOffset + packet.byteLength);
        node_worker_threads_1.parentPort.postMessage({
            type: 'assistantOpusPacket',
            packet: arrayBuffer,
        }, [arrayBuffer]);
    }, 20);
}
function stopPacketSending() {
    if (packetInterval) {
        clearInterval(packetInterval);
        packetInterval = null;
    }
    opusPacketQueue.length = 0;
}
// Session state
var session = null;
// Audio log stream for assistant audio
var audioLogStream = null;
// Create assistant audio log stream for debugging
function createAssistantAudioLogStream(guildId, channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var timestamp, audioDir, mkdirError, outputFileName, outputFilePath, outputAudioStream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!process.env.DEBUG)
                        return [2 /*return*/, null];
                    timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    audioDir = node_path_1.default.join(process.cwd(), 'discord-audio-logs', guildId, channelId);
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () { return (0, promises_1.mkdir)(audioDir, { recursive: true }); },
                            catch: function (e) { return e; },
                        })];
                case 1:
                    mkdirError = _a.sent();
                    if (mkdirError instanceof Error) {
                        workerLogger.error("Failed to create audio log directory:", mkdirError.message);
                        return [2 /*return*/, null];
                    }
                    outputFileName = "assistant_".concat(timestamp, ".24.pcm");
                    outputFilePath = node_path_1.default.join(audioDir, outputFileName);
                    outputAudioStream = (0, node_fs_1.createWriteStream)(outputFilePath);
                    // Add error handler to prevent crashes
                    outputAudioStream.on('error', function (error) {
                        workerLogger.error("Assistant audio log stream error:", error);
                    });
                    workerLogger.log("Created assistant audio log: ".concat(outputFilePath));
                    return [2 /*return*/, outputAudioStream];
            }
        });
    });
}
// Handle encoded Opus packets
opusEncoder.on('data', function (packet) {
    opusPacketQueue.push(packet);
});
// Handle stream end events
opusEncoder.on('end', function () {
    workerLogger.log('Opus encoder stream ended');
});
resampler.on('end', function () {
    workerLogger.log('Resampler stream ended');
});
// Handle errors
resampler.on('error', function (error) {
    workerLogger.error("Resampler error:", error);
    void (0, sentry_js_1.notifyError)(error, 'GenAI worker resampler error');
    sendError("Resampler error: ".concat(error.message));
});
opusEncoder.on('error', function (error) {
    workerLogger.error("Encoder error:", error);
    var errMsg = error.message || '';
    // Check for specific corrupted data errors
    if (errMsg.includes('The compressed data passed is corrupted')) {
        workerLogger.warn('Received corrupted audio data in opus encoder');
    }
    else {
        void (0, sentry_js_1.notifyError)(error, 'GenAI worker encoder error');
        sendError("Encoder error: ".concat(errMsg));
    }
});
function cleanupAsync() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    workerLogger.log("Starting async cleanup");
                    stopPacketSending();
                    if (session) {
                        workerLogger.log("Stopping GenAI session");
                        session.stop();
                        session = null;
                    }
                    if (!audioLogStream) return [3 /*break*/, 2];
                    workerLogger.log("Closing assistant audio log stream");
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                            audioLogStream.end(function () {
                                workerLogger.log("Assistant audio log stream closed");
                                resolve();
                            });
                            audioLogStream.on('error', reject);
                            // Add timeout to prevent hanging
                            setTimeout(function () {
                                workerLogger.log("Audio stream close timeout, continuing");
                                resolve();
                            }, 3000);
                        })];
                case 1:
                    _a.sent();
                    audioLogStream = null;
                    _a.label = 2;
                case 2:
                    // Unpipe and end the encoder first
                    resampler.unpipe(opusEncoder);
                    // End the encoder stream
                    return [4 /*yield*/, new Promise(function (resolve) {
                            opusEncoder.end(function () {
                                workerLogger.log("Opus encoder ended");
                                resolve();
                            });
                            // Add timeout
                            setTimeout(resolve, 1000);
                        })
                        // End the resampler stream
                    ];
                case 3:
                    // End the encoder stream
                    _a.sent();
                    // End the resampler stream
                    return [4 /*yield*/, new Promise(function (resolve) {
                            resampler.end(function () {
                                workerLogger.log("Resampler ended");
                                resolve();
                            });
                            // Add timeout
                            setTimeout(resolve, 1000);
                        })];
                case 4:
                    // End the resampler stream
                    _a.sent();
                    workerLogger.log("Async cleanup complete");
                    return [2 /*return*/];
            }
        });
    });
}
// Handle messages from main thread
node_worker_threads_1.parentPort.on('message', function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, tools, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 11, , 12]);
                _a = message.type;
                switch (_a) {
                    case 'init': return [3 /*break*/, 1];
                    case 'sendRealtimeInput': return [3 /*break*/, 5];
                    case 'sendTextInput': return [3 /*break*/, 6];
                    case 'interrupt': return [3 /*break*/, 7];
                    case 'stop': return [3 /*break*/, 8];
                }
                return [3 /*break*/, 10];
            case 1:
                workerLogger.log("Initializing with directory:", message.directory);
                return [4 /*yield*/, createAssistantAudioLogStream(message.guildId, message.channelId)
                    // Start packet sending interval
                ];
            case 2:
                // Create audio log stream for assistant audio
                audioLogStream = _b.sent();
                // Start packet sending interval
                startPacketSending();
                return [4 /*yield*/, (0, tools_js_1.getTools)({
                        directory: message.directory,
                        onMessageCompleted: function (params) {
                            node_worker_threads_1.parentPort.postMessage(__assign({ type: 'toolCallCompleted' }, params));
                        },
                    })
                    // Start GenAI session
                ];
            case 3:
                tools = (_b.sent()).tools;
                return [4 /*yield*/, (0, genai_js_1.startGenAiSession)({
                        tools: tools,
                        systemMessage: message.systemMessage,
                        geminiApiKey: message.geminiApiKey,
                        onAssistantAudioChunk: function (_a) {
                            var data = _a.data;
                            // Write to audio log if enabled
                            if (audioLogStream && !audioLogStream.destroyed) {
                                audioLogStream.write(data, function (err) {
                                    if (err) {
                                        workerLogger.error('Error writing to audio log:', err);
                                    }
                                });
                            }
                            // Write PCM data to resampler which will output Opus packets
                            if (!resampler.destroyed) {
                                resampler.write(data, function (err) {
                                    if (err) {
                                        workerLogger.error('Error writing to resampler:', err);
                                        sendError("Failed to process audio: ".concat(err.message));
                                    }
                                });
                            }
                        },
                        onAssistantStartSpeaking: function () {
                            node_worker_threads_1.parentPort.postMessage({
                                type: 'assistantStartSpeaking',
                            });
                        },
                        onAssistantStopSpeaking: function () {
                            node_worker_threads_1.parentPort.postMessage({
                                type: 'assistantStopSpeaking',
                            });
                        },
                        onAssistantInterruptSpeaking: function () {
                            node_worker_threads_1.parentPort.postMessage({
                                type: 'assistantInterruptSpeaking',
                            });
                        },
                    })
                    // Notify main thread we're ready
                ];
            case 4:
                // Start GenAI session
                session = _b.sent();
                // Notify main thread we're ready
                node_worker_threads_1.parentPort.postMessage({
                    type: 'ready',
                });
                return [3 /*break*/, 10];
            case 5:
                {
                    if (!session) {
                        sendError('Session not initialized');
                        return [2 /*return*/];
                    }
                    session.session.sendRealtimeInput({
                        audio: message.audio,
                        audioStreamEnd: message.audioStreamEnd,
                    });
                    return [3 /*break*/, 10];
                }
                _b.label = 6;
            case 6:
                {
                    if (!session) {
                        sendError('Session not initialized');
                        return [2 /*return*/];
                    }
                    session.session.sendRealtimeInput({
                        text: message.text,
                    });
                    return [3 /*break*/, 10];
                }
                _b.label = 7;
            case 7:
                {
                    workerLogger.log("Interrupting playback");
                    // Clear the opus packet queue
                    opusPacketQueue.length = 0;
                    return [3 /*break*/, 10];
                }
                _b.label = 8;
            case 8:
                workerLogger.log("Stopping worker");
                return [4 /*yield*/, cleanupAsync()
                    // process.exit(0)
                ];
            case 9:
                _b.sent();
                // process.exit(0)
                return [3 /*break*/, 10];
            case 10: return [3 /*break*/, 12];
            case 11:
                error_1 = _b.sent();
                workerLogger.error("Error handling message:", error_1);
                sendError(error_1 instanceof Error ? error_1.message : 'Unknown error in worker');
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); });
