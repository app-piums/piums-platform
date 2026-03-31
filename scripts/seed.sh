#!/usr/bin/env bash
# =============================================================================
# seed.sh — Datos de prueba para Piums Platform
# Crea 1 admin, 10 clientes, 10 artistas (con ubicaciones por toda Guatemala)
# y 10 servicios de catálogo. Sin reservas — para pruebas manuales.
# Requiere que los servicios estén corriendo (docker-compose up -d o local)
# =============================================================================

set -euo pipefail

AUTH_URL="${AUTH_URL:-http://localhost:4001}"
USERS_URL="${USERS_URL:-http://localhost:4002}"
ARTISTS_URL="${ARTISTS_URL:-http://localhost:4003}"
CATALOG_URL="${CATALOG_URL:-http://localhost:4004}"
BOOKING_URL="${BOOKING_URL:-http://localhost:4008}"

echo "🌱 Iniciando seed de datos de prueba..."
echo "   AUTH:    $AUTH_URL"
echo "   USERS:   $USERS_URL"
echo "   ARTISTS: $ARTISTS_URL"
echo "   CATALOG: $CATALOG_URL"
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

  local response token user_id
  response=$(curl -s -X POST "$AUTH_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"nombre\":\"$nombre\",\"role\":\"$role\"}" 2>&1) || true

  if echo "$response" | jq -e '.token' &>/dev/null 2>&1; then
    token=$(echo "$response" | jq -r '.token')
    user_id=$(echo "$response" | jq -r '.user.id // empty')
  else
    # Usuario ya existe o error — intentar login
    local login_response
    login_response=$(curl -s -X POST "$AUTH_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"$email\",\"password\":\"$password\"}" 2>&1) || true
    token=$(echo "$login_response" | jq -r '.token // .accessToken // empty')
    user_id=$(echo "$login_response" | jq -r '.user.id // empty')
  fi

  echo "${token}|${user_id}"
}

# ---------------------------------------------------------------------------
# Tablas de datos
# ---------------------------------------------------------------------------

# Clientes: "nombre|ciudad|departamento"
CLIENT_DATA=(
  "Ana Cifuentes|Ciudad de Guatemala|Guatemala"
  "Carlos Rodríguez|Mixco|Guatemala"
  "Lucía Herrera|Villa Nueva|Guatemala"
  "Fernando López|Quetzaltenango|Quetzaltenango"
  "Gabriela Morales|Xela|Quetzaltenango"
  "Mario Ajú|Cobán|Alta Verapaz"
  "Stefanie Vega|Escuintla|Escuintla"
  "Rodrigo Pérez|Chiquimula|Chiquimula"
  "Valeria Torres|Huehuetenango|Huehuetenango"
  "Diego Fuentes|Flores|Petén"
)

