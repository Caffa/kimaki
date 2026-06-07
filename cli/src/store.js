"use strict";
// Centralized zustand/vanilla store for global bot state.
// Replaces scattered module-level `let` variables, process.env mutations,
// and mutable arrays with a single immutable state atom.
// See skills/zustand-centralized-state/SKILL.md for the pattern.
Object.defineProperty(exports, "__esModule", { value: true });
exports.store = void 0;
var vanilla_1 = require("zustand/vanilla");
exports.store = (0, vanilla_1.createStore)(function () { return ({
    dataDir: null,
    projectsDir: null,
    defaultVerbosity: 'text_and_essential_tools',
    defaultMentionMode: false,
    critiqueEnabled: true,
    enabledSkills: [],
    disabledSkills: [],
    discordBaseUrl: 'https://discord.com',
    gatewayToken: null,
    registeredUserCommands: [],
    threads: new Map(),
    test: { deterministicTranscription: null },
}); });
