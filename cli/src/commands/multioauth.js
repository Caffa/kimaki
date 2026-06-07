"use strict";
/**
 * CLI commands for multi-provider OAuth account management.
 * Mounted via goke .use() in cli.ts under the `multioauth` namespace.
 * Manages Anthropic and OpenAI OAuth account rotation pools.
 */
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
var anthropic_auth_state_js_1 = require("../anthropic-auth-state.js");
var openai_auth_state_js_1 = require("../openai-auth-state.js");
var EXIT_NO_RESTART = 64;
function resolveAccountIndex(indexOrEmail, accounts) {
    var value = Number(indexOrEmail);
    if (Number.isInteger(value) && value >= 1) {
        return value - 1;
    }
    var email = indexOrEmail.trim().toLowerCase();
    if (!email)
        return -1;
    return accounts.findIndex(function (account) {
        var _a;
        return ((_a = account.email) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === email;
    });
}
var multioauth = (0, goke_1.goke)();
multioauth
    .command('multioauth list', 'List all OAuth accounts across all providers')
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var anthropicStore, openaiStore;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, anthropic_auth_state_js_1.loadAccountStore)()];
            case 1:
                anthropicStore = _a.sent();
                return [4 /*yield*/, (0, openai_auth_state_js_1.loadOpenAIAccountStore)()];
            case 2:
                openaiStore = _a.sent();
                console.log('Anthropic OAuth accounts:');
                if (anthropicStore.accounts.length === 0) {
                    console.log('  (none)');
                }
                else {
                    anthropicStore.accounts.forEach(function (account, index) {
                        var active = index === anthropicStore.activeIndex ? '*' : ' ';
                        console.log("  ".concat(active, " ").concat(index + 1, ". ").concat((0, anthropic_auth_state_js_1.accountLabel)(account)));
                    });
                }
                console.log('');
                console.log('OpenAI OAuth accounts:');
                if (openaiStore.accounts.length === 0) {
                    console.log('  (none)');
                }
                else {
                    openaiStore.accounts.forEach(function (account, index) {
                        var active = index === openaiStore.activeIndex ? '*' : ' ';
                        console.log("  ".concat(active, " ").concat(index + 1, ". ").concat((0, openai_auth_state_js_1.accountLabel)(account)));
                    });
                }
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
// --- Anthropic subcommands ---
multioauth
    .command('multioauth anthropic list', 'List stored Anthropic OAuth accounts used for automatic rotation')
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var store;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, anthropic_auth_state_js_1.loadAccountStore)()];
            case 1:
                store = _a.sent();
                console.log("Store: ".concat((0, anthropic_auth_state_js_1.accountsFilePath)()));
                if (store.accounts.length === 0) {
                    console.log('No Anthropic OAuth accounts configured.');
                    process.exit(0);
                }
                store.accounts.forEach(function (account, index) {
                    var active = index === store.activeIndex ? '*' : ' ';
                    console.log("".concat(active, " ").concat(index + 1, ". ").concat((0, anthropic_auth_state_js_1.accountLabel)(account)));
                });
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
multioauth
    .command('multioauth anthropic current', 'Show the current Anthropic OAuth account being used')
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var current, lines;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, (0, anthropic_auth_state_js_1.getCurrentAnthropicAccount)()];
            case 1:
                current = _c.sent();
                console.log("Store: ".concat((0, anthropic_auth_state_js_1.accountsFilePath)()));
                console.log("Auth: ".concat((0, anthropic_auth_state_js_1.authFilePath)()));
                if (!current) {
                    console.log('No active Anthropic OAuth account configured.');
                    process.exit(0);
                }
                lines = [];
                lines.push("Current: ".concat((0, anthropic_auth_state_js_1.accountLabel)(current.account || current.auth, current.index)));
                if ((_a = current.account) === null || _a === void 0 ? void 0 : _a.email) {
                    lines.push("Email: ".concat(current.account.email));
                }
                else {
                    lines.push('Email: unavailable');
                }
                if ((_b = current.account) === null || _b === void 0 ? void 0 : _b.accountId) {
                    lines.push("Account ID: ".concat(current.account.accountId));
                }
                if (!current.account) {
                    lines.push('Rotation pool entry: not found');
                }
                console.log(lines.join('\n'));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
