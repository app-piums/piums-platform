# Database Setup - Booking Service

Guía completa para configurar la base de datos PostgreSQL (local, Docker, o Supabase).

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
CREATE DATABASE piums_bookings;

# Crear usuario (opcional)
CREATE USER piums_user WITH ENCRYPTED PASSWORD 'piums_dev_password';

# Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE piums_bookings TO piums_user;

# Salir
\q
\`\`\`

### 3. Configurar Variables de Entorno

Crear archivo \`.env\`:

\`\`\`env
# Server Config
PORT=4005
NODE_ENV=development

# Database
DATABASE_URL="postgresql://piums_user:piums_dev_password@localhost:5432/piums_bookings?schema=public"

# JWT Secret (debe ser el mismo que en otros servicios)
JWT_SECRET="piums_dev_secret_jwt_2026_change_in_production"

# Service URLs
AUTH_SERVICE_URL="http://localhost:4001"
USERS_SERVICE_URL="http://localhost:4002"
ARTISTS_SERVICE_URL="http://localhost:4003"
CATALOG_SERVICE_URL="http://localhost:4004"
NOTIFICATIONS_SERVICE_URL="http://localhost:4006"
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
psql postgresql://piums_user:piums_dev_password@localhost:5432/piums_bookings

# Listar tablas
\dt

# Debería mostrar:
# bookings
# booking_status_changes
# blocked_slots
# availability_configs
\`\`\`

## 🐳 Configuración con Docker

### 1. Crear archivo docker-compose.yml

\`\`\`yaml
version: '3.8'

services:
  postgres-booking:
    image: postgres:14-alpine
    container_name: piums-booking-db
    environment:
      POSTGRES_DB: piums_bookings
      POSTGRES_USER: piums_user
      POSTGRES_PASSWORD: piums_dev_password
    ports:
      - "5435:5432"  # Puerto externo 5435 para no colisionar
    volumes:
      - booking-db-data:/var/lib/postgresql/data
    networks:
      - piums-network

volumes:
  booking-db-data:

networks:
  piums-network:
    external: true
\`\`\`

### 2. Iniciar Contenedor

\`\`\`bash
docker-compose up -d postgres-booking
\`\`\`

### 3. Configurar .env para Docker

\`\`\`env
DATABASE_URL="postgresql://piums_user:piums_dev_password@localhost:5435/piums_bookings?schema=public"
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

**Nota:** Supabase usa pgBouncer, por lo que necesitas dos URLs:
- \`DATABASE_URL\` con pgBouncer para queries
- \`DIRECT_URL\` sin pgBouncer para migraciones

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

## 🌱 Seed Data (Datos de Prueba)

### Script de Seed Manual

Crear \`prisma/seed.ts\`:

\`\`\`typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Configuración de disponibilidad para artista de prueba
  const config = await prisma.availabilityConfig.create({
    data: {
      artistId: 'artist-test-uuid',
      minAdvanceHours: 24,
      maxAdvanceDays: 90,
      bufferMinutes: 30,
      autoConfirm: false,
      requiresDeposit: true,
      cancellationHours: 48,
      cancellationFee: 50,
    },
  });

  console.log('✅ Config creada:', config.id);

  // Reserva de prueba
  const booking = await prisma.booking.create({
    data: {
      clientId: 'client-test-uuid',
      artistId: 'artist-test-uuid',
      serviceId: 'service-test-uuid',
      scheduledDate: new Date('2024-03-15T14:00:00Z'),
      durationMinutes: 120,
      location: 'Calle Principal 123, CDMX',
      locationLat: 19.4326,
      locationLng: -99.1332,
      status: 'CONFIRMED',
      servicePrice: 150000,
      addonsPrice: 30000,
      totalPrice: 180000,
      currency: 'MXN',
      depositRequired: true,
      depositAmount: 54000,
      paymentStatus: 'DEPOSIT_PAID',
      paidAmount: 54000,
      selectedAddons: ['addon-1', 'addon-2'],
      clientNotes: 'Sesión de fotos en exteriores',
    },
  });

  console.log('✅ Reserva creada:', booking.id);

  // Slot bloqueado (vacaciones)
  const blockedSlot = await prisma.blockedSlot.create({
    data: {
      artistId: 'artist-test-uuid',
      startTime: new Date('2024-04-01T00:00:00Z'),
      endTime: new Date('2024-04-07T23:59:59Z'),
      reason: 'Vacaciones de Semana Santa',
      isRecurring: false,
    },
  });

  console.log('✅ Slot bloqueado creado:', blockedSlot.id);
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

### Ver todas las reservas

\`\`\`sql
SELECT 
  id,
  "clientId",
  "artistId",
  status,
  "scheduledDate",
  "totalPrice",
  "paymentStatus"
FROM bookings
ORDER BY "createdAt" DESC
LIMIT 10;
\`\`\`

### Ver reservas pendientes por artista

\`\`\`sql
SELECT 
  id,
  "clientId",
  "scheduledDate",
  "totalPrice",
  "clientNotes"
FROM bookings
WHERE "artistId" = 'artist-uuid'
  AND status = 'PENDING'
ORDER BY "scheduledDate" ASC;
\`\`\`

### Ver historial de cambios de estado

\`\`\`sql
SELECT 
  bsc.id,
  b."clientId",
  b."artistId",
  bsc."fromStatus",
  bsc."toStatus",
  bsc.reason,
  bsc."changedBy",
  bsc."createdAt"
FROM booking_status_changes bsc
JOIN bookings b ON bsc."bookingId" = b.id
WHERE b.id = 'booking-uuid'
ORDER BY bsc."createdAt" ASC;
\`\`\`

### Ver slots bloqueados vigentes

\`\`\`sql
SELECT 
  id,
  "artistId",
  "startTime",
  "endTime",
  reason
FROM blocked_slots
WHERE "endTime" > NOW()
ORDER BY "startTime" ASC;
\`\`\`

### Estadísticas de reservas por estado

\`\`\`sql
SELECT 
  status,
  COUNT(*) as count,
  SUM("totalPrice") as total_revenue
FROM bookings
WHERE "artistId" = 'artist-uuid'
GROUP BY status
ORDER BY count DESC;
\`\`\`

## 📊 Índices Recomendados

Prisma crea automáticamente índices para PKs y FKs, pero puedes agregar más:

\`\`\`sql
-- Búsqueda por fecha programada
CREATE INDEX idx_bookings_scheduled_date ON bookings("scheduledDate");

-- Búsqueda por cliente
CREATE INDEX idx_bookings_client_id ON bookings("clientId");

-- Búsqueda por artista
CREATE INDEX idx_bookings_artist_id ON bookings("artistId");

-- Búsqueda por estado
CREATE INDEX idx_bookings_status ON bookings(status);

-- Búsqueda de disponibilidad
CREATE INDEX idx_blocked_slots_artist_time ON blocked_slots("artistId", "startTime", "endTime");
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
pg_dump -U piums_user -d piums_bookings > backup_bookings_$(date +%Y%m%d).sql

# Solo schema
pg_dump -U piums_user -d piums_bookings --schema-only > schema_bookings.sql

# Solo datos
pg_dump -U piums_user -d piums_bookings --data-only > data_bookings.sql
\`\`\`

### Restore

\`\`\`bash
psql -U piums_user -d piums_bookings < backup_bookings_20240220.sql
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
3. Base de datos existe: \`psql -l | grep piums_bookings\`
4. Puerto correcto (5432 por defecto)

### Error: "Prisma Client not found"

**Solución:**
\`\`\`bash
pnpm run prisma:generate
\`\`\`

### Resetear Base de Datos Completamente

\`\`\`bash
# Eliminar base de datos
psql postgres -c "DROP DATABASE piums_bookings;"

# Crear de nuevo
psql postgres -c "CREATE DATABASE piums_bookings;"

# Aplicar schema
pnpm run prisma:push
\`\`\`

## 📈 Monitoreo

### Ver conexiones activas

\`\`\`sql
SELECT 
  count(*) as connections,
  state
FROM pg_stat_activity
WHERE datname = 'piums_bookings'
GROUP BY state;
\`\`\`

### Ver tamaño de la base de datos

\`\`\`sql
SELECT 
  pg_size_pretty(pg_database_size('piums_bookings')) as size;
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

### Prisma Connection Pool

\`\`\`env
DATABASE_URL="postgresql://user:password@host:5432/piums_bookings?schema=public&connection_limit=10&pool_timeout=20"
\`\`\`

## 📚 Referencias

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
