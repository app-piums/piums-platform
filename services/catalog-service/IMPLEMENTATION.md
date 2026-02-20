# Implementation Summary - Catalog Service

## 📊 Resumen General

**Servicio:** catalog-service  
**Puerto:** 4004  
**Base de datos:** PostgreSQL (piums_catalog)  
**Líneas de código:** ~2000 LOC  
**Endpoints implementados:** 20  
**Modelos de datos:** 4 (ServiceCategory, Service, ServiceAddon, ServicePackage)

## 🏗️ Arquitectura

### Stack Tecnológico
- **Runtime:** Node.js 18+ con TypeScript
- **Framework:** Express.js 4.21
- **ORM:** Prisma 6.1
- **Base de datos:** PostgreSQL 14+
- **Validación:** Zod 3.24
- **Autenticación:** JWT (jsonwebtoken 9.0)
- **Rate Limiting:** express-rate-limit 7.5
- **CORS:** cors 2.8

### Estructura del Proyecto

```
catalog-service/
├── prisma/
│   └── schema.prisma           # 4 modelos, ~200 líneas
├── src/
│   ├── controller/
│   │   └── catalog.controller.ts    # 15 handlers, ~300 líneas
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT + optional auth, ~80 líneas
│   │   ├── errorHandler.ts          # Error handling global, ~60 líneas
│   │   └── rateLimiter.ts           # 4 limiters, ~40 líneas
│   ├── routes/
│   │   ├── catalog.routes.ts        # 20 rutas, ~200 líneas
│   │   └── health.routes.ts         # Health check, ~15 líneas
│   ├── schemas/
│   │   └── catalog.schema.ts        # 8 Zod schemas, ~150 líneas
│   ├── services/
│   │   └── catalog.service.ts       # Business logic, ~700 líneas
│   ├── utils/
│   │   └── logger.ts                # Structured logging, ~30 líneas
│   └── index.ts                     # Server setup, ~80 líneas
├── test-integration.sh              # E2E test script, ~250 líneas
├── .env
├── .env.example
├── package.json
└── tsconfig.json

Total: ~2000 líneas de código
```

## 📦 Modelos de Datos

### 1. ServiceCategory
**Propósito:** Gestionar categorías de servicios con jerarquía anidada

**Campos clave:**
- `id` (UUID)
- `name`, `slug` (unique)
- `parentId` (self-reference para jerarquía)
- `subcategories` (relación inversa)
- `services` (relación con Service)
- `order`, `isActive`

**Índices:**
- slug (unique)
- parentId

**Casos de uso:**
- Categorías principales: Música, Fotografía, Video, Tatuajes, etc.
- Subcategorías: Música → DJ, Música en vivo, Producción

### 2. Service
**Propósito:** Servicios ofrecidos por artistas con pricing flexible

**Campos clave:**
- `id` (UUID)
- `artistId` (FK a artists-service)
- `categoryId` (FK a ServiceCategory)
- `name`, `slug`, `description`
- `pricingType` (FIXED, HOURLY, PER_SESSION, CUSTOM)
- `basePrice` (en centavos), `currency`
- `durationMin`, `durationMax` (minutos)
- `images[]`, `thumbnail`
- `status` (ACTIVE, INACTIVE, ARCHIVED)
- `requiresDeposit`, `depositAmount`, `depositPercentage`
- `requiresConsultation`
- `cancellationPolicy`, `termsAndConditions`
- `tags[]`
- `viewCount`, `bookingCount` (estadísticas)

**Relaciones:**
- category (ServiceCategory)
- addons (ServiceAddon[])

**Índices:**
- artistId
- categoryId
- status
- pricingType
- (artistId, slug) unique

**Validaciones:**
- Slug único por artista
- BasePrice >= 0
- DepositPercentage entre 0-100

### 3. ServiceAddon
**Propósito:** Extras u opcionales para agregar a servicios

**Campos clave:**
- `id` (UUID)
- `serviceId` (FK a Service)
- `name`, `description`
- `price` (centavos)
- `isOptional`, `isDefault`
- `order`

