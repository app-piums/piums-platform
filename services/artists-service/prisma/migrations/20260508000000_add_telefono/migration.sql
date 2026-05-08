-- Add telefono (contact number) field to artists table
ALTER TABLE "artists" ADD COLUMN IF NOT EXISTS "telefono" TEXT;
