"use strict";
// Unit tests for pure event-sourced typing intent derivation.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var typing_state_js_1 = require("../src/typing-state.js");
(0, vitest_1.describe)('typing-state', function () {
    (0, vitest_1.test)('starts immediately on first start-requested', function () {
        var events = [
            {
                type: 'typing.start-requested',
                atMs: 1000,
                source: 'discord-route',
            },
        ];
        var intent = (0, typing_state_js_1.deriveTypingIntent)({
            events: events,
            nowMs: 1000,
        });
        (0, vitest_1.expect)(intent).toMatchInlineSnapshot("\n      {\n        \"blockedByRateLimit\": false,\n        \"clearReason\": undefined,\n        \"hasStartAfterStatus\": true,\n        \"isTypingActive\": false,\n        \"nextWakeAtMs\": undefined,\n        \"shouldClearStatus\": false,\n        \"shouldSendStatus\": true,\n        \"statusMode\": \"start\",\n      }\n    ");
    });
    (0, vitest_1.test)('dedupes repeated start requests while lease is active', function () {
        var events = [
            {
                type: 'typing.start-requested',
                atMs: 1000,
                source: 'discord-route',
            },
            {
                type: 'slack.status-sent',
                atMs: 1000,
                channelId: 'C1',
                threadTs: '1710000000.000001',
                statusText: 'Typing...',
                mode: 'start',
            },
            {
                type: 'typing.start-requested',
                atMs: 1500,
                source: 'discord-route',
            },
            {
                type: 'typing.start-requested',
                atMs: 2000,
                source: 'discord-route',
            },
        ];
        var intent = (0, typing_state_js_1.deriveTypingIntent)({ events: events, nowMs: 2500 });
        (0, vitest_1.expect)(intent).toMatchInlineSnapshot("\n      {\n        \"blockedByRateLimit\": false,\n        \"clearReason\": undefined,\n        \"hasStartAfterStatus\": true,\n        \"isTypingActive\": true,\n        \"nextWakeAtMs\": 11000,\n        \"shouldClearStatus\": false,\n        \"shouldSendStatus\": false,\n        \"statusMode\": undefined,\n      }\n    ");
    });
    (0, vitest_1.test)('refreshes at lease boundary when new start arrived during lease', function () {
        var events = [
            {
                type: 'slack.status-sent',
                atMs: 1000,
                channelId: 'C1',
                threadTs: '1710000000.000001',
                statusText: 'Typing...',
                mode: 'start',
            },
            {
                type: 'typing.start-requested',
                atMs: 5000,
                source: 'discord-route',
            },
        ];
        var intent = (0, typing_state_js_1.deriveTypingIntent)({ events: events, nowMs: 11100 });
        (0, vitest_1.expect)(intent).toMatchInlineSnapshot("\n      {\n        \"blockedByRateLimit\": false,\n        \"clearReason\": undefined,\n        \"hasStartAfterStatus\": true,\n        \"isTypingActive\": true,\n        \"nextWakeAtMs\": undefined,\n        \"shouldClearStatus\": false,\n        \"shouldSendStatus\": true,\n        \"statusMode\": \"refresh\",\n      }\n    ");
    });
    (0, vitest_1.test)('does not stop immediately on assistant message; stops after debounce', function () {
        var baseEvents = [
            {
                type: 'slack.status-sent',
                atMs: 1000,
                channelId: 'C1',
                threadTs: '1710000000.000001',
                statusText: 'Typing...',
                mode: 'start',
            },
            {
                type: 'assistant.message-sent',
                atMs: 3000,
                source: 'bridge-rest',
                channelId: 'C1',
                threadTs: '1710000000.000001',
            },
        ];
        var beforeDebounce = (0, typing_state_js_1.deriveTypingIntent)({ events: baseEvents, nowMs: 4500 });
        var afterDebounce = (0, typing_state_js_1.deriveTypingIntent)({ events: baseEvents, nowMs: 5000 });
        (0, vitest_1.expect)({ beforeDebounce: beforeDebounce, afterDebounce: afterDebounce }).toMatchInlineSnapshot("\n      {\n        \"afterDebounce\": {\n          \"blockedByRateLimit\": false,\n          \"clearReason\": \"assistant-debounce\",\n          \"hasStartAfterStatus\": false,\n          \"isTypingActive\": true,\n          \"nextWakeAtMs\": undefined,\n          \"shouldClearStatus\": true,\n          \"shouldSendStatus\": false,\n          \"statusMode\": undefined,\n        },\n        \"beforeDebounce\": {\n          \"blockedByRateLimit\": false,\n          \"clearReason\": undefined,\n          \"hasStartAfterStatus\": false,\n          \"isTypingActive\": true,\n          \"nextWakeAtMs\": 5000,\n          \"shouldClearStatus\": false,\n          \"shouldSendStatus\": false,\n          \"statusMode\": undefined,\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('new start during stop debounce keeps typing active', function () {
        var events = [
            {
                type: 'slack.status-sent',
                atMs: 1000,
                channelId: 'C1',
                threadTs: '1710000000.000001',
                statusText: 'Typing...',
                mode: 'start',
            },
            {
                type: 'assistant.message-sent',
                atMs: 3000,
                source: 'bridge-rest',
                channelId: 'C1',
                threadTs: '1710000000.000001',
            },
            {
                type: 'typing.start-requested',
                atMs: 3500,
                source: 'discord-route',
            },
        ];
        var intent = (0, typing_state_js_1.deriveTypingIntent)({ events: events, nowMs: 5200 });
        (0, vitest_1.expect)(intent).toMatchInlineSnapshot("\n      {\n        \"blockedByRateLimit\": false,\n        \"clearReason\": undefined,\n        \"hasStartAfterStatus\": true,\n        \"isTypingActive\": true,\n        \"nextWakeAtMs\": 11000,\n        \"shouldClearStatus\": false,\n        \"shouldSendStatus\": false,\n        \"statusMode\": undefined,\n      }\n    ");
    });
    (0, vitest_1.test)('clears on lease expiry when no new start was requested', function () {
        var events = [
            {
                type: 'slack.status-sent',
                atMs: 1000,
                channelId: 'C1',
                threadTs: '1710000000.000001',
                statusText: 'Typing...',
                mode: 'start',
            },
        ];
        var intent = (0, typing_state_js_1.deriveTypingIntent)({ events: events, nowMs: 11100 });
        (0, vitest_1.expect)(intent).toMatchInlineSnapshot("\n      {\n        \"blockedByRateLimit\": false,\n        \"clearReason\": \"lease-expired\",\n        \"hasStartAfterStatus\": false,\n        \"isTypingActive\": true,\n        \"nextWakeAtMs\": undefined,\n        \"shouldClearStatus\": true,\n        \"shouldSendStatus\": false,\n        \"statusMode\": undefined,\n      }\n    ");
    });
    (0, vitest_1.test)('rate limit blocks immediate send and schedules wake at retry', function () {
        var events = [
            {
                type: 'typing.start-requested',
                atMs: 1000,
                source: 'discord-route',
            },
            {
                type: 'slack.rate-limited',
                atMs: 1100,
                channelId: 'C1',
                threadTs: '1710000000.000001',
                retryAfterMs: 1500,
                retryAtMs: 2600,
                method: 'assistant.threads.setStatus',
            },
        ];
        var blocked = (0, typing_state_js_1.deriveTypingIntent)({ events: events, nowMs: 1200 });
        var unblocked = (0, typing_state_js_1.deriveTypingIntent)({ events: events, nowMs: 2600 });
        (0, vitest_1.expect)({ blocked: blocked, unblocked: unblocked }).toMatchInlineSnapshot("\n      {\n        \"blocked\": {\n          \"blockedByRateLimit\": true,\n          \"clearReason\": undefined,\n          \"hasStartAfterStatus\": true,\n          \"isTypingActive\": false,\n          \"nextWakeAtMs\": 2600,\n          \"shouldClearStatus\": false,\n          \"shouldSendStatus\": false,\n          \"statusMode\": undefined,\n        },\n        \"unblocked\": {\n          \"blockedByRateLimit\": false,\n          \"clearReason\": undefined,\n          \"hasStartAfterStatus\": true,\n          \"isTypingActive\": false,\n          \"nextWakeAtMs\": undefined,\n          \"shouldClearStatus\": false,\n          \"shouldSendStatus\": true,\n          \"statusMode\": \"start\",\n        },\n      }\n    ");
    });
    (0, vitest_1.test)('appendTypingEvent keeps only newest maxEvents entries', function () {
        var events = [
            {
                type: 'typing.start-requested',
                atMs: 1,
                source: 'discord-route',
            },
            {
                type: 'tick',
                atMs: 2,
            },
        ];
        var appended = (0, typing_state_js_1.appendTypingEvent)({
            events: events,
            event: {
                type: 'tick',
                atMs: 3,
            },
            maxEvents: 2,
        });
        (0, vitest_1.expect)(appended).toMatchInlineSnapshot("\n      [\n        {\n          \"atMs\": 2,\n          \"type\": \"tick\",\n        },\n        {\n          \"atMs\": 3,\n          \"type\": \"tick\",\n        },\n      ]\n    ");
    });
});
