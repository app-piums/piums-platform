// ============================================================================
// @piums/shared-config — Talent Taxonomy
// Maps creative disciplines → sub-categories → individual talents
// Talents are stored as specialties[] strings on the artist profile (no DB enum change needed)
// ============================================================================

export type ArtistCategory =
  | 'MUSICO'
  | 'DJ'
  | 'FOTOGRAFO'
  | 'VIDEOGRAFO'
  | 'DISENADOR'
  | 'BAILARIN'
  | 'ANIMADOR'
  | 'ESCRITOR'
  | 'TATUADOR'
  | 'MAQUILLADOR'
  | 'PINTOR'
  | 'ESCULTOR'
  | 'MAGO'
  | 'ACROBATA'
  | 'OTRO';

export interface Talent {
  id: string;
  label: string;
  /** Maps this talent to its closest ArtistCategory enum */
  category: ArtistCategory;
  /** Search keywords used for synonym expansion */
  keywords?: string[];
}

export interface TalentSubCategory {
  id: string;
  label: string;
  talents: Talent[];
}

export interface TalentGroup {
  id: string;
  label: string;
  /** Lucide icon name for the group */
  icon: string;
  subCategories: TalentSubCategory[];
}

// ─── 1. MÚSICA & AUDIO ───────────────────────────────────────────────────────
const MUSICA_AUDIO: TalentGroup = {
  id: 'musica_audio',
  label: 'Música & Audio',
  icon: 'Music',
  subCategories: [
    {
      id: 'musico',
      label: 'Músico',
      talents: [
        { id: 'cantante_solista',   label: 'Cantante Solista',    category: 'MUSICO', keywords: ['cantante', 'solista', 'vocalista'] },
        { id: 'banda_musical',      label: 'Banda Musical',       category: 'MUSICO', keywords: ['banda', 'grupo musical', 'conjunto'] },
        { id: 'mariachi',           label: 'Mariachi',            category: 'MUSICO', keywords: ['mariachi', 'trío', 'música ranchera'] },
        { id: 'grupo_acustico',     label: 'Grupo Acústico',      category: 'MUSICO', keywords: ['grupo acústico', 'acústico', 'unplugged'] },
        { id: 'trio_cuarteto',      label: 'Trío / Cuarteto',     category: 'MUSICO', keywords: ['trío', 'cuarteto', 'ensemble'] },
        { id: 'pianista',           label: 'Pianista',            category: 'MUSICO', keywords: ['piano', 'pianista', 'teclado'] },
        { id: 'guitarrista',        label: 'Guitarrista',         category: 'MUSICO', keywords: ['guitarra', 'guitarrista', 'acústico'] },
        { id: 'violinista',         label: 'Violinista',          category: 'MUSICO', keywords: ['violín', 'violin', 'cuerdas'] },
        { id: 'baterista',          label: 'Baterista',           category: 'MUSICO', keywords: ['batería', 'baterista', 'percusión'] },
        { id: 'saxofonista',        label: 'Saxofonista',         category: 'MUSICO', keywords: ['saxofón', 'saxo', 'saxofonista'] },
        { id: 'marimba',            label: 'Marimba',             category: 'MUSICO', keywords: ['marimba', 'marimba guatemalteca', 'marimba orquesta'] },
      ],
    },
    {
      id: 'produccion_audio',
      label: 'Producción & Audio',
      talents: [
        { id: 'productor_musical',  label: 'Productor Musical',    category: 'MUSICO', keywords: ['productor', 'beatmaker', 'producción musical'] },
        { id: 'beatmaker',          label: 'Beatmaker',            category: 'DJ',     keywords: ['beatmaker', 'beat', 'trap', 'hip hop'] },
        { id: 'rapero_freestyle',   label: 'Rapero / Freestyle',   category: 'MUSICO', keywords: ['rap', 'rapero', 'freestyle', 'hip hop'] },
        { id: 'ingeniero_sonido',   label: 'Ingeniero de Sonido',  category: 'MUSICO', keywords: ['sonido', 'audio', 'ingeniero de sonido'] },
        { id: 'locutor_voiceover',  label: 'Locutor / Voice Over', category: 'MUSICO', keywords: ['locutor', 'voice over', 'narrador', 'doblaje'] },
        { id: 'podcaster',          label: 'Podcaster',            category: 'ESCRITOR', keywords: ['podcast', 'podcaster', 'audio digital'] },
      ],
    },
    {
      id: 'dj',
      label: 'DJ',
      talents: [
        { id: 'dj_bodas',           label: 'DJ para Bodas',        category: 'DJ', keywords: ['dj bodas', 'dj wedding', 'animación musical bodas'] },
        { id: 'dj_corporativo',     label: 'DJ Corporativo',       category: 'DJ', keywords: ['dj corporativo', 'dj empresarial', 'dj eventos'] },
        { id: 'dj_electronica',     label: 'DJ Electrónica',       category: 'DJ', keywords: ['dj electrónica', 'dj club', 'dj techno', 'dj house'] },
        { id: 'dj_generalista',     label: 'DJ Eventos',           category: 'DJ', keywords: ['dj', 'disc jockey', 'pica', 'animador musical'] },
      ],
    },
  ],
};

