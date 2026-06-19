-- Activa el módulo unaccent (necesario para búsquedas sin acento)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Configuración de texto en español con soporte de acentos
-- Copia la config estándar 'spanish' y reemplaza el mapping de palabras
-- para pasar por unaccent antes del stemmer
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config WHERE cfgname = 'spanish_unaccent'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION spanish_unaccent (COPY = pg_catalog.spanish);
    ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
      ALTER MAPPING FOR hword, hword_part, word
      WITH unaccent, spanish_stem;
  END IF;
END$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- ArtistIndex: backfill de searchVector para datos existentes
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE "ArtistIndex" SET "searchVector" =
  setweight(to_tsvector('spanish_unaccent', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('spanish_unaccent',
    coalesce(array_to_string(specialties, ' '), '') || ' ' ||
    coalesce(array_to_string("serviceTitles", ' '), '')
  ), 'B') ||
  setweight(to_tsvector('spanish_unaccent', coalesce(bio, '')), 'C');

-- GIN index para búsquedas rápidas sobre searchVector
CREATE INDEX IF NOT EXISTS "ArtistIndex_searchVector_idx"
  ON "ArtistIndex" USING GIN("searchVector");

-- Función trigger: mantiene searchVector actualizado en cada INSERT/UPDATE
CREATE OR REPLACE FUNCTION update_artist_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('spanish_unaccent', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('spanish_unaccent',
      coalesce(array_to_string(NEW.specialties, ' '), '') || ' ' ||
      coalesce(array_to_string(NEW."serviceTitles", ' '), '')
    ), 'B') ||
    setweight(to_tsvector('spanish_unaccent', coalesce(NEW.bio, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trig_artist_search_vector
  BEFORE INSERT OR UPDATE ON "ArtistIndex"
  FOR EACH ROW EXECUTE FUNCTION update_artist_search_vector();

-- ──────────────────────────────────────────────────────────────────────────────
-- ServiceIndex: backfill de searchVector para datos existentes
-- ──────────────────────────────────────────────────────────────────────────────
UPDATE "ServiceIndex" SET "searchVector" =
  setweight(to_tsvector('spanish_unaccent',
    coalesce(title, '') || ' ' || coalesce(category, '')
  ), 'A') ||
  setweight(to_tsvector('spanish_unaccent',
    coalesce(array_to_string(tags, ' '), '') || ' ' || coalesce("artistName", '')
  ), 'B') ||
  setweight(to_tsvector('spanish_unaccent', coalesce(description, '')), 'C');

-- GIN index
CREATE INDEX IF NOT EXISTS "ServiceIndex_searchVector_idx"
  ON "ServiceIndex" USING GIN("searchVector");

-- Función trigger para ServiceIndex
CREATE OR REPLACE FUNCTION update_service_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('spanish_unaccent',
      coalesce(NEW.title, '') || ' ' || coalesce(NEW.category, '')
    ), 'A') ||
    setweight(to_tsvector('spanish_unaccent',
      coalesce(array_to_string(NEW.tags, ' '), '') || ' ' || coalesce(NEW."artistName", '')
    ), 'B') ||
    setweight(to_tsvector('spanish_unaccent', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trig_service_search_vector
  BEFORE INSERT OR UPDATE ON "ServiceIndex"
  FOR EACH ROW EXECUTE FUNCTION update_service_search_vector();
