"use strict";
// Scheduled task parsing utilities for `send --send-at` and task runner execution.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalTimeZone = getLocalTimeZone;
exports.getPromptPreview = getPromptPreview;
exports.parseSendAtValue = parseSendAtValue;
exports.getNextCronRun = getNextCronRun;
exports.serializeScheduledTaskPayload = serializeScheduledTaskPayload;
exports.parseScheduledTaskPayload = parseScheduledTaskPayload;
var cron_parser_1 = require("cron-parser");
var errore = require("errore");
var UTC_SEND_AT_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z$/;
function getLocalTimeZone() {
    var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) {
        return 'UTC';
    }
    return tz;
}
function getPromptPreview(prompt) {
    var normalized = prompt.replace(/\s+/g, ' ').trim();
    if (normalized.length <= 120) {
        return normalized;
    }
    return "".concat(normalized.slice(0, 117), "...");
}
function parseUtcSendAtDate(_a) {
    var value = _a.value, now = _a.now;
    var looksLikeDate = value.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(value);
    if (!looksLikeDate) {
        return null;
    }
    if (!UTC_SEND_AT_DATE_REGEX.test(value)) {
        return new Error("--send-at date must be UTC ISO format ending with Z (example: 2026-03-01T09:00:00Z). Received: ".concat(value));
    }
    var runAt = new Date(value);
    if (Number.isNaN(runAt.getTime())) {
        return new Error("Invalid UTC date for --send-at: ".concat(value));
    }
    if (runAt.getTime() <= now.getTime()) {
        return new Error("--send-at date must be in the future (UTC): ".concat(value));
    }
    return runAt;
}
function parseSendAtValue(_a) {
    var value = _a.value, now = _a.now, timezone = _a.timezone;
    var trimmed = value.trim();
    if (!trimmed) {
        return new Error('--send-at cannot be empty');
    }
    var utcDateResult = parseUtcSendAtDate({ value: trimmed, now: now });
    if (utcDateResult instanceof Error) {
        return utcDateResult;
    }
    if (utcDateResult) {
        return {
            scheduleKind: 'at',
            runAt: utcDateResult,
            cronExpr: null,
            timezone: null,
            nextRunAt: utcDateResult,
        };
    }
    var looksLikeCron = trimmed.startsWith('@') || trimmed.split(/\s+/).length >= 5;
    if (looksLikeCron) {
        var nextRunAtResult = getNextCronRun({
            cronExpr: trimmed,
            timezone: timezone,
            from: now,
        });
        if (!(nextRunAtResult instanceof Error)) {
            return {
                scheduleKind: 'cron',
                runAt: null,
                cronExpr: trimmed,
                timezone: timezone,
                nextRunAt: nextRunAtResult,
            };
        }
    }
    var cronResult = getNextCronRun({ cronExpr: trimmed, timezone: timezone, from: now });
    if (cronResult instanceof Error) {
        return new Error("Invalid --send-at value: \"".concat(trimmed, "\". Use UTC ISO date/time ending in Z or a cron expression."), {
            cause: cronResult,
        });
    }
    return {
        scheduleKind: 'cron',
        runAt: null,
        cronExpr: trimmed,
        timezone: timezone,
        nextRunAt: cronResult,
    };
}
function getNextCronRun(_a) {
    var cronExpr = _a.cronExpr, timezone = _a.timezone, from = _a.from;
    var parsed = errore.try({
        try: function () {
            return cron_parser_1.CronExpressionParser.parse(cronExpr, {
                currentDate: from,
                tz: timezone,
            });
        },
        catch: function (error) {
            return new Error("Invalid cron expression: ".concat(cronExpr), { cause: error });
        },
    });
    if (parsed instanceof Error) {
        return parsed;
    }
    var next = errore.try({
        try: function () {
            return parsed.next().toDate();
        },
        catch: function (error) {
            return new Error("Could not compute next run for cron: ".concat(cronExpr), {
                cause: error,
            });
        },
    });
    if (next instanceof Error) {
        return next;
    }
    return next;
}
function serializeScheduledTaskPayload(payload) {
    return JSON.stringify(payload);
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function asString(value) {
    if (typeof value !== 'string') {
        return null;
    }
    return value;
}
function asStringArray(value) {
    if (!Array.isArray(value)) {
        return null;
    }
    return value.filter(function (v) {
        return typeof v === 'string';
    });
}
function parseScheduledTaskPayload(payloadJson) {
    var parsed = errore.try({
        try: function () {
            return JSON.parse(payloadJson);
        },
        catch: function (error) {
            return new Error('Task payload is not valid JSON', { cause: error });
        },
    });
    if (parsed instanceof Error) {
        return parsed;
    }
    if (!isRecord(parsed)) {
        return new Error('Task payload must be an object');
    }
    var kind = asString(parsed.kind);
    if (kind === 'thread') {
        var threadId = asString(parsed.threadId);
        var prompt_1 = asString(parsed.prompt);
        var agent = asString(parsed.agent);
        var model = asString(parsed.model);
        var username = asString(parsed.username);
        var userId = asString(parsed.userId);
        var permissions = asStringArray(parsed.permissions);
        var injectionGuardPatterns = asStringArray(parsed.injectionGuardPatterns);
        if (!threadId || !prompt_1) {
            return new Error('Thread task payload requires threadId and prompt');
        }
        return {
            kind: 'thread',
            threadId: threadId,
            prompt: prompt_1,
            agent: agent,
            model: model,
            username: username,
            userId: userId,
            permissions: permissions,
            injectionGuardPatterns: injectionGuardPatterns,
        };
    }
    if (kind === 'channel') {
        var channelId = asString(parsed.channelId);
        var prompt_2 = asString(parsed.prompt);
        var nameValue = parsed.name;
        var name_1 = typeof nameValue === 'string' ? nameValue : null;
        var notifyOnly = parsed.notifyOnly === true;
        var worktreeName = asString(parsed.worktreeName);
        var cwd = asString(parsed.cwd);
        var agent = asString(parsed.agent);
        var model = asString(parsed.model);
        var username = asString(parsed.username);
        var userId = asString(parsed.userId);
        var permissions = asStringArray(parsed.permissions);
        var injectionGuardPatterns = asStringArray(parsed.injectionGuardPatterns);
        if (!channelId || !prompt_2) {
            return new Error('Channel task payload requires channelId and prompt');
        }
        return {
            kind: 'channel',
            channelId: channelId,
            prompt: prompt_2,
            name: name_1,
            notifyOnly: notifyOnly,
            worktreeName: worktreeName,
            cwd: cwd,
            agent: agent,
            model: model,
            username: username,
            userId: userId,
            permissions: permissions,
            injectionGuardPatterns: injectionGuardPatterns,
        };
    }
    return new Error('Task payload has unknown kind');
}
