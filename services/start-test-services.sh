#!/bin/bash

# ============================================================================
# Script para iniciar servicios necesarios para testing
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_section "🚀 Iniciando servicios para testing"

# Verificar que estamos en el directorio correcto
if [ ! -d "services" ]; then
  print_error "Debes ejecutar este script desde la raíz del proyecto (piums-platform/)"
  exit 1
fi

# Array de servicios a iniciar
services=("auth-service" "users-service" "booking-service")

# Iniciar cada servicio en background
for service in "${services[@]}"; do
  if [ -d "services/$service" ]; then
    print_info "Iniciando $service..."
    
    cd "services/$service"
    
    # Verificar si existe package.json
    if [ -f "package.json" ]; then
      # Iniciar en background
      pnpm dev > "/tmp/$service.log" 2>&1 &
      service_pid=$!
      echo "$service_pid" > "/tmp/$service.pid"
      
      print_success "$service iniciado (PID: $service_pid)"
      print_info "  Logs: tail -f /tmp/$service.log"
    else
      print_error "No se encontró package.json en $service"
    fi
    
    cd ../..
  else
    print_error "No se encontró el directorio services/$service"
  fi
done

echo ""
print_info "Esperando 10 segundos para que los servicios inicien..."
sleep 10

# Verificar que los servicios estén respondiendo
print_section "🔍 Verificando servicios"

check_service() {
  local name=$1
  local url=$2
  
  if curl -s "$url" > /dev/null 2>&1; then
    print_success "$name está disponible en $url"
    return 0
  else
    print_error "$name no responde en $url"
    return 1
  fi
}

services_ok=0
check_service "Auth service" "http://localhost:3001/health" && ((services_ok++)) || true
check_service "Users service" "http://localhost:3002/health" && ((services_ok++)) || true
check_service "Booking service" "http://localhost:3006/health" && ((services_ok++)) || true

echo ""
if [ $services_ok -eq 3 ]; then
  print_success "✨ Todos los servicios están corriendo correctamente"
  echo ""
  print_info "Para ejecutar los tests de rate limiting, ejecuta:"
  echo "  ./services/test-rate-limiting.sh"
  echo ""
  print_info "Para detener todos los servicios, ejecuta:"
  echo "  ./services/stop-test-services.sh"
else
  print_error "⚠️  Algunos servicios no respondieron. Revisa los logs:"
  echo "  tail -f /tmp/auth-service.log"
  echo "  tail -f /tmp/users-service.log"
  echo "  tail -f /tmp/booking-service.log"
fi
