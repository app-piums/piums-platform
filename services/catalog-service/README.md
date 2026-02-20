# Catalog Service

Microservicio para la gestión del catálogo de servicios ofrecidos por artistas en la plataforma Piums.

## 📋 Descripción

Este servicio maneja:
- **Categorías de servicios** (jerarquía anidada)
- **Servicios** ofrecidos por artistas (CRUD completo)
- **Add-ons** (extras opcionales para servicios)
- **Paquetes** (combos de múltiples servicios con descuento)
- **Pricing** flexible (fijo, por hora, por sesión, cotización)

## 🚀 Inicio Rápido

### Prerequisitos

- Node.js 18+
- PostgreSQL 14+
- pnpm (recomendado) o npm

### Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# Generar Prisma Client
pnpm run prisma:generate

# Crear base de datos y tablas
pnpm run prisma:push

# Iniciar en modo desarrollo
pnpm run dev
```

El servicio estará disponible en `http://localhost:4004`

## 📊 Modelos de Datos

### ServiceCategory

Categorías de servicios con soporte para jerarquía (categorías y subcategorías).

```typescript
{
  id: string (UUID)
  name: string
  slug: string (único)
  description?: string
  icon?: string
  parentId?: string  // Para subcategorías
  order: number
  isActive: boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Ejemplos de categorías:**
- Música → Música en vivo, DJ, Producción musical
- Fotografía → Bodas, Eventos, Productos, Retratos
- Tatuajes → Tatuajes pequeños, Medios, Grandes, Cover-up
- Entretenimiento → Animación infantil, Shows adultos

### Service

Servicios ofrecidos por artistas con información detallada de pricing, duración, imágenes y políticas.

```typescript
{
  id: string (UUID)
  artistId: string  // ID del artista de artists-service
  
  name: string
  slug: string (único por artista)
  description: string
  categoryId: string
  
  pricingType: "FIXED" | "HOURLY" | "PER_SESSION" | "CUSTOM"
  basePrice: number  // En centavos
  currency: string  // Default: "MXN"
  
  durationMin?: number  // Minutos
  durationMax?: number
  
  images: string[]
  thumbnail?: string
  
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
  isAvailable: boolean
  isFeatured: boolean
  
  requiresDeposit: boolean
  depositAmount?: number  // Monto fijo en centavos
  depositPercentage?: number  // O porcentaje (0-100)
  requiresConsultation: boolean
  
  cancellationPolicy?: string
  termsAndConditions?: string
  
  tags: string[]
  
  viewCount: number
  bookingCount: number
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Ejemplos:**
- "Sesión de fotos en exteriores" (HOURLY, $800/hora)
- "Tatuaje blanco y negro pequeño" (FIXED, $1500)
- "Set de DJ 4 horas" (PER_SESSION, $5000)
- "Show de magia para fiesta infantil" (CUSTOM, cotización)

### ServiceAddon

Extras u opcionales que se pueden agregar a un servicio.

```typescript
{
  id: string
  serviceId: string
  
  name: string
  description?: string
  price: number  // Precio adicional en centavos
  
  isOptional: boolean
  isDefault: boolean  // Se incluye por default
  order: number
  
  createdAt: DateTime
}
```

**Ejemplos para "Sesión de fotos":**
- Edición profesional avanzada (+$500)
- Impresiones físicas (+$300)
- Album digital (+$200)
- Segundo fotógrafo (+$800)

### ServicePackage

Paquetes/combos que agrupan múltiples servicios con precio especial.

```typescript
{
  id: string
  artistId: string
  
  name: string
  description: string
  serviceIds: string[]  // IDs de servicios incluidos
  
  originalPrice: number  // Suma de precios individuales
  packagePrice: number  // Precio con descuento
  savings: number  // Ahorro calculado
  currency: string
  
  isActive: boolean
  validFrom?: DateTime
  validUntil?: DateTime
  
  thumbnail?: string
  
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Ejemplo:**
```json
{
  "name": "Paquete Boda Completo",
  "description": "Fotografía + Video + Album + Drone",
  "serviceIds": ["uuid1", "uuid2", "uuid3", "uuid4"],
  "originalPrice": 25000,
  "packagePrice": 20000,
  "savings": 5000
}
```

## 🔌 API Endpoints

### Categorías

#### `GET /api/categories`
Obtener todas las categorías (público)

**Query params:**
- `includeInactive` (boolean): Incluir categorías inactivas

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Fotografía",
    "slug": "fotografia",
    "description": "Servicios de fotografía profesional",
    "icon": "camera",
    "order": 1,
    "subcategories": [
      {
        "id": "uuid2",
        "name": "Bodas",
        "slug": "bodas",
        "parentId": "uuid"
      }
    ]
  }
]
```

#### `GET /api/categories/:id`
Obtener categoría por ID (público)

#### `POST /api/categories`
Crear nueva categoría (requiere auth - admin)

**Body:**
```json
{
  "name": "Fotografía",
  "slug": "fotografia",
  "description": "Servicios de fotografía profesional",
  "icon": "camera",
  "parentId": null,
  "order": 1
}
```

#### `PUT /api/categories/:id`
Actualizar categoría (requiere auth - admin)

#### `DELETE /api/categories/:id`
Eliminar categoría (requiere auth - admin)

### Servicios

#### `GET /api/services`
Buscar servicios con filtros (público)

**Query params:**
- `artistId` (string): Filtrar por artista
- `categoryId` (string): Filtrar por categoría
- `pricingType` (enum): FIXED, HOURLY, PER_SESSION, CUSTOM
- `minPrice` (number): Precio mínimo en centavos
- `maxPrice` (number): Precio máximo en centavos
- `status` (enum): ACTIVE, INACTIVE, ARCHIVED
- `isFeatured` (boolean): Solo destacados
- `tags` (string): Tags separados por coma
- `page` (number): Página (default: 1)
- `limit` (number): Resultados por página (default: 10, max: 100)

**Response:**
```json
{
  "services": [
    {
      "id": "uuid",
      "artistId": "artist-uuid",
      "name": "Sesión de fotos en exteriores",
      "slug": "sesion-fotos-exteriores",
      "description": "Sesión de 2 horas en locación",
      "category": {
        "id": "cat-uuid",
        "name": "Fotografía",
        "slug": "fotografia"
      },
      "pricingType": "HOURLY",
      "basePrice": 80000,
      "currency": "MXN",
      "durationMin": 120,
      "images": ["url1", "url2"],
      "thumbnail": "url",
      "addons": [
        {
          "id": "addon-uuid",
          "name": "Edición avanzada",
          "price": 50000,
          "isOptional": true
        }
      ],
      "status": "ACTIVE",
      "isFeatured": true,
      "tags": ["exteriores", "naturaleza", "retratos"]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

#### `GET /api/services/:id`
Obtener servicio por ID (público)

**Query params:**
- `view=true`: Incrementar contador de vistas

#### `POST /api/services`
Crear nuevo servicio (requiere auth - artista)

**Headers:**
```
Authorization: Bearer <token>
```

**Body:**
```json
{
  "artistId": "artist-uuid",
  "name": "Sesión de fotos en exteriores",
  "slug": "sesion-fotos-exteriores",
  "description": "Sesión profesional de fotografía en locación exterior...",
  "categoryId": "cat-uuid",
  "pricingType": "HOURLY",
  "basePrice": 80000,
  "currency": "MXN",
  "durationMin": 120,
  "durationMax": 180,
  "images": ["https://example.com/img1.jpg"],
  "thumbnail": "https://example.com/thumb.jpg",
  "requiresDeposit": true,
  "depositPercentage": 30,
  "requiresConsultation": false,
  "cancellationPolicy": "Cancelación con 48 horas de anticipación...",
  "tags": ["exteriores", "naturaleza", "retratos"]
}
```

#### `PUT /api/services/:id`
Actualizar servicio (requiere auth + ownership)

**Body:**
```json
{
  "artistId": "artist-uuid",
  "name": "Nuevo nombre",
  "basePrice": 90000,
  "status": "ACTIVE"
}
```

#### `DELETE /api/services/:id`
Eliminar servicio (requiere auth + ownership)

**Query params:**
- `artistId` (required): ID del artista propietario

#### `PATCH /api/services/:id/toggle-status`
Activar/Desactivar servicio (requiere auth + ownership)

**Body:**
```json
{
  "artistId": "artist-uuid"
}
```

### Add-ons

#### `POST /api/services/:serviceId/addons`
Crear addon para un servicio (requiere auth + ownership)

**Body:**
```json
{
  "artistId": "artist-uuid",
  "name": "Edición profesional avanzada",
  "description": "Retoque avanzado de todas las fotos",
  "price": 50000,
  "isOptional": true,
  "isDefault": false,
  "order": 1
}
```

#### `PUT /api/addons/:addonId`
Actualizar addon (requiere auth + ownership)

#### `DELETE /api/addons/:addonId`
Eliminar addon (requiere auth + ownership)

### Paquetes

#### `POST /api/packages`
Crear paquete de servicios (requiere auth - artista)

**Body:**
```json
{
  "artistId": "artist-uuid",
  "name": "Paquete Boda Completo",
  "description": "Incluye fotografía, video, album y drone",
  "serviceIds": ["uuid1", "uuid2", "uuid3", "uuid4"],
  "originalPrice": 2500000,
  "packagePrice": 2000000,
  "savings": 500000,
  "currency": "MXN",
  "thumbnail": "https://example.com/package.jpg",
  "validFrom": "2024-01-01T00:00:00Z",
  "validUntil": "2024-12-31T23:59:59Z"
}
```

#### `GET /api/artists/:artistId/packages`
Obtener paquetes de un artista (público)

#### `PUT /api/packages/:id`
Actualizar paquete (requiere auth + ownership)

#### `DELETE /api/packages/:id`
Eliminar paquete (requiere auth + ownership)

### Health Check

#### `GET /health`
Estado del servicio

**Response:**
```json
{
  "status": "healthy",
  "service": "catalog-service",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

## 🔐 Autenticación

Endpoints que requieren autenticación deben incluir un JWT en el header:

```
Authorization: Bearer <token>
```

El token debe ser generado por el `auth-service` y contener:
```json
{
  "id": "user-uuid",
  "email": "user@example.com"
}
```

## ⚡ Rate Limiting

- **General**: 100 requests / 15 minutos
- **Crear servicios**: 10 / hora
- **Actualizaciones**: 30 / hora
- **Búsquedas**: 50 / 15 minutos

## 💰 Manejo de Precios

Todos los precios se almacenan en **centavos** para evitar problemas con decimales.

**Ejemplo:**
- $800.00 MXN → `80000` centavos
- $1,500.50 MXN → `150050` centavos

**Al mostrar al usuario:**
```javascript
const priceInPesos = basePrice / 100;
const formatted = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN'
}).format(priceInPesos);
// "$800.00"
```

## 🏷️ Tipos de Pricing

### FIXED
Precio fijo por el servicio completo.
- Ejemplo: Tatuaje pequeño ($1,500)

### HOURLY
Precio por hora.
- Ejemplo: Fotografía ($800/hora)

### PER_SESSION
Precio por sesión definida.
- Ejemplo: Set de DJ 4 horas ($5,000)

### CUSTOM
Se requiere cotización personalizada.
- Ejemplo: Mural grande (cotizar según tamaño)

## 📂 Estructura del Proyecto

```
catalog-service/
├── prisma/
│   └── schema.prisma          # Modelos de datos
├── src/
│   ├── controller/
│   │   └── catalog.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── routes/
│   │   ├── catalog.routes.ts
│   │   └── health.routes.ts
│   ├── schemas/
│   │   └── catalog.schema.ts
│   ├── services/
│   │   └── catalog.service.ts
│   ├── utils/
│   │   └── logger.ts
│   └── index.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 Testing

Ver `test-integration.sh` para pruebas de integración completas.

```bash
chmod +x test-integration.sh
./test-integration.sh
```

## 🔗 Dependencias con otros servicios

### artists-service (puerto 4003)
- `artistId` en Service debe corresponder a un artista válido
- Se recomienda validar la existencia del artista antes de crear servicios

### auth-service (puerto 4001)
- JWT tokens para autenticación
- Debe usar el mismo `JWT_SECRET`

## 📝 Logs

Todos los logs siguen el formato JSON estructurado:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "catalog-service",
  "context": "CATALOG_SERVICE",
  "message": "Servicio creado",
  "data": {
    "serviceId": "uuid",
    "artistId": "artist-uuid"
  }
}
```

## 🚨 Manejo de Errores

### 400 Bad Request
- Datos de validación inválidos
- Slug duplicado
- Requisitos no cumplidos

### 401 Unauthorized
- Token no proporcionado
- Token inválido o expirado

### 403 Forbidden
- No eres propietario del recurso

### 404 Not Found
- Recurso no existe

### 500 Internal Server Error
- Error inesperado del servidor

## 📈 Próximas Funcionalidades

- [ ] Pricing dinámico por día/hora
- [ ] Descuentos por volumen
- [ ] Comparación de servicios
- [ ] Recomendaciones basadas en historial
- [ ] Integración con sistema de reviews
- [ ] Analytics de servicios más vistos/reservados

## 📄 Licencia

MIT
