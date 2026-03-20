// ============================================================================
// @piums/shared-utils — Date formatters (es-GT locale)
// ============================================================================

const GT_LOCALE = 'es-GT';
const GT_TIMEZONE = 'America/Guatemala';

/**
 * Format a date as "18 de marzo de 2026" (long, Spanish Guatemala)
 */
export function formatDateLong(date: Date | string): string {
  return new Intl.DateTimeFormat(GT_LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: GT_TIMEZONE,
  }).format(new Date(date));
}

/**
 * Format a date as "18/03/2026"
 */
export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat(GT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: GT_TIMEZONE,
  }).format(new Date(date));
}

/**
 * Format as "18/03/2026 14:30"
 */
export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat(GT_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: GT_TIMEZONE,
  }).format(new Date(date));
}

/**
 * Format as "14:30 h"
 */
export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat(GT_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: GT_TIMEZONE,
  }).format(new Date(date));
}

/**
 * Relative time ("hace 2 días", "en 3 horas")
 */
export function formatRelativeTime(date: Date | string): string {
  const rtf = new Intl.RelativeTimeFormat(GT_LOCALE, { numeric: 'auto' });
  const diffMs = new Date(date).getTime() - Date.now();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (Math.abs(diffSecs) < 60) return rtf.format(diffSecs, 'second');
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day');
  return formatDateShort(date);
}

/**
 * Returns true if the date is in the past
 */
export function isPast(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now();
}

/**
 * Add minutes to a date
 */
export function addMinutes(date: Date | string, minutes: number): Date {
  return new Date(new Date(date).getTime() + minutes * 60 * 1000);
}
