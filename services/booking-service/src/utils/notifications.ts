import axios from 'axios';

const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:4006';

interface BookingNotificationData {
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
  scheduledDate: string;
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
 * Envía notificación cuando se crea una nueva reserva
 */
export async function notifyBookingCreated(data: BookingNotificationData): Promise<void> {
  try {
    await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notifications/booking/created`, data);
    console.log(`Booking created notifications sent for booking ${data.bookingId}`);
  } catch (error: any) {
    console.error('Failed to send booking created notifications:', error.message);
    // No lanzar el error para no bloquear la creación de la reserva
  }
}

/**
 * Envía notificación cuando el artista confirma la reserva
 */
export async function notifyBookingConfirmed(data: BookingNotificationData): Promise<void> {
  try {
    await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notifications/booking/confirmed`, data);
    console.log(`Booking confirmed notification sent for booking ${data.bookingId}`);
  } catch (error: any) {
    console.error('Failed to send booking confirmed notification:', error.message);
  }
}

/**
 * Envía recordatorio 24 horas antes de la cita
 */
export async function sendReminder24h(data: BookingNotificationData): Promise<void> {
  try {
    await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notifications/booking/reminder-24h`, data);
    console.log(`24h reminder sent for booking ${data.bookingId}`);
  } catch (error: any) {
    console.error('Failed to send 24h reminder:', error.message);
  }
}

/**
 * Envía recordatorio 2 horas antes de la cita
 */
export async function sendReminder2h(data: BookingNotificationData): Promise<void> {
  try {
    await axios.post(`${NOTIFICATIONS_SERVICE_URL}/api/notifications/booking/reminder-2h`, data);
    console.log(`2h reminder sent for booking ${data.bookingId}`);
  } catch (error: any) {
    console.error('Failed to send 2h reminder:', error.message);
  }
}
