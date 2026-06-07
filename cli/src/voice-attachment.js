"use strict";
// Voice attachment detection helpers.
// Normalizes Discord attachment heuristics for voice-message detection so
// message routing, transcription, and empty-prompt guards all agree even when
// Discord omits contentType on uploaded audio attachments.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVoiceAttachmentMatchReason = getVoiceAttachmentMatchReason;
exports.isVoiceAttachment = isVoiceAttachment;
var node_path_1 = require("node:path");
var VOICE_ATTACHMENT_EXTENSIONS = new Set([
    '.m4a',
    '.mp3',
    '.mp4',
    '.oga',
    '.ogg',
    '.opus',
    '.wav',
]);
function getVoiceAttachmentMatchReason(attachment) {
    var _a, _b;
    var contentType = ((_a = attachment.contentType) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase()) || '';
    if (contentType.startsWith('audio/')) {
        return "contentType:".concat(contentType);
    }
    if (typeof attachment.duration === 'number' && attachment.duration > 0) {
        return "duration:".concat(attachment.duration);
    }
    if ((_b = attachment.waveform) === null || _b === void 0 ? void 0 : _b.trim()) {
        return 'waveform';
    }
    var extension = node_path_1.default.extname(attachment.name || '').toLowerCase();
    if (VOICE_ATTACHMENT_EXTENSIONS.has(extension)) {
        return "extension:".concat(extension);
    }
    return null;
}
function isVoiceAttachment(attachment) {
    return getVoiceAttachmentMatchReason(attachment) !== null;
}
