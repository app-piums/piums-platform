/**
 * Ordenamiento "suave" por rango de precio (mismo contrato que el backend,
 * services/search-service/src/utils/priceTier.ts).
 *
 * min/max NO excluyen resultados: definen un orden por cercanía al presupuesto.
 * - Tier 0: precio dentro de [min, max] → DESC por precio (más cercano al máximo primero).
 *   Si solo hay min (sin max), ASC desde min.
 * - Tier 1: fuera del rango → ASC por distancia al límite más cercano.
 * - Tier 2: sin precio conocido → al final.
 * Unidades: las del caller (USD en la web), siempre que min/max y price coincidan.
 */

export type PriceTierRank = [number, number];

export function priceTierRank(
  price: number | null,
  minPrice?: number,
  maxPrice?: number
): PriceTierRank {
  if (price == null) return [2, 0];
  const lo = minPrice ?? 0;
  const hi = maxPrice ?? Number.POSITIVE_INFINITY;
  if (price >= lo && price <= hi) {
    return [0, maxPrice != null ? -price : price - lo];
  }
  return [1, price > hi ? price - hi : lo - price];
}

export function priceTierCompare(a: PriceTierRank, b: PriceTierRank): number {
  return a[0] - b[0] || a[1] - b[1];
}

/** Ordena (estable) una lista por cercanía al rango usando getPrice por ítem. */
export function sortByPriceTier<T>(
  items: T[],
  getPrice: (item: T) => number | null,
  minPrice?: number,
  maxPrice?: number
): T[] {
  return [...items].sort((a, b) =>
    priceTierCompare(
      priceTierRank(getPrice(a), minPrice, maxPrice),
      priceTierRank(getPrice(b), minPrice, maxPrice)
    )
  );
}
