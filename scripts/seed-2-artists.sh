#!/usr/bin/env bash
# seed-2-artists.sh — 2 artistas por cada categoría activa en la web
# Categorías: MUSICO, FOTOGRAFO, VIDEOGRAFO, ANIMADOR, CREADOR_CONTENIDO
# Total: 10 artistas × 3 servicios cada uno = 30 servicios

set -euo pipefail

# ── Modo local (Docker Compose) ────────────────────────────────────────────
# bash scripts/seed-2-artists.sh
#
# ── Modo K8s / producción ──────────────────────────────────────────────────
# K8S=true INTERNAL_SECRET=<secret> bash scripts/seed-2-artists.sh
# ---------------------------------------------------------------------------
K8S="${K8S:-false}"

if [ "$K8S" = "true" ]; then
  GATEWAY="${GATEWAY:-https://backend.piums.io}"
  AUTH_URL="${AUTH_URL:-$GATEWAY/api}"          # $AUTH_URL/auth/register
  ARTISTS_URL="${ARTISTS_URL:-$GATEWAY/api}"    # $ARTISTS_URL/artists
  CATALOG_URL="${CATALOG_URL:-$GATEWAY/api/catalog}"  # $CATALOG_URL/categories (sin /api/)
  CATALOG_API_PREFIX=""                         # el gateway ya maneja el /api interno
else
  AUTH_URL="${AUTH_URL:-http://localhost:4001}"
  ARTISTS_URL="${ARTISTS_URL:-http://localhost:4003}"
  CATALOG_URL="${CATALOG_URL:-http://localhost:4004}"
  CATALOG_API_PREFIX="/api"                     # catalog-service tiene su propio /api prefix
fi

INTERNAL_SECRET="${INTERNAL_SECRET:-dev_internal_secret_piums}"

require_cmd() {
  command -v "$1" &>/dev/null || { echo "ERROR: Se requiere '$1'."; exit 1; }
}
require_cmd curl
require_cmd jq

wait_for_service() {
  local url="$1" name="$2" max=15 i=0
  local health_path="/health"
  [[ "$url" == *"piums.io"* ]] && health_path="/api/health"
  echo -n "   Esperando $name..."
  until curl -sf "$url${health_path}" &>/dev/null; do
    i=$((i+1)); [ "$i" -ge "$max" ] && { echo " Timeout"; exit 1; }
    echo -n "."; sleep 2
  done
  echo " OK"
}

