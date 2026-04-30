-- Add coverPhoto field to artists table
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "coverPhoto" TEXT;
