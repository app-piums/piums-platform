# Payments Service

Sistema de procesamiento de pagos para la plataforma Piums. Integración completa con Stripe para gestionar pagos de reservaciones, depósitos, reembolsos y métodos de pago guardados.

## 🌟 Características

- ✅ **Payment Intents de Stripe** - Flujo moderno y seguro de Stripe
- ✅ **Múltiples tipos de pago** - Depósitos, pagos completos, pagos restantes
- ✅ **Reembolsos** - Completos y parciales con seguimiento automático
- ✅ **Webhooks de Stripe** - Procesamiento automático y confiable
- ✅ **Métodos de pago guardados** - Tarjetas para clientes recurrentes
- ✅ **Tracking de comisiones** - Platform fee + Stripe fee
- ✅ **Audit trail completo** - Registro de todos los eventos de webhooks
- ✅ **Soft delete** - Mantiene histórico para auditorías
- ✅ **Rate limiting** - Protección contra abuso y fraude
- ✅ **Integración con servicios** - Booking y Notifications

## 📋 Requisitos Previos

- Node.js >= 18
- PostgreSQL >= 14
- Cuenta de Stripe (con API keys y webhook secret)
- auth-service corriendo (puerto 4001)
- booking-service corriendo (puerto 4005)
- notifications-service corriendo (puerto 4006)

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del servicio:

```bash
# Server
PORT=4007
NODE_ENV=development

# Database
DATABASE_URL="postgresql://piums_user:piums_password@localhost:5432/piums_payments"

# Auth
JWT_SECRET=tu_jwt_secret_compartido

# Stripe
STRIPE_SECRET_KEY=sk_test_... # Tu Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_... # Tu Stripe publishable key
STRIPE_WEBHOOK_SECRET=whsec_... # Tu Stripe webhook secret

# Service URLs
BOOKING_SERVICE_URL=http://localhost:4005
NOTIFICATIONS_SERVICE_URL=http://localhost:4006
```

### Instalación

```bash
# Instalar dependencias
pnpm install

# Crear base de datos
node create-db.js

# Sincronizar schema de Prisma
pnpm run prisma:push

# Generar Prisma Client
pnpm run prisma:generate
```

### Configuración de Stripe

1. **Crear cuenta de Stripe**: https://dashboard.stripe.com/register

2. **Obtener API Keys**:
   - Dashboard → Developers → API keys
   - Copia `Secret key` y `Publishable key`

3. **Configurar Webhook**:
   - Dashboard → Developers → Webhooks → Add endpoint
   - URL: `https://tu-dominio.com/api/webhooks/stripe`
   - Eventos a suscribir:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
     - `payment_intent.canceled`
   - Copia el `Signing secret` (whsec_...)

4. **Testing Local con Stripe CLI**:
   ```bash
   # Instalar Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login
   stripe login
   
   # Forward webhooks a local
   stripe listen --forward-to localhost:4007/api/webhooks/stripe
   
   # El comando te dará un webhook secret para desarrollo
   ```

## 🚀 Ejecución

```bash
# Desarrollo (con hot reload)
pnpm run dev

# Producción
pnpm run build
pnpm start
```

## 📊 Modelos de Datos

### Payment
Registro principal de pagos procesados.

