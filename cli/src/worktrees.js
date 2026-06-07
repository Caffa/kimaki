"use strict";
// Worktree service and git helpers.
// Provides reusable, Discord-agnostic worktree creation/merge logic,
// submodule initialization, and git diff transfer utilities.
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
exports.execAsync = void 0;
exports.runDependencyInstall = runDependencyInstall;
exports.parseGitmodulesFileContent = parseGitmodulesFileContent;
exports.buildSubmoduleReferencePlan = buildSubmoduleReferencePlan;
exports.buildSubmoduleUpdateCommandArgs = buildSubmoduleUpdateCommandArgs;
exports.getManagedWorktreeDirectory = getManagedWorktreeDirectory;
exports.createWorktreeWithSubmodules = createWorktreeWithSubmodules;
exports.git = git;
exports.getDefaultBranch = getDefaultBranch;
exports.deleteWorktree = deleteWorktree;
exports.isDirty = isDirty;
exports.isGitRepositoryRoot = isGitRepositoryRoot;
exports.mergeWorktree = mergeWorktree;
exports.listBranchesByLastCommit = listBranchesByLastCommit;
exports.validateBranchRef = validateBranchRef;
exports.validateWorktreeDirectory = validateWorktreeDirectory;
exports.resolveSessionWorkingDirectory = resolveSessionWorkingDirectory;
exports.parseGitWorktreeListPorcelain = parseGitWorktreeListPorcelain;
exports.listGitWorktrees = listGitWorktrees;
var node_crypto_1 = require("node:crypto");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var errore = require("errore");
var config_js_1 = require("./config.js");
var exec_async_js_1 = require("./exec-async.js");
var logger_js_1 = require("./logger.js");
var exec_async_js_2 = require("./exec-async.js");
Object.defineProperty(exports, "execAsync", { enumerable: true, get: function () { return exec_async_js_2.execAsync; } });
var SUBMODULE_INIT_TIMEOUT_MS = 20 * 60000;
var INSTALL_TIMEOUT_MS = 60000;
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.WORKTREE);
var LOCKFILE_TO_INSTALL_COMMAND = [
    ['pnpm-lock.yaml', 'pnpm install'],
    ['bun.lock', 'bun install'],
    ['bun.lockb', 'bun install'],
    ['yarn.lock', 'yarn install'],
    ['package-lock.json', 'npm install'],
];
function detectInstallCommand(directory) {
    for (var _i = 0, LOCKFILE_TO_INSTALL_COMMAND_1 = LOCKFILE_TO_INSTALL_COMMAND; _i < LOCKFILE_TO_INSTALL_COMMAND_1.length; _i++) {
        var _a = LOCKFILE_TO_INSTALL_COMMAND_1[_i], lockfile = _a[0], command = _a[1];
        if (node_fs_1.default.existsSync(node_path_1.default.join(directory, lockfile))) {
            return command;
        }
    }
    return null;
}
/**
 * Run the detected package manager install in a worktree directory.
 * Non-fatal: returns Error on failure/timeout so callers can log and continue.
 * The 60s timeout kills the process if install hangs.
 */
