# Production Fintech SaaS Audit — Branch `dave`

**Fecha:** 2026-05-25  
**Rama:** `dave` vs `main`  
**Scope:** ~300 archivos — web-artist, web-client, web-admin, gateway, 8 microservicios backend, infra K8s/Docker  
**Metodología:** 5 auditorías paralelas especializadas (integridad financiera, PII/privacidad, infraestructura/secrets, autorización/API, observabilidad/resiliencia)

---

## Tabla de contenidos

1. [Hallazgos Críticos](#críticos)
2. [Hallazgos Altos](#altos)
3. [Hallazgos Medios](#medios)
4. [Hallazgos Bajos](#bajos)
5. [Observaciones positivas](#positivas)
6. [Vulnerabilidades previas (resueltas)](#previas)
7. [Tracker de estado](#tracker)

---

## Críticos

---

### INF-C1: Credenciales reales comprometidas en archivo trackeado por git

**Archivo:** `infra/docker/docker-compose.dev.yml`

El archivo está trackeado en git y contiene credenciales de producción activas:

- `RESEND_API_KEY: RESEND_KEY_REDACTED`
- `TIKTOK_CLIENT_SECRET: REDACTED`
- `CLOUDINARY_API_SECRET: REDACTED`
- `TILOPAY_API_KEY: REDACTED` / `TILOPAY_API_SECRET: REDACTED`

Cualquier persona con acceso al repositorio tiene acceso completo a estos servicios.

**Fix:** Rotar todas las credenciales de inmediato. Reemplazar valores con `${VAR_NAME}` y cargar desde un secrets manager o archivo `.env` no trackeado. Agregar el archivo a `.gitignore`.

---

### INF-C2: Credenciales en el historial de git (dev-secrets.yaml)

**Archivo:** `infra/k8s/overlays/local/dev-secrets.yaml` (eliminado en commit `fdb7721`, pero presente en la historia)

El archivo contenía Tilopay, Firebase y TikTok secrets. Un `git clone` + `git log -p` los expone completos.

**Fix:** Rotar credenciales. Ejecutar `git filter-repo` o BFG Repo Cleaner para reescribir la historia y forzar que todos los colaboradores re-clonen.

---

### INF-C3: Firebase API key hardcodeada como ARG default en Dockerfiles

**Archivos:** `apps/web-client/web/Dockerfile:15`, `apps/web-artist/web/Dockerfile:15`

```dockerfile
ARG NEXT_PUBLIC_FIREBASE_API_KEY=AIza...REDACTED
```

Los build ARG con default quedan en los metadatos de la imagen (`docker history --no-trunc`). El valor también pasa a `ENV`, por lo que está en la capa final. Además queda en el historial de git.

**Fix:** Eliminar el default hardcodeado. Inyectar el valor en CI via `--build-arg NEXT_PUBLIC_FIREBASE_API_KEY=${{ secrets.FIREBASE_API_KEY }}`. Restringir la key en Firebase Console por dominio.

---

### INF-C4: Credenciales de admin comprometidas en `credenciales-demo.md`

**Archivo:** `credenciales-demo.md` (git-trackeado)

Contiene `admin@piums.com / Admin1234!` y 20 cuentas de prueba con contraseñas en texto plano. Si estas cuentas existen en producción con esas contraseñas, cualquier persona con acceso al repo tiene acceso admin.

**Fix:** `git rm credenciales-demo.md`. Resetear contraseñas de todas estas cuentas en producción si existen.

---

### FIN-C1: Monto de pago viene del frontend — el servidor lo acepta sin recalcular

**Archivo:** `services/payments-service/src/controller/payment.controller.ts:63–84`

```typescript
const { bookingId, amount, ... } = req.body;
if (!amount || amount <= 0) return res.status(400).json(...);
const result = await paymentService.initCheckout({ bookingId, amount, ... });
```

`initCheckout` pasa `data.amount` directamente al proveedor (Tilopay/Stripe) sin cargar el booking ni comparar contra `booking.totalPrice`. Un cliente puede enviar `amount: 1` para una reserva de $500 y obtener un enlace de pago por $0.01.

**Fix:** Dentro de `initCheckout`, cargar el booking y usar `booking.anticipoRequired ? booking.anticipoAmount : booking.totalPrice`. Rechazar cualquier `amount` que no coincida.

---

### FIN-C2: Stripe webhook no es idempotente — doble procesamiento en retry

**Archivo:** `services/payments-service/src/routes/webhook.routes.ts:34–75`

El handler crea el `WebhookEvent` y procesa el evento de inmediato sin verificar si ya fue procesado. Si Stripe hace retry (timeout de red, respuesta lenta), `markPayment` se llama dos veces: el `paidAmount` del booking se incrementa el doble y se lanza un segundo payout al artista.

```typescript
await prisma.webhookEvent.create({ ... });      // no unique constraint check
await handlePaymentIntentSucceeded(event);       // siempre ejecuta
```

**Fix:** Antes del switch, verificar:
```typescript
const existing = await prisma.webhookEvent.findFirst({
  where: { stripeEventId: event.id, processed: true }
});
if (existing) return res.json({ received: true });
```
Agregar unique constraint en `webhookEvent.stripeEventId`.

---

### FIN-C3: Race condition en `markPayment` — read-modify-write sin lock

**Archivo:** `services/booking-service/src/services/booking.service.ts:1512–1554`

```typescript
const booking = await this.getBookingById(id);
const newPaidAmount = booking.paidAmount + amount;   // lectura
await prisma.booking.update({ data: { paidAmount: newPaidAmount } });  // escritura
```

Sin lock ni transacción. Si el callback server-side de Tilopay y la confirmación del redirect del cliente llaman `markPayment` concurrentemente para el mismo booking, `paidAmount` se incrementa dos veces.

**Fix:** Usar increment atómico de Prisma: `data: { paidAmount: { increment: amount } }`, luego re-leer el booking para determinar el nuevo status.

---

### PII-C1: La eliminación de cuenta es un stub de UI — no se borra ningún dato

**Archivo:** `apps/web-client/web/src/app/profile/delete/page.tsx:50–54`

```typescript
// TODO: Call API to delete account
// await sdk.deleteAccount({ password });
setTimeout(() => { toast.success('Cuenta eliminada correctamente'); }, 2000);
```

El botón espera 2 segundos, muestra éxito y redirige a `/`. **Ningún dato es eliminado.** Todo el PII del usuario (nombre, email, documentNumber, URLs de documentos KYC, historial de bookings) permanece intacto en la base de datos.

**Fix:** Implementar `DELETE /api/users/me` que: verifique la contraseña actual, anonimice o hard-delete el PII en auth-service, users-service y Cloudinary, y revoque todas las sesiones activas.

---

### PII-C2: Endpoint de upload de documentos KYC completamente sin autenticación

**Archivos:** `services/users-service/src/routes/users.routes.ts:88`, `apps/gateway/src/routes/index.ts:165–172`

```typescript
// Sin authenticateToken, sin verifyMagicBytes:
router.post("/documents/upload", upload.single('file'), handleMulterError, uploadDocument);
```

Cualquier cliente HTTP anónimo puede: (a) subir archivos arbitrarios disfrazados de imágenes (el `fileFilter` confía en el `Content-Type` del request, no en magic bytes), (b) usar el endpoint como proxy de upload a Cloudinary sin cuenta, (c) generar uploads huérfanos que nunca se pueden vincular a un usuario ni eliminar ante una solicitud de borrado.

**Fix:** Agregar `authenticateToken` y `verifyMagicBytes` a esta ruta. Si se necesita para el flujo de registro pre-auth, usar un token de sesión de corta vida emitido al inicio del onboarding.

---

### API-C1: Catalog service acepta `artistId` del body — cualquiera puede modificar el catálogo de cualquier artista

**Archivo:** `services/catalog-service/src/controller/catalog.controller.ts:116,149,165,181,199,216`

Todos los endpoints mutantes (`PUT /services/:id`, `DELETE /services/:id`, `PATCH /services/:id/toggle-status`, `PUT /addons/:addonId`, `DELETE /addons/:addonId`, etc.) toman `artistId` del `req.body` e ignoran completamente `req.user.id`:

```typescript
const { artistId } = req.body;   // del cliente, no del JWT
const service = await catalogService.updateService(id, artistId, data);
```

Un atacante con cualquier JWT válido puede poner `artistId` de otra persona y modificar, eliminar, o despublicar todos sus servicios.

**Fix:** Resolver el artist ID desde el JWT: `const artistId = await catalogClient.getArtistIdByAuthId(req.user.id)`. Ignorar cualquier `artistId` del request body.

---

### API-C2: `blockSlot` acepta `artistId` del body — cualquier usuario puede sabotear el calendario de cualquier artista

**Archivo:** `services/booking-service/src/controller/booking.controller.ts:348–362`

```typescript
const validatedData = blockSlotSchema.parse(req.body);  // artistId viene del body
const slot = await bookingService.blockSlot({ ...validatedData });  // sin verificar ownership
```

Contraste con `unblockSlot` (línea 381) que sí resuelve el artistId correctamente via `this.resolveArtistId(req.user!.id)`.

**Fix:** Aplicar el mismo patrón que `unblockSlot`: resolver `artistId` server-side y sobrescribir el valor del body.

---

### OPS-C1: `chargeToken` de Tilopay ignora `res.ok` — errores HTTP pasan silenciosamente

**Archivo:** `services/payments-service/src/providers/tilopay.provider.ts:174–191`

Tras el `try/catch` de red, `chargeToken` llama `await res.json()` sin verificar `res.ok`. Un HTTP 400/500 de Tilopay se interpreta como un decline legítimo en lugar de un error del proveedor. La causa raíz (token expirado, request mal formado) es invisible.

**Fix:** Agregar el mismo guard que `createCheckout` (línea 60): `if (!res.ok) throw new Error(...)` antes de parsear el body.

---

### OPS-C2: Explosión de connection pool — 50+ instancias de `PrismaClient`

**Archivos:** `services/payments-service/src/index.ts` y múltiples route/service files en todos los servicios

Cada instancia de Prisma abre su propio pool de conexiones (default 10). `payments-service` solo ya tiene ~10 instancias → hasta 100 conexiones DB. Con múltiples pods en K8s, esto agota el `max_connections` de PostgreSQL.

Crítico: `services/users-service/src/routes/users.routes.ts:37,57,77` y `services/search-service/src/routes/search.routes.ts:24` crean `new PrismaClient()` **dentro del request handler** — un pool nuevo por request.

**Fix:** Exportar un singleton `prisma` compartido por servicio. Configurar `?connection_limit=5` en `DATABASE_URL` o usar PgBouncer. Eliminar las instanciaciones por-request de inmediato.

---

### OPS-C3: SIGTERM llama `process.exit(0)` sin drenar requests en vuelo (7 servicios)

**Archivos:** `apps/gateway/src/index.ts:101–108` y los `index.ts` de auth-service, artists-service, users-service, catalog-service, notifications-service, chat-service

```typescript
process.on("SIGTERM", () => {
  process.exit(0);  // cierra inmediatamente, requests en vuelo se cortan
});
```

Durante un rolling deploy en K8s, los pods reciben SIGTERM y terminan inmediatamente. Los clientes reciben connection-reset. Solo `search-service` llama `server.close(callback)` correctamente.

**Fix:** En todos los servicios:
```typescript
process.on("SIGTERM", () => {
  httpServer.close(() => { prisma.$disconnect(); process.exit(0); });
});
```
Configurar `terminationGracePeriodSeconds: 30` en el deployment de K8s.

---

## Altos

---

### INF-H1: Nginx define zonas de rate limiting pero nunca las aplica

**Archivo:** `infra/nginx/nginx.conf:222–223`

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;
```

Cero directivas `limit_req` aparecen en cualquier bloque `server` o `location`. Las zonas son código muerto — nginx no aplica rate limiting.

**Fix:** Agregar `limit_req zone=api_limit burst=20 nodelay;` en los bloques `/api/` y `limit_req zone=login_limit burst=3 nodelay;` en un bloque explícito para `/api/auth/login`.

---

### INF-H2: Todos los contenedores corren como root

**Archivos:** Todos los `services/*/Dockerfile` + `infra/k8s/base/deployments.yaml`

Ningún Dockerfile de los servicios backend crea un usuario no-root ni usa `USER`. Los deployments de K8s no tienen ningún bloque `securityContext` (`runAsNonRoot`, `allowPrivilegeEscalation`, `readOnlyRootFilesystem`). Solo `apps/web-admin/web/Dockerfile` lo implementa correctamente.

**Fix:** En cada Dockerfile agregar antes del `CMD`:
```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```
En `deployments.yaml` agregar `securityContext: { runAsNonRoot: true, allowPrivilegeEscalation: false }` a cada container.

---

### INF-H3: `/api/health` público filtra topología interna, URLs de servicios y métricas

**Archivo:** `apps/gateway/src/routes/health.ts:15–79`

El endpoint público (sin auth) devuelve: URLs internas de cada servicio (`http://auth-service:4001`), `process.uptime()`, `process.memoryUsage()`, latencia por servicio y mensajes de error de conectividad. El auth-service expone `environment: process.env.NODE_ENV` en su health.

**Fix:** Proteger `/api/health` con auth admin-only o restringirlo a red interna. El endpoint público debe devolver únicamente `{ status, timestamp }`.

---

### INF-H4: `prisma db push` corre al inicio de pods en producción

**Archivos:** `services/catalog-service/Dockerfile`, `services/reviews-service/Dockerfile`, `services/notifications-service/Dockerfile`, `services/search-service/Dockerfile`

`prisma db push` es una herramienta de sincronización destructiva que puede eliminar columnas silenciosamente durante deployments. No debe usarse en producción bajo ninguna circunstancia.

**Fix:** Todos los servicios deben usar `prisma migrate deploy` exclusivamente. Nunca `prisma db push` en producción.

---

### FIN-H1: Tilopay double-payment — dos paths llaman `markPayment` para el mismo pago

**Archivos:** `services/payments-service/src/routes/callback.routes.ts`, `services/payments-service/src/services/payment.service.ts:760–843`

El callback server-side de Tilopay y la confirmación del redirect del cliente (`confirmTilopayRedirect`) ambos llaman `bookingClient.markPayment`. El guard de idempotencia usa claves distintas en cada path (`orderId` vs `orderNumber`), por lo que no se activa y ambas llamadas procesan el pago de forma independiente.

**Fix:** Normalizar la clave de idempotencia a `orderNumber` en ambos paths. Mover el guard de duplicación a la capa de `bookingClient.markPayment` con un unique constraint en `(bookingId, providerRef)`.

---

### FIN-H2: `POST /api/payouts/:id/process` — cualquier usuario autenticado puede disparar payouts ajenos

**Archivo:** `services/payments-service/src/routes/payout.routes.ts:145–152`

El endpoint solo usa `authenticateToken` sin verificar rol ni ownership. Cualquier cliente puede marcar cualquier payout como PROCESSING. Del mismo modo, `GET /api/payouts/artists/:artistId` no valida que el caller sea el artista o un admin.

**Fix:** Agregar verificación de rol: `if (req.user.role !== 'admin') return 403`. Para los endpoints de consulta, validar que `req.user.id` corresponda al `artistId`.

---

### FIN-H3: `POST /api/payouts` — no valida ownership del `artistId`

**Archivo:** `services/payments-service/src/controller/payout.controller.ts:8–47`

```typescript
const { artistId, amount } = req.body;
// Sin verificar que req.user.id === artistId o que sea admin
const payout = await payoutService.createPayout({ artistId, amount });
```

Cualquier usuario autenticado puede crear payouts en nombre de cualquier artista con cualquier monto.

**Fix:** Restringir la ruta a admin-only, o validar que `req.user.id` corresponda al `artistId` proporcionado.

---

### FIN-H4: Race condition en refunds — el available amount no se chequea atómicamente

**Archivo:** `services/payments-service/src/services/payment.service.ts:362–435`

```typescript
const payment = await prisma.payment.findUnique({ ... });       // lee
const availableForRefund = payment.amount - refundedAmount;    // calcula
const stripeRefund = await stripeProvider.createRefund(...);   // llama Stripe (externo)
await prisma.refund.create({ ... });                           // escribe
```

Dos requests concurrentes de refund para el mismo pago ambas pasan el check, ambas llaman Stripe, y ambas crean registros. El total reembolsado puede superar el monto original.

**Fix:** Envolver todo en una `prisma.$transaction`, recalcular `availableForRefund` dentro de la transacción y abortar si ya es 0.

---

### FIN-H5: La redención de cupones es fire-and-forget — si falla, el cupón puede reutilizarse

**Archivo:** `services/booking-service/src/services/booking.service.ts:276–283`

```typescript
paymentsClient.redeemCoupon({...}).catch(err =>
  logger.warn('Error redimiendo cupón', ...)  // el booking ya está creado
);
```

El booking se crea con el descuento aplicado, pero `redeemCoupon` (que incrementa `currentUses`) falla silenciosamente. El cupón puede usarse de nuevo en la siguiente reserva.

**Fix:** Llamar `redeemCoupon` antes de persistir el booking, dentro de una transacción. O implementar un job de reconciliación con retry que alerte en caso de fallo.

---

### FIN-H6: `couponCode` es silenciosamente descartado por el schema — los cupones no se aplican

**Archivo:** `services/booking-service/src/schemas/booking.schema.ts`

`createBookingSchema` no incluye `couponCode`. Zod elimina campos desconocidos por default, por lo que el `couponCode` que envía el frontend es descartado. La lógica de cupones en `createBooking` siempre recibe `couponCode: undefined` — los descuentos mostrados en el UI nunca se aplican server-side.

**Fix:** Agregar `couponCode: z.string().optional()` a `createBookingSchema`.

---

### PII-H1: Emails de usuarios loggeados a nivel INFO en múltiples servicios

**Archivos:** `services/auth-service/src/controller/auth.controller.ts:83,221,289,903`, `services/users-service/src/services/users.service.ts:98`, `services/notifications-service/src/providers/email.provider.ts:136,163,183`

```typescript
logger.info("Login exitoso", "AUTH_CONTROLLER", { userId: user.id, email });
logger.info("Email sent via Resend", "EMAIL_PROVIDER", { to: options.to, subject: ... });
```

En producción, `email` se convierte en un campo indexado y buscable en cualquier log aggregator (Datadog, ELK). No hay política de retención documentada.

**Fix:** Reemplazar `email: user.email` con `userId: user.id` en logs operacionales. Si se necesita para debug, usar `email_hash: sha256(email)` o nivel DEBUG (suprimido en producción).

---

### PII-H2: Emails en `console.log` en booking-service (ignora LOG_LEVEL)

**Archivo:** `services/booking-service/src/utils/notifications.ts:144,147,156,159`

```typescript
.then(() => console.log(`[NOTIF] booking-created-client → ${data.clientEmail}`))
```

Llamadas raw de `console.log` con emails en texto plano en cada booking. No pueden suprimirse con `LOG_LEVEL` — siempre emiten a stdout en producción.

**Fix:** Reemplazar con `logger.debug('[NOTIF] booking-created-client sent', ..., { bookingId })`.

---

### PII-H3: `changePassword` no invalida sesiones existentes

**Archivo:** `services/auth-service/src/services/password.service.ts:247–312`

`resetPassword()` revoca correctamente todas las sesiones y refresh tokens. Pero `changePassword()` (usuario autenticado que cambia su propia contraseña) solo actualiza `passwordHash` — no llama `session.updateMany` ni `refreshToken.updateMany`. Si el token de un usuario fue robado y el usuario lo detecta y cambia su contraseña, el atacante mantiene acceso hasta que el JWT expire (15 min) o el refresh token expire (7 días).

**Fix:** Al final de `changePassword()`, llamar `tokenService.revokeAllUserTokens(userId)` y emitir un nuevo token para la sesión actual.

---

### PII-H4: `/auth/verify` retorna URLs públicas de documentos KYC sin chequeo de revocación de JTI

**Archivo:** `services/auth-service/src/controller/auth.controller.ts:415–458`

El endpoint devuelve `documentNumber`, `documentFrontUrl`, `documentBackUrl`, `documentSelfieUrl` a cualquier servicio que llame con un JWT válido, sin verificar si la sesión está revocada en la tabla `sessions`. Las URLs de Cloudinary son permanentes y públicas.

**Fix:** (1) Agregar chequeo `prisma.session.findUnique({ where: { jti, status: 'ACTIVE' } })`. (2) Eliminar los campos de documentos de la respuesta de `verify` — los callers solo necesitan `id`, `email`, `role`, `status`. (3) Migrar los documentos a Cloudinary `type: 'private'` con URLs firmadas y con expiración.

---

### PII-H5: El borrado de cuenta admin no elimina documentos KYC ni anonimiza historial

**Archivo:** `services/auth-service/src/controller/admin.controller.ts:222–258`

El admin delete hace hard-delete en auth-service pero no: elimina los documentos en Cloudinary, anonimiza bookings y pagos en otros servicios, ni elimina registros en auditLog. Los soft-deleted de users-service nunca se purgan.

**Fix:** El handler de borrado debe: (a) llamar a Cloudinary `destroy` para las 3 URLs KYC, (b) anonimizar booking/payment records reemplazando el userId con un tombstone, (c) implementar un job de purga para soft-deletes de más de 30 días.

---

### API-H1: `changeStatus` sin state machine — transiciones a estados terminales desde cualquier estado

**Archivo:** `services/booking-service/src/services/booking.service.ts:1400–1507`

El método solo verifica *quién* puede hacer la transición, no *desde qué estado* es válida. Un artista puede marcar como `COMPLETED` una reserva `CANCELLED_CLIENT` o poner `NO_SHOW` en una reserva `COMPLETED`, disparando el flow de payout y emails aunque el servicio nunca se prestó.

**Fix:** Implementar un mapa de transiciones permitidas:
```typescript
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  IN_PROGRESS: ['CONFIRMED', 'PAYMENT_COMPLETED', 'FULLY_PAID'],
  COMPLETED:   ['IN_PROGRESS'],
  NO_SHOW:     ['CONFIRMED', 'PAYMENT_COMPLETED', 'IN_PROGRESS'],
};
```

---

### API-H2: `getBookingStats` — lógica de autorización incorrecta, filtra datos de cualquier usuario

**Archivo:** `services/booking-service/src/controller/booking.controller.ts:428–449`

```typescript
if (artistId && artistId !== userId && clientId && clientId !== userId) {
  return res.status(403).json(...);
}
```

La condición solo bloquea cuando *ambos* parámetros están presentes y ninguno coincide. Si solo se envía `artistId`, el `&&` falla y la request pasa. Cualquier usuario puede consultar ingresos y estadísticas de cualquier artista o cliente.

**Fix:** Verificar cada parámetro de forma independiente: `if (artistId && artistId !== resolvedArtistId) return 403`.

---

### API-H3: `updateArtistConfig` compara auth ID contra artist-profile ID — siempre falla o es bypass

**Archivo:** `services/booking-service/src/controller/booking.controller.ts:405–424`

```typescript
const artistId = req.params.artistId;   // UUID de artist profile
const userId   = req.user!.id;          // UUID de auth-service (namespace distinto)
if (artistId !== userId) return 403;    // siempre true para usuarios legítimos
```

Los artistas legítimos no pueden actualizar su propia config. Alguien cuyo auth ID coincida con el artist-profile ID de otra persona podría hacerlo.

**Fix:** Resolver el artist ID desde el JWT: `const resolvedArtistId = await this.resolveArtistId(req.user!.id)`.

---

### API-H4: `getPendingReports` de reviews no tiene chequeo de rol admin (TODO no implementado)

**Archivo:** `services/reviews-service/src/controller/review.controller.ts:162–174`

```typescript
async getPendingReports(req: AuthRequest, ...) {
  // TODO: Verificar que el usuario es admin
  const result = await reviewService.getPendingReports(page, limit, estado);
```

Cualquier usuario autenticado puede ver todos los reportes de reviews pendientes con sus detalles privados.

**Fix:** Agregar `if (req.user.role !== 'admin') return next(new AppError(403, 'Admin only'))` y eliminar el TODO.

---

### API-H5: Review permitida en estado `CONFIRMED` — antes de que el servicio se preste

**Archivo:** `services/reviews-service/src/services/review.service.ts:30–33`

```typescript
const allowedStatuses = ["CONFIRMED", "ACCEPTED", "PAYMENT_COMPLETED", "COMPLETED"];
```

Un cliente puede dejar una reseña negativa inmediatamente después de confirmar la reserva, antes de que el artista actúe. Permite manipulación de rating combinada con posterior cancelación.

**Fix:** Restringir a `["COMPLETED", "DELIVERED", "FULLY_PAID"]` como mínimo.

---

### OPS-H1: No hay correlation/trace ID en ningún servicio

**Archivos:** Todos los `src/utils/logger.ts`, `apps/gateway/src/index.ts`

Cero servicios generan ni propagan `x-request-id`. Cuando falla una confirmación de booking, es imposible correlacionar el log del gateway, booking-service, payments-service y notifications-service — no comparten ningún identificador.

**Fix:** Agregar middleware en el gateway que genere `req.id = uuid()` e inyecte `x-request-id` en todos los proxies. Incluir `requestId` en cada log entry. Usar `AsyncLocalStorage` para propagarlo dentro de cada servicio.

---

### OPS-H2: Sin timeouts en llamadas inter-servicio de booking-service y payments-service

**Archivos:** `services/booking-service/src/clients/payments.client.ts`, `services/booking-service/src/clients/notifications.client.ts`

Todos los `fetch()` en estos clients carecen de `signal: AbortSignal.timeout(N)`. Si payments-service o notifications-service están lentos, los endpoints de booking se cuelgan indefinidamente, agotando el event loop de Node.

**Fix:** Agregar `signal: AbortSignal.timeout(5000)` a todos los `fetch()` en los clients de booking-service y payments-service.

---

### OPS-H3: No hay outbox transaccional — si `markPayment` falla, el pago queda huérfano

**Archivos:** `services/payments-service/src/routes/callback.routes.ts`, `services/payments-service/src/routes/webhook.routes.ts`

Si `bookingClient.markPayment()` falla dentro del handler del webhook de Stripe o del callback de Tilopay, el pago queda como `SUCCEEDED` en payments-service pero el booking permanece en `PENDING_PAYMENT` indefinidamente. No hay retry queue, ni reconciliation job, ni tabla outbox.

**Fix:** Implementar una tabla `payment_events_outbox` con un cron de reconciliación que reintente `markPayment` para cualquier `paymentIntent` en estado `SUCCEEDED` cuyo booking siga en `PENDING_PAYMENT`. Alternativamente, devolver non-200 al proveedor si el procesamiento falla para activar el retry nativo.

---

### OPS-H4: 8 servicios sin handler de `unhandledRejection`

Solo booking-service y catalog-service registran `process.on("unhandledRejection")`. Los 8 restantes no lograrán nada y pueden crashear silenciosamente en Node.js ≥15.

**Fix:** Agregar en cada `src/index.ts`:
```typescript
process.on("unhandledRejection", (reason: any) => {
  logger.error("Unhandled rejection", "PROCESS", { reason: reason?.message });
});
```

---

## Medios

---

### INF-M1: Límite global del gateway por defecto es 2000 req/15min — no está en el configmap de K8s

**Archivo:** `apps/gateway/src/middleware/rateLimiter.ts:7`, `infra/k8s/base/configmap.yaml`

El default del código es 2000 req/15min. `.env.production.example` define 50, pero `configmap.yaml` no incluye `RATE_LIMIT_MAX_REQUESTS`. En producción el gateway corre con el default permisivo del código.

**Fix:** Agregar `RATE_LIMIT_MAX_REQUESTS: "100"` al configmap de K8s.

---

### INF-M2: Secrets de K8s solo en base64, sin cifrado en reposo ni RBAC

**Archivos:** `infra/k8s/base/secrets.yaml`, `infra/k8s/base/deployments.yaml`

Los K8s Secrets son solo base64 (no cifrado). Sin `EncryptionConfiguration` en el API server, están en texto plano en etcd. No existe ningún manifiesto de `ServiceAccount`, `Role` o `RoleBinding` — los pods usan la cuenta default con permisos potencialmente amplios.

**Fix:** Habilitar cifrado en reposo en etcd. Adoptar External Secrets Operator. Crear ServiceAccounts dedicadas con RBAC mínimo por deployment.

---

### INF-M3: Todas las imágenes de producción usan tag `:latest`

**Archivos:** `infra/k8s/base/deployments.yaml` (11 deployments), `.env.production.example:129`

`:latest` no es reproducible — un pull puede traer una imagen diferente sin aviso. Combina riesgo de supply chain con pérdida de auditabilidad.

**Fix:** Pinear a digest SHA o semver. Etiquetar imágenes en CI con el git SHA.

---

### INF-M4: Origins `localhost` en el configmap de producción de K8s

**Archivo:** `infra/k8s/base/configmap.yaml:24`

`ALLOWED_ORIGINS` incluye `http://localhost:3000,http://localhost:3001,http://localhost:3002` en el configmap base (producción). Cualquier página servida desde localhost puede hacer requests cross-origin credenciados a la API de producción.

**Fix:** Eliminar todos los origins `localhost` del configmap base. Mantenerlos solo en el overlay `local/`.

---

### INF-M5: `pathRewrite` del proxy de upload de documentos está roto

**Archivo:** `apps/gateway/src/routes/index.ts:165–172`

```typescript
pathRewrite: { "^/": "/api/users/documents/upload" }
```

Esto reescribe `/api/users/documents/upload` como `/api/users/documents/upload/api/users/documents/upload` — doble path. El endpoint también llega sin auth (ver PII-C2).

**Fix:** Corregir a `{ "^/api/users/documents/upload": "/documents/upload" }`.

---

### INF-M6: `/api/ticket-events` y `/api/ticket-purchases` sin auth en el gateway

**Archivo:** `apps/gateway/src/routes/index.ts:320–337`

Ambas rutas se proxean sin `authMiddleware` en el gateway. El comentario dice "auth applied per route" pero no hay garantía de que todos los endpoints write estén protegidos en el servicio.

**Fix:** Agregar `authMiddleware` en el gateway, dejando que el servicio omita la verificación selectivamente para endpoints de lectura pública.

---

### FIN-M1: La comisión de la plataforma tiene valor distinto en shared-config vs runtime

**Archivos:** `packages/shared-config/src/currency.ts:12`, `services/payments-service/src/services/payout.service.ts:8`

`shared-config` define `PLATFORM_FEE_PERCENT: 10` (10%) pero `payout.service.ts` usa `parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || "18")` — 18% como fallback. La constante del shared-config no se usa en ningún cálculo financiero. Si el env var no está seteado, la comisión cambia silenciosamente.

**Fix:** Eliminar el fallback del código y fallar loudly al startup si `PLATFORM_FEE_PERCENTAGE` no está definido. Borrar la constante sin usar de shared-config.

---

### FIN-M2: El monto de la confirmación del redirect de Tilopay viene del URL — puede manipularse

**Archivo:** `services/payments-service/src/services/payment.service.ts:764–786`

```typescript
async confirmTilopayRedirect(data: { amount: string; ... }) {
  const amountCents = Math.round(parseFloat(data.amount) * 100);
  await bookingClient.markPayment(data.bookingId, amountCents, ...);
}
```

`amount` viene de los parámetros del URL de redirect (retransmitidos por el frontend). Un cliente puede modificar el valor en la URL antes de llamar este endpoint.

**Fix:** Ignorar `data.amount` del redirect. Obtener el monto esperado de la DB: cargar el booking o el `paymentIntent` por `bookingId` y usar el monto registrado.

---

### FIN-M3: No-show credit se emite aunque `paidAmount = 0`

**Archivo:** `services/booking-service/src/services/booking.service.ts:1099–1105`

Si un artista hace no-show en una reserva impaga, `createCredit` emite un mínimo de `$20.00` al cliente aunque nunca pagó nada.

**Fix:** Agregar `if (booking.paidAmount > 0)` antes de llamar `createCredit`.

---

### FIN-M4: `transfer` y `paypal` como métodos de pago redirigen a confirmación sin notificación al backend

**Archivo:** `apps/web-client/web/src/app/booking/checkout/page.tsx:202–205`

```typescript
if (paymentMethod === 'transfer' || paymentMethod === 'paypal') {
  router.push(`/booking/confirmation/${bookingId}`);
  return;
}
```

El booking queda en `PENDING` indefinidamente hasta revisión manual. No hay notificación ni mecanismo de seguimiento. Si el admin no lo revisa, nunca avanza.

---

### PII-M1: `savedCardToken` de Tilopay almacenado en texto plano

**Archivos:** `services/booking-service/prisma/schema.prisma:149`, `services/booking-service/src/services/cron.service.ts:76,86`

El hash de tarjeta de Tilopay (referencia para cargos recurrentes) se guarda en texto plano en el campo `savedCardToken` del booking. Es una credencial sensible que habilita cargos futuros.

**Fix:** Cifrar con AES-256-GCM y una clave gestionada por KMS antes de persistir.

---

### PII-M2: Email incluido en las claims del JWT (PII en token base64-decodable)

**Archivo:** `services/auth-service/src/services/token.service.ts`

El payload del JWT incluye `email`. Cualquier parte que intercepte el token (logs de browser, analytics, herramientas de red) puede decodificarlo. El gateway también logea `decoded.email` a nivel INFO por cada request de artista.

**Fix:** Eliminar `email` del JWT payload. Usar solo `id`. Los servicios que necesiten el email deben consultarlo con el userId.

---

### PII-M3: Tilopay error response body loggeado — puede incluir las credenciales enviadas

**Archivo:** `services/payments-service/src/utils/tilopay-token-cache.ts:35`

```typescript
logger.error('Tilopay token request failed', ..., { status: res.status, body });
```

Si Tilopay devuelve las credenciales en la respuesta de error, `TILOPAY_API_SECRET` aparecería en los logs.

**Fix:** Logear solo el status code: `{ status: res.status }`.

---

### PII-M4: `getMe` y `updateProfile` devuelven URLs permanentes públicas de documentos KYC

**Archivo:** `services/auth-service/src/controller/auth.controller.ts:657–765`

Las URLs de Cloudinary de documentos de identidad son permanentes y accesibles sin autenticación. Si existe cualquier XSS en el cliente, puede exfiltrar estas URLs.

**Fix:** Almacenar documentos en Cloudinary con `access_mode: 'authenticated'` y devolver URLs firmadas con expiración corta. La respuesta de `getMe` debería devolver `documentUploaded: boolean` en lugar de la URL.

---

### PII-M5: Soft-delete en users-service deja PII indefinidamente

**Archivo:** `services/users-service/src/services/users.service.ts:191–206`

`deleteUser` solo setea `deletedAt`. El email, teléfono, nombre, bio y direcciones permanecen en la DB para siempre. No hay job de purga.

**Fix:** Implementar un job que tras N días (p.ej. 30) anonimice o hard-delete los registros soft-deleted: sobrescribir `email` con UUID placeholder, nullear `telefono`, `bio`, eliminar `addresses`.

---

### PII-M6: Ningún middleware de auth verifica la revocación de sesiones por JTI

**Archivos:** Todos los `middleware/auth.middleware.ts` de los servicios

La tabla `sessions` tiene campo `status` (`ACTIVE`/`REVOKED`) y los refresh tokens tienen `isRevoked`, pero ningún middleware verifica esto — solo validan la firma del JWT. Un logout revoca el refresh token pero el access token sigue válido hasta expirar (15 min). Un admin que banea un usuario no puede invalidar su JWT activo.

**Fix:** Para operaciones sensibles (pagos, configuración de cuenta), agregar lookup de JTI en `sessions`. Con cache LRU en memoria para no añadir latencia por request.

---

### API-M1: `updateAddon` pasa `data: any` sin validar directamente a Prisma

**Archivos:** `services/catalog-service/src/controller/catalog.controller.ts:216`, `catalog.service.ts:556–577`

```typescript
const { artistId, ...data } = req.body;   // data sin validar
const addon = await catalogService.updateAddon(addonId, artistId, data);
```

Un atacante puede pasar `serviceId`, `createdAt` o cualquier campo escribible en Prisma para re-parentar el addon o manipular timestamps.

**Fix:** Aplicar `addonUpdateSchema.parse(data)` antes de pasarlo al servicio.

---

### API-M2: `sortBy` de query string pasa sin validar a Prisma `orderBy`

**Archivo:** `services/booking-service/src/services/booking.service.ts:480–488`

```typescript
orderBy: { [filters.sortBy || 'scheduledDate']: sortOrder } as any,
```

Prisma rechaza campos desconocidos con error de runtime (no SQL injection), pero expone la estructura del modelo en mensajes de error.

**Fix:** Validar contra allowlist explícita: `['scheduledDate', 'createdAt', 'totalPrice', 'status']`.

---

### API-M3: `reportNoShow` sin período de gracia — puede dispararse al segundo de la hora agendada

**Archivo:** `services/booking-service/src/services/booking.service.ts:998–1082`

```typescript
if (booking.scheduledDate > new Date()) throw new AppError(...);
```

Un cliente puede reportar no-show exactamente 1 segundo después de la hora de inicio. El artista puede estar en camino.

**Fix:** Requerir `scheduledDate + durationMinutes * 60 * 1000 + bufferMs < now` con un buffer razonable (p.ej. 30 minutos).

---

### API-M4: Ticket purchase sin límite de cantidad por order

**Archivo:** `services/booking-service/src/services/ticket-event.service.ts:180–225`

La reserva de asientos ocurre antes de la validación del cupón. Si la validación del cupón falla después de que la transacción commitea, los asientos quedan decrementados sin purchase válido. Además, no hay validación de `quantity` contra `maxPerOrder` en el schema antes del decremento.

**Fix:** Mover la validación del cupón dentro de la transacción. Agregar `maxPerOrder` a `TicketTier` y validarlo en la transacción.

---

### OPS-M1: Crons corren en todos los pods — riesgo de ejecución duplicada con HPA

**Archivos:** `services/booking-service/src/services/cron.service.ts:616–651`, `services/payments-service/src/index.ts`

Con múltiples réplicas, cada pod ejecuta los crons independientemente. El mismo booking puede auto-completarse dos veces, enviando dos emails de confirmación y dos payout holds.

**Fix:** Usar un distributed lock de Redis (`SET NX EX`) por ejecución de cron. O desplegar un pod dedicado de cron de una sola réplica separado de los pods de API.

---

### OPS-M2: 87 llamadas raw de `console.error/log/warn` en código de producción

**Archivos:** Todos los `*.client.ts` en payments-service, booking-service, reviews-service; `notifications-service/src/middleware/errorHandler.ts:48`

Las llamadas raw de `console` no son parseables por aggregators JSON. Errores críticos de pago emitidos por `console.error` son invisibles en Datadog/ELK.

**Fix:** Reemplazar todos los `console.error(...)` en `src/` con `logger.error(...)`. Es un find-and-replace mecánico en ~20 archivos.

---

### OPS-M3: `chat-service` logger siempre emite texto plano

**Archivo:** `services/chat-service/src/utils/logger.ts`

A diferencia de todos los demás servicios, el logger de chat-service emite formato de texto (`[INFO] [context] message`) independientemente del entorno. Sus logs no pueden parsearse por ningún aggregator.

---

### OPS-M4: Sin timeout en el fetch del token de Tilopay

**Archivo:** `services/payments-service/src/utils/tilopay-token-cache.ts:27–31`

`fetch()` a `TILOPAY_API_URL/login` no tiene `AbortSignal`. Si el endpoint de auth de Tilopay está lento, todas las operaciones de pago se bloquean indefinidamente.

**Fix:** `signal: AbortSignal.timeout(10000)` en el fetch del login.

---

## Bajos

---

### INF-L1: `--no-frozen-lockfile` en 3 Dockerfiles de servicios

**Archivos:** `services/payments-service/Dockerfile:14`, `services/catalog-service/Dockerfile`, `services/booking-service/Dockerfile`

Permite resolución silenciosa de dependencias distintas entre builds. Los demás servicios usan correctamente `--frozen-lockfile`.

**Fix:** Cambiar a `--frozen-lockfile` en los tres.

---

### INF-L2: `trust proxy: 1` puede miscalcular la IP del cliente

**Archivo:** `apps/gateway/src/index.ts:17`

Si hay más de un hop de proxy en producción (cloud LB → K8s ingress → gateway), el rate limiter aplica sobre la IP del ingress en lugar de la del cliente real.

**Fix:** Auditar el número de hops reales en producción y ajustar el valor.

---

### INF-L3: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` no está en ningún configmap ni Dockerfile

**Archivo:** `apps/web-client/web/src/app/booking/checkout/page.tsx:18–19`

La variable no está en el Dockerfile de web-client ni en el configmap de K8s. Stripe no carga en producción.

---

### FIN-L1: `completePayout` permite completar desde estado `PENDING` sin pasar por `PROCESSING`

**Archivo:** `services/payments-service/src/services/payout.service.ts:140`

Un payout puede marcarse como completado directamente desde PENDING, saltando el paso de PROCESSING. Esto elimina el audit trail de `PENDING → PROCESSING → COMPLETED`.

---

### PII-L1: AuthContext logea email del usuario en `console.log` del browser

**Archivo:** `apps/web-artist/web/src/contexts/AuthContext.tsx:136`

```typescript
console.log("[AUTH] Usuario autenticado:", userData?.email, "Role:", userData?.role);
```

El email queda en la consola del navegador, accesible para cualquier payload XSS o extensión del browser.

**Fix:** Cambiar a `console.log("[AUTH] Session verified", userData?.role)`.

---

### PII-L2: Token de reset de contraseña retornado en el objeto de respuesta del servicio

**Archivo:** `services/auth-service/src/services/password.service.ts:85–95`

El token en raw (antes de hashear) forma parte del return value del service junto con `user.email`. Si futuro código devolviera este objeto directamente en la respuesta HTTP, el token quedaría expuesto.

**Fix:** Pasar el token directamente al `notificationsClient` dentro del service y no incluirlo en el return value.

---

### API-L1: Ownership check en `getBookingById` se salta si `req.user` es undefined

**Archivo:** `services/booking-service/src/controller/booking.controller.ts:67–86`

```typescript
const userId = req.user?.id;                                      // puede ser undefined
if (userId && booking.clientId !== userId && ...) return 403;    // && falla silenciosamente
```

Si la ruta fuera accesible sin auth, el check de ownership no se ejecutaría. Mismo patrón en `getBookingByCode` y `downloadBookingPDF`.

**Fix:** Asegurar la ruta con `authenticateToken`. Dentro del handler, usar `req.user!.id` en lugar de `req.user?.id`.

---

### API-L2: Confirmación de token de reschedule no es atómica

**Archivo:** `services/booking-service/src/services/booking.service.ts:2536–2611`

El token se confirma leyendo el `rescheduleRequest` y luego actualizando su status. Sin lock de fila, dos requests concurrentes con el mismo token pueden ambas pasar el check de status antes de que ninguna actualice.

**Fix:** `prisma.rescheduleRequest.updateMany({ where: { confirmationToken: token, status: 'PENDING_CLIENT' }, data: { status: 'CONFIRMED' } })` y verificar `count > 0`.

---

### OPS-L1: Debug log gateado por `NODE_ENV` en algunos servicios, por `LOG_LEVEL` en otros

**Archivos:** Múltiples loggers de servicios

Imposible habilitar debug logging en producción para un servicio específico sin cambiar `NODE_ENV`, lo cual tiene otros efectos.

**Fix:** Estandarizar todos los loggers a usar `LOG_LEVEL` env var.

---

### OPS-L2: Cron de pagos crea `new PrismaClient()` dentro del `setInterval` sin `finally($disconnect)`

**Archivo:** `services/payments-service/src/index.ts:118–155`

Un pool nuevo se abre cada 24h. `$disconnect()` solo se llama si no hay excepción antes.

**Fix:** Usar el singleton prisma compartido. Si se usa uno propio, envolverlo en `try/finally`.

---

## Positivas

- Hashing de contraseñas con bcrypt cost 12 — ninguna contraseña en texto plano.
- Tokens de reset de contraseña: solo se guarda el hash SHA-256 en la DB; el token raw solo va por email.
- Rotación de refresh tokens: el token anterior se revoca antes de emitir el nuevo.
- `resetPassword()` sí revoca todas las sesiones y refresh tokens correctamente.
- Tilopay webhook V2 usa `timingSafeEqual` (HMAC-SHA256) — resistente a timing attacks.
- Stripe webhook verifica firma antes de procesar.
- Precios calculados server-side en `booking-service` vía `catalogClient.calculatePrice` — el frontend solo envía `serviceId`.
- Descuentos de cupones no pueden reducir el total por debajo de $0: `Math.max(0, totalPrice - couponDiscount)`.
- `getConversation()` en chat-service verifica membership antes de cualquier operación.
- `isAdmin` middleware verifica explícitamente `decoded.role !== 'admin'` con 403.
- `verifyMagicBytes` aplicado en uploads de portafolio y avatares — no solo confía en el MIME header.
- Endpoints internos entre microservicios protegidos con `INTERNAL_SERVICE_SECRET`.
- `redeemCoupon()` tiene optimistic-lock correcto (corregido en pasada anterior).
- Auth cookies usan `httpOnly: true` y `sameSite: strict`.
- La infraestructura de revocación de sesiones existe (tabla `sessions` con JTI) — solo falta usarla en el middleware.
- JTI incluido en el JWT y trackeado en `sessions` — la plomería para revocación granular ya está.
- Audit log comprensivo: `AuditLog` captura login, cambios de contraseña y acciones admin.

---

## Vulnerabilidades previas (resueltas en esta rama)

### Vuln A: Privilege escalation via Firebase login

**Archivo:** `services/auth-service/src/controller/auth.controller.ts`  
**Resuelto:** `effectiveRole` ahora usa `user.role` de la DB. Clientes que acceden el app artista se actualizan a `ambos`. No se emite JWT de artista para usuarios puros `cliente`.

### Vuln B: Race condition en límite global de cupones

**Archivo:** `services/payments-service/src/services/coupon.service.ts`  
**Resuelto:** `redeemCoupon()` re-verifica `maxUses` dentro de la transacción + optimistic-lock `WHERE currentUses = <valor_leído>`.

---

## Tracker de estado

| ID | Severidad | Categoría | Descripción breve | Estado |
|---|---|---|---|---|
| INF-C1 | **Crítico** | Infra | Credenciales reales en docker-compose.dev.yml trackeado | **Resuelto** (usuario) |
| INF-C2 | **Crítico** | Infra | dev-secrets.yaml con credenciales en historial de git | **Resuelto** (usuario) |
| INF-C3 | **Crítico** | Infra | Firebase API key como ARG default en Dockerfiles | **Resuelto** (usuario) |
| INF-C4 | **Crítico** | Infra | credenciales-demo.md con passwords de admin en git | **Resuelto** (usuario) |
| FIN-C1 | **Crítico** | Financiero | Monto de pago viene del frontend sin recalcular server-side | **Resuelto** — `initCheckout` usa `serverAmount` calculado de `booking.totalPrice`/`anticipoAmount` |
| FIN-C2 | **Crítico** | Financiero | Stripe webhook no idempotente — doble procesamiento en retry | **Resuelto** — guard `findFirst({ stripeEventId, processed: true })` antes de procesar |
| FIN-C3 | **Crítico** | Financiero | `markPayment` race condition read-modify-write en paidAmount | **Resuelto** — `prisma.$transaction` con `{ increment: amount }` atómico |
| PII-C1 | **Crítico** | Privacidad | Account deletion es un stub de UI — no se borra PII | **Resuelto** — `DELETE /auth/me` en auth-service + route Next.js + page actualizada |
| PII-C2 | **Crítico** | Privacidad | Upload de documentos KYC sin autenticación ni magic bytes | **Resuelto** — `authenticateToken` + `verifyMagicBytes` añadidos; proxies Next.js forwardean token |
| API-C1 | **Crítico** | API/Auth | Catalog service acepta artistId del body — IDOR masivo | **Resuelto** — `resolveArtistId(req.user.id)` en los 10 métodos mutantes del controller |
| API-C2 | **Crítico** | API/Auth | blockSlot acepta artistId del body — sabotaje de calendario | **Resuelto** — `this.resolveArtistId(req.user!.id)` sobreescribe el body |
| OPS-C1 | **Crítico** | Ops | chargeToken de Tilopay no verifica res.ok | **Resuelto** — guard `if (!res.ok)` añadido en `tilopay.provider.ts` |
| OPS-C2 | **Crítico** | Ops | 50+ instancias PrismaClient — explosión de connection pool | **Resuelto** (parcial) — singleton en `users-service/routes/users.routes.ts`; pendiente revisión systémica |
| OPS-C3 | **Crítico** | Ops | SIGTERM drops requests en 7 servicios sin drenar | **Resuelto** — `server.close(() => process.exit(0))` en auth, artists, users, catalog, notifications, payments, chat |
| INF-H1 | **Alto** | Infra | Nginx rate limit zones definidas pero nunca aplicadas | **Resuelto** — `limit_req` aplicado en bloques `/api/` y `/api/auth/` en nginx.conf |
| INF-H2 | **Alto** | Infra | Todos los contenedores corren como root | **Resuelto** — `USER node` añadido antes de `CMD` en los 14 Dockerfiles |
| INF-H3 | **Alto** | Infra | /api/health público filtra topología y métricas internas | **Resuelto** — eliminados `url`, `error`, `memory`, `uptime` de la respuesta del gateway health |
| INF-H4 | **Alto** | Infra | prisma db push en startup de pods de producción | **Resuelto** — `prisma migrate deploy` en 4 Dockerfiles (catalog, reviews, notifications, search) |
| FIN-H1 | **Alto** | Financiero | Tilopay double-payment: dos paths llaman markPayment | **Resuelto** — clave de idempotencia unificada en `callback.routes.ts` (ver DR-H2) |
| FIN-H2 | **Alto** | Financiero | Cualquier usuario puede disparar payouts ajenos | **Resuelto** — guard `role !== 'admin'` en `createPayout`, `processPayout`, `getArtistPayouts`, `getArtistPayoutStats` |
| FIN-H3 | **Alto** | Financiero | POST /api/payouts sin validación de ownership de artistId | **Resuelto** — incluido en el guard admin de FIN-H2 |
| FIN-H4 | **Alto** | Financiero | Race condition en refunds — available amount no atómico | **Resuelto** — `createRefund` reestructurado: pre-check → `prisma.$transaction` crea registro PENDING como lock → Stripe call fuera de tx |
| FIN-H5 | **Alto** | Financiero | Redención de cupones fire-and-forget — puede reutilizarse | **Resuelto** — `redeemCoupon` en `booking.service.ts` cambió de `.catch(warn)` a `await` con try/catch |
| FIN-H6 | **Alto** | Financiero | couponCode descartado por schema — cupones nunca se aplican | **Resuelto** — `couponCode: z.string().optional()` añadido a `createBookingSchema` |
| PII-H1 | **Alto** | Privacidad | Emails de usuarios loggeados a INFO en múltiples servicios | **Resuelto** — email reemplazado por userId en logs de auth.controller, gateway/routes y gateway/middleware |
| PII-H2 | **Alto** | Privacidad | Emails en console.log en booking-service notifications | **Resuelto** — todos los `console.log/error` en `notifications.ts` reemplazados por `logger.info/error` sin email |
| PII-H3 | **Alto** | Privacidad | changePassword no invalida sesiones existentes | **Resuelto** — `changePassword` en password.service.ts revoca todas las sesiones y refresh tokens activos |
| PII-H4 | **Alto** | Privacidad | /auth/verify devuelve KYC URLs sin chequeo de revocación | **Resuelto** — campos KYC eliminados de la respuesta de `verify`; chequeo JTI fail-open (permite paso si no existe registro, deniega solo si sesión está REVOKED/EXPIRED) |
| PII-H5 | **Alto** | Privacidad | Admin delete no elimina documentos Cloudinary ni anonimiza historial | **Resuelto** — users-service internal delete limpia avatar+coverPhoto; endpoint `/internal/cloudinary-purge` añadido; admin delete llama purge con KYC URLs; audit logs anonimizados (userId→null) antes del hard delete |
| API-H1 | **Alto** | API/Auth | changeStatus sin state machine — transiciones a estados terminales | **Resuelto** — `ALLOWED_TRANSITIONS` map en `changeStatus` de booking.service.ts |
| API-H2 | **Alto** | API/Auth | getBookingStats leak — single-param queries bypass authorization | **Resuelto** — chequeos independientes por parámetro; bypass para admin |
| API-H3 | **Alto** | API/Auth | updateArtistConfig compara auth ID vs artist-profile ID — siempre falla | **Resuelto** — `resolveArtistId(req.user!.id)` en booking.controller.ts |
| API-H4 | **Alto** | API/Auth | getPendingReports sin chequeo de rol admin (TODO nunca implementado) | **Resuelto** — `if (req.user.role !== 'admin') return next(new AppError(403, 'Admin only'))` |
| API-H5 | **Alto** | API/Auth | Review permitida en estado CONFIRMED — antes del servicio | **Resuelto** — `allowedStatuses` restringido a `["COMPLETED", "PAYMENT_COMPLETED", "FULLY_PAID"]` |
| OPS-H1 | **Alto** | Ops | Sin correlation ID en ningún servicio | **Resuelto** — middleware `requestId` en gateway: genera `x-request-id` UUID, lo propaga downstream vía proxy y lo logea en cada request |
| OPS-H2 | **Alto** | Ops | Sin timeouts en llamadas inter-servicio | **Resuelto** — `AbortSignal.timeout(10_000)` añadido a 53 llamadas fetch en 15 archivos de clientes (todos los servicios) |
| OPS-H3 | **Alto** | Ops | Sin outbox transaccional — pago huérfano si markPayment falla | **Mitigado** — `RECONCILIATION_NEEDED` log estructurado con datos de replay si markPayment retorna null (Stripe + Tilopay paths). Outbox completo: deferred post-MVP |
| OPS-H4 | **Alto** | Ops | 8 servicios sin handler de unhandledRejection | **Resuelto** — añadido en auth, artists, users, catalog, notifications, payments, chat, reviews, search |
| INF-M1 | Medio | Infra | Gateway default 2000 req/15min no configurado en K8s configmap | **Resuelto** — `RATE_LIMIT_MAX_REQUESTS: "100"` añadido al configmap base |
| INF-M2 | Medio | Infra | K8s Secrets solo base64, sin cifrado en reposo ni RBAC | Pendiente — requiere cambio de infra (EncryptionConfiguration en etcd) |
| INF-M3 | Medio | Infra | Imágenes de producción con tag :latest | **Mitigado** — `imagePullPolicy: Always` añadido a los 11 Deployments en base (fuerza re-pull). Tags pinned por SHA requieren cambio en pipeline CI/CD (deferred) |
| INF-M4 | Medio | Infra | Origins localhost en configmap de producción de K8s | **Resuelto** — eliminados localhost:3000/3001/3002 de `ALLOWED_ORIGINS` en configmap base |
| INF-M5 | Medio | Infra | pathRewrite de upload de documentos roto (double path) | Pendiente — análisis indica que el comportamiento de Express puede ser correcto; requiere prueba de integración |
| INF-M6 | Medio | Infra | ticket-events y ticket-purchases sin auth en el gateway | **Resuelto** — `authMiddleware` añadido a ambas rutas en gateway/routes/index.ts |
| FIN-M1 | Medio | Financiero | Comisión de plataforma inconsistente entre shared-config y runtime | **Resuelto** — warning en startup si env var no definido; shared-config corregido a 18% |
| FIN-M2 | Medio | Financiero | Monto del redirect de Tilopay viene del URL — manipulable | **Resuelto** — `confirmTilopayRedirect` ignora `data.amount`; carga booking para calcular monto real |
| FIN-M3 | Medio | Financiero | No-show credit emitido aunque paidAmount = 0 | **Resuelto** — `if (booking.paidAmount > 0)` guard añadido antes de `createCredit` |
| FIN-M4 | Medio | Financiero | transfer/paypal no notifica al backend — booking queda en PENDING | Pendiente — requiere trabajo de feature (notificación manual pendiente admin) |
| PII-M1 | Medio | Privacidad | savedCardToken de Tilopay en texto plano | **Resuelto** — AES-256-GCM implementado en `utils/token-encrypt.ts`; encripta al guardar, desencripta al leer. Requiere `PAYMENT_TOKEN_KEY` (64 hex chars) en producción |
| PII-M2 | Medio | Privacidad | Email en claims del JWT (PII en token base64) | **Resuelto** — `email` eliminado de `AccessTokenPayload` y de todos los `signAccessToken` calls; eliminado de los 10 auth middlewares (servicios + gateway); rutas OAuth de callback llaman `/api/auth/me` para obtener email desde DB; `userEmail` removido del payment controller (fallback a `noreply@piums.io`); ticket purchase obtiene email desde users-service internamente |
| PII-M3 | Medio | Privacidad | Error body de Tilopay loggeado — puede incluir credenciales | **Resuelto** — eliminado `body` del log de error en tilopay-token-cache.ts; solo se logea `status` |
| PII-M4 | Medio | Privacidad | getMe devuelve URLs públicas permanentes de documentos KYC | **Mitigado** — nuevas subidas usan `type: 'authenticated'` en Cloudinary; `getSignedDocumentUrl()` genera URLs firmadas con expiración de 1h; endpoint `/users/internal/cloudinary-sign` disponible. Documentos existentes requieren migración Cloudinary (deferred) |
| PII-M5 | Medio | Privacidad | Soft-delete en users-service sin purge job | **Resuelto** — `purge.service.ts` en users-service: anonimiza usuarios con `deletedAt > 90 días` (email→`deleted_id@purged.invalid`, PII→null, Cloudinary limpiado). Corre diario vía `setInterval` y una vez al startup |
| PII-M6 | Medio | Privacidad | Ningún middleware verifica revocación de sesiones por JTI | **Resuelto (parcial)** — `GET /auth/internal/sessions/:jti` en auth-service; `jtiVerifier.ts` con cache 60s en booking-service y payments-service; `requireActiveSession` aplicado a rutas sensibles (POST /bookings, PATCH /bookings/:id/status, POST ticket-purchase, POST /checkout, POST /ticket-checkout, POST /payouts). Fail-open si auth-service no responde o si no existe registro de sesión (compatibilidad con tokens emitidos antes del deploy). Solo deniega si la sesión existe con status REVOKED/EXPIRED. |
| API-M1 | Medio | API/Auth | updateAddon pasa data sin validar a Prisma | **Resuelto** — `addonSchema.parse(req.body)` aplicado en `updateAddon` del catalog controller |
| API-M2 | Medio | API/Auth | sortBy de query sin validar en Prisma orderBy | **Resuelto** — allowlist `SORTABLE_FIELDS` validada en `getBookings` de booking.service.ts |
| API-M3 | Medio | API/Auth | reportNoShow sin período de gracia | **Resuelto** — 30 minutos de gracia: `scheduledDate + 30min > now` lanza AppError |
| API-M4 | Medio | API/Auth | Ticket purchase sin límite de cantidad por order | **Resuelto** — `maxPerOrder Int @default(10)` añadido a `TicketTier`; migración `20260526_ticket_tier_max_per_order`; validación pre-tx + dentro de tx en `initPurchase`; `addTier` acepta `maxPerOrder` (capped 1-100) |
| OPS-M1 | Medio | Ops | Crons en todos los pods — ejecución duplicada con HPA | **Resuelto** — `withCronLock` (Redis SET NX EX) en `distributedLock.ts`; los 9 crons de booking-service y el purge de users-service usan el lock; degrada gracefully si Redis no está disponible |
| OPS-M2 | Medio | Ops | 87 llamadas raw de console.error en código de producción | **Resuelto** — reemplazados en ~13 archivos de clients y controllers (ver commit) |
| OPS-M3 | Medio | Ops | chat-service logger siempre en texto plano | **Resuelto** — logger reescrito: texto plano en dev, JSON estructurado en producción |
| OPS-M4 | Medio | Ops | Sin timeout en fetch del token de Tilopay | **Resuelto** — `AbortSignal.timeout(10000)` añadido al fetch en tilopay-token-cache.ts |
| INF-L1 | Bajo | Infra | --no-frozen-lockfile en 3 Dockerfiles | **Resuelto** — `--frozen-lockfile` en payments-service, catalog-service, booking-service Dockerfiles |
| INF-L2 | Bajo | Infra | trust proxy: 1 puede miscalcular IP del cliente | Nota para ops — auditar número de hops de proxy en producción y ajustar el valor |
| INF-L3 | Bajo | Infra | NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY no está en ninguna config | **Resuelto** — `ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `ENV` añadidos en web-client Dockerfile |
| FIN-L1 | Bajo | Financiero | completePayout permite completar desde PENDING sin pasar por PROCESSING | **Resuelto** — `completePayout` ahora solo acepta estados PROCESSING o SCHEDULED |
| PII-L1 | Bajo | Privacidad | AuthContext logea email en console.log del browser | **Resuelto** — email eliminado del log en web-artist/AuthContext.tsx |
| PII-L2 | Bajo | Privacidad | Token de reset retornado en el objeto de respuesta del service | **Resuelto** — email enviado dentro de `requestPasswordReset`; token removido del valor de retorno |
| API-L1 | Bajo | API/Auth | Ownership check se salta si req.user es undefined (optional chaining) | **Resuelto** — `req.user!.id` en `getBookingById`; admin bypass explícito añadido |
| API-L2 | Bajo | API/Auth | Confirmación de token de reschedule no es atómica | **Resuelto** — `updateMany({ where: { id, status: 'PENDING_CLIENT' } })` + check `count > 0` |
| OPS-L1 | Bajo | Ops | Debug log gateado por NODE_ENV en unos servicios, LOG_LEVEL en otros | **Resuelto** — 6 loggers actualizados: `LOG_LEVEL === 'debug' \|\| NODE_ENV === 'development'` |
| OPS-L2 | Bajo | Ops | Cron de pagos crea PrismaClient dentro de setInterval sin finally | **Resuelto** — singleton `_prismaCron` fuera del interval; eliminado disconnect/finally problemático |
| — | Resuelto | Auth | Firebase login privilege escalation (effectiveRole) | **Resuelto** |
| — | Resuelto | Financiero | Race condition en límite global de cupones (optimistic-lock) | **Resuelto** |

---
## Nuevos hallazgos — Trail of Bits Skills (2026-05-25)

### Variant Analysis

| ID | Severidad | Categoría | Descripción | Estado |
|---|---|---|---|---|
| VA-C1 | **Crítico** | Financiero | `confirmDelivery`: payout hold release era fire-and-forget — artista nunca recibe pago | **Resuelto** — `await paymentsClient.schedulePayoutHold(bookingId, null)` |
| VA-C2 | **Crítico** | Financiero | `resolveDispute(FULL_REFUND)`: refund era fire-and-forget — cliente pierde dinero | **Resuelto** — `await paymentsClient.createRefundInternal(...)` |
| VA-C3 | **Crítico** | Financiero | `resolveDispute(CREDIT)`: crédito era fire-and-forget — crédito nunca emitido | **Resuelto** — `await paymentsClient.createCredit(...)` |
| VA-C4 | **Crítico** | Financiero | `resolveDispute`: reprogramar payout hold era fire-and-forget — timing incorrecto | **Resuelto** — `await paymentsClient.schedulePayoutHold(...)` |
| VA-C5 | **Crítico** | Financiero | `cancelBooking`: reembolso era fire-and-forget — cliente cancela sin reembolso | **Resuelto** — `await paymentsClient.createRefundInternal(...)` |
| VA-C6 | **Crítico** | Financiero | `initCheckout`: `paymentIntent.create` DB con `.catch` silencioso — carga sin registro | **Resuelto** — `.catch` eliminado; error propagado |
| VA-C7 | **Crítico** | Financiero | `markPurchasePaid`/free tickets: `redeemCoupon` con `.catch(() => {})` — cupón reutilizable | **Resuelto** — `await paymentsClient.redeemCoupon(...)` sin catch |
| VA-H1 | **Alto** | Ops | `auth-service/routes/auth.routes.ts:69` — `PrismaClient` dentro del handler (connection pool exhaustion) | **Resuelto** — PrismaClient movido a scope de módulo |
| VA-H2 | **Alto** | Ops | `search-service/routes/search.routes.ts:24` — `PrismaClient` dentro del handler sin `$disconnect` | **Resuelto** — PrismaClient movido a scope de módulo |
| VA-M1 | Medio | Ops | `chat-service`: fetch de push notification sin `res.ok` check — fallo silencioso | **Resuelto** — `if (!pushRes.ok)` con `logger.warn` |
| VA-M2 | Medio | Ops | `google-calendar.client.ts`: `updateEvent`/`deleteEvent` sin `res.ok` — fallos invisibles | **Resuelto** — `res.ok` check + `logger.warn` en ambos métodos |
| VA-L1 | Bajo | Ops | 7 archivos de auth middleware con `console.error` no estructurado en startup | **Resuelto** — reemplazados por `logger.error` con imports añadidos donde faltaban |

### Insecure Defaults

| ID | Severidad | Categoría | Descripción | Estado |
|---|---|---|---|---|
| ID-C1 | **Crítico** | Auth | `SESSION_SECRET` defaultea a `'piums-session-secret'` — permite forjar cookies OAuth | **Resuelto** — startup guard `process.exit(1)` añadido en auth-service/index.ts |
| ID-C2 | **Crítico** | Auth | `INTERNAL_SERVICE_SECRET` en payments-service defaultea a `'dev_internal_secret_piums'` | **Resuelto** — cambiado a `|| ''` (fail-secure) |
| ID-C3 | **Crítico** | Auth | Gateway JWT_SECRET sin startup guard — silently falls back en misconfiguration | **Resuelto** — startup guard añadido en apps/gateway/src/middleware/auth.ts |
| ID-C4 | **Crítico** | Auth | Chat-service JWT_SECRET inline fallback sin startup guard | **Resuelto** — startup guard añadido en chat-service/src/middleware/auth.middleware.ts |
| ID-M1 | Medio | Infra | Credenciales Tilopay ausentes de `infra/k8s/base/secrets.yaml` | **Resuelto** — credenciales presentes en secrets.yaml; TILOPAY_API_URL en configmap |
| ID-M2 | Medio | Financiero | `PLATFORM_FEE_PERCENTAGE` ausente del configmap de producción | **Resuelto** — `PLATFORM_FEE_PERCENTAGE: "18"` añadido a configmap base |

### Supply Chain

| ID | Severidad | Categoría | Descripción | Estado |
|---|---|---|---|---|
| SC-H1 | **Alto** | Supply Chain | `ws@8.18.3` — CVE-2026-45736 (uninitialized memory disclosure) afecta chat-service y 3 web apps | **Resuelto** — pnpm override `"ws@>=8.0.0 <8.20.1": ">=8.20.1"` añadido |
| SC-H2 | **Alto** | Supply Chain | `qs@6.14.2/6.15.0` — CVE-2026-8723 (DoS en stringify) afecta gateway y 10 servicios | **Resuelto** — pnpm override `"qs@>=6.11.1 <6.15.2": ">=6.15.2"` añadido |
| SC-H3 | **Alto** | Supply Chain | `uuid@8/9/10.x` — CVE-2026-41907 (CVSS 7.5) — override previo solo cubría 11.x | **Resuelto** — override extendido a `"uuid@<11.1.1": ">=11.1.1"` |
| SC-H4 | **Alto** | Supply Chain | `multer@1.x` explícitamente deprecated como vulnerable — users-service | **Resuelto** — `multer@^2.0.0`; `streamifier` eliminado y reemplazado por `Readable.from()` nativo |
| SC-M1 | Medio | Supply Chain | `bcrypt@6.0.0` en `apps/web-client` (frontend) — debe estar solo en auth-service | **Resuelto** — bcrypt, express, jsonwebtoken y cors eliminados de `apps/web-client/package.json`; solo quedan deps de frontend legítimas |
| SC-M2 | Medio | Supply Chain | `ts-node-dev` en `dependencies` (no devDependencies) del gateway — entra en imagen de prod | **Resuelto** — ya estaba en devDependencies; hallazgo no aplicable al estado actual |

### Differential Review

| ID | Severidad | Categoría | Descripción | Estado |
|---|---|---|---|---|
| DR-C1 | **Crítico** | Financiero | `confirmTilopayRedirect` marca cualquier booking como pagado sin verificar ownership | **Resuelto** — `if (booking.clientId !== data.userId) throw new AppError(403, ...)` |
| DR-H1 | **Alto** | Auth | Cliente puede auto-upgradear a `role: 'ambos'` enviando `role: 'artista'` en login | **Resuelto** — login/Firebase login solo respetan DB role; sin auto-upgrade para clientes |
| DR-H2 | **Alto** | Financiero | FIN-H1 double-payment aún abierto — nuevo path `confirmTilopayRedirect` usa key diferente | **Resuelto** — `callback.routes.ts:93` cambiado a `ourOrderNumber \|\| orderId` para unificar clave de idempotencia |
| DR-M1 | Medio | Financiero | `initTicketCheckout` capea monto pero no verifica ownership de la compra | **Resuelto** — ownership check añadido: `purchase.clientId !== userId && buyerId !== userId` |
| DR-M2 | Medio | Auth | Firebase login cambiado de `loginLimiter` (10/15min) a `refreshTokenLimiter` (30/5min) | **Resuelto** — restaurado `loginLimiter` en `POST /auth/firebase` |
| DR-L1 | Bajo | Financiero | `completedByAdmin` audit field viene del caller, no del contexto de auth | **Resuelto** — movido de request body a header `x-admin-id` (enviado por auth-service); body ya no acepta `completedByAdmin` |
| DR-L2 | Bajo | API/Auth | `GET /api/bookings/users/:userId/stats` sin autenticación — expone booking count público | **Resuelto** — `authenticateToken` añadido a la ruta |

---

## Pendientes — trabajo futuro

Estos items fueron identificados en el audit pero aplazados. Retomar antes de ir a producción con tráfico real.

### Accionables (solo código)

Todos los items accionables fueron resueltos el 2026-05-26.

| ID | Estado |
|---|---|
| API-M4 | **Resuelto** — ver tracker arriba |
| PII-M6 | **Resuelto (parcial)** — rutas sensibles cubiertos; chequeo JTI fail-open para compatibilidad con tokens pre-deploy; otros servicios (catalog, artists, reviews, users) aún hacen verificación local sin JTI check |
| OPS-M1 | **Resuelto** — ver tracker arriba |

### Requieren infra o refactor mayor

| ID | Descripción | Bloqueante |
|---|---|---|
| ~~PII-M2~~ | ~~Email en claims del JWT~~ | **Resuelto** 2026-05-26 |
| INF-M2 | K8s Secrets sin cifrado en reposo | `EncryptionConfiguration` en etcd — cambio de infra del cluster |
| INF-M3 | Tags `:latest` en producción (`imagePullPolicy: Always` ya aplicado) | Pipeline CI/CD que substituya tag por SHA en cada deploy |
| FIN-M4 | Pagos por transfer/paypal no notifican al backend | Feature de confirmación manual por admin |
| INF-M5 | pathRewrite de upload de documentos (posible double path) | Requiere prueba de integración para confirmar si es bug real |
