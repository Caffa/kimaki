"use strict";
// /agent command - Set the preferred agent for this channel or session.
// Also provides quick agent commands like /plan-agent, /build-agent that switch instantly.
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
exports.getCurrentAgentInfo = getCurrentAgentInfo;
exports.sanitizeAgentName = sanitizeAgentName;
exports.buildQuickAgentCommandDescription = buildQuickAgentCommandDescription;
exports.resolveAgentCommandContext = resolveAgentCommandContext;
exports.setAgentForContext = setAgentForContext;
exports.handleAgentCommand = handleAgentCommand;
exports.handleAgentSelectMenu = handleAgentSelectMenu;
exports.handleQuickAgentCommand = handleQuickAgentCommand;
var discord_js_1 = require("discord.js");
var node_crypto_1 = require("node:crypto");
var database_js_1 = require("../database.js");
var opencode_js_1 = require("../opencode.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger_js_1 = require("../logger.js");
var model_js_1 = require("./model.js");
var agentLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.AGENT);
var AGENT_CONTEXT_TTL_MS = 10 * 60 * 1000;
var pendingAgentContexts = new Map();
/**
 * Get the current agent info for a channel/session, including where it comes from.
 * Priority: session > channel > none
 */
function getCurrentAgentInfo(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var sessionAgent, channelAgent;
        var sessionId = _b.sessionId, channelId = _b.channelId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!sessionId) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, database_js_1.getSessionAgent)(sessionId)];
                case 1:
                    sessionAgent = _c.sent();
                    if (sessionAgent) {
                        return [2 /*return*/, { type: 'session', agent: sessionAgent }];
                    }
                    _c.label = 2;
                case 2:
                    if (!channelId) return [3 /*break*/, 4];
                    return [4 /*yield*/, (0, database_js_1.getChannelAgent)(channelId)];
                case 3:
                    channelAgent = _c.sent();
                    if (channelAgent) {
                        return [2 /*return*/, { type: 'channel', agent: channelAgent }];
                    }
                    _c.label = 4;
                case 4: return [2 /*return*/, { type: 'none' }];
            }
        });
    });
}
/**
 * Sanitize an agent name to be a valid Discord command name component.
 * Lowercase, alphanumeric and hyphens only.
 */
function sanitizeAgentName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
var QUICK_AGENT_DESCRIPTION_PATTERN = /^\[agent:([^\]]+)\]/;
/**
 * Build quick-agent command description with an embedded original agent name.
 * Metadata format: [agent:<original-name>] <visible description>
 */
function buildQuickAgentCommandDescription(_a) {
    var agentName = _a.agentName, description = _a.description;
    var metadataPrefix = "[agent:".concat(agentName, "]");
    if (metadataPrefix.length > 100) {
        return metadataPrefix.slice(0, 100);
    }
    var visibleDescription = description || "Switch to ".concat(agentName, " agent");
    var maxVisibleLength = 100 - metadataPrefix.length - 1;
    if (maxVisibleLength <= 0) {
        return metadataPrefix;
    }
    var trimmedVisible = visibleDescription.slice(0, maxVisibleLength).trim();
    if (!trimmedVisible) {
        return metadataPrefix;
    }
    return "".concat(metadataPrefix, " ").concat(trimmedVisible);
}
function parseQuickAgentNameFromDescription(description) {
    var _a;
    if (!description) {
        return undefined;
    }
    var match = QUICK_AGENT_DESCRIPTION_PATTERN.exec(description);
    if (!match) {
        return undefined;
    }
    var agentName = (_a = match[1]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!agentName) {
        return undefined;
    }
    return agentName;
}
function resolveQuickAgentNameFromInteraction(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var fromCommandObject, fetchedCommand;
        var _c;
        var command = _b.command;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    fromCommandObject = parseQuickAgentNameFromDescription((_c = command.command) === null || _c === void 0 ? void 0 : _c.description);
                    if (fromCommandObject) {
                        return [2 /*return*/, fromCommandObject];
                    }
                    if (!command.guild) {
                        return [2 /*return*/, undefined];
                    }
                    return [4 /*yield*/, command.guild.commands.fetch(command.commandId)];
                case 1:
                    fetchedCommand = _d.sent();
                    if (!fetchedCommand) {
                        return [2 /*return*/, undefined];
                    }
                    return [2 /*return*/, parseQuickAgentNameFromDescription(fetchedCommand.description)];
            }
        });
    });
}
/**
 * Resolve the context for an agent command (directory, channel, session).
 * Returns null if the command cannot be executed in this context.
 */
