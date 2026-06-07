"use strict";
// Hrana v2 protocol request processing.
// Pure logic — no I/O, no HTTP. Takes an executor and processes pipeline requests.
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
exports.evaluateHranaCondition = evaluateHranaCondition;
exports.processHranaRequest = processHranaRequest;
var values_ts_1 = require("./values.ts");
// Resolve SQL text from stmt.sql or stmt.sql_id.
// Prefers sql over sql_id when both are set (matches real client behavior).
// Returns empty string when neither is set — callers decide if that's an error.
function resolveStmtSql(stmt, sqlStore) {
    var _a;
    if (stmt.sql != null) {
        return stmt.sql;
    }
    if (stmt.sql_id != null) {
        return (_a = sqlStore.get(stmt.sql_id)) !== null && _a !== void 0 ? _a : '';
    }
    return '';
}
// Resolve SQL for sequence/describe which can also reference sql_id.
function resolveRawSql(req, sqlStore) {
    var _a;
    if (req.sql != null) {
        return req.sql;
    }
    if (req.sql_id != null) {
        return (_a = sqlStore.get(req.sql_id)) !== null && _a !== void 0 ? _a : null;
    }
    return null;
}
function isHranaError(val) {
    return typeof val === 'object' && val !== null && 'message' in val && 'code' in val;
}
function getSqliteErrorCode(err) {
    var _a;
    return (_a = err.code) !== null && _a !== void 0 ? _a : 'SQLITE_ERROR';
}
function toHranaError(err) {
    if (err instanceof Error) {
        return { message: err.message, code: getSqliteErrorCode(err) };
    }
    return { message: String(err), code: 'SQLITE_ERROR' };
}
// ── Condition evaluation ────────────────────────────────────────────
function evaluateHranaCondition(cond, stepResults, stepErrors) {
    var _a, _b;
    if (!cond) {
        return true;
    }
    if (cond.type === 'ok') {
        return stepErrors[cond.step] === null && stepResults[cond.step] !== null;
    }
    if (cond.type === 'error') {
        return stepErrors[cond.step] !== null;
    }
    if (cond.type === 'not') {
        var inner = evaluateHranaCondition(cond.cond, stepResults, stepErrors);
        if (isHranaError(inner)) {
            return inner;
        }
        return !inner;
    }
    if (cond.type === 'and') {
        for (var _i = 0, _c = (_a = cond.conds) !== null && _a !== void 0 ? _a : []; _i < _c.length; _i++) {
            var c = _c[_i];
            var result = evaluateHranaCondition(c, stepResults, stepErrors);
            if (isHranaError(result)) {
                return result;
            }
            if (!result) {
                return false;
            }
        }
        return true;
    }
    if (cond.type === 'or') {
        for (var _d = 0, _e = (_b = cond.conds) !== null && _b !== void 0 ? _b : []; _d < _e.length; _d++) {
            var c = _e[_d];
            var result = evaluateHranaCondition(c, stepResults, stepErrors);
            if (isHranaError(result)) {
                return result;
            }
            if (result) {
                return true;
            }
        }
        return false;
    }
    if (cond.type === 'is_autocommit') {
        // is_autocommit requires runtime autocommit state from the database connection,
        // which is not available through the generic executor interface.
        return { message: 'is_autocommit condition is not supported', code: 'HRANA_PROTO_ERROR' };
    }
    return { message: "Unknown condition type: ".concat(cond.type), code: 'HRANA_PROTO_ERROR' };
}
// ── Individual request handlers ─────────────────────────────────────
function handleExecute(executor, req, sqlStore) {
    return __awaiter(this, void 0, void 0, function () {
        var sql, params, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!req.stmt) {
                        return [2 /*return*/, {
                                type: 'error',
                                error: { message: 'Missing stmt', code: 'HRANA_PROTO_ERROR' },
                            }];
                    }
                    sql = resolveStmtSql(req.stmt, sqlStore);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    params = (0, values_ts_1.decodeHranaParams)(req.stmt);
                    return [4 /*yield*/, executor.executeSql(sql, params)];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, { type: 'ok', response: { type: 'execute', result: result } }];
                case 3:
                    err_1 = _a.sent();
                    return [2 /*return*/, { type: 'error', error: toHranaError(err_1) }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function handleBatch(executor, req, sqlStore) {
    return __awaiter(this, void 0, void 0, function () {
        var steps, stepResults, stepErrors, _i, steps_1, step, condResult, sql, params, result, err_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    steps = (_b = (_a = req.batch) === null || _a === void 0 ? void 0 : _a.steps) !== null && _b !== void 0 ? _b : [];
                    stepResults = [];
                    stepErrors = [];
                    _i = 0, steps_1 = steps;
                    _c.label = 1;
                case 1:
                    if (!(_i < steps_1.length)) return [3 /*break*/, 6];
                    step = steps_1[_i];
                    condResult = evaluateHranaCondition(step.condition, stepResults, stepErrors);
                    if (isHranaError(condResult)) {
                        stepResults.push(null);
                        stepErrors.push(condResult);
                        return [3 /*break*/, 5];
                    }
                    if (!condResult) {
                        stepResults.push(null);
                        stepErrors.push(null);
                        return [3 /*break*/, 5];
                    }
                    sql = resolveStmtSql(step.stmt, sqlStore);
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    params = (0, values_ts_1.decodeHranaParams)(step.stmt);
                    return [4 /*yield*/, executor.executeSql(sql, params)];
                case 3:
                    result = _c.sent();
                    stepResults.push(result);
                    stepErrors.push(null);
                    return [3 /*break*/, 5];
                case 4:
                    err_2 = _c.sent();
                    stepResults.push(null);
                    stepErrors.push(toHranaError(err_2));
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/, {
                        type: 'ok',
                        response: {
                            type: 'batch',
                            result: { step_results: stepResults, step_errors: stepErrors },
                        },
                    }];
            }
        });
    });
}
function handleSequence(executor, req, sqlStore) {
    return __awaiter(this, void 0, void 0, function () {
        var sql, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sql = resolveRawSql(req, sqlStore);
                    if (!sql) {
                        // No SQL provided — sequence is a no-op (matches sqld behavior)
                        return [2 /*return*/, { type: 'ok', response: { type: 'sequence' } }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, executor.execRaw(sql)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, { type: 'ok', response: { type: 'sequence' } }];
                case 3:
                    err_3 = _a.sent();
                    return [2 /*return*/, { type: 'error', error: toHranaError(err_3) }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function handleDescribe(executor, req, sqlStore) {
    return __awaiter(this, void 0, void 0, function () {
        var sql, result, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!executor.describe) {
                        return [2 /*return*/, {
                                type: 'error',
                                error: { message: 'describe not supported by this executor', code: 'HRANA_PROTO_ERROR' },
                            }];
                    }
                    sql = resolveRawSql(req, sqlStore);
                    if (!sql) {
                        return [2 /*return*/, {
                                type: 'error',
                                error: { message: 'Missing sql or sql_id for describe', code: 'HRANA_PROTO_ERROR' },
                            }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, executor.describe(sql)];
                case 2:
                    result = _a.sent();
                    return [2 /*return*/, { type: 'ok', response: { type: 'describe', result: result } }];
                case 3:
                    err_4 = _a.sent();
                    return [2 /*return*/, { type: 'error', error: toHranaError(err_4) }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// ── Pipeline request dispatcher ─────────────────────────────────────
function processHranaRequest(executor, req, sqlStore) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            if (req.type === 'execute') {
                return [2 /*return*/, handleExecute(executor, req, sqlStore)];
            }
            if (req.type === 'batch') {
                return [2 /*return*/, handleBatch(executor, req, sqlStore)];
            }
            if (req.type === 'sequence') {
                return [2 /*return*/, handleSequence(executor, req, sqlStore)];
            }
            if (req.type === 'describe') {
                return [2 /*return*/, handleDescribe(executor, req, sqlStore)];
            }
            if (req.type === 'close') {
                return [2 /*return*/, { type: 'ok', response: { type: 'close' } }];
            }
            if (req.type === 'store_sql') {
                if (req.sql_id == null || req.sql == null) {
                    return [2 /*return*/, {
                            type: 'error',
                            error: { message: 'store_sql requires both sql_id and sql', code: 'HRANA_PROTO_ERROR' },
                        }];
                }
                if (sqlStore.has(req.sql_id)) {
                    return [2 /*return*/, {
                            type: 'error',
                            error: { message: "sql_id ".concat(req.sql_id, " already stored"), code: 'HRANA_PROTO_ERROR' },
                        }];
                }
                sqlStore.set(req.sql_id, req.sql);
                return [2 /*return*/, { type: 'ok', response: { type: 'store_sql' } }];
            }
            if (req.type === 'close_sql') {
                if (req.sql_id != null) {
                    sqlStore.delete(req.sql_id);
                }
                return [2 /*return*/, { type: 'ok', response: { type: 'close_sql' } }];
            }
            return [2 /*return*/, {
                    type: 'error',
                    error: { message: "Unknown request type: ".concat(req.type), code: 'HRANA_PROTO_ERROR' },
                }];
        });
    });
}
