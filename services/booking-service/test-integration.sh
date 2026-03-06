#!/bin/bash

# =============================================================================
# Booking Service - Integration Tests
# =============================================================================
# Este script prueba todos los endpoints del servicio de reservas
# Requiere: jq (para formatear JSON)
# =============================================================================

set -e  # Salir si algún comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BASE_URL="http://localhost:4005"
AUTH_URL="http://localhost:4001"

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0

# =============================================================================
# Funciones de utilidad
# =============================================================================

print_header() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}► $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓ PASS${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}✗ FAIL${NC} $1"
    ((TESTS_FAILED++))
}

assert_status() {
    local expected=$1
    local actual=$2
    local test_name=$3
    
    if [ "$actual" -eq "$expected" ]; then
        print_success "$test_name (status: $actual)"
    else
        print_error "$test_name (expected: $expected, got: $actual)"
    fi
}

assert_field() {
    local field=$1
    local value=$2
    local test_name=$3
    
    if [ -n "$value" ] && [ "$value" != "null" ]; then
        print_success "$test_name (value: $value)"
    else
        print_error "$test_name (field '$field' missing or null)"
    fi
}

# =============================================================================
# Tests
# =============================================================================

print_header "1. Health Check"

print_test "GET /health"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | head -n -1)
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | tail -n 1)

echo "$HEALTH_BODY" | jq '.' || echo "$HEALTH_BODY"
assert_status 200 $HEALTH_STATUS "Health check debe retornar 200"

SERVICE_NAME=$(echo "$HEALTH_BODY" | jq -r '.service')
assert_field "service" "$SERVICE_NAME" "Debe retornar nombre del servicio"

# =============================================================================
print_header "2. Autenticación (Obtener tokens)"

print_test "POST $AUTH_URL/api/auth/register - Registrar cliente"
CLIENT_REGISTER=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "client-booking-test@test.com",
        "password": "Test1234!",
        "name": "Cliente Test Booking"
    }')
CLIENT_REGISTER_BODY=$(echo "$CLIENT_REGISTER" | head -n -1)
CLIENT_REGISTER_STATUS=$(echo "$CLIENT_REGISTER" | tail -n 1)

CLIENT_TOKEN=$(echo "$CLIENT_REGISTER_BODY" | jq -r '.token // empty')
CLIENT_ID=$(echo "$CLIENT_REGISTER_BODY" | jq -r '.user.id // empty')

if [ -z "$CLIENT_TOKEN" ]; then
    # Si falla registro, intentar login
    print_test "POST $AUTH_URL/api/auth/login - Login cliente"
    CLIENT_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "client-booking-test@test.com",
            "password": "Test1234!"
        }')
    CLIENT_LOGIN_BODY=$(echo "$CLIENT_LOGIN" | head -n -1)
    CLIENT_TOKEN=$(echo "$CLIENT_LOGIN_BODY" | jq -r '.token')
    CLIENT_ID=$(echo "$CLIENT_LOGIN_BODY" | jq -r '.user.id')
fi

echo "Cliente token: ${CLIENT_TOKEN:0:30}..."
echo "Cliente ID: $CLIENT_ID"

print_test "POST $AUTH_URL/api/auth/register - Registrar artista"
ARTIST_REGISTER=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "email": "artist-booking-test@test.com",
        "password": "Test1234!",
        "name": "Artista Test Booking"
    }')
ARTIST_REGISTER_BODY=$(echo "$ARTIST_REGISTER" | head -n -1)

ARTIST_TOKEN=$(echo "$ARTIST_REGISTER_BODY" | jq -r '.token // empty')
ARTIST_ID=$(echo "$ARTIST_REGISTER_BODY" | jq -r '.user.id // empty')

if [ -z "$ARTIST_TOKEN" ]; then
    print_test "POST $AUTH_URL/api/auth/login - Login artista"
    ARTIST_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "artist-booking-test@test.com",
            "password": "Test1234!"
        }')
    ARTIST_LOGIN_BODY=$(echo "$ARTIST_LOGIN" | head -n -1)
    ARTIST_TOKEN=$(echo "$ARTIST_LOGIN_BODY" | jq -r '.token')
    ARTIST_ID=$(echo "$ARTIST_LOGIN_BODY" | jq -r '.user.id')
fi

echo "Artista token: ${ARTIST_TOKEN:0:30}..."
echo "Artista ID: $ARTIST_ID"

# =============================================================================
print_header "3. Configuración de Disponibilidad"

