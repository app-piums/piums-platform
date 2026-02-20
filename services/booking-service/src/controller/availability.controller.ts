import { Request, Response } from 'express';
import { 
  checkReservationConflict, 
  getArtistReservations 
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

    const reservations = await getArtistReservations(artistId, start, end);

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
