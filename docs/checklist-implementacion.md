# Checklist de Implementación — Piums Payments & Bookings

> Referencia completa: `docs/planpagos.md`
> Última actualización: 2026-05-06

---

## 🔐 Pre-implementación (hacer antes de tocar código)

- [ ] Confirmar credenciales de prueba de Tilopay funcionando en entorno de desarrollo
- [x] Confirmar: `durationMinutes` ya en schema; auto-complete usa `durationMinutes + 4h` inline — no se necesita campo separado

> **Tilopay OrderHash:** se implementa después. El callback se procesa sin verificación de hash
> por ahora (loguea `SECURITY_WARNING` pero no rechaza). Cuando Tilopay responda con las
> instrucciones V2, se completa ese punto sin tocar nada más.
>
> **Credenciales de producción Tilopay:** solicitar en paralelo con el desarrollo para no
> bloquear el lanzamiento (puede tomar días/semanas el proceso de aprobación).

---

## 📦 Fase 1 — Migraciones de base de datos ✅

> ✅ Backups realizados: `backups/piums_*-pre-migration-*.sql`

### booking-service ✅
- [x] Backup de base de datos de booking-service
- [x] Agregar campos no-show: `noShowAt`, `noShowReportedBy`, `noShowReason`
- [x] Agregar campos 60km: `clientLat`, `clientLng`, `distanceKm`
- [x] Agregar campos entrega: `savedCardToken`, `deliveredAt`, `autoCompleteAt`, `estimatedDuration`, `disputeReason`, `disputeResolvedAt`, `disputeResolvedBy`
- [x] Nuevos valores `BookingStatus`: `DELIVERED`, `DISPUTE_OPEN`, `DISPUTE_RESOLVED`
- [x] Nuevos valores `PaymentStatus`: `ANTICIPO_PAID`, `FROZEN`, `CHARGING_REMAINING`
- [x] `DEPOSIT_PAID` marcado como legacy (mantener por compatibilidad)
- [x] Renombrar campos `deposit*` → `anticipo*` en schema
- [x] Renombrar `paymentIntentId` → `providerPaymentId`
- [x] Cambiar default currency `GTQ` → `USD`
- [x] `prisma db push` aplicado ✓

### artists-service ✅
- [x] Backup de base de datos de artists-service
- [x] Agregar: `shadowBannedAt DateTime?`
- [x] Agregar: `shadowBanReason String?`
- [x] Agregar: `allowSameDayBooking Boolean @default(true)`
- [x] `prisma db push` aplicado ✓

### payments-service ✅
- [x] Backup de base de datos de payments-service
- [x] Agregar modelo `Credit` con enum `CreditStatus`
- [x] Agregar modelo `CommissionRule` con enum `CommissionRuleType`
- [x] Agregar campos de comisión a Payout: `commissionRate`, `commissionRuleId`
- [x] Agregar campos de payout manual: `transferReference`, `completedByAdmin`
- [x] `prisma db push` aplicado ✓
- [ ] Renombrar campos `stripe*` → `provider*` (diferido — se hace junto con la implementación de Tilopay)
- [ ] Unique constraint `(bookingId, paymentType)` en PaymentIntent (diferido)

---

## 💳 Fase 2 — Infraestructura de pagos (payments-service) ✅ (Tilopay nativo pendiente de credenciales)

### Routing y proveedores
- [x] `utils/payment-router.ts` — `getProvider(countryCode)` devuelve TILOPAY o STRIPE
- [x] `utils/tilopay-token-cache.ts` — caché del bearer token con TTL 23h
- [x] `providers/payment-provider.interface.ts` — interfaz `IPaymentProvider`
- [x] `providers/tilopay.provider.ts`:
  - [x] `createCheckout()` → POST /api/createOrder (con bearer token)
  - [x] `refundPayment()` → POST /api/refund
  - [x] `verifyWebhookSignature()` — HMAC-SHA256
  - [ ] `loginSdk()` → POST /api/v1/loginSdk (pendiente — requiere credenciales reales)
  - [ ] `chargeCard()` → POST /admin/processPaymentFAC (pendiente — requiere credenciales reales)
  - [ ] Verificación del OrderHash — ⏳ pendiente (loguea SECURITY_WARNING sin rechazar)
- [x] `providers/stripe.provider.ts` — implementa `IPaymentProvider` (`createCheckout`, `refundPayment`)
  - [x] `payment_method_types: ['card']` — `automatic_payment_methods` removido

