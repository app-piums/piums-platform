import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { eventService } from '../services/event.service';
import { logger } from '../utils/logger';

// ==================== SCHEMAS ====================

const createEventSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(2000).optional(),
  eventDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
});

const updateEventSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  notes: z.string().max(2000).optional(),
  eventDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
});

const cancelEventSchema = z.object({
  cancelBookings: z.boolean().default(false),
});

const addBookingSchema = z.object({
  bookingId: z.string().uuid(),
});

// ==================== CONTROLLER ====================

export class EventController {
  async createEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!.id;
      const payload = createEventSchema.parse(req.body);
      const event = await eventService.createEvent(clientId, payload);
      res.status(201).json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }

  async getClientEvents(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!.id;
      const events = await eventService.getClientEvents(clientId);
      res.json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  }

  async getEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!.id;
      const id = req.params.id as string;
      const event = await eventService.getEvent(id, clientId);
      if (!event) {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      res.json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }

  async updateEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!.id;
      const id = req.params.id as string;
      const payload = updateEventSchema.parse(req.body);
      const event = await eventService.updateEvent(id, clientId, payload);
      res.json({ success: true, data: event });
    } catch (err: any) {
      if (err.message === 'EVENT_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      if (err.message === 'EVENT_CANCELLED') {
        res.status(400).json({ success: false, message: 'No se puede editar un evento cancelado' });
        return;
      }
      next(err);
    }
  }

  async cancelEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!.id;
      const id = req.params.id as string;
      const { cancelBookings } = cancelEventSchema.parse(req.body);
      const event = await eventService.cancelEvent(id, clientId, cancelBookings);
      res.json({ success: true, data: event });
    } catch (err: any) {
      if (err.message === 'EVENT_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      if (err.message === 'EVENT_ALREADY_CANCELLED') {
        res.status(400).json({ success: false, message: 'El evento ya está cancelado' });
        return;
      }
      next(err);
    }
  }

  async addBookingToEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!.id;
      const id = req.params.id as string;
      const { bookingId } = addBookingSchema.parse(req.body);
      const booking = await eventService.addBookingToEvent(id, bookingId, clientId);
      res.json({ success: true, data: booking });
    } catch (err: any) {
      const errorMap: Record<string, [number, string]> = {
        EVENT_NOT_FOUND: [404, 'Evento no encontrado'],
        EVENT_CANCELLED: [400, 'El evento está cancelado'],
        BOOKING_NOT_FOUND: [404, 'Reserva no encontrada'],
        BOOKING_ALREADY_IN_EVENT: [400, 'La reserva ya pertenece a un evento'],
        BOOKING_NOT_PENDING: [400, 'Solo se pueden agregar reservas en estado PENDIENTE'],
      };
      const mapped = errorMap[err.message];
      if (mapped) {
        res.status(mapped[0]).json({ success: false, message: mapped[1] });
        return;
      }
      next(err);
    }
  }

  async removeBookingFromEvent(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!.id;
      const id = req.params.id as string;
      const bookingId = req.params.bookingId as string;
      await eventService.removeBookingFromEvent(id, bookingId, clientId);
      res.json({ success: true, message: 'Reserva removida del evento' });
    } catch (err: any) {
      const errorMap: Record<string, [number, string]> = {
        EVENT_NOT_FOUND: [404, 'Evento no encontrado'],
        BOOKING_NOT_IN_EVENT: [404, 'La reserva no pertenece a este evento'],
      };
      const mapped = errorMap[err.message];
      if (mapped) {
        res.status(mapped[0]).json({ success: false, message: mapped[1] });
        return;
      }
      next(err);
    }
  }

  async getEventBreakdown(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const clientId = req.user!.id;
      const id = req.params.id as string;
      const breakdown = await eventService.getEventBreakdown(id, clientId);
      res.json({ success: true, data: breakdown });
    } catch (err: any) {
      if (err.message === 'EVENT_NOT_FOUND') {
        res.status(404).json({ success: false, message: 'Evento no encontrado' });
        return;
      }
      next(err);
    }
  }
}

export const eventController = new EventController();
