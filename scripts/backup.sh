#!/usr/bin/env bash
# =============================================================================
# backup.sh — Backup PostgreSQL databases
# Usage: ./scripts/backup.sh [staging|production] [--upload]
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/.backups"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLUE}[backup]${NC} $*"; }
ok()   { echo -e "${GREEN}[backup]${NC} ✓ $*"; }
warn() { echo -e "${YELLOW}[backup]${NC} ⚠ $*"; }
fail() { echo -e "${RED}[backup]${NC} ✗ $*"; }

ENV="${1:-development}"
UPLOAD=false

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --upload) UPLOAD=true; shift ;;
    *) echo "Usage: $0 [development|staging|production] [--upload]"; exit 1 ;;
  esac
done

# ─────────────────────── Config ──────────────────────────────────────────────
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

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/piums_${ENV}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

log "Starting backup of $DB_NAME ($ENV) → $BACKUP_FILE"

# ─────────────────────── Dump ────────────────────────────────────────────────
PGPASSWORD="$DB_PASS" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
ok "Backup created: $BACKUP_FILE ($BACKUP_SIZE)"

# ─────────────────────── Upload to S3 ────────────────────────────────────────
if [[ "$UPLOAD" == true ]]; then
  S3_BUCKET="${BACKUP_S3_BUCKET:-piums-backups-${ENV}}"
  log "Uploading to s3://$S3_BUCKET/..."

  if aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/$(basename "$BACKUP_FILE")" \
      --server-side-encryption AES256; then
    ok "Uploaded to S3"
    # Remove local after successful upload
    rm "$BACKUP_FILE"
    log "Local file removed (stored in S3)"
  else
    warn "S3 upload failed — local backup retained at $BACKUP_FILE"
  fi
fi

# ─────────────────────── Cleanup old local backups (keep last 5) ─────────────
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/piums_${ENV}_*.sql.gz 2>/dev/null | wc -l)
if [[ $BACKUP_COUNT -gt 5 ]]; then
  log "Cleaning old backups (keeping last 5)..."
  ls -1t "$BACKUP_DIR"/piums_${ENV}_*.sql.gz | tail -n +6 | xargs rm -f
  ok "Old backups cleaned"
fi

ok "Backup complete ✨"
