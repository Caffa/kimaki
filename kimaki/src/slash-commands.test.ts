// Dynamic slash command names: Discord allows lowercase [a-z0-9-] names of
// at most 32 chars and 100 commands per guild.

import { expect, test } from 'vitest'

import { attachCommandIds, buildCommands, buildGlobalEssentials, budgetRetryMs, createInteractionRegistry } from './slash-commands.ts'

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

test('budgetRetryMs: honors retry_after, fallback doubles capped at 6h', () => {
  // Honors Discord's retry_after exactly when present.
  expect(budgetRetryMs(120_000, 0)).toBe(120_000)
  expect(budgetRetryMs(3_600_000, 3)).toBe(3_600_000)
  // Fallback: 1h, doubling, capped at 6h.
  expect(budgetRetryMs(null, 0)).toBe(3_600_000)
  expect(budgetRetryMs(null, 1)).toBe(7_200_000)
  expect(budgetRetryMs(null, 2)).toBe(14_400_000)
  expect(budgetRetryMs(null, 3)).toBe(21_600_000)
  expect(budgetRetryMs(null, 4)).toBe(21_600_000)
  // undefined treated as absent.
  expect(budgetRetryMs(undefined, 0)).toBe(3_600_000)
  // 0 is falsy: treated as absent (no retry_after).
  expect(budgetRetryMs(0, 0)).toBe(3_600_000)
})