// ─── 2. PRODUCCIÓN AUDIOVISUAL ───────────────────────────────────────────────
const AUDIOVISUAL: TalentGroup = {
  id: 'audiovisual',
  label: 'Producción Audiovisual',
  icon: 'Camera',
  subCategories: [
    {
      id: 'fotografia',
      label: 'Fotografía',
      talents: [
        { id: 'fotografo_eventos',    label: 'Fotógrafo de Eventos',   category: 'FOTOGRAFO', keywords: ['fotógrafo eventos', 'fotografía eventos', 'foto boda', 'foto fiesta'] },
        { id: 'fotografo_retrato',    label: 'Fotógrafo de Retrato',   category: 'FOTOGRAFO', keywords: ['retrato', 'portrait', 'foto retrato', 'fotografía retrato'] },
        { id: 'fotografo_producto',   label: 'Fotógrafo de Producto',  category: 'FOTOGRAFO', keywords: ['fotografía producto', 'foto producto', 'ecommerce photo'] },
        { id: 'fotografo_boda',       label: 'Fotógrafo de Bodas',     category: 'FOTOGRAFO', keywords: ['fotógrafo boda', 'wedding photographer', 'foto nupcial'] },
      ],
    },
    {
      id: 'video',
      label: 'Video',
      talents: [
        { id: 'videografo',           label: 'Videógrafo',              category: 'VIDEOGRAFO', keywords: ['videógrafo', 'video', 'videomaker'] },
        { id: 'editor_video',         label: 'Editor de Video',         category: 'VIDEOGRAFO', keywords: ['edición', 'editor de video', 'post producción'] },
        { id: 'director_audiovisual', label: 'Director Audiovisual',    category: 'VIDEOGRAFO', keywords: ['director', 'director audiovisual', 'producción audiovisual'] },
        { id: 'drone_operator',       label: 'Drone Operator',          category: 'VIDEOGRAFO', keywords: ['drone', 'dron', 'aéreo', 'drone operator'] },
        { id: 'streaming',            label: 'Streaming / En Vivo',     category: 'VIDEOGRAFO', keywords: ['streaming', 'live stream', 'transmisión en vivo', 'eventos en vivo'] },
        { id: 'colorista',            label: 'Colorista',               category: 'VIDEOGRAFO', keywords: ['colorista', 'color grading', 'corrección de color'] },
      ],
    },
  ],
};

