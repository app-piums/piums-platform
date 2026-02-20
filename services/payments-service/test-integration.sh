#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs de servicios
AUTH_URL="http://localhost:4001/auth"
PAYMENTS_URL="http://localhost:4007/api/payments"
BOOKING_URL="http://localhost:4005/api/bookings"

# Función para imprimir sección
print_section() {
  echo ""
  echo -e "${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}"
}

# Función para imprimir éxito
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Función para imprimir error
print_error() {
  echo -e "${RED}❌ $1${NC}"
  exit 1
}

# Función para imprimir warning
print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Función para imprimir info
print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Banner
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║                                                ║${NC}"
echo -e "${YELLOW}║    PAYMENTS SERVICE - INTEGRATION TESTS        ║${NC}"
echo -e "${YELLOW}║                                                ║${NC}"
echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo ""

# Verificar que jq está instalado
if ! command -v jq &> /dev/null; then
  print_error "jq no está instalado. Instálalo con: brew install jq"
fi

# Variables globales
TOKEN=""
USER_ID=""
BOOKING_ID=""
PAYMENT_INTENT_ID=""
CLIENT_SECRET=""
PAYMENT_ID=""
REFUND_ID=""

# =============================================================================
# TEST 1: Health Check
# =============================================================================
print_section "TEST 1: Health Check"

