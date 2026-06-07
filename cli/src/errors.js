"use strict";
// TaggedError definitions for type-safe error handling with errore.
// Errors are grouped by category: infrastructure, domain, and validation.
// Use errore.matchError() for exhaustive error handling in command handlers.
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
exports.GitCommandError = exports.PushError = exports.TargetDirtyWorktreeError = exports.ConflictingFilesError = exports.NotFastForwardError = exports.RebaseError = exports.RebaseConflictError = exports.NothingToMergeError = exports.DirtyWorktreeError = exports.OpenCodeApiError = exports.DiscordApiError = exports.FetchError = exports.NoToolResponseError = exports.NoResponseContentError = exports.EmptyTranscriptionError = exports.InvalidAudioFormatError = exports.GlobSearchError = exports.GrepSearchError = exports.TranscriptionError = exports.MessagesNotFoundError = exports.SessionCreateError = exports.SessionNotFoundError = exports.SessionAbortError = exports.ApiKeyMissingError = exports.ServerNotReadyError = exports.ServerStartError = exports.DirectoryNotAccessibleError = void 0;
var errore_1 = require("errore");
// ═══════════════════════════════════════════════════════════════════════════
// INFRASTRUCTURE ERRORS - Server, filesystem, external services
// ═══════════════════════════════════════════════════════════════════════════
var DirectoryNotAccessibleError = /** @class */ (function (_super) {
    __extends(DirectoryNotAccessibleError, _super);
    function DirectoryNotAccessibleError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DirectoryNotAccessibleError;
}((0, errore_1.createTaggedError)({
    name: 'DirectoryNotAccessibleError',
    message: 'Directory does not exist or is not accessible: $directory',
})));
exports.DirectoryNotAccessibleError = DirectoryNotAccessibleError;
var ServerStartError = /** @class */ (function (_super) {
    __extends(ServerStartError, _super);
    function ServerStartError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ServerStartError;
}((0, errore_1.createTaggedError)({
    name: 'ServerStartError',
    message: 'Server failed to start on port $port: $reason',
})));
exports.ServerStartError = ServerStartError;
var ServerNotReadyError = /** @class */ (function (_super) {
    __extends(ServerNotReadyError, _super);
    function ServerNotReadyError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ServerNotReadyError;
}((0, errore_1.createTaggedError)({
    name: 'ServerNotReadyError',
    message: 'OpenCode client for directory "$directory" is not available because the shared server is not ready',
})));
exports.ServerNotReadyError = ServerNotReadyError;
var ApiKeyMissingError = /** @class */ (function (_super) {
    __extends(ApiKeyMissingError, _super);
    function ApiKeyMissingError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ApiKeyMissingError;
}((0, errore_1.createTaggedError)({
    name: 'ApiKeyMissingError',
    message: '$service API key is required',
})));
exports.ApiKeyMissingError = ApiKeyMissingError;
// ═══════════════════════════════════════════════════════════════════════════
// ABORT ERRORS - Session cancellation with typed reasons
// ═══════════════════════════════════════════════════════════════════════════
// Extends errore.AbortError so errore.isAbortError() detects it in cause chains.
// Use reason field instead of string matching to identify abort cause.
var SessionAbortError = /** @class */ (function (_super) {
    __extends(SessionAbortError, _super);
    function SessionAbortError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return SessionAbortError;
}((0, errore_1.createTaggedError)({
    name: 'SessionAbortError',
    message: 'Session aborted: $reason',
    extends: errore_1.AbortError,
})));
exports.SessionAbortError = SessionAbortError;
// ═══════════════════════════════════════════════════════════════════════════
// DOMAIN ERRORS - Sessions, messages, transcription
// ═══════════════════════════════════════════════════════════════════════════
var SessionNotFoundError = /** @class */ (function (_super) {
    __extends(SessionNotFoundError, _super);
    function SessionNotFoundError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return SessionNotFoundError;
}((0, errore_1.createTaggedError)({
    name: 'SessionNotFoundError',
    message: 'Session $sessionId not found',
})));
exports.SessionNotFoundError = SessionNotFoundError;
var SessionCreateError = /** @class */ (function (_super) {
    __extends(SessionCreateError, _super);
    function SessionCreateError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return SessionCreateError;
}((0, errore_1.createTaggedError)({
    name: 'SessionCreateError',
})));
exports.SessionCreateError = SessionCreateError;
var MessagesNotFoundError = /** @class */ (function (_super) {
    __extends(MessagesNotFoundError, _super);
    function MessagesNotFoundError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return MessagesNotFoundError;
}((0, errore_1.createTaggedError)({
    name: 'MessagesNotFoundError',
    message: 'No messages found for session $sessionId',
})));
exports.MessagesNotFoundError = MessagesNotFoundError;
var TranscriptionError = /** @class */ (function (_super) {
    __extends(TranscriptionError, _super);
    function TranscriptionError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TranscriptionError;
}((0, errore_1.createTaggedError)({
    name: 'TranscriptionError',
    message: 'Transcription failed: $reason',
})));
exports.TranscriptionError = TranscriptionError;
var GrepSearchError = /** @class */ (function (_super) {
    __extends(GrepSearchError, _super);
    function GrepSearchError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return GrepSearchError;
}((0, errore_1.createTaggedError)({
    name: 'GrepSearchError',
    message: 'Grep search failed for pattern: $pattern',
})));
exports.GrepSearchError = GrepSearchError;
var GlobSearchError = /** @class */ (function (_super) {
    __extends(GlobSearchError, _super);
    function GlobSearchError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return GlobSearchError;
}((0, errore_1.createTaggedError)({
    name: 'GlobSearchError',
    message: 'Glob search failed for pattern: $pattern',
})));
exports.GlobSearchError = GlobSearchError;
// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION ERRORS - Input validation, format checks
// ═══════════════════════════════════════════════════════════════════════════
var InvalidAudioFormatError = /** @class */ (function (_super) {
    __extends(InvalidAudioFormatError, _super);
    function InvalidAudioFormatError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return InvalidAudioFormatError;
}((0, errore_1.createTaggedError)({
    name: 'InvalidAudioFormatError',
    message: 'Invalid audio format',
})));
exports.InvalidAudioFormatError = InvalidAudioFormatError;
var EmptyTranscriptionError = /** @class */ (function (_super) {
    __extends(EmptyTranscriptionError, _super);
    function EmptyTranscriptionError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return EmptyTranscriptionError;
}((0, errore_1.createTaggedError)({
    name: 'EmptyTranscriptionError',
    message: 'Model returned empty transcription',
})));
exports.EmptyTranscriptionError = EmptyTranscriptionError;
var NoResponseContentError = /** @class */ (function (_super) {
    __extends(NoResponseContentError, _super);
    function NoResponseContentError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return NoResponseContentError;
}((0, errore_1.createTaggedError)({
    name: 'NoResponseContentError',
    message: 'No response content from model',
})));
exports.NoResponseContentError = NoResponseContentError;
var NoToolResponseError = /** @class */ (function (_super) {
    __extends(NoToolResponseError, _super);
    function NoToolResponseError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return NoToolResponseError;
}((0, errore_1.createTaggedError)({
    name: 'NoToolResponseError',
    message: 'No valid tool responses',
})));
exports.NoToolResponseError = NoToolResponseError;
// ═══════════════════════════════════════════════════════════════════════════
// NETWORK ERRORS - Fetch and HTTP
// ═══════════════════════════════════════════════════════════════════════════
var FetchError = /** @class */ (function (_super) {
    __extends(FetchError, _super);
    function FetchError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FetchError;
}((0, errore_1.createTaggedError)({
    name: 'FetchError',
    message: 'Fetch failed for $url',
})));
exports.FetchError = FetchError;
// ═══════════════════════════════════════════════════════════════════════════
// API ERRORS - External service responses
// ═══════════════════════════════════════════════════════════════════════════
var DiscordApiError = /** @class */ (function (_super) {
    __extends(DiscordApiError, _super);
    function DiscordApiError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DiscordApiError;
}((0, errore_1.createTaggedError)({
    name: 'DiscordApiError',
    message: 'Discord API error: $status $body',
})));
exports.DiscordApiError = DiscordApiError;
var OpenCodeApiError = /** @class */ (function (_super) {
    __extends(OpenCodeApiError, _super);
    function OpenCodeApiError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return OpenCodeApiError;
}((0, errore_1.createTaggedError)({
    name: 'OpenCodeApiError',
    message: 'OpenCode API error ($status): $body',
})));
exports.OpenCodeApiError = OpenCodeApiError;
// ═══════════════════════════════════════════════════════════════════════════
// MERGE/WORKTREE ERRORS
// ═══════════════════════════════════════════════════════════════════════════
var DirtyWorktreeError = /** @class */ (function (_super) {
    __extends(DirtyWorktreeError, _super);
    function DirtyWorktreeError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return DirtyWorktreeError;
}((0, errore_1.createTaggedError)({
    name: 'DirtyWorktreeError',
    message: 'Uncommitted changes in worktree. Commit all changes before merging.',
})));
exports.DirtyWorktreeError = DirtyWorktreeError;
var NothingToMergeError = /** @class */ (function (_super) {
    __extends(NothingToMergeError, _super);
    function NothingToMergeError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return NothingToMergeError;
}((0, errore_1.createTaggedError)({
    name: 'NothingToMergeError',
    message: 'No commits to merge -- branch is already up to date with $target',
})));
exports.NothingToMergeError = NothingToMergeError;
var RebaseConflictError = /** @class */ (function (_super) {
    __extends(RebaseConflictError, _super);
    function RebaseConflictError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return RebaseConflictError;
}((0, errore_1.createTaggedError)({
    name: 'RebaseConflictError',
    message: 'Rebase conflict while rebasing onto $target. Resolve conflicts, then run merge again.',
})));
exports.RebaseConflictError = RebaseConflictError;
var RebaseError = /** @class */ (function (_super) {
    __extends(RebaseError, _super);
    function RebaseError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return RebaseError;
}((0, errore_1.createTaggedError)({
    name: 'RebaseError',
    message: 'Rebase onto $target failed',
})));
exports.RebaseError = RebaseError;
var NotFastForwardError = /** @class */ (function (_super) {
    __extends(NotFastForwardError, _super);
    function NotFastForwardError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return NotFastForwardError;
}((0, errore_1.createTaggedError)({
    name: 'NotFastForwardError',
    message: 'Cannot fast-forward: $target has commits not in this branch',
})));
exports.NotFastForwardError = NotFastForwardError;
var ConflictingFilesError = /** @class */ (function (_super) {
    __extends(ConflictingFilesError, _super);
    function ConflictingFilesError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ConflictingFilesError;
}((0, errore_1.createTaggedError)({
    name: 'ConflictingFilesError',
    message: 'Cannot merge: $target worktree has uncommitted changes in overlapping files. Commit changes in main worktree first, then run `/merge-worktree` again.',
})));
exports.ConflictingFilesError = ConflictingFilesError;
var TargetDirtyWorktreeError = /** @class */ (function (_super) {
    __extends(TargetDirtyWorktreeError, _super);
    function TargetDirtyWorktreeError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return TargetDirtyWorktreeError;
}((0, errore_1.createTaggedError)({
    name: 'TargetDirtyWorktreeError',
    message: 'Cannot merge: $target worktree has uncommitted changes. Commit changes in main worktree first, then run `/merge-worktree` again.',
})));
exports.TargetDirtyWorktreeError = TargetDirtyWorktreeError;
var PushError = /** @class */ (function (_super) {
    __extends(PushError, _super);
    function PushError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return PushError;
}((0, errore_1.createTaggedError)({
    name: 'PushError',
    message: 'Push to $target failed',
})));
exports.PushError = PushError;
var GitCommandError = /** @class */ (function (_super) {
    __extends(GitCommandError, _super);
    function GitCommandError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return GitCommandError;
}((0, errore_1.createTaggedError)({
    name: 'GitCommandError',
    message: 'Git command failed: $command',
})));
exports.GitCommandError = GitCommandError;
