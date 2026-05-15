import { Router } from "express";
import { PrismaClient } from "@prisma/client";
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
import { authenticateToken, authorizeOwner } from "../middleware/auth.middleware";
import { updateLimiter, deleteLimiter } from "../middleware/rateLimiter";
import { upload, handleMulterError, verifyMagicBytes } from "../middleware/upload.middleware";

const router = Router();

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
    const prisma = new PrismaClient();
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
    const prisma = new PrismaClient();
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
    const prisma = new PrismaClient();
    const existing = await prisma.user.findUnique({ where: { authId } });
    if (!existing) return res.json({ ok: true, deleted: false });
    await prisma.user.delete({ where: { authId } });
    res.json({ ok: true, deleted: true });
  } catch (error) {
    next(error);
  }
});

// Subida de documentos de identidad (sin auth – se usa durante el registro)
router.post("/documents/upload", upload.single('file'), handleMulterError, uploadDocument);
// Eliminación de documento propio (requiere auth)
router.delete("/me/documents", authenticateToken, deleteDocument);

// Rutas protegidas
router.get("/me", authenticateToken, getMyProfile);
router.get("/:id", authenticateToken, getUserProfile);
router.put("/:id", authenticateToken, authorizeOwner, updateLimiter as any, updateUserProfile);
router.delete("/:id", authenticateToken, authorizeOwner, deleteLimiter as any, deleteUserAccount);

// Avatar
router.post("/me/avatar", authenticateToken, upload.single('avatar'), handleMulterError, verifyMagicBytes, uploadAvatar);
router.delete("/me/avatar", authenticateToken, deleteAvatar);

// Notification Settings
router.get("/me/notifications-settings", authenticateToken, getNotificationSettings);
router.put("/me/notifications-settings", authenticateToken, updateLimiter as any, updateNotificationSettings);

// Direcciones
router.post("/:id/addresses", authenticateToken, authorizeOwner, addAddress);
router.put("/:id/addresses/:addressId", authenticateToken, authorizeOwner, updateAddress);
router.delete("/:id/addresses/:addressId", authenticateToken, authorizeOwner, deleteAddress);

export default router;