function runDependencyInstall(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var installCommand, e_1;
        var directory = _b.directory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    installCommand = detectInstallCommand(directory);
                    if (!installCommand) {
                        return [2 /*return*/];
                    }
                    logger.log("Running \"".concat(installCommand, "\" in ").concat(directory, " (timeout=").concat(INSTALL_TIMEOUT_MS, "ms)"));
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, exec_async_js_1.execAsync)(installCommand, {
                            cwd: directory,
                            timeout: INSTALL_TIMEOUT_MS,
                        })];
                case 2:
                    _c.sent();
                    logger.log("Dependencies installed in ".concat(directory));
                    return [3 /*break*/, 4];
                case 3:
                    e_1 = _c.sent();
                    return [2 /*return*/, new Error("Install failed: ".concat(formatCommandError(e_1)), { cause: e_1 })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function formatCommandError(error) {
    var _a, _b;
    if (!(error instanceof Error)) {
        return String(error);
    }
    var commandError = error;
    var details = [commandError.message];
    if (commandError.cmd) {
        details.push("cmd=".concat(commandError.cmd));
    }
    if (commandError.signal) {
        details.push("signal=".concat(commandError.signal));
    }
    if (commandError.killed) {
        details.push('process=killed');
    }
    if ((_a = commandError.stderr) === null || _a === void 0 ? void 0 : _a.trim()) {
        details.push("stderr=".concat(commandError.stderr.trim()));
    }
    if ((_b = commandError.stdout) === null || _b === void 0 ? void 0 : _b.trim()) {
        details.push("stdout=".concat(commandError.stdout.trim()));
    }
    return details.join(' | ');
}
function parseGitmodulesFileContent(gitmodulesContent) {
    var lines = gitmodulesContent.split('\n');
    var configs = [];
    var currentName = null;
    var currentPath = null;
    var currentUrl = null;
    var flushCurrent = function () {
        if (!currentName) {
            return;
        }
        if (!currentPath) {
            return new Error("Submodule ".concat(currentName, " is missing path in .gitmodules"));
        }
        configs.push({
            name: currentName,
            path: currentPath,
            url: currentUrl,
        });
    };
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var rawLine = lines_1[_i];
        var line = rawLine.trim();
        if (!line || line.startsWith('#') || line.startsWith(';')) {
            continue;
        }
        var sectionMatch = line.match(/^\[submodule\s+"([^"]+)"\]$/);
        if (sectionMatch === null || sectionMatch === void 0 ? void 0 : sectionMatch[1]) {
            var flushError_1 = flushCurrent();
            if (flushError_1 instanceof Error) {
                return flushError_1;
            }
            currentName = sectionMatch[1];
            currentPath = null;
            currentUrl = null;
            continue;
        }
        if (!currentName) {
            continue;
        }
        var keyValueMatch = line.match(/^([^=\s]+)\s*=\s*(.*)$/);
        var key = keyValueMatch === null || keyValueMatch === void 0 ? void 0 : keyValueMatch[1];
        var value = keyValueMatch === null || keyValueMatch === void 0 ? void 0 : keyValueMatch[2];
        if (!key || value === undefined) {
            continue;
        }
        if (key === 'path') {
            currentPath = value;
            continue;
        }
        if (key === 'url') {
            currentUrl = value;
        }
    }
    var flushError = flushCurrent();
    if (flushError instanceof Error) {
        return flushError;
    }
    return configs;
}
function readSubmoduleConfigs(directory) {
    return __awaiter(this, void 0, void 0, function () {
        var gitmodulesPath, gitmodulesExists, gitmodulesContent, parsed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    gitmodulesPath = node_path_1.default.join(directory, '.gitmodules');
                    return [4 /*yield*/, node_fs_1.default.promises
                            .access(gitmodulesPath)
                            .then(function () {
                            return true;
                        })
                            .catch(function () {
                            return false;
                        })];
                case 1:
                    gitmodulesExists = _a.sent();
                    if (!gitmodulesExists) {
                        return [2 /*return*/, []];
                    }
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () { return node_fs_1.default.promises.readFile(gitmodulesPath, 'utf-8'); },
                            catch: function (e) {
                                return new Error("Failed to read ".concat(gitmodulesPath), {
                                    cause: e,
                                });
                            },
                        })];
                case 2:
                    gitmodulesContent = _a.sent();
                    if (gitmodulesContent instanceof Error) {
                        return [2 /*return*/, gitmodulesContent];
                    }
                    parsed = parseGitmodulesFileContent(gitmodulesContent);
                    if (parsed instanceof Error) {
                        return [2 /*return*/, new Error("Failed to parse ".concat(gitmodulesPath, ": ").concat(parsed.message), {
                                cause: parsed,
                            })];
                    }
                    return [2 /*return*/, parsed];
            }
        });
    });
}
function buildSubmoduleReferencePlan(_a) {
    var sourceDirectory = _a.sourceDirectory, submodulePaths = _a.submodulePaths, existingSourceSubmoduleDirectories = _a.existingSourceSubmoduleDirectories;
    return submodulePaths.map(function (submodulePath) {
        var sourceSubmoduleDirectory = node_path_1.default.resolve(sourceDirectory, submodulePath);
        if (existingSourceSubmoduleDirectories.has(sourceSubmoduleDirectory)) {
            return {
                path: submodulePath,
                referenceDirectory: sourceSubmoduleDirectory,
            };
        }
        return {
            path: submodulePath,
            referenceDirectory: null,
        };
    });
}
function buildGitCommand(args) {
    var quotedArgs = args.map(function (arg) {
        return JSON.stringify(arg);
    });
    return "git ".concat(quotedArgs.join(' '));
}
function buildSubmoduleUpdateCommandArgs(_a) {
    var submodulePath = _a.path, referenceDirectory = _a.referenceDirectory;
    if (referenceDirectory) {
        return [
            '-c',
            'protocol.file.allow=always',
            'submodule',
            'update',
            '--init',
            '--recursive',
            '--reference',
            referenceDirectory,
            '--',
            submodulePath,
        ];
    }
    return [
        '-c',
        'protocol.file.allow=always',
        'submodule',
        'update',
        '--init',
        '--recursive',
        '--',
        submodulePath,
    ];
}
function hasSubmoduleGitMetadata(directory) {
    return __awaiter(this, void 0, void 0, function () {
        var gitPath;
        return __generator(this, function (_a) {
            gitPath = node_path_1.default.join(directory, '.git');
            return [2 /*return*/, node_fs_1.default.promises
                    .access(gitPath)
                    .then(function () {
                    return true;
                })
                    .catch(function () {
                    return false;
                })];
        });
    });
}
function initializeSubmodulesWithLocalReferences(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var submoduleConfigs, sourceDirectories, sourceDirectoryChecks, existingSourceSubmoduleDirectories, submodulePlan, _loop_1, _i, submodulePlan_1, planItem;
        var _this = this;
        var sourceDirectory = _b.sourceDirectory, worktreeDirectory = _b.worktreeDirectory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, readSubmoduleConfigs(worktreeDirectory)];
                case 1:
                    submoduleConfigs = _c.sent();
                    if (submoduleConfigs instanceof Error) {
                        return [2 /*return*/, submoduleConfigs];
                    }
                    if (submoduleConfigs.length === 0) {
                        return [2 /*return*/];
                    }
                    sourceDirectories = submoduleConfigs.map(function (_a) {
                        var submodulePath = _a.path;
                        return node_path_1.default.resolve(sourceDirectory, submodulePath);
                    });
                    return [4 /*yield*/, Promise.all(sourceDirectories.map(function (sourceSubmoduleDirectory) { return __awaiter(_this, void 0, void 0, function () {
                            var exists;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, hasSubmoduleGitMetadata(sourceSubmoduleDirectory)];
                                    case 1:
                                        exists = _a.sent();
                                        return [2 /*return*/, { sourceSubmoduleDirectory: sourceSubmoduleDirectory, exists: exists }];
                                }
                            });
                        }); }))];
                case 2:
                    sourceDirectoryChecks = _c.sent();
                    existingSourceSubmoduleDirectories = new Set(sourceDirectoryChecks
                        .filter(function (_a) {
                        var exists = _a.exists;
                        return exists;
                    })
                        .map(function (_a) {
                        var sourceSubmoduleDirectory = _a.sourceSubmoduleDirectory;
                        return sourceSubmoduleDirectory;
                    }));
                    submodulePlan = buildSubmoduleReferencePlan({
                        sourceDirectory: sourceDirectory,
                        submodulePaths: submoduleConfigs.map(function (_a) {
                            var submodulePath = _a.path;
                            return submodulePath;
                        }),
                        existingSourceSubmoduleDirectories: existingSourceSubmoduleDirectories,
                    });
                    _loop_1 = function (planItem) {
                        var commandArgs, command, result;
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    commandArgs = buildSubmoduleUpdateCommandArgs(planItem);
                                    command = buildGitCommand(commandArgs);
                                    return [4 /*yield*/, errore.tryAsync({
                                            try: function () {
                                                return (0, exec_async_js_1.execAsync)(command, {
                                                    cwd: worktreeDirectory,
                                                    timeout: SUBMODULE_INIT_TIMEOUT_MS,
                                                });
                                            },
                                            catch: function (e) {
                                                return new Error("git ".concat(commandArgs.join(' '), " failed for ").concat(planItem.path, ": ").concat(formatCommandError(e)), { cause: e });
                                            },
                                        })];
                                case 1:
                                    result = _d.sent();
                                    if (result instanceof Error) {
                                        // Non-fatal: broken .gitmodules entries (e.g. path listed but not in tree)
                                        // should not block worktree creation. Log and continue with remaining submodules.
                                        logger.warn("Skipping submodule ".concat(planItem.path, ": ").concat(result.message));
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, submodulePlan_1 = submodulePlan;
                    _c.label = 3;
                case 3:
                    if (!(_i < submodulePlan_1.length)) return [3 /*break*/, 6];
                    planItem = submodulePlan_1[_i];
                    return [5 /*yield**/, _loop_1(planItem)];
                case 4:
                    _c.sent();
                    _c.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * Get submodule paths from .gitmodules file.
 * Returns empty array if no submodules or on error.
 */
function getSubmodulePaths(directory) {
    return __awaiter(this, void 0, void 0, function () {
        var submoduleConfigs;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, readSubmoduleConfigs(directory)];
                case 1:
                    submoduleConfigs = _a.sent();
                    if (submoduleConfigs instanceof Error) {
                        logger.warn("Failed reading submodules from ".concat(directory, ": ").concat(submoduleConfigs.message));
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/, submoduleConfigs.map(function (_a) {
                            var submodulePath = _a.path;
                            return submodulePath;
                        })];
            }
        });
    });
}
/**
 * Remove broken submodule stubs created by git worktree.
 * When git worktree add runs on a repo with submodules, it creates submodule
 * directories with .git files pointing to ../.git/worktrees/<name>/modules/<submodule>
 * but that path only has a config file, missing HEAD/objects/refs.
 * This causes git commands to fail with "fatal: not a git repository".
 */
