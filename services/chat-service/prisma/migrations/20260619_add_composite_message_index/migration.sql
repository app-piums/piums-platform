-- Reemplaza el índice simple por un índice compuesto para acelerar la paginación de mensajes
DROP INDEX IF EXISTS "messages_conversationId_idx";
CREATE INDEX "messages_conversationId_createdAt_idx" ON "messages"("conversationId", "createdAt" DESC);
