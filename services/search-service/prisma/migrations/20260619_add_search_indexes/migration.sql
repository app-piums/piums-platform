-- Índice compuesto para el filtro principal de búsqueda (isActive + isVerified + rating)
CREATE INDEX IF NOT EXISTS "ArtistIndex_active_verified_rating_idx" ON "ArtistIndex"("isActive", "isVerified", "averageRating" DESC);

-- Índice compuesto para analytics queries en SearchQuery
CREATE INDEX IF NOT EXISTS "SearchQuery_queryType_createdAt_idx" ON "SearchQuery"("queryType", "createdAt" DESC);
