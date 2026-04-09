import { Router } from "express";
import {
  createArtist,
  getArtistProfile,
  getMyArtistProfile,
  updateArtistProfile,
  deleteArtistProfile,
  searchArtists,
  getPortfolio,
  addPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  addCertification,
  deleteCertification,
  getAvailability,
  setAvailability,
} from "../controller/artists.controller";
import { authenticateToken, authorizeArtistOwner } from "../middleware/auth.middleware";
import { createArtistLimiter, updateLimiter, searchLimiter } from "../middleware/rateLimiter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

// ─── Internal service-to-service route (internal network only) ──────────────
// Validates a shared internal secret header to prevent abuse if accidentally exposed.
router.patch("/internal/:id/rating", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { id } = req.params;
    const { rating, reviewCount } = req.body as { rating: number; reviewCount: number };
    await prisma.artist.update({
      where: { id },
      data: { rating, reviewCount, updatedAt: new Date() },
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// Búsqueda pública (con rate limit)
router.get("/search", searchLimiter as any, searchArtists);

// Perfil público
router.get("/:id", getArtistProfile);
router.get("/:id/portfolio", getPortfolio);
router.get("/:id/availability", getAvailability);

// Rutas protegidas - Crear artista
router.post("/", authenticateToken, createArtistLimiter as any, createArtist);

// Rutas protegidas - Mi perfil
router.get("/me/profile", authenticateToken, getMyArtistProfile);

// Rutas protegidas - Actualizar perfil (solo el dueño)
router.put("/:id", authenticateToken, authorizeArtistOwner, updateLimiter as any, updateArtistProfile);
router.delete("/:id", authenticateToken, authorizeArtistOwner, deleteArtistProfile);

// Portfolio (solo el dueño puede modificar)
router.post("/:id/portfolio", authenticateToken, authorizeArtistOwner, addPortfolioItem);
router.put("/:id/portfolio/:itemId", authenticateToken, authorizeArtistOwner, updatePortfolioItem);
router.delete("/:id/portfolio/:itemId", authenticateToken, authorizeArtistOwner, deletePortfolioItem);

// Certificaciones (solo el dueño puede modificar)
router.post("/:id/certifications", authenticateToken, authorizeArtistOwner, addCertification);
router.delete("/:id/certifications/:certId", authenticateToken, authorizeArtistOwner, deleteCertification);

// Disponibilidad (solo el dueño puede modificar)
router.put("/:id/availability", authenticateToken, authorizeArtistOwner, setAvailability);

export default router;
