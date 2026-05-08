/**
 * Lista de palabras ofensivas para el filtro de mensajes.
 * Incluye términos en español (variantes latinoamericanas y guatemaltecas),
 * insultos, lenguaje de acoso y amenazas.
 *
 * El filtro reemplaza las coincidencias con "***" antes de guardar el mensaje.
 * También expone `containsProfanity()` para rechazar mensajes completamente ofensivos.
 */

export const SPANISH_PROFANITY_LIST: string[] = [
  // ── Groserías generales ──────────────────────────────────────────────────
  'puta', 'puto', 'putas', 'putos', 'putita', 'putito',
  'pendejo', 'pendeja', 'pendejos', 'pendejas', 'pendejada',
  'cabrón', 'cabrona', 'cabrones', 'cabronas', 'cabron',
  'hijoputa', 'hijoeputa', 'hijo de puta', 'hija de puta',
  'joder', 'jodido', 'jodida', 'jódete',
  'coño', 'concha', 'conchatumadre',
  'mierda', 'mierdas', 'mierdoso',
  'verga', 'vergas', 'vergón', 'vergona',
  'chinga', 'chingada', 'chingado', 'chingón', 'chingona', 'chíngate',
  'culero', 'culera', 'culo',
  'mamada', 'mamón', 'mamona', 'mamar',
  'pinche', 'pinches',
  'güey', 'wey', 'buey',
  'cagate', 'cágate',
  'perra', 'perro',         // en contexto ofensivo
  'zorra', 'zorras',
  'piche', 'picha',
  'cipote',                 // Guatemala: puede ser ofensivo en contexto
  'bicho',                  // en contexto ofensivo
  'maje',                   // Guatemala: puede usarse ofensivamente
  'baboso', 'babosa',
  'imbécil', 'imbecil',
  'idiota', 'idiotas',
  'estúpido', 'estúpida', 'estupido', 'estupida',
  'animal',                 // en contexto de insulto
  'bestia',
  'tarado', 'tarada',
  'retrasado', 'retrasada',
  'mongolo', 'mongola',
  'mogólico', 'mogólica',
  'inútil', 'inutiles',

  // ── Acoso / contacto inapropiado ─────────────────────────────────────────
  'sexo', 'seco',           // propuestas explícitas en contexto de booking
  'coger', 'cogerse',
  'follar',
  'tetas', 'tetona',
  'nalgas', 'nalgona',
  'pezón', 'pezones',
  'desnuda', 'desnudo', 'desnudos',
  'pornografía', 'porno',
  'masturbarse', 'masturbar',
  'eyacular',
  'chupamela', 'chupame',
  'prostituta', 'prostituto', 'prostitución',
  'puta madre', 'reputa',
  'sexting',
  'onlyfans',               // en contexto de acoso

  // ── Amenazas y violencia ─────────────────────────────────────────────────
  'te voy a matar', 'te mato', 'te voy a golpear',
  'te voy a violar', 'te violo', 'violarte',
  'te voy a encontrar', 'sé dónde vives',
  'te rompo', 'te parto',
  'te cago',

  // ── Discriminación / slurs ───────────────────────────────────────────────
  'maricón', 'maricones', 'maricon',
  'marica', 'mariconazo',
  'puto gay',
  'joto', 'jotos',
  'travelo', 'travesti',     // en contexto ofensivo
  'tortillera',
  'negro',                   // en contexto de insulto racial
  'negrito', 'negra de mierda',
  'india', 'indio',          // en contexto de insulto étnico (Guatemala)
  'chapín burro',            // insulto regional
  'ladino',                  // en contexto de insulto étnico
  'cholo', 'cholos',         // en contexto despectivo
  'sudaca',
  'gringo de mierda',
];

/**
 * Normaliza texto para comparación: minúsculas + quita acentos comunes.
 */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u')
    .replace(/ñ/g, 'n');
}

/**
 * Devuelve true si el texto contiene alguna palabra de la lista.
 * Útil para decidir si rechazar el mensaje en vez de solo censurarlo.
 */
export function containsProfanity(text: string): boolean {
  const norm = normalize(text);
  return SPANISH_PROFANITY_LIST.some(word => {
    const normWord = normalize(word);
    // Busca la palabra como token separado por espacios/puntuación
    const regex = new RegExp(`(^|[^a-záéíóúüñ])${normWord}([^a-záéíóúüñ]|$)`, 'i');
    return regex.test(norm);
  });
}

/**
 * Reemplaza palabras ofensivas en el texto con "***".
 */
export function cleanProfanity(text: string): string {
  let result = text;
  for (const word of SPANISH_PROFANITY_LIST) {
    const normWord = normalize(word);
    const regex = new RegExp(normWord, 'gi');
    result = result.replace(regex, '***');
  }
  return result;
}
