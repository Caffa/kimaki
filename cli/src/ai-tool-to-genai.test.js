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
var ai_tool_js_1 = require("./ai-tool.js");
var zod_1 = require("zod");
var ai_tool_to_genai_js_1 = require("./ai-tool-to-genai.js");
(0, vitest_1.describe)('AI Tool to GenAI Conversion', function () {
    (0, vitest_1.it)('should convert a simple Zod-based tool', function () {
        var weatherTool = (0, ai_tool_js_1.tool)({
            description: 'Get the current weather for a location',
            inputSchema: zod_1.z.object({
                location: zod_1.z.string().describe('The city name'),
                unit: zod_1.z.enum(['celsius', 'fahrenheit']).optional(),
            }),
            execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                var location = _b.location, unit = _b.unit;
                return __generator(this, function (_c) {
                    return [2 /*return*/, {
                            temperature: 72,
                            unit: unit || 'fahrenheit',
                            condition: 'sunny',
                        }];
                });
            }); },
        });
        var genAIFunction = (0, ai_tool_to_genai_js_1.aiToolToGenAIFunction)(weatherTool);
        (0, vitest_1.expect)(genAIFunction).toMatchInlineSnapshot("\n      {\n        \"description\": \"Get the current weather for a location\",\n        \"name\": \"tool\",\n        \"parameters\": {\n          \"properties\": {\n            \"location\": {\n              \"description\": \"The city name\",\n              \"type\": \"STRING\",\n            },\n            \"unit\": {\n              \"enum\": [\n                \"celsius\",\n                \"fahrenheit\",\n              ],\n              \"type\": \"STRING\",\n            },\n          },\n          \"required\": [\n            \"location\",\n          ],\n          \"type\": \"OBJECT\",\n        },\n      }\n    ");
    });
    (0, vitest_1.it)('should handle complex nested schemas', function () {
        var complexTool = (0, ai_tool_js_1.tool)({
            description: 'Process complex data',
            inputSchema: zod_1.z.object({
                user: zod_1.z.object({
                    name: zod_1.z.string(),
                    age: zod_1.z.number().int().min(0).max(150),
                    email: zod_1.z.string().email(),
                }),
                preferences: zod_1.z.array(zod_1.z.string()),
                metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
            }),
            execute: function (input) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, input];
            }); }); },
        });
        var genAIFunction = (0, ai_tool_to_genai_js_1.aiToolToGenAIFunction)(complexTool);
        (0, vitest_1.expect)(genAIFunction.parameters).toMatchInlineSnapshot("\n      {\n        \"properties\": {\n          \"metadata\": {\n            \"type\": \"OBJECT\",\n          },\n          \"preferences\": {\n            \"items\": {\n              \"type\": \"STRING\",\n            },\n            \"type\": \"ARRAY\",\n          },\n          \"user\": {\n            \"properties\": {\n              \"age\": {\n                \"format\": \"int32\",\n                \"maximum\": 150,\n                \"minimum\": 0,\n                \"type\": \"INTEGER\",\n              },\n              \"email\": {\n                \"pattern\": \"^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$\",\n                \"type\": \"STRING\",\n              },\n              \"name\": {\n                \"type\": \"STRING\",\n              },\n            },\n            \"required\": [\n              \"name\",\n              \"age\",\n              \"email\",\n            ],\n            \"type\": \"OBJECT\",\n          },\n        },\n        \"required\": [\n          \"user\",\n          \"preferences\",\n        ],\n        \"type\": \"OBJECT\",\n      }\n    ");
    });
    (0, vitest_1.it)('should extract schema from tool', function () {
        var testTool = (0, ai_tool_js_1.tool)({
            inputSchema: zod_1.z.object({
                test: zod_1.z.string(),
            }),
            execute: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/];
            }); }); },
        });
        var schema = (0, ai_tool_to_genai_js_1.extractSchemaFromTool)(testTool);
        (0, vitest_1.expect)(schema).toMatchInlineSnapshot("\n      {\n        \"$schema\": \"https://json-schema.org/draft/2020-12/schema\",\n        \"additionalProperties\": false,\n        \"properties\": {\n          \"test\": {\n            \"type\": \"string\",\n          },\n        },\n        \"required\": [\n          \"test\",\n        ],\n        \"type\": \"object\",\n      }\n    ");
    });
    (0, vitest_1.it)('should handle tools with no input schema', function () {
        var simpleTool = (0, ai_tool_js_1.tool)({
            description: 'Simple tool with no inputs',
            inputSchema: zod_1.z.object({}),
            execute: function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                return [2 /*return*/, ({ result: 'done' })];
            }); }); },
        });
        var genAIFunction = (0, ai_tool_to_genai_js_1.aiToolToGenAIFunction)(simpleTool);
        (0, vitest_1.expect)(genAIFunction).toMatchInlineSnapshot("\n      {\n        \"description\": \"Simple tool with no inputs\",\n        \"name\": \"tool\",\n        \"parameters\": {\n          \"properties\": {},\n          \"type\": \"OBJECT\",\n        },\n      }\n    ");
    });
    (0, vitest_1.it)('should handle union types', function () {
        var _a, _b;
        var unionTool = (0, ai_tool_js_1.tool)({
            description: 'Tool with union types',
            inputSchema: zod_1.z.object({
                value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean()]),
            }),
            execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                var value = _b.value;
                return __generator(this, function (_c) {
                    return [2 /*return*/, ({ received: value })];
                });
            }); },
        });
        var genAIFunction = (0, ai_tool_to_genai_js_1.aiToolToGenAIFunction)(unionTool);
        (0, vitest_1.expect)((_b = (_a = genAIFunction.parameters) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b.value).toMatchInlineSnapshot("\n      {\n        \"anyOf\": [\n          {\n            \"type\": \"STRING\",\n          },\n          {\n            \"format\": \"float\",\n            \"type\": \"NUMBER\",\n          },\n          {\n            \"type\": \"BOOLEAN\",\n          },\n        ],\n      }\n    ");
    });
    (0, vitest_1.it)('should create a CallableTool', function () { return __awaiter(void 0, void 0, void 0, function () {
        var weatherTool, callableTool, genAITool, functionCall, parts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    weatherTool = (0, ai_tool_js_1.tool)({
                        description: 'Get weather',
                        inputSchema: zod_1.z.object({
                            location: zod_1.z.string(),
                        }),
                        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                            var location = _b.location;
                            return __generator(this, function (_c) {
                                return [2 /*return*/, ({
                                        temperature: 72,
                                        location: location,
                                    })];
                            });
                        }); },
                    });
                    callableTool = (0, ai_tool_to_genai_js_1.aiToolToCallableTool)(weatherTool, 'weather');
                    return [4 /*yield*/, callableTool.tool()];
                case 1:
                    genAITool = _a.sent();
                    (0, vitest_1.expect)(genAITool.functionDeclarations).toMatchInlineSnapshot("\n      [\n        {\n          \"description\": \"Get weather\",\n          \"name\": \"weather\",\n          \"parameters\": {\n            \"properties\": {\n              \"location\": {\n                \"type\": \"STRING\",\n              },\n            },\n            \"required\": [\n              \"location\",\n            ],\n            \"type\": \"OBJECT\",\n          },\n        },\n      ]\n    ");
                    functionCall = {
                        id: 'call_123',
                        name: 'weather',
                        args: { location: 'San Francisco' },
                    };
                    return [4 /*yield*/, callableTool.callTool([functionCall])];
                case 2:
                    parts = _a.sent();
                    (0, vitest_1.expect)(parts).toMatchInlineSnapshot("\n      [\n        {\n          \"functionResponse\": {\n            \"id\": \"call_123\",\n            \"name\": \"weather\",\n            \"response\": {\n              \"output\": {\n                \"location\": \"San Francisco\",\n                \"temperature\": 72,\n              },\n            },\n          },\n        },\n      ]\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.it)('should handle tool execution errors', function () { return __awaiter(void 0, void 0, void 0, function () {
        var errorTool, callableTool, functionCall, parts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    errorTool = (0, ai_tool_js_1.tool)({
                        description: 'Tool that throws',
                        inputSchema: zod_1.z.object({
                            trigger: zod_1.z.boolean(),
                        }),
                        execute: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                            var trigger = _b.trigger;
                            return __generator(this, function (_c) {
                                if (trigger) {
                                    throw new Error('Tool execution failed');
                                }
                                return [2 /*return*/, { success: true }];
                            });
                        }); },
                    });
                    callableTool = (0, ai_tool_to_genai_js_1.aiToolToCallableTool)(errorTool, 'error_tool');
                    functionCall = {
                        id: 'call_error',
                        name: 'error_tool',
                        args: { trigger: true },
                    };
                    return [4 /*yield*/, callableTool.callTool([functionCall])];
                case 1:
                    parts = _a.sent();
                    (0, vitest_1.expect)(parts).toMatchInlineSnapshot("\n      [\n        {\n          \"functionResponse\": {\n            \"id\": \"call_error\",\n            \"name\": \"error_tool\",\n            \"response\": {\n              \"error\": \"Tool execution failed\",\n            },\n          },\n        },\n      ]\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
});
