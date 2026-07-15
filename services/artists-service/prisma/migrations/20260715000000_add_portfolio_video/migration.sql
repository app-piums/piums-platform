-- Video subido al portafolio (máx 45s / 1080p). Columnas aditivas y nullable → cero downtime.
ALTER TABLE "portfolio_items" ADD COLUMN IF NOT EXISTS "publicId"    TEXT;
ALTER TABLE "portfolio_items" ADD COLUMN IF NOT EXISTS "videoSource" TEXT;
ALTER TABLE "portfolio_items" ADD COLUMN IF NOT EXISTS "durationMs"  INTEGER;
ALTER TABLE "portfolio_items" ADD COLUMN IF NOT EXISTS "width"       INTEGER;
ALTER TABLE "portfolio_items" ADD COLUMN IF NOT EXISTS "height"      INTEGER;

-- Backfill: todo type='video' preexistente es un enlace de YouTube (sin publicId).
-- Correr ANTES de desplegar el código nuevo: una fila 'cloudinary' creada en la
-- ventana intermedia quedaría mal etiquetada y su asset sería imborrable.
--
-- OJO: este UPDATE NO se aplica solo al desplegar. El CMD del Dockerfile cae
-- siempre a `prisma db push` (su gate `[ -f 'prisma/migrations' ]` prueba un
-- ARCHIVO contra un directorio, así que nunca es cierto) y `db push` sincroniza
-- columnas pero no ejecuta este SQL. Además la base no tiene `_prisma_migrations`,
-- así que arreglar el gate haría fallar `migrate deploy` con P3005.
-- Por eso el contrato es null-safe a propósito: la regla de los clientes es
-- `videoSource === 'cloudinary'` ⇒ video subido, y CUALQUIER otra cosa (incluido
-- NULL) ⇒ YouTube. Sin backfill el comportamiento es correcto igual; este UPDATE
-- solo normaliza los datos si se corre a mano.
UPDATE "portfolio_items" SET "videoSource" = 'youtube'
  WHERE "type" = 'video' AND "videoSource" IS NULL;

-- Soporta el conteo del tope de 3 videos subidos por artista.
CREATE INDEX IF NOT EXISTS "portfolio_items_artistId_type_idx"
  ON "portfolio_items"("artistId", "type");
