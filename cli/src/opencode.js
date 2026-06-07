"use strict";
// OpenCode single-server process manager.
//
// Architecture: ONE opencode serve process shared by all project directories.
// Each SDK client uses the x-opencode-directory header to scope requests to a
// specific project. The server lazily creates and caches an Instance per unique
// directory path internally.
//
// Per-directory permissions (external_directory rules for worktrees, tmpdir,
// etc.) are passed via session.create({ permission }) at session creation time,
// NOT via the server config. The server config has permissive defaults
// (edit: allow, bash: allow, external_directory: ask) and session-level rules
// override them via opencode's findLast() evaluation (last matching rule wins).
//
// Uses errore for type-safe error handling.
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribeOpencodeServerLifecycle = subscribeOpencodeServerLifecycle;
exports.resolveOpencodeCommand = resolveOpencodeCommand;
exports.initializeOpencodeForDirectory = initializeOpencodeForDirectory;
exports.buildSessionPermissions = buildSessionPermissions;
exports.buildExternalDirectoryPermissionRules = buildExternalDirectoryPermissionRules;
exports.parsePermissionRules = parsePermissionRules;
exports.writeInjectionGuardConfig = writeInjectionGuardConfig;
exports.removeInjectionGuardConfig = removeInjectionGuardConfig;
exports.readInjectionGuardConfig = readInjectionGuardConfig;
exports.getOpencodeServerPort = getOpencodeServerPort;
exports.getOpencodeClient = getOpencodeClient;
exports.stopOpencodeServer = stopOpencodeServer;
exports.restartOpencodeServer = restartOpencodeServer;
var node_child_process_1 = require("node:child_process");
var node_fs_1 = require("node:fs");
var node_http_1 = require("node:http");
var node_net_1 = require("node:net");
var node_os_1 = require("node:os");
var node_path_1 = require("node:path");
var node_readline_1 = require("node:readline");
var node_url_1 = require("node:url");
var __dirname = node_path_1.default.dirname((0, node_url_1.fileURLToPath)(import.meta.url));
var v2_1 = require("@opencode-ai/sdk/v2");
var config_js_1 = require("./config.js");
var store_js_1 = require("./store.js");
var hrana_server_js_1 = require("./hrana-server.js");
var errore = require("errore");
var logger_js_1 = require("./logger.js");
var sentry_js_1 = require("./sentry.js");
var errors_js_1 = require("./errors.js");
var opencode_command_js_1 = require("./opencode-command.js");
var skill_filter_js_1 = require("./skill-filter.js");
var opencodeLogger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.OPENCODE);
// Tracks directories that have been initialized, to avoid repeated log spam
// from the external sync polling loop.
var initializedDirectories = new Set();
var STARTUP_STDERR_TAIL_LIMIT = 30;
var STARTUP_STDERR_LINE_MAX_LENGTH = 120;
var STARTUP_ERROR_REASON_MAX_LENGTH = 1500;
var ANSI_ESCAPE_REGEX = /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;
function requestHealthcheck(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var url = _b.url;
        return __generator(this, function (_c) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var req = node_http_1.default.request(url, {
                        method: 'GET',
                        headers: {
                            connection: 'close',
                        },
                    }, function (res) {
                        var chunks = [];
                        res.on('data', function (chunk) {
                            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                        });
                        res.on('end', function () {
                            resolve({
                                status: res.statusCode || 0,
                                body: Buffer.concat(chunks).toString('utf-8'),
                            });
                        });
                    });
                    req.on('error', reject);
                    req.end();
                })];
        });
    });
}
function truncateWithEllipsis(_a) {
    var value = _a.value, maxLength = _a.maxLength;
    if (maxLength <= 3) {
        return value.slice(0, maxLength);
    }
    if (value.length <= maxLength) {
        return value;
    }
    return "".concat(value.slice(0, maxLength - 3), "...");
}
function stripAnsiCodes(value) {
    return value.replaceAll(ANSI_ESCAPE_REGEX, '');
}
function sanitizeOutputLine(line) {
    return stripAnsiCodes(line).trim();
}
function sanitizeForCodeFence(line) {
    return line.replaceAll('```', '`\u200b``');
}
function pushStartupStderrTail(_a) {
    var stderrTail = _a.stderrTail, line = _a.line;
    var sanitizedLine = sanitizeOutputLine(line);
    if (sanitizedLine.length === 0) {
        return;
    }
    var truncatedLine = truncateWithEllipsis({
        value: sanitizeForCodeFence(sanitizedLine),
        maxLength: STARTUP_STDERR_LINE_MAX_LENGTH,
    });
    stderrTail.push(truncatedLine);
    if (stderrTail.length > STARTUP_STDERR_TAIL_LIMIT) {
        stderrTail.splice(0, stderrTail.length - STARTUP_STDERR_TAIL_LIMIT);
    }
}
function subscribeToProcessLogStream(_a) {
    var stream = _a.stream, onLine = _a.onLine;
    if (!stream) {
        return null;
    }
    var logReader = node_readline_1.default.createInterface({
        input: stream,
        crlfDelay: Infinity,
    });
    logReader.on('line', function (line) {
        var sanitizedLine = sanitizeOutputLine(line);
        if (sanitizedLine.length === 0) {
            return;
        }
        onLine(sanitizedLine);
    });
    return logReader;
}
function buildStartupTimeoutReason(_a) {
    var maxAttempts = _a.maxAttempts, stderrTail = _a.stderrTail;
    var timeoutSeconds = Math.round((maxAttempts * 100) / 1000);
    var baseReason = "Server did not start after ".concat(timeoutSeconds, " seconds");
    if (stderrTail.length === 0) {
        return baseReason;
    }
    var formatReason = function (_a) {
        var lines = _a.lines, omitted = _a.omitted;
        var omittedLine = omitted > 0
            ? "[... ".concat(omitted, " older stderr lines omitted to fit Discord ...]\n")
            : '';
        var stderrCodeBlock = "".concat(omittedLine).concat(lines.join('\n'));
        return "".concat(baseReason, "\nLast opencode stderr lines:\n```text\n").concat(stderrCodeBlock, "\n```");
    };
    var lines = __spreadArray([], stderrTail, true);
    var omitted = 0;
    var formattedReason = formatReason({ lines: lines, omitted: omitted });
    while (formattedReason.length > STARTUP_ERROR_REASON_MAX_LENGTH &&
        lines.length > 0) {
        lines = lines.slice(1);
        omitted += 1;
        formattedReason = formatReason({ lines: lines, omitted: omitted });
    }
    return truncateWithEllipsis({
        value: formattedReason,
        maxLength: STARTUP_ERROR_REASON_MAX_LENGTH,
    });
}
var singleServer = null;
var serverRetryCount = 0;
var serverLifecycleListeners = new Set();
var processCleanupHandlersRegistered = false;
var startingServerProcess = null;
var clientCache = new Map();
function notifyServerLifecycle(event) {
    for (var _i = 0, serverLifecycleListeners_1 = serverLifecycleListeners; _i < serverLifecycleListeners_1.length; _i++) {
        var listener = serverLifecycleListeners_1[_i];
        listener(event);
    }
}
function subscribeOpencodeServerLifecycle(listener) {
    serverLifecycleListeners.add(listener);
    return function () {
        serverLifecycleListeners.delete(listener);
    };
}
function killSingleServerProcessNow(_a) {
    var reason = _a.reason;
    if (!singleServer) {
        return;
    }
    var serverProcess = singleServer.process;
    var pid = serverProcess.pid;
    if (!pid || serverProcess.killed) {
        return;
    }
    var killResult = errore.try({
        try: function () {
            serverProcess.kill('SIGTERM');
        },
        catch: function (error) {
            return new Error('Failed to send SIGTERM to opencode server', {
                cause: error,
            });
        },
    });
    if (killResult instanceof Error) {
        opencodeLogger.warn("[cleanup:".concat(reason, "] ").concat(killResult.message, " (pid: ").concat(pid, ", port: ").concat(singleServer.port, ")"));
        return;
    }
    opencodeLogger.log("[cleanup:".concat(reason, "] Sent SIGTERM to opencode server (pid: ").concat(pid, ", port: ").concat(singleServer.port, ")"));
}
function killStartingServerProcessNow(_a) {
    var reason = _a.reason;
    var serverProcess = startingServerProcess;
    if (!serverProcess) {
        return;
    }
    var pid = serverProcess.pid;
    if (!pid || serverProcess.killed) {
        return;
    }
    var killResult = errore.try({
        try: function () {
            serverProcess.kill('SIGTERM');
        },
        catch: function (error) {
            return new Error('Failed to send SIGTERM to starting opencode server', {
                cause: error,
            });
        },
    });
    if (killResult instanceof Error) {
        opencodeLogger.warn("[cleanup:".concat(reason, "] ").concat(killResult.message, " (pid: ").concat(pid, ")"));
        return;
    }
    opencodeLogger.log("[cleanup:".concat(reason, "] Sent SIGTERM to starting opencode server (pid: ").concat(pid, ")"));
}
function ensureProcessCleanupHandlersRegistered() {
    if (processCleanupHandlersRegistered) {
        return;
    }
    processCleanupHandlersRegistered = true;
    opencodeLogger.log('Registering process cleanup handlers for opencode server');
    process.on('exit', function () {
        killSingleServerProcessNow({ reason: 'process-exit' });
        killStartingServerProcessNow({ reason: 'process-exit' });
    });
    // Fallback for short-lived CLI subcommands that call process.exit without
    // running discord-bot.ts shutdown handlers.
    process.on('SIGINT', function () {
        killSingleServerProcessNow({ reason: 'sigint' });
        killStartingServerProcessNow({ reason: 'sigint' });
    });
    process.on('SIGTERM', function () {
        killSingleServerProcessNow({ reason: 'sigterm' });
        killStartingServerProcessNow({ reason: 'sigterm' });
    });
}
// ── Resolve opencode binary ──────────────────────────────────────
// Resolve the full path to the opencode binary so we can spawn without
// shell: true. Using shell: true creates an intermediate sh process — when
// cleanup sends SIGTERM it only kills the shell, leaving the actual opencode
// process orphaned (reparented to PID 1). Resolving the path upfront lets
// us spawn the binary directly and SIGTERM reaches the right process.
var resolvedOpencodeCommand = null;
function resolveOpencodeCommand() {
    if (resolvedOpencodeCommand) {
        return resolvedOpencodeCommand;
    }
    var envPath = process.env.OPENCODE_PATH;
    if (envPath) {
        var resolvedFromEnv = (0, opencode_command_js_1.selectResolvedCommand)({
            output: envPath,
            isWindows: process.platform === 'win32',
        });
        if (resolvedFromEnv) {
            resolvedOpencodeCommand = resolvedFromEnv;
            return resolvedFromEnv;
        }
    }
    var isWindows = process.platform === 'win32';
    var whichCmd = isWindows ? 'where' : 'which';
    var result = errore.try({
        try: function () {
            var commandOutput = (0, node_child_process_1.execFileSync)(whichCmd, ['opencode'], {
                encoding: 'utf8',
                timeout: 5000,
            });
            var resolved = (0, opencode_command_js_1.selectResolvedCommand)({
                output: commandOutput,
                isWindows: isWindows,
            });
            if (resolved) {
                return resolved;
            }
            throw new Error('opencode not found in PATH');
        },
        catch: function () { return new Error('opencode not found in PATH'); },
    });
    if (result instanceof Error) {
        // Fall back to bare command name — spawn will fail with a clear error
        // if it can't find the binary.
        opencodeLogger.warn('Could not resolve opencode path via which, falling back to "opencode"');
        return 'opencode';
    }
    resolvedOpencodeCommand = result;
    opencodeLogger.log("Resolved opencode binary: ".concat(result));
    return result;
}
function getOpenPort() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var server = node_net_1.default.createServer();
                    server.listen(0, function () {
                        var address = server.address();
                        if (address && typeof address === 'object') {
                            var port_1 = address.port;
                            server.close(function () {
                                resolve(port_1);
                            });
                        }
                        else {
                            reject(new Error('Failed to get port'));
                        }
                    });
                    server.on('error', reject);
                })];
        });
    });
}
function waitForServer(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var endpoint, i, response, body;
        var port = _b.port, directory = _b.directory, _c = _b.maxAttempts, maxAttempts = _c === void 0 ? 300 : _c, startupStderrTail = _b.startupStderrTail;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    endpoint = new URL("http://127.0.0.1:".concat(port, "/api/health"));
                    if (directory) {
                        endpoint.searchParams.set('directory', directory);
                    }
                    i = 0;
                    _d.label = 1;
                case 1:
                    if (!(i < maxAttempts)) return [3 /*break*/, 7];
                    return [4 /*yield*/, errore.tryAsync({
                            try: function () { return requestHealthcheck({ url: endpoint.toString() }); },
                            catch: function (e) { return new errors_js_1.FetchError({ url: endpoint.toString(), cause: e }); },
                        })];
                case 2:
                    response = _d.sent();
                    if (!(response instanceof Error)) return [3 /*break*/, 4];
                    // Connection refused or other transient errors - continue polling.
                    // Use 100ms interval instead of 1s so we detect readiness faster.
                    // Critical for scale-to-zero cold starts where every ms matters.
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 3:
                    // Connection refused or other transient errors - continue polling.
                    // Use 100ms interval instead of 1s so we detect readiness faster.
                    // Critical for scale-to-zero cold starts where every ms matters.
                    _d.sent();
                    return [3 /*break*/, 6];
                case 4:
                    if (response.status < 500) {
                        return [2 /*return*/, true];
                    }
                    body = response.body;
                    // Fatal errors that won't resolve with retrying
                    if (body.includes('BunInstallFailedError')) {
                        return [2 /*return*/, new errors_js_1.ServerStartError({ port: port, reason: body.slice(0, 200) })];
                    }
                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                case 5:
                    _d.sent();
                    _d.label = 6;
                case 6:
                    i++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/, new errors_js_1.ServerStartError({
                        port: port,
                        reason: buildStartupTimeoutReason({
                            maxAttempts: maxAttempts,
                            stderrTail: startupStderrTail,
                        }),
                    })];
            }
        });
    });
}
// ── Single server lifecycle ──────────────────────────────────────
// The server is started lazily on first initializeOpencodeForDirectory() call.
// It uses permissive defaults (edit: allow, bash: allow, external_directory: ask).
// Per-directory permissions are applied at session creation time instead.
// In-flight promise to prevent concurrent startups from racing
var startingServer = null;
var preferredStartupDirectory = null;
function ensureOpencodeHomeDirectories(_a) {
    var directories = _a.directories;
    Object.values(directories).map(function (directory) {
        node_fs_1.default.mkdirSync(directory, { recursive: true });
    });
}
function ensureSingleServer() {
    return __awaiter(this, arguments, void 0, function (_a) {
        var startupDirectory;
        var _b = _a === void 0 ? {} : _a, directory = _b.directory;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    startupDirectory = directory || preferredStartupDirectory || undefined;
                    if (singleServer && !singleServer.process.killed) {
                        return [2 /*return*/, singleServer];
                    }
                    // Deduplicate concurrent startup attempts
                    if (startingServer) {
                        return [2 /*return*/, startingServer];
                    }
                    startingServer = startSingleServer({ directory: startupDirectory });
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, , 3, 4]);
                    return [4 /*yield*/, startingServer];
                case 2: return [2 /*return*/, _c.sent()];
                case 3:
                    startingServer = null;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function startSingleServer() {
    return __awaiter(this, arguments, void 0, function (_a) {
        var port, serveArgs, _b, spawnCommand, spawnArgs, windowsVerbatimArguments, tmpdir, opencodeConfigDir, opensrcDir, kimakiDataDir, externalDirectoryPermissions, kimakiShimDirectory, pathEnvKey, pathEnv, gatewayToken, vitestOpencodeEnv, isDev, skillPermission, opencodeConfig, opencodeConfigPath, opencodeConfigJson, existingContent, serverProcess, logBuffer, startupStderrTail, serverReady, stdoutReader, stderrReader, waitResult, _i, logBuffer_1, line, _c, logBuffer_2, line, server;
        var _d, _e;
        var _f = _a === void 0 ? {} : _a, directory = _f.directory;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    ensureProcessCleanupHandlersRegistered();
                    return [4 /*yield*/, getOpenPort()];
                case 1:
                    port = _g.sent();
                    serveArgs = [
                        'serve',
                        '--port',
                        port.toString(),
                        '--print-logs',
                        '--log-level',
                        'WARN',
                    ];
                    _b = (0, opencode_command_js_1.getSpawnCommandAndArgs)({
                        resolvedCommand: resolveOpencodeCommand(),
                        baseArgs: serveArgs,
                    }), spawnCommand = _b.command, spawnArgs = _b.args, windowsVerbatimArguments = _b.windowsVerbatimArguments;
                    tmpdir = node_os_1.default.tmpdir().replaceAll('\\', '/');
                    opencodeConfigDir = node_path_1.default
                        .join(node_os_1.default.homedir(), '.config', 'opencode')
                        .replaceAll('\\', '/');
                    opensrcDir = node_path_1.default
                        .join(node_os_1.default.homedir(), '.opensrc')
                        .replaceAll('\\', '/');
                    kimakiDataDir = node_path_1.default
                        .join(node_os_1.default.homedir(), '.kimaki')
                        .replaceAll('\\', '/');
                    externalDirectoryPermissions = (_d = {
                            '/tmp': 'allow',
                            '/tmp/*': 'allow',
                            '/private/tmp': 'allow',
                            '/private/tmp/*': 'allow'
                        },
                        _d[tmpdir] = 'allow',
                        _d["".concat(tmpdir, "/*")] = 'allow',
                        _d[opencodeConfigDir] = 'allow',
                        _d["".concat(opencodeConfigDir, "/*")] = 'allow',
                        _d[opensrcDir] = 'allow',
                        _d["".concat(opensrcDir, "/*")] = 'allow',
                        _d[kimakiDataDir] = 'allow',
                        _d["".concat(kimakiDataDir, "/*")] = 'allow',
                        _d);
                    kimakiShimDirectory = (0, opencode_command_js_1.ensureKimakiCommandShim)({
                        dataDir: (0, config_js_1.getDataDir)(),
                        execPath: process.execPath,
                        execArgv: process.execArgv,
                        entryScript: process.argv[1] || (0, node_url_1.fileURLToPath)(new URL('../bin.js', import.meta.url)),
                    });
                    pathEnvKey = (0, opencode_command_js_1.getPathEnvKey)(process.env);
                    pathEnv = kimakiShimDirectory instanceof Error
                        ? process.env[pathEnvKey]
                        : (0, opencode_command_js_1.prependPathEntry)({
                            entry: kimakiShimDirectory,
                            existingPath: process.env[pathEnvKey],
                        });
                    if (kimakiShimDirectory instanceof Error) {
                        opencodeLogger.warn(kimakiShimDirectory.message);
                    }
                    gatewayToken = store_js_1.store.getState().gatewayToken;
                    vitestOpencodeEnv = (function () {
                        if (process.env.KIMAKI_VITEST !== '1') {
                            return {};
                        }
                        var root = node_path_1.default.join((0, config_js_1.getDataDir)(), 'opencode-vitest-home');
                        var directories = {
                            OPENCODE_TEST_HOME: root,
                            OPENCODE_CONFIG_DIR: node_path_1.default.join(root, '.opencode-kimaki'),
                            XDG_CONFIG_HOME: node_path_1.default.join(root, '.config'),
                            XDG_DATA_HOME: node_path_1.default.join(root, '.local', 'share'),
                            XDG_CACHE_HOME: node_path_1.default.join(root, '.cache'),
                            XDG_STATE_HOME: node_path_1.default.join(root, '.local', 'state'),
                        };
                        // OpenCode writes state/config files into these XDG locations during boot.
                        // In CI, a fresh temp data dir means the parent folders may not exist yet,
                        // and some writes fail closed with NotFound before OpenCode has a chance to
                        // create them lazily. Pre-create the directories so startup-time tests do
                        // not flap based on process scheduling.
                        ensureOpencodeHomeDirectories({ directories: directories });
                        return directories;
                    })();
                    isDev = import.meta.url.endsWith('.ts') || import.meta.url.endsWith('.tsx');
                    skillPermission = (0, skill_filter_js_1.computeSkillPermission)({
                        enabledSkills: store_js_1.store.getState().enabledSkills,
                        disabledSkills: store_js_1.store.getState().disabledSkills,
                    });
                    opencodeConfig = {
                        $schema: 'https://opencode.ai/config.json',
                        lsp: false,
                        formatter: false,
                        plugin: [
                            new URL(isDev ? './kimaki-opencode-plugin.ts' : './kimaki-opencode-plugin.js', import.meta.url).href,
                        ],
                        permission: __assign({ edit: 'allow', bash: 'allow', external_directory: externalDirectoryPermissions, webfetch: 'allow' }, (skillPermission && { skill: skillPermission })),
                        agent: {
                            explore: {
                                permission: {
                                    '*': 'deny',
                                    grep: 'allow',
                                    glob: 'allow',
                                    list: 'allow',
                                    read: {
                                        '*': 'allow',
                                        '*.env': 'deny',
                                        '*.env.*': 'deny',
                                        '*.env.example': 'allow',
                                    },
                                    webfetch: 'allow',
                                    websearch: 'allow',
                                    codesearch: 'allow',
                                    external_directory: externalDirectoryPermissions,
                                },
                            },
                        },
                        skills: {
                            paths: [node_path_1.default.resolve(__dirname, '..', 'skills')],
                        },
                    };
                    opencodeConfigPath = node_path_1.default.join((0, config_js_1.getDataDir)(), 'opencode-config.json');
                    opencodeConfigJson = JSON.stringify(opencodeConfig, null, 2);
                    existingContent = (function () {
                        try {
                            return node_fs_1.default.readFileSync(opencodeConfigPath, 'utf-8');
                        }
                        catch (_a) {
                            return '';
                        }
                    })();
                    if (existingContent !== opencodeConfigJson) {
                        node_fs_1.default.writeFileSync(opencodeConfigPath, opencodeConfigJson);
                    }
                    serverProcess = (0, node_child_process_1.spawn)(spawnCommand, spawnArgs, {
                        stdio: 'pipe',
                        detached: false,
                        windowsVerbatimArguments: windowsVerbatimArguments,
                        // No project-specific cwd — the server handles all directories via
                        // x-opencode-directory header. Use home dir as a neutral working dir.
                        cwd: node_os_1.default.homedir(),
                        env: __assign(__assign(__assign(__assign(__assign(__assign(__assign(__assign({}, process.env), { OPENCODE_CONFIG: opencodeConfigPath, OPENCODE_PORT: port.toString(), KIMAKI: '1', KIMAKI_DATA_DIR: (0, config_js_1.getDataDir)(), KIMAKI_LOCK_PORT: (0, config_js_1.getLockPort)().toString(), KIMAKI_PARENT_LOCK_PORT: (0, config_js_1.getLockPort)().toString() }), (gatewayToken && { KIMAKI_DB_AUTH_TOKEN: gatewayToken })), { 
                            // Guard: prevents agents from running `kimaki` root command inside
                            // an OpenCode session, which would steal the lock port and break the bot.
                            KIMAKI_OPENCODE_PROCESS: '1' }), ((0, hrana_server_js_1.getHranaUrl)() && { KIMAKI_DB_URL: (0, hrana_server_js_1.getHranaUrl)() })), (process.env.KIMAKI_SENTRY_DSN && {
                            KIMAKI_SENTRY_DSN: process.env.KIMAKI_SENTRY_DSN,
                        })), vitestOpencodeEnv), (pathEnv && (_e = {}, _e[pathEnvKey] = pathEnv, _e))),
                    });
                    startingServerProcess = serverProcess;
                    logBuffer = [];
                    startupStderrTail = [];
                    serverReady = false;
                    logBuffer.push("Spawned opencode serve --port ".concat(port, " (pid: ").concat(serverProcess.pid, ")"));
                    stdoutReader = subscribeToProcessLogStream({
                        stream: serverProcess.stdout,
                        onLine: function (line) {
                            if (!serverReady) {
                                logBuffer.push("[stdout] ".concat(line));
                                return;
                            }
                            opencodeLogger.log(line);
                        },
                    });
                    stderrReader = subscribeToProcessLogStream({
                        stream: serverProcess.stderr,
                        onLine: function (line) {
                            if (!serverReady) {
                                logBuffer.push("[stderr] ".concat(line));
                                pushStartupStderrTail({ stderrTail: startupStderrTail, line: line });
                                return;
                            }
                            opencodeLogger.error(line);
                        },
                    });
                    serverProcess.on('error', function (error) {
                        logBuffer.push("Failed to start server on port ".concat(port, ": ").concat(error));
                    });
                    serverProcess.on('exit', function (code, signal) {
                        stdoutReader === null || stdoutReader === void 0 ? void 0 : stdoutReader.close();
                        stderrReader === null || stderrReader === void 0 ? void 0 : stderrReader.close();
                        if (startingServerProcess === serverProcess) {
                            startingServerProcess = null;
                        }
                        opencodeLogger.log("Opencode server exited with code: ".concat(code, ", signal: ").concat(signal));
                        singleServer = null;
                        clientCache.clear();
                        notifyServerLifecycle({ type: 'stopped' });
                        // Intentional kills should not trigger auto-restart:
                        // - SIGTERM from our cleanup/restart code
                        // - SIGINT propagated from Ctrl+C (parent process group signal)
                        // - any exit during bot shutdown (shuttingDown flag)
                        // Only unexpected crashes (non-zero exit without signal) get retried.
                        if (signal === 'SIGTERM' || signal === 'SIGINT' || global.shuttingDown) {
                            serverRetryCount = 0;
                            return;
                        }
                        if (code !== 0) {
                            if (serverRetryCount < 5) {
                                serverRetryCount += 1;
                                opencodeLogger.log("Restarting server (attempt ".concat(serverRetryCount, "/5)"));
                                void ensureSingleServer().then(function (result) {
                                    if (result instanceof Error) {
                                        opencodeLogger.error("Failed to restart opencode server:", result);
                                        void (0, sentry_js_1.notifyError)(result, "OpenCode server restart failed");
                                    }
                                });
                            }
                            else {
                                var crashError = new Error("Server crashed too many times (5), not restarting");
                                opencodeLogger.error(crashError.message);
                                void (0, sentry_js_1.notifyError)(crashError, "OpenCode server crash loop exhausted");
                            }
                        }
                        else {
                            serverRetryCount = 0;
                        }
                    });
                    return [4 /*yield*/, waitForServer({
                            port: port,
                            directory: directory,
                            startupStderrTail: startupStderrTail,
                        })];
                case 2:
                    waitResult = _g.sent();
                    if (waitResult instanceof Error) {
                        killStartingServerProcessNow({ reason: 'startup-failed' });
                        if (startingServerProcess === serverProcess) {
                            startingServerProcess = null;
                        }
                        // Dump buffered logs on failure
                        opencodeLogger.error("Server failed to start:");
                        for (_i = 0, logBuffer_1 = logBuffer; _i < logBuffer_1.length; _i++) {
                            line = logBuffer_1[_i];
                            opencodeLogger.error("  ".concat(line));
                        }
                        return [2 /*return*/, waitResult];
                    }
                    serverReady = true;
                    opencodeLogger.log("Server ready on port ".concat(port));
                    // Always dump startup logs so plugin loading errors and other startup output
                    // are visible in kimaki.log.
                    for (_c = 0, logBuffer_2 = logBuffer; _c < logBuffer_2.length; _c++) {
                        line = logBuffer_2[_c];
                        opencodeLogger.log(line);
                    }
                    server = {
                        process: serverProcess,
                        port: port,
                        baseUrl: "http://127.0.0.1:".concat(port),
                    };
                    if (startingServerProcess === serverProcess) {
                        startingServerProcess = null;
                    }
                    singleServer = server;
                    notifyServerLifecycle({ type: 'started', port: port });
                    return [2 /*return*/, server];
            }
        });
    });
}
function getOrCreateClient(_a) {
    var baseUrl = _a.baseUrl, directory = _a.directory;
    var cached = clientCache.get(directory);
    if (cached) {
        return cached;
    }
    var fetchWithTimeout = function (request) {
        return fetch(request, {
            // @ts-ignore
            timeout: false,
        });
    };
    var client = (0, v2_1.createOpencodeClient)({
        baseUrl: baseUrl,
        directory: directory,
        fetch: fetchWithTimeout,
    });
    clientCache.set(directory, client);
    return client;
}
// ── Public API ───────────────────────────────────────────────────
// Same signatures as before so callers don't need to change.
/**
 * Initialize OpenCode server for a directory.
 * Starts the single shared server if not running, then returns a client
 * factory scoped to the given directory via x-opencode-directory header.
 *
 * @param directory - The project directory to scope requests to
 * @param options.originalRepoDirectory - For worktrees: the original repo directory
 *   (no longer used for server-level permissions — use buildSessionPermissions
 *   at session.create() time instead)
 */
