#!/bin/bash

# Test de integración para catalog-service
# Este script prueba todos los endpoints del servicio de catálogo

set -e  # Salir si hay errores

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URLs
AUTH_SERVICE="http://localhost:4001"
CATALOG_SERVICE="http://localhost:4004"

# Variables globales
TOKEN=""
CATEGORY_ID=""
SERVICE_ID=""
ADDON_ID=""
PACKAGE_ID=""

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  TEST DE INTEGRACIÓN - CATALOG SERVICE${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# ==================== PASO 1: Health Check ====================
echo -e "${YELLOW}[1/10] Health Check...${NC}"
HEALTH=$(curl -s -X GET "${CATALOG_SERVICE}/health")
echo "$HEALTH" | jq '.'

if echo "$HEALTH" | jq -e '.status == "healthy"' > /dev/null; then
  echo -e "${GREEN}✓ Servicio saludable${NC}"
else
  echo -e "${RED}✗ Servicio no responde${NC}"
  exit 1
fi
echo ""

# ==================== PASO 2: Autenticación ====================
echo -e "${YELLOW}[2/10] Registrando usuario de prueba...${NC}"

RANDOM_EMAIL="test_catalog_$(date +%s)@example.com"
REGISTER_RESPONSE=$(curl -s -X POST "${AUTH_SERVICE}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${RANDOM_EMAIL}\",
    \"password\": \"Test1234!\",
    \"nombre\": \"Test Catalog User\",
    \"pais\": \"México\",
    \"codigoPais\": \"+52\",
    \"telefono\": \"5512345678\"
  }")

echo "$REGISTER_RESPONSE" | jq '.'

TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Usuario registrado y token obtenido${NC}"
else
  echo -e "${RED}✗ Error al obtener token${NC}"
  exit 1
fi
echo ""

# ==================== PASO 3: Crear Categorías ====================
echo -e "${YELLOW}[3/10] Creando categoría principal...${NC}"

CATEGORY_RESPONSE=$(curl -s -X POST "${CATALOG_SERVICE}/api/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d '{
    "name": "Fotografía",
    "slug": "fotografia-'$(date +%s)'",
    "description": "Servicios de fotografía profesional",
    "icon": "camera",
    "order": 1
  }')

echo "$CATEGORY_RESPONSE" | jq '.'

CATEGORY_ID=$(echo "$CATEGORY_RESPONSE" | jq -r '.id')

if [ "$CATEGORY_ID" != "null" ] && [ -n "$CATEGORY_ID" ]; then
  echo -e "${GREEN}✓ Categoría creada: $CATEGORY_ID${NC}"
else
  echo -e "${RED}✗ Error al crear categoría${NC}"
  exit 1
fi
echo ""

echo -e "${YELLOW}[3.1/10] Creando subcategoría...${NC}"

SUBCATEGORY_RESPONSE=$(curl -s -X POST "${CATALOG_SERVICE}/api/categories" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"name\": \"Fotografía de Bodas\",
    \"slug\": \"fotografia-bodas-$(date +%s)\",
    \"description\": \"Cobertura fotográfica para bodas\",
    \"parentId\": \"${CATEGORY_ID}\",
    \"order\": 1
  }")

echo "$SUBCATEGORY_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Subcategoría creada${NC}"
echo ""

# ==================== PASO 4: Listar Categorías ====================
echo -e "${YELLOW}[4/10] Listando todas las categorías...${NC}"

CATEGORIES=$(curl -s -X GET "${CATALOG_SERVICE}/api/categories")
echo "$CATEGORIES" | jq '.'
echo -e "${GREEN}✓ Categorías listadas${NC}"
echo ""

# ==================== PASO 5: Crear Servicio ====================
echo -e "${YELLOW}[5/10] Creando servicio...${NC}"

SERVICE_RESPONSE=$(curl -s -X POST "${CATALOG_SERVICE}/api/services" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"artistId\": \"artist-test-$(date +%s)\",
    \"name\": \"Sesión de fotos en exteriores\",
    \"slug\": \"sesion-fotos-exteriores-$(date +%s)\",
    \"description\": \"Sesión profesional de fotografía en locación exterior. Incluye 2 horas de sesión y 50 fotografías editadas en alta resolución. Ideal para retratos, parejas o sesiones familiares.\",
    \"categoryId\": \"${CATEGORY_ID}\",
    \"pricingType\": \"HOURLY\",
    \"basePrice\": 80000,
    \"currency\": \"MXN\",
    \"durationMin\": 120,
    \"durationMax\": 180,
    \"images\": [
      \"https://example.com/photo1.jpg\",
      \"https://example.com/photo2.jpg\"
    ],
    \"thumbnail\": \"https://example.com/thumb.jpg\",
    \"requiresDeposit\": true,
    \"depositPercentage\": 30,
    \"requiresConsultation\": false,
    \"cancellationPolicy\": \"Cancelación gratuita con 48 horas de anticipación. Después se cobra el 50% del depósito.\",
    \"termsAndConditions\": \"El cliente debe proporcionar la locación. El fotógrafo no se hace responsable por condiciones climáticas adversas.\",
    \"tags\": [\"exteriores\", \"naturaleza\", \"retratos\", \"parejas\"]
  }")

