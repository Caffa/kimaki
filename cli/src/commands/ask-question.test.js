"use strict";
// Tests AskUserQuestion request deduplication and cleanup helpers.
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
var vitest_1 = require("vitest");
var ask_question_js_1 = require("./ask-question.js");
function createFakeThread() {
    var _this = this;
    var send = vitest_1.vi.fn(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, { id: 'msg-1' }];
        });
    }); });
    return {
        id: 'thread-1',
        send: send,
    };
}
(0, vitest_1.afterEach)(function () {
    ask_question_js_1.pendingQuestionContexts.clear();
    vitest_1.vi.restoreAllMocks();
});
(0, vitest_1.describe)('ask-question', function () {
    (0, vitest_1.test)('dedupes duplicate question requests for the same thread', function () { return __awaiter(void 0, void 0, void 0, function () {
        var thread;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    thread = createFakeThread();
                    return [4 /*yield*/, (0, ask_question_js_1.showAskUserQuestionDropdowns)({
                            thread: thread,
                            sessionId: 'ses-1',
                            directory: '/project',
                            requestId: 'req-1',
                            input: {
                                questions: [{
                                        question: 'Choose one',
                                        header: 'Pick',
                                        options: [
                                            { label: 'Alpha', description: 'A' },
                                            { label: 'Beta', description: 'B' },
                                        ],
                                    }],
                            },
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, ask_question_js_1.showAskUserQuestionDropdowns)({
                            thread: thread,
                            sessionId: 'ses-1',
                            directory: '/project',
                            requestId: 'req-1',
                            input: {
                                questions: [{
                                        question: 'Choose one',
                                        header: 'Pick',
                                        options: [
                                            { label: 'Alpha', description: 'A' },
                                            { label: 'Beta', description: 'B' },
                                        ],
                                    }],
                            },
                        })];
                case 2:
                    _a.sent();
                    (0, vitest_1.expect)(thread.send).toHaveBeenCalledTimes(1);
                    (0, vitest_1.expect)(ask_question_js_1.pendingQuestionContexts.size).toBe(1);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('removes all duplicate contexts for one request', function () {
        var thread = createFakeThread();
        var baseContext = {
            sessionId: 'ses-1',
            directory: '/project',
            thread: thread,
            requestId: 'req-1',
            questions: [{
                    question: 'Choose one',
                    header: 'Pick',
                    options: [
                        { label: 'Alpha', description: 'A' },
                        { label: 'Beta', description: 'B' },
                    ],
                }],
            answers: {},
            totalQuestions: 1,
            answeredCount: 0,
            contextHash: 'ctx-1',
        };
        ask_question_js_1.pendingQuestionContexts.set('ctx-1', baseContext);
        ask_question_js_1.pendingQuestionContexts.set('ctx-2', __assign(__assign({}, baseContext), { contextHash: 'ctx-2' }));
        ask_question_js_1.pendingQuestionContexts.set('ctx-3', __assign(__assign({}, baseContext), { requestId: 'req-2', contextHash: 'ctx-3' }));
        var removed = (0, ask_question_js_1.deletePendingQuestionContextsForRequest)({
            threadId: thread.id,
            requestId: 'req-1',
        });
        (0, vitest_1.expect)(removed).toBe(2);
        (0, vitest_1.expect)(__spreadArray([], ask_question_js_1.pendingQuestionContexts.keys(), true)).toEqual(['ctx-3']);
    });
});
