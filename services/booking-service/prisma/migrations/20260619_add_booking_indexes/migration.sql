-- Índices para columnas de soft-delete y cancelación, usadas frecuentemente en filtros
CREATE INDEX IF NOT EXISTS "bookings_cancelledAt_idx" ON "bookings"("cancelledAt");
CREATE INDEX IF NOT EXISTS "bookings_deletedAt_idx" ON "bookings"("deletedAt");
CREATE INDEX IF NOT EXISTS "bookings_status_deletedAt_idx" ON "bookings"("status", "deletedAt");
