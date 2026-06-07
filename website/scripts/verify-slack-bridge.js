// Verifies deployed slack-bridge worker routes are reachable and coherent.
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
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var baseUrlArg, baseUrl, checks, results, failed, _i, results_1, result, status_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    baseUrlArg = process.argv[2];
                    if (!baseUrlArg) {
                        throw new Error('Usage: pnpm verify:slack-bridge <base-url>');
                    }
                    baseUrl = new URL(baseUrlArg);
                    checks = [
                        checkGatewayBotEndpoint({ baseUrl: baseUrl }),
                        checkGatewayProxyEndpoint({ baseUrl: baseUrl }),
                        checkWebhookEndpoint({ baseUrl: baseUrl }),
                    ];
                    return [4 /*yield*/, Promise.all(checks)];
                case 1:
                    results = _a.sent();
                    failed = results.filter(function (result) {
                        return !result.ok;
                    });
                    for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                        result = results_1[_i];
                        status_1 = result.ok ? 'PASS' : 'FAIL';
                        console.log("[".concat(status_1, "] ").concat(result.name, " - ").concat(result.details));
                    }
                    if (failed.length > 0) {
                        throw new Error("Slack bridge verification failed (".concat(failed.length, " checks)"));
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function checkGatewayBotEndpoint(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var url, response, body, gatewayUrl;
        var baseUrl = _b.baseUrl;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    url = new URL('/api/v10/gateway/bot', baseUrl);
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    response = _c.sent();
                    if (!response.ok) {
                        return [2 /*return*/, {
                                ok: false,
                                name: 'gateway bot endpoint',
                                details: "expected 200, got ".concat(response.status),
                            }];
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    body = _c.sent();
                    if (!(body && typeof body === 'object')) {
                        return [2 /*return*/, {
                                ok: false,
                                name: 'gateway bot endpoint',
                                details: 'response is not an object',
                            }];
                    }
                    gatewayUrl = readStringField({ body: body, key: 'url' });
                    if (!gatewayUrl) {
                        return [2 /*return*/, {
                                ok: false,
                                name: 'gateway bot endpoint',
                                details: 'missing expected url field',
                            }];
                    }
                    return [2 /*return*/, {
                            ok: true,
                            name: 'gateway bot endpoint',
                            details: "url=".concat(gatewayUrl),
                        }];
            }
        });
    });
}
function checkGatewayProxyEndpoint(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var url, response;
        var baseUrl = _b.baseUrl;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    url = new URL('/slack/gateway', baseUrl);
                    return [4 /*yield*/, fetch(url)];
                case 1:
                    response = _c.sent();
                    if (response.status !== 426) {
                        return [2 /*return*/, {
                                ok: false,
                                name: 'gateway route',
                                details: "expected 426 (websocket upgrade required), got ".concat(response.status),
                            }];
                    }
                    return [2 /*return*/, {
                            ok: true,
                            name: 'gateway route',
                            details: 'upgrade-required response received',
                        }];
            }
        });
    });
}
function checkWebhookEndpoint(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var url, response;
        var baseUrl = _b.baseUrl;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    url = new URL('/slack/events', baseUrl);
                    return [4 /*yield*/, fetch(url, {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ type: 'url_verification' }),
                        })];
                case 1:
                    response = _c.sent();
                    if (response.status !== 401) {
                        return [2 /*return*/, {
                                ok: false,
                                name: 'webhook route',
                                details: "expected 401 (signature required), got ".concat(response.status),
                            }];
                    }
                    return [2 /*return*/, {
                            ok: true,
                            name: 'webhook route',
                            details: 'signature guard response received',
                        }];
            }
        });
    });
}
function readStringField(_a) {
    var body = _a.body, key = _a.key;
    if (!isRecord(body)) {
        return undefined;
    }
    var value = body[key];
    if (typeof value === 'string') {
        return value;
    }
    return undefined;
}
function isRecord(value) {
    return typeof value === 'object' && value !== null;
}
void main().catch(function (error) {
    console.error(error);
    process.exit(1);
});
