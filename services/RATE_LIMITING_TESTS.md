# 🧪 Tests de Rate Limiting - Piums Platform

Este directorio contiene scripts para probar el sistema de rate limiting implementado en los diferentes servicios.

## 📋 Scripts Disponibles

### 1. `test-rate-limiting.sh`
Script principal que ejecuta pruebas de rate limiting en diferentes servicios.

**Requisito**: Los servicios deben estar corriendo.

**Tests incluidos**:
- ✅ Auth Service - Login limiter (5 intentos / 15 min)
- ✅ Auth Service - Register limiter (3 intentos / hora)
- ✅ API General limiter (100 requests / 15 min)
- ✅ Users Service - Update limiter (10 / hora)
- ✅ Booking Service - Create limiter (10 / hora)
- ✅ Verificación de headers de rate limiting

### 2. `start-test-services.sh`
Inicia los servicios necesarios para ejecutar los tests.

**Servicios que inicia**:
- auth-service (puerto 3001)
- users-service (puerto 3002)
- booking-service (puerto 3006)

### 3. `stop-test-services.sh`
Detiene todos los servicios iniciados por `start-test-services.sh`.

## 🚀 Uso Rápido

```bash
# 1. Iniciar servicios de testing
cd /Users/piums/Desktop/piums-platform
./services/start-test-services.sh

# 2. Ejecutar tests de rate limiting
./services/test-rate-limiting.sh

# 3. Detener servicios
./services/stop-test-services.sh
```

## 📊 Rate Limits Configurados

### Auth Service
| Endpoint | Límite | Ventana |
|----------|---------|---------|
| POST /api/auth/login | 5 intentos | 15 minutos |
| POST /api/auth/register | 3 intentos | 1 hora |
| General API | 100 requests | 15 minutos |

### Users Service
| Endpoint | Límite | Ventana |
|----------|---------|---------|
| PUT /api/users/:id | 10 updates | 1 hora |
| DELETE /api/users/:id | 5 deletes | 1 día |
| General API | 100 requests | 15 minutos |

### Booking Service
| Endpoint | Límite | Ventana |
|----------|---------|---------|
| POST /api/bookings | 10 bookings | 1 hora |
| PUT /api/bookings/:id | 20 updates | 1 hora |
| GET /api/availability | 30 checks | 15 minutos |
| General API | 100 requests | 15 minutos |

### Artists Service
| Endpoint | Límite | Ventana |
|----------|---------|---------|
| POST /api/artists | 3 creates | 1 hora |
| PUT /api/artists/:id | 10 updates | 1 hora |
| GET /api/artists/search | 50 searches | 15 minutos |
| General API | 100 requests | 15 minutos |

### Reviews Service
| Endpoint | Límite | Ventana |
|----------|---------|---------|
| POST /api/reviews | 5 reviews | 1 hora |
| POST /api/reviews/:id/response | 20 responses | 1 hora |
| POST /api/reviews/:id/helpful | 50 reactions | 1 hora |
| POST /api/reviews/:id/report | 10 reports | 1 día |
| General API | 100 requests | 15 minutos |

## ⚠️ Consideraciones

1. **Bloqueo temporal**: Los tests pueden dejar tu IP temporalmente bloqueada en algunos endpoints. Es normal y el bloqueo se levanta automáticamente.

2. **Producción vs Desarrollo**: Los límites mostrados son para desarrollo. En producción pueden ser diferentes.

3. **Redis**: Para rate limiting distribuido entre múltiples instancias, se recomienda usar Redis como store.

4. **Headers estándar**: Los servicios devuelven headers standard de rate limiting:
   - `RateLimit-Limit`: Límite máximo
   - `RateLimit-Remaining`: Requests restantes
   - `RateLimit-Reset`: Timestamp de reseteo

## 🔍 Verificar Logs

Si algún servicio falla al iniciar, revisa los logs:

```bash
# Ver logs de auth-service
tail -f /tmp/auth-service.log

# Ver logs de users-service
tail -f /tmp/users-service.log

# Ver logs de booking-service
tail -f /tmp/booking-service.log
```

## 🛠️ Troubleshooting

### Error: "Algunos servicios no están disponibles"
**Solución**: Ejecuta `start-test-services.sh` primero para iniciar los servicios.

### Error: "Cannot find module"
**Solución**: Instala las dependencias en cada servicio:
```bash
cd services/auth-service && pnpm install
cd ../users-service && pnpm install
cd ../booking-service && pnpm install
```

### Error: "Port already in use"
**Solución**: Detén los servicios que estén corriendo:
```bash
./services/stop-test-services.sh
# O manualmente:
lsof -ti:3001 | xargs kill
lsof -ti:3002 | xargs kill
lsof -ti:3006 | xargs kill
```

## 📝 Notas de Implementación

El rate limiting está implementado usando `express-rate-limit` con las siguientes características:

- **Strategy**: Ventana deslizante (sliding window)
- **Store**: En memoria (para desarrollo) / Redis (para producción)
- **Headers**: Standard headers incluidos
- **Skip**: Ciertos endpoints (health checks) pueden estar exentos

## 🎯 Próximos Pasos

- [ ] Implementar Redis store para rate limiting distribuido
- [ ] Agregar whitelist de IPs para servicios internos
- [ ] Implementar rate limiting por usuario (además de por IP)
- [ ] Agregar métricas de rate limiting a monitoring
