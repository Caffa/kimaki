"use strict";
// Type definitions, tagged errors, and constants for forum sync.
// All shared types and error classes live here to avoid circular dependencies
// between the sync modules.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForumFrontmatterParseError = exports.ForumSyncOperationError = exports.ForumChannelResolveError = exports.WRITE_IGNORE_TTL_MS = exports.DEFAULT_RATE_LIMIT_DELAY_MS = exports.DEFAULT_DEBOUNCE_MS = void 0;
exports.delay = delay;
exports.addIgnoredPath = addIgnoredPath;
exports.shouldIgnorePath = shouldIgnorePath;
var errore = require("errore");
// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════
exports.DEFAULT_DEBOUNCE_MS = 800;
exports.DEFAULT_RATE_LIMIT_DELAY_MS = 250;
exports.WRITE_IGNORE_TTL_MS = 2000;
// ═══════════════════════════════════════════════════════════════════════════
// TAGGED ERRORS
// ═══════════════════════════════════════════════════════════════════════════
var ForumChannelResolveError = /** @class */ (function (_super) {
    __extends(ForumChannelResolveError, _super);
    function ForumChannelResolveError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ForumChannelResolveError;
}(errore.createTaggedError({
    name: 'ForumChannelResolveError',
    message: 'Could not resolve forum channel $forumChannelId',
})));
exports.ForumChannelResolveError = ForumChannelResolveError;
var ForumSyncOperationError = /** @class */ (function (_super) {
    __extends(ForumSyncOperationError, _super);
    function ForumSyncOperationError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ForumSyncOperationError;
}(errore.createTaggedError({
    name: 'ForumSyncOperationError',
    message: 'Forum sync operation failed for forum $forumChannelId: $reason',
})));
exports.ForumSyncOperationError = ForumSyncOperationError;
var ForumFrontmatterParseError = /** @class */ (function (_super) {
    __extends(ForumFrontmatterParseError, _super);
    function ForumFrontmatterParseError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ForumFrontmatterParseError;
}(errore.createTaggedError({
    name: 'ForumFrontmatterParseError',
    message: 'Failed to parse frontmatter: $reason',
})));
exports.ForumFrontmatterParseError = ForumFrontmatterParseError;
// ═══════════════════════════════════════════════════════════════════════════
// SHARED UTILITIES
// ═══════════════════════════════════════════════════════════════════════════
function delay(_a) {
    var ms = _a.ms;
    return new Promise(function (resolve) {
        setTimeout(resolve, ms);
    });
}
/** Mark a file path as recently written so the file watcher ignores it. */
function addIgnoredPath(_a) {
    var runtimeState = _a.runtimeState, filePath = _a.filePath;
    if (!runtimeState)
        return;
    runtimeState.ignoredPaths.set(filePath, Date.now() + exports.WRITE_IGNORE_TTL_MS);
}
/** Check if a file path was recently written by us and should be ignored. */
function shouldIgnorePath(_a) {
    var runtimeState = _a.runtimeState, filePath = _a.filePath;
    var expiresAt = runtimeState.ignoredPaths.get(filePath);
    if (!expiresAt)
        return false;
    if (expiresAt < Date.now()) {
        runtimeState.ignoredPaths.delete(filePath);
        return false;
    }
    return true;
}
