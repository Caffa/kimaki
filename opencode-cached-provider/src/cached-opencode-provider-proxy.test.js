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
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var v2_1 = require("@opencode-ai/sdk/v2");
var vitest_1 = require("vitest");
var cached_opencode_provider_proxy_js_1 = require("./cached-opencode-provider-proxy.js");
var geminiApiKey = process.env['GEMINI_API_KEY'] ||
    process.env['GOOGLE_GENERATIVE_AI_API_KEY'] ||
    '';
var geminiModel = process.env['GEMINI_FLASH_MODEL'] || 'gemini-2.5-flash';
function createProjectDirectory() {
    var projectDirectory = node_path_1.default.resolve(process.cwd(), 'tmp', 'cached-opencode-provider-test-project');
    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
    return projectDirectory;
}
function extractData(_a) {
    var result = _a.result;
    if (!result || typeof result !== 'object') {
        return result;
    }
    var hasDataField = 'data' in result;
    if (!hasDataField) {
        return result;
    }
    var maybeRecord = result;
    return maybeRecord.data;
}
function extractError(_a) {
    var result = _a.result;
    if (!result || typeof result !== 'object') {
        return null;
    }
    if (!('error' in result)) {
        return null;
    }
    var maybeRecord = result;
    return maybeRecord.error || null;
}
function errorMessage(_a) {
    var error = _a.error;
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return JSON.stringify(error);
}
function waitFor(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var startedAt, ready;
        var check = _b.check, timeoutMs = _b.timeoutMs, intervalMs = _b.intervalMs, message = _b.message;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    startedAt = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - startedAt < timeoutMs)) return [3 /*break*/, 4];
                    return [4 /*yield*/, check()];
                case 2:
                    ready = _c.sent();
                    if (ready) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, intervalMs);
                        })];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 4: throw new Error(message);
            }
        });
    });
}
function runPrompt(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var created, createError, session, promptResult, promptError;
        var client = _b.client, directory = _b.directory, prompt = _b.prompt;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, client.session.create({
                        directory: directory,
                        title: 'cached-provider-test',
                    })];
                case 1:
                    created = _c.sent();
                    createError = extractError({ result: created });
                    if (createError) {
                        throw new Error("session.create failed: ".concat(errorMessage({ error: createError })));
                    }
                    session = extractData({
                        result: created,
                    });
                    if (!(session === null || session === void 0 ? void 0 : session.id)) {
                        throw new Error('session.create returned no session id');
                    }
                    return [4 /*yield*/, client.session.prompt({
                            sessionID: session.id,
                            directory: directory,
                            system: 'Reply with a short single-line answer.',
                            parts: [
                                {
                                    type: 'text',
                                    text: prompt,
                                },
                            ],
                        })];
                case 2:
                    promptResult = _c.sent();
                    promptError = extractError({ result: promptResult });
                    if (promptError) {
                        throw new Error("session.prompt failed: ".concat(errorMessage({ error: promptError })));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
var testWithGemini = geminiApiKey ? vitest_1.test : vitest_1.test.skip;
testWithGemini('proxies Gemini through opencode config and serves cached responses', function () { return __awaiter(void 0, void 0, void 0, function () {
    var projectDirectory, cacheDbPath, proxy, opencodeServer, opencodeConfig, prompt_1, latestRequest, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                projectDirectory = createProjectDirectory();
                cacheDbPath = node_path_1.default.join(projectDirectory, 'provider-cache.db');
                proxy = new cached_opencode_provider_proxy_js_1.CachedOpencodeProviderProxy({
                    cacheDbPath: cacheDbPath,
                    targetBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                    apiKey: geminiApiKey,
                    cacheMethods: ['POST'],
                });
                opencodeServer = null;
                _b.label = 1;
            case 1:
                _b.trys.push([1, , 10, 12]);
                return [4 /*yield*/, proxy.start()];
            case 2:
                _b.sent();
                opencodeConfig = proxy.buildOpencodeConfig({
                    providerName: 'cached-google',
                    providerNpm: '@ai-sdk/google',
                    model: geminiModel,
                    smallModel: geminiModel,
                });
                node_fs_1.default.writeFileSync(node_path_1.default.join(projectDirectory, 'opencode.json'), JSON.stringify(opencodeConfig, null, 2));
                return [4 /*yield*/, (0, v2_1.createOpencode)()];
            case 3:
                opencodeServer = _b.sent();
                prompt_1 = 'Say exactly: cache-proxy-test';
                return [4 /*yield*/, runPrompt({
                        client: opencodeServer.client,
                        directory: projectDirectory,
                        prompt: prompt_1,
                    })];
            case 4:
                _b.sent();
                return [4 /*yield*/, waitFor({
                        timeoutMs: 30000,
                        intervalMs: 250,
                        message: 'expected first cache entry to be persisted',
                        check: function () { return __awaiter(void 0, void 0, void 0, function () {
                            var count;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, proxy.getCacheEntryCount()];
                                    case 1:
                                        count = _a.sent();
                                        return [2 /*return*/, count > 0];
                                }
                            });
                        }); },
                    })];
            case 5:
                _b.sent();
                return [4 /*yield*/, proxy.getLatestCachedRequest()];
            case 6:
                latestRequest = _b.sent();
                if (!latestRequest) {
                    throw new Error('expected a cached request row after first prompt');
                }
                return [4 /*yield*/, fetch(new URL(latestRequest.endpoint, proxy.baseUrl), {
                        method: latestRequest.method,
                        headers: {
                            'content-type': 'application/json',
                        },
                        body: latestRequest.requestBody,
                    })];
            case 7:
                _b.sent();
                return [4 /*yield*/, waitFor({
                        timeoutMs: 10000,
                        intervalMs: 100,
                        message: 'expected at least one cache hit after replaying cached request',
                        check: function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, proxy.stats.cacheHits > 0];
                            });
                        }); },
                    })];
            case 8:
                _b.sent();
                (0, vitest_1.expect)(proxy.stats.cacheHits).toBeGreaterThan(0);
                _a = vitest_1.expect;
                return [4 /*yield*/, proxy.getCacheEntryCount()];
            case 9:
                _a.apply(void 0, [_b.sent()]).toBeGreaterThan(0);
                return [3 /*break*/, 12];
            case 10:
                if (opencodeServer) {
                    opencodeServer.server.close();
                }
                return [4 /*yield*/, proxy.stop()];
            case 11:
                _b.sent();
                return [7 /*endfinally*/];
            case 12: return [2 /*return*/];
        }
    });
}); }, 240000);
