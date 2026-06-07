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
Object.defineProperty(exports, "__esModule", { value: true });
// File upload terminal command for sharing local files into Discord threads.
var goke_1 = require("goke");
var prompts_1 = require("@clack/prompts");
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var logger_js_1 = require("../logger.js");
var discord_bot_js_1 = require("../discord-bot.js");
var database_js_1 = require("../database.js");
var discord_utils_js_1 = require("../discord-utils.js");
var cli_runner_js_1 = require("../cli-runner.js");
var cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
var cli = (0, goke_1.goke)();
cli
    .command('upload-to-discord [...files]', 'Upload files to a Discord thread for a session')
    .option('-s, --session <sessionId>', 'OpenCode session ID')
    .action(function (files, options) { return __awaiter(void 0, void 0, void 0, function () {
    var sessionId, resolvedFiles, _i, resolvedFiles_1, file, threadId, botRow, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                sessionId = options.session;
                if (!sessionId) {
                    cliLogger.error('Session ID is required. Use --session <sessionId>');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (!files || files.length === 0) {
                    cliLogger.error('At least one file path is required');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                resolvedFiles = files.map(function (f) { return node_path_1.default.resolve(f); });
                for (_i = 0, resolvedFiles_1 = resolvedFiles; _i < resolvedFiles_1.length; _i++) {
                    file = resolvedFiles_1[_i];
                    if (!node_fs_1.default.existsSync(file)) {
                        cliLogger.error("File not found: ".concat(file));
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                }
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, database_js_1.getThreadIdBySessionId)(sessionId)];
            case 2:
                threadId = _a.sent();
                if (!threadId) {
                    cliLogger.error("No Discord thread found for session: ".concat(sessionId));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, (0, database_js_1.getBotTokenWithMode)()];
            case 3:
                botRow = _a.sent();
                if (!botRow) {
                    cliLogger.error('No bot credentials found. Run `kimaki` first to set up the bot.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                cliLogger.log("Uploading ".concat(resolvedFiles.length, " file(s)..."));
                return [4 /*yield*/, (0, discord_utils_js_1.uploadFilesToDiscord)({
                        threadId: threadId,
                        botToken: botRow.token,
                        files: resolvedFiles,
                    })];
            case 4:
                _a.sent();
                cliLogger.log("Uploaded ".concat(resolvedFiles.length, " file(s)!"));
                (0, prompts_1.note)("Files uploaded to Discord thread!\n\nFiles: ".concat(resolvedFiles.map(function (f) { return node_path_1.default.basename(f); }).join(', ')), '✅ Success');
                process.exit(0);
                return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                cliLogger.error('Error:', error_1 instanceof Error ? error_1.stack : String(error_1));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
exports.default = cli;
