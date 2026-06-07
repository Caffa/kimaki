"use strict";
// Shared utilities for invoking the critique CLI and parsing its JSON output.
// Used by /diff command and footer diff link uploads.
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
exports.parseCritiqueOutput = parseCritiqueOutput;
exports.uploadGitDiffViaCritique = uploadGitDiffViaCritique;
exports.uploadPatchViaCritique = uploadPatchViaCritique;
var worktrees_js_1 = require("./worktrees.js");
var logger_js_1 = require("./logger.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.DIFF);
var CRITIQUE_TIMEOUT_MS = 30000;
/**
 * Shell-quote a string by wrapping in single quotes and escaping embedded
 * single quotes. Prevents injection when interpolating into shell commands.
 */
function shellQuote(s) {
    return "'".concat(s.replace(/'/g, "'\\''"), "'");
}
/**
 * Parse critique --json output. Critique prints progress to stderr and JSON
 * to stdout. The JSON line contains { url, id } on success or { error } on
 * failure. We scan all lines for the first valid JSON object with a url or
 * error field, falling back to searching for a critique.work URL in the raw
 * output.
 */
function parseCritiqueOutput(output) {
    var lines = output.trim().split('\n');
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        if (!line.startsWith('{')) {
            continue;
        }
        try {
            var parsed = JSON.parse(line);
            if (parsed.error) {
                return { error: parsed.error };
            }
            if (parsed.url && parsed.id) {
                return { url: parsed.url, id: parsed.id };
            }
        }
        catch (_a) {
            // not valid JSON, try next line
        }
    }
    // Fallback: try to find a URL in the raw output
    var urlMatch = output.match(/https?:\/\/critique\.work\/[^\s]+/);
    if (urlMatch) {
        var url = urlMatch[0];
        // Extract ID from URL path: /v/{id}
        var idMatch = url.match(/\/v\/([a-f0-9]+)/);
        var id = idMatch === null || idMatch === void 0 ? void 0 : idMatch[1];
        if (id) {
            return { url: url, id: id };
        }
        // URL without parseable id — return as error so callers don't build
        // broken OG image URLs from an empty id
        return { error: url };
    }
    return undefined;
}
/**
 * Run critique on the current git working tree diff and return the result.
 * Used by the /diff slash command.
 */
function uploadGitDiffViaCritique(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var _c, stdout, stderr, error_1, execError, output, parsed, message;
        var title = _b.title, cwd = _b.cwd;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)("critique --web ".concat(shellQuote(title), " --json"), { cwd: cwd, timeout: CRITIQUE_TIMEOUT_MS })];
                case 1:
                    _c = _d.sent(), stdout = _c.stdout, stderr = _c.stderr;
                    return [2 /*return*/, parseCritiqueOutput(stdout || stderr)];
                case 2:
                    error_1 = _d.sent();
                    execError = error_1;
                    output = execError.stdout || execError.stderr || '';
                    parsed = parseCritiqueOutput(output);
                    if (parsed) {
                        return [2 /*return*/, parsed];
                    }
                    message = execError.message || 'Unknown error';
                    if (message.includes('command not found') || message.includes('ENOENT')) {
                        return [2 /*return*/, { error: 'critique not available' }];
                    }
                    return [2 /*return*/, { error: "Failed to generate diff: ".concat(message.slice(0, 200)) }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * Upload a .patch file to critique.work via critique --stdin.
 * Returns the critique URL on success, undefined on failure.
 * Default timeout is 10s since this runs in the background (footer edit).
 */
function uploadPatchViaCritique(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var stdout, result, error_2;
        var patchPath = _b.patchPath, title = _b.title, cwd = _b.cwd, _c = _b.timeoutMs, timeoutMs = _c === void 0 ? 10000 : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, worktrees_js_1.execAsync)("critique --stdin --web ".concat(shellQuote(title), " --json < ").concat(shellQuote(patchPath)), { cwd: cwd, timeout: timeoutMs })];
                case 1:
                    stdout = (_d.sent()).stdout;
                    result = parseCritiqueOutput(stdout);
                    return [2 /*return*/, result === null || result === void 0 ? void 0 : result.url];
                case 2:
                    error_2 = _d.sent();
                    logger.error('critique upload failed:', error_2);
                    return [2 /*return*/, undefined];
                case 3: return [2 /*return*/];
            }
        });
    });
}
