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
const router: import("express").Router = Router();

// ─── Internal service-to-service routes (internal network only) ─────────────
// Validates a shared internal secret header to prevent abuse if accidentally exposed.

// GET /artists/internal/auth-ids?category=MUSICO — returns authIds for admin user filtering
router.get("/internal/auth-ids", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { category } = req.query;
    const where: any = { deletedAt: null };
    if (category) where.category = (category as string).toUpperCase();

    const artists = await prisma.artist.findMany({ where, select: { authId: true } });
    res.json({ authIds: artists.map((a: any) => a.authId) });
  } catch (error) {
    next(error);
  }
});

// GET /artists/internal/stats — returns artist counts by category
router.get("/internal/stats", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const grouped = await prisma.artist.groupBy({
      by: ['category'],
      where: { deletedAt: null },
      _count: { id: true },
    });
    const byCategory: Record<string, number> = {};
    for (const g of grouped) {
      if (g.category) byCategory[g.category] = g._count.id;
    }
    res.json({ byCategory });
  } catch (error) {
    next(error);
  }
});

// POST /artists/internal/by-ids — returns artist info for a list of artist IDs
router.post("/internal/by-ids", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) return res.json({ artists: [] });
    const artists = await prisma.artist.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, authId: true, nombre: true, category: true, avatar: true },
    });
    res.json({ artists });
  } catch (error) {
    next(error);
  }
});

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
      select: { id: true, authId: true, artistName: true, email: true, avatar: true },
    });
    if (!artist || (artist as any).deletedAt) {
      return res.status(404).json({ error: 'Artist not found' });
    }
    res.json({ id: artist.id, authId: artist.authId, artistName: artist.artistName, avatar: (artist as any).avatar });
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

// PATCH /artists/internal/by-auth/:authId/active — activa o desactiva artista (llamado desde admin ban/unban)
router.patch("/internal/by-auth/:authId/active", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { authId } = req.params;
    const { isActive } = req.body as { isActive: boolean };
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive (boolean) requerido' });
    }
    const existing = await prisma.artist.findUnique({ where: { authId } });
    if (!existing) return res.json({ ok: true, updated: false });
    const updated = await prisma.artist.update({
      where: { authId },
      data: { isActive, updatedAt: new Date() },
      select: { id: true, authId: true, isActive: true },
    });
    if (isActive) {
      triggerArtistReindex(updated.id);
    } else {
      triggerArtistUnindex(updated.id);
    }
    res.json({ ok: true, updated: true, ...updated });
  } catch (error) {
    next(error);
  }
});

// PATCH /artists/internal/by-auth/:authId/shadow-ban — shadow ban / unban artista (no-show u otras infracciones)
router.patch("/internal/by-auth/:authId/shadow-ban", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { authId } = req.params;
    const { banned, reason } = req.body as { banned: boolean; reason?: string };
    if (typeof banned !== 'boolean') {
      return res.status(400).json({ error: 'banned (boolean) requerido' });
    }
    const existing = await prisma.artist.findUnique({ where: { authId } });
    if (!existing) return res.status(404).json({ error: 'Artist not found' });

    const updated = await prisma.artist.update({
      where: { authId },
      data: banned
        ? { shadowBannedAt: new Date(), shadowBanReason: reason ?? null, isActive: false, updatedAt: new Date() }
        : { shadowBannedAt: null, shadowBanReason: null, isActive: true, updatedAt: new Date() },
      select: { id: true, authId: true, isActive: true, shadowBannedAt: true, shadowBanReason: true },
    });

    if (banned) {
      triggerArtistUnindex(updated.id);
    } else {
      triggerArtistReindex(updated.id);
    }

    res.json({ ok: true, ...updated });
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
