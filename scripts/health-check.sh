#!/usr/bin/env bash
# =============================================================================
# health-check.sh — Verify all services are responding
# Usage: ./scripts/health-check.sh [--env staging|production]
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}[health]${NC} ✓ $*"; }
fail() { echo -e "${RED}[health]${NC} ✗ $*"; }
info() { echo -e "${BLUE}[health]${NC} $*"; }

ENV="development"
ERRORS=0
PASSED=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV="$2"; shift 2 ;;
    *) echo "Usage: $0 [--env development|staging|production]"; exit 1 ;;
  esac
done

case "$ENV" in
  development)  BASE_URL="http://localhost" ;;
  staging)      BASE_URL="${STAGING_URL:-https://staging.piums.app}" ;;
  production)   BASE_URL="${PROD_URL:-https://api.piums.app}" ;;
  *)            echo "Unknown env: $ENV"; exit 1 ;;
esac

wait_for() {
  local url="$1" name="$2" timeout="${3:-10}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" 2>/dev/null || echo "000")
  if [[ "$status" =~ ^[2][0-9]{2}$ ]]; then
    ok "$name → $url ($status)"
    PASSED=$((PASSED + 1))
  else
    fail "$name → $url (HTTP $status)"
    ERRORS=$((ERRORS + 1))
  fi
}

info "Checking services ($ENV) → $BASE_URL"
echo ""

# ─────────────────────── API Gateway ─────────────────────────────────────────
wait_for "$BASE_URL:3000/health" "API Gateway"

# ─────────────────────── Microservices (via Gateway) ─────────────────────────
wait_for "$BASE_URL:3000/api/auth/health"          "auth-service"
wait_for "$BASE_URL:3000/api/users/health"         "users-service"
wait_for "$BASE_URL:3000/api/artists/health"       "artists-service"
wait_for "$BASE_URL:3000/api/catalog/health"       "catalog-service"
wait_for "$BASE_URL:3000/api/payments/health"      "payments-service"
wait_for "$BASE_URL:3000/api/reviews/health"       "reviews-service"
wait_for "$BASE_URL:3000/api/notifications/health" "notifications-service"
wait_for "$BASE_URL:3000/api/booking/health"       "booking-service"
wait_for "$BASE_URL:3000/api/search/health"        "search-service"
wait_for "$BASE_URL:3000/api/chat/health"          "chat-service"

# ─────────────────────── Frontends (dev only) ────────────────────────────────
if [[ "$ENV" == "development" ]]; then
  wait_for "http://localhost:3001" "web-client"
  wait_for "http://localhost:3002" "web-artist"
  wait_for "http://localhost:3003" "web-admin"
fi

# ─────────────────────── Summary ─────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Health Check Summary ($ENV)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${GREEN}Healthy${NC}: $PASSED"
echo -e "  ${RED}Unhealthy${NC}: $ERRORS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $ERRORS -gt 0 ]]; then
  echo -e "${RED}[health]${NC} $ERRORS service(s) are not healthy"
  exit 1
fi

ok "All services are healthy ✨"
