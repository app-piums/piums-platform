#!/bin/bash

# ============================================================================
# SEED COMPLETO: Escenario de Prueba Realista
# Cliente: Ana Cifuentes (client01@piums.com)
# Artistas: Rob Photography, DJ Alex, Diego Ink
# Incluye: Servicios, Reservas, Chats, Reviews
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌱 Iniciando seed completo de datos de prueba...${NC}\n"

# ============================================================================
# PASO 1: Obtener IDs de usuarios
# ============================================================================

echo -e "${YELLOW}[1/4] Obteniendo IDs de usuarios...${NC}"

# IDs del auth-service
CLIENT_AUTH_ID=$(docker exec piums-postgres psql -U piums -d piums_auth -t -c \
  "SELECT id FROM public.users WHERE email = 'client01@piums.com' LIMIT 1;" | xargs)
ARTIST02_AUTH_ID=$(docker exec piums-postgres psql -U piums -d piums_auth -t -c \
  "SELECT id FROM public.users WHERE email = 'artist02@piums.com' LIMIT 1;" | xargs)
ARTIST03_AUTH_ID=$(docker exec piums-postgres psql -U piums -d piums_auth -t -c \
  "SELECT id FROM public.users WHERE email = 'artist03@piums.com' LIMIT 1;" | xargs)
ARTIST05_AUTH_ID=$(docker exec piums-postgres psql -U piums -d piums_auth -t -c \
  "SELECT id FROM public.users WHERE email = 'artist05@piums.com' LIMIT 1;" | xargs)

if [ -z "$CLIENT_AUTH_ID" ] || [ -z "$ARTIST02_AUTH_ID" ]; then
  echo -e "${RED}❌ Error: No se encontraron usuarios. Asegúrate de haber ejecutado seed.sh primero.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Client01: $CLIENT_AUTH_ID${NC}"
echo -e "${GREEN}✓ Artist02: $ARTIST02_AUTH_ID${NC}"
echo -e "${GREEN}✓ Artist03: $ARTIST03_AUTH_ID${NC}"
echo -e "${GREEN}✓ Artist05: $ARTIST05_AUTH_ID${NC}\n"

# ============================================================================
# PASO 2: Ejecutar SQL con parámetros
# ============================================================================

echo -e "${YELLOW}[2/4] Ejecutando seed SQL...${NC}"

# Crear archivo SQL temporal con variables sustituidas
TEMP_SQL=$(mktemp)
cat scripts/seed-complete-test-scenario.sql | \
  sed "s/:client_auth_id/'$CLIENT_AUTH_ID'/g" | \
  sed "s/:artist02_auth_id/'$ARTIST02_AUTH_ID'/g" | \
  sed "s/:artist03_auth_id/'$ARTIST03_AUTH_ID'/g" | \
  sed "s/:artist05_auth_id/'$ARTIST05_AUTH_ID'/g" > "$TEMP_SQL"

# Ejecutar el SQL
docker exec piums-postgres psql -U piums -d piums_catalog -f /dev/stdin < "$TEMP_SQL" 2>/dev/null || true
docker exec piums-postgres psql -U piums -d piums_booking -f /dev/stdin < "$TEMP_SQL" 2>/dev/null || true
docker exec piums-postgres psql -U piums -d piums_artists -f /dev/stdin < "$TEMP_SQL" 2>/dev/null || true
docker exec piums-postgres psql -U piums -d piums_reviews -f /dev/stdin < "$TEMP_SQL" 2>/dev/null || true
docker exec piums-postgres psql -U piums -d piums_chat -f /dev/stdin < "$TEMP_SQL" 2>/dev/null || true

rm "$TEMP_SQL"

echo -e "${GREEN}✓ SQL ejecutado${NC}\n"

# ============================================================================
# PASO 3: Verificar datos creados
# ============================================================================

echo -e "${YELLOW}[3/4] Verificando datos...${NC}"

SERVICES_COUNT=$(docker exec piums-postgres psql -U piums -d piums_catalog -t -c \
  "SELECT COUNT(*) FROM service WHERE artist_id IN (SELECT id FROM piums_artists.artist WHERE auth_id IN ('$ARTIST02_AUTH_ID', '$ARTIST03_AUTH_ID', '$ARTIST05_AUTH_ID'));" | xargs)

