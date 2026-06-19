import { Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../middleware/auth.middleware";
import { ArtistsService } from "../services/artists.service";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { triggerArtistReindex as triggerReindex } from "../utils/searchReindex";
import { z } from "zod";

const artistsService = new ArtistsService();

const updateGeoCountrySchema = z.object({
  country: z
    .string()
    .regex(
      /^[A-Z]{2}$/,
      "El código de país debe ser de 2 letras en mayúscula (ISO 3166-1 alpha-2)"
    )
    .nullable(),
});

/**
 * PATCH /api/artists/dashboard/me/geo-country
 * Actualiza el país de ubicación en tiempo real del artista (GPS).
 * Llamado por el cliente web cuando detecta que el artista está fuera de su país de origen.
 * country = null → limpia la geolocalización (artista de vuelta en casa)
 */
export const updateGeoCountry = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const parsed = updateGeoCountrySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.errors[0]?.message ?? "Datos inválidos");
    }
    const { country } = parsed.data;

    const artist = await artistsService.getArtistByAuthId(authId);

    await prisma.artist.update({
      where: { id: artist.id },
      data: {
        geoCountry: country,
        geoCountryUpdatedAt: country ? new Date() : null,
      },
    });

    logger.info("País de ubicación actualizado", "GEO", {
      artistId: artist.id,
      country,
    });

    // Trigger async re-index so search results reflect new visibility immediately
    triggerReindex(artist.id);

    res.json({ message: "Ubicación actualizada", country });
  } catch (error) {
    next(error);
  }
};
