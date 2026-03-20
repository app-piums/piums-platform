# Sistema de Payouts

## Descripción General

El sistema de payouts gestiona los pagos a artistas en la plataforma Piums. Se encarga de calcular montos netos después de fees, crear transferencias a cuentas Stripe Connect, y rastrear el estado de los pagos.

## Arquitectura

### Servicio: `payments-service`
- **Puerto**: 4007
- **Base de datos**: `piums_payments`
- **Integración**: Stripe Connect para transferencias

### Componentes

```
payments-service/
├── src/
│   ├── clients/
│   │   ├── artists.client.ts      # Cliente HTTP para artists-service
│   │   └── booking.client.ts      # Cliente HTTP para booking-service
│   ├── controller/
│   │   └── payout.controller.ts   # Controladores HTTP
│   ├── routes/
│   │   └── payout.routes.ts       # Definición de rutas
│   ├── services/
│   │   └── payout.service.ts      # Lógica de negocio
│   └── providers/
│       └── stripe.provider.ts     # Integración con Stripe (transfers, payouts)
```

## Modelo de Datos

### Tabla: `payouts`

```prisma
model Payout {
  id                String        @id @default(uuid())
  
  // Artist
  artistId          String
  
  // Relaciones
  bookingId         String?
  paymentId         String?
  
  // Stripe Connect
  stripeTransferId  String?       @unique
  stripePayoutId    String?       @unique
  stripeAccountId   String?
  
  // Montos (en centavos)
  amount            Int           // Monto neto que recibe el artista
  currency          String        @default("MXN")
  originalAmount    Int?          // Monto antes de fees
  platformFee       Int?          // Fee de plataforma (15%)
  stripeFee         Int?          // Fee de Stripe
  
  // Estado
  status            PayoutStatus  @default(PENDING)
  payoutType        PayoutType    @default(BOOKING_PAYMENT)
  
  // Fechas
  scheduledFor      DateTime?
  processedAt       DateTime?
  failedAt          DateTime?
  
  // Errores
  failureCode       String?
  failureMessage    String?
  
  // Metadata
  description       String?
  metadata          Json?
  internalNotes     String?
  
  // Auditoría
  deletedAt         DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  @@index([artistId])
  @@index([bookingId])
  @@index([status])
  @@index([scheduledFor])
}
```

### Enums

#### PayoutStatus
Estados del ciclo de vida de un payout:

- **PENDING**: Creado pero no procesado
- **SCHEDULED**: Programado para fecha futura
- **PROCESSING**: Iniciando transferencia
- **IN_TRANSIT**: Stripe está procesando
- **COMPLETED**: Exitosamente completado
- **FAILED**: Falló la transferencia
- **CANCELLED**: Cancelado manualmente
- **REVERSED**: Revertido (chargeback/disputa)

#### PayoutType
Tipos de payout:

- **BOOKING_PAYMENT**: Pago por reserva completada (aplican fees)
- **MANUAL**: Pago manual/ajuste
- **ADJUSTMENT**: Ajuste de saldo
- **BONUS**: Bono o incentivo
- **REFUND_REVERSAL**: Reversión de reembolso

## Flujo de Trabajo

### 1. Creación de Payout

Cuando una reserva se completa:

```typescript
POST /api/payouts
{
  "artistId": "artist-uuid",
  "bookingId": "booking-uuid",
  "amount": 85000, // $850 MXN (después de fees)
  "currency": "MXN",
  "payoutType": "BOOKING_PAYMENT",
  "description": "Pago por Maquillaje de Novia"
}
```

**Cálculo de Fees** (para `BOOKING_PAYMENT`):
```
Monto original (cliente pagó): $1,000 MXN
- Platform Fee (15%):           -$150 MXN
- Stripe Fee (~2.9% + $3):      -$32 MXN
= Monto neto (artista recibe):  $818 MXN
```

### 2. Procesamiento

El payout se procesa (transferencia a Stripe Connect):

```typescript
POST /api/payouts/{id}/process
```

**Validaciones**:
1. ✅ Artista tiene cuenta Stripe Connect
2. ✅ Cuenta está verificada y puede recibir pagos
3. ✅ Estado es PENDING o SCHEDULED
4. ✅ Si está scheduled, la fecha ya pasó

**Acciones**:
1. Actualizar estado a `PROCESSING`
2. Crear transfer en Stripe Connect
3. Actualizar con `stripeTransferId`
4. Cambiar estado a `IN_TRANSIT`

### 3. Sincronización de Estado

