-- Video presentación ("historia") del artista: un único clip persistente de 30s.
-- Columnas aditivas y nullable → cero downtime, sin backfill.
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "storyVideo" TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "storyVideoPosterUrl" TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "storyVideoPublicId" TEXT;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "storyVideoDurationMs" INTEGER;
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "storyVideoUpdatedAt" TIMESTAMP(3);