### Servicios
- [x] `payment.service.ts` — `initCheckout()`: resuelve proveedor, devuelve clientSecret o redirectUrl
- [ ] `payment.service.ts` — `tilopayCharge()`: recibe cardToken, llama processPaymentFAC (pendiente)
- [ ] `payment.service.ts` — `handle3DS()`: retorna htmlFormData al frontend (pendiente)
- [x] `payment.service.ts` — `createCredit()`:
  - [x] `creditAmount = max(paidAmount × 18%, $20 USD)`
  - [x] `expiresAt = now + 90 días`
  - [x] Crear registro `Credit` con `status: ACTIVE`
- [x] `payout.service.ts` — `createPayout()`: calcula neto con CommissionRule activa o fee global 18%
- [x] `payout.service.ts` — `completePayout()`: admin marca COMPLETED + guarda referencia transferencia
- [x] `payout.service.ts` — Stripe Connect eliminado; flujo 100% manual admin

### Rutas
- [x] `routes/callback.routes.ts` — webhook Tilopay (POST /callbacks/tilopay)
- [x] `routes/webhook.routes.ts` — mantener para Stripe
- [x] `routes/credit.routes.ts`:
  - [x] `GET /credits/my` — créditos activos del usuario autenticado
  - [x] `POST /credits/internal` — crear crédito (x-internal-secret)
  - [x] `POST /credits/expire` — expirar créditos vencidos (cron trigger)
- [x] `routes/commission.routes.ts`:
  - [x] `POST /commission-rules/internal` — crear CommissionRule (x-internal-secret)
  - [x] `GET /commission-rules` — listar reglas (admin)
- [x] Endpoints admin de payouts:
  - [x] `GET /payouts/pending` — lista de payouts a procesar (x-internal-secret)
  - [x] `PATCH /payouts/:id/complete-manual` — marcar COMPLETED con referencia de transferencia

### Cron jobs
- [x] `payment.service.ts` — `expireCredits()`: marca vencidos como EXPIRED

---

## 🎨 Fase 3 — artists-service ✅

- [x] Nuevo endpoint interno: `PATCH /artists/internal/by-auth/:authId/shadow-ban`
  - [x] `banned: true` → `shadowBannedAt = now`, `isActive = false`, unindex de búsquedas
  - [x] `banned: false` → `shadowBannedAt = null`, `isActive = true`, reindex

---

## 📅 Fase 4 — booking-service ⚡ Parcial

### Clients
- [x] `clients/payments.client.ts` — agregar `createCredit()` + `createRefundInternal()`
- [x] `clients/artists.client.ts` — agregar `shadowBan(authId, reason)` + `allowSameDayBooking` en ArtistProfile

### booking.service.ts
- [ ] Eliminar `createPaymentIntent()` de `createBooking()` (diferido — se mantiene para compatibilidad)
- [x] `createBooking()` — regla 60km:
  - [x] Guardar `clientLat`, `clientLng`, `distanceKm` en el booking
  - [x] Si `distanceKm ≤ 60 && artist.allowSameDayBooking !== false` → `minAdvanceHours = 3`
  - [x] Devolver `{ sameDayBookingApplied: boolean, minAdvanceHours: number }` en respuesta
- [x] Renombrar campos `deposit*` → `anticipo*`, `paymentIntentId` → `providerPaymentId`, `DEPOSIT_PAID` → `ANTICIPO_PAID` en todo el servicio
- [x] `cancelBooking()` — nueva lógica:
  - [x] Medir `now - booking.createdAt` (no `eventDate - now`)
  - [x] Si cliente cancela y `> 48h` desde creación → error 400
  - [x] Si cliente cancela dentro de 48h → reembolso 50%
  - [x] Si artista cancela CONFIRMED → reembolso 100% + crear `FIXED_PENALTY = 18% de totalPrice`
  - [x] Llamar `paymentsClient.createRefundInternal()` automáticamente
- [x] `reportNoShow(id, reportedByUserId, reason)` — nuevo:
  - [x] Validar estado: CONFIRMED, ANTICIPO_PAID, PAYMENT_COMPLETED, IN_PROGRESS, DELIVERED
  - [x] `booking.status = NO_SHOW`, guardar campos noShow*
  - [x] Crear `Dispute` automáticamente (`type: ARTIST_NO_SHOW, status: OPEN`)
  - [x] Notificar artista (IN_APP): tiene 24h para responder
  - [x] Notificar admin
