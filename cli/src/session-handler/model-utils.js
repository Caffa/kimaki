"use strict";
// Model resolution utilities.
// getDefaultModel resolves the default model from OpenCode when no user preference is set.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultModel = getDefaultModel;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var xdg_basedir_1 = require("xdg-basedir");
var errore = require("errore");
var logger_js_1 = require("../logger.js");
var sessionLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.SESSION);
/**
 * Read user's recent models from OpenCode TUI's state file.
 * Uses same path as OpenCode: path.join(xdgState, "opencode", "model.json")
 * Returns all recent models so we can iterate until finding a valid one.
 * See: opensrc/repos/github.com/sst/opencode/packages/opencode/src/global/index.ts
 */
function getRecentModelsFromTuiState() {
    if (!xdg_basedir_1.xdgState) {
        return [];
    }
    // Same path as OpenCode TUI: path.join(Global.Path.state, "model.json")
    var modelJsonPath = node_path_1.default.join(xdg_basedir_1.xdgState, 'opencode', 'model.json');
    var result = errore.tryFn(function () {
        var _a;
        var content = node_fs_1.default.readFileSync(modelJsonPath, 'utf-8');
        var data = JSON.parse(content);
        return (_a = data.recent) !== null && _a !== void 0 ? _a : [];
    });
    if (result instanceof Error) {
        // File doesn't exist or is invalid - this is normal for fresh installs
        return [];
    }
    return result;
}
/**
 * Parse a model string in format "provider/model" into providerID and modelID.
 */
function parseModelString(model) {
    var _a = model.split('/'), providerID = _a[0], modelParts = _a.slice(1);
    var modelID = modelParts.join('/');
    if (!providerID || !modelID) {
        return undefined;
    }
    return { providerID: providerID, modelID: modelID };
}
function getModelFromProjectConfig(_a) {
    var directory = _a.directory;
    if (!directory) {
        return undefined;
    }
    var result = errore.tryFn(function () {
        var configPath = node_path_1.default.join(directory, 'opencode.json');
        var raw = node_fs_1.default.readFileSync(configPath, 'utf-8');
        var parsed = JSON.parse(raw);
        if (!parsed.model) {
            return undefined;
        }
        return parseModelString(parsed.model);
    });
    if (result instanceof Error) {
        return undefined;
    }
    return result;
}
/**
 * Validate that a model is available (provider connected + model exists).
 */
function isModelValid(model, connected, providers) {
    var isConnected = connected.includes(model.providerID);
    var provider = providers.find(function (p) {
        return p.id === model.providerID;
    });
    var modelExists = (provider === null || provider === void 0 ? void 0 : provider.models) && model.modelID in provider.models;
    return isConnected && !!modelExists;
}
/**
 * Get the default model from OpenCode when no user preference is set.
 * Priority (matches OpenCode TUI behavior):
 * 1. OpenCode config.model setting
 * 2. User's recent models from TUI state (~/.local/state/opencode/model.json)
 * 3. First connected provider's default model from API
 * Returns the model and its source.
 */
function getDefaultModel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var configModel, providersResponse, _c, connected, defaults, providers, configResponse, configModel_1, recentModels, _i, recentModels_1, recentModel, firstConnected, defaultModelId;
        var _d;
        var getClient = _b.getClient, directory = _b.directory;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    if (getClient instanceof Error) {
                        return [2 /*return*/, undefined];
                    }
                    configModel = getModelFromProjectConfig({ directory: directory });
                    if (configModel) {
                        sessionLogger.log("[MODEL] Using project config model: ".concat(configModel.providerID, "/").concat(configModel.modelID));
                        return [2 /*return*/, __assign(__assign({}, configModel), { source: 'opencode-config' })];
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return getClient().provider.list({ directory: directory });
                        })];
                case 1:
                    providersResponse = _e.sent();
                    if (providersResponse instanceof Error) {
                        sessionLogger.log("[MODEL] Failed to fetch providers for default model:", providersResponse.message);
                        return [2 /*return*/, undefined];
                    }
                    if (!providersResponse.data) {
                        return [2 /*return*/, undefined];
                    }
                    _c = providersResponse.data, connected = _c.connected, defaults = _c.default, providers = _c.all;
                    if (connected.length === 0) {
                        sessionLogger.log("[MODEL] No connected providers found");
                        return [2 /*return*/, undefined];
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return getClient().config.get({ directory: directory });
                        })];
                case 2:
                    configResponse = _e.sent();
                    if (!(configResponse instanceof Error) && ((_d = configResponse.data) === null || _d === void 0 ? void 0 : _d.model)) {
                        configModel_1 = parseModelString(configResponse.data.model);
                        if (configModel_1 && isModelValid(configModel_1, connected, providers)) {
                            sessionLogger.log("[MODEL] Using config model: ".concat(configModel_1.providerID, "/").concat(configModel_1.modelID));
                            return [2 /*return*/, __assign(__assign({}, configModel_1), { source: 'opencode-config' })];
                        }
                        if (configModel_1) {
                            sessionLogger.log("[MODEL] Config model ".concat(configResponse.data.model, " not available, checking recent"));
                        }
                    }
                    recentModels = getRecentModelsFromTuiState();
                    for (_i = 0, recentModels_1 = recentModels; _i < recentModels_1.length; _i++) {
                        recentModel = recentModels_1[_i];
                        if (isModelValid(recentModel, connected, providers)) {
                            sessionLogger.log("[MODEL] Using recent TUI model: ".concat(recentModel.providerID, "/").concat(recentModel.modelID));
                            return [2 /*return*/, __assign(__assign({}, recentModel), { source: 'opencode-recent' })];
                        }
                    }
                    if (recentModels.length > 0) {
                        sessionLogger.log("[MODEL] No valid recent TUI models found");
                    }
                    firstConnected = connected[0];
                    if (!firstConnected) {
                        return [2 /*return*/, undefined];
                    }
                    defaultModelId = defaults[firstConnected];
                    if (!defaultModelId) {
                        sessionLogger.log("[MODEL] No default model for provider ".concat(firstConnected));
                        return [2 /*return*/, undefined];
                    }
                    sessionLogger.log("[MODEL] Using provider default: ".concat(firstConnected, "/").concat(defaultModelId));
                    return [2 /*return*/, {
                            providerID: firstConnected,
                            modelID: defaultModelId,
                            source: 'opencode-provider-default',
                        }];
            }
        });
    });
}
