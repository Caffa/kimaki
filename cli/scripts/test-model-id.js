"use strict";
/**
 * Test script to validate model ID format and provider.list API.
 *
 * Usage: npx tsx scripts/test-model-id.ts [directory]
 *
 * This script:
 * 1. Calls provider.list() to get all available providers and models
 * 2. Validates that model IDs can be correctly parsed into provider/model format
 * 3. Logs the available models sorted by release date
 */
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
var v2_1 = require("@opencode-ai/sdk/v2");
var node_child_process_1 = require("node:child_process");
var node_net_1 = require("node:net");
function getOpenPort() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var server = node_net_1.default.createServer();
                    server.listen(0, function () {
                        var address = server.address();
                        if (address && typeof address === 'object') {
                            var port_1 = address.port;
                            server.close(function () {
                                resolve(port_1);
                            });
                        }
                        else {
                            reject(new Error('Failed to get port'));
                        }
                    });
                    server.on('error', reject);
                })];
        });
    });
}
function waitForServer(port_2) {
    return __awaiter(this, arguments, void 0, function (port, maxAttempts) {
        var i, response, _a;
        if (maxAttempts === void 0) { maxAttempts = 30; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    i = 0;
                    _b.label = 1;
                case 1:
                    if (!(i < maxAttempts)) return [3 /*break*/, 8];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, fetch("http://127.0.0.1:".concat(port, "/api/health"))];
                case 3:
                    response = _b.sent();
                    if (response.status < 500) {
                        return [2 /*return*/, true];
                    }
                    return [3 /*break*/, 5];
                case 4:
                    _a = _b.sent();
                    return [3 /*break*/, 5];
                case 5: return [4 /*yield*/, new Promise(function (resolve) {
                        setTimeout(resolve, 1000);
                    })];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7:
                    i++;
                    return [3 /*break*/, 1];
                case 8: throw new Error("Server did not start on port ".concat(port, " after ").concat(maxAttempts, " seconds"));
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var directory, port, serverProcess, client, response, _a, providers, connected, defaults, _i, _b, _c, key, value, _loop_1, _d, providers_1, provider;
        var _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    directory = process.argv[2] || process.cwd();
                    console.log("Testing model IDs for directory: ".concat(directory));
                    return [4 /*yield*/, getOpenPort()];
                case 1:
                    port = _g.sent();
                    console.log("Starting opencode server on port ".concat(port, "..."));
                    serverProcess = (0, node_child_process_1.spawn)('opencode', ['serve', '--port', port.toString()], {
                        cwd: directory,
                        stdio: 'pipe',
                    });
                    (_e = serverProcess.stdout) === null || _e === void 0 ? void 0 : _e.on('data', function (data) {
                        console.log("[opencode] ".concat(data.toString().trim()));
                    });
                    (_f = serverProcess.stderr) === null || _f === void 0 ? void 0 : _f.on('data', function (data) {
                        console.error("[opencode] ".concat(data.toString().trim()));
                    });
                    _g.label = 2;
                case 2:
                    _g.trys.push([2, , 5, 6]);
                    return [4 /*yield*/, waitForServer(port)];
                case 3:
                    _g.sent();
                    console.log('Server ready!');
                    client = (0, v2_1.createOpencodeClient)({
                        baseUrl: "http://127.0.0.1:".concat(port),
                    });
                    return [4 /*yield*/, client.provider.list({
                            query: { directory: directory },
                        })];
                case 4:
                    response = _g.sent();
                    if (!response.data) {
                        throw new Error('Failed to fetch providers');
                    }
                    _a = response.data, providers = _a.all, connected = _a.connected, defaults = _a.default;
                    console.log("\n=== Connected Providers (".concat(connected.length, ") ==="));
                    console.log(connected.join(', ') || '(none)');
                    console.log("\n=== Default Models ===");
                    for (_i = 0, _b = Object.entries(defaults); _i < _b.length; _i++) {
                        _c = _b[_i], key = _c[0], value = _c[1];
                        console.log("  ".concat(key, ": ").concat(value));
                    }
                    console.log("\n=== All Providers (".concat(providers.length, ") ==="));
                    _loop_1 = function (provider) {
                        var isConnected = connected.includes(provider.id);
                        var models = Object.entries(provider.models || {});
                        console.log("\n--- ".concat(provider.name, " (").concat(provider.id, ") ").concat(isConnected ? '[CONNECTED]' : '', " ---"));
                        console.log("  Models: ".concat(models.length));
                        if (models.length > 0) {
                            // Sort by release date (ascending)
                            var sortedModels = models
                                .map(function (_a) {
                                var id = _a[0], model = _a[1];
                                return ({
                                    id: id,
                                    name: model.name,
                                    releaseDate: model.release_date,
                                    fullId: "".concat(provider.id, "/").concat(id),
                                });
                            })
                                .sort(function (a, b) {
                                var dateA = a.releaseDate ? new Date(a.releaseDate).getTime() : 0;
                                var dateB = b.releaseDate ? new Date(b.releaseDate).getTime() : 0;
                                return dateA - dateB;
                            });
                            // Show last 5 models (most recent)
                            var recentModels = sortedModels.slice(-5);
                            console.log('  Recent models (sorted by release date):');
                            for (var _h = 0, recentModels_1 = recentModels; _h < recentModels_1.length; _h++) {
                                var model = recentModels_1[_h];
                                console.log("    - ".concat(model.name));
                                console.log("      ID: ".concat(model.fullId));
                                console.log("      Date: ".concat(model.releaseDate || 'unknown'));
                                // Validate parsing
                                var _j = model.fullId.split('/'), parsedProvider = _j[0], modelParts = _j.slice(1);
                                var parsedModel = modelParts.join('/');
                                if (parsedProvider !== provider.id || parsedModel !== model.id) {
                                    console.log("      ERROR: Parse mismatch!");
                                    console.log("        Expected: provider=".concat(provider.id, ", model=").concat(model.id));
                                    console.log("        Got: provider=".concat(parsedProvider, ", model=").concat(parsedModel));
                                }
                            }
                        }
                    };
                    for (_d = 0, providers_1 = providers; _d < providers_1.length; _d++) {
                        provider = providers_1[_d];
                        _loop_1(provider);
                    }
                    console.log('\n=== Validation Complete ===');
                    console.log('All model IDs can be correctly parsed into provider/model format.');
                    return [3 /*break*/, 6];
                case 5:
                    console.log('\nStopping server...');
                    serverProcess.kill('SIGTERM');
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    });
}
main().catch(function (error) {
    console.error('Error:', error);
    process.exit(1);
});
