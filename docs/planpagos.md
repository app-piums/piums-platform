# Plan de Integración de Pagos — Piums Platform

## Resumen ejecutivo

Sistema de pagos dual que enruta automáticamente entre **Tilopay** (Centroamérica) y **Stripe** (resto del mundo) según el país del artista. Todo en **USD**. Método de pago: **solo tarjeta**. Incluye sistema de comisiones configurable por admin (18% default).

**Modelo de pagos:** Piums recibe el 100% del pago del cliente. Piums paga al artista por separado (payout manual desde el panel de admin o via transferencia bancaria). Los artistas no necesitan cuentas en Tilopay ni Stripe Connect — solo Piums opera como comercio en ambos proveedores.

---

## Proveedores y cobertura

| Proveedor | Países | Moneda | Quién es el comercio |
|-----------|--------|--------|----------------------|
| **Tilopay** | GT, CR, PA, HN, SV, NI, DO, CO | USD | Piums |
| **Stripe** | US, CA, EU, y resto del mundo | USD | Piums |

**Regla de routing:** se usa `Artist.country` para determinar qué proveedor procesa el cobro al cliente. El dinero llega siempre a la cuenta de Piums.

**Payout al artista:** Piums calcula el neto (totalPaid - comisión - penalizaciones) y lo registra como `Payout PENDING`. El admin lo procesa manualmente (transferencia bancaria, cheque, etc.) y lo marca como `COMPLETED` en el panel. No se usa Tilopay split ni Stripe Connect.

---

## Flujo completo de reserva + pago

El pago está integrado directamente en el ciclo de vida de la reserva. Hay dos tipos de pago según la configuración del artista: **anticipo** (pago parcial al reservar) o **pago completo** (100% al reservar).

### Estados de la reserva relacionados al pago

```
PENDING              → reserva creada, esperando confirmación del artista
CONFIRMED            → artista confirmó (o autoConfirm=true)
PAYMENT_PENDING      → esperando que el cliente pague el anticipo
PAYMENT_COMPLETED    → anticipo o pago completo recibido, reserva activa
IN_PROGRESS          → día del evento
DELIVERED            → artista marcó el servicio como entregado
                        (inicia ventana de 24h para el cliente)
DISPUTE_OPEN         → cliente reportó un problema dentro de las 24h
                        (pago congelado, admin interviene)
DISPUTE_RESOLVED     → admin resolvió la disputa
                        (deriva a COMPLETED o a reembolso)
COMPLETED            → confirmado por cliente o por timeout de 24h
                        (cobro del restante + payout al artista liberado)
CANCELLED_*          → cancelada (puede generar reembolso)
REJECTED             → rechazada por artista
```

### Estados de pago de la reserva

```
PENDING              → sin pago
ANTICIPO_PAID        → anticipo pagado, saldo restante pendiente
                        (tarjeta guardada para cobro automático)
FULLY_PAID           → pago completo recibido
REFUNDED             → reembolso total
PARTIALLY_REFUNDED   → reembolso parcial
FROZEN               → pago congelado por disputa activa
```

---

### Flujo completo — Reserva con anticipo

```
[CLIENTE]                    [FRONTEND]                   [BACKEND]

1. Busca artista y elige fecha
                              → POST /bookings
                                                           → Crea booking status=PENDING
                                                             (o CONFIRMED si autoConfirm)
                                                             paymentStatus=PENDING
                                                             NO crea payment intent aún

2. Recibe confirmación del artista (o automática)
                              ← notificación: "reserva confirmada, procede al pago"

3. Va al checkout /booking/checkout?bookingId=xxx
                              → GET /bookings/:id
                                                           ← devuelve booking con
                                                              anticipoAmount, totalPrice

4. Hace clic en "Pagar anticipo" (o "Pagar total")
                              → POST /payments/payment-intents
                                { bookingId, paymentType: ANTICIPO }
                                                           → Resuelve Artist.country
                                                           → Elige proveedor (Tilopay/Stripe)
                                                           → Crea payment intent
                                                           ← { provider, redirectUrl? | clientSecret? }

5a. Si provider = tilopay:
                              → window.location.href = redirectUrl
                              [usuario paga en Tilopay]
                              ← GET /booking/confirmation/<bookingId>?code=1&tpt=xxx

                              → POST /payments/tilopay-confirm
                                { orderNumber, tpt, code, orderHash }
                                                           → Valida code=1
                                                           → Registra Payment
                                                           → marca booking paymentStatus=ANTICIPO_PAID
                                                           → Bloquea disponibilidad del artista
                                                           → Notifica artista y cliente

5b. Si provider = stripe:
                              [usuario llena CardElement]
                              → stripe.confirmCardPayment(clientSecret)
                              ← stripe webhook payment_intent.succeeded
                                                           → Registra Payment
                                                           → marca booking paymentStatus=ANTICIPO_PAID
                                                           → Bloquea disponibilidad del artista
                                                           → Notifica artista y cliente

6. Muestra /booking/confirmation/<bookingId> con resumen
```

### Flujo — Guardar tarjeta al pagar anticipo

```
Al pagar el anticipo el cliente consiente guardar la tarjeta:
  Tilopay: se envía subscription:1 en processPaymentFAC
           → Tilopay devuelve crd token en el redirect
           → se guarda en booking.savedCardToken

  Stripe:  se crea SetupIntent junto al PaymentIntent
           → se guarda paymentMethodId en booking.savedCardToken

La tarjeta guardada se usa exclusivamente para cobrar el saldo restante.
```

### Flujo — Finalización del servicio y cobro del restante

```
[El evento ocurre]

ARTISTA marca "Servicio entregado"
  → booking: IN_PROGRESS → DELIVERED
  → paymentStatus: ANTICIPO_PAID → FROZEN (congelado hasta resolución)
  → Sistema notifica al cliente (push + in-app):
    "¿Recibiste el servicio? Confirma o reporta un problema. Tienes 24h."

CLIENTE tiene 24 horas:

  ┌── Confirma recepción
  │     → booking: DELIVERED → COMPLETED
  │     → cobro automático del restante con tarjeta guardada
  │     → si cobro exitoso: paymentStatus = FULLY_PAID
  │     → si cobro falla: notificación al cliente para pago manual
  │     → payout al artista liberado (con deducción de comisión)
  │
  ├── Reporta problema
  │     → booking: DELIVERED → DISPUTE_OPEN
  │     → paymentStatus: permanece FROZEN
  │     → admin recibe notificación
  │     → admin revisa y resuelve:
  │         · A favor del artista → DISPUTE_RESOLVED → COMPLETED
  │                                  cobro del restante + payout
  │         · A favor del cliente → DISPUTE_RESOLVED → reembolso del anticipo
  │                                  booking cancelado
  │
  └── No responde en 24h (timeout automático)
        → booking: DELIVERED → COMPLETED  (silencio = conformidad)
        → cobro automático del restante con tarjeta guardada
        → si cobro exitoso: paymentStatus = FULLY_PAID → payout liberado
        → si cobro falla: notificación al cliente para pago manual
```

