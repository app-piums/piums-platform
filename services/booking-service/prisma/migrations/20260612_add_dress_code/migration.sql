-- Código de vestimenta solicitado por el cliente en la reserva
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "dressCode" VARCHAR(100);
