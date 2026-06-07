"use strict";
// /run-shell-command command - Run an arbitrary shell command in the project directory.
// Resolves the project directory from the channel and executes the command with it as cwd.
// Also used by the ! prefix shortcut in discord messages (e.g. "!ls -la").
// Messages starting with ! are intercepted before session handling and routed here.
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
exports.runShellCommand = runShellCommand;
exports.handleRunCommand = handleRunCommand;
var discord_js_1 = require("discord.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var worktrees_js_1 = require("../worktrees.js");
var utils_js_1 = require("../utils.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.INTERACTION);
var MAX_OUTPUT_CHARS = 1900;
function runShellCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, stdout, stderr, output, header, error_1, execError, output, exitCode, header;
        var _d;
        var command = _b.command, directory = _b.directory;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    _e.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)(command, { cwd: directory })];
                case 1:
                    _c = _e.sent(), stdout = _c.stdout, stderr = _c.stderr;
                    output = (0, utils_js_1.stripAnsi)([stdout, stderr].filter(Boolean).join('\n').trim());
                    header = "`".concat(command, "` exited with 0");
                    if (!output) {
                        return [2 /*return*/, header];
                    }
                    return [2 /*return*/, formatOutput(output, header)];
                case 2:
                    error_1 = _e.sent();
                    execError = error_1;
                    output = (0, utils_js_1.stripAnsi)([execError.stdout, execError.stderr].filter(Boolean).join('\n').trim());
                    exitCode = (_d = execError.code) !== null && _d !== void 0 ? _d : 1;
                    logger.error("[RUN-COMMAND] Command \"".concat(command, "\" exited with ").concat(exitCode, ":"), error_1);
                    header = "`".concat(command, "` exited with ").concat(exitCode);
                    return [2 /*return*/, formatOutput(output || execError.message || 'Unknown error', header)];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function handleRunCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, isThread, isTextChannel, resolved, input, result;
        var command = _b.command;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel.',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/];
                case 2:
                    isThread = [
                        discord_js_1.ChannelType.PublicThread,
                        discord_js_1.ChannelType.PrivateThread,
                        discord_js_1.ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                    isTextChannel = channel.type === discord_js_1.ChannelType.GuildText;
                    if (!(!isThread && !isTextChannel)) return [3 /*break*/, 4];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a text channel or thread.',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: channel,
                    })];
                case 5:
                    resolved = _c.sent();
                    if (!!resolved) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory for this channel.',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7:
                    input = command.options.getString('command', true);
                    return [4 /*yield*/, command.deferReply()];
                case 8:
                    _c.sent();
                    return [4 /*yield*/, runShellCommand({
                            command: input,
                            directory: resolved.workingDirectory,
                        })];
                case 9:
                    result = _c.sent();
                    return [4 /*yield*/, command.editReply({ content: result })];
                case 10:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function formatOutput(output, header) {
    // Reserve space for header + newline + code block delimiters (```\n...\n```)
    var overhead = header.length + 1 + 3 + 1 + 1 + 3; // header\n```\n...\n```
    var maxContent = MAX_OUTPUT_CHARS - overhead;
    var truncated = output.length > maxContent
        ? output.slice(0, maxContent - 14) + '\n... truncated'
        : output;
    return "".concat(header, "\n```\n").concat(truncated, "\n```");
}
