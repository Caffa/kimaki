"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.execAsync = execAsync;
var node_child_process_1 = require("node:child_process");
var node_util_1 = require("node:util");
var DEFAULT_EXEC_TIMEOUT_MS = 10000;
var _execAsync = (0, node_util_1.promisify)(node_child_process_1.exec);
function execAsync(command, options) {
    var timeoutMs = (options === null || options === void 0 ? void 0 : options.timeout) || DEFAULT_EXEC_TIMEOUT_MS;
    var execPromise = _execAsync(command, options);
    var timer;
    var timeoutPromise = new Promise(function (_, reject) {
        timer = setTimeout(function () {
            var _a, _b;
            var pid = (_a = execPromise.child) === null || _a === void 0 ? void 0 : _a.pid;
            if (pid) {
                try {
                    process.kill(-pid, 'SIGTERM');
                }
                catch (_c) {
                    (_b = execPromise.child) === null || _b === void 0 ? void 0 : _b.kill('SIGTERM');
                }
            }
            reject(new Error("Command timed out after ".concat(timeoutMs, "ms: ").concat(command)));
        }, timeoutMs);
    });
    return Promise.race([execPromise, timeoutPromise]).finally(function () {
        clearTimeout(timer);
    });
}
