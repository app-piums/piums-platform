import { Request, Response, NextFunction } from "express";
import { bookingService } from "../services/booking.service";
import { AuthRequest } from "../middleware/auth.middleware";
import { notifyBookingCreated } from "../utils/notifications";
import { generateBookingPDF } from "../utils/pdf";
import {
  createBookingSchema,
  updateBookingSchema,
  changeStatusSchema,
  cancelBookingSchema,
  confirmBookingSchema,
  rejectBookingSchema,
  markPaymentSchema,
  blockSlotSchema,
  availabilityConfigSchema,
  checkAvailabilitySchema,
  searchBookingsSchema,
} from "../schemas/booking.schema";
import { rescheduleBookingSchema } from "../schemas/reschedule.schema";
import { usersClient } from "../clients/users.client";
import { artistsClient } from "../clients/artists.client";
import { catalogClient } from "../clients/catalog.client";

export class BookingController {
  // ==================== RESERVAS ====================

  async createBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = createBookingSchema.parse(req.body);

      // Always use the authenticated user's ID as clientId — never trust the body
      const clientId = req.user!.id;
      
      const { booking } = await bookingService.createBooking({
        ...validatedData,
        clientId,
        scheduledDate: new Date(validatedData.scheduledDate),
      });

      // Obtener datos reales de forma asíncrona para las notificaciones
      Promise.all([
        usersClient.getUser(booking.clientId),
        artistsClient.getArtist(booking.artistId),
        catalogClient.getService(booking.serviceId)
      ]).then(([user, artist, service]) => {
        notifyBookingCreated({
          bookingId: booking.id,
          bookingCode: booking.code || `PIU-${new Date().getFullYear()}-${booking.id.slice(0, 6)}`,
          clientId: booking.clientId,
          clientName: user?.fullName || user?.firstName || 'Cliente',
          clientEmail: user?.email || 'client@example.com',
          artistId: booking.artistId,
          artistName: artist?.artistName || 'Artista',
          artistEmail: artist?.email || 'artist@example.com',
          artistCategory: artist?.category || 'Categoría',
          artistImage: artist?.avatar || '',
          serviceName: service?.name || 'Servicio',
          scheduledDate: booking.scheduledDate.toISOString(),
          durationMinutes: booking.durationMinutes,
          location: booking.location || 'Sin ubicación',
          servicePrice: booking.servicePrice,
          addonsPrice: booking.addonsPrice,
          totalPrice: booking.totalPrice,
          currency: booking.currency,
          depositRequired: booking.depositRequired,
          depositAmount: booking.depositAmount ?? undefined,
          clientNotes: booking.clientNotes ?? undefined,
        }).catch(err => {
          console.error('Error sending booking notifications:', err);
        });
      }).catch(err => {
        console.error('Error fetching data for notifications:', err);
      });

      res.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const booking = await bookingService.getBookingById(id);

      // Verificar permisos: solo cliente, artista o admin pueden ver
      const userId = req.user?.id;
      if (
        userId &&
        booking.clientId !== userId &&
        booking.artistId !== userId
      ) {
        return res.status(403).json({ message: "No tienes permiso para ver esta reserva" });
      }

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async adminGetBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const booking = await bookingService.getBookingById(id);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async getBookingByCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const code = req.params.code as string;
      const booking = await bookingService.getBookingByCode(code);

      // Verificar permisos
      const userId = req.user?.id;
      if (
        userId &&
        booking.clientId !== userId &&
        booking.artistId !== userId
      ) {
        return res.status(403).json({ message: "No tienes permiso para ver esta reserva" });
      }

      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async searchBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const isAdmin = req.user?.role === 'admin';
      const isArtist = req.user?.role === 'artista';

      // Artists filter by artistId only; clients see their own bookings; admins can filter freely
      const clientId = isAdmin
        ? (req.query.clientId as string | undefined)
        : isArtist
          ? undefined
          : userId;

      // Prevent artists from querying other artists' bookings: force artistId to own userId
      const artistId = isArtist
        ? userId
        : isAdmin
          ? (req.query.artistId as string | undefined)
          : undefined;