print_test "PUT /api/artists/$ARTIST_ID/config - Configurar disponibilidad"
CONFIG_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/artists/$ARTIST_ID/config" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ARTIST_TOKEN" \
    -d '{
        "minAdvanceHours": 24,
        "maxAdvanceDays": 90,
        "bufferMinutes": 30,
        "autoConfirm": false,
        "requiresDeposit": true,
        "cancellationHours": 48,
        "cancellationFee": 50
    }')
CONFIG_BODY=$(echo "$CONFIG_RESPONSE" | head -n -1)
CONFIG_STATUS=$(echo "$CONFIG_RESPONSE" | tail -n 1)

echo "$CONFIG_BODY" | jq '.'
assert_status 200 $CONFIG_STATUS "Configurar disponibilidad"

print_test "GET /api/artists/$ARTIST_ID/config - Obtener configuración"
GET_CONFIG_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/artists/$ARTIST_ID/config")
GET_CONFIG_BODY=$(echo "$GET_CONFIG_RESPONSE" | head -n -1)
GET_CONFIG_STATUS=$(echo "$GET_CONFIG_RESPONSE" | tail -n 1)

echo "$GET_CONFIG_BODY" | jq '.'
assert_status 200 $GET_CONFIG_STATUS "Obtener configuración"

# =============================================================================
print_header "4. Verificación de Disponibilidad"

# Fecha: mañana a las 2pm
TOMORROW=$(date -u -v+1d +"%Y-%m-%dT14:00:00Z" 2>/dev/null || date -u -d "tomorrow" +"%Y-%m-%dT14:00:00Z")
TOMORROW_END=$(date -u -v+1d +"%Y-%m-%dT16:00:00Z" 2>/dev/null || date -u -d "tomorrow" +"%Y-%m-%dT16:00:00Z")

print_test "GET /api/availability/check - Verificar disponibilidad"
CHECK_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/availability/check?artistId=$ARTIST_ID&startTime=$TOMORROW&endTime=$TOMORROW_END")
CHECK_BODY=$(echo "$CHECK_RESPONSE" | head -n -1)
CHECK_STATUS=$(echo "$CHECK_RESPONSE" | tail -n 1)

echo "$CHECK_BODY" | jq '.'
assert_status 200 $CHECK_STATUS "Verificar disponibilidad"

IS_AVAILABLE=$(echo "$CHECK_BODY" | jq -r '.available')
assert_field "available" "$IS_AVAILABLE" "Debe indicar si está disponible"

# =============================================================================
print_header "5. Crear Reserva"

print_test "POST /api/bookings - Crear reserva"
CREATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/bookings" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $CLIENT_TOKEN" \
    -d "{
        \"clientId\": \"$CLIENT_ID\",
        \"artistId\": \"$ARTIST_ID\",
        \"serviceId\": \"service-test-uuid\",
        \"scheduledDate\": \"$TOMORROW\",
        \"durationMinutes\": 120,
        \"location\": \"Calle Principal 123, CDMX\",
        \"locationLat\": 19.4326,
        \"locationLng\": -99.1332,
        \"selectedAddons\": [],
        \"clientNotes\": \"Sesión de fotos para evento\"
    }")
CREATE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)
CREATE_STATUS=$(echo "$CREATE_RESPONSE" | tail -n 1)

echo "$CREATE_BODY" | jq '.'
assert_status 201 $CREATE_STATUS "Crear reserva"

BOOKING_ID=$(echo "$CREATE_BODY" | jq -r '.id')
BOOKING_STATUS=$(echo "$CREATE_BODY" | jq -r '.status')

echo "Booking ID: $BOOKING_ID"
echo "Booking Status: $BOOKING_STATUS"

assert_field "id" "$BOOKING_ID" "Debe retornar ID de reserva"
assert_field "status" "$BOOKING_STATUS" "Debe tener estado inicial"

# =============================================================================
print_header "6. Obtener Reserva por ID"

print_test "GET /api/bookings/$BOOKING_ID"
GET_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/bookings/$BOOKING_ID" \
    -H "Authorization: Bearer $CLIENT_TOKEN")
GET_BODY=$(echo "$GET_RESPONSE" | head -n -1)
GET_STATUS=$(echo "$GET_RESPONSE" | tail -n 1)

echo "$GET_BODY" | jq '.'
assert_status 200 $GET_STATUS "Obtener reserva por ID"

# =============================================================================
print_header "7. Buscar Reservas"

