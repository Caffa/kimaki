"use strict";
// Region listing via Fly GraphQL API.
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
exports.Regions = void 0;
var getRegionsQuery = "query {\n  platform {\n    requestRegion\n    regions {\n      name\n      code\n      latitude\n      longitude\n      gatewayAvailable\n      requiresPaidPlan\n    }\n  }\n}";
var Regions = /** @class */ (function () {
    function Regions(client) {
        this.client = client;
    }
    Regions.prototype.getRegions = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.client.gqlPostOrThrow({
                        query: getRegionsQuery,
                        variables: {},
                    })];
            });
        });
    };
    Regions.prototype.getPlatformRegions = function () {
        return __awaiter(this, arguments, void 0, function (payload) {
            var params, query, path;
            if (payload === void 0) { payload = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        params = new URLSearchParams();
                        if (payload.size) {
                            params.set('size', payload.size);
                        }
                        if (payload.cpu_kind) {
                            params.set('cpu_kind', payload.cpu_kind);
                        }
                        if (payload.memory_mb !== undefined) {
                            params.set('memory_mb', String(payload.memory_mb));
                        }
                        if (payload.cpus !== undefined) {
                            params.set('cpus', String(payload.cpus));
                        }
                        if (payload.gpus !== undefined) {
                            params.set('gpus', String(payload.gpus));
                        }
                        if (payload.gpu_kind) {
                            params.set('gpu_kind', payload.gpu_kind);
                        }
                        query = params.toString();
                        path = "platform/regions".concat(query ? "?".concat(query) : '');
                        return [4 /*yield*/, this.client.restOrThrow(path)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Regions.prototype.getPlacements = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.restOrThrow('platform/placements', 'POST', request)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return Regions;
}());
exports.Regions = Regions;
