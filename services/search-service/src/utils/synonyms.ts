/**
 * Diccionario de sinónimos para búsqueda inteligente.
 * Clave: término normalizado (lowercased)
 * Valor: lista de equivalentes (incluyendo la clave misma para FTS)
 *
 * Incluye vocabulario de Guatemala (GT slang) y variaciones regionales.
 */
export const SYNONYM_MAP: Record<string, string[]> = {
  // ── Fotografía ──────────────────────────────────────────────────────────
  foto:         ['fotografía', 'foto', 'fotos', 'fotografo', 'sesión fotográfica'],
  fotos:        ['fotografía', 'foto', 'fotos', 'fotografo', 'sesión fotográfica'],
  fotografía:   ['fotografía', 'foto', 'fotos', 'fotografo', 'fotógrafo'],
  fotógrafo:    ['fotógrafo', 'fotografo', 'fotografía'],
  'foto boda':  ['fotografía de boda', 'foto boda', 'fotógrafo boda'],
  'foto exterior': ['fotografía al aire libre', 'foto exterior', 'sesión outdoor', 'fotografía exterior', 'outdoor', 'exteriores'],
  exterior:     ['exterior', 'aire libre', 'outdoor', 'exteriores', 'al aire libre'],
  outdoor:      ['outdoor', 'exterior', 'aire libre', 'exteriores'],
  retrato:      ['retrato', 'fotografía de retrato', 'portrait', 'foto retrato'],
  'sesión lifestyle': ['lifestyle', 'sesión lifestyle', 'fotografía lifestyle'],
  lifestyle:    ['lifestyle', 'sesión lifestyle', 'fotografía lifestyle', 'foto exterior'],

  // ── Música ─────────────────────────────────────────────────────────────
  música:       ['música', 'musica', 'musical', 'banda', 'cantante', 'artista musical'],
  musica:       ['música', 'musica', 'musical', 'banda', 'cantante'],
  banda:        ['banda', 'grupo musical', 'conjunto musical', 'orquesta'],
  cantante:     ['cantante', 'vocalista', 'solista', 'intérprete'],
  mariachi:     ['mariachi', 'trío', 'trio', 'música mexicana', 'música ranchera'],
  marimba:      ['marimba', 'marimba guatemalteca', 'música guatemalteca', 'marimba orquesta'],
  sonido:       ['sonido', 'audio', 'sistema de sonido', 'equipo de sonido', 'DJ', 'dj'],
  audio:        ['audio', 'sonido', 'sistema de sonido', 'equipo de sonido'],
  bolo:         ['bolo', 'mariachi', 'música en vivo', 'serenata', 'combo musical'],  // GT slang
  serenata:     ['serenata', 'bolo', 'mariachi', 'serenar'],
  'música en vivo': ['música en vivo', 'banda en vivo', 'show musical', 'concierto'],
  concierto:    ['concierto', 'show musical', 'música en vivo', 'presentación musical'],
  violín:       ['violín', 'violin', 'cuerdas', 'cuarteto de cuerdas'],
  violin:       ['violín', 'violin', 'cuerdas'],
  guitarra:     ['guitarra', 'guitarrista', 'música acústica'],
  piano:        ['piano', 'pianista', 'teclado', 'teclista'],

  // ── DJ ──────────────────────────────────────────────────────────────────
  dj:           ['DJ', 'dj', 'djing', 'disc jockey', 'animador', 'animación musical'],
  'disc jockey': ['disc jockey', 'DJ', 'dj'],
  pica:         ['pica', 'DJ', 'dj', 'fiesta', 'animación'],  // GT slang para DJ de pueblo
  discoteca:    ['discoteca', 'DJ', 'baile', 'fiesta'],

  // ── Iluminación y Producción ─────────────────────────────────────────────
  iluminación:  ['iluminación', 'luces', 'luz', 'lighting', 'efectos de luz'],
  luces:        ['luces', 'iluminación', 'lighting', 'efectos de luz'],
  lighting:     ['lighting', 'iluminación', 'luces'],
  producción:   ['producción', 'producción de eventos', 'producción audiovisual'],
  'sonido e iluminación': ['sonido e iluminación', 'audio y luces', 'equipo completo'],

  // ── Danza y Entretenimiento ─────────────────────────────────────────────
  baile:        ['baile', 'danza', 'show de baile', 'coreografía'],
  danza:        ['danza', 'baile', 'show de danza', 'coreografía', 'danza contemporánea'],
  coreografía:  ['coreografía', 'coreógrafo', 'show de baile', 'danza'],
  folclore:     ['folclore', 'danza folclórica', 'baile tipico', 'folklor'],
  'baile tipico': ['baile tipico', 'folclore', 'danza folclórica'],
  'show de baile': ['show de baile', 'show de danza', 'presentación de baile'],
  entretenimiento: ['entretenimiento', 'show', 'animación', 'espectáculo'],
  show:         ['show', 'espectáculo', 'presentación', 'actuación', 'entretenimiento'],

  // ── Bodas ───────────────────────────────────────────────────────────────
  boda:         ['boda', 'matrimonio', 'casamiento', 'nupcial', 'wedding'],
  wedding:      ['wedding', 'boda', 'matrimonio', 'casamiento'],
  matrimonio:   ['matrimonio', 'boda', 'casamiento', 'nupcial'],
  'foto de boda': ['fotografía de boda', 'photos boda', 'fotógrafo boda'],
  'coordinación de boda': ['coordinación de boda', 'wedding planner', 'organizador de boda'],
  'wedding planner': ['wedding planner', 'coordinación de boda', 'organizador de boda', 'planificador'],
  nupcial:      ['nupcial', 'boda', 'matrimonio', 'wedding'],
  'maquillaje nupcial': ['maquillaje nupcial', 'maquillaje de novia', 'makeup boda'],
  'peinado novia': ['peinado novia', 'peinado nupcial', 'hair boda'],

  // ── Quinceañeras ────────────────────────────────────────────────────────
  quinceañera:  ['quinceañera', 'quince años', 'xv años', 'fiesta de quince'],
  quince:       ['quinceañera', 'quince años', 'xv años', 'quince'],
  'xv años':    ['xv años', 'quince años', 'quinceañera'],
  'quince años': ['quince años', 'quinceañera', 'xv años'],

  // ── Eventos ─────────────────────────────────────────────────────────────
  evento:       ['evento', 'fiesta', 'celebración', 'reunión', 'acto'],
  fiesta:       ['fiesta', 'evento', 'celebración', 'party', 'pica'],
  party:        ['party', 'fiesta', 'evento', 'celebración'],
  celebración:  ['celebración', 'evento', 'fiesta'],
  corporativo:  ['corporativo', 'empresarial', 'evento corporativo', 'evento empresarial'],
  'evento social': ['evento social', 'fiesta social', 'reunión social'],
  graduación:   ['graduación', 'graduacion', 'titulación', 'ceremonia de graduación'],
  bautizo:      ['bautizo', 'bautismo', 'ceremonia religiosa'],
  posada:       ['posada', 'navidad', 'evento navideño', 'fiesta navideña'],

  // ── Maquillaje y Belleza ─────────────────────────────────────────────────
  maquillaje:   ['maquillaje', 'makeup', 'make up', 'artista de maquillaje', 'maquillista'],
  makeup:       ['makeup', 'maquillaje', 'make up', 'maquillista'],
  'make up':    ['make up', 'maquillaje', 'makeup'],
  peinado:      ['peinado', 'estilismo', 'hair', 'peluquería'],
  estilismo:    ['estilismo', 'peinado', 'styling', 'look'],
  '\'manicure\'': ['manicure', 'uñas', 'nail art', 'belleza'],
  belleza:      ['belleza', 'estética', 'salón de belleza', 'beauty'],
  spa:          ['spa', 'relajación', 'masajes', 'bienestar'],
  masaje:       ['masaje', 'masajes', 'spa', 'relajación', 'terapia'],

  // ── Barbería ────────────────────────────────────────────────────────────
  barbería:     ['barbería', 'barbero', 'corte de cabello', 'barber'],
  barbero:      ['barbero', 'barbería', 'corte', 'barber'],
  corte:        ['corte', 'corte de cabello', 'corte de pelo', 'haircut'],
  'corte de cabello': ['corte de cabello', 'corte', 'peluquería', 'haircut'],
  peluquería:   ['peluquería', 'peluquero', 'corte', 'estilismo'],

  // ── Tatuajes ─────────────────────────────────────────────────────────────
  tatuaje:      ['tatuaje', 'tattoo', 'tatuador', 'tatuaje personalizado'],
  tattoo:       ['tattoo', 'tatuaje', 'tatuador'],
  tatuador:     ['tatuador', 'tattoo artist', 'tatuaje'],

  // ── Planificación de eventos ─────────────────────────────────────────────
  planificador: ['planificador', 'organizador', 'coordinador', 'wedding planner', 'event planner'],
  organizador:  ['organizador', 'planificador', 'coordinador de eventos'],
  coordinador:  ['coordinador', 'planificador', 'organizador de bodas'],
  'event planner': ['event planner', 'planificador de eventos', 'organizador de eventos'],

  // ── Guatemala específico ─────────────────────────────────────────────────
  chamba:       ['chamba', 'trabajo', 'servicio', 'sesión'],   // GT: trabajo/sesión
  jale:         ['jale', 'evento', 'trabajo', 'gig'],           // GT: trabajo/evento
  güiro:        ['güiro', 'fiesta', 'evento', 'party'],         // GT: fiesta
  convivio:     ['convivio', 'fiesta', 'reunión', 'evento social'],  // GT: reunión de trabajo/amigos
  'cumple':     ['cumpleaños', 'cumple', 'birthday', 'fiesta de cumpleaños'],
  cumpleaños:   ['cumpleaños', 'cumple', 'birthday', 'fiesta de cumpleaños'],
  birthday:     ['birthday', 'cumpleaños', 'cumple'],

  // ── Números / personas ───────────────────────────────────────────────────
  personas:     ['personas', 'invitados', 'asistentes', 'capacidad'],
  invitados:    ['invitados', 'personas', 'asistentes'],
  asistentes:   ['asistentes', 'invitados', 'personas'],
};

