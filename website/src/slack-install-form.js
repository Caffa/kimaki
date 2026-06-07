'use client';
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
exports.SlackInstallForm = SlackInstallForm;
var react_1 = require("react");
function SlackInstallForm(_a) {
    var clientId = _a.clientId, clientSecret = _a.clientSecret, kimakiCallbackUrl = _a.kimakiCallbackUrl;
    var _b = (0, react_1.useState)(''), domain = _b[0], setDomain = _b[1];
    var _c = (0, react_1.useState)(''), error = _c[0], setError = _c[1];
    var _d = (0, react_1.useState)(false), loading = _d[0], setLoading = _d[1];
    function handleSubmit(e) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmed, res, data, params, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        e.preventDefault();
                        trimmed = domain.trim().toLowerCase();
                        if (!trimmed) {
                            setError('Please enter a workspace name');
                            return [2 /*return*/];
                        }
                        setError('');
                        setLoading(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fetch("/slack-install/resolve?domain=".concat(encodeURIComponent(trimmed)))];
                    case 2:
                        res = _b.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        data = (_b.sent());
                        if (!data.ok) {
                            setError(data.error || 'Workspace not found');
                            setLoading(false);
                            return [2 /*return*/];
                        }
                        params = new URLSearchParams();
                        params.set('clientId', clientId);
                        params.set('clientSecret', clientSecret);
                        params.set('team', data.teamId || '');
                        if (kimakiCallbackUrl) {
                            params.set('kimakiCallbackUrl', kimakiCallbackUrl);
                        }
                        window.location.href = "/slack-install/start?".concat(params.toString());
                        return [3 /*break*/, 5];
                    case 4:
                        _a = _b.sent();
                        setError('Failed to resolve workspace. Please try again.');
                        setLoading(false);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    return (<form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="slack-domain" className="text-sm font-medium text-gray-700">
          Workspace name
        </label>
        <div className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-black focus-within:ring-1 focus-within:ring-black transition-colors">
          <input id="slack-domain" type="text" value={domain} onChange={function (e) {
            setDomain(e.target.value);
            if (error) {
                setError('');
            }
        }} placeholder="your-workspace" autoFocus autoComplete="off" spellCheck={false} disabled={loading} className="grow px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-gray-400 disabled:opacity-50"/>
          <span className="pr-3 text-sm text-gray-400 select-none">
            .slack.com
          </span>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <button type="submit" disabled={loading} className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? (<span className="flex items-center justify-center gap-2">
            <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Resolving...
          </span>) : ('Continue')}
      </button>
    </form>);
}
