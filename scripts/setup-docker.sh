#!/bin/bash

# Script para configurar Docker en todos los servicios
# Autor: Piums Platform
# Fecha: 2026-02-23

# Forzar uso de bash
if [ -z "$BASH_VERSION" ]; then
    exec bash "$0" "$@"
fi

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

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

print_section "PASO 1: Verificando estructura actual"

# Lista de servicios y sus puertos
SERVICES="artists-service:4003 auth-service:4001 booking-service:4008 catalog-service:4004 notifications-service:4007 payments-service:4005 reviews-service:4006 search-service:4009 users-service:4002"

# Verificar directorio de servicios
if [ ! -d "services" ]; then
    print_error "Directorio 'services' no encontrado"
    exit 1
fi

print_success "Estructura del proyecto validada"

# Listar servicios encontrados
print_info "Servicios encontrados:"
for service_port in $SERVICES; do
    service=$(echo $service_port | cut -d: -f1)
    port=$(echo $service_port | cut -d: -f2)
    if [ -d "services/$service" ]; then
        echo "  ✓ $service (puerto $port)"
    else
        print_warning "  ✗ $service - Directorio no encontrado"
    fi
done

print_section "PASO 2: Creando Dockerfiles"

# Función para crear Dockerfile
create_dockerfile() {
    local service=$1
    local port=$2
    local dockerfile_path="services/$service/Dockerfile"
    
    if [ -f "$dockerfile_path" ]; then
        print_warning "Dockerfile ya existe para $service - omitiendo"
        return
    fi
    
    cat > "$dockerfile_path" << 'EOF'
# Multi-stage build para optimizar tamaño
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instalar pnpm
RUN npm install -g pnpm

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Compilar TypeScript si existe tsconfig.json
RUN if [ -f "tsconfig.json" ]; then pnpm run build 2>/dev/null || npm run build 2>/dev/null || echo "No build script found"; fi

# Generar Prisma Client si existe schema.prisma
RUN if [ -f "prisma/schema.prisma" ]; then npx prisma generate; fi

# ============================================================================
# Imagen final
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar dependencias y build desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copiar archivos necesarios
COPY . .

# Variables de entorno por defecto
ENV NODE_ENV=production

# Exponer puerto
EXPOSE PORT_PLACEHOLDER

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:PORT_PLACEHOLDER/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando para iniciar
CMD ["sh", "-c", "if [ -f 'prisma/schema.prisma' ]; then npx prisma db push --skip-generate; fi && node dist/index.js"]
EOF

    # Reemplazar el puerto
    sed -i '' "s/PORT_PLACEHOLDER/$port/g" "$dockerfile_path" 2>/dev/null || sed -i "s/PORT_PLACEHOLDER/$port/g" "$dockerfile_path"
    
    print_success "Dockerfile creado para $service"
}

# Crear Dockerfiles para todos los servicios
for service_port in $SERVICES; do
    service=$(echo $service_port | cut -d: -f1)
    port=$(echo $service_port | cut -d: -f2)
    if [ -d "services/$service" ]; then
        create_dockerfile "$service" "$port"
    fi
done

# Gateway
if [ -d "apps/gateway" ] && [ ! -f "apps/gateway/Dockerfile" ]; then
    print_info "Creando Dockerfile para gateway..."
    cat > "apps/gateway/Dockerfile" << 'EOF'
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml* ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build 2>/dev/null || npm run build 2>/dev/null || echo "No build script"

FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
EOF
    print_success "Dockerfile creado para gateway"
fi

print_section "PASO 3: Creando .dockerignore"

# Función para crear .dockerignore
create_dockerignore() {
    local dir=$1
    local dockerignore_path="$dir/.dockerignore"
    
    if [ -f "$dockerignore_path" ]; then
        print_warning ".dockerignore ya existe en $dir - omitiendo"
        return
    fi
    
    cat > "$dockerignore_path" << 'EOF'
# Dependencies
node_modules
npm-debug.log
yarn-error.log
pnpm-debug.log
.pnpm-store

# Build outputs
dist
build
.next
out

# Testing
coverage
.nyc_output
*.test.ts
*.test.js
*.spec.ts
*.spec.js
__tests__
__mocks__

# Environment
.env
.env.local
.env.*.local
.env.development
.env.test

# IDE
.vscode
.idea
*.swp
*.swo
*~
.DS_Store

# Git
.git
.gitignore
.gitattributes

# Documentation
*.md
docs
README.md

# CI/CD
.github
.gitlab-ci.yml
.travis.yml

# Docker
Dockerfile
.dockerignore
docker-compose*.yml

# Logs
logs
*.log

# Temporary files
tmp
temp
.cache

# TypeScript
*.tsbuildinfo
tsconfig.tsbuildinfo

# Misc
.editorconfig
.prettierrc
.eslintrc*
.prettierignore
EOF
    
    print_success ".dockerignore creado en $dir"
}

# Crear .dockerignore para servicios
for service_port in $SERVICES; do
    service=$(echo $service_port | cut -d: -f1)
    if [ -d "services/$service" ]; then
        create_dockerignore "services/$service"
    fi
done

# Crear .dockerignore para gateway
if [ -d "apps/gateway" ]; then
    create_dockerignore "apps/gateway"
fi

print_section "PASO 4: Verificación de configuración"

print_info "Verificando Dockerfiles..."
dockerfile_count=0
for service_port in $SERVICES; do
    service=$(echo $service_port | cut -d: -f1)
    if [ -f "services/$service/Dockerfile" ]; then
        dockerfile_count=$((dockerfile_count + 1))
        echo "  ✓ services/$service/Dockerfile"
    else
        print_error "  ✗ services/$service/Dockerfile - NO ENCONTRADO"
    fi
done

if [ -f "apps/gateway/Dockerfile" ]; then
    dockerfile_count=$((dockerfile_count + 1))
    echo "  ✓ apps/gateway/Dockerfile"
fi

print_success "Total Dockerfiles: $dockerfile_count"

print_info "Verificando .dockerignore..."
dockerignore_count=0
for service_port in $SERVICES; do
    service=$(echo $service_port | cut -d: -f1)
    if [ -f "services/$service/.dockerignore" ]; then
        dockerignore_count=$((dockerignore_count + 1))
    fi
done

if [ -f "apps/gateway/.dockerignore" ]; then
    dockerignore_count=$((dockerignore_count + 1))
fi

print_success "Total .dockerignore: $dockerignore_count"

print_info "Verificando docker-compose.dev.yml..."
if [ -f "infra/docker/docker-compose.dev.yml" ]; then
    print_success "docker-compose.dev.yml encontrado"
else
    print_error "docker-compose.dev.yml NO ENCONTRADO"
fi

print_section "RESUMEN"

echo ""
echo "Configuración Docker completada:"
echo "  • Dockerfiles creados: $dockerfile_count"
echo "  • .dockerignore creados: $dockerignore_count"
echo "  • docker-compose.dev.yml: ✓"
echo ""

print_info "Próximos pasos:"
echo "  1. Revisar los Dockerfiles generados"
echo "  2. Ejecutar: cd infra/docker && docker-compose build"
echo "  3. Ejecutar: docker-compose up -d"
echo "  4. Verificar: docker-compose ps"
echo ""

print_success "¡Setup de Docker completado!"
