"use strict";
// E2E coverage for application command registration/listing parity routes.
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
var vitest_1 = require("vitest");
var e2e_setup_js_1 = require("./e2e-setup.js");
(0, vitest_1.describe)('application command routes', function () {
    var ctx;
    var applicationId;
    (0, vitest_1.beforeAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.setupE2E)()];
                case 1:
                    ctx = _c.sent();
                    applicationId = (_b = (_a = ctx.client.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '';
                    return [2 /*return*/];
            }
        });
    }); }, 30000);
    (0, vitest_1.afterAll)(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, e2e_setup_js_1.teardownE2E)(ctx)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('global commands PUT + GET support bulk overwrite semantics', function () { return __awaiter(void 0, void 0, void 0, function () {
        var putResponse, putBody, overwriteResponse, listResponse, listBody;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/applications/").concat(applicationId, "/commands"), {
                        method: 'PUT',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify([
                            { name: 'hello', description: 'Say hello' },
                            { name: 'status', description: 'Show status' },
                        ]),
                    })];
                case 1:
                    putResponse = _a.sent();
                    return [4 /*yield*/, putResponse.json()];
                case 2:
                    putBody = (_a.sent());
                    (0, vitest_1.expect)(putResponse.status).toBe(200);
                    (0, vitest_1.expect)(putBody.map(function (entry) { return entry.name; }).sort()).toEqual(['hello', 'status']);
                    return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/applications/").concat(applicationId, "/commands"), {
                            method: 'PUT',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify([{ name: 'hello', description: 'Say hello again' }]),
                        })];
                case 3:
                    overwriteResponse = _a.sent();
                    (0, vitest_1.expect)(overwriteResponse.status).toBe(200);
                    return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/applications/").concat(applicationId, "/commands"))];
                case 4:
                    listResponse = _a.sent();
                    return [4 /*yield*/, listResponse.json()];
                case 5:
                    listBody = (_a.sent());
                    (0, vitest_1.expect)(listResponse.status).toBe(200);
                    (0, vitest_1.expect)(listBody.map(function (entry) { return entry.name; })).toEqual(['hello']);
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('guild commands are isolated from global commands', function () { return __awaiter(void 0, void 0, void 0, function () {
        var guildCommandsResponse, guildCommands, listGuildResponse, listedGuildCommands, singleCommandResponse, singleCommand, unknownCommandResponse, unknownCommandBody;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/applications/").concat(applicationId, "/guilds/").concat(ctx.twin.workspaceId, "/commands"), {
                        method: 'PUT',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify([
                            { name: 'guild-only', description: 'Guild command' },
                            { name: 'queue', description: 'Queue command' },
                        ]),
                    })];
                case 1:
                    guildCommandsResponse = _c.sent();
                    return [4 /*yield*/, guildCommandsResponse.json()];
                case 2:
                    guildCommands = (_c.sent());
                    (0, vitest_1.expect)(guildCommandsResponse.status).toBe(200);
                    (0, vitest_1.expect)(guildCommands.map(function (command) { return command.name; }).sort()).toEqual([
                        'guild-only',
                        'queue',
                    ]);
                    return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/applications/").concat(applicationId, "/guilds/").concat(ctx.twin.workspaceId, "/commands"))];
                case 3:
                    listGuildResponse = _c.sent();
                    return [4 /*yield*/, listGuildResponse.json()];
                case 4:
                    listedGuildCommands = (_c.sent());
                    (0, vitest_1.expect)(listGuildResponse.status).toBe(200);
                    (0, vitest_1.expect)(listedGuildCommands.map(function (command) { return command.name; }).sort()).toEqual([
                        'guild-only',
                        'queue',
                    ]);
                    return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/applications/").concat(applicationId, "/guilds/").concat(ctx.twin.workspaceId, "/commands/").concat((_a = guildCommands[0]) === null || _a === void 0 ? void 0 : _a.id))];
                case 5:
                    singleCommandResponse = _c.sent();
                    return [4 /*yield*/, singleCommandResponse.json()];
                case 6:
                    singleCommand = (_c.sent());
                    (0, vitest_1.expect)(singleCommandResponse.status).toBe(200);
                    (0, vitest_1.expect)(singleCommand.id).toBe((_b = guildCommands[0]) === null || _b === void 0 ? void 0 : _b.id);
                    return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/applications/").concat(applicationId, "/guilds/").concat(ctx.twin.workspaceId, "/commands/170000000000000001"))];
                case 7:
                    unknownCommandResponse = _c.sent();
                    return [4 /*yield*/, unknownCommandResponse.json()];
                case 8:
                    unknownCommandBody = _c.sent();
                    (0, vitest_1.expect)(unknownCommandResponse.status).toBe(404);
                    (0, vitest_1.expect)(unknownCommandBody).toMatchObject({
                        code: 10063,
                        error: 'unknown_application_command',
                        message: 'Unknown application command',
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('guild command routes reject mismatched guild id', function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("".concat(ctx.bridge.restUrl, "/v10/applications/").concat(applicationId, "/guilds/T_WRONG_GUILD/commands"))];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    body = _a.sent();
                    (0, vitest_1.expect)(response.status).toBe(404);
                    (0, vitest_1.expect)(body).toMatchObject({
                        code: 10004,
                        error: 'unknown_guild',
                        message: 'Unknown Guild: T_WRONG_GUILD',
                    });
                    return [2 /*return*/];
            }
        });
    }); });
});
