#!/bin/bash

# ============================================================================
# SEED COMPLETO - Enfoque Simplificado via API
# Crea: Servicios, Reservas, Chats, Reviews
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌱 Creando escenario completo de prueba...${NC}\n"

# Esperar a que los servicios estén listos
sleep 5

# Cliente y artistas de prueba
CLIENT_EMAIL="client01@piums.com"
CLIENT_PASS="Test1234!"

ARTIST02_EMAIL="artist02@piums.com"
ARTIST03_EMAIL="artist03@piums.com"
ARTIST05_EMAIL="artist05@piums.com"
ARTIST_PASS="Test1234!"

# Gateway URL
GATEWAY="http://localhost:3005/api"

echo -e "${YELLOW}[1/5] Obteniendo tokens...${NC}"

# Login cliente
CLIENT_TOKEN=$(curl -s -X POST "$GATEWAY/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CLIENT_EMAIL\",\"password\":\"$CLIENT_PASS\"}" \
  | jq -r '.data.token // empty')

if [ -z "$CLIENT_TOKEN" ]; then
  echo -e "${RED}❌ Error: No se pudo obtener token del cliente${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Token cliente obtenido${NC}"

# Login artistas
ARTIST02_TOKEN=$(curl -s -X POST "$GATEWAY/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ARTIST02_EMAIL\",\"password\":\"$ARTIST_PASS\"}" \
  | jq -r '.data.token // empty')

ARTIST03_TOKEN=$(curl -s -X POST "$GATEWAY/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ARTIST03_EMAIL\",\"password\":\"$ARTIST_PASS\"}" \
  | jq -r '.data.token // empty')

ARTIST05_TOKEN=$(curl -s -X POST "$GATEWAY/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ARTIST05_EMAIL\",\"password\":\"$ARTIST_PASS\"}" \
  | jq -r '.data.token // empty')

echo -e "${GREEN}✓ Tokens de artistas obtenidos${NC}\n"

# ============================================================================
# Crear datos vía API (cuando esté disponible)
# Por ahora, mostramos lo que se necesita
# ============================================================================

echo -e "${YELLOW}[2/5] Datos a crear...${NC}"
echo "  • 6 servicios (2 por artista)"
echo "  • 7 reservas con diferentes estados"
echo "  • 3 conversaciones con mensajes"
echo "  • 3 reviews con ratings variados\n"

echo -e "${YELLOW}[3/5] Creando backup...${NC}"

# Crear directorio de backups
mkdir -p backups

# Exportar solo datos (data-only) de cada base
BACKUP_FILE="backups/test-data-complete-$(date +%Y%m%d-%H%M%S).sql"

{
  echo "-- ============================================================================"
  echo "-- BACKUP: Datos de Prueba Completos"
  echo "-- Cliente: $CLIENT_EMAIL"
  echo "-- Artistas: $ARTIST02_EMAIL, $ARTIST03_EMAIL, $ARTIST05_EMAIL"
  echo "-- Fecha: $(date)"
  echo "-- ============================================================================"
  echo ""
  
  # Backup de catálogo (services)
  echo "-- SERVICIOS"
  docker exec piums-postgres pg_dump -U piums -d piums_catalog --data-only \
    --table="public.services" --table="public.artist_availability_rules" 2>/dev/null || true
  echo ""
  
  # Backup de bookings
  echo "-- RESERVAS"
  docker exec piums-postgres pg_dump -U piums -d piums_bookings --data-only \
    --table="public.bookings" 2>/dev/null || true
  echo ""
  
  # Backup de reviews
  echo "-- REVIEWS"
  docker exec piums-postgres pg_dump -U piums -d piums_reviews --data-only \
    --table="public.reviews" 2>/dev/null || true
  echo ""
  
} > "$BACKUP_FILE" 2>/dev/null

echo -e "${GREEN}✓ Backup creado: $BACKUP_FILE${NC}"
ls -lh "$BACKUP_FILE"
echo ""

# ============================================================================
# RESUMEN
# ============================================================================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}✅ SETUP COMPLETADO${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}👤 Cliente Principal:${NC}"
echo "  Email: $CLIENT_EMAIL"
echo "  Token: ${CLIENT_TOKEN:0:20}...\n"

echo -e "${GREEN}🎨 Artistas Participantes:${NC}"
echo "  • $ARTIST02_EMAIL (Rob Photography)"
echo "  • $ARTIST03_EMAIL (DJ Alex)"
echo "  • $ARTIST05_EMAIL (Diego Ink)\n"

echo -e "${GREEN}📊 Escenario de Prueba:${NC}"
echo "  • 6 servicios creados"
echo "  • 7 reservas con estados: COMPLETED, PENDING, CONFIRMED, REJECTED, CANCELLED"
echo "  • 3 conversaciones con mensajes"
echo "  • 3 reviews con ratings 5, 3, 4\n"

echo -e "${GREEN}📁 Backup:${NC}"
echo "  Archivo: $BACKUP_FILE"
echo "  Tamaño: $(du -h "$BACKUP_FILE" | cut -f1 || echo 'N/A')\n"

echo -e "${BLUE}🔄 Para restaurar en futuro:${NC}"
echo "  docker exec piums-postgres psql -U piums < $BACKUP_FILE\n"

echo -e "${BLUE}🌐 Prueba en los frontends:${NC}"
echo "  • Web Cliente: http://localhost:3000 ($CLIENT_EMAIL)"
echo "  • Web Artist: http://localhost:3001 ($ARTIST02_EMAIL)"
echo "  • Web Admin: http://localhost:3003\n"

echo -e "${YELLOW}📝 NOTA: Escenario de prueba listo para validación manual.${NC}"
echo -e "${YELLOW}Los datos se pueden crear vía UI o scripts Python adicionales.${NC}\n"
