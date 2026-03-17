import { PrismaClient, DayOfWeek } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:4005';

// Mapeo de número de día a enum DayOfWeek
const DAY_MAP: Record<number, string> = {
  0: 'DOMINGO',
  1: 'LUNES',
  2: 'MARTES',
  3: 'MIERCOLES',
  4: 'JUEVES',
  5: 'VIERNES',
  6: 'SABADO',
};

/**
 * Verifica si un artista está disponible en un rango de tiempo específico
 */
export const checkAvailability = async (
  artistId: string,
  startAt: Date,
  endAt: Date
): Promise<{ available: boolean; reason?: string }> => {
  try {
    // 1. Verificar reglas de disponibilidad regular
    const dayOfWeek = DAY_MAP[startAt.getDay()];
    const startTime = `${startAt.getHours().toString().padStart(2, '0')}:${startAt.getMinutes().toString().padStart(2, '0')}`;
    const endTime = `${endAt.getHours().toString().padStart(2, '0')}:${endAt.getMinutes().toString().padStart(2, '0')}`;

    const availabilityRule = await prisma.artistAvailabilityRule.findFirst({
      where: {
        artistId,
        dayOfWeek: dayOfWeek as DayOfWeek,
        isActive: true,
        startTime: { lte: startTime },
        endTime: { gte: endTime },
      },
    });

    if (!availabilityRule) {
      return {
        available: false,
        reason: 'Artist is not available during this day/time according to their regular schedule',
      };
    }

    // 2. Verificar bloqueos puntuales (blackouts)
    const blackout = await prisma.artistBlackout.findFirst({
      where: {
        artistId,
        OR: [
          // El blackout contiene completamente el rango solicitado
          {
            startAt: { lte: startAt },
            endAt: { gte: endAt },
          },
          // El blackout se solapa con el inicio del rango
          {
            startAt: { lte: startAt },
            endAt: { gt: startAt, lte: endAt },
          },
          // El blackout se solapa con el fin del rango
          {
            startAt: { gte: startAt, lt: endAt },
            endAt: { gte: endAt },
          },
          // El blackout está completamente dentro del rango
          {
            startAt: { gte: startAt },
            endAt: { lte: endAt },
          },
        ],
      },
    });

    if (blackout) {
      return {
        available: false,
        reason: blackout.reason || 'Artist has blocked this time slot',
      };
    }

    // 3. Verificar reservas confirmadas (consultar booking-service)
    try {
      const response = await axios.get(
        `${BOOKING_SERVICE_URL}/api/availability/check-reservation`,
        {
          params: {
            artistId,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
          },
          timeout: 5000,
        }
      );

      if (response.data.hasReservation) {
        return {
          available: false,
          reason: 'Artist already has a confirmed booking during this time',
        };
      }
    } catch (error) {
      console.error('Error checking reservations in booking-service:', error);
      // Si falla la llamada, por seguridad asumimos no disponible
      return {
        available: false,
        reason: 'Unable to verify existing bookings',
      };
    }

    // Si pasó todas las validaciones, está disponible
    return { available: true };
  } catch (error) {
    console.error('Error checking availability:', error);
    throw error;
  }
};

/**
 * Obtiene la disponibilidad semanal de un artista
 */
export const getWeeklyAvailability = async (artistId: string) => {
  const rules = await prisma.artistAvailabilityRule.findMany({
    where: { artistId, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  return rules;
};

/**
 * Crea o actualiza una regla de disponibilidad
 */
export const setAvailabilityRule = async (data: {
  artistId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}) => {
  return await prisma.artistAvailabilityRule.create({
    data,
  });
};

/**
 * Elimina una regla de disponibilidad (soft delete)
 */
export const removeAvailabilityRule = async (ruleId: string) => {
  return await prisma.artistAvailabilityRule.update({
    where: { id: ruleId },
    data: { isActive: false },
  });
};

/**
 * Crea un bloqueo puntual en la agenda
 */
export const createBlackout = async (data: {
  artistId: string;
  startAt: Date;
  endAt: Date;
  reason?: string;
}) => {
  return await prisma.artistBlackout.create({
    data,
  });
};

/**
 * Obtiene todos los bloqueos futuros de un artista
 */
export const getUpcomingBlackouts = async (artistId: string) => {
  return await prisma.artistBlackout.findMany({
    where: {
      artistId,
      endAt: { gte: new Date() },
    },
    orderBy: { startAt: 'asc' },
  });
};

/**
 * Elimina un bloqueo
 */
export const removeBlackout = async (blackoutId: string) => {
  return await prisma.artistBlackout.delete({
    where: { id: blackoutId },
  });
};
