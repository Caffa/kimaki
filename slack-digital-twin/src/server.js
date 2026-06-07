"use strict";
// HTTP server implementing Slack Web API routes (/api/*).
// All Slack Web API methods are POST requests that accept form or JSON bodies
// and return { ok: true, ... } or { ok: false, error: "..." }.
//
// This server is used by @slack/web-api WebClient configured with a custom
// slackApiUrl pointing to our local server.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
exports.startServer = startServer;
exports.stopServer = stopServer;
var node_http_1 = require("node:http");
var spiceflow_1 = require("spiceflow");
var slack_ids_js_1 = require("./slack-ids.js");
var serializers_js_1 = require("./serializers.js");
// Parse Slack API request body. WebClient sends form-urlencoded or JSON
// depending on the method. We handle both.
function parseBody(request) {
    return __awaiter(this, void 0, void 0, function () {
        var contentType, text_1, params, result, _i, _a, _b, key, value, text;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    contentType = (_c = request.headers.get('content-type')) !== null && _c !== void 0 ? _c : '';
                    if (!contentType.includes('application/json')) return [3 /*break*/, 2];
                    return [4 /*yield*/, request.json()];
                case 1: return [2 /*return*/, (_d.sent())];
                case 2:
                    if (!(contentType.includes('application/x-www-form-urlencoded') ||
                        contentType.includes('multipart/form-data'))) return [3 /*break*/, 4];
                    return [4 /*yield*/, request.text()];
                case 3:
                    text_1 = _d.sent();
                    params = new URLSearchParams(text_1);
                    result = {};
                    for (_i = 0, _a = params.entries(); _i < _a.length; _i++) {
                        _b = _a[_i], key = _b[0], value = _b[1];
                        result[key] = value;
                    }
                    return [2 /*return*/, result];
                case 4: return [4 /*yield*/, request.text()];
                case 5:
                    text = _d.sent();
                    if (!text)
                        return [2 /*return*/, {}];
                    try {
                        return [2 /*return*/, JSON.parse(text)];
                    }
                    catch (_e) {
                        return [2 /*return*/, {}];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function parseUnknownBody(request) {
    return __awaiter(this, void 0, void 0, function () {
        var contentType, text_2, params, result, _i, _a, _b, key, value, text;
        var _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    contentType = (_c = request.headers.get('content-type')) !== null && _c !== void 0 ? _c : '';
                    if (!contentType.includes('application/json')) return [3 /*break*/, 2];
                    return [4 /*yield*/, request.json()];
                case 1: return [2 /*return*/, _d.sent()];
                case 2:
                    if (!(contentType.includes('application/x-www-form-urlencoded') ||
                        contentType.includes('multipart/form-data'))) return [3 /*break*/, 4];
                    return [4 /*yield*/, request.text()];
                case 3:
                    text_2 = _d.sent();
                    params = new URLSearchParams(text_2);
                    result = {};
                    for (_i = 0, _a = params.entries(); _i < _a.length; _i++) {
                        _b = _a[_i], key = _b[0], value = _b[1];
                        result[key] = value;
                    }
                    return [2 /*return*/, result];
                case 4: return [4 /*yield*/, request.text()];
                case 5:
                    text = _d.sent();
                    if (!text) {
                        return [2 /*return*/, {}];
                    }
                    try {
                        return [2 /*return*/, JSON.parse(text)];
                    }
                    catch (_e) {
                        return [2 /*return*/, {}];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function createServer(config) {
    var _this = this;
    var prisma = config.prisma, workspaceId = config.workspaceId, botUserId = config.botUserId, botToken = config.botToken, onViewOpen = config.onViewOpen;
    var assistantThreadStatusByThread = new Map();
    var app = new spiceflow_1.Spiceflow({ basePath: '' }).onError(function (_a) {
        var error = _a.error;
        if (error instanceof Response) {
            return error;
        }
        return Response.json({
            ok: false,
            error: 'internal_error',
            details: getErrorMessage(error),
        }, { status: 500 });
    });
    // --- auth.test ---
    app.post('/api/auth.test', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var auth, botUser;
        var _c;
        var request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    auth = (_c = request.headers.get('authorization')) !== null && _c !== void 0 ? _c : '';
                    if (!auth.includes(botToken)) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'invalid_auth' }, { status: 401 })];
                    }
                    return [4 /*yield*/, prisma.user.findUnique({ where: { id: botUserId } })];
                case 1:
                    botUser = _d.sent();
                    if (!botUser) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'user_not_found' })];
                    }
                    return [2 /*return*/, Response.json({
                            ok: true,
                            url: "https://".concat(workspaceId, ".slack.com/"),
                            team: workspaceId,
                            user: botUser.name,
                            team_id: workspaceId,
                            user_id: botUserId,
                            bot_id: "B".concat(botUserId.slice(1)),
                        })];
            }
        });
    }); });
    // --- chat.postMessage ---
    app.post('/api/chat.postMessage', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, text, threadTs, blocksRaw, channel, ts, blocks;
        var _c;
        var request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _d.sent();
                    channelId = body['channel'];
                    text = (_c = body['text']) !== null && _c !== void 0 ? _c : '';
                    threadTs = body['thread_ts'] || undefined;
                    blocksRaw = body['blocks'];
                    if (!channelId) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'channel_not_found' })];
                    }
                    return [4 /*yield*/, prisma.channel.findUnique({
                            where: { id: channelId },
                        })];
                case 2:
                    channel = _d.sent();
                    if (!channel) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'channel_not_found' })];
                    }
                    ts = (0, slack_ids_js_1.generateMessageTs)();
                    blocks = blocksRaw ? blocksRaw : '[]';
                    return [4 /*yield*/, prisma.message.create({
                            data: {
                                channelId: channelId,
                                userId: botUserId,
                                botId: "B".concat(botUserId.slice(1)),
                                text: text,
                                ts: ts,
                                threadTs: threadTs,
                                blocks: typeof blocks === 'string' ? blocks : JSON.stringify(blocks),
                            },
                        })];
                case 3:
                    _d.sent();
                    return [2 /*return*/, Response.json({
                            ok: true,
                            channel: channelId,
                            ts: ts,
                            message: __assign({ type: 'message', text: text, bot_id: "B".concat(botUserId.slice(1)), ts: ts }, (threadTs ? { thread_ts: threadTs } : {})),
                        })];
            }
        });
    }); });
    // --- chat.update ---
    app.post('/api/chat.update', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, ts, text, blocksRaw, message, editedTs;
        var _c;
        var request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _d.sent();
                    channelId = body['channel'];
                    ts = body['ts'];
                    text = (_c = body['text']) !== null && _c !== void 0 ? _c : '';
                    blocksRaw = body['blocks'];
                    if (!channelId || !ts) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'missing_required_field' })];
                    }
                    return [4 /*yield*/, prisma.message.findUnique({ where: { ts: ts } })];
                case 2:
                    message = _d.sent();
                    if (!message) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'message_not_found' })];
                    }
                    editedTs = (0, slack_ids_js_1.generateMessageTs)();
                    return [4 /*yield*/, prisma.message.update({
                            where: { ts: ts },
                            data: __assign({ text: text, editedTs: editedTs }, (blocksRaw
                                ? {
                                    blocks: typeof blocksRaw === 'string'
                                        ? blocksRaw
                                        : JSON.stringify(blocksRaw),
                                }
                                : {})),
                        })];
                case 3:
                    _d.sent();
                    return [2 /*return*/, Response.json({
                            ok: true,
                            channel: channelId,
                            ts: ts,
                            text: text,
                        })];
            }
        });
    }); });
    // --- chat.delete ---
    app.post('/api/chat.delete', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, ts, message;
        var request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _c.sent();
                    channelId = body['channel'];
                    ts = body['ts'];
                    if (!channelId || !ts) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'missing_required_field' })];
                    }
                    return [4 /*yield*/, prisma.message.findUnique({ where: { ts: ts } })];
                case 2:
                    message = _c.sent();
                    if (!message) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'message_not_found' })];
                    }
                    return [4 /*yield*/, prisma.message.update({
                            where: { ts: ts },
                            data: { isDeleted: true },
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/, Response.json({ ok: true, channel: channelId, ts: ts })];
            }
        });
    }); });
    // --- assistant.threads.setStatus ---
    app.post('/api/assistant.threads.setStatus', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, threadTs, status, parentMessage, threadKey;
        var _c;
        var request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _d.sent();
                    channelId = body['channel_id'];
                    threadTs = body['thread_ts'];
                    status = (_c = body['status']) !== null && _c !== void 0 ? _c : '';
                    if (!(channelId && threadTs)) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'missing_required_field' })];
                    }
                    return [4 /*yield*/, prisma.message.findUnique({ where: { ts: threadTs } })];
                case 2:
                    parentMessage = _d.sent();
                    if (!parentMessage || parentMessage.channelId !== channelId) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'thread_not_found' })];
                    }
                    threadKey = "".concat(channelId, ":").concat(threadTs);
                    if (status) {
                        assistantThreadStatusByThread.set(threadKey, status);
                    }
                    else {
                        assistantThreadStatusByThread.delete(threadKey);
                    }
                    return [2 /*return*/, Response.json({
                            ok: true,
                        })];
            }
        });
    }); });
    // --- conversations.history ---
    app.post('/api/conversations.history', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, limit, latest, oldest, where, tsFilter, messages;
        var _c;
        var request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _d.sent();
                    channelId = body['channel'];
                    limit = parseInt((_c = body['limit']) !== null && _c !== void 0 ? _c : '100', 10);
                    latest = body['latest'];
                    oldest = body['oldest'];
                    if (!channelId) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'channel_not_found' })];
                    }
                    where = {
                        channelId: channelId,
                        isDeleted: false,
                        threadTs: null, // history returns only top-level messages
                    };
                    tsFilter = {};
                    // Slack's latest/oldest are ts-based cursors
                    if (latest) {
                        tsFilter.lte = latest;
                    }
                    if (oldest) {
                        tsFilter.gte = oldest;
                    }
                    if (latest || oldest) {
                        where.ts = tsFilter;
                    }
                    return [4 /*yield*/, prisma.message.findMany({
                            where: where,
                            orderBy: { ts: 'desc' },
                            take: limit,
                            include: { reactions: true },
                        })];
                case 2:
                    messages = _d.sent();
                    return [2 /*return*/, Response.json({
                            ok: true,
                            messages: messages.map(function (m) {
                                return (0, serializers_js_1.messageToSlack)({ message: m, reactions: m.reactions });
                            }),
                            has_more: false,
                        })];
            }
        });
    }); });
    // --- conversations.replies ---
    app.post('/api/conversations.replies', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, parentTs, limit, messages;
        var _c;
        var request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _d.sent();
                    channelId = body['channel'];
                    parentTs = body['ts'];
                    limit = parseInt((_c = body['limit']) !== null && _c !== void 0 ? _c : '100', 10);
                    if (!channelId || !parentTs) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'missing_required_field' })];
                    }
                    return [4 /*yield*/, prisma.message.findMany({
                            where: {
                                channelId: channelId,
                                isDeleted: false,
                                OR: [{ ts: parentTs }, { threadTs: parentTs }],
                            },
                            orderBy: { ts: 'asc' },
                            take: limit,
                            include: { reactions: true },
                        })];
                case 2:
                    messages = _d.sent();
                    return [2 /*return*/, Response.json({
                            ok: true,
                            messages: messages.map(function (m) {
                                return (0, serializers_js_1.messageToSlack)({ message: m, reactions: m.reactions });
                            }),
                            has_more: false,
                        })];
            }
        });
    }); });
    // --- conversations.info ---
    app.post('/api/conversations.info', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, channel;
        var request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _c.sent();
                    channelId = body['channel'];
                    if (!channelId) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'channel_not_found' })];
                    }
                    return [4 /*yield*/, prisma.channel.findUnique({
                            where: { id: channelId },
                        })];
                case 2:
                    channel = _c.sent();
                    if (!channel) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'channel_not_found' })];
                    }
                    return [2 /*return*/, Response.json({
                            ok: true,
                            channel: (0, serializers_js_1.channelToSlack)({ channel: channel }),
                        })];
            }
        });
    }); });
    // --- conversations.list ---
    app.post('/api/conversations.list', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, types, excludeArchived, where, channels;
        var _c;
        var request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _d.sent();
                    types = (_c = body['types']) !== null && _c !== void 0 ? _c : 'public_channel';
                    excludeArchived = body['exclude_archived'] !== 'false';
                    where = __assign(__assign({ workspaceId: workspaceId }, (excludeArchived ? { isArchived: false } : {})), (!types.includes('private_channel') ? { isPrivate: false } : {}));
                    return [4 /*yield*/, prisma.channel.findMany({ where: where })];
                case 2:
                    channels = _d.sent();
                    return [2 /*return*/, Response.json({
                            ok: true,
                            channels: channels.map(function (c) { return (0, serializers_js_1.channelToSlack)({ channel: c }); }),
                        })];
            }
        });
    }); });
    // --- reactions.add ---
    app.post('/api/reactions.add', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, ts, name, message, existing;
        var request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _c.sent();
                    channelId = body['channel'];
                    ts = body['timestamp'];
                    name = body['name'];
                    if (!channelId || !ts || !name) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'missing_required_field' })];
                    }
                    return [4 /*yield*/, prisma.message.findUnique({ where: { ts: ts } })];
                case 2:
                    message = _c.sent();
                    if (!message) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'message_not_found' })];
                    }
                    return [4 /*yield*/, prisma.reaction.findUnique({
                            where: {
                                channelId_messageTs_userId_name: {
                                    channelId: channelId,
                                    messageTs: ts,
                                    userId: botUserId,
                                    name: name,
                                },
                            },
                        })];
                case 3:
                    existing = _c.sent();
                    if (existing) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'already_reacted' })];
                    }
                    return [4 /*yield*/, prisma.reaction.create({
                            data: { channelId: channelId, messageTs: ts, userId: botUserId, name: name },
                        })];
                case 4:
                    _c.sent();
                    return [2 /*return*/, Response.json({ ok: true })];
            }
        });
    }); });
    // --- reactions.remove ---
    app.post('/api/reactions.remove', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, ts, name, existing;
        var request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _c.sent();
                    channelId = body['channel'];
                    ts = body['timestamp'];
                    name = body['name'];
                    if (!channelId || !ts || !name) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'missing_required_field' })];
                    }
                    return [4 /*yield*/, prisma.reaction.findUnique({
                            where: {
                                channelId_messageTs_userId_name: {
                                    channelId: channelId,
                                    messageTs: ts,
                                    userId: botUserId,
                                    name: name,
                                },
                            },
                        })];
                case 2:
                    existing = _c.sent();
                    if (!existing) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'no_reaction' })];
                    }
                    return [4 /*yield*/, prisma.reaction.delete({ where: { id: existing.id } })];
                case 3:
                    _c.sent();
                    return [2 /*return*/, Response.json({ ok: true })];
            }
        });
    }); });
    // --- users.info ---
    app.post('/api/users.info', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, userId, user;
        var request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _c.sent();
                    userId = body['user'];
                    if (!userId) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'user_not_found' })];
                    }
                    return [4 /*yield*/, prisma.user.findUnique({ where: { id: userId } })];
                case 2:
                    user = _c.sent();
                    if (!user) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'user_not_found' })];
                    }
                    return [2 /*return*/, Response.json({
                            ok: true,
                            user: (0, serializers_js_1.userToSlack)({ user: user, workspaceId: workspaceId }),
                        })];
            }
        });
    }); });
    // --- users.list ---
    app.post('/api/users.list', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var users;
        var request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, prisma.user.findMany({
                        where: { workspaceId: workspaceId },
                    })];
                case 1:
                    users = _c.sent();
                    return [2 /*return*/, Response.json({
                            ok: true,
                            members: users.map(function (u) { return (0, serializers_js_1.userToSlack)({ user: u, workspaceId: workspaceId }); }),
                        })];
            }
        });
    }); });
    // --- conversations.create ---
    app.post('/api/conversations.create', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, name, isPrivate, existing, channelId, channel;
        var request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _c.sent();
                    name = body['name'];
                    isPrivate = body['is_private'] === 'true';
                    if (!name) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'invalid_name_required' })];
                    }
                    return [4 /*yield*/, prisma.channel.findFirst({
                            where: { workspaceId: workspaceId, name: name },
                        })];
                case 2:
                    existing = _c.sent();
                    if (existing) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'name_taken' })];
                    }
                    channelId = (0, slack_ids_js_1.generateChannelId)();
                    return [4 /*yield*/, prisma.channel.create({
                            data: {
                                id: channelId,
                                workspaceId: workspaceId,
                                name: name,
                                isPrivate: isPrivate,
                            },
                        })];
                case 3:
                    channel = _c.sent();
                    return [2 /*return*/, Response.json({
                            ok: true,
                            channel: (0, serializers_js_1.channelToSlack)({ channel: channel }),
                        })];
            }
        });
    }); });
    // --- conversations.rename ---
    app.post('/api/conversations.rename', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, name, channel, updated;
        var request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _c.sent();
                    channelId = body['channel'];
                    name = body['name'];
                    if (!channelId || !name) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'missing_required_field' })];
                    }
                    return [4 /*yield*/, prisma.channel.findUnique({ where: { id: channelId } })];
                case 2:
                    channel = _c.sent();
                    if (!channel) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'channel_not_found' })];
                    }
                    return [4 /*yield*/, prisma.channel.update({
                            where: { id: channelId },
                            data: { name: name },
                        })];
                case 3:
                    updated = _c.sent();
                    return [2 /*return*/, Response.json({
                            ok: true,
                            channel: (0, serializers_js_1.channelToSlack)({ channel: updated }),
                        })];
            }
        });
    }); });
    // --- conversations.setTopic ---
    app.post('/api/conversations.setTopic', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, topic, channel, updated;
        var _c;
        var request = _b.request;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _d.sent();
                    channelId = body['channel'];
                    topic = (_c = body['topic']) !== null && _c !== void 0 ? _c : '';
                    if (!channelId) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'channel_not_found' })];
                    }
                    return [4 /*yield*/, prisma.channel.findUnique({ where: { id: channelId } })];
                case 2:
                    channel = _d.sent();
                    if (!channel) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'channel_not_found' })];
                    }
                    return [4 /*yield*/, prisma.channel.update({
                            where: { id: channelId },
                            data: { topic: topic },
                        })];
                case 3:
                    updated = _d.sent();
                    return [2 /*return*/, Response.json({
                            ok: true,
                            channel: (0, serializers_js_1.channelToSlack)({ channel: updated }),
                        })];
            }
        });
    }); });
    // --- conversations.archive ---
    app.post('/api/conversations.archive', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, channelId, channel;
        var request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _c.sent();
                    channelId = body['channel'];
                    if (!channelId) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'channel_not_found' })];
                    }
                    return [4 /*yield*/, prisma.channel.findUnique({ where: { id: channelId } })];
                case 2:
                    channel = _c.sent();
                    if (!channel) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'channel_not_found' })];
                    }
                    if (channel.isArchived) {
                        return [2 /*return*/, Response.json({ ok: false, error: 'already_archived' })];
                    }
                    return [4 /*yield*/, prisma.channel.update({
                            where: { id: channelId },
                            data: { isArchived: true },
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/, Response.json({ ok: true })];
            }
        });
    }); });
    // --- usergroups.list ---
    // Stub: returns empty list (no Slack usergroups by default).
    // The discord-slack-bridge maps these to Discord guild roles.
    app.post('/api/usergroups.list', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, Response.json({
                    ok: true,
                    usergroups: [],
                })];
        });
    }); });
    // --- views.open ---
    // Stub: acknowledges modal open without rendering.
    // The discord-slack-bridge calls this for type-9 interaction responses.
    app.post('/api/views.open', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, openedView, viewTitle;
        var request = _b.request;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, parseUnknownBody(request)];
                case 1:
                    body = _c.sent();
                    openedView = normalizeOpenedView(body);
                    onViewOpen === null || onViewOpen === void 0 ? void 0 : onViewOpen(openedView);
                    viewTitle = resolveOpenedViewTitle(openedView);
                    return [2 /*return*/, Response.json({
                            ok: true,
                            view: {
                                id: "V".concat(Date.now()),
                                type: 'modal',
                                title: { type: 'plain_text', text: viewTitle },
                            },
                        })];
            }
        });
    }); });
    // --- files.getUploadURLExternal ---
    // Stub: returns a fake upload URL
    app.post('/api/files.getUploadURLExternal', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var body, filename, length, origin;
        var _c, _d;
        var request = _b.request;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, parseBody(request)];
                case 1:
                    body = _e.sent();
                    filename = (_c = body['filename']) !== null && _c !== void 0 ? _c : 'file';
                    length = (_d = body['length']) !== null && _d !== void 0 ? _d : '0';
                    origin = new URL(request.url).origin;
                    return [2 /*return*/, Response.json({
                            ok: true,
                            upload_url: "".concat(origin, "/fake-upload/").concat(filename),
                            file_id: "F".concat(Date.now()),
                        })];
            }
        });
    }); });
    // --- fake upload target for files.getUploadURLExternal ---
    // Accepts both POST and PUT so bridge tests can exercise upload fallback logic.
    app.post('/fake-upload/:filename', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Response(null, { status: 200 })];
        });
    }); });
    app.put('/fake-upload/:filename', function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Response(null, { status: 200 })];
        });
    }); });
    // --- files.completeUploadExternal ---
    // Stub: acknowledges upload completion
    app.post('/api/files.completeUploadExternal', function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
        var request = _b.request;
        return __generator(this, function (_c) {
            return [2 /*return*/, Response.json({
                    ok: true,
                    files: [],
                })];
        });
    }); });
    // Build HTTP server
    var httpServer = node_http_1.default.createServer(function (req, res) {
        return app.handleForNode(req, res);
    });
    return { httpServer: httpServer, app: app, port: 0 };
}
function startServer(components) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve) {
                    components.httpServer.listen(0, '127.0.0.1', function () {
                        var addr = components.httpServer.address();
                        var port = typeof addr === 'object' && addr ? addr.port : 0;
                        components.port = port;
                        resolve(port);
                    });
                })];
        });
    });
}
function stopServer(components) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    components.httpServer.close(function (err) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                })];
        });
    });
}
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
function normalizeOpenedView(value) {
    if (!isRecord(value)) {
        return {};
    }
    var triggerId = readString(value, 'trigger_id');
    var rawView = value['view'];
    var view = isRecord(rawView)
        ? rawView
        : (function () {
            if (typeof rawView !== 'string') {
                return undefined;
            }
            try {
                var parsed = JSON.parse(rawView);
                return isRecord(parsed) ? parsed : undefined;
            }
            catch (_a) {
                return undefined;
            }
        })();
    return {
        trigger_id: triggerId,
        view: view,
    };
}
function resolveOpenedViewTitle(openedView) {
    var _a;
    var title = (_a = openedView.view) === null || _a === void 0 ? void 0 : _a['title'];
    if (!isRecord(title)) {
        return 'Modal';
    }
    var text = readString(title, 'text');
    if (!text) {
        return 'Modal';
    }
    return text;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function readString(record, key) {
    var value = record[key];
    return typeof value === 'string' ? value : undefined;
}
