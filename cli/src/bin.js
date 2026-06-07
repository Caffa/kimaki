"use strict";
// Respawn wrapper for the kimaki bot process.
// When running the default command (no subcommand) with --auto-restart,
// spawns cli.js as a child process and restarts it on non-zero exit codes
// (crash, OOM kill, etc). Intentional exits (code 0 or EXIT_NO_RESTART=64)
// are not restarted.
//
// Subcommands (send, tunnel, project, etc.) run directly without the wrapper
// since they are short-lived and don't need crash recovery.
//
// When __KIMAKI_CHILD is set, we're the child process -- just run cli.js directly.
//
// V8 heap snapshot flags:
// Injects --heapsnapshot-near-heap-limit=3 and --diagnostic-dir so V8 writes
// heap snapshots internally as it approaches the heap limit. This catches OOM
// situations where SIGKILL (exit 137) would kill the process before our
// heap-monitor.ts polling can react. The polling monitor is kept as an early
// warning system at 85% usage; the V8 flag is the last-resort safety net.
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
var node_child_process_1 = require("node:child_process");
var node_fs_1 = require("node:fs");
var node_os_1 = require("node:os");
var node_path_1 = require("node:path");
var HEAP_SNAPSHOT_DIR = node_path_1.default.join(node_os_1.default.homedir(), '.kimaki', 'heap-snapshots');
// First arg after node + script is either a subcommand or a flag.
// If it doesn't start with '-', it's a subcommand (e.g. "send", "tunnel", "project").
var firstArg = process.argv[2];
var isSubcommand = firstArg && !firstArg.startsWith('-');
var isHelpFlag = process.argv.includes('--help');
if (process.env.__KIMAKI_CHILD || isSubcommand || isHelpFlag) {
    await Promise.resolve().then(function () { return require('./cli.js'); });
}
else {
    console.error('no subcommand detected. kimaki will automatically restart on crash');
    console.error();
    var EXIT_NO_RESTART_1 = 64;
    var MAX_RAPID_RESTARTS_1 = 5;
    var RAPID_RESTART_WINDOW_MS_1 = 60000;
    var RESTART_DELAY_MS_1 = 2000;
    var restartTimestamps_1 = [];
    var child_1 = null;
    // Track when we forwarded a termination signal so we don't restart after graceful shutdown
    var shutdownRequested_1 = false;
    function start() {
        if (!node_fs_1.default.existsSync(HEAP_SNAPSHOT_DIR)) {
            node_fs_1.default.mkdirSync(HEAP_SNAPSHOT_DIR, { recursive: true });
        }
        var heapArgs = [
            "--heapsnapshot-near-heap-limit=3",
            "--diagnostic-dir=".concat(HEAP_SNAPSHOT_DIR),
        ];
        var args = __spreadArray(__spreadArray(__spreadArray([], heapArgs, true), process.execArgv, true), process.argv.slice(1), true);
        child_1 = (0, node_child_process_1.spawn)(process.argv[0], args, {
            stdio: 'inherit',
            env: __assign(__assign({}, process.env), { __KIMAKI_CHILD: '1' }),
        });
        child_1.on('exit', function (code, signal) {
            if (code === 0 || code === EXIT_NO_RESTART_1 || shutdownRequested_1) {
                process.exit(code !== null && code !== void 0 ? code : 0);
                return;
            }
            var now = Date.now();
            restartTimestamps_1.push(now);
            while (restartTimestamps_1.length > 0 &&
                restartTimestamps_1[0] < now - RAPID_RESTART_WINDOW_MS_1) {
                restartTimestamps_1.shift();
            }
            if (restartTimestamps_1.length > MAX_RAPID_RESTARTS_1) {
                console.error("[kimaki] Crash loop detected (".concat(MAX_RAPID_RESTARTS_1, " crashes in ").concat(RAPID_RESTART_WINDOW_MS_1 / 1000, "s), exiting"));
                process.exit(1);
                return;
            }
            var reason = signal ? "signal ".concat(signal) : "code ".concat(code);
            console.error("[kimaki] Process exited with ".concat(reason, ", restarting in ").concat(RESTART_DELAY_MS_1 / 1000, "s..."));
            setTimeout(start, RESTART_DELAY_MS_1);
        });
    }
    var _loop_1 = function (sig) {
        process.on(sig, function () {
            shutdownRequested_1 = true;
            child_1 === null || child_1 === void 0 ? void 0 : child_1.kill(sig);
        });
    };
    // Forward signals to child so graceful shutdown and heap snapshots work.
    // SIGTERM/SIGINT mark shutdownRequested so we don't restart after graceful exit.
    for (var _i = 0, _a = ['SIGTERM', 'SIGINT']; _i < _a.length; _i++) {
        var sig = _a[_i];
        _loop_1(sig);
    }
    var _loop_2 = function (sig) {
        process.on(sig, function () {
            child_1 === null || child_1 === void 0 ? void 0 : child_1.kill(sig);
        });
    };
    for (var _b = 0, _c = ['SIGUSR1', 'SIGUSR2']; _b < _c.length; _b++) {
        var sig = _c[_b];
        _loop_2(sig);
    }
    start();
}
