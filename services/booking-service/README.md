# Booking Service

Microservicio para gestión de reservas y citas en la plataforma Piums.

## 📋 Descripción

Este servicio maneja:
- **Reservas/Citas** (CRUD completo con sistema de estados)
- **Verificación de disponibilidad** de artistas
- **Confirmación y rechazo** de reservas por artistas
- **Cancelaciones** con políticas configurables
- **Pagos** (depósitos y pagos completos)
- **Slots bloqueados** para vacaciones/días no laborables
- **Configuración de disponibilidad** por artista
- **Historial de cambios** de estado

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+
- PostgreSQL 14+
- pnpm (recomendado) o npm

### Instalación

\`\`\`bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# Generar Prisma Client
pnpm run prisma:generate

# Crear base de datos y tablas
pnpm run prisma:push

# Iniciar en modo desarrollo
pnpm run dev
\`\`\`

El servicio estará disponible en \`http://localhost:4005\`

## 📊 Modelos de Datos

### Booking (Reserva)

\`\`\`typescript
{
  id: string (UUID)
  clientId: string  // ID del usuario
  artistId: string  // ID del artista
  serviceId: string  // ID del servicio contratado
  
  scheduledDate: DateTime  // Fecha y hora de la cita
  durationMinutes: number
  location?: string
  locationLat?: number
  locationLng?: number
  
  status: BookingStatus
  statusHistory: BookingStatusChange[]
  
  servicePrice: number  // En centavos
  addonsPrice: number
  totalPrice: number
  currency: string  // Default: "MXN"
  
  depositRequired: boolean
  depositAmount?: number
  depositPaidAt?: DateTime
  
  paymentStatus: PaymentStatus
  paidAmount: number
  paidAt?: DateTime
  paymentMethod?: string
  
  selectedAddons: string[]  // IDs de addons
  
  clientNotes?: string
  artistNotes?: string
  internalNotes?: string
  
  cancelledAt?: DateTime
  cancelledBy?: string
  cancellationReason?: string
  refundAmount?: number
  
  confirmedAt?: DateTime
  confirmedBy?: string
  
  reminderSent24h: boolean
  reminderSent2h: boolean
  
  reviewId?: string
  
  createdAt: DateTime
  updatedAt: DateTime
}
\`\`\`

### Estados de Reserva (BookingStatus)

\`\`\`typescript
enum BookingStatus {
  PENDING           // Esperando confirmación del artista
  CONFIRMED         // Confirmada por el artista
  PAYMENT_PENDING   // Esperando pago del depósito
  PAYMENT_COMPLETED // Pago completado
  IN_PROGRESS       // En progreso (día de la cita)
  COMPLETED         // Completada exitosamente
  CANCELLED_CLIENT  // Cancelada por el cliente
  CANCELLED_ARTIST  // Cancelada por el artista
  REJECTED          // Rechazada por el artista
  NO_SHOW           // Cliente no se presentó
}
\`\`\`

**Flujo típico:**
1. Cliente crea reserva → \`PENDING\`
2. Artista confirma → \`CONFIRMED\`
3. Cliente paga depósito → \`PAYMENT_COMPLETED\`
4. Día de la cita → \`IN_PROGRESS\`
5. Termina la cita → \`COMPLETED\`

### Estados de Pago (PaymentStatus)

\`\`\`typescript
enum PaymentStatus {
  PENDING
  DEPOSIT_PAID      // Depósito pagado
  FULLY_PAID        // Totalmente pagado
  REFUNDED          // Reembolsado
  PARTIALLY_REFUNDED
}
\`\`\`

### BlockedSlot (Slot Bloqueado)

\`\`\`typescript
{
  id: string
  artistId: string
  startTime: DateTime
  endTime: DateTime
  reason?: string
  isRecurring: boolean
  createdAt: DateTime
}
\`\`\`

### AvailabilityConfig (Configuración de Disponibilidad)

\`\`\`typescript
{
  id: string
  artistId: string (unique)
  
  minAdvanceHours: number    // Default: 24
  maxAdvanceDays: number     // Default: 90
  bufferMinutes: number      // Default: 30
  autoConfirm: boolean       // Default: false
  requiresDeposit: boolean   // Default: true
  cancellationHours: number  // Default: 48
  cancellationFee: number    // 0-100 (porcentaje)
  
  createdAt: DateTime
  updatedAt: DateTime
}
\`\`\`

## 🔌 API Endpoints

### Reservas

#### POST /api/bookings
Crear nueva reserva (requiere auth)

**Headers:**
\`\`\`
Authorization: Bearer <token>
\`\`\`

**Body:**
\`\`\`json
{
  "clientId": "user-uuid",
  "artistId": "artist-uuid",
  "serviceId": "service-uuid",
  "scheduledDate": "2024-02-25T14:00:00Z",
  "durationMinutes": 120,
  "location": "Calle Principal 123, CDMX",
  "locationLat": 19.4326,
  "locationLng": -99.1332,
  "selectedAddons": ["addon-uuid-1", "addon-uuid-2"],
  "clientNotes": "Prefiero fotografía en exteriores"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "id": "booking-uuid",
  "clientId": "user-uuid",
  "artistId": "artist-uuid",
  "serviceId": "service-uuid",
  "scheduledDate": "2024-02-25T14:00:00.000Z",
  "durationMinutes": 120,
  "status": "PENDING",
  "totalPrice": 150000,
  "depositRequired": true,
  "depositAmount": 45000,
  "paymentStatus": "PENDING",
  "createdAt": "2024-02-20T10:00:00.000Z"
}
\`\`\`

#### GET /api/bookings/:id
Obtener reserva por ID (requiere auth)

**Response (200):**
\`\`\`json
{
  "id": "booking-uuid",
  "clientId": "user-uuid",
  "artistId": "artist-uuid",
  "status": "CONFIRMED",
  "scheduledDate": "2024-02-25T14:00:00.000Z",
  "totalPrice": 150000,
  "statusHistory": [
    {
      "id": "change-uuid",
      "fromStatus": "PENDING",
      "toStatus": "CONFIRMED",
      "changedBy": "artist-uuid",
      "reason": "Confirmada por el artista",
      "createdAt": "2024-02-20T10:30:00.000Z"
    }
  ]
}
\`\`\`

#### GET /api/bookings
Buscar reservas con filtros (requiere auth)

**Query params:**
- \`clientId\` (string)
- \`artistId\` (string)
- \`serviceId\` (string)
- \`status\` (BookingStatus)
- \`paymentStatus\` (PaymentStatus)
- \`startDate\` (ISO datetime)
- \`endDate\` (ISO datetime)
- \`page\` (number, default: 1)
- \`limit\` (number, default: 20, max: 100)

**Example:**
\`\`\`
GET /api/bookings?artistId=artist-123&status=CONFIRMED&page=1&limit=10
\`\`\`

#### PUT /api/bookings/:id
Actualizar reserva (requiere auth, solo si status permite)

**Body:**
\`\`\`json
{
  "scheduledDate": "2024-02-26T15:00:00Z",
  "clientNotes": "Cambio de horario solicitado"
}
\`\`\`

#### POST /api/bookings/:id/confirm
Confirmar reserva (requiere auth, solo artista)

**Body:**
\`\`\`json
{
  "artistNotes": "Confirmado, nos vemos el día 25"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "id": "booking-uuid",
  "status": "CONFIRMED",
  "confirmedAt": "2024-02-20T10:30:00.000Z",
  "confirmedBy": "artist-uuid"
}
\`\`\`

#### POST /api/bookings/:id/reject
Rechazar reserva (requiere auth, solo artista)

**Body:**
\`\`\`json
{
  "reason": "No tengo disponibilidad ese día"
}
\`\`\`

#### POST /api/bookings/:id/cancel
Cancelar reserva (requiere auth, cliente o artista)

**Body:**
\`\`\`json
{
  "reason": "Surgió un imprevisto y no podré asistir"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "id": "booking-uuid",
  "status": "CANCELLED_CLIENT",
  "cancelledAt": "2024-02-22T09:00:00.000Z",
  "cancelledBy": "user-uuid",
  "cancellationReason": "Surgió un imprevisto...",
  "refundAmount": 45000
}
\`\`\`

#### PATCH /api/bookings/:id/status
Cambiar estado manualmente (requiere auth, artista)

**Body:**
\`\`\`json
{
  "status": "IN_PROGRESS",
  "reason": "Cliente llegó, comenzando servicio"
}
\`\`\`

#### POST /api/bookings/:id/payment
Marcar pago (requiere auth, admin/payment-service)

**Body:**
\`\`\`json
{
  "amount": 45000,
  "paymentMethod": "stripe"
}
\`\`\`

### Disponibilidad

#### GET /api/availability/check
Verificar si un horario está disponible (público)

**Query params:**
- \`artistId\` (string, required)
- \`startTime\` (ISO datetime, required)
- \`endTime\` (ISO datetime, required)

**Example:**
\`\`\`
GET /api/availability/check?artistId=artist-123&startTime=2024-02-25T14:00:00Z&endTime=2024-02-25T16:00:00Z
\`\`\`

**Response (200):**
\`\`\`json
{
  "available": true
}
\`\`\`

#### GET /api/availability/slots
Obtener slots disponibles (público)

**Query params:**
- \`artistId\` (string, required)
- \`startDate\` (ISO datetime, required)
- \`endDate\` (ISO datetime, required)
- \`durationMinutes\` (number, default: 60)

**Example:**
\`\`\`
GET /api/availability/slots?artistId=artist-123&startDate=2024-02-25T00:00:00Z&endDate=2024-02-27T23:59:59Z&durationMinutes=120
\`\`\`

**Response (200):**
\`\`\`json
{
  "slots": [
    {
      "start": "2024-02-25T09:00:00.000Z",
      "end": "2024-02-25T11:00:00.000Z"
    },
    {
      "start": "2024-02-25T14:00:00.000Z",
      "end": "2024-02-25T16:00:00.000Z"
    }
  ]
}
\`\`\`

### Slots Bloqueados

#### POST /api/blocked-slots
Bloquear horario (requiere auth, artista)

**Body:**
\`\`\`json
{
  "artistId": "artist-uuid",
  "startTime": "2024-03-01T00:00:00Z",
  "endTime": "2024-03-05T23:59:59Z",
  "reason": "Vacaciones"
}
\`\`\`

#### GET /api/artists/:artistId/blocked-slots
Obtener slots bloqueados (público)

**Query params:**
- \`startDate\` (optional)
- \`endDate\` (optional)

#### DELETE /api/blocked-slots/:id
Desbloquear slot (requiere auth, artista)

### Configuración

#### GET /api/artists/:artistId/config
Obtener configuración de disponibilidad (público)

**Response (200):**
\`\`\`json
{
  "id": "config-uuid",
  "artistId": "artist-uuid",
  "minAdvanceHours": 24,
  "maxAdvanceDays": 90,
  "bufferMinutes": 30,
  "autoConfirm": false,
  "requiresDeposit": true,
  "cancellationHours": 48,
  "cancellationFee": 50
}
\`\`\`

#### PUT /api/artists/:artistId/config
Actualizar configuración (requiere auth, artista)

**Body:**
\`\`\`json
{
  "minAdvanceHours": 48,
  "bufferMinutes": 60,
  "cancellationFee": 30
}
\`\`\`

### Estadísticas

#### GET /api/stats
Obtener estadísticas de reservas (requiere auth)

**Query params:**
- \`artistId\` (optional)
- \`clientId\` (optional)

**Response (200):**
\`\`\`json
{
  "total": 150,
  "pending": 10,
  "confirmed": 25,
  "completed": 100,
  "cancelled": 15,
  "totalRevenue": 15000000
}
\`\`\`

### Health Check

#### GET /health
Estado del servicio

**Response (200):**
\`\`\`json
{
  "status": "healthy",
  "service": "booking-service",
  "timestamp": "2024-02-20T10:00:00.000Z",
  "uptime": 3600.5
}
\`\`\`

## 🔐 Autenticación

Endpoints protegidos requieren JWT en el header:

\`\`\`
Authorization: Bearer <token>
\`\`\`

Token debe contener:
\`\`\`json
{
  "id": "user-uuid",
  "email": "user@example.com"
}
\`\`\`

## ⚡ Rate Limiting

- **General**: 100 requests / 15 min
- **Crear reservas**: 20 / hora
- **Actualizaciones**: 50 / hora
- **Consultas de disponibilidad**: 30 / 15 min

## 💰 Sistema de Precios y Pagos

Todos los precios se almacenan en **centavos**:
- \$1,000.00 MXN = 100000 centavos
- \$450.00 MXN (depósito 30%) = 45000 centavos

## 📅 Sistema de Estados

### Flujos Principales

**Flujo Normal:**
\`\`\`
PENDING → CONFIRMED → PAYMENT_COMPLETED → IN_PROGRESS → COMPLETED
\`\`\`

**Rechazo por Artista:**
\`\`\`
PENDING → REJECTED
\`\`\`

**Cancelación por Cliente:**
\`\`\`
PENDING/CONFIRMED → CANCELLED_CLIENT
\`\`\`

**Cancelación por Artista:**
\`\`\`
CONFIRMED → CANCELLED_ARTIST
\`\`\`

**Cliente no se presenta:**
\`\`\`
CONFIRMED → NO_SHOW
\`\`\`

## 🚨 Políticas de Cancelación

Configurables por artista:

- **cancellationHours**: Horas mínimas de anticipación para cancelar sin penalización
- **cancellationFee**: Porcentaje del depósito que se retiene (0-100)

**Ejemplo:**
- cancellationHours = 48
- cancellationFee = 50
- Depósito = \$450

Si cancela con más de 48h de anticipación: Reembolso completo (\$450)
Si cancela con menos de 48h: Reembolso del 50% (\$225)

## 📂 Estructura

\`\`\`
booking-service/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── controller/
│   │   └── booking.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── routes/
│   │   ├── booking.routes.ts
│   │   └── health.routes.ts
│   ├── schemas/
│   │   └── booking.schema.ts
│   ├── services/
│   │   └── booking.service.ts
│   ├── utils/
│   │   └── logger.ts
│   └── index.ts
└── README.md
\`\`\`

## 🔗 Dependencias con Otros Servicios

### users-service (puerto 4002)
- \`clientId\` debe corresponder a un usuario válido

### artists-service (puerto 4003)
- \`artistId\` debe corresponder a un artista válido
- TODO: Integrar verificación de disponibilidad semanal

### catalog-service (puerto 4004)
- \`serviceId\` debe corresponder a un servicio válido
- TODO: Integrar obtención de precios y addons

### notifications-service (puerto 4006)
- Enviar notificaciones cuando:
  - Se crea una reserva (notificar artista)
  - Se confirma/rechaza (notificar cliente)
  - Se cancela (notificar ambos)
  - Recordatorios 24h y 2h antes

### auth-service (puerto 4001)
- JWT tokens para autenticación
- Mismo \`JWT_SECRET\`

## 📝 Logs

Formato JSON estructurado:

\`\`\`json
{
  "timestamp": "2024-02-20T10:00:00.000Z",
  "level": "INFO",
  "service": "booking-service",
  "context": "BOOKING_SERVICE",
  "message": "Reserva creada",
  "data": {
    "bookingId": "uuid",
    "clientId": "user-uuid",
    "artistId": "artist-uuid"
  }
}
\`\`\`

## 🧪 Testing

Ver \`test-integration.sh\` para pruebas E2E.

## 📈 Próximas Funcionalidades

- [ ] Integración completa con catalog-service para precios
- [ ] Integración con artists-service para disponibilidad semanal
- [ ] Sistema de recordatorios automáticos
- [ ] Reprogramación de citas
- [ ] Lista de espera
- [ ] Reservas recurrentes (semanales/mensuales)
- [ ] Videollamadas integradas
- [ ] Chat en tiempo real entre cliente y artista

## 📄 Licencia

MIT
HEREDOC
echo "README.md creado exitosamente"
`, and this is the output of running that command instead:
piums@Mac-mini-de-piums piums-platform %  cat > /Users/piums/Desktop/piums-platf
orm/services/booking-service/README.md << 'HEREDOC'
heredoc> # Booking Service
heredoc> 
heredoc> Microservicio para gestión de reservas y citas en la plataforma Piums.
heredoc> 
heredoc> ## 📋 Descripción
heredoc> 
heredoc> Este servicio maneja:
heredoc> - **Reservas/Citas** (CRUD completo con sistema de estados)
heredoc> - **Verificación de disponibilidad** de artistas
heredoc> - **Confirmación y rechazo** de reservas por artistas
heredoc> - **Cancelaciones** con políticas configurables
heredoc> - **Pagos** (depósitos y pagos completos)
heredoc> - **Slots bloqueados** para vacaciones/días no laborables
heredoc> - **Configuración de disponibilidad** por artista
heredoc> - **Historial de cambios** de estado
heredoc> 
heredoc> ## 🚀 Inicio Rápido
heredoc> 
heredoc> ### Prerequisitos
heredoc> - Node.js 18+
heredoc> - PostgreSQL 14+
heredoc> - pnpm (recomendado) o npm
heredoc> 
heredoc> ### Instalación
heredoc> 
heredoc> \`\`\`bash
heredoc> # Instalar dependencias
heredoc> pnpm install
heredoc> 
heredoc> # Configurar variables de entorno
heredoc> cp .env.example .env
heredoc> # Editar .env con tu configuración
heredoc> 
heredoc> # Generar Prisma Client
heredoc> pnpm run prisma:generate
heredoc> 
heredoc> # Crear base de datos y tablas
heredoc> pnpm run prisma:push
heredoc> 
heredoc> # Iniciar en modo desarrollo
heredoc> # Booking Service
heredoc> 
heredoc> Microservicio para gestión de reservas y citas en la plataforma Piums M

heredoc> Microservicio p
heredoc> ##
heredoc> ## 📋 Descripción
heredoc> 
heredoc> Este servicio maneja:
heredoc> - **Reservas/Citas** (CRU: s
heredoc> Este servicio mansuar- **Reservas/Citas**g - **Verificación de disponib
ilidad** de artistas
heredoc> - **Conf c- **Confirmación y rechazo** de reservas por ar y- **Cancelac
iones** con políticas configurables
heredoc> - **?:- **Pagos** (depósitos y pagos completos)
heredoc> - **nu- **Slots bloqueados** para vacaciones/d<ffffffff>s- **Configurac
ión de disponibilidad** por artista
heredoc> - **Hi E- **Historial de cambios** de estado
heredoc> 
heredoc> ## 🚀 Inimb
heredoc> ## 🚀 Inicio Rápido
heredoc> 
heredoc> ### Prereq"MX
heredoc> ### Prerequisitos
heredoc> - ed:- Node.js 18+
heredoc> - it- PostgreSQLbe- pnpm (recomenAt
heredoc> ### Instalación
heredoc> 
heredoc> \`\`\`tat
heredoc> \`\`\`bash
heredoc> # Ius
heredoc>   paidAmounpnpm install
heredoc> 
heredoc> # Configat
heredoc> # Configurmencp .env.example .env
heredoc> # Editar .edo# Editar .env con ts 
heredoc> # Generar Prisma Client
heredoc> pnpm run g
heredoc>  pnpm run prisma:genera  
heredoc> # Crear base de datos   
heredoc> pnpm run prisma:push
heredoc> 
heredoc> # Inicinc
heredoc> # Iniciar en modo can# Booking Service
heredoc> 
heredoc> Microserre
heredoc> Microservicio pberMicroservicio p
heredoc> ##
heredoc> ## 📋 Descripción
heredoc> 
heredoc> Este servicio maneja:
heredoc> - **Reseh: boolean
heredoc>   remin#er
heredoc> Este servicio mane  r- **Reservas/Citas**  createdAt: DateTime
heredoc>   updated- **Conf c- **Confirmación y rechazo** de reservas por ar y- *
*Cancelaciones** con polítigS- **?:- **Pagos** (depósitos y pagos completos)
heredoc> - **nu- **Slots bloqueados** para vacaciones/d<ffffffff>s- **Confi a- *
*nu- **Slots bloqueados** para vacaciones/del - **Hi E- **Historial de cambios**
 de estado
heredoc> 
heredoc> ## 🚀 Inimb
heredoc> ## 🚀 Inicio Rápido
heredoc> 
heredoc> ### Prereq"MX
heredoc> ta
heredoc> ## 🚀 Inimb
heredoc> ## 🚀 Inicio Rápido
heredoc> 
heredoc> ### men## 🚀 InicED
heredoc> ### Prereq"MX
heredoc> ### Pr po### Prerequi
heredoc>  - ed:- Node.js 1T - it- PostgreSQLb e### Instalación
heredoc> 
heredoc> \`\`\`tat
heredoc> \`\`\`ec
heredoc> \`\`\`tat
heredoc> \`\`rtista
heredoc>   NO_S# Ius
heredoc>   p     // 
heredoc> # Configat
heredoc> # Configur<ffffffff>
heredoc> }# Configu**# Editar .edo# Editar .env con t r# Generar Prisma Client
heredoc> pnpm run  cpnpm run g
heredoc>  pnpm run pD\ pnpm runnt# Crear base de datos   AYpnpm run prisma:push
heredoc> 
heredoc> #a 
heredoc> # Inicinc
heredoc> # Inicia_PR# Inicia
heredoc> 5
heredoc> Microserre
heredoc> Microservicio pberMicrose###Micrados de##
heredoc> ## 📋 Descripción
heredoc> 
heredoc> Este sees#ri
heredoc> Este servicio maneus - **Reseh: boolean
heredoc>  T_  remin#er
heredoc> EsDepósEste servo
heredoc>   updated- **Conf c- **Confirmación y rechazo** de reservas //- **nu- *
*Slots bloqueados** para vacaciones/d<ffffffff>s- **Confi a- **nu- **Slots bloqu
eados** para vacaciones/del - **Hi E- **Historial de cambios** de ese
heredoc> 
heredoc> ## 🚀 Inimb
heredoc> ## 🚀 Inicio Rápido
heredoc> 
heredoc> ### Prereq"MX
heredoc> ta
heredoc> ## 🚀 Inimb
heredoc> ## 🚀 Inicio Rápido
heredoc> 
heredoc> ### men## 🚀 InicED
heredoc> ### Prereq"MX
heredoc> ### Pr po### Prerequi
heredoc> \`\## 🚀 Inict
heredoc> 
heredoc> ### Prereq"MX
heredoc> ta
heredoc> ## stIta
heredoc> ## 🚀 Ini#ue## 🚀 Inicva
heredoc> ### men## 🚀 InicE/ D### Prereq"MX
heredoc> ### Prnc### Pr po###r  - ed:- Node.js 1T - b
heredoc> \`\`\`tat
heredoc> \`\`\`ec
heredoc> \`\`\`tat
heredoc> \`\`rtista
heredoc>   NO_S# Ius
heredoc> m: \`\`\`ec  \`\`\`tDe\`\`rtisal  NO_S# Iir  p     // b# Configat/ # Co
nfigutr}# Configullpnpm run  cpnpm run g
heredoc>  pnpm run pD\ pnpm runnt# Crear base de datos -1 pnpm run pD\ pnpm r c
heredoc> #a 
heredoc> # Inicinc
heredoc> # Inicia_PR# Inicia
heredoc> 5
heredoc> Microserre
heredoc> Microservicio pberMicnts# ### Iniciaas
heredoc> 
heredoc> #### POST /api/bookiMicrosear n## 📋 Descripción
heredoc> 
heredoc> Este sees#ri
heredoc> Este **
heredoc> Este sees#ri
heredoc> Este on:Este servicke T_  remin#er
heredoc> EsDepósEste servo
heredoc>   updliEsDepósEster-  updated- **Confd"
heredoc> ## 🚀 Inimb
heredoc> ## 🚀 Inicio Rápido
heredoc> 
heredoc> ### Prereq"MX
heredoc> ta
heredoc> ## 🚀 Inimb
heredoc> ## 🚀 Inicio Rápido
heredoc> 
heredoc> ### men## 🚀 InicED
heredoc> ### Prereq"MX
heredoc> ### Pr po### Prerequi
heredoc> \`\## 🚀 Inict
heredoc> 
heredoc> ### Prereq"MX
heredoc> ta
heredoc> ## stIta
heredoc> ## 🚀 Ini#ue##
heredoc>   ## 🚀 Inicon
heredoc> ### Prereq"MX
heredoc> ta
heredoc> ## "adta
heredoc> ## 🚀 I,
heredoc> # "## 🚀 Inic: 
heredoc> ### men## 🚀 InicE en### Prereq"MX
heredoc> ### Pr`
heredoc> ### Pr po###(2\`\## 🚀 Inict
heredoc> 
heredoc> ##  
heredoc> ### Prereq"MX
heredoc> uuita
heredoc> ## stIta
heredoc> tI#":## 🚀uu### men## 🚀 InicE/ D### uu### Prnc### Pr po###r  - ede-uui
d",
heredoc>  \`\`\`tat
heredoc> \`\`\`ec
heredoc> \`\`\`tat
heredoc> \`\`rtista
heredoc>   N",\`\`\`ecti\`\`\`tes\`\`rti
heredoc>     NO_S# I "m: \`\`\`
heredoc>    pnpm run pD\ pnpm runnt# Crear base de datos -1 pnpm run pD\ pnpm r 
c
heredoc> #a 
heredoc> # Inicinc
heredoc> # Inicia_PR# Inicia
heredoc> 5
heredoc> Micea#a 
heredoc> # Inicinc
heredoc> # Inicia_PR# Inicia
heredoc> 5
heredoc> Microserre
heredoc> Microservicio pberMi/:id# bt# Iniciaer5
heredoc> Microserre
heredoc> Microe auMicroservsp
heredoc> #### POST /api/bookiMicrosear n## <ffffffff>ok
heredoc> Este sees#ri
heredoc> Este **
heredoc> Este sees#ri
heredoc> Este on:Este se: "Este **
heredoc> Est",Este satEste on:EstRMEsDepósEste servo
heredoc>   updliEsDepó25  updliEsDepósEs  ## 🚀 Inimb
heredoc> ## 🚀 Inicio Rápido
heredoc> 
heredoc> #: ## 🚀 Inic  
heredoc> ### Prereq"MX
heredoc> ta
heredoc> ",
heredoc>    ta
heredoc> ## 🚀 Ius#: ## 🚀 Inic  
heredoc> ### men## 🚀 InicERME### Prereq"MhangedBy":### Pr po###d"\`\## 🚀 Inict

heredoc> 
heredoc> ##on
heredoc> ### Prereq"MX
heredoc> artta
heredoc> ## stI    "#re## 🚀:   ## 🚀 Inico30### Prereq"MX
heredoc> t
heredoc>  ta
heredoc> ## "adta
heredoc> 
heredoc> #### GET /api# "## <ffffffff>B### men## 🚀 Ion### Pr`
heredoc> ### Pr po###(2\`\## 🚀 Inar### Pr
heredoc> -
heredoc> ##  
heredoc> ### Prereq"MX
heredoc> uuita
heredoc> ## tis###\`uuita
heredoc> ## stI\`## sictI#":##st \`\`\`tat
heredoc> \`\`\`ec
heredoc> \`\`\`tat
heredoc> \`\`rtista
heredoc>   N",\`\`\`ecti\`\`\`tes\`\`rti
heredoc>     ar\`\`\`ec
heredoc> IS\`\`\`tim\`\`rtisnd  N",\`\`SO    NO_S# I "m: \`\`\`
heredoc>    pnpm d   pnpm run pD\ pnpm ` #a 
heredoc> # Inicinc
heredoc> # Inicia_PR# Inicia
heredoc> 5
heredoc> Micea#a 
heredoc> # Inicinc
heredoc> # Inicia_PR# IniartistId=artist-5
heredoc> Micea#a 
heredoc> # IniciED&p# Iniciim# Inicia\`5
heredoc> Microserre
heredoc> MicrobookMicroservAcMicroserre
heredoc> Microe auMicroservsp
heredoc> #### Psi status per#### POST /api/book\`Este sees#ri
heredoc> Este **
heredoc> Este sees#ri
heredoc> Este6TEste **
heredoc> Est
heredoc>  Este sntEstes": "Cambio de horario solicitado"
heredoc>   updliEsDepó25  updliEsDepósEs  ## 🚀 rm## 🚀 Inicio Rápido
heredoc> 
heredoc> #: ## 🚀 Inic  
heredoc> ### P)
heredoc> 
heredoc> #: ## 🚀 Inic  
heredoc> ##
heredoc> {
heredoc> ### Prereq"MX
heredoc> ta "ta
heredoc> ",
heredoc>    ta
heredoc> no" vemo## <ffffffff>d### men## 🚀 InicERME### e 
heredoc> ##on
heredoc> ### Prereq"MX
heredoc> artta
heredoc> ## stI    "#re## 🚀:   ## 🚀 Inico30### Prercon###meartta
heredoc> ## stI02## s10t
heredoc>  ta
heredoc> ## "adta
heredoc> 
heredoc> #### GET /api# "## <ffffffff>B### men## <ffffffff>
heredoc> 
heredoc> #### 
heredoc> #### Gpi/### Pr po###(2\`\## 🚀 Inar### Pr
heredoc> -
heredoc> ##  
heredoc> ### Put-
heredoc> ##  
heredoc> ### Prereq"MX
heredoc> uuita
heredoc> ## tis#json###  uuita
heredoc> ## tiso ## to ## stI\`##idad es\`\`\`ec
heredoc> \`\`\`tat
heredoc> \`\`rtista
heredoc>   /b\`\`\`t/:\`\`rtisl
heredoc>   N",\`\`re    ar\`\`\`ec
heredoc> IS\`\`\`tim\`\`o IS\`\`\`tim\`od   pnpm d   pnpm run pD\ pnpm ` #a 
heredoc> # Inicinc
heredoc> # Iniciy # Inicinc
heredoc> # Inicia_PR# Inicia
heredoc> 5
heredoc> Mipo# Ini200):5
heredoc> Micea#a 
heredoc> # Inici"id"# Iniciin# Inicia
heredoc>  Micea#a 
heredoc> # IniciED&p# Iniciim# I "# IniciedMicroserre
heredoc> MicrobookMicroservA",MicrobookllMicroe auMicroservsp
heredoc> #### Psila####Reason": "SurgióEste **
heredoc> Este sees#ri
heredoc> Este6TEste **
heredoc> Est
heredoc>  Este sntEst`
heredoc> Este sPAEste6TEste okEst
heredoc>  Este sntu ECa  updliEsDepó25  updliEsDepósEs  ## 🚀 rm#ta
heredoc> #: ## 🚀*
heredoc> \`\`\`json
heredoc> {
heredoc>   "status": "IN_PROGRESS",
heredoc>   "reason": "Cli### P)
heredoc> 
heredoc> #: ## <ffffffff>n
heredoc> #: # se##
heredoc> {
heredoc> ### Prereq"
heredoc> 
heredoc> #### ta "ta
heredoc> ",
heredoc>   ok",
heredoc>  /:i /pnyment##on
heredoc> ### Prereq"MX
heredoc> artta
heredoc> ## stI    "#re## -s###icartta
heredoc> ## stI*
heredoc> ## s\`## stI02## s10t
heredoc>  ta
heredoc> ## "adta
heredoc> 
heredoc> #### GET /api# "## <ffffffff>B### me\` ta
heredoc> ## "adta
heredoc> 
heredoc> il#dad
heredoc> #### GGET
heredoc> #### 
heredoc> #### Gpi/### Pr po###(2\`\## i u####ra-
heredoc> ##  
heredoc> ### Put-
heredoc> ##  
heredoc> ### Prereq"MX
heredoc> uuita
heredoc> params###
heredoc> -##  
heredoc> ##st###` uuita
heredoc> ## tisui## t
heredoc> -## tiso ## to ## stIda\`\`\`tat
heredoc> \`\`rtista
heredoc>   /b\`\`\`t/:\`\`at\`\`rtiseq  /b\`\`\*E  N",\`\`re    ar\`\`/aIS\`\`\`
tim\`\`o IS\`\`\ti# Inicinc
heredoc> # Iniciy # Inicinc
heredoc> # Inicia_PR# Inicia
heredoc> 5
heredoc> Mipo# Ini200):516# Iniciy\`# Inicia_PR# Inic(25
heredoc> Mipo# Ini200):5
heredoc> {
heredoc>   Micea#a 
heredoc> # Iniru# Inici`\ Micea#a 
heredoc> # IniciED&p# Inicty# IniciEbtMicrobookMicroservA",MicrobookllMicroe auM
ipa#### Psila####Reason": "SurgióEste **
heredoc> Este sees#riDaEste sees#ri
heredoc> Este6TEste **
heredoc> Est
heredoc>  Este DaEste6TEste atEst
heredoc>  Este uire E
heredoc> -Este sPAEstein Este sntu ECa  updliEs: #: ## 🚀*
heredoc> \`\`\`json
heredoc> {
heredoc>   "status": "IN_PROGRESS",
heredoc>   "reason=a\`\`\`jso&startDate=2024-  "reason": "Cli### P)e=202
heredoc> #: ## <ffffffff>n
heredoc> #: # se##ati#: # se#s=1{
heredoc> ### Pr`
heredoc> 
heredoc> *
heredoc> #### ta "(20",
heredoc>   ok",
heredoc> \`jso /:i  "### Prereq"MX
heredoc> ar  artta
heredoc> ## stI "## s-0## stI*
heredoc> ## s\`## stI02## s10en## s\202 ta
heredoc> ## "adta
heredoc> 
heredoc> #### GZ"##  
heredoc> #### G {
heredoc> ## "adta
heredoc> 
heredoc> il#dad
heredoc> #### GGET
heredoc> #### 
heredoc> #0.
heredoc> il#d,
heredoc>    #### nd#### 
heredoc> ##-0####T1##  
heredoc> ### Put-
heredoc> ##  
heredoc> ### Prereq"MX
heredoc> uuitaSl### B##  
heredoc> ##os#####uuita
heredoc> paramsblparad--##  
heredoc> ##oq##st h## tisui## t
heredoc> er-## tiso ##is\`\`rtista
heredoc>   /b\`\`\`t/:\`\`at\ar  /b\`\`\"a# Iniciy # Inicinc
heredoc> # Inicia_PR# Inicia
heredoc> 5
heredoc> Mipo# Ini200):516# Iniciy\`# Inicia_PR# Inic(25
heredoc> Mipo# Inn"# Inicia_PR# Inic\`5
heredoc> Mipo# Ini200):51i/arMipo# Ini200):5
heredoc> {
heredoc> ocked-slots
heredoc> Obtener slots bloq{
heredoc>   Micea#a 
heredoc> #co)
heredoc> # Iniru# pa# IniciED&p# Inicty# Ini(oEste sees#riDaEste sees#ri
heredoc> Este6TEste **
heredoc> Est
heredoc>  Este DaEste6TEste atEst
heredoc>  Este uire E
heredoc> -Este sPAEstein Este sntu EC
heredoc> 
heredoc> Este6TEste **
heredoc> Est
heredoc>  Este DGEEst
heredoc>  Este Dats Ear Este uire E
heredoc> -Este sPAEon-Este sPAEs d\`\`\`json
heredoc> {
heredoc>   "status": "IN_PROGRESS",
heredoc>   "reason=`\{
heredoc>   "stat
heredoc>   "  "reason=a\`\`\`jso&starti#: ## <ffffffff>n
heredoc> #: # se##ati#: # se#s=1{
heredoc> ### Pr`
heredoc> 
heredoc> *
heredoc> #### ta "(20",
heredoc> ys#: # se##"b### Pr`
heredoc> 
heredoc> *
heredoc> #### ta "(20ut
heredoc> *
heredoc> ###rm":   ok",
heredoc> \`jso ui\`jsopoar  artta
heredoc> ## stI "## s-0io## stI " 4## s\`## stI02## s10e"## "adta
heredoc> 
heredoc> #### GZ"##  
heredoc> #### G {
heredoc> is
heredoc> #### Gist#### G {
heredoc> ##ct## "adt c
heredoc> il#dadaci#### re#### 
heredoc> #0ut#0.
heredoc> rtista   #*B##-0####T1##  so### Put-inAdvan##  
heredoc> ##":###,
heredoc> uuitaSl### But##os#####uuita
heredoc> ceparamsblparad30##oq`\`\`
heredoc> 
heredoc> ### Estadersticas
heredoc> 
heredoc> #### GET /api  /b\`\`\`t/:\`\`at\ar  ic# Inicia_PR# Inicia
heredoc> 5
heredoc> Mipo# Ini200):516# Iniciy\`#- 5
heredoc> Mipo# Ini200):51onalMipo# Inn"# Inicia_PR# Inic\`5
heredoc> Mipo# Ini200):5**Mipo# Ini200):51i/arMipo# Ini
heredoc>  {
heredoc> ocked-slots
heredoc> Obtener slots bloq{
heredoc> 
heredoc>   "Obtener sl:   Micea#a 
heredoc> #co)
heredoc> # : #co)
heredoc> # Inta# IveEste6TEste **
heredoc> Est
heredoc>  Este DaEste6TEste atEst
heredoc>  Este uire E
heredoc> -Este taEst
heredoc>  Este Daci E
heredoc> * Este uire E
heredoc> -Este sPAE\`-Este sPAEsta
heredoc> Este6TEste **
heredoc> Est
heredoc>  Este DG": Est
heredoc>  Este DGvi E", Este Dats mp-Este sPAEon-Este sPAEs d00{
heredoc>   "status": "IN_PROGRESS",
heredoc>   "re# <ffffffff> "reason=`\{
heredoc>   "stat
heredoc>   "nt  "stat
heredoc>   "  r  "  ren#: # se##ati#: # se#s=1{
heredoc> ### Pr`
heredoc> 
heredoc> *
heredoc> ###n:### Pr`
heredoc> 
heredoc> *
heredoc> #### ta "(20
heredoc> T
heredoc> *
heredoc> # debe cys#: # se##"b\`
heredoc> *
heredoc> #### ta "(20ut
heredoc> *r-uui*
heredoc> ###rm":   o: "u\`jso ui\`jsoom## stI "## 
heredoc> ## ⚡ Rate L
heredoc> ###ing
heredoc> 
heredoc> - **General**: 100 requests / 15 min
heredoc> - **Crear re#### G {
heredoc> is0 is
heredoc> ####- #*A##ct## "adt c
heredoc> il: il#dadaci###**#0ut#0.
heredoc> rtista   #*Bbirtista*:##":###,
heredoc> uuitaSl### But##os#####uuita
heredoc> ceparamsosuuitdos lceparamsblparad30##oq`\`\`
heredoc> **
heredoc> ### Estadersticas
heredoc> 
heredoc> #### MXN
heredoc> #### GET /api  os
heredoc> 5
heredoc> Mipo# Ini200):516# Iniciy\`#- 5
heredoc> Mipo# Ini200):51onalMipSistMipo# Ini200):51onalMipo# Inn"ncMipo# Ini200
):5**Mipo# Ini200):51i/arMipo# Ini
heredoc>  {IR {
heredoc> ocked-slots
heredoc> Obtener slots bloq{
heredoc> 
heredoc>   "Obtene CoMPObtener sl\`
heredoc>   "Obtener sl:   tis#co)
heredoc> # : #co)
heredoc> # Inta# Iv R# :CT# In`\`\`Est
heredoc>  Este DaEste6TEste ie Ee: Este uire E
heredoc> -Este taEsRM-Este taEstEL Este Daci
heredoc> \* Este uirenc-Este sPAE\r AEste6TEste **
heredoc> Est
heredoc>  Este EDEst
heredoc>  Este DGED ERT Este DGvi E"*C  "status": "IN_PROGRESS",
heredoc>   "re# <ffffffff> "reason=`\{
heredoc>   "s\`  "re# <ffffffff> "reason=`\{
heredoc>   de Cancelación
heredoc> 
heredoc> Configurables po  "  r  "  
heredoc> -### Pr`
heredoc> 
heredoc> *
heredoc> ###n:### Pr`
heredoc> 
heredoc> *
heredoc> #### ta "(s 
heredoc> *
heredoc> #nticipa
heredoc> *
heredoc> #### ta canceT
heredoc> *
heredoc> # debe alizac*
heredoc> #### ta "(20ut
heredoc> *r-uFee***r-uui*
heredoc> ###rmde###rm"<ffffffff>s## ⚡ Rate L
heredoc> ###ing
heredoc> 
heredoc> - **General**: 100
heredoc> -###ing
heredoc> 
heredoc> - **nH
heredoc> - **= 4- **Crear re#### G {
heredoc> is0 is
heredoc> ####- #o is0 is
heredoc> ####- #*A##c c####-<ffffffff>sil: il#dadaci###**#0uórtista   #*Bbirtist
a*:##$4uuitaSl### But##os#####uuita
heredoc> 8hceparamsosuuitdos lceparams
heredoc> 
heredoc> **
heredoc> ### Estadersticas
heredoc> 
heredoc> #### MXN
heredoc> #### GET /api<ffffffff><ffffffff>#### MXN
heredoc> #### G   #### GE<ffffffff><ffffffff>5
heredoc> Mipo# Ini200):<ffffffff><ffffffff><ffffffff>ipo# Ini200):51onalMipSi co
ntro {IR {
heredoc> ocked-slots
heredoc> Obtener slots bloq{
heredoc> 
heredoc>   "Obtene CoMPObtener sl\`
heredoc>   "Obtener sl:   tis#co)
heredoc> # : #co)
heredoc> # I.mockedwaObtener sl  
heredoc>   "Obtene CoMPObtror  "Obtr.ts
heredoc> │   │   └<ffffffff> : #co)
heredoc> # Imiter.ts
heredoc> │ # ├─<ffffffff>Este DaEste6TEste ie Ee: Es<ffffffff><ffffffff>Este taE
sRM-Este taEstEL Este Daci
heredoc> <ffffffff>* Este uirenc-Este sPAE\r AEste6T<ffffffff>st
heredoc>  Este EDEst
heredoc>  Este DGED ERT Este DGvg.s Eem Este DGED <ffffffff> "re# <ffffffff> "re
ason=`\{
heredoc>   "s\`  "re# <ffffffff> "reason=`\{
heredoc>   ce  "s\`  "re# <ffffffff> "reati  de Cancelación
heredoc> 
heredoc> Configurog
heredoc> Configurables p─-### Pr`
heredoc> 
heredoc> *
heredoc> ###n:### Pr`
heredoc> 
heredoc> DM
heredoc> *
heredoc> ###n\`\`
heredoc> 
heredoc> *
heredoc> #### ta pende*
heredoc> #nticipa
heredoc> tros*
heredoc> #### ios
heredoc> *
heredoc> # debe alizrvic#### ta "(20u2)*r-uFee***r-u\`###rmde###rm"<ffffffff>sde
###ing
heredoc> 
heredoc> - **General**: 100
heredoc>  a
heredoc> - **s-s-###ing
heredoc> 
heredoc> - **nH
heredoc> -03
heredoc> - **nart- **=\`is0 i corresponder a un arti####-á####- #*A##c cnt8hcepa
ramsosuuitdos lceparams
heredoc> 
heredoc> **
heredoc> ### Estadersticas
heredoc> 
heredoc> #### MXN
heredoc> #### GET /api<ffffffff><ffffffff>#### MXN
heredoc> #### G de
heredoc> **
heredoc> ### Estadersticas
heredoc> 
heredoc> #### o v#<ffffffff>l
heredoc> #### MXNO: Integra#### GEci#### G   #### GE<ffffffff><ffffffff>5
heredoc> Mipo# ##Mipo# Ini200):<ffffffff><ffffffff><ffffffff>iocked-slots
heredoc> Obtener slots bloq{
heredoc> 
heredoc>   "Obtene CoMPObtener  cObtener sese
heredoc>   "Obtene CoMPObtist  "Obtener sl:   tis#co)za # : #co)
heredoc> # I.mockedwaOb S# I.mocla  "Obtene CoMPObtror  "Re│   │   └<ffffffff> :
 #co)
heredoc> # Im### Imiter.ts
heredoc> │ # ├<ffffffff>0│ # ├<ffffffff>k<ffffffff>* Este uirenc-Este sPAE\r AEs
te6T<ffffffff>st
heredoc>  Este EDEst
heredoc>  Este DGED ERT Este DGvtr Este EDEst
heredoc>  Este DGED ERT Este DGvg.s E20 Este DGED0:  "s\`  "re# <ffffffff> "reas
on=`\{
heredoc>   ce  "s\`  "re# <ffffffff> "reati  de Ca
heredoc>    ce  "s\`  "re# <ffffffff> "reatiE"
heredoc> Configurog
heredoc> Configurables p─-### Pr`
heredoc> 
heredoc> *
heredoc> #{
heredoc>  Configurang
heredoc> *
heredoc> ###n:### Pr`
heredoc> 
heredoc> DM
heredoc> *
heredoc> ###d": "
heredoc> DM
heredoc> *
heredoc> ###n\
heredoc>   * "ar
heredoc> *
heredoc> ####: "ar#nticipa
heredoc> tros}
heredoc> tros*
heredoc> #`
heredoc> ####<ffffffff>
heredoc> # debing
heredoc> 
heredoc> - **Generalintegration.sh\` para pruebas E2E.
heredoc> 
heredoc> ## 📈 Próximas Func a
heredoc> - **s-s-###ing] Int
heredoc> - **nH
heredoc> -03
heredoc> -ple-03
heredoc> on - ta
heredoc> **
heredoc> ### Estadersticas
heredoc> 
heredoc> #### MXN
heredoc> #### GET /api<ffffffff><ffffffff>#### MXN
heredoc> #### G de
heredoc> **
heredoc> ### Estadersticas
heredoc> 
heredoc> ##[ ]#Si
heredoc> #### MXN
heredoc> #### Gtor#### GEom#### G de
heredoc> **
heredoc> ### Estaderstó**
heredoc> ### Eas#- 
heredoc> #### o v#<ffffffff>l
heredoc> ###era#### MXNO:erMipo# ##Mipo# Ini200):<ffffffff><ffffffff><ffffffff>i
ocked-slots
heredoc> ObtenidObtener slots bloq{
heredoc> 
heredoc>   "Obtene CoMPObtem
heredoc>   "Obtene CoMPObtnte  "Obtene CoMPObtist  "Obtener sl: ER# I.mockedwaOb
 S# I.mocla  "Obtene CoMPObt