"use strict";
// /add-dir command - Expand the current session's external_directory permissions.
// Resolves the requested directory against the active working directory, then
// updates the current session permission rules via OpenCode.
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
exports.resolveDirectoryPermissionPattern = resolveDirectoryPermissionPattern;
exports.buildAddDirPermissionRules = buildAddDirPermissionRules;
exports.handleAddDirCommand = handleAddDirCommand;
var discord_js_1 = require("discord.js");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.PERMISSIONS);
var ALL_DIRECTORIES_PATTERN = '*';
function waitForSessionIdle(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var deadline, statusResponse, sessionStatus;
        var _c;
        var client = _b.client, sessionId = _b.sessionId, directory = _b.directory, _d = _b.timeoutMs, timeoutMs = _d === void 0 ? 2000 : _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    deadline = Date.now() + timeoutMs;
                    _e.label = 1;
                case 1:
                    if (!(Date.now() < deadline)) return [3 /*break*/, 4];
                    return [4 /*yield*/, client.session.status({ directory: directory })];
                case 2:
                    statusResponse = _e.sent();
                    sessionStatus = (_c = statusResponse.data) === null || _c === void 0 ? void 0 : _c[sessionId];
                    if (!sessionStatus || sessionStatus.type === 'idle') {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 50);
                        })];
                case 3:
                    _e.sent();
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function restartSessionIfBusy(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var statusResponse, sessionStatus, abortResponse, resumeResponse;
        var _c;
        var client = _b.client, sessionId = _b.sessionId, directory = _b.directory;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, client.session.status({ directory: directory })];
                case 1:
                    statusResponse = _d.sent();
                    if (statusResponse.error) {
                        return [2 /*return*/, new Error('Failed to check session status')];
                    }
                    sessionStatus = (_c = statusResponse.data) === null || _c === void 0 ? void 0 : _c[sessionId];
                    if (!sessionStatus || sessionStatus.type === 'idle') {
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, client.session.abort({
                            sessionID: sessionId,
                            directory: directory,
                        })];
                case 2:
                    abortResponse = _d.sent();
                    if (abortResponse.error) {
                        return [2 /*return*/, new Error('Failed to abort in-progress session')];
                    }
                    return [4 /*yield*/, waitForSessionIdle({ client: client, sessionId: sessionId, directory: directory })];
                case 3:
                    _d.sent();
                    return [4 /*yield*/, client.session.promptAsync({
                            sessionID: sessionId,
                            directory: directory,
                            parts: [],
                        })];
                case 4:
                    resumeResponse = _d.sent();
                    if (resumeResponse.error) {
                        return [2 /*return*/, new Error('Failed to resume session')];
                    }
                    return [2 /*return*/, true];
            }
        });
    });
}
function resolveDirectoryPermissionPattern(_a) {
    var input = _a.input, workingDirectory = _a.workingDirectory;
    var trimmedInput = input.trim();
    if (!trimmedInput) {
        return new Error('Directory is required');
    }
    if (trimmedInput === ALL_DIRECTORIES_PATTERN) {
        return ALL_DIRECTORIES_PATTERN;
    }
    var absolutePath = node_path_1.default.resolve(workingDirectory, trimmedInput);
    if (!node_fs_1.default.existsSync(absolutePath)) {
        return new Error("Directory does not exist: ".concat(absolutePath));
    }
    var stats;
    try {
        stats = node_fs_1.default.statSync(absolutePath);
    }
    catch (error) {
        return new Error("Failed to inspect directory: ".concat(absolutePath), { cause: error });
    }
    if (!stats.isDirectory()) {
        return new Error("Not a directory: ".concat(absolutePath));
    }
    return absolutePath.replaceAll('\\', '/');
}
function buildAddDirPermissionRules(_a) {
    var resolvedPattern = _a.resolvedPattern;
    return (0, opencode_js_1.buildExternalDirectoryPermissionRules)({
        resolvedPattern: resolvedPattern,
        action: 'allow',
    });
}
function handleAddDirCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, resolvedDirectories, requestedDirectory, resolvedPattern, sessionId, getClient, client, updateResponse, restarted, restartSuffix, error_1;
        var _c;
        var command = _b.command;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _d.sent();
                    return [2 /*return*/];
                case 2:
                    if (!!channel.isThread()) return [3 /*break*/, 4];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a thread with an active session',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 3:
                    _d.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: channel,
                    })];
                case 5:
                    resolvedDirectories = _d.sent();
                    if (!!resolvedDirectories) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory for this channel',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 6:
                    _d.sent();
                    return [2 /*return*/];
                case 7:
                    requestedDirectory = (_c = command.options.getString('directory')) !== null && _c !== void 0 ? _c : ALL_DIRECTORIES_PATTERN;
                    resolvedPattern = resolveDirectoryPermissionPattern({
                        input: requestedDirectory,
                        workingDirectory: resolvedDirectories.workingDirectory,
                    });
                    if (!(resolvedPattern instanceof Error)) return [3 /*break*/, 9];
                    return [4 /*yield*/, command.reply({
                            content: resolvedPattern.message,
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 8:
                    _d.sent();
                    return [2 /*return*/];
                case 9: return [4 /*yield*/, (0, database_js_1.getThreadSession)(channel.id)];
                case 10:
                    sessionId = _d.sent();
                    if (!!sessionId) return [3 /*break*/, 12];
                    return [4 /*yield*/, command.reply({
                            content: 'No active session in this thread',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 11:
                    _d.sent();
                    return [2 /*return*/];
                case 12: return [4 /*yield*/, command.deferReply({ flags: discord_utils_js_1.SILENT_MESSAGE_FLAGS })];
                case 13:
                    _d.sent();
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(resolvedDirectories.projectDirectory)];
                case 14:
                    getClient = _d.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 16];
                    return [4 /*yield*/, command.editReply("Failed to update session permissions: ".concat(getClient.message))];
                case 15:
                    _d.sent();
                    return [2 /*return*/];
                case 16:
                    client = (0, opencode_js_1.getOpencodeClient)(resolvedDirectories.projectDirectory);
                    if (!!client) return [3 /*break*/, 18];
                    return [4 /*yield*/, command.editReply('Failed to get OpenCode client')];
                case 17:
                    _d.sent();
                    return [2 /*return*/];
                case 18:
                    _d.trys.push([18, 26, , 28]);
                    return [4 /*yield*/, client.session.update({
                            sessionID: sessionId,
                            permission: buildAddDirPermissionRules({ resolvedPattern: resolvedPattern }),
                        })];
                case 19:
                    updateResponse = _d.sent();
                    if (!updateResponse.error) return [3 /*break*/, 21];
                    return [4 /*yield*/, command.editReply('Failed to update session permissions')];
                case 20:
                    _d.sent();
                    return [2 /*return*/];
                case 21: return [4 /*yield*/, restartSessionIfBusy({
                        client: client,
                        sessionId: sessionId,
                        directory: resolvedDirectories.workingDirectory,
                    })];
                case 22:
                    restarted = _d.sent();
                    if (!(restarted instanceof Error)) return [3 /*break*/, 24];
                    return [4 /*yield*/, command.editReply("Updated session permissions, but ".concat(restarted.message.toLowerCase()))];
                case 23:
                    _d.sent();
                    return [2 /*return*/];
                case 24:
                    restartSuffix = restarted
                        ? '. Restarted the in-progress session so the change applies now'
                        : '';
                    return [4 /*yield*/, command.editReply(resolvedPattern === ALL_DIRECTORIES_PATTERN
                            ? "Updated session permissions: all external directories are now allowed".concat(restartSuffix)
                            : "Updated session permissions: allowed `".concat(resolvedPattern, "`").concat(restartSuffix))];
                case 25:
                    _d.sent();
                    return [3 /*break*/, 28];
                case 26:
                    error_1 = _d.sent();
                    logger.error('[ADD-DIR] Failed to update session permissions:', error_1);
                    return [4 /*yield*/, command.editReply("Failed to update session permissions: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'))];
                case 27:
                    _d.sent();
                    return [3 /*break*/, 28];
                case 28: return [2 /*return*/];
            }
        });
    });
}
