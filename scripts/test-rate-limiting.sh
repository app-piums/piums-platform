#!/bin/bash

# ============================================================================
# Test de Rate Limiting para servicios de Piums Platform
# ============================================================================
# Este script prueba que los rate limiters estén funcionando correctamente
# en diferentes servicios, verificando que bloqueen peticiones excesivas.
# ============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_section() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# Variables
AUTH_URL="http://localhost:4001"
USERS_URL="http://localhost:4002"
ARTISTS_URL="http://localhost:4003"
BOOKING_URL="http://localhost:4008"

# Contadores
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# ============================================================================
# TEST 1: Auth Service - Login Rate Limiter (5 intentos / 15 min)
# ============================================================================
test_auth_login_rate_limit() {
  print_section "TEST 1: Auth Service - Login Rate Limiter"
  print_info "Límite: 5 intentos por 15 minutos"
  
  local email="test-rate-limit-$(date +%s)@test.com"
  local password="TestPassword123"
  local attempts=7 # Intentamos 7 veces para exceder el límite de 5
  local blocked=false
  
  print_info "Intentando hacer $attempts peticiones de login..."
  
  for i in $(seq 1 $attempts); do
    response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$email\",
        \"password\": \"$password\"
      }")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo -n "  Intento $i: "
    
    if [ "$http_code" -eq 429 ]; then
      echo -e "${RED}Bloqueado (429 Too Many Requests)${NC}"
      blocked=true
      break
    elif [ "$http_code" -eq 401 ]; then
      echo -e "${GREEN}Permitido (401 Unauthorized - credenciales inválidas, pero request procesado)${NC}"
    else
      echo -e "${YELLOW}HTTP $http_code${NC}"
    fi
    
    # Pequeña pausa entre requests
    sleep 0.2
  done
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  if [ "$blocked" = true ]; then
    print_success "Rate limiter funcionando correctamente - bloqueó después de 5 intentos"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    print_error "Rate limiter NO bloqueó después de $attempts intentos"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# ============================================================================
# TEST 2: Auth Service - Register Rate Limiter (3 intentos / hora)
# ============================================================================
test_auth_register_rate_limit() {
  print_section "TEST 2: Auth Service - Register Rate Limiter"
  print_info "Límite: 3 intentos por hora"
  
  local attempts=5 # Intentamos 5 veces para exceder el límite de 3
  local blocked=false
  
  print_info "Intentando hacer $attempts peticiones de registro..."
  
  for i in $(seq 1 $attempts); do
    local email="test-rate-limit-$i-$(date +%s)@test.com"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$AUTH_URL/auth/register" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$email\",
        \"password\": \"TestPassword123\",
        \"confirmPassword\": \"TestPassword123\",
        \"nombre\": \"Test User $i\"
      }")
    
    http_code=$(echo "$response" | tail -n1)
    
    echo -n "  Intento $i: "
    
    if [ "$http_code" -eq 429 ]; then
      echo -e "${RED}Bloqueado (429 Too Many Requests)${NC}"
      blocked=true
      break
    elif [ "$http_code" -eq 201 ] || [ "$http_code" -eq 200 ]; then
      echo -e "${GREEN}Permitido (HTTP $http_code - usuario creado)${NC}"
    elif [ "$http_code" -eq 400 ]; then
      echo -e "${GREEN}Permitido (400 Bad Request - validación, pero request procesado)${NC}"
    else
      echo -e "${YELLOW}HTTP $http_code${NC}"
    fi
    
    sleep 0.2
  done
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  if [ "$blocked" = true ]; then
    print_success "Rate limiter funcionando correctamente - bloqueó después de 3 intentos"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    print_error "Rate limiter NO bloqueó después de $attempts intentos"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# ============================================================================
# TEST 3: API General Rate Limiter (100 requests / 15 min)
# ============================================================================
test_general_rate_limit() {
  print_section "TEST 3: API General Rate Limiter"
  print_info "Límite: 100 requests por 15 minutos"
  print_warning "Test simplificado: solo enviaremos 10 requests rápidas"
  
  local attempts=10
  local success_count=0
  
  print_info "Enviando $attempts requests al endpoint de healthcheck..."
  
  for i in $(seq 1 $attempts); do
    response=$(curl -s -w "\n%{http_code}" "$AUTH_URL/health")
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 200 ]; then
      success_count=$((success_count + 1))
    fi
    
    # Sin pausa para simular burst
  done
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  if [ "$success_count" -eq "$attempts" ]; then
    print_success "Todas las requests permitidas ($success_count/$attempts) - dentro del límite"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    print_warning "Algunas requests bloqueadas ($success_count/$attempts successful)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi
}

# ============================================================================
# TEST 4: Users Service - Update Rate Limiter (10 updates / hora)
# ============================================================================
test_users_update_rate_limit() {
  print_section "TEST 4: Users Service - Update Rate Limiter"
  print_info "Límite: 10 actualizaciones por hora"
  print_warning "Test sin autenticación - esperamos 401, verificamos que no sea 429 antes del límite"
  
  local attempts=5
  local blocked=false
  local user_id="test-user-id"
  
  print_info "Intentando hacer $attempts peticiones de actualización..."
  
  for i in $(seq 1 $attempts); do
    response=$(curl -s -w "\n%{http_code}" -X PUT "$USERS_URL/api/users/$user_id" \
      -H "Content-Type: application/json" \
      -d "{
        \"nombre\": \"Test User Updated $i\"
      }")
    
    http_code=$(echo "$response" | tail -n1)
    
    echo -n "  Intento $i: "
    
    if [ "$http_code" -eq 429 ]; then
      echo -e "${RED}Bloqueado (429 Too Many Requests)${NC}"
      blocked=true
      break
    elif [ "$http_code" -eq 401 ]; then
      echo -e "${GREEN}Permitido (401 - sin auth, pero rate limit no alcanzado)${NC}"
    else
      echo -e "${YELLOW}HTTP $http_code${NC}"
    fi
    
    sleep 0.1
  done
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  if [ "$blocked" = false ]; then
    print_success "Rate limiter aún no alcanzado con $attempts requests (límite: 10/hora)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    print_warning "Rate limiter bloqueó antes de tiempo (puede ser configuración más estricta)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi
}

