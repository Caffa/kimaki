#!/bin/bash
# build_reinstall.sh — Rebuild the local kimaki fork (V2) and re-link it globally.
#
# Before rebuilding, this script checks if a kimaki bot instance is currently
# running on the lock port (default 29988). If so, it sends SIGTERM to the
# process and waits for it to exit cleanly before proceeding.
#
# This prevents corrupting the npm symlink or replacing code under a live
# process, which can cause half-loaded modules and crashes.
#
# Usage:
#   ./build_reinstall.sh          # build, unlink old, re-link
#   ./build_reinstall.sh --no-build  # just stop running instance + re-link (skip build)

set -euo pipefail

REPO_DIR="/Users/caffae/Local-Projects-2026/kimaki-v2"
OLD_REPO_DIR="/Users/caffae/Local-Projects-2026/kimaki"
LOCK_PORT="${KIMAKI_LOCK_PORT:-29988}"
HEALTH_URL="http://127.0.0.1:${LOCK_PORT}/health"
MAX_WAIT_SECONDS=15

cd "$REPO_DIR"

# ── 1. Check if kimaki is running and stop it ──────────────────────────────

echo "Checking for running kimaki instance on port ${LOCK_PORT}..."

HEALTH_RESPONSE=$(curl -s --max-time 2 "$HEALTH_URL" 2>/dev/null || echo "")

if [ -n "$HEALTH_RESPONSE" ]; then
  PID=$(echo "$HEALTH_RESPONSE" | grep -o '"pid":[0-9]*' | grep -o '[0-9]*' || echo "")

  if [ -n "$PID" ] && [ "$PID" != "0" ]; then
    echo "Found running kimaki instance (PID: ${PID}). Sending SIGTERM..."

    kill -SIGTERM "$PID" 2>/dev/null || {
      echo "Warning: failed to send SIGTERM to PID ${PID} (process may have already exited)"
    }

    # Wait for the process to exit
    EXITED=false
    WAITED=0
    while [ "$WAITED" -lt "$MAX_WAIT_SECONDS" ]; do
      sleep 1
      WAITED=$((WAITED + 1))

      if ! kill -0 "$PID" 2>/dev/null; then
        echo "kimaki process (PID ${PID}) exited after ${WAITED}s."
        EXITED=true
        break
      fi

      STILL_RUNNING=$(curl -s --max-time 1 "$HEALTH_URL" 2>/dev/null || echo "")
      if [ -z "$STILL_RUNNING" ]; then
        echo "kimaki process (PID ${PID}) exited after ${WAITED}s (health endpoint unreachable)."
        EXITED=true
        break
      fi

      echo "  ...waiting for clean shutdown (${WAITED}s elapsed)"
    done

    if [ "$EXITED" = "false" ]; then
      echo "Error: kimaki process (PID ${PID}) did not exit within ${MAX_WAIT_SECONDS}s."
      echo "Aborting rebuild to avoid corrupting the symlink under a live process."
      echo "You can manually kill it with: kill -9 ${PID}"
      exit 1
    fi
  else
    echo "Health endpoint responded but no PID found in response: ${HEALTH_RESPONSE}"
    echo "Proceeding with rebuild (assuming no running instance)."
  fi
else
  echo "No kimaki instance detected on port ${LOCK_PORT}."
fi

# ── 2. Build the kimaki package ─────────────────────────────────────────────

SKIP_BUILD=false
for arg in "$@"; do
  case "$arg" in
    --no-build)
      SKIP_BUILD=true
      ;;
  esac
done

if [ "$SKIP_BUILD" = "false" ]; then
  echo ""
  echo "Building kimaki (V2 fork)..."
  # Submodules first: a fresh clone has empty errore/, gateway-proxy/ etc.
  git submodule update --init --depth 1
  # Workspace install covers kimaki/ and the test packages it imports.
  pnpm install
  (cd kimaki && pnpm build)
  echo "Build complete."
else
  echo "Skipping build (--no-build flag)."
fi

# ── 3. Uninstall global kimaki and re-link ────────────────────────────────

echo ""
echo "Re-linking the V2 fork globally..."

npm uninstall -g kimaki 2>/dev/null || true

(cd kimaki && npm link)

echo ""
echo "Done. kimaki is now linked to: ${REPO_DIR}/kimaki"
echo "(The V1 fork stays at ${OLD_REPO_DIR} — to go back: cd ${OLD_REPO_DIR}/cli && npm link)"
echo "Start it with: kimaki"
echo ""
echo "Voice transcription uses the parakeet ASR service: it auto-starts locally on"
echo "Apple Silicon, or set ASR_SERVICE_URL to the Mac Studio server."
