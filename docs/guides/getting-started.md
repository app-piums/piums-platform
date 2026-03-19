# Getting Started — Piums Platform

Guía para configurar el entorno de desarrollo local.

## Pre-requisitos

| Herramienta | Versión mínima | Instalación |
|-------------|---------------|-------------|
| Node.js | 20.x | https://nodejs.org |
| pnpm | 8.x | `npm i -g pnpm` |
| Docker | 24.x | https://www.docker.com |
| Docker Compose | v2 | Incluido con Docker Desktop |
| Git | 2.x | https://git-scm.com |

## Clonar el repositorio

```bash
git clone https://github.com/app-piums/piums-platform.git
cd piums-platform
```

## Configurar variables de entorno

Cada servicio tiene su propio archivo `.env`. Copia los ejemplos:

```bash
# Gateway
cp apps/gateway/.env.example apps/gateway/.env

# Servicios
for svc in auth users artists catalog payments reviews notifications booking search chat; do
  cp services/${svc}-service/.env.example services/${svc}-service/.env
done

# Frontend
cp apps/web-client/.env.example apps/web-client/.env.local
cp apps/web-artist/.env.example apps/web-artist/.env.local
```

Variables mínimas para dev local (configuradas automáticamente por `dev.sh`):
- `DATABASE_URL` — PostgreSQL (postgres://piums:piums_dev_password@localhost:5432/piums_dev)
- `REDIS_URL` — Redis (redis://localhost:6379)
- `JWT_SECRET` — Cualquier string ≥32 chars
- `NODE_ENV` — `development`

## Opción A: Con Docker (recomendada)

Levanta todo el stack con un comando:

```bash
./scripts/dev.sh setup   # Primera vez: instala deps + configura .env
./scripts/dev.sh start   # Levanta todos los servicios
```

Servicios disponibles:
| Servicio | URL |
|----------|-----|
| API Gateway | http://localhost:3000 |
| web-client | http://localhost:3001 |
| web-artist | http://localhost:3002 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## Opción B: Local (sin Docker)

```bash
# 1. Instalar dependencias
pnpm install

# 2. Levantar infraestructura (solo DB + Redis en Docker)
./scripts/dev.sh start-local

# 3. Ejecutar migraciones
./scripts/migrate.sh

# 4. Cargar datos de prueba
./scripts/seed.sh

# 5. Iniciar servicios
pnpm dev
```

## Estructura del monorepo

```
piums-platform/
├── apps/
│   ├── gateway/           # API Gateway (Express + http-proxy-middleware)
│   ├── web-client/        # App cliente (Next.js 14)
│   └── web-artist/        # Dashboard artista (Next.js 14)
├── services/
│   ├── auth-service/      # JWT + Google OAuth (port 4001)
│   ├── users-service/     # Perfiles de usuario (port 4002)
│   ├── artists-service/   # Perfiles de artistas (port 4003)
│   ├── catalog-service/   # Categorías y servicios (port 4004)
│   ├── payments-service/  # Stripe + GTQ (port 4005)
│   ├── reviews-service/   # Reseñas y ratings (port 4006)
│   ├── notifications-service/ # Push + Email (port 4007)
│   ├── booking-service/   # Reservas (port 4008)
│   ├── search-service/    # Búsqueda (port 4009)
│   └── chat-service/      # Socket.io (port 4010)
├── packages/
│   ├── shared-types/      # @piums/shared-types
│   ├── shared-utils/      # @piums/shared-utils
│   ├── shared-config/     # @piums/shared-config
│   ├── ui/                # @piums/ui (componentes React)
│   └── sdk/               # @piums/sdk (cliente frontend)
├── infra/
│   ├── docker/            # Docker Compose (dev/staging/prod)
│   ├── k8s/               # Kubernetes (Kustomize)
│   └── terraform/         # IaC (AWS)
└── scripts/               # Scripts de automatización
```

## Comandos frecuentes

```bash
# Desarrollo
./scripts/dev.sh start        # Levantar stack completo
./scripts/dev.sh stop         # Detener servicios
./scripts/dev.sh logs         # Ver logs en tiempo real
./scripts/dev.sh restart      # Reiniciar todos
./scripts/dev.sh status       # Estado de contenedores

# Base de datos
./scripts/migrate.sh          # Ejecutar migraciones Prisma
./scripts/seed.sh             # Cargar datos de prueba

# Calidad de código
./scripts/lint.sh             # ESLint + type-check
./scripts/build.sh            # Compilar todos los servicios
./scripts/test.sh             # Ejecutar tests

# Limpieza
./scripts/clean.sh            # Limpiar build artifacts
./scripts/dev.sh clean        # Limpiar volumes Docker
```

## Credenciales de desarrollo

Tras ejecutar `./scripts/seed.sh`:

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Admin | admin@piums.app | Admin123! | ADMIN |
| Cliente | cliente@test.com | Test123! | CLIENT |
| Artista 1 | artista1@test.com | Test123! | ARTIST |

## Solución de problemas

Ver [docs/guides/troubleshooting.md](troubleshooting.md) para problemas comunes.
