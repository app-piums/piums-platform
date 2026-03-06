#!/bin/bash

# Script para construir y levantar el stack completo de Docker
# Autor: Piums Platform
# Fecha: 2026-02-23

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

# Verificar que estamos en la raíz del proyecto
if [ ! -f "pnpm-workspace.yaml" ]; then
    print_error "Este script debe ejecutarse desde la raíz del proyecto"
    exit 1
fi

# Verificar que docker-compose existe
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "docker-compose no está instalado"
    exit 1
fi

# Determinar comando docker-compose
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

print_info "Usando comando: $DOCKER_COMPOSE"

# Ir al directorio de docker
cd infra/docker

print_section "PASO 5: Build de imágenes Docker"

print_info "Construyendo imágenes... (esto puede tomar varios minutos)"
print_warning "Primera vez puede tomar 10-15 minutos"

# Build con progress
$DOCKER_COMPOSE -f docker-compose.dev.yml build --progress=plain

if [ $? -eq 0 ]; then
    print_success "Imágenes construidas exitosamente"
else
    print_error "Error al construir las imágenes"
    exit 1
fi

print_section "PASO 6: Levantando el stack"

print_info "Deteniendo contenedores existentes..."
$DOCKER_COMPOSE -f docker-compose.dev.yml down

print_info "Iniciando servicios..."
$DOCKER_COMPOSE -f docker-compose.dev.yml up -d

if [ $? -eq 0 ]; then
    print_success "Stack iniciado exitosamente"
else
    print_error "Error al iniciar el stack"
    exit 1
fi

print_section "PASO 7: Health Checks"

print_info "Esperando servicios... (30 segundos)"
sleep 30

print_info "Estado de los contenedores:"
$DOCKER_COMPOSE -f docker-compose.dev.yml ps

print_info ""
print_info "Verificando logs de servicios críticos..."

# Verificar Postgres
print_info "PostgreSQL:"
$DOCKER_COMPOSE -f docker-compose.dev.yml logs postgres | tail -n 5

# Verificar Redis
print_info ""
print_info "Redis:"
$DOCKER_COMPOSE -f docker-compose.dev.yml logs redis | tail -n 5

# Verificar Auth Service
print_info ""
print_info "Auth Service:"
$DOCKER_COMPOSE -f docker-compose.dev.yml logs auth-service | tail -n 5

print_section "RESUMEN FINAL"

echo ""
print_success "Stack de Docker levantado correctamente"
echo ""
echo "Servicios disponibles:"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo "  • Gateway: http://localhost:3000"
echo "  • Auth Service: http://localhost:4001"
echo "  • Users Service: http://localhost:4002"
echo "  • Artists Service: http://localhost:4003"
echo "  • Catalog Service: http://localhost:4004"
echo "  • Payments Service: http://localhost:4005"
echo "  • Reviews Service: http://localhost:4006"
echo "  • Notifications Service: http://localhost:4007"
echo "  • Booking Service: http://localhost:4008"
echo "  • Search Service: http://localhost:4009"
echo ""
print_info "Comandos útiles:"
echo "  • Ver logs: docker-compose -f infra/docker/docker-compose.dev.yml logs -f [servicio]"
echo "  • Ver estado: docker-compose -f infra/docker/docker-compose.dev.yml ps"
echo "  • Detener: docker-compose -f infra/docker/docker-compose.dev.yml down"
echo "  • Reiniciar: docker-compose -f infra/docker/docker-compose.dev.yml restart [servicio]"
echo ""
print_success "¡Sistema listo para usar!"
