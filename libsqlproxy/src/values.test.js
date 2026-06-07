"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var values_ts_1 = require("./values.ts");
(0, vitest_1.describe)('encodeHranaValue', function () {
    (0, vitest_1.test)('null', function () {
        (0, vitest_1.expect)((0, values_ts_1.encodeHranaValue)(null)).toMatchInlineSnapshot("\n      {\n        \"type\": \"null\",\n      }\n    ");
    });
    (0, vitest_1.test)('undefined', function () {
        (0, vitest_1.expect)((0, values_ts_1.encodeHranaValue)(undefined)).toMatchInlineSnapshot("\n      {\n        \"type\": \"null\",\n      }\n    ");
    });
    (0, vitest_1.test)('integer', function () {
        (0, vitest_1.expect)((0, values_ts_1.encodeHranaValue)(42)).toMatchInlineSnapshot("\n      {\n        \"type\": \"integer\",\n        \"value\": \"42\",\n      }\n    ");
    });
    (0, vitest_1.test)('float', function () {
        (0, vitest_1.expect)((0, values_ts_1.encodeHranaValue)(3.14)).toMatchInlineSnapshot("\n      {\n        \"type\": \"float\",\n        \"value\": 3.14,\n      }\n    ");
    });
    (0, vitest_1.test)('bigint', function () {
        (0, vitest_1.expect)((0, values_ts_1.encodeHranaValue)(BigInt('9007199254740993'))).toMatchInlineSnapshot("\n      {\n        \"type\": \"integer\",\n        \"value\": \"9007199254740993\",\n      }\n    ");
    });
    (0, vitest_1.test)('string', function () {
        (0, vitest_1.expect)((0, values_ts_1.encodeHranaValue)('hello')).toMatchInlineSnapshot("\n      {\n        \"type\": \"text\",\n        \"value\": \"hello\",\n      }\n    ");
    });
    (0, vitest_1.test)('Uint8Array', function () {
        var result = (0, values_ts_1.encodeHranaValue)(new Uint8Array([1, 2, 3]));
        (0, vitest_1.expect)(result.type).toBe('blob');
        (0, vitest_1.expect)(result.base64).toBe('AQID');
    });
});
(0, vitest_1.describe)('decodeHranaValue', function () {
    (0, vitest_1.test)('null', function () {
        (0, vitest_1.expect)((0, values_ts_1.decodeHranaValue)({ type: 'null' })).toBe(null);
    });
    (0, vitest_1.test)('safe integer', function () {
        (0, vitest_1.expect)((0, values_ts_1.decodeHranaValue)({ type: 'integer', value: '42' })).toBe(42);
    });
    (0, vitest_1.test)('unsafe integer returns bigint', function () {
        var result = (0, values_ts_1.decodeHranaValue)({ type: 'integer', value: '9007199254740993' });
        (0, vitest_1.expect)(typeof result).toBe('bigint');
        (0, vitest_1.expect)(result).toBe(BigInt('9007199254740993'));
    });
    (0, vitest_1.test)('float', function () {
        (0, vitest_1.expect)((0, values_ts_1.decodeHranaValue)({ type: 'float', value: 3.14 })).toBe(3.14);
    });
    (0, vitest_1.test)('text', function () {
        (0, vitest_1.expect)((0, values_ts_1.decodeHranaValue)({ type: 'text', value: 'hello' })).toBe('hello');
    });
    (0, vitest_1.test)('blob roundtrip', function () {
        var original = new Uint8Array([1, 2, 3]);
        var encoded = (0, values_ts_1.encodeHranaValue)(original);
        var decoded = (0, values_ts_1.decodeHranaValue)(encoded);
        (0, vitest_1.expect)(decoded).toEqual(original);
    });
});
(0, vitest_1.describe)('decodeHranaParams', function () {
    (0, vitest_1.test)('positional args', function () {
        (0, vitest_1.expect)((0, values_ts_1.decodeHranaParams)({
            args: [
                { type: 'integer', value: '1' },
                { type: 'text', value: 'alice' },
            ],
        })).toMatchInlineSnapshot("\n      [\n        1,\n        \"alice\",\n      ]\n    ");
    });
    (0, vitest_1.test)('named args', function () {
        (0, vitest_1.expect)((0, values_ts_1.decodeHranaParams)({
            named_args: [
                { name: 'id', value: { type: 'integer', value: '1' } },
                { name: 'name', value: { type: 'text', value: 'alice' } },
            ],
        })).toMatchInlineSnapshot("\n      [\n        {\n          \"id\": 1,\n          \"name\": \"alice\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('no args', function () {
        (0, vitest_1.expect)((0, values_ts_1.decodeHranaParams)({})).toMatchInlineSnapshot("[]");
    });
});