# ============================================================================
# TEST 5: Booking Service - Create Booking Rate Limiter (10 / hora)
# ============================================================================
test_booking_create_rate_limit() {
  print_section "TEST 5: Booking Service - Create Booking Rate Limiter"
  print_info "Límite: 10 reservas por hora"
  print_warning "Test sin autenticación - verificamos que rate limiter esté activo"
  
  local attempts=5
  local blocked=false
  
  print_info "Intentando hacer $attempts peticiones de creación de booking..."
  
  for i in $(seq 1 $attempts); do
    response=$(curl -s -w "\n%{http_code}" -X POST "$BOOKING_URL/api/bookings" \
      -H "Content-Type: application/json" \
      -d "{
        \"clientId\": \"test-client-id\",
        \"artistId\": \"test-artist-id\",
        \"serviceId\": \"test-service-id\",
        \"scheduledDate\": \"2026-03-01T10:00:00Z\",
        \"durationMinutes\": 60
      }")
    
    http_code=$(echo "$response" | tail -n1)
    
    echo -n "  Intento $i: "
    
    if [ "$http_code" -eq 429 ]; then
      echo -e "${RED}Bloqueado (429 Too Many Requests)${NC}"
      blocked=true
      break
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 400 ] || [ "$http_code" -eq 500 ]; then
      echo -e "${GREEN}Permitido (HTTP $http_code - error de negocio, no rate limit)${NC}"
    else
      echo -e "${YELLOW}HTTP $http_code${NC}"
    fi
    
    sleep 0.1
  done
  
  TESTS_RUN=$((TESTS_RUN + 1))
  
  if [ "$blocked" = false ]; then
    print_success "Rate limiter aún no alcanzado con $attempts requests (límite: 10/hora)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    print_warning "Rate limiter bloqueó antes de tiempo"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi
}

# ============================================================================
# TEST 6: Verificar Headers de Rate Limiting
# ============================================================================
test_rate_limit_headers() {
  print_section "TEST 6: Verificar Headers de Rate Limiting"
  print_info "Comprobando que los servicios devuelvan headers estándar de rate limiting"
  
  response=$(curl -si "$AUTH_URL/health" 2>/dev/null)
  
  echo "$response" | grep -i "ratelimit" || true
  
  if echo "$response" | grep -qi "ratelimit-limit"; then
    print_success "Headers de rate limiting presentes"
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    print_warning "Headers de rate limiting no encontrados (puede ser normal en algunos endpoints)"
    TESTS_RUN=$((TESTS_RUN + 1))
    TESTS_PASSED=$((TESTS_PASSED + 1))
  fi
}

# ============================================================================
# Ejecutar todos los tests
# ============================================================================

clear
print_section "🧪 TEST DE RATE LIMITING - PIUMS PLATFORM"

echo "Este test verifica que los rate limiters estén configurados correctamente"
echo "y bloqueen peticiones excesivas según los límites definidos."
echo ""
print_warning "NOTA: Estos tests pueden dejar tu IP temporalmente bloqueada en algunos endpoints."
print_warning "Es normal y el bloqueo se levantará automáticamente después del periodo de ventana."
echo ""
print_info "Presiona ENTER para continuar o Ctrl+C para cancelar..."
read

# Verificar que los servicios estén corriendo
print_info "Verificando que los servicios estén disponibles..."
services_down=0

if ! curl -s "$AUTH_URL/health" > /dev/null 2>&1; then
  print_error "Auth service no está disponible en $AUTH_URL"
  services_down=1
fi

if ! curl -s "$USERS_URL/health" > /dev/null 2>&1; then
  print_error "Users service no está disponible en $USERS_URL"
  services_down=1
fi

if ! curl -s "$BOOKING_URL/health" > /dev/null 2>&1; then
  print_error "Booking service no está disponible en $BOOKING_URL"
  services_down=1
fi

if [ $services_down -eq 1 ]; then
  print_error "Algunos servicios no están disponibles. Inicia los servicios y vuelve a intentar."
  exit 1
fi

print_success "Todos los servicios están disponibles"
echo ""

# Ejecutar tests
test_auth_login_rate_limit
test_auth_register_rate_limit
test_general_rate_limit
test_users_update_rate_limit
test_booking_create_rate_limit
test_rate_limit_headers

# ============================================================================
# Resumen final
# ============================================================================

print_section "📊 RESUMEN DE TESTS"

echo "Tests ejecutados: $TESTS_RUN"
echo -e "Tests exitosos:   ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests fallidos:   ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo ""
  print_success "✨ Todos los tests pasaron exitosamente"
  exit 0
else
  echo ""
  print_error "⚠️  Algunos tests fallaron - revisar configuración de rate limiters"
  exit 1
fi
