"use strict";
// Tests for /add-dir permission helpers.
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var node_fs_1 = require("node:fs");
var node_os_1 = require("node:os");
var node_path_1 = require("node:path");
var add_dir_js_1 = require("./add-dir.js");
var opencode_js_1 = require("../opencode.js");
(0, vitest_1.describe)('resolveDirectoryPermissionPattern', function () {
    (0, vitest_1.test)('resolves relative directories against the working directory', function () {
        var root = node_path_1.default.resolve(process.cwd(), 'tmp', 'add-dir-test');
        var nested = node_path_1.default.join(root, 'nested');
        node_fs_1.default.mkdirSync(nested, { recursive: true });
        var result = (0, add_dir_js_1.resolveDirectoryPermissionPattern)({
            input: './nested',
            workingDirectory: root,
        });
        (0, vitest_1.expect)(result).toBe(nested.replaceAll('\\', '/'));
    });
    (0, vitest_1.test)('supports allowing every directory with *', function () {
        (0, vitest_1.expect)((0, add_dir_js_1.resolveDirectoryPermissionPattern)({
            input: ' * ',
            workingDirectory: '/repo',
        })).toBe('*');
        (0, vitest_1.expect)((0, add_dir_js_1.buildAddDirPermissionRules)({
            resolvedPattern: '*',
        })).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"allow\",\n          \"pattern\": \"*\",\n          \"permission\": \"external_directory\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('builds allow rules for a specific directory', function () {
        (0, vitest_1.expect)((0, add_dir_js_1.buildAddDirPermissionRules)({
            resolvedPattern: '/repo/extra',
        })).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"allow\",\n          \"pattern\": \"/repo/extra\",\n          \"permission\": \"external_directory\",\n        },\n        {\n          \"action\": \"allow\",\n          \"pattern\": \"/repo/extra/*\",\n          \"permission\": \"external_directory\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('builds deny rules for a specific directory', function () {
        (0, vitest_1.expect)((0, opencode_js_1.buildExternalDirectoryPermissionRules)({
            resolvedPattern: '/repo',
            action: 'deny',
        })).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"/repo\",\n          \"permission\": \"external_directory\",\n        },\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"/repo/*\",\n          \"permission\": \"external_directory\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('worktree sessions deny the original checkout last', function () {
        (0, vitest_1.expect)((0, opencode_js_1.buildSessionPermissions)({
            directory: '/Users/me/.kimaki/worktrees/hash/feature',
            originalRepoDirectory: '/Users/me/project',
        }).slice(-2)).toMatchInlineSnapshot("\n      [\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"/Users/me/project\",\n          \"permission\": \"external_directory\",\n        },\n        {\n          \"action\": \"deny\",\n          \"pattern\": \"/Users/me/project/*\",\n          \"permission\": \"external_directory\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('pre-allows common toolchain caches under home with ~ patterns', function () {
        var home = node_os_1.default.homedir().replaceAll('\\', '/');
        (0, vitest_1.expect)((0, opencode_js_1.buildSessionPermissions)({
            directory: '/Users/me/project',
        }).filter(function (rule) {
            return [
                "".concat(home, "/.cache/zig"),
                "".concat(home, "/.cargo"),
                "".concat(home, "/.cache/go-build"),
                "".concat(home, "/go/pkg"),
            ].includes(rule.pattern);
        })).toEqual([
            {
                permission: 'external_directory',
                pattern: "".concat(home, "/.cache/zig"),
                action: 'allow',
            },
            {
                permission: 'external_directory',
                pattern: "".concat(home, "/.cargo"),
                action: 'allow',
            },
            {
                permission: 'external_directory',
                pattern: "".concat(home, "/.cache/go-build"),
                action: 'allow',
            },
            {
                permission: 'external_directory',
                pattern: "".concat(home, "/go/pkg"),
                action: 'allow',
            },
        ]);
    });
});
