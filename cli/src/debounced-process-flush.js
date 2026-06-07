"use strict";
// Debounced async callback with centralized shutdown flushing.
// Used for persistence paths that should batch writes during runtime
// while allowing the bot's single SIGTERM/SIGINT handler to flush all callbacks.
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
exports.flushDebouncedProcessCallbacks = flushDebouncedProcessCallbacks;
exports.createDebouncedProcessFlush = createDebouncedProcessFlush;
var processFlushCallbacks = new Set();
function flushDebouncedProcessCallbacks() {
    return __awaiter(this, void 0, void 0, function () {
        var callbacks;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    callbacks = __spreadArray([], processFlushCallbacks, true);
                    return [4 /*yield*/, Promise.allSettled(callbacks.map(function (callback) {
                            return callback();
                        }))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function createDebouncedProcessFlush(_a) {
    var _this = this;
    var waitMs = _a.waitMs, callback = _a.callback, onError = _a.onError;
    var timeout;
    var inFlight;
    var dirty = false;
    function run() {
        return __awaiter(this, void 0, void 0, function () {
            var current;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!dirty) {
                            return [2 /*return*/];
                        }
                        if (!inFlight) return [3 /*break*/, 2];
                        return [4 /*yield*/, inFlight];
                    case 1:
                        _a.sent();
                        if (!dirty) {
                            return [2 /*return*/];
                        }
                        _a.label = 2;
                    case 2:
                        dirty = false;
                        current = Promise.resolve()
                            .then(function () {
                            return callback();
                        })
                            .catch(function (error) {
                            if (onError) {
                                var wrappedError = error instanceof Error
                                    ? error
                                    : new Error('Debounced process flush failed', { cause: error });
                                onError(wrappedError);
                            }
                        });
                        inFlight = current;
                        return [4 /*yield*/, current];
                    case 3:
                        _a.sent();
                        if (inFlight === current) {
                            inFlight = undefined;
                        }
                        if (!dirty) return [3 /*break*/, 5];
                        return [4 /*yield*/, run()];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function trigger() {
        dirty = true;
        if (timeout) {
            return;
        }
        timeout = setTimeout(function () {
            timeout = undefined;
            void run();
        }, waitMs);
    }
    function flush() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (timeout) {
                            clearTimeout(timeout);
                            timeout = undefined;
                        }
                        return [4 /*yield*/, run()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    var processFlushCallback = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, flush()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
    processFlushCallbacks.add(processFlushCallback);
    function dispose() {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        processFlushCallbacks.delete(processFlushCallback);
                        return [4 /*yield*/, flush()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    return {
        trigger: trigger,
        flush: flush,
        dispose: dispose,
    };
}
