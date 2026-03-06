# Reviews Service

Servicio de reseñas y calificaciones para la plataforma Piums. Permite a los clientes dejar reseñas después de completar reservas, a los artistas responder, y rastrea estadísticas automáticas de calificaciones.

## Características

- ⭐ **Sistema de Calificación**: Reseñas con estrellas (1-5) y comentarios opcionales
- 📸 **Fotos**: Hasta 5 fotos por reseña con descripciones
- 💬 **Respuestas**: Los artistas pueden responder a cada reseña
- 👍 **Votación**: Los usuarios pueden marcar reseñas como útiles o no útiles
- 🚩 **Reportes**: Sistema de moderación para reportar reseñas inapropiadas
- 📊 **Estadísticas**: Cálculo automático de calificaciones promedio y distribución
- ✅ **Verificación**: Solo las reservas completadas pueden ser reseñadas
- 🔔 **Notificaciones**: Integración con notifications-service

## Tecnologías

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js 4.22
- **ORM**: Prisma 6.19.2
- **Base de Datos**: PostgreSQL
- **Validación**: Zod 3.25
- **Autenticación**: JWT
- **Rate Limiting**: Express Rate Limit

## Database Schema

### Review
Reseña principal de un cliente para un artista y servicio específico.

```prisma
model Review {
  id                String         @id @default(uuid())
  bookingId         String         @unique
  clientId          String
  artistId          String
  serviceId         String
  rating            Int            // 1-5 stars
  comment           String?
  status            ReviewStatus   @default(APPROVED)
  isVerified        Boolean        @default(false)
  helpfulCount      Int            @default(0)
  notHelpfulCount   Int            @default(0)
  photos            ReviewPhoto[]
  response          ReviewResponse?
  reports           ReviewReport[]
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  deletedAt         DateTime?
}
```

**Business Rules:**
- Un booking solo puede tener una reseña (unique constraint)
- Solo bookings con status COMPLETED pueden ser reseñados
- El cliente puede editar su reseña dentro de 7 días
- Rating obligatorio (1-5), comentario opcional
- Soft delete preserva audit trail

### ReviewPhoto
Fotos adjuntas a una reseña.

```prisma
model ReviewPhoto {
  id          String    @id @default(uuid())
  reviewId    String
  url         String
  caption     String?
  order       Int       @default(0)
  createdAt   DateTime  @default(now())
  deletedAt   DateTime?
}
```

**Limits:**
- Máximo 5 fotos por reseña (validado en lógica de negocio)
- Campo `order` para controlar secuencia de visualización

### ReviewResponse
Respuesta del artista a una reseña.

```prisma
model ReviewResponse {
  id          String    @id @default(uuid())
  reviewId    String    @unique
  artistId    String
  message     String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?
}
```

**Business Rules:**
- Una reseña solo puede tener una respuesta (unique constraint)
- Solo el artista de la reseña puede responder
- El artista puede editar su respuesta
- Soft delete preserva respuestas

### ReviewReport
Sistema de moderación para reportar reseñas inapropiadas.

```prisma
model ReviewReport {
  id          String       @id @default(uuid())
  reviewId    String
  reportedBy  String
  reason      ReportReason
  description String?
  status      ReportStatus @default(PENDING)
  resolution  String?
  resolvedBy  String?
  resolvedAt  DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  deletedAt   DateTime?
}
```

**Report Reasons:**
- `SPAM`: contenido spam
- `OFFENSIVE`: lenguaje ofensivo
- `FAKE`: reseña falsa
- `INAPPROPRIATE`: contenido inapropiado
- `OTHER`: otra razón

**Report Status:**
- `PENDING`: esperando revisión
- `REVIEWED`: en proceso de revisión
- `RESOLVED`: acción tomada
- `DISMISSED`: sin acción necesaria

### ArtistRating
Estadísticas agregadas de calificación de un artista.

