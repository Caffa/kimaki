"use strict";
// Generated types from Fly Machines OpenAPI spec.
// Originally produced by swagger-typescript-api from supabase/fly-admin.
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateEnum = exports.ApiMachineRestartPolicyEnum = exports.SignalRequestSignalEnum = exports.MainStatusCode = void 0;
var MainStatusCode;
(function (MainStatusCode) {
    MainStatusCode["Unknown"] = "unknown";
    MainStatusCode["CapacityErr"] = "insufficient_capacity";
})(MainStatusCode || (exports.MainStatusCode = MainStatusCode = {}));
var SignalRequestSignalEnum;
(function (SignalRequestSignalEnum) {
    SignalRequestSignalEnum["SIGABRT"] = "SIGABRT";
    SignalRequestSignalEnum["SIGALRM"] = "SIGALRM";
    SignalRequestSignalEnum["SIGFPE"] = "SIGFPE";
    SignalRequestSignalEnum["SIGHUP"] = "SIGHUP";
    SignalRequestSignalEnum["SIGILL"] = "SIGILL";
    SignalRequestSignalEnum["SIGINT"] = "SIGINT";
    SignalRequestSignalEnum["SIGKILL"] = "SIGKILL";
    SignalRequestSignalEnum["SIGPIPE"] = "SIGPIPE";
    SignalRequestSignalEnum["SIGQUIT"] = "SIGQUIT";
    SignalRequestSignalEnum["SIGSEGV"] = "SIGSEGV";
    SignalRequestSignalEnum["SIGTERM"] = "SIGTERM";
    SignalRequestSignalEnum["SIGTRAP"] = "SIGTRAP";
    SignalRequestSignalEnum["SIGUSR1"] = "SIGUSR1";
})(SignalRequestSignalEnum || (exports.SignalRequestSignalEnum = SignalRequestSignalEnum = {}));
var ApiMachineRestartPolicyEnum;
(function (ApiMachineRestartPolicyEnum) {
    ApiMachineRestartPolicyEnum["No"] = "no";
    ApiMachineRestartPolicyEnum["Always"] = "always";
    ApiMachineRestartPolicyEnum["OnFailure"] = "on-failure";
    ApiMachineRestartPolicyEnum["SpotPrice"] = "spot-price";
})(ApiMachineRestartPolicyEnum || (exports.ApiMachineRestartPolicyEnum = ApiMachineRestartPolicyEnum = {}));
var StateEnum;
(function (StateEnum) {
    StateEnum["Created"] = "created";
    StateEnum["Started"] = "started";
    StateEnum["Stopped"] = "stopped";
    StateEnum["Suspended"] = "suspended";
    StateEnum["Destroyed"] = "destroyed";
    StateEnum["Failed"] = "failed";
    StateEnum["Settled"] = "settled";
})(StateEnum || (exports.StateEnum = StateEnum = {}));