      const query = {
        clientId,
        artistId,
        serviceId: req.query.serviceId as string | undefined,
        status: req.query.status as any,
        paymentStatus: req.query.paymentStatus as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await bookingService.searchBookings(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;
      
      const validatedData = updateBookingSchema.parse(req.body);
      
      const data: any = { ...validatedData };
      if (data.scheduledDate) {
        data.scheduledDate = new Date(data.scheduledDate);
      }

      const booking = await bookingService.updateBooking(id, userId, data);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async confirmBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { artistNotes } = confirmBookingSchema.parse(req.body);
      
      const artistId = req.user!.id;

      const booking = await bookingService.confirmBooking(id, artistId, artistNotes);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async rejectBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { reason } = rejectBookingSchema.parse(req.body);
      
      const artistId = req.user!.id;

      const booking = await bookingService.rejectBooking(id, artistId, reason);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { reason } = cancelBookingSchema.parse(req.body);

      const userId = req.user!.id;

      const booking = await bookingService.cancelBooking(id, userId, reason);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status, reason } = changeStatusSchema.parse(req.body);
      
      const userId = req.user!.id;

      const booking = await bookingService.changeStatus(id, userId, status, reason);
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  async markPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      // Only admins or internal service calls may mark a booking as paid
      if (req.user?.role !== 'admin') {
        return next(new AppError(403, 'Solo administradores pueden marcar pagos manualmente'));
      }

      const { amount, paymentMethod, paymentIntentId, paymentType } = markPaymentSchema.parse(req.body);

      const booking = await bookingService.markPayment(
        id, 
        amount, 
        paymentMethod,
        paymentIntentId,
        paymentType
      );
      res.json(booking);
    } catch (error) {
      next(error);
    }
  }

  // ==================== DISPONIBILIDAD ====================

  async checkAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistId, startTime, endTime } = req.query;

      if (!artistId || !startTime || !endTime) {
        return res.status(400).json({
          message: "artistId, startTime y endTime son requeridos",
        });
      }

      const isAvailable = await bookingService.checkAvailability(
        artistId as string,
        new Date(startTime as string),
        new Date(endTime as string)
      );

      res.json({ available: isAvailable });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistId, startDate, endDate, durationMinutes } = req.query;

      if (!artistId || !startDate || !endDate) {
        return res.status(400).json({
          message: "artistId, startDate y endDate son requeridos",
        });
      }

      const duration = durationMinutes
        ? parseInt(durationMinutes as string)
        : 60;

      const slots = await bookingService.getAvailableSlots(
        artistId as string,
        new Date(startDate as string),
        new Date(endDate as string),
        duration
      );

      res.json({ slots });
    } catch (error) {
      next(error);
    }
  }

  async getArtistsBusyOnDate(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      if (!date || typeof date !== 'string') {
        return res.status(400).json({ message: 'El parámetro date es requerido (YYYY-MM-DD)' });
      }
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Fecha inválida' });
      }
      const busyArtistIds = await bookingService.getArtistsBusyOnDate(parsed);
      res.json({ busyArtistIds, date });
    } catch (error) {
      next(error);
    }
  }

  // ==================== SLOTS BLOQUEADOS ====================

  async blockSlot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const validatedData = blockSlotSchema.parse(req.body);
      
      const slot = await bookingService.blockSlot({
        ...validatedData,
        startTime: new Date(validatedData.startTime),
        endTime: new Date(validatedData.endTime),
      });

      res.status(201).json(slot);
    } catch (error) {
      next(error);
    }
  }

  async getBlockedSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.artistId as string;
      const { startDate, endDate } = req.query;

      const slots = await bookingService.getBlockedSlots(
        artistId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(slots);
    } catch (error) {
      next(error);
    }
  }

  async unblockSlot(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const artistId = req.user!.id;

      await bookingService.unblockSlot(id, artistId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  // ==================== CONFIGURACIÓN ====================

  async getArtistConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.artistId as string;
      const config = await bookingService.getArtistConfig(artistId);
      res.json(config);
    } catch (error) {
      next(error);
    }
  }

  async updateArtistConfig(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const artistId = req.params.artistId as string;
      const userId = req.user!.id;

      // Verificar que el usuario sea el artista
      if (artistId !== userId) {
        return res.status(403).json({
          message: "No tienes permiso para modificar esta configuración",
        });
      }

      const validatedData = availabilityConfigSchema.parse(req.body);
      const config = await bookingService.updateArtistConfig(artistId, validatedData);

      res.json(config);
    } catch (error) {
      next(error);
    }
  }

  // ==================== ESTADÍSTICAS ====================

  async getBookingStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { artistId, clientId } = req.query;

      // Verificar permisos
      const userId = req.user!.id;
      if (artistId && artistId !== userId && clientId && clientId !== userId) {
        return res.status(403).json({
          message: "No tienes permiso para ver estas estadísticas",
        });
      }

      const stats = await bookingService.getBookingStats(
        artistId as string | undefined,
        clientId as string | undefined
      );

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const stats = await bookingService.getUserStats(userId as string);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getBatchStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { artistIds } = req.body;
      const stats = await bookingService.getBatchStats(artistIds);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getAdminStats(req: Request, res: Response, next: NextFunction) {
    try {
      // TODO: Verificar que el usuario es admin (podría hacerse vía middleware)
      const stats = await bookingService.getAdminStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async adminSearchBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const query = {
        search: req.query.search as string,
        status: req.query.status as any,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      };

      const result = await bookingService.adminSearchBookings(query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Genera y descarga un PDF con los detalles de la reserva
   * GET /api/bookings/:id/pdf
   */
  async downloadBookingPDF(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const booking = await bookingService.getBookingById(id);

      // Verificar permisos: solo cliente, artista o admin pueden descargar
      const userId = req.user?.id;
      if (
        userId &&
        booking.clientId !== userId &&
        booking.artistId !== userId
      ) {
        return res.status(403).json({ message: "No tienes permiso para descargar este PDF" });
      }

      // Obtener datos completos de cliente, artista y servicio
      const [user, artist, service] = await Promise.all([
        usersClient.getUser(booking.clientId),
        artistsClient.getArtist(booking.artistId),
        catalogClient.getService(booking.serviceId)
      ]);

      const bookingData = {
        ...booking,
        clientName: user?.fullName || user?.firstName || 'Cliente',
        artistName: artist?.artistName || 'Artista',
        artistCategory: artist?.category || 'Categoría',
        serviceName: service?.name || 'Servicio',
      };

      // Generar PDF
      const pdfDoc = generateBookingPDF(bookingData);

      // Configurar headers para descarga
      const fileName = `reserva-${booking.code || booking.id.slice(0, 8)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Stream el PDF a la respuesta
      pdfDoc.pipe(res);
      pdfDoc.end();
    } catch (error) {
      next(error);
    }
  }

  // ==================== RESCHEDULE ====================

  async rescheduleBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "No autenticado" });
      }

      const validatedData = rescheduleBookingSchema.parse(req.body);

      const booking = await bookingService.rescheduleBooking(
        id,
        userId,
        validatedData.newDate,
        validatedData.newTime,
        validatedData.reason
      );

      res.json({
        message: "Reserva reprogramada exitosamente",
        booking,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
