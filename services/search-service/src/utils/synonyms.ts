/**
 * Diccionario de sinónimos para búsqueda inteligente.
 * Clave: término normalizado (lowercased)
 * Valor: lista de equivalentes (incluyendo la clave misma para FTS)
 *
 * Incluye vocabulario de Guatemala (GT slang) y variaciones regionales.
 */
export const SYNONYM_MAP: Record<string, string[]> = {
  // ── Fotografía ──────────────────────────────────────────────────────────
  // NOTE: Category in ServiceIndex = "Fotografia" (no accent). 'foto' matches it via ILIKE.
  foto:         ['fotografía', 'foto', 'fotos', 'fotografo', 'fotografi', 'sesión fotográfica'],
  fotos:        ['fotografía', 'foto', 'fotos', 'fotografo', 'fotografi', 'sesión fotográfica'],
  fotografía:   ['fotografía', 'foto', 'fotos', 'fotografo', 'fotografi', 'fotógrafo'],
  fotógrafo:    ['fotógrafo', 'fotografo', 'fotografía', 'foto', 'fotografi'],
  fotografo:    ['fotografo', 'fotógrafo', 'fotografía', 'foto', 'fotografi'],
  fotografia:   ['fotografia', 'fotografía', 'foto', 'fotografi'],
  'foto boda':  ['fotografía de boda', 'foto boda', 'fotógrafo boda'],
  'foto exterior': ['fotografía al aire libre', 'foto exterior', 'sesión outdoor', 'fotografía exterior', 'outdoor', 'exteriores'],
  exterior:     ['exterior', 'aire libre', 'outdoor', 'exteriores', 'al aire libre'],
  outdoor:      ['outdoor', 'exterior', 'aire libre', 'exteriores'],
  retrato:      ['retrato', 'fotografía de retrato', 'portrait', 'foto retrato'],
  'sesión lifestyle': ['lifestyle', 'sesión lifestyle', 'fotografía lifestyle'],
  lifestyle:    ['lifestyle', 'sesión lifestyle', 'fotografía lifestyle', 'foto exterior'],

  // ── Música ─────────────────────────────────────────────────────────────
  // NOTE: Category in ServiceIndex = "Musica". Including 'musica' in all music-related
  // expansions ensures they match the category via ILIKE '%musica%'.
  música:       ['música', 'musica', 'musical', 'banda', 'cantante', 'artista musical', 'concierto', 'en vivo'],
  musica:       ['música', 'musica', 'musical', 'banda', 'cantante', 'concierto', 'en vivo'],
  musico:       ['musico', 'músico', 'musica', 'música', 'musical', 'artista musical'],
  músico:       ['músico', 'musico', 'musica', 'música', 'musical'],
  banda:        ['banda', 'grupo musical', 'conjunto musical', 'orquesta', 'musica', 'música', 'concierto', 'en vivo'],
  sonido:       ['sonido', 'audio', 'sistema de sonido', 'equipo de sonido', 'DJ', 'dj'],
  audio:        ['audio', 'sonido', 'sistema de sonido', 'equipo de sonido'],
  'musica en vivo': ['música en vivo', 'banda en vivo', 'show musical', 'concierto', 'musica'],
  concierto:    ['concierto', 'show musical', 'música en vivo', 'presentación musical', 'musica'],
  violín:       ['violín', 'violin', 'violinista', 'cuerdas', 'cuarteto de cuerdas', 'musica', 'música'],
  violin:       ['violín', 'violin', 'violinista', 'cuerdas', 'musica', 'música'],
  violinista:   ['violinista', 'violín', 'violin', 'cuerdas', 'musica', 'música'],
  guitarra:     ['guitarra', 'guitarrista', 'música acústica', 'musica', 'música'],
  piano:        ['piano', 'pianista', 'teclado', 'teclista', 'musica', 'música'],

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

  // ── Música expandida ────────────────────────────────────────────────────
  cantante:     ['cantante', 'vocalista', 'solista', 'intérprete vocal', 'cantante solista', 'musica', 'música'],
  solista:      ['solista', 'cantante', 'artista solista', 'solista musical', 'musica'],
  saxofon:      ['saxón', 'saxo', 'saxofonista', 'saxón alto', 'saxón tenor', 'musica'],
  saxofonista:  ['saxofonista', 'saxón', 'saxo', 'jazz', 'musica'],
  baterista:    ['baterista', 'batería', 'drummer', 'percusionista', 'musica'],
  bateria:      ['batería', 'baterista', 'drummer', 'percusión', 'ritmo', 'musica'],
  marimba:      ['marimba', 'marimba guatemalteca', 'música guatemalteca', 'marimba orquesta', 'marimba típica', 'musica'],
  mariachi:     ['mariachi', 'trío', 'trio', 'música mexicana', 'música ranchera', 'musica', 'serenata'],
  bolo:         ['bolo', 'mariachi', 'música en vivo', 'serenata', 'combo musical', 'musica'],  // GT slang
  serenata:     ['serenata', 'bolo', 'mariachi', 'serenar', 'musica', 'música'],
  'marimba orquesta': ['marimba orquesta', 'marimba', 'orquesta marimba', 'conjunto de marimba'],
  beatmaker:    ['beatmaker', 'beat', 'productor de beats', 'trap', 'hip hop beat', 'producer'],
  productor:    ['productor musical', 'producción musical', 'beatmaker', 'estudio', 'grabación'],
  rapero:       ['rapero', 'rap', 'rapper', 'freestyle', 'hip hop', 'urbano'],
  freestyle:    ['freestyle', 'rap', 'rapero', 'improvisación rap'],
  locutor:      ['locutor', 'locución', 'presentador', 'voice over', 'narrador', 'comunicador'],
  'voice over': ['voice over', 'locutor', 'narrador', 'doblaje', 'voz en off'],
  doblaje:      ['doblaje', 'voice over', 'locutor', 'voz'],
  'grupo acustico': ['grupo acústico', 'acústico', 'unplugged', 'música acústica'],
  trio:         ['trío', 'trio', 'mariachi', 'cuarteto', 'conjunto pequeño'],
  cuarteto:     ['cuarteto', 'trío', 'ensemble de cuerdas'],
  'ingeniero de sonido': ['ingeniero de sonido', 'técnico de sonido', 'audiovisual', 'audio live'],

  // ── Instrumentistas ─────────────────────────────────────────────────────────
  bajista:      ['bajista', 'bajo eléctrico', 'bajo', 'musica', 'música'],
  bajo:         ['bajo', 'bajista', 'bajo eléctrico', 'bajo acústico', 'musica'],
  trompetista:  ['trompetista', 'trompeta', 'viento', 'jazz', 'musica', 'música'],
  trompeta:     ['trompeta', 'trompetista', 'viento metal', 'musica'],
  flautista:    ['flautista', 'flauta', 'flauta traversa', 'viento madera', 'musica'],
  flauta:       ['flauta', 'flautista', 'flauta traversa', 'musica'],
  chelista:     ['chelista', 'cellista', 'cello', 'chelo', 'violonchelo', 'cuerdas', 'musica'],
  cello:        ['cello', 'chelo', 'chelista', 'violonchelo', 'cuerdas', 'musica'],
  chelo:        ['chelo', 'cello', 'chelista', 'violonchelo', 'cuerdas', 'musica'],
  arpista:      ['arpista', 'arpa', 'cuerdas', 'musica', 'música'],
  arpa:         ['arpa', 'arpista', 'cuerdas', 'musica'],
  acordeonista: ['acordeonista', 'acordeón', 'accordion', 'musica', 'música'],
  acordeon:     ['acordeón', 'acordeonista', 'vallenato', 'musica'],
  trombonista:  ['trombonista', 'trombón', 'viento metal', 'jazz', 'musica'],
  trombon:      ['trombón', 'trombonista', 'viento', 'musica'],
  percusionista: ['percusionista', 'percusión', 'baterista', 'congas', 'timbales', 'musica'],
  conguero:     ['conguero', 'conga', 'percusión', 'percusionista', 'musica'],
  timbalero:    ['timbalero', 'timbales', 'percusión', 'percusionista', 'musica'],
  tecladista:   ['tecladista', 'teclista', 'teclado', 'piano', 'sintetizador', 'musica'],
  teclista:     ['teclista', 'tecladista', 'teclado', 'piano', 'musica'],
  organista:    ['organista', 'órgano', 'teclado', 'musica', 'música'],
  clarinetista: ['clarinetista', 'clarinete', 'viento madera', 'musica'],
  clarinete:    ['clarinete', 'clarinetista', 'musica'],

  // ── Formatos de agrupación ───────────────────────────────────────────────────
  duo:          ['dúo', 'duo', 'pareja musical', 'dúo musical', 'musica'],
  dueto:        ['dueto', 'dúo', 'pareja musical', 'musica'],
  quinteto:     ['quinteto', 'cinco músicos', 'conjunto', 'musica'],
  sexteto:      ['sexteto', 'seis músicos', 'conjunto', 'musica'],
  orquesta:     ['orquesta', 'banda', 'conjunto musical', 'big band', 'musica', 'música'],
  'big band':   ['big band', 'orquesta jazz', 'big band jazz', 'orquesta', 'musica'],
  combo:        ['combo', 'combo musical', 'banda pequeña', 'conjunto musical', 'musica'],
  ensemble:     ['ensemble', 'conjunto de cámara', 'cuarteto', 'trío', 'musica'],
  'cover band': ['cover band', 'banda de covers', 'tributo', 'banda tributo', 'musica'],
  tributo:      ['tributo', 'banda tributo', 'cover band', 'homenaje musical', 'musica'],
  'banda tributo': ['banda tributo', 'tributo', 'cover band', 'homenaje musical'],

  // ── Géneros musicales ────────────────────────────────────────────────────────
  reggaeton:    ['reggaeton', 'reguetón', 'urbano', 'musica urbana', 'musica'],
  regueton:     ['reguetón', 'reggaeton', 'urbano', 'musica urbana', 'musica'],
  salsa:        ['salsa', 'salsero', 'música tropical', 'tropical', 'musica', 'música'],
  salsero:      ['salsero', 'salsa', 'música tropical', 'musica'],
  cumbia:       ['cumbia', 'cumbiambero', 'música tropical', 'tropical', 'musica'],
  merengue:     ['merengue', 'merenguero', 'música tropical', 'tropical', 'musica'],
  bolero:       ['bolero', 'bolerista', 'música romántica', 'romantico', 'musica'],
  romantico:    ['romántico', 'bolero', 'balada', 'música romántica', 'musica'],
  jazz:         ['jazz', 'jazzista', 'swing', 'blues', 'big band', 'musica', 'música'],
  blues:        ['blues', 'blues band', 'jazz', 'rock blues', 'musica'],
  rock:         ['rock', 'banda de rock', 'rockero', 'musica rock', 'musica'],
  rockero:      ['rockero', 'rock', 'banda de rock', 'musica'],
  pop:          ['pop', 'música pop', 'cantante pop', 'musica'],
  balada:       ['balada', 'baladas', 'romántico', 'baladista', 'musica'],
  trova:        ['trova', 'trovador', 'canción de autor', 'folk', 'musica'],
  trovador:     ['trovador', 'trova', 'canción de autor', 'musica'],
  flamenco:     ['flamenco', 'flamenco guitar', 'guitarrista flamenco', 'musica'],
  gospel:       ['gospel', 'coro gospel', 'música cristiana', 'alabanza', 'musica'],
  vallenato:    ['vallenato', 'acordeón', 'cumbia', 'música colombiana', 'musica'],
  tropical:     ['tropical', 'salsa', 'cumbia', 'merengue', 'música tropical', 'musica'],
  'musica tropical': ['música tropical', 'tropical', 'salsa', 'cumbia', 'merengue'],
  norteño:      ['norteño', 'música norteña', 'conjunto norteño', 'banda norteña', 'musica'],
  ranchero:     ['ranchero', 'música ranchera', 'mariachi', 'corrido', 'musica'],
  corrido:      ['corrido', 'música ranchera', 'corrido tumbado', 'banda', 'musica'],
  trap:         ['trap', 'trap music', 'urbano', 'rapero', 'beatmaker', 'musica'],
  'hip hop':    ['hip hop', 'rap', 'rapero', 'freestyle', 'urbano', 'musica'],
  electronica:  ['electrónica', 'electronic music', 'house', 'techno', 'DJ', 'musica'],
  house:        ['house', 'deep house', 'DJ', 'música electrónica', 'musica'],
  techno:       ['techno', 'DJ', 'electrónica', 'musica'],
  regional:     ['regional', 'música regional', 'folklor', 'músico regional', 'musica'],

  // ── DJ expandido ────────────────────────────────────────────────────────
  'dj bodas':   ['dj bodas', 'dj para bodas', 'animación musical boda', 'música bodas'],
  'dj corporativo': ['dj corporativo', 'dj empresarial', 'dj eventos corporativos'],
  'dj electronica': ['dj electrónica', 'dj club', 'house', 'techno', 'electronic music'],

  // ── Fotografía expandida ────────────────────────────────────────────────
  'fotografo eventos':  ['fotógrafo de eventos', 'fotografía de eventos', 'foto eventos', 'event photographer'],
  'fotografo boda':     ['fotógrafo de bodas', 'fotografía nupcial', 'wedding photographer', 'foto boda'],
  'fotografo producto': ['fotografía de producto', 'foto producto', 'ecommerce foto', 'product photography'],
  drone:        ['drone', 'dron', 'drone operator', 'fotografía aérea', 'video aéreo', 'aerial'],
  'drone operator': ['drone operator', 'piloto dron', 'aerofotografía', 'video aéreo'],

  // ── Video expandido ─────────────────────────────────────────────────────
  videografo:   ['videógrafo', 'videomaker', 'filmación', 'video de eventos'],
  editor:       ['editor de video', 'edición', 'post producción', 'montaje'],
  'editor de video': ['editor de video', 'edición de video', 'post producción', 'colorista'],
  colorista:    ['colorista', 'color grading', 'corrección de color', 'etalonaje'],
  streaming:    ['streaming', 'live stream', 'transmisión en vivo', 'eventos en vivo', 'stream'],
  'live stream': ['live stream', 'streaming', 'transmisión en vivo', 'broadcast'],

  // ── Diseño expandido ────────────────────────────────────────────────────
  branding:     ['branding', 'identidad visual', 'brand design', 'diseño de marca', 'logo'],
  logo:         ['logo', 'logotipo', 'branding', 'diseño de logo', 'identidad visual'],
  'diseno uxui':['diseño ux/ui', 'ux design', 'ui design', 'diseño de app', 'diseño web', 'prototipo'],
  ilustracion:  ['ilustración', 'ilustrador', 'dibujo digital', 'arte digital', 'illustration'],
  'motion graphics': ['motion graphics', 'animación gráfica', 'motion design', 'after effects'],
  animacion:    ['animación', 'animador', 'animación 2d', 'animación 3d', 'motion graphics'],
  'arte ia':    ['arte con ia', 'midjourney', 'stable diffusion', 'ai art', 'generative art'],
  lettering:    ['lettering', 'caligrafía', 'tipografía creativa', 'hand lettering'],
  caligrafo:    ['calígrafo', 'caligrafía', 'lettering', 'escritura artística'],
  ceramista:    ['ceramista', 'cerámica', 'alfarería', 'torno', 'arcilla'],
  artesano:     ['artesano', 'artesanía', 'manualidades', 'handcraft', 'craft'],

  // ── Artes escénicas expandidas ──────────────────────────────────────────
  coreografo:   ['coreógrafo', 'coreografía', 'director de baile', 'show de baile'],
  'baile urbano': ['baile urbano', 'hip hop dance', 'breakdance', 'street dance', 'urban dance'],
  'baile clasico': ['ballet', 'danza clásica', 'danza contemporánea', 'classical dance'],
  actor:        ['actor', 'actriz', 'actuación', 'teatro', 'dramatización'],
  teatro:       ['teatro', 'obra teatral', 'actuación', 'improvisación teatral'],
  mimo:         ['mimo', 'performance artístico', 'arte callejero', 'artista de calle'],
  'danza indigena': ['danza indígena', 'danza maya', 'baile ceremonial', 'danza guatemalteca'],
  'danza folklorica': ['danza folklórica', 'folclore', 'baile típico', 'danza guatemalteca', 'danza regional'],

  // ── Entretenimiento expandido ────────────────────────────────────────────
  'stand up':   ['stand up', 'stand-up comedy', 'comediante', 'comedia', 'humor en vivo'],
  comediante:   ['comediante', 'stand up', 'humorista', 'humor', 'monólogo cómico'],
  'show infantil': ['show infantil', 'animación niños', 'payaso', 'mago infantil', 'fiesta niños'],
  payaso:       ['payaso', 'show infantil', 'animación infantil', 'circo'],
  personajes:   ['personajes temáticos', 'cosplay', 'disfraz', 'show temático', 'mascota'],
  'show fuego': ['show de fuego', 'malabares de fuego', 'fuego', 'fire performer'],
  malabarismo:  ['malabarismo', 'malabares', 'circo', 'acróbata', 'juggling'],
  acrobata:     ['acróbata', 'circo', 'aéreo', 'telas aéreas', 'acrobacia'],

  // ── Belleza & Estilo ─────────────────────────────────────────────────────
  'maquillaje novia':  ['maquillaje nupcial', 'maquillaje de novia', 'makeup boda', 'bridal makeup'],
  'body paint':  ['body paint', 'body art', 'pintura corporal', 'cuerpo pintado'],
  estilista:    ['estilista', 'peinado', 'hair stylist', 'salón de belleza', 'peluquero'],
  manicura:     ['manicure', 'nail art', 'uñas acrílicas', 'nail artist', 'manicura'],
  'barbero pro': ['barbero profesional', 'barbería', 'barber shop', 'fade', 'corte caballero'],
  'tattoo realista': ['tattoo realista', 'realismo tatuaje', 'realistic tattoo', 'retrato en piel'],
  'tattoo minimalista': ['tattoo minimalista', 'fine line tattoo', 'tatuaje pequeño', 'delicado'],
  piercing:     ['piercing', 'perforación corporal', 'pircing', 'joyería corporal'],

  // ── Educación Creativa ───────────────────────────────────────────────────
  'clases de musica': ['clases de música', 'lecciones musicales', 'escuela de música', 'aprende a tocar'],
  'clases de canto':  ['clases de canto', 'vocal coach', 'técnica vocal', 'lecciones de canto'],
  'coaching vocal':   ['coaching vocal', 'vocal coach', 'clases de canto', 'formación vocal'],
  taller:       ['taller', 'workshop', 'curso', 'capacitación creativa', 'actividad grupal'],
  mentor:       ['mentor', 'mentoring', 'asesoría', 'coaching artístico'],

  // ── Contenido Digital ────────────────────────────────────────────────────
  'creador de contenido': ['content creator', 'creador de contenido', 'ugc', 'influencer creativo'],
  tiktok:       ['tiktok', 'tiktoker', 'reels', 'video corto', 'short video'],
  tiktoker:     ['tiktoker', 'tiktok', 'reels creator', 'influencer'],
  youtuber:     ['youtuber', 'youtube', 'vlog', 'canal de youtube'],
  guionista:    ['guionista', 'guión', 'scriptwriter', 'screen writer', 'screenplay'],
  copywriting:  ['copywriting', 'redacción', 'copy creativo', 'content writing'],
  storytelling: ['storytelling', 'narrativa', 'storyteller', 'historia de marca'],

  // ── Experiencias Creativas ───────────────────────────────────────────────
  chef:         ['chef', 'cocinero', 'gastronomía', 'catering', 'cocina creativa'],
  catering:     ['catering', 'servicio de catering', 'banquetes', 'comida para eventos'],
  bartender:    ['bartender', 'mixología', 'coctelería', 'mixólogo', 'bartending show'],
  mixologia:    ['mixología', 'bartender', 'cocteles', 'bebidas artesanales'],
  decorador:    ['decorador de eventos', 'decoración', 'ambientación', 'floral design'],
  'banda boda': ['banda para bodas', 'música en vivo para bodas', 'orquesta bodas'],
  'experiencia tematica': ['experiencia temática', 'evento inmersivo', 'actividad temática'],
};

