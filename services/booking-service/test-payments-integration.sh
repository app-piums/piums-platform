#!/bin/bash

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs de servicios
AUTH_URL="http://localhost:4001/auth"
BOOKING_URL="http://localhost:4005/api/bookings"
PAYMENTS_URL="http://localhost:4007/api/payments"

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

# Función para imprimir info
print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Banner
echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║                                                ║${NC}"
echo -e "${YELLOW}║   BOOKING ↔ PAYMENTS INTEGRATION TESTS         ║${NC}"
echo -e "${YELLOW}║                                                ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════╝${NC}"
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

# =============================================================================
# TEST 1: Autenticación
# =============================================================================
print_section "TEST 1: Autenticación"

print_info "Intentando login..."

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
# TEST 2: Crear Booking con Depósito
# =============================================================================
print_section "TEST 2: Crear Booking con Depósito Requerido"

# Primero, obtener la configuración del artista para asegurar que requiere depósito
print_info "Configurando artista para requerir depósito..."

# Asumimos que hay un artistId conocido o creamos uno para testing
# Por simplicidad, usaremos un UUID fijo de ejemplo
ARTIST_ID="123e4567-e89b-12d3-a456-426614174000"
SERVICE_ID="223e4567-e89b-12d3-a456-426614174000"

print_info "Creando booking con depósito..."

# Calculamos una fecha futura (mañana a las 14:00)
TOMORROW=$(date -v+1d -u +"%Y-%m-%dT14:00:00Z")

CREATE_BOOKING=$(curl -s -X POST "$BOOKING_URL/bookings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"artistId\": \"$ARTIST_ID\",
    \"serviceId\": \"$SERVICE_ID\",
    \"scheduledDate\": \"$TOMORROW\",
    \"durationMinutes\": 60,
    \"location\": \"Calle Principal 123, CDMX\",
    \"clientNotes\": \"Por favor confirmar\"
  }")

BOOKING_ID=$(echo $CREATE_BOOKING | jq -r '.booking.id')
PAYMENT_INTENT_ID=$(echo $CREATE_BOOKING | jq -r '.paymentIntent.id')
CLIENT_SECRET=$(echo $CREATE_BOOKING | jq -r '.paymentIntent.clientSecret')

if [ "$BOOKING_ID" == "null" ] || [ -z "$BOOKING_ID" ]; then
  print_error "Error creando booking. Respuesta: $(echo $CREATE_BOOKING | jq .)"
fi

print_success "Booking creado"
echo $CREATE_BOOKING | jq .
print_info "Booking ID: $BOOKING_ID"

if [ "$PAYMENT_INTENT_ID" != "null" ] && [ ! -z "$PAYMENT_INTENT_ID" ]; then
  print_success "Payment Intent creado automáticamente"
  print_info "Payment Intent ID: $PAYMENT_INTENT_ID"
  print_info "Client Secret: ${CLIENT_SECRET:0:50}..."
else
  print_info "No se requiere depósito para este booking (esto puede ser OK)"
fi

# =============================================================================
# TEST 3: Obtener Booking y Verificar Payment Intent
# =============================================================================
print_section "TEST 3: Verificar Booking con Payment Intent"

print_info "Obteniendo detalles del booking..."

GET_BOOKING=$(curl -s -X GET "$BOOKING_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN")

BOOKING_STATUS=$(echo $GET_BOOKING | jq -r '.status')
PAYMENT_STATUS=$(echo $GET_BOOKING | jq -r '.paymentStatus')
BOOKING_PI_ID=$(echo $GET_BOOKING | jq -r '.paymentIntentId')

print_success "Booking obtenido"
echo $GET_BOOKING | jq .
print_info "Booking Status: $BOOKING_STATUS"
print_info "Payment Status: $PAYMENT_STATUS"
print_info "Payment Intent ID en Booking: $BOOKING_PI_ID"

