# 🚢 Deployment Guide - Piums Platform

> Guía completa de despliegue para arquitectura multi-app

**Última actualización**: 9 de marzo de 2026  
**Versión**: 2.0 (Post App Separation)

## 📋 Tabla de Contenidos

- [Arquitectura de Deployment](#arquitectura-de-deployment)
- [Requisitos Previos](#requisitos-previos)
- [Variables de Entorno](#variables-de-entorno)
- [Deployment Local (Docker)](#deployment-local-docker)
- [Deployment Staging](#deployment-staging)
- [Deployment Production](#deployment-production)
- [Configuración DNS](#configuración-dns)
- [SSL/TLS Certificates](#ssltls-certificates)
- [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura de Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer                            │
│                    (nginx / Cloud LB)                            │
└─────────────────────────────────────────────────────────────────┘
           │                  │                  │
           │ piums.com        │ artist.piums.com │ api.piums.com
           ▼                  ▼                  ▼
    ┌──────────┐      ┌──────────┐      ┌──────────┐
    │web-client│      │web-artist│      │ gateway  │
    │ :3000    │      │ :3001    │      │ :3000    │
    └──────────┘      └──────────┘      └──────────┘
                                               │
                    ┌──────────────────────────┼───────────────┐
                    ▼              ▼           ▼              ▼
            ┌──────────┐   ┌──────────┐ ┌──────────┐  ┌──────────┐
            │   Auth   │   │  Users   │ │ Artists  │  │ Booking  │
            │ Service  │   │ Service  │ │ Service  │  │ Service  │
            └──────────┘   └──────────┘ └──────────┘  └──────────┘
                    │              │           │              │
                    └──────────────┼───────────┴──────────────┘
                                   ▼
                         ┌──────────────────┐
                         │    PostgreSQL    │
                         │      Redis       │
                         └──────────────────┘
```

## ✅ Requisitos Previos

### Software

- **Docker**: 24.x o superior
- **Docker Compose**: 2.20 o superior
- **Node.js**: 20.x (para builds locales)
- **pnpm**: 8.x (para builds locales)
- **Git**: 2.x

### Infraestructura

- **Servidor**: Ubuntu 22.04 LTS (mínimo)
- **RAM**: 8GB mínimo, 16GB recomendado
- **CPU**: 4 cores mínimo
- **Disco**: 50GB mínimo (SSD recomendado)
- **Puertos abiertos**: 80, 443, 22 (SSH)

### Servicios Externos

- **DNS**: Dominio configurado (piums.com, artist.piums.com)
- **SSL**: Certificados Let's Encrypt o similar
- **SMTP**: Servicio de email (SendGrid, AWS SES)
- **Storage**: Cloudinary o similar
- **Payments**: Stripe account

---

## 🔐 Variables de Entorno

### Archivo `.env` de Producción

Crear archivo `.env.prod` en `/opt/piums/.env`:

```env
# ==============================================================================
# PRODUCTION ENVIRONMENT VARIABLES
# ==============================================================================

# General
NODE_ENV=production
APP_ENV=production

# Domains
CLIENT_APP_URL=https://piums.com
ARTIST_APP_URL=https://artist.piums.com
ADMIN_APP_URL=https://admin.piums.com
API_URL=https://api.piums.com

# JWT Secrets (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=your_production_jwt_secret_here_VERY_LONG_AND_RANDOM
REFRESH_SECRET=your_production_refresh_secret_VERY_LONG_AND_RANDOM

# Database
POSTGRES_USER=piums_prod
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=piums_production
DATABASE_URL=postgresql://piums_prod:password@postgres:5432/piums_production

# Redis
REDIS_PASSWORD=your_redis_password_here
REDIS_URL=redis://:password@redis:6379

# CORS
ALLOWED_ORIGINS=https://piums.com,https://artist.piums.com,https://admin.piums.com

# External Services
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

SENDGRID_API_KEY=SG.your_sendgrid_api_key
EMAIL_FROM=noreply@piums.com

# Docker Registry
DOCKER_REGISTRY=ghcr.io/app-piums
IMAGE_TAG=latest
```

### Generar Secrets Seguros

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Refresh Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🐳 Deployment Local (Docker)

### 1. Build Images Localmente

```bash
# Build todas las imágenes
docker-compose -f infra/docker/docker-compose.dev.yml build

# Build solo web apps
docker build -t piums-web-client ./apps/web-client/web
docker build -t piums-web-artist ./apps/web-artist/web
```

### 2. Iniciar Servicios

```bash
# Iniciar todo el stack
docker-compose -f infra/docker/docker-compose.dev.yml up -d

# Ver logs
docker-compose -f infra/docker/docker-compose.dev.yml logs -f

# Ver solo logs de web apps
docker-compose logs -f web-client web-artist
```

### 3. Verificar Health

```bash
# Gateway
curl http://localhost:3000/health

# Web Client
curl http://localhost:3000/

# Web Artist
curl http://localhost:3001/

# Auth Service
curl http://localhost:4001/health
```

---

## 🚀 Deployment Staging

### Proceso Automatizado (GitHub Actions)

El deployment a staging se activa automáticamente al hacer push a `develop`:

```bash
git checkout develop
git merge feature/your-feature
git push origin develop
```

Workflow `.github/workflows/deploy-staging.yml` ejecutará:

1. ✅ Build de imágenes Docker
2. ✅ Push a GitHub Container Registry
3. ✅ Migración de base de datos
4. ✅ Deploy a servidor staging
5. ✅ Smoke tests
6. ✅ Rollback automático si falla

### Proceso Manual

```bash
# 1. SSH al servidor de staging
ssh user@staging.piums.com

# 2. Navegar al directorio
cd /opt/piums

# 3. Pull últimas imágenes
docker-compose pull

# 4. Reiniciar servicios
docker-compose up -d

# 5. Verificar
docker-compose ps
curl https://staging.piums.com/health
```

---

## 🌐 Deployment Production

### Estrategia Blue-Green

Production usa **blue-green deployment** para zero-downtime:

```
┌──────────┐              ┌──────────┐
│  Blue    │  ◄──Live──   │  Green   │
│ (Current)│              │  (New)   │
└──────────┘              └──────────┘
     │                         │
     └─────Switch Traffic──────┘
```

### Proceso Automatizado

```bash
# 1. Tag release
git tag -a v1.2.3 -m "Release 1.2.3"
git push origin v1.2.3

# 2. Workflow se activa automáticamente
# - Build de imágenes con tag
# - Deploy a green environment
# - Smoke tests
# - Switch traffic (blue → green)
# - Cleanup old blue
```

### Proceso Manual (Emergency)

```bash
# 1. SSH al servidor de producción
ssh user@piums.com

# 2. Pull tag específico
cd /opt/piums-green
docker-compose pull

# 3. Iniciar green environment
docker-compose up -d

# 4. Health check
./scripts/health-check.sh https://green.piums.com

# 5. Switch nginx config
sudo cp /etc/nginx/sites-available/piums-green.conf \
        /etc/nginx/sites-enabled/piums.conf
sudo nginx -s reload

# 6. Monitorear por 5 minutos
watch -n 5 'docker-compose ps && curl -s https://piums.com/health'

# 7. Limpiar blue environment
cd /opt/piums-blue
docker-compose down
```

---

## 🌍 Configuración DNS

### Records Requeridos

```dns
# A Records
piums.com.           A    YOUR_SERVER_IP
www.piums.com.       A    YOUR_SERVER_IP
artist.piums.com.    A    YOUR_SERVER_IP
admin.piums.com.     A    YOUR_SERVER_IP
api.piums.com.       CNAME piums.com.

# Staging
staging.piums.com.          A    STAGING_SERVER_IP
artist-staging.piums.com.   A    STAGING_SERVER_IP

# MX Records (Email)
piums.com.           MX 10 mail.piums.com.
```

### Verificación

```bash
# Verificar DNS propagación
dig piums.com +short
dig artist.piums.com +short
dig api.piums.com +short

# Test desde diferentes locaciones
https://www.whatsmydns.net/
```

---

## 🔒 SSL/TLS Certificates

### Let's Encrypt con Certbot

```bash
# 1. Instalar certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 2. Obtener certificados
sudo certbot --nginx -d piums.com -d www.piums.com
sudo certbot --nginx -d artist.piums.com
sudo certbot --nginx -d api.piums.com

# 3. Autorenovación (cron)
sudo certbot renew --dry-run

# 4. Configurar auto-renewal
sudo crontab -e
0 3 * * * certbot renew --quiet --post-hook "nginx -s reload"
```

### Verificar Certificados

```bash
# Check expiration
sudo certbot certificates

# Test SSL configuration
https://www.ssllabs.com/ssltest/analyze.html?d=piums.com
```

---

## 🐛 Troubleshooting

### Problema: Aplicaciones no cargan

```bash
# 1. Verificar contenedores
docker ps -a | grep piums

# 2. Ver logs
docker logs piums-web-client
docker logs piums-web-artist
docker logs piums-gateway

# 3. Verificar red
docker network inspect piums-network

# 4. Verificar conectividad
docker exec -it piums-web-client ping gateway
```

### Problema: CORS Errors

```bash
# 1. Verificar configuración de gateway
docker exec -it piums-gateway cat /app/.env | grep ALLOWED_ORIGINS

# 2. Verificar nginx headers
curl -I https://api.piums.com/health

# 3. Actualizar ALLOWED_ORIGINS
# Editar .env y reiniciar gateway
docker-compose restart gateway
```

### Problema: Database Migration Failed

```bash
# 1. Conectar a PostgreSQL
docker exec -it piums-postgres psql -U piums_prod -d piums_production

# 2. Ver migraciones aplicadas
\dt _prisma_migrations

# 3. Aplicar migración manualmente
cd services/auth-service
pnpm prisma migrate deploy
```

### Problema: Redirect Loops

```bash
# 1. Limpiar cookies
# Browser DevTools → Application → Cookies → Clear

# 2. Verificar middleware
# Revisar apps/web-client/web/src/middleware.ts
# Revisar apps/web-artist/web/src/middleware.ts

# 3. Verificar auth service redirect_url
curl -X POST https://api.piums.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' | jq .redirectUrl
```

---

## 📊 Monitoring

### Health Checks

```bash
# Script de health check completo
./scripts/production-health-check.sh

# Output esperado:
# ✅ Gateway: OK
# ✅ Web Client: OK
# ✅ Web Artist: OK
# ✅ Auth Service: OK
# ✅ Database: OK
# ✅ Redis: OK
```

### Logs Centralizados

```bash
# Ver logs en tiempo real
docker-compose logs -f --tail=100

# Buscar errores
docker-compose logs | grep -i error

# Logs de app específica
docker logs -f piums-web-client 2>&1 | grep -v "GET /_next"
```

---

## 🔄 Rollback

### Rollback Rápido (Production)

```bash
# 1. Switch back to blue
cd /opt/piums-blue
docker-compose up -d

# 2. Update nginx
sudo cp /etc/nginx/sites-available/piums-blue.conf \
        /etc/nginx/sites-enabled/piums.conf
sudo nginx -s reload

# 3. Ver if blue environment está healthy
curl https://piums.com/health
```

### Rollback a Tag Específico

```bash
# 1. Pull imagen del tag anterior
export IMAGE_TAG=v1.2.2
docker-compose pull

# 2. Reiniciar servicios
docker-compose up -d

# 3. Verificar
docker ps | grep v1.2.2
```

---

## 📚 Referencias

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Reverse Proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Let's Encrypt](https://letsencrypt.org/docs/)
- [ADR-0003: App Separation](./architecture/decisions/adr-0003-app-separation.md)

---

**Última revisión**: 9 de marzo de 2026  
**Próxima revisión**: 9 de abril de 2026
