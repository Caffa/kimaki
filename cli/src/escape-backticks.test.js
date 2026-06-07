"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var discord_utils_js_1 = require("./discord-utils.js");
(0, vitest_1.test)('escapes single backticks in code blocks', function () {
    var input = '```js\nconst x = `hello`\n```';
    var result = (0, discord_utils_js_1.escapeBackticksInCodeBlocks)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n\"```js\nconst x = \\`hello\\`\n```\n\"\n");
});
(0, vitest_1.test)('escapes backticks in code blocks with language', function () {
    var input = '```typescript\nconst greeting = `Hello, ${name}!`\nconst inline = `test`\n```';
    var result = (0, discord_utils_js_1.escapeBackticksInCodeBlocks)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n\"```typescript\nconst greeting = \\`Hello, ${name}!\\`\nconst inline = \\`test\\`\n```\n\"\n");
});
(0, vitest_1.test)('does not escape backticks outside code blocks', function () {
    var input = 'This is `inline code` and this is a code block:\n```\nconst x = `template`\n```';
    var result = (0, discord_utils_js_1.escapeBackticksInCodeBlocks)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n\"This is `inline code` and this is a code block:\n```\nconst x = \\`template\\`\n```\n\"\n");
});
(0, vitest_1.test)('handles multiple code blocks', function () {
    var input = "First block:\n```js\nconst a = `test`\n```\n\nSome text with `inline` code\n\nSecond block:\n```python\nname = f`hello {world}`\n```";
    var result = (0, discord_utils_js_1.escapeBackticksInCodeBlocks)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n\"First block:\n```js\nconst a = \\`test\\`\n```\n\n\nSome text with `inline` code\n\nSecond block:\n```python\nname = f\\`hello {world}\\`\n```\n\"\n");
});
(0, vitest_1.test)('handles code blocks without language', function () {
    var input = '```\nconst x = `value`\n```';
    var result = (0, discord_utils_js_1.escapeBackticksInCodeBlocks)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n\"```\nconst x = \\`value\\`\n```\n\"\n");
});
(0, vitest_1.test)('handles nested backticks in code blocks', function () {
    var input = '```js\nconst nested = `outer ${`inner`} text`\n```';
    var result = (0, discord_utils_js_1.escapeBackticksInCodeBlocks)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n\"```js\nconst nested = \\`outer ${\\`inner\\`} text\\`\n```\n\"\n");
});
(0, vitest_1.test)('preserves markdown outside code blocks', function () {
    var input = "# Heading\n\nThis is **bold** and *italic* text\n\n```js\nconst code = `with template`\n```\n\n- List item 1\n- List item 2";
    var result = (0, discord_utils_js_1.escapeBackticksInCodeBlocks)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n\"# Heading\n\nThis is **bold** and *italic* text\n\n```js\nconst code = \\`with template\\`\n```\n\n\n- List item 1\n- List item 2\"\n");
});
(0, vitest_1.test)('does not escape code block delimiter backticks', function () {
    var input = '```js\nconst x = `hello`\n```';
    var result = (0, discord_utils_js_1.escapeBackticksInCodeBlocks)(input);
    (0, vitest_1.expect)(result.startsWith('```')).toBe(true);
    (0, vitest_1.expect)(result.endsWith('```\n')).toBe(true);
    (0, vitest_1.expect)(result).toContain('\\`hello\\`');
    (0, vitest_1.expect)(result).not.toContain('\\`\\`\\`js');
    (0, vitest_1.expect)(result).not.toContain('\\`\\`\\`\n');
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n\"```js\nconst x = \\`hello\\`\n```\n\"\n");
});
(0, vitest_1.test)('splitMarkdownForDiscord returns single chunk for short content', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: 'Hello world',
        maxLength: 100,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"Hello world\",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord splits at line boundaries', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: 'Line 1\nLine 2\nLine 3\nLine 4',
        maxLength: 15,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"Line 1\n    Line 2\n    \",\n      \"Line 3\n    Line 4\",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord preserves code blocks when not split', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: '```js\nconst x = 1\n```',
        maxLength: 100,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"```js\n    const x = 1\n    ```\",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord adds closing and opening fences when splitting code block', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: '```js\nline1\nline2\nline3\nline4\n```',
        maxLength: 20,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"```js\n    line1\n    ```\n    \",\n      \"```js\n    line2\n    ```\n    \",\n      \"```js\n    line3\n    ```\n    \",\n      \"```js\n    line4\n    ```\n    \",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles code block with language', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: '```typescript\nconst a = 1\nconst b = 2\n```',
        maxLength: 30,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"```typescript\n    const a = 1\n    ```\n    \",\n      \"```typescript\n    const b = 2\n    ```\n    \",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles mixed content with code blocks', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: 'Text before\n```js\ncode\n```\nText after',
        maxLength: 25,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"Text before\n    ```js\n    ```\n    \",\n      \"```js\n    code\n    ```\n    Text after\",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles code block without language', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: '```\nline1\nline2\n```',
        maxLength: 12,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"```\n    ```\n    \",\n      \"```\n    line1\n    ```\n    \",\n      \"```\n    line2\n    ```\n    \",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles multiple consecutive code blocks', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: '```js\nfoo\n```\n```py\nbar\n```',
        maxLength: 20,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"```js\n    foo\n    ```\n    ```py\n    ```\n    \",\n      \"```py\n    bar\n    ```\n    \",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles empty code block', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: 'before\n```\n```\nafter',
        maxLength: 50,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"before\n    ```\n    ```\n    after\",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles content exactly at maxLength', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: '12345678901234567890',
        maxLength: 20,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"12345678901234567890\",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles code block only', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: '```ts\nconst x = 1\n```',
        maxLength: 15,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"```ts\n    ```\n    \",\n      \"```ts\n    const x = 1\n    ```\n    \",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles code block at start with text after', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: '```js\ncode\n```\nSome text after',
        maxLength: 20,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"```js\n    code\n    ```\n    \",\n      \"Some text after\",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles text before code block at end', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: 'Some text before\n```js\ncode\n```',
        maxLength: 25,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"Some text before\n    ```js\n    ```\n    \",\n      \"```js\n    code\n    ```\n    \",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles very long line inside code block', function () {
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: '```js\nshort\nveryverylonglinethatexceedsmaxlength\nshort\n```',
        maxLength: 25,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"```js\n    short\n    ```\n    \",\n      \"```js\n    veryverylo```\n    \",\n      \"```js\n    nglinethat```\n    \",\n      \"```js\n    exceedsmax```\n    \",\n      \"```js\n    length\n    ```\n    \",\n      \"short\n    ```\n    \",\n    ]\n  ");
});
(0, vitest_1.test)('splitMarkdownForDiscord handles realistic long markdown with code block', function () {
    var content = "Here is some explanation text before the code.\n\n```typescript\nexport function calculateTotal(items: Item[]): number {\n  let total = 0\n  for (const item of items) {\n    total += item.price * item.quantity\n  }\n  return total\n}\n\nexport function formatCurrency(amount: number): string {\n  return new Intl.NumberFormat('en-US', {\n    style: 'currency',\n    currency: 'USD',\n  }).format(amount)\n}\n```\n\nAnd here is some text after the code block.";
    var result = (0, discord_utils_js_1.splitMarkdownForDiscord)({
        content: content,
        maxLength: 200,
    });
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    [\n      \"Here is some explanation text before the code.\n\n    ```typescript\n    export function calculateTotal(items: Item[]): number {\n      let total = 0\n      for (const item of items) {\n    ```\n    \",\n      \"```typescript\n        total += item.price * item.quantity\n      }\n      return total\n    }\n\n    export function formatCurrency(amount: number): string {\n      return new Intl.NumberFormat('en-US', {\n    ```\n    \",\n      \"```typescript\n        style: 'currency',\n        currency: 'USD',\n      }).format(amount)\n    }\n    ```\n\n\n    And here is some text after the code block.\",\n    ]\n  ");
});