// Dynamic synonyms added at runtime (e.g. from artist onboarding custom roles)
const dynamicSynonyms: Map<string, string[]> = new Map();

/**
 * Adds a term + its synonyms to the in-memory map at runtime.
 * Called when an artist registers a role not present in SYNONYM_MAP.
 */
export function addDynamicSynonym(term: string, synonyms: string[]): void {
  const key = term.toLowerCase().trim();
  if (!key) return;
  const existing = dynamicSynonyms.get(key) ?? SYNONYM_MAP[key] ?? [];
  const merged = Array.from(new Set([...existing, ...synonyms, key]));
  dynamicSynonyms.set(key, merged);
}

/** Returns true if the term already exists in either map */
export function hasSynonym(term: string): boolean {
  const key = term.toLowerCase().trim();
  return key in SYNONYM_MAP || dynamicSynonyms.has(key);
}

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

  // 3. Expandir cada palabra individual (mapa estático + dinámico)
  for (const word of words) {
    if (SYNONYM_MAP[word]) {
      SYNONYM_MAP[word].forEach(s => terms.add(s));
    }
    if (dynamicSynonyms.has(word)) {
      dynamicSynonyms.get(word)!.forEach(s => terms.add(s));
    }
    // También buscar sub-términos dentro de frases del mapa
    for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
      if (key.includes(' ') && normalized.includes(key)) {
        synonyms.forEach(s => terms.add(s));
      }
    }
    for (const [key, synonyms] of dynamicSynonyms.entries()) {
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