// ─── 3. DISEÑO & ARTE VISUAL ─────────────────────────────────────────────────
const DISENO_ARTE: TalentGroup = {
  id: 'diseno_arte',
  label: 'Diseño & Arte Visual',
  icon: 'Palette',
  subCategories: [
    {
      id: 'diseno_grafico',
      label: 'Diseño Gráfico',
      talents: [
        { id: 'disenador_grafico',    label: 'Diseñador Gráfico',       category: 'DISENADOR', keywords: ['diseñador gráfico', 'diseño gráfico', 'freelance designer'] },
        { id: 'disenador_uxui',       label: 'Diseñador UX/UI',         category: 'DISENADOR', keywords: ['ux/ui', 'diseño web', 'app design', 'interfaz'] },
        { id: 'branding',             label: 'Branding / Identidad',    category: 'DISENADOR', keywords: ['branding', 'identidad visual', 'logo', 'marca'] },
        { id: 'ilustrador',           label: 'Ilustrador',              category: 'PINTOR',    keywords: ['ilustración', 'ilustrador', 'digital art'] },
        { id: 'motion_graphics',      label: 'Motion Graphics',         category: 'DISENADOR', keywords: ['motion graphics', 'animación gráfica', 'motion design'] },
        { id: 'disenador_redes',      label: 'Diseño para Redes',       category: 'DISENADOR', keywords: ['diseño redes sociales', 'social media design', 'instagram design'] },
        { id: 'arte_ia',              label: 'Arte con IA',             category: 'DISENADOR', keywords: ['midjourney', 'stable diffusion', 'ai art', 'arte ia'] },
      ],
    },
    {
      id: 'arte_fisico',
      label: 'Arte Físico',
      talents: [
        { id: 'pintor',               label: 'Pintor / Artista',        category: 'PINTOR',   keywords: ['pintura', 'pintor', 'acuarela', 'óleo', 'lienzo'] },
        { id: 'escultor',             label: 'Escultor',                category: 'ESCULTOR', keywords: ['escultura', 'escultor', 'cerámica', 'arcilla'] },
        { id: 'caligrafo',            label: 'Calígrafo',               category: 'PINTOR',   keywords: ['caligrafía', 'calígrafo', 'lettering'] },
        { id: 'artesano',             label: 'Artesano',                category: 'PINTOR',   keywords: ['artesanía', 'artesano', 'manualidades', 'handcraft'] },
        { id: 'ceramista',            label: 'Ceramista',               category: 'ESCULTOR', keywords: ['cerámica', 'ceramista', 'torno', 'alfarería'] },
      ],
    },
  ],
};

// ─── 4. ARTES ESCÉNICAS ──────────────────────────────────────────────────────
const ARTES_ESCENICAS: TalentGroup = {
  id: 'artes_escenicas',
  label: 'Artes Escénicas',
  icon: 'Theater',
  subCategories: [
    {
      id: 'danza',
      label: 'Danza',
      talents: [
        { id: 'bailarin_urbano',    label: 'Bailarín Urbano',      category: 'BAILARIN', keywords: ['baile urbano', 'hip hop dance', 'breakdance', 'street dance'] },
        { id: 'bailarin_clasico',   label: 'Bailarín Clásico',     category: 'BAILARIN', keywords: ['ballet', 'danza clásica', 'contemporáneo'] },
        { id: 'coreografo',         label: 'Coreógrafo',           category: 'BAILARIN', keywords: ['coreografía', 'coreógrafo', 'show de baile'] },
        { id: 'danza_folklorica',   label: 'Danza Folklórica',     category: 'BAILARIN', keywords: ['danza folklórica', 'folclore', 'baile típico', 'danza regional'] },
      ],
    },
    {
      id: 'actuacion',
      label: 'Actuación',
      talents: [
        { id: 'actor_actriz',       label: 'Actor / Actriz',       category: 'ANIMADOR', keywords: ['actor', 'actriz', 'actuación', 'teatro'] },
        { id: 'teatro',             label: 'Teatro',               category: 'ANIMADOR', keywords: ['teatro', 'obra teatral', 'improvisación'] },
        { id: 'mimo',               label: 'Mimo / Performance',   category: 'ANIMADOR', keywords: ['mimo', 'performance', 'arte performativo'] },
      ],
    },
  ],
};

