// Lean gate: fails when an upstream merge re-fattens the untagged prompt
// sections (## starting new sessions from CLI, ## scheduled sends and
// routines, ## reading other sessions) that were re-stubbed on 2026-11-17.
// The lean reference text lives in ~/.opencode/skills/kimaki-ops/SKILL.md and
// patches/system-prompt-lean.patch restores it after a merge.

import { expect, test } from 'vitest'

import { baseInstructions, type InstructionAgent } from './system-prompt.ts'

// Measured 2026-11-17 with this exact fixture (19 stub agents, null optional
// params): 24,928 chars. Threshold = measured + 20% headroom, capped below 30000.
const LEAN_GATE_CHARS = 29913

const stubAgents: InstructionAgent[] = [
  'agent-01', 'agent-02', 'agent-03', 'agent-04', 'agent-05', 'agent-06',
  'agent-07', 'agent-08', 'agent-09', 'agent-10', 'agent-11', 'agent-12',
  'agent-13', 'agent-14', 'agent-15', 'agent-16', 'agent-17', 'agent-18',
  'agent-19',
].map((name) => ({ name, description: '' }))

test('base instructions stay under the lean gate (19 stub agents, null optional params)', () => {
  const instructions = baseInstructions({
    sessionId: 'ses_probe_stub_session_0123456789abcdef',
    threadId: '1234567890123456789',
    channelId: '9876543210987654321',
    guildId: '111222333444555666',
    userId: '555444333222111000',
    dataDir: '/Users/caffae/.kimaki',
    channelTopic: 'Probe topic',
    agents: stubAgents,
    parentSessionId: null,
    scheduledTask: null,
    coordinator: false,
  })
  expect(
    instructions.length,
    'kimaki base instructions re-fattened beyond the lean gate — upstream merge re-added stubbed sections',
  ).toBeLessThan(LEAN_GATE_CHARS)
})
