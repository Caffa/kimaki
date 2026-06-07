"use strict";
// File upload tool handler - Shows Discord modal with FileUploadBuilder.
// When the AI uses the kimaki_file_upload tool, the plugin inserts a row into
// the ipc_requests DB table. The bot polls this table, picks up the request,
// and shows a button in the thread. User clicks it to open a modal with a
// native file picker. Uploaded files are downloaded to the project directory.
// The bot writes file paths back to ipc_requests.response, and the plugin
// polls until the response appears.
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
exports.pendingFileUploadContexts = void 0;
exports.showFileUploadButton = showFileUploadButton;
exports.handleFileUploadButton = handleFileUploadButton;
exports.handleFileUploadModalSubmit = handleFileUploadModalSubmit;
exports.cancelPendingFileUpload = cancelPendingFileUpload;
var discord_js_1 = require("discord.js");
var node_crypto_1 = require("node:crypto");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var logger_js_1 = require("../logger.js");
var sentry_js_1 = require("../sentry.js");
var discord_utils_js_1 = require("../discord-utils.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.FILE_UPLOAD);
// 5 minute TTL for pending contexts - if user doesn't click within this time,
// clean up the context and resolve with empty array to unblock the plugin tool
var PENDING_TTL_MS = 5 * 60 * 1000;
exports.pendingFileUploadContexts = new Map();
/**
 * Sanitize an attachment filename to prevent path traversal.
 * Strips directory separators, .., and null bytes from the name.
 * Prepends a short random prefix to avoid collisions between uploads.
 */
function sanitizeFilename(name) {
    // Extract just the base name (strips any directory components)
    var sanitized = node_path_1.default.basename(name);
    // Remove null bytes and other dangerous characters
    sanitized = sanitized.replace(/[\x00]/g, '');
    // If somehow still empty or just dots, give it a safe name
    if (!sanitized || sanitized === '.' || sanitized === '..') {
        sanitized = 'upload';
    }
    // Prefix with short random id to avoid collisions
    var prefix = node_crypto_1.default.randomBytes(4).toString('hex');
    return "".concat(prefix, "-").concat(sanitized);
}
/**
 * Safely resolve a pending context exactly once. Prevents double-resolve from
 * cancel/submit races by checking the `resolved` flag.
 */
function resolveContext(context, filePaths) {
    if (context.resolved) {
        return false;
    }
    context.resolved = true;
    clearTimeout(context.timer);
    exports.pendingFileUploadContexts.delete(context.contextHash);
    context.resolve(filePaths);
    return true;
}
/**
 * Show a button in the thread that opens a file upload modal when clicked.
 * Returns a promise that resolves with the downloaded file paths.
 */
function showFileUploadButton(_a) {
    var thread = _a.thread, sessionId = _a.sessionId, directory = _a.directory, prompt = _a.prompt, maxFiles = _a.maxFiles;
    return new Promise(function (resolve, reject) {
        var contextHash = node_crypto_1.default.randomBytes(8).toString('hex');
        // TTL timer: auto-cleanup if user never clicks the button
        var timer = setTimeout(function () {
            var ctx = exports.pendingFileUploadContexts.get(contextHash);
            if (ctx && !ctx.resolved) {
                logger.log("File upload timed out for session ".concat(sessionId, ", hash=").concat(contextHash));
                resolveContext(ctx, []);
                // Remove button from message
                if (ctx.messageId) {
                    ctx.thread.messages
                        .fetch(ctx.messageId)
                        .then(function (msg) {
                        return msg.edit({
                            content: "**File Upload Requested**\n".concat(prompt.slice(0, 1900), "\n_Timed out_"),
                            components: [],
                        });
                    })
                        .catch(function () { });
                }
            }
        }, PENDING_TTL_MS);
        var context = {
            sessionId: sessionId,
            directory: directory,
            thread: thread,
            prompt: prompt,
            maxFiles: maxFiles,
            contextHash: contextHash,
            resolve: resolve,
            reject: reject,
            resolved: false,
            timer: timer,
        };
        exports.pendingFileUploadContexts.set(contextHash, context);
        var uploadButton = new discord_js_1.ButtonBuilder()
            .setCustomId("file_upload_btn:".concat(contextHash))
            .setLabel('Upload Files')
            .setStyle(discord_js_1.ButtonStyle.Primary);
        var actionRow = new discord_js_1.ActionRowBuilder().addComponents(uploadButton);
        thread
            .send({
            content: "**File Upload Requested**\n".concat(prompt.slice(0, 1900)),
            components: [actionRow],
            flags: discord_utils_js_1.NOTIFY_MESSAGE_FLAGS,
        })
            .then(function (msg) {
            context.messageId = msg.id;
            logger.log("Showed file upload button for session ".concat(sessionId, ", hash=").concat(contextHash));
        })
            .catch(function (err) {
            clearTimeout(timer);
            exports.pendingFileUploadContexts.delete(contextHash);
            reject(new Error('Failed to send file upload button', { cause: err }));
        });
    });
}
/**
 * Handle the file upload button click - opens a modal with FileUploadBuilder.
 */
function handleFileUploadButton(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, contextHash, context, fileUpload, label, modal;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('file_upload_btn:')) {
                        return [2 /*return*/];
                    }
                    contextHash = customId.replace('file_upload_btn:', '');
                    context = exports.pendingFileUploadContexts.get(contextHash);
                    if (!(!context || context.resolved)) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'This file upload request has expired.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
                case 2:
                    fileUpload = new discord_js_1.FileUploadBuilder()
                        .setCustomId('uploaded_files')
                        .setMinValues(1)
                        .setMaxValues(context.maxFiles);
                    label = new discord_js_1.LabelBuilder()
                        .setLabel('Files')
                        .setDescription(context.prompt.slice(0, 100))
                        .setFileUploadComponent(fileUpload);
                    modal = new discord_js_1.ModalBuilder()
                        .setCustomId("file_upload_modal:".concat(contextHash))
                        .setTitle('Upload Files')
                        .addLabelComponents(label);
                    return [4 /*yield*/, interaction.showModal(modal)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Handle the modal submission - download files and resolve the pending promise.
 */
function handleFileUploadModalSubmit(interaction) {
    return __awaiter(this, void 0, void 0, function () {
        var customId, contextHash, context, fileField, attachments, uploadsDir, downloadedPaths_1, errors_1, _i, attachments_1, _a, attachment, response, buffer, _b, _c, safeName, filePath, err_1, msg, fileNames, summary, err_2;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    customId = interaction.customId;
                    if (!customId.startsWith('file_upload_modal:')) {
                        return [2 /*return*/];
                    }
                    contextHash = customId.replace('file_upload_modal:', '');
                    context = exports.pendingFileUploadContexts.get(contextHash);
                    if (!(!context || context.resolved)) return [3 /*break*/, 2];
                    return [4 /*yield*/, interaction.reply({
                            content: 'This file upload request has expired.',
                            flags: discord_js_1.MessageFlags.Ephemeral,
                        })];
                case 1:
                    _d.sent();
                    return [2 /*return*/];
                case 2:
                    _d.trys.push([2, 16, , 17]);
                    return [4 /*yield*/, interaction.deferReply({ flags: discord_js_1.MessageFlags.Ephemeral })
                        // File upload data is nested in the LabelModalData -> FileUploadModalData
                    ];
                case 3:
                    _d.sent();
                    fileField = interaction.fields.getField('uploaded_files', discord_js_1.ComponentType.FileUpload);
                    attachments = fileField.attachments;
                    if (!(!attachments || attachments.size === 0)) return [3 /*break*/, 5];
                    return [4 /*yield*/, interaction.editReply({ content: 'No files were uploaded.' })];
                case 4:
                    _d.sent();
                    updateButtonMessage(context, '_No files uploaded_');
                    resolveContext(context, []);
                    return [2 /*return*/];
                case 5:
                    uploadsDir = node_path_1.default.join(context.directory, 'uploads');
                    node_fs_1.default.mkdirSync(uploadsDir, { recursive: true });
                    downloadedPaths_1 = [];
                    errors_1 = [];
                    _i = 0, attachments_1 = attachments;
                    _d.label = 6;
                case 6:
                    if (!(_i < attachments_1.length)) return [3 /*break*/, 12];
                    _a = attachments_1[_i], attachment = _a[1];
                    // Check if context was cancelled (e.g. user sent new message) while
                    // we were downloading previous files - stop downloading more
                    if (context.resolved) {
                        return [3 /*break*/, 12];
                    }
                    _d.label = 7;
                case 7:
                    _d.trys.push([7, 10, , 11]);
                    return [4 /*yield*/, fetch(attachment.url)];
                case 8:
                    response = _d.sent();
                    if (!response.ok) {
                        errors_1.push("Failed to download ".concat(attachment.name, ": HTTP ").concat(response.status));
                        return [3 /*break*/, 11];
                    }
                    _c = (_b = Buffer).from;
                    return [4 /*yield*/, response.arrayBuffer()];
                case 9:
                    buffer = _c.apply(_b, [_d.sent()]);
                    safeName = sanitizeFilename(attachment.name);
                    filePath = node_path_1.default.join(uploadsDir, safeName);
                    node_fs_1.default.writeFileSync(filePath, buffer);
                    downloadedPaths_1.push(filePath);
                    return [3 /*break*/, 11];
                case 10:
                    err_1 = _d.sent();
                    msg = err_1 instanceof Error ? err_1.message : String(err_1);
                    errors_1.push("Failed to download ".concat(attachment.name, ": ").concat(msg));
                    return [3 /*break*/, 11];
                case 11:
                    _i++;
                    return [3 /*break*/, 6];
                case 12:
                    if (!context.resolved) return [3 /*break*/, 14];
                    return [4 /*yield*/, interaction.editReply({ content: 'Upload was cancelled.' })];
                case 13:
                    _d.sent();
                    return [2 /*return*/];
                case 14:
                    fileNames = downloadedPaths_1.map(function (p) {
                        return node_path_1.default.basename(p);
                    });
                    updateButtonMessage(context, downloadedPaths_1.length > 0
                        ? "Uploaded: ".concat(fileNames.join(', '))
                        : '_Upload failed_');
                    summary = (function () {
                        if (downloadedPaths_1.length > 0 && errors_1.length === 0) {
                            return "Uploaded ".concat(downloadedPaths_1.length, " file(s) successfully.");
                        }
                        if (downloadedPaths_1.length > 0 && errors_1.length > 0) {
                            return "Uploaded ".concat(downloadedPaths_1.length, " file(s). Errors: ").concat(errors_1.join('; '));
                        }
                        return "Upload failed: ".concat(errors_1.join('; '));
                    })();
                    return [4 /*yield*/, interaction.editReply({ content: summary })];
                case 15:
                    _d.sent();
                    resolveContext(context, downloadedPaths_1);
                    logger.log("File upload completed for session ".concat(context.sessionId, ": ").concat(downloadedPaths_1.length, " files"));
                    return [3 /*break*/, 17];
                case 16:
                    err_2 = _d.sent();
                    // Ensure context is always resolved even on unexpected errors
                    // so the plugin tool doesn't hang indefinitely
                    logger.error('Error in file upload modal submit:', err_2);
                    void (0, sentry_js_1.notifyError)(err_2, 'File upload modal submit error');
                    resolveContext(context, []);
                    return [3 /*break*/, 17];
                case 17: return [2 /*return*/];
            }
        });
    });
}
/**
 * Best-effort update of the original button message (remove button, append status).
 */