function removeBrokenSubmoduleStubs(directory) {
    return __awaiter(this, void 0, void 0, function () {
        var submodulePaths, _i, submodulePaths_1, subPath, fullPath, gitFile, stat, content, match, gitdir, headFile, headExists, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, getSubmodulePaths(directory)];
                case 1:
                    submodulePaths = _b.sent();
                    _i = 0, submodulePaths_1 = submodulePaths;
                    _b.label = 2;
                case 2:
                    if (!(_i < submodulePaths_1.length)) return [3 /*break*/, 11];
                    subPath = submodulePaths_1[_i];
                    fullPath = node_path_1.default.join(directory, subPath);
                    gitFile = node_path_1.default.join(fullPath, '.git');
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 9, , 10]);
                    return [4 /*yield*/, node_fs_1.default.promises.stat(gitFile)];
                case 4:
                    stat = _b.sent();
                    if (!stat.isFile()) {
                        return [3 /*break*/, 10];
                    }
                    return [4 /*yield*/, node_fs_1.default.promises.readFile(gitFile, 'utf-8')];
                case 5:
                    content = _b.sent();
                    match = content.match(/^gitdir:\s*(.+)$/m);
                    if (!match || !match[1]) {
                        return [3 /*break*/, 10];
                    }
                    gitdir = node_path_1.default.resolve(fullPath, match[1].trim());
                    headFile = node_path_1.default.join(gitdir, 'HEAD');
                    return [4 /*yield*/, node_fs_1.default.promises
                            .access(headFile)
                            .then(function () {
                            return true;
                        })
                            .catch(function () {
                            return false;
                        })];
                case 6:
                    headExists = _b.sent();
                    if (!!headExists) return [3 /*break*/, 8];
                    logger.log("Removing broken submodule stub: ".concat(subPath));
                    return [4 /*yield*/, node_fs_1.default.promises.rm(fullPath, { recursive: true, force: true })];
                case 7:
                    _b.sent();
                    _b.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    _a = _b.sent();
                    return [3 /*break*/, 10];
                case 10:
                    _i++;
                    return [3 /*break*/, 2];
                case 11: return [2 /*return*/];
            }
        });
    });
}
function parseSubmoduleGitdir(gitFileContent) {
    var _a;
    var match = gitFileContent.match(/^gitdir:\s*(.+)$/m);
    var gitdir = (_a = match === null || match === void 0 ? void 0 : match[1]) === null || _a === void 0 ? void 0 : _a.trim();
    if (!gitdir) {
        return new Error('Missing gitdir pointer');
    }
    return gitdir;
}
function validateSubmodulePointers(directory) {
    return __awaiter(this, void 0, void 0, function () {
        var submodulePaths, validationIssues, submoduleStatusResult;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSubmodulePaths(directory)];
                case 1:
                    submodulePaths = _a.sent();
                    if (submodulePaths.length === 0) {
                        return [2 /*return*/];
                    }
                    validationIssues = [];
                    return [4 /*yield*/, Promise.all(submodulePaths.map(function (submodulePath) { return __awaiter(_this, void 0, void 0, function () {
                            var submoduleDir, submoduleGitFile, gitFileExists, gitFileContentResult, parsedGitdir, resolvedGitdir, headPath, headExists;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        submoduleDir = node_path_1.default.join(directory, submodulePath);
                                        submoduleGitFile = node_path_1.default.join(submoduleDir, '.git');
                                        return [4 /*yield*/, node_fs_1.default.promises
                                                .access(submoduleGitFile)
                                                .then(function () {
                                                return true;
                                            })
                                                .catch(function () {
                                                return false;
                                            })];
                                    case 1:
                                        gitFileExists = _a.sent();
                                        if (!gitFileExists) {
                                            validationIssues.push("".concat(submodulePath, ": missing .git file"));
                                            return [2 /*return*/];
                                        }
                                        return [4 /*yield*/, errore.tryAsync({
                                                try: function () { return node_fs_1.default.promises.readFile(submoduleGitFile, 'utf-8'); },
                                                catch: function (e) {
                                                    return new Error("Failed to read .git for ".concat(submodulePath), { cause: e });
                                                },
                                            })];
                                    case 2:
                                        gitFileContentResult = _a.sent();
                                        if (gitFileContentResult instanceof Error) {
                                            validationIssues.push("".concat(submodulePath, ": ").concat(gitFileContentResult.message));
                                            return [2 /*return*/];
                                        }
                                        parsedGitdir = parseSubmoduleGitdir(gitFileContentResult);
                                        if (parsedGitdir instanceof Error) {
                                            validationIssues.push("".concat(submodulePath, ": ").concat(parsedGitdir.message));
                                            return [2 /*return*/];
                                        }
                                        resolvedGitdir = node_path_1.default.resolve(submoduleDir, parsedGitdir);
                                        headPath = node_path_1.default.join(resolvedGitdir, 'HEAD');
                                        return [4 /*yield*/, node_fs_1.default.promises
                                                .access(headPath)
                                                .then(function () {
                                                return true;
                                            })
                                                .catch(function () {
                                                return false;
                                            })];
                                    case 3:
                                        headExists = _a.sent();
                                        if (!headExists) {
                                            validationIssues.push("".concat(submodulePath, ": gitdir missing HEAD (").concat(resolvedGitdir, ")"));
                                        }
                                        return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () {
                                return (0, exec_async_js_1.execAsync)('git submodule status --recursive', {
                                    cwd: directory,
                                    timeout: SUBMODULE_INIT_TIMEOUT_MS,
                                });
                            },
                            catch: function (e) {
                                return new Error('git submodule status --recursive failed', { cause: e });
                            },
                        })];
                case 3:
                    submoduleStatusResult = _a.sent();
                    if (submoduleStatusResult instanceof Error) {
                        validationIssues.push(submoduleStatusResult.message);
                    }
                    if (validationIssues.length === 0) {
                        return [2 /*return*/];
                    }
                    return [2 /*return*/, new Error("Submodule validation failed: ".concat(validationIssues.join('; ')))];
            }
        });
    });
}
function resolveDefaultWorktreeTarget(directory) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, 'HEAD'];
        });
    });
}
/**
 * Build the on-disk directory for a managed worktree.
 *
 * Layout: `<kimakiDataDir>/worktrees/<8charProjectHash>/<basename>`
 *
 * - Lives under the kimaki data dir instead of the long
 *   `~/.local/share/opencode/worktree/<40-char-hash>/<name>` path so folder
 *   names stay short and readable (agents tend to give up and reuse the old
 *   worktree when paths get absurdly long).
 * - The 8-char project hash keeps worktrees from different projects that
 *   happen to share a slug from colliding.
 * - Strips the `opencode/kimaki-` (or `opencode-kimaki-`) prefix from the
 *   folder name since it's redundant noise on disk. The git branch name
 *   itself still uses `opencode/kimaki-<slug>` so merge/cleanup logic is
 *   unchanged.
 */
