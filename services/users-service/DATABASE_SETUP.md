# 🗄️ Configuración de Base de Datos para users-service

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
CREATE DATABASE piums_users;

# Crear usuario (opcional)
CREATE USER piums_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE piums_users TO piums_user;

# Salir
\q
```

### Actualizar .env

```env
DATABASE_URL="postgresql://piums_user:secure_password@localhost:5432/piums_users?schema=public"
```

### Push schema

```bash
cd services/users-service
npm run prisma:push
```

---

## Opción 2: Docker PostgreSQL

### docker-compose.yml (en services/users-service/)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: piums_users_db
    environment:
      POSTGRES_USER: piums_user
      POSTGRES_PASSWORD: secure_password
      POSTGRES_DB: piums_users
    ports:
      - "5433:5432"
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
DATABASE_URL="postgresql://piums_user:secure_password@localhost:5433/piums_users?schema=public"
```

### Push schema

```bash
npm run prisma:push
```

---

## Opción 3: Supabase (Cloud)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Obtener connection string desde Settings > Database
3. Actualizar .env:

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

4. Push schema:

```bash
npm run prisma:push
```

---

## Verificar conexión

```bash
# Ver tablas creadas
npm run prisma:studio
```

Abrirá Prisma Studio en `http://localhost:5555`

---

## Troubleshooting

### Error: "Can't reach database server"

- Verificar que PostgreSQL está corriendo
- Revisar credenciales en .env
- Revisar que el puerto no esté bloqueado

### Error: "SSL connection required"

Agregar a DATABASE_URL: `?sslmode=require`

### Limpiar y recrear schema

```bash
# Eliminar archivos de migración
rm -rf prisma/migrations

# Push de nuevo
npm run prisma:push
```

---

## Siguiente paso

Una vez configurada la base de datos, el users-service estará completamente funcional y listo para recibir peticiones.

```bash
npm run dev
```

¡Visita http://localhost:4002/health para verificar! ✅
