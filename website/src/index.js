"use strict";
// Cloudflare Worker entrypoint for the Kimaki website.
// Handles Discord OAuth bot install via better-auth and onboarding status polling.
//
// Uses Hyperdrive for pooled DB connections (env.HYPERDRIVE binding).
// Each request gets a fresh PrismaClient and betterAuth instance
// because CF Workers cannot reuse connections across requests.
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.app = exports.SlackBridgeDO = void 0;
require("./globals.css");
var zod_1 = require("zod");
var marked_1 = require("marked");
var spiceflow_1 = require("spiceflow");
var react_1 = require("spiceflow/react");
var src_1 = require("db/src");
var webhook_team_id_1 = require("discord-slack-bridge/src/webhook-team-id");
var gateway_client_kv_js_1 = require("./gateway-client-kv.js");
var auth_js_1 = require("./auth.js");
var slack_bridge_do_js_1 = require("./slack-bridge-do.js");
Object.defineProperty(exports, "SlackBridgeDO", { enumerable: true, get: function () { return slack_bridge_do_js_1.SlackBridgeDO; } });
var slack_install_page_js_1 = require("./slack-install-page.js");
var privacy_policy_md_raw_1 = require("./privacy-policy.md?raw");
var terms_of_service_md_raw_1 = require("./terms-of-service.md?raw");
function PolicyPage(_a) {
    var title = _a.title, description = _a.description, html = _a.html;
    return (<>
      <react_1.Head>
        <react_1.Head.Title>{"Kimaki ".concat(title)}</react_1.Head.Title>
        <react_1.Head.Meta name="description" content={description}/>
      </react_1.Head>

      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-12 md:px-8 md:py-16">
        <article className="flex flex-col gap-8 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm md:p-10">
          <header className="flex flex-col gap-3 border-b border-stone-200 pb-6">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
              Kimaki
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-stone-600 md:text-base">
              {description}
            </p>
          </header>

          <div className="flex flex-col gap-4 text-sm leading-7 text-stone-700 md:text-base [&_a]:text-stone-900 [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded-md [&_code]:bg-stone-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.95em] [&_h1]:hidden [&_h2]:mt-6 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-6 [&_li]:list-disc [&_p]:text-pretty [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2" dangerouslySetInnerHTML={{
            __html: html,
        }}/>
        </article>
      </main>
    </>);
}
var SLACK_OAUTH_CALLBACK_PATH = '/slack/oauth/callback';
var SLACK_INSTALL_SCOPES = [
    'commands',
    'chat:write',
    'chat:write.public',
    'channels:manage',
    'groups:write',
    'channels:read',
    'groups:read',
    'channels:history',
    'groups:history',
    'reactions:write',
    'files:write',
];
exports.app = new spiceflow_1.Spiceflow()
    .state('env', {})
    .layout('/*', function (_a) {
    var children = _a.children;
    return (<html lang="en">
        <react_1.Head>
          <react_1.Head.Meta name="viewport" content="width=device-width, initial-scale=1"/>
        </react_1.Head>
        <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
          {children}
        </body>
      </html>);
})
    .onError(function (_a) {
    var error = _a.error;
    console.error(error);
    var message = error instanceof Error ? error.message : String(error);
    return new Response(message, { status: 500 });
})
    .route({
    method: 'GET',
    path: '/',
    handler: function () {
        return new Response(null, {
            status: 302,
            headers: { Location: 'https://github.com/remorses/kimaki' },
        });
    },
})
    .route({
    method: 'GET',
    path: '/health',
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var prisma, result;
            var state = _b.state;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prisma = (0, src_1.createPrisma)(state.env.HYPERDRIVE.connectionString);
                        return [4 /*yield*/, prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["SELECT 1 as result"], ["SELECT 1 as result"])))];
                    case 1:
                        result = _c.sent();
                        return [2 /*return*/, { status: 'ok', db: result[0].result }];
                }
            });
        });
    },
})
    .page('/install-success', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var url, guildId;
    var _c, _d;
    var request = _b.request;
    return __generator(this, function (_e) {
        url = new URL(request.url);
        guildId = (_d = (_c = url.searchParams.get('guild_id')) !== null && _c !== void 0 ? _c : url.searchParams.get('team_id')) !== null && _d !== void 0 ? _d : undefined;
        return [2 /*return*/, (<>
        <react_1.Head>
          <react_1.Head.Title>Kimaki Bot Installed</react_1.Head.Title>
          <react_1.Head.Meta name="description" content="Kimaki was installed successfully. Return to the terminal to continue onboarding."/>
        </react_1.Head>

        <main className="flex min-h-screen items-center justify-center px-6 py-12">
          <section className="flex w-full max-w-xl flex-col gap-8 rounded-[32px] border border-stone-200 bg-white p-8 shadow-sm md:p-12">
            <div className="flex flex-col gap-4 text-center">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-4xl text-emerald-700">
                <span aria-hidden="true">✓</span>
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-stone-500">
                  Kimaki
                </p>
                <h1 className="text-balance text-4xl font-semibold tracking-tight text-stone-950 md:text-5xl">
                  Bot installed successfully
                </h1>
                <p className="text-pretty text-base leading-7 text-stone-600 md:text-lg">
                  You can close this tab and return to the terminal to finish the
                  setup.
                </p>
              </div>
            </div>

            {guildId ? (<div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-center">
                <p className="text-sm uppercase tracking-[0.16em] text-stone-500">
                  Connected workspace
                </p>
                <p className="mx-auto rounded-xl border border-stone-200 bg-white px-4 py-2 font-mono text-sm text-stone-700">
                  {guildId}
                </p>
              </div>) : null}
          </section>
        </main>
      </>)];
    });
}); })
    // Initiates the Discord bot install flow via better-auth.
    // The CLI opens the browser to this URL with clientId and clientSecret
    // as query params. We call better-auth's signInSocial server-side with
    // these as additionalData, which stores them in the verification table
    // and generates a Discord OAuth URL. The browser is redirected to Discord.
    .route({
    method: 'GET',
    path: '/discord-install',
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var url, clientId, clientSecret, kimakiCallbackUrl, reachableUrl, parsed, parsed, isHttps, isLocalHttp, baseURL, auth, _c, result, headers, redirect, _i, _d, cookie;
            var request = _b.request, state = _b.state;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        url = new URL(request.url);
                        clientId = url.searchParams.get('clientId');
                        clientSecret = url.searchParams.get('clientSecret');
                        kimakiCallbackUrl = url.searchParams.get('kimakiCallbackUrl');
                        reachableUrl = url.searchParams.get('reachableUrl');
                        if (!clientId || !clientSecret) {
                            throw new Response('Missing clientId or clientSecret', { status: 400 });
                        }
                        // Validate reachableUrl: must be https to prevent SSRF / token exfiltration.
                        // The gateway-proxy connects outbound to this URL with Authorization header,
                        // so an attacker-controlled URL would receive the client secret.
                        if (reachableUrl) {
                            try {
                                parsed = new URL(reachableUrl);
                                if (parsed.protocol !== 'https:') {
                                    throw new Response('reachableUrl must use https', { status: 400 });
                                }
                            }
                            catch (e) {
                                if (e instanceof Response) {
                                    throw e;
                                }
                                throw new Response('reachableUrl is not a valid URL', { status: 400 });
                            }
                        }
                        // Early validation: reject non-https callback URLs (http://localhost allowed for dev).
                        // Defense in depth — hooks.after also validates before redirecting.
                        if (kimakiCallbackUrl) {
                            try {
                                parsed = new URL(kimakiCallbackUrl);
                                isHttps = parsed.protocol === 'https:';
                                isLocalHttp = parsed.protocol === 'http:' &&
                                    (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
                                if (!isHttps && !isLocalHttp) {
                                    throw new Response('kimakiCallbackUrl must use https (or http for localhost)', { status: 400 });
                                }
                            }
                            catch (e) {
                                if (e instanceof Response) {
                                    throw e;
                                }
                                throw new Response('kimakiCallbackUrl is not a valid URL', {
                                    status: 400,
                                });
                            }
                        }
                        baseURL = new URL(request.url).origin;
                        auth = (0, auth_js_1.createAuth)({ env: state.env, baseURL: baseURL });
                        return [4 /*yield*/, auth.api.signInSocial({
                                body: {
                                    provider: 'discord',
                                    additionalData: {
                                        clientId: clientId,
                                        clientSecret: clientSecret,
                                        kimakiCallbackUrl: kimakiCallbackUrl,
                                        reachableUrl: reachableUrl,
                                    },
                                    callbackURL: '/install-success',
                                },
                                headers: request.headers,
                                returnHeaders: true,
                            })];
                    case 1:
                        _c = _e.sent(), result = _c.response, headers = _c.headers;
                        if (!(result === null || result === void 0 ? void 0 : result.url)) {
                            throw new Response('Failed to generate Discord OAuth URL', {
                                status: 500,
                            });
                        }
                        redirect = new Response(null, {
                            status: 302,
                            headers: { Location: result.url },
                        });
                        for (_i = 0, _d = headers.getSetCookie(); _i < _d.length; _i++) {
                            cookie = _d[_i];
                            redirect.headers.append('Set-Cookie', cookie);
                        }
                        return [2 /*return*/, redirect];
                }
            });
        });
    },
})
    .layout('/slack-install', function (_a) {
    var children = _a.children;
    return (<>
        <react_1.Head>
          <react_1.Head.Title>Kimaki - Connect to Slack</react_1.Head.Title>
        </react_1.Head>
        <div className="flex min-h-screen items-center justify-center bg-white font-sans antialiased">
          {children}
        </div>
      </>);
})
    .page('/slack-install', function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var params;
    var _c;
    var request = _b.request;
    return __generator(this, function (_d) {
        params = zod_1.z
            .object({
            clientId: zod_1.z.string(),
            clientSecret: zod_1.z.string(),
            kimakiCallbackUrl: zod_1.z.string().nullish(),
        })
            .safeParse(Object.fromEntries(new URL(request.url).searchParams));
        if (!params.success) {
            return [2 /*return*/, <p className="text-red-600 text-sm">Missing clientId or clientSecret</p>];
        }
        return [2 /*return*/, (<slack_install_page_js_1.SlackInstallPage clientId={params.data.clientId} clientSecret={params.data.clientSecret} kimakiCallbackUrl={(_c = params.data.kimakiCallbackUrl) !== null && _c !== void 0 ? _c : null}/>)];
    });
}); })
    // Resolves a Slack workspace domain to a team ID using the undocumented
    // auth.findTeam API (no auth required). Used by the /slack-install page
    // to add &team= to the OAuth URL so Slack pre-selects the workspace.
    .route({
    method: 'GET',
    path: '/slack-install/resolve',
    query: zod_1.z.object({
        domain: zod_1.z.string(),
    }),
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var domain, findTeamResult, data;
            var query = _b.query;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        domain = query.domain.trim().toLowerCase();
                        return [4 /*yield*/, fetch("https://slack.com/api/auth.findTeam?domain=".concat(encodeURIComponent(domain))).catch(function (cause) {
                                return new Error('Failed to contact Slack API', { cause: cause });
                            })];
                    case 1:
                        findTeamResult = _c.sent();
                        if (findTeamResult instanceof Error) {
                            return [2 /*return*/, { ok: false, error: 'Failed to contact Slack' }];
                        }
                        return [4 /*yield*/, findTeamResult.json()];
                    case 2:
                        data = (_c.sent());
                        if (!data.ok || !data.team_id) {
                            return [2 /*return*/, { ok: false, error: 'Workspace not found' }];
                        }
                        return [2 /*return*/, { ok: true, teamId: data.team_id, teamName: data.team_name }];
                }
            });
        });
    },
})
    // Persists the KV install state and redirects to Slack OAuth with &team=
    // to pre-select the workspace. This is the redirect endpoint called by
    // the client form after resolving the workspace domain.
    .route({
    method: 'GET',
    path: '/slack-install/start',
    query: zod_1.z.object({
        clientId: zod_1.z.string(),
        clientSecret: zod_1.z.string(),
        kimakiCallbackUrl: zod_1.z.string().optional(),
        team: zod_1.z.string().optional(),
    }),
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var oauthState, persistStateResult, baseUrl, authorizeUrl;
            var _c;
            var query = _b.query, request = _b.request, state = _b.state;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (query.kimakiCallbackUrl && !(0, auth_js_1.parseAllowedCallbackUrl)(query.kimakiCallbackUrl)) {
                            throw new Response('kimakiCallbackUrl must use https (or http for localhost)', { status: 400 });
                        }
                        oauthState = crypto.randomUUID();
                        return [4 /*yield*/, (0, gateway_client_kv_js_1.setSlackInstallStateInKv)({
                                kv: state.env.GATEWAY_CLIENT_KV,
                                state: oauthState,
                                record: {
                                    kimaki_client_id: query.clientId,
                                    kimaki_client_secret: query.clientSecret,
                                    kimaki_callback_url: (_c = query.kimakiCallbackUrl) !== null && _c !== void 0 ? _c : null,
                                },
                            }).catch(function (cause) {
                                return new Error('Failed to persist Slack install state', { cause: cause });
                            })];
                    case 1:
                        persistStateResult = _d.sent();
                        if (persistStateResult instanceof Error) {
                            throw new Response(persistStateResult.message, { status: 500 });
                        }
                        baseUrl = new URL(request.url).origin;
                        authorizeUrl = new URL('https://slack.com/oauth/v2/authorize');
                        authorizeUrl.searchParams.set('client_id', state.env.SLACK_CLIENT_ID);
                        authorizeUrl.searchParams.set('scope', SLACK_INSTALL_SCOPES.join(','));
                        authorizeUrl.searchParams.set('redirect_uri', new URL(SLACK_OAUTH_CALLBACK_PATH, baseUrl).toString());
                        authorizeUrl.searchParams.set('state', oauthState);
                        if (query.team) {
                            authorizeUrl.searchParams.set('team', query.team);
                        }
                        return [2 /*return*/, new Response(null, {
                                status: 302,
                                headers: { Location: authorizeUrl.toString() },
                            })];
                }
            });
        });
    },
})
    .route({
    method: 'GET',
    path: SLACK_OAUTH_CALLBACK_PATH,
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var url, error, code, oauthState, installState, redirectUri, slackAccessResponse, slackAccessPayload, teamId, botToken, prisma, upsertResult, updateRowsResult, callbackUrl, successUrl;
            var _c, _d;
            var request = _b.request, state = _b.state;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        url = new URL(request.url);
                        error = url.searchParams.get('error');
                        if (error) {
                            throw new Response("Slack install failed: ".concat(error), { status: 400 });
                        }
                        code = url.searchParams.get('code');
                        oauthState = url.searchParams.get('state');
                        if (!code || !oauthState) {
                            throw new Response('Missing Slack OAuth code or state', { status: 400 });
                        }
                        return [4 /*yield*/, (0, gateway_client_kv_js_1.getSlackInstallStateFromKv)({
                                kv: state.env.GATEWAY_CLIENT_KV,
                                state: oauthState,
                            }).catch(function (cause) {
                                return new Error('Failed to read Slack install state', { cause: cause });
                            })];
                    case 1:
                        installState = _e.sent();
                        if (installState instanceof Error) {
                            throw new Response(installState.message, { status: 500 });
                        }
                        if (!installState) {
                            throw new Response('Slack install state expired or was not found', {
                                status: 400,
                            });
                        }
                        return [4 /*yield*/, (0, gateway_client_kv_js_1.deleteSlackInstallStateInKv)({
                                kv: state.env.GATEWAY_CLIENT_KV,
                                state: oauthState,
                            }).catch(function () {
                                return undefined;
                            })];
                    case 2:
                        _e.sent();
                        redirectUri = new URL(SLACK_OAUTH_CALLBACK_PATH, new URL(request.url).origin).toString();
                        return [4 /*yield*/, fetch('https://slack.com/api/oauth.v2.access', {
                                method: 'POST',
                                headers: {
                                    Authorization: "Basic ".concat(btoa("".concat(state.env.SLACK_CLIENT_ID, ":").concat(state.env.SLACK_CLIENT_SECRET))),
                                    'content-type': 'application/x-www-form-urlencoded',
                                },
                                body: new URLSearchParams({
                                    code: code,
                                    redirect_uri: redirectUri,
                                }),
                            }).catch(function (cause) {
                                return new Error('Failed to exchange Slack OAuth code', { cause: cause });
                            })];
                    case 3:
                        slackAccessResponse = _e.sent();
                        if (slackAccessResponse instanceof Error) {
                            throw new Response(slackAccessResponse.message, { status: 500 });
                        }
                        return [4 /*yield*/, slackAccessResponse
                                .json()
                                .catch(function (cause) {
                                return new Error('Failed to parse Slack OAuth response', { cause: cause });
                            })];
                    case 4:
                        slackAccessPayload = _e.sent();
                        if (slackAccessPayload instanceof Error) {
                            throw new Response(slackAccessPayload.message, { status: 500 });
                        }
                        if (!isSlackOAuthAccessResponse(slackAccessPayload)) {
                            throw new Response('Slack OAuth response had an unexpected shape', {
                                status: 500,
                            });
                        }
                        if (!slackAccessPayload.ok) {
                            throw new Response("Slack OAuth exchange failed: ".concat((_c = slackAccessPayload.error) !== null && _c !== void 0 ? _c : 'unknown_error'), { status: 400 });
                        }
                        teamId = (_d = slackAccessPayload.team) === null || _d === void 0 ? void 0 : _d.id;
                        botToken = slackAccessPayload.access_token;
                        if (!(teamId && botToken)) {
                            throw new Response('Slack OAuth response missing team.id or access_token', { status: 500 });
                        }
                        prisma = (0, src_1.createPrisma)(state.env.HYPERDRIVE.connectionString);
                        return [4 /*yield*/, (0, gateway_client_kv_js_1.upsertGatewayClientAndRefreshKv)({
                                env: state.env,
                                clientId: installState.kimaki_client_id,
                                secret: installState.kimaki_client_secret,
                                guildId: teamId,
                                platform: 'slack',
                                botToken: botToken,
                            })];
                    case 5:
                        upsertResult = _e.sent();
                        if (upsertResult instanceof Error) {
                            throw new Response(upsertResult.message, { status: 500 });
                        }
                        return [4 /*yield*/, prisma.gateway_clients
                                .updateMany({
                                where: {
                                    guild_id: teamId,
                                    platform: 'slack',
                                },
                                data: {
                                    bot_token: botToken,
                                },
                            })
                                .catch(function (cause) {
                                return new Error('Failed to refresh Slack bot tokens for team', {
                                    cause: cause,
                                });
                            })];
                    case 6:
                        updateRowsResult = _e.sent();
                        if (updateRowsResult instanceof Error) {
                            throw new Response(updateRowsResult.message, { status: 500 });
                        }
                        callbackUrl = (0, auth_js_1.parseAllowedCallbackUrl)(installState.kimaki_callback_url);
                        if (callbackUrl) {
                            callbackUrl.searchParams.set('guild_id', teamId);
                            callbackUrl.searchParams.set('team_id', teamId);
                            callbackUrl.searchParams.set('client_id', installState.kimaki_client_id);
                            return [2 /*return*/, new Response(null, {
                                    status: 302,
                                    headers: { Location: callbackUrl.toString() },
                                })];
                        }
                        successUrl = new URL('/install-success', new URL(request.url).origin);
                        successUrl.searchParams.set('guild_id', teamId);
                        successUrl.searchParams.set('team_id', teamId);
                        return [2 /*return*/, new Response(null, {
                                status: 302,
                                headers: { Location: successUrl.toString() },
                            })];
                }
            });
        });
    },
})
    .page('/privacy', function () { return __awaiter(void 0, void 0, void 0, function () {
    var privacyPolicyHtml;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, marked_1.marked.parse(privacy_policy_md_raw_1.default)];
            case 1:
                privacyPolicyHtml = _a.sent();
                return [2 /*return*/, (<PolicyPage title="Privacy Policy" description="This page explains what Kimaki processes when you use the shared bot, onboarding website, and related integrations." html={privacyPolicyHtml}/>)];
        }
    });
}); })
    .page('/terms', function () { return __awaiter(void 0, void 0, void 0, function () {
    var termsOfServiceHtml;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, marked_1.marked.parse(terms_of_service_md_raw_1.default)];
            case 1:
                termsOfServiceHtml = _a.sent();
                return [2 /*return*/, (<PolicyPage title="Terms of Service" description="These terms govern use of Kimaki, the shared bot, onboarding pages, and related integrations." html={termsOfServiceHtml}/>)];
        }
    });
}); })
    .route({
    method: 'GET',
    path: '/terms-of-service',
    handler: function (_a) {
        var request = _a.request;
        return new Response(null, {
            status: 302,
            headers: {
                Location: new URL('/terms', request.url).toString(),
            },
        });
    },
})
    // Slack gateway: Discord REST proxy → Durable Object
    // Only active on slack-gateway.* hosts.
    .route({
    method: '*',
    path: '/api/v10/*',
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var clientIdResult, clientId, stub, url, response, _c, _d;
            var _e;
            var request = _b.request, state = _b.state;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!isSlackGatewayHost(request.url)) {
                            return [2 /*return*/, new Response('Not Found', { status: 404 })];
                        }
                        clientIdResult = getClientIdFromAuthorizationHeader(request.headers);
                        if (clientIdResult instanceof Error) {
                            return [2 /*return*/, new Response(JSON.stringify({ error: clientIdResult.message }), {
                                    status: 401,
                                    headers: { 'Content-Type': 'application/json' },
                                })];
                        }
                        clientId = clientIdResult;
                        stub = state.env.SLACK_GATEWAY.getByName(clientId);
                        url = new URL(request.url);
                        _d = (_c = stub).handleDiscordRest;
                        _e = {
                            clientId: clientId,
                            url: request.url,
                            path: url.pathname,
                            method: request.method,
                            headers: headersToPairs(request.headers)
                        };
                        return [4 /*yield*/, request.text()];
                    case 1: return [4 /*yield*/, _d.apply(_c, [(_e.body = _f.sent(),
                                _e)])];
                    case 2:
                        response = _f.sent();
                        return [2 /*return*/, toResponse(response)];
                }
            });
        });
    },
})
    .route({
    method: 'POST',
    path: '/slack/events',
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var body, contentType, teamId, clientIdsResult, fanoutResults, rejectedResults, fulfilledResults, successfulResult, failedResponse;
            var _this = this;
            var request = _b.request, state = _b.state;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!isSlackGatewayHost(request.url)) {
                            return [2 /*return*/, new Response('Not Found', { status: 404 })];
                        }
                        return [4 /*yield*/, request.text()];
                    case 1:
                        body = _c.sent();
                        contentType = request.headers.get('content-type') || undefined;
                        teamId = (0, webhook_team_id_1.getTeamIdForWebhookEvent)({
                            body: body,
                            contentType: contentType,
                        });
                        if (!teamId) {
                            console.error('[slack-webhook-team-id-missing]', {
                                path: new URL(request.url).pathname,
                                contentType: contentType || '',
                                bodySummary: summarizeSlackWebhookBodyForLogs({
                                    body: body,
                                    contentType: contentType,
                                }),
                            });
                            return [2 /*return*/, new Response(JSON.stringify({
                                    error: 'Could not resolve Slack team_id from webhook payload',
                                }), { status: 400, headers: { 'Content-Type': 'application/json' } })];
                        }
                        return [4 /*yield*/, resolveClientIdsForTeamId({
                                teamId: teamId,
                                env: state.env,
                            })];
                    case 2:
                        clientIdsResult = _c.sent();
                        if (clientIdsResult instanceof Error) {
                            return [2 /*return*/, new Response(JSON.stringify({ error: clientIdsResult.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })];
                        }
                        if (clientIdsResult.length === 0) {
                            return [2 /*return*/, new Response(JSON.stringify({ error: 'No clients found for Slack team_id' }), { status: 404, headers: { 'Content-Type': 'application/json' } })];
                        }
                        return [4 /*yield*/, Promise.allSettled(clientIdsResult.map(function (clientId) { return __awaiter(_this, void 0, void 0, function () {
                                var stub, response;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            stub = state.env.SLACK_GATEWAY.getByName(clientId);
                                            return [4 /*yield*/, stub.handleSlackWebhook({
                                                    clientId: clientId,
                                                    url: request.url,
                                                    path: new URL(request.url).pathname,
                                                    method: request.method,
                                                    headers: headersToPairs(request.headers),
                                                    body: body,
                                                })];
                                        case 1:
                                            response = _a.sent();
                                            return [2 /*return*/, {
                                                    clientId: clientId,
                                                    response: response,
                                                }];
                                    }
                                });
                            }); }))];
                    case 3:
                        fanoutResults = _c.sent();
                        rejectedResults = fanoutResults.filter(function (result) {
                            return result.status === 'rejected';
                        });
                        if (rejectedResults.length > 0) {
                            console.error('[slack-webhook-fanout-rejected]', {
                                teamId: teamId,
                                rejectedCount: rejectedResults.length,
                                totalClients: clientIdsResult.length,
                                reasons: rejectedResults.map(function (result) {
                                    return summarizeErrorReason(result.reason);
                                }),
                            });
                        }
                        fulfilledResults = fanoutResults.flatMap(function (result) {
                            if (result.status !== 'fulfilled') {
                                return [];
                            }
                            return [result.value];
                        });
                        successfulResult = fulfilledResults.find(function (result) {
                            return result.response.status < 400;
                        });
                        if (successfulResult) {
                            return [2 /*return*/, toResponse(successfulResult.response)];
                        }
                        failedResponse = fulfilledResults.find(function (result) {
                            return result.response.status >= 400;
                        });
                        if (failedResponse) {
                            return [2 /*return*/, toResponse(failedResponse.response)];
                        }
                        return [2 /*return*/, new Response(JSON.stringify({
                                error: 'Failed to fan out Slack webhook to client durable objects',
                            }), { status: 502, headers: { 'Content-Type': 'application/json' } })];
                }
            });
        });
    },
})
    .route({
    method: '*',
    path: '/slack/gateway',
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var url, clientId;
            var request = _b.request, state = _b.state;
            return __generator(this, function (_c) {
                if (!isSlackGatewayHost(request.url)) {
                    return [2 /*return*/, new Response('Not Found', { status: 404 })];
                }
                url = new URL(request.url);
                clientId = url.searchParams.get('clientId');
                if (!clientId) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing clientId query parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } })];
                }
                return [2 /*return*/, proxyGatewayToDurableObject({
                        request: request,
                        clientId: clientId,
                        stub: state.env.SLACK_GATEWAY.getByName(clientId),
                    })];
            });
        });
    },
})
    .route({
    method: '*',
    path: '/slack/gateway/*',
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var url, clientId;
            var request = _b.request, state = _b.state;
            return __generator(this, function (_c) {
                if (!isSlackGatewayHost(request.url)) {
                    return [2 /*return*/, new Response('Not Found', { status: 404 })];
                }
                url = new URL(request.url);
                clientId = url.searchParams.get('clientId');
                if (!clientId) {
                    return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing clientId query parameter' }), { status: 400, headers: { 'Content-Type': 'application/json' } })];
                }
                return [2 /*return*/, proxyGatewayToDurableObject({
                        request: request,
                        clientId: clientId,
                        stub: state.env.SLACK_GATEWAY.getByName(clientId),
                    })];
            });
        });
    },
})
    // Mount better-auth handler for auth routes (GET and POST only).
    // Handles /api/auth/callback/discord (OAuth callback) and other
    // better-auth endpoints (session management, etc.).
    .route({
    method: 'GET',
    path: '/api/auth/*',
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var baseURL, auth;
            var request = _b.request, state = _b.state;
            return __generator(this, function (_c) {
                baseURL = new URL(request.url).origin;
                auth = (0, auth_js_1.createAuth)({ env: state.env, baseURL: baseURL });
                return [2 /*return*/, auth.handler(request)];
            });
        });
    },
})
    .route({
    method: 'POST',
    path: '/api/auth/*',
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var baseURL, auth;
            var request = _b.request, state = _b.state;
            return __generator(this, function (_c) {
                baseURL = new URL(request.url).origin;
                auth = (0, auth_js_1.createAuth)({ env: state.env, baseURL: baseURL });
                return [2 /*return*/, auth.handler(request)];
            });
        });
    },
})
    // CLI polling endpoint. The kimaki CLI polls this every 2s during onboarding
    // to check if the user has completed the bot authorization flow.
    // Returns 404 if not ready, 200 with guild_id if the client has been registered.
    .route({
    method: 'GET',
    path: '/api/onboarding/status',
    handler: function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var url, clientId, secret, prisma, row, discordUserId, slackUserId;
            var _c, _d, _e, _f;
            var request = _b.request, state = _b.state;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        url = new URL(request.url);
                        clientId = url.searchParams.get('client_id');
                        secret = url.searchParams.get('secret');
                        if (!clientId || !secret) {
                            return [2 /*return*/, new Response(JSON.stringify({ error: 'Missing client_id or secret' }), { status: 400, headers: { 'Content-Type': 'application/json' } })];
                        }
                        prisma = (0, src_1.createPrisma)(state.env.HYPERDRIVE.connectionString);
                        return [4 /*yield*/, prisma.gateway_clients
                                .findFirst({
                                where: { client_id: clientId, secret: secret },
                                include: {
                                    user: {
                                        include: {
                                            accounts: {
                                                where: {
                                                    providerId: {
                                                        in: ['discord', 'slack'],
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            })
                                .catch(function (cause) {
                                return new Error('Failed to lookup gateway client', { cause: cause });
                            })];
                    case 1:
                        row = _g.sent();
                        if (row instanceof Error) {
                            return [2 /*return*/, new Response(JSON.stringify({ error: row.message }), {
                                    status: 500,
                                    headers: { 'Content-Type': 'application/json' },
                                })];
                        }
                        if (!row) {
                            return [2 /*return*/, new Response(JSON.stringify({ error: 'Not found' }), {
                                    status: 404,
                                    headers: { 'Content-Type': 'application/json' },
                                })];
                        }
                        discordUserId = (_d = (_c = row.user) === null || _c === void 0 ? void 0 : _c.accounts.find(function (account) {
                            return account.providerId === 'discord';
                        })) === null || _d === void 0 ? void 0 : _d.accountId;
                        slackUserId = (_f = (_e = row.user) === null || _e === void 0 ? void 0 : _e.accounts.find(function (account) {
                            return account.providerId === 'slack';
                        })) === null || _f === void 0 ? void 0 : _f.accountId;
                        return [2 /*return*/, {
                                guild_id: row.guild_id,
                                team_id: row.platform === 'slack' ? row.guild_id : undefined,
                                discord_user_id: discordUserId,
                                slack_user_id: slackUserId,
                            }];
                }
            });
        });
    },
});
exports.default = {
    fetch: function (request, env) {
        return exports.app.handle(request, { state: { env: env } });
    },
    // Re-exported here so Vite's tree-shaker keeps the class in the bundle.
    // Cloudflare Workers requires DO classes to be exported from the entry.
    SlackBridgeDO: slack_bridge_do_js_1.SlackBridgeDO,
};
function toResponse(response) {
    return new Response(response.body, {
        status: response.status,
        headers: new Headers(normalizeHeaderPairs(response.headers)),
    });
}
function proxyGatewayToDurableObject(_a) {
    var request = _a.request, clientId = _a.clientId, stub = _a.stub;
    var url = new URL(request.url);
    var rewrittenPath = "".concat(url.pathname).concat(url.search);
    var durableObjectUrl = new URL(rewrittenPath, 'https://do.local');
    return stub.fetch(new Request(durableObjectUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: request.redirect,
        signal: request.signal,
    }));
}
function getClientIdFromAuthorizationHeader(headers) {
    var authorizationHeader = headers.get('authorization');
    if (!authorizationHeader) {
        return new Error('Missing authorization header');
    }
    var token = authorizationHeader.trim().split(/\s+/).at(-1);
    if (!token) {
        return new Error('Missing authorization token');
    }
    var tokenParts = token.split(':');
    if (tokenParts.length !== 2) {
        return new Error('Expected gateway token in clientId:secret format');
    }
    var clientId = tokenParts[0];
    if (!clientId) {
        return new Error('Malformed gateway token: missing clientId');
    }
    return clientId;
}
function resolveClientIdsForTeamId(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var cachedClientIds, error_1, prisma, rows, seenClientIds, uniqueClientIds, error_2;
        var teamId = _b.teamId, env = _b.env;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, gateway_client_kv_js_1.getTeamClientIdsFromKv)({
                            teamId: teamId,
                            kv: env.GATEWAY_CLIENT_KV,
                        })];
                case 1:
                    cachedClientIds = _c.sent();
                    if (cachedClientIds) {
                        return [2 /*return*/, cachedClientIds];
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _c.sent();
                    console.warn('[slack-team-client-cache-read-failed]', {
                        teamId: teamId,
                        reason: summarizeErrorReason(error_1),
                    });
                    return [3 /*break*/, 3];
                case 3:
                    prisma = (0, src_1.createPrisma)(env.HYPERDRIVE.connectionString);
                    return [4 /*yield*/, prisma.gateway_clients
                            .findMany({
                            // In Slack bridge mode, gateway_clients.guild_id stores Slack team_id.
                            // We intentionally reuse the same column to avoid a separate mapping table.
                            where: { guild_id: teamId },
                            orderBy: [{ updated_at: 'desc' }, { created_at: 'desc' }],
                        })
                            .catch(function (cause) {
                            return new Error('Failed to resolve client IDs for Slack team_id', {
                                cause: cause,
                            });
                        })];
                case 4:
                    rows = _c.sent();
                    if (rows instanceof Error) {
                        return [2 /*return*/, rows];
                    }
                    seenClientIds = new Set();
                    uniqueClientIds = [];
                    rows.forEach(function (row) {
                        if (seenClientIds.has(row.client_id)) {
                            return;
                        }
                        seenClientIds.add(row.client_id);
                        uniqueClientIds.push(row.client_id);
                    });
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, (0, gateway_client_kv_js_1.setTeamClientIdsInKv)({
                            kv: env.GATEWAY_CLIENT_KV,
                            teamId: teamId,
                            clientIds: uniqueClientIds,
                        })];
                case 6:
                    _c.sent();
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _c.sent();
                    console.warn('[slack-team-client-cache-write-failed]', {
                        teamId: teamId,
                        reason: summarizeErrorReason(error_2),
                    });
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/, uniqueClientIds];
            }
        });
    });
}
function summarizeSlackWebhookBodyForLogs(_a) {
    var _b;
    var body = _a.body, contentType = _a.contentType;
    var normalizedContentType = (_b = contentType === null || contentType === void 0 ? void 0 : contentType.toLowerCase()) !== null && _b !== void 0 ? _b : '';
    if (normalizedContentType.includes('application/x-www-form-urlencoded')) {
        var params = new URLSearchParams(body);
        var paramKeys = __spreadArray([], new Set(__spreadArray([], params.keys(), true)), true);
        if (params.has('payload')) {
            var payload = params.get('payload');
            if (payload) {
                try {
                    var parsedPayload = JSON.parse(payload);
                    if (parsedPayload && typeof parsedPayload === 'object') {
                        return {
                            format: 'form-urlencoded-payload-json',
                            paramKeys: paramKeys,
                            payloadKeys: Object.keys(parsedPayload),
                        };
                    }
                }
                catch (_c) {
                    return {
                        format: 'form-urlencoded-payload-invalid-json',
                        paramKeys: paramKeys,
                    };
                }
            }
        }
        return {
            format: 'form-urlencoded',
            paramKeys: paramKeys,
        };
    }
    try {
        var parsedBody = JSON.parse(body);
        if (parsedBody && typeof parsedBody === 'object') {
            return {
                format: 'json',
                payloadKeys: Object.keys(parsedBody),
            };
        }
        return {
            format: 'json-non-object',
            valueType: typeof parsedBody,
        };
    }
    catch (_d) {
        return {
            format: 'unknown',
            bodyLength: body.length,
        };
    }
}
function summarizeErrorReason(reason) {
    if (reason instanceof Error) {
        return "".concat(reason.name, ": ").concat(reason.message);
    }
    return String(reason);
}
function isSlackGatewayHost(requestUrl) {
    var host = new URL(requestUrl).host.toLowerCase();
    var isGatewayHost = host === 'slack-gateway.kimaki.dev' ||
        host === 'preview-slack-gateway.kimaki.dev' ||
        host === 'slack-gateway.kimaki.xyz' ||
        host === 'preview-slack-gateway.kimaki.xyz';
    console.log('[slack-gateway-host-check]', {
        host: host,
        requestUrl: requestUrl,
        isGatewayHost: isGatewayHost,
    });
    return isGatewayHost;
}
function headersToPairs(headers) {
    var result = [];
    headers.forEach(function (value, key) {
        result.push([key, value]);
    });
    return result;
}
function normalizeHeaderPairs(headers) {
    return headers
        .filter(function (pair) {
        return pair.length === 2;
    })
        .map(function (_a) {
        var key = _a[0], value = _a[1];
        return [key, value];
    });
}
function isSlackOAuthAccessResponse(value) {
    if (!isRecord(value)) {
        return false;
    }
    if (value.ok === false) {
        return value.error === undefined || typeof value.error === 'string';
    }
    if (value.ok !== true) {
        return false;
    }
    if (typeof value.access_token !== 'string') {
        return false;
    }
    var team = value.team;
    if (team !== undefined && !isOptionalIdRecord(team)) {
        return false;
    }
    var authedUser = value.authed_user;
    if (authedUser !== undefined && !isOptionalIdRecord(authedUser)) {
        return false;
    }
    return true;
}
function isOptionalIdRecord(value) {
    if (!isRecord(value)) {
        return false;
    }
    return ((value.id === undefined || typeof value.id === 'string') &&
        (value.access_token === undefined || typeof value.access_token === 'string'));
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
var templateObject_1;
