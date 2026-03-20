# Integración Booking ↔ Payments

Documentación de la integración completa entre `booking-service` y `payments-service` para procesamiento automático de depósitos y pagos.

## 🎯 Objetivo

Cuando un cliente crea una reservación que requiere depósito, el sistema automáticamente:
1. Crea un Payment Intent en Stripe
2. Retorna el `clientSecret` al cliente
3. El cliente procesa el pago en el frontend
4. Stripe envía webhook cuando el pago es exitoso
5. El booking se actualiza automáticamente con el estado de pago

## 📊 Flujo Completo

```
┌─────────────┐
│   Cliente   │
└──────┬──────┘
       │
       │ 1. POST /bookings
       ▼
┌──────────────────┐
│ booking-service  │
├──────────────────┤
│ createBooking()  │◄──── Detecta depositRequired = true
└────────┬─────────┘
         │
         │ 2. Llama a payments-service
         ▼
┌──────────────────┐
│payments-service  │
├──────────────────┤
│createPaymentIntent()│◄──── Crea Stripe Payment Intent
└────────┬─────────┘
         │
         │ 3. Retorna clientSecret
         ▼
┌──────────────────┐
│ booking-service  │
├──────────────────┤
│ Actualiza booking│
│ con paymentIntentId │
└────────┬─────────┘
         │
         │ 4. Retorna {booking, paymentIntent}
         ▼
┌─────────────┐
│   Cliente   │
│  Frontend   │
├─────────────┤
│ Stripe.js   │◄──── Procesa pago con clientSecret
└──────┬──────┘
       │
       │ 5. Usuario ingresa tarjeta
       ▼
┌─────────────┐
│   Stripe    │◄──── Procesa pago
└──────┬──────┘
       │
       │ 6. payment_intent.succeeded webhook
       ▼
┌──────────────────┐
│payments-service  │
├──────────────────┤
│ Webhook handler  │
│ recordPayment()  │
└────────┬─────────┘
         │
         │ 7. POST /bookings/:id/mark-payment
         ▼
┌──────────────────┐
│ booking-service  │
├──────────────────┤
│ markPayment()    │◄──── Actualiza paymentStatus
│ status → DEPOSIT_PAID │
└────────┬─────────┘
         │
         │ 8. Notificación de pago exitoso
         ▼
┌─────────────┐
│   Cliente   │
└─────────────┘
```

## 🔧 Cambios Implementados

### 1. Schema de Booking (booking-service)

**Nuevo campo agregado en `prisma/schema.prisma`:**

```prisma
model Booking {
  // ... campos existentes ...
  
  depositRequired Boolean     @default(false)
  depositAmount   Int?        // Monto del depósito en centavos
  depositPaidAt   DateTime?
  
  paymentStatus   PaymentStatus @default(PENDING)
  paymentIntentId String?     // 🆕 ID del Payment Intent de Stripe
  paidAmount      Int          @default(0)
  paidAt          DateTime?
  paymentMethod   String?
  
  // ... resto de campos ...
}
```

### 2. Cliente HTTP para payments-service

**Archivo**: `src/clients/payments.client.ts`

Métodos disponibles:
- `createPaymentIntent()` - Crear Payment Intent para booking
- `getPaymentIntent()` - Obtener detalles de Payment Intent
- `cancelPaymentIntent()` - Cancelar Payment Intent
- `getBookingPayments()` - Listar pagos de un booking

**Características**:
- Genera tokens JWT dinámicos para cada request (seguridad inter-service)
- Timeout y error handling automático
- Logging de errores

### 3. Lógica de Creación de Booking

**Archivo**: `src/services/booking.service.ts`

**Función `createBooking()` actualizada:**

```typescript
async createBooking(data) {
  // ... validaciones y creación del booking ...
  
  // 🆕 Si se requiere depósito, crear Payment Intent
  let paymentIntent = null;
  if (depositRequired && depositAmount > 0) {
    const paymentIntentResponse = await paymentsClient.createPaymentIntent({
      bookingId: booking.id,
      amount: depositAmount,
      currency: 'MXN',
      paymentType: 'DEPOSIT',
      userId: data.clientId,
    });

    if (paymentIntentResponse) {
      paymentIntent = paymentIntentResponse.paymentIntent;
      
      // Actualizar booking con el paymentIntentId
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentIntentId: paymentIntent.id },
      });
    }
  }
  
  // 🆕 Retornar booking + paymentIntent
  return {
    booking,
    paymentIntent: paymentIntent ? {
      id: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    } : null,
  };
}
```

### 4. Endpoint markPayment Actualizado

**Schema actualizado** (`src/schemas/booking.schema.ts`):

```typescript
export const markPaymentSchema = z.object({
  amount: z.number().int().min(0),
  paymentMethod: z.string().optional(),
  paymentIntentId: z.string().optional(),  // 🆕
  paymentType: z.enum(['DEPOSIT', 'FULL_PAYMENT', 'REMAINING']).optional(),  // 🆕
});
```

