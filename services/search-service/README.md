# Search Service

Servicio de búsqueda y descubrimiento para la plataforma Piums. Proporciona búsqueda avanzada de artistas y servicios con filtros, ordenamiento, autocomplete y analytics.

## Características

- 🔍 **Búsqueda de Artistas**: Por nombre, ubicación, especialidades, rating, precio
- 🎯 **Búsqueda de Servicios**: Por título, categoría, tags, artista, ubicación
- ⚡ **Autocomplete**: Sugerencias en tiempo real para UX mejorada
- 📊 **Analytics**: Tracking de búsquedas populares y patrones de uso
- 🗃️ **Indexación**: Sistema de indexación automática desde otros servicios
- 🚀 **Performance**: Índices denormalizados para búsquedas ultra-rápidas
- 🔄 **Sincronización**: Actualización de datos desde artists, catalog y reviews services

## Tecnologías

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js 4.22
- **ORM**: Prisma 6.19.2
- **Base de Datos**: PostgreSQL with indexes
- **Validación**: Zod 3.25
- **Rate Limiting**: Express Rate Limit

## Arquitectura

Este servicio mantiene índices denormalizados de artistas y servicios para búsquedas rápidas:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Artists    │     │   Catalog    │     │   Reviews    │
│   Service    │────▶│   Service    │────▶│   Service    │
│  (Port 4003) │     │  (Port 4004) │     │  (Port 4008) │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       └────────────────────┼─────────────────────┘
                            ▼
                   ┌──────────────────┐
                   │ Search Service   │
                   │  (Port 4009)     │
                   │                  │
                   │  ArtistIndex     │
                   │  ServiceIndex    │
                   │  SearchQuery     │
                   └──────────────────┘
```

## Database Schema

### ArtistIndex
Índice denormalizado de artistas para búsqueda rápida.

```prisma
model ArtistIndex {
  id                String   @id
  name              String
  bio               String?
  specialties       String[]
  city              String?
  state             String?
  country           String
  averageRating     Float
  totalReviews      Int
  hourlyRateMin     Float?
  hourlyRateMax     Float?
  isVerified        Boolean
  isActive          Boolean
  isAvailable       Boolean
  servicesCount     Int
  serviceIds        String[]
  serviceTitles     String[]
  searchVector      tsvector?
  lastSyncedAt      DateTime
}
```

**Índices:**
- name, city, state, averageRating, hourlyRateMin, isActive, isAvailable
- Full-text search vector para búsquedas avanzadas

### ServiceIndex
Índice denormalizado de servicios para búsqueda rápida.

```prisma
model ServiceIndex {
  id                String   @id
  artistId          String
  artistName        String
  title             String
  description       String
  category          String
  tags              String[]
  price             Float
  currency          String
  pricingType       String
  city              String?
  state             String?
  country           String
  artistRating      Float
  artistReviews     Int
  isActive          Boolean
  isAvailable       Boolean
  totalBookings     Int
  searchVector      tsvector?
  lastSyncedAt      DateTime
}
```

**Índices:**
- artistId, category, price, artistRating, isActive, city
- Full-text search vector

### SearchQuery
Log de búsquedas para analytics.

```prisma
model SearchQuery {
  id              String
  query           String
  queryType       SearchQueryType
  filters         Json?
  resultsCount    Int
  userId          String?
  userRole        String?
  responseTime    Int?
  clickedResultId String?
  clickPosition   Int?
  createdAt       DateTime
}
```

### IndexStatus
Estado de sincronización de índices.

```prisma
model IndexStatus {
  id              String
  indexType       IndexType
  totalRecords    Int
  status          IndexingStatus
  progress        Float
  lastIndexedAt   DateTime?
  lastFullIndexAt DateTime?
  lastError       String?
}
```

## API Endpoints

**Base URL**: `http://localhost:4009/api/search`

### Search Operations

#### 1. Search Artists
```bash
GET /artists
```

**Query Parameters**:
- `query` (optional): Texto a buscar en nombre, bio, especialidades
- `city` (optional): Ciudad del artista
- `state` (optional): Estado del artista
- `country` (optional): País (default: Mexico)
- `specialties` (optional): Array de especialidades
- `minRating` (optional): Rating mínimo (0-5)
- `minPrice` (optional): Precio mínimo por hora
- `maxPrice` (optional): Precio máximo por hora
- `isVerified` (optional): Solo artistas verificados
- `isAvailable` (optional): Solo artistas disponibles
- `sortBy` (optional): relevance, rating, reviews, price_low, price_high, recent
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Resultados por página (default: 20, max: 100)

