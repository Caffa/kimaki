#!/usr/bin/env tsx
"use strict";
// Probe Discord Message Content Intent behavior for thread starter messages.
// Run with Message Content Intent disabled, mention the bot inside a thread,
// and compare the visible reply content with fetched starter message content.
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
var discord = require("discord.js");
var Client = discord.Client, GatewayIntentBits = discord.GatewayIntentBits;
var token = process.env.DISCORD_BOT_TOKEN || process.env.BOT_TOKEN;
if (!token) {
    console.error('Set DISCORD_BOT_TOKEN or BOT_TOKEN before running this script.');
    process.exit(1);
}
var client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
function summarizeMessage(message) {
    return {
        id: message.id,
        channelId: message.channelId,
        authorId: message.author.id,
        content: message.content,
        contentLength: message.content.length,
        attachments: message.attachments.size,
        embeds: message.embeds.length,
        components: message.components.length,
    };
}
function formatSummary(label, result) {
    if (result instanceof Error)
        return "".concat(label, ": ").concat(result.message);
    return [
        "".concat(label, ":"),
        "id=".concat(result.id),
        "channel=".concat(result.channelId),
        "contentLength=".concat(result.content.length),
        "content=".concat(JSON.stringify(result.content)),
        "attachments=".concat(result.attachments.size),
        "embeds=".concat(result.embeds.length),
        "components=".concat(result.components.length),
    ].join('\n');
}
function fetchThreadStarter(channel) {
    return __awaiter(this, void 0, void 0, function () {
        var starter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, channel
                        .fetchStarterMessage()
                        .catch(function (cause) { return new Error('fetchStarterMessage failed', { cause: cause }); })];
                case 1:
                    starter = _a.sent();
                    if (starter instanceof Error)
                        return [2 /*return*/, starter];
                    if (!starter)
                        return [2 /*return*/, new Error('Thread has no starter message')];
                    return [2 /*return*/, starter];
            }
        });
    });
}
function fetchParentMessageByThreadId(channel) {
    return __awaiter(this, void 0, void 0, function () {
        var parent, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parent = channel.parent;
                    if (!parent || !parent.isTextBased()) {
                        return [2 /*return*/, new Error('Thread parent is missing or not text based')];
                    }
                    return [4 /*yield*/, parent.messages
                            .fetch(channel.id)
                            .catch(function (cause) { return new Error('parent.messages.fetch(thread.id) failed', { cause: cause }); })];
                case 1:
                    message = _a.sent();
                    return [2 /*return*/, message];
            }
        });
    });
}
function fetchReferencedMessage(message) {
    return __awaiter(this, void 0, void 0, function () {
        var channel, referenced;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!((_a = message.reference) === null || _a === void 0 ? void 0 : _a.messageId)) {
                        return [2 /*return*/, new Error('Message has no reply reference')];
                    }
                    return [4 /*yield*/, client.channels
                            .fetch(message.reference.channelId || message.channelId)
                            .catch(function (cause) { return new Error('Failed to fetch referenced channel', { cause: cause }); })];
                case 1:
                    channel = _b.sent();
                    if (channel instanceof Error)
                        return [2 /*return*/, channel];
                    if (!channel || !channel.isTextBased()) {
                        return [2 /*return*/, new Error('Referenced channel is missing or not text based')];
                    }
                    return [4 /*yield*/, channel.messages
                            .fetch(message.reference.messageId)
                            .catch(function (cause) { return new Error('Failed to fetch referenced message', { cause: cause }); })];
                case 2:
                    referenced = _b.sent();
                    return [2 /*return*/, referenced];
            }
        });
    });
}
client.once('ready', function () {
    var _a;
    console.log("Logged in as ".concat((_a = client.user) === null || _a === void 0 ? void 0 : _a.tag));
    console.log('MessageContent intent is intentionally NOT requested.');
    console.log('Now create a thread from a message, then mention this bot inside the thread.');
});
client.on('messageCreate', function (message) { return __awaiter(void 0, void 0, void 0, function () {
    var referenced, starter, parentMessage, report;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (message.author.bot)
                    return [2 /*return*/];
                console.log('\nReceived message:');
                console.log(JSON.stringify(summarizeMessage(message), null, 2));
                return [4 /*yield*/, fetchReferencedMessage(message)];
            case 1:
                referenced = _a.sent();
                console.log(formatSummary('reply reference fetch result', referenced));
                if (!!message.channel.isThread()) return [3 /*break*/, 3];
                console.log('Message is not in a thread, skipping starter fetch.');
                return [4 /*yield*/, message.reply(formatSummary('reply reference fetch result', referenced)).catch(function (cause) {
                        console.error(new Error('Failed to reply with probe result', { cause: cause }).message);
                    })];
            case 2:
                _a.sent();
                return [2 /*return*/];
            case 3:
                console.log('Thread info:');
                console.log(JSON.stringify({
                    threadId: message.channel.id,
                    threadName: message.channel.name,
                    parentId: message.channel.parentId,
                }, null, 2));
                return [4 /*yield*/, fetchThreadStarter(message.channel)];
            case 4:
                starter = _a.sent();
                if (starter instanceof Error) {
                    console.log(starter.message);
                }
                else {
                    console.log('fetchStarterMessage result:');
                    console.log(JSON.stringify(summarizeMessage(starter), null, 2));
                }
                return [4 /*yield*/, fetchParentMessageByThreadId(message.channel)];
            case 5:
                parentMessage = _a.sent();
                if (parentMessage instanceof Error)
                    console.log(parentMessage.message);
                if (!(parentMessage instanceof Error)) {
                    console.log('parent.messages.fetch(thread.id) result:');
                    console.log(JSON.stringify(summarizeMessage(parentMessage), null, 2));
                }
                report = [
                    'Message content probe result',
                    formatSummary('received message', message),
                    formatSummary('reply reference fetch result', referenced),
                    formatSummary('fetchStarterMessage result', starter),
                    formatSummary('parent.messages.fetch(thread.id) result', parentMessage),
                ].join('\n\n');
                return [4 /*yield*/, message.reply(report.slice(0, 1900)).catch(function (cause) {
                        console.error(new Error('Failed to reply with probe result', { cause: cause }).message);
                    })];
            case 6:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
var loginResult = await client
    .login(token)
    .catch(function (cause) { return new Error('Discord login failed', { cause: cause }); });
if (loginResult instanceof Error) {
    console.error(loginResult.message);
    process.exit(1);
}
