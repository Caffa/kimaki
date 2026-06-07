"use strict";
// Hrana v2 value encoding/decoding.
//
// SQLite -> Hrana JSON:
//   INTEGER -> {"type":"integer","value":"42"}  (string to avoid precision loss)
//   REAL    -> {"type":"float","value":3.14}
//   TEXT    -> {"type":"text","value":"hello"}
//   BLOB    -> {"type":"blob","base64":"..."}
//   NULL    -> {"type":"null"}
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeHranaValue = encodeHranaValue;
exports.decodeHranaValue = decodeHranaValue;
exports.decodeHranaParams = decodeHranaParams;
function encodeHranaValue(val) {
    if (val === null || val === undefined) {
        return { type: 'null' };
    }
    if (typeof val === 'bigint') {
        return { type: 'integer', value: val.toString() };
    }
    if (typeof val === 'number') {
        if (Number.isInteger(val)) {
            return { type: 'integer', value: val.toString() };
        }
        return { type: 'float', value: val };
    }
    if (typeof val === 'string') {
        return { type: 'text', value: val };
    }
    if (val instanceof ArrayBuffer) {
        return { type: 'blob', base64: uint8ArrayToBase64(new Uint8Array(val)) };
    }
    if (val instanceof Uint8Array) {
        return { type: 'blob', base64: uint8ArrayToBase64(val) };
    }
    // Node.js Buffer is a Uint8Array subclass, caught above
    return { type: 'text', value: String(val) };
}
function decodeHranaValue(val) {
    if (val.type === 'null') {
        return null;
    }
    if (val.type === 'integer') {
        var n = Number(val.value);
        return Number.isSafeInteger(n) ? n : BigInt(val.value);
    }
    if (val.type === 'float') {
        return val.value;
    }
    if (val.type === 'text') {
        return val.value;
    }
    if (val.type === 'blob') {
        return base64ToUint8Array(val.base64);
    }
    return null;
}
function decodeHranaParams(stmt) {
    var _a;
    if (stmt.named_args && stmt.named_args.length > 0) {
        var named = {};
        for (var _i = 0, _b = stmt.named_args; _i < _b.length; _i++) {
            var na = _b[_i];
            named[na.name] = decodeHranaValue(na.value);
        }
        return [named];
    }
    return ((_a = stmt.args) !== null && _a !== void 0 ? _a : []).map(decodeHranaValue);
}
// Runtime-agnostic base64 helpers (no Node.js Buffer dependency)
function uint8ArrayToBase64(bytes) {
    // Use btoa which is available in all modern runtimes (Node 16+, Workers, browsers)
    var binary = '';
    for (var i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
function base64ToUint8Array(base64) {
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