**Examples**:
```bash
# Buscar artistas por nombre
GET /artists?query=carlos

# Artistas en CDMX con rating alto
GET /artists?city=Ciudad de México&minRating=4&sortBy=rating

# Artistas disponibles con precio específico
GET /artists?isAvailable=true&minPrice=500&maxPrice=2000

# Artistas verificados con especialidades
GET /artists?isVerified=true&specialties=DJ&specialties=Músico
```

**Response**:
```json
{
  "artists": [
    {
      "id": "uuid",
      "name": "Carlos DJ",
      "bio": "DJ profesional con 10 años de experiencia",
      "specialties": ["DJ", "Música electrónica"],
      "city": "Ciudad de México",
      "state": "CDMX",
      "averageRating": 4.8,
      "totalReviews": 45,
      "hourlyRateMin": 1000,
      "hourlyRateMax": 3000,
      "isVerified": true,
      "isAvailable": true,
      "servicesCount": 5
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 2. Search Services
```bash
GET /services
```

**Query Parameters**:
- `query` (optional): Texto a buscar en título, descripción
- `category` (optional): Categoría del servicio
- `tags` (optional): Array de tags
- `artistId` (optional): ID del artista
- `city` (optional): Ciudad
- `state` (optional): Estado
- `country` (optional): País (default: Mexico)
- `minPrice` (optional): Precio mínimo
- `maxPrice` (optional): Precio máximo
- `minRating` (optional): Rating mínimo del artista
- `isAvailable` (optional): Solo servicios disponibles
- `sortBy` (optional): relevance, rating, price_low, price_high, popular, recent
- `page` (optional): Número de página (default: 1)
- `limit` (optional): Resultados por página (default: 20, max: 100)

**Examples**:
```bash
# Buscar servicios de DJ
GET /services?query=DJ&category=Música

# Servicios por precio
GET /services?minPrice=1000&maxPrice=5000&sortBy=price_low

# Servicios populares de un artista
GET /services?artistId=uuid&sortBy=popular

