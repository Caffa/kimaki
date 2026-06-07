"use strict";
// Tests for reusable worktree and submodule initialization helpers.
// Uses temporary local git repositories to validate submodule behavior end to end.
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
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var vitest_1 = require("vitest");
var worktrees_js_1 = require("./worktrees.js");
var errors_js_1 = require("./errors.js");
var new_worktree_js_1 = require("./commands/new-worktree.js");
var config_js_1 = require("./config.js");
var GIT_TIMEOUT_MS = 60000;
function git(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var command, result;
        var cwd = _b.cwd, args = _b.args;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    command = "git ".concat(args
                        .map(function (arg) {
                        return JSON.stringify(arg);
                    })
                        .join(' '));
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)(command, {
                            cwd: cwd,
                            timeout: GIT_TIMEOUT_MS,
                        })];
                case 1:
                    result = _c.sent();
                    return [2 /*return*/, result.stdout.trim()];
            }
        });
    });
}
function createTestRoot() {
    var tmpRoot = node_path_1.default.resolve(process.cwd(), 'tmp');
    node_fs_1.default.mkdirSync(tmpRoot, { recursive: true });
    return node_fs_1.default.mkdtempSync(node_path_1.default.join(tmpRoot, 'worktrees-test-'));
}
(0, vitest_1.describe)('worktrees', function () {
    (0, vitest_1.test)('parseGitmodulesFileContent parses paths and urls', function () {
        var parsed = (0, worktrees_js_1.parseGitmodulesFileContent)("\n[submodule \"errore\"]\n  path = errore\n  url = https://github.com/remorses/errore.git\n[submodule \"gateway-proxy\"]\n  path = gateway-proxy\n  url = https://github.com/remorses/gateway-proxy.git\n");
        (0, vitest_1.expect)(parsed).toMatchInlineSnapshot("\n      [\n        {\n          \"name\": \"errore\",\n          \"path\": \"errore\",\n          \"url\": \"https://github.com/remorses/errore.git\",\n        },\n        {\n          \"name\": \"gateway-proxy\",\n          \"path\": \"gateway-proxy\",\n          \"url\": \"https://github.com/remorses/gateway-proxy.git\",\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('buildSubmoduleReferencePlan uses local references when available', function () {
        var sourceDirectory = '/repo';
        var plan = (0, worktrees_js_1.buildSubmoduleReferencePlan)({
            sourceDirectory: sourceDirectory,
            submodulePaths: ['errore', 'gateway-proxy', 'traforo'],
            existingSourceSubmoduleDirectories: new Set([
                '/repo/errore',
                '/repo/gateway-proxy',
            ]),
        });
        (0, vitest_1.expect)(plan).toMatchInlineSnapshot("\n      [\n        {\n          \"path\": \"errore\",\n          \"referenceDirectory\": \"/repo/errore\",\n        },\n        {\n          \"path\": \"gateway-proxy\",\n          \"referenceDirectory\": \"/repo/gateway-proxy\",\n        },\n        {\n          \"path\": \"traforo\",\n          \"referenceDirectory\": null,\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('createWorktreeWithSubmodules resolves local-only submodule commits from local source checkout', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sandbox, submoduleRemote, submoduleLocal, parentRepo, worktreeName, createdWorktreeDirectory, localOnlySha, worktreeResult, worktreeSubmoduleSha;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sandbox = createTestRoot();
                    submoduleRemote = node_path_1.default.join(sandbox, 'errore-remote.git');
                    submoduleLocal = node_path_1.default.join(sandbox, 'errore-local');
                    parentRepo = node_path_1.default.join(sandbox, 'parent');
                    worktreeName = "opencode/kimaki-local-submodule-".concat(Date.now());
                    createdWorktreeDirectory = '';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 26, 29]);
                    node_fs_1.default.mkdirSync(parentRepo, { recursive: true });
                    return [4 /*yield*/, git({ cwd: sandbox, args: ['init', '--bare', '-b', 'main', submoduleRemote] })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: sandbox, args: ['clone', submoduleRemote, submoduleLocal] })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: submoduleLocal,
                            args: ['config', 'user.email', 'kimaki-tests@example.com'],
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: submoduleLocal,
                            args: ['config', 'user.name', 'Kimaki Tests'],
                        })];
                case 5:
                    _a.sent();
                    node_fs_1.default.writeFileSync(node_path_1.default.join(submoduleLocal, 'README.md'), 'v1\n', 'utf-8');
                    return [4 /*yield*/, git({ cwd: submoduleLocal, args: ['add', 'README.md'] })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: submoduleLocal, args: ['commit', '-m', 'v1'] })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: submoduleLocal, args: ['push', 'origin', 'HEAD:main'] })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['init', '-b', 'main'] })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: parentRepo,
                            args: ['config', 'user.email', 'kimaki-tests@example.com'],
                        })];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: parentRepo,
                            args: ['config', 'user.name', 'Kimaki Tests'],
                        })];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: parentRepo,
                            args: ['config', 'protocol.file.allow', 'always'],
                        })];
                case 12:
                    _a.sent();
                    node_fs_1.default.writeFileSync(node_path_1.default.join(parentRepo, 'README.md'), 'parent\n', 'utf-8');
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['add', 'README.md'] })];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['commit', '-m', 'init parent'] })];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: parentRepo,
                            args: [
                                '-c',
                                'protocol.file.allow=always',
                                'submodule',
                                'add',
                                submoduleRemote,
                                'errore',
                            ],
                        })];
                case 15:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['commit', '-am', 'add submodule at v1'] })];
                case 16:
                    _a.sent();
                    node_fs_1.default.writeFileSync(node_path_1.default.join(submoduleLocal, 'README.md'), 'v2-local-only\n', 'utf-8');
                    return [4 /*yield*/, git({ cwd: submoduleLocal, args: ['add', 'README.md'] })];
                case 17:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: submoduleLocal, args: ['commit', '-m', 'v2 local only'] })];
                case 18:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: submoduleLocal,
                            args: ['rev-parse', 'HEAD'],
                        })];
                case 19:
                    localOnlySha = _a.sent();
                    return [4 /*yield*/, git({
                            cwd: node_path_1.default.join(parentRepo, 'errore'),
                            args: ['fetch', submoduleLocal, localOnlySha],
                        })];
                case 20:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: node_path_1.default.join(parentRepo, 'errore'),
                            args: ['checkout', localOnlySha],
                        })];
                case 21:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: parentRepo,
                            args: ['add', 'errore'],
                        })];
                case 22:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: parentRepo,
                            args: ['commit', '-m', 'pin local-only submodule commit'],
                        })];
                case 23:
                    _a.sent();
                    return [4 /*yield*/, (0, worktrees_js_1.createWorktreeWithSubmodules)({
                            directory: parentRepo,
                            name: worktreeName,
                        })];
                case 24:
                    worktreeResult = _a.sent();
                    if (worktreeResult instanceof Error) {
                        throw worktreeResult;
                    }
                    createdWorktreeDirectory = worktreeResult.directory;
                    return [4 /*yield*/, git({
                            cwd: node_path_1.default.join(worktreeResult.directory, 'errore'),
                            args: ['rev-parse', 'HEAD'],
                        })];
                case 25:
                    worktreeSubmoduleSha = _a.sent();
                    (0, vitest_1.expect)({
                        localOnlyShaLength: localOnlySha.length,
                        worktreeSubmoduleShaLength: worktreeSubmoduleSha.length,
                        sameCommit: localOnlySha === worktreeSubmoduleSha,
                    }).toMatchInlineSnapshot("\n        {\n          \"localOnlyShaLength\": 40,\n          \"sameCommit\": true,\n          \"worktreeSubmoduleShaLength\": 40,\n        }\n      ");
                    return [3 /*break*/, 29];
                case 26:
                    if (!createdWorktreeDirectory) return [3 /*break*/, 28];
                    return [4 /*yield*/, git({
                            cwd: parentRepo,
                            args: ['worktree', 'remove', '--force', createdWorktreeDirectory],
                        }).catch(function () {
                            return '';
                        })];
                case 27:
                    _a.sent();
                    _a.label = 28;
                case 28:
                    node_fs_1.default.rmSync(sandbox, { recursive: true, force: true });
                    return [7 /*endfinally*/];
                case 29: return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('createWorktreeWithSubmodules uses current HEAD even when origin does not have the commit', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sandbox, parentRemote, parentLocal, worktreeName, createdWorktreeDirectory, localHeadSha, originHeadSha, worktreeResult, worktreeHeadSha;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sandbox = createTestRoot();
                    parentRemote = node_path_1.default.join(sandbox, 'parent-remote.git');
                    parentLocal = node_path_1.default.join(sandbox, 'parent-local');
                    worktreeName = "opencode/kimaki-local-head-".concat(Date.now());
                    createdWorktreeDirectory = '';
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 14, 17]);
                    return [4 /*yield*/, git({ cwd: sandbox, args: ['init', '--bare', '-b', 'main', parentRemote] })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: sandbox, args: ['clone', parentRemote, parentLocal] })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: parentLocal,
                            args: ['config', 'user.email', 'kimaki-tests@example.com'],
                        })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: parentLocal,
                            args: ['config', 'user.name', 'Kimaki Tests'],
                        })];
                case 5:
                    _a.sent();
                    node_fs_1.default.writeFileSync(node_path_1.default.join(parentLocal, 'README.md'), 'v1\n', 'utf-8');
                    return [4 /*yield*/, git({ cwd: parentLocal, args: ['add', 'README.md'] })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: parentLocal, args: ['commit', '-m', 'v1'] })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: parentLocal, args: ['push', 'origin', 'HEAD:main'] })];
                case 8:
                    _a.sent();
                    node_fs_1.default.writeFileSync(node_path_1.default.join(parentLocal, 'README.md'), 'v2-local-only\n', 'utf-8');
                    return [4 /*yield*/, git({ cwd: parentLocal, args: ['commit', '-am', 'v2 local only'] })];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: parentLocal,
                            args: ['rev-parse', 'HEAD'],
                        })];
                case 10:
                    localHeadSha = _a.sent();
                    return [4 /*yield*/, git({
                            cwd: parentLocal,
                            args: ['rev-parse', 'origin/main'],
                        })];
                case 11:
                    originHeadSha = _a.sent();
                    return [4 /*yield*/, (0, worktrees_js_1.createWorktreeWithSubmodules)({
                            directory: parentLocal,
                            name: worktreeName,
                        })];
                case 12:
                    worktreeResult = _a.sent();
                    if (worktreeResult instanceof Error) {
                        throw worktreeResult;
                    }
                    createdWorktreeDirectory = worktreeResult.directory;
                    return [4 /*yield*/, git({
                            cwd: createdWorktreeDirectory,
                            args: ['rev-parse', 'HEAD'],
                        })];
                case 13:
                    worktreeHeadSha = _a.sent();
                    (0, vitest_1.expect)({
                        localHeadShaLength: localHeadSha.length,
                        originHeadShaLength: originHeadSha.length,
                        worktreeHeadShaLength: worktreeHeadSha.length,
                        usesLocalOnlyHead: localHeadSha === worktreeHeadSha,
                        differsFromOrigin: localHeadSha !== originHeadSha,
                    }).toMatchInlineSnapshot("\n        {\n          \"differsFromOrigin\": true,\n          \"localHeadShaLength\": 40,\n          \"originHeadShaLength\": 40,\n          \"usesLocalOnlyHead\": true,\n          \"worktreeHeadShaLength\": 40,\n        }\n      ");
                    return [3 /*break*/, 17];
                case 14:
                    if (!createdWorktreeDirectory) return [3 /*break*/, 16];
                    return [4 /*yield*/, git({
                            cwd: parentLocal,
                            args: ['worktree', 'remove', '--force', createdWorktreeDirectory],
                        }).catch(function () {
                            return '';
                        })];
                case 15:
                    _a.sent();
                    _a.label = 16;
                case 16:
                    node_fs_1.default.rmSync(sandbox, { recursive: true, force: true });
                    return [7 /*endfinally*/];
                case 17: return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('mergeWorktree rejects dirty checked-out target before local push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sandbox, parentRepo, worktreeDir, result, _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    sandbox = createTestRoot();
                    parentRepo = node_path_1.default.join(sandbox, 'parent');
                    worktreeDir = node_path_1.default.join(sandbox, 'feature-worktree');
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, , 13, 14]);
                    node_fs_1.default.mkdirSync(parentRepo, { recursive: true });
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['init', '-b', 'main'] })];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['config', 'user.email', 'kimaki-tests@example.com'] })];
                case 3:
                    _d.sent();
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['config', 'user.name', 'Kimaki Tests'] })];
                case 4:
                    _d.sent();
                    node_fs_1.default.writeFileSync(node_path_1.default.join(parentRepo, 'README.md'), 'v1\n', 'utf-8');
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['add', 'README.md'] })];
                case 5:
                    _d.sent();
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['commit', '-m', 'init'] })];
                case 6:
                    _d.sent();
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['worktree', 'add', '-b', 'feature', worktreeDir] })];
                case 7:
                    _d.sent();
                    node_fs_1.default.writeFileSync(node_path_1.default.join(worktreeDir, 'feature.md'), 'feature\n', 'utf-8');
                    return [4 /*yield*/, git({ cwd: worktreeDir, args: ['add', 'feature.md'] })];
                case 8:
                    _d.sent();
                    return [4 /*yield*/, git({ cwd: worktreeDir, args: ['commit', '-m', 'feature'] })];
                case 9:
                    _d.sent();
                    node_fs_1.default.writeFileSync(node_path_1.default.join(parentRepo, 'README.md'), 'dirty main\n', 'utf-8');
                    return [4 /*yield*/, (0, worktrees_js_1.mergeWorktree)({
                            worktreeDir: worktreeDir,
                            mainRepoDir: parentRepo,
                            worktreeName: 'feature',
                            targetBranch: 'main',
                        })];
                case 10:
                    result = _d.sent();
                    (0, vitest_1.expect)(result).toBeInstanceOf(errors_js_1.TargetDirtyWorktreeError);
                    _b = vitest_1.expect;
                    return [4 /*yield*/, git({ cwd: parentRepo, args: ['rev-parse', 'main'] })];
                case 11:
                    _c = (_a = _b.apply(void 0, [_d.sent()]).not).toBe;
                    return [4 /*yield*/, git({ cwd: worktreeDir, args: ['rev-parse', 'HEAD'] })];
                case 12:
                    _c.apply(_a, [_d.sent()]);
                    return [3 /*break*/, 14];
                case 13:
                    node_fs_1.default.rmSync(sandbox, { recursive: true, force: true });
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('shortenWorktreeSlug leaves short slugs alone', function () {
        (0, vitest_1.expect)((0, new_worktree_js_1.shortenWorktreeSlug)('short-name')).toMatchInlineSnapshot("\"short-name\"");
        (0, vitest_1.expect)((0, new_worktree_js_1.shortenWorktreeSlug)('exactly-twenty-chars')).toMatchInlineSnapshot("\"exactly-twenty-chars\"");
    });
    (0, vitest_1.test)('shortenWorktreeSlug strips vowels from long slugs', function () {
        (0, vitest_1.expect)((0, new_worktree_js_1.shortenWorktreeSlug)('configurable-sidebar-width-by-component')).toMatchInlineSnapshot("\"cnfgrbl-sdbr-wdth-by-cmpnnt\"");
        (0, vitest_1.expect)((0, new_worktree_js_1.shortenWorktreeSlug)('add-dark-mode-toggle-to-settings-page')).toMatchInlineSnapshot("\"add-drk-md-tggl-t-sttngs-pg\"");
    });
    (0, vitest_1.test)('formatWorktreeName keeps user-provided slugs verbatim', function () {
        (0, vitest_1.expect)((0, new_worktree_js_1.formatWorktreeName)('Configurable sidebar width by component')).toMatchInlineSnapshot("\"opencode/kimaki-configurable-sidebar-width-by-component\"");
        (0, vitest_1.expect)((0, new_worktree_js_1.formatWorktreeName)('my-feature')).toMatchInlineSnapshot("\"opencode/kimaki-my-feature\"");
    });
    (0, vitest_1.test)('formatAutoWorktreeName compresses long auto-derived slugs', function () {
        (0, vitest_1.expect)((0, new_worktree_js_1.formatAutoWorktreeName)('Configurable sidebar width by component')).toMatchInlineSnapshot("\"opencode/kimaki-cnfgrbl-sdbr-wdth-by-cmpnnt\"");
        (0, vitest_1.expect)((0, new_worktree_js_1.formatAutoWorktreeName)('my-feature')).toMatchInlineSnapshot("\"opencode/kimaki-my-feature\"");
    });
    (0, vitest_1.test)('getManagedWorktreeDirectory writes under kimaki data dir and strips prefix', function () {
        var _a;
        var sandbox = createTestRoot();
        try {
            (0, config_js_1.setDataDir)(sandbox);
            var dir = (0, worktrees_js_1.getManagedWorktreeDirectory)({
                directory: '/Users/test/projects/my-app',
                name: 'opencode/kimaki-cnfgrbl-sdbr-wdth-by-cmpnnt',
            });
            // Must sit inside <dataDir>/worktrees/<8hash>/<basename>
            var rel = node_path_1.default.relative(sandbox, dir);
            var parts = rel.split(node_path_1.default.sep);
            (0, vitest_1.expect)({
                topLevel: parts[0],
                hashLength: (_a = parts[1]) === null || _a === void 0 ? void 0 : _a.length,
                basename: parts[2],
                partsCount: parts.length,
            }).toMatchInlineSnapshot("\n        {\n          \"basename\": \"cnfgrbl-sdbr-wdth-by-cmpnnt\",\n          \"hashLength\": 8,\n          \"partsCount\": 3,\n          \"topLevel\": \"worktrees\",\n        }\n      ");
        }
        finally {
            node_fs_1.default.rmSync(sandbox, { recursive: true, force: true });
        }
    });
    (0, vitest_1.test)('resolveSessionWorkingDirectory accepts the project root', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sandbox, projectDirectory, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sandbox = createTestRoot();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    projectDirectory = node_path_1.default.join(sandbox, 'project');
                    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
                    return [4 /*yield*/, (0, worktrees_js_1.resolveSessionWorkingDirectory)({
                            projectDirectory: projectDirectory,
                            candidatePath: projectDirectory,
                        })];
                case 2:
                    result = _a.sent();
                    if (result instanceof Error) {
                        throw result;
                    }
                    (0, vitest_1.expect)({
                        kind: result.kind,
                        relativeDirectory: node_path_1.default.relative(projectDirectory, result.directory),
                    }).toMatchInlineSnapshot("\n        {\n          \"kind\": \"project\",\n          \"relativeDirectory\": \"\",\n        }\n      ");
                    return [3 /*break*/, 4];
                case 3:
                    node_fs_1.default.rmSync(sandbox, { recursive: true, force: true });
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('resolveSessionWorkingDirectory accepts project subfolders', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sandbox, projectDirectory, subfolder, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sandbox = createTestRoot();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 3, 4]);
                    projectDirectory = node_path_1.default.join(sandbox, 'project');
                    subfolder = node_path_1.default.join(projectDirectory, 'restricted-task');
                    node_fs_1.default.mkdirSync(subfolder, { recursive: true });
                    return [4 /*yield*/, (0, worktrees_js_1.resolveSessionWorkingDirectory)({
                            projectDirectory: projectDirectory,
                            candidatePath: subfolder,
                        })];
                case 2:
                    result = _a.sent();
                    if (result instanceof Error) {
                        throw result;
                    }
                    (0, vitest_1.expect)({
                        kind: result.kind,
                        relativeDirectory: node_path_1.default.relative(projectDirectory, result.directory),
                    }).toMatchInlineSnapshot("\n        {\n          \"kind\": \"project\",\n          \"relativeDirectory\": \"restricted-task\",\n        }\n      ");
                    return [3 /*break*/, 4];
                case 3:
                    node_fs_1.default.rmSync(sandbox, { recursive: true, force: true });
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('resolveSessionWorkingDirectory accepts project worktrees', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sandbox, projectDirectory, worktreeDirectory, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sandbox = createTestRoot();
                    projectDirectory = node_path_1.default.join(sandbox, 'project');
                    worktreeDirectory = node_path_1.default.join(sandbox, 'feature-worktree');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 9, 10]);
                    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
                    return [4 /*yield*/, git({ cwd: projectDirectory, args: ['init', '-b', 'main'] })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: projectDirectory,
                            args: ['config', 'user.email', 'kimaki-tests@example.com'],
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: projectDirectory,
                            args: ['config', 'user.name', 'Kimaki Tests'],
                        })];
                case 4:
                    _a.sent();
                    node_fs_1.default.writeFileSync(node_path_1.default.join(projectDirectory, 'README.md'), 'project\n', 'utf-8');
                    return [4 /*yield*/, git({ cwd: projectDirectory, args: ['add', 'README.md'] })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, git({ cwd: projectDirectory, args: ['commit', '-m', 'init'] })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, git({
                            cwd: projectDirectory,
                            args: ['worktree', 'add', '-b', 'feature', worktreeDirectory],
                        })];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, worktrees_js_1.resolveSessionWorkingDirectory)({
                            projectDirectory: projectDirectory,
                            candidatePath: worktreeDirectory,
                        })];
                case 8:
                    result = _a.sent();
                    if (result instanceof Error) {
                        throw result;
                    }
                    (0, vitest_1.expect)({
                        kind: result.kind,
                        relativeDirectory: node_path_1.default.relative(sandbox, result.directory),
                    }).toMatchInlineSnapshot("\n        {\n          \"kind\": \"worktree\",\n          \"relativeDirectory\": \"feature-worktree\",\n        }\n      ");
                    return [3 /*break*/, 10];
                case 9:
                    node_fs_1.default.rmSync(sandbox, { recursive: true, force: true });
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); });
    (0, vitest_1.test)('resolveSessionWorkingDirectory rejects unrelated directories', function () { return __awaiter(void 0, void 0, void 0, function () {
        var sandbox, projectDirectory, siblingDirectory, result, message;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sandbox = createTestRoot();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, , 4, 5]);
                    projectDirectory = node_path_1.default.join(sandbox, 'project');
                    siblingDirectory = node_path_1.default.join(sandbox, 'other-project');
                    node_fs_1.default.mkdirSync(projectDirectory, { recursive: true });
                    node_fs_1.default.mkdirSync(siblingDirectory, { recursive: true });
                    return [4 /*yield*/, git({ cwd: projectDirectory, args: ['init', '-b', 'main'] })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, worktrees_js_1.resolveSessionWorkingDirectory)({
                            projectDirectory: projectDirectory,
                            candidatePath: siblingDirectory,
                        })];
                case 3:
                    result = _a.sent();
                    (0, vitest_1.expect)(result).toBeInstanceOf(Error);
                    message = result instanceof Error ? result.message : '';
                    (0, vitest_1.expect)(message
                        .replace(projectDirectory, '<project>')
                        .replace(siblingDirectory, '<sibling>')).toMatchInlineSnapshot("\"Working directory must be inside <project> or a git worktree of it: <sibling>\"");
                    return [3 /*break*/, 5];
                case 4:
                    node_fs_1.default.rmSync(sandbox, { recursive: true, force: true });
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); });
});
(0, vitest_1.describe)('parseGitWorktreeListPorcelain', function () {
    (0, vitest_1.test)('parses porcelain output, skips main worktree', function () {
        var output = [
            'worktree /Users/me/project',
            'HEAD abc123',
            'branch refs/heads/main',
            '',
            'worktree /Users/me/.local/share/opencode/worktree/hash/opencode-kimaki-feature',
            'HEAD def456',
            'branch refs/heads/opencode/kimaki-feature',
            '',
            'worktree /Users/me/project-manual-wt',
            'HEAD 789abc',
            'branch refs/heads/my-branch',
            '',
        ].join('\n');
        (0, vitest_1.expect)((0, worktrees_js_1.parseGitWorktreeListPorcelain)(output)).toMatchInlineSnapshot("\n      [\n        {\n          \"branch\": \"opencode/kimaki-feature\",\n          \"detached\": false,\n          \"directory\": \"/Users/me/.local/share/opencode/worktree/hash/opencode-kimaki-feature\",\n          \"head\": \"def456\",\n          \"locked\": false,\n          \"prunable\": false,\n        },\n        {\n          \"branch\": \"my-branch\",\n          \"detached\": false,\n          \"directory\": \"/Users/me/project-manual-wt\",\n          \"head\": \"789abc\",\n          \"locked\": false,\n          \"prunable\": false,\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('handles detached HEAD worktrees', function () {
        var output = [
            'worktree /Users/me/project',
            'HEAD abc123',
            'branch refs/heads/main',
            '',
            'worktree /Users/me/detached-wt',
            'HEAD deadbeef',
            'detached',
            '',
        ].join('\n');
        var result = (0, worktrees_js_1.parseGitWorktreeListPorcelain)(output);
        (0, vitest_1.expect)(result).toMatchInlineSnapshot("\n      [\n        {\n          \"branch\": null,\n          \"detached\": true,\n          \"directory\": \"/Users/me/detached-wt\",\n          \"head\": \"deadbeef\",\n          \"locked\": false,\n          \"prunable\": false,\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('parses locked and prunable flags', function () {
        var output = [
            'worktree /Users/me/project',
            'HEAD abc123',
            'branch refs/heads/main',
            '',
            'worktree /Users/me/locked-wt',
            'HEAD aaa111',
            'branch refs/heads/feature-locked',
            'locked portable disk',
            '',
            'worktree /Users/me/prunable-wt',
            'HEAD bbb222',
            'branch refs/heads/stale-branch',
            'prunable gitdir file points to non-existent location',
            '',
        ].join('\n');
        (0, vitest_1.expect)((0, worktrees_js_1.parseGitWorktreeListPorcelain)(output)).toMatchInlineSnapshot("\n      [\n        {\n          \"branch\": \"feature-locked\",\n          \"detached\": false,\n          \"directory\": \"/Users/me/locked-wt\",\n          \"head\": \"aaa111\",\n          \"locked\": true,\n          \"prunable\": false,\n        },\n        {\n          \"branch\": \"stale-branch\",\n          \"detached\": false,\n          \"directory\": \"/Users/me/prunable-wt\",\n          \"head\": \"bbb222\",\n          \"locked\": false,\n          \"prunable\": true,\n        },\n      ]\n    ");
    });
    (0, vitest_1.test)('returns empty array when only main worktree exists', function () {
        var output = [
            'worktree /Users/me/project',
            'HEAD abc123',
            'branch refs/heads/main',
            '',
        ].join('\n');
        (0, vitest_1.expect)((0, worktrees_js_1.parseGitWorktreeListPorcelain)(output)).toMatchInlineSnapshot("[]");
    });
});
