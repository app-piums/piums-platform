/**
 * Scoring de "Recomendados para ti".
 *
 * Combina tres señales, todas normalizadas a [0,1]:
 *
 *   score = 0.35 * proximity + 0.25 * interest + 0.40 * quality
 *
 * Regla de diseño que atraviesa todo el archivo: una señal que falta para TODOS
 * los candidatos vale 0.5 (neutro), no 0. Así el término se vuelve constante y se
 * cancela en el orden, en vez de castigar a quien no tiene el dato. Es lo que hace
 * que el feed degrade con elegancia: sin GPS ordena por interés+calidad, sin
 * intereses por cercanía+calidad, y sin ninguno de los dos por calidad pura.
 *
 * OJO con el matiz: eso vale cuando la señal falta para todos. Cuando falta solo
 * para ALGUNOS candidatos, el neutro deja de ser neutral y se convierte en un
 * premio al perfil incompleto — ver UNKNOWN_LOCATION.
 *
 * La distancia NUNCA excluye, solo puntúa: la mayoría del catálogo declara
 * cobertura nacional, y un filtro geo duro dejaría el feed vacío.
 */

/** Distancia a la que la cercanía vale la mitad. */
const HALF_DISTANCE_KM = 50;

/** Reseñas necesarias para que el rating pese como "propio" (prior bayesiano). */
const RATING_CONFIDENCE_M = 3;

/** Reservas a partir de las cuales la señal satura. */
const BOOKINGS_CAP = 20;

const W_PROXIMITY = 0.35;
const W_INTEREST = 0.25;
const W_QUALITY = 0.4;

const NEUTRAL = 0.5;

/**
 * Cercanía de un artista sin coordenadas, cuando SÍ sabemos dónde está el usuario.
 *
 * No es 0.5 a propósito. El neutro solo es legítimo cuando la señal falta para
 * TODOS por igual (y entonces el término se cancela). Si falta solo para algunos,
 * 0.5 deja de ser neutral y pasa a ser una decisión: premiar al perfil incompleto
 * por encima de quien sí declaró su ubicación y resulta estar lejos. Eso incentiva
 * a no rellenar el dato, y se detectó de verdad en pruebas — los dos artistas sin
 * coordenadas encabezaban el feed.
 *
 * 0.3 equivale a estar a ~117 km: no entierra al artista sin datos (sigue por
 * delante de uno a 300 km), pero no puede ganarle a nadie verificablemente cerca.
 */
const UNKNOWN_LOCATION = 0.3;

export interface ScorableArtist {
  id: string;
  specialties: string[];
  averageRating: number;
  totalReviews: number;
  totalBookings: number;
  baseLocationLat: number | null;
  baseLocationLng: number | null;
  coverageRadius: number | null;
}

export interface ScoreContext {
  lat?: number;
  lng?: number;
  categories: string[];
}

export interface Scored {
  artist: ScorableArtist;
  score: number;
  distanceKm: number | null;
}

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const RAD = Math.PI / 180;
  const dLat = (lat2 - lat1) * RAD;
  const dLng = (lng2 - lng1) * RAD;
  const sin2 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(sin2)));
}

/**
 * Cercanía. Decae como 1/(1+d/50): suave y nunca llega a 0, así que un artista
 * lejano baja pero no desaparece del feed.
 *
 * 50 km como media vida discrimina *ciudad vs ciudad*, no *colonia vs colonia*:
 * dentro del área metropolitana (~25 km) el castigo es leve (0.67), a Antigua
 * (~30 km) 0.63, a Quetzaltenango (~165 km) 0.23.
 *
 * coverageRadius sube el piso a 0.8 solo si el artista declara un radio y tu
 * punto cae dentro. La cobertura NACIONAL (null) NO da el bonus: "estoy
 * dispuesto a viajar" no es "estoy cerca", y como casi todo el catálogo es
 * nacional, regalarlo empataría a todos en 0.8 y mataría la señal.
 */
export function proximityScore(
  a: ScorableArtist,
  lat?: number,
  lng?: number
): { score: number; distanceKm: number | null } {
  // El usuario no compartió ubicación: la señal falta para todos por igual, así que
  // el neutro vuelve constante el término y el orden lo deciden interés y calidad.
  if (lat === undefined || lng === undefined) {
    return { score: NEUTRAL, distanceKm: null };
  }

  // Sabemos dónde está el usuario, pero no el artista. Ver UNKNOWN_LOCATION.
  if (a.baseLocationLat == null || a.baseLocationLng == null) {
    return { score: UNKNOWN_LOCATION, distanceKm: null };
  }

  const distanceKm = haversineKm(lat, lng, a.baseLocationLat, a.baseLocationLng);
  let score = 1 / (1 + distanceKm / HALF_DISTANCE_KM);

  if (a.coverageRadius != null && distanceKm <= a.coverageRadius) {
    score = Math.max(score, 0.8);
  }

  return { score, distanceKm };
}

/**
 * Coincidencia con las categorías de interés del onboarding.
 *
 * Binaria porque la señal es binaria. No excluye a quien no coincide: solo le
 * cuesta 0.25, de modo que en un marketplace pequeño un 4.9 al lado de otra
 * categoría todavía puede ganarle a un mediocre que sí coincide.
 */
export function interestScore(a: ScorableArtist, categories: string[]): number {
  if (categories.length === 0) return NEUTRAL;
  return a.specialties.some((s) => categories.includes(s)) ? 1 : 0;
}

/**
 * Calidad: rating (bayesiano) + volumen de reservas.
 *
 * El rating crudo se encoge hacia el prior 0.5 según la confianza que dan las
 * reseñas: conf = reviews/(reviews+3). Sin esto, un 5.0 con UNA reseña le gana
 * a un 4.8 con 50, que es justo lo que no queremos. m=3 es bajo a propósito:
 * el marketplace es joven y exigir 20 reseñas para tener credibilidad dejaría
 * fuera a todo el catálogo.
 *
 * Un artista nuevo sin reseñas saca 0.5: visible, pero sin dominar.
 *
 * isVerified NO entra aquí: ya es filtro duro, así que sería una constante.
 */
export function qualityScore(a: ScorableArtist): number {
  const rating = a.averageRating / 5;
  const confidence = a.totalReviews / (a.totalReviews + RATING_CONFIDENCE_M);
  const bayesian = rating * confidence + NEUTRAL * (1 - confidence);
  const bookings = Math.min(a.totalBookings, BOOKINGS_CAP) / BOOKINGS_CAP;
  return 0.65 * bayesian + 0.35 * bookings;
}

export function scoreArtist(a: ScorableArtist, ctx: ScoreContext): Scored {
  const { score: proximity, distanceKm } = proximityScore(a, ctx.lat, ctx.lng);
  const score =
    W_PROXIMITY * proximity +
    W_INTEREST * interestScore(a, ctx.categories) +
    W_QUALITY * qualityScore(a);
  return { artist: a, score, distanceKm };
}

/**
 * Orden. El desempate por id hace la paginación determinista: sin él, dos
 * artistas con el mismo score podrían intercambiarse entre la página 1 y la 2
 * y aparecer duplicados o desaparecer.
 */
export function compareScored(x: Scored, y: Scored): number {
  return (
    y.score - x.score ||
    y.artist.totalReviews - x.artist.totalReviews ||
    x.artist.id.localeCompare(y.artist.id)
  );
}
