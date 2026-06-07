#!/usr/bin/env tsx
"use strict";
// Script that probes Discord typing request lifetime in a real thread.
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
var goke_1 = require("goke");
var zod_1 = require("zod");
var discord_js_1 = require("discord.js");
var errore = require("errore");
var logger_js_1 = require("../src/logger.js");
var logger = (0, logger_js_1.createLogger)('TYPECHK');
var DEFAULT_GUILD_ID = '1422625037164351591';
var DEFAULT_CHANNEL_ID = '1422625308523102348';
var DEFAULT_MESSAGE_DELAY_MS = 1500;
var DEFAULT_TIMEOUT_MS = 12000;
var DEFAULT_TOKEN_ENV = 'DISCORD_BOT_TOKEN';
var FALLBACK_TOKEN_ENVS = [
    'DISCORD_BOT_TOKEN',
    'KIMAKI_BOT_TOKEN',
    'BOT_TOKEN',
    'TOKEN',
];
var cli = (0, goke_1.goke)('validate-typing-indicator');
cli
    .command('', 'Create a real Discord thread and measure how long discord.js sendTyping() stays pending.')
    .option('--guild-id [guild-id]', zod_1.z.string().default(DEFAULT_GUILD_ID).describe('Guild ID that owns the target text channel.'))
    .option('--channel-id [channel-id]', zod_1.z.string().default(DEFAULT_CHANNEL_ID).describe('Text channel ID where the probe thread will be created.'))
    .option('--token-env [token-env]', zod_1.z.string().default(DEFAULT_TOKEN_ENV).describe('Environment variable that contains the Discord bot token. Falls back to common Discord token env names when this one is missing.'))
    .option('--message-delay-ms [message-delay-ms]', zod_1.z.number().default(DEFAULT_MESSAGE_DELAY_MS).describe('Delay before the follow-up bot message in the second probe.'))
    .option('--timeout-ms [timeout-ms]', zod_1.z.number().default(DEFAULT_TIMEOUT_MS).describe('How long to wait before treating a typing request as still pending.'))
    .option('--keep-thread', 'Keep the probe thread open instead of archiving it after the run finishes.')
    .example('# Run with the package script (Doppler is already included)')
    .example('pnpm validate-typing-indicator')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var token, client, loginResult, textChannel, thread_1, typingOnly, typingThenMessage, archiveResult;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                token = getToken({ tokenEnv: options.tokenEnv });
                if (token instanceof Error) {
                    throw token;
                }
                client = new discord_js_1.Client({
                    intents: [
                        discord_js_1.GatewayIntentBits.Guilds,
                        discord_js_1.GatewayIntentBits.GuildMessages,
                    ],
                });
                _a.label = 1;
            case 1:
                _a.trys.push([1, , 9, 10]);
                return [4 /*yield*/, errore.tryAsync(function () {
                        return client.login(token);
                    })];
            case 2:
                loginResult = _a.sent();
                if (loginResult instanceof Error) {
                    throw new Error('Failed to login Discord client', { cause: loginResult });
                }
                return [4 /*yield*/, resolveTextChannel({
                        client: client,
                        guildId: options.guildId,
                        channelId: options.channelId,
                    })];
            case 3:
                textChannel = _a.sent();
                if (textChannel instanceof Error) {
                    throw textChannel;
                }
                return [4 /*yield*/, createProbeThread({
                        textChannel: textChannel,
                        guildId: options.guildId,
                    })];
            case 4:
                thread_1 = _a.sent();
                if (thread_1 instanceof Error) {
                    throw thread_1;
                }
                logger.log("Probe thread: https://discord.com/channels/".concat(options.guildId, "/").concat(thread_1.id));
                return [4 /*yield*/, measureTypingRequest({
                        thread: thread_1,
                        label: 'typing-only',
                        timeoutMs: options.timeoutMs,
                    })];
            case 5:
                typingOnly = _a.sent();
                logProbeOutcome({ outcome: typingOnly });
                return [4 /*yield*/, measureTypingRequest({
                        thread: thread_1,
                        label: 'typing-then-message',
                        timeoutMs: options.timeoutMs,
                        followupMessageDelayMs: options.messageDelayMs,
                    })];
            case 6:
                typingThenMessage = _a.sent();
                logProbeOutcome({ outcome: typingThenMessage });
                if (!!options.keepThread) return [3 /*break*/, 8];
                return [4 /*yield*/, errore.tryAsync(function () {
                        return thread_1.setArchived(true, 'Completed typing indicator probe');
                    })];
            case 7:
                archiveResult = _a.sent();
                if (archiveResult instanceof Error) {
                    logger.warn('Failed to archive probe thread', archiveResult.message);
                }
                _a.label = 8;
            case 8: return [3 /*break*/, 10];
            case 9:
                client.destroy();
                return [7 /*endfinally*/];
            case 10: return [2 /*return*/];
        }
    });
}); });
cli.help();
await cli.parse();
function getToken(_a) {
    var tokenEnv = _a.tokenEnv;
    var token = process.env[tokenEnv];
    if (!token) {
        var fallbackName = FALLBACK_TOKEN_ENVS.find(function (name) {
            return Boolean(process.env[name]);
        });
        if (fallbackName) {
            logger.warn("Missing ".concat(tokenEnv, "; using ").concat(fallbackName, " from environment instead"));
            return process.env[fallbackName] || '';
        }
        return new Error("Missing ".concat(tokenEnv, " environment variable. Also checked ").concat(FALLBACK_TOKEN_ENVS.join(', ')));
    }
    return token;
}
function resolveTextChannel(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channelResult;
        var client = _b.client, guildId = _b.guildId, channelId = _b.channelId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, errore.tryAsync(function () {
                        return client.channels.fetch(channelId);
                    })];
                case 1:
                    channelResult = _c.sent();
                    if (channelResult instanceof Error) {
                        return [2 /*return*/, new Error('Failed to fetch target channel', { cause: channelResult })];
                    }
                    if (!channelResult) {
                        return [2 /*return*/, new Error('Target channel was not found')];
                    }
                    if (channelResult.type !== discord_js_1.ChannelType.GuildText) {
                        return [2 /*return*/, new Error("Target channel is not a guild text channel: ".concat(channelResult.type))];
                    }
                    if (channelResult.guildId !== guildId) {
                        return [2 /*return*/, new Error("Target channel does not belong to guild ".concat(guildId))];
                    }
                    return [2 /*return*/, channelResult];
            }
        });
    });
}
function createProbeThread(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var stamp, seedMessageResult, threadResult;
        var textChannel = _b.textChannel, guildId = _b.guildId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    stamp = new Date().toISOString().replace(/[:.]/g, '-');
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return textChannel.send("Typing probe seed ".concat(stamp));
                        })];
                case 1:
                    seedMessageResult = _c.sent();
                    if (seedMessageResult instanceof Error) {
                        return [2 /*return*/, new Error('Failed to send probe seed message', { cause: seedMessageResult })];
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return seedMessageResult.startThread({
                                name: "typing-probe-".concat(stamp).slice(0, 80),
                                autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneDay,
                                reason: "Typing request lifetime probe for guild ".concat(guildId),
                            });
                        })];
                case 2:
                    threadResult = _c.sent();
                    if (threadResult instanceof Error) {
                        return [2 /*return*/, new Error('Failed to create probe thread', { cause: threadResult })];
                    }
                    return [2 /*return*/, threadResult];
            }
        });
    });
}
function measureTypingRequest(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var startTime, typingPromise, followupAtMsPromise, initialOutcome, followupMessageAtMs, releaseMessageResult, releaseMessageAtMs, releasedOutcome;
        var _this = this;
        var thread = _b.thread, label = _b.label, timeoutMs = _b.timeoutMs, followupMessageDelayMs = _b.followupMessageDelayMs;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    startTime = Date.now();
                    typingPromise = errore.tryAsync(function () {
                        return thread.sendTyping();
                    });
                    followupAtMsPromise = (function () {
                        if (followupMessageDelayMs === undefined) {
                            return Promise.resolve(undefined);
                        }
                        return (function () { return __awaiter(_this, void 0, void 0, function () {
                            var sendResult;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, sleep({ ms: followupMessageDelayMs })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, errore.tryAsync(function () {
                                                return thread.send("Typing probe follow-up for ".concat(label));
                                            })];
                                    case 2:
                                        sendResult = _a.sent();
                                        if (sendResult instanceof Error) {
                                            throw new Error('Failed to send follow-up probe message', { cause: sendResult });
                                        }
                                        return [2 /*return*/, Date.now() - startTime];
                                }
                            });
                        }); })();
                    })();
                    return [4 /*yield*/, Promise.race([
                            typingPromise.then(function (result) {
                                if (result instanceof Error) {
                                    return {
                                        status: 'rejected',
                                        elapsedMs: Date.now() - startTime,
                                        errorMessage: result.message,
                                    };
                                }
                                return {
                                    status: 'resolved',
                                    elapsedMs: Date.now() - startTime,
                                };
                            }),
                            sleep({ ms: timeoutMs }).then(function () {
                                return {
                                    status: 'timeout',
                                    elapsedMs: Date.now() - startTime,
                                };
                            }),
                        ])];
                case 1:
                    initialOutcome = _c.sent();
                    return [4 /*yield*/, followupAtMsPromise];
                case 2:
                    followupMessageAtMs = _c.sent();
                    if (initialOutcome.status !== 'timeout') {
                        return [2 /*return*/, __assign(__assign({ label: label }, initialOutcome), { followupMessageAtMs: followupMessageAtMs })];
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return thread.send("Typing probe release for ".concat(label));
                        })];
                case 3:
                    releaseMessageResult = _c.sent();
                    if (releaseMessageResult instanceof Error) {
                        return [2 /*return*/, __assign(__assign({ label: label }, initialOutcome), { followupMessageAtMs: followupMessageAtMs, errorMessage: releaseMessageResult.message })];
                    }
                    releaseMessageAtMs = Date.now() - startTime;
                    return [4 /*yield*/, Promise.race([
                            typingPromise.then(function (result) {
                                if (result instanceof Error) {
                                    return {
                                        status: 'rejected',
                                        elapsedMs: Date.now() - startTime,
                                        errorMessage: result.message,
                                    };
                                }
                                return {
                                    status: 'released-after-timeout',
                                    elapsedMs: Date.now() - startTime,
                                };
                            }),
                            sleep({ ms: 5000 }).then(function () {
                                return {
                                    status: 'timeout',
                                    elapsedMs: Date.now() - startTime,
                                };
                            }),
                        ])];
                case 4:
                    releasedOutcome = _c.sent();
                    return [2 /*return*/, __assign(__assign({ label: label }, releasedOutcome), { followupMessageAtMs: followupMessageAtMs, releaseMessageAtMs: releaseMessageAtMs })];
            }
        });
    });
}
function logProbeOutcome(_a) {
    var outcome = _a.outcome;
    logger.log([
        "probe=".concat(outcome.label),
        "status=".concat(outcome.status),
        "elapsedMs=".concat(outcome.elapsedMs),
        outcome.followupMessageAtMs !== undefined
            ? "followupMessageAtMs=".concat(outcome.followupMessageAtMs)
            : undefined,
        outcome.releaseMessageAtMs !== undefined
            ? "releaseMessageAtMs=".concat(outcome.releaseMessageAtMs)
            : undefined,
        outcome.errorMessage ? "error=".concat(outcome.errorMessage) : undefined,
    ].filter(isTruthy).join(' '));
}
function isTruthy(value) {
    return Boolean(value);
}
function sleep(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var ms = _b.ms;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, new Promise(function (resolve) {
                        setTimeout(resolve, ms);
                    })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
