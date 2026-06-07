"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vite_plugin_1 = require("@cloudflare/vite-plugin");
var plugin_react_1 = require("@vitejs/plugin-react");
var vite_1 = require("spiceflow/vite");
var vite_2 = require("@tailwindcss/vite");
var vite_3 = require("vite");
exports.default = (0, vite_3.defineConfig)({
    clearScreen: false,
    plugins: [
        (0, plugin_react_1.default)(),
        (0, vite_1.spiceflowPlugin)({
            entry: './src/index.tsx',
        }),
        (0, vite_2.default)(),
        (0, vite_plugin_1.cloudflare)({
            viteEnvironment: {
                name: 'rsc',
                childEnvironments: ['ssr'],
            },
        }),
    ],
});
