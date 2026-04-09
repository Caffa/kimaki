// Self-Improvement Approval Button Handler
// Handles button clicks for approving/rejecting self-improvement proposals
// from the Scheduled-Jobs task runner system

import { ButtonInteraction, MessageFlags } from 'discord.js'
import { createLogger } from '../logger.js'

const logger = createLogger('IMPROVE_APPROVAL')

export async function handleImprovementApprovalButton(
  interaction: ButtonInteraction
): Promise<void> {
  const customId = interaction.customId
  const parts = customId.split('_')

  // Validate format: improve_<action>_<request_id>
  if (parts.length < 3) {
    logger.error(`Invalid improvement button format: ${customId}`)
    await interaction.reply({
      content: 'Invalid improvement button format',
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const action = parts[1] // 'approve', 'reject', or 'view'
  const requestId = parts.slice(2).join('_') // Handle request IDs with underscores

  logger.info(`Improvement button clicked: ${action} for request ${requestId}`)

  // Handle view action
  if (action === 'view') {
    await interaction.reply({
      content: `📖 Viewing details for improvement request \`${requestId}\`...\n\nCheck the INSIGHTS.md file in the task directory for full details.`,
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  // Handle approve/reject actions
  const isApproved = action === 'approve'
  const emoji = isApproved ? '✅' : '❌'
  const status = isApproved ? 'Approved' : 'Rejected'

  // Acknowledge the interaction
  await interaction.reply({
    content: `${emoji} ${status} improvement request \`${requestId}\`. Processing...`,
    flags: MessageFlags.Ephemeral,
  })

  // Trigger the task runner to process the approval
  // We need to call task_runner.py with --process-approvals-only flag
  // This is done by spawning a subprocess
  try {
    const { spawn } = await import('child_process')
    
    // Find the task_runner.py file
    const taskRunnerPath = '/Users/caffae/Local-Projects-2026/Scheduled-Jobs/task_runner.py'
    
    logger.info(`Spawning task runner to process approval: ${taskRunnerPath}`)
    
    const process = spawn('python3', [taskRunnerPath, '--process-approvals-only'], {
      cwd: '/Users/caffae/Local-Projects-2026/Scheduled-Jobs',
      detached: true,
      stdio: 'ignore'
    })
    
    process.unref()
    
    logger.info(`Task runner spawned with PID ${process.pid} to process approval ${requestId}`)
  } catch (error) {
    logger.error(`Failed to spawn task runner for approval ${requestId}:`, error)
    
    // Try to notify the user about the error
    try {
      await interaction.followUp({
        content: `⚠️ Failed to trigger approval processing. Please run \`python3 task_runner.py --process-approvals-only\` manually.`,
        flags: MessageFlags.Ephemeral,
      })
    } catch (followUpError) {
      logger.error('Failed to send follow-up message:', followUpError)
    }
  }
}
