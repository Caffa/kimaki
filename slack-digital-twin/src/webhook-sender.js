"use strict";
// Sends signed Slack Events API payloads to a webhook endpoint.
// Used to simulate Slack → your app event delivery.
// Signs payloads with HMAC-SHA256 matching Slack's signature verification.
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
exports.sendWebhookEvent = sendWebhookEvent;
exports.sendSlashCommand = sendSlashCommand;
exports.sendInteractivePayload = sendInteractivePayload;
var node_crypto_1 = require("node:crypto");
// Sign and POST an Events API envelope to the configured webhook URL.
// Mirrors Slack's signing: HMAC-SHA256 of "v0:{timestamp}:{body}".
function sendWebhookEvent(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var envelope;
        var config = _b.config, event = _b.event;
        return __generator(this, function (_c) {
            envelope = {
                type: 'event_callback',
                token: 'test-verification-token',
                team_id: config.workspaceId,
                api_app_id: 'A0001',
                event: event,
                event_id: "Ev".concat(Date.now()),
                event_time: Math.floor(Date.now() / 1000),
            };
            return [2 /*return*/, sendSignedPayload({ config: config, body: JSON.stringify(envelope) })];
        });
    });
}
// Send a slash command as form-urlencoded (matching Slack's format).
function sendSlashCommand(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var params;
        var config = _b.config, command = _b.command, text = _b.text, userId = _b.userId, userName = _b.userName, channelId = _b.channelId, channelName = _b.channelName, triggerId = _b.triggerId;
        return __generator(this, function (_c) {
            params = new URLSearchParams({
                command: command,
                text: text,
                user_id: userId,
                user_name: userName,
                channel_id: channelId,
                channel_name: channelName,
                team_id: config.workspaceId,
                team_domain: 'test-workspace',
                trigger_id: triggerId !== null && triggerId !== void 0 ? triggerId : "".concat(Date.now(), ".").concat(userId),
                response_url: "".concat(config.webhookUrl, "/response"),
            });
            return [2 /*return*/, sendSignedPayload({
                    config: config,
                    body: params.toString(),
                    contentType: 'application/x-www-form-urlencoded',
                })];
        });
    });
}
// Send an interactive payload (button click, modal submit) as form-urlencoded.
function sendInteractivePayload(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var params;
        var config = _b.config, payload = _b.payload;
        return __generator(this, function (_c) {
            params = new URLSearchParams({
                payload: JSON.stringify(payload),
            });
            return [2 /*return*/, sendSignedPayload({
                    config: config,
                    body: params.toString(),
                    contentType: 'application/x-www-form-urlencoded',
                })];
        });
    });
}
function sendSignedPayload(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var timestamp, sigBasestring, signature;
        var config = _b.config, body = _b.body, _c = _b.contentType, contentType = _c === void 0 ? 'application/json' : _c;
        return __generator(this, function (_d) {
            timestamp = Math.floor(Date.now() / 1000).toString();
            sigBasestring = "v0:".concat(timestamp, ":").concat(body);
            signature = 'v0=' +
                node_crypto_1.default
                    .createHmac('sha256', config.signingSecret)
                    .update(sigBasestring)
                    .digest('hex');
            return [2 /*return*/, fetch(config.webhookUrl, {
                    method: 'POST',
                    headers: {
                        'content-type': contentType,
                        'x-slack-request-timestamp': timestamp,
                        'x-slack-signature': signature,
                    },
                    body: body,
                })];
        });
    });
}
