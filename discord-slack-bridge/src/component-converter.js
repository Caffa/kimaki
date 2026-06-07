"use strict";
// Converts Discord message components to Slack Block Kit blocks.
//
// Supported Discord components:
//   ActionRow → actions block (contains buttons/selects)
//   Button    → button element (primary/danger/secondary styles)
//   StringSelect/UserSelect/RoleSelect/MentionableSelect/ChannelSelect
//             → Slack select elements (best-effort for role/mentionable)
//   TextDisplay  → section block (mrkdwn) — Components V2
//   Section      → section block with accessory — Components V2
//   Container    → pass through children — Components V2
//   Separator    → divider block — Components V2
//
// Discord uses nested ActionRow > [Button | Select] structure.
// Slack uses actions block > [button | static_select] structure.
// The mapping is nearly 1:1.
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
exports.componentsToBlocks = componentsToBlocks;
var node_crypto_1 = require("node:crypto");
var v10_1 = require("discord-api-types/v10");
var format_converter_js_1 = require("./format-converter.js");
var component_id_codec_js_1 = require("./component-id-codec.js");
/**
 * Convert an array of Discord message components to Slack Block Kit blocks.
 * Returns empty array if no components or all components are unsupported.
 */
function componentsToBlocks(components) {
    if (!components || components.length === 0) {
        return [];
    }
    var blocks = [];
    for (var _i = 0, components_1 = components; _i < components_1.length; _i++) {
        var component = components_1[_i];
        var converted = convertComponent(component);
        blocks.push.apply(blocks, converted);
    }
    return blocks;
}
function convertComponent(component) {
    if (!isTypeObject(component)) {
        return [];
    }
    switch (component.type) {
        case v10_1.ComponentType.ActionRow: {
            if (!isActionRowComponent(component)) {
                return [];
            }
            return convertActionRow(component);
        }
        case v10_1.ComponentType.TextDisplay: {
            if (!isTextDisplayComponent(component)) {
                return [];
            }
            return convertTextDisplay(component);
        }
        case v10_1.ComponentType.Section: {
            if (!isSectionComponent(component)) {
                return [];
            }
            return convertSection(component);
        }
        case v10_1.ComponentType.Container: {
            if (!isContainerComponent(component)) {
                return [];
            }
            return convertContainer(component);
        }
        case v10_1.ComponentType.Separator: {
            return [{ type: 'divider' }];
        }
        default: {
            return [];
        }
    }
}
// ---- ActionRow (contains buttons and selects) ----
function convertActionRow(row) {
    var elements = [];
    for (var _i = 0, _a = row.components; _i < _a.length; _i++) {
        var child = _a[_i];
        if (child.type === v10_1.ComponentType.Button) {
            var btn = convertButton(child);
            if (btn) {
                elements.push(btn);
            }
            continue;
        }
        var select = convertSelect(child);
        if (select) {
            elements.push(select);
        }
    }
    if (elements.length === 0) {
        return [];
    }
    return [
        {
            type: 'actions',
            elements: elements,
        },
    ];
}
// ---- Button ----
function convertButton(button) {
    // Link buttons have a URL, no custom_id
    if (button.style === v10_1.ButtonStyle.Link && 'url' in button && button.url) {
        var actionId = "link_".concat(node_crypto_1.default
            .createHash('sha256')
            .update(button.url)
            .digest('hex')
            .slice(0, 32));
        return {
            type: 'button',
            action_id: actionId,
            text: {
                type: 'plain_text',
                text: labelFromButton(button),
                emoji: true,
            },
            url: button.url,
        };
    }
    // Premium/SKU buttons not supported in Slack
    if (button.style === v10_1.ButtonStyle.Premium) {
        return null;
    }
    // Interactive buttons with custom_id
    if (!('custom_id' in button) || typeof button.custom_id !== 'string') {
        return null;
    }
    var slackStyle = (function () {
        if (button.style === v10_1.ButtonStyle.Primary ||
            button.style === v10_1.ButtonStyle.Success) {
            return 'primary';
        }
        if (button.style === v10_1.ButtonStyle.Danger) {
            return 'danger';
        }
        return undefined;
    })();
    return {
        type: 'button',
        action_id: button.custom_id,
        text: {
            type: 'plain_text',
            text: labelFromButton(button),
            emoji: true,
        },
        value: button.custom_id,
        style: slackStyle,
    };
}
function labelFromButton(button) {
    if ('label' in button && typeof button.label === 'string') {
        return button.label;
    }
    // Fallback for emoji-only buttons
    if ('emoji' in button && button.emoji) {
        if (typeof button.emoji.name === 'string') {
            return button.emoji.name;
        }
        return 'button';
    }
    return 'button';
}
// ---- StringSelect ----
function convertSelect(component) {
    if (component.type === v10_1.ComponentType.StringSelect) {
        return convertStringSelect(component);
    }
    if (component.type === v10_1.ComponentType.UserSelect) {
        return convertUserSelect(component);
    }
    if (component.type === v10_1.ComponentType.ChannelSelect) {
        return convertChannelSelect(component);
    }
    if (component.type === v10_1.ComponentType.MentionableSelect) {
        return convertMentionableSelect(component);
    }
    if (component.type === v10_1.ComponentType.RoleSelect) {
        return convertRoleSelect(component);
    }
    return null;
}
function convertStringSelect(select) {
    var _a;
    var options = select.options.map(function (opt) {
        var slackOpt = {
            text: {
                type: 'plain_text',
                text: opt.label,
                emoji: true,
            },
            value: opt.value,
        };
        if (opt.description) {
            slackOpt.description = {
                type: 'plain_text',
                text: opt.description,
            };
        }
        return slackOpt;
    });
    if (options.length === 0) {
        return null;
    }
    var defaultOption = select.options.find(function (o) {
        return o.default === true;
    });
    var initialOption = defaultOption
        ? options.find(function (o) {
            return o.value === defaultOption.value;
        })
        : undefined;
    var result = {
        type: select.max_values && select.max_values > 1
            ? 'multi_static_select'
            : 'static_select',
        action_id: (0, component_id_codec_js_1.encodeComponentActionId)({
            componentType: v10_1.ComponentType.StringSelect,
            customId: select.custom_id,
        }),
        options: options,
    };
    if (select.placeholder) {
        result.placeholder = {
            type: 'plain_text',
            text: select.placeholder,
        };
    }
    if (initialOption) {
        if (result.type === 'multi_static_select') {
            result.initial_options = [initialOption];
        }
        else {
            result.initial_option = initialOption;
        }
    }
    if (result.type === 'multi_static_select') {
        result.max_selected_items = (_a = select.max_values) !== null && _a !== void 0 ? _a : 1;
    }
    return result;
}
function convertUserSelect(select) {
    var _a, _b, _c;
    var isMulti = ((_a = select.max_values) !== null && _a !== void 0 ? _a : 1) > 1;
    var defaultUsers = ((_b = select.default_values) !== null && _b !== void 0 ? _b : [])
        .filter(function (value) {
        return value.type === 'user';
    })
        .map(function (value) {
        return value.id;
    });
    var result = {
        type: isMulti ? 'multi_users_select' : 'users_select',
        action_id: (0, component_id_codec_js_1.encodeComponentActionId)({
            componentType: v10_1.ComponentType.UserSelect,
            customId: select.custom_id,
        }),
    };
    if (select.placeholder) {
        result.placeholder = {
            type: 'plain_text',
            text: select.placeholder,
        };
    }
    if (isMulti) {
        result.max_selected_items = (_c = select.max_values) !== null && _c !== void 0 ? _c : 1;
        if (defaultUsers.length > 0) {
            result.initial_users = defaultUsers;
        }
        return result;
    }
    if (defaultUsers[0]) {
        result.initial_user = defaultUsers[0];
    }
    return result;
}
function convertChannelSelect(select) {
    var _a, _b, _c, _d;
    var isMulti = ((_a = select.max_values) !== null && _a !== void 0 ? _a : 1) > 1;
    var defaultChannels = ((_b = select.default_values) !== null && _b !== void 0 ? _b : [])
        .filter(function (value) {
        return value.type === 'channel';
    })
        .map(function (value) {
        return value.id;
    });
    var result = {
        type: isMulti
            ? 'multi_conversations_select'
            : 'conversations_select',
        action_id: (0, component_id_codec_js_1.encodeComponentActionId)({
            componentType: v10_1.ComponentType.ChannelSelect,
            customId: select.custom_id,
        }),
        filter: {
            include: discordChannelTypesToSlackFilter((_c = select.channel_types) !== null && _c !== void 0 ? _c : []),
            exclude_external_shared_channels: false,
            exclude_bot_users: true,
        },
    };
    if (select.placeholder) {
        result.placeholder = {
            type: 'plain_text',
            text: select.placeholder,
        };
    }
    if (isMulti) {
        result.max_selected_items = (_d = select.max_values) !== null && _d !== void 0 ? _d : 1;
        if (defaultChannels.length > 0) {
            result.initial_conversations = defaultChannels;
        }
        return result;
    }
    if (defaultChannels[0]) {
        result.initial_conversation = defaultChannels[0];
    }
    return result;
}
function convertMentionableSelect(select) {
    var _a, _b, _c;
    var isMulti = ((_a = select.max_values) !== null && _a !== void 0 ? _a : 1) > 1;
    var defaultUsers = ((_b = select.default_values) !== null && _b !== void 0 ? _b : [])
        .filter(function (value) {
        return value.type === 'user';
    })
        .map(function (value) {
        return value.id;
    });
    var result = {
        type: isMulti ? 'multi_users_select' : 'users_select',
        action_id: (0, component_id_codec_js_1.encodeComponentActionId)({
            componentType: v10_1.ComponentType.MentionableSelect,
            customId: select.custom_id,
        }),
    };
    if (select.placeholder) {
        result.placeholder = {
            type: 'plain_text',
            text: select.placeholder,
        };
    }
    if (isMulti) {
        result.max_selected_items = (_c = select.max_values) !== null && _c !== void 0 ? _c : 1;
        if (defaultUsers.length > 0) {
            result.initial_users = defaultUsers;
        }
        return result;
    }
    if (defaultUsers[0]) {
        result.initial_user = defaultUsers[0];
    }
    return result;
}
function convertRoleSelect(select) {
    var _a, _b, _c, _d;
    var roleDefaults = ((_a = select.default_values) !== null && _a !== void 0 ? _a : []).filter(function (value) {
        return value.type === 'role';
    });
    var noRolesOption = {
        text: { type: 'plain_text', text: 'No roles available', emoji: true },
        value: '__no_roles_available__',
        description: {
            type: 'plain_text',
            text: 'Slack has no role picker; this bridge uses role IDs when available.',
        },
    };
    var options = roleDefaults.length > 0
        ? roleDefaults.map(function (value) {
            return defaultRoleValueToOption(value);
        })
        : [noRolesOption];
    var isMulti = ((_b = select.max_values) !== null && _b !== void 0 ? _b : 1) > 1;
    var result = {
        type: isMulti ? 'multi_static_select' : 'static_select',
        action_id: (0, component_id_codec_js_1.encodeComponentActionId)({
            componentType: v10_1.ComponentType.RoleSelect,
            customId: select.custom_id,
        }),
        options: options,
    };
    if (select.placeholder) {
        result.placeholder = {
            type: 'plain_text',
            text: select.placeholder,
        };
    }
    if (isMulti) {
        result.max_selected_items = (_c = select.max_values) !== null && _c !== void 0 ? _c : 1;
        result.initial_options = options.slice(0, Math.max(0, (_d = select.min_values) !== null && _d !== void 0 ? _d : 0));
        return result;
    }
    if (options[0]) {
        result.initial_option = options[0];
    }
    return result;
}
function defaultRoleValueToOption(value) {
    return {
        text: {
            type: 'plain_text',
            text: "Role ".concat(value.id),
            emoji: true,
        },
        value: value.id,
    };
}
function discordChannelTypesToSlackFilter(channelTypes) {
    if (channelTypes.length === 0) {
        return ['public', 'private'];
    }
    var include = new Set();
    var privateThreadTypes = new Set([
        v10_1.ChannelType.PrivateThread,
    ]);
    var publicThreadTypes = new Set([
        v10_1.ChannelType.PublicThread,
        v10_1.ChannelType.AnnouncementThread,
    ]);
    for (var _i = 0, channelTypes_1 = channelTypes; _i < channelTypes_1.length; _i++) {
        var channelType = channelTypes_1[_i];
        if (channelType === v10_1.ChannelType.DM) {
            include.add('im');
            continue;
        }
        if (channelType === v10_1.ChannelType.GroupDM) {
            include.add('mpim');
            continue;
        }
        if (privateThreadTypes.has(channelType)) {
            include.add('private');
            continue;
        }
        if (publicThreadTypes.has(channelType)) {
            include.add('public');
            continue;
        }
        include.add('public');
        include.add('private');
    }
    return include.size > 0 ? __spreadArray([], include, true) : ['public', 'private'];
}
// ---- Components V2: TextDisplay ----
function convertTextDisplay(component) {
    return [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: (0, format_converter_js_1.markdownToMrkdwn)(component.content),
            },
        },
    ];
}
// ---- Components V2: Section ----
function convertSection(component) {
    // Section has 1-3 text components + optional accessory (button or thumbnail)
    var textParts = component.components
        .map(function (c) {
        if (isTextDisplayComponent(c)) {
            return c.content;
        }
        return '';
    })
        .filter(function (value) {
        return value.length > 0;
    })
        .join('\n');
    var block = {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: (0, format_converter_js_1.markdownToMrkdwn)(textParts),
        },
    };
    // Add accessory if it's a button
    if (component.accessory &&
        component.accessory.type === v10_1.ComponentType.Button) {
        var btn = convertButton(component.accessory);
        if (btn) {
            block.accessory = btn;
        }
    }
    return [block];
}
// ---- Components V2: Container ----
function convertContainer(component) {
    // Container is a wrapper — just convert its children
    var children = Array.isArray(component.components)
        ? component.components
        : [];
    var blocks = [];
    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
        var child = children_1[_i];
        blocks.push.apply(blocks, convertComponent(child));
    }
    return blocks;
}
function isTypeObject(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'type' in value &&
        typeof value.type === 'number');
}
function isActionRowComponent(value) {
    return isTypeObject(value) && value.type === v10_1.ComponentType.ActionRow;
}
function isTextDisplayComponent(value) {
    return isTypeObject(value) && value.type === v10_1.ComponentType.TextDisplay;
}
function isSectionComponent(value) {
    return isTypeObject(value) && value.type === v10_1.ComponentType.Section;
}
function isContainerComponent(value) {
    return isTypeObject(value) && value.type === v10_1.ComponentType.Container;
}
