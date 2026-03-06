#!/bin/bash

# ============================================================================
# Piums Platform - Development Setup Script
# ============================================================================
# Este script facilita el inicio del entorno de desarrollo completo
# Usa: ./scripts/dev.sh [opcion]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Functions
# ============================================================================

print_header() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         🎨 Piums Platform - Development Setup           ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}═══ $1 ═══${NC}"
    echo ""
}

check_dependencies() {
    print_section "Verificando Dependencias"
    
    local missing_deps=0
    
    # Check Docker
    if command -v docker &> /dev/null; then
        print_success "Docker instalado: $(docker --version)"
    else
        print_error "Docker no está instalado"
        missing_deps=1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        print_success "Docker Compose instalado: $(docker-compose --version)"
    else
        print_error "Docker Compose no está instalado"
        missing_deps=1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        print_success "Node.js instalado: $(node --version)"
    else
        print_error "Node.js no está instalado"
        missing_deps=1
    fi
    
    # Check pnpm
    if command -v pnpm &> /dev/null; then
        print_success "pnpm instalado: $(pnpm --version)"
    else
        print_error "pnpm no está instalado (ejecuta: npm install -g pnpm)"
        missing_deps=1
    fi
    
    if [ $missing_deps -eq 1 ]; then
        print_error "Faltan dependencias requeridas. Por favor instálalas antes de continuar."
        exit 1
    fi
    
    print_success "Todas las dependencias están instaladas"
}

install_dependencies() {
    print_section "Instalando Dependencias de Proyecto"
    
    print_info "Instalando dependencias con pnpm..."
    pnpm install
    
    print_success "Dependencias instaladas correctamente"
}

setup_databases() {
    print_section "Configurando Bases de Datos"
    
    print_info "Iniciando PostgreSQL y Redis con Docker Compose..."
    cd infra/docker
    docker-compose -f docker-compose.dev.yml up -d postgres redis
    cd ../..
    
    print_info "Esperando que PostgreSQL esté listo..."
    sleep 10
    
    print_success "Bases de datos iniciadas"
}

run_migrations() {
    print_section "Ejecutando Migraciones de Prisma"
    
    local services=("auth-service" "users-service" "artists-service" "catalog-service" "booking-service" "payments-service" "reviews-service" "notifications-service" "search-service")
    
    for service in "${services[@]}"; do
        print_info "Migrando $service..."
        cd services/$service
        
        # Check if prisma.config.ts exists (Prisma 7)
        if [ -f "prisma.config.ts" ]; then
            npx prisma db push --skip-generate 2>/dev/null || print_error "Error en migración de $service (puede ser normal si ya está sincronizado)"
        else
            npx prisma db push 2>/dev/null || print_error "Error en migración de $service (puede ser normal si ya está sincronizado)"
        fi
        
        cd ../..
    done
    
    print_success "Migraciones completadas"
}

start_services_docker() {
    print_section "Iniciando Servicios con Docker Compose"
    
    cd infra/docker
    print_info "Construyendo y levantando todos los servicios..."
    docker-compose -f docker-compose.dev.yml up -d --build
    cd ../..
    
    print_info "Esperando que los servicios estén listos..."
    sleep 15
    
    print_success "Servicios iniciados en Docker"
}

start_services_local() {
    print_section "Iniciando Servicios Localmente"
    
    print_info "Iniciando Gateway..."
    cd apps/gateway
    pnpm dev &
    cd ../..
    
    print_info "Iniciando Auth Service..."
    cd services/auth-service
    pnpm dev &
    cd ../..
    
    print_info "Para más servicios, ejecutar manualmente: cd services/<service> && pnpm dev"
    print_success "Servicios principales iniciados"
}

show_status() {
    print_section "Estado del Sistema"
    
    if command -v docker-compose &> /dev/null; then
        cd infra/docker
        docker-compose -f docker-compose.dev.yml ps
        cd ../..
    fi
}

health_check() {
    print_section "Health Check"
    
    print_info "Verificando salud del Gateway..."
    if curl -s http://localhost:3000/api/health/ping > /dev/null 2>&1; then
        print_success "Gateway está respondiendo"
        echo ""
        curl -s http://localhost:3000/api/health | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/health
    else
        print_error "Gateway no está respondiendo en puerto 3000"
    fi
}