// ─── 5. EVENTOS & ENTRETENIMIENTO ────────────────────────────────────────────
const EVENTOS_ENTRETENIMIENTO: TalentGroup = {
  id: 'eventos_entretenimiento',
  label: 'Eventos & Entretenimiento',
  icon: 'PartyPopper',
  subCategories: [
    {
      id: 'hosting',
      label: 'Hosting & Animación',
      talents: [
        { id: 'animador_mc',        label: 'Animador / MC',        category: 'ANIMADOR', keywords: ['animador', 'mc', 'presentador', 'maestro de ceremonias'] },
        { id: 'host_eventos',       label: 'Host de Eventos',      category: 'ANIMADOR', keywords: ['host', 'conductor', 'animación de eventos'] },
        { id: 'comedian_standup',   label: 'Stand-up Comedian',    category: 'ANIMADOR', keywords: ['stand up', 'comediante', 'humor', 'monólogo'] },
        { id: 'show_infantil',      label: 'Shows Infantiles',     category: 'ANIMADOR', keywords: ['shows infantiles', 'payaso', 'animación infantil', 'piñata'] },
        { id: 'personajes',         label: 'Personajes Temáticos', category: 'ANIMADOR', keywords: ['personajes', 'cosplay', 'disfraz', 'show temático'] },
      ],
    },
    {
      id: 'shows_especiales',
      label: 'Shows Especiales',
      talents: [
        { id: 'mago_ilusionista',   label: 'Mago / Ilusionista',   category: 'MAGO',    keywords: ['mago', 'magia', 'ilusionista', 'close-up', 'escenario'] },
        { id: 'acrobata',           label: 'Acróbata',             category: 'ACROBATA', keywords: ['acróbata', 'circo', 'malabarismo', 'aéreo'] },
        { id: 'show_fuego',         label: 'Show de Fuego',        category: 'ACROBATA', keywords: ['fuego', 'malabares fuego', 'fire show', 'espectáculo de fuego'] },
        { id: 'show_tematico',      label: 'Show Temático',        category: 'ANIMADOR', keywords: ['show temático', 'espectáculo temático', 'show personalizado'] },
        { id: 'animacion_fiestas',  label: 'Animación de Fiestas', category: 'ANIMADOR', keywords: ['animación fiestas', 'fiesta', 'entretenimiento fiesta'] },
      ],
    },
  ],
};

// ─── 6. CULTURA & TRADICIÓN ──────────────────────────────────────────────────
const CULTURA_TRADICION: TalentGroup = {
  id: 'cultura_tradicion',
  label: 'Cultura & Tradición',
  icon: 'Landmark',
  subCategories: [
    {
      id: 'musica_tradicional',
      label: 'Música Tradicional',
      talents: [
        { id: 'marimba_orquesta',   label: 'Marimba Orquesta',       category: 'MUSICO', keywords: ['marimba orquesta', 'marimba guatemalteca', 'música folklórica'] },
        { id: 'mariachi_tradicional', label: 'Mariachi Tradicional', category: 'MUSICO', keywords: ['mariachi', 'música mexicana', 'mariachi tradicional'] },
        { id: 'musico_regional',    label: 'Músico Regional',        category: 'MUSICO', keywords: ['música regional', 'música típica', 'música local'] },
        { id: 'musica_indigena',    label: 'Música Indígena',        category: 'MUSICO', keywords: ['música indígena', 'música maya', 'instrumentos autóctonos'] },
      ],
    },
    {
      id: 'danza_cultural',
      label: 'Danza Cultural',
      talents: [
        { id: 'danza_folklorica_trad', label: 'Danza Folklórica',   category: 'BAILARIN', keywords: ['danza folklórica', 'folclore guatemalteco', 'baile típico'] },
        { id: 'danza_indigena',     label: 'Danza Indígena',        category: 'BAILARIN', keywords: ['danza indígena', 'danza maya', 'danza ceremonial'] },
      ],
    },
    {
      id: 'artesania',
      label: 'Artesanía',
      talents: [
        { id: 'artesano_trad',      label: 'Artesano',              category: 'PINTOR',   keywords: ['artesanía guatemalteca', 'tejidos', 'textil'] },
        { id: 'disenador_textil',   label: 'Diseñador Textil',      category: 'DISENADOR', keywords: ['textil', 'diseño textil', 'confección', 'modista'] },
      ],
    },
  ],
};