- [x] `executeNoShowActions(bookingId, disputeId)` — método reutilizable:
  - [x] `paymentsClient.createRefundInternal()` — reembolso 100%
  - [x] `paymentsClient.createCredit()` — crédito compensación
  - [x] `artistsClient.shadowBan()` — best-effort
  - [x] `removeAvailabilityReservation()`
  - [x] Resolver disputa automáticamente
  - [x] Notificar cliente (IN_APP): reembolso + crédito procesados
  - [x] Notificar artista (IN_APP): cuenta restringida
- [x] `dispute.service.ts` — conectar resoluciones con acciones reales:
  - [x] `resolution = FULL_REFUND` + `ARTIST_NO_SHOW` → llamar `executeNoShowActions()`
  - [x] `resolution = FULL_REFUND` genérico → llamar `paymentsClient.createRefundInternal()`
  - [x] `resolution = CREDIT` → llamar `paymentsClient.createCredit()`
  - [x] `resolution = SUSPENSION/BAN` → llamar `artistsClient.shadowBan()`

### Cron jobs (booking-service)
- [x] Cron cada hora — cobro automático 72h antes del evento (`cron.service.ts`):
  - [x] Buscar: `paymentStatus = ANTICIPO_PAID` y `scheduledDate ≤ now + 72h`
  - [x] Con tarjeta guardada: crear PaymentIntent automáticamente
  - [x] Sin tarjeta: notificar al cliente
  - [x] Si cobro falla → notificar al cliente + log
- [x] Cron cada hora — escalada de pago fallido:
  - [x] T-48h sin pago: notificar artista + recordatorio urgente al cliente
  - [x] T-24h sin pago: escalar a soporte (log WARN + notificación urgente al cliente)
- [x] Cron cada hora — acciones automáticas de no-show (24h sin respuesta del artista):
  - [x] Buscar disputes `ARTIST_NO_SHOW` + `status=OPEN` + `createdAt ≤ now - 24h`
  - [x] Llamar `executeNoShowActions()` para cada uno
- [x] Cron cada hora — auto-complete si artista no marca entregado:
  - [x] Buscar bookings `status=IN_PROGRESS` y `scheduledDate + durationMinutes + 4h ≤ now`
  - [x] Mover a `DELIVERED` automáticamente
  - [x] Notificar al cliente: tiene 24h para confirmar o disputar

### Controller + Routes
- [x] `booking.controller.ts` — handler `reportNoShow`
- [x] `booking.routes.ts` — `POST /bookings/:id/no-show` (authenticateToken)

---

## 🔔 Fase 5 — notifications-service ✅

- [x] `BOOKING_NO_SHOW` ya registrado en `notification.schema.ts`
- [x] HTML `booking-no-show-client.html` — reembolso + crédito disponible
- [x] HTML `booking-no-show-artist.html` — cuenta restringida, 24h para responder
- [x] `booking-emails.service.ts` — `sendNoShowClientEmail()` + `sendNoShowArtistEmail()`
- [x] Template `COMMISSION_CHANGED` — email al artista con detalle del cambio de comisión
- [x] Template `PENALTY_APPLIED` — incluido en `sendCommissionChangedEmail()` (tipo FIXED_PENALTY)
- [x] Template `PAYMENT_MANUAL_REQUIRED` — email urgente al cliente con enlace de pago
- [x] Template `BOOKING_AUTO_COMPLETED` — email al cliente con enlace a reserva y a quejas
- [x] `NotificationTypeEnum` actualizado: +`BOOKING_AUTO_COMPLETED`, +`PAYMENT_MANUAL_REQUIRED`, +`COMMISSION_CHANGED`, +`PENALTY_APPLIED`, +`PAYMENT_REMAINING_DUE`, +`PAYMENT_REMAINING_FAILED`

---

## 📦 Fase 6 — SDK (packages/sdk) ✅ Completo

- [x] Actualizar interfaces: `PaymentIntent` (+providerRef, +redirectUrl, +provider), `Payment` (+providerPaymentId), `Refund` (+providerRefundId)
- [x] Agregar: `CommissionRule`, `CommissionRuleType`, `Credit`, `CreditStatus`, `Payout`
- [x] `Booking`: renombrar `deposit*` → `anticipo*`, agregar `noShowAt`, `noShowReason`, `clientLat/Lng`, `distanceKm`, `sameDayBookingApplied`
- [x] `CreateBookingPayload`: agregar `clientLat/Lng`
- [x] `ArtistProfile`: agregar `allowSameDayBooking`, `shadowBannedAt`
- [x] Nuevo método: `reportNoShow(bookingId, reason)`
- [x] Nuevo método: `getMyCredits()`
- [x] Nuevo método: `initCheckout(bookingId, amount, currency, countryCode?, description?)`
- [ ] Nuevo método: `tilopayCharge(bookingId, cardToken, sessionId)` — diferido (requiere credenciales)

