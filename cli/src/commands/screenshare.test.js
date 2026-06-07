"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var screenshare_js_1 = require("./screenshare.js");
(0, vitest_1.describe)('screenshare security defaults', function () {
    (0, vitest_1.test)('generates a 128-bit tunnel id', function () {
        var ids = new Set(Array.from({ length: 32 }, function () {
            return (0, screenshare_js_1.createScreenshareTunnelId)();
        }));
        (0, vitest_1.expect)(ids.size).toBe(32);
        for (var _i = 0, ids_1 = ids; _i < ids_1.length; _i++) {
            var id = ids_1[_i];
            (0, vitest_1.expect)(id).toMatch(/^[0-9a-f]{32}$/);
        }
    });
    (0, vitest_1.test)('builds a secure noVNC URL', function () {
        var url = new URL((0, screenshare_js_1.buildNoVncUrl)({ tunnelHost: '0123456789abcdef-tunnel.kimaki.dev' }));
        (0, vitest_1.expect)(url.origin).toBe('https://novnc.com');
        (0, vitest_1.expect)(url.searchParams.get('host')).toBe('0123456789abcdef-tunnel.kimaki.dev');
        (0, vitest_1.expect)(url.searchParams.get('port')).toBe('443');
        (0, vitest_1.expect)(url.searchParams.get('encrypt')).toBe('1');
    });
});
