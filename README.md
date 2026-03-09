# 🎭 Piums Platform

> Marketplace para contratar artistas callejeros - Plataforma completa de servicios artísticos

[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-20.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-24.x-blue.svg)](https://www.docker.com/)

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Arquitectura](#-arquitectura)
- [Tech Stack](#-tech-stack)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Ejecución](#-ejecución)
- [Deployment](#-deployment)
- [Documentación API](#-documentación-api)
- [Testing](#-testing)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Contributing](#-contributing)
- [Soporte](#-soporte)
- [License](#-license)

---

## 🎯 Descripción

Piums Platform es un marketplace completo que conecta clientes con artistas callejeros. La plataforma permite:

- 🎨 **Artistas**: Crear perfil, publicar servicios, gestionar reservas, recibir pagos
- 👥 **Clientes**: Buscar artistas, hacer reservas, pagar online, dejar reseñas
- 💼 **Administradores**: Panel de control, métricas, gestión de usuarios

### Características Principales

✨ **Autenticación robusta**: JWT + OAuth2 (Google, Facebook)  
📱 **PWA Ready**: App progresiva para móvil  
💳 **Pagos seguros**: Integración con Stripe  
📷 **Gestión de multimedia**: Cloudinary para imágenes  
💬 **Chat en tiempo real**: WebSocket para mensajería  
📊 **Dashboard analytics**: Métricas para artistas  
🔍 **Búsqueda avanzada**: Filtros múltiples y geo-localización  
⭐ **Sistema de reseñas**: Ratings y comentarios  
🔔 **Notificaciones**: Email, SMS, Push  
🌍 **Multi-idioma**: i18n configurado  
🐳 **Dockerizado**: Despliegue simplificado  
🚀 **CI/CD**: Pipelines automatizados  

---

## 🏗️ Arquitectura

### Arquitectura de Microservicios

```
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                        │
│                     (Port 3000)                         │
│              Load Balancer + Routing                    │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Auth Service │  │ Users Service│  │Artists Service│
│  (Port 4001) │  │  (Port 4002) │  │  (Port 4003)  │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Catalog Service│ │Booking Service│ │Payment Service│
│  (Port 4004)  │ │  (Port 4008)  │ │  (Port 4005)  │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│Reviews Service│ │Notifications │  │ Search Service│
│  (Port 4006)  │ │  (Port 4007)  │ │  (Port 4009)  │
└──────────────┘  └──────────────┘  └──────────────┘
        │
        ▼
┌──────────────┐
│ Chat Service │
│  (Port 4010) │
└──────────────┘

        ┌────────────────────────────┐
        │  Infrastructure Services   │
        ├────────────────────────────┤
        │  PostgreSQL (Port 5432)    │
        │  Redis (Port 6379)         │
        │  Cloudinary (External)     │
        │  Stripe (External)         │
        └────────────────────────────┘
```

### Tecnologías por Servicio

| Servicio | Puerto | Base de Datos | Integraciones |
|----------|--------|---------------|---------------|
| Gateway | 3000 | - | Todos los servicios |
| Auth | 4001 | PostgreSQL | JWT, OAuth2 |
| Users | 4002 | PostgreSQL | Cloudinary, Auth |
| Artists | 4003 | PostgreSQL | Booking, Payments |
| Catalog | 4004 | PostgreSQL | Artists |
| Payments | 4005 | PostgreSQL | Stripe, Booking |
| Reviews | 4006 | PostgreSQL | Artists, Booking |
| Notifications | 4007 | PostgreSQL | SMTP, Twilio, FCM |
| Booking | 4008 | PostgreSQL | Artists, Payments, Notifications |
| Search | 4009 | PostgreSQL | Artists, Catalog |
| Chat | 4010 | PostgreSQL | WebSocket, Users |

---

## 🛠️ Tech Stack

### Backend

- **Runtime**: Node.js 20.x
- **Framework**: Express.js
- **Language**: TypeScript 5.x
- **ORM**: Prisma
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Auth**: JWT + Passport.js
- **Validation**: Zod
- **Testing**: Jest + Supertest

### Frontend

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Forms**: React Hook Form
- **HTTP Client**: Axios
- **Testing**: Jest + React Testing Library

**Aplicaciones Web Separadas:**
- **web-client** (Port 3000): Aplicación para clientes - búsqueda de artistas, reservas, pagos
- **web-artist** (Port 3001): Dashboard para artistas - gestión de servicios, calendario, reseñas

### DevOps

- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry (ghcr.io)
- **Deployment**: Blue-Green strategy
- **Monitoring**: (Pendiente: Prometheus + Grafana)
- **Logging**: Winston

### External Services

- **Storage**: Cloudinary
- **Payments**: Stripe
- **Email**: SendGrid / SMTP
- **SMS**: Twilio
- **Push Notifications**: Firebase Cloud Messaging

---

## ✅ Requisitos Previos

### Software Requerido

- **Node.js**: 20.x o superior
- **pnpm**: 8.x o superior
- **Docker**: 24.x o superior
- **Docker Compose**: 2.20 o superior
- **Git**: 2.x o superior

### Instalación de Herramientas

```bash
# Node.js (usando nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# pnpm
npm install -g pnpm@8

# Docker (macOS)
brew install docker
brew install docker-compose

# Docker (Ubuntu)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/app-piums/piums-platform.git
cd piums-platform
```

### 2. Instalar Dependencias

```bash
# Instalar dependencias de todos los servicios
pnpm install

# O instalar por servicio
cd services/auth-service
pnpm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivos de ejemplo
cp .env.example .env
cp services/auth-service/.env.example services/auth-service/.env
# Repetir para cada servicio...

# O usar script de configuración
./scripts/setup-env.sh
```

### 4. Levantar Base de Datos

```bash
# Levantar PostgreSQL y Redis con Docker
docker-compose -f infra/docker/docker-compose.dev.yml up -d postgres redis

# Verificar que están corriendo
docker ps
```

### 5. Ejecutar Migraciones

```bash
# Migrar todas las bases de datos
pnpm run migrate

# O por servicio
cd services/auth-service
pnpm prisma migrate dev

cd services/users-service
pnpm prisma migrate dev

# ... repetir para cada servicio con Prisma
```

### 6. Seed de Datos (Opcional)

```bash
# Poblar base de datos con datos de ejemplo
pnpm run seed

# O ejecutar script
./scripts/seed.sh
```

---

## ⚙️ Configuración

### Variables de Entorno Requeridas

Cada servicio requiere su propio archivo `.env`. Ver ejemplos en `.env.example` de cada directorio.

#### Variables Globales

```env
NODE_ENV=development
LOG_LEVEL=debug

# Database
POSTGRES_USER=piums
POSTGRES_PASSWORD=your_password
POSTGRES_DB=piums
DATABASE_URL=postgresql://piums:password@localhost:5432/piums_auth

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_EXPIRES_IN=15m
REFRESH_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

#### Servicios Externos

```env
# Cloudinary (Users Service)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Stripe (Payments Service)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid (Notifications Service)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
SMTP_FROM=noreply@piums.com

# Twilio (Notifications Service)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (Push Notifications)
FCM_SERVER_KEY=your_firebase_server_key

# OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
```

---

## 🏃 Ejecución

### Modo Desarrollo

#### Opción 1: Todos los Servicios con Docker

```bash
# Levantar todos los servicios
docker-compose -f infra/docker/docker-compose.dev.yml up

# En modo detached
docker-compose -f infra/docker/docker-compose.dev.yml up -d

# Ver logs
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# Detener
docker-compose -f infra/docker/docker-compose.dev.yml down
```

#### Opción 2: Servicios Individuales (Local)

```bash
# Terminal 1: Gateway
cd apps/gateway
pnpm dev

# Terminal 2: Auth Service
cd services/auth-service
pnpm dev

# Terminal 3: Users Service
cd services/users-service
pnpm dev

# Terminal 4: Web Client (Clientes)
cd apps/web-client/web
pnpm dev

# Terminal 5: Web Artist (Artistas)
cd apps/web-artist/web
pnpm dev
```

#### Opción 3: Script de Desarrollo

```bash
# Levantar todos los servicios en paralelo
./scripts/dev.sh

# Solo backend
./scripts/dev.sh --backend-only

# Solo frontend
./scripts/dev.sh --frontend-only
```

### URLs de Desarrollo

- **Gateway**: http://localhost:3000
- **Web Client (Clientes)**: http://localhost:3000
- **Web Artist (Artistas)**: http://localhost:3001
- **API Docs**: http://localhost:3000/docs
- **Auth Service**: http://localhost:4001
- **Users Service**: http://localhost:4002

---

## 🚢 Deployment

### Arquitectura de Deployment

Piums Platform utiliza una estrategia **Blue-Green** para despliegues sin downtime.

```
Production Flow:
  develop → staging (auto) → production (manual + approval)
  
Environments:
  - Development: docker-compose.dev.yml
  - Staging: docker-compose.staging.yml (auto-deploy on push to develop)
  - Production: docker-compose.prod.yml (manual deploy with approval)
```

### Guía Completa de Deployment

Ver documentación detallada: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

### Quick Start - Deployment

#### 1. Configurar GitHub Secrets

En **Settings → Secrets and variables → Actions**:

```
POSTGRES_USER
POSTGRES_PASSWORD
REDIS_PASSWORD
JWT_SECRET
REFRESH_SECRET
STRIPE_SECRET_KEY
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
SMTP_PASS
STAGING_SERVER_HOST
STAGING_SSH_PRIVATE_KEY
PRODUCTION_SERVER_HOST
PRODUCTION_SSH_PRIVATE_KEY
```

#### 2. Deployment a Staging

```bash
# Push a develop dispara deployment automático
git checkout develop
git merge feature/your-feature
git push origin develop

# GitHub Actions ejecutará:
# 1. Build de imágenes Docker
# 2. Push a ghcr.io
# 3. Deploy a servidor staging
# 4. Health checks
# 5. Smoke tests
```

#### 3. Deployment a Production

```bash
# 1. Crear tag de release
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# 2. Crear release en GitHub
# GitHub → Releases → Draft new release

# 3. Aprobar deployment
# GitHub Actions esperará aprobación manual
# Revisar → Approve deployment

# 4. Blue-Green deployment se ejecuta automáticamente
# - Deploy a blue environment
# - Health checks
# - Switch traffic
# - Monitor 5 minutos
# - Cleanup green (versión anterior)
```

### Rollback

```bash
# Rollback automático si health checks fallan

# Rollback manual
ssh user@piums.com
cd /opt/piums
./scripts/rollback.sh

# Rollback de base de datos
./scripts/restore-db.sh 20260306_120000
```

### Monitoreo Post-Deploy

```bash
# Health check
curl https://piums.com/api/health

# Ver logs
ssh user@piums.com
docker-compose logs -f

# Métricas
docker stats
```

---

## 📚 Documentación API

### Swagger UI (Interactivo)

- **Local**: http://localhost:3000/docs
- **Staging**: https://staging.piums.com/docs
- **Production**: https://piums.com/docs

### Especificación OpenAPI

- **Archivo**: [docs/api-contracts/openapi.yaml](docs/api-contracts/openapi.yaml)
- **README**: [docs/api-contracts/README.md](docs/api-contracts/README.md)
- **Versión**: OpenAPI 3.0.3
- **Endpoints**: 85+ documentados

### Quick Reference

```bash
# Ver documentación localmente
cd docs/api-contracts
npx serve .

# Validar OpenAPI spec
swagger-cli validate docs/api-contracts/openapi.yaml

# Generar cliente TypeScript
npx @openapitools/openapi-generator-cli generate \
  -i docs/api-contracts/openapi.yaml \
  -g typescript-fetch \
  -o packages/sdk/src/generated
```

### Endpoints Principales

- **Auth**: `POST /api/auth/login`, `POST /api/auth/register`
- **Users**: `GET /api/users/me`, `PUT /api/users/me`
- **Artists**: `GET /api/artists`, `POST /api/artists`
- **Bookings**: `POST /api/bookings`, `GET /api/bookings/{id}`
- **Payments**: `POST /api/payments`, `GET /api/payments/methods`
- **Reviews**: `POST /api/reviews`, `GET /api/reviews`
- **Search**: `GET /api/search/artists?q=mago&location=Madrid`

Ver [docs/api-contracts/README.md](docs/api-contracts/README.md) para ejemplos completos.

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Tests con coverage
pnpm test:coverage

# Tests en watch mode
pnpm test:watch

# Tests de un servicio específico
cd services/auth-service
pnpm test

# Tests e2e
pnpm test:e2e

# Linting
pnpm lint

# Linting con fix
pnpm lint:fix
```

### Scripts de Testing

```bash
# Ejecutar todos los tests del monorepo
./scripts/test.sh

# Solo unit tests
./scripts/test.sh --unit

# Solo integration tests
./scripts/test.sh --integration

# Generar reporte de coverage
./scripts/test.sh --coverage
```

### Coverage Goals

- **Unit Tests**: >80%
- **Integration Tests**: >60%
- **E2E Tests**: Flujos críticos cubiertos

---

## 📁 Estructura del Proyecto

```
piums-platform/
├── apps/
│   ├── gateway/                 # API Gateway (Express)
│   ├── mobile/                  # App móvil (React Native) - Futuro
│   └── web/
│       └── web/                 # Frontend web (Next.js 14)
│
├── services/                    # Microservicios
│   ├── auth-service/            # Autenticación y autorización
│   ├── users-service/           # Gestión de usuarios
│   ├── artists-service/         # Perfiles y dashboard artistas
│   ├── catalog-service/         # Catálogo de servicios
│   ├── booking-service/         # Reservas y gestión
│   ├── payments-service/        # Procesamiento de pagos
│   ├── reviews-service/         # Reseñas y ratings
│   ├── notifications-service/   # Notificaciones multi-canal
│   ├── search-service/          # Búsqueda y filtros
│   └── chat-service/            # Mensajería en tiempo real
│
├── packages/                    # Paquetes compartidos
│   ├── sdk/                     # Cliente TypeScript generado
│   ├── shared-config/           # Configuración compartida
│   ├── shared-types/            # TypeScript types compartidos
│   ├── shared-utils/            # Utilidades compartidas
│   └── ui/                      # Componentes UI compartidos
│
├── infra/                       # Infraestructura
│   ├── docker/
│   │   ├── docker-compose.dev.yml       # Desarrollo
│   │   ├── docker-compose.staging.yml   # Staging
│   │   └── docker-compose.prod.yml      # Producción
│   ├── k8s/                     # Kubernetes (futuro)
│   ├── nginx/                   # Configuración nginx
│   └── terraform/               # IaC (futuro)
│
├── .github/
│   └── workflows/
│       ├── ci.yml               # CI pipeline
│       ├── deploy-staging.yml   # Deploy staging
│       └── deploy-prod.yml      # Deploy production
│
├── docs/                        # Documentación
│   ├── api-contracts/
│   │   ├── openapi.yaml         # OpenAPI 3.0 spec
│   │   ├── index.html           # Swagger UI
│   │   └── README.md            # Guía API
│   ├── DEPLOYMENT.md            # Guía de deployment
│   └── architecture/
│       ├── decisions/           # ADRs
│       └── diagrams/            # Diagramas
│
├── scripts/                     # Scripts de utilidad
│   ├── dev.sh                   # Iniciar desarrollo
│   ├── lint.sh                  # Linting
│   ├── seed.sh                  # Seed databases
│   └── test.sh                  # Ejecutar tests
│
├── .env.staging.example         # Template staging
├── .env.production.example      # Template production
├── pnpm-workspace.yaml          # Configuración workspace
├── package.json                 # Root package.json
└── README.md                    # Este archivo
```

---

## 🤝 Contributing

### Workflow de Desarrollo

1. **Fork** el repositorio
2. **Crear rama** desde `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature
   ```
3. **Hacer cambios** y commitear:
   ```bash
   git add .
   git commit -m "feat(service): add new feature"
   ```
4. **Push** a tu fork:
   ```bash
   git push origin feature/your-feature
   ```
5. **Crear Pull Request** a `develop`

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
style(scope): format code
refactor(scope): refactor code
test(scope): add tests
chore(scope): update dependencies
```

Ejemplos:
```bash
git commit -m "feat(auth): add OAuth2 Google integration"
git commit -m "fix(booking): resolve reschedule validation"
git commit -m "docs(api): update OpenAPI spec"
```

### Code Style

- **TypeScript**: ESLint + Prettier
- **Naming**: camelCase para variables, PascalCase para componentes
- **Tests**: Archivo por cada módulo (.spec.ts)
- **Commits**: Conventional Commits
- **PRs**: Template con checklist

### Pull Request Checklist

- [ ] Tests añadidos/actualizados
- [ ] Documentación actualizada
- [ ] Linting pasado (`pnpm lint`)
- [ ] Tests pasados (`pnpm test`)
- [ ] Branch actualizada con `develop`
- [ ] Descripción clara del cambio
- [ ] Screenshots si hay cambios UI

---

## 📞 Soporte

### Canales de Soporte

- **GitHub Issues**: [Issues](https://github.com/app-piums/piums-platform/issues)
- **Email**: support@piums.com
- **Slack**: #piums-dev (interno)
- **Documentación**: [docs/](docs/)

### Reportar Bugs

Al reportar un bug, incluye:

1. **Descripción** del problema
2. **Pasos para reproducir**
3. **Comportamiento esperado** vs actual
4. **Screenshots** si aplica
5. **Entorno** (OS, Node version, browser)
6. **Logs** relevantes

### Solicitar Features

Para nuevas funcionalidades:

1. Verifica que no exista ya en [Issues](https://github.com/app-piums/piums-platform/issues)
2. Describe el **problema** que resuelve
3. Propón una **solución**
4. Indica **alternativas** consideradas

---

## 📄 License

Copyright © 2026 Piums Platform. All rights reserved.

Este proyecto es de código propietario. No está permitido usar, copiar, modificar o distribuir sin autorización explícita.

Para licencias comerciales, contactar: legal@piums.com

---

## 🙏 Agradecimientos

- **Equipo de Desarrollo**: Por el increíble trabajo
- **Comunidad Open Source**: Por las herramientas increíbles
- **Artistas Callejeros**: Por inspirar esta plataforma

---

## 📊 Métricas del Proyecto

- **Microservicios**: 10
- **Endpoints API**: 85+
- **Schemas de Base de Datos**: 15+
- **Líneas de Código**: 50,000+
- **Tests**: 200+
- **Coverage**: 75%+

---

## 🗺️ Roadmap

### Q1 2026 ✅
- [x] MVP Backend (10 microservicios)
- [x] Frontend web básico
- [x] Autenticación + OAuth2
- [x] Sistema de pagos (Stripe)
- [x] Reservas y gestión
- [x] Documentación API (OpenAPI)
- [x] CI/CD pipelines
- [x] Docker + deployment

### Q2 2026 🚧
- [ ] App móvil (React Native)
- [ ] Chat en tiempo real (WebSocket)
- [ ] Notificaciones push
- [ ] Panel de administración
- [ ] Analytics y métricas
- [ ] Sistema de pagos a artistas
- [ ] Geolocalización avanzada

### Q3 2026 📋
- [ ] Kubernetes deployment
- [ ] Monitoring (Prometheus + Grafana)
- [ ] CDN para assets
- [ ] Sistema de cupones/descuentos
- [ ] Programa de afiliados
- [ ] Multi-tenancy
- [ ] API pública para terceros

### Q4 2026 🔮
- [ ] Machine Learning (recomendaciones)
- [ ] Videollamadas para consultas
- [ ] Marketplace de productos
- [ ] Sistema de badges y gamificación
- [ ] Internacionalización completa

---

<div align="center">

**Hecho con ❤️ por el equipo de Piums**

[Website](https://piums.com) • [API Docs](https://piums.com/docs) • [Blog](https://blog.piums.com)

</div>
