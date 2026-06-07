"use strict";
/**
 * Reusable paginated select menu helpers for Discord StringSelectMenuBuilder.
 * Discord caps select menus at 25 options. This module slices a full options
 * list into pages of PAGE_SIZE real items and appends "← Previous page" /
 * "Next page →" sentinel options so the user can navigate. Handlers detect
 * sentinel values via parsePaginationValue() and re-render the same select
 * with the new page — reusing the same customId, no new interaction handlers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginatedOptions = buildPaginatedOptions;
exports.parsePaginationValue = parsePaginationValue;
var NAV_PREFIX = '__page_nav:';
/** 23 real items per page, leaving room for up to 2 nav sentinels (prev + next). */
var PAGE_SIZE = 23;
/**
 * Build the options array for a single page, with prev/next nav sentinels.
 * If allOptions fits in 25 items, returns them all with no nav items.
 */
function buildPaginatedOptions(_a) {
    var allOptions = _a.allOptions, page = _a.page;
    // No pagination needed — everything fits in one Discord select
    if (allOptions.length <= 25) {
        return { options: allOptions, totalPages: 1 };
    }
    var totalPages = Math.ceil(allOptions.length / PAGE_SIZE);
    var safePage = Math.max(0, Math.min(page, totalPages - 1));
    var start = safePage * PAGE_SIZE;
    var slice = allOptions.slice(start, start + PAGE_SIZE);
    var result = [];
    if (safePage > 0) {
        result.push({
            label: "\u2190 Previous page (".concat(safePage, "/").concat(totalPages, ")"),
            value: "".concat(NAV_PREFIX).concat(safePage - 1),
            description: 'Go to previous page',
        });
    }
    result.push.apply(result, slice);
    if (safePage < totalPages - 1) {
        result.push({
            label: "Next page \u2192 (".concat(safePage + 2, "/").concat(totalPages, ")"),
            value: "".concat(NAV_PREFIX).concat(safePage + 1),
            description: 'Go to next page',
        });
    }
    return { options: result, totalPages: totalPages };
}
/**
 * Check if a selected value is a pagination nav sentinel.
 * Returns the target page number if so, undefined otherwise.
 */
function parsePaginationValue(value) {
    if (!value.startsWith(NAV_PREFIX)) {
        return undefined;
    }
    var pageStr = value.slice(NAV_PREFIX.length);
    var page = Number(pageStr);
    if (Number.isNaN(page)) {
        return undefined;
    }
    return page;
}
