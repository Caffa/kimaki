// ASR Service Manager - Automatically starts/stops parakeet-mlx service
import { spawn, execFileSync, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createLogger, LogPrefix } from './logger.js'

// ESM-compatible __dirname equivalent
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const asrLogger = createLogger(LogPrefix.ASR)

let asrProcess: ChildProcess | null = null

/**
 * Preferred Python version for the ASR venv.
 *
 * MLX (the Apple Silicon backend used by parakeet-mlx) publishes wheels for
 * cp39–cp313 only.  Python 3.14 (the Homebrew default on recent setups) has
 * no MLX wheels, so we must pin the venv to 3.13 or earlier.
 */
const PREFERRED_PYTHON = '3.13'

/**
 * Check whether a given executable exists on PATH.
 */
function commandExists(cmd: string): boolean {
  try {
    execFileSync('which', [cmd], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Find a suitable Python interpreter for creating the venv.
 *
 * Preference order:
 *  1. `uv` (can auto-download the exact version we need)
 *  2. `python3.13` on PATH (Homebrew provides this alongside 3.14)
 *  3. `python3.12` on PATH
 *  4. `python3` on PATH (last resort — may be 3.14 which lacks MLX wheels)
 *
 * Returns `{ uv: true }` when uv should be used, or `{ python: '<path>' }`
 * for a specific interpreter to pass to `python -m venv`.
 */
function findPythonForVenv(): { uv: true } | { python: string } | null {
  if (commandExists('uv')) {
    return { uv: true }
  }
  for (const candidate of ['python3.13', 'python3.12']) {
    if (commandExists(candidate)) {
      return { python: candidate }
    }
  }
  if (commandExists('python3')) {
    return { python: 'python3' }
  }
  return null
}

/**
 * Get the path to the venv's Python executable.
 */
function getVenvPythonPath(servicePath: string): string {
  return path.join(servicePath, '.venv', 'bin', 'python')
}

/**
 * Check if the venv's Python version is compatible with MLX.
 *
 * MLX publishes wheels for cp39–cp313 only.  Python 3.14+ will fail to
 * install parakeet-mlx dependencies, so we detect and recreate the venv.
 *
 * Returns true if the Python version is 3.13 or earlier.
 */
function checkVenvPythonCompatible(venvPython: string): boolean {
  try {
    const output = execFileSync(venvPython, ['--version'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
      timeout: 5_000,
    }).trim()
    // Output format: "Python 3.13.11"
    const match = output.match(/Python (\d+)\.(\d+)/)
    if (!match) {
      return true // Can't determine version — assume compatible
    }
    const major = parseInt(match[1]!, 10)
    const minor = parseInt(match[2]!, 10)
    if (major > 3 || (major === 3 && minor > 13)) {
      asrLogger.warn(`ASR venv Python ${major}.${minor} is incompatible with MLX (needs 3.13 or earlier)`)
      return false
    }
    return true
  } catch {
    // If we can't check the version, assume compatible to avoid false negatives
    return true
  }
}

/**
 * Create the ASR virtual environment if it doesn't already exist.
 *
 * Returns `true` if the venv is ready (either pre-existing or newly created).
 * The venv is created at `<servicePath>/.venv` using Python 3.13 (or the
 * closest available version) so that MLX wheels are installable.
 */
function ensureVenv(servicePath: string): boolean {
  const venvPython = getVenvPythonPath(servicePath)
  if (fs.existsSync(venvPython)) {
    // Verify the existing venv has a compatible Python version.
    // MLX has no wheels for Python 3.14+, so a venv created with the wrong
    // version would fail cryptically during dependency installation.
    if (!checkVenvPythonCompatible(venvPython)) {
      asrLogger.warn(
        `ASR venv has incompatible Python version. Removing and recreating with Python ${PREFERRED_PYTHON}...`
      )
      fs.rmSync(path.join(servicePath, '.venv'), { recursive: true, force: true })
      // Fall through to venv creation below
    } else {
      return true
    }
  }

  const venvDir = path.join(servicePath, '.venv')
  const finder = findPythonForVenv()
  if (!finder) {
    asrLogger.error(
      'No suitable Python interpreter found for ASR venv. ' +
      'Install Python 3.13 (brew install python@3.13) or uv (brew install uv).'
    )
    return false
  }

  try {
    if ('uv' in finder) {
      asrLogger.log(`Creating ASR venv with uv (Python ${PREFERRED_PYTHON})...`)
      execFileSync('uv', ['venv', '--python', PREFERRED_PYTHON, venvDir], {
        cwd: servicePath,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      })
    } else {
      asrLogger.log(`Creating ASR venv with ${finder.python}...`)
      execFileSync(finder.python, ['-m', 'venv', venvDir], {
        cwd: servicePath,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: process.env,
      })
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    asrLogger.error(`Failed to create ASR venv: ${msg}`)
    return false
  }

  if (!fs.existsSync(venvPython)) {
    asrLogger.error('ASR venv was created but python executable not found')
    return false
  }

  asrLogger.log('ASR venv created successfully')
  return true
}

/**
 * Check if running on Apple Silicon (required for MLX).
 * MLX only works on macOS with arm64 architecture.
 */
export function isAppleSilicon(): boolean {
  return process.platform === 'darwin' && process.arch === 'arm64'
}

/**
 * Get the path to the ASR service directory.
 * Looks for asr-service/ relative to the project root.
 */
function getAsrServicePath(): string | null {
  // Try multiple possible locations
  const possiblePaths = [
    // Running from source root (cwd = repo root)
    path.join(process.cwd(), 'asr-service'),
    // Running from source (cwd = cli/)
    path.join(process.cwd(), '..', 'asr-service'),
    // Running from compiled dist (cli/dist/) — asr-service is at repo root
    path.join(__dirname, '..', '..', 'asr-service'),
    // Running from npm-linked package where asr-service is bundled alongside
    path.join(__dirname, '..', 'asr-service'),
    // Running from global npm
    path.join(__dirname, '..', '..', '..', 'asr-service'),
  ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p
    }
  }

  // Check environment variable
  const envPath = process.env.ASR_SERVICE_PATH
  if (envPath && fs.existsSync(envPath)) {
    return envPath
  }

  return null
}

/**
 * Check if the ASR service is already running and model is loaded.
 */
export async function checkAsrServiceRunning(): Promise<boolean> {
  const port = process.env.ASR_PORT || '8765'
  const host = process.env.ASR_HOST || '127.0.0.1'
  
  try {
    const response = await fetch(`http://${host}:${port}/health`, {
      method: 'GET',
    })
    if (!response.ok) {
      return false
    }
    // Parse body to verify model is actually loaded (not just "degraded")
    const body = await response.json() as { model_loaded?: boolean }
    return body.model_loaded === true
  } catch {
    return false
  }
}

/**
 * Start the parakeet ASR service.
 * Returns true if service started successfully (or already running).
 */
export async function startAsrService(): Promise<boolean> {
  // Check if already running
  if (await checkAsrServiceRunning()) {
    asrLogger.log('ASR service already running')
    return true
  }

  const servicePath = getAsrServicePath()
  
  if (!servicePath) {
    asrLogger.warn(
      'ASR service directory not found. To enable parakeet ASR:\n' +
      '  1. Ensure asr-service/ folder exists in kimaki project\n' +
      '  2. Or set ASR_SERVICE_PATH environment variable'
    )
    return false
  }

  asrLogger.log(`Starting ASR service from ${servicePath}...`)

  try {
    // Ensure a Python 3.13 venv exists (MLX has no wheels for 3.14)
    if (!ensureVenv(servicePath)) {
      asrLogger.warn('ASR service could not be started: venv setup failed')
      return false
    }

    const result = await spawnAsrProcess(servicePath)
    if (result) {
      asrLogger.log('ASR service started successfully')
      return true
    }
    
    // Process exited — try installing dependencies and retry once
    asrLogger.log('ASR service failed to start, attempting to install dependencies...')
    const installed = await installAsrDependencies(servicePath)
    if (installed) {
      asrLogger.log('Dependencies installed, retrying ASR service...')
      const retryResult = await spawnAsrProcess(servicePath)
      if (retryResult) {
        asrLogger.log('ASR service started successfully after installing dependencies')
        return true
      }
    }
    
    asrLogger.warn('ASR service could not be started')
    return false

  } catch (error) {
    asrLogger.error(`Failed to start ASR service: ${error}`)
    return false
  }
}

/**
 * Spawn the ASR Python process and wait for it to become ready.
 * Returns true if the service becomes healthy within the timeout.
 */
async function spawnAsrProcess(servicePath: string): Promise<boolean> {
  const venvPython = getVenvPythonPath(servicePath)
  if (!fs.existsSync(venvPython)) {
    asrLogger.warn('ASR venv not found — run ensureVenv first')
    return false
  }

  asrProcess = spawn(venvPython, ['asr_server.py'], {
    cwd: servicePath,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      ASR_PORT: process.env.ASR_PORT || '8765',
      ASR_HOST: process.env.ASR_HOST || '127.0.0.1',
    },
  })

  asrProcess.stdout?.on('data', (data) => {
    asrLogger.log(`[ASR] ${data.toString().trim()}`)
  })

  asrProcess.stderr?.on('data', (data) => {
    asrLogger.warn(`[ASR] ${data.toString().trim()}`)
  })

  asrProcess.on('error', (error) => {
    asrLogger.error(`ASR service error: ${error.message}`)
    asrProcess = null
  })

  asrProcess.on('exit', (code) => {
    asrLogger.log(`ASR service exited with code ${code}`)
    asrProcess = null
  })

  // Wait for health check to pass (max 30 seconds), or for process to exit
  const maxWaitMs = 30_000
  const pollIntervalMs = 1_000
  const deadline = Date.now() + maxWaitMs

  while (Date.now() < deadline) {
    // Check if process already exited
    if (!asrProcess) {
      return false
    }

    // Check health
    if (await checkAsrServiceRunning()) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs))
  }

  asrLogger.warn('ASR service did not become ready in time, killing process')
  asrProcess?.kill('SIGTERM')
  asrProcess = null
  return false
}