function getManagedWorktreeDirectory(_a) {
    var directory = _a.directory, name = _a.name;
    var projectHash = node_crypto_1.default
        .createHash('sha1')
        .update(directory)
        .digest('hex')
        .slice(0, 8);
    var withoutPrefix = name
        .replace(/^opencode\/kimaki-/, '')
        .replaceAll('/', '-');
    return node_path_1.default.join((0, config_js_1.getDataDir)(), 'worktrees', projectHash, withoutPrefix);
}
/**
 * Create a worktree using git and initialize git submodules.
 * This wrapper ensures submodules are properly set up in new worktrees.
 */
function createWorktreeWithSubmodules(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var worktreeDir, targetRef, _c, createCommand, createResult, submoduleInitResult, submoduleValidationError, installResult;
        var directory = _b.directory, name = _b.name, baseBranch = _b.baseBranch, onProgress = _b.onProgress;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    worktreeDir = getManagedWorktreeDirectory({ directory: directory, name: name });
                    _c = baseBranch;
                    if (_c) return [3 /*break*/, 2];
                    return [4 /*yield*/, resolveDefaultWorktreeTarget(directory)];
                case 1:
                    _c = (_d.sent());
                    _d.label = 2;
                case 2:
                    targetRef = _c;
                    if (node_fs_1.default.existsSync(worktreeDir)) {
                        return [2 /*return*/, new Error("Worktree directory already exists: ".concat(worktreeDir))];
                    }
                    return [4 /*yield*/, node_fs_1.default.promises.mkdir(node_path_1.default.dirname(worktreeDir), { recursive: true })];
                case 3:
                    _d.sent();
                    createCommand = "git worktree add ".concat(JSON.stringify(worktreeDir), " -B ").concat(JSON.stringify(name), " ").concat(JSON.stringify(targetRef));
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () {
                                return (0, exec_async_js_1.execAsync)(createCommand, {
                                    cwd: directory,
                                    timeout: SUBMODULE_INIT_TIMEOUT_MS,
                                });
                            },
                            catch: function (e) {
                                return new Error("git worktree add failed: ".concat(formatCommandError(e)), {
                                    cause: e,
                                });
                            },
                        })];
                case 4:
                    createResult = _d.sent();
                    if (createResult instanceof Error) {
                        return [2 /*return*/, createResult];
                    }
                    // 2. Remove broken submodule stubs before init
                    // git worktree creates stub directories with .git files pointing to incomplete gitdirs
                    return [4 /*yield*/, removeBrokenSubmoduleStubs(worktreeDir)
                        // 4. Init submodules in new worktree.
                        // For each submodule we use git's built-in --reference mechanism when the
                        // source checkout already has that submodule cloned. This preserves commit
                        // pinning while allowing local-only submodule commits to resolve reliably.
                    ];
                case 5:
                    // 2. Remove broken submodule stubs before init
                    // git worktree creates stub directories with .git files pointing to incomplete gitdirs
                    _d.sent();
                    // 4. Init submodules in new worktree.
                    // For each submodule we use git's built-in --reference mechanism when the
                    // source checkout already has that submodule cloned. This preserves commit
                    // pinning while allowing local-only submodule commits to resolve reliably.
                    logger.log("Initializing submodules in ".concat(worktreeDir, " (timeout=").concat(SUBMODULE_INIT_TIMEOUT_MS, "ms)"));
                    return [4 /*yield*/, initializeSubmodulesWithLocalReferences({
                            sourceDirectory: directory,
                            worktreeDirectory: worktreeDir,
                        })];
                case 6:
                    submoduleInitResult = _d.sent();
                    if (submoduleInitResult instanceof Error) {
                        // Non-fatal: log and continue. The worktree itself is already created,
                        // only submodule init had issues (e.g. stale .gitmodules entries).
                        logger.error('Submodule initialization failed (non-fatal)', {
                            worktreeDir: worktreeDir,
                            timeoutMs: SUBMODULE_INIT_TIMEOUT_MS,
                            command: 'git submodule update --init --recursive [--reference ...]',
                            error: submoduleInitResult.message,
                        });
                    }
                    else {
                        logger.log("Submodules initialized in ".concat(worktreeDir));
                    }
                    return [4 /*yield*/, validateSubmodulePointers(worktreeDir)];
                case 7:
                    submoduleValidationError = _d.sent();
                    if (submoduleValidationError instanceof Error) {
                        logger.error('Submodule validation issues (non-fatal)', {
                            worktreeDir: worktreeDir,
                            error: submoduleValidationError.message,
                        });
                    }
                    // 5. Dependency install (non-fatal, 60s timeout).
                    // Runs the detected package manager install so workspace packages with
                    // `prepare` scripts get built (e.g. errore → dist/).
                    onProgress === null || onProgress === void 0 ? void 0 : onProgress('Installing dependencies...');
                    return [4 /*yield*/, runDependencyInstall({ directory: worktreeDir })];
                case 8:
                    installResult = _d.sent();
                    if (installResult instanceof Error) {
                        logger.error('Dependency install failed (non-fatal)', {
                            worktreeDir: worktreeDir,
                            error: installResult.message,
                        });
                    }
                    return [2 /*return*/, { directory: worktreeDir, branch: name }];
            }
        });
    });
}
// ─── Worktree merge ──────────────────────────────────────────────────────────
// Merge pipeline (preserves all worktree commits, no squash):
//   1. Reject if uncommitted changes exist
//   2. Rebase worktree commits onto target (default branch)
//   3. Fast-forward push to target via local git push
//   4. Switch to detached HEAD, delete branch
//
// Uses `git push <git-common-dir> HEAD:<target>` with
// `receive.denyCurrentBranch=updateInstead` to fast-forward the target
// WITHOUT checking it out in the main repo.
//
// Returns MergeWorktreeErrors | MergeSuccess. All errors are tagged via errore.
// - DirtyWorktreeError         → git untouched
// - NothingToMergeError        → git untouched
// - RebaseConflictError        → git left mid-rebase for AI/user resolution
// - RebaseError                → rebase not in progress; temp branch cleaned
// - NotFastForwardError        → source intact; no push
// - TargetDirtyWorktreeError   → target branch is checked out and dirty; no push
// - PushError                  → source rebased but target unchanged
// - GitCommandError            → catch-all for unexpected git failures
var errors_js_1 = require("./errors.js");
function git(dir, args, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, errore.tryAsync({
                        try: function () {
                            return (0, exec_async_js_1.execAsync)("git -C \"".concat(dir, "\" ").concat(args), opts ? { timeout: opts.timeout } : undefined);
                        },
                        catch: function (e) { return new errors_js_1.GitCommandError({ command: args, cause: e }); },
                    })];
                case 1:
                    result = _a.sent();
                    if (result instanceof Error) {
                        return [2 /*return*/, result];
                    }
                    return [2 /*return*/, result.stdout.trim()];
            }
        });
    });
}
function getDefaultBranch(repoDir, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var ref;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, git(repoDir, 'symbolic-ref refs/remotes/origin/HEAD', opts)];
                case 1:
                    ref = _a.sent();
                    if (ref instanceof Error) {
                        return [2 /*return*/, 'main'];
                    }
                    return [2 /*return*/, ref.replace(/^refs\/remotes\/origin\//, '') || 'main'];
            }
        });
    });
}
function deleteWorktree(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var removeResult, stderr, deleteBranchResult, pruneResult;
        var _c, _d;
        var projectDirectory = _b.projectDirectory, worktreeDirectory = _b.worktreeDirectory, worktreeName = _b.worktreeName;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, git(projectDirectory, "worktree remove ".concat(JSON.stringify(worktreeDirectory)), {
                        timeout: SUBMODULE_INIT_TIMEOUT_MS,
                    })
                    // git refuses to remove worktrees with submodule entries:
                    // "fatal: working trees containing submodules cannot be moved or removed"
                    // Retry with --force which bypasses this guard. This is safe because
                    // canDeleteWorktree already verified the worktree is clean and merged.
                ];
                case 1:
                    removeResult = _e.sent();
                    if (!(removeResult instanceof Error)) return [3 /*break*/, 3];
                    stderr = (_d = (_c = removeResult.cause) === null || _c === void 0 ? void 0 : _c.stderr) !== null && _d !== void 0 ? _d : '';
                    if (!stderr.includes('containing submodules')) return [3 /*break*/, 3];
                    return [4 /*yield*/, git(projectDirectory, "worktree remove --force ".concat(JSON.stringify(worktreeDirectory)), { timeout: SUBMODULE_INIT_TIMEOUT_MS })];
                case 2:
                    removeResult = _e.sent();
                    _e.label = 3;
                case 3:
                    if (removeResult instanceof Error) {
                        return [2 /*return*/, new Error("Failed to remove worktree ".concat(worktreeName || worktreeDirectory), {
                                cause: removeResult,
                            })];
                    }
                    if (!worktreeName) return [3 /*break*/, 5];
                    return [4 /*yield*/, git(projectDirectory, "branch -d ".concat(JSON.stringify(worktreeName)))];
                case 4:
                    deleteBranchResult = _e.sent();
                    if (deleteBranchResult instanceof Error) {
                        return [2 /*return*/, new Error("Failed to delete branch ".concat(worktreeName), {
                                cause: deleteBranchResult,
                            })];
                    }
                    _e.label = 5;
                case 5: return [4 /*yield*/, git(projectDirectory, 'worktree prune')];
                case 6:
                    pruneResult = _e.sent();
                    if (pruneResult instanceof Error) {
                        logger.warn("Failed to prune worktrees after deleting ".concat(worktreeName || worktreeDirectory));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function isDirty(dir, opts) {
    return __awaiter(this, void 0, void 0, function () {
        var status;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, git(dir, 'status --porcelain', opts)];
                case 1:
                    status = _a.sent();
                    if (status instanceof Error) {
                        return [2 /*return*/, false];
                    }
                    return [2 /*return*/, status.length > 0];
            }
        });
    });
}
function isGitRepositoryRoot(directory) {
    return __awaiter(this, void 0, void 0, function () {
        var topLevel;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, git(directory, 'rev-parse --show-toplevel')];
                case 1:
                    topLevel = _a.sent();
                    if (topLevel instanceof Error) {
                        return [2 /*return*/, false];
                    }
                    return [2 /*return*/, node_path_1.default.resolve(topLevel) === node_path_1.default.resolve(directory)];
            }
        });
    });
}
function getGitCommonDir(dir) {
    return __awaiter(this, void 0, void 0, function () {
        var commonDir;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, git(dir, 'rev-parse --git-common-dir')];
                case 1:
                    commonDir = _a.sent();
                    if (commonDir instanceof Error) {
                        return [2 /*return*/, commonDir];
                    }
                    if (node_path_1.default.isAbsolute(commonDir)) {
                        return [2 /*return*/, commonDir];
                    }
                    return [2 /*return*/, node_path_1.default.resolve(dir, commonDir)];
            }
        });
    });
}
function isAncestor(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var result;
        var dir = _b.dir, ref1 = _b.ref1, ref2 = _b.ref2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, git(dir, "merge-base --is-ancestor \"".concat(ref1, "\" \"").concat(ref2, "\""))];
                case 1:
                    result = _c.sent();
                    return [2 /*return*/, !(result instanceof Error)];
            }
        });
    });
}
function isRebasedOnto(dir, target) {
    return __awaiter(this, void 0, void 0, function () {
        var mergeBase, targetSha;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, git(dir, "merge-base HEAD \"".concat(target, "\""))];
                case 1:
                    mergeBase = _a.sent();
                    if (mergeBase instanceof Error) {
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, git(dir, "rev-parse \"".concat(target, "\""))];
                case 2:
                    targetSha = _a.sent();
                    if (targetSha instanceof Error) {
                        return [2 /*return*/, false];
                    }
                    return [2 /*return*/, mergeBase === targetSha];
            }
        });
    });
}
/**
 * Check if updateInstead would have to update a dirty checked-out target.
 * Git rejects local pushes to the current branch when that worktree is dirty,
 * even if the dirty files do not overlap with the incoming commits.
 */
