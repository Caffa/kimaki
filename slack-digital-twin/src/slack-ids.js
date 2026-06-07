"use strict";
// Slack-style ID generation for test fixtures.
// Slack IDs are prefixed strings: T (workspace), C (channel), U (user).
// Message timestamps are Unix seconds with microsecond precision: "1700000001.000001"
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWorkspaceId = generateWorkspaceId;
exports.generateChannelId = generateChannelId;
exports.generateUserId = generateUserId;
exports.generateMessageTs = generateMessageTs;
exports.resetIds = resetIds;
var workspaceCounter = 0;
var channelCounter = 0;
var userCounter = 0;
var messageCounter = 0;
function generateWorkspaceId() {
    workspaceCounter++;
    return "T".concat(String(workspaceCounter).padStart(9, '0'));
}
function generateChannelId() {
    channelCounter++;
    return "C".concat(String(channelCounter).padStart(9, '0'));
}
function generateUserId() {
    userCounter++;
    return "U".concat(String(userCounter).padStart(9, '0'));
}
// Generates a Slack-style timestamp (ts) that is unique and monotonically
// increasing. Uses a base epoch + counter to produce deterministic values
// in tests. Format: "XXXXXXXXXX.YYYYYY" (10 digits . 6 digits)
var BASE_EPOCH = 1700000000;
function generateMessageTs() {
    messageCounter++;
    var seconds = BASE_EPOCH + Math.floor(messageCounter / 1000000);
    var micros = messageCounter % 1000000;
    return "".concat(seconds, ".").concat(String(micros).padStart(6, '0'));
}
function resetIds() {
    workspaceCounter = 0;
    channelCounter = 0;
    userCounter = 0;
    messageCounter = 0;
}
