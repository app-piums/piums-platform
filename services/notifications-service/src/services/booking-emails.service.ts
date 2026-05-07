import { emailProvider } from '../providers/email.provider';
import { logger } from '../utils/logger';
import {
  getRenderedTemplate,
  formatDate,
  formatTime,
  formatDuration,
  formatPrice,
  getInitial,
  getGoogleMapsUrl,
  getGoogleCalendarUrl,
} from '../utils/templates';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

interface BookingEmailData {
  bookingId: string;
  bookingCode: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  artistId: string;
  artistName: string;
  artistEmail: string;
  artistCategory: string;
  artistImage: string;
  artistRating?: number;
  reviewCount?: number;
  serviceName: string;
  scheduledDate: string; // ISO string
  durationMinutes: number;
  location: string;
  servicePrice: number;
  addonsPrice?: number;
  totalPrice: number;
  currency: string;
  depositRequired: boolean;
  depositAmount?: number;
  clientNotes?: string;
}

/**
 * Envía email al cliente cuando crea una nueva reserva
 */
export async function sendBookingCreatedClientEmail(data: BookingEmailData) {
  try {
    const startDate = new Date(data.scheduledDate);
    // endDate calculado pero no usado en este template
    const variables = {
      bookingCode: data.bookingCode,
      clientName: data.clientName,
      artistName: data.artistName,
      artistCategory: data.artistCategory,
      artistImage: data.artistImage,
      serviceName: data.serviceName,
      bookingDate: formatDate(startDate),
      bookingTime: formatTime(startDate),
      duration: formatDuration(data.durationMinutes),
      location: data.location,
      servicePrice: formatPrice(data.servicePrice, data.currency),
      addonsPrice: data.addonsPrice ? formatPrice(data.addonsPrice, data.currency) : '',
      hasAddons: data.addonsPrice && data.addonsPrice > 0,
      totalPrice: formatPrice(data.totalPrice, data.currency),
      depositRequired: data.depositRequired,
      depositAmount: data.depositAmount ? formatPrice(data.depositAmount, data.currency) : '',
      bookingUrl: `${BASE_URL}/booking/confirmation/${data.bookingId}`,
      dashboardUrl: `${BASE_URL}/dashboard`,
      helpUrl: `${BASE_URL}/help`,
      unsubscribeUrl: `${BASE_URL}/settings/notifications`,
    };
    
    const html = getRenderedTemplate('booking-created-client', variables);
    
    await emailProvider.sendEmail({
      to: data.clientEmail,
      subject: `Reserva Creada - ${data.serviceName} con ${data.artistName}`,
      html,
    });
    
    logger.info('Booking created email sent to client', 'BOOKING_EMAIL', {
      bookingId: data.bookingId,
      clientEmail: data.clientEmail,
    });
  } catch (error) {
    logger.error('Failed to send booking created email to client', 'BOOKING_EMAIL', error);
    throw error;
  }
}

/**
 * Envía email al artista cuando recibe una nueva solicitud
 */
export async function sendBookingCreatedArtistEmail(data: BookingEmailData) {
  try {
    const startDate = new Date(data.scheduledDate);
    // endDate calculado pero no usado en este template
    const variables = {
      bookingCode: data.bookingCode,
      artistName: data.artistName,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientInitial: getInitial(data.clientName),
      serviceName: data.serviceName,
      bookingDate: formatDate(startDate),
      bookingTime: formatTime(startDate),
      duration: formatDuration(data.durationMinutes),
      location: data.location,
      totalPrice: formatPrice(data.totalPrice, data.currency),
      hasNotes: !!data.clientNotes,
      clientNotes: data.clientNotes || '',
      acceptUrl: `${BASE_URL}/artist/bookings/${data.bookingId}/accept`,
      rejectUrl: `${BASE_URL}/artist/bookings/${data.bookingId}/reject`,
      dashboardUrl: `${BASE_URL}/artist/dashboard`,
      bookingsUrl: `${BASE_URL}/artist/bookings`,
      helpUrl: `${BASE_URL}/help`,
    };
    
    const html = getRenderedTemplate('booking-created-artist', variables);
    
    await emailProvider.sendEmail({
      to: data.artistEmail,
      subject: `Nueva Reserva de ${data.clientName} - ${data.serviceName}`,
      html,
    });
    
    logger.info('Booking created email sent to artist', 'BOOKING_EMAIL', {
      bookingId: data.bookingId,
      artistEmail: data.artistEmail,
    });
  } catch (error) {
    logger.error('Failed to send booking created email to artist', 'BOOKING_EMAIL', error);
    throw error;
  }
}