Verificar el estado real en Stripe:

```typescript
POST /api/payouts/{id}/sync
```

Consulta el transfer en Stripe y actualiza el estado local.

### 4. Completion Webhook (futuro)

Stripe enviará webhooks cuando:
- Transfer completado → `COMPLETED`
- Transfer fallido → `FAILED`
- Transfer revertido → `REVERSED`

## API Endpoints

### Crear Payout
```http
POST /api/payouts
Content-Type: application/json
Authorization: Bearer {token}

{
  "artistId": "string",
  "bookingId": "string?",
  "paymentId": "string?",
  "amount": number,
  "currency": "string?",
  "payoutType": "PayoutType?",
  "description": "string?",
  "scheduledFor": "ISO8601?",
  "metadata": {}
}

Response: 201 Created
{
  "id": "payout-uuid",
  "status": "PENDING",
  ...
}
```

### Listar Payouts
```http
GET /api/payouts?artistId=string&status=PENDING&limit=20&page=1
Authorization: Bearer {token}

Response: 200 OK
{
  "payouts": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### Obtener Payout
```http
GET /api/payouts/{id}
Authorization: Bearer {token}

Response: 200 OK
{
  "id": "payout-uuid",
  "artistId": "artist-uuid",
  "amount": 85000,
  "status": "COMPLETED",
  ...
}
```

### Procesar Payout
```http
POST /api/payouts/{id}/process
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Payout procesado exitosamente",
  "payout": {
    "id": "payout-uuid",
    "status": "IN_TRANSIT",
    "stripeTransferId": "tr_...",
    ...
  }
}
```

### Cancelar Payout
```http
POST /api/payouts/{id}/cancel
Content-Type: application/json
Authorization: Bearer {token}

{
  "reason": "string"
}

Response: 200 OK
{
  "message": "Payout cancelado",
  "payout": { ... }
}
```

### Sincronizar Estado
```http
POST /api/payouts/{id}/sync
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Estado sincronizado",
  "payout": { ... }
}
```

### Payouts de Artista
```http
GET /api/payouts/artists/{artistId}?status=COMPLETED
Authorization: Bearer {token}

Response: 200 OK
{
  "payouts": [...],
  "pagination": { ... }
}
```

### Estadísticas de Artista
```http
GET /api/payouts/artists/{artistId}/stats
Authorization: Bearer {token}

Response: 200 OK
{
  "total": 45,
  "pending": 2,
  "processing": 1,
  "completed": 40,
  "failed": 2,
  "totalAmount": 4250000,      // Total histórico
  "completedAmount": 4000000    // Solo completados
}
```

### Calcular Payout
```http
POST /api/payouts/calculate
Content-Type: application/json
Authorization: Bearer {token}

{
  "originalAmount": 100000,    // $1,000 MXN
  "payoutType": "BOOKING_PAYMENT"
}

Response: 200 OK
{
  "originalAmount": 100000,
  "platformFee": 15000,          // 15%
  "stripeFee": 3200,             // ~2.9% + $3
  "netAmount": 81800,            // Lo que recibe
  "platformFeePercentage": 15
}
```

## Integración con Otros Servicios

### artists-service
**Cliente**: `artists.client.ts`

```typescript
// Validar artista existe
await artistsClient.validateArtist(artistId);

// Obtener cuenta Stripe Connect
const account = await artistsClient.getStripeConnectAccount(artistId);
// {
//   stripeAccountId: "acct_...",
//   isConnected: true,
//   canReceivePayouts: true
// }
```

### booking-service
**Cliente**: `booking.client.ts`

```typescript
// Validar reserva
const booking = await bookingClient.getBooking(bookingId);
// { id, artistId, clientId, totalCents, status, ... }
```

## Stripe Connect Integration

### Transfer a Cuenta Connect

```typescript
// Creado por: payoutService.processPayout()
const transfer = await stripeProvider.createTransfer({
  amount: 85000,                    // Centavos
  currency: "MXN",
  destination: "acct_123...",       // Stripe Connect Account ID
  description: "Pago por reserva",
  metadata: {
    payoutId: "payout-uuid",
    artistId: "artist-uuid",
    bookingId: "booking-uuid"
  }
});

// Transfer ID: tr_1XYZ...
```

### Payout a Cuenta Bancaria (futuro)

```typescript
// Ejecutado en contexto de cuenta Connect del artista
const payout = await stripeProvider.createPayout({
  amount: 85000,
  currency: "MXN",
  description: "Retiro a cuenta bancaria"
}, stripeAccountId);