```typescript
{
  id: string (UUID)
  userId: string
  bookingId?: string // Opcional, puede no estar asociado a booking
  
  // Stripe IDs
  stripePaymentIntentId: string (unique)
  stripeChargeId?: string
  
  // Montos (en centavos)
  amount: number
  currency: string (default: "MXN")
  amountReceived?: number // Después de fees
  
  // Estado y tipo
  status: PaymentStatus // 7 estados
  paymentType: PaymentType // DEPOSIT | FULL_PAYMENT | REMAINING | REFUND
  
  // Método de pago
  paymentMethod?: string // "card", "oxxo", "spei"
  paymentMethodDetails?: JSON // { brand: "visa", last4: "4242" }
  
  // Comisiones
  platformFee?: number // Comisión de Piums
  stripeFee?: number // Comisión de Stripe
  
  // Reembolsos
  refundedAmount: number (default: 0)
  refunds: Refund[]
  
  // Timestamps
  paidAt?: DateTime
  failedAt?: DateTime
  
  // Errores
  failureCode?: string
  failureMessage?: string
  
  // Audit
  deletedAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

**PaymentStatus Enum**:
- `PENDING` - Creado, esperando pago
- `PROCESSING` - En proceso
- `SUCCEEDED` - Exitoso
- `FAILED` - Falló
- `CANCELLED` - Cancelado
- `PARTIALLY_REFUNDED` - Reembolso parcial
- `FULLY_REFUNDED` - Reembolso completo

**PaymentType Enum**:
- `DEPOSIT` - Depósito inicial (típicamente 30%)
- `FULL_PAYMENT` - Pago completo al reservar
- `REMAINING` - Pago de balance restante
- `REFUND` - Reembolso procesado

### PaymentIntent
Tracking de Stripe Payment Intents.

```typescript
{
  id: string (UUID)
  stripePaymentIntentId: string (unique)
  userId: string
  bookingId?: string
  
  amount: number
  currency: string
  
  status: PaymentIntentStatus // 6 estados
  clientSecret: string // Para frontend
  
  paymentMethods: string[] // ["card", "oxxo"]
  
  confirmedAt?: DateTime
  cancelledAt?: DateTime
  expiresAt?: DateTime
  
  deletedAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

**PaymentIntentStatus Enum**:
- `CREATED` - Creado
- `REQUIRES_ACTION` - Requiere acción del usuario (3D Secure)
- `PROCESSING` - Procesando
- `SUCCEEDED` - Exitoso
- `CANCELLED` - Cancelado
- `FAILED` - Falló

### Refund
Registro de reembolsos.

```typescript
{
  id: string (UUID)
  paymentId: string
  stripeRefundId: string (unique)
  
  requestedBy: string // userId quien solicitó
  amount: number
  currency: string
  
  status: RefundStatus // 4 estados
  reason?: string
  
  processedAt?: DateTime
  failedAt?: DateTime
  failureReason?: string
  
  deletedAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

**RefundStatus Enum**:
- `PENDING` - Solicitado
- `PROCESSING` - En proceso
- `SUCCEEDED` - Exitoso
- `FAILED` - Falló

### PaymentMethod
Métodos de pago guardados.

```typescript
{
  id: string (UUID)
  userId: string
  stripePaymentMethodId: string (unique)
  
  type: string // "card", "oxxo_debit", etc.
  
  // Detalles de tarjeta
  cardBrand?: string // "visa", "mastercard", "amex"
  cardLast4?: string
  cardExpMonth?: number
  cardExpYear?: number
  
  isDefault: boolean
  
  deletedAt?: DateTime
  createdAt: DateTime
  updatedAt: DateTime
}
```

### WebhookEvent
Audit trail de eventos de Stripe.

```typescript
{
  id: string (UUID)
  stripeEventId: string (unique)
  eventType: string // "payment_intent.succeeded"
  
  payload: JSON // Evento completo de Stripe
  
  processed: boolean
  processedAt?: DateTime
  
  error?: string
  retries: number (default: 0)
  
  deletedAt?: DateTime
  createdAt: DateTime
}
```

## 🔌 API Endpoints

### Health Check

#### `GET /health`
Estado del servicio.

**Response:**
```json
{
  "status": "healthy",
  "service": "payments-service",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600.5
}
```

---

### Payment Intents

#### `POST /api/payments/payment-intents`
Crear Payment Intent para iniciar proceso de pago.

**Auth:** Required (JWT)

**Body:**
```json
{
  "bookingId": "uuid", // Opcional
  "amount": 30000, // En centavos (300.00 MXN)
  "currency": "MXN", // Opcional, default MXN
  "paymentType": "DEPOSIT", // DEPOSIT | FULL_PAYMENT | REMAINING
  "paymentMethods": ["card", "oxxo"] // Opcional, default ["card"]
}
```

**Response:**
```json
{
  "paymentIntent": {
    "id": "uuid",
    "stripePaymentIntentId": "pi_...",
    "clientSecret": "pi_..._secret_...", // Usar en frontend
    "amount": 30000,
    "currency": "MXN",
    "status": "CREATED",
    "paymentMethods": ["card", "oxxo"]
  }
}
```

#### `GET /api/payments/payment-intents/:id`
Obtener detalles de Payment Intent.

**Auth:** Required (JWT)

**Response:**
```json
{
  "paymentIntent": {
    "id": "uuid",
    "stripePaymentIntentId": "pi_...",
    "amount": 30000,
    "currency": "MXN",
    "status": "SUCCEEDED",
    "confirmedAt": "2024-01-15T10:35:00Z"
  }
}
```

#### `POST /api/payments/payment-intents/confirm`
Confirmar Payment Intent (server-side, opcional).

**Auth:** Required (JWT)

**Body:**
```json
{
  "paymentIntentId": "uuid"
}
```

#### `POST /api/payments/payment-intents/:paymentIntentId/cancel`
Cancelar Payment Intent.

**Auth:** Required (JWT)

**Response:**
```json
{
  "paymentIntent": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelledAt": "2024-01-15T10:40:00Z"
  }
}
```

---

### Payments

#### `GET /api/payments/payments`
Buscar pagos con filtros.

**Auth:** Required (JWT)

**Query Params:**
```
userId=uuid // Admin puede filtrar por cualquier usuario
bookingId=uuid
status=SUCCEEDED // PENDING | PROCESSING | SUCCEEDED | FAILED | ...
paymentType=DEPOSIT // DEPOSIT | FULL_PAYMENT | REMAINING
startDate=2024-01-01
endDate=2024-01-31
page=1
limit=20
```

**Response:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "userId": "uuid",
      "bookingId": "uuid",
      "stripePaymentIntentId": "pi_...",
      "amount": 30000,
      "currency": "MXN",
      "status": "SUCCEEDED",
      "paymentType": "DEPOSIT",
      "paymentMethod": "card",
      "paymentMethodDetails": {
        "brand": "visa",
        "last4": "4242"
      },
      "platformFee": 3000,
      "stripeFee": 1200,
      "amountReceived": 25800,
      "paidAt": "2024-01-15T10:35:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### `GET /api/payments/payments/:id`
Obtener pago por ID con refunds.

**Auth:** Required (JWT)

**Response:**
```json
{
  "payment": {
    "id": "uuid",
    "userId": "uuid",
    "bookingId": "uuid",
    "amount": 30000,
    "status": "PARTIALLY_REFUNDED",
    "refundedAmount": 10000,
    "refunds": [
      {
        "id": "uuid",
        "amount": 10000,
        "status": "SUCCEEDED",
        "reason": "Cancelación anticipada",
        "processedAt": "2024-01-20T15:00:00Z"
      }
    ]
  }
}
```

#### `GET /api/payments/payments/stats`
Estadísticas de pagos del usuario.

**Auth:** Required (JWT)

**Query Params:**
```
startDate=2024-01-01 // Opcional
endDate=2024-01-31 // Opcional
```

**Response:**
```json
{
  "stats": {
    "total": {
      "count": 45,
      "amount": 1350000 // En centavos
    },
    "byStatus": {
      "SUCCEEDED": {
        "count": 40,
        "amount": 1200000
      },
      "PENDING": {
        "count": 3,
        "amount": 90000
      },
      "FAILED": {
        "count": 2,
        "amount": 60000
      }
    },
    "refunded": {
      "count": 5,
      "amount": 150000
    }
  }
}
```

---

### Refunds

#### `POST /api/payments/refunds`
Crear reembolso (completo o parcial).

**Auth:** Required (JWT)

**Body:**
```json
{
  "paymentId": "uuid",
  "amount": 10000, // Opcional, si no se especifica reembolsa todo
  "reason": "Cancelación por mal tiempo"
}
```

**Response:**
```json
{
  "refund": {
    "id": "uuid",
    "paymentId": "uuid",
    "stripeRefundId": "re_...",
    "amount": 10000,
    "status": "PROCESSING",
    "reason": "Cancelación por mal tiempo",
    "requestedBy": "uuid"
  }
}
```

#### `GET /api/payments/refunds/:id`
Obtener detalles de reembolso.

**Auth:** Required (JWT)

**Response:**
```json
{
  "refund": {
    "id": "uuid",
    "paymentId": "uuid",
    "amount": 10000,
    "status": "SUCCEEDED",
    "processedAt": "2024-01-20T15:00:00Z"
  }
}
```

---

### Webhooks

#### `POST /api/webhooks/stripe`
Endpoint para webhooks de Stripe (uso interno).

**Auth:** Stripe signature verification

**Headers:**
```
stripe-signature: t=...,v1=...
```

**Eventos procesados:**
- `payment_intent.succeeded` → Registra pago, actualiza booking, envía notificación
- `payment_intent.payment_failed` → Actualiza status a FAILED
- `charge.refunded` → Actualiza refund a SUCCEEDED
- `payment_intent.canceled` → Actualiza status a CANCELLED

## 🔄 Flujos de Pago

### Flujo 1: Payment Intent (Recomendado)

```mermaid
sequenceDiagram
    participant Client
    participant Frontend
    participant PaymentsAPI
    participant Stripe
    participant Webhook
    participant BookingAPI
    participant NotificationsAPI

    Client->>Frontend: Confirmar reservación
    Frontend->>PaymentsAPI: POST /payment-intents
    PaymentsAPI->>Stripe: Create Payment Intent
    Stripe-->>PaymentsAPI: clientSecret
    PaymentsAPI-->>Frontend: { clientSecret }
    
    Frontend->>Stripe: Submit payment (Stripe.js)
    Stripe->>Stripe: Process payment
    
    Stripe->>Webhook: payment_intent.succeeded
    Webhook->>Webhook: Verify signature
    Webhook->>PaymentsAPI: recordPayment()
    PaymentsAPI->>BookingAPI: markPayment()
    PaymentsAPI->>NotificationsAPI: sendNotification()
    
    Webhook-->>Stripe: 200 OK
    NotificationsAPI-->>Client: Notificación de pago
