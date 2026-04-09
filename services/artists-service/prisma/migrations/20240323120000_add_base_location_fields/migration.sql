-- Add base location support for artists
ALTER TABLE "artists"
  ADD COLUMN IF NOT EXISTS "baseLocationLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "baseLocationLat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "baseLocationLng" DOUBLE PRECISION;