# Artistas: "nombre|artistName|bio|category|specialties|ciudad|departamento|rateMin|rateMax|years|deposit|depositPct|instagram|tiktok|facebook|website"
ARTIST_DATA=(
  "María González|María G.|Guitarrista y vocalista apasionada por el folk y pop latinoamericano, con más de 10 años en bodas, tardes culturales y festivales de Guatemala. Su música fusiona cuerdas acústicas y letras emotivas que conectan con cada audiencia.|MUSICO|Guitarra acústica,Voz,Pop,Folk|Ciudad de Guatemala|Guatemala|50000|150000|10|true|30|https://www.instagram.com/mariagmusic|https://www.tiktok.com/@mariagmusic||"
  "Roberto Pérez|Rob Photography|Fotógrafo especializado en bodas y retratos con 8 años documentando momentos únicos en Guatemala. Su trabajo captura la luz natural y los instantes auténticos que hacen irrepetible cada historia. Premio regional de fotografía nupcial 2023.|FOTOGRAFO|Bodas,Quinceañeras,Eventos corporativos,Retratos|Antigua Guatemala|Sacatepéquez|40000|120000|8|true|50|https://www.instagram.com/robphotography.gt|||https://robphotography.com.gt"
  "Alejandro Díaz|DJ Alex|DJ residente en la escena musical guatemalteca desde 2009 con más de 800 eventos tocados. Especialista en electrónica, reggaeton y fusión latina que lleva cada pista de baile al máximo. Equipamiento profesional de última generación para sonidos impecables.|DJ|Electrónica,Reggaeton,Salsa,House|Ciudad de Guatemala|Guatemala|60000|200000|15|true|40|https://www.instagram.com/djalexguatemala|https://www.tiktok.com/@djalexgt|https://www.facebook.com/DJAlexGuatemala|"
  "Sofía Morales|Sofía Beauty|Maquilladora certificada en novia, editorial y artístico con formación en la Academia de Belleza Internacional y especialización en Airbrush Makeup. Seis años transformando looks en Quetzaltenango y el altiplano guatemalteco.|MAQUILLADOR|Novia,Artístico,Editorial,Airbrush|Quetzaltenango|Quetzaltenango|30000|80000|6|false|0|https://www.instagram.com/sofiabeauty.quetzal|https://www.tiktok.com/@sofiabeautygt||"
  "Diego Castro|Diego Ink|Tatuador reconocido por su hiperrealismo y blackwork de alta precisión, con estudio en Zona 10 Ciudad de Guatemala. Doce años de carrera, más de 2000 tatuajes y presencia en convenciones internacionales avalan su arte.|TATUADOR|Realismo,Blackwork,Neotradicional,Geométrico|Ciudad de Guatemala|Guatemala|80000|300000|12|true|25|https://www.instagram.com/diegoink.tattoo|||https://diegoink.art"
  "Paola Ajú|Paola Dance|Bailarina y coreógrafa formada en danza contemporánea y técnica Graham, directora artística de espectáculos en Alta Verapaz. Sus piezas fusionan la tradición guatemalteca con movimiento moderno creando shows únicos.|OTRO|Contemporáneo,Ballet,Jazz,Fusión|Cobán|Alta Verapaz|35000|100000|7|true|30|https://www.instagram.com/paoladance.gt|https://www.tiktok.com/@paoladancegt||"
  "Humberto Ruiz|Humo Barbería|Barbero artístico experto en degradados, diseños geométricos y técnicas de navaja clásica con 5 años en Escuintla. Su estética visual y precisión lo posicionan como uno de los mejores barberos del sur del país.|OTRO|Degradado,Barba,Diseño,Clásico|Escuintla|Escuintla|15000|45000|5|false|0|https://www.instagram.com/humobarber.escuintla|https://www.tiktok.com/@humobarberia||"
  "Claudia Chávez|Claudia Eventos|Planificadora de bodas y eventos sociales con más de 200 eventos coordinados en 9 años cubriendo el oriente de Guatemala. Su enfoque en detalles y red de proveedores garantizan momentos inolvidables.|OTRO|Bodas,Quinceañeras,Corporativo,Social|Chiquimula|Chiquimula|70000|250000|9|true|50|https://www.instagram.com/claudia.eventos.gt||https://www.facebook.com/claudiaeventsgt|https://claudiaeventos.com"
  "Samuel Tzul|Sam Lights|Técnico de iluminación y sonido con 11 años en conciertos y festivales por toda Guatemala. Propietario de equipamiento propio: consolas Behringer X32, moving heads y PA Yamaha 4000W.|OTRO|Iluminación,Sonido,Conciertos,Eventos|Huehuetenango|Huehuetenango|45000|130000|11|true|35|https://www.instagram.com/samlightsgt||https://www.facebook.com/SamLightsGuatemala|"
  "Renata Morán|Rena Violin|Violinista clásica y de fusión graduada del Conservatorio Nacional de Guatemala, especialista en repertorio contemporáneo y pop orquestal. Disponible para bodas y galas en Petén y norte del país.|MUSICO|Violín clásico,Fusión,Instrumental,Bodas|Flores|Petén|55000|160000|8|true|30|https://www.instagram.com/renaviolin|https://www.tiktok.com/@renaviolin||https://renataviolin.com"
)

