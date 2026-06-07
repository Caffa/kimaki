"use strict";
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
// Scheduled task management terminal commands.
var goke_1 = require("goke");
var node_path_1 = require("node:path");
var logger_js_1 = require("../logger.js");
var discord_bot_js_1 = require("../discord-bot.js");
var database_js_1 = require("../database.js");
var task_schedule_js_1 = require("../task-schedule.js");
var cli_runner_js_1 = require("../cli-runner.js");
var cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
var cli = (0, goke_1.goke)();
cli
    .command('task list', 'List scheduled tasks created via send --send-at')
    .option('--all', 'Include terminal tasks (completed, cancelled, failed)')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var statuses, tasks, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                statuses = options.all
                    ? undefined
                    : ['planned', 'running'];
                return [4 /*yield*/, (0, database_js_1.listScheduledTasks)({ statuses: statuses })];
            case 2:
                tasks = _a.sent();
                if (tasks.length === 0) {
                    cliLogger.log('No scheduled tasks found');
                    process.exit(0);
                }
                console.log('id | status | message | channelId | projectName | folderName | timeRemaining | firesAt | cron');
                tasks.forEach(function (task) {
                    var projectDirectory = task.project_directory || '';
                    var projectName = projectDirectory
                        ? node_path_1.default.basename(projectDirectory)
                        : '-';
                    var folderName = projectDirectory
                        ? node_path_1.default.basename(node_path_1.default.dirname(projectDirectory))
                        : '-';
                    var firesAt = task.schedule_kind === 'at' && task.run_at
                        ? task.run_at.toISOString()
                        : '-';
                    var cronValue = task.schedule_kind === 'cron' ? task.cron_expr || '-' : '-';
                    console.log("".concat(task.id, " | ").concat(task.status, " | ").concat(task.prompt_preview, " | ").concat(task.channel_id || '-', " | ").concat(projectName, " | ").concat(folderName, " | ").concat((0, cli_runner_js_1.formatRelativeTime)(task.next_run_at), " | ").concat(firesAt, " | ").concat(cronValue));
                });
                process.exit(0);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                cliLogger.error('Error:', error_1 instanceof Error ? error_1.stack : String(error_1));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
cli
    .command('task delete <id>', 'Cancel a scheduled task by ID')
    .action(function (id) { return __awaiter(void 0, void 0, void 0, function () {
    var taskId, cancelled, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                taskId = Number.parseInt(id, 10);
                if (Number.isNaN(taskId) || taskId < 1) {
                    cliLogger.error("Invalid task ID: ".concat(id));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, database_js_1.cancelScheduledTask)(taskId)];
            case 2:
                cancelled = _a.sent();
                if (!cancelled) {
                    cliLogger.error("Task ".concat(taskId, " not found or already finalized"));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                cliLogger.log("Cancelled task ".concat(taskId));
                process.exit(0);
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                cliLogger.error('Error:', error_2 instanceof Error ? error_2.stack : String(error_2));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
cli
    .command('task edit <id>', 'Edit prompt or schedule of a planned task')
    .option('--prompt <prompt>', 'New prompt text')
    .option('--send-at <sendAt>', 'New schedule (UTC ISO date or cron expression)')
    .action(function (id, options) { return __awaiter(void 0, void 0, void 0, function () {
    var trimmedPrompt, taskId, task, existingPayload, newPrompt, updatedPayload, updateData, parsed, updated, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                trimmedPrompt = options.prompt === undefined ? undefined : options.prompt.trim();
                if (!trimmedPrompt && !options.sendAt) {
                    cliLogger.error('Provide at least --prompt or --send-at');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (trimmedPrompt !== undefined && trimmedPrompt.length === 0) {
                    cliLogger.error('--prompt cannot be empty');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (trimmedPrompt !== undefined && trimmedPrompt.length > 1900) {
                    cliLogger.error('--prompt currently supports up to 1900 characters');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                taskId = Number.parseInt(id, 10);
                if (Number.isNaN(taskId) || taskId < 1) {
                    cliLogger.error("Invalid task ID: ".concat(id));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                return [4 /*yield*/, (0, discord_bot_js_1.initDatabase)()];
            case 1:
                _a.sent();
                return [4 /*yield*/, (0, database_js_1.getScheduledTask)(taskId)];
            case 2:
                task = _a.sent();
                if (!task) {
                    cliLogger.error("Task ".concat(taskId, " not found"));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (task.status !== 'planned') {
                    cliLogger.error("Task ".concat(taskId, " is ").concat(task.status, ", only planned tasks can be edited"));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                existingPayload = (0, task_schedule_js_1.parseScheduledTaskPayload)(task.payload_json);
                if (existingPayload instanceof Error) {
                    cliLogger.error("Failed to parse task payload: ".concat(existingPayload.message));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                newPrompt = trimmedPrompt !== null && trimmedPrompt !== void 0 ? trimmedPrompt : existingPayload.prompt;
                updatedPayload = __assign(__assign({}, existingPayload), { prompt: newPrompt });
                updateData = {
                    taskId: taskId,
                    payloadJson: (0, task_schedule_js_1.serializeScheduledTaskPayload)(updatedPayload),
                    promptPreview: (0, task_schedule_js_1.getPromptPreview)(newPrompt),
                };
                if (options.sendAt) {
                    parsed = (0, task_schedule_js_1.parseSendAtValue)({
                        value: options.sendAt,
                        now: new Date(),
                        timezone: 'UTC',
                    });
                    if (parsed instanceof Error) {
                        cliLogger.error("Invalid --send-at: ".concat(parsed.message));
                        process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                    }
                    updateData.scheduleKind = parsed.scheduleKind;
                    updateData.runAt = parsed.runAt;
                    updateData.cronExpr = parsed.cronExpr;
                    updateData.timezone = parsed.timezone;
                    updateData.nextRunAt = parsed.nextRunAt;
                }
                return [4 /*yield*/, (0, database_js_1.updateScheduledTask)(updateData)];
            case 3:
                updated = _a.sent();
                if (!updated) {
                    cliLogger.error("Task ".concat(taskId, " could not be updated (status may have changed)"));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                cliLogger.log("Updated task ".concat(taskId));
                process.exit(0);
                return [3 /*break*/, 5];
            case 4:
                error_3 = _a.sent();
                cliLogger.error('Error:', error_3 instanceof Error ? error_3.stack : String(error_3));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
exports.default = cli;
