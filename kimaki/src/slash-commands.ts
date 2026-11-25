// Slash commands and component interactions (spec 14). Registered per guild
// with one bulk overwrite (guild-scoped route: gateway-proxy rejects global
// application command routes). Every interaction passes the same permission
// gate as messages, then goes to its handler with one lookup:
//
//   feature files ─▶ InteractionRoutes ─▶ createInteractionRegistry (this file)
//   chat command  ─▶ commands[name]  (else a dynamic command below)
//   button        ─▶ buttons[prefix]   select ─▶ selects[prefix]   modal ─▶ modals[prefix]
//
// Handlers only collect input and call the writers (prompt.ts, sessions.ts,
// ...); session output comes from events.
//
// Dynamic commands come from the global OpenCode catalog: one location (the
// OpenCode global config dir) that loads no project config, so every guild
// gets the same list. Project-only entries stay reachable through /agent, /command, /skill.
//
//   agent.list    primary agents  ─▶ /<agent>-agent prompt?
//   command.list  commands        ─▶ /<cmd>-cmd arguments?
//   skill.list    skills          ─▶ /<skill>-skill arguments?
//
// Local fork: only agents whose id or name matches KIMAKI_AGENT_SHORTCUT_FILTER
// (default 'orchestrator', empty = all) get the agent shortcut.
//
// Like the OpenCode TUI (client/src/solid/data.ts), the catalog is re-read
// when agent/command/skill.updated arrive, and after every reconnect (events
// sent while disconnected are lost):
//
//   agent|command|skill.updated ─▶ read catalog ─▶ buildCommands ─▶ PUT guild commands (if changed)
//   server.connected            ─┘
//
// Commands with a colon get no slash command. OpenCode names MCP prompts
// "server:prompt" and command.list has no source field, so the colon is the
// only way to leave them out. They still run as `/server:prompt args`
// messages and from /queue-command.
//
// Discord allows 100 commands per guild; skills are cut first.

import { isBuiltinSkill } from './builtin-skills.ts'
import {
  Events,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type AutocompleteInteraction,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Guild,
  type Interaction,
  type ModalSubmitInteraction,
  type RESTPostAPIChatInputApplicationCommandsJSONBody,
  type StringSelectMenuInteraction,
} from 'discord.js'

