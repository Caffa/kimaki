"use strict";
// Extracts Slack workspace/team IDs from inbound webhook payloads.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeamIdForWebhookEvent = getTeamIdForWebhookEvent;
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
function readString(record, key) {
    var value = record[key];
    return typeof value === 'string' ? value : undefined;
}
function readRecord(record, key) {
    var value = record[key];
    return isRecord(value) ? value : undefined;
}
function readArray(record, key) {
    var value = record[key];
    return Array.isArray(value) ? value : [];
}
function getTeamIdFromJsonPayload(payload) {
    if (!isRecord(payload)) {
        return undefined;
    }
    var topLevelTeamId = readString(payload, 'team_id');
    if (topLevelTeamId) {
        return topLevelTeamId;
    }
    var teamRecord = readRecord(payload, 'team');
    if (teamRecord) {
        var nestedTeamId = readString(teamRecord, 'id');
        if (nestedTeamId) {
            return nestedTeamId;
        }
    }
    var authorizations = readArray(payload, 'authorizations');
    for (var _i = 0, authorizations_1 = authorizations; _i < authorizations_1.length; _i++) {
        var authorization = authorizations_1[_i];
        if (!isRecord(authorization)) {
            continue;
        }
        var teamId = readString(authorization, 'team_id');
        if (teamId) {
            return teamId;
        }
    }
    return undefined;
}
function getTeamIdForWebhookEvent(_a) {
    var _b;
    var body = _a.body, contentType = _a.contentType;
    var normalizedContentType = (_b = contentType === null || contentType === void 0 ? void 0 : contentType.toLowerCase()) !== null && _b !== void 0 ? _b : '';
    if (normalizedContentType.includes('application/x-www-form-urlencoded')) {
        var params = new URLSearchParams(body);
        var slashTeamId = params.get('team_id');
        if (slashTeamId) {
            return slashTeamId;
        }
        var payloadStr = params.get('payload');
        if (!payloadStr) {
            return undefined;
        }
        try {
            var payload = JSON.parse(payloadStr);
            return getTeamIdFromJsonPayload(payload);
        }
        catch (_c) {
            return undefined;
        }
    }
    try {
        var payload = JSON.parse(body);
        return getTeamIdFromJsonPayload(payload);
    }
    catch (_d) {
        return undefined;
    }
}
