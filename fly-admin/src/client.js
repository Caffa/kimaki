"use strict";
// HTTP client for Fly.io Machines REST API and GraphQL API.
// Uses native fetch (no cross-fetch dependency).
// Vendored from supabase/fly-admin with modifications.
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
exports.Client = exports.FLY_API_HOSTNAME = exports.FLY_API_GRAPHQL = void 0;
var errore = require("errore");
var app_ts_1 = require("./app.ts");
var errors_ts_1 = require("./errors.ts");
var machine_ts_1 = require("./machine.ts");
var network_ts_1 = require("./network.ts");
var organization_ts_1 = require("./organization.ts");
var regions_ts_1 = require("./regions.ts");
var secret_ts_1 = require("./secret.ts");
var token_ts_1 = require("./token.ts");
var volume_ts_1 = require("./volume.ts");
exports.FLY_API_GRAPHQL = 'https://api.fly.io';
exports.FLY_API_HOSTNAME = 'https://api.machines.dev';
var Client = /** @class */ (function () {
    function Client(_a) {
        var apiKey = _a.apiKey, graphqlUrl = _a.graphqlUrl, apiUrl = _a.apiUrl;
        if (!apiKey) {
            throw new Error('Fly API Key is required');
        }
        this.graphqlUrl = graphqlUrl || exports.FLY_API_GRAPHQL;
        this.apiUrl = apiUrl || exports.FLY_API_HOSTNAME;
        this.apiKey = apiKey;
        this.App = new app_ts_1.App(this);
        this.Machine = new machine_ts_1.Machine(this);
        this.Network = new network_ts_1.Network(this);
        this.Regions = new regions_ts_1.Regions(this);
        this.Organization = new organization_ts_1.Organization(this);
        this.Secret = new secret_ts_1.Secret(this);
        this.Volume = new volume_ts_1.Volume(this);
        this.Token = new token_ts_1.Token(this);
    }
    Client.prototype.getApiKey = function () {
        return this.apiKey;
    };
    Client.prototype.getApiUrl = function () {
        return this.apiUrl;
    };
    Client.prototype.getGraphqlUrl = function () {
        return this.graphqlUrl;
    };
    Client.prototype.gqlPost = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var path, response, responseText, payloadOrError_1, payloadOrError, parsed, data, errors;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = 'graphql';
                        return [4 /*yield*/, fetch("".concat(this.graphqlUrl, "/").concat(path), {
                                method: 'POST',
                                headers: {
                                    Authorization: "Bearer ".concat(this.apiKey),
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(payload),
                            }).catch(function (cause) {
                                return new errors_ts_1.FlyApiError({
                                    method: 'POST',
                                    path: path,
                                    httpStatus: 0,
                                    cause: cause,
                                });
                            })];
                    case 1:
                        response = _a.sent();
                        if (response instanceof Error) {
                            return [2 /*return*/, response];
                        }
                        return [4 /*yield*/, response.text().catch(function (cause) {
                                return new errors_ts_1.FlyApiError({
                                    method: 'POST',
                                    path: path,
                                    httpStatus: response.status,
                                    cause: cause,
                                });
                            })];
                    case 2:
                        responseText = _a.sent();
                        if (responseText instanceof Error) {
                            return [2 /*return*/, responseText];
                        }
                        if (!response.ok) {
                            payloadOrError_1 = parseJson({ text: responseText });
                            if (payloadOrError_1 instanceof Error) {
                                return [2 /*return*/, new errors_ts_1.FlyApiError({
                                        method: 'POST',
                                        path: path,
                                        httpStatus: response.status,
                                        cause: payloadOrError_1,
                                    })];
                            }
                            return [2 /*return*/, (0, errors_ts_1.createFlyHttpError)({
                                    method: 'POST',
                                    path: path,
                                    httpStatus: response.status,
                                    payload: payloadOrError_1,
                                })];
                        }
                        payloadOrError = parseJson({ text: responseText });
                        if (payloadOrError instanceof Error) {
                            return [2 /*return*/, new errors_ts_1.FlyApiError({
                                    method: 'POST',
                                    path: path,
                                    httpStatus: response.status,
                                    cause: payloadOrError,
                                })];
                        }
                        parsed = payloadOrError;
                        data = parsed.data, errors = parsed.errors;
                        if (errors) {
                            return [2 /*return*/, (0, errors_ts_1.createFlyGraphQLError)({
                                    path: path,
                                    messages: errors.map(function (error) {
                                        return error.message;
                                    }),
                                })];
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    Client.prototype.gqlPostOrThrow = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.gqlPost(payload)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Client.prototype.rest = function (path_1) {
        return __awaiter(this, arguments, void 0, function (path, method, body, headers) {
            var response, responseText, payloadOrError_2, payloadOrError;
            if (method === void 0) { method = 'GET'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("".concat(this.apiUrl, "/v1/").concat(path), {
                            method: method,
                            headers: __assign({ Authorization: "Bearer ".concat(this.apiKey), 'Content-Type': 'application/json' }, headers),
                            body: body !== undefined ? JSON.stringify(body) : undefined,
                        }).catch(function (cause) {
                            return new errors_ts_1.FlyApiError({
                                method: method,
                                path: path,
                                httpStatus: 0,
                                cause: cause,
                            });
                        })];
                    case 1:
                        response = _a.sent();
                        if (response instanceof Error) {
                            return [2 /*return*/, response];
                        }
                        return [4 /*yield*/, response.text().catch(function (cause) {
                                return new errors_ts_1.FlyApiError({
                                    method: method,
                                    path: path,
                                    httpStatus: response.status,
                                    cause: cause,
                                });
                            })];
                    case 2:
                        responseText = _a.sent();
                        if (responseText instanceof Error) {
                            return [2 /*return*/, responseText];
                        }
                        if (!response.ok) {
                            payloadOrError_2 = parseJson({ text: responseText });
                            if (payloadOrError_2 instanceof Error) {
                                return [2 /*return*/, new errors_ts_1.FlyApiError({
                                        method: method,
                                        path: path,
                                        httpStatus: response.status,
                                        cause: payloadOrError_2,
                                    })];
                            }
                            return [2 /*return*/, (0, errors_ts_1.createFlyHttpError)({
                                    method: method,
                                    path: path,
                                    httpStatus: response.status,
                                    payload: payloadOrError_2,
                                })];
                        }
                        if (!responseText) {
                            return [2 /*return*/, undefined];
                        }
                        payloadOrError = parseJson({ text: responseText });
                        if (payloadOrError instanceof Error) {
                            return [2 /*return*/, new errors_ts_1.FlyApiError({
                                    method: method,
                                    path: path,
                                    httpStatus: response.status,
                                    cause: payloadOrError,
                                })];
                        }
                        return [2 /*return*/, payloadOrError];
                }
            });
        });
    };
    Client.prototype.restOrThrow = function (path_1) {
        return __awaiter(this, arguments, void 0, function (path, method, body, headers) {
            if (method === void 0) { method = 'GET'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.rest(path, method, body, headers)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return Client;
}());
exports.Client = Client;
function parseJson(_a) {
    var text = _a.text;
    return errore.try({
        try: function () {
            return JSON.parse(text);
        },
        catch: function (cause) {
            return new Error('Failed to parse JSON response', { cause: cause });
        },
    });
}
