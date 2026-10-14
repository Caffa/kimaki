// Parakeet ASR service manager: the local whisper-class transcription server
// (asr-service/, FastAPI + parakeet-mlx) for voice messages, preferred over
// every cloud provider when it answers on ASR_SERVICE_URL.
//
//   voice message ─▶ is the service healthy? ──▶ transcriber { kind: 'parakeet' }
//                        │ no
//                        ▼
//              Apple Silicon + asr-service/ present? ──▶ start it (venv, pip, spawn, poll)
//                        │ no or not ready
//                        ▼
//                     null ─▶ voice.ts falls through to the cloud chain
//
// The service can also run on another machine (Mac Studio): set
// ASR_SERVICE_URL to it and nothing is started here.

import { execFile, spawn, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { promisify } from 'node:util'

import * as errore from 'errore'

import { createLogger } from './logger.ts'

const logger = createLogger('ASR')
const execFileAsync = promisify(execFile)

export class AsrServiceError extends errore.createTaggedError({
  name: 'AsrServiceError',
  message: 'ASR service failed: $reason',
}) {}

export const ASR_SERVICE_URL = process.env['ASR_SERVICE_URL'] ?? 'http://127.0.0.1:8765'

// MLX (the Apple Silicon backend used by parakeet-mlx) publishes wheels for
// cp39–cp313 only. Python 3.14, the Homebrew default on recent setups, has no
// MLX wheels, so the venv must be pinned to 3.13 or earlier.
const PREFERRED_PYTHON = '3.13'

const HEALTH_PROBE_TIMEOUT_MS = 2_500
const STARTUP_TIMEOUT_MS = 30_000
const POLL_INTERVAL_MS = 1_000

let asrProcess: ChildProcess | null = null

export function isAppleSilicon(): boolean {
  return process.platform === 'darwin' && process.arch === 'arm64'
}

// Auto-start only on Apple Silicon (MLX requirement) when parakeet is the
// chosen provider. ASR_PROVIDER unset keeps the V1 default: parakeet there.
export function shouldAutoStartAsr(): boolean {
  if (!isAppleSilicon()) return false
  const provider = process.env['ASR_PROVIDER']?.toLowerCase()
  return !provider || provider === 'parakeet'
}

// Path of the bundled asr-service/ folder, null when this install has none
// (npm package without the folder, or running on another machine).
function asrServicePath(): string | null {
  const candidates = [
    process.env['ASR_SERVICE_PATH'],
    // Running from the repo root.
    path.join(process.cwd(), 'asr-service'),
    // Running from kimaki/ inside the repo, or from kimaki/dist.
    path.join(import.meta.dirname, '..', '..', 'asr-service'),
    path.join(import.meta.dirname, '..', 'asr-service'),
  ].filter((value): value is string => Boolean(value))
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'asr_server.py'))) return candidate
  }
  return null
}

// The venv Python reports its version on --version; MLX needs 3.13 or earlier.
async function venvPythonCompatible(venvPython: string): Promise<boolean> {
  const result = await execFileAsync(venvPython, ['--version'], { timeout: 5_000 }).catch(() => null)
  if (!result) return true
  const match = /Python (\d+)\.(\d+)/.exec(result.stdout.trim())
  if (!match) return true
  const [major, minor] = [Number(match[1]), Number(match[2])]
  if (major > 3 || (major === 3 && minor > 13)) {
    logger.warn(`ASR venv Python ${major}.${minor} is incompatible with MLX (needs ${PREFERRED_PYTHON} or earlier)`)
    return false
  }
  return true
}