# Servicios: "índice_artista(0-9)|categoría_slug|slug|nombre|descripción|pricingType|basePrice|tags|whatIsIncluded"
# El índice referencia al artista creado en el mismo orden que ARTIST_DATA
SERVICE_DATA=(
  # ── María G. (artist01) — MUSICO Ciudad de Guatemala ──────────────────────
  "0|musica|concierto-privado-maria-g|Concierto Privado Acústico|Presentación en vivo de 2 horas con repertorio personalizado para bodas y eventos íntimos.|HOURLY|100000|música,acústico,boda,privado|Guitarra acústica o voz solista,2 horas de presentación,Repertorio personalizado (hasta 20 canciones),Prueba de sonido previa,Traslado en Ciudad de Guatemala"
  "0|musica|serenata-romantica-maria|Serenata Romántica|Serenata sorpresa de 30 minutos, perfecta para aniversarios y propuestas de matrimonio.|PER_SESSION|60000|serenata,romántico,aniversario,sorpresa|Guitarra acústica y voz,30 minutos de presentación,Coordinación discreta con el anfitrión,Hasta 5 canciones,Entrega de rosas (opcional por Q80)"
  "0|musica|clases-guitarra-maria|Clases de Guitarra|Clases personalizadas de guitarra para principiantes o nivel intermedio, 1 hora semanal.|HOURLY|80000|guitarra,clases,música,aprendizaje|1 hora de clase presencial o en línea,Material didáctico básico,Seguimiento de progreso semanal,Recomendación de canciones según nivel"

  # ── Rob Photography (artist02) — FOTOGRAFO Antigua Guatemala ─────────────
  "1|fotografia|fotografia-boda-rob|Fotografía de Boda Completa|Cobertura fotográfica de 8 horas: civil y/o religiosa, recepción y momentos únicos.|FIXED|800000|fotografía,boda,cobertura completa|8 horas de cobertura fotográfica,+300 fotos editadas en alta resolución,Entrega en galería digital privada,Álbum impreso 20x25 cm (30 páginas),Segunda cámara incluida,Traslado en Sacatepéquez"
  "1|fotografia|sesion-lifestyle-rob|Sesión Lifestyle Exterior|Sesión fotográfica de 2 horas en exteriores naturales: parejas, familias o individual.|PER_SESSION|250000|fotografía,exterior,lifestyle,parejas|2 horas de sesión en locación,60-80 fotos editadas,Galería digital con descarga,Guía de vestuario previa,1 locación de tu elección en Sacatepéquez"
  "1|fotografia|fotografia-quince-rob|Fotografía de Quinceañera|Cobertura completa del evento de quinceañera: misa, salón y momentos especiales.|FIXED|600000|fotografía,quinceañera,evento,celebración|6 horas de cobertura,+250 fotos editadas,Videofilm resumen de 3 minutos,Álbum digital premium,Sesión previa de 1 hora incluida"

  # ── DJ Alex (artist03) — DJ Ciudad de Guatemala ─────────────────────────
  "2|dj|dj-evento-alex|DJ para Evento Social|Set de 4 horas con equipo de sonido para fiestas, bodas y quinceañeras.|HOURLY|150000|dj,música,fiesta,boda|Sistema de sonido profesional (PA 2000W),Luces LED básicas,Cabina de DJ completa,4 horas de música en vivo,Librería de +50,000 canciones,Coordinación de playlist con el cliente"
  "2|dj|dj-boda-premium-alex|DJ Boda Premium|Cobertura musical completa para boda: coctel, cena y pista de baile, hasta 6 horas.|FIXED|800000|dj,boda,premium,coctel|Sistema de sonido premium (PA 3000W),Iluminación LED tipo club,Máquina de humo o burbujas,6 horas de cobertura musical,Micrófono inalámbrico para brindis,Reunión previa para lista musical personalizada"
  "2|dj|mix-grabacion-alex|Mix y Grabación de Set|Producción y grabación de un set musical personalizado de 60 minutos para tu proyecto.|PER_SESSION|200000|producción,grabación,mix,electrónica|Sesión de grabación de 60 minutos,Archivo WAV y MP3 en alta calidad,1 ronda de ajustes de mezcla,Portada digital para redes sociales"

  # ── Sofía Beauty (artist04) — MAQUILLADOR Quetzaltenango ──────────────────
  "3|maquillaje|maquillaje-novia-sofia|Maquillaje de Novia|Maquillaje nupcial airbrush de larga duración más prueba previa incluida.|PER_SESSION|250000|maquillaje,novia,nupcial,airbrush|Prueba de maquillaje previa,Maquillaje airbrush day-of,Peinado sencillo o recogido incluido,Fijador y retoque al salir,Traslado en Quetzaltenango ciudad"
  "3|maquillaje|maquillaje-quinceanera-sofia|Maquillaje de Quinceañera|Look especial para quinceañera: glamuroso y fotogénico, con duración de 10 horas.|PER_SESSION|180000|maquillaje,quinceañera,glamour,evento|Maquillaje completo con base airbrush,Pestañas postizas incluidas,Peinado festivo,Retoque de medio evento,Asesoría de tono y color previa"
  "3|maquillaje|maquillaje-editorial-sofia|Maquillaje Editorial y Artístico|Sesión de maquillaje creativo para shooting fotográfico, teatro o video.|PER_SESSION|150000|maquillaje,editorial,artístico,shooting|Consulta y concept art previo,Maquillaje artístico o editorial completo,Disponibilidad durante el shooting (hasta 3 horas),Retoques durante la sesión"

  # ── Diego Ink (artist05) — TATUADOR Ciudad de Guatemala ──────────────────
  "4|tatuajes|tatuaje-mediano-diego|Tatuaje Mediano Personalizado|Diseño personalizado de tamaño mediano (10-15 cm), sesión única.|PER_SESSION|350000|tatuaje,realismo,personalizado|Consulta y boceto personalizado,Sesión única (aprox. 2-3 horas),Tinta de alta calidad importada,Instrucciones de cuidado post-tatuaje,Retoque gratuito a las 4 semanas"
  "4|tatuajes|tatuaje-pequeno-flash-diego|Tatuaje Pequeño Flash|Diseño flash de hasta 5 cm del catálogo, entrega el mismo día, sin cita previa en horarios especiales.|PER_SESSION|150000|tatuaje,flash,pequeño,rapido|Diseño del catálogo flash (5cm aprox.),Sesión de 30-60 min,Tinta premium,Cuidados post-tatuaje,Sin cita previa en horarios de walk-in"
  "4|tatuajes|consultoria-diseno-diego|Consulta y Diseño Personalizado|Sesión de consultoría y creación de diseño único antes de tatuar, sin compromiso.|PER_SESSION|50000|tatuaje,diseño,consultoría,arte|1 hora de consulta personalizada,Boceto digital a color,2 rondas de revisión del diseño,Archivo digital del arte final,Abono descontable si contratas el tatuaje"

  # ── Paola Dance (artist06) — OTRO Cobán ──────────────────────────────────
  "5|servicios-artisticos|show-danza-paola|Show de Danza Contemporánea|Presentación artística de 30 minutos para gala, boda o evento cultural.|PER_SESSION|180000|danza,show,contemporáneo,gala|30 minutos de coreografía en vivo,Vestuario profesional incluido,Música en pista o en vivo según acuerdo,Prueba de espacio previo al evento"
  "5|servicios-artisticos|clases-danza-paola|Clases de Danza Privada|Aprende danza contemporánea, ballet o jazz en clases individuales semanales.|HOURLY|60000|danza,clases,ballet,jazz|1 hora de clase individual,Material de calentamiento básico,Plan de progreso mensual,Coreografía de 1 min enseñada al mes,Opción presencial en Cobán o virtual"
  "5|servicios-artisticos|coreografia-evento-paola|Coreografía para Evento Especial|Diseño y ensayo de coreografía grupal para bodas, quinceañeras o shows corporativos.|FIXED|300000|coreografía,grupal,boda,quinceañera|Diseño original de coreografía (2-3 min),Hasta 3 ensayos grupales incluidos,Dirección el día del evento,Selección y edición musical,Vestuario asesorado"

  # ── Humo Barbería (artist07) — OTRO Escuintla ────────────────────────────
  "6|servicios-artisticos|corte-barberia-humberto|Corte y Diseño Premium|Corte clásico + diseño de líneas + tratamiento de barba en barbería física.|PER_SESSION|35000|barbería,corte,diseño,barba|Corte de cabello a tijera o máquina,Diseño de líneas y perfilado,Arreglo y tratamiento de barba,Toalla caliente,Masaje capilar de 5 minutos,Producto terminador incluido"
  "6|servicios-artisticos|corte-expres-humberto|Corte Exprés|Corte limpio y rápido sin barba, ideal para el día de trabajo. Sin cita en horario de apertura.|PER_SESSION|20000|barbería,corte,rápido,básico|Corte de cabello a máquina,Perfilado básico de nuca y contorno,Secado y peinar básico"
  "6|servicios-artisticos|barberia-domicilio-humberto|Servicio VIP a Domicilio|Barbería completa en tu casa u oficina: corte, barba y tratamiento capilar.|PER_SESSION|80000|barbería,domicilio,vip,ejecutivo|Corte a tijera o máquina,Diseño completo de barba,Tratamiento capilar hidratante,Toallas calientes y aromas,Traslado en Escuintla o municipios cercanos,Todo el material incluido"

  # ── Claudia Eventos (artist08) — OTRO Chiquimula ─────────────────────────
  "7|servicios-artisticos|coordinacion-boda-claudia|Coordinación Completa de Boda|Organización integral desde 6 meses antes hasta el cierre del evento.|FIXED|1500000|boda,coordinación,planificación,oriente|Reuniones de planificación mensuales,Gestión de proveedores (florista, catering, fotógrafo),Agenda y cronograma detallado,Presencia el día del evento (12 horas),Coordinación de ceremonia y recepción,Lista de verificación personalizada"
  "7|servicios-artisticos|coordinacion-xv-claudia|Coordinación de Quinceañera|Organización de quinceañera: misa, salón, decoración y proveedores en Oriente.|FIXED|900000|quinceañera,coordinación,oriente,evento|Planificación de 3 meses,Gestión de hasta 8 proveedores,Diseño temático y decoración,Coordinación día del evento (10 horas),Bitácora y cronograma completo"
  "7|servicios-artisticos|asesoria-eventos-claudia|Asesoría de Eventos (por hora)|Consultoría profesional para planificar tu evento sin contratar coordinación completa.|HOURLY|80000|asesoría,consulta,planificación,eventos|1 hora de consulta personalizada,Lista de proveedores recomendados en la región,Cronograma básico de evento,Checklist personalizado,Seguimiento por WhatsApp por 1 semana"

  # ── Sam Lights (artist09) — OTRO Huehuetenango ───────────────────────────
  "8|servicios-artisticos|sonido-concierto-samuel|Sonido e Iluminación para Concierto|Producción técnica completa: PA, monitores, luces y operación en vivo hasta 5 horas.|FIXED|600000|sonido,iluminación,concierto,técnico|Sistema PA profesional (4000W),4 monitores de escenario,Consola digital 32 canales,Rack de iluminación LED (12 cabezas móviles),Operación técnica de sonido e iluminación,5 horas de servicio,Prueba de sonido incluida"
  "8|servicios-artisticos|sonido-ceremonia-samuel|Sonido para Ceremonia o Boda|Sistema de sonido para ceremonia civil o religiosa con música de fondo y micrófono.|PER_SESSION|200000|sonido,ceremonia,boda,micrófono|Sistema de sonido PA (1500W),2 micrófonos inalámbricos,Reproducción de música ambiente,Operación técnica incluida,Hasta 3 horas,Instalación y desmontaje incluidos"
  "8|servicios-artisticos|alquiler-equipo-samuel|Alquiler de Equipo con Operador|Alquiler de sistema de sonido o iluminación con técnico presente para tu evento.|HOURLY|120000|sonido,alquiler,equipo,operador|Equipo según requerimiento (PA, luces o ambos),Técnico operador en sitio,Traslado en Huehuetenango y municipios,Instalación y desmontaje,+1 hora de margen sin costo adicional"

  # ── Rena Violin (artist10) — MUSICO Flores/Petén ─────────────────────────
  "9|musica|violin-ceremonia-renata|Violín en Ceremonia|Interpretación en vivo de violín durante ceremonia civil o religiosa (1 hora).|HOURLY|120000|violín,ceremonia,boda,clásico|1 hora de interpretación en vivo,Repertorio clásico y contemporáneo (más de 50 obras),Ensayo de piezas especiales con anticipación,Traslado en Flores y Santa Elena"
  "9|musica|cuarteto-cuerdas-renata|Cuarteto de Cuerdas para Evento|Ensamble de cuarteto (violín, viola, cello y contrabajo) para bodas y galas.|FIXED|500000|cuarteto,cuerdas,gala,boda|4 músicos profesionales,2 horas de presentación,Repertorio clásico, pop o jazz a elegir,Atril y partitura incluidos,Prueba de sonido previa,Traslado en Petén"
  "9|musica|clases-violin-renata|Clases de Violín|Clases de violín presenciales en Flores o virtuales para todos los niveles.|HOURLY|90000|violín,clases,música,aprendizaje|1 hora de clase personalizada,Material de partituras básico,Recomendación de instrumento y cuidado,Plan mensual de progreso,Opción presencial (Flores) o videollamada"
)

