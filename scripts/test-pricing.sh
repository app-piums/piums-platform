#!/bin/bash

# Script de prueba del sistema de pricing
# Asegúrate de tener catalog-service (4004) corriendo

echo "🧪 Pruebas del Sistema de Pricing Avanzado"
echo "==========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables de prueba
SERVICE_ID="test-service-123"

echo "${YELLOW}📋 Ejemplo 1: Calcular precio FIXED (precio fijo)${NC}"
echo "POST /api/pricing/calculate"
curl -s -X POST http://localhost:4004/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "'$SERVICE_ID'",
    "selectedAddonIds": [],
    "distanceKm": 0
  }' | jq
echo ""

echo "${YELLOW}📋 Ejemplo 2: Calcular precio BASE_PLUS_HOURLY con extras${NC}"
echo "POST /api/pricing/calculate"
curl -s -X POST http://localhost:4004/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "'$SERVICE_ID'",
    "durationMinutes": 180,
    "selectedAddonIds": ["addon-1", "addon-2"],
    "distanceKm": 25
  }' | jq
echo ""

echo "${YELLOW}📋 Ejemplo 3: Obtener resumen de pricing${NC}"
echo "GET /api/pricing/summary/:serviceId"
curl -s "http://localhost:4004/api/pricing/summary/${SERVICE_ID}" | jq
echo ""

echo "${YELLOW}📋 Ejemplo 4: Validar configuración de pricing${NC}"
echo "GET /api/pricing/validate/:serviceId"
curl -s "http://localhost:4004/api/pricing/validate/${SERVICE_ID}" | jq
echo ""

echo "${GREEN}✅ Pruebas completadas${NC}"
echo ""
echo "📝 Estructura del Request de Cálculo:"
echo "  {
    \"serviceId\": \"uuid\",
    \"durationMinutes\": 120,           // Opcional, requerido para BASE_PLUS_HOURLY
    \"selectedAddonIds\": [\"id1\"],      // Array de IDs de addons
    \"distanceKm\": 15.5,                // Distancia para calcular viaje
    \"locationLat\": 14.6349,           // Coordenadas (futuro)
    \"locationLng\": -90.5069
  }"
echo ""
echo "📝 Estructura del Response:"
echo "  {
    \"serviceId\": \"uuid\",
    \"currency\": \"MXN\",
    \"items\": [
      {
        \"type\": \"BASE\",
        \"name\": \"Servicio base\",
        \"qty\": 1,
        \"unitPriceCents\": 50000,
        \"totalPriceCents\": 50000
      },
      {
        \"type\": \"ADDON\",
        \"name\": \"Extra especial\",
        \"qty\": 1,
        \"unitPriceCents\": 10000,
        \"totalPriceCents\": 10000
      },
      {
        \"type\": \"TRAVEL\",
        \"name\": \"Desplazamiento (10 km)\",
        \"qty\": 1,
        \"unitPriceCents\": 5000,
        \"totalPriceCents\": 5000
      }
    ],
    \"subtotalCents\": 65000,
    \"totalCents\": 65000,
    \"depositRequiredCents\": 32500,
    \"breakdown\": {
      \"baseCents\": 50000,
      \"addonsCents\": 10000,
      \"travelCents\": 5000,
      \"discountsCents\": 0
    }
  }"