// ─── 7. EDUCACIÓN CREATIVA ───────────────────────────────────────────────────
const EDUCACION_CREATIVA: TalentGroup = {
  id: 'educacion_creativa',
  label: 'Educación Creativa',
  icon: 'GraduationCap',
  subCategories: [
    {
      id: 'docencia_artistica',
      label: 'Docencia Artística',
      talents: [
        { id: 'profesor_musica',    label: 'Profesor de Música',    category: 'MUSICO',    keywords: ['clases de música', 'profesor música', 'lecciones musicales'] },
        { id: 'clases_canto',       label: 'Clases de Canto',       category: 'MUSICO',    keywords: ['clases de canto', 'vocal coach', 'canto', 'técnica vocal'] },
        { id: 'clases_pintura',     label: 'Clases de Pintura',     category: 'PINTOR',    keywords: ['clases de pintura', 'taller de pintura', 'arte plástico'] },
        { id: 'taller_creativo',    label: 'Talleres Creativos',    category: 'OTRO',      keywords: ['taller', 'workshop', 'curso creativo', 'taller artístico'] },
        { id: 'coaching_vocal',     label: 'Coaching Vocal',        category: 'MUSICO',    keywords: ['coach vocal', 'vocal coaching', 'formación vocal'] },
        { id: 'mentor_artistico',   label: 'Mentor Artístico',      category: 'OTRO',      keywords: ['mentoring', 'mentor', 'asesoría creativa'] },
      ],
    },
  ],
};

// ─── 8. CONTENIDO DIGITAL ────────────────────────────────────────────────────
const CONTENIDO_DIGITAL: TalentGroup = {
  id: 'contenido_digital',
  label: 'Contenido Digital',
  icon: 'Smartphone',
  subCategories: [
    {
      id: 'escritura',
      label: 'Escritura & Guiones',
      talents: [
        { id: 'escritor',           label: 'Escritor',              category: 'ESCRITOR', keywords: ['escritor', 'redactor', 'escritura creativa'] },
        { id: 'guionista',          label: 'Guionista',             category: 'ESCRITOR', keywords: ['guión', 'guionista', 'scriptwriter', 'screenplay'] },
        { id: 'letrista',           label: 'Letrista',              category: 'ESCRITOR', keywords: ['letras', 'letrista', 'songwriter', 'composición'] },
        { id: 'copywriter',         label: 'Copy Creativo',         category: 'ESCRITOR', keywords: ['copy', 'copywriting', 'redacción publicitaria'] },
        { id: 'storyteller',        label: 'Storyteller',           category: 'ESCRITOR', keywords: ['storytelling', 'narrativa', 'historia de marca'] },
      ],
    },
    {
      id: 'social_media',
      label: 'Social Media & Creación',
      talents: [
        { id: 'creador_contenido',  label: 'Creador de Contenido',  category: 'OTRO',     keywords: ['creador de contenido', 'content creator', 'ugc', 'influencer'] },
        { id: 'tiktoker',           label: 'TikToker / Reels',      category: 'OTRO',     keywords: ['tiktok', 'reels', 'shorts', 'video corto'] },
        { id: 'youtuber',           label: 'YouTuber',              category: 'VIDEOGRAFO', keywords: ['youtube', 'youtuber', 'video blog', 'vlog'] },
      ],
    },
  ],
};

