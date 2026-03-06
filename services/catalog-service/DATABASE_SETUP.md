# Database Setup - Catalog Service

Este documento describe cómo configurar la base de datos PostgreSQL para el servicio de catálogo.

## Opción 1: PostgreSQL Local

### Instalar PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Descargar desde https://www.postgresql.org/download/windows/

### Crear base de datos

```bash
# Conectar a PostgreSQL
psql postgres

# Crear base de datos
CREATE DATABASE piums_catalog;

# Crear usuario (opcional)
CREATE USER piums_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE piums_catalog TO piums_user;

# Salir
\q
```

### Configurar .env

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/piums_catalog?schema=public"

# O con usuario personalizado:
DATABASE_URL="postgresql://piums_user:your-password@localhost:5432/piums_catalog?schema=public"
```

### Aplicar migraciones

```bash
# Generar Prisma Client
npm run prisma:generate

# Aplicar esquema (crear tablas)
npm run prisma:push

# Abrir Prisma Studio (opcional - interfaz visual)
npm run prisma:studio
```

## Opción 2: Docker

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres-catalog:
    image: postgres:14-alpine
    container_name: piums-catalog-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: piums_catalog
    ports:
      - "5436:5432"  # Puerto diferente para no conflictuar
    volumes:
      - catalog-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  catalog-data:
```

### Iniciar contenedor

```bash
# Iniciar base de datos
docker-compose up -d postgres-catalog

# Ver logs
docker-compose logs -f postgres-catalog

# Verificar salud
docker-compose ps
```