function initializeOpencodeForDirectory(directory, _options) {
    return __awaiter(this, void 0, void 0, function () {
        var accessCheck, server;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    accessCheck = errore.tryFn({
                        try: function () {
                            node_fs_1.default.accessSync(directory, node_fs_1.default.constants.R_OK | node_fs_1.default.constants.X_OK);
                        },
                        catch: function () { return new errors_js_1.DirectoryNotAccessibleError({ directory: directory }); },
                    });
                    if (accessCheck instanceof Error) {
                        return [2 /*return*/, accessCheck];
                    }
                    preferredStartupDirectory = directory;
                    return [4 /*yield*/, ensureSingleServer({ directory: directory })];
                case 1:
                    server = _a.sent();
                    if (server instanceof Error) {
                        return [2 /*return*/, server];
                    }
                    if (!initializedDirectories.has(directory)) {
                        initializedDirectories.add(directory);
                    }
                    return [2 /*return*/, function () {
                            if (!singleServer) {
                                throw new errors_js_1.ServerNotReadyError({ directory: directory });
                            }
                            return getOrCreateClient({
                                baseUrl: singleServer.baseUrl,
                                directory: directory,
                            });
                        }];
            }
        });
    });
}
/**
 * Build per-session permission rules for external_directory access.
 * These rules are passed to session.create({ permission }) and override
 * the server-level defaults via opencode's findLast() evaluation.
 *
 * This replaces the old per-server OPENCODE_CONFIG_CONTENT external_directory
 * permissions — now each session carries its own directory-scoped rules.
 */
