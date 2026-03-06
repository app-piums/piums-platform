# 🐳 Docker Setup - Piums Platform

Configuración completa de Docker para desarrollo y staging.

## 📋 Estructura

```
infra/docker/
├── docker-compose.dev.yml      # Configuración desarrollo
├── docker-compose.staging.yml  # Configuración staging
├── init-databases.sql          # Script de inicialización DB
└── DOCKER_GUIDE.md            # Esta guía

scripts/
├── setup-docker.sh            # Crear Dockerfiles y .dockerignore
├── docker-up.sh              # Build y levantar stack
└── docker-health.sh          # Health checks

services/*/
├── Dockerfile                # Dockerfile del servicio
└── .dockerignore            # Archivos a ignorar
```

## 🚀 Inicio Rápido

### 1. Setup Inicial (Solo primera vez)

```bash
# Crear todos los Dockerfiles y .dockerignore
./scripts/setup-docker.sh
```

Esto creará:
- ✅ 10 Dockerfiles (9 servicios + 1 gateway)
- ✅ 10 archivos .dockerignore
- ✅ Verificación de docker-compose.dev.yml

### 2. Construir y Levantar (Primera vez: 10-15 min)

```bash
# Build de imágenes y levantar stack completo
./scripts/docker-up.sh
```

Esto ejecutará:
- 🏗️ Build de todas las imágenes Docker
- 🚀 Levantar PostgreSQL, Redis y todos los servicios
- ✅ Health checks automáticos

### 3. Verificar que todo funciona

```bash
# Health check de todos los servicios
./scripts/docker-health.sh
```

## 📦 Servicios Disponibles

| Servicio | Puerto | URL |
|----------|--------|-----|
| **PostgreSQL** | 5432 | localhost:5432 |
| **Redis** | 6379 | localhost:6379 |
| **Gateway** | 3000 | http://localhost:3000 |
| **Auth Service** | 4001 | http://localhost:4001 |
| **Users Service** | 4002 | http://localhost:4002 |
| **Artists Service** | 4003 | http://localhost:4003 |
| **Catalog Service** | 4004 | http://localhost:4004 |
| **Payments Service** | 4005 | http://localhost:4005 |
| **Reviews Service** | 4006 | http://localhost:4006 |
| **Notifications** | 4007 | http://localhost:4007 |
| **Booking Service** | 4008 | http://localhost:4008 |
| **Search Service** | 4009 | http://localhost:4009 |

## 🛠️ Comandos Útiles

### Ver logs en tiempo real

```bash
# Todos los servicios
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# Un servicio específico
docker-compose -f infra/docker/docker-compose.dev.yml logs -f auth-service
```

### Estado de contenedores

```bash
docker-compose -f infra/docker/docker-compose.dev.yml ps
```

### Reiniciar un servicio

```bash
docker-compose -f infra/docker/docker-compose.dev.yml restart auth-service
```

### Detener todo

```bash
docker-compose -f infra/docker/docker-compose.dev.yml down
```

### Detener y eliminar volúmenes (⚠️ borra datos)

```bash
docker-compose -f infra/docker/docker-compose.dev.yml down -v
```

### Rebuild de un servicio específico

```bash
docker-compose -f infra/docker/docker-compose.dev.yml up -d --build auth-service
```

### Acceder a un contenedor

```bash
# Bash en el contenedor
docker exec -it piums-auth-service sh

# Logs del contenedor
docker logs piums-auth-service

# Stats en tiempo real
docker stats piums-auth-service
```

## 🔧 Troubleshooting

### Problema: Puerto ya en uso

```bash
# Ver qué proceso usa el puerto
lsof -i :4001

# Matar el proceso
kill -9 <PID>
```

### Problema: Contenedor no inicia

```bash
# Ver logs del contenedor
docker-compose -f infra/docker/docker-compose.dev.yml logs <servicio>

# Ver logs completos
docker logs piums-<servicio>

# Reintentar
docker-compose -f infra/docker/docker-compose.dev.yml up -d --force-recreate <servicio>
```

### Problema: Error de base de datos

```bash
# Entrar a PostgreSQL
docker exec -it piums-postgres psql -U piums

# Listar bases de datos
\l

# Conectar a una base
\c piums_auth

# Ver tablas
\dt

# Salir
\q
```

### Problema: Redis no responde

```bash
# Entrar a Redis
docker exec -it piums-redis redis-cli

# Verificar
PING
# Debería responder: PONG

# Ver claves
KEYS *

# Salir
exit
```

### Problema: Rebuild completo necesario

```bash
# Detener todo
docker-compose -f infra/docker/docker-compose.dev.yml down -v

# Limpiar imágenes
docker system prune -a

# Rebuild desde cero
./scripts/docker-up.sh
```

## 📊 Monitoreo

### Ver recursos usados

```bash
# CPU y memoria de todos los contenedores
docker stats

# Solo contenedores de Piums
docker stats $(docker ps --filter "name=piums-" -q)
```

### Ver redes

```bash
# Listar redes
docker network ls | grep piums

# Inspeccionar red
docker network inspect piums-network
```

### Ver volúmenes

```bash
# Listar volúmenes
docker volume ls | grep docker_

# Inspeccionar volumen
docker volume inspect docker_postgres_data
```

## 🔐 Variables de Entorno

Las variables se configuran en `docker-compose.dev.yml`. Para producción usar variables de entorno del sistema:

```bash
# Ejemplo: Configurar Stripe para payments-service
export STRIPE_SECRET_KEY="sk_live_..."
export STRIPE_WEBHOOK_SECRET="whsec_..."

docker-compose -f infra/docker/docker-compose.dev.yml up -d payments-service
```

## 📝 Bases de Datos

Cada servicio tiene su propia base de datos PostgreSQL:

- `piums_auth` - Usuarios, tokens, sesiones
- `piums_users` - Perfiles de usuarios
- `piums_artists` - Artistas y servicios
- `piums_catalog` - Catálogo de servicios
- `piums_bookings` - Reservas
- `piums_payments` - Pagos y transacciones
- `piums_reviews` - Reseñas y ratings
- `piums_notifications` - Notificaciones
- `piums_search` - Índices de búsqueda

### Acceder a una base

```bash
docker exec -it piums-postgres psql -U piums -d piums_auth
```

## 🎯 Próximos Pasos

1. ✅ **Desarrollo Local**: Ya configurado
2. ⏳ **Staging**: Usar `docker-compose.staging.yml`
3. ⏳ **Producción**: Kubernetes (pendiente)
4. ⏳ **CI/CD**: GitHub Actions (pendiente)

## 📚 Recursos

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)

## ⚠️ Notas Importantes

- **Desarrollo**: Usa volúmenes para hot-reload
- **Staging/Prod**: Sin volúmenes, código en imagen
- **Migraciones**: Se ejecutan automáticamente al iniciar
- **Health checks**: Configurados para todos los servicios
- **Networking**: Todos en red `piums-network`
- **Restart Policy**: `unless-stopped` en desarrollo

---

**¿Problemas?** Revisa los logs o crea un issue en el repositorio.
