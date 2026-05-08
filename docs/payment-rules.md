# Reglas de pagos y comisiones — Piums

Referencia de las reglas de negocio relacionadas con pagos, comisiones y penalizaciones.

---

## Comisión de plataforma

| Situación | Comisión |
|---|---|
| Reserva normal completada | **18%** del monto total |
| Reserva del artista después de un no-show sin justificar | **27%** (18% base + 9% recargo, se aplica **una sola vez** y vuelve a 18%) |

La comisión se descuenta del payout al artista cuando se procesa el pago.

---

## Anticipo (depósito)

- El cliente paga **50%** del `totalPrice` al confirmar la reserva con el anticipo (`anticipoRequired: true`)
- El saldo restante (**50%**) se cobra **72 horas antes** del evento mediante un cron job
- Si el cobro del saldo falla → se notifica al cliente, soporte da seguimiento (no hay auto-cancelación)

---

## Cancelaciones

### Cliente cancela

| Momento | Reembolso |
|---|---|
| Dentro de las **48h desde que se creó** la reserva | **50%** del monto pagado |
| Pasadas las 48h desde creación | **No permitido** — devuelve error 400 |

### Artista cancela una reserva `CONFIRMED`

- Reembolso **100%** al cliente
- Penalización al artista: **9%** del `totalPrice` de la reserva (cobrado como `FIXED_PENALTY` en el siguiente payout)

---

## No-show del artista

### Flujo completo

```
1. Cliente reporta no-show  →  POST /bookings/:id/no-show
2. booking.status = NO_SHOW
   Dispute creada automáticamente (type: ARTIST_NO_SHOW, status: OPEN)
3. Artista tiene 24h para responder desde /quejas/:disputeId
4a. Artista no responde en 24h  →  acciones automáticas (ver abajo)
4b. Artista responde  →  admin revisa
    · Admin resuelve a favor del cliente  →  acciones automáticas
    · Admin resuelve a favor del artista  →  sin penalización, status vuelve a CONFIRMED
```

### Acciones automáticas (no-show sin justificación)

1. **Reembolso 100%** del monto pagado al cliente
2. **Crédito de compensación** al cliente: `max(18% × monto pagado, $20 USD)`, válido 90 días
3. **Shadow ban** del artista: `isActive = false`, no aparece en búsquedas
4. **Recargo en siguiente reserva**: se crea una `CommissionRule` de tipo `RATE_OVERRIDE` al **27%** con `isOneTime = true`
   → La próxima reserva que complete pago tendrá comisión del 27%; después vuelve automáticamente al 18%
5. Notificación IN_APP + EMAIL al cliente y al artista

### Recargo escalado

```
Artista falla → siguiente reserva: 27%
  ↓ Si esa reserva sale bien → vuelve a 18%
  ↓ Si vuelve a fallar sin justificar → de nuevo 27% en la siguiente, y así
```

No hay acumulación permanente — cada no-show sin justificar genera exactamente **un ciclo** de 27%.

---

## Créditos de compensación

- Se crean automáticamente al confirmar un no-show sin justificación
- Monto: `max(18% × paidAmount, $20 USD)` en centavos
- Validez: **90 días** desde creación
- Estado: `ACTIVE` → `USED` (al aplicarse a una reserva) o `EXPIRED` (cron diario)
- Endpoint cliente: `GET /api/credits/my`

---

## Flujo de emails por evento de pago

| Evento | Emails enviados |
|---|---|
| Reserva creada (`PENDING`) | **Ninguno** — el cliente aún no pagó |
| Anticipo confirmado (`ANTICIPO_PAID`) | `booking-created-client` + `booking-created-artist` |
| Artista confirma la reserva (`CONFIRMED`) | `booking-confirmed` (cliente) + `booking-confirmed-artist` |
| 24h antes del evento | `booking-reminder-24h` (cliente) |
| 2h antes del evento | `booking-reminder-2h` (cliente) |
| No-show resuelto | `booking-no-show-client` + `booking-no-show-artist` |

> Si el cliente cancela antes de pagar el anticipo, no llega ningún email porque `paymentStatus` nunca salió de `PENDING`.

---

## Proveedores de pago

### Tilopay (principal — Guatemala/LATAM)

- Respuesta del payment-intent incluye `redirectUrl`
- El frontend abre un WebView / iframe apuntando a esa URL (formulario 3DS de Tilopay)
- Al completar, Tilopay redirige de vuelta; el frontend detecta el cambio via polling al endpoint de la reserva
- Polling: cada 3s a `GET /api/bookings/:id` hasta `paymentStatus === 'DEPOSIT_PAID' | 'FULLY_PAID'`

**Variables de entorno requeridas:**
```
TILOPAY_API_KEY
TILOPAY_API_SECRET
TILOPAY_API_USER
TILOPAY_API_URL=https://app.tilopay.com/api/v1
```

### Stripe (secundario — internacional / fallback)

- Respuesta del payment-intent incluye `clientSecret`
- Web: redirige a `/booking/checkout?bookingId=...` (Stripe Elements)
- Móvil: usar el SDK nativo de Stripe con el `clientSecret`

**Variables de entorno requeridas:**
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

---

## Estados de pago (`PaymentStatus`)

```
PENDING
  → ANTICIPO_PAID       (50% recibido — se disparan los emails de confirmación de reserva)
  → CHARGING_REMAINING  (cobrando el 50% restante a las 72h antes del evento)
  → FULLY_PAID          (pago completo)
  → FROZEN              (disputa abierta — no se libera al artista)
```

---

## Implementación técnica — CommissionRule

Las reglas de comisión se guardan en `piums_payments.commission_rules`.

| Campo | Descripción |
|---|---|
| `type` | `RATE_OVERRIDE` (porcentaje) o `FIXED_PENALTY` (monto fijo) |
| `rate` | Porcentaje para `RATE_OVERRIDE` (ej. `27`) |
| `fixedAmount` | Centavos para `FIXED_PENALTY` |
| `isOneTime` | Si `true`, se desactiva automáticamente tras aplicarse una vez |
| `isActive` | `false` una vez consumida (isOneTime) o desactivada por admin |
| `appliedAt` | Timestamp de cuando se aplicó en un payout |

La regla se aplica en `payout.service.ts` al crear un payout de tipo `BOOKING_PAYMENT`. Si `isOneTime = true`, el payout service la desactiva automáticamente al usarla.

---

## Endpoint para crear una CommissionRule (interno)

```http
POST http://payments-service:4005/api/commission-rules/internal
x-internal-secret: {INTERNAL_SERVICE_SECRET}

{
  "artistId": "auth-id-del-artista",
  "type": "RATE_OVERRIDE",
  "rate": 27,
  "isOneTime": true,
  "currency": "USD",
  "reason": "Recargo por no-show sin justificación en reserva #PIU-2026-000027",
  "startDate": "2026-05-07T00:00:00.000Z",
  "createdByAdminId": "system"
}
```

---

*Última actualización: 2026-05-07 — anticipo actualizado a 50%, emails movidos a post-pago*
