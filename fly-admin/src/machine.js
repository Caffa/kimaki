"use strict";
// Machine management for Fly Machines REST API.
// Vendored from supabase/fly-admin with added exec, releaseLease, and metadata methods.
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Machine = exports.ConnectionHandler = exports.MachineState = void 0;
var types_ts_1 = require("./types.ts");
var MachineState;
(function (MachineState) {
    MachineState["Created"] = "created";
    MachineState["Starting"] = "starting";
    MachineState["Started"] = "started";
    MachineState["Stopping"] = "stopping";
    MachineState["Stopped"] = "stopped";
    MachineState["Suspended"] = "suspended";
    MachineState["Replacing"] = "replacing";
    MachineState["Destroying"] = "destroying";
    MachineState["Destroyed"] = "destroyed";
    MachineState["Failed"] = "failed";
})(MachineState || (exports.MachineState = MachineState = {}));
var ConnectionHandler;
(function (ConnectionHandler) {
    ConnectionHandler["TLS"] = "tls";
    ConnectionHandler["PG_TLS"] = "pg_tls";
    ConnectionHandler["HTTP"] = "http";
    ConnectionHandler["PROXY_PROTO"] = "proxy_proto";
})(ConnectionHandler || (exports.ConnectionHandler = ConnectionHandler = {}));
var Machine = /** @class */ (function () {
    function Machine(client) {
        this.client = client;
    }
    // --- Core CRUD ---
    Machine.prototype.listMachines = function (app_name) {
        return __awaiter(this, void 0, void 0, function () {
            var path, appId, params, queryParams, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof app_name === 'string') {
                            path = "apps/".concat(app_name, "/machines");
                        }
                        else {
                            appId = app_name.app_name, params = __rest(app_name, ["app_name"]);
                            path = "apps/".concat(appId, "/machines");
                            queryParams = {};
                            if (params.include_deleted !== undefined) {
                                queryParams.include_deleted = String(params.include_deleted);
                            }
                            if (params.region) {
                                queryParams.region = params.region;
                            }
                            if (params.state) {
                                queryParams.state = params.state;
                            }
                            if (params.summary !== undefined) {
                                queryParams.summary = String(params.summary);
                            }
                            query = new URLSearchParams(queryParams).toString();
                            if (query) {
                                path += "?".concat(query);
                            }
                        }
                        return [4 /*yield*/, this.client.restOrThrow(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.getMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.createMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, body = __rest(payload, ["app_name"]);
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines"), 'POST', body)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.updateMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, body = __rest(payload, ["app_name", "machine_id"]);
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id), 'POST', body)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.deleteMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, force, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, force = payload.force;
                        query = force ? '?force=true' : '';
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id).concat(query), 'DELETE')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // --- Lifecycle control ---
    Machine.prototype.startMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/start"), 'POST')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.stopMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, body = __rest(payload, ["app_name", "machine_id"]);
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/stop"), 'POST', __assign({ signal: types_ts_1.SignalRequestSignalEnum.SIGTERM }, body))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.restartMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, params, path, queryParams, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, params = __rest(payload, ["app_name", "machine_id"]);
                        path = "apps/".concat(app_name, "/machines/").concat(machine_id, "/restart");
                        queryParams = {};
                        if (params.timeout) {
                            queryParams.timeout = params.timeout;
                        }
                        if (params.signal) {
                            queryParams.signal = params.signal;
                        }
                        query = new URLSearchParams(queryParams).toString();
                        if (query) {
                            path += "?".concat(query);
                        }
                        return [4 /*yield*/, this.client.restOrThrow(path, 'POST')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.signalMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, body = __rest(payload, ["app_name", "machine_id"]);
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/signal"), 'POST', body)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.suspendMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/suspend"), 'POST')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // --- Memory ---
    Machine.prototype.getMemory = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/memory"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.setMemoryLimit = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, body = __rest(payload, ["app_name", "machine_id"]);
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/memory"), 'PUT', body)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /** @deprecated use setMemoryLimit instead */
    Machine.prototype.updateMemory = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.setMemoryLimit(payload)];
            });
        });
    };
    Machine.prototype.reclaimMemory = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, body = __rest(payload, ["app_name", "machine_id"]);
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/memory/reclaim"), 'POST', body)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // --- Monitoring ---
    Machine.prototype.listEvents = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, limit, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, limit = payload.limit;
                        query = limit !== undefined ? "?limit=".concat(String(limit)) : '';
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/events").concat(query))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.listVersions = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/versions"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.listProcesses = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, params, path, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, params = __rest(payload, ["app_name", "machine_id"]);
                        path = "apps/".concat(app_name, "/machines/").concat(machine_id, "/ps");
                        query = new URLSearchParams(params).toString();
                        if (query) {
                            path += "?".concat(query);
                        }
                        return [4 /*yield*/, this.client.restOrThrow(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.waitMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, params, path, queryParams, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, params = __rest(payload, ["app_name", "machine_id"]);
                        path = "apps/".concat(app_name, "/machines/").concat(machine_id, "/wait");
                        queryParams = {};
                        if (params.instance_id) {
                            queryParams.instance_id = params.instance_id;
                        }
                        if (params.timeout !== undefined) {
                            queryParams.timeout = String(params.timeout);
                        }
                        if (params.state) {
                            queryParams.state = params.state;
                        }
                        if (params.version) {
                            queryParams.version = params.version;
                        }
                        if (params.from_event_id) {
                            queryParams.from_event_id = params.from_event_id;
                        }
                        query = new URLSearchParams(queryParams).toString();
                        if (query) {
                            path += "?".concat(query);
                        }
                        return [4 /*yield*/, this.client.restOrThrow(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // --- Cordoning ---
    Machine.prototype.cordonMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/cordon"), 'POST')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.uncordonMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/uncordon"), 'POST')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // --- Leases ---
    Machine.prototype.getLease = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/lease"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.acquireLease = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, body = __rest(payload, ["app_name", "machine_id"]);
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/lease"), 'POST', body)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.releaseLease = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, nonce;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, nonce = payload.nonce;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/lease"), 'DELETE', undefined, { 'fly-machine-lease-nonce': nonce })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // --- Exec ---
    Machine.prototype.execMachine = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, body;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, body = __rest(payload, ["app_name", "machine_id"]);
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/exec"), 'POST', body)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // --- Metadata ---
    Machine.prototype.getMetadata = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/metadata"))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.updateMetadata = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, request = payload.request;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/metadata"), 'PUT', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.getMetadataProperty = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, key = payload.key;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/metadata/").concat(key))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.setMetadataProperty = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, key, request;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, key = payload.key, request = payload.request;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/metadata/").concat(key), 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Machine.prototype.deleteMetadataProperty = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var app_name, machine_id, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        app_name = payload.app_name, machine_id = payload.machine_id, key = payload.key;
                        return [4 /*yield*/, this.client.restOrThrow("apps/".concat(app_name, "/machines/").concat(machine_id, "/metadata/").concat(key), 'DELETE')];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // --- Org-level ---
    Machine.prototype.listOrgMachines = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var org_slug, params, path, queryParams, query;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        org_slug = payload.org_slug, params = __rest(payload, ["org_slug"]);
                        path = "orgs/".concat(org_slug, "/machines");
                        queryParams = {};
                        if (params.include_deleted !== undefined) {
                            queryParams.include_deleted = String(params.include_deleted);
                        }
                        if (params.region) {
                            queryParams.region = params.region;
                        }
                        if (params.state) {
                            queryParams.state = params.state;
                        }
                        if (params.updated_after) {
                            queryParams.updated_after = params.updated_after;
                        }
                        if (params.cursor) {
                            queryParams.cursor = params.cursor;
                        }
                        if (params.limit !== undefined) {
                            queryParams.limit = String(params.limit);
                        }
                        query = new URLSearchParams(queryParams).toString();
                        if (query) {
                            path += "?".concat(query);
                        }
                        return [4 /*yield*/, this.client.restOrThrow(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return Machine;
}());
exports.Machine = Machine;