**Relación:**
- service (Service)
- Cascade delete cuando se elimina el servicio

**Ejemplos:**
- "Edición profesional avanzada" (+$500)
- "Album físico" (+$300)
- "Segundo fotógrafo" (+$800)

### 4. ServicePackage
**Propósito:** Combos de múltiples servicios con descuento

**Campos clave:**
- `id` (UUID)
- `artistId`
- `name`, `description`
- `serviceIds[]` (array de UUIDs)
- `originalPrice`, `packagePrice`, `savings`
- `currency`
- `validFrom`, `validUntil` (fechas de validez)
- `isActive`

**Validaciones:**
- Mínimo 2 servicios en el paquete
- Todos los servicios deben pertenecer al artista
- packagePrice < originalPrice

**Ejemplo:**
```
Paquete Boda Completo
Incluye: Fotografía + Video + Album + Drone
Original: $25,000 → Paquete: $20,000 (Ahorro: $5,000)
```

## 🔌 Endpoints Implementados (20 total)

### Categorías (5 endpoints)

1. **GET /api/categories**
   - Público
   - Listar todas las categorías con subcategorías
   - Query: `?includeInactive=true`

2. **GET /api/categories/:id**
   - Público
   - Obtener categoría específica con parent y subcategorías

3. **POST /api/categories**
   - Auth requerido (admin)
   - Crear nueva categoría
   - Rate limit: 10/hora

4. **PUT /api/categories/:id**
   - Auth requerido (admin)
   - Actualizar categoría
   - Rate limit: 30/hora

5. **DELETE /api/categories/:id**
   - Auth requerido (admin)
   - Eliminar categoría (validar que no tenga servicios ni subcategorías)

### Servicios (6 endpoints)

6. **GET /api/services**
   - Público
   - Búsqueda con filtros múltiples
   - Filtros: artistId, categoryId, pricingType, minPrice, maxPrice, status, isFeatured, tags
   - Paginación: page, limit (max 100)
   - Rate limit: 50/15min

7. **GET /api/services/:id**
   - Público
   - Obtener servicio con categoría y addons
   - Query `?view=true` incrementa viewCount

8. **POST /api/services**
   - Auth requerido (artista)
   - Crear nuevo servicio
   - Validar: categoryId existe, slug único por artista
   - Rate limit: 10/hora

9. **PUT /api/services/:id**
   - Auth requerido (owner)
   - Actualizar servicio
   - Verificar ownership por artistId
   - Rate limit: 30/hora

10. **DELETE /api/services/:id**
    - Auth requerido (owner)
    - Eliminar servicio (cascade delete addons)
    - Query param: `?artistId=uuid`

11. **PATCH /api/services/:id/toggle-status**
    - Auth requerido (owner)
    - Alternar entre ACTIVE ↔ INACTIVE

### Add-ons (3 endpoints)

12. **POST /api/services/:serviceId/addons**
    - Auth requerido (owner del servicio)
    - Crear addon
    - Rate limit: 10/hora

13. **PUT /api/addons/:addonId**
    - Auth requerido (owner)
    - Actualizar addon
    - Rate limit: 30/hora

14. **DELETE /api/addons/:addonId**
    - Auth requerido (owner)
    - Eliminar addon

### Paquetes (5 endpoints)

15. **POST /api/packages**
    - Auth requerido (artista)
    - Crear paquete
    - Validar: todos los serviceIds existen y pertenecen al artistId
    - Rate limit: 10/hora

16. **GET /api/artists/:artistId/packages**
    - Público
    - Listar paquetes activos de un artista

17. **PUT /api/packages/:id**
    - Auth requerido (owner)
    - Actualizar paquete
    - Rate limit: 30/hora

18. **DELETE /api/packages/:id**
    - Auth requerido (owner)
    - Eliminar paquete

### Health (1 endpoint)

19. **GET /health**
    - Público
    - Status del servicio
    - Responde: status, service, timestamp, uptime

## 🔐 Seguridad

