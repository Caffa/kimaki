"use strict";
// Encodes and decodes component metadata into Slack action_id values.
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeComponentActionId = encodeComponentActionId;
exports.decodeComponentActionId = decodeComponentActionId;
var v10_1 = require("discord-api-types/v10");
var ACTION_PREFIX = 'dsbcmp';
var SUPPORTED_COMPONENT_TYPES = new Set([
    v10_1.ComponentType.Button,
    v10_1.ComponentType.StringSelect,
    v10_1.ComponentType.UserSelect,
    v10_1.ComponentType.RoleSelect,
    v10_1.ComponentType.MentionableSelect,
    v10_1.ComponentType.ChannelSelect,
]);
function encodeComponentActionId(_a) {
    var componentType = _a.componentType, customId = _a.customId;
    return "".concat(ACTION_PREFIX, ":").concat(componentType, ":").concat(customId);
}
function decodeComponentActionId(actionId) {
    var _a;
    var parts = actionId.split(':');
    if (parts.length < 3 || parts[0] !== ACTION_PREFIX) {
        return { customId: actionId };
    }
    var componentType = Number.parseInt((_a = parts[1]) !== null && _a !== void 0 ? _a : '', 10);
    if (!Number.isFinite(componentType)) {
        return { customId: actionId };
    }
    if (!SUPPORTED_COMPONENT_TYPES.has(componentType)) {
        return { customId: actionId };
    }
    return {
        componentType: componentType,
        customId: parts.slice(2).join(':'),
    };
}