### Reglas de tiempo para reservas

#### Ventana de cancelación — 48h desde creación de reserva

```
La ventana se mide desde booking.createdAt (no desde la fecha del evento).

  Dentro de las primeras 48h de creación:
    → Cancelación permitida
    → Reembolso del 50% del paidAmount
    → booking paymentStatus = PARTIALLY_REFUNDED

  Después de 48h de creación:
    → Cancelación bloqueada (no se puede cancelar)
    → Si el cliente insiste → debe contactar soporte / abrir disputa

Nota: la lógica actual de cancelBooking() mide tiempo hasta el evento.
Debe cambiarse para medir now - booking.createdAt.
```

#### Cobro del saldo restante — 72h antes del evento

```
Para reservas con anticipo (anticipoRequired = true):

  Cron job corre cada hora y busca bookings donde:
    - paymentStatus = ANTICIPO_PAID
    - scheduledDate - now <= 72h
    - scheduledDate - now > 0  (evento no ha pasado)

  Al detectar un booking elegible:
    → Intenta cobro automático con savedCardToken
    → Si éxito: paymentStatus = CHARGING_REMAINING → FULLY_PAID
    → Si falla: notifica al cliente para pago manual
                banner en /profile/bookings: "Tu evento es en menos de 72h.
                Tienes saldo pendiente de $Y — paga ahora."
    → Si no paga en 24h adicionales: notificar al artista

Idempotencia: usar optimistic lock en paymentStatus (igual que cobro automático en DELIVERED).
```

#### Excepción de reserva en el mismo día — regla de 60 km

```
Regla general: minAdvanceHours = 24h (no se puede reservar con menos de 24h de anticipación)

Excepción: si la distancia entre artista y cliente es ≤ 60 km:
  → minAdvanceHours = 3h (puede reservar para el mismo día)
  → allowSameDay = true

Cálculo al crear la reserva (booking-service → createBooking()):
  1. Obtener coordenadas del artista: artist.lat, artist.lng (ya existen)
  2. Obtener coordenadas del cliente: booking.clientLat, booking.clientLng
     ← el cliente las ingresa manualmente al crear la reserva (parte del form)
  3. Calcular distancia con fórmula Haversine → guardar en booking.distanceKm
  4. Si distancia <= 60 y artist.allowSameDayBooking = true → minAdvanceHours = 3
     Si distancia > 60 → minAdvanceHours = 24 (default)

Campos requeridos:
  - Artist: lat Float?, lng Float? (ya existen en schema)
  - Booking: clientLat Float?, clientLng Float?, distanceKm Float? (nuevos)
  - NO se modifica users-service — la ubicación es por reserva, no del perfil

El artista puede desactivar esta excepción con allowSameDayBooking = false.
```

---

### Flujo — Cancelación y reembolso

#### Cancelación por el cliente

```
Solo aplica si la reserva está en CONFIRMED (confirmada por ambas partes).

Dentro de las primeras 48h desde booking.createdAt:
  → booking CANCELLED_CLIENT
  → reembolso del 50% del paidAmount
  → paymentStatus = PARTIALLY_REFUNDED
  → notifica al artista

Después de 48h desde booking.createdAt:
  → Error 400: "El plazo de cancelación ha vencido (48h desde la creación de la reserva)"
  → El cliente debe contactar soporte para casos excepcionales
```

#### Cancelación por el artista (reserva CONFIRMED)

```
Si el artista cancela una reserva ya CONFIRMED:
  → booking CANCELLED_ARTIST
  → reembolso del 100% del paidAmount al cliente
  → paymentStatus = REFUNDED
  → penalización automática al artista:
      · crear CommissionRule tipo FIXED_PENALTY en payments-service
      · monto a definir (ver pendientes)
      · se descuenta del próximo payout del artista
  → notifica al cliente con el reembolso completo
  → notifica al artista con la penalización aplicada

Nota: solo aplica si la reserva estaba en CONFIRMED.
Si estaba en PENDING (no confirmada aún), el artista puede rechazar sin penalización.
```

#### Compensación al artista si el cliente cancela fuera de ventana (caso excepcional)

```
Cuando soporte maneja un caso donde el cliente cancela fuera del plazo permitido
y la reserva queda sin efecto, el artista puede recibir compensación:

  → Admin aplica RATE_OVERRIDE manual en panel de comisiones:
      · rate: 9% (mitad del 18% default)
      · endDate: fecha del próximo evento del artista
      · reason: "Compensación por cancelación fuera de ventana"

  Esto se ejecuta manualmente por el admin usando el sistema de CommissionRule existente.
  No es automático — requiere criterio de soporte caso por caso.
```

### Flujo — No-show del artista

El sistema ya cuenta con un módulo de disputas completo (`dispute.service.ts`, tipo `ARTIST_NO_SHOW`).
El flujo de no-show se integra con él para dar al artista oportunidad de responder.

```
1. REPORTE (cliente o admin)
   POST /bookings/:id/no-show  { reason: string }

   Validaciones:
     - reportedBy = cliente de la reserva o admin
     - booking.status ∈ { CONFIRMED, ANTICIPO_PAID, PAYMENT_COMPLETED, IN_PROGRESS, DELIVERED }

   Acciones inmediatas:
     · booking.status = NO_SHOW
     · Se crea Dispute automáticamente:
         type: ARTIST_NO_SHOW
         status: OPEN
     · Notificación al artista (IN_APP + EMAIL):
       "Tienes 24h para responder antes de que se procesen las acciones automáticas.
        Ve a soporte@piums.io o responde en tu panel de quejas."
     · Notificación al admin para revisión

2. VENTANA DE 24H — el artista puede disputar en /quejas/:id
   · Si el artista responde → dispute.status = AWAITING_INFO → admin revisa
   · Si no responde en 24h → cron job ejecuta acciones automáticas

3. ACCIONES (automáticas a las 24h sin respuesta, o manual por admin a favor del cliente)
   · Reembolso completo: payments-service.createRefund() — proveedor según payment.provider
   · Crédito:  platformFee = paidAmount × 18%
               creditAmount = max(platformFee, $20 USD)
               Credit.expiresAt = now + 90 días
   · Shadow ban: artist.isActive = false, artist.shadowBannedAt = now (desaparece de búsquedas)
   · Liberar disponibilidad del artista
   · dispute.status = RESOLVED, resolution = FULL_REFUND
   · Notificaciones al cliente y artista (IN_APP + EMAIL)

4. SI ADMIN FALLA A FAVOR DEL ARTISTA
   · dispute.status = RESOLVED, resolution = NO_ACTION
   · No se ejecuta reembolso ni ban
   · booking.status puede revertirse a CONFIRMED (criterio del admin)

5. Admin levanta el shadow ban cuando se resuelve la situación:
   PATCH /artists/internal/by-auth/:authId/shadow-ban  { banned: false }
```

