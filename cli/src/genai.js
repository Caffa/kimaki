"use strict";
// Google GenAI Live session manager for real-time voice interactions.
// Establishes bidirectional audio streaming with Gemini, handles tool calls,
// and manages the assistant's audio output for Discord voice channels.
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
var genai_1 = require("@google/genai");
var fs_1 = require("fs");
var logger_js_1 = require("./logger.js");
var ai_tool_to_genai_js_1 = require("./ai-tool-to-genai.js");
var genaiLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.GENAI);
var audioParts = [];
function saveBinaryFile(fileName, content) {
    (0, fs_1.writeFile)(fileName, content, 'utf8', function (err) {
        if (err) {
            genaiLogger.error("Error writing file ".concat(fileName, ":"), err);
            return;
        }
        genaiLogger.log("Appending stream content to file ".concat(fileName, "."));
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
        function handleModelTurn(message) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            if (message.toolCall) {
                genaiLogger.log('Tool call:', message.toolCall);
                // Handle tool calls
                if (message.toolCall.functionCalls && callableTools.length > 0) {
                    var _loop_1 = function (tool) {
                        if (!message.toolCall.functionCalls.some(function (x) { return x.name === tool.name; })) {
                            return "continue";
                        }
                        tool
                            .callTool(message.toolCall.functionCalls)
                            .then(function (parts) {
                            var functionResponses = parts
                                .filter(function (part) { return part.functionResponse; })
                                .map(function (part) { return ({
                                response: part.functionResponse.response,
                                id: part.functionResponse.id,
                                name: part.functionResponse.name,
                            }); });
                            if (functionResponses.length > 0 && session) {
                                session.sendToolResponse({ functionResponses: functionResponses });
                                genaiLogger.log('client-toolResponse: ' +
                                    JSON.stringify({ functionResponses: functionResponses }));
                            }
                        })
                            .catch(function (error) {
                            genaiLogger.error('Error handling tool calls:', error);
                        });
                    };
                    for (var _i = 0, callableTools_1 = callableTools; _i < callableTools_1.length; _i++) {
                        var tool = callableTools_1[_i];
                        _loop_1(tool);
                    }
                }
            }
            if ((_b = (_a = message.serverContent) === null || _a === void 0 ? void 0 : _a.modelTurn) === null || _b === void 0 ? void 0 : _b.parts) {
                for (var _l = 0, _m = message.serverContent.modelTurn.parts; _l < _m.length; _l++) {
                    var part = _m[_l];
                    if (part === null || part === void 0 ? void 0 : part.fileData) {
                        genaiLogger.log("File: ".concat(part === null || part === void 0 ? void 0 : part.fileData.fileUri));
                    }
                    if (part === null || part === void 0 ? void 0 : part.inlineData) {
                        var inlineData = part.inlineData;
                        if (!inlineData.mimeType ||
                            !inlineData.mimeType.startsWith('audio/')) {
                            genaiLogger.log('Skipping non-audio inlineData:', inlineData.mimeType);
                            continue;
                        }
                        // Trigger start speaking callback the first time audio is received
                        if (!isAssistantSpeaking && onAssistantStartSpeaking) {
                            isAssistantSpeaking = true;
                            onAssistantStartSpeaking();
                        }
                        var buffer = Buffer.from((_c = inlineData === null || inlineData === void 0 ? void 0 : inlineData.data) !== null && _c !== void 0 ? _c : '', 'base64');
                        audioChunkHandler({
                            data: buffer,
                            mimeType: (_d = inlineData.mimeType) !== null && _d !== void 0 ? _d : '',
                        });
                    }
                    if (part === null || part === void 0 ? void 0 : part.text) {
                        genaiLogger.log('Text:', part.text);
                    }
                }
            }
            // Handle input transcription (user's audio transcription)
            if ((_f = (_e = message.serverContent) === null || _e === void 0 ? void 0 : _e.inputTranscription) === null || _f === void 0 ? void 0 : _f.text) {
                genaiLogger.log('[user transcription]', message.serverContent.inputTranscription.text);
            }
            // Handle output transcription (model's audio transcription)
            if ((_h = (_g = message.serverContent) === null || _g === void 0 ? void 0 : _g.outputTranscription) === null || _h === void 0 ? void 0 : _h.text) {
                genaiLogger.log('[assistant transcription]', message.serverContent.outputTranscription.text);
            }
            if ((_j = message.serverContent) === null || _j === void 0 ? void 0 : _j.interrupted) {
                genaiLogger.log('Assistant was interrupted');
                if (isAssistantSpeaking && onAssistantInterruptSpeaking) {
                    isAssistantSpeaking = false;
                    onAssistantInterruptSpeaking();
                }
            }
            if ((_k = message.serverContent) === null || _k === void 0 ? void 0 : _k.turnComplete) {
                genaiLogger.log('Assistant turn complete');
                if (isAssistantSpeaking && onAssistantStopSpeaking) {
                    isAssistantSpeaking = false;
                    onAssistantStopSpeaking();
                }
            }
        }
        var session, callableTools, isAssistantSpeaking, audioChunkHandler, _i, _b, _c, name_1, tool, apiKey, ai, model;
        var _d = _a === void 0 ? {} : _a, onAssistantAudioChunk = _d.onAssistantAudioChunk, onAssistantStartSpeaking = _d.onAssistantStartSpeaking, onAssistantStopSpeaking = _d.onAssistantStopSpeaking, onAssistantInterruptSpeaking = _d.onAssistantInterruptSpeaking, systemMessage = _d.systemMessage, tools = _d.tools, geminiApiKey = _d.geminiApiKey;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    session = undefined;
                    callableTools = [];
                    isAssistantSpeaking = false;
                    audioChunkHandler = onAssistantAudioChunk || defaultAudioChunkHandler;
                    // Convert AI SDK tools to GenAI CallableTools
                    if (tools) {
                        for (_i = 0, _b = Object.entries(tools); _i < _b.length; _i++) {
                            _c = _b[_i], name_1 = _c[0], tool = _c[1];
                            callableTools.push((0, ai_tool_to_genai_js_1.aiToolToCallableTool)(tool, name_1));
                        }
                    }
                    apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
                    if (!apiKey) {
                        genaiLogger.error('No Gemini API key provided');
                        throw new Error('Gemini API key is required for voice interactions');
                    }
                    ai = new genai_1.GoogleGenAI({
                        apiKey: apiKey,
                    });
                    model = 'gemini-3.1-flash-live-preview';
                    return [4 /*yield*/, ai.live.connect({
                            model: model,
                            callbacks: {
                                onopen: function () {
                                    genaiLogger.debug('Opened');
                                },
                                onmessage: function (message) {
                                    // genaiLogger.log(message)
                                    try {
                                        handleModelTurn(message);
                                    }
                                    catch (error) {
                                        genaiLogger.error('Error handling turn:', error);
                                    }
                                },
                                onerror: function (e) {
                                    genaiLogger.debug('Error:', e.message);
                                },
                                onclose: function (e) {
                                    genaiLogger.debug('Close:', e.reason);
                                },
                            },
                            config: {
                                tools: callableTools,
                                responseModalities: [genai_1.Modality.AUDIO],
                                mediaResolution: genai_1.MediaResolution.MEDIA_RESOLUTION_MEDIUM,
                                inputAudioTranscription: {}, // transcribes your input speech
                                outputAudioTranscription: {}, // transcribes the model's spoken audio
                                systemInstruction: {
                                    parts: [
                                        {
                                            text: systemMessage || '',
                                        },
                                    ],
                                },
                                speechConfig: {
                                    voiceConfig: {
                                        prebuiltVoiceConfig: {
                                            voiceName: 'Charon', // Orus also not bad
                                        },
                                    },
                                },
                                contextWindowCompression: {
                                    triggerTokens: '25600',
                                    slidingWindow: { targetTokens: '12800' },
                                },
                            },
                        })];
                case 1:
                    session = _e.sent();
                    return [2 /*return*/, {
                            session: session,
                            stop: function () {
                                var currentSession = session;
                                session = undefined;
                                currentSession === null || currentSession === void 0 ? void 0 : currentSession.close();
                            },
                        }];
            }
        });
    });
}
