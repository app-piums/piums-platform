# Frontend Integration

## Resumen

Integración completa del frontend Next.js con los microservicios backend corriendo en Docker.

## Configuración

### Variables de Entorno

El frontend utiliza las siguientes variables de entorno (ver `.env.local`):

```env
# API Configuration
# Durante desarrollo, llamamos directamente a los servicios
# En producción, esto apuntará al gateway
NEXT_PUBLIC_API_URL=http://localhost:4003
AUTH_SERVICE_URL=http://localhost:4001

# Application Settings
NEXT_PUBLIC_APP_NAME=Piums
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

### Arquitectura de Integración

#### Desarrollo Local

```
Frontend (localhost:3001)
    ↓ API Routes (/api/auth/*)
    ↓ Next.js API Routes
    ↓ fetch to AUTH_SERVICE_URL
    ↓
Auth Service (localhost:4001)
```

#### Producción (Futuro)

```
Frontend
    ↓
Gateway (puerto 3000)
    ↓ Proxy /api/auth/* → /auth/*
    ↓
Auth Service (puerto 4001)
```

## Servicios Integrados

### ✅ Auth Service (puerto 4001)

**Endpoints disponibles:**

- `POST /auth/register` - Registro de usuarios
- `POST /auth/login` - Inicio de sesión  
- `POST /auth/refresh` - Renovar token
- `POST /auth/verify` - Verificar token

**Flujo de Autenticación:**

1. Usuario completa formulario de registro/login
2. Frontend Next.js envía request a `/api/auth/register` o `/api/auth/login`
3. API Route de Next.js hace proxy al auth-service en Docker
4. Auth-service valida credenciales y retorna JWT + refreshToken
5. Frontend almacena tokens en localStorage y cookies
6. Usuario es redirigido al dashboard

### 🔄 Artists Service (puerto 4003)

**SDK disponible:** `@piums/sdk`

```typescript
import { sdk } from '@piums/sdk';

// Buscar artistas
const results = await sdk.searchArtists({
  query: 'fotógrafos',
  ciudad: 'Bogotá',
  page: 1,
  limit: 10
});

// Obtener lista de artistas
const artists = await sdk.getArtists({
  categoria: 'fotografía',
  page: 1,
  limit: 20
});

// Obtener artista específico
const artist = await sdk.getArtist('artist_id_123');
```

## Pruebas de Integración

### 1. Registro de Usuario

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test User",
    "email": "test@example.com",
    "password": "Test1234!",
    "role": "cliente",
    "pais": "México",
    "codigoPais": "+52",
    "telefono": "5512345678"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "user": {
    "id": "user_xxx",
    "nombre": "Test User",
    "email": "test@example.com",
    "role": "cliente",
    "pais": "México",
    "telefono": "+525512345678",
    "createdAt": "2026-02-24T20:51:52.689Z"
  },
  "message": "Cuenta creada exitosamente"
}
```

### 2. Inicio de Sesión

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }'
```

**Respuesta exitosa:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_xxx",
    "nombre": "Test User",
    "email": "test@example.com",
    "role": "cliente"
  }
}
```

## Iniciar el Stack Completo

### 1. Iniciar servicios Docker

```bash
cd infra/docker
docker compose -f docker-compose.dev.yml up -d
```

### 2. Verificar salud de servicios

```bash
./docker-health.sh
```

### 3. Iniciar frontend

```bash
cd apps/web/web
PORT=3001 pnpm dev
```

### 4. Acceder a la aplicación

- **Frontend:** http://localhost:3001
- **Gateway:** http://localhost:3000
- **Auth Service:** http://localhost:4001
- **Artists Service:** http://localhost:4003

## Arquitectura de Rutas API

### Frontend → Backend

| Ruta Frontend | API Route Next.js | Backend Service | Endpoint Real |
|--------------|-------------------|-----------------|---------------|
| `/register` | `/api/auth/register` | Auth Service | `POST /auth/register` |
| `/login` | `/api/auth/login` | Auth Service | `POST /auth/login` |
| `/dashboard` | `/api/auth/me` | Auth Service | `POST /auth/verify` |
| `/artists` | SDK directo | Artists Service | `GET /artists` |

## Mejoras Futuras

### Gateway Integration

El gateway está configurado pero actualmente no se usa en desarrollo debido a issues con el proxy middleware. En producción:

1. Eliminar llamadas directas a servicios
2. Actualizar `AUTH_SERVICE_URL` a `http://gateway:3000/api`
3. Configurar CORS correctamente en gateway
4. Agregar rate limiting centralizado
5. Implementar circuit breaker patterns

### SDK Enhancements

- [ ] Agregar manejo de errores más robusto
- [ ] Implementar retry logic
- [ ] Agregar caché de respuestas
- [ ] Tipos TypeScript más específicos
- [ ] Documentación de métodos con JSDoc

### Testing

- [ ] Tests E2E con Playwright
- [ ] Tests de integración con Jest
- [ ] Tests de carga con k6
- [ ] CI/CD pipeline con GitHub Actions

## Troubleshooting

### Error: Cannot connect to backend

**Solución:** Verificar que Docker esté corriendo:
```bash
docker ps
cd infra/docker
docker compose -f docker-compose.dev.yml up -d
```

### Error: Port 3001 already in use

**Solución:** Cambiar puerto del frontend:
```bash
PORT=3002 pnpm dev
```

### Error: 504 Gateway Timeout

**Solución:** Verificar que el servicio backend específico esté corriendo:
```bash
docker compose -f docker-compose.dev.yml ps auth-service
docker compose -f docker-compose.dev.yml logs auth-service
```

## Estado Actual

✅ **Completado:**
- Registro de usuarios funcional
- Login funcional
- Integración frontend → auth-service
- SDK básico implementado
- Variables de entorno configuradas
- Documentación de integración

🔄 **En Proceso:**
- Gateway proxy (issues con http-proxy-middleware)
- Tests automatizados

⏳ **Pendiente:**
- Integración con otros servicios (catalog, booking, etc.)
- Producción deployment con gateway
- CI/CD pipeline
