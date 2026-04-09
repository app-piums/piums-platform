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
