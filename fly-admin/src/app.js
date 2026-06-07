"use strict";
// App management for Fly Machines REST + GraphQL API.
// Types aligned with OpenAPI spec at https://docs.machines.dev/spec/openapi3.json
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
exports.App = exports.AppStatus = void 0;
var getAppQuery = "query($name: String!) {\n  app(name: $name) {\n      name\n      status\n      organization {\n        name\n        slug\n      }\n      ipAddresses {\n        nodes {\n          type\n          region\n          address\n        }\n      }\n  }\n}";
var AppStatus;
(function (AppStatus) {
    AppStatus["deployed"] = "deployed";
    AppStatus["pending"] = "pending";
    AppStatus["suspended"] = "suspended";
})(AppStatus || (exports.AppStatus = AppStatus = {}));
var App = /** @class */ (function () {
    function App(client) {
        this.client = client;
    }
    App.prototype.listApps = function (org_slug) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.restOrThrow("apps?org_slug=".concat(org_slug))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** List apps with full query params (org_slug + optional app_role filter). */
    App.prototype.listAppsWithParams = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = new URLSearchParams({ org_slug: params.org_slug });
                        if (params.app_role) {
                            query.set('app_role', params.app_role);
                        }
                        return [4 /*yield*/, this.client.restOrThrow("apps?".concat(query.toString()))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.getApp = function (app_name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.getAppDetailed = function (app_name) {
        return __awaiter(this, void 0, void 0, function () {
            var result, app;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.gqlPostOrThrow({
                            query: getAppQuery,
                            variables: { name: app_name },
                        })];
                    case 1:
                        result = _a.sent();
                        if (result instanceof Error) {
                            return [2 /*return*/, result];
                        }
                        app = result.app;
                        return [2 /*return*/, __assign(__assign({}, app), { ipAddresses: app.ipAddresses.nodes })];
                }
            });
        });
    };
    App.prototype.createApp = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.restOrThrow('apps', 'POST', payload)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.deleteApp = function (app_name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name), 'DELETE')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.listCertificates = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, filter, cursor, limit, params, query, path;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, filter = payload.filter, cursor = payload.cursor, limit = payload.limit;
                        params = new URLSearchParams();
                        if (filter) {
                            params.set('filter', filter);
                        }
                        if (cursor) {
                            params.set('cursor', cursor);
                        }
                        if (limit !== undefined) {
                            params.set('limit', String(limit));
                        }
                        query = params.toString();
                        path = "apps/".concat(app_name, "/certificates").concat(query ? "?".concat(query) : '');
                        return [4 /*yield*/, this.client.restOrThrow(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.requestAcmeCertificate = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, request = payload.request;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/certificates/acme"), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.requestCustomCertificate = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, request = payload.request;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/certificates/custom"), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.getCertificate = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, hostname;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, hostname = payload.hostname;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/certificates/").concat(hostname))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.deleteCertificate = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, hostname;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, hostname = payload.hostname;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/certificates/").concat(hostname), 'DELETE')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.deleteAcmeCertificates = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, hostname;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, hostname = payload.hostname;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/certificates/").concat(hostname, "/acme"), 'DELETE')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.checkCertificate = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, hostname;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, hostname = payload.hostname;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/certificates/").concat(hostname, "/check"), 'POST')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.deleteCustomCertificate = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, hostname;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, hostname = payload.hostname;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/certificates/").concat(hostname, "/custom"), 'DELETE')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.createDeployToken = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, request = payload.request;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/deploy_token"), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.listIpAssignments = function (app_name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/ip_assignments"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.assignIpAddress = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, request = payload.request;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/ip_assignments"), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.deleteIpAssignment = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, ip;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, ip = payload.ip;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/ip_assignments/").concat(ip), 'DELETE')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.listSecretKeys = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, min_version, types, params, query, path;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, min_version = payload.min_version, types = payload.types;
                        params = new URLSearchParams();
                        if (min_version) {
                            params.set('min_version', min_version);
                        }
                        if (types) {
                            params.set('types', types);
                        }
                        query = params.toString();
                        path = "apps/".concat(app_name, "/secretkeys").concat(query ? "?".concat(query) : '');
                        return [4 /*yield*/, this.client.restOrThrow(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.getSecretKey = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name, min_version, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name, min_version = payload.min_version;
                        query = min_version ? "?min_version=".concat(encodeURIComponent(min_version)) : '';
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secretkeys/").concat(secret_name).concat(query))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.setSecretKey = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name, request = payload.request;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secretkeys/").concat(secret_name), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.deleteSecretKey = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secretkeys/").concat(secret_name), 'DELETE')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.decryptSecretKey = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name, request, min_version, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name, request = payload.request, min_version = payload.min_version;
                        query = min_version ? "?min_version=".concat(encodeURIComponent(min_version)) : '';
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secretkeys/").concat(secret_name, "/decrypt").concat(query), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.encryptSecretKey = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name, request, min_version, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name, request = payload.request, min_version = payload.min_version;
                        query = min_version ? "?min_version=".concat(encodeURIComponent(min_version)) : '';
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secretkeys/").concat(secret_name, "/encrypt").concat(query), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.generateSecretKey = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name, request = payload.request;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secretkeys/").concat(secret_name, "/generate"), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.signSecretKey = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name, request, min_version, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name, request = payload.request, min_version = payload.min_version;
                        query = min_version ? "?min_version=".concat(encodeURIComponent(min_version)) : '';
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secretkeys/").concat(secret_name, "/sign").concat(query), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.verifySecretKey = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name, request, min_version, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name, request = payload.request, min_version = payload.min_version;
                        query = min_version ? "?min_version=".concat(encodeURIComponent(min_version)) : '';
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secretkeys/").concat(secret_name, "/verify").concat(query), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.listSecrets = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, min_version, show_secrets, params, query, path;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, min_version = payload.min_version, show_secrets = payload.show_secrets;
                        params = new URLSearchParams();
                        if (min_version) {
                            params.set('min_version', min_version);
                        }
                        if (show_secrets !== undefined) {
                            params.set('show_secrets', String(show_secrets));
                        }
                        query = params.toString();
                        path = "apps/".concat(app_name, "/secrets").concat(query ? "?".concat(query) : '');
                        return [4 /*yield*/, this.client.restOrThrow(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.updateSecrets = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, request = payload.request;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secrets"), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.getSecret = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name, min_version, show_secrets, params, query, path;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name, min_version = payload.min_version, show_secrets = payload.show_secrets;
                        params = new URLSearchParams();
                        if (min_version) {
                            params.set('min_version', min_version);
                        }
                        if (show_secrets !== undefined) {
                            params.set('show_secrets', String(show_secrets));
                        }
                        query = params.toString();
                        path = "apps/".concat(app_name, "/secrets/").concat(secret_name).concat(query ? "?".concat(query) : '');
                        return [4 /*yield*/, this.client.restOrThrow(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.setSecret = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name, request = payload.request;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secrets/").concat(secret_name), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    App.prototype.deleteSecret = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, secret_name;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, secret_name = payload.secret_name;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/secrets/").concat(secret_name), 'DELETE')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return App;
}());
exports.App = App;