register_user() {
  local email="$1" password="$2" nombre="$3"
  local res token uid
  res=$(curl -s -X POST "$AUTH_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"nombre\":\"$nombre\",\"role\":\"artista\"}" 2>/dev/null) || true
  token=$(echo "$res" | jq -r '.token // empty' 2>/dev/null)
  uid=$(echo "$res"   | jq -r '.user.id // empty' 2>/dev/null)
  if [ -z "$token" ]; then
    res=$(curl -s -X POST "$AUTH_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>/dev/null) || true
    token=$(echo "$res" | jq -r '.token // .accessToken // empty' 2>/dev/null)
    uid=$(echo "$res"   | jq -r '.user.id // empty' 2>/dev/null)
  fi
  echo "${token}|${uid}"
}

create_artist() {
  local token="$1" payload="$2"
  local res id
  res=$(curl -s -X POST "$ARTISTS_URL/artists" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$payload" 2>/dev/null) || true
  id=$(echo "$res" | jq -r '.id // .artist.id // empty' 2>/dev/null)
  if [ -z "$id" ]; then
    res=$(curl -s "$ARTISTS_URL/artists/me/profile" \
      -H "Authorization: Bearer $token" 2>/dev/null) || true
    id=$(echo "$res" | jq -r '.id // .artist.id // empty' 2>/dev/null)
  fi
  echo "$id"
}

verify_artist() {
  local auth_id="$1"
  local res status
  res=$(curl -s -X PATCH "$ARTISTS_URL/artists/internal/by-auth/$auth_id/verification" \
    -H "Content-Type: application/json" \
    -H "x-internal-secret: $INTERNAL_SECRET" \
    -d '{}' 2>/dev/null) || true
  status=$(echo "$res" | jq -r '.verificationStatus // empty' 2>/dev/null)
  if [ "$status" = "VERIFIED" ]; then
    echo "   Verificacion: VERIFIED" >&2
  else
    echo "   Verificacion: ERROR — $res" >&2
  fi
}

# Carga todos los IDs de categorías en una variable global una sola vez
ALL_CATEGORIES=""
load_categories() {
  ALL_CATEGORIES=$(curl -sf "$CATALOG_URL${CATALOG_API_PREFIX}/categories" 2>/dev/null || true)
}

get_cat() {
  local slug="$1"
  echo "$ALL_CATEGORIES" | jq -r --arg s "$slug" '.[] | select(.slug == $s) | .id' 2>/dev/null | head -1 || true
}

resolve_cat() {
  local id
  for slug in "$@"; do
    id=$(get_cat "$slug")
    [ -n "$id" ] && { echo "$id"; return; }
  done
  echo ""
}

create_svc() {
  local token="$1" artist_id="$2" cat_id="$3" payload="$4"
  local res id msg
  res=$(curl -s -X POST "$CATALOG_URL${CATALOG_API_PREFIX}/services" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$(echo "$payload" | jq --arg a "$artist_id" --arg c "$cat_id" '. + {artistId:$a,categoryId:$c}')" \
    2>/dev/null) || true
  id=$(echo "$res"  | jq -r '.id // .service.id // empty' 2>/dev/null)
  msg=$(echo "$res" | jq -r '.message // empty' 2>/dev/null)
  if [ -n "$id" ]; then echo "OK:$id"
  elif echo "$msg" | grep -qi "slug\|existe\|duplicate\|unique\|already"; then echo "ya existe"
  else echo "ERROR: $msg"; fi
}

do_artist() {
  # Todos los echo de display van a stderr para no contaminar la captura de stdout
  local idx="$1" email="$2" nombre="$3" artist_payload="$4"
  local raw token uid artist_id
  echo "" >&2
  echo "[$idx] $nombre ($email)..." >&2
  raw=$(register_user "$email" "Seed1234!" "$nombre")
  token="${raw%%|*}"; uid="${raw##*|}"
  [ -z "$token" ] && { echo "   ERROR: no se pudo autenticar" >&2; return 1; }
  local full_payload
  full_payload=$(echo "$artist_payload" | jq --arg uid "$uid" --arg email "$email" '. + {authId:$uid, email:$email}')
  # Imagenes de muestra (temporal, para capturas): avatar tipo retrato + portada
  local _av="https://i.pravatar.cc/400?img=$((10#$idx))"
  local _cv="https://picsum.photos/seed/piums${idx}/900/500"
  full_payload=$(echo "$full_payload" | jq --arg av "$_av" --arg cv "$_cv" '. + {avatar:$av, coverPhoto:$cv}')
  artist_id=$(create_artist "$token" "$full_payload")
  [ -z "$artist_id" ] && { echo "   ERROR: no se pudo crear perfil" >&2; return 1; }
  # Bootstrap crea el perfil con category='OTRO'. Actualizamos con el payload correcto via PUT.
  local update_fields
  update_fields=$(echo "$full_payload" | jq '{category, nombre, artistName, bio, specialties, yearsExperience, country, city, state, hourlyRateMin, hourlyRateMax, currency, requiresDeposit, depositPercentage, instagram, website, equipment, avatar, coverPhoto} | with_entries(select(.value != null))')
  curl -sf -X PUT "$ARTISTS_URL/artists/$artist_id" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $token" \
    -d "$update_fields" -o /dev/null 2>/dev/null || true
  echo "   Perfil OK (ID: $artist_id)" >&2
  verify_artist "$uid"
  echo "${token}|${artist_id}"  # único output a stdout — lo que captura r=$(do_artist ...)
}

svc() {
  local token="$1" artist_id="$2" cat_id="$3" num="$4" payload="$5"
  [ -z "$cat_id" ] && { echo "   Servicio $num: categoría no encontrada, omitiendo"; return; }
  local r; r=$(create_svc "$token" "$artist_id" "$cat_id" "$payload")
  echo "   Servicio $num: $r"
}

# ---------------------------------------------------------------------------
echo ""; echo "Verificando servicios..."
if [ "$K8S" = "true" ]; then
  wait_for_service "$GATEWAY" "gateway"
else
  wait_for_service "$AUTH_URL"    "auth-service"
  wait_for_service "$ARTISTS_URL" "artists-service"
  wait_for_service "$CATALOG_URL" "catalog-service"
fi

load_categories

# Categorías pre-resueltas
C_MUSICA=$(resolve_cat "musica-entretenimiento" "eventos-celebraciones")
C_BODAS=$(resolve_cat "bodas" "eventos-celebraciones")
C_CORP=$(resolve_cat "eventos-corporativos" "eventos-celebraciones")
C_FOTO=$(resolve_cat "fotografia-video" "eventos-celebraciones")
C_ANIM=$(resolve_cat "eventos-celebraciones" "fotografia-video")
C_REDES=$(resolve_cat "fotografia-video" "musica-entretenimiento")

# ===========================================================================
# MUSICO 1 — Luis Méndez
# ===========================================================================
r=$(do_artist "01" "seed_artist01@piums.com" "Luis Méndez" "$(cat <<JSON
{
  "nombre": "Luis Méndez",
  "artistName": "Luis Méndez Band",
  "bio": "Músico guatemalteco con 10 años de experiencia en bodas, eventos y festivales. Guitarra eléctrica, acústica y voz. Repertorio pop, rock, baladas y fusión latina.",
  "category": "MUSICO",
  "specialties": ["Guitarra eléctrica","Guitarra acústica","Voz","Pop","Rock","Baladas"],
  "country": "GT", "city": "Ciudad de Guatemala", "state": "Guatemala",
  "hourlyRateMin": 50000, "hourlyRateMax": 180000, "currency": "GTQ",
  "yearsExperience": 10, "requiresDeposit": true, "depositPercentage": 30,
  "instagram": "https://www.instagram.com/luismendezband"
}
JSON
)")
TOKEN_01="${r%%|*}"; AID_01="${r##*|}"
svc "$TOKEN_01" "$AID_01" "$C_MUSICA" 1 '{"name":"Show en Vivo — Evento Social","slug":"seed-show-vivo-luis","description":"Presentación de 2 horas con repertorio pop, rock y baladas para fiestas y eventos sociales. Equipo de sonido propio.","pricingType":"PER_SESSION","basePrice":250000,"currency":"GTQ","durationMin":120,"tags":["música en vivo","show","pop","rock"],"whatIsIncluded":["2 horas en vivo","PA 1500W","Repertorio +40 canciones","Prueba de sonido"],"isMainService":true}'
svc "$TOKEN_01" "$AID_01" "$C_BODAS"  2 '{"name":"Música en Vivo para Boda","slug":"seed-musica-boda-luis","description":"Cobertura musical completa: ceremonia, coctel y primer baile. Repertorio personalizado con el cliente.","pricingType":"FIXED","basePrice":500000,"currency":"GTQ","durationMin":180,"tags":["música","boda","ceremonia","primer baile"],"whatIsIncluded":["Ceremonia 30 min","Coctel 60 min","Primer baile personalizado","Equipo completo"]}'
svc "$TOKEN_01" "$AID_01" "$C_CORP"   3 '{"name":"Música para Evento Corporativo","slug":"seed-musica-corp-luis","description":"Ambiente musical para lanzamientos, premiaciones y eventos empresariales. Jazz y pop instrumental disponible.","pricingType":"HOURLY","basePrice":90000,"currency":"GTQ","durationMin":60,"tags":["música","corporativo","jazz","instrumental"],"whatIsIncluded":["Desde 1 hora","Repertorio instrumental o cantado","Equipo propio"]}'

# ===========================================================================
# MUSICO 2 — Renata Morán
# ===========================================================================
r=$(do_artist "02" "seed_artist02@piums.com" "Renata Morán" "$(cat <<JSON
{
  "nombre": "Renata Morán",
  "artistName": "Rena Violin",
  "bio": "Violinista clásica y de fusión graduada del Conservatorio Nacional de Guatemala. Especialista en repertorio contemporáneo, pop orquestal y música para bodas.",
  "category": "MUSICO",
  "specialties": ["Violín clásico","Fusión","Pop orquestal","Bodas","Instrumental"],
  "country": "GT", "city": "Antigua Guatemala", "state": "Sacatepéquez",
  "hourlyRateMin": 55000, "hourlyRateMax": 160000, "currency": "GTQ",
  "yearsExperience": 8, "requiresDeposit": true, "depositPercentage": 30,
  "instagram": "https://www.instagram.com/renaviolin"
}
JSON
)")
TOKEN_02="${r%%|*}"; AID_02="${r##*|}"
svc "$TOKEN_02" "$AID_02" "$C_BODAS"  1 '{"name":"Violín en Ceremonia de Boda","slug":"seed-violin-ceremonia-renata","description":"Interpretación en vivo de violín durante la ceremonia civil o religiosa. Repertorio clásico y contemporáneo, piezas especiales ensayadas con anticipación.","pricingType":"PER_SESSION","basePrice":150000,"currency":"GTQ","durationMin":60,"tags":["violín","ceremonia","boda","clásico"],"whatIsIncluded":["1 hora de interpretación","Repertorio +50 obras","Ensayo de piezas especiales","Traslado en Sacatepéquez"],"isMainService":true}'
svc "$TOKEN_02" "$AID_02" "$C_CORP"   2 '{"name":"Cuarteto de Cuerdas para Gala","slug":"seed-cuarteto-gala-renata","description":"Ensamble de cuarteto (violín, viola, cello y contrabajo) para bodas, galas y eventos de alto perfil. Repertorio clásico, pop o jazz.","pricingType":"FIXED","basePrice":500000,"currency":"GTQ","durationMin":120,"tags":["cuarteto","cuerdas","gala","boda","clásico"],"whatIsIncluded":["4 músicos profesionales","2 horas de presentación","Repertorio a elegir","Prueba de sonido previa"]}'
svc "$TOKEN_02" "$AID_02" "$C_MUSICA" 3 '{"name":"Clases de Violín","slug":"seed-clases-violin-renata","description":"Clases de violín presenciales o virtuales para todos los niveles. Plan mensual de progreso y repertorio personalizado.","pricingType":"HOURLY","basePrice":90000,"currency":"GTQ","durationMin":60,"tags":["violín","clases","música","aprendizaje"],"whatIsIncluded":["1 hora de clase","Material de partituras","Plan mensual de progreso","Opción presencial o virtual"]}'

# ===========================================================================
# FOTOGRAFO 1 — Roberto Pérez
# ===========================================================================
r=$(do_artist "03" "seed_artist03@piums.com" "Roberto Pérez" "$(cat <<JSON
{
  "nombre": "Roberto Pérez",
  "artistName": "Rob Photography",
  "bio": "Fotógrafo especializado en bodas y retratos con 8 años documentando momentos únicos en Guatemala. Captura la luz natural y los instantes auténticos. Premio regional de fotografía nupcial 2023.",
  "category": "FOTOGRAFO",
  "specialties": ["Bodas","Quinceañeras","Eventos corporativos","Retratos","Fotografía documental"],
  "country": "GT", "city": "Antigua Guatemala", "state": "Sacatepéquez",
  "hourlyRateMin": 40000, "hourlyRateMax": 120000, "currency": "GTQ",
  "yearsExperience": 8, "requiresDeposit": true, "depositPercentage": 50,
  "instagram": "https://www.instagram.com/robphotography.gt"
}
JSON
)")
TOKEN_03="${r%%|*}"; AID_03="${r##*|}"
svc "$TOKEN_03" "$AID_03" "$C_BODAS" 1 '{"name":"Fotografía de Boda Completa","slug":"seed-foto-boda-rob","description":"Cobertura fotográfica de 8 horas: civil, ceremonia y recepción. +300 fotos editadas en galería digital privada y álbum impreso.","pricingType":"FIXED","basePrice":800000,"currency":"GTQ","durationMin":480,"tags":["fotografía","boda","cobertura completa","álbum"],"whatIsIncluded":["8 horas de cobertura","+300 fotos editadas","Galería digital","Álbum impreso 20x25cm","Segunda cámara"],"isMainService":true}'
svc "$TOKEN_03" "$AID_03" "$C_FOTO"  2 '{"name":"Sesión Lifestyle Exterior","slug":"seed-lifestyle-rob","description":"Sesión de 2 horas en exteriores naturales: parejas, familias o individual. 60-80 fotos editadas con entrega en galería digital.","pricingType":"PER_SESSION","basePrice":250000,"currency":"GTQ","durationMin":120,"tags":["fotografía","exterior","lifestyle","pareja"],"whatIsIncluded":["2 horas de sesión","60-80 fotos editadas","Galería digital","Guía de vestuario previa"]}'
svc "$TOKEN_03" "$AID_03" "$C_CORP"  3 '{"name":"Fotografía de Evento Corporativo","slug":"seed-foto-corp-rob","description":"Cobertura para lanzamientos, conferencias y eventos empresariales. Entrega de fotos en 48 horas para uso institucional y redes.","pricingType":"HOURLY","basePrice":80000,"currency":"GTQ","durationMin":120,"tags":["fotografía","corporativo","empresa","evento"],"whatIsIncluded":["Cobertura desde 2 horas","Fotos editadas en 48h","Licencia de uso comercial","Alta y baja resolución"]}'

# ===========================================================================
# FOTOGRAFO 2 — Sofía Ruiz
# ===========================================================================
r=$(do_artist "04" "seed_artist04@piums.com" "Sofía Ruiz" "$(cat <<JSON
{
  "nombre": "Sofía Ruiz",
  "artistName": "Sofía Ruiz Foto",
  "bio": "Fotógrafa de producto y marca personal con 5 años trabajando con emprendedoras y pequeñas empresas guatemaltecas. Especialista en fotografía de alimentos, redes sociales y e-commerce.",
  "category": "FOTOGRAFO",
  "specialties": ["Fotografía de producto","Marca personal","Alimentos","E-commerce","Redes sociales"],
  "country": "GT", "city": "Ciudad de Guatemala", "state": "Guatemala",
  "hourlyRateMin": 30000, "hourlyRateMax": 100000, "currency": "GTQ",
  "yearsExperience": 5, "requiresDeposit": false,
  "instagram": "https://www.instagram.com/sofiaruizfoto"
}
JSON
)")
TOKEN_04="${r%%|*}"; AID_04="${r##*|}"
svc "$TOKEN_04" "$AID_04" "$C_FOTO" 1 '{"name":"Sesión de Fotografía de Producto","slug":"seed-foto-producto-sofia","description":"Sesión de fotografía de productos para e-commerce, catálogo o redes sociales. Fondo blanco, lifestyle o flat lay según el producto.","pricingType":"PER_SESSION","basePrice":180000,"currency":"GTQ","durationMin":120,"tags":["producto","e-commerce","catálogo","flat lay"],"whatIsIncluded":["2 horas de sesión","30-50 fotos editadas","3 estilos de composición","Entrega en 3 días hábiles"],"isMainService":true}'
svc "$TOKEN_04" "$AID_04" "$C_FOTO" 2 '{"name":"Fotografía de Marca Personal","slug":"seed-marca-personal-sofia","description":"Sesión de marca personal para emprendedores, coaches y profesionales. Look natural y auténtico para perfil y redes.","pricingType":"PER_SESSION","basePrice":220000,"currency":"GTQ","durationMin":150,"tags":["marca personal","profesional","branding","redes sociales"],"whatIsIncluded":["2.5 horas de sesión","50-70 fotos editadas","2 cambios de outfit","Galería digital en 5 días"]}'
svc "$TOKEN_04" "$AID_04" "$C_FOTO" 3 '{"name":"Fotografía de Alimentos","slug":"seed-foto-alimentos-sofia","description":"Fotografía profesional de platillos, bebidas y menús para restaurantes, pastelerías y marcas de alimentos.","pricingType":"HOURLY","basePrice":70000,"currency":"GTQ","durationMin":60,"tags":["alimentos","gastronomía","restaurante","menú"],"whatIsIncluded":["Desde 1 hora","Props y accesorios básicos","Fotos editadas incluidas","Opción en locación del cliente"]}'

# ===========================================================================
# VIDEOGRAFO 1 — Andrea Lima
# ===========================================================================
r=$(do_artist "05" "seed_artist05@piums.com" "Andrea Lima" "$(cat <<JSON
{
  "nombre": "Andrea Lima",
  "artistName": "Andrea Lima Films",
  "bio": "Videógrafa especializada en bodas y contenido para redes sociales con 6 años de experiencia. Edición cinematográfica, color grading y motion graphics para videos con narrativa emocional.",
  "category": "VIDEOGRAFO",
  "specialties": ["Bodas","Reels","Contenido para redes","Edición cinematográfica","Color grading"],
  "country": "GT", "city": "Ciudad de Guatemala", "state": "Guatemala",
  "hourlyRateMin": 40000, "hourlyRateMax": 150000, "currency": "GTQ",
  "yearsExperience": 6, "requiresDeposit": true, "depositPercentage": 40,
  "instagram": "https://www.instagram.com/andrealima.films",
  "tiktok": "https://www.tiktok.com/@andrealimafilms"
}
JSON
)")
TOKEN_05="${r%%|*}"; AID_05="${r##*|}"
svc "$TOKEN_05" "$AID_05" "$C_BODAS" 1 '{"name":"Video de Boda Cinematográfico","slug":"seed-video-boda-andrea","description":"Cobertura completa de boda con edición cinematográfica. Film 5-8 min + highlights 60s para redes. Entrega en 3 semanas.","pricingType":"FIXED","basePrice":900000,"currency":"GTQ","durationMin":480,"tags":["video","boda","cinematográfico","film","highlights"],"whatIsIncluded":["8 horas de cobertura","Film principal 5-8 min","Highlights 60s para redes","Color grading profesional","Música licenciada"],"isMainService":true}'
svc "$TOKEN_05" "$AID_05" "$C_REDES" 2 '{"name":"Reels y Contenido para Redes","slug":"seed-reels-andrea","description":"Sesión de 2 horas para crear 3 reels listos para Instagram y TikTok. Edición rápida con música tendencia y efectos visuales.","pricingType":"PER_SESSION","basePrice":200000,"currency":"GTQ","durationMin":120,"tags":["reels","redes sociales","instagram","tiktok"],"whatIsIncluded":["2 horas de grabación","3 reels editados 15-60s","Música licenciada","Subtítulos incluidos","Entrega en 5 días"]}'
svc "$TOKEN_05" "$AID_05" "$C_CORP"  3 '{"name":"Video Corporativo o de Marca","slug":"seed-video-corp-andrea","description":"Video institucional, presentación de producto o evento empresarial. Para sitio web, presentaciones y campañas digitales.","pricingType":"FIXED","basePrice":600000,"currency":"GTQ","durationMin":240,"tags":["video","corporativo","marca","institucional"],"whatIsIncluded":["Guion y planeación previa","Día completo de grabación","Video final 1-3 min","Versión corta 30s para ads","2 rondas de revisión"]}'

# ===========================================================================
# VIDEOGRAFO 2 — Diego Campos
# ===========================================================================
r=$(do_artist "06" "seed_artist06@piums.com" "Diego Campos" "$(cat <<JSON
{
  "nombre": "Diego Campos",
  "artistName": "Diego Campos Cine",
  "bio": "Videógrafo y director de fotografía con 9 años en producción audiovisual. Especializado en documentales, video musical y cobertura de eventos deportivos y culturales.",
  "category": "VIDEOGRAFO",
  "specialties": ["Documentales","Video musical","Deportes","Cultura","Drone","Post-producción"],
  "country": "GT", "city": "Ciudad de Guatemala", "state": "Guatemala",
  "hourlyRateMin": 60000, "hourlyRateMax": 200000, "currency": "GTQ",
  "yearsExperience": 9, "requiresDeposit": true, "depositPercentage": 35,
  "instagram": "https://www.instagram.com/diegocamposcine"
}
JSON
)")
TOKEN_06="${r%%|*}"; AID_06="${r##*|}"
svc "$TOKEN_06" "$AID_06" "$C_REDES" 1 '{"name":"Video Musical Profesional","slug":"seed-video-musical-diego","description":"Producción completa de video musical: preproducción, rodaje de 1 día, edición y color. Ideal para artistas independientes.","pricingType":"FIXED","basePrice":1200000,"currency":"GTQ","durationMin":480,"tags":["video musical","música","producción","artista"],"whatIsIncluded":["Guion y locación previa","Día de rodaje completo","Drone incluido","Edición profesional","Color grading cinematográfico","Entrega en 2 semanas"],"isMainService":true}'
svc "$TOKEN_06" "$AID_06" "$C_CORP"  2 '{"name":"Cobertura de Evento con Drone","slug":"seed-drone-diego","description":"Cobertura aérea y en tierra de eventos, festivales y conciertos. Imágenes cinematográficas desde perspectivas únicas.","pricingType":"PER_SESSION","basePrice":350000,"currency":"GTQ","durationMin":240,"tags":["drone","aéreo","evento","festival","concierto"],"whatIsIncluded":["4 horas de cobertura","Operador de drone certificado","Edición de highlight 2-3 min","Fotos aéreas incluidas"]}'
svc "$TOKEN_06" "$AID_06" "$C_REDES" 3 '{"name":"Mini Documental","slug":"seed-mini-documental-diego","description":"Mini documental de 5-10 minutos para marcas, ONG o proyectos personales. Narrativa auténtica con entrevistas y B-roll cinematográfico.","pricingType":"FIXED","basePrice":800000,"currency":"GTQ","durationMin":480,"tags":["documental","narrativa","marca","ONG","historia"],"whatIsIncluded":["Preproducción y guion","1-2 días de rodaje","Entrevistas y B-roll","Edición 5-10 min","Subtítulos en español e inglés"]}'

# ===========================================================================
# ANIMADOR 1 — Carlos Vega
# ===========================================================================
r=$(do_artist "07" "seed_artist07@piums.com" "Carlos Vega" "$(cat <<JSON
{
  "nombre": "Carlos Vega",
  "artistName": "Carlos Vega MC",
  "bio": "Animador y Maestro de Ceremonias con 7 años animando bodas, quinceañeras y eventos corporativos. Dinámico, carismático y bilingüe (español e inglés). Más de 300 eventos animados.",
  "category": "ANIMADOR",
  "specialties": ["Maestro de Ceremonias","Bodas","Quinceañeras","Corporativo","Bilingüe"],
  "country": "GT", "city": "Ciudad de Guatemala", "state": "Guatemala",
  "hourlyRateMin": 40000, "hourlyRateMax": 150000, "currency": "GTQ",
  "yearsExperience": 7, "requiresDeposit": true, "depositPercentage": 30,
  "instagram": "https://www.instagram.com/carlosvegamc"
}
JSON
)")
TOKEN_07="${r%%|*}"; AID_07="${r##*|}"
svc "$TOKEN_07" "$AID_07" "$C_BODAS" 1 '{"name":"Maestro de Ceremonias para Boda","slug":"seed-mc-boda-carlos","description":"Animación completa de boda: coordinación de protocolo, presentaciones, juegos y cierre. Guion personalizado con los novios.","pricingType":"FIXED","basePrice":600000,"currency":"GTQ","durationMin":360,"tags":["MC","maestro de ceremonias","boda","protocolo"],"whatIsIncluded":["Reunión previa de guion","Coordinación protocolo civil","Animación recepción completa","Presentación del pastel y brindis","Cierre de pista de baile"],"isMainService":true}'
svc "$TOKEN_07" "$AID_07" "$C_ANIM"  2 '{"name":"Animación de Quinceañera","slug":"seed-animacion-xv-carlos","description":"Animación divertida y emotiva para quinceañeras. Coordinación de vals, sorpresas, juegos y momentos especiales con la quinceañera y sus chambelanes.","pricingType":"FIXED","basePrice":450000,"currency":"GTQ","durationMin":300,"tags":["quinceañera","animación","vals","chambelanes"],"whatIsIncluded":["Coordinación de vals y coreografía","Juegos con invitados","Presentación de sorpresas","Animación de 5 horas","Micrófono inalámbrico profesional"]}'
svc "$TOKEN_07" "$AID_07" "$C_CORP"  3 '{"name":"Facilitador de Eventos Corporativos","slug":"seed-facilitador-corp-carlos","description":"Conducción de dinámicas, premiaciones y actividades de team building en eventos empresariales. Energía y profesionalismo garantizados.","pricingType":"HOURLY","basePrice":100000,"currency":"GTQ","durationMin":60,"tags":["corporativo","facilitador","team building","premiación"],"whatIsIncluded":["Preparación de dinámica previa","Conducción en vivo","Micrófono y equipo básico","Desde 2 horas de servicio"]}'

# ===========================================================================
# ANIMADOR 2 — Paola Ajú
# ===========================================================================
r=$(do_artist "08" "seed_artist08@piums.com" "Paola Ajú" "$(cat <<JSON
{
  "nombre": "Paola Ajú",
  "artistName": "Paola Shows",
  "bio": "Animadora infantil y familiar con 5 años creando magia en fiestas, festivales y eventos escolares. Show de magia, globoflexia, pintacaritas y personajes. Energía desbordante para el público más pequeño.",
  "category": "ANIMADOR",
  "specialties": ["Animación infantil","Magia","Globoflexia","Pintacaritas","Personajes","Festivales"],
  "country": "GT", "city": "Quetzaltenango", "state": "Quetzaltenango",
  "hourlyRateMin": 25000, "hourlyRateMax": 80000, "currency": "GTQ",
  "yearsExperience": 5, "requiresDeposit": false,
  "instagram": "https://www.instagram.com/piolashows.gt",
  "tiktok": "https://www.tiktok.com/@paolashowsgt"
}
JSON
)")
TOKEN_08="${r%%|*}"; AID_08="${r##*|}"
svc "$TOKEN_08" "$AID_08" "$C_ANIM" 1 '{"name":"Show Infantil Completo","slug":"seed-show-infantil-paola","description":"Show de 90 minutos con magia, globoflexia, pintacaritas y juegos para fiestas infantiles. Máximo 30 niños. Lleva todo el material.","pricingType":"PER_SESSION","basePrice":120000,"currency":"GTQ","durationMin":90,"tags":["infantil","magia","globoflexia","pintacaritas","fiesta"],"whatIsIncluded":["Magia interactiva 20 min","Globoflexia 30 min","Pintacaritas 30 min","Juegos y sorpresas 10 min","Todo el material incluido"],"isMainService":true}'
svc "$TOKEN_08" "$AID_08" "$C_ANIM" 2 '{"name":"Personaje para Fiesta","slug":"seed-personaje-paola","description":"Visita sorpresa de personaje infantil favorito (princesas, superhéroes, etc.) para cumpleaños. 1 hora de interacción y fotos con los niños.","pricingType":"PER_SESSION","basePrice":80000,"currency":"GTQ","durationMin":60,"tags":["personaje","princesa","superhéroe","cumpleaños","sorpresa"],"whatIsIncluded":["1 hora de personaje","Sesión de fotos","Interacción con niños","Pequeño show musical","Sorpresas incluidas"]}'
svc "$TOKEN_08" "$AID_08" "$C_CORP"  3 '{"name":"Animación para Evento Escolar o Familiar","slug":"seed-evento-escolar-paola","description":"Animación para kermesses, ferias escolares y eventos familiares. Actividades para niños de todas las edades con montaje en locación.","pricingType":"HOURLY","basePrice":50000,"currency":"GTQ","durationMin":60,"tags":["escolar","familiar","kermesse","feria","actividades"],"whatIsIncluded":["Desde 2 horas de animación","Estación de globoflexia","Estación de pintacaritas","Juegos grupales","Todo el material"]}'

# ===========================================================================
# CREADOR_CONTENIDO 1 — Mariana López
# ===========================================================================
r=$(do_artist "09" "seed_artist09@piums.com" "Mariana López" "$(cat <<JSON
{
  "nombre": "Mariana López",
  "artistName": "Mariana Creates",
  "bio": "Creadora de contenido digital con comunidad de 80k seguidores en Instagram y TikTok. Especialista en lifestyle, viajes y gastronomía guatemalteca. Colaboraciones con marcas locales e internacionales.",
  "category": "CREADOR_CONTENIDO",
  "specialties": ["Instagram","TikTok","Lifestyle","Viajes","Gastronomía","Fotografía móvil"],
  "country": "GT", "city": "Ciudad de Guatemala", "state": "Guatemala",
  "hourlyRateMin": 50000, "hourlyRateMax": 300000, "currency": "GTQ",
  "yearsExperience": 4, "requiresDeposit": true, "depositPercentage": 50,
  "instagram": "https://www.instagram.com/marianacreates",
  "tiktok": "https://www.tiktok.com/@marianacreates"
}
JSON
)")
TOKEN_09="${r%%|*}"; AID_09="${r##*|}"
svc "$TOKEN_09" "$AID_09" "$C_REDES" 1 '{"name":"Publicación Patrocinada en Instagram","slug":"seed-post-instagram-mariana","description":"1 post en feed + 3 stories mencionando tu marca o producto. Audiencia: mujeres 22-35 años, Guatemala. Entrega de métricas post-publicación.","pricingType":"FIXED","basePrice":300000,"currency":"GTQ","tags":["instagram","publicidad","influencer","marca","lifestyle"],"whatIsIncluded":["1 post en feed editado","3 stories con swipe up","Mención y tag de marca","Entrega de métricas","Briefing previo"],"isMainService":true}'
svc "$TOKEN_09" "$AID_09" "$C_REDES" 2 '{"name":"Video TikTok Patrocinado","slug":"seed-tiktok-mariana","description":"Video orgánico de TikTok integrando tu producto o servicio de forma natural. Formato tendencia adaptado a tu marca.","pricingType":"FIXED","basePrice":250000,"currency":"GTQ","tags":["tiktok","video","influencer","publicidad","viral"],"whatIsIncluded":["1 video TikTok 15-60s","Integración orgánica de marca","Hashtags optimizados","Entrega de estadísticas a 72h","2 revisiones del guion"]}'
svc "$TOKEN_09" "$AID_09" "$C_REDES" 3 '{"name":"Paquete Mensual de Contenido","slug":"seed-paquete-mensual-mariana","description":"Colaboración mensual con 4 posts + 8 stories + 2 TikToks para mayor exposición continua de tu marca a lo largo del mes.","pricingType":"FIXED","basePrice":900000,"currency":"GTQ","tags":["paquete","mensual","instagram","tiktok","marca"],"whatIsIncluded":["4 posts en feed","8 stories","2 videos TikTok","Reporte mensual de métricas","Reunión de briefing mensual"]}'

# ===========================================================================
# CREADOR_CONTENIDO 2 — Javier Estrada
# ===========================================================================
r=$(do_artist "10" "seed_artist10@piums.com" "Javier Estrada" "$(cat <<JSON
{
  "nombre": "Javier Estrada",
  "artistName": "Javier Tech Creator",
  "bio": "Creador de contenido tech y gaming con canal de YouTube de 45k suscriptores y presencia en Twitch. Produce reviews, tutoriales y unboxings. Especialista en llegar a audiencia masculina 18-30 años.",
  "category": "CREADOR_CONTENIDO",
  "specialties": ["YouTube","Twitch","Tech","Gaming","Reviews","Tutoriales"],
  "country": "GT", "city": "Ciudad de Guatemala", "state": "Guatemala",
  "hourlyRateMin": 40000, "hourlyRateMax": 250000, "currency": "GTQ",
  "yearsExperience": 3, "requiresDeposit": true, "depositPercentage": 50,
  "instagram": "https://www.instagram.com/javiertech.gt",
  "tiktok": "https://www.tiktok.com/@javiertechgt"
}
JSON
)")
TOKEN_10="${r%%|*}"; AID_10="${r##*|}"
svc "$TOKEN_10" "$AID_10" "$C_REDES" 1 '{"name":"Review de Producto en YouTube","slug":"seed-review-youtube-javier","description":"Video de review honesto de tu producto tech o gadget en canal de 45k suscriptores. Formato detallado con pros y contras. Permanente en el canal.","pricingType":"FIXED","basePrice":350000,"currency":"GTQ","tags":["youtube","review","tech","gadget","unboxing"],"whatIsIncluded":["Video review 8-15 min","Unboxing incluido","Link en descripción","Post en Instagram","Entrega de estadísticas al mes"],"isMainService":true}'
svc "$TOKEN_10" "$AID_10" "$C_REDES" 2 '{"name":"Mención en Live de Twitch","slug":"seed-twitch-javier","description":"Mención patrocinada durante stream en vivo de Twitch con audiencia promedio de 500 viewers simultáneos. Formato natural y entretenido.","pricingType":"PER_SESSION","basePrice":150000,"currency":"GTQ","tags":["twitch","live","gaming","stream","mención"],"whatIsIncluded":["2 menciones durante el stream","Link en chat","Clip del momento de mención","Reporte de viewers y interacciones"]}'
svc "$TOKEN_10" "$AID_10" "$C_REDES" 3 '{"name":"Tutorial o Tutorial Patrocinado","slug":"seed-tutorial-javier","description":"Tutorial de YouTube integrando tu herramienta, software o servicio de forma educativa. Ideal para marcas B2B o SaaS.","pricingType":"FIXED","basePrice":280000,"currency":"GTQ","tags":["tutorial","youtube","educativo","software","herramienta"],"whatIsIncluded":["Video tutorial 10-20 min","Guion revisado con la marca","Thumbnail personalizado","2 revisiones","Permanente en canal"]}'

# ---------------------------------------------------------------------------
echo ""
echo "Seed completado — 10 artistas, 3 servicios cada uno."
echo ""
echo "  01  seed_artist01@piums.com  Luis Méndez Band      MUSICO"
echo "  02  seed_artist02@piums.com  Rena Violin            MUSICO"
echo "  03  seed_artist03@piums.com  Rob Photography        FOTOGRAFO"
echo "  04  seed_artist04@piums.com  Sofía Ruiz Foto        FOTOGRAFO"
echo "  05  seed_artist05@piums.com  Andrea Lima Films      VIDEOGRAFO"
echo "  06  seed_artist06@piums.com  Diego Campos Cine      VIDEOGRAFO"
echo "  07  seed_artist07@piums.com  Carlos Vega MC         ANIMADOR"
echo "  08  seed_artist08@piums.com  Paola Shows            ANIMADOR"
echo "  09  seed_artist09@piums.com  Mariana Creates        CREADOR_CONTENIDO"
echo "  10  seed_artist10@piums.com  Javier Tech Creator    CREADOR_CONTENIDO"
echo ""
echo "  Password de todos: Seed1234!"
