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
exports.externalOpencodeSyncInternals = void 0;
exports.startExternalOpencodeSessionSync = startExternalOpencodeSessionSync;
exports.stopExternalOpencodeSessionSync = stopExternalOpencodeSessionSync;
var node_fs_1 = require("node:fs");
var discord_js_1 = require("discord.js");
var database_js_1 = require("./database.js");
var discord_utils_js_1 = require("./discord-utils.js");
var logger_js_1 = require("./logger.js");
var message_formatting_js_1 = require("./message-formatting.js");
var opencode_js_1 = require("./opencode.js");
var thread_session_runtime_js_1 = require("./session-handler/thread-session-runtime.js");
var sentry_js_1 = require("./sentry.js");
var xml_js_1 = require("./xml.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.OPENCODE);
var EXTERNAL_SYNC_INTERVAL_MS = 5000;
// Don't sync sessions from before the CLI started. 5 min grace window
// covers sessions that were just created before the bot connected.
var CLI_START_MS = Date.now() - 5 * 60 * 1000;
var externalSyncInterval = null;
function isSyntheticTextPart(part) {
    var candidate = part;
    return candidate.synthetic === true;
}
function parseDiscordOriginMetadata(text) {
    var match = text.match(/<discord-user\s+([^>]+)\s*\/>/);
    if (!(match === null || match === void 0 ? void 0 : match[1])) {
        return null;
    }
    var attrs = __spreadArray([], match[1].matchAll(/([a-z-]+)="([^"]*)"/g), true).reduce(function (acc, current) {
        var key = current[1], value = current[2];
        if (!key) {
            return acc;
        }
        acc[key] = value || '';
        return acc;
    }, {});
    var username = attrs['name'];
    if (!username) {
        return null;
    }
    return {
        messageId: attrs['message-id'] || undefined,
        username: username,
        threadId: attrs['thread-id'] || undefined,
    };
}
function getDiscordOriginMetadataFromMessage(_a) {
    var message = _a.message;
    var textParts = message.parts.filter(function (p) {
        return p.type === 'text';
    });
    // Synthetic parts first (normal promptAsync path), then non-synthetic
    // (session.command() path where the tag is embedded in arguments text).
    var sorted = __spreadArray(__spreadArray([], textParts.filter(function (p) { return isSyntheticTextPart(p); }), true), textParts.filter(function (p) { return !isSyntheticTextPart(p); }), true);
    for (var _i = 0, sorted_1 = sorted; _i < sorted_1.length; _i++) {
        var part = sorted_1[_i];
        var metadata = parseDiscordOriginMetadata(part.text || '');
        if (metadata) {
            return metadata;
        }
    }
    return null;
}
function getRenderableUserTextParts(_a) {
    var message = _a.message;
    if (message.info.role !== 'user') {
        return [];
    }
    return message.parts.flatMap(function (part) {
        if (part.type !== 'text') {
            return [];
        }
        if (isSyntheticTextPart(part)) {
            return [];
        }
        var cleanedText = (0, xml_js_1.extractNonXmlContent)(part.text || '').trim();
        if (!cleanedText) {
            return [];
        }
        return [{ id: part.id, text: cleanedText }];
    });
}
function getExternalUserMirrorText(_a) {
    var username = _a.username, prompt = _a.prompt;
    return "\u00BB **".concat(username, ":** ").concat(prompt.slice(0, 1000)).concat(prompt.length > 1000 ? '...' : '');
}
// Pure derivation: is the latest user turn from Discord?
// Checks the newest user message with renderable text for a <discord-user />
// synthetic part. If present, the session is currently driven from Discord
// (kimaki manages it) and external sync should skip it. If absent (CLI/TUI),
// external sync should mirror it — this naturally handles the "reclaim" case
// (external → discord → external) without any DB source toggling.
function isLatestUserTurnFromDiscord(_a) {
    var messages = _a.messages;
    for (var i = messages.length - 1; i >= 0; i--) {
        var message = messages[i];
        if (message.info.role !== 'user') {
            continue;
        }
        var renderableParts = getRenderableUserTextParts({ message: message });
        if (renderableParts.length === 0) {
            continue;
        }
        // Found the latest user message with actual text content.
        // If it has <discord-user /> origin metadata, it came from Discord.
        return getDiscordOriginMetadataFromMessage({ message: message }) !== null;
    }
    // No user messages with text — treat as external (allow sync).
    return false;
}
function shouldMirrorAssistantPart(_a) {
    var part = _a.part, verbosity = _a.verbosity;
    if (verbosity === 'text_only') {
        return part.type === 'text';
    }
    if (verbosity === 'text_and_essential_tools') {
        if (part.type === 'text') {
            return true;
        }
        return (0, thread_session_runtime_js_1.isEssentialToolPart)(part);
    }
    return true;
}
function getSessionThreadName(_a) {
    var sessionTitle = _a.sessionTitle, messages = _a.messages;
    var normalizedTitle = sessionTitle === null || sessionTitle === void 0 ? void 0 : sessionTitle.trim();
    if (normalizedTitle) {
        return normalizedTitle.slice(0, 100);
    }
    var firstUserMessage = messages.find(function (message) {
        return message.info.role === 'user';
    });
    var firstUserText = firstUserMessage
        ? getRenderableUserTextParts({ message: firstUserMessage })
            .map(function (part) {
            return part.text;
        })
            .join(' ')
            .trim()
        : '';
    if (firstUserText) {
        return firstUserText.slice(0, 100);
    }
    return 'opencode session';
}
function getSessionRecencyTimestamp(session) {
    return session.time.updated || session.time.created || 0;
}
function sortSessionsByRecency(sessions) {
    return __spreadArray([], sessions, true).sort(function (left, right) {
        return getSessionRecencyTimestamp(right) - getSessionRecencyTimestamp(left);
    });
}
function groupTrackedChannelsByDirectory(trackedChannels) {
    var grouped = trackedChannels.reduce(function (acc, channel) {
        var _a;
        var existing = acc.get(channel.directory);
        var createdAtMs = Math.max(((_a = channel.created_at) === null || _a === void 0 ? void 0 : _a.getTime()) || 0, CLI_START_MS);
        if (!existing) {
            acc.set(channel.directory, {
                directory: channel.directory,
                channelId: channel.channel_id,
                startMs: createdAtMs,
            });
            return acc;
        }
        if (createdAtMs < existing.startMs) {
            acc.set(channel.directory, {
                directory: channel.directory,
                channelId: channel.channel_id,
                startMs: createdAtMs,
            });
        }
        return acc;
    }, new Map());
    return __spreadArray([], grouped.values(), true);
}
function ensureExternalSessionThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var existingThreadId, existingSource, existingThread, parentChannel, threadName, thread;
        var discordClient = _b.discordClient, channelId = _b.channelId, sessionId = _b.sessionId, sessionTitle = _b.sessionTitle, messages = _b.messages;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.getThreadIdBySessionId)(sessionId)];
                case 1:
                    existingThreadId = _c.sent();
                    if (!existingThreadId) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, database_js_1.getThreadSessionSource)(existingThreadId)];
                case 2:
                    existingSource = _c.sent();
                    if (!(existingSource === 'kimaki')) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, database_js_1.upsertThreadSession)({
                            threadId: existingThreadId,
                            sessionId: sessionId,
                            source: 'external_poll',
                        })];
                case 3:
                    _c.sent();
                    logger.log("[EXTERNAL_SYNC] Reclaimed thread ".concat(existingThreadId, " for session ").concat(sessionId, " (user resumed from OpenCode)"));
                    _c.label = 4;
                case 4: return [4 /*yield*/, discordClient.channels.fetch(existingThreadId).catch(function (error) {
                        return new Error("Failed to fetch thread ".concat(existingThreadId), {
                            cause: error,
                        });
                    })];
                case 5:
                    existingThread = _c.sent();
                    if (!(existingThread instanceof Error) && (existingThread === null || existingThread === void 0 ? void 0 : existingThread.isThread())) {
                        return [2 /*return*/, existingThread];
                    }
                    _c.label = 6;
                case 6: return [4 /*yield*/, discordClient.channels.fetch(channelId).catch(function (error) {
                        return new Error("Failed to fetch parent channel ".concat(channelId, " (channel may have been deleted or bot lacks access)"), { cause: error });
                    })];
                case 7:
                    parentChannel = _c.sent();
                    if (parentChannel instanceof Error) {
                        return [2 /*return*/, parentChannel];
                    }
                    if (!parentChannel || parentChannel.type !== discord_js_1.ChannelType.GuildText) {
                        return [2 /*return*/, new Error("Channel ".concat(channelId, " is not a text channel"))];
                    }
                    threadName = 'Sync: ' + getSessionThreadName({ sessionTitle: sessionTitle, messages: messages });
                    return [4 /*yield*/, (parentChannel).threads.create({
                            name: threadName.slice(0, 100),
                            autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneDay,
                            reason: "Sync external OpenCode session ".concat(sessionId),
                        }).catch(function (error) {
                            return new Error("Failed to create thread for session ".concat(sessionId), {
                                cause: error,
                            });
                        })];
                case 8:
                    thread = _c.sent();
                    if (thread instanceof Error) {
                        return [2 /*return*/, thread];
                    }
                    return [4 /*yield*/, (0, database_js_1.upsertThreadSession)({
                            threadId: thread.id,
                            sessionId: sessionId,
                            source: 'external_poll',
                        })];
                case 9:
                    _c.sent();
                    return [2 /*return*/, thread];
            }
        });
    });
}
// Collect all unsynced parts from all messages into SessionChunks.
// User messages that originated from this Discord thread are returned as
// directMappings (persisted without sending a Discord message). All other
// user and assistant parts are returned as chunks to send.
function collectUnsyncedChunks(_a) {
    var messages = _a.messages, syncedPartIds = _a.syncedPartIds, verbosity = _a.verbosity, thread = _a.thread;
    var chunks = [];
    var directMappings = [];
    var _loop_1 = function (message) {
        if (message.info.role === 'user') {
            var renderableParts = getRenderableUserTextParts({ message: message });
            var unsyncedParts = renderableParts.filter(function (p) {
                return !syncedPartIds.has(p.id);
            });
            if (unsyncedParts.length === 0) {
                return "continue";
            }
            // If the user message came from this Discord thread, skip mirroring
            // — it's already visible. When message-id is available, record a
            // direct mapping for part dedup. When it's missing (sourceMessageId
            // is optional in IngressInput), just mark parts as synced.
            var discordOrigin_1 = getDiscordOriginMetadataFromMessage({ message: message });
            if (discordOrigin_1 && (!discordOrigin_1.threadId || discordOrigin_1.threadId === thread.id)) {
                unsyncedParts.forEach(function (part) {
                    directMappings.push({
                        partId: part.id,
                        messageId: discordOrigin_1.messageId || '',
                        threadId: thread.id,
                    });
                    syncedPartIds.add(part.id);
                });
                return "continue";
            }
            var promptText = unsyncedParts.map(function (p) {
                return p.text;
            }).join('\n\n');
            chunks.push({
                partIds: unsyncedParts.map(function (p) {
                    return p.id;
                }),
                content: getExternalUserMirrorText({ username: 'user', prompt: promptText }),
            });
            return "continue";
        }
        if (message.info.role !== 'assistant') {
            return "continue";
        }
        // Filter assistant parts by verbosity before passing to shared collector
        var filteredParts = message.parts.filter(function (part) {
            return shouldMirrorAssistantPart({ part: part, verbosity: verbosity });
        });
        var assistantChunks = (0, message_formatting_js_1.collectSessionChunks)({
            messages: [{ info: message.info, parts: filteredParts }],
            skipPartIds: syncedPartIds,
        }).chunks;
        // Mark empty-content parts as synced (collectSessionChunks skips them)
        for (var _b = 0, filteredParts_1 = filteredParts; _b < filteredParts_1.length; _b++) {
            var part = filteredParts_1[_b];
            if (!syncedPartIds.has(part.id)) {
                var content = (0, message_formatting_js_1.formatPart)(part);
                if (!content.trim()) {
                    syncedPartIds.add(part.id);
                }
            }
        }
        chunks.push.apply(chunks, assistantChunks);
    };
    for (var _i = 0, messages_1 = messages; _i < messages_1.length; _i++) {
        var message = messages_1[_i];
        _loop_1(message);
    }
    return { chunks: chunks, directMappings: directMappings };
}
function syncSessionToThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var messagesResponse, messages, thread, _c, existingPartIds, verbosity, syncedPartIds, _d, chunks, directMappings, batched, _loop_2, _i, batched_1, batch;
        var client = _b.client, discordClient = _b.discordClient, directory = _b.directory, channelId = _b.channelId, sessionId = _b.sessionId, sessionTitle = _b.sessionTitle;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, client.session.messages({
                        sessionID: sessionId,
                        directory: directory,
                    }).catch(function (error) {
                        return new Error("Failed to fetch messages for session ".concat(sessionId), {
                            cause: error,
                        });
                    })];
                case 1:
                    messagesResponse = _e.sent();
                    if (messagesResponse instanceof Error) {
                        throw messagesResponse;
                    }
                    messages = messagesResponse.data || [];
                    // Pure derivation from opencode events: if the latest user turn has
                    // <discord-user /> metadata, kimaki's thread runtime owns this session.
                    // Skip external sync entirely. When the user resumes from CLI/TUI the
                    // latest user turn will lack the tag, so sync picks it up naturally.
                    if (isLatestUserTurnFromDiscord({ messages: messages })) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, ensureExternalSessionThread({
                            discordClient: discordClient,
                            channelId: channelId,
                            sessionId: sessionId,
                            sessionTitle: sessionTitle,
                            messages: messages,
                        })];
                case 2:
                    thread = _e.sent();
                    if (thread === null) {
                        return [2 /*return*/];
                    }
                    if (thread instanceof Error) {
                        throw thread;
                    }
                    return [4 /*yield*/, Promise.all([
                            (0, database_js_1.getPartMessageIds)(thread.id),
                            (0, database_js_1.getChannelVerbosity)(thread.parentId || thread.id),
                        ])];
                case 3:
                    _c = _e.sent(), existingPartIds = _c[0], verbosity = _c[1];
                    syncedPartIds = new Set(existingPartIds);
                    _d = collectUnsyncedChunks({ messages: messages, syncedPartIds: syncedPartIds, verbosity: verbosity, thread: thread }), chunks = _d.chunks, directMappings = _d.directMappings;
                    if (!(directMappings.length > 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, database_js_1.setPartMessagesBatch)(directMappings)];
                case 4:
                    _e.sent();
                    _e.label = 5;
                case 5:
                    batched = (0, message_formatting_js_1.batchChunksForDiscord)(chunks);
                    _loop_2 = function (batch) {
                        var sentMessage;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0: return [4 /*yield*/, (0, discord_utils_js_1.sendThreadMessage)(thread, batch.content)];
                                case 1:
                                    sentMessage = _f.sent();
                                    return [4 /*yield*/, (0, database_js_1.setPartMessagesBatch)(batch.partIds.map(function (partId) { return ({
                                            partId: partId,
                                            messageId: sentMessage.id,
                                            threadId: thread.id,
                                        }); }))];
                                case 2:
                                    _f.sent();
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, batched_1 = batched;
                    _e.label = 6;
                case 6:
                    if (!(_i < batched_1.length)) return [3 /*break*/, 9];
                    batch = batched_1[_i];
                    return [5 /*yield**/, _loop_2(batch)];
                case 7:
                    _e.sent();
                    _e.label = 8;
                case 8:
                    _i++;
                    return [3 /*break*/, 6];
                case 9: return [2 /*return*/];
            }
        });
    });
}
// Pulse typing indicator for sessions that are currently busy.
// Takes the global session statuses map (already fetched) and sends
// typing to threads whose session is busy and still managed by external_poll.
function pulseTypingForBusySessions(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _i, _c, _d, sessionId, status_1, threadId, source, thread;
        var discordClient = _b.discordClient, statuses = _b.statuses;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _i = 0, _c = Object.entries(statuses);
                    _e.label = 1;
                case 1:
                    if (!(_i < _c.length)) return [3 /*break*/, 7];
                    _d = _c[_i], sessionId = _d[0], status_1 = _d[1];
                    if (status_1.type !== 'busy') {
                        return [3 /*break*/, 6];
                    }
                    return [4 /*yield*/, (0, database_js_1.getThreadIdBySessionId)(sessionId)];
                case 2:
                    threadId = _e.sent();
                    if (!threadId) {
                        return [3 /*break*/, 6];
                    }
                    return [4 /*yield*/, (0, database_js_1.getThreadSessionSource)(threadId)];
                case 3:
                    source = _e.sent();
                    if (source && source !== 'external_poll') {
                        return [3 /*break*/, 6];
                    }
                    return [4 /*yield*/, discordClient.channels.fetch(threadId).catch(function () {
                            return null;
                        })];
                case 4:
                    thread = _e.sent();
                    if (!(thread === null || thread === void 0 ? void 0 : thread.isThread())) return [3 /*break*/, 6];
                    return [4 /*yield*/, thread.sendTyping().catch(function () { })];
                case 5:
                    _e.sent();
                    _e.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/];
            }
        });
    });
}
var EXTERNAL_SYNC_MAX_SESSIONS = 50;
function pollExternalSessions(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var trackedChannels, directoryTargets, _loop_3, _i, directoryTargets_1, target;
        var discordClient = _b.discordClient;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, database_js_1.listTrackedTextChannels)()];
                case 1:
                    trackedChannels = _c.sent();
                    directoryTargets = groupTrackedChannelsByDirectory(trackedChannels)
                        .filter(function (t) {
                        return node_fs_1.default.existsSync(t.directory);
                    });
                    if (directoryTargets.length === 0) {
                        return [2 /*return*/];
                    }
                    _loop_3 = function (target) {
                        var directory, channelId, startMs, clientResult, client, sessionsResponse, statusesResponse, sessions, sorted, _loop_4, _d, sorted_2, session;
                        return __generator(this, function (_e) {
                            switch (_e.label) {
                                case 0:
                                    directory = target.directory;
                                    channelId = target.channelId;
                                    startMs = target.startMs;
                                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(directory, {
                                            channelId: channelId,
                                        })];
                                case 1:
                                    clientResult = _e.sent();
                                    if (clientResult instanceof Error) {
                                        logger.warn("[EXTERNAL_SYNC] Failed to initialize OpenCode for ".concat(directory, ": ").concat(clientResult.message));
                                        return [2 /*return*/, "continue"];
                                    }
                                    client = clientResult();
                                    return [4 /*yield*/, client.session.list({
                                            directory: directory,
                                            start: startMs,
                                            limit: EXTERNAL_SYNC_MAX_SESSIONS,
                                        }).catch(function (error) {
                                            return new Error("Failed to list sessions for ".concat(directory), {
                                                cause: error,
                                            });
                                        })];
                                case 2:
                                    sessionsResponse = _e.sent();
                                    if (sessionsResponse instanceof Error) {
                                        logger.warn("[EXTERNAL_SYNC] ".concat(sessionsResponse.message));
                                        return [2 /*return*/, "continue"];
                                    }
                                    return [4 /*yield*/, client.session.status({
                                            directory: directory,
                                        }).catch(function () {
                                            return null;
                                        })];
                                case 3:
                                    statusesResponse = _e.sent();
                                    if (!(statusesResponse === null || statusesResponse === void 0 ? void 0 : statusesResponse.data)) return [3 /*break*/, 5];
                                    return [4 /*yield*/, pulseTypingForBusySessions({
                                            discordClient: discordClient,
                                            statuses: statusesResponse.data,
                                        }).catch(function () { })];
                                case 4:
                                    _e.sent();
                                    _e.label = 5;
                                case 5:
                                    sessions = (sessionsResponse.data || []).filter(function (session) {
                                        var title = session.title || '';
                                        if (/^new session\s*-/i.test(title)) {
                                            return false;
                                        }
                                        return !/subagent\)\s*$/i.test(title);
                                    });
                                    sorted = sortSessionsByRecency(sessions);
                                    _loop_4 = function (session) {
                                        return __generator(this, function (_f) {
                                            switch (_f.label) {
                                                case 0: return [4 /*yield*/, syncSessionToThread({
                                                        client: client,
                                                        discordClient: discordClient,
                                                        directory: directory,
                                                        channelId: channelId,
                                                        sessionId: session.id,
                                                        sessionTitle: session.title,
                                                    }).catch(function (error) {
                                                        logger.warn("[EXTERNAL_SYNC] Failed syncing session ".concat(session.id, ": ").concat(error instanceof Error ? error.message : String(error)));
                                                        void (0, sentry_js_1.notifyError)(error instanceof Error ? error : new Error(String(error)), "External session sync failed for ".concat(session.id));
                                                    })];
                                                case 1:
                                                    _f.sent();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _d = 0, sorted_2 = sorted;
                                    _e.label = 6;
                                case 6:
                                    if (!(_d < sorted_2.length)) return [3 /*break*/, 9];
                                    session = sorted_2[_d];
                                    return [5 /*yield**/, _loop_4(session)];
                                case 7:
                                    _e.sent();
                                    _e.label = 8;
                                case 8:
                                    _d++;
                                    return [3 /*break*/, 6];
                                case 9: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, directoryTargets_1 = directoryTargets;
                    _c.label = 2;
                case 2:
                    if (!(_i < directoryTargets_1.length)) return [3 /*break*/, 5];
                    target = directoryTargets_1[_i];
                    return [5 /*yield**/, _loop_3(target)];
                case 3:
                    _c.sent();
                    _c.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function startExternalOpencodeSessionSync(_a) {
    var _this = this;
    var discordClient = _a.discordClient;
    if (process.env.KIMAKI_VITEST &&
        process.env.KIMAKI_ENABLE_EXTERNAL_OPENCODE_SYNC !== '1') {
        return;
    }
    if (externalSyncInterval) {
        return;
    }
    var polling = false;
    var runPoll = function () { return __awaiter(_this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (polling) {
                        return [2 /*return*/];
                    }
                    polling = true;
                    return [4 /*yield*/, pollExternalSessions({ discordClient: discordClient }).catch(function (e) { return new Error('External session poll failed', { cause: e }); })];
                case 1:
                    result = _a.sent();
                    polling = false;
                    if (result instanceof Error) {
                        logger.warn("[EXTERNAL_SYNC] ".concat(result.message));
                        void (0, sentry_js_1.notifyError)(result, 'External session poll top-level failure');
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    void runPoll();
    externalSyncInterval = setInterval(function () {
        void runPoll();
    }, EXTERNAL_SYNC_INTERVAL_MS);
}
function stopExternalOpencodeSessionSync() {
    if (!externalSyncInterval) {
        return;
    }
    clearInterval(externalSyncInterval);
    externalSyncInterval = null;
}
exports.externalOpencodeSyncInternals = {
    getRenderableUserTextParts: getRenderableUserTextParts,
    getSessionThreadName: getSessionThreadName,
    groupTrackedChannelsByDirectory: groupTrackedChannelsByDirectory,
    sortSessionsByRecency: sortSessionsByRecency,
    parseDiscordOriginMetadata: parseDiscordOriginMetadata,
    getDiscordOriginMetadataFromMessage: getDiscordOriginMetadataFromMessage,
    isLatestUserTurnFromDiscord: isLatestUserTurnFromDiscord,
};
