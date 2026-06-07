"use strict";
// Cloudflare Worker proxy for routing libSQL requests to Durable Objects.
//
// Auth model: Bearer token = "namespace:secret"
//   - namespace: identifies which Durable Object to route to
//   - secret: validated against the shared secret
//
// The proxy parses the Bearer token, validates the secret, resolves the DO
// stub via getStub(), and calls stub.hranaHandler(request) via RPC.
//
// Usage in Worker:
//
//   import { createLibsqlProxy } from 'libsqlproxy'
//
//   export default {
//     async fetch(request: Request, env: Env) {
//       const url = new URL(request.url)
//       if (url.hostname.startsWith('libsql.')) {
//         const proxy = createLibsqlProxy({
//           secret: env.LIBSQL_SECRET,
//           getStub: ({ namespace, env }) => {
//             const id = env.MY_DO.idFromString(namespace)
//             return env.MY_DO.get(id)
//           },
//         })
//         return proxy(request, env)
//       }
//       return new Response('Not found', { status: 404 })
//     },
//   }
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
exports.createLibsqlProxy = createLibsqlProxy;
function createLibsqlProxy(options) {
    var _this = this;
    // Validate secret at creation time: must not contain ':'
    // because we split the Bearer token on the last ':' to separate namespace from secret.
    var staticSecret = typeof options.secret === 'string' ? options.secret : null;
    if (staticSecret && staticSecret.includes(':')) {
        throw new Error('libsqlproxy: secret must not contain ":"');
    }
    return function (request, env) { return __awaiter(_this, void 0, void 0, function () {
        var authHeader, token, lastColonIndex, namespace, providedSecret, expectedSecret, stub;
        return __generator(this, function (_a) {
            authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return [2 /*return*/, Response.json({ error: 'Missing Authorization header. Expected: Bearer namespace:secret' }, { status: 401 })];
            }
            token = authHeader.slice('Bearer '.length);
            lastColonIndex = token.lastIndexOf(':');
            if (lastColonIndex === -1) {
                return [2 /*return*/, Response.json({ error: 'Invalid token format. Expected: namespace:secret' }, { status: 401 })];
            }
            namespace = token.slice(0, lastColonIndex);
            providedSecret = token.slice(lastColonIndex + 1);
            if (!namespace) {
                return [2 /*return*/, Response.json({ error: 'Empty namespace in token' }, { status: 401 })];
            }
            expectedSecret = typeof options.secret === 'function'
                ? options.secret(env)
                : options.secret;
            // Runtime validation for dynamic secrets
            if (expectedSecret.includes(':')) {
                return [2 /*return*/, Response.json({ error: 'Server configuration error: secret must not contain ":"' }, { status: 500 })];
            }
            if (!timingSafeEqual(providedSecret, expectedSecret)) {
                return [2 /*return*/, Response.json({ error: 'Invalid secret' }, { status: 403 })];
            }
            stub = options.getStub({ namespace: namespace, env: env });
            return [2 /*return*/, stub.hranaHandler(request)];
        });
    }); };
}
function timingSafeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    var mismatch = 0;
    for (var i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}
