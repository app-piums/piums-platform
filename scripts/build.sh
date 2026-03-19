#!/usr/bin/env bash
# =============================================================================
# build.sh — Compile all TypeScript packages and services
# Usage: ./scripts/build.sh [--service <name>] [--packages-only] [--parallel]
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[build]${NC} $*"; }
ok()   { echo -e "${GREEN}[build]${NC} ✓ $*"; }
fail() { echo -e "${RED}[build]${NC} ✗ $*"; }

TARGET_SERVICE=""
PACKAGES_ONLY=false
PARALLEL=false
ERRORS=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service)      TARGET_SERVICE="$2"; shift 2 ;;
    --packages-only) PACKAGES_ONLY=true; shift ;;
    --parallel)     PARALLEL=true; shift ;;
    *) echo "Usage: $0 [--service <name>] [--packages-only] [--parallel]"; exit 1 ;;
  esac
done

build_package() {
  local name="$1" dir="$2"
  [[ -d "$dir" && -f "$dir/package.json" ]] || return 0
  log "Building $name..."
  if (cd "$dir" && pnpm build 2>&1); then
    ok "$name"
  else
    fail "$name"
    ERRORS=$((ERRORS + 1))
  fi
}

# ─────────────────────── 1. Shared packages (order matters) ──────────────────
log "=== Building shared packages ==="

build_package "shared-types"  "$ROOT_DIR/packages/shared-types"
build_package "shared-config" "$ROOT_DIR/packages/shared-config"
build_package "shared-utils"  "$ROOT_DIR/packages/shared-utils"
build_package "ui"            "$ROOT_DIR/packages/ui"
build_package "sdk"           "$ROOT_DIR/packages/sdk"

[[ "$PACKAGES_ONLY" == true ]] && { [[ $ERRORS -eq 0 ]] && ok "All packages built ✨" || exit 1; exit 0; }

# ─────────────────────── 2. Services ─────────────────────────────────────────
log "=== Building services ==="

SERVICES=(auth users artists catalog payments reviews notifications booking search chat)

for svc in "${SERVICES[@]}"; do
  [[ -n "$TARGET_SERVICE" && "$TARGET_SERVICE" != "$svc" ]] && continue
  build_package "${svc}-service" "$ROOT_DIR/services/${svc}-service"
done

# ─────────────────────── 3. Gateway ──────────────────────────────────────────
[[ -z "$TARGET_SERVICE" || "$TARGET_SERVICE" == "gateway" ]] && \
  build_package "gateway" "$ROOT_DIR/apps/gateway"

# ─────────────────────── Summary ─────────────────────────────────────────────
echo ""
if [[ $ERRORS -eq 0 ]]; then
  ok "All builds successful ✨"
else
  fail "$ERRORS build(s) failed"
  exit 1
fi