function isCheckedOutTargetDirty(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var currentBranch;
        var targetDir = _b.targetDir, targetBranch = _b.targetBranch;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, git(targetDir, 'symbolic-ref --short HEAD')];
                case 1:
                    currentBranch = _c.sent();
                    if (currentBranch instanceof Error || currentBranch !== targetBranch) {
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, isDirty(targetDir)];
                case 2: return [2 /*return*/, _c.sent()];
            }
        });
    });
}
/**
 * Check if git is mid-rebase by looking for rebase-merge or rebase-apply dirs.
 */
function isRebaseInProgress(dir) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, _a, rebaseDir, gitPath, resolvedPath, exists;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _i = 0, _a = ['rebase-merge', 'rebase-apply'];
                    _b.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    rebaseDir = _a[_i];
                    return [4 /*yield*/, git(dir, "rev-parse --git-path ".concat(rebaseDir))];
                case 2:
                    gitPath = _b.sent();
                    if (gitPath instanceof Error) {
                        return [3 /*break*/, 4];
                    }
                    resolvedPath = node_path_1.default.isAbsolute(gitPath)
                        ? gitPath
                        : node_path_1.default.resolve(dir, gitPath);
                    return [4 /*yield*/, node_fs_1.default.promises
                            .access(resolvedPath)
                            .then(function () {
                            return true;
                        })
                            .catch(function () {
                            return false;
                        })];
                case 3:
                    exists = _b.sent();
                    if (exists) {
                        return [2 /*return*/, true];
                    }
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/, false];
            }
        });
    });
}
/**
 * Merge a worktree branch into the default branch by rebasing all commits
 * onto target, then fast-forward pushing. Preserves every worktree commit.
 * Returns MergeWorktreeErrors | MergeSuccess.
 */
