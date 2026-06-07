"use strict";
// Fixture-driven tests for pure event-stream derivation helpers.
// Focuses on assistant message completion boundaries instead of session.idle.
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
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var vitest_1 = require("vitest");
var event_stream_state_js_1 = require("./event-stream-state.js");
var fixturesDir = node_path_1.default.join(import.meta.dirname, 'event-stream-fixtures');
function loadFixture(filename) {
    var content = node_fs_1.default.readFileSync(node_path_1.default.join(fixturesDir, filename), 'utf8');
    return content
        .split('\n')
        .filter(Boolean)
        .map(function (line) {
        var parsed = JSON.parse(line);
        return { event: parsed.event, timestamp: parsed.timestamp };
    });
}
function getSessionId(events) {
    for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
        var entry = events_1[_i];
        var sessionId = (0, event_stream_state_js_1.getEventBufferSessionId)(entry.event);
        if (sessionId) {
            return sessionId;
        }
    }
    throw new Error('No sessionId found in fixture');
}
function getAssistantMessages(events, sessionId) {
    var messagesById = new Map();
    events.forEach(function (entry) {
        if (entry.event.type !== 'message.updated') {
            return;
        }
        var info = entry.event.properties.info;
        if (info.sessionID !== sessionId || info.role !== 'assistant') {
            return;
        }
        messagesById.set(info.id, info);
    });
    return __spreadArray([], messagesById.values(), true);
}
function getAssistantMessageById(_a) {
    var events = _a.events, sessionId = _a.sessionId, messageId = _a.messageId;
    var message = getAssistantMessages(events, sessionId).find(function (candidate) {
        return candidate.id === messageId;
    });
    if (!message) {
        throw new Error("Assistant message ".concat(messageId, " not found"));
    }
    return message;
}
function findAssistantCompletionEventIndex(_a) {
    var events = _a.events, sessionId = _a.sessionId, messageId = _a.messageId;
    var index = events.findIndex(function (entry) {
        if (entry.event.type !== 'message.updated') {
            return false;
        }
        var info = entry.event.properties.info;
        return info.sessionID === sessionId
            && info.role === 'assistant'
            && info.id === messageId
            && typeof info.time.completed === 'number';
    });
    if (index === -1) {
        throw new Error("Completed assistant message ".concat(messageId, " not found"));
    }
    return index;
}
(0, vitest_1.describe)('session-normal-completion', function () {
    var events = loadFixture('session-normal-completion.jsonl');
    var sessionId = getSessionId(events);
    var latestAssistantMessageId = (0, event_stream_state_js_1.getLatestAssistantMessageIdForLatestUserTurn)({
        events: events,
        sessionId: sessionId,
    });
    (0, vitest_1.test)('latest assistant message completes naturally', function () {
        if (!latestAssistantMessageId) {
            throw new Error('Expected latest assistant message');
        }
        var message = getAssistantMessageById({
            events: events,
            sessionId: sessionId,
            messageId: latestAssistantMessageId,
        });
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageNaturalCompletion)({ message: message })).toBe(true);
    });
    (0, vitest_1.test)('latest user turn start time comes from the latest user message', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.getCurrentTurnStartTime)({ events: events, sessionId: sessionId })).toBe(1772636294845);
    });
    (0, vitest_1.test)('completion history only appears after the completed update lands', function () {
        if (!latestAssistantMessageId) {
            throw new Error('Expected latest assistant message');
        }
        var completionIndex = findAssistantCompletionEventIndex({
            events: events,
            sessionId: sessionId,
            messageId: latestAssistantMessageId,
        });
        (0, vitest_1.expect)((0, event_stream_state_js_1.hasAssistantMessageCompletedBefore)({
            events: events,
            sessionId: sessionId,
            messageId: latestAssistantMessageId,
            upToIndex: completionIndex - 1,
        })).toBe(false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.hasAssistantMessageCompletedBefore)({
            events: events,
            sessionId: sessionId,
            messageId: latestAssistantMessageId,
        })).toBe(true);
    });
    (0, vitest_1.test)('getLatestRunInfo', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.getLatestRunInfo)({ events: events, sessionId: sessionId })).toEqual({
            model: 'deterministic-v2',
            providerID: 'deterministic-provider',
            agent: 'build',
            tokensUsed: 2,
        });
    });
});
(0, vitest_1.describe)('session-explicit-abort', function () {
    var events = loadFixture('session-explicit-abort.jsonl');
    var sessionId = getSessionId(events);
    var assistantMessages = getAssistantMessages(events, sessionId);
    var latestAssistant = assistantMessages[assistantMessages.length - 1];
    (0, vitest_1.test)('aborted assistant message is not a natural completion', function () {
        if (!latestAssistant) {
            throw new Error('Expected assistant message in fixture');
        }
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageNaturalCompletion)({ message: latestAssistant })).toBe(false);
    });
});
(0, vitest_1.describe)('session-user-interruption', function () {
    var events = loadFixture('session-user-interruption.jsonl');
    var sessionId = getSessionId(events);
    var firstAssistantId = 'msg_cb95be135001I1vqtzLtT4Q1iQ';
    var slowSleepAssistantId = 'msg_cb95be39e001huREyY2wfjgV1M';
    var followupAssistantId = 'msg_cb95beeb8001MuEOER9WprXsPC';
    (0, vitest_1.test)('latest user turn only includes the follow-up assistant message', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
            events: events,
            sessionId: sessionId,
            messageId: firstAssistantId,
        })).toBe(false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
            events: events,
            sessionId: sessionId,
            messageId: slowSleepAssistantId,
        })).toBe(false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
            events: events,
            sessionId: sessionId,
            messageId: followupAssistantId,
        })).toBe(true);
    });
    (0, vitest_1.test)('latest user turn start time follows the follow-up user message', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.getCurrentTurnStartTime)({ events: events, sessionId: sessionId })).toBe(1772636335777);
    });
});
(0, vitest_1.describe)('session-two-completions-same-session', function () {
    var events = loadFixture('session-two-completions-same-session.jsonl');
    var sessionId = getSessionId(events);
    var assistantMessages = getAssistantMessages(events, sessionId);
    var firstAssistant = assistantMessages[0];
    var secondAssistant = assistantMessages[1];
    (0, vitest_1.test)('latest user turn points at the second completion only', function () {
        if (!firstAssistant || !secondAssistant) {
            throw new Error('Expected two assistant messages in fixture');
        }
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
            events: events,
            sessionId: sessionId,
            messageId: firstAssistant.id,
        })).toBe(false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
            events: events,
            sessionId: sessionId,
            messageId: secondAssistant.id,
        })).toBe(true);
        (0, vitest_1.expect)((0, event_stream_state_js_1.getLatestAssistantMessageIdForLatestUserTurn)({
            events: events,
            sessionId: sessionId,
        })).toBe(secondAssistant.id);
    });
});
(0, vitest_1.describe)('session-concurrent-messages-serialized', function () {
    var events = loadFixture('session-concurrent-messages-serialized.jsonl');
    var sessionId = getSessionId(events);
    var latestAssistantMessageId = (0, event_stream_state_js_1.getLatestAssistantMessageIdForLatestUserTurn)({
        events: events,
        sessionId: sessionId,
    });
    (0, vitest_1.test)('fixture latest turn is still incomplete even though an older turn completed', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.doesLatestUserTurnHaveNaturalCompletion)({
            events: events,
            sessionId: sessionId,
        })).toBe(false);
        if (!latestAssistantMessageId) {
            throw new Error('Expected latest assistant message');
        }
        var message = getAssistantMessageById({
            events: events,
            sessionId: sessionId,
            messageId: latestAssistantMessageId,
        });
        (0, vitest_1.expect)(message.id).toBe(latestAssistantMessageId);
    });
});
(0, vitest_1.describe)('session-tool-call-noisy-stream', function () {
    var events = loadFixture('session-tool-call-noisy-stream.jsonl');
    var sessionId = getSessionId(events);
    var latestAssistantMessageId = (0, event_stream_state_js_1.getLatestAssistantMessageIdForLatestUserTurn)({
        events: events,
        sessionId: sessionId,
    });
    (0, vitest_1.test)('fixture ends busy on a tool-call handoff message', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.isSessionBusy)({ events: events, sessionId: sessionId })).toBe(true);
        if (!latestAssistantMessageId) {
            throw new Error('Expected latest assistant message');
        }
        var message = getAssistantMessageById({
            events: events,
            sessionId: sessionId,
            messageId: latestAssistantMessageId,
        });
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageNaturalCompletion)({ message: message })).toBe(false);
    });
    (0, vitest_1.test)('getLatestRunInfo still works through dense tool events', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.getLatestRunInfo)({ events: events, sessionId: sessionId })).toEqual({
            model: 'deterministic-v2',
            providerID: 'deterministic-provider',
            agent: 'build',
            tokensUsed: 0,
        });
    });
});
(0, vitest_1.describe)('session-voice-queued-followup', function () {
    var events = loadFixture('session-voice-queued-followup.jsonl');
    var sessionId = getSessionId(events);
    (0, vitest_1.test)('latest user turn start moves to the queued follow-up', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.getCurrentTurnStartTime)({ events: events, sessionId: sessionId })).toBe(1772636414577);
    });
});
(0, vitest_1.describe)('synthetic-question-followup', function () {
    var sessionId = 'ses_question';
    var events = [
        {
            timestamp: 1,
            event: {
                type: 'message.updated',
                properties: {
                    sessionID: sessionId,
                    info: {
                        id: 'msg_user_1',
                        sessionID: sessionId,
                        role: 'user',
                        time: { created: 1 },
                        agent: 'build',
                        model: {
                            providerID: 'deterministic-provider',
                            modelID: 'deterministic-v2',
                        },
                    },
                },
            },
        },
        {
            timestamp: 2,
            event: {
                type: 'message.updated',
                properties: {
                    sessionID: sessionId,
                    info: {
                        id: 'msg_asst_1',
                        sessionID: sessionId,
                        role: 'assistant',
                        time: { created: 2, completed: 3 },
                        parentID: 'msg_user_1',
                        modelID: 'deterministic-v2',
                        providerID: 'deterministic-provider',
                        mode: 'build',
                        agent: 'build',
                        path: { cwd: '/test', root: '/test' },
                        cost: 0,
                        tokens: {
                            input: 1,
                            output: 1,
                            reasoning: 0,
                            cache: { read: 0, write: 0 },
                        },
                        finish: 'stop',
                    },
                },
            },
        },
        {
            timestamp: 4,
            event: {
                type: 'message.updated',
                properties: {
                    sessionID: sessionId,
                    info: {
                        id: 'msg_user_2',
                        sessionID: sessionId,
                        role: 'user',
                        time: { created: 4 },
                        agent: 'build',
                        model: {
                            providerID: 'deterministic-provider',
                            modelID: 'deterministic-v2',
                        },
                    },
                },
            },
        },
    ];
    (0, vitest_1.test)('latest user turn flips immediately after the follow-up user message', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
            events: events,
            sessionId: sessionId,
            messageId: 'msg_asst_1',
        })).toBe(false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.getCurrentTurnStartTime)({ events: events, sessionId: sessionId })).toBe(4);
    });
});
(0, vitest_1.describe)('real-session-task-normal', function () {
    var events = loadFixture('real-session-task-normal.jsonl');
    var sessionId = getSessionId(events);
    var latestAssistantMessageId = (0, event_stream_state_js_1.getLatestAssistantMessageIdForLatestUserTurn)({
        events: events,
        sessionId: sessionId,
    });
    (0, vitest_1.test)('latest assistant completion is terminal', function () {
        if (!latestAssistantMessageId) {
            throw new Error('Expected latest assistant message');
        }
        var message = getAssistantMessageById({
            events: events,
            sessionId: sessionId,
            messageId: latestAssistantMessageId,
        });
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageNaturalCompletion)({ message: message })).toBe(true);
    });
    (0, vitest_1.test)('getLatestRunInfo has model info', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.getLatestRunInfo)({ events: events, sessionId: sessionId })).toEqual({
            model: 'gemini-2.5-flash',
            providerID: 'cached-google-real-events',
            agent: 'build',
            tokensUsed: 39025,
        });
    });
});
(0, vitest_1.describe)('real-session-task-user-interruption', function () {
    var events = loadFixture('real-session-task-user-interruption.jsonl');
    var sessionId = getSessionId(events);
    var childSessionId = 'ses_3464f3a1dffeBBD0d15EqnGjAh';
    var firstAssistantId = 'msg_cb9b0ba96001SpPjgzxWPmRuW9';
    var secondAssistantId = 'msg_cb9b1ae5c001E5G3Ql6aXNpst2';
    (0, vitest_1.test)('tool-call handoff assistant is not a natural completion but the resumed reply is', function () {
        var firstAssistant = getAssistantMessageById({
            events: events,
            sessionId: sessionId,
            messageId: firstAssistantId,
        });
        var secondAssistant = getAssistantMessageById({
            events: events,
            sessionId: sessionId,
            messageId: secondAssistantId,
        });
        // The first message finished with tool-calls — not a natural completion
        // (footer is deferred to session.idle). The second message IS natural.
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageNaturalCompletion)({ message: firstAssistant })).toBe(false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageNaturalCompletion)({ message: secondAssistant })).toBe(true);
    });
    (0, vitest_1.test)('latest user turn keeps both assistant messages for the same user turn', function () {
        var assistantIds = (0, event_stream_state_js_1.getAssistantMessageIdsForLatestUserTurn)({ events: events, sessionId: sessionId });
        (0, vitest_1.expect)(assistantIds.has(firstAssistantId)).toBe(true);
        (0, vitest_1.expect)(assistantIds.has(secondAssistantId)).toBe(true);
        (0, vitest_1.expect)((0, event_stream_state_js_1.getLatestAssistantMessageIdForLatestUserTurn)({
            events: events,
            sessionId: sessionId,
        })).toBe(secondAssistantId);
    });
    (0, vitest_1.test)('getDerivedSubtaskIndex starts at 1 for first task of assistant message', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.getDerivedSubtaskIndex)({
            events: events,
            mainSessionId: sessionId,
            candidateSessionId: childSessionId,
        })).toBe(1);
    });
    (0, vitest_1.test)('getDerivedSubtaskIndex restarts at 1 for a newer assistant message', function () {
        var _a;
        var firstTaskEvent = events.find(function (entry) {
            var _a;
            if (entry.event.type !== 'message.part.updated') {
                return false;
            }
            var part = entry.event.properties.part;
            if (part.sessionID !== sessionId) {
                return false;
            }
            if (part.type !== 'tool' || part.tool !== 'task') {
                return false;
            }
            if (part.state.status !== 'running' && part.state.status !== 'completed') {
                return false;
            }
            return ((_a = part.state.metadata) === null || _a === void 0 ? void 0 : _a.sessionId) === childSessionId;
        });
        if (!firstTaskEvent) {
            throw new Error('Expected to find task tool event in fixture');
        }
        var secondChildSessionId = 'ses_synthetic_child_2';
        var thirdChildSessionId = 'ses_synthetic_child_3';
        var syntheticAssistantMessageId = 'msg_synthetic_new_assistant';
        var secondTaskEvent = structuredClone(firstTaskEvent);
        if (secondTaskEvent.event.type !== 'message.part.updated') {
            throw new Error('Expected message.part.updated event');
        }
        var secondTaskPart = secondTaskEvent.event.properties.part;
        if (secondTaskPart.type !== 'tool' || secondTaskPart.tool !== 'task') {
            throw new Error('Expected task tool part');
        }
        if (secondTaskPart.state.status !== 'completed') {
            throw new Error('Expected completed task tool part');
        }
        secondTaskPart.id = "".concat(secondTaskPart.id, "-synthetic-2");
        secondTaskPart.messageID = syntheticAssistantMessageId;
        secondTaskPart.state = __assign(__assign({}, secondTaskPart.state), { metadata: __assign(__assign({}, (secondTaskPart.state.metadata || {})), { sessionId: secondChildSessionId }), output: "task_id: ".concat(secondChildSessionId) });
        var thirdTaskEvent = structuredClone(secondTaskEvent);
        if (thirdTaskEvent.event.type !== 'message.part.updated') {
            throw new Error('Expected message.part.updated event');
        }
        var thirdTaskPart = thirdTaskEvent.event.properties.part;
        if (thirdTaskPart.type !== 'tool' || thirdTaskPart.tool !== 'task') {
            throw new Error('Expected task tool part');
        }
        if (thirdTaskPart.state.status !== 'completed') {
            throw new Error('Expected completed task tool part');
        }
        thirdTaskPart.id = "".concat(thirdTaskPart.id, "-synthetic-3");
        thirdTaskPart.messageID = syntheticAssistantMessageId;
        thirdTaskPart.state = __assign(__assign({}, thirdTaskPart.state), { metadata: __assign(__assign({}, (thirdTaskPart.state.metadata || {})), { sessionId: thirdChildSessionId }), output: "task_id: ".concat(thirdChildSessionId) });
        var lastTimestamp = ((_a = events[events.length - 1]) === null || _a === void 0 ? void 0 : _a.timestamp) || 0;
        var augmentedEvents = __spreadArray(__spreadArray([], events, true), [
            {
                timestamp: lastTimestamp + 1,
                event: secondTaskEvent.event,
            },
            {
                timestamp: lastTimestamp + 2,
                event: thirdTaskEvent.event,
            },
        ], false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.getDerivedSubtaskIndex)({
            events: augmentedEvents,
            mainSessionId: sessionId,
            candidateSessionId: childSessionId,
        })).toBe(1);
        (0, vitest_1.expect)((0, event_stream_state_js_1.getDerivedSubtaskIndex)({
            events: augmentedEvents,
            mainSessionId: sessionId,
            candidateSessionId: secondChildSessionId,
        })).toBe(1);
        (0, vitest_1.expect)((0, event_stream_state_js_1.getDerivedSubtaskIndex)({
            events: augmentedEvents,
            mainSessionId: sessionId,
            candidateSessionId: thirdChildSessionId,
        })).toBe(2);
    });
    (0, vitest_1.test)('getDerivedSubtaskIndex returns undefined for unknown session', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.getDerivedSubtaskIndex)({
            events: events,
            mainSessionId: sessionId,
            candidateSessionId: 'ses_nonexistent',
        })).toBe(undefined);
    });
    (0, vitest_1.test)('getDerivedSubagentSessions returns latest tasks first with agent labels', function () {
        var _a;
        var firstTaskEvent = events.find(function (entry) {
            if (entry.event.type !== 'message.part.updated') {
                return false;
            }
            var part = entry.event.properties.part;
            if (part.sessionID !== sessionId) {
                return false;
            }
            if (part.type !== 'tool' || part.tool !== 'task') {
                return false;
            }
            return part.state.status === 'running' || part.state.status === 'completed';
        });
        if (!firstTaskEvent || firstTaskEvent.event.type !== 'message.part.updated') {
            throw new Error('Expected to find task tool event in fixture');
        }
        var newerTaskEvent = structuredClone(firstTaskEvent);
        if (newerTaskEvent.event.type !== 'message.part.updated') {
            throw new Error('Expected message.part.updated event');
        }
        var newerTaskPart = newerTaskEvent.event.properties.part;
        if (newerTaskPart.type !== 'tool' || newerTaskPart.tool !== 'task') {
            throw new Error('Expected task tool part');
        }
        if (newerTaskPart.state.status !== 'running' && newerTaskPart.state.status !== 'completed') {
            throw new Error('Expected running or completed task tool part');
        }
        newerTaskPart.id = "".concat(newerTaskPart.id, "-newer");
        newerTaskPart.state = __assign(__assign({}, newerTaskPart.state), { input: __assign(__assign({}, newerTaskPart.state.input), { description: 'inspect recent task output', subagent_type: 'explore' }), metadata: __assign(__assign({}, (newerTaskPart.state.metadata || {})), { sessionId: 'ses_newer_child' }) });
        var latestTimestamp = ((_a = events[events.length - 1]) === null || _a === void 0 ? void 0 : _a.timestamp) || 0;
        var augmentedEvents = __spreadArray(__spreadArray([], events, true), [
            {
                timestamp: latestTimestamp + 1,
                event: newerTaskEvent.event,
            },
        ], false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.getDerivedSubagentSessions)({
            events: augmentedEvents,
            mainSessionId: sessionId,
        })).toMatchInlineSnapshot("\n      [\n        {\n          \"childSessionId\": \"ses_newer_child\",\n          \"description\": \"inspect recent task output\",\n          \"subagentType\": \"explore\",\n          \"timestamp\": 1772641957983,\n        },\n        {\n          \"childSessionId\": \"ses_3464f3a1dffeBBD0d15EqnGjAh\",\n          \"description\": undefined,\n          \"subagentType\": undefined,\n          \"timestamp\": 1772641955371,\n        },\n      ]\n    ");
    });
});
(0, vitest_1.describe)('real-session-action-buttons', function () {
    var events = loadFixture('real-session-action-buttons.jsonl');
    var sessionId = getSessionId(events);
    var toolCallAssistantId = 'msg_cb9b55c3b001hXC9qxjVxLMypM';
    var finalAssistantId = 'msg_cb9b5ddd1001FALqKNM6xW98u6';
    (0, vitest_1.test)('tool-call handoff assistant is not a natural completion but final reply is', function () {
        var toolCallAssistant = getAssistantMessageById({
            events: events,
            sessionId: sessionId,
            messageId: toolCallAssistantId,
        });
        var finalAssistant = getAssistantMessageById({
            events: events,
            sessionId: sessionId,
            messageId: finalAssistantId,
        });
        // The tool-call message has finish="tool-calls" — not a natural completion
        // (footer is deferred to session.idle). The final text message IS natural.
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageNaturalCompletion)({ message: toolCallAssistant })).toBe(false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageNaturalCompletion)({ message: finalAssistant })).toBe(true);
    });
    (0, vitest_1.test)('latest user turn keeps both assistant messages for the same user turn', function () {
        var assistantIds = (0, event_stream_state_js_1.getAssistantMessageIdsForLatestUserTurn)({ events: events, sessionId: sessionId });
        (0, vitest_1.expect)(assistantIds.has(toolCallAssistantId)).toBe(true);
        (0, vitest_1.expect)(assistantIds.has(finalAssistantId)).toBe(true);
        (0, vitest_1.expect)((0, event_stream_state_js_1.getLatestAssistantMessageIdForLatestUserTurn)({
            events: events,
            sessionId: sessionId,
        })).toBe(finalAssistantId);
    });
});
(0, vitest_1.describe)('real-session-permission-external-file', function () {
    var events = loadFixture('real-session-permission-external-file.jsonl');
    var sessionId = getSessionId(events);
    (0, vitest_1.test)('permission flow has no terminal assistant completion yet', function () {
        var latestAssistantMessageId = (0, event_stream_state_js_1.getLatestAssistantMessageIdForLatestUserTurn)({
            events: events,
            sessionId: sessionId,
        });
        (0, vitest_1.expect)(latestAssistantMessageId).toBeDefined();
        if (!latestAssistantMessageId) {
            return;
        }
        var message = getAssistantMessageById({
            events: events,
            sessionId: sessionId,
            messageId: latestAssistantMessageId,
        });
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageNaturalCompletion)({ message: message })).toBe(false);
    });
});
(0, vitest_1.describe)('real-session-footer-suppressed-on-pre-idle-interrupt', function () {
    var events = loadFixture('real-session-footer-suppressed-on-pre-idle-interrupt.jsonl');
    var sessionId = getSessionId(events);
    var oldAssistantId = 'msg_cbda8f408001VATHNUi9l05XqA';
    var abortedAssistantId = 'msg_cbda90cef001GOQW8EQxkUz9b5';
    var latestAssistantId = 'msg_cbda91463001DvEB6YMCXayZNj';
    (0, vitest_1.test)('latest user turn ignores stale assistant messages from the interrupted turn', function () {
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
            events: events,
            sessionId: sessionId,
            messageId: oldAssistantId,
        })).toBe(false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
            events: events,
            sessionId: sessionId,
            messageId: abortedAssistantId,
        })).toBe(false);
        (0, vitest_1.expect)((0, event_stream_state_js_1.isAssistantMessageInLatestUserTurn)({
            events: events,
            sessionId: sessionId,
            messageId: latestAssistantId,
        })).toBe(true);
    });
});
