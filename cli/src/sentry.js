"use strict";
// Sentry stubs. @sentry/node was removed — these are no-op placeholders
// so the 20+ files importing notifyError/initSentry don't need changing.
// If Sentry is re-enabled in the future, replace these stubs with real calls.
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.initSentry = initSentry;
exports.notifyError = notifyError;
/**
 * Initialize Sentry. Currently a no-op.
 */
function initSentry(_opts) { }
/**
 * Report an unexpected error. Currently a no-op.
 * Safe to call even if Sentry is not initialized.
 * Fire-and-forget only: use `void notifyError(error, msg)` and never await it.
 */
function notifyError(_error, _msg) { }
/**
 * User-readable error class. Messages from AppError instances
 * are forwarded to the user as-is; regular Error messages may be obfuscated.
 */
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(message) {
        var _this = _super.call(this, message) || this;
        _this.name = 'AppError';
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