# Servicios con tags específicos
GET /services?tags=boda&tags=fiesta&minRating=4
```

**Response**:
```json
{
  "services": [
    {
      "id": "uuid",
      "artistId": "uuid",
      "artistName": "Carlos DJ",
      "title": "DJ para Bodas",
      "description": "Servicio completo de DJ para bodas...",
      "category": "Música",
      "tags": ["DJ", "boda", "fiesta"],
      "price": 2500,
      "currency": "MXN",
      "pricingType": "FIXED",
      "city": "Ciudad de México",
      "artistRating": 4.8,
      "artistReviews": 45,
      "isAvailable": true,
      "totalBookings": 120
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 30,
    "totalPages": 2
  }
}
```

#### 3. Autocomplete
```bash
GET /autocomplete
```

**Query Parameters**:
- `query` (required): Texto a autocompletar (min 2 caracteres)
- `type` (optional): artists, services, all (default: all)
- `limit` (optional): Máximo de resultados (default: 10, max: 50)

**Example**:
```bash
GET /autocomplete?query=dj&type=all&limit=10
```

**Response**:
```json
{
  "artists": [
    {
      "id": "uuid",
      "name": "Carlos DJ",
      "city": "CDMX",
      "averageRating": 4.8,
      "totalReviews": 45
    }
  ],
  "services": [
    {
      "id": "uuid",
      "title": "DJ para Bodas",
      "artistName": "Carlos DJ",
      "category": "Música",
      "price": 2500,
      "city": "CDMX",
      "artistRating": 4.8
    }
  ],
  "suggestions": []
}
```

### Index Management Operations

#### 4. Index Single Artist
```bash
POST /index/artist
```

**Auth**: Required (JWT)  
**Rate Limit**: 10 requests / hour

**Body**:
```json
{
  "artistId": "uuid"
}
```

**Response**:
```json
{
  "message": "Artista indexado exitosamente",
  "data": {
    "id": "uuid",
    "name": "Carlos DJ",
    // ... indexed data
    "lastSyncedAt": "2024-01-15T10:00:00Z"
  }
}
```

#### 5. Index Single Service
```bash
POST /index/service
```

**Auth**: Required (JWT)  
**Rate Limit**: 10 requests / hour

**Body**:
```json
{
  "serviceId": "uuid"
}
```

#### 6. Bulk Index
```bash
POST /index/bulk
```

**Auth**: Required (JWT)  
**Rate Limit**: 10 requests / hour

**Body**:
```json
{
  "type": "artists" | "services" | "all",
  "batchSize": 100
}
```

**Response**:
```json
{
  "message": "Indexación iniciada en segundo plano",
  "type": "all",
  "batchSize": 100
}
```

**Note**: La indexación se ejecuta asíncronamente. Use el endpoint de status para monitorear el progreso.

#### 7. Get Index Status
```bash
GET /index/status?type=ARTISTS
```

**Auth**: Required (JWT)

**Query Parameters**:
- `type` (optional): ARTISTS, SERVICES (si se omite, retorna ambos)

**Response**:
```json
{
  "id": "uuid",
  "indexType": "ARTISTS",
  "totalRecords": 1523,
  "status": "COMPLETED",
  "progress": 100,
  "lastIndexedAt": "2024-01-15T10:30:00Z",
  "lastFullIndexAt": "2024-01-15T10:30:00Z",
  "lastError": null,
  "errorCount": 0
}
```

**Status Values**:
- `IDLE`: No indexing in progress
- `INDEXING`: Currently indexing
- `COMPLETED`: Last indexing successful
- `FAILED`: Last indexing failed

### Analytics Operations

#### 8. Get Popular Searches
```bash
GET /popular?limit=10
```

**Response**:
```json
[
  {
    "query": "dj",
    "queryType": "MIXED",
    "_count": {
      "query": 145
    }
  },
  {
    "query": "fotografo boda",
    "queryType": "ARTIST",
    "_count": {
      "query": 89
    }
  }
]
```

## Environment Variables

```env
# Server
PORT=4009
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/piums_search

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Service URLs
ARTISTS_SERVICE_URL=http://localhost:4003
CATALOG_SERVICE_URL=http://localhost:4004
REVIEWS_SERVICE_URL=http://localhost:4008

# Search Configuration
MAX_SEARCH_RESULTS=100
DEFAULT_PAGE_SIZE=20
AUTOCOMPLETE_MIN_CHARS=2
AUTOCOMPLETE_MAX_RESULTS=10

# Indexing
AUTO_INDEX_ENABLED=true
INDEX_BATCH_SIZE=100
```

## Rate Limiting

El servicio implementa 4 niveles de rate limiting:

1. **General API**: 100 requests / 15 minutos
2. **Search**: 30 requests / minuto
3. **Autocomplete**: 50 requests / minuto (no cuenta requests exitosos)
4. **Index Operations**: 10 requests / hora

## Integration with Other Services

### artists-service (port 4003)

**Outgoing Requests:**
- `GET /api/artists/:id` - Obtener datos de artista para indexar
- `GET /api/artists` - Obtener todos los artistas para bulk index

**Webhook Support** (future):
- Recibir notificación cuando un artista se crea/actualiza

### catalog-service (port 4004)

**Outgoing Requests:**
- `GET /api/services/:id` - Obtener datos de servicio para indexar
- `GET /api/services` - Obtener todos los servicios para bulk index
- `GET /api/services?artistId=uuid` - Obtener servicios de un artista

**Webhook Support** (future):
- Recibir notificación cuando un servicio se crea/actualiza

### reviews-service (port 4008)

**Outgoing Requests:**
- `GET /api/reviews/artists/:artistId/rating` - Obtener rating y stats del artista

**Webhook Support** (future):
- Recibir notificación cuando cambian las estadísticas de un artista

## Indexing Strategy

### Initial Index

Para indexar todo el catálogo al inicio:

```bash
# Indexar todos los artistas y servicios
curl -X POST http://localhost:4009/api/search/index/bulk \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "all",
    "batchSize": 100
  }'

# Monitorear progreso
curl http://localhost:4009/api/search/index/status \
  -H "Authorization: Bearer <token>"
```

### Incremental Updates

Cuando se crea/actualiza un artista o servicio:

```bash
# Indexar artista específico
curl -X POST http://localhost:4009/api/search/index/artist \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "artistId": "uuid"
  }'

# Indexar servicio específico
curl -X POST http://localhost:4009/api/search/index/service \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "uuid"
  }'