// Payout ID: po_1XYZ...
```

## Configuración

### Variables de Entorno

```env
# payments-service/.env

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Services
ARTISTS_SERVICE_URL=http://localhost:4001
BOOKING_SERVICE_URL=http://localhost:4005

# Platform Fees
PLATFORM_FEE_PERCENTAGE=15    # 15% de cada transacción
```

### Onboarding de Artistas (Stripe Connect)

Los artistas deben completar el onboarding de Stripe Connect antes de recibir payouts:

1. Crear Stripe Connect Account (Express type)
2. Generar onboarding link
3. Artista completa información bancaria
4. Stripe verifica la cuenta
5. `canReceivePayouts: true`

## Casos de Uso

### Caso 1: Pago por Reserva Completada

```typescript
// 1. Cliente completa el pago ($1,000 MXN)
// 2. Reserva marca como COMPLETED
// 3. Sistema crea payout automático

await payoutService.createPayout({
  artistId: booking.artistId,
  bookingId: booking.id,
  paymentId: payment.id,
  amount: 85000,  // Ya calculado con fees
  payoutType: "BOOKING_PAYMENT",
  description: `Pago por ${serviceName}`
});

// 4. Admin o cron job procesa payouts pendientes
await payoutService.processPayout(payoutId);
```

### Caso 2: Pago Programado (7 días después)

```typescript
const scheduledDate = new Date();
scheduledDate.setDate(scheduledDate.getDate() + 7);

await payoutService.createPayout({
  artistId: "...",
  amount: 85000,
  scheduledFor: scheduledDate,
  description: "Pago con retención de 7 días"
});

// Cron job diario procesa payouts scheduled
// if (payout.scheduledFor <= new Date()) {
//   await processPayout(payout.id);
// }
```

### Caso 3: Ajuste Manual

```typescript
await payoutService.createPayout({
  artistId: "...",
  amount: 10000,
  payoutType: "ADJUSTMENT",
  description: "Ajuste por error en reserva anterior",
  metadata: {
    originalBookingId: "...",
    reason: "Cliente pagó de más"
  }
});
```

## Monitoreo y Logs

### Logs Importantes

```typescript
// Payout creado
logger.info("Payout creado", "PAYOUT_SERVICE", {
  payoutId,
  artistId,
  amount,
  status
});

// Transfer exitoso
logger.info("Payout procesado", "PAYOUT_SERVICE", {
  payoutId,
  transferId,
  amount
});

// Error al procesar
logger.error("Error procesando payout", "PAYOUT_SERVICE", {
  payoutId,
  error: error.message
});
```

### Métricas Clave

- **Total de payouts creados** (por día/mes)
- **Tasa de éxito** (completed / total)
- **Tiempo promedio** (created → completed)
- **Monto total pagado** (por mes)
- **Payouts pendientes** (alerta si > threshold)

## Seguridad

### Validaciones

1. ✅ Artista existe y está activo
2. ✅ Booking pertenece al artista
3. ✅ Cuenta Stripe Connect verificada
4. ✅ Solo PENDING/SCHEDULED pueden procesarse
5. ✅ Solo PENDING/SCHEDULED pueden cancelarse

### Permisos

- **Admin**: Puede crear, procesar, cancelar cualquier payout
- **Artist**: Puede ver sus propios payouts y stats
- **Service-to-service**: Puede crear payouts automáticos

## Testing

Ver script: `/services/test-payouts.sh`

```bash
chmod +x services/test-payouts.sh
./services/test-payouts.sh
```

## Futuras Mejoras

1. **Webhooks de Stripe**: Escuchar eventos transfer.* y payout.*
2. **Batch processing**: Procesar múltiples payouts de un artista
3. **Calendario de pagos**: Pagar automáticamente cada viernes
4. **Dashboard de artista**: Vista de ingresos y payouts
5. **Reportes fiscales**: Generar comprobantes de pago
6. **Multi-currency**: Soporte para USD, EUR
7. **Instant payouts**: Pagos instantáneos (con fee adicional)
8. **Balance acumulado**: Tracking de balance pendiente por artista

## Soporte

Para problemas con payouts:

1. Verificar logs de `payments-service`
2. Revisar cuenta Stripe Connect del artista
3. Verificar estado del transfer en Stripe Dashboard
4. Sincronizar estado: `POST /api/payouts/{id}/sync`
5. Si falla repetidamente, marcar como FAILED y crear ticket

---

**Última actualización**: 23 de febrero de 2026
**Versión**: 1.0.0
