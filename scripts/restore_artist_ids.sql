-- ============================================================
-- RESTAURACION DE ARTIST IDs PARA RESERVAS ACTIVAS
-- Estrategia: actualizar el id del perfil actual al id viejo
-- que las reservas ya referencian, sin tocar bookings.
-- ============================================================

BEGIN;

-- 1. ARTISTAS: cambiar id nuevo por id viejo en piums_artists
-- artist01 Maria G. (MUSICO)
UPDATE artists SET id = 'c2364f41-9d9f-4a90-ab7e-13049a8737a9', "updatedAt" = NOW()
  WHERE email = 'artist01@piums.com';

-- artist02 Roberto Perez (FOTOGRAFO)
UPDATE artists SET id = 'fd5c55ef-5fa7-4731-a099-dfbfb04e2435', "updatedAt" = NOW()
  WHERE email = 'artist02@piums.com';

-- artist03 DJ Alex Cruz (DJ)
UPDATE artists SET id = '7a737a87-76fd-4c4b-920f-f6ccc6b90842', "updatedAt" = NOW()
  WHERE email = 'artist03@piums.com';

-- artist06 Paola Dance Company (OTRO)
UPDATE artists SET id = '6235a2fa-de4b-4485-be00-05c081afab53', "updatedAt" = NOW()
  WHERE email = 'artist06@piums.com';

-- artist07 Humo Barberia Premium (OTRO)
UPDATE artists SET id = '84804157-af42-4574-8e34-74293c041a9c', "updatedAt" = NOW()
  WHERE email = 'artist07@piums.com';

-- artist08 Claudia Chavez (OTRO)
UPDATE artists SET id = 'b75bf8da-04bc-43cf-ae04-2b8ab62a1900', "updatedAt" = NOW()
  WHERE email = 'artist08@piums.com';

-- 2. INSERT perfil minimal para artista@piums.com (cuenta test anterior al seed)
-- Tenia id 0dcef5d1, servicio "Musica en vivo", 2 reservas activas
INSERT INTO artists (
  id, "authId", email, nombre, category,
  country, city, "isActive", "verificationStatus",
  "yearsExperience", "coverageRadius", currency,
  rating, "reviewCount", "bookingCount", equipment,
  "createdAt", "updatedAt"
) VALUES (
  '0dcef5d1-d843-4ae3-9e08-8e3b59ab91eb',
  '47f348e8-24a3-4d55-802c-0dbfaed5a98b',
  'artista@piums.com',
  'Artista Piums',
  'MUSICO',
  'GT', 'Guatemala',
  true, 'PENDING',
  0, 10, 'GTQ',
  0.0, 0, 0, ARRAY[]::text[],
  NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;

COMMIT;
