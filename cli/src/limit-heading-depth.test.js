"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var limit_heading_depth_js_1 = require("./limit-heading-depth.js");
(0, vitest_1.test)('converts h4 to h3', function () {
    var input = '#### Fourth level heading';
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"### Fourth level heading\n    \"\n  ");
});
(0, vitest_1.test)('converts h5 to h3', function () {
    var input = '##### Fifth level heading';
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"### Fifth level heading\n    \"\n  ");
});
(0, vitest_1.test)('converts h6 to h3', function () {
    var input = '###### Sixth level heading';
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"### Sixth level heading\n    \"\n  ");
});
(0, vitest_1.test)('preserves h3 unchanged', function () {
    var input = '### Third level heading';
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\"### Third level heading\"");
});
(0, vitest_1.test)('preserves h2 unchanged', function () {
    var input = '## Second level heading';
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\"## Second level heading\"");
});
(0, vitest_1.test)('preserves h1 unchanged', function () {
    var input = '# First level heading';
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\"# First level heading\"");
});
(0, vitest_1.test)('handles multiple headings in document', function () {
    var input = "# Title\n\nSome text\n\n## Section\n\n### Subsection\n\n#### Too deep\n\n##### Even deeper\n\nRegular paragraph\n\n### Back to normal\n";
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"# Title\n\n    Some text\n\n    ## Section\n\n    ### Subsection\n\n    ### Too deep\n    ### Even deeper\n    Regular paragraph\n\n    ### Back to normal\n    \"\n  ");
});
(0, vitest_1.test)('preserves heading with inline formatting', function () {
    var input = '#### Heading with **bold** and `code`';
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"### Heading with **bold** and `code`\n    \"\n  ");
});
(0, vitest_1.test)('handles empty markdown', function () {
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)('');
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\"\"");
});
(0, vitest_1.test)('handles markdown with no headings', function () {
    var input = 'Just some text\n\nAnd more text';
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"Just some text\n\n    And more text\"\n  ");
});
(0, vitest_1.test)('allows custom maxDepth', function () {
    var input = '### Third level';
    var result = (0, limit_heading_depth_js_1.limitHeadingDepth)(input, 2);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"## Third level\n    \"\n  ");
});
