"use strict";
// Onboarding welcome message for the default kimaki channel.
// Sends a message explaining what Kimaki is, then creates a thread from it
// so the user can respond there to start a tutorial session.
// Sends a smaller follow-up message inside the thread with the installer
// mention so the notification is less noisy.
// Posted once when the default channel is first created.
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
exports.sendWelcomeMessage = sendWelcomeMessage;
var discord_js_1 = require("discord.js");
var logger_js_1 = require("./logger.js");
var onboarding_tutorial_js_1 = require("./onboarding-tutorial.js");
var logger = (0, logger_js_1.createLogger)(logger_js_1.LogPrefix.CHANNEL);
function buildWelcomeText() {
    return "**Kimaki** lets you code from Discord. Send a message in any project channel and an AI agent edits code, runs commands, and searches your codebase \u2014 all on your machine.\n**What you can do:**\n- Use `/add-project` to create a Discord channel linked to one OpenCode project (git repo)\n- Collaborate with teammates in the same session\n- Upload images and files, the bot can share screenshots back\n".concat(onboarding_tutorial_js_1.TUTORIAL_WELCOME_TEXT);
}
function buildThreadPrompt(_a) {
    var mentionUserId = _a.mentionUserId;
    var mentionSuffix = mentionUserId ? " <@".concat(mentionUserId, ">") : '';
    return "Want to build an example browser game? Respond in this thread.".concat(mentionSuffix);
}
function sendWelcomeMessage(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var message, thread, error_1;
        var channel = _b.channel, mentionUserId = _b.mentionUserId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, channel.send(buildWelcomeText())];
                case 1:
                    message = _c.sent();
                    return [4 /*yield*/, message.startThread({
                            name: 'Kimaki tutorial',
                            autoArchiveDuration: discord_js_1.ThreadAutoArchiveDuration.OneDay,
                            reason: 'Onboarding tutorial thread',
                        })];
                case 2:
                    thread = _c.sent();
                    return [4 /*yield*/, thread.send(buildThreadPrompt({ mentionUserId: mentionUserId }))];
                case 3:
                    _c.sent();
                    logger.log("Sent welcome message with thread to #".concat(channel.name));
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _c.sent();
                    logger.warn("Failed to send welcome message to #".concat(channel.name, ": ").concat(error_1 instanceof Error ? error_1.stack : String(error_1)));
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
