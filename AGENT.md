# AGENT.MD — Contexto Completo PIUMS Platform

**Fecha de última actualización**: 8 de abril de 2026
**Último commit**: `dave` branch — fix: resize search bar and shrink count text in buscar-artistas (`f623985`)
**Branch activo**: `dave`
**Repo**: `github.com:app-piums/piums-platform.git`
**Credenciales de prueba**: `artista@piums.com` / `Test1234!`

---

## 1. ¿Qué es PIUMS?

PIUMS es un **marketplace de la Economía Naranja** — una plataforma para contratar artistas creativos (músicos, fotógrafos, diseñadores, DJs, videógrafos, etc.) y gestionar todo el ciclo de vida de una reserva: descubrimiento → cotización → pago → ejecución → reseña.

Opera bajo la **moneda GTQ (Quetzal guatemalteco)**. Locale: `es-GT`. Símbolo: `Q`.

---

## 2. Arquitectura General

```
┌──────────────────────────────────────────────────────────────────┐
│                        MONOREPO (pnpm workspaces)                │
│                                                                  │
│  apps/                   packages/           services/           │
│  ├─ gateway/             ├─ sdk/             ├─ auth-service     │
│  ├─ web-artist/web/      ├─ ui/              ├─ users-service    │
│  ├─ web-client/web/      ├─ shared-types/    ├─ artists-service  │
│  └─ mobile/              ├─ shared-utils/    ├─ catalog-service  │
│                          └─ shared-config/   ├─ booking-service  │
│                                              ├─ payments-service │
│                                              ├─ reviews-service  │
│                                              ├─ notifications-svc│
│                                              ├─ search-service   │
│                                              └─ chat-service     │
└──────────────────────────────────────────────────────────────────┘
```

### Stack Técnico
- **Backend**: Node.js + TypeScript + Express + Prisma ORM
- **Base de datos**: PostgreSQL 16 (una DB por servicio, prefijo `piums_*`)
- **Cache/Queues**: Redis 7
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Auth**: JWT + cookies HTTP-only + Passport.js (Google, Facebook OAuth) + TikTok OAuth 2.0 PKCE (implementado)
- **Pagos**: Stripe (PaymentIntents + Connect para payouts a artistas)
- **Monorepo**: pnpm workspaces
- **Infra**: Docker Compose (dev) + VPS con Docker Compose (prod backend) + Vercel (prod frontend) + Nginx + Terraform

---

## 3. Puertos y Servicios

| Servicio | Puerto | Base de datos |
|---|---|---|
| API Gateway | 3000 | — |
| auth-service | 4001 | piums_auth |
| users-service | 4002 | piums_users |
| artists-service | 4003 | piums_artists |
| catalog-service | 4004 | piums_catalog |
| payments-service | 4005 | piums_payments |
| reviews-service | 4006 | piums_reviews |
| notifications-service | 4007 | piums_notifications |
| booking-service | 4008 | piums_bookings |
| search-service | 4009 | piums_search |
| web-client | 3002 | — |
| web-artist | 3001 | — |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |

Punto de entrada único: `http://localhost:3000` (API Gateway)

---

## 4. Frontends en Detalle

### 4.1 web-artist (`/apps/web-artist/web`) — Puerto 3001

App para **artistas registrados**. Requiere autenticación. La cookie `onboarding_completed=true` controla si el artista ha terminado el onboarding.

**Rutas:**
```
/                          → Redirect a /artist/dashboard o /login
/login                     → Login de artista
/register/artist           → Registro de artista nuevo → redirige a /artist/onboarding
/auth/callback             → Callback OAuth (Google/Facebook)
/chat                      → Mensajería (mock data, integración pendiente)
/artist/onboarding         → Wizard de 4 pasos (bienvenida, disciplina, portfolio, servicio)
                             Botón "Omitir" disponible en header y último paso
/artist/dashboard          → Dashboard principal con stats, próxima reserva, gráfico de ingresos
/artist/dashboard/bookings → Lista de reservas con filtros por estado (PENDING/CONFIRMED/etc.)
/artist/dashboard/calendar → Vista de calendario de disponibilidad
/artist/dashboard/services → CRUD completo de servicios del catálogo
/artist/dashboard/reviews  → Reseñas recibidas
/artist/dashboard/settings → Configuración con 5 pestañas:
                               - personal: nombre, email, ciudad, bio, experiencia
                               - coverage: radio cobertura (1-200km), tarifas, depósito
                               - profile: perfil público, avatar, cover photo
                               - notifications: toggles por categoría
                               - payments: Stripe Connect (placeholder)
```

**Componentes clave:**
- `DashboardSidebar.tsx` — Navegación: Inicio, Reservas, Mensajes, Agenda, Servicios | Billetera, Facturas | Configuración
- `StatsCards.tsx` — Ingresos Totales, Pagos Pendientes, Vistas del Perfil (con `Q` prefix, locale `es-GT`)
- `BookingCard.tsx` — Tarjeta de reserva con estado y precio
- `CalendarPicker.tsx` — Selector de fecha/hora con slots disponibles
- `BookingTimeline.tsx` — Timeline de eventos del dashboard
- `PricingBreakdown.tsx` — Desglose de precios con `Intl.NumberFormat('es-GT', { currency: 'GTQ' })`
- `SearchBar.tsx` — Búsqueda con sugerencias

**Middleware** (`middleware.ts`):
- Si no autenticado → `/login`
- Si autenticado pero `onboarding_completed` no es `true` → `/artist/onboarding`
- Si ya onboarding completo e intenta ir a `/artist/onboarding` → `/artist/dashboard`

---

### 4.2 web-client (`/apps/web-client/web`) — Puerto 3002

App para **clientes** que contratan artistas.

**Rutas:**
```
/                          → Landing page con hero, artistas destacados, CTA
/login                     → Login de cliente
/register                  → Registro de cliente → redirige a /onboarding
/onboarding                → Wizard 3 pasos: bienvenida, intereses (categorías), refinamiento (tags)
                             "Omitir" disponible en paso 1 y paso 3 (paso 2 ya lo tenía)
/artists                   → Lista/búsqueda de artistas con filtros
/artists/[id]              → Perfil público del artista (servicios, reviews, disponibilidad)
/booking                   → Flujo de booking: selección servicio → fecha → confirmación
/booking/checkout          → Pago con Stripe (formulario de tarjeta)
/booking/confirmation/[id] → Confirmación y detalles de la reserva
/bookings                  → Mis reservas como cliente
/dashboard                 → Panel del cliente (stats, bookings recientes)
/search                    → Búsqueda avanzada con filtros
/services                  → Catálogo de servicios
/chat                      → Mensajería con artistas
/profile                   → Mi perfil
/profile/personal          → Editar datos personales
/profile/notifications     → Preferencias de notificaciones
/profile/payments          → Métodos de pago
/profile/security          → Contraseña y 2FA
/profile/delete            → Eliminar cuenta
/bookmarks                 → Artistas guardados/favoritos
/auth                      → Callback OAuth
```

