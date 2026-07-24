-- ============================================================================
-- Seed data para Categories y Cities
-- ============================================================================

-- ============================================================================
-- SERVICE CATEGORIES
-- ============================================================================

-- Categorías principales (level 0)
INSERT INTO service_categories (id, name, slug, description, level, path, "order", is_active, is_featured)
VALUES 
  ('cat-beauty-1', 'Belleza y Estética', 'belleza-estetica', 'Servicios de belleza, maquillaje, peinado y estética corporal', 0, 'belleza-estetica', 1, true, true),
  ('cat-health-2', 'Salud y Bienestar', 'salud-bienestar', 'Servicios de salud, masajes, fisioterapia y bienestar', 0, 'salud-bienestar', 2, true, true),
  ('cat-events-3', 'Eventos y Celebraciones', 'eventos-celebraciones', 'Organización de eventos, bodas, fiestas y celebraciones', 0, 'eventos-celebraciones', 3, true, true),
  ('cat-photo-4', 'Fotografía y Video', 'fotografia-video', 'Servicios de fotografía profesional y video', 0, 'fotografia-video', 4, true, true),
  ('cat-music-5', 'Música y Entretenimiento', 'musica-entretenimiento', 'Música en vivo, DJs y entretenimiento para eventos', 0, 'musica-entretenimiento', 5, true, false),
  ('cat-food-6', 'Gastronomía y Catering', 'gastronomia-catering', 'Servicios de catering, chefs privados y repostería', 0, 'gastronomia-catering', 6, true, false),
  ('cat-art-7', 'Arte y Decoración', 'arte-decoracion', 'Servicios artísticos y decoración de espacios', 0, 'arte-decoracion', 7, true, false);

-- Subcategorías de Belleza y Estética (level 1)
INSERT INTO service_categories (id, name, slug, description, parent_id, level, path, "order", is_active)
VALUES 
  ('cat-makeup-11', 'Maquillaje', 'maquillaje', 'Maquillaje profesional para eventos, bodas y sesiones', 'cat-beauty-1', 1, 'belleza-estetica/maquillaje', 1, true),
  ('cat-hair-12', 'Peinado y Estilismo','peinado-estilismo', 'Peinados y estilismo capilar profesional', 'cat-beauty-1', 1, 'belleza-estetica/peinado-estilismo', 2, true),
  ('cat-nails-13', 'Manicure y Pedicure', 'manicure-pedicure', 'Servicios de uñas y cuidado de manos y pies', 'cat-beauty-1', 1, 'belleza-estetica/manicure-pedicure', 3, true),
  ('cat-lashes-14', 'Pestañas y Cejas', 'pestanas-cejas', 'Extensiones de pestañas, microblading y diseño de cejas', 'cat-beauty-1', 1, 'belleza-estetica/pestanas-cejas', 4, true),
  ('cat-spa-15', 'Tratamientos Faciales y Spa', 'tratamientos-spa', 'Faciales, limpiezas y tratamientos de spa', 'cat-beauty-1', 1, 'belleza-estetica/tratamientos-spa', 5, true);

-- Subcategorías de Salud y Bienestar (level 1)
INSERT INTO service_categories (id, name, slug, description, parent_id, level, path, "order", is_active)
VALUES 
  ('cat-massage-21', 'Masajes', 'masajes', 'Masajes terapéuticos, relajantes y deportivos', 'cat-health-2', 1, 'salud-bienestar/masajes', 1, true),
  ('cat-physio-22', 'Fisioterapia', 'fisioterapia', 'Servicios de fisioterapia y rehabilitación', 'cat-health-2', 1, 'salud-bienestar/fisioterapia', 2, true),
  ('cat-yoga-23', 'Yoga y Meditación', 'yoga-meditacion', 'Clases de yoga, meditación y mindfulness', 'cat-health-2', 1, 'salud-bienestar/yoga-meditacion', 3, true),
  ('cat-nutrition-24', 'Nutrición y Dietética', 'nutricion-dietetica', 'Consultas nutricionales y planes alimenticios', 'cat-health-2', 1, 'salud-bienestar/nutricion-dietetica', 4, true);

-- Subcategorías de Eventos (level 1)
INSERT INTO service_categories (id, name, slug, description, parent_id, level, path, "order", is_active)
VALUES 
  ('cat-wedding-31', 'Bodas', 'bodas', 'Servicios especializados para bodas', 'cat-events-3', 1, 'eventos-celebraciones/bodas', 1, true),
  ('cat-birthday-32', 'Cumpleaños', 'cumpleanos', 'Organización y animación de fiestas de cumpleaños', 'cat-events-3', 1, 'eventos-celebraciones/cumpleanos', 2, true),
  ('cat-corporate-33', 'Eventos Corporativos', 'eventos-corporativos', 'Organización de eventos empresariales', 'cat-events-3', 1, 'eventos-celebraciones/eventos-corporativos', 3, true);

