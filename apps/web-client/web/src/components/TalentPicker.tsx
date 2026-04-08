'use client';

import React, { useState } from 'react';
import {
  Music, Camera, Palette, Theater, PartyPopper, Landmark,
  GraduationCap, Smartphone, Sparkles, Star,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Talent {
  id: string;
  label: string;
  category: string;
  keywords?: string[];
}

interface SubCategory {
  id: string;
  label: string;
  talents: Talent[];
}

interface TalentGroup {
  id: string;
  label: string;
  icon: string;
  subCategories: SubCategory[];
}

// ─── Inline taxonomy (avoids monorepo import issues in Next.js edge/build) ────

const TALENT_GROUPS: TalentGroup[] = [
  {
    id: 'musica_audio', label: 'Música & Audio', icon: 'Music',
    subCategories: [
      { id: 'musico', label: 'Músico', talents: [
        { id: 'cantante_solista',   label: 'Cantante Solista',    category: 'MUSICO' },
        { id: 'banda_musical',      label: 'Banda Musical',       category: 'MUSICO' },
        { id: 'mariachi',           label: 'Mariachi',            category: 'MUSICO' },
        { id: 'grupo_acustico',     label: 'Grupo Acústico',      category: 'MUSICO' },
        { id: 'trio_cuarteto',      label: 'Trío / Cuarteto',     category: 'MUSICO' },
        { id: 'pianista',           label: 'Pianista',            category: 'MUSICO' },
        { id: 'guitarrista',        label: 'Guitarrista',         category: 'MUSICO' },
        { id: 'violinista',         label: 'Violinista',          category: 'MUSICO' },
        { id: 'baterista',          label: 'Baterista',           category: 'MUSICO' },
        { id: 'saxofonista',        label: 'Saxofonista',         category: 'MUSICO' },
        { id: 'marimba',            label: 'Marimba',             category: 'MUSICO' },
      ]},
      { id: 'produccion_audio', label: 'Producción & Audio', talents: [
        { id: 'productor_musical',  label: 'Productor Musical',   category: 'MUSICO' },
        { id: 'beatmaker',          label: 'Beatmaker',           category: 'DJ' },
        { id: 'rapero_freestyle',   label: 'Rapero / Freestyle',  category: 'MUSICO' },
        { id: 'ingeniero_sonido',   label: 'Ingeniero de Sonido', category: 'MUSICO' },
        { id: 'locutor_voiceover',  label: 'Locutor / Voice Over', category: 'MUSICO' },
        { id: 'podcaster',          label: 'Podcaster',           category: 'ESCRITOR' },
      ]},
      { id: 'dj', label: 'DJ', talents: [
        { id: 'dj_bodas',           label: 'DJ para Bodas',       category: 'DJ' },
        { id: 'dj_corporativo',     label: 'DJ Corporativo',      category: 'DJ' },
        { id: 'dj_electronica',     label: 'DJ Electrónica',      category: 'DJ' },
        { id: 'dj_generalista',     label: 'DJ Eventos',          category: 'DJ' },
      ]},
    ],
  },
  {
    id: 'audiovisual', label: 'Producción Audiovisual', icon: 'Camera',
    subCategories: [
      { id: 'fotografia', label: 'Fotografía', talents: [
        { id: 'fotografo_eventos',    label: 'Fotógrafo de Eventos',   category: 'FOTOGRAFO' },
        { id: 'fotografo_retrato',    label: 'Fotógrafo de Retrato',   category: 'FOTOGRAFO' },
        { id: 'fotografo_producto',   label: 'Fotógrafo de Producto',  category: 'FOTOGRAFO' },
        { id: 'fotografo_boda',       label: 'Fotógrafo de Bodas',     category: 'FOTOGRAFO' },
      ]},
      { id: 'video', label: 'Video', talents: [
        { id: 'videografo',           label: 'Videógrafo',             category: 'VIDEOGRAFO' },
        { id: 'editor_video',         label: 'Editor de Video',        category: 'VIDEOGRAFO' },
        { id: 'director_audiovisual', label: 'Director Audiovisual',   category: 'VIDEOGRAFO' },
        { id: 'drone_operator',       label: 'Drone Operator',         category: 'VIDEOGRAFO' },
        { id: 'streaming',            label: 'Streaming / En Vivo',    category: 'VIDEOGRAFO' },
        { id: 'colorista',            label: 'Colorista',              category: 'VIDEOGRAFO' },
      ]},
    ],
  },
  {
    id: 'diseno_arte', label: 'Diseño & Arte Visual', icon: 'Palette',
    subCategories: [
      { id: 'diseno_grafico', label: 'Diseño Gráfico', talents: [
        { id: 'disenador_grafico',    label: 'Diseñador Gráfico',      category: 'DISENADOR' },
        { id: 'disenador_uxui',       label: 'Diseñador UX/UI',        category: 'DISENADOR' },
        { id: 'branding',             label: 'Branding / Identidad',   category: 'DISENADOR' },
        { id: 'ilustrador',           label: 'Ilustrador',             category: 'PINTOR' },
        { id: 'motion_graphics',      label: 'Motion Graphics',        category: 'DISENADOR' },
        { id: 'disenador_redes',      label: 'Diseño para Redes',      category: 'DISENADOR' },
        { id: 'arte_ia',              label: 'Arte con IA',            category: 'DISENADOR' },
      ]},
      { id: 'arte_fisico', label: 'Arte Físico', talents: [
        { id: 'pintor',               label: 'Pintor / Artista',       category: 'PINTOR' },
        { id: 'escultor',             label: 'Escultor',               category: 'ESCULTOR' },
        { id: 'caligrafo',            label: 'Calígrafo',              category: 'PINTOR' },
        { id: 'artesano',             label: 'Artesano',               category: 'PINTOR' },
        { id: 'ceramista',            label: 'Ceramista',              category: 'ESCULTOR' },
      ]},
    ],
  },
  {
    id: 'artes_escenicas', label: 'Artes Escénicas', icon: 'Theater',
    subCategories: [
      { id: 'danza', label: 'Danza', talents: [
        { id: 'bailarin_urbano',    label: 'Bailarín Urbano',      category: 'BAILARIN' },
        { id: 'bailarin_clasico',   label: 'Bailarín Clásico',     category: 'BAILARIN' },
        { id: 'coreografo',         label: 'Coreógrafo',           category: 'BAILARIN' },
        { id: 'danza_folklorica',   label: 'Danza Folklórica',     category: 'BAILARIN' },
      ]},
      { id: 'actuacion', label: 'Actuación', talents: [
        { id: 'actor_actriz',       label: 'Actor / Actriz',       category: 'ANIMADOR' },
        { id: 'teatro',             label: 'Teatro',               category: 'ANIMADOR' },
        { id: 'mimo',               label: 'Mimo / Performance',   category: 'ANIMADOR' },
      ]},
    ],
  },
  {
    id: 'eventos_entretenimiento', label: 'Eventos & Entretenimiento', icon: 'PartyPopper',
    subCategories: [
      { id: 'hosting', label: 'Hosting & Animación', talents: [
        { id: 'animador_mc',        label: 'Animador / MC',        category: 'ANIMADOR' },
        { id: 'host_eventos',       label: 'Host de Eventos',      category: 'ANIMADOR' },
        { id: 'comedian_standup',   label: 'Stand-up Comedian',    category: 'ANIMADOR' },
        { id: 'show_infantil',      label: 'Shows Infantiles',     category: 'ANIMADOR' },
      ]},
      { id: 'shows_especiales', label: 'Shows Especiales', talents: [
        { id: 'mago_ilusionista',   label: 'Mago / Ilusionista',   category: 'MAGO' },
        { id: 'acrobata',           label: 'Acróbata',             category: 'ACROBATA' },
        { id: 'show_fuego',         label: 'Show de Fuego',        category: 'ACROBATA' },
        { id: 'show_tematico',      label: 'Show Temático',        category: 'ANIMADOR' },
        { id: 'animacion_fiestas',  label: 'Animación de Fiestas', category: 'ANIMADOR' },
      ]},
    ],
  },
  {
    id: 'cultura_tradicion', label: 'Cultura & Tradición', icon: 'Landmark',
    subCategories: [
      { id: 'musica_tradicional', label: 'Música Tradicional', talents: [
        { id: 'marimba_orquesta',     label: 'Marimba Orquesta',       category: 'MUSICO' },
        { id: 'mariachi_tradicional', label: 'Mariachi Tradicional',   category: 'MUSICO' },
        { id: 'musico_regional',      label: 'Músico Regional',        category: 'MUSICO' },
        { id: 'musica_indigena',      label: 'Música Indígena',        category: 'MUSICO' },
      ]},
      { id: 'danza_cultural', label: 'Danza Cultural', talents: [
        { id: 'danza_folklorica_trad', label: 'Danza Folklórica', category: 'BAILARIN' },
        { id: 'danza_indigena',        label: 'Danza Indígena',   category: 'BAILARIN' },
      ]},
      { id: 'artesania', label: 'Artesanía', talents: [
        { id: 'artesano_trad',    label: 'Artesano',           category: 'PINTOR' },
        { id: 'disenador_textil', label: 'Diseñador Textil',   category: 'DISENADOR' },
      ]},
    ],
  },
  {
    id: 'educacion_creativa', label: 'Educación Creativa', icon: 'GraduationCap',
    subCategories: [
      { id: 'docencia_artistica', label: 'Docencia Artística', talents: [
        { id: 'profesor_musica',  label: 'Profesor de Música',    category: 'MUSICO' },
        { id: 'clases_canto',     label: 'Clases de Canto',       category: 'MUSICO' },
        { id: 'clases_pintura',   label: 'Clases de Pintura',     category: 'PINTOR' },
        { id: 'taller_creativo',  label: 'Talleres Creativos',    category: 'OTRO' },
        { id: 'coaching_vocal',   label: 'Coaching Vocal',        category: 'MUSICO' },
        { id: 'mentor_artistico', label: 'Mentor Artístico',      category: 'OTRO' },
      ]},
    ],
  },
  {
    id: 'contenido_digital', label: 'Contenido Digital', icon: 'Smartphone',
    subCategories: [
      { id: 'escritura', label: 'Escritura & Guiones', talents: [
        { id: 'escritor',          label: 'Escritor',             category: 'ESCRITOR' },
        { id: 'guionista',         label: 'Guionista',            category: 'ESCRITOR' },
        { id: 'letrista',          label: 'Letrista',             category: 'ESCRITOR' },
        { id: 'copywriter',        label: 'Copy Creativo',        category: 'ESCRITOR' },
        { id: 'storyteller',       label: 'Storyteller',          category: 'ESCRITOR' },
      ]},
      { id: 'social_media', label: 'Social Media', talents: [
        { id: 'creador_contenido', label: 'Creador de Contenido', category: 'OTRO' },
        { id: 'tiktoker',          label: 'TikToker / Reels',     category: 'OTRO' },
        { id: 'youtuber',          label: 'YouTuber',             category: 'VIDEOGRAFO' },
      ]},
    ],
  },
  {
    id: 'belleza_estilo', label: 'Belleza & Estilo', icon: 'Sparkles',
    subCategories: [
      { id: 'maquillaje', label: 'Maquillaje & Beauty', talents: [
        { id: 'maquillador_eventos', label: 'Maquillador/a Eventos',   category: 'MAQUILLADOR' },
        { id: 'maquillaje_novia',    label: 'Especialista en Novias',  category: 'MAQUILLADOR' },
        { id: 'body_paint',          label: 'Body Paint Artist',       category: 'MAQUILLADOR' },
        { id: 'estilista',           label: 'Estilista',               category: 'MAQUILLADOR' },
        { id: 'barbero_pro',         label: 'Barbero Profesional',     category: 'MAQUILLADOR' },
        { id: 'manicurista',         label: 'Manicurista / Nail Art',  category: 'MAQUILLADOR' },
      ]},
      { id: 'tatuaje', label: 'Tatuaje & Body Art', talents: [
        { id: 'tatuador',            label: 'Tatuador',               category: 'TATUADOR' },
        { id: 'tattoo_realista',     label: 'Tattoo Realista',        category: 'TATUADOR' },
        { id: 'tattoo_minimalista',  label: 'Tattoo Minimalista',     category: 'TATUADOR' },
        { id: 'piercing_artist',     label: 'Piercing Artist',        category: 'TATUADOR' },
      ]},
    ],
  },
  {
    id: 'experiencias_creativas', label: 'Experiencias Creativas', icon: 'Star',
    subCategories: [
      { id: 'eventos_especiales', label: 'Eventos Especiales', talents: [
        { id: 'chef_creativo',        label: 'Chef Creativo',           category: 'OTRO' },
        { id: 'bartender_show',       label: 'Bartender Show',          category: 'OTRO' },
        { id: 'decorador_eventos',    label: 'Decorador de Eventos',    category: 'OTRO' },
        { id: 'wedding_planner',      label: 'Wedding Planner',         category: 'OTRO' },
        { id: 'experiencia_tematica', label: 'Experiencias Temáticas',  category: 'OTRO' },
        { id: 'banda_boda',           label: 'Banda para Bodas',        category: 'MUSICO' },
      ]},
    ],
  },
];

// ─── Icon resolver ────────────────────────────────────────────────────────────

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Music, Camera, Palette, Theater, PartyPopper, Landmark,
  GraduationCap, Smartphone, Sparkles, Star,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TalentPickerProps {
  selectedTalentId?: string;
  onSelect: (talentId: string, talentLabel: string, category: string) => void;
  onClear?: () => void;
  /** If true, renders all groups expanded by default */
  defaultExpanded?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TalentPicker({ selectedTalentId, onSelect, onClear, defaultExpanded = false }: TalentPickerProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    defaultExpanded ? new Set(TALENT_GROUPS.map(g => g.id)) : new Set([TALENT_GROUPS[0].id])
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const selectedTalent = selectedTalentId
    ? TALENT_GROUPS.flatMap(g => g.subCategories.flatMap(sc => sc.talents)).find(t => t.id === selectedTalentId)
    : null;

  return (
    <div className="space-y-2">
      {/* Selected talent badge */}
      {selectedTalent && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm text-gray-500">Talento seleccionado:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF6A00] text-white text-sm font-medium rounded-full">
            {selectedTalent.label}
            {onClear && (
              <button onClick={onClear} className="ml-1 hover:opacity-70 transition-opacity">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </span>
        </div>
      )}

      {/* Groups accordion */}
      {TALENT_GROUPS.map(group => {
        const Icon = GROUP_ICONS[group.icon] ?? Star;
        const isOpen = expandedGroups.has(group.id);
        const allTalents = group.subCategories.flatMap(sc => sc.talents);
        const hasSelected = allTalents.some(t => t.id === selectedTalentId);

        return (
          <div key={group.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white dark:bg-[#1E293B] dark:border-[#334155]">
            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#243044] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${hasSelected ? 'bg-[#FF6A00]' : 'bg-orange-50 dark:bg-[#243044]'}`}>
                  <Icon className={`h-4 w-4 ${hasSelected ? 'text-white' : 'text-[#FF6A00]'}`} />
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-[#F1F5F9]">{group.label}</span>
                {hasSelected && (
                  <span className="h-2 w-2 rounded-full bg-[#FF6A00]" title="Tienes un talento seleccionado en este grupo" />
                )}
              </div>
              {isOpen
                ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
              }
            </button>

            {/* Sub-categories + talent chips */}
            {isOpen && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-[#334155] pt-3 space-y-4">
                {group.subCategories.map(sc => (
                  <div key={sc.id}>
                    <p className="text-xs font-semibold text-gray-400 dark:text-[#94A3B8] uppercase tracking-wider mb-2">{sc.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {sc.talents.map(talent => {
                        const isSelected = talent.id === selectedTalentId;
                        return (
                          <button
                            key={talent.id}
                            onClick={() => {
                              if (isSelected && onClear) onClear();
                              else onSelect(talent.id, talent.label, talent.category);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-[#FF6A00] border-[#FF6A00] text-white shadow-sm'
                                : 'border-gray-200 dark:border-[#334155] text-gray-700 dark:text-[#CBD5E1] bg-gray-50 dark:bg-[#243044] hover:border-[#FF6A00]/50 hover:text-[#FF6A00] dark:hover:text-[#FF6A00] hover:bg-orange-50 dark:hover:bg-[#1E293B]'
                            }`}
                          >
                            {talent.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
