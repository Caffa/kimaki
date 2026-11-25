// Dynamic slash command names: Discord allows lowercase [a-z0-9-] names of
// at most 32 chars and 100 commands per guild.

import { expect, test } from 'vitest'

import { attachCommandIds, buildCommands, buildGlobalEssentials, budgetRetryMs, createInteractionRegistry, diffCommands } from './slash-commands.ts'
import type { LiveCommand, LiveOption } from './slash-commands.ts'

test('catalog names are sanitized, keep their suffix, skip collisions and MCP prompts, and stop at the dynamic cap', () => {
  const fixed = createInteractionRegistry().definitions
  const catalog = {
    agents: [
      { id: 'gpt5.4', name: 'GPT 5.4', mode: 'primary', hidden: false },
      { id: 'explore', name: 'Explore', mode: 'subagent', hidden: false },
      { id: 'secret', name: 'Secret', mode: 'primary', hidden: true },
    ],
    commands: [
      { name: 'init' },
      // MCP prompt: no slash command.
      { name: 'github:create-pull-request' },
      { name: 'a-very-long-command-name-that-goes-on-and-on' },
      // Sanitizes to the same Discord name as the one before: the first in name order wins (uppercase sorts first).
      { name: 'A_VERY_LONG_COMMAND_NAME_THAT_GOES_ON_AND_ON' },
      { name: 'queue' },
    ],
    skills: Array.from({ length: 90 }, (_, index) => ({ id: `skill-${index}` })),
  }
  const { commands, dynamic } = buildCommands({ fixed, catalog })
  // OpenCode's list order does not change which commands fit.
  const reversed = buildCommands({
    fixed,
    catalog: { agents: catalog.agents.toReversed(), commands: catalog.commands.toReversed(), skills: catalog.skills.toReversed() },
  })
  expect(reversed.commands).toEqual(commands)
  const names = commands.map((command) => command.name)
  expect(names.length).toBe(81)
  expect(names.filter((name) => !name.startsWith('skill-'))).toMatchInlineSnapshot(`
    [
      "cwd",
      "new-worktree",
      "worktrees",
      "merge-worktree",
      "login",
      "transcription-key",
      "new-session",
      "resume",
      "fork",
      "fork-subagent",
      "btw",
      "abort",
      "reset-coordinator",
      "queue",
      "clear-queue",
      "queue-command",
      "compact",
      "undo",
      "redo",
      "diff",
      "context-usage",
      "session-id",
      "agent",
      "model",
      "model-variant",
      "verbosity",
      "toggle-coordinator",
      "mcp",
      "routines",
      "command",
      "skill",
      "gpt5-4-agent",
      "a-very-long-command-name-tha-cmd",
      "queue-cmd",
    ]
  `)
  expect(names.every((name) => /^[a-z0-9-]{1,32}$/.test(name))).toBe(true)
  expect(Object.fromEntries([...dynamic].filter(([name]) => !name.startsWith('skill-')))).toMatchInlineSnapshot(`
    {
      "a-very-long-command-name-tha-cmd": {
        "kind": "command",
        "name": "A_VERY_LONG_COMMAND_NAME_THAT_GOES_ON_AND_ON",
      },
      "gpt5-4-agent": {
        "kind": "agent",
        "name": "gpt5.4",
      },
      "queue-cmd": {
        "kind": "command",
        "name": "queue",
      },
    }
  `)
  expect(dynamic.has(names[names.length - 1]!)).toBe(true)
})

test('local fork: only agents matching the shortcut filter are registered', () => {
  const fixed = createInteractionRegistry().definitions
  const catalog = {
    agents: [
      { id: 'norm-orchestrator', name: 'Norm', mode: 'primary', hidden: false },
      { id: 'build', name: 'Orchestrator Helper', mode: 'primary', hidden: false },
      { id: 'blueprint-keeper', name: 'Keeper', mode: 'primary', hidden: false },
      { id: 'secret-orchestrator', name: 'Secret', mode: 'primary', hidden: true },
    ],
    commands: [],
    skills: [],
  }
  const { commands } = buildCommands({ fixed, catalog, agentShortcutFilter: 'orchestrator' })
  const names = commands.map((command) => command.name)
  expect(names).toContain('norm-orchestrator-agent')
  // The agent name matches even when the id does not.
  expect(names).toContain('build-agent')
  expect(names).not.toContain('blueprint-keeper-agent')
  // Hidden agents never register, filter or not.
  expect(names).not.toContain('secret-orchestrator-agent')
  // No filter registers everything.
  const all = buildCommands({ fixed, catalog })
  expect(all.commands.map((command) => command.name)).toContain('blueprint-keeper-agent')
})

test('attachCommandIds: name match adds id, no match leaves no id', () => {
  const commands = [{ name: 'agent', description: 'a' }, { name: 'model', description: 'm' }, { name: 'new-cmd', description: 'n' }]
  const liveByName = new Map([['agent', '123'], ['model', '456']])
  const withIds = attachCommandIds(commands, liveByName)
  expect(withIds).toEqual([
    { name: 'agent', description: 'a', id: '123' },
    { name: 'model', description: 'm', id: '456' },
    { name: 'new-cmd', description: 'n' },
  ])
  // Empty live map: no ids attached.
  expect(attachCommandIds(commands, new Map())).toEqual(commands)
})