function resolveAgentCommandContext(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var channel, isThread, projectDirectory, targetChannelId, sessionId, thread, textChannel, metadata, metadata;
        var interaction = _b.interaction;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    channel = interaction.channel;
                    if (!!channel) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'This command can only be used in a channel',
                        })];
                case 1:
                    _c.sent();
                    return [2 /*return*/, null];
                case 2:
                    isThread = [
                        discord_js_1.ChannelType.PublicThread,
                        discord_js_1.ChannelType.PrivateThread,
                        discord_js_1.ChannelType.AnnouncementThread,
                    ].includes(channel.type);
                    if (!isThread) return [3 /*break*/, 6];
                    thread = channel;
                    return [4 /*yield*/, (0, discord_utils_js_1.resolveTextChannel)(thread)];
                case 3:
                    textChannel = _c.sent();
                    return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(textChannel)];
                case 4:
                    metadata = _c.sent();
                    projectDirectory = metadata.projectDirectory;
                    targetChannelId = (textChannel === null || textChannel === void 0 ? void 0 : textChannel.id) || channel.id;
                    return [4 /*yield*/, (0, database_js_1.getThreadSession)(thread.id)];
                case 5:
                    sessionId = _c.sent();
                    return [3 /*break*/, 10];
                case 6:
                    if (!(channel.type === discord_js_1.ChannelType.GuildText)) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, discord_utils_js_1.getKimakiMetadata)(channel)];
                case 7:
                    metadata = _c.sent();
                    projectDirectory = metadata.projectDirectory;
                    targetChannelId = channel.id;
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, interaction.editReply({
                        content: 'This command can only be used in text channels or threads',
                    })];
                case 9:
                    _c.sent();
                    return [2 /*return*/, null];
                case 10:
                    if (!!projectDirectory) return [3 /*break*/, 12];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'This channel is not configured with a project directory',
                        })];
                case 11:
                    _c.sent();
                    return [2 /*return*/, null];
                case 12: return [2 /*return*/, {
                        dir: projectDirectory,
                        channelId: targetChannelId,
                        sessionId: sessionId,
                        isThread: isThread,
                    }];
            }
        });
    });
}
/**
 * Set the agent preference for a context (session or channel).
 * When switching agents for a session, clears session model preference
 * so the new agent's model takes effect (agent model > channel model).
 */
