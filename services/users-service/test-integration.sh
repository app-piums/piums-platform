#!/bin/bash

# Script de prueba de integración: auth-service → users-service
# Este script simula el flujo completo de registro y creación de perfil de usuario

echo "🧪 Testing Piums Platform - Auth + Users Integration"
echo "=================================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
AUTH_URL="http://localhost:4001"
USERS_URL="http://localhost:4002"
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
TEST_NOMBRE="Usuario Test"

echo -e "${BLUE}📍 Step 1: Verificar servicios${NC}"
echo "----------------------------------------"

# Health check auth-service
AUTH_HEALTH=$(curl -s $AUTH_URL/health | jq -r '.status')
if [ "$AUTH_HEALTH" == "healthy" ]; then
  echo -e "${GREEN}✅ auth-service: healthy${NC}"
else
  echo -e "${RED}❌ auth-service: not available${NC}"
  exit 1
fi

# Health check users-service
USERS_HEALTH=$(curl -s $USERS_URL/health | jq -r '.status')
if [ "$USERS_HEALTH" == "healthy" ]; then
  echo -e "${GREEN}✅ users-service: healthy${NC}"
else
  echo -e "${RED}❌ users-service: not available${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}📍 Step 2: Registrar usuario en auth-service${NC}"
echo "----------------------------------------"
echo "Email: $TEST_EMAIL"
echo "Password: $TEST_PASSWORD"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST $AUTH_URL/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"nombre\": \"$TEST_NOMBRE\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"pais\": \"México\",
    \"codigoPais\": \"+52\",
    \"telefono\": \"5512345678\"
  }")

echo "$REGISTER_RESPONSE" | jq '.'

# Extraer token y userId
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token')
AUTH_USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Error: No se obtuvo token${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Usuario registrado${NC}"
echo "Token: ${TOKEN:0:20}..."
echo "Auth User ID: $AUTH_USER_ID"

echo ""
echo -e "${BLUE}📍 Step 3: Crear perfil en users-service${NC}"
echo "----------------------------------------"

CREATE_USER_RESPONSE=$(curl -s -X POST $USERS_URL/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"authId\": \"$AUTH_USER_ID\",
    \"email\": \"$TEST_EMAIL\",
    \"nombre\": \"$TEST_NOMBRE\",
    \"telefono\": \"+525512345678\",
    \"pais\": \"México\"
  }")

echo "$CREATE_USER_RESPONSE" | jq '.'

USER_ID=$(echo "$CREATE_USER_RESPONSE" | jq -r '.user.id')

if [ "$USER_ID" == "null" ] || [ -z "$USER_ID" ]; then
  echo -e "${RED}❌ Error: No se creó el usuario${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Perfil creado en users-service${NC}"
echo "User ID: $USER_ID"

echo ""
echo -e "${BLUE}📍 Step 4: Obtener mi perfil (GET /api/users/me)${NC}"
echo "----------------------------------------"

MY_PROFILE=$(curl -s -X GET $USERS_URL/api/users/me \
  -H "Authorization: Bearer $TOKEN")

echo "$MY_PROFILE" | jq '.'

echo ""
echo -e "${BLUE}📍 Step 5: Actualizar perfil${NC}"
echo "----------------------------------------"

UPDATE_RESPONSE=$(curl -s -X PUT "$USERS_URL/api/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "bio": "Soy un usuario de prueba creado automáticamente 🤖",
    "language": "es",
    "emailNotifications": true
  }')

echo "$UPDATE_RESPONSE" | jq '.'

echo ""
echo -e "${BLUE}📍 Step 6: Agregar dirección${NC}"
echo "----------------------------------------"

ADDRESS_RESPONSE=$(curl -s -X POST "$USERS_URL/api/users/$USER_ID/addresses" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "label": "Casa",
    "street": "Av. Reforma 123",
    "city": "Ciudad de México",
    "state": "CDMX",
    "country": "México",
    "zipCode": "01000",
    "isDefault": true
  }')

echo "$ADDRESS_RESPONSE" | jq '.'

ADDRESS_ID=$(echo "$ADDRESS_RESPONSE" | jq -r '.address.id')

echo ""
echo -e "${GREEN}✅ Dirección agregada${NC}"
echo "Address ID: $ADDRESS_ID"

echo ""
echo -e "${BLUE}📍 Step 7: Verificar perfil completo${NC}"
echo "----------------------------------------"

FULL_PROFILE=$(curl -s -X GET "$USERS_URL/api/users/$USER_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "$FULL_PROFILE" | jq '.'

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 ¡Prueba de integración completada exitosamente!${NC}"
echo "=================================================="
echo ""
echo "📊 Resumen:"
echo "  • Auth User ID: $AUTH_USER_ID"
echo "  • User Profile ID: $USER_ID"
echo "  • Email: $TEST_EMAIL"
echo "  • Dirección ID: $ADDRESS_ID"
echo ""
echo "🔧 Para limpiar (si usas mock):"
echo "   Reinicia ambos servicios"
echo ""
