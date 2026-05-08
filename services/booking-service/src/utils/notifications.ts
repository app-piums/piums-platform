import axios from 'axios';

const NOTIFICATIONS_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://notifications-service:4007';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const CLIENT_APP_URL = process.env.CLIENT_APP_URL || 'https://client.piums.io';
const ARTIST_APP_URL = process.env.ARTIST_APP_URL || 'https://artist.piums.io';

export interface BookingNotificationData {
  bookingId: string;
  bookingCode: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientInitial?: string;
  clientNotes?: string;
  artistId: string;
  artistName: string;
  artistEmail: string;
  artistCategory: string;
  artistImage?: string;
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
  anticipoRequired: boolean;
  anticipoAmount?: number;
}

const sendTemplate = (to: string, template: string, variables: Record<string, any>) =>
  axios.post(
    `${NOTIFICATIONS_URL}/api/notifications/send-template-email`,
    { to, template, variables },
    { headers: { 'Content-Type': 'application/json', 'x-internal-secret': INTERNAL_SECRET }, timeout: 8000 }
  );

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-GT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-GT', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDuration(minutes: number): string {
  if (minutes >= 60 && minutes % 60 === 0) {
    const h = minutes / 60;
    return `${h} hora${h === 1 ? '' : 's'}`;
  }
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}min`;
  }
  return `${minutes} minutos`;
}

function formatPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(cents / 100);
}

function buildVars(d: BookingNotificationData) {
  return {
    bookingCode: d.bookingCode,
    clientName: d.clientName,
    clientEmail: d.clientEmail,
    clientInitial: d.clientInitial || d.clientName.charAt(0).toUpperCase(),
    clientNotes: d.clientNotes || '',
    artistName: d.artistName,
    artistCategory: d.artistCategory,
    artistImage: d.artistImage || '',
    artistRating: d.artistRating ? d.artistRating.toFixed(1) : '',
    reviewCount: d.reviewCount ?? '',
    serviceName: d.serviceName,
    bookingDate: formatDate(d.scheduledDate),
    bookingTime: formatTime(d.scheduledDate),
    duration: formatDuration(d.durationMinutes),
    location: d.location || 'Por definir',
    servicePrice: formatPrice(d.servicePrice, d.currency),
    totalPrice: formatPrice(d.totalPrice, d.currency),
    depositAmount: d.anticipoRequired && d.anticipoAmount
      ? formatPrice(d.anticipoAmount, d.currency) : '',
    addonsPrice: d.addonsPrice ? formatPrice(d.addonsPrice, d.currency) : '',
    bookingUrl: `${CLIENT_APP_URL}/bookings/${d.bookingId}`,
    dashboardUrl: `${ARTIST_APP_URL}/artist/dashboard`,
    bookingsUrl: `${ARTIST_APP_URL}/artist/dashboard/bookings`,
    acceptUrl: `${ARTIST_APP_URL}/artist/dashboard/bookings/${d.bookingId}`,
    rejectUrl: `${ARTIST_APP_URL}/artist/dashboard/bookings/${d.bookingId}`,
    helpUrl: `${CLIENT_APP_URL}/help`,
    googleCalendarUrl: '',
    appleCalendarUrl: '',
    unsubscribeUrl: `${CLIENT_APP_URL}/settings/notifications`,
    currentYear: new Date().getFullYear(),
  };
}

export async function notifyBookingCreated(data: BookingNotificationData): Promise<void> {
  const vars = buildVars(data);
  await Promise.allSettled([
    sendTemplate(data.clientEmail, 'booking-created-client', vars)
      .then(() => console.log(`[NOTIF] booking-created-client → ${data.clientEmail}`))
      .catch((e: any) => console.error('[NOTIF] booking-created-client failed:', e.message)),
    sendTemplate(data.artistEmail, 'booking-created-artist', vars)
      .then(() => console.log(`[NOTIF] booking-created-artist → ${data.artistEmail}`))
      .catch((e: any) => console.error('[NOTIF] booking-created-artist failed:', e.message)),
  ]);
}

export async function notifyBookingConfirmed(data: BookingNotificationData): Promise<void> {
  const vars = buildVars(data);
  await Promise.allSettled([
    sendTemplate(data.clientEmail, 'booking-confirmed', vars)
      .then(() => console.log(`[NOTIF] booking-confirmed → ${data.clientEmail}`))
      .catch((e: any) => console.error('[NOTIF] booking-confirmed failed:', e.message)),
    sendTemplate(data.artistEmail, 'booking-confirmed-artist', vars)
      .then(() => console.log(`[NOTIF] booking-confirmed-artist → ${data.artistEmail}`))
      .catch((e: any) => console.error('[NOTIF] booking-confirmed-artist failed:', e.message)),
  ]);
}

export async function notifyNoShowReported(data: {
  artistEmail: string;
  artistName: string;
  bookingCode: string;
  scheduledDate: string;
}): Promise<void> {
  await sendTemplate(data.artistEmail, 'booking-no-show-artist', {
    artistName: data.artistName,
    bookingCode: data.bookingCode,
    scheduledDate: formatDate(data.scheduledDate),
    currentYear: new Date().getFullYear(),
  }).catch((e: any) => console.error('[NOTIF] booking-no-show-artist failed:', e.message));
}

export async function notifyNoShowResolved(data: {
  clientEmail: string;
  clientName: string;
  bookingCode: string;
  refundAmount: number;
  creditAmount: number;
}): Promise<void> {
  await sendTemplate(data.clientEmail, 'booking-no-show-client', {
    clientName: data.clientName,
    bookingCode: data.bookingCode,
    refundAmount: (data.refundAmount / 100).toFixed(2),
    creditAmount: (data.creditAmount / 100).toFixed(2),
    currentYear: new Date().getFullYear(),
  }).catch((e: any) => console.error('[NOTIF] booking-no-show-client failed:', e.message));
}

export async function sendReminder24h(data: BookingNotificationData): Promise<void> {
  const vars = buildVars(data);
  await sendTemplate(data.clientEmail, 'booking-reminder-24h', vars)
    .catch((e: any) => console.error('[NOTIF] booking-reminder-24h failed:', e.message));
}

export async function sendReminder2h(data: BookingNotificationData): Promise<void> {
  const vars = buildVars(data);
  await sendTemplate(data.clientEmail, 'booking-reminder-2h', vars)
    .catch((e: any) => console.error('[NOTIF] booking-reminder-2h failed:', e.message));
}
