"use strict";
// Shared e2e test utilities for session cleanup, server cleanup, and
// Discord message polling helpers.
// Uses directory + start timestamp double-filter to ensure we only
// delete sessions created by this specific test run, never real user sessions.
//
// Prefers using the existing opencode client (already running server) to avoid
// spawning a new server process during teardown. Falls back to initializing
// a new server only if no existing client is available.
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
exports.chooseLockPort = chooseLockPort;
exports.initTestGitRepo = initTestGitRepo;
exports.cleanupTestSessions = cleanupTestSessions;
exports.waitForBotMessageCount = waitForBotMessageCount;
exports.waitForBotReplyAfterUserMessage = waitForBotReplyAfterUserMessage;
exports.waitForBotMessageContaining = waitForBotMessageContaining;
exports.waitForMessageById = waitForMessageById;
exports.waitForFooterMessage = waitForFooterMessage;
exports.waitForThreadQueueLength = waitForThreadQueueLength;
exports.waitForThreadState = waitForThreadState;
var node_child_process_1 = require("node:child_process");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
/**
 * Deterministic port from a string key (channel ID, test file name, etc.).
 * Uses a hash to pick a stable port in range 53000-54999, avoiding overlap
 * with queue-advanced tests (51000-52999) and getLockPort (30000-39999).
 * Replaces the old TOCTOU-prone pattern of binding port 0, reading the
 * assigned port, closing, then rebinding — which races under parallel vitest.
 */
function chooseLockPort(_a) {
    var key = _a.key;
    var hash = 0;
    for (var i = 0; i < key.length; i++) {
        var char = key.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return 53000 + (Math.abs(hash) % 2000);
}
/**
 * Initialize a git repo with a `main` branch and empty initial commit.
 * E2e tests create project directories under tmp/ which inherit the parent
 * repo's git state. On CI (detached HEAD), `git symbolic-ref --short HEAD`
 * returns empty, breaking footer snapshots that expect a branch name.
 * Calling this in each test project directory gives it its own repo on `main`.
 */
function initTestGitRepo(directory) {
    var isRepo = node_fs_1.default.existsSync(node_path_1.default.join(directory, '.git'));
    if (isRepo) {
        return;
    }
    (0, node_child_process_1.execSync)('git init -b main', { cwd: directory, stdio: 'pipe' });
    (0, node_child_process_1.execSync)('git config user.email "test@test.com"', { cwd: directory, stdio: 'pipe' });
    (0, node_child_process_1.execSync)('git config user.name "Test"', { cwd: directory, stdio: 'pipe' });
    (0, node_child_process_1.execSync)('git commit --allow-empty -m "init"', { cwd: directory, stdio: 'pipe' });
}
var opencode_js_1 = require("./opencode.js");
var thread_runtime_state_js_1 = require("./session-handler/thread-runtime-state.js");
var MAX_VITEST_WAIT_TIMEOUT_MS = 10000;
function normalizeWaitTimeout(timeout) {
    if (process.env['KIMAKI_VITEST'] === '1') {
        return Math.min(timeout, MAX_VITEST_WAIT_TIMEOUT_MS);
    }
    return timeout;
}
/**
 * Delete all opencode sessions created during a test run.
 * Uses directory + start timestamp to scope strictly to test sessions.
 * Prefers the existing in-memory client to avoid spawning a new server in teardown.
 * Errors are caught silently — cleanup should never fail tests.
 */
function cleanupTestSessions(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var existingClient, client, _c, listResult, sessions;
        var _this = this;
        var _d;
        var projectDirectory = _b.projectDirectory, testStartTime = _b.testStartTime;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    existingClient = (0, opencode_js_1.getOpencodeClient)(projectDirectory);
                    _c = existingClient;
                    if (_c) return [3 /*break*/, 2];
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var getClient;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory).catch(function () {
                                            return null;
                                        })];
                                    case 1:
                                        getClient = _a.sent();
                                        if (!getClient || getClient instanceof Error)
                                            return [2 /*return*/, null];
                                        return [2 /*return*/, getClient()];
                                }
                            });
                        }); })()];
                case 1:
                    _c = (_e.sent());
                    _e.label = 2;
                case 2:
                    client = _c;
                    if (!client)
                        return [2 /*return*/];
                    return [4 /*yield*/, client.session.list({
                            directory: projectDirectory,
                            start: testStartTime,
                            limit: 1000,
                        }).catch(function () {
                            return null;
                        })];
                case 3:
                    listResult = _e.sent();
                    sessions = (_d = listResult === null || listResult === void 0 ? void 0 : listResult.data) !== null && _d !== void 0 ? _d : [];
                    return [4 /*yield*/, Promise.all(sessions.map(function (s) {
                            return client.session.delete({
                                sessionID: s.id,
                                directory: projectDirectory,
                            }).catch(function () {
                                return;
                            });
                        }))];
                case 4:
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
}
// ── Discord message polling helpers ──────────────────────────────
// Used by e2e tests to wait for bot responses. All poll at 100ms
// intervals with configurable timeouts.
/** Poll getMessages until we see at least `count` bot messages. */
function waitForBotMessageCount(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var effectiveTimeout, start, messages, botMessages;
        var discord = _b.discord, threadId = _b.threadId, count = _b.count, timeout = _b.timeout;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    effectiveTimeout = normalizeWaitTimeout(timeout);
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 4];
                    return [4 /*yield*/, discord.thread(threadId).getMessages()];
                case 2:
                    messages = _c.sent();
                    botMessages = messages.filter(function (m) {
                        return m.author.id === discord.botUserId;
                    });
                    if (botMessages.length >= count) {
                        return [2 /*return*/, messages];
                    }
                    return [4 /*yield*/, new Promise(function (r) {
                            setTimeout(r, 100);
                        })];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 4: throw new Error("Timed out waiting for ".concat(count, " bot messages in thread ").concat(threadId));
            }
        });
    });
}
/**
 * Poll until a bot message appears after a user message containing the given text.
 * Content-aware: finds the user message by content, then checks for a bot reply after it.
 */
function waitForBotReplyAfterUserMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var effectiveTimeout, start, _loop_1, state_1;
        var discord = _b.discord, threadId = _b.threadId, userId = _b.userId, userMessageIncludes = _b.userMessageIncludes, timeout = _b.timeout;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    effectiveTimeout = normalizeWaitTimeout(timeout);
                    start = Date.now();
                    _loop_1 = function () {
                        var messages, userMessageIndex, botReplyIndex;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0: return [4 /*yield*/, discord.thread(threadId).getMessages()];
                                case 1:
                                    messages = _d.sent();
                                    userMessageIndex = messages.findIndex(function (message) {
                                        return (message.author.id === userId &&
                                            message.content.includes(userMessageIncludes));
                                    });
                                    botReplyIndex = messages.findIndex(function (message, index) {
                                        return index > userMessageIndex && message.author.id === discord.botUserId;
                                    });
                                    if (userMessageIndex >= 0 && botReplyIndex >= 0) {
                                        return [2 /*return*/, { value: messages }];
                                    }
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            setTimeout(resolve, 100);
                                        })];
                                case 2:
                                    _d.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_1()];
                case 2:
                    state_1 = _c.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    return [3 /*break*/, 1];
                case 3: throw new Error("Timed out waiting for bot reply after user message containing \"".concat(userMessageIncludes, "\" in thread ").concat(threadId));
            }
        });
    });
}
/**
 * Poll until a bot message containing specific text appears.
 * Optionally scoped to appear after a specific user message.
 */
