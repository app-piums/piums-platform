#!/usr/bin/env bash
# =============================================================================
# seed.sh — Datos de prueba para Piums Platform
# Crea usuarios, artistas, perfiles y reservas de prueba
# Requiere que los servicios estén corriendo (docker-compose up -d o local)
# =============================================================================

set -euo pipefail

AUTH_URL="${AUTH_URL:-http://localhost:4001}"
USERS_URL="${USERS_URL:-http://localhost:4002}"
ARTISTS_URL="${ARTISTS_URL:-http://localhost:4003}"
BOOKING_URL="${BOOKING_URL:-http://localhost:4008}"

echo "🌱 Iniciando seed de datos de prueba..."
echo "   AUTH:    $AUTH_URL"
echo "   USERS:   $USERS_URL"
echo "   ARTISTS: $ARTISTS_URL"
echo "   BOOKING: $BOOKING_URL"
echo ""

# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------
require_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "❌ Se requiere '$1'. Instálalo antes de continuar."
    exit 1
  fi
}

require_cmd curl
require_cmd jq

wait_for_service() {
  local url="$1"
  local name="$2"
  local max=15
  local i=0
  echo -n "   Esperando $name..."
  until curl -sf "$url/health" &>/dev/null; do
    i=$((i+1))
    if [ "$i" -ge "$max" ]; then
      echo " ❌ Timeout esperando $name"
      exit 1
    fi
    echo -n "."
    sleep 2
  done
  echo " ✅"
}

register_user() {
  local email="$1"
  local password="$2"
  local nombre="$3"
  local role="${4:-user}"

  local response
  response=$(curl -sf -X POST "$AUTH_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"nombre\":\"$nombre\",\"role\":\"$role\"}" 2>&1) || true

  if echo "$response" | jq -e '.token' &>/dev/null; then
    echo "$response" | jq -r '.token'
  elif echo "$response" | jq -e '.message' &>/dev/null 2>&1; then
    # El usuario ya existe — hacer login
    local login_response
    login_response=$(curl -sf -X POST "$AUTH_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>&1) || true
    echo "$login_response" | jq -r '.token // .accessToken // empty'
  else
    echo ""
  fi
}

# ---------------------------------------------------------------------------
# Verificar que los servicios estén corriendo
# ---------------------------------------------------------------------------
wait_for_service "$AUTH_URL" "auth-service"
wait_for_service "$USERS_URL" "users-service"
wait_for_service "$ARTISTS_URL" "artists-service"

# ---------------------------------------------------------------------------
# 1. Crear usuario administrador
# ---------------------------------------------------------------------------
echo ""
echo "👤 Creando usuario administrador..."
ADMIN_TOKEN=$(register_user "admin@piums.com" "Admin1234!" "Administrador Piums" "admin")
if [ -n "$ADMIN_TOKEN" ]; then
  echo "   ✅ admin@piums.com"
else
  echo "   ⚠️  No se pudo obtener token para admin@piums.com"
fi

# ---------------------------------------------------------------------------
# 2. Crear usuario cliente de prueba
# ---------------------------------------------------------------------------
echo ""
echo "👤 Creando usuario cliente..."
CLIENT_TOKEN=$(register_user "cliente@piums.com" "Test1234!" "Carlos Rodríguez" "user")
if [ -n "$CLIENT_TOKEN" ]; then
  echo "   ✅ cliente@piums.com"
else
  echo "   ⚠️  No se pudo obtener token para cliente@piums.com"
fi

# ---------------------------------------------------------------------------
# 3. Crear artistas de prueba
# ---------------------------------------------------------------------------
echo ""
echo "🎨 Creando artistas de prueba..."

# Artista 1: Músico
ARTISTA1_TOKEN=$(register_user "artista@piums.com" "Test1234!" "María González" "artist")
if [ -n "$ARTISTA1_TOKEN" ]; then
  echo "   ✅ artista@piums.com (Músico)"

  # Crear perfil de artista
  curl -sf -X POST "$ARTISTS_URL/api/artists" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ARTISTA1_TOKEN" \
    -d '{
      "nombre": "María González",
      "artistName": "María G.",
      "bio": "Guitarrista y vocalista con 10 años de experiencia en música pop y folk. Disponible para eventos privados, bodas y conciertos.",
      "category": "MUSICO",
      "specialties": ["Guitarra acústica","Voz","Pop","Folk","Baladas"],
      "country": "GT",
      "city": "Ciudad de Guatemala",
      "state": "Guatemala",
      "hourlyRateMin": 50000,
      "hourlyRateMax": 150000,
      "currency": "GTQ",
      "yearsExperience": 10,
      "requiresDeposit": true,
      "depositPercentage": 30
    }' &>/dev/null || true
fi

