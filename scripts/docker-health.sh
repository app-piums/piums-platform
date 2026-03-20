#!/bin/bash

# Script de health check para todos los servicios
# Verifica que el stack de Docker esté funcionando correctamente

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[✓]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[⚠]${NC} $1"; }
print_error() { echo -e "${RED}[✗]${NC} $1"; }

print_section() {
    echo ""
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}=====================================${NC}"
}

# Health check de un servicio HTTP
check_http_health() {
    local name=$1
    local url=$2
    local timeout=${3:-5}
    
    if curl -sf --max-time $timeout "$url" > /dev/null 2>&1; then
        print_success "$name está saludable"
        return 0
    else
        print_error "$name no responde"
        return 1
    fi
}

# Health check de PostgreSQL
check_postgres() {
    if docker exec piums-postgres pg_isready -U piums > /dev/null 2>&1; then
        print_success "PostgreSQL está saludable"
        return 0
    else
        print_error "PostgreSQL no responde"
        return 1
    fi
}

# Health check de Redis
check_redis() {
    if docker exec piums-redis redis-cli ping > /dev/null 2>&1; then
        print_success "Redis está saludable"
        return 0
    else
        print_error "Redis no responde"
        return 1
    fi
}

print_section "HEALTH CHECK - Piums Platform"

print_info "Verificando infraestructura..."
echo ""

# Bases de datos
print_info "🗄️  Bases de datos:"
check_postgres
check_redis

echo ""
print_info "🚀 Microservicios:"

# Gateway
check_http_health "Gateway" "http://localhost:3000/health"

# Services
check_http_health "Auth Service" "http://localhost:4001/health"
check_http_health "Users Service" "http://localhost:4002/health"
check_http_health "Artists Service" "http://localhost:4003/health"
check_http_health "Catalog Service" "http://localhost:4004/health"
check_http_health "Payments Service" "http://localhost:4005/health"
check_http_health "Reviews Service" "http://localhost:4006/health"
check_http_health "Notifications Service" "http://localhost:4007/health"
check_http_health "Booking Service" "http://localhost:4008/health"
check_http_health "Search Service" "http://localhost:4009/health"

print_section "RESUMEN"

# Contar contenedores corriendo
RUNNING=$(docker ps --filter "name=piums-" --format "{{.Names}}" | wc -l | tr -d ' ')
print_info "Contenedores corriendo: $RUNNING/12"

# Estado de contenedores
print_info ""
print_info "Estado detallado:"
docker ps --filter "name=piums-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

print_success ""
print_success "Health check completado"
