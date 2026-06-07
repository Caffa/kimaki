"use strict";
// Forum sync module entry point.
// Re-exports the public API for forum <-> markdown synchronization.
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncFilesToForum = exports.syncForumToFiles = exports.stopConfiguredForumSync = exports.startConfiguredForumSync = void 0;
var watchers_js_1 = require("./watchers.js");
Object.defineProperty(exports, "startConfiguredForumSync", { enumerable: true, get: function () { return watchers_js_1.startConfiguredForumSync; } });
Object.defineProperty(exports, "stopConfiguredForumSync", { enumerable: true, get: function () { return watchers_js_1.stopConfiguredForumSync; } });
var sync_to_files_js_1 = require("./sync-to-files.js");
Object.defineProperty(exports, "syncForumToFiles", { enumerable: true, get: function () { return sync_to_files_js_1.syncForumToFiles; } });
var sync_to_discord_js_1 = require("./sync-to-discord.js");
Object.defineProperty(exports, "syncFilesToForum", { enumerable: true, get: function () { return sync_to_discord_js_1.syncFilesToForum; } });
