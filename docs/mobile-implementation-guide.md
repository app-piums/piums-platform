# Guía de implementación para la versión móvil

Referencia de todo lo implementado en web (pagos → emails) para replicar en la app móvil.

---

## 1. Flujo de reserva y pago

### 1.1 Pasos del flujo

```
1. Cliente elige artista → servicio → fecha/hora → ubicación
2. POST /api/bookings  →  booking creado en estado PENDING
3. POST /api/payments/payment-intents  →  obtiene redirectUrl (Tilopay) o clientSecret (Stripe)
4. Cliente paga
5. Polling cada 3s a GET /api/bookings/:id
   → cuando paymentStatus === 'ANTICIPO_PAID' | 'FULLY_PAID'  →  navegar a confirmación
```

### 1.2 Reglas de negocio al crear una reserva

| Regla | Detalle |
|---|---|
| Verificación de identidad | El cliente debe tener `documentType + documentNumber + documentFrontUrl + documentSelfieUrl` en auth-service. Si no, la API devuelve 403. |
| Anticipo (depósito) | **50%** del `totalPrice`. Campo `anticipoRequired: true`, `anticipoAmount` en centavos. |
| Cancelación cliente | Solo dentro de las **48h desde que se creó** la reserva. Reembolso del 50% del monto pagado. |
| Cancelación artista (CONFIRMED) | Reembolso 100% al cliente + penalización al artista = 9% del `totalPrice`. |
| Tiempo mínimo de anticipación | Por defecto 24h. Si cliente está a ≤ 60km del artista → mínimo 3h. |
| Fee de plataforma | 18% (`PLATFORM_FEE_PERCENTAGE` en payments-service). |

### 1.3 Estados de la reserva (`BookingStatus`)

```
PENDING → CONFIRMED → IN_PROGRESS → COMPLETED
                   ↘ CANCELLED_CLIENT / CANCELLED_ARTIST
                   ↘ NO_SHOW
                   ↘ DISPUTE_OPEN → DISPUTE_RESOLVED
```

### 1.4 Estados de pago (`PaymentStatus`)

```
PENDING → ANTICIPO_PAID → CHARGING_REMAINING → FULLY_PAID
        → FROZEN (disputa abierta)
```

---

## 2. Integración de pagos

### 2.1 Proveedor principal — Tilopay

Tilopay es el proveedor de pagos para Guatemala/Latinoamérica.

**Flujo:**
1. `POST /api/payments/payment-intents` con `{ bookingId, amount, currency, clientCountryCode }`
2. La respuesta incluye `redirectUrl` (URL de Tilopay con el formulario de pago 3DS)
3. **En web:** se embebe en un `<iframe>` dentro de un modal (el usuario nunca sale de piums.io)
4. **En móvil:** usar un **WebView** o **In-App Browser** apuntando al `redirectUrl`
5. Polling al endpoint de la reserva cada 3s hasta que `paymentStatus` cambie

**Variables de entorno requeridas:**
```env
TILOPAY_API_KEY=2642-8042-9400-8913-7001
TILOPAY_API_SECRET=9oR8Gb
TILOPAY_API_USER=GHSjvq
TILOPAY_API_URL=https://app.tilopay.com/api/v1
```

**Nota importante para móvil:** Tilopay redirige a una URL de retorno al terminar el pago. En la app móvil hay que capturar esa redirección en el WebView (escuchar la URL de retorno con un deep link o URL scheme de la app) para saber cuándo cerrar el WebView.

### 2.2 Proveedor secundario — Stripe

Se usa para usuarios fuera de LATAM o como fallback.
- La respuesta del payment-intent incluye `clientSecret` en vez de `redirectUrl`
- En web redirige a `/booking/checkout?bookingId=...` (Stripe Elements)
- En móvil usar el SDK oficial de Stripe para iOS/Android

### 2.3 Detección del proveedor

```typescript
const pi = await sdk.initCheckout(bookingId, amount, currency, clientCountryCode);

if (pi.redirectUrl) {
  // → Tilopay: abrir WebView
} else if (pi.clientSecret) {
  // → Stripe: usar Stripe SDK nativo
}
```

---

## 3. Notificaciones por email

### 3.1 Proveedor — Resend

- **API Key:** configurada en `RESEND_API_KEY` del notifications-service
- **From:** `noreply@piums.io`
- **DNS:** dominio `piums.io` verificado en Resend