#### Penalty al artista por cancelar reserva CONFIRMED

```
Monto: 18% del booking.totalPrice  (= la comisión que hubiera pagado)

Ejemplo: booking de $300 → FIXED_PENALTY = $54
  → se crea CommissionRule tipo FIXED_PENALTY automáticamente
  → se descuenta del próximo payout del artista
  → artista recibe notificación del descuento aplicado

Este monto es proporcional, predecible y consistente con el sistema de comisiones existente.
```

### Flujo — Aplicar crédito en checkout

```
Al cargar el checkout (POST /payments/init-checkout):
  → Si el cliente tiene Credits activos y no expirados:
    ← respuesta incluye: { availableCredit: { id, amount, expiresAt } }
  → Frontend muestra banner: "Tienes $X de crédito disponible — ¿aplicar?"
  → Si aplica:
    · Si creditAmount >= totalCheckout → cero cobro, se marca crédito como USED
    · Si creditAmount < totalCheckout  → se descuenta del total, cobra la diferencia
  → Credit.status = USED, Credit.usedAt = now, Credit.usedInBookingId = bookingId
```

### Flujo — Payout al artista

```
Piums recibe el 100% del pago. El payout al artista es gestionado por Piums.

Cuando booking llega a COMPLETED:
  → payments-service calcula el neto del artista:
      1. ¿Hay RATE_OVERRIDE activo para este artista hoy?
           Sí → usar esa tasa
           No → usar 18% default
      2. ¿Hay FIXED_PENALTY sin aplicar (appliedAt = null)?
           Sí → sumar al total de deducciones, marcar como aplicada
      3. netAmount = totalPaid - platformFee(rate) - totalPenalties
  → Crea registro Payout con status = PENDING
      Incluye: artistId, bookingId, netAmount, commissionRate, platformFee, penalties
  → Notifica al artista con el desglose (total cobrado, comisión, penalizaciones, neto)

El admin procesa el payout manualmente desde el panel:
  → Ve lista de payouts PENDING
  → Realiza transferencia bancaria al artista fuera del sistema (banco, app, etc.)
  → Marca payout como COMPLETED en el panel con referencia de la transferencia
  → Artista recibe notificación de pago procesado

No se usa Tilopay /orders/liquidation/split ni Stripe Connect.
Los artistas NO necesitan cuenta de comercio en ningún proveedor.
```

---

### Card-only — Estrategia por proveedor

Ambos proveedores se configuran para aceptar **solo tarjeta**. La experiencia es un formulario embebido en ambos casos (sin redirects externos al usuario).

#### Stripe — card-only embebido

```
Backend: stripe.paymentIntents.create({
  payment_method_types: ['card']   ← solo tarjeta
})
→ { clientSecret }

Frontend: <CardElement /> de @stripe/react-stripe-js
→ stripe.confirmCardPayment(clientSecret)
→ webhook: payment_intent.succeeded
```

#### Tilopay — flujo nativo con SDK (card-only embebido)

Tilopay tiene dos flujos: redirect (hosted page) y nativo (embedded). Para card-only usamos el **flujo nativo** porque el redirect muestra todos los métodos habilitados en la cuenta (SINPE, Yappy, etc.) sin poder restringirlos por request. El nativo nos da control total.

```
PASO 1 — Backend obtiene token SDK
  POST /api/v1/loginSdk
  { "apiUser": "...", "password": "...", "key": "..." }
  → { "access_token": "...", "expires_in": "..." }

PASO 2 — Frontend carga el SDK de Tilopay
  <script src="https://app.tilopay.com/sdk/v2/sdk_tpay.min.js" />
  Inicializa con el access_token del loginSdk
  → Renderiza formulario de tarjeta embebido (igual que Stripe CardElement)
  → Usuario ingresa datos → SDK tokeniza la tarjeta → devuelve cardToken

PASO 3 — Frontend envía cardToken al backend
  POST /payments/tilopay-charge
  { bookingId, cardToken, sessionId }

PASO 4 — Backend procesa el pago
  POST /admin/processPaymentFAC (sin Authorization header)
  {
    key, amount, currency, orderNumber,
    capture: 1, card: cardToken,
    sessionId: "PIUMS-{hash}",
    redirect: "https://app.piums.io/booking/confirmation/<bookingId>",
    billing: { firstName, lastName, email },
    hashVersion: "V2"
  }
  → { type: "200" }  ← aprobado directamente
  → { type: "100", htmlFormData: "..." }  ← requiere challenge 3DS (mostrar en modal)

PASO 5 — Backend registra pago y actualiza booking
```

**Respuestas posibles del flujo nativo:**
| type | Acción |
|------|--------|
| `200` | Aprobado → registrar pago, actualizar booking |
| `100` + `htmlFormData` | Challenge 3DS → mostrar HTML en modal/iframe, esperar resultado |
| `400` + `card.brand == TOKENEX` | Reintentar con `/admin/processPaymentTokenex` (automático, máx 3 veces) |
| `400` | Error de integración |

### Flujo de payout a artista

```
Piums recibe el 100% del cobro en su propia cuenta (Tilopay o Stripe).
No se usa Tilopay split ni Stripe Connect.

El payout se gestiona manualmente por admin:
  1. Al completarse el booking → Payout registrado con status PENDING en la DB
  2. Admin ve la cola de payouts pendientes en el panel
  3. Admin realiza la transferencia al artista (banco, app de pagos, etc.)
  4. Admin marca el payout como COMPLETED con referencia de transferencia
  5. Artista recibe notificación con desglose del pago
```

---

## API Tilopay — Referencia completa

**Base URL:** `https://app.tilopay.com`

### Autenticación

```
POST /api/v1/login

Body:
{
  "email": "<TILOPAY_API_USER>",
  "password": "<TILOPAY_API_PASS>"
}

Response:
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400        ← 24 horas
}
```

Token se cachea en memoria con TTL de 23 horas (margen de seguridad).

### Crear pago

```
POST /api/v1/processPayment
Authorization: bearer <access_token>

Body:
{
  "key": "<TILOPAY_API_KEY>",
  "amount": 150.00,                         ← decimal, NO centavos
  "currency": "USD",
  "orderNumber": "PIUMS-<bookingId>-<ts>",  ← alfanumérico, único
  "capture": 1,                             ← 1=captura inmediata
  "redirect": "https://app.piums.io/booking/confirmation/<bookingId>",
  "subscription": 0,
  "platform": "piums-platform",
  "returnData": "<base64(bookingId)>",      ← se devuelve en el redirect
  "hashVersion": "V2",
  "billToEmail": "<user.email>",            ← billing es completamente opcional
  "billToFirstName": "<user.nombre>"
}

Response:
{
  "type": "100",
  "url": "https://app.tilopay.com/..."      ← redirigir al cliente aquí
}
```

### Redirect de vuelta (GET params al frontend)

