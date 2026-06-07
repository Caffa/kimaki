"use strict";
// Minimal tool definition helper used by Kimaki.
// This replaces the Vercel AI SDK `tool()` helper so Kimaki can define typed
// tools (Zod input schema + execute) without depending on the full `ai` package.
Object.defineProperty(exports, "__esModule", { value: true });
exports.tool = tool;
function tool(definition) {
    return definition;
}
