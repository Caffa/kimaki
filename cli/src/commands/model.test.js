"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var paginated_select_js_1 = require("./paginated-select.js");
// ── buildPaginatedOptions ────────────────────────────────────────────────
(0, vitest_1.describe)('buildPaginatedOptions', function () {
    (0, vitest_1.test)('returns all options without pagination when ≤25 items', function () {
        var options = Array.from({ length: 5 }, function (_, i) { return ({
            label: "Option ".concat(i),
            value: "val-".concat(i),
        }); });
        var result = (0, paginated_select_js_1.buildPaginatedOptions)({ allOptions: options, page: 0 });
        (0, vitest_1.expect)(result.options).toHaveLength(5);
        (0, vitest_1.expect)(result.totalPages).toBe(1);
    });
    (0, vitest_1.test)('paginates when >25 items', function () {
        var options = Array.from({ length: 50 }, function (_, i) { return ({
            label: "Option ".concat(i),
            value: "val-".concat(i),
        }); });
        var result = (0, paginated_select_js_1.buildPaginatedOptions)({ allOptions: options, page: 0 });
        // Page 0: 23 items + "Next page →" nav = 24 items
        (0, vitest_1.expect)(result.options.length).toBeLessThanOrEqual(25);
        (0, vitest_1.expect)(result.totalPages).toBeGreaterThan(1);
    });
    (0, vitest_1.test)('last page has prev nav but no next nav', function () {
        var options = Array.from({ length: 50 }, function (_, i) { return ({
            label: "Option ".concat(i),
            value: "val-".concat(i),
        }); });
        var result = (0, paginated_select_js_1.buildPaginatedOptions)({ allOptions: options, page: 2 });
        var hasPrev = result.options.some(function (o) { return o.value.startsWith('__page_nav:') && o.label.includes('Previous'); });
        var hasNext = result.options.some(function (o) { return o.value.startsWith('__page_nav:') && o.label.includes('Next'); });
        (0, vitest_1.expect)(hasPrev).toBe(true);
        (0, vitest_1.expect)(hasNext).toBe(false);
    });
});
// ── parsePaginationValue ─────────────────────────────────────────────────
(0, vitest_1.describe)('parsePaginationValue', function () {
    (0, vitest_1.test)('parses pagination sentinel values', function () {
        (0, vitest_1.expect)((0, paginated_select_js_1.parsePaginationValue)('__page_nav:0')).toBe(0);
        (0, vitest_1.expect)((0, paginated_select_js_1.parsePaginationValue)('__page_nav:3')).toBe(3);
        (0, vitest_1.expect)((0, paginated_select_js_1.parsePaginationValue)('__page_nav:10')).toBe(10);
    });
    (0, vitest_1.test)('returns undefined for non-pagination values', function () {
        (0, vitest_1.expect)((0, paginated_select_js_1.parsePaginationValue)('some-provider-id')).toBeUndefined();
        (0, vitest_1.expect)((0, paginated_select_js_1.parsePaginationValue)('claude-3-opus')).toBeUndefined();
        (0, vitest_1.expect)((0, paginated_select_js_1.parsePaginationValue)('')).toBeUndefined();
    });
});
