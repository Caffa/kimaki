"use strict";
// Heap memory monitor and snapshot writer.
// Periodically checks V8 heap usage and writes gzip-compressed .heapsnapshot.gz
// files to ~/.kimaki/heap-snapshots/ when memory usage is high.
// Also exposes writeHeapSnapshot() for on-demand snapshots via SIGUSR1.
//
// Snapshots use v8.getHeapSnapshot() streaming API piped through gzip for ~5-10x
// size reduction (heap snapshots are JSON, so they compress very well).
//
// Only active in development (detected by import.meta.filename ending in .ts).
// In production (compiled .js from npm), the monitor is a no-op to avoid filling
// user disks with multi-GB snapshot files.
//
// Threshold: 85% heap used -> write snapshot for debugging
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeHeapSnapshot = writeHeapSnapshot;
exports.startHeapMonitor = startHeapMonitor;
exports.stopHeapMonitor = stopHeapMonitor;
var node_v8_1 = require("node:v8");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var node_zlib_1 = require("node:zlib");
var promises_1 = require("node:stream/promises");
var node_url_1 = require("node:url");
var config_js_1 = require("./config.js");
var logger_js_1 = require("./logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.HEAP);
var SNAPSHOT_THRESHOLD = 0.85;
var CHECK_INTERVAL_MS = 30000;
// After writing a snapshot, wait at least 5 minutes before writing another
var SNAPSHOT_COOLDOWN_MS = 5 * 60 * 1000;
// Development detection: if this file is .ts we're running from source (tsx/ts-node).
// Compiled npm package runs from .js files.
var isDevelopment = (0, node_url_1.fileURLToPath)(import.meta.url).endsWith('.ts');
var lastSnapshotTime = 0;
var monitorInterval = null;
function getHeapSnapshotDir() {
    return node_path_1.default.join((0, config_js_1.getDataDir)(), 'heap-snapshots');
}
function ensureSnapshotDir() {
    var dir = getHeapSnapshotDir();
    if (!node_fs_1.default.existsSync(dir)) {
        node_fs_1.default.mkdirSync(dir, { recursive: true });
    }
    return dir;
}
function getHeapStats() {
    var stats = node_v8_1.default.getHeapStatistics();
    var usedMB = stats.used_heap_size / 1024 / 1024;
    var limitMB = stats.heap_size_limit / 1024 / 1024;
    var ratio = stats.used_heap_size / stats.heap_size_limit;
    return { usedMB: usedMB, limitMB: limitMB, ratio: ratio };
}
/**
 * Write a gzip-compressed V8 heap snapshot to ~/.kimaki/heap-snapshots/.
 * Uses v8.getHeapSnapshot() streaming API piped through gzip for ~5-10x
 * size reduction compared to v8.writeHeapSnapshot().
 * Filename includes ISO date and current heap size for easy identification.
 * Returns the snapshot file path.
 */
function writeHeapSnapshot() {
    return __awaiter(this, void 0, void 0, function () {
        var dir, _a, usedMB, limitMB, ratio, pct, timestamp, filename, filepath, snapshotStream, gzipStream, fileStream, fileSizeMB;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    dir = ensureSnapshotDir();
                    _a = getHeapStats(), usedMB = _a.usedMB, limitMB = _a.limitMB, ratio = _a.ratio;
                    pct = (ratio * 100).toFixed(1);
                    timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    filename = "heap-".concat(timestamp, "-").concat(Math.round(usedMB), "MB.heapsnapshot.gz");
                    filepath = node_path_1.default.join(dir, filename);
                    logger.log("Writing compressed heap snapshot (".concat(Math.round(usedMB), "MB / ").concat(Math.round(limitMB), "MB, ").concat(pct, "%)"));
                    snapshotStream = node_v8_1.default.getHeapSnapshot();
                    gzipStream = node_zlib_1.default.createGzip({ level: node_zlib_1.default.constants.Z_BEST_SPEED });
                    fileStream = node_fs_1.default.createWriteStream(filepath);
                    return [4 /*yield*/, (0, promises_1.pipeline)(snapshotStream, gzipStream, fileStream)];
                case 1:
                    _b.sent();
                    fileSizeMB = (node_fs_1.default.statSync(filepath).size / 1024 / 1024).toFixed(1);
                    logger.log("Snapshot saved: ".concat(filepath, " (").concat(fileSizeMB, "MB compressed)"));
                    return [2 /*return*/, filepath];
            }
        });
    });
}
function checkHeapUsage() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, usedMB, limitMB, ratio, pct, now, e_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = getHeapStats(), usedMB = _a.usedMB, limitMB = _a.limitMB, ratio = _a.ratio;
                    pct = (ratio * 100).toFixed(1);
                    if (!(ratio >= SNAPSHOT_THRESHOLD)) return [3 /*break*/, 6];
                    logger.warn("Heap at ".concat(pct, "% (").concat(Math.round(usedMB), "MB / ").concat(Math.round(limitMB), "MB) - exceeds snapshot threshold (").concat(SNAPSHOT_THRESHOLD * 100, "%)"));
                    now = Date.now();
                    if (!(now - lastSnapshotTime >= SNAPSHOT_COOLDOWN_MS)) return [3 /*break*/, 5];
                    lastSnapshotTime = now;
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, writeHeapSnapshot()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _b.sent();
                    logger.error('Failed to write heap snapshot:', e_1 instanceof Error ? e_1.message : String(e_1));
                    return [3 /*break*/, 4];
                case 4: return [3 /*break*/, 6];
                case 5:
                    logger.log('Snapshot cooldown active, skipping');
                    _b.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Start the periodic heap usage monitor.
 * Checks every 30s and writes snapshots when threshold is exceeded.
 * Only active in development (running from .ts source). In production
 * (compiled .js from npm), this is a no-op to avoid filling user disks.
 */
function startHeapMonitor() {
    if (!isDevelopment) {
        return;
    }
    if (monitorInterval) {
        return;
    }
    // Ensure the snapshot directory exists so V8's --diagnostic-dir has a valid target.
    // Also needed for our own writeHeapSnapshot() calls.
    ensureSnapshotDir();
    var _a = getHeapStats(), usedMB = _a.usedMB, limitMB = _a.limitMB, ratio = _a.ratio;
    logger.log("Heap monitor started (".concat(Math.round(usedMB), "MB / ").concat(Math.round(limitMB), "MB, ").concat((ratio * 100).toFixed(1), "%) - ") +
        "snapshot at ".concat(SNAPSHOT_THRESHOLD * 100, "%"));
    monitorInterval = setInterval(function () {
        void checkHeapUsage();
    }, CHECK_INTERVAL_MS);
    // Don't prevent process exit
    monitorInterval.unref();
}
function stopHeapMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }
}
