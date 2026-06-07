"use strict";
// Agent preference resolution utility.
// Validates agent preferences against the OpenCode API.
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
exports.resolveValidatedAgentPreference = resolveValidatedAgentPreference;
var errore = require("errore");
var database_js_1 = require("../database.js");
function resolveValidatedAgentPreference(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var agentPreference, agentsResponse, availableAgents, agents, hasAgent, availableAgentNames, availableAgentsMessage;
        var _this = this;
        var agent = _b.agent, sessionId = _b.sessionId, channelId = _b.channelId, getClient = _b.getClient, directory = _b.directory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                        var sessionAgent, sessionModel;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (agent) {
                                        return [2 /*return*/, agent];
                                    }
                                    return [4 /*yield*/, (0, database_js_1.getSessionAgent)(sessionId)];
                                case 1:
                                    sessionAgent = _a.sent();
                                    if (sessionAgent) {
                                        return [2 /*return*/, sessionAgent];
                                    }
                                    return [4 /*yield*/, (0, database_js_1.getSessionModel)(sessionId)];
                                case 2:
                                    sessionModel = _a.sent();
                                    if (sessionModel) {
                                        return [2 /*return*/, undefined];
                                    }
                                    if (!channelId) {
                                        return [2 /*return*/, undefined];
                                    }
                                    return [2 /*return*/, (0, database_js_1.getChannelAgent)(channelId)];
                            }
                        });
                    }); })()];
                case 1:
                    agentPreference = _c.sent();
                    if (getClient instanceof Error) {
                        return [2 /*return*/, { agentPreference: agentPreference || undefined, agents: [] }];
                    }
                    if (!agentPreference) {
                        return [2 /*return*/, { agentPreference: undefined, agents: [] }];
                    }
                    return [4 /*yield*/, errore.tryAsync(function () {
                            return getClient().app.agents({ directory: directory });
                        })];
                case 2:
                    agentsResponse = _c.sent();
                    if (agentsResponse instanceof Error) {
                        if (agentPreference) {
                            throw new Error("Failed to validate agent \"".concat(agentPreference, "\""), {
                                cause: agentsResponse,
                            });
                        }
                        return [2 /*return*/, { agentPreference: undefined, agents: [] }];
                    }
                    availableAgents = agentsResponse.data || [];
                    agents = availableAgents
                        .filter(function (a) {
                        return ((a.mode === 'primary' || a.mode === 'all') &&
                            !a.hidden);
                    })
                        .map(function (a) {
                        return { name: a.name, description: a.description };
                    });
                    hasAgent = availableAgents.some(function (availableAgent) {
                        return availableAgent.name === agentPreference;
                    });
                    if (hasAgent) {
                        return [2 /*return*/, { agentPreference: agentPreference, agents: agents }];
                    }
                    availableAgentNames = availableAgents
                        .map(function (availableAgent) {
                        return availableAgent.name;
                    })
                        .slice(0, 20);
                    availableAgentsMessage = availableAgentNames.length > 0
                        ? "Available agents: ".concat(availableAgentNames.join(', '))
                        : 'No agents are available in this project.';
                    throw new Error("Agent \"".concat(agentPreference, "\" not found. ").concat(availableAgentsMessage, " Use /agent to choose a valid one."));
            }
        });
    });
}
