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
import { authenticateToken, authorizeOwner } from "../middleware/auth.middleware";
import { updateLimiter, deleteLimiter } from "../middleware/rateLimiter";

const router = Router();

// Rutas públicas/internas
router.post("/", createUser); // Solo para uso interno

// Rutas protegidas
router.get("/me", authenticateToken, getMyProfile);
router.get("/:id", authenticateToken, getUserProfile);
router.put("/:id", authenticateToken, authorizeOwner, updateLimiter as any, updateUserProfile);
router.delete("/:id", authenticateToken, authorizeOwner, deleteLimiter as any, deleteUserAccount);

// Direcciones
router.post("/:id/addresses", authenticateToken, authorizeOwner, addAddress);
router.put("/:id/addresses/:addressId", authenticateToken, authorizeOwner, updateAddress);
router.delete("/:id/addresses/:addressId", authenticateToken, authorizeOwner, deleteAddress);

export default router;
