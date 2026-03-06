#!/bin/bash

echo "🔍 Verificando tablas en las bases de datos..."
echo ""

databases=("piums_auth" "piums_users" "piums_artists" "piums_bookings" "piums_catalog")

for db in "${databases[@]}"; do
  echo "📊 Base de datos: $db"
  docker compose -f docker-compose.dev.yml exec -T postgres psql -U piums -d "$db" -c "\dt" 2>&1 | grep -E "(List of relations|Schema|public|---)" | head -10 || echo "  Sin tablas o error"
  echo ""
done

echo "✅ Verificación completada"
