// /add-project command - Create Discord channels for an existing OpenCode project
// or a project directory that has a Pi agent session.

import fs from 'node:fs'
import path from 'node:path'
import type { CommandContext, AutocompleteContext } from './types.js'
import {
  findChannelsByDirectory,
  getAllTextChannelDirectories,
} from '../database.js'
import { initializeOpencodeForDirectory } from '../opencode.js'
import { createProjectChannels } from '../channel-management.js'
import { createLogger, LogPrefix } from '../logger.js'
import { abbreviatePath } from '../utils.js'
import {
  getPiAgentProjectDirectories,
  getLatestSessionTime,
} from '../pi-agent-sessions.js'

const logger = createLogger(LogPrefix.ADD_PROJECT)

// Prefix for Pi agent project values in autocomplete
const PI_PROJECT_PREFIX = 'pi:'

// Type for combined project items from both OpenCode and Pi agent sources
type ProjectItem = {
  id: string // OpenCode project ID or 'pi:<directory-path>'
  worktree: string
  displayName: string
  sortTime: number
  source: 'opencode' | 'pi-agent'
}

/**
 * Get all available project directories from both OpenCode projects and Pi agent sessions.
 * Filters out already-mapped directories and deduplicates.
 */
async function getAllAvailableProjects(): Promise<ProjectItem[]> {
  const projects: ProjectItem[] = []

  // Get OpenCode projects
  const currentDir = process.cwd()
  const getClient = await initializeOpencodeForDirectory(currentDir)
  if (!(getClient instanceof Error)) {
    const projectsResponse = await getClient().project.list({})
    if (projectsResponse.data) {
      for (const project of projectsResponse.data) {
        projects.push({
          id: project.id,
          worktree: project.worktree,
          displayName: path.basename(project.worktree),
          sortTime: project.time.initialized || project.time.created,
          source: 'opencode',
        })
      }
    }
  }

  // Get Pi agent session directories
  const piProjectDirs = await getPiAgentProjectDirectories()
  const opencodeDirSet = new Set(projects.map((p) => p.worktree))

  for (const piDir of piProjectDirs) {
    // Skip if already in OpenCode projects list
    if (opencodeDirSet.has(piDir)) continue

    // Get the most recent session time for sorting
    const sessionTime = getLatestSessionTime(piDir)

    projects.push({
      id: `${PI_PROJECT_PREFIX}${piDir}`,
      worktree: piDir,
      displayName: path.basename(piDir),
      sortTime: sessionTime ?? Date.now(),
      source: 'pi-agent',
    })
  }

  return projects
}

export async function handleAddProjectCommand({
  command,
}: CommandContext): Promise<void> {
  await command.deferReply()

  const projectId = command.options.getString('project', true)
  const guild = command.guild

  if (!guild) {
    await command.editReply('This command can only be used in a guild')
    return
  }

  try {
    let directory: string

    // Check if this is a Pi agent path (prefixed with 'pi:')
    if (projectId.startsWith(PI_PROJECT_PREFIX)) {
      directory = projectId.slice(PI_PROJECT_PREFIX.length)
      logger.log(`[ADD-PROJECT] Using Pi agent directory: ${directory}`)
    } else {
      // OpenCode project - fetch project info
      const currentDir = process.cwd()
      const getClient = await initializeOpencodeForDirectory(currentDir)
      if (getClient instanceof Error) {
        await command.editReply(getClient.message)
        return
      }

      const projectsResponse = await getClient().project.list({})
      if (!projectsResponse.data) {
        await command.editReply('Failed to fetch projects')
        return
      }

      const project = projectsResponse.data.find((p) => p.id === projectId)
      if (!project) {
        await command.editReply('Project not found')
        return
      }
      directory = project.worktree
    }

    if (!fs.existsSync(directory)) {
      await command.editReply(`Directory does not exist: ${directory}`)
      return
    }

    const existingChannels = await findChannelsByDirectory({
      directory,
      channelType: 'text',
    })

    if (existingChannels.length > 0) {
      await command.editReply(
        `A channel already exists for this directory: <#${existingChannels[0]!.channel_id}>`,
      )
      return
    }

    const { textChannelId, voiceChannelId, channelName } =
      await createProjectChannels({
        guild,
        projectDirectory: directory,
        botName: command.client.user?.username,
      })

    const voiceInfo = voiceChannelId ? `\n🔊 Voice: <#${voiceChannelId}>` : ''
    await command.editReply(
      `✅ Created channels for project:\n📝 Text: <#${textChannelId}>${voiceInfo}\n📁 Directory: \`${directory}\``,
    )

    logger.log(`Created channels for project ${channelName} at ${directory}`)
  } catch (error) {
    logger.error('[ADD-PROJECT] Error:', error)
    await command.editReply(
      `Failed to create channels: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

export async function handleAddProjectAutocomplete({
  interaction,
}: AutocompleteContext): Promise<void> {
  const focusedValue = interaction.options.getFocused()

  try {
    // Get existing channel mappings to filter out
    const existingDirs = await getAllTextChannelDirectories()
    const existingDirSet = new Set(existingDirs)

    // Get all available projects from both sources
    const allProjects = await getAllAvailableProjects()

    // Filter out already-mapped directories and test directories
    const availableProjects = allProjects.filter((project) => {
      if (existingDirSet.has(project.worktree)) {
        return false
      }
      // Skip opencode-test-* directories
      if (path.basename(project.worktree).startsWith('opencode-test-')) {
        return false
      }
      // Skip hidden directories
      if (path.basename(project.worktree).startsWith('.')) {
        return false
      }
      return true
    })

    // Filter by search text and sort by most recent
    const projects = availableProjects
      .filter((project) => {
        const searchText = `${project.displayName} ${project.worktree}`.toLowerCase()
        return searchText.includes(focusedValue.toLowerCase())
      })
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 25)
      .map((project) => {
        const sourceLabel = project.source === 'pi-agent' ? ' [Pi]' : ''
        const name = `${project.displayName}${sourceLabel} (${abbreviatePath(project.worktree)})`
        return {
          name: name.length > 100 ? name.slice(0, 99) + '…' : name,
          value: project.id,
        }
      })

    await interaction.respond(projects)
  } catch (error) {
    logger.error('[AUTOCOMPLETE] Error fetching projects:', error)
    await interaction.respond([])
  }
}