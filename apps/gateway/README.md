# 🚪 Piums API Gateway

API Gateway centralizado para la plataforma Piums. Actúa como punto de entrada único para todos los microservicios.

## 🎯 Funcionalidades

- **Proxy centralizado**: Enruta requests a los microservicios correspondientes
- **Autenticación**: Middleware de JWT para proteger rutas
- **Rate Limiting**: Limitación de requests global y por IP
- **CORS**: Configuración centralizada de CORS
- **Logging**: Logs centralizados de todas las requests
- **Health Checks**: Monitoreo del estado de todos los servicios
- **Error Handling**: Manejo consistente de errores
- **Security**: Headers de seguridad con Helmet

## 🏗️ Arquitectura

```
┌─────────────┐
│   Frontend  │
│  (Web/App)  │
└──────┬──────┘
       │
       │ HTTP/HTTPS
       │
┌──────▼──────────────────┐
│    API GATEWAY          │
│   (Port 3000)           │
│                         │
│  - Authentication       │
│  - Rate Limiting        │
│  - Routing              │
│  - Logging              │
└────┬────────────────────┘
     │
     ├─► auth-service (4001)
     ├─► users-service (4002)
     ├─► artists-service (4003)
     ├─► catalog-service (4004)
     ├─► payments-service (4005)
     ├─► reviews-service (4006)
     ├─► notifications-service (4007)
     ├─► booking-service (4008)
     └─► search-service (4009)
```

## 🚀 Uso

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📋 Rutas

### Públicas (sin autenticación)
- `POST /api/auth/login` → auth-service
- `POST /api/auth/register` → auth-service
- `GET /api/health` → health checks
- `GET /api/artists` → artists-service (búsqueda pública)

### Protegidas (requieren JWT)
- `GET /api/users/me` → users-service
- `POST /api/bookings` → booking-service
- `GET /api/bookings/:id` → booking-service
- Todas las rutas de gestión de usuario

## 🔐 Autenticación

El gateway valida JWT tokens en el header `Authorization: Bearer <token>` antes de proxy requests a servicios protegidos.

## ⚡ Rate Limiting

- **Global**: 100 requests / 15 minutos por IP
- **Auth endpoints**: Límites más estrictos (ver configuración)

## 🏥 Health Checks

`GET /api/health` retorna el estado de todos los microservicios:

```json
{
  "status": "healthy",
  "timestamp": "2026-02-23T...",
  "services": {
    "auth": { "status": "up", "latency": "23ms" },
    "users": { "status": "up", "latency": "18ms" },
    ...
  }
}
```

## 🛠️ Configuración

Ver `.env.example` para todas las variables de entorno disponibles.

## 📝 Logs

Los logs se almacenan en:
- **Console**: Desarrollo (colorizado)
- **Files**: Producción (JSON structured)

Formato:
```
[2026-02-23 15:30:45] INFO [GATEWAY] GET /api/users/me 200 45ms
```
