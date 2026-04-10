import { Router } from "express";
import {
  listFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "../controller/favorite.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get("/", listFavorites);                // GET  /api/users/me/favorites
router.post("/", apiLimiter as any, addFavorite);    // POST /api/users/me/favorites
router.get("/check", checkFavorite);           // GET  /api/users/me/favorites/check?entityType=ARTIST&entityId=...
router.delete("/:id", removeFavorite);         // DELETE /api/users/me/favorites/:id

export default router;
