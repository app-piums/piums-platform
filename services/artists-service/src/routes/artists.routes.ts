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

const router = Router();

// Búsqueda pública (con rate limit)
router.get("/search", searchLimiter, searchArtists);

// Perfil público
router.get("/:id", getArtistProfile);
router.get("/:id/portfolio", getPortfolio);
router.get("/:id/availability", getAvailability);

// Rutas protegidas - Crear artista
router.post("/", authenticateToken, createArtistLimiter, createArtist);

// Rutas protegidas - Mi perfil
router.get("/me/profile", authenticateToken, getMyArtistProfile);

// Rutas protegidas - Actualizar perfil (solo el dueño)
router.put("/:id", authenticateToken, authorizeArtistOwner, updateLimiter, updateArtistProfile);
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
