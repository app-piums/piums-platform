import { Router, Request, Response, NextFunction, RequestHandler } from "express";
import { authenticateToken, requireActiveSession } from "../middleware/auth.middleware";
import { uploadVideo, handleVideoMulterError } from "../middleware/upload.middleware";
import {
  getMyProfile,
  updateMyProfile,
  getMyBookings,
  acceptBooking,
  declineBooking,
  completeBooking,
  cancelBooking,
  getMyStats,
  getMyAvailability,
  setMyAvailability,
  uploadStoryVideo,
  deleteStoryVideo,
  uploadPortfolioVideo,
} from "../controller/artist-dashboard.controller";
import {
  getAbsences,
  createAbsence,
  deleteAbsence,
} from "../controller/absence.controller";
import { updateGeoCountry } from "../controller/geo.controller";
import { ArtistsService } from "../services/artists.service";
import { paymentsServiceClient } from "../clients/payments.client";

const artistsService = new ArtistsService();

const router: import("express").Router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Perfil del artista
router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);

// Video presentación ("historia") — un único clip de 30s, subir/reemplazar/eliminar
router.post(
  "/me/story-video",
  requireActiveSession,
  // Cast necesario: @types/multer se resuelve contra @types/express v4 mientras
  // este servicio usa v5. Sin efecto en runtime.
  uploadVideo.single("video") as unknown as RequestHandler,
  handleVideoMulterError,
  uploadStoryVideo
);
router.delete("/me/story-video", requireActiveSession, deleteStoryVideo);

// Video de portafolio — hasta 3 clips de 45s. El borrado va por la ruta existente
// DELETE /artists/:id/portfolio/:itemId, que ahora limpia el asset de Cloudinary.
router.post(
  "/me/portfolio-video",
  requireActiveSession,
  uploadVideo.single("video") as unknown as RequestHandler,
  handleVideoMulterError,
  uploadPortfolioVideo
);

// Reservas
router.get("/me/bookings", getMyBookings);
router.patch("/me/bookings/:id/accept", acceptBooking);
router.patch("/me/bookings/:id/decline", declineBooking);
router.patch("/me/bookings/:id/complete", completeBooking);
router.post("/me/bookings/:id/cancel", cancelBooking);

// Estadísticas
router.get("/me/stats", getMyStats);

// Disponibilidad semanal
router.get("/me/availability", getMyAvailability);
router.post("/me/availability", setMyAvailability);

// Ausencias / Viajes
router.get("/me/absences", getAbsences);
router.post("/me/absences", createAbsence);
router.delete("/me/absences/:id", deleteAbsence);

// Geolocalización en tiempo real
router.patch("/me/geo-country", updateGeoCountry);

// ==================== PAGOS / PAYOUTS ====================

router.get("/me/payouts", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authId = (req as any).user?.id;
    if (!authId) return res.status(401).json({ error: "No autorizado" });

    const artist = await artistsService.getArtistByAuthId(authId);
    if (!artist) return res.status(404).json({ error: "Perfil de artista no encontrado" });

    const page = parseInt(String(req.query["page"] || "1"), 10);
    const limit = parseInt(String(req.query["limit"] || "20"), 10);
    const status = req.query["status"] as string | undefined;

    const result = await paymentsServiceClient.getArtistPayouts(artist.id, { page, limit, status });
    return res.json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
});

router.get("/me/payouts/stats", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authId = (req as any).user?.id;
    if (!authId) return res.status(401).json({ error: "No autorizado" });

    const artist = await artistsService.getArtistByAuthId(authId);
    if (!artist) return res.status(404).json({ error: "Perfil de artista no encontrado" });

    const stats = await paymentsServiceClient.getArtistPayoutStats(artist.id);
    return res.json({ success: true, data: stats });
  } catch (err) {
    return next(err);
  }
});

export default router;
