/**
 * Ordenamiento "suave" por rango de precio.
 *
 * minPrice/maxPrice NO excluyen resultados: definen un orden por cercanía
 * al presupuesto del cliente.
 *
 * - Tier 0: precio dentro de [min, max] → DESC por precio (el más cercano al
 *   máximo primero). Si solo hay min (sin max), ASC desde min.
 * - Tier 1: fuera del rango → ASC por distancia al límite más cercano.
 * - Tier 2: sin precio conocido → al final.
 *
 * El comparador devuelve 0 en empates para que un sort estable preserve el
 * orden de relevancia previo.
 */

export function effectivePrice(a: {
  hourlyRateMin: number | null;
  mainServicePrice: number | null;
}): number | null {
  return a.hourlyRateMin ?? a.mainServicePrice ?? null;
}

export function priceTierRank(
  price: number | null,
  minPrice?: number,
  maxPrice?: number
): [number, number] {
  if (price == null) return [2, 0];
  const lo = minPrice ?? 0;
  const hi = maxPrice ?? Number.POSITIVE_INFINITY;
  if (price >= lo && price <= hi) {
    return [0, maxPrice != null ? -price : price - lo];
  }
  return [1, price > hi ? price - hi : lo - price];
}

export function priceTierCompare(
  a: [number, number],
  b: [number, number]
): number {
  return a[0] - b[0] || a[1] - b[1];
}