# Arrays para almacenar IDs y tokens de artistas creados
declare -a ARTIST_IDS=()
declare -a ARTIST_TOKENS=()

# ---------------------------------------------------------------------------
# Verificar que los servicios estén corriendo
# ---------------------------------------------------------------------------
wait_for_service "$AUTH_URL" "auth-service"
wait_for_service "$USERS_URL" "users-service"
wait_for_service "$ARTISTS_URL" "artists-service"
wait_for_service "$CATALOG_URL" "catalog-service"

# ---------------------------------------------------------------------------
# 1. Crear usuario administrador
# ---------------------------------------------------------------------------
echo ""
echo "👤 Obteniendo token de administrador..."
ADMIN_TOKEN=$(curl -sf -X POST "$AUTH_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@piums.com","password":"Admin1234!"}' 2>/dev/null \
  | jq -r '.token // .accessToken // empty' 2>/dev/null) || true
if [ -n "$ADMIN_TOKEN" ]; then
  echo "   ✅ admin@piums.com (login OK)"
else
  echo "   ⚠️  No se pudo obtener token para admin@piums.com"
fi

# ---------------------------------------------------------------------------
# 2. Crear 10 clientes
# ---------------------------------------------------------------------------
echo ""
echo "👥 Creando 10 clientes de prueba..."
CLIENT_COUNT=0
for i in "${!CLIENT_DATA[@]}"; do
  IFS='|' read -r nombre ciudad departamento <<< "${CLIENT_DATA[$i]}"
  idx=$(printf "%02d" $((i + 1)))
  email="client${idx}@piums.com"

  raw=$(register_user "$email" "Test1234!" "$nombre" "cliente")
  token="${raw%%|*}"
  if [ -n "$token" ]; then
    echo "   ✅ $email — $nombre ($ciudad, $departamento)"
    CLIENT_COUNT=$((CLIENT_COUNT + 1))
  else
    echo "   ⚠️  No se pudo crear $email"
  fi
