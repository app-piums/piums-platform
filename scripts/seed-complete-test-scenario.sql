-- ============================================================================
-- SEED COMPLETO: Escenario de Prueba Realista
-- Cliente: client01@piums.com (Ana Cifuentes)
-- Artistas: artist02, artist03, artist05
-- Datos: Servicios, Reservas, Chats, Reviews, Quejas
-- ============================================================================

-- Notas:
-- * Los IDs reales se inyectarán por el script bash
-- * Montos en centavos (100 = 1 GTQ)
-- * Estatus: PENDING, CONFIRMED, COMPLETED, REJECTED, CANCELLED
-- * Reviews: 1-5 stars, con y sin quejas

-- ============================================================================
-- 1. CATÁLOGO - Servicios por Artista
-- ============================================================================

-- Artist02: Rob Photography (Fotografía)
INSERT INTO piums_catalog.service (
  id, artist_id, name, description, base_price_cents, 
  duration_minutes, category_id, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(), 
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1),
  'Sesión Fotográfica Profesional 2 horas',
  'Sesión completa de fotos para evento o retrato. Incluye 200+ fotos editadas.',
  75000,
  120,
  (SELECT id FROM piums_catalog.service_category WHERE name = 'Fotografía' LIMIT 1),
  true,
  NOW(),
  NOW()
);

INSERT INTO piums_catalog.service (
  id, artist_id, name, description, base_price_cents, 
  duration_minutes, category_id, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(), 
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1),
  'Sesión Fotográfica Boda Completa',
  'Cobertura completa de ceremonia y recepción. Incluye álbum digital y 500+ fotos.',
  250000,
  480,
  (SELECT id FROM piums_catalog.service_category WHERE name = 'Fotografía' LIMIT 1),
  true,
  NOW(),
  NOW()
);

-- Artist03: DJ Alex (DJ)
INSERT INTO piums_catalog.service (
  id, artist_id, name, description, base_price_cents, 
  duration_minutes, category_id, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(), 
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1),
  'DJ para Evento 4 horas',
  'Música en vivo con equipo profesional. Iluminación led básica incluida.',
  150000,
  240,
  (SELECT id FROM piums_catalog.service_category WHERE name = 'Música' LIMIT 1),
  true,
  NOW(),
  NOW()
);

INSERT INTO piums_catalog.service (
  id, artist_id, name, description, base_price_cents, 
  duration_minutes, category_id, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(), 
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1),
  'DJ para Boda Completa',
  'Master de ceremonias, música en vivo, iluminación premium y efectos.',
  350000,
  480,
  (SELECT id FROM piums_catalog.service_category WHERE name = 'Música' LIMIT 1),
  true,
  NOW(),
  NOW()
);

-- Artist05: Diego Ink (Tatuador)
INSERT INTO piums_catalog.service (
  id, artist_id, name, description, base_price_cents, 
  duration_minutes, category_id, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(), 
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1),
  'Tatuaje Pequeño (hasta 5cm)',
  'Diseño personalizado. Incluye consulta de dibujo.',
  30000,
  60,
  (SELECT id FROM piums_catalog.service_category WHERE name = 'Tatuajes' LIMIT 1),
  true,
  NOW(),
  NOW()
);

INSERT INTO piums_catalog.service (
  id, artist_id, name, description, base_price_cents, 
  duration_minutes, category_id, is_active, created_at, updated_at
) VALUES (
  gen_random_uuid(), 
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1),
  'Tatuaje Mediano (5-15cm)',
  'Diseño complejo con detalles. 2-3 sesiones.',
  100000,
  180,
  (SELECT id FROM piums_catalog.service_category WHERE name = 'Tatuajes' LIMIT 1),
  true,
  NOW(),
  NOW()
);

-- ============================================================================
-- 2. DISPONIBILIDAD SEMANAL - Todos los artistas
-- ============================================================================

-- Artist02: Disponible Lunes-Viernes
INSERT INTO piums_artists.artist_availability_rule (
  id, artist_id, day_of_week, start_time, end_time, created_at, updated_at
) VALUES 
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1), 'LUNES', '09:00', '18:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1), 'MARTES', '09:00', '18:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1), 'MIERCOLES', '09:00', '18:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1), 'JUEVES', '09:00', '18:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1), 'VIERNES', '09:00', '18:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1), 'SABADO', '10:00', '16:00', NOW(), NOW());

-- Artist03: Disponible para eventos (flexible)
INSERT INTO piums_artists.artist_availability_rule (
  id, artist_id, day_of_week, start_time, end_time, created_at, updated_at
) VALUES 
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1), 'VIERNES', '18:00', '04:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1), 'SABADO', '18:00', '04:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1), 'DOMINGO', '18:00', '04:00', NOW(), NOW());

