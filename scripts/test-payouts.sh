#!/bin/bash

# ============================================================================
# Test script para el sistema de Payouts
# ============================================================================

BASE_URL="http://localhost:4007/api"
JWT_TOKEN="your_jwt_token_here"

echo "🧪 Testing Payout System"
echo "========================"
echo ""

# ============================================================================
# 1. Calcular payout (ver cuánto recibirá el artista después de fees)
# ============================================================================

echo "📊 1. Calcular payout con fees..."
CALC_RESPONSE=$(curl -s -X POST "$BASE_URL/payouts/calculate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "originalAmount": 100000,
    "payoutType": "BOOKING_PAYMENT"
  }')

echo "Response: $CALC_RESPONSE"
echo ""

# ============================================================================
# 2. Crear payout pendiente
# ============================================================================

echo "💰 2. Crear payout pendiente..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/payouts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "artistId": "artist-uuid-123",
    "bookingId": "booking-uuid-456",
    "amount": 85000,
    "currency": "MXN",
    "payoutType": "BOOKING_PAYMENT",
    "description": "Pago por reserva completada",
    "metadata": {
      "serviceName": "Maquillaje de Novia",
      "completedAt": "2026-02-20T18:00:00Z"
    }
  }')

echo "Response: $CREATE_RESPONSE"
PAYOUT_ID=$(echo $CREATE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)
echo "Payout ID: $PAYOUT_ID"
echo ""

# ============================================================================
# 3. Obtener payout por ID
# ============================================================================

echo "🔍 3. Obtener payout por ID..."
curl -s -X GET "$BASE_URL/payouts/$PAYOUT_ID" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# ============================================================================
# 4. Listar payouts con filtros
# ============================================================================

echo "📋 4. Listar payouts (status=PENDING)..."
curl -s -X GET "$BASE_URL/payouts?status=PENDING&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# ============================================================================
# 5. Procesar payout (ejecutar transferencia a Stripe Connect)
# ============================================================================

echo "⚙️  5. Procesar payout (transferencia a Stripe)..."
echo "   Nota: Requiere que el artista tenga Stripe Connect configurado"
curl -s -X POST "$BASE_URL/payouts/$PAYOUT_ID/process" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# ============================================================================
# 6. Sincronizar estado con Stripe
# ============================================================================

echo "🔄 6. Sincronizar estado con Stripe..."
curl -s -X POST "$BASE_URL/payouts/$PAYOUT_ID/sync" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# ============================================================================
# 7. Obtener payouts de un artista
# ============================================================================

echo "👤 7. Obtener payouts de un artista..."
curl -s -X GET "$BASE_URL/payouts/artists/artist-uuid-123" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# ============================================================================
# 8. Obtener estadísticas de payouts de un artista
# ============================================================================

echo "📈 8. Estadísticas de payouts del artista..."
curl -s -X GET "$BASE_URL/payouts/artists/artist-uuid-123/stats" \
  -H "Authorization: Bearer $JWT_TOKEN" | jq .
echo ""

# ============================================================================
# 9. Cancelar payout pendiente
# ============================================================================

echo "❌ 9. Cancelar payout..."
curl -s -X POST "$BASE_URL/payouts/$PAYOUT_ID/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "reason": "Reserva cancelada por el cliente"
  }' | jq .
echo ""

# ============================================================================
# 10. Crear payout programado (scheduled for future date)
# ============================================================================

echo "⏰ 10. Crear payout programado..."
curl -s -X POST "$BASE_URL/payouts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{
    "artistId": "artist-uuid-123",
    "amount": 50000,
    "currency": "MXN",
    "payoutType": "BOOKING_PAYMENT",
    "description": "Pago programado para dentro de 7 días",
    "scheduledFor": "2026-03-02T12:00:00Z"
  }' | jq .
echo ""

echo "✅ Tests completados"
