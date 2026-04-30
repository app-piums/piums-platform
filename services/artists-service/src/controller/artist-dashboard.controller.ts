import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ArtistsService } from "../services/artists.service";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { bookingServiceClient } from "../clients/booking.client";
import { paymentsServiceClient } from "../clients/payments.client";
import { usersClient } from "../clients/users.client";
import { availabilitySchema } from "../schemas/artists.schema";

const artistsService = new ArtistsService();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || '';

async function syncAvatarToAuthService(authId: string, avatarUrl: string) {
  try {
    await fetch(`${AUTH_SERVICE_URL}/internal/users/${authId}/avatar`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': INTERNAL_SECRET,
      },
      body: JSON.stringify({ avatarUrl }),
    });
  } catch (err: any) {
    logger.warn('Could not sync avatar to auth-service', 'ARTIST_DASHBOARD', { authId, error: err.message });
  }
}

/**
 * GET /api/artists/me - Obtener mi perfil de artista (simplificado para dashboard)
 */
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, "No autenticado");
    }

    const artist = await artistsService.getArtistByAuthId(authId);
    res.json({ artist });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/artists/me - Actualizar mi perfil
 */
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, "No autenticado");
    }

    const artist = await artistsService.getArtistByAuthId(authId);

    // Allowlist: only permit safe fields to prevent mass-assignment
    const ALLOWED_FIELDS = [
      'bio', 'displayName', 'nombre', 'phone', 'location', 'cityId',
      'category', 'socialLinks', 'imageUrl', 'basePrice', 'experienceYears',
      'availability', 'languages', 'tags', 'portfolioItems', 'avatar', 'coverPhoto',
      'instagram', 'facebook', 'youtube', 'tiktok', 'website',
    ];
    const safeBody = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => ALLOWED_FIELDS.includes(k))
    );

    const updatedArtist = await artistsService.updateArtist(artist.id, safeBody);

    // If avatar was updated, sync to auth-service so web reads the latest
    if (safeBody.avatar && typeof safeBody.avatar === 'string') {
      syncAvatarToAuthService(authId, safeBody.avatar);
    }

    logger.info("Perfil actualizado desde dashboard", "ARTIST_DASHBOARD", { artistId: artist.id });
    res.json({ artist: updatedArtist, message: "Perfil actualizado exitosamente" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists/me/bookings - Obtener reservas recibidas
 */
export const getMyBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, "No autenticado");
    }

    const artist = await artistsService.getArtistByAuthId(authId);
    
    // Query params para filtros
    const status = req.query.status as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Llamar al booking-service para obtener las reservas del artista
    const authToken = req.headers.authorization?.substring(7);
    const bookingsData = await bookingServiceClient.getArtistBookings({
      artistId: artist.id,
      status,
      page,
      limit,
      authToken,
    });

    // Enrich bookings with client name/email from users-service in parallel
    const enrichedBookings = await Promise.all(
      bookingsData.bookings.map(async (booking) => {
        const user = await usersClient.getUser(booking.clientId, authToken);
        if (!user) return booking;
        const parts = [user.firstName, user.lastName].filter(Boolean);
        const clientName = parts.length > 0
          ? parts.join(' ')
          : user.fullName || user.nombre || undefined;
        return {
          ...booking,
          clientName: clientName || undefined,
          clientEmail: user.email || undefined,
          clientAvatar: user.avatar || undefined,
        };
      })
    );

    logger.info("Artist bookings retrieved", "ARTIST_DASHBOARD", {
      artistId: artist.id,
      count: bookingsData.total,
    });

    res.json({
      bookings: enrichedBookings,
      total: bookingsData.total,
      page: bookingsData.page,
      totalPages: bookingsData.totalPages,
      artistId: artist.id,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/artists/me/bookings/:id/accept - Aceptar reserva
 */
export const acceptBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, "No autenticado");
    }
    const artist = await artistsService.getArtistByAuthId(authId);
    const bookingId = req.params.id as string;
    const authToken = req.headers.authorization?.substring(7);
    const success = await bookingServiceClient.confirmBooking(bookingId, artist.id, authToken);
    
    if (!success) {
      throw new AppError(500, "Error al aceptar la reserva");
    }

    logger.info("Reserva aceptada", "ARTIST_DASHBOARD", { artistId: artist.id, bookingId });
    res.json({ 
      message: "Reserva aceptada exitosamente",
      bookingId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/artists/me/bookings/:id/decline - Rechazar reserva
 */
export const declineBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, "No autenticado");
    }

    const artist = await artistsService.getArtistByAuthId(authId);
    const bookingId = req.params.id as string;
    const reason = req.body.reason as string | undefined;
    const authToken = req.headers.authorization?.substring(7);
    // TODO: Llamar al booking-service para rechazar la reserva
    const success = await bookingServiceClient.rejectBooking(
      bookingId,
      artist.id,
      reason || "Sin razón especificada",
      authToken
    );

    if (!success) {
      throw new AppError(500, "Error al rechazar la reserva");
    }
    // TODO: Llamar al booking-service para rechazar la reserva
    // Verificar que la reserva pertenezca al artista
    // Cambiar status a CANCELLED con reason

    logger.info("Reserva rechazada", "ARTIST_DASHBOARD", { artistId: artist.id, bookingId, reason });
    res.json({ 
      message: "Reserva rechazada",
      bookingId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/artists/me/bookings/:id/complete - Marcar reserva como completada
 */
export const completeBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, "No autenticado");
    }
    const artist = await artistsService.getArtistByAuthId(authId);
    const bookingId = req.params.id as string;
    const authToken = req.headers.authorization?.substring(7);
    const success = await bookingServiceClient.completeBooking(bookingId, artist.id, authToken);

    if (!success) {
      throw new AppError(500, "Error al completar la reserva");
    }

    logger.info("Reserva completada", "ARTIST_DASHBOARD", { artistId: artist.id, bookingId });
    res.json({
      message: "Reserva marcada como completada",
      bookingId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/artists/dashboard/me/bookings/:id/cancel - Cancelar reserva como artista
 */
export const cancelBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, "No autenticado");
    }
    const artist = await artistsService.getArtistByAuthId(authId);
    const bookingId = req.params.id as string;
    const { reason } = req.body as { reason?: string };
    if (!reason || reason.trim().length < 10) {
      throw new AppError(400, "La razón debe tener al menos 10 caracteres");
    }
    const authToken = req.headers.authorization?.substring(7);
    const success = await bookingServiceClient.cancelBooking(bookingId, artist.id, reason.trim(), authToken);

    if (!success) {
      throw new AppError(500, "Error al cancelar la reserva");
    }

    logger.info("Reserva cancelada", "ARTIST_DASHBOARD", { artistId: artist.id, bookingId });
    res.json({
      message: "Reserva cancelada",
      bookingId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists/dashboard/me/stats - Obtener estadísticas del artista
 */
export const getMyStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) {
      throw new AppError(401, "No autenticado");
    }
    // Obtener datos de booking-service y payments-service en paralelo
    const artist = await artistsService.getArtistByAuthId(authId);
    const [bookingStats, paymentStats] = await Promise.all([
      bookingServiceClient.getArtistStats(artist.id),
      paymentsServiceClient.getArtistPaymentStats(artist.id),
    ]);

    const stats = {
      artistId: artist.id,
      bookings: {
        total: bookingStats.total,
        thisMonth: bookingStats.thisMonth,
        pending: bookingStats.pending,
        confirmed: bookingStats.confirmed,
        completed: bookingStats.completed,
      },
      revenue: {
        total: paymentStats.totalRevenue,
        thisMonth: paymentStats.thisMonthRevenue,
        currency: paymentStats.currency,
      },
      rating: {
        average: artist.rating || 0,
        totalReviews: artist.reviewCount || 0,
      },
      upcomingBookings: bookingStats.upcoming || [],
    };

    logger.info("Artist stats retrieved", "ARTIST_DASHBOARD", {
      artistId: artist.id,
      totalBookings: bookingStats.total,
      totalRevenue: paymentStats.totalRevenue,
    });

    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists/dashboard/me/availability - Obtener disponibilidad semanal del artista autenticado
 */
export const getMyAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");
    const artist = await artistsService.getArtistByAuthId(authId);
    const availability = await artistsService.getAvailability(artist.id);
    res.json({ availability });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/artists/dashboard/me/availability - Guardar disponibilidad semanal
 * Acepta un array de { dayOfWeek, startTime, endTime }
 * dayOfWeek puede venir como "Lunes", "lunes" o "LUNES" — se normaliza aquí.
 */
const DAY_MAP: Record<string, string> = {
  lunes: 'LUNES', martes: 'MARTES', miercoles: 'MIERCOLES', miércoles: 'MIERCOLES',
  jueves: 'JUEVES', viernes: 'VIERNES', sabado: 'SABADO', sábado: 'SABADO',
  domingo: 'DOMINGO',
};

export const setMyAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");
    const artist = await artistsService.getArtistByAuthId(authId);

    const rawItems: any[] = req.body.availability ?? req.body;
    if (!Array.isArray(rawItems)) {
      throw new AppError(400, "Se esperaba un array de disponibilidad");
    }

    const normalized = rawItems.map((item: any) => {
      const rawDay: string = String(item.dayOfWeek ?? '');
      const dayOfWeek = DAY_MAP[rawDay.toLowerCase()] ?? rawDay.toUpperCase();
      return availabilitySchema.parse({ dayOfWeek, startTime: item.startTime, endTime: item.endTime });
    });

    const availability = await artistsService.setAvailability(artist.id, normalized);

    logger.info("Disponibilidad actualizada desde dashboard", "ARTIST_DASHBOARD", {
      artistId: artist.id,
      days: normalized.map(d => d.dayOfWeek),
    });

    res.json({ availability, message: "Disponibilidad configurada" });
  } catch (error) {
    next(error);
  }
};
