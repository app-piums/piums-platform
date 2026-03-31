import { Router } from "express";
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
import { uploadDocument } from "../controller/document.controller";
import {
  getNotificationSettings,
  updateNotificationSettings,
} from "../controller/notificationSettings.controller";
import { authenticateToken, authorizeOwner } from "../middleware/auth.middleware";
import { updateLimiter, deleteLimiter } from "../middleware/rateLimiter";
import { upload, handleMulterError } from "../middleware/upload.middleware";

const router = Router();

// Rutas públicas/internas
router.post("/", createUser); // Solo para uso interno

// Subida de documentos de identidad (sin auth – se usa durante el registro)
router.post("/documents/upload", upload.single('file'), handleMulterError, uploadDocument);

// Rutas protegidas
router.get("/me", authenticateToken, getMyProfile);
router.get("/:id", authenticateToken, getUserProfile);
router.put("/:id", authenticateToken, authorizeOwner, updateLimiter as any, updateUserProfile);
router.delete("/:id", authenticateToken, authorizeOwner, deleteLimiter as any, deleteUserAccount);

// Avatar
router.post("/me/avatar", authenticateToken, upload.single('avatar'), handleMulterError, uploadAvatar);
router.delete("/me/avatar", authenticateToken, deleteAvatar);

// Notification Settings
router.get("/me/notifications-settings", authenticateToken, getNotificationSettings);
router.put("/me/notifications-settings", authenticateToken, updateLimiter as any, updateNotificationSettings);

// Direcciones
router.post("/:id/addresses", authenticateToken, authorizeOwner, addAddress);
router.put("/:id/addresses/:addressId", authenticateToken, authorizeOwner, updateAddress);
router.delete("/:id/addresses/:addressId", authenticateToken, authorizeOwner, deleteAddress);

export default router;