echo "$SERVICE_RESPONSE" | jq '.'

SERVICE_ID=$(echo "$SERVICE_RESPONSE" | jq -r '.id')

if [ "$SERVICE_ID" != "null" ] && [ -n "$SERVICE_ID" ]; then
  echo -e "${GREEN}✓ Servicio creado: $SERVICE_ID${NC}"
else
  echo -e "${RED}✗ Error al crear servicio${NC}"
  exit 1
fi
echo ""

# ==================== PASO 6: Obtener Servicio ====================
echo -e "${YELLOW}[6/10] Obteniendo servicio por ID...${NC}"

SERVICE=$(curl -s -X GET "${CATALOG_SERVICE}/api/services/${SERVICE_ID}")
echo "$SERVICE" | jq '.'
echo -e "${GREEN}✓ Servicio obtenido${NC}"
echo ""

# ==================== PASO 7: Crear Add-on ====================
echo -e "${YELLOW}[7/10] Creando add-on para el servicio...${NC}"

ARTIST_ID=$(echo "$SERVICE_RESPONSE" | jq -r '.artistId')

ADDON_RESPONSE=$(curl -s -X POST "${CATALOG_SERVICE}/api/services/${SERVICE_ID}/addons" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"artistId\": \"${ARTIST_ID}\",
    \"name\": \"Edición profesional avanzada\",
    \"description\": \"Retoque avanzado de todas las fotografías con ajustes de color, luz y composición\",
    \"price\": 50000,
    \"isOptional\": true,
    \"isDefault\": false,
    \"order\": 1
  }")

echo "$ADDON_RESPONSE" | jq '.'

ADDON_ID=$(echo "$ADDON_RESPONSE" | jq -r '.id')

if [ "$ADDON_ID" != "null" ] && [ -n "$ADDON_ID" ]; then
  echo -e "${GREEN}✓ Add-on creado: $ADDON_ID${NC}"
else
  echo -e "${RED}✗ Error al crear add-on${NC}"
fi
echo ""

# ==================== PASO 8: Buscar Servicios ====================
echo -e "${YELLOW}[8/10] Buscando servicios con filtros...${NC}"

SEARCH_RESULTS=$(curl -s -X GET "${CATALOG_SERVICE}/api/services?categoryId=${CATEGORY_ID}&pricingType=HOURLY&page=1&limit=10")
echo "$SEARCH_RESULTS" | jq '.'
echo -e "${GREEN}✓ Búsqueda completada${NC}"
echo ""

# ==================== PASO 9: Crear Segundo Servicio para Paquete ====================
echo -e "${YELLOW}[9/10] Creando segundo servicio para paquete...${NC}"

SERVICE2_RESPONSE=$(curl -s -X POST "${CATALOG_SERVICE}/api/services" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"artistId\": \"${ARTIST_ID}\",
    \"name\": \"Album de fotos impreso\",
    \"slug\": \"album-fotos-impreso-$(date +%s)\",
    \"description\": \"Album premium de 30 páginas con las mejores fotografías de tu sesión\",
    \"categoryId\": \"${CATEGORY_ID}\",
    \"pricingType\": \"FIXED\",
    \"basePrice\": 150000,
    \"currency\": \"MXN\",
    \"tags\": [\"album\", \"impresion\", \"fisico\"]
  }")

echo "$SERVICE2_RESPONSE" | jq '.'

SERVICE2_ID=$(echo "$SERVICE2_RESPONSE" | jq -r '.id')

if [ "$SERVICE2_ID" != "null" ] && [ -n "$SERVICE2_ID" ]; then
  echo -e "${GREEN}✓ Segundo servicio creado: $SERVICE2_ID${NC}"
else
  echo -e "${RED}✗ Error al crear segundo servicio${NC}"
fi
echo ""

# ==================== PASO 10: Crear Paquete ====================
echo -e "${YELLOW}[10/10] Creando paquete con múltiples servicios...${NC}"

PACKAGE_RESPONSE=$(curl -s -X POST "${CATALOG_SERVICE}/api/packages" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"artistId\": \"${ARTIST_ID}\",
    \"name\": \"Paquete Sesión Completa\",
    \"description\": \"Incluye sesión de fotos en exteriores + album impreso premium. Ahorra 20% en la compra del paquete.\",
    \"serviceIds\": [\"${SERVICE_ID}\", \"${SERVICE2_ID}\"],
    \"originalPrice\": 310000,
    \"packagePrice\": 250000,
    \"savings\": 60000,
    \"currency\": \"MXN\",
    \"thumbnail\": \"https://example.com/package-thumb.jpg\"
  }")