function mergeWorktree(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var log, branchName, tempBranch, branchResult, createResult, defaultBranch, _c, cleanupTempBranch, alreadyRebased, mergeBaseResult, mergeBase, commitCountResult, commitCount, rebaseResult, targetIsDirty, gitCommonDir, pushResult, shortSha, detachResult, deleteBranchResult, deleteWorktreeBranchResult;
        var _this = this;
        var worktreeDir = _b.worktreeDir, mainRepoDir = _b.mainRepoDir, worktreeName = _b.worktreeName, targetBranch = _b.targetBranch, onProgress = _b.onProgress;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    log = function (msg) {
                        logger.log(msg);
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress(msg);
                    };
                    tempBranch = null;
                    return [4 /*yield*/, git(worktreeDir, 'symbolic-ref --short HEAD')];
                case 1:
                    branchResult = _d.sent();
                    if (!(branchResult instanceof Error)) return [3 /*break*/, 3];
                    tempBranch = "kimaki-merge-".concat(Date.now());
                    return [4 /*yield*/, git(worktreeDir, "checkout -b \"".concat(tempBranch, "\""))];
                case 2:
                    createResult = _d.sent();
                    if (createResult instanceof Error) {
                        return [2 /*return*/, createResult];
                    }
                    branchName = tempBranch;
                    return [3 /*break*/, 4];
                case 3:
                    branchName = branchResult || worktreeName;
                    _d.label = 4;
                case 4:
                    _c = targetBranch;
                    if (_c) return [3 /*break*/, 6];
                    return [4 /*yield*/, getDefaultBranch(mainRepoDir)];
                case 5:
                    _c = (_d.sent());
                    _d.label = 6;
                case 6:
                    defaultBranch = _c;
                    log("Merging ".concat(branchName, " into ").concat(defaultBranch));
                    cleanupTempBranch = function () { return __awaiter(_this, void 0, void 0, function () {
                        var detachResult, deleteTempBranchResult;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!tempBranch) {
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, git(worktreeDir, 'checkout --detach')];
                                case 1:
                                    detachResult = _a.sent();
                                    if (detachResult instanceof Error) {
                                        logger.warn("[MERGE CLEANUP] Failed to detach HEAD before deleting temp branch: ".concat(detachResult.message));
                                    }
                                    return [4 /*yield*/, git(worktreeDir, "branch -D \"".concat(tempBranch, "\""))];
                                case 2:
                                    deleteTempBranchResult = _a.sent();
                                    if (deleteTempBranchResult instanceof Error) {
                                        logger.warn("[MERGE CLEANUP] Failed to delete temp branch ".concat(tempBranch, ": ").concat(deleteTempBranchResult.message));
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); };
                    return [4 /*yield*/, isRebaseInProgress(worktreeDir)];
                case 7:
                    // ── Step 1: If a rebase is already paused mid-flight, surface it ──
                    // This happens when the user reruns /merge-worktree while the model is
                    // still resolving conflicts. With multi-commit rebases, each conflict
                    // leaves staged conflict markers (isDirty would say yes) AND merge-base
                    // may already equal target (isRebasedOnto would say yes), so neither
                    // of those checks is safe to run first. We must detect the in-progress
                    // rebase explicitly and route back to the AI-resolve flow.
                    if (_d.sent()) {
                        return [2 /*return*/, new errors_js_1.RebaseConflictError({ target: defaultBranch })];
                    }
                    return [4 /*yield*/, isDirty(worktreeDir)];
                case 8:
                    if (!_d.sent()) return [3 /*break*/, 10];
                    return [4 /*yield*/, cleanupTempBranch()];
                case 9:
                    _d.sent();
                    return [2 /*return*/, new errors_js_1.DirtyWorktreeError()];
                case 10: return [4 /*yield*/, isRebasedOnto(worktreeDir, defaultBranch)];
                case 11:
                    alreadyRebased = _d.sent();
                    return [4 /*yield*/, git(worktreeDir, "merge-base HEAD \"".concat(defaultBranch, "\""))];
                case 12:
                    mergeBaseResult = _d.sent();
                    mergeBase = mergeBaseResult instanceof Error ? defaultBranch : mergeBaseResult;
                    return [4 /*yield*/, git(worktreeDir, "rev-list --count \"".concat(mergeBase, "..HEAD\""))];
                case 13:
                    commitCountResult = _d.sent();
                    if (!(commitCountResult instanceof Error)) return [3 /*break*/, 15];
                    return [4 /*yield*/, cleanupTempBranch()];
                case 14:
                    _d.sent();
                    return [2 /*return*/, commitCountResult];
                case 15:
                    commitCount = parseInt(commitCountResult, 10);
                    if (!(commitCount === 0)) return [3 /*break*/, 17];
                    return [4 /*yield*/, cleanupTempBranch()];
                case 16:
                    _d.sent();
                    return [2 /*return*/, new errors_js_1.NothingToMergeError({ target: defaultBranch })];
                case 17:
                    if (!!alreadyRebased) return [3 /*break*/, 22];
                    // Rebase all worktree commits onto target, preserving each commit.
                    log(commitCount > 1
                        ? "Rebasing ".concat(commitCount, " commits onto ").concat(defaultBranch, "...")
                        : "Rebasing onto ".concat(defaultBranch, "..."));
                    return [4 /*yield*/, git(worktreeDir, "rebase \"".concat(defaultBranch, "\""), {
                            timeout: 60000,
                        })];
                case 18:
                    rebaseResult = _d.sent();
                    if (!(rebaseResult instanceof Error)) return [3 /*break*/, 21];
                    return [4 /*yield*/, isRebaseInProgress(worktreeDir)];
                case 19:
                    if (_d.sent()) {
                        return [2 /*return*/, new errors_js_1.RebaseConflictError({
                                target: defaultBranch,
                                cause: rebaseResult,
                            })];
                    }
                    return [4 /*yield*/, cleanupTempBranch()];
                case 20:
                    _d.sent();
                    return [2 /*return*/, new errors_js_1.RebaseError({ target: defaultBranch, cause: rebaseResult })];
                case 21: return [3 /*break*/, 23];
                case 22:
                    log('Already rebased onto target');
                    _d.label = 23;
                case 23: return [4 /*yield*/, isAncestor({ dir: worktreeDir, ref1: defaultBranch, ref2: 'HEAD' })];
                case 24:
                    if (!!(_d.sent())) return [3 /*break*/, 26];
                    return [4 /*yield*/, cleanupTempBranch()];
                case 25:
                    _d.sent();
                    return [2 /*return*/, new errors_js_1.NotFastForwardError({ target: defaultBranch })];
                case 26: return [4 /*yield*/, isCheckedOutTargetDirty({
                        targetDir: mainRepoDir,
                        targetBranch: defaultBranch,
                    })];
                case 27:
                    targetIsDirty = _d.sent();
                    if (!targetIsDirty) return [3 /*break*/, 29];
                    return [4 /*yield*/, cleanupTempBranch()];
                case 28:
                    _d.sent();
                    return [2 /*return*/, new errors_js_1.TargetDirtyWorktreeError({ target: defaultBranch })];
                case 29: return [4 /*yield*/, getGitCommonDir(worktreeDir)];
                case 30:
                    gitCommonDir = _d.sent();
                    if (!(gitCommonDir instanceof Error)) return [3 /*break*/, 32];
                    return [4 /*yield*/, cleanupTempBranch()];
                case 31:
                    _d.sent();
                    return [2 /*return*/, gitCommonDir];
                case 32:
                    log("Pushing to ".concat(defaultBranch, "..."));
                    return [4 /*yield*/, git(worktreeDir, "push --receive-pack=\"git -c receive.denyCurrentBranch=updateInstead receive-pack\" \"".concat(gitCommonDir, "\" \"HEAD:").concat(defaultBranch, "\""), { timeout: 30000 })];
                case 33:
                    pushResult = _d.sent();
                    if (!(pushResult instanceof Error)) return [3 /*break*/, 35];
                    return [4 /*yield*/, cleanupTempBranch()];
                case 34:
                    _d.sent();
                    return [2 /*return*/, new errors_js_1.PushError({ target: defaultBranch, cause: pushResult })];
                case 35: return [4 /*yield*/, git(worktreeDir, 'rev-parse --short HEAD')];
                case 36:
                    shortSha = _d.sent();
                    if (shortSha instanceof Error) {
                        // Push succeeded but can't get SHA -- non-fatal, use placeholder
                        logger.warn('Failed to get short SHA after push');
                    }
                    // ── Step 5: Clean up -- detach HEAD and delete branch ──
                    log('Cleaning up worktree...');
                    return [4 /*yield*/, git(worktreeDir, "checkout --detach \"".concat(defaultBranch, "\""))];
                case 37:
                    detachResult = _d.sent();
                    if (detachResult instanceof Error) {
                        logger.warn("[MERGE CLEANUP] Failed to detach worktree HEAD after push: ".concat(detachResult.message));
                    }
                    return [4 /*yield*/, git(worktreeDir, "branch -D \"".concat(branchName, "\""))];
                case 38:
                    deleteBranchResult = _d.sent();
                    if (deleteBranchResult instanceof Error) {
                        logger.warn("[MERGE CLEANUP] Failed to delete branch ".concat(branchName, ": ").concat(deleteBranchResult.message));
                    }
                    if (!(branchName !== worktreeName && worktreeName)) return [3 /*break*/, 40];
                    return [4 /*yield*/, git(worktreeDir, "branch -D \"".concat(worktreeName, "\""))];
                case 39:
                    deleteWorktreeBranchResult = _d.sent();
                    if (deleteWorktreeBranchResult instanceof Error) {
                        logger.warn("[MERGE CLEANUP] Failed to delete worktree branch ".concat(worktreeName, ": ").concat(deleteWorktreeBranchResult.message));
                    }
                    _d.label = 40;
                case 40: return [2 /*return*/, {
                        defaultBranch: defaultBranch,
                        branchName: worktreeName || branchName,
                        commitCount: commitCount,
                        shortSha: shortSha instanceof Error ? 'unknown' : shortSha,
                    }];
            }
        });
    });
}
/**
 * List branches sorted by most recent commit date.
 * Returns branch short names (e.g. "main", "origin/feature-x").
 * Filters by optional query string (case-insensitive substring match).
 * Limited to 25 results for Discord autocomplete.
 *
 * @param includeRemote - When true (default), includes remote tracking branches (`-a` flag).
 *   Set to false for merge targets where only local branches make sense.
 */
