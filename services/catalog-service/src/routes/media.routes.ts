import { Router } from "express";
import { mediaController } from "../controller/media.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router: Router = Router();

// ==================== MEDIA ASSETS ====================

/**
 * POST /api/media
 * Crear un nuevo media asset
 */
router.post(
  "/media",
  authenticateToken,
  mediaController.createMedia.bind(mediaController)
);

/**
 * GET /api/media/:id
 * Obtener media por ID
 */
router.get(
  "/media/:id",
  mediaController.getMediaById.bind(mediaController)
);

/**
 * GET /api/media/:entityType/:entityId
 * Listar media de una entidad
 */
router.get(
  "/media/:entityType/:entityId",
  mediaController.listMediaByEntity.bind(mediaController)
);

/**
 * PATCH /api/media/:id
 * Actualizar media asset
 */
router.patch(
  "/media/:id",
  authenticateToken,
  mediaController.updateMedia.bind(mediaController)
);

/**
 * DELETE /api/media/:id
 * Eliminar media asset
 */
router.delete(
  "/media/:id",
  authenticateToken,
  mediaController.deleteMedia.bind(mediaController)
);

/**
 * POST /api/media/:entityType/:entityId/reorder
 * Reordenar media assets
 */
router.post(
  "/media/:entityType/:entityId/reorder",
  authenticateToken,
  mediaController.reorderMedia.bind(mediaController)
);

/**
 * POST /api/media/:id/featured
 * Marcar/desmarcar como destacado
 */
router.post(
  "/media/:id/featured",
  authenticateToken,
  mediaController.setFeatured.bind(mediaController)
);

/**
 * GET /api/media/:entityType/:entityId/stats
 * Obtener estadísticas de media
 */
router.get(
  "/media/:entityType/:entityId/stats",
  authenticateToken,
  mediaController.getMediaStats.bind(mediaController)
);

/**
 * POST /api/media/bulk-delete
 * Eliminar múltiples media assets
 */
router.post(
  "/media/bulk-delete",
  authenticateToken,
  mediaController.bulkDeleteMedia.bind(mediaController)
);

export default router;