/**
 * Expande una query con sus sinónimos.
 * Retorna un array de términos únicos (incluyendo los originales).
 *
 * Ejemplo: "fotos exterior" → ["fotografía", "foto", "fotos", "exterior", "aire libre", "outdoor", ...]
 */
export function expandQuery(query: string): string[] {
  const terms = new Set<string>();
  const normalized = query.toLowerCase().trim();

  // 1. Agregar la query original y sus palabras
  terms.add(normalized);
  normalized.split(/\s+/).forEach(t => terms.add(t));

  // 2. Buscar frases compuestas (bigramas) en el mapa
  const words = normalized.split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = `${words[i]} ${words[i + 1]}`;
    if (SYNONYM_MAP[bigram]) {
      SYNONYM_MAP[bigram].forEach(s => terms.add(s));
    }
  }

  // 3. Expandir cada palabra individual
  for (const word of words) {
    if (SYNONYM_MAP[word]) {
      SYNONYM_MAP[word].forEach(s => terms.add(s));
    }
    // También buscar sub-términos dentro de frases del mapa
    for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (key.includes(' ') && normalized.includes(key)) {
        synonyms.forEach(s => terms.add(s));
      }
    }
  }

  return Array.from(terms).filter(t => t.length > 1);
}

/**
 * Construye un patrón de búsqueda PostgreSQL ILIKE para los términos expandidos.
 * Retorna condicionales para usar con Prisma $queryRaw.
 */
export function buildSearchTerms(query: string): string[] {
  return expandQuery(query);
}