### Autenticación
- JWT tokens compartidos con auth-service
- Middleware `authenticateToken` para rutas protegidas
- Middleware `optionalAuth` para rutas mixtas (público + stats si auth)

### Autorización
- Verificación de ownership por `artistId`
- Solo el artista propietario puede modificar/eliminar sus servicios

### Rate Limiting
- **General:** 100 requests / 15 min
- **Creación:** 10 / hora (servicios, categorías, addons, paquetes)
- **Actualización:** 30 / hora
- **Búsquedas:** 50 / 15 min

### Validación
- Zod schemas para todos los inputs
- Validación de UUIDs
- Validación de enums (PricingType, ServiceStatus)
- Validación de rangos (depositPercentage 0-100)
- Regex para slugs (solo a-z, 0-9, guiones)

## 📊 Business Logic Destacada

### 1. Verificación de Ownership
```typescript
// Validar que el servicio pertenece al artista antes de editar/eliminar
const service = await prisma.service.findUnique({ where: { id } });
if (service.artistId !== artistId) {
  throw new AppError(403, "No tienes permiso");
}
```

### 2. Slug Único por Artista
```typescript
// Composite unique index en Prisma
@@unique([artistId, slug])

// Permite: artista1/tatuaje-pequeno y artista2/tatuaje-pequeno
// Previene: artista1/tatuaje-pequeno duplicado
```

### 3. Jerarquía de Categorías
```typescript
// Una categoría puede tener parent y subcategories
parent: ServiceCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id])
subcategories: ServiceCategory[] @relation("CategoryHierarchy")

// Permite estructura tipo: Música → DJ → DJ Bodas
```

### 4. Precios en Centavos
```typescript
// Almacenar: 80000 (centavos)
// Mostrar: $800.00 MXN

const priceInPesos = basePrice / 100;
```

### 5. Paquetes con Validación
```typescript
// Verificar que todos los servicios existen y pertenecen al artista
const services = await prisma.service.findMany({
  where: {
    id: { in: serviceIds },
    artistId: artistId
  }
});

if (services.length !== serviceIds.length) {
  throw new AppError(400, "Servicios inválidos");
}
```

### 6. Soft Status Toggle
```typescript
// No se elimina, solo se cambia status ACTIVE → INACTIVE
const newStatus = service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
```

### 7. View Counter
```typescript
// Incrementar vistas automáticamente con ?view=true
await prisma.service.update({
  where: { id },
  data: { viewCount: { increment: 1 } }
});
```

## 🔄 Relaciones con Otros Servicios

### artists-service (puerto 4003)
- **Dependencia:** `artistId` debe existir en artists-service
- **No validado en DB:** Foreign key lógica, no física (microservicios)
- **Recomendación:** Validar existencia del artista antes de crear servicios

### auth-service (puerto 4001)
- **Dependencia:** JWT tokens para autenticación
- **Requisito:** Mismo `JWT_SECRET` en .env
- **Token payload:** `{ id: string, email: string }`

### booking-service (próximo)
- **Usará:** GET /api/services/:id para obtener info de servicios
- **Usará:** basePrice, pricingType, durationMin para calcular costos

## 🎯 Decisiones de Diseño

### 1. ¿Por qué centavos en vez de decimales?
- Evitar problemas de precisión con floats
- Patrón estándar en Stripe, PayPal, etc.
- Más fácil para cálculos sin redondeo

### 2. ¿Por qué composite unique (artistId, slug)?
- Permite slugs descriptivos simples: "tatuaje-pequeno"
- No requiere UUID en URLs: `/artista123/tatuaje-pequeno`
- Mejor SEO que `/servicios/uuid-largo-abcd-1234`

### 3. ¿Por qué addons separados en vez de JSON?
- Facilitar queries y filtros
- Permitir orden visual
- Facilitar actualizaciones individuales
- Mejor para analytics (addons más populares)

### 4. ¿Por qué ServicePackage con serviceIds array?
- Flexibilidad: paquete puede tener 2-N servicios
- No requiere tabla junction
- Fácil validación de pertenencia