**Componentes clave:**
- `Navbar.tsx` — Navegación principal con búsqueda
- `SearchBar.tsx` — Barra de búsqueda con sugerencias (artistas, servicios, categorías)
- `ArtistCard.tsx`, `Filters.tsx`, `Pagination.tsx` — Listado de artistas
- `booking/PricingBreakdown.tsx` — Desglose con GTQ
- `booking/BookingCard.tsx` — Tarjeta de reserva
- `bookings/BookingStatusTimeline.tsx` — Timeline de estados
- `bookings/ModifyDateModal.tsx` — Modificar fecha de reserva
- `chat/ConversationList.tsx`, `MessageBubble.tsx` — Mensajería
- `admin/` — Panel de administración

---

## 5. SDK (`/packages/sdk/src/index.ts`)

Clase `PiumsSDK` que encapsula todas las llamadas HTTP a la API. Usada por ambos frontends.

```typescript
const sdk = new PiumsSDK(); // baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api'
```

Usa `credentials: 'include'` para enviar cookies automáticamente.

**Métodos disponibles:**

| Grupo | Métodos |
|---|---|
| **Artistas (público)** | `searchArtists()`, `getArtists(params)`, `getArtist(id)`, `getArtistReviews()`, `getArtistRating()` |
| **Disponibilidad** | `getCalendar()`, `getTimeSlots()`, `checkAvailability()` |
| **Servicios/Catálogo** | `getArtistServices()`, `getServiceCategories()`, `createService()`, `updateService()`, `deleteService()`, `toggleServiceStatus()` |
| **Reservas (cliente)** | `createBooking()`, `getBooking()`, `listBookings()`, `cancelBooking()`, `updateBookingDate()` |
| **Reservas (artista)** | `getArtistBookings()`, `acceptBooking()`, `declineBooking()` |
| **Pagos** | `createPaymentIntent()`, `confirmPayment()`, `getPaymentById()`, `refundPayment()`, `getRefundById()` |
| **Reseñas** | `createReview()`, `listReviews()`, `getReviewById()`, `updateReview()`, `deleteReview()`, `markHelpful()`, `reportReview()`, `respondToReview()` |
| **Dashboard artista** | `getArtistProfile()`, `updateArtistProfile()`, `getArtistStats()` |
| **Chat** | `getConversations()`, `getConversation()`, `createConversation()`, `getMessages()`, `sendMessage()`, `markMessageAsRead()`, `markConversationAsRead()`, `getUnreadCount()` |
| **Admin** | `getAdminStats()`, `getAdminUsers()`, `getAdminUserDetail()`, `toggleBlockUser()`, `getAdminArtists()`, `verifyArtist()`, `getAdminBookings()`, `getAdminReports()`, `resolveReport()` |

**Tipos principales:** `Artist`, `ArtistProfile`, `Service`, `CreateServicePayload`, `UpdateServicePayload`, `ServiceCategory`, `Booking`, `CreateBookingPayload`, `Payment`, `PaymentIntent`, `Review`, `Conversation`, `Message`

**`GetArtistsParams`**: `{ page?, limit?, category?, city?, q? }` — `category` acepta enum `MUSICO | FOTOGRAFO | DJ | TATUADOR | MAQUILLADOR | PINTOR | ESCULTOR | OTRO`; `city` es nombre de región (string, no ID); `q` es texto libre para búsqueda por nombre.

---

## 6. Microservicios en Detalle

### auth-service (4001) — `piums_auth`
- JWT + Refresh tokens + Sessions
- **Duración de tokens**: access token **15 minutos** (`JWT_EXPIRY=15m`), refresh token **7 días** (`JWT_REFRESH_EXPIRY=7d`), OAuth tokens **7 días**
- Reset de contraseña: **1 hora** | Verificación de email: **24 horas**
- OAuth2: Google, Facebook (Passport.js)
- 2FA ready (campos en schema)
- Bloqueo por intentos fallidos (`failedLoginAttempts`, `lockedUntil`)
- Admin controller para gestión de usuarios
- **Schema** (`prisma/schema.prisma`): `User`, `Session`, `RefreshToken`, `PasswordReset`, `EmailVerification`, `AuditLog`

### users-service (4002) — `piums_users`
- Perfil de usuario (nombre, avatar, contacto)
- `Profile` model para perfiles públicos consolidados
- Soft delete de cuentas

### artists-service (4003) — `piums_artists`
- CRUD de artista + perfil público
- Dashboard del artista (stats, bookings, earnings)
- Disponibilidad y calendario
- Campos de cobertura: `coverageRadius`, `hourlyRateMin`, `hourlyRateMax`, `requiresDeposit`, `depositPercentage`
- Integra con payments-service para estadísticas de earnings
- **Schema**: `Artist`, `ArtistAvailability`, `BlockedDate`
- `searchArtists()`: acepta `q` (búsqueda full-text por nombre, case-insensitive), `category` (enum), `city` (string), `minRating`, geo params
- `searchArtistsSchema`: campo `q: z.string().optional()` para búsqueda full-text

### catalog-service (4004) — `piums_catalog`
- CRUD de servicios del artista
- Sistema de categorías jerárquico (`ServiceCategory`)
- Pricing avanzado: `ServicePricing` (FIXED / BASE_PLUS_HOURLY / PACKAGE), `ServiceAddons`, `ServiceTravelRules`
- Ciudades y zonas geográficas: `Country`, `State`, `City`
- Media assets polimórficos: `MediaAsset` (IMAGE, VIDEO, AUDIO, DOCUMENT)
- Moneda por defecto: `GTQ`

### booking-service (4008) — `piums_bookings`
- Ciclo de vida de reservas: PENDING → CONFIRMED → COMPLETED / CANCELLED
- Códigos únicos legibles: formato `PIU-YYYY-NNNNNN` (ej. `PIU-2026-000123`)
- Quote snapshot: JSON inmutable con breakdown de precios al momento de crear
- `BookingItems`: líneas de detalle (BASE, ADDON, TRAVEL, DISCOUNT)
- Sistema de disputas: `Dispute`, `DisputeMessage` con 8 tipos y múltiples resoluciones
- Integra con catalog-service para pricing y con payments-service para cobros
- Moneda: `GTQ`

### payments-service (4005) — `piums_payments`
- Stripe PaymentIntents
- Sistema de payouts a artistas vía Stripe Connect
- Fee de plataforma: 15%
- `Payout` con estados: PENDING → SCHEDULED → PROCESSING → IN_TRANSIT → COMPLETED / FAILED
- 4 tipos: BOOKING_PAYMENT, MANUAL, ADJUSTMENT, BONUS, REFUND_REVERSAL
- Reembolsos (`Refund`)
- Moneda por defecto: `GTQ`

### reviews-service (4006) — `piums_reviews`
- Reseñas con rating 1-5
- Respuesta del artista
- Reportar reseña
- Marcar como útil
- Rating agregado por artista

### notifications-service (4007) — `piums_notifications`
- Notificaciones de booking (nueva reserva, confirmación, cancelación)
- Notificaciones de pago (pago recibido, payout procesado)
- Templates de email con formato GTQ (`es-GT`)
- Preferencias de notificación por usuario

### search-service (4009) — `piums_search`
- Búsqueda full-text de artistas y servicios
- Filtros por categoría, ciudad, precio, rating
- Indexación de artistas activos

