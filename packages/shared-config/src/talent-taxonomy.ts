// ============================================================================
// @piums/shared-config — Talent Taxonomy
// Maps creative disciplines → sub-categories → individual talents
// ============================================================================

export type ArtistCategory =
  | 'MUSICO'
  | 'FOTOGRAFO'
  | 'VIDEOGRAFO'
  | 'ANIMADOR';

export interface Talent {
  id: string;
  label: string;
  category: ArtistCategory;
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
  icon: string;
  subCategories: TalentSubCategory[];
}

// ─── 1. MÚSICA ───────────────────────────────────────────────────────────────
const MUSICA: TalentGroup = {
  id: 'musica',
  label: 'Música',
  icon: 'Music',
  subCategories: [
    {
      id: 'musico',
      label: 'Músico',
      talents: [
        { id: 'cantante_solista',  label: 'Cantante Solista',    category: 'MUSICO', keywords: ['cantante', 'solista', 'vocalista'] },
        { id: 'banda_musical',     label: 'Banda Musical',       category: 'MUSICO', keywords: ['banda', 'grupo musical', 'conjunto'] },
        { id: 'mariachi',          label: 'Mariachi',            category: 'MUSICO', keywords: ['mariachi', 'trío', 'música ranchera'] },
        { id: 'marimba',           label: 'Marimba',             category: 'MUSICO', keywords: ['marimba', 'marimba guatemalteca'] },
        { id: 'grupo_acustico',    label: 'Grupo Acústico',      category: 'MUSICO', keywords: ['grupo acústico', 'acústico', 'unplugged'] },
        { id: 'trio_cuarteto',     label: 'Trío / Cuarteto',     category: 'MUSICO', keywords: ['trío', 'cuarteto', 'ensemble'] },
        { id: 'pianista',          label: 'Pianista',            category: 'MUSICO', keywords: ['piano', 'pianista', 'teclado'] },
        { id: 'guitarrista',       label: 'Guitarrista',         category: 'MUSICO', keywords: ['guitarra', 'guitarrista'] },
        { id: 'violinista',        label: 'Violinista',          category: 'MUSICO', keywords: ['violín', 'violin', 'cuerdas'] },
        { id: 'baterista',         label: 'Baterista',           category: 'MUSICO', keywords: ['batería', 'baterista', 'percusión'] },
        { id: 'saxofonista',       label: 'Saxofonista',         category: 'MUSICO', keywords: ['saxofón', 'saxo'] },
        { id: 'productor_musical', label: 'Productor Musical',   category: 'MUSICO', keywords: ['productor', 'beatmaker', 'producción'] },
      ],
    },
  ],
};

// ─── 2. FOTOGRAFÍA ───────────────────────────────────────────────────────────
const FOTOGRAFIA: TalentGroup = {
  id: 'fotografia',
  label: 'Fotografía',
  icon: 'Camera',
  subCategories: [
    {
      id: 'fotografo',
      label: 'Fotógrafo',
      talents: [
        { id: 'fotografo_eventos',  label: 'Fotógrafo de Eventos',  category: 'FOTOGRAFO', keywords: ['fotografía eventos', 'foto boda', 'foto fiesta'] },
        { id: 'fotografo_boda',     label: 'Fotógrafo de Bodas',    category: 'FOTOGRAFO', keywords: ['fotógrafo boda', 'wedding photographer'] },
        { id: 'fotografo_retrato',  label: 'Fotógrafo de Retrato',  category: 'FOTOGRAFO', keywords: ['retrato', 'portrait', 'headshots'] },
        { id: 'fotografo_producto', label: 'Fotografía Comercial',  category: 'FOTOGRAFO', keywords: ['fotografía producto', 'ecommerce photo'] },
        { id: 'drone_foto',         label: 'Drone / Aéreo',         category: 'FOTOGRAFO', keywords: ['drone', 'dron', 'aéreo', 'foto aérea'] },
      ],
    },
  ],
};

// ─── 3. VIDEO ────────────────────────────────────────────────────────────────
const VIDEO: TalentGroup = {
  id: 'video',
  label: 'Video',
  icon: 'Film',
  subCategories: [
    {
      id: 'videografo',
      label: 'Videógrafo',
      talents: [
        { id: 'videografo_eventos',   label: 'Videógrafo de Eventos',  category: 'VIDEOGRAFO', keywords: ['videógrafo', 'video eventos', 'videomaker'] },
        { id: 'videografo_boda',      label: 'Videógrafo de Bodas',    category: 'VIDEOGRAFO', keywords: ['video boda', 'wedding video', 'cinematic'] },
        { id: 'editor_video',         label: 'Editor de Video',        category: 'VIDEOGRAFO', keywords: ['edición', 'editor de video', 'post producción'] },
        { id: 'director_audiovisual', label: 'Director Audiovisual',   category: 'VIDEOGRAFO', keywords: ['director', 'producción audiovisual', 'videoclip'] },
        { id: 'drone_video',          label: 'Drone / Aéreo',          category: 'VIDEOGRAFO', keywords: ['drone', 'dron', 'aéreo', 'video aéreo'] },
        { id: 'streaming',            label: 'Streaming / En Vivo',    category: 'VIDEOGRAFO', keywords: ['streaming', 'live stream', 'transmisión en vivo'] },
      ],
    },
  ],
};

// ─── 4. ANIMADOR ─────────────────────────────────────────────────────────────
const ANIMADOR: TalentGroup = {
  id: 'animador',
  label: 'Animador',
  icon: 'PartyPopper',
  subCategories: [
    {
      id: 'animacion',
      label: 'Animación',
      talents: [
        { id: 'payaso',            label: 'Payaso',              category: 'ANIMADOR', keywords: ['payaso', 'show infantil', 'animación niños', 'globoflexia', 'magia'] },
        { id: 'maestro_ceremonia', label: 'Maestro de Ceremonia', category: 'ANIMADOR', keywords: ['mc', 'maestro ceremonias', 'animador eventos', 'presentador'] },
      ],
    },
  ],
};

// ─── Master export ────────────────────────────────────────────────────────────

export const TALENT_GROUPS: TalentGroup[] = [
  MUSICA,
  FOTOGRAFIA,
  VIDEO,
  ANIMADOR,
];

export const ALL_TALENTS: Talent[] = TALENT_GROUPS.flatMap(g =>
  g.subCategories.flatMap(sc => sc.talents)
);

export const TALENT_TO_CATEGORY: Record<string, ArtistCategory> = Object.fromEntries(
  ALL_TALENTS.map(t => [t.id, t.category])
);

export const TALENT_LABEL: Record<string, string> = Object.fromEntries(
  ALL_TALENTS.map(t => [t.id, t.label])
);