done
echo "   → $CLIENT_COUNT clientes creados"

# ---------------------------------------------------------------------------
# 3. Crear 10 artistas con perfiles y ubicaciones nacionales
# ---------------------------------------------------------------------------
echo ""
echo "🎨 Creando 10 artistas de prueba..."
ARTIST_COUNT=0
for i in "${!ARTIST_DATA[@]}"; do
  IFS='|' read -r nombre artistName bio category specialties_raw ciudad departamento rateMin rateMax years deposit depositPct instagram tiktokUrl facebook website <<< "${ARTIST_DATA[$i]}"
  idx=$(printf "%02d" $((i + 1)))
  email="artist${idx}@piums.com"

  # Convertir specialties CSV a array JSON
  specialties_json=$(echo "$specialties_raw" | jq -Rc 'split(",")')

  raw=$(register_user "$email" "Test1234!" "$nombre" "artista")
  token="${raw%%|*}"
  auth_id="${raw##*|}"

  if [ -n "$token" ] && [ -n "$auth_id" ]; then
    # Construir payload dinámicamente
    deposit_fields='"requiresDeposit": false'
    if [ "$deposit" = "true" ] && [ "$depositPct" -gt 0 ]; then
      deposit_fields="\"requiresDeposit\": true, \"depositPercentage\": $depositPct"
    fi

    artist_response=$(curl -s -X POST "$ARTISTS_URL/artists" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $token" \
      -d "{
        \"authId\": \"$auth_id\",
        \"email\": \"$email\",
        \"nombre\": \"$nombre\",
        \"artistName\": \"$artistName\",
        \"bio\": \"$bio\",
        \"category\": \"$category\",
        \"specialties\": $specialties_json,
        \"country\": \"GT\",
        \"city\": \"$ciudad\",
        \"state\": \"$departamento\",
        \"hourlyRateMin\": $rateMin,
        \"hourlyRateMax\": $rateMax,
        \"currency\": \"GTQ\",
        \"yearsExperience\": $years,
        \"instagram\": \"$instagram\",
        \"tiktok\": \"$tiktokUrl\",
        \"facebook\": \"$facebook\",
        \"website\": \"$website\",
        $deposit_fields
      }" 2>/dev/null) || true

    artist_id=$(echo "$artist_response" | jq -r '.id // .artist.id // empty' 2>/dev/null) || true

    # Si el perfil ya existía (POST falló), obtenerlo vía GET /artists/me/profile
    if [ -z "$artist_id" ]; then
      me_response=$(curl -s "$ARTISTS_URL/artists/me/profile" \
        -H "Authorization: Bearer $token" 2>/dev/null) || true
      artist_id=$(echo "$me_response" | jq -r '.id // .artist.id // empty' 2>/dev/null) || true
    fi

    ARTIST_IDS+=("${artist_id:-}")
    ARTIST_TOKENS+=("$token")

    echo "   ✅ $email — $artistName ($ciudad, $departamento)"
    ARTIST_COUNT=$((ARTIST_COUNT + 1))
  else
    echo "   ⚠️  No se pudo crear $email"
    ARTIST_IDS+=("")
    ARTIST_TOKENS+=("")
  fi
done
echo "   → $ARTIST_COUNT artistas creados"

# ---------------------------------------------------------------------------
# 4. Crear 10 servicios de catálogo
# ---------------------------------------------------------------------------
echo ""
echo "📦 Creando 10 servicios de catálogo..."
SERVICE_COUNT=0
for row in "${SERVICE_DATA[@]}"; do
  IFS='|' read -r artist_idx category_slug slug name desc pricing_type base_price tags_raw includes_raw <<< "$row"

  artist_token="${ARTIST_TOKENS[$artist_idx]:-}"
  artist_id="${ARTIST_IDS[$artist_idx]:-}"

  if [ -z "$artist_token" ] || [ -z "$artist_id" ]; then
    echo "   ⚠️  Saltando '$name' — artista[$artist_idx] sin token/ID"
    continue
  fi

  # Resolver categoryId por slug
  category_id=$(curl -sf "$CATALOG_URL/api/categories/slug/$category_slug" 2>/dev/null | jq -r '.id // empty' 2>/dev/null) || true
  if [ -z "$category_id" ]; then
    echo "   ⚠️  Saltando '$name' — categoría '$category_slug' no encontrada"
    continue
  fi

  # Convertir tags CSV a array JSON
  tags_json=$(echo "$tags_raw" | jq -Rc 'split(",")')

  # Convertir whatIsIncluded CSV a array JSON
  includes_json=$(echo "$includes_raw" | jq -Rc 'split(",")')

  svc_response=$(curl -s -X POST "$CATALOG_URL/api/services" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $artist_token" \
    -d "{
      \"artistId\": \"$artist_id\",
      \"categoryId\": \"$category_id\",
      \"name\": \"$name\",
      \"slug\": \"$slug\",
      \"description\": \"$desc\",
      \"pricingType\": \"$pricing_type\",
      \"basePrice\": $base_price,
      \"currency\": \"GTQ\",
      \"tags\": $tags_json,
      \"whatIsIncluded\": $includes_json,
      \"isActive\": true
    }" 2>/dev/null) || true

  svc_id=$(echo "$svc_response" | jq -r '.id // .service.id // empty' 2>/dev/null)
  svc_msg=$(echo "$svc_response" | jq -r '.message // empty' 2>/dev/null)
  if [ -n "$svc_id" ]; then
    echo "   ✅ $name (ID: $svc_id)"
    SERVICE_COUNT=$((SERVICE_COUNT + 1))
  elif echo "$svc_msg" | grep -qi "slug\|existe\|duplicate\|unique\|already"; then
    echo "   ↩️  $name (ya existe)"
    SERVICE_COUNT=$((SERVICE_COUNT + 1))
  else
    echo "   ⚠️  No se pudo crear el servicio '$name': $svc_msg"
  fi
done
echo "   → $SERVICE_COUNT servicios de catálogo creados"

# ---------------------------------------------------------------------------
# 5. Crear portfolio items para cada artista
# ---------------------------------------------------------------------------
# Formato: "artist_idx|title|description|type|url|category|tags|isFeatured"
PORTFOLIO_DATA=(
  # María González (0)
  "0|Concierto en Palacio Cultural|Presentación especial ante más de 200 asistentes en el Festival de Cultura 2024.|image|https://picsum.photos/seed/maria-pf1/800/600|Conciertos|música,folk,guitarra,concierto|true"
  "0|Serenata de Bodas en Antigua|Actuación íntima al atardecer para boda al aire libre en Antigua Guatemala.|image|https://picsum.photos/seed/maria-pf2/800/600|Bodas|boda,serenata,íntimo,acústico|false"
  # Roberto Pérez (1)
  "1|Boda en el Jardín de Antigua|Cobertura completa de boda con 320 fotos editadas entregadas en galería privada.|image|https://picsum.photos/seed/rob-pf1/800/600|Bodas|fotografía,boda,jardín,antigua|true"
  "1|Sesión Lifestyle Lago Atitlán|Sesión de pareja al amanecer en el Lago de Atitlán con volcanes de fondo.|image|https://picsum.photos/seed/rob-pf2/800/600|Lifestyle|fotografía,pareja,atitlán,naturaleza|false"
  # Alejandro Díaz (2)
  "2|Festival Electronic Nights 2024|Producción técnica y set en vivo de 4 horas en el festival más grande del año.|image|https://picsum.photos/seed/alex-pf1/800/600|Festivales|dj,festival,electrónica,producción|true"
  "2|Boda en Casa Santo Domingo|Cobertura musical completa de 6 horas: coctel y pista de baile en Antigua.|image|https://picsum.photos/seed/alex-pf2/800/600|Bodas|dj,boda,coctel,música|false"
  # Sofía Morales (3)
  "3|Maquillaje Nupcial Editorial|Trabajo nupcial publicado en revista Boda Guatemala, look airbrush de día completo.|image|https://picsum.photos/seed/sofia-pf1/800/600|Editorial|maquillaje,novia,airbrush,editorial|true"
  "3|Quinceañera Gala en Xela|Transformación completa para quinceañera con peinado y maquillaje glamuroso de gala.|image|https://picsum.photos/seed/sofia-pf2/800/600|Quinceañeras|maquillaje,quinceañera,glamour,xela|false"
  # Diego Castro (4)
  "4|Hiperrealismo: Retrato Familiar|Tatuaje hiperrealista de retrato familiar en brazo completo, 3 sesiones.|image|https://picsum.photos/seed/diego-pf1/800/600|Hiperrealismo|tatuaje,hiperrealismo,retrato,brazo|true"
  "4|Blackwork Geométrico Espalda|Diseño geométrico blackwork en espalda completa, trabajo de 6 sesiones.|image|https://picsum.photos/seed/diego-pf2/800/600|Blackwork|tatuaje,blackwork,geométrico,espalda|false"
  # Paola Ajú (5)
  "5|Gala de Danza Contemporánea 2024|Presentación principal en la Gala Cultural de Alta Verapaz ante 500 asistentes.|image|https://picsum.photos/seed/paola-pf1/800/600|Galas|danza,contemporánea,gala,cobán|true"
  "5|Coreografía de Boda Sorpresa|Show de danza fusión sorpresa para boda en Cobán con ovación de pie del público.|image|https://picsum.photos/seed/paola-pf2/800/600|Bodas|danza,boda,sorpresa,fusión|false"
  # Humberto Ruiz (6)
  "6|Degradado con Diseño Geométrico|Corte + diseño de líneas geométricas + degradado skin fade de alta precisión.|image|https://picsum.photos/seed/humberto-pf1/800/600|Cortes|barbería,degradado,geométrico,diseño|true"
  "6|Barba Classic Viking|Tratamiento y diseño de barba voluminosa estilo Viking con productos premium.|image|https://picsum.photos/seed/humberto-pf2/800/600|Barbas|barbería,barba,viking,diseño|false"
  # Claudia Chávez (7)
  "7|Boda Campestre en Chiquimula|Coordinación completa de boda campestre para 250 invitados con 6 meses de producción.|image|https://picsum.photos/seed/claudia-pf1/800/600|Bodas|boda,coordinación,campestre,chiquimula|true"
  "7|Quinceañera Cielo y Estrellas|Temática inmersiva para 180 invitados con decoración y show especial de luz y color.|image|https://picsum.photos/seed/claudia-pf2/800/600|Quinceañeras|quinceañera,temática,evento,oriente|false"
  # Samuel Tzul (8)
  "8|Producción Técnica Feria Huehue 2024|Diseño de iluminación y PA para concierto principal de la Feria de Huehuetenango.|image|https://picsum.photos/seed/samuel-pf1/800/600|Conciertos|iluminación,sonido,feria,concierto|true"
  "8|Boda al Aire Libre Cuchumatanes|Sonido e iluminación decorativa para ceremonia y recepción en los Cuchumatanes.|image|https://picsum.photos/seed/samuel-pf2/800/600|Bodas|sonido,iluminación,boda,cuchumatanes|false"
  # Renata Morán (9)
  "9|Ceremonia Boda Premium en Petén|Interpretación de violín solista durante ceremonia religiosa y coctel en Flores.|image|https://picsum.photos/seed/renata-pf1/800/600|Bodas|violín,ceremonia,boda,flores|true"
  "9|Cuarteto Gala Corporativa|Ensamble de cuarteto de cuerdas para gala corporativa de empresa multinacional.|image|https://picsum.photos/seed/renata-pf2/800/600|Galas|cuarteto,cuerdas,gala,corporativo|false"
)

echo ""
echo "🖼️  Agregando items de portfolio a artistas..."
PORTFOLIO_COUNT=0
for row in "${PORTFOLIO_DATA[@]}"; do
  IFS='|' read -r artist_idx title description type url category tags_raw isFeatured <<< "$row"

  artist_token="${ARTIST_TOKENS[$artist_idx]:-}"
  artist_id="${ARTIST_IDS[$artist_idx]:-}"

  if [ -z "$artist_token" ] || [ -z "$artist_id" ]; then
    echo "   ⚠️  Saltando portfolio '$title' — artista[$artist_idx] sin token/ID"
    continue
  fi

  tags_json=$(echo "$tags_raw" | jq -Rc 'split(",")')

  pf_response=$(curl -s -X POST "$ARTISTS_URL/artists/$artist_id/portfolio" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $artist_token" \
    -d "{
      \"title\": \"$title\",
      \"description\": \"$description\",
      \"type\": \"$type\",
      \"url\": \"$url\",
      \"category\": \"$category\",
      \"tags\": $tags_json,
      \"isFeatured\": $isFeatured
    }" 2>/dev/null) || true

  pf_id=$(echo "$pf_response" | jq -r '.id // .portfolioItem.id // empty' 2>/dev/null) || true
  if [ -n "$pf_id" ]; then
    echo "   ✅ $title (artista[$artist_idx])"
    PORTFOLIO_COUNT=$((PORTFOLIO_COUNT + 1))
  else
    pf_msg=$(echo "$pf_response" | jq -r '.message // empty' 2>/dev/null) || true
    echo "   ⚠️  No se pudo agregar '$title': $pf_msg"
  fi
done
echo "   → $PORTFOLIO_COUNT items de portfolio creados"

# ---------------------------------------------------------------------------
# 6. Resumen
# ---------------------------------------------------------------------------
echo ""
echo "✅ Seed completado exitosamente"
echo ""
echo "📋 Credenciales de prueba:"
echo "   Admin:      admin@piums.com   / Admin1234!"
echo ""
echo "   Clientes (password: Test1234!):"
for i in "${!CLIENT_DATA[@]}"; do
  IFS='|' read -r nombre ciudad _ <<< "${CLIENT_DATA[$i]}"
  idx=$(printf "%02d" $((i + 1)))
  printf "     client%s@piums.com  — %s (%s)\n" "$idx" "$nombre" "$ciudad"
done
echo ""
echo "   Artistas (password: Test1234!):"
for i in "${!ARTIST_DATA[@]}"; do
  IFS='|' read -r nombre artistName _ category _ ciudad departamento _ <<< "${ARTIST_DATA[$i]}"
  idx=$(printf "%02d" $((i + 1)))
  printf "     artist%s@piums.com  — %s (%s, %s)\n" "$idx" "$artistName" "$ciudad" "$departamento"
done
echo ""
echo "🌐 Endpoints:"
echo "   Auth:    $AUTH_URL"
echo "   Users:   $USERS_URL"
echo "   Artists: $ARTISTS_URL"
echo "   Catalog: $CATALOG_URL"
echo "   Booking: $BOOKING_URL"