import { agentUiRoutes } from './agent-ui.ts'
import { oc, projectOf, type Bot, type ModelChoice } from './bot.ts'
import { createLoginRoutes } from './commands/login-commands.ts'
import { readFile, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import { mcpRoutes } from './commands/mcp-commands.ts'
import { applyAgent, createPreferenceRoutes, switchModel, variantChoices, variantModel } from './commands/preference-commands.ts'
import { sessionRoutes } from './commands/session-commands.ts'
import { SKIPPED_COMMANDS, threadRoutes } from './commands/thread-commands.ts'
import { worktreeRoutes } from './commands/worktree-commands.ts'
import { ConfigError, DiscordError } from './errors.ts'
import { asSubtext } from './format-parts.ts'
import { canUseKimaki, voiceRetryRoutes } from './ingress.ts'
import {
  authorOf,
  replyError,
  replyWithEcho,
  resolveTarget,
  respondChoices,
  sessionTarget,
  type InteractionHandler,
  type InteractionRoutes,
  type SlashCommand,
} from './interaction-context.ts'
import { createLogger } from './logger.ts'
import { permissionRoutes } from './permissions.ts'
import { dispatch } from './prompt.ts'
import { createQuestionHandlers } from './questions.ts'
import type { Route } from './routes.ts'
import { taskRoutes } from './scheduler.ts'
import { catalogReady, startSession } from './sessions.ts'

const logger = createLogger('COMMANDS')

const MAX_COMMANDS = 100
const NAME_LIMIT = 32
const CATALOG_EVENTS: ReadonlySet<string> = new Set(['server.connected', 'agent.updated', 'command.updated', 'skill.updated'])

// Local fork: only agents whose id or name contains this substring get a
// /<agent>-agent shortcut; every agent stays reachable through /agent. Fewer
// shortcuts also shrink the daily command-create cost of catalog churn.
// KIMAKI_AGENT_SHORTCUT_FILTER overrides the substring; empty registers all agents.
const AGENT_SHORTCUT_FILTER = (process.env['KIMAKI_AGENT_SHORTCUT_FILTER'] ?? 'orchestrator').trim().toLowerCase()

// --- The registry: every feature's tables, combined once per bot.

type PrefixRoute<I> = { prefix: string; run: InteractionHandler<I>; admin: boolean }

export type InteractionRegistry = {
  commands: ReadonlyMap<string, SlashCommand & { admin: boolean }>
  // Static command JSON in table order; registered before the dynamic ones.
  definitions: readonly RESTPostAPIChatInputApplicationCommandsJSONBody[]
  buttons: ReadonlyArray<PrefixRoute<ButtonInteraction>>
  selects: ReadonlyArray<PrefixRoute<StringSelectMenuInteraction>>
  modals: ReadonlyArray<PrefixRoute<ModalSubmitInteraction>>
}

function prefixRoutes<I>(
  features: readonly InteractionRoutes[],
  table: (feature: InteractionRoutes) => Readonly<Record<string, InteractionHandler<I>>> | undefined,
): Array<PrefixRoute<I>> {
  const routes = features.flatMap((feature) =>
    Object.entries(table(feature) ?? {}).map(([prefix, run]) => ({ prefix, run, admin: feature.admin === true })),
  )
  const prefixes = routes.map((route) => route.prefix)
  const duplicate = prefixes.find((prefix, index) => prefixes.indexOf(prefix) !== index)
  if (duplicate !== undefined) throw new Error(`Two interaction routes use the custom ID prefix ${duplicate}`)
  // Longest first: a prefix that starts another prefix never hides it.
  return routes.sort((a, b) => b.prefix.length - a.prefix.length)
}

function byPrefix<I>(routes: ReadonlyArray<PrefixRoute<I>>, customId: string): PrefixRoute<I> | null {
  return routes.find((route) => customId.startsWith(route.prefix)) ?? null
}

export function combineRoutes(features: readonly InteractionRoutes[]): InteractionRegistry {
  const commands = new Map<string, SlashCommand & { admin: boolean }>()
  const definitions: RESTPostAPIChatInputApplicationCommandsJSONBody[] = []
  for (const feature of features) {
    for (const [name, command] of Object.entries(feature.commands ?? {})) {
      const json = command.definition.toJSON()
      if (json.name !== name) throw new Error(`Slash command ${json.name} is registered under ${name}`)
      if (commands.has(name)) throw new Error(`Two features define /${name}`)
      commands.set(name, { ...command, admin: feature.admin === true })
      definitions.push({ ...json, dm_permission: false })
    }
  }
  return {
    commands,
    definitions,
    buttons: prefixRoutes(features, (feature) => feature.buttons),
    selects: prefixRoutes(features, (feature) => feature.selects),
    modals: prefixRoutes(features, (feature) => feature.modals),
  }
}

// One per bot: the wizard and form features keep per-bot state in their closures.
export function createInteractionRegistry(): InteractionRegistry {
  return combineRoutes([
    worktreeRoutes,
    createLoginRoutes(),
    sessionRoutes,
    threadRoutes,
    createPreferenceRoutes(),
    mcpRoutes,
    taskRoutes,
    agentUiRoutes,
    permissionRoutes,
    createQuestionHandlers(),
    voiceRetryRoutes,
    catalogRoutes(),
  ])
}

// --- Dynamic commands

export type DynamicCommand =
  | { kind: 'agent'; name: string }
  | { kind: 'command'; name: string }
  | { kind: 'skill'; id: string }

export type Catalog = {
  agents: ReadonlyArray<{ id: string; name: string; description?: string; mode: string; hidden: boolean }>
  commands: ReadonlyArray<{ name: string; description?: string }>
  skills: ReadonlyArray<{ id: string; description?: string }>
}

async function readCatalog(bot: Pick<Bot, 'opencode' | 'features'>, directory: string): Promise<Error | Catalog> {
  // A cold (or evicted) location loads its plugin a moment after it answers,
  // and OpenCode's list calls do not wait for that (issue 51282): they return
  // an empty catalog, registering a bare fixed list. The activation hints that
  // would retrigger registration can be lost on a cold start (sent before the
  // bot subscribes), so gate the read on the plugin being active.
  const plugin = await bot.features.waitForPlugin(directory)
  if (plugin instanceof Error) logger.warn('waiting for plugin activation', plugin)
  // Waits for plugin activation, so a cold location returns its full catalog.
  const ready = await catalogReady(bot, directory)
  if (ready instanceof Error) return ready
  const location = { directory }
  const [agents, commands, skills] = await Promise.all([
    oc(bot, 'agent.list', (client) => client.agent.list({ location })),
    oc(bot, 'command.list', (client) => client.command.list({ location })),
    oc(bot, 'skill.list', (client) => client.skill.list({ location })),
  ])
  if (agents instanceof Error) return agents
  if (commands instanceof Error) return commands
  if (skills instanceof Error) return skills
  return { agents: agents.data, commands: commands.data, skills: skills.data.filter((skill) => !isBuiltinSkill(skill.id)) }
}

// Autocomplete keeps the whole project catalog reachable beyond Discord's shortcut limit.
function catalogRoutes(): InteractionRoutes {
  const commands: Record<string, SlashCommand> = {}
  for (const kind of ['command', 'skill'] as const) {
    const entries = async (bot: Bot, directory: string) => {
      const location = { directory }
      if (kind === 'skill') {
        const skills = await oc(bot, 'skill.list', (client) => client.skill.list({ location }))
        if (skills instanceof Error) return skills
        return skills.data.filter((skill) => !isBuiltinSkill(skill.id)).map((skill) => ({ name: skill.id, description: skill.description }))
      }
      const list = await oc(bot, 'command.list', (client) => client.command.list({ location }))
      if (list instanceof Error) return list
      return list.data.filter((command) => !SKIPPED_COMMANDS.has(command.name))
    }
    commands[kind] = {
      definition: new SlashCommandBuilder()
        .setName(kind)
        .setDescription(`Run any OpenCode ${kind} in this project`)
        .addStringOption((option) => option.setName('name').setDescription(`${kind} name`).setRequired(true).setAutocomplete(true))
        .addStringOption((option) => option.setName('arguments').setDescription(`Arguments to pass to the ${kind}`)),
      async autocomplete(bot, interaction) {
        const where = await resolveTarget(bot, interaction.channelId)
        if (where instanceof Error) return respondChoices(interaction, where)
        const list = await entries(bot, where.directory)
        if (list instanceof Error) return respondChoices(interaction, list)
        const query = interaction.options.getFocused().toLowerCase()
        return respondChoices(interaction, list.filter((entry) => entry.name.toLowerCase().includes(query)).map((entry) => ({
          name: `/${entry.name}${entry.description ? ` - ${entry.description}` : ''}`,
          value: entry.name,
        })))
      },
      async run(bot, interaction) {
        const where = await resolveTarget(bot, interaction.channelId)
        if (where instanceof Error) return replyError(interaction, where)
        const list = await entries(bot, where.directory)
        if (list instanceof Error) return replyError(interaction, list)
        const name = interaction.options.getString('name', true).trim().replace(/^\//, '')
        if (!list.some((entry) => entry.name === name)) return replyError(interaction, new ConfigError({ reason: `Unknown ${kind} \`${name}\`. Use /${kind} autocomplete to select one.` }))
        const args = (interaction.options.getString('arguments') ?? '').trim()
        return sendInput(bot, {
          interaction,
          route: kind === 'skill' ? { kind, id: name, arguments: args } : { kind, name, arguments: args, queue: false },
          echo: `/${name} ${args}`.trim(),
        })
      },
    }
  }
  return { commands }
}

// A hung bulk-overwrite PUT (a rate-limited limiter sleeps with no timeout of
// its own) must not hang startup: the await is bounded, and the pass retries
// on the next catalog event or reconnect.
const REGISTRATION_RETRY_MS = 180_000
const REGISTRATION_RETRY_MAX_MS = 1_800_000
const REGISTRATION_RETRY_CHUNK_MS = 5_000
// One bulk-overwrite attempt. discord.js's own limiter retries a 429 forever
// inside the request with no way to cancel it — an orphaned cycle per pass.
// A plain fetch has one owner: parse Discord's retry_after (error 30034's
// daily command-create budget reports the real wait in the body) and let the
// pass backoff schedule the next attempt.
const COMMAND_PUT_TIMEOUT_MS = 30_000
// Individual POSTs per pass once the daily budget forces degraded mode.
const DEGRADED_ADDS_PER_PASS = 10

type CommandPutOutcome = { ok: true } | { ok: false; reason: string; retryAfterMs?: number | null; budget?: boolean }

async function putCommands(url: string, token: string, commands: unknown[], label: string): Promise<CommandPutOutcome> {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'PUT',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(COMMAND_PUT_TIMEOUT_MS),
    })
  } catch (error) {
    return { ok: false, reason: `registering commands ${label} failed: ${errorText(error)}`, retryAfterMs: null }
  }
  if (res.ok) return { ok: true }
  const retryAfterMs = Number(res.headers.get('retry-after') ?? 0) * 1_000 || null
  let detail = ''
  try {
    const body = (await res.json()) as { message?: string; retry_after?: number; code?: number }
    if (body.message) detail = `: ${body.message}`
    const budget = body.code === 30034
    if (body.retry_after) return { ok: false, reason: `registering commands ${label}: ${res.status}${detail}`, retryAfterMs: body.retry_after * 1_000, budget }
    return { ok: false, reason: `registering commands ${label}: ${res.status}${detail}`, retryAfterMs, budget }
  } catch {
    // Non-JSON body (proxy or edge error page): the status line says enough.
  }
  return { ok: false, reason: `registering commands ${label}: ${res.status}${detail}`, retryAfterMs }
}

