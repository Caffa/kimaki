"use strict";
// Thin re-export shim for backward compatibility.
// Logic lives in:
//   - session-handler/thread-session-runtime.ts (runtime class + registry)
//   - session-handler/thread-runtime-state.ts (state transitions)
//   - session-handler/model-utils.ts (getDefaultModel, types)
//   - session-handler/agent-utils.ts (resolveValidatedAgentPreference)
// New code should import from the specific module directly.
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveValidatedAgentPreference = exports.getDefaultModel = void 0;
var model_utils_js_1 = require("./session-handler/model-utils.js");
Object.defineProperty(exports, "getDefaultModel", { enumerable: true, get: function () { return model_utils_js_1.getDefaultModel; } });
var agent_utils_js_1 = require("./session-handler/agent-utils.js");
Object.defineProperty(exports, "resolveValidatedAgentPreference", { enumerable: true, get: function () { return agent_utils_js_1.resolveValidatedAgentPreference; } });