function buildSessionPermissions(_a) {
    var directory = _a.directory, originalRepoDirectory = _a.originalRepoDirectory;
    // Normalize path separators for cross-platform compatibility (Windows uses backslashes)
    var tmpdir = node_os_1.default.tmpdir().replaceAll('\\', '/');
    var normalizedDirectory = directory.replaceAll('\\', '/');
    var originalRepo = originalRepoDirectory === null || originalRepoDirectory === void 0 ? void 0 : originalRepoDirectory.replaceAll('\\', '/');
    var rules = [
        // Allow tmpdir access
        { permission: 'external_directory', pattern: '/tmp', action: 'allow' },
        { permission: 'external_directory', pattern: '/tmp/*', action: 'allow' },
        { permission: 'external_directory', pattern: '/private/tmp', action: 'allow' },
        { permission: 'external_directory', pattern: '/private/tmp/*', action: 'allow' },
        { permission: 'external_directory', pattern: tmpdir, action: 'allow' },
        { permission: 'external_directory', pattern: "".concat(tmpdir, "/*"), action: 'allow' },
        // Allow the project directory itself
        { permission: 'external_directory', pattern: normalizedDirectory, action: 'allow' },
        { permission: 'external_directory', pattern: "".concat(normalizedDirectory, "/*"), action: 'allow' },
    ];
    var homeDirectoryRules = function (_a) {
        var relativePath = _a.relativePath;
        var normalizedRelativePath = relativePath.replaceAll('\\', '/');
        var basePattern = node_path_1.default.resolve(node_os_1.default.homedir(), normalizedRelativePath);
        return [
            { permission: 'external_directory', pattern: basePattern, action: 'allow' },
            { permission: 'external_directory', pattern: "".concat(basePattern, "/*"), action: 'allow' },
        ];
    };
    // Allow ~/.config/opencode so the agent doesn't get permission prompts when
    // it tries to read the global AGENTS.md or opencode config (the path is
    // visible in the system prompt, so models sometimes try to read it).
    rules.push.apply(rules, homeDirectoryRules({ relativePath: '.config/opencode' }));
    // Allow ~/.config/openc0de too because the Anthropic plugin rewrites the
    // name in the system prompt and some models may try to inspect that path.
    rules.push.apply(rules, homeDirectoryRules({ relativePath: '.config/openc0de' }));
    // Allow ~/.opensrc so agents can inspect cached opensrc checkouts without
    // permission prompts.
    rules.push.apply(rules, homeDirectoryRules({ relativePath: '.opensrc' }));
    // Allow ~/.kimaki so the agent can access kimaki data dir (logs, db, etc.)
    // without permission prompts.
    rules.push.apply(rules, homeDirectoryRules({ relativePath: '.kimaki' }));
    // Allow opencode tool output artifacts under XDG data so agents can inspect
    // prior tool outputs without interactive permission prompts.
    rules.push.apply(rules, homeDirectoryRules({ relativePath: '.local/share/opencode/tool-output' }));
    // Allow common language caches under the user's home directory so toolchains
    // can inspect downloaded modules and artifacts without external_directory prompts.
    rules.push.apply(rules, __spreadArray(__spreadArray(__spreadArray(__spreadArray([], homeDirectoryRules({ relativePath: '.cache/zig' }), false), homeDirectoryRules({ relativePath: '.cargo' }), false), homeDirectoryRules({ relativePath: '.cache/go-build' }), false), homeDirectoryRules({ relativePath: 'go/pkg' }), false));
    // For worktree sessions: explicitly deny the original checkout so agents do
    // not keep editing the main repo after the thread has moved to a managed
    // worktree. Deny rules are appended last so they override earlier allow/
    // ask defaults via opencode's findLast() evaluation.
    if (originalRepo && originalRepo !== normalizedDirectory) {
        rules.push.apply(rules, buildExternalDirectoryPermissionRules({
            resolvedPattern: originalRepo,
            action: 'deny',
        }));
    }
    return rules;
}
var ALL_EXTERNAL_DIRECTORIES_PATTERN = '*';
function buildExternalDirectoryPermissionRules(_a) {
    var resolvedPattern = _a.resolvedPattern, action = _a.action;
    if (resolvedPattern === ALL_EXTERNAL_DIRECTORIES_PATTERN) {
        return [
            {
                permission: 'external_directory',
                pattern: ALL_EXTERNAL_DIRECTORIES_PATTERN,
                action: action,
            },
        ];
    }
    return [
        {
            permission: 'external_directory',
            pattern: resolvedPattern,
            action: action,
        },
        {
            permission: 'external_directory',
            pattern: "".concat(resolvedPattern, "/*"),
            action: action,
        },
    ];
}
/**
 * Parse raw permission strings into PermissionRuleset entries.
 *
 * Accepted formats:
 *   "tool:action"           → { permission: tool, pattern: "*", action }
 *   "tool:pattern:action"   → { permission: tool, pattern,      action }
 *
 * The action must be one of "allow", "deny", "ask" (case-insensitive).
 * Parts are trimmed to tolerate whitespace from YAML deserialization.
 * Invalid entries are silently skipped (bad user input shouldn't crash the bot).
 * If `raw` is not an array, returns empty (defensive against malformed YAML markers).
 */
