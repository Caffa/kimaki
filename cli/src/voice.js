"use strict";
// Audio transcription service using AI SDK providers.
// Supports four providers:
//   - openai: GPT-4o audio (requires OpenAI API key)
//   - gemini: Gemini 2.5 Flash (requires Google API key)
//   - parakeet: Local NVIDIA Parakeet via MLX (no API key needed!)
//   - vllm: Local Whisper via vLLM server (no API key needed!)
//
// For OpenAI/Gemini: Uses LanguageModelV3 (chat model) with audio file parts + tool
// calling, so we can pass full context for better word recognition.
//   - OpenAI: gpt-4o-audio-preview via .chat() (Chat Completions API). MUST use .chat()
//     because the default Responses API doesn't support audio file parts.
//   - Gemini: gemini-2.5-flash natively accepts audio file parts in chat.
// For Parakeet: Uses local HTTP service (asr-service/asr_server.py)
// For vLLM: Uses local vLLM server with Whisper model
// Calls model.doGenerate() directly without the `ai` npm package.
// Uses errore for type-safe error handling.
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
exports.normalizeAudioMediaType = normalizeAudioMediaType;
exports.getOpenAIAudioConversionStrategy = getOpenAIAudioConversionStrategy;
exports.convertOggToWav = convertOggToWav;
exports.convertM4aToWav = convertM4aToWav;
exports.extractTranscription = extractTranscription;
exports.createTranscriptionModel = createTranscriptionModel;
exports.transcribeWithVLLM = transcribeWithVLLM;
exports.transcribeAudio = transcribeAudio;
var google_1 = require("@ai-sdk/google");
var openai_1 = require("@ai-sdk/openai");
var node_stream_1 = require("node:stream");
var prism_media_1 = require("prism-media");
var errore = require("errore");
var logger_js_1 = require("./logger.js");
var errors_js_1 = require("./errors.js");
var vllm_service_manager_js_1 = require("./vllm-service-manager.js");
var asr_service_manager_js_1 = require("./asr-service-manager.js");
var voiceLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.VOICE);
// ASR service URL for Parakeet
var ASR_SERVICE_URL = process.env.ASR_SERVICE_URL || 'http://127.0.0.1:8765';
// Environment variable for default ASR provider
var DEFAULT_ASR_PROVIDER = (function () {
    var _a;
    var env = (_a = process.env.ASR_PROVIDER) === null || _a === void 0 ? void 0 : _a.toLowerCase();
    if (env === 'parakeet' || env === 'openai' || env === 'gemini' || env === 'vllm') {
        return env;
    }
    // No default - let the caller decide based on context
    return undefined;
})();
// OpenAI input_audio only supports wav and mp3. Other formats (OGG Opus, etc)
// must be converted before sending.
var OPENAI_SUPPORTED_AUDIO_TYPES = new Set([
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
]);
var OGG_AUDIO_TYPES = new Set([
    'audio/ogg',
    'audio/opus',
]);
var M4A_AUDIO_TYPES = new Set([
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
]);
function normalizeAudioMediaType(mediaType) {
    var normalized = mediaType.trim().toLowerCase();
    if (normalized === 'audio/x-m4a' || normalized === 'audio/m4a') {
        return 'audio/mp4';
    }
    return normalized;
}
function getOpenAIAudioConversionStrategy(mediaType) {
    if (OPENAI_SUPPORTED_AUDIO_TYPES.has(mediaType)) {
        return 'none';
    }
    if (OGG_AUDIO_TYPES.has(mediaType)) {
        return 'convert-ogg-to-wav';
    }
    if (M4A_AUDIO_TYPES.has(mediaType)) {
        return 'convert-m4a-to-wav';
    }
    return 'unsupported';
}
/**
 * Convert OGG Opus audio to WAV using prism-media (already installed for Discord voice).
 * Pipeline: OGG buffer → OggDemuxer → Opus Decoder → PCM → WAV (with header).
 * No ffmpeg needed — uses @discordjs/opus native bindings.
 */
