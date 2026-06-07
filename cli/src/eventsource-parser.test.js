"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Experiment: test if eventsource-parser can extract `data:` lines from noisy process output
var vitest_1 = require("vitest");
var eventsource_parser_1 = require("eventsource-parser");
function parseSSEFromChunks(chunks) {
    var events = [];
    var parser = (0, eventsource_parser_1.createParser)({
        onEvent: function (event) {
            events.push(event);
        },
    });
    for (var _i = 0, chunks_1 = chunks; _i < chunks_1.length; _i++) {
        var chunk = chunks_1[_i];
        parser.feed(chunk);
    }
    return events;
}
(0, vitest_1.describe)('eventsource-parser with noisy process output', function () {
    (0, vitest_1.test)('extracts data: json lines from garbage output', function () {
        var chunks = [
            'Starting server on port 3000...\n',
            '[INFO] Loading configuration\n',
            'WARNING: deprecated API usage detected\n',
            'data: {"type":"start","id":1}\n\n',
            'Compiling 42 modules...\n',
            '✓ Built in 1.2s\n',
            '[DEBUG] cache miss for key abc123\n',
            'data: {"type":"progress","percent":50}\n\n',
            'error: ENOENT /tmp/missing.txt (non-fatal, skipping)\n',
            '  at Object.openSync (node:fs:601:3)\n',
            '  at readFileSync (node:fs:469:35)\n',
            'data: {"type":"result","payload":{"name":"test","value":42}}\n\n',
            'Shutting down gracefully...\n',
            '[METRIC] requests=1024 latency_p99=12ms\n',
            'data: {"type":"end","id":4}\n\n',
        ];
        var events = parseSSEFromChunks(chunks);
        var parsed = events.map(function (e) {
            return JSON.parse(e.data);
        });
        (0, vitest_1.expect)(parsed).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  {\n\t\t\t    \"id\": 1,\n\t\t\t    \"type\": \"start\",\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"percent\": 50,\n\t\t\t    \"type\": \"progress\",\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"payload\": {\n\t\t\t      \"name\": \"test\",\n\t\t\t      \"value\": 42,\n\t\t\t    },\n\t\t\t    \"type\": \"result\",\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"id\": 4,\n\t\t\t    \"type\": \"end\",\n\t\t\t  },\n\t\t\t]\n\t\t");
    });
    (0, vitest_1.test)('handles data: lines split across chunks', function () {
        var chunks = [
            'some garbage\n',
            'dat',
            'a: {"split":true}\n\n',
            'more garbage\n',
        ];
        var events = parseSSEFromChunks(chunks);
        var parsed = events.map(function (e) {
            return JSON.parse(e.data);
        });
        (0, vitest_1.expect)(parsed).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  {\n\t\t\t    \"split\": true,\n\t\t\t  },\n\t\t\t]\n\t\t");
    });
    (0, vitest_1.test)('handles multi-line data fields', function () {
        var chunks = [
            '[LOG] something\n',
            'data: {"line":1}\n',
            'data: {"line":2}\n\n',
            'noise\n',
        ];
        var events = parseSSEFromChunks(chunks);
        // multi-line data gets joined with newlines per SSE spec
        (0, vitest_1.expect)(events.map(function (e) {
            return e.data;
        })).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  \"{\"line\":1}\n\t\t\t{\"line\":2}\",\n\t\t\t]\n\t\t");
    });
    (0, vitest_1.test)('ignores lines that look like data but are not SSE format', function () {
        var chunks = [
            'database: connection established\n',
            'data: {"real":"event"}\n\n',
            'datadir: /var/lib/app\n',
            'data:no-space-after-colon\n\n',
            '  data: indented-data-line\n\n',
        ];
        var events = parseSSEFromChunks(chunks);
        (0, vitest_1.expect)(events.map(function (e) {
            return e.data;
        })).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  \"{\"real\":\"event\"}\",\n\t\t\t  \"no-space-after-colon\",\n\t\t\t]\n\t\t");
    });
    (0, vitest_1.test)('data: in middle of a line', function () {
        var chunks = [
            'some prefix data: {"mid":true}\n\n',
            'the output is data: not this\n\n',
            'data: {"real":"event"}\n\n',
            'foo=bar data: {"also":"mid"} more stuff\n\n',
            '[2024-01-01] data: {"log":"entry"}\n\n',
        ];
        var events = parseSSEFromChunks(chunks);
        (0, vitest_1.expect)(events.map(function (e) {
            return e.data;
        })).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  \"{\"real\":\"event\"}\",\n\t\t\t]\n\t\t");
    });
    (0, vitest_1.test)('raw json without data: prefix', function () {
        var chunks = [
            '{"bare":"json"}\n\n',
            'data: {"real":"event"}\n\n',
            'some text {"embedded":"json"} more text\n\n',
            '{"start":"of line"} trailing\n\n',
            '  {"indented":"json"}\n\n',
            '[{"array":"json"},{"second":"obj"}]\n\n',
            'data: {"second":"real"}\n\n',
        ];
        var events = parseSSEFromChunks(chunks);
        (0, vitest_1.expect)(events.map(function (e) {
            return e.data;
        })).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  \"{\"real\":\"event\"}\",\n\t\t\t  \"{\"second\":\"real\"}\",\n\t\t\t]\n\t\t");
    });
    (0, vitest_1.test)('other SSE fields from process noise pollute event metadata', function () {
        var chunks = [
            // process outputs that happen to match SSE field names
            'id: proc-12345\n',
            'event: error\n',
            'retry: 5000\n',
            ': this is a comment\n',
            'data: {"real":"payload"}\n\n',
        ];
        var events = parseSSEFromChunks(chunks);
        // check if the garbage id:/event: lines leaked into the real event
        (0, vitest_1.expect)(events.map(function (e) {
            return { data: e.data, id: e.id, event: e.event };
        })).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  {\n\t\t\t    \"data\": \"{\"real\":\"payload\"}\",\n\t\t\t    \"event\": \"error\",\n\t\t\t    \"id\": \"proc-12345\",\n\t\t\t  },\n\t\t\t]\n\t\t");
    });
    (0, vitest_1.test)('event: between two data events only affects the next one', function () {
        var chunks = [
            'data: {"first":"clean"}\n\n',
            'event: contaminated\n',
            'data: {"second":"dirty?"}\n\n',
            'data: {"third":"clean again?"}\n\n',
        ];
        var events = parseSSEFromChunks(chunks);
        (0, vitest_1.expect)(events.map(function (e) {
            return { data: e.data, event: e.event };
        })).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  {\n\t\t\t    \"data\": \"{\"first\":\"clean\"}\",\n\t\t\t    \"event\": undefined,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"data\": \"{\"second\":\"dirty?\"}\",\n\t\t\t    \"event\": \"contaminated\",\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"data\": \"{\"third\":\"clean again?\"}\",\n\t\t\t    \"event\": undefined,\n\t\t\t  },\n\t\t\t]\n\t\t");
    });
    (0, vitest_1.test)('id: from noise persists across events', function () {
        var chunks = [
            'data: {"before":"id"}\n\n',
            'id: noise-id-999\n',
            'data: {"after":"id"}\n\n',
            'data: {"later":"event"}\n\n',
        ];
        var events = parseSSEFromChunks(chunks);
        (0, vitest_1.expect)(events.map(function (e) {
            return { data: e.data, id: e.id };
        })).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  {\n\t\t\t    \"data\": \"{\"before\":\"id\"}\",\n\t\t\t    \"id\": undefined,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"data\": \"{\"after\":\"id\"}\",\n\t\t\t    \"id\": \"noise-id-999\",\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"data\": \"{\"later\":\"event\"}\",\n\t\t\t    \"id\": undefined,\n\t\t\t  },\n\t\t\t]\n\t\t");
    });
    (0, vitest_1.test)('realistic process output with dangerous prefixes', function () {
        var chunks = [
            'event loop blocked for 200ms\n',
            'id: user-abc logged in\n',
            'retry after 3 attempts\n',
            'data: {"safe":"event"}\n\n',
            'identifier: session-xyz\n',
            'eventually consistent\n',
            'retrying connection...\n',
            'data: {"second":"event"}\n\n',
        ];
        var events = parseSSEFromChunks(chunks);
        (0, vitest_1.expect)(events.map(function (e) {
            return { data: e.data, id: e.id, event: e.event };
        })).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  {\n\t\t\t    \"data\": \"{\"safe\":\"event\"}\",\n\t\t\t    \"event\": undefined,\n\t\t\t    \"id\": \"user-abc logged in\",\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"data\": \"{\"second\":\"event\"}\",\n\t\t\t    \"event\": undefined,\n\t\t\t    \"id\": undefined,\n\t\t\t  },\n\t\t\t]\n\t\t");
    });
    (0, vitest_1.test)('works with rapid interleaved garbage and data', function () {
        var garbage = [
            '0x7fff5fbff8c0',
            'Segfault at 0xDEADBEEF (just kidding)',
            '█████████░░░░ 65%',
            '🔥 hot reload triggered',
            'npm warn deprecated lodash@3.0.0',
        ];
        var jsonPayloads = Array.from({ length: 10 }, function (_, i) {
            return { seq: i, ts: 1000 + i };
        });
        var chunks = jsonPayloads.flatMap(function (payload, i) {
            return [
                "".concat(garbage[i % garbage.length], "\n"),
                "data: ".concat(JSON.stringify(payload), "\n\n"),
            ];
        });
        var events = parseSSEFromChunks(chunks);
        var parsed = events.map(function (e) {
            return JSON.parse(e.data);
        });
        (0, vitest_1.expect)(parsed).toMatchInlineSnapshot("\n\t\t\t[\n\t\t\t  {\n\t\t\t    \"seq\": 0,\n\t\t\t    \"ts\": 1000,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"seq\": 1,\n\t\t\t    \"ts\": 1001,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"seq\": 2,\n\t\t\t    \"ts\": 1002,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"seq\": 3,\n\t\t\t    \"ts\": 1003,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"seq\": 4,\n\t\t\t    \"ts\": 1004,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"seq\": 5,\n\t\t\t    \"ts\": 1005,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"seq\": 6,\n\t\t\t    \"ts\": 1006,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"seq\": 7,\n\t\t\t    \"ts\": 1007,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"seq\": 8,\n\t\t\t    \"ts\": 1008,\n\t\t\t  },\n\t\t\t  {\n\t\t\t    \"seq\": 9,\n\t\t\t    \"ts\": 1009,\n\t\t\t  },\n\t\t\t]\n\t\t");
    });
});