// Live fixtures as plain objects, like the discord.js ApplicationCommand
// instances the real registerGuild fetch satisfies structurally.
function live(name: string, options: LiveOption[]): LiveCommand {
  return { id: `id-${name}`, name, description: `${name} description`, options }
}

test('diffCommands: an empty live list creates everything', () => {
  const wanted = [{ name: 'agent', description: 'Ask anything' }, { name: 'model', description: 'Pick a model' }, { name: 'queue-cmd', description: 'Queue a command' }]
  const plan = diffCommands({ live: [], wanted })
  expect(plan.creates).toEqual(wanted)
  expect(plan.edits).toEqual([])
  expect(plan.deletes).toEqual([])
})

test('diffCommands: identical description and options send nothing', () => {
  const wanted = [{ name: 'x-cmd', description: 'Run /x', options: [{ type: 3, name: 'arguments', description: 'Arguments', required: false }] }]
  const plan = diffCommands({
    live: [{ ...wanted[0]!, id: '1' }],
    wanted,
  })
  expect(plan).toEqual({ creates: [], edits: [], deletes: [] })
})

test('diffCommands: a changed description edits in place with the live id', () => {
  const wanted = [{ name: 'model', description: 'new' }]
  const plan = diffCommands({ live: [{ id: 'id-model', name: 'model', description: 'old', options: [] }], wanted })
  expect(plan.edits).toEqual([{ id: 'id-model', body: wanted[0] }])
  expect(plan.creates).toEqual([])
  expect(plan.deletes).toEqual([])
})

test('diffCommands: live names that are not wanted are deleted', () => {
  const liveCommands = [live('old-skill', []), live('kept-cmd', [])]
  const wanted = [{ name: 'kept-cmd', description: 'kept-cmd description' }]
  const plan = diffCommands({ live: liveCommands, wanted })
  expect(plan.deletes).toEqual(['id-old-skill'])
  expect(plan.creates).toEqual([])
  expect(plan.edits).toEqual([])
})

// Compares: description + per option, in order — name, type, description,
// required, autocomplete, choices, min/max value and length bounds.
test('diffCommands: option shape changes edit; unchanged and normalized shapes do not', () => {
  // camelCase on live (how discord.js patches) aliases the snake_case bounds
  // of the wanted REST JSON: max_length 6000 equals maxLength 6000.
  const liveCommands = [
    live('merge-worktree', [{ type: 3, name: 'strategy', description: 'Merge strategy', required: false, choices: [{ name: 'Rebase', value: 'rebase' }, { name: 'Squash', value: 'squash' }] }]),
    live('btw', [{ type: 3, name: 'files', description: 'Files', required: false, maxLength: 6000 }]),
    live('new-session', [{ type: 3, name: 'with', description: 'With whom', required: false, autocomplete: true }]),
  ]
  const wanted = [
    { name: 'merge-worktree', description: 'merge-worktree description', options: [{ type: 3, name: 'strategy', description: 'Merge strategy', required: false, choices: [{ name: 'Rebase', value: 'rebase' }, { name: 'Squash', value: 'squash' }] }] },
    { name: 'btw', description: 'btw description', options: [{ type: 3, name: 'files', description: 'Files', required: false, max_length: 6000 }] },
    { name: 'new-session', description: 'new-session description', options: [{ type: 3, name: 'with', description: 'With whom', required: false, autocomplete: true }] },
  ]
  expect(diffCommands({ live: liveCommands, wanted })).toEqual({ creates: [], edits: [], deletes: [] })
  // Absent and false compare equal for required (falsy normalization).
  const normalized = diffCommands({
    live: [{ id: '6', name: 'a', description: 'a', options: [{ type: 3, name: 'x', description: 'x', required: false }] }],
    wanted: [{ name: 'a', description: 'a', options: [{ type: 3, name: 'x', description: 'x' }] }],
  })
  expect(normalized).toEqual({ creates: [], edits: [], deletes: [] })
  // A changed choice value, a different bound, and a changed option count
  // (added option) each edit in place — with the live id.
  const changed = [
    { name: 'merge-worktree', description: 'merge-worktree description', options: [{ type: 3, name: 'strategy', description: 'Merge strategy', required: false, choices: [{ name: 'Rebase', value: 'rebase' }, { name: 'Squash', value: 'svelte' }] }] },
    { name: 'btw', description: 'btw description', options: [{ type: 3, name: 'files', description: 'Files', required: false, max_length: 4000 }] },
    { name: 'new-session', description: 'new-session description', options: [{ type: 3, name: 'with', description: 'With whom', required: true }, { type: 3, name: 'extra', description: 'Extra', required: false }] },
  ]
  const plan = diffCommands({ live: liveCommands, wanted: changed })
  expect(plan.edits).toEqual([
    { id: 'id-merge-worktree', body: changed[0] },
    { id: 'id-btw', body: changed[1] },
    { id: 'id-new-session', body: changed[2] },
  ])
  expect(plan.creates).toEqual([])
  expect(plan.deletes).toEqual([])
})

