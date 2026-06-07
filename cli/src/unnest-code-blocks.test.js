"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var unnest_code_blocks_js_1 = require("./unnest-code-blocks.js");
// Discord markdown quirks (as of 2026-02):
// - Fenced code blocks nested inside list indentation often don't render at all.
//   (Discord effectively wants fences at the start of the line.)
// - If a list line is accidentally concatenated with the next list marker or a fence,
//   e.g. `**Title**- bullet` or `Text:```ts`, Discord won't parse it as a list/code block.
// These tests lock down that `unnestCodeBlocksFromLists()` produces Discord-friendly output.
(0, vitest_1.test)('basic - single item with code block', function () {
    var input = "- Item 1\n  ```js\n  const x = 1\n  ```";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Item 1\n\n    ```js\n    const x = 1\n    ```\"\n  ");
});
(0, vitest_1.test)('multiple items - code in middle item only', function () {
    var input = "- Item 1\n- Item 2\n  ```js\n  const x = 1\n  ```\n- Item 3";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Item 1\n    - Item 2\n\n    ```js\n    const x = 1\n    ```\n    - Item 3\"\n  ");
});
(0, vitest_1.test)('multiple code blocks in one item', function () {
    var input = "- Item with two code blocks\n  ```js\n  const a = 1\n  ```\n  ```python\n  b = 2\n  ```";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Item with two code blocks\n\n    ```js\n    const a = 1\n    ```\n    ```python\n    b = 2\n    ```\"\n  ");
});
(0, vitest_1.test)('nested list with code', function () {
    var input = "- Item 1\n  - Nested item\n    ```js\n    const x = 1\n    ```\n- Item 2";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Item 1\n    - Nested item\n\n    ```js\n    const x = 1\n    ```\n    - Item 2\"\n  ");
});
(0, vitest_1.test)('ordered list preserves numbering', function () {
    var input = "1. First item\n   ```js\n   const a = 1\n   ```\n2. Second item\n3. Third item";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"1. First item\n\n    ```js\n    const a = 1\n    ```\n    2. Second item\n    3. Third item\"\n  ");
});
(0, vitest_1.test)('list without code blocks unchanged', function () {
    var input = "- Item 1\n- Item 2\n- Item 3";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Item 1\n    - Item 2\n    - Item 3\"\n  ");
});
(0, vitest_1.test)('mixed - some items have code, some dont', function () {
    var input = "- Normal item\n- Item with code\n  ```js\n  const x = 1\n  ```\n- Another normal item\n- Another with code\n  ```python\n  y = 2\n  ```";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Normal item\n    - Item with code\n\n    ```js\n    const x = 1\n    ```\n    - Another normal item\n    - Another with code\n\n    ```python\n    y = 2\n    ```\"\n  ");
});
(0, vitest_1.test)('text before and after code in same item', function () {
    var input = "- Start text\n  ```js\n  const x = 1\n  ```\n  End text";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Start text\n\n    ```js\n    const x = 1\n    ```\n    - End text\"\n  ");
});
(0, vitest_1.test)('preserves content outside lists', function () {
    var input = "# Heading\n\nSome paragraph text.\n\n- List item\n  ```js\n  const x = 1\n  ```\n\nMore text after.";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"# Heading\n\n    Some paragraph text.\n\n    - List item\n\n    ```js\n    const x = 1\n    ```\n\n    More text after.\"\n  ");
});
(0, vitest_1.test)('code block at root level unchanged', function () {
    var input = "```js\nconst x = 1\n```";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"```js\n    const x = 1\n    ```\"\n  ");
});
(0, vitest_1.test)('handles code block without language', function () {
    var input = "- Item\n  ```\n  plain code\n  ```";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Item\n\n    ```\n    plain code\n    ```\"\n  ");
});
(0, vitest_1.test)('handles empty list item with code', function () {
    var input = "- ```js\n  const x = 1\n  ```";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"```js\n    const x = 1\n    ```\"\n  ");
});
(0, vitest_1.test)('numbered list with text after code block', function () {
    var input = "1. First item\n   ```js\n   const a = 1\n   ```\n   Text after the code\n2. Second item";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"1. First item\n\n    ```js\n    const a = 1\n    ```\n    - Text after the code\n    2. Second item\"\n  ");
});
(0, vitest_1.test)('numbered list with multiple code blocks and text between', function () {
    var input = "1. First item\n   ```js\n   const a = 1\n   ```\n   Middle text\n   ```python\n   b = 2\n   ```\n   Final text\n2. Second item";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"1. First item\n\n    ```js\n    const a = 1\n    ```\n    - Middle text\n\n    ```python\n    b = 2\n    ```\n    - Final text\n    2. Second item\"\n  ");
});
(0, vitest_1.test)('unordered list with multiple code blocks and text between', function () {
    var input = "- First item\n  ```js\n  const a = 1\n  ```\n  Middle text\n  ```python\n  b = 2\n  ```\n  Final text\n- Second item";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- First item\n\n    ```js\n    const a = 1\n    ```\n    - Middle text\n\n    ```python\n    b = 2\n    ```\n    - Final text\n    - Second item\"\n  ");
});
(0, vitest_1.test)('numbered list starting from 5', function () {
    var input = "5. Fifth item\n   ```js\n   code\n   ```\n   Text after\n6. Sixth item";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"5. Fifth item\n\n    ```js\n    code\n    ```\n    - Text after\n    6. Sixth item\"\n  ");
});
(0, vitest_1.test)('deeply nested list with code', function () {
    var input = "- Level 1\n  - Level 2\n    - Level 3\n      ```js\n      deep code\n      ```\n      Text after deep code\n    - Another level 3\n  - Back to level 2";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Level 1\n    - Level 2\n    - Level 3\n\n    ```js\n    deep code\n    ```\n    - Text after deep code\n    - Another level 3\n    - Back to level 2\"\n  ");
});
(0, vitest_1.test)('nested numbered list inside unordered with code', function () {
    var input = "- Unordered item\n  1. Nested numbered\n     ```js\n     code\n     ```\n     Text after\n  2. Second nested\n- Another unordered";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Unordered item\n    1. Nested numbered\n\n    ```js\n    code\n    ```\n    - Text after\n    2. Second nested\n    - Another unordered\"\n  ");
});
(0, vitest_1.test)('code block at end of numbered item no text after', function () {
    var input = "1. First with text\n   ```js\n   code here\n   ```\n2. Second item\n3. Third item";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"1. First with text\n\n    ```js\n    code here\n    ```\n    2. Second item\n    3. Third item\"\n  ");
});
(0, vitest_1.test)('multiple items each with code and text after', function () {
    var input = "1. First\n   ```js\n   code1\n   ```\n   After first\n2. Second\n   ```python\n   code2\n   ```\n   After second\n3. Third no code";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"1. First\n\n    ```js\n    code1\n    ```\n    - After first\n    2. Second\n\n    ```python\n    code2\n    ```\n    - After second\n    3. Third no code\"\n  ");
});
(0, vitest_1.test)('code block immediately after list marker', function () {
    var input = "1. ```js\n   immediate code\n   ```\n2. Normal item";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"```js\n    immediate code\n    ```\n    2. Normal item\"\n  ");
});
(0, vitest_1.test)('code block with filename metadata', function () {
    var input = "- Item with code\n  ```tsx filename=example.tsx\n  const x = 1\n  ```";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- Item with code\n\n    ```tsx filename=example.tsx\n    const x = 1\n    ```\"\n  ");
});
(0, vitest_1.test)('numbered list with filename metadata code block', function () {
    var input = "1. First item\n   ```tsx filename=app.tsx\n   export default function App() {}\n   ```\n2. Second item";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"1. First item\n\n    ```tsx filename=app.tsx\n    export default function App() {}\n    ```\n    2. Second item\"\n  ");
});
(0, vitest_1.test)('inline fence in list item stays inline (discord formatting issue)', function () {
    var input = "- File: playwriter/src/aria-snapshot.ts\n- Add helper function (~line 477, after isTextRole):```ts\nfunction isSubstringOfAny(needle: string, haystack: Set<string>): boolean {\n  for (const str of haystack) {\n    if (str.includes(needle)) {\n      return true\n    }\n  }\n  return false\n}\n```";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n    \"- File: playwriter/src/aria-snapshot.ts\n    - Add helper function (~line 477, after isTextRole):```ts\n    function isSubstringOfAny(needle: string, haystack: Set<string>): boolean {\n      for (const str of haystack) {\n        if (str.includes(needle)) {\n          return true\n        }\n      }\n      return false\n    }\n    ```\"\n  ");
});
(0, vitest_1.test)('numbered list with ) delimiter and code block after continuation text', function () {
    var input = "What to test (no mocks, real processes):\n\n1) **\"Older client must not kill newer server\"**\n- Start a tiny HTTP server on an ephemeral port that serves `/version` as something **higher than** our current version.\n- Run `ensureRelayServer({ restartOnVersionMismatch: true })` pointed at that port.\n- Assert:\n  - the server is **still listening** afterward (port not killed)\n  - no relay is spawned / no kill attempted\nThis directly exercises:\n```ts\nif (serverVersion !== null && compareVersions(serverVersion, VERSION) > 0) return\n```\n\n2) **\"Newer client may restart older server (when allowed)\"**\n- Start a tiny HTTP server that returns a **lower** `/version`.\n- Call `ensureRelayServer({ restartOnVersionMismatch: true })`.\n- Assert the old server gets killed (port frees).";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)('\n' + result).toMatchInlineSnapshot("\n    \"\n    What to test (no mocks, real processes):\n\n    1) **\"Older client must not kill newer server\"**\n    - Start a tiny HTTP server on an ephemeral port that serves `/version` as something **higher than** our current version.\n    - Run `ensureRelayServer({ restartOnVersionMismatch: true })` pointed at that port.\n    - Assert:\n      - the server is **still listening** afterward (port not killed)\n      - no relay is spawned / no kill attempted\n    This directly exercises:\n    ```ts\n    if (serverVersion !== null && compareVersions(serverVersion, VERSION) > 0) return\n    ```\n\n    2) **\"Newer client may restart older server (when allowed)\"**\n    - Start a tiny HTTP server that returns a **lower** `/version`.\n    - Call `ensureRelayServer({ restartOnVersionMismatch: true })`.\n    - Assert the old server gets killed (port frees).\"\n  ");
    // Desired Discord formatting:
    // - Preserve newline between the "1) ..." line and the nested "- Start..." list
    // - Keep fenced code blocks on their own lines (not glued to surrounding text)
    (0, vitest_1.expect)(result).toContain('1) **"Older client must not kill newer server"**\n');
    (0, vitest_1.expect)(result).toContain('\n- Start a tiny HTTP server');
    (0, vitest_1.expect)(result).toContain('\nThis directly exercises:\n');
    (0, vitest_1.expect)(result).toMatch(/\n```ts\n[\s\S]*\n```\n/);
    // Regression: these are the two failure modes seen in the session message
    (0, vitest_1.expect)(result).not.toContain('**"Older client must not kill newer server"**- Start');
    (0, vitest_1.expect)(result).not.toContain('exercises:```');
});
(0, vitest_1.test)('unordered list with blank line before fenced code block', function () {
    var input = "- Item with spacing\n\n  ```ts\n  const x = 1\n  ```\n- Next item";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)('\n' + result).toMatchInlineSnapshot("\n    \"\n    - Item with spacing\n\n    ```ts\n    const x = 1\n    ```\n    - Next item\"\n  ");
});
(0, vitest_1.test)('ordered list item containing fenced code and trailing paragraph', function () {
    var input = "1) Item title\n   ```js\n   console.log('hi')\n   ```\n   trailing text\n2) Second item";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)('\n' + result).toMatchInlineSnapshot("\n    \"\n    1. Item title\n\n    ```js\n    console.log('hi')\n    ```\n    - trailing text\n    2) Second item\"\n  ");
});
(0, vitest_1.test)('two top-level lists back-to-back (ensure newline between them)', function () {
    var input = "- a\n- b\n1) c\n- d";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)('\n' + result).toMatchInlineSnapshot("\n    \"\n    - a\n    - b\n    1) c\n    - d\"\n  ");
});
(0, vitest_1.test)('top-level list followed by top-level fenced code then paragraph', function () {
    var input = "- Item\n```ts\ntype X = { a: 1 }\n```\nAfter.";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)('\n' + result).toMatchInlineSnapshot("\n    \"\n    - Item\n    ```ts\n    type X = { a: 1 }\n    ```\n    After.\"\n  ");
});
(0, vitest_1.test)('task list item with fenced code', function () {
    var input = "- [ ] Do thing\n  ```sh\n  echo hi\n  ```";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)('\n' + result).toMatchInlineSnapshot("\n    \"\n    - [ ] Do thing\n\n    ```sh\n    echo hi\n    ```\"\n  ");
});
(0, vitest_1.test)('checked task list item keeps a single checkbox marker', function () {
    var input = "- [x] Ship fix\n  ```ts\n  console.log('done')\n  ```";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)('\n' + result).toMatchInlineSnapshot("\n    \"\n    - [x] Ship fix\n\n    ```ts\n    console.log('done')\n    ```\"\n  ");
});
(0, vitest_1.test)('task list item with trailing text keeps one checkbox marker after hoisting code', function () {
    var input = "- [ ] Do thing\n  ```sh\n  echo hi\n  ```\n  then report back";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)('\n' + result).toMatchInlineSnapshot("\n    \"\n    - [ ] Do thing\n\n    ```sh\n    echo hi\n    ```\n    - then report back\"\n  ");
});
(0, vitest_1.test)('fenced code block indented more than list marker', function () {
    var input = "- Item\n    ```ts\n    const x = 1\n    ```\n- Next";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)('\n' + result).toMatchInlineSnapshot("\n    \"\n    - Item\n\n    ```ts\n    const x = 1\n    ```\n    - Next\"\n  ");
});
(0, vitest_1.test)('ordered list with multiple paragraphs and code', function () {
    var input = "1) Title\n   First paragraph.\n\n   Second paragraph.\n\n   ```ts\n   const x = 1\n   ```\n\n   After code.\n2) Next";
    var result = (0, unnest_code_blocks_js_1.unnestCodeBlocksFromLists)(input);
    (0, vitest_1.expect)('\n' + result).toMatchInlineSnapshot("\n    \"\n    1. Title\n    First paragraph.\n\n    Second paragraph.\n\n    ```ts\n    const x = 1\n    ```\n    - After code.\n    2) Next\"\n  ");
});
