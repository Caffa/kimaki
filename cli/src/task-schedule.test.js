"use strict";
// Tests for scheduled task date/cron parsing and UTC validation rules.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var task_schedule_js_1 = require("./task-schedule.js");
(0, vitest_1.describe)('parseSendAtValue', function () {
    (0, vitest_1.test)('accepts UTC ISO date ending with Z', function () {
        var _a;
        var now = new Date('2026-02-22T13:00:00Z');
        var result = (0, task_schedule_js_1.parseSendAtValue)({
            value: '2026-03-01T09:00:00Z',
            now: now,
            timezone: 'UTC',
        });
        (0, vitest_1.expect)(result).not.toBeInstanceOf(Error);
        if (result instanceof Error) {
            throw result;
        }
        (0, vitest_1.expect)(result.scheduleKind).toBe('at');
        (0, vitest_1.expect)((_a = result.runAt) === null || _a === void 0 ? void 0 : _a.toISOString()).toBe('2026-03-01T09:00:00.000Z');
        (0, vitest_1.expect)(result.nextRunAt.toISOString()).toBe('2026-03-01T09:00:00.000Z');
    });
    (0, vitest_1.test)('rejects ISO date with non-UTC offset', function () {
        var now = new Date('2026-02-22T13:00:00Z');
        var result = (0, task_schedule_js_1.parseSendAtValue)({
            value: '2026-03-01T09:00:00+01:00',
            now: now,
            timezone: 'UTC',
        });
        (0, vitest_1.expect)(result).toBeInstanceOf(Error);
        if (result instanceof Error) {
            (0, vitest_1.expect)(result.message).toContain('must be UTC ISO format ending with Z');
        }
    });
    (0, vitest_1.test)('rejects local ISO date without timezone suffix', function () {
        var now = new Date('2026-02-22T13:00:00Z');
        var result = (0, task_schedule_js_1.parseSendAtValue)({
            value: '2026-03-01T09:00:00',
            now: now,
            timezone: 'UTC',
        });
        (0, vitest_1.expect)(result).toBeInstanceOf(Error);
        if (result instanceof Error) {
            (0, vitest_1.expect)(result.message).toContain('must be UTC ISO format ending with Z');
        }
    });
    (0, vitest_1.test)('rejects UTC dates in the past', function () {
        var now = new Date('2026-02-22T13:00:00Z');
        var result = (0, task_schedule_js_1.parseSendAtValue)({
            value: '2026-02-22T12:59:59Z',
            now: now,
            timezone: 'UTC',
        });
        (0, vitest_1.expect)(result).toBeInstanceOf(Error);
        if (result instanceof Error) {
            (0, vitest_1.expect)(result.message).toContain('must be in the future (UTC)');
        }
    });
    (0, vitest_1.test)('accepts cron expressions', function () {
        var now = new Date('2026-02-22T13:00:00Z');
        var result = (0, task_schedule_js_1.parseSendAtValue)({
            value: '0 9 * * 1',
            now: now,
            timezone: 'UTC',
        });
        (0, vitest_1.expect)(result).not.toBeInstanceOf(Error);
        if (result instanceof Error) {
            throw result;
        }
        (0, vitest_1.expect)(result.scheduleKind).toBe('cron');
        (0, vitest_1.expect)(result.cronExpr).toBe('0 9 * * 1');
        (0, vitest_1.expect)(result.nextRunAt.toISOString()).toBe('2026-02-23T09:00:00.000Z');
    });
});
