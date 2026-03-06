# Database Setup - Notifications Service

Guía completa para configurar la base de datos PostgreSQL para el servicio de notificaciones.

## 📦 Prerequisitos

- PostgreSQL 14+
- Prisma CLI instalado (\`pnpm add -D prisma\`)

## 🔧 Configuración Local

### 1. Instalar PostgreSQL (si no está instalado)

**macOS:**
\`\`\`bash
brew install postgresql@14
brew services start postgresql@14
\`\`\`

**Ubuntu/Debian:**
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
\`\`\`

**Windows:**
Descargar desde https://www.postgresql.org/download/windows/

### 2. Crear Base de Datos

\`\`\`bash
# Conectar a PostgreSQL
psql postgres

# Crear base de datos
CREATE DATABASE piums_notifications;

# Crear usuario (opcional)
CREATE USER postgres WITH ENCRYPTED PASSWORD 'postgres';

# Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE piums_notifications TO postgres;

# Salir
\\q
\`\`\`

### 3. Configurar Variables de Entorno

Crear archivo \`.env\`:

\`\`\`env
# Server Config
PORT=4006
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/piums_notifications?schema=public"

# JWT Secret (debe ser el mismo que en otros servicios)
JWT_SECRET="piums_dev_secret_jwt_2026_change_in_production"

# Service URLs
AUTH_SERVICE_URL="http://localhost:4001"
USERS_SERVICE_URL="http://localhost:4002"
BOOKING_SERVICE_URL="http://localhost:4005"

# Email Config (reemplazar con valores reales)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER="noreply@piums.com"
EMAIL_PASSWORD="tu_app_password_aqui"
EMAIL_FROM="Piums <noreply@piums.com>"

# SMS Config (Twilio - reemplazar con valores reales)
TWILIO_ACCOUNT_SID="AC_tu_account_sid"
TWILIO_AUTH_TOKEN="tu_auth_token"
TWILIO_PHONE_NUMBER="+1234567890"

# Push Notifications (FCM)
FCM_SERVER_KEY="tu_fcm_server_key"

# Features (activar solo las configuradas)
ENABLE_EMAIL=true
ENABLE_SMS=false
ENABLE_PUSH=false

# Rate Limits
MAX_EMAILS_PER_HOUR=100
MAX_SMS_PER_HOUR=50
\`\`\`

### 4. Generar Prisma Client y Sincronizar Schema

\`\`\`bash
# Generar el cliente de Prisma
pnpm run prisma:generate

# Sincronizar schema con base de datos (crea tablas)
pnpm run prisma:push
\`\`\`

### 5. Verificar Tablas Creadas

\`\`\`bash
psql postgresql://postgres:postgres@localhost:5432/piums_notifications

# Listar tablas
\\dt

# Debería mostrar:
# notifications
# notification_templates
# user_notification_preferences
# notification_logs
\`\`\`

## 🐳 Configuración con Docker

### 1. Crear archivo docker-compose.yml

\`\`\`yaml
version: '3.8'

services:
  postgres-notifications:
    image: postgres:14-alpine
    container_name: piums-notifications-db
    environment:
      POSTGRES_DB: piums_notifications
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5436:5432"  # Puerto externo 5436 para no colisionar
    volumes:
      - notifications-db-data:/var/lib/postgresql/data
    networks:
      - piums-network

volumes:
  notifications-db-data:

networks:
  piums-network:
    external: true
\`\`\`

### 2. Iniciar Contenedor

\`\`\`bash
docker-compose up -d postgres-notifications
\`\`\`

### 3. Configurar .env para Docker

\`\`\`env
DATABASE_URL="postgresql://postgres:postgres@localhost:5436/piums_notifications?schema=public"
\`\`\`

### 4. Aplicar Migraciones

\`\`\`bash
pnpm run prisma:generate
pnpm run prisma:push
\`\`\`

## ☁️ Configuración con Supabase

### 1. Crear Proyecto en Supabase

1. Ir a https://supabase.com
2. Crear nuevo proyecto
3. Copiar **Database URL** (Connection String)

### 2. Configurar .env con Supabase URL

\`\`\`env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
\`\`\`

**Nota:** Supabase usa pgBouncer, por lo que necesitas dos URLs.

### 3. Actualizar prisma/schema.prisma

\`\`\`prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
\`\`\`

### 4. Aplicar Schema

\`\`\`bash
pnpm run prisma:generate
pnpm run prisma:push
\`\`\`

## 🌱 Seed Data (Templates y Datos de Prueba)

### Script de Seed

Crear \`prisma/seed.ts\`:

\`\`\`typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Templates de notificaciones
  const templates = [
    {
      key: 'booking_created',
      name: 'Reserva Creada',
      description: 'Notificación enviada al artista cuando se crea una reserva',
      type: 'BOOKING_CREATED',
      title: 'Nueva Reserva de {{userName}}',
      message: 'Tienes una nueva reserva para {{bookingDate}} en {{location}}',
      emailSubject: 'Nueva Reserva - {{serviceName}}',
      emailHtml: '<h1>Nueva Reserva</h1><p>{{userName}} ha solicitado una reserva...</p>',
      variables: ['userName', 'bookingDate', 'location', 'serviceName'],
      priority: 'high',
      category: 'booking',
    },
    {
      key: 'booking_confirmed',
      name: 'Reserva Confirmada',
      description: 'Notificación enviada al cliente cuando el artista confirma',
      type: 'BOOKING_CONFIRMED',
      title: '¡Tu reserva está confirmada!',
      message: 'Tu reserva con {{artistName}} para {{bookingDate}} ha sido confirmada',
      emailSubject: 'Reserva Confirmada - {{serviceName}}',
      priority: 'high',
      category: 'booking',
    },
    {
      key: 'booking_reminder_24h',
      name: 'Recordatorio 24 horas',
      description: 'Recordatorio enviado 24h antes de la cita',
      type: 'BOOKING_REMINDER_24H',
      title: 'Recordatorio: Cita mañana con {{artistName}}',
      message: 'Te recordamos que mañana tienes una cita a las {{bookingTime}} en {{location}}',
      emailSubject: 'Recordatorio: Tu cita es mañana',
      priority: 'normal',
      category: 'booking',
    },
    {
      key: 'payment_received',
      name: 'Pago Recibido',
      description: 'Confirmación de pago recibido',
      type: 'PAYMENT_RECEIVED',
      title: 'Pago Recibido',
      message: 'Hemos recibido tu pago de {{amount}} para la reserva #{{bookingId}}',
      emailSubject: 'Confirmación de Pago',
      priority: 'normal',
      category: 'payment',
    },
  ];

  for (const template of templates) {
    await prisma.notificationTemplate.upsert({
      where: { key: template.key },
      update: template,
      create: template,
    });
    console.log(\`✅ Template '\${template.key}' creado\`);
  }

  // Preferencias de usuario de prueba
  await prisma.userNotificationPreference.upsert({
    where: { userId: 'test-user-uuid' },
    update: {},
    create: {
      userId: 'test-user-uuid',
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      bookingNotifications: true,
      paymentNotifications: true,
      email: 'test@example.com',
    },
  });
  console.log('✅ Preferencias de usuario de prueba creadas');

  console.log('\\n🎉 Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
\`\`\`

Ejecutar seed:

\`\`\`bash
tsx prisma/seed.ts
\`\`\`

## 🔍 Consultas Útiles

### Ver todas las notificaciones

\`\`\`sql
SELECT 
  id,
  "userId",
  type,
  channel,
  status,
  title,
  "createdAt"
FROM notifications
ORDER BY "createdAt" DESC
LIMIT 20;
\`\`\`

### Ver notificaciones por usuario

\`\`\`sql
SELECT 
  type,
  channel,
  status,
  title,
  "sentAt",
  "readAt"
FROM notifications
WHERE "userId" = 'user-uuid'
ORDER BY "createdAt" DESC;
\`\`\`

### Ver templates activos

\`\`\`sql
SELECT 
  key,
  name,
  type,
  "isActive"
FROM notification_templates
WHERE "isActive" = true
ORDER BY name;
\`\`\`

### Ver estadísticas por canal

\`\`\`sql
SELECT 
  channel,
  status,
  COUNT(*) as count
FROM notifications
GROUP BY channel, status
ORDER BY channel, count DESC;
\`\`\`

### Ver notificaciones fallidas

\`\`\`sql
SELECT 
  id,
  "userId",
  type,
  channel,
  retries,
  "lastError",
  "createdAt"
FROM notifications
WHERE status = 'FAILED'
ORDER BY "createdAt" DESC;
\`\`\`

### Ver logs de eventos

\`\`\`sql
SELECT 
  nl.event,
  nl.provider,
  nl."errorMessage",
  nl."createdAt",
  n.type,
  n.channel
FROM notification_logs nl
JOIN notifications n ON nl."notificationId" = n.id
WHERE nl.event = 'failed'
ORDER BY nl."createdAt" DESC
LIMIT 50;
\`\`\`

## 📊 Índices Recomendados

Prisma crea automáticamente índices para PKs y FKs, pero puedes agregar más para optimización:

\`\`\`sql
-- Búsqueda por usuario
CREATE INDEX idx_notifications_user_id ON notifications("userId
");

-- Búsqueda por estado
CREATE INDEX idx_notifications_status ON notifications(status);

-- Búsqueda por tipo
CREATE INDEX idx_notifications_type ON notifications(type);

-- Notificaciones programadas
CREATE INDEX idx_notifications_scheduled ON notifications("scheduledFor") WHERE status = 'SCHEDULED';

-- Templates por key
CREATE INDEX idx_templates_key ON notification_templates(key);

-- Logs por notificación
CREATE INDEX idx_logs_notification_id ON notification_logs("notificationId");
\`\`\`

## 🔄 Migraciones

### Desarrollo (recomendado para producción)

\`\`\`bash
# Crear migración
pnpm run prisma migrate dev --name add_new_field

# Aplicar migraciones pendientes
pnpm run prisma migrate deploy

# Resetear base de datos (⚠️ DESTRUYE DATOS)
pnpm run prisma migrate reset
\`\`\`

### Desarrollo rápido (no recomendado para producción)

\`\`\`bash
# Push directo sin crear migración
pnpm run prisma:push
\`\`\`

## 🗄️ Backup y Restore

### Backup

\`\`\`bash
# Backup completo
pg_dump -U postgres -d piums_notifications > backup_notifications_$(date +%Y%m%d).sql

# Solo schema
pg_dump -U postgres -d piums_notifications --schema-only > schema_notifications.sql

# Solo datos
pg_dump -U postgres -d piums_notifications --data-only > data_notifications.sql
\`\`\`

### Restore

\`\`\`bash
psql -U postgres -d piums_notifications < backup_notifications_20240220.sql
\`\`\`

## 🛠️ Troubleshooting

### Error: "relation does not exist"

**Solución:**
\`\`\`bash
pnpm run prisma:generate
pnpm run prisma:push
\`\`\`

### Error: "Can't connect to database"

**Verificar:**
1. PostgreSQL está corriendo: \`pg_isready\`
2. Usuario y contraseña correctos en \`.env\`
3. Base de datos existe: \`psql -l | grep piums_notifications\`
4. Puerto correcto (5432 por defecto)

### Error: "Prisma Client not found"

**Solución:**
\`\`\`bash
pnpm run prisma:generate
\`\`\`

### Resetear Base de Datos Completamente

\`\`\`bash
# Eliminar base de datos
psql postgres -c "DROP DATABASE piums_notifications;"

# Crear de nuevo
psql postgres -c "CREATE DATABASE piums_notifications;"

# Aplicar schema
pnpm run prisma:push

# Aplicar seed
tsx prisma/seed.ts
\`\`\`

## 📈 Monitoreo

### Ver conexiones activas

\`\`\`sql
SELECT 
  count(*) as connections,
  state
FROM pg_stat_activity
WHERE datname = 'piums_notifications'
GROUP BY state;
\`\`\`

### Ver tamaño de la base de datos

\`\`\`sql
SELECT 
  pg_size_pretty(pg_database_size('piums_notifications')) as size;
\`\`\`

### Ver tamaño de cada tabla

\`\`\`sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
\`\`\`

## 🚀 Entorno de Producción

### Consideraciones

1. **Connection Pooling**: Usar PgBouncer o similar
2. **Backups automatizados**: Configurar pg_dump en cron
3. **Réplicas**: Master-slave para lectura/escritura
4. **Monitoring**: PostgreSQL Exporter + Prometheus + Grafana
5. **SSL**: Habilitar conexiones SSL
6. **Límite de conexiones**: Configurar Prisma connection pool
7. **Limpieza de logs antiguos**: Cron job para eliminar logs > 90 días

### Prisma Connection Pool

\`\`\`env
DATABASE_URL="postgresql://user:password@host:5432/piums_notifications?schema=public&connection_limit=10&pool_timeout=20"
\`\`\`

### Script de Limpieza de Logs

\`\`\`sql
-- Eliminar logs más antiguos de 90 días
DELETE FROM notification_logs
WHERE "createdAt" < NOW() - INTERVAL '90 days';

-- Eliminar notificaciones leídas más antiguas de 30 días
DELETE FROM notifications
WHERE status = 'READ' AND "readAt" < NOW() - INTERVAL '30 days';
\`\`\`

## 📚 Referencias

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Nodemailer Docs](https://nodemailer.com/)
- [Twilio Docs](https://www.twilio.com/docs)
- [Firebase FCM Docs](https://firebase.google.com/docs/cloud-messaging)
