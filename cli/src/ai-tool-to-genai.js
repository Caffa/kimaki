"use strict";
// Tool definition to Google GenAI tool converter.
// Transforms Kimaki's minimal Tool definitions into Google GenAI CallableTool format
// for use with Gemini's function calling in the voice assistant.
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
exports.aiToolToGenAIFunction = aiToolToGenAIFunction;
exports.aiToolToCallableTool = aiToolToCallableTool;
exports.extractSchemaFromTool = extractSchemaFromTool;
exports.callableToolsFromObject = callableToolsFromObject;
var genai_1 = require("@google/genai");
var zod_1 = require("zod");
/**
 * Convert JSON Schema to GenAI Schema format
 * Based on the actual implementation used by the GenAI package:
 * https://github.com/googleapis/js-genai/blob/027f09db662ce6b30f737b10b4d2efcb4282a9b6/src/_transformers.ts#L294
 */
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function jsonSchemaToGenAISchema(jsonSchema) {
    var schema = {};
    if (typeof jsonSchema === 'boolean') {
        return schema;
    }
    var jsonSchemaType = (function () {
        if (!jsonSchema.type) {
            return undefined;
        }
        if (typeof jsonSchema.type === 'string') {
            return jsonSchema.type;
        }
        if (Array.isArray(jsonSchema.type)) {
            return jsonSchema.type.find(function (t) { return t !== 'null'; }) || jsonSchema.type[0];
        }
        return undefined;
    })();
    if (Array.isArray(jsonSchema.type) && jsonSchema.type.includes('null')) {
        schema.nullable = true;
    }
    if (jsonSchemaType) {
        switch (jsonSchemaType) {
            case 'string':
                schema.type = genai_1.Type.STRING;
                break;
            case 'number':
                schema.type = genai_1.Type.NUMBER;
                schema.format =
                    typeof jsonSchema.format === 'string' ? jsonSchema.format : 'float';
                break;
            case 'integer':
                schema.type = genai_1.Type.INTEGER;
                schema.format =
                    typeof jsonSchema.format === 'string' ? jsonSchema.format : 'int32';
                break;
            case 'boolean':
                schema.type = genai_1.Type.BOOLEAN;
                break;
            case 'array': {
                schema.type = genai_1.Type.ARRAY;
                var itemsSchema = (function () {
                    if (!jsonSchema.items) {
                        return undefined;
                    }
                    if (Array.isArray(jsonSchema.items)) {
                        return jsonSchema.items[0];
                    }
                    return jsonSchema.items;
                })();
                if (itemsSchema) {
                    schema.items = jsonSchemaToGenAISchema(itemsSchema);
                }
                if (typeof jsonSchema.minItems === 'number') {
                    schema.minItems = String(jsonSchema.minItems);
                }
                if (typeof jsonSchema.maxItems === 'number') {
                    schema.maxItems = String(jsonSchema.maxItems);
                }
                break;
            }
            case 'object':
                schema.type = genai_1.Type.OBJECT;
                if (jsonSchema.properties) {
                    schema.properties = Object.fromEntries(Object.entries(jsonSchema.properties).map(function (_a) {
                        var key = _a[0], value = _a[1];
                        return [
                            key,
                            jsonSchemaToGenAISchema(value),
                        ];
                    }));
                }
                if (Array.isArray(jsonSchema.required)) {
                    schema.required = jsonSchema.required;
                }
                break;
        }
    }
    if (typeof jsonSchema.description === 'string') {
        schema.description = jsonSchema.description;
    }
    if (Array.isArray(jsonSchema.enum)) {
        schema.enum = jsonSchema.enum.map(function (x) { return String(x); });
    }
    if ('default' in jsonSchema) {
        schema.default = jsonSchema.default;
    }
    if (Array.isArray(jsonSchema.examples) && jsonSchema.examples.length > 0) {
        schema.example = jsonSchema.examples[0];
    }
    if (Array.isArray(jsonSchema.anyOf)) {
        schema.anyOf = jsonSchema.anyOf.map(function (s) { return jsonSchemaToGenAISchema(s); });
    }
    else if (Array.isArray(jsonSchema.oneOf)) {
        schema.anyOf = jsonSchema.oneOf.map(function (s) { return jsonSchemaToGenAISchema(s); });
    }
    if (typeof jsonSchema.minimum === 'number') {
        schema.minimum = jsonSchema.minimum;
    }
    if (typeof jsonSchema.maximum === 'number') {
        schema.maximum = jsonSchema.maximum;
    }
    if (typeof jsonSchema.minLength === 'number') {
        schema.minLength = String(jsonSchema.minLength);
    }
    if (typeof jsonSchema.maxLength === 'number') {
        schema.maxLength = String(jsonSchema.maxLength);
    }
    if (typeof jsonSchema.pattern === 'string') {
        schema.pattern = jsonSchema.pattern;
    }
    return schema;
}
/**
 * Convert AI SDK Tool to GenAI FunctionDeclaration
 */