```
/booking/confirmation/<bookingId>?
  code=1                    ← 1=aprobado, otro=rechazado
  &order=PIUMS-xxx          ← nuestro orderNumber
  &tpt=4300                 ← ID interno de Tilopay (guardar, necesario para split)
  &OrderHash=abc123...      ← hash HMAC-SHA256 (64 chars) para verificación
  &auth=123456              ← código de autorización del banco
  &description=Transaction%20is%20approved.
  &returnData=<base64>      ← el bookingId que enviamos
```

### Webhook (servidor→servidor)

```
POST <TILOPAY_CALLBACK_URL>

Body:
{
  "orderNumber": "PIUMS-xxx",
  "code": "1",              ← "1"=aprobado, "Pending"=pendiente, otro=rechazado
  "orderHash": "abc123...", ← verificar autenticidad
  "tpt": "4300",
  "auth": "123456"
}
```

### Reembolso / Captura / Reverso

```
POST /api/v1/processModification
Authorization: bearer <access_token>

Body:
{
  "orderNumber": "PIUMS-xxx",
  "key": "<TILOPAY_API_KEY>",
  "amount": 150.00,
  "type": 2,                ← 1=captura, 2=reembolso, 3=reverso
  "hashVersion": "V2"
}
```

### Split de liquidación — NO APLICA

```
Piums recibe el 100% del pago en su propia cuenta Tilopay.
No se usa el endpoint /orders/liquidation/split.
El payout al artista se gestiona manualmente por admin fuera de Tilopay.
```

---

## Tilopay — Tipos de respuesta

| type | Significado |
|------|-------------|
| `100` | Redirect → abrir `url` en el browser |
| `200` | Pago aprobado directamente |
| `300` | Error de licencia |
| `400` | Error de integración o parámetros inválidos |

---

## Variables de entorno

```env
# Tilopay
TILOPAY_API_USER=GHSjvq
TILOPAY_API_PASS=9oR8Gb
TILOPAY_API_KEY=2642-8042-9400-8913-7001
TILOPAY_BASE_URL=https://app.tilopay.com
TILOPAY_CALLBACK_URL=https://api.piums.io/payments/callback/tilopay
TILOPAY_COUNTRIES=GT,CR,PA,HN,SV,NI,DO,CO

# Stripe (se mantiene para USA/internacional)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Compartidas
DEFAULT_CURRENCY=USD
PLATFORM_FEE_PERCENTAGE=18
PAYMENTS_SERVICE_URL=http://payments-service:4005
```

---

## Sistema de comisiones

### Default
18% sobre el monto total pagado por el cliente al artista.

### Reglas por artista (solo admin)

Las reglas se crean manualmente desde el panel de administrador. No hay automatización — el admin decide cuándo y por qué aplicar una regla.

| Tipo | `endDate` | Efecto |
|------|-----------|--------|
| `RATE_OVERRIDE` | con fecha | Tasa temporal (ej: 0% durante mayo) |
| `RATE_OVERRIDE` | sin fecha (`null`) | **Ajuste permanente** (ej: este artista siempre paga 10%) |
| `FIXED_PENALTY` | — | Deducción fija única del próximo payout |

**Lógica de resolución:**
```
¿Existe RATE_OVERRIDE activo para este artista hoy?
  → Sí: usar esa tasa (sea temporal o permanente)
  → No: usar 18% (default)
```

Un ajuste permanente se crea igual que uno temporal, simplemente dejando el campo `endDate` vacío. Para revertirlo, el admin desactiva la regla y el artista vuelve al 18% automáticamente.

### Lógica de resolución (en payout.service.ts)

```
1. Buscar RATE_OVERRIDE activo para el artista en la fecha del payout
   → Si existe: usar esa tasa
   → Si no: usar 18% (PLATFORM_FEE_PERCENTAGE)

2. Buscar FIXED_PENALTY sin aplicar (appliedAt = null)
   → Si existe: sumar al total de deducciones
   → Marcar como aplicada (appliedAt, appliedToPayoutId)

3. netAmount = amount - platformFee(rate) - totalPenalties
4. Guardar commissionRate y commissionRuleId en el registro del payout
```

---

## Cambios en el schema de Prisma

### Modelo `CommissionRule` (nuevo)

```prisma
model CommissionRule {
  id                String             @id @default(uuid())
  artistId          String
  type              CommissionRuleType
  rate              Float?             // Para RATE_OVERRIDE: 0.0–100.0
  fixedAmount       Int?               // Para FIXED_PENALTY: monto en centavos
  currency          String?
  reason            String
  startDate         DateTime
  endDate           DateTime?          // null = indefinido
  isActive          Boolean            @default(true)
  appliedAt         DateTime?          // Solo FIXED_PENALTY
  appliedToPayoutId String?
  createdByAdminId  String
  deletedAt         DateTime?
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
  @@index([artistId])
  @@map("commission_rules")
}

enum CommissionRuleType {
  RATE_OVERRIDE
  FIXED_PENALTY
}
```

### Nuevos campos en booking-service (schema)

```
booking.savedCardToken    String?   ← token de tarjeta guardada al pagar anticipo
booking.deliveredAt       DateTime? ← cuándo el artista marcó como entregado
booking.disputeReason     String?   ← motivo del cliente al abrir disputa
booking.disputeResolvedAt DateTime? ← cuándo el admin resolvió
booking.disputeResolvedBy String?   ← ID del admin que resolvió
booking.autoCompleteAt    DateTime? ← cuándo se programa el auto-complete (deliveredAt + 24h)

// No-show
booking.noShowAt          DateTime? ← cuándo se reportó el no-show
booking.noShowReportedBy  String?   ← auth ID de quien reportó
booking.noShowReason      String?   ← motivo

// Regla de mismo día (60km) — ubicación por reserva, no del perfil del usuario
booking.clientLat         Float?    ← latitud ingresada por el cliente al reservar
booking.clientLng         Float?    ← longitud ingresada por el cliente al reservar
booking.distanceKm        Float?    ← distancia calculada artista↔cliente (Haversine)
```

Nuevos valores en el enum `BookingStatus`:
```
DELIVERED, DISPUTE_OPEN, DISPUTE_RESOLVED
```

Nuevos valores en el enum `PaymentStatus`:
```
FROZEN, CHARGING_REMAINING, ANTICIPO_PAID
```
(renombrar DEPOSIT_PAID → ANTICIPO_PAID en todo el schema y código)

### Nuevos campos en artists-service (schema)

```
// Shadow ban
artist.shadowBannedAt     DateTime? ← null = no baneado
artist.shadowBanReason    String?

// Excepción mismo día
artist.allowSameDayBooking Boolean @default(true)
                                    ← permite que el artista desactive la regla de 60km
```

// users-service: sin cambios — la ubicación del cliente se captura por reserva, no en el perfil

### Nuevo modelo en payments-service (schema)