```

**Pasos:**

1. **Frontend**: Crear Payment Intent
   ```javascript
   const response = await fetch('/api/payments/payment-intents', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       bookingId: 'uuid',
       amount: 30000, // $300.00 MXN
       paymentType: 'DEPOSIT'
     })
   });
   
   const { paymentIntent } = await response.json();
   const { clientSecret } = paymentIntent;
   ```

2. **Frontend**: Procesar pago con Stripe.js
   ```javascript
   const stripe = Stripe('pk_test_...');
   
   const { error, paymentIntent } = await stripe.confirmCardPayment(
     clientSecret,
     {
       payment_method: {
         card: cardElement,
         billing_details: {
           name: 'Customer Name'
         }
       }
     }
   );
   
   if (error) {
     // Mostrar error al usuario
     console.error(error.message);
   } else if (paymentIntent.status === 'succeeded') {
     // Pago exitoso, webhook se encargará del resto
     console.log('¡Pago procesado!');
   }
   ```

3. **Backend**: Webhook recibe confirmación
   - Verifica firma de Stripe
   - Registra pago en DB
   - Actualiza booking
   - Envía notificación

### Flujo 2: Reembolso

```mermaid
sequenceDiagram
    participant Admin
    participant PaymentsAPI
    participant Stripe
    participant Webhook
    participant NotificationsAPI
    participant User

    Admin->>PaymentsAPI: POST /refunds
    PaymentsAPI->>PaymentsAPI: Validate payment
    PaymentsAPI->>Stripe: Create Refund
    Stripe-->>PaymentsAPI: Refund created
    PaymentsAPI-->>Admin: { refund: PROCESSING }
    
    Stripe->>Webhook: charge.refunded
    Webhook->>PaymentsAPI: Update refund status
    PaymentsAPI->>NotificationsAPI: sendNotification()
    NotificationsAPI-->>User: Notificación de reembolso
