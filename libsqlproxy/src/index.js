"use strict";
// libsqlproxy — Runtime-agnostic Hrana v2 HTTP server for SQLite.
//
// Expose any SQLite database via the libSQL remote protocol.
// Works with Cloudflare Durable Objects, Node.js libsql, better-sqlite3,
// or any custom SQL driver via the LibsqlExecutor interface.
//
// Auth model for multi-tenant (Cloudflare Workers):
//   Bearer token = "namespace:secret"
//   Client: createClient({ url: 'https://libsql.example.com', authToken: 'ns-id:secret' })
//
// Hrana v2 spec: https://github.com/tursodatabase/libsql/blob/main/docs/HTTP_V2_SPEC.md
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeHranaParams = exports.decodeHranaValue = exports.encodeHranaValue = exports.evaluateHranaCondition = exports.processHranaRequest = exports.createLibsqlProxy = exports.createLibsqlNodeHandler = exports.durableObjectExecutor = exports.libsqlExecutor = exports.createLibsqlHandler = void 0;
// Core handler
var handler_ts_1 = require("./handler.ts");
Object.defineProperty(exports, "createLibsqlHandler", { enumerable: true, get: function () { return handler_ts_1.createLibsqlHandler; } });
var libsql_executor_ts_1 = require("./libsql-executor.ts");
Object.defineProperty(exports, "libsqlExecutor", { enumerable: true, get: function () { return libsql_executor_ts_1.libsqlExecutor; } });
var durable_object_executor_ts_1 = require("./durable-object-executor.ts");
Object.defineProperty(exports, "durableObjectExecutor", { enumerable: true, get: function () { return durable_object_executor_ts_1.durableObjectExecutor; } });
// Node.js http adapter
var node_handler_ts_1 = require("./node-handler.ts");
Object.defineProperty(exports, "createLibsqlNodeHandler", { enumerable: true, get: function () { return node_handler_ts_1.createLibsqlNodeHandler; } });
// Cloudflare Worker proxy
var proxy_ts_1 = require("./proxy.ts");
Object.defineProperty(exports, "createLibsqlProxy", { enumerable: true, get: function () { return proxy_ts_1.createLibsqlProxy; } });
// Protocol internals (for advanced use / testing)
var protocol_ts_1 = require("./protocol.ts");
Object.defineProperty(exports, "processHranaRequest", { enumerable: true, get: function () { return protocol_ts_1.processHranaRequest; } });
Object.defineProperty(exports, "evaluateHranaCondition", { enumerable: true, get: function () { return protocol_ts_1.evaluateHranaCondition; } });
var values_ts_1 = require("./values.ts");
Object.defineProperty(exports, "encodeHranaValue", { enumerable: true, get: function () { return values_ts_1.encodeHranaValue; } });
Object.defineProperty(exports, "decodeHranaValue", { enumerable: true, get: function () { return values_ts_1.decodeHranaValue; } });
Object.defineProperty(exports, "decodeHranaParams", { enumerable: true, get: function () { return values_ts_1.decodeHranaParams; } });
