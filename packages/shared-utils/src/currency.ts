// ============================================================================
// @piums/shared-utils — USD currency formatters
// ============================================================================

const USD_LOCALE = 'en-US';
const USD_CURRENCY = 'USD';

/**
 * Formats an amount (in cents) as "$1,234.56"
 */
export function formatUSD(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat(USD_LOCALE, {
    style: 'currency',
    currency: USD_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/** @deprecated Use formatUSD instead */
export const formatGTQ = formatUSD;

/**
 * Formats a dollar amount directly (not cents)
 */
export function formatUSDFromDollars(dollars: number): string {
  return new Intl.NumberFormat(USD_LOCALE, {
    style: 'currency',
    currency: USD_CURRENCY,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

/** @deprecated Use formatUSDFromDollars instead */
export const formatGTQFromQuetzales = formatUSDFromDollars;

/**
 * Converts cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** @deprecated Use centsToDollars instead */
export const centavosToQuetzales = centsToDollars;

/**
 * Converts dollars to cents (safe integer math)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** @deprecated Use dollarsToCents instead */
export const quetzalesToCentavos = dollarsToCents;

/**
 * Calculates platform fee (default 10%)
 */
export function calcPlatformFee(amount: number, feePercent = 10): number {
  return Math.round(amount * (feePercent / 100));
}
