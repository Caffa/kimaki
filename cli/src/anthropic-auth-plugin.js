"use strict";
/**
 * Anthropic OAuth authentication plugin for OpenCode.
 *
 * If you're copy-pasting this plugin into your OpenCode config folder,
 * you need to install the runtime dependencies first:
 *
 *   cd ~/.config/opencode
 *   bun init -y
 *   bun add proper-lockfile
 *
 * Handles three concerns:
 * 1. OAuth login + token refresh (PKCE flow against claude.ai)
 * 2. Request/response rewriting (tool names, system prompt, beta headers)
 *    so the Anthropic API treats requests as Claude Code CLI requests.
 * 3. Multi-account OAuth rotation after Anthropic rate-limit/auth failures.
 *
 * Login mode is chosen from environment:
 * - `KIMAKI` set: remote-first pasted callback URL/raw code flow
 * - otherwise: standard localhost auto-complete flow
 *
 * Source references:
 * - https://github.com/badlogic/pi-mono/blob/main/packages/ai/src/utils/oauth/anthropic.ts
 * - https://github.com/badlogic/pi-mono/blob/main/packages/ai/src/providers/anthropic.ts
 */
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
exports.anthropicAuthPlugin = exports.replacer = void 0;
var plugin_logger_js_1 = require("./plugin-logger.js");
var anthropic_auth_state_js_1 = require("./anthropic-auth-state.js");
var anthropic_account_identity_js_1 = require("./anthropic-account-identity.js");
// PKCE (Proof Key for Code Exchange) using Web Crypto API.
// Reference: https://github.com/badlogic/pi-mono/blob/main/packages/ai/src/utils/oauth/pkce.ts
function base64urlEncode(bytes) {
    var binary = "";
    for (var _i = 0, bytes_1 = bytes; _i < bytes_1.length; _i++) {
        var byte = bytes_1[_i];
        binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function generatePKCE() {
    return __awaiter(this, void 0, void 0, function () {
        var verifierBytes, verifier, data, hashBuffer, challenge;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    verifierBytes = new Uint8Array(32);
                    crypto.getRandomValues(verifierBytes);
                    verifier = base64urlEncode(verifierBytes);
                    data = new TextEncoder().encode(verifier);
                    return [4 /*yield*/, crypto.subtle.digest("SHA-256", data)];
                case 1:
                    hashBuffer = _a.sent();
                    challenge = base64urlEncode(new Uint8Array(hashBuffer));
                    return [2 /*return*/, { verifier: verifier, challenge: challenge }];
            }
        });
    });
}
var node_child_process_1 = require("node:child_process");
var node_http_1 = require("node:http");
// --- Constants ---
var CLIENT_ID = (function () {
    var encoded = "OWQxYzI1MGEtZTYxYi00NGQ5LTg4ZWQtNTk0NGQxOTYyZjVl";
    return typeof atob === "function"
        ? atob(encoded)
        : Buffer.from(encoded, "base64").toString("utf8");
})();
var TOKEN_URL = "https://platform.claude.com/v1/oauth/token";
var CREATE_API_KEY_URL = "https://api.anthropic.com/api/oauth/claude_cli/create_api_key";
var CLIENT_DATA_URL = "https://api.anthropic.com/api/oauth/claude_cli/client_data";
var PROFILE_URL = "https://api.anthropic.com/api/oauth/profile";
var CALLBACK_PORT = 53692;
var CALLBACK_PATH = "/callback";
var REDIRECT_URI = "http://localhost:".concat(CALLBACK_PORT).concat(CALLBACK_PATH);
var SCOPES = "org:create_api_key user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload";
var OAUTH_TIMEOUT_MS = 5 * 60 * 1000;
var CLAUDE_CODE_VERSION = "2.1.75";
var CLAUDE_CODE_IDENTITY = "You are Claude Code, Anthropic's official CLI for Claude.";
var OPENCODE_IDENTITY = "You are OpenCode, the best coding agent on the planet.";
// Subagent prompts don't contain OPENCODE_IDENTITY; opencode appends this
// line + an <env> block instead. We strip from here to </env> inclusive.
var SUBAGENT_MODEL_IDENTITY = "You are powered by the model named";
var ENV_CLOSE_TAG = "</env>";
var CLAUDE_CODE_BETA = "claude-code-20250219";
var OAUTH_BETA = "oauth-2025-04-20";
var FINE_GRAINED_TOOL_STREAMING_BETA = "fine-grained-tool-streaming-2025-05-14";
var INTERLEAVED_THINKING_BETA = "interleaved-thinking-2025-05-14";
var TOAST_SESSION_HEADER = "x-kimaki-session-id";
var ANTHROPIC_HOSTS = new Set([
    "api.anthropic.com",
    "claude.ai",
    "console.anthropic.com",
    "platform.claude.com",
]);
var OPENCODE_TO_CLAUDE_CODE_TOOL_NAME = {
    bash: "Bash",
    edit: "Edit",
    glob: "Glob",
    grep: "Grep",
    question: "AskUserQuestion",
    read: "Read",
    skill: "Skill",
    task: "Task",
    todowrite: "TodoWrite",
    webfetch: "WebFetch",
    websearch: "WebSearch",
    write: "Write",
};
// --- HTTP helpers ---
// Claude OAuth token exchange can 429 when this runs inside the opencode auth
// process, even with the same payload that succeeds in a plain Node process.
// Run these OAuth-only HTTP calls in an isolated Node child to avoid whatever
// parent-process runtime state is affecting the in-process requests.
function requestText(urlString, options) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var payload = JSON.stringify({
                        body: options.body,
                        headers: options.headers,
                        method: options.method,
                        url: urlString,
                    });
                    var child = (0, node_child_process_1.spawn)("node", [
                        "-e",
                        "\nconst input = JSON.parse(process.argv[1]);\n(async () => {\n  const response = await fetch(input.url, {\n    method: input.method,\n    headers: input.headers,\n    body: input.body,\n  });\n  const text = await response.text();\n  if (!response.ok) {\n    console.error(JSON.stringify({ status: response.status, body: text }));\n    process.exit(1);\n  }\n  process.stdout.write(text);\n})().catch((error) => {\n  console.error(error instanceof Error ? error.stack ?? error.message : String(error));\n  process.exit(1);\n});\n    ".trim(),
                        payload,
                    ], {
                        stdio: ["ignore", "pipe", "pipe"],
                    });
                    var stdout = "";
                    var stderr = "";
                    var timeout = setTimeout(function () {
                        child.kill();
                        reject(new Error("Request timed out. url=".concat(urlString)));
                    }, 30000);
                    child.stdout.on("data", function (chunk) {
                        stdout += String(chunk);
                    });
                    child.stderr.on("data", function (chunk) {
                        stderr += String(chunk);
                    });
                    child.on("error", function (error) {
                        clearTimeout(timeout);
                        reject(error);
                    });
                    child.on("close", function (code) {
                        var _a;
                        clearTimeout(timeout);
                        if (code !== 0) {
                            var details = stderr.trim();
                            try {
                                var parsed = JSON.parse(details);
                                if (typeof parsed.status === "number") {
                                    reject(new Error("HTTP ".concat(parsed.status, " from ").concat(urlString, ": ").concat((_a = parsed.body) !== null && _a !== void 0 ? _a : "")));
                                    return;
                                }
                            }
                            catch (_b) {
                                // fall back to raw stderr
                            }
                            reject(new Error(details || "Node helper exited with code ".concat(code)));
                            return;
                        }
                        resolve(stdout);
                    });
                })];
        });
    });
}
function postJson(url, body) {
    return __awaiter(this, void 0, void 0, function () {
        var requestBody, responseText;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    requestBody = JSON.stringify(body);
                    return [4 /*yield*/, requestText(url, {
                            method: "POST",
                            headers: {
                                Accept: "application/json",
                                "Content-Length": String(Buffer.byteLength(requestBody)),
                                "Content-Type": "application/json",
                            },
                            body: requestBody,
                        })];
                case 1:
                    responseText = _a.sent();
                    return [2 /*return*/, JSON.parse(responseText)];
            }
        });
    });
}
var pendingRefresh = new Map();
// --- OAuth token exchange & refresh ---
function parseTokenResponse(json) {
    var data = json;
    if (!data.access_token || !data.refresh_token) {
        throw new Error("Invalid token response: ".concat(JSON.stringify(json)));
    }
    return data;
}
function tokenExpiry(expiresIn) {
    return Date.now() + expiresIn * 1000 - 5 * 60 * 1000;
}
function exchangeAuthorizationCode(code, state, verifier, redirectUri) {
    return __awaiter(this, void 0, void 0, function () {
        var json, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, postJson(TOKEN_URL, {
                        grant_type: "authorization_code",
                        client_id: CLIENT_ID,
                        code: code,
                        state: state,
                        redirect_uri: redirectUri,
                        code_verifier: verifier,
                    })];
                case 1:
                    json = _a.sent();
                    data = parseTokenResponse(json);
                    return [2 /*return*/, {
                            type: "success",
                            refresh: data.refresh_token,
                            access: data.access_token,
                            expires: tokenExpiry(data.expires_in),
                        }];
            }
        });
    });
}
function refreshAnthropicToken(refreshToken) {
    return __awaiter(this, void 0, void 0, function () {
        var json, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, postJson(TOKEN_URL, {
                        grant_type: "refresh_token",
                        client_id: CLIENT_ID,
                        refresh_token: refreshToken,
                    })];
                case 1:
                    json = _a.sent();
                    data = parseTokenResponse(json);
                    return [2 /*return*/, {
                            type: "oauth",
                            refresh: data.refresh_token,
                            access: data.access_token,
                            expires: tokenExpiry(data.expires_in),
                        }];
            }
        });
    });
}
function createApiKey(accessToken) {
    return __awaiter(this, void 0, void 0, function () {
        var responseText, json;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, requestText(CREATE_API_KEY_URL, {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            authorization: "Bearer ".concat(accessToken),
                            "Content-Type": "application/json",
                        },
                    })];
                case 1:
                    responseText = _a.sent();
                    json = JSON.parse(responseText);
                    return [2 /*return*/, { type: "success", key: json.raw_key }];
            }
        });
    });
}
function fetchAnthropicAccountIdentity(accessToken) {
    return __awaiter(this, void 0, void 0, function () {
        var urls, _i, urls_1, url, responseText, parsed, identity;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    urls = [CLIENT_DATA_URL, PROFILE_URL];
                    _i = 0, urls_1 = urls;
                    _a.label = 1;
                case 1:
                    if (!(_i < urls_1.length)) return [3 /*break*/, 4];
                    url = urls_1[_i];
                    return [4 /*yield*/, requestText(url, {
                            method: "GET",
                            headers: {
                                Accept: "application/json",
                                authorization: "Bearer ".concat(accessToken),
                                "user-agent": process.env.OPENCODE_ANTHROPIC_USER_AGENT ||
                                    "claude-cli/".concat(CLAUDE_CODE_VERSION),
                                "x-app": "cli",
                            },
                        }).catch(function () {
                            return undefined;
                        })];
                case 2:
                    responseText = _a.sent();
                    if (!responseText)
                        return [3 /*break*/, 3];
                    parsed = JSON.parse(responseText);
                    identity = (0, anthropic_account_identity_js_1.extractAnthropicAccountIdentity)(parsed);
                    if (identity)
                        return [2 /*return*/, identity];
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, undefined];
            }
        });
    });
}
function startCallbackServer(expectedState) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var settle;
                    var settled = false;
                    var waitPromise = new Promise(function (res) {
                        settle = function (v) {
                            if (settled)
                                return;
                            settled = true;
                            res(v);
                        };
                    });
                    var server = (0, node_http_1.createServer)(function (req, res) {
                        try {
                            var url = new URL(req.url || "", "http://localhost");
                            if (url.pathname !== CALLBACK_PATH) {
                                res.writeHead(404).end("Not found");
                                return;
                            }
                            var code = url.searchParams.get("code");
                            var state = url.searchParams.get("state");
                            var error = url.searchParams.get("error");
                            if (error || !code || !state || state !== expectedState) {
                                res
                                    .writeHead(400)
                                    .end("Authentication failed: " + (error || "missing code/state"));
                                return;
                            }
                            res
                                .writeHead(200, { "Content-Type": "text/plain" })
                                .end("Authentication successful. You can close this window.");
                            settle === null || settle === void 0 ? void 0 : settle({ code: code, state: state });
                        }
                        catch (_a) {
                            res.writeHead(500).end("Internal error");
                        }
                    });
                    server.once("error", reject);
                    server.listen(CALLBACK_PORT, "127.0.0.1", function () {
                        resolve({
                            server: server,
                            cancelWait: function () {
                                settle === null || settle === void 0 ? void 0 : settle(null);
                            },
                            waitForCode: function () { return waitPromise; },
                        });
                    });
                })];
        });
    });
}
function closeServer(server) {
    return new Promise(function (resolve) {
        server.close(function () {
            resolve();
        });
    });
}
// --- Authorization flow ---
// Unified flow: beginAuthorizationFlow starts PKCE + callback server,
// then waitForCallback handles both auto (localhost) and manual (pasted code) paths.
function beginAuthorizationFlow() {
    return __awaiter(this, void 0, void 0, function () {
        var pkce, callbackServer, authParams;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, generatePKCE()];
                case 1:
                    pkce = _a.sent();
                    return [4 /*yield*/, startCallbackServer(pkce.verifier)];
                case 2:
                    callbackServer = _a.sent();
                    authParams = new URLSearchParams({
                        code: "true",
                        client_id: CLIENT_ID,
                        response_type: "code",
                        redirect_uri: REDIRECT_URI,
                        scope: SCOPES,
                        code_challenge: pkce.challenge,
                        code_challenge_method: "S256",
                        state: pkce.verifier,
                    });
                    return [2 /*return*/, {
                            url: "https://claude.ai/oauth/authorize?".concat(authParams.toString()),
                            verifier: pkce.verifier,
                            callbackServer: callbackServer,
                        }];
            }
        });
    });
}
function waitForCallback(callbackServer, manualInput) {
    return __awaiter(this, void 0, void 0, function () {
        var quick, trimmed, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, , 3, 5]);
                    return [4 /*yield*/, Promise.race([
                            callbackServer.waitForCode(),
                            new Promise(function (r) {
                                setTimeout(function () {
                                    r(null);
                                }, 50);
                            }),
                        ])];
                case 1:
                    quick = _a.sent();
                    if (quick === null || quick === void 0 ? void 0 : quick.code)
                        return [2 /*return*/, quick];
                    trimmed = manualInput === null || manualInput === void 0 ? void 0 : manualInput.trim();
                    if (trimmed) {
                        return [2 /*return*/, parseManualInput(trimmed)];
                    }
                    return [4 /*yield*/, Promise.race([
                            callbackServer.waitForCode(),
                            new Promise(function (r) {
                                setTimeout(function () {
                                    r(null);
                                }, OAUTH_TIMEOUT_MS);
                            }),
                        ])];
                case 2:
                    result = _a.sent();
                    if (!(result === null || result === void 0 ? void 0 : result.code)) {
                        throw new Error("Timed out waiting for OAuth callback");
                    }
                    return [2 /*return*/, result];
                case 3:
                    callbackServer.cancelWait();
                    return [4 /*yield*/, closeServer(callbackServer.server)];
                case 4:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function parseManualInput(input) {
    try {
        var url = new URL(input);
        var code = url.searchParams.get("code");
        var state = url.searchParams.get("state");
        if (code)
            return { code: code, state: state || "" };
    }
    catch (_a) {
        // not a URL
    }
    if (input.includes("#")) {
        var _b = input.split("#", 2), _c = _b[0], code = _c === void 0 ? "" : _c, _d = _b[1], state = _d === void 0 ? "" : _d;
        return { code: code, state: state };
    }
    if (input.includes("code=")) {
        var params = new URLSearchParams(input);
        var code = params.get("code");
        if (code)
            return { code: code, state: params.get("state") || "" };
    }
    return { code: input, state: "" };
}
// Unified authorize handler: returns either OAuth tokens or an API key,
// for both auto and remote-first modes.
function buildAuthorizeHandler(mode) {
    var _this = this;
    return function () { return __awaiter(_this, void 0, void 0, function () {
        var auth, isRemote, pendingAuthResult, finalize;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, beginAuthorizationFlow()];
                case 1:
                    auth = _a.sent();
                    isRemote = Boolean(process.env.KIMAKI);
                    finalize = function (result) { return __awaiter(_this, void 0, void 0, function () {
                        var verifier, creds, identity;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    verifier = auth.verifier;
                                    return [4 /*yield*/, exchangeAuthorizationCode(result.code, result.state || verifier, verifier, REDIRECT_URI)];
                                case 1:
                                    creds = _a.sent();
                                    if (mode === "apikey") {
                                        return [2 /*return*/, createApiKey(creds.access)];
                                    }
                                    return [4 /*yield*/, fetchAnthropicAccountIdentity(creds.access)];
                                case 2:
                                    identity = _a.sent();
                                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.rememberAnthropicOAuth)({
                                            type: "oauth",
                                            refresh: creds.refresh,
                                            access: creds.access,
                                            expires: creds.expires,
                                        }, identity)];
                                case 3:
                                    _a.sent();
                                    return [2 /*return*/, creds];
                            }
                        });
                    }); };
                    if (!isRemote) {
                        return [2 /*return*/, {
                                url: auth.url,
                                instructions: "Complete login in your browser on this machine. OpenCode will catch the localhost callback automatically.",
                                method: "auto",
                                callback: function () { return __awaiter(_this, void 0, void 0, function () {
                                    var _this = this;
                                    return __generator(this, function (_a) {
                                        pendingAuthResult !== null && pendingAuthResult !== void 0 ? pendingAuthResult : (pendingAuthResult = (function () { return __awaiter(_this, void 0, void 0, function () {
                                            var result, _a;
                                            return __generator(this, function (_b) {
                                                switch (_b.label) {
                                                    case 0:
                                                        _b.trys.push([0, 3, , 4]);
                                                        return [4 /*yield*/, waitForCallback(auth.callbackServer)];
                                                    case 1:
                                                        result = _b.sent();
                                                        return [4 /*yield*/, finalize(result)];
                                                    case 2: return [2 /*return*/, _b.sent()];
                                                    case 3:
                                                        _a = _b.sent();
                                                        return [2 /*return*/, { type: "failed" }];
                                                    case 4: return [2 /*return*/];
                                                }
                                            });
                                        }); })());
                                        return [2 /*return*/, pendingAuthResult];
                                    });
                                }); },
                            }];
                    }
                    return [2 /*return*/, {
                            url: auth.url,
                            instructions: "Complete login in your browser, then paste the final redirect URL from the address bar here. Pasting just the authorization code also works.",
                            method: "code",
                            callback: function (input) { return __awaiter(_this, void 0, void 0, function () {
                                var _this = this;
                                return __generator(this, function (_a) {
                                    pendingAuthResult !== null && pendingAuthResult !== void 0 ? pendingAuthResult : (pendingAuthResult = (function () { return __awaiter(_this, void 0, void 0, function () {
                                        var result, _a;
                                        return __generator(this, function (_b) {
                                            switch (_b.label) {
                                                case 0:
                                                    _b.trys.push([0, 3, , 4]);
                                                    return [4 /*yield*/, waitForCallback(auth.callbackServer, input)];
                                                case 1:
                                                    result = _b.sent();
                                                    return [4 /*yield*/, finalize(result)];
                                                case 2: return [2 /*return*/, _b.sent()];
                                                case 3:
                                                    _a = _b.sent();
                                                    return [2 /*return*/, { type: "failed" }];
                                                case 4: return [2 /*return*/];
                                            }
                                        });
                                    }); })());
                                    return [2 /*return*/, pendingAuthResult];
                                });
                            }); },
                        }];
            }
        });
    }); };
}
// --- Request/response rewriting ---
// Renames opencode tool names to Claude Code tool names in requests,
// and reverses the mapping in streamed responses.
function toClaudeCodeToolName(name) {
    var _a;
    return (_a = OPENCODE_TO_CLAUDE_CODE_TOOL_NAME[name.toLowerCase()]) !== null && _a !== void 0 ? _a : name;
}
/**
 * Strips the OpenCode identity and its adjacent <env> block, then re-injects
 * essential environment context as a small XML tag.
 *
 * OpenCode can place project instructions before or after skills depending on
 * version. Keep the rewrite scoped to the env block so configured instruction
 * files remain visible to Anthropic.
 *
 * Original OpenCode Anthropic prompt structure (for reference):
 *   "You are OpenCode, the best coding agent on the planet."
 *   + environment block (cwd, OS, shell, date, etc.)
 *   + instructions and/or skills
 */
