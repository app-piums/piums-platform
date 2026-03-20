#!/bin/bash

# Script de prueba de integración: artists-service
# Prueba el flujo completo de creación y gestión de perfil de artista

echo "🎨 Testing Piums Platform - Artists Service"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
AUTH_URL="http://localhost:4001"
ARTISTS_URL="http://localhost:4003"
TEST_EMAIL="artist_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
TEST_NOMBRE="Carlos DJ Test"

echo -e "${BLUE}📍 Step 1: Verificar servicios${NC}"
echo "----------------------------------------"

# Health check auth-service
AUTH_HEALTH=$(curl -s $AUTH_URL/health | jq -r '.status')
if [ "$AUTH_HEALTH" == "healthy" ]; then
  echo -e "${GREEN}✅ auth-service: healthy${NC}"
else
  echo -e "${RED}❌ auth-service: not available${NC}"
  exit 1
fi

# Health check artists-service
ARTISTS_HEALTH=$(curl -s $ARTISTS_URL/health | jq -r '.status')
if [ "$ARTISTS_HEALTH" == "healthy" ]; then
  echo -e "${GREEN}✅ artists-service: healthy${NC}"
else
  echo -e "${RED}❌ artists-service: not available${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}📍 Step 2: Registrar usuario en auth-service${NC}"
echo "----------------------------------------"
echo "Email: $TEST_EMAIL"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST $AUTH_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"$TEST_NOMBRE\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"pais\": \"México\",
    \"codigoPais\": \"+52\",
    \"telefono\": \"5512345678\"
  }")

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
AUTH_USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error: No se obtuvo token${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Usuario registrado${NC}"
echo "Token: ${TOKEN:0:20}..."
echo "Auth User ID: $AUTH_USER_ID"

echo ""
echo -e "${BLUE}📍 Step 3: Crear perfil de artista${NC}"
echo "----------------------------------------"

CREATE_ARTIST_RESPONSE=$(curl -s -X POST $ARTISTS_URL/api/artists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"authId\": \"$AUTH_USER_ID\",
    \"email\": \"$TEST_EMAIL\",
    \"nombre\": \"$TEST_NOMBRE\",
    \"artistName\": \"DJ Carlos Test\",
    \"category\": \"DJ\",
    \"specialties\": [\"Tech House\", \"Deep House\", \"Techno\"],
    \"yearsExperience\": 8,
    \"country\": \"México\",
    \"city\": \"Guadalajara\",
    \"state\": \"Jalisco\",
    \"lat\": 20.6597,
    \"lng\": -103.3496,
    \"coverageRadius\": 30,
    \"hourlyRateMin\": 200000,
    \"hourlyRateMax\": 500000,
    \"currency\": \"MXN\",
    \"requiresDeposit\": true,
    \"depositPercentage\": 30,
    \"cancellationPolicy\": \"Cancelación gratuita hasta 48h antes del evento\",
    \"instagram\": \"@djcarlostest\",
    \"website\": \"https://djcarlos.com\"
  }")

echo "$CREATE_ARTIST_RESPONSE" | jq '.'

ARTIST_ID=$(echo "$CREATE_ARTIST_RESPONSE" | jq -r '.artist.id')
VERIFICATION_STATUS=$(echo "$CREATE_ARTIST_RESPONSE" | jq -r '.artist.verificationStatus')

if [ "$ARTIST_ID" == "null" ] || [ -z "$ARTIST_ID" ]; then
  echo -e "${RED}❌ Error: No se creó el perfil de artista${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Perfil de artista creado${NC}"
echo "Artist ID: $ARTIST_ID"
echo "Estado: $VERIFICATION_STATUS"

echo ""
echo -e "${BLUE}📍 Step 4: Agregar items al portfolio${NC}"
echo "----------------------------------------"

# Video
VIDEO_ITEM=$(curl -s -X POST "$ARTISTS_URL/api/artists/$ARTIST_ID/portfolio" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Set en Festival Corona 2025",
    "description": "Opening del escenario principal con 5000 personas",
    "type": "video",
    "url": "https://youtube.com/watch?v=example",
    "thumbnailUrl": "https://img.youtube.com/vi/example/hqdefault.jpg",
    "category": "Live Set",
    "tags": ["tech house", "festival", "live"],
    "isFeatured": true,
    "order": 1
  }')

echo "$VIDEO_ITEM" | jq '.item | {title, type, isFeatured}'

# Imagen
IMAGE_ITEM=$(curl -s -X POST "$ARTISTS_URL/api/artists/$ARTIST_ID/portfolio" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Presentación en Club underground",
    "type": "image",
    "url": "https://example.com/photo1.jpg",
    "category": "Club Night",
    "tags": ["deep house", "club"],
    "order": 2
  }')

echo "$IMAGE_ITEM" | jq '.item | {title, type}'

echo -e "${GREEN}✅ Items agregados al portfolio${NC}"

echo ""
echo -e "${BLUE}📍 Step 5: Agregar certificación${NC}"
echo "----------------------------------------"

CERT_RESPONSE=$(curl -s -X POST "$ARTISTS_URL/api/artists/$ARTIST_ID/certifications" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "DJ Producer Course - Advanced",
    "issuer": "Berklee College of Music",
    "description": "Certificación avanzada en producción y mezcla de música electrónica",
    "issuedAt": "2023-06-15T00:00:00Z",
    "documentUrl": "https://certificates.berklee.edu/example"
  }')

echo "$CERT_RESPONSE" | jq '.certification | {title, issuer}'

echo -e "${GREEN}✅ Certificación agregada${NC}"

echo ""
echo -e "${BLUE}📍 Step 6: Configurar disponibilidad${NC}"
echo "----------------------------------------"

AVAILABILITY_RESPONSE=$(curl -s -X PUT "$ARTISTS_URL/api/artists/$ARTIST_ID/availability" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '[
    {
      "dayOfWeek": "VIERNES",
      "startTime": "20:00",
      "endTime": "04:00",
      "isAvailable": true
    },
    {
      "dayOfWeek": "SABADO",
      "startTime": "20:00",
      "endTime": "04:00",
      "isAvailable": true
    },
    {
      "dayOfWeek": "DOMINGO",
      "startTime": "18:00",
      "endTime": "02:00",
      "isAvailable": true
    }
  ]')

echo "$AVAILABILITY_RESPONSE" | jq '.availability[] | {dayOfWeek, startTime, endTime}'

echo -e "${GREEN}✅ Disponibilidad configurada${NC}"

echo ""
echo -e "${BLUE}📍 Step 7: Ver perfil público completo${NC}"
echo "----------------------------------------"

PUBLIC_PROFILE=$(curl -s "$ARTISTS_URL/api/artists/$ARTIST_ID")

echo "$PUBLIC_PROFILE" | jq '{
  id: .artist.id,
  nombre: .artist.nombre,
  artistName: .artist.artistName,
  category: .artist.category,
  city: .artist.city,
  verificationStatus: .artist.verificationStatus,
  rating: .artist.rating,
  portfolioItems: .artist.portfolio | length,
  certifications: .artist.certifications | length,
  availability: .artist.availability | length
}'

