#!/bin/bash

# Script para insertar datos de prueba usando curl + API REST
# Este script crea servicios con diferentes tipos de pricing

BASE_URL="http://localhost:4004/api"
CATALOG_API="http://localhost:4003/api"

echo "🧪 Creando datos de prueba para el sistema de pricing"
echo "======================================================"

# Nota: Este script es solo para referencia
# Los datos reales deben insertarse directamente en la base de datos
# usando el SQL seed file

echo ""
echo "Los servicios de prueba se crean con el siguiente SQL:"
echo "  - service-fixed-001: Sesión de fotos (FIXED pricing)"
echo "  - service-hourly-001: DJ para eventos (BASE_PLUS_HOURLY pricing)"
echo "  - service-package-001: Maquillaje (PACKAGE pricing)"
echo ""
echo "Ejecuta este comando para insertar los datos:"
echo ""
echo '  docker exec -i piums-postgres psql -U postgres -d piums_catalog < services/seed-pricing-data.sql'
echo ""
