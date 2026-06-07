"use strict";
// Pure event-stream derivation functions for session lifecycle state.
// These functions derive lifecycle decisions from an event buffer array.
// Zero imports from thread-session-runtime.ts, store.ts, or state.ts.
// Only types from @opencode-ai/sdk/v2 and the getOpencodeEventSessionId helper.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEventBufferSessionId = getEventBufferSessionId;
exports.isSessionBusy = isSessionBusy;
exports.didQuestionQueueHandoffSinceLatestQuestionAsked = didQuestionQueueHandoffSinceLatestQuestionAsked;
exports.isAssistantMessageNaturalCompletion = isAssistantMessageNaturalCompletion;
exports.hasAssistantMessageCompletedBefore = hasAssistantMessageCompletedBefore;
exports.getLatestUserMessage = getLatestUserMessage;
exports.getCurrentTurnStartTime = getCurrentTurnStartTime;
exports.getLatestRunInfo = getLatestRunInfo;
exports.getAssistantMessageIdsForLatestUserTurn = getAssistantMessageIdsForLatestUserTurn;
exports.getLatestAssistantMessageIdForLatestUserTurn = getLatestAssistantMessageIdForLatestUserTurn;
exports.doesLatestUserTurnHaveNaturalCompletion = doesLatestUserTurnHaveNaturalCompletion;
exports.isAssistantMessageInLatestUserTurn = isAssistantMessageInLatestUserTurn;
exports.getDerivedSubtaskIndex = getDerivedSubtaskIndex;
exports.getDerivedSubtaskAgentType = getDerivedSubtaskAgentType;
exports.getDerivedSubagentSessions = getDerivedSubagentSessions;
var opencode_session_event_log_js_1 = require("./opencode-session-event-log.js");
function getEventBufferSessionId(event) {
    if (event.type === 'queue.question-handoff-started') {
        return event.properties.sessionID;
    }
    return (0, opencode_session_event_log_js_1.getOpencodeEventSessionId)(event);
}
function getTaskChildSessionId(_a) {
    var part = _a.part;
    // Event-shape reference:
    // - cli/src/session-handler/event-stream-fixtures/real-session-task-three-parallel-sleeps.jsonl
    // - In real task events, state.metadata.sessionId appears on running/completed
    //   tool updates and is the canonical child-session identifier.
    // We intentionally do not parse state.output because it is user-facing text
    // and can change format across providers/versions.
    var metadataValue = part.state.metadata;
    var metadataSessionId = metadataValue && typeof metadataValue === 'object'
        ? metadataValue.sessionId
        : undefined;
    if (typeof metadataSessionId === 'string' && metadataSessionId.length > 0) {
        return metadataSessionId;
    }
    return undefined;
}
function getTaskCandidateFromEvent(_a) {
    var _b, _c;
    var event = _a.event, mainSessionId = _a.mainSessionId;
    if (event.type !== 'message.part.updated') {
        return undefined;
    }
    var part = event.properties.part;
    if (part.sessionID !== mainSessionId) {
        return undefined;
    }
    if (part.type !== 'tool' || part.tool !== 'task' || part.state.status === 'pending') {
        return undefined;
    }
    var childSessionId = getTaskChildSessionId({ part: part });
    if (!childSessionId) {
        return undefined;
    }
    var subagentType = (_b = part.state.input) === null || _b === void 0 ? void 0 : _b.subagent_type;
    var description = (_c = part.state.input) === null || _c === void 0 ? void 0 : _c.description;
    return {
        assistantMessageId: part.messageID,
        childSessionId: childSessionId,
        subagentType: typeof subagentType === 'string' ? subagentType : undefined,
        description: typeof description === 'string' ? description : undefined,
    };
}
// Scans backward for most recent session-scoped lifecycle event.
// Returns true if the latest lifecycle event for sessionId is session.status busy.
function isSessionBusy(_a) {
    var events = _a.events, sessionId = _a.sessionId, upToIndex = _a.upToIndex;
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var e = entry.event;
        var eid = getEventBufferSessionId(e);
        if (eid !== sessionId) {
            continue;
        }
        if (e.type === 'session.idle') {
            return false;
        }
        if (e.type === 'session.status') {
            return e.properties.status.type === 'busy';
        }
    }
    return false;
}
function didQuestionQueueHandoffSinceLatestQuestionAsked(_a) {
    var events = _a.events, sessionId = _a.sessionId, upToIndex = _a.upToIndex;
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var event_1 = entry.event;
        var eventSessionId = getEventBufferSessionId(event_1);
        if (eventSessionId !== sessionId) {
            continue;
        }
        if (event_1.type === 'queue.question-handoff-started') {
            return true;
        }
        if (event_1.type === 'question.asked') {
            return false;
        }
    }
    return false;
}
function isAssistantMessageNaturalCompletion(_a) {
    var message = _a.message;
    if (typeof message.time.completed !== 'number') {
        return false;
    }
    if (message.error) {
        return false;
    }
    // finish="tool-calls" means the model's last step was tool execution.
    // Mid-turn tool-call steps don't get footers — the footer comes from the
    // final text response (finish="stop") that follows. If the turn ends with
    // only tool-calls and no text follow-up, no footer is emitted. This is
    // acceptable since models almost always follow up with text after tools.
    return message.finish !== 'tool-calls';
}
function hasAssistantMessageCompletedBefore(_a) {
    var events = _a.events, sessionId = _a.sessionId, messageId = _a.messageId, upToIndex = _a.upToIndex;
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var event_2 = entry.event;
        if (event_2.type !== 'message.updated') {
            continue;
        }
        var info = event_2.properties.info;
        if (info.sessionID !== sessionId || info.role !== 'assistant' || info.id !== messageId) {
            continue;
        }
        return typeof info.time.completed === 'number';
    }
    return false;
}
function getLatestUserMessage(_a) {
    var events = _a.events, sessionId = _a.sessionId, upToIndex = _a.upToIndex;
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    var latestUserMessage;
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var event_3 = entry.event;
        if (event_3.type !== 'message.updated') {
            continue;
        }
        var info = event_3.properties.info;
        if (info.sessionID !== sessionId || info.role !== 'user') {
            continue;
        }
        if (!latestUserMessage) {
            latestUserMessage = info;
            continue;
        }
        if (info.time.created > latestUserMessage.time.created) {
            latestUserMessage = info;
        }
    }
    return latestUserMessage;
}
function getCurrentTurnStartTime(_a) {
    var events = _a.events, sessionId = _a.sessionId, upToIndex = _a.upToIndex;
    var latestUserMessage = getLatestUserMessage({
        events: events,
        sessionId: sessionId,
        upToIndex: upToIndex,
    });
    return latestUserMessage === null || latestUserMessage === void 0 ? void 0 : latestUserMessage.time.created;
}
// Token total helper — sum of input + output + reasoning + cache.read + cache.write
function getTokenTotal(tokens) {
    return tokens.input + tokens.output + tokens.reasoning + tokens.cache.read + tokens.cache.write;
}
// Scans backward for most recent message.updated with role=assistant for sessionId.
// Extracts model, providerID, agent, tokensUsed.
function getLatestRunInfo(_a) {
    var events = _a.events, sessionId = _a.sessionId, upToIndex = _a.upToIndex;
    var result = {
        model: undefined,
        providerID: undefined,
        agent: undefined,
        tokensUsed: 0,
    };
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var e = entry.event;
        if (e.type !== 'message.updated') {
            continue;
        }
        var msg = e.properties.info;
        if (msg.sessionID !== sessionId || msg.role !== 'assistant') {
            continue;
        }
        return {
            model: msg.modelID,
            providerID: msg.providerID,
            agent: msg.mode,
            tokensUsed: msg.tokens
                ? getTokenTotal(msg.tokens)
                : 0,
        };
    }
    return result;
}
function getAssistantMessageIdsForLatestUserTurn(_a) {
    var events = _a.events, sessionId = _a.sessionId, upToIndex = _a.upToIndex;
    var latestUserMessage = getLatestUserMessage({
        events: events,
        sessionId: sessionId,
        upToIndex: upToIndex,
    });
    if (!latestUserMessage) {
        return new Set();
    }
    var end = upToIndex === undefined ? events.length : upToIndex + 1;
    var assistantMessageIds = new Set();
    for (var i = 0; i < end; i++) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var e = entry.event;
        if (e.type !== 'message.updated') {
            continue;
        }
        var msg = e.properties.info;
        if (msg.sessionID !== sessionId || msg.role !== 'assistant') {
            continue;
        }
        if (msg.parentID === latestUserMessage.id) {
            assistantMessageIds.add(msg.id);
        }
    }
    return assistantMessageIds;
}
function getLatestAssistantMessageIdForLatestUserTurn(_a) {
    var events = _a.events, sessionId = _a.sessionId, upToIndex = _a.upToIndex;
    var latestUserMessage = getLatestUserMessage({
        events: events,
        sessionId: sessionId,
        upToIndex: upToIndex,
    });
    if (!latestUserMessage) {
        return undefined;
    }
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    var latestAssistantMessage;
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var event_4 = entry.event;
        if (event_4.type !== 'message.updated') {
            continue;
        }
        var info = event_4.properties.info;
        if (info.sessionID !== sessionId || info.role !== 'assistant') {
            continue;
        }
        if (info.parentID !== latestUserMessage.id) {
            continue;
        }
        if (!latestAssistantMessage) {
            latestAssistantMessage = info;
            continue;
        }
        if (info.time.created > latestAssistantMessage.time.created) {
            latestAssistantMessage = info;
        }
    }
    return latestAssistantMessage === null || latestAssistantMessage === void 0 ? void 0 : latestAssistantMessage.id;
}
function hasRenderablePartSummary(message) {
    if (!('partsSummary' in message) || !Array.isArray(message.partsSummary)) {
        return false;
    }
    return message.partsSummary.some(function (part) {
        return part.type === 'text' || part.type === 'tool';
    });
}
function hasAssistantPartEvidence(_a) {
    var events = _a.events, sessionId = _a.sessionId, messageId = _a.messageId, upToIndex = _a.upToIndex;
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var event_5 = entry.event;
        if (event_5.type === 'message.updated') {
            var info = event_5.properties.info;
            if (info.sessionID !== sessionId || info.role !== 'assistant' || info.id !== messageId) {
                continue;
            }
            if (hasRenderablePartSummary(info)) {
                return true;
            }
            continue;
        }
        if (event_5.type !== 'message.part.updated') {
            continue;
        }
        var part = event_5.properties.part;
        if (part.messageID !== messageId) {
            continue;
        }
        if (part.type === 'text' || part.type === 'tool') {
            return true;
        }
    }
    return false;
}
function hasAssistantStepFinished(_a) {
    var events = _a.events, messageId = _a.messageId, upToIndex = _a.upToIndex;
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry || entry.event.type !== 'message.part.updated') {
            continue;
        }
        var part = entry.event.properties.part;
        if (part.messageID !== messageId) {
            continue;
        }
        if (part.type === 'step-finish') {
            return true;
        }
    }
    return false;
}
function doesLatestUserTurnHaveNaturalCompletion(_a) {
    var events = _a.events, sessionId = _a.sessionId, upToIndex = _a.upToIndex;
    var latestAssistantMessageId = getLatestAssistantMessageIdForLatestUserTurn({
        events: events,
        sessionId: sessionId,
        upToIndex: upToIndex,
    });
    if (!latestAssistantMessageId) {
        return false;
    }
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    var latestAssistantMessage;
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var event_6 = entry.event;
        if (event_6.type !== 'message.updated') {
            continue;
        }
        var info = event_6.properties.info;
        if (info.sessionID !== sessionId || info.role !== 'assistant') {
            continue;
        }
        if (info.id !== latestAssistantMessageId) {
            continue;
        }
        latestAssistantMessage = info;
        if (isAssistantMessageNaturalCompletion({ message: info })) {
            return true;
        }
        break;
    }
    if (!latestAssistantMessage) {
        return false;
    }
    if (latestAssistantMessage.error) {
        return false;
    }
    if (latestAssistantMessage.finish === 'tool-calls') {
        return false;
    }
    return hasAssistantStepFinished({
        events: events,
        messageId: latestAssistantMessageId,
        upToIndex: upToIndex,
    }) && hasAssistantPartEvidence({
        events: events,
        sessionId: sessionId,
        messageId: latestAssistantMessageId,
        upToIndex: upToIndex,
    });
}
function isAssistantMessageInLatestUserTurn(_a) {
    var events = _a.events, sessionId = _a.sessionId, messageId = _a.messageId, upToIndex = _a.upToIndex;
    var assistantMessageIds = getAssistantMessageIdsForLatestUserTurn({
        events: events,
        sessionId: sessionId,
        upToIndex: upToIndex,
    });
    return assistantMessageIds.has(messageId);
}
// Returns a stable 1-based subtask index for candidateSessionId.
// Indexing scope is the parent assistant message that spawned the task tool calls,
// so numbering restarts at 1 for each assistant message.
function getDerivedSubtaskIndex(_a) {
    var events = _a.events, mainSessionId = _a.mainSessionId, candidateSessionId = _a.candidateSessionId, upToIndex = _a.upToIndex;
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    var parentAssistantMessageId;
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var candidate = getTaskCandidateFromEvent({
            event: entry.event,
            mainSessionId: mainSessionId,
        });
        if (!candidate) {
            continue;
        }
        if (candidate.childSessionId !== candidateSessionId) {
            continue;
        }
        parentAssistantMessageId = candidate.assistantMessageId;
        break;
    }
    if (!parentAssistantMessageId) {
        return undefined;
    }
    var indexByChildSessionId = new Map();
    for (var i = 0; i <= end; i++) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var candidate = getTaskCandidateFromEvent({
            event: entry.event,
            mainSessionId: mainSessionId,
        });
        if (!candidate || candidate.assistantMessageId !== parentAssistantMessageId) {
            continue;
        }
        if (!indexByChildSessionId.has(candidate.childSessionId)) {
            indexByChildSessionId.set(candidate.childSessionId, indexByChildSessionId.size + 1);
        }
    }
    return indexByChildSessionId.get(candidateSessionId);
}
// Returns the subagent_type (e.g. "explore", "general") for a given child session.
// Used to build labels like "explore-1" instead of generic "task-1".
function getDerivedSubtaskAgentType(_a) {
    var events = _a.events, mainSessionId = _a.mainSessionId, candidateSessionId = _a.candidateSessionId;
    for (var i = events.length - 1; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var candidate = getTaskCandidateFromEvent({
            event: entry.event,
            mainSessionId: mainSessionId,
        });
        if (!candidate || candidate.childSessionId !== candidateSessionId) {
            continue;
        }
        return candidate.subagentType;
    }
    return undefined;
}
function getDerivedSubagentSessions(_a) {
    var events = _a.events, mainSessionId = _a.mainSessionId, upToIndex = _a.upToIndex;
    var end = upToIndex !== null && upToIndex !== void 0 ? upToIndex : events.length - 1;
    var seenChildSessionIds = new Set();
    var sessions = [];
    for (var i = end; i >= 0; i--) {
        var entry = events[i];
        if (!entry) {
            continue;
        }
        var candidate = getTaskCandidateFromEvent({
            event: entry.event,
            mainSessionId: mainSessionId,
        });
        if (!candidate || seenChildSessionIds.has(candidate.childSessionId)) {
            continue;
        }
        seenChildSessionIds.add(candidate.childSessionId);
        sessions.push({
            childSessionId: candidate.childSessionId,
            subagentType: candidate.subagentType,
            description: candidate.description,
            timestamp: entry.timestamp,
        });
    }
    return sessions;
}
