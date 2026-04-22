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
import { triggerArtistReindex, triggerArtistUnindex } from "../utils/searchReindex";

const prisma = new PrismaClient();
const router = Router();

// ─── Internal service-to-service routes (internal network only) ─────────────
// Validates a shared internal secret header to prevent abuse if accidentally exposed.

router.get("/internal/by-auth/:authId", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { authId } = req.params;
    const artist = await prisma.artist.findUnique({
      where: { authId },
      select: { id: true, authId: true, artistName: true, email: true },
    });
    if (!artist || (artist as any).deletedAt) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    res.json({ id: artist.id, authId: artist.authId, artistName: artist.artistName });
  } catch (error) {
    next(error);
  }
});

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

// Set the verification status of an artist (by authId). Called from
// auth-service after identity documents are submitted. In non-production
// environments we auto-approve; in production this should stay PENDING and
// an admin performs the review.
router.patch("/internal/by-auth/:authId/verification", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { authId } = req.params;
    const { status } = req.body as { status?: 'PENDING' | 'VERIFIED' | 'REJECTED' };
    const existing = await prisma.artist.findUnique({ where: { authId } });
    if (!existing) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    const finalStatus =
      status && ['PENDING', 'VERIFIED', 'REJECTED'].includes(status)
        ? status
        : process.env.NODE_ENV === 'production'
          ? 'PENDING'
          : 'VERIFIED';

    const updated = await prisma.artist.update({
      where: { authId },
      data: {
        verificationStatus: finalStatus as any,
        verifiedAt: finalStatus === 'VERIFIED' ? new Date() : null,
        updatedAt: new Date(),
      },
      select: { id: true, authId: true, verificationStatus: true, verifiedAt: true },
    });
    triggerArtistReindex(updated.id);
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Delete an artist by authId (cascades nothing automatically; child rows use FK cascade in schema).
router.delete("/internal/by-auth/:authId", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { authId } = req.params;
    const existing = await prisma.artist.findUnique({ where: { authId } });
    if (!existing) return res.json({ ok: true, deleted: false });
    await prisma.artist.delete({ where: { authId } });
    triggerArtistUnindex(existing.id);
    res.json({ ok: true, deleted: true, id: existing.id });
  } catch (error) {
    next(error);
  }
});

// Bootstrap a minimal artist profile after Google/Firebase signup.
// Idempotent: returns existing profile if already created.
router.post("/internal/bootstrap", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { authId, email, nombre, avatar } = req.body as {
      authId: string;
      email: string;
      nombre: string;
      avatar?: string;
    };
    if (!authId || !email || !nombre) {
      return res.status(400).json({ error: 'authId, email and nombre required' });
    }

    const existing = await prisma.artist.findUnique({ where: { authId } });
    if (existing) {
      // Backfill missing avatar/nombre from OAuth provider on subsequent logins.
      const patch: any = {};
      if (avatar && !existing.avatar) patch.avatar = avatar;
      if (nombre && (!existing.nombre || existing.nombre === existing.email)) patch.nombre = nombre;
      if (Object.keys(patch).length > 0) {
        await prisma.artist.update({ where: { authId }, data: patch });
        triggerArtistReindex(existing.id);
      }
      return res.json({ id: existing.id, authId: existing.authId, created: false });
    }

    const artist = await prisma.artist.create({
      data: {
        authId,
        email,
        nombre,
        avatar: avatar ?? null,
        category: 'OTRO',
        country: 'GT',
        city: 'Guatemala',
        verificationStatus: 'PENDING',
        isActive: true,
      },
      select: { id: true, authId: true },
    });
    triggerArtistReindex(artist.id);
    return res.status(201).json({ id: artist.id, authId: artist.authId, created: true });
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
