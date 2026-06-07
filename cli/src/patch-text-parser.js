"use strict";
// Shared apply_patch text parsing utilities.
// Used by diff-patch-plugin.ts (file path extraction for snapshots) and
// message-formatting.ts (per-file addition/deletion counts for Discord display).
//
// The apply_patch tool uses three path header formats:
//   *** Add File: path    — new file
//   *** Update File: path — existing file edit
//   *** Delete File: path — file removal
//   *** Move to: path     — rename destination
//   --- a/path / +++ b/path — unified diff headers (fallback)
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
exports.extractPatchFilePaths = extractPatchFilePaths;
exports.parsePatchFileCounts = parsePatchFileCounts;
/**
 * Extract all file paths referenced in a patchText string.
 * Handles custom apply_patch headers, move targets, and unified diff headers.
 * Returns deduplicated paths.
 */
function extractPatchFilePaths(patchText) {
    var custom = __spreadArray([], patchText.matchAll(/^\*\*\* (?:Add|Update|Delete) File:\s+(.+)$/gm), true).map(function (m) {
        var _a;
        return ((_a = m[1]) !== null && _a !== void 0 ? _a : '').trim();
    });
    var moved = __spreadArray([], patchText.matchAll(/^\*\*\* Move to:\s+(.+)$/gm), true).map(function (m) {
        var _a;
        return ((_a = m[1]) !== null && _a !== void 0 ? _a : '').trim();
    });
    var unified = __spreadArray([], patchText.matchAll(/^(?:---|\+\+\+) [ab]\/(.+)$/gm), true).map(function (m) {
        var _a;
        return ((_a = m[1]) !== null && _a !== void 0 ? _a : '').trim();
    });
    var all = __spreadArray(__spreadArray(__spreadArray([], custom, true), moved, true), unified, true).filter(Boolean);
    return all.filter(function (v, i, a) {
        return a.indexOf(v) === i;
    });
}
/**
 * Parse a patchText string and count additions/deletions per file.
 * Patch format uses `*** Add File:`, `*** Update File:`, `*** Delete File:` headers,
 * with diff lines prefixed by `+` (addition) or `-` (deletion) inside `@@` hunks.
 */
function parsePatchFileCounts(patchText) {
    var _a;
    var counts = new Map();
    var lines = patchText.split('\n');
    var currentFile = '';
    var currentType = '';
    var inHunk = false;
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var addMatch = line.match(/^\*\*\* Add File:\s*(.+)/);
        var updateMatch = line.match(/^\*\*\* Update File:\s*(.+)/);
        var deleteMatch = line.match(/^\*\*\* Delete File:\s*(.+)/);
        if (addMatch || updateMatch || deleteMatch) {
            var match = addMatch || updateMatch || deleteMatch;
            currentFile = ((_a = match === null || match === void 0 ? void 0 : match[1]) !== null && _a !== void 0 ? _a : '').trim();
            currentType = addMatch ? 'add' : updateMatch ? 'update' : 'delete';
            counts.set(currentFile, { additions: 0, deletions: 0 });
            inHunk = false;
            continue;
        }
        if (line.startsWith('@@')) {
            inHunk = true;
            continue;
        }
        if (line.startsWith('*** ')) {
            inHunk = false;
            continue;
        }
        if (!currentFile) {
            continue;
        }
        var entry = counts.get(currentFile);
        if (!entry) {
            continue;
        }
        if (currentType === 'add') {
            // all content lines in Add File are additions
            if (line.length > 0 && !line.startsWith('*** ')) {
                entry.additions++;
            }
        }
        else if (currentType === 'delete') {
            // all content lines in Delete File are deletions
            if (line.length > 0 && !line.startsWith('*** ')) {
                entry.deletions++;
            }
        }
        else if (inHunk) {
            if (line.startsWith('+')) {
                entry.additions++;
            }
            else if (line.startsWith('-')) {
                entry.deletions++;
            }
        }
    }
    return counts;
}
