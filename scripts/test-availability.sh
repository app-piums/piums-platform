#!/bin/bash

# Script de prueba del sistema de disponibilidad
# Asegúrate de tener artists-service (4003) y booking-service (4005) corriendo

echo "🧪 Pruebas del Sistema de Disponibilidad"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables de prueba
ARTIST_ID="test-artist-123"
START_TIME="2026-02-25T10:00:00Z"
END_TIME="2026-02-25T12:00:00Z"

echo "${YELLOW}1. Verificar reservas existentes${NC}"
echo "GET /api/availability/check-reservation"
curl -s "http://localhost:4005/api/availability/check-reservation?artistId=${ARTIST_ID}&startAt=${START_TIME}&endAt=${END_TIME}" | jq
echo ""

echo "${YELLOW}2. Obtener reservas de un artista${NC}"
echo "GET /api/availability/artist/:artistId"
curl -s "http://localhost:4005/api/availability/artist/${ARTIST_ID}?startDate=2026-02-01&endDate=2026-02-28" | jq
echo ""

echo "${GREEN}✅ Pruebas completadas${NC}"
echo ""
echo "📝 Notas:"
echo "  - Usa artistId real de tu base de datos"
echo "  - Ajusta las fechas según necesites"
echo "  - Para crear reglas de disponibilidad y blackouts, usa directamente los servicios de Prisma"