function aiToolToGenAIFunction(tool) {
    // Extract the input schema - assume it's a Zod schema
    var inputSchema = tool.inputSchema;
    // Get the tool name from the schema or generate one
    var toolName = 'tool';
    var jsonSchema = {};
    if (inputSchema) {
        // Convert Zod schema to JSON Schema
        jsonSchema = (0, zod_1.toJSONSchema)(inputSchema);
        // Extract name from Zod description if available
        var description = inputSchema.description;
        if (description) {
            var nameMatch = description.match(/name:\s*(\w+)/);
            if (nameMatch) {
                toolName = nameMatch[1] || '';
            }
        }
    }
    // Convert JSON Schema to GenAI Schema
    var genAISchema = jsonSchemaToGenAISchema(jsonSchema);
    // Create the FunctionDeclaration
    var functionDeclaration = {
        name: toolName,
        description: tool.description || jsonSchema.description || 'Tool function',
        parameters: genAISchema,
    };
    return functionDeclaration;
}
/**
 * Convert AI SDK Tool to GenAI CallableTool
 */
function aiToolToCallableTool(tool, name) {
    var toolName = name || 'tool';
    return {
        name: name,
        tool: function () {
            return __awaiter(this, void 0, void 0, function () {
                var functionDeclaration;
                return __generator(this, function (_a) {
                    functionDeclaration = aiToolToGenAIFunction(tool);
                    if (name) {
                        functionDeclaration.name = name;
                    }
                    return [2 /*return*/, {
                            functionDeclarations: [functionDeclaration],
                        }];
                });
            });
        },
        callTool: function (functionCalls) {
            return __awaiter(this, void 0, void 0, function () {
                var parts, _i, functionCalls_1, functionCall, args, result, part, error_1, part;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            parts = [];
                            _i = 0, functionCalls_1 = functionCalls;
                            _a.label = 1;
                        case 1:
                            if (!(_i < functionCalls_1.length)) return [3 /*break*/, 6];
                            functionCall = functionCalls_1[_i];
                            // Check if this function call matches our tool
                            if (functionCall.name !== toolName &&
                                name &&
                                functionCall.name !== name) {
                                return [3 /*break*/, 5];
                            }
                            if (!tool.execute) return [3 /*break*/, 5];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            args = isRecord(functionCall.args)
                                ? functionCall.args
                                : {};
                            return [4 /*yield*/, tool.execute(args, {
                                    toolCallId: functionCall.id || '',
                                    messages: [],
                                })
                                // Convert the result to a Part
                            ];
                        case 3:
                            result = _a.sent();
                            part = {
                                functionResponse: {
                                    id: functionCall.id,
                                    name: functionCall.name || toolName,
                                    response: {
                                        output: result,
                                    },
                                },
                            };
                            parts.push(part);
                            return [3 /*break*/, 5];
                        case 4:
                            error_1 = _a.sent();
                            part = {
                                functionResponse: {
                                    id: functionCall.id,
                                    name: functionCall.name || toolName,
                                    response: {
                                        error: error_1 instanceof Error ? error_1.message : String(error_1),
                                    },
                                },
                            };
                            parts.push(part);
                            return [3 /*break*/, 5];
                        case 5:
                            _i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, parts];
                    }
                });
            });
        },
    };
}
function extractSchemaFromTool(tool) {
    var inputSchema = tool.inputSchema;
    if (!inputSchema) {
        return {};
    }
    // Convert Zod schema to JSON Schema
    return (0, zod_1.toJSONSchema)(inputSchema);
}
/**
 * Given an object of tools, creates an array of CallableTool
 */
function callableToolsFromObject(tools) {
    return Object.entries(tools).map(function (_a) {
        var name = _a[0], tool = _a[1];
        return aiToolToCallableTool(tool, name);
    });
}