**Servicio actualizado** (`src/services/booking.service.ts`):

```typescript
async markPayment(
  id: string,
  amount: number,
  paymentMethod?: string,
  paymentIntentId?: string,  // 🆕
  paymentType?: 'DEPOSIT' | 'FULL_PAYMENT' | 'REMAINING'  // 🆕
) {
  // Determinar el nuevo status de pago basado en el tipo de pago
  if (paymentType === 'DEPOSIT') {
    newPaymentStatus = "DEPOSIT_PAID";
  } else if (paymentType === 'FULL_PAYMENT' || newPaidAmount >= booking.totalPrice) {
    newPaymentStatus = "FULLY_PAID";
  }
  // ... lógica adicional ...
}
```

### 5. Utilidad JWT para Inter-Service Communication

**Archivo**: `src/utils/jwt.ts` (🆕)

```typescript
export const generateServiceToken = (userId: string, email?: string): string => {
  return jwt.sign(
    {
      userId,
      email: email || 'service@internal',
      isService: true,
    },
    JWT_SECRET,
    { expiresIn: '5m' }
  );
};
```

**Propósito**: Generar tokens JWT de corta duración para comunicación entre servicios, permitiendo que booking-service actúe en nombre de un usuario específico al llamar a payments-service.

## 📡 API Endpoints

### Crear Booking con Depósito

**Request:**
```bash
POST /api/bookings/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "artistId": "uuid",
  "serviceId": "uuid",
  "scheduledDate": "2026-02-21T14:00:00Z",
  "durationMinutes": 60,
  "location": "Calle Principal 123, CDMX",
  "clientNotes": "Por favor confirmar"
}
```

**Response cuando requiere depósito:**
```json
{
  "booking": {
    "id": "booking-uuid",
    "clientId": "user-uuid",
    "artistId": "artist-uuid",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "depositRequired": true,
    "depositAmount": 30000,
    "totalPrice": 100000,
    "paymentIntentId": "payment-intent-uuid",
    "scheduledDate": "2026-02-21T14:00:00Z",
    "createdAt": "2026-02-20T18:00:00Z"
  },
  "paymentIntent": {
    "id": "payment-intent-uuid",
    "clientSecret": "pi_xxx_secret_yyy",
    "amount": 30000,
    "currency": "MXN",
    "status": "CREATED"
  }
}
```

**Response cuando NO requiere depósito:**
```json
{
  "booking": {
    "id": "booking-uuid",
    // ... campos del booking ...
    "depositRequired": false,
    "paymentStatus": "DEPOSIT_PAID"
  },
  "paymentIntent": null
}
```

### Marcar Pago (Webhook de Stripe → payments-service → booking-service)

**Request:**
```bash
POST /api/bookings/bookings/:bookingId/mark-payment
Authorization: Bearer {service-token}
Content-Type: application/json

{
  "amount": 30000,
  "paymentMethod": "card",
  "paymentIntentId": "payment-intent-uuid",
  "paymentType": "DEPOSIT"
}
```

**Response:**
```json
{
  "id": "booking-uuid",
  "paymentStatus": "DEPOSIT_PAID",
  "paidAmount": 30000,
  "depositPaidAt": "2026-02-20T18:05:00Z",
  "paymentIntentId": "payment-intent-uuid",
  "paymentMethod": "card"
}
```

## 🎨 Uso en Frontend

### 1. Crear Booking

```javascript
const response = await fetch('/api/bookings/bookings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    artistId: selectedArtist.id,
    serviceId: selectedService.id,
    scheduledDate: bookingDate,
    durationMinutes: 60,
    location: userLocation
  })
});

const { booking, paymentIntent } = await response.json();

// Si se requiere depósito, procesar pago
if (paymentIntent) {
  await processPayment(paymentIntent.clientSecret, paymentIntent.amount);
} else {
  // No se requiere depósito, booking confirmado
  showSuccess('Booking confirmado sin depósito');
}
```

### 2. Procesar Pago con Stripe.js

```javascript
const stripe = Stripe('pk_test_...');

async function processPayment(clientSecret, amount) {
  // Mostrar UI de pago
  const { error, paymentIntent } = await stripe.confirmCardPayment(
    clientSecret,
    {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: userName
        }
      }
    }
  );

  if (error) {
    // Mostrar error al usuario
    showError(error.message);
  } else if (paymentIntent.status === 'succeeded') {
    // Pago exitoso
    // El webhook se encargará de actualizar el booking
    showSuccess('¡Pago procesado! Tu reservación está confirmada.');
    
    // Opcional: Poll el booking para actualizar UI
    await pollBookingStatus(bookingId);
  }
}
```

### 3. Verificar Estado de Pago (Opcional)