function listBranchesByLastCommit(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var branchFlag, result, lowerQuery;
        var directory = _b.directory, query = _b.query, _c = _b.includeRemote, includeRemote = _c === void 0 ? true : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    branchFlag = includeRemote ? '-a' : '';
                    return [4 /*yield*/, git(directory, "branch ".concat(branchFlag, " --sort=-committerdate --format=%(refname:short)"))];
                case 1:
                    result = _d.sent();
                    if (result instanceof Error) {
                        return [2 /*return*/, []];
                    }
                    lowerQuery = (query === null || query === void 0 ? void 0 : query.toLowerCase()) || '';
                    return [2 /*return*/, result
                            .split('\n')
                            .map(function (line) {
                            return line.trim();
                        })
                            .filter(function (name) {
                            if (!name) {
                                return false;
                            }
                            // Skip HEAD pointer entries like "origin/HEAD -> origin/main"
                            if (name.includes('->')) {
                                return false;
                            }
                            if (!lowerQuery) {
                                return true;
                            }
                            return name.toLowerCase().includes(lowerQuery);
                        })
                            .slice(0, 25)];
            }
        });
    });
}
/**
 * Validate that a branch name is safe for use in git commands.
 * Uses `git check-ref-format --branch` which rejects names with shell metacharacters,
 * double dots, trailing dots/locks, etc. Returns the normalized name or an Error.
 */