multioauth
    .command('multioauth anthropic remove <indexOrEmail>', 'Remove an Anthropic OAuth account from the rotation pool')
    .action(function (indexOrEmail) { return __awaiter(void 0, void 0, void 0, function () {
    var store, resolvedIndex, removed;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, anthropic_auth_state_js_1.loadAccountStore)()];
            case 1:
                store = _a.sent();
                resolvedIndex = resolveAccountIndex(indexOrEmail, store.accounts);
                if (resolvedIndex < 0) {
                    console.error('Usage: kimaki multioauth anthropic remove <index-or-email>');
                    process.exit(EXIT_NO_RESTART);
                }
                removed = store.accounts[resolvedIndex];
                return [4 /*yield*/, (0, anthropic_auth_state_js_1.removeAccount)(resolvedIndex)];
            case 2:
                _a.sent();
                console.log("Removed Anthropic account ".concat(removed ? (0, anthropic_auth_state_js_1.accountLabel)(removed, resolvedIndex) : indexOrEmail));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
// --- OpenAI subcommands ---
multioauth
    .command('multioauth openai list', 'List stored OpenAI OAuth accounts used for automatic rotation')
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var store;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, openai_auth_state_js_1.loadOpenAIAccountStore)()];
            case 1:
                store = _a.sent();
                console.log("Store: ".concat((0, openai_auth_state_js_1.openaiAccountsFilePath)()));
                if (store.accounts.length === 0) {
                    console.log('No OpenAI OAuth accounts configured.');
                    process.exit(0);
                }
                store.accounts.forEach(function (account, index) {
                    var active = index === store.activeIndex ? '*' : ' ';
                    console.log("".concat(active, " ").concat(index + 1, ". ").concat((0, openai_auth_state_js_1.accountLabel)(account)));
                });
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
multioauth
    .command('multioauth openai current', 'Show the current OpenAI OAuth account being used')
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var current, lines;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, (0, openai_auth_state_js_1.getCurrentOpenAIAccount)()];
            case 1:
                current = _c.sent();
                console.log("Store: ".concat((0, openai_auth_state_js_1.openaiAccountsFilePath)()));
                console.log("Auth: ".concat((0, anthropic_auth_state_js_1.authFilePath)()));
                if (!current) {
                    console.log('No active OpenAI OAuth account configured.');
                    process.exit(0);
                }
                lines = [];
                lines.push("Current: ".concat((0, openai_auth_state_js_1.accountLabel)(current.account || current.auth, current.index)));
                if ((_a = current.account) === null || _a === void 0 ? void 0 : _a.email) {
                    lines.push("Email: ".concat(current.account.email));
                }
                else {
                    lines.push('Email: unavailable');
                }
                if ((_b = current.account) === null || _b === void 0 ? void 0 : _b.accountId) {
                    lines.push("Account ID: ".concat(current.account.accountId));
                }
                if (!current.account) {
                    lines.push('Rotation pool entry: not found');
                }
                console.log(lines.join('\n'));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
