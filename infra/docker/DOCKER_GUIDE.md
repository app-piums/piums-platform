# 🐳 Docker Compose Development Guide

Este documento explica cómo usar Docker Compose para levantar todo el stack de Piums en desarrollo.

## 📋 Prerrequisitos

- Docker 20.10+
- Docker Compose 2.0+
- 16GB RAM recomendados
- 10GB espacio en disco

## 🚀 Inicio Rápido

### 1. Levantar todo el stack

```bash
cd infra/docker
docker-compose -f docker-compose.dev.yml up -d
```

### 2. Ver logs

```bash
# Todos los servicios
docker-compose -f docker-compose.dev.yml logs -f

# Un servicio específico
docker-compose -f docker-compose.dev.yml logs -f auth-service
```

### 3. Detener el stack

```bash
docker-compose -f docker-compose.dev.yml down
```

### 4. Detener y eliminar volúmenes (datos)

```bash
docker-compose -f docker-compose.dev.yml down -v
```

## 🏗️ Servicios Incluidos

### Infraestructura
- **PostgreSQL** (puerto 5432) - Base de datos principal
- **Redis** (puerto 6379) - Cache y sessions

### API Gateway
- **Gateway** (puerto 3000) - Punto de entrada único

### Microservicios
- **auth-service** (puerto 4001) - Autenticación
- **users-service** (puerto 4002) - Usuarios
- **artists-service** (puerto 4003) - Artistas
- **catalog-service** (puerto 4004) - Catálogo
- **payments-service** (puerto 4005) - Pagos
- **reviews-service** (puerto 4006) - Reviews
- **notifications-service** (puerto 4007) - Notificaciones
- **booking-service** (puerto 4008) - Reservas
- **search-service** (puerto 4009) - Búsqueda

## 🗄️ Bases de Datos

Se crean automáticamente 9 bases de datos en PostgreSQL:

- `piums_auth`
- `piums_users`
- `piums_artists`
- `piums_catalog`
- `piums_bookings`
- `piums_payments`
- `piums_reviews`
- `piums_notifications`
- `piums_search`

### Credenciales de desarrollo

```
User: piums
Password: piums_dev_password
Host: localhost
Port: 5432
```

### Conectar desde host

```bash
psql -h localhost -U piums -d piums_users
```

## 🔧 Comandos Útiles

### Rebuild de todos los servicios

```bash
docker-compose -f docker-compose.dev.yml build
```

### Rebuild de un servicio específico

```bash
docker-compose -f docker-compose.dev.yml build auth-service
```

### Ejecutar comando en un contenedor

```bash
docker-compose -f docker-compose.dev.yml exec auth-service sh
```

### Ver estado de servicios

```bash
docker-compose -f docker-compose.dev.yml ps
```

### Reiniciar un servicio

```bash
docker-compose -f docker-compose.dev.yml restart auth-service
```

## 🏥 Health Checks

Verificar que todos los servicios estén saludables:

```bash
curl http://localhost:3000/api/health
```

## 🐛 Troubleshooting

### Base de datos no se conecta

```bash
# Ver logs de PostgreSQL
docker-compose -f docker-compose.dev.yml logs postgres

# Recrear volumen
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### Servicio no responde

```bash
# Ver logs del servicio
docker-compose -f docker-compose.dev.yml logs -f <service-name>

# Reiniciar servicio
docker-compose -f docker-compose.dev.yml restart <service-name>
```

### Problemas de permisos

```bash
# Limpiar todo y empezar de nuevo
docker-compose -f docker-compose.dev.yml down -v
docker system prune -a
docker-compose -f docker-compose.dev.yml up -d --build
```

### Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :3000

# Cambiar puerto en docker-compose.dev.yml
# Por ejemplo: "3001:3000" en lugar de "3000:3000"
```

## 🔐 Variables de Entorno

Para producción, crear archivo `.env` en `infra/docker/`:

```env
# Stripe (Payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT Secrets
JWT_SECRET=your_production_jwt_secret
REFRESH_SECRET=your_production_refresh_secret

# Database (para producción usar RDS/Cloud SQL)
POSTGRES_PASSWORD=secure_production_password
```

## 📊 Recursos

Consumo aproximado de recursos:

- **RAM**: ~8GB (todos los servicios)
- **CPU**: ~4 cores
- **Disco**: ~5GB (con volúmenes)

Para desarrollo individual, levantar solo los servicios necesarios:

```bash
# Solo infraestructura + auth + users
docker-compose -f docker-compose.dev.yml up -d postgres redis auth-service users-service gateway
```

## 🎯 Próximos Pasos

Después de levantar el stack:

1. Acceder al gateway: http://localhost:3000
2. Health check: http://localhost:3000/api/health
3. Probar login: POST http://localhost:3000/api/auth/login
4. Ver documentación de API en `/docs`

## 📝 Notas

- Los volúmenes persisten datos entre reinicios
- Hot reload está habilitado en desarrollo
- Los servicios se reinician automáticamente si fallan
- Las migraciones de Prisma se ejecutan automáticamente al iniciar
