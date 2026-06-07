"use strict";
// Test script: start kimaki in --gateway mode programmatically, parse SSE events from stdout.
// Validates the non-TTY event flow: install_url → authorized → ready.
// Run with: npx tsx scripts/test-gateway-programmatic.ts
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
Object.defineProperty(exports, "__esModule", { value: true });
var node_child_process_1 = require("node:child_process");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_crypto_1 = require("node:crypto");
var eventsource_parser_1 = require("eventsource-parser");
var picocolors_1 = require("picocolors");
var eventColors = {
    install_url: picocolors_1.default.cyan,
    authorized: picocolors_1.default.green,
    ready: function (s) { return picocolors_1.default.bgGreen(picocolors_1.default.white(s)); },
    error: picocolors_1.default.red,
};
var eventLabels = {
    install_url: 'INSTALL URL',
    authorized: 'AUTHORIZED',
    ready: 'READY',
    error: 'ERROR',
};
function logEvent(event) {
    var color = eventColors[event.type];
    var label = eventLabels[event.type];
    var separator = picocolors_1.default.dim('─'.repeat(60));
    console.log(separator);
    console.log(color(picocolors_1.default.bold(" ".concat(label, " "))));
    console.log();
    switch (event.type) {
        case 'install_url': {
            console.log("  ".concat(picocolors_1.default.bold('Send this URL to the user:')));
            console.log("  ".concat(picocolors_1.default.cyan(event.url)));
            break;
        }
        case 'authorized': {
            console.log("  ".concat(picocolors_1.default.bold('Guild ID:'), " ").concat(event.guild_id));
            break;
        }
        case 'ready': {
            console.log("  ".concat(picocolors_1.default.bold('App ID:'), "    ").concat(event.app_id));
            console.log("  ".concat(picocolors_1.default.bold('Guild IDs:'), " ").concat(JSON.stringify(event.guild_ids)));
            break;
        }
        case 'error': {
            console.log("  ".concat(picocolors_1.default.red(picocolors_1.default.bold(event.message))));
            if (event.install_url) {
                console.log("  ".concat(picocolors_1.default.dim('install_url:'), " ").concat(event.install_url));
            }
            break;
        }
    }
    console.log(separator);
    console.log();
}
var tmpDir = node_path_1.default.join(process.cwd(), 'tmp', "kimaki-gateway-test-".concat(node_crypto_1.default.randomBytes(4).toString('hex')));
node_fs_1.default.mkdirSync(tmpDir, { recursive: true });
// Use a unique lock port to avoid conflicting with a running kimaki instance
var lockPort = 31100 + Math.floor(Math.random() * 900);
console.log("".concat(picocolors_1.default.dim('[test]'), " data dir: ").concat(picocolors_1.default.dim(tmpDir)));
console.log("".concat(picocolors_1.default.dim('[test]'), " lock port: ").concat(lockPort));
console.log("".concat(picocolors_1.default.dim('[test]'), " spawning kimaki --gateway --data-dir <tmpDir>"));
console.log("".concat(picocolors_1.default.dim('[test]'), " callback url: ").concat(picocolors_1.default.cyan('https://example.com/kimaki-callback')));
console.log();
var child = (0, node_child_process_1.spawn)('kimaki', [
    '--gateway',
    '--restart-onboarding',
    '--data-dir',
    tmpDir,
    '--gateway-callback-url',
    'https://example.com/kimaki-callback',
], {
    env: __assign(__assign({}, process.env), { KIMAKI_LOCK_PORT: String(lockPort) }),
    stdio: ['ignore', 'pipe', 'pipe'],
});
// Collect all parsed events for summary at the end
var receivedEvents = [];
var parser = (0, eventsource_parser_1.createParser)({
    onEvent: function (sseEvent) {
        try {
            var event_1 = JSON.parse(sseEvent.data);
            receivedEvents.push(event_1);
            logEvent(event_1);
            if (event_1.type === 'ready') {
                console.log(picocolors_1.default.bold(picocolors_1.default.green('EVENT SUMMARY')));
                console.log();
                for (var _i = 0, receivedEvents_1 = receivedEvents; _i < receivedEvents_1.length; _i++) {
                    var e = receivedEvents_1[_i];
                    var color = eventColors[e.type];
                    console.log("  ".concat(color(eventLabels[e.type].padEnd(12)), " ").concat(picocolors_1.default.dim(JSON.stringify(e))));
                }
                console.log();
                console.log("".concat(picocolors_1.default.dim('[test]'), " killing child process, test complete"));
                child.kill('SIGTERM');
            }
        }
        catch (_a) {
            console.log(picocolors_1.default.red("[sse] failed to parse event data: ".concat(sseEvent.data)));
        }
    },
});
child.stdout.on('data', function (chunk) {
    var text = chunk.toString();
    // Feed raw stdout to the SSE parser — it extracts data: lines, ignores everything else
    parser.feed(text);
    // Also print raw stdout so we can see logs/noise interleaved
    for (var _i = 0, _a = text.split('\n'); _i < _a.length; _i++) {
        var line = _a[_i];
        if (line.trim()) {
            console.log("".concat(picocolors_1.default.dim('[stdout]'), " ").concat(picocolors_1.default.dim(line)));
        }
    }
});
child.stderr.on('data', function (chunk) {
    var text = chunk.toString();
    for (var _i = 0, _a = text.split('\n'); _i < _a.length; _i++) {
        var line = _a[_i];
        if (line.trim()) {
            console.log("".concat(picocolors_1.default.yellow('[stderr]'), " ").concat(picocolors_1.default.dim(line)));
        }
    }
});
child.on('exit', function (code, signal) {
    console.log();
    console.log("".concat(picocolors_1.default.dim('[test]'), " process exited with code=").concat(code, " signal=").concat(signal));
    console.log("".concat(picocolors_1.default.dim('[test]'), " total SSE events received: ").concat(picocolors_1.default.bold(String(receivedEvents.length))));
    process.exit(0);
});
// Safety timeout: kill after 5 minutes
setTimeout(function () {
    console.log(picocolors_1.default.yellow('[test] timeout reached, killing process'));
    child.kill('SIGTERM');
}, 5 * 60 * 1000);