function waitForBotMessageContaining(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var effectiveTimeout, start, lastMessages, _loop_2, state_2, recent;
        var discord = _b.discord, threadId = _b.threadId, userId = _b.userId, text = _b.text, afterUserMessageIncludes = _b.afterUserMessageIncludes, afterMessageId = _b.afterMessageId, timeout = _b.timeout;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    effectiveTimeout = normalizeWaitTimeout(timeout);
                    start = Date.now();
                    lastMessages = [];
                    _loop_2 = function () {
                        var messages, afterIndex, match;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0: return [4 /*yield*/, discord.thread(threadId).getMessages()];
                                case 1:
                                    messages = _d.sent();
                                    lastMessages = messages;
                                    afterIndex = (function () {
                                        if (afterMessageId) {
                                            return messages.findLastIndex(function (message) {
                                                return message.id === afterMessageId;
                                            });
                                        }
                                        if (afterUserMessageIncludes && userId) {
                                            return messages.findLastIndex(function (message) {
                                                return (message.author.id === userId &&
                                                    message.content.includes(afterUserMessageIncludes));
                                            });
                                        }
                                        return -1;
                                    })();
                                    if (!((afterUserMessageIncludes || afterMessageId) && afterIndex === -1)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            setTimeout(resolve, 100);
                                        })];
                                case 2:
                                    _d.sent();
                                    return [2 /*return*/, "continue"];
                                case 3:
                                    match = messages.find(function (message, index) {
                                        if ((afterUserMessageIncludes || afterMessageId) && afterIndex >= 0 && index <= afterIndex) {
                                            return false;
                                        }
                                        return (message.author.id === discord.botUserId &&
                                            message.content.includes(text));
                                    });
                                    if (match) {
                                        return [2 /*return*/, { value: messages }];
                                    }
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            setTimeout(resolve, 100);
                                        })];
                                case 4:
                                    _d.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_2()];
                case 2:
                    state_2 = _c.sent();
                    if (typeof state_2 === "object")
                        return [2 /*return*/, state_2.value];
                    return [3 /*break*/, 1];
                case 3:
                    recent = lastMessages
                        .slice(-12)
                        .map(function (message) {
                        var role = message.author.id === discord.botUserId ? 'bot' : 'user';
                        return "".concat(role, ": ").concat(message.content.slice(0, 120));
                    })
                        .join('\n');
                    throw new Error("Timed out waiting for bot message containing \"".concat(text, "\" in thread ").concat(threadId, ". Recent messages:\n").concat(recent));
            }
        });
    });
}
/** Poll until a specific message id appears in thread history. */
function waitForMessageById(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var effectiveTimeout, start, messages, message;
        var discord = _b.discord, threadId = _b.threadId, messageId = _b.messageId, timeout = _b.timeout;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    effectiveTimeout = normalizeWaitTimeout(timeout);
                    start = Date.now();
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 4];
                    return [4 /*yield*/, discord.thread(threadId).getMessages()];
                case 2:
                    messages = _c.sent();
                    message = messages.find(function (candidate) {
                        return candidate.id === messageId;
                    });
                    if (message) {
                        return [2 /*return*/, message];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 100);
                        })];
                case 3:
                    _c.sent();
                    return [3 /*break*/, 1];
                case 4: throw new Error("Timed out waiting for message ".concat(messageId, " in thread ").concat(threadId));
            }
        });
    });
}
function isFooterMessage(_a) {
    var message = _a.message, botUserId = _a.botUserId;
    if (message.author.id !== botUserId) {
        return false;
    }
    if (!message.content.startsWith('*')) {
        return false;
    }
    return message.content.includes('⋅');
}
/**
 * Poll until a footer message appears, optionally after an anchor message.
 * Useful for stabilizing snapshots by waiting for run completion metadata.
 */
function waitForFooterMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var effectiveTimeout, start, lastMessages, _loop_3, state_3, recent, anchorText;
        var discord = _b.discord, threadId = _b.threadId, timeout = _b.timeout, afterMessageIncludes = _b.afterMessageIncludes, afterAuthorId = _b.afterAuthorId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    effectiveTimeout = normalizeWaitTimeout(timeout);
                    start = Date.now();
                    lastMessages = [];
                    _loop_3 = function () {
                        var messages, afterIndex, footer;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0: return [4 /*yield*/, discord.thread(threadId).getMessages()];
                                case 1:
                                    messages = _d.sent();
                                    lastMessages = messages;
                                    afterIndex = afterMessageIncludes
                                        ? messages.findLastIndex(function (message) {
                                            if (!message.content.includes(afterMessageIncludes)) {
                                                return false;
                                            }
                                            if (!afterAuthorId) {
                                                return true;
                                            }
                                            return message.author.id === afterAuthorId;
                                        })
                                        : -1;
                                    if (!(afterMessageIncludes && afterIndex === -1)) return [3 /*break*/, 3];
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            setTimeout(resolve, 100);
                                        })];
                                case 2:
                                    _d.sent();
                                    return [2 /*return*/, "continue"];
                                case 3:
                                    footer = messages.find(function (message, index) {
                                        if (afterIndex >= 0 && index <= afterIndex) {
                                            return false;
                                        }
                                        return isFooterMessage({ message: message, botUserId: discord.botUserId });
                                    });
                                    if (footer) {
                                        return [2 /*return*/, { value: messages }];
                                    }
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            setTimeout(resolve, 100);
                                        })];
                                case 4:
                                    _d.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _c.label = 1;
                case 1:
                    if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 3];
                    return [5 /*yield**/, _loop_3()];
                case 2:
                    state_3 = _c.sent();
                    if (typeof state_3 === "object")
                        return [2 /*return*/, state_3.value];
                    return [3 /*break*/, 1];
                case 3:
                    recent = lastMessages
                        .slice(-12)
                        .map(function (message) {
                        var role = message.author.id === discord.botUserId ? 'bot' : 'user';
                        return "".concat(role, ": ").concat(message.content.slice(0, 120));
                    })
                        .join('\n');
                    anchorText = afterMessageIncludes || 'start';
                    throw new Error("Timed out waiting for footer after \"".concat(anchorText, "\" in thread ").concat(threadId, ". Recent messages:\n").concat(recent));
            }
        });
    });
}
// ── Thread state polling helpers ─────────────────────────────────
// Used by e2e tests to assert on queue and session-state snapshots.
/**
 * Poll until thread has at least `count` items in its queue.
 */
function waitForThreadQueueLength(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var effectiveTimeout, start, state, finalState, currentLength;
        var _c;
        var threadId = _b.threadId, count = _b.count, timeout = _b.timeout;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    effectiveTimeout = normalizeWaitTimeout(timeout);
                    start = Date.now();
                    _d.label = 1;
                case 1:
                    if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 3];
                    state = (0, thread_runtime_state_js_1.getThreadState)(threadId);
                    if (state && state.queueItems.length >= count) {
                        return [2 /*return*/, state];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 50);
                        })];
                case 2:
                    _d.sent();
                    return [3 /*break*/, 1];
                case 3:
                    finalState = (0, thread_runtime_state_js_1.getThreadState)(threadId);
                    currentLength = (_c = finalState === null || finalState === void 0 ? void 0 : finalState.queueItems.length) !== null && _c !== void 0 ? _c : 0;
                    throw new Error("Timed out waiting for thread ".concat(threadId, " queue length >= ").concat(count, ". Current length: ").concat(currentLength));
            }
        });
    });
}
/**
 * Poll until a custom predicate on ThreadRunState returns true.
 * Use this for compound assertions against thread state snapshots.
 */
function waitForThreadState(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var effectiveTimeout, start, state, finalState, desc, queueLen, sessionId;
        var _c, _d;
        var threadId = _b.threadId, predicate = _b.predicate, timeout = _b.timeout, description = _b.description;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    effectiveTimeout = normalizeWaitTimeout(timeout);
                    start = Date.now();
                    _e.label = 1;
                case 1:
                    if (!(Date.now() - start < effectiveTimeout)) return [3 /*break*/, 3];
                    state = (0, thread_runtime_state_js_1.getThreadState)(threadId);
                    if (state && predicate(state)) {
                        return [2 /*return*/, state];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 50);
                        })];
                case 2:
                    _e.sent();
                    return [3 /*break*/, 1];
                case 3:
                    finalState = (0, thread_runtime_state_js_1.getThreadState)(threadId);
                    desc = description !== null && description !== void 0 ? description : 'custom predicate';
                    queueLen = (_c = finalState === null || finalState === void 0 ? void 0 : finalState.queueItems.length) !== null && _c !== void 0 ? _c : 0;
                    sessionId = (_d = finalState === null || finalState === void 0 ? void 0 : finalState.sessionId) !== null && _d !== void 0 ? _d : 'none';
                    throw new Error("Timed out waiting for thread ".concat(threadId, " (").concat(desc, "). ") +
                        "Current: queue=".concat(queueLen, ", sessionId=").concat(sessionId));
            }
        });
    });
}
