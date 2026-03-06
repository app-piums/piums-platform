#!/bin/bash

echo "🚀 Ejecutando migraciones en todos los servicios..."
echo ""

services=("auth" "users" "artists" "catalog" "booking" "payments" "reviews" "notifications" "search")

for service in "${services[@]}"; do
  echo "📦 Migrando ${service}-service..."
  docker compose -f docker-compose.dev.yml exec -T ${service}-service sh -c "npx prisma db push --skip-generate" 2>&1 | grep -E "(All changes|already in sync|error|Error)" || echo "✅ ${service}-service completado"
  echo ""
done

echo "✅ Todas las migraciones completadas"