```

**Ejemplo:**
```bash
curl -X POST http://localhost:4007/api/payments/refunds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "uuid",
    "amount": 15000,
    "reason": "Cancelación por cliente"
  }'
```

## 🧪 Testing

### Preparación para Testing

Antes de ejecutar los tests de integración, necesitas crear un usuario de prueba:

```bash
# Opción 1: Usar el script de creación (espera si hay rate limiting)
node create-test-user.js

# Opción 2: Registrar manualmente vía API
curl -X POST http://localhost:4001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "payments-test@example.com",
    "password": "payment123",
    "phoneNumber": "+525555999999",
    "fullName": "Payments Test User"
  }'
```

**Nota**: Si obtienes error de rate limiting, espera ~1 hora o usa un usuario ya existente editando las credenciales en `test-integration.sh`.

### Ejecutar Tests de Integración

```bash
# Dar permisos de ejecución (primera vez)
chmod +x test-integration.sh

# Ejecutar todos los tests
./test-integration.sh
```

El script ejecuta 12 tests que cubren:
- ✅ Health check
- ✅ Autenticación
- ✅ Crear Payment Intent
- ✅ Obtener Payment Intent
- ✅ Listar payments
- ✅ Filtrar por status
- ✅ Estadísticas
- ✅ Cancelar Payment Intent
- ✅ Payment Intent con booking
- ✅ Validaciones
- ✅ Seguridad (sin token)
- ✅ Rate limiting

### Testing Manual con cURL

#### 1. Crear Payment Intent
```bash
TOKEN="your_jwt_token"

