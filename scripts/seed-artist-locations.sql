-- Seed de ubicaciones base para artistas guatemaltecos
-- Coordenadas aproximadas del centro de cada ciudad

-- Ciudad de Guatemala (centro histórico - Zona 1)
UPDATE "artists" 
SET 
  "baseLocationLabel" = city,
  "baseLocationLat" = 14.6349,
  "baseLocationLng" = -90.5069
WHERE city IN ('Ciudad de Guatemala', 'Guatemala') AND "baseLocationLabel" IS NULL;

-- Antigua Guatemala
UPDATE "artists" 
SET 
  "baseLocationLabel" = 'Antigua Guatemala',
  "baseLocationLat" = 14.5586,
  "baseLocationLng" = -90.7339
WHERE city = 'Antigua Guatemala' AND "baseLocationLabel" IS NULL;

-- Quetzaltenango (Xela)
UPDATE "artists" 
SET 
  "baseLocationLabel" = 'Quetzaltenango',
  "baseLocationLat" = 14.8344,
  "baseLocationLng" = -91.5187
WHERE city = 'Quetzaltenango' AND "baseLocationLabel" IS NULL;

-- Cobán
UPDATE "artists" 
SET 
  "baseLocationLabel" = 'Cobán',
  "baseLocationLat" = 15.4742,
  "baseLocationLng" = -90.3708
WHERE city = 'Cobán' AND "baseLocationLabel" IS NULL;

-- Escuintla
UPDATE "artists" 
SET 
  "baseLocationLabel" = 'Escuintla',
  "baseLocationLat" = 14.3050,
  "baseLocationLng" = -90.7850
WHERE city = 'Escuintla' AND "baseLocationLabel" IS NULL;

-- Flores (Petén)
UPDATE "artists" 
SET 
  "baseLocationLabel" = 'Flores',
  "baseLocationLat" = 16.9281,
  "baseLocationLng" = -89.8914
WHERE city = 'Flores' AND "baseLocationLabel" IS NULL;

-- Huehuetenango
UPDATE "artists" 
SET 
  "baseLocationLabel" = 'Huehuetenango',
  "baseLocationLat" = 15.3197,
  "baseLocationLng" = -91.4719
WHERE city = 'Huehuetenango' AND "baseLocationLabel" IS NULL;

-- Chiquimula
UPDATE "artists" 
SET 
  "baseLocationLabel" = 'Chiquimula',
  "baseLocationLat" = 14.7998,
  "baseLocationLng" = -89.5456
WHERE city = 'Chiquimula' AND "baseLocationLabel" IS NULL;

-- Retalhuleu
UPDATE "artists" 
SET 
  "baseLocationLabel" = 'Retalhuleu',
  "baseLocationLat" = 14.5378,
  "baseLocationLng" = -91.6731
WHERE city = 'Retalhuleu' AND "baseLocationLabel" IS NULL;

-- Mazatenango
UPDATE "artists" 
SET 
  "baseLocationLabel" = 'Mazatenango',
  "baseLocationLat" = 14.5342,
  "baseLocationLng" = -91.5033
WHERE city = 'Mazatenango' AND "baseLocationLabel" IS NULL;

-- Jalapa
UPDATE "artists" 
SET 
  "baseLocationLabel" = 'Jalapa',
  "baseLocationLat" = 14.6342,
  "baseLocationLng" = -89.9889
WHERE city = 'Jalapa' AND "baseLocationLabel" IS NULL;

-- Verificar resultado
SELECT 
  nombre,
  city,
  "baseLocationLabel",
  "baseLocationLat",
  "baseLocationLng"
FROM "artists"
ORDER BY city;
