-- Simplify ArtistCategory enum to 5 initial categories
-- Existing rows are remapped: FOTOGRAFO→FOTOGRAFO, VIDEOGRAFO→VIDEOGRAFO, MUSICO→MUSICO, rest→MUSICO

ALTER TYPE "ArtistCategory" RENAME TO "ArtistCategory_old";

CREATE TYPE "ArtistCategory" AS ENUM ('MUSICO', 'FOTOGRAFO', 'VIDEOGRAFO', 'PAYASO', 'MAESTRO_CEREMONIA');

ALTER TABLE "artists"
  ALTER COLUMN "category" TYPE "ArtistCategory"
  USING (
    CASE "category"::text
      WHEN 'MUSICO'     THEN 'MUSICO'
      WHEN 'FOTOGRAFO'  THEN 'FOTOGRAFO'
      WHEN 'VIDEOGRAFO' THEN 'VIDEOGRAFO'
      ELSE 'MUSICO'
    END
  )::"ArtistCategory";

DROP TYPE "ArtistCategory_old";
