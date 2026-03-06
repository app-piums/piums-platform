import { Router } from "express";
import { reviewController } from "../controller/review.controller";
import { authenticateToken, optionalAuth } from "../middleware/auth.middleware";
import {
  createReviewLimiter,
  responseReviewLimiter,
  reportReviewLimiter,
  markHelpfulLimiter,
} from "../middleware/rateLimiter";

const router = Router();

// ==================== REVIEWS ====================

// Crear reseña (requiere autenticación)
router.post(
  "/reviews",
  authenticateToken,
  createReviewLimiter,
  reviewController.createReview.bind(reviewController)
);

// Obtener reseña por ID (público)
router.get(
  "/reviews/:id",
  reviewController.getReviewById.bind(reviewController)
);

// Listar reseñas con filtros (público)
router.get(
  "/reviews",
  reviewController.getReviews.bind(reviewController)
);

// Actualizar reseña (requiere autenticación)
router.patch(
  "/reviews/:id",
  authenticateToken,
  reviewController.updateReview.bind(reviewController)
);

// Eliminar reseña (requiere autenticación)
router.delete(
  "/reviews/:id",
  authenticateToken,
  reviewController.deleteReview.bind(reviewController)
);

// ==================== RESPONSES ====================

// Responder a reseña (artistas)
router.post(
  "/reviews/:id/respond",
  authenticateToken,
  responseReviewLimiter,
  reviewController.respondToReview.bind(reviewController)
);

// Actualizar respuesta
router.patch(
  "/responses/:id",
  authenticateToken,
  reviewController.updateResponse.bind(reviewController)
);

// Eliminar respuesta
router.delete(
  "/responses/:id",
  authenticateToken,
  reviewController.deleteResponse.bind(reviewController)
);

// ==================== HELPFUL VOTES ====================

// Marcar reseña como útil/no útil
router.post(
  "/reviews/:id/helpful",
  authenticateToken,
  markHelpfulLimiter,
  reviewController.markHelpful.bind(reviewController)
);

// ==================== REPORTS ====================

// Reportar reseña
router.post(
  "/reviews/:id/report",
  authenticateToken,
  reportReviewLimiter,
  reviewController.reportReview.bind(reviewController)
);

// Obtener reportes pendientes (admin)
router.get(
  "/reports/pending",
  authenticateToken,
  reviewController.getPendingReports.bind(reviewController)
);

// ==================== ARTIST RATINGS ====================

// Obtener estadísticas de artista (público)
router.get(
  "/artists/:artistId/rating",
  reviewController.getArtistRating.bind(reviewController)
);

// Recalcular estadísticas de artista (admin/internal)
router.post(
  "/artists/:artistId/rating/update",
  authenticateToken,
  reviewController.updateArtistRating.bind(reviewController)
);

export default router;
