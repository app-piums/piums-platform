# Users Service 👤

Servicio de gestión de perfiles de usuarios para la plataforma Piums.

## 📋 Características

### ✅ Implementado (Fase 1 - Crítico)

- ✅ Modelo de datos con Prisma (User, Address)
- ✅ Autenticación con JWT
- ✅ Autorización (solo editar propio perfil)
- ✅ Endpoints críticos:
  - `GET /api/users/me` - Perfil del usuario autenticado
  - `GET /api/users/:id` - Obtener perfil
  - `PUT /api/users/:id` - Actualizar perfil
  - `DELETE /api/users/:id` - Eliminar cuenta (soft delete)
  - Gestión de direcciones (CRUD completo)
- ✅ Validación con Zod
- ✅ Rate limiting
- ✅ Error handling estructurado
- ✅ Logs estructurados
- ✅ Health check endpoint

### 🚧 Pendiente (Fases 2-3)

- ⏳ Upload de avatar (S3/Cloudinary)
- ⏳ Preferencias de notificaciones granulares
- ⏳ Métodos de pago guardados
- ⏳ Verificación de identidad (KYC)
- ⏳ Export de datos (GDPR)
- ⏳ Seguir artistas favoritos

## 🚀 Instalación

```bash
cd services/users-service
npm install
```

## ⚙️ Configuración

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Configura las variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Debe coincidir con auth-service
- `PORT` - Puerto del servicio (default: 4002)

## 🗄️ Base de datos

```bash
# Generar cliente Prisma
npm run prisma:generate

# Push schema a la base de datos
npm run prisma:push

# Abrir Prisma Studio
npm run prisma:studio
```

## 📦 Desarrollo

```bash
npm run dev
```

El servicio estará disponible en `http://localhost:4002`

## 🔗 Endpoints

### Health Check
```bash
GET /health
```

### Usuarios
```bash
# Obtener mi perfil (requiere auth)
GET /api/users/me
Authorization: Bearer {token}

# Obtener perfil por ID
GET /api/users/:id
Authorization: Bearer {token}

# Actualizar perfil (solo propio)
PUT /api/users/:id
Authorization: Bearer {token}
Content-Type: application/json
{
  "nombre": "Juan Actualizado",
  "bio": "Nueva biografía",
  "avatar": "https://example.com/avatar.jpg"
}

# Eliminar cuenta (solo propia)
DELETE /api/users/:id
Authorization: Bearer {token}
```

### Direcciones
```bash
# Agregar dirección
POST /api/users/:id/addresses
Authorization: Bearer {token}
{
  "label": "Casa",
  "street": "Calle Principal 123",
  "city": "Ciudad de México",
  "state": "CDMX",
  "country": "México",
  "zipCode": "01000",
  "isDefault": true
}

# Actualizar dirección
PUT /api/users/:id/addresses/:addressId
Authorization: Bearer {token}

# Eliminar dirección
DELETE /api/users/:id/addresses/:addressId
Authorization: Bearer {token}
```

## 🔒 Seguridad

- JWT authentication en todas las rutas protegidas
- Autorización: usuarios solo pueden modificar su propio perfil
- Rate limiting: 100 requests/15min general, 10 updates/hora
- Validación de datos con Zod
- Soft delete para cuentas eliminadas
- CORS configurado

## 📊 Modelo de datos

```prisma
User {
  id, authId, email, nombre
  avatar, bio, telefono, pais
  language, timezone
  notificationsEnabled, emailNotifications, smsNotifications, pushNotifications
  addresses[]
  createdAt, updatedAt, deletedAt, lastLoginAt
}

Address {
  id, userId
  label, street, city, state, country, zipCode
  lat, lng
  isDefault
}
```

## 🤝 Integración con otros servicios

- **auth-service**: Valida JWT tokens, referencia `authId`
- **booking-service**: Proporciona información de usuario para reservas
- **notifications-service**: Usa preferencias de notificación

## 📝 Notas de desarrollo

- El `authId` es el ID del usuario en **auth-service**
- Soft delete: usuarios eliminados tienen `deletedAt` no nulo
- Direcciones: solo una puede ser `isDefault = true`
- JWT debe incluir `id` (authId) y `email` en el payload
