"use strict";
/**
 * OpenAI OAuth rotation plugin for OpenCode.
 *
 * This plugin piggybacks on opencode's built-in CodexAuthPlugin (which owns
 * the auth: { provider: "openai" } hook). We cannot register our own auth
 * provider for openai without overriding the built-in, which handles URL
 * rewriting, model filtering, and token refresh.
 *
 * Instead, this plugin uses the event hook to:
 * 1. Detect new OpenAI logins by checking auth.json on session events
 * 2. Rotate accounts on rate-limit retry events
 * 3. Show toast notifications when rotating
 *
 * Account management is done via `kimaki multioauth openai` CLI commands.
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
exports.openaiRotationPlugin = void 0;
var plugin_logger_js_1 = require("./plugin-logger.js");
var oauth_rotation_shared_js_1 = require("./oauth-rotation-shared.js");
var openai_auth_state_js_1 = require("./openai-auth-state.js");
var log = (0, plugin_logger_js_1.createPluginLogger)('openai-rotation');
var TOAST_SESSION_HEADER = 'x-kimaki-session-id';
function isRetryStatusEvent(event) {
    if (event.type !== 'session.status')
        return false;
    var status = event.properties.status;
    return status.type === 'retry' && typeof status.message === 'string';
}
// --- Model detection ---
// We need to determine if the retrying session uses an openai model.
// The retry event doesn't include model info directly, so we check
// the last message in the session to find the model.
function isOpenAISession(client, sessionID) {
    return __awaiter(this, void 0, void 0, function () {
        var res, lastMessage, providerID, _a;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, client.session.messages({ path: { id: sessionID } })];
                case 1:
                    res = _d.sent();
                    lastMessage = (_c = (_b = res.data) === null || _b === void 0 ? void 0 : _b.filter(function (m) { return m.info; }).at(-1)) === null || _c === void 0 ? void 0 : _c.info;
                    if (!lastMessage)
                        return [2 /*return*/, false];
                    providerID = lastMessage.role === 'assistant' ? lastMessage.providerID : lastMessage.model.providerID;
                    return [2 /*return*/, providerID === 'openai'];
                case 2:
                    _a = _d.sent();
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
// --- Plugin export ---
// Throttle login detection to avoid spamming auth.json reads
var lastLoginCheckMs = 0;
var LOGIN_CHECK_INTERVAL_MS = 30000;
var openaiRotationPlugin = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var client = _b.client;
    return __generator(this, function (_c) {
        log.info('OpenAI rotation plugin loaded');
        return [2 /*return*/, {
                'chat.headers': function (input, output) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (input.model.providerID !== 'openai')
                            return [2 /*return*/];
                        output.headers[TOAST_SESSION_HEADER] = input.sessionID;
                        return [2 /*return*/];
                    });
                }); },
                event: function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                    var now, identity, label, store, count, sessionID, message, isRateLimit, isAuthError, isOpenAI, authJson, currentAuth, store, result;
                    var _c;
                    var event = _b.event;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                if (event.type === 'session.status') {
                                    log.info('session.status event', event.properties.status.type);
                                }
                                if (!(event.type === 'session.status' && event.properties.status.type === 'idle')) return [3 /*break*/, 3];
                                now = Date.now();
                                if (!(now - lastLoginCheckMs >= LOGIN_CHECK_INTERVAL_MS)) return [3 /*break*/, 3];
                                lastLoginCheckMs = now;
                                return [4 /*yield*/, (0, openai_auth_state_js_1.detectAndRememberNewOpenAIAccount)().catch(function () { return undefined; })];
                            case 1:
                                identity = _d.sent();
                                if (!identity) return [3 /*break*/, 3];
                                label = identity.email || identity.accountId || 'unknown';
                                return [4 /*yield*/, (0, openai_auth_state_js_1.loadOpenAIAccountStore)().catch(function () { return undefined; })];
                            case 2:
                                store = _d.sent();
                                count = (_c = store === null || store === void 0 ? void 0 : store.accounts.length) !== null && _c !== void 0 ? _c : 1;
                                client.tui
                                    .showToast({
                                    body: {
                                        message: (0, plugin_logger_js_1.appendToastSessionMarker)({
                                            message: "OpenAI account ".concat(label, " added to rotation pool (").concat(count, " account").concat(count === 1 ? '' : 's', ")"),
                                            sessionId: event.properties.sessionID,
                                        }),
                                        variant: 'info',
                                    },
                                })
                                    .catch(function () { });
                                _d.label = 3;
                            case 3:
                                if (!isRetryStatusEvent(event)) return [3 /*break*/, 8];
                                sessionID = event.properties.sessionID;
                                message = event.properties.status.message;
                                log.info('retry event', message.slice(0, 100));
                                isRateLimit = (0, oauth_rotation_shared_js_1.isRateLimitRetryMessage)(message);
                                isAuthError = (0, oauth_rotation_shared_js_1.isTokenRefreshError)(message);
                                if (!isRateLimit && !isAuthError)
                                    return [2 /*return*/];
                                return [4 /*yield*/, isOpenAISession(client, sessionID)];
                            case 4:
                                isOpenAI = _d.sent();
                                if (!isOpenAI)
                                    return [2 /*return*/];
                                return [4 /*yield*/, (0, oauth_rotation_shared_js_1.readJson)((0, oauth_rotation_shared_js_1.authFilePath)(), {})];
                            case 5:
                                authJson = _d.sent();
                                currentAuth = authJson.openai;
                                if (!(0, oauth_rotation_shared_js_1.isOAuthStored)(currentAuth))
                                    return [2 /*return*/];
                                return [4 /*yield*/, (0, openai_auth_state_js_1.loadOpenAIAccountStore)().catch(function () { return undefined; })];
                            case 6:
                                store = _d.sent();
                                if (!store || store.accounts.length < 2)
                                    return [2 /*return*/];
                                return [4 /*yield*/, (0, openai_auth_state_js_1.rotateOpenAIAccount)(currentAuth, client)];
                            case 7:
                                result = _d.sent();
                                if (result) {
                                    client.tui
                                        .showToast({
                                        body: {
                                            message: (0, plugin_logger_js_1.appendToastSessionMarker)({
                                                message: "Switching OpenAI from ".concat(result.fromLabel, " to ").concat(result.toLabel),
                                                sessionId: sessionID,
                                            }),
                                            variant: 'info',
                                        },
                                    })
                                        .catch(function () { });
                                }
                                _d.label = 8;
                            case 8: return [2 /*return*/];
                        }
                    });
                }); },
            }];
    });
}); };
exports.openaiRotationPlugin = openaiRotationPlugin;
