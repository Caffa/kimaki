"use strict";
// Optimizes oversized images before they reach the LLM API.
// Prevents "image dimensions exceed max allowed" errors from Anthropic/Google/OpenAI.
// Hooks into tool.execute.after (read) and experimental.chat.messages.transform (clipboard paste).
// Uses sharp to resize images > 2000px and compress images > 4MB.
// Vendored from https://github.com/kargnas/opencode-large-image-optimizer, simplified to zero-config.
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
exports.imageOptimizerPlugin = void 0;
// Conservative safe floor for Anthropic many-image requests (20+ images = 2000px limit).
// OpenCode resends history so image counts accumulate across turns — 2000px is safest.
var MAX_DIMENSION = 2000;
// 4MB safe margin under Anthropic's 5MB limit
var MAX_FILE_SIZE = 4 * 1024 * 1024;
var SUPPORTED_MIMES = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
]);
var sharpFactory;
function getSharp() {
    return __awaiter(this, void 0, void 0, function () {
        var mod, fn, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (sharpFactory !== undefined) {
                        return [2 /*return*/, sharpFactory];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('sharp'); })];
                case 2:
                    mod = _b.sent();
                    fn = typeof mod === 'function' ? mod : mod.default;
                    if (typeof fn === 'function') {
                        sharpFactory = fn;
                    }
                    else {
                        sharpFactory = null;
                    }
                    return [3 /*break*/, 4];
                case 3:
                    _a = _b.sent();
                    sharpFactory = null;
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/, sharpFactory];
            }
        });
    });
}
function extractBase64Data(dataUrl) {
    var match = dataUrl.match(/^data:[^;]+;base64,(.+)$/s);
    if (match === null || match === void 0 ? void 0 : match[1]) {
        return match[1];
    }
    // raw base64 string (no data: prefix)
    if (/^[A-Za-z0-9+/]+={0,2}$/.test(dataUrl)) {
        return dataUrl;
    }
    return null;
}
function optimizeImage(dataUrl, mime) {
    return __awaiter(this, void 0, void 0, function () {
        var sharp, rawBase64, inputBuffer, metadata, width, height, needsResize, needsCompress, pipeline, outputMime, outputBuffer, _i, _a, quality;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getSharp()];
                case 1:
                    sharp = _b.sent();
                    if (!sharp) {
                        return [2 /*return*/, null];
                    }
                    rawBase64 = extractBase64Data(dataUrl);
                    if (!rawBase64) {
                        return [2 /*return*/, null];
                    }
                    inputBuffer = Buffer.from(rawBase64, 'base64');
                    if (inputBuffer.length === 0) {
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, sharp(inputBuffer).metadata()];
                case 2:
                    metadata = _b.sent();
                    width = metadata.width || 0;
                    height = metadata.height || 0;
                    if (width === 0 || height === 0) {
                        return [2 /*return*/, null];
                    }
                    needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;
                    needsCompress = inputBuffer.length > MAX_FILE_SIZE;
                    if (!needsResize && !needsCompress) {
                        return [2 /*return*/, null];
                    }
                    pipeline = sharp(inputBuffer);
                    outputMime = mime;
                    if (needsResize) {
                        pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, {
                            fit: 'inside',
                            withoutEnlargement: true,
                        });
                    }
                    return [4 /*yield*/, pipeline.toBuffer()
                        // if still over 4MB, convert to JPEG with progressive quality reduction
                    ];
                case 3:
                    outputBuffer = _b.sent();
                    if (!(outputBuffer.length > MAX_FILE_SIZE)) return [3 /*break*/, 7];
                    _i = 0, _a = [100, 90, 80, 70];
                    _b.label = 4;
                case 4:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    quality = _a[_i];
                    return [4 /*yield*/, sharp(outputBuffer)
                            .jpeg({ quality: quality, mozjpeg: true })
                            .toBuffer()];
                case 5:
                    outputBuffer = _b.sent();
                    outputMime = 'image/jpeg';
                    if (outputBuffer.length <= MAX_FILE_SIZE) {
                        return [3 /*break*/, 7];
                    }
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 4];
                case 7: return [2 /*return*/, {
                        dataUrl: "data:".concat(outputMime, ";base64,").concat(outputBuffer.toString('base64')),
                        mime: outputMime,
                    }];
            }
        });
    });
}
// runtime guard — tool.execute.after output type doesn't declare attachments
function hasAttachments(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'attachments' in value &&
        Array.isArray(value.attachments));
}
var imageOptimizerPlugin = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                'tool.execute.after': function (input, output) { return __awaiter(void 0, void 0, void 0, function () {
                    var tool, _i, _a, att, result;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                tool = input.tool.toLowerCase();
                                if (!(tool === 'read' && hasAttachments(output))) return [3 /*break*/, 4];
                                _i = 0, _a = output.attachments;
                                _b.label = 1;
                            case 1:
                                if (!(_i < _a.length)) return [3 /*break*/, 4];
                                att = _a[_i];
                                if (!att.mime ||
                                    !att.url ||
                                    !SUPPORTED_MIMES.has(att.mime.toLowerCase())) {
                                    return [3 /*break*/, 3];
                                }
                                return [4 /*yield*/, optimizeImage(att.url, att.mime).catch(function () { return null; })];
                            case 2:
                                result = _b.sent();
                                if (result) {
                                    att.url = result.dataUrl;
                                    att.mime = result.mime;
                                }
                                _b.label = 3;
                            case 3:
                                _i++;
                                return [3 /*break*/, 1];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); },
                // clipboard paste: optimize file parts in message history
                'experimental.chat.messages.transform': function (_input, output) { return __awaiter(void 0, void 0, void 0, function () {
                    var _i, _a, msg, _b, _c, part, result;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                if (!output.messages || !Array.isArray(output.messages)) {
                                    return [2 /*return*/];
                                }
                                _i = 0, _a = output.messages;
                                _d.label = 1;
                            case 1:
                                if (!(_i < _a.length)) return [3 /*break*/, 6];
                                msg = _a[_i];
                                if (!msg.parts || !Array.isArray(msg.parts)) {
                                    return [3 /*break*/, 5];
                                }
                                _b = 0, _c = msg.parts;
                                _d.label = 2;
                            case 2:
                                if (!(_b < _c.length)) return [3 /*break*/, 5];
                                part = _c[_b];
                                if (part.type !== 'file') {
                                    return [3 /*break*/, 4];
                                }
                                if (!SUPPORTED_MIMES.has(part.mime.toLowerCase())) {
                                    return [3 /*break*/, 4];
                                }
                                return [4 /*yield*/, optimizeImage(part.url, part.mime).catch(function () { return null; })];
                            case 3:
                                result = _d.sent();
                                if (result) {
                                    part.url = result.dataUrl;
                                    part.mime = result.mime;
                                }
                                _d.label = 4;
                            case 4:
                                _b++;
                                return [3 /*break*/, 2];
                            case 5:
                                _i++;
                                return [3 /*break*/, 1];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); },
            }];
    });
}); };
exports.imageOptimizerPlugin = imageOptimizerPlugin;
