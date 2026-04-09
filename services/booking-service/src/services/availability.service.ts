import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Guatemala is UTC-6 with no DST. Convert a UTC Date to its GT local date string (YYYY-MM-DD).
const GT_OFFSET_MS = -6 * 60 * 60 * 1000;
function toGTDateStr(utcDate: Date): string {
  const local = new Date(utcDate.getTime() + GT_OFFSET_MS);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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

/**
 * Obtiene días ocupados de un mes específico para el calendario
 * Retorna array de fechas (YYYY-MM-DD) que tienen reservas
 */
export const getMonthlyCalendar = async (
  artistId: string,
  year: number,
  month: number
): Promise<{
  occupiedDates: string[];
  blockedDates: string[];
}> => {
  // Construir rango del mes
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Obtener reservas confirmadas
  const reservations = await prisma.availabilityReservation.findMany({
    where: {
      artistId,
      OR: [
        { startAt: { gte: startDate, lte: endDate } },
        { endAt: { gte: startDate, lte: endDate } },
        {
          startAt: { lte: startDate },
          endAt: { gte: endDate },
        },
      ],
    },
    select: {
      startAt: true,
      endAt: true,
    },
  });

  // Obtener slots bloqueados por el artista
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      artistId,
      deletedAt: null,
      OR: [
        { startTime: { gte: startDate, lte: endDate } },
        { endTime: { gte: startDate, lte: endDate } },
        {
          startTime: { lte: startDate },
          endTime: { gte: endDate },
        },
      ],
    },
    select: {
      startTime: true,
      endTime: true,
    },
  });

  // Convertir a fechas únicas (YYYY-MM-DD)
  const occupiedDatesSet = new Set<string>();
  const blockedDatesSet = new Set<string>();

  reservations.forEach((res) => {
    const current = new Date(res.startAt);
    const end = new Date(res.endAt);
    while (current <= end) {
      occupiedDatesSet.add(toGTDateStr(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
  });

  blockedSlots.forEach((slot) => {
    const current = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    while (current <= end) {
      blockedDatesSet.add(toGTDateStr(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
  });

  return {
    occupiedDates: Array.from(occupiedDatesSet),
    blockedDates: Array.from(blockedDatesSet),
  };
};

/**
 * Obtiene los time slots disponibles para un día específico
 * Retorna slots de 1 hora desde las 8am hasta las 8pm
 */
export const getDailyTimeSlots = async (
  artistId: string,
  date: Date
): Promise<{
  date: string;
  slots: Array<{
    time: string; // HH:mm format (24h)
    available: boolean;
    startTime: Date;
    endTime: Date;
  }>;
}> => {
  // Normalizar fecha a inicio del día
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Obtener reservas del día
  const reservations = await prisma.availabilityReservation.findMany({
    where: {
      artistId,
      OR: [
        {
          startAt: { gte: startOfDay, lte: endOfDay },
        },
        {
          endAt: { gte: startOfDay, lte: endOfDay },
        },
        {
          startAt: { lte: startOfDay },
          endAt: { gte: endOfDay },
        },
      ],
    },
  });

  // Obtener slots bloqueados
  const blockedSlots = await prisma.blockedSlot.findMany({
    where: {
      artistId,
      deletedAt: null,
      OR: [
        {
          startTime: { gte: startOfDay, lte: endOfDay },
        },
        {
          endTime: { gte: startOfDay, lte: endOfDay },
        },
        {
          startTime: { lte: startOfDay },
          endTime: { gte: endOfDay },
        },
      ],
    },
  });

  // Generar slots de 1 hora desde 8am a 8pm
  const slots = [];
  for (let hour = 8; hour <= 20; hour++) {
    const slotStart = new Date(startOfDay);
    slotStart.setHours(hour, 0, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);

    // Verificar si el slot está ocupado
    let available = true;

    // Verificar reservas
    for (const res of reservations) {
      if (
        (slotStart >= res.startAt && slotStart < res.endAt) ||
        (slotEnd > res.startAt && slotEnd <= res.endAt) ||
        (slotStart <= res.startAt && slotEnd >= res.endAt)
      ) {
        available = false;
        break;
      }
    }

    // Verificar bloqueados
    if (available) {
      for (const blocked of blockedSlots) {
        if (
          (slotStart >= blocked.startTime && slotStart < blocked.endTime) ||
          (slotEnd > blocked.startTime && slotEnd <= blocked.endTime) ||
          (slotStart <= blocked.startTime && slotEnd >= blocked.endTime)
        ) {
          available = false;
          break;
        }
      }
    }

    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      available,
      startTime: slotStart,
      endTime: slotEnd,
    });
  }

  return {
    date: toGTDateStr(date),
    slots,
  };
};
