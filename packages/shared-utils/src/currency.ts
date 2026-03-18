// ============================================================================
// @piums/shared-utils — GTQ currency formatters
// ============================================================================

const GTQ_LOCALE = 'es-GT';
const GTQ_CURRENCY = 'GTQ';

/**
 * Formats an amount (in centavos) as "Q 1,234.56"
 */
export function formatGTQ(centavos: number): string {
  const quetzales = centavos / 100;
  return new Intl.NumberFormat(GTQ_LOCALE, {
    style: 'currency',
    currency: GTQ_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(quetzales);
}

/**
 * Formats quetzales amount directly (not centavos)
 */
export function formatGTQFromQuetzales(quetzales: number): string {
  return new Intl.NumberFormat(GTQ_LOCALE, {
    style: 'currency',
    currency: GTQ_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(quetzales);
}

/**
 * Converts centavos to quetzales
 */
export function centavosToQuetzales(centavos: number): number {
  return centavos / 100;
}

/**
 * Converts quetzales to centavos (safe integer math)
 */
export function quetzalesToCentavos(quetzales: number): number {
  return Math.round(quetzales * 100);
}

/**
 * Calculates platform fee (default 10%)
 */
export function calcPlatformFee(amount: number, feePercent = 10): number {
  return Math.round(amount * (feePercent / 100));
}
