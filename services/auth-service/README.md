# Auth Service 🔐

Servicio de autenticación con **seguridad avanzada** para la plataforma Piums.

## ✨ Características

### 🔴 Seguridad Crítica (Implementado)
- ✅ **JWT_SECRET obligatorio** - Valida en producción, falla si no está definido
- ✅ **Rate Limiting** - Protección contra fuerza bruta:
  - Login: 5 intentos / 15 minutos
  - Registro: 3 intentos / hora
  - API general: 100 requests / 15 minutos
- ✅ **Validación de unicidad** - Email único por usuario
- ✅ **Verificación real** - Login con usuarios y contraseñas reales
- ✅ **Hash de contraseñas** - bcrypt con salt rounds = 10

### 🟡 Funcionalidades MVP (Implementado)
- ✅ **Refresh Tokens** - Tokens de acceso (1h) + refresh (7d)
- ✅ **Error Handling Global** - Middleware centralizado con AppError
- ✅ **Logs Estructurados** - Logger custom con niveles (debug/info/warn/error)
- ✅ **Health Check** - Endpoint `/health` con uptime y estado
- ✅ **Validación Zod** - Schemas para registro y login

### 🟢 Futuras Mejoras (Roadmap)
- ⏳ Verificación de email (código 6 dígitos)
- ⏳ Recuperación de contraseña
- ⏳ 2FA opcional
- ⏳ Bloqueo de cuenta tras N intentos
- ⏳ Logs de auditoría completos

## 🚀 Inicio rápido

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# IMPORTANTE: Editar .env y cambiar JWT_SECRET y REFRESH_SECRET

# Iniciar en modo desarrollo con hot-reload
pnpm dev

# Compilar para producción
pnpm build

# Ejecutar en producción
pnpm start
```

## 📡 Endpoints

### GET /health
Verifica el estado del servicio.

**Response:**
```json
{
  "status": "healthy",
  "service": "auth-service",
  "timestamp": "2026-02-19T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

### POST /auth/register
Registra un nuevo usuario con validación completa.

**Rate Limit:** 3 intentos / hora

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "SecureP@ss123",
  "pais": "Guatemala",
  "codigoPais": "+502",
  "telefono": "12345678"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_1234567890",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "pais": "Guatemala",
    "telefono": "+50212345678"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `400` - Email ya registrado
- `400` - Validación fallida (Zod)
- `429` - Demasiados intentos

### POST /auth/login
Autentica un usuario existente con verificación real.

**Rate Limit:** 5 intentos / 15 minutos

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "SecureP@ss123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1234567890",
    "nombre": "Juan Pérez",
    "email": "juan@example.com"
  }
}
```

**Errores:**
- `401` - Credenciales inválidas
- `429` - Demasiados intentos

### POST /auth/refresh
Renueva el access token usando un refresh token válido.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errores:**
- `400` - Refresh token requerido
- `401` - Token inválido o expirado

## 🔧 Variables de entorno

### Críticas (OBLIGATORIAS en producción)
```env
JWT_SECRET=your_super_secret_jwt_key_CHANGE_ME
REFRESH_SECRET=your_super_secret_refresh_key_CHANGE_ME
```

### Configuración del servidor
```env
PORT=4001
NODE_ENV=development
```

### Base de datos (futuro)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/piums_auth
```

### Logs
```env
LOG_LEVEL=info  # debug | info | warn | error
```

## 🏗️ Arquitectura

```
src/
├── controller/
│   └── auth.controller.ts      # Lógica de negocio (registro, login, refresh)
├── middleware/
│   ├── errorHandler.ts         # Error handling centralizado
│   └── rateLimiter.ts          # Rate limiting configurado
├── routes/
│   ├── auth.routes.ts          # Rutas de autenticación
│   └── health.routes.ts        # Health check
├── schemas/
│   └── auth.schema.ts          # Validaciones Zod
├── services/
│   └── auth.service.ts         # Funciones core (hash, JWT, etc.)
├── utils/
│   └── logger.ts               # Logger estructurado
└── index.ts                    # Entry point
```

## 🧪 Logs Estructurados

El servicio usa un logger custom con formato JSON en producción y formato legible en desarrollo.

**Desarrollo:**
```
ℹ️  [2026-02-19T10:30:00.000Z] INFO: Auth Service running on http://localhost:4001
✅ [2026-02-19T10:30:15.000Z] INFO: Usuario registrado exitosamente | {"userId":"user_123","email":"juan@example.com"}
⚠️  [2026-02-19T10:30:30.000Z] WARN: Intento de login con contraseña incorrecta | {"userId":"user_123"}
```

**Producción (JSON):**
```json
{"timestamp":"2026-02-19T10:30:00.000Z","level":"info","message":"Usuario registrado exitosamente","context":"AUTH_CONTROLLER","data":{"userId":"user_123","email":"juan@example.com"}}
```

## 🔒 Seguridad

- **bcrypt** para hashing de contraseñas (salt rounds = 10)
- **JWT** con expiración (access: 1h, refresh: 7d)
- **Rate Limiting** con express-rate-limit
- **Validación estricta** con Zod
- **Error handling** sin exponer información sensible
- **CORS** habilitado (configurar orígenes en producción)

## ⚙️ Scripts

```json
{
  "dev": "ts-node-dev --respawn src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "test": "echo \"Tests pendientes\""
}
```

## ⚠️ Notas Importantes

### Mock Database
Actualmente usa un array en memoria (`mockUsers`). **NO USAR EN PRODUCCIÓN**.

**Próximo paso:** Integrar Prisma con PostgreSQL.

### Variables de Entorno
El servicio **FALLA EN PRODUCCIÓN** si `JWT_SECRET` no está definido.
En desarrollo usa un secreto por defecto con advertencia.

### Rate Limiting
Los límites se reinician por IP. Para producción, considera:
- Redis para rate limiting distribuido
- Ajustar límites según carga esperada

## 📦 Dependencias

**Producción:**
- `express` - Framework web
- `cors` - CORS middleware
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT tokens
- `express-rate-limit` - Rate limiting
- `zod` - Validación de schemas

**Desarrollo:**
- `typescript` - TypeScript compiler
- `ts-node-dev` - Hot reload para desarrollo
- `@types/*` - Type definitions

## 🔗 Integración

### Frontend (Next.js API Routes)
```typescript
// /api/auth/register
const response = await fetch(`${AUTH_SERVICE_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData)
});
```

### Otros Microservicios
Validar JWT con el mismo `JWT_SECRET`:
```typescript
import jwt from 'jsonwebtoken';

const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

## 📝 TODO

- [ ] Integrar Prisma ORM
- [ ] Tests unitarios (Jest)
- [ ] Tests de integración
- [ ] CI/CD pipeline
- [ ] Documentación OpenAPI/Swagger
- [ ] Métricas (Prometheus)
- [ ] Verificación de email
- [ ] Recuperación de contraseña
