// agentSelection retries: a cold OpenCode location answers integration.list
// before markdown/plugin agents land in agent.list (anomalyco/opencode#51282),
// so a saved channel agent was rejected with "is not available in this project".

import { describe, expect, test } from 'vitest'

import { agentSelection, type AgentListItem } from './sessions.ts'

function agent(id: string, name = id): AgentListItem {
  return { id, name, mode: 'primary', hidden: false, model: null } as unknown as AgentListItem
}

type Client = {
  integration: { list: (input?: unknown) => Promise<{ data?: unknown[] }> }
  agent: { list: (input?: unknown) => Promise<{ data: AgentListItem[] }> }
}

// A bot stub: agentSelection only reaches the OpenCode client via oc().
function botWith(client: Client) {
  return { opencode: { endpoint: { client } } } as Parameters<typeof agentSelection>[0]
}

describe('agentSelection', () => {
  test('a provided list that contains the agent wins without touching OpenCode', async () => {
    let calls = 0
    const client: Client = {
      integration: { list: async () => (calls++, {}) },
      agent: { list: async () => (calls++, { data: [agent('norm-orchestrator')] }) },
    }
    const result = await agentSelection(botWith(client), {
      directory: '/repo',
      agent: 'norm-orchestrator',
      agents: [agent('build'), agent('norm-orchestrator')],
    })
    expect(calls).toBe(0)
    expect(result).toMatchObject({ agent: 'norm-orchestrator' })
  })

  test('a cold catalog is refreshed until the agent appears', async () => {
    const builtins = [agent('build'), agent('plan')]
    const full = [...builtins, agent('norm-orchestrator', 'Norm Orchestrator')]
    let agentCalls = 0
    let integrationCalls = 0
    const client: Client = {
      integration: { list: async () => (integrationCalls++, {}) },
      agent: {
        list: async () => {
          agentCalls++
          return { data: agentCalls < 3 ? builtins : full }
        },
      },
    }
    const result = await agentSelection(botWith(client), { directory: '/repo', agent: 'norm-orchestrator' })
    expect(result).toMatchObject({ agent: 'norm-orchestrator' })
    expect(result instanceof Error).toBe(false)
    // Name matching is also retried: the last list knew it by name only.
    expect(agentCalls).toBe(3)
    expect(integrationCalls).toBe(3)
  })

  test('an agent the catalog never reports is rejected after the retries', async () => {
    const builtins = [agent('build'), agent('plan')]
    let agentCalls = 0
    const client: Client = {
      integration: { list: async () => ({}) },
      agent: {
        list: async () => {
          agentCalls++
          return { data: builtins }
        },
      },
    }
    const result = await agentSelection(botWith(client), { directory: '/repo', agent: 'norm-orchestrator' })
    expect(result).toBeInstanceOf(Error)
    expect((result as Error).message).toContain('is not available in this project')
    expect(agentCalls).toBe(5)
  })

  test('case-insensitive match on id and name', async () => {
    const client: Client = {
      integration: { list: async () => ({}) },
      agent: { list: async () => ({ data: [agent('norm-orchestrator', 'Norm Orchestrator'), agent('build')] }) },
    }
    const byId = await agentSelection(botWith(client), { directory: '/repo', agent: 'NORM-ORCHESTRATOR' })
    expect(byId).toMatchObject({ agent: 'norm-orchestrator' })
    const byName = await agentSelection(botWith(client), { directory: '/repo', agent: 'norm orchestrator' })
    expect(byName).toMatchObject({ agent: 'norm-orchestrator' })
  })
})
