# Solución de Problemas — Piums Platform

## Problemas comunes de desarrollo

### `pnpm install` falla

```
Error: pnpm: command not found
```
**Solución**: `npm install -g pnpm@8`

---

### Servicios no inician con `./scripts/dev.sh start`

**Verificar**:
```bash
# Estado de contenedores
docker ps -a | grep piums

# Logs específicos
docker logs piums-gateway --tail=50
docker logs piums-postgres --tail=50

# Puertos en uso
lsof -i :3000  # gateway
lsof -i :5432  # postgres
lsof -i :6379  # redis
```

**Causas frecuentes**:
- Puerto ocupado → matar proceso con `kill -9 <PID>` o cambiar puerto en `.env`
- Docker no tiene suficiente memoria → aumentar en Docker Desktop (≥4GB)
- Variables de entorno faltantes → copiar `.env.example` correspondiente

---

### Error de conexión a base de datos

```
PrismaClientInitializationError: Can't reach database server
```

**Solución**:
```bash
# Verificar que postgres está corriendo
docker ps | grep piums-postgres

# Verificar conexión
psql postgres://piums:piums_dev_password@localhost:5432/piums_dev -c "SELECT 1"

# Si no existe la DB, recrear
./scripts/dev.sh clean
./scripts/dev.sh start
```

---

### Migraciones Prisma fallan

```
Error: P3009 migrate found failed migration
```

**Solución**:
```bash
cd services/<servicio>-service
npx prisma migrate resolve --rolled-back <migration_name>
npx prisma migrate dev
```

---

### Error de TypeScript en build

```
error TS2307: Cannot find module '@piums/shared-types'
```

**Solución**: Los packages compartidos deben compilarse primero:
```bash
pnpm --filter @piums/shared-types build
pnpm --filter @piums/shared-utils build
pnpm --filter @piums/shared-config build
pnpm --filter @piums/ui build
```

---

### Frontend no conecta con la API

**Síntoma**: Errores CORS o `ERR_CONNECTION_REFUSED` en el browser.

**Verificar**:
```bash
# ¿El gateway está corriendo?
curl http://localhost:3000/health

# CORS: verificar ALLOWED_ORIGINS en gateway/.env
# Debe incluir http://localhost:3001 y http://localhost:3002
```

---

### Socket.io no conecta (chat)

**Síntoma**: El chat no recibe mensajes en tiempo real.

**Checklist**:
1. `chat-service` corriendo en puerto 4010
2. `CHAT_SERVICE_URL` en `gateway/.env` apunta a `http://localhost:4010`
3. En el frontend, `NEXT_PUBLIC_CHAT_URL` = `http://localhost:4010`
4. Verificar que el gateway tiene proxy WebSocket configurado

---

### `./scripts/seed.sh` falla

```bash
# Limpiar y re-seedear
./scripts/dev.sh clean
./scripts/dev.sh start
sleep 10  # esperar que DB esté lista
./scripts/seed.sh
```

---

## Problemas en staging/producción

### Pod en estado `CrashLoopBackOff`

```bash
# Ver logs del pod
kubectl logs <pod-name> -n piums --previous

# Describir para ver eventos
kubectl describe pod <pod-name> -n piums
```

**Causas comunes**:
- Secret faltante → verificar `kubectl get secret piums-secrets -n piums`
- Imagen no existe → verificar tag en `kubectl get deployment -n piums`
- Out of memory → aumentar `resources.limits.memory` en deployment

---

### Migración de DB fallida en producción

```bash
# 1. NO hacer rollout todavía
# 2. Ver qué migración falló
kubectl logs job/db-migrate -n piums

# 3. Restaurar backup si es necesario
./scripts/restore.sh production <backup_file>

# 4. Corregir migración y re-deploy
```

---

### Alto uso de CPU/memoria

```bash
# Ver consumo por pod
kubectl top pods -n piums

# Ver consumo por nodo
kubectl top nodes

# Escalar manualmente si HPA no reacciona
kubectl scale deployment/search-service --replicas=5 -n piums
```

---

## Logs

```bash
# Desarrollo (Docker)
docker logs -f piums-<servicio>

# Kubernetes
kubectl logs -f deployment/<servicio> -n piums
kubectl logs -f deployment/<servicio> -n piums --since=1h

# Todos los pods del namespace
kubectl logs -l app.kubernetes.io/part-of=piums-platform -n piums --since=30m
```

## Health Checks

```bash
# Verificar todos los servicios localmente
./scripts/health-check.sh

# Kubernetes
kubectl get pods -n piums
kubectl get events -n piums --sort-by='.lastTimestamp' | tail -20
```
