-- Reseñas de prueba para poder demostrar el término de calidad de /api/search/recommended.
--
-- Por qué en un archivo aparte: el índice de search-service NO lee el rating de la tabla
-- `artists` — lo pide a reviews-service (`getArtistRating`), que vive en OTRA base
-- (piums_reviews). Sembrar `artists.rating` no tendría ningún efecto sobre el ranking.
--
-- La distribución no es arbitraria: incluye a propósito los dos casos que calibran
-- la fórmula, para poder verificarla de un vistazo.
--   - seed_artist01: 4.9 con 50 reseñas  → calidad alta y creíble
--   - seed_artist02: 5.0 con UNA reseña  → la trampa. El término bayesiano debe
--                                          dejarlo POR DEBAJO del 4.9/50.
--   - seed_artist10: 2.0 con 25 reseñas  → malo y creíble; no debe subir por estar cerca
--   - seed_artist08: sin reseñas         → artista nuevo, visible pero sin dominar
--
-- Solo toca artistas de prueba. La reseña real existente (de Dave X) no se toca.
-- Idempotente: borra sus propias filas por el marcador '[seed]' antes de insertar.
--
-- Uso:
--   kubectl exec -i -n piums postgres-0 -- psql -U piums -d piums_reviews -f - < scripts/seed-recommend-reviews.sql

BEGIN;

-- Limpieza de corridas anteriores de ESTE script (por el marcador, no por artista:
-- así nunca se lleva por delante una reseña real).
DELETE FROM reviews WHERE comment LIKE '[seed]%';

-- artistId → (número de reseñas de 5, de 4, de 3, de 2)
-- Los promedios salen exactos: 01→4.9, 03→4.5, 04→4.8, 05→4.25, 06→3.5, 07→4.67, 09→4.0, 10→2.0
INSERT INTO reviews (id, "clientId", "artistId", rating, comment, status, "isVerified", "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'test-client-001', a.artist_id, s.stars,
       '[seed] Reseña de prueba', 'APPROVED', true, now(), now()
FROM (VALUES
    -- (artistId, estrellas, cuántas)
    ('435c1194-7899-4f7c-a36d-abfde97005d4', 5, 45), ('435c1194-7899-4f7c-a36d-abfde97005d4', 4, 5),   -- 01 Luis Méndez  → 4.90 (50)
    ('2ae08f8a-40bd-4822-8f4b-d6c3787a94e3', 5, 1),                                                     -- 02 Renata Morán → 5.00 (1)  ← la trampa
    ('6b8dea1e-48f5-44d7-bb75-d64e09b20482', 5, 6),  ('6b8dea1e-48f5-44d7-bb75-d64e09b20482', 4, 6),   -- 03 Roberto Pérez→ 4.50 (12)
    ('7378ecb2-61de-4672-9ebd-77f639946679', 5, 24), ('7378ecb2-61de-4672-9ebd-77f639946679', 4, 6),   -- 04 Sofía Ruiz   → 4.80 (30)
    ('ce0a6560-84d0-41aa-a8a2-0d0cda55bb08', 5, 2),  ('ce0a6560-84d0-41aa-a8a2-0d0cda55bb08', 4, 6),   -- 05 Andrea Lima  → 4.25 (8)
    ('002e5f4c-81e0-467f-8337-a4b089c6a7f6', 4, 10), ('002e5f4c-81e0-467f-8337-a4b089c6a7f6', 3, 10),  -- 06 Diego Campos → 3.50 (20)
    ('bf051e68-b459-4965-a4ef-9aaad1bf911a', 5, 10), ('bf051e68-b459-4965-a4ef-9aaad1bf911a', 4, 5),   -- 07 Carlos Vega  → 4.67 (15)
    -- 08 Paola Ajú: sin reseñas, a propósito
    ('412cd169-b165-4faf-a410-dcec3c721aba', 4, 5),                                                     -- 09 Mariana López→ 4.00 (5)
    ('ac646a7e-a09b-4deb-b4f1-463f8deb0dd9', 2, 25)                                                     -- 10 Javier Estrada→2.00 (25)
) AS a(artist_id, stars, n)
CROSS JOIN LATERAL generate_series(1, a.n) AS g
CROSS JOIN LATERAL (SELECT a.stars AS stars) AS s;

-- Recalcular el agregado. NO es opcional: reviews-service no calcula el rating al
-- vuelo, lo sirve desde la tabla `artist_ratings`, y search-service lo lee de ahí vía
-- GET /api/reviews/artists/:id/rating. Sin este paso las reseñas existen pero el
-- endpoint devuelve averageRating = 0 y el índice se queda a cero — comprobado.
-- (La ruta oficial /rating/update exige auth de admin; esto recalcula lo mismo.)
INSERT INTO artist_ratings (
    id, "artistId", "averageRating",
    "rating1Count", "rating2Count", "rating3Count", "rating4Count", "rating5Count",
    "totalReviews", "totalWithComment", "totalWithPhotos", "responseRate",
    "lastCalculatedAt", "createdAt", "updatedAt"
)
SELECT gen_random_uuid(), r."artistId", avg(r.rating)::float,
       count(*) FILTER (WHERE r.rating = 1), count(*) FILTER (WHERE r.rating = 2),
       count(*) FILTER (WHERE r.rating = 3), count(*) FILTER (WHERE r.rating = 4),
       count(*) FILTER (WHERE r.rating = 5),
       count(*), count(*) FILTER (WHERE r.comment IS NOT NULL), 0, 0,
       now(), now(), now()
FROM reviews r
WHERE r.status = 'APPROVED' AND r."deletedAt" IS NULL
GROUP BY r."artistId"
ON CONFLICT ("artistId") DO UPDATE SET
    "averageRating"    = EXCLUDED."averageRating",
    "rating1Count"     = EXCLUDED."rating1Count",
    "rating2Count"     = EXCLUDED."rating2Count",
    "rating3Count"     = EXCLUDED."rating3Count",
    "rating4Count"     = EXCLUDED."rating4Count",
    "rating5Count"     = EXCLUDED."rating5Count",
    "totalReviews"     = EXCLUDED."totalReviews",
    "totalWithComment" = EXCLUDED."totalWithComment",
    "lastCalculatedAt" = now(),
    "updatedAt"        = now();

COMMIT;

-- Comprobación: debe cuadrar con los promedios comentados arriba.
SELECT "artistId", round("averageRating"::numeric, 2) AS promedio, "totalReviews" AS resenas
FROM artist_ratings ORDER BY promedio DESC;
