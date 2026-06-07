#!/usr/bin/env tsx
"use strict";
/**
 * Sync skills from remote repos into the packaged cli/skills/ copy.
 *
 * Reimplements the core discovery logic from the `skills` npm CLI
 * (vercel-labs/skills) without depending on it. The flow is:
 *   1. Shallow-clone each source repo to ./tmp/
 *   2. Recursively walk for SKILL.md files, parse frontmatter
 *   3. Copy discovered skill directories into cli/skills/<name>/
 *   4. Clean up temp dirs
 *
 * Usage:  pnpm sync-skills          (from cli/ or root)
 *         tsx scripts/sync-skills.ts (from cli/)
 */
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
var exec_async_js_1 = require("../src/exec-async.js");
// ─── Config ──────────────────────────────────────────────────────────────────
// Each entry is a GitHub URL. Subpath after /tree/branch/ narrows the search.
var SKILL_SOURCES = [
    'https://github.com/remorses/playwriter',
    'https://github.com/remorses/tuistory',
    'https://github.com/remorses/zele',
    'https://github.com/remorses/critique',
    'https://github.com/remorses/errore',
    'https://github.com/remorses/egaki',
    'https://github.com/remorses/termcast',
    'https://github.com/remorses/goke',
    'https://github.com/remorses/spiceflow',
    'https://github.com/remorses/lintcn',
    'https://github.com/remorses/usecomputer',
    // 'https://github.com/remorses/gitchamber',
    'https://github.com/remorses/profano',
    'https://github.com/remorses/sigillo',
];
// Directories to skip during recursive SKILL.md search
var SKIP_DIRS = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '__pycache__',
    '.next',
    '.turbo',
]);
// ─── Source parsing ──────────────────────────────────────────────────────────
function parseSource(input) {
    // GitHub URL with /tree/branch/path
    var treeWithPath = input.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/);
    if (treeWithPath) {
        var owner = treeWithPath[1], repo = treeWithPath[2], ref = treeWithPath[3], subpath = treeWithPath[4];
        return {
            url: "https://github.com/".concat(owner, "/").concat(repo, ".git"),
            ref: ref,
            subpath: subpath,
        };
    }
    // GitHub URL with /tree/branch
    var treeOnly = input.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)$/);
    if (treeOnly) {
        var owner = treeOnly[1], repo = treeOnly[2], ref = treeOnly[3];
        return { url: "https://github.com/".concat(owner, "/").concat(repo, ".git"), ref: ref };
    }
    // GitHub URL: https://github.com/owner/repo
    var repoUrl = input.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (repoUrl) {
        var owner = repoUrl[1], repo = repoUrl[2];
        var cleanRepo = repo.replace(/\.git$/, '');
        return { url: "https://github.com/".concat(owner, "/").concat(cleanRepo, ".git") };
    }
    // GitHub shorthand: owner/repo
    var shorthand = input.match(/^([^/]+)\/([^/]+)$/);
    if (shorthand) {
        var owner = shorthand[1], repo = shorthand[2];
        return { url: "https://github.com/".concat(owner, "/").concat(repo, ".git") };
    }
    // Fallback: treat as direct git URL
    return { url: input };
}
// ─── Frontmatter parsing ─────────────────────────────────────────────────────
// Minimal YAML frontmatter parser. Avoids gray-matter dependency.
// Only extracts `name` and `description` fields from the --- block.
function parseFrontmatter(content) {
    var match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) {
        return null;
    }
    var yaml = match[1];
    var nameMatch = yaml.match(/^name:\s*(.+)$/m);
    var descMatch = yaml.match(/^description:\s*(.+)$/m);
    if (!nameMatch || !descMatch) {
        return null;
    }
    // Strip surrounding quotes if present
    var strip = function (s) { return s.trim().replace(/^['"]|['"]$/g, ''); };
    return {
        name: strip(nameMatch[1]),
        description: strip(descMatch[1]),
    };
}
// ─── Skill discovery ─────────────────────────────────────────────────────────
function discoverSkills(baseDir, subpath) {
    return __awaiter(this, void 0, void 0, function () {
        var searchDir, skills, seenNames;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    searchDir = subpath ? node_path_1.default.join(baseDir, subpath) : baseDir;
                    skills = [];
                    seenNames = new Set();
                    return [4 /*yield*/, walkForSkills(searchDir, skills, seenNames, 0, 5, baseDir)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, skills];
            }
        });
    });
}
function walkForSkills(dir_1, skills_1, seenNames_1, depth_1) {
    return __awaiter(this, arguments, void 0, function (dir, skills, seenNames, depth, maxDepth, repoRoot) {
        var skillMdPath, content, meta, entries, subdirs, _i, subdirs_1, sub;
        if (maxDepth === void 0) { maxDepth = 5; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (depth > maxDepth) {
                        return [2 /*return*/];
                    }
                    skillMdPath = node_path_1.default.join(dir, 'SKILL.md');
                    if (node_fs_1.default.existsSync(skillMdPath)) {
                        content = node_fs_1.default.readFileSync(skillMdPath, 'utf-8');
                        meta = parseFrontmatter(content);
                        if (meta && !seenNames.has(meta.name)) {
                            skills.push({
                                name: meta.name,
                                description: meta.description,
                                dirPath: dir,
                            });
                            seenNames.add(meta.name);
                        }
                    }
                    try {
                        entries = node_fs_1.default.readdirSync(dir, { withFileTypes: true });
                    }
                    catch (_b) {
                        return [2 /*return*/];
                    }
                    subdirs = entries.filter(function (e) {
                        return e.isDirectory() && !SKIP_DIRS.has(e.name);
                    });
                    _i = 0, subdirs_1 = subdirs;
                    _a.label = 1;
                case 1:
                    if (!(_i < subdirs_1.length)) return [3 /*break*/, 4];
                    sub = subdirs_1[_i];
                    return [4 /*yield*/, walkForSkills(node_path_1.default.join(dir, sub.name), skills, seenNames, depth + 1, maxDepth, repoRoot)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// ─── Git clone ───────────────────────────────────────────────────────────────
function cloneRepo(parsed, tmpDir) {
    return __awaiter(this, void 0, void 0, function () {
        var targetDir, refArgs, cmd, maxAttempts, _loop_1, attempt, state_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    targetDir = node_path_1.default.join(tmpDir, "skill-".concat(Date.now(), "-").concat(Math.random().toString(36).slice(2, 8)));
                    refArgs = parsed.ref ? "--branch ".concat(parsed.ref) : '';
                    cmd = "git clone --depth 1 ".concat(refArgs, " ").concat(parsed.url, " ").concat(targetDir);
                    maxAttempts = 3;
                    _loop_1 = function (attempt) {
                        var error_1, retryDelayMs_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 4]);
                                    return [4 /*yield*/, (0, exec_async_js_1.execAsync)(cmd, { timeout: 60000 })];
                                case 1:
                                    _b.sent();
                                    return [2 /*return*/, { value: targetDir }];
                                case 2:
                                    error_1 = _b.sent();
                                    if (attempt === maxAttempts) {
                                        throw error_1;
                                    }
                                    if (node_fs_1.default.existsSync(targetDir)) {
                                        node_fs_1.default.rmSync(targetDir, { recursive: true, force: true });
                                    }
                                    retryDelayMs_1 = attempt * 1000;
                                    console.log("    clone attempt ".concat(attempt, " failed, retrying in ").concat(retryDelayMs_1, "ms..."));
                                    return [4 /*yield*/, new Promise(function (resolve) {
                                            setTimeout(resolve, retryDelayMs_1);
                                        })];
                                case 3:
                                    _b.sent();
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    attempt = 1;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= maxAttempts)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(attempt)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    attempt++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, targetDir];
            }
        });
    });
}
// ─── Copy skill directory ────────────────────────────────────────────────────
function sanitizeName(name) {
    return (name
        .toLowerCase()
        .replace(/[^a-z0-9._]+/g, '-')
        .replace(/^[.\-]+|[.\-]+$/g, '') || 'unnamed-skill');
}
function copySkill(skill, outputDir) {
    return __awaiter(this, void 0, void 0, function () {
        var dirName, targetDir;
        return __generator(this, function (_a) {
            dirName = sanitizeName(skill.name);
            targetDir = node_path_1.default.join(outputDir, dirName);
            // Remove existing if present (idempotent)
            if (node_fs_1.default.existsSync(targetDir)) {
                node_fs_1.default.rmSync(targetDir, { recursive: true, force: true });
            }
            // Only copy SKILL.md, never the full directory
            node_fs_1.default.mkdirSync(targetDir, { recursive: true });
            node_fs_1.default.copyFileSync(node_path_1.default.join(skill.dirPath, 'SKILL.md'), node_path_1.default.join(targetDir, 'SKILL.md'));
            return [2 /*return*/, targetDir];
        });
    });
}
// ─── Main ────────────────────────────────────────────────────────────────────
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var scriptDir, cliDir, repoRootDir, cliSkillsDir, tmpDir, totalSynced, _i, SKILL_SOURCES_1, source, parsed, cloneDir, skills, _a, skills_1, skill, cliDest, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    scriptDir = node_path_1.default.dirname(new URL(import.meta.url).pathname);
                    cliDir = node_path_1.default.resolve(scriptDir, '..');
                    repoRootDir = node_path_1.default.resolve(cliDir, '..');
                    cliSkillsDir = node_path_1.default.join(cliDir, 'skills');
                    tmpDir = node_path_1.default.join(repoRootDir, 'tmp');
                    // Ensure output and tmp dirs exist
                    node_fs_1.default.mkdirSync(cliSkillsDir, { recursive: true });
                    node_fs_1.default.mkdirSync(tmpDir, { recursive: true });
                    console.log("Syncing skills to ".concat(cliSkillsDir, "\n"));
                    totalSynced = 0;
                    _i = 0, SKILL_SOURCES_1 = SKILL_SOURCES;
                    _b.label = 1;
                case 1:
                    if (!(_i < SKILL_SOURCES_1.length)) return [3 /*break*/, 12];
                    source = SKILL_SOURCES_1[_i];
                    parsed = parseSource(source);
                    console.log("\n--- ".concat(source));
                    console.log("    clone: ".concat(parsed.url).concat(parsed.ref ? " @ ".concat(parsed.ref) : ''));
                    cloneDir = void 0;
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 9, 10, 11]);
                    return [4 /*yield*/, cloneRepo(parsed, tmpDir)];
                case 3:
                    cloneDir = _b.sent();
                    console.log("    cloned to ".concat(node_path_1.default.basename(cloneDir)));
                    return [4 /*yield*/, discoverSkills(cloneDir, parsed.subpath)];
                case 4:
                    skills = _b.sent();
                    if (skills.length === 0) {
                        console.log('    no skills found');
                        return [3 /*break*/, 11];
                    }
                    console.log("    found ".concat(skills.length, " skill(s):"));
                    _a = 0, skills_1 = skills;
                    _b.label = 5;
                case 5:
                    if (!(_a < skills_1.length)) return [3 /*break*/, 8];
                    skill = skills_1[_a];
                    return [4 /*yield*/, copySkill(skill, cliSkillsDir)];
                case 6:
                    cliDest = _b.sent();
                    console.log("      - ".concat(skill.name, " -> ").concat(node_path_1.default.relative(repoRootDir, cliDest)));
                    totalSynced++;
                    _b.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8: return [3 /*break*/, 11];
                case 9:
                    err_1 = _b.sent();
                    console.error("    error: ".concat(err_1 instanceof Error ? err_1.message : err_1));
                    return [3 /*break*/, 11];
                case 10:
                    // Clean up clone dir
                    if (cloneDir && node_fs_1.default.existsSync(cloneDir)) {
                        node_fs_1.default.rmSync(cloneDir, { recursive: true, force: true });
                    }
                    return [7 /*endfinally*/];
                case 11:
                    _i++;
                    return [3 /*break*/, 1];
                case 12:
                    console.log("\nDone. Synced ".concat(totalSynced, " skill(s)."));
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(function (err) {
    console.error('Fatal error:', err);
    process.exit(1);
});