// The whole built list matches its own live copy — the unchanged-restart path
// with the fork's real option shapes (bounds, choices, autocomplete).
test('diffCommands: the built command list matches its own live copy', () => {
  const fixed = createInteractionRegistry().definitions
  const catalog = {
    agents: [{ id: 'orchestrator', name: 'Orchestrator', mode: 'primary', hidden: false }],
    commands: [{ name: 'hello', description: 'Say hello' }],
    skills: [],
  }
  const { commands } = buildCommands({ fixed, catalog, agentShortcutFilter: 'orchestrator' })
  // The REST JSON bounds become the camelCase fields discord.js patches.
  type OptionJson = { type: number; name: string; description: string; required?: boolean; autocomplete?: boolean; choices?: { name: string; value: string | number }[]; min_value?: number; max_value?: number; min_length?: number; max_length?: number }
  const toLive = (option: OptionJson): LiveOption => ({
    type: option.type,
    name: option.name,
    description: option.description,
    required: option.required ?? false,
    autocomplete: option.autocomplete,
    choices: option.choices,
    minValue: option.min_value,
    maxValue: option.max_value,
    minLength: option.min_length,
    maxLength: option.max_length,
  })
  const liveCommands: LiveCommand[] = commands.map((command) => ({
    id: `id-${command.name}`,
    name: command.name,
    description: command.description,
    options: (command.options ?? []).map(toLive),
  }))
  expect(diffCommands({ live: liveCommands, wanted: commands })).toEqual({ creates: [], edits: [], deletes: [] })
})

test('global essentials: agent, model, queue plus orchestrator shortcuts, respects filter', () => {
  const fixed = createInteractionRegistry().definitions
  const catalog = {
    agents: [
      { id: 'orchestrator', name: 'Orchestrator', mode: 'primary', hidden: false },
      { id: 'build-orchestrator', name: 'Build', mode: 'primary', hidden: false },
      { id: 'other', name: 'Other', mode: 'primary', hidden: false },
    ],
    commands: [{ name: 'init' }, { name: 'test' }],
    skills: [{ id: 'debug' }],
  }
  const { commands, dynamic } = buildGlobalEssentials({ fixed, catalog, agentShortcutFilter: 'orchestrator' })
  const names = commands.map((command) => command.name)
  // Fixed essentials.
  expect(names).toContain('agent')
  expect(names).toContain('model')
  expect(names).toContain('queue')
  // Orchestrator agent shortcuts.
  expect(names).toContain('orchestrator-agent')
  expect(names).toContain('build-orchestrator-agent')
  // Non-matching agent filtered out.
  expect(names).not.toContain('other-agent')
  // No command or skill shortcuts in globals.
  expect(names).not.toContain('init-cmd')
  expect(names).not.toContain('test-cmd')
  expect(names).not.toContain('debug-skill')
  // Dynamic map has the agent shortcuts.
  expect(dynamic.has('orchestrator-agent')).toBe(true)
  expect(dynamic.has('build-orchestrator-agent')).toBe(true)
  // Stable: same catalog produces the same list.
  const again = buildGlobalEssentials({ fixed, catalog, agentShortcutFilter: 'orchestrator' })
  expect(again.commands).toEqual(commands)
})

test('budgetRetryMs: ignores sub-hour retry_after on a saturated budget, ladder doubles capped at 6h', () => {
  // Discord's short retry_after is not the budget free-time: the ladder paces re-probes.
  expect(budgetRetryMs(120_000, 0)).toBe(3_600_000)
  expect(budgetRetryMs(120_000, 3)).toBe(21_600_000)
  // A genuinely long retry_after is honored verbatim.
  expect(budgetRetryMs(3_600_001, 0)).toBe(3_600_001)
  // Exactly 1h is not trusted either (the threshold is strict).
  expect(budgetRetryMs(3_600_000, 3)).toBe(21_600_000)
  // Fallback: 1h, doubling, capped at 6h.
  expect(budgetRetryMs(null, 0)).toBe(3_600_000)
  expect(budgetRetryMs(null, 1)).toBe(7_200_000)
  expect(budgetRetryMs(null, 2)).toBe(14_400_000)
  expect(budgetRetryMs(null, 3)).toBe(21_600_000)
  expect(budgetRetryMs(null, 4)).toBe(21_600_000)
  // Past the cap the ladder stays flat: the counter never resets in here, only in the caller.
  expect(budgetRetryMs(null, 5)).toBe(21_600_000)
  // undefined treated as absent.
  expect(budgetRetryMs(undefined, 0)).toBe(3_600_000)
  // 0 is falsy: treated as absent (no retry_after).
  expect(budgetRetryMs(0, 0)).toBe(3_600_000)
})