// Create or fix the venv at <servicePath>/.venv, with a Python that has MLX wheels.
async function ensureVenv(servicePath: string): Promise<AsrServiceError | null> {
  const venvPython = path.join(servicePath, '.venv', 'bin', 'python')
  if (fs.existsSync(venvPython) && (await venvPythonCompatible(venvPython))) return null
  if (fs.existsSync(venvPython)) {
    fs.rmSync(path.join(servicePath, '.venv'), { recursive: true, force: true })
  }
  const finder = await (async (): Promise<{ useUv: boolean; python: string | null }> => {
    for (const command of ['uv', 'python3.13', 'python3.12', 'python3']) {
      const which = await execFileAsync('which', [command], { timeout: 5_000 }).catch(() => null)
      if (which && which.stdout.trim()) return { useUv: command === 'uv', python: command === 'uv' ? null : command }
    }
    return { useUv: false, python: null }
  })()
  if (!finder.useUv && !finder.python) {
    return new AsrServiceError({
      reason: `no suitable Python found. Install Python ${PREFERRED_PYTHON} (brew install python@${PREFERRED_PYTHON}) or uv (brew install uv)`,
    })
  }
  const created = await (finder.useUv
    ? execFileAsync('uv', ['venv', '--python', PREFERRED_PYTHON, path.join(servicePath, '.venv')], { cwd: servicePath, timeout: 120_000 })
    : execFileAsync(finder.python!, ['-m', 'venv', path.join(servicePath, '.venv')], { cwd: servicePath, timeout: 120_000 })
  ).catch(
    (cause: unknown) =>
      new AsrServiceError({
        reason: `creating the venv with ${finder.useUv ? 'uv' : finder.python} failed`,
        cause,
      }),
  )
  if (created instanceof Error) return created
  if (!fs.existsSync(venvPython)) return new AsrServiceError({ reason: 'venv was created but has no python executable' })
  logger.log('ASR venv created')
  return null
}

