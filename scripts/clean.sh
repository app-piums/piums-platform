#!/usr/bin/env bash
# =============================================================================
# clean.sh — Clean build artifacts, node_modules, Docker volumes
# Usage: ./scripts/clean.sh [--all] [--docker] [--deps] [--dist]
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[clean]${NC} $*"; }
ok()   { echo -e "${GREEN}[clean]${NC} ✓ $*"; }
warn() { echo -e "${YELLOW}[clean]${NC} ⚠ $*"; }

CLEAN_ALL=false
CLEAN_DOCKER=false
CLEAN_DEPS=false
CLEAN_DIST=false

if [[ $# -eq 0 ]]; then
  CLEAN_DIST=true  # default: only dist
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)    CLEAN_ALL=true; shift ;;
    --docker) CLEAN_DOCKER=true; shift ;;
    --deps)   CLEAN_DEPS=true; shift ;;
    --dist)   CLEAN_DIST=true; shift ;;
    *) echo "Usage: $0 [--all] [--docker] [--deps] [--dist]"; exit 1 ;;
  esac
done

[[ "$CLEAN_ALL" == true ]] && { CLEAN_DOCKER=true; CLEAN_DEPS=true; CLEAN_DIST=true; }

# ─────────────────────── Build artifacts ─────────────────────────────────────
if [[ "$CLEAN_DIST" == true || "$CLEAN_ALL" == true ]]; then
  log "Cleaning dist/ folders..."
  find "$ROOT_DIR" -name "dist" -type d \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    | while read -r dir; do
        rm -rf "$dir"
        log "  removed $dir"
      done
  find "$ROOT_DIR" -name "*.tsbuildinfo" -not -path "*/node_modules/*" -delete
  ok "dist/ folders cleaned"
fi

# ─────────────────────── Node modules ────────────────────────────────────────
if [[ "$CLEAN_DEPS" == true ]]; then
  warn "Removing ALL node_modules (this will require pnpm install to rebuild)"
  find "$ROOT_DIR" -name "node_modules" -type d \
    -not -path "*/.git/*" \
    -prune \
    | while read -r dir; do
        rm -rf "$dir"
        log "  removed $dir"
      done
  ok "node_modules cleaned"
fi

# ─────────────────────── Docker ──────────────────────────────────────────────
if [[ "$CLEAN_DOCKER" == true ]]; then
  log "Stopping and removing Docker containers/volumes..."
  if docker compose -f "$ROOT_DIR/infra/docker/docker-compose.dev.yml" ps -q 2>/dev/null | grep -q .; then
    docker compose -f "$ROOT_DIR/infra/docker/docker-compose.dev.yml" down -v --remove-orphans
    ok "Docker containers and volumes removed"
  else
    warn "No running Docker containers found"
  fi
fi

# ─────────────────────── Misc ────────────────────────────────────────────────
log "Cleaning misc artifacts..."
find "$ROOT_DIR" -name ".next" -type d -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
find "$ROOT_DIR" -name "*.log" -not -path "*/node_modules/*" -delete 2>/dev/null || true
find "$ROOT_DIR" -name ".turbo" -type d -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true

ok "Clean complete ✨"
echo ""
echo "To reinstall dependencies: pnpm install"
echo "To rebuild packages:        ./scripts/build.sh --packages-only"
echo "To start dev stack:         ./scripts/dev.sh start"