-- Artist05: Disponible por cita
INSERT INTO piums_artists.artist_availability_rule (
  id, artist_id, day_of_week, start_time, end_time, created_at, updated_at
) VALUES 
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1), 'LUNES', '14:00', '20:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1), 'MARTES', '14:00', '20:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1), 'MIERCOLES', '14:00', '20:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1), 'JUEVES', '14:00', '20:00', NOW(), NOW()),
  (gen_random_uuid(), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1), 'SABADO', '11:00', '19:00', NOW(), NOW());

-- ============================================================================
-- 3. RESERVAS - Diferentes estados y escenarios
-- ============================================================================

-- Booking 1: Rob Photography - COMPLETED + Review positiva
INSERT INTO piums_booking.booking (
  id, event_id, client_id, artist_id, service_id, 
  status, scheduled_at, 
  base_price_cents, total_price_cents,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1),
  (SELECT id FROM piums_catalog.service WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1) LIMIT 1),
  'COMPLETED',
  NOW() - INTERVAL '15 days',
  75000,
  75000,
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '15 days'
);

-- Booking 2: DJ Alex - PENDING (Próxima)
INSERT INTO piums_booking.booking (
  id, event_id, client_id, artist_id, service_id, 
  status, scheduled_at, 
  base_price_cents, total_price_cents,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1),
  (SELECT id FROM piums_catalog.service WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1) LIMIT 1),
  'PENDING',
  NOW() + INTERVAL '7 days',
  150000,
  150000,
  NOW(),
  NOW()
);

-- Booking 3: Diego Ink - CONFIRMED
INSERT INTO piums_booking.booking (
  id, event_id, client_id, artist_id, service_id, 
  status, scheduled_at, 
  base_price_cents, total_price_cents,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1),
  (SELECT id FROM piums_catalog.service WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1) LIMIT 1),
  'CONFIRMED',
  NOW() + INTERVAL '3 days',
  100000,
  100000,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
);

-- Booking 4: Rob Photography - REJECTED
INSERT INTO piums_booking.booking (
  id, event_id, client_id, artist_id, service_id, 
  status, scheduled_at, 
  base_price_cents, total_price_cents,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1),
  (SELECT id FROM piums_catalog.service WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1) AND name LIKE '%Boda%' LIMIT 1),
  'REJECTED',
  NOW() + INTERVAL '30 days',
  250000,
  250000,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '4 days'
);

-- Booking 5: DJ Alex - COMPLETED + Review neutral
INSERT INTO piums_booking.booking (
  id, event_id, client_id, artist_id, service_id, 
  status, scheduled_at, 
  base_price_cents, total_price_cents,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1),
  (SELECT id FROM piums_catalog.service WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1) LIMIT 1),
  'COMPLETED',
  NOW() - INTERVAL '8 days',
  150000,
  150000,
  NOW() - INTERVAL '12 days',
  NOW() - INTERVAL '8 days'
);

-- Booking 6: Diego Ink - CANCELLED
INSERT INTO piums_booking.booking (
  id, event_id, client_id, artist_id, service_id, 
  status, scheduled_at, 
  base_price_cents, total_price_cents,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1),
  (SELECT id FROM piums_catalog.service WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1) AND name LIKE '%Peque%' LIMIT 1),
  'CANCELLED',
  NOW() - INTERVAL '25 days',
  30000,
  0,
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '3 days'
);

-- Booking 7: Rob Photography - CONFIRMED (Próxima boda)
INSERT INTO piums_booking.booking (
  id, event_id, client_id, artist_id, service_id, 
  status, scheduled_at, 
  base_price_cents, total_price_cents,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1),
  (SELECT id FROM piums_catalog.service WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1) AND name LIKE '%Boda%' LIMIT 1),
  'CONFIRMED',
  NOW() + INTERVAL '45 days',
  250000,
  250000,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
);

-- ============================================================================
-- 4. REVIEWS - Diferentes ratings y comentarios
-- ============================================================================

-- Review 1: Positiva para Rob Photography (Booking completed)
INSERT INTO piums_reviews.review (
  id, client_id, artist_id, booking_id,
  rating, title, description, status,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1),
  (SELECT id FROM piums_booking.booking WHERE client_id = (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1) 
    AND artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1)
    AND status = 'COMPLETED' AND scheduled_at < NOW() LIMIT 1),
  5,
  'Excelente trabajo profesional',
  'Rob fue muy puntual, profesional y las fotos quedaron perfectas. Totalmente recomendado.',
  'APPROVED',
  NOW() - INTERVAL '14 days',
  NOW() - INTERVAL '14 days'
);

-- Review 2: Neutral para DJ Alex (Booking completed)
INSERT INTO piums_reviews.review (
  id, client_id, artist_id, booking_id,
  rating, title, description, status,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1),
  (SELECT id FROM piums_booking.booking WHERE client_id = (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1) 
    AND artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1)
    AND status = 'COMPLETED' AND scheduled_at < NOW() LIMIT 1),
  3,
  'Buen servicio pero llegó tarde',
  'La música estuvo bien pero llegó 20 minutos tarde. El equipo funcionó bien. Puntuación justa.',
  'APPROVED',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days'
);