```prisma
model ArtistRating {
  id                 String   @id @default(uuid())
  artistId           String   @unique
  averageRating      Float    @default(0)
  rating1Count       Int      @default(0)
  rating2Count       Int      @default(0)
  rating3Count       Int      @default(0)
  rating4Count       Int      @default(0)
  rating5Count       Int      @default(0)
  totalReviews       Int      @default(0)
  totalWithComment   Int      @default(0)
  totalWithPhotos    Int      @default(0)
  responseRate       Float    @default(0)
  lastCalculatedAt   DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

**Auto-Calculation:**
- Se recalcula automáticamente al crear, actualizar o eliminar reseñas
- `averageRating`: Promedio de todas las reseñas APPROVED
- `rating1Count` - `rating5Count`: Distribución de calificaciones
- `responseRate`: (reseñas con respuesta / total reseñas) * 100
- `totalWithComment`: Reseñas que incluyen comentario
- `totalWithPhotos`: Reseñas que incluyen fotos

## API Endpoints

**Base URL**: `http://localhost:4008/api/reviews`

### Review Operations

#### 1. Create Review
```bash
POST /reviews
```

**Auth**: Required (JWT)  
**Rate Limit**: 5 requests / hour  
**Body**:
```json
{
  "bookingId": "uuid",
  "rating": 5,
  "comment": "Excelente servicio!",
  "photos": [
    {
      "url": "https://example.com/photo1.jpg",
      "caption": "Resultado final"
    }
  ]
}
```

**Business Rules:**
- El booking debe existir y estar COMPLETED
- El clientId del booking debe coincidir con el usuario autenticado
- Solo una reseña por booking
- Rating obligatorio (1-5)
- Máximo 5 fotos
- Comentario opcional (10-2000 caracteres)