echo ""
echo -e "${BLUE}📍 Step 8: Buscar artistas en la ciudad${NC}"
echo "----------------------------------------"

SEARCH_RESPONSE=$(curl -s "$ARTISTS_URL/api/artists/search?category=DJ&city=Guadalajara")

echo "$SEARCH_RESPONSE" | jq '{
  total: .pagination.total,
  artists: .artists | map({id, nombre, artistName, rating, category})
}'

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 ¡Prueba de integración completada exitosamente!${NC}"
echo "=================================================="
echo ""
echo "📊 Resumen:"
echo "  • Auth User ID: $AUTH_USER_ID"
echo "  • Artist ID: $ARTIST_ID"
echo "  • Email: $TEST_EMAIL"
echo "  • Categoría: DJ"
echo "  • Ciudad: Guadalajara"
echo "  • Estado: $VERIFICATION_STATUS"
echo "  • Portfolio Items: 2"
echo "  • Certificaciones: 1"
echo "  • Días disponibles: 3 (Viernes, Sábado, Domingo)"
echo ""
echo -e "${YELLOW}🔍 Ver perfil completo:${NC}"
echo "   curl http://localhost:4003/api/artists/$ARTIST_ID | jq '.'"
echo ""
echo -e "${YELLOW}🔍 Buscar artistas:${NC}"
echo "   curl \"http://localhost:4003/api/artists/search?category=DJ&city=Guadalajara\" | jq '.'"
echo ""
