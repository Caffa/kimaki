"use strict";
// Shared OpenCode and Kimaki command resolution helpers.
// Normalizes `which`/`where` output across platforms, builds safe spawn
// arguments for Windows npm `.cmd` shims without relying on `shell: true`,
// and creates a stable `kimaki` shim for OpenCode child processes.
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
exports.splitCommandLookupOutput = splitCommandLookupOutput;
exports.selectResolvedCommand = selectResolvedCommand;
exports.getSpawnCommandAndArgs = getSpawnCommandAndArgs;
exports.ensureKimakiCommandShim = ensureKimakiCommandShim;
exports.prependPathEntry = prependPathEntry;
exports.getPathEnvKey = getPathEnvKey;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var WINDOWS_CMD_SHIM_REGEX = /\.(cmd|bat)$/i;
function quotePosixShellSegment(value) {
    return "'".concat(value.replaceAll("'", "'\\''"), "'");
}
function splitCommandLookupOutput(output) {
    return output
        .split(/\r?\n/g)
        .map(function (line) {
        return line.trim();
    })
        .filter(function (line) {
        return line.length > 0;
    });
}
function selectResolvedCommand(_a) {
    var output = _a.output, isWindows = _a.isWindows;
    var lines = splitCommandLookupOutput(output);
    if (lines.length === 0) {
        return null;
    }
    if (!isWindows) {
        return lines[0] || null;
    }
    var cmdShim = lines.find(function (line) {
        return WINDOWS_CMD_SHIM_REGEX.test(line);
    });
    return cmdShim || lines[0] || null;
}
function quoteWindowsCommandSegment(value) {
    if (!/[\s"]/u.test(value)) {
        return value;
    }
    return "\"".concat(value.replaceAll('"', '\\"'), "\"");
}
function getSpawnCommandAndArgs(_a) {
    var resolvedCommand = _a.resolvedCommand, baseArgs = _a.baseArgs, platform = _a.platform;
    var effectivePlatform = platform || process.platform;
    if (effectivePlatform !== 'win32') {
        return { command: resolvedCommand, args: baseArgs };
    }
    if (!WINDOWS_CMD_SHIM_REGEX.test(resolvedCommand)) {
        return { command: resolvedCommand, args: baseArgs };
    }
    return {
        command: 'cmd.exe',
        args: __spreadArray([
            '/d',
            '/s',
            '/c',
            quoteWindowsCommandSegment(resolvedCommand)
        ], baseArgs.map(function (arg) {
            return quoteWindowsCommandSegment(arg);
        }), true),
        // Let cmd.exe receive the command line exactly as constructed above.
        // Without this, Node re-quotes the executable segment and npm shim paths
        // like `C:\Program Files\nodejs\opencode.cmd` break again.
        windowsVerbatimArguments: true,
    };
}
function ensureKimakiCommandShim(_a) {
    var dataDir = _a.dataDir, execPath = _a.execPath, execArgv = _a.execArgv, entryScript = _a.entryScript, platform = _a.platform;
    var effectivePlatform = platform || process.platform;
    var shimDirectory = node_path_1.default.join(dataDir, 'bin');
    try {
        node_fs_1.default.mkdirSync(shimDirectory, { recursive: true });
        var launcherArgs = __spreadArray(__spreadArray([], execArgv, true), [entryScript], false);
        if (effectivePlatform === 'win32') {
            var shimPath_1 = node_path_1.default.join(shimDirectory, 'kimaki.cmd');
            var shimContent_1 = [
                '@echo off',
                __spreadArray([execPath], launcherArgs, true).map(function (segment) {
                    return "\"".concat(segment.replaceAll('"', '""'), "\"");
                }).join(' ') + ' %*',
                '',
            ].join('\r\n');
            writeShimIfNeeded({
                shimPath: shimPath_1,
                shimContent: shimContent_1,
            });
            return shimDirectory;
        }
        var shimPath = node_path_1.default.join(shimDirectory, 'kimaki');
        var shimContent = [
            '#!/bin/sh',
            "exec ".concat(__spreadArray([execPath], launcherArgs, true).map(function (segment) {
                return quotePosixShellSegment(segment);
            }).join(' '), " \"$@\""),
            '',
        ].join('\n');
        writeShimIfNeeded({
            shimPath: shimPath,
            shimContent: shimContent,
            mode: 493,
        });
        return shimDirectory;
    }
    catch (cause) {
        return new Error('Failed to create kimaki command shim', { cause: cause });
    }
}
function prependPathEntry(_a) {
    var entry = _a.entry, existingPath = _a.existingPath;
    var pathEntries = (existingPath || '').split(node_path_1.default.delimiter).filter(function (segment) {
        return segment.length > 0;
    });
    if (pathEntries.includes(entry)) {
        return existingPath || entry;
    }
    return __spreadArray([entry], pathEntries, true).join(node_path_1.default.delimiter);
}
function getPathEnvKey(env) {
    return Object.keys(env).find(function (key) {
        return key.toLowerCase() === 'path';
    }) || 'PATH';
}
function writeShimIfNeeded(_a) {
    var shimPath = _a.shimPath, shimContent = _a.shimContent, mode = _a.mode;
    var existingContent = node_fs_1.default.existsSync(shimPath)
        ? node_fs_1.default.readFileSync(shimPath, 'utf8')
        : null;
    if (existingContent !== shimContent) {
        node_fs_1.default.writeFileSync(shimPath, shimContent, 'utf8');
    }
    if (mode !== undefined) {
        node_fs_1.default.chmodSync(shimPath, mode);
    }
}
