# Auth Service

Servicio de autenticación para la plataforma Piums.

## 🚀 Inicio rápido

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env

# Iniciar en modo desarrollo
pnpm dev

# Compilar para producción
pnpm build

# Ejecutar en producción
pnpm start
```

## 📡 Endpoints

### POST /auth/register
Registra un nuevo usuario.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "token": "jwt_token"
}
```

### POST /auth/login
Autentica un usuario existente.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "token": "jwt_token"
}
```

## 🔧 Variables de entorno

- `PORT`: Puerto del servidor (default: 4001)
- `JWT_SECRET`: Secreto para firmar JWT
- `NODE_ENV`: Entorno de ejecución (development/production)

## ⚠️ Pendientes

- [ ] Integrar base de datos (PostgreSQL/MongoDB)
- [ ] Agregar validación con Zod
- [ ] Implementar refresh tokens
- [ ] Agregar middleware de autenticación
- [ ] Tests unitarios