```

### Scheduled Re-indexing

Recomendado configurar un cron job para re-indexar periódicamente:

```bash
# Daily at 3 AM
0 3 * * * curl -X POST http://localhost:4009/api/search/index/bulk \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "all", "batchSize": 100}'
```

## Search Best Practices

### For Frontend Developers

**1. Autocomplete Implementation:**
```typescript
// Debounce autocomplete requests
const debouncedSearch = debounce(async (query) => {
  if (query.length < 2) return;
  
  const response = await fetch(
    `http://localhost:4009/api/search/autocomplete?query=${query}&type=all&limit=10`
  );
  const results = await response.json();
  // Update UI with results
}, 300);
```

**2. Search with Filters:**
```typescript
const searchParams = new URLSearchParams({
  query: 'dj',
  city: 'CDMX',
  minRating: '4',
  isAvailable: 'true',
  sortBy: 'rating',
  page: '1',
  limit: '20'
});

const response = await fetch(
  `http://localhost:4009/api/search/artists?${searchParams}`
);
```

**3. Pagination:**
```typescript
// Show "Load More" button
const loadMore = async (currentPage) => {
  const nextPage = currentPage + 1;
  const response = await fetch(
    `http://localhost:4009/api/search/artists?query=dj&page=${nextPage}&limit=20`
  );
  const data = await response.json();
  
  // Append results
  artists.push(...data.artists);
  
  // Check if more pages available
  const hasMore = nextPage < data.pagination.totalPages;
};
```

### For Backend Developers

**1. Webhook Integration:**

When an artist/service is created or updated, trigger re-indexing:

```typescript
// In artists-service or catalog-service
async function afterUpdate(record) {
  await fetch('http://localhost:4009/api/search/index/artist', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ artistId: record.id })
  });
}
```

**2. Monitoring:**

Check index health regularly:

```typescript
const checkIndexHealth = async () => {
  const response = await fetch(
    'http://localhost:4009/api/search/index/status',
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const statuses = await response.json();
  
  statuses.forEach(status => {
    if (status.status === 'FAILED') {
      alert(`Index ${status.indexType} failed: ${status.lastError}`);
    }
  });
};
```

## Performance Optimization

### Database Indexes

El schema incluye índices en:
- Campos de búsqueda frecuente (name, city, category)
- Campos de ordenamiento (averageRating, price)
- Campos de filtrado (isActive, isAvailable)

### Denormalization

Los índices están denormalizados para evitar JOINs:
- `ArtistIndex` incluye conteos de reviews, servicios, ratings
- `ServiceIndex` incluye nombre del artista, rating del artista

### Caching (Future)

Considerar implementar Redis para cachear:
- Búsquedas populares
- Resultados de autocomplete
- Stats de artistas/servicios

## Error Handling

El servicio usa códigos HTTP estándar:

- `200`: Success
- `400`: Validation error (Zod)
- `401`: Unauthorized (auth required)
- `404`: Resource not found
- `429`: Rate limit exceeded
- `500`: Internal server error

**Error Response Format:**
```json
{
  "error": "Error message",
  "details": [
    {
      "field": "minRating",
      "message": "Must be between 0 and 5"
    }
  ]
}
```

## Scripts

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "prisma:generate": "prisma generate",
  "prisma:push": "prisma db push",
  "prisma:studio": "prisma studio"
}
```

## Setup

1. **Instalar dependencias**:
```bash
pnpm install
```

2. **Configurar variables de entorno**:
```bash
cp .env.example .env
# Editar .env con tus valores
```

3. **Crear base de datos**:
```bash
node create-db.js
```

4. **Sincronizar schema**:
```bash
pnpm run prisma:push
```

5. **Iniciar servidor**:
```bash
pnpm run dev
```

6. **Indexar datos iniciales**:
```bash
# Obtener token de auth
TOKEN="your-jwt-token"

# Indexar todo
curl -X POST http://localhost:4009/api/search/index/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "all", "batchSize": 100}'
```

El servicio estará disponible en `http://localhost:4009`

## Future Improvements

1. **Elasticsearch Integration**: Para búsqueda full-text avanzada
2. **Geolocation Search**: Búsqueda por distancia desde ubicación del usuario
3. **Fuzzy Search**: Tolerancia a errores de tipeo
4. **Search Suggestions**: ML-based suggestions
5. **Search History**: Historial personal de búsquedas del usuario
6. **Saved Searches**: Guardar búsquedas favoritas
7. **Search Alerts**: Notificar cuando nuevo contenido match con búsqueda guardada
8. **Faceted Search**: Conteos de resultados por faceta
9. **Search Ranking**: ML model para ranking personalizado
10. **Real-time Sync**: WebSocket updates para índices en tiempo real

## Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "service": "search-service",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 123.456
}
```

## Support

Para problemas o preguntas, contactar al equipo de desarrollo de Piums Platform.
