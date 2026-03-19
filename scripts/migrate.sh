#!/usr/bin/env bash
# =============================================================================
# migrate.sh — Run Prisma migrations across all services
# Usage: ./scripts/migrate.sh [staging|production] [--service <name>] [--reset]
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[migrate]${NC} $*"; }
ok()   { echo -e "${GREEN}[migrate]${NC} ✓ $*"; }
warn() { echo -e "${YELLOW}[migrate]${NC} ⚠ $*"; }
fail() { echo -e "${RED}[migrate]${NC} ✗ $*"; }

ENV="${1:-development}"
TARGET_SERVICE=""
RESET=false

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --service) TARGET_SERVICE="$2"; shift 2 ;;
    --reset)   RESET=true; shift ;;
    *) echo "Usage: $0 [development|staging|production] [--service <name>] [--reset]"; exit 1 ;;
  esac
done

# Load .env for the given environment
if [[ "$ENV" == "development" && -f "$ROOT_DIR/.env" ]]; then
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
fi

# Services that have Prisma schemas
SERVICES_WITH_PRISMA=(auth users artists catalog payments reviews notifications booking search chat)

run_migration() {
  local svc="$1"
  local dir="$ROOT_DIR/services/${svc}-service"

  [[ -d "$dir/prisma" ]] || { warn "${svc}-service has no prisma/ directory, skipping"; return 0; }
  [[ -n "$TARGET_SERVICE" && "$TARGET_SERVICE" != "$svc" ]] && return 0

  log "Migrating ${svc}-service (env: $ENV)..."

  if [[ "$RESET" == true ]]; then
    warn "RESET mode — this will wipe data in ${svc}-service!"
    read -r -p "Continue? [y/N] " confirm
    [[ "$confirm" == "y" || "$confirm" == "Y" ]] || { warn "Skipped ${svc}-service reset"; return 0; }
    (cd "$dir" && npx prisma migrate reset --force 2>&1)
  elif [[ "$ENV" == "production" || "$ENV" == "staging" ]]; then
    (cd "$dir" && npx prisma migrate deploy 2>&1)
  else
    (cd "$dir" && npx prisma migrate dev --skip-generate 2>&1)
  fi

  if [[ $? -eq 0 ]]; then
    ok "${svc}-service migrated"
  else
    fail "${svc}-service migration failed"
    exit 1
  fi
}

# Confirm for production
if [[ "$ENV" == "production" ]]; then
  warn "You are about to run migrations in PRODUCTION"
  warn "Make sure a backup has been taken before proceeding"
  read -r -p "Type 'production' to confirm: " confirm
  [[ "$confirm" == "production" ]] || { fail "Aborted"; exit 1; }
fi

log "Running migrations for environment: $ENV"

for svc in "${SERVICES_WITH_PRISMA[@]}"; do
  run_migration "$svc"
done

# Regenerate Prisma clients after all migrations
log "Generating Prisma clients..."
for svc in "${SERVICES_WITH_PRISMA[@]}"; do
  dir="$ROOT_DIR/services/${svc}-service"
  [[ -d "$dir/prisma" ]] || continue
  [[ -n "$TARGET_SERVICE" && "$TARGET_SERVICE" != "$svc" ]] && continue
  (cd "$dir" && npx prisma generate 2>&1) && ok "${svc}-service client generated"
done

ok "All migrations completed ✨"
