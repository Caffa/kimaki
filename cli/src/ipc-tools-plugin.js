"use strict";
// OpenCode plugin that provides IPC-based tools for Discord interaction:
// - kimaki_file_upload: prompts the Discord user to upload files via native picker
// - kimaki_action_buttons: shows clickable action buttons in the Discord thread
//
// Tools communicate with the bot process via IPC rows in SQLite (the plugin
// runs inside the OpenCode server process, not the bot process).
//
// Exported from kimaki-opencode-plugin.ts — each export is treated as a separate
// plugin by OpenCode's plugin loader.
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipcToolsPlugin = void 0;
var string_dedent_1 = require("string-dedent");
var zod_1 = require("zod");
var config_js_1 = require("./config.js");
var plugin_logger_js_1 = require("./plugin-logger.js");
var sentry_js_1 = require("./sentry.js");
// Inlined from '@opencode-ai/plugin/tool' because the subpath value import
// fails at runtime in global npm installs (#35). Opencode loads this plugin
// file in its own process and resolves modules from kimaki's install dir,
// but the '/tool' subpath export isn't found by opencode's module resolver.
// The type-only imports above are fine (erased at compile time).
//
// NOTE: @opencode-ai/plugin bundles its own zod 4.1.x as a hard dependency
// while goke (used by cli.ts) requires zod 4.3.x. This version skew makes
// the Plugin return type structurally incompatible with our local tool()
// even though runtime behavior is identical. ipcToolsPlugin is cast to
// Plugin via unknown to bypass this purely type-level incompatibility.
function tool(input) {
    return input;
}
var logger = (0, plugin_logger_js_1.createPluginLogger)('OPENCODE');
var FILE_UPLOAD_TIMEOUT_MS = 6 * 60 * 1000;
var DEFAULT_FILE_UPLOAD_MAX_FILES = 5;
var ACTION_BUTTON_TIMEOUT_MS = 30 * 1000;
function loadDatabaseModule() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // The plugin-loading e2e test boots OpenCode directly without the bot-side
            // Hrana env vars. Lazy-loading avoids opening libSQL sqlite mode
            // during plugin startup when no IPC tool is being executed yet.
            return [2 /*return*/, Promise.resolve().then(function () { return require('./database.js'); })];
        });
    });
}
// @opencode-ai/plugin bundles zod 4.1.x as a hard dep; our code uses 4.3.x
// (required by goke for ~standard.jsonSchema). The Plugin return type is
// structurally incompatible due to _zod.version.minor skew even though
// runtime behavior is identical. `any` bypasses the type-level mismatch —
// opencode's plugin loader doesn't care about the zod version at runtime.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var ipcToolsPlugin = function () { return __awaiter(void 0, void 0, void 0, function () {
    var dataDir;
    return __generator(this, function (_a) {
        (0, sentry_js_1.initSentry)();
        dataDir = process.env.KIMAKI_DATA_DIR;
        if (dataDir) {
            (0, config_js_1.setDataDir)(dataDir);
            (0, plugin_logger_js_1.setPluginLogFilePath)(dataDir);
        }
        return [2 /*return*/, {
                tool: {
                    kimaki_file_upload: tool({
                        description: 'Prompt the Discord user to upload files using a native file picker modal. ' +
                            'The user sees a button, clicks it, and gets a file upload dialog. ' +
                            'Returns the local file paths of downloaded files in the project directory. ' +
                            'Use this when you need the user to provide files (images, documents, configs, etc.). ' +
                            'IMPORTANT: Always call this tool last in your message, after all text parts.',
                        args: {
                            prompt: zod_1.z
                                .string()
                                .describe('Message shown to the user explaining what files to upload'),
                            maxFiles: zod_1.z
                                .number()
                                .min(1)
                                .max(10)
                                .optional()
                                .describe('Maximum number of files the user can upload (1-10, default 5)'),
                        },
                        execute: function (_a, context_1) {
                            return __awaiter(this, arguments, void 0, function (_b, context) {
                                var _c, getThreadIdBySessionId, createIpcRequest, getIpcRequestById, threadId, ipcRow, deadline, POLL_INTERVAL_MS, updated, parsed, filePaths;
                                var prompt = _b.prompt, maxFiles = _b.maxFiles;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0: return [4 /*yield*/, loadDatabaseModule()];
                                        case 1:
                                            _c = _d.sent(), getThreadIdBySessionId = _c.getThreadIdBySessionId, createIpcRequest = _c.createIpcRequest, getIpcRequestById = _c.getIpcRequestById;
                                            return [4 /*yield*/, getThreadIdBySessionId(context.sessionID)];
                                        case 2:
                                            threadId = _d.sent();
                                            if (!threadId) {
                                                return [2 /*return*/, 'Could not find thread for current session'];
                                            }
                                            return [4 /*yield*/, createIpcRequest({
                                                    type: 'file_upload',
                                                    sessionId: context.sessionID,
                                                    threadId: threadId,
                                                    payload: JSON.stringify({
                                                        prompt: prompt,
                                                        maxFiles: maxFiles || DEFAULT_FILE_UPLOAD_MAX_FILES,
                                                        directory: context.directory,
                                                    }),
                                                })];
                                        case 3:
                                            ipcRow = _d.sent();
                                            deadline = Date.now() + FILE_UPLOAD_TIMEOUT_MS;
                                            POLL_INTERVAL_MS = 300;
                                            _d.label = 4;
                                        case 4:
                                            if (!(Date.now() < deadline)) return [3 /*break*/, 7];
                                            return [4 /*yield*/, new Promise(function (resolve) {
                                                    setTimeout(resolve, POLL_INTERVAL_MS);
                                                })];
                                        case 5:
                                            _d.sent();
                                            return [4 /*yield*/, getIpcRequestById({ id: ipcRow.id })];
                                        case 6:
                                            updated = _d.sent();
                                            if (!updated || updated.status === 'cancelled') {
                                                return [2 /*return*/, 'File upload was cancelled'];
                                            }
                                            if (updated.response) {
                                                parsed = JSON.parse(updated.response);
                                                if (parsed.error) {
                                                    return [2 /*return*/, "File upload failed: ".concat(parsed.error)];
                                                }
                                                filePaths = parsed.filePaths || [];
                                                if (filePaths.length === 0) {
                                                    return [2 /*return*/, 'No files were uploaded (user may have cancelled or sent a new message)'];
                                                }
                                                return [2 /*return*/, "Files uploaded successfully:\n".concat(filePaths.join('\n'))];
                                            }
                                            return [3 /*break*/, 4];
                                        case 7: return [2 /*return*/, 'File upload timed out - user did not upload files within the time limit'];
                                    }
                                });
                            });
                        },
                    }),
                    kimaki_action_buttons: tool({
                        description: (0, string_dedent_1.default)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n          Show action buttons in the current Discord thread for quick confirmations.\n          Use this when the user can respond by clicking one of up to 3 buttons.\n          Prefer a single button whenever possible.\n          Default color is white (same visual style as permission deny button).\n          If you need more than 3 options, use the question tool instead.\n          IMPORTANT: Always call this tool last in your message, after all text parts.\n\n          Examples:\n          - buttons: [{\"label\":\"Yes, proceed\"}]\n          - buttons: [{\"label\":\"Approve\",\"color\":\"green\"}]\n          - buttons: [\n              {\"label\":\"Confirm\",\"color\":\"blue\"},\n              {\"label\":\"Cancel\",\"color\":\"white\"}\n            ]\n        "], ["\n          Show action buttons in the current Discord thread for quick confirmations.\n          Use this when the user can respond by clicking one of up to 3 buttons.\n          Prefer a single button whenever possible.\n          Default color is white (same visual style as permission deny button).\n          If you need more than 3 options, use the question tool instead.\n          IMPORTANT: Always call this tool last in your message, after all text parts.\n\n          Examples:\n          - buttons: [{\"label\":\"Yes, proceed\"}]\n          - buttons: [{\"label\":\"Approve\",\"color\":\"green\"}]\n          - buttons: [\n              {\"label\":\"Confirm\",\"color\":\"blue\"},\n              {\"label\":\"Cancel\",\"color\":\"white\"}\n            ]\n        "]))),
                        args: {
                            buttons: zod_1.z
                                .array(zod_1.z.object({
                                label: zod_1.z
                                    .string()
                                    .min(1)
                                    .max(80)
                                    .describe('Button label shown to the user (1-80 chars)'),
                                color: zod_1.z
                                    .enum(['white', 'blue', 'green', 'red'])
                                    .optional()
                                    .describe('Optional button color. white is default and preferred for most confirmations.'),
                            }))
                                .min(1)
                                .max(3)
                                .describe('Array of 1-3 action buttons. Prefer one button whenever possible.'),
                        },
                        execute: function (_a, context_1) {
                            return __awaiter(this, arguments, void 0, function (_b, context) {
                                var _c, getThreadIdBySessionId, createIpcRequest, getIpcRequestById, threadId, ipcRow, deadline, POLL_INTERVAL_MS, updated, parsed;
                                var buttons = _b.buttons;
                                return __generator(this, function (_d) {
                                    switch (_d.label) {
                                        case 0: return [4 /*yield*/, loadDatabaseModule()];
                                        case 1:
                                            _c = _d.sent(), getThreadIdBySessionId = _c.getThreadIdBySessionId, createIpcRequest = _c.createIpcRequest, getIpcRequestById = _c.getIpcRequestById;
                                            return [4 /*yield*/, getThreadIdBySessionId(context.sessionID)];
                                        case 2:
                                            threadId = _d.sent();
                                            if (!threadId) {
                                                return [2 /*return*/, 'Could not find thread for current session'];
                                            }
                                            return [4 /*yield*/, createIpcRequest({
                                                    type: 'action_buttons',
                                                    sessionId: context.sessionID,
                                                    threadId: threadId,
                                                    payload: JSON.stringify({
                                                        buttons: buttons,
                                                        directory: context.directory,
                                                    }),
                                                })];
                                        case 3:
                                            ipcRow = _d.sent();
                                            deadline = Date.now() + ACTION_BUTTON_TIMEOUT_MS;
                                            POLL_INTERVAL_MS = 200;
                                            _d.label = 4;
                                        case 4:
                                            if (!(Date.now() < deadline)) return [3 /*break*/, 7];
                                            return [4 /*yield*/, new Promise(function (resolve) {
                                                    setTimeout(resolve, POLL_INTERVAL_MS);
                                                })];
                                        case 5:
                                            _d.sent();
                                            return [4 /*yield*/, getIpcRequestById({ id: ipcRow.id })];
                                        case 6:
                                            updated = _d.sent();
                                            if (!updated || updated.status === 'cancelled') {
                                                return [2 /*return*/, 'Action button request was cancelled'];
                                            }
                                            if (updated.response) {
                                                parsed = JSON.parse(updated.response);
                                                if (parsed.error) {
                                                    return [2 /*return*/, "Action button request failed: ".concat(parsed.error)];
                                                }
                                                return [2 /*return*/, "Action button(s) shown: ".concat(buttons.map(function (button) { return button.label; }).join(', '))];
                                            }
                                            return [3 /*break*/, 4];
                                        case 7: return [2 /*return*/, 'Action button request timed out'];
                                    }
                                });
                            });
                        },
                    }),
                },
            }];
    });
}); };
exports.ipcToolsPlugin = ipcToolsPlugin;
var templateObject_1;
