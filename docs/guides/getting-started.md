# Getting Started — Piums Platform

Guía paso a paso para configurar el entorno de desarrollo local desde cero.

---

## Requisitos previos

Asegúrate de tener instalado:

| Herramienta | Versión mínima | Instalación |
|-------------|----------------|-------------|
| Node.js | ≥ 20.x | https://nodejs.org |
| pnpm | ≥ 8.x | `npm install -g pnpm` |
| Docker Desktop | ≥ 24.x | https://www.docker.com/products/docker-desktop |
| Docker Compose | v2 (incluido con Docker Desktop) | — |
| Git | ≥ 2.x | https://git-scm.com |

> **Verificar versiones:**
> ```bash
> node --version    # v20.x o superior
> pnpm --version    # 8.x o superior
> docker --version  # 24.x o superior
> ```

---

## Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/app-piums/piums-platform.git
cd piums-platform
```

---

## Paso 2 — Instalar dependencias

Desde la raíz del monorepo:

```bash
pnpm install
```

Esto instala las dependencias de todos los workspaces (servicios, apps y packages) en un solo paso.

---

## Paso 3 — Configurar variables de entorno

Cada servicio tiene su propio `.env.example`. Cópialos antes de arrancar:

```bash
# Servicios backend
for svc in auth users artists catalog payments reviews notifications booking search; do
  cp services/${svc}-service/.env.example services/${svc}-service/.env
done

# Frontends
cp apps/web-client/web/.env.example  apps/web-client/web/.env.local
cp apps/web-artist/web/.env.example  apps/web-artist/web/.env.local
cp apps/web-admin/web/.env.example   apps/web-admin/web/.env.local
```

Variables **mínimas** requeridas en cada servicio para dev local:

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `DATABASE_URL` | `postgresql://piums:piums_dev_password@localhost:5432/<db>` | Conexión a PostgreSQL |
| `REDIS_URL` | `redis://localhost:6379` | Conexión a Redis |
| `JWT_SECRET` | *(cualquier string ≥ 32 chars)* | Secreto para firmar tokens |
| `NODE_ENV` | `development` | Entorno de ejecución |
| `PORT` | *(ver tabla de puertos)* | Puerto del servicio |

> Los valores de desarrollo están pregenerados en cada `.env.example`. Solo necesitas editarlos si usas credenciales propias (Stripe, Cloudinary, SendGrid, etc.).

---

## Paso 4A — Arrancar con Docker (recomendado)

El script `dev.sh` gestiona todo el ciclo de vida del stack:

```bash
# Primera vez: setup completo (migra BD, genera Prisma Client, etc.)
./scripts/dev.sh setup

# Arrancar todos los servicios
./scripts/dev.sh start

# Verificar que todo está en marcha
./scripts/dev.sh health
```

> **`setup` solo es necesario la primera vez** o cuando añades un nuevo servicio.  
> En ejecuciones posteriores basta con `./scripts/dev.sh start`.

---

## Paso 4B — Arrancar en local (sin Docker, avanzado)

Si prefieres ejecutar los servicios Node directamente en tu máquina:

```bash
# 1. Instalar dependencias (si no lo hiciste ya)
pnpm install

# 2. Levantar solo la infraestructura (PostgreSQL + Redis) en Docker
./scripts/dev.sh start-local

# 3. Generar Prisma Client en cada servicio
for svc in auth users artists catalog payments reviews notifications booking search; do
  pnpm --filter ${svc}-service exec prisma generate
done

# 4. Ejecutar migraciones
./scripts/migrate.sh

# 5. Cargar datos de prueba
./scripts/seed.sh

# 6. Iniciar todos los servicios en modo desarrollo
pnpm dev
```

---

## URLs una vez levantado el stack

| Componente | URL | Descripción |
|------------|-----|-------------|
| **API Gateway** | http://localhost:3000 | Punto de entrada único, enruta al microservicio correspondiente |
| **web-client** | http://localhost:3001 | App para clientes (Next.js) |
| **web-artist** | http://localhost:3002 | Dashboard para artistas (Next.js) |
| **web-admin** | http://localhost:3003 | Panel de administración (Next.js) |
| PostgreSQL | localhost:5432 | Usuario: `piums` / Contraseña: `piums_dev_password` |
| Redis | localhost:6379 | Sin autenticación en dev |

