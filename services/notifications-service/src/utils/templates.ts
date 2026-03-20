import * as fs from 'fs';
import * as path from 'path';

interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Lee un template HTML desde el sistema de archivos
 */
export function loadTemplate(templateName: string): string {
  const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
  
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }
  
  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Reemplaza variables en el template HTML
 * Soporta: {{variable}} y {{#if condition}}...{{/if}}
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  let rendered = template;
  
  // Reemplazar condicionales {{#if variable}}...{{/if}}
  rendered = rendered.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, varName, content) => {
    const value = variables[varName];
    return value ? content : '';
  });
  
  // Reemplazar variables simples {{variable}}
  rendered = rendered.replace(/\{\{(\w+)\}\}/g, (_match, varName) => {
    const value = variables[varName];
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  });
  
  return rendered;
}

/**
 * Carga y renderiza un template en un solo paso
 */
export function getRenderedTemplate(templateName: string, variables: TemplateVariables): string {
  const template = loadTemplate(templateName);
  return renderTemplate(template, variables);
}

/**
 * Formatea una fecha para mostrar en español
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formatea una hora para mostrar en formato 12h
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('es-MX', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Formatea una duración en minutos a texto legible
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} minutos`;
  }
  if (mins === 0) {
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  return `${hours} ${hours === 1 ? 'hora' : 'horas'} y ${mins} minutos`;
}

/**
 * Formatea un precio en centavos a moneda
 */
export function formatPrice(cents: number, currency: string = 'GTQ'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Obtiene la inicial de un nombre para el avatar
 */
export function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

/**
 * Genera URL de Google Maps
 */
export function getGoogleMapsUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

/**
 * Genera URL de Google Calendar
 */
export function getGoogleCalendarUrl(params: {
  title: string;
  startDate: Date | string;
  endDate: Date | string;
  location?: string;
  description?: string;
}): string {
  const start = typeof params.startDate === 'string' ? new Date(params.startDate) : params.startDate;
  const end = typeof params.endDate === 'string' ? new Date(params.endDate) : params.endDate;
  
  const startStr = start.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endStr = end.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', params.title);
  url.searchParams.append('dates', `${startStr}/${endStr}`);
  if (params.location) {
    url.searchParams.append('location', params.location);
  }
  if (params.description) {
    url.searchParams.append('details', params.description);
  }
  
  return url.toString();
}
