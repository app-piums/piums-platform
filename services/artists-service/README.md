# Artists Service 🎨

Servicio de gestión de perfiles de artistas, portfolios y disponibilidad para la plataforma Piums.

## 📋 Características

### ✅ Implementado (Fase 1 - Crítico MVP)

- ✅ Modelo de datos con Prisma (Artist, Portfolio, Certification, Availability)
- ✅ Categorías de artistas: Músicos, Tatuadores, Fotógrafos, DJs, Maquilladores, Pintores, Escultores
- ✅ Sistema de verificación: PENDING → VERIFIED/REJECTED/SUSPENDED
- ✅ Portfolio multimedia (imágenes, videos, audio)
- ✅ Certificaciones y premios
- ✅ Calendario de disponibilidad semanal
- ✅ Geolocalización con radio de cobertura
- ✅ Pricing por hora (mínimo y máximo)
- ✅ Políticas de cancelación personalizadas
- ✅ Autenticación con JWT
- ✅ Rate limiting
- ✅ Error handling estructurado
- ✅ Logs estructurados
- ✅ Health check endpoint

### 🚧 Pendiente (Fases 2-3)

- ⏳ Calendario sincronizado con Google Calendar
- ⏳ Bloqueo automático de horarios
- ⏳ Configuración de servicios por temporada
- ⏳ Múltiples ubicaciones (estudios)
- ⏳ Staff/asistentes
- ⏳ Métricas de perfil (vistas, conversión)
- ⏳ Upload a S3/Cloudinary
- ⏳ Búsqueda por geolocalización avanzada

## 🚀 Instalación

```bash
cd services/artists-service
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
- `PORT` - Puerto del servicio (default: 4003)

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

El servicio estará disponible en `http://localhost:4003`

## 🔗 Endpoints

### Health Check
```bash
GET /health
```

### Búsqueda (Pública)
```bash
# Buscar artistas con filtros
GET /api/artists/search?category=MUSICO&city=CDMX&minRating=4.5&page=1&limit=20
```

### Perfil Público
```bash
# Ver perfil de artista
GET /api/artists/:id

# Ver portfolio
GET /api/artists/:id/portfolio

# Ver disponibilidad
GET /api/artists/:id/availability
```

### Gestión de Perfil (Autenticado)
```bash
# Crear perfil de artista
POST /api/artists
Authorization: Bearer {token}
Content-Type: application/json
{
  "authId": "user_123",
  "email": "artista@example.com",
  "nombre": "Juan Pérez",
  "artistName": "DJ Juan",
  "category": "DJ",
  "specialties": ["Tech House", "Deep House"],
  "yearsExperience": 5,
  "country": "México",
  "city": "Ciudad de México",
  "hourlyRateMin": 150000,
  "hourlyRateMax": 300000,
  "coverageRadius": 20
}

# Obtener mi perfil de artista
GET /api/artists/me/profile
Authorization: Bearer {token}

# Actualizar perfil
PUT /api/artists/:id
Authorization: Bearer {token}

# Eliminar perfil (soft delete)
DELETE /api/artists/:id
Authorization: Bearer {token}
```

### Portfolio
```bash
# Agregar item
POST /api/artists/:id/portfolio
Authorization: Bearer {token}
{
  "title": "Set en Festival 2025",
  "description": "Opening del escenario principal",
  "type": "video",
  "url": "https://youtube.com/watch?v=...",
  "tags": ["tech house", "live set"],
  "isFeatured": true
}

# Actualizar item
PUT /api/artists/:id/portfolio/:itemId
Authorization: Bearer {token}

# Eliminar item
DELETE /api/artists/:id/portfolio/:itemId
Authorization: Bearer {token}
```

### Certificaciones
```bash
# Agregar certificación
POST /api/artists/:id/certifications
Authorization: Bearer {token}
{
  "title": "DJ Producer Course",
  "issuer": "Berklee College of Music",
  "issuedAt": "2023-05-15T00:00:00Z",
  "documentUrl": "https://..."
}

# Eliminar certificación
DELETE /api/artists/:id/certifications/:certId
Authorization: Bearer {token}
```

### Disponibilidad
```bash
# Configurar horarios semanales
PUT /api/artists/:id/availability
Authorization: Bearer {token}
Content-Type: application/json
[
  {
    "dayOfWeek": "LUNES",
    "startTime": "09:00",
    "endTime": "18:00",
    "isAvailable": true
  },
  {
    "dayOfWeek": "MARTES",
    "startTime": "10:00",
    "endTime": "20:00",
    "isAvailable": true
  }
]
```

## 🔒 Seguridad