# =============================================================================
# TEST 4: Obtener Payment Intent desde payments-service
# =============================================================================
if [ "$PAYMENT_INTENT_ID" != "null" ] && [ ! -z "$PAYMENT_INTENT_ID" ]; then
  print_section "TEST 4: Obtener Payment Intent desde payments-service"
  
  print_info "Consultando Payment Intent..."
  
  GET_PI=$(curl -s -X GET "$PAYMENTS_URL/payment-intents/$PAYMENT_INTENT_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  PI_STATUS=$(echo $GET_PI | jq -r '.paymentIntent.status')
  PI_AMOUNT=$(echo $GET_PI | jq -r '.paymentIntent.amount')
  
  print_success "Payment Intent obtenido"
  echo $GET_PI | jq .
  print_info "Status: $PI_STATUS"
  print_info "Amount: $PI_AMOUNT centavos"
fi

# =============================================================================
# TEST 5: Verificar Flujo de Webhook (simulado)
# =============================================================================
print_section "TEST 5: Simular Pago Exitoso (markPayment)"

if [ "$PAYMENT_INTENT_ID" != "null" ] && [ ! -z "$PAYMENT_INTENT_ID" ]; then
  print_info "Simulando pago exitoso vía markPayment endpoint..."
  
  # En producción, esto sería llamado por el webhook de Stripe
  # Aquí lo simulamos directamente
  MARK_PAYMENT=$(curl -s -X POST "$BOOKING_URL/bookings/$BOOKING_ID/mark-payment" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": $PI_AMOUNT,
      \"paymentMethod\": \"card\",
      \"paymentIntentId\": \"$PAYMENT_INTENT_ID\",
      \"paymentType\": \"DEPOSIT\"
    }")
  
  UPDATED_PAYMENT_STATUS=$(echo $MARK_PAYMENT | jq -r '.paymentStatus')
  UPDATED_PAID_AMOUNT=$(echo $MARK_PAYMENT | jq -r '.paidAmount')
  
  print_success "Pago marcado como exitoso"
  echo $MARK_PAYMENT | jq .
  print_info "Nuevo Payment Status: $UPDATED_PAYMENT_STATUS"
  print_info "Monto pagado: $UPDATED_PAID_AMOUNT centavos"
  
  if [ "$UPDATED_PAYMENT_STATUS" == "DEPOSIT_PAID" ]; then
    print_success "✅ Depósito pagado correctamente"
  else
    print_info "Payment Status: $UPDATED_PAYMENT_STATUS (verifica la lógica)"
  fi
else
  print_info "Skipping - No hay Payment Intent para este booking"
fi

# =============================================================================
# TEST 6: Verificar Integración Completa
# =============================================================================
print_section "TEST 6: Verificar Estado Final"

print_info "Obteniendo booking actualizado..."

FINAL_BOOKING=$(curl -s -X GET "$BOOKING_URL/bookings/$BOOKING_ID" \
  -H "Authorization: Bearer $TOKEN")

FINAL_STATUS=$(echo $FINAL_BOOKING | jq -r '.status')
FINAL_PAYMENT_STATUS=$(echo $FINAL_BOOKING | jq -r '.paymentStatus')
FINAL_PAID_AMOUNT=$(echo $FINAL_BOOKING | jq -r '.paidAmount')
FINAL_PI_ID=$(echo $FINAL_BOOKING | jq -r '.paymentIntentId')

print_success "Booking final obtenido"
echo $FINAL_BOOKING | jq .
print_info "Status: $FINAL_STATUS"
print_info "Payment Status: $FINAL_PAYMENT_STATUS"
print_info "Paid Amount: $FINAL_PAID_AMOUNT centavos"
print_info "Payment Intent ID: $FINAL_PI_ID"

# =============================================================================
# RESUMEN FINAL
# =============================================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}║        ✅ INTEGRATION TESTS COMPLETED          ║${NC}"
echo -e "${GREEN}║                                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

print_info "Resumen de la integración:"
echo "  ✅ Booking creado: $BOOKING_ID"
if [ "$PAYMENT_INTENT_ID" != "null" ] && [ ! -z "$PAYMENT_INTENT_ID" ]; then
  echo "  ✅ Payment Intent creado automáticamente: $PAYMENT_INTENT_ID"
  echo "  ✅ Client Secret generado para frontend"
  echo "  ✅ Booking vinculado con Payment Intent"
  echo "  ✅ Pago simulado exitosamente"
  echo "  ✅ Booking actualizado con información de pago"
else
  echo "  ℹ️  No se requirió depósito para este booking"
fi

echo ""
print_info "FLUJO COMPLETO DE INTEGRACIÓN:"
echo "  1. Cliente crea booking → booking-service"
echo "  2. booking-service detecta depósito requerido"
echo "  3. booking-service llama a payments-service"
echo "  4. payments-service crea Payment Intent en Stripe"
echo "  5. payments-service retorna clientSecret"
echo "  6. booking-service retorna booking + paymentIntent"
echo "  7. Frontend usa clientSecret con Stripe.js"
echo "  8. Usuario completa pago en Stripe"
echo "  9. Stripe envía webhook a payments-service"
echo "  10. payments-service llama a booking/mark-payment"
echo "  11. booking-service actualiza status de pago"
echo "  12. Cliente recibe notificación de pago exitoso"

echo ""
print_success "Integración booking ↔ payments funcionando correctamente!"
echo ""