curl -X POST http://localhost:4007/api/payments/payment-intents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "uuid-of-booking",
    "amount": 50000,
    "paymentType": "DEPOSIT"
  }'
```

#### 2. Listar pagos
```bash
curl -X GET "http://localhost:4007/api/payments/payments?status=SUCCEEDED&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

#### 3. Ver estadísticas
```bash
curl -X GET http://localhost:4007/api/payments/payments/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Testing con Tarjetas de Prueba de Stripe

Stripe provee tarjetas de prueba para diferentes escenarios:

- **Pago exitoso**: `4242 4242 4242 4242`
- **Pago fallido**: `4000 0000 0000 0002`
- **Requiere 3D Secure**: `4000 0025 0000 3155`
- **Fondos insuficientes**: `4000 0000 0000 9995`

Usar cualquier:
- CVC: 3 dígitos (ej: 123)
- Fecha expiración: Cualquier fecha futura
- ZIP: Cualquier valor

### Testing de Webhooks Localmente

```bash
# Terminal 1: Iniciar servicio
pnpm run dev

# Terminal 2: Forward webhooks con Stripe CLI
stripe listen --forward-to localhost:4007/api/webhooks/stripe

# Terminal 3: Trigger evento de prueba
stripe trigger payment_intent.succeeded
```

### Script de Integración

Crear `test-integration.sh`:

```bash
#!/bin/bash

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuración
API_URL="http://localhost:4007/api/payments"
AUTH_URL="http://localhost:4001/api/auth"

echo -e "${YELLOW}=== Testing Payments Service Integration ===${NC}\n"

# 1. Login
echo "1. Obteniendo token..."
LOGIN_RESPONSE=$(curl -s -X POST "$AUTH_URL/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" == "null" ]; then
  echo -e "${RED}❌ Error en login${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Token obtenido${NC}\n"

# 2. Crear Payment Intent
echo "2. Creando Payment Intent..."
PI_RESPONSE=$(curl -s -X POST "$API_URL/payment-intents" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50000,
    "paymentType": "DEPOSIT"
  }')

PI_ID=$(echo $PI_RESPONSE | jq -r '.paymentIntent.id')
CLIENT_SECRET=$(echo $PI_RESPONSE | jq -r '.paymentIntent.clientSecret')

if [ "$PI_ID" == "null" ]; then
  echo -e "${RED}❌ Error creando Payment Intent${NC}"
  echo $PI_RESPONSE | jq .
  exit 1
fi
echo -e "${GREEN}✅ Payment Intent creado: $PI_ID${NC}\n"

# 3. Obtener Payment Intent
echo "3. Obteniendo Payment Intent..."
GET_PI=$(curl -s -X GET "$API_URL/payment-intents/$PI_ID" \
  -H "Authorization: Bearer $TOKEN")

PI_STATUS=$(echo $GET_PI | jq -r '.paymentIntent.status')
echo -e "${GREEN}✅ Status: $PI_STATUS${NC}\n"

# 4. Listar pagos
echo "4. Listando pagos..."
PAYMENTS=$(curl -s -X GET "$API_URL/payments?limit=5" \
  -H "Authorization: Bearer $TOKEN")

COUNT=$(echo $PAYMENTS | jq -r '.payments | length')
echo -e "${GREEN}✅ Encontrados $COUNT pagos${NC}\n"

# 5. Estadísticas
echo "5. Obteniendo estadísticas..."
STATS=$(curl -s -X GET "$API_URL/payments/stats" \
  -H "Authorization: Bearer $TOKEN")

TOTAL=$(echo $STATS | jq -r '.stats.total.count')
echo -e "${GREEN}✅ Total de pagos: $TOTAL${NC}\n"

# 6. Cancelar Payment Intent
echo "6. Cancelando Payment Intent..."
CANCEL=$(curl -s -X POST "$API_URL/payment-intents/$PI_ID/cancel" \
  -H "Authorization: Bearer $TOKEN")

CANCELLED_STATUS=$(echo $CANCEL | jq -r '.paymentIntent.status')
echo -e "${GREEN}✅ Payment Intent cancelado: $CANCELLED_STATUS${NC}\n"