```prisma
model Credit {
  id              String       @id @default(uuid())
  userId          String       // auth ID del cliente
  bookingId       String?      // reserva origen (el no-show)
  amount          Int          // centavos USD
  currency        String       @default("USD")
  status          CreditStatus @default(ACTIVE)
  reason          String       // "NO_SHOW_COMPENSATION"
  expiresAt       DateTime     // now + 90 días
  usedAt          DateTime?
  usedInBookingId String?      // reserva donde se aplicó
  deletedAt       DateTime?
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  @@index([userId])
  @@map("credits")
}

enum CreditStatus {
  ACTIVE
  USED
  EXPIRED
  CANCELLED
}
```

---

### Campos renombrados (Stripe → genérico)

| Modelo | Campo viejo | Campo nuevo |
|--------|-------------|-------------|
| `PaymentIntent` | `stripePaymentIntentId` | `providerPaymentId` |
| `PaymentIntent` | `clientSecret` | `providerClientSecret` |
| `PaymentIntent` | *(nuevo)* | `redirectUrl` |
| `PaymentIntent` | *(nuevo)* | `provider` enum(STRIPE, TILOPAY) |
| `Payment` | `stripePaymentIntentId` | `providerPaymentId` |
| `Payment` | `stripeChargeId` | `providerChargeId` |
| `Payment` | `stripeFee` | `providerFee` |
| `Payment` | *(nuevo)* | `provider` enum(STRIPE, TILOPAY) |
| `Payment` | *(nuevo)* | `countryCode` |
| `Refund` | `stripeRefundId` | `providerRefundId` |
| `WebhookEvent` | `stripeEventId` | `providerEventId` |
| `WebhookEvent` | *(nuevo)* | `provider` enum(STRIPE, TILOPAY) |
| `Payout` | `stripeTransferId` | `providerTransferId` |
| `Payout` | `stripePayoutId` | `providerPayoutId` |
| `Payout` | `stripeAccountId` | `providerAccountId` |
| `Payout` | `stripeFee` | `providerFee` |
| `Payout` | *(nuevo)* | `provider` enum(STRIPE, TILOPAY) |
| `Payout` | *(nuevo)* | `commissionRate Float` |
| `Payout` | *(nuevo)* | `commissionRuleId String?` |

`PaymentMethod` queda deprecado (card-only no requiere guardar métodos).
Defaults de `currency`: cambiar `"GTQ"` → `"USD"` en todo el schema.

---

## Arquitectura de archivos

### Nuevos archivos

```
services/payments-service/src/
  providers/
    payment-provider.interface.ts   ← interfaz común IPaymentProvider
    tilopay.provider.ts             ← implementación Tilopay
  utils/
    payment-router.ts               ← getProvider(countryCode)
    tilopay-token-cache.ts          ← caché del bearer token (TTL 23h)
  routes/
    callback.routes.ts              ← POST /callbacks/tilopay (webhook Tilopay)
```

### Archivos modificados

```
services/payments-service/src/
  providers/stripe.provider.ts      ← refactor para implementar IPaymentProvider
  services/payment.service.ts       ← routing por país, usa IPaymentProvider
  services/payout.service.ts        ← comisiones dinámicas + routing de split
  routes/webhook.routes.ts          ← se mantiene para Stripe
  schemas/payment.schema.ts         ← nuevos campos provider, countryCode
  prisma/schema.prisma              ← renombrar campos + nuevos modelos

services/auth-service/src/
  controller/admin.controller.ts    ← nuevos endpoints de comisiones
  routes/admin.routes.ts            ← rutas de comisiones
  clients/payments.client.ts        ← nuevo: llama a payments-service para comisiones

packages/sdk/src/index.ts          ← actualizar interfaces y métodos

apps/web-client/web/src/app/
  booking/checkout/page.tsx         ← checkout dual (Stripe card / Tilopay redirect)

apps/web-admin/web/src/app/
  artists/page.tsx                  ← nueva pestaña Comisiones en el drawer
```

---

## Interfaz común IPaymentProvider

```typescript
interface CreatePaymentParams {
  orderNumber: string
  amount: number      // en USD, decimal (ej: 150.00)
  currency: string    // siempre "USD"
  description?: string
  redirectUrl: string // URL de retorno al frontend
  returnData?: string // base64(bookingId)
  billing?: {
    firstName?: string
    lastName?: string
    email?: string
  }
  metadata?: Record<string, string>
}

interface PaymentResult {
  providerPaymentId: string
  provider: 'stripe' | 'tilopay'
  clientSecret?: string   // Solo Stripe
  redirectUrl?: string    // Solo Tilopay
  status: string
}

interface IPaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<PaymentResult>
  getPaymentStatus(providerPaymentId: string): Promise<string>
  createRefund(params: { providerPaymentId: string; amount: number }): Promise<{ providerRefundId: string; status: string }>
  // processSplit eliminado — Piums recibe el 100% y paga al artista manualmente
}
```

---

## Frontend — Checkout unificado (card-only)

El checkout es el mismo componente para ambos proveedores. El usuario solo ve un formulario de tarjeta — sin selector de método de pago, sin redirects externos.

```tsx
// 1. Al cargar el checkout, el backend determina el proveedor
const { provider, clientSecret, tilopayToken } = await sdk.initCheckout({ bookingId })

// 2. El mismo componente <CardForm /> se inicializa según el proveedor
if (provider === 'stripe') {
  // Stripe Elements — ya disponible
  <Elements stripe={stripePromise} options={{ clientSecret }}>
    <CardElement />
  </Elements>

} else {
  // Tilopay SDK — carga el script y renderiza el formulario embebido
  <TilopayCardForm sdkToken={tilopayToken} onToken={(cardToken) => handlePay(cardToken)} />
}

// 3. Al hacer clic en "Pagar"
if (provider === 'stripe') {
  await stripe.confirmCardPayment(clientSecret)
  // → webhook confirma automáticamente

} else {
  await sdk.tilopayCharge({ bookingId, cardToken, sessionId })
  // → backend llama processPaymentFAC
  // → si hay 3DS: mostrar modal con htmlFormData
  // → si aprobado: redirigir a /booking/confirmation/<bookingId>
}
```

### Flujo de anticipo vs pago completo

```
Checkout muestra según booking.anticipoRequired:

  anticipoRequired = true:
    "Para confirmar tu reserva se requiere un anticipo"
    Monto: $X (anticipoAmount)
    Saldo restante: $Y (después del evento)
    [Pagar anticipo con tarjeta]

  anticipoRequired = false:
    "Pago completo al reservar"
    Monto: $Z (totalPrice)
    [Pagar con tarjeta]
```

### Pago del saldo restante

```
En /profile/bookings o /booking/<id>, si paymentStatus = ANTICIPO_PAID:
  Banner: "Tienes un saldo pendiente de $Y antes del evento"
  [Pagar saldo restante]
  → Mismo flujo de checkout con paymentType: REMAINING
  → Monto = totalPrice - paidAmount
  → Al completarse: paymentStatus = FULLY_PAID
```

---

## Admin panel — Pestaña Comisiones

