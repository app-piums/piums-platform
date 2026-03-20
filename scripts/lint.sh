#!/usr/bin/env bash
# =============================================================================
# lint.sh — ESLint + TypeScript type-check across all packages and services
# Usage: ./scripts/lint.sh [--fix] [--service <name>]
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[lint]${NC} $*"; }
ok()   { echo -e "${GREEN}[lint]${NC} ✓ $*"; }
warn() { echo -e "${YELLOW}[lint]${NC} ⚠ $*"; }
fail() { echo -e "${RED}[lint]${NC} ✗ $*"; }

FIX_FLAG=""
TARGET_SERVICE=""
ERRORS=0

# ─────────────────────── Argument parsing ────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --fix)     FIX_FLAG="--fix"; shift ;;
    --service) TARGET_SERVICE="$2"; shift 2 ;;
    *) echo "Usage: $0 [--fix] [--service <name>]"; exit 1 ;;
  esac
done

run_tsc() {
  local name="$1" dir="$2"
  if [[ -f "$dir/tsconfig.json" ]]; then
    log "type-check: $name"
    if (cd "$dir" && npx tsc --noEmit 2>&1); then
      ok "$name"
    else
      fail "$name — TypeScript errors"
      ERRORS=$((ERRORS + 1))
    fi
  fi
}

run_eslint() {
  local name="$1" dir="$2"
  if [[ -f "$dir/.eslintrc*" || -f "$dir/eslint.config*" ]]; then
    log "eslint: $name"
    if (cd "$dir" && npx eslint "src/**/*.{ts,tsx}" $FIX_FLAG 2>&1); then
      ok "$name"
    else
      fail "$name — ESLint errors"
      ERRORS=$((ERRORS + 1))
    fi
  fi
}

# ─────────────────────── Packages ────────────────────────────────────────────
PACKAGES=(shared-types shared-utils shared-config ui)

for pkg in "${PACKAGES[@]}"; do
  dir="$ROOT_DIR/packages/$pkg"
  [[ -d "$dir" ]] || continue
  [[ -n "$TARGET_SERVICE" && "$TARGET_SERVICE" != "$pkg" ]] && continue
  run_tsc "packages/$pkg" "$dir"
done

# ─────────────────────── Services ────────────────────────────────────────────
SERVICES=(gateway auth users artists catalog payments reviews notifications booking search chat)

for svc in "${SERVICES[@]}"; do
  if [[ "$svc" == "gateway" ]]; then
    dir="$ROOT_DIR/apps/gateway"
  else
    dir="$ROOT_DIR/services/${svc}-service"
  fi
  [[ -d "$dir" ]] || continue
  [[ -n "$TARGET_SERVICE" && "$TARGET_SERVICE" != "$svc" ]] && continue
  run_tsc "$svc" "$dir"
  run_eslint "$svc" "$dir"
done

# ─────────────────────── Frontend ────────────────────────────────────────────
for app in web-client web-artist; do
  dir="$ROOT_DIR/apps/$app"
  [[ -d "$dir" ]] || continue
  [[ -n "$TARGET_SERVICE" && "$TARGET_SERVICE" != "$app" ]] && continue
  run_tsc "$app" "$dir"
  run_eslint "$app" "$dir"
done

# ─────────────────────── Summary ─────────────────────────────────────────────
echo ""
if [[ $ERRORS -eq 0 ]]; then
  ok "All lint checks passed ✨"
else
  fail "$ERRORS check(s) failed"
  exit 1
fi
