# Notifications Service

Microservicio para gestión de notificaciones multi-canal en la plataforma Piums.

## 📋 Descripción

Este servicio maneja:
- **Notificaciones Email** (vía Nodemailer)
- **Notificaciones SMS** (vía Twilio)
- **Push Notifications** (vía FCM - Firebase Cloud Messaging)
- **Notificaciones In-App** (almacenamiento interno)
- **Templates de notificaciones** reutilizables
- **Preferencias de usuario** por canal
- **Scheduling** de notificaciones programadas
- **Do Not Disturb (DND)** respeto de horarios
- **Reintentos automáticos** en caso de fallo
- **Audit log** completo

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+
- PostgreSQL 14+
- pnpm (recomendado) o npm
- (Opcional) Cuenta de Gmail/SMTP para emails
- (Opcional) Cuenta de Twilio para SMS
- (Opcional) Firebase project para Push

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

El servicio estará disponible en \`http://localhost:4006\`

## 📊 Modelos de Datos

### Notification (Notificación)

\`\`\`typescript
{
  id: string (UUID)
  userId: string
  
  type: NotificationType
  channel: NotificationChannel
  
  title: string
  message: string
  data?: JSON  // Datos adicionales
  
  // Email specific
  emailTo?: string
  emailSubject?: string
  emailHtml?: string
  
  // SMS specific
  phoneNumber?: string
  
  // Push specific
  fcmToken?: string
  
  status: NotificationStatus
  sentAt?: DateTime
  readAt?: DateTime
  
  retries: number (default: 0)
  maxRetries: number (default: 3)
  lastError?: string
  
  scheduledFor?: DateTime
  priority: string (default: "normal")
  category?: string
  
  templateId?: string
  
  createdAt: DateTime
  updatedAt: DateTime
}
\`\`\`

### NotificationTemplate (Template)

\`\`\`typescript
{
  id: string
  key: string (unique)  // e.g., "booking_confirmed"
  
  name: string
  description?: string
  type: NotificationType
  
  title: string         // Con placeholders {{variable}}
  message: string
  emailSubject?: string
  emailHtml?: string
  
  variables?: JSON      // ["userName", "bookingDate"]
  
  isActive: boolean
  priority: string
  category?: string
  
  createdAt: DateTime
  updatedAt: DateTime
}
\`\`\`

### UserNotificationPreference (Preferencias)

\`\`\`typescript
{
  id: string
  userId: string (unique)
  
  emailEnabled: boolean (default: true)
  smsEnabled: boolean (default: false)
  pushEnabled: boolean (default: true)
  
  bookingNotifications: boolean (default: true)
  paymentNotifications: boolean (default: true)
  reviewNotifications: boolean (default: true)
  marketingNotifications: boolean (default: false)
  
  dndEnabled: boolean (default: false)
  dndStartHour?: number (0-23)
  dndEndHour?: number (0-23)
  
  timezone: string (default: "America/Mexico_City")
  
  email?: string
  phoneNumber?: string
  fcmTokens?: JSON  // Array de tokens
  
  createdAt: DateTime
  updatedAt: DateTime
}
\`\`\`

### NotificationLog (Log de auditoría)

\`\`\`typescript
{
  id: string
  notificationId: string
  
  event: string  // sent, failed, read, delivered
  details?: JSON
  errorMessage?: string
  
  provider?: string  // nodemailer, twilio, fcm
  providerId?: string
  
  createdAt: DateTime
}
\`\`\`

## 🔄 Enums

### NotificationType

\`\`\`typescript
enum NotificationType {
  BOOKING_CREATED
  BOOKING_CONFIRMED
  BOOKING_REJECTED
  BOOKING_CANCELLED
  BOOKING_REMINDER_24H
  BOOKING_REMINDER_2H
  BOOKING_COMPLETED
  BOOKING_NO_SHOW
  
  PAYMENT_RECEIVED
  PAYMENT_REMINDER
  PAYMENT_REFUNDED
  
  REVIEW_REQUEST
  REVIEW_RECEIVED
  
  MESSAGE_RECEIVED
  
  SYSTEM_NOTIFICATION
  MARKETING
}
\`\`\`

### NotificationChannel

\`\`\`typescript
enum NotificationChannel {
  EMAIL
  SMS
  PUSH
  IN_APP
}
\`\`\`

### NotificationStatus

\`\`\`typescript
enum NotificationStatus {
  PENDING      // Creada, esperando ser enviada
  SCHEDULED    // Programada para el futuro
  SENDING      // En proceso de envío
  SENT         // Enviada exitosamente
  DELIVERED    // Confirmada por el provider
  FAILED       // Falló después de reintentos
  READ         // Leída por el usuario
}
\`\`\`

## 🔌 API Endpoints

### Enviar Notificaciones

#### POST /api/notifications/send
Enviar notificación individual (requiere auth)

**Headers:**
\`\`\`
Authorization: Bearer <token>
\`\`\`

**Body:**
\`\`\`json
{
  "userId": "user-uuid",
  "type": "BOOKING_CONFIRMED",
  "channel": "EMAIL",
  "title": "Reserva Confirmada",
  "message": "Tu reserva ha sido confirmada por el artista",
  "data": {
    "bookingId": "booking-uuid",
    "artistName": "John Doe"
  },
  "emailTo": "client@example.com",
  "emailSubject": "¡Tu reserva está confirmada!",
  "emailHtml": "<h1>Reserva Confirmada</h1><p>...</p>",
  "priority": "high",
  "category": "booking"
}
\`\`\`

**Response (201):**
\`\`\`json
{
  "id": "notification-uuid",
  "userId": "user-uuid",
  "type": "BOOKING_CONFIRMED",
  "channel": "EMAIL",
  "status": "SENT",
  "sentAt": "2024-02-20T10:00:00.000Z",
  "createdAt": "2024-02-20T10:00:00.000Z"
}
\`\`\`

#### POST /api/notifications/batch
Enviar notificaciones a múltiples usuarios (requiere auth)

**Body:**
\`\`\`json
{
  "userIds": ["user-uuid-1", "user-uuid-2"],
  "type": "SYSTEM_NOTIFICATION",
  "channel": "IN_APP",
  "title": "Nueva funcionalidad",
  "message": "Hemos añadido X funcionalidad",
  "priority": "normal"
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "total": 2,
  "successful": 2,
  "failed": 0,
  "notifications": [...]
}
\`\`\`

#### POST /api/notifications/template
Enviar desde template (requiere auth)

**Body:**
\`\`\`json
{
  "userId": "user-uuid",
  "templateKey": "booking_reminder_24h",
  "channel": "EMAIL",
  "variables": {
    "userName": "John Doe",
    "bookingDate": "25 de Febrero, 2:00 PM",
    "artistName": "Jane Smith",
    "location": "Calle Principal 123"
  },
  "scheduledFor": "2024-02-24T14:00:00Z"
}
\`\`\`

### Consultas de Notificaciones

#### GET /api/notifications/:id
Obtener notificación por ID (requiere auth)

**Response (200):**
\`\`\`json
{
  "id": "notification-uuid",
  "userId": "user-uuid",
  "type": "BOOKING_CONFIRMED",
  "channel": "EMAIL",
  "title": "Reserva Confirmada",
  "message": "...",
  "status": "SENT",
  "sentAt": "2024-02-20T10:00:00.000Z",
  "template": {
    "key": "booking_confirmed",
    "name": "Confirmación de Reserva"
  }
}
\`\`\`

#### GET /api/notifications
Buscar notificaciones con filtros (requiere auth)

**Query params:**
- \`userId\` (string)
- \`type\` (NotificationType)
- \`channel\` (NotificationChannel)
- \`status\` (NotificationStatus)
- \`category\` (string)
- \`startDate\` (ISO datetime)
- \`endDate\` (ISO datetime)
- \`page\` (number, default: 1)
- \`limit\` (number, default: 20, max: 100)

**Example:**
\`\`\`
GET /api/notifications?userId=user-123&channel=EMAIL&status=SENT&page=1&limit=10
\`\`\`

**Response (200):**
\`\`\`json
{
  "notifications": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
\`\`\`

#### POST /api/notifications/read
Marcar como leídas (requiere auth)

**Body:**
\`\`\`json
{
  "notificationIds": ["notif-uuid-1", "notif-uuid-2"]
}
\`\`\`

**Response (200):**
\`\`\`json
{
  "updated": 2
}
\`\`\`

#### DELETE /api/notifications/:id
Eliminar notificación (requiere auth, solo propias)

**Response (200):**
\`\`\`json
{
  "deleted": true
}
\`\`\`

### Templates

#### POST /api/notifications/templates
Crear template (requiere auth)

**Body:**
\`\`\`json
{
  "key": "booking_reminder_24h",
  "name": "Recordatorio 24 horas",
  "description": "Recordatorio enviado 24h antes de la cita",
  "type": "BOOKING_REMINDER_24H",
  "title": "Recordatorio: Cita mañana con {{artistName}}",
  "message": "Hola {{userName}}, te recordamos que mañana tienes una cita...",
  "emailSubject": "Recordatorio: Tu cita es mañana",
  "emailHtml": "<h1>Recordatorio</h1>...",
  "variables": ["userName", "artistName", "bookingDate", "location"],
  "priority": "high",
  "category": "booking"
}
\`\`\`

#### GET /api/notifications/templates/:key
Obtener template por key

#### GET /api/notifications/templates
Listar todos los templates

**Query params:**
- \`type\` (optional)
- \`isActive\` (optional, boolean)

#### PUT /api/notifications/templates/:key
Actualizar template

#### DELETE /api/notifications/templates/:key
Eliminar template

### Preferencias de Usuario

#### GET /api/notifications/preferences
Obtener preferencias del usuario actual (requiere auth)

**Response (200):**
\`\`\`json
{
  "id": "pref-uuid",
  "userId": "user-uuid",
  "emailEnabled": true,
  "smsEnabled": false,
  "pushEnabled": true,
  "bookingNotifications": true,
  "paymentNotifications": true,
  "reviewNotifications": true,
  "marketingNotifications": false,
  "dndEnabled": false,
  "timezone": "America/Mexico_City"
}
\`\`\`

#### PUT /api/notifications/preferences
Actualizar preferencias (requiere auth)

**Body:**
\`\`\`json
{
  "emailEnabled": true,
  "smsEnabled": true,
  "dndEnabled": true,
  "dndStartHour": 22,
  "dndEndHour": 8,
  "marketingNotifications": false,
  "phoneNumber": "+52 1234567890"
}
\`\`\`

### Estadísticas

#### GET /api/notifications/stats
Obtener estadísticas (requiere auth)

**Query params:**
- \`userId\` (optional)

**Response (200):**
\`\`\`json
{
  "total": 500,
  "pending": 10,
  "sent": 450,
  "failed": 5,
  "read": 300
}
\`\`\`

### Health Check

#### GET /health
Estado del servicio

**Response (200):**
\`\`\`json
{
  "status": "healthy",
  "service": "notifications-service",
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
- **Enviar notificaciones**: 50 / hora
- **Batch send**: 10 / hora
- **Actualizar preferencias**: 20 / 15 min

## 📧 Configuración de Email

### Gmail (recomendado para desarrollo)

1. Activar "2-Step Verification" en tu cuenta de Gmail
2. Generar "App Password": https://myaccount.google.com/apppasswords
3. Configurar en \`.env\`:

\`\`\`env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="tu-email@gmail.com"
EMAIL_PASSWORD="tu_app_password_aqui"
EMAIL_FROM="Piums <noreply@piums.com>"
ENABLE_EMAIL=true
\`\`\`

### Otros Proveedores

#### SendGrid
\`\`\`env
EMAIL_HOST="smtp.sendgrid.net"
EMAIL_PORT=587
EMAIL_USER="apikey"
EMAIL_PASSWORD="tu_sendgrid_api_key"
\`\`\`

#### Mailgun
\`\`\`env
EMAIL_HOST="smtp.mailgun.org"
EMAIL_PORT=587
EMAIL_USER="tu_mailgun_user"
EMAIL_PASSWORD="tu_mailgun_password"
\`\`\`

## 📱 Configuración de SMS (Twilio)

1. Crear cuenta en https://www.twilio.com
2. Obtener Account SID y Auth Token
3. Obtener o comprar un número de teléfono
4. Configurar en \`.env\`:

\`\`\`env
TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_AUTH_TOKEN="tu_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"
ENABLE_SMS=true
\`\`\`

## 🔔 Push Notifications (Firebase FCM)

1. Crear proyecto en https://console.firebase.google.com
2. Ir a Project Settings > Cloud Messaging
3. Copiar Server Key
4. Configurar en \`.env\`:

\`\`\`env
FCM_SERVER_KEY="tu_fcm_server_key"
ENABLE_PUSH=true
\`\`\`

**Nota**: Requiere integración adicional con Firebase Admin SDK (TODO)

## 🎯 Templates de Variables

Los templates soportan variables con la sintaxis \`{{variableName}}\`:

\`\`\`
Título: "Hola {{userName}}, tu reserva con {{artistName}}"
Mensaje: "Tu cita está programada para {{bookingDate}} en {{location}}"
\`\`\`

Variables comunes:
- \`userName\`: Nombre del usuario
- \`artistName\`: Nombre del artista
- \`bookingDate\`: Fecha/hora de la reserva
- \`location\`: Ubicación
- \`serviceName\`: Nombre del servicio
- \`totalPrice\`: Precio total
- \`cancellationReason\`: Razón de cancelación

## 🚦 Estados de Notificación

**Flujo normal**:
\`\`\`
PENDING → SENDING → SENT → READ
\`\`\`

**Con scheduling**:
\`\`\`
PENDING → SCHEDULED → (espera) → SENDING → SENT → READ
\`\`\`

**Con fallo**:
\`\`\`
PENDING → SENDING → (retry 1) → SENDING → (retry 2) → SENDING → (retry 3) → FAILED
\`\`\`

## 🛡️ Do Not Disturb (DND)

Cuando un usuario tiene DND activado:
1. Se verifica la hora actual vs horario DND
2. Si está en período DND, la notificación se programa automáticamente
3. Se envía después de la hora de fin del DND

**Ejemplo**:
- DND: 10 PM - 8 AM
- Notificación llega a las 11 PM → Se programa para las 8 AM

## 🔄 Reintentos Automáticos

- **maxRetries**: 3 (configurable)
- **Estrategia**: Reintento inmediato
- **Estados**: PENDING → SENDING → (fallo) → PENDING → ...
- **Después de maxRetries**: Status cambia a FAILED

## 📂 Estructura

\`\`\`
notifications-service/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── controller/
│   │   └── notification.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── providers/
│   │   ├── email.provider.ts
│   │   ├── sms.provider.ts
│   │   └── push.provider.ts
│   ├── routes/
│   │   ├── notification.routes.ts
│   │   └── health.routes.ts
│   ├── schemas/
│   │   └── notification.schema.ts
│   ├── services/
│   │   └── notification.service.ts
│   ├── utils/
│   │   └── logger.ts
│   └── index.ts
└── README.md
\`\`\`

## 🔗 Integración con Otros Servicios

### booking-service (puerto 4005)
Enviar notificaciones cuando:
- Se crea una reserva → \`BOOKING_CREATED\` (notificar artista)
- Se confirma → \`BOOKING_CONFIRMED\` (notificar cliente)
- Se rechaza → \`BOOKING_REJECTED\` (notificar cliente)
- Se cancela → \`BOOKING_CANCELLED\` (notificar ambos)
- 24h antes → \`BOOKING_REMINDER_24H\` (usar flags \`reminderSent24h\`)
- 2h antes → \`BOOKING_REMINDER_2H\` (usar flags \`reminderSent2h\`)
- Completada → \`BOOKING_COMPLETED\` (notificar ambos)

### payments-service (futuro)
- Pago recibido → \`PAYMENT_RECEIVED\`
- Recordatorio de pago → \`PAYMENT_REMINDER\`
- Reembolso → \`PAYMENT_REFUNDED\`

### reviews-service (futuro)
- Solicitud de reseña → \`REVIEW_REQUEST\`
- Reseña recibida → \`REVIEW_RECEIVED\`

## 📝 Logs

Formato JSON estructurado:

\`\`\`json
{
  "timestamp": "2024-02-20T10:00:00.000Z",
  "level": "INFO",
  "service": "notifications-service",
  "context": "NOTIFICATION_SERVICE",
  "message": "Notification sent successfully",
  "data": {
    "notificationId": "uuid",
    "userId": "user-uuid",
    "channel": "EMAIL"
  }
}
\`\`\`

## 🧪 Testing

Ver \`test-integration.sh\` para pruebas E2E.

## 📈 Próximas Funcionalidades

- [ ] Worker/queue para procesamiento asíncrono (Bull/BullMQ)
- [ ] Webhook callbacks para notificaciones
- [ ] Implementación completa de FCM Push
- [ ] Soporte para adjuntos en emails
- [ ] Templates HTML con plantillas visuales
- [ ] A/B testing de templates
- [ ] Analytics de tasas de apertura/click
- [ ] Notificaciones por WhatsApp (Twilio API)
- [ ] Notificaciones por Slack/Discord
- [ ] Digest diario/semanal
- [ ] Priorización inteligente de notificaciones

## 📄 Licencia

MIT
HEREDOC
echo "README.md creado exitosamente"
`, and this is the output of running that command instead:
piums@Mac-mini-de-piums piums-platform %  cat > /Users/piums/Desktop/piums-platf
orm/services/notifications-service/README.md << 'HEREDOC'
heredoc> # Notifications Service
heredoc> 
heredoc> Microservicio para gestión de notificaciones multi-canal en la platafor
ma Piums.
heredoc> 
heredoc> ## 📋 Descripción
heredoc> 
heredoc> Este servicio maneja:
heredoc> - **Notificaciones Email** (vía Nodemailer)
heredoc> - **Notificaciones SMS** (vía Twilio)
heredoc> - **Push Notifications** (vía FCM - Firebase Cloud Messaging)
heredoc> - **Notificaciones In-App** (almacenamiento interno)
heredoc> - **Templates de notificaciones** reutilizables
heredoc> - **Preferencias de usuario** por canal
heredoc> - **Scheduling** de notificaciones programadas
heredoc> - **Do Not Disturb (DND)** respeto de horarios
heredoc> - **Reintentos automáticos** en caso de fallo
heredoc> - **Audit log** completo
heredoc> 
heredoc> ## 🚀 Inicio Rápido
heredoc> 
heredoc> ### Prerequisitos
heredoc> - Node.js 18+
heredoc> - PostgreSQL 14+
heredoc> - pnpm (recomendado) o npm
heredoc> - (Opcional) Cuenta de Gmail/SMTP para emails
heredoc> - (Opcional) Cuenta de Twilio para SMS
heredoc> - (Opcional) Firebase project para Push
heredoc> 
heredoc> ### Instalación
heredoc> 
heredoc> \`\`\`bash
heredoc> # Instalar dependencias
heredoc> pnpm install
heredoc> 
heredoc> # Configurar variables de e# Notifications Service
heredoc> 
heredoc> Microservicio para gestión de notificaciones multi-canal en la platafun

heredoc> Microservicio para geear
heredoc> ## 📋 Descripción
heredoc> 
heredoc> Este servicio maneja:
heredoc> - **Notificaciones Email** (vía Norun
heredoc> Este servicio manevic- **Notificaciones Ee - **Notificaciones SMS** (ví
a Twilio)
heredoc> - **os- **Push Notifications** (vía FCM - ci- **Notificaciones In-App**
 (almacenamiento interno)
heredoc> - **Temp
heredoc>  - **Templates de notificaciones** reutilizables
heredoc> - *ha- **Preferencias de usuario** por canal
heredoc> - **Scta- **Scheduling** de notificaciones proEm- **Do Not Disturb (DND
)** respeto de horariot?- **Reintentos automáticos** en caso de faleci- **Audit 
log** completo
heredoc> 
heredoc> ## 🚀 Inicio Rápfi
heredoc> ## 🚀 Inicio Rápido 
heredoc>  
heredoc> ### Prerequisitos
heredoc> - Sta- Node.js 18+
heredoc> - at- PostgreSQLAt- pnpm (recomen  - (Opcional) Cuenta de G: 0- (Opcion
al) Cuenta de Twilio para SMS
heredoc> - (Opro- (Opcional) Firebase project para Pume
heredoc> ### Instalación
heredoc> 
heredoc> \`\`\`bash
heredoc> # Instal)
heredoc>  
heredoc> \`\`\`bash
heredoc> # Iing# Instalaplpnpm instaring
heredoc>   
heredoc>   crea
heredoc> # ConfigurTim
heredoc> Microservicio para gestión de notificaciones munTeMicroservicio para ge
ear
heredoc> ## 📋 Descripción
heredoc> 
heredoc> Este servicio maneja:
heredoc> - e)## 📋 Descripcing_confi
heredoc> Este servicio manerin- **NotificacionesstriEste servicio manevic- Type
heredoc>   
heredoc>   title:- **os- **Push Notifications** (vía FCM - ci- **Notificaciones 
In-App** (almacet?- **Temp
heredoc>  - **Templates de notificaciones** reutilizables
heredoc> - *ha- **Preferencias de usuario** porct - **Teolean
heredoc>   priority: string
heredoc>   category?: string
heredoc>   
heredoc>   c- **Scta- **Scheduling** de notificaciones \`
heredoc> ## 🚀 Inicio Rápfi
heredoc> ## 🚀 Inicio Rápido 
heredoc>  
heredoc> ### Prerequisitos
heredoc> - Sta- Node.js 18+
heredoc> - at- PostgreSQLAt- pnpm (recomen  - (Opcional) Cuenta de G: 0- (Opcion
al) Cuend: boolean (default: fals 
heredoc> ### Prerequisitos
heredoc> - ean - Sta- Node.js 1  - at- PostgreSQLAat- (Opro- (Opcional) Firebase
 project para Pume
heredoc> ### Instalación
heredoc> 
heredoc> \`\`\`bash
heredoc> # Instal)
heredoc>  
heredoc> \`\`\`bash
heredoc> : boolean (default: true)
heredoc>   marketingNotification
heredoc> \`\`\`bash
heredoc> # Iault: false)
heredoc>   
heredoc> \`\`\`nabl# Iing# Ian  
heredoc>   crea
heredoc> # ConfigurTim
heredoc> Microsur : number (0-23)
heredoc>   dndEndHour?: number (0-23)
heredoc>   
heredoc>   timezone: string (default: "America/Mexico_City")
heredoc>   
heredoc>   email?: string
heredoc>   phoneNumber?: string
heredoc>   fcmTokens?: JSON  // Array d  
heredoc>   title:- **os- **Push Notifications** (vía FCM - ci- **Notificac Noti 
- **Templates de notificacía)
heredoc> 
heredoc> \`\`\`typescript
heredoc> {
heredoc>   id: string
heredoc>   notificationId: string
heredoc>   
heredoc>   event: string  // sent, failed, read, delivered
heredoc>   det  priority: string
heredoc>   category?: string
heredoc>   
heredoc>   c- **Sc s  category?: strile  
heredoc>   c- **Scta- **roviderId?: string
heredoc>   
heredoc>   createdAt: DateTime
heredoc> }
heredoc> \`\`\`
heredoc> 
heredoc> ## 🚀 Inicio RápiotificationType
heredoc> 
heredoc> \`\`\`types- Sta- Node.js 1ic- at- PostgreSQLAKI### Prerequisitos
heredoc> - ean - Sta- Node.js 1  - at- PostgreSQLAat- (Opro- (Opcional) Firebase
 project para PEM- ean - Sta- NodNG### Instalación
heredoc> 
heredoc> \`\`\`bash
heredoc> # Instal)
heredoc>  
heredoc> \`\`\`bash
heredoc> : boolean (default: true)
heredoc>   marketin
heredoc>  
heredoc> \`\`\`bash
heredoc> # IEST# Instal)_R 
heredoc> \`\`\`  
heredoc>  : booleanRE  marketingNotification
heredoc> IC\`\`\`bash
heredoc> # Iault: fa\`# Iault: ot  
heredoc> \`\`\`nabl#el\
heredoc> \  crea
heredoc> # ConfigurTim
heredoc> Mot# ContiMicrosur : n    dndEndHour?: number (_A  
heredoc>   timezone: string (defaon ta  
heredoc>   email?: string
heredoc>   phoneNumber?: string
heredoc>   fcmToPE DING      // Creada, esperando ser enviada
heredoc>   SCHEDULED    // Programada par
heredoc> \`\`\`typescript
heredoc> {
heredoc>   id: string
heredoc>   notificationId: string
heredoc>   
heredoc>   event: string  // sent, failed, read,    {
heredoc>   id: string
heredoc> por   notificat
heredoc>    
heredoc>   event: string  //  d sp  det  priority: string
heredoc>   category?: string
heredoc>   
heredoc>  el  category?: string
heredoc>   <ffffffff> 
heredoc>   c- **Sc s  ca##  E  c- **Scta- **roviderId?: stri /  
heredoc>   createdAt: DateTime
heredoc> }
heredoc> \`\`\tific}
heredoc> \`\`\`
heredoc> 
heredoc> ## 🚀 Inequi
heredoc> ## <ffffffff>th
heredoc> \`\`\`types- Sta- Node.js 1ic- aton:- ean - Sta- Node.js 1  - at- Postg
reSQLAat- (Opro- (Opcional) F-u
heredoc> \`\`\`bash
heredoc> # Instal)
heredoc>  
heredoc> \`\`\`bash
heredoc> : boolean (default: true)
heredoc>   marketin
heredoc>  
heredoc> \`\`\`bash
heredoc> # IEST# Instal)_R 
heredoc>  "Tu reserva ha sido# Instal)da 
heredoc> \`\`\`arti: booleanda  marketin
heredoc>  
heredoc> \`\`\`bash
heredoc> "b 
heredoc> \`\`\`bid",# IEST# Iis\`\`\`  
heredoc>  : boole"
heredoc>  : bool"eIC\`\`\`bash
heredoc> # Iault: fa\`# Iault:em# Iault: fa: \`\`\`nabl#el\
heredoc> \  crea
heredoc> # rm\  crea
heredoc> # Conil# Conf "Mot# ContiMiCo  timezone: string (defaon ta  
heredoc>   email?: string
heredoc>  "c  email?: string
heredoc>   phoneNumber**  phoneNumber?:**  fcmToPE DING      / "  SCHEDULED    /
/ Programada par
heredoc> \`\`\`typescript
heredoc> {e"\`\`\`typescript
heredoc> {
heredoc>   id: stringel{
heredoc>   id: stri  "stat  notificat,
heredoc>   
heredoc>   event: string  // T1 :0  id: string
heredoc> por   notificat
heredoc>    
heredoc>   event: s0:por   notif\`   
heredoc>   event: sT   pi  category?: string
heredoc>   
heredoc>  el  category?: string
heredoc>  <ffffffff>l  
heredoc>  el  category?:eq ie  <ffffffff> 
heredoc>   c- **Sc s  c`\  c- on  createdAt: DateTime
heredoc> }
heredoc> \`\`\tific}
heredoc> \`\`\`
heredoc> 
heredoc> ## 🚀 Ine"}
heredoc> \`\`\tific}
heredoc> \`\`\`ON",\`\`\`
heredoc> 
heredoc> ##l"
heredoc> ## <ffffffff>AP## <ffffffff>th
heredoc> \`\`\: \`\`\` f\`\`\`bash
heredoc> # Instal)
heredoc>  
heredoc> \`\`\`bash
heredoc> : boolean (default: true)
heredoc>   marketin
heredoc>  
heredoc> \`\`\`bash
heredoc> # IEST# Instal)_Ron# Instal)**
heredoc> \`\`\`json
heredoc> : booleanl"  marketin
heredoc>  
heredoc> \`\`\`bash
heredoc>    
heredoc> \`\`\`b 0,
heredoc> # IEST# Ica "Tu reserva ha s`\\`\`\`arti: booleanda  marketinns 
heredoc> \`\`\`bash
heredoc> "b 
heredoc> \`\`\`bid",# e (r"b 
heredoc> \`\`\ut\`
heredoc> 
heredoc>  : boole"
heredoc>  : bool"eIC\`\`\`barI : bool"r-# Iault: fa\`# Iaulty"\  crea
heredoc> # rm\  crea
heredoc> # Conil# Conf "Mot# ContiMiCo "variable# Conil# C"u  email?: string
heredoc>  "c  email?: string
heredoc>   phoneNumber**  phone00 "c  email?: stst  phoneNumber**  p",\`\`\`type
script
heredoc> {e"\`\`\`typescript
heredoc> {
heredoc>   id: stringel{
heredoc>   id: stri  "stat  notificat,
heredoc>  
heredoc> \{e"\`\`\`typescul{
heredoc>   id: stringel{
heredoc> nes
heredoc>   id: stri  "s/n  
heredoc>   event: string  // T1 :0if capor   notificat
heredoc>    
heredoc>   event: s0:por on   
heredoc>   event
heredoc> \`\`  js  event: sT   pi  category?uu  
heredoc>  el  category?: string
heredoc>  <ffffffff>l  
heredoc>  eyp ": <ffffffff>l  
heredoc>  el  category?:
heredoc>   elhan  c- **Sc s  c`\  c- on   "}
heredoc> \`\`\tific}
heredoc> \`\`\`
heredoc> 
heredoc> ## 🚀 Ine"}
heredoc> \`\`\ti"sta\`\`\`
heredoc> 
heredoc> ##T"
heredoc> ## <ffffffff>en\At": "2024-02\`\`\`ON",00
heredoc> ##l"
heredoc> ## <ffffffff>AP##lat##  {\`\`\: \`\: "bo# Instal)
heredoc>  
heredoc> \`\`\`bash
heredoc> :am 
heredoc> \`\`\`firm: boolean R  marketin
heredoc>  
heredoc> \`\`\`bash
heredoc> ## 
heredoc> \`\`\`b/not# IEST# ns
heredoc> \`\`\`jsotificaciones con filtr: booleaner 
heredoc> \`\`\`bash
heredoc>    
heredoc> \`\ams:   
heredoc> \`\`ser\`\`# IEST# I
heredoc> -\`\`\`bash
heredoc> "b 
heredoc> \`\`\`bid",# e (r"b 
heredoc> \`\`\ut\`
heredoc> 
heredoc>  : boole"
heredoc>  : boo)
heredoc> "b 
heredoc> \`\`\s\\`(N\`\`\ut\`
heredoc> 
heredoc>  : boole- 
heredoc>  : boolry\ : bool"g)# rm\  crea
heredoc> # Conil# Conf "Mot# ContiMiCo "variable# Conil#)
heredoc> # Conil# ` ( "c  email?: string
heredoc>   phoneNumber**  phone00 "c  email?: stst  pho*E  phoneNum\`\`\`
heredoc> GET{e"\`\`\`typescript
heredoc> {
heredoc>   id: stringel{
heredoc>   id: stri  "stat  notificat,
heredoc>  
heredoc> \{e"\`0
heredoc> {
heredoc>   id: stringel{
heredoc>  (20  id: stri  "son 
heredoc> \{e"\`\`\`typescul{
heredoc>   ..],
heredoc>   "  id: stringel{
heredoc> ne "nes
heredoc>   id: stri"l  it": 10,
heredoc>     "total":   
heredoc>   event: s0:por on   
heredoc>   event
heredoc> \`\`  js  /a  /n  event
heredoc> \`\`  js  evrc\`\`  o  el  category?: string
heredoc>  <ffffffff>l  
heredoc>  eyp ": <ffffffff>`\ <ffffffff>l  
heredoc>  eyp ": <ffffffff>l  
heredoc>  eon eyp:  el  categod-  elhan  c- **d-\`\`\tific}
heredoc> \`\`\`
heredoc> 
heredoc> ## 🚀 Ine"}
heredoc> \`\`\`\`
heredoc> 
heredoc> ##
heredoc>  
heredoc> ## <ffffffff>te\`\`\ti"sta\\`
heredoc> ##T"
heredoc> ## <ffffffff>en\Atpi/## if##l"
heredoc> ## <ffffffff>AP##lat##ar notificació## re 
heredoc> \`\`\`bash
heredoc> :am 
heredoc> \`\`\`firm: boolean R 200):am 
heredoc> \`\``j\`\
heredoc> { 
heredoc> \`\`\`bash
heredoc> ## 
heredoc> \`\`\`b/not# ## T## 
heredoc> \`\`\
heredoc> #\`# \`\`\`jsotificacioneon\`\`\`bash
heredoc>    
heredoc> \`\ams:   
heredoc> \`\`ser\`\`# IES
heredoc> 
heredoc>    
heredoc> \`\am
heredoc> \`\`\\`\`s
heredoc> {
heredoc>   "-\`\`\`bash
heredoc> "b 
heredoc> \`\nd"b 
heredoc> \`\`\` "\`me\`\`\ut\`
heredoc> 
heredoc>  : boole h
heredoc>  : bool "d : boo)
heredoc> on": "Reco\`at
heredoc>  : boole- 
heredoc>  : booltes de la cita# Conil# Conf "Mot# ContiMiCo _2# Conil# ` ( "c  e
mail?: string
heredoc>   phoneNumber** {  phoneNumber**  phone00 "c  eHoGET{e"\`\`\`typescript

heredoc> {
heredoc>   id: stringel{
heredoc>   id: stri  "stat  not
heredoc>  {
heredoc>   id: stringel{
heredoc>   iorda  id: str cita e 
heredoc> \{e"\`0
heredoc> {
heredoc>   id: stringel{
heredoc> <h1>{
heredoc>   rdator (20  id: stri "\{e"\`\`\`typescul{
heredoc> me  ..],
heredoc>   "  id: stbo  "  Dane "nes
heredoc>   id: str
heredoc>    id: ri    "total":   
heredoc>   eveor  event: s0:po}
heredoc>   event
heredoc> \`\`  js  /ai/\`\`  ca\`\`  jemplates/:key
heredoc> Obt <ffffffff>l  
heredoc>  eyp ": <ffffffff>`\ <ffffffff>l  
heredoc>  eyp ": <ffffffff>l  
heredoc>  eon eyca eyns/ eyp ": <ffffffff>l  
heredoc>  er  eon eyp:  em\`\`\`
heredoc> 
heredoc> ## 🚀 Ine"}
heredoc> \`\`\`\`
heredoc> 
heredoc> ##
heredoc>  
heredoc> ## <ffffffff>te\`\`\ \
heredoc> ## <ffffffff>ive\` (optional,
heredoc> ##olean)
heredoc>  ######T"
heredoc> ## <ffffffff>en\Atpi/##on## em## <ffffffff>AP##lat##ar notir \`\`\`bash

heredoc> :am 
heredoc> \`\`\`firm: booleaat:am 
heredoc> \`\`la\`\/:\`\``j\`\
heredoc> { 
heredoc> \`\`\`bash
heredoc> ## 
heredoc> \ef{ 
heredoc> \`\`\ de U## 
heredoc> \`\`\##\`GE\`\`\
heredoc> #\`# \`\`\`jss/#\`#er   
heredoc> \`\ams:   
heredoc> \`\`ser\`\`# IES
heredoc> 
heredoc>    io\`ct\`\`ser\`ie
heredoc>    
heredoc> \`\am
heredoc> \`\`pon\` (\`\`:*{
heredoc>   "-\`\son
heredoc> "b 
heredoc> \`\nd"b 
heredoc> ef\`ui\`\`\` us
heredoc>  : boole h
heredoc>  : bool   " : bool "leon": "Reco\`at
heredoc>  En : boole- 
heredoc>  :,
heredoc>  : boolteab  phoneNumber** {  phoneNumber**  phone00 "c  eHoGET{e"\`\`\
`typescript
heredoc> {
heredoc>   id: strew{
heredoc>   id: stringel{
heredoc>   id: stri  "stat  not
heredoc>  {
heredoc>   id: stringel{
heredoc>   iorda  i": f  id: stri  "zon {
heredoc>   id: stringel{
heredoc>   ity"
heredoc>   iorda  id: s P\{e"\`0
heredoc> {
heredoc>   id: stris/pre{
heredoc>   ides
heredoc> A<hualizar prefer  rdasme  ..],
heredoc>   "  id: stbo  "  Dane "nes
heredoc>   id  "  "  idab  id: str
heredoc>    id: ri    "to:    id: r"d  eveor  event: s0:po}
heredoc> dS  event
heredoc> \`\`  js  /aiEn\`\`  : Obt <ffffffff>l  
heredoc>  eyp ": <ffffffff>`\ <ffffffff>l  
heredoc>  eyp ": <ffffffff>l  
heredoc>  eph eyp ":er eyp ": <ffffffff>l  
heredoc>  e89 eon eyca e
heredoc> 
heredoc>  er  eon eyp:  em\`\`\`
heredoc> 
heredoc> #T 
heredoc> ## 🚀 Ine"}
heredoc> \`\`\`\ts
heredoc> \`\`\`\`
heredoc> 
heredoc> ##d<ffffffff>##
heredoc>  as (r quie## <ffffffff>ive\` (oue##olean)
heredoc>  ######T"
heredoc> #rI ######ti## <ffffffff>en\*R:am 
heredoc> \`\`\`firm: booleaat:am 
heredoc> \`\`la\`\/:\`\``j\`\
heredoc> { 
heredoc> ng\`\10\`\`la\`\/:\`\``j\`\
heredoc> { le{ 
heredoc> \`\`\`bash
heredoc> ## 
heredoc> \0
heredoc> \
heredoc> \## 
heredoc> \ef{ # \eal\`\`he\`\`\##\`GE\ /#\`# \`\`\`jss/el\`\ams:   
heredoc> \`\`ser\`\`#20\`\`s
heredoc> \`\`\
heredoc>    io\`ct\`\`sus"   
heredoc> \`\am
heredoc> \`\`pon\`vi\`":\`\`ti  "-\`\son
heredoc> "b 
heredoc> \`","b 
heredoc> \`\ndta\`":ef\`ui\02-20T10:00:00.000 : bool  ti En : boole- 
heredoc>  :,
heredoc>  : boolteab  phonti :,
heredoc>  : booltpo :ts{
heredoc>   id: strew{
heredoc>   id: stringel{
heredoc>   id: stri  "stat  not
heredoc>  {
heredoc>   id: stringel{
heredoc>   iorda `\`
heredoc>   id: strin c  id: stri  "s`j {
heredoc>   id: stringel{
heredoc>   ui ",  iorda  i": fse  id: stringel{
heredoc>   ity"
heredoc>   iorda  R  ity"
heredoc>   iorda-   iorer{
heredoc>   id: stris/pre{
heredoc>   i5 mi  ides
heredoc> A<hualiztiA<huaio  "  id: stbo  "  Dane "nes
heredoc>   d*  id  "  "  idab  id: str
heredoc> r    id: ri    "to:    id:midS  event
heredoc> \`\`  js  /aiEn\`\`  : Obt <ffffffff>l  
heredoc>  eyp(reco\`\`  jspa eyp ": <ffffffff>`\ <ffffffff>l  
heredoc>  eyp ": <ffffffff>l  
heredoc> St eyp ": <ffffffff>l  
heredoc>  e"  eph eyp ":a  e89 eon eyca e
heredoc> 
heredoc>  er  eo P
heredoc>  er  eon eyp:s:/
heredoc> #T 
heredoc> ## 🚀 Ine"}
heredoc> \`/app##ss\`\`\`\ts
heredoc> \`fi\`\`r en \
heredoc> ##d<ffffffff>#:
heredoc> 
heredoc>  as (ren ######T"
heredoc> #rI ######ti## <ffffffff>en\*R:IL#rI ####7
heredoc> \`\`\`firm: booleaat:am 
heredoc> US\`\`la\`\/:\`\``j\`\
heredoc> { 
heredoc> E{ 
heredoc> ng\`\10\`\`la\`\ppnpa{ le{ 
heredoc> \`ui"
heredoc> EMAIL_FROM="Piu\`\`\or## 
heredoc> \0
heredoc> \
heredoc> s.\0m>\
heredoc> ENA\ef_E\`\`ser\`\`#20\`\`s
heredoc> \`\`\
heredoc>    io\`ct\`\`sus"   
heredoc> \`\am
heredoc> \`\`\`\`\`\
heredoc>    io\`ct\`\sm   ien\`\am
heredoc> \`\`pon\`vi\`RT\`\`
heredoc> E"b 
heredoc> \`","b 
heredoc> \`\ndta\`":ef\`ui\OR\`"t\`\nddgr :,
heredoc>  : boolteab  phonti :,
heredoc>  : booltpo :ts{
heredoc>   id: strew{
heredoc>   i.m :lg : booltpo :ts{
heredoc>   id:7
heredoc>   id: strew{
heredoc>  _m  id: strin"
heredoc>   id: stri  "s=" {
heredoc>   id: stringel{
heredoc>   \` `\  iorda `\`
heredoc>   fi  id: str de  id: stringel{
heredoc>   ui ",  iorda e  ui ",  iordatw  ity"
heredoc>   iorda  R  ity"
heredoc>   iorda-   ioh   ion
heredoc> 3  iorda-   iorepr  id: stris/pre{ t  i5 mi  ides
heredoc> AfiA<hualiztiA<en  d*  id  "  "  idab  id: str
heredoc> r    id: ri  "
heredoc> r    id: ri    "to:    id:miok\`\` WILIO_PHONE_NUMBER="+1234567890"
heredoc>  eyp(reco\`\`  jspa eyp ": <ffffffff>`\<ffffffff>  eyp ": <ffffffff>l  

heredoc> St eyp ": <ffffffff>l  
heredoc>  e"  e
heredoc> 1St eyp ": <ffffffff>ye e"  eph eyp //console.firebase.google.com
heredoc> 2. Ir  er oject #T 
heredoc> ## 🚀 Ined ##ss\`/app##ss\`ia\`fi\`\`r en \
heredoc> ##dnf##d<ffffffff>#:
heredoc> 
heredoc>  as en
heredoc>  as (\`\#rI ######ti## <ffffffff>_\`\`\`firm: booleaat:am 
heredoc> US\`\`laSHUS\`\`la\`\/:\`\``j\`\
heredoc>  R{ 
heredoc> E{ 
heredoc> ng\`\10\`\`la\adEcingal\`ui"
heredoc> EMAIL_FROM="Piu\`\`\ODEMAI##\0
heredoc> \
heredoc> s.\0m>\
heredoc> ENA\ef_E\`\bl\s
heredoc> 
heredoc> LENA\efpl\`\`\
heredoc>    io\`ct\`\`sus"   n    iin\`\am
heredoc> \`\`\`\`\`\
heredoc>  am\`\``:   io\`ct\í\`\`pon\`vi\`RT\`\`
heredoc> E"b , E"b 
heredoc> \`","b 
heredoc> \`\ndrt\`"Na\`\ndtMe : boolteab  phonti :,
heredoc>  : booltpo ar : booltpo :ts{
heredoc>   id:{{  id: strew{
heredoc>  \`\`
heredoc> 
heredoc> Variables  id:7
heredoc>   id: strew{
heredoc>  _m`:  id:re _m  id: sto
heredoc>   id: stri  "s\`  id: stringel{
heredoc>  st  \` `\  iordaat  fi  id: str de e   ui ",  iorda e  ui ",  iordaca 
 iorda  R  ity"
heredoc>   iorda-   ioh   ioner  iorda-   ioh Pr3  iorda-   iorepr 
heredoc> -AfiA<hualiztiA<en  d*  id  "  "  idab  id: str
heredoc> r
heredoc> #r    id: ri  "
heredoc> r    id: ri    "to:    id:miokalr    id: `
heredoc> PENDING → SENDING → SENT → READ
heredoc> \`\`\`
heredoc> 
heredoc> **Con scheduling**:
heredoc> \`\`\`St eyp ": <ffffffff>l  
heredoc>  e"  e
heredoc> 1St eyp ": <ffffffff>ye e"  epDI e"  e
heredoc> 1St ey<ffffffff><ffffffff>1St e
heredoc> \2. Ir  er oject #T 
heredoc> ## 🚀 Ined ##ss\`/app##ss\`ia\`fiet## 🚀 Ined ##ss\<ffffffff>#dnf##d<ff
ffffff>#:
heredoc> 
heredoc>  as en
heredoc>  as (\`\#rI ######ti## IL
heredoc>  as en
heredoc>  as##  as (<ffffffff><ffffffff>US\`\`laSHUS\`\`la\`\/:\`\``j\`\
heredoc>  R{ 
heredoc> E{ 
heredoc> ng\`\10D  R{ 
heredoc> E{ 
heredoc> ng\`\10\`\`la\adEcingaa E{ uangvsEMAIL_FROM="Piu\`\`\ODEMAI# p\
heredoc> s.\0m>\
heredoc> ENA\ef_E\`\bl\s
heredoc> 
heredoc> LE se ENA\efma
heredoc> LENA\efpl\`\`nte   io\`ct\`\` d\`\`\`\`\`\
heredoc>  am\`\``:   io\`ct\<ffffffff>
heredoc>  am\`\``: **E"b , E"b 
heredoc> \`","b 
heredoc> \`\ndrt\`"Na\`\ndtMele\`","b 
heredoc> \11\`\n→  : booltpo ar : booltpo :ts{
heredoc>   id:{{  id:nt  id:{{  id: strew{
heredoc>  \`\`
heredoc> 
heredoc> ri \`\`
heredoc> 
heredoc> Variables  bl
heredoc> Var **  id: strew{
heredoc>  Re _m`:  id:red  id: stri  "s\`  id: sDI st  \` `\  iordaat  fi  id: s
 P  iorda-   ioh   ioner  iorda-   ioh Pr3  iorda-   iorepr 
heredoc> -AfiA<hualiztiA<en  d*  idra-AfiA<hualiztiA<en  d*  id  "  "  idab  id:
 str
heredoc> r
heredoc> #r    i<ffffffff><ffffffff>r
heredoc> #r    id: ri  "
heredoc> r    id: ri    "to:    id:mi<ffffffff><ffffffff><ffffffff>   ntroller/
heredoc> <ffffffff>ENDING → SENDING → SENT → READ
heredoc> \`\er\`\`\`
heredoc> 
heredoc> **Con scheduling**:
heredoc> \`\`\`St  
heredoc> **Co <ffffffff>`\`\`St eyp ": <ffffffff>lew e"  e
heredoc> 1St eyp ": <ffffffff><ffffffff>St e<ffffffff><ffffffff>1St ey<ffffffff>
<ffffffff>1St e
heredoc> \2. Ir  er oje <ffffffff>2. Ir  er oeL## 🚀 Ined ##ss\`<ffffffff> as en

heredoc>  as (\`\#rI ######ti## IL
heredoc>  as en
heredoc>  as##  as (<ffffffff><ffffffff>US\`\`laSHUS\`├ as (<ffffffff>  as en
heredoc>  as##  as (<ffffffff><ffffffff>US\`<ffffffff>  as##<ffffffff>R{ 
heredoc> E{ 
heredoc> ng\`\10D  R{ 
heredoc> E{ 
heredoc> ng\`\10\`\`la\adE/
heredoc> E{   ng<ffffffff><ffffffff>E{ 
heredoc> ng\`\10\ nngifs.\0m>\
heredoc> ENA\ef_E\`\bl\s
heredoc> 
heredoc> LE se ENA\efma
heredoc> LENA\efpl\`\`nte   io\ <ffffffff>NA\e─
heredoc> LE se ENA\efm  <ffffffff>ENA\efpl\`\`<ffffffff>  am\`\``:   io\`ct\<fff
fffff>
heredoc>  am\`\``: **E"b , Erv am\`\``: **E"b , E"<ffffffff><ffffffff>`","b 
heredoc> \`\ndrt\`"Na\rv\`\ndr
heredoc> <ffffffff>11\`\n→  : booltpo ar : b<ffffffff> id:<ffffffff><ffffffff>──
 logger.ts
heredoc> │   └──  \`\`
heredoc> 
heredoc> ri \`\`
heredoc> 
heredoc> Variables  bl
heredoc> Va`\
heredoc> ri # <ffffffff>Va IntegVar **  id: Ot Re _m`:  id:red # -AfiA<hualiztiA
<en  d*  idra-AfiA<hualiztiA<en  d*  id  "  "  idab  id: s reserva → \`BOOKING_C
REATED\` (notificar artista)
heredoc> - Se cr
heredoc> #r    i<ffffffff><ffffffff>r
heredoc> #r    id: ri  "
heredoc> r    id: ri    "to:    id:mi<ffffffff><ffffffff><ffffffff>   ntroller/O
OKI#r    id:EDr    id: ri   cl<ffffffff>ENDING → SENDING → SENT → READ
heredoc> \`\e` \`\er\`\`\`
heredoc> 
heredoc> **Con scheduling**:
heredoc> \`\`\OK
heredoc> **Con schER_\`\`\`St  
heredoc> **Co <ffffffff>`**Co <ffffffff>`en1St eyp ": <ffffffff><ffffffff>St e<f
fffffff><ffffffff>1St ey<ffffffff><ffffffff>1St_R\2. Ir  er oje <ffffffff>2. Ir 
 er oeL## er as (\`\#rI ######ti## IL
heredoc>  as en
heredoc>  as##  as (<ffffffff><ffffffff>US\`\`laSHUar as en
heredoc>  as##  as (<ffffffff><ffffffff>US\`rv as##fu as##  as (<ffffffff><fffff
fff>US\`<ffffffff>  as##<ffffffff>R{ 
heredoc> E{ 
heredoc> ng\`\10EDE{ 
heredoc> ng\`\10D  R{ 
heredoc> E{ 
heredoc> ng\`\10 \ngAYE{ 
heredoc> ng\`\10\R\ng- E{   ng<ffffffff><ffffffff>E{ 
heredoc> ng\`AYng\`\10\ nnEDENA\ef_E\`\bl\s
heredoc> 
heredoc> LE ic
heredoc> LE se ENA\efmoliLENA\efpl\`\`ñLE se ENA\efm  <ffffffff>ENA\efpl\`\`<fff
fffff> ñ am\`\``: **E"b , Erv am\`\``: **E"b , E"<ffffffff><ffffffff>`","b 
heredoc> or\`\ndrt\`"Na\rv\`\ndr
heredoc> <ffffffff>11\`\n→  : booltpo ar :p"<ffffffff>11\`\n<ffffffff>20T10:00:0
0│   └──  \`\`
heredoc> 
heredoc> ri \`\`
heredoc> 
heredoc> Variables  bl
heredoc> Va`\
heredoc> ris-
heredoc> ri \`\`
heredoc> 
heredoc> Variables ": 
heredoc> VariaICAVa`\
heredoc> ri # <ffffffff>",ri "m- Se cr
heredoc> #r    i<ffffffff><ffffffff>r
heredoc> #r    id: ri  "
heredoc> r    id: ri    "to:    id:mi<ffffffff><ffffffff><ffffffff>   ntroller/O
OKI#r    id:EDr    id: ri   cl<ffffffff>ENDING → SENDING → SENT → READ
heredoc> \`\e` \`\er\`\`\`
heredoc> 
heredoc> **te#r    eg#r    id:\`r    id: ri   E2\`\e` \`\er\`\`\`
heredoc> 
heredoc> **Con scheduling**:
heredoc> \`\`\OK
heredoc> **Con schER_\`\`\`St  
heredoc> **Co <ffffffff>`**Co <ffffffff>`en1St eyp ": <ffffffff><ffffffff>St e<f
fffffff><ffffffff>1Stk 
heredoc> **Con schedulinoti\`\`\OK
heredoc> **Con schEmp**Con ac**Co <ffffffff>`**Co <ffffffff>`en1Pu as en
heredoc>  as##  as (<ffffffff><ffffffff>US\`\`laSHUar as en
heredoc>  as##  as (<ffffffff><ffffffff>US\`rv as##fu as##  as (<ffffffff><fffff
fff>US\`<ffffffff>  as##<ffffffff>R{ 
heredoc> E{ 
heredoc> ng\`\10EDE{ te as## ] as##  as (<ffffffff><ffffffff>US\`rv as##fu as##/
cE{ 
heredoc> ng\`\10EDE{ 
heredoc> ng\`\10D  R{ 
heredoc> E{ 
heredoc> ng\`\10 \ngAYE{ 
heredoc> ng\ ]ngotng\`\10D  R pE{ 
heredoc> ng\`\10 cong
heredoc> -ng\`\10\R\ng- Ering\`AYng\`\10\ nnEDENA\efi<ffffffff>LE ic
heredoc> LE se ENA\efmoliLENA\efpl\
heredoc> ##LE s<ffffffff> or\`\ndrt\`"Na\rv\`\ndr
heredoc> <ffffffff>11\`\n→  : booltpo ar :p"<ffffffff>11\`