```javascript
async function pollBookingStatus(bookingId) {
  const maxAttempts = 10;
  const interval = 2000; // 2 segundos
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/api/bookings/bookings/${bookingId}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    
    const booking = await response.json();
    
    if (booking.paymentStatus === 'DEPOSIT_PAID') {
      // Pago confirmado
      updateUIWithBookingStatus(booking);
      return;
    }
    
    await sleep(interval);
  }
  
  // Timeout - mostrar mensaje al usuario
  showInfo('Tu pago está siendo procesado. Te notificaremos cuando se confirme.');
}
```

## 🔐 Seguridad

### Tokens JWT Inter-Service

Los tokens generados para comunicación inter-service:
- ✅ Expiran en 5 minutos (corta duración)
- ✅ Contienen el `userId` del cliente real
- ✅ Incluyen flag `isService: true` para identificación
- ✅ Usan el mismo `JWT_SECRET` compartido

### Validaciones

- ✅ Solo el usuario propietario puede crear bookings
- ✅ Solo payments-service puede llamar a `mark-payment` (requiere service token)
- ✅ Verificación de firma de webhooks de Stripe
- ✅ Validación de montos y estados de pago

## 🧪 Testing

### Ejecutar Tests de Integración

```bash
cd /Users/piums/Desktop/piums-platform/services/booking-service

# Asegúrate de tener un usuario de prueba creado
# Edita test-payments-integration.sh con credenciales válidas

./test-payments-integration.sh
```

### Tests Cubiertos

1. ✅ Autenticación de usuario
2. ✅ Crear booking con depósito requerido
3. ✅ Verificar Payment Intent creado automáticamente
4. ✅ Obtener booking y verificar paymentIntentId
5. ✅ Consultar Payment Intent desde payments-service
6. ✅ Simular pago exitoso (markPayment)
7. ✅ Verificar actualización de paymentStatus

### Testing Manual con Stripe CLI

Para probar webhooks en desarrollo:

```bash
# Terminal 1: Iniciar servicios
cd services/booking-service && pnpm run dev
cd services/payments-service && pnpm run dev

# Terminal 2: Forward webhooks de Stripe
stripe listen --forward-to localhost:4007/api/webhooks/stripe

# Terminal 3: Crear booking y procesar pago
# El webhook llegará automáticamente al payments-service
```

## 📝 Configuración Necesaria

### booking-service (.env)

```bash
# ... otras variables ...
PAYMENTS_SERVICE_URL=http://localhost:4007
JWT_SECRET=piums_dev_secret_jwt_2026_change_in_production
```

### payments-service (.env)

```bash
# ... otras variables ...
BOOKING_SERVICE_URL=http://localhost:4005
JWT_SECRET=piums_dev_secret_jwt_2026_change_in_production  # Mismo secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🐛 Troubleshooting

### Error: "Token de autenticación no proporcionado"
**Causa**: payments-service no reconoce el token generado por booking-service.
**Solución**: Verifica que ambos servicios usan el mismo `JWT_SECRET`.

### Payment Intent creado pero booking no actualizado
**Causa**: Error en llamada a payments-service.
**Solución**: 
1. Verifica logs de booking-service
2. Verifica que payments-service está corriendo en puerto 4007
3. Verifica variable `PAYMENTS_SERVICE_URL` en booking-service

### Webhook no actualiza booking
**Causa**: payments-service no puede llamar a booking-service.
**Solución**:
1. Verifica logs de payments-service
2. Verifica que booking-service está corriendo en puerto 4005
3. Verifica variable `BOOKING_SERVICE_URL` en payments-service
4. Revisa endpoint `/bookings/:id/mark-payment` en booking-service

### paymentIntentId es null en booking
**Causa**: Error al actualizar booking después de crear Payment Intent.
**Solución**: Verifica logs y que depositRequired = true y depositAmount > 0

## 📊 Estados de Pago

### PaymentStatus Enum

- `PENDING` - Esperando pago
- `DEPOSIT_PAID` - Depósito pagado (30%)
- `FULLY_PAID` - Totalmente pagado (100%)
- `REFUNDED` - Reembolsado
- `PARTIALLY_REFUNDED` - Reembolso parcial

### Transiciones de Estado

```
PENDING
  │
  │ (pago de depósito exitoso)
  ▼
DEPOSIT_PAID
  │
  │ (pago del balance restante)
  ▼
FULLY_PAID
  │
  │ (solicitud de reembolso)
  ▼
PARTIALLY_REFUNDED / REFUNDED
```

## 🚀 Próximas Mejoras

- [ ] Soporte para pagos diferidos (pagar después)
- [ ] Recordatorios automáticos de pago de balance
- [ ] Renovación automática de Payment Intents expirados
- [ ] Dashboard de admin para gestionar pagos
- [ ] Soporte para múltiples métodos de pago (OXXO, SPEI)
- [ ] Reembolsos automáticos por cancelación

---

**Versión**: 1.0.0  
**Última actualización**: 20 Feb 2026  
**Mantenedor**: Piums Platform Team
