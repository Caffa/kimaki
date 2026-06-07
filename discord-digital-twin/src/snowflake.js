"use strict";
// Discord snowflake ID generator.
// Snowflakes encode a timestamp (ms since Discord epoch 2015-01-01),
// worker ID, process ID, and a 12-bit increment counter.
// We use worker=0, process=0 since this is a single-process test server.
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSnowflake = generateSnowflake;
var DISCORD_EPOCH = 1420070400000n;
var increment = 0n;
function generateSnowflake() {
    var timestamp = BigInt(Date.now()) - DISCORD_EPOCH;
    var id = (timestamp << 22n) | (0n << 17n) | (0n << 12n) | increment;
    increment = (increment + 1n) & 0xfffn;
    return id.toString();
}