- JWT authentication en rutas protegidas
- Autorización: artistas solo modifican su propio perfil
- Rate limiting:
  - 100 requests/15min general
  - 3 creaciones/hora de perfiles
  - 20 updates/hora
  - 50 búsquedas/15min
- Validación con Zod
- Soft delete para perfiles eliminados
- CORS configurado

## 📊 Modelo de datos

```prisma
Artist {
  id, authId, email, nombre, artistName
  avatar, bio
  category (enum), specialties[], yearsExperience
  country, city, state, address
  lat, lng, coverageRadius
  hourlyRateMin, hourlyRateMax, currency
  cancellationPolicy, requiresDeposit, depositPercentage
  verificationStatus, verifiedAt, rejectionReason
  portfolio[], certifications[], availability[]
  website, instagram, facebook, youtube, tiktok
  isActive, rating, reviewCount, bookingCount
  createdAt, updatedAt, deletedAt
}

PortfolioItem {
  id, artistId
  title, description
  type (image/video/audio), url, thumbnailUrl
  category, tags[], order, isFeatured
}

Certification {
  id, artistId
  title, issuer, description, documentUrl
  issuedAt, expiresAt
}

Availability {
  id, artistId
  dayOfWeek (enum), startTime, endTime
  isAvailable, blockedDates[]
}
```

## 📂 Categorías de Artistas

- `MUSICO` - Músicos en general
- `TATUADOR` - Artistas de tatuajes
- `FOTOGRAFO` - Fotógrafos profesionales
- `MAQUILLADOR` - Maquilladores y estilistas
- `DJ` - DJs y productores
- `PINTOR` - Pintores y artistas visuales
- `ESCULTOR` - Escultores
- `OTRO` - Otras categorías

## 🔄 Estados de Verificación

- `PENDING` - Pendiente de verificación (default)
- `VERIFIED` - Verificado por administración
- `REJECTED` - Rechazado (con razón)
- `SUSPENDED` - Suspendido temporalmente

## 🤝 Integración con otros servicios

### auth-service ✅
- **Consume**: JWT tokens
- **Referencia**: Campo `authId` apunta al `id` del auth-service

### users-service 🔜
- **Coordinación**: Verificar que el usuario no tenga ya un perfil de artista

### catalog-service 🔜 (Pendiente)
- **Proveerá**: Información del artista para sus servicios

### booking-service 🔜 (Pendiente)
- **Proveerá**: Disponibilidad y información para reservas

### reviews-service 🔜 (Pendiente)
- **Recibirá**: Calificaciones que actualizarán `rating` y `reviewCount`

## 📝 Ejemplos de Uso

### 1. Crear perfil de artista

```bash
curl -X POST http://localhost:4003/api/artists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '{
    "authId": "user_123",
    "email": "dj@example.com",
    "nombre": "Carlos Méndez",
    "artistName": "DJ Carlos",
    "category": "DJ",
    "specialties": ["Tech House", "Techno"],
    "yearsExperience": 8,
    "country": "México",
    "city": "Guadalajara",
    "lat": 20.6597,
    "lng": -103.3496,
    "coverageRadius": 30,
    "hourlyRateMin": 200000,
    "hourlyRateMax": 500000,
    "currency": "MXN",
    "requiresDeposit": true,
    "depositPercentage": 30,
    "instagram": "@djcarlos",
    "website": "https://djcarlos.com"
  }'
```

### 2. Buscar artistas cercanos

```bash
curl "http://localhost:4003/api/artists/search?category=DJ&city=Guadalajara&minRating=4.0&page=1&limit=10"
```

### 3. Configurar disponibilidad

```bash
curl -X PUT http://localhost:4003/api/artists/{artistId}/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d '[
    {"dayOfWeek": "VIERNES", "startTime": "20:00", "endTime": "04:00", "isAvailable": true},
    {"dayOfWeek": "SABADO", "startTime": "20:00", "endTime": "04:00", "isAvailable": true}
  ]'
```

## 🐛 Troubleshooting

Ver [DATABASE_SETUP.md](DATABASE_SETUP.md) para configuración de base de datos.

## 📈 Roadmap

### Fase 2 (Post-MVP)
- Sistema de categorías y especialidades dinámicas
- Upload directo a S3/Cloudinary
- Geolocalización avanzada con Haversine
- Calendario integrado con Google Calendar
- Verificación automática con IA

### Fase 3 (Crecimiento)
- Múltiples ubicaciones por artista
- Staff y asistentes
- Métricas de conversión
- A/B testing de perfiles
- Recomendaciones con ML

---

**🎨 artists-service es el corazón del marketplace de Piums**