-- Subcategorías más específicas (level 2) - Ejemplos
INSERT INTO service_categories (id, name, slug, description, parent_id, level, path, "order", is_active)
VALUES 
  ('cat-bridal-111', 'Maquillaje de Novia', 'maquillaje-novia', 'Maquillaje especializado para novias', 'cat-makeup-11', 2, 'belleza-estetica/maquillaje/maquillaje-novia', 1, true),
  ('cat-social-112', 'Maquillaje Social', 'maquillaje-social', 'Maquillaje para eventos sociales y fiestas', 'cat-makeup-11', 2, 'belleza-estetica/maquillaje/maquillaje-social', 2, true),
  ('cat-editorial-113', 'Maquillaje Editorial', 'maquillaje-editorial', 'Maquillaje para fotosesiones y editoriales', 'cat-makeup-11', 2, 'belleza-estetica/maquillaje/maquillaje-editorial', 3, true);

-- ============================================================================
-- COUNTRIES, STATES & CITIES (México example)
-- ============================================================================

-- País: México
INSERT INTO countries (id, name, short_name, code, code3, continent, region, phone_code, currency, currency_symbol, languages, is_active, is_popular)
VALUES (
  'country-mx',
  'México',
  'México',
  'MX',
  'MEX',
  'América',
  'América del Norte',
  '+52',
  'MXN',
  '$',
  ARRAY['es'],
  true,
  true
);

-- Estados de México (principales)
INSERT INTO states (id, country_id, name, short_name, code, is_active)
VALUES 
  ('state-cdmx', 'country-mx', 'Ciudad de México', 'CDMX', 'CDMX', true),
  ('state-jal', 'country-mx', 'Jalisco', 'Jal.', 'JAL', true),
  ('state-nleon', 'country-mx', 'Nuevo León', 'N.L.', 'NL', true),
  ('state-pue', 'country-mx', 'Puebla', 'Pue.', 'PUE', true),
  ('state-qro', 'country-mx', 'Querétaro', 'Qro.', 'QRO', true),
  ('state-yuc', 'country-mx', 'Yucatán', 'Yuc.', 'YUC', true),
  ('state-qroo', 'country-mx', 'Quintana Roo', 'Q. Roo', 'QROO', true);

-- Ciudades principales
INSERT INTO cities (id, state_id, name, slug, latitude, longitude, timezone, population, is_capital, is_metro, is_popular, aliases)
VALUES 
  -- CDMX
  ('city-cdmx', 'state-cdmx', 'Ciudad de México', 'ciudad-de-mexico', 19.4326, -99.1332, 'America/Mexico_City', 9200000, true, true, true, ARRAY['CDMX', 'DF', 'México DF']),
  
  -- Jalisco
  ('city-gdl', 'state-jal', 'Guadalajara', 'guadalajara', 20.6597, -103.3496, 'America/Mexico_City', 1500000, true, true, true, ARRAY['GDL']),
  ('city-puerto-vallarta', 'state-jal', 'Puerto Vallarta', 'puerto-vallarta', 20.6534, -105.2253, 'America/Mexico_City', 300000, false, false, true, ARRAY['Vallarta', 'PV']),
  
  -- Nuevo León
  ('city-mty', 'state-nleon', 'Monterrey', 'monterrey', 25.6866, -100.3161, 'America/Mexico_City', 1200000, true, true, true, ARRAY['MTY']),
  
  -- Puebla
  ('city-puebla', 'state-pue', 'Puebla', 'puebla', 19.0414, -98.2063, 'America/Mexico_City', 1600000, true, true, true, ARRAY['Puebla de Zaragoza']),
  
  -- Querétaro
  ('city-qro', 'state-qro', 'Santiago de Querétaro', 'queretaro', 20.5888, -100.3899, 'America/Mexico_City', 960000, true, true, true, ARRAY['Querétaro', 'QRO']),
  
  -- Yucatán
  ('city-merida', 'state-yuc', 'Mérida', 'merida', 20.9674, -89.5926, 'America/Mexico_City', 900000, true, true, true, ARRAY['La Blanca Mérida']),
  
  -- Quintana Roo
  ('city-cancun', 'state-qroo', 'Cancún', 'cancun', 21.1619, -86.8515, 'America/Cancun', 900000, false, true, true, ARRAY['Cancun']),
  ('city-playa', 'state-qroo', 'Playa del Carmen', 'playa-del-carmen', 20.6296, -87.0739, 'America/Cancun', 300000, false, false, true, ARRAY['Playa']),
  ('city-tulum', 'state-qroo', 'Tulum', 'tulum', 20.2114, -87.4654, 'America/Cancun', 50000, false, false, true, ARRAY[]);

-- Más países (ejemplos básicos)
INSERT INTO countries (id, name, short_name, code, code3, continent, region, phone_code, currency, currency_symbol, languages, is_active, is_popular)
VALUES 
  ('country-us', 'Estados Unidos', 'USA', 'US', 'USA', 'América', 'América del Norte', '+1', 'USD', '$', ARRAY['en'], true, true),
  ('country-es', 'España', 'España', 'ES', 'ESP', 'Europa', 'Europa Occidental', '+34', 'EUR', '€', ARRAY['es'], true, false),
  ('country-co', 'Colombia', 'Colombia', 'CO', 'COL', 'América', 'América del Sur', '+57', 'COP', '$', ARRAY['es'], true, true),
  ('country-ar', 'Argentina', 'Argentina', 'AR', 'ARG', 'América', 'América del Sur', '+54', 'ARS', '$', ARRAY['es'], true, true);

COMMIT;