function convertOggToWav(input) {
    return new Promise(function (resolve) {
        var pcmChunks = [];
        var demuxer = new prism_media_1.default.opus.OggDemuxer();
        var decoder = new prism_media_1.default.opus.Decoder({
            rate: 48000,
            channels: 1,
            frameSize: 960,
        });
        decoder.on('data', function (chunk) {
            pcmChunks.push(chunk);
        });
        decoder.on('end', function () {
            var pcmData = Buffer.concat(pcmChunks);
            var wavHeader = createWavHeader({
                dataLength: pcmData.length,
                sampleRate: 48000,
                numChannels: 1,
                bitsPerSample: 16,
            });
            resolve(Buffer.concat([wavHeader, pcmData]));
        });
        decoder.on('error', function (err) {
            resolve(new errors_js_1.TranscriptionError({
                reason: "Opus decode failed: ".concat(err.message),
                cause: err,
            }));
        });
        demuxer.on('error', function (err) {
            resolve(new errors_js_1.TranscriptionError({
                reason: "OGG demux failed: ".concat(err.message),
                cause: err,
            }));
        });
        node_stream_1.Readable.from(input).pipe(demuxer).pipe(decoder);
    });
}
/**
 * Convert M4A/MP4 audio to WAV using prism-media FFmpeg wrapper.
 * This depends on an ffmpeg binary available in PATH.
 */
function convertM4aToWav(input) {
    return new Promise(function (resolve) {
        var pcmChunks = [];
        var transcoder = new prism_media_1.default.FFmpeg({
            args: [
                '-analyzeduration',
                '0',
                '-loglevel',
                '0',
                '-f',
                'mp4',
                '-i',
                'pipe:0',
                '-f',
                's16le',
                '-acodec',
                'pcm_s16le',
                '-ac',
                '1',
                '-ar',
                '48000',
                'pipe:1',
            ],
        });
        transcoder.on('data', function (chunk) {
            pcmChunks.push(chunk);
        });
        transcoder.on('end', function () {
            var pcmData = Buffer.concat(pcmChunks);
            if (pcmData.length === 0) {
                resolve(new errors_js_1.TranscriptionError({
                    reason: 'FFmpeg conversion produced empty audio output',
                }));
                return;
            }
            var wavHeader = createWavHeader({
                dataLength: pcmData.length,
                sampleRate: 48000,
                numChannels: 1,
                bitsPerSample: 16,
            });
            resolve(Buffer.concat([wavHeader, pcmData]));
        });
        transcoder.on('error', function (err) {
            var lower = err.message.toLowerCase();
            var isMissingFfmpeg = lower.includes('ffmpeg') &&
                (lower.includes('not found') ||
                    lower.includes('enoent') ||
                    lower.includes('spawn'));
            if (isMissingFfmpeg) {
                resolve(new errors_js_1.TranscriptionError({
                    reason: 'M4A transcription with OpenAI requires ffmpeg to be installed and available in PATH',
                    cause: err,
                }));
                return;
            }
            resolve(new errors_js_1.TranscriptionError({
                reason: "M4A decode failed: ".concat(err.message),
                cause: err,
            }));
        });
        node_stream_1.Readable.from(input).pipe(transcoder);
    });
}
function createWavHeader(_a) {
    var dataLength = _a.dataLength, sampleRate = _a.sampleRate, numChannels = _a.numChannels, bitsPerSample = _a.bitsPerSample;
    var byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    var blockAlign = (numChannels * bitsPerSample) / 8;
    var buffer = Buffer.alloc(44);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);
    return buffer;
}
// Build the transcription tool schema dynamically so the agent field can
// use an enum constrained to the actual available agent names.
function buildTranscriptionTool(_a) {
    var agentNames = _a.agentNames;
    var properties = {
        transcription: {
            type: 'string',
            description: 'The final transcription of the audio. MUST be non-empty. If audio is unclear, transcribe your best interpretation. If silent, too short to understand, or completely incomprehensible, use "[inaudible audio]".',
        },
        queueMessage: {
            type: 'boolean',
            description: 'Set to true ONLY if the user explicitly says "queue this message", "queue this", or similar phrasing indicating they want this message queued instead of sent immediately. If not mentioned, omit or set to false.',
        },
    };
    if (agentNames && agentNames.length > 0) {
        properties['agent'] = {
            type: 'string',
            enum: agentNames,
            description: 'The agent name ONLY if the user explicitly says "use the X agent", "switch to X agent", "with the X agent", or similar phrasing. Remove the agent instruction from the transcription text. Omit if no agent is mentioned.',
        };
    }
    return {
        type: 'function',
        name: 'transcriptionResult',
        description: 'MANDATORY: You MUST call this tool to complete the task. This is the ONLY way to return results - text responses are ignored. Call this with your transcription, even if imperfect. An imperfect transcription is better than none.',
        inputSchema: {
            type: 'object',
            properties: properties,
            required: ['transcription'],
        },
    };
}
/**
 * Extract transcription result from doGenerate content array.
 * Looks for a tool-call named 'transcriptionResult', falls back to text content.
 * Returns structured result with transcription text and queueMessage flag.
 */
