#!/usr/bin/env bun
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
var bun_1 = require("bun");
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var logsDir = node_path_1.default.join(import.meta.dir, '../discord-audio-logs');
function convertToMp3(filePath) {
    return __awaiter(this, void 0, void 0, function () {
        var ext, dir, basename, outputPath, _a, inputFormat, ffmpegArgs, sampleRate, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ext = node_path_1.default.extname(filePath).toLowerCase();
                    if (ext === '.mp3') {
                        return [2 /*return*/];
                    }
                    dir = node_path_1.default.dirname(filePath);
                    basename = node_path_1.default.basename(filePath, ext);
                    outputPath = node_path_1.default.join(dir, "".concat(basename, ".mp3"));
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, node_fs_1.default.promises.access(outputPath, node_fs_1.default.constants.F_OK)];
                case 2:
                    _b.sent();
                    console.log("Skipping: ".concat(outputPath, " already exists"));
                    return [2 /*return*/];
                case 3:
                    _a = _b.sent();
                    return [3 /*break*/, 4];
                case 4:
                    console.log("Converting: ".concat(filePath, " -> ").concat(outputPath));
                    inputFormat = ext.slice(1);
                    ffmpegArgs = ['-i', filePath, '-acodec', 'mp3', '-ac', '1'];
                    // Format is always s16le. Set sample rate by inspecting .16. or .24 in the file path/extension.
                    if (inputFormat === 'pcm' || filePath.includes('.pcm')) {
                        sampleRate = '16000';
                        if (filePath.includes('.24.')) {
                            sampleRate = '24000';
                        }
                        else if (filePath.includes('.16.')) {
                            sampleRate = '16000';
                        }
                        ffmpegArgs.unshift('-f', 's16le', '-ar', sampleRate, '-ac', '1');
                    }
                    ffmpegArgs.push(outputPath);
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, (0, bun_1.$)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["ffmpeg ", ""], ["ffmpeg ", ""])), ffmpegArgs)];
                case 6:
                    _b.sent();
                    console.log("\u2713 Converted: ".concat(basename).concat(ext, " -> ").concat(basename, ".mp3"));
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _b.sent();
                    console.error("\u2717 Failed to convert ".concat(filePath, ":"), error_1);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function findAudioFiles(dir) {
    return __awaiter(this, void 0, void 0, function () {
        var files, entries, audioExtensions, _loop_1, _i, entries_1, entry;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    files = [];
                    return [4 /*yield*/, node_fs_1.default.promises.readdir(dir, { withFileTypes: true })];
                case 1:
                    entries = _a.sent();
                    audioExtensions = [
                        '.pcm',
                        '.wav',
                        '.flac',
                        '.ogg',
                        '.m4a',
                        '.aac',
                        '.wma',
                        '.opus',
                    ];
                    _loop_1 = function (entry) {
                        var fullPath, subFiles, ext, hasAudioExtension;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    fullPath = node_path_1.default.join(dir, entry.name);
                                    if (!entry.isDirectory()) return [3 /*break*/, 2];
                                    return [4 /*yield*/, findAudioFiles(fullPath)];
                                case 1:
                                    subFiles = _b.sent();
                                    files.push.apply(files, subFiles);
                                    return [3 /*break*/, 3];
                                case 2:
                                    if (entry.isFile() && !entry.name.endsWith('.mp3')) {
                                        ext = node_path_1.default.extname(entry.name).toLowerCase();
                                        hasAudioExtension = audioExtensions.some(function (audioExt) {
                                            return entry.name.includes(audioExt);
                                        });
                                        if (hasAudioExtension || ext === '.pcm') {
                                            files.push(fullPath);
                                        }
                                    }
                                    _b.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, entries_1 = entries;
                    _a.label = 2;
                case 2:
                    if (!(_i < entries_1.length)) return [3 /*break*/, 5];
                    entry = entries_1[_i];
                    return [5 /*yield**/, _loop_1(entry)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, files];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var audioFiles, _i, audioFiles_1, file;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Scanning for audio files in: ".concat(logsDir));
                    return [4 /*yield*/, findAudioFiles(logsDir)];
                case 1:
                    audioFiles = _a.sent();
                    if (audioFiles.length === 0) {
                        console.log('No non-MP3 audio files found.');
                        return [2 /*return*/];
                    }
                    console.log("Found ".concat(audioFiles.length, " files to convert:\n"));
                    _i = 0, audioFiles_1 = audioFiles;
                    _a.label = 2;
                case 2:
                    if (!(_i < audioFiles_1.length)) return [3 /*break*/, 5];
                    file = audioFiles_1[_i];
                    return [4 /*yield*/, convertToMp3(file)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log('\nConversion complete!');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
var templateObject_1;