/**
 * Envía email al cliente cuando el artista confirma la reserva
 */
export async function sendBookingConfirmedEmail(data: BookingEmailData) {
  try {
    const startDate = new Date(data.scheduledDate);
    const endDate = new Date(startDate.getTime() + data.durationMinutes * 60000);
    
    const googleCalendarUrl = getGoogleCalendarUrl({
      title: `${data.serviceName} con ${data.artistName}`,
      startDate,
      endDate,
      location: data.location,
      description: `Reserva confirmada - Código: ${data.bookingCode}`,
    });
    
    const variables = {
      bookingCode: data.bookingCode,
      clientName: data.clientName,
      artistName: data.artistName,
      artistCategory: data.artistCategory,
      artistImage: data.artistImage,
      artistRating: data.artistRating || 0,
      reviewCount: data.reviewCount || 0,
      serviceName: data.serviceName,
      bookingDate: formatDate(startDate),
      bookingTime: formatTime(startDate),
      duration: formatDuration(data.durationMinutes),
      location: data.location,
      totalPrice: formatPrice(data.totalPrice, data.currency),
      depositRequired: data.depositRequired,
      depositAmount: data.depositAmount ? formatPrice(data.depositAmount, data.currency) : '',
      googleCalendarUrl,
      appleCalendarUrl: `${BASE_URL}/api/bookings/${data.bookingId}/calendar.ics`,
      bookingUrl: `${BASE_URL}/booking/confirmation/${data.bookingId}`,
      dashboardUrl: `${BASE_URL}/dashboard`,
      bookingsUrl: `${BASE_URL}/bookings`,
      helpUrl: `${BASE_URL}/help`,
    };
    
    const html = getRenderedTemplate('booking-confirmed', variables);
    
    await emailProvider.sendEmail({
      to: data.clientEmail,
      subject: `¡Reserva Confirmada! ${data.serviceName} con ${data.artistName}`,
      html,
    });
    
    logger.info('Booking confirmed email sent', 'BOOKING_EMAIL', {
      bookingId: data.bookingId,
      clientEmail: data.clientEmail,
    });
  } catch (error) {
    logger.error('Failed to send booking confirmed email', 'BOOKING_EMAIL', error);
    throw error;
  }
}

/**
 * Envía email al artista cuando confirma una reserva
 */
export async function sendBookingConfirmedArtistEmail(data: BookingEmailData) {
  try {
    const startDate = new Date(data.scheduledDate);

    const variables = {
      bookingCode: data.bookingCode,
      artistName: data.artistName,
      clientName: data.clientName,
      clientInitial: getInitial(data.clientName),
      serviceName: data.serviceName,
      bookingDate: formatDate(startDate),
      bookingTime: formatTime(startDate),
      duration: formatDuration(data.durationMinutes),
      location: data.location,
      totalPrice: formatPrice(data.totalPrice, data.currency),
      dashboardUrl: `${BASE_URL}/artist/dashboard`,
      bookingsUrl: `${BASE_URL}/artist/dashboard/bookings`,
      helpUrl: `${BASE_URL}/help`,
    };

    const html = getRenderedTemplate('booking-confirmed-artist', variables);

    await emailProvider.sendEmail({
      to: data.artistEmail,
      subject: `Reserva Confirmada - ${data.serviceName} con ${data.clientName}`,
      html,
    });

    logger.info('Booking confirmed email sent to artist', 'BOOKING_EMAIL', {
      bookingId: data.bookingId,
      artistEmail: data.artistEmail,
    });
  } catch (error) {
    logger.error('Failed to send booking confirmed email to artist', 'BOOKING_EMAIL', error);
    throw error;
  }
}

