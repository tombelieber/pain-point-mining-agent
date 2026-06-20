#!/bin/sh
set -eu

# pain-point-mining-agent installer
# Usage: curl -fsSL https://pain-point-mining.tomtang3.ai/install.sh | sh
#
# Environment variables:
#   PAIN_POINT_MINING_REF - Git ref/tag/branch to install (default: main)
#   PAIN_POINT_MINING_TARGET - codex, claude, or both (default: both)
#   DO_NOT_TRACK=1 or PAIN_POINT_MINING_DISABLE_TRACKING=1 disables install-source ping.

REPO="tombelieber/pain-point-mining-agent"
REF="${PAIN_POINT_MINING_REF:-main}"
TARGET="${PAIN_POINT_MINING_TARGET:-both}"

if [ -t 1 ]; then
  BOLD='\033[1m'
  DIM='\033[2m'
  GREEN='\033[32m'
  RED='\033[31m'
  RESET='\033[0m'
else
  BOLD='' DIM='' GREEN='' RED='' RESET=''
fi

info() { printf "${BOLD}%s${RESET}\n" "$1"; }
success() { printf "${GREEN}${BOLD}%s${RESET}\n" "$1"; }
dim() { printf "${DIM}%s${RESET}\n" "$1"; }
error() { printf "${RED}error: %s${RESET}\n" "$1" >&2; exit 1; }

command -v npm >/dev/null 2>&1 || error "npm is required. Install Node.js 18+ first."

info "Installing pain-point-mining-agent..."
dim "  Source: github:${REPO}#${REF}"
dim "  Target: ${TARGET}"

npm install -g "github:${REPO}#${REF}"
pain-point-mining install --target "$TARGET" --source install_sh

if command -v pain-point-mining >/dev/null 2>&1; then
  version="$(pain-point-mining --version 2>/dev/null || true)"
  success "pain-point-mining-agent ${version:-installed} installed successfully."
else
  error "Installed package, but pain-point-mining is not on PATH."
fi
