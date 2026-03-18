// ============================================================================
// @piums/shared-config — Currency & locale configuration
// ============================================================================

export const CURRENCY = {
  CODE: 'GTQ',
  SYMBOL: 'Q',
  LOCALE: 'es-GT',
  TIMEZONE: 'America/Guatemala',
  DECIMAL_SEPARATOR: '.',
  THOUSANDS_SEPARATOR: ',',
  PLATFORM_FEE_PERCENT: 10,
  MIN_BOOKING_AMOUNT: 10000, // Q 100.00 in centavos
} as const;

export const LOCALE = {
  LANGUAGE: 'es',
  REGION: 'GT',
  FULL: 'es-GT',
  TIMEZONE: 'America/Guatemala',
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
} as const;
