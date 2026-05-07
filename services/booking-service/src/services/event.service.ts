import { PrismaClient, EventStatus, BookingStatus } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// ==================== HELPERS ====================

async function generateEventCode(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.event.count();
  const seq = String(count + 1).padStart(6, '0');
  return `PIUE-${year}-${seq}`;
}

// ==================== SERVICE ====================

export const eventService = {
  // ── Crear evento ──────────────────────────────────────────────────────────
  async createEvent(clientId: string, payload: {
    name: string;
    description?: string;
    location?: string;
    locationLat?: number;
    locationLng?: number;
    notes?: string;
    eventDate?: Date;
  }) {
    const code = await generateEventCode();
    const event = await prisma.event.create({
      data: {
        code,
        clientId,
        name: payload.name,
        description: payload.description,
        location: payload.location,
        locationLat: payload.locationLat,
        locationLng: payload.locationLng,
        notes: payload.notes,
        eventDate: payload.eventDate,
        status: EventStatus.DRAFT,
      },
    });
    logger.info(`Event created | code=${code}`, 'EVENT_SERVICE', { clientId, eventId: event.id });
    return event;
  },

  // ── Listar eventos del cliente ────────────────────────────────────────────
  async getClientEvents(clientId: string) {
    const events = await prisma.event.findMany({
      where: { clientId },
      include: {
        bookings: {
          select: {
            id: true,
            code: true,
            artistId: true,
            serviceId: true,
            scheduledDate: true,
            status: true,
            totalPrice: true,
            currency: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return events;
  },

  // ── Obtener evento por ID ─────────────────────────────────────────────────
  async getEvent(eventId: string, clientId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, clientId },
      include: {
        bookings: {
          where: { deletedAt: null },
          orderBy: { scheduledDate: 'asc' },
        },
      },
    });
    return event;
  },

  // ── Actualizar evento ─────────────────────────────────────────────────────
  async updateEvent(eventId: string, clientId: string, payload: {
    name?: string;
    description?: string;
    location?: string;
    locationLat?: number;
    locationLng?: number;
    notes?: string;
    eventDate?: Date;
  }) {
    const event = await prisma.event.findFirst({ where: { id: eventId, clientId } });
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.status === EventStatus.CANCELLED) throw new Error('EVENT_CANCELLED');

    return prisma.event.update({
      where: { id: eventId },
      data: payload,
    });
  },

  // ── Cancelar evento ───────────────────────────────────────────────────────
  async cancelEvent(eventId: string, clientId: string, cancelBookings: boolean) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, clientId },
      include: { bookings: { where: { deletedAt: null } } },
    });
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.status === EventStatus.CANCELLED) throw new Error('EVENT_ALREADY_CANCELLED');

    // Cancelar bookings si se solicitó
    if (cancelBookings) {
      const cancellableStatuses: BookingStatus[] = [
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.PAYMENT_PENDING,
      ];
      const bookingIds = event.bookings
        .filter((b) => cancellableStatuses.includes(b.status))
        .map((b) => b.id);

      if (bookingIds.length > 0) {
        await prisma.booking.updateMany({
          where: { id: { in: bookingIds } },
          data: {
            status: BookingStatus.CANCELLED_CLIENT,
            cancelledAt: new Date(),
            cancelledBy: clientId,
            cancellationReason: `Evento cancelado (${event.code})`,
          },
        });
        logger.info(`Cancelled ${bookingIds.length} bookings for event ${event.code}`, 'EVENT_SERVICE');
      }
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: { status: EventStatus.CANCELLED },
    });
    return updated;
  },

  // ── Agregar booking existente al evento ───────────────────────────────────
  async addBookingToEvent(eventId: string, bookingId: string, clientId: string) {
    const event = await prisma.event.findFirst({ where: { id: eventId, clientId } });
    if (!event) throw new Error('EVENT_NOT_FOUND');
    if (event.status === EventStatus.CANCELLED) throw new Error('EVENT_CANCELLED');

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, clientId },
    });
    if (!booking) throw new Error('BOOKING_NOT_FOUND');
    if (booking.eventId) throw new Error('BOOKING_ALREADY_IN_EVENT');
    if (booking.status !== BookingStatus.PENDING) throw new Error('BOOKING_NOT_PENDING');

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { eventId },
    });

    // Activar el evento si estaba en DRAFT
    if (event.status === EventStatus.DRAFT) {
      await prisma.event.update({
        where: { id: eventId },
        data: { status: EventStatus.ACTIVE },
      });
    }

    return updated;
  },

  // ── Quitar booking del evento ─────────────────────────────────────────────
  async removeBookingFromEvent(eventId: string, bookingId: string, clientId: string) {
    const event = await prisma.event.findFirst({ where: { id: eventId, clientId } });
    if (!event) throw new Error('EVENT_NOT_FOUND');

    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, eventId, clientId },
    });
    if (!booking) throw new Error('BOOKING_NOT_IN_EVENT');

    return prisma.booking.update({
      where: { id: bookingId },
      data: { eventId: null },
    });
  },

  // ── Desglose del evento ───────────────────────────────────────────────────
  async getEventBreakdown(eventId: string, clientId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, clientId },
      include: {
        bookings: {
          where: {
            deletedAt: null,
            status: {
              notIn: [BookingStatus.CANCELLED_CLIENT, BookingStatus.CANCELLED_ARTIST, BookingStatus.REJECTED],
            },
          },
          orderBy: { scheduledDate: 'asc' },
        },
      },
    });
    if (!event) throw new Error('EVENT_NOT_FOUND');

    const bookingTotals = event.bookings.map((b) => ({
      bookingId: b.id,
      code: b.code,
      artistId: b.artistId,
      serviceId: b.serviceId,
      scheduledDate: b.scheduledDate,
      status: b.status,
      totalPrice: b.totalPrice,
      currency: b.currency,
    }));

    const grandTotal = bookingTotals.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
    const currency = event.bookings[0]?.currency || 'USD';

    return {
      eventId: event.id,
      eventCode: event.code,
      eventName: event.name,
      bookings: bookingTotals,
      grandTotalCents: grandTotal,
      currency,
    };
  },
};