show_endpoints() {
    print_section "Endpoints Disponibles"
    
    echo -e "${GREEN}Gateway:${NC}"
    echo "  • http://localhost:3000"
    echo "  • http://localhost:3000/api/health"
    echo ""
    echo -e "${GREEN}Microservicios:${NC}"
    echo "  • Auth:          http://localhost:4001"
    echo "  • Users:         http://localhost:4002"
    echo "  • Artists:       http://localhost:4003"
    echo "  • Catalog:       http://localhost:4004"
    echo "  • Payments:      http://localhost:4005"
    echo "  • Reviews:       http://localhost:4006"
    echo "  • Notifications: http://localhost:4007"
    echo "  • Booking:       http://localhost:4008"
    echo "  • Search:        http://localhost:4009"
    echo ""
    echo -e "${GREEN}Bases de Datos:${NC}"
    echo "  • PostgreSQL: localhost:5432 (user: piums, pass: piums_dev_password)"
    echo "  • Redis:      localhost:6379"
}

stop_services() {
    print_section "Deteniendo Servicios"
    
    cd infra/docker
    docker-compose -f docker-compose.dev.yml down
    cd ../..
    
    print_success "Servicios Docker detenidos"
    
    # Kill any local node processes
    print_info "Deteniendo procesos Node locales..."
    pkill -f "pnpm dev" || true
    
    print_success "Servicios locales detenidos"
}

clean_all() {
    print_section "Limpieza Completa"
    
    print_info "Deteniendo servicios y eliminando volúmenes..."
    cd infra/docker
    docker-compose -f docker-compose.dev.yml down -v
    cd ../..
    
    print_info "Eliminando node_modules..."
    find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
    
    print_info "Eliminando archivos de build..."
    find . -name "dist" -type d -prune -exec rm -rf '{}' +
    
    print_success "Limpieza completa finalizada"
}

show_help() {
    echo "Uso: ./scripts/dev.sh [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start         - Iniciar todo el stack con Docker (por defecto)"
    echo "  start-local   - Iniciar servicios localmente (sin Docker)"
    echo "  stop          - Detener todos los servicios"
    echo "  restart       - Reiniciar todos los servicios"
    echo "  status        - Mostrar estado de servicios"
    echo "  health        - Verificar salud del sistema"
    echo "  logs          - Ver logs de servicios Docker"
    echo "  clean         - Limpieza completa (datos, node_modules, etc.)"
    echo "  setup         - Setup inicial (deps + databases + migrations)"
    echo "  help          - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./scripts/dev.sh              # Iniciar con Docker"
    echo "  ./scripts/dev.sh start-local  # Iniciar localmente"
    echo "  ./scripts/dev.sh logs         # Ver logs"
    echo "  ./scripts/dev.sh health       # Health check"
}

# ============================================================================
# Main Script
# ============================================================================

print_header

COMMAND=${1:-start}

case $COMMAND in
    start)
        check_dependencies
        setup_databases
        start_services_docker
        sleep 5
        health_check
        show_endpoints
        print_info "Ver logs con: docker-compose -f infra/docker/docker-compose.dev.yml logs -f"
        ;;
    
    start-local)
        check_dependencies
        install_dependencies
        setup_databases
        run_migrations
        start_services_local
        sleep 5
        show_endpoints
        ;;
    
    stop)
        stop_services
        ;;
    
    restart)
        stop_services
        sleep 2
        check_dependencies
        start_services_docker
        sleep 5
        health_check
        ;;
    
    status)
        show_status
        health_check
        ;;
    
    health)
        health_check
        ;;
    
    logs)
        cd infra/docker
        docker-compose -f docker-compose.dev.yml logs -f
        ;;
    
    clean)
        clean_all
        ;;
    
    setup)
        check_dependencies
        install_dependencies
        setup_databases
        run_migrations
        print_success "Setup completo! Ahora ejecuta: ./scripts/dev.sh start"
        ;;
    
    help)
        show_help
        ;;
    
    *)
        print_error "Comando desconocido: $COMMAND"
        echo ""
        show_help
        exit 1
        ;;
esac

echo ""
print_success "✨ Listo!"