### chat-service — (sin puerto dedicado aún, usa booking-service internamente)
- Conversaciones entre clientes y artistas
- Mensajes con estado de lectura
- Integrable con WebSocket (pendiente)

---

## 7. Flujo Principal: Booking

```
Cliente busca artista
      ↓
/artists → /artists/[id] (ver perfil, servicios, disponibilidad)
      ↓
/booking (seleccionar servicio + fecha + hora)
    - checkAvailability() → booking-service
    - getTimeSlots() → artists-service
      ↓
/booking/checkout
    - createPaymentIntent() → payments-service → Stripe
    - confirmPayment() → Stripe webhook → booking CONFIRMED
      ↓
/booking/confirmation/[id]
    - Código de reserva PIU-YYYY-NNNNNN
    - Quote snapshot guardado
      ↓
Artista recibe notificación → acepta/rechaza
      ↓
Servicio ejecutado → cliente deja review
      ↓
Payout al artista (Stripe Connect, 15% fee plataforma)
```

---

## 8. Sistema de Pricing

El precio de un servicio se calcula así:

```
Precio Final = Precio Base (FIXED | BASE_PLUS_HOURLY | PACKAGE)
             + Addons seleccionados (obligatorios + opcionales)
             + Costo de viaje (km que exceden el radio gratuito × precio/km)
             - Descuentos (códigos promo, futuro)
```

Todo en **centavos GTQ** internamente. Mostrado con `Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })`.

El artista puede configurar en Settings > Cobertura:
- `coverageRadius`: km incluidos sin costo (1-200km, con presets: 5, 10, 20, 30, 50, 75, 100)
- `hourlyRateMin` / `hourlyRateMax`: rango de tarifas por hora
- `requiresDeposit` + `depositPercentage`: si requiere depósito y qué porcentaje

---

## 9. Onboarding

### Artista (`/artist/onboarding`) — 4 pasos (email) / 5 pasos (OAuth):
1. **Bienvenida** — presentación de PIUMS, botón "Crear Mi Perfil"
2. **Disciplina creativa** — selección de especialidad (10 opciones: músico, fotógrafo, etc.)
3. **Identidad** *(solo OAuth: Google/Facebook/TikTok)* — tipo doc, número, upload frente/reverso/selfie, PATCH a `/api/auth/profile`
4. **Portfolio & Perfil** — foto de perfil, bio, URLs de redes/portfolio
5. **Configurar Servicio** — primer servicio: nombre, categoría, precio, disponibilidad

Detección OAuth: `sessionStorage.getItem('auth_provider')` ∈ `['google','facebook','tiktok']`.

Al completar/omitir: cookie `onboarding_completed=true; max-age=31536000` → redirect a `/artist/dashboard`.

Botón **"Omitir"** disponible en header (pasos 1-3) y debajo del botón "Finalizar" (último paso).

### Cliente (`/onboarding`) — 3 pasos:
1. **Bienvenida** — hero con CTA "Comenzar" y "Omitir"
2. **Intereses** — 6 categorías (Fotografía, Diseño Gráfico, Música, Performance, Arte Digital, Video) con "Omitir por ahora"
3. **Refinamiento** — sub-tags por categoría + "Omitir por ahora"

Al finalizar: `localStorage.setItem('piums_onboarding_done', '1')` → redirect a `/dashboard`.

---

## 10. Modelo de Datos Completo (Resumen)

| Servicio | Modelos Prisma principales |
|---|---|
| auth | User, Session, RefreshToken, PasswordReset, EmailVerification, AuditLog |
| users | User, Profile (ProfileType: CLIENT/ARTIST/ADMIN) |
| artists | Artist, ArtistAvailability, BlockedDate |
| catalog | Service, ServiceCategory, ServicePricing, ServiceAddon, ServiceTravelRules, Country, State, City, MediaAsset |
| booking | Booking, BookingItem, Dispute, DisputeMessage |
| payments | Payment, PaymentIntent, Refund, Payout |
| reviews | Review, ReviewResponse, ReviewReport |
| notifications | Notification, NotificationPreference |
| search | SearchIndex (artistas + servicios indexados) |

Todos los schemas tienen `@default("GTQ")` para el campo `currency`.

---

## 11. Infraestructura

### Estrategia de Despliegue

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND  →  Vercel                                            │
│  ├─ web-client  →  piums.com          (Next.js)                 │
│  ├─ web-artist  →  artist.piums.com   (Next.js)                 │
│  └─ web-admin   →  admin.piums.com    (Next.js)                 │
├─────────────────────────────────────────────────────────────────┤
│  BACKEND   →  VPS (Ubuntu 22.04, Docker Compose + Nginx)        │
│  ├─ API Gateway       :3000  →  api.piums.com                   │
│  ├─ auth-service      :4001                                     │
│  ├─ users-service     :4002                                     │
│  ├─ artists-service   :4003                                     │
│  ├─ catalog-service   :4004                                     │
│  ├─ payments-service  :4005                                     │
│  ├─ reviews-service   :4006                                     │
│  ├─ notifications     :4007                                     │
│  ├─ booking-service   :4008                                     │
│  ├─ search-service    :4009                                     │
│  ├─ PostgreSQL 16     :5432                                     │
│  └─ Redis 7           :6379                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend — Vercel

Los 3 frontends son apps Next.js desplegadas en Vercel desde el monorepo:

| Proyecto | Dominio | Root Directory |
|---|---|---|
| web-client | `piums.com` | `apps/web-client/web` |
| web-artist | `artist.piums.com` | `apps/web-artist/web` |
| web-admin | `admin.piums.com` | `apps/web-admin/web` |

**Variables de entorno en Vercel** (configurar por proyecto en el dashboard de Vercel):
```env
NEXT_PUBLIC_API_URL=https://api.piums.com/api
NEXT_PUBLIC_APP_URL=https://piums.com        # o artist / admin según aplique
NEXT_PUBLIC_CLIENT_URL=https://piums.com
NEXT_PUBLIC_ARTIST_URL=https://artist.piums.com
NEXT_PUBLIC_ADMIN_URL=https://admin.piums.com
# Variables server-side (sin NEXT_PUBLIC_) para las API Routes BFF:
AUTH_SERVICE_URL=https://api.piums.com
ARTISTS_SERVICE_URL=https://api.piums.com
```

**Deploy automático**: push a `main` → Vercel despliega. PRs generan Preview URLs.

> ⚠️ Las apps usan **API Routes** (`/app/api/...`) como proxy BFF hacia el backend. Las variables `*_SERVICE_URL` son **server-side** (sin `NEXT_PUBLIC_`) y apuntan a `https://api.piums.com` en producción.

### Backend — VPS

Todo el backend corre en un VPS Ubuntu 22.04 con `docker-compose.prod.yml` y Nginx como reverse proxy.

**Archivo de referencia**: `infra/docker/docker-compose.prod.yml`  
**Nginx**: `infra/nginx/nginx.conf` — enruta `api.piums.com` → `gateway:3000` con SSL/TLS.