function validateBranchRef(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var result;
        var directory = _b.directory, ref = _b.ref;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, git(directory, "check-ref-format --branch ".concat(JSON.stringify(ref)))];
                case 1:
                    result = _c.sent();
                    if (result instanceof Error) {
                        return [2 /*return*/, new Error("Invalid branch name: ".concat(ref))];
                    }
                    return [2 /*return*/, result];
            }
        });
    });
}
/**
 * Validate that a directory is a git worktree of the given project.
 * Parses `git worktree list --porcelain` from the project directory and
 * checks that the candidate path appears as one of the listed worktrees.
 * Returns the resolved absolute path on success, or an Error on failure.
 */
function validateWorktreeDirectory(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var absoluteCandidate, result, worktreePaths;
        var projectDirectory = _b.projectDirectory, candidatePath = _b.candidatePath;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    absoluteCandidate = node_path_1.default.resolve(candidatePath);
                    if (!node_fs_1.default.existsSync(absoluteCandidate)) {
                        return [2 /*return*/, new Error("Directory does not exist: ".concat(absoluteCandidate))];
                    }
                    return [4 /*yield*/, git(projectDirectory, 'worktree list --porcelain')];
                case 1:
                    result = _c.sent();
                    if (result instanceof Error) {
                        return [2 /*return*/, new Error('Failed to list git worktrees', { cause: result })];
                    }
                    worktreePaths = result
                        .split('\n')
                        .filter(function (line) {
                        return line.startsWith('worktree ');
                    })
                        .map(function (line) {
                        return line.slice('worktree '.length);
                    });
                    if (!worktreePaths.includes(absoluteCandidate)) {
                        return [2 /*return*/, new Error("Directory is not a git worktree of ".concat(projectDirectory, ": ").concat(absoluteCandidate))];
                    }
                    return [2 /*return*/, absoluteCandidate];
            }
        });
    });
}
function isSameOrInsideDirectory(_a) {
    var parentDirectory = _a.parentDirectory, candidateDirectory = _a.candidateDirectory;
    var relativePath = node_path_1.default.relative(parentDirectory, candidateDirectory);
    return (relativePath === '' ||
        (!relativePath.startsWith('..') && !node_path_1.default.isAbsolute(relativePath)));
}
function resolveSessionWorkingDirectory(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var absoluteProjectDirectory, absoluteCandidate, stat, worktreeResult;
        var projectDirectory = _b.projectDirectory, candidatePath = _b.candidatePath;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    absoluteProjectDirectory = node_path_1.default.resolve(projectDirectory);
                    absoluteCandidate = node_path_1.default.resolve(candidatePath);
                    return [4 /*yield*/, node_fs_1.default.promises.stat(absoluteCandidate).catch(function (error) {
                            return new Error("Directory does not exist: ".concat(absoluteCandidate), {
                                cause: error,
                            });
                        })];
                case 1:
                    stat = _c.sent();
                    if (stat instanceof Error) {
                        return [2 /*return*/, stat];
                    }
                    if (!stat.isDirectory()) {
                        return [2 /*return*/, new Error("Path is not a directory: ".concat(absoluteCandidate))];
                    }
                    if (isSameOrInsideDirectory({
                        parentDirectory: absoluteProjectDirectory,
                        candidateDirectory: absoluteCandidate,
                    })) {
                        return [2 /*return*/, { kind: 'project', directory: absoluteCandidate }];
                    }
                    return [4 /*yield*/, validateWorktreeDirectory({
                            projectDirectory: absoluteProjectDirectory,
                            candidatePath: absoluteCandidate,
                        })];
                case 2:
                    worktreeResult = _c.sent();
                    if (worktreeResult instanceof Error) {
                        return [2 /*return*/, new Error("Working directory must be inside ".concat(absoluteProjectDirectory, " or a git worktree of it: ").concat(absoluteCandidate), { cause: worktreeResult })];
                    }
                    return [2 /*return*/, { kind: 'worktree', directory: worktreeResult }];
            }
        });
    });
}
function flushGitWorktreeEntry(current) {
    var _a, _b, _c, _d, _e;
    if (!current.directory) {
        return null;
    }
    return {
        directory: current.directory,
        branch: (_a = current.branch) !== null && _a !== void 0 ? _a : null,
        head: (_b = current.head) !== null && _b !== void 0 ? _b : '',
        detached: (_c = current.detached) !== null && _c !== void 0 ? _c : false,
        locked: (_d = current.locked) !== null && _d !== void 0 ? _d : false,
        prunable: (_e = current.prunable) !== null && _e !== void 0 ? _e : false,
    };
}
// Parse `git worktree list --porcelain` output into structured entries.
// Skips the first entry (the main checkout) since that's the project root.
function parseGitWorktreeListPorcelain(output) {
    var entries = [];
    var current = {};
    for (var _i = 0, _a = output.split('\n'); _i < _a.length; _i++) {
        var line = _a[_i];
        if (line.startsWith('worktree ')) {
            var flushed_1 = flushGitWorktreeEntry(current);
            if (flushed_1) {
                entries.push(flushed_1);
            }
            current = { directory: line.slice('worktree '.length) };
            continue;
        }
        if (line.startsWith('HEAD ')) {
            current.head = line.slice('HEAD '.length);
            continue;
        }
        if (line.startsWith('branch ')) {
            // "branch refs/heads/opencode/kimaki-foo" → "opencode/kimaki-foo"
            current.branch = line.slice('branch '.length).replace(/^refs\/heads\//, '');
            continue;
        }
        if (line === 'detached') {
            current.detached = true;
            continue;
        }
        // "locked" or "locked <reason>"
        if (line === 'locked' || line.startsWith('locked ')) {
            current.locked = true;
            continue;
        }
        if (line.startsWith('prunable')) {
            current.prunable = true;
            continue;
        }
    }
    // Flush last entry
    var flushed = flushGitWorktreeEntry(current);
    if (flushed) {
        entries.push(flushed);
    }
    // Skip the first entry — it's the main checkout (project root)
    return entries.slice(1);
}
// List all git worktrees for a project directory (excluding the main checkout).
// Returns Error on git failure, empty array if no worktrees exist.
function listGitWorktrees(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var result;
        var projectDirectory = _b.projectDirectory, timeout = _b.timeout;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, git(projectDirectory, 'worktree list --porcelain', {
                        timeout: timeout,
                    })];
                case 1:
                    result = _c.sent();
                    if (result instanceof Error) {
                        return [2 /*return*/, result];
                    }
                    return [2 /*return*/, parseGitWorktreeListPorcelain(result)];
            }
        });
    });
}
