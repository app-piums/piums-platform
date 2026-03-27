# AGENT.MD — Contexto Completo PIUMS Platform

**Fecha de última actualización**: 27 de marzo de 2026
**Último commit**: `6bd4c77` — fix(artists): filtros por categoria, ciudad y busqueda de texto
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
- **Auth**: JWT + cookies HTTP-only + Passport.js (Google, Facebook OAuth)
- **Pagos**: Stripe (PaymentIntents + Connect para payouts a artistas)
- **Monorepo**: pnpm workspaces
- **Infra**: Docker Compose (dev) + Kubernetes (staging/prod) + Nginx + Terraform

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

### Artista (`/artist/onboarding`) — 4 pasos:
1. **Bienvenida** — presentación de PIUMS, botón "Crear Mi Perfil"
2. **Disciplina creativa** — selección de especialidad (10 opciones: músico, fotógrafo, etc.)
3. **Portfolio & Perfil** — foto de perfil, bio, URLs de redes/portfolio
4. **Configurar Servicio** — primer servicio: nombre, categoría, precio, disponibilidad

Al completar/omitir: cookie `onboarding_completed=true; max-age=31536000` → redirect a `/artist/dashboard`.

Botón **"Omitir"** disponible en header (pasos 1-3) y debajo del botón "Finalizar" (paso 4).

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

### docker-compose.dev.yml (`/infra/docker/docker-compose.dev.yml`)
Stack completo en Docker para desarrollo local. Incluye:
- PostgreSQL 16 + script `init-databases.sql` que crea las 9 bases de datos
- Redis 7
- API Gateway
- 9 microservicios (4001–4009)
- web-client + web-artist

> ⚠️ **Nota**: Solo `gateway` y `auth-service` tienen Dockerfile propio. Los demás servicios necesitan sus Dockerfiles para poder levantar con `docker-compose up`.

### Kubernetes (`/infra/k8s/`)
- `base/` — manifiestos base
- `overlays/staging/` y `overlays/production/` — overlays por ambiente (Kustomize)

### Nginx (`/infra/nginx/`)
- Reverse proxy y load balancer para producción

### Terraform (`/infra/terraform/`)
- Infraestructura como código (cloud provider no especificado)

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

## 15. Estado Actual (27 marzo 2026)

### ✅ Completado (actualizado)
- Arquitectura de microservicios completa (9 servicios)
- API Gateway con proxy, auth middleware, rate limiting
- Auth completo: JWT, refresh tokens, OAuth (Google/Facebook), 2FA preparado
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
- **web-admin**: Panel de administración con Moderación (Reportes + Quejas fusionados en una sola página con tabs y badge de conteo)
- Migración completa de moneda: MXN → **GTQ** en codebase entero (schemas, servicios, frontend, mocks)
- `Intl.NumberFormat('es-GT', { currency: 'GTQ' })` en todos los componentes de precio
- docker-compose.dev.yml con stack completo

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

PIUMS usa una estrategia **híbrida**: los frontends (Next.js) en **Vercel** y los microservicios en la infraestructura existente (Docker / Kubernetes).

### 17.1 Frontends en Vercel

Cada frontend es un proyecto Vercel independiente:

| Proyecto Vercel | Directorio raíz | Dominio |
|---|---|---|
| `piums-web-client` | `apps/web-client/web` | `app.piums.com` |
| `piums-web-artist` | `apps/web-artist/web` | `artist.piums.com` |
| `piums-web-admin` | `apps/web-admin/web` | `admin.piums.com` |

**Pasos para configurar un proyecto en Vercel:**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Desde la raíz del monorepo, vincular cada frontend
cd apps/web-client/web && vercel link
cd apps/web-artist/web && vercel link
```

**Variables de entorno requeridas en cada proyecto Vercel:**

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública del API Gateway | `https://api.piums.com/api` |
| `GATEWAY_INTERNAL_URL` | URL interna para rewrites SSR | `https://api.piums.com` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clave pública Stripe | `pk_live_...` |
| `NEXT_PUBLIC_APP_URL` | URL del propio frontend | `https://app.piums.com` |

> ⚠️ Variables con prefijo `NEXT_PUBLIC_` son expuestas al browser. Las sin prefijo solo se usan en SSR/build.

**`next.config.ts` ya tiene el rewrite configurado:**
```ts
rewrites() {
  return [{
    source: '/api/:path*',
    destination: `${process.env.GATEWAY_INTERNAL_URL}/api/:path*`
  }]
}
```
Esto hace que las llamadas del cliente vayan a `/api/*` → Vercel las redirige al gateway de producción, evitando CORS.

**Despliegue:**
```bash
# Preview (rama de feature)
vercel

# Producción
vercel --prod
```

O conectar el repo en `vercel.com/new` y activar **"Auto-deploy on push"** en la branch `main`.

---

### 17.2 Microservicios — Producción (Kubernetes)

Los microservicios NO van a Vercel. Se despliegan en el cluster K8s definido en `/infra/k8s/`.

```bash
# Staging
kubectl apply -k infra/k8s/overlays/staging

# Producción
kubectl apply -k infra/k8s/overlays/production
```

El API Gateway debe tener una IP/dominio público estable (`api.piums.com`) con TLS terminado en Nginx (`/infra/nginx/`).

**Variables de entorno del Gateway y servicios** se configuran como `Secret` o `ConfigMap` en K8s. Las claves mínimas por servicio:

| Variable | Servicios que la requieren |
|---|---|
| `DATABASE_URL` | Todos los servicios |
| `REDIS_URL` | gateway, auth, notifications |
| `JWT_SECRET` | auth-service, gateway |
| `STRIPE_SECRET_KEY` | payments-service |
| `STRIPE_WEBHOOK_SECRET` | payments-service |
| `GOOGLE_CLIENT_ID/SECRET` | auth-service |
| `CLOUDINARY_URL` | users-service (avatares) |

---

### 17.3 Flujo de CI/CD recomendado

```
git push origin main
      │
      ├─── GitHub Actions ──► docker build & push → registry
      │                       kubectl rollout (staging → prod)
      │
      └─── Vercel (auto) ──► build & deploy frontends
```

Vercel detecta automáticamente los cambios en `apps/web-client/web`, `apps/web-artist/web` etc. si el proyecto está configurado con el directorio raíz correcto.

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
