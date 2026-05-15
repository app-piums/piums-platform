const CATEGORY_LABELS: Record<string, string> = {
  MUSICO:             'Músico',
  FOTOGRAFO:          'Fotógrafo',
  VIDEOGRAFO:         'Videógrafo',
  ANIMADOR:           'Animador',
  CREADOR_CONTENIDO:  'Creador de Contenido',
  OTRO:               'Otro',
};

export function formatArtistCategory(
  category: string | null | undefined,
  specialties?: string[] | null,
): string {
  if (!category) return '';
  if (category === 'OTRO' && specialties?.length) {
    const label = specialties.find(s => s && s !== 'OTRO');
    if (label) return label;
  }
  return CATEGORY_LABELS[category] ?? category;
}