### Puertos de los microservicios

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| auth-service | 4001 | Autenticación JWT + OAuth |
| users-service | 4002 | Perfiles de usuario |
| artists-service | 4003 | Perfiles de artistas |
| catalog-service | 4004 | Servicios artísticos y categorías |
| payments-service | 4005 | Pagos con Stripe |
| reviews-service | 4006 | Reseñas y ratings |
| notifications-service | 4007 | Email y notificaciones push |
| booking-service | 4008 | Gestión de reservas |
| search-service | 4009 | Motor de búsqueda |

> En desarrollo los microservicios se acceden normalmente **sólo a través del Gateway** (`:3000`). Los puertos directos son útiles para debugging.

---

## Estructura del monorepo

```
piums-platform/
├── apps/
│   ├── gateway/               # API Gateway (Express, puerto 3000)
│   ├── web-client/web/        # App clientes (Next.js, puerto 3001)
│   ├── web-artist/web/        # Dashboard artistas (Next.js, puerto 3002)
│   └── web-admin/web/         # Panel admin (Next.js, puerto 3003)
├── services/
│   ├── auth-service/          # JWT + OAuth2 (puerto 4001)
│   ├── users-service/         # Perfiles (puerto 4002)
│   ├── artists-service/       # Artistas (puerto 4003)
│   ├── catalog-service/       # Catálogo de servicios (puerto 4004)
│   ├── payments-service/      # Stripe (puerto 4005)
│   ├── reviews-service/       # Reseñas (puerto 4006)
│   ├── notifications-service/ # Notificaciones (puerto 4007)
│   ├── booking-service/       # Reservas (puerto 4008)
│   └── search-service/        # Búsqueda (puerto 4009)
├── packages/
│   ├── shared-types/          # @piums/shared-types
│   ├── shared-utils/          # @piums/shared-utils
│   ├── shared-config/         # @piums/shared-config
│   ├── ui/                    # @piums/ui (componentes React)
│   └── sdk/                   # @piums/sdk (cliente HTTP frontend)
├── infra/
│   ├── docker/                # docker-compose.dev/staging/prod.yml
│   ├── k8s/                   # Kubernetes (Kustomize)
│   └── terraform/             # IaC (AWS)
└── scripts/                   # Scripts de automatización
```

---

## Comandos frecuentes

### Ciclo de vida del stack (Docker)

```bash
./scripts/dev.sh setup        # Setup inicial (primera vez)
./scripts/dev.sh start        # Arrancar todo el stack
./scripts/dev.sh stop         # Detener los servicios
./scripts/dev.sh restart      # Reiniciar todo
./scripts/dev.sh status       # Estado de los contenedores
./scripts/dev.sh health       # Health check de endpoints
./scripts/dev.sh logs         # Logs en tiempo real (todos los servicios)
./scripts/dev.sh clean        # Limpieza completa (volúmenes + node_modules)
```

### Base de datos

```bash
./scripts/migrate.sh          # Aplicar migraciones Prisma en todos los servicios
./scripts/seed.sh             # Cargar datos de prueba

# Regenerar Prisma Client tras cambiar un schema
pnpm --filter <nombre-servicio> exec prisma generate
# Ejemplo:
pnpm --filter auth-service exec prisma generate
```

### Calidad de código y build

```bash
./scripts/lint.sh             # ESLint + TypeScript type-check
./scripts/build.sh            # Compilar todos los servicios (tsc)
./scripts/test.sh             # Ejecutar tests

# Compilar un solo servicio
pnpm --filter <nombre-servicio> build
# Ejemplo:
pnpm --filter payments-service build
```

### Logs de un servicio específico (Docker)

```bash
docker logs -f piums-auth-service
docker logs -f piums-booking-service
# Patrón: piums-<nombre-servicio>
```

---

## Credenciales de desarrollo

Disponibles tras ejecutar `./scripts/seed.sh`:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@piums.com | Admin1234! |
| Cliente | cliente@piums.com | Test1234! |
| Artista | artista@piums.com | Test1234! |

---

## Solución de problemas

Para los problemas más comunes consulta [troubleshooting.md](troubleshooting.md).

Comprobaciones rápidas:

```bash
# ¿Están todos los contenedores corriendo?
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# ¿Responde el gateway?
curl http://localhost:3000/api/health

# ¿Responde un servicio directamente?
curl http://localhost:4001/health

# ¿Hay errores en un servicio?
docker logs --tail 50 piums-auth-service
```