/**
 * Attempt to install ASR service Python dependencies into the venv.
 *
 * Uses `uv pip install` when uv is available (fast, handles resolution well),
 * otherwise falls back to the venv's own pip.  Both approaches install into
 * `<servicePath>/.venv`, avoiding the Homebrew "externally-managed-environment"
 * error that occurs when installing into the system Python.
 *
 * Returns true if installation succeeded.
 */
async function installAsrDependencies(servicePath: string): Promise<boolean> {
  const requirementsPath = path.join(servicePath, 'requirements.txt')
  if (!fs.existsSync(requirementsPath)) {
    asrLogger.warn(`No requirements.txt found at ${requirementsPath}`)
    return false
  }

  const venvPython = getVenvPythonPath(servicePath)
  if (!fs.existsSync(venvPython)) {
    asrLogger.warn('ASR venv not found — cannot install dependencies')
    return false
  }

  const useUv = commandExists('uv')

  return new Promise((resolve) => {
    const child = useUv
      ? spawn('uv', ['pip', 'install', '-r', requirementsPath, '--python', venvPython], {
          cwd: servicePath,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: process.env,
        })
      : spawn(venvPython, ['-m', 'pip', 'install', '-r', requirementsPath], {
          cwd: servicePath,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: process.env,
        })

    child.stdout?.on('data', (data) => {
      asrLogger.log(`[pip] ${data.toString().trim()}`)
    })

    child.stderr?.on('data', (data) => {
      asrLogger.warn(`[pip] ${data.toString().trim()}`)
    })

    child.on('error', (error) => {
      asrLogger.error(`pip install failed: ${error.message}`)
      resolve(false)
    })

    child.on('exit', (code) => {
      asrLogger.log(`pip install exited with code ${code}`)
      resolve(code === 0)
    })
  })
}

/**
 * Stop the ASR service if we started it.
 */
export function stopAsrService(): void {
  if (asrProcess) {
    asrLogger.log('Stopping ASR service...')
    asrProcess.kill('SIGTERM')
    asrProcess = null
  }
}

/**
 * Check if we should auto-start the ASR service.
 * Auto-starts only if:
 * 1. ASR_PROVIDER is not set (parakeet is default on Apple Silicon)
 * 2. ASR_PROVIDER is explicitly set to 'parakeet'
 * 3. Running on Apple Silicon (MLX requirement)
 */
export function shouldAutoStartAsr(): boolean {
  // Don't auto-start on non-Apple Silicon platforms
  if (!isAppleSilicon()) {
    return false
  }

  const provider = process.env.ASR_PROVIDER?.toLowerCase()
  return !provider || provider === 'parakeet'
}
