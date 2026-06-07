"use strict";
// Discord slash command and interaction handler.
// Processes all slash commands (/session, /resume, /fork, /model, /abort, etc.)
// and manages autocomplete, select menu interactions for the bot.
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
exports.registerInteractionHandler = registerInteractionHandler;
var discord_js_1 = require("discord.js");
var session_js_1 = require("./commands/session.js");
var new_worktree_js_1 = require("./commands/new-worktree.js");
var merge_worktree_js_1 = require("./commands/merge-worktree.js");
var worktree_settings_js_1 = require("./commands/worktree-settings.js");
var worktrees_js_1 = require("./commands/worktrees.js");
var tasks_js_1 = require("./commands/tasks.js");
var last_sessions_js_1 = require("./commands/last-sessions.js");
var resume_js_1 = require("./commands/resume.js");
var add_project_js_1 = require("./commands/add-project.js");
var remove_project_js_1 = require("./commands/remove-project.js");
var create_new_project_js_1 = require("./commands/create-new-project.js");
var permissions_js_1 = require("./commands/permissions.js");
var abort_js_1 = require("./commands/abort.js");
var add_dir_js_1 = require("./commands/add-dir.js");
var compact_js_1 = require("./commands/compact.js");
var share_js_1 = require("./commands/share.js");
var diff_js_1 = require("./commands/diff.js");
var fork_js_1 = require("./commands/fork.js");
var fork_subagent_js_1 = require("./commands/fork-subagent.js");
var btw_js_1 = require("./commands/btw.js");
var model_js_1 = require("./commands/model.js");
var unset_model_js_1 = require("./commands/unset-model.js");
var login_js_1 = require("./commands/login.js");
var gemini_apikey_js_1 = require("./commands/gemini-apikey.js");
var agent_js_1 = require("./commands/agent.js");
var ask_question_js_1 = require("./commands/ask-question.js");
var file_upload_js_1 = require("./commands/file-upload.js");
var action_buttons_js_1 = require("./commands/action-buttons.js");
var html_actions_js_1 = require("./html-actions.js");
var queue_js_1 = require("./commands/queue.js");
var undo_redo_js_1 = require("./commands/undo-redo.js");
var user_command_js_1 = require("./commands/user-command.js");
var verbosity_js_1 = require("./commands/verbosity.js");
var restart_opencode_server_js_1 = require("./commands/restart-opencode-server.js");
var run_command_js_1 = require("./commands/run-command.js");
var context_usage_js_1 = require("./commands/context-usage.js");
var session_id_js_1 = require("./commands/session-id.js");
var upgrade_js_1 = require("./commands/upgrade.js");
var mcp_js_1 = require("./commands/mcp.js");
var screenshare_js_1 = require("./commands/screenshare.js");
var vscode_js_1 = require("./commands/vscode.js");
var model_js_2 = require("./commands/model.js");
var model_variant_js_1 = require("./commands/model-variant.js");
var discord_utils_js_1 = require("./discord-utils.js");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
var interactionLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.INTERACTION);
function registerInteractionHandler(_a) {
    var _this = this;
    var discordClient = _a.discordClient, appId = _a.appId;
    interactionLogger.log('[REGISTER] Interaction handler registered');
    discordClient.on(discord_js_1.Events.InteractionCreate, function (interaction) { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, customId, customId, customId, error_1, replyError_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 169, , 175]);
                    interactionLogger.log("[INTERACTION] Received: ".concat(interaction.type, " - ").concat(interaction.isChatInputCommand()
                        ? interaction.commandName
                        : interaction.isAutocomplete()
                            ? "autocomplete:".concat(interaction.commandName)
                            : 'other'));
                    if (!interaction.isAutocomplete()) return [3 /*break*/, 17];
                    _a = interaction.commandName;
                    switch (_a) {
                        case 'new-session': return [3 /*break*/, 1];
                        case 'resume': return [3 /*break*/, 3];
                        case 'add-project': return [3 /*break*/, 5];
                        case 'remove-project': return [3 /*break*/, 7];
                        case 'queue-command': return [3 /*break*/, 9];
                        case 'new-worktree': return [3 /*break*/, 11];
                        case 'merge-worktree': return [3 /*break*/, 13];
                    }
                    return [3 /*break*/, 15];
                case 1: return [4 /*yield*/, (0, session_js_1.handleSessionAutocomplete)({ interaction: interaction, appId: appId })];
                case 2:
                    _c.sent();
                    return [2 /*return*/];
                case 3: return [4 /*yield*/, (0, resume_js_1.handleResumeAutocomplete)({ interaction: interaction, appId: appId })];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
                case 5: return [4 /*yield*/, (0, add_project_js_1.handleAddProjectAutocomplete)({ interaction: interaction, appId: appId })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7: return [4 /*yield*/, (0, remove_project_js_1.handleRemoveProjectAutocomplete)({ interaction: interaction, appId: appId })];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
                case 9: return [4 /*yield*/, (0, queue_js_1.handleQueueCommandAutocomplete)({ interaction: interaction, appId: appId })];
                case 10:
                    _c.sent();
                    return [2 /*return*/];
                case 11: return [4 /*yield*/, (0, new_worktree_js_1.handleNewWorktreeAutocomplete)({ interaction: interaction, appId: appId })];
                case 12:
                    _c.sent();
                    return [2 /*return*/];
                case 13: return [4 /*yield*/, (0, merge_worktree_js_1.handleMergeWorktreeAutocomplete)({ interaction: interaction, appId: appId })];
                case 14:
                    _c.sent();
                    return [2 /*return*/];
                case 15: return [4 /*yield*/, interaction.respond([])];
                case 16:
                    _c.sent();
                    return [2 /*return*/];
                case 17:
                    if (!interaction.isChatInputCommand()) return [3 /*break*/, 107];
                    if (!!(0, discord_utils_js_1.hasKimakiBotPermission)(interaction.member, interaction.guild)) return [3 /*break*/, 19];
                    return [4 /*yield*/, interaction.reply({
                            content: "You don't have permission to use this command.\nTo use Kimaki, ask a server admin to give you the **Kimaki** role.",
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 18:
                    _c.sent();
                    return [2 /*return*/];
                case 19:
                    interactionLogger.log("[COMMAND] Processing: ".concat(interaction.commandName, " (id: ").concat(interaction.id, ")"));
                    _b = interaction.commandName;
                    switch (_b) {
                        case 'new-session': return [3 /*break*/, 20];
                        case 'new-worktree': return [3 /*break*/, 22];
                        case 'merge-worktree': return [3 /*break*/, 24];
                        case 'toggle-worktrees': return [3 /*break*/, 26];
                        case 'worktrees': return [3 /*break*/, 28];
                        case 'tasks': return [3 /*break*/, 30];
                        case 'last-sessions': return [3 /*break*/, 32];
                        case 'resume': return [3 /*break*/, 34];
                        case 'add-project': return [3 /*break*/, 36];
                        case 'remove-project': return [3 /*break*/, 38];
                        case 'create-new-project': return [3 /*break*/, 40];
                        case 'abort': return [3 /*break*/, 42];
                        case 'add-dir': return [3 /*break*/, 44];
                        case 'compact': return [3 /*break*/, 46];
                        case 'share': return [3 /*break*/, 48];
                        case 'diff': return [3 /*break*/, 50];
                        case 'fork': return [3 /*break*/, 52];
                        case 'fork-subagent': return [3 /*break*/, 54];
                        case 'btw': return [3 /*break*/, 56];
                        case 'model': return [3 /*break*/, 58];
                        case 'model-variant': return [3 /*break*/, 60];
                        case 'unset-model-override': return [3 /*break*/, 62];
                        case 'login': return [3 /*break*/, 64];
                        case 'agent': return [3 /*break*/, 66];
                        case 'queue': return [3 /*break*/, 68];
                        case 'clear-queue': return [3 /*break*/, 70];
                        case 'queue-command': return [3 /*break*/, 72];
                        case 'undo': return [3 /*break*/, 74];
                        case 'redo': return [3 /*break*/, 76];
                        case 'verbosity': return [3 /*break*/, 78];
                        case 'restart-opencode-server': return [3 /*break*/, 80];
                        case 'run-shell-command': return [3 /*break*/, 82];
                        case 'context-usage': return [3 /*break*/, 84];
                        case 'session-id': return [3 /*break*/, 86];
                        case 'upgrade-and-restart': return [3 /*break*/, 88];
                        case 'transcription-key': return [3 /*break*/, 90];
                        case 'mcp': return [3 /*break*/, 92];
                        case 'screenshare': return [3 /*break*/, 94];
                        case 'screenshare-stop': return [3 /*break*/, 96];
                        case 'vscode': return [3 /*break*/, 98];
                    }
                    return [3 /*break*/, 100];
                case 20: return [4 /*yield*/, (0, session_js_1.handleSessionCommand)({ command: interaction, appId: appId })];
                case 21:
                    _c.sent();
                    return [2 /*return*/];
                case 22: return [4 /*yield*/, (0, new_worktree_js_1.handleNewWorktreeCommand)({ command: interaction, appId: appId })];
                case 23:
                    _c.sent();
                    return [2 /*return*/];
                case 24: return [4 /*yield*/, (0, merge_worktree_js_1.handleMergeWorktreeCommand)({ command: interaction, appId: appId })];
                case 25:
                    _c.sent();
                    return [2 /*return*/];
                case 26: return [4 /*yield*/, (0, worktree_settings_js_1.handleToggleWorktreesCommand)({
                        command: interaction,
                        appId: appId,
                    })];
                case 27:
                    _c.sent();
                    return [2 /*return*/];
                case 28: return [4 /*yield*/, (0, worktrees_js_1.handleWorktreesCommand)({
                        command: interaction,
                        appId: appId,
                    })];
                case 29:
                    _c.sent();
                    return [2 /*return*/];
                case 30: return [4 /*yield*/, (0, tasks_js_1.handleTasksCommand)({
                        command: interaction,
                        appId: appId,
                    })];
                case 31:
                    _c.sent();
                    return [2 /*return*/];
                case 32: return [4 /*yield*/, (0, last_sessions_js_1.handleLastSessionsCommand)({
                        command: interaction,
                        appId: appId,
                    })];
                case 33:
                    _c.sent();
                    return [2 /*return*/];
                case 34: return [4 /*yield*/, (0, resume_js_1.handleResumeCommand)({ command: interaction, appId: appId })];
                case 35:
                    _c.sent();
                    return [2 /*return*/];
                case 36: return [4 /*yield*/, (0, add_project_js_1.handleAddProjectCommand)({ command: interaction, appId: appId })];
                case 37:
                    _c.sent();
                    return [2 /*return*/];
                case 38: return [4 /*yield*/, (0, remove_project_js_1.handleRemoveProjectCommand)({ command: interaction, appId: appId })];
                case 39:
                    _c.sent();
                    return [2 /*return*/];
                case 40: return [4 /*yield*/, (0, create_new_project_js_1.handleCreateNewProjectCommand)({
                        command: interaction,
                        appId: appId,
                    })];
                case 41:
                    _c.sent();
                    return [2 /*return*/];
                case 42: return [4 /*yield*/, (0, abort_js_1.handleAbortCommand)({ command: interaction, appId: appId })];
                case 43:
                    _c.sent();
                    return [2 /*return*/];
                case 44: return [4 /*yield*/, (0, add_dir_js_1.handleAddDirCommand)({ command: interaction, appId: appId })];
                case 45:
                    _c.sent();
                    return [2 /*return*/];
                case 46: return [4 /*yield*/, (0, compact_js_1.handleCompactCommand)({ command: interaction, appId: appId })];
                case 47:
                    _c.sent();
                    return [2 /*return*/];
                case 48: return [4 /*yield*/, (0, share_js_1.handleShareCommand)({ command: interaction, appId: appId })];
                case 49:
                    _c.sent();
                    return [2 /*return*/];
                case 50: return [4 /*yield*/, (0, diff_js_1.handleDiffCommand)({ command: interaction, appId: appId })];
                case 51:
                    _c.sent();
                    return [2 /*return*/];
                case 52: return [4 /*yield*/, (0, fork_js_1.handleForkCommand)(interaction)];
                case 53:
                    _c.sent();
                    return [2 /*return*/];
                case 54: return [4 /*yield*/, (0, fork_subagent_js_1.handleForkSubagentCommand)(interaction)];
                case 55:
                    _c.sent();
                    return [2 /*return*/];
                case 56: return [4 /*yield*/, (0, btw_js_1.handleBtwCommand)({ command: interaction, appId: appId })];
                case 57:
                    _c.sent();
                    return [2 /*return*/];
                case 58:
                    interactionLogger.log("[COMMAND] Dispatching to handleModelCommand (interaction: ".concat(interaction.id, ")"));
                    return [4 /*yield*/, (0, model_js_1.handleModelCommand)({ interaction: interaction, appId: appId })];
                case 59:
                    _c.sent();
                    return [2 /*return*/];
                case 60: return [4 /*yield*/, (0, model_variant_js_1.handleModelVariantCommand)({ interaction: interaction, appId: appId })];
                case 61:
                    _c.sent();
                    return [2 /*return*/];
                case 62: return [4 /*yield*/, (0, unset_model_js_1.handleUnsetModelCommand)({ interaction: interaction, appId: appId })];
                case 63:
                    _c.sent();
                    return [2 /*return*/];
                case 64: return [4 /*yield*/, (0, login_js_1.handleLoginCommand)({ interaction: interaction, appId: appId })];
                case 65:
                    _c.sent();
                    return [2 /*return*/];
                case 66: return [4 /*yield*/, (0, agent_js_1.handleAgentCommand)({ interaction: interaction, appId: appId })];
                case 67:
                    _c.sent();
                    return [2 /*return*/];
                case 68: return [4 /*yield*/, (0, queue_js_1.handleQueueCommand)({ command: interaction, appId: appId })];
                case 69:
                    _c.sent();
                    return [2 /*return*/];
                case 70: return [4 /*yield*/, (0, queue_js_1.handleClearQueueCommand)({ command: interaction, appId: appId })];
                case 71:
                    _c.sent();
                    return [2 /*return*/];
                case 72: return [4 /*yield*/, (0, queue_js_1.handleQueueCommandCommand)({ command: interaction, appId: appId })];
                case 73:
                    _c.sent();
                    return [2 /*return*/];
                case 74: return [4 /*yield*/, (0, undo_redo_js_1.handleUndoCommand)({ command: interaction, appId: appId })];
                case 75:
                    _c.sent();
                    return [2 /*return*/];
                case 76: return [4 /*yield*/, (0, undo_redo_js_1.handleRedoCommand)({ command: interaction, appId: appId })];
                case 77:
                    _c.sent();
                    return [2 /*return*/];
                case 78: return [4 /*yield*/, (0, verbosity_js_1.handleVerbosityCommand)({ command: interaction, appId: appId })];
                case 79:
                    _c.sent();
                    return [2 /*return*/];
                case 80: return [4 /*yield*/, (0, restart_opencode_server_js_1.handleRestartOpencodeServerCommand)({
                        command: interaction,
                        appId: appId,
                    })];
                case 81:
                    _c.sent();
                    return [2 /*return*/];
                case 82: return [4 /*yield*/, (0, run_command_js_1.handleRunCommand)({ command: interaction, appId: appId })];
                case 83:
                    _c.sent();
                    return [2 /*return*/];
                case 84: return [4 /*yield*/, (0, context_usage_js_1.handleContextUsageCommand)({ command: interaction, appId: appId })];
                case 85:
                    _c.sent();
                    return [2 /*return*/];
                case 86: return [4 /*yield*/, (0, session_id_js_1.handleSessionIdCommand)({ command: interaction, appId: appId })];
                case 87:
                    _c.sent();
                    return [2 /*return*/];
                case 88: return [4 /*yield*/, (0, upgrade_js_1.handleUpgradeAndRestartCommand)({
                        command: interaction,
                        appId: appId,
                    })];
                case 89:
                    _c.sent();
                    return [2 /*return*/];
                case 90: return [4 /*yield*/, (0, gemini_apikey_js_1.handleTranscriptionApiKeyCommand)({
                        interaction: interaction,
                        appId: appId,
                    })];
                case 91:
                    _c.sent();
                    return [2 /*return*/];
                case 92: return [4 /*yield*/, (0, mcp_js_1.handleMcpCommand)({ command: interaction, appId: appId })];
                case 93:
                    _c.sent();
                    return [2 /*return*/];
                case 94: return [4 /*yield*/, (0, screenshare_js_1.handleScreenshareCommand)({ command: interaction, appId: appId })];
                case 95:
                    _c.sent();
                    return [2 /*return*/];
                case 96: return [4 /*yield*/, (0, screenshare_js_1.handleScreenshareStopCommand)({
                        command: interaction,
                        appId: appId,
                    })];
                case 97:
                    _c.sent();
                    return [2 /*return*/];
                case 98: return [4 /*yield*/, (0, vscode_js_1.handleVscodeCommand)({ command: interaction, appId: appId })];
                case 99:
                    _c.sent();
                    return [2 /*return*/];
                case 100:
                    if (!(interaction.commandName.endsWith('-agent') &&
                        interaction.commandName !== 'agent')) return [3 /*break*/, 102];
                    return [4 /*yield*/, (0, agent_js_1.handleQuickAgentCommand)({ command: interaction, appId: appId })];
                case 101:
                    _c.sent();
                    return [2 /*return*/];
                case 102:
                    if (!(interaction.commandName.endsWith('-model') &&
                        interaction.commandName !== 'model')) return [3 /*break*/, 104];
                    return [4 /*yield*/, (0, model_js_1.handleQuickModelCommand)({ command: interaction, appId: appId })];
                case 103:
                    _c.sent();
                    return [2 /*return*/];
                case 104:
                    if (!(interaction.commandName.endsWith('-cmd') ||
                        interaction.commandName.endsWith('-skill') ||
                        interaction.commandName.endsWith('-mcp-prompt'))) return [3 /*break*/, 106];
                    return [4 /*yield*/, (0, user_command_js_1.handleUserCommand)({ command: interaction, appId: appId })];
                case 105:
                    _c.sent();
                    return [2 /*return*/];
                case 106: return [2 /*return*/];
                case 107:
                    if (!interaction.isButton()) return [3 /*break*/, 126];
                    if (!!(0, discord_utils_js_1.hasKimakiBotPermission)(interaction.member, interaction.guild)) return [3 /*break*/, 109];
                    return [4 /*yield*/, interaction.reply({
                            content: "You don't have permission to use this.\nTo use Kimaki, ask a server admin to give you the **Kimaki** role.",
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 108:
                    _c.sent();
                    return [2 /*return*/];
                case 109:
                    customId = interaction.customId;
                    if (!customId.startsWith('transcription_apikey:')) return [3 /*break*/, 111];
                    return [4 /*yield*/, (0, gemini_apikey_js_1.handleTranscriptionApiKeyButton)(interaction)];
                case 110:
                    _c.sent();
                    return [2 /*return*/];
                case 111:
                    if (!(customId.startsWith('permission_once:') ||
                        customId.startsWith('permission_always:') ||
                        customId.startsWith('permission_reject:'))) return [3 /*break*/, 113];
                    return [4 /*yield*/, (0, permissions_js_1.handlePermissionButton)(interaction)];
                case 112:
                    _c.sent();
                    return [2 /*return*/];
                case 113:
                    if (!customId.startsWith('file_upload_btn:')) return [3 /*break*/, 115];
                    return [4 /*yield*/, (0, file_upload_js_1.handleFileUploadButton)(interaction)];
                case 114:
                    _c.sent();
                    return [2 /*return*/];
                case 115:
                    if (!customId.startsWith('login_text_btn:')) return [3 /*break*/, 117];
                    return [4 /*yield*/, (0, login_js_1.handleLoginTextButton)(interaction)];
                case 116:
                    _c.sent();
                    return [2 /*return*/];
                case 117:
                    if (!customId.startsWith('login_apikey_btn:')) return [3 /*break*/, 119];
                    return [4 /*yield*/, (0, login_js_1.handleLoginApiKeyButton)(interaction)];
                case 118:
                    _c.sent();
                    return [2 /*return*/];
                case 119:
                    if (!customId.startsWith('login_oauth_code_btn:')) return [3 /*break*/, 121];
                    return [4 /*yield*/, (0, login_js_1.handleOAuthCodeButton)(interaction)];
                case 120:
                    _c.sent();
                    return [2 /*return*/];
                case 121:
                    if (!customId.startsWith('action_button:')) return [3 /*break*/, 123];
                    return [4 /*yield*/, (0, action_buttons_js_1.handleActionButton)(interaction)];
                case 122:
                    _c.sent();
                    return [2 /*return*/];
                case 123:
                    if (!customId.startsWith('html_action:')) return [3 /*break*/, 125];
                    return [4 /*yield*/, (0, html_actions_js_1.handleHtmlActionButton)(interaction)];
                case 124:
                    _c.sent();
                    return [2 /*return*/];
                case 125: return [2 /*return*/];
                case 126:
                    if (!interaction.isStringSelectMenu()) return [3 /*break*/, 155];
                    if (!!(0, discord_utils_js_1.hasKimakiBotPermission)(interaction.member, interaction.guild)) return [3 /*break*/, 128];
                    return [4 /*yield*/, interaction.reply({
                            content: "You don't have permission to use this.\nTo use Kimaki, ask a server admin to give you the **Kimaki** role.",
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 127:
                    _c.sent();
                    return [2 /*return*/];
                case 128:
                    customId = interaction.customId;
                    if (!customId.startsWith('fork_select:')) return [3 /*break*/, 130];
                    return [4 /*yield*/, (0, fork_js_1.handleForkSelectMenu)(interaction)];
                case 129:
                    _c.sent();
                    return [2 /*return*/];
                case 130:
                    if (!customId.startsWith('fork_subagent_select:')) return [3 /*break*/, 132];
                    return [4 /*yield*/, (0, fork_subagent_js_1.handleForkSubagentSelectMenu)(interaction)];
                case 131:
                    _c.sent();
                    return [2 /*return*/];
                case 132:
                    if (!customId.startsWith('model_provider:')) return [3 /*break*/, 134];
                    return [4 /*yield*/, (0, model_js_1.handleProviderSelectMenu)(interaction)];
                case 133:
                    _c.sent();
                    return [2 /*return*/];
                case 134:
                    if (!customId.startsWith('model_select:')) return [3 /*break*/, 136];
                    return [4 /*yield*/, (0, model_js_1.handleModelSelectMenu)(interaction)];
                case 135:
                    _c.sent();
                    return [2 /*return*/];
                case 136:
                    if (!customId.startsWith('model_scope:')) return [3 /*break*/, 138];
                    return [4 /*yield*/, (0, model_js_1.handleModelScopeSelectMenu)(interaction)];
                case 137:
                    _c.sent();
                    return [2 /*return*/];
                case 138:
                    if (!customId.startsWith('model_variant:')) return [3 /*break*/, 140];
                    return [4 /*yield*/, (0, model_js_2.handleModelVariantSelectMenu)(interaction)];
                case 139:
                    _c.sent();
                    return [2 /*return*/];
                case 140:
                    if (!customId.startsWith('variant_quick:')) return [3 /*break*/, 142];
                    return [4 /*yield*/, (0, model_variant_js_1.handleVariantQuickSelectMenu)(interaction)];
                case 141:
                    _c.sent();
                    return [2 /*return*/];
                case 142:
                    if (!customId.startsWith('variant_scope:')) return [3 /*break*/, 144];
                    return [4 /*yield*/, (0, model_variant_js_1.handleVariantScopeSelectMenu)(interaction)];
                case 143:
                    _c.sent();
                    return [2 /*return*/];
                case 144:
                    if (!customId.startsWith('agent_select:')) return [3 /*break*/, 146];
                    return [4 /*yield*/, (0, agent_js_1.handleAgentSelectMenu)(interaction)];
                case 145:
                    _c.sent();
                    return [2 /*return*/];
                case 146:
                    if (!customId.startsWith('verbosity_select:')) return [3 /*break*/, 148];
                    return [4 /*yield*/, (0, verbosity_js_1.handleVerbositySelectMenu)(interaction)];
                case 147:
                    _c.sent();
                    return [2 /*return*/];
                case 148:
                    if (!customId.startsWith('ask_question:')) return [3 /*break*/, 150];
                    return [4 /*yield*/, (0, ask_question_js_1.handleAskQuestionSelectMenu)(interaction)];
                case 149:
                    _c.sent();
                    return [2 /*return*/];
                case 150:
                    if (!customId.startsWith('mcp_toggle:')) return [3 /*break*/, 152];
                    return [4 /*yield*/, (0, mcp_js_1.handleMcpSelectMenu)(interaction)];
                case 151:
                    _c.sent();
                    return [2 /*return*/];
                case 152:
                    if (!customId.startsWith('login_select:')) return [3 /*break*/, 154];
                    return [4 /*yield*/, (0, login_js_1.handleLoginSelect)(interaction)];
                case 153:
                    _c.sent();
                    return [2 /*return*/];
                case 154: return [2 /*return*/];
                case 155:
                    if (!interaction.isModalSubmit()) return [3 /*break*/, 168];
                    if (!!(0, discord_utils_js_1.hasKimakiBotPermission)(interaction.member, interaction.guild)) return [3 /*break*/, 157];
                    return [4 /*yield*/, interaction.reply({
                            content: "You don't have permission to use this.\nTo use Kimaki, ask a server admin to give you the **Kimaki** role.",
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 156:
                    _c.sent();
                    return [2 /*return*/];
                case 157:
                    customId = interaction.customId;
                    if (!customId.startsWith('login_apikey:')) return [3 /*break*/, 159];
                    return [4 /*yield*/, (0, login_js_1.handleApiKeyModalSubmit)(interaction)];
                case 158:
                    _c.sent();
                    return [2 /*return*/];
                case 159:
                    if (!customId.startsWith('login_text:')) return [3 /*break*/, 161];
                    return [4 /*yield*/, (0, login_js_1.handleLoginTextModalSubmit)(interaction)];
                case 160:
                    _c.sent();
                    return [2 /*return*/];
                case 161:
                    if (!customId.startsWith('login_oauth_code:')) return [3 /*break*/, 163];
                    return [4 /*yield*/, (0, login_js_1.handleOAuthCodeModalSubmit)(interaction)];
                case 162:
                    _c.sent();
                    return [2 /*return*/];
                case 163:
                    if (!customId.startsWith('transcription_apikey_modal:')) return [3 /*break*/, 165];
                    return [4 /*yield*/, (0, gemini_apikey_js_1.handleTranscriptionApiKeyModalSubmit)(interaction)];
                case 164:
                    _c.sent();
                    return [2 /*return*/];
                case 165:
                    if (!customId.startsWith('file_upload_modal:')) return [3 /*break*/, 167];
                    return [4 /*yield*/, (0, file_upload_js_1.handleFileUploadModalSubmit)(interaction)];
                case 166:
                    _c.sent();
                    return [2 /*return*/];
                case 167: return [2 /*return*/];
                case 168: return [3 /*break*/, 175];
                case 169:
                    error_1 = _c.sent();
                    interactionLogger.error('[INTERACTION] Error handling interaction:', error_1);
                    void (0, sentry_js_1.notifyError)(error_1, 'Interaction handler error');
                    _c.label = 170;
                case 170:
                    _c.trys.push([170, 173, , 174]);
                    if (!(interaction.isRepliable() &&
                        !interaction.replied &&
                        !interaction.deferred)) return [3 /*break*/, 172];
                    return [4 /*yield*/, interaction.reply({
                            content: 'An error occurred processing this command.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 171:
                    _c.sent();
                    _c.label = 172;
                case 172: return [3 /*break*/, 174];
                case 173:
                    replyError_1 = _c.sent();
                    interactionLogger.error('[INTERACTION] Failed to send error reply:', replyError_1);
                    return [3 /*break*/, 174];
                case 174: return [3 /*break*/, 175];
                case 175: return [2 /*return*/];
            }
        });
    }); });
}
