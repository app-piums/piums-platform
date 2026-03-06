# 📚 API Documentation

Documentación completa de la API de Piums Platform usando OpenAPI 3.0.

## 🚀 Acceso Rápido

### Swagger UI (Documentación Interactiva)

- **Local**: http://localhost:3000/docs
- **Staging**: https://staging.piums.com/docs  
- **Production**: https://piums.com/docs

### Archivo OpenAPI

- **Archivo YAML**: [openapi.yaml](./openapi.yaml)
- **Versión**: 1.0.0
- **Formato**: OpenAPI 3.0.3

## 📖 Cómo Usar

### Ver Documentación Localmente

```bash
# Opción 1: Servidor HTTP simple
cd docs/api-contracts
python3 -m http.server 8080

# Luego abre en navegador:
# http://localhost:8080

# Opción 2: Usar npx (recomendado)
npx serve docs/api-contracts
```

### Probar Endpoints

1. Abre Swagger UI en tu navegador
2. Click en "Authorize" y pega tu JWT token
3. Selecciona un endpoint
4. Click en "Try it out"
5. Completa los parámetros
6. Click en "Execute"

### Obtener Token de Autenticación

```bash
# 1. Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User",
    "role": "CLIENT"
  }'

# 2. Login y obtener token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Respuesta:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refreshToken": "...",
#   "user": { ... }
# }

# 3. Usar el token en requests
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <token>"
```

## 📊 Resumen de Endpoints

### Autenticación (11 endpoints)
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/forgot-password` - Recuperar contraseña
- `POST /api/auth/reset-password` - Resetear contraseña
- `POST /api/auth/change-password` - Cambiar contraseña
- `POST /api/auth/verify-email` - Verificar email
- `POST /api/auth/resend-verification` - Reenviar verificación
- `GET /api/auth/oauth/google` - Login con Google
- `GET /api/auth/oauth/facebook` - Login con Facebook

### Usuarios (6 endpoints)
- `GET /api/users/me` - Perfil actual
- `PUT /api/users/me` - Actualizar perfil
- `DELETE /api/users/me` - Eliminar cuenta
- `POST /api/users/me/avatar` - Subir avatar
- `DELETE /api/users/me/avatar` - Eliminar avatar
- `GET/PUT /api/users/me/notifications-settings` - Preferencias

### Artistas (9 endpoints)
- `GET /api/artists` - Listar artistas
- `POST /api/artists` - Crear perfil artista
- `GET /api/artists/{id}` - Obtener artista
- `PUT /api/artists/{id}` - Actualizar artista
- `DELETE /api/artists/{id}` - Eliminar artista
- `GET /api/artists/me/dashboard` - Dashboard
- `GET /api/artists/me/bookings` - Mis reservas
- `POST /api/artists/bookings/{id}/accept` - Aceptar reserva
- `POST /api/artists/bookings/{id}/decline` - Rechazar reserva

### Catálogo (6 endpoints)
- `GET /api/catalog/services` - Listar servicios
- `POST /api/catalog/services` - Crear servicio
- `GET /api/catalog/services/{id}` - Obtener servicio
- `PUT /api/catalog/services/{id}` - Actualizar servicio
- `DELETE /api/catalog/services/{id}` - Eliminar servicio
- `GET /api/catalog/categories` - Categorías disponibles

### Reservas (5 endpoints)
- `GET /api/bookings` - Mis reservas
- `POST /api/bookings` - Crear reserva
- `GET /api/bookings/{id}` - Obtener reserva
- `DELETE /api/bookings/{id}` - Cancelar reserva
- `PATCH /api/bookings/{id}/reschedule` - Reprogramar

### Pagos (7 endpoints)
- `GET /api/payments/methods` - Métodos de pago
- `POST /api/payments/methods` - Agregar método
- `DELETE /api/payments/methods/{id}` - Eliminar método
- `PATCH /api/payments/methods/{id}/default` - Marcar como default
- `GET /api/payments` - Historial de pagos
- `POST /api/payments` - Procesar pago
- `POST /api/payments/refund/{id}` - Reembolso

### Reseñas (7 endpoints)
- `GET /api/reviews` - Listar reseñas
- `POST /api/reviews` - Crear reseña
- `GET /api/reviews/{id}` - Obtener reseña
- `PUT /api/reviews/{id}` - Actualizar reseña
- `DELETE /api/reviews/{id}` - Eliminar reseña
- `POST /api/reviews/{id}/respond` - Responder (artista)
- `POST /api/reviews/{id}/helpful` - Marcar útil

### Notificaciones (3 endpoints)
- `GET /api/notifications` - Listar notificaciones
- `PATCH /api/notifications/{id}/read` - Marcar leída
- `PATCH /api/notifications/read-all` - Marcar todas

### Búsqueda (2 endpoints)
- `GET /api/search/artists` - Buscar artistas
- `GET /api/search/services` - Buscar servicios

### Chat (6 endpoints)
- `GET /api/chat/conversations` - Listar conversaciones
- `POST /api/chat/conversations` - Crear conversación
- `GET /api/chat/conversations/{id}` - Obtener conversación
- `GET /api/chat/conversations/{id}/messages` - Mensajes
- `POST /api/chat/messages` - Enviar mensaje
- `PATCH /api/chat/messages/{id}/read` - Marcar leído

### Health (1 endpoint)
- `GET /api/health` - Health check

**Total: 85+ endpoints documentados**

## 🔐 Autenticación

La mayoría de los endpoints requieren autenticación mediante JWT Bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Endpoints Públicos (No requieren autenticación)

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/verify-email`
- `GET /api/auth/oauth/google`
- `GET /api/auth/oauth/facebook`
- `GET /api/artists` (lista pública)
- `GET /api/artists/{id}` (perfil público)
- `GET /api/catalog/services` (lista pública)
- `GET /api/reviews` (reseñas públicas)
- `GET /api/search/artists`
- `GET /api/search/services`

