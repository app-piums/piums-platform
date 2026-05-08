'use client';

import React, { useState } from 'react';
import {
  Music, Camera, Film, PartyPopper, Mic,
  ChevronDown, ChevronUp, X, Star,
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
    id: 'musica', label: 'Música', icon: 'Music',
    subCategories: [
      { id: 'musico', label: 'Músico', talents: [
        { id: 'cantante_solista',  label: 'Cantante Solista',   category: 'MUSICO' },
        { id: 'banda_musical',     label: 'Banda Musical',      category: 'MUSICO' },
        { id: 'mariachi',          label: 'Mariachi',           category: 'MUSICO' },
        { id: 'marimba',           label: 'Marimba',            category: 'MUSICO' },
        { id: 'grupo_acustico',    label: 'Grupo Acústico',     category: 'MUSICO' },
        { id: 'trio_cuarteto',     label: 'Trío / Cuarteto',    category: 'MUSICO' },
        { id: 'pianista',          label: 'Pianista',           category: 'MUSICO' },
        { id: 'guitarrista',       label: 'Guitarrista',        category: 'MUSICO' },
        { id: 'violinista',        label: 'Violinista',         category: 'MUSICO' },
        { id: 'baterista',         label: 'Baterista',          category: 'MUSICO' },
        { id: 'saxofonista',       label: 'Saxofonista',        category: 'MUSICO' },
        { id: 'productor_musical', label: 'Productor Musical',  category: 'MUSICO' },
      ]},
    ],
  },
  {
    id: 'fotografia', label: 'Fotografía', icon: 'Camera',
    subCategories: [
      { id: 'fotografo', label: 'Fotógrafo', talents: [
        { id: 'fotografo_eventos',  label: 'Fotógrafo de Eventos',  category: 'FOTOGRAFO' },
        { id: 'fotografo_boda',     label: 'Fotógrafo de Bodas',    category: 'FOTOGRAFO' },
        { id: 'fotografo_retrato',  label: 'Fotógrafo de Retrato',  category: 'FOTOGRAFO' },
        { id: 'fotografo_producto', label: 'Fotografía Comercial',  category: 'FOTOGRAFO' },
        { id: 'drone_foto',         label: 'Drone / Aéreo',         category: 'FOTOGRAFO' },
      ]},
    ],
  },
  {
    id: 'video', label: 'Video', icon: 'Film',
    subCategories: [
      { id: 'videografo', label: 'Videógrafo', talents: [
        { id: 'videografo_eventos',   label: 'Videógrafo de Eventos', category: 'VIDEOGRAFO' },
        { id: 'videografo_boda',      label: 'Videógrafo de Bodas',   category: 'VIDEOGRAFO' },
        { id: 'editor_video',         label: 'Editor de Video',       category: 'VIDEOGRAFO' },
        { id: 'director_audiovisual', label: 'Director Audiovisual',  category: 'VIDEOGRAFO' },
        { id: 'drone_video',          label: 'Drone / Aéreo',         category: 'VIDEOGRAFO' },
        { id: 'streaming',            label: 'Streaming / En Vivo',   category: 'VIDEOGRAFO' },
      ]},
    ],
  },
  {
    id: 'animador', label: 'Animador', icon: 'PartyPopper',
    subCategories: [
      { id: 'animacion', label: 'Animación', talents: [
        { id: 'payaso',            label: 'Payaso',              category: 'ANIMADOR' },
        { id: 'maestro_ceremonia', label: 'Maestro de Ceremonia', category: 'ANIMADOR' },
      ]},
    ],
  },
];

// ─── Icon resolver ────────────────────────────────────────────────────────────

const GROUP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Music, Camera, Film, PartyPopper, Mic, Star,
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
