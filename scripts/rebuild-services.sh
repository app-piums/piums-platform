#!/bin/bash

echo "🧹 Limpiando y rebuildeando servicios..."
echo ""

services=(
  "services/users-service"
  "services/artists-service"
  "services/catalog-service"
)

for service in "${services[@]}"; do
  echo "🔄 Procesando: $service"
  cd "$service"
  
  # Limpiar y regenerar
  rm -rf node_modules/.prisma dist
  pnpm prisma generate --schema=./prisma/schema.prisma 2>&1 | tail -3
  
  cd - > /dev/null
  echo ""
done

echo "✅ Rebuild completado"