function parsePermissionRules(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    var validActions = new Set(['allow', 'deny', 'ask']);
    return raw.flatMap(function (entry) {
        if (typeof entry !== 'string') {
            return [];
        }
        var parts = entry.split(':').map(function (s) {
            return s.trim();
        });
        if (parts.length === 2) {
            var permission = parts[0], rawAction = parts[1];
            var action = rawAction.toLowerCase();
            if (!permission || !validActions.has(action)) {
                return [];
            }
            return [{ permission: permission, pattern: '*', action: action }];
        }
        if (parts.length >= 3) {
            // Last segment is the action, first segment is the permission,
            // everything in between is the pattern (may contain colons in theory,
            // but unlikely for tool patterns).
            var permission = parts[0];
            var rawAction = parts[parts.length - 1];
            var action = rawAction.toLowerCase();
            var pattern = parts.slice(1, -1).join(':');
            if (!permission || !pattern || !validActions.has(action)) {
                return [];
            }
            return [{ permission: permission, pattern: pattern, action: action }];
        }
        return [];
    });
}
// ── Injection guard per-session config ───────────────────────────
// Per-session injection guard patterns are written as JSON files to
// <dataDir>/injection-guard/<sessionId>.json. The injection guard plugin
// (running inside the opencode server process) reads KIMAKI_DATA_DIR env
// var to find these files in tool.execute.after.
// This avoids needing env vars (which are per-process, not per-session).
function getInjectionGuardDir() {
    return node_path_1.default.join((0, config_js_1.getDataDir)(), 'injection-guard');
}
/**
 * Write per-session injection guard config so the plugin picks it up.
 * Only call this if injectionGuardPatterns is non-empty.
 */
