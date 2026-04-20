#!/bin/bash

# ============================================================================
# RESTORE: Restaurar Backups de Bases de Datos
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

if [ $# -eq 0 ]; then
  echo -e "${BLUE}Uso: bash scripts/restore-databases.sh [backup-name]${NC}"
  echo ""
  echo "Backups disponibles:"
  ls -lh backups/*.sql | awk '{print "  • " $NF}'
  echo ""
  echo "Ejemplo:"
  echo "  bash scripts/restore-databases.sh piums_auth-baseline.sql"
  echo "  bash scripts/restore-databases.sh piums_bookings-baseline.sql"
  echo ""
  exit 0
fi

BACKUP_FILE="backups/$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo -e "${RED}❌ Backup no encontrado: $BACKUP_FILE${NC}"
  exit 1
fi

echo -e "${BLUE}Restaurando: $BACKUP_FILE${NC}\n"

# Determinar base de datos basada en el nombre del archivo
if [[ "$BACKUP_FILE" == *"auth"* ]]; then
  DB="piums_auth"
elif [[ "$BACKUP_FILE" == *"users"* ]]; then
  DB="piums_users"
elif [[ "$BACKUP_FILE" == *"catalog"* ]]; then
  DB="piums_catalog"
elif [[ "$BACKUP_FILE" == *"bookings"* ]]; then
  DB="piums_bookings"
elif [[ "$BACKUP_FILE" == *"reviews"* ]]; then
  DB="piums_reviews"
else
  echo -e "${RED}❌ No se pudo determinar la base de datos${NC}"
  exit 1
fi

echo -e "${YELLOW}Base de datos destino: $DB${NC}\n"
echo -e "${YELLOW}⚠️  Advertencia: Esto sobrescribirá los datos existentes${NC}"
echo -e "${YELLOW}Presiona ENTER para continuar (Ctrl+C para cancelar)${NC}"
read

# Restaurar
docker exec -i piums-postgres psql -U piums -d "$DB" < "$BACKUP_FILE"

echo -e "${GREEN}✅ Restauración completada${NC}\n"

# Verificar
docker exec piums-postgres psql -U piums -d "$DB" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';" | head -10