El drawer de detalle del artista agrega una 4ª pestaña:

```
[ Perfil ] [ Documentos ] [ Decisión ] [ Comisiones ]

┌─────────────────────────────────────────────────────┐
│  Comisión actual                                    │
│  18% (default)  o  0% override — may 2026          │
│  Motivo: Artista destacado del mes                  │
├─────────────────────────────────────────────────────┤
│  [ + Bonificación de tasa ]  [ + Penalización ]     │
├─────────────────────────────────────────────────────┤
│  Historial                                          │
│  RATE  0%    1 may–31 may 2026    activo            │
│  PENALTY $50  15 mar 2026         aplicado a #p123  │
└─────────────────────────────────────────────────────┘
```

### Endpoints admin de comisiones

```
GET    /api/admin/artists/:id/commissions        lista reglas
POST   /api/admin/artists/:id/commissions        crea regla
PATCH  /api/admin/commissions/:ruleId            activa/desactiva
DELETE /api/admin/commissions/:ruleId            soft delete
GET    /api/admin/commissions/:ruleId/preview    impacto estimado en próximo payout
```

---

## Idempotencia — Prevención de cobros dobles

Cada punto del sistema donde puede ocurrir un cobro tiene su propia capa de protección. La defensa es en profundidad: no se depende de una sola guardia.

### Claves de idempotencia por operación

Todas las claves son **deterministas** — se derivan del bookingId y el tipo de pago, no de timestamps ni UUIDs random.

```
Anticipo:          PIUMS-{bookingId}-ANTICIPO
Saldo restante:    PIUMS-{bookingId}-REMAINING
Reembolso:         PIUMS-{bookingId}-REFUND-{paymentId}
Payout artista:    PIUMS-{bookingId}-PAYOUT
```

### Capa 1 — Base de datos (constraint único)

`PaymentIntent` tiene un unique constraint en `(bookingId, paymentType)` excluyendo los cancelados:

```sql
CREATE UNIQUE INDEX payment_intent_booking_type_unique
ON payment_intents (booking_id, payment_type)
WHERE status != 'CANCELLED';
```

Antes de crear un intent, el servicio verifica si ya existe uno activo para ese par. Si existe → devuelve el mismo sin crear uno nuevo.

### Capa 2 — Idempotency key en el proveedor

**Stripe:**
```typescript
stripe.paymentIntents.create(params, {
  idempotencyKey: 'PIUMS-{bookingId}-ANTICIPO'
})
// Si Stripe ya vio esta key → devuelve el mismo PaymentIntent
```

**Tilopay:**
El `orderNumber` actúa como idempotency key nativa. Se construye de forma determinista:
```
orderNumber = `PIUMS-${bookingId}-ANTICIPO`
orderNumber = `PIUMS-${bookingId}-REMAINING`
```
Si Tilopay recibe el mismo `orderNumber` dos veces, rechaza el segundo con error de orden duplicada.

### Capa 3 — Webhooks y callbacks (deduplicación)

Tanto Stripe como Tilopay pueden enviar el mismo evento más de una vez (retries de su lado).

`WebhookEvent` tiene un unique constraint en `providerEventId`. Antes de procesar:
```typescript
const existing = await prisma.webhookEvent.findUnique({
  where: { providerEventId: event.id }
})
if (existing?.processed) return res.json({ received: true }) // ya procesado, ignorar
```

### Capa 4 — Cobro automático del restante (optimistic locking)

El cron job y la confirmación manual pueden competir. Se usa una actualización atómica:

```sql
UPDATE bookings
SET status = 'COMPLETED', completedAt = NOW()
WHERE id = :bookingId AND status = 'DELIVERED'
RETURNING *
```

Si `rowsAffected === 0` → otro proceso ya lo completó → no se cobra. Solo el proceso que logra el UPDATE procede al cobro.

### Capa 5 — Verificación de estado antes de cada cobro

Antes de ejecutar cualquier cargo, el `payment.service.ts` verifica el estado actual:

```typescript
// Anticipo
if (booking.paymentStatus !== 'PENDING') throw new AppError(409, 'Este pago ya fue procesado')

// Saldo restante
if (booking.paymentStatus === 'FULLY_PAID') throw new AppError(409, 'La reserva ya está pagada en su totalidad')

// Payout
const existingPayout = await prisma.payout.findFirst({
  where: { bookingId, status: { not: 'CANCELLED' } }
})
if (existingPayout) throw new AppError(409, 'El payout de esta reserva ya fue procesado')
```

### Capa 6 — Estado IN_FLIGHT para el cobro del restante

Para evitar que el cron y el botón manual coincidan:

```
paymentStatus: ANTICIPO_PAID → CHARGING_REMAINING (in-flight, atómico)
               CHARGING_REMAINING → FULLY_PAID (éxito)
               CHARGING_REMAINING → ANTICIPO_PAID (fallo, permite reintento)
```

El UPDATE a `CHARGING_REMAINING` es atómico con condición:
```sql
UPDATE bookings SET paymentStatus = 'CHARGING_REMAINING'
WHERE id = :id AND paymentStatus = 'ANTICIPO_PAID'
RETURNING *
```
Si 0 filas → otro proceso ya está cobrando → no hacer nada.

### Resumen de puntos protegidos

| Punto de riesgo | Capa 1 (DB) | Capa 2 (Provider) | Capa 3 (Estado) |
|-----------------|-------------|-------------------|-----------------|
| Crear intent anticipo | ✅ unique (bookingId, paymentType) | ✅ idempotencyKey | ✅ check PENDING |
| Cobro restante (manual) | — | ✅ orderNumber fijo | ✅ check ANTICIPO_PAID → CHARGING |
| Cobro restante (cron) | — | ✅ orderNumber fijo | ✅ optimistic lock |
| Webhook duplicado | ✅ unique providerEventId | — | ✅ check processed |
| Payout duplicado | ✅ check payout existente | — | ✅ check COMPLETED |
| Reembolso duplicado | — | ✅ idempotencyKey | ✅ check SUCCEEDED |

---

## Correcciones al flujo actual de booking

El booking-service actual tiene dos problemas que se corrigen en esta integración:

### Problema 1 — Payment intent prematuro
`createBooking()` crea un payment intent inmediatamente al crear la reserva, antes de que el artista confirme. Esto es incorrecto porque:
- El cliente podría nunca llegar al checkout
- Se crean payment intents huérfanos en Stripe

**Corrección:** eliminar la creación del payment intent de `createBooking()`. El intent se crea únicamente cuando el cliente llega al checkout y hace clic en "Pagar".

### Problema 2 — Mismatch anticipo vs total
El checkout actual crea un intent por el **precio total**, ignorando que `booking.anticipoAmount` puede ser diferente.

**Corrección:** el checkout envía `paymentType` (ANTICIPO o FULL_PAYMENT) y el backend usa el monto correcto según el tipo:
- `ANTICIPO` → `booking.anticipoAmount`
- `FULL_PAYMENT` → `booking.totalPrice`
- `REMAINING` → `booking.totalPrice - booking.paidAmount`

