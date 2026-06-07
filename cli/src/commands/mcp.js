"use strict";
// /mcp command - List and toggle MCP servers for the current project.
// Uses OpenCode SDK mcp.status/connect/disconnect to manage servers.
// MCP state is project-scoped (per channel), not per thread or session.
// No database storage needed — state lives in OpenCode's config.
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
exports.formatServerLine = formatServerLine;
exports.toggleActionLabel = toggleActionLabel;
exports.handleMcpCommand = handleMcpCommand;
exports.handleMcpSelectMenu = handleMcpSelectMenu;
var node_crypto_1 = require("node:crypto");
var discord_js_1 = require("discord.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.MCP);
// Short-lived context map: contextHash → projectDirectory.
// Avoids embedding long directory paths in Discord customId (100 char limit).
// Entries auto-expire after 5 minutes to prevent unbounded growth from
// abandoned menus (user runs /mcp but never clicks the select menu).
var MCP_CONTEXT_TTL_MS = 5 * 60000;
var pendingMcpContexts = new Map();
var STATUS_LABELS = {
    connected: 'connected',
    disabled: 'disabled',
    failed: 'failed',
    needs_auth: 'needs auth',
    needs_client_registration: 'needs registration',
};
function formatStatusLabel(status) {
    return STATUS_LABELS[status] || status;
}
/** Extract error string from McpStatus using discriminated union narrowing. */
function getStatusError(info) {
    if (info.status === 'failed') {
        return info.error;
    }
    if (info.status === 'needs_client_registration') {
        return info.error;
    }
    return undefined;
}
/** Build a one-line description for a server entry in the list. */
function formatServerLine(_a) {
    var name = _a.name, status = _a.status, error = _a.error;
    var label = formatStatusLabel(status);
    var errorSuffix = error ? " \u2014 ".concat(error) : '';
    return "`".concat(label, "` **").concat(name, "**").concat(errorSuffix);
}
/** Determine the select menu option label for toggling a server. */
function toggleActionLabel(status) {
    if (status === 'connected') {
        return 'disconnect';
    }
    if (status === 'failed') {
        return 'reconnect';
    }
    return 'connect';
}
function handleMcpCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, isThread, isTextChannel, resolved, projectDirectory, getClient, client, _c, data, error, servers, lines, content, contextHash_1, options, selectMenu, actionRow, error_1;
        var command = _b.command;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    channel = command.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, command.reply({
                            content: 'This command can only be used in a channel.',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 1:
                    _d.sent();
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
                            content: 'This command can only be used in text channels or threads.',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 3:
                    _d.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, (0, discord_utils_js_1.resolveWorkingDirectory)({
                        channel: channel,
                    })];
                case 5:
                    resolved = _d.sent();
                    if (!!resolved) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.reply({
                            content: 'Could not determine project directory for this channel.',
                            flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS,
                        })];
                case 6:
                    _d.sent();
                    return [2 /*return*/];
                case 7:
                    projectDirectory = resolved.projectDirectory;
                    return [4 /*yield*/, command.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral | discord_utils_js_1.SILENT_MESSAGE_FLAGS })];
                case 8:
                    _d.sent();
                    _d.label = 9;
                case 9:
                    _d.trys.push([9, 19, , 21]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 10:
                    getClient = _d.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 12];
                    return [4 /*yield*/, command.editReply({
                            content: "Failed to connect to OpenCode server: ".concat(getClient.message),
                        })];
                case 11:
                    _d.sent();
                    return [2 /*return*/];
                case 12:
                    client = getClient();
                    return [4 /*yield*/, client.mcp.status({
                            directory: projectDirectory,
                        })];
                case 13:
                    _c = _d.sent(), data = _c.data, error = _c.error;
                    if (!(error || !data)) return [3 /*break*/, 15];
                    return [4 /*yield*/, command.editReply({
                            content: 'Failed to fetch MCP server status.',
                        })];
                case 14:
                    _d.sent();
                    return [2 /*return*/];
                case 15:
                    servers = Object.entries(data);
                    if (!(servers.length === 0)) return [3 /*break*/, 17];
                    return [4 /*yield*/, command.editReply({
                            content: 'No MCP servers configured for this project.\nAdd MCP servers in your project\'s `opencode.json` configuration.',
                        })];
                case 16:
                    _d.sent();
                    return [2 /*return*/];
                case 17:
                    lines = servers.map(function (_a) {
                        var name = _a[0], info = _a[1];
                        return formatServerLine({ name: name, status: info.status, error: getStatusError(info) });
                    });
                    content = "**MCP Servers** (project-wide)\n".concat(lines.join('\n'));
                    contextHash_1 = node_crypto_1.default.randomBytes(8).toString('hex');
                    pendingMcpContexts.set(contextHash_1, projectDirectory);
                    setTimeout(function () {
                        pendingMcpContexts.delete(contextHash_1);
                    }, MCP_CONTEXT_TTL_MS);
                    options = servers.map(function (_a) {
                        var name = _a[0], info = _a[1];
                        return ({
                            label: name.slice(0, 100),
                            value: name.slice(0, 100),
                            description: "".concat(formatStatusLabel(info.status), " \u2014 click to ").concat(toggleActionLabel(info.status)).slice(0, 100),
                        });
                    });
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("mcp_toggle:".concat(contextHash_1))
                        .setPlaceholder('Select MCP server to toggle')
                        .addOptions(options.slice(0, 25)) // Discord max 25 options
                    ;
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, command.editReply({
                            content: content,
                            components: [actionRow],
                        })];
                case 18:
                    _d.sent();
                    return [3 /*break*/, 21];
                case 19:
                    error_1 = _d.sent();
                    logger.error('[MCP] Error fetching MCP servers:', error_1);
                    return [4 /*yield*/, command.editReply({
                            content: "Failed to fetch MCP servers: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                        })];
                case 20:
                    _d.sent();
                    return [3 /*break*/, 21];
                case 21: return [2 /*return*/];
            }
        });
    });
}
function handleMcpSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, contextHash, projectDirectory, serverName, getClient, client, _a, statusData, statusError, serverInfo, error_3, error, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('mcp_toggle:')) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    _b.sent();
                    contextHash = customId.slice('mcp_toggle:'.length);
                    projectDirectory = pendingMcpContexts.get(contextHash);
                    if (!!projectDirectory) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Session expired. Run `/mcp` again.',
                            components: [],
                        })];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
                case 3:
                    serverName = interaction.values[0];
                    if (!!serverName) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No server selected.',
                            components: [],
                        })];
                case 4:
                    _b.sent();
                    return [2 /*return*/];
                case 5:
                    pendingMcpContexts.delete(contextHash);
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 28, , 30]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(projectDirectory)];
                case 7:
                    getClient = _b.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 9];
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to connect to OpenCode server: ".concat(getClient.message),
                            components: [],
                        })];
                case 8:
                    _b.sent();
                    return [2 /*return*/];
                case 9:
                    client = getClient();
                    return [4 /*yield*/, client.mcp.status({
                            directory: projectDirectory,
                        })];
                case 10:
                    _a = _b.sent(), statusData = _a.data, statusError = _a.error;
                    if (!(statusError || !statusData)) return [3 /*break*/, 12];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Failed to refresh MCP server status.',
                            components: [],
                        })];
                case 11:
                    _b.sent();
                    return [2 /*return*/];
                case 12:
                    if (!!statusData[serverName]) return [3 /*break*/, 14];
                    return [4 /*yield*/, interaction.editReply({
                            content: "Server **".concat(serverName, "** not found."),
                            components: [],
                        })];
                case 13:
                    _b.sent();
                    return [2 /*return*/];
                case 14:
                    serverInfo = statusData[serverName];
                    if (!(serverInfo.status === 'connected')) return [3 /*break*/, 19];
                    return [4 /*yield*/, client.mcp.disconnect({
                            name: serverName,
                            directory: projectDirectory,
                        })];
                case 15:
                    error_3 = (_b.sent()).error;
                    if (!error_3) return [3 /*break*/, 17];
                    logger.error("[MCP] Failed to disconnect ".concat(serverName, ":"), error_3);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to disconnect **".concat(serverName, "**."),
                            components: [],
                        })];
                case 16:
                    _b.sent();
                    return [2 /*return*/];
                case 17:
                    logger.log("[MCP] Disconnected server: ".concat(serverName));
                    return [4 /*yield*/, interaction.editReply({
                            content: "**".concat(serverName, "** disconnected"),
                            components: [],
                        })];
                case 18:
                    _b.sent();
                    return [2 /*return*/];
                case 19:
                    if (!(serverInfo.status === 'needs_auth')) return [3 /*break*/, 21];
                    return [4 /*yield*/, interaction.editReply({
                            content: "**".concat(serverName, "** needs authentication.\nRun `opencode` in the project directory to complete the OAuth flow."),
                            components: [],
                        })];
                case 20:
                    _b.sent();
                    return [2 /*return*/];
                case 21:
                    if (!(serverInfo.status === 'needs_client_registration')) return [3 /*break*/, 23];
                    return [4 /*yield*/, interaction.editReply({
                            content: "**".concat(serverName, "** needs client registration.").concat(serverInfo.error ? "\n".concat(serverInfo.error) : ''),
                            components: [],
                        })];
                case 22:
                    _b.sent();
                    return [2 /*return*/];
                case 23: return [4 /*yield*/, client.mcp.connect({
                        name: serverName,
                        directory: projectDirectory,
                    })];
                case 24:
                    error = (_b.sent()).error;
                    if (!error) return [3 /*break*/, 26];
                    logger.error("[MCP] Failed to connect ".concat(serverName, ":"), error);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to connect **".concat(serverName, "**."),
                            components: [],
                        })];
                case 25:
                    _b.sent();
                    return [2 /*return*/];
                case 26:
                    logger.log("[MCP] Connected server: ".concat(serverName));
                    return [4 /*yield*/, interaction.editReply({
                            content: "**".concat(serverName, "** connected"),
                            components: [],
                        })];
                case 27:
                    _b.sent();
                    return [3 /*break*/, 30];
                case 28:
                    error_2 = _b.sent();
                    logger.error('[MCP] Error toggling MCP server:', error_2);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to toggle MCP server: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'),
                            components: [],
                        })];
                case 29:
                    _b.sent();
                    return [3 /*break*/, 30];
                case 30: return [2 /*return*/];
            }
        });
    });
}