// ─── 9. BELLEZA & ESTILO ─────────────────────────────────────────────────────
const BELLEZA_ESTILO: TalentGroup = {
  id: 'belleza_estilo',
  label: 'Belleza & Estilo',
  icon: 'Sparkles',
  subCategories: [
    {
      id: 'maquillaje',
      label: 'Maquillaje & Beauty',
      talents: [
        { id: 'maquillador_eventos', label: 'Maquillador/a Eventos',  category: 'MAQUILLADOR', keywords: ['maquillaje eventos', 'makeup artist', 'maquillista'] },
        { id: 'maquillaje_novia',    label: 'Especialista en Novias', category: 'MAQUILLADOR', keywords: ['maquillaje novia', 'makeup boda', 'makeup nupcial'] },
        { id: 'body_paint',          label: 'Body Paint Artist',      category: 'MAQUILLADOR', keywords: ['body paint', 'body art', 'pintura corporal'] },
        { id: 'estilista',           label: 'Estilista',              category: 'MAQUILLADOR', keywords: ['estilista', 'peinado', 'hair stylist', 'peluquero'] },
        { id: 'barbero_pro',         label: 'Barbero Profesional',    category: 'MAQUILLADOR', keywords: ['barbero', 'barbería', 'barber', 'corte', 'barba'] },
        { id: 'manicurista',         label: 'Manicurista / Nail Art', category: 'MAQUILLADOR', keywords: ['manicure', 'nail art', 'uñas', 'nail artist'] },
      ],
    },
    {
      id: 'tatuaje',
      label: 'Tatuaje & Body Art',
      talents: [
        { id: 'tatuador',           label: 'Tatuador',               category: 'TATUADOR', keywords: ['tatuaje', 'tattoo', 'tatuador', 'tattoo artist'] },
        { id: 'tattoo_realista',    label: 'Tattoo Realista',        category: 'TATUADOR', keywords: ['tattoo realista', 'realismo tatuaje', 'realistic tattoo'] },
        { id: 'tattoo_minimalista', label: 'Tattoo Minimalista',     category: 'TATUADOR', keywords: ['tattoo minimalista', 'fine line', 'small tattoo'] },
        { id: 'piercing_artist',    label: 'Piercing Artist',        category: 'TATUADOR', keywords: ['piercing', 'pircing', 'perforación'] },
      ],
    },
  ],
};

// ─── 10. EXPERIENCIAS CREATIVAS ──────────────────────────────────────────────
const EXPERIENCIAS_CREATIVAS: TalentGroup = {
  id: 'experiencias_creativas',
  label: 'Experiencias Creativas',
  icon: 'Star',
  subCategories: [
    {
      id: 'eventos_especiales',
      label: 'Eventos Especiales',
      talents: [
        { id: 'chef_creativo',       label: 'Chef Creativo',          category: 'OTRO', keywords: ['chef', 'cocinero', 'gastronomía', 'catering'] },
        { id: 'bartender_show',      label: 'Bartender Show',         category: 'OTRO', keywords: ['bartender', 'mixología', 'bartending show', 'coctelería'] },
        { id: 'decorador_eventos',   label: 'Decorador de Eventos',   category: 'OTRO', keywords: ['decoración', 'decorador', 'ambientación', 'floral design'] },
        { id: 'wedding_planner',     label: 'Wedding Planner',        category: 'OTRO', keywords: ['wedding planner', 'coordinadora de bodas', 'planificadora'] },
        { id: 'experiencia_tematica', label: 'Experiencias Temáticas', category: 'OTRO', keywords: ['experiencia temática', 'evento inmersivo', 'escape room'] },
        { id: 'banda_boda',          label: 'Banda para Bodas',       category: 'MUSICO', keywords: ['banda para bodas', 'música para bodas', 'banda eventos'] },
      ],
    },
  ],
};

// ─── Master export ────────────────────────────────────────────────────────────

export const TALENT_GROUPS: TalentGroup[] = [
  MUSICA_AUDIO,
  AUDIOVISUAL,
  DISENO_ARTE,
  ARTES_ESCENICAS,
  EVENTOS_ENTRETENIMIENTO,
  CULTURA_TRADICION,
  EDUCACION_CREATIVA,
  CONTENIDO_DIGITAL,
  BELLEZA_ESTILO,
  EXPERIENCIAS_CREATIVAS,
];

/** Flat map of all talents for quick lookup by id */
export const ALL_TALENTS: Talent[] = TALENT_GROUPS.flatMap(g =>
  g.subCategories.flatMap(sc => sc.talents)
);

/** Maps talent id → ArtistCategory enum */
export const TALENT_TO_CATEGORY: Record<string, ArtistCategory> = Object.fromEntries(
  ALL_TALENTS.map(t => [t.id, t.category])
);

/** Maps talent id → display label */
export const TALENT_LABEL: Record<string, string> = Object.fromEntries(
  ALL_TALENTS.map(t => [t.id, t.label])
);
