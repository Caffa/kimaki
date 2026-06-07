"use strict";
// Vision description using Ollama models (cloud-first with local fallback)
// Dynamically discovers vision-capable models from installed Ollama models
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
exports.describeImage = describeImage;
exports.getVisionModel = getVisionModel;
var logger_js_1 = require("./logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.FORMATTING);
// Vision model preference: cloud > local vision > local fallback
var CLOUD_VISION_MODELS = [
    'gemma3:27b-cloud',
    'gemma3:12b-cloud',
    'gemma3:4b-cloud',
];
// Known vision-capable model families (auto-detected from model details)
var VISION_FAMILIES = new Set([
    'llava',
    'qwen3vl',
    'llama3.2-vision',
    'minicpm-v',
    'moondream',
    'bakllava',
    'xgen',
    'fuyu',
]);
// Fallback models when no vision-specific models found
var LOCAL_FALLBACK_PRIORITY = [
    'qwen3-vl:latest',
    'llava:latest',
    'llama3.2-vision:latest',
    'gemma3:12b',
    'gemma3:4b',
];
var VISION_MODEL_OVERRIDE = process.env.KIMAKI_VISION_MODEL;
var VISION_PROMPT = "You are analyzing a screenshot to help an AI coding assistant debug an issue. The user has shared this image as context.\n\nDescribe what you see in extreme detail, focusing on information relevant to debugging and coding:\n\n1. **Text Content** (most important):\n   - Exact error messages, stack traces, log output\n   - Code snippets visible in the image\n   - File paths, line numbers, function names\n   - Configuration values, environment variables\n   - Command output or terminal text\n\n2. **UI/Application State**:\n   - What application is this? (IDE, browser, terminal, etc.)\n   - Window title, tabs, active panel\n   - UI elements with their current state/status\n   - Highlighted text, cursor position, selections\n   - Any visible notifications or warnings\n\n3. **Code Context** (if applicable):\n   - Programming language/framework\n   - File structure or project layout\n   - Git status, branches, diffs\n   - Test results or build output\n\n4. **Visual Debugging Clues**:\n   - Color coding (errors in red, warnings in yellow)\n   - Icons indicating status (error icons, loading spinners)\n   - Layout issues or visual glitches\n   - Unexpected behavior visible in the UI\n\nBe specific and precise - quote exact error messages, include exact filenames, note exact line numbers. The AI assistant needs detailed text to write code fixes.";
function checkOllamaHealth() {
    return __awaiter(this, void 0, void 0, function () {
        var ollamaUrl, response, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(ollamaUrl, "/api/tags"), {
                            method: 'GET',
                            signal: AbortSignal.timeout(2000),
                        })];
                case 2:
                    response = _b.sent();
                    return [2 /*return*/, response.ok];
                case 3:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function listLocalModels() {
    return __awaiter(this, void 0, void 0, function () {
        var ollamaUrl, response, data, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(ollamaUrl, "/api/tags"), {
                            method: 'GET',
                            signal: AbortSignal.timeout(2000),
                        })];
                case 2:
                    response = _c.sent();
                    if (!response.ok)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = (_c.sent());
                    return [2 /*return*/, ((_b = data.models) === null || _b === void 0 ? void 0 : _b.map(function (m) { return m.name; })) || []];
                case 4:
                    _a = _c.sent();
                    return [2 /*return*/, []];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function isVisionCapableModel(modelName) {
    return __awaiter(this, void 0, void 0, function () {
        var ollamaUrl, response, data, families, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(ollamaUrl, "/api/show"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ name: modelName }),
                            signal: AbortSignal.timeout(1000),
                        })];
                case 2:
                    response = _b.sent();
                    if (!response.ok)
                        return [2 /*return*/, false];
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = (_b.sent());
                    if (!data.details)
                        return [2 /*return*/, false
                            // Check if any of the model's families are vision-capable
                        ];
                    families = data.details.families || [data.details.family];
                    return [2 /*return*/, families.some(function (f) { return VISION_FAMILIES.has(f.toLowerCase()); })];
                case 4:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function discoverLocalVisionModels() {
    return __awaiter(this, void 0, void 0, function () {
        var allModels, visionModels, _i, allModels_1, model, isVision;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, listLocalModels()];
                case 1:
                    allModels = _a.sent();
                    visionModels = [];
                    _i = 0, allModels_1 = allModels;
                    _a.label = 2;
                case 2:
                    if (!(_i < allModels_1.length)) return [3 /*break*/, 5];
                    model = allModels_1[_i];
                    return [4 /*yield*/, isVisionCapableModel(model)];
                case 3:
                    isVision = _a.sent();
                    if (isVision) {
                        visionModels.push(model);
                        logger.log("Discovered vision-capable model: ".concat(model));
                    }
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/, visionModels];
            }
        });
    });
}
function checkCloudAuth() {
    return __awaiter(this, void 0, void 0, function () {
        var result, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, fetch('https://ollama.com/api/auth/check', {
                            method: 'GET',
                            signal: AbortSignal.timeout(2000),
                        })];
                case 1:
                    result = _b.sent();
                    return [2 /*return*/, result.ok];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function tryVisionModel(model, imageBase64, isCloud) {
    return __awaiter(this, void 0, void 0, function () {
        var ollamaUrl, response, error, result, description, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    ollamaUrl = isCloud
                        ? 'https://ollama.com/api'
                        : process.env.OLLAMA_HOST || 'http://localhost:11434';
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, fetch("".concat(ollamaUrl, "/chat"), {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                model: model,
                                messages: [
                                    {
                                        role: 'user',
                                        content: [
                                            {
                                                type: 'text',
                                                text: VISION_PROMPT,
                                            },
                                            {
                                                type: 'image_url',
                                                image_url: {
                                                    url: "data:image/jpeg;base64,".concat(imageBase64),
                                                },
                                            },
                                        ],
                                    },
                                ],
                                stream: false,
                            }),
                            signal: AbortSignal.timeout(90000), // 90s timeout for cloud models
                        })];
                case 2:
                    response = _c.sent();
                    if (!!response.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, response.json()];
                case 3:
                    error = (_c.sent());
                    logger.log("".concat(isCloud ? 'Cloud' : 'Local', " model ").concat(model, " failed: ").concat(error.error || response.statusText));
                    return [2 /*return*/, null];
                case 4: return [4 /*yield*/, response.json()];
                case 5:
                    result = (_c.sent());
                    description = (_b = (_a = result.message) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.trim();
                    if (!description) {
                        logger.log("Empty response from ".concat(model));
                        return [2 /*return*/, null];
                    }
                    logger.log("\u2713 ".concat(isCloud ? 'Cloud' : 'Local', " model ").concat(model, " succeeded"));
                    return [2 /*return*/, description];
                case 6:
                    error_1 = _c.sent();
                    if (error_1 instanceof Error && error_1.name === 'AbortError') {
                        logger.log("".concat(model, " request timed out"));
                    }
                    else {
                        logger.log("".concat(model, " request failed:"), error_1);
                    }
                    return [2 /*return*/, null];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function describeImage(imageBuffer, filename) {
    return __awaiter(this, void 0, void 0, function () {
        var isCloud, base64_1, isHealthy, hasCloudAuth, base64, _i, CLOUD_VISION_MODELS_1, model, description, discoveredVisionModels, _a, discoveredVisionModels_1, model, description, allModels, _loop_1, _b, LOCAL_FALLBACK_PRIORITY_1, model, state_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // If user specified a model explicitly, use only that
                    if (VISION_MODEL_OVERRIDE) {
                        if (VISION_MODEL_OVERRIDE === '') {
                            logger.log('Vision model disabled via KIMAKI_VISION_MODEL=""');
                            return [2 /*return*/, null];
                        }
                        logger.log("Using override model: ".concat(VISION_MODEL_OVERRIDE));
                        isCloud = VISION_MODEL_OVERRIDE.endsWith('-cloud');
                        base64_1 = imageBuffer.toString('base64');
                        return [2 /*return*/, tryVisionModel(VISION_MODEL_OVERRIDE, base64_1, isCloud)];
                    }
                    return [4 /*yield*/, checkOllamaHealth()];
                case 1:
                    isHealthy = _c.sent();
                    return [4 /*yield*/, checkCloudAuth()];
                case 2:
                    hasCloudAuth = _c.sent();
                    if (!isHealthy && !hasCloudAuth) {
                        logger.log('No Ollama endpoint available (local or cloud)');
                        return [2 /*return*/, null];
                    }
                    base64 = imageBuffer.toString('base64');
                    if (!hasCloudAuth) return [3 /*break*/, 6];
                    _i = 0, CLOUD_VISION_MODELS_1 = CLOUD_VISION_MODELS;
                    _c.label = 3;
                case 3:
                    if (!(_i < CLOUD_VISION_MODELS_1.length)) return [3 /*break*/, 6];
                    model = CLOUD_VISION_MODELS_1[_i];
                    return [4 /*yield*/, tryVisionModel(model, base64, true)];
                case 4:
                    description = _c.sent();
                    if (description) {
                        return [2 /*return*/, description];
                    }
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    if (!isHealthy) return [3 /*break*/, 16];
                    return [4 /*yield*/, discoverLocalVisionModels()];
                case 7:
                    discoveredVisionModels = _c.sent();
                    if (!(discoveredVisionModels.length > 0)) return [3 /*break*/, 11];
                    logger.log("Found ".concat(discoveredVisionModels.length, " vision-capable model(s): ").concat(discoveredVisionModels.join(', ')));
                    _a = 0, discoveredVisionModels_1 = discoveredVisionModels;
                    _c.label = 8;
                case 8:
                    if (!(_a < discoveredVisionModels_1.length)) return [3 /*break*/, 11];
                    model = discoveredVisionModels_1[_a];
                    return [4 /*yield*/, tryVisionModel(model, base64, false)];
                case 9:
                    description = _c.sent();
                    if (description) {
                        return [2 /*return*/, description];
                    }
                    _c.label = 10;
                case 10:
                    _a++;
                    return [3 /*break*/, 8];
                case 11: return [4 /*yield*/, listLocalModels()];
                case 12:
                    allModels = _c.sent();
                    _loop_1 = function (model) {
                        var modelPrefix, description;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    modelPrefix = model.split(':')[0];
                                    if (!(modelPrefix && allModels.some(function (m) { return m.startsWith(modelPrefix); }))) return [3 /*break*/, 2];
                                    return [4 /*yield*/, tryVisionModel(model, base64, false)];
                                case 1:
                                    description = _d.sent();
                                    if (description) {
                                        return [2 /*return*/, { value: description }];
                                    }
                                    _d.label = 2;
                                case 2: return [2 /*return*/];
                            }
                        });
                    };
                    _b = 0, LOCAL_FALLBACK_PRIORITY_1 = LOCAL_FALLBACK_PRIORITY;
                    _c.label = 13;
                case 13:
                    if (!(_b < LOCAL_FALLBACK_PRIORITY_1.length)) return [3 /*break*/, 16];
                    model = LOCAL_FALLBACK_PRIORITY_1[_b];
                    return [5 /*yield**/, _loop_1(model)];
                case 14:
                    state_1 = _c.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _c.label = 15;
                case 15:
                    _b++;
                    return [3 /*break*/, 13];
                case 16:
                    logger.log('All vision models failed, returning null');
                    return [2 /*return*/, null];
            }
        });
    });
}
function getVisionModel() {
    return VISION_MODEL_OVERRIDE || 'auto';
}
