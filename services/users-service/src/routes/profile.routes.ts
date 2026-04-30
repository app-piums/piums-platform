import { Router } from "express";
import {
  createProfile,
  getMyProfile,
  getProfileBySlug,
  updateMyProfile,
  uploadCoverPhoto,
  deleteCoverPhoto,
  checkSlugAvailability,
  uploadPortfolioImage,
} from "../controller/profile.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { updateLimiter } from "../middleware/rateLimiter";
import { upload, handleMulterError, verifyMagicBytes } from "../middleware/upload.middleware";

const router = Router();

// Verificar disponibilidad de slug (puede ser sin auth para UI pre-registro)
router.get("/check-slug/:slug", checkSlugAvailability);

// Perfil público por slug
router.get("/:slug", getProfileBySlug);

// Perfil propio
router.post("/", authenticateToken, createProfile);
router.get("/", authenticateToken, getMyProfile);
router.put("/", authenticateToken, updateLimiter as any, updateMyProfile);

// Foto de portada
router.post(
  "/cover",
  authenticateToken,
  upload.single("cover"),
  handleMulterError,
  verifyMagicBytes,
  uploadCoverPhoto
);
router.delete("/cover", authenticateToken, deleteCoverPhoto);

// Portfolio image upload (returns Cloudinary URL, does not write to DB)
router.post(
  "/portfolio-upload",
  authenticateToken,
  upload.single("image"),
  handleMulterError,
  verifyMagicBytes,
  uploadPortfolioImage
);

export default router;
