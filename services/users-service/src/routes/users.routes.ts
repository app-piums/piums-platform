import { Router, RequestHandler } from "express";
import prisma from "../lib/prisma";
import { cloudinaryProvider } from "../providers/cloudinary.provider";
import {
  createUser,
  getUserProfile,
  getMyProfile,
  updateUserProfile,
  deleteUserAccount,
  addAddress,
  updateAddress,
  deleteAddress,
} from "../controller/users.controller";
import { uploadAvatar, deleteAvatar } from "../controller/avatar.controller";
import { uploadDocument, deleteDocument } from "../controller/document.controller";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controller/notificationSettings.controller";
import { authenticateToken, authorizeOwner, requireActiveSession } from "../middleware/auth.middleware";
import { updateLimiter, deleteLimiter } from "../middleware/rateLimiter";
import { upload, handleMulterError, verifyMagicBytes } from "../middleware/upload.middleware";

const router: Router = Router();

// Rutas públicas/internas
router.post("/", createUser); // Solo para uso interno

// Internal endpoint: get user by authId (called from other services)
router.get("/internal/by-auth/:authId", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { authId } = req.params;
    const user = await prisma.user.findUnique({ where: { authId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, authId: user.authId, email: user.email, nombre: user.nombre, fullName: user.nombre, avatar: user.avatar });
  } catch (error) {
    next(error);
  }
});

// Internal endpoint: sync avatar from auth-service after Google login
router.patch("/internal/by-auth/:authId/avatar", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { authId } = req.params;
    const { avatar } = req.body;
    if (!avatar) return res.status(400).json({ error: 'avatar required' });
    const user = await prisma.user.findUnique({ where: { authId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.avatar === avatar) return res.json({ synced: false });
    await prisma.user.update({ where: { authId }, data: { avatar } });
    res.json({ synced: true });
  } catch (error) {
    next(error);
  }
});

// Internal endpoint: delete a user profile by authId (called from auth-service admin)
router.delete("/internal/by-auth/:authId", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { authId } = req.params;
    const existing = await prisma.user.findUnique({
      where: { authId },
      include: { profile: { select: { avatar: true, coverPhoto: true } } },
    });
    if (!existing) return res.json({ ok: true, deleted: false });

    // Best-effort Cloudinary cleanup before marking as deleted
    const cleanupUrls = [
      existing.avatar,
      (existing as any).profile?.avatar,
      (existing as any).profile?.coverPhoto,
    ].filter(Boolean) as string[];
    await Promise.allSettled(cleanupUrls.map(url => cloudinaryProvider.deleteAvatar(url)));

    // Soft delete + anonymize PII inline (GDPR erasure)
    await prisma.user.update({
      where: { authId },
      data: {
        deletedAt: new Date(),
        email: `deleted_${existing.id}@purged.invalid`,
        nombre: 'Usuario Eliminado',
        avatar: null,
        bio: null,
        telefono: null,
      },
    });
    res.json({ ok: true, deleted: true });
  } catch (error) {
    next(error);
  }
});

// Internal endpoint: generate signed URLs for private Cloudinary documents
router.post("/internal/cloudinary-sign", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const urls: string[] = Array.isArray(req.body.urls) ? req.body.urls : [];
    const signed = urls.reduce((acc, url) => {
      if (typeof url === 'string' && url.startsWith('https://')) {
        acc[url] = cloudinaryProvider.getSignedDocumentUrl(url);
      }
      return acc;
    }, {} as Record<string, string>);
    res.json({ signed });
  } catch (error) {
    next(error);
  }
});

// Internal endpoint: purge arbitrary Cloudinary URLs (for KYC docs deleted by admin)
router.post("/internal/cloudinary-purge", async (req, res, next) => {
  try {
    const internalSecret = process.env.INTERNAL_SERVICE_SECRET;
    const providedSecret = req.headers['x-internal-secret'];
    if (!internalSecret || providedSecret !== internalSecret) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const urls: string[] = Array.isArray(req.body.urls) ? req.body.urls : [];
    const docUrls = urls.filter((u): u is string => typeof u === 'string' && u.startsWith('https://'));
    await Promise.allSettled(docUrls.map(url => cloudinaryProvider.deleteDocument(url)));
    res.json({ ok: true, purged: docUrls.length });
  } catch (error) {
    next(error);
  }
});

// Subida de documentos de identidad (requiere auth)
// Cast necesario: @types/multer usa @types/express v4 y este servicio v5.
// Incompatibilidad solo de definiciones de tipos; compatible en runtime.
router.post("/documents/upload", authenticateToken, requireActiveSession, upload.single('file') as unknown as RequestHandler, handleMulterError, verifyMagicBytes, uploadDocument);
// Eliminación de documento propio (requiere auth)
router.delete("/me/documents", authenticateToken, requireActiveSession, deleteDocument);

// Rutas protegidas
router.get("/me", authenticateToken, getMyProfile);
router.get("/:id", authenticateToken, getUserProfile);
router.put("/:id", authenticateToken, requireActiveSession, authorizeOwner, updateLimiter as any, updateUserProfile);
router.delete("/:id", authenticateToken, requireActiveSession, authorizeOwner, deleteLimiter as any, deleteUserAccount);

// Avatar
router.post("/me/avatar", authenticateToken, requireActiveSession, upload.single('avatar') as unknown as RequestHandler, handleMulterError, verifyMagicBytes, uploadAvatar);
router.delete("/me/avatar", authenticateToken, requireActiveSession, deleteAvatar);

// Notification Settings
router.get("/me/notifications-settings", authenticateToken, getNotificationSettings);
router.put("/me/notifications-settings", authenticateToken, requireActiveSession, updateLimiter as any, updateNotificationSettings);

// Direcciones
router.post("/:id/addresses", authenticateToken, requireActiveSession, authorizeOwner, addAddress);
router.put("/:id/addresses/:addressId", authenticateToken, requireActiveSession, authorizeOwner, updateAddress);
router.delete("/:id/addresses/:addressId", authenticateToken, requireActiveSession, authorizeOwner, deleteAddress);

export default router;
