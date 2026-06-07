"use strict";
// Tests for voice transcription using AI SDK provider (LanguageModelV3).
// Uses the example audio files at scripts/example-audio.{mp3,ogg}.
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
var vitest_1 = require("vitest");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var voice_js_1 = require("./voice.js");
var voice_attachment_js_1 = require("./voice-attachment.js");
(0, vitest_1.describe)('audio media type routing', function () {
    (0, vitest_1.test)('normalizes m4a aliases to audio/mp4', function () {
        (0, vitest_1.expect)((0, voice_js_1.normalizeAudioMediaType)('audio/x-m4a')).toMatchInlineSnapshot('"audio/mp4"');
        (0, vitest_1.expect)((0, voice_js_1.normalizeAudioMediaType)('audio/m4a')).toMatchInlineSnapshot('"audio/mp4"');
    });
    (0, vitest_1.test)('keeps non-m4a media types unchanged', function () {
        (0, vitest_1.expect)((0, voice_js_1.normalizeAudioMediaType)('audio/ogg')).toMatchInlineSnapshot('"audio/ogg"');
        (0, vitest_1.expect)((0, voice_js_1.normalizeAudioMediaType)('audio/wav')).toMatchInlineSnapshot('"audio/wav"');
    });
    (0, vitest_1.test)('converts ogg only when mime is actual ogg/opus', function () {
        (0, vitest_1.expect)((0, voice_js_1.getOpenAIAudioConversionStrategy)('audio/ogg')).toMatchInlineSnapshot('"convert-ogg-to-wav"');
        (0, vitest_1.expect)((0, voice_js_1.getOpenAIAudioConversionStrategy)('audio/opus')).toMatchInlineSnapshot('"convert-ogg-to-wav"');
        (0, vitest_1.expect)((0, voice_js_1.getOpenAIAudioConversionStrategy)('audio/mp4')).toMatchInlineSnapshot('"convert-m4a-to-wav"');
        (0, vitest_1.expect)((0, voice_js_1.getOpenAIAudioConversionStrategy)('audio/mpeg')).toMatchInlineSnapshot('"none"');
    });
});
(0, vitest_1.describe)('voice attachment detection', function () {
    (0, vitest_1.test)('detects voice attachments by content type, extension, and waveform metadata', function () {
        (0, vitest_1.expect)([
            (0, voice_attachment_js_1.getVoiceAttachmentMatchReason)({
                name: 'voice-message.ogg',
                contentType: 'audio/ogg',
            }),
            (0, voice_attachment_js_1.getVoiceAttachmentMatchReason)({
                name: 'voice-message.ogg',
                contentType: null,
            }),
            (0, voice_attachment_js_1.getVoiceAttachmentMatchReason)({
                name: 'upload.bin',
                contentType: null,
                waveform: 'abc123',
            }),
            (0, voice_attachment_js_1.isVoiceAttachment)({
                name: 'notes.txt',
                contentType: null,
            }),
        ]).toMatchInlineSnapshot("\n      [\n        \"contentType:audio/ogg\",\n        \"extension:.ogg\",\n        \"waveform\",\n        false,\n      ]\n    ");
    });
});
(0, vitest_1.describe)('extractTranscription', function () {
    (0, vitest_1.test)('extracts transcription from tool call', function () {
        var result = (0, voice_js_1.extractTranscription)([
            {
                type: 'tool-call',
                toolCallId: 'call_1',
                toolName: 'transcriptionResult',
                input: JSON.stringify({ transcription: 'hello world' }),
            },
        ]);
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"agent\": undefined,\n        \"queueMessage\": false,\n        \"transcription\": \"hello world\",\n      }\n    ");
    });
    (0, vitest_1.test)('extracts queueMessage: true from tool call', function () {
        var result = (0, voice_js_1.extractTranscription)([
            {
                type: 'tool-call',
                toolCallId: 'call_1',
                toolName: 'transcriptionResult',
                input: JSON.stringify({
                    transcription: 'Fix the login bug in auth.ts',
                    queueMessage: true,
                }),
            },
        ]);
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"agent\": undefined,\n        \"queueMessage\": true,\n        \"transcription\": \"Fix the login bug in auth.ts\",\n      }\n    ");
    });
    (0, vitest_1.test)('queueMessage defaults to false when omitted', function () {
        var result = (0, voice_js_1.extractTranscription)([
            {
                type: 'tool-call',
                toolCallId: 'call_1',
                toolName: 'transcriptionResult',
                input: JSON.stringify({ transcription: 'regular message' }),
            },
        ]);
        (0, vitest_1.expect)(result).not.toBeInstanceOf(Error);
        (0, vitest_1.expect)(result.queueMessage).toBe(false);
    });
    (0, vitest_1.test)('falls back to text when no tool call', function () {
        var result = (0, voice_js_1.extractTranscription)([
            {
                type: 'text',
                text: 'fallback text response',
            },
        ]);
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      {\n        \"queueMessage\": false,\n        \"transcription\": \"fallback text response\",\n      }\n    ");
    });
    (0, vitest_1.test)('returns NoResponseContentError for empty content', function () {
        var result = (0, voice_js_1.extractTranscription)([]);
        (0, vitest_1.expect)(result).toBeInstanceOf(Error);
        (0, vitest_1.expect)(result.message).toMatchInlineSnapshot("\"No response content from model\"");
    });
    (0, vitest_1.test)('returns EmptyTranscriptionError for empty transcription string', function () {
        var result = (0, voice_js_1.extractTranscription)([
            {
                type: 'tool-call',
                toolCallId: 'call_1',
                toolName: 'transcriptionResult',
                input: JSON.stringify({ transcription: '   ' }),
            },
        ]);
        (0, vitest_1.expect)(result).toBeInstanceOf(Error);
        (0, vitest_1.expect)(result.message).toMatchInlineSnapshot("\"Model returned empty transcription\"");
    });
    (0, vitest_1.test)('returns TranscriptionError when content has no tool call or text', function () {
        var result = (0, voice_js_1.extractTranscription)([
            {
                type: 'reasoning',
                text: 'thinking about it',
            },
        ]);
        (0, vitest_1.expect)(result).toBeInstanceOf(Error);
        (0, vitest_1.expect)(result.message).toMatchInlineSnapshot("\"Transcription failed: Model did not produce a transcription\"");
    });
});
(0, vitest_1.describe)('transcribeAudio with real API', function () {
    var audioPath = node_path_1.default.join(import.meta.dirname, '..', 'scripts', 'example-audio.mp3');
    (0, vitest_1.test)('transcribes with Gemini', { timeout: 30000 }, function () { return __awaiter(void 0, void 0, void 0, function () {
        var apiKey, audio, result, transcription;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiKey = process.env.GEMINI_API_KEY;
                    if (!apiKey) {
                        console.log('Skipping: GEMINI_API_KEY not set');
                        return [2 /*return*/];
                    }
                    if (!node_fs_1.default.existsSync(audioPath)) {
                        console.log('Skipping: example-audio.mp3 not found');
                        return [2 /*return*/];
                    }
                    audio = node_fs_1.default.readFileSync(audioPath);
                    return [4 /*yield*/, (0, voice_js_1.transcribeAudio)({
                            audio: audio,
                            prompt: 'test project',
                            apiKey: apiKey,
                            provider: 'gemini',
                        })];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result).not.toBeInstanceOf(Error);
                    transcription = result.transcription;
                    (0, vitest_1.expect)(transcription.length).toBeGreaterThan(0);
                    console.log('Gemini transcription:', result);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('transcribes with OpenAI', { timeout: 30000 }, function () { return __awaiter(void 0, void 0, void 0, function () {
        var apiKey, audio, result, transcription;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiKey = process.env.OPENAI_API_KEY;
                    if (!apiKey) {
                        console.log('Skipping: OPENAI_API_KEY not set');
                        return [2 /*return*/];
                    }
                    if (!node_fs_1.default.existsSync(audioPath)) {
                        console.log('Skipping: example-audio.mp3 not found');
                        return [2 /*return*/];
                    }
                    audio = node_fs_1.default.readFileSync(audioPath);
                    return [4 /*yield*/, (0, voice_js_1.transcribeAudio)({
                            audio: audio,
                            prompt: 'test project',
                            apiKey: apiKey,
                            provider: 'openai',
                        })];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result).not.toBeInstanceOf(Error);
                    transcription = result.transcription;
                    (0, vitest_1.expect)(transcription.length).toBeGreaterThan(0);
                    console.log('OpenAI transcription:', result);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('transcribes OGG with OpenAI (converts to WAV)', { timeout: 30000 }, function () { return __awaiter(void 0, void 0, void 0, function () {
        var apiKey, oggPath, audio, result, transcription;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    apiKey = process.env.OPENAI_API_KEY;
                    oggPath = node_path_1.default.join(import.meta.dirname, '..', 'scripts', 'example-audio.ogg');
                    if (!apiKey) {
                        console.log('Skipping: OPENAI_API_KEY not set');
                        return [2 /*return*/];
                    }
                    if (!node_fs_1.default.existsSync(oggPath)) {
                        console.log('Skipping: example-audio.ogg not found');
                        return [2 /*return*/];
                    }
                    audio = node_fs_1.default.readFileSync(oggPath);
                    return [4 /*yield*/, (0, voice_js_1.transcribeAudio)({
                            audio: audio,
                            prompt: 'test project',
                            apiKey: apiKey,
                            provider: 'openai',
                            mediaType: 'audio/ogg',
                        })];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result).not.toBeInstanceOf(Error);
                    transcription = result.transcription;
                    (0, vitest_1.expect)(transcription.length).toBeGreaterThan(0);
                    console.log('OpenAI OGG transcription:', result);
                    return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('convertOggToWav', function () {
    (0, vitest_1.test)('converts OGG Opus to valid WAV', function () { return __awaiter(void 0, void 0, void 0, function () {
        var oggPath, ogg, result, wav;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    oggPath = node_path_1.default.join(import.meta.dirname, '..', 'scripts', 'example-audio.ogg');
                    if (!node_fs_1.default.existsSync(oggPath)) {
                        console.log('Skipping: example-audio.ogg not found');
                        return [2 /*return*/];
                    }
                    ogg = node_fs_1.default.readFileSync(oggPath);
                    return [4 /*yield*/, (0, voice_js_1.convertOggToWav)(ogg)];
                case 1:
                    result = _a.sent();
                    (0, vitest_1.expect)(result).toBeInstanceOf(Buffer);
                    wav = result;
                    // WAV header starts with RIFF
                    (0, vitest_1.expect)(wav.subarray(0, 4).toString()).toBe('RIFF');
                    (0, vitest_1.expect)(wav.subarray(8, 12).toString()).toBe('WAVE');
                    // Must be larger than just the header (44 bytes)
                    (0, vitest_1.expect)(wav.length).toBeGreaterThan(44);
                    console.log("Converted OGG (".concat(ogg.length, " bytes) to WAV (").concat(wav.length, " bytes)"));
                    return [2 /*return*/];
            }
        });
    }); });
});
