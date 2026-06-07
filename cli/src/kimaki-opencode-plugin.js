"use strict";
// OpenCode plugin entry point for Kimaki Discord bot.
// Each export is treated as a separate plugin by OpenCode's plugin loader.
// CRITICAL: never export utility functions from this file — only plugin
// initializer functions. OpenCode calls every export as a plugin.
//
// Plugins are split into focused modules:
// - ipc-tools-plugin: file upload + action buttons (IPC-based Discord tools)
// - context-awareness-plugin: branch, pwd, memory reminder, onboarding tutorial
// - memory-overview-plugin: frozen MEMORY.md heading overview per session
// - opencode-interrupt-plugin: interrupt queued messages at step boundaries
// - subagent-rate-limit-plugin: aborts only task subagents after rate limits
// - kitty-graphics-plugin: extract Kitty Graphics Protocol images from bash output
Object.defineProperty(exports, "__esModule", { value: true });
exports.injectionGuard = exports.kittyGraphicsPlugin = exports.subagentRateLimitPlugin = exports.imageOptimizerPlugin = exports.anthropicAuthPlugin = exports.interruptOpencodeSessionOnUserMessage = exports.memoryOverviewPlugin = exports.contextAwarenessPlugin = exports.ipcToolsPlugin = void 0;
var ipc_tools_plugin_js_1 = require("./ipc-tools-plugin.js");
Object.defineProperty(exports, "ipcToolsPlugin", { enumerable: true, get: function () { return ipc_tools_plugin_js_1.ipcToolsPlugin; } });
var context_awareness_plugin_js_1 = require("./context-awareness-plugin.js");
Object.defineProperty(exports, "contextAwarenessPlugin", { enumerable: true, get: function () { return context_awareness_plugin_js_1.contextAwarenessPlugin; } });
var memory_overview_plugin_js_1 = require("./memory-overview-plugin.js");
Object.defineProperty(exports, "memoryOverviewPlugin", { enumerable: true, get: function () { return memory_overview_plugin_js_1.memoryOverviewPlugin; } });
var opencode_interrupt_plugin_js_1 = require("./opencode-interrupt-plugin.js");
Object.defineProperty(exports, "interruptOpencodeSessionOnUserMessage", { enumerable: true, get: function () { return opencode_interrupt_plugin_js_1.interruptOpencodeSessionOnUserMessage; } });
var anthropic_auth_plugin_js_1 = require("./anthropic-auth-plugin.js");
Object.defineProperty(exports, "anthropicAuthPlugin", { enumerable: true, get: function () { return anthropic_auth_plugin_js_1.anthropicAuthPlugin; } });
var image_optimizer_plugin_js_1 = require("./image-optimizer-plugin.js");
Object.defineProperty(exports, "imageOptimizerPlugin", { enumerable: true, get: function () { return image_optimizer_plugin_js_1.imageOptimizerPlugin; } });
var subagent_rate_limit_plugin_js_1 = require("./subagent-rate-limit-plugin.js");
Object.defineProperty(exports, "subagentRateLimitPlugin", { enumerable: true, get: function () { return subagent_rate_limit_plugin_js_1.subagentRateLimitPlugin; } });
var kitty_graphics_agent_1 = require("kitty-graphics-agent");
Object.defineProperty(exports, "kittyGraphicsPlugin", { enumerable: true, get: function () { return kitty_graphics_agent_1.kittyGraphicsPlugin; } });
var opencode_injection_guard_1 = require("opencode-injection-guard");
Object.defineProperty(exports, "injectionGuard", { enumerable: true, get: function () { return opencode_injection_guard_1.injectionGuardInternal; } });