### Cambios en booking-service

```
services/booking-service/src/
  services/booking.service.ts   → eliminar createPaymentIntent() de createBooking()
  clients/payments.client.ts    → agregar método para tilopayConfirm
  prisma/schema.prisma          → renombrar paymentIntentId → providerPaymentId
                                   cambiar default currency GTQ → USD
```

---

## Orden de implementación

```
Fase 1   Schema Prisma — payments-service
         - Agregar modelo CommissionRule + enum CommissionRuleType
         - Agregar enum PaymentProviderType (STRIPE | TILOPAY)
         - Renombrar todos los campos stripe* → provider*
         - Agregar campos nuevos (provider, countryCode, redirectUrl, etc.)
         - Cambiar defaults de currency GTQ → USD
         - Unique constraint: (bookingId, paymentType) en PaymentIntent WHERE status != CANCELLED
         - Unique constraint: providerEventId en WebhookEvent (ya existe, verificar)
         - Generar y aplicar migración

Fase 2   Schema Prisma — booking-service
         ⚠️ HACER BACKUP de la base de datos antes de esta migración
         - Renombrar paymentIntentId → providerPaymentId
         - Cambiar default currency GTQ → USD
         - Agregar campos: savedCardToken, deliveredAt, disputeReason,
           disputeResolvedAt, disputeResolvedBy, autoCompleteAt
         - Agregar campos no-show: noShowAt, noShowReportedBy, noShowReason
         - Agregar campos 60km: clientLat Float?, clientLng Float?, distanceKm Float?
         - Nuevos valores en BookingStatus: DELIVERED, DISPUTE_OPEN, DISPUTE_RESOLVED
         - Nuevos valores en PaymentStatus: FROZEN, CHARGING_REMAINING, ANTICIPO_PAID
         - Renombrar deposit* → anticipo* en todos los campos
         - Renombrar enum DEPOSIT_PAID → ANTICIPO_PAID
           ⚠️ Requiere UPDATE data: UPDATE bookings SET payment_status='ANTICIPO_PAID'
              WHERE payment_status='DEPOSIT_PAID' — ejecutar ANTES del rename
         - Generar y aplicar migración

Fase 2b  Schema Prisma — artists-service
         ⚠️ HACER BACKUP antes de aplicar
         - Agregar: shadowBannedAt DateTime?, shadowBanReason String?
         - Agregar: allowSameDayBooking Boolean @default(true)
         - Generar y aplicar migración

Fase 2c  Schema Prisma — payments-service (complemento)
         - Agregar modelo Credit + enum CreditStatus
         - Generar y aplicar migración
         (users-service: sin cambios — ubicación va en booking, no en perfil)

Fase 3   PaymentRouter + TilopayTokenCache
         - utils/payment-router.ts
         - utils/tilopay-token-cache.ts (caché con TTL 23h)

Fase 4   IPaymentProvider + Providers
         - providers/payment-provider.interface.ts
         - providers/tilopay.provider.ts:
             · login()      → POST /api/v1/login        (token 24h, caché 23h)
             · loginSdk()   → POST /api/v1/loginSdk     (token SDK para el frontend)
             · chargeCard() → POST /admin/processPaymentFAC (nativo, card-only)
             · refund()     → POST /api/v1/processModification (type: 2)
             // split() eliminado — no aplica en el modelo de Piums recibe todo
         - providers/stripe.provider.ts (refactor para implementar IPaymentProvider)
             · payment_method_types: ['card'] en todos los intents

Fase 5   payment.service.ts
         - initCheckout()    → devuelve provider + clientSecret (Stripe) o sdkToken (Tilopay)
         - tilopayCharge()   → recibe cardToken del frontend, llama processPaymentFAC
         - handle3DS()       → si Tilopay devuelve htmlFormData, lo retorna al frontend
         - recordPayment()   → unificado para ambos proveedores
         - Manejo correcto de paymentType (ANTICIPO / FULL_PAYMENT / REMAINING)

Fase 6   payout.service.ts
         - Lógica de resolución de comisiones (RATE_OVERRIDE + FIXED_PENALTY)
         - createPayout(): calcula netAmount y crea registro PENDING (sin transferencia automática)
         - processPayout(): solo marca COMPLETED + guarda referencia de transferencia manual
         - Eliminar lógica de Stripe Connect y Tilopay split (no aplica)
         - Nuevo endpoint admin: GET /payouts/pending → lista de payouts a procesar
         - Nuevo endpoint admin: PATCH /payouts/:id/complete { transferReference } → marca COMPLETED

Fase 7   booking-service
         - Eliminar createPaymentIntent() de createBooking()
         - Añadir endpoint interno para recibir tilopayConfirm y actualizar estado
         - Nuevo endpoint: PATCH /bookings/:id/deliver (artista marca como entregado)
             · booking → DELIVERED, paymentStatus → FROZEN
             · guarda deliveredAt, programa autoCompleteAt = now + 24h
             · notifica al cliente
         - Nuevo endpoint: PATCH /bookings/:id/confirm-receipt (cliente confirma)
             · booking → COMPLETED
             · llama a payments-service para cobrar el restante con savedCardToken
         - Nuevo endpoint: PATCH /bookings/:id/dispute (cliente abre disputa)
             · booking → DISPUTE_OPEN
             · notifica al admin
         - Nuevo endpoint: PATCH /bookings/:id/resolve-dispute (admin resuelve)
             · si a favor del artista → COMPLETED → cobro + payout
             · si a favor del cliente → reembolso + cancelación
         - Job/cron: cada hora revisar bookings en DELIVERED con autoCompleteAt vencido
             · mover a COMPLETED y disparar cobro automático

         --- Reglas de tiempo ---

         - Cancelación: cambiar cancelBooking() para medir now - booking.createdAt
             · si (now - createdAt) > 48h → error 400 "Plazo de cancelación vencido"
             · si dentro de 48h → reembolso 50% (no 100%)

         - Cobro 72h antes del evento: nuevo cron job (cada hora)
             · busca bookings con paymentStatus = ANTICIPO_PAID y scheduledDate - now <= 72h
             · dispara cobro automático con savedCardToken (Tilopay o Stripe)
             · si falla → notifica al cliente para pago manual
             · idempotencia: optimistic lock en paymentStatus (ANTICIPO_PAID → CHARGING_REMAINING)

         - Regla 60km (mismo día): en createBooking()
             · obtener lat/lng del artista (artist.lat, artist.lng)
             · obtener lat/lng del cliente (user.lat, user.lng)
             · calcular distancia Haversine → guardar en booking.distanceKm
             · si distancia <= 60 y artist.allowSameDayBooking = true → minAdvanceHours = 3
             · si distancia > 60 → minAdvanceHours = 24 (default)

         --- No-show ---

         - Nuevo endpoint: POST /bookings/:id/no-show (cliente o admin)
             · valida estado: CONFIRMED, ANTICIPO_PAID, PAYMENT_COMPLETED, IN_PROGRESS, DELIVERED
             · booking → NO_SHOW, guarda noShowAt/noShowReportedBy/noShowReason
             · reembolso completo de paidAmount
             · crédito al cliente: max(18% × paidAmount, $20 USD)
             · shadow ban al artista (isActive = false + shadowBannedAt)
             · liberar disponibilidad del artista
             · notificaciones a cliente y artista

Fase 8   Routes — payments-service
         - routes/callback.routes.ts (webhook Tilopay)
         - routes/webhook.routes.ts (se mantiene, solo Stripe)
         - routes/credit.routes.ts (nuevo)
             · GET  /credits/my          → créditos activos del usuario autenticado
             · POST /credits/internal    → crear crédito (x-internal-secret)
         - Cron job: expiración de créditos
             · corre diariamente
             · UPDATE credits SET status='EXPIRED' WHERE expiresAt < now AND status='ACTIVE'

Fase 8b  artists-service
         - Nuevo endpoint interno: PATCH /artists/internal/by-auth/:authId/shadow-ban
             · banned: true  → shadowBannedAt = now, isActive = false (unindex)
             · banned: false → shadowBannedAt = null, isActive = true (reindex)

Fase 9   Admin endpoints de comisiones
         - payments-service: CRUD de CommissionRule
         - auth-service: proxy + client hacia payments-service

Fase 10  SDK (packages/sdk)
         - Actualizar interfaces PaymentIntent, Payment, Refund
         - Agregar PaymentProviderType, CommissionRule, Credit
         - Nuevo método tilopayConfirm()
         - Nuevo método reportNoShow()

Fase 11  Frontend checkout (web-client)
         - Componente <CardForm /> unificado (Stripe Elements o Tilopay SDK según proveedor)
         - initCheckout() al cargar la página → obtiene provider + token
         - Si Tilopay: carga sdk_tpay.min.js, inicializa con sdkToken, obtiene cardToken
         - Si Stripe: inicializa Elements con clientSecret
         - Muestra anticipo vs pago total según booking.anticipoRequired
         - Modal 3DS si Tilopay devuelve htmlFormData
         - Eliminar opciones de pago que no sean tarjeta (sin transfer, sin PayPal)
         - Banner "Pagar saldo restante" en /profile/bookings cuando paymentStatus=ANTICIPO_PAID
         - Banner crédito disponible: si availableCredit → "Tienes $X de crédito — ¿aplicar?"

Fase 12  Admin panel (web-admin)
         - Nueva pestaña Comisiones en drawer de artista
         - Muestra tasa activa actual (default 18% o el override vigente)
         - Modal "Ajustar comisión": % + motivo + fecha inicio + fecha fin (opcional)
           → sin fecha fin = ajuste permanente hasta que el admin lo revierta
         - Modal "Penalización fija": monto + motivo (se aplica al próximo payout)
         - Botón "Revertir a 18%" si hay un override activo
         - Historial de todas las reglas del artista (activas, expiradas, aplicadas)
         - Indicador shadow ban en perfil del artista + botón "Levantar restricción"

Fase 13  Env vars y dependencias
         - Agregar vars de Tilopay al .env de payments-service
         - Mantener Stripe (no eliminar)
         - DEFAULT_CURRENCY=USD
         - PLATFORM_FEE_PERCENTAGE=18
```

