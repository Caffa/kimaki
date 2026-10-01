// Incremental cache updater for Discord thread → session/directory lookup.
// The Alfred launcher at ~/Scripts/alfred-kimaki-open.sh reads
// ~/.cache/kimaki-thread-index.json to resolve a Discord threadId to
// { sessionId, directory } without scanning all Kimaki projects.
// This module writes to that cache incrementally whenever a new thread
// is bound to a session so the full ~78s refresh runs only on demand.

import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { createLogger, LogPrefix } from './logger.js'

const cacheLogger = createLogger(LogPrefix.SESSION)

const CACHE_PATH = path.join(os.homedir(), '.cache', 'kimaki-thread-index.json')

export type ThreadIndexEntry = {
  sessionId: string
  directory: string
}

export type ThreadIndex = Record<string, ThreadIndexEntry>

/**
 * Read the current thread index cache, returning an empty object if the
 * file is missing, malformed, or unreadable. All errors are logged and
 * swallowed because the cache is best-effort.
 */
async function readThreadIndex(): Promise<ThreadIndex> {
  try {
    const raw = await fs.readFile(CACHE_PATH, 'utf-8')
    const parsed = JSON.parse(raw) as ThreadIndex
    if (!parsed || typeof parsed !== 'object') {
      return {}
    }
    return parsed
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      cacheLogger.debug(`[thread-index-cache] failed to read cache: ${error instanceof Error ? error.message : String(error)}`)
    }
    return {}
  }
}

/**
 * Atomically write the thread index cache by writing to a temp file in
 * the same directory and renaming it over the target.
 */
async function writeThreadIndex(index: ThreadIndex): Promise<void> {
  const cacheDir = path.dirname(CACHE_PATH)
  const tempPath = path.join(cacheDir, `.kimaki-thread-index-${Date.now()}.tmp`)
  await fs.mkdir(cacheDir, { recursive: true })
  await fs.writeFile(tempPath, JSON.stringify(index, null, 2) + '\n', 'utf-8')
  await fs.rename(tempPath, CACHE_PATH)
}

/**
 * Update the incremental thread index cache for a single thread.
 * If `directory` is empty/falsy the cache is not changed. Failures are
 * logged at debug level and never thrown so session creation cannot be
 * broken by a cache write failure.
 */
export async function updateThreadIndexCache(
  threadId: string,
  sessionId: string,
  directory: string,
): Promise<void> {
  if (!threadId || !sessionId || !directory) {
    cacheLogger.debug(`[thread-index-cache] skipping update for thread ${threadId}: missing threadId, sessionId, or directory`)
    return
  }

  try {
    const index = await readThreadIndex()
    index[threadId] = { sessionId, directory }
    await writeThreadIndex(index)
    cacheLogger.debug(`[thread-index-cache] updated thread ${threadId} → ${directory}`)
  } catch (error) {
    cacheLogger.debug(`[thread-index-cache] failed to update cache: ${error instanceof Error ? error.message : String(error)}`)
  }
}
