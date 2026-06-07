"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var xml_js_1 = require("./xml.js");
(0, vitest_1.describe)('extractNonXmlContent', function () {
    (0, vitest_1.test)('removes xml tags and returns only text content', function () {
        var xml = 'Hello <tag>content</tag> world <nested><inner>deep</inner></nested> end';
        (0, vitest_1.expect)((0, xml_js_1.extractNonXmlContent)(xml)).toMatchInlineSnapshot("\n      \"Hello\n      world\n      end\"\n    ");
    });
    (0, vitest_1.test)('handles multiple text segments', function () {
        var xml = 'Start <a>tag1</a> middle <b>tag2</b> finish';
        (0, vitest_1.expect)((0, xml_js_1.extractNonXmlContent)(xml)).toMatchInlineSnapshot("\n      \"Start\n      middle\n      finish\"\n    ");
    });
    (0, vitest_1.test)('handles only xml without text', function () {
        var xml = '<root><child>content</child></root>';
        (0, vitest_1.expect)((0, xml_js_1.extractNonXmlContent)(xml)).toMatchInlineSnapshot("\"\"");
    });
    (0, vitest_1.test)('handles only text without xml', function () {
        var xml = 'Just plain text';
        (0, vitest_1.expect)((0, xml_js_1.extractNonXmlContent)(xml)).toMatchInlineSnapshot("\"Just plain text\"");
    });
    (0, vitest_1.test)('handles empty string', function () {
        var xml = '';
        (0, vitest_1.expect)((0, xml_js_1.extractNonXmlContent)(xml)).toMatchInlineSnapshot("\"\"");
    });
});