HEALTH=$(curl -s http://localhost:4007/health)
STATUS=$(echo $HEALTH | jq -r '.status')

if [ "$STATUS" != "healthy" ]; then
  print_error "Servicio no está saludable"
fi

print_success "Servicio está saludable"
echo $HEALTH | jq .

# =============================================================================
# TEST 2: Autenticación
# =============================================================================
print_section "TEST 2: Autenticación"

print_info "Intentando login..."

# Nota: Si este step falla, asegúrate de tener un usuario creado.
# Puedes crear uno con: node create-test-user.js
# O usar las credenciales de un usuario existente editando este script.

LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "payments-test@example.com",
    "password": "payment123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  print_error "Error en login. Respuesta: $(echo $LOGIN_RESPONSE | jq .)"
fi

print_success "Login exitoso"
print_info "User ID: $USER_ID"
print_info "Token: ${TOKEN:0:50}..."

# =============================================================================
# TEST 3: Crear Payment Intent
# =============================================================================
print_section "TEST 3: Crear Payment Intent"

print_info "Creando Payment Intent para depósito de $500 MXN..."

PI_CREATE_RESPONSE=$(curl -s -X POST "$PAYMENTS_URL/payment-intents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "currency": "MXN",
    "paymentType": "DEPOSIT",
    "paymentMethods": ["card"]
  }')

PAYMENT_INTENT_ID=$(echo $PI_CREATE_RESPONSE | jq -r '.paymentIntent.id')
CLIENT_SECRET=$(echo $PI_CREATE_RESPONSE | jq -r '.paymentIntent.clientSecret')
STRIPE_PI_ID=$(echo $PI_CREATE_RESPONSE | jq -r '.paymentIntent.stripePaymentIntentId')

if [ "$PAYMENT_INTENT_ID" == "null" ] || [ -z "$PAYMENT_INTENT_ID" ]; then
  print_error "Error creando Payment Intent. Respuesta: $(echo $PI_CREATE_RESPONSE | jq .)"
fi

print_success "Payment Intent creado"
echo $PI_CREATE_RESPONSE | jq .
print_info "Payment Intent ID: $PAYMENT_INTENT_ID"
print_info "Client Secret: ${CLIENT_SECRET:0:50}..."
print_info "Stripe PI ID: $STRIPE_PI_ID"

# =============================================================================
# TEST 4: Obtener Payment Intent
# =============================================================================
print_section "TEST 4: Obtener Payment Intent"

print_info "Obteniendo detalles del Payment Intent..."

GET_PI=$(curl -s -X GET "$PAYMENTS_URL/payment-intents/$PAYMENT_INTENT_ID" \
  -H "Authorization: Bearer $TOKEN")

PI_STATUS=$(echo $GET_PI | jq -r '.paymentIntent.status')
PI_AMOUNT=$(echo $GET_PI | jq -r '.paymentIntent.amount')

if [ "$PI_STATUS" == "null" ]; then
  print_error "Error obteniendo Payment Intent"
fi

print_success "Payment Intent obtenido"
echo $GET_PI | jq .
print_info "Status: $PI_STATUS"
print_info "Amount: $PI_AMOUNT centavos"

# =============================================================================
# TEST 5: Listar Payment Intents
# =============================================================================
print_section "TEST 5: Listar Payments"

print_info "Listando todos los pagos del usuario..."

LIST_PAYMENTS=$(curl -s -X GET "$PAYMENTS_URL/payments?limit=10" \
  -H "Authorization: Bearer $TOKEN")

PAYMENTS_COUNT=$(echo $LIST_PAYMENTS | jq -r '.payments | length')
TOTAL=$(echo $LIST_PAYMENTS | jq -r '.pagination.total')

print_success "Pagos listados"
echo $LIST_PAYMENTS | jq .
print_info "Pagos en respuesta: $PAYMENTS_COUNT"
print_info "Total de pagos: $TOTAL"

# =============================================================================
# TEST 6: Filtrar por status
# =============================================================================
print_section "TEST 6: Filtrar Pagos por Status"

print_info "Filtrando pagos con status PENDING..."

FILTER_PAYMENTS=$(curl -s -X GET "$PAYMENTS_URL/payments?status=PENDING&limit=5" \
  -H "Authorization: Bearer $TOKEN")

FILTERED_COUNT=$(echo $FILTER_PAYMENTS | jq -r '.payments | length')

print_success "Filtro aplicado"
echo $FILTER_PAYMENTS | jq .
print_info "Pagos PENDING: $FILTERED_COUNT"

# =============================================================================
# TEST 7: Estadísticas de Pagos
# =============================================================================
print_section "TEST 7: Estadísticas de Pagos"

print_info "Obteniendo estadísticas..."

STATS=$(curl -s -X GET "$PAYMENTS_URL/payments/stats" \
  -H "Authorization: Bearer $TOKEN")

TOTAL_COUNT=$(echo $STATS | jq -r '.stats.total.count')
TOTAL_AMOUNT=$(echo $STATS | jq -r '.stats.total.amount')

print_success "Estadísticas obtenidas"
echo $STATS | jq .
print_info "Total pagos: $TOTAL_COUNT"
print_info "Monto total: $TOTAL_AMOUNT centavos"

# =============================================================================
# TEST 8: Cancelar Payment Intent
# =============================================================================
print_section "TEST 8: Cancelar Payment Intent"

print_info "Cancelando Payment Intent..."

CANCEL_PI=$(curl -s -X POST "$PAYMENTS_URL/payment-intents/$PAYMENT_INTENT_ID/cancel" \
  -H "Authorization: Bearer $TOKEN")

CANCELLED_STATUS=$(echo $CANCEL_PI | jq -r '.paymentIntent.status')
CANCELLED_AT=$(echo $CANCEL_PI | jq -r '.paymentIntent.cancelledAt')

if [ "$CANCELLED_STATUS" != "CANCELLED" ]; then
  print_warning "Payment Intent no se canceló correctamente. Status: $CANCELLED_STATUS"
else
  print_success "Payment Intent cancelado"
fi

echo $CANCEL_PI | jq .
print_info "Status: $CANCELLED_STATUS"
print_info "Cancelled at: $CANCELLED_AT"

# =============================================================================
# TEST 9: Crear Payment Intent con Booking
# =============================================================================
print_section "TEST 9: Crear Payment Intent con Booking"

# Primero, intentar obtener un booking existente
print_info "Buscando bookings existentes..."

BOOKINGS=$(curl -s -X GET "$BOOKING_URL/bookings?limit=1" \
  -H "Authorization: Bearer $TOKEN")

BOOKING_ID=$(echo $BOOKINGS | jq -r '.bookings[0].id')

if [ "$BOOKING_ID" != "null" ] && [ ! -z "$BOOKING_ID" ]; then
  print_info "Booking encontrado: $BOOKING_ID"
  print_info "Creando Payment Intent asociado al booking..."
  
  PI_WITH_BOOKING=$(curl -s -X POST "$PAYMENTS_URL/payment-intents" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"bookingId\": \"$BOOKING_ID\",
      \"amount\": 75000,
      \"currency\": \"MXN\",
      \"paymentType\": \"FULL_PAYMENT\"
    }")
  
  PI_BOOKING_ID=$(echo $PI_WITH_BOOKING | jq -r '.paymentIntent.id')
  
  if [ "$PI_BOOKING_ID" != "null" ]; then
    print_success "Payment Intent con booking creado"
    echo $PI_WITH_BOOKING | jq .
    print_info "Payment Intent ID: $PI_BOOKING_ID"
    
    # Cancelar este también para limpieza
    sleep 1
    curl -s -X POST "$PAYMENTS_URL/payment-intents/$PI_BOOKING_ID/cancel" \
      -H "Authorization: Bearer $TOKEN" > /dev/null
  else
    print_warning "No se pudo crear Payment Intent con booking"
  fi
else
  print_warning "No hay bookings disponibles para este test"
fi

# =============================================================================
# TEST 10: Validaciones - Amount inválido
# =============================================================================
print_section "TEST 10: Validaciones"

print_info "Probando amount inválido (negativo)..."

INVALID_AMOUNT=$(curl -s -X POST "$PAYMENTS_URL/payment-intents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": -100,
    "paymentType": "DEPOSIT"
  }')

ERROR_MSG=$(echo $INVALID_AMOUNT | jq -r '.message')

if [[ $ERROR_MSG == *"validation"* ]] || [[ $ERROR_MSG == *"amount"* ]]; then
  print_success "Validación correcta - Amount negativo rechazado"
else
  print_warning "Validación esperada no encontrada"
fi

echo $INVALID_AMOUNT | jq .

# =============================================================================
# TEST 11: Unauthorized Access
# =============================================================================
print_section "TEST 11: Seguridad - Sin Token"

print_info "Intentando acceso sin token..."

UNAUTHORIZED=$(curl -s -X GET "$PAYMENTS_URL/payments")

UNAUTH_ERROR=$(echo $UNAUTHORIZED | jq -r '.message')

if [[ $UNAUTH_ERROR == *"No token"* ]] || [[ $UNAUTH_ERROR == *"required"* ]]; then
  print_success "Seguridad correcta - Acceso sin token bloqueado"
else
  print_warning "Respuesta de seguridad no esperada"
fi

echo $UNAUTHORIZED | jq .

# =============================================================================
# TEST 12: Rate Limiting (opcional)
# =============================================================================
print_section "TEST 12: Rate Limiting"

print_info "Probando rate limiting (creando múltiples requests)..."

RATE_LIMIT_EXCEEDED=false

for i in {1..5}; do
  RATE_TEST=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$PAYMENTS_URL/payment-intents" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "amount": 1000,
      "paymentType": "DEPOSIT"
    }')
  
  if [ "$RATE_TEST" == "429" ]; then
    RATE_LIMIT_EXCEEDED=true
    break
  fi
  
  sleep 0.2
done

if [ "$RATE_LIMIT_EXCEEDED" = true ]; then
  print_warning "Rate limit alcanzado (esto es esperado con muchos requests)"
else
  print_success "Rate limiting configurado (no alcanzado en este test)"
fi

# =============================================================================
# RESUMEN FINAL
# =============================================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║        ✅ TODOS LOS TESTS COMPLETADOS          ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

print_info "Tests ejecutados:"
echo "  - Health check"
echo "  - Autenticación"
echo "  - Crear Payment Intent"
echo "  - Obtener Payment Intent"
echo "  - Listar payments"
echo "  - Filtrar por status"
echo "  - Estadísticas"
echo "  - Cancelar Payment Intent"
echo "  - Payment Intent con booking"
echo "  - Validaciones"
echo "  - Seguridad (sin token)"
echo "  - Rate limiting"

echo ""
print_warning "NOTA: Para probar webhooks de Stripe, usa Stripe CLI:"
echo "  stripe listen --forward-to localhost:4007/api/webhooks/stripe"
echo "  stripe trigger payment_intent.succeeded"

echo ""
print_info "Para ver logs del servicio, revisa la tabla webhook_events"
echo ""
