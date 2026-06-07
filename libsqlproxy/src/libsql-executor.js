"use strict";
// Executor adapter for the `libsql` npm package (better-sqlite3 compatible API).
// Synchronous — all methods return values directly.
//
// Usage:
//   import Database from 'libsql'
//   const executor = libsqlExecutor(new Database('path.db'))
Object.defineProperty(exports, "__esModule", { value: true });
exports.libsqlExecutor = libsqlExecutor;
var values_ts_1 = require("./values.ts");
function libsqlExecutor(database) {
    return {
        executeSql: function (sql, params) {
            var prepared = database.prepare(sql);
            if (prepared.reader) {
                var cols_1 = prepared.columns();
                var rows = prepared.all.apply(prepared, params);
                return {
                    cols: cols_1.map(function (c) { return ({ name: c.name, decltype: c.type }); }),
                    rows: rows.map(function (row) {
                        var r = row;
                        return cols_1.map(function (c) { return (0, values_ts_1.encodeHranaValue)(r[c.name]); });
                    }),
                    affected_row_count: 0,
                    last_insert_rowid: null,
                };
            }
            var result = prepared.run.apply(prepared, params);
            return {
                cols: [],
                rows: [],
                affected_row_count: result.changes,
                last_insert_rowid: result.lastInsertRowid != null ? result.lastInsertRowid.toString() : null,
            };
        },
        execRaw: function (sql) {
            database.exec(sql);
        },
        describe: function (sql) {
            var prepared = database.prepare(sql);
            var cols = prepared.columns();
            // libsql/better-sqlite3 doesn't expose parameter info directly,
            // so we return empty params and infer from the columns
            var isExplain = sql.trimStart().toUpperCase().startsWith('EXPLAIN');
            return {
                params: [],
                cols: cols.map(function (c) { return ({ name: c.name, decltype: c.type }); }),
                is_explain: isExplain,
                is_readonly: prepared.reader,
            };
        },
    };
}