/**
 * Envía recordatorio 24 horas antes de la cita
 */
export async function sendBookingReminder24hEmail(data: BookingEmailData) {
  try {
    const startDate = new Date(data.scheduledDate);
    const mapsUrl = getGoogleMapsUrl(data.location);
    
    const variables = {
      bookingCode: data.bookingCode,
      clientName: data.clientName,
      artistName: data.artistName,
      artistCategory: data.artistCategory,
      artistImage: data.artistImage,
      serviceName: data.serviceName,
      bookingDate: formatDate(startDate),
      bookingTime: formatTime(startDate),
      duration: formatDuration(data.durationMinutes),
      location: data.location,
      mapsUrl,
      bookingUrl: `${BASE_URL}/booking/confirmation/${data.bookingId}`,
      rescheduleUrl: `${BASE_URL}/bookings/${data.bookingId}/reschedule`,
      contactUrl: `${BASE_URL}/messages/artist/${data.artistId}`,
      dashboardUrl: `${BASE_URL}/dashboard`,
      bookingsUrl: `${BASE_URL}/bookings`,
      helpUrl: `${BASE_URL}/help`,
    };
    
    const html = getRenderedTemplate('booking-reminder-24h', variables);
    
    await emailProvider.sendEmail({
      to: data.clientEmail,
      subject: `Recordatorio: Tu cita mañana con ${data.artistName}`,
      html,
    });
    
    logger.info('24h reminder email sent', 'BOOKING_EMAIL', {
      bookingId: data.bookingId,
      clientEmail: data.clientEmail,
    });
  } catch (error) {
    logger.error('Failed to send 24h reminder email', 'BOOKING_EMAIL', error);
    throw error;
  }
}

/**
 * Envía recordatorio 2 horas antes de la cita
 */
export async function sendBookingReminder2hEmail(data: BookingEmailData) {
  try {
    const startDate = new Date(data.scheduledDate);
    const mapsUrl = getGoogleMapsUrl(data.location);
    
    const variables = {
      bookingCode: data.bookingCode,
      clientName: data.clientName,
      artistName: data.artistName,
      serviceName: data.serviceName,
      bookingTime: formatTime(startDate),
      location: data.location,
      mapsUrl,
      contactUrl: `${BASE_URL}/messages/artist/${data.artistId}`,
      bookingUrl: `${BASE_URL}/booking/confirmation/${data.bookingId}`,
      dashboardUrl: `${BASE_URL}/dashboard`,
      bookingsUrl: `${BASE_URL}/bookings`,
      supportUrl: `${BASE_URL}/support`,
    };
    
    const html = getRenderedTemplate('booking-reminder-2h', variables);
    
    await emailProvider.sendEmail({
      to: data.clientEmail,
      subject: `¡Tu cita es en 2 horas! - ${data.artistName}`,
      html,
    });
    
    logger.info('2h reminder email sent', 'BOOKING_EMAIL', {
      bookingId: data.bookingId,
      clientEmail: data.clientEmail,
    });
  } catch (error) {
    logger.error('Failed to send 2h reminder email', 'BOOKING_EMAIL', error);
    throw error;
  }
}

