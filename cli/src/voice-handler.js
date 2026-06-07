"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.voiceConnections = void 0;
exports.convertToMono16k = convertToMono16k;
exports.createUserAudioLogStream = createUserAudioLogStream;
exports.frameMono16khz = frameMono16khz;
exports.setupVoiceHandling = setupVoiceHandling;
exports.cleanupVoiceConnection = cleanupVoiceConnection;
exports.processVoiceAttachment = processVoiceAttachment;
exports.registerVoiceStateHandler = registerVoiceStateHandler;
// Discord voice channel connection and audio stream handler.
// Manages joining/leaving voice channels, captures user audio, resamples to 16kHz,
// and routes audio to the GenAI worker for real-time voice assistant interactions.
var errore = require("errore");
var voice_1 = require("@discordjs/voice");
var node_fs_1 = require("node:fs");
var promises_1 = require("node:fs/promises");
var node_path_1 = require("node:path");
var node_stream_1 = require("node:stream");
var prism = require("prism-media");
var string_dedent_1 = require("string-dedent");
var discord_js_1 = require("discord.js");
var genai_worker_wrapper_js_1 = require("./genai-worker-wrapper.js");
var database_js_1 = require("./database.js");
var db_js_1 = require("./db.js");
var discord_utils_js_1 = require("./discord-utils.js");
var voice_js_1 = require("./voice.js");
var errors_js_1 = require("./errors.js");
var store_js_1 = require("./store.js");
var voice_attachment_js_1 = require("./voice-attachment.js");
var worktrees_js_1 = require("./worktrees.js");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
var voiceLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.VOICE);
exports.voiceConnections = new Map();
function convertToMono16k(buffer) {
    var inputSampleRate = 48000;
    var outputSampleRate = 16000;
    var ratio = inputSampleRate / outputSampleRate;
    var inputChannels = 2;
    var bytesPerSample = 2;
    var inputSamples = buffer.length / (bytesPerSample * inputChannels);
    var outputSamples = Math.floor(inputSamples / ratio);
    var outputBuffer = Buffer.alloc(outputSamples * bytesPerSample);
    for (var i = 0; i < outputSamples; i++) {
        var inputIndex = Math.floor(i * ratio) * inputChannels * bytesPerSample;
        if (inputIndex + 3 < buffer.length) {
            var leftSample = buffer.readInt16LE(inputIndex);
            var rightSample = buffer.readInt16LE(inputIndex + 2);
            var monoSample = Math.round((leftSample + rightSample) / 2);
            outputBuffer.writeInt16LE(monoSample, i * bytesPerSample);
        }
    }
    return outputBuffer;
}
function createUserAudioLogStream(guildId, channelId) {
    return __awaiter(this, void 0, void 0, function () {
        var timestamp, audioDir, inputFileName, inputFilePath, inputAudioStream, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!process.env.DEBUG)
                        return [2 /*return*/, undefined];
                    timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    audioDir = node_path_1.default.join(process.cwd(), 'discord-audio-logs', guildId, channelId);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, promises_1.mkdir)(audioDir, { recursive: true })];
                case 2:
                    _a.sent();
                    inputFileName = "user_".concat(timestamp, ".16.pcm");
                    inputFilePath = node_path_1.default.join(audioDir, inputFileName);
                    inputAudioStream = (0, node_fs_1.createWriteStream)(inputFilePath);
                    voiceLogger.log("Created user audio log: ".concat(inputFilePath));
                    return [2 /*return*/, inputAudioStream];
                case 3:
                    error_1 = _a.sent();
                    voiceLogger.error('Failed to create audio log directory:', error_1);
                    return [2 /*return*/, undefined];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function frameMono16khz() {
    var FRAME_BYTES = (100 * 16000 * 1 * 2) / 1000;
    var stash = Buffer.alloc(0);
    var offset = 0;
    return new node_stream_1.Transform({
        readableObjectMode: false,
        writableObjectMode: false,
        transform: function (chunk, _enc, cb) {
            if (offset > 0) {
                stash = stash.subarray(offset);
                offset = 0;
            }
            stash = stash.length ? Buffer.concat([stash, chunk]) : chunk;
            while (stash.length - offset >= FRAME_BYTES) {
                this.push(stash.subarray(offset, offset + FRAME_BYTES));
                offset += FRAME_BYTES;
            }
            if (offset === stash.length) {
                stash = Buffer.alloc(0);
                offset = 0;
            }
            cb();
        },
        flush: function (cb) {
            stash = Buffer.alloc(0);
            offset = 0;
            cb();
        },
    });
}
function setupVoiceHandling(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var directory, notified, textChannelId, textChannel, e_1, voiceChannel, guildId_1, db, textChannels, _i, textChannels_1, row, ch, _c, e_2, voiceData, _d, geminiApiKey, genAiWorker, receiver, speakingSessionCount;
        var _e;
        var connection = _b.connection, guildId = _b.guildId, channelId = _b.channelId, appId = _b.appId, discordClient = _b.discordClient;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    voiceLogger.log("Setting up voice handling for guild ".concat(guildId, ", channel ").concat(channelId));
                    return [4 /*yield*/, (0, database_js_1.getVoiceChannelDirectory)(channelId)];
                case 1:
                    directory = _f.sent();
                    if (!!directory) return [3 /*break*/, 23];
                    voiceLogger.log("Voice channel ".concat(channelId, " has no associated directory, skipping setup"));
                    notified = false;
                    return [4 /*yield*/, (0, database_js_1.findTextChannelByVoiceChannel)(channelId)];
                case 2:
                    textChannelId = _f.sent();
                    if (!textChannelId) return [3 /*break*/, 8];
                    _f.label = 3;
                case 3:
                    _f.trys.push([3, 7, , 8]);
                    return [4 /*yield*/, discordClient.channels.fetch(textChannelId)];
                case 4:
                    textChannel = _f.sent();
                    if (!((textChannel === null || textChannel === void 0 ? void 0 : textChannel.isTextBased()) && 'send' in textChannel)) return [3 /*break*/, 6];
                    return [4 /*yield*/, textChannel.send({
                            content: '⚠️ This voice channel is not linked to a project directory. Use `/add-project` to link it, or join a configured voice channel.',
                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                        })];
                case 5:
                    _f.sent();
                    notified = true;
                    _f.label = 6;
                case 6: return [3 /*break*/, 8];
                case 7:
                    e_1 = _f.sent();
                    voiceLogger.error('Failed to send voice channel not configured message:', e_1);
                    return [3 /*break*/, 8];
                case 8:
                    if (!!notified) return [3 /*break*/, 22];
                    _f.label = 9;
                case 9:
                    _f.trys.push([9, 21, , 22]);
                    return [4 /*yield*/, discordClient.channels.fetch(channelId)];
                case 10:
                    voiceChannel = _f.sent();
                    if (!((voiceChannel === null || voiceChannel === void 0 ? void 0 : voiceChannel.isVoiceBased()) &&
                        'guild' in voiceChannel &&
                        voiceChannel.guild)) return [3 /*break*/, 20];
                    guildId_1 = voiceChannel.guild.id;
                    return [4 /*yield*/, (0, db_js_1.getDb)()];
                case 11:
                    db = _f.sent();
                    return [4 /*yield*/, db.query.channel_directories.findMany({
                            where: { channel_type: 'text' },
                            columns: { channel_id: true },
                            limit: 1,
                        })];
                case 12:
                    textChannels = _f.sent();
                    _i = 0, textChannels_1 = textChannels;
                    _f.label = 13;
                case 13:
                    if (!(_i < textChannels_1.length)) return [3 /*break*/, 20];
                    row = textChannels_1[_i];
                    _f.label = 14;
                case 14:
                    _f.trys.push([14, 18, , 19]);
                    return [4 /*yield*/, discordClient.channels.fetch(row.channel_id)];
                case 15:
                    ch = _f.sent();
                    if (!((ch === null || ch === void 0 ? void 0 : ch.isTextBased()) &&
                        'send' in ch &&
                        'guild' in ch &&
                        ((_e = ch.guild) === null || _e === void 0 ? void 0 : _e.id) === guildId_1)) return [3 /*break*/, 17];
                    return [4 /*yield*/, ch.send({
                            content: '⚠️ Voice channel not configured. Please use `/add-project` with `--enable-voice` to link a voice channel to a project directory.',
                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                        })];
                case 16:
                    _f.sent();
                    notified = true;
                    return [3 /*break*/, 20];
                case 17: return [3 /*break*/, 19];
                case 18:
                    _c = _f.sent();
                    return [3 /*break*/, 19];
                case 19:
                    _i++;
                    return [3 /*break*/, 13];
                case 20: return [3 /*break*/, 22];
                case 21:
                    e_2 = _f.sent();
                    voiceLogger.error('Failed to send notification to fallback channel:', e_2);
                    return [3 /*break*/, 22];
                case 22: return [2 /*return*/];
                case 23:
                    voiceLogger.log("Found directory for voice channel: ".concat(directory));
                    voiceData = exports.voiceConnections.get(guildId);
                    if (!voiceData) {
                        voiceLogger.error("No voice data found for guild ".concat(guildId));
                        return [2 /*return*/];
                    }
                    _d = voiceData;
                    return [4 /*yield*/, createUserAudioLogStream(guildId, channelId)];
                case 24:
                    _d.userAudioStream = _f.sent();
                    return [4 /*yield*/, (0, database_js_1.getGeminiApiKey)(appId)];
                case 25:
                    geminiApiKey = _f.sent();
                    return [4 /*yield*/, (0, genai_worker_wrapper_js_1.createGenAIWorker)({
                            directory: directory,
                            guildId: guildId,
                            channelId: channelId,
                            appId: appId,
                            geminiApiKey: geminiApiKey,
                            systemMessage: (0, string_dedent_1.default)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    You are Kimaki, an AI similar to Jarvis: you help your user (an engineer) controlling his coding agent, just like Jarvis controls Ironman armor and machines. Speak fast.\n\n    You should talk like Jarvis, British accent, satirical, joking and calm. Be short and concise. Speak fast.\n\n    After tool calls give a super short summary of the assistant message, you should say what the assistant message writes.\n\n    Before starting a new session ask for confirmation if it is not clear if the user finished describing it. ask \"message ready, send?\"\n\n    NEVER repeat the whole tool call parameters or message.\n\n    Your job is to manage many opencode agent chat instances. Opencode is the agent used to write the code, it is similar to Claude Code.\n\n    For everything the user asks it is implicit that the user is asking for you to proxy the requests to opencode sessions.\n\n    You can\n    - start new chats on a given project\n    - read the chats to report progress to the user\n    - submit messages to the chat\n    - list files for a given projects, so you can translate imprecise user prompts to precise messages that mention filename paths using @\n\n    Common patterns\n    - to get the last session use the listChats tool\n    - when user asks you to do something you submit a new session to do it. it's implicit that you proxy requests to the agents chat!\n    - when you submit a session assume the session will take a minute or 2 to complete the task\n\n    Rules\n    - never spell files by mentioning dots, letters, etc. instead give a brief description of the filename\n    - NEVER spell hashes or IDs\n    - never read session ids or other ids\n\n    Your voice is calm and monotone, NEVER excited and goofy. But you speak without jargon or bs and do veiled short jokes.\n    You speak like you knew something other don't. You are cool and cold.\n    "], ["\n    You are Kimaki, an AI similar to Jarvis: you help your user (an engineer) controlling his coding agent, just like Jarvis controls Ironman armor and machines. Speak fast.\n\n    You should talk like Jarvis, British accent, satirical, joking and calm. Be short and concise. Speak fast.\n\n    After tool calls give a super short summary of the assistant message, you should say what the assistant message writes.\n\n    Before starting a new session ask for confirmation if it is not clear if the user finished describing it. ask \"message ready, send?\"\n\n    NEVER repeat the whole tool call parameters or message.\n\n    Your job is to manage many opencode agent chat instances. Opencode is the agent used to write the code, it is similar to Claude Code.\n\n    For everything the user asks it is implicit that the user is asking for you to proxy the requests to opencode sessions.\n\n    You can\n    - start new chats on a given project\n    - read the chats to report progress to the user\n    - submit messages to the chat\n    - list files for a given projects, so you can translate imprecise user prompts to precise messages that mention filename paths using @\n\n    Common patterns\n    - to get the last session use the listChats tool\n    - when user asks you to do something you submit a new session to do it. it's implicit that you proxy requests to the agents chat!\n    - when you submit a session assume the session will take a minute or 2 to complete the task\n\n    Rules\n    - never spell files by mentioning dots, letters, etc. instead give a brief description of the filename\n    - NEVER spell hashes or IDs\n    - never read session ids or other ids\n\n    Your voice is calm and monotone, NEVER excited and goofy. But you speak without jargon or bs and do veiled short jokes.\n    You speak like you knew something other don't. You are cool and cold.\n    "]))),
                            onAssistantOpusPacket: function (packet) {
                                if (connection.state.status !== voice_1.VoiceConnectionStatus.Ready) {
                                    voiceLogger.log('Skipping packet: connection not ready');
                                    return;
                                }
                                try {
                                    connection.setSpeaking(true);
                                    connection.playOpusPacket(Buffer.from(packet));
                                }
                                catch (error) {
                                    voiceLogger.error('Error sending packet:', error);
                                }
                            },
                            onAssistantStartSpeaking: function () {
                                voiceLogger.log('Assistant started speaking');
                                connection.setSpeaking(true);
                            },
                            onAssistantStopSpeaking: function () {
                                voiceLogger.log('Assistant stopped speaking (natural finish)');
                                connection.setSpeaking(false);
                            },
                            onAssistantInterruptSpeaking: function () {
                                voiceLogger.log('Assistant interrupted while speaking');
                                genAiWorker.interrupt();
                                connection.setSpeaking(false);
                            },
                            onToolCallCompleted: function (params) {
                                var errorText = (function () {
                                    if (!params.error) {
                                        return undefined;
                                    }
                                    if (params.error instanceof Error) {
                                        return params.error.message;
                                    }
                                    return String(params.error);
                                })();
                                var text = params.error
                                    ? "<systemMessage>\nThe coding agent encountered an error while processing session ".concat(params.sessionId, ": ").concat(errorText || 'Unknown error', "\n</systemMessage>")
                                    : "<systemMessage>\nThe coding agent finished working on session ".concat(params.sessionId, "\n\nHere's what the assistant wrote:\n").concat(params.markdown, "\n</systemMessage>");
                                genAiWorker.sendTextInput(text);
                            },
                            onError: function (error) {
                                return __awaiter(this, void 0, void 0, function () {
                                    var textChannelId, textChannel, e_3;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                voiceLogger.error('GenAI worker error:', error);
                                                return [4 /*yield*/, (0, database_js_1.findTextChannelByVoiceChannel)(channelId)];
                                            case 1:
                                                textChannelId = _a.sent();
                                                if (!textChannelId) return [3 /*break*/, 7];
                                                _a.label = 2;
                                            case 2:
                                                _a.trys.push([2, 6, , 7]);
                                                return [4 /*yield*/, discordClient.channels.fetch(textChannelId)];
                                            case 3:
                                                textChannel = _a.sent();
                                                if (!((textChannel === null || textChannel === void 0 ? void 0 : textChannel.isTextBased()) && 'send' in textChannel)) return [3 /*break*/, 5];
                                                return [4 /*yield*/, textChannel.send({
                                                        content: "\u26A0\uFE0F Voice session error: ".concat(String(error).slice(0, 1900)),
                                                        flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                                                    })];
                                            case 4:
                                                _a.sent();
                                                _a.label = 5;
                                            case 5: return [3 /*break*/, 7];
                                            case 6:
                                                e_3 = _a.sent();
                                                voiceLogger.error('Failed to send error to text channel:', e_3);
                                                return [3 /*break*/, 7];
                                            case 7: return [2 /*return*/];
                                        }
                                    });
                                });
                            },
                        })];
                case 26:
                    genAiWorker = _f.sent();
                    if (!voiceData.genAiWorker) return [3 /*break*/, 28];
                    voiceLogger.log('Stopping existing GenAI worker before creating new one');
                    return [4 /*yield*/, voiceData.genAiWorker.stop()];
                case 27:
                    _f.sent();
                    _f.label = 28;
                case 28:
                    genAiWorker.sendTextInput("<systemMessage>\nsay \"Hello boss, how we doing today?\"\n</systemMessage>");
                    voiceData.genAiWorker = genAiWorker;
                    receiver = connection.receiver;
                    receiver.speaking.removeAllListeners('start');
                    speakingSessionCount = 0;
                    receiver.speaking.on('start', function (userId) {
                        voiceLogger.log("User ".concat(userId, " started speaking"));
                        speakingSessionCount++;
                        var currentSessionCount = speakingSessionCount;
                        voiceLogger.log("Speaking session ".concat(currentSessionCount, " started"));
                        var audioStream = receiver.subscribe(userId, {
                            end: { behavior: voice_1.EndBehaviorType.AfterSilence, duration: 500 },
                        });
                        var decoder = new prism.opus.Decoder({
                            rate: 48000,
                            channels: 2,
                            frameSize: 960,
                        });
                        decoder.on('error', function (error) {
                            voiceLogger.error("Opus decoder error for user ".concat(userId, ":"), error);
                            void (0, sentry_js_1.notifyError)(error, "Opus decoder error for user ".concat(userId));
                        });
                        var downsampleTransform = new node_stream_1.Transform({
                            transform: function (chunk, _encoding, callback) {
                                try {
                                    var downsampled = convertToMono16k(chunk);
                                    callback(null, downsampled);
                                }
                                catch (error) {
                                    callback(error);
                                }
                            },
                        });
                        var framer = frameMono16khz();
                        var pipeline = audioStream
                            .pipe(decoder)
                            .pipe(downsampleTransform)
                            .pipe(framer);
                        pipeline
                            .on('data', function (frame) {
                            var _a;
                            if (currentSessionCount !== speakingSessionCount) {
                                return;
                            }
                            if (!voiceData.genAiWorker) {
                                voiceLogger.warn("[VOICE] Received audio frame but no GenAI worker active for guild ".concat(guildId));
                                return;
                            }
                            (_a = voiceData.userAudioStream) === null || _a === void 0 ? void 0 : _a.write(frame);
                            voiceData.genAiWorker.sendRealtimeInput({
                                audio: {
                                    mimeType: 'audio/pcm;rate=16000',
                                    data: frame.toString('base64'),
                                },
                            });
                        })
                            .on('end', function () {
                            var _a;
                            if (currentSessionCount === speakingSessionCount) {
                                voiceLogger.log("User ".concat(userId, " stopped speaking (session ").concat(currentSessionCount, ")"));
                                (_a = voiceData.genAiWorker) === null || _a === void 0 ? void 0 : _a.sendRealtimeInput({
                                    audioStreamEnd: true,
                                });
                            }
                            else {
                                voiceLogger.log("User ".concat(userId, " stopped speaking (session ").concat(currentSessionCount, "), but skipping audioStreamEnd because newer session ").concat(speakingSessionCount, " exists"));
                            }
                        })
                            .on('error', function (error) {
                            voiceLogger.error("Pipeline error for user ".concat(userId, ":"), error);
                            void (0, sentry_js_1.notifyError)(error, "Voice pipeline error for user ".concat(userId));
                        });
                        audioStream.on('error', function (error) {
                            voiceLogger.error("Audio stream error for user ".concat(userId, ":"), error);
                            void (0, sentry_js_1.notifyError)(error, "Audio stream error for user ".concat(userId));
                        });
                        downsampleTransform.on('error', function (error) {
                            voiceLogger.error("Downsample transform error for user ".concat(userId, ":"), error);
                            void (0, sentry_js_1.notifyError)(error, "Downsample transform error for user ".concat(userId));
                        });
                        framer.on('error', function (error) {
                            voiceLogger.error("Framer error for user ".concat(userId, ":"), error);
                            void (0, sentry_js_1.notifyError)(error, "Framer error for user ".concat(userId));
                        });
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function cleanupVoiceConnection(guildId) {
    return __awaiter(this, void 0, void 0, function () {
        var voiceData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    voiceData = exports.voiceConnections.get(guildId);
                    if (!voiceData)
                        return [2 /*return*/];
                    voiceLogger.log("Starting cleanup for guild ".concat(guildId));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    if (!voiceData.genAiWorker) return [3 /*break*/, 3];
                    voiceLogger.log("Stopping GenAI worker...");
                    return [4 /*yield*/, voiceData.genAiWorker.stop()];
                case 2:
                    _a.sent();
                    voiceLogger.log("GenAI worker stopped");
                    _a.label = 3;
                case 3:
                    if (!voiceData.userAudioStream) return [3 /*break*/, 5];
                    voiceLogger.log("Closing user audio stream...");
                    return [4 /*yield*/, new Promise(function (resolve) {
                            voiceData.userAudioStream.end(function () {
                                voiceLogger.log('User audio stream closed');
                                resolve();
                            });
                            setTimeout(resolve, 2000);
                        })];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    if (voiceData.connection.state.status !== voice_1.VoiceConnectionStatus.Destroyed) {
                        voiceLogger.log("Destroying voice connection...");
                        voiceData.connection.destroy();
                    }
                    exports.voiceConnections.delete(guildId);
                    voiceLogger.log("Cleanup complete for guild ".concat(guildId));
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    voiceLogger.error("Error during cleanup for guild ".concat(guildId, ":"), error_2);
                    exports.voiceConnections.delete(guildId);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Per-thread serialization is handled by ThreadSessionRuntime.enqueueIncoming()
// via the runtime action queue; no local serialization is needed here.
function processVoiceAttachment(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var audioAttachment, attachmentMatchReason, deterministicConfig, result, threadName_1, renameResult, audioResponse, audioBuffer, _c, _d, transcriptionPrompt, stdout, e_4, asrEnv, parakeetDefault, transcriptionApiKey, transcriptionProvider, stored, button, row, transcription, errMsg, text, queueMessage, agent, threadName_2, renamed;
        var _e;
        var message = _b.message, thread = _b.thread, projectDirectory = _b.projectDirectory, _f = _b.isNewThread, isNewThread = _f === void 0 ? false : _f, appId = _b.appId, currentSessionContext = _b.currentSessionContext, lastSessionContext = _b.lastSessionContext, agents = _b.agents;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    audioAttachment = Array.from(message.attachments.values()).find(function (attachment) { return (0, voice_attachment_js_1.isVoiceAttachment)(attachment); });
                    if (!audioAttachment)
                        return [2 /*return*/, null];
                    attachmentMatchReason = (0, voice_attachment_js_1.getVoiceAttachmentMatchReason)(audioAttachment);
                    voiceLogger.log("Detected audio attachment: ".concat(audioAttachment.name, " (").concat(audioAttachment.contentType || 'no contentType', ", ").concat(attachmentMatchReason || 'unknown reason', ")"));
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread, '🎤 Transcribing voice message...')
                        // Deterministic mode: skip audio download and AI model call entirely,
                        // return a canned result after an optional delay. Used by e2e tests to
                        // control transcription output, timing, and queueMessage deterministically.
                        // Only active when KIMAKI_VITEST=1 to prevent accidental activation in production.
                    ];
                case 1:
                    _g.sent();
                    deterministicConfig = process.env['KIMAKI_VITEST'] === '1'
                        ? store_js_1.store.getState().test.deterministicTranscription
                        : null;
                    if (!deterministicConfig) return [3 /*break*/, 7];
                    if (!deterministicConfig.delayMs) return [3 /*break*/, 3];
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, deterministicConfig.delayMs);
                        })];
                case 2:
                    _g.sent();
                    _g.label = 3;
                case 3:
                    result = {
                        transcription: deterministicConfig.transcription,
                        queueMessage: deterministicConfig.queueMessage,
                        agent: deterministicConfig.agent,
                    };
                    voiceLogger.log("[DETERMINISTIC] Returning canned transcription: \"".concat(result.transcription, "\"").concat(result.queueMessage ? ' [QUEUE]' : ''));
                    if (!isNewThread) return [3 /*break*/, 5];
                    threadName_1 = result.transcription.replace(/\s+/g, ' ').trim().slice(0, 80);
                    if (!threadName_1) return [3 /*break*/, 5];
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () { return thread.setName(threadName_1); },
                            catch: function (e) {
                                return new Error('Failed to update thread name from deterministic transcription', {
                                    cause: e,
                                });
                            },
                        })];
                case 4:
                    renameResult = _g.sent();
                    if (renameResult instanceof Error) {
                        voiceLogger.log("Could not update thread name:", renameResult.message);
                    }
                    _g.label = 5;
                case 5: return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread, "\uD83D\uDCDD **Transcribed message:** ".concat((0, discord_utils_js_1.escapeDiscordFormatting)(result.transcription)))];
                case 6:
                    _g.sent();
                    return [2 /*return*/, result];
                case 7: return [4 /*yield*/, errore.tryAsync({
                        try: function () { return fetch(audioAttachment.url); },
                        catch: function (e) { return new errors_js_1.FetchError({ url: audioAttachment.url, cause: e }); },
                    })];
                case 8:
                    audioResponse = _g.sent();
                    if (!(audioResponse instanceof Error)) return [3 /*break*/, 10];
                    voiceLogger.error("Failed to download audio attachment:", audioResponse.message);
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread, "\u26A0\uFE0F Failed to download audio: ".concat(audioResponse.message), { flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS })];
                case 9:
                    _g.sent();
                    return [2 /*return*/, null];
                case 10:
                    _d = (_c = Buffer).from;
                    return [4 /*yield*/, audioResponse.arrayBuffer()];
                case 11:
                    audioBuffer = _d.apply(_c, [_g.sent()]);
                    voiceLogger.log("Downloaded ".concat(audioBuffer.length, " bytes, transcribing..."));
                    transcriptionPrompt = 'Discord voice message transcription';
                    if (!projectDirectory) return [3 /*break*/, 15];
                    _g.label = 12;
                case 12:
                    _g.trys.push([12, 14, , 15]);
                    voiceLogger.log("Getting project file tree from ".concat(projectDirectory));
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)('git ls-files | tree --fromfile -a', {
                            cwd: projectDirectory,
                        })];
                case 13:
                    stdout = (_g.sent()).stdout;
                    if (stdout) {
                        transcriptionPrompt = "Discord voice message transcription. Project file structure:\n".concat(stdout, "\n\nPlease transcribe file names and paths accurately based on this context.");
                        voiceLogger.log("Added project context to transcription prompt");
                    }
                    return [3 /*break*/, 15];
                case 14:
                    e_4 = _g.sent();
                    voiceLogger.log("Could not get project tree:", e_4);
                    return [3 /*break*/, 15];
                case 15:
                    asrEnv = (_e = process.env.ASR_PROVIDER) === null || _e === void 0 ? void 0 : _e.toLowerCase();
                    parakeetDefault = process.platform === 'darwin' &&
                        process.arch === 'arm64' &&
                        asrEnv !== 'openai' &&
                        asrEnv !== 'gemini' &&
                        asrEnv !== 'vllm';
                    if (!!parakeetDefault) return [3 /*break*/, 22];
                    if (!appId) return [3 /*break*/, 17];
                    return [4 /*yield*/, (0, database_js_1.getTranscriptionApiKey)(appId)];
                case 16:
                    stored = _g.sent();
                    if (stored) {
                        transcriptionApiKey = stored.apiKey;
                        transcriptionProvider = stored.provider;
                    }
                    _g.label = 17;
                case 17:
                    if (!transcriptionApiKey) {
                        if (process.env.OPENAI_API_KEY) {
                            transcriptionApiKey = process.env.OPENAI_API_KEY;
                            transcriptionProvider = 'openai';
                        }
                        else if (process.env.GEMINI_API_KEY) {
                            transcriptionApiKey = process.env.GEMINI_API_KEY;
                            transcriptionProvider = 'gemini';
                        }
                    }
                    if (!!transcriptionApiKey) return [3 /*break*/, 22];
                    if (!appId) return [3 /*break*/, 19];
                    button = new discord_js_1.ButtonBuilder()
                        .setCustomId("transcription_apikey:".concat(appId))
                        .setLabel('Set Transcription API Key')
                        .setStyle(discord_js_1.ButtonStyle.Primary);
                    row = new discord_js_1.ActionRowBuilder().addComponents(button);
                    return [4 /*yield*/, thread.send({
                            content: 'Voice transcription requires an API key (OpenAI or Gemini). Set one to enable voice message transcription.',
                            components: [row],
                            flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 18:
                    _g.sent();
                    return [3 /*break*/, 21];
                case 19: return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread, 'Voice transcription requires an API key. Set OPENAI_API_KEY or GEMINI_API_KEY, or use /login in this channel.')];
                case 20:
                    _g.sent();
                    _g.label = 21;
                case 21: return [2 /*return*/, null];
                case 22: return [4 /*yield*/, (0, voice_js_1.transcribeAudio)({
                        audio: audioBuffer,
                        prompt: transcriptionPrompt,
                        apiKey: parakeetDefault ? undefined : transcriptionApiKey,
                        provider: parakeetDefault ? undefined : transcriptionProvider,
                        mediaType: audioAttachment.contentType || undefined,
                        currentSessionContext: currentSessionContext,
                        lastSessionContext: lastSessionContext,
                        agents: agents,
                    })];
                case 23:
                    transcription = _g.sent();
                    if (!(transcription instanceof Error)) return [3 /*break*/, 25];
                    errMsg = errore.matchError(transcription, {
                        ApiKeyMissingError: function (e) { return e.message; },
                        InvalidAudioFormatError: function (e) { return e.message; },
                        TranscriptionError: function (e) { return e.message; },
                        EmptyTranscriptionError: function (e) { return e.message; },
                        NoResponseContentError: function (e) { return e.message; },
                        NoToolResponseError: function (e) { return e.message; },
                        Error: function (e) { return e.message; },
                    });
                    voiceLogger.error("Transcription failed:", transcription);
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread, "\u26A0\uFE0F Transcription failed: ".concat(errMsg), {
                            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
                        })];
                case 24:
                    _g.sent();
                    return [2 /*return*/, null];
                case 25:
                    text = transcription.transcription, queueMessage = transcription.queueMessage, agent = transcription.agent;
                    voiceLogger.log("Transcription successful: \"".concat(text.slice(0, 50)).concat(text.length > 50 ? '...' : '', "\"").concat(queueMessage ? ' [QUEUE]' : '').concat(agent ? " [AGENT:".concat(agent, "]") : ''));
                    if (!isNewThread) return [3 /*break*/, 27];
                    threadName_2 = text.replace(/\s+/g, ' ').trim().slice(0, 80);
                    if (!threadName_2) return [3 /*break*/, 27];
                    return [4 /*yield*/, Promise.race([
                            errore.tryAsync({
                                try: function () { return thread.setName(threadName_2); },
                                catch: function (e) { return e; },
                            }),
                            new Promise(function (resolve) {
                                setTimeout(function () {
                                    resolve(null);
                                }, 2000);
                            }),
                        ])];
                case 26:
                    renamed = _g.sent();
                    if (renamed === null) {
                        voiceLogger.log("Thread name update timed out");
                    }
                    else if (renamed instanceof Error) {
                        voiceLogger.log("Could not update thread name:", renamed.message);
                    }
                    else {
                        voiceLogger.log("Updated thread name to: \"".concat(threadName_2, "\""));
                    }
                    _g.label = 27;
                case 27: return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread, "\uD83D\uDCDD **Transcribed message:** ".concat((0, discord_utils_js_1.escapeDiscordFormatting)(text)))];
                case 28:
                    _g.sent();
                    if (!agent) return [3 /*break*/, 30];
                    return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread, "Detected agent: ".concat(agent))];
                case 29:
                    _g.sent();
                    _g.label = 30;
                case 30: return [2 /*return*/, transcription];
            }
        });
    });
}
function registerVoiceStateHandler(_a) {
    var _this = this;
    var discordClient = _a.discordClient, appId = _a.appId;
    discordClient.on(discord_js_1.Events.VoiceStateUpdate, function (oldState, newState) { return __awaiter(_this, void 0, void 0, function () {
        var member_1, guild, guildId, voiceData, voiceChannel_1, hasOtherPermittedUsers, guildId, voiceData, oldVoiceChannel, hasOtherPermittedUsers, voiceChannel_2, voiceChannel, existingVoiceData, connection_1, error_3, error_4;
        var _this = this;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 11, , 12]);
                    member_1 = newState.member || oldState.member;
                    if (!member_1)
                        return [2 /*return*/];
                    if (!(0, discord_utils_js_1.hasKimakiBotPermission)(member_1)) {
                        return [2 /*return*/];
                    }
                    guild = newState.guild || oldState.guild;
                    if (!(oldState.channelId !== null && newState.channelId === null)) return [3 /*break*/, 4];
                    voiceLogger.log("Permitted user ".concat(member_1.user.tag, " left voice channel: ").concat((_a = oldState.channel) === null || _a === void 0 ? void 0 : _a.name));
                    guildId = guild.id;
                    voiceData = exports.voiceConnections.get(guildId);
                    if (!(voiceData &&
                        voiceData.connection.joinConfig.channelId === oldState.channelId)) return [3 /*break*/, 3];
                    voiceChannel_1 = oldState.channel;
                    if (!voiceChannel_1)
                        return [2 /*return*/];
                    hasOtherPermittedUsers = voiceChannel_1.members.some(function (m) {
                        if (m.id === member_1.id || m.user.bot) {
                            return false;
                        }
                        return (0, discord_utils_js_1.hasKimakiBotPermission)(m);
                    });
                    if (!!hasOtherPermittedUsers) return [3 /*break*/, 2];
                    voiceLogger.log("No other permitted users in channel, bot leaving voice channel in guild: ".concat(guild.name));
                    return [4 /*yield*/, cleanupVoiceConnection(guildId)];
                case 1:
                    _f.sent();
                    return [3 /*break*/, 3];
                case 2:
                    voiceLogger.log("Other permitted users still in channel, bot staying in voice channel");
                    _f.label = 3;
                case 3: return [2 /*return*/];
                case 4:
                    if (oldState.channelId !== null &&
                        newState.channelId !== null &&
                        oldState.channelId !== newState.channelId) {
                        voiceLogger.log("Permitted user ".concat(member_1.user.tag, " moved from ").concat((_b = oldState.channel) === null || _b === void 0 ? void 0 : _b.name, " to ").concat((_c = newState.channel) === null || _c === void 0 ? void 0 : _c.name));
                        guildId = guild.id;
                        voiceData = exports.voiceConnections.get(guildId);
                        if (voiceData &&
                            voiceData.connection.joinConfig.channelId === oldState.channelId) {
                            oldVoiceChannel = oldState.channel;
                            if (oldVoiceChannel) {
                                hasOtherPermittedUsers = oldVoiceChannel.members.some(function (m) {
                                    if (m.id === member_1.id || m.user.bot) {
                                        return false;
                                    }
                                    return (0, discord_utils_js_1.hasKimakiBotPermission)(m);
                                });
                                if (!hasOtherPermittedUsers) {
                                    voiceLogger.log("Following admin to new channel: ".concat((_d = newState.channel) === null || _d === void 0 ? void 0 : _d.name));
                                    voiceChannel_2 = newState.channel;
                                    if (voiceChannel_2) {
                                        voiceData.connection.rejoin({
                                            channelId: voiceChannel_2.id,
                                            selfDeaf: false,
                                            selfMute: false,
                                        });
                                    }
                                }
                                else {
                                    voiceLogger.log("Other permitted users still in old channel, bot staying put");
                                }
                            }
                        }
                    }
                    if (oldState.channelId === null && newState.channelId !== null) {
                        voiceLogger.log("Permitted user ".concat(member_1.user.tag, " joined voice channel: ").concat((_e = newState.channel) === null || _e === void 0 ? void 0 : _e.name));
                    }
                    if (newState.channelId === null)
                        return [2 /*return*/];
                    voiceChannel = newState.channel;
                    if (!voiceChannel)
                        return [2 /*return*/];
                    existingVoiceData = exports.voiceConnections.get(newState.guild.id);
                    if (existingVoiceData &&
                        existingVoiceData.connection.state.status !==
                            voice_1.VoiceConnectionStatus.Destroyed) {
                        voiceLogger.log("Bot already connected to a voice channel in guild ".concat(newState.guild.name));
                        if (existingVoiceData.connection.joinConfig.channelId !==
                            voiceChannel.id) {
                            voiceLogger.log("Moving bot from channel ".concat(existingVoiceData.connection.joinConfig.channelId, " to ").concat(voiceChannel.id));
                            existingVoiceData.connection.rejoin({
                                channelId: voiceChannel.id,
                                selfDeaf: false,
                                selfMute: false,
                            });
                        }
                        return [2 /*return*/];
                    }
                    _f.label = 5;
                case 5:
                    _f.trys.push([5, 8, , 10]);
                    voiceLogger.log("Attempting to join voice channel: ".concat(voiceChannel.name, " (").concat(voiceChannel.id, ")"));
                    connection_1 = (0, voice_1.joinVoiceChannel)({
                        channelId: voiceChannel.id,
                        guildId: newState.guild.id,
                        adapterCreator: newState.guild.voiceAdapterCreator,
                        selfDeaf: false,
                        debug: true,
                        // daveEncryption defaults to true, required by Discord since ~March 2026
                        selfMute: false,
                    });
                    exports.voiceConnections.set(newState.guild.id, { connection: connection_1 });
                    return [4 /*yield*/, (0, voice_1.entersState)(connection_1, voice_1.VoiceConnectionStatus.Ready, 30000)];
                case 6:
                    _f.sent();
                    voiceLogger.log("Successfully joined voice channel: ".concat(voiceChannel.name, " in guild: ").concat(newState.guild.name));
                    return [4 /*yield*/, setupVoiceHandling({
                            connection: connection_1,
                            guildId: newState.guild.id,
                            channelId: voiceChannel.id,
                            appId: appId,
                            discordClient: discordClient,
                        })];
                case 7:
                    _f.sent();
                    connection_1.on(voice_1.VoiceConnectionStatus.Disconnected, function () { return __awaiter(_this, void 0, void 0, function () {
                        var error_5;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    voiceLogger.log("Disconnected from voice channel in guild: ".concat(newState.guild.name));
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, , 4]);
                                    return [4 /*yield*/, Promise.race([
                                            (0, voice_1.entersState)(connection_1, voice_1.VoiceConnectionStatus.Signalling, 5000),
                                            (0, voice_1.entersState)(connection_1, voice_1.VoiceConnectionStatus.Connecting, 5000),
                                        ])];
                                case 2:
                                    _a.sent();
                                    voiceLogger.log("Reconnecting to voice channel");
                                    return [3 /*break*/, 4];
                                case 3:
                                    error_5 = _a.sent();
                                    voiceLogger.log("Failed to reconnect, destroying connection");
                                    connection_1.destroy();
                                    exports.voiceConnections.delete(newState.guild.id);
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); });
                    connection_1.on(voice_1.VoiceConnectionStatus.Destroyed, function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    voiceLogger.log("Connection destroyed for guild: ".concat(newState.guild.name));
                                    return [4 /*yield*/, cleanupVoiceConnection(newState.guild.id)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    connection_1.on('error', function (error) {
                        voiceLogger.error("Connection error in guild ".concat(newState.guild.name, ":"), error);
                        void (0, sentry_js_1.notifyError)(error, "Voice connection error in guild ".concat(newState.guild.name));
                    });
                    return [3 /*break*/, 10];
                case 8:
                    error_3 = _f.sent();
                    voiceLogger.error("Failed to join voice channel:", error_3);
                    void (0, sentry_js_1.notifyError)(error_3, 'Failed to join voice channel');
                    return [4 /*yield*/, cleanupVoiceConnection(newState.guild.id)];
                case 9:
                    _f.sent();
                    return [3 /*break*/, 10];
                case 10: return [3 /*break*/, 12];
                case 11:
                    error_4 = _f.sent();
                    voiceLogger.error('Error in voice state update handler:', error_4);
                    void (0, sentry_js_1.notifyError)(error_4, 'Voice state update handler error');
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    }); });
}
var templateObject_1;
