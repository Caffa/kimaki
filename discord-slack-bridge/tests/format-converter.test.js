"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var format_converter_js_1 = require("../src/format-converter.js");
(0, vitest_1.describe)('mrkdwnToMarkdown', function () {
    (0, vitest_1.test)('converts bold', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.mrkdwnToMarkdown)('Hello *world*')).toMatchInlineSnapshot("\"Hello **world**\"");
    });
    (0, vitest_1.test)('converts strikethrough', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.mrkdwnToMarkdown)('Hello ~world~')).toMatchInlineSnapshot("\"Hello ~~world~~\"");
    });
    (0, vitest_1.test)('converts Slack links to markdown links', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.mrkdwnToMarkdown)('Check <https://example.com|this link>')).toMatchInlineSnapshot("\"Check [this link](https://example.com)\"");
    });
    (0, vitest_1.test)('converts bare Slack links', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.mrkdwnToMarkdown)('Visit <https://example.com>')).toMatchInlineSnapshot("\"Visit https://example.com\"");
    });
    (0, vitest_1.test)('preserves inline code', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.mrkdwnToMarkdown)('Use `*bold*` for emphasis')).toMatchInlineSnapshot("\"Use `*bold*` for emphasis\"");
    });
    (0, vitest_1.test)('preserves code blocks', function () {
        var input = '```\n*bold* ~strike~\n```';
        (0, vitest_1.expect)((0, format_converter_js_1.mrkdwnToMarkdown)(input)).toMatchInlineSnapshot("\n      \"```\n      *bold* ~strike~\n      ```\"\n    ");
    });
    (0, vitest_1.test)('preserves italic (same in both)', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.mrkdwnToMarkdown)('Hello _world_')).toMatchInlineSnapshot("\"Hello _world_\"");
    });
    (0, vitest_1.test)('handles mixed formatting', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.mrkdwnToMarkdown)('*bold* and ~strike~ and <https://x.com|link>')).toMatchInlineSnapshot("\"**bold** and ~~strike~~ and [link](https://x.com)\"");
    });
    (0, vitest_1.test)('preserves mentions', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.mrkdwnToMarkdown)('Hello <@U123>')).toMatchInlineSnapshot("\"Hello <@U123>\"");
    });
    (0, vitest_1.test)('preserves mentions with display text', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.mrkdwnToMarkdown)('Hello <@U123|tommy>')).toMatchInlineSnapshot("\"Hello <@U123|tommy>\"");
    });
});
(0, vitest_1.describe)('markdownToMrkdwn', function () {
    (0, vitest_1.test)('converts bold', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.markdownToMrkdwn)('Hello **world**')).toMatchInlineSnapshot("\"Hello *world*\"");
    });
    (0, vitest_1.test)('converts strikethrough', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.markdownToMrkdwn)('Hello ~~world~~')).toMatchInlineSnapshot("\"Hello ~world~\"");
    });
    (0, vitest_1.test)('converts markdown links to Slack links', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.markdownToMrkdwn)('Check [this link](https://example.com)')).toMatchInlineSnapshot("\"Check <https://example.com|this link>\"");
    });
    (0, vitest_1.test)('preserves inline code', function () {
        (0, vitest_1.expect)((0, format_converter_js_1.markdownToMrkdwn)('Use `**bold**` for emphasis')).toMatchInlineSnapshot("\"Use `**bold**` for emphasis\"");
    });
    (0, vitest_1.test)('preserves code blocks', function () {
        var input = '```\n**bold** ~~strike~~\n```';
        (0, vitest_1.expect)((0, format_converter_js_1.markdownToMrkdwn)(input)).toMatchInlineSnapshot("\n      \"```\n      **bold** ~~strike~~\n      ```\"\n    ");
    });
    (0, vitest_1.test)('roundtrips with mrkdwnToMarkdown', function () {
        var original = '*bold* and ~strike~ and <https://x.com|link>';
        var markdown = (0, format_converter_js_1.mrkdwnToMarkdown)(original);
        var backToMrkdwn = (0, format_converter_js_1.markdownToMrkdwn)(markdown);
        (0, vitest_1.expect)(backToMrkdwn).toMatchInlineSnapshot("\"*bold* and ~strike~ and <https://x.com|link>\"");
    });
});