multioauth
    .command('multioauth openai remove <indexOrEmail>', 'Remove an OpenAI OAuth account from the rotation pool')
    .action(function (indexOrEmail) { return __awaiter(void 0, void 0, void 0, function () {
    var store, resolvedIndex, removed;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, openai_auth_state_js_1.loadOpenAIAccountStore)()];
            case 1:
                store = _a.sent();
                resolvedIndex = resolveAccountIndex(indexOrEmail, store.accounts);
                if (resolvedIndex < 0) {
                    console.error('Usage: kimaki multioauth openai remove <index-or-email>');
                    process.exit(EXIT_NO_RESTART);
                }
                removed = store.accounts[resolvedIndex];
                return [4 /*yield*/, (0, openai_auth_state_js_1.removeOpenAIAccount)(resolvedIndex)];
            case 2:
                _a.sent();
                console.log("Removed OpenAI account ".concat(removed ? (0, openai_auth_state_js_1.accountLabel)(removed, resolvedIndex) : indexOrEmail));
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
multioauth
    .command('multioauth openai check', 'Test all OpenAI OAuth accounts for usage limits')
    .action(function () { return __awaiter(void 0, void 0, void 0, function () {
    var store, i, account, marker, label, accessToken, response, json, _a, response, text, isLimited, resetInfo, json, match, err_1;
    var _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0: return [4 /*yield*/, (0, openai_auth_state_js_1.loadOpenAIAccountStore)()];
            case 1:
                store = _g.sent();
                if (store.accounts.length === 0) {
                    console.log('No OpenAI OAuth accounts configured.');
                    process.exit(0);
                }
                console.log('Checking usage limits for all OpenAI accounts...\n');
                i = 0;
                _g.label = 2;
            case 2:
                if (!(i < store.accounts.length)) return [3 /*break*/, 12];
                account = store.accounts[i];
                if (!account)
                    return [3 /*break*/, 11];
                marker = i === store.activeIndex ? '*' : ' ';
                label = (_c = (_b = account.email) !== null && _b !== void 0 ? _b : account.accountId) !== null && _c !== void 0 ? _c : 'unknown';
                process.stdout.write("".concat(marker, " ").concat(i + 1, ". ").concat(label, ": "));
                accessToken = account.access;
                if (!(account.expires < Date.now())) return [3 /*break*/, 7];
                _g.label = 3;
            case 3:
                _g.trys.push([3, 6, , 7]);
                return [4 /*yield*/, fetch('https://auth.openai.com/oauth/token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            grant_type: 'refresh_token',
                            refresh_token: account.refresh,
                            client_id: 'app_EMoamEEZ73f0CkXaXp7hrann',
                        }).toString(),
                    })];
            case 4:
                response = _g.sent();
                if (!response.ok) {
                    console.log('ERROR - Token expired, refresh failed');
                    return [3 /*break*/, 11];
                }
                return [4 /*yield*/, response.json()];
            case 5:
                json = (_g.sent());
                accessToken = json.access_token;
                account.access = accessToken;
                account.expires = Date.now() + ((_d = json.expires_in) !== null && _d !== void 0 ? _d : 3600) * 1000;
                return [3 /*break*/, 7];
            case 6:
                _a = _g.sent();
                console.log('ERROR - Token expired, refresh failed');
                return [3 /*break*/, 11];
            case 7:
                _g.trys.push([7, 10, , 11]);
                return [4 /*yield*/, fetch('https://api.openai.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: "Bearer ".concat(accessToken),
                        },
                        body: JSON.stringify({
                            model: 'gpt-4o',
                            max_tokens: 1,
                            messages: [{ role: 'user', content: 'hi' }],
                        }),
                    })];
            case 8:
                response = _g.sent();
                if (response.ok) {
                    console.log('OK');
                    return [3 /*break*/, 11];
                }
                return [4 /*yield*/, response.text()];
            case 9:
                text = _g.sent();
                isLimited = text.includes('usage limit') ||
                    text.includes('rate limit') ||
                    text.includes('usage_limit') ||
                    response.status === 429;
                if (isLimited) {
                    resetInfo = void 0;
                    try {
                        json = JSON.parse(text);
                        match = (_f = (_e = json.error) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.match(/try again (after|in) ([^.]+)/i);
                        if (match)
                            resetInfo = match[2];
                    }
                    catch (_h) { }
                    console.log("LIMITED".concat(resetInfo ? " (resets ".concat(resetInfo, ")") : ''));
                }
                else if (response.status === 401) {
                    console.log('ERROR - Auth failed (token invalid)');
                }
                else {
                    console.log("ERROR - ".concat(response.status, ": ").concat(text.slice(0, 100)));
                }
                return [3 /*break*/, 11];
            case 10:
                err_1 = _g.sent();
                console.log("ERROR - ".concat(err_1 instanceof Error ? err_1.message : String(err_1)));
                return [3 /*break*/, 11];
            case 11:
                i++;
                return [3 /*break*/, 2];
            case 12: 
            // Save store in case we refreshed any tokens
            return [4 /*yield*/, (0, openai_auth_state_js_1.saveOpenAIAccountStore)(store)];
            case 13:
                // Save store in case we refreshed any tokens
                _g.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); });
exports.default = multioauth;
