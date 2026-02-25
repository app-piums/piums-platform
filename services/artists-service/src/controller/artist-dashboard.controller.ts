import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ArtistsService } from "../services/artists.service";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const artistsService = new ArtistsService();

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
    const updatedArtist = await artistsService.updateArtist(artist.id, req.body);

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

    // TODO: Llamar al booking-service para obtener las reservas del artista
    // Por ahora, retornamos una estructura mock
    const bookings: any[] = [];
    const total = 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      bookings,
      total,
      page,
      totalPages,
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
    const bookingId = req.params.id;

    // TODO: Llamar al booking-service para aceptar la reserva
    // Verificar que la reserva pertenezca al artista
    // Cambiar status a CONFIRMED

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
    const bookingId = req.params.id;
    const { reason } = req.body;

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
 * GET /api/artists/me/stats - Obtener estadísticas del artista
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

    const artist = await artistsService.getArtistByAuthId(authId);

    // TODO: Llamar a los diferentes servicios para obtener stats reales
    // - booking-service: total bookings, bookings este mes, próximas reservas
    // - payments-service: ingresos totales, ingresos este mes
    // - reviews-service: rating promedio, total reviews

    const stats = {
      artistId: artist.id,
      bookings: {
        total: 0,
        thisMonth: 0,
        pending: 0,
        confirmed: 0,
        completed: 0,
      },
      revenue: {
        total: 0,
        thisMonth: 0,
        currency: "MXN",
      },
      rating: {
        average: 0,
        totalReviews: 0,
      },
      upcomingBookings: [],
    };

    res.json({ stats });
  } catch (error) {
    next(error);
  }
};
