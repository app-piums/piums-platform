#!/bin/bash

# ============================================================================
# SEED: Escenario Completo de Prueba (Directa en Base de Datos)
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌱 Creando Escenario Completo de Prueba${NC}\n"

# ========== IDs de usuarios ==========
CLIENT_ID="fe3e467b-2a1e-46e6-a36b-e961f391aed0"
ARTIST02_ID="5e83275d-661e-4f51-b011-ff859299dd53"  # Rob Photography
ARTIST03_ID="e41eae36-88fb-43f1-aced-9b299c0e7cdb"  # Claudia Eventos
ARTIST05_ID="0d9a4762-c6e7-42c6-a5b2-7311b319c191"  # Diego Ink

echo -e "${YELLOW}[1/5] Creando Categorías de Servicios${NC}\n"

# UUIDs para categorías
PHOTO_CAT_ID="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
DJ_CAT_ID="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
TATTOO_CAT_ID="cccccccc-cccc-cccc-cccc-cccccccccccc"

docker exec -i piums-postgres psql -U piums -d piums_catalog << EOF
INSERT INTO service_categories (id, name, slug, description, icon, "order", "isActive", "createdAt", "updatedAt")
VALUES 
  ('$PHOTO_CAT_ID', 'Fotografía', 'fotografia', 'Servicios de fotografía profesional', 'camera', 1, true, NOW(), NOW()),
  ('$DJ_CAT_ID', 'DJ y Música', 'dj-musica', 'Servicios de DJ y entretenimiento musical', 'music', 2, true, NOW(), NOW()),
  ('$TATTOO_CAT_ID', 'Tatuajes', 'tatuajes', 'Servicios de tatuaje profesional', 'pen', 3, true, NOW(), NOW())
ON CONFLICT DO NOTHING;
SELECT COUNT(*) as categorias FROM service_categories;
EOF
echo -e "${GREEN}✓ Categorías creadas${NC}\n"

echo -e "${YELLOW}[2/5] Creando 6 Servicios${NC}\n"
SVC_PHOTO_2H="f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1"
SVC_PHOTO_BODA="f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2"
SVC_DJ_4H="f3f3f3f3-f3f3-f3f3-f3f3-f3f3f3f3f3f3"
SVC_DJ_BODA="f4f4f4f4-f4f4-f4f4-f4f4-f4f4f4f4f4f4"
SVC_TATTOO_SMALL="f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5"
SVC_TATTOO_MED="f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6"

docker exec -i piums-postgres psql -U piums -d piums_catalog << EOF
INSERT INTO services (id, "artistId", name, slug, description, "categoryId", "pricingType", "basePrice", currency, "durationMin", "durationMax", "requiresDeposit", "depositPercentage", status, "isMainService", "createdAt", "updatedAt")
VALUES
  ('$SVC_PHOTO_2H', '$ARTIST02_ID', 'Sesión Fotográfica 2 Horas', 'sesion-foto-2h', 'Sesión de fotos profesional, incluye 50-100 fotos editadas', '$PHOTO_CAT_ID', 'FIXED', 75000, 'GTQ', 120, 120, true, 50, 'ACTIVE', false, NOW(), NOW()),
  ('$SVC_PHOTO_BODA', '$ARTIST02_ID', 'Cobertura de Boda Completa', 'boda-completa', 'Cobertura de 8 horas de boda', '$PHOTO_CAT_ID', 'FIXED', 250000, 'GTQ', 480, 480, true, 50, 'ACTIVE', false, NOW(), NOW()),
  ('$SVC_DJ_4H', '$ARTIST03_ID', 'DJ para Evento 4 Horas', 'dj-evento-4h', 'DJ profesional para fiestas y eventos', '$DJ_CAT_ID', 'FIXED', 150000, 'GTQ', 240, 240, true, 50, 'ACTIVE', false, NOW(), NOW()),
  ('$SVC_DJ_BODA', '$ARTIST03_ID', 'DJ para Boda', 'dj-boda', 'DJ profesional para bodas completas', '$DJ_CAT_ID', 'FIXED', 350000, 'GTQ', 480, 480, true, 50, 'ACTIVE', false, NOW(), NOW()),
  ('$SVC_TATTOO_SMALL', '$ARTIST05_ID', 'Tatuaje Pequeño', 'tatuaje-pequeno', 'Tatuaje personalizado pequeño', '$TATTOO_CAT_ID', 'FIXED', 30000, 'GTQ', 60, 60, true, 50, 'ACTIVE', false, NOW(), NOW()),
  ('$SVC_TATTOO_MED', '$ARTIST05_ID', 'Tatuaje Mediano', 'tatuaje-mediano', 'Tatuaje personalizado mediano', '$TATTOO_CAT_ID', 'FIXED', 100000, 'GTQ', 180, 180, true, 50, 'ACTIVE', false, NOW(), NOW())