---

## 🖥️ Fase 7 — Frontend web-client ✅ (Tilopay embebido diferido)

### Checkout unificado
- [x] `booking/checkout/page.tsx` — mostrar anticipo vs pago total según `booking.anticipoRequired`
- [x] Banner "Pago en dos partes" cuando `anticipoRequired=true`
- [x] Botón de confirmación muestra monto de anticipo vs total
- [x] Monto del PaymentIntent usa `anticipoAmount` cuando aplica
- [ ] Si Tilopay: carga `sdk_tpay.min.js`, renderiza formulario embebido (diferido)
- [ ] Modal 3DS si Tilopay devuelve `htmlFormData` (diferido)
- [x] Banner crédito disponible: "Tienes $X de crédito — ¿aplicar?" (informativo; llama `getMyCredits()`)
- [x] Banner "Pagar saldo restante" en `/bookings` cuando `paymentStatus=ANTICIPO_PAID`

### Formulario de reserva (regla 60km)
- [x] `clientLat/clientLng` incluidos en el payload de `createBooking`
- [x] Alerta "Reserva con solo 3h de anticipación" cuando `distanceKm ≤ 60km`
- [x] Horarios sugeridos filtrados por `minAdvanceHours` en `CalendarPicker` (3h si ≤60km, 24h si no)

### No-show
- [x] `bookings/[id]/page.tsx` — botón "Reportar no-show" visible cuando:
  - [x] Evento ya pasó (`scheduledDate < now`)
  - [x] `booking.status` ∈ {CONFIRMED, IN_PROGRESS, ANTICIPO_PAID, PAYMENT_COMPLETED}
  - [x] Modal con campo de motivo → llama `sdk.reportNoShow()`
- [x] Banner de estado NO_SHOW en detalle de reserva
- [x] Nuevos estados en STATUS_MAP: `no_show`, `in_progress`, `anticipo_paid`, `payment_completed`

---

## 🖥️ Fase 8 — Frontend web-artist ✅

- [x] Enlace a `/quejas/:disputeId` en notificaciones `BOOKING_NO_SHOW` / `ARTIST_NO_SHOW`
- [x] Contador de 24h visible en la notificación de no-show
- [x] Banner de shadow ban en dashboard con botones "Ver mis quejas" y "Contactar soporte"
- [x] `mockData.ts` actualizado: `depositRequired` → `anticipoRequired`
- [x] `bookings/page.tsx` — status `NO_SHOW` añadido a STATUS_ES, STATUS_STYLES, BORDER_ACCENT
- [x] `bookings/page.tsx` — banner rojo en card y modal de detalle con botón "Ver disputa abierta" → `/artist/dashboard/quejas`
- [x] `bookings/page.tsx` — nuevos estados: `IN_PROGRESS`, `ANTICIPO_PAID`, `PAYMENT_COMPLETED`, `DELIVERED`

---

## 🛠️ Fase 9 — Admin panel (web-admin) ✅

### Backend (auth-service)
- [x] `PATCH /admin/artists/:authId/shadow-ban` → proxy a artists-service con internal-secret
- [x] `GET /admin/commission-rules` → proxy a payments-service (admin JWT)
- [x] `POST /admin/commission-rules` → proxy a payments-service (internal-secret)
- [x] `GET /admin/payouts` → proxy a payments-service (admin JWT)
- [x] `PATCH /admin/payouts/:id/complete` → proxy a payments-service con internal-secret
- [x] `PATCH /api/payouts/:id/complete-manual` en payments-service (internal-secret)
- [x] `artistsClient.shadowBan()` en auth-service

### Payouts
- [x] Nueva página `/payouts` — filtros Pendiente / Completado / Todos
- [x] Columnas: artista, booking, monto bruto, comisión, monto neto, estado, fecha, referencia
- [x] Botón "Marcar pagado" → modal con campo de referencia de transferencia
- [x] "Pagos" en sidebar de administración

