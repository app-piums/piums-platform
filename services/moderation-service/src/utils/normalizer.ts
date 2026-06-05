/**
 * Normalización de texto para detección de palabras en blacklist.
 * Inspirado en los sistemas de detección de variantes de TikTok/Meta:
 * - Elimina acentos y caracteres especiales
 * - Convierte leet speak (4→a, 3→e, 1→i, 0→o, etc.)
 * - Normaliza separadores entre letras (h.o.l.a → hola)
 * - Colapsa caracteres repetidos (hooola → hola)
 */

/** Mapa de substituciones leet speak → letra original */
const LEET_MAP: Record<string, string> = {
  "4": "a", "@": "a",
  "3": "e",
  "1": "i", "!": "i",
  "0": "o",
  "5": "s", "$": "s",
  "7": "t",
  "+": "t",
  "8": "b",
  "9": "g",
  "6": "g",
  "2": "z",
};

/** Mapa de caracteres con acento / homóglifos → base */
const ACCENT_MAP: Record<string, string> = {
  á: "a", à: "a", â: "a", ä: "a", ã: "a", å: "a",
  é: "e", è: "e", ê: "e", ë: "e",
  í: "i", ì: "i", î: "i", ï: "i",
  ó: "o", ò: "o", ô: "o", ö: "o", õ: "o",
  ú: "u", ù: "u", û: "u", ü: "u",
  ñ: "n", ç: "c",
  // Homóglifos cirílicos comunes usados para evasión
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c",
};

/**
 * Normaliza texto para detección robusta:
 * 1. Lowercase
 * 2. Quitar acentos y mapear homóglifos
 * 3. Convertir leet speak
 * 4. Eliminar puntos/guiones entre letras (h.o.l.a → hola)
 * 5. Colapsar letras repetidas (sooooy → soy)
 */
export function normalizeText(text: string): string {
  let result = text.toLowerCase();

  // Acentos y homóglifos
  for (const [char, replacement] of Object.entries(ACCENT_MAP)) {
    result = result.split(char).join(replacement);
  }

  // Leet speak
  for (const [char, replacement] of Object.entries(LEET_MAP)) {
    result = result.split(char).join(replacement);
  }

  // Separadores entre letras: h.o.l.a, h-o-l-a, h_o_l_a, h o l a
  result = result.replace(/([a-z])[.\-_ ](?=[a-z])/g, "$1");

  // Colapsar letras repetidas (más de 2 iguales → 1): hoooolaa → hola
  result = result.replace(/(.)\1{2,}/g, "$1");

  return result;
}

/**
 * Normaliza solo una palabra del blacklist (sin colapsar repetidos,
 * para que "cabrón" sea comparable con la normalización del texto)
 */
export function normalizeWord(word: string): string {
  let result = word.toLowerCase();
  for (const [char, replacement] of Object.entries(ACCENT_MAP)) {
    result = result.split(char).join(replacement);
  }
  return result;
}

/**
 * Escapa una cadena para uso seguro en RegExp
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