ON CONFLICT DO NOTHING;
SELECT COUNT(*) as servicios FROM services;
EOF
echo -e "${GREEN}✓ Servicios creados${NC}\n"

echo -e "${YELLOW}[3/5] Creando 7 Reservas${NC}\n"
docker exec -i piums-postgres psql -U piums -d piums_bookings << EOF
INSERT INTO bookings (id, "serviceId", "artistId", "clientId", "scheduledDate", "durationMinutes", status, "servicePrice", "totalPrice", "currency", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '$SVC_PHOTO_2H', '$ARTIST02_ID', '$CLIENT_ID', NOW() - INTERVAL '15 days', 120, 'COMPLETED', 75000, 75000, 'GTQ', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
  (gen_random_uuid(), '$SVC_DJ_4H', '$ARTIST03_ID', '$CLIENT_ID', NOW() + INTERVAL '7 days', 240, 'PENDING', 150000, 150000, 'GTQ', NOW(), NOW()),
  (gen_random_uuid(), '$SVC_TATTOO_SMALL', '$ARTIST05_ID', '$CLIENT_ID', NOW() + INTERVAL '3 days', 60, 'CONFIRMED', 30000, 30000, 'GTQ', NOW(), NOW()),
  (gen_random_uuid(), '$SVC_PHOTO_BODA', '$ARTIST02_ID', '$CLIENT_ID', NOW() + INTERVAL '30 days', 480, 'REJECTED', 250000, 250000, 'GTQ', NOW(), NOW()),
  (gen_random_uuid(), '$SVC_DJ_BODA', '$ARTIST03_ID', '$CLIENT_ID', NOW() - INTERVAL '8 days', 480, 'COMPLETED', 350000, 350000, 'GTQ', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
  (gen_random_uuid(), '$SVC_TATTOO_MED', '$ARTIST05_ID', '$CLIENT_ID', NOW() - INTERVAL '25 days', 180, 'CANCELLED_CLIENT', 100000, 100000, 'GTQ', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), '$SVC_PHOTO_BODA', '$ARTIST02_ID', '$CLIENT_ID', NOW() + INTERVAL '45 days', 480, 'CONFIRMED', 250000, 250000, 'GTQ', NOW(), NOW());
SELECT COUNT(*) as reservas FROM bookings;
EOF
echo -e "${GREEN}✓ Reservas creadas${NC}\n"

echo -e "${YELLOW}[4/5] Creando 3 Conversaciones con Mensajes${NC}\n"
CONV1=$(uuidgen | tr '[:upper:]' '[:lower:]')
CONV2=$(uuidgen | tr '[:upper:]' '[:lower:]')
CONV3=$(uuidgen | tr '[:upper:]' '[:lower:]')

docker exec -i piums-postgres psql -U piums -d piums_users << EOF
INSERT INTO conversations (id, "participant1Id", "participant2Id", type, status, "lastMessageAt", "lastMessagePreview", "createdAt", "updatedAt")
VALUES
  ('$CONV1', '$CLIENT_ID', '$ARTIST02_ID', 'DIRECT', 'ACTIVE', NOW() - INTERVAL '3 days', 'Perfecto, hagamos una sesión de prueba', NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days'),
  ('$CONV2', '$CLIENT_ID', '$ARTIST03_ID', 'DIRECT', 'ACTIVE', NOW() - INTERVAL '1 day', 'Excelente, eso puedo hacerlo sin problema', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
  ('$CONV3', '$CLIENT_ID', '$ARTIST05_ID', 'DIRECT', 'ACTIVE', NOW() - INTERVAL '2 days', 'Genial, podemos agendar pronto', NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 days');

INSERT INTO messages (id, "conversationId", "senderId", type, content, status, "deliveredAt", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '$CONV1', '$CLIENT_ID', 'TEXT', 'Hola Rob, me interesa tu sesión fotográfica para una boda', 'SENT', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  (gen_random_uuid(), '$CONV1', '$ARTIST02_ID', 'TEXT', '¡Hola! Claro, tengo disponibilidad el próximo mes', 'SENT', NOW() - INTERVAL '6.5 days', NOW() - INTERVAL '6.5 days', NOW() - INTERVAL '6.5 days'),
  (gen_random_uuid(), '$CONV1', '$CLIENT_ID', 'TEXT', '¿Cuál es tu estilo? ¿Haces fotos creativas?', 'SENT', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  (gen_random_uuid(), '$CONV1', '$ARTIST02_ID', 'TEXT', 'Sí, me especializo en fotos artísticas y naturales', 'SENT', NOW() - INTERVAL '5.5 days', NOW() - INTERVAL '5.5 days', NOW() - INTERVAL '5.5 days'),
  (gen_random_uuid(), '$CONV1', '$CLIENT_ID', 'TEXT', 'Perfecto, me encanta. Hagamos una sesión de prueba', 'SENT', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), '$CONV2', '$CLIENT_ID', 'TEXT', 'Hola Claudia, necesito DJ para una fiesta el próximo mes', 'SENT', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), '$CONV2', '$ARTIST03_ID', 'TEXT', 'Perfecto, tengo disponibilidad. ¿Qué tipo de música prefieres?', 'SENT', NOW() - INTERVAL '4.5 days', NOW() - INTERVAL '4.5 days', NOW() - INTERVAL '4.5 days'),
  (gen_random_uuid(), '$CONV2', '$CLIENT_ID', 'TEXT', 'Pop, reggaeton y un poco de electrónica', 'SENT', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), '$CONV2', '$ARTIST03_ID', 'TEXT', 'Excelente, eso puedo hacerlo sin problema', 'SENT', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), '$CONV3', '$CLIENT_ID', 'TEXT', 'Hola Diego, quiero un tatuaje personalizado', 'SENT', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
  (gen_random_uuid(), '$CONV3', '$ARTIST05_ID', 'TEXT', 'Claro, ¿qué tienes en mente?', 'SENT', NOW() - INTERVAL '5.5 days', NOW() - INTERVAL '5.5 days', NOW() - INTERVAL '5.5 days'),
  (gen_random_uuid(), '$CONV3', '$CLIENT_ID', 'TEXT', 'Un mandala pequeño con símbolos espirituales', 'SENT', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), '$CONV3', '$ARTIST05_ID', 'TEXT', 'Perfecto, tengo varios diseños de mandalas', 'SENT', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
  (gen_random_uuid(), '$CONV3', '$CLIENT_ID', 'TEXT', 'Genial, podemos agendar pronto', 'SENT', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');
SELECT COUNT(*) as conversaciones FROM conversations;
SELECT COUNT(*) as mensajes FROM messages;
EOF
echo -e "${GREEN}✓ Conversaciones y mensajes creados${NC}\n"

echo -e "${YELLOW}[5/5] Creando 3 Reviews${NC}\n"
docker exec -i piums-postgres psql -U piums -d piums_reviews << EOF
INSERT INTO reviews (id, "clientId", "artistId", rating, comment, status, "isVerified", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), '$CLIENT_ID', '$ARTIST02_ID', 5, 'Excelente trabajo profesional. Las fotos quedaron hermosas', 'APPROVED', true, NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
  (gen_random_uuid(), '$CLIENT_ID', '$ARTIST03_ID', 3, 'Buen servicio pero llegó 30 minutos tarde', 'APPROVED', true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
  (gen_random_uuid(), '$CLIENT_ID', '$ARTIST05_ID', 4, 'Muy profesional y creativo. Recomendado!', 'APPROVED', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');
SELECT COUNT(*) as reviews FROM reviews;
EOF
echo -e "${GREEN}✓ Reviews creados${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ ESCENARIO COMPLETO CREADO${NC}"
echo -e "${BLUE}========================================${NC}\n"
echo -e "${GREEN}📊 Verificación Final:${NC}"
docker exec piums-postgres psql -U piums -d piums_catalog -c "SELECT COUNT(*) as servicios FROM services;"
docker exec piums-postgres psql -U piums -d piums_bookings -c "SELECT COUNT(*) as reservas FROM bookings;"
docker exec piums-postgres psql -U piums -d piums_users -c "SELECT COUNT(*) as conversaciones FROM conversations;"
docker exec piums-postgres psql -U piums -d piums_users -c "SELECT COUNT(*) as mensajes FROM messages;"
docker exec piums-postgres psql -U piums -d piums_reviews -c "SELECT COUNT(*) as reviews FROM reviews;"
