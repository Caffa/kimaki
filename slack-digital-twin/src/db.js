"use strict";
// Prisma client initialization with in-memory libsql.
// Uses cache=shared so libsql's transaction() doesn't create a separate
// empty in-memory DB (see discord-digital-twin/src/db.ts for details).
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = void 0;
exports.createPrismaClient = createPrismaClient;
var adapter_libsql_1 = require("@prisma/adapter-libsql");
var client_js_1 = require("./generated/client.js");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_js_1.PrismaClient; } });
function createPrismaClient(dbUrl) {
    var url = dbUrl !== null && dbUrl !== void 0 ? dbUrl : 'file::memory:?cache=shared';
    var adapter = new adapter_libsql_1.PrismaLibSql({ url: url });
    return new client_js_1.PrismaClient({ adapter: adapter });
}