# Artista 2: Fotógrafo
ARTISTA2_TOKEN=$(register_user "fotografo@piums.com" "Test1234!" "Roberto Pérez" "artist")
if [ -n "$ARTISTA2_TOKEN" ]; then
  echo "   ✅ fotografo@piums.com (Fotógrafo)"

  curl -sf -X POST "$ARTISTS_URL/api/artists" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ARTISTA2_TOKEN" \
    -d '{
      "nombre": "Roberto Pérez",
      "artistName": "Rob Photography",
      "bio": "Fotógrafo profesional especializado en bodas, quinceañeras y eventos corporativos. 8 años capturando momentos únicos.",
      "category": "FOTOGRAFO",
      "specialties": ["Bodas","Quinceañeras","Eventos corporativos","Retratos","Fotografía de producto"],
      "country": "GT",
      "city": "Antigua Guatemala",
      "state": "Sacatepéquez",
      "hourlyRateMin": 40000,
      "hourlyRateMax": 120000,
      "currency": "GTQ",
      "yearsExperience": 8,
      "requiresDeposit": true,
      "depositPercentage": 50
    }' &>/dev/null || true
fi

# Artista 3: DJ
ARTISTA3_TOKEN=$(register_user "dj@piums.com" "Test1234!" "Alejandro Díaz" "artist")
if [ -n "$ARTISTA3_TOKEN" ]; then
  echo "   ✅ dj@piums.com (DJ)"

  curl -sf -X POST "$ARTISTS_URL/api/artists" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ARTISTA3_TOKEN" \
    -d '{
      "nombre": "Alejandro Díaz",
      "artistName": "DJ Alex",
      "bio": "DJ con más de 15 años mezclando en los mejores clubes y eventos de Guatemala. Especialista en música electrónica, reggaeton y salsa.",
      "category": "DJ",
      "specialties": ["Electrónica","Reggaeton","Salsa","Cumbia","House"],
      "country": "GT",
      "city": "Ciudad de Guatemala",
      "state": "Guatemala",
      "hourlyRateMin": 60000,
      "hourlyRateMax": 200000,
      "currency": "GTQ",
      "yearsExperience": 15,
      "requiresDeposit": true,
      "depositPercentage": 40
    }' &>/dev/null || true
fi

# Artista 4: Maquillador
ARTISTA4_TOKEN=$(register_user "maquillaja@piums.com" "Test1234!" "Sofía Morales" "artist")
if [ -n "$ARTISTA4_TOKEN" ]; then
  echo "   ✅ maquillaja@piums.com (Maquilladora)"

  curl -sf -X POST "$ARTISTS_URL/api/artists" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ARTISTA4_TOKEN" \
    -d '{
      "nombre": "Sofía Morales",
      "artistName": "Sofía Beauty",
      "bio": "Maquilladora profesional certificada. Experta en maquillaje de novia, artístico y editorial. Trabajo con marcas internacionales.",
      "category": "MAQUILLADOR",
      "specialties": ["Maquillaje de novia","Maquillaje artístico","Editorial","Airbrush","FX"],
      "country": "GT",
      "city": "Ciudad de Guatemala",
      "state": "Guatemala",
      "hourlyRateMin": 30000,
      "hourlyRateMax": 80000,
      "currency": "GTQ",
      "yearsExperience": 6,
      "requiresDeposit": false
    }' &>/dev/null || true
fi

# Artista 5: Tatuador
ARTISTA5_TOKEN=$(register_user "tatuador@piums.com" "Test1234!" "Diego Castro" "artist")
if [ -n "$ARTISTA5_TOKEN" ]; then
  echo "   ✅ tatuador@piums.com (Tatuador)"

  curl -sf -X POST "$ARTISTS_URL/api/artists" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ARTISTA5_TOKEN" \
    -d '{
      "nombre": "Diego Castro",
      "artistName": "Diego Ink",
      "bio": "Tatuador con estudio propio en Zona 10. Especialista en realismo, blackwork y neotradicional. Higiene y calidad garantizada.",
      "category": "TATUADOR",
      "specialties": ["Realismo","Blackwork","Neotradicional","Geométrico","Acuarela"],
      "country": "GT",
      "city": "Ciudad de Guatemala",
      "state": "Guatemala",
      "hourlyRateMin": 80000,
      "hourlyRateMax": 300000,
      "currency": "GTQ",
      "yearsExperience": 12,
      "requiresDeposit": true,
      "depositPercentage": 25
    }' &>/dev/null || true
fi

# ---------------------------------------------------------------------------
# 4. Resumen
# ---------------------------------------------------------------------------
echo ""
echo "✅ Seed completado exitosamente"
echo ""
echo "📋 Credenciales de prueba:"
echo "   Admin:       admin@piums.com        / Admin1234!"
echo "   Cliente:     cliente@piums.com      / Test1234!"
echo "   Artista:     artista@piums.com      / Test1234!  (Músico)"
echo "   Fotógrafo:   fotografo@piums.com    / Test1234!  (Fotógrafo)"
echo "   DJ:          dj@piums.com           / Test1234!  (DJ)"
echo "   Maquilladora: maquillaja@piums.com  / Test1234!  (Maquilladora)"
echo "   Tatuador:    tatuador@piums.com     / Test1234!  (Tatuador)"
echo ""
echo "🌐 Endpoints:"
echo "   Auth:    $AUTH_URL"
echo "   Users:   $USERS_URL"
echo "   Artists: $ARTISTS_URL"
echo "   Booking: $BOOKING_URL"
