"use strict";
// Node-targeted Prisma client factory for db package consumers.
// Uses the Node runtime-generated Prisma client with @prisma/adapter-pg.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = void 0;
exports.createPrisma = createPrisma;
var pg_1 = require("pg");
var adapter_pg_1 = require("@prisma/adapter-pg");
var client_js_1 = require("./generated/node/client.js");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_js_1.PrismaClient; } });
function createPrisma(connectionString) {
    var url = connectionString || process.env['DATABASE_URL'];
    var pool = new pg_1.default.Pool({ connectionString: url });
    var adapter = new adapter_pg_1.PrismaPg(pool);
    return new client_js_1.PrismaClient({ adapter: adapter });
}
