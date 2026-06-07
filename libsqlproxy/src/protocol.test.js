"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var protocol_ts_1 = require("./protocol.ts");
var okResult = {
    cols: [],
    rows: [],
    affected_row_count: 0,
    last_insert_rowid: null,
};
var err = { message: 'fail', code: 'SQLITE_ERROR' };
(0, vitest_1.describe)('evaluateHranaCondition', function () {
    (0, vitest_1.test)('null condition returns true', function () {
        (0, vitest_1.expect)((0, protocol_ts_1.evaluateHranaCondition)(null, [], [])).toBe(true);
    });
    (0, vitest_1.test)('ok — step succeeded', function () {
        (0, vitest_1.expect)((0, protocol_ts_1.evaluateHranaCondition)({ type: 'ok', step: 0 }, [okResult], [null])).toBe(true);
    });
    (0, vitest_1.test)('ok — step failed', function () {
        (0, vitest_1.expect)((0, protocol_ts_1.evaluateHranaCondition)({ type: 'ok', step: 0 }, [null], [err])).toBe(false);
    });
    (0, vitest_1.test)('not — inverts ok', function () {
        (0, vitest_1.expect)((0, protocol_ts_1.evaluateHranaCondition)({ type: 'not', cond: { type: 'ok', step: 0 } }, [null], [err])).toBe(true);
    });
    (0, vitest_1.test)('and — all true', function () {
        (0, vitest_1.expect)((0, protocol_ts_1.evaluateHranaCondition)({
            type: 'and',
            conds: [
                { type: 'ok', step: 0 },
                { type: 'ok', step: 1 },
            ],
        }, [okResult, okResult], [null, null])).toBe(true);
    });
    (0, vitest_1.test)('and — one false', function () {
        (0, vitest_1.expect)((0, protocol_ts_1.evaluateHranaCondition)({
            type: 'and',
            conds: [
                { type: 'ok', step: 0 },
                { type: 'ok', step: 1 },
            ],
        }, [okResult, null], [null, err])).toBe(false);
    });
    (0, vitest_1.test)('or — one true', function () {
        (0, vitest_1.expect)((0, protocol_ts_1.evaluateHranaCondition)({
            type: 'or',
            conds: [
                { type: 'ok', step: 0 },
                { type: 'ok', step: 1 },
            ],
        }, [null, okResult], [err, null])).toBe(true);
    });
    (0, vitest_1.test)('or — all false', function () {
        (0, vitest_1.expect)((0, protocol_ts_1.evaluateHranaCondition)({
            type: 'or',
            conds: [
                { type: 'ok', step: 0 },
                { type: 'ok', step: 1 },
            ],
        }, [null, null], [err, err])).toBe(false);
    });
    (0, vitest_1.test)('error — step errored', function () {
        (0, vitest_1.expect)((0, protocol_ts_1.evaluateHranaCondition)({ type: 'error', step: 0 }, [null], [err])).toBe(true);
    });
    (0, vitest_1.test)('error — step succeeded', function () {
        (0, vitest_1.expect)((0, protocol_ts_1.evaluateHranaCondition)({ type: 'error', step: 0 }, [okResult], [null])).toBe(false);
    });
    (0, vitest_1.test)('is_autocommit returns protocol error', function () {
        var result = (0, protocol_ts_1.evaluateHranaCondition)({ type: 'is_autocommit' }, [], []);
        (0, vitest_1.expect)(result).toEqual({
            message: 'is_autocommit condition is not supported',
            code: 'HRANA_PROTO_ERROR',
        });
    });
    (0, vitest_1.test)('unknown condition type returns protocol error', function () {
        var result = (0, protocol_ts_1.evaluateHranaCondition)({ type: 'bogus' }, [], []);
        (0, vitest_1.expect)(result).toEqual({
            message: 'Unknown condition type: bogus',
            code: 'HRANA_PROTO_ERROR',
        });
    });
    (0, vitest_1.test)('and propagates nested protocol error', function () {
        var result = (0, protocol_ts_1.evaluateHranaCondition)({ type: 'and', conds: [{ type: 'ok', step: 0 }, { type: 'is_autocommit' }] }, [okResult], [null]);
        (0, vitest_1.expect)(result).toEqual({
            message: 'is_autocommit condition is not supported',
            code: 'HRANA_PROTO_ERROR',
        });
    });
    (0, vitest_1.test)('or propagates nested protocol error', function () {
        var result = (0, protocol_ts_1.evaluateHranaCondition)({ type: 'or', conds: [{ type: 'ok', step: 0 }, { type: 'is_autocommit' }] }, [null], [err]);
        (0, vitest_1.expect)(result).toEqual({
            message: 'is_autocommit condition is not supported',
            code: 'HRANA_PROTO_ERROR',
        });
    });
});
