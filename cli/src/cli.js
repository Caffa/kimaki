#!/usr/bin/env node
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
// Main CLI entrypoint for the Kimaki Discord bot.
// Handles interactive setup, Discord OAuth, slash command registration,
// project channel creation, and launching the bot with opencode integration.
var goke_1 = require("goke");
var zod_1 = require("zod");
var node_path_1 = require("node:path");
var node_fs_1 = require("node:fs");
var node_url_1 = require("node:url");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
var config_js_1 = require("./config.js");
var upgrade_js_1 = require("./upgrade.js");
var store_js_1 = require("./store.js");
var multioauth_js_1 = require("./commands/multioauth.js");
var bot_js_1 = require("./cli-commands/bot.js");
var maintenance_js_1 = require("./cli-commands/maintenance.js");
var misc_js_1 = require("./cli-commands/misc.js");
var project_js_1 = require("./cli-commands/project.js");
var send_js_1 = require("./cli-commands/send.js");
var session_js_1 = require("./cli-commands/session.js");
var task_js_1 = require("./cli-commands/task.js");
var user_js_1 = require("./cli-commands/user.js");
var cli_runner_js_1 = require("./cli-runner.js");
var cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
var cli = (0, goke_1.goke)('kimaki');
cli.use(multioauth_js_1.default);
process.title = 'kimaki';
cli
    .command('', 'Set up and run the Kimaki Discord bot')
    .option('--restart-onboarding', 'Prompt for new credentials even if saved')
    .option('--add-channels', 'Select OpenCode projects to create Discord channels before starting')
    .option('--data-dir <path>', 'Data directory for config and database (default: ~/.kimaki)')
    .option('--projects-dir <path>', 'Directory where new projects are created (default: <data-dir>/projects)')
    .option('--install-url', 'Print the bot install URL and exit')
    .option('--use-worktrees', 'Create git worktrees for all new sessions started from channel messages')
    .option('--enable-voice-channels', 'Create voice channels for projects (disabled by default)')
    .option('--verbosity <level>', 'Default verbosity for all channels (tools_and_text, text_and_essential_tools, or text_only)')
    .option('--mention-mode', 'Bot only responds when @mentioned (default for all channels)')
    .option('--no-critique', 'Disable automatic diff upload to critique.work in system prompts')
    .option('--auto-restart', 'Automatically restart the bot on crash or OOM kill')
    .option('--no-sentry', 'Disable Sentry error reporting')
    .option('--gateway', 'Force gateway mode (use the gateway Kimaki bot instead of a self-hosted bot)')
    .option('--gateway-callback-url <url>', 'After gateway OAuth install, redirect to this URL instead of the default success page (appends ?guild_id=<id>)')
    .option('--enable-skill <name>', zod_1.z
    .array(zod_1.z.string())
    .optional()
    .describe('Whitelist a built-in skill by name. Only the listed skills are injected into the model (all others are hidden via an opencode permission.skill deny-all rule). Repeatable: pass --enable-skill multiple times. Mutually exclusive with --disable-skill. See https://github.com/remorses/kimaki/tree/main/skills for available skills.'))
    .option('--disable-skill <name>', zod_1.z
    .array(zod_1.z.string())
    .optional()
    .describe('Blacklist a built-in skill by name. Listed skills are hidden from the model. Repeatable: pass --disable-skill multiple times. Mutually exclusive with --enable-skill. See https://github.com/remorses/kimaki/tree/main/skills for available skills.'))
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var parentLockPort, currentLockPort, usesDifferentLockPort, defaultVerbosity, enabledSkills, disabledSkills, bundledSkillsDir_1, availableBundledSkills, availableSet, _i, _a, name_1, error_1;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                parentLockPort = process.env.KIMAKI_PARENT_LOCK_PORT;
                currentLockPort = process.env.KIMAKI_LOCK_PORT;
                usesDifferentLockPort = currentLockPort !== parentLockPort;
                if (process.env.KIMAKI_OPENCODE_PROCESS && !usesDifferentLockPort) {
                    cliLogger.error('Cannot run `kimaki` inside an OpenCode session — it would kill the already-running bot process.\n' +
                        'Only one kimaki bot can run at a time (they share a lock port).\n' +
                        'Set KIMAKI_LOCK_PORT to a different port for an isolated dev process, or use `kimaki send`, `kimaki session`, and other subcommands instead.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                if (process.env.KIMAKI_OPENCODE_PROCESS && usesDifferentLockPort) {
                    delete process.env['KIMAKI_DB_URL'];
                    delete process.env['KIMAKI_DB_AUTH_TOKEN'];
                }
                _d.label = 1;
            case 1:
                _d.trys.push([1, 5, , 6]);
                // Set data directory early, before any database access
                if (options.dataDir) {
                    (0, config_js_1.setDataDir)(options.dataDir);
                    cliLogger.log("Using data directory: ".concat((0, config_js_1.getDataDir)()));
                }
                if (options.projectsDir) {
                    (0, config_js_1.setProjectsDir)(options.projectsDir);
                    cliLogger.log("Using projects directory: ".concat((0, config_js_1.getProjectsDir)()));
                }
                // Initialize file logging to <dataDir>/kimaki.log
                (0, logger_js_1.initLogFile)((0, config_js_1.getDataDir)());
                defaultVerbosity = (function () {
                    if (!options.verbosity) {
                        return undefined;
                    }
                    if (options.verbosity === 'tools_and_text') {
                        return 'tools_and_text';
                    }
                    if (options.verbosity === 'text_and_essential_tools') {
                        return 'text_and_essential_tools';
                    }
                    if (options.verbosity === 'text_only') {
                        return 'text_only';
                    }
                    cliLogger.error("Invalid verbosity level: ".concat(options.verbosity, ". Use one of: tools_and_text, text_and_essential_tools, text_only"));
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                })();
                enabledSkills = (_b = options.enableSkill) !== null && _b !== void 0 ? _b : [];
                disabledSkills = (_c = options.disableSkill) !== null && _c !== void 0 ? _c : [];
                if (enabledSkills.length > 0 && disabledSkills.length > 0) {
                    cliLogger.error('Cannot use --enable-skill and --disable-skill at the same time. Use one or the other.');
                    process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                }
                // Soft-validate skill names against the bundled skills/ folder. Users
                // may rely on skills loaded from their own .opencode / .claude / .agents
                // dirs, so unknown names only emit a warning rather than hard-failing.
                if (enabledSkills.length > 0 || disabledSkills.length > 0) {
                    bundledSkillsDir_1 = node_path_1.default.resolve(node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url)), '..', 'skills');
                    availableBundledSkills = (function () {
                        try {
                            return node_fs_1.default
                                .readdirSync(bundledSkillsDir_1, { withFileTypes: true })
                                .filter(function (entry) { return entry.isDirectory(); })
                                .map(function (entry) { return entry.name; });
                        }
                        catch (_a) {
                            return [];
                        }
                    })();
                    availableSet = new Set(availableBundledSkills);
                    for (_i = 0, _a = __spreadArray(__spreadArray([], enabledSkills, true), disabledSkills, true); _i < _a.length; _i++) {
                        name_1 = _a[_i];
                        if (!availableSet.has(name_1)) {
                            cliLogger.warn("Skill \"".concat(name_1, "\" is not a bundled kimaki skill. Rule will still apply (user-provided skills from .opencode/.claude/.agents dirs may match). Available bundled skills: ").concat(availableBundledSkills.join(', ')));
                        }
                    }
                }
                store_js_1.store.setState(__assign(__assign(__assign(__assign(__assign({}, (defaultVerbosity && {
                    defaultVerbosity: defaultVerbosity,
                })), (options.mentionMode && { defaultMentionMode: true })), (options.noCritique && { critiqueEnabled: false })), (enabledSkills.length > 0 && { enabledSkills: enabledSkills })), (disabledSkills.length > 0 && { disabledSkills: disabledSkills })));
                if (enabledSkills.length > 0) {
                    cliLogger.log("Skill whitelist enabled: only [".concat(enabledSkills.join(', '), "] will be injected"));
                }
                if (disabledSkills.length > 0) {
                    cliLogger.log("Skill blacklist enabled: [".concat(disabledSkills.join(', '), "] will be hidden"));
                }
                if (options.verbosity) {
                    cliLogger.log("Default verbosity: ".concat(options.verbosity));
                }
                if (options.mentionMode) {
                    cliLogger.log('Default mention mode: enabled (bot only responds when @mentioned)');
                }
                if (options.noCritique) {
                    cliLogger.log('Critique disabled: diffs will not be auto-uploaded to critique.work');
                }
                if (options.noSentry) {
                    process.env.KIMAKI_SENTRY_DISABLED = '1';
                    cliLogger.log('Sentry error reporting disabled (--no-sentry)');
                }
                else {
                    (0, sentry_js_1.initSentry)();
                }
                if (!options.installUrl) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, cli_runner_js_1.printDiscordInstallUrlAndExit)({
                        gateway: options.gateway,
                        gatewayCallbackUrl: options.gatewayCallbackUrl,
                    })];
            case 2:
                _d.sent();
                _d.label = 3;
            case 3: 
            // Single-instance enforcement is handled by the hrana server binding the lock port.
            // startHranaServer() in run() evicts any existing instance before binding.
            return [4 /*yield*/, (0, cli_runner_js_1.run)({
                    restartOnboarding: options.restartOnboarding,
                    addChannels: options.addChannels,
                    dataDir: options.dataDir,
                    useWorktrees: options.useWorktrees,
                    enableVoiceChannels: options.enableVoiceChannels,
                    gateway: options.gateway,
                    gatewayCallbackUrl: options.gatewayCallbackUrl,
                })];
            case 4:
                // Single-instance enforcement is handled by the hrana server binding the lock port.
                // startHranaServer() in run() evicts any existing instance before binding.
                _d.sent();
                return [3 /*break*/, 6];
            case 5:
                error_1 = _d.sent();
                cliLogger.error('Unhandled error:', (0, logger_js_1.formatErrorWithStack)(error_1));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
cli.use(bot_js_1.default);
cli.use(misc_js_1.default);
cli.use(send_js_1.default);
cli.use(task_js_1.default);
cli.use(project_js_1.default);
cli.use(user_js_1.default);
cli.use(session_js_1.default);
cli.use(maintenance_js_1.default);
cli.version((0, upgrade_js_1.getCurrentVersion)());
cli.help();
cli.parse();