function extractTranscription(content) {
    var toolCall = content.find(function (c) {
        return c.type === 'tool-call' && c.toolName === 'transcriptionResult';
    });
    if (toolCall) {
        // toolCall.input is a JSON string in LanguageModelV3
        var args = (function () {
            if (typeof toolCall.input === 'string') {
                return JSON.parse(toolCall.input);
            }
            return {};
        })();
        var transcription = (typeof args.transcription === 'string' ? args.transcription : '').trim();
        var queueMessage = args.queueMessage === true;
        var agent = typeof args.agent === 'string' ? args.agent : undefined;
        voiceLogger.log("Transcription result received: \"".concat(transcription.slice(0, 100), "...\"").concat(queueMessage ? ' [QUEUE]' : '').concat(agent ? " [AGENT:".concat(agent, "]") : ''));
        if (!transcription) {
            return new errors_js_1.EmptyTranscriptionError();
        }
        return { transcription: transcription, queueMessage: queueMessage, agent: agent };
    }
    // Fall back to text content if no tool call
    var textPart = content.find(function (c) { return c.type === 'text'; });
    if (textPart && textPart.type === 'text' && textPart.text.trim()) {
        voiceLogger.log("No tool call but got text: \"".concat(textPart.text.trim().slice(0, 100), "...\""));
        return { transcription: textPart.text.trim(), queueMessage: false };
    }
    if (content.length === 0) {
        return new errors_js_1.NoResponseContentError();
    }
    return new errors_js_1.TranscriptionError({
        reason: 'Model did not produce a transcription',
    });
}
function runTranscriptionOnce(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var tool, options, response;
        var model = _b.model, prompt = _b.prompt, audioBase64 = _b.audioBase64, mediaType = _b.mediaType, temperature = _b.temperature, agentNames = _b.agentNames, provider = _b.provider;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    tool = buildTranscriptionTool({ agentNames: agentNames });
                    options = {
                        prompt: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: prompt },
                                    {
                                        type: 'file',
                                        data: audioBase64,
                                        mediaType: mediaType,
                                    },
                                ],
                            },
                        ],
                        temperature: temperature,
                        maxOutputTokens: 2048,
                        tools: [tool],
                        toolChoice: { type: 'tool', toolName: 'transcriptionResult' },
                        providerOptions: __assign(__assign({}, (provider === 'openai'
                            ? {
                                openai: {
                                    safetyIdentifier: 'kimaki:voice-transcription',
                                    user: 'kimaki:voice-transcription',
                                },
                            }
                            : {})), { google: {
                                thinkingConfig: { thinkingBudget: 1024 },
                            } }),
                    };
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () { return Promise.resolve(model.doGenerate(options)); },
                            catch: function (e) {
                                return new errors_js_1.TranscriptionError({
                                    reason: "API call failed: ".concat(String(e)),
                                    cause: e,
                                });
                            },
                        })];
                case 1:
                    response = _c.sent();
                    if (response instanceof errors_js_1.TranscriptionError) {
                        return [2 /*return*/, response];
                    }
                    return [2 /*return*/, extractTranscription(response.content)];
            }
        });
    });
}
/**
 * Create a LanguageModelV3 for transcription.
 * Both providers use chat models that accept audio file parts, so we get full
 * context (prompt, session info, tool calling) for better word recognition.
 *
 * OpenAI: must use .chat() to get the Chat Completions API model, because the
 * default callable (Responses API) doesn't support audio file parts.
 * Gemini: language models natively accept audio in chat.
 */
