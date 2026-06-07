#!/usr/bin/env tsx
"use strict";
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
var database_js_1 = require("../src/database.js");
var external_opencode_sync_js_1 = require("../src/external-opencode-sync.js");
var opencode_js_1 = require("../src/opencode.js");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var trackedChannels, directoryTargets, _loop_1, _i, directoryTargets_1, target;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.listTrackedTextChannels)()];
                case 1:
                    trackedChannels = _a.sent();
                    directoryTargets = external_opencode_sync_js_1.externalOpencodeSyncInternals.groupTrackedChannelsByDirectory(trackedChannels);
                    if (directoryTargets.length === 0) {
                        console.log('No tracked text channels found.');
                        return [2 /*return*/];
                    }
                    console.log('Tracked directory targets:');
                    directoryTargets.forEach(function (target) {
                        console.log("- ".concat(target.directory, " -> ").concat(target.channelId, " (start ").concat(new Date(target.startMs).toISOString(), ")"));
                    });
                    console.log('');
                    _loop_1 = function (target) {
                        var clientResult, client, sessionsResponse, sessions, _loop_2, _b, sessions_1, session;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0: return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(target.directory, {
                                        channelId: target.channelId,
                                    })];
                                case 1:
                                    clientResult = _c.sent();
                                    if (clientResult instanceof Error) {
                                        console.log("Directory ".concat(target.directory));
                                        console.log("  init: error (".concat(clientResult.message, ")"));
                                        console.log('');
                                        return [2 /*return*/, "continue"];
                                    }
                                    client = clientResult();
                                    return [4 /*yield*/, client.session.list({
                                            directory: target.directory,
                                            start: target.startMs,
                                            limit: 50,
                                        }).catch(function (error) {
                                            return new Error("Failed to list sessions for ".concat(target.directory), {
                                                cause: error,
                                            });
                                        })];
                                case 2:
                                    sessionsResponse = _c.sent();
                                    if (sessionsResponse instanceof Error) {
                                        console.log("Directory ".concat(target.directory));
                                        console.log("  list: error (".concat(sessionsResponse.message, ")"));
                                        console.log('');
                                        return [2 /*return*/, "continue"];
                                    }
                                    sessions = sessionsResponse.data || [];
                                    console.log("Directory ".concat(target.directory));
                                    console.log("  listed sessions: ".concat(sessions.length));
                                    console.log('');
                                    _loop_2 = function (session) {
                                        var placeholderTitle, messagesResponse, messages, latestUserTurnFromDiscord;
                                        return __generator(this, function (_d) {
                                            switch (_d.label) {
                                                case 0:
                                                    placeholderTitle = /^new session\s*-/i.test(session.title || '');
                                                    console.log("Session ".concat(session.id));
                                                    console.log("  title: ".concat(session.title));
                                                    console.log("  directory: ".concat(target.directory));
                                                    if (placeholderTitle) {
                                                        console.log('  status: skip (placeholder_title)');
                                                        console.log('');
                                                        return [2 /*return*/, "continue"];
                                                    }
                                                    return [4 /*yield*/, client.session.messages({
                                                            sessionID: session.id,
                                                            directory: target.directory,
                                                        }).catch(function (error) {
                                                            return new Error("Failed to fetch messages for session ".concat(session.id), {
                                                                cause: error,
                                                            });
                                                        })];
                                                case 1:
                                                    messagesResponse = _d.sent();
                                                    if (messagesResponse instanceof Error) {
                                                        console.log("  status: error (".concat(messagesResponse.message, ")"));
                                                        console.log('');
                                                        return [2 /*return*/, "continue"];
                                                    }
                                                    messages = messagesResponse.data || [];
                                                    latestUserTurnFromDiscord = external_opencode_sync_js_1.externalOpencodeSyncInternals.isLatestUserTurnFromDiscord({
                                                        messages: messages,
                                                    });
                                                    console.log("  status: ".concat(latestUserTurnFromDiscord ? 'skip (latest-user-from-discord)' : 'sync'));
                                                    console.log('');
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _b = 0, sessions_1 = sessions;
                                    _c.label = 3;
                                case 3:
                                    if (!(_b < sessions_1.length)) return [3 /*break*/, 6];
                                    session = sessions_1[_b];
                                    return [5 /*yield**/, _loop_2(session)];
                                case 4:
                                    _c.sent();
                                    _c.label = 5;
                                case 5:
                                    _b++;
                                    return [3 /*break*/, 3];
                                case 6: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, directoryTargets_1 = directoryTargets;
                    _a.label = 2;
                case 2:
                    if (!(_i < directoryTargets_1.length)) return [3 /*break*/, 5];
                    target = directoryTargets_1[_i];
                    return [5 /*yield**/, _loop_1(target)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
void main()
    .then(function () {
    process.exit(0);
})
    .catch(function (error) {
    console.error(error);
    process.exit(1);
});
