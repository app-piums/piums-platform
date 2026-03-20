import { Request, Response } from 'express';
import { 
  checkReservationConflict, 
  getArtistReservations,
  getMonthlyCalendar,
  getDailyTimeSlots,
} from '../services/availability.service';

/**
 * GET /api/availability/check-reservation
 * Verifica si hay una reserva confirmada que se solape con el rango dado
 */
export const checkReservation = async (req: Request, res: Response) => {
  try {
    const { artistId, startAt, endAt } = req.query;

    if (!artistId || !startAt || !endAt) {
      return res.status(400).json({
        error: 'Missing required parameters: artistId, startAt, endAt',
      });
    }

    const startDate = new Date(startAt as string);
    const endDate = new Date(endAt as string);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format for startAt or endAt',
      });
    }

    const result = await checkReservationConflict(
      artistId as string,
      startDate,
      endDate
    );

    return res.json(result);
  } catch (error) {
    console.error('Error checking reservation:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * GET /api/availability/artist/:artistId
 * Obtiene todas las reservas de un artista en un rango de fechas
 */
export const getArtistAvailability = async (req: Request, res: Response) => {
  try {
    const { artistId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Missing required parameters: startDate, endDate',
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
      });
    }

    const reservations = await getArtistReservations(artistId as string, start, end);

    return res.json({
      artistId,
      startDate: start,
      endDate: end,
      reservations,
      count: reservations.length,
    });
  } catch (error) {
    console.error('Error getting artist reservations:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * GET /api/availability/calendar
 * Obtiene días ocupados y bloqueados para un mes específico
 */
export const getCalendar = async (req: Request, res: Response) => {
  try {
    const { artistId, year, month } = req.query;

    if (!artistId || !year || !month) {
      return res.status(400).json({
        error: 'Missing required parameters: artistId, year, month',
      });
    }

    const yearNum = parseInt(year as string);
    const monthNum = parseInt(month as string);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        error: 'Invalid year or month',
      });
    }

    const calendar = await getMonthlyCalendar(artistId as string, yearNum, monthNum);

    return res.json({
      artistId,
      year: yearNum,
      month: monthNum,
      ...calendar,
    });
  } catch (error) {
    console.error('Error getting calendar:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};

/**
 * GET /api/availability/time-slots
 * Obtiene slots de tiempo disponibles para una fecha específica
 */
export const getTimeSlots = async (req: Request, res: Response) => {
  try {
    const { artistId, date } = req.query;

    if (!artistId || !date) {
      return res.status(400).json({
        error: 'Missing required parameters: artistId, date',
      });
    }

    const targetDate = new Date(date as string);

    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        error: 'Invalid date format',
      });
    }

    const timeSlots = await getDailyTimeSlots(artistId as string, targetDate);

    return res.json({
      artistId,
      ...timeSlots,
    });
  } catch (error) {
    console.error('Error getting time slots:', error);
    return res.status(500).json({
      error: 'Internal server error',
    });
  }
};
