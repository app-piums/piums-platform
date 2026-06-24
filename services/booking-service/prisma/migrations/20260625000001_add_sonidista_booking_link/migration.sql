-- Vinculación de reservas para el addon de sonidista
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "linkedBookingId" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "bookingRole" TEXT;
CREATE INDEX IF NOT EXISTS "bookings_linkedBookingId_idx" ON "bookings" ("linkedBookingId");
