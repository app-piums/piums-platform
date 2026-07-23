#!/bin/bash

# Test script para sistema de pricing con servicios reales
# Ejecutar después de seed-pricing-data.sql

BASE_URL="http://localhost:4004/api/pricing"

echo "🧪 Pruebas del Sistema de Pricing con datos reales"
echo "=================================================="
echo ""

# Test 1: Calcular precio FIXED (fotos corporativas)
echo "📋 Test 1: Calcular precio FIXED - $1,500 fijo"
echo "POST /api/pricing/calculate"
curl -s -X POST "$BASE_URL/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-fixed-001",
    "distanceKm": 0
  }' | jq '.'
echo ""
echo ""

# Test 2: Calcular precio BASE_PLUS_HOURLY sin tiempo extra
echo "📋 Test 2: DJ para eventos - 3 horas incluidas (sin extra)"
echo "POST /api/pricing/calculate"
curl -s -X POST "$BASE_URL/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-hourly-001",
    "durationMinutes": 180,
    "selectedAddonIds": [],
    "distanceKm": 5
  }' | jq '.'
echo ""
echo ""

# Test 3: Calcular precio BASE_PLUS_HOURLY con todo
echo "📋 Test 3: DJ para eventos - 4 horas + addons + 25km viaje"
echo "POST /api/pricing/calculate"
curl -s -X POST "$BASE_URL/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-hourly-001",
    "durationMinutes": 240,
    "selectedAddonIds": ["addon-dj-001", "addon-dj-002"],
    "distanceKm": 25
  }' | jq '.'
echo ""
echo ""

# Test 4: Calcular precio PACKAGE
echo "📋 Test 4: Maquillaje profesional - 2.5 hrs + addons + viaje"
echo "POST /api/pricing/calculate"
curl -s -X POST "$BASE_URL/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-package-001",
    "durationMinutes": 150,
    "selectedAddonIds": ["addon-makeup-001"],
    "distanceKm": 20
  }' | jq '.'
echo ""
echo ""

# Test 5: Ver resumen de pricing del DJ
echo "📋 Test 5: Resumen de pricing - DJ para eventos"
echo "GET /api/pricing/summary/service-hourly-001"
curl -s "$BASE_URL/summary/service-hourly-001" | jq '.'
echo ""
echo ""

# Test 6: Validar configuración
echo "📋 Test 6: Validar configuración de pricing"
echo "GET /api/pricing/validate/service-hourly-001"
curl -s "$BASE_URL/validate/service-hourly-001" | jq '.'
echo ""
echo ""

# Test 7: Distancia excesiva (debe fallar)
echo "📋 Test 7: Error - Distancia excede máximo (60km > 50km max)"
echo "POST /api/pricing/calculate"
curl -s -X POST "$BASE_URL/calculate" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "service-hourly-001",
    "durationMinutes": 180,
    "distanceKm": 60
  }' | jq '.'
echo ""
echo ""

echo "✅ Pruebas completadas"
echo ""
echo "📊 Resumen de servicios de prueba:"
echo "  - service-fixed-001: Sesión de fotos (FIXED - $1,500)"
echo "  - service-hourly-001: DJ para eventos (BASE_PLUS_HOURLY - $5,000 base + $10/min)"
echo "  - service-package-001: Maquillaje (PACKAGE - $2,000 por 2 hrs)"