function writeInjectionGuardConfig(_a) {
    var sessionId = _a.sessionId, scanPatterns = _a.scanPatterns;
    if (scanPatterns.length === 0) {
        return;
    }
    try {
        var dir = getInjectionGuardDir();
        node_fs_1.default.mkdirSync(dir, { recursive: true });
        node_fs_1.default.writeFileSync(node_path_1.default.join(dir, "".concat(sessionId, ".json")), JSON.stringify({ scanPatterns: scanPatterns }));
    }
    catch (_b) {
        // Best effort -- don't crash the bot if data dir write fails
    }
}
/**
 * Remove per-session injection guard config file.
 */
function removeInjectionGuardConfig(_a) {
    var sessionId = _a.sessionId;
    try {
        node_fs_1.default.unlinkSync(node_path_1.default.join(getInjectionGuardDir(), "".concat(sessionId, ".json")));
    }
    catch (_b) {
        // File may already be gone
    }
}
/**
 * Read per-session injection guard config. Used by the kimaki plugin
 * inside the opencode server process.
 */
function readInjectionGuardConfig(_a) {
    var sessionId = _a.sessionId;
    try {
        var raw = node_fs_1.default.readFileSync(node_path_1.default.join(getInjectionGuardDir(), "".concat(sessionId, ".json")), 'utf-8');
        return JSON.parse(raw);
    }
    catch (_b) {
        return null;
    }
}
// ── Public helpers ───────────────────────────────────────────────
// These helpers expose the single shared server and directory-scoped clients.
function getOpencodeServerPort(_directory) {
    var _a;
    return (_a = singleServer === null || singleServer === void 0 ? void 0 : singleServer.port) !== null && _a !== void 0 ? _a : null;
}
function getOpencodeClient(directory) {
    if (!singleServer) {
        return null;
    }
    return getOrCreateClient({
        baseUrl: singleServer.baseUrl,
        directory: directory,
    });
}
/**
 * Stop the single opencode server.
 * Used for process teardown, tests, and explicit restarts.
 */
