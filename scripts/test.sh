#!/usr/bin/env bash
# =============================================================================
# test.sh — Run tests across all services
# Usage: ./scripts/test.sh [--service <name>] [--coverage] [--watch]
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[test]${NC} $*"; }
ok()   { echo -e "${GREEN}[test]${NC} ✓ $*"; }
warn() { echo -e "${YELLOW}[test]${NC} ⚠ $*"; }
fail() { echo -e "${RED}[test]${NC} ✗ $*"; }

TARGET_SERVICE=""
COVERAGE=false
WATCH=false
ERRORS=0
PASSED=0
SKIPPED=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --service)  TARGET_SERVICE="$2"; shift 2 ;;
    --coverage) COVERAGE=true; shift ;;
    --watch)    WATCH=true; shift ;;
    *) echo "Usage: $0 [--service <name>] [--coverage] [--watch]"; exit 1 ;;
  esac
done

JEST_FLAGS=""
[[ "$COVERAGE" == true ]] && JEST_FLAGS="$JEST_FLAGS --coverage"
[[ "$WATCH" == true ]]    && JEST_FLAGS="$JEST_FLAGS --watch"

run_tests() {
  local name="$1" dir="$2"
  [[ -d "$dir" && -f "$dir/package.json" ]] || return 0

  # Check if test script or jest config exists
  if ! grep -q '"test"' "$dir/package.json" 2>/dev/null; then
    warn "$name — no test script, skipping"
    SKIPPED=$((SKIPPED + 1))
    return 0
  fi

  log "Testing $name..."
  if (cd "$dir" && pnpm test $JEST_FLAGS 2>&1); then
    ok "$name"
    PASSED=$((PASSED + 1))
  else
    fail "$name"
    ERRORS=$((ERRORS + 1))
  fi
}

SERVICES=(auth users artists catalog payments reviews notifications booking search chat)

for svc in "${SERVICES[@]}"; do
  [[ -n "$TARGET_SERVICE" && "$TARGET_SERVICE" != "$svc" ]] && continue
  run_tests "${svc}-service" "$ROOT_DIR/services/${svc}-service"
done

[[ -z "$TARGET_SERVICE" || "$TARGET_SERVICE" == "gateway" ]] && \
  run_tests "gateway" "$ROOT_DIR/apps/gateway"

# ─────────────────────── Summary ─────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}Passed${NC}:  $PASSED"
echo -e "  ${RED}Failed${NC}:  $ERRORS"
echo -e "  ${YELLOW}Skipped${NC}: $SKIPPED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $ERRORS -gt 0 ]]; then
  fail "$ERRORS service(s) with test failures"
  exit 1
fi

ok "All tests passed ✨"
