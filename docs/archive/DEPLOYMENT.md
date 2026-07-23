# 🚀 Deployment Guide

Guía completa para desplegar Piums Platform en entornos staging y production.

## 📋 Tabla de Contenidos

- [Arquitectura de Despliegue](#arquitectura-de-despliegue)
- [Requisitos Previos](#requisitos-previos)
- [Configuración de GitHub](#configuración-de-github)
- [Configuración de Entornos](#configuración-de-entornos)
- [Despliegue a Staging](#despliegue-a-staging)
- [Despliegue a Production](#despliegue-a-production)
- [Rollback](#rollback)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura de Despliegue

### Componentes

- **Gateway (API Gateway)**: Puerto 3000 (2 réplicas en producción)
- **10 Microservicios**: Puertos 4001-4010
- **PostgreSQL**: Base de datos principal (múltiples schemas)
- **Redis**: Caché y colas de mensajes
- **GitHub Container Registry (ghcr.io)**: Registro de imágenes Docker

### Estrategia de Despliegue

- **Staging**: Despliegue automático al hacer push a `develop`
- **Production**: Blue-Green deployment con aprobación manual

---

## ✅ Requisitos Previos

### Servidor

- **OS**: Ubuntu 20.04+ / Debian 11+
- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **RAM**: Mínimo 8GB (16GB recomendado para producción)
- **CPU**: Mínimo 4 cores
- **Disco**: 50GB+ disponibles
- **Ports**: 80, 443, 3000-4010

### Herramientas Locales

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

---

## 🔐 Configuración de GitHub

### 1. Habilitar GitHub Container Registry

```bash
# Crear Personal Access Token (PAT)
# Settings → Developer settings → Personal access tokens → Tokens (classic)
# Permisos necesarios:
#   - write:packages
#   - read:packages
#   - delete:packages (opcional)
```

### 2. Configurar Secrets del Repositorio

En GitHub: **Settings → Secrets and variables → Actions → New repository secret**

#### Secrets Generales

```
POSTGRES_USER
POSTGRES_PASSWORD
REDIS_PASSWORD
JWT_SECRET
REFRESH_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
```

#### Secrets de Staging

```
STAGING_SERVER_HOST         # IP o dominio del servidor staging
STAGING_SERVER_USER         # Usuario SSH (ej: ubuntu)
STAGING_SSH_PRIVATE_KEY     # Llave SSH privada para conexión
STAGING_ENV_FILE            # Contenido completo del archivo .env de staging
STAGING_DATABASE_URL_PREFIX # postgresql://user:pass@host:port/
```

#### Secrets de Production

```
PRODUCTION_SERVER_HOST
PRODUCTION_SERVER_USER
PRODUCTION_SSH_PRIVATE_KEY
PRODUCTION_ENV_FILE
PRODUCTION_DATABASE_URL_PREFIX
```

### 3. Crear Environments en GitHub

**Settings → Environments**

#### Environment: `staging`

- **Deployment branches**: `develop`
- **Environment secrets**: Heredan de repository secrets

#### Environment: `production`

- **Deployment branches**: `main`
- **Required reviewers**: Agregar revisores obligatorios (2+ personas)
- **Wait timer**: 0 minutos (opcional: agregar delay)
- **Environment secrets**: Secrets específicos de producción

#### Environment: `production-blue`

- Para blue-green deployment
- Misma configuración que `production`

---

## 🔧 Configuración de Entornos

### Staging Server Setup

```bash
# Conectar al servidor staging
ssh user@staging.piums.com

# Crear directorios
sudo mkdir -p /opt/piums
sudo mkdir -p /backup/postgres
sudo chown -R $USER:$USER /opt/piums
sudo chown -R $USER:$USER /backup

# Configurar firewall
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Instalar Docker si no está instalado
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar nginx (reverse proxy)
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Configurar SSL con Let's Encrypt
sudo certbot --nginx -d staging.piums.com
```

### Production Server Setup (Blue-Green)

```bash
# Conectar al servidor production
ssh user@piums.com

# Crear directorios para blue y green
sudo mkdir -p /opt/piums-blue
sudo mkdir -p /opt/piums-green
sudo mkdir -p /backup/postgres
sudo chown -R $USER:$USER /opt/piums-*
sudo chown -R $USER:$USER /backup

# Configurar firewall (igual que staging)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar nginx
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# Configurar SSL
sudo certbot --nginx -d piums.com -d www.piums.com
```

### Nginx Configuration (Production Blue-Green)

```nginx
# /etc/nginx/sites-available/piums.conf

upstream piums_backend {
    # Default to green, scripts cambiará a blue durante deploy
    server localhost:3000;  # piums-green gateway
    # server localhost:3001;  # piums-blue gateway (comentado inicialmente)
}

server {
    listen 80;
    server_name piums.com www.piums.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name piums.com www.piums.com;

    ssl_certificate /etc/letsencrypt/live/piums.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/piums.com/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://piums_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        access_log off;
        proxy_pass http://piums_backend/health;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/piums.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🚢 Despliegue a Staging

### Despliegue Automático

El despliegue a staging es **automático** al hacer push a `develop`:

```bash
git checkout develop
git pull origin develop
git merge feature/your-feature
git push origin develop
```

Esto disparará el workflow `.github/workflows/deploy-staging.yml`:

1. ✅ Pre-deploy checks
2. 🗄️ Database migrations
3. 🚀 Deploy servicios
4. 🏥 Health checks
5. 🧪 Smoke tests
6. 📢 Notificación

### Despliegue Manual

Forzar despliegue manual de staging:

```bash
# Desde GitHub UI:
# Actions → Deploy to Staging → Run workflow
# Branch: develop
# Image tag: develop (o tag específico)
```

### Validación Post-Deploy

```bash
# Health check general
curl https://staging.piums.com/health

# Health checks de servicios
curl https://staging.piums.com/api/auth/health
curl https://staging.piums.com/api/users/health
curl https://staging.piums.com/api/artists/health
curl https://staging.piums.com/api/bookings/health
curl https://staging.piums.com/api/payments/health

# Logs en servidor
ssh user@staging.piums.com
cd /opt/piums
docker-compose logs -f --tail=100
```

---

## 🏭 Despliegue a Production

### Proceso de Release

1. **Crear Release Tag**

```bash
git checkout main
git pull origin main
git merge develop
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

2. **Crear GitHub Release**

- GitHub → Releases → Draft a new release
- Tag: `v1.0.0`
- Title: `Release v1.0.0`
- Description: Changelog
- Publish release

3. **Aprobación Manual**

El workflow `.github/workflows/deploy-prod.yml` requiere aprobación manual:

- GitHub → Actions → Deploy to Production
- Revisar cambios
- Approve deployment

### Flujo Blue-Green

El despliegue usa estrategia **blue-green** para zero-downtime:

```
┌──────────────────────────────────────────────┐
│ 1. Green está activo (versión actual)       │
│    Tráfico → Green Environment               │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ 2. Deploy a Blue (nueva versión)             │
│    Green activo, Blue desplegando            │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ 3. Health checks en Blue                     │
│    Validar que Blue funciona correctamente   │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ 4. Switch traffic a Blue                     │
│    Tráfico → Blue Environment                │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ 5. Monitoreo (5 minutos)                     │
│    Verificar estabilidad                     │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ 6. Cleanup Green                             │
│    Detener versión antigua                   │
└──────────────────────────────────────────────┘
```

### Validación Post-Deploy

```bash
# Health checks
curl https://piums.com/health
curl https://piums.com/api/auth/health

# Verificar versión desplegada
curl https://piums.com/version

# Monitorear logs
ssh user@piums.com
cd /opt/piums-blue
docker-compose logs -f --tail=100

# Métricas de rendimiento
docker stats
```

---

## ⏮️ Rollback

### Rollback Automático

Si las health checks o smoke tests fallan, el rollback es **automático**:

- Revierte tráfico a Green (versión anterior)
- Detiene Blue environment
- Envía notificación de fallo

### Rollback Manual

Si se detecta un problema después del deploy:

```bash
# Conectar al servidor
ssh user@piums.com

# Cambiar nginx a green
sudo sed -i 's/piums-blue/piums-green/g' /etc/nginx/sites-enabled/piums.conf
sudo nginx -t && sudo systemctl reload nginx

# Verificar que green está corriendo
cd /opt/piums-green
docker-compose ps

# Si no está corriendo, levantar
docker-compose up -d

# Detener blue
cd /opt/piums-blue
docker-compose down
```

### Rollback de Base de Datos

```bash
# Conectar al servidor
ssh user@piums.com

# Listar backups disponibles
ls -lh /backup/postgres/

# Restaurar backup específico
BACKUP_DATE=20240115_143000
docker exec -i piums-postgres-prod psql -U piums < /backup/postgres/$BACKUP_DATE/all_databases.sql

# Reiniciar servicios
cd /opt/piums-blue  # o green, según corresponda
docker-compose restart
```

---

## 🔍 Troubleshooting

### Problema: Servicio no inicia

```bash
# Ver logs del servicio
docker-compose logs service-name

# Verificar variables de entorno
docker-compose config

# Verificar conectividad a DB
docker exec service-name nc -zv postgres 5432

# Reiniciar servicio específico
docker-compose restart service-name
```

### Problema: Base de datos no conecta

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Probar conexión manual
docker exec -it piums-postgres-prod psql -U piums

# Verificar DATABASE_URL en servicio
docker-compose exec service-name env | grep DATABASE_URL
```

### Problema: Redis no conecta

```bash
# Verificar Redis
docker-compose ps redis

# Test conexión
docker exec -it piums-redis-prod redis-cli -a $REDIS_PASSWORD
> PING
PONG

# Ver logs
docker-compose logs redis
```

### Problema: Gateway devuelve 502

```bash
# Verificar estado de todos los servicios
docker-compose ps

# Ver logs del gateway
docker-compose logs gateway

# Verificar conectividad entre servicios
docker-compose exec gateway nc -zv auth-service 4001
docker-compose exec gateway nc -zv users-service 4002
```

### Problema: Espacio en disco lleno

```bash
# Ver uso de disco
df -h

# Limpiar imágenes Docker no usadas
docker image prune -a -f

# Limpiar contenedores detenidos
docker container prune -f

# Limpiar volúmenes no usados
docker volume prune -f

# Limpiar todo (¡CUIDADO!)
docker system prune -a --volumes -f
```

### Problema: Memory issues

```bash
# Ver uso de memoria por contenedor
docker stats --no-stream

# Reducir workers/conexiones en servicios
# Editar docker-compose.yml:
# environment:
#   - NODE_OPTIONS=--max-old-space-size=256

# Reiniciar con nuevos límites
docker-compose down
docker-compose up -d
```

---

## 📊 Monitoreo

### Health Checks

Todos los servicios exponen endpoint `/health`:

```bash
# Script de monitoreo
#!/bin/bash
SERVICES=(auth users artists catalog bookings payments reviews notifications search chat)

for service in "${SERVICES[@]}"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://piums.com/api/$service/health)
  if [ $STATUS -eq 200 ]; then
    echo "✅ $service: OK"
  else
    echo "❌ $service: ERROR (HTTP $STATUS)"
  fi
done
```

### Logs Centralizados

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Logs de servicio específico
docker-compose logs -f auth-service

# Logs con timestamp
docker-compose logs -f -t

# Últimas 100 líneas
docker-compose logs --tail=100
```

### Métricas

```bash
# CPU y memoria en tiempo real
docker stats

# Espacio en disco
df -h
du -sh /opt/piums-blue/*
du -sh /opt/piums-green/*

# Conexiones a base de datos
docker exec piums-postgres-prod psql -U piums -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## 🔒 Seguridad

### Checklist de Seguridad

- [ ] Cambiar todas las contraseñas de `.env.production.example`
- [ ] Usar secretos de GitHub, nunca commitear `.env` files
- [ ] Habilitar firewall en servidor (ufw)
- [ ] Configurar SSL/TLS con Let's Encrypt
- [ ] Limitar acceso SSH (key-based authentication only)
- [ ] Configurar rate limiting en nginx
- [ ] Habilitar backups automáticos de DB
- [ ] Configurar alertas de monitoreo
- [ ] Review de security scan results de Trivy
- [ ] Actualizar dependencias regularmente

### Rotación de Secrets

```bash
# 1. Generar nuevo secret
openssl rand -base64 32

# 2. Actualizar en GitHub Secrets
# Settings → Secrets → Edit

# 3. Redeploy servicios
git tag -a v1.0.1 -m "Security: Rotate secrets"
git push --tags
```

---

## 📚 Referencias

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 📞 Soporte

Para problemas o preguntas:

- **GitHub Issues**: https://github.com/app-piums/piums-platform/issues
- **Team**: devops@piums.com