// Install requirements.txt into the venv: uv pip when available (fast), else
// the venv's own pip, which avoids the Homebrew externally-managed error.
async function installDependencies(servicePath: string): Promise<AsrServiceError | null> {
  const requirements = path.join(servicePath, 'requirements.txt')
  if (!fs.existsSync(requirements)) return new AsrServiceError({ reason: `no requirements.txt at ${requirements}` })
  const venvPython = path.join(servicePath, '.venv', 'bin', 'python')
  if (!fs.existsSync(venvPython)) return new AsrServiceError({ reason: 'ASR venv not found' })
  const useUv = await execFileAsync('which', ['uv'], { timeout: 5_000 })
    .then(() => true)
    .catch(() => false)
  const child = useUv
    ? spawn('uv', ['pip', 'install', '-r', requirements, '--python', venvPython], { cwd: servicePath, stdio: ['ignore', 'pipe', 'pipe'] })
    : spawn(venvPython, ['-m', 'pip', 'install', '-r', requirements], { cwd: servicePath, stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout?.on('data', (data: Buffer) => logger.log(`[pip] ${data.toString().trim()}`))
  child.stderr?.on('data', (data: Buffer) => logger.warn(`[pip] ${data.toString().trim()}`))
  const code = await new Promise<number | null>((resolve) => {
    child.on('error', (error) => {
      logger.warn(`pip install failed: ${error.message}`)
      resolve(1)
    })
    child.on('exit', (code) => resolve(code))
  })
  if (code !== 0) return new AsrServiceError({ reason: `installing asr-service dependencies exited with code ${code}` })
  return null
}

// True when the service answers /health with the model loaded (not degraded).
async function healthy(url: string, timeoutMs: number): Promise<boolean> {
  const response = await fetch(new URL('/health', url), { signal: AbortSignal.timeout(timeoutMs) }).catch(() => null)
  if (!response?.ok) return false
  const body: unknown = await response.json().catch(() => null)
  return (
    typeof body === 'object' && body !== null && 'model_loaded' in body && body['model_loaded'] === true
  )
}

// The URL the locally spawned server answers on (ASR_HOST/ASR_PORT), which is
// not always ASR_SERVICE_URL: readiness is polled here, not on a remote host.
function localUrl(): string {
  return `http://${process.env['ASR_HOST'] ?? '127.0.0.1'}:${process.env['ASR_PORT'] ?? '8765'}`
}

// Auto-start only makes sense for a local URL: a remote ASR_SERVICE_URL (the
// Mac Studio) is the intended provider — when it is down, fall through to the
// cloud instead of spawning a server the transcription would never call.
function isLocalUrl(url: string): boolean {
  const host = errore.try(() => new URL(url).hostname, () => null)
  return host === '127.0.0.1' || host === 'localhost' || host === '::1'
}

// True when anything answers /health (even while the model is still loading):
// the port is taken, so a second server must not be spawned.
async function answering(url: string, timeoutMs: number): Promise<boolean> {
  const response = await fetch(new URL('/health', url), { signal: AbortSignal.timeout(timeoutMs) }).catch(() => null)
  return response !== null
}

// Spawn the server and wait until the model is loaded, or kill it on timeout.
async function spawnAndAwaitReady(servicePath: string): Promise<AsrServiceError | null> {
  const venvPython = path.join(servicePath, '.venv', 'bin', 'python')
  asrProcess = spawn(venvPython, ['asr_server.py'], {
    cwd: servicePath,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ASR_PORT: process.env['ASR_PORT'] ?? '8765',
      ASR_HOST: process.env['ASR_HOST'] ?? '127.0.0.1',
    },
  })
  asrProcess.stdout?.on('data', (data: Buffer) => logger.log(`[ASR] ${data.toString().trim()}`))
  asrProcess.stderr?.on('data', (data: Buffer) => logger.warn(`[ASR] ${data.toString().trim()}`))
  asrProcess.on('error', (error) => {
    logger.error(`ASR service error: ${error.message}`)
    asrProcess = null
  })
  asrProcess.on('exit', (code) => {
    logger.log(`ASR service exited with code ${code}`)
    asrProcess = null
  })
  const deadline = Date.now() + STARTUP_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (!asrProcess) return new AsrServiceError({ reason: 'ASR service exited during startup' })
    if (await healthy(ASR_SERVICE_URL, HEALTH_PROBE_TIMEOUT_MS)) {
      logger.log('ASR service is ready')
      return null
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
  asrProcess.kill('SIGTERM')
  asrProcess = null
  return new AsrServiceError({ reason: `ASR service did not become ready within ${STARTUP_TIMEOUT_MS / 1000}s` })
}

// Start the local service: already running -> done, else venv + deps + spawn.
// Returns an error value on failure, null on success (errore convention).
export async function startAsrService(): Promise<AsrServiceError | null> {
  // answering(), not healthy(): a degraded service (model still loading) already
  // owns the port, and spawning a second one would just crash on EADDRINUSE.
  if (await answering(ASR_SERVICE_URL, HEALTH_PROBE_TIMEOUT_MS)) {
    logger.log('ASR service already running')
    return null
  }
  const servicePath = asrServicePath()
  if (!servicePath) {
    logger.warn('asr-service/ folder not found. Set ASR_SERVICE_URL to a running server, or ASR_SERVICE_PATH to the folder')
    return new AsrServiceError({ reason: 'asr-service folder not found' })
  }
  logger.log(`starting ASR service from ${servicePath}`)
  const venv = await ensureVenv(servicePath)
  if (venv instanceof Error) return venv
  const spawned = await spawnAndAwaitReady(servicePath)
  if (!(spawned instanceof Error)) return null
  // A fresh checkout has no venv packages: install and retry once.
  logger.log('ASR service failed to start, installing dependencies and retrying')
  const installed = await installDependencies(servicePath)
  if (installed instanceof Error) return installed
  return spawnAndAwaitReady(servicePath)
}

// Stop the server this process started (bot shutdown). A server started
// outside (launchd, another machine, a manual terminal) is left alone.
export function stopAsrService(): void {
  if (!asrProcess) return
  logger.log('stopping ASR service')
  asrProcess.kill('SIGTERM')
  asrProcess = null
}

// The transcriber probe voice.ts uses per voice message: use the service at
// baseUrl when it answers; start the local one first when autoStart is set
// (production: shouldAutoStartAsr()) and the URL is local. null when
// unavailable: voice.ts then falls through to the cloud providers.
export async function parakeetTranscriber({ baseUrl, autoStart }: { baseUrl: string; autoStart: boolean }): Promise<{ kind: 'parakeet' } | null> {
  // An explicit ASR_PROVIDER override (openai, gemini, none) disables parakeet.
  const provider = process.env['ASR_PROVIDER']?.toLowerCase()
  if (provider && provider !== 'parakeet') return null
  if (await healthy(baseUrl, HEALTH_PROBE_TIMEOUT_MS)) return { kind: 'parakeet' }
  if (await answering(baseUrl, HEALTH_PROBE_TIMEOUT_MS)) {
    logger.warn('ASR service is up but its model is still loading; transcription may wait or fail once')
    return { kind: 'parakeet' }
  }
  // A remote ASR_SERVICE_URL (the Mac Studio) is the intended provider: when
  // it is down, fall through to the cloud instead of spawning a local server
  // the transcription request would never call.
  if (!isLocalUrl(baseUrl) || !autoStart || !shouldAutoStartAsr()) return null
  const started = await startAsrService()
  if (started instanceof Error) {
    logger.warn('local ASR service could not start, falling back to cloud transcription', started)
    return null
  }
  return { kind: 'parakeet' }
}
