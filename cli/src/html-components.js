"use strict";
// HTML fragment parser for Discord-renderable components.
// Supports a small reusable subset today (text + button) so tables and other
// CV2 renderers can map inline HTML into Discord UI elements.
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseInlineHtmlRenderables = parseInlineHtmlRenderables;
var htmlparser2_1 = require("htmlparser2");
function parseInlineHtmlRenderables(_a) {
    var html = _a.html;
    var parseError;
    var domNodes = [];
    var handler = new htmlparser2_1.DomHandler(function (error, dom) {
        if (error) {
            parseError = new Error('Failed to parse HTML fragment', {
                cause: error,
            });
            return;
        }
        domNodes = dom;
    }, {
        withStartIndices: false,
        withEndIndices: false,
    });
    var parser = new htmlparser2_1.Parser(handler, {
        xmlMode: false,
        decodeEntities: false,
        recognizeSelfClosing: true,
    });
    parser.write(html);
    parser.end();
    if (parseError) {
        return parseError;
    }
    return parseRenderableNodes({ nodes: domNodes });
}
function parseRenderableNodes(_a) {
    var nodes = _a.nodes;
    var renderables = [];
    for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
        var node = nodes_1[_i];
        if (node.type === htmlparser2_1.ElementType.Text) {
            var textNode = node;
            renderables.push({
                type: 'text',
                text: textNode.data,
            });
            continue;
        }
        if (node.type === htmlparser2_1.ElementType.Tag) {
            var element = node;
            if (element.name !== 'button') {
                return new Error("Unsupported HTML tag: <".concat(element.name, ">"));
            }
            var buttonRenderable = parseButtonElement({ element: element });
            if (buttonRenderable instanceof Error) {
                return buttonRenderable;
            }
            renderables.push(buttonRenderable);
            continue;
        }
        if (node.type === htmlparser2_1.ElementType.Comment) {
            continue;
        }
        return new Error("Unsupported HTML node type: ".concat(node.type));
    }
    return renderables;
}
function parseButtonElement(_a) {
    var _b;
    var element = _a.element;
    var id = (_b = element.attribs.id) === null || _b === void 0 ? void 0 : _b.trim();
    if (!id) {
        return new Error('<button> is missing required id attribute');
    }
    var label = extractNodeText({ nodes: element.children })
        .replace(/\s+/g, ' ')
        .trim();
    if (!label) {
        return new Error("<button id=\"".concat(id, "\"> is missing label text"));
    }
    var variant = normalizeButtonVariant({
        value: element.attribs.variant,
    });
    if (variant instanceof Error) {
        return variant;
    }
    return {
        type: 'button',
        id: id,
        label: label,
        variant: variant,
        disabled: 'disabled' in element.attribs,
    };
}
function normalizeButtonVariant(_a) {
    var value = _a.value;
    if (!value) {
        return 'secondary';
    }
    if (value === 'secondary') {
        return value;
    }
    if (value === 'primary') {
        return value;
    }
    if (value === 'success') {
        return value;
    }
    if (value === 'danger') {
        return value;
    }
    return new Error("Unsupported <button> variant: ".concat(value));
}
function extractNodeText(_a) {
    var nodes = _a.nodes;
    var parts = [];
    for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
        var node = nodes_2[_i];
        if (node.type === htmlparser2_1.ElementType.Text) {
            parts.push((node).data);
            continue;
        }
        if (node.type === htmlparser2_1.ElementType.Tag) {
            parts.push(extractNodeText({ nodes: (node).children }));
        }
    }
    return parts.join('');
}
