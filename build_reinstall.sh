#!/bin/bash
# build_reinstall.sh — Rebuild the local kimaki fork and re-link it globally.
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

REPO_DIR="/Users/caffae/Local-Projects-2026/kimaki"
LOCK_PORT="${KIMAKI_LOCK_PORT:-29988}"
HEALTH_URL="http://127.0.0.1:${LOCK_PORT}/health"
MAX_WAIT_SECONDS=15

cd "$REPO_DIR"

# ── 1. Check if kimaki is running and stop it ──────────────────────────

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

      # Check if the process is still alive
      if ! kill -0 "$PID" 2>/dev/null; then
        echo "kimaki process (PID ${PID}) exited after ${WAITED}s."
        EXITED=true
        break
      fi

      # Double-check via health endpoint
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

# ── 2. Build the CLI package ───────────────────────────────────────────

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
  echo "Building kimaki CLI..."
  cd "$REPO_DIR/cli"
  pnpm install
  pnpm build
  cd "$REPO_DIR"
  echo "Build complete."
else
  echo "Skipping build (--no-build flag)."
fi

# ── 3. Uninstall global kimaki and re-link ─────────────────────────────

echo ""
echo "Re-linking local fork globally..."

# Uninstall the global npm kimaki if it exists (from a previous npm i -g install)
npm uninstall -g kimaki 2>/dev/null || true

# Re-link the local fork so the global `kimaki` command points to this repo
cd "$REPO_DIR/cli"
npm link
cd "$REPO_DIR"

echo ""
echo "Done. kimaki is now linked to: ${REPO_DIR}"
echo "Start it with: kimaki"
echo ""
echo "For voice support, the parakeet ASR service auto-starts on Apple Silicon."
echo "To manually start it: cd asr-service && python3 -m uvicorn asr_server:app --host 127.0.0.1 --port 8765"