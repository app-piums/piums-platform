import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verifica si existe una reserva de disponibilidad que se solape con el rango dado
 */
export const checkReservationConflict = async (
  artistId: string,
  startAt: Date,
  endAt: Date
): Promise<{ hasReservation: boolean; bookingId?: string }> => {
  const reservation = await prisma.availabilityReservation.findFirst({
    where: {
      artistId,
      OR: [
        // La reserva contiene completamente el rango solicitado
        {
          startAt: { lte: startAt },
          endAt: { gte: endAt },
        },
        // La reserva se solapa con el inicio del rango
        {
          startAt: { lte: startAt },
          endAt: { gt: startAt, lte: endAt },
        },
        // La reserva se solapa con el fin del rango
        {
          startAt: { gte: startAt, lt: endAt },
          endAt: { gte: endAt },
        },
        // La reserva está completamente dentro del rango
        {
          startAt: { gte: startAt },
          endAt: { lte: endAt },
        },
      ],
    },
  });

  if (reservation) {
    return {
      hasReservation: true,
      bookingId: reservation.bookingId,
    };
  }

  return { hasReservation: false };
};

/**
 * Crea una reserva de disponibilidad cuando se confirma un booking
 */
export const createAvailabilityReservation = async (data: {
  artistId: string;
  bookingId: string;
  startAt: Date;
  endAt: Date;
}) => {
  return await prisma.availabilityReservation.create({
    data,
  });
};

/**
 * Elimina una reserva de disponibilidad (cuando se cancela un booking)
 */
export const removeAvailabilityReservation = async (bookingId: string) => {
  return await prisma.availabilityReservation.delete({
    where: { bookingId },
  });
};

/**
 * Obtiene todas las reservas de un artista en un rango de fechas
 */
export const getArtistReservations = async (
  artistId: string,
  startDate: Date,
  endDate: Date
) => {
  return await prisma.availabilityReservation.findMany({
    where: {
      artistId,
      OR: [
        {
          startAt: { gte: startDate, lte: endDate },
        },
        {
          endAt: { gte: startDate, lte: endDate },
        },
        {
          startAt: { lte: startDate },
          endAt: { gte: endDate },
        },
      ],
    },
    orderBy: { startAt: 'asc' },
  });
};
