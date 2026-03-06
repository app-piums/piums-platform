# 🗄️ Configuración de Base de Datos para artists-service

## Opción 1: PostgreSQL Local

### Instalar PostgreSQL (macOS)

```bash
# Con Homebrew
brew install postgresql@16
brew services start postgresql@16

# Verificar instalación
psql --version
```

### Crear base de datos

```bash
# Conectar a PostgreSQL
psql postgres

# Crear base de datos
CREATE DATABASE piums_artists;

# Crear usuario (opcional)
CREATE USER piums_artist WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE piums_artists TO piums_artist;

# Salir
\q
```

### Actualizar .env

```env
DATABASE_URL="postgresql://piums_artist:secure_password@localhost:5432/piums_artists?schema=public"
```

### Push schema

```bash
cd services/artists-service
npm run prisma:generate
npm run prisma:push
```

---

## Opción 2: Docker PostgreSQL

### docker-compose.yml (en services/artists-service/)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: piums_artists_db
    environment:
      POSTGRES_USER: piums_artist
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: piums_artists
    ports:
      - "5434:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Iniciar Docker

```bash
docker-compose up -d

# Verificar
docker ps
```

### Actualizar .env

```env
DATABASE_URL="postgresql://piums_artist:secure_password@localhost:5434/piums_artists?schema=public"
```

### Push schema

```bash
npm run prisma:generate
npm run prisma:push
```

---

## Opción 3: Usar Base de Datos Compartida

Si quieres usar la misma base de datos para todos los servicios:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/piums_platform?schema=artists"
```

El schema `artists` mantendrá las tablas aisladas.

---

## Verificar instalación

```bash
# Ver tablas creadas
npm run prisma:studio
```

Abrirá Prisma Studio en `http://localhost:5555`

Deberías ver:
- `artists` - Tabla principal
- `portfolio_items` - Portfolio multimedia
- `certifications` - Certificaciones
- `availability` - Horarios semanales

---

## Poblar datos de prueba (opcional)

```sql
-- Conectar a la base de datos
psql -d piums_artists

-- Insertar artista de prueba
INSERT INTO artists (
  id, auth_id, email, nombre, artist_name, category, 
  specialties, years_experience, country, city, 
  coverage_radius, verification_status, is_active
) VALUES (
  'art_test_1', 'user_123', 'dj@test.com', 'Carlos Méndez', 'DJ Carlos',
  'DJ', ARRAY['Tech House', 'Techno'], 8, 'México', 'Guadalajara',
  30, 'VERIFIED', true
);
```

---

## Troubleshooting

### Error: "Can't reach database server"

- Verificar que PostgreSQL está corriendo: `brew services list`
- Revisar credenciales en `.env`
- Probar conexión: `psql -d piums_artists`

### Error: "SSL connection required"

Agregar a DATABASE_URL: `?sslmode=require`

### Error: "Enum already exists"

```bash
# Limpiar y recrear
npm run prisma:push -- --force-reset
```

⚠️ **Warning**: `--force-reset` eliminará todos los datos

---

## Siguiente paso

Una vez configurada la base de datos:

```bash
npm run dev
```

¡Visita http://localhost:4003/health para verificar! ✅
