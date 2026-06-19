import prisma from '../lib/prisma';
import { checkReservationConflict } from './availability.service';
import { searchClient } from '../clients/search.client';
import { notificationsClient } from '../clients/notifications.client';
import { catalogClient } from '../clients/catalog.client';
import { logger } from '../utils/logger';

const HOURS_72 = 72 * 60 * 60 * 1000;
const HOURS_4 = 4 * 60 * 60 * 1000;
const MAX_REPLACEMENTS = 5;

/**
 * Crea el prompt de opt-in para el cliente cuando un artista cancela dentro de 72h.
 * Llamado fire-and-forget desde cancelBooking().
 */
export async function createReplacementPrompt(bookingId: string): Promise<void> {
  try {
    // Idempotencia
    const existing = await prisma.replacementSearch.findUnique({ where: { bookingId } });
    if (existing) return;

    const booking = await (prisma as any).booking.findUnique({
      where: { id: bookingId },
      include: { collaborators: true },
    });

    if (!booking) return;
    if (booking.status !== 'CANCELLED_ARTIST') return;
    if ((booking.collaborators ?? []).length > 0) return; // booking de banda, omitir
    if (booking.scheduledDate.getTime() <= Date.now()) return; // evento ya pasó

    // Obtener categoría y ciudad del servicio original
    const service = await catalogClient.getService(booking.serviceId);
    const category: string | null = service?.categoryId ?? service?.category?.id ?? null;
    const city: string | null = service?.city ?? service?.cityName ?? null;

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h para responder

    await (prisma as any).replacementSearch.create({
      data: {
        bookingId,
        clientId: booking.clientId,
        category,
        city,
        budgetCents: booking.totalPrice,
        scheduledDate: booking.scheduledDate,
        durationMinutes: booking.durationMinutes,
        status: 'AWAITING_CLIENT',
        expiresAt,
      },
    });

    const dateStr = booking.scheduledDate.toLocaleDateString('es-GT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    // Notificar al cliente con el prompt de opt-in (IN_APP + PUSH)
    notificationsClient.sendNotification({
      userId: booking.clientId,
      type: 'REPLACEMENT_OPT_IN_PROMPT',
      channel: 'IN_APP',
      title: '¿Buscamos un artista de reemplazo?',
      message: `Tu artista canceló la reserva del ${dateStr}. Podemos buscarte un artista disponible dentro de tu presupuesto.`,
      data: { bookingId, expiresAt: expiresAt.toISOString() },
      priority: 'urgent',
      category: 'booking',
    }).catch(() => {});

    notificationsClient.sendNotification({
      userId: booking.clientId,
      type: 'REPLACEMENT_OPT_IN_PROMPT',
      channel: 'PUSH',
      title: '¿Buscamos un artista de reemplazo?',
      message: `Podemos encontrar un reemplazo para tu evento del ${dateStr}.`,
      data: { bookingId },
      priority: 'urgent',
      category: 'booking',
    }).catch(() => {});

    logger.info('Replacement prompt creado', 'REPLACEMENT_SERVICE', { bookingId });
  } catch (err: any) {
    logger.error('createReplacementPrompt falló', 'REPLACEMENT_SERVICE', {
      error: err.message,
      bookingId,
    });
  }
}

/**
 * Ejecuta la búsqueda real de artistas de reemplazo.
 * Llamado cuando el cliente acepta el prompt (POST /replacement/accept).
 */
export async function runReplacementSearch(replacementSearchId: string): Promise<void> {
  try {
    const record = await (prisma as any).replacementSearch.findUnique({
      where: { id: replacementSearchId },
    });

    if (!record) return;
    if (record.status !== 'AWAITING_CLIENT') return;
    if (new Date(record.expiresAt) <= new Date()) {
      await (prisma as any).replacementSearch.update({
        where: { id: replacementSearchId },
        data: { status: 'EXPIRED' },
      });
      return;
    }

    // Marcar como en búsqueda
    await (prisma as any).replacementSearch.update({
      where: { id: replacementSearchId },
      data: { status: 'SEARCHING', clientOptedInAt: new Date() },
    });

    // Buscar candidatos
    let candidates = record.category && record.city
      ? await searchClient.findReplacementServices({
          category: record.category,
          city: record.city,
          maxPriceGTQ: record.budgetCents / 100,
          excludeArtistId: await getOriginalArtistId(record.bookingId),
        })
      : [];

    // Filtrar por disponibilidad real
    const endAt = new Date(record.scheduledDate.getTime() + record.durationMinutes * 60_000);
    const availabilityChecks = await Promise.allSettled(
      candidates.map(async (c) => {
        const { hasReservation } = await checkReservationConflict(c.artistId, record.scheduledDate, endAt);
        return hasReservation ? null : c;
      })
    );

    const available = availabilityChecks
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value)
      .sort((a: any, b: any) => b.artistRating - a.artistRating)
      .slice(0, MAX_REPLACEMENTS);

    const now = new Date();
    const newExpiresAt = new Date(now.getTime() + HOURS_4);
    const newStatus = available.length > 0 ? 'NOTIFIED' : 'NO_MATCHES';

    await (prisma as any).replacementSearch.update({
      where: { id: replacementSearchId },
      data: {
        status: newStatus,
        matchedServiceIds: available.map((a: any) => a.serviceId),
        matchedArtistIds: available.map((a: any) => a.artistId),
        expiresAt: newExpiresAt,
        clientNotifiedAt: now,
      },
    });

    const dateStr = record.scheduledDate.toLocaleDateString('es-GT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    if (available.length > 0) {
      // Notificar al cliente con los resultados
      notificationsClient.sendNotification({
        userId: record.clientId,
        type: 'REPLACEMENT_ARTISTS_AVAILABLE',
        channel: 'IN_APP',
        title: `Encontramos ${available.length} artista(s) disponible(s)`,
        message: `Hay ${available.length} artista(s) disponible(s) para tu evento del ${dateStr} dentro de tu presupuesto.`,
        data: {
          bookingId: record.bookingId,
          matchCount: available.length,
          expiresAt: newExpiresAt.toISOString(),
        },
        priority: 'urgent',
        category: 'booking',
      }).catch(() => {});

      notificationsClient.sendNotification({
        userId: record.clientId,
        type: 'REPLACEMENT_ARTISTS_AVAILABLE',
        channel: 'PUSH',
        title: `Encontramos ${available.length} artista(s) disponible(s)`,
        message: `Hay artistas listos para tu evento del ${dateStr}.`,
        data: { bookingId: record.bookingId },
        priority: 'urgent',
        category: 'booking',
      }).catch(() => {});

      // Notificar a los artistas de la oportunidad (sin exponer datos del cliente)
      const searchUrl = `/buscar?${record.category ? `category=${record.category}&` : ''}${record.city ? `city=${encodeURIComponent(record.city)}&` : ''}date=${record.scheduledDate.toISOString().slice(0, 10)}`;

      await (prisma as any).replacementSearch.update({
        where: { id: replacementSearchId },
        data: { artistsNotifiedAt: now },
      });

      for (const artist of available) {
        notificationsClient.sendNotification({
          userId: artist.artistId,
          type: 'BOOKING_OPPORTUNITY',
          channel: 'IN_APP',
          title: 'Nueva oportunidad de reserva urgente',
          message: `Un cliente necesita un artista para el ${dateStr}${record.city ? ` en ${record.city}` : ''}.`,
          data: {
            opportunityDate: record.scheduledDate.toISOString(),
            city: record.city,
            durationMinutes: record.durationMinutes,
            expiresAt: newExpiresAt.toISOString(),
            searchUrl,
          },
          priority: 'urgent',
          category: 'booking',
        }).catch(() => {});

        notificationsClient.sendNotification({
          userId: artist.artistId,
          type: 'BOOKING_OPPORTUNITY',
          channel: 'PUSH',
          title: 'Oportunidad de reserva urgente',
          message: `Hay un cliente buscando artista para el ${dateStr}.`,
          data: { searchUrl },
          priority: 'urgent',
          category: 'booking',
        }).catch(() => {});
      }
    }

    logger.info('runReplacementSearch completado', 'REPLACEMENT_SERVICE', {
      replacementSearchId,
      matchCount: available.length,
      status: newStatus,
    });
  } catch (err: any) {
    logger.error('runReplacementSearch falló', 'REPLACEMENT_SERVICE', {
      error: err.message,
      replacementSearchId,
    });
  }
}

async function getOriginalArtistId(bookingId: string): Promise<string> {
  const b = await (prisma as any).booking.findUnique({
    where: { id: bookingId },
    select: { artistId: true },
  });
  return b?.artistId ?? '';
}
