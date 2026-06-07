"use strict";
// Typed Fly API error classes and HTTP/GraphQL error mapping helpers.
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
exports.FlyGraphQLError = exports.FlyInternalServerError = exports.FlyUnprocessableEntityError = exports.FlyPreconditionFailedError = exports.FlyNotFoundError = exports.FlyUnauthorizedError = exports.FlyBadRequestError = exports.FlyApiError = void 0;
exports.parseErrorResponsePayload = parseErrorResponsePayload;
exports.createFlyHttpError = createFlyHttpError;
exports.createFlyGraphQLError = createFlyGraphQLError;
var errore = require("errore");
var FlyApiError = /** @class */ (function (_super) {
    __extends(FlyApiError, _super);
    function FlyApiError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FlyApiError;
}(errore.createTaggedError({
    name: 'FlyApiError',
    message: 'Fly API request failed for $method $path with status $httpStatus',
})));
exports.FlyApiError = FlyApiError;
var FlyBadRequestError = /** @class */ (function (_super) {
    __extends(FlyBadRequestError, _super);
    function FlyBadRequestError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FlyBadRequestError;
}(errore.createTaggedError({
    name: 'FlyBadRequestError',
    message: 'Fly API returned 400 for $method $path',
})));
exports.FlyBadRequestError = FlyBadRequestError;
var FlyUnauthorizedError = /** @class */ (function (_super) {
    __extends(FlyUnauthorizedError, _super);
    function FlyUnauthorizedError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FlyUnauthorizedError;
}(errore.createTaggedError({
    name: 'FlyUnauthorizedError',
    message: 'Fly API returned 401 for $method $path',
})));
exports.FlyUnauthorizedError = FlyUnauthorizedError;
var FlyNotFoundError = /** @class */ (function (_super) {
    __extends(FlyNotFoundError, _super);
    function FlyNotFoundError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FlyNotFoundError;
}(errore.createTaggedError({
    name: 'FlyNotFoundError',
    message: 'Fly API returned 404 for $method $path',
})));
exports.FlyNotFoundError = FlyNotFoundError;
var FlyPreconditionFailedError = /** @class */ (function (_super) {
    __extends(FlyPreconditionFailedError, _super);
    function FlyPreconditionFailedError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FlyPreconditionFailedError;
}(errore.createTaggedError({
    name: 'FlyPreconditionFailedError',
    message: 'Fly API returned 412 for $method $path',
})));
exports.FlyPreconditionFailedError = FlyPreconditionFailedError;
var FlyUnprocessableEntityError = /** @class */ (function (_super) {
    __extends(FlyUnprocessableEntityError, _super);
    function FlyUnprocessableEntityError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FlyUnprocessableEntityError;
}(errore.createTaggedError({
    name: 'FlyUnprocessableEntityError',
    message: 'Fly API returned 422 for $method $path',
})));
exports.FlyUnprocessableEntityError = FlyUnprocessableEntityError;
var FlyInternalServerError = /** @class */ (function (_super) {
    __extends(FlyInternalServerError, _super);
    function FlyInternalServerError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FlyInternalServerError;
}(errore.createTaggedError({
    name: 'FlyInternalServerError',
    message: 'Fly API returned 500 for $method $path',
})));
exports.FlyInternalServerError = FlyInternalServerError;
var FlyGraphQLError = /** @class */ (function (_super) {
    __extends(FlyGraphQLError, _super);
    function FlyGraphQLError() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return FlyGraphQLError;
}(errore.createTaggedError({
    name: 'FlyGraphQLError',
    message: 'Fly GraphQL request failed for $path: $messages',
})));
exports.FlyGraphQLError = FlyGraphQLError;
function parseErrorResponsePayload(_a) {
    var payload = _a.payload;
    if (!isObject(payload)) {
        return null;
    }
    var details = isObject(payload.details) ? payload.details : undefined;
    var error = typeof payload.error === 'string' ? payload.error : undefined;
    var status = isMainStatusCode(payload.status) ? payload.status : undefined;
    return { details: details, error: error, status: status };
}
function createFlyHttpError(_a) {
    var method = _a.method, path = _a.path, httpStatus = _a.httpStatus, payload = _a.payload;
    parseErrorResponsePayload({ payload: payload });
    if (httpStatus === 400) {
        return new FlyBadRequestError({ method: method, path: path });
    }
    if (httpStatus === 401) {
        return new FlyUnauthorizedError({ method: method, path: path });
    }
    if (httpStatus === 404) {
        return new FlyNotFoundError({ method: method, path: path });
    }
    if (httpStatus === 412) {
        return new FlyPreconditionFailedError({ method: method, path: path });
    }
    if (httpStatus === 422) {
        return new FlyUnprocessableEntityError({ method: method, path: path });
    }
    if (httpStatus === 500) {
        return new FlyInternalServerError({ method: method, path: path });
    }
    return new FlyApiError({ method: method, path: path, httpStatus: httpStatus });
}
function createFlyGraphQLError(_a) {
    var path = _a.path, messages = _a.messages;
    return new FlyGraphQLError({
        path: path,
        messages: messages.join('; '),
    });
}
function isObject(value) {
    return typeof value === 'object' && value !== null;
}
function isMainStatusCode(value) {
    return value === 'unknown' || value === 'insufficient_capacity';
}