BOOKINGS_COUNT=$(docker exec piums-postgres psql -U piums -d piums_booking -t -c \
  "SELECT COUNT(*) FROM booking WHERE client_id = (SELECT id FROM piums_users.user WHERE auth_id = '$CLIENT_AUTH_ID' LIMIT 1);" | xargs)

REVIEWS_COUNT=$(docker exec piums-postgres psql -U piums -d piums_reviews -t -c \
  "SELECT COUNT(*) FROM review WHERE client_id = (SELECT id FROM piums_users.user WHERE auth_id = '$CLIENT_AUTH_ID' LIMIT 1);" | xargs)

MESSAGES_COUNT=$(docker exec piums-postgres psql -U piums -d piums_chat -t -c \
  "SELECT COUNT(*) FROM message WHERE sender_id IN (SELECT id FROM piums_users.user WHERE auth_id = '$CLIENT_AUTH_ID') OR sender_id IN (SELECT id FROM piums_artists.artist WHERE auth_id IN ('$ARTIST02_AUTH_ID', '$ARTIST03_AUTH_ID', '$ARTIST05_AUTH_ID'));" | xargs)

echo -e "${GREEN}✓ Servicios: $SERVICES_COUNT${NC}"
echo -e "${GREEN}✓ Reservas: $BOOKINGS_COUNT${NC}"
echo -e "${GREEN}✓ Reviews: $REVIEWS_COUNT${NC}"
echo -e "${GREEN}✓ Mensajes: $MESSAGES_COUNT${NC}\n"

# ============================================================================
# PASO 4: Crear backup
# ============================================================================

echo -e "${YELLOW}[4/4] Creando backup SQL...${NC}"

BACKUP_FILE="backups/test-data-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p backups

# Exportar datos
{
  # Catálogo
  docker exec piums-postgres pg_dump -U piums -d piums_catalog --data-only \
    -t service -t artist_availability_rule 2>/dev/null
  
  # Bookings
  docker exec piums-postgres pg_dump -U piums -d piums_booking --data-only \
    -t booking -t booking_status_change 2>/dev/null
  
  # Reviews
  docker exec piums-postgres pg_dump -U piums -d piums_reviews --data-only \
    -t review 2>/dev/null
  
  # Chat
  docker exec piums-postgres pg_dump -U piums -d piums_chat --data-only \
    -t conversation -t message 2>/dev/null
} > "$BACKUP_FILE"

echo -e "${GREEN}✓ Backup creado: $BACKUP_FILE${NC}\n"

# ============================================================================
# RESUMEN
# ============================================================================

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ SEED COMPLETO EXITOSO${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}📊 Datos Creados:${NC}"
echo "  • Servicios: $SERVICES_COUNT"
echo "  • Reservas: $BOOKINGS_COUNT"
echo "  • Reviews: $REVIEWS_COUNT"
echo "  • Mensajes: $MESSAGES_COUNT\n"

echo -e "${BLUE}👤 Cliente Principal:${NC}"
echo "  • Email: client01@piums.com (Ana Cifuentes)"
echo "  • ID: $(docker exec piums-postgres psql -U piums -d piums_users -t -c "SELECT id FROM \"user\" WHERE auth_id = '$CLIENT_AUTH_ID' LIMIT 1;" | xargs)\n"

echo -e "${BLUE}🎨 Artistas Participantes:${NC}"
echo "  • artist02@piums.com (Rob Photography)"
echo "  • artist03@piums.com (DJ Alex)"
echo "  • artist05@piums.com (Diego Ink)\n"

echo -e "${BLUE}📁 Backup:${NC}"
echo "  • Archivo: $BACKUP_FILE"
echo "  • Tamaño: $(du -h "$BACKUP_FILE" | cut -f1)\n"

echo -e "${BLUE}🔄 Para restaurar en futuro:${NC}"
echo "  docker exec piums-postgres psql -U piums < $BACKUP_FILE\n"

echo -e "${BLUE}🌐 Prueba en los frontends:${NC}"
echo "  • Web Artist: http://localhost:3001"
echo "  • Web Client: http://localhost:3000"
echo "  • Login: client01@piums.com / Test1234!\n"
