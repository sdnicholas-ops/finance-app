#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Market Dashboard — Demo Startup Script
# Starts the finance proxy server (port 3001) and Vite dev server (port 3000),
# then opens the dashboard in your default browser.
# Stop both servers with Ctrl+C.
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── Colours ──────────────────────────────────────────────────────────────────
BOLD='\033[1m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[0;33m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}  📈 Market Dashboard — Starting up...${RESET}"
echo ""

# ── Kill any existing processes on the demo ports ────────────────────────────
for PORT in 3000 3001; do
  PIDS=$(lsof -ti:$PORT 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo -e "${YELLOW}  ⚠  Clearing existing process on port $PORT${RESET}"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
  fi
done

# ── Start finance proxy on port 3001 ─────────────────────────────────────────
echo -e "${GREEN}  ▶  Starting finance proxy  (http://localhost:3001)${RESET}"
node server/proxy.cjs &
PROXY_PID=$!

# Give the proxy a moment to bind
sleep 1

# ── Start Vite dev server on port 3000 ───────────────────────────────────────
echo -e "${GREEN}  ▶  Starting Vite dev server (http://localhost:3000)${RESET}"
npm run dev &
VITE_PID=$!

# ── Wait for Vite to be ready, then open browser ─────────────────────────────
echo ""
echo -e "  Waiting for Vite..."
for i in $(seq 1 20); do
  if curl -s http://localhost:3000 -o /dev/null 2>/dev/null; then
    break
  fi
  sleep 0.5
done

echo ""
echo -e "${BOLD}${GREEN}  ✓  Dashboard ready → http://localhost:3000${RESET}"
echo ""
echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop both servers."
echo ""

# Open in default browser (macOS)
open "http://localhost:3000" 2>/dev/null || true

# ── Trap Ctrl+C — shut down both servers cleanly ─────────────────────────────
cleanup() {
  echo ""
  echo -e "${YELLOW}  Stopping servers...${RESET}"
  kill "$PROXY_PID" 2>/dev/null || true
  kill "$VITE_PID"  2>/dev/null || true
  echo -e "${GREEN}  Done.${RESET}"
  echo ""
  exit 0
}
trap cleanup INT TERM

# Keep the script alive until Ctrl+C
wait