function stopOpencodeServer() {
    return __awaiter(this, void 0, void 0, function () {
        var server, killResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!singleServer) {
                        return [2 /*return*/, false];
                    }
                    server = singleServer;
                    opencodeLogger.log("Stopping opencode server (pid: ".concat(server.process.pid, ", port: ").concat(server.port, ")"));
                    if (!server.process.killed) {
                        killResult = errore.try({
                            try: function () {
                                server.process.kill('SIGTERM');
                            },
                            catch: function (error) {
                                return new Error('Failed to send SIGTERM to opencode server', {
                                    cause: error,
                                });
                            },
                        });
                        if (killResult instanceof Error) {
                            opencodeLogger.warn(killResult.message);
                        }
                    }
                    killStartingServerProcessNow({ reason: 'stop-opencode-server' });
                    startingServerProcess = null;
                    singleServer = null;
                    clientCache.clear();
                    serverRetryCount = 0;
                    return [4 /*yield*/, new Promise(function (resolve) {
                            setTimeout(resolve, 1000);
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, true];
            }
        });
    });
}
/**
 * Restart the single opencode server.
 * Kills the existing process and starts a new one.
 * Used for resolving opencode state issues, refreshing auth, plugins, etc.
 */
function restartOpencodeServer() {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!singleServer) return [3 /*break*/, 2];
                    return [4 /*yield*/, stopOpencodeServer()];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    // Reset retry count for the fresh start
                    serverRetryCount = 0;
                    return [4 /*yield*/, ensureSingleServer()];
                case 3:
                    result = _a.sent();
                    if (result instanceof Error) {
                        return [2 /*return*/, result];
                    }
                    return [2 /*return*/, true];
            }
        });
    });
}