print_test "GET /api/bookings?clientId=$CLIENT_ID"
SEARCH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/bookings?clientId=$CLIENT_ID" \
    -H "Authorization: Bearer $CLIENT_TOKEN")
SEARCH_BODY=$(echo "$SEARCH_RESPONSE" | head -n -1)
SEARCH_STATUS=$(echo "$SEARCH_RESPONSE" | tail -n 1)

echo "$SEARCH_BODY" | jq '.'
assert_status 200 $SEARCH_STATUS "Buscar reservas por cliente"

# =============================================================================
print_header "8. Confirmar Reserva (Artista)"

print_test "POST /api/bookings/$BOOKING_ID/confirm"
CONFIRM_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/bookings/$BOOKING_ID/confirm" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ARTIST_TOKEN" \
    -d '{
        "artistNotes": "Confirmada! Nos vemos mañana"
    }')
CONFIRM_BODY=$(echo "$CONFIRM_RESPONSE" | head -n -1)
CONFIRM_STATUS=$(echo "$CONFIRM_RESPONSE" | tail -n 1)

echo "$CONFIRM_BODY" | jq '.'
assert_status 200 $CONFIRM_STATUS "Confirmar reserva"

# =============================================================================
print_header "9. Marcar Pago"

print_test "POST /api/bookings/$BOOKING_ID/payment"
PAYMENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/bookings/$BOOKING_ID/payment" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $CLIENT_TOKEN" \
    -d '{
        "amount": 45000,
        "paymentMethod": "stripe"
    }')
PAYMENT_BODY=$(echo "$PAYMENT_RESPONSE" | head -n -1)
PAYMENT_STATUS=$(echo "$PAYMENT_RESPONSE" | tail -n 1)

echo "$PAYMENT_BODY" | jq '.'
assert_status 200 $PAYMENT_STATUS "Marcar pago"

# =============================================================================
print_header "10. Actualizar Reserva"

print_test "PUT /api/bookings/$BOOKING_ID"
UPDATE_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/bookings/$BOOKING_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $CLIENT_TOKEN" \
    -d '{
        "clientNotes": "Actualización: Quisiera incluir fotos en exteriores"
    }')
UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | head -n -1)
UPDATE_STATUS=$(echo "$UPDATE_RESPONSE" | tail -n 1)

echo "$UPDATE_BODY" | jq '.'
assert_status 200 $UPDATE_STATUS "Actualizar reserva"

# =============================================================================
print_header "11. Bloquear Slot (Artista)"

NEXT_WEEK=$(date -u -v+7d +"%Y-%m-%dT00:00:00Z" 2>/dev/null || date -u -d "+7 days" +"%Y-%m-%dT00:00:00Z")
NEXT_WEEK_END=$(date -u -v+9d +"%Y-%m-%dT23:59:59Z" 2>/dev/null || date -u -d "+9 days" +"%Y-%m-%dT23:59:59Z")

print_test "POST /api/blocked-slots"
BLOCK_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/blocked-slots" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ARTIST_TOKEN" \
    -d "{
        \"artistId\": \"$ARTIST_ID\",
        \"startTime\": \"$NEXT_WEEK\",
        \"endTime\": \"$NEXT_WEEK_END\",
        \"reason\": \"Vacaciones de prueba\"
    }")
BLOCK_BODY=$(echo "$BLOCK_RESPONSE" | head -n -1)
BLOCK_STATUS=$(echo "$BLOCK_RESPONSE" | tail -n 1)

echo "$BLOCK_BODY" | jq '.'
assert_status 201 $BLOCK_STATUS "Bloquear slot"

BLOCKED_SLOT_ID=$(echo "$BLOCK_BODY" | jq -r '.id')

# =============================================================================
print_header "12. Obtener Slots Bloqueados"

print_test "GET /api/artists/$ARTIST_ID/blocked-slots"
GET_BLOCKED_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/artists/$ARTIST_ID/blocked-slots")
GET_BLOCKED_BODY=$(echo "$GET_BLOCKED_RESPONSE" | head -n -1)
GET_BLOCKED_STATUS=$(echo "$GET_BLOCKED_RESPONSE" | tail -n 1)

echo "$GET_BLOCKED_BODY" | jq '.'
assert_status 200 $GET_BLOCKED_STATUS "Obtener slots bloqueados"

# =============================================================================
print_header "13. Obtener Slots Disponibles"

