"use strict";
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* istanbul ignore file */
// @ts-nocheck
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
exports.startGenAiSession = startGenAiSession;
var realtime_api_beta_1 = require("@openai/realtime-api-beta");
var fs_1 = require("fs");
var logger_js_1 = require("./logger.js");
var openaiLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.OPENAI);
var audioParts = [];
function saveBinaryFile(fileName, content) {
    (0, fs_1.writeFile)(fileName, content, 'utf8', function (err) {
        if (err) {
            openaiLogger.error("Error writing file ".concat(fileName, ":"), err);
            return;
        }
        openaiLogger.log("Appending stream content to file ".concat(fileName, "."));
    });
}
function convertToWav(rawData, mimeType) {
    var options = parseMimeType(mimeType);
    var dataLength = rawData.reduce(function (a, b) { return a + b.length; }, 0);
    var wavHeader = createWavHeader(dataLength, options);
    var buffer = Buffer.concat(rawData);
    return Buffer.concat([wavHeader, buffer]);
}
function parseMimeType(mimeType) {
    var _a = mimeType.split(';').map(function (s) { return s.trim(); }), fileType = _a[0], params = _a.slice(1);
    var _b = (fileType === null || fileType === void 0 ? void 0 : fileType.split('/')) || [], _ = _b[0], format = _b[1];
    var options = {
        numChannels: 1,
        bitsPerSample: 16,
    };
    if (format && format.startsWith('L')) {
        var bits = parseInt(format.slice(1), 10);
        if (!isNaN(bits)) {
            options.bitsPerSample = bits;
        }
    }
    for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
        var param = params_1[_i];
        var _c = param.split('=').map(function (s) { return s.trim(); }), key = _c[0], value = _c[1];
        if (key === 'rate') {
            options.sampleRate = parseInt(value || '', 10);
        }
    }
    return options;
}
function createWavHeader(dataLength, options) {
    var numChannels = options.numChannels, sampleRate = options.sampleRate, bitsPerSample = options.bitsPerSample;
    // http://soundfile.sapp.org/doc/WaveFormat
    var byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    var blockAlign = (numChannels * bitsPerSample) / 8;
    var buffer = Buffer.alloc(44);
    buffer.write('RIFF', 0); // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4); // ChunkSize
    buffer.write('WAVE', 8); // Format
    buffer.write('fmt ', 12); // Subchunk1ID
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22); // NumChannels
    buffer.writeUInt32LE(sampleRate, 24); // SampleRate
    buffer.writeUInt32LE(byteRate, 28); // ByteRate
    buffer.writeUInt16LE(blockAlign, 32); // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
    buffer.write('data', 36); // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40); // Subchunk2Size
    return buffer;
}
function defaultAudioChunkHandler(_a) {
    var data = _a.data, mimeType = _a.mimeType;
    audioParts.push(data);
    var fileName = 'audio.wav';
    var buffer = convertToWav(audioParts, mimeType);
    saveBinaryFile(fileName, buffer);
}
function startGenAiSession() {
    return __awaiter(this, arguments, void 0, function (_a) {
        var client, audioChunkHandler, isAssistantSpeaking, _loop_1, _i, _b, _c, name_1, tool, sessionResult;
        var _this = this;
        var _d;
        var _e = _a === void 0 ? {} : _a, onAssistantAudioChunk = _e.onAssistantAudioChunk, onAssistantStartSpeaking = _e.onAssistantStartSpeaking, onAssistantStopSpeaking = _e.onAssistantStopSpeaking, onAssistantInterruptSpeaking = _e.onAssistantInterruptSpeaking, systemMessage = _e.systemMessage, tools = _e.tools;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    if (!process.env.OPENAI_API_KEY) {
                        throw new Error('OPENAI_API_KEY environment variable is required');
                    }
                    client = new realtime_api_beta_1.RealtimeClient({
                        apiKey: process.env.OPENAI_API_KEY,
                    });
                    audioChunkHandler = onAssistantAudioChunk || defaultAudioChunkHandler;
                    isAssistantSpeaking = false;
                    // Configure session with 24kHz sample rate
                    client.updateSession({
                        instructions: systemMessage || '',
                        voice: 'alloy',
                        input_audio_format: 'pcm16',
                        output_audio_format: 'pcm16',
                        input_audio_transcription: { model: 'whisper-1' },
                        turn_detection: { type: 'server_vad' },
                        modalities: ['text', 'audio'],
                        temperature: 0.8,
                    });
                    // Add tools if provided
                    if (tools) {
                        _loop_1 = function (name_1, tool) {
                            // Convert AI SDK tool to OpenAI Realtime format
                            // The tool.inputSchema is a Zod schema, we need to convert it to JSON Schema
                            var parameters = {
                                type: 'object',
                                properties: {},
                                required: [],
                            };
                            // If the tool has a Zod schema, we can try to extract basic structure
                            // For now, we'll use a simple placeholder
                            if ((_d = tool.description) === null || _d === void 0 ? void 0 : _d.includes('session')) {
                                parameters = {
                                    type: 'object',
                                    properties: {
                                        sessionId: { type: 'string', description: 'The session ID' },
                                        message: { type: 'string', description: 'The message text' },
                                    },
                                    required: ['sessionId'],
                                };
                            }
                            client.addTool({
                                type: 'function',
                                name: name_1,
                                description: tool.description || '',
                                parameters: parameters,
                            }, function (params) { return __awaiter(_this, void 0, void 0, function () {
                                var result, error_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 2, , 3]);
                                            if (!tool.execute || typeof tool.execute !== 'function') {
                                                return [2 /*return*/, { error: 'Tool execute function not found' }];
                                            }
                                            return [4 /*yield*/, tool.execute(params, {
                                                    abortSignal: new AbortController().signal,
                                                    toolCallId: '',
                                                    messages: [],
                                                })];
                                        case 1:
                                            result = _a.sent();
                                            return [2 /*return*/, result];
                                        case 2:
                                            error_1 = _a.sent();
                                            openaiLogger.error("Tool ".concat(name_1, " execution error:"), error_1);
                                            return [2 /*return*/, { error: String(error_1) }];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); });
                        };
                        for (_i = 0, _b = Object.entries(tools); _i < _b.length; _i++) {
                            _c = _b[_i], name_1 = _c[0], tool = _c[1];
                            _loop_1(name_1, tool);
                        }
                    }
                    // Set up event handlers
                    client.on('conversation.item.created', function (_a) {
                        var item = _a.item;
                        if (item.role === 'assistant' &&
                            item.type === 'message') {
                            // Check if this is the first audio content
                            var hasAudio = Array.isArray(item.content) &&
                                item.content.some(function (c) { return c.type === 'audio'; });
                            if (hasAudio && !isAssistantSpeaking && onAssistantStartSpeaking) {
                                isAssistantSpeaking = true;
                                onAssistantStartSpeaking();
                            }
                        }
                    });
                    client.on('conversation.updated', function (_a) {
                        var item = _a.item, delta = _a.delta;
                        // Handle audio chunks
                        if ((delta === null || delta === void 0 ? void 0 : delta.audio) && item.role === 'assistant') {
                            if (!isAssistantSpeaking && onAssistantStartSpeaking) {
                                isAssistantSpeaking = true;
                                onAssistantStartSpeaking();
                            }
                            // OpenAI provides audio as Int16Array or base64
                            var audioBuffer = void 0;
                            if (delta.audio instanceof Int16Array) {
                                audioBuffer = Buffer.from(delta.audio.buffer);
                            }
                            else {
                                // Assume base64 string
                                audioBuffer = Buffer.from(delta.audio, 'base64');
                            }
                            // OpenAI uses 24kHz PCM16 format
                            audioChunkHandler({
                                data: audioBuffer,
                                mimeType: 'audio/pcm;rate=24000',
                            });
                        }
                        // Handle transcriptions
                        if (delta === null || delta === void 0 ? void 0 : delta.transcript) {
                            if (item.role === 'user') {
                                openaiLogger.log('User transcription:', delta.transcript);
                            }
                            else if (item.role === 'assistant') {
                                openaiLogger.log('Assistant transcription:', delta.transcript);
                            }
                        }
                    });
                    client.on('conversation.item.completed', function (_a) {
                        var item = _a.item;
                        if ('role' in item &&
                            item.role === 'assistant' &&
                            isAssistantSpeaking &&
                            onAssistantStopSpeaking) {
                            isAssistantSpeaking = false;
                            onAssistantStopSpeaking();
                        }
                    });
                    client.on('conversation.interrupted', function () {
                        openaiLogger.log('Assistant was interrupted');
                        if (isAssistantSpeaking && onAssistantInterruptSpeaking) {
                            isAssistantSpeaking = false;
                            onAssistantInterruptSpeaking();
                        }
                    });
                    // Connect to the Realtime API
                    return [4 /*yield*/, client.connect()];
                case 1:
                    // Connect to the Realtime API
                    _f.sent();
                    sessionResult = {
                        session: {
                            send: function (audioData) {
                                // Convert ArrayBuffer to Int16Array for OpenAI
                                var int16Data = new Int16Array(audioData);
                                client.appendInputAudio(int16Data);
                            },
                            sendText: function (text) {
                                // Send text message to OpenAI
                                client.sendUserMessageContent([{ type: 'input_text', text: text }]);
                            },
                            close: function () {
                                client.disconnect();
                            },
                        },
                        stop: function () {
                            client.disconnect();
                        },
                    };
                    return [2 /*return*/, sessionResult];
            }
        });
    });
}