-- Review 3: Positiva para Diego Ink
INSERT INTO piums_reviews.review (
  id, client_id, artist_id, booking_id,
  rating, title, description, status,
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1),
  NULL,
  4,
  'Muy buen tatuador',
  'Diego es muy profesional y tiene excelente higiene. El diseño quedó exacto como lo imaginé.',
  'APPROVED',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '10 days'
);

-- ============================================================================
-- 5. CHATS - Conversaciones con mensajes
-- ============================================================================

-- Conversation 1: Client01 + Artist02
INSERT INTO piums_chat.conversation (
  id, user_id, artist_id, booking_id, 
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1),
  (SELECT id FROM piums_booking.booking WHERE client_id = (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1) 
    AND artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1) LIMIT 1),
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '15 days'
);

-- Messages for conversation 1
INSERT INTO piums_chat.message (
  id, conversation_id, sender_id, sender_type, 
  content, is_read, created_at
) VALUES 
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation LIMIT 1), (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1), 'CLIENT', '¿Puedes hacer fotos para mi evento del próximo mes?', true, NOW() - INTERVAL '20 days'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation LIMIT 1), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1), 'ARTIST', 'Claro! Tengo disponibilidad. ¿Cuáles son los detalles?', true, NOW() - INTERVAL '19 days'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation LIMIT 1), (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1), 'CLIENT', 'Es una boda el 20 de mayo', true, NOW() - INTERVAL '19 days'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation LIMIT 1), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist02_auth_id LIMIT 1), 'ARTIST', 'Perfecto! Ese día estoy libre. Vamos a cerrar los detalles.', true, NOW() - INTERVAL '18 days'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation LIMIT 1), (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1), 'CLIENT', 'Excelente. Acabo de confirmar la reserva en la plataforma.', true, NOW() - INTERVAL '15 days');

-- Conversation 2: Client01 + Artist03
INSERT INTO piums_chat.conversation (
  id, user_id, artist_id, booking_id, 
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1),
  (SELECT id FROM piums_booking.booking WHERE client_id = (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1) 
    AND artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1) AND status = 'PENDING' LIMIT 1),
  NOW() - INTERVAL '3 days',
  NOW()
);

-- Messages for conversation 2 (pending)
INSERT INTO piums_chat.message (
  id, conversation_id, sender_id, sender_type, 
  content, is_read, created_at
) VALUES 
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1) LIMIT 1), (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1), 'CLIENT', 'Hola Alex! Necesito un DJ para una fiesta el próximo viernes', true, NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1) LIMIT 1), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1), 'ARTIST', '¡Hola Ana! Ese viernes estoy disponible. ¿Qué tipo de música prefieres?', true, NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1) LIMIT 1), (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1), 'CLIENT', 'Reggaeton y cumbia principalmente', true, NOW() - INTERVAL '1 day'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1) LIMIT 1), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist03_auth_id LIMIT 1), 'ARTIST', 'Perfecto, eso está en mi zona de confort. Ya creé tu reserva', false, NOW() - INTERVAL '12 hours');

-- Conversation 3: Client01 + Artist05
INSERT INTO piums_chat.conversation (
  id, user_id, artist_id, booking_id, 
  created_at, updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1),
  (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1),
  (SELECT id FROM piums_booking.booking WHERE client_id = (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1) 
    AND artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1) LIMIT 1),
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 day'
);

-- Messages for conversation 3
INSERT INTO piums_chat.message (
  id, conversation_id, sender_id, sender_type, 
  content, is_read, created_at
) VALUES 
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1) LIMIT 1), (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1), 'CLIENT', 'Hola Diego, me interesa hacerme un tatuaje. ¿Tienes disponibilidad?', true, NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1) LIMIT 1), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1), 'ARTIST', 'Claro! Me encantaría. ¿Qué tipo de tatuaje buscas?', true, NOW() - INTERVAL '4 days'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1) LIMIT 1), (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1), 'CLIENT', 'Algo con significado familiar. Un poco grande.', true, NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1) LIMIT 1), (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1), 'ARTIST', 'Perfecto, te puedo hacer un diseño personalizado. Tengo cita el próximo jueves.', true, NOW() - INTERVAL '2 days'),
  (gen_random_uuid(), (SELECT id FROM piums_chat.conversation WHERE artist_id = (SELECT id FROM piums_artists.artist WHERE auth_id = :artist05_auth_id LIMIT 1) LIMIT 1), (SELECT id FROM piums_users.\"user\" WHERE auth_id = :client_auth_id LIMIT 1), 'CLIENT', 'Confirmado! Voy a hacer la reserva', true, NOW() - INTERVAL '1 day');

-- ============================================================================
-- FIN DEL SEED
-- ============================================================================