function sanitizeAnthropicSystemText(text, onError) {
    var startIdx = text.indexOf(OPENCODE_IDENTITY);
    if (startIdx !== -1) {
        // Main session path: strip from OpenCode identity through its env block.
        var envCloseIdx = text.indexOf(ENV_CLOSE_TAG, startIdx);
        if (envCloseIdx === -1) {
            onError === null || onError === void 0 ? void 0 : onError("sanitizeAnthropicSystemText: could not find </env> after OpenCode identity");
            return text;
        }
        var endIdx = envCloseIdx + ENV_CLOSE_TAG.length;
        var afterEnd = text[endIdx] === "\n" ? endIdx + 1 : endIdx;
        return replaceBlockWithCompactEnv(text, startIdx, afterEnd);
    }
    // Subagent path: opencode appends "You are powered by the model named ..."
    // followed by an <env> block. Strip from that line through </env>.
    var subagentIdx = text.indexOf(SUBAGENT_MODEL_IDENTITY);
    if (subagentIdx !== -1) {
        var envCloseIdx = text.indexOf(ENV_CLOSE_TAG, subagentIdx);
        if (envCloseIdx === -1) {
            onError === null || onError === void 0 ? void 0 : onError("sanitizeAnthropicSystemText: could not find </env> after subagent model identity");
            return text;
        }
        var endIdx = envCloseIdx + ENV_CLOSE_TAG.length;
        // Skip trailing newline so the join is clean
        var afterEnd = text[endIdx] === "\n" ? endIdx + 1 : endIdx;
        return replaceBlockWithCompactEnv(text, subagentIdx, afterEnd);
    }
    return text;
}
// Extract cwd from the block being stripped and replace it with a compact
// <environment> tag. Shared by both main-session and subagent paths.
// Source: anomalyco/opencode packages/opencode/src/session/system.ts
// OpenCode's system prompt format (as of 2025):
//   <env>
//     Working directory: ${Instance.directory}
//     Workspace root folder: ${Instance.worktree}
//     Is directory a git repo: yes/no
//     Platform: ${process.platform}
//     Today's date: ${new Date().toDateString()}
//   </env>
// Older format used <environment><cwd>/path</cwd></environment>.
// We try both patterns to stay compatible across opencode versions.
// We preserve the per-session directory instead of falling back to
// process.cwd() which is the opencode server's cwd and wrong for
// multi-session/worktree setups where each session has a different directory.
function replaceBlockWithCompactEnv(text, startIdx, endIdx) {
    var _a, _b, _c;
    var strippedBlock = text.slice(startIdx, endIdx);
    var cwdMatch = ((_b = (_a = strippedBlock.match(/Working directory:\s*(.+)/)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.trim()) ||
        ((_c = strippedBlock.match(/<cwd>([^<]+)<\/cwd>/)) === null || _c === void 0 ? void 0 : _c[1]);
    var cwd = cwdMatch || process.cwd();
    var envContext = "\n<environment>\n<cwd>".concat(cwd, "</cwd>\n</environment>\n") +
        "Read, write, and edit files under ".concat(cwd, ".\n\n");
    return (text.slice(0, startIdx) +
        envContext +
        text.slice(endIdx));
}
function mapSystemTextPart(part, onError) {
    if (typeof part === "string") {
        return { type: "text", text: sanitizeAnthropicSystemText(part, onError) };
    }
    if (part &&
        typeof part === "object" &&
        "type" in part &&
        part.type === "text" &&
        "text" in part &&
        typeof part.text === "string") {
        return __assign(__assign({}, part), { text: sanitizeAnthropicSystemText(part.text, onError) });
    }
    return part;
}
function prependClaudeCodeIdentity(system, onError) {
    var identityBlock = {
        type: "text",
        text: CLAUDE_CODE_IDENTITY,
    };
    if (typeof system === "undefined")
        return [identityBlock];
    if (typeof system === "string") {
        var sanitized_1 = sanitizeAnthropicSystemText(system, onError);
        if (sanitized_1 === CLAUDE_CODE_IDENTITY)
            return [identityBlock];
        return [identityBlock, { type: "text", text: sanitized_1 }];
    }
    if (!Array.isArray(system))
        return [identityBlock, system];
    var sanitized = system.map(function (item) {
        return mapSystemTextPart(item, onError);
    });
    var first = sanitized[0];
    if (first &&
        typeof first === "object" &&
        "type" in first &&
        first.type === "text" &&
        "text" in first &&
        first.text === CLAUDE_CODE_IDENTITY) {
        return sanitized;
    }
    return __spreadArray([identityBlock], sanitized, true);
}
function rewriteRequestPayload(body, onError) {
    if (!body)
        return {
            body: body,
            modelId: undefined,
            reverseToolNameMap: new Map(),
        };
    try {
        var payload = JSON.parse(body);
        var reverseToolNameMap_1 = new Map();
        var modelId = typeof payload.model === "string" ? payload.model : undefined;
        // Build reverse map and rename tools
        if (Array.isArray(payload.tools)) {
            payload.tools = payload.tools.map(function (tool) {
                if (!tool || typeof tool !== "object")
                    return tool;
                var name = tool.name;
                if (typeof name !== "string")
                    return tool;
                var mapped = toClaudeCodeToolName(name);
                reverseToolNameMap_1.set(mapped, name);
                return __assign(__assign({}, tool), { name: mapped });
            });
        }
        // Rename system prompt
        payload.system = prependClaudeCodeIdentity(payload.system, onError);
        // Rename tool_choice
        if (payload.tool_choice &&
            typeof payload.tool_choice === "object" &&
            payload.tool_choice.type === "tool") {
            var name_1 = payload.tool_choice.name;
            if (typeof name_1 === "string") {
                payload.tool_choice = __assign(__assign({}, payload.tool_choice), { name: toClaudeCodeToolName(name_1) });
            }
        }
        // Rename tool_use blocks in messages
        if (Array.isArray(payload.messages)) {
            payload.messages = payload.messages.map(function (message) {
                if (!message || typeof message !== "object")
                    return message;
                var content = message.content;
                if (!Array.isArray(content))
                    return message;
                return __assign(__assign({}, message), { content: content.map(function (block) {
                        if (!block || typeof block !== "object")
                            return block;
                        var b = block;
                        if (b.type !== "tool_use" || typeof b.name !== "string")
                            return block;
                        return __assign(__assign({}, block), { name: toClaudeCodeToolName(b.name) });
                    }) });
            });
        }
        return { body: JSON.stringify(payload), modelId: modelId, reverseToolNameMap: reverseToolNameMap_1 };
    }
    catch (_a) {
        return {
            body: body,
            modelId: undefined,
            reverseToolNameMap: new Map(),
        };
    }
}
function wrapResponseStream(response, reverseToolNameMap) {
    if (!response.body || reverseToolNameMap.size === 0)
        return response;
    var reader = response.body.getReader();
    var decoder = new TextDecoder();
    var encoder = new TextEncoder();
    var carry = "";
    var transform = function (text) {
        return text.replace(/"name"\s*:\s*"([^"]+)"/g, function (full, name) {
            var original = reverseToolNameMap.get(name);
            return original ? full.replace("\"".concat(name, "\""), "\"".concat(original, "\"")) : full;
        });
    };
    var stream = new ReadableStream({
        pull: function (controller) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, done, value, finalText, output;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, reader.read()];
                        case 1:
                            _a = _b.sent(), done = _a.done, value = _a.value;
                            if (done) {
                                finalText = carry + decoder.decode();
                                if (finalText)
                                    controller.enqueue(encoder.encode(transform(finalText)));
                                controller.close();
                                return [2 /*return*/];
                            }
                            carry += decoder.decode(value, { stream: true });
                            // Buffer 256 chars to avoid splitting JSON keys across chunks
                            if (carry.length <= 256)
                                return [2 /*return*/];
                            output = carry.slice(0, -256);
                            carry = carry.slice(-256);
                            controller.enqueue(encoder.encode(transform(output)));
                            return [2 /*return*/];
                    }
                });
            });
        },
        cancel: function (reason) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, reader.cancel(reason)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        },
    });
    return new Response(stream, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    });
}
// --- Beta headers ---
function getRequiredBetas(modelId) {
    var betas = [
        CLAUDE_CODE_BETA,
        OAUTH_BETA,
        FINE_GRAINED_TOOL_STREAMING_BETA,
    ];
    var isAdaptive = (modelId === null || modelId === void 0 ? void 0 : modelId.includes("opus-4-6")) ||
        (modelId === null || modelId === void 0 ? void 0 : modelId.includes("opus-4.6")) ||
        (modelId === null || modelId === void 0 ? void 0 : modelId.includes("sonnet-4-6")) ||
        (modelId === null || modelId === void 0 ? void 0 : modelId.includes("sonnet-4.6"));
    if (!isAdaptive)
        betas.push(INTERLEAVED_THINKING_BETA);
    return betas;
}
function mergeBetas(existing, required) {
    return __spreadArray([], new Set(__spreadArray(__spreadArray([], required, true), (existing || "")
        .split(",")
        .map(function (s) { return s.trim(); })
        .filter(Boolean), true)), true).join(",");
}
// --- Token refresh with dedup ---
function isOAuthStored(auth) {
    return auth.type === "oauth";
}
function getFreshOAuth(getAuth, client) {
    return __awaiter(this, void 0, void 0, function () {
        var auth, pending, refreshPromise;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getAuth()];
                case 1:
                    auth = _a.sent();
                    if (!isOAuthStored(auth))
                        return [2 /*return*/, undefined];
                    if (auth.access && auth.expires > Date.now())
                        return [2 /*return*/, auth];
                    pending = pendingRefresh.get(auth.refresh);
                    if (pending) {
                        return [2 /*return*/, pending];
                    }
                    refreshPromise = (0, anthropic_auth_state_js_1.withAuthStateLock)(function () { return __awaiter(_this, void 0, void 0, function () {
                        var latest, refreshed, store, identity;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, getAuth()];
                                case 1:
                                    latest = _a.sent();
                                    if (!isOAuthStored(latest)) {
                                        throw new Error("Anthropic OAuth credentials disappeared during refresh");
                                    }
                                    if (latest.access && latest.expires > Date.now())
                                        return [2 /*return*/, latest];
                                    return [4 /*yield*/, refreshAnthropicToken(latest.refresh)];
                                case 2:
                                    refreshed = _a.sent();
                                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.setAnthropicAuth)(refreshed, client)];
                                case 3:
                                    _a.sent();
                                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.loadAccountStore)()];
                                case 4:
                                    store = _a.sent();
                                    if (!(store.accounts.length > 0)) return [3 /*break*/, 6];
                                    identity = (function () {
                                        var currentIndex = store.accounts.findIndex(function (account) {
                                            return (account.refresh === latest.refresh ||
                                                account.access === latest.access);
                                        });
                                        var current = currentIndex >= 0 ? store.accounts[currentIndex] : undefined;
                                        if (!current)
                                            return undefined;
                                        return __assign(__assign({}, (current.email ? { email: current.email } : {})), (current.accountId ? { accountId: current.accountId } : {}));
                                    })();
                                    (0, anthropic_auth_state_js_1.upsertAccount)(store, __assign(__assign({}, refreshed), identity));
                                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.saveAccountStore)(store)];
                                case 5:
                                    _a.sent();
                                    _a.label = 6;
                                case 6: return [2 /*return*/, refreshed];
                            }
                        });
                    }); });
                    pendingRefresh.set(auth.refresh, refreshPromise);
                    return [2 /*return*/, refreshPromise.finally(function () {
                            pendingRefresh.delete(auth.refresh);
                        })];
            }
        });
    });
}
var AnthropicAuthPlugin = function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var client = _b.client;
    return __generator(this, function (_c) {
        return [2 /*return*/, {
                "chat.headers": function (input, output) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        if (input.model.providerID !== "anthropic") {
                            return [2 /*return*/];
                        }
                        output.headers[TOAST_SESSION_HEADER] = input.sessionID;
                        return [2 /*return*/];
                    });
                }); },
                auth: {
                    provider: "anthropic",
                    loader: function (getAuth, provider) {
                        return __awaiter(this, void 0, void 0, function () {
                            var auth, _i, _a, model;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, getAuth()];
                                    case 1:
                                        auth = _b.sent();
                                        if (auth.type !== "oauth")
                                            return [2 /*return*/, {}];
                                        // Zero out costs for OAuth users (Claude Pro/Max subscription)
                                        for (_i = 0, _a = Object.values(provider.models); _i < _a.length; _i++) {
                                            model = _a[_i];
                                            model.cost = { input: 0, output: 0, cache: { read: 0, write: 0 } };
                                        }
                                        return [2 /*return*/, {
                                                apiKey: "",
                                                fetch: function (input, init) {
                                                    return __awaiter(this, void 0, void 0, function () {
                                                        var url, originalBody, _a, _b, headers, sessionId, rewritten, betas, runRequest, freshAuth, response, bodyText, rotated, retryAuth;
                                                        var _this = this;
                                                        var _c;
                                                        return __generator(this, function (_d) {
                                                            switch (_d.label) {
                                                                case 0:
                                                                    url = (function () {
                                                                        try {
                                                                            return new URL(input instanceof Request ? input.url : input.toString());
                                                                        }
                                                                        catch (_a) {
                                                                            return null;
                                                                        }
                                                                    })();
                                                                    if (!url || !ANTHROPIC_HOSTS.has(url.hostname))
                                                                        return [2 /*return*/, fetch(input, init)];
                                                                    if (!(typeof (init === null || init === void 0 ? void 0 : init.body) === "string")) return [3 /*break*/, 1];
                                                                    _a = init.body;
                                                                    return [3 /*break*/, 5];
                                                                case 1:
                                                                    if (!(input instanceof Request)) return [3 /*break*/, 3];
                                                                    return [4 /*yield*/, input
                                                                            .clone()
                                                                            .text()
                                                                            .catch(function () { return undefined; })];
                                                                case 2:
                                                                    _b = _d.sent();
                                                                    return [3 /*break*/, 4];
                                                                case 3:
                                                                    _b = undefined;
                                                                    _d.label = 4;
                                                                case 4:
                                                                    _a = _b;
                                                                    _d.label = 5;
                                                                case 5:
                                                                    originalBody = _a;
                                                                    headers = new Headers(init === null || init === void 0 ? void 0 : init.headers);
                                                                    if (input instanceof Request) {
                                                                        input.headers.forEach(function (v, k) {
                                                                            if (!headers.has(k))
                                                                                headers.set(k, v);
                                                                        });
                                                                    }
                                                                    sessionId = (_c = headers.get(TOAST_SESSION_HEADER)) !== null && _c !== void 0 ? _c : undefined;
                                                                    rewritten = rewriteRequestPayload(originalBody, function (msg) {
                                                                        client.tui
                                                                            .showToast({
                                                                            body: {
                                                                                message: (0, plugin_logger_js_1.appendToastSessionMarker)({
                                                                                    message: msg,
                                                                                    sessionId: sessionId,
                                                                                }),
                                                                                variant: "error",
                                                                            },
                                                                        })
                                                                            .catch(function () { });
                                                                    });
                                                                    betas = getRequiredBetas(rewritten.modelId);
                                                                    runRequest = function (auth) { return __awaiter(_this, void 0, void 0, function () {
                                                                        var requestHeaders;
                                                                        return __generator(this, function (_a) {
                                                                            requestHeaders = new Headers(headers);
                                                                            requestHeaders.delete(TOAST_SESSION_HEADER);
                                                                            requestHeaders.set("accept", "application/json");
                                                                            requestHeaders.set("anthropic-beta", mergeBetas(requestHeaders.get("anthropic-beta"), betas));
                                                                            requestHeaders.set("anthropic-dangerous-direct-browser-access", "true");
                                                                            requestHeaders.set("authorization", "Bearer ".concat(auth.access));
                                                                            requestHeaders.set("user-agent", process.env.OPENCODE_ANTHROPIC_USER_AGENT ||
                                                                                "claude-cli/".concat(CLAUDE_CODE_VERSION));
                                                                            requestHeaders.set("x-app", "cli");
                                                                            requestHeaders.delete("x-api-key");
                                                                            return [2 /*return*/, fetch(input, __assign(__assign({}, (init !== null && init !== void 0 ? init : {})), { body: rewritten.body, headers: requestHeaders }))];
                                                                        });
                                                                    }); };
                                                                    return [4 /*yield*/, getFreshOAuth(getAuth, client)];
                                                                case 6:
                                                                    freshAuth = _d.sent();
                                                                    if (!freshAuth)
                                                                        return [2 /*return*/, fetch(input, init)];
                                                                    return [4 /*yield*/, runRequest(freshAuth)];
                                                                case 7:
                                                                    response = _d.sent();
                                                                    if (!!response.ok) return [3 /*break*/, 12];
                                                                    return [4 /*yield*/, response
                                                                            .clone()
                                                                            .text()
                                                                            .catch(function () { return ""; })];
                                                                case 8:
                                                                    bodyText = _d.sent();
                                                                    if (!(0, anthropic_auth_state_js_1.shouldRotateAuth)(response.status, bodyText)) return [3 /*break*/, 12];
                                                                    return [4 /*yield*/, (0, anthropic_auth_state_js_1.rotateAnthropicAccount)(freshAuth, client)];
                                                                case 9:
                                                                    rotated = _d.sent();
                                                                    if (!rotated) return [3 /*break*/, 12];
                                                                    // Show toast notification so Discord thread shows the rotation
                                                                    client.tui
                                                                        .showToast({
                                                                        body: {
                                                                            message: (0, plugin_logger_js_1.appendToastSessionMarker)({
                                                                                message: "Switching from account ".concat(rotated.fromLabel, " to account ").concat(rotated.toLabel),
                                                                                sessionId: sessionId,
                                                                            }),
                                                                            variant: "info",
                                                                        },
                                                                    })
                                                                        .catch(function () { });
                                                                    return [4 /*yield*/, getFreshOAuth(getAuth, client)];
                                                                case 10:
                                                                    retryAuth = _d.sent();
                                                                    if (!retryAuth) return [3 /*break*/, 12];
                                                                    return [4 /*yield*/, runRequest(retryAuth)];
                                                                case 11:
                                                                    response = _d.sent();
                                                                    _d.label = 12;
                                                                case 12: return [2 /*return*/, wrapResponseStream(response, rewritten.reverseToolNameMap)];
                                                            }
                                                        });
                                                    });
                                                },
                                            }];
                                }
                            });
                        });
                    },
                    methods: [
                        {
                            label: "Claude Pro/Max",
                            type: "oauth",
                            authorize: buildAuthorizeHandler("oauth"),
                        },
                        {
                            label: "Create an API Key",
                            type: "oauth",
                            authorize: buildAuthorizeHandler("apikey"),
                        },
                        {
                            provider: "anthropic",
                            label: "Manually enter API Key",
                            type: "api",
                        },
                    ],
                },
            }];
    });
}); };
exports.anthropicAuthPlugin = AnthropicAuthPlugin;
var replacer = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                "experimental.chat.system.transform": (function (input, output) { return __awaiter(void 0, void 0, void 0, function () {
                    var textIndex, text;
                    return __generator(this, function (_a) {
                        if (input.model.providerID !== "anthropic")
                            return [2 /*return*/];
                        textIndex = output.system.findIndex(function (x) {
                            return x.includes(OPENCODE_IDENTITY);
                        });
                        text = output.system[textIndex];
                        if (!text) {
                            return [2 /*return*/];
                        }
                        output.system[textIndex] = sanitizeAnthropicSystemText(text);
                        return [2 /*return*/];
                    });
                }); }),
            }];
    });
}); };
exports.replacer = replacer;