RANGE_START=$(date -u -v+2d +"%Y-%m-%dT00:00:00Z" 2>/dev/null || date -u -d "+2 days" +"%Y-%m-%dT00:00:00Z")
RANGE_END=$(date -u -v+4d +"%Y-%m-%dT23:59:59Z" 2>/dev/null || date -u -d "+4 days" +"%Y-%m-%dT23:59:59Z")

print_test "GET /api/availability/slots"
SLOTS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/availability/slots?artistId=$ARTIST_ID&startDate=$RANGE_START&endDate=$RANGE_END&durationMinutes=120")
SLOTS_BODY=$(echo "$SLOTS_RESPONSE" | head -n -1)
SLOTS_STATUS=$(echo "$SLOTS_RESPONSE" | tail -n 1)

echo "$SLOTS_BODY" | jq '.'
assert_status 200 $SLOTS_STATUS "Obtener slots disponibles"

# =============================================================================
print_header "14. Estadísticas"

print_test "GET /api/stats?artistId=$ARTIST_ID"
STATS_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/stats?artistId=$ARTIST_ID" \
    -H "Authorization: Bearer $ARTIST_TOKEN")
STATS_BODY=$(echo "$STATS_RESPONSE" | head -n -1)
STATS_STATUS=$(echo "$STATS_RESPONSE" | tail -n 1)

echo "$STATS_BODY" | jq '.'
assert_status 200 $STATS_STATUS "Obtener estadísticas"

# =============================================================================
print_header "15. Cancelar Reserva"

print_test "POST /api/bookings/$BOOKING_ID/cancel"
CANCEL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/bookings/$BOOKING_ID/cancel" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $CLIENT_TOKEN" \
    -d '{
        "reason": "Surgió un imprevisto y no podré asistir"
    }')
CANCEL_BODY=$(echo "$CANCEL_RESPONSE" | head -n -1)
CANCEL_STATUS=$(echo "$CANCEL_RESPONSE" | tail -n 1)

echo "$CANCEL_BODY" | jq '.'
assert_status 200 $CANCEL_STATUS "Cancelar reserva"

REFUND_AMOUNT=$(echo "$CANCEL_BODY" | jq -r '.refundAmount')
echo "Monto de reembolso: $REFUND_AMOUNT centavos"

# =============================================================================
print_header "16. Desbloquear Slot"

print_test "DELETE /api/blocked-slots/$BLOCKED_SLOT_ID"
UNBLOCK_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/blocked-slots/$BLOCKED_SLOT_ID" \
    -H "Authorization: Bearer $ARTIST_TOKEN")
UNBLOCK_STATUS=$(echo "$UNBLOCK_RESPONSE" | tail -n 1)

assert_status 204 $UNBLOCK_STATUS "Desbloquear slot"

# =============================================================================
print_header "17. Test de Rechazar Reserva"

# Crear otra reserva
FUTURE_DATE=$(date -u -v+5d +"%Y-%m-%dT10:00:00Z" 2>/dev/null || date -u -d "+5 days" +"%Y-%m-%dT10:00:00Z")
CREATE2_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/bookings" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $CLIENT_TOKEN" \
    -d "{
        \"clientId\": \"$CLIENT_ID\",
        \"artistId\": \"$ARTIST_ID\",
        \"serviceId\": \"service-test-uuid\",
        \"scheduledDate\": \"$FUTURE_DATE\",
        \"durationMinutes\": 90,
        \"clientNotes\": \"Reserva para rechazar\"
    }")
CREATE2_BODY=$(echo "$CREATE2_RESPONSE" | head -n -1)
BOOKING_ID_2=$(echo "$CREATE2_BODY" | jq -r '.id')

echo "Segunda reserva ID: $BOOKING_ID_2"

print_test "POST /api/bookings/$BOOKING_ID_2/reject"
REJECT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/bookings/$BOOKING_ID_2/reject" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ARTIST_TOKEN" \
    -d '{
        "reason": "No tengo disponibilidad ese día"
    }')
REJECT_BODY=$(echo "$REJECT_RESPONSE" | head -n -1)
REJECT_STATUS=$(echo "$REJECT_RESPONSE" | tail -n 1)

echo "$REJECT_BODY" | jq '.'
assert_status 200 $REJECT_STATUS "Rechazar reserva"

# =============================================================================
# Resumen
# =============================================================================

print_header "Resumen de Tests"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
echo "Total: $TOTAL_TESTS tests"
echo -e "${GREEN}Pasados: $TESTS_PASSED${NC}"
echo -e "${RED}Fallidos: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ Todos los tests pasaron exitosamente!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ Algunos tests fallaron${NC}\n"
    exit 1
fi
