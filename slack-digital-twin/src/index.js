"use strict";
// SlackDigitalTwin - Local Slack API test server.
// Creates a fake Slack Web API server that @slack/web-api WebClient can
// connect to. Used for automated testing of Slack bots and integrations
// without hitting real Slack servers.
//
// Architecture:
//   - Spiceflow HTTP server implementing Slack Web API routes (/api/*)
//   - In-memory Prisma + libsql database for state
//   - Webhook sender for simulating Events API delivery
//   - No WebSocket/Socket Mode — Slack Events API uses HTTP webhooks
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
exports.sendInteractivePayload = exports.sendSlashCommand = exports.sendWebhookEvent = exports.messageToSlack = exports.channelToSlack = exports.userToSlack = exports.resetIds = exports.generateMessageTs = exports.generateUserId = exports.generateChannelId = exports.generateWorkspaceId = exports.createPrismaClient = exports.UserActor = exports.ChannelScope = exports.SlackDigitalTwin = void 0;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_url_1 = require("node:url");
var db_js_1 = require("./db.js");
var slack_ids_js_1 = require("./slack-ids.js");
var server_js_1 = require("./server.js");
var serializers_js_1 = require("./serializers.js");
var webhook_sender_js_1 = require("./webhook-sender.js");
var SlackDigitalTwin = /** @class */ (function () {
    function SlackDigitalTwin(options) {
        if (options === void 0) { options = {}; }
        var _a, _b, _c, _d;
        /** Webhook sender config — set via setWebhookUrl() after bridge starts.
         *  Package-private: accessed by UserActor in the same file. */
        this.webhookSenderConfig = null;
        this.server = null;
        this.seeded = false;
        this.userIds = new Map(); // name → id
        this.channelIds = new Map(); // name → id
        this.openedViews = [];
        this.options = options;
        this.prisma = (0, db_js_1.createPrismaClient)(options.dbUrl);
        this.botToken = (_a = options.botToken) !== null && _a !== void 0 ? _a : 'xoxb-fake-bot-token';
        this.botUserId = (_c = (_b = options.botUser) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : (0, slack_ids_js_1.generateUserId)();
        this.workspaceId = (_d = options.workspaceId) !== null && _d !== void 0 ? _d : (0, slack_ids_js_1.generateWorkspaceId)();
    }
    Object.defineProperty(SlackDigitalTwin.prototype, "port", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this.server) === null || _a === void 0 ? void 0 : _a.port) !== null && _b !== void 0 ? _b : 0;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(SlackDigitalTwin.prototype, "apiUrl", {
        // URL for @slack/web-api WebClient's slackApiUrl option.
        // Point WebClient at this to use the twin instead of real Slack.
        get: function () {
            return "http://127.0.0.1:".concat(this.port, "/api/");
        },
        enumerable: false,
        configurable: true
    });
    SlackDigitalTwin.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var port;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.prisma.$executeRawUnsafe('PRAGMA busy_timeout = 5000')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.prisma.$executeRawUnsafe('PRAGMA journal_mode = WAL')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.applySchema()];
                    case 3:
                        _a.sent();
                        if (!!this.seeded) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.seed()];
                    case 4:
                        _a.sent();
                        this.seeded = true;
                        _a.label = 5;
                    case 5:
                        this.server = (0, server_js_1.createServer)({
                            prisma: this.prisma,
                            workspaceId: this.workspaceId,
                            botUserId: this.botUserId,
                            botToken: this.botToken,
                            onViewOpen: function (view) {
                                _this.recordOpenedView(view);
                            },
                        });
                        return [4 /*yield*/, (0, server_js_1.startServer)(this.server)];
                    case 6:
                        port = _a.sent();
                        this.server.port = port;
                        return [2 /*return*/];
                }
            });
        });
    };
    SlackDigitalTwin.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.server) return [3 /*break*/, 2];
                        return [4 /*yield*/, (0, server_js_1.stopServer)(this.server)];
                    case 1:
                        _a.sent();
                        this.server = null;
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    // --- Scoped accessors ---
    SlackDigitalTwin.prototype.getOpenedViews = function () {
        return __spreadArray([], this.openedViews, true);
    };
    SlackDigitalTwin.prototype.clearOpenedViews = function () {
        this.openedViews = [];
    };
    SlackDigitalTwin.prototype.waitForOpenedView = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var start, views, match;
            var _b = _a === void 0 ? {} : _a, _c = _b.timeout, timeout = _c === void 0 ? 3000 : _c, predicate = _b.predicate;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        start = Date.now();
                        _d.label = 1;
                    case 1:
                        if (!(Date.now() - start < timeout)) return [3 /*break*/, 3];
                        views = this.getOpenedViews();
                        match = predicate ? views.find(predicate) : views[views.length - 1];
                        if (match) {
                            return [2 /*return*/, match];
                        }
                        return [4 /*yield*/, sleep(50)];
                    case 2:
                        _d.sent();
                        return [3 /*break*/, 1];
                    case 3: throw new Error("waitForOpenedView timed out after ".concat(timeout, "ms"));
                }
            });
        });
    };
    SlackDigitalTwin.prototype.channel = function (channelIdOrName) {
        var _a;
        var channelId = (_a = this.channelIds.get(channelIdOrName)) !== null && _a !== void 0 ? _a : channelIdOrName;
        return new ChannelScope({ twin: this, channelId: channelId });
    };
    SlackDigitalTwin.prototype.user = function (userIdOrName) {
        var _a;
        var userId = (_a = this.userIds.get(userIdOrName)) !== null && _a !== void 0 ? _a : userIdOrName;
        return new UserActor({ twin: this, userId: userId });
    };
    // Resolve a user name to its ID
    SlackDigitalTwin.prototype.resolveUserId = function (nameOrId) {
        var _a;
        return (_a = this.userIds.get(nameOrId)) !== null && _a !== void 0 ? _a : nameOrId;
    };
    // Resolve a channel name to its ID
    SlackDigitalTwin.prototype.resolveChannelId = function (nameOrId) {
        var _a;
        return (_a = this.channelIds.get(nameOrId)) !== null && _a !== void 0 ? _a : nameOrId;
    };
    // Wire the webhook target URL. Call after bridge.start() so the port is known.
    // Requires webhookConfig.signingSecret to be set in the constructor options.
    SlackDigitalTwin.prototype.setWebhookUrl = function (url) {
        var _a;
        var signingSecret = (_a = this.options.webhookConfig) === null || _a === void 0 ? void 0 : _a.signingSecret;
        if (!signingSecret) {
            throw new Error('Cannot setWebhookUrl without webhookConfig.signingSecret in constructor options');
        }
        this.webhookSenderConfig = {
            webhookUrl: url,
            signingSecret: signingSecret,
            workspaceId: this.workspaceId,
        };
    };
    // --- Schema & Seeding ---
    SlackDigitalTwin.prototype.applySchema = function () {
        return __awaiter(this, void 0, void 0, function () {
            var __dirname, schemaPath, sql, statements, _i, statements_1, statement;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        __dirname = node_path_1.default.dirname(node_url_1.default.fileURLToPath(import.meta.url));
                        schemaPath = node_path_1.default.resolve(__dirname, '../src/schema.sql');
                        sql = node_fs_1.default.readFileSync(schemaPath, 'utf-8');
                        statements = sql
                            .split(';')
                            .map(function (s) {
                            return s
                                .split('\n')
                                .filter(function (line) { return !line.trimStart().startsWith('--'); })
                                .join('\n')
                                .trim();
                        })
                            .filter(function (s) {
                            return s.length > 0 &&
                                !/^CREATE\s+TABLE\s+["']?sqlite_sequence["']?\s*\(/i.test(s);
                        })
                            .map(function (s) {
                            return s
                                .replace(/^CREATE\s+UNIQUE\s+INDEX\b(?!\s+IF)/i, 'CREATE UNIQUE INDEX IF NOT EXISTS')
                                .replace(/^CREATE\s+INDEX\b(?!\s+IF)/i, 'CREATE INDEX IF NOT EXISTS');
                        });
                        _i = 0, statements_1 = statements;
                        _a.label = 1;
                    case 1:
                        if (!(_i < statements_1.length)) return [3 /*break*/, 4];
                        statement = statements_1[_i];
                        return [4 /*yield*/, this.prisma.$executeRawUnsafe(statement)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SlackDigitalTwin.prototype.seed = function () {
        return __awaiter(this, void 0, void 0, function () {
            var opts, workspaceName, botName, _i, _a, userOpt, userId, _b, _c, chanOpt, channelId;
            var _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            return __generator(this, function (_r) {
                switch (_r.label) {
                    case 0:
                        opts = this.options;
                        workspaceName = (_d = opts.workspaceName) !== null && _d !== void 0 ? _d : 'test-workspace';
                        // Create workspace
                        return [4 /*yield*/, this.prisma.workspace.create({
                                data: {
                                    id: this.workspaceId,
                                    name: workspaceName,
                                    domain: workspaceName.toLowerCase().replace(/\s+/g, '-'),
                                },
                            })
                            // Create bot user
                        ];
                    case 1:
                        // Create workspace
                        _r.sent();
                        botName = (_f = (_e = opts.botUser) === null || _e === void 0 ? void 0 : _e.name) !== null && _f !== void 0 ? _f : 'test-bot';
                        return [4 /*yield*/, this.prisma.user.create({
                                data: {
                                    id: this.botUserId,
                                    workspaceId: this.workspaceId,
                                    name: botName,
                                    realName: botName,
                                    isBot: true,
                                },
                            })
                            // Create configured users
                        ];
                    case 2:
                        _r.sent();
                        _i = 0, _a = (_g = opts.users) !== null && _g !== void 0 ? _g : [];
                        _r.label = 3;
                    case 3:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        userOpt = _a[_i];
                        userId = (_h = userOpt.id) !== null && _h !== void 0 ? _h : (0, slack_ids_js_1.generateUserId)();
                        this.userIds.set(userOpt.name, userId);
                        return [4 /*yield*/, this.prisma.user.create({
                                data: {
                                    id: userId,
                                    workspaceId: this.workspaceId,
                                    name: userOpt.name,
                                    realName: (_j = userOpt.realName) !== null && _j !== void 0 ? _j : userOpt.name,
                                    isBot: (_k = userOpt.isBot) !== null && _k !== void 0 ? _k : false,
                                    avatar: userOpt.avatar,
                                },
                            })];
                    case 4:
                        _r.sent();
                        _r.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6:
                        _b = 0, _c = (_l = opts.channels) !== null && _l !== void 0 ? _l : [];
                        _r.label = 7;
                    case 7:
                        if (!(_b < _c.length)) return [3 /*break*/, 10];
                        chanOpt = _c[_b];
                        channelId = (_m = chanOpt.id) !== null && _m !== void 0 ? _m : (0, slack_ids_js_1.generateChannelId)();
                        this.channelIds.set(chanOpt.name, channelId);
                        return [4 /*yield*/, this.prisma.channel.create({
                                data: {
                                    id: channelId,
                                    workspaceId: this.workspaceId,
                                    name: chanOpt.name,
                                    isPrivate: (_o = chanOpt.isPrivate) !== null && _o !== void 0 ? _o : false,
                                    topic: (_p = chanOpt.topic) !== null && _p !== void 0 ? _p : '',
                                    purpose: (_q = chanOpt.purpose) !== null && _q !== void 0 ? _q : '',
                                },
                            })];
                    case 8:
                        _r.sent();
                        _r.label = 9;
                    case 9:
                        _b++;
                        return [3 /*break*/, 7];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    SlackDigitalTwin.prototype.recordOpenedView = function (view) {
        this.openedViews.push(view);
        if (this.openedViews.length > SlackDigitalTwin.OPENED_VIEWS_MAX) {
            this.openedViews.shift();
        }
    };
    SlackDigitalTwin.OPENED_VIEWS_MAX = 200;
    return SlackDigitalTwin;
}());
exports.SlackDigitalTwin = SlackDigitalTwin;
// --- ChannelScope ---
var ChannelScope = /** @class */ (function () {
    function ChannelScope(_a) {
        var twin = _a.twin, channelId = _a.channelId;
        this.twin = twin;
        this.channelId = channelId;
    }
    // Get all non-deleted messages in this channel, ordered by ts ascending
    ChannelScope.prototype.getMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            var messages;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.twin.prisma.message.findMany({
                            where: { channelId: this.channelId, isDeleted: false },
                            orderBy: { ts: 'asc' },
                            include: { reactions: true },
                        })];
                    case 1:
                        messages = _a.sent();
                        return [2 /*return*/, messages.map(function (m) { return (0, serializers_js_1.messageToSlack)({ message: m, reactions: m.reactions }); })];
                }
            });
        });
    };
    // Get a markdown-like text snapshot of all messages for inline assertions.
    // Format: "username: message text" per line, threads indented.
    ChannelScope.prototype.text = function () {
        return __awaiter(this, void 0, void 0, function () {
            var messages, lines, _i, messages_1, msg, user, name_1, prefix, reactionsStr;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.twin.prisma.message.findMany({
                            where: { channelId: this.channelId, isDeleted: false },
                            orderBy: { ts: 'asc' },
                            include: { reactions: true },
                        })];
                    case 1:
                        messages = _b.sent();
                        lines = [];
                        _i = 0, messages_1 = messages;
                        _b.label = 2;
                    case 2:
                        if (!(_i < messages_1.length)) return [3 /*break*/, 5];
                        msg = messages_1[_i];
                        return [4 /*yield*/, this.twin.prisma.user.findUnique({
                                where: { id: msg.userId },
                            })];
                    case 3:
                        user = _b.sent();
                        name_1 = (_a = user === null || user === void 0 ? void 0 : user.name) !== null && _a !== void 0 ? _a : msg.userId;
                        prefix = msg.threadTs && msg.threadTs !== msg.ts ? '  ↳ ' : '';
                        reactionsStr = msg.reactions.length > 0
                            ? " [".concat(msg.reactions.map(function (r) { return ":".concat(r.name, ":"); }).join(' '), "]")
                            : '';
                        lines.push("".concat(prefix).concat(name_1, ": ").concat(msg.text).concat(reactionsStr));
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, lines.join('\n')];
                }
            });
        });
    };
    // Wait for a message matching an optional predicate
    ChannelScope.prototype.waitForMessage = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var start, messages, match;
            var _b = _a === void 0 ? {} : _a, _c = _b.timeout, timeout = _c === void 0 ? 3000 : _c, predicate = _b.predicate;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        start = Date.now();
                        _d.label = 1;
                    case 1:
                        if (!(Date.now() - start < timeout)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getMessages()];
                    case 2:
                        messages = _d.sent();
                        match = predicate ? messages.find(predicate) : messages[messages.length - 1];
                        if (match)
                            return [2 /*return*/, match];
                        return [4 /*yield*/, sleep(50)];
                    case 3:
                        _d.sent();
                        return [3 /*break*/, 1];
                    case 4: throw new Error("waitForMessage timed out after ".concat(timeout, "ms in channel ").concat(this.channelId));
                }
            });
        });
    };
    // Wait for a message from a bot
    ChannelScope.prototype.waitForBotReply = function () {
        return __awaiter(this, arguments, void 0, function (_a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.timeout, timeout = _c === void 0 ? 3000 : _c;
            return __generator(this, function (_d) {
                return [2 /*return*/, this.waitForMessage({
                        timeout: timeout,
                        predicate: function (msg) { return msg.bot_id != null; },
                    })];
            });
        });
    };
    return ChannelScope;
}());
exports.ChannelScope = ChannelScope;
// --- UserActor ---
var UserActor = /** @class */ (function () {
    function UserActor(_a) {
        var twin = _a.twin, userId = _a.userId;
        this.twin = twin;
        this.userId = userId;
    }
    // Send a message as this user to a channel.
    // When webhookSenderConfig is set, auto-emits a signed webhook event
    // so the bridge receives it via /slack/events.
    UserActor.prototype.sendMessage = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var channelId, ts;
            var channel = _b.channel, text = _b.text, threadTs = _b.threadTs;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        channelId = this.twin.resolveChannelId(channel);
                        ts = (0, slack_ids_js_1.generateMessageTs)();
                        return [4 /*yield*/, this.twin.prisma.message.create({
                                data: {
                                    channelId: channelId,
                                    userId: this.userId,
                                    text: text,
                                    ts: ts,
                                    threadTs: threadTs,
                                },
                            })];
                    case 1:
                        _c.sent();
                        if (!this.twin.webhookSenderConfig) return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, webhook_sender_js_1.sendWebhookEvent)({
                                config: this.twin.webhookSenderConfig,
                                event: __assign({ type: 'message', channel: channelId, user: this.userId, text: text, ts: ts }, (threadTs ? { thread_ts: threadTs } : {})),
                            })];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3: return [2 /*return*/, __assign({ type: 'message', user: this.userId, text: text, ts: ts }, (threadTs ? { thread_ts: threadTs } : {}))];
                }
            });
        });
    };
    // Add a reaction as this user.
    // When webhookSenderConfig is set, auto-emits a reaction_added webhook.
    UserActor.prototype.addReaction = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var channelId;
            var channel = _b.channel, messageTs = _b.messageTs, name = _b.name;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        channelId = this.twin.resolveChannelId(channel);
                        return [4 /*yield*/, this.twin.prisma.reaction.create({
                                data: {
                                    channelId: channelId,
                                    messageTs: messageTs,
                                    userId: this.userId,
                                    name: name,
                                },
                            })];
                    case 1:
                        _c.sent();
                        if (!this.twin.webhookSenderConfig) return [3 /*break*/, 3];
                        return [4 /*yield*/, (0, webhook_sender_js_1.sendWebhookEvent)({
                                config: this.twin.webhookSenderConfig,
                                event: {
                                    type: 'reaction_added',
                                    user: this.userId,
                                    reaction: name,
                                    item: { type: 'message', channel: channelId, ts: messageTs },
                                },
                            })];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return UserActor;
}());
exports.UserActor = UserActor;
function sleep(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
// Re-exports
var db_js_2 = require("./db.js");
Object.defineProperty(exports, "createPrismaClient", { enumerable: true, get: function () { return db_js_2.createPrismaClient; } });
var slack_ids_js_2 = require("./slack-ids.js");
Object.defineProperty(exports, "generateWorkspaceId", { enumerable: true, get: function () { return slack_ids_js_2.generateWorkspaceId; } });
Object.defineProperty(exports, "generateChannelId", { enumerable: true, get: function () { return slack_ids_js_2.generateChannelId; } });
Object.defineProperty(exports, "generateUserId", { enumerable: true, get: function () { return slack_ids_js_2.generateUserId; } });
Object.defineProperty(exports, "generateMessageTs", { enumerable: true, get: function () { return slack_ids_js_2.generateMessageTs; } });
Object.defineProperty(exports, "resetIds", { enumerable: true, get: function () { return slack_ids_js_2.resetIds; } });
var serializers_js_2 = require("./serializers.js");
Object.defineProperty(exports, "userToSlack", { enumerable: true, get: function () { return serializers_js_2.userToSlack; } });
Object.defineProperty(exports, "channelToSlack", { enumerable: true, get: function () { return serializers_js_2.channelToSlack; } });
Object.defineProperty(exports, "messageToSlack", { enumerable: true, get: function () { return serializers_js_2.messageToSlack; } });
var webhook_sender_js_2 = require("./webhook-sender.js");
Object.defineProperty(exports, "sendWebhookEvent", { enumerable: true, get: function () { return webhook_sender_js_2.sendWebhookEvent; } });
Object.defineProperty(exports, "sendSlashCommand", { enumerable: true, get: function () { return webhook_sender_js_2.sendSlashCommand; } });
Object.defineProperty(exports, "sendInteractivePayload", { enumerable: true, get: function () { return webhook_sender_js_2.sendInteractivePayload; } });