### Configurar .env

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5436/piums_catalog?schema=public"
```

### Aplicar migraciones

```bash
npm run prisma:generate
npm run prisma:push
```

## Opción 3: Supabase (Cloud)

### Crear proyecto

1. Ve a https://supabase.com
2. Crea una cuenta/inicia sesión
3. Crea un nuevo proyecto
4. Selecciona región (usa la más cercana)
5. Espera a que se aprovisione (~2 minutos)

### Obtener connection string

1. Ve a Settings → Database
2. Copia la "Connection string" en modo "Session"
3. Reemplaza `[YOUR-PASSWORD]` con tu contraseña

### Configurar .env

```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@[REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
```

### Aplicar migraciones

```bash
npm run prisma:generate
npm run prisma:push
```

## Verificación

### 1. Verificar conexión

```bash
# Con Prisma Studio
npm run prisma:studio

# Con psql
psql "postgresql://postgres:postgres@localhost:5432/piums_catalog"
```

### 2. Verificar tablas creadas

```sql
-- Listar todas las tablas
\dt

-- Deberías ver:
-- service_categories
-- services
-- service_addons
-- service_packages
```

### 3. Inspeccionar esquemas

```sql
-- Ver estructura de tabla Service
\d services

-- Ejemplo de query
SELECT * FROM service_categories LIMIT 5;
```

## Seed Data (Opcional)

Puedes crear categorías iniciales para testing:

```sql
-- Insertar categorías principales
INSERT INTO service_categories (id, name, slug, description, "order", "isActive", "createdAt", "updatedAt")
VALUES
  ('cat-musica', 'Música', 'musica', 'Servicios musicales y de audio', 1, true, NOW(), NOW()),
  ('cat-fotografia', 'Fotografía', 'fotografia', 'Servicios de fotografía profesional', 2, true, NOW(), NOW()),
  ('cat-video', 'Video', 'video', 'Producción y edición de video', 3, true, NOW(), NOW()),
  ('cat-tatuajes', 'Tatuajes', 'tatuajes', 'Arte corporal y tatuajes', 4, true, NOW(), NOW()),
  ('cat-arte', 'Arte Visual', 'arte-visual', 'Pintura, ilustración y arte', 5, true, NOW(), NOW()),
  ('cat-entretenimiento', 'Entretenimiento', 'entretenimiento', 'Shows y animación', 6, true, NOW(), NOW());

-- Insertar subcategorías
INSERT INTO service_categories (id, name, slug, description, "parentId", "order", "isActive", "createdAt", "updatedAt")
VALUES
  ('cat-musica-vivo', 'Música en vivo', 'musica-en-vivo', 'Bandas y músicos para eventos', 'cat-musica', 1, true, NOW(), NOW()),
  ('cat-dj', 'DJ', 'dj', 'DJs para fiestas y eventos', 'cat-musica', 2, true, NOW(), NOW()),
  ('cat-foto-bodas', 'Fotografía de Bodas', 'fotografia-bodas', 'Cobertura fotográfica de bodas', 'cat-fotografia', 1, true, NOW(), NOW()),
  ('cat-foto-eventos', 'Fotografía de Eventos', 'fotografia-eventos', 'Eventos corporativos y sociales', 'cat-fotografia', 2, true, NOW(), NOW()),
  ('cat-tat-pequeno', 'Tatuajes Pequeños', 'tatuajes-pequenos', 'Tatuajes de menos de 10cm', 'cat-tatuajes', 1, true, NOW(), NOW()),
  ('cat-animacion', 'Animación Infantil', 'animacion-infantil', 'Shows para fiestas de niños', 'cat-entretenimiento', 1, true, NOW(), NOW());

-- Verificar
SELECT 
  c1.name as categoria,
  c2.name as subcategoria
FROM service_categories c1
LEFT JOIN service_categories c2 ON c2."parentId" = c1.id
WHERE c1."parentId" IS NULL
ORDER BY c1."order", c2."order";
```

## Troubleshooting

### Error: "Can't reach database server"

**Causa:** PostgreSQL no está corriendo o la conexión es incorrecta.

**Solución:**
```bash
# Verificar status
brew services list  # macOS
sudo systemctl status postgresql  # Linux

# Reiniciar
brew services restart postgresql@14  # macOS
sudo systemctl restart postgresql  # Linux
```

### Error: "P1001: Can't reach database server at `localhost:5432`"

**Causa:** Puerto incorrecto o PostgreSQL en otro puerto.

**Solución:**
```bash
# Verificar puerto
pg_isready -h localhost -p 5432

# O verificar con netstat
lsof -i :5432
```

### Error: "P1017: Server has closed the connection"

**Causa:** Problema con connection pooling o timeout.

**Solución:**
Agregar a DATABASE_URL:
```
?connect_timeout=30&pool_timeout=30&connection_limit=10
```

### Error: "Authentication failed for user"

**Causa:** Usuario/contraseña incorrectos.

**Solución:**
```bash
# Resetear contraseña
psql postgres
ALTER USER postgres WITH PASSWORD 'new-password';
\q
```

### Prisma: "Table already exists"

**Causa:** Intentar crear tablas que ya existen.

**Solución:**
```bash
# Hacer reset de la base de datos
npm run prisma:migrate reset

# O eliminar y recrear
psql postgres
DROP DATABASE piums_catalog;
CREATE DATABASE piums_catalog;
\q

npm run prisma:push
```

## Backups

### Backup manual

```bash
# Backup completo
pg_dump -U postgres -d piums_catalog > backup-catalog-$(date +%Y%m%d).sql

# Solo schema
pg_dump -U postgres -d piums_catalog --schema-only > schema-catalog.sql

# Solo datos
pg_dump -U postgres -d piums_catalog --data-only > data-catalog.sql
```

### Restaurar backup

```bash
psql -U postgres -d piums_catalog < backup-catalog-20240115.sql
```

## Limpieza

```bash
# Eliminar todas las tablas (mantener DB)
npm run prisma:migrate reset

# Eliminar base de datos completa
psql postgres
DROP DATABASE piums_catalog;
\q

# Detener contenedor Docker
docker-compose down postgres-catalog

# Eliminar volumen Docker (¡CUIDADO! Elimina datos)
docker-compose down -v
```

## Monitoreo

### Verificar tamaño de la base de datos

```sql
SELECT 
  pg_database.datname,
  pg_size_pretty(pg_database_size(pg_database.datname)) AS size
FROM pg_database
WHERE datname = 'piums_catalog';
```

### Ver conexiones activas

```sql
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state
FROM pg_stat_activity
WHERE datname = 'piums_catalog';
```

### Performance de queries

```sql
-- Activar extensión
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Ver queries más lentas
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Recomendaciones de Producción

1. **Usar pooling de conexiones**: PgBouncer o conexiones directas con límites
2. **Indices**: Agregar índices para queries frecuentes
3. **Backups automáticos**: Configurar backups diarios
4. **Monitoreo**: Usar herramientas como pgAdmin, DataGrip o Supabase dashboard
5. **SSL**: Habilitar conexiones SSL en producción
6. **Replicación**: Considerar read replicas para alta carga
7. **Logs**: Configurar logging de slow queries

```sql
-- Ejemplo de índices adicionales
CREATE INDEX idx_services_artist_status ON services(artistId, status);
CREATE INDEX idx_services_category_active ON services(categoryId, status) WHERE status = 'ACTIVE';
CREATE INDEX idx_services_tags ON services USING GIN(tags);
CREATE INDEX idx_services_price_range ON services(basePrice) WHERE status = 'ACTIVE';
```
