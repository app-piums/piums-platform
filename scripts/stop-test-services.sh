#!/bin/bash

# ============================================================================
# Script para detener servicios de testing
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

echo ""
print_info "🛑 Deteniendo servicios de testing..."
echo ""

services=("auth-service" "users-service" "booking-service")

for service in "${services[@]}"; do
  pid_file="/tmp/$service.pid"
  
  if [ -f "$pid_file" ]; then
    pid=$(cat "$pid_file")
    
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      print_success "Detenido $service (PID: $pid)"
    else
      print_info "$service ya no está corriendo"
    fi
    
    rm "$pid_file"
  else
    print_info "No se encontró PID file para $service"
  fi
done

# Limpiar logs
print_info "Limpiando logs temporales..."
rm -f /tmp/auth-service.log /tmp/users-service.log /tmp/booking-service.log

echo ""
print_success "✨ Todos los servicios detenidos"