async function putGuildCommands(apiBase: string, token: string, appId: string, guildId: string, commands: unknown[]): Promise<CommandPutOutcome> {
  return putCommands(`${apiBase}/v10/applications/${appId}/guilds/${guildId}/commands`, token, commands, `in ${guildId}`)
}

async function putGlobalCommands(apiBase: string, token: string, appId: string, commands: unknown[]): Promise<CommandPutOutcome> {
  return putCommands(`${apiBase}/v10/applications/${appId}/commands`, token, commands, 'globally')
}

// One POST adds exactly one command for exactly one create: on a nearly
// exhausted daily budget the missing commands trickle in, most important
// first, instead of the whole registration waiting for the full headroom.
async function postGuildCommand(apiBase: string, token: string, appId: string, guildId: string, command: unknown): Promise<CommandPutOutcome> {
  let res: Response
  try {
    res = await fetch(`${apiBase}/v10/applications/${appId}/guilds/${guildId}/commands`, {
      method: 'POST',
      headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(COMMAND_PUT_TIMEOUT_MS),
    })
  } catch (error) {
    return { ok: false, reason: `adding ${guildId} command failed: ${errorText(error)}` }
  }
  if (res.ok) return { ok: true }
  try {
    const body = (await res.json()) as { message?: string; code?: number; retry_after?: number }
    const budget = body.code === 30034
    const retryAfterMs = body.retry_after ? body.retry_after * 1_000 : null
    return { ok: false, reason: `adding ${String((command as { name?: string }).name)} in ${guildId}: ${res.status}${body.message ? `: ${body.message}` : ''}`, retryAfterMs: budget ? retryAfterMs : undefined, budget }
  } catch {
    return { ok: false, reason: `adding command in ${guildId}: ${res.status}` }
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function loadSignatures(file: string): Map<string, string> {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
    if (parsed !== null && typeof parsed === 'object' && !(parsed instanceof Array)) {
      return new Map(Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
    }
  } catch {
    // Missing or corrupt file: nothing counts as registered until a PUT succeeds.
  }
  return new Map()
}

// Lowercase letters, digits and hyphens; the suffix always survives the 32-char limit.
export function discordCommandName(name: string, suffix: string): string | null {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  if (!base) return null
  return `${base.slice(0, NAME_LIMIT - suffix.length).replace(/-$/, '')}${suffix}`
}

// A bulk-overwrite PUT counts EVERY command in its payload against Discord's
// 200-per-day application command creates (error 30034), even unchanged ones.
// A ~125-command catalog burned that budget within a few restarts and then
// 429'd every registration for hours. Agents come first (the primary entry
// points), then command and skill shortcuts; the fixed /agent, /command and
// /skill commands still reach everything through autocomplete.
const DYNAMIC_COMMAND_CAP = 50

// Pure: the full command list for a guild (the fixed commands first) plus the owner of each dynamic name.
export function buildCommands({
  fixed,
  catalog,
  agentShortcutFilter,
}: {
  fixed: readonly RESTPostAPIChatInputApplicationCommandsJSONBody[]
  catalog: Catalog
  // Local fork: agents whose id or name lacks this substring get no shortcut.
  agentShortcutFilter?: string
}): {
  commands: RESTPostAPIChatInputApplicationCommandsJSONBody[]
  dynamic: Map<string, DynamicCommand>
  // Commands past the Discord limit that were left out.
  dropped: number
} {
  const taken = new Set(fixed.map((command) => command.name))
  const dynamic = new Map<string, DynamicCommand>()
  const commands = [...fixed]

  // Sorted: the same catalog always keeps the same commands under the limit,
  // whatever order OpenCode lists them in.
  const sorted = <T>(items: readonly T[], key: (item: T) => string) =>
    items.toSorted((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0))
  // Stops at DYNAMIC_COMMAND_CAP so a registration PUT fits Discord's daily
  // command-create budget; `add` becomes a no-op past it.
  let dynamicCount = 0
  const add = (entry: { name: string | null; target: DynamicCommand; text: string }) => {
    if (dynamicCount >= DYNAMIC_COMMAND_CAP) return
    if (!entry.name || taken.has(entry.name)) return
    dynamicCount++
    addCommand(entry)
  }
  const addCommand = ({ name, target, text }: { name: string | null; target: DynamicCommand; text: string }) => {
    taken.add(name!)
    dynamic.set(name!, target)
    const builder = new SlashCommandBuilder()
      .setName(name!)
      .setDescription(text.replace(/\s+/g, ' ').trim().slice(0, 100) || '-')
      .setDMPermission(false)
    if (target.kind === 'agent') {
      builder
        .addStringOption((option) => option.setName('prompt').setDescription('Send a prompt with this agent'))
        .addStringOption((option) =>
          option.setName('variant').setDescription('Thinking level of the current model').setAutocomplete(true),
        )
    } else {
      builder.addStringOption((option) => option.setName('arguments').setDescription('Arguments to pass to the command'))
    }
    commands.push(builder.toJSON())
  }
  for (const agent of sorted(catalog.agents, (agent) => agent.id)) {
    if (agent.mode === 'subagent' || agent.hidden) continue
    if (agentShortcutFilter && !`${agent.id} ${agent.name}`.toLowerCase().includes(agentShortcutFilter)) continue
    add({
      name: discordCommandName(agent.id, '-agent'),
      target: { kind: 'agent', name: agent.id },
      text: agent.description || `Switch to the ${agent.name} agent`,
    })
  }
  for (const command of sorted(catalog.commands, (command) => command.name)) {
    if (SKIPPED_COMMANDS.has(command.name) || command.name.includes(':')) continue
    add({
      name: discordCommandName(command.name, '-cmd'),
      target: { kind: 'command', name: command.name },
      text: command.description || `Run /${command.name}`,
    })
  }
  for (const skill of sorted(catalog.skills, (skill) => skill.id)) {
    add({
      name: discordCommandName(skill.id, '-skill'),
      target: { kind: 'skill', id: skill.id },
      text: skill.description || `Use the ${skill.id} skill`,
    })
  }
  for (const dropped of commands.slice(MAX_COMMANDS)) dynamic.delete(dropped.name)
  return { commands: commands.slice(0, MAX_COMMANDS), dynamic, dropped: Math.max(0, commands.length - MAX_COMMANDS) }
}

// Pure: attach existing Discord command ids to PUT entries so a bulk
// overwrite updates in place instead of delete+create (which charges the
// daily create budget for every command, even unchanged ones). GET is free.
export function attachCommandIds(
  commands: readonly RESTPostAPIChatInputApplicationCommandsJSONBody[],
  liveByName: ReadonlyMap<string, string>,
): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
  return commands.map((command) => {
    const id = liveByName.get(command.name)
    return id ? { ...command, id } : command
  })
}

// The fixed commands registered as globals: the primary entry points that
// keep working while a guild's daily create budget is blocked.
const GLOBAL_ESSENTIAL_COMMANDS = new Set(['agent', 'model', 'queue'])

// Pure: the "essentials" registered as global application commands (a
// separate daily budget from guild commands). Contains the fixed /agent,
// /model and /queue plus orchestrator agent shortcuts (filtered exactly like
// the guild set); no command or skill shortcuts (those stay guild-only).
// Globals may share names with guild commands; guild wins at interaction time.
export function buildGlobalEssentials({
  fixed,
  catalog,
  agentShortcutFilter,
}: {
  fixed: readonly RESTPostAPIChatInputApplicationCommandsJSONBody[]
  catalog: Catalog
  agentShortcutFilter?: string
}): {
  commands: RESTPostAPIChatInputApplicationCommandsJSONBody[]
  dynamic: Map<string, DynamicCommand>
} {
  const essentialsFixed = fixed.filter((command) => GLOBAL_ESSENTIAL_COMMANDS.has(command.name))
  return buildCommands({
    fixed: essentialsFixed,
    catalog: { agents: catalog.agents, commands: [], skills: [] },
    agentShortcutFilter,
  })
}

const BUDGET_FALLBACK_MS = 3_600_000 // 1 hour
const BUDGET_FALLBACK_MAX_MS = 21_600_000 // 6 hours
// retry_after values at or below this are ignored: on a saturated daily budget
// they do not report the block's true length.
const BUDGET_TRUST_MIN_MS = BUDGET_FALLBACK_MS // tied to the ladder base so they cannot drift

// Pure: the next registration wait after a budget (30034) failure. Discord's
// 30034 retry_after on a saturated daily budget reports minutes while the
// block demonstrably lasts over a day with zero successful creates, so
// sub-hour values are not the budget free-time; they are ignored, and a
// sparse ladder (1h doubling to 6h) paces re-probes.
export function budgetRetryMs(retryAfterMs: number | null | undefined, consecutiveBudgetFailures: number): number {
  if (retryAfterMs && retryAfterMs > BUDGET_TRUST_MIN_MS) return retryAfterMs
  const fallback = BUDGET_FALLBACK_MS * 2 ** consecutiveBudgetFailures
  return Math.min(fallback, BUDGET_FALLBACK_MAX_MS)
}

// An input from a command: a prompt in the thread, or a new session in a channel.
async function sendInput(
  bot: Bot,
  {
    interaction,
    route,
    echo,
    model = null,
  }: {
    interaction: ChatInputCommandInteraction
    route: Exclude<Route, { kind: 'btw' | 'new-session' | 'queue' }>
    echo: string
    // A model for this session only (`/<agent>-agent variant:`).
    model?: ModelChoice | null
  },
) {
  const target = await resolveTarget(bot, interaction.channelId)
  if (target instanceof Error) return replyError(interaction, target)
  const author = authorOf(interaction)
  // In a coordinator channel an agent pick starts a new thread: the coordinator keeps its own agent and model.
  const newThread = route.kind === 'steer' && Boolean(route.agent) && target.conversation !== null && !target.conversation.isThread()
  if (target.conversation && target.sessionId && !newThread) {
    const reply = await replyWithEcho(interaction, { author, text: echo })
    if (reply instanceof Error) return replyError(interaction, reply)
    if (model && !(route.kind === 'steer' && route.agent)) {
      const switched = await switchModel(bot, { sessionId: target.sessionId, model })
      if (switched instanceof Error) return replyError(interaction, switched)
    }
    const result = await dispatch(bot, { conversation: target.conversation, route, author, messageId: reply.id, model })
    if (result instanceof Error) return replyError(interaction, result)
    return
  }
  if (target.conversation && !newThread) {
    await interaction.reply({ content: 'Use this command in a thread with a Kimaki session', flags: MessageFlags.Ephemeral })
    return
  }
  await interaction.deferReply()
  const started = await startSession(bot, {
    channelId: target.channelId,
    directory: target.projectDirectory,
    route,
    author,
    messageId: interaction.id,
    startMessageId: null,
    ...(model && { model }),
  })
  if (started instanceof Error) return replyError(interaction, started)
  await interaction.editReply({ content: asSubtext(`Started a new session in <#${started.threadId}>`) })
}

async function handleDynamic(bot: Bot, { interaction, target }: { interaction: ChatInputCommandInteraction; target: DynamicCommand }) {
  const text = (interaction.options.getString(target.kind === 'agent' ? 'prompt' : 'arguments') ?? '').trim()
  if (target.kind === 'agent') {
    const variant = interaction.options.getString('variant')?.trim()
    const where = await resolveTarget(bot, interaction.channelId)
    if (where instanceof Error) return replyError(interaction, where)
    const model = variant ? await variantModel(bot, { target: where, variant, agent: target.name }) : null
    if (model instanceof Error) return replyError(interaction, model)
    // Without a prompt the pick switches the current session or channel, also a coordinator's.
    // With a prompt in a coordinator channel it starts a new thread (sendInput).
    if (!text) return applyAgent(bot, { interaction, target: where, agent: target.name, model })
    const label = model ? `${target.name}, ${model.variant}` : target.name
    return sendInput(bot, { interaction, route: { kind: 'steer', text, agent: target.name }, echo: `(${label}) ${text}`, model })
  }
  if (target.kind === 'skill') {
    return sendInput(bot, { interaction, route: { kind: 'skill', id: target.id, arguments: text }, echo: `/${target.id} ${text}`.trim() })
  }
  return sendInput(bot, {
    interaction,
    route: { kind: 'command', name: target.name, arguments: text, queue: false },
    echo: `/${target.name} ${text}`.trim(),
  })
}

// --- Listener and registration

// Registers the interaction listener and keeps every guild's commands in line
// with the OpenCode catalog. Returns registerAll and stop.
export function registerSlashCommands(
  bot: Bot,
  registry: InteractionRegistry,
  {
    globalDirectory,
    signaturesFile,
    apiBase,
    globalCommands = true,
  }: {
    // OpenCode's global config dir. As a location, OpenCode skips the project
    // config walk for it (core/src/config/discovery.ts), so its catalog is the
    // global one. Any other directory also loads the config of its ancestors.
    globalDirectory: string
    // Persisted per-guild command signatures: a restart with an unchanged
    // catalog skips the bulk-overwrite PUT entirely. Discord counts every
    // changed command of a bulk overwrite against a 200-per-day-per-guild
    // create budget, so re-registering ~100 commands on every restart can
    // exhaust it and 429 for hours.
    signaturesFile: string
    // REST root that /v10/... is appended to: discord.com, or a gateway proxy.
    apiBase: string
    // Register essential commands globally (separate daily budget from guild
    // commands). Off through gateway-proxy (it rejects global application
    // routes). main.ts computes the default from discordRestUrl.
    globalCommands?: boolean
  },
) {
  const { discord } = bot
  // Guild -> Discord name -> OpenCode agent, command or skill, from the last registration.
  const dynamic = new Map<string, ReadonlyMap<string, DynamicCommand>>()
  // Global dynamic commands (agent shortcuts from buildGlobalEssentials).
  let globalDynamic: ReadonlyMap<string, DynamicCommand> | null = null
  // Last global commands signature: an unchanged list skips the global PUT.
  let globalRegistered: string | null = null

  // Last commands set per guild: an unchanged list is not sent again (Discord
  // limits command creates to 200 per day per guild). Seeded from
  // signaturesFile so a restart also skips the PUT (the fetch-and-compare
  // below still runs, so a list changed outside this bot re-registers).
  const registered = loadSignatures(signaturesFile)
  // Discord's 30034 body reports a minute-scale wait that does not match the
  // observed multi-day block; only values above BUDGET_TRUST_MIN_MS are trusted.
  let suggestedRetryMs: number | null = null
  // Separate from suggestedRetryMs: the retry_after from a budget (30034)
  // failure, so non-budget 429s do not shorten the budget backoff.
  let budgetRetryAfterMs: number | null = null
  // Consecutive fully-blocked budget passes: the fallback ladder doubles (Discord's sub-hour retry_after on a saturated budget is not the free time and is ignored).
  let consecutiveBudgetFailures = 0
  // Set by registerGuild/registerGlobals when a budget failure occurs this pass.
  let passBudgetBlocked = false
  // Commands the degraded trickle added this pass: any progress keeps the fast
  // budget cadence; zero adds backs off on the hourly ladder.
  let passTrickleAdds = 0
  // Serialized: two guilds finishing close together must not interleave writes.
  let saveChain: Promise<void> = Promise.resolve()
  const saveSignatures = (file: string, map: ReadonlyMap<string, string>): Promise<void> => {
    saveChain = saveChain.then(() => writeFile(file, JSON.stringify(Object.fromEntries(map)))).catch((error: Error) => logger.warn('saving command signatures', error))
    return saveChain
  }

  function logBudgetExhaustion(scope: string, retryAfterMs: number | null | undefined) {
    if (retryAfterMs) {
      logger.warn(`daily create budget exhausted ${scope} (discord retry_after ${Math.round(retryAfterMs / 1000)}s)`)
    } else {
      logger.warn(`daily create budget exhausted ${scope}; no retry_after in response, using fallback backoff`)
    }
  }

  // Returns 'failed' when nothing was registered this pass (the pass then
  // backs off), 'progress' when the trickle added something (fast retry), and
  // 'ok' when the guild's list is content-complete.
  async function registerGuild(guild: Guild, built: ReturnType<typeof buildCommands>): Promise<'ok' | 'progress' | 'failed'> {
    const signature = JSON.stringify(built.commands)
    // Fetch live commands once: GET is free (not charged), and the ids are
    // attached to the PUT payload so existing commands update in place
    // instead of delete+create (which charges the daily budget for each).
    const live = await discord.application?.commands.fetch({ guildId: guild.id }).catch(() => null)
    const liveByName = new Map<string, string>()
    if (live) for (const entry of live.values()) liveByName.set(entry.name, entry.id)
    if (registered.get(guild.id) === signature) {
      // Another Kimaki on the same app can overwrite the list, so compare with Discord.
      const same = !live || (live.size === built.commands.length && built.commands.every((command) => liveByName.has(command.name)))
      if (same) {
        dynamic.set(guild.id, built.dynamic)
        return 'ok'
      }
      logger.warn(`commands in guild ${guild.id} changed outside this bot, registering again`)
    }
    const token = discord.token
    const appId = discord.application?.id
    if (!token || !appId) {
      logger.warn(`cannot register commands in ${guild.id}: no bot token or application id`)
      return 'failed'
    }
    // Attach existing ids so the PUT updates in place instead of delete+create.
    const withIds = attachCommandIds(built.commands, liveByName)
    const outcome = await putGuildCommands(apiBase, token, appId, guild.id, withIds)
    if (outcome.ok) {
      registered.set(guild.id, signature)
      void saveSignatures(signaturesFile, registered)
      dynamic.set(guild.id, built.dynamic)
      logger.info(`registered ${built.commands.length} commands in guild ${guild.id}`)
      return 'ok'
    }
    if (outcome.budget) {
      passBudgetBlocked = true
      logBudgetExhaustion(`for guild ${guild.id}`, outcome.retryAfterMs)
      if (outcome.retryAfterMs) budgetRetryAfterMs = Math.max(budgetRetryAfterMs ?? 0, outcome.retryAfterMs)
      // Daily create budget exhausted: add the missing commands one by one,
      // fixed commands and agents first, so the trickle budget registers
      // progressively instead of the whole list waiting for full headroom.
      const liveNames = new Set(liveByName.keys())
      const missing = built.commands.filter((command) => !liveNames.has(command.name))
      let added = 0
      for (const command of missing.slice(0, DEGRADED_ADDS_PER_PASS)) {
        const one = await postGuildCommand(apiBase, token, appId, guild.id, command)
        if (!one.ok) {
          if (one.budget) {
            logBudgetExhaustion(`for guild ${guild.id} (degraded add)`, one.retryAfterMs)
            if (one.retryAfterMs) budgetRetryAfterMs = Math.max(budgetRetryAfterMs ?? 0, one.retryAfterMs)
          }
          logger.warn(one.reason)
          break
        }
        added++
      }
      // Counts toward the pass either way: any add keeps the fast cadence below.
      passTrickleAdds += added
      if (missing.length - added > 0) {
        logger.warn(`daily create budget exhausted: added ${added}/${missing.length} missing commands in ${guild.id}; continuing next pass`)
        return added > 0 ? 'progress' : 'failed'
      }
      // Content-complete (a stale extra shortcut only clears on a later full
      // PUT once the budget frees).
      registered.set(guild.id, signature)
      void saveSignatures(signaturesFile, registered)
      dynamic.set(guild.id, built.dynamic)
      logger.info(`registered ${built.commands.length} commands in guild ${guild.id} (${added} added individually past the daily budget)`)
      return 'ok'
    }
    if (outcome.retryAfterMs) suggestedRetryMs = Math.max(suggestedRetryMs ?? 0, outcome.retryAfterMs)
    logger.warn(outcome.reason)
    return 'failed'
  }

  // Registers the essentials as global application commands (separate daily
  // budget from guild commands). Returns 'ok' or 'failed'.
  async function registerGlobals(built: ReturnType<typeof buildGlobalEssentials>): Promise<'ok' | 'failed'> {
    const signature = JSON.stringify(built.commands)
    // GET is free; ids are attached to the PUT to avoid delete+create charges.
    const live = await discord.application?.commands.fetch().catch(() => null)
    const liveByName = new Map<string, string>()
    if (live) for (const entry of live.values()) liveByName.set(entry.name, entry.id)
    if (globalRegistered === signature) {
      const same = !live || (live.size === built.commands.length && built.commands.every((command) => liveByName.has(command.name)))
      if (same) return 'ok'
      logger.warn('global commands changed outside this bot, registering again')
    }
    const token = discord.token
    const appId = discord.application?.id
    if (!token || !appId) {
      logger.warn('cannot register global commands: no bot token or application id')
      return 'failed'
    }
    const withIds = attachCommandIds(built.commands, liveByName)
    const outcome = await putGlobalCommands(apiBase, token, appId, withIds)
    if (outcome.ok) {
      globalRegistered = signature
      globalDynamic = built.dynamic
      logger.info(`registered ${built.commands.length} global commands`)
      return 'ok'
    }
    if (outcome.budget) {
      passBudgetBlocked = true
      logBudgetExhaustion('for global commands', outcome.retryAfterMs)
      if (outcome.retryAfterMs) budgetRetryAfterMs = Math.max(budgetRetryAfterMs ?? 0, outcome.retryAfterMs)
      return 'failed'
    }
    if (outcome.retryAfterMs) suggestedRetryMs = Math.max(suggestedRetryMs ?? 0, outcome.retryAfterMs)
    logger.warn(outcome.reason)
    return 'failed'
  }

  function dynamicCommand(interaction: { guildId: string | null; commandName: string }) {
    const mapped = interaction.guildId ? dynamic.get(interaction.guildId)?.get(interaction.commandName) : undefined
    if (mapped) return mapped
    // Global agent shortcuts are not in any guild's map.
    const global = globalDynamic?.get(interaction.commandName)
    if (global) return global
    // A command registered outside this process (e.g. a manual single-command
    // PUT while the daily create budget was exhausted) is not in the map yet:
    // agent shortcuts are derivable from the name. Fixed commands were looked
    // up first, and no fixed name ends with '-agent'.
    if (interaction.guildId && interaction.commandName.endsWith('-agent')) {
      return { kind: 'agent' as const, name: interaction.commandName.slice(0, -'-agent'.length) }
    }
    return undefined
  }

  async function runCommand(interaction: ChatInputCommandInteraction) {
    const command = registry.commands.get(interaction.commandName)
    if (command) return command.run(bot, interaction)
    const target = dynamicCommand(interaction)
    if (target) return handleDynamic(bot, { interaction, target })
    // A catalog command removed since the last registration: only told where commands work.
    await sessionTarget(bot, interaction)
  }

  async function autocomplete(interaction: AutocompleteInteraction) {
    const command = registry.commands.get(interaction.commandName)
    if (command?.autocomplete) return command.autocomplete(bot, interaction)
    const target = dynamicCommand(interaction)
    if (target?.kind !== 'agent') return respondChoices(interaction, [])
    const where = await resolveTarget(bot, interaction.channelId)
    if (where instanceof Error) return respondChoices(interaction, where)
    return respondChoices(interaction, await variantChoices(bot, { target: where, query: interaction.options.getFocused(), agent: target.name }))
  }

  // Provider logins and audio keys are secrets of the whole bot.
  function adminOnly(interaction: Interaction): boolean {
    if (interaction.isChatInputCommand() || interaction.isAutocomplete()) return registry.commands.get(interaction.commandName)?.admin === true
    if (interaction.isButton()) return byPrefix(registry.buttons, interaction.customId)?.admin === true
    if (interaction.isStringSelectMenu()) return byPrefix(registry.selects, interaction.customId)?.admin === true
    if (interaction.isModalSubmit()) return byPrefix(registry.modals, interaction.customId)?.admin === true
    return false
  }

  async function handle(interaction: Interaction) {
    if (!interaction.guildId) return
    const channel = interaction.channel ?? (interaction.channelId ? await discord.channels.fetch(interaction.channelId).catch(() => null) : null)
    const projectId = channel?.isThread() ? channel.parentId : channel?.id
    const project = projectId ? await projectOf(bot, projectId) : null
    if (project instanceof Error) return logger.warn(project)
    if (!project) return
    const guild = interaction.guild ?? (await discord.guilds.fetch(interaction.guildId).catch(() => null))
    if (!guild || !(await canUseKimaki(bot, { guild, userId: interaction.user.id }))) {
      if (interaction.isAutocomplete()) return respondChoices(interaction, [])
      if (interaction.isRepliable()) {
        await interaction.reply({ content: 'You do not have permission to use Kimaki', flags: MessageFlags.Ephemeral })
      }
      return
    }
    if (adminOnly(interaction) && guild.ownerId !== interaction.user.id) {
      const member = await guild.members.fetch(interaction.user.id).catch(() => null)
      if (!member?.permissions.has(PermissionFlagsBits.Administrator)) {
        if (interaction.isRepliable()) await interaction.reply({ content: 'Provider login requires the server owner or an administrator', flags: MessageFlags.Ephemeral })
        return
      }
    }
    if (interaction.isChatInputCommand()) return runCommand(interaction)
    if (interaction.isAutocomplete()) return autocomplete(interaction)
    if (interaction.isButton()) return byPrefix(registry.buttons, interaction.customId)?.run(bot, interaction)
    if (interaction.isStringSelectMenu()) return byPrefix(registry.selects, interaction.customId)?.run(bot, interaction)
    if (interaction.isModalSubmit()) return byPrefix(registry.modals, interaction.customId)?.run(bot, interaction)
  }

  discord.on(Events.InteractionCreate, (interaction) => {
    handle(interaction).catch((error: Error) => logger.error(`interaction failed`, error))
  })
  // One registration pass at a time; a request made during a pass runs one more
  // pass, so an older catalog read never overwrites a newer one.
  const passes: { active: Promise<void> | null; dirty: boolean; closed: boolean } = { active: null, dirty: false, closed: false }

  // Brings every guild's commands in line with the current OpenCode catalog.
  function registerAll(): Promise<void> {
    passes.dirty = true
    if (passes.active) return passes.active
    const pass = (async () => {
      try {
        // Doubles per failed pass while Discord's daily command-create budget
        // is exhausted, so a saturated budget does not spam the log all day.
        let retryDelay = REGISTRATION_RETRY_MS
        while (passes.dirty && !passes.closed) {
          passes.dirty = false
          const read = await readCatalog(bot, globalDirectory)
          if (passes.closed) return
          if (read instanceof Error) {
            // An event that arrived during the read still gets its pass; else the next event or reconnect retries.
            logger.warn('global catalog', read)
            continue
          }
          const built = buildCommands({
            fixed: registry.definitions,
            catalog: read,
            agentShortcutFilter: AGENT_SHORTCUT_FILTER || undefined,
          })
          if (built.dropped > 0) {
            logger.log(`${built.dropped} catalog shortcuts do not fit in Discord's 100 commands; all entries remain available through /agent, /command and /skill`)
          }
          passBudgetBlocked = false
          passTrickleAdds = 0
          // Serialized, not Promise.all: the bulk-overwrite PUT shares one
          // small bucket across guilds (2 per 30s observed), and parallel PUTs
          // just 429 each other into minute-long retry cycles.
          let failed = false
          // Global essentials: separate daily budget, works while guild budget is blocked.
          if (globalCommands) {
            const globalBuilt = buildGlobalEssentials({
              fixed: registry.definitions,
              catalog: read,
              agentShortcutFilter: AGENT_SHORTCUT_FILTER || undefined,
            })
            if ((await registerGlobals(globalBuilt)) === 'failed') failed = true
          }
          for (const guild of [...discord.guilds.cache.values()]) {
            const result = await registerGuild(guild, built)
            if (result !== 'ok') failed = true
          }
          if (failed) {
            // Retry without waiting for a catalog event: a PUT that just 429'd
            // succeeds once its window frees. Non-budget failures keep the
            // existing REGISTRATION_RETRY_MS schedule. Chunked so shutdown
            // is quick.
            let wait: number
            if (passBudgetBlocked) {
              if (passTrickleAdds > 0) {
                // Progress keeps the fast cadence so the trickle fills one
                // batch per pass.
                wait = budgetRetryAfterMs ?? budgetRetryMs(null, consecutiveBudgetFailures)
                consecutiveBudgetFailures = 0
              } else {
                // With zero progress, stop retrying every few minutes: each
                // blocked attempt may itself keep the saturated window pinned,
                // so re-probes happen at 1h, 2h, 4h, 6h...
                wait = budgetRetryMs(budgetRetryAfterMs, consecutiveBudgetFailures)
                consecutiveBudgetFailures++
              }
            } else {
              consecutiveBudgetFailures = 0
              wait = Math.min(Math.max(retryDelay, suggestedRetryMs ?? 0), REGISTRATION_RETRY_MAX_MS)
            }
            // A catalog event during the wait wakes it early; the ladder keeps counting blocked passes.
            for (let waited = 0; waited < wait && !passes.closed && !passes.dirty; waited += REGISTRATION_RETRY_CHUNK_MS) {
              await sleep(REGISTRATION_RETRY_CHUNK_MS)
            }
            if (passes.closed) return
            suggestedRetryMs = null
            budgetRetryAfterMs = null
            if (!passBudgetBlocked) {
              retryDelay = Math.min(retryDelay * 2, REGISTRATION_RETRY_MAX_MS)
            }
            passes.dirty = true
          } else {
            retryDelay = REGISTRATION_RETRY_MS
            consecutiveBudgetFailures = 0
          }
        }
      } finally {
        passes.active = null
      }
    })()
    passes.active = pass
    return pass
  }

  discord.on(Events.GuildCreate, () => void registerAll())
  // agent/command/skill.updated are ephemeral hints (no payload) sent on every
  // catalog change of one location: plugin activation after a cold boot, edited
  // skill or agent files. Events of any location count: OpenCode unloads idle
  // locations, so a global change may only show up in a project location.
  // server.connected follows each reconnect: hints sent while disconnected are lost.
  const unsubscribe = bot.opencode.subscribe((event) => {
    if (CATALOG_EVENTS.has(event.type)) void registerAll()
  })

  return {
    registerAll,
    // Waits for a running pass so nothing writes after Discord is destroyed.
    async stop(): Promise<void> {
      unsubscribe()
      passes.closed = true
      await passes.active
    },
  }
}
