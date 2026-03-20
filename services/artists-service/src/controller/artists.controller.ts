import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ArtistsService } from "../services/artists.service";
import {
  createArtistSchema,
  updateArtistSchema,
  portfolioItemSchema,
  certificationSchema,
  availabilitySchema,
  searchArtistsSchema,
} from "../schemas/artists.schema";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const artistsService = new ArtistsService();

/**
 * POST /api/artists - Crear perfil de artista
 */
export const createArtist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = createArtistSchema.parse(req.body);
    const artist = await artistsService.createArtist(validatedData);

    res.status(201).json({ 
      artist,
      message: "Perfil de artista creado. Pendiente de verificación." 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists/:id - Obtener perfil público de artista
 */
export const getArtistProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const artist = await artistsService.getArtistById(id);

    res.json({ artist });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists/me - Obtener mi perfil de artista
 */
export const getMyArtistProfile = async (
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
 * PUT /api/artists/:id - Actualizar perfil de artista
 */
export const updateArtistProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const validatedData = updateArtistSchema.parse(req.body);

    const artist = await artistsService.updateArtist(id, validatedData);

    logger.info("Perfil de artista actualizado", "ARTISTS_CONTROLLER", { artistId: id });
    res.json({ artist, message: "Perfil actualizado exitosamente" });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/artists/:id - Eliminar perfil de artista
 */
export const deleteArtistProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const result = await artistsService.deleteArtist(id);

    logger.info("Perfil de artista eliminado", "ARTISTS_CONTROLLER", { artistId: id });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists/search - Buscar artistas
 */
export const searchArtists = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = searchArtistsSchema.parse({
      ...req.query,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      lat: req.query.lat ? Number(req.query.lat) : undefined,
      lng: req.query.lng ? Number(req.query.lng) : undefined,
      radius: req.query.radius ? Number(req.query.radius) : undefined,
      minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
    });

    const result = await artistsService.searchArtists(validatedQuery);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists/:id/portfolio - Obtener portfolio
 */
export const getPortfolio = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const artist = await artistsService.getArtistById(id);

    res.json({ portfolio: artist.portfolio });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/artists/:id/portfolio - Agregar item al portfolio
 */
export const addPortfolioItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const validatedData = portfolioItemSchema.parse(req.body);

    const item = await artistsService.addPortfolioItem(id, validatedData);

    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/artists/:id/portfolio/:itemId - Actualizar item del portfolio
 */
export const updatePortfolioItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const itemId = req.params.itemId as string;
    const validatedData = portfolioItemSchema.partial().parse(req.body);

    const item = await artistsService.updatePortfolioItem(itemId, id, validatedData);

    res.json({ item });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/artists/:id/portfolio/:itemId - Eliminar item del portfolio
 */
export const deletePortfolioItem = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const itemId = req.params.itemId as string;

    const result = await artistsService.deletePortfolioItem(itemId, id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/artists/:id/certifications - Agregar certificación
 */
export const addCertification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const validatedData = certificationSchema.parse(req.body);

    const cert = await artistsService.addCertification(id, validatedData);

    res.status(201).json({ certification: cert });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/artists/:id/certifications/:certId - Eliminar certificación
 */
export const deleteCertification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const certId = req.params.certId as string;

    const result = await artistsService.deleteCertification(certId, id);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/artists/:id/availability - Obtener disponibilidad
 */
export const getAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    const availability = await artistsService.getAvailability(id);

    res.json({ availability });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/artists/:id/availability - Configurar disponibilidad
 */
export const setAvailability = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id as string;
    
    // Validar cada item del array
    const validatedData = req.body.map((item: any) => 
      availabilitySchema.parse(item)
    );

    const availability = await artistsService.setAvailability(id, validatedData);

    res.json({ availability, message: "Disponibilidad configurada" });
  } catch (error) {
    next(error);
  }
};
