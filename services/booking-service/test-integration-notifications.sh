#!/bin/bash

# =============================================================================
# Script de Prueba: Integración Booking → Notifications
# =============================================================================

set -e

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Prueba de Integración: Booking → Notifications${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# URLs
AUTH_URL="http://localhost:4001"
BOOKING_URL="http://localhost:4005"
NOTIFICATIONS_URL="http://localhost:4006"

echo -e "${YELLOW}[1] Creando usuario de prueba...${NC}"
echo ""

# Generar emails únicos basados en timestamp
TIMESTAMP=$(date +%s)
CLIENT_EMAIL="client-int-${TIMESTAMP}@test.com"
ARTIST_EMAIL="artist-int-${TIMESTAMP}@test.com"

# Registrar cliente
CLIENT_REGISTER=$(curl -s -X POST "$AUTH_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$CLIENT_EMAIL\",
    \"password\": \"Test1234!\",
    \"name\": \"Cliente Integración\"
  }")

CLIENT_TOKEN=$(echo "$CLIENT_REGISTER" | jq -r '.token // empty')
CLIENT_ID=$(echo "$CLIENT_REGISTER" | jq -r '.user.id // empty')

echo "✓ Cliente Email: $CLIENT_EMAIL"
echo "✓ Cliente ID: $CLIENT_ID"
echo ""

# Registrar artista
ARTIST_REGISTER=$(curl -s -X POST "$AUTH_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ARTIST_EMAIL\",
    \"password\": \"Test1234!\",
    \"name\": \"Artista Integración\"
  }")

ARTIST_TOKEN=$(echo "$ARTIST_REGISTER" | jq -r '.token // empty')
ARTIST_ID=$(echo "$ARTIST_REGISTER" | jq -r '.user.id // empty')

echo "✓ Artista ID: $ARTIST_ID"
echo ""

# =============================================================================
echo -e "${YELLOW}[2] Creando reserva (debe disparar notificaciones)...${NC}"
echo ""

SCHEDULED_DATE=$(date -u -v+2d +"%Y-%m-%dT14:00:00Z")

CREATE_BOOKING=$(curl -s -X POST "$BOOKING_URL/api/bookings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d "{
    \"artistId\": \"$ARTIST_ID\",
    \"serviceId\": \"service-test-123\",
    \"scheduledDate\": \"$SCHEDULED_DATE\",
    \"durationMinutes\": 120,
    \"location\": \"Calle Test 123\",
    \"clientNotes\": \"Prueba de integración\"
  }")

echo "$CREATE_BOOKING" | jq '.'

BOOKING_ID=$(echo "$CREATE_BOOKING" | jq -r '.id')
echo ""
echo "✓ Booking creado: $BOOKING_ID"
echo ""

# Esperar un poco para que se procesen las notificaciones
sleep 2

# =============================================================================
echo -e "${YELLOW}[3] Verificando notificaciones del cliente...${NC}"
echo ""

CLIENT_NOTIFS=$(curl -s "$NOTIFICATIONS_URL/api/notifications?userId=$CLIENT_ID&limit=5" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

echo "$CLIENT_NOTIFS" | jq '.data[] | {type, title, message, status, createdAt}'
echo ""

# =============================================================================
echo -e "${YELLOW}[4] Verificando notificaciones del artista...${NC}"
echo ""

ARTIST_NOTIFS=$(curl -s "$NOTIFICATIONS_URL/api/notifications?userId=$ARTIST_ID&limit=5" \
  -H "Authorization: Bearer $ARTIST_TOKEN")

echo "$ARTIST_NOTIFS" | jq '.data[] | {type, title, message, status, createdAt}'
echo ""

# =============================================================================
echo -e "${YELLOW}[5] Confirmando reserva (debe disparar notificación)...${NC}"
echo ""

CONFIRM=$(curl -s -X POST "$BOOKING_URL/api/bookings/$BOOKING_ID/confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ARTIST_TOKEN" \
  -d '{"artistNotes": "Confirmada!"}')

echo "$CONFIRM" | jq '{id, status, confirmedAt}'
echo ""

sleep 2

# =============================================================================
echo -e "${YELLOW}[6] Verificando nueva notificación de confirmación...${NC}"
echo ""

CLIENT_NOTIFS_AFTER=$(curl -s "$NOTIFICATIONS_URL/api/notifications?userId=$CLIENT_ID&type=BOOKING_CONFIRMED" \
  -H "Authorization: Bearer $CLIENT_TOKEN")

echo "$CLIENT_NOTIFS_AFTER" | jq '.data[] | {type, title, message, createdAt}'
echo ""

# =============================================================================
echo -e "${YELLOW}[7] Cancelando reserva (debe disparar notificación)...${NC}"
echo ""

CANCEL=$(curl -s -X POST "$BOOKING_URL/api/bookings/$BOOKING_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -d '{"reason": "Prueba de cancelación"}')

echo "$CANCEL" | jq '{id, status, cancelledAt, cancellationReason}'
echo ""

sleep 2

# =============================================================================
echo -e "${YELLOW}[8] Verificando notificaciones de cancelación...${NC}"
echo ""

ARTIST_CANCEL_NOTIF=$(curl -s "$NOTIFICATIONS_URL/api/notifications?userId=$ARTIST_ID&type=BOOKING_CANCELLED" \
  -H "Authorization: Bearer $ARTIST_TOKEN")

echo "$ARTIST_CANCEL_NOTIF" | jq '.data[] | {type, title, message, createdAt}'
echo ""

# =============================================================================
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Prueba de integración completada${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