### 3.2 Templates disponibles

Todos los templates son HTML con variables `{{variable}}` y bloques `{{#if variable}}...{{/if}}`.

| Template key | Destinatario | Cuándo se envía |
|---|---|---|
| `welcome-client` | Cliente | Al registrarse como cliente |
| `welcome-artist` | Artista | Al registrarse como artista |
| `booking-created-client` | Cliente | Al confirmar el anticipo (no al crear la reserva) |
| `booking-created-artist` | Artista | Al confirmar el anticipo del cliente |
| `booking-confirmed` | Cliente | Cuando el artista confirma la reserva |
| `booking-confirmed-artist` | Artista | Cuando confirma la reserva |
| `booking-reminder-24h` | Cliente | 24h antes del evento (cron) |
| `booking-reminder-2h` | Cliente | 2h antes del evento (cron) |
| `booking-no-show-client` | Cliente | No-show reportado — reembolso + crédito |
| `booking-no-show-artist` | Artista | No-show reportado — 24h para responder |
| `payment-confirmation` | Cliente | Pago procesado |
| `document-review-alert` | Admin | Documentos de identidad subidos |
| `password-reset` | Usuario | Recuperación de contraseña |
| `email-verification` | Usuario | Verificación de email |

### 3.3 Cómo enviar un email desde un servicio backend

Todos los servicios llaman al `notifications-service` con el header `x-internal-secret`:

```http
POST http://notifications-service:4007/api/notifications/send-template-email
Content-Type: application/json
x-internal-secret: {INTERNAL_SERVICE_SECRET}

{
  "to": "usuario@gmail.com",
  "template": "booking-created-client",
  "variables": {
    "bookingCode": "PIU-2026-000027",
    "clientName": "Dave Y",
    "artistName": "Dave X",
    "bookingDate": "viernes, 10 de mayo de 2026",
    "bookingTime": "03:00 p. m.",
    "serviceName": "Set de DJ para eventos",
    "totalPrice": "$1,250.00",
    "location": "Ciudad de Guatemala, Zona 10",
    "bookingUrl": "https://client.piums.io/bookings/abc123",
    ...
  }
}
```

### 3.4 Variables comunes de los templates de reserva

```typescript
bookingCode        // "PIU-2026-000027"
clientName         // nombre del cliente
clientEmail        // email del cliente
clientInitial      // primera letra del nombre
artistName         // nombre del artista
artistCategory     // categoría del artista
artistImage        // URL de foto del artista
serviceName        // nombre del servicio
bookingDate        // "viernes, 10 de mayo de 2026"
bookingTime        // "03:00 p. m."
duration           // "2 horas"
location           // dirección del evento
servicePrice       // "$1,250.00"
totalPrice         // "$1,250.00"
depositAmount      // "$625.00" (50% del totalPrice, si anticipoRequired)
bookingUrl         // https://client.piums.io/bookings/:id
dashboardUrl       // https://artist.piums.io/artist/dashboard
acceptUrl          // URL para que el artista acepte
rejectUrl          // URL para que el artista rechace
currentYear        // 2026
```

---

## 4. Comunicación entre servicios (interno)

### 4.1 Patrón de autenticación interna

Ningún servicio backend llama a otro con un JWT de usuario. Usan el header:

```
x-internal-secret: {INTERNAL_SERVICE_SECRET}
```

En dev: `dev_internal_secret_piums`

### 4.2 Endpoints internos clave

| Servicio | Endpoint | Descripción |
|---|---|---|
| `auth-service:4001` | `GET /internal/users/:authId/identity-status` | Verifica si el usuario tiene documentos de identidad |
| `auth-service:4001` | `GET /internal/users/:authId/info` | Obtiene email + nombre del usuario |
| `users-service:4002` | `GET /api/users/internal/by-auth/:authId` | Perfil completo del usuario desde piums_users |
| `users-service:4002` | `DELETE /api/users/internal/by-auth/:authId` | Elimina perfil (llamado desde admin) |
| `artists-service:4003` | `PATCH /artists/internal/by-auth/:authId/shadow-ban` | Suspender/reactivar artista |
| `notifications-service:4007` | `POST /api/notifications/send-template-email` | Enviar email con template HTML |
| `booking-service:4008` | `GET /api/bookings/internal/:id` | Obtener booking sin auth (inter-servicios) |

### 4.3 Fallback para datos de usuario

