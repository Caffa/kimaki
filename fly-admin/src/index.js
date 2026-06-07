"use strict";
// fly-admin — TypeScript client for Fly Machines REST and GraphQL APIs.
// Vendored fork of supabase/fly-admin. Uses native fetch, adds exec/releaseLease/metadata.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Volume = exports.Secret = exports.Token = exports.Regions = exports.Organization = exports.AddressType = exports.Network = exports.ConnectionHandler = exports.MachineState = exports.Machine = exports.AppStatus = exports.App = exports.FlyGraphQLError = exports.FlyInternalServerError = exports.FlyUnprocessableEntityError = exports.FlyPreconditionFailedError = exports.FlyNotFoundError = exports.FlyUnauthorizedError = exports.FlyBadRequestError = exports.FlyApiError = exports.FLY_API_HOSTNAME = exports.FLY_API_GRAPHQL = exports.Client = void 0;
exports.createClient = createClient;
var client_ts_1 = require("./client.ts");
Object.defineProperty(exports, "Client", { enumerable: true, get: function () { return client_ts_1.Client; } });
Object.defineProperty(exports, "FLY_API_GRAPHQL", { enumerable: true, get: function () { return client_ts_1.FLY_API_GRAPHQL; } });
Object.defineProperty(exports, "FLY_API_HOSTNAME", { enumerable: true, get: function () { return client_ts_1.FLY_API_HOSTNAME; } });
var errors_ts_1 = require("./errors.ts");
Object.defineProperty(exports, "FlyApiError", { enumerable: true, get: function () { return errors_ts_1.FlyApiError; } });
Object.defineProperty(exports, "FlyBadRequestError", { enumerable: true, get: function () { return errors_ts_1.FlyBadRequestError; } });
Object.defineProperty(exports, "FlyUnauthorizedError", { enumerable: true, get: function () { return errors_ts_1.FlyUnauthorizedError; } });
Object.defineProperty(exports, "FlyNotFoundError", { enumerable: true, get: function () { return errors_ts_1.FlyNotFoundError; } });
Object.defineProperty(exports, "FlyPreconditionFailedError", { enumerable: true, get: function () { return errors_ts_1.FlyPreconditionFailedError; } });
Object.defineProperty(exports, "FlyUnprocessableEntityError", { enumerable: true, get: function () { return errors_ts_1.FlyUnprocessableEntityError; } });
Object.defineProperty(exports, "FlyInternalServerError", { enumerable: true, get: function () { return errors_ts_1.FlyInternalServerError; } });
Object.defineProperty(exports, "FlyGraphQLError", { enumerable: true, get: function () { return errors_ts_1.FlyGraphQLError; } });
var app_ts_1 = require("./app.ts");
Object.defineProperty(exports, "App", { enumerable: true, get: function () { return app_ts_1.App; } });
Object.defineProperty(exports, "AppStatus", { enumerable: true, get: function () { return app_ts_1.AppStatus; } });
var machine_ts_1 = require("./machine.ts");
Object.defineProperty(exports, "Machine", { enumerable: true, get: function () { return machine_ts_1.Machine; } });
Object.defineProperty(exports, "MachineState", { enumerable: true, get: function () { return machine_ts_1.MachineState; } });
Object.defineProperty(exports, "ConnectionHandler", { enumerable: true, get: function () { return machine_ts_1.ConnectionHandler; } });
var network_ts_1 = require("./network.ts");
Object.defineProperty(exports, "Network", { enumerable: true, get: function () { return network_ts_1.Network; } });
Object.defineProperty(exports, "AddressType", { enumerable: true, get: function () { return network_ts_1.AddressType; } });
var organization_ts_1 = require("./organization.ts");
Object.defineProperty(exports, "Organization", { enumerable: true, get: function () { return organization_ts_1.Organization; } });
var regions_ts_1 = require("./regions.ts");
Object.defineProperty(exports, "Regions", { enumerable: true, get: function () { return regions_ts_1.Regions; } });
var token_ts_1 = require("./token.ts");
Object.defineProperty(exports, "Token", { enumerable: true, get: function () { return token_ts_1.Token; } });
var secret_ts_1 = require("./secret.ts");
Object.defineProperty(exports, "Secret", { enumerable: true, get: function () { return secret_ts_1.Secret; } });
var volume_ts_1 = require("./volume.ts");
Object.defineProperty(exports, "Volume", { enumerable: true, get: function () { return volume_ts_1.Volume; } });
function createClient(input) {
    return new client_ts_2.Client(input);
}
// Re-export Client as default for backwards compat with supabase/fly-admin
var client_ts_2 = require("./client.ts");
exports.default = client_ts_2.Client;
