"use strict";
// Executor adapter for Cloudflare Durable Object SQLite storage.
// Synchronous — ctx.storage.sql.exec() returns a synchronous cursor.
//
// Usage:
//   import { durableObjectExecutor } from 'libsqlproxy'
//   const executor = durableObjectExecutor(ctx.storage)
//
// Important: CF DO sql.exec() cannot use BEGIN TRANSACTION directly.
// The executor wraps batch operations normally; if transactions are needed,
// use ctx.storage.transactionSync() at a higher level.
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
exports.durableObjectExecutor = durableObjectExecutor;
var values_ts_1 = require("./values.ts");
// Detect readonly queries by checking the SQL verb.
// rowsWritten === 0 is unreliable for DDL/PRAGMA/no-op writes.
// WITH (CTE) can be writable: "WITH ... INSERT/UPDATE/DELETE ..."
// so we check if the CTE body contains a write verb after the final closing paren.
var READONLY_PREFIXES = ['SELECT', 'EXPLAIN', 'PRAGMA'];
var WRITE_VERBS = ['INSERT', 'UPDATE', 'DELETE', 'REPLACE', 'CREATE', 'DROP', 'ALTER'];
function isReadonlyQuery(sql) {
    var upper = sql.trimStart().toUpperCase();
    if (READONLY_PREFIXES.some(function (p) { return upper.startsWith(p); })) {
        return true;
    }
    // WITH CTEs: readonly only if the final statement is SELECT
    if (upper.startsWith('WITH')) {
        return !WRITE_VERBS.some(function (v) { return upper.includes(v); });
    }
    return false;
}
function durableObjectExecutor(storage) {
    var sql = storage.sql;
    return {
        executeSql: function (sqlQuery, params) {
            var cursor = sql.exec.apply(sql, __spreadArray([sqlQuery], params, false));
            var columnNames = cursor.columnNames;
            var rows = cursor.toArray();
            var isRead = isReadonlyQuery(sqlQuery);
            if (isRead) {
                return {
                    cols: columnNames.map(function (name) { return ({ name: name, decltype: null }); }),
                    rows: rows.map(function (row) {
                        return columnNames.map(function (name) { return (0, values_ts_1.encodeHranaValue)(row[name]); });
                    }),
                    affected_row_count: 0,
                    last_insert_rowid: null,
                };
            }
            // For write queries, CF doesn't expose lastInsertRowid directly via sql.exec.
            // We query it separately.
            var lastRowId = null;
            try {
                var ridCursor = sql.exec('SELECT last_insert_rowid() as rid');
                var ridRow = ridCursor.toArray()[0];
                if (ridRow && ridRow['rid'] != null) {
                    lastRowId = String(ridRow['rid']);
                }
            }
            catch (_a) {
                console.warn('libsqlproxy: failed to query last_insert_rowid()');
            }
            return {
                cols: columnNames.map(function (name) { return ({ name: name, decltype: null }); }),
                rows: rows.map(function (row) {
                    return columnNames.map(function (name) { return (0, values_ts_1.encodeHranaValue)(row[name]); });
                }),
                affected_row_count: cursor.rowsWritten,
                last_insert_rowid: lastRowId,
            };
        },
        execRaw: function (sqlQuery) {
            sql.exec(sqlQuery);
        },
        describe: function (sqlQuery) {
            // CF sql.exec doesn't have a "describe without executing" mode.
            // We use EXPLAIN to get column info without side effects.
            var isExplain = sqlQuery.trimStart().toUpperCase().startsWith('EXPLAIN');
            var isRead = isReadonlyQuery(sqlQuery);
            try {
                var cursor = sql.exec("EXPLAIN ".concat(sqlQuery));
                var columnNames = cursor.columnNames;
                return {
                    params: [],
                    cols: columnNames.map(function (name) { return ({ name: name, decltype: null }); }),
                    is_explain: isExplain,
                    is_readonly: isRead,
                };
            }
            catch (_a) {
                console.warn('libsqlproxy: EXPLAIN failed for describe, returning empty cols');
                return {
                    params: [],
                    cols: [],
                    is_explain: isExplain,
                    is_readonly: isRead,
                };
            }
        },
    };
}
