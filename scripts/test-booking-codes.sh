#!/bin/bash

# Script para probar el sistema de códigos de booking y quote snapshots

BASE_URL="http://localhost:4005/api/bookings"

echo "🧪 Pruebas del Sistema de Booking Codes + Quote Snapshot"
echo "=========================================================="
echo ""

# Test 1: Crear booking con código automático
echo "📋 Test 1: Crear booking (genera código PIU-2026-XXXXXX)"
echo "POST /api/bookings"

# Datos de ejemplo
CLIENT_ID="user-test-001"
ARTIST_ID="artist-test-001"
SERVICE_ID="service-hourly-001" # DJ para eventos
SCHEDULED_DATE=$(date -u -v+3d +"%Y-%m-%dT14:00:00.000Z") # 3 días en el futuro

curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{
    \"clientId\": \"$CLIENT_ID\",
    \"artistId\": \"$ARTIST_ID\",
    \"serviceId\": \"$SERVICE_ID\",
    \"scheduledDate\": \"$SCHEDULED_DATE\",
    \"durationMinutes\": 240,
    \"location\": \"Av. Reforma 123, CDMX\",
    \"locationLat\": 19.4326,
    \"locationLng\": -99.1332,
    \"selectedAddons\": [\"addon-dj-001\", \"addon-dj-002\"],
    \"clientNotes\": \"Fiesta de cumpleaños, música variada\"
  }" | jq '{
    id: .booking.id,
    code: .booking.code,
    status: .booking.status,
    totalPrice: .booking.totalPrice,
    hasQuoteSnapshot: (.booking.quoteSnapshot != null),
    paymentIntent: .paymentIntent
  }'

echo ""
echo ""

# Test 2: Buscar booking por código
echo "📋 Test 2: Buscar booking por código"
echo "GET /api/bookings/by-code/:code"
echo ""
echo "Primero obtén un código del test anterior (ej: PIU-2026-000001)"
echo "Luego ejecuta:"
echo ""
echo "  curl http://localhost:4005/api/bookings/by-code/PIU-2026-000001 | jq '.'"
echo ""
echo ""

# Test 3: Verificar quote snapshot
echo "📋 Test 3: Verificar estructura del quote snapshot"
echo ""
echo "El quoteSnapshot debe contener:"
echo "  - serviceId"
echo "  - currency"
echo "  - items[] (BASE, ADDON, TRAVEL)"
echo "  - breakdown (baseCents, addonsCents, travelCents)"
echo "  - totalCents"
echo "  - depositRequiredCents"
echo ""
echo "Ejemplo de consulta:"
echo ""
echo "  curl http://localhost:4005/api/bookings/:bookingId | jq '.quoteSnapshot'"
echo ""
echo ""

# Test 4: Listar bookings con códigos
echo "📋 Test 4: Listar bookings (incluye códigos)"
echo "GET /api/bookings/client/:clientId"
echo ""
curl -s "$BASE_URL/client/$CLIENT_ID" | jq '.bookings[] | {
  id: .id,
  code: .code,
  status: .status,
  scheduledDate: .scheduledDate,
  totalPrice: .totalPrice
}' | head -20
echo ""
echo ""

echo "✅ Pruebas completadas"
echo ""
echo "📝 Notas:"
echo "  - Los códigos se generan automáticamente al crear bookings"
echo "  - Formato: PIU-YYYY-NNNNNN (ej: PIU-2026-000123)"
echo "  - El quoteSnapshot es inmutable y guarda el precio al momento de la reserva"
echo "  - Los BookingItems se crean automáticamente desde el quote"