export async function sendPaymentManualRequiredEmail(data: {
  bookingId: string;
  bookingCode: string;
  clientEmail: string;
  clientName: string;
  remainingAmount: number;
  currency: string;
  scheduledDate: string | Date;
  urgency: '72h' | '48h' | '24h';
}) {
  try {
    const urgencyLabel = data.urgency === '24h' ? 'menos de 24 horas' : data.urgency === '48h' ? 'menos de 48 horas' : 'próximas 72 horas';
    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:sans-serif;background:#f5f5f5;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.badge{display:inline-block;background:#FEF3C7;color:#92400E;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:700;margin-bottom:16px}
h1{font-size:20px;color:#111;margin:0 0 8px}
p{color:#555;line-height:1.6;margin:12px 0}
.amount{font-size:28px;font-weight:800;color:#FF6A00;margin:16px 0}
.btn{display:inline-block;background:#FF6A00;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:15px;margin-top:16px}
.footer{margin-top:24px;font-size:12px;color:#aaa;text-align:center}</style></head>
<body><div class="card">
<div class="badge">⚠️ Pago pendiente — ${urgencyLabel}</div>
<h1>Hola, ${data.clientName}</h1>
<p>Tu evento programado para el <strong>${formatDate(data.scheduledDate)}</strong> está muy cerca y aún tienes un saldo pendiente.</p>
<div class="amount">${data.currency} ${(data.remainingAmount / 100).toFixed(2)}</div>
<p>Reserva: <strong>#${data.bookingCode}</strong></p>
<p>Por favor completa el pago lo antes posible para garantizar que tu reserva se mantenga confirmada.</p>
<a href="${BASE_URL}/booking/checkout?bookingId=${data.bookingId}" class="btn">Pagar ahora</a>
<div class="footer">Si ya realizaste el pago, ignora este mensaje. Para dudas escríbenos a soporte@piums.io</div>
</div></body></html>`;

    await emailProvider.sendEmail({
      to: data.clientEmail,
      subject: `Pago urgente requerido — Reserva #${data.bookingCode}`,
      html,
    });

    logger.info('Payment manual required email sent', 'BOOKING_EMAIL', { bookingId: data.bookingId });
  } catch (error) {
    logger.error('Failed to send payment manual required email', 'BOOKING_EMAIL', error);
    throw error;
  }
}

export async function sendBookingAutoCompletedEmail(data: {
  bookingId: string;
  bookingCode: string;
  clientEmail: string;
  clientName: string;
  artistName: string;
  serviceName: string;
  scheduledDate: string | Date;
}) {
  try {
    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:sans-serif;background:#f5f5f5;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.badge{display:inline-block;background:#D1FAE5;color:#065F46;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:700;margin-bottom:16px}
h1{font-size:20px;color:#111;margin:0 0 8px}
p{color:#555;line-height:1.6;margin:12px 0}
.details{background:#F9FAFB;border-radius:8px;padding:16px;margin:16px 0}
.btn{display:inline-block;background:#FF6A00;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:15px;margin-top:8px}
.btn-outline{display:inline-block;background:transparent;color:#FF6A00;border:2px solid #FF6A00;text-decoration:none;padding:10px 24px;border-radius:8px;font-weight:700;font-size:15px;margin:8px 0 0 12px}
.footer{margin-top:24px;font-size:12px;color:#aaa;text-align:center}</style></head>
<body><div class="card">
<div class="badge">✅ Servicio completado</div>
<h1>Hola, ${data.clientName}</h1>
<p>Tu reserva con <strong>${data.artistName}</strong> fue marcada como completada automáticamente.</p>
<div class="details">
  <p style="margin:0"><strong>Servicio:</strong> ${data.serviceName}</p>
  <p style="margin:8px 0 0"><strong>Fecha:</strong> ${formatDate(data.scheduledDate)}</p>
  <p style="margin:4px 0 0"><strong>Código:</strong> #${data.bookingCode}</p>
</div>
<p>Si tuviste algún inconveniente o el servicio no fue prestado, tienes <strong>24 horas</strong> para reportarlo.</p>
<a href="${BASE_URL}/bookings/${data.bookingId}" class="btn">Ver reserva</a>
<a href="${BASE_URL}/quejas/nueva?bookingId=${data.bookingId}" class="btn-outline">Reportar problema</a>
<div class="footer">© 2026 Piums — soporte@piums.io</div>
</div></body></html>`;

    await emailProvider.sendEmail({
      to: data.clientEmail,
      subject: `Servicio completado — Reserva #${data.bookingCode}`,
      html,
    });

    logger.info('Auto-completed email sent', 'BOOKING_EMAIL', { bookingId: data.bookingId });
  } catch (error) {
    logger.error('Failed to send auto-completed email', 'BOOKING_EMAIL', error);
    throw error;
  }
}

export async function sendCommissionChangedEmail(data: {
  artistId: string;
  artistEmail: string;
  artistName: string;
  ruleType: 'RATE_OVERRIDE' | 'FIXED_PENALTY';
  rate?: number;
  fixedAmount?: number;
  currency: string;
  reason: string;
  startDate: string | Date;
}) {
  try {
    const isOverride = data.ruleType === 'RATE_OVERRIDE';
    const ruleLabel = isOverride
      ? `Tasa de comisión ajustada al ${(data.rate! * 100).toFixed(0)}%`
      : `Penalización fija de ${data.currency} ${((data.fixedAmount ?? 0) / 100).toFixed(2)}`;

    const html = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>body{font-family:sans-serif;background:#f5f5f5;margin:0;padding:20px}
.card{background:#fff;border-radius:12px;max-width:560px;margin:0 auto;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
.badge{display:inline-block;background:#EDE9FE;color:#5B21B6;border-radius:20px;padding:4px 14px;font-size:13px;font-weight:700;margin-bottom:16px}
h1{font-size:20px;color:#111;margin:0 0 8px}
p{color:#555;line-height:1.6;margin:12px 0}
.rule{background:#F9FAFB;border-left:4px solid #FF6A00;border-radius:0 8px 8px 0;padding:12px 16px;margin:16px 0}
.footer{margin-top:24px;font-size:12px;color:#aaa;text-align:center}</style></head>
<body><div class="card">
<div class="badge">${isOverride ? '📋 Comisión modificada' : '⚠️ Penalización aplicada'}</div>
<h1>Hola, ${data.artistName}</h1>
<p>Te informamos que se ha aplicado un cambio en tus condiciones de comisión a partir del <strong>${formatDate(data.startDate)}</strong>.</p>
<div class="rule">
  <p style="margin:0;font-weight:700;color:#111">${ruleLabel}</p>
  <p style="margin:8px 0 0;color:#666"><strong>Motivo:</strong> ${data.reason}</p>
</div>
<p>Para más información, por favor contacta a nuestro equipo de soporte.</p>
<div class="footer">© 2026 Piums — soporte@piums.io</div>
</div></body></html>`;

    await emailProvider.sendEmail({
      to: data.artistEmail,
      subject: isOverride
        ? `Cambio en tu comisión — Piums`
        : `Penalización aplicada a tu cuenta — Piums`,
      html,
    });

    logger.info('Commission changed email sent', 'BOOKING_EMAIL', { artistId: data.artistId });
  } catch (error) {
    logger.error('Failed to send commission changed email', 'BOOKING_EMAIL', error);
    throw error;
  }
}

export async function sendNoShowClientEmail(data: {
  bookingId: string;
  bookingCode: string;
  clientEmail: string;
  clientName: string;
  refundAmount: number;
  creditAmount: number;
  currency: string;
}) {
  try {
    const html = getRenderedTemplate('booking-no-show-client', {
      bookingCode: data.bookingCode,
      clientName: data.clientName,
      refundAmount: (data.refundAmount / 100).toFixed(2),
      creditAmount: (data.creditAmount / 100).toFixed(2),
      currency: data.currency,
    });

    await emailProvider.sendEmail({
      to: data.clientEmail,
      subject: `Reembolso y crédito procesados — Reserva #${data.bookingCode}`,
      html,
    });

    logger.info('No-show client email sent', 'BOOKING_EMAIL', { bookingId: data.bookingId });
  } catch (error) {
    logger.error('Failed to send no-show client email', 'BOOKING_EMAIL', error);
    throw error;
  }
}

export async function sendNoShowArtistEmail(data: {
  bookingId: string;
  bookingCode: string;
  artistEmail: string;
  artistName: string;
  scheduledDate: string | Date;
}) {
  try {
    const html = getRenderedTemplate('booking-no-show-artist', {
      bookingCode: data.bookingCode,
      artistName: data.artistName,
      scheduledDate: formatDate(data.scheduledDate),
    });

    await emailProvider.sendEmail({
      to: data.artistEmail,
      subject: `Cuenta restringida — No-show reportado en reserva #${data.bookingCode}`,
      html,
    });

    logger.info('No-show artist email sent', 'BOOKING_EMAIL', { bookingId: data.bookingId });
  } catch (error) {
    logger.error('Failed to send no-show artist email', 'BOOKING_EMAIL', error);
    throw error;
  }
}