### 5. ¿Por qué status enum en vez de soft delete?
- ACTIVE: Visible y reservable
- INACTIVE: No visible pero recuperable
- ARCHIVED: Oculto permanentemente pero mantiene historial
- Permite estadísticas históricas

## 📈 Performance Considerations

### Índices Creados
```prisma
@@index([slug])              // ServiceCategory
@@index([parentId])          // ServiceCategory
@@index([artistId])          // Service
@@index([categoryId])        // Service
@@index([status])            // Service
@@index([pricingType])       // Service
@@unique([artistId, slug])   // Service
@@index([serviceId])         // ServiceAddon
@@index([artistId])          // ServicePackage
```

### Consultas Optimizadas
- Include solo lo necesario (category, addons)
- Paginación por default (limit 10, max 100)
- Count separado para no cargar datos innecesarios
- Order by optimizado (isFeatured DESC, createdAt DESC)

### Recomendaciones Futuras
- Agregar caching con Redis para servicios populares
- Índice GIN para búsqueda fulltext en description
- Índice GIN para búsqueda en tags array
- Read replicas para consultas públicas

## 🧪 Testing

### test-integration.sh
Script completo de E2E testing con 10 pasos:

1. Health check
2. Registrar usuario (auth-service)
3. Crear categorías
4. Crear servicio
5. Obtener servicio específico
6. Buscar servicios
7. Agregar addon
8. Crear paquete
9. Toggle service status
10. Cleanup

**Ejecutar:**
```bash
chmod +x test-integration.sh
./test-integration.sh
```

## 📝 Logging

Formato estructurado JSON:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "service": "catalog-service",
  "context": "CATALOG_SERVICE",
  "message": "Servicio creado",
  "data": { "serviceId": "uuid", "artistId": "artist-uuid" }
}
```

**Contextos:**
- `CATALOG_SERVICE` - Business logic
- `AUTH_MIDDLEWARE` - Authentication
- `ERROR_HANDLER` - Errors
- `REQUEST` - HTTP requests
- `PROCESS` - Node.js process events

## 🚀 Deployment

### Variables de Entorno Requeridas
```env
NODE_ENV=production
PORT=4004
DATABASE_URL=postgresql://...
JWT_SECRET=<mismo-que-auth-service>
ARTISTS_SERVICE_URL=http://artists-service:4003
ALLOWED_ORIGINS=https://piums.com,https://www.piums.com
```

### Build Production
```bash
npm run build
npm start
```

### Health Check
```bash
curl http://localhost:4004/health
```

## 📊 Métricas Actuales

- **Modelos:** 4
- **Endpoints:** 20
- **Lines of Code:** ~2000
- **Middlewares:** 3 (auth, error, rate-limit)
- **Validators:** 8 Zod schemas
- **Service methods:** 25
- **Rate limiters:** 4 diferentes
- **Índices de DB:** 9

## ✅ Checklist de MVP Completado

- [x] CRUD completo de categorías con jerarquía
- [x] CRUD completo de servicios
- [x] Pricing flexible (4 tipos)
- [x] Gestión de add-ons
- [x] Paquetes/combos con descuentos
- [x] Búsqueda con filtros múltiples
- [x] Paginación
- [x] Rate limiting por tipo de operación
- [x] Validación exhaustiva con Zod
- [x] Autenticación JWT
- [x] Autorización por ownership
- [x] Logging estructurado
- [x] Error handling global
- [x] Health check endpoint
- [x] Documentación completa
- [x] Database setup guide
- [x] Integration test script

## 🔜 Post-MVP (Fase 2)

- [ ] Pricing dinámico (día, hora, temporada)
- [ ] Descuentos por volumen
- [ ] Cupones promocionales
- [ ] Wishlist de servicios
- [ ] Comparación de servicios
- [ ] Reviews y ratings integrados
- [ ] Recomendaciones IA
- [ ] Analytics dashboard
- [ ] Gift cards
- [ ] Servicios por suscripción

---

**Status:** ✅ MVP COMPLETO  
**Fecha:** Enero 2024  
**Desarrollador:** Piums Platform Team  
**Siguiente paso:** booking-service