echo -e "${GREEN}=== ✅ Todos los tests pasaron ===${NC}"
```

```bash
chmod +x test-integration.sh
./test-integration.sh
```

## 🔐 Seguridad

### Rate Limiting

- **API General**: 100 requests / 15 min
- **Crear pagos**: 20 requests / hora
- **Reembolsos**: 10 requests / hora
- **Webhooks**: 100 requests / minuto

### Autenticación

- **JWT**: Requerido en todos los endpoints (excepto webhooks)
- **Webhook Signature**: Verificación de firma de Stripe en webhooks

### Permisos

- **Usuarios**: Solo ven sus propios pagos
- **Admins**: Pueden ver todos los pagos (implementar según tu lógica)

### Best Practices

1. **Nunca expongas** STRIPE_SECRET_KEY en cliente
2. **Siempre verifica** firmas de webhooks
3. **Usa HTTPS** en producción
4. **Registra** todos los eventos en WebhookEvent para auditoría
5. **Implementa** idempotency en webhooks
6. **Monitorea** webhooks fallidos y reintenta

## 🔗 Integración con Otros Servicios

### booking-service

**Endpoint usado**: `POST /api/bookings/:bookingId/mark-payment`

```typescript
// Cuando pago es exitoso, actualizamos booking
await bookingClient.markPayment(bookingId, {
  paymentId: payment.id,
  paymentStatus: 'DEPOSIT_PAID', // o 'PAID'
  paymentType: payment.paymentType
});
```

### notifications-service

**Notificaciones enviadas**:

1. **PAYMENT_RECEIVED** - Cuando pago es exitoso
   ```typescript
   {
     userId: payment.userId,
     type: 'PAYMENT_RECEIVED',
     data: {
       paymentId: payment.id,
       amount: payment.amount,
       currency: payment.currency
     }
   }
   ```

2. **PAYMENT_REFUNDED** - Cuando reembolso es procesado
   ```typescript
   {
     userId: payment.userId,
     type: 'PAYMENT_REFUNDED',
     data: {
       refundId: refund.id,
       amount: refund.amount,
       reason: refund.reason
     }
   }
   ```

## 📈 Próximas Mejoras

- [ ] Suscripciones recurrentes
- [ ] Pagos en OXXO y SPEI (México)
- [ ] Multi-currency support
- [ ] Reportes de revenue
- [ ] Dashboard de admin
- [ ] Retry automático de pagos fallidos
- [ ] Payment links (sin checkout)
- [ ] Webhooks a clientes (notificar a artistas)

## 📝 Notas Importantes

### Stripe API Version
Este servicio usa Stripe API version `2024-12-18.acacia`. Si actualizas Stripe, revisa breaking changes.

### Montos en Centavos
Todos los montos están en **centavos**:
- $100.00 MXN = 10000 centavos
- $1.50 MXN = 150 centavos

### Soft Delete
Los registros NO se eliminan físicamente, solo se marca `deletedAt`. Para consultas, siempre filtrar por `deletedAt: null`.

### Webhook Idempotency
Stripe puede enviar el mismo webhook múltiples veces. Se maneja con `stripeEventId` único en `WebhookEvent`.

## 🆘 Troubleshooting

### Error: "No payment method found"
**Causa**: Payment Intent creado sin métodos de pago.
**Solución**: Asegúrate de pasar `paymentMethods: ["card"]` al crear.

### Webhook no se procesa
**Causa**: Firma inválida o `STRIPE_WEBHOOK_SECRET` incorrecto.
**Solución**: 
1. Verifica que el secret es correcto
2. En desarrollo, usa `stripe listen` para obtener el secret correcto
3. Revisa logs de la tabla `WebhookEvent`

### Payment Intent expira
**Causa**: Payment Intents de Stripe expiran después de 24 horas.
**Solución**: Crear nuevo Payment Intent si el anterior expiró.

### Refund falla
**Causa**: Pago aún no está disponible para reembolso (puede tardar hasta 7 días).
**Solución**: Esperar o contactar soporte de Stripe.

## 📞 Soporte

Para issues o preguntas:
- Documentación de Stripe: https://stripe.com/docs
- Stripe Dashboard: https://dashboard.stripe.com
- Logs del servicio: revisar tabla `WebhookEvent` para debugging

---

**Versión**: 1.0.0  
**Última actualización**: 2024-01-15  
**Mantenedor**: Piums Platform Team