**Setup inicial del VPS (una sola vez):**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d api.piums.com
sudo mkdir -p /opt/piums && cd /opt/piums
cp infra/docker/docker-compose.prod.yml ./docker-compose.yml
# Crear /opt/piums/.env con las variables de producción
```

**Variables de entorno** en `/opt/piums/.env`:
```env
NODE_ENV=production
POSTGRES_USER=piums_prod
POSTGRES_PASSWORD=<password_seguro>
REDIS_PASSWORD=<redis_password>
JWT_SECRET=<64_bytes_hex>
REFRESH_SECRET=<64_bytes_hex>
ALLOWED_ORIGINS=https://piums.com,https://artist.piums.com,https://admin.piums.com
API_URL=https://api.piums.com
DOCKER_REGISTRY=ghcr.io/app-piums
IMAGE_TAG=latest
STRIPE_SECRET_KEY=sk_live_...
CLOUDINARY_CLOUD_NAME=...
SMTP_HOST=...
```

**Deploy del backend:**
```bash
cd /opt/piums
docker compose pull                                      # bajar nuevas imágenes
docker compose run --rm auth-service npx prisma migrate deploy  # migraciones
docker compose up -d                                     # reiniciar servicios
curl https://api.piums.com/health                        # verificar
```

**CI/CD** (GitHub Actions):
- Push a `develop` → deploy automático a staging (`.github/workflows/deploy-staging.yml`)
- Publicar GitHub Release `vX.Y.Z` → deploy a producción con aprobación manual (`.github/workflows/deploy-prod.yml`)

### Desarrollo Local

Stack completo en Docker para desarrollo local (`infra/docker/docker-compose.dev.yml`):
- PostgreSQL 16 + script `init-databases.sql` que crea las 9 bases de datos
- Redis 7
- API Gateway + 9 microservicios (4001–4009)
- web-client + web-artist (Next.js en modo dev)

```bash
docker compose -f infra/docker/docker-compose.dev.yml up -d
```

> ⚠️ Solo `gateway` y `auth-service` tienen Dockerfile propio. Los demás servicios necesitan sus Dockerfiles para poder levantar con `docker-compose up`.

### Kubernetes (`/infra/k8s/`)
Manifiestos Kustomize (base + overlays staging/production) — disponibles pero el deploy activo usa Docker Compose en VPS.

### Nginx (`/infra/nginx/`)
Configuración de reverse proxy para producción. Maneja SSL/TLS, headers de seguridad y enruta subdominios.

### Terraform (`/infra/terraform/`)
Infraestructura como código para el cloud provider del VPS.

### Scripts (`/scripts/`)
- `dev.sh` — script maestro: `setup`, `start`, `start-local`, `stop`, `restart`, `status`, `health`, `logs`, `clean`
- `lint.sh` — linting de todo el monorepo
- `seed.sh` — seed de datos de prueba

---

## 12. Documentación del Proyecto (`/docs/`)

| Archivo | Contenido |
|---|---|
| `kickoff.md` | Documento inicial del proyecto (vacío actualmente) |
| `QUICK_START.md` | Cómo levantar el stack en 3 comandos, troubleshooting |
| `ESTADO_PROYECTO_CHECKLIST.md` | Checklist detallado de qué está implementado y qué falta (con estado ✅/⚠️/❌) |
| `IMPLEMENTACIONES_RESUMEN.md` | Resumen de todas las implementaciones realizadas por feature |
| `BACKLOG_INTEGRACION.md` | Backlog de integraciones pendientes entre servicios |
| `DEPLOYMENT.md` / `DEPLOYMENT_GUIDE.md` | Guías de despliegue a staging y producción |
| `FRONTEND_INTEGRATION.md` | Cómo integrar el frontend con los servicios backend |
| `BOOKING_NOTIFICATIONS_INTEGRATION.md` | Flujo de notificaciones en el ciclo de booking |
| `features-er-model-complete.md` | Las 7 features del ER model implementadas (booking codes, payouts, disputes, profiles, categories, cities, media assets) |
| `sistema-pricing.md` | Arquitectura completa del sistema de pricing (base + addons + viaje + descuentos) |
| `sistema-disponibilidad.md` | Sistema de disponibilidad del artista (horarios, bloqueos, slots) |
| `sistema-payouts.md` | Sistema de pagos a artistas con Stripe Connect (~900 líneas) |
| `api-contracts/openapi.yaml` | Especificación OpenAPI 3.0 de todos los endpoints |
| `api-contracts/README.md` | Índice de contratos de API |
| `api-contracts/avatar-upload.md` | Contrato para upload de avatares (endpoint pendiente de implementar) |
| `architecture/decisions/adr-0001-database.md` | ADR: decisión de base de datos |
| `architecture/decisions/adr-0002-monorepo.md` | ADR: decisión de monorepo con pnpm |
| `architecture/decisions/adr-0003-app-separation.md` | ADR: decisión de separar web-client y web-artist |
| `architecture/diagrams/microservices.mmd` | Diagrama Mermaid de microservicios |
| `architecture/diagrams/mvp-flow.mmd` | Diagrama Mermaid del flujo MVP |

---

## 13. Documentación por Servicio (`/services/*/`)

Cada servicio tiene su propio conjunto de docs:

| Archivo | Contenido |
|---|---|
| `README.md` | Descripción del servicio, endpoints, setup local |
| `DATABASE_SETUP.md` | Cómo configurar y migrar la base de datos |
| `IMPLEMENTATION.md` | Detalle de lo que está implementado en el servicio |
| `BOOKING_PAYMENTS_INTEGRATION.md` | (solo booking) Integración entre booking y payments |

---

## 14. Packages Compartidos (`/packages/`)

| Package | Descripción |
|---|---|
| `@piums/sdk` | Cliente HTTP con todos los métodos de la API. Usado por web-artist y web-client. Build: `pnpm run build` en `/packages/sdk` |
| `@piums/ui` | Design system y componentes reutilizables (en construcción) |
| `@piums/shared-types` | Tipos TypeScript compartidos entre servicios |
| `@piums/shared-utils` | Utilidades comunes (validators, formatters, helpers) |
| `@piums/shared-config` | Configuraciones compartidas (ESLint, Prettier, etc.) |

---

## 15. Estado Actual (30 marzo 2026)

### ✅ Completado (actualizado)
- Arquitectura de microservicios completa (9 servicios)
- API Gateway con proxy, auth middleware, rate limiting
- Auth completo: JWT, refresh tokens, OAuth (Google/Facebook/TikTok), 2FA preparado
- Schemas Prisma de todos los servicios sincronizados
- Sistema de booking con códigos PIU-YYYY-NNNNNN y quote snapshots
- Sistema de payouts a artistas (Stripe Connect, fee 15%)
- Sistema de disputas (8 tipos, múltiples resoluciones)
- Sistema de pricing avanzado (base + addons + viaje)
- Sistema de disponibilidad y calendarios
- Sistema de notificaciones (booking, pagos, templates email)
- Sistema de reseñas con respuestas y moderación
- Media assets polimórficos para portfolio, certifications, reviews
- Categories geográficas (Country → State → City)
- SDK completo con ~35 métodos
- **web-artist**: Dashboard, Reservas, Servicios CRUD, Configuración (5 pestañas: personal, cobertura, perfil público, notificaciones, pagos), Onboarding con "Omitir". Categoría principal + secundaria con `<select>` (MUSICO, TATUADOR, FOTOGRAFO, etc.)
- **web-client**: Landing, búsqueda, perfil de artista, flujo de booking completo (selección → checkout Stripe → confirmación), mis reservas, chat, perfil, onboarding con "Omitir"
- **Sistema de Eventos multi-artista** (commit `874e704`): CRUD de eventos en booking-service, páginas `/events` y `/events/[id]`, AddToEventModal en `/bookings`, asociación de evento en paso 3 del wizard de booking
- **Filtros de artistas corregidos** (commit `6bd4c77`): categorías, ciudades (regiones reales), búsqueda por texto `q`
- **Regiones dinámicas**: `CITIES_BY_COUNTRY` con GT (22 depto), MX, HN, SV, CR, CO
- **web-admin**: Panel de administración con Moderación (Reportes + Quejas fusionados en una sola página con tabs y badge de conteo). Verificación de artistas con drawer de detalle completo (avatar, stats, documentos de identidad, botón Verificar/Revocar)
- Migración completa de moneda: MXN → **GTQ** en codebase entero (schemas, servicios, frontend, mocks)
- `Intl.NumberFormat('es-GT', { currency: 'GTQ' })` en todos los componentes de precio
- docker-compose.dev.yml con stack completo

### 🆕 Completado recientemente (28-30 mar 2026) — branch `dave`

#### Fix: Sistema de notificaciones toast (alert → toast)
- Creada utilidad DOM-based `src/lib/toast.ts` en `web-client` y `web-artist` (zero dependencies)
- Reemplazados **33 `alert()`** en web-client y **21 `alert()`** en web-artist
- Toast se muestra en esquina superior-derecha, auto-cierra en 4s
- API: `toast.success('msg')`, `toast.error('msg')`, `toast.warning('msg')`, `toast.info('msg')`

#### Fix: Moneda GTQ — formato Quetzal (Q)
- Reemplazado símbolo `$` y etiqueta `GTQ` separada por `Q` (prefijo) en todos los componentes de precio
- Locale `es-GT` aplicado en `toLocaleString('es-GT')` y `Intl.NumberFormat('es-GT', { currency: 'GTQ' })`
- Archivos corregidos en web-client:
  - `src/app/booking/page.tsx`, `src/app/bookings/page.tsx`
  - `src/app/services/[id]/page.tsx`, `src/app/search/page.tsx`
  - `src/app/booking/checkout/page.tsx`, `src/app/booking/confirmation/[id]/page.tsx`
  - `src/components/artist/StatsCards.tsx` (subtítulo `GTQ` → `Quetzales`)

#### Fix: ReportModal — pantalla gris al hacer "Reportar reseña"
- **Causa raíz**: el backdrop `fixed inset-0 bg-gray-500/75` se renderizaba encima del diálogo porque el card no era un elemento posicionado
- **Fix**: añadido `relative z-10` al card del diálogo; backdrop solo ocupa z-index base; outer container usa `fixed inset-0 z-50 flex items-center justify-center`
- Aplicado en `apps/web-client/web/src/components/ReportModal.tsx`
- Aplicado en `apps/web-artist/web/src/components/ReportModal.tsx`

#### Fix: Rating del artista no se actualizaba tras nueva reseña
- Añadido endpoint interno en `artists-service`: `PATCH /artists/internal/:id/rating` (sin auth, solo internal network)
- Añadida llamada de sincronización en `reviews-service/src/services/review.service.ts` al final de `updateArtistRating()` 
- Añadida variable `ARTISTS_SERVICE_URL: http://artists-service:4003` a reviews-service en `docker-compose.dev.yml`
- Sincronización retroactiva ejecutada: 2 artistas actualizados (200 OK), 1 artista stale ignorado (no existe en artists-service)

---

### 🆕 Completado (1 abril 2026) — commits `f1363d2`, refactor, `2c26348`, `f623985`

#### Búsqueda de artistas — `buscar-artistas/page.tsx`
- Search bar agrandado: `py-1.5 text-xs w-48` → `py-2.5 text-sm w-80`, ícono lupa `h-3.5→h-4`, `rounded-lg→rounded-xl`
- Contador reducido: `<h2 font-semibold text-gray-900>` → `<p text-xs font-medium text-gray-500>`
- Subtexto de ubicación: `text-xs` → `text-[10px]`
- Firebase API key con fallback hardcoded en `src/lib/firebase.ts` para evitar error en build Docker

#### Búsqueda de artistas — normalización y OR search
- `useInfiniteArtists.ts` en `web-client`: función `stripAccents()`, mapa `CATEGORY_ALIASES`, función `resolveFilters()` para normalizar búsquedas con acento/alias
- `artists-service`: búsqueda OR en 4 campos (`nombre`, `artistName`, `bio`, `city`) con normalización de acentos en backend

#### Admin: Verificación de artistas — rediseño completo del drawer
- Drawer convertido a **modal centrado** (`fixed inset-0 z-50 flex items-center justify-center p-4`, inner `max-w-lg max-h-[90vh]`)
- Layout de **3 pestañas**: Perfil | Documentos | Decisión
  - **Perfil**: strip de identidad, tarjeta de proveedor con SVG inline (Google/Facebook/TikTok/Email), banner de rechazo anterior, grid de stats, filas de info
  - **Documentos**: tipo/número de documento, imágenes clickables, checklist interactivo 4 ítems con contador `x/4`, banner verde cuando todo OK
  - **Decisión**: banner de estado, notas de admin, cards toggle (Verificar/Rechazar), campo de razón de rechazo (solo si Rechazar)
- Componente `CheckItem` añadido
- Footer context-aware: acciones rápidas desde Perfil/Docs, botones Ejecutar desde Decisión

#### Columnas DB añadidas a `piums_auth.users`
- `rejectionReason String?` y `adminNotes String?` agregados via SQL directo + schema Prisma actualizado
- `admin.controller.ts`: `getArtistDetail` devuelve campos extendidos; `verifyArtist` acepta `{ isVerified, rejectionReason?, adminNotes? }`
- `AdminArtistDetail` interface y `artistsApi.verify()` actualizados en `web-admin/src/lib/api.ts`

#### Onboarding artista — paso de identidad para OAuth
- Paso 3 extra insertado **solo para usuarios OAuth** (Google/Facebook/TikTok)
- Detección: `sessionStorage.getItem('auth_provider')` seteado por `/auth/callback/page.tsx`
- `totalSteps` dinámico: `isOAuthUser ? 5 : 4`
- Step 3 UI: select tipo doc (CC/CE/Pasaporte/NIT/TI), número, 3 zonas de upload (frente=required, reverso=optional, selfie=required) con preview base64 + `capture="environment"` para móvil
- `handleFinish`: si OAuth, hace `PATCH /api/auth/profile` con `documentType/Number/FrontUrl/BackUrl/SelfieUrl` antes de crear perfil artista
- Navegación actualizada: paso 4=Portfolio, paso 5=Servicio

#### Datos de prueba — Maria López (`maria.onboarding@piums.com`)
- `piums_auth.users`: nombre, ciudad=Medellín, emailVerified=true, provider=email, status=ACTIVE
- `documentType`=Cédula, `documentNumber`=1098234567, URLs de frente/reverso/selfie con fotos Unsplash

#### Admin: Verificación de artistas con vista de datos completa (commits `c4c881b`, `5f124ef`)
- **Bug corregido**: `artistsApi.verify()` enviaba `{ approved }` pero backend lee `{ isVerified }` — verificación rota; ya corregido
- **Nuevo endpoint** `GET /admin/artists/:id` (`getArtistDetail` en `admin.controller.ts`): devuelve perfil completo (avatar, ciudad, documentos de identidad, último acceso, stats de reservas y reseñas)
- **`AdminArtistDetail`** interface + `artistsApi.detail(id)` en `api.ts`
- **Drawer de detalle** en la página admin de artistas: click en cualquier fila (desktop) o tarjeta (mobile) → panel lateral deslizante con perfil completo, estadísticas, fotos de documentos de identidad (frente/reverso/selfie) y botón Verificar/Revocar directo

#### OAuth: Estado actual
- ✅ **Google OAuth** — Passport.js (`passport-google-oauth20`). Ruta: `GET /auth/google` → `/auth/google/callback`. Scope: `profile email`. Vars: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- ✅ **Facebook OAuth** — Passport.js (`passport-facebook`). Ruta: `GET /auth/facebook` → `/auth/facebook/callback`. Scope: `email`. Vars: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL`
- ✅ **TikTok OAuth** — implementado (Login Kit v2 + PKCE S256)

#### TikTok OAuth — Implementación Completada

Flujo OAuth 2.0 PKCE a través del **TikTok Login Kit v2**. No usa Passport.js (no hay librería oficial para v2).

**Archivos creados/modificados:**
| Archivo | Cambio |
|---|---|
| `services/auth-service/src/strategies/tiktok.strategy.ts` | Strategy custom: PKCE, token exchange, user fetch, upsert |
| `services/auth-service/src/routes/oauth.routes.ts` | Rutas `GET /auth/tiktok` y `GET /auth/tiktok/callback` |
| `services/auth-service/prisma/schema.prisma` | Campo `tiktokId String? @unique` en modelo User |
| `infra/docker/docker-compose.dev.yml` | Variables `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_CALLBACK_URL` |

**Detalles de implementación:**
- `buildTikTokAuthUrl()` genera `code_verifier` (32 bytes base64url) + `code_challenge` (SHA-256), guarda en sesión Express
- `exchangeTikTokCode()` hace POST a `https://open.tiktokapis.com/v2/oauth/token/` con `code_verifier`
- `getTikTokUser()` hace GET a `https://open.tiktokapis.com/v2/user/info/` con `fields=open_id,union_id,avatar_url,display_name`
- TikTok no provee email → se usa email sintético `tiktok.{openId}@piums.tiktok`
- Validación CSRF del `state` antes de intercambiar el code
- Al callback exitoso: emite JWT y redirige a `{FRONTEND_URL}/auth/callback?token=...&provider=tiktok`
- Botones TikTok ya presentes en login pages de web-client y web-artist (`/api/auth/tiktok`)

**Variables de entorno (ya configuradas en docker-compose.dev.yml):**
```env
TIKTOK_CLIENT_KEY=awux3plhoxtgp6o0
TIKTOK_CLIENT_SECRET=yfegVNVBisOrTAuRMUoZ3J2aKi1qmDen
TIKTOK_CALLBACK_URL=http://localhost:4001/auth/tiktok/callback
```

**Pendiente para producción**: registrar `https://api.piums.com/auth/tiktok/callback` como Redirect URI en el portal TikTok Developer. En sandbox solo pueden autenticarse cuentas de prueba registradas en el portal.

---

### 🆕 Completado recientemente (27 mar 2026) — commit `6bd4c77`
- **Fix filtros página `/artists`**:
  - SDK `GetArtistsParams`: params renombrados `categoria→category`, `ciudad→city`, añadido `q`
  - `useInfiniteArtists.ts`: mapeo correcto `filters.category→params.category`, `filters.cityId→params.city`, `filters.q→params.q`
  - Valores de categorías corregidos al enum real: `MUSICO`, `FOTOGRAFO`, `DJ`, `TATUADOR`, `MAQUILLADOR`, `PINTOR`, `ESCULTOR`, `OTRO`
  - `artists-service`: añadido campo `q` en schema + filtro por nombre (case-insensitive) en `searchArtists()`
- **Regiones dinámicas por país** en `artists/page.tsx`:
  - `CITIES_BY_COUNTRY`: mapa por código ISO (GT, MX, HN, SV, CR, CO)
  - GT default: 22 departamentos de Guatemala
  - `getCitiesForCountry(country)` con fallback a GT
  - Al cambiar país se resetea `selectedCity`

### ✅ Completado anteriormente (hasta 26 mar 2026)
- **Selección de categorías artista**: Pestaña Personal tiene `<select>` para categoría principal y secundaria (`ARTIST_CATEGORIES` constant)
- **Booking multi-día**: Toggle en paso 2 (Fecha/Hora), controles +/− para `numDays`, `effectiveDurationMinutes = numDays × 1440`
- **Rango de fechas en calendario**: `CalendarPicker` + `Calendar.tsx` muestran degradado naranja entre fecha inicio y fin del multi-día
- **Viáticos** (`pricing.service.ts`): cuando `numDays > 1` Y `distanceKm > includedKm` → tarifa plana de plataforma (env-overrideable):
  - Comida: Q 150/día (`VIATICOS_FOOD_CENTS=15000`)
  - Hospedaje: Q 400/día (`VIATICOS_LODGING_CENTS=40000`)
  - Transporte: Q 200 fijo (`VIATICOS_TRANSPORT_CENTS=20000`)
  - Día único + lejos: sigue usando precio por km (comportamiento anterior intacto)
  - UI: label cambia a "Viáticos" / "Costo de traslado" según escenario; ícono avión en `PricingBreakdown`
  - `calculatePriceQuote` callback ahora pasa `effectiveDurationMinutes` a la API

### 🆕 Completado (31 marzo 2026) — commit `62402ab`

#### Tours guiados + PageHelpButton
- Íconos SVG (Heroicons) reemplazaron emojis en todos los tours de web-client y web-artist
- `PageHelpButton.tsx` — botón flotante `?` (esquina inferior derecha) en todas las páginas principales de ambas apps
- Mini-tours específicos por página (2-3 pasos) añadidos a `tours.ts` de ambas apps
- Fix: botones "Omitir" en onboarding ahora setean cookie `onboarding_completed` antes de redirigir

### ⚠️ Pendiente / Incompleto
- Stripe Connect: configuración de cuenta bancaria en Settings > Pagos (placeholder)
- Unit/integration tests
- Seed data completo (`scripts/seed.sh`) ✅ implementado — ejecutar cuando los servicios estén corriendo

### ✅ Histórico (antes de 27 marzo)
- **Dockerfiles**: Todos los 8 servicios tienen Dockerfile ✅
- **Chat en tiempo real**: `chat-service` con Socket.io ya implementado (puerto 4007). Frontend `web-client` conectado con API real + Socket.io. Frontend `web-artist` corregido (puerto 4007, evento `message:received`)
- **Upload de avatares**: `avatar.controller.ts` completo con Cloudinary, rutas registradas en `users.routes.ts`
- **Dispute service**: `dispute.service.ts`, `dispute.controller.ts`, `dispute.routes.ts` implementados y registrados en `booking-service` ✅
- **Profile service**: `profile.service.ts`, `profile.controller.ts`, `profile.routes.ts` implementados y registrados en `users-service` (rutas en `/api/users/me/profile`)
- **Búsqueda full-text**: `search-service` con `search.service.ts` real usando Prisma, rutas registradas ✅
- **Cover photo upload**: endpoint `POST /api/users/me/profile/cover` implementado en profile controller

---

## 16. Cómo Desarrollar

```bash
# Instalar dependencias (primera vez)
pnpm install

# Levantar stack completo con Docker
./scripts/dev.sh start

# O levantar solo frontends (si servicios ya están en Docker)
cd apps/web-artist/web && pnpm dev --port 3001
cd apps/web-client/web && pnpm dev  # puerto 3002

# Reconstruir SDK tras cambios
cd packages/sdk && pnpm run build

# Ver logs de un servicio
docker logs piums-auth-service -f

# Entrar a un contenedor
docker exec -it piums-booking-service sh

# Aplicar migraciones Prisma
cd services/booking-service && npx prisma db push
```

---

## 17. Cómo Desplegar

PIUMS usa una estrategia **híbrida**:
- **Frontends** (Next.js) → **Vercel** (serverless, auto-deploy, CDN global)
- **Microservicios + Gateway + DB + Redis** → **VPS o cloud** con Docker Compose (MVP) o Kubernetes (producción escalable)

```
┌─────────────────────────────────────────────────────┐
│                     INTERNET                        │
└──────────┬───────────────────────┬──────────────────┘
           │                       │
    app.piums.com           api.piums.com
    artist.piums.com
    admin.piums.com
           │                       │
    ┌──────▼──────┐        ┌───────▼────────┐
    │   VERCEL    │        │  VPS / Cloud   │
    │  (Next.js)  │──────► │  API Gateway   │
    │  3 proyectos│  HTTPS │  :3000         │
    └─────────────┘        │                │
                           │  9 servicios   │
                           │  PostgreSQL    │
                           │  Redis         │
                           └────────────────┘
```

---

### 17.0 Pre-requisitos

Antes de desplegar necesitas tener listo:

| Requisito | Para qué |
|---|---|
| Cuenta en [Vercel](https://vercel.com) | Frontends |
| Servidor VPS (Hetzner / DigitalOcean / AWS EC2) con Docker instalado | Microservicios |
| Dominio propio (ej. `piums.com`) | DNS para todos los subdominios |
| Cuenta Stripe en modo live | Pagos reales |
| Proyecto en Google Cloud Console | OAuth con Google |
| Cuenta Cloudinary | Upload de avatares/imágenes |
| Repositorio en GitHub conectado a Vercel | Auto-deploy |

**Requisitos mínimos del servidor:**
- 4 vCPU, 8 GB RAM (para correr los 9 servicios + PostgreSQL + Redis + Gateway)
- Ubuntu 22.04 LTS
- Docker 24+ y Docker Compose v2
- Puerto 80 y 443 abiertos

---

### 17.1 Despliegue de Microservicios en el Servidor

#### Paso 1 — Preparar el servidor

```bash
# Conectarse al servidor
ssh root@IP_DEL_SERVIDOR

# Instalar Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker

# Instalar Docker Compose v2
apt-get install docker-compose-plugin -y

# Clonar el repositorio
git clone https://github.com/app-piums/piums-platform.git /opt/piums
cd /opt/piums
```

#### Paso 2 — Configurar variables de entorno de producción

Crear el archivo `/opt/piums/.env.production`:

```env
# ── Base de datos ──────────────────────────────────────
POSTGRES_USER=piums
POSTGRES_PASSWORD=CAMBIAR_PASSWORD_SEGURO
POSTGRES_DB=piums_dev

# ── Redis ──────────────────────────────────────────────
REDIS_URL=redis://piums-redis:6379

# ── JWT ────────────────────────────────────────────────
JWT_SECRET=CAMBIAR_SECRET_ALEATORIO_MIN_64_CHARS
JWT_REFRESH_SECRET=CAMBIAR_OTRO_SECRET_DIFERENTE

# ── URLs internas (entre contenedores, NO cambiar) ─────
AUTH_SERVICE_URL=http://piums-auth-service:4001
USERS_SERVICE_URL=http://piums-users-service:4002
ARTISTS_SERVICE_URL=http://piums-artists-service:4003
CATALOG_SERVICE_URL=http://piums-catalog-service:4004
PAYMENTS_SERVICE_URL=http://piums-payments-service:4005
REVIEWS_SERVICE_URL=http://piums-reviews-service:4006
NOTIFICATIONS_SERVICE_URL=http://piums-notifications-service:4007
BOOKING_SERVICE_URL=http://piums-booking-service:4008
SEARCH_SERVICE_URL=http://piums-search-service:4009
CHAT_SERVICE_URL=http://piums-chat-service:4010
GATEWAY_INTERNAL_URL=http://piums-gateway:3000

# ── URL pública del gateway (tu dominio real) ──────────
GATEWAY_PUBLIC_URL=https://api.piums.com
ALLOWED_ORIGINS=https://app.piums.com,https://artist.piums.com,https://admin.piums.com

# ── Stripe ─────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PLATFORM_FEE_PERCENT=15

# ── OAuth Google ───────────────────────────────────────
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=https://api.piums.com/api/auth/google/callback

# ── Cloudinary (avatares/imágenes) ────────────────────
CLOUDINARY_CLOUD_NAME=piums
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# ── Email (notificaciones) ─────────────────────────────
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASS=re_...
EMAIL_FROM=noreply@piums.com

# ── Viáticos ───────────────────────────────────────────
VIATICOS_FOOD_CENTS=15000
VIATICOS_LODGING_CENTS=40000
VIATICOS_TRANSPORT_CENTS=20000
```

> ⚠️ **Nunca subas este archivo a Git.** Está en `.gitignore`.

#### Paso 3 — Levantar el stack

```bash
cd /opt/piums

# Construir imágenes y levantar todos los servicios
docker compose -f infra/docker/docker-compose.dev.yml --env-file .env.production up -d --build

# Verificar que todos los contenedores estén corriendo
docker compose -f infra/docker/docker-compose.dev.yml ps

# Ejecutar migraciones de base de datos (primera vez)
docker exec piums-auth-service npx prisma db push
docker exec piums-users-service npx prisma db push
docker exec piums-artists-service npx prisma db push
docker exec piums-catalog-service npx prisma db push
docker exec piums-booking-service npx prisma db push
docker exec piums-payments-service npx prisma db push
docker exec piums-reviews-service npx prisma db push
docker exec piums-notifications-service npx prisma db push
docker exec piums-search-service npx prisma db push

# (Opcional) Cargar datos de prueba
bash scripts/seed.sh
```

#### Paso 4 — Configurar Nginx + HTTPS

Instalar Nginx y Certbot para TLS automático:

```bash
apt-get install nginx certbot python3-certbot-nginx -y

# Obtener certificado SSL (requiere que el dominio ya apunte al servidor)
certbot --nginx -d api.piums.com
```

Configuración en `/etc/nginx/sites-available/piums-api`:

```nginx
server {
    listen 443 ssl;
    server_name api.piums.com;

    ssl_certificate     /etc/letsencrypt/live/api.piums.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.piums.com/privkey.pem;

    location / {
        proxy_pass         http://localhost:3005;  # puerto externo del gateway
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirigir HTTP → HTTPS
server {
    listen 80;
    server_name api.piums.com;
    return 301 https://$host$request_uri;
}
```

```bash
# Activar la configuración
ln -s /etc/nginx/sites-available/piums-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

#### Paso 5 — Verificar que el gateway responde

```bash
curl https://api.piums.com/api/health
# Debe devolver: {"status":"ok","services":{...}}
```

---

### 17.2 Despliegue de Frontends en Vercel

Cada frontend es un **proyecto Vercel independiente**, todos apuntando al mismo repo GitHub.

| Proyecto Vercel | Directorio raíz | Dominio |
|---|---|---|
| `piums-web-client` | `apps/web-client/web` | `app.piums.com` |
| `piums-web-artist` | `apps/web-artist/web` | `artist.piums.com` |
| `piums-web-admin` | `apps/web-admin/web` | `admin.piums.com` |

#### Configurar cada proyecto en Vercel

**Opción A — Desde vercel.com (recomendado):**
1. Ir a `vercel.com/new` → Importar el repo de GitHub
2. En **"Root Directory"** escribir `apps/web-client/web` (o el que corresponda)
3. Framework: **Next.js** (auto-detectado)
4. Agregar las variables de entorno (ver tabla abajo)
5. Click en **Deploy**

Repetir para `web-artist` y `web-admin` como proyectos separados.

**Opción B — Con Vercel CLI:**
```bash
npm i -g vercel

# Web Client
cd apps/web-client/web
vercel link          # vincula al proyecto existente o crea uno nuevo
vercel env pull      # descarga variables de entorno de Vercel a .env.local
vercel --prod        # despliega a producción

# Web Artist
cd apps/web-artist/web
vercel link && vercel --prod

# Web Admin
cd apps/web-admin/web
vercel link && vercel --prod
```

#### Variables de entorno en Vercel

Configurar en el dashboard de cada proyecto (`Settings → Environment Variables`):

**piums-web-client (`app.piums.com`):**
| Variable | Valor producción |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.piums.com/api` |
| `GATEWAY_INTERNAL_URL` | `https://api.piums.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `NEXT_PUBLIC_APP_URL` | `https://app.piums.com` |

**piums-web-artist (`artist.piums.com`):**
| Variable | Valor producción |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.piums.com/api` |
| `GATEWAY_INTERNAL_URL` | `https://api.piums.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `NEXT_PUBLIC_APP_URL` | `https://artist.piums.com` |

**piums-web-admin (`admin.piums.com`):**
| Variable | Valor producción |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.piums.com/api` |
| `GATEWAY_INTERNAL_URL` | `https://api.piums.com` |
| `NEXT_PUBLIC_APP_URL` | `https://admin.piums.com` |

> ⚠️ Variables con `NEXT_PUBLIC_` quedan expuestas en el bundle del browser. Las sin prefijo solo se usan durante el build/SSR en los servidores de Vercel.

#### Cómo funciona el proxy de Vercel hacia el Gateway

`next.config.ts` ya tiene el rewrite configurado:
```ts
rewrites() {
  return [{
    source: '/api/:path*',
    destination: `${process.env.GATEWAY_INTERNAL_URL}/api/:path*`
  }]
}
```

Flujo de una petición desde el browser:
```
Browser → POST app.piums.com/api/auth/login
       → Vercel rewrite → https://api.piums.com/api/auth/login
       → Nginx → Gateway :3000
       → auth-service :4001
```
Esto evita CORS porque el browser nunca hace una petición cross-origin: todo pasa por el mismo dominio de Vercel.

#### Configurar dominio personalizado en Vercel

1. En el proyecto Vercel → `Settings → Domains` → Agregar `app.piums.com`
2. Vercel muestra los registros DNS a configurar (normalmente un `CNAME` apuntando a `cname.vercel-dns.com`)
3. Agregar esos registros en tu proveedor de DNS (Cloudflare, Namecheap, etc.)
4. Vercel gestiona el certificado TLS automáticamente

---

### 17.3 Configurar DNS

Una vez que el servidor tiene IP pública y Vercel tiene los proyectos:

| Tipo | Nombre | Destino |
|---|---|---|
| `A` | `api` | `IP_DEL_SERVIDOR` |
| `CNAME` | `app` | `cname.vercel-dns.com` |
| `CNAME` | `artist` | `cname.vercel-dns.com` |
| `CNAME` | `admin` | `cname.vercel-dns.com` |

---

### 17.4 Configurar Stripe Webhooks

Para que los pagos funcionen en producción, Stripe necesita notificar al servidor cuando un pago es procesado:

1. Ir a `dashboard.stripe.com → Developers → Webhooks → Add endpoint`
2. URL del endpoint: `https://api.piums.com/api/payments/webhook`
3. Eventos a escuchar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `account.updated` (para Stripe Connect)
4. Copiar el **Signing secret** (`whsec_...`) → pegar en `STRIPE_WEBHOOK_SECRET` del servidor

---

### 17.5 Flujo de Actualización (después del primer despliegue)

**Actualizar microservicios:**
```bash
ssh root@IP_DEL_SERVIDOR
cd /opt/piums

# Traer últimos cambios
git pull origin main

# Reconstruir solo los servicios que cambiaron
docker compose -f infra/docker/docker-compose.dev.yml up -d --build booking-service gateway

# Si hay cambios en el schema de Prisma
docker exec piums-booking-service npx prisma db push
```

**Actualizar frontends:**
Vercel hace auto-deploy automáticamente con cada push a `main`. Para deployar manualmente:
```bash
cd apps/web-client/web && vercel --prod
```

---

### 17.6 Flujo de CI/CD con GitHub Actions (opcional)

Crear `.github/workflows/deploy.yml` para automatizar el deploy del backend:

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'services/**'
      - 'apps/gateway/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to server via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_IP }}
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/piums
            git pull origin main
            docker compose -f infra/docker/docker-compose.dev.yml up -d --build
```

Secrets requeridos en GitHub (`Settings → Secrets`): `SERVER_IP`, `SSH_PRIVATE_KEY`.

Vercel se encarga automáticamente del deploy de frontends sin necesidad de configuración adicional en GitHub Actions.

---

## 18. Convenciones del Código

- **Moneda**: siempre `GTQ`, locale `es-GT`, símbolo `Q`
- **Precios en backend**: centavos enteros (GTQ cents)
- **Precios en frontend**: `Q{amount.toLocaleString('es-GT')}` o `Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' })`
- **Fechas**: `toLocaleDateString('es-ES', {...})` para display
- **Auth en SDK**: `credentials: 'include'` (cookies automáticas)
- **Rutas de API**: todas pasan por Gateway en `/api/*`
- **Rutas protegidas** en web-artist: manejadas por `src/middleware.ts`
- **Rutas protegidas** en web-client: manejadas por `src/proxy.ts`
