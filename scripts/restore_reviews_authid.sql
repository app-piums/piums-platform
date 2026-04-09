-- ============================================================
-- CORRECCION REVIEWS: artist03 tenia 1 resena usando su
-- auth_id (a78a29d2) como artistId en lugar del profile id.
-- Redirigir al profile id correcto (7a737a87).
-- ============================================================

BEGIN;

UPDATE reviews
  SET "artistId" = '7a737a87-76fd-4c4b-920f-f6ccc6b90842'
  WHERE "artistId" = 'a78a29d2-fb8d-4870-a55c-bd70b342ac3d';

COMMIT;
