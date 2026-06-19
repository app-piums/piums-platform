import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ArtistsService } from "../services/artists.service";
import {
  createBlackout,
  getUpcomingBlackouts,
  removeBlackout,
} from "../services/availability.service";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { triggerArtistReindex as triggerReindex } from "../utils/searchReindex";
import { z } from "zod";

const artistsService = new ArtistsService();

const createAbsenceSchema = z.object({
  startAt: z.string().datetime("Fecha de inicio inválida"),
  endAt: z.string().datetime("Fecha de fin inválida"),
  type: z.enum(["VACATION", "WORKING_ABROAD"]),
  destinationCountry: z.string().min(2).max(10).optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
}).refine((d) => new Date(d.endAt) > new Date(d.startAt), {
  message: "La fecha de fin debe ser posterior a la de inicio",
  path: ["endAt"],
}).refine(
  (d) => d.type !== "WORKING_ABROAD" || !!d.destinationCountry,
  {
    message: "El país destino es obligatorio cuando el tipo es WORKING_ABROAD",
    path: ["destinationCountry"],
  }
);

/**
 * GET /api/artists/dashboard/me/absences
 */
export const getAbsences = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const artist = await artistsService.getArtistByAuthId(authId);
    const absences = await getUpcomingBlackouts(artist.id);

    res.json({ absences });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/artists/dashboard/me/absences
 */
export const createAbsence = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const artist = await artistsService.getArtistByAuthId(authId);

    const body = createAbsenceSchema.parse(req.body);

    const absence = await createBlackout({
      artistId: artist.id,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      type: body.type,
      destinationCountry: body.destinationCountry ?? undefined,
      reason: body.reason ?? undefined,
    });

    logger.info("Ausencia creada", "ABSENCE", {
      artistId: artist.id,
      absenceId: absence.id,
      type: body.type,
    });

    triggerReindex(artist.id);

    res.status(201).json({ absence, message: "Ausencia registrada correctamente" });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/artists/dashboard/me/absences/:id
 */
export const deleteAbsence = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.user?.id;
    if (!authId) throw new AppError(401, "No autenticado");

    const artist = await artistsService.getArtistByAuthId(authId);
    const absenceId = req.params.id as string;

    await removeBlackout(absenceId, artist.id);

    logger.info("Ausencia eliminada", "ABSENCE", {
      artistId: artist.id,
      absenceId,
    });

    triggerReindex(artist.id);

    res.json({ message: "Ausencia eliminada correctamente" });
  } catch (error) {
    next(error);
  }
};
