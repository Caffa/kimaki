"use strict";
// Deterministic AI SDK provider for e2e tests with matcher-driven outputs.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeterministicProvider = createDeterministicProvider;
exports.buildDeterministicOpencodeConfig = buildDeterministicOpencodeConfig;
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var DEFAULT_USAGE = {
    inputTokens: {
        total: 0,
        noCache: 0,
        cacheRead: undefined,
        cacheWrite: undefined,
    },
    outputTokens: {
        total: 0,
        text: 0,
        reasoning: 0,
    },
};
var DEFAULT_TEXT_STREAM_PARTS = [
    { type: 'stream-start', warnings: [] },
    { type: 'text-start', id: 'default-text' },
    { type: 'text-delta', id: 'default-text', delta: 'ok' },
    { type: 'text-end', id: 'default-text' },
    {
        type: 'finish',
        finishReason: 'stop',
        usage: DEFAULT_USAGE,
    },
];
function createDeterministicProvider(settings) {
    var _this = this;
    if (settings === void 0) { settings = {}; }
    var normalizedSettings = normalizeSettingsInput({ input: settings });
    var providerName = normalizedSettings.name || 'deterministic-provider';
    var normalizedMatchers = normalizeMatchers({
        matchers: normalizedSettings.matchers || [],
    });
    var buildLanguageModel = function (_a) {
        var modelId = _a.modelId;
        return {
            specificationVersion: 'v3',
            provider: providerName,
            modelId: modelId,
            supportedUrls: {},
            doGenerate: function (options) { return __awaiter(_this, void 0, void 0, function () {
                var resolved, ensured;
                return __generator(this, function (_a) {
                    resolved = resolveMatch({
                        options: options,
                        normalizedMatchers: normalizedMatchers,
                        settings: normalizedSettings,
                    });
                    ensured = ensureTerminalStreamPartsAndDelays({
                        parts: resolved.parts,
                        partDelaysMs: resolved.partDelaysMs,
                    });
                    return [2 /*return*/, buildGenerateResult({ parts: ensured.parts })];
                });
            }); },
            doStream: function (options) { return __awaiter(_this, void 0, void 0, function () {
                var resolved, ensured, stream;
                return __generator(this, function (_a) {
                    resolved = resolveMatch({
                        options: options,
                        normalizedMatchers: normalizedMatchers,
                        settings: normalizedSettings,
                    });
                    ensured = ensureTerminalStreamPartsAndDelays({
                        parts: resolved.parts,
                        partDelaysMs: resolved.partDelaysMs,
                    });
                    stream = new ReadableStream({
                        start: function (controller) {
                            void streamPartsWithDelay({
                                controller: controller,
                                parts: ensured.parts,
                                partDelaysMs: ensured.partDelaysMs,
                                matcherDefaultPartDelayMs: resolved.defaultPartDelayMs,
                                providerDefaultPartDelayMs: normalizedSettings.defaultPartDelayMs,
                            });
                        },
                    });
                    return [2 /*return*/, { stream: stream }];
                });
            }); },
        };
    };
    var provider = (function (modelId) {
        return buildLanguageModel({ modelId: modelId });
    });
    provider.languageModel = function (modelId) {
        return buildLanguageModel({ modelId: modelId });
    };
    return provider;
}
function buildDeterministicOpencodeConfig(_a) {
    var _b, _c, _d;
    var model = _a.model, smallModel = _a.smallModel, providerName = _a.providerName, providerNpm = _a.providerNpm, settings = _a.settings;
    var chosenProviderName = providerName || 'deterministic-provider';
    var packageRoot = node_path_1.default.resolve(node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url)), '..');
    var chosenProviderNpm = providerNpm || packageRoot;
    return __assign({ $schema: 'https://opencode.ai/config.json', provider: (_b = {},
            _b[chosenProviderName] = {
                npm: chosenProviderNpm,
                name: 'Deterministic Provider',
                options: settings || {},
                models: __assign((_c = {}, _c[model] = {
                    name: model,
                }, _c), (smallModel
                    ? (_d = {},
                        _d[smallModel] = {
                            name: smallModel,
                        },
                        _d) : {})),
            },
            _b), model: "".concat(chosenProviderName, "/").concat(model) }, (smallModel && {
        small_model: "".concat(chosenProviderName, "/").concat(smallModel),
    }));
}
function normalizeMatchers(_a) {
    var matchers = _a.matchers;
    return matchers.map(function (matcher) {
        var _a, _b, _c, _d;
        var rawPromptRegexText = (_a = matcher.when) === null || _a === void 0 ? void 0 : _a.rawPromptRegex;
        var promptRegexText = (_b = matcher.when) === null || _b === void 0 ? void 0 : _b.promptTextRegex;
        var lastMessageRegexText = (_c = matcher.when) === null || _c === void 0 ? void 0 : _c.lastMessageTextRegex;
        var regexText = (_d = matcher.when) === null || _d === void 0 ? void 0 : _d.latestUserTextRegex;
        if (!regexText &&
            !lastMessageRegexText &&
            !promptRegexText &&
            !rawPromptRegexText) {
            return matcher;
        }
        return __assign(__assign(__assign(__assign(__assign({}, matcher), (regexText && {
            compiledRegex: new RegExp(regexText),
        })), (lastMessageRegexText && {
            compiledLastMessageRegex: new RegExp(lastMessageRegexText),
        })), (promptRegexText && {
            compiledPromptRegex: new RegExp(promptRegexText),
        })), (rawPromptRegexText && {
            compiledRawPromptRegex: new RegExp(rawPromptRegexText),
        }));
    });
}
function normalizeSettingsInput(_a) {
    var input = _a.input;
    var root = input && typeof input === 'object' ? input : {};
    var candidate = 'options' in root && root['options'] && typeof root['options'] === 'object'
        ? root['options']
        : root;
    var parseMatchers = function () {
        var raw = candidate['matchers'];
        if (Array.isArray(raw)) {
            return raw;
        }
        if (typeof raw === 'string') {
            try {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return parsed;
                }
            }
            catch (_a) {
                return [];
            }
        }
        return [];
    };
    var parseDefaultParts = function () {
        var raw = candidate['defaultParts'];
        if (Array.isArray(raw)) {
            return raw;
        }
        return undefined;
    };
    return {
        name: typeof candidate['name'] === 'string' ? candidate['name'] : undefined,
        matchers: parseMatchers(),
        defaultPartDelayMs: typeof candidate['defaultPartDelayMs'] === 'number'
            ? candidate['defaultPartDelayMs']
            : undefined,
        strict: typeof candidate['strict'] === 'boolean' ? candidate['strict'] : undefined,
        defaultParts: parseDefaultParts(),
    };
}
function resolveMatch(_a) {
    var options = _a.options, normalizedMatchers = _a.normalizedMatchers, settings = _a.settings;
    var sortedMatchers = __spreadArray([], normalizedMatchers, true).sort(function (a, b) {
        return (b.priority || 0) - (a.priority || 0);
    });
    var matched = sortedMatchers.find(function (matcher) {
        return matcherMatches({ matcher: matcher, options: options });
    });
    if (matched) {
        return {
            parts: matched.then.parts,
            partDelaysMs: matched.then.partDelaysMs,
            defaultPartDelayMs: matched.then.defaultPartDelayMs,
        };
    }
    if (settings.strict) {
        var latestUserText = getLatestUserText({ prompt: options.prompt });
        var lastMessageRole = getLastMessageRole({ prompt: options.prompt });
        throw new Error("No deterministic matcher matched current prompt (lastRole=".concat(String(lastMessageRole), ", latestUserText=").concat(JSON.stringify(latestUserText), ")"));
    }
    return {
        parts: settings.defaultParts || DEFAULT_TEXT_STREAM_PARTS,
        defaultPartDelayMs: settings.defaultPartDelayMs,
    };
}
function matcherMatches(_a) {
    var matcher = _a.matcher, options = _a.options;
    if (matcher.enabled === false) {
        return false;
    }
    var when = matcher.when;
    if (!when) {
        return true;
    }
    var lastRole = getLastMessageRole({ prompt: options.prompt });
    if (when.lastMessageRole && when.lastMessageRole !== lastRole) {
        return false;
    }
    var lastMessageText = getLastMessageText({ prompt: options.prompt });
    if (when.lastMessageTextIncludes !== undefined &&
        !lastMessageText.includes(when.lastMessageTextIncludes)) {
        return false;
    }
    if (matcher.compiledLastMessageRegex &&
        !matcher.compiledLastMessageRegex.test(lastMessageText)) {
        return false;
    }
    var promptText = getPromptText({ prompt: options.prompt });
    if (when.promptTextIncludes !== undefined &&
        !promptText.includes(when.promptTextIncludes)) {
        return false;
    }
    if (matcher.compiledPromptRegex && !matcher.compiledPromptRegex.test(promptText)) {
        return false;
    }
    var rawPromptText = JSON.stringify(options.prompt);
    if (when.rawPromptIncludes !== undefined &&
        !rawPromptText.includes(when.rawPromptIncludes)) {
        return false;
    }
    if (matcher.compiledRawPromptRegex &&
        !matcher.compiledRawPromptRegex.test(rawPromptText)) {
        return false;
    }
    var latestUserText = getLatestUserText({ prompt: options.prompt });
    if (when.latestUserTextEquals !== undefined &&
        latestUserText !== when.latestUserTextEquals) {
        return false;
    }
    if (when.latestUserTextIncludes !== undefined &&
        !latestUserText.includes(when.latestUserTextIncludes)) {
        return false;
    }
    if (matcher.compiledRegex && !matcher.compiledRegex.test(latestUserText)) {
        return false;
    }
    return true;
}
function getLastMessageRole(_a) {
    var prompt = _a.prompt;
    var last = prompt[prompt.length - 1];
    if (!last) {
        return undefined;
    }
    return last.role;
}
function getLastMessageText(_a) {
    var prompt = _a.prompt;
    var last = prompt[prompt.length - 1];
    if (!last) {
        return '';
    }
    if (last.role === 'system') {
        return last.content;
    }
    if (!Array.isArray(last.content)) {
        return '';
    }
    return last.content.reduce(function (acc, part) {
        if (part.type !== 'text' || typeof part.text !== 'string') {
            return acc;
        }
        return acc ? "".concat(acc, "\n").concat(part.text) : part.text;
    }, '');
}
function getLatestUserText(_a) {
    var prompt = _a.prompt;
    var latestUserMessage = __spreadArray([], prompt, true).reverse().find(function (message) {
        return message.role === 'user';
    });
    if (!latestUserMessage) {
        return '';
    }
    if (!Array.isArray(latestUserMessage.content)) {
        return '';
    }
    return latestUserMessage.content.reduce(function (acc, part) {
        if (part.type !== 'text' || typeof part.text !== 'string') {
            return acc;
        }
        return acc ? "".concat(acc, "\n").concat(part.text) : part.text;
    }, '');
}
function getPromptText(_a) {
    var prompt = _a.prompt;
    return prompt
        .map(function (message) {
        if (message.role === 'system') {
            return message.content;
        }
        if (!Array.isArray(message.content)) {
            return '';
        }
        return message.content.reduce(function (acc, part) {
            if (part.type !== 'text' || typeof part.text !== 'string') {
                return acc;
            }
            return acc ? "".concat(acc, "\n").concat(part.text) : part.text;
        }, '');
    })
        .join('\n');
}
function ensureTerminalStreamPartsAndDelays(_a) {
    var parts = _a.parts, partDelaysMs = _a.partDelaysMs;
    var normalized = parts.map(normalizeStreamPart);
    var streamStartPart = {
        type: 'stream-start',
        warnings: [],
    };
    var finishPart = {
        type: 'finish',
        finishReason: normalizeFinishReason('stop'),
        usage: DEFAULT_USAGE,
    };
    var hasStreamStart = normalized.some(function (part) {
        return part.type === 'stream-start';
    });
    var withStreamStart = hasStreamStart ? normalized : __spreadArray([streamStartPart], normalized, true);
    var delaysWithStreamStart = partDelaysMs && !hasStreamStart ? __spreadArray([0], partDelaysMs, true) : partDelaysMs;
    var hasFinish = withStreamStart.some(function (part) {
        return part.type === 'finish';
    });
    if (hasFinish) {
        if (delaysWithStreamStart && delaysWithStreamStart.length !== withStreamStart.length) {
            throw new Error('partDelaysMs length must equal emitted stream parts length');
        }
        return {
            parts: withStreamStart,
            partDelaysMs: delaysWithStreamStart,
        };
    }
    var withFinish = __spreadArray(__spreadArray([], withStreamStart, true), [finishPart], false);
    var delaysWithFinish = delaysWithStreamStart
        ? __spreadArray(__spreadArray([], delaysWithStreamStart, true), [0], false) : undefined;
    if (delaysWithFinish && delaysWithFinish.length !== withFinish.length) {
        throw new Error('partDelaysMs length must equal emitted stream parts length');
    }
    return {
        parts: withFinish,
        partDelaysMs: delaysWithFinish,
    };
}
function streamPartsWithDelay(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _loop_1, _i, _c, _d, index, part, error_1;
        var _e, _f;
        var controller = _b.controller, parts = _b.parts, partDelaysMs = _b.partDelaysMs, matcherDefaultPartDelayMs = _b.matcherDefaultPartDelayMs, providerDefaultPartDelayMs = _b.providerDefaultPartDelayMs;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 5, , 6]);
                    _loop_1 = function (index, part) {
                        var delayFromList, delay;
                        return __generator(this, function (_h) {
                            switch (_h.label) {
                                case 0:
                                    delayFromList = partDelaysMs === null || partDelaysMs === void 0 ? void 0 : partDelaysMs[index];
                                    delay = (_f = (_e = delayFromList !== null && delayFromList !== void 0 ? delayFromList : matcherDefaultPartDelayMs) !== null && _e !== void 0 ? _e : providerDefaultPartDelayMs) !== null && _f !== void 0 ? _f : 0;
                                    if (!(delay > 0)) return [3 /*break*/, 2];
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            setTimeout(resolve, delay);
                                        })];
                                case 1:
                                    _h.sent();
                                    _h.label = 2;
                                case 2:
                                    controller.enqueue(part);
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, _c = parts.entries();
                    _g.label = 1;
                case 1:
                    if (!(_i < _c.length)) return [3 /*break*/, 4];
                    _d = _c[_i], index = _d[0], part = _d[1];
                    return [5 /*yield**/, _loop_1(index, part)];
                case 2:
                    _g.sent();
                    _g.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    controller.close();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _g.sent();
                    controller.error(error_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
function buildGenerateResult(_a) {
    var parts = _a.parts;
    var content = [];
    var textById = new Map();
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var part = parts_1[_i];
        if (part.type === 'text-start') {
            textById.set(part.id, '');
            continue;
        }
        if (part.type === 'text-delta') {
            var existing = textById.get(part.id) || '';
            textById.set(part.id, "".concat(existing).concat(part.delta));
            continue;
        }
        if (part.type === 'text-end') {
            var text = textById.get(part.id) || '';
            textById.delete(part.id);
            if (text) {
                content.push({ type: 'text', text: text });
            }
            continue;
        }
        if (isToolCallPart(part)) {
            content.push(part);
            continue;
        }
        if (isToolResultPart(part) || isFilePart(part) || isSourcePart(part)) {
            content.push(part);
        }
    }
    var finish = __spreadArray([], parts, true).reverse().find(isFinishPart);
    var streamStart = parts.find(isStreamStartPart);
    var finishReason = finish ? finish.finishReason : normalizeFinishReason('stop');
    var usage = finish ? finish.usage : DEFAULT_USAGE;
    var warnings = streamStart ? streamStart.warnings : [];
    return {
        content: content,
        finishReason: finishReason,
        usage: usage,
        warnings: warnings,
    };
}
function isToolCallPart(part) {
    return part.type === 'tool-call';
}
function isToolResultPart(part) {
    return part.type === 'tool-result';
}
function isFilePart(part) {
    return part.type === 'file';
}
function isSourcePart(part) {
    return part.type === 'source';
}
function isStreamStartPart(part) {
    return part.type === 'stream-start';
}
function isFinishPart(part) {
    return part.type === 'finish';
}
function normalizeStreamPart(part) {
    if (part.type !== 'finish') {
        return part;
    }
    return {
        type: 'finish',
        finishReason: normalizeFinishReason(part.finishReason),
        usage: normalizeUsage(part.usage),
        providerMetadata: part.providerMetadata,
    };
}
function normalizeFinishReason(reason) {
    if (typeof reason === 'string') {
        return {
            unified: reason,
            raw: reason,
        };
    }
    return {
        unified: reason.unified,
        raw: reason.raw,
    };
}
function normalizeUsage(usage) {
    if (isV3Usage(usage)) {
        return usage;
    }
    return {
        inputTokens: {
            total: usage.inputTokens,
            noCache: usage.inputTokens,
            cacheRead: usage.cachedInputTokens,
            cacheWrite: undefined,
        },
        outputTokens: {
            total: usage.outputTokens,
            text: usage.outputTokens,
            reasoning: usage.reasoningTokens,
        },
        raw: {
            totalTokens: usage.totalTokens,
        },
    };
}
function isV3Usage(usage) {
    return typeof usage.inputTokens === 'object';
}