## 🎯 Rate Limiting

Límites de requests por endpoint:

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| POST /api/auth/login | 5 requests | 15 min |
| POST /api/auth/register | 3 requests | 1 hora |
| POST /api/auth/forgot-password | 3 requests | 1 hora |
| POST /api/auth/reset-password | 5 requests | 1 hora |
| POST /api/auth/refresh | 10 requests | 15 min |
| Otros endpoints | 100 requests | 15 min |

Cuando se excede el límite, recibirás:

```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 10 minutes",
  "retryAfter": 600
}
```

## 📝 Ejemplos de Uso

### Crear Reserva

```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "artistId": "550e8400-e29b-41d4-a716-446655440000",
    "serviceId": "660e8400-e29b-41d4-a716-446655440001",
    "date": "2026-03-20",
    "time": "18:00",
    "location": {
      "address": "Calle Mayor 1",
      "city": "Madrid",
      "postalCode": "28001"
    },
    "notes": "Evento corporativo, 50 personas"
  }'
```

### Buscar Artistas

```bash
curl "http://localhost:3000/api/search/artists?q=mago&location=Madrid&rating=4&sort=rating&page=1&limit=20"
```

### Subir Avatar

```bash
curl -X POST http://localhost:3000/api/users/me/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/path/to/image.jpg"
```

### Agregar Método de Pago

```bash
# 1. Crear PaymentMethod en Stripe (frontend)
# 2. Enviar el ID a backend
curl -X POST http://localhost:3000/api/payments/methods \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "stripePaymentMethodId": "pm_1234567890abcdef",
    "setAsDefault": true
  }'
```

## 🔄 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Request exitoso |
| 201 | Created - Recurso creado |
| 204 | No Content - Exitoso sin respuesta |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej: email duplicado) |
| 422 | Unprocessable Entity - Validación falló |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |
| 503 | Service Unavailable - Servicio no disponible |

## 🛠️ Generación de Clientes

Puedes generar clientes automáticamente desde el OpenAPI spec:

### TypeScript/JavaScript

```bash
npx @openapitools/openapi-generator-cli generate \
  -i docs/api-contracts/openapi.yaml \
  -g typescript-fetch \
  -o packages/sdk/src/generated
```

### Python

```bash
openapi-generator-cli generate \
  -i docs/api-contracts/openapi.yaml \
  -g python \
  -o clients/python
```

### Java

```bash
openapi-generator-cli generate \
  -i docs/api-contracts/openapi.yaml \
  -g java \
  -o clients/java
```

## 📦 Validación del Spec

Verificar que el OpenAPI spec es válido:

```bash
# Usando swagger-cli
npm install -g @apidevtools/swagger-cli
swagger-cli validate docs/api-contracts/openapi.yaml

# Usando openapi-generator-cli
npx @openapitools/openapi-generator-cli validate \
  -i docs/api-contracts/openapi.yaml
```

## 🔗 Enlaces Útiles

- **OpenAPI Specification**: https://spec.openapis.org/oas/v3.0.3
- **Swagger Editor**: https://editor.swagger.io/
- **Swagger UI**: https://swagger.io/tools/swagger-ui/
- **OpenAPI Generator**: https://openapi-generator.tech/

## 📧 Soporte

Para preguntas sobre la API:

- **Email**: api@piums.com
- **GitHub Issues**: https://github.com/app-piums/piums-platform/issues
- **Slack**: #api-support

## 📄 Changelog

### v1.0.0 (2026-03-06)
- ✅ Documentación inicial completa
- ✅ 85+ endpoints documentados
- ✅ Schemas para todas las entidades
- ✅ Ejemplos de uso
- ✅ Swagger UI integration
- ✅ Rate limiting documentado
- ✅ Autenticación y OAuth2