---

## Decisiones tomadas — Referencia completa

### Pagos y proveedores
- [x] Piums recibe el 100% del pago. Artistas NO necesitan cuenta Tilopay ni Stripe Connect
- [x] Payout al artista: manual por admin (transferencia bancaria) → marcar COMPLETED con referencia
- [x] Moneda: USD en todo el sistema
- [x] Fee default: 18% (PLATFORM_FEE_PERCENTAGE)
- [x] Solo tarjeta como método de pago (sin SINPE, Yappy, PayPal, etc.)

### Notificaciones de comisión al artista
- [x] Sí, siempre notificar por IN_APP + EMAIL en dos eventos:
  - `RATE_OVERRIDE` aplicado/modificado/removido → *"Tu comisión fue ajustada al X% [período]"*
  - `FIXED_PENALTY` aplicada → *"Se descontará $X de tu próximo pago por: [motivo]"* (antes del payout)

### Seguridad Tilopay — OrderHash
- [x] Implementar callback de Tilopay sin bloqueo por hash por ahora
      → loguear SECURITY_WARNING si el hash no está presente, pero no rechazar
      → completar la verificación cuando Tilopay entregue instrucciones V2 (sac@tilopay.com)
      → no bloquea el resto de la implementación

### Pre-producción Tilopay
- [x] URL callback ya definida: `https://api.piums.io/payments/callback/tilopay`
      Configurar en panel Tilopay el mismo día que se obtienen credenciales de producción
- [x] Credenciales de producción: solicitar a Tilopay ahora (no esperar al fin del desarrollo)
      Proceso de aprobación puede tomar días/semanas — iniciar en paralelo con implementación

### Pago manual del saldo restante (cobro 72h fallido)
- [x] Política de escalada:
  ```
  T-72h → cobro falla → notificación al cliente (tienes 24h para pagar manualmente)
  T-48h → sin pago → notificación al artista + recordatorio urgente al cliente
  T-24h → sin pago → escalada automática a soporte (decide: más tiempo / cancelar / excepción)
  ```

### Auto-complete si artista no marca servicio entregado
- [x] Auto-complete a las 4h después de la hora de fin estimada del evento
      Fórmula: `booking.scheduledDate + booking.estimatedDuration + 4h`
      Si no hay estimatedDuration → usar 2h como default
- [x] Admin puede forzar la marca de entregado desde el panel en cualquier momento

### Reglas de tiempo y no-show
- [x] Cancelación: ventana de 48h desde `createdAt`, reembolso 50% (solo si CONFIRMED)
- [x] Cancelación artista en CONFIRMED: reembolso 100% + FIXED_PENALTY = 18% del totalPrice
- [x] Compensación artista cancelado fuera de ventana: RATE_OVERRIDE 9% aplicado manualmente por admin
- [x] Cobro 72h antes del evento: cron job con optimistic lock
- [x] Regla 60km: clientLat/clientLng en booking, Haversine, si ≤60km → minAdvanceHours=3
- [x] Alerta mismo día: mostrar en formulario de reserva cuando aplica la regla de 3h
- [x] No-show: FIXED_PENALTY = 18% del totalPrice; artista tiene 24h para disputar
- [x] Sistema de disputas existente (ARTIST_NO_SHOW) se integra al flujo
- [x] Crédito no-show: max(18% × paidAmount, $20 USD), válido 90 días
- [x] Expiración créditos: cron diario en payments-service
- [x] Notificaciones no-show: IN_APP + EMAIL para cliente y artista
- [x] Backups obligatorios antes de cualquier migración que modifique datos existentes
