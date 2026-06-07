"use strict";
// Tests for deterministic provider matcher selection and tool-call output.
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
var deterministic_provider_js_1 = require("./deterministic-provider.js");
(0, vitest_1.describe)('createDeterministicProvider', function () {
    (0, vitest_1.test)('emits v3 tool call for matched sleep prompt', function () { return __awaiter(void 0, void 0, void 0, function () {
        var provider, model, result, parts, toolCall;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = (0, deterministic_provider_js_1.createDeterministicProvider)({
                        strict: true,
                        matchers: [
                            {
                                id: 'sleep',
                                when: {
                                    lastMessageRole: 'user',
                                    latestUserTextIncludes: 'sleep 500',
                                },
                                then: {
                                    parts: [
                                        { type: 'stream-start', warnings: [] },
                                        {
                                            type: 'tool-call',
                                            toolCallId: 'sleep-call-1',
                                            toolName: 'bash',
                                            input: JSON.stringify({ command: 'sleep 500' }),
                                        },
                                        {
                                            type: 'finish',
                                            finishReason: 'tool-calls',
                                            usage: {
                                                inputTokens: 1,
                                                outputTokens: 1,
                                                totalTokens: 2,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    });
                    model = provider.languageModel('deterministic-v2');
                    (0, vitest_1.expect)(model.specificationVersion).toBe('v3');
                    return [4 /*yield*/, model.doStream({
                            prompt: [
                                {
                                    role: 'user',
                                    content: [{ type: 'text', text: 'please run sleep 500 now' }],
                                },
                            ],
                        })];
                case 1:
                    result = _a.sent();
                    return [4 /*yield*/, collectParts({ stream: result.stream })];
                case 2:
                    parts = _a.sent();
                    toolCall = parts.find(function (part) {
                        return part.type === 'tool-call';
                    });
                    (0, vitest_1.expect)(toolCall).toBeDefined();
                    if (toolCall && toolCall.type === 'tool-call') {
                        (0, vitest_1.expect)(toolCall.toolName).toBe('bash');
                        (0, vitest_1.expect)(toolCall.input).toContain('sleep 500');
                    }
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('throws for unmatched prompt in strict mode', function () { return __awaiter(void 0, void 0, void 0, function () {
        var provider, model;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    provider = (0, deterministic_provider_js_1.createDeterministicProvider)({
                        strict: true,
                        matchers: [],
                    });
                    model = provider.languageModel('deterministic-v2');
                    return [4 /*yield*/, (0, vitest_1.expect)(model.doGenerate({
                            prompt: [
                                {
                                    role: 'user',
                                    content: [{ type: 'text', text: 'no matcher' }],
                                },
                            ],
                        })).rejects.toThrow('No deterministic matcher matched current prompt')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
function collectParts(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var reader, parts, next;
        var stream = _b.stream;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    reader = stream.getReader();
                    parts = [];
                    _c.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 3];
                    return [4 /*yield*/, reader.read()];
                case 2:
                    next = _c.sent();
                    if (next.done) {
                        return [2 /*return*/, parts];
                    }
                    parts.push(next.value);
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/];
            }
        });
    });
}