**Response**:
```json
{
  "id": "uuid",
  "bookingId": "uuid",
  "clientId": "uuid",
  "artistId": "uuid",
  "serviceId": "uuid",
  "rating": 5,
  "comment": "Excelente servicio!",
  "status": "APPROVED",
  "helpfulCount": 0,
  "notHelpfulCount": 0,
  "photos": [...],
  "response": null,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

**Side Effects:**
- Actualiza estadísticas del artista (ArtistRating)
- Actualiza el booking con reviewId
- Envía notificación REVIEW_RECEIVED al artista

#### 2. Get Review by ID
```bash
GET /reviews/:id
```

**Auth**: Optional  
**Rate Limit**: 100 requests / 15 minutes

**Response**:
```json
{
  "id": "uuid",
  "rating": 5,
  "comment": "Excelente!",
  "photos": [...],
  "response": {
    "message": "Gracias por tu reseña!",
    "createdAt": "2024-01-15T11:00:00Z"
  },
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### 3. List Reviews
```bash
GET /reviews
```

**Auth**: Optional  
**Rate Limit**: 100 requests / 15 minutes

**Query Parameters**:
- `artistId` (optional): Filtrar por artista
- `clientId` (optional): Filtrar por cliente
- `serviceId` (optional): Filtrar por servicio
- `rating` (optional): Filtrar por calificación (1-5)
- `status` (optional): PENDING, APPROVED, REJECTED, HIDDEN
- `sortBy` (optional): recent (default), rating, helpful
- `page` (optional): Página (default: 1)
- `limit` (optional): Resultados por página (default: 20, max: 100)

**Examples**:
```bash
# Reseñas de un artista
GET /reviews?artistId=uuid

# Reseñas con 5 estrellas
GET /reviews?artistId=uuid&rating=5

# Reseñas más útiles
GET /reviews?artistId=uuid&sortBy=helpful

# Paginación
GET /reviews?artistId=uuid&page=2&limit=10
```

**Response**:
```json
{
  "reviews": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### 4. Update Review
```bash
PATCH /reviews/:id
```

**Auth**: Required (JWT)  
**Rate Limit**: 100 requests / 15 minutes

**Business Rules:**
- Solo el autor de la reseña puede editarla
- Solo dentro de los primeros 7 días
- No se puede cambiar el rating a una reseña con respuesta del artista

**Body**:
```json
{
  "rating": 4,
  "comment": "Actualizado..."
}
```

#### 5. Delete Review
```bash
DELETE /reviews/:id
```

**Auth**: Required (JWT)  
**Rate Limit**: 100 requests / 15 minutes

**Business Rules:**
- Solo el autor puede eliminar
- Soft delete (preserva datos)
- Actualiza estadísticas del artista

### Response Operations

#### 6. Respond to Review
```bash
POST /reviews/:id/respond
```

**Auth**: Required (JWT)  
**Rate Limit**: 20 requests / hour

**Business Rules:**
- Solo el artista de la reseña puede responder
- Una sola respuesta por reseña

**Body**:
```json
{
  "message": "Gracias por tu feedback!"
}
```

**Side Effects:**
- Actualiza responseRate del artista
- Envía notificación REVIEW_RESPONSE al cliente

#### 7. Update Response
```bash
PATCH /responses/:id
```

**Auth**: Required (JWT)  
**Rate Limit**: 20 requests / hour

**Body**:
```json
{
  "message": "Mensaje actualizado"
}
```

#### 8. Delete Response
```bash
DELETE /responses/:id
```

**Auth**: Required (JWT)  
**Rate Limit**: 20 requests / hour

**Side Effects:**
- Actualiza responseRate del artista

### Voting Operations

#### 9. Mark Review as Helpful
```bash
POST /reviews/:id/helpful
```

**Auth**: Optional  
**Rate Limit**: 50 requests / hour

**Body**:
```json
{
  "helpful": true  // true = helpful, false = not helpful
}
```

**Note**: Actualmente incrementa contadores. Para versión futura, implementar tracking de votos por usuario para evitar duplicados.

### Report Operations

#### 10. Report Review
```bash
POST /reviews/:id/report
```

**Auth**: Required (JWT)  
**Rate Limit**: 10 requests / day

**Body**:
```json
{
  "reason": "SPAM",
  "description": "Esta reseña contiene spam"
}
```

**Reasons**: SPAM, OFFENSIVE, FAKE, INAPPROPRIATE, OTHER

#### 11. Get Pending Reports (Admin)
```bash
GET /reports/pending
```

**Auth**: Required (JWT - Admin)  
**Rate Limit**: 100 requests / 15 minutes

**Query Parameters**:
- `page` (optional): default 1
- `limit` (optional): default 20, max 100

**Response**:
```json
{
  "reports": [
    {
      "id": "uuid",
      "review": {...},
      "reportedBy": "uuid",
      "reason": "SPAM",
      "description": "...",
      "status": "PENDING",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### Statistics Operations

#### 12. Get Artist Rating
```bash
GET /artists/:artistId/rating
```

**Auth**: Optional  
**Rate Limit**: 100 requests / 15 minutes

**Response**:
```json
{
  "artistId": "uuid",
  "averageRating": 4.5,
  "totalReviews": 120,
  "rating1Count": 2,
  "rating2Count": 3,
  "rating3Count": 15,
  "rating4Count": 30,
  "rating5Count": 70,
  "totalWithComment": 95,
  "totalWithPhotos": 45,
  "responseRate": 85.5,
  "lastCalculatedAt": "2024-01-15T10:00:00Z"
}
```

## Environment Variables

```env
# Server
PORT=4008
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/piums_reviews

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Service URLs
BOOKING_SERVICE_URL=http://localhost:4005
NOTIFICATIONS_SERVICE_URL=http://localhost:4006

# Review Settings
MAX_PHOTOS_PER_REVIEW=5
REVIEW_EDIT_WINDOW_DAYS=7
```

## Rate Limiting

El servicio implementa 5 niveles de rate limiting:

1. **General API**: 100 requests / 15 minutos
2. **Create Review**: 5 requests / hora (prevenir spam)
3. **Respond to Review**: 20 requests / hora
4. **Report Review**: 10 requests / día
5. **Mark Helpful**: 50 requests / hora

## Integration with Other Services

### booking-service (port 4005)

**Outgoing Requests:**
- `GET /api/bookings/:id` - Verificar que el booking existe y está COMPLETED
- `PATCH /api/bookings/:id` - Actualizar booking con reviewId

**Data Validation:**
- Verifica `booking.status === 'COMPLETED'`
- Verifica `booking.clientId === userId`
- Verifica que no exista `booking.reviewId` previo

### notifications-service (port 4006)

**Outgoing Requests:**
- `POST /api/notifications` - Enviar notificaciones

**Notification Types:**
- `REVIEW_RECEIVED`: Notifica al artista cuando recibe una nueva reseña
- `REVIEW_RESPONSE`: Notifica al cliente cuando el artista responde

## Scripts

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "prisma:push": "prisma db push",
  "prisma:studio": "prisma studio",
  "prisma:generate": "prisma generate"
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

El servicio estará disponible en `http://localhost:4008`

## Usage Examples

### Complete Review Flow

```bash
# 1. Cliente completa un booking (booking.status = COMPLETED)

# 2. Cliente crea una reseña
curl -X POST http://localhost:4008/api/reviews/reviews \
  -H "Authorization: Bearer <client_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "booking-uuid",
    "rating": 5,
    "comment": "Excelente servicio, muy profesional!",
    "photos": [
      {
        "url": "https://storage.piums.com/review1.jpg",
        "caption": "Resultado final"
      }
    ]
  }'

# 3. Artista recibe notificación REVIEW_RECEIVED

# 4. Artista responde a la reseña
curl -X POST http://localhost:4008/api/reviews/reviews/<review-id>/respond \
  -H "Authorization: Bearer <artist_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Muchas gracias por tu feedback! Fue un placer trabajar contigo."
  }'

# 5. Cliente recibe notificación REVIEW_RESPONSE

# 6. Otros usuarios votan si la reseña es útil
curl -X POST http://localhost:4008/api/reviews/reviews/<review-id>/helpful \
  -H "Content-Type: application/json" \
  -d '{
    "helpful": true
  }'

# 7. Ver estadísticas del artista
curl http://localhost:4008/api/reviews/artists/<artist-id>/rating
```

## Architecture Patterns

### Automatic Statistics Calculation

Cada vez que se crea, actualiza o elimina una reseña, las estadísticas del artista se recalculan automáticamente:

```typescript
// En review.service.ts
async createReview(data) {
  const review = await prisma.review.create({...});
  
  // Auto-calculate artist statistics
  await this.updateArtistRating(review.artistId);
  
  return review;
}
```

### Soft Delete Pattern

Todos los modelos usan soft delete para preservar audit trail:

```typescript
async deleteReview(id, userId) {
  const review = await prisma.review.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
  
  // Update statistics (excludes soft-deleted reviews)
  await this.updateArtistRating(review.artistId);
}
```

### Service-to-Service Communication

Usa JWT tokens con expiry corto para autenticación entre servicios:

```typescript
// En clients/booking.client.ts
async getBooking(bookingId, userId) {
  const token = generateServiceToken(userId);
  
  const response = await fetch(`${BOOKING_SERVICE_URL}/bookings/${bookingId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
}
```

## Error Handling

El servicio usa una clase `AppError` centralizada:

```typescript
class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
```

**Common Error Codes:**
- `400`: Validation error
- `401`: Unauthorized
- `403`: Forbidden (not owner, not artist, etc.)
- `404`: Review/booking not found
- `409`: Conflict (booking already reviewed)
- `500`: Internal server error

## Future Improvements

1. **Vote Tracking**: Implementar tracking de votos por usuario para evitar duplicados
2. **Media Storage**: Integración con S3/Cloudinary para upload de fotos
3. **Review Moderation**: Workflow completo de moderación con estados PENDING/APPROVED
4. **Review Analytics**: Dashboard de métricas para artistas
5. **Review Incentives**: Sistema de recompensas por dejar reseñas
6. **Sentiment Analysis**: Análisis automático del sentimiento de comentarios
7. **Review Templates**: Plantillas predefinidas para facilitar redacción
8. **Review Reminders**: Recordatorios automáticos después de completar booking

## Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "service": "reviews-service",
  "timestamp": "2024-01-15T10:00:00Z",
  "uptime": 123.456
}
```

## Support

Para problemas o preguntas, contactar al equipo de desarrollo de Piums Platform.
