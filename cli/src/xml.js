"use strict";
// XML/HTML tag content extractor.
// Parses XML-like tags from strings (e.g., channel topics) to extract
// Kimaki configuration like directory paths and app IDs.
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTagsArrays = extractTagsArrays;
exports.extractNonXmlContent = extractNonXmlContent;
var htmlparser2_1 = require("htmlparser2");
var logger_js_1 = require("./logger.js");
var xmlLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.XML);
function extractTagsArrays(_a) {
    var xml = _a.xml, tags = _a.tags;
    var result = {
        others: [],
    };
    // Initialize arrays for each tag
    tags.forEach(function (tag) {
        result[tag] = [];
    });
    try {
        var handler = new htmlparser2_1.DomHandler(function (error, dom) {
            if (error) {
                xmlLogger.error('Error parsing XML:', error);
            }
            else {
                var findTags_1 = function (nodes, path) {
                    if (path === void 0) { path = []; }
                    nodes.forEach(function (node) {
                        var _a, _b, _c, _d;
                        if (node.type === htmlparser2_1.ElementType.Tag) {
                            var element_1 = node;
                            var currentPath = __spreadArray(__spreadArray([], path, true), [element_1.name], false);
                            var pathString = currentPath.join('.');
                            // Extract content using original string positions
                            var extractContent = function () {
                                // Use element's own indices but exclude the tags
                                if (element_1.startIndex !== null &&
                                    element_1.endIndex !== null) {
                                    // Extract the full element including tags
                                    var fullElement = xml.substring(element_1.startIndex, element_1.endIndex + 1);
                                    // Find where content starts (after opening tag)
                                    var contentStart = fullElement.indexOf('>') + 1;
                                    // Find where content ends (before this element's closing tag)
                                    var closingTag = "</".concat(element_1.name, ">");
                                    var contentEnd = fullElement.lastIndexOf(closingTag);
                                    if (contentStart > 0 && contentEnd > contentStart) {
                                        return fullElement.substring(contentStart, contentEnd);
                                    }
                                    return '';
                                }
                                return '';
                            };
                            // Check both single tag names and nested paths
                            if (tags.includes(element_1.name)) {
                                var content = extractContent();
                                (_a = result[element_1.name]) === null || _a === void 0 ? void 0 : _a.push(content);
                            }
                            // Check for nested path matches
                            if (tags.includes(pathString)) {
                                var content = extractContent();
                                (_b = result[pathString]) === null || _b === void 0 ? void 0 : _b.push(content);
                            }
                            if (element_1.children) {
                                findTags_1(element_1.children, currentPath);
                            }
                        }
                        else if (node.type === htmlparser2_1.ElementType.Text &&
                            ((_c = node.parent) === null || _c === void 0 ? void 0 : _c.type) === htmlparser2_1.ElementType.Root) {
                            var textNode = node;
                            if (textNode.data.trim()) {
                                // console.log('node.parent',node.parent)
                                (_d = result.others) === null || _d === void 0 ? void 0 : _d.push(textNode.data.trim());
                            }
                        }
                    });
                };
                findTags_1(dom);
            }
        }, {
            withStartIndices: true,
            withEndIndices: true,
            xmlMode: true,
        });
        var parser = new htmlparser2_1.Parser(handler, {
            xmlMode: true,
            decodeEntities: false,
        });
        parser.write(xml);
        parser.end();
    }
    catch (error) {
        xmlLogger.error('Unexpected error in extractTags:', error);
    }
    return result;
}
function extractNonXmlContent(xml) {
    var result = extractTagsArrays({ xml: xml, tags: [] });
    return result.others.join('\n');
}