function updateButtonMessage(context, status) {
    if (!context.messageId) {
        return;
    }
    context.thread.messages
        .fetch(context.messageId)
        .then(function (msg) {
        return msg.edit({
            content: "**File Upload Requested**\n".concat(context.prompt.slice(0, 1900), "\n").concat(status),
            components: [],
        });
    })
        .catch(function () { });
}
/**
 * Cancel ALL pending file uploads for a thread (e.g. when user sends a new message).
 */
function cancelPendingFileUpload(threadId) {
    return __awaiter(this, void 0, void 0, function () {
        var toCancel, _i, pendingFileUploadContexts_1, _a, ctx, cancelled, _b, toCancel_1, context, didResolve;
        return __generator(this, function (_c) {
            toCancel = [];
            for (_i = 0, pendingFileUploadContexts_1 = exports.pendingFileUploadContexts; _i < pendingFileUploadContexts_1.length; _i++) {
                _a = pendingFileUploadContexts_1[_i], ctx = _a[1];
                if (ctx.thread.id === threadId) {
                    toCancel.push(ctx);
                }
            }
            if (toCancel.length === 0) {
                return [2 /*return*/, false];
            }
            cancelled = 0;
            for (_b = 0, toCancel_1 = toCancel; _b < toCancel_1.length; _b++) {
                context = toCancel_1[_b];
                didResolve = resolveContext(context, []);
                if (didResolve) {
                    updateButtonMessage(context, '_Cancelled - user sent a new message_');
                    cancelled++;
                }
            }
            if (cancelled > 0) {
                logger.log("Cancelled ".concat(cancelled, " file upload(s) for thread ").concat(threadId));
            }
            return [2 /*return*/, cancelled > 0];
        });
    });
}
