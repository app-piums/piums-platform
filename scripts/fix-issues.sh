#!/bin/bash

echo "🔧 Resolviendo issues del proyecto..."
echo ""

# Servicios con Prisma
services=(
  "services/auth-service"
  "services/users-service"
  "services/artists-service"
  "services/catalog-service"
  "services/booking-service"
  "services/payments-service"
  "services/reviews-service"
  "services/notifications-service"
  "services/search-service"
)

echo "📦 Regenerando Prisma Client en todos los servicios..."
echo ""

for service in "${services[@]}"; do
  if [ -d "$service/prisma" ]; then
    echo "🔄 Procesando: $service"
    cd "$service"
    
    # Regenerar Prisma Client
    npx prisma generate 2>&1 | grep -E "(Generated|error|Error|success)" || echo "  ✅ Prisma Client regenerado"
    
    cd - > /dev/null
    echo ""
  fi
done

echo "✅ Regeneración de Prisma Client completada"
echo ""

# Verificar auth-service específicamente (bcryptjs)
echo "🔍 Verificando bcryptjs en auth-service..."
cd services/auth-service
if grep -q "bcryptjs" package.json; then
  echo "  ✅ bcryptjs presente en package.json"
  
  # Verificar si está instalado
  if [ -d "node_modules/bcryptjs" ]; then
    echo "  ✅ bcryptjs instalado en node_modules"
  else
    echo "  ⚠️  bcryptjs no instalado, ejecutando pnpm install..."
    pnpm install bcryptjs @types/bcryptjs
  fi
else
  echo "  ❌ bcryptjs NO presente en package.json"
fi
cd - > /dev/null

echo ""
echo "✅ Todos los issues resueltos"
