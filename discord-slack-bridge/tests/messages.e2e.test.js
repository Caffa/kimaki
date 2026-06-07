"use strict";
// E2E: Discord → Slack message operations (post, edit, delete, fetch).
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
var vitest_1 = require("vitest");
var e2e_setup_js_1 = require("./e2e-setup.js");
(0, vitest_1.describe)('messages: Discord → Slack', function () {
    var ctx;
    var channel;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var generalId, fetched;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)()];
                case 1:
                    ctx = _a.sent();
                    generalId = ctx.twin.resolveChannelId('general');
                    return [4 /*yield*/, ctx.client.channels.fetch(generalId)];
                case 2:
                    fetched = _a.sent();
                    channel = fetched;
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.teardownE2E)(ctx)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('bot posts message → appears in Slack twin', function () { return __awaiter(void 0, void 0, void 0, function () {
        var messages, found;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.send('Hello from Discord!')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ctx.twin.channel('general').getMessages()];
                case 2:
                    messages = _a.sent();
                    found = messages.find(function (m) {
                        return m.text === 'Hello from Discord!';
                    });
                    (0, vitest_1.expect)(found).toBeDefined();
                    (0, vitest_1.expect)(found.bot_id).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('bot edits message → Slack twin reflects edit', function () { return __awaiter(void 0, void 0, void 0, function () {
        var msg, messages, edited;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.send('Original text')];
                case 1:
                    msg = _a.sent();
                    return [4 /*yield*/, msg.edit('Edited text')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ctx.twin.channel('general').getMessages()];
                case 3:
                    messages = _a.sent();
                    edited = messages.find(function (m) {
                        return m.text === 'Edited text';
                    });
                    (0, vitest_1.expect)(edited).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('bot deletes message → soft-deleted in Slack twin', function () { return __awaiter(void 0, void 0, void 0, function () {
        var msg, messages, found;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel.send('Delete me')];
                case 1:
                    msg = _a.sent();
                    return [4 /*yield*/, msg.delete()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ctx.twin.channel('general').getMessages()];
                case 3:
                    messages = _a.sent();
                    found = messages.find(function (m) {
                        return m.text === 'Delete me';
                    });
                    // getMessages() excludes deleted messages
                    (0, vitest_1.expect)(found).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('bot fetches messages from channel', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectId, projectCh, fetched, texts;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectId = ctx.twin.resolveChannelId('project');
                    return [4 /*yield*/, ctx.client.channels.fetch(projectId)];
                case 1:
                    projectCh = (_a.sent());
                    return [4 /*yield*/, projectCh.send('Message one')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, projectCh.send('Message two')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, projectCh.messages.fetch({ limit: 10 })];
                case 4:
                    fetched = _a.sent();
                    (0, vitest_1.expect)(fetched.size).toBeGreaterThanOrEqual(2);
                    texts = fetched.map(function (m) {
                        return m.content;
                    });
                    (0, vitest_1.expect)(texts).toContain('Message one');
                    (0, vitest_1.expect)(texts).toContain('Message two');
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('text snapshot of channel messages', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectId, text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectId = ctx.twin.resolveChannelId('project');
                    return [4 /*yield*/, ctx.twin.channel(projectId).text()];
                case 1:
                    text = _a.sent();
                    (0, vitest_1.expect)(text).toContain('Message one');
                    (0, vitest_1.expect)(text).toContain('Message two');
                    return [2 /*return*/];
            }
        });
    }); });
});