function setAgentForContext(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var context = _b.context, agentName = _b.agentName;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!(context.isThread && context.sessionId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, database_js_1.setSessionAgent)(context.sessionId, agentName)
                        // Clear session model so the new agent's model takes effect
                    ];
                case 1:
                    _c.sent();
                    // Clear session model so the new agent's model takes effect
                    return [4 /*yield*/, (0, database_js_1.clearSessionModel)(context.sessionId)];
                case 2:
                    // Clear session model so the new agent's model takes effect
                    _c.sent();
                    agentLogger.log("Set agent ".concat(agentName, " for session ").concat(context.sessionId, " (cleared session model)"));
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, (0, database_js_1.setChannelAgent)(context.channelId, agentName)];
                case 4:
                    _c.sent();
                    agentLogger.log("Set agent ".concat(agentName, " for channel ").concat(context.channelId));
                    _c.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function handleAgentCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var context, getClient, agentsResponse, agents, currentAgentInfo_1, currentAgentText, contextHash_1, options, selectMenu, actionRow, error_1;
        var interaction = _b.interaction, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, resolveAgentCommandContext({ interaction: interaction, appId: appId })];
                case 2:
                    context = _c.sent();
                    if (!context) {
                        return [2 /*return*/];
                    }
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 14, , 16]);
                    return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(context.dir)];
                case 4:
                    getClient = _c.sent();
                    if (!(getClient instanceof Error)) return [3 /*break*/, 6];
                    return [4 /*yield*/, interaction.editReply({ content: getClient.message })];
                case 5:
                    _c.sent();
                    return [2 /*return*/];
                case 6: return [4 /*yield*/, getClient().app.agents({
                        directory: context.dir,
                    })];
                case 7:
                    agentsResponse = _c.sent();
                    if (!(!agentsResponse.data || agentsResponse.data.length === 0)) return [3 /*break*/, 9];
                    return [4 /*yield*/, interaction.editReply({ content: 'No agents available' })];
                case 8:
                    _c.sent();
                    return [2 /*return*/];
                case 9:
                    agents = agentsResponse.data
                        .filter(function (agent) {
                        var hidden = agent.hidden;
                        return (agent.mode === 'primary' || agent.mode === 'all') && !hidden;
                    })
                        .slice(0, 25);
                    if (!(agents.length === 0)) return [3 /*break*/, 11];
                    return [4 /*yield*/, interaction.editReply({ content: 'No primary agents available' })];
                case 10:
                    _c.sent();
                    return [2 /*return*/];
                case 11: return [4 /*yield*/, getCurrentAgentInfo({
                        sessionId: context.sessionId,
                        channelId: context.channelId,
                    })];
                case 12:
                    currentAgentInfo_1 = _c.sent();
                    currentAgentText = (function () {
                        switch (currentAgentInfo_1.type) {
                            case 'session':
                                return "**Current (session override):** `".concat(currentAgentInfo_1.agent, "`");
                            case 'channel':
                                return "**Current (channel override):** `".concat(currentAgentInfo_1.agent, "`");
                            case 'none':
                                return '**Current:** none';
                        }
                    })();
                    contextHash_1 = node_crypto_1.default.randomBytes(8).toString('hex');
                    pendingAgentContexts.set(contextHash_1, context);
                    setTimeout(function () {
                        pendingAgentContexts.delete(contextHash_1);
                    }, AGENT_CONTEXT_TTL_MS).unref();
                    options = agents.map(function (agent) { return ({
                        label: agent.name.slice(0, 100),
                        value: agent.name,
                        description: (agent.description || "".concat(agent.mode, " agent")).slice(0, 100),
                    }); });
                    selectMenu = new discord_js_1.StringSelectMenuBuilder()
                        .setCustomId("agent_select:".concat(contextHash_1))
                        .setPlaceholder('Select an agent')
                        .addOptions(options);
                    actionRow = new discord_js_1.ActionRowBuilder().addComponents(selectMenu);
                    return [4 /*yield*/, interaction.editReply({
                            content: "**Set Agent Preference**\n".concat(currentAgentText, "\nSelect an agent:"),
                            components: [actionRow],
                        })];
                case 13:
                    _c.sent();
                    return [3 /*break*/, 16];
                case 14:
                    error_1 = _c.sent();
                    agentLogger.error('Error loading agents:', error_1);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to load agents: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'),
                        })];
                case 15:
                    _c.sent();
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
            }
        });
    });
}
function handleAgentSelectMenu(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, contextHash, context, selectedAgent, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('agent_select:')) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, interaction.deferUpdate()];
                case 1:
                    _a.sent();
                    contextHash = customId.replace('agent_select:', '');
                    context = pendingAgentContexts.get(contextHash);
                    if (!!context) return [3 /*break*/, 3];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'Selection expired. Please run /agent again.',
                            components: [],
                        })];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
                case 3:
                    selectedAgent = interaction.values[0];
                    if (!!selectedAgent) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({
                            content: 'No agent selected',
                            components: [],
                        })];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
                case 5:
                    _a.trys.push([5, 11, , 13]);
                    return [4 /*yield*/, setAgentForContext({ context: context, agentName: selectedAgent })];
                case 6:
                    _a.sent();
                    if (!(context.isThread && context.sessionId)) return [3 /*break*/, 8];
                    return [4 /*yield*/, interaction.editReply({
                            content: "Agent preference set for this session: **".concat(selectedAgent, "**\nThe agent will change on the next message."),
                            components: [],
                        })];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, interaction.editReply({
                        content: "Agent preference set for this channel: **".concat(selectedAgent, "**\nAll new sessions in this channel will use this agent."),
                        components: [],
                    })];
                case 9:
                    _a.sent();
                    _a.label = 10;
                case 10:
                    pendingAgentContexts.delete(contextHash);
                    return [3 /*break*/, 13];
                case 11:
                    error_2 = _a.sent();
                    agentLogger.error('Error saving agent preference:', error_2);
                    return [4 /*yield*/, interaction.editReply({
                            content: "Failed to save agent preference: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'),
                            components: [],
                        })];
                case 12:
                    _a.sent();
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle quick agent commands like /plan-agent, /build-agent.
 * These instantly switch to the specified agent without showing a dropdown.
 *
 * The slash command name is sanitized for Discord and can be lossy
 * (for example gpt5.4 -> gpt5-4-agent). To keep the original agent name,
 * registration stores [agent:<name>] metadata in the description and this
 * handler resolves from that metadata first.
 */
function handleQuickAgentCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var fallbackAgentName, context, resolvedAgentName_1, previousAgent, previousAgentName, previousText, modelInfo, modelText, error_3;
        var _this = this;
        var command = _b.command, appId = _b.appId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    fallbackAgentName = command.commandName.replace(/-agent$/, '');
                    return [4 /*yield*/, command.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, resolveAgentCommandContext({
                            interaction: command,
                            appId: appId,
                        })];
                case 2:
                    context = _c.sent();
                    if (!context) {
                        return [2 /*return*/];
                    }
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 14, , 16]);
                    return [4 /*yield*/, resolveQuickAgentNameFromInteraction({ command: command })];
                case 4:
                    resolvedAgentName_1 = (_c.sent()) ||
                        fallbackAgentName;
                    return [4 /*yield*/, getCurrentAgentInfo({
                            sessionId: context.sessionId,
                            channelId: context.channelId,
                        })];
                case 5:
                    previousAgent = _c.sent();
                    previousAgentName = previousAgent.type !== 'none' ? previousAgent.agent : undefined;
                    if (!(previousAgentName === resolvedAgentName_1)) return [3 /*break*/, 7];
                    return [4 /*yield*/, command.editReply({
                            content: "Already using **".concat(resolvedAgentName_1, "** agent"),
                        })];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
                case 7: 
                // Set the agent preference in DB for this context.
                return [4 /*yield*/, setAgentForContext({ context: context, agentName: resolvedAgentName_1 })];
                case 8:
                    // Set the agent preference in DB for this context.
                    _c.sent();
                    previousText = previousAgentName
                        ? " (was **".concat(previousAgentName, "**)")
                        : '';
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            var getClient;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, opencode_js_1.initializeOpencodeForDirectory)(context.dir)];
                                    case 1:
                                        getClient = _a.sent();
                                        if (getClient instanceof Error) {
                                            return [2 /*return*/, { type: 'none' }];
                                        }
                                        return [2 /*return*/, (0, model_js_1.getCurrentModelInfo)({
                                                sessionId: context.sessionId,
                                                channelId: context.channelId,
                                                appId: appId,
                                                agentPreference: resolvedAgentName_1,
                                                getClient: getClient,
                                                directory: context.dir,
                                            })];
                                }
                            });
                        }); })()];
                case 9:
                    modelInfo = _c.sent();
                    modelText = modelInfo.type === 'none' ? '' : "\nModel: *".concat(modelInfo.model, "*");
                    if (!(context.isThread && context.sessionId)) return [3 /*break*/, 11];
                    return [4 /*yield*/, command.editReply({
                            content: "Switched to **".concat(resolvedAgentName_1, "** agent for this session").concat(previousText).concat(modelText, "\nThe agent will change on the next message."),
                        })];
                case 10:
                    _c.sent();
                    return [3 /*break*/, 13];
                case 11: return [4 /*yield*/, command.editReply({
                        content: "Switched to **".concat(resolvedAgentName_1, "** agent for this channel").concat(previousText).concat(modelText, "\nAll new sessions will use this agent."),
                    })];
                case 12:
                    _c.sent();
                    _c.label = 13;
                case 13: return [3 /*break*/, 16];
                case 14:
                    error_3 = _c.sent();
                    agentLogger.error('Error in quick agent command:', error_3);
                    return [4 /*yield*/, command.editReply({
                            content: "Failed to switch agent: ".concat(error_3 instanceof Error ? error_3.message : 'Unknown error'),
                        })];
                case 15:
                    _c.sent();
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
            }
        });
    });
}
