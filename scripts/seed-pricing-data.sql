-- Script para crear datos de prueba del sistema de pricing
-- Ejecutar en la base de datos piums_catalog

-- 1. Crear una categoría de prueba
INSERT INTO service_categories (id, name, slug, description, "createdAt", "updatedAt")
VALUES 
  ('cat-test-001', 'DJ y Música', 'dj-musica', 'Servicios de DJ y música en vivo', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Crear un servicio con pricing FIXED
INSERT INTO services (
  id, "artistId", name, slug, description, "categoryId", "pricingType", "basePrice", currency, "isAvailable", status, "createdAt", "updatedAt"
)
VALUES (
  'service-fixed-001',
  'artist-test-001',
  'Sesión de fotos corporativas',
  'sesion-fotos-corporativas',
  'Sesión profesional de fotos para eventos corporativos',
  'cat-test-001',
  'FIXED', -- PricingType: FIXED, HOURLY, PER_SESSION, CUSTOM
  150000, -- $1,500 MXN
  'MXN',
  true,
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, "basePrice" = EXCLUDED."basePrice", "updatedAt" = NOW();

-- Pricing FIXED para el servicio de fotos
INSERT INTO service_pricing (id, "serviceId", "pricingModel", currency, "basePriceCents", "createdAt", "updatedAt")
VALUES (
  'pricing-fixed-001',
  'service-fixed-001',
  'FIXED',
  'MXN',
  150000, -- $1,500 fijo
  NOW(),
  NOW()
)
ON CONFLICT ("serviceId") DO UPDATE
SET "basePriceCents" = EXCLUDED."basePriceCents", "updatedAt" = NOW();

-- 3. Crear un servicio con pricing BASE_PLUS_HOURLY
INSERT INTO services (
  id, "artistId", name, slug, description, "categoryId", "pricingType", "basePrice", currency, "isAvailable", status, "requiresDeposit", "depositPercentage", "createdAt", "updatedAt"
)
VALUES (
  'service-hourly-001',
  'artist-test-002',
  'DJ para eventos',
  'dj-para-eventos',
  'DJ profesional para bodas, fiestas y eventos',
  'cat-test-001',
  'HOURLY',
  500000, -- $5,000 base
  'MXN',
  true,
  'ACTIVE',
  true,
  50, -- 50% de depósito
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, "basePrice" = EXCLUDED."basePrice", "updatedAt" = NOW();

-- Pricing BASE_PLUS_HOURLY para DJ
INSERT INTO service_pricing (
  id, "serviceId", "pricingModel", currency, "basePriceCents", "includedMinutes", "extraMinutePriceCents", "minNoticeHours", "createdAt", "updatedAt"
)
VALUES (
  'pricing-hourly-001',
  'service-hourly-001',
  'BASE_PLUS_HOURLY',
  'MXN',
  500000, -- $5,000 base
  180,    -- Incluye 3 horas (180 min)
  1000,   -- $10 por minuto extra
  48,     -- 48 horas de anticipación
  NOW(),
  NOW()
)
ON CONFLICT ("serviceId") DO UPDATE
SET "basePriceCents" = EXCLUDED."basePriceCents", 
    "includedMinutes" = EXCLUDED."includedMinutes",
    "extraMinutePriceCents" = EXCLUDED."extraMinutePriceCents",
    "updatedAt" = NOW();

-- Addons para el servicio de DJ
INSERT INTO service_addons (id, "serviceId", name, description, price, "isRequired", "isOptional", "isDefault", "createdAt")
VALUES 
  ('addon-dj-001', 'service-hourly-001', 'Luces LED premium', 'Sistema de iluminación profesional', 10000, false, true, false, NOW()),
  ('addon-dj-002', 'service-hourly-001', 'Micrófono inalámbrico', 'Micrófono profesional con receptor', 5000, false, true, false, NOW()),
  ('addon-dj-003', 'service-hourly-001', 'Seguro de equipo', 'Seguro obligatorio para el equipo', 8000, true, false, true, NOW())
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, price = EXCLUDED.price, "isRequired" = EXCLUDED."isRequired";

-- Reglas de viaje para el DJ
INSERT INTO service_travel_rules (id, "serviceId", "includedKm", "pricePerKmCents", "maxDistanceKm", "createdAt", "updatedAt")
VALUES (
  'travel-dj-001',
  'service-hourly-001',
  10,  -- Primeros 10 km gratis
  500, -- $5 por km adicional
  50,  -- Máximo 50 km
  NOW(),
  NOW()
)
ON CONFLICT ("serviceId") DO UPDATE
SET "includedKm" = EXCLUDED."includedKm", 
    "pricePerKmCents" = EXCLUDED."pricePerKmCents",
    "maxDistanceKm" = EXCLUDED."maxDistanceKm",
    "updatedAt" = NOW();

-- 4. Crear un servicio con pricing PACKAGE
INSERT INTO services (
  id, "artistId", name, slug, description, "categoryId", "pricingType", "basePrice", currency, "isAvailable", status, "createdAt", "updatedAt"
)
VALUES (
  'service-package-001',
  'artist-test-003',
  'Maquillaje profesional',
  'maquillaje-profesional',
  'Servicio de maquillaje para eventos especiales',
  'cat-test-001',
  'PER_SESSION',
  200000, -- $2,000
  'MXN',
  true,
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, "basePrice" = EXCLUDED."basePrice", "updatedAt" = NOW();

-- Pricing PACKAGE para maquillaje
INSERT INTO service_pricing (
  id, "serviceId", "pricingModel", currency, "basePriceCents", "includedMinutes", "extraMinutePriceCents", "createdAt", "updatedAt"
)
VALUES (
  'pricing-package-001',
  'service-package-001',
  'PACKAGE',
  'MXN',
  200000, -- $2,000
  120,    -- Paquete de 2 horas
  500,    -- $5 por minuto extra
  NOW(),
  NOW()
)
ON CONFLICT ("serviceId") DO UPDATE
SET "basePriceCents" = EXCLUDED."basePriceCents",
    "includedMinutes" = EXCLUDED."includedMinutes",
    "updatedAt" = NOW();

-- Addons para maquillaje
INSERT INTO service_addons (id, "serviceId", name, description, price, "isRequired", "isOptional", "createdAt")
VALUES 
  ('addon-makeup-001', 'service-package-001', 'Peinado', 'Peinado profesional incluido', 30000, false, true, NOW()),
  ('addon-makeup-002', 'service-package-001', 'Airbrush', 'Maquillaje con técnica airbrush', 20000, false, true, NOW())
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, price = EXCLUDED.price;

-- Reglas de viaje para maquillaje
INSERT INTO service_travel_rules (id, "serviceId", "includedKm", "pricePerKmCents", "maxDistanceKm", "createdAt", "updatedAt")
VALUES (
  'travel-makeup-001',
  'service-package-001',
  15,  -- 15 km incluidos
  600, -- $6 por km extra
  80,  -- Máximo 80 km
  NOW(),
  NOW()
)
ON CONFLICT ("serviceId") DO UPDATE
SET "includedKm" = EXCLUDED."includedKm", "updatedAt" = NOW();

-- Mostrar resumen de lo creado
SELECT 
  s.id,
  s.name,
  sp."pricingModel",
  sp."basePriceCents" / 100.0 as base_price_mxn,
  sp."includedMinutes",
  sp."extraMinutePriceCents" / 100.0 as extra_minute_price_mxn,
  (SELECT COUNT(*) FROM service_addons WHERE "serviceId" = s.id) as addons_count,
  tr."includedKm",
  tr."pricePerKmCents" / 100.0 as price_per_km_mxn
FROM services s
LEFT JOIN service_pricing sp ON s.id = sp."serviceId"
LEFT JOIN service_travel_rules tr ON s.id = tr."serviceId"
WHERE s.id IN ('service-fixed-001', 'service-hourly-001', 'service-package-001')
ORDER BY s.id;
