import { Request, Response } from 'express';
import {
  sendBookingCreatedClientEmail,
  sendBookingCreatedArtistEmail,
  sendBookingConfirmedEmail,
  sendBookingConfirmedArtistEmail,
  sendBookingReminder24hEmail,
  sendBookingReminder2hEmail,
} from '../services/booking-emails.service';
import { logger } from '../utils/logger';

/**
 * POST /api/notifications/booking/created
 * Envía emails al cliente y artista cuando se crea una reserva
 */
export const sendBookingCreatedNotification = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    // Validar datos requeridos
    if (!data.bookingId || !data.clientEmail || !data.artistEmail) {
      return res.status(400).json({
        error: 'Missing required fields: bookingId, clientEmail, artistEmail',
      });
    }
    
    // Enviar email al cliente
    await sendBookingCreatedClientEmail(data);
    
    // Enviar email al artista
    await sendBookingCreatedArtistEmail(data);
    
    return res.json({
      success: true,
      message: 'Booking created notifications sent',
    });
  } catch (error: any) {
    logger.error('Failed to send booking created notifications', 'BOOKING_NOTIFICATIONS', error);
    return res.status(500).json({
      error: 'Failed to send notifications',
      message: error.message,
    });
  }
};

/**
 * POST /api/notifications/booking/confirmed
 * Envía email al cliente y artista cuando el artista confirma la reserva
 */
export const sendBookingConfirmedNotification = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    if (!data.bookingId || !data.clientEmail || !data.artistEmail) {
      return res.status(400).json({
        error: 'Missing required fields: bookingId, clientEmail, artistEmail',
      });
    }
    
    await Promise.all([
      sendBookingConfirmedEmail(data),
      sendBookingConfirmedArtistEmail(data),
    ]);
    
    return res.json({
      success: true,
      message: 'Booking confirmed notifications sent to client and artist',
    });
  } catch (error: any) {
    logger.error('Failed to send booking confirmed notifications', 'BOOKING_NOTIFICATIONS', error);
    return res.status(500).json({
      error: 'Failed to send notifications',
      message: error.message,
    });
  }
};

/**
 * POST /api/notifications/booking/reminder-24h
 * Envía recordatorio 24 horas antes
 */
export const sendBookingReminder24h = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    if (!data.bookingId || !data.clientEmail) {
      return res.status(400).json({
        error: 'Missing required fields: bookingId, clientEmail',
      });
    }
    
    await sendBookingReminder24hEmail(data);
    
    return res.json({
      success: true,
      message: '24h reminder sent',
    });
  } catch (error: any) {
    logger.error('Failed to send 24h reminder', 'BOOKING_NOTIFICATIONS', error);
    return res.status(500).json({
      error: 'Failed to send reminder',
      message: error.message,
    });
  }
};

/**
 * POST /api/notifications/booking/reminder-2h
 * Envía recordatorio 2 horas antes
 */
export const sendBookingReminder2h = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    
    if (!data.bookingId || !data.clientEmail) {
      return res.status(400).json({
        error: 'Missing required fields: bookingId, clientEmail',
      });
    }
    
    await sendBookingReminder2hEmail(data);
    
    return res.json({
      success: true,
      message: '2h reminder sent',
    });
  } catch (error: any) {
    logger.error('Failed to send 2h reminder', 'BOOKING_NOTIFICATIONS', error);
    return res.status(500).json({
      error: 'Failed to send reminder',
      message: error.message,
    });
  }
};
