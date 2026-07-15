-- Datos para que "Recomendados para ti" se pueda demostrar y verificar.
--
-- Por qué existe: el ranking de /api/search/recommended puntúa cercanía, categoría y
-- calidad. Sin dispersión geográfica ni reseñas, los términos de cercanía y calidad dan
-- el valor neutro a todo el catálogo y el orden no cambia nunca — la feature "funciona"
-- pero no hace nada, en silencio. Medido antes de escribir esto: de 14 artistas activos,
-- 2 tenían coordenadas, 1 tenía rating y 0 tenían reservas, y 11 estaban en la misma ciudad.
--
-- Alcance: SOLO los artistas de prueba (seed_artist01..10). Los artistas reales
-- (app.piums, Dave X, SonidoPro) NO se tocan: inventarles una ubicación sería falsear
-- datos de gente real. Se quedan sin coordenadas y con cercanía neutra, que es lo correcto.
--
-- Este script es idempotente: se puede volver a correr.
--
-- Uso (dos bases distintas, ojo):
--   kubectl exec -i -n piums postgres-0 -- psql -U piums -d piums_artists -f - < scripts/seed-recommend-data.sql
--   (la parte de reseñas va a piums_reviews; ver el bloque de abajo)
--
-- Después hay que reindexar, o search-service seguirá sirviendo los valores viejos:
--   kubectl rollout restart deploy/search-service -n piums    # el arranque hace bulkIndexArtists()

-- ─── Geo (base piums_artists) ─────────────────────────────────────────────────
--
-- Repartidos por Guatemala de verdad. Las distancias importan: el scoring usa
-- D0 = 50 km, así que Antigua (~30 km de la capital) apenas penaliza y Xela (~165 km)
-- sí. Si todos estuvieran en la capital, la señal de cercanía sería indistinguible.
--
-- coverageRadius mezcla los tres casos a propósito:
--   - un número  → el bonus de cobertura (0.8) se activa si estás dentro
--   - NULL       → cobertura nacional: viaja a todo el país, pero NO da bonus
--                  ("dispuesto a viajar" no es "está cerca")

UPDATE artists SET "baseLocationLat" = 14.6349, "baseLocationLng" = -90.5069,
       "baseLocationLabel" = 'Ciudad de Guatemala', city = 'Guatemala', "coverageRadius" = 25
 WHERE email = 'seed_artist01@piums.com';   -- Luis Méndez, MUSICO

UPDATE artists SET "baseLocationLat" = 14.5586, "baseLocationLng" = -90.7295,
       "baseLocationLabel" = 'Antigua Guatemala', city = 'Antigua Guatemala', "coverageRadius" = 50
 WHERE email = 'seed_artist02@piums.com';   -- Renata Morán, MUSICO

UPDATE artists SET "baseLocationLat" = 14.6349, "baseLocationLng" = -90.5069,
       "baseLocationLabel" = 'Ciudad de Guatemala', city = 'Guatemala', "coverageRadius" = NULL
 WHERE email = 'seed_artist03@piums.com';   -- Roberto Pérez, FOTOGRAFO — nacional

UPDATE artists SET "baseLocationLat" = 14.8347, "baseLocationLng" = -91.5180,
       "baseLocationLabel" = 'Quetzaltenango', city = 'Quetzaltenango', "coverageRadius" = 25
 WHERE email = 'seed_artist04@piums.com';   -- Sofía Ruiz, FOTOGRAFO — lejos de la capital

UPDATE artists SET "baseLocationLat" = 14.6349, "baseLocationLng" = -90.5069,
       "baseLocationLabel" = 'Ciudad de Guatemala', city = 'Guatemala', "coverageRadius" = 50
 WHERE email = 'seed_artist05@piums.com';   -- Andrea Lima, VIDEOGRAFO

UPDATE artists SET "baseLocationLat" = 14.8000, "baseLocationLng" = -89.5456,
       "baseLocationLabel" = 'Chiquimula', city = 'Chiquimula', "coverageRadius" = NULL
 WHERE email = 'seed_artist06@piums.com';   -- Diego Campos, VIDEOGRAFO — nacional y lejos

UPDATE artists SET "baseLocationLat" = 14.5586, "baseLocationLng" = -90.7295,
       "baseLocationLabel" = 'Antigua Guatemala', city = 'Antigua Guatemala', "coverageRadius" = 25
 WHERE email = 'seed_artist07@piums.com';   -- Carlos Vega, ANIMADOR

UPDATE artists SET "baseLocationLat" = 14.8347, "baseLocationLng" = -91.5180,
       "baseLocationLabel" = 'Quetzaltenango', city = 'Quetzaltenango', "coverageRadius" = NULL
 WHERE email = 'seed_artist08@piums.com';   -- Paola Ajú, ANIMADOR — nacional

UPDATE artists SET "baseLocationLat" = 14.6349, "baseLocationLng" = -90.5069,
       "baseLocationLabel" = 'Ciudad de Guatemala', city = 'Guatemala', "coverageRadius" = 25
 WHERE email = 'seed_artist09@piums.com';   -- Mariana López, CREADOR_CONTENIDO

UPDATE artists SET "baseLocationLat" = 14.5586, "baseLocationLng" = -90.7295,
       "baseLocationLabel" = 'Antigua Guatemala', city = 'Antigua Guatemala', "coverageRadius" = 50
 WHERE email = 'seed_artist10@piums.com';   -- Javier Estrada, OTRO