### Comisiones (drawer del artista)
- [x] Tab "Comisiones" en `ArtistDetailDrawer` con dot indicator si hay reglas activas
- [x] Lista de reglas con tipo, motivo, tasa/monto, fechas, estado activo/inactivo
- [x] Formulario "Nueva regla": tipo RATE_OVERRIDE | FIXED_PENALTY, campos condicionales
- [x] Fecha de inicio configurable

### Shadow ban
- [x] Banner rojo en tab "Perfil" si `shadowBannedAt` existe, con botón "Levantar restricción"
- [x] Botón "Shadow ban" en footer del drawer para artistas verificados
- [x] Botón "Levantar ban" en footer si ya está baneado
- [x] Indicadores actualizados via React Query invalidation

### No-shows en admin
- [x] Filtro `ARTIST_NO_SHOW` en página de reportes (chips de tipo bajo tabs de estado)
- [x] Historial de no-shows en detalle del artista (tab "No-shows" con dot indicator)

---

## 🔧 Fase 10 — Variables de entorno y dependencias ✅

- [x] Agregar vars Tilopay a `.env` de payments-service:
  - [x] `TILOPAY_API_KEY` (placeholder)
  - [x] `TILOPAY_API_SECRET` (placeholder)
  - [x] `TILOPAY_MERCHANT_ID` (placeholder)
  - [x] `TILOPAY_WEBHOOK_SECRET` (placeholder)
  - [x] `TILOPAY_API_URL=https://app2.tilopay.com/api/v1`
- [x] `DEFAULT_CURRENCY=USD` en todos los servicios (payments, booking, catalog)
- [x] `PLATFORM_FEE_PERCENTAGE=18` en payments-service
- [x] `INTERNAL_SERVICE_SECRET` en todos los servicios (auth, booking, artists, payments, notifications)
- [x] `PAYMENTS_SERVICE_URL` y `ARTISTS_SERVICE_URL` en auth-service
- [x] `.env.production.example` actualizado con todas las nuevas vars
- [ ] Configurar URL de callback en el panel de Tilopay (producción)
- [ ] Reemplazar credenciales de prueba por credenciales de producción de Tilopay

---

## ✅ Pre-lanzamiento

- [ ] Backup completo de todas las bases de datos
- [ ] Tests end-to-end del flujo completo: reserva → pago anticipo → auto-cobro → payout
- [ ] Tests del flujo no-show: reporte → disputa → 24h → acciones automáticas
- [ ] Tests de cancelación: dentro de 48h (50%) y después de 48h (bloqueada)
- [ ] Tests de regla 60km: ≤60km (3h mínimo) y >60km (24h mínimo)

**Tilopay (completar antes del lanzamiento en Centroamérica):**
- [x] Verificación del OrderHash V2 implementada (`verifyOrderHashV2` en tilopay.provider.ts)
- [ ] Credenciales de producción de Tilopay configuradas
- [ ] URL de callback configurada en panel de Tilopay
- [ ] Revisar logs de SECURITY_WARNING acumulados en callbacks de Tilopay

---

## 📊 Progreso general

| Fase | Estado | Notas |
|------|--------|-------|
| Pre-implementación | ⏳ Pendiente | Solo confirmar credenciales de prueba |
| Migraciones DB | ✅ Completo | booking + artists + payments |
| payments-service | ✅ Completo | Tilopay nativo, handle3DS diferidos — requieren credenciales |
| artists-service | ✅ Completo | shadow-ban endpoint |
| booking-service | ✅ Completo | cancelBooking, reportNoShow, 60km, todos los cron jobs |
| notifications-service | ✅ Completo | no-show templates + 4 nuevos tipos + emails PAYMENT/AUTO_COMPLETE/COMMISSION |
| SDK | ✅ Completo | types provider*, initCheckout, reportNoShow, getMyCredits, Booking/Credit/Payout |
| web-client | ✅ Completo | no-show, anticipo, 60km, créditos, saldo restante; sdk_tpay + 3DS diferidos |
| web-artist | ✅ Completo | shadow ban, no-show banner + link a quejas en detalle booking, nuevos estados |
| web-admin | ✅ Completo | payouts, shadow ban, commission rules, ARTIST_NO_SHOW filter, no-shows tab artista |
| Env vars | ✅ Completo | USD, PLATFORM_FEE_PERCENTAGE, INTERNAL_SERVICE_SECRET, Tilopay placeholders |
| Pre-lanzamiento | ⏳ Pendiente | |