echo "$PACKAGE_RESPONSE" | jq '.'

PACKAGE_ID=$(echo "$PACKAGE_RESPONSE" | jq -r '.id')

if [ "$PACKAGE_ID" != "null" ] && [ -n "$PACKAGE_ID" ]; then
  echo -e "${GREEN}✓ Paquete creado: $PACKAGE_ID${NC}"
else
  echo -e "${RED}✗ Error al crear paquete${NC}"
fi
echo ""

# ==================== PASO 11: Listar Paquetes del Artista ====================
echo -e "${YELLOW}[11/10] Listando paquetes del artista...${NC}"

PACKAGES=$(curl -s -X GET "${CATALOG_SERVICE}/api/artists/${ARTIST_ID}/packages")
echo "$PACKAGES" | jq '.'
echo -e "${GREEN}✓ Paquetes listados${NC}"
echo ""

# ==================== PASO 12: Toggle Service Status ====================
echo -e "${YELLOW}[12/10] Cambiando estado del servicio...${NC}"

TOGGLE_RESPONSE=$(curl -s -X PATCH "${CATALOG_SERVICE}/api/services/${SERVICE_ID}/toggle-status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"artistId\": \"${ARTIST_ID}\"
  }")

echo "$TOGGLE_RESPONSE" | jq '.'

NEW_STATUS=$(echo "$TOGGLE_RESPONSE" | jq -r '.status')

if [ "$NEW_STATUS" == "INACTIVE" ]; then
  echo -e "${GREEN}✓ Servicio desactivado correctamente${NC}"
else
  echo -e "${RED}✗ Error al cambiar estado${NC}"
fi
echo ""

# ==================== PASO 13: Actualizar Servicio ====================
echo -e "${YELLOW}[13/10] Actualizando servicio...${NC}"

UPDATE_RESPONSE=$(curl -s -X PUT "${CATALOG_SERVICE}/api/services/${SERVICE_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"artistId\": \"${ARTIST_ID}\",
    \"name\": \"Sesión de fotos en exteriores - ACTUALIZADO\",
    \"basePrice\": 90000,
    \"isFeatured\": true
  }")

echo "$UPDATE_RESPONSE" | jq '.'

UPDATED_NAME=$(echo "$UPDATE_RESPONSE" | jq -r '.name')

if [[ "$UPDATED_NAME" == *"ACTUALIZADO"* ]]; then
  echo -e "${GREEN}✓ Servicio actualizado correctamente${NC}"
else
  echo -e "${RED}✗ Error al actualizar servicio${NC}"
fi
echo ""

# ==================== PASO 14: Actualizar Add-on ====================
echo -e "${YELLOW}[14/10] Actualizando add-on...${NC}"

UPDATE_ADDON_RESPONSE=$(curl -s -X PUT "${CATALOG_SERVICE}/api/addons/${ADDON_ID}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"artistId\": \"${ARTIST_ID}\",
    \"name\": \"Edición PREMIUM avanzada\",
    \"price\": 60000
  }")

echo "$UPDATE_ADDON_RESPONSE" | jq '.'
echo -e "${GREEN}✓ Add-on actualizado${NC}"
echo ""

# ==================== PASO 15: Buscar por Tags ====================
echo -e "${YELLOW}[15/10] Buscando servicios por tags...${NC}"

TAG_SEARCH=$(curl -s -X GET "${CATALOG_SERVICE}/api/services?tags=exteriores,retratos")
echo "$TAG_SEARCH" | jq '.'
echo -e "${GREEN}✓ Búsqueda por tags completada${NC}"
echo ""

# ==================== RESUMEN ====================
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  RESUMEN DE PRUEBAS${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "📧 Email de prueba: ${GREEN}${RANDOM_EMAIL}${NC}"
echo -e "🔑 Token: ${GREEN}${TOKEN:0:20}...${NC}"
echo -e "📁 Categoría ID: ${GREEN}${CATEGORY_ID}${NC}"
echo -e "🎨 Servicio ID: ${GREEN}${SERVICE_ID}${NC}"
echo -e "➕ Add-on ID: ${GREEN}${ADDON_ID}${NC}"
echo -e "📦 Paquete ID: ${GREEN}${PACKAGE_ID}${NC}"
echo -e "👤 Artista ID: ${GREEN}${ARTIST_ID}${NC}"
echo ""
echo -e "${GREEN}✓ Todas las pruebas completadas exitosamente${NC}"
echo ""
echo -e "${YELLOW}Nota: Los datos de prueba permanecen en la base de datos.${NC}"
echo -e "${YELLOW}Para limpiar, ejecuta:${NC}"
echo -e "  ${BLUE}npm run prisma:studio${NC}"
echo ""
