"use strict";
// Discord slash command registration logic, extracted from cli.ts to avoid
// circular dependencies (cli → discord-bot → interaction-handler → command → cli).
// Imported by both cli.ts (startup registration) and restart-opencode-server.ts
// (post-restart re-registration).
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
exports.SKIP_USER_COMMANDS = void 0;
exports.registerCommands = registerCommands;
var discord_js_1 = require("discord.js");
var discord_urls_js_1 = require("./discord-urls.js");
var logger_js_1 = require("./logger.js");
var store_js_1 = require("./store.js");
var agent_js_1 = require("./commands/agent.js");
var database_js_1 = require("./database.js");
var model_js_1 = require("./commands/model.js");
var cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
// Commands to skip when registering user commands (reserved names)
exports.SKIP_USER_COMMANDS = ['init'];
function getDiscordCommandSuffix(command) {
    if (command.source === 'skill') {
        return '-skill';
    }
    if (command.source === 'mcp') {
        return '-mcp-prompt';
    }
    return '-cmd';
}
function isDiscordCommandSummary(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    var id = Reflect.get(value, 'id');
    var name = Reflect.get(value, 'name');
    return typeof id === 'string' && typeof name === 'string';
}
function deleteLegacyGlobalCommands(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var response, legacyGlobalCommands, deletionResults, failedDeletions, deletedCount, error_1;
        var _this = this;
        var rest = _b.rest, appId = _b.appId, commandNames = _b.commandNames;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, rest.get(discord_js_1.Routes.applicationCommands(appId))];
                case 1:
                    response = _c.sent();
                    if (!Array.isArray(response)) {
                        cliLogger.warn('COMMANDS: Unexpected global command payload while cleaning legacy global commands');
                        return [2 /*return*/];
                    }
                    legacyGlobalCommands = response
                        .filter(isDiscordCommandSummary)
                        .filter(function (command) {
                        return commandNames.has(command.name);
                    });
                    if (legacyGlobalCommands.length === 0) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, Promise.allSettled(legacyGlobalCommands.map(function (command) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, rest.delete(discord_js_1.Routes.applicationCommand(appId, command.id))];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/, command];
                                }
                            });
                        }); }))];
                case 2:
                    deletionResults = _c.sent();
                    failedDeletions = deletionResults.filter(function (result) {
                        return result.status === 'rejected';
                    });
                    if (failedDeletions.length > 0) {
                        cliLogger.warn("COMMANDS: Failed to delete ".concat(failedDeletions.length, " legacy global command(s)"));
                    }
                    deletedCount = deletionResults.length - failedDeletions.length;
                    if (deletedCount > 0) {
                        cliLogger.info("COMMANDS: Deleted ".concat(deletedCount, " legacy global command(s) to avoid guild/global duplicates"));
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    cliLogger.warn("COMMANDS: Could not clean legacy global commands: ".concat(error_1 instanceof Error ? error_1.stack : String(error_1)));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Discord slash command descriptions must be 1-100 chars.
// Truncate to 100 so @sapphire/shapeshift validation never throws.
function truncateCommandDescription(description) {
    return description.slice(0, 100);
}
function registerCommands(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var commands, primaryAgents, _i, primaryAgents_1, agent, sanitizedName, agentSuffix, agentBaseName, commandName, description, newRegisteredCommands, sourceOrder, sortedUserCommands, _c, sortedUserCommands_1, cmd, sanitizedName, commandSuffix, baseName, commandName, description, recentModels, _d, recentModels_1, model, sanitizedName, modelSuffix, baseName, commandName, description, MAX_DISCORD_COMMANDS, staticCount, agentCount, userCommandCount, modelCount, skillCount, mcpCount, rest, uniqueGuildIds, guildCommandNames, results, failedGuilds, successfulGuilds, firstRegisteredCount, registeredCommandCount, isGateway, error_2;
        var _this = this;
        var token = _b.token, appId = _b.appId, guildIds = _b.guildIds, _e = _b.userCommands, userCommands = _e === void 0 ? [] : _e, _f = _b.agents, agents = _f === void 0 ? [] : _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    commands = [
                        new discord_js_1.SlashCommandBuilder()
                            .setName('resume')
                            .setDescription(truncateCommandDescription('Resume an existing OpenCode session'))
                            .addStringOption(function (option) {
                            option
                                .setName('session')
                                .setDescription(truncateCommandDescription('The session to resume'))
                                .setRequired(true)
                                .setAutocomplete(true);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('new-session')
                            .setDescription(truncateCommandDescription('Start a new OpenCode session'))
                            .addStringOption(function (option) {
                            option
                                .setName('prompt')
                                .setDescription(truncateCommandDescription('Prompt content for the session'))
                                .setRequired(true);
                            return option;
                        })
                            .addStringOption(function (option) {
                            option
                                .setName('files')
                                .setDescription(truncateCommandDescription('Files to mention (comma or space separated; autocomplete)'))
                                .setAutocomplete(true)
                                .setMaxLength(6000);
                            return option;
                        })
                            .addStringOption(function (option) {
                            option
                                .setName('agent')
                                .setDescription(truncateCommandDescription('Agent to use for this session'))
                                .setAutocomplete(true);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('new-worktree')
                            .setDescription(truncateCommandDescription('Create a git worktree from the current HEAD by default. Optionally pick a base branch.'))
                            .addStringOption(function (option) {
                            option
                                .setName('name')
                                .setDescription(truncateCommandDescription('Name for worktree (optional in threads - uses thread name)'))
                                .setRequired(false);
                            return option;
                        })
                            .addStringOption(function (option) {
                            option
                                .setName('base-branch')
                                .setDescription(truncateCommandDescription('Branch to create the worktree from (default: current HEAD)'))
                                .setRequired(false)
                                .setAutocomplete(true);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('merge-worktree')
                            .setDescription(truncateCommandDescription('Squash-merge worktree into default branch. Aborts if main has uncommitted changes.'))
                            .addStringOption(function (option) {
                            option
                                .setName('target-branch')
                                .setDescription(truncateCommandDescription('Branch to merge into (default: origin/HEAD or main)'))
                                .setRequired(false)
                                .setAutocomplete(true);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('toggle-worktrees')
                            .setDescription(truncateCommandDescription('Toggle automatic git worktree creation for new sessions in this channel'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('worktrees')
                            .setDescription(truncateCommandDescription('List all active worktree sessions'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('last-sessions')
                            .setDescription(truncateCommandDescription('List the 20 most recently active sessions across all projects'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('tasks')
                            .setDescription(truncateCommandDescription('List scheduled tasks created via send --send-at'))
                            .addBooleanOption(function (option) {
                            return option
                                .setName('all')
                                .setDescription(truncateCommandDescription('Include completed, cancelled, and failed tasks'));
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('add-project')
                            .setDescription(truncateCommandDescription('Create Discord channels for a project. Use `npx kimaki project add` for unlisted projects'))
                            .addStringOption(function (option) {
                            option
                                .setName('project')
                                .setDescription(truncateCommandDescription('Recent OpenCode projects. Use `npx kimaki project add` if not listed'))
                                .setRequired(true)
                                .setAutocomplete(true);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('remove-project')
                            .setDescription(truncateCommandDescription('Remove Discord channels for a project'))
                            .addStringOption(function (option) {
                            option
                                .setName('project')
                                .setDescription(truncateCommandDescription('Select a project to remove'))
                                .setRequired(true)
                                .setAutocomplete(true);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('create-new-project')
                            .setDescription(truncateCommandDescription('Create a new project folder, initialize git, and start a session'))
                            .addStringOption(function (option) {
                            option
                                .setName('name')
                                .setDescription(truncateCommandDescription('Name for the new project folder'))
                                .setRequired(true);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('add-dir')
                            .setDescription(truncateCommandDescription('Allow the current session to access an extra directory or * for all folders'))
                            .addStringOption(function (option) {
                            option
                                .setName('directory')
                                .setDescription(truncateCommandDescription('Directory to allow, resolved from the current worktree. Use * for all folders'))
                                .setRequired(false);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('abort')
                            .setDescription(truncateCommandDescription('Abort the current OpenCode request in this thread'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('compact')
                            .setDescription(truncateCommandDescription('Compact the session context by summarizing conversation history'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('share')
                            .setDescription(truncateCommandDescription('Share the current session as a public URL'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('diff')
                            .setDescription(truncateCommandDescription('Show git diff as a shareable URL'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('fork')
                            .setDescription(truncateCommandDescription('Fork the session from a past user message'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('fork-subagent')
                            .setDescription(truncateCommandDescription('Fork a subagent task session into a new thread'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('btw')
                            .setDescription(truncateCommandDescription('Ask something without polluting or blocking the current session'))
                            .addStringOption(function (option) {
                            option
                                .setName('prompt')
                                .setDescription(truncateCommandDescription('The message to send in the forked session'))
                                .setRequired(true);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('model')
                            .setDescription(truncateCommandDescription('Set the preferred model for this channel or session'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('model-variant')
                            .setDescription(truncateCommandDescription('Change thinking level for current model. Tied to the model; lost when you switch models'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('unset-model-override')
                            .setDescription(truncateCommandDescription('Remove model override and use default instead'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('login')
                            .setDescription(truncateCommandDescription('Authenticate with an AI provider (OAuth or API key). Use this instead of /connect'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('agent')
                            .setDescription(truncateCommandDescription('Set the preferred agent for this channel or session'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('queue')
                            .setDescription(truncateCommandDescription('Queue a message to be sent after the current response finishes'))
                            .addStringOption(function (option) {
                            option
                                .setName('message')
                                .setDescription(truncateCommandDescription('The message to queue'))
                                .setRequired(true);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('clear-queue')
                            .setDescription(truncateCommandDescription('Clear all queued messages in this thread'))
                            .addIntegerOption(function (option) {
                            option
                                .setName('position')
                                .setDescription(truncateCommandDescription('1-based queued message position to clear (default: all)'))
                                .setMinValue(1);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('queue-command')
                            .setDescription(truncateCommandDescription('Queue a user command to run after the current response finishes'))
                            .addStringOption(function (option) {
                            option
                                .setName('command')
                                .setDescription(truncateCommandDescription('The command to run'))
                                .setRequired(true)
                                .setAutocomplete(true);
                            return option;
                        })
                            .addStringOption(function (option) {
                            option
                                .setName('arguments')
                                .setDescription(truncateCommandDescription('Arguments to pass to the command'))
                                .setRequired(false);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('undo')
                            .setDescription(truncateCommandDescription('Undo the last assistant message (revert file changes)'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('redo')
                            .setDescription(truncateCommandDescription('Redo previously undone changes'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('verbosity')
                            .setDescription(truncateCommandDescription('Set output verbosity for this channel'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('restart-opencode-server')
                            .setDescription(truncateCommandDescription('Restart opencode server and re-register slash commands'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('run-shell-command')
                            .setDescription(truncateCommandDescription('Run a shell command in the project directory. Tip: prefix messages with ! as shortcut'))
                            .addStringOption(function (option) {
                            option
                                .setName('command')
                                .setDescription(truncateCommandDescription('Command to run'))
                                .setRequired(true);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('context-usage')
                            .setDescription(truncateCommandDescription('Show token usage and context window percentage for this session'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('session-id')
                            .setDescription(truncateCommandDescription('Show current session ID and opencode attach command for this thread'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('upgrade-and-restart')
                            .setDescription(truncateCommandDescription('Upgrade kimaki to the latest version and restart the bot'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('transcription-key')
                            .setDescription(truncateCommandDescription('Set API key for voice message transcription (OpenAI or Gemini)'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('link-voice-channel')
                            .setDescription(truncateCommandDescription('Link a voice channel to a project directory for voice assistant'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('mcp')
                            .setDescription(truncateCommandDescription('List and manage MCP servers for this project'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('screenshare')
                            .setDescription(truncateCommandDescription('Start screen sharing via VNC tunnel (auto-stops after 30 minutes)'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('screenshare-stop')
                            .setDescription(truncateCommandDescription('Stop screen sharing'))
                            .setDMPermission(false)
                            .toJSON(),
                        new discord_js_1.SlashCommandBuilder()
                            .setName('vscode')
                            .setDescription(truncateCommandDescription('Open VS Code in the browser for this project or worktree (auto-stops after 30 minutes)'))
                            .setDMPermission(false)
                            .toJSON(),
                    ];
                    primaryAgents = agents.filter(function (a) { return (a.mode === 'primary' || a.mode === 'all') && !a.hidden; });
                    for (_i = 0, primaryAgents_1 = primaryAgents; _i < primaryAgents_1.length; _i++) {
                        agent = primaryAgents_1[_i];
                        sanitizedName = (0, agent_js_1.sanitizeAgentName)(agent.name);
                        // Skip if sanitized name is empty or would create invalid command name
                        // Discord command names must start with a lowercase letter or number
                        if (!sanitizedName || !/^[a-z0-9]/.test(sanitizedName)) {
                            continue;
                        }
                        agentSuffix = '-agent';
                        agentBaseName = sanitizedName.slice(0, 32 - agentSuffix.length);
                        commandName = "".concat(agentBaseName).concat(agentSuffix);
                        description = (0, agent_js_1.buildQuickAgentCommandDescription)({
                            agentName: agent.name,
                            description: agent.description,
                        });
                        commands.push(new discord_js_1.SlashCommandBuilder()
                            .setName(commandName)
                            .setDescription(truncateCommandDescription(description))
                            .setDMPermission(false)
                            .toJSON());
                    }
                    newRegisteredCommands = [];
                    sourceOrder = { config: 0, skill: 1, mcp: 2 };
                    sortedUserCommands = __spreadArray([], userCommands, true).sort(function (a, b) {
                        var _a, _b;
                        return ((_a = sourceOrder[a.source || '']) !== null && _a !== void 0 ? _a : 0) - ((_b = sourceOrder[b.source || '']) !== null && _b !== void 0 ? _b : 0);
                    });
                    for (_c = 0, sortedUserCommands_1 = sortedUserCommands; _c < sortedUserCommands_1.length; _c++) {
                        cmd = sortedUserCommands_1[_c];
                        if (exports.SKIP_USER_COMMANDS.includes(cmd.name)) {
                            continue;
                        }
                        sanitizedName = cmd.name
                            .toLowerCase()
                            .replace(/[:/]/g, '-') // Replace : and / with hyphens first
                            .replace(/[^a-z0-9-]/g, '-') // Replace any other non-alphanumeric chars
                            .replace(/-+/g, '-') // Collapse multiple hyphens
                            .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
                        ;
                        // Skip if sanitized name is empty - would create invalid command name like "-cmd"
                        if (!sanitizedName) {
                            continue;
                        }
                        commandSuffix = getDiscordCommandSuffix(cmd);
                        baseName = sanitizedName.slice(0, 32 - commandSuffix.length);
                        commandName = "".concat(baseName).concat(commandSuffix);
                        description = cmd.description || "Run /".concat(cmd.name, " command");
                        newRegisteredCommands.push({
                            name: cmd.name,
                            discordCommandName: commandName,
                            description: description,
                            source: cmd.source,
                        });
                        commands.push(new discord_js_1.SlashCommandBuilder()
                            .setName(commandName)
                            .setDescription(truncateCommandDescription(description))
                            .addStringOption(function (option) {
                            option
                                .setName('arguments')
                                .setDescription(truncateCommandDescription('Arguments to pass to the command'))
                                .setRequired(false);
                            return option;
                        })
                            .setDMPermission(false)
                            .toJSON());
                    }
                    return [4 /*yield*/, (0, database_js_1.getRecentModels)(appId).catch(function (e) {
                            cliLogger.warn("COMMANDS: Failed to fetch recent models for ".concat(appId, ": ").concat(e.message));
                            return [];
                        })];
                case 1:
                    recentModels = _g.sent();
                    for (_d = 0, recentModels_1 = recentModels; _d < recentModels_1.length; _d++) {
                        model = recentModels_1[_d];
                        sanitizedName = (0, model_js_1.sanitizeModelName)(model.model_id);
                        // Skip if sanitized name is empty or would create invalid command name
                        if (!sanitizedName || !/^[a-z0-9]/.test(sanitizedName)) {
                            continue;
                        }
                        modelSuffix = '-model';
                        baseName = sanitizedName.slice(0, 32 - modelSuffix.length);
                        commandName = "".concat(baseName).concat(modelSuffix);
                        description = (0, model_js_1.buildQuickModelCommandDescription)({
                            modelId: model.model_id,
                            variant: model.variant,
                        });
                        commands.push(new discord_js_1.SlashCommandBuilder()
                            .setName(commandName)
                            .setDescription(truncateCommandDescription(description))
                            .setDMPermission(false)
                            .toJSON());
                    }
                    store_js_1.store.setState({ registeredUserCommands: newRegisteredCommands });
                    MAX_DISCORD_COMMANDS = 100;
                    staticCount = 44 // hardcoded static commands defined above
                    ;
                    agentCount = primaryAgents.length;
                    userCommandCount = newRegisteredCommands.length;
                    modelCount = recentModels.length;
                    skillCount = userCommands.filter(function (c) { return c.source === 'skill'; }).length;
                    mcpCount = userCommands.filter(function (c) { return c.source === 'mcp'; }).length;
                    if (commands.length > MAX_DISCORD_COMMANDS) {
                        cliLogger.warn("COMMANDS: ".concat(commands.length, " commands exceed Discord limit of ").concat(MAX_DISCORD_COMMANDS, ", truncating to ").concat(MAX_DISCORD_COMMANDS));
                        cliLogger.info("COMMANDS: Breakdown: ".concat(staticCount, " static, ").concat(agentCount, " agents, ").concat(userCommandCount, " user commands (").concat(skillCount, " skills, ").concat(mcpCount, " MCP), ").concat(modelCount, " recent models"));
                        commands.length = MAX_DISCORD_COMMANDS;
                    }
                    rest = (0, discord_urls_js_1.createDiscordRest)(token);
                    uniqueGuildIds = Array.from(new Set(guildIds.filter(function (guildId) { return guildId; })));
                    guildCommandNames = new Set(commands
                        .map(function (command) {
                        return command.name;
                    })
                        .filter(function (name) {
                        return typeof name === 'string';
                    }));
                    if (uniqueGuildIds.length === 0) {
                        cliLogger.warn('COMMANDS: No guilds available, skipping slash command registration');
                        return [2 /*return*/];
                    }
                    _g.label = 2;
                case 2:
                    _g.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, Promise.allSettled(uniqueGuildIds.map(function (guildId) { return __awaiter(_this, void 0, void 0, function () {
                            var response, registeredCount;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, rest.put(discord_js_1.Routes.applicationGuildCommands(appId, guildId), {
                                            body: commands,
                                        })];
                                    case 1:
                                        response = _a.sent();
                                        registeredCount = Array.isArray(response)
                                            ? response.length
                                            : commands.length;
                                        return [2 /*return*/, { guildId: guildId, registeredCount: registeredCount }];
                                }
                            });
                        }); }))];
                case 3:
                    results = _g.sent();
                    failedGuilds = results
                        .map(function (result, index) {
                        if (result.status === 'fulfilled') {
                            return null;
                        }
                        return {
                            guildId: uniqueGuildIds[index],
                            error: result.reason instanceof Error
                                ? result.reason.message
                                : String(result.reason),
                        };
                    })
                        .filter(function (value) {
                        return value !== null;
                    });
                    if (failedGuilds.length > 0) {
                        failedGuilds.forEach(function (failure) {
                            cliLogger.warn("COMMANDS: Failed to register slash commands for guild ".concat(failure.guildId, ": ").concat(failure.error));
                        });
                        throw new Error("Failed to register slash commands for ".concat(failedGuilds.length, " guild(s)"));
                    }
                    successfulGuilds = results.length;
                    firstRegisteredCount = results[0];
                    registeredCommandCount = firstRegisteredCount && firstRegisteredCount.status === 'fulfilled'
                        ? firstRegisteredCount.value.registeredCount
                        : commands.length;
                    isGateway = store_js_1.store.getState().discordBaseUrl !== 'https://discord.com';
                    if (!!isGateway) return [3 /*break*/, 5];
                    return [4 /*yield*/, deleteLegacyGlobalCommands({
                            rest: rest,
                            appId: appId,
                            commandNames: guildCommandNames,
                        })];
                case 4:
                    _g.sent();
                    _g.label = 5;
                case 5:
                    cliLogger.info("COMMANDS: Successfully registered ".concat(registeredCommandCount, " slash commands for ").concat(successfulGuilds, " guild(s)"));
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _g.sent();
                    cliLogger.error('COMMANDS: Failed to register slash commands: ' + String(error_2));
                    throw error_2;
                case 7: return [2 /*return*/];
            }
        });
    });
}
