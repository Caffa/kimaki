"use strict";
// Per-request better-auth factory for the Cloudflare Worker.
//
// Creates a new betterAuth instance per request because CF Workers cannot
// reuse database connections across requests (Hyperdrive per-request pooling).
//
// Gateway onboarding persistence is handled in hooks.after:
// - reads guild_id from Discord callback query params
// - reads clientId/clientSecret from getOAuthState() additionalData
// - upserts gateway_clients for CLI onboarding polling
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
exports.parseAllowedCallbackUrl = parseAllowedCallbackUrl;
exports.createAuth = createAuth;
// better-auth/minimal excludes kysely (~182 KiB minified) from the bundle.
// Safe because we use the prisma adapter, not direct DB connections.
// See: https://better-auth.com/docs/guides/optimizing-for-performance#bundle-size-optimization
var minimal_1 = require("better-auth/minimal");
var prisma_1 = require("better-auth/adapters/prisma");
var api_1 = require("better-auth/api");
var src_1 = require("db/src");
var gateway_client_kv_js_1 = require("./gateway-client-kv.js");
// Same permissions list used in cli/src/utils.ts generateBotInstallUrl.
// Hardcoded to avoid importing discord-api-types/v10 barrel which adds ~204 KiB
// to the CF Worker bundle (pulls in gateway, payloads, rest, rpc modules).
// Computed from PermissionFlagsBits: ViewChannel | ManageChannels | SendMessages |
// SendMessagesInThreads | CreatePublicThreads | ManageThreads | ReadMessageHistory |
// AddReactions | ManageMessages | UseExternalEmojis | AttachFiles | Connect | Speak |
// ManageRoles | ManageEvents | CreateEvents
var DISCORD_BOT_PERMISSIONS = 17927465446480;
// Validates and parses a callback URL, allowing only https: and http://localhost.
// Returns null for missing, malformed, or disallowed schemes (e.g. javascript:)
// to prevent open redirect attacks through the OAuth flow.
function parseAllowedCallbackUrl(raw) {
    if (!raw) {
        return null;
    }
    var url;
    try {
        url = new URL(raw);
    }
    catch (_a) {
        return null;
    }
    if (url.protocol === 'https:') {
        return url;
    }
    if (url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
        return url;
    }
    return null;
}
function getGuildIdFromRequestUrl(_a) {
    var _b;
    var context = _a.context;
    var requestUrl = (_b = context === null || context === void 0 ? void 0 : context.request) === null || _b === void 0 ? void 0 : _b.url;
    if (!requestUrl) {
        return undefined;
    }
    var guildId = new URL(requestUrl).searchParams.get('guild_id');
    if (!guildId) {
        return undefined;
    }
    return guildId;
}
function createAuth(_a) {
    var _this = this;
    var env = _a.env, baseURL = _a.baseURL;
    var prisma = (0, src_1.createPrisma)(env.HYPERDRIVE.connectionString);
    var auth = (0, minimal_1.betterAuth)({
        database: (0, prisma_1.prismaAdapter)(prisma, { provider: 'postgresql' }),
        secret: env.AUTH_SECRET,
        baseURL: baseURL,
        socialProviders: {
            discord: {
                clientId: env.DISCORD_CLIENT_ID,
                clientSecret: env.DISCORD_CLIENT_SECRET,
                scope: ['bot', 'applications.commands'],
                permissions: DISCORD_BOT_PERMISSIONS,
                getUserInfo: function (token) { return __awaiter(_this, void 0, void 0, function () {
                    var accessToken, res, profile;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                accessToken = token.accessToken;
                                if (!accessToken) {
                                    return [2 /*return*/, null];
                                }
                                return [4 /*yield*/, fetch('https://discord.com/api/v10/users/@me', {
                                        headers: { Authorization: "Bearer ".concat(accessToken) },
                                    })];
                            case 1:
                                res = _b.sent();
                                if (!res.ok) {
                                    return [2 /*return*/, null];
                                }
                                return [4 /*yield*/, res.json()];
                            case 2:
                                profile = _b.sent();
                                return [2 /*return*/, {
                                        user: {
                                            id: profile.id,
                                            name: profile.global_name || profile.username,
                                            email: profile.email,
                                            emailVerified: (_a = profile.verified) !== null && _a !== void 0 ? _a : false,
                                            image: profile.avatar
                                                ? "https://cdn.discordapp.com/avatars/".concat(profile.id, "/").concat(profile.avatar, ".png")
                                                : undefined,
                                        },
                                        data: profile,
                                    }];
                        }
                    });
                }); },
            },
        },
        hooks: {
            after: (0, api_1.createAuthMiddleware)(function (ctx) { return __awaiter(_this, void 0, void 0, function () {
                var guildId, state, kimakiClientId, kimakiClientSecret, reachableUrl, userId, upsertResult, parsedCallback;
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            if (ctx.path !== '/callback/:id') {
                                return [2 /*return*/];
                            }
                            guildId = getGuildIdFromRequestUrl({ context: ctx });
                            if (!guildId) {
                                console.warn('better-auth callback: missing guild_id callback parameter');
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, (0, api_1.getOAuthState)()];
                        case 1:
                            state = _c.sent();
                            kimakiClientId = state === null || state === void 0 ? void 0 : state.clientId;
                            kimakiClientSecret = state === null || state === void 0 ? void 0 : state.clientSecret;
                            if (!kimakiClientId || !kimakiClientSecret) {
                                console.warn('better-auth callback: no clientId/clientSecret in OAuth state');
                                return [2 /*return*/];
                            }
                            reachableUrl = state === null || state === void 0 ? void 0 : state.reachableUrl;
                            userId = (_b = (_a = ctx.context.newSession) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id;
                            if (!userId) {
                                console.warn('better-auth callback: missing user in new session');
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, (0, gateway_client_kv_js_1.upsertGatewayClientAndRefreshKv)({
                                    env: env,
                                    clientId: kimakiClientId,
                                    secret: kimakiClientSecret,
                                    guildId: guildId,
                                    platform: 'discord',
                                    userId: userId,
                                    reachableUrl: reachableUrl,
                                })];
                        case 2:
                            upsertResult = _c.sent();
                            if (upsertResult instanceof Error) {
                                console.error(upsertResult);
                                return [2 /*return*/];
                            }
                            parsedCallback = parseAllowedCallbackUrl(state === null || state === void 0 ? void 0 : state.kimakiCallbackUrl);
                            if (parsedCallback) {
                                parsedCallback.searchParams.set('guild_id', guildId);
                                parsedCallback.searchParams.set('client_id', kimakiClientId);
                                // Use new Response() instead of Response.redirect() because redirect()
                                // creates an immutable response. better-call's toResponse() calls
                                // data.headers.set() to merge headers, which throws on immutable
                                // responses and causes a 500.
                                return [2 /*return*/, new Response(null, {
                                        status: 302,
                                        headers: { Location: parsedCallback.toString() },
                                    })];
                            }
                            return [2 /*return*/];
                    }
                });
            }); }),
        },
    });
    return auth;
}
