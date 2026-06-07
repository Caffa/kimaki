"use strict";
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
// Upgrade and worktree maintenance terminal commands.
var goke_1 = require("goke");
var node_path_1 = require("node:path");
var node_child_process_1 = require("node:child_process");
var logger_js_1 = require("../logger.js");
var worktrees_js_1 = require("../worktrees.js");
var upgrade_js_1 = require("../upgrade.js");
var cli_runner_js_1 = require("../cli-runner.js");
var cliLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CLI);
var cli = (0, goke_1.goke)();
cli
    .command('upgrade', 'Upgrade kimaki to the latest version and restart the running bot')
    .option('--skip-restart', 'Only upgrade, do not restart the running bot')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var current, newVersion, child, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                current = (0, upgrade_js_1.getCurrentVersion)();
                cliLogger.log("Current version: v".concat(current));
                return [4 /*yield*/, (0, upgrade_js_1.upgrade)()];
            case 1:
                newVersion = _a.sent();
                if (!newVersion) {
                    cliLogger.log('Already on latest version');
                    process.exit(0);
                }
                cliLogger.log("Upgraded to v".concat(newVersion));
                if (options.skipRestart) {
                    process.exit(0);
                }
                child = (0, node_child_process_1.spawn)('kimaki', [], {
                    shell: true,
                    stdio: 'ignore',
                    detached: true,
                });
                child.unref();
                cliLogger.log('Restarting bot with new version...');
                process.exit(0);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                cliLogger.error('Upgrade failed:', error_1 instanceof Error ? error_1.stack : String(error_1));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
cli
    .command('worktree merge', 'Merge worktree branch into default branch using worktrunk-style pipeline')
    .option('-d, --directory <path>', 'Worktree directory (defaults to cwd)')
    .option('-m, --main-repo <path>', 'Main repository directory (auto-detected from worktree)')
    .option('-n, --name <name>', 'Worktree/branch name (auto-detected from branch)')
    .action(function (options) { return __awaiter(void 0, void 0, void 0, function () {
    var mergeWorktree, worktreeDir, mainRepoDir, stdout, firstLine, _a, commonDir, resolved, worktreeName, stdout, _b, RebaseConflictError, result, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 13, , 14]);
                return [4 /*yield*/, Promise.resolve().then(function () { return require('../worktrees.js'); })];
            case 1:
                mergeWorktree = (_c.sent()).mergeWorktree;
                worktreeDir = node_path_1.default.resolve(options.directory || '.');
                mainRepoDir = options.mainRepo;
                if (!!mainRepoDir) return [3 /*break*/, 6];
                _c.label = 2;
            case 2:
                _c.trys.push([2, 4, , 6]);
                return [4 /*yield*/, (0, worktrees_js_1.execAsync)("git -C \"".concat(worktreeDir, "\" worktree list --porcelain"))];
            case 3:
                stdout = (_c.sent()).stdout;
                firstLine = stdout.split('\n')[0] || '';
                // Format: "worktree /path/to/main"
                mainRepoDir = firstLine.replace(/^worktree\s+/, '').trim();
                return [3 /*break*/, 6];
            case 4:
                _a = _c.sent();
                return [4 /*yield*/, (0, worktrees_js_1.execAsync)("git -C \"".concat(worktreeDir, "\" rev-parse --git-common-dir"))];
            case 5:
                commonDir = (_c.sent()).stdout;
                resolved = node_path_1.default.isAbsolute(commonDir.trim())
                    ? commonDir.trim()
                    : node_path_1.default.resolve(worktreeDir, commonDir.trim());
                mainRepoDir = node_path_1.default.dirname(resolved);
                return [3 /*break*/, 6];
            case 6:
                worktreeName = options.name;
                if (!!worktreeName) return [3 /*break*/, 10];
                _c.label = 7;
            case 7:
                _c.trys.push([7, 9, , 10]);
                return [4 /*yield*/, (0, worktrees_js_1.execAsync)("git -C \"".concat(worktreeDir, "\" symbolic-ref --short HEAD"))];
            case 8:
                stdout = (_c.sent()).stdout;
                worktreeName = stdout.trim();
                return [3 /*break*/, 10];
            case 9:
                _b = _c.sent();
                worktreeName = node_path_1.default.basename(worktreeDir);
                return [3 /*break*/, 10];
            case 10:
                cliLogger.log("Worktree: ".concat(worktreeDir));
                cliLogger.log("Main repo: ".concat(mainRepoDir));
                cliLogger.log("Branch: ".concat(worktreeName));
                return [4 /*yield*/, Promise.resolve().then(function () { return require('../errors.js'); })];
            case 11:
                RebaseConflictError = (_c.sent()).RebaseConflictError;
                return [4 /*yield*/, mergeWorktree({
                        worktreeDir: worktreeDir,
                        mainRepoDir: mainRepoDir,
                        worktreeName: worktreeName,
                        onProgress: function (msg) {
                            cliLogger.log(msg);
                        },
                    })];
            case 12:
                result = _c.sent();
                if (result instanceof Error) {
                    cliLogger.error("Merge failed: ".concat(result.message));
                    if (result instanceof RebaseConflictError) {
                        cliLogger.log('Resolve the rebase conflicts, then run this command again.');
                    }
                    process.exit(1);
                }
                cliLogger.log("Merged ".concat(result.branchName, " into ").concat(result.defaultBranch, " @ ").concat(result.shortSha, " (").concat(result.commitCount, " commit").concat(result.commitCount === 1 ? '' : 's', ")"));
                process.exit(0);
                return [3 /*break*/, 14];
            case 13:
                error_2 = _c.sent();
                cliLogger.error('Merge failed:', error_2 instanceof Error ? error_2.stack : String(error_2));
                process.exit(cli_runner_js_1.EXIT_NO_RESTART);
                return [3 /*break*/, 14];
            case 14: return [2 /*return*/];
        }
    });
}); });
exports.default = cli;