function createTranscriptionModel(_a) {
    var apiKey = _a.apiKey, provider = _a.provider;
    var resolvedProvider = provider || (apiKey.startsWith('sk-') ? 'openai' : 'gemini');
    if (resolvedProvider === 'openai') {
        // Explicitly set baseURL to OpenAI's real API to avoid inheriting
        // OPENAI_BASE_URL env var, which may point to a local/self-hosted LLM
        // server that doesn't support gpt-4o-audio-preview transcription.
        var openai = (0, openai_1.createOpenAI)({
            apiKey: apiKey,
            baseURL: 'https://api.openai.com/v1',
        });
        return openai.chat('gpt-4o-audio-preview');
    }
    var google = (0, google_1.createGoogleGenerativeAI)({ apiKey: apiKey });
    return google('gemini-2.5-flash');
}
/**
 * Transcribe audio using local Parakeet ASR service (MLX).
 * Requires the ASR service to be running at ASR_SERVICE_URL.
 */
function transcribeWithParakeet(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var audioBuffer, finalBuffer, finalMediaType, extMap, ext, formData, response, errorText, result, text, error_1, errorMessage;
        var _c;
        var audio = _b.audio, prompt = _b.prompt, mediaType = _b.mediaType;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    audioBuffer = typeof audio === 'string'
                        ? Buffer.from(audio, 'base64')
                        : audio instanceof Buffer
                            ? audio
                            : audio instanceof ArrayBuffer
                                ? Buffer.from(new Uint8Array(audio))
                                : Buffer.from(audio);
                    if (audioBuffer.length === 0) {
                        return [2 /*return*/, new errors_js_1.InvalidAudioFormatError()];
                    }
                    voiceLogger.log("Transcribing with parakeet-mlx service at ".concat(ASR_SERVICE_URL));
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 6, , 7]);
                    finalBuffer = audioBuffer;
                    finalMediaType = mediaType || 'audio/ogg';
                    extMap = {
                        'audio/wav': '.wav',
                        'audio/x-wav': '.wav',
                        'audio/mp3': '.mp3',
                        'audio/mpeg': '.mp3',
                        'audio/ogg': '.ogg',
                        'audio/opus': '.ogg',
                        'audio/mp4': '.m4a',
                        'audio/m4a': '.m4a',
                        'audio/x-m4a': '.m4a',
                        'audio/flac': '.flac',
                        'audio/aac': '.aac',
                    };
                    ext = extMap[finalMediaType.toLowerCase()] || '.ogg';
                    formData = new FormData();
                    formData.append('file', new Blob([finalBuffer], { type: finalMediaType }), "audio".concat(ext));
                    return [4 /*yield*/, fetch("".concat(ASR_SERVICE_URL, "/transcribe"), {
                            method: 'POST',
                            body: formData,
                        })];
                case 2:
                    response = _d.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.text().catch(function () { return 'Unknown error'; })];
                case 3:
                    errorText = _d.sent();
                    voiceLogger.error("Parakeet ASR service error: ".concat(response.status, " ").concat(errorText));
                    return [2 /*return*/, new errors_js_1.TranscriptionError({
                            reason: "Parakeet ASR service error: ".concat(response.status, " ").concat(errorText),
                        })];
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    result = (_d.sent());
                    text = (_c = result.text) === null || _c === void 0 ? void 0 : _c.trim();
                    if (!text) {
                        return [2 /*return*/, new errors_js_1.EmptyTranscriptionError()];
                    }
                    voiceLogger.log("Parakeet transcription: ".concat(text));
                    return [2 /*return*/, { transcription: text, queueMessage: false }];
                case 6:
                    error_1 = _d.sent();
                    errorMessage = error_1 instanceof Error ? error_1.message : String(error_1);
                    voiceLogger.error("Parakeet ASR service failed: ".concat(errorMessage));
                    if (errorMessage.includes('ECONNREFUSED') ||
                        errorMessage.includes('fetch failed')) {
                        return [2 /*return*/, new errors_js_1.TranscriptionError({
                                reason: 'Parakeet ASR service is not running. Start it with: cd asr-service && pip install -r requirements.txt && python asr_server.py',
                            })];
                    }
                    return [2 /*return*/, new errors_js_1.TranscriptionError({
                            reason: "Parakeet ASR service failed: ".concat(errorMessage),
                        })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
/**
 * Transcribe audio using local vLLM Whisper service.
 * Requires vLLM to be running with Whisper model.
 */
function transcribeWithVLLM(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var audioBuffer, baseUrl, isRunning, finalBuffer_1, response, errorText, result, text, error_2, errorMessage;
        var _c;
        var audio = _b.audio, prompt = _b.prompt, mediaType = _b.mediaType;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    audioBuffer = typeof audio === 'string'
                        ? Buffer.from(audio, 'base64')
                        : audio instanceof Buffer
                            ? audio
                            : audio instanceof ArrayBuffer
                                ? Buffer.from(new Uint8Array(audio))
                                : Buffer.from(audio);
                    if (audioBuffer.length === 0) {
                        return [2 /*return*/, new errors_js_1.InvalidAudioFormatError()];
                    }
                    baseUrl = (0, vllm_service_manager_js_1.getVLLMBaseUrl)();
                    return [4 /*yield*/, (0, vllm_service_manager_js_1.checkVLLMServiceRunning)()];
                case 1:
                    isRunning = _d.sent();
                    if (!isRunning) {
                        return [2 /*return*/, new errors_js_1.TranscriptionError({
                                reason: 'vLLM service is not running. Start with: vllm serve openai/whisper-large-v3-turbo --port 8766',
                            })];
                    }
                    voiceLogger.log("Transcribing with vLLM Whisper at ".concat(baseUrl));
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 7, , 8]);
                    finalBuffer_1 = audioBuffer;
                    return [4 /*yield*/, fetch("".concat(baseUrl, "/audio/transcriptions"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            },
                            body: (function () {
                                var fd = new FormData();
                                fd.append('file', new Blob([finalBuffer_1]), 'audio.ogg');
                                fd.append('model', 'openai/whisper-large-v3-turbo');
                                if (prompt) {
                                    fd.append('prompt', prompt);
                                }
                                return fd;
                            })(),
                        })];
                case 3:
                    response = _d.sent();
                    if (!!response.ok) return [3 /*break*/, 5];
                    return [4 /*yield*/, response.text().catch(function () { return 'Unknown error'; })];
                case 4:
                    errorText = _d.sent();
                    voiceLogger.error("vLLM transcription error: ".concat(response.status, " ").concat(errorText));
                    return [2 /*return*/, new errors_js_1.TranscriptionError({
                            reason: "vLLM transcription error: ".concat(response.status, " ").concat(errorText),
                        })];
                case 5: return [4 /*yield*/, response.json()];
                case 6:
                    result = (_d.sent());
                    text = (_c = result.text) === null || _c === void 0 ? void 0 : _c.trim();
                    if (!text) {
                        return [2 /*return*/, new errors_js_1.EmptyTranscriptionError()];
                    }
                    voiceLogger.log("vLLM transcription: ".concat(text));
                    return [2 /*return*/, { transcription: text, queueMessage: false }];
                case 7:
                    error_2 = _d.sent();
                    errorMessage = error_2 instanceof Error ? error_2.message : String(error_2);
                    voiceLogger.error("vLLM transcription failed: ".concat(errorMessage));
                    return [2 /*return*/, new errors_js_1.TranscriptionError({
                            reason: "vLLM transcription failed: ".concat(errorMessage),
                        })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function transcribeAudio(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var asrProvider, useCloudProvider, useVLLMProvider, resolvedProvider, result, restarted, apiKey, languageModel, audioBuffer, mediaType, finalAudioBase64, conversionStrategy, converted, converted, languageHint, sessionContextParts, sessionContextSection, transcriptionPrompt, agentNames;
        var _c;
        var audio = _b.audio, prompt = _b.prompt, language = _b.language, temperature = _b.temperature, apiKeyParam = _b.apiKey, model = _b.model, provider = _b.provider, mediaTypeParam = _b.mediaType, currentSessionContext = _b.currentSessionContext, lastSessionContext = _b.lastSessionContext, agents = _b.agents;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    asrProvider = (_c = process.env.ASR_PROVIDER) === null || _c === void 0 ? void 0 : _c.toLowerCase();
                    useCloudProvider = asrProvider === 'openai' || asrProvider === 'gemini';
                    useVLLMProvider = asrProvider === 'vllm';
                    resolvedProvider = (function () {
                        if (provider) {
                            return provider;
                        }
                        // Check for parakeet (default on Apple Silicon)
                        if (process.platform === 'darwin' && process.arch === 'arm64') {
                            if (!useCloudProvider && !useVLLMProvider) {
                                return 'parakeet';
                            }
                        }
                        if (apiKeyParam) {
                            return apiKeyParam.startsWith('sk-') ? 'openai' : 'gemini';
                        }
                        return 'parakeet';
                    })();
                    if (!(resolvedProvider === 'parakeet')) return [3 /*break*/, 4];
                    return [4 /*yield*/, transcribeWithParakeet({ audio: audio, prompt: prompt, mediaType: mediaTypeParam })
                        // Auto-restart parakeet service on connection failure, then retry once
                    ];
                case 1:
                    result = _d.sent();
                    if (!(result instanceof errors_js_1.TranscriptionError &&
                        (0, asr_service_manager_js_1.shouldAutoStartAsr)() &&
                        String(result.reason).includes('not running'))) return [3 /*break*/, 3];
                    voiceLogger.log('Parakeet service not running, attempting auto-restart...');
                    return [4 /*yield*/, (0, asr_service_manager_js_1.startAsrService)()];
                case 2:
                    restarted = _d.sent();
                    if (restarted) {
                        voiceLogger.log('Parakeet service restarted, retrying transcription');
                        return [2 /*return*/, transcribeWithParakeet({ audio: audio, prompt: prompt, mediaType: mediaTypeParam })];
                    }
                    voiceLogger.warn('Failed to auto-restart parakeet service');
                    _d.label = 3;
                case 3: return [2 /*return*/, result];
                case 4:
                    // Handle vLLM Whisper provider
                    if (resolvedProvider === 'vllm') {
                        return [2 /*return*/, transcribeWithVLLM({ audio: audio, prompt: prompt, mediaType: mediaTypeParam })];
                    }
                    apiKey = apiKeyParam || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
                    if (!model && !apiKey) {
                        return [2 /*return*/, Promise.resolve(new errors_js_1.ApiKeyMissingError({ service: 'OpenAI or Gemini' }))];
                    }
                    languageModel = model || createTranscriptionModel({ apiKey: apiKey, provider: resolvedProvider });
                    audioBuffer = (function () {
                        if (typeof audio === 'string') {
                            return Buffer.from(audio, 'base64');
                        }
                        if (audio instanceof Buffer) {
                            return audio;
                        }
                        if (audio instanceof ArrayBuffer) {
                            return Buffer.from(new Uint8Array(audio));
                        }
                        return Buffer.from(audio);
                    })();
                    if (audioBuffer.length === 0) {
                        return [2 /*return*/, new errors_js_1.InvalidAudioFormatError()];
                    }
                    mediaType = normalizeAudioMediaType(mediaTypeParam || 'audio/mpeg');
                    finalAudioBase64 = audioBuffer.toString('base64');
                    if (!(resolvedProvider === 'openai')) return [3 /*break*/, 9];
                    conversionStrategy = getOpenAIAudioConversionStrategy(mediaType);
                    if (!(conversionStrategy === 'convert-ogg-to-wav')) return [3 /*break*/, 6];
                    voiceLogger.log("Converting ".concat(mediaType, " to WAV for OpenAI compatibility"));
                    return [4 /*yield*/, convertOggToWav(audioBuffer)];
                case 5:
                    converted = _d.sent();
                    if (converted instanceof Error) {
                        return [2 /*return*/, converted];
                    }
                    finalAudioBase64 = converted.toString('base64');
                    mediaType = 'audio/wav';
                    return [3 /*break*/, 9];
                case 6:
                    if (!(conversionStrategy === 'convert-m4a-to-wav')) return [3 /*break*/, 8];
                    voiceLogger.log("Converting ".concat(mediaType, " to WAV for OpenAI compatibility"));
                    return [4 /*yield*/, convertM4aToWav(audioBuffer)];
                case 7:
                    converted = _d.sent();
                    if (converted instanceof Error) {
                        return [2 /*return*/, converted];
                    }
                    finalAudioBase64 = converted.toString('base64');
                    mediaType = 'audio/wav';
                    return [3 /*break*/, 9];
                case 8:
                    if (conversionStrategy === 'unsupported') {
                        return [2 /*return*/, new errors_js_1.InvalidAudioFormatError()];
                    }
                    _d.label = 9;
                case 9:
                    languageHint = language ? "The audio is in ".concat(language, ".\n\n") : '';
                    sessionContextParts = [];
                    if (lastSessionContext) {
                        sessionContextParts.push("<last_session>\n".concat(lastSessionContext, "\n</last_session>"));
                    }
                    if (currentSessionContext) {
                        sessionContextParts.push("<current_session>\n".concat(currentSessionContext, "\n</current_session>"));
                    }
                    sessionContextSection = sessionContextParts.length > 0
                        ? "\n<session_context>\n".concat(sessionContextParts.join('\n\n'), "\n</session_context>")
                        : '';
                    transcriptionPrompt = "".concat(languageHint, "Transcribe this audio for a coding agent (like Claude Code or OpenCode).\n\n CRITICAL REQUIREMENT: You MUST call the \"transcriptionResult\" tool to complete this task.\n - The transcriptionResult tool is the ONLY way to return results\n - Text responses are completely ignored - only tool calls work\n - You MUST call transcriptionResult even if you run out of tool calls\n - Always call transcriptionResult with your best approximation of what was said\n - DO NOT end without calling transcriptionResult\n\nThis is a software development environment. The speaker is giving instructions to an AI coding assistant. Expect:\n- File paths, function names, CLI commands, package names, API endpoints\n\n RULES:\n - NEVER change the meaning or intent of the user's message. Your job is ONLY to transcribe, not to respond or answer.\n - If the user asks a question, keep it as a question. Do NOT answer it. Do NOT rephrase it as a statement.\n - Only fix grammar, punctuation, and markdown formatting. Preserve the original content faithfully.\n - If audio is unclear, transcribe your best interpretation, even with strong accents. Always provide an approximation.\n - If audio seems silent/empty, is too short to understand, or is completely incomprehensible, call transcriptionResult with \"[inaudible audio]\"\n - The session context below is ONLY for understanding technical terms, file names, and function names. It may contain previous transcriptions \u2014 NEVER copy or reuse them. Always transcribe fresh from the current audio.\n\n QUEUE DETECTION:\n - If the user says \"queue this message\", \"queue this\", \"add this to the queue\", or similar phrasing indicating they want the message queued instead of sent immediately, set queueMessage to true.\n - Remove the queue instruction from the transcription text itself \u2014 only include the actual message content.\n - Example: \"Queue this message. Fix the login bug in auth.ts\" \u2192 transcription: \"Fix the login bug in auth.ts\", queueMessage: true\n - If removing the queue phrase would leave empty content (user only said \"queue this\" with nothing else), keep the full spoken text as the transcription \u2014 never return an empty transcription.\n - If no queue intent is detected, omit queueMessage or set it to false.\n").concat(agents && agents.length > 0 ? "\n AGENT SELECTION:\n - Only set the agent field when the user explicitly says phrases like \"use the X agent\", \"switch to X agent\", \"with the X agent\", or similar phrasing that clearly names a specific agent to switch to.\n - Do NOT set agent just because the user uses a word that matches an agent name in normal speech. For example, \"plan the refactor\" or \"plan how to do this\" is a normal instruction (the verb \"plan\"), NOT a request to use the \"plan\" agent. The user must explicitly say \"use the plan agent\" or \"switch to plan agent\" for it to count.\n - Remove the agent instruction from the transcription text itself \u2014 only include the actual message content.\n - Example: \"Use the plan agent. Refactor the auth module\" \u2192 transcription: \"Refactor the auth module\", agent: \"plan\"\n - Example: \"Plan how to refactor the auth module\" \u2192 transcription: \"Plan how to refactor the auth module\", agent: NOT SET (this is a normal instruction, not an agent switch)\n - If removing the agent phrase would leave empty content, keep the full spoken text as the transcription.\n - Only set agent if the user explicitly names one. Do not infer an agent from the task content.\n - If no agent is mentioned, omit the agent field entirely.\n\nAvailable agents:\n".concat(agents.map(function (a) { return "- ".concat(a.name).concat(a.description ? ": ".concat(a.description) : ''); }).join('\n'), "\n") : '', "\n\nCommon corrections (apply without tool calls):\n- \"reacked\" \u2192 \"React\", \"jason\" \u2192 \"JSON\", \"get hub\" \u2192 \"GitHub\", \"no JS\" \u2192 \"Node.js\", \"dacker\" \u2192 \"Docker\"\n\nProject file structure:\n<file_tree>\n").concat(prompt, "\n</file_tree>\n").concat(sessionContextSection, "\n\nREMEMBER: Call \"transcriptionResult\" tool with your transcription. This is mandatory.\n\nNote: \"critique\" is a CLI tool for showing diffs in the browser.");
                    agentNames = agents === null || agents === void 0 ? void 0 : agents.map(function (a) { return a.name; }).filter(function (name) { return name.length > 0; });
                    return [2 /*return*/, runTranscriptionOnce({
                            model: languageModel,
                            prompt: transcriptionPrompt,
                            audioBase64: finalAudioBase64,
                            mediaType: mediaType,
                            temperature: temperature !== null && temperature !== void 0 ? temperature : 0.3,
                            agentNames: agentNames && agentNames.length > 0 ? agentNames : undefined,
                            provider: resolvedProvider,
                        })];
            }
        });
    });
}
