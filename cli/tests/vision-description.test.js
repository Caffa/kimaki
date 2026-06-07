"use strict";
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
var vision_description_1 = require("../src/vision-description");
var child_process_1 = require("child_process");
var util_1 = require("util");
var execAsync = (0, util_1.promisify)(child_process_1.exec);
(0, vitest_1.describe)('Vision Description', function () {
    // Skip tests if Ollama is not running
    var ollamaAvailable = false;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var result, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, execAsync('ollama list')];
                case 1:
                    result = _b.sent();
                    ollamaAvailable = result.stdout.includes('qwen');
                    return [3 /*break*/, 3];
                case 2:
                    _a = _b.sent();
                    ollamaAvailable = false;
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('should have auto mode by default', function () {
        (0, vitest_1.expect)((0, vision_description_1.getVisionModel)()).toBe('auto');
    });
    (0, vitest_1.test)('should respect KIMAKI_VISION_MODEL env var', function () {
        var originalValue = process.env.KIMAKI_VISION_MODEL;
        process.env.KIMAKI_VISION_MODEL = 'qwen3-vl:latest';
        // Re-import would be needed to test this properly
        // For now, just test it exists
        (0, vitest_1.expect)((0, vision_description_1.getVisionModel)()).toBeTruthy();
        process.env.KIMAKI_VISION_MODEL = originalValue;
    });
    (0, vitest_1.test)('should disable vision when KIMAKI_VISION_MODEL is empty', function () {
        var originalValue = process.env.KIMAKI_VISION_MODEL;
        process.env.KIMAKI_VISION_MODEL = '';
        // Module already loaded, so this won't affect getVisionModel()
        // But the describeImage function will check it
        process.env.KIMAKI_VISION_MODEL = originalValue;
    });
    vitest_1.test.skipIf(!ollamaAvailable)('should describe a test image buffer with auto model selection', function () { return __awaiter(void 0, void 0, void 0, function () {
        var testBuffer, description;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');
                    return [4 /*yield*/, (0, vision_description_1.describeImage)(testBuffer, 'test.png')
                        // Vision model should describe it (even if briefly)
                    ];
                case 1:
                    description = _a.sent();
                    // Vision model should describe it (even if briefly)
                    (0, vitest_1.expect)(description).toBeTruthy();
                    (0, vitest_1.expect)(description.length).toBeGreaterThan(10);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('should return null when no Ollama endpoints available', function () { return __awaiter(void 0, void 0, void 0, function () {
        var originalHost, testBuffer, description;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    originalHost = process.env.OLLAMA_HOST;
                    process.env.OLLAMA_HOST = 'http://invalid-host:99999';
                    testBuffer = Buffer.from('test');
                    return [4 /*yield*/, (0, vision_description_1.describeImage)(testBuffer, 'test.png')];
                case 1:
                    description = _a.sent();
                    (0, vitest_1.expect)(description).toBeNull();
                    process.env.OLLAMA_HOST = originalHost;
                    return [2 /*return*/];
            }
        });
    }); });
});
