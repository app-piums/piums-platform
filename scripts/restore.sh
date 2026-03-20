#!/usr/bin/env bash
# =============================================================================
# restore.sh — Restore PostgreSQL database from backup
# Usage: ./scripts/restore.sh [staging|production] <backup_file>
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[restore]${NC} $*"; }
ok()   { echo -e "${GREEN}[restore]${NC} ✓ $*"; }
warn() { echo -e "${YELLOW}[restore]${NC} ⚠ $*"; }
fail() { echo -e "${RED}[restore]${NC} ✗ $*"; }

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <development|staging|production> <backup_file.sql.gz>"
  exit 1
fi

ENV="$1"
BACKUP_FILE="$2"

# ─────────────────────── Validations ─────────────────────────────────────────
[[ -f "$BACKUP_FILE" ]] || { fail "Backup file not found: $BACKUP_FILE"; exit 1; }

case "$ENV" in
  development)
    DB_HOST="${POSTGRES_HOST:-localhost}"
    DB_PORT="${POSTGRES_PORT:-5432}"
    DB_USER="${POSTGRES_USER:-piums}"
    DB_PASS="${POSTGRES_PASSWORD:-piums_dev_password}"
    DB_NAME="${POSTGRES_DB:-piums_dev}"
    ;;
  staging)
    DB_HOST="${STAGING_DB_HOST:?STAGING_DB_HOST not set}"
    DB_PORT="${STAGING_DB_PORT:-5432}"
    DB_USER="${STAGING_DB_USER:?STAGING_DB_USER not set}"
    DB_PASS="${STAGING_DB_PASSWORD:?STAGING_DB_PASSWORD not set}"
    DB_NAME="${STAGING_DB_NAME:-piums_staging}"
    ;;
  production)
    DB_HOST="${PROD_DB_HOST:?PROD_DB_HOST not set}"
    DB_PORT="${PROD_DB_PORT:-5432}"
    DB_USER="${PROD_DB_USER:?PROD_DB_USER not set}"
    DB_PASS="${PROD_DB_PASSWORD:?PROD_DB_PASSWORD not set}"
    DB_NAME="${PROD_DB_NAME:-piums_prod}"
    ;;
  *)
    fail "Unknown environment: $ENV"; exit 1 ;;
esac

# ─────────────────────── Confirmation ────────────────────────────────────────
warn "=====================================================)"
warn "  RESTORE will OVERWRITE the $ENV database ($DB_NAME)"
warn "  Backup file: $BACKUP_FILE"
warn "====================================================="
echo ""
if [[ "$ENV" == "production" ]]; then
  warn "THIS IS PRODUCTION. All current data will be replaced."
  read -r -p "Type 'restore production' to confirm: " confirm
  [[ "$confirm" == "restore production" ]] || { fail "Aborted"; exit 1; }
else
  read -r -p "Continue? [y/N] " confirm
  [[ "$confirm" == "y" || "$confirm" == "Y" ]] || { fail "Aborted"; exit 1; }
fi

# ─────────────────────── Restore ─────────────────────────────────────────────
log "Restoring $DB_NAME from $BACKUP_FILE..."

gunzip -c "$BACKUP_FILE" | PGPASSWORD="$DB_PASS" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --set ON_ERROR_STOP=1 \
  2>&1

ok "Database $DB_NAME restored successfully ✨"
log "Remember to restart services to pick up the restored data"
