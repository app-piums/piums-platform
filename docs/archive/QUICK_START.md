# 🚀 Quick Start - Piums Platform

**Fecha**: 23 de febrero de 2026  
**Estado**: ✅ Stack Crítico Completo

---

## 🎉 ¡Buenas Noticias!

Todos los componentes críticos del sistema están implementados:
- ✅ auth-service schema (267 líneas)
- ✅ API Gateway completo
- ✅ docker-compose.dev.yml (305 líneas)
- ✅ scripts/dev.sh (352 líneas)

**Puedes levantar el stack completo con un solo comando.**

---

## 🏃 Inicio Rápido (3 comandos)

```bash
# 1. Setup inicial (solo primera vez)
./scripts/dev.sh setup

# 2. Levantar todo el stack
./scripts/dev.sh start

# 3. Verificar que todo funciona
./scripts/dev.sh health
```

**Tiempo estimado**: 5-10 minutos en primera ejecución.

---

## 📡 Endpoints Disponibles

Una vez levantado el sistema, tendrás acceso a:

### Gateway (Punto de entrada único)
- **URL**: http://localhost:3000
- **Health**: http://localhost:3000/api/health
- **Docs**: http://localhost:3000

### Microservicios (expuestos individualmente)
- **Auth Service**: http://localhost:4001
- **Users Service**: http://localhost:4002
- **Artists Service**: http://localhost:4003
- **Catalog Service**: http://localhost:4004
- **Payments Service**: http://localhost:4005
- **Reviews Service**: http://localhost:4006
- **Notifications Service**: http://localhost:4007
- **Booking Service**: http://localhost:4008
- **Search Service**: http://localhost:4009

### Bases de Datos
- **PostgreSQL**: localhost:5432 (user: `piums`, password: `piums_dev_password`)
- **Redis**: localhost:6379

---

## 🧪 Probar el Sistema

### 1. Health Check Completo
```bash
./scripts/dev.sh health
```

### 2. Ver Logs de Todos los Servicios
```bash
./scripts/dev.sh logs
```

### 3. Ver Estado de Contenedores
```bash
./scripts/dev.sh status
```

### 4. Probar Endpoint del Gateway
```bash
curl http://localhost:3000/api/health
```

### 5. Probar Auth Service Directamente
```bash
curl http://localhost:4001/health
```

### 6. Probar Registro de Usuario (a través del Gateway)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@piums.com",
    "password": "Test1234!",
    "nombre": "Usuario Test"
  }'
```

### 7. Probar Login (a través del Gateway)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@piums.com",
    "password": "Test1234!"
  }'
```

---

## 🛠️ Comandos Útiles

### Desarrollo
```bash
# Iniciar todo con Docker
./scripts/dev.sh start

# Iniciar localmente (sin Docker)
./scripts/dev.sh start-local

# Reiniciar servicios
./scripts/dev.sh restart

# Ver ayuda completa
./scripts/dev.sh help
```

### Debugging
```bash
# Ver logs en tiempo real
./scripts/dev.sh logs

# Ver logs de un servicio específico
cd infra/docker
docker-compose -f docker-compose.dev.yml logs -f auth-service

# Entrar a un contenedor
docker exec -it piums-auth-service sh
```

### Limpieza
```bash
# Detener servicios
./scripts/dev.sh stop

# Limpieza completa (incluyendo volúmenes y node_modules)
./scripts/dev.sh clean
```

---

## 🔍 Troubleshooting

### Problema: "Puerto ya en uso"
```bash
# Ver qué está usando el puerto 3000
lsof -i :3000

# Matar el proceso
kill -9 <PID>
```

### Problema: "Docker no responde"
```bash
# Reiniciar Docker Desktop
# Mac: Cmd+Q Docker Desktop, luego abrir de nuevo

# O desde terminal
docker system prune -a  # ⚠️ Elimina todo
```

### Problema: "Base de datos no conecta"
```bash
# Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Reiniciar solo PostgreSQL
cd infra/docker
docker-compose -f docker-compose.dev.yml restart postgres
```

### Problema: "Prisma no genera types"
```bash
# Regenerar Prisma Client en cada servicio
cd services/auth-service
npx prisma generate

cd ../users-service
npx prisma generate
# ... repetir para cada servicio
```

---

## 📊 Verificación de Servicios

### Script de Verificación Automática
```bash
#!/bin/bash
# Guardar como verify-stack.sh

echo "🔍 Verificando stack Piums..."

services=(
  "http://localhost:3000/api/health:Gateway"
  "http://localhost:4001/health:Auth"
  "http://localhost:4002/health:Users"
  "http://localhost:4003/health:Artists"
  "http://localhost:4004/health:Catalog"
  "http://localhost:4005/health:Payments"
  "http://localhost:4006/health:Reviews"
  "http://localhost:4007/health:Notifications"
  "http://localhost:4008/health:Booking"
  "http://localhost:4009/health:Search"
)

for service in "${services[@]}"; do
  url="${service%%:*}"
  name="${service##*:}"
  
  if curl -s "$url" > /dev/null; then
    echo "✅ $name"
  else
    echo "❌ $name"
  fi
done
```

---

## 🎯 Próximos Pasos

Una vez que verifiques que el stack funciona correctamente:

1. **Empezar desarrollo web** (`apps/web/`)
   - Implementar páginas faltantes (dashboard, artists, search, etc.)
   - Integrar con API Gateway
   - Crear componentes reutilizables

2. **Crear UI package** (`packages/ui/`)
   - Design system
   - Componentes base
   - Tokens de diseño

3. **Implementar shared-utils** (`packages/shared-utils/`)
   - Utilities comunes
   - Validators
   - Helpers

4. **Generar documentación API** (`docs/api-contracts/openapi.yaml`)
   - OpenAPI specs
   - Swagger UI

---

## 📚 Recursos

- **Documentación completa**: `docs/IMPLEMENTACIONES_RESUMEN.md`
- **Estado del proyecto**: `docs/ESTADO_PROYECTO_CHECKLIST.md`
- **Arquitectura**: `docs/architecture/`
- **Features implementadas**: `docs/features-er-model-complete.md`

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa logs: `./scripts/dev.sh logs`
2. Verifica estado: `./scripts/dev.sh status`
3. Reinicia servicios: `./scripts/dev.sh restart`
4. En último caso: `./scripts/dev.sh clean && ./scripts/dev.sh setup && ./scripts/dev.sh start`

---

**¡Feliz desarrollo! 🚀**
