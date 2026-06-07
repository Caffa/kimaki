"use strict";
// Markdown table formatter for Discord.
// Converts GFM tables to Discord Components V2 (ContainerBuilder with TextDisplay
// key-value pairs and Separators between row groups). Large tables are split
// across multiple Container components to stay within the 40-component limit.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitTablesFromMarkdown = splitTablesFromMarkdown;
exports.buildTableComponents = buildTableComponents;
var marked_1 = require("marked");
var discord_js_1 = require("discord.js");
var html_components_js_1 = require("./html-components.js");
// Max 40 components per message (nested components count toward the limit).
// Row cost is dynamic now because a table row can render as a plain TextDisplay
// or as a TextDisplay plus an Action Row holding one or more buttons.
var MAX_COMPONENTS = 40;
/**
 * Split markdown into text and table component segments.
 * Tables are rendered as CV2 Container components with bold key-value TextDisplay
 * pairs. Large tables are split across multiple component segments.
 */
function splitTablesFromMarkdown(markdown, options) {
    if (options === void 0) { options = {}; }
    var blocks = splitMarkdownByCallouts({ markdown: markdown });
    return blocks.flatMap(function (block) {
        if (block.type === 'callout') {
            var innerSegments = splitTablesFromMarkdown(block.content, options);
            return buildCalloutSegments({
                segments: innerSegments,
                callout: block.callout,
            });
        }
        return splitTableSegmentsFromText({
            markdown: block.text,
            options: options,
        });
    });
}
function splitMarkdownByCallouts(_a) {
    var _b, _c;
    var markdown = _a.markdown;
    var lines = (_c = (_b = markdown.match(/.*(?:\n|$)/g)) === null || _b === void 0 ? void 0 : _b.filter(function (line) {
        return line.length > 0;
    })) !== null && _c !== void 0 ? _c : [markdown];
    var blocks = [];
    var textBuffer = '';
    for (var index = 0; index < lines.length; index++) {
        var line = lines[index];
        var callout = parseCalloutOpenLine({ line: line });
        if (!callout) {
            textBuffer += line;
            continue;
        }
        if (textBuffer.length > 0) {
            blocks.push({ type: 'text', text: textBuffer });
            textBuffer = '';
        }
        var body = collectCalloutBodyFromLines({
            lines: lines,
            startIndex: index,
        });
        if (body instanceof Error) {
            textBuffer += line;
            continue;
        }
        blocks.push({
            type: 'callout',
            content: body.content,
            callout: callout,
        });
        index = body.endIndex;
    }
    if (textBuffer.length > 0) {
        blocks.push({ type: 'text', text: textBuffer });
    }
    return blocks;
}
function splitTableSegmentsFromText(_a) {
    var markdown = _a.markdown, options = _a.options;
    var lexer = new marked_1.Lexer();
    return splitTokensIntoSegments({
        tokens: lexer.lex(markdown),
        options: options,
    });
}
function splitTokensIntoSegments(_a) {
    var tokens = _a.tokens, options = _a.options;
    var segments = [];
    var textBuffer = '';
    var isTableToken = function (token) {
        return (token.type === 'table' &&
            Object.hasOwn(token, 'header') &&
            Object.hasOwn(token, 'rows'));
    };
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (isTableToken(token)) {
            if (textBuffer.trim()) {
                segments.push({ type: 'text', text: textBuffer });
                textBuffer = '';
            }
            var componentSegments = buildTableComponents(token, options);
            segments.push.apply(segments, componentSegments);
        }
        else {
            textBuffer += token.raw;
        }
    }
    if (textBuffer.trim()) {
        segments.push({ type: 'text', text: textBuffer });
    }
    return segments;
}
function buildCalloutSegments(_a) {
    var segments = _a.segments, callout = _a.callout;
    var children = flattenCalloutChildren({ segments: segments });
    if (children.length === 0) {
        return [];
    }
    var chunks = chunkCalloutChildrenByComponentLimit({ children: children });
    return chunks.map(function (chunk) {
        var container = __assign(__assign({ type: discord_js_1.ComponentType.Container }, (callout.accentColor !== undefined
            ? { accent_color: callout.accentColor }
            : {})), { components: chunk });
        var components = [container];
        return {
            type: 'components',
            components: components,
        };
    });
}
function flattenCalloutChildren(_a) {
    var segments = _a.segments;
    return segments.flatMap(function (segment) {
        if (segment.type === 'text') {
            if (!segment.text.trim()) {
                return [];
            }
            return [
                {
                    type: discord_js_1.ComponentType.TextDisplay,
                    content: segment.text.trim(),
                },
            ];
        }
        return segment.components.flatMap(function (component) {
            if (component.type !== discord_js_1.ComponentType.Container) {
                return [];
            }
            return component.components;
        });
    });
}
function chunkCalloutChildrenByComponentLimit(_a) {
    var children = _a.children;
    var chunks = [];
    var currentChunk = [];
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var child = children_1[_i];
        if (currentChunk.length > 0 && currentChunk.length + 2 > MAX_COMPONENTS) {
            chunks.push(currentChunk);
            currentChunk = [];
        }
        currentChunk.push(child);
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }
    return chunks;
}
function collectCalloutBodyFromLines(_a) {
    var lines = _a.lines, startIndex = _a.startIndex;
    var depth = 0;
    var contentLines = [];
    for (var index = startIndex; index < lines.length; index++) {
        var line = lines[index];
        var nestedCallout = parseCalloutOpenLine({ line: line });
        if (nestedCallout) {
            if (depth > 0) {
                contentLines.push(line);
            }
            depth += 1;
            continue;
        }
        if (/^<\/callout>$/i.test(line.trim())) {
            depth -= 1;
            if (depth === 0) {
                return {
                    content: contentLines.join(''),
                    endIndex: index,
                };
            }
            contentLines.push(line);
            continue;
        }
        if (depth > 0) {
            contentLines.push(line);
        }
    }
    return new Error('Unclosed <callout> block');
}
function parseCalloutOpenLine(_a) {
    var _b, _c;
    var line = _a.line;
    var match = line.trim().match(/^<callout(?:\s+[^>]*)?>$/i);
    if (!match) {
        return null;
    }
    var accentValue = (_c = (_b = line.match(/\baccent=(['"])(.*?)\1/i)) === null || _b === void 0 ? void 0 : _b[2]) === null || _c === void 0 ? void 0 : _c.trim();
    var accentColor = accentValue
        ? parseAccentColor({ value: accentValue })
        : undefined;
    return {
        accentColor: accentColor instanceof Error ? undefined : accentColor,
    };
}
function parseAccentColor(_a) {
    var value = _a.value;
    var hex = value.trim().toLowerCase();
    if (/^#[0-9a-f]{6}$/.test(hex)) {
        return Number.parseInt(hex.slice(1), 16);
    }
    if (/^#[0-9a-f]{3}$/.test(hex)) {
        var expanded = hex
            .slice(1)
            .split('')
            .map(function (char) {
            return "".concat(char).concat(char);
        })
            .join('');
        return Number.parseInt(expanded, 16);
    }
    if (/^\d+$/.test(hex)) {
        return Number.parseInt(hex, 10);
    }
    return new Error("Unsupported callout accent color: ".concat(value));
}
/**
 * Build CV2 components for a table. Plain rows render as one TextDisplay with
 * bold key-value lines. Rows with resolved button cells render as a TextDisplay
 * plus an Action Row so wide tables do not violate Section's 1-3 text child
 * limit. Large tables are split into multiple Containers using a dynamic
 * component-budget check.
 */
function buildTableComponents(table, options) {
    if (options === void 0) { options = {}; }
    var headers = table.header.map(function (cell) {
        return extractCellText(cell.tokens);
    });
    var rows = table.rows.map(function (row) {
        return buildRenderedRow({
            headers: headers,
            row: row,
            options: options,
        });
    });
    var chunks = chunkRowsByComponentLimit({ rows: rows });
    return chunks.map(function (chunkRows) {
        var children = [];
        for (var i = 0; i < chunkRows.length; i++) {
            if (i > 0) {
                children.push({
                    type: discord_js_1.ComponentType.Separator,
                    divider: true,
                    spacing: discord_js_1.SeparatorSpacingSize.Small,
                });
            }
            children.push.apply(children, chunkRows[i].components);
        }
        var container = {
            type: discord_js_1.ComponentType.Container,
            components: children,
        };
        var components = [container];
        return {
            type: 'components',
            components: components,
        };
    });
}
function buildRenderedRow(_a) {
    var headers = _a.headers, row = _a.row, options = _a.options;
    var renderedCells = row.map(function (cell) {
        return renderTableCell({ cell: cell, options: options });
    });
    var buttonCellCount = renderedCells.filter(function (cell) {
        return cell.type === 'button';
    }).length;
    if (buttonCellCount > 0) {
        return buildButtonRow({
            headers: headers,
            cells: renderedCells,
        });
    }
    return buildTextRow({
        headers: headers,
        cells: renderedCells,
    });
}
function buildTextRow(_a) {
    var headers = _a.headers, cells = _a.cells;
    var lines = headers.map(function (key, index) {
        var cell = cells[index];
        var value = cell ? getRenderedCellText({ cell: cell }) : '';
        return "**".concat(key, "** ").concat(value);
    });
    return {
        components: [
            {
                type: discord_js_1.ComponentType.TextDisplay,
                content: lines.join('\n'),
            },
        ],
        componentCost: 1,
    };
}
function buildButtonRow(_a) {
    var headers = _a.headers, cells = _a.cells;
    var buttonCells = cells.filter(function (cell) {
        return cell.type === 'button';
    });
    if (buttonCells.length === 0 || buttonCells.length > 5) {
        return buildTextRow({ headers: headers, cells: cells });
    }
    var lines = headers.flatMap(function (header, index) {
        var cell = cells[index];
        if (!cell || cell.type === 'button') {
            return [];
        }
        return ["**".concat(header, "** ").concat(cell.text)];
    });
    if (lines.length === 0) {
        return buildTextRow({ headers: headers, cells: cells });
    }
    var buttons = buttonCells.map(function (buttonCell) {
        return {
            type: discord_js_1.ComponentType.Button,
            custom_id: buttonCell.customId,
            label: buttonCell.label,
            style: toButtonStyle({ variant: buttonCell.variant }),
            disabled: buttonCell.disabled,
        };
    });
    var actionRow = {
        type: discord_js_1.ComponentType.ActionRow,
        components: buttons,
    };
    return {
        components: [
            {
                type: discord_js_1.ComponentType.TextDisplay,
                content: lines.join('\n'),
            },
            actionRow,
        ],
        componentCost: 2 + buttons.length,
    };
}
function chunkRowsByComponentLimit(_a) {
    var rows = _a.rows;
    var chunks = [];
    var currentChunk = [];
    var currentCost = 1;
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        var separatorCost = currentChunk.length > 0 ? 1 : 0;
        var nextCost = currentCost + separatorCost + row.componentCost;
        if (currentChunk.length > 0 && nextCost > MAX_COMPONENTS) {
            chunks.push(currentChunk);
            currentChunk = [row];
            currentCost = 1 + row.componentCost;
            continue;
        }
        currentChunk.push(row);
        currentCost = nextCost;
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }
    return chunks;
}
function renderTableCell(_a) {
    var _b;
    var cell = _a.cell, options = _a.options;
    var hasHtmlToken = cell.tokens.some(function (token) {
        return token.type === 'html';
    });
    if (!hasHtmlToken) {
        return {
            type: 'text',
            text: extractCellText(cell.tokens),
        };
    }
    var renderables = (0, html_components_js_1.parseInlineHtmlRenderables)({ html: cell.text });
    if (renderables instanceof Error) {
        return {
            type: 'text',
            text: extractRenderableText({ renderables: undefined, fallbackText: cell.text }),
        };
    }
    var buttonRenderables = renderables.filter(function (renderable) {
        return renderable.type === 'button';
    });
    if (buttonRenderables.length !== 1) {
        return {
            type: 'text',
            text: extractRenderableText({ renderables: renderables, fallbackText: cell.text }),
        };
    }
    var hasNonWhitespaceText = renderables.some(function (renderable) {
        if (renderable.type !== 'text') {
            return false;
        }
        return renderable.text.trim().length > 0;
    });
    if (hasNonWhitespaceText) {
        return {
            type: 'text',
            text: extractRenderableText({ renderables: renderables, fallbackText: cell.text }),
        };
    }
    var button = buttonRenderables[0];
    var customId = (_b = options.resolveButtonCustomId) === null || _b === void 0 ? void 0 : _b.call(options, { button: button });
    if (!customId || customId instanceof Error) {
        return {
            type: 'text',
            text: button.label,
        };
    }
    return {
        type: 'button',
        label: button.label,
        customId: customId,
        variant: button.variant,
        disabled: button.disabled,
    };
}
function getRenderedCellText(_a) {
    var cell = _a.cell;
    if (cell.type === 'button') {
        return cell.label;
    }
    return cell.text;
}
function extractRenderableText(_a) {
    var renderables = _a.renderables, fallbackText = _a.fallbackText;
    if (!renderables) {
        return fallbackText.replace(/\s+/g, ' ').trim();
    }
    var text = renderables
        .map(function (renderable) {
        if (renderable.type === 'button') {
            return renderable.label;
        }
        return renderable.text;
    })
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (text.length > 0) {
        return text;
    }
    return fallbackText.replace(/\s+/g, ' ').trim();
}
function toButtonStyle(_a) {
    var variant = _a.variant;
    if (variant === 'primary') {
        return discord_js_1.ButtonStyle.Primary;
    }
    if (variant === 'success') {
        return discord_js_1.ButtonStyle.Success;
    }
    if (variant === 'danger') {
        return discord_js_1.ButtonStyle.Danger;
    }
    return discord_js_1.ButtonStyle.Secondary;
}
function extractCellText(tokens) {
    var parts = [];
    for (var _i = 0, tokens_2 = tokens; _i < tokens_2.length; _i++) {
        var token = tokens_2[_i];
        parts.push(extractTokenText(token));
    }
    return parts.join('').trim();
}
function extractTokenText(token) {
    switch (token.type) {
        case 'text':
        case 'codespan':
        case 'escape':
            return token.text;
        case 'link':
            return token.href;
        case 'image':
            return token.href;
        case 'strong':
        case 'em':
        case 'del':
            return token.tokens ? extractCellText(token.tokens) : token.text;
        case 'br':
            return ' ';
        default: {
            var nestedTokens = Reflect.get(token, 'tokens');
            if (Array.isArray(nestedTokens)) {
                return extractCellText(nestedTokens.filter(function (value) {
                    return (typeof value === 'object' &&
                        value !== null &&
                        typeof Reflect.get(value, 'type') === 'string');
                }));
            }
            var text = Reflect.get(token, 'text');
            if (typeof text === 'string') {
                return text;
            }
            return '';
        }
    }
}
