# Backlog - Integraciones Pendientes

Fecha: 6 de marzo de 2026
Estado: Pendiente

## 1️⃣ Avatar Upload Endpoint

### Endpoint
- **POST** `/api/users/me/avatar`

### Tecnologías
- Multer (manejo de archivos)
- Cloudinary o S3 (almacenamiento)

### Tareas
- [ ] Configurar Multer middleware para uploads
- [ ] Integrar con Cloudinary o AWS S3
- [ ] Validar tipo/tamaño de archivo
- [ ] Generar thumbnails (opcional)
- [ ] Actualizar `User.avatarUrl` en base de datos
- [ ] Endpoint para eliminar avatar
- [ ] Tests de integración

### Consideraciones
- Límite de tamaño: 5MB
- Formatos permitidos: JPG, PNG, WebP
- Optimización de imágenes antes de guardar

---

## 2️⃣ Payment Methods Backend

### Endpoints
1. **GET** `/api/payments/methods` - Listar métodos de pago del usuario
2. **POST** `/api/payments/methods` - Agregar nuevo método (Stripe)
3. **DELETE** `/api/payments/methods/:id` - Eliminar método
4. **PATCH** `/api/payments/methods/:id/default` - Establecer como predeterminado

### Integración Stripe
- [ ] Crear Customer en Stripe cuando usuario se registra
- [ ] Agregar PaymentMethod a Customer
- [ ] Sincronizar con base de datos local
- [ ] Webhook para actualizaciones de Stripe
- [ ] Manejo de errores y validaciones

### Modelo de Datos
```typescript
interface PaymentMethod {
  id: string;
  userId: string;
  stripePaymentMethodId: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string; // visa, mastercard, etc.
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Tareas
- [ ] Crear modelo PaymentMethod en Prisma
- [ ] Implementar endpoints
- [ ] Integrar Stripe SDK
- [ ] Configurar webhooks
- [ ] Validaciones de seguridad (usuario solo accede a sus métodos)
- [ ] Tests unitarios y de integración

---

## 3️⃣ Notification Settings API

### Endpoints
1. **GET** `/api/users/me/notifications-settings` - Obtener configuración actual
2. **PUT** `/api/users/me/notifications-settings` - Actualizar configuración

### Configuraciones
```typescript
interface NotificationSettings {
  userId: string;
  email: {
    bookingConfirmed: boolean;
    bookingReminder: boolean;
    bookingCancelled: boolean;
    messages: boolean;
    reviews: boolean;
    marketing: boolean;
  };
  push: {
    bookingConfirmed: boolean;
    bookingReminder: boolean;
    bookingCancelled: boolean;
    messages: boolean;
    reviews: boolean;
  };
  sms: {
    bookingReminder: boolean;
    bookingConfirmed: boolean;
  };
}
```

### Tareas
- [ ] Crear modelo NotificationSettings en Prisma
- [ ] Implementar endpoints GET/PUT
- [ ] Configuración por defecto al crear usuario
- [ ] Integrar con servicio de notificaciones
- [ ] Respetar preferencias en envío de notificaciones
- [ ] UI en frontend (página de configuración)
- [ ] Tests

### Prioridad
**Media** - Importante para UX pero no bloqueante

---

## 4️⃣ Booking Reschedule Backend

### Endpoint
- **PATCH** `/api/bookings/:id/reschedule`

### Payload
```typescript
interface RescheduleRequest {
  newDate: string; // ISO 8601
  newTime: string; // HH:mm
  reason?: string;
}
```

### Flujo
1. Validar que el booking existe y pertenece al usuario
2. Verificar disponibilidad del artista en nueva fecha/hora
3. Calcular si aplican cargos por cambio (política de cancelación)
4. Actualizar booking con nuevo horario
5. Enviar notificaciones:
   - Cliente: confirmación de cambio
   - Artista: notificación de reprogramación
6. Registrar en audit log

### Tareas
- [ ] Implementar endpoint de reschedule
- [ ] Validar disponibilidad del artista
- [ ] Implementar política de cargos por cambio
- [ ] Sistema de aprobación (si requiere aprobación del artista)
- [ ] Enviar notificaciones (email + push)
- [ ] Actualizar calendario del artista
- [ ] Audit log de cambios
- [ ] Tests de casos límite (cambios múltiples, fechas pasadas, etc.)

### Políticas de Negocio
- Límite de cambios: 2 cambios permitidos por booking
- Ventana de cambio: No permitir cambios <24h antes del evento
- Cargos: Evaluar si aplicar cargo por reprogramación

### Prioridad
**Alta** - Feature frecuentemente solicitada

---

## 5️⃣ Artist Dashboard Real Data

### Integraciones Necesarias

#### 5.1 Artist Bookings
**Función:** `getArtistBookings()`
- [ ] Conectar con `booking-service`
- [ ] Endpoint: `GET /api/bookings?artistId={id}&status={status}`
- [ ] Filtros: status, fecha, servicio
- [ ] Paginación
- [ ] Incluir datos del cliente (nombre, contacto)

#### 5.2 Artist Stats
**Función:** `getArtistStats()`
- [ ] Endpoint: `GET /api/artists/{id}/stats`
- [ ] Métricas:
  - Total de reservas (mes actual, mes anterior)
  - Ingresos (mes actual, mes anterior)
  - Calificación promedio
  - Tasa de aceptación
  - Tiempo de respuesta promedio
  - Próximas reservas
- [ ] Cálculo en tiempo real o caché

#### 5.3 Calendar Sync
- [ ] Integrar calendario con disponibilidad del artista
- [ ] Endpoint: `GET /api/artists/{id}/availability`
- [ ] Bloquear horarios reservados
- [ ] Permitir crear bloques de indisponibilidad
- [ ] Sincronización bidireccional (si se acepta reserva, bloquear calendario)

### Tareas
- [ ] Implementar `getArtistBookings()` con datos reales
- [ ] Implementar `getArtistStats()` con métricas reales
- [ ] Crear servicio de cálculo de estadísticas
- [ ] Sincronizar calendario con bookings
- [ ] Caché de estadísticas (Redis)
- [ ] Real-time updates (WebSocket/SSE opcional)
- [ ] Tests de integración

### Consideraciones de Performance
- Caché de stats (actualizar cada 5-15 min)
- Queries optimizadas en booking-service
- Índices en base de datos (artistId, status, date)

### Prioridad
**Alta** - Dashboard del artista es feature crítica

---

## Roadmap Sugerido

### Sprint Actual (Semana 1-2)
1. ✅ Integración de logo y mejoras de UI
2. 🔄 Artist Dashboard Real Data (5️⃣)
3. 🔄 Booking Reschedule Backend (4️⃣)

### Sprint Siguiente (Semana 3-4)
1. Payment Methods Backend (2️⃣)
2. Notification Settings API (3️⃣)

### Backlog (Sprint +2)
1. Avatar Upload Endpoint (1️⃣)
2. Otros features menores

---

## Notas Técnicas

### Dependencias a Instalar
```bash
# Avatar Upload
pnpm add multer @types/multer cloudinary

# Stripe Integration
pnpm add stripe @stripe/stripe-js

# Notificaciones (si no están)
pnpm add nodemailer twilio firebase-admin
```

### Variables de Entorno Requeridas
```env
# Cloudinary/S3
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Notificaciones
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

---

## Contacto y Referencias

- **Repositorio:** https://github.com/app-piums/piums-platform
- **Documentación API:** `/docs/api-contracts/openapi.yaml`
- **Issues:** Crear issues en GitHub para tracking detallado
- **Última actualización:** 6 de marzo de 2026
