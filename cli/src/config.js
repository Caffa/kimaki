"use strict";
// Runtime configuration for Kimaki bot.
// Thin re-export layer over the centralized zustand store (store.ts).
// Getter/setter functions are kept for backwards compatibility so existing
// import sites don't need to change. They delegate to store.getState() and
// store.setState() under the hood.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataDir = getDataDir;
exports.setDataDir = setDataDir;
exports.getProjectsDir = getProjectsDir;
exports.setProjectsDir = setProjectsDir;
exports.getLockPort = getLockPort;
var node_fs_1 = require("node:fs");
var node_os_1 = require("node:os");
var node_path_1 = require("node:path");
var store_js_1 = require("./store.js");
var DEFAULT_DATA_DIR = node_path_1.default.join(node_os_1.default.homedir(), '.kimaki');
/**
 * Get the data directory path.
 * Falls back to ~/.kimaki if not explicitly set.
 * Under vitest (KIMAKI_VITEST env var), auto-creates an isolated temp dir so
 * tests never touch the real ~/.kimaki/ database. Tests that need a specific
 * dir can still call setDataDir() before any DB access to override this.
 */
function getDataDir() {
    var current = store_js_1.store.getState().dataDir;
    if (current) {
        return current;
    }
    if (process.env.KIMAKI_VITEST) {
        var tmpDir = node_fs_1.default.mkdtempSync(node_path_1.default.join(node_os_1.default.tmpdir(), 'kimaki-test-'));
        store_js_1.store.setState({ dataDir: tmpDir });
        return tmpDir;
    }
    store_js_1.store.setState({ dataDir: DEFAULT_DATA_DIR });
    return DEFAULT_DATA_DIR;
}
/**
 * Set the data directory path.
 * Creates the directory if it doesn't exist.
 * Must be called before any database or path-dependent operations.
 */
function setDataDir(dir) {
    var resolvedDir = node_path_1.default.resolve(dir);
    if (!node_fs_1.default.existsSync(resolvedDir)) {
        node_fs_1.default.mkdirSync(resolvedDir, { recursive: true });
    }
    store_js_1.store.setState({ dataDir: resolvedDir });
}
/**
 * Get the projects directory path (for /create-new-project command).
 * Returns the custom --projects-dir if set, otherwise <dataDir>/projects.
 */
function getProjectsDir() {
    var custom = store_js_1.store.getState().projectsDir;
    if (custom) {
        return custom;
    }
    return node_path_1.default.join(getDataDir(), 'projects');
}
/**
 * Set a custom projects directory path (from --projects-dir CLI flag).
 * Creates the directory if it doesn't exist.
 */
function setProjectsDir(dir) {
    var resolvedDir = node_path_1.default.resolve(dir);
    if (!node_fs_1.default.existsSync(resolvedDir)) {
        node_fs_1.default.mkdirSync(resolvedDir, { recursive: true });
    }
    store_js_1.store.setState({ projectsDir: resolvedDir });
}
var DEFAULT_LOCK_PORT = 29988;
/**
 * Derive a lock port from the data directory path.
 * If KIMAKI_LOCK_PORT is set to a valid TCP port, it takes precedence.
 * Returns 29988 for the default ~/.kimaki directory (backwards compatible).
 * For custom data dirs, uses a hash to generate a port in the range 30000-39999.
 */
function getLockPort() {
    var envPortRaw = process.env['KIMAKI_LOCK_PORT'];
    if (envPortRaw) {
        var envPort = Number.parseInt(envPortRaw, 10);
        if (Number.isInteger(envPort) && envPort >= 1 && envPort <= 65535) {
            return envPort;
        }
    }
    var dir = getDataDir();
    // Use original port for default data dir (backwards compatible)
    if (dir === DEFAULT_DATA_DIR) {
        return DEFAULT_LOCK_PORT;
    }
    // Hash-based port for custom data dirs
    var hash = 0;
    for (var i = 0; i < dir.length; i++) {
        var char = dir.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    // Map to port range 30000-39999
    return 30000 + (Math.abs(hash) % 10000);
}