Cuando se necesita el email de un usuario en un servicio backend:
1. Buscar primero en `users-service` (piums_users DB) — tiene perfil completo
2. Si 404 → buscar en `auth-service` con el endpoint `/info` (piums_auth DB) — tiene email básico

Algunos usuarios solo existen en piums_auth (registro incompleto). La app móvil debe contemplar este caso en el onboarding.

---

## 5. Subdominios y URLs

| App | URL |
|---|---|
| App cliente (web) | `https://client.piums.io` |
| App artista (web) | `https://artist.piums.io` |
| Panel admin | `https://admin.piums.io` |
| Backend/API Gateway | `https://backend.piums.io` |
| Email from | `noreply@piums.io` |
| Soporte | `soporte@piums.io` |

En la app móvil los deep links y URLs de retorno de Tilopay deben apuntar al scheme de la app (ej. `piums://`), no a `client.piums.io`.

---

## 6. Puertos de los servicios (desarrollo local)

| Servicio | Puerto |
|---|---|
| gateway | 3000 |
| auth-service | 4001 |
| users-service | 4002 |
| artists-service | 4003 |
| catalog-service | 4004 |
| payments-service | 4005 |
| notifications-service | 4007 |
| booking-service | 4008 |
| search-service | 4009 |
| postgres | 5433 (externo) / 5432 (interno Docker) |
| redis | 6379 |

---

## 7. Bases de datos

Cada servicio tiene su propia base de datos en la misma instancia de Postgres:

| DB | Servicio dueño |
|---|---|
| `piums_auth` | auth-service — usuarios, sesiones, documentos de identidad |
| `piums_users` | users-service — perfiles, direcciones, favoritos |
| `piums_artists` | artists-service — perfiles de artista, portfolios |
| `piums_catalog` | catalog-service — servicios, categorías, precios |
| `piums_bookings` | booking-service — reservas, disputas, reprogramaciones |
| `piums_payments` | payments-service — intents de pago, reembolsos, créditos, comisiones |
| `piums_notifications` | notifications-service — notificaciones in-app, templates |

---

## 8. Checklist para la app móvil

### Autenticación
- [ ] Login / Registro → `POST /api/auth/login`, `POST /api/auth/register`
- [ ] JWT en header: `Authorization: Bearer {token}`
- [ ] Refresh token: `POST /api/auth/refresh`
- [ ] Verificación de identidad antes de crear reservas (mostrar pantalla de upload)

### Flujo de reserva
- [ ] Buscar artistas → `GET /api/search/artists`
- [ ] Ver perfil + servicios del artista
- [ ] Verificar disponibilidad → `POST /api/bookings/check-availability`
- [ ] Crear reserva → `POST /api/bookings`
- [ ] Iniciar pago → `POST /api/payments/payment-intents`
- [ ] **Tilopay:** abrir WebView con `redirectUrl`, capturar URL de retorno con deep link
- [ ] **Stripe:** usar Stripe SDK nativo con `clientSecret`
- [ ] Polling de `paymentStatus` hasta `ANTICIPO_PAID` | `FULLY_PAID`
- [ ] Confirmación de reserva

### Notificaciones push
- [ ] Configurar Firebase Cloud Messaging (FCM)
- [ ] El notifications-service ya soporta `push` como canal (campo `pushNotifications` en users-service)
- [ ] Registrar FCM token del dispositivo al login

### Gestión de reservas
- [ ] Listar reservas del cliente / artista
- [ ] Ver detalle de reserva
- [ ] Cancelar reserva (dentro de 48h para cliente)
- [ ] Reportar no-show → `POST /api/bookings/:id/no-show`
- [ ] Chat de la reserva

### Panel del artista (si aplica)
- [ ] Ver reservas pendientes
- [ ] Confirmar / rechazar reserva
- [ ] Gestión de disponibilidad

---

## 9. Reglas de no-show (pendiente de implementar — ver plan)

> Definido en `/docs/planpagos.md` y en el plan activo. **No implementado aún** en producción.

- Cliente reporta no-show → `POST /api/bookings/:id/no-show`
- Se crea una `Dispute` de tipo `ARTIST_NO_SHOW`
- Artista tiene 24h para responder
- Si no responde: reembolso 100% + crédito de compensación (max(18% del pago, $20)) + shadow ban
- Si admin resuelve a favor del artista: sin penalización

---

*Última actualización: 2026-05-07*
