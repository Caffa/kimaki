"use strict";
// Computes opencode permission.skill rules from kimaki's --enable-skill /
// --disable-skill CLI flags.
//
// OpenCode filters skills available to the model via
// Permission.evaluate("skill", skill.name, agent.permission). We inject a
// top-level permission.skill ruleset into the generated opencode-config.json
// so every agent inherits the same whitelist/blacklist via Permission.merge.
//
// Whitelist mode: { '*': 'deny', 'name': 'allow', ... }
// Blacklist mode: { 'name': 'deny', ... }
// Neither set:    undefined (skills are unfiltered)
//
// cli.ts validates mutual exclusion of the two flags at startup, so this
// helper assumes at most one of the two arrays is non-empty.
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSkillPermission = computeSkillPermission;
function computeSkillPermission(_a) {
    var enabledSkills = _a.enabledSkills, disabledSkills = _a.disabledSkills;
    if (enabledSkills.length > 0) {
        var rules = { '*': 'deny' };
        for (var _i = 0, enabledSkills_1 = enabledSkills; _i < enabledSkills_1.length; _i++) {
            var name_1 = enabledSkills_1[_i];
            rules[name_1] = 'allow';
        }
        return rules;
    }
    if (disabledSkills.length > 0) {
        var rules = {};
        for (var _b = 0, disabledSkills_1 = disabledSkills; _b < disabledSkills_1.length; _b++) {
            var name_2 = disabledSkills_1[_b];
            rules[name_2] = 'deny';
        }
        return rules;
    }
    return undefined;
}
