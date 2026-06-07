"use strict";
// Prisma client initialization with in-memory libsql.
// Vitest runs each test file in a separate worker thread, so all
// instances within the same file share file::memory:?cache=shared
// and cross-file isolation comes from separate processes/threads.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = void 0;
exports.createPrismaClient = createPrismaClient;
var adapter_libsql_1 = require("@prisma/adapter-libsql");
var client_js_1 = require("./generated/client.js");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_js_1.PrismaClient; } });
function createPrismaClient(dbUrl) {
    // cache=shared is required because libsql's transaction() creates a
    // new Database() internally. Without shared cache, the new connection
    // gets a separate empty in-memory DB, silently breaking upsert/$transaction.
    // The old `mode=memory` URL param is not supported by @prisma/adapter-libsql.
    // Pass a file: URL (e.g. "file:./test.db") for persistent/debuggable storage.
    var url = dbUrl !== null && dbUrl !== void 0 ? dbUrl : 'file::memory:?cache=shared';
    var adapter = new adapter_libsql_1.PrismaLibSql({ url: url });
    return new client_js_1.PrismaClient({ adapter: adapter });
}
