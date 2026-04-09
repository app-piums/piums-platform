-- ============================================================
-- LIMPIEZA DE CATALOG + CORRECCION DE BOOKING CON AUTH_ID
-- Ejecutar DESPUES de restore_artist_ids.sql
-- ============================================================

BEGIN;

-- 1. CATALOG: eliminar servicios duplicados (post-reset) que
--    ahora quedarian huerfanos porque sus artistId ya no existen.
--    Los servicios VIEJOS (con los ids correctos) ya estan en el catalogo.
DELETE FROM services WHERE "artistId" IN (
  '3ad56b7a-b36e-44c5-af1a-15f2e66766b4',  -- old new id artist01
  '50627804-8eb1-4b8a-8e82-35142e7d2049',  -- old new id artist02
  '7e6768c7-13d5-444d-b43f-c7fffb54d4c9',  -- old new id artist03
  '7c2a62c7-5787-49e0-b226-5807719eda2e',  -- old new id artist06
  '8c40a4d2-cfc1-4cc4-a607-b52593239296',  -- old new id artist07
  '17c71c42-9f19-4a39-9c6d-95267bb644b6'   -- old new id artist08
);

COMMIT;
