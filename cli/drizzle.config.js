"use strict";
// Drizzle Kit config for Kimaki's local SQLite schema export.
Object.defineProperty(exports, "__esModule", { value: true });
var drizzle_kit_1 = require("drizzle-kit");
exports.default = (0, drizzle_kit_1.defineConfig)({
    schema: './src/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
});
